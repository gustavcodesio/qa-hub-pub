import { Button } from "@/components/ui/button";
import { labelBadgeStyle } from "@/lib/label-styles";
import type { LabelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type LabelsFilterProps = {
  labels: LabelSummary[];
  value: string | null;
  onChange: (value: string | null) => void;
};

export function LabelsFilter({ labels, value, onChange }: LabelsFilterProps) {
  const options = labels.filter((label) => label.appCount > 1);
  if (options.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por label"
      className="flex flex-wrap gap-2"
    >
      <Button
        type="button"
        role="radio"
        aria-checked={value === null}
        size="sm"
        variant={value === null ? "default" : "outline"}
        className={cn("rounded-full", value !== null && "text-muted")}
        onClick={() => onChange(null)}
      >
        Todos
      </Button>
      {options.map((label) => {
        const selected = value === label.name;
        return (
          <Button
            key={label.name}
            type="button"
            role="radio"
            aria-checked={selected}
            size="sm"
            variant="outline"
            className={cn("rounded-full", !selected && "text-muted")}
            style={selected ? labelBadgeStyle(label.color) : undefined}
            onClick={() => onChange(selected ? null : label.name)}
          >
            {label.name}
          </Button>
        );
      })}
    </div>
  );
}
