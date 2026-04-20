"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainUI = void 0;
const obsidian_1 = require("obsidian");
const common_1 = require("./common");
const auth_ui_1 = require("./auth_ui");
const importer_1 = require("../flomo/importer");
const exporter_1 = require("../flomo/exporter");
const fs = __importStar(require("fs-extra"));
const const_1 = require("../flomo/const");
class MainUI extends obsidian_1.Modal {
    plugin;
    rawPath;
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.rawPath = "";
    }
    async onSync(btn) {
        const isAuthFileExist = await fs.exists(const_1.AUTH_FILE);
        try {
            if (isAuthFileExist) {
                btn.setDisabled(true);
                btn.setButtonText("正在从 Get笔记 导出...");
                const exportResult = await (new exporter_1.FlomoExporter().export());
                btn.setDisabled(false);
                if (exportResult[0] == true) {
                    this.rawPath = const_1.DOWNLOAD_FILE;
                    btn.setButtonText("Importing...");
                    await this.onSubmit();
                    btn.setButtonText("Auto Sync 🤗");
                }
                else {
                    throw new Error(exportResult[1]);
                }
            }
            else {
                const authUI = new auth_ui_1.AuthUI(this.app, this.plugin);
                authUI.open();
            }
        }
        catch (err) {
            console.log(err);
            btn.setButtonText("Auto Sync 🤗");
            new obsidian_1.Notice(`Get笔记 同步错误. 详情:\n${err}`);
        }
    }
    async onSubmit() {
        const targetMemoLocation = this.plugin.settings.flomoTarget + "/" +
            this.plugin.settings.memoTarget;
        const res = await this.app.vault.adapter.exists(targetMemoLocation);
        if (!res) {
            console.debug(`DEBUG: creating memo root -> ${targetMemoLocation}`);
            await this.app.vault.adapter.mkdir(`${targetMemoLocation}`);
        }
        try {
            const config = this.plugin.settings;
            config["rawDir"] = this.rawPath;
            // 将已同步的备忘录ID传递给导入器，用于增量同步
            config["syncedMemoIds"] = this.plugin.settings.syncedMemoIds || [];
            const flomo = await (new importer_1.FlomoImporter(this.app, config)).import();
            // 保存新同步的备忘录ID
            if (flomo.syncedMemoIds && flomo.syncedMemoIds.length > 0) {
                this.plugin.settings.syncedMemoIds = flomo.syncedMemoIds;
                await this.plugin.saveSettings();
            }
            new obsidian_1.Notice(`🎉 导入完成.\n总数: ${flomo.memos.length} 条笔记, 新增: ${flomo.newMemosCount || 0} 条笔记`);
            this.rawPath = "";
        }
        catch (err) {
            this.rawPath = "";
            console.log(err);
            new obsidian_1.Notice(`Get笔记 导入错误. 详情:\n${err}`);
        }
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        // 标题区域
        const headerEl = contentEl.createDiv({ cls: "get-importer-header" });
        headerEl.createEl("h2", { text: "📓 Get笔记 Importer" });
        headerEl.createEl("p", {
            text: "将 Get笔记 同步到 Obsidian",
            cls: "get-importer-subtitle"
        });
        // 手动导入区域
        const manualImportSection = contentEl.createDiv({ cls: "get-importer-section" });
        manualImportSection.createEl("h3", { text: "📁 手动导入" });
        manualImportSection.createEl("p", {
            text: "上传从 Get笔记 导出的 ZIP 文件",
            cls: "setting-item-description"
        });
        const fileLocContol = manualImportSection.createEl("input", {
            type: "file",
            cls: "uploadbox"
        });
        fileLocContol.setAttr("accept", ".zip");
        fileLocContol.onchange = (ev) => {
            this.rawPath = ev.currentTarget.files[0]["path"];
            console.log(this.rawPath);
        };
        // 基本设置区域
        const basicSettingsSection = contentEl.createDiv({ cls: "get-importer-section" });
        basicSettingsSection.createEl("h3", { text: "⚙️ 基本设置" });
        new obsidian_1.Setting(basicSettingsSection)
            .setName('Get笔记 Home')
            .setDesc('设置 Get笔记 主目录位置')
            .addText(text => text
            .setPlaceholder('get')
            .setValue(this.plugin.settings.flomoTarget)
            .onChange(async (value) => {
            this.plugin.settings.flomoTarget = value;
        }));
        new obsidian_1.Setting(basicSettingsSection)
            .setName('笔记目录')
            .setDesc('笔记存放位置: Get笔记Home / 笔记目录')
            .addText((text) => text
            .setPlaceholder('notes')
            .setValue(this.plugin.settings.memoTarget)
            .onChange(async (value) => {
            this.plugin.settings.memoTarget = value;
        }));
        // 可视化设置区域
        const visualSection = contentEl.createDiv({ cls: "get-importer-section" });
        visualSection.createEl("h3", { text: "🎨 可视化设置" });
        new obsidian_1.Setting(visualSection)
            .setName('Moments')
            .setDesc('生成 Moments 时间线文件')
            .addDropdown((drp) => {
            drp.addOption("copy_with_link", "生成 Moments")
                .addOption("skip", "跳过 Moments")
                .setValue(this.plugin.settings.optionsMoments)
                .onChange(async (value) => {
                this.plugin.settings.optionsMoments = value;
            });
        });
        new obsidian_1.Setting(visualSection)
            .setName('Canvas')
            .setDesc('生成 Canvas 画布文件')
            .addDropdown((drp) => {
            drp.addOption("copy_with_link", "生成 Canvas（链接模式）")
                .addOption("copy_with_content", "生成 Canvas（内容模式）")
                .addOption("skip", "跳过 Canvas")
                .setValue(this.plugin.settings.optionsCanvas)
                .onChange(async (value) => {
                this.plugin.settings.optionsCanvas = value;
            });
        });
        const canvsOptionBlock = visualSection.createEl("div", { cls: "canvasOptionBlock" });
        const canvsOptionLabelL = canvsOptionBlock.createEl("label");
        const canvsOptionLabelM = canvsOptionBlock.createEl("label");
        const canvsOptionLabelS = canvsOptionBlock.createEl("label");
        const canvsSizeL = canvsOptionLabelL.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelL.createEl("small", { text: "large" });
        const canvsSizeM = canvsOptionLabelM.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelM.createEl("small", { text: "medium" });
        const canvsSizeS = canvsOptionLabelS.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelS.createEl("small", { text: "small" });
        canvsSizeL.name = "canvas_opt";
        canvsSizeM.name = "canvas_opt";
        canvsSizeS.name = "canvas_opt";
        switch (this.plugin.settings.canvasSize) {
            case "L":
                canvsSizeL.checked = true;
                break;
            case "M":
                canvsSizeM.checked = true;
                break;
            case "S":
                canvsSizeS.checked = true;
                break;
        }
        canvsSizeL.onchange = (ev) => {
            this.plugin.settings.canvasSize = "L";
        };
        canvsSizeM.onchange = (ev) => {
            this.plugin.settings.canvasSize = "M";
        };
        canvsSizeS.onchange = (ev) => {
            this.plugin.settings.canvasSize = "S";
        };
        // 高级选项区域
        const advancedSection = contentEl.createDiv({ cls: "get-importer-section" });
        advancedSection.createEl("h3", { text: "🔬 高级选项" });
        const allowBiLink = (0, common_1.createExpOpt)(advancedSection, "转换双向链接（支持 [[链接]] 语法）");
        allowBiLink.checked = this.plugin.settings.expOptionAllowbilink;
        allowBiLink.onchange = (ev) => {
            this.plugin.settings.expOptionAllowbilink = ev.currentTarget.checked;
        };
        const mergeByDate = (0, common_1.createExpOpt)(advancedSection, "按日期合并笔记（同一天的笔记合并到一个文件）");
        mergeByDate.checked = this.plugin.settings.mergeByDate;
        mergeByDate.onchange = (ev) => {
            this.plugin.settings.mergeByDate = ev.currentTarget.checked;
        };
        // 自动同步区域
        const autoSyncSection = contentEl.createDiv({ cls: "get-importer-section" });
        autoSyncSection.createEl("h3", { text: "🔄 自动同步" });
        const autoSyncOnStartup = (0, common_1.createExpOpt)(autoSyncSection, "启动 Obsidian 时自动同步");
        autoSyncOnStartup.checked = this.plugin.settings.autoSyncOnStartup;
        autoSyncOnStartup.onchange = (ev) => {
            this.plugin.settings.autoSyncOnStartup = ev.currentTarget.checked;
        };
        const autoSyncInterval = (0, common_1.createExpOpt)(autoSyncSection, "每小时自动同步一次");
        autoSyncInterval.checked = this.plugin.settings.autoSyncInterval;
        autoSyncInterval.onchange = (ev) => {
            this.plugin.settings.autoSyncInterval = ev.currentTarget.checked;
            if (ev.currentTarget.checked) {
                // 如果启用了每小时同步，立即开始定时任务
                this.plugin.startAutoSync();
            }
            else {
                // 如果禁用了每小时同步，停止定时任务
                this.plugin.stopAutoSync();
            }
        };
        // 显示上次同步时间和同步记录数
        if (this.plugin.settings.lastSyncTime) {
            const lastSyncDate = new Date(this.plugin.settings.lastSyncTime);
            const syncedCount = this.plugin.settings.syncedMemoIds?.length || 0;
            const syncStatusEl = autoSyncSection.createDiv({ cls: "sync-status-box" });
            syncStatusEl.createEl("div", {
                text: `📅 上次同步: ${lastSyncDate.toLocaleString()}`,
                cls: "sync-info-item"
            });
            syncStatusEl.createEl("div", {
                text: `📝 已同步笔记: ${syncedCount} 条`,
                cls: "sync-info-item"
            });
        }
        // 数据管理区域
        const dataSection = contentEl.createDiv({ cls: "get-importer-section" });
        dataSection.createEl("h3", { text: "🗃️ 数据管理" });
        // 添加重置同步记录按钮
        new obsidian_1.Setting(dataSection)
            .setName('重置同步历史')
            .setDesc('清除所有已同步的笔记记录，下次同步时将重新导入所有笔记')
            .addButton((btn) => {
            btn.setButtonText("重置同步历史")
                .setWarning()
                .onClick(async () => {
                const flomoTarget = this.plugin.settings.flomoTarget || "get";
                const memoTarget = this.plugin.settings.memoTarget || "notes";
                const confirmed = confirm(`确定要重置同步历史吗？\n\n` +
                    `这将清除 ${this.plugin.settings.syncedMemoIds?.length || 0} 条已同步的笔记记录。\n` +
                    `下次同步时将重新导入所有 Get笔记。\n\n` +
                    `⚠️  重要提示: 在再次同步之前，您应该：\n` +
                    `1. 删除旧的笔记目录: ${flomoTarget}/${memoTarget}/\n` +
                    `2. 如果附件路径已更改，删除旧的附件目录\n\n` +
                    `否则，现有文件将被覆盖！`);
                if (confirmed) {
                    this.plugin.settings.syncedMemoIds = [];
                    this.plugin.settings.lastSyncTime = 0;
                    await this.plugin.saveSettings();
                    new obsidian_1.Notice(`同步历史已重置。\n\n` +
                        `⚠️  记得在下次同步前删除旧目录:\n` +
                        `- ${flomoTarget}/${memoTarget}/\n` +
                        `- ${flomoTarget}/get attachment/ (如果存在)`, 10000);
                    this.close();
                    this.open(); // 重新打开以刷新显示
                }
            });
        });
        // 操作按钮区域
        const actionSection = contentEl.createDiv({ cls: "get-importer-actions" });
        new obsidian_1.Setting(actionSection)
            .addButton((btn) => {
            btn.setButtonText("取消")
                .onClick(async () => {
                await this.plugin.saveSettings();
                this.close();
            });
        })
            .addButton((btn) => {
            btn.setButtonText("手动导入")
                .setCta()
                .onClick(async () => {
                if (this.rawPath != "") {
                    await this.plugin.saveSettings();
                    await this.onSubmit();
                    this.close();
                }
                else {
                    new obsidian_1.Notice("请先选择 ZIP 文件");
                }
            });
        })
            .addButton((btn) => {
            btn.setButtonText("自动同步 🚀")
                .setCta()
                .setClass("sync-btn-primary")
                .onClick(async () => {
                await this.plugin.saveSettings();
                await this.onSync(btn);
            });
        });
    }
    onClose() {
        this.rawPath = "";
        const { contentEl } = this;
        contentEl.empty();
    }
}
exports.MainUI = MainUI;
