import { Link } from "react-router-dom";
import { AppCardLabels } from "@/components/catalog/AppCardLabels";
import { AppIcon } from "@/components/catalog/AppIcon";
import { CatalogAdjustmentsLink } from "@/components/catalog/CatalogAdjustmentsLink";
import { Card } from "@/components/ui/card";
import type { AppSummary, LabelColor, LabelSummary } from "@/lib/types";
import { splitLabelsByPlacement } from "@shared/app-labels";

function pagesLabel(count: number) {
  return count === 1 ? "1 página" : `${count} páginas`;
}

type CatalogAppCardProps = {
  app: AppSummary;
  suggestions?: LabelSummary[];
  saving?: boolean;
  onAddLabel: (label: string, color: LabelColor) => void;
  onRemoveLabel: (label: string) => void;
  onRecolorLabel: (label: string, color: LabelColor) => void;
};

export function CatalogAppCard({
  app,
  suggestions = [],
  saving = false,
  onAddLabel,
  onRemoveLabel,
  onRecolorLabel,
}: CatalogAppCardProps) {
  const assigned = app.labels ?? [];
  const { header, footer } = splitLabelsByPlacement(assigned, suggestions);

  return (
    <Card className="flex h-full flex-col gap-4 transition-colors hover:border-primary/50">
      <div className="flex items-start gap-3">
        <Link
          to={`/apps/${app.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <AppIcon
            src={app.iconUrl}
            name={app.name}
            className="size-14 text-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight">
              {app.name}
            </p>
            <p className="mt-1 text-sm text-muted">
              {pagesLabel(app.sectionCount)}
            </p>
          </div>
        </Link>
        {header.length > 0 ? (
          <AppCardLabels
            labels={header}
            catalog={suggestions}
            disabled={saving}
            showAdd={false}
            allowRecolor={false}
            align="end"
            className="max-w-[58%] shrink-0"
            assigned={assigned}
            onAdd={onAddLabel}
            onRemove={onRemoveLabel}
            onRecolor={onRecolorLabel}
          />
        ) : null}
      </div>
      <div className="mt-auto border-t border-border pt-3">
        {app.requestedAdjustments ? (
          <div className="mb-2">
            <CatalogAdjustmentsLink url={app.requestedAdjustments} />
          </div>
        ) : null}
        <AppCardLabels
          labels={footer}
          catalog={suggestions}
          disabled={saving}
          assigned={assigned}
          onAdd={onAddLabel}
          onRemove={onRemoveLabel}
          onRecolor={onRecolorLabel}
        />
      </div>
    </Card>
  );
}
