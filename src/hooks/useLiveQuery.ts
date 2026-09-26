import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

/**
 * Runs a Dexie query and re-runs it automatically whenever the data it reads changes
 * (from this screen or any other). Returns undefined until the first result arrives.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: readonly unknown[] = []): T | undefined {
  const [result, setResult] = useState<{ value: T }>()

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => setResult({ value }),
      error: (error: unknown) => console.error('Database query failed', error),
    })
    return () => subscription.unsubscribe()
    // The caller controls when the query must be recreated, like useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return result?.value
}
