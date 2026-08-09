import * as fs from 'fs-extra';
const nodeRequire = typeof window !== 'undefined' ? (window as any).require : null;
const path = nodeRequire ? nodeRequire('path') : null;
import { App } from 'obsidian';
import decompress from 'decompress';
import * as parse5 from "parse5"

import { GetCore } from './core';
import { generateMoments } from '../obIntegration/moments';
import { generateCanvas } from '../obIntegration/canvas';

import { GET_CACHE_LOC } from './const'

// 附件类型定义
type AttachmentType = 'image' | 'audio' | 'video' | 'document';

// 附件扩展名映射表
const ATTACHMENT_EXTENSIONS: Record<AttachmentType, string[]> = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'],
    audio: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md']
};


export class GetImporter {
    private config: Record<string, any>;
    private app: App;

    constructor(app: App, config: Record<string, any>) {
        this.config = config;
        this.app = app;
    }

    /**
     * 根据文件扩展名分类附件类型
     * @param filename 文件名
     * @returns 附件类型 ('image' | 'audio' | 'video' | 'document')
     */
    private classifyAttachment(filename: string): AttachmentType {
        const ext = path.extname(filename).toLowerCase().replace('.', '');
        
        for (const [type, extensions] of Object.entries(ATTACHMENT_EXTENSIONS)) {
            if (extensions.includes(ext)) {
                return type as AttachmentType;
            }
        }
        
        // 未知扩展名默认归类为文档类型
        console.debug(`未知扩展名 "${ext}"，归类为文档类型: ${filename}`);
        return 'document';
    }

    /**
     * 获取本地 vault 的基础路径
     * @returns 本地路径或 null（非本地 adapter）
     */
    private getLocalVaultBasePath(): string | null {
        const adapter = this.app.vault.adapter as any;
        if (typeof adapter.getBasePath === 'function') {
            return adapter.getBasePath();
        }
        return null;
    }

    /**
     * 复制附件文件（优化版）
     * 本地 vault: 直接使用 fs.copyFile（零拷贝）
     * 非本地 vault: 受 Obsidian API 限制，需聚合后写入
     * @param sourcePath 源文件路径
     * @param targetPath 目标文件路径（相对于 vault 根目录）
     * @param ensureDir 是否需要确保目录存在
     */
    private async copyAttachment(sourcePath: string, targetPath: string, ensureDir: boolean = false): Promise<void> {
        const vaultBase = this.getLocalVaultBasePath();
        
        if (vaultBase) {
            // 本地 vault: 直接文件系统拷贝（最优性能，零内存占用）
            const absoluteTargetPath = path.join(vaultBase, targetPath);
            if (ensureDir) {
                await fs.mkdirp(path.dirname(absoluteTargetPath));
            }
            await fs.copyFile(sourcePath, absoluteTargetPath);
            console.debug(`copyFile 附件成功: ${sourcePath} -> ${absoluteTargetPath}`);
            return;
        }

        // 非本地 vault: 受 Obsidian adapter.writeBinary() API 限制
        // 该 API 只接受完整 ArrayBuffer，无法流式追加写入
        // 因此必须先读取完整文件再写入（这是 API 边界限制，非实现问题）
        if (ensureDir) {
            const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
            await this.app.vault.adapter.mkdir(targetDir);
        }
        
        const buffer = await fs.readFile(sourcePath);
        const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
        );
        
