import { ExternalLink } from "lucide-react";

type CatalogAdjustmentsLinkProps = {
  url: string;
};

export function CatalogAdjustmentsLink({ url }: CatalogAdjustmentsLinkProps) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="truncate">Ajustes requisitados</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
