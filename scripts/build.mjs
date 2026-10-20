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

// Outlook: a bare document (no page padding) so it can live in the Signatures
// folder as-is, or be opened in a browser and copied.
const outlook = join(root, "outlook");
mkdirSync(outlook, { recursive: true });
const name = config.person.name;
writeFileSync(join(outlook, `${name}.htm`), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} signature</title>
</head>
<body style="margin:0;padding:0;">
${R.render(config, "D")}
</body>
</html>
`);
writeFileSync(join(outlook, `${name}.txt`), R.renderText(config, "D") + "\n");
console.log(`  outlook/${name}.htm`);
