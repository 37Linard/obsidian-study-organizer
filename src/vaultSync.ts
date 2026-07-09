import { App, TFile } from "obsidian";
import { Card, PluginData } from "./types";

const ROW_REGEX =
  /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([^|]+?)\s*\|\s*(\[\[[^\]]+\]\])\s*\|\s*(.+?)\s*\|\s*$/;

interface ParsedRow {
  id: string;
  name: string;
  difficulty: string;
  topicLinkPath: string;
  solved: boolean;
}

function parseIndexTable(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];

  for (const line of content.split("\n")) {
    const match = line.match(ROW_REGEX);
    if (!match) continue;

    const [, id, name, difficulty, wikilink, status] = match;
    const inner = wikilink.slice(2, -2); // remove [[ ]]
    const topicLinkPath = inner.split(/\\\|/)[0].trim();

    rows.push({
      id,
      name: name.trim(),
      difficulty: difficulty.trim(),
      topicLinkPath,
      solved: status.includes("✅")
    });
  }

  return rows;
}

function extractUrlsFromTopicContent(content: string): Record<string, string> {
  const urls: Record<string, string> = {};
  let currentId: string | null = null;

  for (const line of content.split("\n")) {
    const heading = line.match(/^##\s*(\d+)\s*—/);
    if (heading) {
      currentId = heading[1];
      continue;
    }
    if (currentId) {
      const link = line.match(/🔗\s*(https?:\/\/\S+)/);
      if (link) {
        urls[currentId] = link[1];
        currentId = null;
      }
    }
  }

  return urls;
}

export async function syncFromIndex(app: App, data: PluginData): Promise<number> {
  const indexFile = app.vault.getAbstractFileByPath(data.indexPath);
  if (!(indexFile instanceof TFile)) {
    throw new Error(`Arquivo de índice não encontrado: ${data.indexPath}`);
  }

  const indexContent = await app.vault.cachedRead(indexFile);
  const rows = parseIndexTable(indexContent).filter((r) => r.solved);

  const topicContentCache = new Map<string, Record<string, string>>();
  let added = 0;

  for (const row of rows) {
    if (data.cards[row.id]) continue;

    let topicUrls = topicContentCache.get(row.topicLinkPath);
    if (!topicUrls) {
      const topicFile = app.metadataCache.getFirstLinkpathDest(row.topicLinkPath, data.indexPath);
      const content = topicFile instanceof TFile ? await app.vault.cachedRead(topicFile) : "";
      topicUrls = extractUrlsFromTopicContent(content);
      topicContentCache.set(row.topicLinkPath, topicUrls);
    }

    const card: Card = {
      id: row.id,
      name: row.name,
      difficulty: row.difficulty,
      topicPath: row.topicLinkPath,
      url: topicUrls[row.id] ?? null,
      repetitions: 0,
      interval: 1,
      easiness: 2.5,
      lastReview: null,
      nextReview: new Date().toISOString()
    };

    data.cards[row.id] = card;
    added++;
  }

  return added;
}
