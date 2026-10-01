import { supabase } from '../supabaseClient.js';
import { HashMap } from '../dsa/HashMap.js';
import { Queue } from '../dsa/Queue.js';
import { Stack } from '../dsa/Stack.js';
import { MinHeap } from '../dsa/MinHeap.js';
import { LinkedList } from '../dsa/LinkedList.js';
import { mergeSort, quickSort } from '../algorithms/sorting.js';
import { binarySearchAll, linearSearch } from '../algorithms/searching.js';
import { ApiError } from '../utils/ApiError.js';
import { validateVisitor } from '../utils/validators.js';

/** Lower number = served first. VIP, Senior and PWD use the priority heap. */
const PRIORITY = { VIP: 0, Senior: 1, PWD: 1, Student: 2, Regular: 3 };
const isPriorityLane = (type) => PRIORITY[type] <= 1;
const SORT_FIELDS = ['full_name', 'age', 'group_size', 'visitor_type', 'visit_date', 'created_at'];
const MAX_LOGS = 100;

const must = ({ data, error }) => {
  if (error) throw new ApiError(500, error.message);
  return data;
};

function sortKey(v, field) {
  switch (field) {
    case 'full_name': return v.full_name.toLowerCase();
    case 'age':
    case 'group_size': return Number(v[field]);
    case 'visitor_type': return PRIORITY[v.visitor_type];
    default: return Date.parse(v[field]) || 0; // visit_date, created_at
  }
}

function makeComparator(field, order) {
  const dir = order === 'desc' ? -1 : 1;
  return (a, b) => {
    const x = sortKey(a, field), y = sortKey(b, field);
    const r = typeof x === 'number' ? x - y : x.localeCompare(y);
    return r * dir;
  };
}

class VisitorStore {
  constructor() {
    this.visitors = [];                                  // array (sorting / searching)
    this.byTicket = new HashMap();                       // DS: HashMap
    this.byId = new HashMap();                           // DS: HashMap
    this.regularQueue = new Queue();                     // DS: Queue
    this.priorityHeap = this._newHeap();                 // DS: Min-Heap
    this.undoStack = new Stack(20);                      // DS: Stack
    this.logs = new LinkedList();                        // DS: Linked List
  }

  _newHeap() {
    return new MinHeap((a, b) => a.rank - b.rank || a.seq - b.seq);
  }

  /* ---------- load / rebuild ---------- */
  async init() {
    const logRows = must(await supabase.from('visit_logs').select('*')
      .order('created_at', { ascending: true }).limit(MAX_LOGS));
    for (const row of logRows) this.logs.prepend(row); // oldest first -> newest ends at head
    await this.reload();
  }

  async reload() {
    this.visitors = must(await supabase.from('visitors').select('*').limit(5000));

    this.byTicket = new HashMap();
    this.byId = new HashMap();
    this.regularQueue = new Queue();
    this.priorityHeap = this._newHeap();

    for (const v of this.visitors) {
      this.byTicket.set(v.ticket_code, v);
      this.byId.set(v.id, v);
    }

    // Rebuild waiting lines in arrival order from persistent data
    const queued = mergeSort(
      linearSearch(this.visitors, (v) => v.status === 'Queued'),
      (a, b) => Date.parse(a.queued_at) - Date.parse(b.queued_at),
    );
    for (const v of queued) {
      if (isPriorityLane(v.visitor_type)) {
        this.priorityHeap.push({ rank: PRIORITY[v.visitor_type], seq: Date.parse(v.queued_at), visitor: v });
      } else {
        this.regularQueue.enqueue(v);
      }
    }
  }

  async _log(action, v) {
    const entry = {
      id: crypto.randomUUID(),
      action,
      visitor_name: v.full_name,
      ticket_code: v.ticket_code,
      created_at: new Date().toISOString(),
    };
    this.logs.prepend(entry);
    this.logs.trim(MAX_LOGS);
    const { error } = await supabase.from('visit_logs').insert(entry);
    if (error) console.error('Log insert failed:', error.message);
  }

  _get(id) {
    const v = this.byId.get(id);
    if (!v) throw new ApiError(404, 'Visitor not found.');
    return v;
  }

  /* ---------- READ: search + sort ---------- */
  list({ q = '', exact = 'false', type = '', status = '', sortBy = 'created_at', order = 'desc', algo = 'merge' } = {}) {
    const t0 = performance.now();
    let result = this.visitors;
    let searchAlgo = 'none';

    if (type) result = linearSearch(result, (v) => v.visitor_type === type);
    if (status) result = linearSearch(result, (v) => v.status === status);

    const needle = String(q).trim().toLowerCase();
    if (needle) {
      if (exact === 'true') {
        const byName = mergeSort(result, makeComparator('full_name', 'asc'));
        result = binarySearchAll(byName, needle, (v) => v.full_name.toLowerCase());
        searchAlgo = 'Binary Search (exact name)';
      } else {
        result = linearSearch(result, (v) =>
          v.full_name.toLowerCase().includes(needle) ||
          v.email.toLowerCase().includes(needle) ||
          v.ticket_code.toLowerCase().includes(needle));
        searchAlgo = 'Linear Search (contains)';
      }
    }

    const field = SORT_FIELDS.includes(sortBy) ? sortBy : 'created_at';
    const cmp = makeComparator(field, order);
    const sorter = algo === 'quick' ? quickSort : mergeSort;
    const data = sorter(result, cmp);

    return {
      data,
      meta: {
        total: this.visitors.length,
        count: data.length,
        sortAlgorithm: algo === 'quick' ? 'Quick Sort' : 'Merge Sort',
        searchAlgorithm: searchAlgo,
        ms: Number((performance.now() - t0).toFixed(2)),
      },
    };
  }

