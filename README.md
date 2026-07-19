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
- Flat Minimal theme that follows Obsidian light and dark appearance
- Desktop and mobile support

## Interface Preview

The images below are interface previews of the current Stratify layout.

### Mind Map Overview

![Stratify Mindmap desktop overview](assets/desktop-overview.png)

### Appearance and Export Menu

![Stratify Mindmap appearance and export menu](assets/appearance-menu.png)

### Mobile Toolbar

<img src="assets/mobile-toolbar.png" alt="Stratify Mindmap mobile toolbar and appearance menu" width="390">

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

Dragging onto the upper or lower part of a node inserts before or after it. Dropping on the outer edge of a leaf can make the dragged node its child; this behavior can be disabled in settings.

## Toolbar and Settings

The main toolbar keeps Mode, Layout, Fit, Zoom, and Edit Markdown available. Theme, connector style, node shape, and PNG export are grouped under the appearance menu.

The Obsidian settings page controls defaults for new or unconfigured maps, keyboard navigation, and leaf-node drop behavior. Existing frontmatter is not overwritten by changing defaults.

## Create or Convert a Mind Map

- Use the ribbon command or command palette action **Convert current note to Stratify mindmap**.
- Right-click a Markdown file and choose **Convert to Stratify mindmap**.
- Right-click a folder and choose **Create Stratify mindmap**.

Conversion adds the required frontmatter and detects the source structure without rewriting the note body.

## Installation

Stratify Mindmap is currently installed manually and is not yet listed in Obsidian Community Plugins.

1. Create `<vault>/.obsidian/plugins/stratify-mindmap/`.
2. Place `main.js`, `manifest.json`, and `styles.css` in that directory.
3. Reload Obsidian.
4. Enable **Stratify Mindmap** under **Settings -> Community plugins**.

Do not enable Stratify Mindmap and Light Mindmap/Light Mindmap Plus at the same time because they render the same `type: mindmap` notes.

## Migration from Light Mindmap

Existing notes remain compatible because Stratify keeps `type: mindmap` and the existing `mindmap-*` frontmatter fields. The plugin ID is different, so plugin-level settings are stored separately; copy or recreate those defaults once, then disable the old plugin.

## Compatibility

- Obsidian 1.4.0 or later
- macOS, Windows, Linux, iOS, and Android
- Obsidian Sync-compatible because map content remains Markdown

## Credits and License

Stratify Mindmap is an independent derivative of [Light Mindmap](https://github.com/ninglg/light-mindmap) by Light Ning. It retains the original copyright notice and is distributed under the MIT License.
