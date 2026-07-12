import type { ReactNode } from 'react'

interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
      {icon && <div className="text-gray-400 dark:text-gray-600">{icon}</div>}
      <div className="text-center">
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
