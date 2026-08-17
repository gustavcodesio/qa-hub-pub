export type LabelColor = string;

export const DEFAULT_LABEL_COLOR = "#ef4444";

const NAMED_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#10b981",
  blue: "#0ea5e9",
  purple: "#8b5cf6",
  pink: "#ec4899",
  gray: "#a1a1aa",
};

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

export function normalizeLabelColor(value: unknown): LabelColor {
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

export function hexToRgba(color: string, alpha: number): string {
  const hex = normalizeLabelColor(color).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
