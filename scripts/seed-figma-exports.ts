import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "data", "db.json");
const uploadsDir = path.join(root, "public", "uploads");
const sourceRoot =
  process.argv[2] ??
  "/Users/gustavobordignon/Downloads/imagns do figma por app";

type Section = { id: string; appId: string; title: string };
type App = { id: string; name: string };
type Comparison = {
  id: string;
  appId: string;
  sectionId: string | null;
  platform: "ios" | "android";
  appImage: string;
  figmaImage: string;
          listState: "empty" | "filled" | null;
          drawerLabel: string | null;
        };

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FOLDER_TO_APP: Record<string, string> = {
  bruxcare: "bruxcare",
  calculadora: "vista",
  "calculadora viagem": "rotacalc",
  "calculadora combustivel": "calccombu",
  dailyfit: "dailyfit",
  dosex: "dosex",
  "equivale conversor de unidades": "equivale",
  "filtros foto app": "lumina",
  flowy: "flowy",
  "frases motivacionais": "animo",
  "identificador de plantas": "planta",
  "leitor pdf app": "leitorpdf",
  "pomodoro app": "pomodoro",
  quickpdf: "quickpdf",
  sereno: "sereno",
  subtracker: "subtracker",
  "tarefas do dia": "tarefas",
  karrin: "karrin",
};

const HOME_HINTS = [
  "inicio",
  "home",
  "foco",
  "agenda",
  "recentes",
  "registro de hoje",
  "calcular viagem",
  "frase do dia",
  "lista de tarefas",
  "biblioteca",
  "categorias",
  "qual combustivel",
  "vista ou a prazo",
];

function matchSection(filename: string, sections: Section[]): string | null {
  const file = fold(filename);
  if (!file || file === "splash screen" || file === "splash") return null;

  let best: { id: string; score: number } | null = null;
  for (const section of sections) {
    const title = fold(section.title);
    let score = 0;
    if (file === title) score = 30;
    else if (file.includes(title) || title.includes(file)) score = 18;
    for (const word of title.split(" ").filter((w) => w.length > 3)) {
      if (file.includes(word)) score += 6;
    }
    if (file.includes("login") && title === "login") score += 20;
    if (file.includes("perfil") && title === "perfil") score += 20;
    if (file.includes("historico") && title.includes("historico")) score += 16;
    if (file.includes("resultado") && title.includes("resultado")) score += 16;
    if (file.includes("resultado") && (title.includes("calcular") || title === "inicio"))
      score += 10;
    if (file.includes("perguntas") && title.includes("questionario")) score += 16;
    if (file.includes("conversor") && title.includes("conversor")) score += 16;
    if (file.includes("listagem") && title.includes("categorias")) score += 16;
    if (file.includes("calculadora") && title.includes("calculadora")) score += 16;
    if (file.includes("calcular") && (title.includes("calcular") || title.includes("compensa") || title.includes("vista")))
      score += 14;
    if (file.includes("relatorio") && title.includes("relatorio")) score += 16;
    if (file.includes("config") && title === "foco") score += 10;
    if ((file.includes("musica") || file.includes("explorar")) && title.includes("musica"))
      score += 16;
    if (file === "play" && title === "player") score += 20;
    if (file.includes("assinatura") && title.includes("assinatura")) score += 16;
    if (file.includes("tarefa") && title.includes("tarefa")) score += 16;
    if (file.includes("favorita") && title.includes("favorita")) score += 16;
    if (file.includes("favorito") && title.includes("favorito")) score += 16;
    if (file.includes("frase") && title.includes("frase")) score += 16;
    if (file.includes("camera") && title.includes("camera")) score += 16;
    if (file.includes("loading") && title.includes("identificando")) score += 16;
    if (file.includes("not found") && title.includes("nao reconhecida")) score += 16;
    if (file.includes("pesquisar") && title.includes("pesquisar")) score += 16;
    if (file.includes("pesquisa") && title.includes("historico")) score += 8;
    if (file.includes("pasta") && title === "pasta") score += 16;
    if (file.includes("leitor") && title === "leitor") score += 16;
    if (file.includes("arquivo") && title.includes("arquivo")) score += 16;
    if (file.includes("editor") || file.includes("editar vazio") || file.includes("salvar") || file.includes("excluir pagina") || file.includes("excluir tudo") || file.includes("opcoes pdf")) {
      if (title === "editor") score += 16;
    }
    if (file.includes("medicamentos") && title === "medicamentos") score += 18;
    if ((file.includes("medicamento") || file.includes("editar medicamento")) && title.includes("detalhe do medicamento"))
      score += 14;
    if ((file.includes("acoes") || file.includes("lembrete") || file.includes("excluir") || file.includes("add medicamento")) && title === "agenda")
      score += 12;
    if ((file.includes("lembrete") || file.includes("personalizado") || file.startsWith("inicio")) && title.includes("registro"))
      score += 10;
    if ((file.includes("listas") || file === "empty") && title.includes("listas")) score += 16;
    if ((file.includes("produto")) && title === "produtos") score += 16;
    if ((file.includes("lista aberta") || file.includes("carrinho")) && title.includes("detalhe da lista"))
      score += 16;
    if ((file.includes("add assinatura") || file === "empty") && title.includes("assinatura"))
      score += 12;
    if (file.includes("humor") && title === "humor") score += 16;
    if (file.includes("adicionar item") && title.includes("adicionar")) score += 16;
    if ((file.includes("senha") || file.includes("criar senha")) && title.includes("senha"))
      score += 16;
    if (file.includes("frame") && (title === "inicio" || title === "ciclo")) score += 8;
    if ((file.includes("inicio") || file.includes("primeiro acesso") || file.includes("escanear") || file.includes("modal") || file.includes("configuracao")) && HOME_HINTS.some((h) => title.includes(h) || fold(section.id).includes(h.replace(/ /g, "-"))))
      score += 8;

    if (score > 0 && (!best || score > best.score)) {
      best = { id: section.id, score };
    }
  }

  if (best && best.score >= 8) return best.id;

  const home = sections.find((section) => {
    const title = fold(section.title);
    return HOME_HINTS.some((h) => title.includes(h));
  });
  if (
    home &&
    /inicio|home|frame|splash|primeiro|empty|config/.test(file)
  ) {
    return home.id;
  }
  return null;
}

