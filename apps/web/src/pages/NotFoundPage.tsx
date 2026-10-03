import { Link } from 'react-router';
import { Logo } from '../components/Logo';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <header className="px-6 py-4">
        <Logo />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="type-display text-[88px] text-line-strong">404</p>
        <h1 className="type-title mt-2 text-2xl text-ink">This page is not in the stack</h1>
        <p className="mt-2 max-w-sm text-muted">
          The link may be out of date, or the resume was deleted.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/app"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-on-primary"
          >
            Go to my resumes
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
