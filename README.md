# Stratify Mindmap

**English** | [简体中文](README_zh-CN.md)

Stratify Mindmap is a Markdown-native mind map plugin for Obsidian. It keeps the source readable on desktop and mobile while supporting structures deeper than Markdown's six heading levels.

The interface is deliberately compact: structure and layout stay in the main toolbar, common view controls use icons, and appearance/export options live in one menu.

## Highlights

- Mind maps deeper than six levels
- Heading, Hybrid, and List Markdown structure modes
- Automatic source-format detection when converting existing notes
- Direct node editing with Markdown write-back
- Pointer-based drag and drop across parents and sibling positions
- Arrow-key selection and keyboard restructuring
- Undo and redo for map operations
- Obsidian wikilinks, node collapse, multiple layouts, and PNG export
- Visual theme picker with curated categorical color palettes
- Configurable node font size and matching PNG export text
- Automatic wrapping for long labels and a more compact layout
- Source-only Markdown preservation indicators
- Desktop and mobile support

## Interface Preview

The images below are interface previews of the current Stratify layout.

### Mind Map Overview

![Stratify Mindmap desktop overview](https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/desktop-overview.png)

### Appearance and Export Menu

![Stratify Mindmap appearance and export menu](https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/appearance-menu.png)

### Mobile Toolbar

<img src="https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/mobile-toolbar.png" alt="Stratify Mindmap mobile toolbar and appearance menu" width="390">

## Markdown Structure Modes

| Mode | Source | Recommended use |
| --- | --- | --- |
| Heading | `#` through `######` | Short document-style maps up to six levels |
| Hybrid | Headings followed by nested lists | Deep maps that remain readable as documents |
| List | Nested Markdown lists | Compact mobile editing and unrestricted practical depth |

The selected mode is stored as `mindmap-structure`. When that field is missing, Stratify detects heading-only, heading-plus-list, or list-only content automatically.

```yaml
---
type: mindmap
mindmap-structure: hybrid
mindmap-layout: right
mindmap-theme: minimal
mindmap-line: curve
mindmap-node: rounded
---

# Project
## Research
### Sources
#### Review
##### Methods
###### Evidence
- Primary studies
  - Included papers
    - Detailed notes
```

## Markdown-only Content

Headings and list items become mind map nodes. Other Markdown, including ordinary paragraphs, blockquotes, code blocks, tables, and comments, remains in the source instead of being silently converted into nodes or comments.

Content before the first node is preserved as document-level source. Content after a node stays attached to that node. An orange marker on a node and the file-text icon in the toolbar indicate that source-only Markdown is present; selecting the toolbar icon opens the Markdown source.

Normal rendering, node editing, and structure-mode conversion preserve this content. Moving a node also moves its attached source block. Deleting that node deletes the attached block as part of the same undoable operation. A document containing only source-only content renders an empty-map state while leaving the Markdown unchanged.

## Editing

| Action | Gesture or shortcut |
| --- | --- |
| Select a node | Click or use plain arrow keys |
| Edit text | Double-click or `F2` |
| Add sibling | `Enter` |
| Add child | `Tab` |
| Delete | `Delete` or `Backspace` |
| Collapse or expand | `Space` |
| Reorder siblings | `Shift + ArrowUp/ArrowDown` |
| Promote | `Shift + Tab` or `Mod + ArrowLeft` |
| Demote | `Mod + ArrowRight` |
| Undo | `Mod + Z` |
| Redo | `Mod + Shift + Z` or `Mod + Y` |

Collapsed state is stored by wrapping the complete node label in single emphasis markers, for example `# *Deferred*`. A heading or list label written this way is therefore interpreted as a collapsed node.

Dragging onto the upper or lower part of a node inserts before or after it. Dropping on the outer edge of a leaf can make the dragged node its child; this behavior can be disabled in settings.

## Toolbar and Settings

The main toolbar keeps Mode, Layout, Fit, Zoom, and Edit Markdown available. The appearance menu shows every theme as a named row of color swatches, followed by connector style, node shape, and PNG export. Exported images are saved beside the source note as `<note-name>.mindmap.png`, on both desktop and mobile.

The Obsidian settings page controls defaults for new or unconfigured maps, the global node font size, keyboard navigation, and leaf-node drop behavior. Existing frontmatter is not overwritten by changing defaults.

## Create or Convert a Mind Map

- Use the ribbon command or command palette action **Convert current note to mind map**.
- Right-click a Markdown file and choose **Convert to Stratify mind map**.
- Right-click a folder and choose **Create Stratify mind map**.

Conversion adds the required frontmatter and detects the source structure without rewriting the note body.

## Installation

Until Stratify Mindmap is listed in Obsidian Community Plugins, install it from a GitHub release:

1. Create `<vault>/.obsidian/plugins/stratify-mindmap/`.
2. Download the release assets `main.js`, `manifest.json`, and `styles.css` and place them in that directory.
3. Reload Obsidian.
4. Enable **Stratify Mindmap** under **Settings -> Community plugins**.

Do not enable Stratify Mindmap and Light Mindmap/Light Mindmap Plus at the same time because they render the same `type: mindmap` notes.

## Migration from Light Mindmap

Existing notes remain compatible because Stratify keeps `type: mindmap` and the existing `mindmap-*` frontmatter fields. The plugin ID is different, so plugin-level settings are stored separately; copy or recreate those defaults once, then disable the old plugin.

## Compatibility

- Obsidian 1.8.7 or later
- macOS, Windows, Linux, iOS, and Android
- Obsidian Sync-compatible because map content remains Markdown

## Privacy and Network Use

Stratify Mindmap works locally and offline. It does not make network requests, collect telemetry, display ads, access files outside the current vault, or implement its own update mechanism. It reads and writes only mind map notes, PNG exports requested by the user, and its local plugin settings.

## Development

The repository contains TypeScript source in `src/`; the generated `main.js` is attached only to GitHub releases.

```bash
npm install
npm run check
```

`npm run check` runs the official Obsidian ESLint rules, regression tests, TypeScript validation, and the production build.

## Credits and License

Stratify Mindmap is an independent derivative of [Light Mindmap](https://github.com/ninglg/light-mindmap) by Light Ning. It retains the original copyright notice and is distributed under the MIT License.

The built-in categorical palettes reference [Paul Tol's color schemes](https://sronpersonalpages.nl/~pault/), [Tableau Classic palettes](https://help.tableau.com/current/pro/desktop/en-us/formatting_create_custom_colors.htm), and [ColorBrewer](https://colorbrewer2.org/).
