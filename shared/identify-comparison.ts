export type ComparisonSource = "figma" | "testflight" | "unknown";

function normalizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  return base
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Figma = "Captura de tela…"; TestFlight = "Whats…". */
export function classifyScreenshotName(filename: string): ComparisonSource {
  const name = normalizeFilename(filename);
  if (name.includes("captura de tela") || name.startsWith("captura")) {
    return "figma";
  }
  if (name.startsWith("whats") || name.includes("whatsapp")) {
    return "testflight";
  }
  return "unknown";
}

export function assignComparisonFile<T extends { name?: string; originalname?: string }>(
  current: { figma: T | null; testflight: T | null },
  file: T,
): { figma: T | null; testflight: T | null } {
  const kind = classifyScreenshotName(file.originalname ?? file.name ?? "");
  if (kind === "figma") return { ...current, figma: file };
  if (kind === "testflight") return { ...current, testflight: file };
  throw new Error(
    "Não identifiquei o print. O do TestFlight deve começar com Whats… e o do Figma com Captura de tela…",
  );
}

export function mergeComparisonFiles<T extends { name?: string; originalname?: string }>(
  current: { figma: T | null; testflight: T | null },
  files: T[],
): { figma: T | null; testflight: T | null } {
  return files.reduce(assignComparisonFile, current);
}

export function pairComparisonFiles<T extends { name?: string; originalname?: string }>(
  files: T[],
): { figma: T; testflight: T } {
  const merged = mergeComparisonFiles({ figma: null, testflight: null }, files);
  if (!merged.figma || !merged.testflight) {
    throw new Error("Faltou um print. Precisa de Figma (Captura de tela…) e TestFlight (Whats…).");
  }
  return { figma: merged.figma, testflight: merged.testflight };
}
