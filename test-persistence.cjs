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
const mockPlatform = { isMobile: false };

Module._load = function (request, parent, isMain) {
  if (request !== 'obsidian') return originalLoad.call(this, request, parent, isMain);
  return {
    Plugin: class {},
    PluginSettingTab: class {},
    MarkdownView: MockMarkdownView,
    Platform: mockPlatform,
    parseYaml,
    stringifyYaml,
  };
};

global.requestAnimationFrame = (callback) => callback();

const mainPath = path.resolve(process.env.STRATIFY_MAIN || './main.js');
if (!fs.existsSync(mainPath)) {
  console.error('main.js not found - run "npm run build" first (npm run check does this automatically).');
  process.exit(1);
}
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
  const overlayClasses = new Set();
  overlay.classList = {
    contains: (name) => (name === 'stratify-hidden' && sourceVisible) || overlayClasses.has(name),
    toggle: (name, force) => {
      if (force) overlayClasses.add(name);
      else overlayClasses.delete(name);
    },
  };
  overlay.dataset = {};
  overlay.ownerDocument = {
    defaultView: { requestAnimationFrame: (callback) => callback() },
  };
  const hostClasses = new Set();
  view.contentEl = {
    querySelector: () => overlay,
    addClass: (name) => hostClasses.add(name),
    removeClass: (name) => hostClasses.delete(name),
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
  mockPlatform.isMobile = true;
  await plugin._doScan();
  assert.ok(overlayClasses.has('stratify-mobile'), 'mobile scans must mark the overlay for touch-safe toolbar styles');
  mockPlatform.isMobile = false;
  assert.strictEqual(editorReadCount, 1, 'an open mindmap must scan the live editor buffer');
  assert.strictEqual(vaultReadCount, 0, 'an open mindmap must not scan stale disk content');
  assert.deepStrictEqual(renderedContents, [], 'stale disk content must not replace the newly rendered child');
  assert.ok(hostClasses.has('stratify-map-visible'), 'visible maps must hide the underlying Markdown pane');

  const persistedEditorValue = editorValue;
  sourceVisible = true;
  editorValue = persistedEditorValue.replace('Renamed Root', 'Source Root');
  await plugin._doScan();
  assert.strictEqual(editorReadCount, 2, 'source mode must scan the live editor buffer');
  assert.strictEqual(overlay._stratifyStaleContent, editorValue);
  assert.ok(!hostClasses.has('stratify-map-visible'), 'source mode must reveal the underlying Markdown pane');
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

  const oddParsed = plugin._parseStructured('## Details\n### Child\n# Title\n', 'heading');
  const oddTree = plugin._buildTree(oddParsed, 'F');
  assert.ok(oddTree.virtualRoot, 'out-of-order top levels must use a virtual root');
  assert.deepStrictEqual(oddTree.tree.children.map((node) => node.text), ['Details', 'Title']);
  assert.deepStrictEqual(oddTree.tree.children[0].children.map((node) => node.text), ['Child']);
  assert.strictEqual(
    plugin._serialize(oddParsed, oddTree, 'heading'),
    '# Details\n## Child\n# Title\n',
    'out-of-order headings should preserve hierarchy while normalizing levels'
  );

  assert.strictEqual(plugin._safeExternalHref('https://example.com'), 'https://example.com');
  assert.strictEqual(plugin._safeExternalHref(' HTTPS://example.com/path '), 'HTTPS://example.com/path');
  assert.strictEqual(plugin._safeExternalHref('obsidian://open?vault=Test'), 'obsidian://open?vault=Test');
  assert.strictEqual(plugin._safeExternalHref('javascript:alert(1)'), null);
  assert.strictEqual(plugin._safeExternalHref('data:text/html,unsafe'), null);
  assert.strictEqual(plugin._safeExternalHref('Notes/Target.md'), null);

  const measuredChild = {
    _el: { getBoundingClientRect: () => ({ width: 120, height: 60 }) },
    children: [],
    collapsed: false,
  };
  const measuredRoot = {
    _el: { getBoundingClientRect: () => ({ width: 200, height: 80 }) },
    children: [measuredChild],
    collapsed: false,
  };
  plugin._measureNodes(measuredRoot, 2);
  assert.deepStrictEqual([measuredRoot.width, measuredRoot.height], [100, 40]);
  assert.deepStrictEqual([measuredChild.width, measuredChild.height], [60, 30]);

  const zoomInner = { style: {} };
  const zoomCanvas = { _stratify: { tx: 100, ty: 70, scale: 3 }, clientWidth: 400, clientHeight: 300 };
  plugin._zoomBy(zoomCanvas, zoomInner, 1.2);
  assert.deepStrictEqual(zoomCanvas._stratify, { tx: 100, ty: 70, scale: 3 });
  zoomCanvas._stratify = { tx: -20, ty: -10, scale: 0.2 };
  plugin._zoomBy(zoomCanvas, zoomInner, 1 / 1.2);
  assert.deepStrictEqual(zoomCanvas._stratify, { tx: -20, ty: -10, scale: 0.2 });
  zoomCanvas._stratify = { tx: 0, ty: 0, scale: 1 };
  plugin._zoomBy(zoomCanvas, zoomInner, 2);
  assert.deepStrictEqual(zoomCanvas._stratify, { tx: -200, ty: -150, scale: 2 });

  const fitInner = { style: { width: '800px', height: '400px' } };
  const fitCanvas = {
    _stratify: { tx: 12, ty: 18, scale: 0.75 },
    clientWidth: 0,
    clientHeight: 0,
  };
  assert.strictEqual(plugin._fitTo(fitCanvas, fitInner), false);
  assert.deepStrictEqual(
    fitCanvas._stratify,
    { tx: 12, ty: 18, scale: 0.75 },
    'a hidden startup canvas must not overwrite its transform with a zero scale'
  );
  fitCanvas.clientWidth = 1000;
  fitCanvas.clientHeight = 600;
  assert.strictEqual(plugin._fitTo(fitCanvas, fitInner), true);
  assert.deepStrictEqual(fitCanvas._stratify, { tx: 100, ty: 100, scale: 1 });

  const geometryFrames = new Map();
  let nextGeometryFrame = 1;
  let geometryObserverCallback = null;
  let geometryObserverDisconnected = false;
  const geometryWindow = {
    requestAnimationFrame: (callback) => {
      const id = nextGeometryFrame++;
      geometryFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => geometryFrames.delete(id),
    ResizeObserver: class {
      constructor(callback) {
        geometryObserverCallback = callback;
      }
      observe() {}
      disconnect() {
        geometryObserverDisconnected = true;
      }
    },
  };
  const flushGeometryFrames = () => {
    const pending = Array.from(geometryFrames.values());
    geometryFrames.clear();
    pending.forEach((callback) => callback());
  };
  const geometryCanvas = {
    _stratify: { tx: 0, ty: 0, scale: 1 },
    clientWidth: 0,
    clientHeight: 0,
    ownerDocument: { defaultView: geometryWindow },
  };
  const geometryInner = { style: { width: '800px', height: '400px' } };
  const geometryOverlay = {
    _stratifyCanvas: geometryCanvas,
    _stratifyInner: geometryInner,
    _stratifyLayoutReady: false,
    _stratifyRenderPending: false,
    _stratifyPendingPreserveTransform: false,
    _stratifyUserTransformed: false,
    _stratifyCleanup: null,
  };
  const originalRenderTreeIntoCanvas = plugin._renderTreeIntoCanvas;
  const originalFitTo = plugin._fitTo;
  const geometryRenders = [];
  let geometryFits = 0;
  plugin._renderTreeIntoCanvas = (target, preserveTransform) => {
    geometryRenders.push([target, preserveTransform]);
  };
  plugin._fitTo = () => {
    geometryFits += 1;
    return true;
  };
  plugin._bindCanvasGeometry(geometryCanvas, geometryInner, geometryOverlay);
  assert.ok(geometryObserverCallback, 'canvas geometry recovery must observe restored tabs');

  geometryObserverCallback();
  flushGeometryFrames();
  assert.strictEqual(geometryRenders.length, 0, 'a hidden canvas must wait for a usable size');

  geometryCanvas.clientWidth = 900;
  geometryCanvas.clientHeight = 600;
  geometryObserverCallback();
  flushGeometryFrames();
  assert.deepStrictEqual(
    geometryRenders,
    [[geometryOverlay, false]],
    'a restored background tab must rerender once its canvas becomes visible'
  );

  geometryOverlay._stratifyLayoutReady = true;
  geometryCanvas.clientWidth = 1000;
  geometryObserverCallback();
  flushGeometryFrames();
  assert.strictEqual(geometryFits, 1, 'an untouched map must refit after startup geometry settles');

  geometryOverlay._stratifyUserTransformed = true;
  geometryCanvas.clientWidth = 1100;
  geometryObserverCallback();
  flushGeometryFrames();
  assert.strictEqual(geometryFits, 1, 'geometry recovery must not override a user transform');

  geometryOverlay._stratifyCleanup();
  assert.ok(geometryObserverDisconnected, 'render cleanup must disconnect the canvas observer');
  plugin._renderTreeIntoCanvas = originalRenderTreeIntoCanvas;
  plugin._fitTo = originalFitTo;

  assert.deepStrictEqual(plugin._hexToRgb('rgb(255, 255, 255)'), [255, 255, 255]);
  assert.deepStrictEqual(plugin._hexToRgb('rgba(12, 34, 56, 0.5)'), [12, 34, 56]);
  assert.deepStrictEqual(plugin._hexToRgb('#abc'), [170, 187, 204]);
  assert.strictEqual(plugin._mixColors('#FF0000', 'rgb(255,255,255)', 0.5), 'rgb(255,128,128)');

  const getLeavesOfType = plugin.app.workspace.getLeavesOfType;
  let unloadedScanCount = 0;
  plugin.app.workspace.getLeavesOfType = () => {
    unloadedScanCount += 1;
    return [];
  };
  plugin._unloading = true;
  await plugin._doScan();
  assert.strictEqual(unloadedScanCount, 0, 'an unloaded plugin must not start another scan');
  plugin._unloading = false;
  plugin.app.workspace.getLeavesOfType = getLeavesOfType;

  const cachedRead = plugin.app.vault.cachedRead;
  let resolveDelayedRead;
  let overlayCreateCount = 0;
  const delayedView = Object.assign(new MockMarkdownView(), {
    file,
    editor: null,
    contentEl: {
      addClass: () => {},
      querySelector: () => null,
      createDiv: () => {
        overlayCreateCount += 1;
        return {};
      },
    },
  });
  plugin.app.workspace.getLeavesOfType = () => [{ view: delayedView }];
  plugin.app.vault.cachedRead = () => new Promise((resolve) => {
    resolveDelayedRead = resolve;
  });
  const delayedScan = plugin._doScan();
  await Promise.resolve();
  assert.ok(resolveDelayedRead, 'the delayed scan should reach the asynchronous file read');
  plugin._unloading = true;
  resolveDelayedRead(editorValue);
  await delayedScan;
  assert.strictEqual(overlayCreateCount, 0, 'an in-flight scan must not recreate an overlay after unload');
  plugin._unloading = false;
  plugin.app.workspace.getLeavesOfType = getLeavesOfType;
  plugin.app.vault.cachedRead = cachedRead;

  const styles = fs.readFileSync(path.resolve('./styles.css'), 'utf8');
  assert.match(styles, /--stratify-safe-top:[^;]*safe-area-inset-top/);
  assert.match(styles, /--stratify-mobile-toolbar-offset:[^;]*--view-header-height/s);
  assert.match(styles, /margin-top: var\(--stratify-mobile-toolbar-offset\)/);
  assert.match(styles, /\.stratify-overlay\.stratify-mobile \.stratify-icon-btn\s*\{[^}]*width: 44px/s);
  assert.match(styles, /\.stratify-overlay\.stratify-mobile \.stratify-more-panel\s*\{[^}]*left:/s);

  console.log('Persistence, rendering, lifecycle, and mobile toolbar tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
