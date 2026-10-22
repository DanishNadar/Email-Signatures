// Build production signature HTML from signature.config.js.
//
//   node scripts/build.mjs
//
// dist/signature-<v>.html          standalone page (absolute image URLs)
// dist/signature-<v>.snippet.html  just the signature table, ready to paste
// dist/signature-<v>.txt           plain-text fallback
// dist/qa/<v>.html                 QA sheet (local images): light, dark, mobile, blocked images
// dist/qa/<v>-clean.html           the standalone page with local images, for screenshots
// outlook/Danish Nadar.htm         the flagship (D) signature, ready for Outlook
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = require(join(root, "signature.config.js"));
const R = require(join(root, "src", "signature.js"));

const dist = join(root, "dist");
mkdirSync(join(dist, "qa"), { recursive: true });

const slug = { D: "d-flagship", A: "a-executive", B: "b-leadership", C: "c-personal-brand" };

function qaSheet(v) {
  const local = (extra = {}) => R.render(config, v, { assetBase: "../../", ...extra });
  const label = config.variants[v].label;
  const panel = (title, body, style = "") =>
    `<section><h2>${title}</h2><div class="pane" style="${style}">${body}</div></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>QA — Variant ${v} ${label}</title>
<style>
  body{margin:0;padding:28px;background:#eef1f5;font:13px/1.4 system-ui,Segoe UI,Arial,sans-serif;color:#334155}
  h1{font-size:15px;margin:0 0 18px;color:#0f172a} h2{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px;color:#64748b}
  .grid{display:grid;grid-template-columns:minmax(600px,auto) 420px;gap:22px;align-items:start}
  .pane{background:#fff;border:1px solid #dbe1e8;border-radius:8px;padding:26px 24px}
  .dark{filter:invert(1) hue-rotate(180deg);background:#fff} .dark img{filter:invert(1) hue-rotate(180deg)}
  .phone{width:360px;box-sizing:border-box;padding:20px 16px;outline:2px dashed #94a3b8;outline-offset:-2px}
</style></head><body>
<h1>Variant ${v} — ${label} <span style="font-weight:400;color:#64748b">· simulated rendering in Chromium, not a live mail client</span></h1>
<div class="grid">
  ${panel("Light · desktop", local())}
  ${panel("Mobile · 360px viewport (dashed)", local())
    .replace('class="pane"', 'class="pane phone" ')}
  ${panel("Dark · auto-inverted (Gmail/Outlook-style)", `<div class="dark" style="margin:-26px -24px;padding:26px 24px;border-radius:8px">${local()}</div>`, "background:#1f1f1f")}
  ${panel("Images blocked", local({ blockImages: true }))}
</div></body></html>`;
}

for (const v of R.variants) {
  const name = `signature-${slug[v]}`;
  const snippet = R.render(config, v);
  writeFileSync(join(dist, `${name}.html`), R.standalone(config, v));
  writeFileSync(join(dist, `${name}.snippet.html`), snippet + "\n");
  writeFileSync(join(dist, `${name}.txt`), R.renderText(config, v) + "\n");
  writeFileSync(join(dist, "qa", `${v}.html`), qaSheet(v));
  writeFileSync(join(dist, "qa", `${v}-clean.html`), R.standalone(config, v, { assetBase: "../../" }));
  const flag = snippet.length > R.GMAIL_LIMIT ? "  (over Gmail's 10,000 limit; fine for Outlook)" : "";
  console.log(`  ${name}.html  ${snippet.length.toLocaleString()} chars${flag}`);
}

