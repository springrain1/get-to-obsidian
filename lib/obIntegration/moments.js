"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMoments = void 0;
async function generateMoments(app, flomo, config) {
    if (Object.keys(flomo.files).length > 0) {
        const buffer = [];
        const tags = [];
        const index_file = `${config["flomoTarget"]}/Get Moments.md`;
        // Get all file paths and sort by note dateTime (newest first)
        // Build a map of filepath -> note for sorting
        const fileToNote = new Map();
        const memoFiles = Object.keys(flomo.files);
        // Match files to notes by checking which note matches the file path
        for (const filePath of memoFiles) {
            // Find matching note by checking if the date matches
            for (const note of flomo.notes) {
                if (filePath.includes(note.date)) {
                    fileToNote.set(filePath, note);
                    break;
                }
            }
        }
        // Sort files by note dateTime (newest first)
        const sortedFiles = memoFiles.sort((a, b) => {
            const noteA = fileToNote.get(a);
            const noteB = fileToNote.get(b);
            if (!noteA || !noteB)
                return 0;
            return noteB.dateTime.localeCompare(noteA.dateTime);
        });
        //buffer.push(`updated at: ${(new Date()).toLocaleString()}\n\n`);
        for (const tag of flomo.tags) {
            tags.push(`"${tag}"`);
        }
        buffer.push(`---\ncreatedDate: ${(new Date()).toLocaleString().split(' ')[0]}\ntags:\n  - ${tags.join("\n  - ")}\n---\n`);
        for (const [idx, memoFile] of sortedFiles.entries()) {
            buffer.push(`![[${memoFile}]]\n\n---\n`);
        }
        ;
        await app.vault.adapter.write(index_file, buffer.join("\n"));
    }
}
exports.generateMoments = generateMoments;
