import { describe, expect, it } from "vitest";
import {
  classifyScreenshotName,
  mergeComparisonFiles,
  pairComparisonFiles,
} from "./identify-comparison.ts";

describe("classifyScreenshotName", () => {
  it("reconhece print do Figma", () => {
    expect(
      classifyScreenshotName("Captura de Tela 2026-08-16 às 12.39.38.png"),
    ).toBe("figma");
  });

  it("reconhece print do TestFlight / WhatsApp", () => {
    expect(
      classifyScreenshotName("WhatsApp Image 2026-08-16 at 12.39.38.jpeg"),
    ).toBe("testflight");
  });
});

describe("mergeComparisonFiles", () => {
  it("acumula um print de cada vez", () => {
    const first = mergeComparisonFiles({ figma: null, testflight: null }, [
      { name: "WhatsApp Image 1.jpeg" },
    ]);
    expect(first.testflight?.name).toContain("WhatsApp");
    expect(first.figma).toBeNull();

    const both = mergeComparisonFiles(first, [
      { name: "Captura de Tela 1.png" },
    ]);
    expect(both.figma?.name).toContain("Captura");
    expect(both.testflight?.name).toContain("WhatsApp");
  });

  it("aceita os dois de uma vez", () => {
    const pair = pairComparisonFiles([
      { name: "WhatsApp Image 12.39.38.jpeg" },
      { name: "Captura de Tela 12.39.38.png" },
    ]);
    expect(pair.testflight.name).toContain("WhatsApp");
    expect(pair.figma.name).toContain("Captura");
  });
});
