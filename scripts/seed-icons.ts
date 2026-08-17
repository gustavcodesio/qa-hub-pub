import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAppIconPath } from "../shared/app-icon.ts";
import { dbSchema } from "../shared/schema.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(root, "..");
const outDir = path.join(root, "public", "app-icons");
const manifestPath = path.join(root, "shared", "app-icon-manifest.ts");

function seed(): void {
  const db = dbSchema.parse(
    JSON.parse(readFileSync(path.join(root, "data", "db.json"), "utf8")),
  );
  mkdirSync(outDir, { recursive: true });

  const entries: [string, string][] = [];
  for (const app of db.apps) {
    const source = resolveAppIconPath(workspaceRoot, app.folder);
    if (!source) {
      console.warn(`sem ícone: ${app.id} (${app.folder})`);
      continue;
    }
    const ext = path.extname(source).toLowerCase() || ".png";
    const filename = `${app.id}${ext}`;
    copyFileSync(source, path.join(outDir, filename));
    entries.push([app.id, `/app-icons/${filename}`]);
    console.log(`${app.id} <- ${path.relative(workspaceRoot, source)}`);
  }

  const lines = entries
    .map(([id, url]) => `  ${JSON.stringify(id)}: ${JSON.stringify(url)},`)
    .join("\n");
  writeFileSync(
    manifestPath,
    `/** Gerado por scripts/seed-icons.ts — não editar à mão. */\nexport const BUNDLED_APP_ICONS: Readonly<Record<string, string>> = {\n${lines}\n};\n\nexport function bundledAppIconUrl(appId: string): string | null {\n  return BUNDLED_APP_ICONS[appId] ?? null;\n}\n`,
  );
  console.log(`${entries.length} ícones em public/app-icons`);
}

seed();
