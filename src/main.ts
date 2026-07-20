import * as obsidian from 'obsidian';

type ThemeId = 'minimal' | 'vibrant' | 'classic' | 'fresh' | 'ocean' | 'sunset' | 'midnight' | 'slate';
type LineStyleId = 'curve' | 'straight' | 'polyline' | 'polyline-dashed' | 'curve-dashed';
type NodeStyleId = 'rounded' | 'square' | 'borderless' | 'circle' | 'doodle';
type StructureMode = 'heading' | 'hybrid' | 'list';
type LayoutId = 'balanced' | 'right' | 'left' | 'tree' | 'radial';
type DropAction = 'before' | 'after' | 'child';
type BranchSide = 'left' | 'right';
type NodeSide = BranchSide | 'root';

interface ThemeDefinition {
  name: string;
  description: string;
  palette: string[];
  rootFill: string;
  bg: string | null;
  fg: string | null;
  rootAccent: string;
}

interface LineStyleDefinition {
  name: string;
  shape: 'curve' | 'straight' | 'polyline';
  dash: string | null;
}

interface NamedOption {
  name: string;
}

interface PluginSettings {
  defaultStructure: StructureMode;
  defaultLayout: LayoutId;
  defaultTheme: ThemeId;
  defaultLine: LineStyleId;
  defaultNodeStyle: NodeStyleId;
  nodeFontSize: number;
  keyboardNavigation: boolean;
  leafOutsideDropCreatesChild: boolean;
}

type PluginSettingKey = keyof PluginSettings;
type DropdownSettingKey = 'defaultStructure' | 'defaultLayout' | 'defaultLine' | 'defaultNodeStyle';
type Frontmatter = Record<string, unknown>;

interface MindmapNode {
  srcIdx?: number;
  kind?: 'heading' | 'list';
  level: number;
  rawText: string;
  text: string;
  children: MindmapNode[];
  parent: MindmapNode | null;
  bodyRaw: string;
  dirty: boolean;
  isNew: boolean;
  collapsed: boolean;
  isVirtual?: boolean;
  color: string;
  depth: number;
  width: number;
  height: number;
  x: number;
  y: number;
  _sth: number;
  _stw: number;
  _side?: NodeSide;
  _el?: StratifyNodeElement;
}

interface ParsedMindmap {
  frontmatterRaw: string;
  preBody: string;
  headings: MindmapNode[];
  structureMode: StructureMode;
}

interface TreeInfo {
  tree: MindmapNode | null;
  virtualRoot: boolean;
  baseLevel: number;
}

interface FrontmatterSplit {
  frontmatterRaw: string;
  frontmatter: Frontmatter | null;
  body: string;
}

interface CanvasTransform {
  tx: number;
  ty: number;
  scale: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface SideCacheEntry {
  text: string;
  side: BranchSide;
}

interface MentionState {
  popup: HTMLDivElement;
  index: number;
  items: obsidian.TFile[];
}

interface MentionQuery {
  query: string;
  openIdx: number;
}

interface NodeLink {
  start: number;
  end: number;
  type: 'md' | 'wiki';
  text: string;
  target: string;
}

interface StratifyNodeElement extends HTMLDivElement {
  _stratifyNode?: MindmapNode;
}

interface StratifyCanvasElement extends HTMLDivElement {
  _stratify: CanvasTransform;
}

interface NodePointerDrag {
  overlay: StratifyOverlayElement;
  node: MindmapNode;
  sourceEl: StratifyNodeElement;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  active: boolean;
  ghost: HTMLElement | null;
  frame: number | null;
  target: MindmapNode | null;
  action: DropAction | null;
  cleanup: (() => void) | null;
  ownerWindow: Window;
}

interface StratifyOverlayElement extends HTMLDivElement {
  _stratifyCanvas?: StratifyCanvasElement | null;
  _stratifyCleanup?: (() => void) | null;
  _stratifyDragNode?: MindmapNode | null;
  _stratifyEditSnapshot?: string | null;
  _stratifyEditingBlur?: (() => void) | null;
  _stratifyEditingNode?: MindmapNode | null;
  _stratifyFile?: obsidian.TFile | null;
  _stratifyFrontmatter?: Frontmatter | null;
  _stratifyInner?: HTMLDivElement | null;
  _stratifyLastContent?: string | null;
  _stratifyLayout?: LayoutId | null;
  _stratifyLine?: LineStyleId | null;
  _stratifyMention?: MentionState | null;
  _stratifyMentionInput?: (() => void) | null;
  _stratifyNeedsRerender?: boolean;
  _stratifyNodeStyle?: NodeStyleId | null;
  _stratifyNodesLayer?: HTMLDivElement | null;
  _stratifyParsed?: ParsedMindmap | null;
  _stratifyPendingEdit?: MindmapNode | null;
  _stratifyPointerDrag?: NodePointerDrag | null;
  _stratifyRedoStack?: string[];
  _stratifySelected?: MindmapNode | null;
  _stratifySideCache?: SideCacheEntry[] | null;
  _stratifyStaleContent?: string;
  _stratifyStaleFm?: Frontmatter | null;
  _stratifyStaleName?: string;
  _stratifyStructure?: StructureMode | null;
  _stratifySuppressNodeClick?: boolean;
  _stratifySvg?: SVGSVGElement | null;
  _stratifyTheme?: ThemeId | null;
  _stratifyTreeInfo?: TreeInfo | null;
  _stratifyUndoStack?: string[];
  _stratifyView?: obsidian.MarkdownView | null;
  _stratifyWriting?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  return 'Unknown error';
}

function objectKeys<T extends object>(value: T): Array<keyof T> {
  return Object.keys(value) as Array<keyof T>;
}

function hasOwn<T extends object>(value: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(value, key) === true;
}

// Categorical branch palettes adapted from Paul Tol, Tableau, and ColorBrewer.
const THEMES: Record<ThemeId, ThemeDefinition> = {
  minimal: {
    name: 'Obsidian Neutral',
    description: 'Muted branches on the current Obsidian background.',
    palette: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499'],
    rootFill: '#3F5360',
    bg: null, fg: null,
    rootAccent: '#526D7A'
  },
  vibrant: {
    name: 'Tol Vibrant',
    description: 'High-contrast, color-blind-safe categorical colors.',
    palette: ['#0077BB', '#33BBEE', '#009988', '#EE7733', '#CC3311', '#EE3377', '#BBBBBB'],
    rootFill: '#005A8D',
    bg: '#FFFFFF', fg: '#20242A',
    rootAccent: '#0077BB'
  },
  classic: {
    name: 'Tableau Classic',
    description: 'The familiar Tableau Classic 10 categorical palette.',
    palette: ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF'],
    rootFill: '#355C7D',
    bg: '#FFFFFF', fg: '#20242A',
    rootAccent: '#1F77B4'
  },
  fresh: {
    name: 'Tol Light',
    description: 'Soft, readable colors for larger filled areas.',
    palette: ['#77AADD', '#99DDFF', '#44BB99', '#BBCC33', '#AAAA00', '#EEDD88', '#EE8866', '#FFAABB'],
    rootFill: '#276C60',
    bg: '#FAFCFB', fg: '#172521',
    rootAccent: '#2A7A68'
  },
  ocean: {
    name: 'ColorBrewer Paired',
    description: 'Paired light and dark hues for related branches.',
    palette: ['#1F78B4', '#A6CEE3', '#33A02C', '#B2DF8A', '#E31A1C', '#FB9A99', '#FF7F00', '#FDBF6F', '#6A3D9A', '#CAB2D6'],
    rootFill: '#3F5D7D',
    bg: '#FAFCFF', fg: '#17202A',
    rootAccent: '#1F78B4'
  },
  sunset: {
    name: 'Tol Medium Contrast',
    description: 'Print-friendly warm and cool contrast pairs.',
    palette: ['#EECC66', '#EE99AA', '#6699CC', '#997700', '#994455', '#004488'],
    rootFill: '#6B3F56',
    bg: '#FFFCF8', fg: '#2C2024',
    rootAccent: '#994455'
  },
  midnight: {
    name: 'Midnight Bright',
    description: 'Color-blind-safe bright branches on a dark canvas.',
    palette: ['#66CCEE', '#228833', '#CCBB44', '#EE6677', '#AA3377', '#4477AA', '#BBBBBB'],
    rootFill: '#315A7D',
    bg: '#151922', fg: '#E9EEF5',
    rootAccent: '#66CCEE'
  },
  slate: {
    name: 'Nordic Dark',
    description: 'A restrained dark palette with cool and warm accents.',
    palette: ['#88C0D0', '#81A1C1', '#5E81AC', '#A3BE8C', '#EBCB8B', '#D08770', '#BF616A', '#B48EAD'],
    rootFill: '#46566D',
    bg: '#252A33', fg: '#E1E6EC',
    rootAccent: '#88C0D0'
  }
};

const DEFAULT_THEME: ThemeId = 'minimal';

const LINE_STYLES: Record<LineStyleId, LineStyleDefinition> = {
  curve: { name: 'Smooth', shape: 'curve', dash: null },
  straight: { name: 'Straight', shape: 'straight', dash: null },
  polyline: { name: 'Right Angle', shape: 'polyline', dash: null },
  'polyline-dashed': { name: 'Right Angle Dashed', shape: 'polyline', dash: '6 4' },
  'curve-dashed': { name: 'Smooth Dashed', shape: 'curve', dash: '6 4' }
};

const DEFAULT_LINE: LineStyleId = 'curve';

const NODE_STYLES: Record<NodeStyleId, NamedOption> = {
  rounded: { name: 'Rounded' },
  square: { name: 'Square' },
  borderless: { name: 'Borderless' },
  circle: { name: 'Pill' },
  doodle: { name: 'Doodle' }
};

const DEFAULT_NODE_STYLE: NodeStyleId = 'rounded';

const STRUCTURE_MODES: Record<StructureMode, NamedOption> = {
  heading: { name: 'Heading' },
  hybrid: { name: 'Hybrid' },
  list: { name: 'List' }
};

const DEFAULT_STRUCTURE: StructureMode = 'hybrid';

const DEFAULT_LAYOUT: LayoutId = 'balanced';

const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  defaultStructure: DEFAULT_STRUCTURE,
  defaultLayout: DEFAULT_LAYOUT,
  defaultTheme: DEFAULT_THEME,
  defaultLine: DEFAULT_LINE,
  defaultNodeStyle: DEFAULT_NODE_STYLE,
  nodeFontSize: 13,
  keyboardNavigation: true,
  leafOutsideDropCreatesChild: true,
};

const MIN_NODE_FONT_SIZE = 11;
const MAX_NODE_FONT_SIZE = 18;
const HGAP = 48;
const VGAP = 10;
const ROOT_HGAP = 68;
const PAD = 40;
const PLACEHOLDER = 'New Title';

class StratifyMindmapPlugin extends obsidian.Plugin {
  pluginSettings: PluginSettings = { ...DEFAULT_PLUGIN_SETTINGS };
  _scan!: obsidian.Debouncer<[], Promise<void>>;
  _unloading = false;
  _fileCache: obsidian.TFile[] | null = null;
  _fileCacheTime = 0;

  async onload(): Promise<void> {
    this._unloading = false;
    await this.loadSettings();
    this._scan = obsidian.debounce(() => this._doScan(), 120);
    this._fileCache = null;
    this._fileCacheTime = 0;

    this.addSettingTab(new StratifyMindmapSettingTab(this.app, this));

    this.registerEvent(this.app.workspace.on('file-open', () => this._scan()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this._scan()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this._scan()));
    this.registerEvent(this.app.workspace.on('editor-change', () => this._scan()));
    this.registerEvent(this.app.metadataCache.on('changed', () => this._scan()));

    this.addRibbonIcon('network', 'Convert current note to mind map', () => {
      void this._convertActiveFileToMindmap();
    });

    this.addCommand({
      id: 'convert-current-note',
      name: 'Convert current note to mind map',
      callback: () => void this._convertActiveFileToMindmap()
    });

    this.addCommand({
      id: 'toggle-source',
      name: 'Toggle mind map and source view',
      callback: () => {
        const v = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!v) return;
        const o = v.contentEl.querySelector<StratifyOverlayElement>(':scope > .stratify-overlay');
        if (!o) return;
        if (o.classList.contains('stratify-hidden')) {
          o.classList.remove('stratify-hidden');
          v.contentEl.addClass('stratify-map-visible');
          this._removeRestoreFab(v);
        } else {
          o.classList.add('stratify-hidden');
          v.contentEl.removeClass('stratify-map-visible');
          this._showRestoreFab(v, o);
        }
      }
    });

