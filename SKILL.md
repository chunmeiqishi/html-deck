---
name: html-deck
description: Build a high-quality slide deck by hand-coding HTML (1280×720 sections) in a fixed professional style, then export each section to PNG and assemble a .pptx. Use when the user wants to make a presentation / 演示文稿 / 答辩 PPT / slides from scratch or from notes, especially "用 HTML 做 PPT", "把 HTML 转成 pptx", "逐页导出 PNG", or wants a richer, non-hollow deck where every bullet is a container and formulas look typeset.
---

# HTML → PNG → PPTX 演示文稿制作

一套「用 HTML 手写幻灯片 → 导出 PNG → 拼成 .pptx」的可复用流程。HTML 用真实浏览器渲染，
排版自由、配色统一、公式美观；导出后每页是一张满幅 PNG，可直接放映或插入 PowerPoint。

## 何时用
- 用户要做答辩/汇报/课程演示，想要专业、充实、风格统一的幻灯片。
- 用户已有内容（笔记、论文、报告）要转成 PPT。
- 用户嫌 PPT 手动排版麻烦，想「省心生成高质量演示文稿」。

## 工作流
1. **写 HTML**：以 `template.html` 为起点，每页一个 `<section class="slide">`，套用下面的组件。
2. **一步出 PPTX（推荐）**：`node html2pptx.mjs 你的.html 你的.pptx 2`
   —— HTML 直接 → 每页一张满幅图的 16:9 pptx，截图只走内存，**不产生 PNG**。

> 如果确实想要单张 PNG（比如逐张发群里 / 贴文档），再用两步备用流程：
> `node export_slides.mjs 你的.html out 2` 然后 `python3 build_pptx.py out 你的.pptx`。

> 本技能目录自带 `template.html` 与脚本。**首次使用前，在技能目录执行一次 `npm install`**
> 安装 `puppeteer-core` 与 `pptxgenjs`（需本机已装 Chrome/Chromium/Edge；详见仓库 README）。之后即可直接调用：
> ```bash
> cd ~/.claude/skills/html-deck && npm install            # 仅首次
> cp ~/.claude/skills/html-deck/template.html ./我的演示.html   # 起一个新文件来写
> # …编辑 我的演示.html…
> node ~/.claude/skills/html-deck/html2pptx.mjs 我的演示.html 我的演示.pptx 2
> ```
> 自动探测不到浏览器时，设环境变量 `CHROME_PATH` 指向其可执行文件。

---

## 设计铁律（务必遵守 —— 这些是踩过坑总结出来的）

1. **画布固定 1280×720**（16:9）。`.slide` 是 flex 纵向列：`.head`（标题区，`flex:none`）+ `.body`
   （`flex:1`，填满剩余）+ `.foot`（`flex:none`）。内容靠 `flex:1` 撑满，**不要留大片空白**。
2. **每个分点都用容器包裹**。正文要点一律用 `ul.feat`（每条是一个带色条的面板，`flex:1` 自动均分卡片高度）
   或 `ul.steps`（带编号）。**禁止**卡片里只丢两三行裸 `<p>`/居中小字 —— 那就是「空洞大白框」。
3. **绝不在 flex 容器里直接放「裸文字 + `<b>`」**。CJK 文字 + `<b>` 在 flex 父级里会被拆成多个
   flex item，每个塌缩成 1 个字宽，导致「文字莫名其妙竖排成双行」。所以：
   - 列表项的小圆点/方块用 **绝对定位的 `::before`**（见 `.dots`/`.feat`），不要用 flex 对齐圆点；
   - **`ul.feat` 的每条正文必须写成 `<li><span>…文字+`<b>`…</span></li>`**（span 才是唯一 flex 子项，`<b>` 在 span 内正常内联）。
     模板里的 `ul.feat li` 已是 flex 行布局，**漏写 span 必然换行/竖排**——这是最常见的复发 bug；
   - `.bar p`、`.steps li > span` 都已加 `flex:1;min-width:0`，自己新写的 flex 子项也照做；
   - 反之 **block 流容器**（`.mini`、`ul.dots li`、`.card > p`、`.agv`）里的 `<b>` 是安全的，不必包 span。
