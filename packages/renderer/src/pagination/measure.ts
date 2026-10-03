import { ATOM_ATTR, type DocBlock } from '../blocks/types';
import type { MeasuredBlock } from './paginate';

export const BLOCK_ATTR = 'data-rf-block';

/**
 * Measure every block rendered (whole, without spaceBefore) inside `root`.
 * Heights come from layout boxes, so the result is independent of any CSS
 * transform applied to an ancestor (zoomed previews, thumbnails).
 */
export function measureBlocks(root: HTMLElement, blocks: DocBlock[]): MeasuredBlock[] {
  const elements = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>(`[${BLOCK_ATTR}]`).forEach((el) => {
    elements.set(el.getAttribute(BLOCK_ATTR)!, el);
  });

  const rootRect = root.getBoundingClientRect();
  const scale = root.offsetWidth > 0 ? rootRect.width / root.offsetWidth || 1 : 1;

  return blocks.map((block) => {
    const base = {
      key: block.key,
      spaceBefore: block.spaceBefore,
      keepWithNext: block.keepWithNext,
    };
    const el = elements.get(block.key);
    if (!el) return { ...base, lead: 0, trail: 0, segments: [] };

    const rect = el.getBoundingClientRect();
    const height = rect.height / scale;
    const atoms = Array.from(el.querySelectorAll<HTMLElement>(`[${ATOM_ATTR}]`));
    if (atoms.length === 0 || atoms.length !== block.atomCount) {
      // Treat as a single unbreakable unit if the renderer and atom count disagree.
      return { ...base, lead: 0, trail: 0, segments: [height] };
    }

    const tops = atoms.map((a) => (a.getBoundingClientRect().top - rect.top) / scale);
    const lastRect = atoms[atoms.length - 1]!.getBoundingClientRect();
    const lastBottom = (lastRect.bottom - rect.top) / scale;
    const segments = tops.map((top, i) => (i < tops.length - 1 ? tops[i + 1]! : lastBottom) - top);
    return {
      ...base,
      // Lead and trail may be negative: a template can bleed an element
      // into the margin (a header band) or hang it beside the next block
      // (a gutter heading). The sum still equals the space actually used.
      lead: tops[0]!,
      trail: height - lastBottom,
      segments: segments.map((s) => Math.max(0, s)),
    };
  });
}
