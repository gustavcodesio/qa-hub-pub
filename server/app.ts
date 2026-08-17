import { existsSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import {
  createAppBodySchema,
  createComparisonBodySchema,
  createLabelBodySchema,
  createSectionBodySchema,
  createStoriesBodySchema,
  patchAppBodySchema,
  patchComparisonBodySchema,
  patchSectionBodySchema,
  patchStoryBodySchema,
  patchLabelBodySchema,
} from "../shared/schema.ts";
import {
  appIconPublicUrl,
  resolveAppIconPath,
} from "../shared/app-icon.ts";
import { bundledAppIconUrl } from "../shared/app-icon-manifest.ts";
import { pairComparisonFiles } from "../shared/identify-comparison.ts";
import { resolveRuntimePaths, rootDir } from "./paths.ts";
import { JsonStore } from "./store.ts";

const { uploadsDir, dbPath, workspaceRoot } = resolveRuntimePaths();
const store = new JsonStore(dbPath, uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) {
      cb(new Error("Envie uma imagem ou um vídeo."));
      return;
    }
    cb(null, true);
  },
});

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function publicUrl(filename: string): string {
  return `/uploads/${filename}`;
}

function mediaKind(mimetype: string): "image" | "video" {
  return mimetype.startsWith("video/") ? "video" : "image";
}

function sendError(res: Response, err: unknown, fallback = "Erro interno") {
  const message = err instanceof Error ? err.message : fallback;
  const status = message.includes("Já existe") ? 409 : 400;
  res.status(status).json({ error: message });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/uploads/:filename", (req, res) => {
  const filename = path.basename(param(req.params.filename));
  const full = path.join(uploadsDir, filename);
  if (!filename || !existsSync(full)) {
    res.status(404).json({ error: "Arquivo não encontrado." });
    return;
  }
  res.sendFile(full);
});

