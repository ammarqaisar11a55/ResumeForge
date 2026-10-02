import { Copy, FileJson, MoreHorizontal, PenLine, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { TEMPLATES, type ResumeSummary } from '@resumeforge/core';
import { IconButton } from '../../components/ui/IconButton';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../components/ui/Menu';
import { formatRelativeTime, pluralize } from '../../lib/format';
import { LazyThumbnail } from './LazyThumbnail';

export interface ResumeCardActions {
  onRename: (summary: ResumeSummary) => void;
  onDuplicate: (summary: ResumeSummary) => void;
  onExportJson: (summary: ResumeSummary) => void;
  onDelete: (summary: ResumeSummary) => void;
}

export function ResumeCard({ summary, actions }: { summary: ResumeSummary; actions: ResumeCardActions }) {
  const href = `/app/resume/${summary.id}`;
  return (
    <article className="group relative flex flex-col" data-testid="resume-card">
      <div className="relative flex justify-center overflow-hidden rounded-md border border-line bg-canvas px-6 pt-6 transition-colors group-hover:border-line-strong">
        <div className="shadow-page transition-transform duration-300 ease-out group-hover:-translate-y-1">
          <LazyThumbnail id={summary.id} updatedAt={summary.updatedAt} width={196} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-canvas to-transparent" />
      </div>
      <div className="flex items-start gap-2 pt-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink">
            {/* Stretched link: the whole card opens the editor, without nesting the thumbnail's own links. */}
            <Link to={href} className="rounded before:absolute before:inset-0 before:content-[''] hover:underline focus-visible:underline">
              {summary.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {pluralize(Math.max(summary.pageCount, 1), 'page')} in {TEMPLATES[summary.template]?.name ?? 'Forge Classic'}
          </p>
          <p className="mt-0.5 text-xs text-faint">
            Edited <time dateTime={summary.updatedAt}>{formatRelativeTime(summary.updatedAt)}</time>
          </p>
        </div>
        <Menu>
          <MenuTrigger asChild>
            <IconButton label={`Actions for ${summary.title}`} noTooltip className="relative z-10">
              <MoreHorizontal className="size-4" />
            </IconButton>
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<PenLine className="size-4" />} onSelect={() => actions.onRename(summary)}>
              Rename
            </MenuItem>
            <MenuItem icon={<Copy className="size-4" />} onSelect={() => actions.onDuplicate(summary)}>
              Duplicate
            </MenuItem>
            <MenuItem icon={<FileJson className="size-4" />} onSelect={() => actions.onExportJson(summary)}>
              Download backup (JSON)
            </MenuItem>
            <MenuSeparator />
            <MenuItem destructive icon={<Trash2 className="size-4" />} onSelect={() => actions.onDelete(summary)}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </article>
  );
}
