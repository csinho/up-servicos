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

/** Manifest estático para dev (`vite dev`) e fallback em produção. */
const manifest = {
  name: "Up Serviços",
  short_name: "Up Serviços",
  description: "Gestão de orçamentos, pedidos e financeiro para prestadores de serviço",
  lang: "pt-BR",
  dir: "ltr",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait-primary",
  theme_color: "#111111",
  background_color: "#ffffff",
  categories: ["business", "productivity"],
  icons: [
    { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
    { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

const manifestPath = path.join(root, "public", "manifest.webmanifest");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("gerado:", path.relative(root, manifestPath));
