import type { ReactNode } from 'react'
import { cn } from '../../utils/index'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-white/[0.08] bg-da-card p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-da-secondary">{title}</p>
        {icon && <div className="text-da-muted">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {trend && (
        <p className={cn('mt-1 text-xs font-medium', trend.value >= 0 ? 'text-da-success' : 'text-da-danger')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
