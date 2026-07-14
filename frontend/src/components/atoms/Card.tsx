import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '../../utils/index'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.08] bg-da-card',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
