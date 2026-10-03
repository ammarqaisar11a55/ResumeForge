import { FileQuestion, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { downloadPdf, printResume } from '../export/exportResume';
import { DesignPanel } from '../features/editor/design/DesignPanel';
import { EditorTopBar } from '../features/editor/EditorTopBar';
import { IssuesProvider } from '../features/editor/issues';
import { MobileTabs } from '../features/editor/mobile/MobileTabs';
import { PreviewPane } from '../features/editor/preview/PreviewPane';
import { ShortcutsDialog } from '../features/editor/ShortcutsDialog';
import { SectionsPanel } from '../features/editor/sidebar/SectionsPanel';
import { useSidebarStore } from '../features/editor/sidebar/sidebarStore';
import { useEditorShortcuts } from '../features/editor/useEditorShortcuts';
import { useAutosave, useUnloadProtection } from '../hooks/useAutosave';
import { useIsDesktop, useIsWide } from '../hooks/useMediaQuery';
import { cn } from '../lib/cn';
import { resumeService } from '../services';
import { useEditorStore } from '../state/editorStore';
import { useUiStore } from '../state/uiStore';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function EditorPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const documentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    useSidebarStore.getState().reset();
    resumeService
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) return setState('missing');
        useEditorStore.getState().load(loaded.resume);
        document.title = `${loaded.resume.metadata.title} — ResumeForge`;
        if (loaded.repairNotice)
          toast.warning('This resume was repaired', {
            description: loaded.repairNotice,
            duration: 12_000,
          });
        setState('ready');
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setLoadError(error.message);
        setState('error');
      });
    return () => {
      cancelled = true;
      useEditorStore.getState().unload();
      document.title = 'ResumeForge — Build a resume worth remembering';
    };
  }, [id]);

  useAutosave();
  useUnloadProtection();

  const print = () => {
    const resume = useEditorStore.getState().resume;
    if (resume) void printResume(documentRef.current, resume);
  };
  const exportPdf = async () => {
    const resume = useEditorStore.getState().resume;
    if (!resume || exporting) return;
    setExporting(true);
    try {
      await downloadPdf(documentRef.current, resume);
    } finally {
      setExporting(false);
    }
  };
  useEditorShortcuts({ print, exportPdf: () => void exportPdf() });

  if (state === 'loading') return <EditorSkeleton />;
  if (state === 'missing' || state === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center">
        <FileQuestion className="size-10 text-faint" aria-hidden />
        <h1 className="type-title text-xl text-ink">
          {state === 'missing' ? 'Resume not found' : 'This resume could not be opened'}
        </h1>
        <p className="max-w-sm text-sm text-muted">
          {state === 'missing'
            ? 'It may have been deleted, or it was created in another browser.'
            : `${loadError} Your other resumes are unaffected.`}
        </p>
        <Link
          to="/app"
          className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-on-primary"
        >
          Back to my resumes
        </Link>
      </main>
    );
  }

  return (
    <IssuesProvider>
      <EditorLayout
        documentRef={documentRef}
        onPrint={print}
        onDownload={() => void exportPdf()}
        exporting={exporting}
      />
      <ShortcutsDialog />
    </IssuesProvider>
  );
}

function EditorLayout({
  documentRef,
  onPrint,
  onDownload,
  exporting,
}: {
  documentRef: React.RefObject<HTMLDivElement | null>;
  onPrint: () => void;
  onDownload: () => void;
  exporting: boolean;
}) {
  const isWide = useIsWide();
  const isDesktop = useIsDesktop();
  const {
    showSections,
    showDesign,
    previewMode,
    designDrawerOpen,
    mobileTab,
    togglePreviewMode,
    setDesignDrawerOpen,
  } = useUiStore();
  const resumeKey = useEditorStore((s) => s.resume?.id);
  const designAsDrawer = isDesktop && !isWide;

  const preview = (
    <ErrorBoundary
      resetKey={useEditorStore.getState().revision}
      fallback={(error) => (
        <div className="flex h-full items-center justify-center bg-canvas p-8 text-center text-sm text-muted">
          <p>
            The preview could not render this content ({error.message}). Your data is safe; undo the
            last change or keep editing.
          </p>
        </div>
      )}
    >
      <PreviewPane ref={documentRef} />
    </ErrorBoundary>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface" key={resumeKey}>
      <EditorTopBar
        onPrint={onPrint}
        onDownload={onDownload}
        exporting={exporting}
        compact={!isDesktop}
        designAsDrawer={designAsDrawer}
      />
      {isDesktop ? (
        <div className="relative flex min-h-0 flex-1">
          {showSections && !previewMode && (
            <aside
              className="w-[340px] shrink-0 border-r border-line bg-surface"
              aria-label="Sections"
            >
              <SectionsPanel />
            </aside>
          )}
          <main className="min-w-0 flex-1">{preview}</main>
          {!previewMode && isWide && showDesign && (
            <aside
              className="w-[300px] shrink-0 border-l border-line bg-surface"
              aria-label="Design"
            >
              <DesignPanel />
            </aside>
          )}
          {!previewMode && designAsDrawer && designDrawerOpen && (
            <aside
              className="absolute inset-y-0 right-0 z-20 w-[320px] border-l border-line bg-surface shadow-pop"
              aria-label="Design"
            >
              <button
                type="button"
                onClick={() => setDesignDrawerOpen(false)}
                className="absolute top-2.5 right-2 z-10 flex size-7 items-center justify-center rounded-md text-muted hover:bg-raised"
                aria-label="Close design panel"
              >
                <X className="size-4" />
              </button>
              <DesignPanel />
            </aside>
          )}
          {previewMode && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 shadow-pop"
              icon={<X className="size-4" />}
              onClick={togglePreviewMode}
            >
              Exit preview
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1">
            <div className={cn('h-full', mobileTab !== 'edit' && 'hidden')}>
              <SectionsPanel />
            </div>
            {/* The preview stays mounted so print and export always have a document. */}
            <div
              className={cn(
                'h-full',
                mobileTab !== 'preview' && 'invisible absolute inset-0 -z-10',
              )}
            >
              {preview}
            </div>
            <div className={cn('h-full', mobileTab !== 'design' && 'hidden')}>
              <DesignPanel />
            </div>
          </div>
          <MobileTabs />
        </>
      )}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-surface" role="status" aria-label="Loading resume">
      <div className="flex h-14 items-center gap-3 border-b border-line px-3">
        <Skeleton className="size-7" />
        <Skeleton className="h-5 w-48" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[340px] flex-col gap-3 border-r border-line p-3 lg:flex">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        <div className="flex flex-1 justify-center bg-canvas p-10">
          <Skeleton className="aspect-[210/297] w-full max-w-[560px] rounded-none bg-surface" />
        </div>
      </div>
    </div>
  );
}
