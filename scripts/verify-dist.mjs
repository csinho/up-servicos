import fs from "node:fs";
import path from "node:path";

const required = [
  "dist/server/index.js",
  "dist/client",
  "dist/client/assets",
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

// Garante index.js se só existir worker-entry (hash muda a cada build)
const serverDir = "dist/server";
const indexPath = path.join(serverDir, "index.js");
if (!fs.existsSync(indexPath)) {
  const assets = path.join(serverDir, "assets");
  const entry = fs
    .readdirSync(assets)
    .find((f) => f.startsWith("worker-entry-") && f.endsWith(".js"));
  if (entry) {
    fs.writeFileSync(
      indexPath,
      `import { w } from "./assets/${entry}";\nexport { w as default };\n`,
    );
    console.log("Gerado dist/server/index.js a partir de", entry);
  }
}

fs.copyFileSync(
  "deploy/wrangler.server.json",
  path.join(serverDir, "wrangler.json"),
);
console.log("Build OK: dist/server + dist/client");
