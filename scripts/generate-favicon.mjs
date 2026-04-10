/**
 * Genera solo en public/ (evita duplicar con app/icon.png de Next, que a veces compite con /favicon.ico):
 * - public/icon.png (512, PWA / manifest / panel)
 * - public/favicon.ico (16/32/48)
 * - public/apple-touch-icon.png (180×180, iOS / Apple)
 *
 * Uso: npm run icons
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const toIco = require("to-ico");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "karun_logo.webp");
const publicIcon = path.join(root, "public", "icon.png");
const publicFavicon = path.join(root, "public", "favicon.ico");
const publicApple = path.join(root, "public", "apple-touch-icon.png");

if (!fs.existsSync(input)) {
  console.error("No existe:", input);
  process.exit(1);
}

const bg = { r: 165, g: 106, b: 66 };

const pipeline = () =>
  sharp(input)
    .resize(512, 512, { fit: "contain", background: { ...bg, alpha: 1 } })
    .flatten({ background: bg });

await pipeline().png().toFile(publicIcon);

const icoSizes = [16, 32, 48];
const icoBuffers = await Promise.all(
  icoSizes.map((s) => sharp(publicIcon).resize(s, s).png().toBuffer())
);
const icoFile = await toIco(icoBuffers);
await fs.promises.writeFile(publicFavicon, icoFile);

await sharp(input)
  .resize(180, 180, { fit: "contain", background: { ...bg, alpha: 1 } })
  .flatten({ background: bg })
  .png()
  .toFile(publicApple);

console.log(
  "OK:",
  [publicIcon, publicFavicon, publicApple]
    .map((p) => path.relative(root, p))
    .join(", ")
);
