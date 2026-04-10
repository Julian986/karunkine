/**
 * Genera en public/ (favicons en PNG; evita .ico con PNG interno que Chrome a veces muestra corrupto):
 * - public/icon.png (512, PWA / manifest / panel)
 * - public/favicon-32.png, public/favicon-16.png (pestaña del navegador)
 * - public/apple-touch-icon.png (180×180)
 * - public/og.jpg (1200×630, Open Graph / WhatsApp)
 *
 * No genera .ico: next.config redirige /favicon.ico → /favicon-32.png
 *
 * Uso: npm run icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "public", "karun_logo.webp");
const publicIcon = path.join(root, "public", "icon.png");
const publicFavicon32 = path.join(root, "public", "favicon-32.png");
const publicFavicon16 = path.join(root, "public", "favicon-16.png");
const publicApple = path.join(root, "public", "apple-touch-icon.png");
const publicOg = path.join(root, "public", "og.jpg");

if (!fs.existsSync(input)) {
  console.error("No existe:", input);
  process.exit(1);
}

const bg = { r: 165, g: 106, b: 66 };

const logoSquare = () =>
  sharp(input)
    .resize(512, 512, { fit: "contain", background: { ...bg, alpha: 1 } })
    .flatten({ background: bg });

await logoSquare().png().toFile(publicIcon);

await sharp(publicIcon).resize(32, 32).png().toFile(publicFavicon32);
await sharp(publicIcon).resize(16, 16).png().toFile(publicFavicon16);

await sharp(input)
  .resize(180, 180, { fit: "contain", background: { ...bg, alpha: 1 } })
  .flatten({ background: bg })
  .png()
  .toFile(publicApple);

const ogW = 1200;
const ogH = 630;
const logoMaxW = 920;
const logoMaxH = 440;
const logoLayer = await sharp(input)
  .resize(logoMaxW, logoMaxH, { fit: "contain", background: { ...bg, alpha: 1 } })
  .flatten({ background: bg })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: ogW,
    height: ogH,
    channels: 3,
    background: bg,
  },
})
  .composite([{ input: logoLayer, gravity: "center" }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(publicOg);

console.log(
  "OK:",
  [publicIcon, publicFavicon32, publicFavicon16, publicApple, publicOg]
    .map((p) => path.relative(root, p))
    .join(", ")
);
