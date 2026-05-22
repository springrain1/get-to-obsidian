# Changelog

All notable changes to the Get笔记 Importer plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [3.7.0] - 2026-05-22

### Added
- 📊 **Global Quota Manager**: Unified management of OpenAPI read/write/write_note quotas, all modules share quota state to avoid duplicate queries and inconsistencies
- 📈 **Quota Visualization Panel**: Real-time display of remaining quotas (daily/monthly) in main interface and sidebar, automatic warnings when below threshold, countdown display when quota exhausted
- 🔔 **Quota Circuit Breaker**: Automatically disables related features when API quota exhausted error (10203) is received, avoiding forced interruption at worst timing
- 🔍 **Context-Menu Semantic Search**: Select any text block inside any note in the editor and right-click to run `Search with selected text` (with a 🔍 icon), automatically expanding the sidebar and invoking cloud RAG recall
- 🔗 **Full-Channel Bi-directional Links**: Bi-directional links conversion now fully covers both **ZIP Local Import** and **OpenAPI Cloud Sync** channels, perfectly converting escaped `\[\[` and `\]\]` brackets in text bodies, quotes, and webpage summaries

### Fixed
- 🐛 **Empty Folder Creation**: Fixed issue where empty folders were created in certain situations, optimized directory structure management
- 🐛 **OpenAPI Call Count Statistics**: Fixed inaccurate quota consumption tracking, now every API call is correctly recorded and updates global quota state
- 📅 **Date Merging Industrial Best Practice**:
  - **YAML Header Clean-up**: Appended child notes have their sub-Frontmatters (YAML blocks) automatically stripped, ensuring the merged file contains only a single valid YAML block at the very top
  - **Metadata uids Array Aggregation**: Adaptively upgrades a single string `uid` inside the YAML header to a `uids: ["uid1", "uid2", ...]` array, updating `modified` timestamp dynamically
  - **UidIndex Compatibility Enhancement**: Local caching now supports reverse mapping for `uids` array. Second-round incremental checks can 100% locate all synced notes inside merged files, **completely preventing redundant cloud API calls and saving API search quotas**
- 🐛 **ZIP Importer Multi-Links Bug**: Upgraded `.replace` to `.replaceAll` in ZIP local import to ensure all bi-directional links inside a single card are successfully restored

---

## [3.6.0] - 2026-05-21

### Changed
- 🎨 **"Static-Dynamic Separation" Architecture Refactor**: Migrated persistent configurations (API keys, preferences, folder mappings) to native plugin settings tab, Modal popups now serve only as interactive task executors
- ⚙️ **Settings Panel Optimization**: Configuration items grouped by function (Basic Settings, OpenAPI Config, Bidirectional Sync, Visualization Options, Advanced Options), improving user experience and maintainability
- 🔧 **UI Interaction Improvements**: Main panel focuses on sync operations and status display, all configuration management unified in settings tab

---

## [3.5.0] - 2026-05-20

### Added
- 🔄 **OpenAPI Bidirectional Sync**: Support pushing notes created/modified/deleted in Obsidian to Get Notes cloud, achieving true bidirectional synchronization
- 🖼️ **Image Note Upload**: Automatically recognizes local images in Markdown, uploads via OSS to create img_text type notes, supports global SHA-256 deduplication to avoid duplicate uploads
- 🗑️ **Remote Deletion Sync**: Detects notes deleted on cloud through lightweight full ID fetch, handles local copies according to user policy (notify/trash/archive)
- 🌳 **Parent-Child Note Relationships**: Supports bidirectional mapping between local folder hierarchy and cloud parent_id, maintaining consistent note organization structure
- 🔀 **Conflict Merge UI**: Provides three-column comparison interface (local/remote/merge result), users can interactively resolve sync conflicts
- 🏷️ **Tag Differential Push**: Only pushes changed tags (add/delete), reducing API call volume
- ⚙️ **Flexible Trigger Modes**: Supports manual trigger, auto-sync on save, and scheduled sync modes
- 🔐 **Conflict Strategy Configuration**: Supports four strategies: local priority, remote priority, mark conflict, interactive merge

### Fixed
- 🐛 **Authorization Header Compliance**: Fixed Authorization header format, uses raw API Key per official documentation (configurable whether to add Bearer prefix)

---

## [3.4.0] - 2026-05-19

