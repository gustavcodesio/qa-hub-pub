import { describe, expect, it } from "vitest";
import {
  addAppLabel,
  mergeLabelCatalog,
  normalizeAppLabels,
  removeAppLabel,
  renameInCatalog,
  renameInLabels,
  setLabelColor,
  setLabelPlacement,
  splitLabelsByPlacement,
} from "./app-labels.ts";

describe("labels do app", () => {
  it("remove vazios, espaços e duplicatas", () => {
    expect(
      normalizeAppLabels(["  falhou login  ", "", "Falhou login", "crash"]),
    ).toEqual(["falhou login", "crash"]);
  });

  it("adiciona e remove sem duplicar", () => {
    const withLogin = addAppLabel([], "falhou login");
    expect(addAppLabel(withLogin, "Falhou login")).toEqual(["falhou login"]);
    expect(removeAppLabel(withLogin, "falhou login")).toEqual([]);
  });

  it("une catálogo e labels em uso, e renomeia", () => {
    expect(
      mergeLabelCatalog(
        [{ name: "falhou login", color: "blue" }],
        ["crash", "falhou login"],
      ),
    ).toEqual([
      { name: "falhou login", color: "#0ea5e9", placement: "footer" },
      { name: "crash", color: "#ef4444", placement: "footer" },
    ]);
    expect(renameInLabels(["falhou login", "crash"], "falhou login", "login")).toEqual(
      ["login", "crash"],
    );
    expect(
      renameInCatalog(
        [
          { name: "falhou login", color: "blue", placement: "footer" },
          { name: "crash", color: "orange", placement: "footer" },
        ],
        "falhou login",
        "login",
      ),
    ).toEqual([
      { name: "login", color: "#0ea5e9", placement: "footer" },
      { name: "crash", color: "#f97316", placement: "footer" },
    ]);
  });

  it("atualiza a cor sem perder o restante do catálogo", () => {
    expect(
      setLabelColor(
        [
          { name: "crash", color: "red", placement: "footer" },
          { name: "paywall", color: "purple", placement: "footer" },
        ],
        "crash",
        "yellow",
      ),
    ).toEqual([
      { name: "crash", color: "#eab308", placement: "footer" },
      { name: "paywall", color: "purple", placement: "footer" },
    ]);
  });

  it("separa labels fixadas no card das demais", () => {
    const catalog = setLabelPlacement(
      [
        { name: "crash", color: "red", placement: "footer" },
        { name: "Testes gb finalizado", color: "green", placement: "footer" },
      ],
      "Testes gb finalizado",
      "header",
    );
    expect(catalog.find((item) => item.name === "Testes gb finalizado")?.placement).toBe(
      "header",
    );
    expect(
      splitLabelsByPlacement(
        ["crash", "Testes gb finalizado"],
        catalog,
      ),
    ).toEqual({
      header: ["Testes gb finalizado"],
      footer: ["crash"],
    });
  });
});
