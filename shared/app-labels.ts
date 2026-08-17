import {
  DEFAULT_LABEL_COLOR,
  normalizeLabelColor,
  type LabelColor,
} from "./label-colors.ts";

export {
  DEFAULT_LABEL_COLOR,
  normalizeLabelColor,
  type LabelColor,
} from "./label-colors.ts";

export const SUGGESTED_APP_LABELS = [
  "falhou login",
  "falhou cadastro",
  "splash screen errada",
  "paywall",
  "crash",
] as const;

export const LABEL_PLACEMENTS = ["header", "footer"] as const;
export type LabelPlacement = (typeof LABEL_PLACEMENTS)[number];
export const DEFAULT_LABEL_PLACEMENT: LabelPlacement = "footer";

export type CatalogLabel = {
  name: string;
  color: LabelColor;
  placement: LabelPlacement;
};

export function normalizeLabelPlacement(value: unknown): LabelPlacement {
  return value === "header" ? "header" : DEFAULT_LABEL_PLACEMENT;
}

export const APP_LABEL_MAX_LENGTH = 40;
export const APP_LABELS_MAX = 8;

export function suggestedCatalogLabels(): CatalogLabel[] {
  return SUGGESTED_APP_LABELS.map((name) => ({
    name,
    color: DEFAULT_LABEL_COLOR,
    placement: DEFAULT_LABEL_PLACEMENT,
  }));
}

export function normalizeAppLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, APP_LABEL_MAX_LENGTH);
}

export function normalizeAppLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
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

export function labelKey(value: string): string {
  return normalizeAppLabel(value).toLocaleLowerCase("pt-BR");
}

function itemName(item: string | Pick<CatalogLabel, "name">): string {
  return typeof item === "string" ? item : item.name;
}

export function addAppLabel(labels: string[], next: string): string[] {
  return normalizeAppLabels([...labels, next]);
}

export function removeAppLabel(labels: string[], target: string): string[] {
  const key = labelKey(target);
  return labels.filter((label) => labelKey(label) !== key);
}

export function mergeLabelCatalog(
  catalog: Array<Pick<CatalogLabel, "name" | "color"> & Partial<Pick<CatalogLabel, "placement">>>,
  used: string[],
  colorForNew: LabelColor = DEFAULT_LABEL_COLOR,
  placementForNew: LabelPlacement = DEFAULT_LABEL_PLACEMENT,
): CatalogLabel[] {
  const result: CatalogLabel[] = [];
  const seen = new Set<string>();

  function push(name: string, color: LabelColor, placement: LabelPlacement) {
    const normalized = normalizeAppLabel(name);
    if (!normalized) return;
    const key = labelKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    result.push({
      name: normalized,
      color: normalizeLabelColor(color),
      placement: normalizeLabelPlacement(placement),
    });
  }

  for (const item of catalog) {
    push(item.name, item.color, item.placement ?? DEFAULT_LABEL_PLACEMENT);
  }
  for (const name of used) push(name, colorForNew, placementForNew);
  return result;
}

export function renameInLabels(
  labels: string[],
  from: string,
  to: string,
): string[] {
  const fromKey = labelKey(from);
  const renamed = labels.map((label) =>
    labelKey(label) === fromKey ? normalizeAppLabel(to) : label,
  );
  return normalizeAppLabels(renamed);
}

export function renameInCatalog(
  catalog: CatalogLabel[],
  from: string,
  to: string,
): CatalogLabel[] {
  const fromKey = labelKey(from);
  const nextName = normalizeAppLabel(to);
  if (!nextName) return catalog;
  const renamed = catalog.map((item) =>
    labelKey(item.name) === fromKey ? { ...item, name: nextName } : item,
  );
  return mergeLabelCatalog(renamed, []);
}

export function setLabelColor(
  catalog: CatalogLabel[],
  name: string,
  color: LabelColor,
): CatalogLabel[] {
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

export function setLabelPlacement(
  catalog: CatalogLabel[],
  name: string,
  placement: LabelPlacement,
): CatalogLabel[] {
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
    nextPlacement,
  );
}

export function splitLabelsByPlacement(
  labels: string[],
  catalog: Array<Pick<CatalogLabel, "name"> & Partial<Pick<CatalogLabel, "placement">>>,
): { header: string[]; footer: string[] } {
  const header: string[] = [];
  const footer: string[] = [];
  for (const name of labels) {
    const item = catalog.find((entry) => labelKey(entry.name) === labelKey(name));
    if (normalizeLabelPlacement(item?.placement) === "header") {
      header.push(name);
    } else {
      footer.push(name);
    }
  }
  return { header, footer };
}

export function catalogHasLabel(
  catalog: Array<string | Pick<CatalogLabel, "name">>,
  name: string,
): boolean {
  const key = labelKey(name);
  return catalog.some((item) => labelKey(itemName(item)) === key);
}

export function findCatalogLabel<T extends Pick<CatalogLabel, "name">>(
  catalog: T[],
  name: string,
): T | undefined {
  const key = labelKey(name);
  return catalog.find((item) => labelKey(item.name) === key);
}
