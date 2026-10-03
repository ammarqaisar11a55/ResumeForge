import { createId } from './ids';
import type {
  AchievementEntry,
  AnyEntry,
  EntryOf,
  Section,
  SectionOf,
  SectionOptions,
  SectionType,
} from './schema';

/**
 * Declarative description of every section type. The editor builds its forms
 * from these definitions and the validator uses them to know which fields
 * hold URLs or dates, so a new section type is mostly a matter of adding an
 * entry here plus a renderer.
 */

export type FieldKind =
  'text' | 'textarea' | 'url' | 'date' | 'date-range' | 'tags' | 'bullets' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  /** Grid columns out of 2. */
  span?: 1 | 2;
  choices?: { value: string; label: string }[];
  /** For date-range fields: label of the "ongoing" toggle. */
  currentLabel?: string;
}

export type OptionKind = 'select' | 'switch';

export interface OptionDef {
  key: keyof SectionOptions;
  label: string;
  kind: OptionKind;
  hint?: string;
  choices?: { value: string | number; label: string }[];
}

export type SectionIcon =
  | 'align-left'
  | 'graduation-cap'
  | 'briefcase'
  | 'folder-git'
  | 'wrench'
  | 'trophy'
  | 'badge-check'
  | 'award'
  | 'book-open'
  | 'languages'
  | 'heart'
  | 'puzzle';

export interface SectionDefinition<T extends SectionType = SectionType> {
  type: T;
  label: string;
  description: string;
  defaultTitle: string;
  icon: SectionIcon;
  /** Singular noun used in "Add …" buttons. */
  entryNoun: string;
  /** Whether the section holds exactly one entry (summary). */
  singleEntry: boolean;
  createEntry: () => EntryOf<T>;
  fields: (entry: EntryOf<T>) => FieldDef[];
  entryTitle: (entry: EntryOf<T>) => string;
  entrySubtitle: (entry: EntryOf<T>) => string;
  defaultOptions: SectionOptions;
  options: OptionDef[];
}

const range = () => ({ start: '', end: '', current: false });

const SEPARATOR_OPTION: OptionDef = {
  key: 'separator',
  label: 'Separator',
  kind: 'select',
  choices: [
    { value: 'comma', label: 'Comma  ,' },
    { value: 'dot', label: 'Middle dot  ·' },
    { value: 'pipe', label: 'Bar  |' },
    { value: 'slash', label: 'Slash  /' },
  ],
};

const SHOW_DATES_OPTION: OptionDef = { key: 'showDates', label: 'Show dates', kind: 'switch' };

const LINK_DISPLAY_OPTION: OptionDef = {
  key: 'linkDisplay',
  label: 'Links in header',
  kind: 'select',
  choices: [
    { value: 'primary', label: 'Primary link' },
    { value: 'all', label: 'All links' },
    { value: 'none', label: 'Hidden' },
  ],
};

const LIST_LAYOUT_OPTION: OptionDef = {
  key: 'listLayout',
  label: 'Layout',
  kind: 'select',
  choices: [
    { value: 'inline', label: 'Single line' },
    { value: 'stacked', label: 'One per row' },
  ],
};

function def<T extends SectionType>(d: SectionDefinition<T>): SectionDefinition<T> {
  return d;
}

