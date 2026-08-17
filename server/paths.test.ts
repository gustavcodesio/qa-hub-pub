import path from "node:path";
import { describe, expect, it } from "vitest";
import { isVercelRuntime, resolveRuntimePaths, rootDir } from "./paths.ts";

describe("runtime paths", () => {
  it("detecta Vercel pela env VERCEL", () => {
    expect(isVercelRuntime({})).toBe(false);
    expect(isVercelRuntime({ VERCEL: "1" })).toBe(true);
  });

  it("grava data/ e public/uploads fora da Vercel", () => {
    const paths = resolveRuntimePaths({});
    expect(paths.dbPath).toBe(path.join(rootDir, "data", "db.json"));
    expect(paths.uploadsDir).toBe(path.join(rootDir, "public", "uploads"));
  });
});
