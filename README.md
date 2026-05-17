# 📓 Get笔记 Importer for Obsidian

<div align="center">

A plugin to sync your [Get笔记](https://www.biji.com/) (Get Notes) content into Obsidian with incremental sync, auto-sync, and multiple visualization options.

一个将 [Get笔记](https://www.biji.com/) 的内容同步到 Obsidian 的插件。支持增量同步、自动同步和多种可视化方式。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple)](https://obsidian.md/)

[English Documentation](README.en.md) | [中文文档](#)

[功能特性](#-功能特性) • [安装](#-安装) • [使用指南](#-使用指南) • [常见问题](#-常见问题) • [贡献](#-贡献)

</div>

---

## 🎉 Version 3.1.0 最新更新

### ✨ 新增功能

- **🚀 附件可选导入**：在 UI 界面新增了附件类型过滤器，允许用户自主选择导入哪些类型的附件（图片、音频、视频、文档），有效防止无用文件堆积
- **🔗 原文链接 YAML 自动化**：自动从笔记正文中识别并提取"原文链接"，并将其清洗后存储为 YAML 正文属性中的 `source` 字段，实现更专业的元数据管理
- **🛡️ HTML 解析防御（内容保真）**：针对导出源文件中畸形或未闭合的 `<p>` 标签结构，实施了健壮的节点遍历机制，彻底杜绝了元数据清理时意外"吞噬"正文导致的内容丢失问题

### 🔧 优化改进

- **📊 大文件处理策略优化**：重新设计了 ZIP 文件处理逻辑。桌面端优先使用原始路径以提升效率；针对移动端或受限环境（3GB+ 文件），引入了**真流式临时文件策略**，解决了 "The requested file could not be read" 的读取瓶颈
- **🧹 精细化转义清理**：优化了 Markdown 后处理正则，仅脱敏影响阅读的 `\_` 和 `\.` 等杂音，完整保留方括号、星号、井号等对 Markdown 结构至关重要的转义

### 🐛 问题修复

- **正文大面积丢失**：修复了之前版本在处理特定 HTML 嵌套结构时，因元数据删除逻辑过于宽泛而导致正文大面积被误删的严重 Bug
- **代码块特殊字符还原**：改进了 `<pre><code>` 内的 HTML 实体解码逻辑，确保代码块中的尖括号、连接符等特殊符号能被正确转回 Markdown

---

## ✨ 功能特性

### 核心功能

- ✅ **增量同步**：智能识别已同步的笔记，只导入新增内容，避免重复
- ✅ **智能更新检测**：自动识别 Get笔记 中修改过的笔记并重新导入
- ✅ **附件按类型导入**：可选择性导入图片、音频、视频、文档四类附件，灵活控制存储空间
- ✅ **原文链接提取**：自动提取并保存原文链接到 YAML frontmatter
- ✅ **多种同步方式**：
  - 启动时自动同步
  - 定时自动同步（每小时）
  - 手动一键同步
  - 手动导入 ZIP 文件

### 可视化功能

- 🎨 **Moments 时间线**：按时间倒序显示所有笔记
- 🎨 **Canvas 画布**：画布模式展示笔记网络（支持链接/嵌入两种模式）

### 高级功能

- 🔗 **双向链接支持**（实验性）：保留 Get笔记 中的 `[[wiki-links]]` 格式
- 📅 **按日期合并笔记**：可选将同一天的笔记合并为一个文件
- 🖼️ **附件支持**：自动下载并保存图片、音频等附件
- 📄 **YAML Frontmatter**：元数据以标准 Obsidian 属性格式存储
- ⚡ **高亮语法**：自动转换 `<mark>` 为 Obsidian 的 `==高亮==` 语法
- 💾 **智能文件处理**：桌面端优先使用原始路径，移动端自动使用流式临时文件，避免大文件内存占用

---

## 🚀 安装

### 前置要求

- **Obsidian**：版本 0.15.0 或更高
- **Node.js**：用于构建插件（如果手动安装）
- **Playwright**：浏览器自动化工具（必需）

### 方式一：手动安装（推荐）

#### 1. 克隆仓库

```bash
git clone https://github.com/springrain1/get-to-obsidian.git
cd get-to-obsidian
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 安装 Playwright（重要！）

```bash
npx playwright@1.43.1 install
```

> ⚠️ **必须安装 Playwright**：本插件使用 Playwright 进行浏览器自动化，这是同步功能的核心依赖。

<details>
<summary>💡 Playwright 安装失败？点击查看解决方案</summary>

如果在中国大陆地区安装失败，可以使用镜像：

```bash
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright@1.43.1 install
```

或者强制重新安装：

```bash
npx playwright@1.43.1 install --force
```

</details>

#### 4. 构建插件

```bash
npm run build
```

#### 5. 复制到 Obsidian 插件目录

将以下文件复制到你的 Obsidian vault 的 `.obsidian/plugins/get-importer/` 目录：

- `main.js`
- `manifest.json`
- `styles.css`

**或者使用部署脚本（需要先配置）：**

```bash
# 方式 1: 使用环境变量
export VAULT_PATH="/path/to/your/obsidian/vault"
./deploy.sh

# 方式 2: 创建本地部署脚本
cp deploy.sh deploy.local.sh
# 编辑 deploy.local.sh，设置 VAULT_PATH 为你的 vault 路径
./deploy.local.sh
```

#### 6. 启用插件

1. 重启 Obsidian
2. 进入 `设置` → `第三方插件` → 关闭`安全模式`
3. 在`已安装插件`中找到 `Get笔记 Importer` 并启用

### 方式二：使用 BRAT（开发版）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中添加此仓库
3. BRAT 会自动下载和更新插件

> ⚠️ **注意**：使用 BRAT 安装后，仍需手动安装 Playwright：`npx playwright@1.43.1 install`

---

## 📖 使用指南

### 首次使用

#### 步骤 1：打开插件界面

- 点击左侧边栏的笔记本图标 📓
- 或使用命令面板：`Ctrl/Cmd + P` → 输入 `Get笔记`

#### 步骤 2：登录 Get笔记 账号

1. 点击"登录 Get笔记 账号"按钮
2. 在弹出的浏览器中：
   - 输入手机号
   - 手动点击"获取验证码"
   - 输入验证码
   - 点击"登录"
3. 等待约 10 秒，插件会自动检测登录成功

![插件主界面](images/screenshot-main-ui.png)

#### 步骤 3：配置基本设置（可选）

- **主文件夹**：笔记存储的根目录（默认：`get`）
- **笔记子目录**：笔记文件的子目录（默认：`memos`）
- 例如：笔记会保存在 `get/memos/2024-01-15/` 目录下

#### 步骤 4：首次同步

1. 点击"立即同步"按钮
2. 等待浏览器自动打开并导出数据
3. 插件会自动下载、解析并导入笔记

### 日常使用

#### 自动同步（推荐）

1. **启动时自动同步**
   - 在设置中开启"启动时自动同步"
   - 每次打开 Obsidian 时会自动同步新笔记

2. **定时自动同步**
   - 开启"每小时自动同步"
   - 插件会每 60 分钟自动检查并同步新内容

3. **查看同步状态**
   - 插件界面会显示：
     - ⏰ 上次同步时间
     - 📊 已同步笔记数量
     - ✅ 同步状态

#### 手动同步

**方式 1：自动导出导入**
- 点击插件界面的"立即同步"按钮
- 或使用快捷命令：`Ctrl/Cmd + P` → `Get笔记: 立即同步`

**方式 2：手动导入 ZIP 文件**
1. 在 Get笔记 网页版导出备份（选择 HTML 格式）
2. 在插件界面选择导出的 ZIP 文件
3. 点击导入

### 高级功能

#### 可视化设置

**1. Moments 时间线**
- 开启后，会生成 `Get Moments.md` 文件
- 按时间倒序显示所有笔记的嵌入链接
- 适合快速浏览和回顾

**2. Canvas 画布**
- 开启后，会生成 `Get Canvas.canvas` 文件
- 支持两种模式：
  - **链接模式**：显示文件链接，保持文件同步
  - **嵌入模式**：直接嵌入笔记内容
- 画布大小可调整：小、中、大

#### 附件导入设置

插件支持按类型选择性导入附件，帮助你更好地控制 vault 的存储空间：

**支持的附件类型**：
- 📷 **图片**：jpg, jpeg, png, gif, webp, heic, bmp, svg
- 🎵 **音频**：mp3, m4a, wav, aac, ogg, flac
- 🎬 **视频**：mp4, mov, avi, mkv, webm
- 📄 **文档**：pdf, doc, docx, ppt, pptx, xls, xlsx, txt, md

**配置方式**：
1. 打开插件设置界面
2. 在"高级选项"区域找到"附件导入设置"
3. 勾选需要导入的附件类型
4. 未勾选的类型将被跳过，笔记中的链接会被移除但保留描述文本

**智能链接处理**：
- ✅ **已导入的附件**：生成有效的 Obsidian 链接，可以正常预览和打开
- ❌ **未导入的附件**：移除链接语法，保留描述文本（如文件名或 alt 文本），避免死链

**示例**：
```markdown
# 只启用图片导入时
原始笔记：![风景照](files/photo.jpg) 和 [文档](files/doc.pdf)
导入结果：![风景照](<get/get attachment/photo.jpg>) 和 文档
```

#### 大文件处理机制

插件针对不同平台采用了优化的文件处理策略：

**桌面端（Electron）**：
- 优先使用文件的原始路径（`file.path`）
- 直接传递给解压库，无需额外内存占用
- 适合处理大型 ZIP 文件（>100MB）

**移动端或路径不可用时**：
- 自动回退到真流式临时文件策略
- 使用 Web File Stream API 逐块写入临时文件
- 避免一次性加载整个文件到内存
- 解压完成后自动清理临时文件

**附件复制优化**：
- **本地 vault**：使用 `fs.copyFile` 直接拷贝，零内存占用，最优性能
- **非本地 vault**：受 Obsidian `adapter.writeBinary()` API 限制
  - 该 API 只接受完整 ArrayBuffer，无法流式追加写入
  - 必须先读取完整文件再写入（这是 Obsidian API 边界限制）
  - 对于大附件，内存占用与文件大小成正比

**技术说明**：
- `decompress` 库需要本地文件路径，无法直接处理浏览器 File 对象
- 真流式写入使用 `file.stream().getReader()` + `fs.createWriteStream()`
- 临时文件仅在回退策略时创建，桌面端通常不需要

#### 实验性选项

**1. 双向链接支持**
- 保留 Get笔记 中的 `[[链接]]` 格式
- 在 Obsidian 中可以直接跳转

**2. 按日期合并笔记**
- 将同一天的所有笔记合并为一个文件
- 文件名格式：`memo@2024-01-15.md`

### 数据管理

#### 重置同步历史

如果需要重新导入所有笔记：

1. 点击"重置同步历史"
2. 确认操作
3. 删除旧的笔记文件夹（如 `get/memos/`）
4. 重新执行同步

> ⚠️ **警告**：此操作会清除同步记录，可能导致重复导入。建议先备份重要数据。

---

## 📂 文件结构

同步后，你的 Obsidian vault 会生成以下结构：

```
你的 Vault/
├── get/                          # 主文件夹（可自定义）
│   ├── memos/                    # 笔记子目录
│   │   ├── 2024-01-15/          # 按日期分组
│   │   │   ├── memo@笔记标题_1.md
│   │   │   ├── memo@笔记标题_2.md
│   │   │   └── ...
│   │   └── ...
│   ├── get attachment/          # 附件目录（新版本结构）
│   │   ├── 2024-01-15/
│   │   │   ├── image1.jpg
│   │   │   ├── audio.m4a
│   │   │   └── ...
│   │   └── ...
│   ├── Get Moments.md           # 时间线文件（可选）
│   └── Get Canvas.canvas        # 画布文件（可选）
└── ...
```

---

## 🔧 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/springrain1/get-to-obsidian.git
cd get-to-obsidian

# 安装依赖
npm install

# 安装 Playwright
npx playwright@1.43.1 install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 自动修复代码风格
npm run fix
```

### 项目结构

```
get-to-obsidian/
├── lib/
│   ├── get/                    # 核心功能
│   │   ├── auth.ts            # 认证登录
│   │   ├── core.ts            # 数据解析
│   │   ├── exporter.ts        # 数据导出
│   │   ├── importer.ts        # 数据导入
│   │   └── const.ts           # 常量定义
│   ├── obIntegration/         # Obsidian 集成
│   │   ├── canvas.ts          # Canvas 生成
│   │   └── moments.ts         # Moments 生成
│   └── ui/                    # 用户界面
│       ├── auth_ui.ts         # 登录界面
│       ├── main_ui.ts         # 主界面
│       ├── manualsync_ui.ts   # 手动导入界面
│       └── ...
├── main.ts                    # 插件入口
├── manifest.json              # 插件清单
├── styles.css                 # 样式文件
├── esbuild.config.mjs         # 构建配置
├── package.json               # 项目依赖
└── ...
```

### 技术架构

#### 核心技术

- **Obsidian Plugin API**：插件开发框架
- **Playwright**：浏览器自动化，用于登录和导出
- **TypeScript**：类型安全的开发语言
- **node-html-parser**：HTML 解析
- **turndown**：HTML 转 Markdown

#### 同步流程

```
1. 用户触发同步
   ↓
2. Playwright 打开浏览器登录 Get笔记
   ↓
3. 自动导出数据为 HTML 压缩包
   ↓
4. 解析 HTML，提取笔记内容
   ↓
5. 生成唯一 ID（时间戳 + 内容哈希）
   ↓
6. 过滤已同步的笔记（增量同步）
   ↓
7. 转换为 Markdown 格式
   ↓
8. 保存到 Obsidian vault
   ↓
9. 可选：生成 Moments 和 Canvas
   ↓
10. 更新同步记录
```

#### 增量同步原理

插件为每条笔记生成唯一 ID：

```
格式：${时间戳}_${内容哈希}_${出现次数}_${总数}
示例：2024-01-15T10:30:00_abc123_1_245
```

- **时间戳**：笔记创建时间
- **内容哈希**：标题 + 正文 + 附件的哈希值
- **出现次数**：区分同一时间的不同笔记
- **总数**：序列编号

已同步的 ID 存储在插件设置中，每次同步只导入新 ID 的笔记。

### 修改指南

#### 修改导入格式/模板
编辑 `lib/get/importer.ts` - 控制 Markdown 输出格式和 frontmatter

#### 修改可视化
- `lib/obIntegration/moments.ts` - Moments 显示逻辑
- `lib/obIntegration/canvas.ts` - Canvas 布局和样式

#### 修改 UI
- `lib/ui/` 目录下的文件 - UI 组件
- `styles.css` - 样式修改

#### 修改缓存/存储路径
编辑 `lib/get/const.ts` - 所有路径常量

### 发布新版本

```bash
# 更新版本号（会自动更新 manifest.json 和 versions.json）
npm run version

# 构建
npm run build

# 提交更改
git add .
git commit -m "Release version X.X.X"
git push

# 创建 GitHub Release
# 上传 main.js、manifest.json、styles.css
```

---

## ❓ 常见问题

### 插件无法加载

**问题**：Obsidian 提示插件加载失败

**解决**：
1. 确认已关闭 Obsidian 的"安全模式"
2. 检查插件文件是否完整（main.js, manifest.json, styles.css）
3. 查看控制台错误信息（`Ctrl/Cmd + Shift + I`）
4. 尝试重启 Obsidian

### 登录失败或超时

**问题**：浏览器打开后无法完成登录

**解决**：
1. 确认已安装 Playwright：`npx playwright@1.43.1 install`
2. 检查网络连接，确保能访问 Get笔记 官网
3. 手动操作登录流程：
   - 输入手机号
   - 点击"获取验证码"
   - 输入验证码
   - 点击"登录"
4. 等待 10-15 秒，不要关闭浏览器窗口

### 同步没有新笔记

**问题**：点击同步后提示"新增 0 条笔记"

**可能原因**：
1. Get笔记 中确实没有新笔记
2. 笔记已经在之前同步过（增量同步机制）
3. 同步记录异常

**解决**：
1. 检查 Get笔记 网页版，确认是否有新内容
2. 如需重新导入所有笔记，使用"重置同步历史"功能

### Canvas 或 Moments 不显示

**问题**：开启可视化选项后，文件生成但内容为空

**解决**：
1. 确认已成功导入至少一条笔记
2. 检查文件路径设置是否正确
3. 尝试关闭并重新开启可视化选项
4. 删除旧的 Canvas/Moments 文件后重新同步

### 附件没有导入

**问题**：笔记中的图片、音频等附件没有被导入

**可能原因**：
1. 附件类型未在设置中启用
2. 附件文件损坏或路径异常
3. 磁盘空间不足

**解决**：
1. 打开插件设置 → 高级选项 → 附件导入设置
2. 确认需要的附件类型已勾选
3. 查看控制台日志（`Ctrl/Cmd + Shift + I`）检查具体错误
4. 检查磁盘剩余空间

**查看导入统计**：
同步完成后，控制台会显示详细的附件统计信息：
```
附件统计 - 总计: 45, 图片: 30, 音频: 10, 视频: 3, 文档: 2, 失败: 0
```

### 大文件导入失败或内存不足

**问题**：导入大型 ZIP 文件时崩溃或提示内存不足

**解决**：
1. **桌面端**：插件会自动使用原始文件路径，无需担心内存问题
2. **移动端**：插件会自动使用真流式临时文件，但仍需确保有足够的临时存储空间
3. 检查控制台日志，确认使用的策略：
   - `使用直接路径策略` - 桌面端优化策略（最佳）
   - `使用临时文件回退策略` - 真流式写入策略
4. 如果仍然失败，尝试分批导出和导入
5. 对于本地 vault，附件复制使用 `fs.copyFile`，性能最优

### Playwright 安装失败

**问题**：`npx playwright install` 报错

**解决**：
```bash
# 方法 1: 使用指定版本
npx playwright@1.43.1 install --force

# 方法 2: 清除缓存后重装
npm cache clean --force
npm install
npx playwright@1.43.1 install

# 方法 3: 使用镜像（中国大陆）
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright@1.43.1 install
```

### 从旧版本升级

如果从 1.x 版本升级到 2.0，附件路径结构已改变：

**选项 A：完全重新导入（推荐）**
1. 打开插件设置
2. 点击"重置同步历史"
3. 删除旧文件夹：`get/memos/` 和 `get picture/`
4. 重新同步

**选项 B：保留现有笔记**
1. 正常同步
2. 新笔记使用新的附件结构
3. 旧笔记保持旧路径
4. 结果：混合结构，但不会出错

---

## 🤝 贡献

欢迎任何形式的贡献！这是一个**免费开源**项目，希望能帮助更多使用 Get笔记 和 Obsidian 的朋友。

### 如何贡献

1. **Fork 本仓库**
2. **创建功能分支**：`git checkout -b feature/AmazingFeature`
3. **提交更改**：`git commit -m 'Add some AmazingFeature'`
4. **推送到分支**：`git push origin feature/AmazingFeature`
5. **提交 Pull Request**

### 贡献指南

- 遵循现有代码风格（使用 `npm run lint` 检查）
- 添加必要的注释和文档
- 测试你的更改
- 提交清晰的 commit 信息

### 报告问题

如果你发现 bug 或有功能建议：

1. 在 [Issues](https://github.com/springrain1/get-to-obsidian/issues) 中搜索是否已有相关问题
2. 如果没有，创建新 Issue，请包含：
   - 问题描述
   - 复现步骤
   - 期望行为
   - 实际行为
   - 环境信息（Obsidian 版本、操作系统等）

---

## 📄 许可证

本项目采用 [MIT License](LICENSE.md) 开源许可证。

你可以自由地：
- ✅ 使用本软件用于个人或商业用途
- ✅ 修改源代码
- ✅ 分发本软件
- ✅ 私人使用

但需要：
- 📋 在分发时包含原始许可证和版权声明
- 📋 不对软件提供任何担保

---

## 💖 致谢

- 感谢 [Obsidian](https://obsidian.md/) 提供强大的知识管理平台
- 感谢 [Get笔记](https://www.biji.com/) 的优质笔记服务
- 感谢原始项目 [jia6y/get-to-obsidian](https://github.com/jia6y/get-to-obsidian)
- 感谢所有贡献者和使用者的支持

---

## 📮 联系方式

- **作者**：springrain | 公众号: 及时春雨
- **项目主页**：[https://github.com/springrain1/get-to-obsidian](https://github.com/springrain1/get-to-obsidian)
- **问题反馈**：[GitHub Issues](https://github.com/springrain1/get-to-obsidian/issues)
- **功能建议**：[GitHub Discussions](https://github.com/springrain1/get-to-obsidian/discussions)

---

<div align="center">

**如果这个插件对你有帮助，请给个 ⭐️ Star 支持一下！**

**本项目完全免费开源，欢迎自用和分享！**

Made with ❤️ by Community

</div>
