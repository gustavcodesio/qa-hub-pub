import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    appId: z.string(),
    name: z.string(),
    slug: z.string(),
    folder: z.string(),
    copyCommon: z.boolean(),
    title: z.string().min(1, "Informe o título da tela"),
    route: z.string(),
    kind: z.enum(["common", "specific"]),
    stories: z
      .array(
        z.object({
          code: z.string().min(1, "Código"),
          text: z.string().min(1, "Texto"),
        }),
      )
      .min(1, "Adicione ao menos uma história"),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "new") {
      if (!values.name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o nome",
          path: ["name"],
        });
      }
      if (!values.slug.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o slug",
          path: ["slug"],
        });
      }
    }
    if (values.mode === "existing" && !values.appId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um app",
        path: ["appId"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export function CadastrarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["apps"], queryFn: api.listApps });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "existing",
      appId: "gratos",
      name: "",
      slug: "",
      folder: "",
      copyCommon: true,
      title: "",
      route: "",
      kind: "specific",
      stories: [{ code: "", text: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stories",
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let appId = values.appId;
      if (values.mode === "new") {
        const created = await api.createApp({
          name: values.name,
          slug: values.slug,
          folder: values.folder,
          copyCommon: values.copyCommon,
        });
        appId = created.id;
      }
      if (!appId) throw new Error("Selecione ou crie um app.");
      await api.createSection(appId, {
        title: values.title,
        route: values.route,
        kind: values.kind,
        stories: values.stories,
      });
      return appId;
    },
    onSuccess: async (appId) => {
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
      await queryClient.invalidateQueries({ queryKey: ["app", appId] });
      navigate(`/apps/${appId}`);
    },
  });

  const mode = form.watch("mode");
  const apps = data?.apps ?? [];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Cadastrar section</h1>
      <p className="mb-8 text-muted">
        Escolha o app, a tela e as histórias. Telas comuns ficam com título
        laranja.
      </p>

      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="existing" {...form.register("mode")} />
            App existente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="new" {...form.register("mode")} />
            Novo app
          </label>
        </div>

        {mode === "existing" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="appId">App</Label>
            <select
              id="appId"
              className="h-9 rounded-md border border-border bg-card px-3 text-sm"
              {...form.register("appId")}
            >
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="flowy" {...form.register("slug")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="folder">Pasta</Label>
              <Input
                id="folder"
                placeholder="flowy-app"
                {...form.register("folder")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("copyCommon")} />
              Copiar telas comuns (Login, Cadastro, Paywall, Perfil)
            </label>
          </div>
        )}

        <hr className="border-border" />

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Título da tela</Label>
          <Input id="title" placeholder="Humor" {...form.register("title")} />
          {form.formState.errors.title ? (
            <p className="text-xs text-danger">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="route">Rota</Label>
          <Input id="route" placeholder="/humor" {...form.register("route")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="kind">Tipo</Label>
          <select
            id="kind"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            {...form.register("kind")}
          >
            <option value="specific">Específica deste app</option>
            <option value="common">Comum (título laranja)</option>
          </select>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>Histórias</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ code: "", text: "" })}
            >
              Adicionar história
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  className="w-24"
                  placeholder="HU1"
                  {...form.register(`stories.${index}.code`)}
                />
                <Textarea
                  className="min-h-16 flex-1"
                  placeholder="O usuário deve conseguir…"
                  {...form.register(`stories.${index}.text`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        {mutation.error instanceof Error ? (
          <p className="text-sm text-danger">{mutation.error.message}</p>
        ) : null}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar section"}
        </Button>
      </form>
    </div>
  );
}
