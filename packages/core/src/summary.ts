export type SummaryLengthStatus = 'empty' | 'short' | 'good' | 'long' | 'too-long';

export interface SummaryGuidance {
  words: number;
  characters: number;
  status: SummaryLengthStatus;
  message: string;
}

/** Recruiters skim summaries; 30–80 words reads well on a one-page resume. */
export const SUMMARY_WORD_RANGE = { min: 30, max: 80, hardMax: 120 } as const;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function summaryGuidance(text: string): SummaryGuidance {
  const words = countWords(text);
  const characters = text.trim().length;
  if (words === 0) {
    return { words, characters, status: 'empty', message: 'Two or three sentences about who you are and what you want next.' };
  }
  if (words < SUMMARY_WORD_RANGE.min) {
    return { words, characters, status: 'short', message: 'A little short. Add a focus area or a notable result.' };
  }
  if (words <= SUMMARY_WORD_RANGE.max) {
    return { words, characters, status: 'good', message: 'Good resume summary length.' };
  }
  if (words <= SUMMARY_WORD_RANGE.hardMax) {
    return { words, characters, status: 'long', message: 'Getting long. Recruiters skim, so consider trimming.' };
  }
  return { words, characters, status: 'too-long', message: 'Too long for a summary. Move detail into experience or projects.' };
}
