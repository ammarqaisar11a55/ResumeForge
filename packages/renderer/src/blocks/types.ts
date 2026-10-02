import type { ReactNode } from 'react';

/**
 * The renderer turns a resume into a flat list of blocks. A block is the unit
 * the pagination engine places on pages: the header, a section heading, an
 * entry, a paragraph. A block is made of one or more atoms (an entry header,
 * each bullet...). Blocks are kept whole when possible; when one must break
 * across pages it breaks between atoms, never inside one.
 */
export type BlockKind = 'header' | 'section-title' | 'entry' | 'text' | 'stats' | 'list';

export interface FragmentRange {
  /** First atom (inclusive). */
  from: number;
  /** Last atom (exclusive). */
  to: number;
  /** True when this fragment continues a block started on a previous page. */
  continued: boolean;
}

export interface DocBlock {
  key: string;
  kind: BlockKind;
  /** Section the block belongs to; null for the document header. */
  sectionId: string | null;
  /** Entry the block represents, for click-to-select in the editor. */
  entryId?: string;
  /** Vertical space above the block in px. Dropped at the top of a page. */
  spaceBefore: number;
  /** Keep on the same page as the start of the following block (headings). */
  keepWithNext: boolean;
  /** Number of atoms; the block may split between atoms when > 1. */
  atomCount: number;
  /**
   * Render the atoms in `range`. Every atom element must carry the
   * `data-rf-atom` attribute so it can be measured.
   */
  render: (range: FragmentRange) => ReactNode;
}

/** Attribute every atom element carries. */
export const ATOM_ATTR = 'data-rf-atom';
export const atomProps = { [ATOM_ATTR]: '' } as const;
