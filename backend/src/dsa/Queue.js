class Node {
  constructor(value) { this.value = value; this.next = null; }
}

export class Queue {
  constructor() { this.head = null; this.tail = null; this.size = 0; }

  enqueue(value) {
    const node = new Node(value);
    if (this.tail) this.tail.next = node; else this.head = node;
    this.tail = node;
    this.size++;
  }

  dequeue() {
    if (!this.head) return null;
    const { value } = this.head;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.size--;
    return value;
  }

  peek() { return this.head ? this.head.value : null; }
  isEmpty() { return this.size === 0; }

  toArray() {
    const out = [];
    for (let n = this.head; n; n = n.next) out.push(n.value);
    return out;
  }
}