export const SECTION_DEFINITIONS: { [T in SectionType]: SectionDefinition<T> } = {
  summary: def({
    type: 'summary',
    label: 'Summary',
    description: 'A short professional introduction.',
    defaultTitle: 'Summary',
    icon: 'align-left',
    entryNoun: 'summary',
    singleEntry: true,
    createEntry: () => ({ id: createId(), text: '' }),
    fields: () => [{ key: 'text', label: 'Summary', kind: 'textarea', span: 2 }],
    entryTitle: (e) => e.text.slice(0, 60) || 'Summary',
    entrySubtitle: () => '',
    defaultOptions: {},
    options: [],
  }),
  education: def({
    type: 'education',
    label: 'Education',
    description: 'Degrees, schools and academic results.',
    defaultTitle: 'Education',
    icon: 'graduation-cap',
    entryNoun: 'education',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      degree: '',
      institution: '',
      location: '',
      dates: range(),
      gpa: '',
      gpaLabel: 'GPA',
      gpaScale: '',
      description: '',
      details: [],
    }),
    fields: () => [
      {
        key: 'degree',
        label: 'Degree',
        kind: 'text',
        span: 2,
        placeholder: 'Bachelor of Science in Software Engineering',
      },
      { key: 'institution', label: 'Institution', kind: 'text', placeholder: 'University name' },
      { key: 'location', label: 'Location', kind: 'text', placeholder: 'City, Country' },
      {
        key: 'dates',
        label: 'Dates',
        kind: 'date-range',
        span: 2,
        currentLabel: 'Currently studying',
      },
      { key: 'gpa', label: 'Result', kind: 'text', placeholder: '3.89' },
      {
        key: 'gpaLabel',
        label: 'Shown as',
        kind: 'select',
        choices: [
          { value: 'GPA', label: 'GPA' },
          { value: 'CGPA', label: 'CGPA' },
          { value: 'Grade', label: 'Grade' },
          { value: 'Percentage', label: 'Percentage' },
        ],
      },
      {
        key: 'gpaScale',
        label: 'Out of (optional)',
        kind: 'text',
        placeholder: '4.00',
        hint: 'Printed after the result, e.g. 3.89/4.00',
      },
      {
        key: 'description',
        label: 'Description',
        kind: 'textarea',
        span: 2,
        placeholder: 'Relevant coursework, thesis, honours…',
      },
      { key: 'details', label: 'Additional details', kind: 'bullets', span: 2 },
    ],
    entryTitle: (e) => e.degree || e.institution || 'Untitled education',
    entrySubtitle: (e) => (e.degree ? e.institution : ''),
    defaultOptions: { showDates: true },
    options: [SHOW_DATES_OPTION],
  }),
  experience: def({
    type: 'experience',
    label: 'Experience',
    description: 'Jobs, internships and freelance work.',
    defaultTitle: 'Experience',
    icon: 'briefcase',
    entryNoun: 'position',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      role: '',
      company: '',
      location: '',
      employmentType: '',
      url: '',
      dates: range(),
      description: '',
      bullets: [],
    }),
    fields: () => [
      { key: 'role', label: 'Job title', kind: 'text', placeholder: 'Software Engineering Intern' },
      { key: 'company', label: 'Company', kind: 'text', placeholder: 'Company name' },
      { key: 'location', label: 'Location', kind: 'text', placeholder: 'Remote' },
      {
        key: 'employmentType',
        label: 'Employment type',
        kind: 'select',
        choices: [
          { value: '', label: 'Not shown' },
          { value: 'Full-time', label: 'Full-time' },
          { value: 'Part-time', label: 'Part-time' },
          { value: 'Internship', label: 'Internship' },
          { value: 'Contract', label: 'Contract' },
          { value: 'Freelance', label: 'Freelance' },
          { value: 'Volunteer', label: 'Volunteer' },
        ],
      },
      {
        key: 'dates',
        label: 'Dates',
        kind: 'date-range',
        span: 2,
        currentLabel: 'I currently work here',
      },
      { key: 'url', label: 'Company website', kind: 'url', span: 2, placeholder: 'company.com' },
      { key: 'description', label: 'Description', kind: 'textarea', span: 2 },
      { key: 'bullets', label: 'Highlights', kind: 'bullets', span: 2 },
    ],
    entryTitle: (e) => e.role || e.company || 'Untitled position',
    entrySubtitle: (e) => (e.role ? e.company : ''),
    defaultOptions: { showDates: true, linkDisplay: 'none' },
    options: [SHOW_DATES_OPTION, { ...LINK_DISPLAY_OPTION, label: 'Company link' }],
  }),
  projects: def({
    type: 'projects',
    label: 'Projects',
    description: 'Software, research or academic projects.',
    defaultTitle: 'Projects',
    icon: 'folder-git',
    entryNoun: 'project',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      name: '',
      kind: '',
      role: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      otherUrl: '',
      dates: range(),
      description: '',
      bullets: [],
    }),
    fields: () => [
      { key: 'name', label: 'Project name', kind: 'text', placeholder: 'Markdown Viewer' },
      { key: 'kind', label: 'Project type', kind: 'text', placeholder: 'Desktop App' },
      { key: 'role', label: 'Role', kind: 'text', span: 2, placeholder: 'Backend lead, team of 2' },
      {
        key: 'technologies',
        label: 'Technologies',
        kind: 'tags',
        span: 2,
        placeholder: 'Add a technology and press Enter',
      },
      { key: 'githubUrl', label: 'GitHub URL', kind: 'url', placeholder: 'github.com/you/project' },
      { key: 'liveUrl', label: 'Live URL', kind: 'url', placeholder: 'project.vercel.app' },
      {
        key: 'otherUrl',
        label: 'Other URL',
        kind: 'url',
        span: 2,
        placeholder: 'Demo video, paper, store listing…',
      },
      { key: 'dates', label: 'Dates', kind: 'date-range', span: 2, currentLabel: 'Ongoing' },
      { key: 'description', label: 'Short description', kind: 'textarea', span: 2 },
      { key: 'bullets', label: 'Highlights', kind: 'bullets', span: 2 },
    ],
    entryTitle: (e) => e.name || 'Untitled project',
    entrySubtitle: (e) => e.kind,
    defaultOptions: { showTechnologies: true, linkDisplay: 'primary', showDates: false },
    options: [
      { key: 'showTechnologies', label: 'Show technologies', kind: 'switch' },
      LINK_DISPLAY_OPTION,
      SHOW_DATES_OPTION,
      SEPARATOR_OPTION,
    ],
  }),
  skills: def({
    type: 'skills',
    label: 'Technical Skills',
    description: 'Grouped skills such as languages, frameworks and tools.',
    defaultTitle: 'Technical Skills',
    icon: 'wrench',
    entryNoun: 'category',
    singleEntry: false,
    createEntry: () => ({ id: createId(), name: '', skills: [] }),
    fields: () => [
      { key: 'name', label: 'Category', kind: 'text', span: 2, placeholder: 'Languages' },
      {
        key: 'skills',
        label: 'Skills',
        kind: 'tags',
        span: 2,
        placeholder: 'Add a skill and press Enter',
      },
    ],
    entryTitle: (e) => e.name || 'Untitled category',
    entrySubtitle: (e) => `${e.skills.length} ${e.skills.length === 1 ? 'skill' : 'skills'}`,
    defaultOptions: { skillsLayout: 'table', separator: 'comma' },
    options: [
      {
        key: 'skillsLayout',
        label: 'Layout',
        kind: 'select',
        choices: [
          { value: 'table', label: 'Category column' },
          { value: 'inline', label: 'Inline label' },
        ],
      },
      SEPARATOR_OPTION,
    ],
  }),
  achievements: def({
    type: 'achievements',
    label: 'Achievements',
    description: 'Quantified results, rankings and problem-solving stats.',
    defaultTitle: 'Problem Solving',
    icon: 'trophy',
    entryNoun: 'achievement',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      kind: 'stat',
      value: '',
      label: '',
      description: '',
      text: '',
    }),
    fields: (e: AchievementEntry) =>
      e.kind === 'stat'
        ? [
            { key: 'value', label: 'Figure', kind: 'text', placeholder: '1,050+' },
            { key: 'label', label: 'Label', kind: 'text', placeholder: 'LeetCode problems solved' },
            {
              key: 'description',
              label: 'Description',
              kind: 'text',
              span: 2,
              placeholder: 'Optional supporting detail',
            },
          ]
        : [{ key: 'text', label: 'Achievement', kind: 'textarea', span: 2 }],
    entryTitle: (e) =>
      e.kind === 'stat'
        ? [e.value, e.label].filter(Boolean).join(' ') || 'Untitled figure'
        : e.text.slice(0, 60) || 'Untitled achievement',
    entrySubtitle: (e) => (e.kind === 'stat' ? 'Figure' : 'Text'),
    defaultOptions: { statColumns: 3, textAsBullets: false },
    options: [
      {
        key: 'statColumns',
        label: 'Figures per row',
        kind: 'select',
        choices: [
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
        ],
      },
      { key: 'textAsBullets', label: 'Text as bullets', kind: 'switch' },
    ],
  }),
  certifications: def({
    type: 'certifications',
    label: 'Certifications',
    description: 'Licences and professional certificates.',
    defaultTitle: 'Certifications',
    icon: 'badge-check',
    entryNoun: 'certification',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      name: '',
      issuer: '',
      date: '',
      credentialId: '',
      url: '',
      description: '',
    }),
    fields: () => [
      {
        key: 'name',
        label: 'Certification',
        kind: 'text',
        span: 2,
        placeholder: 'AWS Certified Cloud Practitioner',
      },
      { key: 'issuer', label: 'Issuer', kind: 'text', placeholder: 'Amazon Web Services' },
      { key: 'date', label: 'Issued', kind: 'date' },
      { key: 'credentialId', label: 'Credential ID', kind: 'text' },
      { key: 'url', label: 'Verification URL', kind: 'url' },
      { key: 'description', label: 'Description', kind: 'textarea', span: 2 },
    ],
    entryTitle: (e) => e.name || 'Untitled certification',
    entrySubtitle: (e) => e.issuer,
    defaultOptions: { showDates: true },
    options: [SHOW_DATES_OPTION],
  }),
  awards: def({
    type: 'awards',
    label: 'Awards',
    description: 'Honours, scholarships and competition results.',
    defaultTitle: 'Awards',
    icon: 'award',
    entryNoun: 'award',
    singleEntry: false,
    createEntry: () => ({ id: createId(), title: '', issuer: '', date: '', description: '' }),
    fields: () => [
      { key: 'title', label: 'Award', kind: 'text', span: 2, placeholder: "Dean's Honour List" },
      { key: 'issuer', label: 'Awarded by', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'description', label: 'Description', kind: 'textarea', span: 2 },
    ],
    entryTitle: (e) => e.title || 'Untitled award',
    entrySubtitle: (e) => e.issuer,
    defaultOptions: { showDates: true },
    options: [SHOW_DATES_OPTION],
  }),
  publications: def({
    type: 'publications',
    label: 'Publications',
    description: 'Papers, articles and talks.',
    defaultTitle: 'Publications',
    icon: 'book-open',
    entryNoun: 'publication',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      title: '',
      publisher: '',
      authors: '',
      date: '',
      url: '',
      description: '',
    }),
    fields: () => [
      { key: 'title', label: 'Title', kind: 'text', span: 2 },
      { key: 'publisher', label: 'Publisher / venue', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'authors', label: 'Authors', kind: 'text', span: 2 },
      { key: 'url', label: 'URL', kind: 'url', span: 2 },
      { key: 'description', label: 'Description', kind: 'textarea', span: 2 },
    ],
    entryTitle: (e) => e.title || 'Untitled publication',
    entrySubtitle: (e) => e.publisher,
    defaultOptions: { showDates: true },
    options: [SHOW_DATES_OPTION],
  }),
  languages: def({
    type: 'languages',
    label: 'Languages',
    description: 'Spoken languages and proficiency.',
    defaultTitle: 'Languages',
    icon: 'languages',
    entryNoun: 'language',
    singleEntry: false,
    createEntry: () => ({ id: createId(), name: '', proficiency: '' }),
    fields: () => [
      { key: 'name', label: 'Language', kind: 'text', placeholder: 'English' },
      {
        key: 'proficiency',
        label: 'Proficiency',
        kind: 'select',
        choices: [
          { value: '', label: 'Not shown' },
          { value: 'Native', label: 'Native' },
          { value: 'Fluent', label: 'Fluent' },
          { value: 'Professional', label: 'Professional' },
          { value: 'Conversational', label: 'Conversational' },
          { value: 'Basic', label: 'Basic' },
        ],
      },
    ],
    entryTitle: (e) => e.name || 'Untitled language',
    entrySubtitle: (e) => e.proficiency,
    defaultOptions: { listLayout: 'inline', separator: 'comma' },
    options: [LIST_LAYOUT_OPTION, SEPARATOR_OPTION],
  }),
  interests: def({
    type: 'interests',
    label: 'Interests',
    description: 'Hobbies and interests outside work.',
    defaultTitle: 'Interests',
    icon: 'heart',
    entryNoun: 'interest',
    singleEntry: false,
    createEntry: () => ({ id: createId(), name: '' }),
    fields: () => [{ key: 'name', label: 'Interest', kind: 'text', span: 2 }],
    entryTitle: (e) => e.name || 'Untitled interest',
    entrySubtitle: () => '',
    defaultOptions: { listLayout: 'inline', separator: 'comma' },
    options: [LIST_LAYOUT_OPTION, SEPARATOR_OPTION],
  }),
  custom: def({
    type: 'custom',
    label: 'Custom Section',
    description: 'Anything else: open source, volunteering, leadership…',
    defaultTitle: 'Open Source',
    icon: 'puzzle',
    entryNoun: 'entry',
    singleEntry: false,
    createEntry: () => ({
      id: createId(),
      title: '',
      subtitle: '',
      location: '',
      url: '',
      dates: range(),
      description: '',
      bullets: [],
    }),
    fields: () => [
      { key: 'title', label: 'Title', kind: 'text', placeholder: 'Project or organisation' },
      { key: 'subtitle', label: 'Subtitle', kind: 'text', placeholder: 'Role or context' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'url', label: 'URL', kind: 'url' },
      { key: 'dates', label: 'Dates', kind: 'date-range', span: 2, currentLabel: 'Ongoing' },
      { key: 'description', label: 'Description', kind: 'textarea', span: 2 },
      { key: 'bullets', label: 'Highlights', kind: 'bullets', span: 2 },
    ],
    entryTitle: (e) => e.title || 'Untitled entry',
    entrySubtitle: (e) => e.subtitle,
    defaultOptions: { showDates: true, linkDisplay: 'primary' },
    options: [SHOW_DATES_OPTION, { ...LINK_DISPLAY_OPTION, label: 'Link' }],
  }),
};