// Outlook: `<name>.htm` is a bare document for classic Outlook's Signatures folder.
// `Copy Signature.html` puts the exact signature HTML on the clipboard. Selecting a
// rendered page with Ctrl+A instead would freeze the fluid width to the browser's width.
const outlook = join(root, "outlook");
mkdirSync(outlook, { recursive: true });
const name = config.person.name;
const signature = R.render(config, "D");
const maxWidth = (config.hud && config.hud.width) || 860;
writeFileSync(join(outlook, `${name}.htm`), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} signature</title>
</head>
<body style="margin:0;padding:0;">
${signature}
</body>
</html>
`);
writeFileSync(join(outlook, `${name}.txt`), R.renderText(config, "D") + "\n");

const payload = JSON.stringify({ html: signature, text: R.renderText(config, "D") }).replace(/</g, "\\u003c");
writeFileSync(join(outlook, "Copy Signature.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Copy ${name} signature</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; font: 14px/1.5 "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #eef1f6; }
  header { display: flex; flex-wrap: wrap; gap: 14px 20px; align-items: center; padding: 18px 24px; background: #fff; border-bottom: 1px solid #dde3ec; }
  h1 { margin: 0; font-size: 16px; }
  ol { margin: 4px 0 0; padding-left: 18px; color: #475569; font-size: 13px; }
  button { font: 600 14px "Segoe UI", system-ui, sans-serif; color: #fff; background: #e11d48; border: 0; border-radius: 8px; padding: 11px 20px; cursor: pointer; }
  button:hover { background: #be123c; }
  #status { font-size: 13px; color: #047857; min-height: 1.5em; }
  .controls { display: flex; align-items: center; gap: 10px; padding: 16px 24px 0; font-size: 13px; color: #475569; }
  input[type=range] { width: 260px; }
  .stage { padding: 16px 24px 40px; }
  .pane { background: #fff; border: 1px dashed #94a3b8; padding: 16px; box-sizing: border-box; }
</style>
</head>
<body>
<header>
  <div style="flex:1;min-width:260px">
    <h1>${name} — Outlook signature</h1>
    <ol>
      <li>Click <b>Copy signature</b>.</li>
      <li>In Outlook: <b>Settings → Account → Signatures</b>. Open your signature, select everything in the editor, and paste.</li>
      <li>Click <b>Save</b>.</li>
    </ol>
  </div>
  <div>
    <button id="copy" type="button">Copy signature</button>
    <div id="status" role="status" aria-live="polite"></div>
  </div>
</header>
<div class="controls">
  <label for="w">Preview width</label>
  <input id="w" type="range" min="320" max="1100" step="10" value="${maxWidth + 32}">
  <span id="wv"></span>
  <span>· The card fills the width up to ${maxWidth}px and shrinks when you zoom in or narrow the pane.</span>
</div>
<div class="stage"><div class="pane" id="pane"></div></div>
<script>
  var SIG = ${payload};
  var pane = document.getElementById("pane"), w = document.getElementById("w"), wv = document.getElementById("wv");
  pane.innerHTML = SIG.html;
  function size() { pane.style.width = w.value + "px"; wv.textContent = w.value + "px"; }
  w.oninput = size; size();

  var status = document.getElementById("status");
  function done(ok) {
    status.style.color = ok ? "#047857" : "#b91c1c";
    status.textContent = ok ? "Copied. Now paste it into Outlook." : "Copy failed. Try Chrome or Edge.";
  }
  // Puts the signature's exact HTML on the clipboard (no frozen widths).
  function viaEvent() {
    var ok = false;
    function onCopy(e) {
      e.clipboardData.setData("text/html", SIG.html);
      e.clipboardData.setData("text/plain", SIG.text);
      e.preventDefault();
      ok = true;
    }
    document.addEventListener("copy", onCopy);
    try { document.execCommand("copy"); } catch (err) { ok = false; }
    document.removeEventListener("copy", onCopy);
    done(ok);
  }
  document.getElementById("copy").onclick = function () {
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([SIG.html], { type: "text/html" }),
        "text/plain": new Blob([SIG.text], { type: "text/plain" })
      })]).then(function () { done(true); }, viaEvent);
    } else {
      viaEvent();
    }
  };
</script>
</body>
</html>
`);
console.log(`  outlook/${name}.htm, outlook/Copy Signature.html`);