4. **卡片必须填满高度**。给卡片 `class="card ... col"` 或 `flex:1`；内部列表用 `flex:1`；
   内容少的卡片用 `style="justify-content:space-between"` 让首尾各贴一边、中间留白对称。
5. **公式要像排版的公式，且不留空箱**：
   - 用 `.formula`（衬线数学字体 + 斜体变量 + 真上下标），不要用等宽 ASCII。
   - 变量包 `<i>`，上标 `<sup>`，下标 `<small>`，运算符包 `<span class="op">`，重点量包 `<span class="v">`。
   - **公式下方配 `.legend` 注释芯片**（逐个解释符号），既填满空间又更易懂。
   - 大的居中公式框别用空的 `flex:1`；改成 `display:flex;flex-direction:column;justify-content:center;gap`
     放「公式 + legend」，或用 `.eqno` 在右侧标注「变换/目标」。
6. **内容不空洞**：每个要点是一句有信息量的话（带数字、机制、对比），不是三五个字的口号。
7. **配色只用 CSS 变量**（见 `:root`）。强调色家族：primary(蓝)/sky/teal/amber/green/rose。
   一页内用 1 个主色 + 至多 1~2 个辅助色，别花。深色版页面加 `class="slide t"`（左边条变 teal）。
8. **页脚页码**：`<div class="foot"><span class="b">主题</span><span class="pageno">03 / 22</span></div>`。
   导出 PNG 与页码无关，但放映时有页码更专业。

---

## 可视化优先（实战反馈，强约束 —— 别做成文字堆砌的「白底列表」）

用户的核心诉求反复是两条：**①别让任何一页只有少量文字 + 大片空白；②尽量用图形（流程图、形状、架构图）替代纯文字。** 落地经验：

1. **纯 `<p>` 卡片是头号空洞源**。`grid3` 里每格只放一个短 `<p>`，卡片下半截必然留白。这类页要么换成
   `ul.feat`（li `flex:1` 自动撑高），要么直接画成图。**3 个以上「短段落卡」并排时，优先改图。**
2. **内联 SVG 是首选可视化手段**（浏览器原生渲染，导出管线零依赖，不必往返 drawio）。常用图式：
   - **横向 pipeline / 流程**：N 个圆角节点 + 箭头（用户旅程、RAG 灌库流程、工具调用流程）。
   - **UML 继承 / 关系图**：基类在上、子类单行在下，泛化三角连接（模板方法、Agent 体系）。
   - **甘特 / 时间线**：左标签列 + 右横条，表达并行（Task.WhenAll）、链路追踪 span。
   - **分类桶**：竖向堆叠的彩色条带，每条一类 + 成员（把「8 个插件」按能力归类）。
   - **分工合流图**：两块并列 → 箭头汇聚到一个结果节点 + 底部缎带（设计哲学/职责划分）。
   把图放进 `.viz`（`flex:1;min-height:0;display:flex`，svg `width/height:100%`）让它吃满剩余高度；
   **窄条形图**（流程带、底部 strip）改用固定高度容器：`<div style="flex:none;height:150px">`。
   若用户更想要 drawio 源文件，可产出 `.drawio` 让其自行渲染 PNG —— 但内联 SVG 通常更快更省事。
3. **SVG 避坑（每条都踩过）**：
   - **坐标手算，盒子留足间距防重叠**。反例：节点 `width=84` 却按 `x=18,93,243,318` 摆 → 相邻只差 75，重叠 9px。
     先定「格宽 = (可用宽 − 总间距) / N」，再逐个累加，**核验 `x+width ≤ 下一个 x`**。
   - **箭头/继承三角用显式 `<polygon>`/`<path>` 画死，别用 `marker` + `orient="auto"`** —— 方向自动旋转极易错位。
     UML 泛化三角示例：`<polygon points="210,96 201,112 219,112" fill="#fff" stroke="#3949c4"/>`（apex 顶到父类底边）。
   - **旋转文字注意别压线**：竖排标注（如 `rotate(-90 ...)`）要留在标签列与图形之间的空白带，核验其横坐标不与括号线/连线重叠。
   - **SVG 配色用文稿同款 hex**（presentation 属性吃不了 `var()`）：primary `#3949c4`/tint `#eef1fd`，sky `#0e7fc1`/`#e1f0f8`，
     teal `#0c8577`/`#e6f5f2`，amber `#bf7a12`/`#fbf2e0`，ink-2 `#3c485c`，line `#d3dae5`，灰箭头 `#7a8aa8`。
   - 全局加 `svg text{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;}`，否则 CJK 字体不统一。
