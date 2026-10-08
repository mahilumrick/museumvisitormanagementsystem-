
export function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // hash * 33 + c
  }
  return hash;
}

export class HashMap {
  constructor(capacity = 16) {
    this.buckets = Array.from({ length: capacity }, () => []);
    this.size = 0;
  }

  _index(key, len = this.buckets.length) {
    return djb2(String(key)) % len;
  }

  set(key, value) {
    const bucket = this.buckets[this._index(key)];
    for (const entry of bucket) {
      if (entry.key === key) { entry.value = value; return this; }
    }
    bucket.push({ key, value });
    this.size++;
    if (this.size / this.buckets.length > 0.75) this._resize();
    return this;
  }

  get(key) {
    for (const entry of this.buckets[this._index(key)]) {
      if (entry.key === key) return entry.value;
    }
    return undefined;
  }

  has(key) { return this.get(key) !== undefined; }

  delete(key) {
    const bucket = this.buckets[this._index(key)];
    const i = bucket.findIndex((e) => e.key === key);
    if (i === -1) return false;
    bucket.splice(i, 1);
    this.size--;
    return true;
  }

  entries() {
    const out = [];
    for (const bucket of this.buckets) for (const e of bucket) out.push([e.key, e.value]);
    return out;
  }

  _resize() {
    const newLen = this.buckets.length * 2;
    const next = Array.from({ length: newLen }, () => []);
    for (const bucket of this.buckets) {
      for (const e of bucket) next[this._index(e.key, newLen)].push(e);
    }
    this.buckets = next;
  }
}
