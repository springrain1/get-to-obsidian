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
exports.FlomoExporter = void 0;
const playwright = __importStar(require("playwright"));
const const_1 = require("./const");
class FlomoExporter {
    async export() {
        let browser = null;
        try {
            // Setup - 使用无头模式后台运行（认证已完成，无需用户交互）
            browser = await playwright.chromium.launch({ headless: true });
            const context = await browser.newContext({ storageState: const_1.AUTH_FILE });
            const page = await context.newPage();
            console.log('正在访问 Get笔记 导出页面...');
            // 访问Get笔记导出页面
            await page.goto(const_1.GET_EXPORT_URL, { waitUntil: 'networkidle' });
            // 等待页面加载完成
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);
            console.log('页面已加载完成');
            // 调试用: 保存页面截图
            try {
                const screenshotPath = const_1.DOWNLOAD_FILE.replace('get_export.zip', 'page_screenshot.png');
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`页面截图已保存到: ${screenshotPath}`);
            }
            catch (e) {
                console.log('保存截图失败:', e.message);
            }
            // 等待导出相关元素出现
            console.log('查找导出按钮...');
            // 尝试多种方式查找导出按钮
            let exportButton = null;
            let foundMethod = '';
            // 方式1: 查找包含"导出"文本的按钮
            try {
                exportButton = page.locator('button:has-text("导出")').first();
                await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                foundMethod = '方式1: 导出按钮';
                console.log('找到导出按钮 (方式1)');
            }
            catch (e) {
                console.log('方式1失败,尝试方式2');
            }
            // 方式2: 查找包含"下载"文本的按钮（Get笔记可能使用"下载"）
            if (!exportButton) {
                try {
                    exportButton = page.locator('button:has-text("下载")').first();
                    await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                    foundMethod = '方式2: 下载按钮';
                    console.log('找到导出按钮 (方式2: 下载)');
                }
                catch (e) {
                    console.log('方式2失败,尝试方式3');
                }
            }
            // 方式3: 通过 class 或 role 查找
            if (!exportButton) {
                try {
                    exportButton = page.locator('[class*="export"], [class*="download"], a:has-text("导出"), a:has-text("下载")').first();
                    await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                    foundMethod = '方式3: 通用选择器';
                    console.log('找到导出按钮 (方式3)');
                }
                catch (e) {
                    console.log('方式3失败');
                }
            }
            if (!exportButton) {
                throw new Error('无法找到导出按钮。请检查Get笔记导出页面的实际结构。');
            }
            console.log(`成功找到导出按钮 (${foundMethod})`);
            // 确保按钮完全可点击
            await exportButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            // 设置下载监听 - 在点击之前就设置好
            const downloadPromise = page.waitForEvent('download', { timeout: 10 * 60 * 1000 });
            // 点击导出按钮
            console.log('点击导出按钮...');
            await exportButton.click({ timeout: 5000 });
            console.log('已触发点击');
            // 等待下载开始
            console.log('等待下载开始...');
            const download = await downloadPromise;
            console.log('下载已触发,正在保存文件...');
            await download.saveAs(const_1.DOWNLOAD_FILE);
            console.log(`文件已保存到: ${const_1.DOWNLOAD_FILE}`);
            // Teardown
            await context.close();
            await browser.close();
            return [true, ""];
        }
        catch (error) {
            console.error('导出过程出错:', error);
            // 确保浏览器关闭
            if (browser) {
                try {
                    await browser.close();
                }
                catch (e) {
                    console.error('关闭浏览器失败:', e);
                }
            }
            return [false, `导出失败: ${error.message || error}`];
        }
    }
}
exports.FlomoExporter = FlomoExporter;
