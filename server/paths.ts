import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const rootDir = path.resolve(__dirname, "..");
export const workspaceRoot = path.resolve(rootDir, "..");
export const seedDbPath = path.join(rootDir, "data", "db.json");

export function isVercelRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL);
}

/** Pastas graváveis: no disco do repo local, em /tmp na Vercel (read-only). */
export function resolveRuntimePaths(env: NodeJS.ProcessEnv = process.env) {
  const onVercel = isVercelRuntime(env);
  const dataDir = onVercel
    ? path.join(os.tmpdir(), "qa-hub")
    : path.join(rootDir, "data");
  const uploadsDir = onVercel
    ? path.join(dataDir, "uploads")
    : path.join(rootDir, "public", "uploads");
  const dbPath = path.join(dataDir, "db.json");

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(uploadsDir, { recursive: true });

  if (onVercel && !existsSync(dbPath) && existsSync(seedDbPath)) {
    copyFileSync(seedDbPath, dbPath);
  }

  return { dataDir, uploadsDir, dbPath, workspaceRoot };
}
