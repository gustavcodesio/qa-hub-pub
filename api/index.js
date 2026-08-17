// server/app.ts
import { existsSync as existsSync4 } from "node:fs";
import path4 from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";

// shared/schema.ts
import { z } from "zod";

// shared/label-colors.ts
var DEFAULT_LABEL_COLOR = "#ef4444";
var NAMED_COLORS = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#10b981",
  blue: "#0ea5e9",
  purple: "#8b5cf6",
  pink: "#ec4899",
  gray: "#a1a1aa"
};
var HEX6 = /^#([0-9a-f]{6})$/i;
var HEX3 = /^#([0-9a-f]{3})$/i;
function normalizeLabelColor(value) {
  if (typeof value !== "string") return DEFAULT_LABEL_COLOR;
  const trimmed = value.trim().toLowerCase();
  const named = NAMED_COLORS[trimmed];
  if (named) return named;
  if (HEX6.test(trimmed)) return trimmed;
  const short = trimmed.match(HEX3);
  if (!short) return DEFAULT_LABEL_COLOR;
  const [r, g, b] = short[1];
  return `#${r}${r}${g}${g}${b}${b}`;
}

// shared/app-labels.ts
var SUGGESTED_APP_LABELS = [
  "falhou login",
  "falhou cadastro",
  "splash screen errada",
  "paywall",
  "crash"
];
var DEFAULT_LABEL_PLACEMENT = "footer";
function normalizeLabelPlacement(value) {
  return value === "header" ? "header" : DEFAULT_LABEL_PLACEMENT;
}
var APP_LABEL_MAX_LENGTH = 40;
var APP_LABELS_MAX = 8;
function suggestedCatalogLabels() {
  return SUGGESTED_APP_LABELS.map((name) => ({
    name,
    color: DEFAULT_LABEL_COLOR,
    placement: DEFAULT_LABEL_PLACEMENT
  }));
}
function normalizeAppLabel(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, APP_LABEL_MAX_LENGTH);
}
function normalizeAppLabels(labels) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const raw of labels) {
    const label = normalizeAppLabel(raw);
    if (!label) continue;
    const key = label.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(label);
    if (result.length >= APP_LABELS_MAX) break;
  }
  return result;
}
function labelKey(value) {
  return normalizeAppLabel(value).toLocaleLowerCase("pt-BR");
}
function itemName(item) {
  return typeof item === "string" ? item : item.name;
}
function mergeLabelCatalog(catalog, used, colorForNew = DEFAULT_LABEL_COLOR, placementForNew = DEFAULT_LABEL_PLACEMENT) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  function push(name, color, placement) {
    const normalized = normalizeAppLabel(name);
    if (!normalized) return;
    const key = labelKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    result.push({
      name: normalized,
      color: normalizeLabelColor(color),
      placement: normalizeLabelPlacement(placement)
    });
  }
  for (const item of catalog) {
    push(item.name, item.color, item.placement ?? DEFAULT_LABEL_PLACEMENT);
  }
  for (const name of used) push(name, colorForNew, placementForNew);
  return result;
}
function renameInLabels(labels, from, to) {
  const fromKey = labelKey(from);
  const renamed = labels.map(
    (label) => labelKey(label) === fromKey ? normalizeAppLabel(to) : label
  );
  return normalizeAppLabels(renamed);
}
function renameInCatalog(catalog, from, to) {
  const fromKey = labelKey(from);
  const nextName = normalizeAppLabel(to);
  if (!nextName) return catalog;
  const renamed = catalog.map(
    (item) => labelKey(item.name) === fromKey ? { ...item, name: nextName } : item
  );
  return mergeLabelCatalog(renamed, []);
}
function setLabelColor(catalog, name, color) {
  const key = labelKey(name);
  const nextColor = normalizeLabelColor(color);
  let found = false;
  const updated = catalog.map((item) => {
    if (labelKey(item.name) !== key) return item;
    found = true;
    return { ...item, color: nextColor };
  });
  if (found) return updated;
  return mergeLabelCatalog(catalog, [name], nextColor);
}
function setLabelPlacement(catalog, name, placement) {
  const key = labelKey(name);
  const nextPlacement = normalizeLabelPlacement(placement);
  let found = false;
  const updated = catalog.map((item) => {
    if (labelKey(item.name) !== key) return item;
    found = true;
    return { ...item, placement: nextPlacement };
  });
  if (found) return updated;
  return mergeLabelCatalog(
    catalog,
    [name],
    DEFAULT_LABEL_COLOR,
    nextPlacement
  );
}
function catalogHasLabel(catalog, name) {
  const key = labelKey(name);
  return catalog.some((item) => labelKey(itemName(item)) === key);
}

// shared/requested-adjustments.ts
function normalizeRequestedAdjustmentsUrl(value) {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  for (const item of value) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (url) return url;
  }
  return "";
}

