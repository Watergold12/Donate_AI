import type { ReactNode } from 'react'
import { cn } from '../../utils/index'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps { variant?: BadgeVariant; children: ReactNode; className?: string }

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-da-secondary',
  success: 'bg-da-success/20 text-da-success',
  warning: 'bg-amber-500/20 text-amber-400',
  danger:  'bg-da-danger/20 text-da-danger',
  info:    'bg-da-primary/20 text-da-primary',
  purple:  'bg-purple-500/20 text-purple-400',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant], className
    )}>
      {children}
    </span>
  )
}
