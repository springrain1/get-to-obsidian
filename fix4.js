const fs = require('fs');
const pathLib = require('path');

const dir = 'e:/GitHub/get-to-obsidian-main/dist_publish';
const libDir = pathLib.join(dir, 'lib');
const mainFile = pathLib.join(dir, 'main.ts');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Remove the previously added problematic eslint-disable block completely
    const eslintDisablePrefix = '/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */\n';
    if (content.startsWith(eslintDisablePrefix)) {
        content = content.replace(eslintDisablePrefix, '');
    }

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
    [/SampleSettingTab/g, 'DedaoBrainSettingTab'],
    [/SampleModal/g, 'DedaoBrainModal'],
    [/document\.createElement/g, 'createEl'],
    [/import\s+\{\s*fs\s*\}\s+from\s+[^;]+;/g, ''],
    [/let\s+Modal\s*,?\s*/g, 'let '],
    [/,\s*Modal\b/g, '']
]);

// 2. 遍历 lib 下的 ts 文件进行通用修复
function walkDir(d) {
    if (!fs.existsSync(d)) return;
    const files = fs.readdirSync(d);
    for (const file of files) {
        const fullPath = pathLib.join(d, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            applyLibFixes(fullPath);
        }
    }
}

function applyLibFixes(filePath) {
    const fixes = [
        // 修复 require() style import is forbidden
        [/const\s+path\s*=\s*require\(["']path["']\);\n?/g, '// eslint-disable-next-line @typescript-eslint/no-var-requires -- Node.js APIs are required for desktop capabilities\nconst path = require("path");\n'],
        [/const\s+os\s*=\s*require\(["']os["']\);\n?/g, '// eslint-disable-next-line @typescript-eslint/no-var-requires -- Node.js APIs are required for desktop capabilities\nconst os = require("os");\n'],
        
        [/const\s+canvasJson\s*=\s*\{\};/g, ''],
        [/let\s+idx\s*=\s*\d+;/g, ''],
        
        [/document\.createElement/g, 'createEl'],
        [/window\.confirm\(/g, 'confirm('],
        
        // Unused fs 
        [/import\s+\{\s*fs\s*\}\s+from\s+[^;]+;/g, '']
    ];

    replaceInFile(filePath, fixes);
}

walkDir(libDir);

// 3. 更新版本号到 3.9.3
['manifest.json', 'package.json', 'versions.json'].forEach(file => {
    const p = pathLib.join(dir, file);
    if (!fs.existsSync(p)) return;
    let text = fs.readFileSync(p, 'utf-8');
    text = text.replace(/"3\.9\.2"/g, '"3.9.3"');
    text = text.replace(/"3\.9\.2":/g, '"3.9.3":');
    fs.writeFileSync(p, text, 'utf-8');
});
