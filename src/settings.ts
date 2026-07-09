import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type LeetCodeStudyOrganizerPlugin from "./main";
import { syncFromIndex } from "./vaultSync";

export class StudyOrganizerSettingTab extends PluginSettingTab {
  plugin: LeetCodeStudyOrganizerPlugin;

  constructor(app: App, plugin: LeetCodeStudyOrganizerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "LeetCode Study Organizer" });

    new Setting(containerEl)
      .setName("Caminho do índice")
      .setDesc("Caminho, dentro do vault, da nota com a tabela de progresso do LeetCode.")
      .addText((text) =>
        text
          .setValue(this.plugin.data.indexPath)
          .onChange(async (value) => {
            this.plugin.data.indexPath = value;
            await this.plugin.saveData(this.plugin.data);
          })
      );

    new Setting(containerEl)
      .setName("Sincronizar agora")
      .setDesc("Lê a tabela de progresso e adiciona problemas novos (marcados ✅) à fila de revisão.")
      .addButton((button) =>
        button.setButtonText("Sincronizar").onClick(async () => {
          try {
            const added = await syncFromIndex(this.app, this.plugin.data);
            await this.plugin.saveData(this.plugin.data);
            this.plugin.refreshReviewView();
            new Notice(`${added} problema(s) novo(s) adicionado(s) à revisão.`);
          } catch (err) {
            new Notice(`Erro ao sincronizar: ${(err as Error).message}`);
          }
        })
      );

    const total = Object.keys(this.plugin.data.cards).length;
    containerEl.createEl("p", {
      text: `${total} problema(s) rastreado(s) no total.`,
      cls: "leetcode-review-sub"
    });
  }
}
