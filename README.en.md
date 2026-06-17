# html-deck

[简体中文](README.md) · **English**

Hand-code slides as **HTML** (fixed 1280×720 sections in an opinionated, professional theme), render each section with **headless Chrome**, and assemble a 16:9 **`.pptx`** where every slide is one full-bleed image.

It ships as a **[Claude Code](https://docs.claude.com/en/docs/claude-code) skill** — so you can just say *"make a defense deck from these notes"* and let the agent write the HTML for you — but the scripts also work **standalone** from any terminal.

| Bullet panels (`ul.feat`) | Image-dominant layout (`fig` + `col.compact`) |
|---|---|
| ![](docs/preview/slide_02.png) | ![](docs/preview/slide_04.png) |

---

## What it is good for — and what it is not

This is a deliberate trade, not a do-everything tool. Read this before adopting it.

**Use it when**
- You want a **content-dense, visually consistent** deck (defense / 答辩, tech talk, course project, design review) and you're comfortable letting **HTML/CSS** (or an AI agent) drive layout.
- Your slides have **code, diagrams, tables, formulas, or lots of CJK text** — things a browser renders far better than a slide editor.
- You want every slide to look **exactly** as designed, pixel for pixel, with one command.

**Do NOT use it when**
- You need to **hand-edit text inside PowerPoint afterwards.** Each output slide is a **rasterized PNG** — text is *not* selectable or editable in PPT. This is the single most important limitation. (Keep the `.html` as your editable source.)
- You want a click-and-drag GUI, slide transitions/animations, speaker-notes workflows, or photo-heavy decks.
- You need a quick one-off slide and don't want to touch markup.

**Be aware**
- The theme is **opinionated** (one professional look, restyle via CSS variables in `:root`).
- The authoring guide (`SKILL.md`) and `template.html` comments are written in **Chinese**, and the typography is tuned for **CJK**. It works for any language, but the in-repo guidance is zh-first.

---

## Requirements

- **Node.js ≥ 18.**
- **A local Chromium-family browser** — Chrome, Chromium, Edge, or Brave. `puppeteer-core` does **not** download a browser; it drives the one you already have. Auto-detected on macOS / Windows / Linux; if detection fails, set `CHROME_PATH` to the executable.
- **(Optional) Python 3 + `python-pptx`** — only for the alternative two-step flow (`build_pptx.py`); the recommended one-step flow needs no Python.

### Cross-platform notes
- **macOS** — primary tested platform.
- **Windows / Linux** — common install paths are auto-detected; the code is straightforward but less battle-tested, so `CHROME_PATH` is your fallback. On Windows: `set CHROME_PATH=C:\path\to\chrome.exe`. On macOS/Linux: `export CHROME_PATH=/path/to/chrome`.
- **Linux** — install CJK fonts (e.g. `sudo apt install fonts-noto-cjk`) or Chinese text renders as missing-glyph boxes. Headless Chrome on servers may need `--no-sandbox` (already passed by the scripts).

---

## Install

### As a Claude Code skill (recommended)
```bash
git clone https://github.com/chunmeiqishi/html-deck ~/.claude/skills/html-deck
cd ~/.claude/skills/html-deck && npm install
```
Then in Claude Code, ask for a deck (e.g. *"用 html-deck 把这份笔记做成答辩 PPT"*). The agent reads `SKILL.md` and writes the HTML for you.

### Standalone (no Claude Code)
```bash
git clone https://github.com/chunmeiqishi/html-deck && cd html-deck && npm install
```

---

## Usage

```bash
cp template.html my-deck.html       # start from the template
#   ...edit my-deck.html: one <section class="slide"> per slide...
node html2pptx.mjs my-deck.html my-deck.pptx 2      # one step → 16:9 pptx (2× = crisp)
```

Need individual PNGs instead (to drop into a doc or send one by one)? Use the two-step flow:
```bash
node export_slides.mjs my-deck.html out 2           # → out/slide_01.png …
python3 build_pptx.py out my-deck.pptx              # needs:  pip install python-pptx
```

The third argument is the device scale (`2` → 2560×1440 per slide). Keep your `.html` as the editable source of truth and re-run to regenerate.

---

## How it works

1. You write slides as `<section class="slide">` blocks (1280×720). The template provides a small component kit — title/kicker, bullet panels, stat tiles, tables, formula blocks, inline-SVG diagrams, code blocks, image-dominant layouts.
2. `puppeteer-core` loads the HTML in your local Chrome at high DPI and screenshots each `.slide`.
3. The screenshots are placed full-bleed onto 16:9 slides via `pptxgenjs` (one step, in memory) or assembled from PNGs via `python-pptx` (two steps).

## Authoring guide & design rules

The full component reference and the **hard-won layout rules** live in **[`SKILL.md`](SKILL.md)** — e.g. why bullet text must be wrapped in `<span>` (CJK + `<b>` inside a flex item otherwise wraps/stacks), how to keep slides from looking hollow, when to reach for an inline-SVG diagram, and how to size near-square diagrams so they're legible. Worth a read even if you use it standalone.

## License

[MIT](LICENSE). Built and iterated with Claude Code.
