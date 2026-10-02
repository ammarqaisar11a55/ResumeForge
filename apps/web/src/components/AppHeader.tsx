import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

/** Header for the dashboard and templates pages. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo to="/app" />
        <div className="flex-1" />
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
