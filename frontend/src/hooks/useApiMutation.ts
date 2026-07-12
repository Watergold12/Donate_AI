import { useState } from 'react'

export interface MutationState<T> {
  mutate: (payload: T) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useApiMutation<TPayload, TResult>(
  mutator: (payload: TPayload) => Promise<TResult>,
  onSuccess?: (result: TResult) => void,
): MutationState<TPayload> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (payload: TPayload): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutator(payload)
      onSuccess?.(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error, clearError: () => setError(null) }
}
