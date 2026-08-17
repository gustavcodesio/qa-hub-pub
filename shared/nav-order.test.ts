import { describe, expect, it } from "vitest";
import { navIndex, sortByNavOrder } from "./nav-order.ts";

describe("nav-order", () => {
  it("no Karrin coloca Detalhe da lista antes de Produtos", () => {
    const titles = sortByNavOrder("karrin", [
      { title: "Produtos" },
      { title: "Home / Listas" },
      { title: "Detalhe da lista" },
    ]).map((item) => item.title);
    expect(titles).toEqual([
      "Home / Listas",
      "Detalhe da lista",
      "Produtos",
    ]);
    expect(navIndex("karrin", "Detalhe da lista")).toBeLessThan(
      navIndex("karrin", "Produtos")!,
    );
  });
});
