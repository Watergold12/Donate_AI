import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/index'

interface SelectOption { value: string; label: string }
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: SelectOption[]; placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-sm font-medium text-da-secondary">{label}</label>}
        <select
          ref={ref} id={selectId}
          className={cn(
            'h-10 w-full rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-text',
            'focus:border-da-primary focus:outline-none focus:ring-2 focus:ring-da-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-da-danger', className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value} className="bg-da-card">{o.label}</option>)}
        </select>
        {error && <p className="text-xs text-da-danger">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
