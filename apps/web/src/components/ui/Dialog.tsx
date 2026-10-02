import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const overlayClass =
  'fixed inset-0 z-50 bg-[rgb(15_18_23/0.45)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]';
export const panelClass =
  'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-line bg-surface p-5 shadow-pop focus:outline-none data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]';

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayClass} />
        <RadixDialog.Content className={cn(panelClass, 'max-w-md', className)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="type-title text-lg text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="-mt-1 -mr-1 inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </div>
          {children}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
