import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name, also shown as the tooltip. */
  label: string;
  shortcut?: string[];
  size?: 'xs' | 'sm' | 'md';
  active?: boolean;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
  /** Skip the tooltip (e.g. when used as a Radix trigger). */
  noTooltip?: boolean;
}

const SIZES = { xs: 'size-6', sm: 'size-7', md: 'size-9' };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, size = 'sm', active, className, children, tooltipSide, noTooltip, type = 'button', ...props },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150',
        'hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent-soft text-accent-ink',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
  if (noTooltip) return button;
  return (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide}>
      {button}
    </Tooltip>
  );
});