function seed(): void {
  mkdirSync(uploadsDir, { recursive: true });
  const db = JSON.parse(readFileSync(dbPath, "utf8")) as {
    apps: App[];
    sections: Section[];
    comparisons: Comparison[];
  };

  const folders = readdirSync(sourceRoot, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith("."),
  );

  const unmatched: string[] = [];
  let added = 0;

  for (const folder of folders) {
    const appId = FOLDER_TO_APP[fold(folder.name)];
    if (!appId) {
      if (fold(folder.name) === "gratos") {
        console.log("Pulando gratos (já cadastrado).");
        continue;
      }
      console.warn(`Pasta sem app: ${folder.name}`);
      continue;
    }
    const app = db.apps.find((item) => item.id === appId);
    if (!app) {
      console.warn(`App não encontrado: ${appId}`);
      continue;
    }
    const sections = db.sections.filter((section) => section.appId === appId);
    const files = readdirSync(path.join(sourceRoot, folder.name)).filter(
      (name) => /\.(png|jpe?g|webp)$/i.test(name),
    );

    for (const file of files) {
      const sectionId = matchSection(file, sections);
      if (!sectionId) unmatched.push(`${app.name}/${file}`);
      const destName = `${randomUUID()}${path.extname(file).toLowerCase()}`;
      copyFileSync(
        path.join(sourceRoot, folder.name, file),
        path.join(uploadsDir, destName),
      );
      const figmaImage = `/uploads/${destName}`;
      for (const platform of ["ios", "android"] as const) {
        db.comparisons.push({
          id: randomUUID(),
          appId,
          sectionId,
          platform,
          appImage: "",
          figmaImage,
          listState: null,
          drawerLabel: null,
        });
        added += 1;
      }
    }
  }

  writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);
  console.log(`Comparações novas: ${added} (iOS+Android).`);
  if (unmatched.length) {
    console.log("Sem tela (Geral):");
    for (const item of unmatched) console.log(`  - ${item}`);
  }
}

seed();
