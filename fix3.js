const fs = require('fs');

function fixCatchError(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

fixCatchError('e:/GitHub/get-to-obsidian-main/dist_publish/lib/get/exporter.ts', [
    [/catch\s*\{\s*console\.error\('关闭浏览器失败:', err\);\s*\}/g, "catch(err) {\n                    console.error('关闭浏览器失败:', err);\n                }"]
]);

fixCatchError('e:/GitHub/get-to-obsidian-main/dist_publish/lib/ui/main_ui.ts', [
    [/catch\s*\{\s*btn\.setButtonText\("Auto Sync 🤗"\);\s*new Notice\(`Get笔记 同步错误\. 详情:\\n\$\{err\}`\);\s*\}/g, "catch(err) {\n            btn.setButtonText(\"Auto Sync 🤗\");\n            new Notice(`Get笔记 同步错误. 详情:\\n${err}`);\n        }"],
    [/catch\s*\{\s*console\.error\("ZIP 来源解析失败:", err\);\s*new Notice\("ZIP 来源解析失败: " \+ err\.message\);\s*return;\s*\}/g, "catch(err: any) {\n                console.error(\"ZIP 来源解析失败:\", err);\n                new Notice(\"ZIP 来源解析失败: \" + err.message);\n                return;\n            }"],
    [/catch\s*\{\s*this\.rawPath = "";\s*this\.selectedFile = null;\s*new Notice\(`Get笔记 导入错误\. 详情:\\n\$\{err\}`\);\s*\}/g, "catch(err) {\n            this.rawPath = \"\";\n            this.selectedFile = null;\n            new Notice(`Get笔记 导入错误. 详情:\\n${err}`);\n        }"]
]);
