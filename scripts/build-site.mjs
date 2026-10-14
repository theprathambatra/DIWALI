import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const maxAssetBytes = 25 * 1024 * 1024;
const chunkDir = path.join(root, "assets", "audio-chunks");
const audio = {
  "stuvi-diwali-set-00.mp3": "c41cc38c01f2ef2a9b1264454878e7667f5aabe1b9c41fcca8236b68ae18c76f",
  "stuvi-diwali-set-01.mp3": "91a79cea615e7e134aa3a1fd55ffdd4e690360810d0ebe2930f353fdb1b570ba",
  "stuvi-diwali-set-02.mp3": "68a55630a89b47ca097e399bbb694949c0aa1664a19ab0ab0f59387523fbc216",
};

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(path.join(dist, ".openai"), { recursive: true });
for (const file of ["index.html", "styles.css", "app.js", "content.js"]) {
  await fs.copyFile(path.join(root, file), path.join(dist, file));
}
await fs.cp(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
  filter: source => source !== chunkDir && !source.startsWith(`${chunkDir}${path.sep}`),
});
await fs.copyFile(path.join(root, ".openai", "hosting.json"), path.join(dist, ".openai", "hosting.json"));

// GitHub stores the mix in smaller chunks. Reassemble byte-identical MP3s for hosting.
const chunkNames = await fs.readdir(chunkDir);
for (const [name, expectedHash] of Object.entries(audio)) {
  const parts = chunkNames.filter(part => part.startsWith(`${name}.part`)).sort();
  if (!parts.length) throw new Error(`Missing audio chunks for ${name}`);
  const target = path.join(dist, "assets", name);
  const hash = createHash("sha256");
  await fs.writeFile(target, "");
  for (const part of parts) {
    const bytes = await fs.readFile(path.join(chunkDir, part));
    hash.update(bytes);
    await fs.appendFile(target, bytes);
  }
  if (hash.digest("hex") !== expectedHash) throw new Error(`Audio chunks for ${name} failed the checksum`);
}

for (const file of await fs.readdir(path.join(dist, "assets"))) {
  const size = (await fs.stat(path.join(dist, "assets", file))).size;
  if (size > maxAssetBytes) throw new Error(`${file} exceeds the 25 MiB static asset limit`);
}
console.log(`Built the static invitation in ${dist}`);
