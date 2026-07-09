import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_DATA, PluginData } from "./types";
import { syncFromIndex } from "./vaultSync";
import { ReviewView, VIEW_TYPE_REVIEW } from "./reviewView";
import { StudyOrganizerSettingTab } from "./settings";

export default class LeetCodeStudyOrganizerPlugin extends Plugin {
  data!: PluginData;

  async onload() {
    await this.loadPluginData();

    this.registerView(VIEW_TYPE_REVIEW, (leaf) => new ReviewView(leaf, this));

    this.addRibbonIcon("brain-circuit", "Revisão LeetCode", () => this.activateReviewView());

    this.addCommand({
      id: "open-review-view",
      name: "Abrir revisão de hoje",
      callback: () => this.activateReviewView()
    });

    this.addCommand({
      id: "sync-leetcode-index",
      name: "Sincronizar progresso do LeetCode",
      callback: async () => {
        try {
          const added = await syncFromIndex(this.app, this.data);
          await this.saveData(this.data);
          this.refreshReviewView();
          new Notice(`${added} problema(s) novo(s) adicionado(s) à revisão.`);
        } catch (err) {
          new Notice(`Erro ao sincronizar: ${(err as Error).message}`);
        }
      }
    });

    this.addSettingTab(new StudyOrganizerSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_REVIEW).forEach((leaf) => leaf.detach());
  }

  async loadPluginData() {
    const stored = await this.loadData();
    this.data = { ...DEFAULT_DATA, ...stored, cards: { ...(stored?.cards ?? {}) } };
  }

  refreshReviewView() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_REVIEW)) {
      if (leaf.view instanceof ReviewView) leaf.view.render();
    }
  }

  async activateReviewView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE_REVIEW)[0] ?? null;

    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_REVIEW, active: true });
    }

    workspace.revealLeaf(leaf);
  }
}
