/**
 * Maps `items` through `fn` with at most `limit` promises in flight at once,
 * preserving input order in the result.
 *
 * Used to cap the wolfmax4k HTTP/3 fan-out: resolving every edition at once
 * stresses the QUIC layer (cold sessions stall / "All protocols failed"), so a
 * bounded concurrency keeps the burst small.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = next++;
      if (index >= items.length) {
        return;
      }
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker(),
  );
  await Promise.all(workers);

  return results;
}
