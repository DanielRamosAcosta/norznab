import { setTimeout } from "node:timers/promises";

export function waitFor(
  cb: () => Promise<void>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  const attempt = async (): Promise<void> => {
    try {
      await cb();
    } catch (error) {
      if (Date.now() - startTime > timeout) {
        throw error;
      }
      await setTimeout(interval);
      return attempt();
    }
  };

  return attempt();
}
