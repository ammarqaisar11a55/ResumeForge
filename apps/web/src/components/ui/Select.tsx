import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { inputClass } from './Field';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
}

/** Native select: fully keyboard and screen-reader accessible on every platform. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, className, ...props }, ref) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select ref={ref} className={cn(inputClass, 'h-9 appearance-none pr-8')} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
});
