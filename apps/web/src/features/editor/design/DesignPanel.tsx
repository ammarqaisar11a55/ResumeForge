import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  FONT_IDS,
  FONTS,
  getSectionDefinition,
  resolveSettings,
  SETTING_LIMITS,
  TEMPLATES,
  type DocumentSettings,
  type Resume,
} from '@resumeforge/core';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Select } from '../../../components/ui/Select';
import { SliderField } from '../../../components/ui/SliderField';
import { ColorField } from '../../../components/ui/ColorField';
import { Segmented } from '../../../components/ui/Segmented';
import { Switch } from '../../../components/ui/Switch';
import {
  resetSettings,
  setDocumentOption,
  setMargin,
  setSetting,
} from '../../../state/editorActions';
import { useEditorStore } from '../../../state/editorStore';
import { useUiStore } from '../../../state/uiStore';
import { SectionDesign } from './SectionDesign';
import { TemplatePicker } from './TemplatePicker';

const FONT_OPTIONS = FONT_IDS.map((id) => ({
  value: id,
  label: `${FONTS[id].name} (${FONTS[id].category === 'serif' ? 'serif' : 'sans'})`,
}));

export function Group({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-b border-line px-4 py-4" aria-label={title}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {action}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ResetButton({
  group,
  label,
}: {
  group: Parameters<typeof resetSettings>[0];
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => resetSettings(group)}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-raised hover:text-ink"
      aria-label={label}
    >
      <RotateCcw className="size-3" aria-hidden />
      Reset
    </button>
  );
}

function Slider({
  label,
  limit,
  value,
  onChange,
}: {
  label: string;
  limit: keyof typeof SETTING_LIMITS;
  value: number;
  onChange: (value: number) => void;
}) {
  const l = SETTING_LIMITS[limit];
  return (
    <SliderField
      label={label}
      min={l.min}
      max={l.max}
      step={l.step}
      unit={l.unit}
      value={value}
      onChange={onChange}
    />
  );
}

