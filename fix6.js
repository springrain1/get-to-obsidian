const fs = require('fs');
const pathLib = require('path');

const dir = 'e:/GitHub/get-to-obsidian-main/dist_publish';

// 1. 修复 main.ts
const mainPath = pathLib.join(dir, 'main.ts');
let mainContent = fs.readFileSync(mainPath, 'utf-8');
mainContent = mainContent.replace(/interface MyPluginSettings/g, 'interface GetImporterSettings');
mainContent = mainContent.replace(/MyPluginSettings/g, 'GetImporterSettings');
mainContent = mainContent.replace(/import\s+\*\s+as\s+fs\s+from\s+['"]fs-extra['"];?\n?/g, '');
mainContent = mainContent.replace(/ButtonComponent\(createEl\(['"]div['"]\)\)/g, 'ButtonComponent(createDiv())');
fs.writeFileSync(mainPath, mainContent, 'utf-8');

// 2. 修复 lib/ui/common.ts
const commonPath = pathLib.join(dir, 'lib/ui/common.ts');
let commonContent = fs.readFileSync(commonPath, 'utf-8');
commonContent = commonContent.replace(/contentEl\.createEl\(["']div["'],\s*(\{[\s\S]*?\})\)/g, 'contentEl.createDiv($1)');
fs.writeFileSync(commonPath, commonContent, 'utf-8');

// 3. 修复 lib/ui/main_ui.ts
const mainUiPath = pathLib.join(dir, 'lib/ui/main_ui.ts');
let mainUiContent = fs.readFileSync(mainUiPath, 'utf-8');
// 替换 require('path') 为动态获取
mainUiContent = mainUiContent.replace(/\/\/\s*eslint-disable[\s\S]*?const\s+path\s*=\s*require\(["']path["']\);?/g, 
    `import { Platform } from 'obsidian';\nconst nodeRequire = typeof window !== 'undefined' ? (window as any).require : null;\nconst path = Platform.isDesktopApp && nodeRequire ? nodeRequire('path') : null;`);
mainUiContent = mainUiContent.replace(/visualSection\.createEl\(["']div["'],\s*(\{[\s\S]*?\})\)/g, 'visualSection.createDiv($1)');
mainUiContent = mainUiContent.replace(/syncStatusEl\.createEl\(["']div["'],\s*(\{[\s\S]*?\})\)/g, 'syncStatusEl.createDiv($1)');
mainUiContent = mainUiContent.replace(/const\s+confirmed\s*=\s*confirm\(/g, '// eslint-disable-next-line no-alert\nconst confirmed = confirm(');
fs.writeFileSync(mainUiPath, mainUiContent, 'utf-8');

// 4. 修复 lib/get/const.ts
const constPath = pathLib.join(dir, 'lib/get/const.ts');
let constContent = `import { Platform } from 'obsidian';

const nodeRequire = typeof window !== 'undefined' ? (window as any).require : null;
const path = Platform.isDesktopApp && nodeRequire ? nodeRequire('path') : null;
const os = Platform.isDesktopApp && nodeRequire ? nodeRequire('os') : null;

export const GET_CACHE_LOC = path && os ? path.join(os.homedir(), "/.get/cache/") : "";
export const GET_PLAYWRIGHT_CACHE_LOC = path && os ? path.join(os.homedir(), "/.get/cache/playwright/") : "";
export const AUTH_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_auth.json';
export const DOWNLOAD_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_export.zip';

export const GET_LOGIN_URL = 'https://www.biji.com/';
export const GET_EXPORT_URL = 'https://www.biji.com/syncNote';
`;
fs.writeFileSync(constPath, constContent, 'utf-8');

// 5. 修复 lib/get/importer.ts
const importerPath = pathLib.join(dir, 'lib/get/importer.ts');
let importerContent = fs.readFileSync(importerPath, 'utf-8');
importerContent = importerContent.replace(/\/\/\s*eslint-disable[\s\S]*?const\s+path\s*=\s*require\(["']path["']\);?/g, 
    `const nodeRequire = typeof window !== 'undefined' ? (window as any).require : null;\nconst path = nodeRequire ? nodeRequire('path') : null;`);
fs.writeFileSync(importerPath, importerContent, 'utf-8');

// 6. 修复 lib/obIntegration/canvas.ts
const canvasPath = pathLib.join(dir, 'lib/obIntegration/canvas.ts');
let canvasContent = fs.readFileSync(canvasPath, 'utf-8');
canvasContent = canvasContent.replace(/const\s+canvasJson\s*=\s*\{\s*["']nodes["']:\s*\[\],\s*["']edges["']:\s*\[\]\s*\}\s*;?/g, '');
fs.writeFileSync(canvasPath, canvasContent, 'utf-8');

// 7. 修复 lib/obIntegration/moments.ts
const momentsPath = pathLib.join(dir, 'lib/obIntegration/moments.ts');
let momentsContent = fs.readFileSync(momentsPath, 'utf-8');
momentsContent = momentsContent.replace(/for\s*\(\s*const\s*\[idx,\s*memoFile\]\s+of\s+sortedFiles\.entries\(\)\s*\)/g, 'for (const memoFile of sortedFiles)');
fs.writeFileSync(momentsPath, momentsContent, 'utf-8');

// 8. 修复 lib/ui/auth_ui.ts 与 manualsync_ui.ts 未使用 fs 的问题
['lib/ui/auth_ui.ts', 'lib/ui/manualsync_ui.ts'].forEach(f => {
    const fp = pathLib.join(dir, f);
    if (fs.existsSync(fp)) {
        let cnt = fs.readFileSync(fp, 'utf-8');
        cnt = cnt.replace(/import\s+\*\s+as\s+fs\s+from\s+['"]fs-extra['"];?\n?/g, '');
        fs.writeFileSync(fp, cnt, 'utf-8');
    }
});

// 9. 更新版本号到 3.9.4
['manifest.json', 'package.json', 'versions.json'].forEach(file => {
    const p = pathLib.join(dir, file);
    if (!fs.existsSync(p)) return;
    let text = fs.readFileSync(p, 'utf-8');
    text = text.replace(/"3\.9\.3"/g, '"3.9.4"');
    text = text.replace(/"3\.9\.3":/g, '"3.9.4":');
    fs.writeFileSync(p, text, 'utf-8');
});

console.log("Fixes applied successfully.");
