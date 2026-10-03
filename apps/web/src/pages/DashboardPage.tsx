import { FileUp, Plus, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { TEMPLATE_LIST, type ResumeSummary, type TemplateId } from '@resumeforge/core';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { TextInput } from '../components/ui/TextInput';
import { NewResumeDialog, type NewResumeOptions } from '../features/dashboard/NewResumeDialog';
import { RenameDialog } from '../features/dashboard/RenameDialog';
import { ResumeCard, type ResumeCardActions } from '../features/dashboard/ResumeCard';
import { downloadBlob } from '../lib/download';
import { pluralize, toFileName } from '../lib/format';
import { resumeService } from '../services';
import { useBackendStore } from '../state/backendStore';
import { useLibraryStore } from '../state/libraryStore';

type SortKey = 'updated' | 'created' | 'title';

const SORTS: Record<SortKey, (a: ResumeSummary, b: ResumeSummary) => number> = {
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { summaries, loaded, refresh, create, duplicate, rename, remove, restore, importJson } =
    useLibraryStore();
  const syncState = useBackendStore((s) => s.syncState);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [templateFilter, setTemplateFilter] = useState<'all' | TemplateId>('all');
  const [newOpen, setNewOpen] = useState(params.get('new') !== null);
  const [renaming, setRenaming] = useState<ResumeSummary | null>(null);
  const [deleting, setDeleting] = useState<ResumeSummary | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestedTemplate = (params.get('template') as TemplateId | null) ?? 'classic';

  useEffect(() => {
    document.title = 'My resumes — ResumeForge';
    refresh();
  }, [refresh]);

  // A sync from the server may bring in resumes created elsewhere.
  useEffect(() => {
    if (syncState === 'idle') refresh();
  }, [syncState, refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries
      .filter((s) => templateFilter === 'all' || s.template === templateFilter)
      .filter(
        (s) => !q || [s.title, s.fullName, s.headline].some((v) => v.toLowerCase().includes(q)),
      )
      .sort(SORTS[sort]);
  }, [summaries, query, sort, templateFilter]);

  const onCreate = (options: NewResumeOptions) => {
    const resume = create(options);
    setNewOpen(false);
    navigate(`/app/resume/${resume.id}`);
  };

  const actions: ResumeCardActions = {
    onRename: setRenaming,
    onDuplicate: async (summary) => {
      const copy = await duplicate(summary.id);
      if (copy) toast.success(`Created “${copy.metadata.title}”`);
    },
    onExportJson: async (summary) => {
      const loaded = await resumeService.get(summary.id);
      if (!loaded) return;
      const blob = new Blob([JSON.stringify(loaded.resume, null, 2)], { type: 'application/json' });
      downloadBlob(blob, toFileName(summary.title, 'json'));
    },
    onDelete: setDeleting,
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const removed = await remove(deleting.id);
    toast(`Deleted “${deleting.title}”`, {
      action: removed ? { label: 'Undo', onClick: () => restore(removed) } : undefined,
      duration: 8000,
    });
  };

  const onImport = async (file: File) => {
    try {
      const resume = importJson(await file.text());
      toast.success(`Imported “${resume.metadata.title}”`);
    } catch (error) {
      toast.error('Import failed', { description: (error as Error).message });
    }
  };

  return (
    <div className="min-h-dvh bg-surface">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="type-title text-3xl text-ink">My resumes</h1>
            {loaded && summaries.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                {pluralize(summaries.length, 'resume')}, saved{' '}
                {syncState === 'idle' || syncState === 'syncing'
                  ? 'in this browser and on the server'
                  : 'in this browser'}
                .
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<FileUp className="size-4" />}
              onClick={() => fileInput.current?.click()}
            >
              Import
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="size-4" />}
              onClick={() => setNewOpen(true)}
            >
              Create new resume
            </Button>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = '';
          }}
        />

        {!loaded ? (
          <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-x-6 gap-y-10">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="h-72" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <EmptyLibrary
            onCreate={() => setNewOpen(true)}
            onDemo={() => onCreate({ title: '', template: 'classic', startFrom: 'demo' })}
          />
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-line py-3">
              <div className="relative min-w-56 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <TextInput
                  type="search"
                  aria-label="Search resumes"
                  placeholder="Search by name or title"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select
                aria-label="Filter by template"
                className="w-44"
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value as 'all' | TemplateId)}
                options={[
                  { value: 'all', label: 'All templates' },
                  ...TEMPLATE_LIST.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
              <Select
                aria-label="Sort resumes"
                className="w-44"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                options={[
                  { value: 'updated', label: 'Last edited' },
                  { value: 'created', label: 'Date created' },
                  { value: 'title', label: 'Name (A–Z)' },
                ]}
              />
            </div>
            {visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">No resumes match “{query}”.</p>
            ) : (
              <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-x-6 gap-y-10">
                {visible.map((summary) => (
                  <ResumeCard key={summary.id} summary={summary} actions={actions} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <NewResumeDialog
        open={newOpen}
        initialTemplate={requestedTemplate}
        onOpenChange={(open) => {
          setNewOpen(open);
          if (!open && params.has('new')) setParams({}, { replace: true });
        }}
        onCreate={onCreate}
      />
      <RenameDialog
        key={renaming?.id ?? 'none'}
        open={renaming !== null}
        initialTitle={renaming?.title ?? ''}
        onOpenChange={(open) => !open && setRenaming(null)}
        onRename={(title) => renaming && void rename(renaming.id, title)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this resume?"
        description={`“${deleting?.title ?? ''}” will be deleted. You can undo right after, but not once you leave this page.`}
        confirmLabel="Delete resume"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function EmptyLibrary({ onCreate, onDemo }: { onCreate: () => void; onDemo: () => void }) {
  return (
    <section className="mt-12 grid items-center gap-10 rounded-[10px] border border-dashed border-line-strong px-6 py-12 sm:px-12 md:grid-cols-[1fr_auto]">
      <div className="max-w-md">
        <h2 className="type-title text-2xl text-ink">Your first resume starts here</h2>
        <p className="mt-3 leading-relaxed text-muted">
          Start blank and fill in each section, or open an example resume to see how a dense,
          multi-page technical CV comes together. Everything stays in this browser until you choose
          otherwise.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" size="lg" icon={<Plus className="size-4" />} onClick={onCreate}>
            Create new resume
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Sparkles className="size-4" />}
            onClick={onDemo}
          >
            Open the example
          </Button>
        </div>
      </div>
      <div className="hidden md:block" aria-hidden>
        <div className="relative h-56 w-44">
          <div className="absolute inset-0 translate-x-4 translate-y-3 rotate-3 bg-surface shadow-page" />
          <div className="absolute inset-0 flex flex-col gap-2 bg-white p-4 shadow-page">
            <div className="h-3 w-24 rounded-sm bg-[#1a1a1a]" />
            <div className="h-1.5 w-16 rounded-sm bg-[#bbb]" />
            <div className="mt-3 h-px bg-[#1a1a1a]" />
            <div className="h-1.5 w-12 rounded-sm bg-accent" />
            {[90, 75, 82, 60, 88, 70].map((w, i) => (
              <div key={i} className="h-1.5 rounded-sm bg-[#d6d6d6]" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
