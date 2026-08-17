import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LabelAppsPanel } from "@/components/labels/LabelAppsPanel";
import { LabelCatalogPanel } from "@/components/labels/LabelCatalogPanel";
import { api } from "@/lib/api";
import type { LabelColor, LabelPlacement } from "@/lib/types";
import { addAppLabel, removeAppLabel } from "@shared/app-labels";

export function LabelsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const appsQuery = useQuery({ queryKey: ["apps"], queryFn: api.listApps });
  const labelsQuery = useQuery({
    queryKey: ["labels"],
    queryFn: api.listLabels,
  });

  const labels = labelsQuery.data?.labels ?? [];
  const apps = appsQuery.data?.apps ?? [];

  useEffect(() => {
    if (!selected && labels[0]) setSelected(labels[0].name);
    if (selected && !labels.some((label) => label.name === selected)) {
      setSelected(labels[0]?.name ?? null);
    }
  }, [labels, selected]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["labels"] });
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  const createLabel = useMutation({
    mutationFn: ({ name, color }: { name: string; color: LabelColor }) =>
      api.createLabel(name, color),
    onSuccess: (_data, vars) => {
      invalidate();
      setSelected(vars.name.trim());
    },
  });

  const renameLabel = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      api.renameLabel(from, to),
    onSuccess: (_data, vars) => {
      invalidate();
      setSelected(vars.to.trim());
    },
  });

  const recolorLabel = useMutation({
    mutationFn: ({ name, color }: { name: string; color: LabelColor }) =>
      api.patchLabel(name, { color }),
    onSuccess: invalidate,
  });

  const placeLabel = useMutation({
    mutationFn: ({
      name,
      placement,
    }: {
      name: string;
      placement: LabelPlacement;
    }) => api.patchLabel(name, { placement }),
    onSuccess: invalidate,
  });

  const deleteLabel = useMutation({
    mutationFn: api.deleteLabel,
    onSuccess: invalidate,
  });

  const patchApp = useMutation({
    mutationFn: ({ id, labels }: { id: string; labels: string[] }) =>
      api.patchApp(id, { labels }),
    onSuccess: invalidate,
  });

  const saving =
    createLabel.isPending ||
    renameLabel.isPending ||
    recolorLabel.isPending ||
    placeLabel.isPending ||
    deleteLabel.isPending ||
    patchApp.isPending;

  const error =
    (labelsQuery.error instanceof Error && labelsQuery.error.message) ||
    (appsQuery.error instanceof Error && appsQuery.error.message) ||
    (createLabel.error instanceof Error && createLabel.error.message) ||
    (renameLabel.error instanceof Error && renameLabel.error.message) ||
    (recolorLabel.error instanceof Error && recolorLabel.error.message) ||
    (placeLabel.error instanceof Error && placeLabel.error.message) ||
    (deleteLabel.error instanceof Error && deleteLabel.error.message) ||
    (patchApp.error instanceof Error && patchApp.error.message);

  if (labelsQuery.isLoading || appsQuery.isLoading) {
    return <p className="text-muted">Carregando labels…</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Labels</h1>
      <p className="mb-6 text-muted">
        Crie, renomeie e aplique labels nos apps. O alfinete fixa a label no
        canto do card, no lugar das fotos iOS.
      </p>
      {error ? <p className="mb-4 text-danger">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <LabelCatalogPanel
          labels={labels}
          selected={selected}
          disabled={saving}
          onSelect={setSelected}
          onCreate={(name, color) => createLabel.mutate({ name, color })}
          onRename={(from, to) => renameLabel.mutate({ from, to })}
          onRecolor={(name, color) => recolorLabel.mutate({ name, color })}
          onPlace={(name, placement) => placeLabel.mutate({ name, placement })}
          onDelete={(name) => {
            const ok = window.confirm(
              `Excluir “${name}” de todos os apps?`,
            );
            if (ok) deleteLabel.mutate(name);
          }}
        />
        <LabelAppsPanel
          label={selected}
          apps={apps}
          disabled={saving}
          onToggle={(appId, enabled) => {
            const app = apps.find((item) => item.id === appId);
            if (!app || !selected) return;
            patchApp.mutate({
              id: appId,
              labels: enabled
                ? addAppLabel(app.labels ?? [], selected)
                : removeAppLabel(app.labels ?? [], selected),
            });
          }}
        />
      </div>
    </div>
  );
}
