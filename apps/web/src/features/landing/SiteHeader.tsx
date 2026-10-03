import { Link } from 'react-router';
import { GitHubMark } from '../../components/GitHubMark';
import { Tooltip } from '../../components/ui/Tooltip';
import { DEVELOPER_NAME, DEVELOPER_URL, REPOSITORY_URL } from '../../lib/links';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';

export function SiteHeader() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav
          aria-label="Main"
          className="hidden flex-1 items-center gap-6 text-sm text-muted md:flex"
        >
          <a href="/#features" className="hover:text-ink">
            Features
          </a>
          <a href="/#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <Link to="/templates" className="hover:text-ink">
            Templates
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Tooltip content="Source code on GitHub">
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ResumeForge source code on GitHub"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
            >
              <GitHubMark className="size-[18px]" />
            </a>
          </Tooltip>
          <ThemeToggle />
          <Link
            to="/app"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-on-primary hover:opacity-90"
          >
            Open ResumeForge
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Build a resume worth remembering. Structured editing, real pages, exact PDFs.
          </p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-ink">Product</span>
          <Link to="/app" className="text-muted hover:text-ink">
            My resumes
          </Link>
          <Link to="/templates" className="text-muted hover:text-ink">
            Templates
          </Link>
          <a href="/#features" className="text-muted hover:text-ink">
            Features
          </a>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink"
          >
            Source code
          </a>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-ink">Your data</span>
          <p className="leading-relaxed text-muted">
            Resumes are saved in your browser, and on your own ResumeForge server when one is
            connected. Nothing is sent anywhere else.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-line px-4 py-5 text-xs text-faint sm:px-6">
        <span>© {new Date().getFullYear()} ResumeForge</span>
        <span>
          Built by{' '}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            {DEVELOPER_NAME}
          </a>
        </span>
      </div>
    </footer>
  );
}
