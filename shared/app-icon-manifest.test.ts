import { describe, expect, it } from "vitest";
import { BUNDLED_APP_ICONS, bundledAppIconUrl } from "./app-icon-manifest.ts";

describe("ícones empacotados", () => {
  it("expõe URL estática dos apps", () => {
    expect(bundledAppIconUrl("gratos")).toBe("/app-icons/gratos.png");
    expect(bundledAppIconUrl("missing")).toBeNull();
    expect(Object.keys(BUNDLED_APP_ICONS)).toHaveLength(20);
  });
});
