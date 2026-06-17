# html-deck

[English](README.en.md) · **简体中文**

用 **HTML** 手写幻灯片（固定 1280×720、统一的专业主题），用**无头 Chrome** 渲染每一页，再拼成一份每页一张满幅图的 16:9 **`.pptx`**。

它以 **[Claude Code](https://docs.claude.com/en/docs/claude-code) 技能**的形式分发——你可以直接说「把这份笔记做成答辩 PPT」，让 Agent 替你写 HTML——脚本同样可以**脱离 Claude 单独在终端使用**。

| 要点面板（`ul.feat`） | 图为主布局（`fig` + `col.compact`） |
|---|---|
| ![](docs/preview/slide_02.png) | ![](docs/preview/slide_04.png) |

---

## 适合什么，不适合什么

这是一个有取舍的工具，不是万能的。采用前请先读这一节。

**适合**
- 想要**信息密集、风格统一**的演示（答辩、技术分享、课程项目、设计评审），且你愿意用 **HTML/CSS**（或让 AI Agent）来掌控排版。
- 幻灯片里有**代码、图表、表格、公式或大量中文**——这些浏览器渲染得比幻灯片编辑器好得多。
- 希望每一页都**像素级**地呈现你设计的样子，一条命令生成。

**不适合**
- 需要**之后在 PowerPoint 里手动改文字**。输出的每页都是**位图 PNG**——文字在 PPT 里**不可选中、不可编辑**。这是最重要的局限。（请把 `.html` 当作可编辑的源文件。）
- 想要鼠标拖拽的图形界面、页面切换/动画、演讲者备注工作流，或以照片为主的图册型幻灯片。
- 只想随手做一两页、又不想碰代码。

**注意**
- 主题是**有主见的**（一套专业外观，可通过 `:root` 里的 CSS 变量改配色）。
- 编写指南（`SKILL.md`）与 `template.html` 的注释是**中文**，排版针对**中日韩文字**调优。它适用于任何语言，但仓库内的指引以中文为主。

---

## 环境要求

- **Node.js ≥ 18。**
- **本机已安装 Chromium 系浏览器**——Chrome、Chromium、Edge 或 Brave。`puppeteer-core` **不会**下载浏览器，它驱动你已有的那一个。macOS / Windows / Linux 会自动探测；探测失败时，把 `CHROME_PATH` 设为可执行文件路径。
- **（可选）Python 3 + `python-pptx`**——仅用于另一条两步流程（`build_pptx.py`）；推荐的一步流程无需 Python。

### 跨平台说明
- **macOS** —— 主要测试平台。
- **Windows / Linux** —— 已内置常见安装路径自动探测；代码很直白但实测较少，`CHROME_PATH` 是兜底。Windows：`set CHROME_PATH=C:\path\to\chrome.exe`；macOS/Linux：`export CHROME_PATH=/path/to/chrome`。
- **Linux** —— 请安装中日韩字体（如 `sudo apt install fonts-noto-cjk`），否则中文会渲染成方块。服务器上的无头 Chrome 可能需要 `--no-sandbox`（脚本已自动带上）。

---

## 安装

### 作为 Claude Code 技能（推荐）
```bash
git clone https://github.com/chunmeiqishi/html-deck ~/.claude/skills/html-deck
cd ~/.claude/skills/html-deck && npm install
```
然后在 Claude Code 里直接要一份演示文稿（例如「用 html-deck 把这份笔记做成答辩 PPT」）。Agent 会读取 `SKILL.md` 并替你写好 HTML。

### 独立使用（不依赖 Claude Code）
```bash
git clone https://github.com/chunmeiqishi/html-deck && cd html-deck && npm install
```

---

## 用法

```bash
cp template.html my-deck.html       # 从模板起步
#   ...编辑 my-deck.html：每页一个 <section class="slide"> ...
node html2pptx.mjs my-deck.html my-deck.pptx 2      # 一步 → 16:9 pptx（2× 更清晰）
```

想要单张 PNG（贴进文档或逐张发出去）？用两步流程：
```bash
node export_slides.mjs my-deck.html out 2           # → out/slide_01.png …
python3 build_pptx.py out my-deck.pptx              # 需要：pip install python-pptx
```

第三个参数是设备缩放（`2` → 每页 2560×1440）。把 `.html` 当作唯一可编辑的源文件，改完重新跑即可再生成。

---

## 工作原理

1. 你把幻灯片写成 `<section class="slide">` 区块（1280×720）。模板提供一套小组件——标题/眉栏、要点面板、数字看板、表格、公式块、内联 SVG 图、代码块、图为主布局。
2. `puppeteer-core` 在本机 Chrome 里以高 DPI 加载 HTML，并对每个 `.slide` 截图。
3. 截图被满幅放到 16:9 幻灯片上：用 `pptxgenjs` 一步（走内存），或用 `python-pptx` 从 PNG 两步拼装。

## 编写指南与设计规则

完整的组件参考与**踩坑总结出的排版铁律**都在 **[`SKILL.md`](SKILL.md)**——例如：为什么要点文字必须包在 `<span>` 里（中文 + `<b>` 直接放进 flex item 会换行/竖排）、怎样让页面不空洞、什么时候改用内联 SVG 图、近正方的图怎么放才清晰。即便独立使用也值得一读。

## 许可证

[MIT](LICENSE)。基于 Claude Code 构建与迭代。
