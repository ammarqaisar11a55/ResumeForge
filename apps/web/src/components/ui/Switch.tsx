import * as RadixSwitch from '@radix-ui/react-switch';
import { useId } from 'react';
import { cn } from '../../lib/cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  hideLabel?: boolean;
}

export function Switch({ checked, onCheckedChange, label, description, className, hideLabel }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <label htmlFor={id} className={cn('flex min-w-0 flex-col text-[13px]', hideLabel && 'sr-only')}>
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </label>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors duration-150 data-[state=checked]:bg-primary"
      >
        <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-[18px]" />
      </RadixSwitch.Root>
    </div>
  );
}
