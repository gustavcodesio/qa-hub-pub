/**
 * Telas logadas na ordem da navbar, com stacks logo após a tab pai.
 * Login/Cadastro/Paywall e Perfil ficam de fora (tratados em section-order).
 */
export const APP_NAV_ORDER: Record<string, string[]> = {
  gratos: ["Home / Diário", "Adicionar item ao diário", "Senha de acesso", "Humor"],
  karrin: ["Home / Listas", "Detalhe da lista", "Produtos"],
  dailyfit: ["Questionário", "Início", "Histórico"],
  equivale: ["Categorias", "Conversor", "Calculadora"],
  flowy: ["Início", "Ciclo"],
  pomodoro: ["Foco", "Relatório"],
  sereno: ["Músicas", "Player"],
  subtracker: ["Início", "Assinaturas"],
  tarefas: ["Lista de tarefas", "Calendário"],
  animo: ["Frase do dia", "Favoritas"],
  bruxcare: ["Registro de hoje", "Histórico"],
  calccombu: ["Qual combustível compensa?", "Resultado", "Histórico"],
  vista: ["À vista ou a prazo", "Resultado", "Histórico"],
  cofresenhas: ["Início", "Cofre", "Nova senha", "Detalhe da senha"],
  dosex: ["Agenda", "Medicamentos", "Detalhe do medicamento"],
  leitorpdf: ["Biblioteca", "Pasta", "Leitor", "Pesquisar", "Favoritos"],
  lumina: ["Início", "Editor"],
  planta: [
    "Início",
    "Câmera",
    "Identificando",
    "Planta não reconhecida",
    "Histórico",
    "Sobre essa planta",
  ],
  quickpdf: ["Recentes", "Pesquisar", "Editor", "Informações do documento", "Arquivos"],
  rotacalc: ["Calcular viagem", "Histórico"],
};

export function resolveNavAppId(appId: string, slug?: string): string {
  if (APP_NAV_ORDER[appId]) return appId;
  if (slug && APP_NAV_ORDER[slug]) return slug;
  return appId;
}

export function navIndex(appId: string | undefined, title: string): number | null {
  if (!appId) return null;
  const nav = APP_NAV_ORDER[appId];
  if (!nav) return null;
  const folded = foldNavTitle(title);
  const index = nav.findIndex((item) => foldNavTitle(item) === folded);
  return index >= 0 ? index : null;
}

export function sortByNavOrder<T extends { title: string }>(
  appId: string,
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const left = navIndex(appId, a.title) ?? Number.MAX_SAFE_INTEGER;
    const right = navIndex(appId, b.title) ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

function foldNavTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
