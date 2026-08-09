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

// 1. 修复 importer.ts 中 PathModule 缺少的 dirname
const importerPath = pathLib.join(dir, 'lib/get/importer.ts');
replaceInFile(importerPath, [
    [/interface\s+PathModule\s*\{\s*join/, 'interface PathModule { dirname(p: string): string; join']
]);

// 2. 修复 core.ts 中的类型定义
const corePath = pathLib.join(dir, 'lib/get/core.ts');
replaceInFile(corePath, [
    // 将 'as unknown' 还原，改为 'as never'，或者干脆去掉 as any
    // 在 turndown filter 里面，数组类型是不允许的，源码可能是 ['ul', 'ol'] as any
    // 我们可以把它转换成 filter: ['ul', 'ol']，如果不允许，我们可以写 filter: ['ul', 'ol'] as unknown as Filter
    // 之前改成了 as unknown 报错: Type 'unknown' is not assignable to type 'Filter'
    // 我们将其改为 as never，在 TS 中 any 可以赋值给任何，never 可以赋值给任何！
    [/as\s+unknown/g, 'as never'],
    // node: HTMLElement -> node: any 肯定报错，定义一个 CustomNode 类型
    [/import\s*\{\s*GetNote\s*\}\s*from\s*['"]\.\/parser['"];?/, 'import { GetNote } from "./parser";\ninterface CustomNode { nodeName: string; parentNode: CustomNode; children: CustomNode[]; getAttribute(n: string): string; textContent: string; firstChild: CustomNode; nextSibling: CustomNode; rawTagName: string; }'],
    [/\bnode:\s*HTMLElement\b/g, 'node: CustomNode'],
    [/\(n:\s*HTMLElement\)/g, '(n: CustomNode)'],
    [/\(cell:\s*HTMLElement\)/g, '(cell: CustomNode)'],
    // 修复 471 行的 node 也是 unknown 的问题
    // 报错: Property 'rawTagName' does not exist on type 'unknown'. (471, 64)
    // 找到 `(node as unknown).rawTagName` 把它改成 `(node as CustomNode).rawTagName`
    [/\(node\s+as\s+unknown\)\.rawTagName/g, '(node as CustomNode).rawTagName']
]);

let coreContent = fs.readFileSync(corePath, 'utf-8');
if (!coreContent.includes('interface CustomNode')) {
    coreContent = coreContent.replace(/export\s+class\s+GetCore/, 
        'export interface CustomNode { nodeName: string; parentNode: CustomNode; children: CustomNode[]; getAttribute(n: string): string; textContent: string; firstChild: CustomNode; nextSibling: CustomNode; rawTagName: string; }\n\nexport class GetCore');
    fs.writeFileSync(corePath, coreContent, 'utf-8');
}
coreContent = fs.readFileSync(corePath, 'utf-8');
coreContent = coreContent.replace(/options:\s*Record<string,\s*unknown>/g, 'options: Record<string, string>');
fs.writeFileSync(corePath, coreContent, 'utf-8');

// 3. 修复 obIntegration 中的 Record<string, string> 不匹配 GetNote
const canvasPath = pathLib.join(dir, 'lib/obIntegration/canvas.ts');
replaceInFile(canvasPath, [
    [/import\s+\{\s*GetCore\s*\}\s+from\s+['"]\.\.\/get\/core['"];/, 'import { GetCore, GetNote } from "../get/core";'],
    [/Map<string,\s*Record<string,\s*string>>/g, 'Map<string, GetNote>'],
    [/Record<string,\s*unknown>/g, 'Record<string, string>']
]);

const momentsPath = pathLib.join(dir, 'lib/obIntegration/moments.ts');
replaceInFile(momentsPath, [
    [/import\s+\{\s*GetCore\s*\}\s+from\s+['"]\.\.\/get\/core['"];/, 'import { GetCore, GetNote } from "../get/core";'],
    [/Map<string,\s*Record<string,\s*string>>/g, 'Map<string, GetNote>']
]);

console.log("Fix9 applied successfully.");