4. **代码块用浅色主题，和文稿统一，别用纯黑 IDE 背景**：`.code` 背景 `var(--paper)` + `1px var(--line-2)` 边框 +
   `inset` 细阴影；语法色走文稿色系（关键字紫 `#8a30c0`、串绿 `#0a7a4a`、类型 `#0e7fc1`、方法 `#3949c4`、注释 `#94a0b2`、特性 `#bf7a12`）。
5. **慎用 emoji**：很多字体下渲染成豆腐块/乱码（尤其 `🖼🧮` 等）。装饰可用，但**关键信息绝不能只靠 emoji 承载**；拿不准就删。
6. **纯标点 / 省略号 token 看着像乱码**：`?? ?. !`、`[...]`、`""" ... """` 单独成块会被当成乱码。要么配中文说明，
   要么写成有意义的最小示例（`s[..8]`、`"""SQL"""`、`class X(dep)`）。
7. **行内代码与「术语 + 代码」清单**：行内 `<code>` 用主题胶囊（`--primary-tint` 底 + 主色字）。讲语言特性/配置项时，
   用 `.kv` 定义式清单（左 `<code>` 胶囊 + 右中文说明，`flex` 一行一项）比把许多 chip 挤成一团清晰得多。

> 可复用片段（`.viz` / `.kv` / 浅色 `.code` / 行内 `code` / `svg text`）已在示例 deck 中沉淀，新建 deck 时按需从中拷贝。

---

## 组件速查（直接抄用）

### 幻灯片骨架
```html
<section class="slide">
  <div class="head">
    <div class="kicker"><b>01</b> 章节名</div>
    <h1 class="title">这一页的标题</h1>
    <div class="subtitle">一句话点出本页要讲清楚的事。</div>
  </div>
  <div class="body">
    <!-- 用 row.grow / grid2 / grid3 / grid4 布局，内部放 card -->
  </div>
  <div class="foot"><span class="b">项目名 · 章节</span><span class="pageno">03 / 22</span></div>
</section>
```

### 封面 / 收尾（深色渐变）
```html
<section class="slide cover">
  <div class="bgwrap"></div>
  <div class="deco">
    <i style="width:560px;height:560px;right:-140px;top:-170px;"></i>
    <i style="width:380px;height:380px;right:-30px;top:-30px;border-color:rgba(255,255,255,.18);"></i>
    <i style="width:260px;height:260px;left:-100px;bottom:-120px;"></i>
  </div>
  <div class="inner" style="align-items:center;text-align:center;">
    <div style="font-size:15px;font-weight:700;letter-spacing:.26em;opacity:.82;margin-bottom:34px;">副标题/单位</div>
    <div style="font-size:74px;font-weight:800;line-height:1.02;letter-spacing:-2px;">主标题</div>
    <div style="font-size:25px;opacity:.74;font-style:italic;margin-top:20px;">英文副标题</div>
  </div>
</section>
```
收尾页同款，把 `.bgwrap` 的渐变换成 teal：`style="background:linear-gradient(125deg,#0a5e54,#0c8577 48%,#13a594)"`。

