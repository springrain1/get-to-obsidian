"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUI = void 0;
const obsidian_1 = require("obsidian");
const message_ui_1 = require("./message_ui");
const auth_1 = require("../get/auth");
class AuthUI extends obsidian_1.Modal {
    plugin;
    phone;
    // 存储浏览器状态，用于两步之间传递
    browser = null;
    context = null;
    page = null;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.phone = "";
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h3", { text: "连接到 Get笔记" });
        // 手机号输入框
        new obsidian_1.Setting(contentEl)
            .setName('手机号码')
            .setDesc('请输入您的 Get笔记 手机号')
            .addText(text => text
            .setPlaceholder('请输入手机号')
            .onChange(async (value) => {
            this.phone = value;
        }));
        // 按钮区域
        new obsidian_1.Setting(contentEl)
            .setDesc("前置条件: npx playwright@1.43.1 install")
            .addButton((btn) => {
            btn.setButtonText("取消")
                .onClick(async () => {
                await this.cleanup();
                this.close();
            });
        })
            .addButton((btn) => {
            btn.setButtonText("发送验证码")
                .setCta()
                .onClick(async () => {
                if (this.phone === "" || this.phone.length !== 11) {
                    new obsidian_1.Notice("请输入正确的手机号码（11位）");
                    return;
                }
                btn.setButtonText("发送中...");
                btn.setDisabled(true);
                const auth = new auth_1.GetAuth();
                const result = await auth.requestSmsCode(this.phone);
                if (result[0]) {
                    // 保存浏览器状态
                    this.browser = result[2];
                    this.context = result[3];
                    this.page = result[4];
                    new obsidian_1.Notice("请在浏览器中手动点击'获取验证码'，输入验证码并点击'登录'按钮", 10000);
                    btn.setButtonText("等待登录中...");
                    // 自动等待用户手动登录
                    const loginResult = await auth.waitForManualLogin(this.browser, this.context, this.page);
                    if (loginResult[0]) {
                        new message_ui_1.MessageUI(this.app, "🤗 登录成功！").open();
                        this.close();
                    }
                    else {
                        new obsidian_1.Notice(`登录失败: ${loginResult[1]}`);
                        btn.setButtonText("发送验证码");
                        btn.setDisabled(false);
                        await this.cleanup();
                    }
                }
                else {
                    new obsidian_1.Notice(`发送验证码失败: ${result[1]}`);
                    btn.setButtonText("发送验证码");
                    btn.setDisabled(false);
                }
            });
        });
    }
    async cleanup() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch (e) { }
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
    onClose() {
        this.cleanup();
        const { contentEl } = this;
        contentEl.empty();
    }
}
exports.AuthUI = AuthUI;
