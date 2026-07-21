import type { ReactNode } from 'react'

interface PageHeaderProps { title: string; subtitle?: string; actions?: ReactNode }

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-da-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-da-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
