import { useState, forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/index'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const [show, setShow] = useState(false)
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-da-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            className={cn(
              'h-10 w-full rounded-lg border border-white/10 bg-[#0B0F14] px-3 pr-10 text-sm text-white',
              'placeholder:text-da-muted',
              'focus:border-da-primary focus:outline-none focus:ring-2 focus:ring-da-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-40',
              error && 'border-da-danger focus:border-da-danger focus:ring-da-danger/20',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6B7280] hover:text-[#A1A8B3] transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-da-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-da-muted">{hint}</p>}
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
