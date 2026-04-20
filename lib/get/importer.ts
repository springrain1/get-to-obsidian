import * as path from 'path';
import * as os from 'os';
import *  as fs from 'fs-extra';

import { App } from 'obsidian';
import decompress from 'decompress';
import * as parse5 from "parse5"

import { GetCore } from './core';
import { generateMoments } from '../obIntegration/moments';
import { generateCanvas } from '../obIntegration/canvas';

import { GET_CACHE_LOC } from './const'


export class GetImporter {
    private config: Record<string, any>;
    private app: App;

    constructor(app: App, config: Record<string, any>) {
        this.config = config;
        this.app = app;
    }

    private async sanitize(path: string): Promise<string> {
        const getData = await fs.readFile(path, "utf8");
        const document = parse5.parse(getData);
        return parse5.serialize(document);
    }

    private async importMemos(flomo: GetCore): Promise<GetCore> {
        const allowBilink: boolean = this.config["expOptionAllowbilink"];
        const margeByDate: boolean = this.config["mergeByDate"];

        for (const [idx, memo] of flomo.memos.entries()) {

            const memoSubDir = `${this.config["getTarget"]}/${this.config["memoTarget"]}/${memo["date"]}`;

            // 标题中可能含有 / \ : 等路径非法字符（如 "2026/4/12"），需要先做清理
            const safeTitle = (memo["title"] || 'untitled')
                .replace(/[\/\\:*?"<>|]/g, '-')  // 替换路径非法字符
                .replace(/\s+/g, ' ')             // 合并多余空格
                .trim();

            const memoFilePath = margeByDate
                ? `${memoSubDir}/memo@${memo["date"]}.md`
                : `${memoSubDir}/memo@${safeTitle}_${flomo.memos.length - idx}.md`;

            // 使用 Obsidian API 创建目录，而不是直接文件系统操作
            await this.app.vault.adapter.mkdir(memoSubDir);
            
            const content = (() => {
                // @Mar-31, 2024 Fix: #20 - Support <mark>.*?<mark/>
                // Break it into 2 stages, too avoid "==" translating to "\=="
                //  1. Replace <mark> & </mark> with GETIMPORTERHIGHLIGHTMARKPLACEHOLDER (in lib/flomo/core.ts)
                //  2. Replace GETIMPORTERHIGHLIGHTMARKPLACEHOLDER with ==
                const res = memo["content"].replaceAll("GETIMPORTERHIGHLIGHTMARKPLACEHOLDER", "==");

                if (allowBilink == true) {
                    return res.replace(`\\[\\[`, "[[").replace(`\\]\\]`, "]]");
                }

                return res;

            })();

            if (!(memoFilePath in flomo.files)) {
                flomo.files[memoFilePath] = []
            }

            flomo.files[memoFilePath].push(content);
        }

        for (const filePath in flomo.files) {
            await this.app.vault.adapter.write(
                filePath,
                flomo.files[filePath].join("\n\n---\n\n")
            );
        }

        return flomo;
    }

    // 递归复制附件目录中的所有文件
    // skipLevels: 跳过的目录层级数（用于跳过 file/ 和用户ID目录）
    private async copyAttachmentsRecursively(sourceDir: string, targetDir: string, skipLevels: number = 0): Promise<void> {
        try {
            const items = await fs.readdir(sourceDir, { withFileTypes: true });

            for (const item of items) {
                const sourcePath = `${sourceDir}/${item.name}`;

                if (item.isDirectory()) {
                    if (skipLevels > 0) {
                        // 跳过这一层目录，直接递归到下一层
                        console.debug(`跳过目录层级: ${sourcePath}`);
                        await this.copyAttachmentsRecursively(sourcePath, targetDir, skipLevels - 1);
                    } else {
                        // 正常处理：检查是否包含文件
                        const hasFiles = await this.directoryHasFiles(sourcePath);
                        if (hasFiles) {
                            const targetPath = `${targetDir}${item.name}`;
                            console.debug(`创建目录: ${targetPath}/`);
                            await this.app.vault.adapter.mkdir(`${targetPath}/`);
                            await this.copyAttachmentsRecursively(sourcePath, `${targetPath}/`, 0);
                        } else {
                            console.debug(`跳过空目录: ${sourcePath}`);
                        }
                    }
                } else if (item.isFile()) {
                    // 如果是文件，复制文件
                    const targetPath = `${targetDir}${item.name}`;
                    try {
                        const content = await fs.readFile(sourcePath);
                        await this.app.vault.adapter.writeBinary(targetPath, content);
                        console.debug(`复制附件文件: ${sourcePath} -> ${targetPath}`);
                    } catch (copyError) {
                        console.warn(`复制附件文件失败: ${sourcePath} -> ${targetPath}`, copyError);
                    }
                }
            }
        } catch (error) {
            console.warn(`读取目录失败: ${sourceDir}`, error);
        }
    }

    // 检查目录是否包含文件（递归检查子目录）
    private async directoryHasFiles(dirPath: string): Promise<boolean> {
        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isFile()) {
                    return true; // 找到文件
                } else if (item.isDirectory()) {
                    // 递归检查子目录
                    const subDirPath = `${dirPath}/${item.name}`;
                    if (await this.directoryHasFiles(subDirPath)) {
                        return true;
                    }
                }
            }

            return false; // 没有找到文件
        } catch (error) {
            console.warn(`检查目录失败: ${dirPath}`, error);
            return false;
        }
    }

    // 专门用于复制 Get笔记 附件的方法
    // Get笔记 导出结构: file/日期/用户ID/文件
    // 目标结构: flomo attachment/日期/文件 (跳过 file/ 和用户ID层)
    private async copyAttachmentsSkipUserIdDir(sourceDir: string, targetDir: string): Promise<void> {
        try {
            const dateItems = await fs.readdir(sourceDir, { withFileTypes: true });

            // 第一层：日期目录 (如 2025-11-03)
            for (const dateItem of dateItems) {
                if (!dateItem.isDirectory()) continue;

                const dateDirPath = `${sourceDir}/${dateItem.name}`;
                const targetDateDir = `${targetDir}${dateItem.name}/`;

                // 检查日期目录下是否有文件
                const hasFiles = await this.directoryHasFiles(dateDirPath);
                if (!hasFiles) {
                    console.debug(`跳过空日期目录: ${dateDirPath}`);
                    continue;
                }

                // 创建日期目录
                await this.app.vault.adapter.mkdir(targetDateDir);
                console.debug(`创建日期目录: ${targetDateDir}`);

                const userIdItems = await fs.readdir(dateDirPath, { withFileTypes: true });

                // 第二层：用户ID目录 (如 4852) - 跳过这一层
                for (const userIdItem of userIdItems) {
                    if (!userIdItem.isDirectory()) continue;

                    const userIdDirPath = `${dateDirPath}/${userIdItem.name}`;
                    const fileItems = await fs.readdir(userIdDirPath, { withFileTypes: true });

                    // 第三层：文件 - 直接复制到日期目录下
                    for (const fileItem of fileItems) {
                        if (!fileItem.isFile()) continue;

                        const sourceFilePath = `${userIdDirPath}/${fileItem.name}`;
                        const targetFilePath = `${targetDateDir}${fileItem.name}`;

                        try {
                            const content = await fs.readFile(sourceFilePath);
                            await this.app.vault.adapter.writeBinary(targetFilePath, content);
                            console.debug(`复制附件: ${sourceFilePath} -> ${targetFilePath}`);
                        } catch (copyError) {
                            console.warn(`复制附件失败: ${sourceFilePath}`, copyError);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`复制附件目录失败: ${sourceDir}`, error);
        }
    }

    async import(): Promise<GetCore> {

        // 1. Create workspace
        const tmpDir = path.join(GET_CACHE_LOC, "data")
        await fs.mkdirp(tmpDir);

        // 2. Unzip get_export.zip to workspace
        const files = await decompress(this.config["rawDir"], tmpDir)

        // 3. Get笔记: 读取所有笔记HTML文件
        const notesData = new Map<string, string>();
        const notesDir = path.join(tmpDir, 'notes');

        if (await fs.exists(notesDir)) {
            const noteFiles = await fs.readdir(notesDir);
            for (const file of noteFiles) {
                if (file.endsWith('.html') && file !== 'index.html') {
                    const filePath = path.join(notesDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    notesData.set(file, content);
                }
            }
        }

        console.debug(`找到 ${notesData.size} 个笔记HTML文件`);

        // 4. 复制附件到 ObVault
        // Get笔记附件结构：notes/files/*.jpg, *.mp3
        const getTarget = this.config["getTarget"] || "get";
        let attachementDir = `${getTarget}/get attachment`; // 移除尾部斜杠防止Obsidian创建空名字的子目录

        console.debug(`使用附件目录: ${attachementDir} (基于 getTarget: ${getTarget})`);

        const filesDir = path.join(notesDir, 'files');
        if (await fs.exists(filesDir)) {
            try {
                const allFiles = await fs.readdir(filesDir);
                // 先过滤出实际需要复制的附件文件（跳过 CSS/JS）
                const filesToCopy = allFiles.filter(
                    f => !f.endsWith('.css') && !f.endsWith('.js')
                );

                if (filesToCopy.length > 0) {
                    // 有附件才创建目录，避免产生空文件夹
                    await this.app.vault.adapter.mkdir(attachementDir);
                    console.debug(`使用附件目录: ${attachementDir}, 共 ${filesToCopy.length} 个附件`);

                    for (const file of filesToCopy) {
                        const sourcePath = path.join(filesDir, file);
                        const stat = await fs.stat(sourcePath);
                        if (stat.isFile()) {
                            try {
                                const content = await fs.readFile(sourcePath);
                                // 写入时补充斜杠
                                await this.app.vault.adapter.writeBinary(`${attachementDir}/${file}`, content);
                                console.debug(`复制附件: ${file}`);
                            } catch (copyError) {
                                console.warn(`复制附件失败: ${file}`, copyError);
                            }
                        }
                    }
                } else {
                    console.debug(`无有效附件，跳过创建目录: ${attachementDir}`);
                }
            } catch (error) {
                console.warn(`处理附件目录失败: ${filesDir}`, error);
            }
        }

        // 5. Import Notes
        const syncedMemoIds = this.config["syncedMemoIds"] || [];
        console.debug(`已有 ${syncedMemoIds.length} 条同步记录`);

        // 传递 Map 给 GetCore
        const flomo = new GetCore(notesData, syncedMemoIds, getTarget);

        const memos = await this.importMemos(flomo);

        // 6. Ob Intergations
        // If Generate Moments
        if (this.config["optionsMoments"] != "skip") {
            await generateMoments(this.app, memos, this.config);
        }

        // If Generate Canvas
        if (this.config["optionsCanvas"] != "skip") {
            await generateCanvas(this.app, memos, this.config);
        }

        // 7. Cleanup Workspace
        await fs.remove(tmpDir);

        return flomo

    }

    public async importGetFile(filePath: string, mergeDayFile: boolean = true): Promise<{ count: number, newCount: number }> {
        if (filePath === undefined) {
            throw new Error("filepath undefined");
        }
        const config = this.config;
        if (!await fs.exists(filePath)) {
            throw new Error("File doesn't exist: " + filePath);
        }
        let folder = ""

        if(config.getTarget !== undefined) {
            folder = config.getTarget;
        }
        else {
            folder = "flomo";
        }

        if (!await fs.exists(folder)) {
            await fs.mkdir(folder);
        }

        // Extract basic information
        let getData: string = await this.sanitize(filePath);

        // 从配置中获取已同步的备忘录ID列表
        const syncedMemoIds = this.config.syncedMemoIds || [];
        console.debug(`从配置中读取到 ${syncedMemoIds.length} 条已同步记录`);

        // 从配置中获取 getTarget
        const getTarget = this.config.getTarget || "flomo";

        // 将已同步ID和getTarget传递给GetCore
        const flomo = new GetCore(getData, syncedMemoIds, getTarget);
        
        const totalMemos = flomo.memos.length;
        const newMemos = flomo.newMemosCount;
        console.log(`总共找到 ${totalMemos} 条备忘录，其中 ${newMemos} 条是新的`);

        // 将所有日记按日期分组
        const dayGroups: Record<string, Record<string, string>[]> = {};

        // 只对新增的备忘录进行处理
        flomo.memos.forEach((memo) => {
            // 检查这个备忘录是否有ID（应该都有）
            if (memo.id) {
                // 检查这个ID是否在旧的已同步列表中（不应该在，因为GetCore已经过滤过了）
                // 但为了安全起见，这里再次检查
                if (!syncedMemoIds.includes(memo.id)) {
                    // 这是一个新备忘录
                    const day = memo.date;
                    if (day in dayGroups) {
                        dayGroups[day].push(memo);
                    } else {
                        dayGroups[day] = [memo];
                    }
                }
            }
        });

        // 更新配置中的已同步ID列表 - 合并旧的和新发现的ID
        this.config.syncedMemoIds = [...new Set([...syncedMemoIds, ...flomo.syncedMemoIds])];
        console.debug(`更新后的同步记录数: ${this.config.syncedMemoIds.length}`);
        
        // 更新最后同步时间
        this.config.lastSyncTime = Date.now();

        // 保存配置（这里是假设的，实际保存应该在外部进行）
        // 主要是让调用方知道需要保存配置

        for (let day in dayGroups) {
            if (mergeDayFile && dayGroups[day].length > 1) {
                const groupFiles = dayGroups[day];
                // TODO: Add file check, prompt if existing. Currently just overwriting
                
                const content = groupFiles.map((i) => {
                    return i.content;
                }).join("\n\n---\n\n");

                const fileName = groupFiles[0].title + ".md";
                await fs.writeFile(path.join(folder, fileName), content, 'utf8');
                

            } else {
                for (let i = 0; i < dayGroups[day].length; i++) {
                    const memo = dayGroups[day][i];
                    // 如果当日仅有一条记录，则按照title(date).md保存
                    // 如果当日有多条需要分开保存，则按照title(date)_sequence.md保存
                    let fileName = memo.title;
                    // 添加序号，防止文件名冲突
                    if (dayGroups[day].length > 1) {
                        fileName += "_" + (i + 1);
                    }
                    fileName += ".md";
                    await fs.writeFile(path.join(folder, fileName), memo.content, 'utf8');
                }
            }
        }

        // 额外生成Obsidian的Moments或Canvas
        if (config.optionsMoments === "copy_with_link" || 
            config.optionsMoments === "copy_with_content") {
            await generateMoments(this.app, flomo, config);
        }

        if (config.optionsCanvas === "copy_with_link" || 
            config.optionsCanvas === "copy_with_content") {
            await generateCanvas(this.app, flomo, config);
        }

        return { count: totalMemos, newCount: newMemos };
    }

}
