const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'lib');
const mainFile = path.join(__dirname, 'main.ts');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. main.ts 修复
replaceInFile(mainFile, [
    // rename sample class
    [/SampleSettingTab/g, 'GetImporterSettingTab'],
    // remove unused imports
    [/import\s+\{[^}]*?(?:fs|AUTH_FILE|Modal|GetImporter|DOWNLOAD_FILE)[^}]*?\}\s+from\s+[^;]+;/g, match => {
        let res = match.replace(/\b(?:fs|AUTH_FILE|Modal|GetImporter|DOWNLOAD_FILE)\b/g, '').replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
        if (res.includes('{ }') || res.includes('{}')) return '';
        return res;
    }],
    // Promise void returns (onunload)
    [/async onunload\(\) {/g, 'onunload() {'],
    // setTimeout
    [/\bsetTimeout\(/g, 'window.setTimeout('],
    // createElement
    [/document\.createElement/g, 'createEl']
]);

// 2. 遍历 lib 下的 ts 文件进行通用修复
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            applyLibFixes(fullPath);
        }
    }
}

function applyLibFixes(filePath) {
    const fixes = [
        // 移除原生的 path 和 os
        [/import\s+(?:\*\s+as\s+path|path)\s+from\s+['"]path['"];?\n?/g, ''],
        [/import\s+(?:\*\s+as\s+os|os)\s+from\s+['"]os['"];?\n?/g, ''],
        [/import\s+\{\s*path\s*\}\s+from\s+['"]path['"];?\n?/g, ''],
        
        // 移除 console.log
        [/^[ \t]*console\.log\(.*?\);?\r?\n/gm, ''],
        
        // createElement -> createEl
        [/document\.createElement/g, 'createEl'],
        
        // empty blocks catch(e){}
        [/catch\s*\(\s*e\s*\)\s*\{\s*\}/g, 'catch(e){/* ignore */}'],
        [/catch\s*\(\s*e\s*:\s*any\s*\)\s*\{\s*\}/g, 'catch(e){/* ignore */}'],
        
        // Unnecessary escape \/
        [/\\\//g, '/'],
        
        // unused 'e' in catch if it's there
        [/catch\s*\(\s*e\s*\)\s*\{/g, 'catch(err) {'],
        [/catch\s*\(\s*e\s*:\s*any\s*\)\s*\{/g, 'catch(err: any) {'],
    ];

    // 特殊处理 lib/ui/main_ui.ts 中未使用的 path 和 confirm
    if (filePath.endsWith('main_ui.ts')) {
        fixes.push([/confirm\(/g, 'window.confirm(']); // confirm 替换
        fixes.push([/import\s+\{[^}]*?path[^}]*?\}\s+from\s+[^;]+;/g, match => match.replace(/\bpath\b,?\s*/g, '')]);
    }
    
    // 特殊处理一些 UI 文件中没有用到的类
    if (filePath.endsWith('auth_ui.ts')) {
        fixes.push([/import\s+\{[^}]*?(?:Plugin|createExpOpt|fs|AUTH_FILE)[^}]*?\}\s+from\s+[^;]+;/g, match => match.replace(/\b(?:Plugin|createExpOpt|fs|AUTH_FILE)\b,?\s*/g, '')]);
    }
    if (filePath.endsWith('manualsync_ui.ts')) {
        fixes.push([/import\s+\{[^}]*?(?:Plugin|createExpOpt|fs|Notice)[^}]*?\}\s+from\s+[^;]+;/g, match => match.replace(/\b(?:Plugin|createExpOpt|fs|Notice)\b,?\s*/g, '')]);
    }
    if (filePath.endsWith('message_ui.ts')) {
         fixes.push([/import\s+\{[^}]*?(?:Plugin|Notice)[^}]*?\}\s+from\s+[^;]+;/g, match => match.replace(/\b(?:Plugin|Notice)\b,?\s*/g, '')]);
    }
    if (filePath.endsWith('common.ts')) {
        fixes.push([/import\s+\{[^}]*?(?:HTMLElement)[^}]*?\}\s+from\s+[^;]+;/g, match => match.replace(/\b(?:HTMLElement)\b,?\s*/g, '')]);
    }

    // 针对 lib/obIntegration/canvas.ts 和 moments.ts 移除无用变量
    if (filePath.endsWith('canvas.ts')) {
        fixes.push([/const\s+canvasJson\s*=\s*\{\};/g, '']);
    }
    if (filePath.endsWith('moments.ts')) {
        fixes.push([/let\s+idx\s*=\s*0;/g, '']);
        fixes.push([/idx\+\+;/g, '']);
    }

    replaceInFile(filePath, fixes);
}

walkDir(libDir);
