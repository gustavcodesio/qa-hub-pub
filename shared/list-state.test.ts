import { describe, expect, it } from "vitest";
import {
  comparisonCaption,
  drawerRank,
  listStateRank,
  normalizeDrawerLabel,
} from "./list-state.ts";

describe("list-state", () => {
  it("monta a legenda de lista vazia e preenchida", () => {
    expect(comparisonCaption("Produtos", "empty")).toBe(
      "Tela de Produtos — quando não tem nenhum registrado",
    );
    expect(comparisonCaption("Produtos", "filled")).toBe(
      "Tela de Produtos — quando tem itens registrados",
    );
    expect(comparisonCaption("Produtos", null)).toBe("Produtos");
    expect(comparisonCaption(undefined, null)).toBe("Geral");
  });

  it("legenda de drawer prevalece sobre empty/filled", () => {
    expect(comparisonCaption("Registro de hoje", "filled", "Bruxismo")).toBe(
      "Tela de Registro de hoje — com drawer de Bruxismo aberto",
    );
    expect(comparisonCaption("Produtos", "empty", "adicionar produto")).toBe(
      "Tela de Produtos — com drawer de adicionar produto aberto",
    );
  });

  it("ordena empty antes de filled e sem drawer antes de com drawer", () => {
    expect(listStateRank("empty")).toBeLessThan(listStateRank("filled"));
    expect(listStateRank("filled")).toBeLessThan(listStateRank(null));
    expect(drawerRank(null)).toBeLessThan(drawerRank("Bruxismo"));
    expect(normalizeDrawerLabel("  ")).toBeNull();
    expect(normalizeDrawerLabel(" Bruxismo ")).toBe("Bruxismo");
  });
});
