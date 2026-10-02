import {
  getSectionDefinition,
  SETTING_LIMITS,
  sectionOptions,
  type DocumentSettings,
  type OptionDef,
  type Section,
  type SectionOptions,
} from '@resumeforge/core';
import { Select } from '../../../components/ui/Select';
import { SliderField } from '../../../components/ui/SliderField';
import { Switch } from '../../../components/ui/Switch';
import { setSectionOption, setSetting, updateSection } from '../../../state/editorActions';
import { Group } from './DesignPanel';

/** Options for the selected section, plus the shared section typography. */
export function SectionDesign({ section, settings }: { section: Section; settings: DocumentSettings }) {
  const def = getSectionDefinition(section.type);
  const options = sectionOptions(section);
  const limits = SETTING_LIMITS;
  return (
    <>
      <Group title="This section">
        <Switch
          label="Show on resume"
          checked={section.visible}
          onCheckedChange={(visible) => updateSection(section.id, { visible })}
        />
        <Switch
          label="Show heading"
          description={section.type === 'summary' ? 'Summaries often read well without one.' : undefined}
          checked={options.showTitle}
          onCheckedChange={(v) => setSectionOption(section.id, 'showTitle', v)}
        />
        {def.options.map((option) => (
          <OptionControl key={option.key} option={option} value={options[option.key]} sectionId={section.id} />
        ))}
      </Group>
      <Group title="All sections">
        <SliderField
          label="Heading size"
          min={limits.sectionTitleSize.min}
          max={limits.sectionTitleSize.max}
          step={limits.sectionTitleSize.step}
          unit="pt"
          value={settings.typography.sectionTitleSize}
          onChange={(v) => setSetting('typography', 'sectionTitleSize', v)}
        />
        <SliderField
          label="Entry title size"
          min={limits.entryTitleSize.min}
          max={limits.entryTitleSize.max}
          step={limits.entryTitleSize.step}
          unit="pt"
          value={settings.typography.entryTitleSize}
          onChange={(v) => setSetting('typography', 'entryTitleSize', v)}
        />
        <SliderField
          label="Space before sections"
          min={limits.sectionSpacing.min}
          max={limits.sectionSpacing.max}
          step={limits.sectionSpacing.step}
          unit="pt"
          value={settings.spacing.section}
          onChange={(v) => setSetting('spacing', 'section', v)}
        />
        <SliderField
          label="Space between entries"
          min={limits.entrySpacing.min}
          max={limits.entrySpacing.max}
          step={limits.entrySpacing.step}
          unit="pt"
          value={settings.spacing.entry}
          onChange={(v) => setSetting('spacing', 'entry', v)}
        />
      </Group>
    </>
  );
}

function OptionControl({
  option,
  value,
  sectionId,
}: {
  option: OptionDef;
  value: SectionOptions[keyof SectionOptions];
  sectionId: string;
}) {
  if (option.kind === 'switch') {
    return (
      <Switch
        label={option.label}
        description={option.hint}
        checked={Boolean(value)}
        onCheckedChange={(v) => setSectionOption(sectionId, option.key, v as never)}
      />
    );
  }
  const choices = option.choices ?? [];
  const numeric = typeof choices[0]?.value === 'number';
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
      {option.label}
      <Select
        value={String(value)}
        options={choices}
        onChange={(e) => setSectionOption(sectionId, option.key, (numeric ? Number(e.target.value) : e.target.value) as never)}
      />
    </label>
  );
}
