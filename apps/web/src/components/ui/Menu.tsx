import * as Dropdown from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const Menu = Dropdown.Root;
export const MenuTrigger = Dropdown.Trigger;

export function MenuContent({
  children,
  align = 'end',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          'z-50 min-w-48 rounded-lg border border-line bg-surface p-1 shadow-pop data-[state=open]:animate-[fade-in_120ms_ease-out]',
          className,
        )}
      >
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

export function MenuItem({
  icon,
  children,
  onSelect,
  destructive,
  shortcut,
  disabled,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  shortcut?: string;
  disabled?: boolean;
}) {
  return (
    <Dropdown.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex min-h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-sm outline-none select-none',
        'data-[disabled]:opacity-40 data-[highlighted]:bg-raised',
        destructive ? 'text-danger' : 'text-ink',
      )}
    >
      {icon && <span className={cn('flex size-4 items-center justify-center', !destructive && 'text-muted')}>{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-xs text-faint">{shortcut}</span>}
    </Dropdown.Item>
  );
}

export function MenuSeparator() {
  return <Dropdown.Separator className="my-1 h-px bg-line" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <Dropdown.Label className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted">{children}</Dropdown.Label>;
}
