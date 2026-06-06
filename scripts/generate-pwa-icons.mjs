import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svgPath = path.join(root, "public", "favicon.svg");
const svg = fs.readFileSync(svgPath);

const sizes = [180, 192, 512];

for (const size of sizes) {
  const out = path.join(root, "public", `pwa-${size}x${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("gerado:", path.relative(root, out));
}
