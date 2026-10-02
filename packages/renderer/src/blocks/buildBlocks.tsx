import type { ReactNode } from 'react';
import {
  contactHref,
  contactText,
  formatDateRange,
  formatPartialDate,
  LINK_CONTACT_KINDS,
  sectionOptions,
  type AchievementEntry,
  type DocumentSettings,
  type Resume,
  type Section,
  type SectionOf,
} from '@resumeforge/core';
import { ptToPx } from '../units';
import {
  CompactLink,
  EntryFragment,
  EntryHead,
  Joined,
  joinedLine,
  Link,
  RichText,
  SEPARATORS,
  visibleBulletCount,
} from './parts';
import { atomProps, type DocBlock } from './types';

export interface BuildContext {
  settings: DocumentSettings;
}

type Options = ReturnType<typeof sectionOptions>;

/** Convert a resume into the ordered list of blocks the paginator places. */
export function buildBlocks(resume: Resume, ctx: BuildContext): DocBlock[] {
  const blocks: DocBlock[] = [headerBlock(resume, ctx)];
  for (const section of resume.sections) {
    if (!section.visible) continue;
    const body = sectionBody(section, ctx);
    if (body.length === 0) continue;
    const options = sectionOptions(section);
    const sectionSpace = ptToPx(ctx.settings.spacing.section);
    if (options.showTitle && section.title.trim()) {
      blocks.push({
        key: `${section.id}:title`,
        kind: 'section-title',
        sectionId: section.id,
        spaceBefore: sectionSpace,
        keepWithNext: true,
        atomCount: 1,
        render: () => (
          <h2 className="rf-section-title" {...atomProps}>
            {section.title.trim()}
          </h2>
        ),
      });
    } else {
      body[0]!.spaceBefore = sectionSpace;
    }
    blocks.push(...body);
  }
  return blocks;
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function headerBlock(resume: Resume, ctx: BuildContext): DocBlock {
  const { personalInfo } = resume;
  const contacts = personalInfo.contacts.filter((c) => c.visible && c.value.trim());
  const details = contacts.filter((c) => !LINK_CONTACT_KINDS.has(c.kind));
  const links = contacts.filter((c) => LINK_CONTACT_KINDS.has(c.kind));
  const rows =
    ctx.settings.header.contactLayout === 'single-line' ? [contacts] : [details, links].filter((r) => r.length > 0);

  return {
    key: 'header',
    kind: 'header',
    sectionId: null,
    spaceBefore: 0,
    keepWithNext: false,
    atomCount: 1,
    render: () => (
      <header className="rf-header" data-section-id="__header" {...atomProps}>
        <h1 className="rf-name">{personalInfo.fullName.trim() || 'Your Name'}</h1>
        {ctx.settings.header.showHeadline && personalInfo.headline.trim() ? (
          <p className="rf-headline">{personalInfo.headline.trim()}</p>
        ) : null}
        {rows.length > 0 && (
          <div className="rf-contacts">
            {rows.map((row, i) => (
              <ul className="rf-contact-row" key={i}>
                {row.map((item) => {
                  const href = contactHref(item);
                  const text = contactText(item);
                  return (
                    <li key={item.id} className={`rf-contact rf-contact--${item.kind}`}>
                      {href ? (
                        <a className="rf-link" href={href} target="_blank" rel="noopener noreferrer">
                          {text}
                        </a>
                      ) : (
                        text
                      )}
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        )}
      </header>
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

function sectionBody(section: Section, ctx: BuildContext): DocBlock[] {
  const options = sectionOptions(section);
  switch (section.type) {
    case 'summary':
      return summaryBlocks(section);
    case 'education':
      return educationBlocks(section, options, ctx);
    case 'experience':
      return experienceBlocks(section, options, ctx);
    case 'projects':
      return projectBlocks(section, options, ctx);
    case 'skills':
      return skillsBlocks(section, options);
    case 'achievements':
      return achievementBlocks(section, options, ctx);
    case 'certifications':
      return certificationBlocks(section, options, ctx);
    case 'awards':
      return awardBlocks(section, options, ctx);
    case 'publications':
      return publicationBlocks(section, options, ctx);
    case 'languages':
      return languageBlocks(section, options);
    case 'interests':
      return interestBlocks(section, options);
    case 'custom':
      return customBlocks(section, options, ctx);
  }
}

/** Spacing for the n-th entry of a section: the heading already provides the first gap. */
function entrySpace(index: number, ctx: BuildContext): number {
  return index === 0 ? 0 : ptToPx(ctx.settings.spacing.entry);
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** A block holding one entry: a head atom and one atom per bullet. */
function entryBlock(
  section: Section,
  entryId: string,
  index: number,
  ctx: BuildContext,
  head: ReactNode,
  bullets: { id: string; text: string }[],
): DocBlock {
  return {
    key: entryId,
    kind: 'entry',
    sectionId: section.id,
    entryId,
    spaceBefore: entrySpace(index, ctx),
    keepWithNext: false,
    atomCount: 1 + visibleBulletCount(bullets),
    render: ({ from, to, continued }) => (
      <EntryFragment entryId={entryId} head={head} bullets={bullets} from={from} to={to} continued={continued} />
    ),
  };
}

function dateAside(range: { start: string; end: string; current: boolean }, options: Options, ctx: BuildContext) {
  if (!options.showDates) return null;
  const text = formatDateRange(range, ctx.settings.dateFormat);
  return text ? <span className="rf-date">{text}</span> : null;
}

function singleDateAside(date: string, options: Options, ctx: BuildContext) {
  if (!options.showDates || !date.trim()) return null;
  return <span className="rf-date">{formatPartialDate(date, ctx.settings.dateFormat)}</span>;
}

function summaryBlocks(section: SectionOf<'summary'>): DocBlock[] {
  const text = section.entries.map((e) => e.text).join('\n\n');
  const paras = paragraphs(text);
  if (paras.length === 0) return [];
  const entryId = section.entries[0]?.id;
  return [
    {
      key: `${section.id}:summary`,
      kind: 'text',
      sectionId: section.id,
      entryId,
      spaceBefore: 0,
      keepWithNext: false,
      atomCount: paras.length,
      render: ({ from, to }) => (
        <div className="rf-summary" data-entry-id={entryId}>
          {paras.slice(from, to).map((p, i) => (
            <p className="rf-paragraph" key={from + i} {...atomProps}>
              <RichText text={p} />
            </p>
          ))}
        </div>
      ),
    },
  ];
}

function educationBlocks(section: SectionOf<'education'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const result = e.gpa.trim()
      ? e.gpaLabel === 'Percentage'
        ? `${e.gpa.trim()}%`
        : `${e.gpaLabel || 'GPA'} ${e.gpa.trim()}${e.gpaScale.trim() ? `/${e.gpaScale.trim()}` : ''}`
      : '';
    const head = (
      <EntryHead
        title={e.degree.trim() || e.institution.trim() || 'Untitled education'}
        aside={dateAside(e.dates, options, ctx)}
        lines={[
          joinedLine([e.degree.trim() ? e.institution.trim() : '', e.location.trim(), result]),
        ]}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, e.details);
  });
}

function experienceBlocks(section: SectionOf<'experience'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const link = options.linkDisplay !== 'none' && e.url.trim() ? <CompactLink url={e.url} /> : null;
    const head = (
      <EntryHead
        title={e.role.trim() || e.company.trim() || 'Untitled position'}
        meta={[e.employmentType.trim()]}
        aside={dateAside(e.dates, options, ctx)}
        lines={[joinedLine([e.role.trim() ? e.company.trim() : '', e.location.trim(), link])]}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, e.bullets);
  });
}

function projectBlocks(section: SectionOf<'projects'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const urls = [e.githubUrl, e.liveUrl, e.otherUrl].filter((u) => u.trim());
    const shownUrls = options.linkDisplay === 'none' ? [] : options.linkDisplay === 'all' ? urls : urls.slice(0, 1);
    const date = options.showDates ? formatDateRange(e.dates, ctx.settings.dateFormat) : '';
    const asideItems: ReactNode[] = [
      ...shownUrls.map((u) => <CompactLink key={u} url={u} />),
      date ? <span className="rf-date">{date}</span> : null,
    ];
    const tech = options.showTechnologies ? e.technologies.filter((t) => t.trim()) : [];
    const head = (
      <EntryHead
        title={e.name.trim() || 'Untitled project'}
        meta={[e.kind.trim(), e.role.trim()]}
        aside={asideItems.some(Boolean) ? <Joined items={asideItems} separator="  ·  " /> : null}
        lines={
          tech.length
            ? [<span className="rf-tech" key="t">{tech.join(SEPARATORS[options.separator])}</span>]
            : []
        }
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, e.bullets);
  });
}

function skillsBlocks(section: SectionOf<'skills'>, options: Options): DocBlock[] {
  const rows = section.entries.filter((c) => c.name.trim() || c.skills.some((s) => s.trim()));
  if (rows.length === 0) return [];
  const longest = Math.max(...rows.map((r) => r.name.trim().length), 4);
  const layout = options.skillsLayout;
  const sep = SEPARATORS[options.separator];
  return [
    {
      key: `${section.id}:skills`,
      kind: 'list',
      sectionId: section.id,
      spaceBefore: 0,
      keepWithNext: false,
      atomCount: rows.length,
      render: ({ from, to }) => (
        <div
          className={`rf-skills rf-skills--${layout}`}
          style={{ ['--rf-skill-col' as string]: `${Math.min(longest, 20) * 0.62 + 1.4}em` }}
        >
          {rows.slice(from, to).map((row) => (
            <div className="rf-skill-row" key={row.id} data-entry-id={row.id} {...atomProps}>
              <span className="rf-skill-name">
                {row.name.trim()}
                {layout === 'inline' && row.name.trim() ? ':' : ''}
              </span>{' '}
              <span className="rf-skill-list">{row.skills.filter((s) => s.trim()).join(sep)}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

function achievementBlocks(section: SectionOf<'achievements'>, options: Options, ctx: BuildContext): DocBlock[] {
  // Consecutive figures share a grid; consecutive text items share a group.
  const groups: { kind: 'stat' | 'text'; items: AchievementEntry[] }[] = [];
  for (const entry of section.entries) {
    const empty = entry.kind === 'stat' ? !entry.value.trim() && !entry.label.trim() : !entry.text.trim();
    if (empty) continue;
    const last = groups[groups.length - 1];
    if (last && last.kind === entry.kind) last.items.push(entry);
    else groups.push({ kind: entry.kind, items: [entry] });
  }
  const columns = options.statColumns;
  return groups.map((group, gi) => {
    const spaceBefore = gi === 0 ? 0 : ptToPx(ctx.settings.spacing.entry);
    if (group.kind === 'stat') {
      const rows: AchievementEntry[][] = [];
      for (let i = 0; i < group.items.length; i += columns) rows.push(group.items.slice(i, i + columns));
      return {
        key: `${section.id}:stats:${group.items[0]!.id}`,
        kind: 'stats',
        sectionId: section.id,
        spaceBefore,
        keepWithNext: false,
        atomCount: rows.length,
        render: ({ from, to }) => (
          <div className="rf-stats" style={{ ['--rf-stat-cols' as string]: columns }}>
            {rows.slice(from, to).map((row, ri) => (
              <div className="rf-stat-row" key={from + ri} {...atomProps}>
                {row.map((s) => (
                  <div className="rf-stat" key={s.id} data-entry-id={s.id}>
                    <div className="rf-stat-value">{s.value.trim()}</div>
                    {s.label.trim() && <div className="rf-stat-label">{s.label.trim()}</div>}
                    {s.description.trim() && <div className="rf-stat-desc">{s.description.trim()}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ),
      } satisfies DocBlock;
    }
    return {
      key: `${section.id}:text:${group.items[0]!.id}`,
      kind: 'text',
      sectionId: section.id,
      spaceBefore,
      keepWithNext: false,
      atomCount: group.items.length,
      render: ({ from, to }) =>
        options.textAsBullets ? (
          <ul className="rf-bullets rf-achievement-list">
            {group.items.slice(from, to).map((item) => (
              <li key={item.id} data-entry-id={item.id} {...atomProps}>
                <RichText text={item.text.trim()} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rf-achievement-text">
            {group.items.slice(from, to).map((item) => (
              <p className="rf-paragraph" key={item.id} data-entry-id={item.id} {...atomProps}>
                <RichText text={item.text.trim()} />
              </p>
            ))}
          </div>
        ),
    } satisfies DocBlock;
  });
}

function certificationBlocks(section: SectionOf<'certifications'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const head = (
      <EntryHead
        title={e.name.trim() || 'Untitled certification'}
        meta={[e.issuer.trim()]}
        aside={singleDateAside(e.date, options, ctx)}
        lines={[
          joinedLine([
              e.credentialId.trim() ? `Credential ${e.credentialId.trim()}` : '',
              e.url.trim() ? <CompactLink url={e.url} /> : null,
            ]),
        ]}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, []);
  });
}

function awardBlocks(section: SectionOf<'awards'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const head = (
      <EntryHead
        title={e.title.trim() || 'Untitled award'}
        meta={[e.issuer.trim()]}
        aside={singleDateAside(e.date, options, ctx)}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, []);
  });
}

function publicationBlocks(section: SectionOf<'publications'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const head = (
      <EntryHead
        title={e.url.trim() ? <Link href={e.url}>{e.title.trim() || 'Untitled publication'}</Link> : e.title.trim() || 'Untitled publication'}
        aside={singleDateAside(e.date, options, ctx)}
        lines={[joinedLine([e.authors.trim(), e.publisher.trim()])]}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, []);
  });
}

function customBlocks(section: SectionOf<'custom'>, options: Options, ctx: BuildContext): DocBlock[] {
  return section.entries.map((e, i) => {
    const link = options.linkDisplay !== 'none' && e.url.trim() ? <CompactLink url={e.url} /> : null;
    const head = (
      <EntryHead
        title={e.title.trim() || 'Untitled entry'}
        meta={[e.subtitle.trim()]}
        aside={dateAside(e.dates, options, ctx)}
        lines={[joinedLine([e.location.trim(), link])]}
        description={e.description}
      />
    );
    return entryBlock(section, e.id, i, ctx, head, e.bullets);
  });
}

function keyValueBlocks(
  section: Section,
  options: Options,
  items: { id: string; key: string; value: string }[],
): DocBlock[] {
  const present = items.filter((item) => item.key.trim());
  if (present.length === 0) return [];
  const sep = SEPARATORS[options.separator];
  if (options.listLayout === 'inline') {
    return [
      {
        key: `${section.id}:list`,
        kind: 'list',
        sectionId: section.id,
        spaceBefore: 0,
        keepWithNext: false,
        atomCount: 1,
        render: () => (
          <p className="rf-inline-list" {...atomProps}>
            {present.map((item, i) => (
              <span key={item.id} data-entry-id={item.id}>
                {i > 0 && <span className="rf-sep">{sep}</span>}
                <span className="rf-inline-key">{item.key.trim()}</span>
                {item.value.trim() && <span className="rf-inline-value"> ({item.value.trim()})</span>}
              </span>
            ))}
          </p>
        ),
      },
    ];
  }
  return [
    {
      key: `${section.id}:list`,
      kind: 'list',
      sectionId: section.id,
      spaceBefore: 0,
      keepWithNext: false,
      atomCount: present.length,
      render: ({ from, to }) => (
        <div className="rf-kv-list">
          {present.slice(from, to).map((item) => (
            <div className="rf-kv" key={item.id} data-entry-id={item.id} {...atomProps}>
              <span className="rf-kv-key">{item.key.trim()}</span>
              {item.value.trim() && <span className="rf-kv-value">{item.value.trim()}</span>}
            </div>
          ))}
        </div>
      ),
    },
  ];
}

function languageBlocks(section: SectionOf<'languages'>, options: Options): DocBlock[] {
  return keyValueBlocks(
    section,
    options,
    section.entries.map((e) => ({ id: e.id, key: e.name, value: e.proficiency })),
  );
}

function interestBlocks(section: SectionOf<'interests'>, options: Options): DocBlock[] {
  return keyValueBlocks(
    section,
    options,
    section.entries.map((e) => ({ id: e.id, key: e.name, value: '' })),
  );
}
