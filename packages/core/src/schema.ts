import { z } from 'zod';
import { FONT_IDS } from './fonts';

/**
 * The resume schema is the single source of truth for the document model.
 * Types are inferred from it, and every field carries a default so that older
 * or partially written documents parse into a complete shape.
 *
 * Bump SCHEMA_VERSION and add a step to `migrate.ts` whenever a change cannot
 * be expressed through defaults alone.
 */
export const SCHEMA_VERSION = 1;

export const TEMPLATE_IDS = ['classic', 'modern', 'minimal'] as const;
export const SECTION_TYPES = [
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
] as const;
export const CONTACT_KINDS = [
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'github',
  'portfolio',
  'leetcode',
  'other',
] as const;

const str = () => z.string().default('');
const id = () => z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

/** Dates are partial ISO strings: `YYYY`, `YYYY-MM` or empty. */
export const DateRangeSchema = z
  .object({
    start: str(),
    end: str(),
    current: z.boolean().default(false),
  })
  .prefault({});

export const BulletSchema = z.object({
  id: id(),
  text: str(),
});

export const ContactItemSchema = z.object({
  id: id(),
  kind: z.enum(CONTACT_KINDS).default('other'),
  value: str(),
  /** Optional display text. When empty the renderer derives one from the value. */
  label: str(),
  visible: z.boolean().default(true),
});

export const PersonalInfoSchema = z
  .object({
    fullName: str(),
    headline: str(),
    contacts: z.array(ContactItemSchema).default([]),
  })
  .prefault({});

/* -------------------------------------------------------------------------- */
/* Section entries                                                            */
/* -------------------------------------------------------------------------- */

export const SummaryEntrySchema = z.object({ id: id(), text: str() });

export const EducationEntrySchema = z.object({
  id: id(),
  degree: str(),
  institution: str(),
  location: str(),
  dates: DateRangeSchema,
  gpa: str(),
  gpaScale: str(),
  description: str(),
  details: z.array(BulletSchema).default([]),
});

export const ExperienceEntrySchema = z.object({
  id: id(),
  role: str(),
  company: str(),
  location: str(),
  employmentType: str(),
  url: str(),
  dates: DateRangeSchema,
  description: str(),
  bullets: z.array(BulletSchema).default([]),
});

export const ProjectEntrySchema = z.object({
  id: id(),
  name: str(),
  /** Short descriptor such as "Desktop App" or a course name. */
  kind: str(),
  role: str(),
  technologies: z.array(z.string()).default([]),
  githubUrl: str(),
  liveUrl: str(),
  otherUrl: str(),
  dates: DateRangeSchema,
  description: str(),
  bullets: z.array(BulletSchema).default([]),
});

export const SkillCategorySchema = z.object({
  id: id(),
  name: str(),
  skills: z.array(z.string()).default([]),
});

export const AchievementEntrySchema = z.object({
  id: id(),
  /** `stat` renders as a figure card, `text` as a paragraph or bullet. */
  kind: z.enum(['stat', 'text']).default('text'),
  value: str(),
  label: str(),
  description: str(),
  text: str(),
});

export const CertificationEntrySchema = z.object({
  id: id(),
  name: str(),
  issuer: str(),
  date: str(),
  credentialId: str(),
  url: str(),
  description: str(),
});

export const AwardEntrySchema = z.object({
  id: id(),
  title: str(),
  issuer: str(),
  date: str(),
  description: str(),
});

export const PublicationEntrySchema = z.object({
  id: id(),
  title: str(),
  publisher: str(),
  authors: str(),
  date: str(),
  url: str(),
  description: str(),
});

export const LanguageEntrySchema = z.object({
  id: id(),
  name: str(),
  proficiency: str(),
});

export const InterestEntrySchema = z.object({
  id: id(),
  name: str(),
});

