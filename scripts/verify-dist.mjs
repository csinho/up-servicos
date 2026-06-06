import fs from "node:fs";
import path from "node:path";
import { assertWorkerEntryAsset, sanitizeWranglerJson } from "./sanitize-wrangler-json.mjs";

const required = [
  "dist/server/index.js",
  "dist/client",
  "dist/client/assets",
  "dist/client/sw.js",
  "dist/client/manifest.webmanifest",
  "dist/client/pwa-192x192.png",
  "dist/client/pwa-512x512.png",
];

const missing = required.filter((p) => !fs.existsSync(p));

if (missing.length) {
  console.error("ERRO: build incompleto. Faltando:");
  for (const p of missing) console.error("  -", p);
  console.error("\nConteúdo de dist/:");
  const walk = (dir, depth = 0) => {
    if (depth > 3 || !fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.relative(process.cwd(), full);
      console.error(" ", fs.statSync(full).isDirectory() ? `${rel}/` : rel);
      if (fs.statSync(full).isDirectory()) walk(full, depth + 1);
    }
  };
  walk("dist");
  process.exit(1);
}

sanitizeWranglerJson();
assertWorkerEntryAsset();

console.log("Build OK: dist/server + dist/client + wrangler.json");
