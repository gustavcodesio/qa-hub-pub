import { describe, expect, it } from "vitest";
import { APP_SUMMARIES } from "./app-summaries.ts";

describe("APP_SUMMARIES", () => {
  it("tem slugs e ids únicos", () => {
    const slugs = APP_SUMMARIES.map((app) => app.slug);
    const ids = APP_SUMMARIES.map((app) => app.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("não inclui Gratos nem Karrin (já cadastrados no hub)", () => {
    expect(APP_SUMMARIES.some((app) => app.slug === "gratos")).toBe(false);
    expect(APP_SUMMARIES.some((app) => app.slug === "karrin")).toBe(false);
  });

  it("toda tela específica tem ao menos uma história", () => {
    for (const app of APP_SUMMARIES) {
      expect(app.specific.length).toBeGreaterThan(0);
      for (const section of app.specific) {
        expect(section.stories.length).toBeGreaterThan(0);
      }
    }
  });
});
