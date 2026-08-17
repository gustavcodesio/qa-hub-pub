import { AppDocLinkCard } from "@/components/app-doc/AppDocLinkCard";

type QaTestLinksSectionProps = {
  iosUrl: string;
  androidUrl: string;
  editing: boolean;
  onSaveIos: (url: string) => void;
  onSaveAndroid: (url: string) => void;
};

export function QaTestLinksSection({
  iosUrl,
  androidUrl,
  editing,
  onSaveIos,
  onSaveAndroid,
}: QaTestLinksSectionProps) {
  return (
    <section className="mt-10" id="links-de-teste">
      <h2 className="text-2xl font-semibold">Link de testes do QA</h2>
      <p className="mt-1 text-sm text-muted">
        Instale o build de teste no iPhone ou no Android para validar o app.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <AppDocLinkCard
          title="iOS"
          name="iosTestUrl"
          value={iosUrl}
          placeholder="https://testflight.apple.com/join/…"
          editing={editing}
          openLabel="Abrir link de teste"
          onSave={onSaveIos}
        />
        <AppDocLinkCard
          title="Android"
          name="androidTestUrl"
          value={androidUrl}
          placeholder="https://play.google.com/apps/testing/…"
          editing={editing}
          openLabel="Abrir link de teste"
          onSave={onSaveAndroid}
        />
      </div>
    </section>
  );
}
