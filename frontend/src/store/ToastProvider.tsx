import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

/* ── Types ──────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

/* ── Context ────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/* ── Toast UI ───────────────────────────────────────────── */

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

const STYLES: Record<ToastType, string> = {
  success: 'border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]',
  error: 'border-red-400/20 bg-red-500/10 text-red-400',
  info: 'border-[#1D8CF8]/20 bg-[#1D8CF8]/10 text-[#1D8CF8]',
}

function ToastSlot({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div
      className={[
        'pointer-events-auto flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md',
        'animate-[slideUp_0.3s_ease]',
        STYLES[toast.type],
      ].join(' ')}
    >
      <span className="text-base leading-none">{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

/* ── Provider ───────────────────────────────────────────── */

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-4), { id, type, message }]) // keep max 5
  }, [])

  const value: ToastContextValue = {
    success: useCallback((msg: string) => push('success', msg), [push]),
    error: useCallback((msg: string) => push('error', msg), [push]),
    info: useCallback((msg: string) => push('info', msg), [push]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastSlot key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
