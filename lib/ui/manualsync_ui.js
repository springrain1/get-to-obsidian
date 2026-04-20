"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualSyncUI = void 0;
const obsidian_1 = require("obsidian");
class ManualSyncUI extends obsidian_1.Modal {
    plugin;
    rawPath;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.rawPath = "";
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h3", { text: "AdHoc Import" });
        // const ctrlUploadBox = new Setting(contentEl)
        // ctrlUploadBox.setName("Select flomo@<uid>-<date>.zip");
        const fileLocContol = contentEl.createEl("input", { type: "file", cls: "uploadbox" });
        fileLocContol.setAttr("accept", ".zip");
        fileLocContol.onchange = (ev) => {
            this.rawPath = ev.currentTarget.files[0]["path"];
            console.log(this.rawPath);
        };
        contentEl.createEl("br");
        new obsidian_1.Setting(contentEl)
            .addButton((btn) => {
            btn.setButtonText("Cancel")
                .setCta()
                .onClick(async () => {
                await this.plugin.saveSettings();
                this.close();
            });
        })
            .addButton((btn) => {
            btn.setButtonText("Import")
                .setCta()
                .onClick(async () => {
                await this.plugin.saveSettings();
                this.close();
            });
        });
    }
}
exports.ManualSyncUI = ManualSyncUI;
