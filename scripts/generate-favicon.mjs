/**
 * Genera en public/ (PNG con esquinas redondeadas en iconos cuadrados):
 * - public/icon.png (512)
 * - public/favicon-32.png, public/favicon-16.png
 * - public/apple-touch-icon.png (180×180)
 * - public/og.jpg (1200×630, sin recorte redondo — JPG / preview redes)
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

/**
 * Cuadrado redimensionado + máscara SVG (esquinas redondeadas, ~20% del lado).
 */
async function writeRoundedSquarePng(source512Png, size, outPath) {
  const rx = Math.max(
    2,
    Math.min(Math.round(size * 0.2), Math.max(1, Math.floor(size / 2) - 1))
  );
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="white"/>` +
      `</svg>`
  );
  await sharp(source512Png)
    .resize(size, size)
    .composite([{ input: svg, blend: "dest-in" }])
    .png()
    .toFile(outPath);
}

const base512 = await logoSquare().png().toBuffer();

await writeRoundedSquarePng(base512, 512, publicIcon);
await writeRoundedSquarePng(base512, 32, publicFavicon32);
await writeRoundedSquarePng(base512, 16, publicFavicon16);
await writeRoundedSquarePng(base512, 180, publicApple);

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
