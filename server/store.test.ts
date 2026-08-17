import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emptyDb } from "../shared/schema.ts";
import { JsonStore } from "./store.ts";

function tmpStore() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "qa-hub-"));
  const dbPath = path.join(dir, "db.json");
  const uploads = path.join(dir, "uploads");
  writeFileSync(dbPath, JSON.stringify(emptyDb()));
  const store = new JsonStore(dbPath, uploads);
  return { store, dir };
}

describe("JsonStore", () => {
  it("cria app e copia telas comuns", () => {
    const { store, dir } = tmpStore();
    try {
      const doc = store.createApp({
        name: "Novo",
        slug: "novo",
        copyCommon: true,
      });
      expect(doc?.name).toBe("Novo");
      expect(doc?.sections).toHaveLength(4);
      expect(doc?.sections.every((s) => s.kind === "common")).toBe(true);
      expect(doc?.sections[0]?.title).toBe("Login");
      expect(doc?.sections.at(-1)?.title).toBe("Perfil");
      const codes = doc?.sections.flatMap((s) => s.stories.map((st) => st.code));
      expect(codes).toContain("L1");
      expect(codes).toContain("C1");
      expect(codes).toContain("P1");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("cadastra section específica entre Login e Perfil", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({
        name: "X",
        slug: "x",
        copyCommon: true,
      });
      store.createSection(created!.id, {
        title: "Humor",
        route: "/humor",
        kind: "specific",
        stories: [{ code: "HU1", text: "Filtrar período." }],
      });
      const titles = store
        .getAppDocument(created!.id)
        ?.sections.map((s) => s.title);
      expect(titles?.[0]).toBe("Login");
      expect(titles?.at(-1)).toBe("Perfil");
      expect(titles).toContain("Humor");
      expect(titles?.indexOf("Humor")).toBeLessThan(titles!.indexOf("Perfil"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("cadastra section com histórias e atualiza status", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "X", slug: "x" });
      const appId = created!.id;
      store.createSection(appId, {
        title: "Humor",
        route: "/humor",
        kind: "specific",
        stories: [{ code: "HU1", text: "Filtrar período." }],
      });
      const doc = store.getAppDocument(appId);
      const story = doc?.sections[0]?.stories[0];
      expect(story?.code).toBe("HU1");
      expect(story?.status).toBe("pending");
      store.patchStory(story!.id, { status: "passed" });
      const updated = store.getAppDocument(appId);
      expect(updated?.sections[0]?.stories[0]?.status).toBe("passed");
      const listed = store.listApps()[0];
      expect(listed.passedCount).toBe(1);
      expect(listed.storyCount).toBe(1);
      expect(listed.iosPhotoCount).toBe(0);
      expect(listed.hasIosPhotos).toBe(false);
      expect(listed.labels).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("grava ajustes requisitados no app", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "Flowy", slug: "flowy" });
      store.patchApp(created!.id, {
        requestedAdjustments:
          "  https://drive.google.com/file/d/1WfJSnwVsQoLiStHrhnpBA60FPbXP5ijx/view  ",
      });
      expect(store.listApps()[0].requestedAdjustments).toBe(
        "https://drive.google.com/file/d/1WfJSnwVsQoLiStHrhnpBA60FPbXP5ijx/view",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("recusa slug duplicado", () => {
    const { store, dir } = tmpStore();
    try {
      store.createApp({ name: "A", slug: "gratos" });
      expect(() => store.createApp({ name: "B", slug: "gratos" })).toThrow(
        /slug/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("grava listState na comparação", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "Karrin", slug: "karrin" });
      const section = store.createSection(created!.id, {
        title: "Produtos",
        kind: "specific",
      });
      const sectionId = section?.sections.find((s) => s.title === "Produtos")?.id;
      store.addComparison({
        appId: created!.id,
        platform: "ios",
        sectionId,
        figmaImage: "/uploads/empty.png",
        listState: "empty",
      });
      store.addComparison({
        appId: created!.id,
        platform: "ios",
        sectionId,
        figmaImage: "/uploads/filled.png",
        listState: "filled",
      });
      const doc = store.getAppDocument(created!.id);
      expect(doc?.comparisons.map((c) => c.listState)).toEqual([
        "empty",
        "filled",
      ]);
      store.patchComparison(doc!.comparisons[1]!.id, { listState: null });
      const updated = store.getAppDocument(created!.id);
      expect(updated?.comparisons[1]?.listState).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("grava drawerLabel na comparação", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "BruxCare", slug: "bruxcare" });
      const section = store.createSection(created!.id, {
        title: "Registro de hoje",
        kind: "specific",
      });
      const sectionId = section?.sections.find(
        (s) => s.title === "Registro de hoje",
      )?.id;
      store.addComparison({
        appId: created!.id,
        platform: "ios",
        sectionId,
        figmaImage: "/uploads/page.png",
      });
      store.addComparison({
        appId: created!.id,
        platform: "ios",
        sectionId,
        figmaImage: "/uploads/drawer.png",
        drawerLabel: "  Bruxismo  ",
      });
      const doc = store.getAppDocument(created!.id);
      expect(doc?.comparisons.map((c) => c.drawerLabel)).toEqual([
        null,
        "Bruxismo",
      ]);
      store.patchComparison(doc!.comparisons[1]!.id, { drawerLabel: " " });
      const updated = store.getAppDocument(created!.id);
      expect(updated?.comparisons[1]?.drawerLabel).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("grava labels no app", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "Flowy", slug: "flowy" });
      store.patchApp(created!.id, {
        labels: ["  falhou login  ", "falhou login", "crash"],
      });
      const listed = store.listApps()[0];
      expect(listed.labels).toEqual(["falhou login", "crash"]);
      store.patchApp(created!.id, { labels: [] });
      expect(store.listApps()[0].labels).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("cria, renomeia e exclui labels do catálogo", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "Flowy", slug: "flowy" });
      store.createLabel("build falhou", "orange");
      store.patchApp(created!.id, { labels: ["build falhou"] });
      expect(store.listLabels().some((item) => item.name === "build falhou")).toBe(
        true,
      );
      expect(
        store.listLabels().find((item) => item.name === "build falhou")?.color,
      ).toBe("#f97316");
      store.renameLabel("build falhou", "build quebrado");
      expect(store.listApps()[0].labels).toEqual(["build quebrado"]);
      expect(
        store.listLabels().find((item) => item.name === "build quebrado")?.color,
      ).toBe("#f97316");
      store.patchLabel("build quebrado", { color: "blue" });
      expect(
        store.listLabels().find((item) => item.name === "build quebrado")?.color,
      ).toBe("#0ea5e9");
      store.patchLabel("build quebrado", { placement: "header" });
      expect(
        store.listLabels().find((item) => item.name === "build quebrado")
          ?.placement,
      ).toBe("header");
      expect(store.deleteLabel("build quebrado")).toBe(true);
      expect(store.listApps()[0].labels).toEqual([]);
      expect(
        store.listLabels().some((item) => item.name === "build quebrado"),
      ).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("remove print do TestFlight e apaga o arquivo órfão", () => {
    const { store, dir } = tmpStore();
    try {
      const uploads = path.join(dir, "uploads");
      writeFileSync(path.join(uploads, "tf.png"), "tf");
      writeFileSync(path.join(uploads, "figma.png"), "figma");
      const created = store.createApp({ name: "Gratos", slug: "gratos" });
      const added = store.addComparison({
        appId: created!.id,
        platform: "ios",
        appImage: "/uploads/tf.png",
        figmaImage: "/uploads/figma.png",
      });
      const comparisonId = added!.comparisons[0]!.id;
      const updated = store.clearComparisonImage(comparisonId, "appImage");
      expect(updated?.comparisons[0]?.appImage).toBe("");
      expect(updated?.comparisons[0]?.figmaImage).toBe("/uploads/figma.png");
      expect(existsSync(path.join(uploads, "tf.png"))).toBe(false);
      expect(existsSync(path.join(uploads, "figma.png"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("marca app com fotos iOS a partir de 3 prints", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({ name: "SubTracker", slug: "subtracker" });
      const appId = created!.id;
      for (const name of ["login", "inicio", "perfil"]) {
        store.addComparison({
          appId,
          platform: "ios",
          figmaImage: `/uploads/${name}-figma.png`,
          appImage: `/uploads/${name}.png`,
        });
      }
      store.addComparison({
        appId,
        platform: "android",
        figmaImage: "/uploads/android-figma.png",
        appImage: "/uploads/android.png",
      });
      store.addComparison({
        appId,
        platform: "ios",
        figmaImage: "/uploads/empty-figma.png",
      });
      const listed = store.listApps()[0];
      expect(listed.iosPhotoCount).toBe(3);
      expect(listed.hasIosPhotos).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ordena telas logadas do Karrin pela navbar", () => {
    const { store, dir } = tmpStore();
    try {
      const created = store.createApp({
        name: "Karrin",
        slug: "karrin",
        copyCommon: true,
      });
      const appId = created!.id;
      store.createSection(appId, { title: "Produtos", kind: "specific" });
      store.createSection(appId, { title: "Home / Listas", kind: "specific" });
      store.createSection(appId, { title: "Detalhe da lista", kind: "specific" });
      const titles = store
        .getAppDocument(appId)
        ?.sections.map((s) => s.title);
      expect(titles).toEqual([
        "Login",
        "Cadastro",
        "Paywall",
        "Home / Listas",
        "Detalhe da lista",
        "Produtos",
        "Perfil",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
