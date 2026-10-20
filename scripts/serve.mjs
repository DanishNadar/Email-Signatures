// Zero-dependency static server for the Studio.
//
//   node scripts/serve.mjs [port]   →  http://localhost:5173/studio/
//
// Serving over http (rather than file://) enables the async Clipboard API
// and PNG export.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT || 5173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/") { res.writeHead(302, { Location: "/studio/" }); return res.end(); }
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  try {
    if (!statSync(file).isFile()) throw new Error();
  } catch {
    res.writeHead(404); return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Signature Studio → http://localhost:${port}/studio/`));
