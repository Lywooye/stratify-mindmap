'use strict';

const assert = require('assert');
const Module = require('module');
const originalLoad = Module._load;

function parseYaml(source) {
  const result = {};
  for (const line of String(source || '').split(/\r?\n/)) {
    const match = line.match(/^([^:#]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1].trim()] = match[2].trim();
  }
  return result;
}

function stringifyYaml(value) {
  return Object.entries(value || {}).map(([key, item]) => key + ': ' + item).join('\n') + '\n';
}

class MockMarkdownView {}

Module._load = function (request, parent, isMain) {
  if (request !== 'obsidian') return originalLoad.call(this, request, parent, isMain);
  return {
    Plugin: class {},
    PluginSettingTab: class {},
    MarkdownView: MockMarkdownView,
    parseYaml,
    stringifyYaml,
  };
};

global.requestAnimationFrame = (callback) => callback();

const Plugin = require(process.env.STRATIFY_MAIN || './main.js');
const plugin = Object.create(Plugin.prototype);
plugin.settings = {
  defaultStructure: 'list',
  defaultLayout: 'right',
  defaultTheme: 'minimal',
  defaultLine: 'curve',
  defaultNodeStyle: 'rounded',
  nodeFontSize: 13,
};
plugin._renderTreeIntoCanvas = () => {};

const file = { path: 'Maps/New Mindmap.md', basename: 'New Mindmap' };
let editorValue = plugin._newMindmapContent();
let diskValue = editorValue;
let writeCount = 0;
let editorSetCount = 0;
let editorReadCount = 0;
let vaultReadCount = 0;
const editor = {
  getValue: () => {
    editorReadCount += 1;
    return editorValue;
  },
  setValue: (value) => {
    editorValue = value;
    editorSetCount += 1;
  },
};
const view = Object.assign(new MockMarkdownView(), { file, editor });
plugin.app = {
  workspace: { getLeavesOfType: () => [{ view }] },
  metadataCache: {
    getFileCache: () => ({ frontmatter: { type: 'mindmap', 'mindmap-structure': 'list' } }),
  },
  vault: {
    cachedRead: async (target) => {
      assert.strictEqual(target, file);
      vaultReadCount += 1;
      return diskValue;
    },
    modify: async (target, value) => {
      assert.strictEqual(target, file);
      diskValue = value;
      writeCount += 1;
    },
  },
};

async function run() {
  const parsed = plugin._parseStructured(editorValue, 'list');
  const treeInfo = plugin._buildTree(parsed, file.basename);
  const overlay = {
    _stratifyFile: file,
    _stratifyView: view,
    _stratifyParsed: parsed,
    _stratifyTreeInfo: treeInfo,
    _stratifyStructure: 'list',
    _stratifySelected: null,
    _stratifyPendingEdit: null,
  };
  let sourceVisible = false;
  overlay.classList = {
    contains: (name) => name === 'stratify-hidden' && sourceVisible,
  };
  overlay.dataset = {};
  view.contentEl = { querySelector: () => overlay };

  const undoSnapshot = plugin._currentMindmapContent(overlay);
  plugin._updateNodeText(treeInfo.tree, 'Renamed Root');
  const persistAndRelayout = plugin._persistAndRelayout.bind(plugin);
  let pendingPersist = null;
  plugin._persistAndRelayout = (targetOverlay) => {
    pendingPersist = persistAndRelayout(targetOverlay);
    return pendingPersist;
  };
  plugin._addChild(overlay, treeInfo.tree, true, undoSnapshot);
  await pendingPersist;

  assert.strictEqual(writeCount, 1);
  assert.strictEqual(editorSetCount, 0, 'saving should keep Light Mindmap\'s single vault write behavior');

  const renderedContents = [];
  plugin._render = (targetOverlay, content) => renderedContents.push(content);
  editorReadCount = 0;
  vaultReadCount = 0;
  await plugin._doScan();
  assert.strictEqual(vaultReadCount, 1, 'a visible mindmap must scan the saved vault content');
  assert.strictEqual(editorReadCount, 0, 'a visible mindmap must not scan a stale editor buffer');
  assert.deepStrictEqual(renderedContents, [], 'a stale editor buffer must not replace the newly rendered child');

  sourceVisible = true;
  editorValue = diskValue.replace('Renamed Root', 'Source Root');
  await plugin._doScan();
  assert.strictEqual(editorReadCount, 1, 'source mode must scan the live editor buffer');
  assert.strictEqual(overlay._stratifyStaleContent, editorValue);
  sourceVisible = false;

  const reopenedFrontmatter = plugin._splitFrontmatter(diskValue).frontmatter;
  const reopenedMode = plugin._readStructureFromFrontmatter(reopenedFrontmatter);
  const reopenedParsed = plugin._parseStructured(diskValue, reopenedMode);
  const reopenedTree = plugin._buildTree(reopenedParsed, file.basename);
  assert.strictEqual(reopenedMode, 'list');
  assert.strictEqual(reopenedTree.tree.rawText, 'Renamed Root');
  assert.strictEqual(reopenedTree.tree.children.length, 1);
  assert.strictEqual(reopenedTree.tree.children[0].rawText, 'New Title');

  const beforeModeWrite = writeCount;
  const headingContent = plugin._serializeMindmap(
    overlay._stratifyParsed,
    overlay._stratifyTreeInfo,
    'heading'
  );
  assert.strictEqual(plugin._readStructureFromFrontmatter(plugin._splitFrontmatter(headingContent).frontmatter), 'heading');
  assert.match(plugin._splitFrontmatter(headingContent).body, /^\n?# Renamed Root\n## New Title\n$/);
  overlay._stratifyWriting = true;
  await plugin._writeMindmapContent(overlay, headingContent);
  overlay._stratifyWriting = false;
  assert.strictEqual(writeCount, beforeModeWrite + 1, 'mode changes must persist as one complete write');
  assert.strictEqual(diskValue, headingContent);

  const broken = headingContent.replace('mindmap-structure: heading', 'mindmap-structure: list');
  const brokenFrontmatter = plugin._splitFrontmatter(broken).frontmatter;
  assert.strictEqual(plugin._parseStructured(broken, 'list').headings.length, 0);
  assert.strictEqual(plugin._resolveStructure(brokenFrontmatter, broken), 'heading');
  assert.strictEqual(plugin._parseStructured(broken, plugin._resolveStructure(brokenFrontmatter, broken)).headings.length, 2);

  console.log('Tab display, persistence, reopen, atomic mode, and mismatch recovery tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
