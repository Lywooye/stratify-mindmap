# Changelog

## 1.1.10

- Moved the mobile toolbar below Obsidian's own top view controls instead of sharing the same row.
- Derived the offset from Obsidian's `--view-header-height` and the device safe area, with stable fallbacks.
- Kept the toolbar, canvas, and downward-opening options panel in normal layout flow.

## 1.1.9

- Kept the mobile toolbar at the top while moving its controls below iOS and Android display cutouts.
- Increased mobile controls to 44-pixel touch targets and kept Mode, Layout, Fit, Edit Markdown, and options in one row.
- Moved mobile zoom controls into the full-width options panel and changed source-only content to an edit-button status marker.
- Left the desktop toolbar unchanged.

## 1.1.5

- Fixed layout measurements after zooming and stopped wheel or button zoom from drifting at scale limits.
- Preserved the correct hierarchy for out-of-order headings and restricted rendered external links to safe protocols.
- Normalized CSS theme colors before PNG mixing so exports no longer darken unexpectedly.
- Cancelled pending scans, guarded in-flight unload work, and broke stale render cleanup chains.
- Added regression coverage for hierarchy, link protocols, zoom geometry, CSS colors, and unload races.

## 1.1.4

- Fixed newly added nodes and edited root labels reverting before Obsidian saved the active editor to disk.
- Made open mind maps read from the live Editor API and request a save after each structured edit.
- Added a delayed-disk regression test for Tab-created child persistence.

## 1.1.3

- Added reproducible TypeScript, npm, ESLint, CI, and GitHub Release tooling for Obsidian Community submission.
- Replaced direct active-note and Adapter API writes with the Editor, Vault, FileManager, and normalized-path APIs.
- Removed Electron and Node.js dependencies so PNG export behaves consistently on desktop and mobile.
- Replaced unsafe SVG `innerHTML`, global document assumptions, manual settings headings, and plugin-prefixed command IDs.
- Added explicit offline and privacy disclosures and stopped tracking generated `main.js` in the repository.

## 1.1.2

- Fixed newly created child nodes being immediately replaced on screen by a stale Markdown editor buffer.
- Kept source-mode edits responsive by reading the live editor only while the Markdown source is visible.

## 1.1.1

- Fixed Tab-created child nodes and edited root labels being lost when the active structure diverged from note frontmatter.
- Made structure-mode changes update the Markdown body and `mindmap-structure` frontmatter atomically.
- Added a safe parser fallback for notes whose declared structure does not contain any readable nodes.

## 1.1.0

- Replaced the original palettes with curated categorical schemes based on Paul Tol, Tableau Classic, ColorBrewer Paired, and a restrained dark palette.
- Replaced the Theme dropdown with a visual palette picker and added color previews to settings.
- Added a global node font-size slider with matching PNG export text sizing.
- Wrapped long node labels instead of truncating them and tightened node, branch, and canvas spacing.
- Added source-only Markdown indicators and preserved blank-line boundaries during parse/write-back round trips.

## 1.0.0

- Established the independent Stratify Mindmap plugin identity.
- Added the flat Minimal theme and made it the default.
- Reorganized the toolbar around primary controls, icon actions, and one appearance/export menu.
- Preserved deep Heading, Hybrid, and List structures and automatic format detection.
- Preserved direct editing, pointer drag and drop, keyboard navigation, undo, redo, settings, wikilinks, and PNG export.
- Namespaced commands, DOM state, and CSS to avoid styling conflicts with Light Mindmap installations.
