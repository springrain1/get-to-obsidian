import { App, Modal, Setting, Notice, ButtonComponent } from 'obsidian';

import { createExpOpt } from './common';
import { AuthUI } from './auth_ui';
import { GetImporter } from '../get/importer';
import { GetExporter } from '../get/exporter';
import type GetImporterPlugin from '../../main';

import * as fs from 'fs-extra';
import * as path from 'path';

import { AUTH_FILE, DOWNLOAD_FILE } from '../get/const'

// ZIP 来源策略接口
interface ZipSource {
    path: string;
    needsCleanup: boolean;
    source: 'direct' | 'temp';
}

export class MainUI extends Modal {

    plugin: GetImporterPlugin;
    rawPath: string;
    selectedFile: File | null = null;

    constructor(app: App, plugin: GetImporterPlugin) {
        super(app);
        this.plugin = plugin;
        this.rawPath = "";
        this.selectedFile = null;
    }

    async onSync(btn: ButtonComponent): Promise<void> {
        const isAuthFileExist = await fs.exists(AUTH_FILE)
        try {
            if (isAuthFileExist) {
                btn.setDisabled(true);
                btn.setButtonText("正在从 Get笔记 导出...");
                const exportResult = await (new GetExporter().export());
                
                btn.setDisabled(false);
                if (exportResult[0] == true) {
                    this.rawPath = DOWNLOAD_FILE;
                    btn.setButtonText("Importing...");
                    await this.onSubmit();
                    btn.setButtonText("Auto Sync 🤗");
                } else {
                    throw new Error(exportResult[1]);
                }
            } else {
                const authUI: Modal = new AuthUI(this.app, this.plugin);
                authUI.open();
            }
        } catch (err) {
            btn.setButtonText("Auto Sync 🤗");
            new Notice(`Get笔记 同步错误. 详情:\n${err}`);
        }
    }

    async onSubmit(): Promise<void> {
        // 统一的 ZIP 来源决策
        let zipSource: ZipSource | null = null;

        if (this.selectedFile) {
            // 有文件对象：解析最佳策略（直接路径 or 临时文件）
            try {
                zipSource = await this.resolveZipSourceFromSelectedFile();
            } catch (err: any) {
                console.error("ZIP 来源解析失败:", err);
                new Notice("ZIP 来源解析失败: " + err.message);
                return;
            }
        } else if (this.rawPath) {
            // 有直接路径（如自动同步）：直接使用
            zipSource = {
                path: this.rawPath,
                needsCleanup: false,
                source: 'direct',
            };
        } else {
            new Notice("请先选择 ZIP 文件");
            return;
        }

        const targetMemoLocation = this.plugin.settings.getTarget + "/" +
            this.plugin.settings.memoTarget;

        const res = await this.app.vault.adapter.exists(targetMemoLocation);
        if (!res) {
            console.debug(`DEBUG: creating memo root -> ${targetMemoLocation}`);
            await this.app.vault.adapter.mkdir(`${targetMemoLocation}`);
        }

        try {
            const config = this.plugin.settings;
            config["rawDir"] = zipSource.path;
            config["needsCleanup"] = zipSource.needsCleanup;

            // 将已同步的备忘录ID传递给导入器，用于增量同步
            config["syncedMemoIds"] = this.plugin.settings.syncedMemoIds || [];

            const flomo = await (new GetImporter(this.app, config)).import();

            // 保存新同步的备忘录ID
            if (flomo.syncedMemoIds && flomo.syncedMemoIds.length > 0) {
                this.plugin.settings.syncedMemoIds = flomo.syncedMemoIds;
                await this.plugin.saveSettings();
            }

            new Notice(`🎉 导入完成.\n总数: ${flomo.memos.length} 条笔记, 新增: ${flomo.newMemosCount || 0} 条笔记`)
            this.rawPath = "";
            this.selectedFile = null;

        } catch (err) {
            this.rawPath = "";
            this.selectedFile = null;
            new Notice(`Get笔记 导入错误. 详情:\n${err}`);
        }
    }