### Added
- 🔍 **OpenAPI Semantic Search (RAG)**: Integrated Get Notes cloud vector semantic search capability, supports global recall and knowledge base recall
- 📌 **Sidebar Search Panel**: Persistent sidebar displays cloud content related to current note, supports real-time follow mode
- ✏️ **Text Selection Search**: Quickly trigger semantic search after selecting text, find related notes, blogger content, live transcripts
- 🎯 **Smart Result Display**: Distinguishes between locally existing notes (open directly) and cloud-only content (preview Modal), supports one-click sync to local
- 📊 **Knowledge Base Scope Filter**: Can choose to search globally or within specified knowledge base, precisely locate relevant content
- ⚡ **Real-time Follow Mode**: Automatically displays related cloud content as reference material when editing notes (configurable debounce time)
- 🎨 **Type Badges**: Result list displays note types (personal note/blogger content/live transcript/Dedao ebook/external webpage)

---

## [3.3.0] - 2026-05-18

### Added
- 🚀 **OpenAPI Sync Channel**: New sync method based on Get Open Platform REST API, coexists with traditional Playwright + ZIP export channel
- 🔑 **OpenAPI Credential Management**: Support configuring Client ID and API Key, provides connection test functionality
- 📚 **Knowledge Base Sync**: Support syncing owned knowledge bases and subscribed external knowledge bases, organized by topic dimension
- 👥 **Subscribed Blogger Sync**: Fetch content published by followed creators (Douyin, WeChat, Dedao, etc.) to local
- 🎙️ **Live Transcript Sync**: Sync AI-transcribed live content (including AI summary and full transcript text)
- 🌳 **Multi-level Parent-Child Directory Tree**: Restore cloud note nesting relationships as local physical folder hierarchy (optional)
- 🔄 **Dual Channel Coexistence**: Users can switch between Playwright mode and OpenAPI mode, both channels share directory structure and incremental records
- 📱 **Mobile Support**: OpenAPI channel uses Obsidian built-in APIs throughout, perfectly supports mobile (Playwright mode still desktop-only)
- 🎯 **Unified Naming Convention**: Adopts Obsidian community best practices, filenames directly use note titles, duplicate conflicts use ` (2)` ` (3)` suffixes
- 📎 **Attachments Grouped by noteId**: OpenAPI channel attachments organized into subdirectories by note ID for easy management
- ⚙️ **Incremental Sync Strategy**: Supports full and incremental sync strategies, incremental mode intelligently determines updates through uid and modified timestamp
- 🔒 **Sync Lock Mechanism**: Ensures only one sync task runs at a time, avoiding concurrent conflicts
- 📊 **Sync History Records**: Records last 20 sync results (success/failure, duration, created/updated counts), convenient for troubleshooting
- 🚫 **Cancellation Mechanism**: Support interrupting sync in progress anytime, immediately stops network requests and file writes

### Changed
- 📁 **Directory Structure Optimization**:
  - Personal notes: `{getTarget}/{memoTarget}/{YYYY-MM-DD}/{title}.md`
  - Knowledge base: `{getTarget}/知识库/{topicName}/{title}.md`
  - Subscribed knowledge base: `{getTarget}/订阅知识库/{topicName}/{title}.md`
  - Subscribed blogger: `{getTarget}/订阅博主/{platform}_{accountName}/{title}.md`
  - Live courses: `{getTarget}/直播课/{topicName}/{title}.md`
- 🏷️ **Tag Normalization**: Unified tag cleaning rules (spaces to underscores, special character escaping, numeric-only prefix), consistent with ZIP channel
- 📄 **YAML Field Extensions**: frontmatter adds `note_type` (note type), `topic_id` (topic ID), `topic_name` (topic name) and other fields

### Fixed
- 🐛 **Large File Handling**: Desktop prioritizes original path, mobile automatically uses streaming temp file, avoiding memory usage
- 🐛 **Path Conflict Detection**: Precisely determines if same note through uid, avoiding mistaken overwrite of different notes
- 🐛 **Timestamp Comparison**: Unified conversion to millisecond timestamps before comparison, avoiding judgment errors from string comparison

---

## [3.2.0] - 2026-05-17

### Fixed
- 📝 **Documentation Compliance**: Removed all external image links, using local screenshots to comply with Obsidian official review requirements
- 🔗 **README Optimization**: Added English description to ensure international users can understand plugin features
- 🖼️ **Image Assets**: Added local images folder with plugin interface screenshots

---

## [3.1.0] - 2026-04-25

