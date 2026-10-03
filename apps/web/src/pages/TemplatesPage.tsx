import { useEffect } from 'react';
import { SiteFooter, SiteHeader } from '../features/landing/SiteHeader';
import { TemplateShowcase } from '../features/landing/TemplateShowcase';

export default function TemplatesPage() {
  useEffect(() => {
    document.title = 'Templates — ResumeForge';
  }, []);
  return (
    <div className="min-h-dvh bg-surface">
      <div className="bg-canvas">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <h1 className="type-display text-[clamp(2.4rem,6vw,3.6rem)] text-ink">Templates</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Each template is a set of typographic decisions applied to the same structured content.
            All three keep a single column and plain text, so applicant tracking systems read them
            in order.
          </p>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <TemplateShowcase width={280} />
      </main>
      <SiteFooter />
    </div>
  );
}
