import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import VisitorForm from './VisitorForm.jsx';

const TYPES = ['', 'VIP', 'Senior', 'PWD', 'Student', 'Regular'];
const STATUSES = ['', 'Registered', 'Queued', 'Checked-in', 'Checked-out'];
const SORTS = [
  ['created_at', 'Date registered'], ['full_name', 'Name'], ['age', 'Age'],
  ['group_size', 'Group size'], ['visitor_type', 'Type (priority)'], ['visit_date', 'Visit date'],
];

export default function Visitors({ notify, refresh, version }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [exact, setExact] = useState(false);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [algo, setAlgo] = useState('merge');
  const [form, setForm] = useState(null); // null | 'new' | visitor object

  const load = useCallback(async () => {
    try {
      const res = await api.listVisitors({ q, exact: exact ? 'true' : '', type, status, sortBy, order, algo });
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      notify(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [q, exact, type, status, sortBy, order, algo, notify]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce typing in the search box
    return () => clearTimeout(t);
  }, [load, version]);

  async function save(payload) {
    if (form === 'new') {
      const v = await api.createVisitor(payload);
      notify(`Registered ${v.full_name}. Ticket ${v.ticket_code}`);
    } else {
      await api.updateVisitor(form.id, payload);
      notify('Visitor updated.');
    }
    setForm(null);
    refresh();
  }

  async function remove(v) {
    if (!window.confirm(`Delete ${v.full_name}? You can undo this afterwards.`)) return;
    try { await api.deleteVisitor(v.id); notify('Deleted. Tap "Undo delete" to restore.'); refresh(); }
    catch (e) { notify(e.message, 'err'); }
  }

  async function act(fn, okMsg) {
    try { await fn(); notify(okMsg); refresh(); } catch (e) { notify(e.message, 'err'); }
  }

  return (
    <section>
      <div className="toolbar">
        <input className="search" placeholder="Search name, email or ticket…" value={q}
          onChange={(e) => setQ(e.target.value)} />
        <label className="check"><input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} /> Exact name</label>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map((t) => <option key={t} value={t}>{t || 'All statuses'}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
          {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
        </select>
        <button className="btn ghost" onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
          {order === 'asc' ? 'Ascending' : 'Descending'}
        </button>
        <select value={algo} onChange={(e) => setAlgo(e.target.value)} aria-label="Sorting algorithm">
          <option value="merge">Merge Sort</option>
          <option value="quick">Quick Sort</option>
        </select>
      </div>

      <div className="toolbar">
        <button className="btn primary" onClick={() => setForm('new')}>Register visitor</button>
        <button className="btn ghost" onClick={() => act(api.undoDelete, 'Last deleted visitor restored.')}>Undo delete</button>
        {meta && (
          <span className="muted meta">
            {meta.count} of {meta.total} shown · {meta.sortAlgorithm}
            {meta.searchAlgorithm !== 'none' && ` + ${meta.searchAlgorithm}`} · {meta.ms} ms
          </span>
        )}
      </div>

      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="empty">No visitors match. Register a visitor or clear the filters.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Ticket</th><th>Name</th><th>Email</th><th>Age</th><th>Type</th><th>Group</th><th>Visit date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td className="mono">{v.ticket_code}</td>
                  <td>{v.full_name}</td>
                  <td>{v.email}</td>
                  <td>{v.age}</td>
                  <td><span className={`pill t-${v.visitor_type}`}>{v.visitor_type}</span></td>
                  <td>{v.group_size}</td>
                  <td>{v.visit_date}</td>
                  <td><span className={`pill s-${v.status}`}>{v.status}</span></td>
                  <td className="row-actions">
                    {v.status === 'Registered' && <button className="link" onClick={() => act(() => api.enqueue(v.id), `${v.full_name} added to the waiting line.`)}>Add to line</button>}
                    {v.status === 'Checked-in' && <button className="link" onClick={() => act(() => api.checkout(v.id), `${v.full_name} checked out.`)}>Check out</button>}
                    <button className="link" onClick={() => setForm(v)}>Edit</button>
                    <button className="link danger" onClick={() => remove(v)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <VisitorForm initial={form === 'new' ? null : form} onSubmit={save} onCancel={() => setForm(null)} />
      )}
    </section>
  );
}
