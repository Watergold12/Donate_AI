import type { ReactNode } from 'react'

interface AuthLayoutProps { children: ReactNode; title: string; subtitle?: string }

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-da-bg px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/[0.08] bg-da-card p-8">
          <h1 className="mb-1 text-xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mb-6 text-sm text-da-secondary">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
