import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CatalogAppCard } from "@/components/catalog/CatalogAppCard";
import { LabelsFilter } from "@/components/catalog/LabelsFilter";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AppSummary, LabelColor } from "@/lib/types";
import {
  addAppLabel,
  catalogHasLabel,
  removeAppLabel,
} from "@shared/app-labels";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function CatalogPage() {
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["apps"] });
    queryClient.invalidateQueries({ queryKey: ["labels"] });
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["apps"],
    queryFn: api.listApps,
  });
  const labelsQuery = useQuery({
    queryKey: ["labels"],
    queryFn: api.listLabels,
  });

  const catalog = labelsQuery.data?.labels ?? [];

  useEffect(() => {
    if (!labelFilter) return;
    const stillFilterable = catalog.some(
      (label) => label.name === labelFilter && label.appCount > 1,
    );
    if (!stillFilterable) setLabelFilter(null);
  }, [catalog, labelFilter]);

  const patchLabels = useMutation({
    mutationFn: ({ id, labels }: { id: string; labels: string[] }) =>
      api.patchApp(id, { labels }),
    onSuccess: invalidate,
  });

  const addLabel = useMutation({
    mutationFn: async ({
      app,
      name,
      color,
    }: {
      app: AppSummary;
      name: string;
      color: LabelColor;
    }) => {
      if (!catalogHasLabel(catalog, name)) {
        await api.createLabel(name, color);
      }
      await api.patchApp(app.id, {
        labels: addAppLabel(app.labels ?? [], name),
      });
    },
    onSuccess: invalidate,
  });

  const recolorLabel = useMutation({
    mutationFn: ({ name, color }: { name: string; color: LabelColor }) =>
      api.patchLabel(name, { color }),
    onSuccess: invalidate,
  });

  const apps = data?.apps ?? [];
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return apps.filter((app) => {
      if (labelFilter && !catalogHasLabel(app.labels ?? [], labelFilter)) {
        return false;
      }
      if (term && !normalize(app.name).includes(term)) return false;
      return true;
    });
  }, [apps, labelFilter, query]);

  function updateLabels(
    app: AppSummary,
    next: (labels: string[]) => string[],
  ) {
    patchLabels.mutate({
      id: app.id,
      labels: next(app.labels ?? []),
    });
  }

  if (isLoading) return <p className="text-muted">Carregando apps…</p>;
  if (error instanceof Error)
    return <p className="text-danger">{error.message}</p>;

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Testes mini apps</h1>
      <p className="mb-6 text-muted">
        Cada card é um app. Abra para ver páginas, histórias e evidências.
      </p>
      {apps.length === 0 ? (
        <p className="text-muted">Nenhum app cadastrado ainda.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome…"
              aria-label="Pesquisar app por nome"
              className="max-w-md"
            />
            <LabelsFilter
              labels={catalog}
              value={labelFilter}
              onChange={setLabelFilter}
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted">Nenhum app encontrado.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((app) => (
                <CatalogAppCard
                  key={app.id}
                  app={app}
                  suggestions={catalog}
                  saving={
                    (patchLabels.isPending &&
                      patchLabels.variables?.id === app.id) ||
                    (addLabel.isPending &&
                      addLabel.variables?.app.id === app.id) ||
                    recolorLabel.isPending
                  }
                  onAddLabel={(label, color) =>
                    addLabel.mutate({ app, name: label, color })
                  }
                  onRemoveLabel={(label) =>
                    updateLabels(app, (labels) =>
                      removeAppLabel(labels, label),
                    )
                  }
                  onRecolorLabel={(label, color) =>
                    recolorLabel.mutate({ name: label, color })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
