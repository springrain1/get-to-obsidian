/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import * as playwright from 'playwright';

import { DOWNLOAD_FILE, AUTH_FILE, GET_EXPORT_URL } from './const'

export class GetExporter {
    async export(): Promise<[boolean, string]> {
        let browser = null;
        try {
            // Setup - 使用无头模式后台运行（认证已完成，无需用户交互）
            browser = await playwright.chromium.launch({ headless: true });

            const context = await browser.newContext({ storageState: AUTH_FILE });
            const page = await context.newPage();

            // 访问Get笔记导出页面
            await page.goto(GET_EXPORT_URL, { waitUntil: 'networkidle' });

            // 等待页面加载完成
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);

            // 调试用: 保存页面截图
            try {
                const screenshotPath = DOWNLOAD_FILE.replace('get_export.zip', 'page_screenshot.png');
                await page.screenshot({ path: screenshotPath, fullPage: true });
            } catch {/* ignore */}

            // 等待导出相关元素出现

            // 尝试多种方式查找导出按钮
            let exportButton = null;
            

            // 方式1: 查找包含"导出"文本的按钮
            try {
                exportButton = page.locator('button:has-text("导出")').first();
                await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                
            } catch {/* ignore */}

            // 方式2: 查找包含"下载"文本的按钮（Get笔记可能使用"下载"）
            if (!exportButton) {
                try {
                    exportButton = page.locator('button:has-text("下载")').first();
                    await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                    
                } catch {/* ignore */}
            }

            // 方式3: 通过 class 或 role 查找
            if (!exportButton) {
                try {
                    exportButton = page.locator('[class*="export"], [class*="download"], a:has-text("导出"), a:has-text("下载")').first();
                    await exportButton.waitFor({ state: 'visible', timeout: 5000 });
                    
                } catch {/* ignore */}
            }

            if (!exportButton) {
                throw new Error('无法找到导出按钮。请检查Get笔记导出页面的实际结构。');
            }


            // 确保按钮完全可点击
            await exportButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            // 设置下载监听 - 在点击之前就设置好
            const downloadPromise = page.waitForEvent('download', { timeout: 10 * 60 * 1000 });

            // 点击导出按钮
            await exportButton.click({ timeout: 5000 });

            // 等待下载开始
            const download = await downloadPromise;

            await download.saveAs(DOWNLOAD_FILE);

            // Teardown
            await context.close();
            await browser.close();

            return [true, ""]
        } catch (error) {
            console.error('导出过程出错:', error);

            // 确保浏览器关闭
            if (browser) {
                try {
                    await browser.close();
                } catch(err) {
                    console.error('关闭浏览器失败:', err);
                }
            }

            return [false, `导出失败: ${error.message || error}`];
        }
    }

}