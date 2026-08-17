import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Maximize2 } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  Comparison,
  ListState,
  Platform,
  Recording,
  Section,
  Story,
  StoryStatus,
} from "@/lib/types";
import { mergeComparisonFiles } from "@shared/identify-comparison";
import { comparisonCaption } from "@shared/list-state";
import { QaTestLinksSection } from "@/components/app-doc/QaTestLinksSection";
import { RequestedAdjustmentsSection } from "@/components/app-doc/RequestedAdjustmentsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const statusLabel: Record<StoryStatus, string> = {
  pending: "Pendente",
  passed: "Passou",
  failed: "Falhou",
};

export function AppDocPage() {
  const { appId = "" } = useParams();
  const { pathname } = useLocation();
  const isEditing = pathname.endsWith("/editar");
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", appId],
    queryFn: () => api.getApp(appId),
    enabled: Boolean(appId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["app", appId] });

  const patchStory = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StoryStatus }) =>
      api.patchStory(id, { status }),
    onSuccess: invalidate,
  });

  const saveFigma = useMutation({
    mutationFn: (figmaUrl: string) => api.patchApp(appId, { figmaUrl }),
    onSuccess: invalidate,
  });

  const saveIosTest = useMutation({
    mutationFn: (iosTestUrl: string) => api.patchApp(appId, { iosTestUrl }),
    onSuccess: invalidate,
  });

  const saveAndroidTest = useMutation({
    mutationFn: (androidTestUrl: string) =>
      api.patchApp(appId, { androidTestUrl }),
    onSuccess: invalidate,
  });

  const saveAdjustments = useMutation({
    mutationFn: (requestedAdjustments: string) =>
      api.patchApp(appId, { requestedAdjustments }),
    onSuccess: invalidate,
  });

  const addComparison = useMutation({
    mutationFn: (form: FormData) => api.addComparison(appId, form),
    onSuccess: invalidate,
  });

  const removeComparison = useMutation({
    mutationFn: api.deleteComparison,
    onSuccess: invalidate,
  });

  const attachTestflight = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) =>
      api.attachComparisonAppImage(id, form),
    onSuccess: invalidate,
  });

  const attachFigma = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) =>
      api.attachComparisonFigmaImage(id, form),
    onSuccess: invalidate,
  });

  const clearComparisonImage = useMutation({
    mutationFn: ({
      id,
      side,
    }: {
      id: string;
      side: "appImage" | "figmaImage";
    }) => api.clearComparisonImage(id, side),
    onSuccess: invalidate,
  });

  const patchComparison = useMutation({
    mutationFn: ({
      id,
      listState,
      drawerLabel,
    }: {
      id: string;
      listState?: ListState | null;
      drawerLabel?: string | null;
    }) => api.patchComparison(id, { listState, drawerLabel }),
    onSuccess: invalidate,
  });

  const addRecording = useMutation({
    mutationFn: ({ storyId, form }: { storyId: string; form: FormData }) =>
      api.addRecording(storyId, form),
    onSuccess: invalidate,
  });

  const removeRecording = useMutation({
    mutationFn: api.deleteRecording,
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-muted">Carregando…</p>;
  if (error instanceof Error)
    return <p className="text-danger">{error.message}</p>;
  if (!data) return <p className="text-muted">App não encontrado.</p>;

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm text-muted hover:text-foreground">
          ← Apps
        </Link>
        <div className="flex rounded-lg border border-border p-1">
          <Link
            to={`/apps/${appId}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              !isEditing
                ? "bg-accent text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            Visualização
          </Link>
          <Link
            to={`/apps/${appId}/editar`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              isEditing
                ? "bg-accent text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            Editar
          </Link>
        </div>
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">
        [ {data.name} ] Testes mini apps
      </h1>
      {data.folder ? (
        <p className="mt-2 text-sm text-muted">{data.folder}</p>
      ) : null}

      <QaTestLinksSection
        iosUrl={data.iosTestUrl}
        androidUrl={data.androidTestUrl}
        editing={isEditing}
        onSaveIos={(url) => saveIosTest.mutate(url)}
        onSaveAndroid={(url) => saveAndroidTest.mutate(url)}
      />

      <RequestedAdjustmentsSection
        url={data.requestedAdjustments ?? ""}
        editing={isEditing}
        onSave={(url) => saveAdjustments.mutate(url)}
      />

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Sumário</h2>
        <h3 className="mt-4 text-lg font-semibold">Figma:</h3>
        {isEditing ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const input = form.elements.namedItem(
                "figmaUrl",
              ) as HTMLInputElement;
              saveFigma.mutate(input.value);
            }}
          >
            <Input
              name="figmaUrl"
              defaultValue={data.figmaUrl}
              placeholder="https://www.figma.com/design/…"
            />
            <Button type="submit" variant="outline" size="sm">
              Salvar
            </Button>
          </form>
        ) : null}
        {data.figmaUrl ? (
          <FigmaLink url={data.figmaUrl} appName={data.name} />
        ) : (
          <p className="mt-2 text-sm text-muted">Nenhum link cadastrado.</p>
        )}

        <h3 className="mt-8 text-lg font-semibold">Histórias por página</h3>
        <p className="mt-1 text-sm text-muted">
          Clique numa história para ir à evidência do teste.
        </p>
        <div className="mt-6 flex flex-col gap-8">
          {data.sections.map((section) => (
            <SummarySection key={section.id} section={section} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Comparação de design</h2>
        <p className="mt-1 text-muted">
          Dois prints lado a lado: Figma (referência) e TestFlight (app).
        </p>
        {isEditing ? (
          <ComparisonForm
            sections={data.sections}
            pending={addComparison.isPending}
            onSubmit={(form) => addComparison.mutate(form)}
          />
        ) : null}
        {data.comparisons.length === 0 && !isEditing ? (
          <p className="mt-6 text-sm text-muted">
            Nenhuma comparação cadastrada.
          </p>
        ) : null}
        {data.comparisons.length > 0 ? (
          <ComparisonGallery
            comparisons={data.comparisons}
            sections={data.sections}
            isEditing={isEditing}
            attachPending={
              attachTestflight.isPending || attachFigma.isPending
            }
            onRemove={(id) => removeComparison.mutate(id)}
            onAttachTestflight={(id, form) =>
              attachTestflight.mutate({ id, form })
            }
            onAttachFigma={(id, form) => attachFigma.mutate({ id, form })}
            onClearImage={(id, side) =>
              clearComparisonImage.mutate({ id, side })
            }
            onPatchComparison={(id, patch) =>
              patchComparison.mutate({ id, ...patch })
            }
          />
        ) : null}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">
          Histórias de usuário evidência
        </h2>
        <p className="mt-2 text-sm text-muted">
          Teste cada história e anexe print ou vídeo do resultado.
        </p>
        <p className="mt-2 text-sm text-orange-common">
          (obs, telas com título laranja são telas comuns a todos os mini apps,
          com testes semelhantes)
        </p>
        <div className="mt-8 flex flex-col gap-10">
          {data.sections.map((section) => (
            <SectionStories
              key={section.id}
              section={section}
              isEditing={isEditing}
              uploadPending={addRecording.isPending}
              onStatus={(storyId, status) =>
                patchStory.mutate({ id: storyId, status })
              }
              onUpload={(storyId, form) =>
                addRecording.mutate({ storyId, form })
              }
              onRemoveRecording={(id) => removeRecording.mutate(id)}
            />
          ))}
        </div>
      </section>
    </article>
  );
}

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 38 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fill="#1ABCFE"
        d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"
      />
      <path
        fill="#0ACF83"
        d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"
      />
      <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path
        fill="#F24E1E"
        d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"
      />
      <path
        fill="#A259FF"
        d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"
      />
    </svg>
  );
}

function FigmaLink({ url, appName }: { url: string; appName: string }) {
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
    <div className="mt-3 flex max-w-xl flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm text-muted" title={url}>
          {url}
        </p>
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
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium hover:underline"
      >
        <FigmaIcon className="h-4 w-auto shrink-0" />
        {appName}
      </a>
    </div>
  );
}

function SummarySection({ section }: { section: Section }) {
  return (
    <div>
      <h4
        className={cn(
          "font-semibold",
          section.kind === "common" && "text-orange-common",
        )}
      >
        {section.title}
        {section.route ? (
          <span className="font-normal text-muted"> · {section.route}</span>
        ) : null}
      </h4>
      <ul className="mt-2 space-y-1">
        {section.stories.map((story) => (
          <li key={story.id}>
            <a
              href={`#evidencia-${story.id}`}
              className="block rounded-md px-1 py-1 text-sm leading-6 hover:bg-accent"
            >
              <span className="font-semibold">({story.code})</span> {story.text}
              <span
                className={cn(
                  "ml-2 text-xs",
                  story.status === "passed" && "text-success",
                  story.status === "failed" && "text-danger",
                  story.status === "pending" && "text-muted",
                )}
              >
                {statusLabel[story.status]}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionStories({
  section,
  isEditing,
  uploadPending,
  onStatus,
  onUpload,
  onRemoveRecording,
}: {
  section: Section;
  isEditing: boolean;
  uploadPending: boolean;
  onStatus: (storyId: string, status: StoryStatus) => void;
  onUpload: (storyId: string, form: FormData) => void;
  onRemoveRecording: (id: string) => void;
}) {
  return (
    <div>
      <h3
        className={cn(
          "sticky top-0 z-10 bg-background py-2 text-xl font-semibold",
          section.kind === "common" && "text-orange-common",
        )}
      >
        {section.title}
      </h3>
      <ul className="space-y-3">
        {section.stories.map((story) => (
          <li
            key={story.id}
            id={`evidencia-${story.id}`}
            className="scroll-mt-14 rounded-lg border border-border p-3"
          >
            <p className="text-sm leading-6">
              <span className="font-semibold">({story.code})</span> {story.text}
            </p>
            {isEditing ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(["pending", "passed", "failed"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={story.status === status ? "default" : "outline"}
                    onClick={() => onStatus(story.id, status)}
                  >
                    {statusLabel[status]}
                  </Button>
                ))}
              </div>
            ) : (
              <p
                className={cn(
                  "mt-2 text-xs",
                  story.status === "passed" && "text-success",
                  story.status === "failed" && "text-danger",
                  story.status === "pending" && "text-muted",
                )}
              >
                {statusLabel[story.status]}
              </p>
            )}
            <StoryMedia
              story={story}
              isEditing={isEditing}
              pending={uploadPending}
              onUpload={(form) => onUpload(story.id, form)}
              onRemove={onRemoveRecording}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonGallery({
  comparisons,
  sections,
  isEditing,
  attachPending,
  onRemove,
  onAttachTestflight,
  onAttachFigma,
  onClearImage,
  onPatchComparison,
}: {
  comparisons: Comparison[];
  sections: Section[];
  isEditing: boolean;
  attachPending: boolean;
  onRemove: (id: string) => void;
  onAttachTestflight: (id: string, form: FormData) => void;
  onAttachFigma: (id: string, form: FormData) => void;
  onClearImage: (id: string, side: "appImage" | "figmaImage") => void;
  onPatchComparison: (
    id: string,
    patch: { listState?: ListState | null; drawerLabel?: string | null },
  ) => void;
}) {
  const hasIos = comparisons.some((item) => item.platform === "ios");
  const [platform, setPlatform] = useState<Platform>(hasIos ? "ios" : "android");
  const visible = comparisons.filter((item) => item.platform === platform);

  return (
    <div className="mt-6">
      <div className="flex w-fit rounded-lg border border-border p-1">
        {(["ios", "android"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPlatform(tab)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              platform === tab
                ? "bg-accent text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab === "ios" ? "iOS" : "Android"}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nenhuma comparação nesta plataforma.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {visible.map((item) => {
            const sectionTitle = sections.find(
              (section) => section.id === item.sectionId,
            )?.title;
            return (
              <div key={item.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {comparisonCaption(
                      sectionTitle,
                      item.listState,
                      item.drawerLabel,
                    )}
                  </p>
                  {isEditing ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <select
                        className="h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={item.listState ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          onPatchComparison(item.id, {
                            listState:
                              value === "empty" || value === "filled"
                                ? value
                                : null,
                          });
                        }}
                      >
                        <option value="">Não se aplica</option>
                        <option value="empty">Lista vazia</option>
                        <option value="filled">Com itens</option>
                      </select>
                      <Input
                        className="h-8 w-40 text-xs"
                        defaultValue={item.drawerLabel ?? ""}
                        placeholder="Drawer"
                        aria-label="Drawer"
                        onBlur={(event) => {
                          const next = event.target.value.trim() || null;
                          if (next === (item.drawerLabel ?? null)) return;
                          onPatchComparison(item.id, { drawerLabel: next });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.id)}
                      >
                        Remover comparação
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <figure className="min-w-0 flex-1">
                    <figcaption className="mb-2 text-center text-sm font-medium">
                      Figma
                    </figcaption>
                    <div className="flex h-[min(70vh,680px)] items-center justify-center overflow-hidden rounded-lg border border-border bg-black">
                      {item.figmaImage ? (
                        <img
                          src={item.figmaImage}
                          alt="Print do Figma"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <p className="text-sm font-medium tracking-wide text-muted">
                          Coming soon
                        </p>
                      )}
                    </div>
                    {isEditing && item.figmaImage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => onClearImage(item.id, "figmaImage")}
                      >
                        Remover
                      </Button>
                    ) : null}
                    {isEditing && !item.figmaImage ? (
                      <AttachImageForm
                        pending={attachPending}
                        submitLabel="Enviar Figma"
                        onSubmit={(form) => onAttachFigma(item.id, form)}
                      />
                    ) : null}
                  </figure>
                  <p className="shrink-0 self-center text-center text-lg font-bold tracking-[0.2em] text-muted sm:pt-6">
                    VS
                  </p>
                  <figure className="min-w-0 flex-1">
                    <figcaption className="mb-2 text-center text-sm font-medium">
                      TestFlight
                    </figcaption>
                    <div className="flex h-[min(70vh,680px)] items-center justify-center overflow-hidden rounded-lg border border-border bg-black">
                      {item.appImage ? (
                        <img
                          src={item.appImage}
                          alt="Print do TestFlight"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <p className="text-sm font-medium tracking-wide text-muted">
                          Coming soon
                        </p>
                      )}
                    </div>
                    {isEditing && item.appImage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => onClearImage(item.id, "appImage")}
                      >
                        Remover
                      </Button>
                    ) : null}
                    {isEditing && !item.appImage ? (
                      <AttachImageForm
                        pending={attachPending}
                        submitLabel="Enviar TestFlight"
                        onSubmit={(form) => onAttachTestflight(item.id, form)}
                      />
                    ) : null}
                  </figure>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttachImageForm({
  pending,
  submitLabel,
  onSubmit,
}: {
  pending: boolean;
  submitLabel: string;
  onSubmit: (form: FormData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const input = inputRef.current;
        if (!input?.files?.[0]) return;
        const form = new FormData();
        form.append("file", input.files[0]);
        onSubmit(form);
        input.value = "";
      }}
    >
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="max-w-xs text-xs"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Enviando…" : submitLabel}
      </Button>
    </form>
  );
}

function ComparisonForm({
  sections,
  pending,
  onSubmit,
}: {
  sections: Section[];
  pending: boolean;
  onSubmit: (form: FormData) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pairError, setPairError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{
    figma: File | null;
    testflight: File | null;
  }>({ figma: null, testflight: null });

  const ready = Boolean(picked.figma && picked.testflight);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPairError(null);
    try {
      setPicked((current) => mergeComparisonFiles(current, Array.from(files)));
    } catch (err) {
      setPairError(
        err instanceof Error ? err.message : "Não identifiquei o print.",
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picked.figma || !picked.testflight) {
      setPairError(
        "Faltou um print. Adicione Figma e TestFlight (um de cada vez ou os dois juntos).",
      );
      return;
    }
    const formEl = event.currentTarget;
    const form = new FormData();
    form.append("platform", String(new FormData(formEl).get("platform") ?? "ios"));
    form.append("sectionId", String(new FormData(formEl).get("sectionId") ?? ""));
    form.append("listState", String(new FormData(formEl).get("listState") ?? ""));
    form.append(
      "drawerLabel",
      String(new FormData(formEl).get("drawerLabel") ?? ""),
    );
    form.append("figmaImage", picked.figma);
    form.append("appImage", picked.testflight);
    onSubmit(form);
    formEl.reset();
    setPicked({ figma: null, testflight: null });
    setPairError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form
      className="mt-6 grid gap-3 rounded-lg border border-border p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label>Plataforma</Label>
          <select
            name="platform"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            defaultValue="ios"
          >
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Tela (opcional)</Label>
          <select
            name="sectionId"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="">Geral</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Estado da lista</Label>
          <select
            name="listState"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            defaultValue=""
          >
            <option value="">Não se aplica</option>
            <option value="empty">Lista vazia</option>
            <option value="filled">Com itens</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Drawer</Label>
          <Input
            name="drawerLabel"
            placeholder="Bruxismo, adicionar produto…"
            className="h-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Prints</Label>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => addFiles(event.target.files)}
        />
        <p className="text-xs text-muted">
          Pode mandar um, depois o outro, ou os dois de uma vez. TestFlight =
          Whats… · Figma = Captura de tela…
        </p>
      </div>
      <div className="grid gap-1 text-xs">
        <p>
          Figma:{" "}
          <span className="text-muted">
            {picked.figma?.name ?? "ainda não adicionado"}
          </span>
        </p>
        <p>
          TestFlight:{" "}
          <span className="text-muted">
            {picked.testflight?.name ?? "ainda não adicionado"}
          </span>
        </p>
      </div>
      {pairError ? <p className="text-sm text-danger">{pairError}</p> : null}
      <Button type="submit" disabled={pending || !ready} className="w-fit">
        {pending ? "Enviando…" : "Salvar comparação"}
      </Button>
    </form>
  );
}

function StoryMedia({
  story,
  isEditing,
  pending,
  onUpload,
  onRemove,
}: {
  story: Story;
  isEditing: boolean;
  pending: boolean;
  onUpload: (form: FormData) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMedia = story.recordings.length > 0;

  if (!isEditing && !hasMedia) return null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      {isEditing && !hasMedia ? (
        <p className="mb-2 text-xs text-muted">Print ou vídeo desta história</p>
      ) : null}
      {story.recordings.map((recording) => (
        <RecordingPreview
          key={recording.id}
          recording={recording}
          isEditing={isEditing}
          onRemove={onRemove}
        />
      ))}
      {isEditing ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const input = inputRef.current;
            if (!input?.files?.[0]) return;
            const form = new FormData();
            form.append("file", input.files[0]);
            onUpload(form);
            input.value = "";
          }}
        >
          <Input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="max-w-xs"
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Enviar
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function RecordingPreview({
  recording,
  isEditing,
  onRemove,
}: {
  recording: Recording;
  isEditing: boolean;
  onRemove: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function openFullscreen() {
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    try {
      if (wrapRef.current?.requestFullscreen) {
        await wrapRef.current.requestFullscreen();
        return;
      }
      video?.webkitEnterFullscreen?.();
    } catch {
      video?.webkitEnterFullscreen?.();
    }
  }

  const mediaClassName =
    "max-h-[min(38vh,18rem)] w-auto max-w-full rounded-lg border border-border bg-black object-contain";

  return (
    <div className="mb-2">
      <div ref={wrapRef} className="story-media-fs inline-block max-w-full">
        {recording.kind === "video" ? (
          <video
            ref={videoRef}
            src={recording.url}
            controls
            className={mediaClassName}
          />
        ) : (
          <img
            src={recording.url}
            alt={recording.originalName}
            className={mediaClassName}
          />
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Button variant="ghost" size="sm" onClick={openFullscreen}>
          <Maximize2 className="size-3.5" />
          Tela cheia
        </Button>
        {isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(recording.id)}
          >
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
