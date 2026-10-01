/**
 * ALGORITHM #3: Binary Search - O(log n) on a SORTED array (exact match).
 * ALGORITHM #4: Linear Search - O(n), supports any predicate (contains / filters).
 */

/** Returns every element whose key === target (array must be sorted by keyFn). */
export function binarySearchAll(sorted, target, keyFn) {
  // lower bound: first index whose key >= target
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keyFn(sorted[mid]) < target) lo = mid + 1; else hi = mid;
  }
  const out = [];
  for (let i = lo; i < sorted.length && keyFn(sorted[i]) === target; i++) out.push(sorted[i]);
  return out;
}

/** Returns every element that satisfies predicate. */
export function linearSearch(arr, predicate) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) out.push(arr[i]);
  }
  return out;
}
