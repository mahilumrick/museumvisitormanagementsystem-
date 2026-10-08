class Node {
  constructor(value) { this.value = value; this.next = null; }
}

export class LinkedList {
  constructor() { this.head = null; this.tail = null; this.length = 0; }

  prepend(value) {
    const node = new Node(value);
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.length++;
  }

  append(value) {
    const node = new Node(value);
    if (this.tail) this.tail.next = node; else this.head = node;
    this.tail = node;
    this.length++;
  }

  trim(max) {
    if (max < 1 || this.length <= max) return;
    let cur = this.head;
    for (let i = 1; i < max; i++) cur = cur.next;
    cur.next = null;
    this.tail = cur;
    this.length = max;
  }

  toArray() {
    const out = [];
    for (let n = this.head; n; n = n.next) out.push(n.value);
    return out;
  }
}
