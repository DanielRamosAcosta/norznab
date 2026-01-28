export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}

export function filterEmpty<T>(array: Array<T | null | undefined>): T[] {
  return array.filter(notEmpty);
}