// shared/schema.ts
var sectionKindSchema = z.enum(["common", "specific"]);
var storyStatusSchema = z.enum(["pending", "passed", "failed"]);
var platformSchema = z.enum(["ios", "android"]);
var mediaKindSchema = z.enum(["image", "video"]);
var listStateSchema = z.enum(["empty", "filled"]);
var labelColorSchema = z.string().transform(normalizeLabelColor);
var labelPlacementSchema = z.enum(["header", "footer"]);
var catalogLabelSchema = z.object({
  name: z.string().min(1),
  color: labelColorSchema.default(DEFAULT_LABEL_COLOR),
  placement: labelPlacementSchema.default(DEFAULT_LABEL_PLACEMENT)
});
var catalogLabelInputSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    color: labelColorSchema.optional(),
    placement: labelPlacementSchema.optional()
  })
]);
var appSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  folder: z.string().default(""),
  figmaUrl: z.string().default(""),
  iosTestUrl: z.string().default(""),
  androidTestUrl: z.string().default(""),
  notes: z.string().default(""),
  requestedAdjustments: z.union([z.string(), z.array(z.string())]).default("").transform(normalizeRequestedAdjustmentsUrl),
  labels: z.array(z.string()).default([]),
  createdAt: z.string()
});
var sectionSchema = z.object({
  id: z.string(),
  appId: z.string(),
  title: z.string().min(1),
  route: z.string().default(""),
  kind: sectionKindSchema,
  order: z.number().int()
});
var storySchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  code: z.string().min(1),
  text: z.string().min(1),
  status: storyStatusSchema,
  notes: z.string().default("")
});
var comparisonSchema = z.object({
  id: z.string(),
  appId: z.string(),
  sectionId: z.string().nullable(),
  platform: platformSchema,
  appImage: z.string().default(""),
  figmaImage: z.string(),
  listState: listStateSchema.nullable().default(null),
  drawerLabel: z.string().nullable().default(null)
});
var recordingSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  kind: mediaKindSchema,
  url: z.string(),
  originalName: z.string()
});
var dbSchema = z.object({
  apps: z.array(appSchema),
  sections: z.array(sectionSchema),
  stories: z.array(storySchema),
  comparisons: z.array(comparisonSchema),
  recordings: z.array(recordingSchema),
  labelCatalog: z.array(catalogLabelInputSchema).default(suggestedCatalogLabels()).transform(
    (items) => mergeLabelCatalog(
      items.map(
        (item) => typeof item === "string" ? {
          name: item,
          color: DEFAULT_LABEL_COLOR,
          placement: DEFAULT_LABEL_PLACEMENT
        } : {
          name: item.name,
          color: normalizeLabelColor(item.color),
          placement: item.placement ?? DEFAULT_LABEL_PLACEMENT
        }
      ),
      []
    )
  )
});
var createAppBodySchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  slug: z.string().min(1, "Informe o slug"),
  folder: z.string().optional().default(""),
  figmaUrl: z.string().optional().default(""),
  iosTestUrl: z.string().optional().default(""),
  androidTestUrl: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  requestedAdjustments: z.string().optional().default(""),
  copyCommon: z.boolean().optional().default(false)
});
var patchAppBodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  folder: z.string().optional(),
  figmaUrl: z.string().optional(),
  iosTestUrl: z.string().optional(),
  androidTestUrl: z.string().optional(),
  notes: z.string().optional(),
  requestedAdjustments: z.string().optional(),
  labels: z.array(z.string()).optional()
});
var storyInputSchema = z.object({
  code: z.string().min(1, "Informe o c\xF3digo"),
  text: z.string().min(1, "Informe a hist\xF3ria")
});
var createSectionBodySchema = z.object({
  title: z.string().min(1, "Informe o t\xEDtulo"),
  route: z.string().optional().default(""),
  kind: sectionKindSchema.default("specific"),
  stories: z.array(storyInputSchema).default([])
});
var patchSectionBodySchema = z.object({
  title: z.string().min(1).optional(),
  route: z.string().optional(),
  kind: sectionKindSchema.optional(),
  order: z.number().int().optional()
});
var patchStoryBodySchema = z.object({
  code: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  status: storyStatusSchema.optional(),
  notes: z.string().optional()
});
var createStoriesBodySchema = z.object({
  stories: z.array(storyInputSchema).min(1)
});
var createComparisonBodySchema = z.object({
  platform: platformSchema.default("ios"),
  sectionId: z.string().nullable().optional(),
  listState: listStateSchema.nullable().optional().default(null),
  drawerLabel: z.string().nullable().optional().default(null)
});
var patchComparisonBodySchema = z.object({
  listState: listStateSchema.nullable().optional(),
  drawerLabel: z.string().nullable().optional()
});
var createLabelBodySchema = z.object({
  name: z.string().min(1, "Informe o nome da label"),
  color: labelColorSchema.optional(),
  placement: labelPlacementSchema.optional()
});
var patchLabelBodySchema = z.object({
  from: z.string().min(1, "Informe a label atual"),
  to: z.string().min(1).optional(),
  color: labelColorSchema.optional(),
  placement: labelPlacementSchema.optional()
}).refine(
  (body) => body.to !== void 0 || body.color !== void 0 || body.placement !== void 0,
  {
    message: "Informe o novo nome, a cor ou a posi\xE7\xE3o."
  }
);
var emptyDb = () => ({
  apps: [],
  sections: [],
  stories: [],
  comparisons: [],
  recordings: [],
  labelCatalog: suggestedCatalogLabels()
});

