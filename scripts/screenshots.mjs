// Capture QA screenshots of each variant with headless Chrome/Edge (no npm deps).
//
//   node scripts/build.mjs && node scripts/screenshots.mjs
//
// Set CHROME_PATH if the browser is not in a standard location.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
mkdirSync(out, { recursive: true });

const browser = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!browser) throw new Error("Chrome/Edge not found — set CHROME_PATH.");

const shots = [
  ...["D", "A", "B", "C"].map((v) => ({ page: `dist/qa/${v}.html`, file: `qa-variant-${v}.png`, size: v === "D" ? "1220,900" : "1110,690" })),
  ...[["D", "d-flagship", "920,500"], ["A", "a-executive"], ["B", "b-leadership"], ["C", "c-personal-brand"]].map(([v, s, size]) => ({
    page: `dist/qa/${v}-clean.html`, file: `signature-${s}.png`, size: size || "620,260",
  })),
];

for (const s of shots) {
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
    "--allow-file-access-from-files", `--window-size=${s.size}`,
    `--screenshot=${join(out, s.file)}`, pathToFileURL(join(root, s.page)).href,
  ], { stdio: "ignore", timeout: 60000 });
  console.log(`  screenshots/${s.file}`);
}
