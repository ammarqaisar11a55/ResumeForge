/**
 * Standalone HTML for printing or PDF generation. Used by the browser print
 * flow (inside an isolated iframe) and by the server's headless Chrome, so
 * both produce identical sheets from the same paginated markup.
 */
export interface PrintDocumentInput {
  /** Outer HTML of the rendered `.rf-document` element. */
  documentHtml: string;
  /** Stylesheets: font faces and document.css. */
  css: string;
  title: string;
  widthMm: number;
  heightMm: number;
  /** Extra head markup (e.g. a CSP meta tag on the server). */
  head?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Never let embedded CSS terminate its <style> element. */
function safeCss(css: string): string {
  return css.replace(/<\/style/gi, '<\\/style');
}

export function buildPrintHtml(input: PrintDocumentInput): string {
  const { documentHtml, css, title, widthMm, heightMm, head = '' } = input;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${head}
<title>${escapeHtml(title)}</title>
<style>${safeCss(css)}</style>
<style>
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
.rf-page { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
.rf-page:last-child { break-after: auto; page-break-after: auto; }
</style>
</head>
<body>${documentHtml}</body>
</html>`;
}