    this.addCommand({
      id: 'cycle-layout',
      name: 'Cycle mind map layout',
      callback: () => {
        const v = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!v) return;
        const o = v.contentEl.querySelector<StratifyOverlayElement>(':scope > .stratify-overlay');
        if (!o) return;
        const layouts: LayoutId[] = ['balanced', 'right', 'left', 'tree', 'radial'];
        const cur = o._stratifyLayout || 'balanced';
        const next = layouts[(layouts.indexOf(cur) + 1) % layouts.length];
        o._stratifyLayout = next;
        if (o._stratifyTreeInfo) this._renderTreeIntoCanvas(o, false);
        void this._persistFrontmatterValue(o._stratifyFile, 'mindmap-layout', next);
      }
    });

    // Right-click menu: create new mindmap file in folder
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      const zh = this._isZh();
      if (file instanceof obsidian.TFolder) {
        menu.addItem((item) => {
          const title = zh ? '新建 Stratify 导图' : 'Create Stratify mind map';
          item
            .setTitle(title)
            .setIcon('network')
            .onClick(async () => {
              const base = 'New Mindmap';
              let name = base + '.md';
              let i = 1;
              while (this.app.vault.getAbstractFileByPath(file.path + '/' + name)) {
                name = base + ' ' + (++i) + '.md';
              }
              const content = this._newMindmapContent();
              const created = await this.app.vault.create(file.path + '/' + name, content);
              await this.app.workspace.openLinkText(created.path, '', true);
            });
        });
      } else if (file instanceof obsidian.TFile && file.extension === 'md') {
        menu.addItem((item) => {
          const title = zh ? '转换为 Stratify 导图' : 'Convert to Stratify mind map';
          item
            .setTitle(title)
            .setIcon('network')
            .onClick(() => void this._convertFileToMindmap(file, true));
        });
      }
    }));

    this.app.workspace.onLayoutReady(() => {
      if (!this._unloading) void this._doScan();
    });

    // Inject SVG filter for doodle node style
    this._injectDoodleFilter();
  }

  async loadSettings(): Promise<void> {
    const data: unknown = await this.loadData();
    this.pluginSettings = { ...DEFAULT_PLUGIN_SETTINGS };
    if (isRecord(data)) {
      const structure = this._normalizeStructureMode(data.defaultStructure);
      const layout = this._normalizeLayout(data.defaultLayout);
      const theme = typeof data.defaultTheme === 'string' && hasOwn(THEMES, data.defaultTheme)
        ? data.defaultTheme
        : null;
      const line = typeof data.defaultLine === 'string' && hasOwn(LINE_STYLES, data.defaultLine)
        ? data.defaultLine
        : null;
      const nodeStyle = typeof data.defaultNodeStyle === 'string' && hasOwn(NODE_STYLES, data.defaultNodeStyle)
        ? data.defaultNodeStyle
        : null;
      this.pluginSettings.defaultStructure = structure || DEFAULT_STRUCTURE;
      this.pluginSettings.defaultLayout = layout || DEFAULT_LAYOUT;
      this.pluginSettings.defaultTheme = theme || DEFAULT_THEME;
      this.pluginSettings.defaultLine = line || DEFAULT_LINE;
      this.pluginSettings.defaultNodeStyle = nodeStyle || DEFAULT_NODE_STYLE;
      this.pluginSettings.nodeFontSize = Number(data.nodeFontSize);
      this.pluginSettings.keyboardNavigation = data.keyboardNavigation !== false;
      this.pluginSettings.leafOutsideDropCreatesChild = data.leafOutsideDropCreatesChild !== false;
    }
    this._sanitizeSettings();
  }

  _sanitizeSettings(): void {
    this.pluginSettings.defaultStructure = this._normalizeStructureMode(this.pluginSettings.defaultStructure) || DEFAULT_STRUCTURE;
    this.pluginSettings.defaultLayout = this._normalizeLayout(this.pluginSettings.defaultLayout) || DEFAULT_LAYOUT;
    this.pluginSettings.defaultTheme = hasOwn(THEMES, this.pluginSettings.defaultTheme) ? this.pluginSettings.defaultTheme : DEFAULT_THEME;
    this.pluginSettings.defaultLine = hasOwn(LINE_STYLES, this.pluginSettings.defaultLine) ? this.pluginSettings.defaultLine : DEFAULT_LINE;
    this.pluginSettings.defaultNodeStyle = hasOwn(NODE_STYLES, this.pluginSettings.defaultNodeStyle) ? this.pluginSettings.defaultNodeStyle : DEFAULT_NODE_STYLE;
    const fontSize = Number(this.pluginSettings.nodeFontSize);
    this.pluginSettings.nodeFontSize = Number.isFinite(fontSize)
      ? Math.min(MAX_NODE_FONT_SIZE, Math.max(MIN_NODE_FONT_SIZE, Math.round(fontSize)))
      : DEFAULT_PLUGIN_SETTINGS.nodeFontSize;
    this.pluginSettings.keyboardNavigation = this.pluginSettings.keyboardNavigation !== false;
    this.pluginSettings.leafOutsideDropCreatesChild = this.pluginSettings.leafOutsideDropCreatesChild !== false;
  }

  async saveSettings(): Promise<void> {
    this._sanitizeSettings();
    await this.saveData(this.pluginSettings);
  }

  _getSetting<K extends PluginSettingKey>(key: K): PluginSettings[K] {
    return this.pluginSettings[key];
  }

  _defaultStructure(): StructureMode {
    return this._normalizeStructureMode(this._getSetting('defaultStructure')) || DEFAULT_STRUCTURE;
  }

  _defaultLayout(): LayoutId {
    return this._normalizeLayout(this._getSetting('defaultLayout')) || DEFAULT_LAYOUT;
  }

  _defaultTheme(): ThemeId {
    const key = this._getSetting('defaultTheme');
    return hasOwn(THEMES, key) ? key : DEFAULT_THEME;
  }

  _defaultLine(): LineStyleId {
    const key = this._getSetting('defaultLine');
    return hasOwn(LINE_STYLES, key) ? key : DEFAULT_LINE;
  }

  _defaultNodeStyle(): NodeStyleId {
    const key = this._getSetting('defaultNodeStyle');
    return hasOwn(NODE_STYLES, key) ? key : DEFAULT_NODE_STYLE;
  }

  _baseNodeFontSize(): number {
    const value = Number(this._getSetting('nodeFontSize'));
    return Number.isFinite(value)
      ? Math.min(MAX_NODE_FONT_SIZE, Math.max(MIN_NODE_FONT_SIZE, value))
      : DEFAULT_PLUGIN_SETTINGS.nodeFontSize;
  }

  _fontSizeForNode(depth: number, nodeStyle: NodeStyleId): number {
    const base = this._baseNodeFontSize();
    if (nodeStyle === 'borderless') {
      if (depth === 0) return base + 6;
      if (depth === 1) return base + 2;
    } else if (nodeStyle === 'doodle' && depth === 0) {
      return base + 4;
    }
    if (depth === 0) return base + 3;
    if (depth === 1) return base + 1;
    if (depth === 2) return base + 0.5;
    return Math.max(MIN_NODE_FONT_SIZE, base - 0.5);
  }

  _applyDisplaySettingsToOverlay(overlay: StratifyOverlayElement): void {
    if (!overlay) return;
    overlay.style.setProperty('--stratify-font-size', this._baseNodeFontSize() + 'px');
  }

  _refreshDisplaySettings(): void {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view;
      if (!(view instanceof obsidian.MarkdownView)) continue;
      const overlay = view.contentEl.querySelector<StratifyOverlayElement>(':scope > .stratify-overlay');
      if (!overlay) continue;
      this._applyDisplaySettingsToOverlay(overlay);
      if (overlay._stratifyTreeInfo && overlay._stratifyCanvas) {
        this._renderTreeIntoCanvas(overlay, true);
      }
    }
  }

  _newMindmapContent(): string {
    const structure = this._defaultStructure();
    const body = structure === 'list' ? '- New\n' : '# New\n';
    return [
      '---',
      'type: mindmap',
      'mindmap-structure: ' + structure,
      'mindmap-layout: ' + this._defaultLayout(),
      'mindmap-theme: ' + this._defaultTheme(),
      'mindmap-line: ' + this._defaultLine(),
      'mindmap-node: ' + this._defaultNodeStyle(),
      '---',
      '',
      body
    ].join('\n');
  }

  async _convertActiveFileToMindmap(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof obsidian.TFile) || file.extension !== 'md') {
      new obsidian.Notice('Open a Markdown note before converting it to a mindmap.');
      return;
    }
    await this._convertFileToMindmap(file, false);
  }

  async _readFileContent(file: obsidian.TFile): Promise<string> {
    return this.app.vault.cachedRead(file);
  }

  async _writeMindmapContent(overlay: StratifyOverlayElement, content: string): Promise<void> {
    const file = overlay && overlay._stratifyFile;
    if (!file) return;
    const view = overlay._stratifyView;
    if (view instanceof obsidian.MarkdownView && view.file === file && view.editor) {
      view.editor.setValue(content);
      view.requestSave();
    } else {
      await this.app.vault.process(file, () => content);
    }
    overlay._stratifyLastContent = content;
  }

  async _convertFileToMindmap(file: obsidian.TFile, openAfter: boolean): Promise<void> {
    if (!(file instanceof obsidian.TFile) || file.extension !== 'md') return;
    try {
      const content = await this._readFileContent(file);
      const parsedFrontmatter = this._splitFrontmatter(content).frontmatter;
      const structure = this._readStructureFromFrontmatter(parsedFrontmatter) || this._detectStructureMode(content);
      await this.app.fileManager.processFrontMatter(file, (value: unknown) => {
        if (!isRecord(value)) return;
        const fm = value;
        fm.type = 'mindmap';
        const existingStructure = this._readStructureFromFrontmatter(fm);
        if (!existingStructure) fm['mindmap-structure'] = structure;
        if (!fm['mindmap-layout']) fm['mindmap-layout'] = this._defaultLayout();
        if (!fm['mindmap-theme']) fm['mindmap-theme'] = this._defaultTheme();
        if (!fm['mindmap-line']) fm['mindmap-line'] = this._defaultLine();
        if (!fm['mindmap-node']) fm['mindmap-node'] = this._defaultNodeStyle();
      });
      if (openAfter) {
        await this.app.workspace.openLinkText(file.path, '', true);
      }
      const label = STRUCTURE_MODES[structure] ? STRUCTURE_MODES[structure].name : STRUCTURE_MODES[DEFAULT_STRUCTURE].name;
      new obsidian.Notice('Converted to mindmap (' + label + ' mode).');
      this._scan();
    } catch (error: unknown) {
      console.error('[StratifyMindmap] convert error', error);
      new obsidian.Notice('Failed to convert note to mindmap: ' + errorMessage(error));
    }
  }

  onunload(): void {
    this._unloading = true;
    this._scan?.cancel();
    const documents = new Set<Document>([activeDocument]);
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view;
      if (!(view instanceof obsidian.MarkdownView)) continue;
      documents.add(view.contentEl.ownerDocument);
      const overlay = view.contentEl.querySelector<StratifyOverlayElement>(':scope > .stratify-overlay');
      if (overlay && overlay._stratifyPointerDrag) {
        this._finishNodePointerDrag(overlay._stratifyPointerDrag, false);
      }
      if (overlay && overlay._stratifyCleanup) overlay._stratifyCleanup();
      if (overlay) overlay.remove();
      view.contentEl.querySelectorAll('.stratify-fab').forEach((el) => el.remove());
      view.contentEl.removeClass('stratify-host');
      view.contentEl.removeClass('stratify-map-visible');
    }
    for (const ownerDocument of documents) {
      ownerDocument.getElementById('stratify-doodle-filter')?.remove();
      ownerDocument.querySelectorAll('.stratify-mention-popup').forEach((el) => el.remove());
    }
  }

  async _doScan(): Promise<void> {
    if (this._unloading) return;
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      if (this._unloading) return;
      const view = leaf.view;
      if (!(view instanceof obsidian.MarkdownView)) continue;
      const file = view.file;
      if (!file) continue;
      const cache = this.app.metadataCache.getFileCache(file);
      const cachedFrontmatter: unknown = cache?.frontmatter;
      const fm = isRecord(cachedFrontmatter) ? cachedFrontmatter : null;
      const isMindmap = typeof fm?.type === 'string' && fm.type.toLowerCase() === 'mindmap';
      const existing = view.contentEl.querySelector<StratifyOverlayElement>(':scope > .stratify-overlay');

      if (isMindmap) {
        view.contentEl.addClass('stratify-host');
      let content: string;
        try {
          content = view.editor ? view.editor.getValue() : await this._readFileContent(file);
        } catch {
          content = await this._readFileContent(file);
        }
        if (this._unloading) return;
        let overlay = existing;
        if (!overlay) {
          overlay = view.contentEl.createDiv({ cls: 'stratify-overlay' });
        }
        overlay.classList.toggle('stratify-mobile', obsidian.Platform.isMobile);
        if (overlay.classList.contains('stratify-hidden')) {
          view.contentEl.removeClass('stratify-map-visible');
        } else {
          view.contentEl.addClass('stratify-map-visible');
        }
        if (overlay._stratifyFile !== file) {
          overlay._stratifyTheme = null;
          overlay._stratifyLayout = null;
          overlay._stratifyLine = null;
          overlay._stratifyNodeStyle = null;
          overlay._stratifyStructure = null;
          overlay._stratifyUndoStack = [];
          overlay._stratifyRedoStack = [];
          overlay._stratifyEditSnapshot = null;
          overlay._stratifyLastContent = null;
        }
        if (overlay._stratifyLastContent === content) continue;
        if (overlay._stratifyWriting && existing) {
          overlay._stratifyLastContent = content;
          continue;
        }
        overlay.dataset.file = file.path;
        if (overlay.classList.contains('stratify-hidden')) {
          overlay._stratifyNeedsRerender = true;
          overlay._stratifyStaleContent = content;
          overlay._stratifyStaleFm = fm;
          overlay._stratifyStaleName = file.basename;
          continue;
        }
        try {
          this._render(overlay, content, fm, file.basename, view, file);
        } catch (error: unknown) {
          console.error('[StratifyMindmap] render error', error);
          overlay.empty();
          overlay.createDiv({ cls: 'stratify-empty', text: 'Mind map render error: ' + errorMessage(error) });
        }
      } else if (existing) {
        existing.remove();
        this._removeRestoreFab(view);
        view.contentEl.removeClass('stratify-host');
        view.contentEl.removeClass('stratify-map-visible');
      } else {
        view.contentEl.removeClass('stratify-host');
        view.contentEl.removeClass('stratify-map-visible');
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Parsing — preserves frontmatter, pre-heading body, and each
  // heading's associated body so we can serialize back losslessly.
  // ────────────────────────────────────────────────────────────────

  _splitFrontmatter(content: string): FrontmatterSplit {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { frontmatterRaw: '', frontmatter: null, body: content };
    let parsed: Frontmatter | null = null;
    try {
      const value: unknown = obsidian.parseYaml(m[1]);
      parsed = isRecord(value) ? value : {};
    } catch {
      parsed = null;
    }
    return { frontmatterRaw: m[0], frontmatter: parsed, body: content.slice(m[0].length) };
  }

  _withFrontmatterUpdates(content: string, updates: Frontmatter): string {
    const split = this._splitFrontmatter(content);
    const frontmatter: Frontmatter = Object.assign({}, split.frontmatter || {}, updates);
    const yaml = obsidian.stringifyYaml(frontmatter).trimEnd();
    const bodyPrefix = split.frontmatterRaw ? '' : '\n';
    return '---\n' + yaml + '\n---\n' + bodyPrefix + split.body;
  }

  _stripInline(text: string): string {
    return text
      .replace(
        /!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
        (_match: string, p1: string, p2: string | undefined): string => p2 || p1
      )
      .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
      .replace(/(^|[^_])_([^_\n]+)_/g, '$1$2')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/==([^=]+)==/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  _safeExternalHref(target: string): string | null {
    const href = String(target || '').trim();
    return /^(?:https?:\/\/|obsidian:\/\/)/i.test(href) ? href : null;
  }

  _renderNodeContent(el: HTMLElement, node: MindmapNode, overlay: StratifyOverlayElement): void {
    const raw = node.rawText || node.text || '';
    if (!raw.includes('](') && !raw.includes('[[')) {
      el.textContent = node.text || PLACEHOLDER;
      return;
    }
    el.textContent = '';
    const sourcePath = overlay._stratifyFile ? overlay._stratifyFile.path : '';
    const dir = sourcePath ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '';

    // Collect all links (markdown and wiki-link) with positions
    const links: NodeLink[] = [];
    let m: RegExpExecArray | null;
    const mdRe = /\[([^\]]*)\]\(([^)]*)\)/g;
    while ((m = mdRe.exec(raw)) !== null) {
      links.push({ start: m.index, end: m.index + m[0].length, type: 'md', text: m[1], target: m[2] });
    }
    const wikiRe = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    while ((m = wikiRe.exec(raw)) !== null) {
      links.push({ start: m.index, end: m.index + m[0].length, type: 'wiki', target: m[1], text: m[2] || m[1] });
    }
    links.sort((a, b) => a.start - b.start);

    let last = 0;
    for (const link of links) {
      if (link.start < last) continue; // skip overlapping
      if (link.start > last) el.appendText(raw.slice(last, link.start));

      const a = el.createEl('a', { cls: 'stratify-link', text: link.text });

      if (link.type === 'md') {
        const href = String(link.target || '').trim();
        const externalHref = this._safeExternalHref(href);
        if (externalHref) {
          a.href = externalHref;
          a.target = '_blank';
          a.rel = 'noopener';
        } else {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fp = obsidian.normalizePath(dir ? dir + '/' + href : href);
            void this.app.workspace.openLinkText(fp, '', 'tab');
          });
        }
      } else {
        // wiki-link: Obsidian API resolves shortest/relative paths natively
        a.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          void this.app.workspace.openLinkText(link.target, sourcePath, 'tab');
        });
      }
      last = link.end;
    }
    if (last < raw.length) {
      el.appendText(raw.slice(last));
    }
    if (el.childNodes.length === 0) {
      el.textContent = node.text || PLACEHOLDER;
    }
  }

  _indentColumns(indent: string): number {
    return (indent || '').replace(/\t/g, '    ').length;
  }

  _detectStructureMode(content: string): StructureMode {
    const { body } = this._splitFrontmatter(content);
    const lines = body.split('\n');
    const headingRe = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
    const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.+?)\s*$/;
    const fenceRe = /^(```|~~~)/;
    let inFence = false;
    let fenceMarker: string | null = null;
    let hasHeading = false;
    let hasList = false;
    for (const line of lines) {
      const fm = line.match(fenceRe);
      if (fm) {
        if (!inFence) { inFence = true; fenceMarker = fm[1]; }
        else if (fenceMarker && line.startsWith(fenceMarker)) { inFence = false; fenceMarker = null; }
        continue;
      }
      if (inFence) continue;
      if (headingRe.test(line)) hasHeading = true;
      else if (listRe.test(line)) hasList = true;
      if (hasHeading && hasList) return 'hybrid';
    }
    if (hasList) return 'list';
    if (hasHeading) return 'heading';
    return this._defaultStructure();
  }

  _parseStructured(content: string, structureMode: unknown): ParsedMindmap {
    const mode = this._normalizeStructureMode(structureMode) || this._defaultStructure();
    const { frontmatterRaw, body } = this._splitFrontmatter(content);
    const lines = body.split('\n');
    const headingRe = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
    const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.+?)\s*$/;
    const fenceRe = /^(```|~~~)/;
    let inFence = false;
    let fenceMarker: string | null = null;
    const headings: MindmapNode[] = [];
    const listStack: Array<{ indent: number; level: number }> = [];
    let currentHeadingLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fm = line.match(fenceRe);
      if (fm) {
        if (!inFence) { inFence = true; fenceMarker = fm[1]; }
        else if (fenceMarker && line.startsWith(fenceMarker)) { inFence = false; fenceMarker = null; }
        continue;
      }
      if (inFence) continue;
      const m = mode !== 'list' ? line.match(headingRe) : null;
      if (m) {
        const rawText = m[2].trim();
        const collapsed = /^\*(?!\*)(.+)\*(?!\*)$/.test(rawText);
        currentHeadingLevel = m[1].length;
        listStack.length = 0;
        headings.push({
          srcIdx: i,
          kind: 'heading',
          level: m[1].length,
          rawText: collapsed ? rawText.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1') : rawText,
          text: this._stripInline(rawText),
          children: [],
          parent: null,
          dirty: false,
          isNew: false,
          collapsed,
          bodyRaw: '',
          color: '',
          depth: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          _sth: 0,
          _stw: 0,
        });
        continue;
      }
      const lm = mode !== 'heading' ? line.match(listRe) : null;
      if (lm) {
        const indent = this._indentColumns(lm[1]);
        while (listStack.length && indent <= listStack[listStack.length - 1].indent) {
          listStack.pop();
        }
        const baseLevel = mode === 'hybrid' ? currentHeadingLevel : 0;
        const parentLevel = listStack.length ? listStack[listStack.length - 1].level : baseLevel;
        const level = parentLevel + 1;
        const rawText = lm[3].trim();
        const collapsed = /^\*(?!\*)(.+)\*(?!\*)$/.test(rawText);
        headings.push({
          srcIdx: i,
          kind: 'list',
          level,
          rawText: collapsed ? rawText.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1') : rawText,
          text: this._stripInline(rawText),
          children: [],
          parent: null,
          dirty: false,
          isNew: false,
          collapsed,
          bodyRaw: '',
          color: '',
          depth: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          _sth: 0,
          _stw: 0,
        });
        listStack.push({ indent, level });
      }
    }
    const preEnd = headings[0]?.srcIdx ?? lines.length;
    let preBody = lines.slice(0, preEnd).join('\n');
    if (headings.length > 0 && preEnd > 0) preBody += '\n';
    for (let i = 0; i < headings.length; i++) {
      const start = (headings[i].srcIdx ?? -1) + 1;
      const end = i + 1 < headings.length ? (headings[i + 1].srcIdx ?? lines.length) : lines.length;
      headings[i].bodyRaw = lines.slice(start, end).join('\n');
      if (i + 1 < headings.length && end > start) headings[i].bodyRaw += '\n';
    }
    return { frontmatterRaw, preBody, headings, structureMode: mode };
  }

  _hasSourceOnlyContent(parsed: ParsedMindmap | null | undefined): boolean {
    if (!parsed) return false;
    if (parsed.preBody && parsed.preBody.trim()) return true;
    return parsed.headings.some((node) => node.bodyRaw && node.bodyRaw.trim());
  }

  _buildTree(parsed: ParsedMindmap, fileName: string): TreeInfo {
    const items = parsed.headings;
    if (items.length === 0) return { tree: null, virtualRoot: false, baseLevel: 1 };
    const minLevel = items.reduce((a, b) => Math.min(a, b.level), 6);
    const tops = items.filter((i) => i.level === minLevel);

    let tree: MindmapNode;
    let virtualRoot = false;
    const baseLevel = minLevel;

    if (tops.length > 1 || items[0].level !== minLevel) {
      tree = {
        level: minLevel - 1,
        rawText: fileName || 'Mind Map',
        text: fileName || 'Mind Map',
        children: [],
        parent: null,
        bodyRaw: '',
        dirty: false,
        isNew: false,
        collapsed: false,
        isVirtual: true,
        color: '',
        depth: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        _sth: 0,
        _stw: 0,
      };
      virtualRoot = true;
      const stack = [tree];
      for (const item of items) {
        while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
        if (stack.length === 0) stack.push(tree);
        const parent = stack[stack.length - 1];
        parent.children.push(item);
        item.parent = parent;
        stack.push(item);
      }
    } else {
      tree = items[0];
      tree.parent = null;
      const stack = [tree];
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
        const parent = stack[stack.length - 1] || tree;
        parent.children.push(item);
        item.parent = parent;
        stack.push(item);
      }
    }

    return { tree, virtualRoot, baseLevel };
  }

  // ────────────────────────────────────────────────────────────────
  // Serialization back to markdown.
  // Non-edited nodes write their original rawText; edited/new nodes
  // write node.text. Frontmatter, pre-body, and per-node bodyRaw
  // are preserved verbatim.
  // ────────────────────────────────────────────────────────────────

  _serialize(parsed: ParsedMindmap, treeInfo: TreeInfo, structureMode: unknown): string {
    const mode = this._normalizeStructureMode(structureMode) || parsed.structureMode || this._defaultStructure();
    let out = parsed.frontmatterRaw;
    if (parsed.preBody && parsed.preBody.length) {
      out += parsed.preBody;
      if (!parsed.preBody.endsWith('\n')) out += '\n';
    }
    if (treeInfo.virtualRoot && treeInfo.tree) {
      for (const child of treeInfo.tree.children) {
        out += this._serializeNode(child, treeInfo.baseLevel, mode);
      }
    } else if (treeInfo.tree) {
      out += this._serializeNode(treeInfo.tree, treeInfo.baseLevel, mode);
    }
    return out;
  }

  _serializeMindmap(parsed: ParsedMindmap, treeInfo: TreeInfo, structureMode: unknown): string {
    const mode = this._normalizeStructureMode(structureMode) || parsed.structureMode || this._defaultStructure();
    const content = this._serialize(parsed, treeInfo, mode);
    const frontmatter = this._splitFrontmatter(content).frontmatter;
    if (this._readStructureFromFrontmatter(frontmatter) === mode) return content;
    return this._withFrontmatterUpdates(content, { 'mindmap-structure': mode });
  }

  _maxSerializedLevel(treeInfo: TreeInfo | null | undefined): number {
    if (!treeInfo || !treeInfo.tree) return 0;
    const walk = (node: MindmapNode, level: number): number => {
      let max = level;
      for (const child of node.children || []) {
        max = Math.max(max, walk(child, level + 1));
      }
      return max;
    };
    if (treeInfo.virtualRoot) {
      return (treeInfo.tree.children || []).reduce((max, child) => {
        return Math.max(max, walk(child, treeInfo.baseLevel));
      }, 0);
    }
    return walk(treeInfo.tree, treeInfo.baseLevel);
  }

  _serializeNode(node: MindmapNode, level: number, structureMode: unknown): string {
    const mode = this._normalizeStructureMode(structureMode) || this._defaultStructure();
    let text = node.rawText || node.text || PLACEHOLDER;
    if (node.collapsed) {
      const inner = text.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1');
      text = '*' + inner + '*';
    } else {
      text = text.replace(/^\*(?!\*)(.+)\*(?!\*)$/, '$1');
    }
    const normalizedLevel = Math.max(1, level);
    let s: string;
    if (mode === 'list') {
      s = '  '.repeat(normalizedLevel - 1) + '- ' + text + '\n';
    } else if (mode === 'hybrid' && normalizedLevel > 6) {
      s = '  '.repeat(normalizedLevel - 7) + '- ' + text + '\n';
    } else {
      s = '#'.repeat(Math.min(6, normalizedLevel)) + ' ' + text + '\n';
    }
    if (node.bodyRaw && node.bodyRaw.length) {
      s += node.bodyRaw;
      if (!node.bodyRaw.endsWith('\n')) s += '\n';
    }
    for (const child of node.children) {
      s += this._serializeNode(child, level + 1, mode);
    }
    return s;
  }

  _assignColors(root: MindmapNode, palette: string[], rootColor: string): void {
    const p = (palette && palette.length) ? palette : THEMES[DEFAULT_THEME].palette;
    root.depth = 0;
    root.color = rootColor || p[0] || '#6366F1';
    root.children.forEach((child, i) => {
      const c = p[i % p.length];
      this._propagateColor(child, c, 1);
    });
  }

  _propagateColor(node: MindmapNode, color: string, depth: number): void {
    node.color = color;
    node.depth = depth;
    node.children.forEach((c) => this._propagateColor(c, color, depth + 1));
  }

  // ────────────────────────────────────────────────────────────────
  // Top-level render — toolbar + canvas containers, then renders
  // tree into the canvas.
  // ────────────────────────────────────────────────────────────────

  _showRestoreFab(view: obsidian.MarkdownView, overlay: StratifyOverlayElement): void {
    if (!view || !view.contentEl) return;
    let fab = view.contentEl.querySelector<HTMLButtonElement>(':scope > .stratify-fab');
    if (fab) return;
    fab = view.contentEl.createEl('button', { cls: 'stratify-fab', text: 'Stratify Mindmap' });
    fab.onclick = () => {
      overlay.classList.remove('stratify-hidden');
      view.contentEl.addClass('stratify-map-visible');
      fab.remove();
      if (overlay._stratifyNeedsRerender) {
        overlay._stratifyNeedsRerender = false;
        if (typeof overlay._stratifyStaleContent === 'string' &&
            typeof overlay._stratifyStaleName === 'string' && view.file) {
          this._render(
            overlay,
            overlay._stratifyStaleContent,
            overlay._stratifyStaleFm || null,
            overlay._stratifyStaleName,
            view,
            view.file
          );
        }
      } else {
        const canvas = overlay.querySelector<StratifyCanvasElement>(':scope > .stratify-canvas');
        const inner = canvas?.querySelector<HTMLDivElement>(':scope > .stratify-inner');
        if (canvas && inner) this._fitTo(canvas, inner);
      }
    };
  }

  _removeRestoreFab(view: obsidian.MarkdownView): void {
    if (!view || !view.contentEl) return;
    const fab = view.contentEl.querySelector<HTMLButtonElement>(':scope > .stratify-fab');
    if (fab) fab.remove();
  }

  _normalizeTheme(value: unknown): ThemeId | null {
    const key = typeof value === 'string' ? value.toLowerCase() : '';
    return hasOwn(THEMES, key) ? key : null;
  }

  _normalizeLine(value: unknown): LineStyleId | null {
    const key = typeof value === 'string' ? value.toLowerCase() : '';
    return hasOwn(LINE_STYLES, key) ? key : null;
  }

  _normalizeNodeStyle(value: unknown): NodeStyleId | null {
    const key = typeof value === 'string' ? value.toLowerCase() : '';
    return hasOwn(NODE_STYLES, key) ? key : null;
  }

  _resolveTheme(frontmatter: Frontmatter | null): ThemeId {
    const id = frontmatter && (frontmatter['mindmap-theme'] || frontmatter['mindmap_theme']);
    return this._normalizeTheme(id) || this._defaultTheme();
  }

  _resolveLine(frontmatter: Frontmatter | null): LineStyleId {
    const id = frontmatter && (frontmatter['mindmap-line'] || frontmatter['mindmap_line']);
    return this._normalizeLine(id) || this._defaultLine();
  }

  _resolveNodeStyle(frontmatter: Frontmatter | null): NodeStyleId {
    const id = frontmatter && (frontmatter['mindmap-node'] || frontmatter['mindmap_node']);
    return this._normalizeNodeStyle(id) || this._defaultNodeStyle();
  }

  _normalizeLayout(value: unknown): LayoutId | null {
    const key = typeof value === 'string' ? value.toLowerCase() : '';
    return ['balanced', 'right', 'left', 'tree', 'radial'].includes(key) ? key as LayoutId : null;
  }

  _normalizeStructureMode(value: unknown): StructureMode | null {
    const key = typeof value === 'string' ? value.toLowerCase() : '';
    return hasOwn(STRUCTURE_MODES, key) ? key : null;
  }

  _readStructureFromFrontmatter(frontmatter: Frontmatter | null): StructureMode | null {
    if (!frontmatter) return null;
    return this._normalizeStructureMode(
      frontmatter['mindmap-structure'] ||
      frontmatter['mindmap_structure'] ||
      frontmatter['mindmap-mode'] ||
      frontmatter['mindmap_mode']
    );
  }

  _resolveStructure(frontmatter: Frontmatter | null, content: string): StructureMode {
    const declared = this._readStructureFromFrontmatter(frontmatter);
    if (!declared) return this._detectStructureMode(content);
    if (this._parseStructured(content, declared).headings.length > 0) return declared;

    const detected = this._detectStructureMode(content);
    if (detected !== declared && this._parseStructured(content, detected).headings.length > 0) {
      return detected;
    }
    return declared;
  }

  _applyNodeStyleToOverlay(overlay: StratifyOverlayElement, nodeStyleId: unknown): void {
    const key = this._normalizeNodeStyle(nodeStyleId) || DEFAULT_NODE_STYLE;
    overlay._stratifyNodeStyle = key;
    objectKeys(NODE_STYLES).forEach((id) => overlay.classList.remove('stratify-node-style-' + id));
    overlay.classList.add('stratify-node-style-' + key);
  }

  _applyThemeToOverlay(overlay: StratifyOverlayElement, themeId: unknown): void {
    const key = this._normalizeTheme(themeId) || DEFAULT_THEME;
    const theme = THEMES[key];
    overlay._stratifyTheme = key;
    objectKeys(THEMES).forEach((id) => overlay.classList.remove('stratify-theme-' + id));
    overlay.classList.add('stratify-theme-' + overlay._stratifyTheme);
    if (theme.bg) overlay.style.setProperty('--stratify-theme-bg', theme.bg);
    else overlay.style.removeProperty('--stratify-theme-bg');
    if (theme.fg) overlay.style.setProperty('--stratify-theme-fg', theme.fg);
    else overlay.style.removeProperty('--stratify-theme-fg');
    overlay.style.setProperty('--stratify-theme-root-fill', theme.rootFill);
    overlay.style.setProperty('--stratify-theme-root-accent', theme.rootAccent);
  }

  async _persistFrontmatterValue(file: obsidian.TFile | null | undefined, key: string, value: unknown): Promise<void> {
    if (!file) return;
    try {
      await this.app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
        if (isRecord(frontmatter)) frontmatter[key] = value;
      });
    } catch (error: unknown) {
      console.error('[StratifyMindmap] frontmatter persist error', error);
    }
  }

  async _batchPersistFrontmatter(
    file: obsidian.TFile | null | undefined,
    updates: Frontmatter
  ): Promise<void> {
    if (!file || !updates || Object.keys(updates).length === 0) return;
    try {
      await this.app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
        if (!isRecord(frontmatter)) return;
        for (const [key, value] of Object.entries(updates)) {
          frontmatter[key] = value;
        }
      });
    } catch (error: unknown) {
      console.error('[StratifyMindmap] frontmatter batch persist error', error);
    }
  }

  _render(
    overlay: StratifyOverlayElement,
    content: string,
    frontmatter: Frontmatter | null,
    fileBasename: string,
    view: obsidian.MarkdownView,
    file: obsidian.TFile
  ): void {
    this._injectDoodleFilter(overlay.ownerDocument);
    overlay._stratifyLastContent = content;
    overlay._stratifyView = view;
    overlay._stratifyFile = file;
    overlay._stratifyFrontmatter = frontmatter;

    const fmLayout = frontmatter && (frontmatter['mindmap-layout'] || frontmatter['mindmap_layout'] || frontmatter.layout);
    const resolvedFmLayout = this._normalizeLayout(fmLayout);
    const fmLayoutValid = Boolean(resolvedFmLayout);
    const layout = overlay._stratifyLayout || resolvedFmLayout || this._defaultLayout();
    overlay._stratifyLayout = layout;

    const fmTheme = frontmatter && (frontmatter['mindmap-theme'] || frontmatter['mindmap_theme']);
    const fmThemeValid = Boolean(this._normalizeTheme(fmTheme));
    const themeId = this._normalizeTheme(overlay._stratifyTheme) || this._resolveTheme(frontmatter);
    this._applyThemeToOverlay(overlay, themeId);
    this._applyDisplaySettingsToOverlay(overlay);

    const fmLine = frontmatter && (frontmatter['mindmap-line'] || frontmatter['mindmap_line']);
    const fmLineValid = Boolean(this._normalizeLine(fmLine));
    const lineId = this._normalizeLine(overlay._stratifyLine) || this._resolveLine(frontmatter);
    overlay._stratifyLine = lineId;

    const fmNodeStyle = frontmatter && (frontmatter['mindmap-node'] || frontmatter['mindmap_node']);
    const fmNodeStyleValid = Boolean(this._normalizeNodeStyle(fmNodeStyle));
    const nodeStyleId = this._normalizeNodeStyle(overlay._stratifyNodeStyle) || this._resolveNodeStyle(frontmatter);
    this._applyNodeStyleToOverlay(overlay, nodeStyleId);

    const fmStructure = frontmatter && (
      frontmatter['mindmap-structure'] ||
      frontmatter['mindmap_structure'] ||
      frontmatter['mindmap-mode'] ||
      frontmatter['mindmap_mode']
    );
    const fmStructureValid = Boolean(this._normalizeStructureMode(fmStructure));
    const structureId = overlay._stratifyStructure && STRUCTURE_MODES[overlay._stratifyStructure]
      ? overlay._stratifyStructure
      : this._resolveStructure(frontmatter, content);
    overlay._stratifyStructure = structureId;

    // Batch frontmatter writes into a single call to avoid cascading re-renders
    const fmUpdates: Frontmatter = {};
    if (!fmLayoutValid) fmUpdates['mindmap-layout'] = layout;
    if (!fmThemeValid) fmUpdates['mindmap-theme'] = overlay._stratifyTheme;
    if (!fmLineValid) fmUpdates['mindmap-line'] = lineId;
    if (!fmNodeStyleValid) fmUpdates['mindmap-node'] = overlay._stratifyNodeStyle;
    if (!fmStructureValid) fmUpdates['mindmap-structure'] = structureId;
    if (Object.keys(fmUpdates).length) {
      void this._batchPersistFrontmatter(file, fmUpdates);
    }

    const parsed = this._parseStructured(content, structureId);
    const treeInfo = this._buildTree(parsed, fileBasename);
    overlay._stratifyParsed = parsed;
    overlay._stratifyTreeInfo = treeInfo;
    overlay._stratifySelected = null;
    overlay._stratifyPendingEdit = null;
    overlay._stratifyEditingNode = null;

    if (overlay._stratifyCleanup) {
      overlay._stratifyCleanup();
      overlay._stratifyCleanup = null;
    }
    overlay.empty();

    const makeIconButton = (parent: HTMLElement, icon: string, label: string, extraClass = ''): HTMLButtonElement => {
      const classes = ['stratify-btn', 'stratify-icon-btn', extraClass || ''].filter(Boolean).join(' ');
      const button = parent.createEl('button', { cls: classes, attr: { type: 'button' } });
      obsidian.setIcon(button, icon);
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      return button;
    };

    const toolbar = overlay.createDiv({ cls: 'stratify-toolbar' });
    const structureGroup = toolbar.createDiv({ cls: 'stratify-toolbar-group stratify-structure-control' });
    structureGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Mode' });
    const structureSelect = structureGroup.createEl('select', { cls: 'stratify-select' });
    for (const id of objectKeys(STRUCTURE_MODES)) {
      const opt = structureSelect.createEl('option', { value: id, text: STRUCTURE_MODES[id].name });
      if (id === overlay._stratifyStructure) opt.selected = true;
    }
    structureSelect.onchange = async () => {
      const id = this._normalizeStructureMode(structureSelect.value);
      const previous = overlay._stratifyStructure || this._defaultStructure();
      if (!id || id === previous) return;
      if (id === 'heading' && this._maxSerializedLevel(overlay._stratifyTreeInfo) > 6) {
        structureSelect.value = previous;
        new obsidian.Notice('Heading mode only supports six levels. Use Hybrid or List for deeper mindmaps.');
        return;
      }
      this._pushUndoSnapshot(overlay);
      overlay._stratifyStructure = id;
      const currentParsed = overlay._stratifyParsed;
      const currentTreeInfo = overlay._stratifyTreeInfo;
      if (!currentParsed || !currentTreeInfo) return;
      const newContent = this._serializeMindmap(currentParsed, currentTreeInfo, id);
      const nextFrontmatter = this._splitFrontmatter(newContent).frontmatter || {};
      overlay._stratifyLastContent = newContent;
      overlay._stratifyParsed = this._parseStructured(newContent, id);
      overlay._stratifyTreeInfo = this._buildTree(overlay._stratifyParsed, fileBasename);
      overlay._stratifySelected = null;
      overlay._stratifyPendingEdit = null;
      overlay._stratifyFrontmatter = nextFrontmatter;
      this._renderTreeIntoCanvas(overlay, true);
      if (!file) return;
      try {
        overlay._stratifyWriting = true;
        await this._writeMindmapContent(overlay, newContent);
        this._render(overlay, newContent, nextFrontmatter, fileBasename, view, file);
      } catch (error: unknown) {
        console.error('[StratifyMindmap] structure mode persist error', error);
        new obsidian.Notice('Failed to change mindmap mode: ' + errorMessage(error));
      } finally {
        (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
          overlay._stratifyWriting = false;
        });
      }
    };

    const layoutGroup = toolbar.createDiv({ cls: 'stratify-toolbar-group stratify-layout-control' });
    layoutGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Layout' });
    const layoutSelect = layoutGroup.createEl('select', { cls: 'stratify-select' });
    for (const l of [
      { id: 'balanced', label: 'Balanced' },
      { id: 'right', label: 'Right' },
      { id: 'left', label: 'Left' },
      { id: 'tree', label: 'Tree' },
      { id: 'radial', label: 'Radial' },
    ]) {
      const opt = layoutSelect.createEl('option', { value: l.id, text: l.label });
      if (l.id === layout) opt.selected = true;
    }
    layoutSelect.onchange = () => {
      const id = this._normalizeLayout(layoutSelect.value);
      if (!id) return;
      if (overlay._stratifyLayout === id) return;
      overlay._stratifyLayout = id;
      this._renderTreeIntoCanvas(overlay, false);
      void this._persistFrontmatterValue(file, 'mindmap-layout', id);
    };

    const actions = toolbar.createDiv({ cls: 'stratify-toolbar-group stratify-toolbar-actions' });
    const fitBtn = makeIconButton(actions, 'maximize-2', 'Fit mindmap to view');
    const zoomInBtn = makeIconButton(actions, 'plus', 'Zoom in', 'stratify-desktop-zoom');
    const zoomOutBtn = makeIconButton(actions, 'minus', 'Zoom out', 'stratify-desktop-zoom');
    const editBtn = makeIconButton(actions, 'file-pen-line', 'Edit Markdown source');
    const showSource = () => {
      overlay.classList.add('stratify-hidden');
      view.contentEl.removeClass('stratify-map-visible');
      this._showRestoreFab(view, overlay);
    };
    editBtn.onclick = showSource;

    if (this._hasSourceOnlyContent(parsed)) {
      editBtn.classList.add('stratify-mobile-source-only');
      const sourceOnlyBtn = makeIconButton(
        actions,
        'file-text',
        'Markdown-only content is preserved in the source',
        'stratify-source-only stratify-desktop-source-only'
      );
      sourceOnlyBtn.onclick = showSource;
    }

    const more = toolbar.createEl('details', { cls: 'stratify-more' });
    const moreToggle = more.createEl('summary', {
      cls: 'stratify-btn stratify-icon-btn',
      attr: { 'aria-label': 'View and export options', title: 'View and export options' }
    });
    obsidian.setIcon(moreToggle, 'sliders-horizontal');
    const morePanel = more.createDiv({ cls: 'stratify-more-panel' });

    const themeGroup = morePanel.createDiv({ cls: 'stratify-theme-field' });
    themeGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Theme palette' });
    const themePicker = themeGroup.createDiv({
      cls: 'stratify-theme-picker',
      attr: { role: 'radiogroup', 'aria-label': 'Theme palette' }
    });
    const themeButtons = new Map<ThemeId, HTMLButtonElement>();
    const syncThemeButtons = (): void => {
      for (const [id, button] of themeButtons) {
        const selected = id === overlay._stratifyTheme;
        button.classList.toggle('stratify-theme-option-active', selected);
        button.setAttribute('aria-checked', String(selected));
      }
    };
    for (const id of objectKeys(THEMES)) {
      const theme = THEMES[id];
      const button = themePicker.createEl('button', {
        cls: 'stratify-theme-option',
        attr: {
          type: 'button',
          role: 'radio',
          'aria-checked': String(id === overlay._stratifyTheme),
          title: theme.description || theme.name
        }
      });
      button.createSpan({ cls: 'stratify-theme-option-name', text: theme.name });
      const swatches = button.createSpan({ cls: 'stratify-theme-swatches', attr: { 'aria-hidden': 'true' } });
      [theme.rootFill].concat(theme.palette.slice(0, 6)).forEach((color) => {
        const swatch = swatches.createSpan({ cls: 'stratify-theme-swatch' });
        swatch.style.setProperty('--stratify-swatch-color', color);
      });
      button.onclick = () => {
        if (id === overlay._stratifyTheme) return;
        this._applyThemeToOverlay(overlay, id);
        syncThemeButtons();
        if (overlay._stratifyTreeInfo) this._renderTreeIntoCanvas(overlay, true);
        void this._persistFrontmatterValue(file, 'mindmap-theme', id);
      };
      themeButtons.set(id, button);
    }
    syncThemeButtons();

    const lineGroup = morePanel.createDiv({ cls: 'stratify-toolbar-group stratify-toolbar-field' });
    lineGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Line' });
    const lineSelect = lineGroup.createEl('select', { cls: 'stratify-select' });
    for (const id of objectKeys(LINE_STYLES)) {
      const opt = lineSelect.createEl('option', { value: id, text: LINE_STYLES[id].name });
      if (id === overlay._stratifyLine) opt.selected = true;
    }
    lineSelect.onchange = () => {
      const id = this._normalizeLine(lineSelect.value);
      if (!id || id === overlay._stratifyLine) return;
      overlay._stratifyLine = id;
      if (overlay._stratifyTreeInfo) this._renderTreeIntoCanvas(overlay, true);
      void this._persistFrontmatterValue(file, 'mindmap-line', id);
    };

    const nodeGroup = morePanel.createDiv({ cls: 'stratify-toolbar-group stratify-toolbar-field' });
    nodeGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Node' });
    const nodeSelect = nodeGroup.createEl('select', { cls: 'stratify-select' });
    for (const id of objectKeys(NODE_STYLES)) {
      const opt = nodeSelect.createEl('option', { value: id, text: NODE_STYLES[id].name });
      if (id === overlay._stratifyNodeStyle) opt.selected = true;
    }
    nodeSelect.onchange = () => {
      const id = this._normalizeNodeStyle(nodeSelect.value);
      if (!id || id === overlay._stratifyNodeStyle) return;
      this._applyNodeStyleToOverlay(overlay, id);
      if (overlay._stratifyTreeInfo) this._renderTreeIntoCanvas(overlay, true);
      void this._persistFrontmatterValue(file, 'mindmap-node', id);
    };

    const mobileZoomGroup = morePanel.createDiv({
      cls: 'stratify-toolbar-field stratify-mobile-only stratify-mobile-zoom'
    });
    mobileZoomGroup.createSpan({ cls: 'stratify-toolbar-label', text: 'Zoom' });
    const mobileZoomActions = mobileZoomGroup.createDiv({ cls: 'stratify-mobile-zoom-actions' });
    const mobileZoomOutBtn = makeIconButton(mobileZoomActions, 'minus', 'Zoom out');
    const mobileZoomInBtn = makeIconButton(mobileZoomActions, 'plus', 'Zoom in');

    const exportBtn = morePanel.createEl('button', {
      cls: 'stratify-btn stratify-menu-action',
      attr: { type: 'button' }
    });
    obsidian.setIcon(exportBtn, 'download');
    exportBtn.createSpan({ text: 'Export PNG' });
    exportBtn.onclick = () => this._exportPNG(overlay);

    if (!treeInfo.tree) {
      const empty = overlay.createDiv({ cls: 'stratify-empty' });
      const emptyIcon = empty.createDiv({ cls: 'stratify-empty-icon' });
      obsidian.setIcon(emptyIcon, 'network');
      const msg = empty.createDiv();
      if (this._hasSourceOnlyContent(parsed)) {
        msg.setText('No supported mindmap nodes were found. Markdown-only content remains preserved in the source.');
      } else if (structureId === 'list') {
        msg.appendText('Add nested list items (e.g. ');
        msg.createEl('code', { text: '- root' });
        msg.appendText(', ');
        msg.createEl('code', { text: '  - branch' });
        msg.appendText(') to render the mind map.');
      } else if (structureId === 'hybrid') {
        msg.appendText('Add headings or nested list items (e.g. ');
        msg.createEl('code', { text: '# Title' });
        msg.appendText(', ');
        msg.createEl('code', { text: '- branch' });
        msg.appendText(') to render the mind map.');
      } else {
        msg.appendText('Add headings (e.g. ');
        msg.createEl('code', { text: '# Title' });
        msg.appendText(', ');
        msg.createEl('code', { text: '## Branch' });
        msg.appendText(') to render the mind map.');
      }
      return;
    }

    const canvas = overlay.createDiv({ cls: 'stratify-canvas' }) as StratifyCanvasElement;
    const inner = canvas.createDiv({ cls: 'stratify-inner' });
    const svg = inner.createSvg('svg', { cls: 'stratify-svg' });
    const nodesLayer = inner.createDiv({ cls: 'stratify-nodes' });
    canvas._stratify = { tx: 0, ty: 0, scale: 1 };

    overlay._stratifyCanvas = canvas;
    overlay._stratifyInner = inner;
    overlay._stratifySvg = svg;
    overlay._stratifyNodesLayer = nodesLayer;

    this._bindPanZoom(canvas, inner, overlay);
    this._bindCanvasClick(canvas, overlay);

    fitBtn.onclick = () => this._fitTo(canvas, inner);
    zoomInBtn.onclick = () => this._zoomBy(canvas, inner, 1.2);
    zoomOutBtn.onclick = () => this._zoomBy(canvas, inner, 1 / 1.2);
    mobileZoomInBtn.onclick = () => this._zoomBy(canvas, inner, 1.2);
    mobileZoomOutBtn.onclick = () => this._zoomBy(canvas, inner, 1 / 1.2);

    this._renderTreeIntoCanvas(overlay, false);
  }

  _renderTreeIntoCanvas(overlay: StratifyOverlayElement, preserveTransform: boolean): void {
    const canvas = overlay._stratifyCanvas;
    const inner = overlay._stratifyInner;
    const svg = overlay._stratifySvg;
    const nodesLayer = overlay._stratifyNodesLayer;
    const treeInfo = overlay._stratifyTreeInfo;
    const tree = treeInfo && treeInfo.tree;
    if (!tree || !canvas || !inner || !svg || !nodesLayer) return;

    const savedTransform = preserveTransform ? { ...canvas._stratify } : null;

    nodesLayer.empty();
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const theme = THEMES[this._normalizeTheme(overlay._stratifyTheme) || DEFAULT_THEME];
    this._assignColors(tree, theme.palette, theme.rootAccent);
    this._createNodes(tree, nodesLayer, overlay);

    (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
      const measureScale = (canvas._stratify && canvas._stratify.scale) || 1;
      this._measureNodes(tree, measureScale);
      const layout = this._normalizeLayout(overlay._stratifyLayout) || DEFAULT_LAYOUT;
      const line = this._normalizeLine(overlay._stratifyLine) || DEFAULT_LINE;
      this._layoutTree(tree, layout, overlay);
      const bounds = this._computeBounds(tree);
      const w = bounds.maxX - bounds.minX + PAD * 2;
      const h = bounds.maxY - bounds.minY + PAD * 2;
      this._shiftTree(tree, PAD - bounds.minX, PAD - bounds.minY);
      this._applyNodePositions(tree);
      inner.style.width = w + 'px';
      inner.style.height = h + 'px';
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this._drawConnections(tree, svg, layout, line);

      if (savedTransform) {
        canvas._stratify = savedTransform;
        this._applyTransform(inner, savedTransform);
      } else {
        this._fitTo(canvas, inner);
      }

      if (overlay._stratifySelected && overlay._stratifySelected._el) {
        overlay._stratifySelected._el.classList.add('stratify-selected');
        overlay._stratifySelected._el.focus({ preventScroll: true });
      }
      if (overlay._stratifyPendingEdit) {
        const node = overlay._stratifyPendingEdit;
        overlay._stratifyPendingEdit = null;
        if (node && node._el) this._startEdit(overlay, node);
      }
    });
  }

  _createNodes(node: MindmapNode, layer: HTMLDivElement, overlay: StratifyOverlayElement): void {
    const el = layer.createDiv({ cls: 'stratify-node stratify-node-d' + node.depth }) as StratifyNodeElement;
    const titleParts: string[] = [];
    if (node.depth === 0) el.classList.add('stratify-node-root');
    if (node.isVirtual) el.classList.add('stratify-node-virtual');
    if (node.bodyRaw && node.bodyRaw.trim()) {
      el.classList.add('stratify-node-source-note');
      titleParts.push('Contains Markdown-only content preserved with this node');
    }
    if (node.collapsed && node.children.length) {
      el.classList.add('stratify-collapsed');
      titleParts.push(node.children.length + ' hidden — Space to expand');
    }
    if (titleParts.length) el.title = titleParts.join('\n');
    el.style.setProperty('--stratify-color', node.color);
    el.tabIndex = 0;
    if (node.collapsed && node.children.length) {
      const textSpan = el.createSpan({ cls: 'stratify-node-text' });
      this._renderNodeContent(textSpan, node, overlay);
      el.createSpan({ cls: 'stratify-collapse-badge' });
    } else {
      this._renderNodeContent(el, node, overlay);
    }
    node._el = el;
    this._attachNodeHandlers(el, node, overlay);
    if (node.collapsed && node.children.length) return;
    for (const child of node.children) this._createNodes(child, layer, overlay);
  }

  // ────────────────────────────────────────────────────────────────
  // Interaction: click to select, double-click to edit, keyboard
  // shortcuts for editing and structural changes.
  // ────────────────────────────────────────────────────────────────

  _attachNodeHandlers(el: StratifyNodeElement, node: MindmapNode, overlay: StratifyOverlayElement): void {
    el._stratifyNode = node;
    el.addEventListener('mousedown', (e) => {
      if (el.isContentEditable) return;
      e.stopPropagation();
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (overlay._stratifySuppressNodeClick) {
        e.preventDefault();
        overlay._stratifySuppressNodeClick = false;
        return;
      }
      if (el.isContentEditable) return;
      if (e.target instanceof Element && e.target.closest('.stratify-link')) return;
      this._selectNode(overlay, node, true);
    });
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this._startEdit(overlay, node);
    });
    el.addEventListener('contextmenu', (e) => {
      this._showNodeContextMenu(overlay, node, e);
    });
    this._attachNodeDragHandlers(el, node, overlay);
    el.addEventListener('keydown', (e) => {
      if (el.isContentEditable) {
        if (overlay._stratifyMention && this._handleMentionKeydown(overlay, e)) return;
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          const text = el.textContent;
          this._updateNodeText(node, text);
          this._exitEditMode(overlay, node);
          if (node.dirty) {
            this._pushUndoSnapshot(overlay, overlay._stratifyEditSnapshot);
            overlay._stratifyEditSnapshot = null;
            void this._persistAndRelayout(overlay);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const text = el.textContent;
          this._updateNodeText(node, text);
          this._exitEditMode(overlay, node);
          const undoSnapshot = overlay._stratifyEditSnapshot;
          overlay._stratifyEditSnapshot = null;
          this._addChild(overlay, node, true, undoSnapshot);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this._cancelEdit(overlay, node);
        }
      } else if (this._handleStructureKeydown(overlay, node, e)) {
        return;
      } else {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (node.depth !== 0) this._addSibling(overlay, node, true);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this._addChild(overlay, node, true);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          this._deleteNode(overlay, node);
        } else if (e.key === 'F2') {
          e.preventDefault();
          this._startEdit(overlay, node);
        } else if (e.key === ' ') {
          e.preventDefault();
          this._toggleCollapse(overlay, node);
        }
      }
    });
  }

  _selectNode(overlay: StratifyOverlayElement, node: MindmapNode, focus: boolean): void {
    if (overlay._stratifySelected && overlay._stratifySelected !== node && overlay._stratifySelected._el) {
      overlay._stratifySelected._el.classList.remove('stratify-selected');
    }
    overlay._stratifySelected = node;
    if (node && node._el) {
      node._el.classList.add('stratify-selected');
      if (focus) node._el.focus({ preventScroll: false });
    }
  }

  _startEdit(overlay: StratifyOverlayElement, node: MindmapNode): void {
    if (!node || !node._el) return;
    if (node.isVirtual) return;
    if (node.collapsed && node.children && node.children.length) {
      this._pushUndoSnapshot(overlay);
      node.collapsed = false;
      overlay._stratifyPendingEdit = node;
      void this._persistAndRelayout(overlay);
      return;
    }
    const el = node._el;
    if (el.isContentEditable) return;
    if (overlay._stratifyEditingNode && overlay._stratifyEditingNode !== node) {
      this._cancelEdit(overlay, overlay._stratifyEditingNode);
    }
    this._selectNode(overlay, node, false);
    overlay._stratifyEditingNode = node;
    overlay._stratifyEditSnapshot = this._currentMindmapContent(overlay);
    el.textContent = node.rawText || node.text || PLACEHOLDER;
    el.contentEditable = 'true';
    el.classList.add('stratify-editing');
    el.spellcheck = false;
    el.focus({ preventScroll: false });
    const range = el.ownerDocument.createRange();
    range.selectNodeContents(el);
    const sel = el.ownerDocument.defaultView?.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const onBlur = () => {
      el.removeEventListener('blur', onBlur);
      if (overlay._stratifyEditingBlur === onBlur) overlay._stratifyEditingBlur = null;
      if (!el.isContentEditable) return;
      const text = el.textContent;
      const had = node.rawText || node.text;
      this._updateNodeText(node, text);
      this._exitEditMode(overlay, node);
      if ((node.rawText || node.text) !== had) {
        this._pushUndoSnapshot(overlay, overlay._stratifyEditSnapshot);
        overlay._stratifyEditSnapshot = null;
        void this._persistAndRelayout(overlay);
      }
    };
    el.addEventListener('blur', onBlur);
    overlay._stratifyEditingBlur = onBlur;

    const onInput = () => this._updateMentionPopup(overlay);
    el.addEventListener('input', onInput);
    overlay._stratifyMentionInput = onInput;
  }

  _exitEditMode(overlay: StratifyOverlayElement, node: MindmapNode): void {
    const el = node._el;
    if (!el) return;
    this._closeMentionPopup(overlay);
    if (overlay._stratifyEditingBlur) {
      el.removeEventListener('blur', overlay._stratifyEditingBlur);
      overlay._stratifyEditingBlur = null;
    }
    if (overlay._stratifyMentionInput) {
      el.removeEventListener('input', overlay._stratifyMentionInput);
      overlay._stratifyMentionInput = null;
    }
    el.contentEditable = 'false';
    el.classList.remove('stratify-editing');
    if (overlay._stratifyEditingNode === node) overlay._stratifyEditingNode = null;
    this._renderNodeContent(el, node, overlay);
  }

  _updateNodeText(node: MindmapNode, newText: string | null): void {
    const text = (newText || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const hadRaw = node.rawText || node.text;
    if (text !== hadRaw) {
      node.rawText = text;
      node.text = this._stripInline(text);
      node.dirty = true;
    }
  }

  _cancelEdit(overlay: StratifyOverlayElement, node: MindmapNode): void {
    overlay._stratifyEditSnapshot = null;
    this._exitEditMode(overlay, node);
  }

  _currentMindmapContent(overlay: StratifyOverlayElement): string {
    if (overlay && overlay._stratifyParsed && overlay._stratifyTreeInfo) {
      return this._serializeMindmap(overlay._stratifyParsed, overlay._stratifyTreeInfo, overlay._stratifyStructure);
    }
    return (overlay && overlay._stratifyLastContent) || '';
  }

  _pushUndoSnapshot(overlay: StratifyOverlayElement, content: string | null = null): void {
    if (!overlay) return;
    const snapshot = content || this._currentMindmapContent(overlay);
    if (!snapshot) return;
    if (!overlay._stratifyUndoStack) overlay._stratifyUndoStack = [];
    if (overlay._stratifyUndoStack[overlay._stratifyUndoStack.length - 1] === snapshot) return;
    overlay._stratifyUndoStack.push(snapshot);
    if (overlay._stratifyUndoStack.length > 50) overlay._stratifyUndoStack.shift();
    overlay._stratifyRedoStack = [];
  }

  _pushRedoSnapshot(overlay: StratifyOverlayElement, content: string | null = null): void {
    if (!overlay) return;
    const snapshot = content || this._currentMindmapContent(overlay);
    if (!snapshot) return;
    if (!overlay._stratifyRedoStack) overlay._stratifyRedoStack = [];
    if (overlay._stratifyRedoStack[overlay._stratifyRedoStack.length - 1] === snapshot) return;
    overlay._stratifyRedoStack.push(snapshot);
    if (overlay._stratifyRedoStack.length > 50) overlay._stratifyRedoStack.shift();
  }

  _pushUndoSnapshotForRedo(overlay: StratifyOverlayElement, content: string | null = null): void {
    if (!overlay) return;
    const snapshot = content || this._currentMindmapContent(overlay);
    if (!snapshot) return;
    if (!overlay._stratifyUndoStack) overlay._stratifyUndoStack = [];
    if (overlay._stratifyUndoStack[overlay._stratifyUndoStack.length - 1] === snapshot) return;
    overlay._stratifyUndoStack.push(snapshot);
    if (overlay._stratifyUndoStack.length > 50) overlay._stratifyUndoStack.shift();
  }

  async _undoMindmap(overlay: StratifyOverlayElement): Promise<boolean> {
    if (!overlay || !overlay._stratifyFile) return false;
    const stack = overlay._stratifyUndoStack || [];
    const content = stack.pop();
    if (!content) {
      new obsidian.Notice(this._isZh() ? '没有可回退的导图操作' : 'No mindmap action to undo');
      return false;
    }
    const file = overlay._stratifyFile;
    const view = overlay._stratifyView;
    if (!(view instanceof obsidian.MarkdownView)) return false;
    const frontmatter = this._splitFrontmatter(content).frontmatter || {};
    try {
      this._pushRedoSnapshot(overlay);
      overlay._stratifyWriting = true;
      overlay._stratifyStructure = null;
      overlay._stratifySelected = null;
      overlay._stratifyPendingEdit = null;
      overlay._stratifyEditSnapshot = null;
      await this._writeMindmapContent(overlay, content);
      this._render(overlay, content, frontmatter, file.basename, view, file);
      new obsidian.Notice(this._isZh() ? '已回退上一步导图操作' : 'Undid last mindmap action');
      return true;
    } catch (error: unknown) {
      console.error('[StratifyMindmap] undo error', error);
      new obsidian.Notice('Failed to undo mindmap action: ' + errorMessage(error));
      return false;
    } finally {
      (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
        overlay._stratifyWriting = false;
      });
    }
  }

  async _redoMindmap(overlay: StratifyOverlayElement): Promise<boolean> {
    if (!overlay || !overlay._stratifyFile) return false;
    const stack = overlay._stratifyRedoStack || [];
    const content = stack.pop();
    if (!content) {
      new obsidian.Notice(this._isZh() ? '没有可重做的导图操作' : 'No mindmap action to redo');
      return false;
    }
    const file = overlay._stratifyFile;
    const view = overlay._stratifyView;
    if (!(view instanceof obsidian.MarkdownView)) return false;
    const frontmatter = this._splitFrontmatter(content).frontmatter || {};
    try {
      this._pushUndoSnapshotForRedo(overlay);
      overlay._stratifyWriting = true;
      overlay._stratifyStructure = null;
      overlay._stratifySelected = null;
      overlay._stratifyPendingEdit = null;
      overlay._stratifyEditSnapshot = null;
      await this._writeMindmapContent(overlay, content);
      this._render(overlay, content, frontmatter, file.basename, view, file);
      new obsidian.Notice(this._isZh() ? '已重做导图操作' : 'Redid mindmap action');
      return true;
    } catch (error: unknown) {
      console.error('[StratifyMindmap] redo error', error);
      new obsidian.Notice('Failed to redo mindmap action: ' + errorMessage(error));
      return false;
    } finally {
      (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
        overlay._stratifyWriting = false;
      });
    }
  }

  _isMovableNode(node: MindmapNode | null | undefined): node is MindmapNode & { parent: MindmapNode } {
    return Boolean(node && !node.isVirtual && node.parent);
  }

  _isAncestorNode(ancestor: MindmapNode, node: MindmapNode): boolean {
    let cur = node.parent;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parent;
    }
    return false;
  }

  _attachNodeDragHandlers(
    el: StratifyNodeElement,
    node: MindmapNode,
    overlay: StratifyOverlayElement
  ): void {
    el.addEventListener('pointerdown', (e) => {
      this._beginNodePointerDrag(e, el, node, overlay);
    });
  }

  _beginNodePointerDrag(
    e: PointerEvent,
    el: StratifyNodeElement,
    node: MindmapNode,
    overlay: StratifyOverlayElement
  ): void {
    if (!this._isMovableNode(node) || el.isContentEditable ||
        (e.target instanceof Element && e.target.closest('.stratify-link'))) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (overlay._stratifyPointerDrag) return;

    const rect = el.getBoundingClientRect();
    const ownerWindow = el.ownerDocument.defaultView || window;
    const drag: NodePointerDrag = {
      overlay,
      node,
      sourceEl: el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      active: false,
      ghost: null,
      frame: null,
      target: null,
      action: null,
      cleanup: null,
      ownerWindow,
    };

    const onMove = (moveEvent: PointerEvent): void => {
      if (moveEvent.pointerId !== drag.pointerId) return;
      this._updateNodePointerDrag(drag, moveEvent);
    };
    const onUp = (upEvent: PointerEvent): void => {
      if (upEvent.pointerId !== drag.pointerId) return;
      this._finishNodePointerDrag(drag, true);
    };
    const onCancel = (cancelEvent: PointerEvent): void => {
      if (cancelEvent.pointerId !== drag.pointerId) return;
      this._finishNodePointerDrag(drag, false);
    };
    const onWindowBlur = () => this._finishNodePointerDrag(drag, false);
    drag.cleanup = () => {
      ownerWindow.removeEventListener('pointermove', onMove);
      ownerWindow.removeEventListener('pointerup', onUp);
      ownerWindow.removeEventListener('pointercancel', onCancel);
      ownerWindow.removeEventListener('blur', onWindowBlur);
    };

    overlay._stratifyPointerDrag = drag;
    ownerWindow.addEventListener('pointermove', onMove, { passive: false });
    ownerWindow.addEventListener('pointerup', onUp);
    ownerWindow.addEventListener('pointercancel', onCancel);
    ownerWindow.addEventListener('blur', onWindowBlur);
  }

  _updateNodePointerDrag(drag: NodePointerDrag, e: PointerEvent): void {
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      this._startNodePointerDrag(drag);
    }
    e.preventDefault();
    this._scheduleNodeDragFrame(drag);
  }

  _startNodePointerDrag(drag: NodePointerDrag): void {
    drag.active = true;
    drag.overlay._stratifyDragNode = drag.node;
    drag.overlay.classList.add('stratify-node-dragging');
    drag.sourceEl.classList.add('stratify-drag-source');
    this._selectNode(drag.overlay, drag.node, false);

    const ghost = drag.sourceEl.cloneNode(true) as HTMLElement;
    ghost.classList.remove('stratify-selected', 'stratify-drop-before', 'stratify-drop-after', 'stratify-drop-child');
    ghost.classList.add('stratify-drag-ghost');
    ghost.removeAttribute('tabindex');
    ghost.style.width = drag.width + 'px';
    ghost.style.height = drag.height + 'px';
    drag.sourceEl.ownerDocument.body.appendChild(ghost);
    drag.ghost = ghost;
    this._scheduleNodeDragFrame(drag);
  }

  _scheduleNodeDragFrame(drag: NodePointerDrag): void {
    if (drag.frame) return;
    drag.frame = drag.ownerWindow.requestAnimationFrame(() => {
      drag.frame = null;
      this._renderNodeDragFrame(drag);
    });
  }

  _renderNodeDragFrame(drag: NodePointerDrag): void {
    if (!drag.active) return;
    if (drag.ghost) {
      const x = drag.lastX - drag.offsetX;
      const y = drag.lastY - drag.offsetY;
      drag.ghost.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
    }
    const hit = this._getDropHit(drag.overlay, drag.node, drag.sourceEl, drag.lastX, drag.lastY);
    drag.target = hit?.target || null;
    drag.action = hit?.action || null;
    if (drag.target && drag.action && drag.target._el) {
      this._showDropIndicator(drag.overlay, drag.target._el, drag.action);
    } else {
      this._clearDropIndicators(drag.overlay);
    }
  }

  _finishNodePointerDrag(drag: NodePointerDrag, commit: boolean): void {
    if (!drag || drag.overlay._stratifyPointerDrag !== drag) return;
    if (drag.cleanup) drag.cleanup();
    if (drag.frame) drag.ownerWindow.cancelAnimationFrame(drag.frame);
    if (drag.ghost) drag.ghost.remove();
    drag.sourceEl.classList.remove('stratify-drag-source');
    drag.overlay.classList.remove('stratify-node-dragging');
    drag.overlay._stratifyPointerDrag = null;
    drag.overlay._stratifyDragNode = null;
    this._clearDropIndicators(drag.overlay);

    if (drag.active) {
      drag.overlay._stratifySuppressNodeClick = true;
      drag.ownerWindow.setTimeout(() => {
        if (drag.overlay) drag.overlay._stratifySuppressNodeClick = false;
      }, 0);
    }
    if (commit && drag.active && drag.target && drag.action) {
      this._moveDroppedNode(drag.overlay, drag.node, drag.target, drag.action);
    }
  }

  _getDropAction(e: PointerEvent, dragNode: MindmapNode, targetNode: MindmapNode): DropAction | null {
    return this._getDropActionAt(e.clientX, e.clientY, dragNode, targetNode);
  }

  _getDropActionAt(
    clientX: number,
    clientY: number,
    dragNode: MindmapNode,
    targetNode: MindmapNode,
    overlay: StratifyOverlayElement | null = null
  ): DropAction | null {
    if (!this._isMovableNode(dragNode) || !targetNode || targetNode.isVirtual) return null;
    if (dragNode === targetNode || this._isAncestorNode(dragNode, targetNode)) return null;
    const rect = targetNode._el && targetNode._el.getBoundingClientRect();
    if (!rect || rect.height <= 0) return 'child';
    if (this._isLeafOutsideDrop(clientX, clientY, targetNode, rect, overlay)) return 'child';
    if (!targetNode.parent) return 'child';
    const y = (clientY - rect.top) / rect.height;
    return y < 0.5 ? 'before' : 'after';
  }

  _getDropHit(
    overlay: StratifyOverlayElement,
    dragNode: MindmapNode,
    sourceEl: StratifyNodeElement,
    clientX: number,
    clientY: number
  ): { target: MindmapNode; action: DropAction } | null {
    const directTarget = this._getDirectDropTarget(overlay, sourceEl, clientX, clientY);
    if (directTarget) {
      const action = this._getDropActionAt(clientX, clientY, dragNode, directTarget, overlay);
      if (action) return { target: directTarget, action };
    }
    const nearestTarget = this._getNearestDropTarget(overlay, dragNode, sourceEl, clientX, clientY);
    if (!nearestTarget) return null;
    const action = this._getDropActionAt(clientX, clientY, dragNode, nearestTarget, overlay);
    return action ? { target: nearestTarget, action } : null;
  }

  _isLeafOutsideDrop(
    clientX: number,
    clientY: number,
    targetNode: MindmapNode,
    rect: DOMRect,
    overlay: StratifyOverlayElement | null
  ): boolean {
    if (this._getSetting('leafOutsideDropCreatesChild') === false) return false;
    if (!targetNode || targetNode.collapsed || (targetNode.children && targetNode.children.length > 0)) return false;
    const verticalPadding = Math.max(8, rect.height * 0.25);
    if (clientY < rect.top + verticalPadding || clientY > rect.bottom - verticalPadding) return false;
    const side = this._getChildDropSide(targetNode, overlay, clientX, rect);
    const edgePad = Math.min(24, Math.max(10, rect.width * 0.25));
    const outsideReach = Math.max(80, rect.width);
    if (side === 'left') {
      return clientX <= rect.left + edgePad && clientX >= rect.left - outsideReach;
    }
    return clientX >= rect.right - edgePad && clientX <= rect.right + outsideReach;
  }

  _getChildDropSide(
    targetNode: MindmapNode,
    overlay: StratifyOverlayElement | null,
    clientX: number,
    rect: DOMRect
  ): BranchSide {
    const layout = (overlay && overlay._stratifyLayout) || 'balanced';
    if (layout === 'left') return 'left';
    if (layout === 'right' || layout === 'tree' || layout === 'radial') return 'right';
    if (targetNode && targetNode._side === 'left') return 'left';
    if (targetNode && targetNode._side === 'right') return 'right';
    return clientX < rect.left + rect.width / 2 ? 'left' : 'right';
  }

  _getDirectDropTarget(
    overlay: StratifyOverlayElement,
    sourceEl: StratifyNodeElement,
    clientX: number,
    clientY: number
  ): MindmapNode | null {
    const el = overlay.ownerDocument.elementFromPoint(clientX, clientY);
    const nodeEl = el && el.closest && el.closest('.stratify-node');
    if (!nodeEl || nodeEl === sourceEl || !overlay.contains(nodeEl)) return null;
    return (nodeEl as StratifyNodeElement)._stratifyNode || null;
  }

  _getNearestDropTarget(
    overlay: StratifyOverlayElement,
    dragNode: MindmapNode,
    sourceEl: StratifyNodeElement,
    clientX: number,
    clientY: number
  ): MindmapNode | null {
    let best: MindmapNode | null = null;
    let bestScore = Infinity;
    overlay.querySelectorAll<StratifyNodeElement>('.stratify-node').forEach((el) => {
      if (el === sourceEl) return;
      const targetNode = el._stratifyNode;
      if (!targetNode || targetNode.isVirtual) return;
      if (targetNode === dragNode || this._isAncestorNode(dragNode, targetNode)) return;
      const rect = el.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const dx = clientX < rect.left ? rect.left - clientX : (clientX > rect.right ? clientX - rect.right : 0);
      const dy = clientY < rect.top ? rect.top - clientY : (clientY > rect.bottom ? clientY - rect.bottom : 0);
      if (dy > 54 || dx > 120) return;
      let score = (dy * 2) + dx;
      if (dragNode.parent && dragNode.parent === targetNode.parent) score -= 32;
      if (score < bestScore) {
        bestScore = score;
        best = targetNode;
      }
    });
    return best;
  }

  _showDropIndicator(
    overlay: StratifyOverlayElement,
    el: StratifyNodeElement,
    action: DropAction
  ): void {
    this._clearDropIndicators(overlay);
    el.classList.add('stratify-drop-' + action);
  }

  _clearDropIndicators(overlay: StratifyOverlayElement): void {
    if (!overlay) return;
    overlay.querySelectorAll('.stratify-drop-before, .stratify-drop-after, .stratify-drop-child').forEach((el) => {
      el.classList.remove('stratify-drop-before', 'stratify-drop-after', 'stratify-drop-child');
    });
  }

  _moveDroppedNode(
    overlay: StratifyOverlayElement,
    node: MindmapNode,
    target: MindmapNode,
    action: DropAction
  ): boolean {
    if (action === 'before') return this._moveNodeRelative(overlay, node, target, 'before');
    if (action === 'after') return this._moveNodeRelative(overlay, node, target, 'after');
    return this._moveNodeAsChild(overlay, node, target);
  }

  _detachNode(node: MindmapNode): boolean {
    if (!node || !node.parent) return false;
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    if (idx < 0) return false;
    siblings.splice(idx, 1);
    return true;
  }

  _insertNodeAt(node: MindmapNode, parent: MindmapNode, index: number): boolean {
    if (!node || !parent || !parent.children) return false;
    const safeIndex = Math.max(0, Math.min(index, parent.children.length));
    parent.children.splice(safeIndex, 0, node);
    node.parent = parent;
    return true;
  }

  _persistMove(overlay: StratifyOverlayElement, node: MindmapNode): boolean {
    overlay._stratifySelected = node;
    overlay._stratifyPendingEdit = null;
    void this._persistAndRelayout(overlay);
    return true;
  }

  _moveNodeRelative(
    overlay: StratifyOverlayElement,
    node: MindmapNode,
    target: MindmapNode,
    placement: 'before' | 'after'
  ): boolean {
    if (!this._isMovableNode(node) || !target || !target.parent) return false;
    if (node === target || this._isAncestorNode(node, target)) return false;
    const targetParent = target.parent;
    const oldParent = node.parent;
    const oldIndex = oldParent.children.indexOf(node);
    let targetIndex = targetParent.children.indexOf(target);
    if (oldIndex < 0 || targetIndex < 0) return false;
    const finalIndex = targetIndex + (placement === 'after' ? 1 : 0);
    if (oldParent === targetParent && (oldIndex === finalIndex || oldIndex + 1 === finalIndex)) return false;
    this._pushUndoSnapshot(overlay);
    if (oldParent === targetParent && oldIndex < targetIndex) targetIndex -= 1;
    if (!this._detachNode(node)) return false;
    if (placement === 'after') targetIndex += 1;
    this._insertNodeAt(node, targetParent, targetIndex);
    return this._persistMove(overlay, node);
  }

  _moveNodeAsChild(overlay: StratifyOverlayElement, node: MindmapNode, target: MindmapNode): boolean {
    if (!this._isMovableNode(node) || !target || target.isVirtual) return false;
    if (node === target || this._isAncestorNode(node, target)) return false;
    this._pushUndoSnapshot(overlay);
    if (!this._detachNode(node)) return false;
    if (target.collapsed) target.collapsed = false;
    this._insertNodeAt(node, target, target.children.length);
    return this._persistMove(overlay, node);
  }

  _moveNodeWithinSiblings(overlay: StratifyOverlayElement, node: MindmapNode, delta: number): boolean {
    if (!this._isMovableNode(node)) return false;
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    const next = idx + delta;
    if (idx < 0 || next < 0 || next >= siblings.length) return false;
    this._pushUndoSnapshot(overlay);
    siblings.splice(idx, 1);
    siblings.splice(next, 0, node);
    return this._persistMove(overlay, node);
  }

  _promoteNode(overlay: StratifyOverlayElement, node: MindmapNode): boolean {
    if (!this._isMovableNode(node)) return false;
    const treeInfo = overlay._stratifyTreeInfo;
    const parent = node.parent;
    if (parent.isVirtual) return false;
    if (!parent.parent) {
      if (!treeInfo || treeInfo.tree !== parent) return false;
      this._pushUndoSnapshot(overlay);
      const fileName = (overlay._stratifyFile && overlay._stratifyFile.basename) || 'Mind Map';
      const virtualRoot = {
        level: (parent.level || treeInfo.baseLevel || 1) - 1,
        rawText: fileName,
        text: fileName,
        children: [parent],
        parent: null,
        bodyRaw: '',
        dirty: false,
        isNew: false,
        collapsed: false,
        isVirtual: true,
        color: '',
        depth: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        _sth: 0,
        _stw: 0,
      };
      parent.parent = virtualRoot;
      treeInfo.tree = virtualRoot;
      treeInfo.virtualRoot = true;
    } else {
      this._pushUndoSnapshot(overlay);
    }
    const grandparent = parent.parent;
    if (!grandparent) return false;
    const parentIndex = grandparent.children.indexOf(parent);
    if (parentIndex < 0 || !this._detachNode(node)) return false;
    this._insertNodeAt(node, grandparent, parentIndex + 1);
    return this._persistMove(overlay, node);
  }

  _demoteNode(overlay: StratifyOverlayElement, node: MindmapNode): boolean {
    if (!this._isMovableNode(node)) return false;
    const siblings = node.parent.children;
    const idx = siblings.indexOf(node);
    if (idx <= 0) return false;
    const newParent = siblings[idx - 1];
    if (!newParent || newParent.isVirtual || this._isAncestorNode(node, newParent)) return false;
    this._pushUndoSnapshot(overlay);
    if (!this._detachNode(node)) return false;
    if (newParent.collapsed) newParent.collapsed = false;
    this._insertNodeAt(node, newParent, newParent.children.length);
    return this._persistMove(overlay, node);
  }

  _handleStructureKeydown(
    overlay: StratifyOverlayElement,
    node: MindmapNode,
    e: KeyboardEvent
  ): boolean {
    const key = String(e.key).toLowerCase();
    if (this._getSetting('keyboardNavigation') !== false &&
        !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey &&
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      this._selectNodeByArrow(overlay, node, key);
      return true;
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 'z') {
      e.preventDefault();
      void this._redoMindmap(overlay);
      return true;
    }
    if ((e.metaKey || e.ctrlKey) && key === 'y') {
      e.preventDefault();
      void this._redoMindmap(overlay);
      return true;
    }
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && key === 'z') {
      e.preventDefault();
      void this._undoMindmap(overlay);
      return true;
    }
    if (e.shiftKey && e.key === 'ArrowUp') {
      e.preventDefault();
      this._moveNodeWithinSiblings(overlay, node, -1);
      return true;
    }
    if (e.shiftKey && e.key === 'ArrowDown') {
      e.preventDefault();
      this._moveNodeWithinSiblings(overlay, node, 1);
      return true;
    }
    if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      this._promoteNode(overlay, node);
      return true;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
      e.preventDefault();
      this._promoteNode(overlay, node);
      return true;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
      e.preventDefault();
      this._demoteNode(overlay, node);
      return true;
    }
    return false;
  }

  _selectNodeByArrow(overlay: StratifyOverlayElement, node: MindmapNode, key: string): boolean {
    const target = this._findNodeByArrow(overlay, node, key);
    if (!target) return false;
    this._selectNode(overlay, target, true);
    return true;
  }

  _findNodeByArrow(
    overlay: StratifyOverlayElement,
    node: MindmapNode,
    key: string
  ): MindmapNode | null {
    if (!overlay || !node || !node._el) return null;
    const rect = node._el.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nodes = this._visibleNodes(overlay);
    let best: MindmapNode | null = null;
    let bestScore = Infinity;
    for (const candidate of nodes) {
      if (!candidate || candidate === node || !candidate._el) continue;
      const cRect = candidate._el.getBoundingClientRect();
      if (!cRect || cRect.width <= 0 || cRect.height <= 0) continue;
      const ccx = cRect.left + cRect.width / 2;
      const ccy = cRect.top + cRect.height / 2;
      const dx = ccx - cx;
      const dy = ccy - cy;
      let projection: number;
      let perpendicular: number;
      if (key === 'arrowright') {
        if (dx <= 4) continue;
        projection = dx;
        perpendicular = Math.abs(dy);
      } else if (key === 'arrowleft') {
        if (dx >= -4) continue;
        projection = -dx;
        perpendicular = Math.abs(dy);
      } else if (key === 'arrowdown') {
        if (dy <= 4) continue;
        projection = dy;
        perpendicular = Math.abs(dx);
      } else {
        if (dy >= -4) continue;
        projection = -dy;
        perpendicular = Math.abs(dx);
      }
      let score = projection + perpendicular * 1.8;
      if (node.parent && candidate.parent === node.parent) score -= 20;
      if (candidate.parent === node || node.parent === candidate) score -= 12;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }

  _visibleNodes(overlay: StratifyOverlayElement): MindmapNode[] {
    return Array.from(overlay.querySelectorAll<StratifyNodeElement>('.stratify-node'))
      .map((el) => el._stratifyNode)
      .filter((node): node is MindmapNode => Boolean(node?._el));
  }

  // ─── Wiki-link mention autocomplete ────────────────────────────

  _getMentionQuery(el: StratifyNodeElement): MentionQuery | null {
    const sel = el.ownerDocument.defaultView?.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;
    const textNode = range.startContainer;
    if (textNode.nodeType !== textNode.TEXT_NODE) return null;
    const offset = range.startOffset;
    const text = textNode.textContent || '';
    const before = text.slice(0, offset);
    const openIdx = before.lastIndexOf('[[');
    if (openIdx === -1) return null;
    const after = text.slice(offset);
    if (after.includes(']]')) return null;
    return { query: before.slice(openIdx + 2), openIdx };
  }

  _renderMentionPopup(overlay: StratifyOverlayElement, items: obsidian.TFile[]): void {
    this._closeMentionPopup(overlay);
    const popup = overlay.ownerDocument.body.createDiv({ cls: 'stratify-mention-popup' });
    items.forEach((item, i) => {
      const row = popup.createDiv({ cls: 'stratify-mention-item' });
      if (i === 0) row.classList.add('stratify-mention-active');
      row.textContent = item.basename;
      row.title = item.path;
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._insertMention(overlay, item);
      });
    });

    const node = overlay._stratifyEditingNode;
    if (node && node._el) {
      const rect = node._el.getBoundingClientRect();
      popup.style.setProperty('--stratify-popup-left', rect.left + 'px');
      popup.style.setProperty('--stratify-popup-top', rect.bottom + 4 + 'px');
    }
    overlay._stratifyMention = { popup, index: 0, items };
  }

  _closeMentionPopup(overlay: StratifyOverlayElement): void {
    if (overlay._stratifyMention) {
      overlay._stratifyMention.popup.remove();
      overlay._stratifyMention = null;
    }
  }

  _updateMentionPopup(overlay: StratifyOverlayElement): void {
    const el = overlay._stratifyEditingNode && overlay._stratifyEditingNode._el;
    if (!el || !el.isContentEditable) return;
    const info = this._getMentionQuery(el);
    if (!info) { this._closeMentionPopup(overlay); return; }

    const now = Date.now();
    if (!this._fileCache || now - this._fileCacheTime > 5000) {
      this._fileCache = this.app.vault.getMarkdownFiles();
      this._fileCacheTime = now;
    }
    const files = this._fileCache;
    const q = info.query.toLowerCase();
    let matches: obsidian.TFile[];
    if (q) {
      matches = files.filter(f => f.basename.toLowerCase().includes(q)).slice(0, 30);
    } else {
      matches = [...files].sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 30);
    }
    if (matches.length === 0) { this._closeMentionPopup(overlay); return; }

    this._renderMentionPopup(overlay, matches);
  }

  _insertMention(overlay: StratifyOverlayElement, file: obsidian.TFile): void {
    const node = overlay._stratifyEditingNode;
    if (!node || !node._el) return;
    const el = node._el;
    const info = this._getMentionQuery(el);
    if (!info) { this._closeMentionPopup(overlay); return; }

    // Rebuild text: everything before [[ + query, then insert [[name]], then rest
    const fullText = el.textContent || '';
    const beforeQuery = fullText.slice(0, info.openIdx);
    const queryEnd = info.openIdx + 2 + info.query.length;
    const afterQuery = fullText.slice(queryEnd);
    const insert = '[[' + file.basename + ']]';
    el.textContent = beforeQuery + insert + afterQuery;

    // Place cursor after the inserted link
    const pos = beforeQuery.length + insert.length;
    const range = el.ownerDocument.createRange();
    const textNode = el.firstChild;
    if (textNode) {
      range.setStart(textNode, Math.min(pos, textNode.textContent?.length || 0));
      range.collapse(true);
      const sel = el.ownerDocument.defaultView?.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    this._closeMentionPopup(overlay);
    el.focus();
  }

  _handleMentionKeydown(overlay: StratifyOverlayElement, e: KeyboardEvent): boolean {
    const m = overlay._stratifyMention;
    if (!m) return false;
    const items = m.items;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      m.index = (m.index + 1) % items.length;
      this._highlightMention(m);
      return true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      m.index = (m.index - 1 + items.length) % items.length;
      this._highlightMention(m);
      return true;
    } else if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      this._insertMention(overlay, items[m.index]);
      return true;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._closeMentionPopup(overlay);
      return true;
    }
    return false;
  }

  _highlightMention(m: MentionState): void {
    const rows = m.popup.querySelectorAll('.stratify-mention-item');
    rows.forEach((r, i) => r.classList.toggle('stratify-mention-active', i === m.index));
    rows[m.index] && rows[m.index].scrollIntoView({ block: 'nearest' });
  }

  _toggleCollapse(overlay: StratifyOverlayElement, node: MindmapNode): void {
    if (!node || !node.children || node.children.length === 0) return;
    const file = overlay._stratifyFile;
    const parsed = overlay._stratifyParsed;
    const treeInfo = overlay._stratifyTreeInfo;
    if (!file || !parsed || !treeInfo) return;
    this._pushUndoSnapshot(overlay);
    node.collapsed = !node.collapsed;
    const newContent = this._serializeMindmap(parsed, treeInfo, overlay._stratifyStructure);
    const selPath = overlay._stratifySelected ? this._pathFor(overlay._stratifySelected, treeInfo) : null;
    overlay._stratifyLastContent = newContent;
    overlay._stratifyParsed = this._parseStructured(newContent, overlay._stratifyStructure);
    overlay._stratifyTreeInfo = this._buildTree(overlay._stratifyParsed, file.basename);
    overlay._stratifySelected = selPath ? this._nodeAtPath(overlay._stratifyTreeInfo, selPath) : null;
    this._renderTreeIntoCanvas(overlay, true);
    if (overlay._stratifySelected && overlay._stratifySelected._el) {
      overlay._stratifySelected._el.focus({ preventScroll: true });
    }
    overlay._stratifyWriting = true;
    this._writeMindmapContent(overlay, newContent).then(() => {
      (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
        overlay._stratifyWriting = false;
      });
    }).catch((error: unknown) => {
      overlay._stratifyWriting = false;
      console.error('[StratifyMindmap] collapse persist error', error);
    });
  }

  _newNode(text: string): MindmapNode {
    return {
      text: text || PLACEHOLDER,
      rawText: text || PLACEHOLDER,
      children: [],
      parent: null,
      bodyRaw: '',
      dirty: true,
      isNew: true,
      collapsed: false,
      level: 0,
      color: '',
      depth: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      _sth: 0,
      _stw: 0,
    };
  }

  _addSibling(overlay: StratifyOverlayElement, node: MindmapNode, edit: boolean): void {
    const treeInfo = overlay._stratifyTreeInfo;
    if (!treeInfo || !treeInfo.tree) return;
    if (!node.parent) {
      // True root: promote to virtual root so we can add a sibling.
      if (!treeInfo.virtualRoot) {
        this._pushUndoSnapshot(overlay);
        const oldRoot = treeInfo.tree;
        const fileName = (overlay._stratifyFile && overlay._stratifyFile.basename) || 'Mind Map';
        const virt = {
          level: (oldRoot.level || treeInfo.baseLevel || 1) - 1,
          rawText: fileName,
          text: fileName,
          children: [oldRoot],
          parent: null,
          bodyRaw: '',
          dirty: false,
          isNew: false,
          collapsed: false,
          isVirtual: true,
          color: '',
          depth: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          _sth: 0,
          _stw: 0,
        };
        oldRoot.parent = virt;
        treeInfo.tree = virt;
        treeInfo.virtualRoot = true;
        const newNode = this._newNode('');
        newNode.parent = virt;
        virt.children.push(newNode);
        overlay._stratifyPendingEdit = edit ? newNode : null;
        void this._persistAndRelayout(overlay);
        return;
      }
      return;
    }
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    if (idx < 0) return;
    this._pushUndoSnapshot(overlay);
    const newNode = this._newNode('');
    newNode.parent = parent;
    parent.children.splice(idx + 1, 0, newNode);
    overlay._stratifyPendingEdit = edit ? newNode : null;
    void this._persistAndRelayout(overlay);
  }

  _addChild(
    overlay: StratifyOverlayElement,
    node: MindmapNode,
    edit: boolean,
    undoSnapshot: string | null = null
  ): void {
    this._pushUndoSnapshot(overlay, undoSnapshot);
    if (node.collapsed && node.children && node.children.length) {
      node.collapsed = false;
    }
    const newNode = this._newNode('');
    newNode.parent = node;
    node.children.push(newNode);
    overlay._stratifyPendingEdit = edit ? newNode : null;
    void this._persistAndRelayout(overlay);
  }

  _isZh(): boolean {
    return obsidian.getLanguage().startsWith('zh');
  }

  _showNodeContextMenu(overlay: StratifyOverlayElement, node: MindmapNode, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (node.isVirtual) return;

    const zh = this._isZh();
    const menu = new obsidian.Menu();

    menu.addItem((item) => {
      item.setTitle(zh ? '编辑' : 'Edit')
        .setIcon('pencil')
        .onClick(() => this._startEdit(overlay, node));
    });

    if (node.depth !== 0) {
      menu.addItem((item) => {
        item.setTitle(zh ? '创建同级节点' : 'Add Sibling')
          .setIcon('plus')
          .onClick(() => this._addSibling(overlay, node, true));
      });
    }

    menu.addItem((item) => {
      item.setTitle(zh ? '创建下级节点' : 'Add Child')
        .setIcon('git-branch')
        .onClick(() => this._addChild(overlay, node, true));
    });

    if (node.children && node.children.length) {
      const collapsed = node.collapsed;
      menu.addItem((item) => {
        item.setTitle(zh ? (collapsed ? '展开' : '折叠') : (collapsed ? 'Expand' : 'Collapse'))
          .setIcon(collapsed ? 'chevrons-down' : 'chevrons-up')
          .onClick(() => this._toggleCollapse(overlay, node));
      });
    }

    if (node.parent) {
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle(zh ? '删除' : 'Delete')
          .setIcon('trash')
          .onClick(() => this._deleteNode(overlay, node));
      });
    }

    menu.showAtMouseEvent(e);
  }

  _deleteNode(overlay: StratifyOverlayElement, node: MindmapNode): void {
    const treeInfo = overlay._stratifyTreeInfo;
    if (!treeInfo || !treeInfo.tree) return;
    if (!node) return;
    if (node.isVirtual) return;
    if (!node.parent) {
      new obsidian.Notice(this._isZh() ? '无法删除根节点' : 'Cannot delete the root node');
      return;
    }
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    if (idx < 0) return;
    this._pushUndoSnapshot(overlay);
    if (idx >= 0) parent.children.splice(idx, 1);
    if (overlay._stratifySelected === node) overlay._stratifySelected = null;
    if (overlay._stratifyEditingNode === node) overlay._stratifyEditingNode = null;
    if (treeInfo.virtualRoot && treeInfo.tree.children.length === 1) {
      const sole = treeInfo.tree.children[0];
      sole.parent = null;
      treeInfo.tree = sole;
      treeInfo.virtualRoot = false;
    }
    if (treeInfo.virtualRoot && treeInfo.tree.children.length === 0) {
      const placeholder = this._newNode('');
      placeholder.parent = treeInfo.tree;
      treeInfo.tree.children.push(placeholder);
    }
    void this._persistAndRelayout(overlay);
  }

  // ────────────────────────────────────────────────────────────────
  // Persist tree → markdown and rebuild canvas.
  // We re-parse our own output so each subsequent edit starts from a
  // clean structure (and so `bodyRaw` slots stay consistent).
  // ────────────────────────────────────────────────────────────────

  async _persistAndRelayout(overlay: StratifyOverlayElement): Promise<void> {
    const file = overlay._stratifyFile;
    const parsed = overlay._stratifyParsed;
    const treeInfo = overlay._stratifyTreeInfo;
    if (!file || !parsed || !treeInfo) return;
    const newContent = this._serializeMindmap(parsed, treeInfo, overlay._stratifyStructure);

    const selPath = overlay._stratifySelected ? this._pathFor(overlay._stratifySelected, treeInfo) : null;
    const editPath = overlay._stratifyPendingEdit ? this._pathFor(overlay._stratifyPendingEdit, treeInfo) : null;

    overlay._stratifyLastContent = newContent;
    overlay._stratifyParsed = this._parseStructured(newContent, overlay._stratifyStructure);
    overlay._stratifyTreeInfo = this._buildTree(overlay._stratifyParsed, file.basename);
    overlay._stratifySelected = selPath ? this._nodeAtPath(overlay._stratifyTreeInfo, selPath) : null;
    overlay._stratifyPendingEdit = editPath ? this._nodeAtPath(overlay._stratifyTreeInfo, editPath) : null;

    this._renderTreeIntoCanvas(overlay, true);

    // Restore focus synchronously so keyboard shortcuts work immediately
    if (overlay._stratifySelected && overlay._stratifySelected._el) {
      overlay._stratifySelected._el.focus({ preventScroll: true });
    }

    try {
      overlay._stratifyWriting = true;
      await this._writeMindmapContent(overlay, newContent);
      (overlay.ownerDocument.defaultView || window).requestAnimationFrame(() => {
        overlay._stratifyWriting = false;
      });
    } catch (error: unknown) {
      overlay._stratifyWriting = false;
      console.error('[StratifyMindmap] persist error', error);
      new obsidian.Notice('Failed to save mindmap: ' + errorMessage(error));
    }
  }

  _pathFor(node: MindmapNode, treeInfo: TreeInfo): number[] | null {
    if (!node || !treeInfo) return null;
    const path: number[] = [];
    let cur: MindmapNode | null = node;
    while (cur && cur.parent) {
      const idx = cur.parent.children.indexOf(cur);
      if (idx < 0) return null;
      path.unshift(idx);
      cur = cur.parent;
    }
    if (cur !== treeInfo.tree) return null;
    return path;
  }

  _nodeAtPath(treeInfo: TreeInfo, path: number[]): MindmapNode | null {
    let cur = treeInfo.tree;
    for (const i of path) {
      if (!cur || !cur.children[i]) return null;
      cur = cur.children[i];
    }
    return cur;
  }

  // ────────────────────────────────────────────────────────────────
  // Layout & geometry.
  // ────────────────────────────────────────────────────────────────

  _measureNodes(node: MindmapNode, scale = 1): void {
    if (!node._el) return;
    const measureScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const r = node._el.getBoundingClientRect();
    node.width = Math.max(r.width / measureScale, 40);
    node.height = Math.max(r.height / measureScale, 24);
    if (node.collapsed) return;
    for (const c of node.children) this._measureNodes(c, measureScale);
  }

  _computeSubtreeHeight(node: MindmapNode): number {
    if (node.collapsed || node.children.length === 0) {
      node._sth = node.height;
      return node._sth;
    }
    let total = 0;
    for (const c of node.children) total += this._computeSubtreeHeight(c);
    total += (node.children.length - 1) * VGAP;
    node._sth = Math.max(node.height, total);
    return node._sth;
  }

  _layoutTree(root: MindmapNode, layout: LayoutId, overlay: StratifyOverlayElement): void {
    if (layout === 'right') {
      this._computeSubtreeHeight(root);
      this._placeRight(root, 0, 0);
    } else if (layout === 'left') {
      this._computeSubtreeHeight(root);
      this._placeLeft(root, 0, 0);
    } else if (layout === 'tree') {
      this._layoutStandardTree(root);
    } else if (layout === 'radial') {
      this._layoutRadial(root, 0, 0, -1, -1);
    } else {
      this._layoutBalanced(root, overlay);
    }
  }

  _placeRight(node: MindmapNode, x: number, yCenter: number): void {
    node.x = x;
    node.y = yCenter - node.height / 2;
    if (node.collapsed || node.children.length === 0) return;
    const gap = node.depth === 0 ? ROOT_HGAP : HGAP;
    const childX = x + node.width + gap;
    let totalH = 0;
    for (const c of node.children) totalH += c._sth;
    totalH += (node.children.length - 1) * VGAP;
    let cy = yCenter - totalH / 2;
    for (const c of node.children) {
      const childYCenter = cy + c._sth / 2;
      this._placeRight(c, childX, childYCenter);
      cy += c._sth + VGAP;
    }
  }

  _placeLeft(node: MindmapNode, xRight: number, yCenter: number): void {
    node.x = xRight - node.width;
    node.y = yCenter - node.height / 2;
    if (node.collapsed || node.children.length === 0) return;
    const gap = node.depth === 0 ? ROOT_HGAP : HGAP;
    const childRight = node.x - gap;
    let totalH = 0;
    for (const c of node.children) totalH += c._sth;
    totalH += (node.children.length - 1) * VGAP;
    let cy = yCenter - totalH / 2;
    for (const c of node.children) {
      const childYCenter = cy + c._sth / 2;
      this._placeLeft(c, childRight, childYCenter);
      cy += c._sth + VGAP;
    }
  }

  _layoutBalanced(root: MindmapNode, overlay: StratifyOverlayElement): void {
    const children = root.children;
    if (children.length === 0) {
      root.x = -root.width / 2;
      root.y = -root.height / 2;
      return;
    }
    for (const c of children) this._computeSubtreeHeight(c);

    let right: MindmapNode[];
    let left: MindmapNode[];
    const cached = overlay && overlay._stratifySideCache;
    if (cached && cached.length === children.length &&
        cached.every((s, i) => s.text === children[i].text)) {
      right = [];
      left = [];
      for (let i = 0; i < children.length; i++) {
        if (cached[i].side === 'left') left.push(children[i]);
        else right.push(children[i]);
      }
    } else {
      const ranked = children.map((c, i) => ({ c, i })).sort((a, b) => b.c._sth - a.c._sth);
      right = [];
      left = [];
      let rH = 0;
      let lH = 0;
      for (const { c } of ranked) {
        if (rH <= lH) { right.push(c); rH += c._sth + VGAP; }
        else { left.push(c); lH += c._sth + VGAP; }
      }
      right.sort((a, b) => children.indexOf(a) - children.indexOf(b));
      left.sort((a, b) => children.indexOf(a) - children.indexOf(b));
    }

    if (overlay) {
      overlay._stratifySideCache = children.map(c => ({
        text: c.text,
        side: right.includes(c) ? 'right' : 'left'
      }));
    }

    root.x = -root.width / 2;
    root.y = -root.height / 2;
    root._side = 'root';

    const rightX = root.x + root.width + ROOT_HGAP;
    let totalRH = right.reduce((s, c) => s + c._sth, 0) + Math.max(0, right.length - 1) * VGAP;
    let cy = -totalRH / 2;
    for (const c of right) {
      const childYCenter = cy + c._sth / 2;
      this._placeRight(c, rightX, childYCenter);
      this._markSide(c, 'right');
      cy += c._sth + VGAP;
    }
    const leftRight = root.x - ROOT_HGAP;
    let totalLH = left.reduce((s, c) => s + c._sth, 0) + Math.max(0, left.length - 1) * VGAP;
    cy = -totalLH / 2;
    for (const c of left) {
      const childYCenter = cy + c._sth / 2;
      this._placeLeft(c, leftRight, childYCenter);
      this._markSide(c, 'left');
      cy += c._sth + VGAP;
    }
  }

  _markSide(node: MindmapNode, side: BranchSide): void {
    node._side = side;
    for (const c of node.children) this._markSide(c, side);
  }

  _computeSubtreeWidth(node: MindmapNode): number {
    if (node.collapsed || node.children.length === 0) {
      node._stw = node.width;
      return node._stw;
    }
    let total = 0;
    for (const c of node.children) total += this._computeSubtreeWidth(c);
    total += (node.children.length - 1) * HGAP;
    node._stw = Math.max(node.width, total);
    return node._stw;
  }

  _layoutStandardTree(root: MindmapNode): void {
    this._computeSubtreeWidth(root);
    root.x = -root.width / 2;
    root.y = 0;
    if (root.collapsed || root.children.length === 0) return;
    const gap = ROOT_HGAP;
    const childY = root.y + root.height + gap;
    let totalW = root.children.reduce((s, c) => s + c._stw, 0) + (root.children.length - 1) * HGAP;
    let cx = -totalW / 2;
    for (const c of root.children) {
      this._placeBelow(c, cx, childY);
      cx += c._stw + HGAP;
    }
  }

  _placeBelow(node: MindmapNode, xLeft: number, y: number): void {
    node.x = xLeft + (node._stw - node.width) / 2;
    node.y = y;
    if (node.collapsed || node.children.length === 0) return;
    const gap = HGAP;
    const childY = y + node.height + gap;
    let totalW = node.children.reduce((s, c) => s + c._stw, 0) + (node.children.length - 1) * HGAP;
    let cx = xLeft + (node._stw - totalW) / 2;
    for (const c of node.children) {
      this._placeBelow(c, cx, childY);
      cx += c._stw + HGAP;
    }
  }

  _layoutRadial(
    root: MindmapNode,
    cx: number,
    cy: number,
    startAngle: number,
    endAngle: number
  ): void {
    root.x = cx - root.width / 2;
    root.y = cy - root.height / 2;
    if (root.collapsed || root.children.length === 0) return;

    const children = root.children;
    const weights = children.map(c => {
      this._computeSubtreeHeight(c);
      return Math.max(c._sth, 40);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const levelRadius = Math.max(180, children.length * 40);

    let angle: number;
    if (startAngle < 0) {
      angle = 0;
    } else {
      angle = startAngle;
    }
    const angleRange = startAngle < 0 ? 2 * Math.PI : endAngle - startAngle;

    for (let i = 0; i < children.length; i++) {
      const share = weights[i] / totalWeight;
      const childAngle = angle + share * angleRange / 2;
      const childCx = cx + levelRadius * Math.cos(childAngle);
      const childCy = cy + levelRadius * Math.sin(childAngle);

      const childStartAngle = angle;
      const childEndAngle = angle + share * angleRange;
      this._layoutRadial(children[i], childCx, childCy, childStartAngle, childEndAngle);
      angle += share * angleRange;
    }
  }

  _applyNodePositions(node: MindmapNode): void {
    if (node._el) {
      node._el.style.setProperty('--stratify-node-x', node.x + 'px');
      node._el.style.setProperty('--stratify-node-y', node.y + 'px');
    }
    if (node.collapsed) return;
    for (const c of node.children) this._applyNodePositions(c);
  }

  _computeBounds(node: MindmapNode, b: Bounds | null = null): Bounds {
    b = b || { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    b.minX = Math.min(b.minX, node.x);
    b.minY = Math.min(b.minY, node.y);
    b.maxX = Math.max(b.maxX, node.x + node.width);
    b.maxY = Math.max(b.maxY, node.y + node.height);
    if (node.collapsed) return b;
    for (const c of node.children) this._computeBounds(c, b);
    return b;
  }

  _shiftTree(node: MindmapNode, dx: number, dy: number): void {
    node.x += dx;
    node.y += dy;
    if (node.collapsed) return;
    for (const c of node.children) this._shiftTree(c, dx, dy);
  }

  _drawConnections(
    node: MindmapNode,
    svg: SVGSVGElement,
    layout: LayoutId,
    lineId: LineStyleId
  ): void {
    if (node.collapsed) return;
    const style = LINE_STYLES[lineId] || LINE_STYLES[DEFAULT_LINE];
    for (const child of node.children) {
      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      if (layout === 'radial') {
        startX = node.x + node.width / 2;
        startY = node.y + node.height / 2;
        endX = child.x + child.width / 2;
        endY = child.y + child.height / 2;
      } else if (layout === 'tree') {
        startX = node.x + node.width / 2;
        startY = node.y + node.height;
        endX = child.x + child.width / 2;
        endY = child.y;
      } else {
        let parentLeft: boolean;
        if (layout === 'balanced') parentLeft = child._side === 'right';
        else if (layout === 'left') parentLeft = false;
        else parentLeft = true;
        startX = parentLeft ? node.x + node.width : node.x;
        startY = node.y + node.height / 2;
        endX = parentLeft ? child.x : child.x + child.width;
        endY = child.y + child.height / 2;
      }
      const path = svg.createSvg('path');
      let d: string;
      if (style.shape === 'straight') {
        d = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else if (style.shape === 'polyline') {
        if (layout === 'tree') {
          const midY = startY + (endY - startY) / 2;
          d = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
        } else if (layout === 'radial') {
          d = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
          const midX = startX + (endX - startX) / 2;
          d = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        }
      } else {
        if (layout === 'tree') {
          const dy = (endY - startY) * 0.4;
          d = `M ${startX} ${startY} C ${startX} ${startY + dy}, ${endX} ${endY - dy}, ${endX} ${endY}`;
        } else if (layout === 'radial') {
          const dx = endX - startX;
          const dy = endY - startY;
          const dist = Math.sqrt(dx * dx + dy * dy) * 0.35;
          const angle = Math.atan2(dy, dx);
          const cx1 = startX + dist * Math.cos(angle);
          const cy1 = startY + dist * Math.sin(angle);
          const cx2 = endX - dist * Math.cos(angle);
          const cy2 = endY - dist * Math.sin(angle);
          d = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
        } else {
          const dx = (endX - startX) * 0.5;
          d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
        }
      }
      path.setAttribute('d', d);
      path.setAttribute('stroke', child.color);
      path.setAttribute('stroke-width', String(Math.max(1.5, 4.5 - child.depth * 0.7)));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (style.dash) path.setAttribute('stroke-dasharray', style.dash);
      path.classList.add('stratify-conn');
      this._drawConnections(child, svg, layout, lineId);
    }
  }

  _bindCanvasClick(canvas: StratifyCanvasElement, overlay: StratifyOverlayElement): void {
    canvas.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('.stratify-node')) return;
      if (overlay._stratifySelected && overlay._stratifySelected._el) {
        overlay._stratifySelected._el.classList.remove('stratify-selected');
      }
      overlay._stratifySelected = null;
    });
  }

  _bindPanZoom(
    canvas: StratifyCanvasElement,
    inner: HTMLDivElement,
    overlay: StratifyOverlayElement
  ): void {
    const ownerWindow = canvas.ownerDocument.defaultView || window;
    let dragging = false;
    let sx = 0, sy = 0, stx = 0, sty = 0;
    const onDown = (e: MouseEvent): void => {
      if (e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest('.stratify-node, .stratify-toolbar, .stratify-btn')) return;
      // Canvas background click during edit — explicitly blur so the
      // edit commits + persists (canvas isn't focusable, so blur won't
      // fire on its own).
      if (overlay && overlay._stratifyEditingNode && overlay._stratifyEditingNode._el) {
        overlay._stratifyEditingNode._el.blur();
        e.preventDefault();
        return;
      }
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      stx = canvas._stratify.tx; sty = canvas._stratify.ty;
      canvas.classList.add('stratify-dragging');
      e.preventDefault();
    };
    const onMove = (e: MouseEvent): void => {
      if (!dragging) return;
      canvas._stratify.tx = stx + (e.clientX - sx);
      canvas._stratify.ty = sty + (e.clientY - sy);
      this._applyTransform(inner, canvas._stratify);
    };
    const onUp = (): void => { dragging = false; canvas.classList.remove('stratify-dragging'); };
    canvas.addEventListener('mousedown', onDown);
    ownerWindow.addEventListener('mousemove', onMove);
    ownerWindow.addEventListener('mouseup', onUp);
    const prevCleanup = overlay._stratifyCleanup;
    overlay._stratifyCleanup = () => {
      if (prevCleanup) prevCleanup();
      ownerWindow.removeEventListener('mousemove', onMove);
      ownerWindow.removeEventListener('mouseup', onUp);
    };

    // ── Touch support ──
    let touchId: number | null = null;
    let pinchDist = 0;
    let pinchMid = { x: 0, y: 0 };
    let pinchScale = 1;
    let pinchTx = 0, pinchTy = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.target instanceof Element && e.target.closest('.stratify-node, .stratify-toolbar, .stratify-btn')) return;
      if (overlay && overlay._stratifyEditingNode && overlay._stratifyEditingNode._el) {
        overlay._stratifyEditingNode._el.blur();
        e.preventDefault();
        return;
      }
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchId = t.identifier;
        sx = t.clientX; sy = t.clientY;
        stx = canvas._stratify.tx; sty = canvas._stratify.ty;
        canvas.classList.add('stratify-dragging');
        e.preventDefault();
      } else if (e.touches.length === 2) {
        touchId = null;
        canvas.classList.remove('stratify-dragging');
        const [a, b] = [e.touches[0], e.touches[1]];
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        pinchMid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
        pinchScale = canvas._stratify.scale;
        pinchTx = canvas._stratify.tx;
        pinchTy = canvas._stratify.ty;
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && touchId !== null) {
        const t = e.touches[0];
        if (t.identifier !== touchId) return;
        canvas._stratify.tx = stx + (t.clientX - sx);
        canvas._stratify.ty = sty + (t.clientY - sy);
        this._applyTransform(inner, canvas._stratify);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const newDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const factor = newDist / pinchDist;
        const newScale = Math.max(0.2, Math.min(3, pinchScale * factor));
        const rect = canvas.getBoundingClientRect();
        const ox = pinchMid.x - rect.left;
        const oy = pinchMid.y - rect.top;
        const realFactor = newScale / pinchScale;
        canvas._stratify.tx = ox - (ox - pinchTx) * realFactor;
        canvas._stratify.ty = oy - (oy - pinchTy) * realFactor;
        canvas._stratify.scale = newScale;
        this._applyTransform(inner, canvas._stratify);
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        touchId = null;
        canvas.classList.remove('stratify-dragging');
      } else if (e.touches.length === 1) {
        // Switched from pinch back to single-finger pan
        const t = e.touches[0];
        touchId = t.identifier;
        sx = t.clientX; sy = t.clientY;
        stx = canvas._stratify.tx; sty = canvas._stratify.ty;
      }
    });
    canvas.addEventListener('wheel', (e) => {
      const isZoom = e.ctrlKey || e.metaKey;
      if (!isZoom) {
        canvas._stratify.ty -= e.deltaY;
        canvas._stratify.tx -= e.deltaX;
        this._applyTransform(inner, canvas._stratify);
        e.preventDefault();
        return;
      }
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const rect = canvas.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      this._zoomAt(canvas, inner, factor, ox, oy);
      e.preventDefault();
    }, { passive: false });
  }

  _applyTransform(inner: HTMLDivElement, s: CanvasTransform): void {
    inner.style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.scale})`;
  }

  _fitTo(canvas: StratifyCanvasElement, inner: HTMLDivElement): void {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const iw = parseFloat(inner.style.width) || inner.clientWidth;
    const ih = parseFloat(inner.style.height) || inner.clientHeight;
    if (!iw || !ih) return;
    const scale = Math.min(cw / iw, ch / ih, 1);
    const tx = (cw - iw * scale) / 2;
    const ty = (ch - ih * scale) / 2;
    canvas._stratify = { tx, ty, scale };
    this._applyTransform(inner, canvas._stratify);
  }

  _zoomBy(canvas: StratifyCanvasElement, inner: HTMLDivElement, factor: number): void {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    this._zoomAt(canvas, inner, factor, cx, cy);
  }

  _zoomAt(
    canvas: StratifyCanvasElement,
    inner: HTMLDivElement,
    factor: number,
    ox: number,
    oy: number
  ): void {
    const s = canvas._stratify;
    const newScale = Math.max(0.2, Math.min(3, s.scale * factor));
    const realFactor = newScale / s.scale;
    s.tx = ox - (ox - s.tx) * realFactor;
    s.ty = oy - (oy - s.ty) * realFactor;
    s.scale = newScale;
    this._applyTransform(inner, s);
  }

  _resetTransform(canvas: StratifyCanvasElement, inner: HTMLDivElement): void {
    canvas._stratify = { tx: 0, ty: 0, scale: 1 };
    this._applyTransform(inner, canvas._stratify);
  }

  // ────────────────────────────────────────────────────────────────
  // PNG Export helpers
  // ────────────────────────────────────────────────────────────────

  _hexToRgb(color: string): [number, number, number] {
    const value = String(color || '').trim();
    const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (rgb) return [
      Math.round(Number(rgb[1])),
      Math.round(Number(rgb[2])),
      Math.round(Number(rgb[3]))
    ];
    let hex = value.replace('#', '');
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, (channel) => channel + channel);
    const m = hex.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return [0, 0, 0];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  _injectDoodleFilter(ownerDocument: Document = activeDocument): void {
    if (ownerDocument.getElementById('stratify-doodle-filter')) return;
    const svg = ownerDocument.body.createSvg('svg', {
      attr: {
        id: 'stratify-doodle-filter',
        width: '0',
        height: '0',
        'aria-hidden': 'true',
      },
      cls: 'stratify-doodle-filter-host',
    });
    const defs = svg.createSvg('defs');
    const filter = defs.createSvg('filter', {
      attr: {
        id: 'doodle-filter',
        x: '-5%',
        y: '-5%',
        width: '110%',
        height: '110%',
      },
    });
    filter.createSvg('feTurbulence', {
      attr: {
        type: 'turbulence',
        baseFrequency: '0.02',
        numOctaves: '3',
        result: 'turbulence',
        seed: '2',
      },
    });
    filter.createSvg('feDisplacementMap', {
      attr: {
        in: 'SourceGraphic',
        in2: 'turbulence',
        scale: '2',
        xChannelSelector: 'R',
        yChannelSelector: 'G',
      },
    });
  }

  _isDarkColor(hex: string): boolean {
    const [r, g, b] = this._hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  _mixColors(hex1: string, hex2: string, weight: number): string {
    const [r1, g1, b1] = this._hexToRgb(hex1);
    const [r2, g2, b2] = this._hexToRgb(hex2);
    const r = Math.round(r1 + (r2 - r1) * weight);
    const g = Math.round(g1 + (g2 - g1) * weight);
    const b = Math.round(b1 + (b2 - b1) * weight);
    return `rgb(${r},${g},${b})`;
  }

  _roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _drawTextToCanvas(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxW: number,
    font: string,
    color: string,
    align: 'left' | 'center' | 'right',
    letterSpacing: number
  ): void {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const ls = letterSpacing || 0;

    // Measure with letter-spacing (CSS letter-spacing applies after each char)
    const measureWithLS = (t: string): number => {
      let w = 0;
      for (let i = 0; i < t.length; i++) w += ctx.measureText(t[i]).width + ls;
      return w;
    };

    const lines: string[] = [];
    const paragraphs = String(text || '').split('\n');
    for (const paragraph of paragraphs) {
      if (!paragraph) {
        lines.push('');
        continue;
      }
      let current = '';
      for (const ch of Array.from(paragraph)) {
        const trial = current + ch;
        if (current && measureWithLS(trial) > maxW) {
          const breakAt = current.lastIndexOf(' ');
          if (breakAt > 0) {
            lines.push(current.slice(0, breakAt));
            current = (current.slice(breakAt + 1) + ch).trimStart();
          } else {
            lines.push(current);
            current = ch;
          }
        } else {
          current = trial;
        }
      }
      if (current || lines.length === 0) lines.push(current);
    }

    const fontMatch = font.match(/([0-9.]+)px/);
    const fontSize = fontMatch ? Number(fontMatch[1]) : 13;
    const lineHeight = fontSize * 1.35;
    const firstY = y - ((lines.length - 1) * lineHeight) / 2;
    const alignType = align || 'left';
    lines.forEach((line, lineIndex) => {
      let drawX = x;
      if (alignType === 'center') {
        drawX = x - measureWithLS(line) / 2;
      } else if (alignType === 'right') {
        drawX = x - measureWithLS(line);
      }
      for (const ch of Array.from(line)) {
        ctx.fillText(ch, drawX, firstY + lineIndex * lineHeight);
        drawX += ctx.measureText(ch).width + ls;
      }
    });
    ctx.restore();
  }

  _drawNodeToCanvas(
    ctx: CanvasRenderingContext2D,
    node: MindmapNode,
    theme: ThemeDefinition,
    nodeStyle: NodeStyleId,
    scale: number
  ): void {
    const x = node.x * scale;
    const y = node.y * scale;
    const w = node.width * scale;
    const h = node.height * scale;
    const r = 8 * scale;
    const depth = node.depth;
    const bgColor = theme.bg || '#FFFFFF';
    const isDark = this._isDarkColor(bgColor);

    ctx.save();

    // Draw this node
    this._drawSingleNodeToCanvas(ctx, node, x, y, w, h, r, depth, bgColor, isDark, theme, nodeStyle, scale);

    ctx.restore();

    // Recursively draw children
    if (node.collapsed) return;
    for (const child of node.children) {
      this._drawNodeToCanvas(ctx, child, theme, nodeStyle, scale);
    }
  }

  _drawDoodleRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    seed: number
  ): void {
    // Create a hand-drawn style irregular rectangle
    const points: Array<{ x: number; y: number }> = [];
    const segments = 16;
    const jitter = 2.5;

    // Simple seeded random for consistent results
    let s = seed || 12345;
    const rand = (): number => {
      s = (s * 16807 + 0) % 2147483647;
      return (s / 2147483647) * 2 - 1; // -1 to 1
    };

    // Generate points along the edges with slight jitter
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Top edge
      points.push({ x: x + t * w, y: y + rand() * jitter * 0.8 });
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // Right edge
      points.push({ x: x + w + rand() * jitter, y: y + t * h });
    }
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // Bottom edge
      points.push({ x: x + w - t * w, y: y + h + rand() * jitter * 0.8 });
    }
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      // Left edge
      points.push({ x: x + rand() * jitter, y: y + h - t * h });
    }

    // Draw smooth curve through points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length; i++) {
      const p0 = points[i];
      const p1 = points[(i + 1) % points.length];
      const p2 = points[(i + 2) % points.length];

      const cpx = p1.x + (p2.x - p0.x) * 0.12;
      const cpy = p1.y + (p2.y - p0.y) * 0.12;
      ctx.quadraticCurveTo(cpx, cpy, p1.x, p1.y);
    }

    ctx.closePath();
  }

  _drawSingleNodeToCanvas(
    ctx: CanvasRenderingContext2D,
    node: MindmapNode,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    depth: number,
    bgColor: string,
    isDark: boolean,
    theme: ThemeDefinition,
    nodeStyle: NodeStyleId,
    scale: number
  ): void {
    const isDoodle = nodeStyle === 'doodle';
    const isBorderless = nodeStyle === 'borderless';
    // Use a simple hash of node position for consistent doodle randomness
    const seed = Math.abs(Math.floor(node.x * 100 + node.y * 37 + node.depth * 7));
    const collapsed = node.collapsed && node.children && node.children.length > 0;
    const badgeExtra = collapsed ? 26 * scale : 0;

    // Apply rotation for doodle style
    if (isDoodle) {
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const rotation = ((seed % 5) - 2) * 0.2; // -0.4 to 0.4 degrees
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }

    const fontBase = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    const fontSize = this._fontSizeForNode(depth, nodeStyle) * scale;
    const textPad = depth === 0
      ? (isBorderless ? 4 : isDoodle ? 18 : 14)
      : depth === 1
        ? (isBorderless ? 4 : isDoodle ? 13 : 10)
        : depth === 2
          ? (isBorderless || isDoodle ? 12 : 10)
          : 10;
    const drawNodeText = (weight: number, color: string): void => this._drawTextToCanvas(
      ctx,
      node.text,
      x + textPad * scale,
      y + h / 2,
      w - textPad * 2 * scale - badgeExtra,
      `${weight} ${fontSize}px ${fontBase}`,
      color,
      'left',
      0
    );
    if (depth === 0) {
      if (isBorderless) {
        const rootColor = theme.rootAccent || '#405866';
        drawNodeText(700, isDark ? '#E2E8F0' : rootColor);
      } else {
        // Root node: solid accent background
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetY = 2 * scale;

        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = theme.rootFill || theme.rootAccent || '#405866';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        drawNodeText(700, '#FFFFFF');
      }
    } else if (depth === 1) {
      if (isBorderless) {
        drawNodeText(600, isDark ? '#E2E8F0' : node.color);
      } else {
        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = this._mixColors(node.color, bgColor, 0.87);
        ctx.fill();

        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        drawNodeText(600, isDark ? '#E2E8F0' : '#1F2937');
      }
    } else if (depth === 2) {
      if (isBorderless) {
        drawNodeText(600, isDark ? '#E2E8F0' : '#1F2937');
      } else {
        // Level 2: tinted background with colored border
        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = this._mixColors(node.color, bgColor, 0.84);
        ctx.fill();

        ctx.strokeStyle = this._mixColors(node.color, bgColor, 0.5);
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        drawNodeText(600, isDark ? '#E2E8F0' : '#1F2937');
      }
    } else {
      if (isBorderless) {
        drawNodeText(500, isDark ? '#E2E8F0' : '#1F2937');
      } else {
        // Level 3+: subtle border
        if (isDoodle) {
          this._drawDoodleRect(ctx, x, y, w, h, seed);
        } else {
          this._roundRect(ctx, x, y, w, h, r);
        }
        ctx.fillStyle = bgColor;
        ctx.fill();

        ctx.strokeStyle = this._mixColors(node.color, bgColor, 0.6);
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        drawNodeText(500, isDark ? '#E2E8F0' : '#1F2937');
      }
    }

    // Draw collapse badge
    if (collapsed) {
      const badgeR = 8 * scale;
      const padRight = textPad;
      const badgeCX = x + w - padRight * scale - badgeR;
      const badgeCY = y + h / 2;

      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = depth === 0 ? 'rgba(255,255,255,0.9)' : node.color;
      ctx.fill();

      const crossLen = 10 * scale;
      const crossW = 2 * scale;
      ctx.fillStyle = depth === 0 ? (theme.rootAccent || '#405866') : '#FFFFFF';
      ctx.fillRect(badgeCX - crossLen / 2, badgeCY - crossW / 2, crossLen, crossW);
      ctx.fillRect(badgeCX - crossW / 2, badgeCY - crossLen / 2, crossW, crossLen);
    }

    // Restore rotation for doodle style
    if (isDoodle) {
      ctx.restore();
    }

    ctx.restore();
  }

  _drawConnectionsToCanvas(
    ctx: CanvasRenderingContext2D,
    node: MindmapNode,
    layout: LayoutId,
    lineStyle: LineStyleId,
    scale: number
  ): void {
    if (node.collapsed) return;
    const style = LINE_STYLES[lineStyle] || LINE_STYLES[DEFAULT_LINE];

    for (const child of node.children) {
      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      if (layout === 'radial') {
        startX = (node.x + node.width / 2) * scale;
        startY = (node.y + node.height / 2) * scale;
        endX = (child.x + child.width / 2) * scale;
        endY = (child.y + child.height / 2) * scale;
      } else if (layout === 'tree') {
        startX = (node.x + node.width / 2) * scale;
        startY = (node.y + node.height) * scale;
        endX = (child.x + child.width / 2) * scale;
        endY = child.y * scale;
      } else {
        let parentLeft: boolean;
        if (layout === 'balanced') parentLeft = child._side === 'right';
        else if (layout === 'left') parentLeft = false;
        else parentLeft = true;
        startX = (parentLeft ? node.x + node.width : node.x) * scale;
        startY = (node.y + node.height / 2) * scale;
        endX = (parentLeft ? child.x : child.x + child.width) * scale;
        endY = (child.y + child.height / 2) * scale;
      }

      ctx.save();
      ctx.strokeStyle = child.color;
      ctx.lineWidth = Math.max(1.5, 4.5 - child.depth * 0.7) * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (style.dash) {
        const dashArr = style.dash.split(' ').map(Number);
        ctx.setLineDash(dashArr.map(d => d * scale));
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      if (style.shape === 'straight') {
        ctx.lineTo(endX, endY);
      } else if (style.shape === 'polyline') {
        if (layout === 'tree') {
          const midY = startY + (endY - startY) / 2;
          ctx.lineTo(startX, midY);
          ctx.lineTo(endX, midY);
          ctx.lineTo(endX, endY);
        } else if (layout === 'radial') {
          ctx.lineTo(endX, endY);
        } else {
          const midX = startX + (endX - startX) / 2;
          ctx.lineTo(midX, startY);
          ctx.lineTo(midX, endY);
          ctx.lineTo(endX, endY);
        }
      } else {
        if (layout === 'tree') {
          const dy = (endY - startY) * 0.4;
          ctx.bezierCurveTo(startX, startY + dy, endX, endY - dy, endX, endY);
        } else if (layout === 'radial') {
          const dx = endX - startX;
          const dy = endY - startY;
          const dist = Math.sqrt(dx * dx + dy * dy) * 0.35;
          const angle = Math.atan2(dy, dx);
          const cx1 = startX + dist * Math.cos(angle);
          const cy1 = startY + dist * Math.sin(angle);
          const cx2 = endX - dist * Math.cos(angle);
          const cy2 = endY - dist * Math.sin(angle);
          ctx.bezierCurveTo(cx1, cy1, cx2, cy2, endX, endY);
        } else {
          const dx = (endX - startX) * 0.5;
          ctx.bezierCurveTo(startX + dx, startY, endX - dx, endY, endX, endY);
        }
      }

      ctx.stroke();
      ctx.restore();

      this._drawConnectionsToCanvas(ctx, child, layout, lineStyle, scale);
    }
  }

  async _savePngToVault(file: obsidian.TFile, arrayBuffer: ArrayBuffer): Promise<string> {
    const folderPath = file.parent && file.parent.path ? file.parent.path + '/' : '';
    const filePath = obsidian.normalizePath(folderPath + file.basename + '.mindmap.png');
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof obsidian.TFile) {
      await this.app.vault.modifyBinary(existing, arrayBuffer);
    } else {
      await this.app.vault.createBinary(filePath, arrayBuffer);
    }
    return filePath;
  }

  async _exportPNG(overlay: StratifyOverlayElement): Promise<void> {
    try {
      const treeInfo = overlay._stratifyTreeInfo;
      const tree = treeInfo && treeInfo.tree;
      if (!tree) {
        new obsidian.Notice('No mindmap to export');
        return;
      }

      const file = overlay._stratifyFile;
      if (!file) {
        new obsidian.Notice('No file associated with mindmap');
        return;
      }

      const themeKey = this._normalizeTheme(overlay._stratifyTheme) || DEFAULT_THEME;
      const theme = THEMES[themeKey];
      const layout = this._normalizeLayout(overlay._stratifyLayout) || DEFAULT_LAYOUT;
      const lineStyle = this._normalizeLine(overlay._stratifyLine) || DEFAULT_LINE;
      const nodeStyle = this._normalizeNodeStyle(overlay._stratifyNodeStyle) || DEFAULT_NODE_STYLE;
      const scale = 2;

      // Calculate bounds
      const bounds = this._computeBounds(tree);
      const w = bounds.maxX - bounds.minX + PAD * 2;
      const h = bounds.maxY - bounds.minY + PAD * 2;

      // Save original positions and temporarily shift for export
      const savedPositions: Array<{ node: MindmapNode; x: number; y: number }> = [];
      const shiftDx = PAD - bounds.minX;
      const shiftDy = PAD - bounds.minY;
      const saveAndShift = (node: MindmapNode): void => {
        savedPositions.push({ node, x: node.x, y: node.y });
        node.x += shiftDx;
        node.y += shiftDy;
        if (!node.collapsed) node.children.forEach(saveAndShift);
      };
      saveAndShift(tree);

      // Create offscreen canvas
      const canvas = overlay.ownerDocument.body.createEl('canvas');
      canvas.remove();
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context is unavailable');

      // Get background color
      let bgColor = theme.bg;
      if (!bgColor) {
        const ownerWindow = overlay.ownerDocument.defaultView || window;
        const computedStyle = ownerWindow.getComputedStyle(overlay);
        bgColor = computedStyle.getPropertyValue('--stratify-theme-bg').trim() ||
                  computedStyle.getPropertyValue('--background-primary').trim() ||
                  '#FFFFFF';
      }
      ctx.fillStyle = bgColor;
      const normalizedBgColor = typeof ctx.fillStyle === 'string' ? ctx.fillStyle : bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const exportTheme = Object.assign({}, theme, { bg: normalizedBgColor });

      // Draw connections
      this._drawConnectionsToCanvas(ctx, tree, layout, lineStyle, scale);

      // Draw nodes
      this._drawNodeToCanvas(ctx, tree, exportTheme, nodeStyle, scale);

      // Restore original positions
      for (const { node, x, y } of savedPositions) {
        node.x = x;
        node.y = y;
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create PNG'));
        }, 'image/png');
      });

      // Save beside the source note so export works consistently on desktop and mobile.
      const arrayBuffer = await blob.arrayBuffer();
      const exportedPath = await this._savePngToVault(file, arrayBuffer);
      new obsidian.Notice('Mind map exported to ' + exportedPath);
    } catch (error: unknown) {
      console.error('[StratifyMindmap] export error:', error);
      new obsidian.Notice('Export failed: ' + errorMessage(error));
    }
  }
}

class StratifyMindmapSettingTab extends obsidian.PluginSettingTab {
  plugin: StratifyMindmapPlugin;

  constructor(app: obsidian.App, plugin: StratifyMindmapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.renderSettings();
  }

  renderSettings(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('p', {
      text: 'These defaults apply to new mind maps, converted notes, and notes without the matching frontmatter field.'
    });

    this.addDropdownSetting(
      'Default structure mode',
      'Heading is closest to standard Markdown; Hybrid keeps deep maps readable on mobile; List is the most compact.',
      'defaultStructure',
      STRUCTURE_MODES
    );

    this.addDropdownSetting(
      'Default layout',
      'Initial layout for new or unconfigured mindmaps.',
      'defaultLayout',
      {
        balanced: { name: 'Balanced' },
        right: { name: 'Right' },
        left: { name: 'Left' },
        tree: { name: 'Tree' },
        radial: { name: 'Radial' }
      }
    );

    this.addThemeSetting();

    this.addDropdownSetting(
      'Default line style',
      'Initial connector style for new or unconfigured mindmaps.',
      'defaultLine',
      LINE_STYLES
    );

    this.addDropdownSetting(
      'Default node style',
      'Initial node shape for new or unconfigured mindmaps.',
      'defaultNodeStyle',
      NODE_STYLES
    );

    new obsidian.Setting(containerEl)
      .setName('Display')
      .setHeading();

    new obsidian.Setting(containerEl)
      .setName('Node font size')
      .setDesc('Base font size for all mindmaps. Root and first-level nodes remain proportionally larger.')
      .addSlider((slider) => {
        slider
          .setLimits(MIN_NODE_FONT_SIZE, MAX_NODE_FONT_SIZE, 1)
          .setValue(this.plugin.pluginSettings.nodeFontSize)
          .onChange(async (value) => {
            this.plugin.pluginSettings.nodeFontSize = value;
            await this.plugin.saveSettings();
            this.plugin._refreshDisplaySettings();
          });
      });

    new obsidian.Setting(containerEl)
      .setName('Interaction')
      .setHeading();

    new obsidian.Setting(containerEl)
      .setName('Arrow-key node navigation')
      .setDesc('Use plain arrow keys to move selection between visible nodes. Existing shortcuts such as Shift+Arrow and Cmd/Ctrl+Arrow are unchanged.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.pluginSettings.keyboardNavigation !== false)
          .onChange(async (value) => {
            this.plugin.pluginSettings.keyboardNavigation = value;
            await this.plugin.saveSettings();
          });
      });

    new obsidian.Setting(containerEl)
      .setName('Leaf outside drop creates child')
      .setDesc('When dragging onto the outside edge of a leaf node, make the dragged node a child of that leaf. Top and bottom zones still insert before or after the target.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.pluginSettings.leafOutsideDropCreatesChild !== false)
          .onChange(async (value) => {
            this.plugin.pluginSettings.leafOutsideDropCreatesChild = value;
            await this.plugin.saveSettings();
          });
      });

    new obsidian.Setting(containerEl)
      .setName('Reset defaults')
      .setDesc('Restore Stratify Mindmap defaults. Existing note frontmatter is not changed.')
      .addButton((button) => {
        button
          .setButtonText('Reset')
          .onClick(async () => {
            this.plugin.pluginSettings = { ...DEFAULT_PLUGIN_SETTINGS };
            await this.plugin.saveSettings();
            this.plugin._refreshDisplaySettings();
            this.renderSettings();
          });
      });
  }

  addThemeSetting(): void {
    const setting = new obsidian.Setting(this.containerEl)
      .setName('Default theme')
      .setDesc('Initial color theme for new or unconfigured mindmaps.');
    const preview = setting.descEl.createDiv({ cls: 'stratify-setting-theme-preview' });
    const renderPreview = (value: unknown): void => {
      const id = this.plugin._normalizeTheme(value) || DEFAULT_THEME;
      const theme = THEMES[id];
      preview.empty();
      preview.createSpan({ cls: 'stratify-setting-theme-description', text: theme.description || theme.name });
      const swatches = preview.createSpan({ cls: 'stratify-theme-swatches', attr: { 'aria-hidden': 'true' } });
      [theme.rootFill].concat(theme.palette.slice(0, 6)).forEach((color) => {
        const swatch = swatches.createSpan({ cls: 'stratify-theme-swatch' });
        swatch.style.setProperty('--stratify-swatch-color', color);
      });
    };
    setting.addDropdown((dropdown) => {
      for (const id of objectKeys(THEMES)) dropdown.addOption(id, THEMES[id].name);
      dropdown
        .setValue(this.plugin.pluginSettings.defaultTheme)
        .onChange(async (value) => {
          this.plugin.pluginSettings.defaultTheme = this.plugin._normalizeTheme(value) || DEFAULT_THEME;
          await this.plugin.saveSettings();
          renderPreview(value);
        });
    });
    renderPreview(this.plugin.pluginSettings.defaultTheme);
  }

  addDropdownSetting<K extends DropdownSettingKey>(
    name: string,
    desc: string,
    key: K,
    options: Record<string, NamedOption>
  ): void {
    new obsidian.Setting(this.containerEl)
      .setName(name)
      .setDesc(desc)
      .addDropdown((dropdown) => {
        for (const id of Object.keys(options)) {
          dropdown.addOption(id, options[id].name || id);
        }
        dropdown
          .setValue(this.plugin.pluginSettings[key])
          .onChange(async (value) => {
            if (!hasOwn(options, value)) return;
            this.plugin.pluginSettings[key] = value as PluginSettings[K];
            await this.plugin.saveSettings();
            this.renderSettings();
          });
      });
  }
}

export default StratifyMindmapPlugin;
