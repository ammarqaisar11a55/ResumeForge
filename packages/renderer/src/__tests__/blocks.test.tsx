import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  createDemoResume,
  createEntry,
  createResume,
  createSection,
  resolveSettings,
  type Resume,
} from '@resumeforge/core';
import { buildBlocks } from '../blocks/buildBlocks';
import { buildPrintHtml } from '../print';

const build = (resume: Resume) =>
  buildBlocks(resume, { settings: resolveSettings(resume.template, resume.settings) });
const atomsIn = (html: string) => (html.match(/data-rf-atom=""/g) ?? []).length;

describe('buildBlocks', () => {
  it('declares exactly as many atoms as it renders, for every block', () => {
    const resume = createDemoResume();
    // Add one of every section type so every renderer is covered.
    for (const type of [
      'experience',
      'certifications',
      'awards',
      'publications',
      'languages',
      'interests',
      'custom',
    ] as const) {
      const section = createSection(type);
      section.entries.push(createEntry(type) as never, createEntry(type) as never);
      resume.sections.push(section);
    }
    for (const block of build(resume)) {
      const html = renderToStaticMarkup(
        <>{block.render({ from: 0, to: block.atomCount, continued: false })}</>,
      );
      expect(atomsIn(html), block.key).toBe(block.atomCount);
    }
  });

  it('renders fragments with only the requested atoms', () => {
    const resume = createDemoResume();
    const project = build(resume).find((b) => b.kind === 'entry' && b.atomCount === 3)!;
    const tail = renderToStaticMarkup(<>{project.render({ from: 1, to: 3, continued: true })}</>);
    expect(atomsIn(tail)).toBe(2);
    expect(tail).toContain('data-continued');
    expect(tail).not.toContain('rf-entry-head');
  });

  it('skips hidden and empty sections and keeps headings with content', () => {
    const resume = createResume({ fullName: 'Sam Lee' });
    const blocks = build(resume);
    // Every starter section is empty, so only the header renders.
    expect(blocks.map((b) => b.kind)).toEqual(['header']);

    const skills = createSection('skills');
    skills.entries.push({ id: 'c1', name: 'Languages', skills: ['TypeScript', 'Rust'] });
    resume.sections.push(skills);
    const withSkills = build(resume);
    expect(withSkills.map((b) => b.kind)).toEqual(['header', 'section-title', 'list']);
    expect(withSkills[1]!.keepWithNext).toBe(true);

    skills.visible = false;
    expect(build(resume).map((b) => b.kind)).toEqual(['header']);
  });

  it('omits the heading when showTitle is off and moves the section gap to the body', () => {
    const resume = createDemoResume();
    const blocks = build(resume);
    const summary = resume.sections[0]!;
    expect(blocks.some((b) => b.key === `${summary.id}:title`)).toBe(false);
    expect(blocks[1]!.sectionId).toBe(summary.id);
    expect(blocks[1]!.spaceBefore).toBeGreaterThan(0);
  });

  it('renders contacts as real links without requiring display text', () => {
    const html = renderToStaticMarkup(
      <>{build(createDemoResume())[0]!.render({ from: 0, to: 1, continued: false })}</>,
    );
    expect(html).toContain('href="mailto:alex.morgan@example.com"');
    expect(html).toContain('href="https://github.com/alexmorgan-dev"');
    expect(html).toContain('>github.com/alexmorgan-dev<');
  });

  it('shows GitHub links in compact form', () => {
    const blocks = build(createDemoResume());
    const html = blocks
      .map((b) =>
        renderToStaticMarkup(<>{b.render({ from: 0, to: b.atomCount, continued: false })}</>),
      )
      .join('');
    expect(html).toMatch(/GitHub<span class="rf-sep"> · <\/span>quillmark/);
    expect(html).toContain('href="https://github.com/alexmorgan-dev/quillmark"');
  });
});

describe('buildPrintHtml', () => {
  it('sizes the page and escapes the title', () => {
    const html = buildPrintHtml({
      documentHtml: '<div></div>',
      css: 'a{}</style><script>',
      title: '<CV>',
      widthMm: 210,
      heightMm: 297,
    });
    expect(html).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(html).toContain('<title>&lt;CV&gt;</title>');
    expect(html).not.toContain('</style><script>');
  });
});
