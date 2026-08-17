import { describe, expect, it } from "vitest";
import { normalizeRequestedAdjustmentsUrl } from "./requested-adjustments.ts";

describe("ajustes requisitados", () => {
  it("normaliza string e lista antiga para um único link", () => {
    expect(
      normalizeRequestedAdjustmentsUrl(
        "  https://drive.google.com/file/d/abc  ",
      ),
    ).toBe("https://drive.google.com/file/d/abc");
    expect(
      normalizeRequestedAdjustmentsUrl(["", " https://drive.google.com/file/d/abc "]),
    ).toBe("https://drive.google.com/file/d/abc");
    expect(normalizeRequestedAdjustmentsUrl([])).toBe("");
  });
});