function resolveServedIconPath(appId: string, folder: string): string | null {
  const bundled = bundledAppIconUrl(appId);
  if (bundled) {
    const fromPublic = path.join(rootDir, "public", bundled.replace(/^\//, ""));
    if (existsSync(fromPublic)) return fromPublic;
  }
  return resolveAppIconPath(workspaceRoot, folder);
}

app.get("/api/apps", (_req, res) => {
  const apps = store.listApps().map((item) => ({
    ...item,
    iconUrl:
      bundledAppIconUrl(item.id) ??
      (resolveAppIconPath(workspaceRoot, item.folder)
        ? appIconPublicUrl(item.id)
        : null),
  }));
  res.json({ apps });
});

app.get("/api/apps/:appId/icon", (req, res) => {
  const appId = param(req.params.appId);
  const found = store.read().apps.find((item) => item.id === appId);
  if (!found) {
    res.status(404).json({ error: "App não encontrado." });
    return;
  }
  const iconPath = resolveServedIconPath(appId, found.folder);
  if (!iconPath) {
    res.status(404).json({ error: "Ícone não encontrado." });
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.sendFile(iconPath);
});

app.get("/api/labels", (_req, res) => {
  res.json({ labels: store.listLabels() });
});

app.post("/api/labels", (req, res) => {
  try {
    const body = createLabelBodySchema.parse(req.body);
    const labels = store.createLabel(body.name, body.color, body.placement);
    res.status(201).json({ labels });
  } catch (err) {
    sendError(res, err);
  }
});

app.patch("/api/labels", (req, res) => {
  try {
    const body = patchLabelBodySchema.parse(req.body);
    const labels = store.patchLabel(body.from, {
      to: body.to,
      color: body.color,
      placement: body.placement,
    });
    res.json({ labels });
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/labels/:name", (req, res) => {
  const ok = store.deleteLabel(decodeURIComponent(param(req.params.name)));
  if (!ok) {
    res.status(404).json({ error: "Label não encontrada." });
    return;
  }
  res.status(204).end();
});

app.get("/api/apps/:appId", (req, res) => {
  const doc = store.getAppDocument(param(req.params.appId));
  if (!doc) {
    res.status(404).json({ error: "App não encontrado." });
    return;
  }
  res.json(doc);
});

app.post("/api/apps", (req, res) => {
  try {
    const body = createAppBodySchema.parse(req.body);
    const doc = store.createApp(body);
    res.status(201).json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.patch("/api/apps/:appId", (req, res) => {
  try {
    const body = patchAppBodySchema.parse(req.body);
    const doc = store.patchApp(param(req.params.appId), body);
    if (!doc) {
      res.status(404).json({ error: "App não encontrado." });
      return;
    }
    res.json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/apps/:appId", (req, res) => {
  const ok = store.deleteApp(param(req.params.appId));
  if (!ok) {
    res.status(404).json({ error: "App não encontrado." });
    return;
  }
  res.status(204).end();
});

app.post("/api/apps/:appId/sections", (req, res) => {
  try {
    const body = createSectionBodySchema.parse(req.body);
    const doc = store.createSection(param(req.params.appId), body);
    if (!doc) {
      res.status(404).json({ error: "App não encontrado." });
      return;
    }
    res.status(201).json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.patch("/api/sections/:id", (req, res) => {
  try {
    const body = patchSectionBodySchema.parse(req.body);
    const doc = store.patchSection(param(req.params.id), body);
    if (!doc) {
      res.status(404).json({ error: "Section não encontrada." });
      return;
    }
    res.json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/sections/:id", (req, res) => {
  const doc = store.deleteSection(param(req.params.id));
  if (!doc) {
    res.status(404).json({ error: "Section não encontrada." });
    return;
  }
  res.json(doc);
});

app.post("/api/sections/:id/stories", (req, res) => {
  try {
    const body = createStoriesBodySchema.parse(req.body);
    const doc = store.addStories(param(req.params.id), body.stories);
    if (!doc) {
      res.status(404).json({ error: "Section não encontrada." });
      return;
    }
    res.status(201).json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.patch("/api/stories/:id", (req, res) => {
  try {
    const body = patchStoryBodySchema.parse(req.body);
    const doc = store.patchStory(param(req.params.id), body);
    if (!doc) {
      res.status(404).json({ error: "História não encontrada." });
      return;
    }
    res.json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/stories/:id", (req, res) => {
  const doc = store.deleteStory(param(req.params.id));
  if (!doc) {
    res.status(404).json({ error: "História não encontrada." });
    return;
  }
  res.json(doc);
});

app.post(
  "/api/apps/:appId/comparisons",
  upload.fields([
    { name: "appImage", maxCount: 1 },
    { name: "figmaImage", maxCount: 1 },
    { name: "images", maxCount: 2 },
  ]),
  (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const uploaded = [
        ...(files?.images ?? []),
        ...(files?.appImage ?? []),
        ...(files?.figmaImage ?? []),
      ];
      const pair = pairComparisonFiles(uploaded);
      const body = createComparisonBodySchema.parse({
        platform: req.body.platform,
        sectionId: req.body.sectionId || null,
        listState: req.body.listState || null,
        drawerLabel: req.body.drawerLabel || null,
      });
      const doc = store.addComparison({
        appId: param(req.params.appId),
        platform: body.platform,
        sectionId: body.sectionId ?? null,
        appImage: publicUrl(pair.testflight.filename),
        figmaImage: publicUrl(pair.figma.filename),
        listState: body.listState ?? null,
        drawerLabel: body.drawerLabel ?? null,
      });
      if (!doc) {
        res.status(404).json({ error: "App não encontrado." });
        return;
      }
      res.status(201).json(doc);
    } catch (err) {
      sendError(res, err);
    }
  },
);

app.post(
  "/api/comparisons/:id/app-image",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Envie uma imagem do TestFlight." });
        return;
      }
      const doc = store.patchComparisonAppImage(
        param(req.params.id),
        publicUrl(req.file.filename),
      );
      if (!doc) {
        res.status(404).json({ error: "Comparação não encontrada." });
        return;
      }
      res.json(doc);
    } catch (err) {
      sendError(res, err);
    }
  },
);

app.delete("/api/comparisons/:id/app-image", (req, res) => {
  const doc = store.clearComparisonImage(param(req.params.id), "appImage");
  if (!doc) {
    res.status(404).json({ error: "Comparação não encontrada." });
    return;
  }
  res.json(doc);
});

app.post(
  "/api/comparisons/:id/figma-image",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Envie uma imagem do Figma." });
        return;
      }
      const doc = store.patchComparisonFigmaImage(
        param(req.params.id),
        publicUrl(req.file.filename),
      );
      if (!doc) {
        res.status(404).json({ error: "Comparação não encontrada." });
        return;
      }
      res.json(doc);
    } catch (err) {
      sendError(res, err);
    }
  },
);

app.delete("/api/comparisons/:id/figma-image", (req, res) => {
  const doc = store.clearComparisonImage(param(req.params.id), "figmaImage");
  if (!doc) {
    res.status(404).json({ error: "Comparação não encontrada." });
    return;
  }
  res.json(doc);
});

app.patch("/api/comparisons/:id", (req, res) => {
  try {
    const body = patchComparisonBodySchema.parse(req.body);
    const doc = store.patchComparison(param(req.params.id), body);
    if (!doc) {
      res.status(404).json({ error: "Comparação não encontrada." });
      return;
    }
    res.json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/comparisons/:id", (req, res) => {
  const doc = store.deleteComparison(param(req.params.id));
  if (!doc) {
    res.status(404).json({ error: "Comparação não encontrada." });
    return;
  }
  res.json(doc);
});

app.post("/api/stories/:id/recordings", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Envie um arquivo." });
      return;
    }
    const doc = store.addRecording({
      storyId: param(req.params.id),
      kind: mediaKind(req.file.mimetype),
      url: publicUrl(req.file.filename),
      originalName: req.file.originalname,
    });
    if (!doc) {
      res.status(404).json({ error: "História não encontrada." });
      return;
    }
    res.status(201).json(doc);
  } catch (err) {
    sendError(res, err);
  }
});

app.delete("/api/recordings/:id", (req, res) => {
  const doc = store.deleteRecording(param(req.params.id));
  if (!doc) {
    res.status(404).json({ error: "Gravação não encontrada." });
    return;
  }
  res.json(doc);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  sendError(res, err);
});

export default app;
