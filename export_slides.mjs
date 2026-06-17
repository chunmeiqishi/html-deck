// 把 HTML 的每个 <section class="slide"> 导出为一张 PNG（两步流程的第 1 步）
// Export each <section class="slide"> of an HTML file to a PNG (step 1 of the 2-step flow).
// 用法 / Usage:  node export_slides.mjs [input.html] [outDir] [scale=2]
// 例 / e.g.:    node export_slides.mjs deck.html out 2   →  out/slide_01.png …
//
// 需要本机已安装 Chrome / Chromium / Edge；自动探测失败时设环境变量 CHROME_PATH。
// Requires a local Chrome/Chromium/Edge; set CHROME_PATH if auto-detection fails.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML  = process.argv[2] || 'deck.html';
const OUT   = process.argv[3] || 'out';
const SCALE = Number(process.argv[4] || 2);            // 2 → 2560×1440

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
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: SCALE });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60000 });

// 去掉圆角/阴影/外边距，得到干净的 1280×720 矩形整页
await page.addStyleTag({ content: `
  body{ background:#fff !important; padding:0 !important; }
  .deck{ gap:0 !important; }
  .slide{ border-radius:0 !important; box-shadow:none !important; margin:0 !important; }
` });
await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
await new Promise(r => setTimeout(r, 400));

const slides = await page.$$('.slide');
if (!slides.length) { console.error('没找到 .slide 区块 / no .slide sections found'); await browser.close(); process.exit(1); }

let i = 0;
for (const el of slides) {
  i++;
  const name = `slide_${String(i).padStart(2, '0')}.png`;
  await el.screenshot({ path: resolve(OUT, name), type: 'png' });
  console.log(`  ✓ ${OUT}/${name}`);
}
await browser.close();
console.log(`完成：${i} 张 PNG 已写入 ${resolve(OUT)}`);
