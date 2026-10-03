import { expect, type Page } from '@playwright/test';
import { createDemoResume, duplicateEntry, type Resume } from '@resumeforge/core';

/** Seed resumes into the app's local storage before it loads. */
export async function seedResumes(page: Page, resumes: Resume[]) {
  await page.addInitScript((docs: Resume[]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const doc of docs) localStorage.setItem(`resumeforge:v1:resume:${doc.id}`, JSON.stringify(doc));
    localStorage.removeItem('resumeforge:v1:index');
  }, resumes);
}

/** The demo resume with its projects repeated, long enough for three or more pages. */
export function longResume(): Resume {
  const resume = createDemoResume();
  const projects = resume.sections.find((s) => s.type === 'projects')!;
  if (projects.type === 'projects') {
    const extra = projects.entries.flatMap((e) => [duplicateEntry(e), duplicateEntry(e)]);
    projects.entries.push(...extra);
  }
  resume.metadata.title = 'Long resume';
  return resume;
}

export async function openEditor(page: Page, id: string) {
  await page.goto(`/app/resume/${id}`);
  await expect(page.locator('.rf-preview .rf-page').first()).toBeVisible();
  // Let fonts load and pagination settle.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

export async function pageCount(page: Page) {
  return page.locator('.rf-preview .rf-page').count();
}
