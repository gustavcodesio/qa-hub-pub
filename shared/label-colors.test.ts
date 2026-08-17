import { describe, expect, it } from "vitest";
import {
  DEFAULT_LABEL_COLOR,
  hexToRgba,
  normalizeLabelColor,
} from "./label-colors.ts";

describe("cor da label", () => {
  it("converte nomes antigos e hex curto para #rrggbb", () => {
    expect(normalizeLabelColor("red")).toBe("#ef4444");
    expect(normalizeLabelColor("#0ea")).toBe("#00eeaa");
    expect(normalizeLabelColor("#8B5CF6")).toBe("#8b5cf6");
  });

  it("cai no vermelho padrão se o valor for inválido", () => {
    expect(normalizeLabelColor("")).toBe(DEFAULT_LABEL_COLOR);
    expect(normalizeLabelColor("azul")).toBe(DEFAULT_LABEL_COLOR);
  });

  it("monta rgba a partir do hex", () => {
    expect(hexToRgba("#ef4444", 0.4)).toBe("rgba(239, 68, 68, 0.4)");
  });
});
