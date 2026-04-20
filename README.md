# 📓 Get笔记 Importer for Obsidian

<div align="center">

一个将 [Get笔记](https://www.biji.com/) 的内容同步到 Obsidian 的插件。支持增量同步、自动同步和多种可视化方式。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple)](https://obsidian.md/)

[功能特性](#-功能特性) • [安装](#-安装) • [使用指南](#-使用指南) • [常见问题](#-常见问题) • [贡献](#-贡献)

</div>

---

## 🎉 Version 2.0 重大更新

### ✨ 新功能

- **🔇 静默后台同步**：导出过程在后台静默运行，不再打开浏览器窗口
- **📁 简化的附件结构**：从 `get picture/file/日期/用户ID/文件名` 简化为 `get attachment/日期/文件名`
- **🔄 智能内容更新检测**：自动检测 Get笔记 中的笔记修改，重新导入更新的内容
- **🗑️ 重置同步历史**：设置中新增重置按钮，可清除同步历史重新导入
- **⚙️ 动态路径配置**：附件路径跟随"Get笔记主目录"设置自动调整

---

## ✨ 功能特性

### 核心功能

- ✅ **增量同步**：智能识别已同步的笔记，只导入新增内容，避免重复
- ✅ **智能更新检测**：自动识别 Get笔记 中修改过的笔记并重新导入
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
- ⚡ **高亮语法**：自动转换 `<mark>` 为 Obsidian 的 `==高亮==` 语法

---

## 🚀 安装

### 前置要求

- **Obsidian**：版本 0.15.0 或更高
- **Node.js**：用于构建插件（如果手动安装）
- **Playwright**：浏览器自动化工具（必需）

### 方式一：手动安装（推荐）

#### 1. 克隆仓库

```bash
git clone https://github.com/你的用户名/get-to-obsidian.git
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

<img width="350" alt="登录界面" src="https://github.com/jia6y/get-to-obsidian/assets/1456952/7754586a-e9e2-40b7-93c1-0dbcc0631a1e">

#### 步骤 3：配置基本设置（可选）

- **主文件夹**：笔记存储的根目录（默认：`get`）
- **笔记子目录**：笔记文件的子目录（默认：`memos`）
- 例如：笔记会保存在 `get/memos/2024-01-15/` 目录下

#### 步骤 4：首次同步

1. 点击"立即同步"按钮
2. 等待浏览器自动打开并导出数据
3. 插件会自动下载、解析并导入笔记

<img width="300" alt="同步过程" src="https://github.com/jia6y/get-to-obsidian/assets/1456952/24910880-6201-497f-8359-191e476a5bed">

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

<img width="350" alt="自动同步" src="https://github.com/jia6y/get-to-obsidian/assets/1456952/71af02c3-9c14-4eec-b56f-d6207178ccd5">

#### 手动同步

**方式 1：自动导出导入**
- 点击插件界面的"立即同步"按钮
- 或使用快捷命令：`Ctrl/Cmd + P` → `Get笔记: 立即同步`

**方式 2：手动导入 ZIP 文件**
1. 在 Get笔记 网页版导出备份（选择 HTML 格式）
2. 在插件界面选择导出的 ZIP 文件
3. 点击导入

<img width="350" alt="手动导出" src="https://github.com/jia6y/get-to-obsidian/assets/1456952/b6222501-b0e7-45f4-8acb-6b489c9b1fc0">

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

<img width="252" alt="Canvas示例" src="https://github.com/jia6y/get-to-obsidian/assets/1456952/b1bd2399-87f1-4d60-80cf-111bbce8fe68">

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
git clone https://github.com/你的用户名/get-to-obsidian.git
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

1. 在 [Issues](https://github.com/你的用户名/get-to-obsidian/issues) 中搜索是否已有相关问题
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

- **问题反馈**：[GitHub Issues](https://github.com/你的用户名/get-to-obsidian/issues)
- **功能建议**：[GitHub Discussions](https://github.com/你的用户名/get-to-obsidian/discussions)

---

<div align="center">

**如果这个插件对你有帮助，请给个 ⭐️ Star 支持一下！**

**本项目完全免费开源，欢迎自用和分享！**

Made with ❤️ by Community

</div>
