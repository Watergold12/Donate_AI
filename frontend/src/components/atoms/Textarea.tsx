import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/index'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={taId} className="text-sm font-medium text-da-secondary">{label}</label>}
        <textarea
          ref={ref} id={taId} rows={4}
          className={cn(
            'w-full resize-y rounded-lg border border-white/10 bg-[#0B0F14] px-3 py-2 text-sm text-white placeholder:text-da-muted',
            'focus:border-da-primary focus:outline-none focus:ring-2 focus:ring-da-primary/20',
            error && 'border-da-danger', className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-da-danger">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
