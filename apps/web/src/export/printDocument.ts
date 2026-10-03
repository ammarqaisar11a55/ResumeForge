import { buildPrintHtml } from '@resumeforge/renderer';
import type { DocumentSnapshot } from './documentSnapshot';

/** Stylesheets currently applied to the app (Vite injects <style> in dev, <link> in production). */
function collectStylesheets(): string {
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');
}

function waitForStylesheets(doc: Document): Promise<void> {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  return Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.sheet) return resolve();
          link.addEventListener('load', () => resolve(), { once: true });
          link.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

/**
 * Print the resume from an isolated, invisible iframe containing only the
 * paginated pages. `@page` matches the sheet size with zero margins, so the
 * browser adds no headers, footers or scaling.
 */
export async function printDocument(snapshot: DocumentSnapshot, title: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });
  iframe.srcdoc = buildPrintHtml({
    documentHtml: snapshot.html,
    css: '',
    head: collectStylesheets(),
    title,
    widthMm: snapshot.widthMm,
    heightMm: snapshot.heightMm,
  });

  await new Promise<void>((resolve, reject) => {
    iframe.addEventListener('load', () => resolve(), { once: true });
    iframe.addEventListener(
      'error',
      () => reject(new Error('The print view could not be prepared.')),
      { once: true },
    );
    document.body.appendChild(iframe);
  });

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    throw new Error('The print view could not be prepared.');
  }

  await waitForStylesheets(doc);
  await doc.fonts?.ready;

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', cleanup, { once: true });
  // Some browsers never fire afterprint; remove the frame eventually regardless.
  setTimeout(() => iframe.isConnected && iframe.remove(), 120_000);
  win.focus();
  win.print();
}
