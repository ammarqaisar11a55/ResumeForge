/**
 * Pure pagination: given measured blocks and the usable page height, decide
 * which fragment of which block goes on which page. No DOM access, so the
 * rules are unit-testable.
 *
 * Rules, in priority order:
 *  1. A block that fits in the remaining space is placed whole.
 *  2. A heading (keepWithNext) is never left alone at the bottom of a page:
 *     it moves to the next page unless the start of the following block fits
 *     under it.
 *  3. An entry is moved whole to the next page when it would fit there,
 *     unless it is large and a good amount of space would otherwise be
 *     wasted. Only then is it split, between atoms (an entry head and its
 *     bullets), keeping at least the head plus one bullet together and never
 *     leaving a single bullet stranded at the end without company.
 *  4. Content taller than a full page is always split between atoms; a single
 *     atom taller than a page is placed alone and flagged as overflowing.
 */

export interface MeasuredBlock {
  key: string;
  spaceBefore: number;
  keepWithNext: boolean;
  /** Space inside the block before its first atom. */
  lead: number;
  /** Space inside the block after its last atom. */
  trail: number;
  /** Height of each atom including the gap that follows it. */
  segments: number[];
}

export interface PageFragment {
  key: string;
  from: number;
  to: number;
  continued: boolean;
  /** First fragment on its page: its spaceBefore is dropped. */
  firstOnPage: boolean;
}

export interface PageLayout {
  fragments: PageFragment[];
  /** Total content height used, in px. */
  used: number;
  /** True when some content does not fit (an unbreakable atom taller than a page). */
  overflow: boolean;
}

export interface PaginateOptions {
  /** Below this share of a page, an entry that fits on the next page is moved rather than split. */
  minRemainingToSplit?: number;
  /** Entries smaller than this share of a page are never split if they fit on a fresh page. */
  minBlockToSplit?: number;
}

const EPSILON = 0.5;

export function fragmentHeight(block: MeasuredBlock, from: number, to: number): number {
  let h = block.lead + block.trail;
  for (let i = from; i < to; i++) h += block.segments[i] ?? 0;
  return h;
}

type Plan = { kind: 'whole' } | { kind: 'split'; to: number } | { kind: 'move' };

interface PlanContext {
  pageHeight: number;
  minRemainingToSplit: number;
  minBlockToSplit: number;
}

/**
 * Decide what to do with the rest of a block (atoms from `from`) given the
 * space remaining on the current page. Ignores keep-with-next, which the
 * caller handles.
 */
function planBlock(
  block: MeasuredBlock,
  from: number,
  remaining: number,
  isFirst: boolean,
  ctx: PlanContext,
): Plan {
  const n = block.segments.length;
  const space = isFirst ? 0 : block.spaceBefore;
  const rest = fragmentHeight(block, from, n);
  if (space + rest <= remaining + EPSILON) return { kind: 'whole' };

  const atomsLeft = n - from;
  const fitsOnFreshPage = rest <= ctx.pageHeight + EPSILON;
  const worthSplitting = remaining >= ctx.minRemainingToSplit && rest >= ctx.minBlockToSplit;
  if (atomsLeft > 1 && (!fitsOnFreshPage || worthSplitting || isFirst)) {
    // Keep an entry head with at least one bullet; always carry one atom over.
    const minFirst = from === 0 ? 2 : 1;
    let best = -1;
    for (let k = from + minFirst; k <= n - 1; k++) {
      if (space + fragmentHeight(block, from, k) <= remaining + EPSILON) best = k;
      else break;
    }
    if (best > from) return { kind: 'split', to: best };
  }
  return { kind: 'move' };
}

export function paginate(
  blocks: MeasuredBlock[],
  pageHeight: number,
  options: PaginateOptions = {},
): PageLayout[] {
  const ctx: PlanContext = {
    pageHeight,
    minRemainingToSplit: (options.minRemainingToSplit ?? 0.22) * pageHeight,
    minBlockToSplit: (options.minBlockToSplit ?? 0.18) * pageHeight,
  };

  const pages: PageLayout[] = [];
  let page: PageLayout = { fragments: [], used: 0, overflow: false };

  const newPage = () => {
    pages.push(page);
    page = { fragments: [], used: 0, overflow: false };
  };
  const place = (block: MeasuredBlock, from: number, to: number) => {
    const first = page.fragments.length === 0;
    const space = first ? 0 : block.spaceBefore;
    page.fragments.push({ key: block.key, from, to, continued: from > 0, firstOnPage: first });
    page.used += space + fragmentHeight(block, from, to);
    if (page.used > pageHeight + EPSILON) page.overflow = true;
  };

  let i = 0;
  let from = 0;
  // Every iteration places content or opens a page; the guard only protects against bugs.
  let guard = 0;
  const guardLimit = blocks.reduce((sum, b) => sum + b.segments.length, 0) * 4 + 16;

  while (i < blocks.length && guard++ < guardLimit) {
    const block = blocks[i]!;
    const n = block.segments.length;
    if (n === 0) {
      i += 1;
      continue;
    }
    const isFirst = page.fragments.length === 0;
    const remaining = pageHeight - page.used;

    if (block.keepWithNext && from === 0) {
      const height = (isFirst ? 0 : block.spaceBefore) + fragmentHeight(block, 0, n);
      const next = blocks[i + 1];
      const fits = height <= remaining + EPSILON;
      const followerFits =
        !next ||
        next.segments.length === 0 ||
        planBlock(next, 0, remaining - height, false, ctx).kind !== 'move';
      if (!isFirst && (!fits || !followerFits)) {
        newPage();
        continue;
      }
      place(block, 0, n);
      i += 1;
      continue;
    }

    const plan = planBlock(block, from, remaining, isFirst, ctx);
    if (plan.kind === 'whole') {
      place(block, from, n);
      i += 1;
      from = 0;
      continue;
    }
    if (plan.kind === 'split') {
      place(block, from, plan.to);
      from = plan.to;
      newPage();
      continue;
    }
    if (!isFirst) {
      newPage();
      continue;
    }

    // Top of an empty page and nothing fits: place as much as possible, at least one atom.
    let k = from + 1;
    while (k < n && fragmentHeight(block, from, k + 1) <= pageHeight + EPSILON) k += 1;
    place(block, from, k);
    if (k >= n) {
      i += 1;
      from = 0;
    } else {
      from = k;
      newPage();
    }
  }

  if (page.fragments.length > 0 || pages.length === 0) pages.push(page);
  return pages;
}

/** Stable signature of a layout, used to skip redundant state updates. */
export function layoutSignature(pages: PageLayout[]): string {
  return pages
    .map(
      (p) =>
        p.fragments.map((f) => `${f.key}[${f.from}-${f.to}]`).join(',') + (p.overflow ? '!' : ''),
    )
    .join('|');
}
