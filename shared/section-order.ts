import { drawerRank, listStateRank, type ListState } from "./list-state.ts";
import { navIndex } from "./nav-order.ts";

/** Login primeiro, Perfil por último; telas logadas na ordem da navbar. */

export function isLoginSection(title: string): boolean {
  return foldTitle(title) === "login";
}

export function isProfileSection(title: string): boolean {
  return foldTitle(title) === "perfil";
}

export function sectionGroup(title: string): 0 | 1 | 2 {
  if (isLoginSection(title)) return 0;
  if (isProfileSection(title)) return 2;
  return 1;
}

type OrderedSection = { title: string; order: number; appId?: string };

export function compareSections(a: OrderedSection, b: OrderedSection): number {
  const byGroup = sectionGroup(a.title) - sectionGroup(b.title);
  if (byGroup !== 0) return byGroup;
  const appId = a.appId ?? b.appId;
  const byNav = loggedInRank(appId, a.title) - loggedInRank(appId, b.title);
  if (byNav !== 0) return byNav;
  return a.order - b.order;
}

export function compareComparisons(
  a: {
    sectionId: string | null;
    listState?: ListState | null;
    drawerLabel?: string | null;
  },
  b: {
    sectionId: string | null;
    listState?: ListState | null;
    drawerLabel?: string | null;
  },
  sections: Array<OrderedSection & { id: string }>,
  navAppId?: string,
): number {
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

export function assignSectionOrders<T extends OrderedSection>(
  sections: T[],
  navAppId?: string,
): T[] {
  const sorted = [...sections].sort((a, b) =>
    compareSections(
      { ...a, appId: navAppId ?? a.appId },
      { ...b, appId: navAppId ?? b.appId },
    ),
  );
  sorted.forEach((section, index) => {
    section.order = index;
  });
  return sorted;
}

function loggedInRank(appId: string | undefined, title: string): number {
  const folded = foldTitle(title);
  if (folded === "cadastro") return -2;
  if (folded === "paywall") return -1;
  const index = navIndex(appId, title);
  if (index !== null) return index;
  return Number.MAX_SAFE_INTEGER - 1;
}

function foldTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function comparisonMeta(
  sectionId: string | null,
  sections: Array<OrderedSection & { id: string }>,
  navAppId?: string,
): { group: 0 | 1 | 2; order: number } {
  const section = sectionId
    ? sections.find((item) => item.id === sectionId)
    : undefined;
  if (!section) {
    return { group: 1, order: Number.MAX_SAFE_INTEGER };
  }
  return {
    group: sectionGroup(section.title),
    order: loggedInRank(navAppId ?? section.appId, section.title),
  };
}
