import { addIcon, Plugin, Notice, ButtonComponent } from 'obsidian';
import { MainUI } from './lib/ui/main_ui';
import {  } from './lib/get/importer';
import {  } from './lib/get/const';

const GET_NOTES_ICON = '<svg xmlns="http://www.w3.org/2000/svg" ' +
	'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
	'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>' +
	'<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' +
	'<line x1="16" y1="2" x2="16" y2="22"/>' +
	'<line x1="8" y1="7" x2="13" y2="7"/>' +
	'<line x1="8" y1="11" x2="13" y2="11"/>' +
	'<line x1="8" y1="15" x2="13" y2="15"/>' +
	'</svg>';

interface GetImporterSettings {
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
	syncedMemoIds: string[],
	attachmentImport: {
		image: boolean,
		audio: boolean,
		video: boolean,
		document: boolean
	}
}

const DEFAULT_SETTINGS: GetImporterSettings = {
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
	syncedMemoIds: [],
	attachmentImport: {
		image: true,
		audio: true,
		video: true,
		document: true
	}
}

export default class GetImporterPlugin extends Plugin {
	settings: GetImporterSettings;
	mainUI: MainUI;
	syncIntervalId: number | null = null;
	
	onload() {
		void (async () => {
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
			window.setTimeout(() => {
				void this.syncGet();
			}, 2000);
		}
		
		// 设置定时同步
		if (this.settings.autoSyncInterval) {
			this.startAutoSync();
		}
		})();
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
		this.syncIntervalId = window.setInterval(() => {
			void this.syncGet();
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
			const syncBtn = new ButtonComponent(createDiv());
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
	// 注意：此方法已废弃，因为 GetCore 不再支持字符串格式输入
	// 自动同步现在通过 MainUI.onSync() 实现
	private async runAutoSync(): Promise<void> {
		console.warn("runAutoSync() 已废弃，请使用 MainUI.onSync() 进行自动同步");
		// 使用新的同步方法
		await this.syncGet();
	}
}