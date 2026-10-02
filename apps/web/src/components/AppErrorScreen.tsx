import { Button } from './ui/Button';
import { LogoMark } from './Logo';

/** Last-resort screen when the application itself fails to render. */
export function AppErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="max-w-md rounded-[10px] border border-line bg-surface p-6 shadow-pop">
        <LogoMark />
        <h1 className="type-title mt-4 text-xl text-ink">ResumeForge hit an unexpected error</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your resumes are stored in this browser and have not been affected. Reload the page to continue. If this keeps
          happening, download a JSON backup from the dashboard.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-sunken p-3 text-xs text-muted">{error.message}</pre>
        <div className="mt-5 flex gap-2">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload ResumeForge
          </Button>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
