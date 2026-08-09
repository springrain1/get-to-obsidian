const fs = require('fs');
const pathLib = require('path');

const dir = 'e:/GitHub/get-to-obsidian-main/dist_publish';

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

// 1. 修复 canvas.ts 中的类型不匹配
const canvasPath = pathLib.join(dir, 'lib/obIntegration/canvas.ts');
replaceInFile(canvasPath, [
    [/const\s+buffer:\s*Record<string,\s*string>\[\]\s*=\s*\[\];/g, 'const buffer: Record<string, unknown>[] = [];']
]);

// 2. 修复 core.ts 中的所有参数不兼容和 never
const corePath = pathLib.join(dir, 'lib/get/core.ts');
replaceInFile(corePath, [
    // 移除 CustomNode
    [/export\s+interface\s+CustomNode[\s\S]*?rawTagName:\s*string;\s*\}\n\n/g, ''],
    [/\bnode:\s*CustomNode\b/g, 'node: Node'],
    [/\(n:\s*CustomNode\)/g, '(n: Node)'],
    [/\(cell:\s*CustomNode\)/g, '(cell: Node)'],
    
    // 修复 as never 带来的问题
    // 'as never' 在 (node as never).rawTagName 中 -> (node as unknown as {rawTagName?: string})
    [/\(node\s+as\s+CustomNode\)\.rawTagName/g, '(node as unknown as {rawTagName?: string}).rawTagName'],
    
    // codeNode 的 textContent 和 getAttribute 报错，是因为 codeNode 被强转为了 never
    // 源码 145: const codeNode = node.firstChild as never;
    // 我们把它改为 const codeNode = node.firstChild as unknown as HTMLElement;
    [/const\s+codeNode\s*=\s*node\.firstChild\s*as\s*never;/g, 'const codeNode = node.firstChild as unknown as HTMLElement;'],
    
    // node.childNodes
    [/node\.childNodes/g, '(node as unknown as {childNodes: Node[]}).childNodes'],
    
    // as never 的 array filter: ['ul', 'ol'] as never -> ['ul', 'ol'] as unknown as never? 
    // 不，如果直接去掉 as never 会不会报错？之前是 filter: ['ul', 'ol'] as any
    // 我们把它改为 as string[]
    [/as\s+never/g, 'as string[]'],
    
    // options: Record<string, string> 的问题
    // 源码中用到 options.bulletListMarker，它在 Record<string, string> 中，但可能类型不匹配
    [/options:\s*Record<string,\s*string>/g, 'options: { bulletListMarker?: string; }']
]);

console.log("Fix10 applied successfully.");
