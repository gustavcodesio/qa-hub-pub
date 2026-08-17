import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { AppSummary } from "@/lib/types";
import { catalogHasLabel } from "@shared/app-labels";

type LabelAppsPanelProps = {
  label: string | null;
  apps: AppSummary[];
  disabled?: boolean;
  onToggle: (appId: string, enabled: boolean) => void;
};

export function LabelAppsPanel({
  label,
  apps,
  disabled = false,
  onToggle,
}: LabelAppsPanelProps) {
  if (!label) {
    return (
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Apps</h2>
        <p className="text-sm text-muted">
          Selecione uma label à esquerda para marcar os apps.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Apps com “{label}”</h2>
      <p className="mb-4 text-sm text-muted">
        Marque os apps que devem receber esta label.
      </p>
      {apps.length === 0 ? (
        <p className="text-sm text-muted">Nenhum app cadastrado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {apps.map((app) => {
            const checked = catalogHasLabel(app.labels ?? [], label);
            return (
              <li key={app.id} className="flex items-center gap-3">
                <input
                  id={`label-app-${app.id}`}
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  className="size-4 accent-primary"
                  onChange={(event) => onToggle(app.id, event.target.checked)}
                />
                <Link
                  to={`/apps/${app.id}`}
                  className="min-w-0 flex-1 truncate text-sm hover:text-primary"
                >
                  {app.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
