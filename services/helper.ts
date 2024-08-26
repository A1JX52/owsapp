export const getMinMax = (arr: number[]): { min: number; max: number } => {
  let len = arr.length;
  let min = Infinity;
  let max = -Infinity;

  while (len--) {
    const current = arr[len];
    if (current > max) max = current;
    if (current < min) min = current;
  }
  return { min, max };
}