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

    // New properties for Get笔记
    notes: GetNote[];
    allTags: string[];

    constructor(notesData: Map<string, string> | string, syncedMemoIds: string[] = [], getTarget: string = 'get') {
        this.syncedMemoIds = [...syncedMemoIds];
        this.getTarget = getTarget;
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

    private loadNotes(notesData: Map<string, string>): void {
        const td = new turndown({ bulletListMarker: '-', headingStyle: 'atx' });

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
                        const filename = src.replace('files/', '');
                        return `![[${this.getTarget}/get attachment/${filename}]]`;
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
                    const filename = src.replace('files/', '');
                    return `![${alt}](<${this.getTarget}/get attachment/${filename}>)`;
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
                
                // 返回 Obsidian 的文件链接格式 [content](<path>)
                const linkText = content.trim() || filename;
                return `[${linkText}](<${this.getTarget}/get attachment/${filename}>)`;
            }
        });

        console.debug(`开始处理 ${notesData.size} 个笔记文件，已有 ${this.syncedMemoIds.length} 条同步记录`);

        for (const [filename, htmlContent] of notesData) {
            // Extract note ID from filename (e.g., "abc123def.html" -> "abc123def")
            const noteId = filename.replace('.html', '');

            // Skip if already synced
            if (this.syncedMemoIds.includes(noteId)) {
                console.debug(`笔记已存在，跳过: ${noteId}`);
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
                    tags.push(tagText);
                }
            }

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

            // Remove paragraphs containing metadata
            const allPs = contentEl.querySelectorAll('p');
            for (const p of allPs) {
                const text = p.textContent || '';
                if (text.includes('创建于') || text.includes('标签：')) {
                    p.remove();
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

            // Clean up turndown escapes (e.g. \_, \*, \., \-, \+) 以恢复原始文本外观
            content = content.replace(/\\([_*\[\].#+\-!~()])/g, '$1');

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
            
            // 3. 标签列表
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