export const CustomEntrySchema = z.object({
  id: id(),
  title: str(),
  subtitle: str(),
  location: str(),
  url: str(),
  dates: DateRangeSchema,
  description: str(),
  bullets: z.array(BulletSchema).default([]),
});

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

export const SectionOptionsSchema = z
  .object({
    /** Skills: category table or one run-on line per category. */
    skillsLayout: z.enum(['table', 'inline']).optional(),
    /** Separator between list items (skills, technologies, languages...). */
    separator: z.enum(['comma', 'dot', 'pipe', 'slash']).optional(),
    /** Achievements: figure cards per row. */
    statColumns: z.number().int().min(1).max(4).optional(),
    /** Achievements: render text items as bullets instead of paragraphs. */
    textAsBullets: z.boolean().optional(),
    /** Projects: show the technology line. */
    showTechnologies: z.boolean().optional(),
    /** Projects / experience: which links appear in the entry header. */
    linkDisplay: z.enum(['primary', 'all', 'none']).optional(),
    /** Show dates on the right-hand side of entries. */
    showDates: z.boolean().optional(),
    /** Languages / interests: comma separated line or one per row. */
    listLayout: z.enum(['inline', 'stacked']).optional(),
  })
  .prefault({});

function section<T extends string, E extends z.ZodTypeAny>(type: T, entry: E) {
  return z.object({
    id: id(),
    type: z.literal(type),
    title: str(),
    visible: z.boolean().default(true),
    entries: z.array(entry).default([]),
    options: SectionOptionsSchema,
  });
}

export const SummarySectionSchema = section('summary', SummaryEntrySchema);
export const EducationSectionSchema = section('education', EducationEntrySchema);
export const ExperienceSectionSchema = section('experience', ExperienceEntrySchema);
export const ProjectsSectionSchema = section('projects', ProjectEntrySchema);
export const SkillsSectionSchema = section('skills', SkillCategorySchema);
export const AchievementsSectionSchema = section('achievements', AchievementEntrySchema);
export const CertificationsSectionSchema = section('certifications', CertificationEntrySchema);
export const AwardsSectionSchema = section('awards', AwardEntrySchema);
export const PublicationsSectionSchema = section('publications', PublicationEntrySchema);
export const LanguagesSectionSchema = section('languages', LanguageEntrySchema);
export const InterestsSectionSchema = section('interests', InterestEntrySchema);
export const CustomSectionSchema = section('custom', CustomEntrySchema);

export const SectionSchema = z.discriminatedUnion('type', [
  SummarySectionSchema,
  EducationSectionSchema,
  ExperienceSectionSchema,
  ProjectsSectionSchema,
  SkillsSectionSchema,
  AchievementsSectionSchema,
  CertificationsSectionSchema,
  AwardsSectionSchema,
  PublicationsSectionSchema,
  LanguagesSectionSchema,
  InterestsSectionSchema,
  CustomSectionSchema,
]);

/* -------------------------------------------------------------------------- */
/* Document settings                                                          */
/* -------------------------------------------------------------------------- */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/**
 * Fully resolved document settings. Resumes store only the values the user
 * changed (`SettingsOverrides`); the rest comes from the active template.
 */
export const DocumentSettingsSchema = z.object({
  page: z.object({
    format: z.enum(['A4', 'Letter']),
    orientation: z.enum(['portrait', 'landscape']),
    /** Millimetres. */
    margins: z.object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() }),
    pageNumbers: z.boolean(),
  }),
  typography: z.object({
    bodyFont: z.enum(FONT_IDS),
    headingFont: z.enum(FONT_IDS),
    /** Points. */
    baseSize: z.number(),
    sectionTitleSize: z.number(),
    entryTitleSize: z.number(),
    nameSize: z.number(),
    lineHeight: z.number(),
    /** Em. */
    letterSpacing: z.number(),
    nameWeight: z.number(),
  }),
  /** Points. */
  spacing: z.object({
    section: z.number(),
    entry: z.number(),
    paragraph: z.number(),
    header: z.number(),
  }),
  colors: z.object({
    text: hex,
    secondary: hex,
    accent: hex,
    divider: hex,
  }),
  header: z.object({
    alignment: z.enum(['left', 'center']),
    contactLayout: z.enum(['auto', 'single-line']),
    showHeadline: z.boolean(),
  }),
  dateFormat: z.enum(['year', 'short', 'long', 'numeric']),
  bulletStyle: z.enum(['disc', 'dash', 'square', 'none']),
});

