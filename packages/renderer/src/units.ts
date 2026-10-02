/** CSS reference pixels: 96 per inch, the unit Chromium uses for print layout. */
export const PX_PER_MM = 96 / 25.4;
export const PX_PER_PT = 96 / 72;

export const mmToPx = (mm: number): number => mm * PX_PER_MM;
export const ptToPx = (pt: number): number => pt * PX_PER_PT;