### 要点面板（首选！每个分点一个容器，自动撑满高度）
**正文必须包在 `<li><span>…</span></li>` 里**——`ul.feat li` 是 flex 容器，直接写 `<li><b>词</b>：文</li>`
会被拆成多个 flex item，导致「加粗处莫名换行 / 竖排」。务必带 `<span>`：
```html
<div class="card accent te col">
  <div class="ct te">小标题</div>
  <ul class="feat te">
    <li><span><b>关键词</b>：一句有信息量、带数字或机制的说明</span></li>
    <li><span><b>关键词</b>：第二条要点……</span></li>
    <li><span>第三条要点……</span></li>
  </ul>
</div>
```
颜色后缀：无=蓝, `s`=sky, `te`=teal, `a`=amber, `g`=green, `r`=rose（`accent`/`ct`/`feat` 都跟同一后缀）。
要点多、想更紧凑时给 `ul.feat` 加 `sm`（缩小字号）。

### 图为主页（图左占满高度 + 右侧紧凑要点）—— 偏方/近正方的图别居中铺满整宽
```html
<div class="body">
  <div class="row grow">
    <div class="fig" style="flex:1.4;"><img src="assets/图.png" alt=""></div>  <!-- 也可放内联 SVG，用 .viz -->
    <div class="col compact" style="flex:1;gap:14px;">
      <div class="mini"><div class="h">要点标题</div><p>一两行说明，block 流，<b>加粗</b>内联安全</p></div>
      <div class="mini te"><div class="h">第二点</div><p>……</p></div>
      <div class="mini a"><div class="h">第三点</div><p>……</p></div>
    </div>
  </div>
</div>
```
- 图占满**整页正文高度**比居中铺满整宽更清晰；**按图长宽比调 `fig`/`viz` 的 `flex`**：越宽的图给越大（如 1.5 的图用 `flex:2.2`，近正方 1.0 用 `flex:1`）。
- 右侧用 **`col compact`**：`.mini` 保持自然高度、整体垂直居中，**不会被拉高导致框内空荡**（别让要点块 `flex:1` 撑满整列）。
- `.mini` 是 block 流，标题用 `.h`、正文用 `<p>`，里面 `<b>` 内联安全，不必包 span。

### 编号步骤
```html
<ul class="steps">
  <li><span class="num s">1</span><span><b>第一步</b>：说明……</span></li>
  <li><span class="num s">2</span><span><b>第二步</b>：说明……</span></li>
</ul>
```

### 数字看板（一行 N 个，记得 flex:1 等宽）
```html
<div class="grid4" style="flex:none;">
  <div class="card stat"><div class="n">5173<span style="font-size:20px;">万</span></div><div class="l">说明文字</div></div>
  <div class="card stat te"><div class="n">273<span style="font-size:18px;">%</span></div><div class="l">说明文字</div></div>
</div>
```
若放进 `.row`（非 grid），每个 stat 卡要加 `style="flex:1;min-width:0"`，否则宽度按数字长短不齐、与下方不对齐。

### 公式 + 注释芯片（美观、不留白）
```html
<div class="formula" style="display:flex;flex-direction:column;justify-content:center;gap:16px;">
  <div style="font-size:21px;">
    ( <span class="v">C</span>, <span class="v">D</span> ) <span class="op">=</span>
    <span style="font-size:1.25em;">∑</span><small>i∈N</small> ( <i>c</i><small>i</small>, <i>z</i><small>i</small> )
    <span class="op">·</span> <span class="v"><i>f</i><small>i</small></span>
    <span class="op">·</span> <span style="font-size:1.25em;">∏</span><small>j&lt;i</small> ( 1 <span class="op">−</span> <i>f</i><small>j</small> )
  </div>
  <div class="legend">
    <span><b>C</b>颜色</span><span><b>D</b>深度</span><span><b>f<small>i</small></b>第 i 个权重</span>
  </div>
</div>
```
多行公式可在每行右侧加 `<span class="eqno">变换</span>`，行间用 `<div style="height:1px;background:var(--line-2);"></div>` 分隔。

### 对比表（最优行高亮）
```html
<table>
  <tr><th>策略</th><th>指标A</th><th>指标B</th></tr>
  <tr><td class="lab">基线</td><td>0.25</td><td>0.83</td></tr>
  <tr class="best"><td class="lab">本文</td><td>0.16</td><td>0.39</td></tr>
</table>
```