        await this.app.vault.adapter.writeBinary(targetPath, arrayBuffer);
        console.debug(`adapter 附件写入成功: ${sourcePath} -> ${targetPath}`);
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
                .replace(/[/\\:*?"<>|]/g, '-')  // 替换路径非法字符
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

    async import(): Promise<GetCore> {

        // 1. Create workspace
        const tmpDir = path.join(GET_CACHE_LOC, "data")
        await fs.mkdirp(tmpDir);

        // 2. Unzip get_export.zip to workspace
        // 注意: decompress 库需要本地文件路径，无法直接处理 File 对象或流
        // 这就是为什么在 MainUI 中需要先将 File 对象写入临时文件的原因
        try {
            await decompress(this.config["rawDir"], tmpDir);
        } finally {
            // 3. 如果使用了临时文件，解压完成后清理（即使解压失败也要清理）
            const needsCleanup = this.config["needsCleanup"] === true;
            if (needsCleanup) {
                try {
                    await fs.remove(this.config["rawDir"]);
                    console.debug(`清理临时 ZIP 文件: ${this.config["rawDir"]}`);
                } catch (cleanupError) {
                    console.warn(`清理临时 ZIP 文件失败: ${this.config["rawDir"]}`, cleanupError);
                }
            }
        }

        // 4. Get笔记: 读取所有笔记HTML文件
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

        // 5. 复制附件到 ObVault
        // Get笔记附件结构：notes/files/*.jpg, *.mp3
        const getTarget = this.config["getTarget"] || "get";
        let attachementDir = `${getTarget}/get attachment`; // 移除尾部斜杠防止Obsidian创建空名字的子目录

        console.debug(`使用附件目录: ${attachementDir} (基于 getTarget: ${getTarget})`);

        // 获取附件导入配置
        const attachmentConfig = this.config["attachmentImport"] || {
            image: true,
            audio: true,
            video: true,
            document: true
        };

        // 记录成功复制的附件路径列表（使用原始相对路径格式）
        const copiedAttachments: string[] = [];
        // 附件复制统计（按类型分组）
        const attachmentStats = {
            image: 0,
            audio: 0,
            video: 0,
            document: 0,
            total: 0,
            failed: 0
        };

        const filesDir = path.join(notesDir, 'files');
        if (await fs.exists(filesDir)) {
            try {
                const allFiles = await fs.readdir(filesDir);
                // 先过滤出实际需要复制的附件文件（跳过 CSS/JS）
                const filesToProcess = allFiles.filter(
                    f => !f.endsWith('.css') && !f.endsWith('.js')
                );

                console.debug(`找到 ${filesToProcess.length} 个附件文件`);

                // 按类型过滤附件
                const filesToCopy: string[] = [];
                for (const file of filesToProcess) {
                    const attachmentType = this.classifyAttachment(file);
                    if (attachmentConfig[attachmentType]) {
                        filesToCopy.push(file);
                    } else {
                        console.debug(`跳过未启用类型的附件: ${file} (类型: ${attachmentType})`);
                    }
                }

                console.debug(`根据配置，将复制 ${filesToCopy.length} 个附件`);

                // 延迟创建目录：只在首个附件成功复制后创建
                let attachmentDirCreated = false;

                for (const file of filesToCopy) {
                    const sourcePath = path.join(filesDir, file);
                    const stat = await fs.stat(sourcePath);
                    if (stat.isFile()) {
                        const attachmentType = this.classifyAttachment(file);
                        try {
                            // 使用优化的附件复制方法，首次复制时创建目录
                            await this.copyAttachment(sourcePath, `${attachementDir}/${file}`, !attachmentDirCreated);
                            
                            // 首个成功复制后标记目录已创建
                            if (!attachmentDirCreated) {
                                attachmentDirCreated = true;
                                console.debug(`首个附件复制成功，目录已创建: ${attachementDir}`);
                            }
                            
                            // 记录成功复制的附件（使用原始相对路径格式）
                            copiedAttachments.push(`files/${file}`);
                            // 更新统计
                            attachmentStats[attachmentType]++;
                            attachmentStats.total++;
                        } catch (copyError) {
                            // 单个附件复制失败时记录路径和错误，但继续处理其他附件
                            console.error(`复制附件失败: files/${file} (类型: ${attachmentType})`, copyError);
                            attachmentStats.failed++;
                        }
                    }
                }

                if (attachmentDirCreated) { /* ignore */ } else {
                    console.debug(`所有附件复制均失败，未创建目录`);
                }
            } catch (error) {
                console.warn(`处理附件目录失败: ${filesDir}`, error);
            }
        }

        // 6. Import Notes
        const syncedMemoIds = this.config["syncedMemoIds"] || [];

        // 传递 Map 和已复制的附件列表给 GetCore
        const flomo = new GetCore(notesData, syncedMemoIds, getTarget, copiedAttachments);


        const memos = await this.importMemos(flomo);

        // 7. Ob Intergations
        // If Generate Moments
        if (this.config["optionsMoments"] != "skip") {
            await generateMoments(this.app, memos, this.config);
        }

        // If Generate Canvas
        if (this.config["optionsCanvas"] != "skip") {
            await generateCanvas(this.app, memos, this.config);
        }

        // 8. Cleanup Workspace
        await fs.remove(tmpDir);

        return flomo;
    }
}
