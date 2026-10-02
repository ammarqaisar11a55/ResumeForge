export { buildBlocks, type BuildContext } from './blocks/buildBlocks';
export { RichText } from './blocks/parts';
export type { BlockKind, DocBlock, FragmentRange } from './blocks/types';
export { documentClassName, documentStyle, pageMetrics, pageStyle, type PageMetrics } from './layout';
export { measureBlocks } from './pagination/measure';
export {
  fragmentHeight,
  layoutSignature,
  paginate,
  type MeasuredBlock,
  type PageFragment,
  type PageLayout,
  type PaginateOptions,
} from './pagination/paginate';
export { buildPrintHtml, escapeHtml, type PrintDocumentInput } from './print';
export { ResumeDocument, type LayoutInfo, type ResumeDocumentProps } from './ResumeDocument';
export { ResumeThumbnail, type ResumeThumbnailProps } from './ResumeThumbnail';
export { mmToPx, ptToPx, PX_PER_MM, PX_PER_PT } from './units';
