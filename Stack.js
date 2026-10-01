/**
 * DATA STRUCTURE #3: Stack (LIFO).
 * Used for: UNDO of deleted visitors (last deleted is restored first).
 */
export class Stack {
  constructor(maxSize = 20) { this.items = []; this.maxSize = maxSize; }

  push(item) {
    if (this.items.length >= this.maxSize) this.items.shift(); // drop the oldest
    this.items.push(item);
  }

  pop() { return this.items.length ? this.items.pop() : null; }
  peek() { return this.items.length ? this.items[this.items.length - 1] : null; }
  get size() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
}
