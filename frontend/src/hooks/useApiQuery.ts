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

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetcher()
      .then(result => setData(result))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [fetcher])

  useEffect(() => {
    let isMounted = true

    void fetcher()
      .then(result => {
        if (isMounted) setData(result)
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
          setError(msg)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch }
}
