# Changelog

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
