import { describe, expect, it } from 'vitest';
import { createDemoResume } from '../demo';
import { loadResume } from '../migrate';
import { createResume, duplicateResume, moveItem, withFreshIds } from '../operations';
import { ResumeSchema } from '../schema';
import { createSection, sectionOptions } from '../sections';

describe('resume creation', () => {
  it('creates a valid blank resume with starter sections', () => {
    const resume = createResume({ title: 'Backend roles' });
    expect(ResumeSchema.safeParse(resume).success).toBe(true);
    expect(resume.metadata.title).toBe('Backend roles');
    expect(resume.sections.map((s) => s.type)).toEqual([
      'summary',
      'education',
      'experience',
      'projects',
      'skills',
    ]);
    // The summary is a single-entry section so it is editable immediately.
    expect(resume.sections[0]!.entries).toHaveLength(1);
  });

  it('builds a valid demo resume', () => {
    const demo = createDemoResume();
    expect(ResumeSchema.safeParse(demo).success).toBe(true);
    expect(demo.sections.filter((s) => s.type === 'projects')).toHaveLength(2);
  });

  it('fills missing fields with defaults when parsing partial documents', () => {
    const parsed = ResumeSchema.parse({
      id: 'abc',
      sections: [{ id: 's1', type: 'skills', entries: [{ id: 'e1', name: 'Tools' }] }],
    });
    expect(parsed.metadata.title).toBe('Untitled resume');
    expect(parsed.template).toBe('classic');
    const skills = parsed.sections[0]!;
    expect(skills.type === 'skills' && skills.entries[0]!.skills).toEqual([]);
  });
});

describe('operations', () => {
  it('moves items without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    expect(moveItem(input, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(input, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
    expect(moveItem(input, 5, 0)).toEqual(input);
  });

  it('gives duplicated resumes fresh ids at every level', () => {
    const demo = createDemoResume();
    const copy = duplicateResume(demo);
    expect(copy.id).not.toBe(demo.id);
    expect(copy.metadata.title).toBe(`${demo.metadata.title} (copy)`);
    const ids = (r: typeof demo) => JSON.stringify(r).match(/"id":"[^"]+"/g)!;
    const original = new Set(ids(demo));
    expect(ids(copy).some((id) => original.has(id))).toBe(false);
  });

  it('keeps non-id content when refreshing ids', () => {
    const section = createSection('skills');
    const copy = withFreshIds(section);
    expect(copy.title).toBe(section.title);
    expect(copy.id).not.toBe(section.id);
  });

  it('resolves section options over type defaults', () => {
    const section = createSection('projects');
    expect(sectionOptions(section).linkDisplay).toBe('primary');
    section.options.linkDisplay = 'all';
    expect(sectionOptions(section).linkDisplay).toBe('all');
  });
});

describe('loadResume', () => {
  it('rejects documents without an id', () => {
    expect(loadResume({ sections: [] }).ok).toBe(false);
    expect(loadResume('nope').ok).toBe(false);
  });

  it('loads valid documents unchanged', () => {
    const demo = createDemoResume();
    const result = loadResume(JSON.parse(JSON.stringify(demo)));
    expect(result.ok && result.repaired).toBe(false);
    expect(result.ok && result.resume).toEqual(demo);
  });

  it('repairs damaged documents by dropping only broken pieces', () => {
    const demo = JSON.parse(JSON.stringify(createDemoResume()));
    demo.sections[2].entries.push({ name: 'missing id' });
    demo.sections.push({ type: 'not-a-section' });
    demo.settings = { page: { format: 'Tabloid' } };
    const result = loadResume(demo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.repaired).toBe(true);
    expect(result.droppedItems).toBeGreaterThanOrEqual(3);
    expect(result.resume.sections).toHaveLength(6);
    expect(result.resume.sections[2]!.entries).toHaveLength(5);
    expect(result.resume.settings).toEqual({});
  });
});
