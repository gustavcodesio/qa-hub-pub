import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  appIconPublicUrl,
  parseExpoIcon,
  resolveAppIconPath,
} from "./app-icon.ts";

describe("ícone do app", () => {
  it("lê expo.icon do app.json", () => {
    expect(parseExpoIcon({ expo: { icon: "./assets/images/icon.png" } })).toBe(
      "./assets/images/icon.png",
    );
    expect(parseExpoIcon({ expo: { icon: "  " } })).toBeNull();
    expect(parseExpoIcon({})).toBeNull();
  });

  it("monta a URL pública do ícone", () => {
    expect(appIconPublicUrl("abc")).toBe("/api/apps/abc/icon");
  });

  it("resolve o ícone a partir do app.json", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "qa-hub-icon-"));
    try {
      const appDir = path.join(root, "gratos-app");
      const assets = path.join(appDir, "assets", "images");
      mkdirSync(assets, { recursive: true });
      writeFileSync(
        path.join(appDir, "app.json"),
        JSON.stringify({ expo: { icon: "./assets/images/icon.png" } }),
      );
      writeFileSync(path.join(assets, "icon.png"), "png");
      expect(resolveAppIconPath(root, "gratos-app")).toBe(
        path.join(assets, "icon.png"),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("bloqueia pasta fora do workspace", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "qa-hub-icon-"));
    try {
      expect(resolveAppIconPath(root, "../outro")).toBeNull();
      expect(resolveAppIconPath(root, "")).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
