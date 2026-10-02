/**
 * A queue that runs tasks one at a time, leaving at least `minIntervalMs` between
 * the start of two tasks. Used so that adding 10 items at once doesn't fire
 * 10 simultaneous requests at Open Food Facts (they limit and block abusive clients).
 */
export function createRateLimiter(minIntervalMs: number) {
  let queue: Promise<unknown> = Promise.resolve()
  let lastStart = -Infinity

  return function schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = async () => {
      const wait = lastStart + minIntervalMs - Date.now()
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      lastStart = Date.now()
      return task()
    }
    // Chain after the previous task, whether it succeeded or failed.
    const result = queue.then(run, run)
    queue = result.catch(() => undefined)
    return result
  }
}
