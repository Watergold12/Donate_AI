import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../utils/index'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-da-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 text-sm text-white',
            'placeholder:text-da-muted',
            'focus:border-da-primary focus:outline-none focus:ring-2 focus:ring-da-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-da-danger focus:border-da-danger focus:ring-da-danger/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-da-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-da-muted">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
