import { AppDocLinkCard } from "@/components/app-doc/AppDocLinkCard";

type RequestedAdjustmentsSectionProps = {
  url: string;
  editing: boolean;
  onSave: (url: string) => void;
};

export function RequestedAdjustmentsSection({
  url,
  editing,
  onSave,
}: RequestedAdjustmentsSectionProps) {
  return (
    <section className="mt-10" id="ajustes-requisitados">
      <h2 className="text-2xl font-semibold">Ajustes requisitados</h2>
      <p className="mt-1 text-sm text-muted">
        Link da evidência ou da lista do que o QA pediu para corrigir.
      </p>
      <div className="mt-6">
        <AppDocLinkCard
          name="requestedAdjustments"
          value={url}
          placeholder="https://drive.google.com/file/d/…"
          editing={editing}
          openLabel="Abrir ajustes requisitados"
          emptyLabel="Nenhum link cadastrado."
          onSave={onSave}
        />
      </div>
    </section>
  );
}
