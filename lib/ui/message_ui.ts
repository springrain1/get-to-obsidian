/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { App, Modal, Setting, } from 'obsidian';


export class MessageUI extends Modal {
    message: string;

    constructor(app: App, msg: string) {
        super(app);
        this.message = msg;
    }

    onOpen() {

        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h5", { text: this.message });
            
        new Setting(contentEl)
        .addButton((btn) => {
            btn.setButtonText("Ok")
                .setCta()
                .onClick(async () => {
                    this.close();
                })
        });

    }
}