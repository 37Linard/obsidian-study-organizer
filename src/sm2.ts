import { Card } from "./types";

// Algoritmo SM-2 (SuperMemo-2). quality: 0-5, onde <3 é falha (reinicia intervalo).
export function applySM2(card: Card, quality: number): Card {
  let { repetitions, interval, easiness } = card;

  easiness = Math.max(1.3, easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions += 1;
  }

  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + interval);

  return {
    ...card,
    repetitions,
    interval,
    easiness,
    lastReview: now.toISOString(),
    nextReview: next.toISOString()
  };
}

export function isDue(card: Card, referenceDate = new Date()): boolean {
  return new Date(card.nextReview).getTime() <= referenceDate.getTime();
}
