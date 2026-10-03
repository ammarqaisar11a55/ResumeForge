import { describe, expect, it } from 'vitest';
import { paginate, type MeasuredBlock } from '../pagination/paginate';

const PAGE = 1000;

function block(key: string, segments: number[], extra: Partial<MeasuredBlock> = {}): MeasuredBlock {
  return { key, spaceBefore: 10, keepWithNext: false, lead: 0, trail: 0, segments, ...extra };
}
const title = (key: string) => block(key, [30], { keepWithNext: true, spaceBefore: 20 });

describe('paginate', () => {
  it('keeps a short resume on one page', () => {
    const pages = paginate([block('header', [120]), title('t1'), block('e1', [40, 20, 20])], PAGE);
    expect(pages).toHaveLength(1);
    expect(pages[0]!.fragments.map((f) => f.key)).toEqual(['header', 't1', 'e1']);
    expect(pages[0]!.overflow).toBe(false);
  });

  it('drops spaceBefore for the first block on a page', () => {
    const pages = paginate([block('a', [900]), block('b', [300], { spaceBefore: 50 })], PAGE);
    expect(pages).toHaveLength(2);
    expect(pages[1]!.fragments[0]!.firstOnPage).toBe(true);
    expect(pages[1]!.used).toBe(300);
  });

  it('never leaves a heading alone at the bottom of a page', () => {
    // 940 used; the heading (20 + 30) fits but its entry does not.
    const pages = paginate([block('a', [940]), title('t'), block('e', [80])], PAGE);
    expect(pages).toHaveLength(2);
    expect(pages[0]!.fragments.map((f) => f.key)).toEqual(['a']);
    expect(pages[1]!.fragments.map((f) => f.key)).toEqual(['t', 'e']);
  });

  it('keeps a heading when the start of a splittable entry fits under it', () => {
    // 600 used, big entry of 12 atoms: heading + first two atoms fit, entry is worth splitting.
    const entry = block('e', Array(12).fill(60));
    const pages = paginate([block('a', [600]), title('t'), entry], PAGE);
    expect(pages[0]!.fragments.map((f) => f.key)).toEqual(['a', 't', 'e']);
    const split = pages[0]!.fragments[2]!;
    expect(split.from).toBe(0);
    expect(split.to).toBeGreaterThanOrEqual(2);
    expect(pages[1]!.fragments[0]).toMatchObject({ key: 'e', from: split.to, continued: true });
  });

  it('moves a small entry to the next page instead of splitting it', () => {
    const pages = paginate([block('a', [900]), block('e', [40, 30, 30])], PAGE);
    expect(pages).toHaveLength(2);
    expect(pages[1]!.fragments[0]).toMatchObject({ key: 'e', from: 0, to: 3 });
  });

  it('splits a large entry between bullets when plenty of space remains', () => {
    const pages = paginate(
      [block('a', [500]), block('e', [60, 100, 100, 100, 100, 100, 100])],
      PAGE,
    );
    expect(pages).toHaveLength(2);
    const first = pages[0]!.fragments[1]!;
    expect(first).toMatchObject({ key: 'e', from: 0 });
    expect(first.to).toBe(5); // 10 + 60 + 4*100 = 470 <= 500 remaining
    expect(pages[1]!.fragments[0]).toMatchObject({ key: 'e', from: 5, to: 7, continued: true });
  });

  it('never separates an entry head from its first bullet', () => {
    // Only the head would fit in the remaining space: move the entry instead.
    const pages = paginate([block('a', [700]), block('e', [250, 200, 200])], PAGE);
    expect(pages[1]!.fragments[0]).toMatchObject({ key: 'e', from: 0, to: 3 });
  });

  it('splits content taller than a page across several pages', () => {
    const tall = block('tall', Array(30).fill(100));
    const pages = paginate([tall], PAGE);
    expect(pages).toHaveLength(3);
    expect(pages.flatMap((p) => p.fragments).reduce((n, f) => n + (f.to - f.from), 0)).toBe(30);
    expect(pages.every((p) => p.used <= PAGE)).toBe(true);
  });

  it('flags an unbreakable atom taller than a page as overflow', () => {
    const pages = paginate([block('a', [100]), block('huge', [1400])], PAGE);
    expect(pages).toHaveLength(2);
    expect(pages[1]!.overflow).toBe(true);
  });

  it('produces 1, 2 and 3 page documents as content grows', () => {
    const entries = (n: number) =>
      Array.from({ length: n }, (_, i) => block(`e${i}`, [40, 25, 25]));
    expect(paginate([block('header', [100]), ...entries(5)], PAGE)).toHaveLength(1);
    expect(paginate([block('header', [100]), ...entries(15)], PAGE)).toHaveLength(2);
    expect(paginate([block('header', [100]), ...entries(28)], PAGE)).toHaveLength(3);
  });

  it('places every atom exactly once', () => {
    const blocks = [
      block('h', [100]),
      title('t1'),
      ...Array.from({ length: 40 }, (_, i) => block(`e${i}`, [40, 30, 30, 30])),
    ];
    const pages = paginate(blocks, PAGE);
    const placed = new Map<string, number>();
    for (const f of pages.flatMap((p) => p.fragments))
      placed.set(f.key, (placed.get(f.key) ?? 0) + f.to - f.from);
    for (const b of blocks) expect(placed.get(b.key)).toBe(b.segments.length);
  });
});
