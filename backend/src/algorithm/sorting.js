/**
 * ALGORITHM #1: Merge Sort  - O(n log n), stable.
 * ALGORITHM #2: Quick Sort  - O(n log n) average, in-place, middle pivot.
 * Both take a comparator cmp(a, b) -> negative | 0 | positive and return a NEW array.
 */
export function mergeSort(arr, cmp) {
  if (arr.length <= 1) return arr.slice();
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid), cmp);
  const right = mergeSort(arr.slice(mid), cmp);

  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    out.push(cmp(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}

function partition(a, lo, hi, cmp) {
  const mid = (lo + hi) >> 1;
  [a[mid], a[hi]] = [a[hi], a[mid]]; // middle element as pivot
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (cmp(a[j], pivot) < 0) {
      [a[i], a[j]] = [a[j], a[i]];
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  return i;
}

export function quickSort(arr, cmp) {
  const a = arr.slice();
  const sort = (lo, hi) => {
    while (lo < hi) {
      const p = partition(a, lo, hi, cmp);
      // recurse into the smaller half first to keep the stack shallow
      if (p - lo < hi - p) { sort(lo, p - 1); lo = p + 1; }
      else { sort(p + 1, hi); hi = p - 1; }
    }
  };
  sort(0, a.length - 1);
  return a;
         }
