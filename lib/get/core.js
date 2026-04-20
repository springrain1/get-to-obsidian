"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlomoCore = void 0;
const node_html_parser_1 = require("node-html-parser");
const turndown_1 = __importDefault(require("turndown"));
class FlomoCore {
    memos; // Keep compatible with existing interface
    tags;
    files;
    syncedMemoIds = [];
    newMemosCount = 0;
    flomoTarget;
    // New properties for Get笔记
    notes;
    allTags;
    constructor(notesData, syncedMemoIds = [], flomoTarget = 'get') {
        this.syncedMemoIds = [...syncedMemoIds];
        this.flomoTarget = flomoTarget;
        this.files = {};
        this.notes = [];
        this.allTags = [];
        // Support both old (single HTML string) and new (Map) format for compatibility
        if (typeof notesData === 'string') {
            // Legacy Flomo format - not implemented for Get笔记
            throw new Error('Get笔记 only supports Map<string, string> format');
        }
        else {
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
    loadNotes(notesData) {
        const td = new turndown_1.default({ bulletListMarker: '-' });
        // Custom rule for list items (same as Flomo)
        const liRule = {
            filter: 'li',
            replacement: function (content, node, options) {
                content = content
                    .replace(/^\n+/, '')
                    .replace(/\n+$/, '\n')
                    .replace(/\n/gm, '\n    ');
                var prefix = options.bulletListMarker + ' ';
                var parent = node.parentNode;
                if (parent.nodeName === 'OL') {
                    var start = parent.getAttribute('start');
                    var index = Array.prototype.indexOf.call(parent.children, node);
                    prefix = (start ? Number(start) + index : index + 1) + '.  ';
                }
                return (prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : ''));
            }
        };
        td.addRule('listItem', liRule);
        // Custom rule for audio attachments
        td.addRule('audio', {
            filter: 'audio',
            replacement: (content, node) => {
                const source = node.querySelector('source');
                if (source) {
                    const src = source.getAttribute('src');
                    if (src && src.startsWith('files/')) {
                        const filename = src.replace('files/', '');
                        return `![[${this.flomoTarget}/get attachment/${filename}]]`;
                    }
                }
                return '';
            }
        });
        // Custom rule for images - update path
        td.addRule('getImage', {
            filter: (node) => node.nodeName === 'IMG',
            replacement: (content, node) => {
                const imgNode = node;
                const src = imgNode.getAttribute('src') || '';
                const alt = imgNode.getAttribute('alt') || '';
                if (src.startsWith('files/')) {
                    const filename = src.replace('files/', '');
                    return `![${alt}](<${this.flomoTarget}/get attachment/${filename}>)`;
                }
                return `![${alt}](${src})`;
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
    parseNote(noteId, htmlContent, td) {
        try {
            const root = (0, node_html_parser_1.parse)(htmlContent);
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
            const tags = [];
            const tagEls = noteEl.querySelectorAll('.tag');
            for (const tagEl of tagEls) {
                const tagText = tagEl.textContent?.trim();
                if (tagText) {
                    tags.push(tagText);
                }
            }
            // Extract attachments
            const attachments = [];
            const audioEls = noteEl.querySelectorAll('audio source');
            for (const audio of audioEls) {
                const src = audio.getAttribute('src');
                if (src)
                    attachments.push(src);
            }
            const imgEls = noteEl.querySelectorAll('img');
            for (const img of imgEls) {
                const src = img.getAttribute('src');
                if (src && src.startsWith('files/'))
                    attachments.push(src);
            }
            // Extract content - clone by parsing HTML again (node-html-parser doesn't have cloneNode)
            const contentEl = (0, node_html_parser_1.parse)(noteEl.toString());
            // Remove h1
            const h1ToRemove = contentEl.querySelectorAll('h1');
            for (const el of h1ToRemove)
                el.remove();
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
            if (firstHr)
                firstHr.remove();
            // Remove attachment div (already processed)
            const attachmentDivs = contentEl.querySelectorAll('.attachment');
            for (const div of attachmentDivs) {
                // Only remove if it contains audio (links should stay)
                if (div.querySelector('audio')) {
                    div.remove();
                }
            }
            // Convert remaining HTML to markdown
            let content = td.turndown(contentEl.toString());
            // Clean up escaped brackets for wikilinks
            content = content.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
            // Clean up highlight marks if present
            content = content.replace(/GETIMPORTERHIGHLIGHTMARKPLACEHOLDER/g, '==');
            // Build final content with date link
            const timeStr = dateTime.split(' ')[1] || '';
            const formattedContent = `📅 [[${date}]] ${timeStr}\n\n${content}`;
            return {
                id: noteId,
                title: title,
                date: date,
                dateTime: dateTime,
                tags: tags,
                content: formattedContent,
                attachments: attachments
            };
        }
        catch (error) {
            console.error(`Error parsing note ${noteId}:`, error);
            return null;
        }
    }
}
exports.FlomoCore = FlomoCore;
