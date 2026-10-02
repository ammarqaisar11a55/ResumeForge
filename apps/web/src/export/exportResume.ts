import { toast } from 'sonner';
import type { Resume } from '@resumeforge/core';
import { downloadBlob } from '../lib/download';
import { toFileName } from '../lib/format';
import { api } from '../services';
import { useBackendStore } from '../state/backendStore';
import { snapshotDocument } from './documentSnapshot';
import { printDocument } from './printDocument';

export function pdfFileName(resume: Resume): string {
  const name = resume.personalInfo.fullName.trim();
  return toFileName(name ? `${name} Resume` : resume.metadata.title, 'pdf');
}

export async function printResume(element: HTMLElement | null, resume: Resume): Promise<void> {
  if (!element) {
    toast.error('The preview is still loading. Try again in a moment.');
    return;
  }
  try {
    await printDocument(snapshotDocument(element, resume), pdfFileName(resume).replace(/\.pdf$/, ''));
  } catch (error) {
    toast.error('Printing failed', { description: (error as Error).message });
  }
}

/**
 * Download a PDF rendered by the server's headless Chrome from the exact
 * preview markup. Without a server, fall back to the browser print dialog,
 * which produces the same pages via "Save as PDF".
 */
export async function downloadPdf(element: HTMLElement | null, resume: Resume): Promise<void> {
  if (!element) {
    toast.error('The preview is still loading. Try again in a moment.');
    return;
  }
  const snapshot = snapshotDocument(element, resume);
  const fileName = pdfFileName(resume);
  const { capabilities } = useBackendStore.getState();

  if (!api || !capabilities.pdf) {
    toast.info('Choose “Save as PDF” in the print dialog', {
      description: 'The PDF server is not running, so your browser will create the PDF. The pages are identical.',
    });
    await printResume(element, resume);
    return;
  }

  const pending = toast.loading('Creating PDF…');
  try {
    const blob = await api.exportPdf({
      resumeId: resume.id,
      title: fileName.replace(/\.pdf$/, ''),
      html: snapshot.html,
      page: { widthMm: snapshot.widthMm, heightMm: snapshot.heightMm },
      fonts: snapshot.fonts,
      pageCount: snapshot.pageCount,
    });
    downloadBlob(blob, fileName);
    toast.success(`Downloaded ${fileName}`, { id: pending });
  } catch (error) {
    toast.error('The PDF could not be created', {
      id: pending,
      description: `${(error as Error).message} You can still save a PDF from the print dialog.`,
      action: { label: 'Open print dialog', onClick: () => void printResume(element, resume) },
      duration: 10_000,
    });
  }
}
