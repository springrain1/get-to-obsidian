# 📓 得到大脑（原Get笔记） Importer for Obsidian

<div align="center">

A plugin to sync your [得到大脑（原Get笔记）](https://www.biji.com/) (Get Notes) content into Obsidian with incremental sync, auto-sync, and multiple visualization options.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple)](https://obsidian.md/)

[中文文档](README.md) | **English**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [FAQ](#-faq) • [Contributing](#-contributing)

</div>

---

## 🎉 Version 3.9.0 Latest Update

### 🚀 Web Private API Full Channel Sync
- **Fast Pull & Incremental Updates**: A boon for non-PRO users! Supports fully pulling personal cloud notes, auto-recording cursors for incremental syncs, and optional native Markdown export for maximum fidelity.
- **Rapid Single Note Push**: Instantly push the currently active note directly to the cloud with a single click in the editor.
- **Advanced Markdown Renderer**: Built-in custom rendering engine that perfectly parses Obsidian syntax (highlights, math formulas, task lists) and auto-uploads local images to the Get Notes cloud format.

### 🎨 UI Experience & UX Refactoring
- **Settings Panel Tab Refactoring**: Completely overhauled the long single-page settings into a modern Tab structure, divided into "Sync & Pull", "Push & Bidirectional", "Advanced Options", and "License" sections.
- **Editor Foundation Enhancements**: Brought in CodeMirror extension dependencies to achieve seamless hiding of bidirectional sync markers (e.g. `<!-- getnote:content:start -->`) in reading and Live Preview modes.
- **Full Multilingual (i18n) Support**: Rebuilt the plugin with a comprehensive bilingual architecture. The plugin now 100% supports a seamless English environment, automatically detecting the system language to translate all settings, modals, commands, and prompts.

---

## 📋 Version History Highlights

### V3.8.0 - Bidirectional Sync Safety Boundary


- **Writable Body Region**: OpenAPI downstream notes use `<!-- getnote:content:start -->` to `<!-- getnote:content:end -->` as the only body region that can be uploaded back to the cloud
- **Scoped Writable Fields**: Upstream sync only writes Get Notes editable fields: `title`, `content`, and `tags`; transcripts, attachments, sources, references, and generated sections remain read-only local display content
- **Hash Baseline Alignment**: Local change detection is based on the writable body region plus tags, avoiding false local-change detection caused by downstream-rendered transcripts or attachments

### 🛡️ Safety Fixes

- **Cloud Content Pollution Prevention**: Prevents the full generated Markdown from being written back into Get `content`
- **Conflict File Skip Rules**: `.conflict-*`, `conflict_type: bidirectional_sync`, and `remote_uid` files are not uploaded as new notes
- **Merge Files Do Not Upload**: Merge-by-date files with `uids` are used for downstream reading and incremental deduplication only, not upstream sync
- **Unsafe Setting Combination Guard**: Blocks `mergeByDate + save-trigger bidirectional upload`

---

## 📋 Version History Highlights

### V3.8.0 - Bidirectional Sync Safety Boundary
- 🔄 Writable body region: only content inside the boundary is uploaded back to Get `content`
- 🛡️ Pollution prevention: transcripts, attachments, sources, references, and generated sections are not uploaded as full Markdown
- 📅 Read-only merge files: merge-by-date files do not upload, and save-trigger upload is incompatible with merge-by-date
- ⚔️ Conflict files skipped: conflict copies are not created as new cloud notes

### V3.7.0 - Global Quota Management and Mobile Loading Fix

#### New Features
- 📊 **Global Quota Manager**: Unified management of OpenAPI read/write/write_note quotas, all modules share quota state to avoid duplicate queries and inconsistencies
- 📈 **Quota Visualization Panel**: Real-time display of remaining quotas (daily/monthly) in main interface and sidebar, automatic warnings when below threshold, countdown display when quota exhausted
- 🔔 **Quota Circuit Breaker**: Automatically disables related features when quota exhausted error is received, avoiding forced interruption at worst timing

#### Improvements
- 🎨 **"Static-Dynamic Separation" Architecture Refactor**: Migrated persistent configurations to native plugin settings tab, Modal popups now serve only as interactive task executors
- ⚙️ **Settings Panel Optimization**: Configuration items grouped by function, improving user experience and maintainability

#### Bug Fixes
- 🐛 **Empty Folder Creation**: Fixed issue where empty folders were created in certain situations
- 🐛 **OpenAPI Call Count Statistics**: Fixed inaccurate quota consumption tracking

### V3.6.0 - Configuration Management Refactor
- 🎨 "Static-Dynamic Separation" architecture: persistent configs migrated to settings tab
- ⚙️ Settings panel grouped by function

### V3.5.0 - Bidirectional Sync
- 🔄 OpenAPI Bidirectional Sync: True bidirectional sync between Obsidian ↔ Get Notes
- 🖼️ Image Note Upload: Auto-upload local images (SHA-256 global deduplication)
- 🗑️ Remote Deletion Sync: Detect cloud-deleted notes and handle per user policy
- 🌳 Parent-Child Note Relationships: Bidirectional mapping between local folder hierarchy and cloud parent_id
- 🔀 Conflict Merge UI: Three-column comparison interface for interactive conflict resolution

### V3.4.0 - Semantic Search (RAG)
- 🔍 OpenAPI Semantic Search: Integrated cloud vector semantic search capability
- 📌 Sidebar Search Panel: Real-time display of related cloud content
- ✏️ Text Selection Search: Quick semantic search after selecting text
- 🎯 Smart Result Display: Distinguish local/cloud content, one-click sync support

### V3.3.0 - OpenAPI Sync Channel
- 🚀 OpenAPI Sync Channel: New sync method based on REST API
- 📚 Knowledge Base Sync: Support owned and subscribed knowledge bases
- 👥 Subscribed Blogger Sync: Fetch content from followed creators
- 🎙️ Live Transcript Sync: Sync AI-transcribed live content
- 🌳 Multi-level Parent-Child Directory Tree: Restore cloud note nesting relationships
- 📱 Mobile Support: OpenAPI channel perfectly supports mobile
- 🎯 Unified Naming Convention: Adopts Obsidian community best practices

---

## ✨ Features

### Core Features

- ✅ **Dual Channel Sync**: Support both traditional Playwright + ZIP export and OpenAPI REST API sync methods
- ✅ **Incremental Sync**: Smart detection to import only new notes, avoiding duplicates
- ✅ **Content Update Detection**: Automatically detects and re-imports edited notes
- ✅ **Selective Attachment Import**: Choose which attachment types to import (Images, Audio, Video, Documents)
- ✅ **Source Link Extraction**: Automatically extracts and saves source links to YAML frontmatter
- ✅ **Multiple Sync Methods**: Auto-sync on startup, scheduled auto-sync (configurable interval), manual sync, ZIP import

### OpenAPI Advanced Features

- 🔄 **Bidirectional Sync**: Sync Obsidian titles, tags, and writable body regions back to Get Notes; transcripts, attachments, sources, and other generated sections remain read-only display content
- 📚 **Knowledge Base Sync**: Sync owned knowledge bases and subscribed external knowledge bases, organized by topic dimension
- 👥 **Subscribed Blogger Sync**: Fetch content published by followed creators (Douyin, WeChat, Dedao, etc.) to local
- 🎙️ **Live Transcript Sync**: Sync AI-transcribed live content (including AI summary and full transcript text)
- 🔍 **Semantic Search (RAG)**: Integrated cloud vector semantic search capability, supports global recall and knowledge base recall
- 🖼️ **Image Note Upload**: Automatically recognizes local images in Markdown, uploads via OSS (SHA-256 global deduplication)
- 🗑️ **Remote Deletion Sync**: Detects notes deleted on cloud and handles per user policy (notify/trash/archive)
- 🌳 **Parent-Child Note Relationships**: Bidirectional mapping between local folder hierarchy and cloud parent_id
- 🔀 **Conflict Merge UI**: Three-column comparison interface for interactive conflict resolution
- 📊 **Quota Management**: Real-time display of API quota usage, automatic circuit breaker protection

### Visualization

- 🎨 **Moments Timeline**: Chronological view of all notes
- 🎨 **Canvas Board**: Visual network of notes (link or embed mode)
- 📌 **Sidebar Search Panel**: Real-time display of cloud content related to current note

### Traditional Features

- 🔗 **Bi-directional Links** (Experimental): Preserves `[[wiki-links]]` format
- 📅 **Merge by Date**: Optional merging of same-day notes into single file
- ⚡ **Highlight Syntax**: Auto-converts `<mark>` to `==highlight==`
- 📄 **YAML Frontmatter**: Metadata stored as standard Obsidian properties
- 💾 **Smart File Handling**: Desktop prioritizes original path, mobile auto-uses streaming temp file

---

## 🚀 Installation

### Prerequisites
- **Obsidian**: Version 0.15.0 or higher
- **Node.js**: For building the plugin
- **Playwright**: Browser automation (required)

### Manual Installation

#### 1. Clone Repository

```bash
git clone https://github.com/springrain1/get-to-obsidian.git
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
3. Find `得到大脑（原Get笔记） Importer` in installed plugins and enable it

---

## 📖 Quick Start

### First Time Setup

#### Step 1: Open Plugin Interface
- Click the notebook icon 📓 in the sidebar
- Or use command palette: `Ctrl/Cmd + P` → Type `得到大脑（原Get笔记）`

#### Step 2: Login to 得到大脑（原Get笔记）
1. Click "Login to 得到大脑（原Get笔记） Account"
2. In the browser window that opens:
   - Enter your phone number
   - Click "Get Verification Code" manually
   - Enter the code
   - Click "Login"
3. Wait ~10 seconds for auto-detection

#### Step 3: Configure Settings (Optional)
- **Main Folder**: Root directory for notes (default: `get`)
- **Note Subfolder**: Subfolder for notes (default: `notes`)
- Notes will be saved in `get/notes/2024-01-15/`


#### Step 4: First Sync
1. Click "Sync Now"
2. Wait for browser automation
3. Plugin will download, parse, and import notes

### Daily Usage

#### Auto-Sync (Recommended)
- **On Startup**: Enable in settings, syncs when Obsidian opens
- **Scheduled**: Enable for automatic scheduled background sync (configurable interval)
- **Status Display**: Shows last sync time and memo count

#### Manual Sync
- Click "Sync Now" button
- Or use command: `Ctrl/Cmd + P` → `得到大脑（原Get笔记）: Sync Now`

### Experimental Options

**1. Bi-directional Links Support**
- Supports converting escaped `\[\[wiki-links\]\]` in Get Notes back to native Obsidian `[[wiki-links]]` format, enabling direct click-to-navigate in Obsidian.
- **Full Channel Coverage (V3.7.0+)**: Perfect support for both **ZIP Local Import** and **OpenAPI Cloud Sync** channels! All escaped bi-directional links in the main text, references, and webpage content summaries are globally scanned and elegantly converted.

**2. Merge by Date**
- Merges all notes created on the same day into a single Markdown file.
- Filename format: `2024-01-15.md` (unified naming specification since V3.3+).
- **OpenAPI Industrial Best Practice Mechanism (V3.7.0+)**:
  - **Auto-Stripping**: During cloud synchronization, the system automatically strips the sub-Frontmatter (YAML block) of appended child notes, ensuring that the merged file contains only a single valid YAML block at the very top.
  - **Metadata Aggregation (uids Array)**: The YAML header of the file adaptively upgrades the single `uid` string to a `uids: ["uid1", "uid2", ...]` array, and updates the `modified` date to reflect the latest modification timestamp.
  - **Index & Incremental Deduplication**: Integrates seamlessly with the local `UidIndex` cache scanner. Secondary incremental synchronization can 100% recognize all synced notes within the merged file, completely avoiding duplicate cloud API requests and maximizing your API quota savings.
- **Bidirectional Sync Limitation (V3.8.0+)**: Merge-by-date files contain multiple `uids` and are currently used only for downstream reading and incremental deduplication. The uploader skips these files, and the settings UI blocks merge-by-date from being combined with save-trigger bidirectional upload.

### OpenAPI Advanced Features

#### Semantic Search (RAG) Feature

The semantic search feature helps you quickly find related notes, blogger content, live transcripts, etc. from the cloud while writing, serving as reference material.

**Prerequisites**:
- OpenAPI credentials configured (Client ID and API Key)
- Switched to OpenAPI sync mode

##### Method 1: Sidebar Search Panel (Recommended)

1. **Open Search Panel**
   - Click the **"Search (🔍)"** icon on the left Ribbon navigation bar.
   - Or use command: `Ctrl/Cmd + P` → `Open Semantic Search View`

2. **Manual Search**
   - Enter query in search box
   - Select search scope (Global / Specific knowledge base)
   - Adjust Top-K count (1-10, default 5)
   - Click "Search Now"

##### Method 2: Context Menu Quick Search (V3.7.0+)

1. **One-Click Right-Click Search**
   - **Select any text block** inside any note in the editor, and right-click.
   - In the pop-up context menu, click **`Search with selected text`** (with a 🔍 search icon).
   - The plugin will automatically expand the right sidebar, populate the search field with the selected text, and immediately recall related cloud knowledge for you!

3. **View Results**
   - Result list shows: Title / Type badge / Content snippet / Created time
   - Types include:
     - 📝 Personal Note (NOTE)
     - 👤 Blogger Content (BLOGGER)
     - 🎙️ Live Transcript (LIVE)
     - 🌐 External Webpage (URL)
     - 📚 Dedao Ebook (DEDAO)

4. **Open Notes**
   - **📂 Local**: Click to open local file directly
   - **☁️ Cloud Only**: Click to open preview Modal
     - View full content
     - Click "Sync to Local" to download immediately
     - Click "Copy Content" to copy to clipboard

##### Method 2: Real-time Follow Mode

1. **Enable Real-time Follow**
   - Enable "Real-time Follow" option in plugin settings
   - Configure debounce time (default 3 seconds, range 1-10 seconds)

2. **Auto Search**
   - Automatically triggers search when switching notes
   - Automatically searches when editing notes (3 seconds after stopping input)
   - Sidebar automatically displays related content

3. **Query Text Extraction Rules**
   - Priority: frontmatter `title` field
   - Secondary: first `# heading`
   - Fallback: first 200 characters of content

4. **Manual Override**
   - Can still manually input queries in real-time mode
   - Automatically switches to manual mode after entering new query
   - Resumes real-time mode after switching notes

##### Method 3: Text Selection Search

1. **Select Text**
   - Select text to search in editor (max 500 characters)

2. **Trigger Search**
   - Right-click menu: "Search Similar Content in Cloud"
   - Or use hotkey (configurable in settings)

3. **View Results**
   - Results displayed in new Modal
   - Same operations as sidebar

##### Method 4: Command Palette Quick Search

1. **Current Note Search**
   - `Ctrl/Cmd + P` → `Get Notes: Recall from Current Note`
   - Automatically uses current note's title and summary as query

2. **Custom Query**
   - `Ctrl/Cmd + P` → `Get Notes: Quick Recall`
   - Input box appears, shows results after entering query

##### Knowledge Base Scope Filter

1. **Select Search Scope**
   - Select from dropdown at top of sidebar:
     - 🌐 **Global**: Search all content (default)
     - 🏠 **My: {topic name}**: Search only owned knowledge base
     - 🔗 **Subscribed: {topic name}**: Search only subscribed knowledge base

2. **Scope Switching**
   - Automatically re-searches after switching scope (if query exists)
   - Only shows "Global" option if no knowledge bases synced

##### Quota Management

1. **View Remaining Quota**
   - Sidebar bottom shows: `Today's Remaining Searches: X/1000`
   - Warning color when remaining < 50
   - Reminder before each search when remaining < 10

2. **Quota Exhausted Handling**
   - Automatically disables real-time follow when quota exhausted
   - Shows quota reset time (next day 00:00)
   - Can view detailed quota status in main interface

##### Best Practices

**✅ Recommended**:
- Enable real-time follow while writing to auto-discover related materials
- Use knowledge base scope filter for precise professional content
- Adjust Top-K to 3-5 to balance quality and quota consumption
- Use "Sync to Local" to save important query results

**⚠️ Notes**:
- Real-time follow quickly consumes read quota (1000 times/day)
- Recommend enabling only when needed, use manual search daily
- System auto-disables real-time follow when quota nearly exhausted
- Search results not cached locally, always real-time calls

#### Bidirectional Sync Feature

Bidirectional sync allows you to create, modify, and delete notes in Obsidian and have them automatically pushed to the Get Notes cloud, achieving true bidirectional synchronization.

**Prerequisites**:
- OpenAPI credentials configured (Client ID and API Key)
- Switched to OpenAPI sync mode

##### Configuring Bidirectional Sync

1. **Enable Bidirectional Sync**
   - Open Plugin Settings → OpenAPI Config → Bidirectional Sync
   - Turn on the "Enable Bidirectional Sync" toggle
   - Specify the bidirectional sync folder path (e.g., `get/notes`)

2. **Select Trigger Mode**
   - **Manual Only**: Uploads only when clicking the "Push Local Changes" button
   - **On File Save**: Automatically uploads every time you save a file (5-second throttle)
   - **Manual + Scheduled**: Manual button + scheduled auto-sync

3. **Configure Conflict Strategy**
   - **Local Priority**: Local modifications overwrite the cloud directly
   - **Remote Priority**: Cloud modifications overwrite local copies
   - **Mark Conflict**: Generates a `.conflict.md` conflict file, waiting for manual merging
   - **Interactive Merge**: Displays a three-column comparison panel to visually resolve conflicts

##### Uploading Newly Created Notes

1. **Create a Note Inside the Sync Folder**
   - Create a plain text note (plain_text)
   - Or create a link note (add `source_url` field to frontmatter)

2. **Auto Upload**
   - Automatically detected on file save (if "On File Save" trigger is enabled)
   - Or click "Push Local Changes" to upload manually

3. **Upon Successful Upload**
   - `uid` (cloud note ID) is automatically added to frontmatter
   - `source: Obsidian` added to frontmatter (marking the source)
   - `synced_at` (sync timestamp) added to frontmatter

##### Uploading Image Notes

1. **Insert Local Images in a Note**
   ```markdown
   ![Description](images/photo.jpg)
   or
   ![[images/photo.jpg]]
   ```

2. **Enable Image Upload**
   - Turn on "Upload Image Attachments" in settings (disabled by default)
   - The system will automatically identify local image references

3. **Deduplicated Upload**
   - Uses SHA-256 hash for global deduplication
   - The same image is uploaded only once, saving API quota
   - Hits cache even across different notes, folders, or after renaming

4. **View Deduplication Statistics**
   - Settings UI displays: Number of uploaded images
   - Displays estimated saved quota count
   - Mapping table can be manually cleared

##### Updating Synced Notes

1. **Modify Note Content**
   - Edit the title, body, tags, etc.
   - Save the file

2. **Smart Update Detection**
   - The system determines if content actually changed using hashes
   - Calls the API only when contents have truly modified
   - Avoids unnecessary quota consumption

3. **Conflict Detection**
   - Automatically checks if there are cloud updates before uploading
   - If both sides have modifications, handles according to the configured conflict strategy

##### Deletion Sync

1. **Delete Note Locally**
   - Delete a file in Obsidian (or move it to trash)
   - The system automatically records the pending delete `uid`

2. **Sync Deletion to Cloud**
   - Automatically calls deletion API on the next sync
   - Removed from the queue after successful deletion

3. **Optionally Disable Deletion Sync**
   - Turn off "Sync Deletions" toggle in settings
   - Local deletion will not affect the cloud copy

##### Syncing Remote Deletion to Local

1. **Enable Remote Deletion Detection**
   - Select "Remote Deletion Policy" in settings:
     - **Disabled** (Default): Do not check for remote deletions
     - **Notify**: Alert on detection, do not delete local files
     - **Trash**: Move to system trash
     - **Archive**: Move to `{getTarget}/_remote_deleted/` directory

2. **Detection Mechanism**
   - Automatically executed after each downstream sync completes
   - Compares local files by pulling lightweight full ID lists
   - Only processes notes synced within the last 7 days (to avoid misjudgments)

3. **Accidental Deletion Protection**
   - Rejects execution if the detected deletion rate is > 30% in a single sync
   - Forcefully downgrades to "Notify" mode
   - Logs warnings in the sync history

##### Parent-Child Note Relationships

1. **Local Folder Hierarchy → Cloud parent_id**
   - Note is located at `ParentNoteName/ChildNoteName.md`
   - Same folder contains `ParentNoteName/ParentNoteName.md`
   - Automatically establishes parent-child relationship during upload

2. **Explicit Frontmatter Declaration (Priority)**
   ```yaml
   ---
   parent_id: "Parent note's uid"
   # or
   parent_id_local: "Parent note's local path"
   ---
   ```

3. **Cloud children_ids → Local Bidirectional Links**
   - Automatically appends to the parent note's end during downstream sync:
   ```markdown
   ## Child Notes
   - [[Child Note 1]]
   - [[Child Note 2]]
   ```

##### Quota Management

1. **Pre-upload Check**
   - Automatically estimates quota consumption for this upload
   - Displays warning and asks whether to continue if quota is insufficient

2. **Quota Types**
   - **write** (2000/day): Update/delete notes
   - **write_note** (50/day): Create new notes
   - **read** (1000/day): Query, conflict detection

3. **Quota Exhausted Handling**
   - Stops immediately upon receiving error 10203
   - Automatically disables scheduled bidirectional sync
   - Displays remaining time until next reset

##### Best Practices

**✅ Recommended**:
- Use "Manual" trigger mode to avoid uploading half-written drafts
- Enable "Interactive Merge" conflict strategy to precisely control merge outcomes
- Periodically check quota usage to plan your uploads
- Back up important notes locally before enabling bidirectional sync

**⚠️ Notes**:
- Creating notes quota is limited (50/day), batch uploads should be done in stages
- Image upload is off by default to prevent unexpected heavy quota consumption
- Notes outside the bidirectional sync folder will not be uploaded
- Deletions are irreversible, recommended to test with "Notify" mode first

#### Knowledge Base & Blogger Sync

Sync the knowledge bases you participate in, the blogger content you subscribe to, and completed live transcripts in Get Notes.

**Prerequisites**:
- OpenAPI credentials configured
- Switched to OpenAPI sync mode

##### Syncing Owned Knowledge Bases

1. **Open Knowledge Base Selection View**
   - Click the "Sync Knowledge Base" button on the main panel
   - The system automatically fetches the list of all available knowledge bases

2. **Select Knowledge Bases to Sync**
   - The list shows: Topic Name / Description / Note Count / Created Time
   - Multi-selection is supported
   - Check the desired items and click "Start Sync"

3. **Sync Results**
   - Notes are saved to: `{getTarget}/知识库/{TopicName}/{NoteTitle}.md`
   - frontmatter includes:
     - `topic_id`: Topic ID
     - `topic_name`: Topic Name
     - `source: 得到大脑（原Get笔记）知识库`
     - `note_type`: Note type

4. **Multi-level Directory Tree (Optional)**
   - Enable "Multi-level Directory Tree" in settings
   - Restores cloud parent-child relationships as local folder hierarchy
   - e.g., `知识库/Frontend Learning/React Basics/React Basics.md` and `知识库/Frontend Learning/React Basics/Hooks Deep Dive.md`

##### Syncing Subscribed External Knowledge Bases

1. **Open Knowledge Base Selection View**
   - Both owned and subscribed knowledge bases are displayed in the list
   - Subscribed knowledge bases are marked with `🔗 Subscribed`

2. **Select Subscribed Knowledge Bases to Sync**
   - Operates exactly the same way as syncing owned knowledge bases

3. **Sync Results**
   - Notes are saved to: `{getTarget}/订阅知识库/{TopicName}/{NoteTitle}.md`
   - frontmatter includes:
     - `source: 得到大脑（原Get笔记）订阅知识库`
     - `is_subscribed: true`

##### Syncing Subscribed Blogger Content

1. **Open Blogger Selection View**
   - Click "Sync Subscribed Blogger" button on the main panel
   - The system automatically scans all knowledge bases to collect the list of bloggers

2. **View Blogger List**
   - Shows: Blogger Avatar / Account Name / Platform (Douyin/WeChat/Dedao) / Associated Topic
   - Deduplicated automatically if the same blogger belongs to multiple topics

3. **Select Bloggers and Sync**
   - Multi-selection is supported
   - Click "Start Sync"

4. **Sync Results**
   - Content is saved to: `{getTarget}/订阅博主/{Platform}_{AccountName}/{ContentTitle}.md`
   - e.g., `get/订阅博主/抖音_SomeBlogger/RAG today.md`
   - frontmatter includes:
     - `uid`: post_id_alias
     - `source: 得到大脑（原Get笔记）订阅博主`
     - `platform`: Platform name
     - `account_name`: Blogger account name
     - `tags: [订阅博主]`

##### Syncing Live Transcripts

1. **Open Live Selection View**
   - Click "Sync Live Transcript" button on the main panel
   - The system fetches all live broadcasts with completed AI transcription

2. **View Live Broadcasts List**
   - Shows: Live Title / Speaker / Completion Time / Duration / Associated Topic

3. **Select Lives and Sync**
   - Multi-selection is supported
   - Click "Start Sync"

4. **Sync Results**
   - Saved to: `{getTarget}/直播课/{TopicName}/{LiveTitle}.md`
   - Content structure:
     ```markdown
     # Live Title
     
     ## 🤖 AI Summary
     [AI generated summary content]
     
     ## 📝 Full Transcript
     [Full speech-to-text transcript]
     ```
   - frontmatter includes:
     - `source: 得到大脑（原Get笔记）直播转写`
     - `live_id`: Live ID
     - `speaker`: Speaker
     - `duration`: Duration
     - `audio_url`: Original audio URL (referenced only, not downloaded)
     - `tags: ["直播转写"]`

##### Attachment Handling

1. **Shared Attachment Directory**
   - Attachments from all channels are saved under `{getTarget}/get attachment/`
   - OpenAPI channel organizes subdirectories by noteId
   - e.g., `get/get attachment/7234567890/image-01.png`
   - *Note: In OpenAPI mode, the name of the folder for knowledge bases, blogger contents, live transcripts, or attachments can be fully customized in the settings tab.*

2. **Attachment Type Filtering**
   - Reuses configurations in "Attachment Import Settings"
   - Selectively import Images/Audio/Video/Documents

##### Progress and Error Handling

1. **Sync Progress Display**
   - Status bar displays: `Get Knowledge Base Sync: {Topic 1/N} - {Note 12/345}`
   - Or: `Get Blogger Sync: {Blogger 2/5} - {Content 8/30}`

2. **Error Handling**
   - Failure of a single topic/blogger does not affect others
   - Final summary displays: Success X / Failed Y
   - Failed items are detailed in sync history

3. **Cancel Sync**
   - The "Cancel" button can be clicked at any time during sync
   - Already written files are preserved, no rollbacks

##### Sync History

1. **View Historical Records**
   - Click "View Full History" in settings
   - Displays the last 20 sync records

2. **History Record Content**
   - Channel type: Personal Note / Knowledge Base / Blogger / Live
   - Time, duration, status
   - Created / Updated / Skipped / Failed counts
   - Error messages (if any)

##### Best Practices

**✅ Recommended**:
- Select a small number of knowledge bases to test for the first sync
- Regularly sync knowledge base and blogger content to keep local up to date
- Use the semantic search feature to quickly locate knowledge base contents
- Enable "Multi-level Directory Tree" to keep notes organized clearly

**⚠️ Notes**:
- Knowledge base and blogger sync do not support automatic scheduling (manual trigger only)
- The first sync performs a full overwrite and does not perform incremental pre-checks
- Blogger contents usually do not contain attachments
- Live audio files will not be downloaded, only URL references are preserved

### Data Management

#### Reset Sync History

If you need to completely re-import all notes:

1. Click "Reset Sync History" in settings
2. Confirm the action
3. Delete old note folders (such as `get/notes/`, `get/知识库/`, etc.)
4. Execute the sync again

> ⚠️ **Warning**: This action will clear all sync records, which may cause duplicate imports during next sync. Backing up important data beforehand is highly recommended.

#### Cleanup Legacy memo@ Notes

If your notes were imported using versions older than 3.3.0 and you upgraded without resetting sync history, you might have many files with `memo@` prefix naming style in your notes directory.

This plugin provides a one-click cleanup tool to help you safely migrate to the new unified naming convention (using the note title directly as the filename):

1. Open plugin settings → Scroll to the very bottom to find **Advanced Data Management**.
2. Click the **Scan and Clean** button under the "Cleanup Legacy memo@ Notes" section.
3. The system will automatically scan your local directory for legacy-prefixed notes and display a preview.
4. Confirm to safely move these outdated files to your system trash (safe, secure, and fully recoverable).

> 💡 **Tip**: Before running this cleanup, make sure you have executed a successful sync under the current version (using OpenAPI or ZIP channels) so that all your memos already have corresponding, standard-named markdown files created.


---

## 📂 File Structure

After sync, your vault will have:

```
Your Vault/
├── get/                              # Main folder (customizable)
│   ├── notes/                        # Personal notes (customizable)
│   │   ├── 2024-01-15/              # Grouped by date
│   │   │   ├── Meeting Notes.md
│   │   │   ├── Project Plan.md
│   │   │   ├── Meeting Notes (2).md  # Auto-suffix for duplicates
│   │   │   └── ...
│   │   └── ...
│   ├── 知识库/                       # Owned knowledge bases (OpenAPI)
│   │   ├── Frontend Learning/
│   │   │   ├── React Hooks Deep Dive.md
│   │   │   ├── Vue3 Reactivity.md
│   │   │   └── ...
│   │   └── ...
│   ├── 订阅知识库/                   # Subscribed knowledge bases (OpenAPI)
│   │   ├── Team Public/
│   │   │   ├── RAG Practice.md
│   │   │   └── ...
│   │   └── ...
│   ├── 订阅博主/                     # Subscribed bloggers (OpenAPI)
│   │   ├── Douyin_SomeBlogger/
│   │   │   ├── Talking about RAG.md
│   │   │   └── ...
│   │   ├── WeChat_AnotherBlogger/
│   │   │   └── ...
│   │   └── ...
│   ├── 直播课/                       # Live transcripts (OpenAPI)
│   │   ├── Frontend Architecture/
│   │   │   ├── From Monolith to Micro-frontends.md
│   │   │   └── ...
│   │   └── ...
│   ├── get attachment/              # Attachments (unified)
│   │   ├── 7234567890/             # OpenAPI: grouped by noteId
│   │   │   ├── image-01.png
│   │   │   ├── audio-01.mp3
│   │   │   └── ...
│   │   ├── abc123def.jpg           # ZIP channel: hash filename (flat)
│   │   └── ...
│   ├── _remote_deleted/            # Remote deletion archive (optional)
│   │   ├── 2024-01-15/
│   │   │   └── ...
│   │   └── ...
│   ├── Get Moments.md              # Timeline file (optional)
│   └── Get Canvas.canvas           # Canvas file (optional)
└── ...
```

**Directory Descriptions**:
- **notes/**: Personal notes, filenames use note titles directly (V3.3+ unified naming)
- **知识库/**: Owned knowledge base notes, organized by topics
- **订阅知识库/**: Subscribed external knowledge bases
- **订阅博主/**: Followed creator content, organized by `{platform}_{account}`
- **直播课/**: AI-transcribed live content
- **get attachment/**: Shared by all channels, OpenAPI uses subdirectories, ZIP uses flat files
- **_remote_deleted/**: Archive for remotely deleted notes (when archive policy enabled)

---

## 🔧 Development

### Local Development

```bash
# Clone repository
git clone https://github.com/springrain1/get-to-obsidian.git
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
│       ├── settings_tab.ts    # Native Settings Tab (V3.6.0+ Separation)
│       ├── semantic_search_view.ts # Semantic Search Sidebar (V3.4.0+ RAG)
│       ├── quota_status_view.ts # Quota Visual Status Panel (V3.7.0+ Quota)
│       ├── sync_history_ui.ts # Sync History Records UI
│       ├── manualsync_ui.ts   # Manual Import UI
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
2. Check network connection to 得到大脑（原Get笔记）
3. Manually complete login steps in browser
4. Wait 10-15 seconds, don't close browser

### No new notes after sync

**Possible reasons**:
1. No new notes in 得到大脑（原Get笔记）
2. Notes already synced (incremental sync)
3. Sync history issue

**Solution**:
1. Check 得到大脑（原Get笔记） website for new content
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

### Canvas or Moments not displaying

**Problem**: Visual files are generated after enabling, but they are empty.

**Solution**:
1. Verify that at least one note has been successfully imported.
2. Check if the file path settings are correct.
3. Try toggling the visualization options off and back on.
4. Delete the old Canvas/Moments files and sync again.

### Attachments not imported

**Problem**: Images, audio, or other attachments in notes are not imported.

**Possible reasons**:
1. The attachment type is not enabled in settings.
2. The attachment file is corrupted or path is invalid.
3. Insufficient disk space.

**Solution**:
1. Open plugin settings → Advanced Options → Attachment Import Settings.
2. Verify that the required attachment types are checked.
3. Check the console logs (`Ctrl/Cmd + Shift + I`) for specific errors.
4. Check remaining disk space.

**View Import Statistics**:
Upon sync completion, the console will display detailed attachment statistics:
```
Attachment stats - Total: 45, Images: 30, Audio: 10, Videos: 3, Documents: 2, Failed: 0
```

### Large file import failure or memory issues

**Problem**: Crashes or memory errors occur when importing large ZIP files.

**Solution**:
1. **Desktop**: The plugin automatically uses the raw file path, so memory is not an issue.
2. **Mobile**: The plugin automatically falls back to the streaming temporary file strategy, but ensure you have enough temporary storage space.
3. Check console logs to confirm the strategy used:
   - `使用直接路径策略` (Using direct path strategy) - Desktop optimized strategy (Best).
   - `使用临时文件回退策略` (Using temporary file fallback strategy) - True streaming write strategy.
4. If it still fails, try exporting and importing in smaller batches.
5. For local vaults, attachment copying uses native `fs.copyFile` for optimal performance.

### Upgrading from older versions

If you are upgrading from a 1.x version to 2.0+, the attachment path structure has changed:

**Option A: Clean Re-import (Recommended)**
1. Open plugin settings.
2. Click "Reset Sync History".
3. Delete old folders: `get/memos/` and `get picture/`.
4. Sync again.

**Option B: Keep Existing Memos**
1. Sync normally.
2. New memos will use the new attachment structure.
3. Old memos will keep their old paths.
4. Outcome: A mixed structure, but works without errors.

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

1. Search [Issues](https://github.com/springrain1/get-to-obsidian/issues)
2. If not found, [create new Issue](https://github.com/springrain1/get-to-obsidian/issues/new)

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
- Thanks to [得到大脑（原Get笔记）](https://www.biji.com/) for the note-taking service
- Thanks to the original project [jia6y/get-to-obsidian](https://github.com/jia6y/get-to-obsidian)
- Thanks to all contributors and users

---

## 📮 Contact

- **Author**: springrain | WeChat Official Account: 及时春雨
- **Project**: [https://github.com/springrain1/get-to-obsidian](https://github.com/springrain1/get-to-obsidian)
- **Issues**: [GitHub Issues](https://github.com/springrain1/get-to-obsidian/issues)
- **Discussions**: [GitHub Discussions](https://github.com/springrain1/get-to-obsidian/discussions)

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
