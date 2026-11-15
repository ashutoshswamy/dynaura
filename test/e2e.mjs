// Real-browser smoke test. Build first (npm run build), then:
//   node test/e2e.mjs [chrome|chromium|firefox|webkit]
// Needs playwright-core and that browser installed; else set PLAYWRIGHT_CORE_DIR=/dir-containing-node_modules.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.PLAYWRIGHT_CORE_DIR ? path.join(process.env.PLAYWRIGHT_CORE_DIR, "x.js") : import.meta.url;
const pw = createRequire(base)("playwright-core");
const name = process.argv[2] ?? "chromium";
const html = `<!doctype html><link rel="stylesheet" href="/dist/styles-no-font.css"><body style="height:600px">
<script type="module">import { dynaura, createToaster } from "/dist/vanilla.js"; window.dynaura = dynaura; window.t = createToaster({ queue: true, swipe: "both" });</script>`;

const browser = name === "chrome" ? await pw.chromium.launch({ channel: "chrome" }) : await pw[name].launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.route("http://dynaura.test/**", (r) => {
  const p = new URL(r.request().url()).pathname;
  if (p === "/") return r.fulfill({ contentType: "text/html", body: html });
  const type = p.endsWith(".css") ? "text/css" : "text/javascript";
  try { r.fulfill({ contentType: type, body: readFileSync(path.join(root, p)) }); } catch { r.fulfill({ status: 404 }); }
});
await page.goto("http://dynaura.test/");
await page.waitForFunction(() => window.dynaura);

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(ok ? "ok  " : "FAIL", msg); };
const isl = page.locator(".dynaura-island");

await page.evaluate(() => dynaura.success({ title: "Saved", description: "all good", duration: null,
  button: { title: "Open", onClick() {} }, secondaryButton: { title: "Undo", onClick() { window.undone = true; } } }));
await page.waitForTimeout(900);
const box = await isl.boundingBox();
check(box && box.width > 80 && box.height > 30, `island rendered (${box && Math.round(box.width)}x${box && Math.round(box.height)})`);
check(await isl.evaluate((e) => e.dataset.expanded === "true"), "auto-expands with body");
await page.locator(".dynaura-secondary").click();
check(await page.evaluate(() => window.undone === true), "secondary button fires");
await page.waitForTimeout(600);
check(await isl.evaluate((e) => e.hidden), "dismissed after secondary click");

await page.evaluate(() => dynaura.error({ title: "Boom", duration: null }));
await page.waitForTimeout(300);
check(await isl.getAttribute("aria-live") === "assertive", "error is assertive");
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
check(await isl.evaluate((e) => e.hidden), "Escape dismisses");

await page.evaluate(() => dynaura.info({ title: "Swipe me", duration: null }));
await page.waitForTimeout(700);
const b = await isl.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 90, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(700);
check(await isl.evaluate((e) => e.hidden), "swipe 'both' (down at top anchor) dismisses");

await page.evaluate(() => dynaura.info({ title: "Card", variant: "card", description: "body", duration: null }));
await page.waitForTimeout(1500);
check(await isl.evaluate((e) => e.style.clipPath.startsWith("path(")), "card clip-path drawn");

await page.evaluate(() => dynaura.dismiss());
await page.evaluate(() => dynaura.custom(Object.assign(document.createElement("div"), { textContent: "custom body", style: "padding:14px 18px" }), { duration: null }));
await page.waitForTimeout(800);
const cb = await isl.boundingBox();
check(cb && cb.width > 100, "custom body sizes the island");
check(errors.length === 0, `no console/page errors${errors.length ? ": " + errors[0] : ""}`);

await browser.close();
console.log(`${name}: ${fails.length ? fails.length + " failed" : "all passed"}`);
process.exit(fails.length ? 1 : 0);