    /**
     * 使用真流式 API 将文件写入临时目录
     * 优先直接路径，回退时使用 Web File stream 写入本地临时 ZIP
     * @param file File 对象
     * @param tempPath 临时文件路径
     */
    private async streamFileToTempPath(file: File, tempPath: string): Promise<void> {
        const reader = file.stream().getReader();
        const ws = fs.createWriteStream(tempPath);
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (!ws.write(Buffer.from(value))) {
                    // 等待 drain 事件，避免内存积压
                    await new Promise(resolve => ws.once('drain', resolve));
                }
            }
            
            // 确保流正确关闭
            await new Promise<void>((resolve, reject) => {
                ws.end(err => err ? reject(err) : resolve());
            });
        } catch (error) {
            ws.destroy();
            throw error;
        }
    }

    /**
     * 从选择的文件解析 ZIP 来源策略
     * 优先使用直接路径，失败时回退到流式临时文件
     */
    private async resolveZipSourceFromSelectedFile(): Promise<ZipSource> {
        if (!this.selectedFile) {
            throw new Error('selectedFile 为空');
        }

        const file = this.selectedFile as File & { path?: string };
        const { GET_CACHE_LOC } = await import('../get/const');
        const tempPath = path.join(GET_CACHE_LOC, 'manual_import.zip');
        await fs.mkdirp(GET_CACHE_LOC);


        // 优先尝试使用直接路径（桌面端）
        if (file.path) {
            try {
                await fs.access(file.path, fs.constants.R_OK);
                return {
                    path: file.path,
                    needsCleanup: false,
                    source: 'direct',
                };
            } catch (error) {
                console.warn(`路径不可用回退: ${file.path}`, error);
            }
        } else {
        }

        // 回退：使用真流式写入临时文件
        try {
            await this.streamFileToTempPath(file, tempPath);
            return {
                path: tempPath,
                needsCleanup: true,
                source: 'temp',
            };
        } catch (error) {
            throw new Error(`临时写入失败: ${error instanceof Error ? error.message : String(error)}`);
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

        const fileLocContol: HTMLInputElement = manualImportSection.createEl("input", {
            type: "file",
            cls: "uploadbox"
        });
        fileLocContol.setAttr("accept", ".zip");
        fileLocContol.onchange = (ev) => {
            const files = (ev.currentTarget as HTMLInputElement).files;
            if (files && files.length > 0) {
                const file = files[0] as any;
                // 优先使用 Electron 的 path 属性（桌面端），移动端可能为 undefined
                this.rawPath = file.path || "";
                // 同时保存 File 对象作为备用（path 不可用时走 arrayBuffer 回退）
                this.selectedFile = files[0];
                if (!this.rawPath) {
                }
            }
        };

        // 基本设置区域
        const basicSettingsSection = contentEl.createDiv({ cls: "get-importer-section" });
        basicSettingsSection.createEl("h3", { text: "⚙️ 基本设置" });

        new Setting(basicSettingsSection)
            .setName('Get笔记 Home')
            .setDesc('设置 Get笔记 主目录位置')
            .addText(text => text
                .setPlaceholder('get')
                .setValue(this.plugin.settings.getTarget)
                .onChange(async (value) => {
                    this.plugin.settings.getTarget = value;
                }));

        new Setting(basicSettingsSection)
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

        new Setting(visualSection)
            .setName('Moments')
            .setDesc('生成 Moments 时间线文件')
            .addDropdown((drp) => {
                drp.addOption("copy_with_link", "生成 Moments")
                    .addOption("skip", "跳过 Moments")
                    .setValue(this.plugin.settings.optionsMoments)
                    .onChange(async (value) => {
                        this.plugin.settings.optionsMoments = value;
                    })
            })

        new Setting(visualSection)
            .setName('Canvas')
            .setDesc('生成 Canvas 画布文件')
            .addDropdown((drp) => {
                drp.addOption("copy_with_link", "生成 Canvas（链接模式）")
                    .addOption("copy_with_content", "生成 Canvas（内容模式）")
                    .addOption("skip", "跳过 Canvas")
                    .setValue(this.plugin.settings.optionsCanvas)
                    .onChange(async (value) => {
                        this.plugin.settings.optionsCanvas = value;
                    })
            });

        const canvsOptionBlock: HTMLDivElement = visualSection.createEl("div", { cls: "canvasOptionBlock" });

        const canvsOptionLabelL: HTMLLabelElement = canvsOptionBlock.createEl("label");
        const canvsOptionLabelM: HTMLLabelElement = canvsOptionBlock.createEl("label");
        const canvsOptionLabelS: HTMLLabelElement = canvsOptionBlock.createEl("label");

        const canvsSizeL: HTMLInputElement = canvsOptionLabelL.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelL.createEl("small", { text: "large" });
        const canvsSizeM: HTMLInputElement = canvsOptionLabelM.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelM.createEl("small", { text: "medium" });
        const canvsSizeS: HTMLInputElement = canvsOptionLabelS.createEl("input", { type: "radio", cls: "ckbox" });
        canvsOptionLabelS.createEl("small", { text: "small" });

        canvsSizeL.name = "canvas_opt";
        canvsSizeM.name = "canvas_opt";
        canvsSizeS.name = "canvas_opt";

        switch (this.plugin.settings.canvasSize) {
            case "L":
                canvsSizeL.checked = true;
                break
            case "M":
                canvsSizeM.checked = true;
                break
            case "S":
                canvsSizeS.checked = true;
                break
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

        const allowBiLink = createExpOpt(advancedSection, "转换双向链接（支持 [[链接]] 语法）")

        allowBiLink.checked = this.plugin.settings.expOptionAllowbilink;
        allowBiLink.onchange = (ev) => {
            this.plugin.settings.expOptionAllowbilink = (ev.currentTarget as HTMLInputElement).checked;
        };


        const mergeByDate = createExpOpt(advancedSection, "按日期合并笔记（同一天的笔记合并到一个文件）")

        mergeByDate.checked = this.plugin.settings.mergeByDate;
        mergeByDate.onchange = (ev) => {
            this.plugin.settings.mergeByDate = (ev.currentTarget as HTMLInputElement).checked;
        };

        // 附件导入选项
        advancedSection.createEl("h4", { text: "附件导入设置", cls: "setting-item-heading" });
        advancedSection.createEl("p", {
            text: "选择要导入的附件类型",
            cls: "setting-item-description"
        });

        const imageCheckbox = createExpOpt(advancedSection, "导入图片附件 (jpg, png, gif, webp, heic)");
        imageCheckbox.checked = this.plugin.settings.attachmentImport.image;
        imageCheckbox.onchange = (ev) => {
            this.plugin.settings.attachmentImport.image = (ev.currentTarget as HTMLInputElement).checked;
        };

        const audioCheckbox = createExpOpt(advancedSection, "导入音频附件 (mp3, m4a, wav)");
        audioCheckbox.checked = this.plugin.settings.attachmentImport.audio;
        audioCheckbox.onchange = (ev) => {
            this.plugin.settings.attachmentImport.audio = (ev.currentTarget as HTMLInputElement).checked;
        };

        const videoCheckbox = createExpOpt(advancedSection, "导入视频附件 (mp4, mov)");
        videoCheckbox.checked = this.plugin.settings.attachmentImport.video;
        videoCheckbox.onchange = (ev) => {
            this.plugin.settings.attachmentImport.video = (ev.currentTarget as HTMLInputElement).checked;
        };

        const documentCheckbox = createExpOpt(advancedSection, "导入文档附件 (pdf, doc, docx, txt)");
        documentCheckbox.checked = this.plugin.settings.attachmentImport.document;
        documentCheckbox.onchange = (ev) => {
            this.plugin.settings.attachmentImport.document = (ev.currentTarget as HTMLInputElement).checked;
        };

        // 自动同步区域
        const autoSyncSection = contentEl.createDiv({ cls: "get-importer-section" });
        autoSyncSection.createEl("h3", { text: "🔄 自动同步" });

        const autoSyncOnStartup = createExpOpt(autoSyncSection, "启动 Obsidian 时自动同步")

        autoSyncOnStartup.checked = this.plugin.settings.autoSyncOnStartup;
        autoSyncOnStartup.onchange = (ev) => {
            this.plugin.settings.autoSyncOnStartup = (ev.currentTarget as HTMLInputElement).checked;
        };

        const autoSyncInterval = createExpOpt(autoSyncSection, "每小时自动同步一次")

        autoSyncInterval.checked = this.plugin.settings.autoSyncInterval;
        autoSyncInterval.onchange = (ev) => {
            this.plugin.settings.autoSyncInterval = (ev.currentTarget as HTMLInputElement).checked;
            if ((ev.currentTarget as HTMLInputElement).checked) {
                // 如果启用了每小时同步，立即开始定时任务
                (this.plugin as any).startAutoSync();
            } else {
                // 如果禁用了每小时同步，停止定时任务
                (this.plugin as any).stopAutoSync();
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
        new Setting(dataSection)
            .setName('重置同步历史')
            .setDesc('清除所有已同步的笔记记录，下次同步时将重新导入所有笔记')
            .addButton((btn) => {
                btn.setButtonText("重置同步历史")
                    .setWarning()
                    .onClick(async () => {
                        const getTarget = this.plugin.settings.getTarget || "get";
                        const memoTarget = this.plugin.settings.memoTarget || "notes";
                        const confirmed = window.confirm(
                            `确定要重置同步历史吗？\n\n` +
                            `这将清除 ${this.plugin.settings.syncedMemoIds?.length || 0} 条已同步的笔记记录。\n` +
                            `下次同步时将重新导入所有 Get笔记。\n\n` +
                            `⚠️  重要提示: 在再次同步之前，您应该：\n` +
                            `1. 删除旧的笔记目录: ${getTarget}/${memoTarget}/\n` +
                            `2. 如果附件路径已更改，删除旧的附件目录\n\n` +
                            `否则，现有文件将被覆盖！`
                        );
                        if (confirmed) {
                            this.plugin.settings.syncedMemoIds = [];
                            this.plugin.settings.lastSyncTime = 0;
                            await this.plugin.saveSettings();
                            new Notice(
                                `同步历史已重置。\n\n` +
                                `⚠️  记得在下次同步前删除旧目录:\n` +
                                `- ${getTarget}/${memoTarget}/\n` +
                                `- ${getTarget}/get attachment/ (如果存在)`,
                                10000
                            );
                            this.close();
                            this.open(); // 重新打开以刷新显示
                        }
                    })
            });

        // 操作按钮区域
        const actionSection = contentEl.createDiv({ cls: "get-importer-actions" });

        new Setting(actionSection)
            .addButton((btn) => {
                btn.setButtonText("取消")
                    .onClick(async () => {
                        await this.plugin.saveSettings();
                        this.close();
                    })
            })
            .addButton((btn) => {
                btn.setButtonText("手动导入")
                    .setCta()
                    .onClick(async () => {
                        if (this.rawPath !== "" || this.selectedFile) {
                            await this.plugin.saveSettings();
                            await this.onSubmit();
                            this.close();
                        }
                        else {
                            new Notice("请先选择 ZIP 文件")
                        }
                    })
            })
            .addButton((btn) => {
                btn.setButtonText("自动同步 🚀")
                    .setCta()
                    .setClass("sync-btn-primary")
                    .onClick(async () => {
                        await this.plugin.saveSettings();
                        await this.onSync(btn);
                    })
            });   

    }

    onClose() {
        // 保存设置到磁盘（异步，但不等待完成）
        void this.plugin.saveSettings().catch(error => {
            console.error('保存设置失败:', error);
        });
        
        this.rawPath = "";
        this.selectedFile = null;
        const { contentEl } = this;
        contentEl.empty();
    }
} 