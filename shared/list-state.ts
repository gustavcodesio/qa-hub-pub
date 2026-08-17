import type { ListState } from "./schema.ts";

export type { ListState };

/** empty → filled → demais da mesma tela. */
export function listStateRank(listState: ListState | null | undefined): number {
  if (listState === "empty") return 0;
  if (listState === "filled") return 1;
  return 2;
}

export function normalizeDrawerLabel(
  value: string | null | undefined,
): string | null {
  const label = value?.trim() ?? "";
  return label.length > 0 ? label : null;
}

/** Sem drawer antes de com drawer; depois o rótulo em ordem. */
export function drawerRank(drawerLabel: string | null | undefined): number {
  return normalizeDrawerLabel(drawerLabel) ? 1 : 0;
}

export function comparisonCaption(
  sectionTitle: string | undefined,
  listState: ListState | null | undefined,
  drawerLabel?: string | null,
): string {
  const title = sectionTitle?.trim() || "Geral";
  const drawer = normalizeDrawerLabel(drawerLabel);
  if (drawer) {
    return `Tela de ${title} — com drawer de ${drawer} aberto`;
  }
  if (listState === "empty") {
    return `Tela de ${title} — quando não tem nenhum registrado`;
  }
  if (listState === "filled") {
    return `Tela de ${title} — quando tem itens registrados`;
  }
  return title;
}
