import fs from "node:fs";
import path from "node:path";

const serverDir = "dist/server";
const target = path.join(serverDir, "wrangler.json");
const fallback = "deploy/wrangler.server.json";

const DEFAULT_RULES = [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeMinimal(cfg) {
  const minimal = {
    name: cfg.name ?? "freela-os",
    main: cfg.main ?? "index.js",
    compatibility_date: cfg.compatibility_date ?? "2025-09-24",
    compatibility_flags: cfg.compatibility_flags ?? ["nodejs_compat"],
    assets: {
      directory: cfg.assets?.directory ?? "../client",
    },
    no_bundle: cfg.no_bundle ?? true,
    rules: cfg.rules?.length ? cfg.rules : DEFAULT_RULES,
    observability: cfg.observability ?? { enabled: true },
    triggers: cfg.triggers ?? { crons: ["0 12 * * *"] },
    vars: cfg.vars ?? {},
  };
  fs.writeFileSync(target, `${JSON.stringify(minimal, null, 2)}\n`);
}

export function sanitizeWranglerJson() {
  if (fs.existsSync(target)) {
    writeMinimal(readJson(target));
    return;
  }
  if (fs.existsSync(fallback)) {
    writeMinimal(readJson(fallback));
    return;
  }
  throw new Error("wrangler.json não encontrado após o build.");
}

export function assertWorkerEntryAsset() {
  const indexPath = path.join(serverDir, "index.js");
  const content = fs.readFileSync(indexPath, "utf8");
  const m = content.match(/\.\/assets\/(worker-entry-[^"]+\.js)/);
  if (!m) {
    throw new Error("index.js não referencia worker-entry em ./assets/");
  }
  const assetFile = path.join(serverDir, "assets", m[1]);
  if (!fs.existsSync(assetFile)) {
    throw new Error(
      `Build inconsistente: index.js importa ${m[1]} mas o arquivo não existe em dist/server/assets/`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  sanitizeWranglerJson();
  assertWorkerEntryAsset();
  console.log("wrangler.json OK");
}
