import { useEffect, useRef, useState } from "react";
import { normalizeLabelColor, type LabelColor } from "@shared/label-colors";
import { cn } from "@/lib/utils";

type LabelColorPickerProps = {
  value: LabelColor;
  disabled?: boolean;
  className?: string;
  onChange: (color: LabelColor) => void;
};

export function LabelColorPicker({
  value,
  disabled = false,
  className,
  onChange,
}: LabelColorPickerProps) {
  const normalized = normalizeLabelColor(value);
  const [local, setLocal] = useState(normalized);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(normalizeLabelColor(value));
  }, [value]);

  useEffect(() => {
    if (local === normalizeLabelColor(value)) return;
    const timer = window.setTimeout(() => onChangeRef.current(local), 200);
    return () => window.clearTimeout(timer);
  }, [local, value]);

  return (
    <input
      type="color"
      value={local}
      disabled={disabled}
      aria-label="Cor da label"
      className={cn(
        "h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5",
        "[&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0",
        "[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0",
        className,
      )}
      onChange={(event) => setLocal(event.target.value)}
    />
  );
}