  /** HashMap lookup - O(1) average. */
  getByTicket(code) {
    const v = this.byTicket.get(String(code).trim().toUpperCase());
    if (!v) throw new ApiError(404, 'No visitor found for that ticket code.');
    return v;
  }

  /* ---------- CREATE ---------- */
  _newTicketCode() {
    let code;
    do {
      code = `MVM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    } while (this.byTicket.has(code));
    return code;
  }

  _assertNotDuplicate(clean, ignoreId = null) {
    const dup = linearSearch(this.visitors, (v) =>
      v.id !== ignoreId && v.email === clean.email && v.visit_date === clean.visit_date);
    if (dup.length) throw new ApiError(409, 'This email is already registered for that visit date.', { email: 'Already registered for this date.' });
  }

  async create(input) {
    const clean = validateVisitor(input);
    this._assertNotDuplicate(clean);
    const row = must(await supabase.from('visitors')
      .insert({ ...clean, ticket_code: this._newTicketCode() }).select().single());
    await this.reload();
    await this._log('REGISTERED', row);
    return row;
  }

  /* ---------- UPDATE ---------- */
  async update(id, input) {
    const existing = this._get(id);
    const clean = validateVisitor(input, { allowPastDate: true });
    this._assertNotDuplicate(clean, id);
    const row = must(await supabase.from('visitors').update(clean).eq('id', id).select().single());
    await this.reload();
    await this._log('UPDATED', { ...existing, ...row });
    return row;
  }

  /* ---------- DELETE (+ undo via Stack) ---------- */
  async remove(id) {
    const v = this._get(id);
    must(await supabase.from('visitors').delete().eq('id', id).select());
    this.undoStack.push(v);
    await this.reload();
    await this._log('DELETED', v);
    return { deleted: v, undoAvailable: this.undoStack.size };
  }

  async undoDelete() {
    const v = this.undoStack.pop();
    if (!v) throw new ApiError(404, 'Nothing to undo.');
    const row = must(await supabase.from('visitors').insert(v).select().single());
    await this.reload();
    await this._log('RESTORED', row);
    return { restored: row, undoAvailable: this.undoStack.size };
  }

  /* ---------- QUEUE ---------- */
  async enqueue(id) {
    const v = this._get(id);
    if (v.status !== 'Registered') throw new ApiError(409, `Visitor is already ${v.status}.`);
    must(await supabase.from('visitors')
      .update({ status: 'Queued', queued_at: new Date().toISOString() }).eq('id', id).select());
    await this.reload();
    await this._log('QUEUED', v);
    return this.queueView();
  }

  async callNext() {
    // Priority lane first (heap), otherwise the regular FIFO queue
    const next = !this.priorityHeap.isEmpty()
      ? this.priorityHeap.pop().visitor
      : this.regularQueue.dequeue();
    if (!next) throw new ApiError(404, 'The waiting line is empty.');

    const row = must(await supabase.from('visitors')
      .update({ status: 'Checked-in', checkin_time: new Date().toISOString() })
      .eq('id', next.id).select().single());
    await this.reload();
    await this._log('CHECKED-IN', row);
    return row;
  }

  async checkout(id) {
    const v = this._get(id);
    if (v.status !== 'Checked-in') throw new ApiError(409, 'Only checked-in visitors can check out.');
    const row = must(await supabase.from('visitors')
      .update({ status: 'Checked-out', checkout_time: new Date().toISOString() })
      .eq('id', id).select().single());
    await this.reload();
    await this._log('CHECKED-OUT', row);
    return row;
  }

  queueView() {
    const priority = this.priorityHeap.toSortedArray().map((e) => e.visitor);
    const regular = this.regularQueue.toArray();
    return { priority, regular, serveOrder: [...priority, ...regular] };
  }

  /* ---------- STATS / LOGS ---------- */
  stats() {
    const typeCount = new HashMap();
    const statusCount = new HashMap();
    let peopleInside = 0;
    for (const v of this.visitors) {
      typeCount.set(v.visitor_type, (typeCount.get(v.visitor_type) || 0) + 1);
      statusCount.set(v.status, (statusCount.get(v.status) || 0) + 1);
      if (v.status === 'Checked-in') peopleInside += v.group_size;
    }
    return {
      totalVisitors: this.visitors.length,
      peopleInside,
      waiting: this.priorityHeap.size + this.regularQueue.size,
      undoAvailable: this.undoStack.size,
      byType: Object.fromEntries(typeCount.entries()),
      byStatus: Object.fromEntries(statusCount.entries()),
    };
  }

  getLogs() { return this.logs.toArray(); }
}

export const store = new VisitorStore();
