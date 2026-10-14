// A separate RSVP bridge prototype. The main site is static so it can host the
// uploaded DJ mix. Deploying this Worker later also requires audio asset storage.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist-worker");
const assets = {};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
};

for (const file of ["index.html", "styles.css", "app.js", "content.js"]) {
  assets[`/${file}`] = { type: mime[path.extname(file)], body: await fs.readFile(path.join(root, file), "utf8") };
}
for (const file of await fs.readdir(path.join(root, "assets"))) {
  const extension = path.extname(file);
  if (!mime[extension]) continue;
  const bytes = await fs.readFile(path.join(root, "assets", file));
  assets[`/assets/${file}`] = { type: mime[extension], body: bytes.toString("base64"), binary: true };
}
assets["/"] = assets["/index.html"];

const worker = await fs.readFile(path.join(root, "worker", "index.js"), "utf8");
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(path.join(dist, "server"), { recursive: true });
await fs.mkdir(path.join(dist, ".openai"), { recursive: true });
await fs.writeFile(path.join(dist, "server", "index.js"), `const ASSETS = ${JSON.stringify(assets)};\n${worker}`);
await fs.writeFile(path.join(dist, ".openai", "hosting.json"), JSON.stringify({
  project_id: JSON.parse(await fs.readFile(path.join(root, ".openai", "hosting.json"), "utf8")).project_id,
  d1: null,
  r2: null,
}, null, 2));
console.log(`Built RSVP bridge prototype in ${dist}`);
