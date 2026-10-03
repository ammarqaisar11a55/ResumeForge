import { expect, test } from '@playwright/test';
import { createDemoResume, createResume } from '@resumeforge/core';
import { longResume, openEditor, pageCount, seedResumes } from './fixtures';

const A4 = { width: 793.7, height: 1122.5 };

test.describe('multi-page rendering', () => {
  test('lays the demo resume out on exact A4 pages', async ({ page }) => {
    const resume = createDemoResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    await page.getByRole('button', { name: 'Reset zoom to 100%' }).click();

    const pages = page.locator('.rf-preview .rf-page');
    expect(await pages.count()).toBeGreaterThanOrEqual(2);
    const boxes = await pages.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })),
    );
    for (const box of boxes) {
      // 210 x 297 mm at 96 dpi.
      expect(Math.abs(box.w - A4.width)).toBeLessThan(1);
      expect(Math.abs(box.h - A4.height)).toBeLessThan(1);
    }
    await expect(page.locator('.rf-preview .rf-page[data-overflow]')).toHaveCount(0);
  });

  test('keeps headings with their content and never clips text on long resumes', async ({
    page,
  }) => {
    const resume = longResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    expect(await pageCount(page)).toBeGreaterThanOrEqual(3);

    const report = await page.locator('.rf-preview .rf-page').evaluateAll((pages) =>
      pages.map((p) => {
        const content = p.querySelector('.rf-page-content')!;
        const blocks = content.querySelectorAll('.rf-block');
        const last = blocks[blocks.length - 1];
        const pageRect = p.getBoundingClientRect();
        const style = getComputedStyle(p);
        const bottomLimit = pageRect.bottom - parseFloat(style.paddingBottom) + 1;
        return {
          lastIsHeading: last?.classList.contains('rf-block--section-title') ?? false,
          contentBottom: content.getBoundingClientRect().bottom,
          bottomLimit,
        };
      }),
    );
    for (const p of report) {
      expect(p.lastIsHeading).toBe(false);
      expect(p.contentBottom).toBeLessThanOrEqual(p.bottomLimit);
    }
  });

  test('adds pages as content grows and removes them as it shrinks', async ({ page }) => {
    const resume = createResume({ fullName: 'Grow Test' });
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    expect(await pageCount(page)).toBe(1);

    await page
      .getByRole('button', { name: /^Projects/ })
      .first()
      .click();
    const addProject = page.getByRole('button', { name: 'Add project' });
    for (let i = 0; i < 9; i++) {
      await addProject.click();
      const name = page.getByLabel('Project name').last();
      await name.fill(`Project ${i + 1}`);
      await page
        .getByLabel('Short description')
        .last()
        .fill('A deliberately long description. '.repeat(14));
    }
    await expect.poll(() => pageCount(page)).toBeGreaterThanOrEqual(2);
    const grown = await pageCount(page);

    for (let i = 0; i < 9; i++) await page.keyboard.press('Control+z');
    await expect.poll(() => pageCount(page)).toBeLessThan(grown);
  });
});

test.describe('editing', () => {
  test('creates a resume, edits it and keeps it after a reload', async ({ page }) => {
    await page.goto('/app');
    await page.getByRole('button', { name: 'Create new resume' }).first().click();
    await page.getByLabel('Resume name').fill('E2E resume');
    await page.getByRole('button', { name: 'Create resume' }).click();
    await expect(page).toHaveURL(/\/app\/resume\//);

    await page.getByLabel('Full name').fill('Riley Chen');
    await expect(page.locator('.rf-preview .rf-name')).toHaveText('Riley Chen');
    await expect(page.getByTestId('save-status')).toContainText(/Saved|Syncing/);

    await page.reload();
    await expect(page.getByLabel('Full name')).toHaveValue('Riley Chen');
    await expect(page.locator('.rf-preview .rf-name')).toHaveText('Riley Chen');

    await page.goto('/app');
    await expect(page.getByRole('heading', { name: 'E2E resume' })).toBeVisible();
  });

  test('reorders sections by keyboard drag and drop', async ({ page }) => {
    const resume = createDemoResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    const titles = () => page.locator('.rf-preview .rf-section-title').allInnerTexts();
    const before = await titles();
    expect(before[0]).toMatch(/education/i);

    const handle = page.getByRole('button', { name: 'Reorder section Education' });
    await handle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect.poll(async () => (await titles())[0]).toMatch(/technical skills/i);
  });

  test('switches templates and restores with undo', async ({ page }) => {
    const resume = createDemoResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    await page.getByRole('radio', { name: /Forge Minimal/ }).click();
    await expect(page.locator('.rf-preview .rf-document')).toHaveClass(/rf-tpl-minimal/);
    await expect(page.locator('.rf-preview .rf-name')).toHaveText('Alex Morgan');
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Control+z');
    await expect(page.locator('.rf-preview .rf-document')).toHaveClass(/rf-tpl-classic/);
    await page.keyboard.press('Control+y');
    await expect(page.locator('.rf-preview .rf-document')).toHaveClass(/rf-tpl-minimal/);
  });
});

test.describe('export', () => {
  test('downloads a PDF with one page per preview page', async ({ page }) => {
    const resume = longResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    const previewPages = await pageCount(page);
    await expect.poll(() => page.evaluate(() => fetch('/api/health').then((r) => r.ok))).toBe(true);
    // Wait for the app to notice the server so the server-side renderer is used.
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Alex-Morgan-Resume.pdf');
    const path = await download.path();
    const { readFileSync } = await import('node:fs');
    const pdf = readFileSync(path).toString('latin1');
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect((pdf.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length).toBe(previewPages);
    expect(pdf).toContain('https://github.com/alexmorgan-dev');
  });

  test('prints only the resume pages', async ({ page }) => {
    const resume = createDemoResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    // Record what the print frame would print instead of opening the system dialog.
    await page.evaluate(() => {
      new MutationObserver((records) => {
        for (const node of records.flatMap((r) => [...r.addedNodes])) {
          if (!(node instanceof HTMLIFrameElement)) continue;
          node.addEventListener('load', () => {
            const frame = node.contentWindow!;
            frame.print = () => {
              (window as Window & { __printed?: number }).__printed =
                frame.document.querySelectorAll('.rf-page').length;
            };
          });
        }
      }).observe(document.body, { childList: true });
    });
    const previewPages = await pageCount(page);
    await page.getByRole('button', { name: 'Print' }).click();
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __printed?: number }).__printed))
      .toBe(previewPages);
  });
});

test.describe('themes', () => {
  test('dark mode changes the app but never the resume paper', async ({ page }) => {
    const resume = createDemoResume();
    await seedResumes(page, [resume]);
    await openEditor(page, resume.id);
    await page.getByRole('button', { name: /Switch to dark theme/ }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const paper = await page
      .locator('.rf-preview .rf-page')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(paper).toBe('rgb(255, 255, 255)');
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
