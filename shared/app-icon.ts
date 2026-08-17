import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const FALLBACK_ICONS = [
  "assets/images/icon.png",
  "assets/icon.png",
  "assets/app-icon.png",
  "assets/images/favicon.png",
  "assets/favicon.png",
];

function isInside(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return (
    resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`)
  );
}

export function parseExpoIcon(appJson: unknown): string | null {
  if (!appJson || typeof appJson !== "object") return null;
  const expo = (appJson as { expo?: { icon?: unknown } }).expo;
  if (typeof expo?.icon !== "string") return null;
  const icon = expo.icon.trim();
  return icon || null;
}

/** Caminho absoluto do ícone Expo, ou null se a pasta não tiver um arquivo válido. */
export function resolveAppIconPath(
  workspaceRoot: string,
  folder: string,
): string | null {
  const trimmed = folder.trim();
  if (!trimmed) return null;

  const appDir = path.resolve(workspaceRoot, trimmed);
  if (!isInside(workspaceRoot, appDir) || !existsSync(appDir)) return null;

  const candidates: string[] = [];
  const appJsonPath = path.join(appDir, "app.json");
  if (existsSync(appJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(appJsonPath, "utf8")) as unknown;
      const icon = parseExpoIcon(parsed);
      if (icon) candidates.push(icon);
    } catch {
      // app.json inválido: tenta os caminhos comuns
    }
  }
  candidates.push(...FALLBACK_ICONS);

  for (const relative of candidates) {
    const full = path.resolve(appDir, relative);
    if (!isInside(appDir, full)) continue;
    if (existsSync(full)) return full;
  }
  return null;
}

export function appIconPublicUrl(appId: string): string {
  return `/api/apps/${encodeURIComponent(appId)}/icon`;
}
