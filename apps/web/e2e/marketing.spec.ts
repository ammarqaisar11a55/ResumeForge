import { expect, test } from '@playwright/test';
import { createDemoResume } from '@resumeforge/core';
import { seedResumes } from './fixtures';

test('landing page links into the app, templates, source and portfolio', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build a resume worth remembering.');
  await expect(page.getByRole('link', { name: /ammarqaisar11a55\/ResumeForge/ })).toHaveAttribute(
    'href',
    'https://github.com/ammarqaisar11a55/ResumeForge',
  );
  await expect(page.getByRole('link', { name: /Muhammad Ammar Qaisar/ }).first()).toHaveAttribute(
    'href',
    'https://personal-portfolio-website-orpin-three.vercel.app/',
  );
  await page.getByRole('link', { name: 'View templates' }).click();
  await expect(page).toHaveURL(/\/templates$/);
  // Only the visible thumbnails; each also has an invisible measuring copy outside <main>.
  await expect(page.locator('main .rf-document')).toHaveCount(3);
  await page.getByRole('link', { name: 'Start with Forge Modern' }).click();
  await expect(page.getByRole('dialog', { name: 'Create a resume' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Modern/ })).toBeChecked();
});

test('phone layout uses tabs and keeps the page faithful to A4', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const resume = createDemoResume();
  await seedResumes(page, [resume]);
  await page.goto(`/app/resume/${resume.id}`);
  await expect(page.getByRole('navigation', { name: 'Editor panels' })).toBeVisible();
  await page.getByRole('button', { name: 'Preview' }).click();
  const ratio = await page.locator('.rf-preview .rf-page').first().evaluate((el) => el.offsetHeight / el.offsetWidth);
  expect(ratio).toBeCloseTo(297 / 210, 2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await context.close();
});
