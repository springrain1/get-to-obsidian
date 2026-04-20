"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCanvas = void 0;
const uuid_1 = require("uuid");
const canvasJson = {
    "nodes": [],
    "edges": []
};
const canvasSize = {
    "L": [500, 500],
    "M": [300, 350],
    "S": [230, 280]
};
async function generateCanvas(app, flomo, config) {
    if (Object.keys(flomo.files).length > 0) {
        const size = canvasSize[config["canvasSize"]];
        const buffer = [];
        const canvasFile = `${config["flomoTarget"]}/Get Canvas.canvas`;
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
        for (const [idx, memoFile] of sortedFiles.entries()) {
            const _id = (0, uuid_1.v4)();
            const _x = (idx % 8) * (size[0] + 20); //  margin: 20px, length: 8n
            const _y = (Math.floor(idx / 8)) * (size[1] + 20); //  margin: 20px
            const content = flomo.files[memoFile];
            const note = fileToNote.get(memoFile);
            const canvasNode = (() => {
                if (config["optionsCanvas"] == "copy_with_link") {
                    return {
                        "type": "file",
                        "file": memoFile,
                        "id": _id,
                        "x": _x,
                        "y": _y,
                        "width": size[0],
                        "height": size[1]
                    };
                }
                else {
                    const title = note ? note.title : memoFile.split("@")[1];
                    return {
                        "type": "text",
                        "text": "**" + title + "**\n\n" + content.join("\n\n---\n\n"),
                        "id": _id,
                        "x": _x,
                        "y": _y,
                        "width": size[0],
                        "height": size[1]
                    };
                }
            })();
            buffer.push(canvasNode);
        }
        ;
        const canvasJson = { "nodes": buffer, "edges": [] };
        await app.vault.adapter.write(canvasFile, JSON.stringify(canvasJson));
    }
}
exports.generateCanvas = generateCanvas;