### 强调条 / 提示
```html
<div class="bar a"><span class="ic">★</span><p>一句金句或关键结论，放在卡片或 body 底部。</p></div>
```

### 配图 / 视频占位
```html
<div class="fig"><img src="assets/图.png" alt=""></div>            <!-- 留白背景、contain -->
<div class="media"><img src="assets/图.png" alt="">               <!-- 满幅 cover、深色 -->
  <div class="vtag"><span class="d"></span>视频占位 · xxx.mp4</div><div class="play"></div>
</div>
<div class="cap">图注一行。</div>
```

### 布局容器
- `<div class="row grow">…</div>`：横向等分、撑满剩余高度；子项加 `class="... col"` 或 `style="flex:1.2"` 调比例。
- `grid2 / grid3 / grid4`：N 等分网格，自动撑满高度（grid4 默认不撑高，需要时加 `style="flex:1;min-height:0"`）。

---

## 导出脚本（本目录已自带，逐字说明见文件头注释）

- **`html2pptx.mjs`（推荐，一步到位）**：`puppeteer-core` 截图 `.slide` 到内存 base64，
  直接用 `pptxgenjs` 写出 16:9 pptx，**无中间 PNG 落盘**。
  - 运行：`node html2pptx.mjs [输入html] [输出pptx] [缩放=2]`
- **`export_slides.mjs`**：用 `puppeteer-core` 驱动本机 Chrome，逐个 `.slide` 元素截图。
  导出时注入 CSS 去掉圆角/阴影/外边距，得到干净矩形。需先 `npm install puppeteer-core@23`。
  - 运行：`node export_slides.mjs [输入html] [输出目录] [缩放=2]`
  - 输出：`输出目录/slide_01.png … slide_NN.png`（按 section 顺序，2× = 2560×1440）。
- **`build_pptx.py`**：用 `python-pptx` 把 PNG 按文件名排序，每张铺满一页 16:9 幻灯片。
  - 运行：`python3 build_pptx.py [PNG目录] [输出pptx]`
  - 需要 `pip install python-pptx`（多数环境已装）。

## 环境准备
推荐路径 `html2pptx.mjs` **只需 Node + 本机 Chrome**，且技能目录已预装 `puppeteer-core` 与 `pptxgenjs`，
直接 `node ~/.claude/skills/html-deck/html2pptx.mjs …` 即可，无需任何安装、无需 Python。
脚本在 `/Applications/Google Chrome.app`（macOS）自动找 Chrome；换平台改脚本里的 `CHROME_CANDIDATES`。

（仅当你改用两步 PNG 流程的 `build_pptx.py` 时才需要 `pip install python-pptx`。
 若把脚本拷到别的目录单独跑，在那个目录 `npm install puppeteer-core@23 pptxgenjs@3` 即可。）

## 导出前自查清单
- [ ] 每页有 head/body/foot；body 用 `flex:1` 撑满，无大片空白。
- [ ] 所有要点用 `ul.feat`/`ul.steps` 包裹，没有裸 `<p>` 列表。
- [ ] 没有「裸文字+`<b>`」直接放进 flex 父级（检查竖排双行 bug）。
- [ ] 公式用 `.formula` + `.legend`，无空箱、无等宽 ASCII。
- [ ] 同行的 stat/卡片宽度对齐（flex:1）。
- [ ] 配色用变量，一页不超过 2~3 个强调色。
- [ ] 图片路径相对 HTML 正确（导出用 file:// 加载）。
- [ ] 没有「3 个短 `<p>` 卡并排留白」的空洞页；能画图的尽量画成内联 SVG。
- [ ] SVG 盒子核验过 `x+width ≤ 下一个 x`，无重叠；箭头/三角用显式 polygon，旋转文字不压线。
- [ ] 代码块是浅色（`--paper` 底），非纯黑；无 emoji 乱码、无「纯标点 token」当正文。

## 4:3 投影
改 `build_pptx.py` 里 `Inches(13.333)×Inches(7.5)` → `Inches(10)×Inches(7.5)`，
并把 `.slide` 的 `width/height` 改成 960×720 后重新导出 PNG，保持比例一致。
