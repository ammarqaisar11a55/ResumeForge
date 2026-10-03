import {
  ArrowLeft,
  Download,
  Eye,
  Keyboard,
  LayoutTemplate,
  Moon,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Printer,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Link } from 'react-router';
import { TEMPLATE_LIST } from '@resumeforge/core';
import { LogoMark } from '../../components/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from '../../components/ui/Menu';
import { renameResume, setTemplate } from '../../state/editorActions';
import { selectCanRedo, selectCanUndo, useEditorStore } from '../../state/editorStore';
import { useUiStore } from '../../state/uiStore';
import { SaveIndicator } from './SaveIndicator';
import { SHORTCUTS } from './shortcuts';
import { runHistory } from './useEditorShortcuts';

interface EditorTopBarProps {
  onPrint: () => void;
  onDownload: () => void;
  exporting: boolean;
  compact: boolean;
  /** The design panel is an overlay drawer at this width. */
  designAsDrawer: boolean;
}

export function EditorTopBar({
  onPrint,
  onDownload,
  exporting,
  compact,
  designAsDrawer,
}: EditorTopBarProps) {
  const title = useEditorStore((s) => s.resume?.metadata.title ?? '');
  const template = useEditorStore((s) => s.resume?.template ?? 'classic');
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const ui = useUiStore();
  const designOpen = designAsDrawer ? ui.designDrawerOpen : ui.showDesign;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3">
      <Link
        to="/app"
        className="flex items-center gap-1.5 rounded-md p-1 text-muted hover:bg-raised hover:text-ink"
        aria-label="Back to my resumes"
      >
        <ArrowLeft className="size-4" />
        <LogoMark className="size-6" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <input
          aria-label="Resume name"
          value={title}
          onChange={(e) => renameResume(e.target.value)}
          onBlur={(e) => !e.target.value.trim() && renameResume('Untitled resume')}
          className="type-title h-8 min-w-0 max-w-72 flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-[15px] hover:border-line focus:border-focus focus:outline-none"
        />
        {!compact && <SaveIndicator />}
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton
          label="Undo"
          shortcut={SHORTCUTS.undo.keys}
          disabled={!canUndo}
          onClick={() => runHistory('undo')}
        >
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton
          label="Redo"
          shortcut={SHORTCUTS.redo.keys}
          disabled={!canRedo}
          onClick={() => runHistory('redo')}
        >
          <Redo2 className="size-4" />
        </IconButton>
      </div>

      {!compact && (
        <>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="sm" icon={<LayoutTemplate className="size-4" />}>
                {TEMPLATE_LIST.find((t) => t.id === template)?.name}
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Template</MenuLabel>
              {TEMPLATE_LIST.map((t) => (
                <MenuItem key={t.id} onSelect={() => setTemplate(t.id)}>
                  <span className={t.id === template ? 'font-semibold' : undefined}>{t.name}</span>
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          <IconButton
            label={ui.showSections ? 'Hide sections panel' : 'Show sections panel'}
            shortcut={SHORTCUTS['toggle-sections'].keys}
            active={ui.showSections && !ui.previewMode}
            onClick={ui.toggleSections}
          >
            <PanelLeft className="size-4" />
          </IconButton>
          <IconButton
            label={designOpen ? 'Hide design panel' : 'Show design panel'}
            shortcut={SHORTCUTS['toggle-design'].keys}
            active={designOpen && !ui.previewMode}
            onClick={
              designAsDrawer ? () => ui.setDesignDrawerOpen(!ui.designDrawerOpen) : ui.toggleDesign
            }
          >
            <PanelRight className="size-4" />
          </IconButton>
          <IconButton
            label="Focus preview"
            shortcut={SHORTCUTS.preview.keys}
            active={ui.previewMode}
            onClick={ui.togglePreviewMode}
          >
            <Eye className="size-4" />
          </IconButton>
          <IconButton
            label="Keyboard shortcuts"
            shortcut={SHORTCUTS.help.keys}
            onClick={() => ui.setShortcutsOpen(true)}
          >
            <Keyboard className="size-4" />
          </IconButton>
          <ThemeToggle size="sm" />
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="size-4" />}
            onClick={onPrint}
          >
            Print
          </Button>
        </>
      )}

      {compact && (
        <Menu>
          <MenuTrigger asChild>
            <IconButton label="More actions" noTooltip>
              <MoreHorizontal className="size-4" />
            </IconButton>
          </MenuTrigger>
          <MenuContent>
            <MenuLabel>Template</MenuLabel>
            {TEMPLATE_LIST.map((t) => (
              <MenuItem key={t.id} onSelect={() => setTemplate(t.id)}>
                <span className={t.id === template ? 'font-semibold' : undefined}>{t.name}</span>
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem icon={<Printer className="size-4" />} onSelect={onPrint}>
              Print resume
            </MenuItem>
            <MenuItem
              icon={<Keyboard className="size-4" />}
              onSelect={() => ui.setShortcutsOpen(true)}
            >
              Keyboard shortcuts
            </MenuItem>
            <MenuItem icon={<Moon className="size-4" />} onSelect={ui.toggleTheme}>
              Switch theme
            </MenuItem>
          </MenuContent>
        </Menu>
      )}

      <Button
        variant="primary"
        size="sm"
        icon={<Download className="size-4" />}
        loading={exporting}
        onClick={onDownload}
        aria-label="Download PDF"
      >
        <span className="hidden sm:inline">Download PDF</span>
      </Button>
    </header>
  );
}