/** Right panel: contextual formatting for the selection, then document-wide design. */
export function DesignPanel() {
  const resume = useEditorStore((s) => s.resume);
  const selection = useEditorStore((s) => s.selection);
  if (!resume) return null;
  const settings = resolveSettings(resume.template, resume.settings);
  const section =
    selection.kind === 'section'
      ? resume.sections.find((s) => s.id === selection.sectionId)
      : undefined;
  const contextTitle =
    selection.kind === 'header'
      ? 'Header'
      : section
        ? section.title || getSectionDefinition(section.type).label
        : 'Document';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-2">
        {selection.kind !== 'document' && (
          <button
            type="button"
            onClick={() => useEditorStore.getState().select({ kind: 'document' })}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
            aria-label="Back to document settings"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        <h2 className="truncate px-1 text-sm font-semibold text-ink">
          {selection.kind === 'document' ? 'Design' : contextTitle}
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="design-panel">
        {selection.kind === 'header' && <HeaderDesign settings={settings} />}
        {section && <SectionDesign section={section} settings={settings} />}
        {selection.kind !== 'document' && (
          <p className="px-4 pt-4 pb-1 text-xs font-medium text-muted">Whole document</p>
        )}
        <DocumentDesign resume={resume} settings={settings} />
      </div>
    </div>
  );
}

function HeaderDesign({ settings }: { settings: DocumentSettings }) {
  const t = settings.typography;
  return (
    <>
      <Group title="Header layout">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Alignment</span>
          <Segmented
            label="Header alignment"
            value={settings.header.alignment}
            onChange={(v) => setSetting('header', 'alignment', v)}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Contact details</span>
          <Segmented
            label="Contact layout"
            value={settings.header.contactLayout}
            onChange={(v) => setSetting('header', 'contactLayout', v)}
            options={[
              { value: 'auto', label: 'Details, then links' },
              { value: 'single-line', label: 'One flow' },
            ]}
          />
        </div>
        <Switch
          label="Show professional title"
          checked={settings.header.showHeadline}
          onCheckedChange={(v) => setSetting('header', 'showHeadline', v)}
        />
      </Group>
      <Group title="Name">
        <Slider
          label="Name size"
          limit="nameSize"
          value={t.nameSize}
          onChange={(v) => setSetting('typography', 'nameSize', v)}
        />
        <Slider
          label="Name weight"
          limit="nameWeight"
          value={t.nameWeight}
          onChange={(v) => setSetting('typography', 'nameWeight', v)}
        />
        <Slider
          label="Space below header"
          limit="headerSpacing"
          value={settings.spacing.header}
          onChange={(v) => setSetting('spacing', 'header', v)}
        />
      </Group>
    </>
  );
}

function DocumentDesign({ resume, settings }: { resume: Resume; settings: DocumentSettings }) {
  const t = settings.typography;
  const s = settings.spacing;
  const m = settings.page.margins;
  const cropMarks = useUiStore((st) => st.cropMarks);
  const setCropMarks = useUiStore((st) => st.setCropMarks);
  const [linkedMargins, setLinkedMargins] = useState(
    m.top === m.right && m.right === m.bottom && m.bottom === m.left,
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const template = TEMPLATES[resume.template];

  return (
    <>
      <Group title="Template">
        <TemplatePicker value={resume.template} />
      </Group>

      <Group
        title="Typography"
        action={<ResetButton group="typography" label="Reset typography" />}
      >
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
            Body font
            <Select
              value={t.bodyFont}
              options={FONT_OPTIONS}
              onChange={(e) =>
                setSetting('typography', 'bodyFont', e.target.value as typeof t.bodyFont)
              }
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
            Heading font
            <Select
              value={t.headingFont}
              options={FONT_OPTIONS}
              onChange={(e) =>
                setSetting('typography', 'headingFont', e.target.value as typeof t.headingFont)
              }
            />
          </label>
        </div>
        <Slider
          label="Body size"
          limit="baseSize"
          value={t.baseSize}
          onChange={(v) => setSetting('typography', 'baseSize', v)}
        />
        <Slider
          label="Section heading size"
          limit="sectionTitleSize"
          value={t.sectionTitleSize}
          onChange={(v) => setSetting('typography', 'sectionTitleSize', v)}
        />
        <Slider
          label="Entry title size"
          limit="entryTitleSize"
          value={t.entryTitleSize}
          onChange={(v) => setSetting('typography', 'entryTitleSize', v)}
        />
        <Slider
          label="Name size"
          limit="nameSize"
          value={t.nameSize}
          onChange={(v) => setSetting('typography', 'nameSize', v)}
        />
        <Slider
          label="Line height"
          limit="lineHeight"
          value={t.lineHeight}
          onChange={(v) => setSetting('typography', 'lineHeight', v)}
        />
        <Slider
          label="Letter spacing"
          limit="letterSpacing"
          value={t.letterSpacing}
          onChange={(v) => setSetting('typography', 'letterSpacing', v)}
        />
      </Group>

      <Group title="Layout" action={<ResetButton group="spacing" label="Reset spacing" />}>
        <Switch
          label="Same margin on all sides"
          checked={linkedMargins}
          onCheckedChange={setLinkedMargins}
        />
        {linkedMargins ? (
          <Slider
            label="Margins"
            limit="margin"
            value={m.top}
            onChange={(v) => setMargin('all', v)}
          />
        ) : (
          <>
            <Slider
              label="Top margin"
              limit="margin"
              value={m.top}
              onChange={(v) => setMargin('top', v)}
            />
            <Slider
              label="Bottom margin"
              limit="margin"
              value={m.bottom}
              onChange={(v) => setMargin('bottom', v)}
            />
            <Slider
              label="Left margin"
              limit="margin"
              value={m.left}
              onChange={(v) => setMargin('left', v)}
            />
            <Slider
              label="Right margin"
              limit="margin"
              value={m.right}
              onChange={(v) => setMargin('right', v)}
            />
          </>
        )}
        <Slider
          label="Space between sections"
          limit="sectionSpacing"
          value={s.section}
          onChange={(v) => setSetting('spacing', 'section', v)}
        />
        <Slider
          label="Space between entries"
          limit="entrySpacing"
          value={s.entry}
          onChange={(v) => setSetting('spacing', 'entry', v)}
        />
        <Slider
          label="Space between paragraphs"
          limit="paragraphSpacing"
          value={s.paragraph}
          onChange={(v) => setSetting('spacing', 'paragraph', v)}
        />
        <Slider
          label="Space below header"
          limit="headerSpacing"
          value={s.header}
          onChange={(v) => setSetting('spacing', 'header', v)}
        />
      </Group>

      <Group title="Colours" action={<ResetButton group="colors" label="Reset colours" />}>
        <ColorField
          label="Text"
          value={settings.colors.text}
          minContrast={7}
          onChange={(v) => setSetting('colors', 'text', v)}
        />
        <ColorField
          label="Secondary text"
          value={settings.colors.secondary}
          minContrast={4.5}
          onChange={(v) => setSetting('colors', 'secondary', v)}
        />
        {template.supportsAccent && (
          <ColorField
            label="Accent"
            value={settings.colors.accent}
            minContrast={3}
            onChange={(v) => setSetting('colors', 'accent', v)}
          />
        )}
        <ColorField
          label="Rules and dividers"
          value={settings.colors.divider}
          onChange={(v) => setSetting('colors', 'divider', v)}
        />
        <ColorField
          label="Paper"
          value={settings.colors.paper}
          onChange={(v) => setSetting('colors', 'paper', v)}
        />
      </Group>

      <Group title="Document">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Paper size</span>
          <Segmented
            label="Paper size"
            value={settings.page.format}
            onChange={(v) => setSetting('page', 'format', v, 'Change paper size')}
            options={[
              { value: 'A4', label: 'A4' },
              { value: 'Letter', label: 'US Letter' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Orientation</span>
          <Segmented
            label="Orientation"
            value={settings.page.orientation}
            onChange={(v) => setSetting('page', 'orientation', v, 'Change orientation')}
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        </div>
        <Switch
          label="Page numbers"
          description="Shown when the resume has more than one page."
          checked={settings.page.pageNumbers}
          onCheckedChange={(v) =>
            setSetting('page', 'pageNumbers', v, v ? 'Show page numbers' : 'Hide page numbers')
          }
        />
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
          Date format
          <Select
            value={settings.dateFormat}
            onChange={(e) =>
              setDocumentOption('dateFormat', e.target.value as DocumentSettings['dateFormat'])
            }
            options={[
              { value: 'year', label: '2023 – Present' },
              { value: 'short', label: 'Sep 2023 – Present' },
              { value: 'long', label: 'September 2023 – Present' },
              { value: 'numeric', label: '09/2023 – Present' },
            ]}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Bullet style</span>
          <Segmented
            label="Bullet style"
            value={settings.bulletStyle}
            onChange={(v) => setDocumentOption('bulletStyle', v)}
            options={[
              { value: 'disc', label: '•', ariaLabel: 'Round bullets' },
              { value: 'dash', label: '–', ariaLabel: 'Dashes' },
              { value: 'square', label: '▪', ariaLabel: 'Square bullets' },
              { value: 'none', label: 'None' },
            ]}
          />
        </div>
      </Group>

      <Group title="Preview">
        <Switch
          label="Crop marks"
          description="Trim marks around pages in the editor. Never printed."
          checked={cropMarks}
          onCheckedChange={setCropMarks}
        />
      </Group>

      <div className="px-4 py-5">
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="size-4" />}
          onClick={() => setConfirmReset(true)}
        >
          Reset all formatting
        </Button>
        <p className="mt-2 text-xs text-muted">
          Restores {template.name} defaults. Your content is not affected.
        </p>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all formatting?"
        description={`Fonts, sizes, spacing, colours and page settings return to the ${template.name} defaults. Your content stays exactly as it is.`}
        confirmLabel="Reset formatting"
        destructive={false}
        onConfirm={() => resetSettings()}
      />
    </>
  );
}
