import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AppDocLinkCardProps = {
  title?: string;
  name: string;
  value: string;
  placeholder: string;
  editing: boolean;
  openLabel: string;
  emptyLabel?: string;
  onSave: (url: string) => void;
};

export function AppDocLinkCard({
  title,
  name,
  value,
  placeholder,
  editing,
  openLabel,
  emptyLabel = "Nenhum link cadastrado.",
  onSave,
}: AppDocLinkCardProps) {
  return (
    <Card>
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      {editing ? (
        <form
          className={title ? "mt-3 flex gap-2" : "flex gap-2"}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem(name) as HTMLInputElement;
            onSave(input.value);
          }}
        >
          <Input name={name} defaultValue={value} placeholder={placeholder} />
          <Button type="submit" variant="outline" size="sm">
            Salvar
          </Button>
        </form>
      ) : null}
      {value ? (
        <ClickableDocLink url={value} openLabel={openLabel} />
      ) : (
        <p className={title || editing ? "mt-3 text-sm text-muted" : "text-sm text-muted"}>
          {emptyLabel}
        </p>
      )}
    </Card>
  );
}

function ClickableDocLink({ url, openLabel }: { url: string; openLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 truncate text-sm font-medium text-primary hover:underline"
        title={url}
      >
        {url}
      </a>
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit text-sm font-medium hover:underline"
        >
          {openLabel}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={copyUrl}
          aria-label={copied ? "URL copiada" : "Copiar URL"}
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
