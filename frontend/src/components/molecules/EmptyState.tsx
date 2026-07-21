import type { ReactNode } from 'react'

interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-da-border py-16">
      {icon && <div className="text-da-muted">{icon}</div>}
      <div className="text-center">
        <p className="font-semibold text-da-text">{title}</p>
        {description && <p className="mt-1 text-sm text-da-secondary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
