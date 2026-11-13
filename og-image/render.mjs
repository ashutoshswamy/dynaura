// Renders index.html to og.png (2400x1260) and og-1200.png (1200x630).
// Needs playwright-core and Chrome. If playwright-core is not installed in the repo:
//   PLAYWRIGHT_CORE_DIR=/path/to/dir-containing-node_modules node og-image/render.mjs
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.PLAYWRIGHT_CORE_DIR ? path.join(process.env.PLAYWRIGHT_CORE_DIR, "x.js") : import.meta.url;
let chromium;
try { ({ chromium } = createRequire(base)("playwright-core")); }
catch { console.error("playwright-core not found. Run: npm i --no-save playwright-core, or set PLAYWRIGHT_CORE_DIR."); process.exit(1); }

const browser = await chromium.launch({ channel: "chrome" });
const report = {};
for (const [scale, file] of [[2, "og.png"], [1, "og-1200.png"]]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(path.join(here, "index.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.load('700 64px "Bricolage Grotesque"');
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  report.fontLoaded = await page.evaluate(() => document.fonts.check('700 64px "Bricolage Grotesque"'));
  if (scale === 2) {
    report.layout = await page.evaluate(() => {
      const box = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
      const h1 = document.querySelector("h1");
      const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
      const textW = (s) => { const el = document.querySelector(s); const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect().right; };
      return { headlineLines: lines, headlineTextRight: textW("h1"), brand: box(".brand"), h1: box("h1"), sub: box(".sub"), domain: box(".domain"), panel: box(".panel") };
    });
  }
  await page.screenshot({ path: path.join(here, file), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
}
await browser.close();
// optional: shrink the PNGs if Pillow is available
try {
  execFileSync("python3", ["-c", `
from PIL import Image
import sys
for f in ("og.png","og-1200.png"):
    p="${here}/"+f; im=Image.open(p).convert("RGB")
    im.save(p, optimize=True)
`], { stdio: "ignore" });
} catch { /* Pillow not available, keep the raw PNGs */ }
console.log(JSON.stringify(report, null, 1));
