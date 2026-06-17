// 一步到位：幻灯片 HTML → .pptx（每页一张满幅图，中间 PNG 只存在内存，不落盘）
// One-step: slide HTML → .pptx (one full-bleed image per slide; screenshots stay in memory).
// 用法 / Usage:  node html2pptx.mjs [input.html] [output.pptx] [scale=2]
// 例 / e.g.:    node html2pptx.mjs deck.html deck.pptx 2
//
// 需要本机已安装 Chrome / Chromium / Edge（puppeteer-core 不自带浏览器）。
// Requires a local Chrome/Chromium/Edge (puppeteer-core ships no browser).
// 自动探测失败时，设环境变量 CHROME_PATH 指向浏览器可执行文件。
// If auto-detection fails, set CHROME_PATH to the browser executable.
import puppeteer from 'puppeteer-core';
import PptxGenJS from 'pptxgenjs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML  = process.argv[2] || 'deck.html';
const OUT   = process.argv[3] || HTML.replace(/\.html?$/i, '') + '.pptx';
const SCALE = Number(process.argv[4] || 2);

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const p = process.platform;
  const c = [];
  if (p === 'darwin') {
    c.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser');
  } else if (p === 'win32') {
    const pf = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const la = process.env['LOCALAPPDATA'] || '';
    c.push(
      pf + '\\Google\\Chrome\\Application\\chrome.exe',
      pf86 + '\\Google\\Chrome\\Application\\chrome.exe',
      la + '\\Google\\Chrome\\Application\\chrome.exe',
      pf + '\\Microsoft\\Edge\\Application\\msedge.exe',
      pf86 + '\\Microsoft\\Edge\\Application\\msedge.exe');
  } else {
    c.push(
      '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium', '/usr/bin/chromium-browser',
      '/snap/bin/chromium', '/usr/bin/microsoft-edge');
  }
  return c.find(existsSync);
}

const chrome = findChrome();
if (!chrome) {
  console.error('未找到 Chrome/Chromium/Edge。请安装其一，或设环境变量 CHROME_PATH 指向可执行文件。');
  console.error('No Chrome/Chromium/Edge found. Install one, or set CHROME_PATH to its executable.');
  process.exit(1);
}

const htmlPath = resolve(HTML);
if (!existsSync(htmlPath)) { console.error('找不到输入文件 / input not found:', htmlPath); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: SCALE });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60000 });
await page.addStyleTag({ content: `
  body{ background:#fff !important; padding:0 !important; }
  .deck{ gap:0 !important; }
  .slide{ border-radius:0 !important; box-shadow:none !important; margin:0 !important; }
` });
await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
await new Promise(r => setTimeout(r, 400));

const slides = await page.$$('.slide');
if (!slides.length) { console.error('没找到 .slide 区块 / no .slide sections found'); await browser.close(); process.exit(1); }

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'DECK', width: 13.333, height: 7.5 }); // 16:9
pptx.layout = 'DECK';

console.log(`共 ${slides.length} 页，缩放 ${SCALE}× → 内存截图直接写入 pptx`);
let i = 0;
for (const el of slides) {
  i++;
  const buf = await el.screenshot({ type: 'png', encoding: 'base64' });
  const s = pptx.addSlide();
  s.addImage({ data: `image/png;base64,${buf}`, x: 0, y: 0, w: 13.333, h: 7.5 });
  process.stdout.write(`  ✓ 第 ${i} 页\n`);
}
await browser.close();
await pptx.writeFile({ fileName: OUT });
console.log(`完成：${i} 页 → ${resolve(OUT)}（无中间 PNG）`);
