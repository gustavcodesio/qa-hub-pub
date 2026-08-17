import { describe, expect, it } from "vitest";
import {
  assignSectionOrders,
  compareComparisons,
  compareSections,
} from "./section-order.ts";

describe("section-order", () => {
  it("coloca Login primeiro e Perfil por último", () => {
    const sections = [
      { title: "Paywall", order: 2 },
      { title: "Perfil", order: 3 },
      { title: "Humor", order: 4 },
      { title: "Login", order: 0 },
      { title: "Cadastro", order: 1 },
    ];
    const titles = [...sections].sort(compareSections).map((s) => s.title);
    expect(titles[0]).toBe("Login");
    expect(titles.at(-1)).toBe("Perfil");
    expect(titles).toEqual(["Login", "Cadastro", "Paywall", "Humor", "Perfil"]);
  });

  it("reordena comparações com Login no topo e Perfil no fim", () => {
    const sections = [
      { id: "login", title: "Login", order: 0 },
      { id: "humor", title: "Humor", order: 1 },
      { id: "perfil", title: "Perfil", order: 2 },
    ];
    const comparisons = [
      { sectionId: "perfil" },
      { sectionId: null },
      { sectionId: "humor" },
      { sectionId: "login" },
    ];
    const ordered = [...comparisons].sort((a, b) =>
      compareComparisons(a, b, sections),
    );
    expect(ordered.map((c) => c.sectionId)).toEqual([
      "login",
      "humor",
      null,
      "perfil",
    ]);
  });

  it("na mesma tela coloca lista vazia antes da preenchida", () => {
    const sections = [{ id: "produtos", title: "Produtos", order: 1 }];
    const comparisons = [
      { sectionId: "produtos", listState: "filled" as const },
      { sectionId: "produtos", listState: null },
      { sectionId: "produtos", listState: "empty" as const },
    ];
    const ordered = [...comparisons].sort((a, b) =>
      compareComparisons(a, b, sections),
    );
    expect(ordered.map((c) => c.listState)).toEqual(["empty", "filled", null]);
  });

  it("na mesma tela coloca a página sem drawer antes da com drawer", () => {
    const sections = [
      { id: "registro", title: "Registro de hoje", order: 1 },
    ];
    const comparisons = [
      { sectionId: "registro", drawerLabel: "Bruxismo" },
      { sectionId: "registro", drawerLabel: null },
    ];
    const ordered = [...comparisons].sort((a, b) =>
      compareComparisons(a, b, sections),
    );
    expect(ordered.map((c) => c.drawerLabel)).toEqual([null, "Bruxismo"]);
  });

  it("renumera order após Login e Perfil", () => {
    const sections = [
      { title: "Perfil", order: 3 },
      { title: "Humor", order: 4 },
      { title: "Login", order: 0 },
    ];
    assignSectionOrders(sections);
    expect(sections.find((s) => s.title === "Login")?.order).toBe(0);
    expect(sections.find((s) => s.title === "Humor")?.order).toBe(1);
    expect(sections.find((s) => s.title === "Perfil")?.order).toBe(2);
  });

  it("no Karrin coloca Detalhe da lista antes de Produtos", () => {
    const sections = [
      { id: "produtos", appId: "karrin", title: "Produtos", order: 4 },
      { id: "listas", appId: "karrin", title: "Home / Listas", order: 3 },
      { id: "detalhe", appId: "karrin", title: "Detalhe da lista", order: 5 },
      { id: "login", appId: "karrin", title: "Login", order: 0 },
      { id: "perfil", appId: "karrin", title: "Perfil", order: 6 },
    ];
    const titles = [...sections].sort(compareSections).map((s) => s.title);
    expect(titles).toEqual([
      "Login",
      "Home / Listas",
      "Detalhe da lista",
      "Produtos",
      "Perfil",
    ]);

    const comparisons = [
      { sectionId: "produtos" },
      { sectionId: "detalhe" },
      { sectionId: "listas" },
    ];
    const ordered = [...comparisons].sort((a, b) =>
      compareComparisons(a, b, sections),
    );
    expect(ordered.map((c) => c.sectionId)).toEqual([
      "listas",
      "detalhe",
      "produtos",
    ]);
  });
});
