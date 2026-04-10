/**
 * Regenera public/icon.png desde el wordmark del hero (fondo #a56a42).
 * Uso: node scripts/generate-favicon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "karun_logo.webp");
const output = path.join(root, "public", "icon.png");

if (!fs.existsSync(input)) {
  console.error("No existe:", input);
  process.exit(1);
}

const bg = { r: 165, g: 106, b: 66 };

await sharp(input)
  .resize(512, 512, { fit: "contain", background: { ...bg, alpha: 1 } })
  .flatten({ background: bg })
  .png()
  .toFile(output);

console.log("OK:", path.relative(root, output));