// shared/app-icon.ts
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
var FALLBACK_ICONS = [
  "assets/images/icon.png",
  "assets/icon.png",
  "assets/app-icon.png",
  "assets/images/favicon.png",
  "assets/favicon.png"
];
function isInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`);
}
function parseExpoIcon(appJson) {
  if (!appJson || typeof appJson !== "object") return null;
  const expo = appJson.expo;
  if (typeof expo?.icon !== "string") return null;
  const icon = expo.icon.trim();
  return icon || null;
}
function resolveAppIconPath(workspaceRoot3, folder) {
  const trimmed = folder.trim();
  if (!trimmed) return null;
  const appDir = path.resolve(workspaceRoot3, trimmed);
  if (!isInside(workspaceRoot3, appDir) || !existsSync(appDir)) return null;
  const candidates = [];
  const appJsonPath = path.join(appDir, "app.json");
  if (existsSync(appJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(appJsonPath, "utf8"));
      const icon = parseExpoIcon(parsed);
      if (icon) candidates.push(icon);
    } catch {
    }
  }
  candidates.push(...FALLBACK_ICONS);
  for (const relative of candidates) {
    const full = path.resolve(appDir, relative);
    if (!isInside(appDir, full)) continue;
    if (existsSync(full)) return full;
  }
  return null;
}
function appIconPublicUrl(appId) {
  return `/api/apps/${encodeURIComponent(appId)}/icon`;
}

// shared/identify-comparison.ts
function normalizeFilename(filename) {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  return base.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
function classifyScreenshotName(filename) {
  const name = normalizeFilename(filename);
  if (name.includes("captura de tela") || name.startsWith("captura")) {
    return "figma";
  }
  if (name.startsWith("whats") || name.includes("whatsapp")) {
    return "testflight";
  }
  return "unknown";
}
function assignComparisonFile(current, file) {
  const kind = classifyScreenshotName(file.originalname ?? file.name ?? "");
  if (kind === "figma") return { ...current, figma: file };
  if (kind === "testflight") return { ...current, testflight: file };
  throw new Error(
    "N\xE3o identifiquei o print. O do TestFlight deve come\xE7ar com Whats\u2026 e o do Figma com Captura de tela\u2026"
  );
}
function mergeComparisonFiles(current, files) {
  return files.reduce(assignComparisonFile, current);
}
function pairComparisonFiles(files) {
  const merged = mergeComparisonFiles({ figma: null, testflight: null }, files);
  if (!merged.figma || !merged.testflight) {
    throw new Error("Faltou um print. Precisa de Figma (Captura de tela\u2026) e TestFlight (Whats\u2026).");
  }
  return { figma: merged.figma, testflight: merged.testflight };
}

// server/paths.ts
import { copyFileSync, existsSync as existsSync2, mkdirSync } from "node:fs";
import os from "node:os";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var rootDir = path2.resolve(__dirname, "..");
var workspaceRoot = path2.resolve(rootDir, "..");
var seedDbPath = path2.join(rootDir, "data", "db.json");
function isVercelRuntime(env = process.env) {
  return Boolean(env.VERCEL);
}
function resolveRuntimePaths(env = process.env) {
  const onVercel = isVercelRuntime(env);
  const dataDir = onVercel ? path2.join(os.tmpdir(), "qa-hub") : path2.join(rootDir, "data");
  const uploadsDir2 = onVercel ? path2.join(dataDir, "uploads") : path2.join(rootDir, "public", "uploads");
  const dbPath2 = path2.join(dataDir, "db.json");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(uploadsDir2, { recursive: true });
  const seed = [
    seedDbPath,
    path2.join(process.cwd(), "data", "db.json"),
    path2.join("/var/task", "data", "db.json")
  ].find((candidate) => existsSync2(candidate));
  if (onVercel && !existsSync2(dbPath2) && seed) {
    copyFileSync(seed, dbPath2);
  }
  return { dataDir, uploadsDir: uploadsDir2, dbPath: dbPath2, workspaceRoot };
}

// server/store.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync2, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path3 from "node:path";

// shared/common-template.ts
var COMMON_SECTIONS = [
  {
    title: "Login",
    route: "/login",
    kind: "common",
    stories: [
      {
        code: "L1",
        text: "O usu\xE1rio deve conseguir informar o identificador (e-mail ou Pass ID) e a senha e entrar pelo bot\xE3o Login."
      },
      {
        code: "L2",
        text: "O usu\xE1rio deve conseguir mostrar ou ocultar a senha."
      },
      {
        code: "L3",
        text: "O usu\xE1rio deve ver um erro se faltar identificador ou senha, ou se o login falhar."
      },
      {
        code: "L4",
        text: "O usu\xE1rio deve conseguir clicar em Criar conta e ir para /register."
      },
      {
        code: "L5",
        text: "O usu\xE1rio deve ver a mensagem de conta criada ao voltar do cadastro."
      },
      {
        code: "L6",
        text: "Ap\xF3s o login, o usu\xE1rio deve ir para / (e dali para paywall ou home)."
      }
    ]
  },
  {
    title: "Cadastro",
    route: "/register",
    kind: "common",
    stories: [
      {
        code: "C1",
        text: "O usu\xE1rio deve conseguir preencher nome, e-mail, senha e confirmar senha e cadastrar."
      },
      {
        code: "C2",
        text: "O usu\xE1rio deve ver erro se faltar campo, se a senha tiver menos de 6 caracteres ou se as senhas n\xE3o coincidirem."
      },
      {
        code: "C3",
        text: "O usu\xE1rio deve ver o erro da API se o cadastro falhar."
      },
      {
        code: "C4",
        text: "O usu\xE1rio deve conseguir clicar em J\xE1 tem conta? Login e ir para /login."
      },
      {
        code: "C5",
        text: "Ap\xF3s o cadastro, o usu\xE1rio deve ir para /login com a mensagem de conta criada."
      }
    ]
  },
  {
    title: "Paywall",
    route: "/paywall",
    kind: "common",
    stories: [
      {
        code: "PW1",
        text: "O usu\xE1rio deve conseguir ver o paywall e assinar."
      },
      {
        code: "PW2",
        text: "O usu\xE1rio deve conseguir restaurar compras."
      },
      {
        code: "PW3",
        text: "O usu\xE1rio deve conseguir clicar em Sair / usar outra conta, fazer logout e ir para /login."
      },
      {
        code: "PW4",
        text: "Se j\xE1 for Pro, o usu\xE1rio deve ir para a home."
      },
      {
        code: "PW5",
        text: "Se a assinatura n\xE3o estiver configurada, o usu\xE1rio deve ver o aviso e clicar em Continuar."
      }
    ]
  },
  {
    title: "Perfil",
    route: "/perfil",
    kind: "common",
    stories: [
      {
        code: "P1",
        text: "O usu\xE1rio deve conseguir ver nome, identificador e foto."
      },
      {
        code: "P2",
        text: "O usu\xE1rio deve conseguir alterar o nome e salvar."
      },
      {
        code: "P3",
        text: "O usu\xE1rio deve conseguir clicar em Cancelar e desfazer a edi\xE7\xE3o."
      },
      {
        code: "P4",
        text: "O usu\xE1rio deve conseguir trocar a foto pela galeria (o app pede permiss\xE3o)."
      },
      {
        code: "P5",
        text: "O usu\xE1rio deve conseguir alterar a senha (senha atual e nova senha)."
      },
      {
        code: "P6",
        text: "O usu\xE1rio deve conseguir sair da conta (confirma\xE7\xE3o no drawer) e ir para /login."
      },
      {
        code: "P7",
        text: "O usu\xE1rio deve conseguir navegar pela barra inferior do app."
      },
      {
        code: "P8",
        text: "Sem sess\xE3o, o usu\xE1rio deve ser redirecionado para /login."
      }
    ]
  }
];

// shared/ios-photos.ts
var IOS_PHOTOS_READY_THRESHOLD = 3;
function countIosAppPhotos(comparisons) {
  return comparisons.filter(
    (item) => item.platform === "ios" && Boolean(item.appImage?.trim())
  ).length;
}
function hasIosPhotosReady(count) {
  return count >= IOS_PHOTOS_READY_THRESHOLD;
}

// shared/list-state.ts
function listStateRank(listState) {
  if (listState === "empty") return 0;
  if (listState === "filled") return 1;
  return 2;
}
function normalizeDrawerLabel(value) {
  const label = value?.trim() ?? "";
  return label.length > 0 ? label : null;
}
function drawerRank(drawerLabel) {
  return normalizeDrawerLabel(drawerLabel) ? 1 : 0;
}

// shared/nav-order.ts
var APP_NAV_ORDER = {
  gratos: ["Home / Di\xE1rio", "Adicionar item ao di\xE1rio", "Senha de acesso", "Humor"],
  karrin: ["Home / Listas", "Detalhe da lista", "Produtos"],
  dailyfit: ["Question\xE1rio", "In\xEDcio", "Hist\xF3rico"],
  equivale: ["Categorias", "Conversor", "Calculadora"],
  flowy: ["In\xEDcio", "Ciclo"],
  pomodoro: ["Foco", "Relat\xF3rio"],
  sereno: ["M\xFAsicas", "Player"],
  subtracker: ["In\xEDcio", "Assinaturas"],
  tarefas: ["Lista de tarefas", "Calend\xE1rio"],
  animo: ["Frase do dia", "Favoritas"],
  bruxcare: ["Registro de hoje", "Hist\xF3rico"],
  calccombu: ["Qual combust\xEDvel compensa?", "Resultado", "Hist\xF3rico"],
  vista: ["\xC0 vista ou a prazo", "Resultado", "Hist\xF3rico"],
  cofresenhas: ["In\xEDcio", "Cofre", "Nova senha", "Detalhe da senha"],
  dosex: ["Agenda", "Medicamentos", "Detalhe do medicamento"],
  leitorpdf: ["Biblioteca", "Pasta", "Leitor", "Pesquisar", "Favoritos"],
  lumina: ["In\xEDcio", "Editor"],
  planta: [
    "In\xEDcio",
    "C\xE2mera",
    "Identificando",
    "Planta n\xE3o reconhecida",
    "Hist\xF3rico",
    "Sobre essa planta"
  ],
  quickpdf: ["Recentes", "Pesquisar", "Editor", "Informa\xE7\xF5es do documento", "Arquivos"],
  rotacalc: ["Calcular viagem", "Hist\xF3rico"]
};
function resolveNavAppId(appId, slug) {
  if (APP_NAV_ORDER[appId]) return appId;
  if (slug && APP_NAV_ORDER[slug]) return slug;
  return appId;
}
function navIndex(appId, title) {
  if (!appId) return null;
  const nav = APP_NAV_ORDER[appId];
  if (!nav) return null;
  const folded = foldNavTitle(title);
  const index = nav.findIndex((item) => foldNavTitle(item) === folded);
  return index >= 0 ? index : null;
}
function foldNavTitle(title) {
  return title.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// shared/section-order.ts
function isLoginSection(title) {
  return foldTitle(title) === "login";
}
function isProfileSection(title) {
  return foldTitle(title) === "perfil";
}
function sectionGroup(title) {
  if (isLoginSection(title)) return 0;
  if (isProfileSection(title)) return 2;
  return 1;
}
function compareSections(a, b) {
  const byGroup = sectionGroup(a.title) - sectionGroup(b.title);
  if (byGroup !== 0) return byGroup;
  const appId = a.appId ?? b.appId;
  const byNav = loggedInRank(appId, a.title) - loggedInRank(appId, b.title);
  if (byNav !== 0) return byNav;
  return a.order - b.order;
}
function compareComparisons(a, b, sections, navAppId) {
  const left = comparisonMeta(a.sectionId, sections, navAppId);
  const right = comparisonMeta(b.sectionId, sections, navAppId);
  if (left.group !== right.group) return left.group - right.group;
  if (left.order !== right.order) return left.order - right.order;
  const byList = listStateRank(a.listState) - listStateRank(b.listState);
  if (byList !== 0) return byList;
  const byDrawer = drawerRank(a.drawerLabel) - drawerRank(b.drawerLabel);
  if (byDrawer !== 0) return byDrawer;
  return (a.drawerLabel ?? "").localeCompare(b.drawerLabel ?? "", "pt");
}
function assignSectionOrders(sections, navAppId) {
  const sorted = [...sections].sort(
    (a, b) => compareSections(
      { ...a, appId: navAppId ?? a.appId },
      { ...b, appId: navAppId ?? b.appId }
    )
  );
  sorted.forEach((section, index) => {
    section.order = index;
  });
  return sorted;
}
function loggedInRank(appId, title) {
  const folded = foldTitle(title);
  if (folded === "cadastro") return -2;
  if (folded === "paywall") return -1;
  const index = navIndex(appId, title);
  if (index !== null) return index;
  return Number.MAX_SAFE_INTEGER - 1;
}
function foldTitle(title) {
  return title.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
function comparisonMeta(sectionId, sections, navAppId) {
  const section = sectionId ? sections.find((item) => item.id === sectionId) : void 0;
  if (!section) {
    return { group: 1, order: Number.MAX_SAFE_INTEGER };
  }
  return {
    group: sectionGroup(section.title),
    order: loggedInRank(navAppId ?? section.appId, section.title)
  };
}

// server/store.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function id() {
  return crypto.randomUUID();
}
var JsonStore = class {
  dbPath;
  uploadsDir;
  constructor(dbPath2, uploadsDir2) {
    this.dbPath = dbPath2;
    this.uploadsDir = uploadsDir2;
    mkdirSync2(path3.dirname(dbPath2), { recursive: true });
    mkdirSync2(uploadsDir2, { recursive: true });
    if (!existsSync3(dbPath2)) {
      this.write(emptyDb());
    }
  }
  read() {
    const raw = readFileSync2(this.dbPath, "utf8");
    return dbSchema.parse(JSON.parse(raw));
  }
  write(db) {
    const tmp = `${this.dbPath}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(db, null, 2)}
