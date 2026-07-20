# Stratify Mindmap

[English](https://github.com/Lywooye/stratify-mindmap/blob/main/README.md) | **简体中文**

Stratify Mindmap 是一个以 Markdown 为数据源的 Obsidian 思维导图插件。它让导图在电脑和手机上仍然保持为可阅读、可编辑的 Markdown，同时支持超过六层的节点结构。

界面采用紧凑设计：结构模式和布局保留在主工具栏，常用视图操作使用图标，主题、连线、节点样式和导出收进同一个菜单。

## 1.2.0 新增内容

- Obsidian 重载或后台标签页恢复可见后，自动恢复正确的导图布局。
- 启动阶段画布尺寸无效时不再写入接近零的错误缩放。
- 工作区尺寸稳定期间自动重新适配，用户手动平移或缩放后不再抢回视角。

## 主要特点

- 支持超过六层的思维导图
- 支持 Heading、Hybrid、List 三种 Markdown 结构
- 转换现有 Markdown 时自动识别结构
- 直接编辑节点并写回 Markdown
- 支持跨父级、同级前后位置的拖拽
- 支持方向键选择节点和键盘调整层级
- 支持导图操作的撤销与重做
- 支持 Obsidian 双向链接、节点折叠、多种布局和 PNG 导出
- 使用带色块预览的主题选择器和成熟分类配色
- 可调节节点字号，并同步用于 PNG 导出
- 长节点文字自动换行，整体布局更加紧凑
- 对仅保存在 Markdown 源文档中的内容显示提示
- 工作区和标签页恢复后可靠地重建布局
- 手机端工具栏同时避开系统安全区域和 Obsidian 顶部按钮，触控区域增大到 44 像素
- 支持桌面端和移动端

## 界面示意

以下图片展示当前版本的 Stratify 界面布局。

### 导图总览

![Stratify Mindmap 桌面端导图总览](https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/desktop-overview.png)

### 外观与导出菜单

![Stratify Mindmap 外观与导出菜单](https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/appearance-menu.png)

### 手机端工具栏

<img src="https://raw.githubusercontent.com/Lywooye/stratify-mindmap/main/assets/mobile-toolbar.png" alt="位于灵动岛安全区域下方的 Stratify Mindmap 手机端工具栏" width="390">

## Markdown 结构模式

| 模式 | 源文档格式 | 推荐用途 |
| --- | --- | --- |
| Heading | `#` 到 `######` | 六层以内、偏文档大纲的导图 |
| Hybrid | 标题后接嵌套列表 | 超过六层且仍需保持文档可读性 |
| List | 纯嵌套 Markdown 列表 | 手机端快速缩进编辑和深层结构 |

当前模式保存在 `mindmap-structure`。缺少该字段时，Stratify 会自动判断笔记是纯标题、标题加列表还是纯列表。

```yaml
---
type: mindmap
mindmap-structure: hybrid
mindmap-layout: right
mindmap-theme: minimal
mindmap-line: curve
mindmap-node: rounded
---

# 项目
## 调研
### 资料来源
#### 文献筛选
##### 研究方法
###### 证据
- 原始研究
  - 纳入文献
    - 详细笔记
```

## 非节点 Markdown 内容

标题和列表项会成为导图节点。普通段落、引用、代码块、表格和注释等其他 Markdown 不会被静默转换为节点或 comment，而是继续保留在源文档中。

第一个节点之前的内容作为文档级正文保留；节点之后的内容会附着在该节点上。节点右下角的橙色标记表示存在这类内容。桌面工具栏会显示对应的文件图标；手机端则在“编辑 Markdown”按钮上显示状态圆点。

正常渲染、编辑节点和切换结构模式不会丢失这些内容。移动节点时，其附带正文会一起移动；删除节点时，附带正文也会作为同一次可撤销操作被删除。只有普通正文而没有标题或列表项的文档会显示空导图状态，但原 Markdown 保持不变。

## 编辑操作

| 操作 | 手势或快捷键 |
| --- | --- |
| 选择节点 | 点击或使用普通方向键 |
| 编辑文字 | 双击或 `F2` |
| 新增同级节点 | `Enter` |
| 新增子节点 | `Tab` |
| 删除节点 | `Delete` 或 `Backspace` |
| 折叠或展开 | `Space` |
| 同级上下移动 | `Shift + ArrowUp/ArrowDown` |
| 提升一级 | `Shift + Tab` 或 `Mod + ArrowLeft` |
| 降为上一个同级节点的子节点 | `Mod + ArrowRight` |
| 撤销 | `Mod + Z` |
| 重做 | `Mod + Shift + Z` 或 `Mod + Y` |

折叠状态通过给完整节点文字包裹一层单星号来保存，例如 `# *暂缓事项*`。因此，原本就采用这种写法的标题或列表项会被识别为折叠节点。

拖到目标节点上半区或下半区，会插入到目标前面或后面。拖到没有子节点的节点外侧，可以将其变成该节点的子节点；这一行为可在设置中关闭。

## 工具栏与设置

桌面端主工具栏保留 Mode、Layout、适应画布、缩放和编辑 Markdown。手机端使用位于系统安全区域和 Obsidian 顶部按钮下方的单行工具栏，保留 Mode、Layout、适应画布、编辑 Markdown 和更多选项，按钮触控区域为 44 像素；缩放移入全宽选项面板。选项面板会用名称和色块展示所有主题，下面是连线、节点形状、手机端缩放和 PNG 导出。桌面端和移动端都会把导出的图片保存在源笔记旁，文件名为 `<笔记名>.mindmap.png`。

Obsidian 设置页面可指定新导图的默认结构、布局、主题、连线和节点样式，也可以调整全局节点字号、方向键导航与叶节点拖拽行为。修改默认值不会覆盖已有笔记的 frontmatter。

## 新建与转换

- 使用左侧 ribbon 或命令面板中的 **Convert current note to mind map**。
- 右键 Markdown 文件并选择 **Convert to Stratify mind map**。
- 右键文件夹并选择 **Create Stratify mind map**。

转换只添加所需 frontmatter 并识别正文结构，不会重写原正文。

## 安装

在 Obsidian 中打开 **设置 -> 社区插件 -> 浏览**，搜索并安装 **Stratify Mindmap**。

也可以从 GitHub Release 手动安装：

1. 新建 `<vault>/.obsidian/plugins/stratify-mindmap/`。
2. 下载 Release 中的 `main.js`、`manifest.json`、`styles.css`，并放入该目录。
3. 重新加载 Obsidian。
4. 在 **设置 -> 社区插件** 中启用 **Stratify Mindmap**。

不要同时启用 Stratify Mindmap 与 Light Mindmap/Light Mindmap Plus，因为它们都会渲染 `type: mindmap` 笔记。

## 从 Light Mindmap 迁移

Stratify 保留了 `type: mindmap` 和现有 `mindmap-*` frontmatter，因此旧导图无需转换。由于插件 ID 已改变，插件级设置会单独保存；迁移一次默认设置后即可停用旧插件。

## 兼容性

- Obsidian 1.8.7 或更高版本
- 支持 macOS、Windows、Linux、iOS 和 Android
- 导图内容仍是 Markdown，因此兼容 Obsidian Sync

## 隐私与网络

Stratify Mindmap 完全在本地离线运行。它不会发起网络请求、收集遥测、展示广告、访问当前 Vault 以外的文件，也不包含自行更新机制。插件只会读取或写入思维导图笔记、用户主动导出的 PNG 文件和本地插件设置的内容。

在节点编辑状态输入 `[[` 时，Wiki 链接自动补全会通过 Obsidian 的 `vault.getMarkdownFiles()` API 列出当前 Vault 中 Markdown 文件的路径和元数据，但不会读取这些笔记的正文。该列表只在内存中缓存最多 5 秒，插件不会保存或传输它。

## 开发

仓库中的 TypeScript 源码位于 `src/`；生成的 `main.js` 只作为 GitHub Release 附件发布。

```bash
npm install
npm run check
```

`npm run check` 会依次运行 Obsidian 官方 ESLint 规则、回归测试、TypeScript 检查和生产构建。

## 致谢与许可证

Stratify Mindmap 是 [Light Mindmap](https://github.com/ninglg/light-mindmap) 的独立衍生版本。原项目作者为 Light Ning；本项目保留原版权声明，并继续使用 MIT License。

内置分类配色参考了 [Paul Tol 配色方案](https://sronpersonalpages.nl/~pault/)、[Tableau Classic 色板](https://help.tableau.com/current/pro/desktop/en-us/formatting_create_custom_colors.htm) 和 [ColorBrewer](https://colorbrewer2.org/)。
