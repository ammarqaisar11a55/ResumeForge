import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

/** Header for the dashboard and templates pages. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo to="/app" />
        <nav aria-label="App" className="ml-4 flex items-center gap-1 text-sm">
          {[
            { to: '/app', label: 'My resumes', end: true },
            { to: '/templates', label: 'Templates', end: false },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 ${isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
