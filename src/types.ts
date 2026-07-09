export interface Card {
  id: string;
  name: string;
  difficulty: string;
  topicPath: string;
  url: string | null;
  repetitions: number;
  interval: number;
  easiness: number;
  lastReview: string | null;
  nextReview: string;
}

export interface PluginData {
  indexPath: string;
  cards: Record<string, Card>;
}

export const DEFAULT_DATA: PluginData = {
  indexPath: "Gabriel/Carreira/LeetCode/🧩 LeetCode — Índice.md",
  cards: {}
};
