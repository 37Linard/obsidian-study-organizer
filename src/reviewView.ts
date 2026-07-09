import { ItemView, WorkspaceLeaf } from "obsidian";
import { Card } from "./types";
import { applySM2, isDue } from "./sm2";
import type LeetCodeStudyOrganizerPlugin from "./main";

export const VIEW_TYPE_REVIEW = "leetcode-review-view";

const DIFFICULTY_COLOR: Record<string, string> = {
  "🟢": "#2ecc71",
  "🟡": "#f1c40f",
  "🔴": "#e74c3c"
};

export class ReviewView extends ItemView {
  plugin: LeetCodeStudyOrganizerPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: LeetCodeStudyOrganizerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_REVIEW;
  }

  getDisplayText(): string {
    return "Revisão LeetCode";
  }

  getIcon(): string {
    return "brain-circuit";
  }

  async onOpen() {
    this.render();
  }

  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("leetcode-review-container");

    const cards = Object.values(this.plugin.data.cards);
    const due = cards.filter((c) => isDue(c)).sort((a, b) => a.nextReview.localeCompare(b.nextReview));

    const header = container.createEl("div", { cls: "leetcode-review-header" });
    header.createEl("h3", { text: "Revisão de hoje" });
    header.createEl("p", {
      text: `${due.length} problema(s) pendente(s) de ${cards.length} rastreado(s).`,
      cls: "leetcode-review-sub"
    });

    if (due.length === 0) {
      container.createEl("p", { text: "Nada pra revisar agora. 🎉", cls: "leetcode-review-empty" });
      return;
    }

    for (const card of due) {
      this.renderCard(container, card);
    }
  }

  private renderCard(container: Element, card: Card) {
    const el = container.createEl("div", { cls: "leetcode-card" });

    const titleRow = el.createEl("div", { cls: "leetcode-card-title" });
    const diffIcon = card.difficulty.split(" ")[0];
    const badge = titleRow.createEl("span", { cls: "leetcode-badge", text: diffIcon });
    badge.style.color = DIFFICULTY_COLOR[diffIcon] ?? "inherit";
    titleRow.createEl("span", { text: ` #${card.id} — ${card.name}` });

    const meta = el.createEl("div", { cls: "leetcode-card-meta" });
    const topicLink = meta.createEl("a", { text: card.topicPath });
    topicLink.onclick = (e) => {
      e.preventDefault();
      this.app.workspace.openLinkText(card.topicPath, "", false);
    };

    if (card.url) {
      meta.createEl("span", { text: " · " });
      const urlLink = meta.createEl("a", { text: "abrir no LeetCode", href: card.url });
      urlLink.setAttr("target", "_blank");
      urlLink.setAttr("rel", "noopener");
    }

    const actions = el.createEl("div", { cls: "leetcode-card-actions" });
    const ratings: [string, number][] = [
      ["Errei", 1],
      ["Difícil", 3],
      ["Bom", 4],
      ["Fácil", 5]
    ];

    for (const [label, quality] of ratings) {
      const btn = actions.createEl("button", { text: label, cls: `leetcode-btn leetcode-btn-${quality}` });
      btn.onclick = async () => {
        this.plugin.data.cards[card.id] = applySM2(card, quality);
        await this.plugin.saveData(this.plugin.data);
        this.render();
      };
    }
  }
}
