import { Plus, X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { LabelColorPicker } from "@/components/labels/LabelColorPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labelBadgeStyle } from "@/lib/label-styles";
import { cn } from "@/lib/utils";
import {
  catalogHasLabel,
  DEFAULT_LABEL_COLOR,
  findCatalogLabel,
  SUGGESTED_APP_LABELS,
  type LabelColor,
} from "@shared/app-labels";

type CatalogHint = { name: string; color: LabelColor };

type AppCardLabelsProps = {
  labels: string[];
  catalog?: CatalogHint[];
  disabled?: boolean;
  className?: string;
  showAdd?: boolean;
  allowRecolor?: boolean;
  align?: "start" | "end";
  assigned?: string[];
  onAdd: (label: string, color: LabelColor) => void;
  onRemove: (label: string) => void;
  onRecolor: (label: string, color: LabelColor) => void;
};

const defaultCatalog: CatalogHint[] = SUGGESTED_APP_LABELS.map((name) => ({
  name,
  color: DEFAULT_LABEL_COLOR,
}));

export function AppCardLabels({
  labels,
  catalog = defaultCatalog,
  disabled = false,
  className,
  showAdd = true,
  allowRecolor = true,
  align = "start",
  assigned,
  onAdd,
  onRemove,
  onRecolor,
}: AppCardLabelsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<LabelColor>(DEFAULT_LABEL_COLOR);
  const [coloring, setColoring] = useState<string | null>(null);
  const unused = catalog.filter(
    (item) => !catalogHasLabel(assigned ?? labels, item.name),
  );

  function colorOf(name: string): LabelColor {
    return findCatalogLabel(catalog, name)?.color ?? DEFAULT_LABEL_COLOR;
  }

  function submit(value: string, color: LabelColor) {
    const label = value.trim();
    if (!label) return;
    onAdd(label, color);
    setDraft("");
    setDraftColor(DEFAULT_LABEL_COLOR);
    setOpen(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(draft, draftColor);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setDraft("");
      setOpen(false);
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          align === "end" && "justify-end",
        )}
      >
        {labels.map((label) => (
          <Badge
            key={label}
            className="gap-1 pr-1"
            style={labelBadgeStyle(colorOf(label))}
            title={label}
          >
            <button
              type="button"
              disabled={disabled || !allowRecolor}
              className="max-w-40 truncate"
              onClick={() => {
                if (!allowRecolor) return;
                setColoring((current) => (current === label ? null : label));
              }}
            >
              {label}
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remover label ${label}`}
              className="rounded-full p-0.5 hover:bg-foreground/10"
              onClick={() => onRemove(label)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {open || !showAdd ? null : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            className="h-7 rounded-full px-2 text-xs text-muted"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-3" />
            Label
          </Button>
        )}
      </div>
      {allowRecolor && coloring ? (
        <LabelColorPicker
          value={colorOf(coloring)}
          disabled={disabled}
          onChange={(color) => onRecolor(coloring, color)}
        />
      ) : null}
      {showAdd && open ? (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              autoFocus
              value={draft}
              disabled={disabled}
              maxLength={40}
              placeholder="Ex.: falhou login"
              aria-label="Nova label"
              className="h-7 w-40 px-2 text-xs"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button type="submit" size="sm" disabled={disabled} className="h-7">
              Adicionar
            </Button>
          </div>
          <LabelColorPicker
            value={draftColor}
            disabled={disabled}
            onChange={setDraftColor}
          />
          <div className="flex flex-wrap gap-2">
            {unused.map((item) => (
              <Button
                key={item.name}
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                className="h-7 rounded-full text-xs"
                style={labelBadgeStyle(item.color)}
                onClick={() => submit(item.name, item.color)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </form>
      ) : null}
    </div>
  );
}
