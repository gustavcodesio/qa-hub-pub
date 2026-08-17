import type { CSSProperties } from "react";
import { hexToRgba, normalizeLabelColor } from "@shared/label-colors";

export function labelBadgeStyle(color: string): CSSProperties {
  const hex = normalizeLabelColor(color);
  return {
    borderColor: hexToRgba(hex, 0.45),
    backgroundColor: hexToRgba(hex, 0.12),
    color: hex,
  };
}