/** Deep-partial overrides stored on a resume. Unknown keys are discarded. */
export const SettingsOverridesSchema = z
  .object({
    page: DocumentSettingsSchema.shape.page
      .extend({ margins: DocumentSettingsSchema.shape.page.shape.margins.partial() })
      .partial(),
    typography: DocumentSettingsSchema.shape.typography.partial(),
    spacing: DocumentSettingsSchema.shape.spacing.partial(),
    colors: DocumentSettingsSchema.shape.colors.partial(),
    header: DocumentSettingsSchema.shape.header.partial(),
    dateFormat: DocumentSettingsSchema.shape.dateFormat,
    bulletStyle: DocumentSettingsSchema.shape.bulletStyle,
  })
  .partial()
  .prefault({});

/* -------------------------------------------------------------------------- */
/* Resume                                                                     */
/* -------------------------------------------------------------------------- */

export const ResumeMetadataSchema = z
  .object({
    title: z.string().default('Untitled resume'),
    /** Cached page count from the most recent render, used by the dashboard. */
    pageCount: z.number().int().min(0).default(0),
    tags: z.array(z.string()).default([]),
  })
  .prefault({});

export const ResumeSchema = z.object({
  id: id(),
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  metadata: ResumeMetadataSchema,
  personalInfo: PersonalInfoSchema,
  sections: z.array(SectionSchema).default([]),
  template: z.enum(TEMPLATE_IDS).catch('classic').default('classic'),
  settings: SettingsOverridesSchema,
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type SectionType = (typeof SECTION_TYPES)[number];
export type ContactKind = (typeof CONTACT_KINDS)[number];

export type DateRange = z.infer<typeof DateRangeSchema>;
export type Bullet = z.infer<typeof BulletSchema>;
export type ContactItem = z.infer<typeof ContactItemSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

export type SummaryEntry = z.infer<typeof SummaryEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type AchievementEntry = z.infer<typeof AchievementEntrySchema>;
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>;
export type AwardEntry = z.infer<typeof AwardEntrySchema>;
export type PublicationEntry = z.infer<typeof PublicationEntrySchema>;
export type LanguageEntry = z.infer<typeof LanguageEntrySchema>;
export type InterestEntry = z.infer<typeof InterestEntrySchema>;
export type CustomEntry = z.infer<typeof CustomEntrySchema>;

export type SectionOptions = z.infer<typeof SectionOptionsSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;
export type EntryOf<T extends SectionType> = SectionOf<T>['entries'][number];
export type AnyEntry = Section['entries'][number];

export type DocumentSettings = z.infer<typeof DocumentSettingsSchema>;
export type SettingsOverrides = z.infer<typeof SettingsOverridesSchema>;
export type ResumeMetadata = z.infer<typeof ResumeMetadataSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

/** Lightweight listing shape used by dashboards and the API. */
export interface ResumeSummary {
  id: string;
  title: string;
  template: TemplateId;
  pageCount: number;
  fullName: string;
  headline: string;
  createdAt: string;
  updatedAt: string;
}

export function toResumeSummary(resume: Resume): ResumeSummary {
  return {
    id: resume.id,
    title: resume.metadata.title,
    template: resume.template,
    pageCount: resume.metadata.pageCount,
    fullName: resume.personalInfo.fullName,
    headline: resume.personalInfo.headline,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}
