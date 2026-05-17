"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUI = void 0;
const obsidian_1 = require("obsidian");
class MessageUI extends obsidian_1.Modal {
    message;
    constructor(app, msg) {
        super(app);
        this.message = msg;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h5", { text: this.message });
        new obsidian_1.Setting(contentEl)
            .addButton((btn) => {
            btn.setButtonText("Ok")
                .setCta()
                .onClick(async () => {
                this.close();
            });
        });
    }
}
exports.MessageUI = MessageUI;
