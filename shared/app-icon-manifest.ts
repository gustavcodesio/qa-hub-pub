/** Gerado por scripts/seed-icons.ts — não editar à mão. */
export const BUNDLED_APP_ICONS: Readonly<Record<string, string>> = {
  "gratos": "/app-icons/gratos.png",
  "karrin": "/app-icons/karrin.png",
  "dailyfit": "/app-icons/dailyfit.png",
  "equivale": "/app-icons/equivale.png",
  "flowy": "/app-icons/flowy.png",
  "pomodoro": "/app-icons/pomodoro.png",
  "sereno": "/app-icons/sereno.png",
  "subtracker": "/app-icons/subtracker.png",
  "tarefas": "/app-icons/tarefas.png",
  "animo": "/app-icons/animo.png",
  "bruxcare": "/app-icons/bruxcare.png",
  "calccombu": "/app-icons/calccombu.png",
  "vista": "/app-icons/vista.png",
  "cofresenhas": "/app-icons/cofresenhas.png",
  "dosex": "/app-icons/dosex.png",
  "leitorpdf": "/app-icons/leitorpdf.png",
  "lumina": "/app-icons/lumina.png",
  "planta": "/app-icons/planta.png",
  "quickpdf": "/app-icons/quickpdf.png",
  "rotacalc": "/app-icons/rotacalc.png",
};

export function bundledAppIconUrl(appId: string): string | null {
  return BUNDLED_APP_ICONS[appId] ?? null;
}
