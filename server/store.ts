import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { COMMON_SECTIONS } from "../shared/common-template.ts";
import {
  catalogHasLabel,
  mergeLabelCatalog,
  normalizeAppLabels,
  normalizeLabelColor,
  renameInCatalog,
  renameInLabels,
  setLabelColor,
  setLabelPlacement,
  type LabelColor,
  type LabelPlacement,
} from "../shared/app-labels.ts";
import {
  countIosAppPhotos,
  hasIosPhotosReady,
} from "../shared/ios-photos.ts";
import { normalizeDrawerLabel } from "../shared/list-state.ts";
import { resolveNavAppId } from "../shared/nav-order.ts";
import { normalizeRequestedAdjustmentsUrl } from "../shared/requested-adjustments.ts";
import {
  assignSectionOrders,
  compareComparisons,
  compareSections,
} from "../shared/section-order.ts";
import {
  dbSchema,
  emptyDb,
  type Comparison,
  type Db,
  type Recording,
  type Section,
  type Story,
} from "./types.ts";

export type { Db };

function nowIso(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

export type CreateAppInput = {
  name: string;
  slug: string;
  folder?: string;
  figmaUrl?: string;
  iosTestUrl?: string;
  androidTestUrl?: string;
  notes?: string;
  requestedAdjustments?: string;
  labels?: string[];
  copyCommon?: boolean;
};

export type PatchAppInput = Partial<
  Pick<
    CreateAppInput,
    | "name"
    | "slug"
    | "folder"
    | "figmaUrl"
    | "iosTestUrl"
    | "androidTestUrl"
    | "notes"
    | "requestedAdjustments"
    | "labels"
  >
>;

export type CreateSectionInput = {
  title: string;
  route?: string;
  kind?: "common" | "specific";
  stories?: { code: string; text: string }[];
};

export class JsonStore {
  private readonly dbPath: string;
  private readonly uploadsDir: string;

  constructor(dbPath: string, uploadsDir: string) {
    this.dbPath = dbPath;
    this.uploadsDir = uploadsDir;
    mkdirSync(path.dirname(dbPath), { recursive: true });
    mkdirSync(uploadsDir, { recursive: true });
    if (!existsSync(dbPath)) {
      this.write(emptyDb());
    }
  }

  read(): Db {
    const raw = readFileSync(this.dbPath, "utf8");
    const db = dbSchema.parse(JSON.parse(raw));
    if (this.migrateRecordingsToSections(db)) {
      this.write(db);
    }
    return db;
  }

  /** Gravações antigas vinham da história; agora pertencem à tela. */
  private migrateRecordingsToSections(db: Db): boolean {
    let changed = false;
    for (const rec of db.recordings) {
      if (rec.sectionId) continue;
      const story = rec.storyId
        ? db.stories.find((item) => item.id === rec.storyId)
        : undefined;
      if (!story) continue;
      rec.sectionId = story.sectionId;
      changed = true;
    }
    return changed;
  }

  private write(db: Db): void {
    const tmp = `${this.dbPath}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(db, null, 2)}\n`, "utf8");
    renameSync(tmp, this.dbPath);
  }

  private unlinkUpload(url: string): void {
    const filename = url.replace(/^\/uploads\//, "");
    if (!filename || filename.includes("..") || filename.includes("/")) return;
    const full = path.join(this.uploadsDir, filename);
    if (existsSync(full)) unlinkSync(full);
  }

  private unlinkIfOrphan(db: Db, url: string): void {
    if (!url) return;
    const used =
      db.comparisons.some((c) => c.appImage === url || c.figmaImage === url) ||
      db.recordings.some((r) => r.url === url);
    if (!used) this.unlinkUpload(url);
  }

  listApps() {
    const db = this.read();
    return db.apps.map((app) => {
      const sections = db.sections.filter((s) => s.appId === app.id);
      const stories = db.stories.filter((st) =>
        sections.some((s) => s.id === st.sectionId),
      );
      const passed = stories.filter((st) => st.status === "passed").length;
      const iosPhotoCount = countIosAppPhotos(
        db.comparisons.filter((comparison) => comparison.appId === app.id),
      );
      return {
        ...app,
        sectionCount: sections.length,
        storyCount: stories.length,
        passedCount: passed,
        iosPhotoCount,
        hasIosPhotos: hasIosPhotosReady(iosPhotoCount),
      };
    });
  }

  getAppDocument(appId: string) {
    const db = this.read();
    const app = db.apps.find((a) => a.id === appId);
    if (!app) return null;
    const navAppId = resolveNavAppId(app.id, app.slug);
    const sections = db.sections
      .filter((s) => s.appId === appId)
      .sort((a, b) =>
        compareSections(
          { ...a, appId: navAppId },
          { ...b, appId: navAppId },
        ),
      )
      .map((section) => ({
        ...section,
        recordings: db.recordings.filter((r) => r.sectionId === section.id),
        stories: db.stories.filter((st) => st.sectionId === section.id),
      }));
    const comparisons = db.comparisons
      .filter((c) => c.appId === appId)
      .sort((a, b) => compareComparisons(a, b, sections, navAppId));
    return { ...app, sections, comparisons };
  }

  createApp(input: CreateAppInput) {
    const db = this.read();
    const slug = input.slug.trim().toLowerCase();
    if (db.apps.some((a) => a.slug === slug)) {
      throw new Error("Já existe um app com este slug.");
    }
    const app = {
      id: id(),
      name: input.name.trim(),
      slug,
      folder: input.folder?.trim() ?? "",
      figmaUrl: input.figmaUrl?.trim() ?? "",
      iosTestUrl: input.iosTestUrl?.trim() ?? "",
      androidTestUrl: input.androidTestUrl?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      requestedAdjustments: normalizeRequestedAdjustmentsUrl(
        input.requestedAdjustments ?? "",
      ),
      labels: normalizeAppLabels(input.labels ?? []),
      createdAt: nowIso(),
    };
    db.apps.push(app);
    if (input.copyCommon) {
      COMMON_SECTIONS.forEach((tpl, index) => {
        const section: Section = {
          id: id(),
          appId: app.id,
          title: tpl.title,
          route: tpl.route,
          kind: tpl.kind,
          order: index,
        };
        db.sections.push(section);
        for (const story of tpl.stories) {
          db.stories.push({
            id: id(),
            sectionId: section.id,
            code: story.code,
            text: story.text,
            status: "pending",
            notes: "",
          });
        }
      });
    }
    this.write(db);
    return this.getAppDocument(app.id);
  }

  patchApp(appId: string, patch: PatchAppInput) {
    const db = this.read();
    const app = db.apps.find((a) => a.id === appId);
    if (!app) return null;
    if (patch.name !== undefined) app.name = patch.name.trim();
    if (patch.slug !== undefined) app.slug = patch.slug.trim().toLowerCase();
    if (patch.folder !== undefined) app.folder = patch.folder.trim();
    if (patch.figmaUrl !== undefined) app.figmaUrl = patch.figmaUrl.trim();
    if (patch.iosTestUrl !== undefined) app.iosTestUrl = patch.iosTestUrl.trim();
    if (patch.androidTestUrl !== undefined) {
      app.androidTestUrl = patch.androidTestUrl.trim();
    }
    if (patch.notes !== undefined) app.notes = patch.notes.trim();
    if (patch.requestedAdjustments !== undefined) {
      app.requestedAdjustments = normalizeRequestedAdjustmentsUrl(
        patch.requestedAdjustments,
      );
    }
    if (patch.labels !== undefined) {
      app.labels = normalizeAppLabels(patch.labels);
      db.labelCatalog = mergeLabelCatalog(db.labelCatalog, app.labels);
    }
    this.write(db);
    return this.getAppDocument(appId);
  }

  private allKnownLabels(db: Db) {
    return mergeLabelCatalog(
      db.labelCatalog,
      db.apps.flatMap((app) => app.labels),
    );
  }

  listLabels() {
    const db = this.read();
    return this.allKnownLabels(db).map((item) => {
      const apps = db.apps.filter((app) =>
        catalogHasLabel(app.labels, item.name),
      );
      return {
        name: item.name,
        color: item.color,
        placement: item.placement,
        appCount: apps.length,
        appIds: apps.map((app) => app.id),
      };
    });
  }

  createLabel(
    name: string,
    color?: LabelColor,
    placement?: LabelPlacement,
  ) {
    const db = this.read();
    const label = normalizeAppLabels([name])[0];
    if (!label) throw new Error("Informe o nome da label.");
    if (catalogHasLabel(this.allKnownLabels(db), label)) {
      throw new Error("Já existe uma label com este nome.");
    }
    db.labelCatalog = mergeLabelCatalog(
      db.labelCatalog,
      [label],
      normalizeLabelColor(color),
      placement,
    );
    this.write(db);
    return this.listLabels();
  }

  patchLabel(
    from: string,
    patch: { to?: string; color?: LabelColor; placement?: LabelPlacement },
  ) {
    const db = this.read();
    const current = this.allKnownLabels(db);
    if (!catalogHasLabel(current, from)) {
      throw new Error("Label não encontrada.");
    }
    const next =
      patch.to !== undefined ? normalizeAppLabels([patch.to])[0] : undefined;
    if (patch.to !== undefined && !next) {
      throw new Error("Informe o novo nome.");
    }
    if (next && catalogHasLabel(current, next) && !catalogHasLabel([from], next)) {
      throw new Error("Já existe uma label com este nome.");
    }
    const targetName = next ?? from;
    if (next) {
      db.labelCatalog = renameInCatalog(db.labelCatalog, from, next);
      if (!catalogHasLabel(db.labelCatalog, next)) {
        const previous = current.find((item) => catalogHasLabel([item], from));
        db.labelCatalog = mergeLabelCatalog(
          db.labelCatalog,
          [next],
          previous?.color ?? normalizeLabelColor(patch.color),
          previous?.placement,
        );
      }
      for (const app of db.apps) {
        app.labels = renameInLabels(app.labels, from, next);
      }
    }
    if (patch.color !== undefined) {
      db.labelCatalog = setLabelColor(db.labelCatalog, targetName, patch.color);
    }
    if (patch.placement !== undefined) {
      db.labelCatalog = setLabelPlacement(
        db.labelCatalog,
        targetName,
        patch.placement,
      );
    }
    this.write(db);
    return this.listLabels();
  }

  renameLabel(from: string, to: string) {
    return this.patchLabel(from, { to });
  }

  deleteLabel(name: string) {
    const db = this.read();
    if (!catalogHasLabel(this.allKnownLabels(db), name)) {
      return false;
    }
    db.labelCatalog = db.labelCatalog.filter(
      (label) => !catalogHasLabel([label], name),
    );
    for (const app of db.apps) {
      app.labels = app.labels.filter((label) => !catalogHasLabel([label], name));
    }
    this.write(db);
    return true;
  }

  deleteApp(appId: string): boolean {
    const db = this.read();
    const exists = db.apps.some((a) => a.id === appId);
    if (!exists) return false;
    const sectionIds = db.sections.filter((s) => s.appId === appId).map((s) => s.id);
    for (const rec of db.recordings.filter((r) => sectionIds.includes(r.sectionId))) {
      this.unlinkUpload(rec.url);
    }
    for (const cmp of db.comparisons.filter((c) => c.appId === appId)) {
      this.unlinkUpload(cmp.appImage);
      this.unlinkUpload(cmp.figmaImage);
    }
    db.recordings = db.recordings.filter((r) => !sectionIds.includes(r.sectionId));
    db.stories = db.stories.filter((st) => !sectionIds.includes(st.sectionId));
    db.sections = db.sections.filter((s) => s.appId !== appId);
    db.comparisons = db.comparisons.filter((c) => c.appId !== appId);
    db.apps = db.apps.filter((a) => a.id !== appId);
    this.write(db);
    return true;
  }

  createSection(appId: string, input: CreateSectionInput) {
    const db = this.read();
    const app = db.apps.find((a) => a.id === appId);
    if (!app) return null;
    const section: Section = {
      id: id(),
      appId,
      title: input.title.trim(),
      route: input.route?.trim() ?? "",
      kind: input.kind ?? "specific",
      order: db.sections.filter((s) => s.appId === appId).length,
    };
    db.sections.push(section);
    assignSectionOrders(
      db.sections.filter((s) => s.appId === appId),
      resolveNavAppId(app.id, app.slug),
    );
    for (const story of input.stories ?? []) {
      db.stories.push({
        id: id(),
        sectionId: section.id,
        code: story.code.trim(),
        text: story.text.trim(),
        status: "pending",
        notes: "",
      });
    }
    this.write(db);
    return this.getAppDocument(appId);
  }

  patchSection(sectionId: string, patch: Partial<Pick<Section, "title" | "route" | "kind" | "order">>) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) return null;
    if (patch.title !== undefined) section.title = patch.title.trim();
    if (patch.route !== undefined) section.route = patch.route.trim();
    if (patch.kind !== undefined) section.kind = patch.kind;
    if (patch.order !== undefined) section.order = patch.order;
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  deleteSection(sectionId: string) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) return null;
    for (const rec of db.recordings.filter((r) => r.sectionId === sectionId)) {
      this.unlinkUpload(rec.url);
    }
    db.recordings = db.recordings.filter((r) => r.sectionId !== sectionId);
    db.stories = db.stories.filter((st) => st.sectionId !== sectionId);
    db.comparisons = db.comparisons.map((c) =>
      c.sectionId === sectionId ? { ...c, sectionId: null } : c,
    );
    db.sections = db.sections.filter((s) => s.id !== sectionId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  addStories(sectionId: string, stories: { code: string; text: string }[]) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) return null;
    for (const story of stories) {
      db.stories.push({
        id: id(),
        sectionId,
        code: story.code.trim(),
        text: story.text.trim(),
        status: "pending",
        notes: "",
      });
    }
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  patchStory(storyId: string, patch: Partial<Pick<Story, "code" | "text" | "status" | "notes">>) {
    const db = this.read();
    const story = db.stories.find((s) => s.id === storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    if (patch.code !== undefined) story.code = patch.code.trim();
    if (patch.text !== undefined) story.text = patch.text.trim();
    if (patch.status !== undefined) story.status = patch.status;
    if (patch.notes !== undefined) story.notes = patch.notes;
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  deleteStory(storyId: string) {
    const db = this.read();
    const story = db.stories.find((s) => s.id === storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    db.stories = db.stories.filter((s) => s.id !== storyId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  addComparison(input: {
    appId: string;
    platform: "ios" | "android";
    sectionId?: string | null;
    appImage?: string;
    figmaImage: string;
    listState?: "empty" | "filled" | null;
    drawerLabel?: string | null;
  }) {
    const db = this.read();
    if (!db.apps.some((a) => a.id === input.appId)) return null;
    const comparison: Comparison = {
      id: id(),
      appId: input.appId,
      sectionId: input.sectionId ?? null,
      platform: input.platform,
      appImage: input.appImage ?? "",
      figmaImage: input.figmaImage,
      listState: input.listState ?? null,
      drawerLabel: normalizeDrawerLabel(input.drawerLabel),
    };
    db.comparisons.push(comparison);
    this.write(db);
    return this.getAppDocument(input.appId);
  }

  patchComparison(
    comparisonId: string,
    patch: { listState?: "empty" | "filled" | null; drawerLabel?: string | null },
  ) {
    const db = this.read();
    const comparison = db.comparisons.find((c) => c.id === comparisonId);
    if (!comparison) return null;
    if (patch.listState !== undefined) comparison.listState = patch.listState;
    if (patch.drawerLabel !== undefined) {
      comparison.drawerLabel = normalizeDrawerLabel(patch.drawerLabel);
    }
    this.write(db);
    return this.getAppDocument(comparison.appId);
  }

  patchComparisonAppImage(comparisonId: string, appImage: string) {
    return this.patchComparisonImage(comparisonId, "appImage", appImage);
  }

  patchComparisonFigmaImage(comparisonId: string, figmaImage: string) {
    return this.patchComparisonImage(comparisonId, "figmaImage", figmaImage);
  }

  clearComparisonImage(
    comparisonId: string,
    field: "appImage" | "figmaImage",
  ) {
    return this.patchComparisonImage(comparisonId, field, "");
  }

  private patchComparisonImage(
    comparisonId: string,
    field: "appImage" | "figmaImage",
    nextUrl: string,
  ) {
    const db = this.read();
    const comparison = db.comparisons.find((c) => c.id === comparisonId);
    if (!comparison) return null;
    const previous = comparison[field];
    comparison[field] = nextUrl;
    this.write(db);
    this.unlinkIfOrphan(this.read(), previous);
    return this.getAppDocument(comparison.appId);
  }

  deleteComparison(comparisonId: string) {
    const db = this.read();
    const comparison = db.comparisons.find((c) => c.id === comparisonId);
    if (!comparison) return null;
    db.comparisons = db.comparisons.filter((c) => c.id !== comparisonId);
    this.write(db);
    const after = this.read();
    this.unlinkIfOrphan(after, comparison.appImage);
    this.unlinkIfOrphan(after, comparison.figmaImage);
    return this.getAppDocument(comparison.appId);
  }

  addRecording(input: {
    sectionId: string;
    kind: "image" | "video";
    url: string;
    originalName: string;
  }) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === input.sectionId);
    if (!section) return null;
    const recording: Recording = {
      id: id(),
      sectionId: input.sectionId,
      kind: input.kind,
      url: input.url,
      originalName: input.originalName,
    };
    db.recordings.push(recording);
    this.write(db);
    return this.getAppDocument(section.appId);
  }

  deleteRecording(recordingId: string) {
    const db = this.read();
    const recording = db.recordings.find((r) => r.id === recordingId);
    if (!recording) return null;
    const section = db.sections.find((s) => s.id === recording.sectionId);
    if (!section) return null;
    this.unlinkUpload(recording.url);
    db.recordings = db.recordings.filter((r) => r.id !== recordingId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }
}
