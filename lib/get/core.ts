/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { parse, HTMLElement } from 'node-html-parser';
import turndown from 'turndown';

export interface GetNote {
    id: string;           // Hash from filename
    title: string;        // From <title> or <h1>
    date: string;         // YYYY-MM-DD
    dateTime: string;     // Full datetime string
    tags: string[];       // Extracted from <span class="tag">
    content: string;      // Markdown content
    attachments: string[]; // List of attachment paths
}

export class GetCore {
    memos: Record<string, string>[];  // Keep compatible with existing interface
    tags: string[];
    files: Record<string, string[]>;
    syncedMemoIds: string[] = [];
    newMemosCount: number = 0;
    getTarget: string;
    copiedAttachments: string[] = []; // 已成功复制的附件列表

    // New properties for Get笔记
    notes: GetNote[];
    allTags: string[];

    constructor(notesData: Map<string, string> | string, syncedMemoIds: string[] = [], getTarget: string = 'get', copiedAttachments: string[] = []) {
        this.syncedMemoIds = [...syncedMemoIds];
        this.getTarget = getTarget;
        this.copiedAttachments = [...copiedAttachments];
        this.files = {};
        this.notes = [];
        this.allTags = [];

        // Support both old (single HTML string) and new (Map) format for compatibility
        if (typeof notesData === 'string') {
            // Legacy Get笔记 format - not implemented for Get笔记
            throw new Error('Get笔记 only supports Map<string, string> format');
        } else {
            this.loadNotes(notesData);
        }

        // Convert notes to memos format for backward compatibility
        this.memos = this.notes.map(note => ({
            title: note.title,
            date: note.date,
            content: note.content,
            id: note.id
        }));

        this.tags = this.allTags;
    }

    /**
     * 检查附件是否已成功复制
     * @param attachmentPath 附件路径（如 files/xxx.png）
     * @returns boolean
     */
    private isAttachmentCopied(attachmentPath: string): boolean {
        return this.copiedAttachments.includes(attachmentPath);
    }

    /**
     * 提取原文链接并清洗标签
     * @param noteEl 笔记 HTML 元素
     * @returns { title: string; url: string } | null
     */
    private extractSourceLink(noteEl: HTMLElement): { title: string; url: string } | null {
        // 查找 div.attachment 中以"原文："开头的链接
        const attachmentDivs = noteEl.querySelectorAll('div.attachment');
        for (const div of attachmentDivs) {
            const text = div.textContent || '';
            if (text.includes('原文：') || text.includes('原文:')) {
                const linkEl = div.querySelector('a');
                if (linkEl) {
                    const url = linkEl.getAttribute('href');
                    const linkText = linkEl.textContent?.trim() || '';
                    if (url && linkText) {
                        // 清洗社交标签
                        const cleanedTitle = this.cleanSocialTags(linkText);
                        return { title: cleanedTitle, url: url };
                    }
                }
            }
        }
        return null;
    }