`, "utf8");
    renameSync(tmp, this.dbPath);
  }
  unlinkUpload(url) {
    const filename = url.replace(/^\/uploads\//, "");
    if (!filename || filename.includes("..") || filename.includes("/")) return;
    const full = path3.join(this.uploadsDir, filename);
    if (existsSync3(full)) unlinkSync(full);
  }
  unlinkIfOrphan(db, url) {
    if (!url) return;
    const used = db.comparisons.some((c) => c.appImage === url || c.figmaImage === url) || db.recordings.some((r) => r.url === url);
    if (!used) this.unlinkUpload(url);
  }
  listApps() {
    const db = this.read();
    return db.apps.map((app2) => {
      const sections = db.sections.filter((s) => s.appId === app2.id);
      const stories = db.stories.filter(
        (st) => sections.some((s) => s.id === st.sectionId)
      );
      const passed = stories.filter((st) => st.status === "passed").length;
      const iosPhotoCount = countIosAppPhotos(
        db.comparisons.filter((comparison) => comparison.appId === app2.id)
      );
      return {
        ...app2,
        sectionCount: sections.length,
        storyCount: stories.length,
        passedCount: passed,
        iosPhotoCount,
        hasIosPhotos: hasIosPhotosReady(iosPhotoCount)
      };
    });
  }
  getAppDocument(appId) {
    const db = this.read();
    const app2 = db.apps.find((a) => a.id === appId);
    if (!app2) return null;
    const navAppId = resolveNavAppId(app2.id, app2.slug);
    const sections = db.sections.filter((s) => s.appId === appId).sort(
      (a, b) => compareSections(
        { ...a, appId: navAppId },
        { ...b, appId: navAppId }
      )
    ).map((section) => ({
      ...section,
      stories: db.stories.filter((st) => st.sectionId === section.id).map((story) => ({
        ...story,
        recordings: db.recordings.filter((r) => r.storyId === story.id)
      }))
    }));
    const comparisons = db.comparisons.filter((c) => c.appId === appId).sort((a, b) => compareComparisons(a, b, sections, navAppId));
    return { ...app2, sections, comparisons };
  }
  createApp(input) {
    const db = this.read();
    const slug = input.slug.trim().toLowerCase();
    if (db.apps.some((a) => a.slug === slug)) {
      throw new Error("J\xE1 existe um app com este slug.");
    }
    const app2 = {
      id: id(),
      name: input.name.trim(),
      slug,
      folder: input.folder?.trim() ?? "",
      figmaUrl: input.figmaUrl?.trim() ?? "",
      iosTestUrl: input.iosTestUrl?.trim() ?? "",
      androidTestUrl: input.androidTestUrl?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      requestedAdjustments: normalizeRequestedAdjustmentsUrl(
        input.requestedAdjustments ?? ""
      ),
      labels: normalizeAppLabels(input.labels ?? []),
      createdAt: nowIso()
    };
    db.apps.push(app2);
    if (input.copyCommon) {
      COMMON_SECTIONS.forEach((tpl, index) => {
        const section = {
          id: id(),
          appId: app2.id,
          title: tpl.title,
          route: tpl.route,
          kind: tpl.kind,
          order: index
        };
        db.sections.push(section);
        for (const story of tpl.stories) {
          db.stories.push({
            id: id(),
            sectionId: section.id,
            code: story.code,
            text: story.text,
            status: "pending",
            notes: ""
          });
        }
      });
    }
    this.write(db);
    return this.getAppDocument(app2.id);
  }
  patchApp(appId, patch) {
    const db = this.read();
    const app2 = db.apps.find((a) => a.id === appId);
    if (!app2) return null;
    if (patch.name !== void 0) app2.name = patch.name.trim();
    if (patch.slug !== void 0) app2.slug = patch.slug.trim().toLowerCase();
    if (patch.folder !== void 0) app2.folder = patch.folder.trim();
    if (patch.figmaUrl !== void 0) app2.figmaUrl = patch.figmaUrl.trim();
    if (patch.iosTestUrl !== void 0) app2.iosTestUrl = patch.iosTestUrl.trim();
    if (patch.androidTestUrl !== void 0) {
      app2.androidTestUrl = patch.androidTestUrl.trim();
    }
    if (patch.notes !== void 0) app2.notes = patch.notes.trim();
    if (patch.requestedAdjustments !== void 0) {
      app2.requestedAdjustments = normalizeRequestedAdjustmentsUrl(
        patch.requestedAdjustments
      );
    }
    if (patch.labels !== void 0) {
      app2.labels = normalizeAppLabels(patch.labels);
      db.labelCatalog = mergeLabelCatalog(db.labelCatalog, app2.labels);
    }
    this.write(db);
    return this.getAppDocument(appId);
  }
  allKnownLabels(db) {
    return mergeLabelCatalog(
      db.labelCatalog,
      db.apps.flatMap((app2) => app2.labels)
    );
  }
  listLabels() {
    const db = this.read();
    return this.allKnownLabels(db).map((item) => {
      const apps = db.apps.filter(
        (app2) => catalogHasLabel(app2.labels, item.name)
      );
      return {
        name: item.name,
        color: item.color,
        placement: item.placement,
        appCount: apps.length,
        appIds: apps.map((app2) => app2.id)
      };
    });
  }
  createLabel(name, color, placement) {
    const db = this.read();
    const label = normalizeAppLabels([name])[0];
    if (!label) throw new Error("Informe o nome da label.");
    if (catalogHasLabel(this.allKnownLabels(db), label)) {
      throw new Error("J\xE1 existe uma label com este nome.");
    }
    db.labelCatalog = mergeLabelCatalog(
      db.labelCatalog,
      [label],
      normalizeLabelColor(color),
      placement
    );
    this.write(db);
    return this.listLabels();
  }
  patchLabel(from, patch) {
    const db = this.read();
    const current = this.allKnownLabels(db);
    if (!catalogHasLabel(current, from)) {
      throw new Error("Label n\xE3o encontrada.");
    }
    const next = patch.to !== void 0 ? normalizeAppLabels([patch.to])[0] : void 0;
    if (patch.to !== void 0 && !next) {
      throw new Error("Informe o novo nome.");
    }
    if (next && catalogHasLabel(current, next) && !catalogHasLabel([from], next)) {
      throw new Error("J\xE1 existe uma label com este nome.");
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
          previous?.placement
        );
      }
      for (const app2 of db.apps) {
        app2.labels = renameInLabels(app2.labels, from, next);
      }
    }
    if (patch.color !== void 0) {
      db.labelCatalog = setLabelColor(db.labelCatalog, targetName, patch.color);
    }
    if (patch.placement !== void 0) {
      db.labelCatalog = setLabelPlacement(
        db.labelCatalog,
        targetName,
        patch.placement
      );
    }
    this.write(db);
    return this.listLabels();
  }
  renameLabel(from, to) {
    return this.patchLabel(from, { to });
  }
  deleteLabel(name) {
    const db = this.read();
    if (!catalogHasLabel(this.allKnownLabels(db), name)) {
      return false;
    }
    db.labelCatalog = db.labelCatalog.filter(
      (label) => !catalogHasLabel([label], name)
    );
    for (const app2 of db.apps) {
      app2.labels = app2.labels.filter((label) => !catalogHasLabel([label], name));
    }
    this.write(db);
    return true;
  }
  deleteApp(appId) {
    const db = this.read();
    const exists = db.apps.some((a) => a.id === appId);
    if (!exists) return false;
    const sectionIds = db.sections.filter((s) => s.appId === appId).map((s) => s.id);
    const storyIds = db.stories.filter((st) => sectionIds.includes(st.sectionId)).map((st) => st.id);
    for (const rec of db.recordings.filter((r) => storyIds.includes(r.storyId))) {
      this.unlinkUpload(rec.url);
    }
    for (const cmp of db.comparisons.filter((c) => c.appId === appId)) {
      this.unlinkUpload(cmp.appImage);
      this.unlinkUpload(cmp.figmaImage);
    }
    db.recordings = db.recordings.filter((r) => !storyIds.includes(r.storyId));
    db.stories = db.stories.filter((st) => !sectionIds.includes(st.sectionId));
    db.sections = db.sections.filter((s) => s.appId !== appId);
    db.comparisons = db.comparisons.filter((c) => c.appId !== appId);
    db.apps = db.apps.filter((a) => a.id !== appId);
    this.write(db);
    return true;
  }
  createSection(appId, input) {
    const db = this.read();
    const app2 = db.apps.find((a) => a.id === appId);
    if (!app2) return null;
    const section = {
      id: id(),
      appId,
      title: input.title.trim(),
      route: input.route?.trim() ?? "",
      kind: input.kind ?? "specific",
      order: db.sections.filter((s) => s.appId === appId).length
    };
    db.sections.push(section);
    assignSectionOrders(
      db.sections.filter((s) => s.appId === appId),
      resolveNavAppId(app2.id, app2.slug)
    );
    for (const story of input.stories ?? []) {
      db.stories.push({
        id: id(),
        sectionId: section.id,
        code: story.code.trim(),
        text: story.text.trim(),
        status: "pending",
        notes: ""
      });
    }
    this.write(db);
    return this.getAppDocument(appId);
  }
  patchSection(sectionId, patch) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) return null;
    if (patch.title !== void 0) section.title = patch.title.trim();
    if (patch.route !== void 0) section.route = patch.route.trim();
    if (patch.kind !== void 0) section.kind = patch.kind;
    if (patch.order !== void 0) section.order = patch.order;
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  deleteSection(sectionId) {
    const db = this.read();
    const section = db.sections.find((s) => s.id === sectionId);
    if (!section) return null;
    const storyIds = db.stories.filter((st) => st.sectionId === sectionId).map((st) => st.id);
    for (const rec of db.recordings.filter((r) => storyIds.includes(r.storyId))) {
      this.unlinkUpload(rec.url);
    }
    db.recordings = db.recordings.filter((r) => !storyIds.includes(r.storyId));
    db.stories = db.stories.filter((st) => st.sectionId !== sectionId);
    db.comparisons = db.comparisons.map(
      (c) => c.sectionId === sectionId ? { ...c, sectionId: null } : c
    );
    db.sections = db.sections.filter((s) => s.id !== sectionId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  addStories(sectionId, stories) {
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
        notes: ""
      });
    }
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  patchStory(storyId, patch) {
    const db = this.read();
    const story = db.stories.find((s) => s.id === storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    if (patch.code !== void 0) story.code = patch.code.trim();
    if (patch.text !== void 0) story.text = patch.text.trim();
    if (patch.status !== void 0) story.status = patch.status;
    if (patch.notes !== void 0) story.notes = patch.notes;
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  deleteStory(storyId) {
    const db = this.read();
    const story = db.stories.find((s) => s.id === storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    for (const rec of db.recordings.filter((r) => r.storyId === storyId)) {
      this.unlinkUpload(rec.url);
    }
    db.recordings = db.recordings.filter((r) => r.storyId !== storyId);
    db.stories = db.stories.filter((s) => s.id !== storyId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  addComparison(input) {
    const db = this.read();
    if (!db.apps.some((a) => a.id === input.appId)) return null;
    const comparison = {
      id: id(),
      appId: input.appId,
      sectionId: input.sectionId ?? null,
      platform: input.platform,
      appImage: input.appImage ?? "",
      figmaImage: input.figmaImage,
      listState: input.listState ?? null,
      drawerLabel: normalizeDrawerLabel(input.drawerLabel)
    };
    db.comparisons.push(comparison);
    this.write(db);
    return this.getAppDocument(input.appId);
  }
  patchComparison(comparisonId, patch) {
    const db = this.read();
    const comparison = db.comparisons.find((c) => c.id === comparisonId);
    if (!comparison) return null;
    if (patch.listState !== void 0) comparison.listState = patch.listState;
    if (patch.drawerLabel !== void 0) {
      comparison.drawerLabel = normalizeDrawerLabel(patch.drawerLabel);
    }
    this.write(db);
    return this.getAppDocument(comparison.appId);
  }
  patchComparisonAppImage(comparisonId, appImage) {
    const db = this.read();
    const comparison = db.comparisons.find((c) => c.id === comparisonId);
    if (!comparison) return null;
    const previous = comparison.appImage;
    comparison.appImage = appImage;
    this.write(db);
    this.unlinkIfOrphan(this.read(), previous);
    return this.getAppDocument(comparison.appId);
  }
  deleteComparison(comparisonId) {
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
  addRecording(input) {
    const db = this.read();
    const story = db.stories.find((s) => s.id === input.storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    const recording = {
      id: id(),
      storyId: input.storyId,
      kind: input.kind,
      url: input.url,
      originalName: input.originalName
    };
    db.recordings.push(recording);
    this.write(db);
    return this.getAppDocument(section.appId);
  }
  deleteRecording(recordingId) {
    const db = this.read();
    const recording = db.recordings.find((r) => r.id === recordingId);
    if (!recording) return null;
    const story = db.stories.find((s) => s.id === recording.storyId);
    if (!story) return null;
    const section = db.sections.find((s) => s.id === story.sectionId);
    if (!section) return null;
    this.unlinkUpload(recording.url);
    db.recordings = db.recordings.filter((r) => r.id !== recordingId);
    this.write(db);
    return this.getAppDocument(section.appId);
  }
};

// server/app.ts
var { uploadsDir, dbPath, workspaceRoot: workspaceRoot2 } = resolveRuntimePaths();
var store = new JsonStore(dbPath, uploadsDir);
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path4.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) {
      cb(new Error("Envie uma imagem ou um v\xEDdeo."));
      return;
    }
    cb(null, true);
  }
});
function param(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
function publicUrl(filename) {
  return `/uploads/${filename}`;
}
function mediaKind(mimetype) {
  return mimetype.startsWith("video/") ? "video" : "image";
}
function sendError(res, err, fallback = "Erro interno") {
  const message = err instanceof Error ? err.message : fallback;
  const status = message.includes("J\xE1 existe") ? 409 : 400;
  res.status(status).json({ error: message });
}
var app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));
app.get("/uploads/:filename", (req, res) => {
  const filename = path4.basename(param(req.params.filename));
  const full = path4.join(uploadsDir, filename);
  if (!filename || !existsSync4(full)) {
    res.status(404).json({ error: "Arquivo n\xE3o encontrado." });
    return;
  }
  res.sendFile(full);
});
app.get("/api/apps", (_req, res) => {
  const apps = store.listApps().map((item) => ({
    ...item,
    iconUrl: resolveAppIconPath(workspaceRoot2, item.folder) ? appIconPublicUrl(item.id) : null
  }));
  res.json({ apps });
});
app.get("/api/apps/:appId/icon", (req, res) => {
  const appId = param(req.params.appId);
  const found = store.read().apps.find((item) => item.id === appId);
  if (!found) {
    res.status(404).json({ error: "App n\xE3o encontrado." });
    return;
  }
  const iconPath = resolveAppIconPath(workspaceRoot2, found.folder);
  if (!iconPath) {
    res.status(404).json({ error: "\xCDcone n\xE3o encontrado." });
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
      placement: body.placement
    });
    res.json({ labels });
  } catch (err) {
    sendError(res, err);
  }
});
app.delete("/api/labels/:name", (req, res) => {
  const ok = store.deleteLabel(decodeURIComponent(param(req.params.name)));
  if (!ok) {
    res.status(404).json({ error: "Label n\xE3o encontrada." });
    return;
  }
  res.status(204).end();
});
app.get("/api/apps/:appId", (req, res) => {
  const doc = store.getAppDocument(param(req.params.appId));
  if (!doc) {
    res.status(404).json({ error: "App n\xE3o encontrado." });
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
      res.status(404).json({ error: "App n\xE3o encontrado." });
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
    res.status(404).json({ error: "App n\xE3o encontrado." });
    return;
  }
  res.status(204).end();
});
app.post("/api/apps/:appId/sections", (req, res) => {
  try {
    const body = createSectionBodySchema.parse(req.body);
    const doc = store.createSection(param(req.params.appId), body);
    if (!doc) {
      res.status(404).json({ error: "App n\xE3o encontrado." });
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
      res.status(404).json({ error: "Section n\xE3o encontrada." });
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
    res.status(404).json({ error: "Section n\xE3o encontrada." });
    return;
  }
  res.json(doc);
});
app.post("/api/sections/:id/stories", (req, res) => {
  try {
    const body = createStoriesBodySchema.parse(req.body);
    const doc = store.addStories(param(req.params.id), body.stories);
    if (!doc) {
      res.status(404).json({ error: "Section n\xE3o encontrada." });
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
      res.status(404).json({ error: "Hist\xF3ria n\xE3o encontrada." });
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
    res.status(404).json({ error: "Hist\xF3ria n\xE3o encontrada." });
    return;
  }
  res.json(doc);
});
app.post(
  "/api/apps/:appId/comparisons",
  upload.fields([
    { name: "appImage", maxCount: 1 },
    { name: "figmaImage", maxCount: 1 },
    { name: "images", maxCount: 2 }
  ]),
  (req, res) => {
    try {
      const files = req.files;
      const uploaded = [
        ...files?.images ?? [],
        ...files?.appImage ?? [],
        ...files?.figmaImage ?? []
      ];
      const pair = pairComparisonFiles(uploaded);
      const body = createComparisonBodySchema.parse({
        platform: req.body.platform,
        sectionId: req.body.sectionId || null,
        listState: req.body.listState || null,
        drawerLabel: req.body.drawerLabel || null
      });
      const doc = store.addComparison({
        appId: param(req.params.appId),
        platform: body.platform,
        sectionId: body.sectionId ?? null,
        appImage: publicUrl(pair.testflight.filename),
        figmaImage: publicUrl(pair.figma.filename),
        listState: body.listState ?? null,
        drawerLabel: body.drawerLabel ?? null
      });
      if (!doc) {
        res.status(404).json({ error: "App n\xE3o encontrado." });
        return;
      }
      res.status(201).json(doc);
    } catch (err) {
      sendError(res, err);
    }
  }
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
        publicUrl(req.file.filename)
      );
      if (!doc) {
        res.status(404).json({ error: "Compara\xE7\xE3o n\xE3o encontrada." });
        return;
      }
      res.json(doc);
    } catch (err) {
      sendError(res, err);
    }
  }
);
app.patch("/api/comparisons/:id", (req, res) => {
  try {
    const body = patchComparisonBodySchema.parse(req.body);
    const doc = store.patchComparison(param(req.params.id), body);
    if (!doc) {
      res.status(404).json({ error: "Compara\xE7\xE3o n\xE3o encontrada." });
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
    res.status(404).json({ error: "Compara\xE7\xE3o n\xE3o encontrada." });
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
      originalName: req.file.originalname
    });
    if (!doc) {
      res.status(404).json({ error: "Hist\xF3ria n\xE3o encontrada." });
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
    res.status(404).json({ error: "Grava\xE7\xE3o n\xE3o encontrada." });
    return;
  }
  res.json(doc);
});
app.use((err, _req, res, _next) => {
  sendError(res, err);
});
var app_default = app;

// server/vercel-handler.ts
function handler(req, res) {
  app_default(
    req,
    res
  );
}
export {
  handler as default
};