### Added
- 🚀 **Selective Attachment Import**: Added a new UI section to choose which attachment types (Images, Audio, Video, Documents) to import, preventing unwanted clutter in the Obsidian vault.
- 🔗 **Source Link YAML Extraction**: Automatically extracts the "Original Source" link from notes and saves it as a clean `source` field in YAML Frontmatter for better metadata management.
- 🛡️ **HTML Parsing Defense (Fidelity Preservation)**: Implemented a robust traversal mechanism to prevent body content loss caused by malformed or unclosed `<p>` tags in source exports.

### Changed
- 📊 **Large File Processing Strategy**: Re-engineered ZIP handling to prioritize direct OS paths on desktop. Introduced the **Streaming Fallback** for 3GB+ files on restricted environments (Mobile/Tablet), resolving the "requested file could not be read" error.
- 🧹 **Refined Markdown Escaping**: Optimized the backslash cleaning regex to only target visual noise (`\_`, `\.`) while preserving critical structural markers for links, headers, and code blocks.

### Fixed
- 🐛 **Content Loss in Long Notes**: Fixed a critical bug where specific HTML structures from exports triggered accidental mass deletion of note bodies during metadata extraction.
- 🐛 **Fenced Code Block Unmasking**: Improved HTML entity decoding within `<pre><code>` blocks to ensure symbols like `<` and `&` appear correctly in Markdown.

---

## [3.0.0] - 2026-04-12


### Added
- 📄 **YAML Frontmatter Properties**: Converted note metadata (title, created time, and tags) into standard Obsidian YAML properties block instead of inline text.
- 📎 **Generic Attachments Support**: Added explicit Turndown rules to capture standard file attachments (like PDFs) linked via `<a>` tags and convert them to Obsidian local links.

### Changed
- 📝 **Heading Format (`ATX`)**: Updated Turndown configurations to use `atx` style for headers (`#`, `##`) instead of `setext` style (`======`).

