import { App } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { GetCore } from '../get/core';

const canvasJson = {
    "nodes": [],
    "edges": []
}

const canvasSize = {
    "L": [500, 500],
    "M": [300, 350],
    "S": [230, 280]
}

export async function generateCanvas(app: App, flomo: GetCore, config: Record<string, any>): Promise<void> {
    if (Object.keys(flomo.files).length > 0) {
        const size: number[] = canvasSize[config["canvasSize"]];
        const buffer: Record<string, string>[] = [];
        const canvasFile = `${config["getTarget"]}/Get Canvas.canvas`;

        // Get all file paths and sort by note dateTime (newest first)
        // Build a map of filepath -> note for sorting
        const fileToNote = new Map<string, any>();
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
            if (!noteA || !noteB) return 0;
            return noteB.dateTime.localeCompare(noteA.dateTime);
        });

        for (const [idx, memoFile] of sortedFiles.entries()) {

            const _id: string = uuidv4();
            const _x: number = (idx % 8) * (size[0] + 20); //  margin: 20px, length: 8n
            const _y: number = (Math.floor(idx / 8)) * (size[1] + 20); //  margin: 20px

            const content = flomo.files[memoFile];
            const note = fileToNote.get(memoFile);

            const canvasNode: Record<string, any> = (() => {
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
                } else {
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
            })()

            buffer.push(canvasNode);
        };

        const canvasJson = { "nodes": buffer, "edges": [] }
        await app.vault.adapter.write(canvasFile, JSON.stringify(canvasJson));

    }
}
