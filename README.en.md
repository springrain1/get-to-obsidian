# 📓 Get笔记 Importer for Obsidian

<div align="center">

A plugin to sync your [Get笔记](https://www.biji.com/) (Get Notes) content into Obsidian with incremental sync, auto-sync, and multiple visualization options.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple)](https://obsidian.md/)

[中文文档](README.md) | **English**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [FAQ](#-faq) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### Core Features
- ✅ **Incremental Sync**: Smart detection to import only new notes, avoiding duplicates
- ✅ **Content Update Detection**: Automatically detects and re-imports edited notes
- ✅ **Multiple Sync Methods**: Auto-sync on startup, hourly auto-sync, manual sync
- ✅ **Attachment Support**: Automatically downloads and saves images, audio files

### Visualization
- 🎨 **Moments Timeline**: Chronological view of all notes
- 🎨 **Canvas Board**: Visual network of notes (link or embed mode)

### Advanced Features
- 🔗 **Bi-directional Links** (Experimental): Preserves `[[wiki-links]]` format
- 📅 **Merge by Date**: Optional merging of same-day notes into single file
- ⚡ **Highlight Syntax**: Auto-converts `<mark>` to `==highlight==`

---

## 🚀 Installation

### Prerequisites
- **Obsidian**: Version 0.15.0 or higher
- **Node.js**: For building the plugin
- **Playwright**: Browser automation (required)

### Manual Installation

#### 1. Clone Repository

```bash
git clone https://github.com/geekhuashan/get-to-obsidian.git
cd get-to-obsidian
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Install Playwright (Important!)

```bash
npx playwright@1.43.1 install
```

> ⚠️ **Playwright is required**: This plugin uses Playwright for browser automation - it's essential for sync functionality.

<details>
<summary>💡 Playwright installation issues? Click for solutions</summary>

If installation fails in mainland China:

```bash
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright@1.43.1 install
```

Or force reinstall:

```bash
npx playwright@1.43.1 install --force
```

</details>

#### 4. Build Plugin

```bash
npm run build
```

#### 5. Copy to Obsidian

Copy these files to `.obsidian/plugins/get-importer/` in your vault:
- `main.js`
- `manifest.json`
- `styles.css`

Or use deploy script:

```bash
# Method 1: Use environment variable
export VAULT_PATH="/path/to/your/obsidian/vault"
./deploy.sh

# Method 2: Create local deploy script
cp deploy.sh deploy.local.sh
# Edit deploy.local.sh, set VAULT_PATH
./deploy.local.sh
```

#### 6. Enable Plugin

1. Restart Obsidian
2. Go to `Settings` → `Community plugins` → Turn off `Safe mode`
3. Find `Get笔记 Importer` in installed plugins and enable it

---

## 📖 Quick Start

### First Time Setup

#### Step 1: Open Plugin Interface
- Click the notebook icon 📓 in the sidebar
- Or use command palette: `Ctrl/Cmd + P` → Type `Get笔记`

#### Step 2: Login to Get笔记
1. Click "Login to Get笔记 Account"
2. In the browser window that opens:
   - Enter your phone number
   - Click "Get Verification Code" manually
   - Enter the code
   - Click "Login"
3. Wait ~10 seconds for auto-detection

#### Step 3: Configure Settings (Optional)
- **Main Folder**: Root directory for notes (default: `get`)
- **Memo Subfolder**: Subfolder for memos (default: `memos`)
- Notes will be saved in `get/memos/2024-01-15/`

#### Step 4: First Sync
1. Click "Sync Now"
2. Wait for browser automation
3. Plugin will download, parse, and import notes

### Daily Usage

#### Auto-Sync (Recommended)
- **On Startup**: Enable in settings, syncs when Obsidian opens
- **Hourly**: Enable for automatic hourly background sync
- **Status Display**: Shows last sync time and memo count

#### Manual Sync
- Click "Sync Now" button
- Or use command: `Ctrl/Cmd + P` → `Get笔记: Sync Now`

---

## 📂 File Structure

After sync, your vault will have:

```
Your Vault/
├── get/                          # Main folder (customizable)
│   ├── memos/                    # Memo subfolder
│   │   ├── 2024-01-15/          # Grouped by date
│   │   │   ├── memo@title_1.md
│   │   │   ├── memo@title_2.md
│   │   │   └── ...
│   │   └── ...
│   ├── get attachment/          # Attachments (new v2.0 structure)
│   │   ├── 2024-01-15/
│   │   │   ├── image1.jpg
│   │   │   ├── audio.m4a
│   │   │   └── ...
│   │   └── ...
│   ├── Get Moments.md           # Timeline file (optional)
│   └── Get Canvas.canvas        # Canvas file (optional)
└── ...
```

---

## 🔧 Development

### Local Development

```bash
# Clone repository
git clone https://github.com/geekhuashan/get-to-obsidian.git
cd get-to-obsidian

# Install dependencies
npm install

# Install Playwright
npx playwright@1.43.1 install

# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Auto-fix code style
npm run fix
```

### Project Structure

```
get-to-obsidian/
├── lib/
│   ├── get/                    # Core functionality
│   │   ├── auth.ts            # Authentication
│   │   ├── core.ts            # Data parsing
│   │   ├── exporter.ts        # Data export
│   │   ├── importer.ts        # Data import
│   │   └── const.ts           # Constants
│   ├── obIntegration/         # Obsidian integration
│   │   ├── canvas.ts          # Canvas generation
│   │   └── moments.ts         # Moments generation
│   └── ui/                    # User interface
│       ├── auth_ui.ts         # Login UI
│       ├── main_ui.ts         # Main UI
│       └── ...
├── main.ts                    # Plugin entry point
├── manifest.json              # Plugin manifest
├── styles.css                 # Styles
└── ...
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

---

## ❓ FAQ

### Plugin won't load

**Solution**:
1. Ensure Safe Mode is disabled
2. Check all plugin files are present
3. View console errors: `Ctrl/Cmd + Shift + I`
4. Try restarting Obsidian

### Login fails or times out

**Solution**:
1. Confirm Playwright is installed: `npx playwright@1.43.1 install`
2. Check network connection to Get笔记
3. Manually complete login steps in browser
4. Wait 10-15 seconds, don't close browser

### No new notes after sync

**Possible reasons**:
1. No new notes in Get笔记
2. Notes already synced (incremental sync)
3. Sync history issue

**Solution**:
1. Check Get笔记 website for new content
2. Use "Reset Sync History" to re-import all

### Playwright installation fails

```bash
# Method 1: Force reinstall
npx playwright@1.43.1 install --force

# Method 2: Clear cache
npm cache clean --force
npm install
npx playwright@1.43.1 install

# Method 3: Use mirror (China)
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/
npx playwright@1.43.1 install
```

---

## 🤝 Contributing

Contributions are welcome! This is a **free and open-source** project.

### How to Contribute

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** changes: `git commit -m 'Add some AmazingFeature'`
4. **Push** to branch: `git push origin feature/AmazingFeature`
5. **Submit** Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Report Issues

Found a bug or have a feature request?

1. Search [Issues](https://github.com/geekhuashan/get-to-obsidian/issues)
2. If not found, [create new Issue](https://github.com/geekhuashan/get-to-obsidian/issues/new)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).

You are free to:
- ✅ Use for personal or commercial purposes
- ✅ Modify the source code
- ✅ Distribute the software
- ✅ Private use

---

## 💖 Acknowledgments

- Thanks to [Obsidian](https://obsidian.md/) for the powerful knowledge management platform
- Thanks to [Get笔记](https://www.biji.com/) for the note-taking service
- Thanks to the original project [jia6y/get-to-obsidian](https://github.com/jia6y/get-to-obsidian)
- Thanks to all contributors and users

---

## 📮 Contact

- **Issues**: [GitHub Issues](https://github.com/geekhuashan/get-to-obsidian/issues)
- **Discussions**: [GitHub Discussions](https://github.com/geekhuashan/get-to-obsidian/discussions)

---

## 📚 Documentation

- [中文完整文档](README.md) - Complete Chinese documentation
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Changelog](CHANGELOG.md) - Version history
- [Roadmap](ROADMAP.md) - Future plans
- [Architecture](ARCHITECTURE.md) - Technical details

---

<div align="center">

**If this plugin helps you, please give it a ⭐️ Star!**

**This project is completely free and open-source. Welcome to use and share!**

Made with ❤️ by the Community

</div>
