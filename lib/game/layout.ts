/**
 * Picks the number of columns that gives the biggest cards for the space
 * available, so the board fits on a phone in portrait as well as on a wide
 * monitor without scrolling.
 */
export type BoardLayout = { cols: number; rows: number; cardW: number; cardH: number; gap: number };

const MIN_ASPECT = 0.72; // width / height — tall cards on narrow screens
const MAX_ASPECT = 1.45; // wide cards on wide screens
const MAX_CARD_W = 168;
const MIN_CARD_W = 52;

export function fitBoard(count: number, width: number, height: number): BoardLayout {
  const gap = width < 420 ? 6 : width < 768 ? 8 : 12;
  let best: BoardLayout | null = null;
  let bestArea = -1;

  for (let cols = 2; cols <= count; cols++) {
    if (count % cols !== 0) continue;
    const rows = count / cols;
    let w = (width - gap * (cols - 1)) / cols;
    let h = (height - gap * (rows - 1)) / rows;
    if (w <= 0 || h <= 0) continue;
    if (w / h > MAX_ASPECT) w = h * MAX_ASPECT;
    if (w / h < MIN_ASPECT) h = w / MIN_ASPECT;
    if (w > MAX_CARD_W) {
      h = h * (MAX_CARD_W / w);
      w = MAX_CARD_W;
    }
    // Penalise boards that don't fit the height: they'd need scrolling.
    const fits = h * rows + gap * (rows - 1) <= height + 1;
    const area = w * h * (fits ? 1 : 0.5);
    if (area > bestArea) {
      bestArea = area;
      best = { cols, rows, cardW: Math.floor(w), cardH: Math.floor(h), gap };
    }
  }

  if (!best) return { cols: 4, rows: Math.ceil(count / 4), cardW: MIN_CARD_W, cardH: MIN_CARD_W / MIN_ASPECT, gap };
  if (best.cardW < MIN_CARD_W) {
    // Too small to read: keep a readable size and let the page scroll.
    best.cardH = Math.floor((best.cardH * MIN_CARD_W) / best.cardW);
    best.cardW = MIN_CARD_W;
  }
  return best;
}
