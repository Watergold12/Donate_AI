import { useState, useEffect, useCallback } from 'react'

export interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    fetcher()
      .then(result => setData(result))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(msg)
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
