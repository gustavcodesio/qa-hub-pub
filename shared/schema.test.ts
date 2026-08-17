import { describe, expect, it } from "vitest";
import {
  createAppBodySchema,
  createSectionBodySchema,
  dbSchema,
} from "./schema.ts";

describe("schemas", () => {
  it("valida criação de app", () => {
    const parsed = createAppBodySchema.parse({
      name: "Gratos",
      slug: "gratos",
      copyCommon: true,
    });
    expect(parsed.copyCommon).toBe(true);
    expect(parsed.folder).toBe("");
  });

  it("exige título na section", () => {
    expect(() => createSectionBodySchema.parse({ title: "" })).toThrow();
  });

  it("preenche labels vazias em apps antigos", () => {
    const parsed = dbSchema.parse({
      apps: [
        {
          id: "gratos",
          name: "Gratos",
          slug: "gratos",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      sections: [],
      stories: [],
      comparisons: [],
      recordings: [],
    });
    expect(parsed.apps[0]?.labels).toEqual([]);
    expect(parsed.apps[0]?.iosTestUrl).toBe("");
    expect(parsed.apps[0]?.androidTestUrl).toBe("");
    expect(parsed.apps[0]?.requestedAdjustments).toBe("");
    expect(parsed.labelCatalog).toEqual([
      { name: "falhou login", color: "#ef4444", placement: "footer" },
      { name: "falhou cadastro", color: "#ef4444", placement: "footer" },
      { name: "splash screen errada", color: "#ef4444", placement: "footer" },
      { name: "paywall", color: "#ef4444", placement: "footer" },
      { name: "crash", color: "#ef4444", placement: "footer" },
    ]);
  });

  it("converte catálogo antigo de strings em objetos com cor", () => {
    const parsed = dbSchema.parse({
      apps: [],
      sections: [],
      stories: [],
      comparisons: [],
      recordings: [],
      labelCatalog: ["crash", { name: "paywall", color: "purple" }],
    });
    expect(parsed.labelCatalog).toEqual([
      { name: "crash", color: "#ef4444", placement: "footer" },
      { name: "paywall", color: "#8b5cf6", placement: "footer" },
    ]);
  });

  it("converte lista antiga de ajustes em um único link", () => {
    const parsed = dbSchema.parse({
      apps: [
        {
          id: "gratos",
          name: "Gratos",
          slug: "gratos",
          createdAt: "2026-01-01T00:00:00.000Z",
          requestedAdjustments: [
            "https://drive.google.com/file/d/abc/view",
          ],
        },
      ],
      sections: [],
      stories: [],
      comparisons: [],
      recordings: [],
    });
    expect(parsed.apps[0]?.requestedAdjustments).toBe(
      "https://drive.google.com/file/d/abc/view",
    );
  });
});
