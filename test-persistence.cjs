'use strict';

const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');
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

const mainPath = path.resolve(process.env.STRATIFY_MAIN || './main.js');
const pluginModule = new Module(mainPath + '.cjs', module);
pluginModule.filename = mainPath + '.cjs';
pluginModule.paths = Module._nodeModulePaths(path.dirname(mainPath));
pluginModule._compile(fs.readFileSync(mainPath, 'utf8'), pluginModule.filename);
const Plugin = pluginModule.exports.default;
const plugin = Object.create(Plugin.prototype);
plugin.pluginSettings = {
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
let requestSaveCount = 0;
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
const view = Object.assign(new MockMarkdownView(), {
  file,
  editor,
  requestSave: () => {
    requestSaveCount += 1;
  },
});
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
    process: async (target, update) => {
      assert.strictEqual(target, file);
      diskValue = update(diskValue);
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
  overlay.ownerDocument = {
    defaultView: { requestAnimationFrame: (callback) => callback() },
  };
  view.contentEl = {
    querySelector: () => overlay,
    addClass: () => {},
    removeClass: () => {},
  };

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

  assert.strictEqual(writeCount, 0, 'an open mind map should not bypass the Editor API');
  assert.strictEqual(editorSetCount, 1, 'saving an open mind map should use one Editor API write');
  assert.strictEqual(requestSaveCount, 1, 'an Editor API write should request an Obsidian save');
  assert.notStrictEqual(diskValue, editorValue, 'the regression setup must retain stale disk content');

  const renderedContents = [];
  plugin._render = (targetOverlay, content) => renderedContents.push(content);
  editorReadCount = 0;
  vaultReadCount = 0;
  await plugin._doScan();
  assert.strictEqual(editorReadCount, 1, 'an open mindmap must scan the live editor buffer');
  assert.strictEqual(vaultReadCount, 0, 'an open mindmap must not scan stale disk content');
  assert.deepStrictEqual(renderedContents, [], 'stale disk content must not replace the newly rendered child');

  const persistedEditorValue = editorValue;
  sourceVisible = true;
  editorValue = persistedEditorValue.replace('Renamed Root', 'Source Root');
  await plugin._doScan();
  assert.strictEqual(editorReadCount, 2, 'source mode must scan the live editor buffer');
  assert.strictEqual(overlay._stratifyStaleContent, editorValue);
  sourceVisible = false;

  editorValue = persistedEditorValue;
  diskValue = editorValue;
  const reopenedFrontmatter = plugin._splitFrontmatter(diskValue).frontmatter;
  const reopenedMode = plugin._readStructureFromFrontmatter(reopenedFrontmatter);
  const reopenedParsed = plugin._parseStructured(diskValue, reopenedMode);
  const reopenedTree = plugin._buildTree(reopenedParsed, file.basename);
  assert.strictEqual(reopenedMode, 'list');
  assert.strictEqual(reopenedTree.tree.rawText, 'Renamed Root');
  assert.strictEqual(reopenedTree.tree.children.length, 1);
  assert.strictEqual(reopenedTree.tree.children[0].rawText, 'New Title');

  const beforeModeWrite = editorSetCount;
  const beforeModeSaveRequest = requestSaveCount;
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
  assert.strictEqual(editorSetCount, beforeModeWrite + 1, 'mode changes must persist as one complete editor write');
  assert.strictEqual(requestSaveCount, beforeModeSaveRequest + 1, 'mode changes must request an Obsidian save');
  assert.strictEqual(editorValue, headingContent);

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
