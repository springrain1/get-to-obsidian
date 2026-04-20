import { addIcon, Plugin, Modal, Notice, ButtonComponent } from 'obsidian';
import { MainUI } from './lib/ui/main_ui';
import { GetImporter } from './lib/get/importer';
import * as fs from 'fs-extra';
import { AUTH_FILE, DOWNLOAD_FILE } from './lib/get/const';

const GET_NOTES_ICON = '<svg xmlns="http://www.w3.org/2000/svg" ' +
	'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
	'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>' +
	'<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' +
	'<line x1="16" y1="2" x2="16" y2="22"/>' +
	'<line x1="8" y1="7" x2="13" y2="7"/>' +
	'<line x1="8" y1="11" x2="13" y2="11"/>' +
	'<line x1="8" y1="15" x2="13" y2="15"/>' +
	'</svg>';

interface MyPluginSettings {
	getTarget: string,
	memoTarget: string,
	optionsMoments: string,
	optionsCanvas: string,
	expOptionAllowbilink: boolean,
	canvasSize: string,
	mergeByDate: boolean,
	autoSyncOnStartup: boolean,
	autoSyncInterval: boolean,
	lastSyncTime: number,
	syncedMemoIds: string[]
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	getTarget: 'get',
	memoTarget: 'notes',
	optionsMoments: "copy_with_link",
	optionsCanvas: "copy_with_content",
	expOptionAllowbilink: true,
	canvasSize: 'M',
	mergeByDate: false,
	autoSyncOnStartup: false,
	autoSyncInterval: false,
	lastSyncTime: 0,
	syncedMemoIds: []
}

export default class GetImporterPlugin extends Plugin {
	settings: MyPluginSettings;
	mainUI: MainUI;
	syncIntervalId: number | null = null;
	
	async onload() {
		await this.loadSettings();
		this.mainUI = new MainUI(this.app, this);

		// Get笔记 官方图标 - 矢量化品牌样式
		addIcon('get-notes', GET_NOTES_ICON);
		const ribbonIconEl = this.addRibbonIcon('get-notes', 'Get笔记 Importer', (evt: MouseEvent) => {
			this.mainUI.open();
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Get笔记 Importer Command
		this.addCommand({
			id: 'open-get-importer',
			name: 'Open Get笔记 Importer',
			callback: () => {
				this.mainUI.open();
			},
		});

		// 添加手动触发同步的命令
		this.addCommand({
			id: 'sync-get-now',
			name: 'Sync Get笔记 Now',
			callback: async () => {
				await this.syncGet();
			},
		});
		
		// 启动时自动同步
		if (this.settings.autoSyncOnStartup) {
			// 等待 2 秒让 Obsidian 完全加载
			setTimeout(async () => {
				await this.syncGet();
			}, 2000);
		}
		
		// 设置定时同步
		if (this.settings.autoSyncInterval) {
			this.startAutoSync();
		}
	}

	
	onunload() {
		// 清除定时器
		if (this.syncIntervalId !== null) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = null;
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	
	// 开始自动同步
	startAutoSync() {
		// 清除现有的定时器
		if (this.syncIntervalId !== null) {
			window.clearInterval(this.syncIntervalId);
		}
		
		// 设置每小时同步一次 (3600000ms = 1小时)
		this.syncIntervalId = window.setInterval(async () => {
			await this.syncGet();
		}, 3600000);
	}
	
	// 停止自动同步
	stopAutoSync() {
		if (this.syncIntervalId !== null) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = null;
		}
	}
	
	// 同步 Get笔记 数据
	async syncGet() {
		try {
			// 使用 mainUI 的 onSync 方法进行同步
			const syncBtn = new ButtonComponent(document.createElement('div'));
			await this.mainUI.onSync(syncBtn);

			// 更新最后同步时间
			this.settings.lastSyncTime = Date.now();
			await this.saveSettings();
		} catch (error) {
			console.error("Auto sync failed:", error);
			new Notice("Get笔记 auto sync failed: " + error.message);
		}
	}

	// 执行自动同步
	private async runAutoSync(): Promise<void> {
		if (!this.settings.autoSyncOnStartup && !this.settings.autoSyncInterval) {
			return; // 如果两个自动同步选项都关闭，直接返回
		}

		try {
			console.log("开始自动同步 Get笔记 数据...");
			const isAuthFileExist = await fs.exists(AUTH_FILE);

			if (!isAuthFileExist) {
				console.log("未找到认证文件，无法自动同步");
				return;
			}

			// 检查下载文件是否存在
			if (!await fs.exists(DOWNLOAD_FILE)) {
				console.log("未找到下载文件，等待先手动同步一次");
				new Notice("Get笔记: 请先手动同步一次，以便自动同步功能正常工作");
				return;
			}

			// 创建导入器
			const importer = new GetImporter(this.app, this.settings);

			// 执行导入
			const result = await importer.importGetFile(DOWNLOAD_FILE, this.settings.mergeByDate);

			// 保存更新后的设置
			await this.saveSettings();

			// 显示结果通知
			if (result.newCount > 0) {
				new Notice(`Get笔记 自动同步完成: 发现 ${result.count} 条笔记，新增 ${result.newCount} 条`);
			} else if (result.count > 0) {
				new Notice(`Get笔记 自动同步完成: 全部 ${result.count} 条笔记已是最新`);
			} else {
				new Notice(`Get笔记 自动同步完成: 未发现任何笔记`);
			}

			// 更新最后同步时间显示（如果UI界面打开的话）
			if (this.mainUI) {
				const lastSyncTimeStr = new Date(this.settings.lastSyncTime).toLocaleString();
				const syncStatusEl = this.mainUI.contentEl.querySelector('.last-sync-time');
				if (syncStatusEl) {
					syncStatusEl.textContent = `上次同步: ${lastSyncTimeStr}`;
				}
			}

			console.log(`自动同步完成: 总共 ${result.count} 条笔记, 新增 ${result.newCount} 条`);
		} catch (error) {
			console.error("自动同步失败:", error);
			new Notice(`Get笔记 自动同步失败: ${error.message}`);
		}
	}
}