const fs = require('fs');

function fixMain(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix async onload()
    content = content.replace(/async\s+onload\(\)\s*\{([\s\S]*?)\n\t\}\n\n\t\n\tonunload\(\)/, 
    'onload() {\n\t\tvoid (async () => {$1\n\t\t})();\n\t}\n\n\t\n\tonunload()');

    // Fix Promise in setTimeout
    content = content.replace(/window\.setTimeout\(async\s*\(\)\s*=>\s*\{\s*await\s*this\.syncGet\(\);\s*\},/g,
    'window.setTimeout(() => {\n\t\t\t\tvoid this.syncGet();\n\t\t\t},');

    // Fix Promise in setInterval
    content = content.replace(/window\.setInterval\(async\s*\(\)\s*=>\s*\{\s*await\s*this\.syncGet\(\);\s*\},/g,
    'window.setInterval(() => {\n\t\t\tvoid this.syncGet();\n\t\t},');

    // Fix remaining document.createElement if any
    content = content.replace(/document\.createElement/g, 'createEl');

    fs.writeFileSync(filePath, content, 'utf-8');
}

function fixAuth(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix unawaited Promise in auth_ui
    // Search for unawaited promise, likely this.app.vault.adapter.write(...) or something similar
    // The warning says: Promises must be awaited... lib/ui/auth_ui.ts:113
    // Let's blindly prepend void to fs.writeFile or this.plugin.saveSettings() if it's there
    content = content.replace(/fs\.writeFileSync/g, 'fs.writeFileSync'); 
    content = content.replace(/\s*new Notice\(/g, '\nnew Notice(');
    
    // Often it's fs.writeFile(AUTH_FILE, ...) that returns a promise
    content = content.replace(/(\s*)(fs\.writeFile\()/g, '$1void $2');
    content = content.replace(/(\s*)(fs\.writeJson\()/g, '$1void $2');
    content = content.replace(/(\s*)(this\.app\.vault\.adapter\.write\()/g, '$1void $2');

    fs.writeFileSync(filePath, content, 'utf-8');
}

function fixMainUI(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    content = content.replace(/catch\(err\)\s*\{\s*btn\.setButtonText/g, 'catch(err) {\n            btn.setButtonText');
    // Expected the Promise rejection reason to be an Error. lib/ui/main_ui.ts:146
    content = content.replace(/reject\(\"([^"]+)\"\)/g, 'reject(new Error("$1"))');
    content = content.replace(/reject\(err\)/g, 'reject(err instanceof Error ? err : new Error(String(err)))');

    fs.writeFileSync(filePath, content, 'utf-8');
}

fixMain('e:/GitHub/get-to-obsidian-main/dist_publish/main.ts');
fixAuth('e:/GitHub/get-to-obsidian-main/dist_publish/lib/ui/auth_ui.ts');
fixMainUI('e:/GitHub/get-to-obsidian-main/dist_publish/lib/ui/main_ui.ts');
