import { Pencil, Pin, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { LabelColorPicker } from "@/components/labels/LabelColorPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { labelBadgeStyle } from "@/lib/label-styles";
import type { LabelColor, LabelPlacement, LabelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DEFAULT_LABEL_COLOR } from "@shared/label-colors";

type LabelCatalogPanelProps = {
  labels: LabelSummary[];
  selected: string | null;
  disabled?: boolean;
  onSelect: (name: string) => void;
  onCreate: (name: string, color: LabelColor) => void;
  onRename: (from: string, to: string) => void;
  onRecolor: (name: string, color: LabelColor) => void;
  onPlace: (name: string, placement: LabelPlacement) => void;
  onDelete: (name: string) => void;
};

export function LabelCatalogPanel({
  labels,
  selected,
  disabled = false,
  onSelect,
  onCreate,
  onRename,
  onRecolor,
  onPlace,
  onDelete,
}: LabelCatalogPanelProps) {
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<LabelColor>(DEFAULT_LABEL_COLOR);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onCreate(name, draftColor);
    setDraft("");
    setDraftColor(DEFAULT_LABEL_COLOR);
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    const name = renameDraft.trim();
    if (!name) return;
    onRename(renaming, name);
    setRenaming(null);
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Catálogo</h2>
      <form className="mb-4 flex items-center gap-2" onSubmit={handleCreate}>
        <LabelColorPicker
          value={draftColor}
          disabled={disabled}
          onChange={setDraftColor}
        />
        <Input
          value={draft}
          disabled={disabled}
          maxLength={40}
          placeholder="Nova label…"
          aria-label="Nome da nova label"
          className="flex-1"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={disabled || !draft.trim()}>
          Criar
        </Button>
      </form>
      {labels.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma label ainda.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {labels.map((label) => (
            <li key={label.name}>
              {renaming === label.name ? (
                <form className="flex gap-2" onSubmit={handleRename}>
                  <Input
                    autoFocus
                    value={renameDraft}
                    disabled={disabled}
                    maxLength={40}
                    aria-label="Novo nome da label"
                    onChange={(event) => setRenameDraft(event.target.value)}
                  />
                  <Button type="submit" size="sm" disabled={disabled}>
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRenaming(null)}
                  >
                    Cancelar
                  </Button>
                </form>
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5",
                    selected === label.name && "bg-accent",
                  )}
                >
                  <LabelColorPicker
                    value={label.color}
                    disabled={disabled}
                    className="size-7"
                    onChange={(color) => onRecolor(label.name, color)}
                  />
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                    onClick={() => onSelect(label.name)}
                  >
                    <Badge className="max-w-48 truncate" style={labelBadgeStyle(label.color)}>
                      {label.name}
                    </Badge>
                    <Badge>{label.appCount}</Badge>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={
                      label.placement === "header"
                        ? `Tirar ${label.name} do canto do card`
                        : `Mostrar ${label.name} no canto do card`
                    }
                    disabled={disabled}
                    className={
                      label.placement === "header"
                        ? "text-primary"
                        : "text-muted"
                    }
                    onClick={() =>
                      onPlace(
                        label.name,
                        label.placement === "header" ? "footer" : "header",
                      )
                    }
                  >
                    <Pin
                      className={cn(
                        "size-3.5",
                        label.placement === "header" && "fill-current",
                      )}
                    />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Renomear ${label.name}`}
                    disabled={disabled}
                    onClick={() => {
                      setRenaming(label.name);
                      setRenameDraft(label.name);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Excluir ${label.name}`}
                    disabled={disabled}
                    className="text-danger hover:text-danger"
                    onClick={() => onDelete(label.name)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