/** Order in which section types are offered in "Add section" menus. */
export const SECTION_MENU_ORDER: SectionType[] = [
  'summary',
  'education',
  'experience',
  'projects',
  'skills',
  'achievements',
  'certifications',
  'awards',
  'publications',
  'languages',
  'interests',
  'custom',
];

export function getSectionDefinition<T extends SectionType>(type: T): SectionDefinition<T> {
  return SECTION_DEFINITIONS[type] as SectionDefinition<T>;
}

/** Resolved options: the section's own values over the type defaults. */
export function sectionOptions(section: Section): Required<SectionOptions> {
  const defaults = SECTION_DEFINITIONS[section.type].defaultOptions;
  return {
    showTitle: true,
    skillsLayout: 'table',
    separator: 'comma',
    statColumns: 3,
    textAsBullets: false,
    showTechnologies: true,
    linkDisplay: 'primary',
    showDates: true,
    listLayout: 'inline',
    ...defaults,
    ...stripUndefined(section.options),
  };
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function createSection<T extends SectionType>(type: T, title?: string): SectionOf<T> {
  const d = getSectionDefinition(type);
  return {
    id: createId(),
    type,
    title: title ?? d.defaultTitle,
    visible: true,
    entries: d.singleEntry ? [d.createEntry()] : [],
    options: {},
  } as unknown as SectionOf<T>;
}

export function createEntry<T extends SectionType>(type: T): EntryOf<T> {
  return getSectionDefinition(type).createEntry();
}

export function entryTitle(section: Section, entry: AnyEntry): string {
  const d = SECTION_DEFINITIONS[section.type] as SectionDefinition;
  return d.entryTitle(entry as never);
}

export function entrySubtitle(section: Section, entry: AnyEntry): string {
  const d = SECTION_DEFINITIONS[section.type] as SectionDefinition;
  return d.entrySubtitle(entry as never);
}

export function entryFields(section: Section, entry: AnyEntry): FieldDef[] {
  const d = SECTION_DEFINITIONS[section.type] as SectionDefinition;
  return d.fields(entry as never);
}