### Fixed
- 🐛 **Mobile File Import Crash (`undefined path`)**: Added fallback handling via `FileReader` ArrayBuffer to smoothly handle `.zip` files when exact paths are hidden on Mobile/Tablet devices.
- 🐛 **Nested Bullet/Ordered Lists in Paragraphs**: Fixed an issue where GetNote nested lists (`* `, `- `, `1. `) inside `<p>` blocks were not converted to proper Markdown lists correctly. Implemented strict RegExp parsing.
- 🐛 **Sanitized Note Paths (`ENOENT`)**: Fixed sync crash preventing files taking titles with path-forbidden chars (`/`, `\`, `:`, `?`). Files are now correctly named using sanitized variables.
- 🐛 **Audio Playback Embeds**: Recovered `<audio>` attachments parsing which was skipped directly to prevent extraction failures, allowing `.mp3` etc. to natively embed with `![[ ]]`.
- 🐛 **Redundant Image Names**: Eliminated `.image-title` spans directly appended below images during HTML to Markdown extraction to remove trailing texts near images.
- 🐛 **Ghost Empty Folders in Obsidian**: Resolved issue where attaching an accidental trailing slash (`/get attachment/`) told Obsidian to generate an empty child folder in Explorer UI.
- 🐛 **Excessive Backslash Escapes**: Neutralized Turndown's overzealous backslash escapes over normal punctuation (e.g., `gk\_live\_\*`), yielding clean and readable Markdown.

---

## [2.0.0] - 2026-01-12

### 🎉 Major Release - Complete Rebranding

This is a major release with complete rebranding from "flomo" to "Get笔记" and significant UI improvements.

### Added
- ✨ **New UI Design**: Complete redesign of plugin interface with modern, organized sections
- ✨ **Chinese UI**: Full Chinese localization of all UI elements
- ✨ **New Icon**: Notebook-style SVG icon replacing old icon
- ✨ **Sync Status Display**: Real-time display of sync status, last sync time, and memo count
- ✨ **Reset Sync History**: New button to clear sync history and re-import all memos
- ✨ **Comprehensive Documentation**: Complete rewrite of README with detailed guides
- ✨ **Contributing Guidelines**: Added CONTRIBUTING.md for open-source contributors
- ✨ **Roadmap**: Added ROADMAP.md showing future development plans
- ✨ **Architecture Documentation**: Added ARCHITECTURE.md explaining technical details
- ✨ **English Documentation**: Added README.en.md for international users

### Changed
- 🔄 **Global Rename**: All "flomo" references changed to "Get" or "Get笔记"
  - Directory: `lib/flomo/` → `lib/get/`
  - Classes: `FlomoImporter` → `GetImporter`, `FlomoCore` → `GetCore`, etc.
  - Settings: `flomoTarget` → `getTarget`
  - All variable and method names updated
- 🎨 **UI Reorganization**: Settings organized into clear sections:
  - Manual Import
  - Basic Settings
  - Visualization Settings
  - Advanced Options
  - Auto Sync
  - Data Management
- 📝 **Documentation Updates**: All documentation files updated with new terminology
- 🚀 **Deploy Script**: Removed hardcoded paths, added environment variable support

### Fixed
- 🐛 **Canvas File Paths**: Fixed file path matching issue causing empty Canvas
- 🐛 **Moments Sorting**: Fixed time sorting to show newest memos first
- 🐛 **HTML Parsing**: Fixed `cloneNode is not a function` error by using node-html-parser compatible methods
- 🐛 **Login URL Detection**: Updated URL pattern from `**/syncNote**` to `**/note**`

### Security
- 🔒 **Removed Sensitive Files**: Updated .gitignore to exclude:
  - `.claude/` directory
  - Build artifacts (`main.js`, `*.js.map`)
  - Local cache (`.get/`)
  - IDE settings
- 🔒 **Path Sanitization**: Removed all hardcoded personal paths from deploy scripts

### Documentation
- 📖 **README.md**: Complete rewrite with 500+ lines of detailed documentation
  - Installation guide with troubleshooting
  - Step-by-step usage instructions with screenshots
  - FAQ section
  - Development guide
  - Architecture explanation
- 📖 **CONTRIBUTING.md**: Comprehensive contribution guidelines
- 📖 **ROADMAP.md**: Project roadmap and future plans
- 📖 **ARCHITECTURE.md**: Technical architecture documentation
- 📖 **README.en.md**: English version of main documentation
- 📖 **.gitignore**: Enhanced with build artifacts and sensitive files

### Migration Notes

**Upgrading from 1.x:**
- The plugin has been completely rebranded to "Get笔记"
- All functionality remains the same
- Settings will be automatically migrated
- No action required for existing users

---

## [1.4.0] - 2025-11-03

### Added
- 🔇 **Silent Background Sync**: Export process runs without opening browser windows
- 🔄 **Content Update Detection**: Automatically detects and re-imports edited memos
- 🗑️ **Reset Sync History Button**: UI button to clear sync history

### Changed
- 📁 **Simplified Attachment Structure**:
  - Old: `get picture/file/2025-11-03/4852/filename.m4a`
  - New: `get attachment/2025-11-03/filename.m4a`
- ⚙️ **Dynamic Path Configuration**: Attachment paths now respect "Get笔记 Home" setting

### Fixed
- 🐛 **Attachment Reference Updates**: Fixed regex to match all `![text]()` patterns
- 🐛 **Variable Scope Issue**: Fixed compilation error in attachment copying

### Technical
- Refactored attachment copying with specialized method
- Enhanced incremental sync algorithm
- Improved debugging support with better logging

### Documentation
- Created CLAUDE.md with project overview
- Added deploy.sh script for development
- Improved inline code comments

### Migration from 1.3.x to 1.4.0

**Option A: Clean re-import (recommended)**
1. Click "Reset Sync History" in settings
2. Delete old folders: `memos/` and `get picture/`
3. Run sync again

**Option B: Keep existing memos**
- Sync normally
- Old memos keep old paths
- New memos use new paths

---

## [1.3.0] - 2025-09-15

### Added
- Manual sync from ZIP file
- Hourly auto-sync option
- Canvas size customization

### Changed
- Improved error messages
- Better sync progress indication

### Fixed
- Fixed authentication timeout issues
- Fixed memo parsing for special characters

---

## [1.2.0] - 2025-07-20

### Added
- Bi-directional link support (experimental)
- Merge memos by date option
- Tag extraction and display

### Fixed
- Fixed highlight mark conversion
- Fixed attachment download failures

---

## [1.1.0] - 2025-05-10

### Added
- Moments visualization
- Canvas visualization
- Auto-sync on startup

### Changed
- Improved incremental sync algorithm
- Better memo ID generation

---

## [1.0.0] - 2025-03-01

### Added
- Initial release
- Basic sync functionality
- Incremental sync
- Manual authentication
- Playwright-based export

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

## Links

- [Unreleased Changes](https://github.com/geekhuashan/get-to-obsidian/compare/v2.0.0...HEAD)
- [2.0.0 Release](https://github.com/geekhuashan/get-to-obsidian/releases/tag/v2.0.0)
- [Full Changelog](https://github.com/geekhuashan/get-to-obsidian/blob/main/CHANGELOG.md)
