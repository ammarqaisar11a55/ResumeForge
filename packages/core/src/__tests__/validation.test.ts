import { describe, expect, it } from 'vitest';
import { formatDateRange, isRangeInverted, parsePartialDate } from '../dates';
import { createContact, createResume } from '../operations';
import { createEntry, createSection } from '../sections';
import { clampSetting, resolveSettings } from '../settings';
import { summaryGuidance } from '../summary';
import { contactHref, contactText, describeLink, displayUrl, normalizeUrl } from '../urls';
import { checkGpa, issuesFor, validateResume } from '../validation';

describe('dates', () => {
  it('parses partial dates', () => {
    expect(parsePartialDate('2023')).toEqual({ year: 2023 });
    expect(parsePartialDate('2023-09')).toEqual({ year: 2023, month: 9 });
    expect(parsePartialDate('2023-13')).toBeNull();
    expect(parsePartialDate('Sept 2023')).toBeNull();
  });

  it('formats ranges in every format', () => {
    const range = { start: '2023-09', end: '', current: true };
    expect(formatDateRange(range, 'year')).toBe('2023 – Present');
    expect(formatDateRange(range, 'short')).toBe('Sep 2023 – Present');
    expect(formatDateRange(range, 'long')).toBe('September 2023 – Present');
    expect(formatDateRange(range, 'numeric')).toBe('09/2023 – Present');
    expect(formatDateRange({ start: '2021', end: '2023', current: false }, 'short')).toBe(
      '2021 – 2023',
    );
    expect(formatDateRange({ start: '', end: '', current: false }, 'year')).toBe('');
  });

  it('detects inverted ranges', () => {
    expect(isRangeInverted({ start: '2024', end: '2023', current: false })).toBe(true);
    expect(isRangeInverted({ start: '2023-09', end: '2023-02', current: false })).toBe(true);
    expect(isRangeInverted({ start: '2023-09', end: '2023', current: false })).toBe(false);
    expect(isRangeInverted({ start: '2024', end: '2023', current: true })).toBe(false);
  });
});

describe('urls', () => {
  it('normalises user input into safe absolute URLs', () => {
    expect(normalizeUrl('github.com/me')).toBe('https://github.com/me');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('localhost:3000/x')).toBe('https://localhost:3000/x');
    expect(normalizeUrl('javascript:alert(1)')).toBe('');
    expect(normalizeUrl('data:text/html,hi')).toBe('');
    expect(normalizeUrl('not a url')).toBe('');
    expect(normalizeUrl('')).toBe('');
  });

  it('derives display text so users never type it twice', () => {
    expect(displayUrl('https://www.linkedin.com/in/someone/')).toBe('linkedin.com/in/someone');
    expect(describeLink('github.com/alex/quillmark')).toEqual({
      source: 'GitHub',
      text: 'quillmark',
    });
    expect(describeLink('https://roomly.vercel.app')).toEqual({
      source: '',
      text: 'roomly.vercel.app',
    });
  });

  it('builds hrefs per contact kind', () => {
    expect(contactHref({ kind: 'email', value: 'a@b.co' })).toBe('mailto:a@b.co');
    expect(contactHref({ kind: 'phone', value: '+92 300 123 4567' })).toBe('tel:+923001234567');
    expect(contactHref({ kind: 'location', value: 'Lahore' })).toBe('');
    expect(contactHref({ kind: 'github', value: 'github.com/me' })).toBe('https://github.com/me');
    expect(contactText({ kind: 'github', value: 'https://github.com/me', label: '' })).toBe(
      'github.com/me',
    );
    expect(contactText({ kind: 'github', value: 'https://github.com/me', label: 'GitHub' })).toBe(
      'GitHub',
    );
  });
});

describe('validation', () => {
  it('flags a missing name as an error', () => {
    const resume = createResume();
    const issues = validateResume(resume);
    expect(issues.find((i) => i.field === 'fullName')?.severity).toBe('error');
  });

  it('warns about invalid emails, URLs, dates and GPA without blocking', () => {
    const resume = createResume({ fullName: 'Sam' });
    const email = createContact('email', 'not-an-email');
    resume.personalInfo.contacts = [email];
    const education = createSection('education');
    const entry = createEntry('education');
    entry.dates = { start: '2024', end: '2022', current: false };
    entry.gpa = '4.5';
    entry.gpaScale = '4';
    education.entries.push(entry);
    const projects = createSection('projects');
    const project = createEntry('projects');
    project.githubUrl = 'javascript:alert(1)';
    project.dates = { start: 'soon', end: '', current: false };
    projects.entries.push(project);
    resume.sections = [education, projects];

    const issues = validateResume(resume);
    expect(issuesFor(issues, email.id, 'value')[0]?.severity).toBe('warning');
    expect(issuesFor(issues, entry.id, 'dates')[0]?.message).toMatch(/start date is after/);
    expect(issuesFor(issues, entry.id, 'gpa')[0]?.message).toMatch(/higher than the scale/);
    expect(issuesFor(issues, project.id, 'githubUrl')).toHaveLength(1);
    expect(issuesFor(issues, project.id, 'dates')[0]?.severity).toBe('error');
  });

  it('checks GPA plausibility', () => {
    expect(checkGpa('', '')).toBeNull();
    expect(checkGpa('3.89', '4.00')).toBeNull();
    expect(checkGpa('abc', '')).toMatch(/number/);
    expect(checkGpa('-1', '')).toMatch(/negative/);
    expect(checkGpa('12', '')).toMatch(/usually/);
    expect(checkGpa('8.5', '10')).toBeNull();
  });
});

describe('settings', () => {
  it('merges overrides over template defaults', () => {
    const settings = resolveSettings('classic', {
      typography: { baseSize: 11 },
      colors: { accent: '#123456' },
    });
    expect(settings.typography.baseSize).toBe(11);
    expect(settings.typography.bodyFont).toBe('archivo');
    expect(settings.colors.accent).toBe('#123456');
    expect(resolveSettings('minimal', {}).typography.bodyFont).toBe('source-serif-4');
  });

  it('clamps values into readable bounds', () => {
    const settings = resolveSettings('classic', {
      typography: { baseSize: 2, lineHeight: 9 },
      page: { margins: { top: -5 } },
    });
    expect(settings.typography.baseSize).toBe(8);
    expect(settings.typography.lineHeight).toBe(1.8);
    expect(settings.page.margins.top).toBe(6);
    expect(clampSetting('nameSize', Number.NaN)).toBe(14);
  });
});

describe('summary guidance', () => {
  it('grades summary length', () => {
    expect(summaryGuidance('').status).toBe('empty');
    expect(summaryGuidance('Short summary.').status).toBe('short');
    expect(summaryGuidance('word '.repeat(50)).status).toBe('good');
    expect(summaryGuidance('word '.repeat(50)).message).toBe('Good resume summary length.');
    expect(summaryGuidance('word '.repeat(100)).status).toBe('long');
    expect(summaryGuidance('word '.repeat(200)).status).toBe('too-long');
  });
});