    /**
     * 清洗链接文本中的社交标签
     * @param text 原始链接文本
     * @returns 清洗后的文本
     */
    private cleanSocialTags(text: string): string {
        // 移除末尾由空格分隔的连续社交标签（匹配 # 开头的词，支持中英文字符）
        // 正则说明：匹配末尾的一个或多个 "空格 + # + 非空白字符" 的模式
        return text
            .replace(/(\s+#[^\s]+)+\s*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 规范化标签文本为 Obsidian 兼容格式
     * @param tag 原始标签文本
     * @returns 规范化后的标签（空格转下划线，去除首尾空白）
     */
    private normalizeTag(tag: string): string {
        // 去除首尾空白，将连续空白字符转换为单个下划线
        return tag.trim().replace(/\s+/g, '_');
    }

    /**
     * HTML 实体解码函数
     * @param text 包含 HTML 实体的文本
     * @returns 解码后的文本
     */
    private decodeHtmlEntities(text: string): string {
        const entities: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        };

        let decoded = text;
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }

        return decoded;
    }

    private loadNotes(notesData: Map<string, string>): void {
        const td = new turndown({ bulletListMarker: '-', headingStyle: 'atx' });

        // 代码块规则：<pre><code> → fenced code block，并解码 HTML 实体
        td.addRule('codeBlock', {
            filter: function (node) {
                return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
            },
            replacement: (content, node) => {
                const codeNode = node.firstChild as any;
                const codeContent = codeNode.textContent || '';
                // 解码 HTML 实体
                const decodedContent = this.decodeHtmlEntities(codeContent);
                // 检测语言类型（如果有 class="language-xxx"）
                const className = codeNode.getAttribute('class') || '';
                const langMatch = className.match(/language-(\w+)/);
                const lang = langMatch ? langMatch[1] : '';

                return '\n\n```' + lang + '\n' + decodedContent + '\n```\n\n';
            }
        });

        // 段落规则：列表项内的 <p> 不加额外换行；处理段落内嵌的 `* ` 无序列表
        td.addRule('paragraph', {
            filter: 'p',
            replacement: function (content: string, node: any) {
                const isInListItem = node.parentNode && node.parentNode.nodeName === 'LI';
                if (isInListItem) {
                    return content;
                }
                if (!content.trim()) {
                    return '\n';
                }
                // 处理段落内嵌的 * 或 - 或数字序号有序列表
                // 这里使用正则匹配被转义或未转义的星号、中划线及数字点（如 1\.），并在前面强制换行
                let processedContent = content.replace(/(^|\n|\s+)(\\\*|\*|\\-|-|\d+\\\.|\d+\.)\s+/g, (match, prefix, symbol) => {
                    const cleanSymbol = symbol.replace(/\\/g, ''); // 清除转义符
                    const listMarker = (cleanSymbol === '*' || cleanSymbol === '-') ? '-' : cleanSymbol;
                    return '\n' + listMarker + ' ';
                });
                
                // 去除前后多余换行，然后保证段落结尾有换行
                return processedContent.trim() + '\n';
            }
        });

        // 有序/无序列表规则：嵌套列表用 tab 缩进
        td.addRule('list', {
            filter: ['ul', 'ol'] as any,
            replacement: function (content: string, node: any) {
                const isNested = node.parentNode && node.parentNode.nodeName === 'LI';
                if (isNested) {
                    const indentedContent = content.split('\n').map((line: string) =>
                        line ? '\t' + line : line
                    ).join('\n');
                    return '\n' + indentedContent;
                }
                return content + '\n';
            }
        });

        // 列表项规则（对齐 flomo 实现）
        const liRule = {
            filter: 'li' as any,
            replacement: function (content: string, node: any, options: any) {
                content = content
                    .replace(/^\n+/, '')
                    .replace(/\n+$/, '');
                var prefix = options.bulletListMarker + ' ';
                var parent = node.parentNode;
                if (parent.nodeName === 'OL') {
                    var start = parent.getAttribute('start');
                    var index = Array.prototype.indexOf.call(parent.children, node);
                    prefix = (start ? Number(start) + index : index + 1) + '. ';
                }
                const suffix = node.nextSibling ? '\n' : '';
                return prefix + content + suffix;
            }
        };
        td.addRule('listItem', liRule);

        // GFM 表格支持：单元格
        td.addRule('tableCell', {
            filter: ['th', 'td'] as any,
            replacement: function (content: string) {
                return ` ${content.trim().replace(/\n/g, ' ')} |`;
            }
        });

        // GFM 表格支持：行（表头行后自动插入分隔线）
        td.addRule('tableRow', {
            filter: 'tr' as any,
            replacement: function (content: string, node: any) {
                const isHeader = node.parentNode && node.parentNode.nodeName === 'THEAD';
                let row = `|${content}\n`;
                if (isHeader) {
                    const alignMap: Record<string, string> = { left: ':--', right: '--:', center: ':-:' };
                    const cells = Array.from(node.childNodes || []).filter(
                        (n: any) => n.nodeName === 'TH' || n.nodeName === 'TD'
                    ) as any[];
                    const sep = cells.map((cell: any) => {
                        const align = cell.getAttribute ? cell.getAttribute('align') || '' : '';
                        return ` ${alignMap[align] || '---'} |`;
                    }).join('');
                    row += `|${sep}\n`;
                }
                return row;
            }
        });

        // GFM 表格支持：thead/tbody/tfoot 透传
        td.addRule('tableSection', {
            filter: ['thead', 'tbody', 'tfoot'] as any,
            replacement: function (content: string) {
                return content;
            }
        });

        // GFM 表格支持：table 外层包换行
        td.addRule('table', {
            filter: 'table' as any,
            replacement: function (content: string) {
                return `\n\n${content}\n`;
            }
        });

        // 分割线：<hr> → ---
        td.addRule('horizontalRule', {
            filter: 'hr' as any,
            replacement: function () {
                return '\n\n---\n\n';
            }
        });

        // Custom rule for audio attachments
        td.addRule('audio', {
            filter: 'audio',
            replacement: (content, node) => {
                const source = node.querySelector('source');
                if (source) {
                    const src = source.getAttribute('src');
                    if (src && src.startsWith('files/')) {
                        // 检查附件是否已复制
                        if (this.isAttachmentCopied(src)) {
                            const filename = src.replace('files/', '');
                            return `![[${this.getTarget}/get attachment/${filename}]]`;
                        } else {
                            // 未复制的附件：移除链接，保留描述文本
                            const filename = src.replace('files/', '');
                            return `音频: ${filename}`;
                        }
                    }
                }
                return '';
            }
        });

        // Custom rule for images - update path
        td.addRule('getImage', {
            filter: (node) => node.nodeName === 'IMG',
            replacement: (content, node) => {
                const imgNode = node as unknown as HTMLElement;
                const src = imgNode.getAttribute('src') || '';
                const alt = imgNode.getAttribute('alt') || '';
                if (src.startsWith('files/')) {
                    // 检查附件是否已复制
                    if (this.isAttachmentCopied(src)) {
                        const filename = src.replace('files/', '');
                        return `![${alt}](<${this.getTarget}/get attachment/${filename}>)`;
                    } else {
                        // 未复制的附件：移除链接，保留 alt 文本
                        return alt || src.replace('files/', '');
                    }
                }
                return `![${alt}](${src})`;
            }
        });

        // 针对普通文件附件（PDF、文档等），它们通常表现为 a 标签
        td.addRule('fileAttachment', {
            filter: function (node, options) {
                return (
                    node.nodeName === 'A' &&
                    node.getAttribute('href') &&
                    node.getAttribute('href')?.startsWith('files/')
                );
            },
            replacement: (content, node) => {
                const aNode = node as unknown as HTMLElement;
                const href = aNode.getAttribute('href') || '';
                const filename = href.replace('files/', '');
                const linkText = content.trim() || filename;

                // 检查附件是否已复制
                if (this.isAttachmentCopied(href)) {
                    // 返回 Obsidian 的文件链接格式 [content](<path>)
                    return `[${linkText}](<${this.getTarget}/get attachment/${filename}>)`;
                } else {
                    // 未复制的附件：移除链接，保留描述文本
                    return linkText;
                }
            }
        });

        console.debug(`开始处理 ${notesData.size} 个笔记文件，已有 ${this.syncedMemoIds.length} 条同步记录`);

        for (const [filename, htmlContent] of notesData) {
            // Extract note ID from filename (e.g., "abc123def.html" -> "abc123def")
            const noteId = filename.replace('.html', '');

            // Skip if already synced
            if (this.syncedMemoIds.includes(noteId)) {
                continue;
            }

            const note = this.parseNote(noteId, htmlContent, td);
            if (note) {
                this.notes.push(note);
                this.newMemosCount++;
                this.syncedMemoIds.push(noteId);

                // Collect tags
                for (const tag of note.tags) {
                    if (!this.allTags.includes(tag)) {
                        this.allTags.push(tag);
                    }
                }
            }
        }

        console.debug(`处理完成: 总共 ${notesData.size} 个文件, 新增 ${this.newMemosCount} 条笔记`);
    }

    private parseNote(noteId: string, htmlContent: string, td: turndown): GetNote | null {
        try {
            const root = parse(htmlContent);
            const noteEl = root.querySelector('.note');

            if (!noteEl) {
                console.warn(`No .note element found in ${noteId}`);
                return null;
            }

            // Extract title from <title> or <h1>
            const titleEl = root.querySelector('title');
            const h1El = noteEl.querySelector('h1');
            const title = h1El?.textContent?.trim() || titleEl?.textContent?.trim() || 'Untitled';

            // Extract date from "创建于：YYYY-MM-DD HH:MM:SS"
            let dateTime = '';
            let date = '';
            const paragraphs = noteEl.querySelectorAll('p');
            for (const p of paragraphs) {
                const text = p.textContent || '';
                const dateMatch = text.match(/创建于[：:]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
                if (dateMatch) {
                    date = dateMatch[1];
                    dateTime = `${dateMatch[1]} ${dateMatch[2]}`;
                    break;
                }
            }

            // If no date found, use current date
            if (!date) {
                const now = new Date();
                date = now.toISOString().split('T')[0];
                dateTime = date + ' 00:00:00';
                console.warn(`No date found in ${noteId}, using current date`);
            }

            // Extract tags
            const tags: string[] = [];
            const tagEls = noteEl.querySelectorAll('.tag');
            for (const tagEl of tagEls) {
                const tagText = tagEl.textContent?.trim();
                if (tagText) {
                    // 规范化标签
                    const normalizedTag = this.normalizeTag(tagText);
                    tags.push(normalizedTag);
                }
            }

            // 提取原文链接
            const sourceLink = this.extractSourceLink(noteEl);

            // Extract attachments
            const attachments: string[] = [];
            const audioEls = noteEl.querySelectorAll('audio source');
            for (const audio of audioEls) {
                const src = audio.getAttribute('src');
                if (src) attachments.push(src);
            }
            const imgEls = noteEl.querySelectorAll('img');
            for (const img of imgEls) {
                const src = img.getAttribute('src');
                if (src && src.startsWith('files/')) attachments.push(src);
            }
            const fileLinkEls = noteEl.querySelectorAll('a');
            for (const link of fileLinkEls) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('files/')) attachments.push(href);
            }

            // Extract content - clone by parsing HTML again (node-html-parser doesn't have cloneNode)
            const contentEl = parse(noteEl.toString());

            // 只删除第一个 h1（笔记标题），保留正文中的其他 h1 内容标题
            const allH1s = contentEl.querySelectorAll('h1');
            if (allH1s.length > 0) allH1s[0].remove();

            // 删除原文区块（如果已提取到 YAML）
            if (sourceLink) {
                const attachmentDivs = contentEl.querySelectorAll('div.attachment');
                for (const div of attachmentDivs) {
                    const text = div.textContent || '';
                    if (text.includes('原文：') || text.includes('原文:')) {
                        div.remove();
                        break; // 只删除第一个匹配的原文区块
                    }
                }
            }

            // 修正元数据段落删除规则：仅删除包含"创建于"或"标签："的段落
            const allPs = contentEl.querySelectorAll('p');
            for (const p of allPs) {
                const text = p.textContent || '';
                if (text.includes('创建于') || text.includes('标签：')) {
                    // 防御：源 HTML 若缺失 </p> 闭合，node-html-parser 会将后续的 hr、h2 等巨量正文误认为该 p 的子元素。
                    // 正常的元数据 p 绝不可能包含这些块级元素。直接 p.remove() 会导致正文巨量丢失。
                    if (p.querySelector('hr') || p.querySelector('h2') || p.querySelector('h3') || p.querySelector('ul') || p.querySelector('ol')) {
                        console.warn(`检测到 HTML 闭合异常导致的正文吞没，安全清理元数据`);
                        // 逐个移除前面的文本节点和 .tag span，一旦遇到异常块级元素就停止（即保留被吞没的正文）
                        const children = [...p.childNodes];
                        for (const child of children) {
                            if (child.nodeType === 1) { // Element node
                                const tag = (child as any).rawTagName?.toUpperCase();
                                if (['HR', 'H2', 'H3', 'UL', 'OL', 'P', 'DIV'].includes(tag)) {
                                    break; // 停止删除，保留后续正文
                                }
                            }
                            child.remove();
                        }
                    } else {
                        p.remove();
                    }
                }
            }

            // Remove first <hr> (separator after metadata)
            const firstHr = contentEl.querySelector('hr');
            if (firstHr) firstHr.remove();

            // 移除图片元素自带的文字 title（避免转md后带多余尾巴）
            const imageTitles = contentEl.querySelectorAll('.image-title');
            for (const imgTitle of imageTitles) {
                imgTitle.remove();
            }

            // Convert remaining HTML to markdown
            let content = td.turndown(contentEl.toString());

            // Clean up turndown escapes: 仅清理不影响 Markdown 语法结构的转义
            // 只清理下划线(\_ -> _)和点号(\. -> .)，这两个在正文中频繁出现且不影响结构
            // 注意：不要清理 \[ \] \* \# \- \! 等，否则会破坏 Markdown 链接、列表、标题等结构
            content = content.replace(/\\\./g, '.').replace(/\\_/g, '_');

            // Clean up highlight marks if present
            content = content.replace(/GETIMPORTERHIGHLIGHTMARKPLACEHOLDER/g, '==');

            // 清理多余空行（对齐 flomo 实现）
            content = content
                .replace(/\n{3,}/g, '\n\n')
                .replace(/^\n+/, '')
                .replace(/\n+$/, '');

            // 构造 YAML Frontmatter
            const yamlLines = ['---'];

            // 1. 标题属性（对 title 中的双引号进行转义）
            const safeYamlTitle = (title || '').replace(/"/g, '\\"');
            yamlLines.push(`title: "${safeYamlTitle}"`);

            // 2. 创建时间
            if (dateTime) {
                yamlLines.push(`created: ${dateTime}`);
            }

            // 3. 原文链接（如果存在）
            if (sourceLink) {
                // 对标题和 URL 中的双引号进行转义
                const safeTitle = sourceLink.title.replace(/"/g, '\\"');
                const safeUrl = sourceLink.url.replace(/"/g, '\\"');
                yamlLines.push(`source: "[${safeTitle}](${safeUrl})"`);
            }

            // 4. 标签列表
            if (tags.length > 0) {
                yamlLines.push('tags:');
                tags.forEach(t => {
                    yamlLines.push(`  - ${t}`);
                });
            }
            yamlLines.push('---');

            const yamlStr = yamlLines.join('\n');

            // 组装最终正文内容
            const formattedContent = `${yamlStr}\n\n${content}`;

            return {
                id: noteId,
                title: title,
                date: date,
                dateTime: dateTime,
                tags: tags,
                content: formattedContent,
                attachments: attachments
            };
        } catch (error) {
            console.error(`Error parsing note ${noteId}:`, error);
            return null;
        }
    }
}
