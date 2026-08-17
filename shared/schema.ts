import { z } from "zod";
import {
  DEFAULT_LABEL_PLACEMENT,
  mergeLabelCatalog,
  suggestedCatalogLabels,
} from "./app-labels.ts";
import { DEFAULT_LABEL_COLOR, normalizeLabelColor } from "./label-colors.ts";
import { normalizeRequestedAdjustmentsUrl } from "./requested-adjustments.ts";

export const sectionKindSchema = z.enum(["common", "specific"]);
export const storyStatusSchema = z.enum(["pending", "passed", "failed"]);
export const platformSchema = z.enum(["ios", "android"]);
export const mediaKindSchema = z.enum(["image", "video"]);
export const listStateSchema = z.enum(["empty", "filled"]);
export const labelColorSchema = z.string().transform(normalizeLabelColor);

export const labelPlacementSchema = z.enum(["header", "footer"]);

export const catalogLabelSchema = z.object({
  name: z.string().min(1),
  color: labelColorSchema.default(DEFAULT_LABEL_COLOR),
  placement: labelPlacementSchema.default(DEFAULT_LABEL_PLACEMENT),
});

const catalogLabelInputSchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    color: labelColorSchema.optional(),
    placement: labelPlacementSchema.optional(),
  }),
]);

export const appSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  folder: z.string().default(""),
  figmaUrl: z.string().default(""),
  iosTestUrl: z.string().default(""),
  androidTestUrl: z.string().default(""),
  notes: z.string().default(""),
  requestedAdjustments: z
    .union([z.string(), z.array(z.string())])
    .default("")
    .transform(normalizeRequestedAdjustmentsUrl),
  labels: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export const sectionSchema = z.object({
  id: z.string(),
  appId: z.string(),
  title: z.string().min(1),
  route: z.string().default(""),
  kind: sectionKindSchema,
  order: z.number().int(),
});

export const storySchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  code: z.string().min(1),
  text: z.string().min(1),
  status: storyStatusSchema,
  notes: z.string().default(""),
});

export const comparisonSchema = z.object({
  id: z.string(),
  appId: z.string(),
  sectionId: z.string().nullable(),
  platform: platformSchema,
  appImage: z.string().default(""),
  figmaImage: z.string(),
  listState: listStateSchema.nullable().default(null),
  drawerLabel: z.string().nullable().default(null),
});

export const recordingSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  kind: mediaKindSchema,
  url: z.string(),
  originalName: z.string(),
});

export const dbSchema = z.object({
  apps: z.array(appSchema),
  sections: z.array(sectionSchema),
  stories: z.array(storySchema),
  comparisons: z.array(comparisonSchema),
  recordings: z.array(recordingSchema),
  labelCatalog: z
    .array(catalogLabelInputSchema)
    .default(suggestedCatalogLabels())
    .transform((items) =>
      mergeLabelCatalog(
        items.map((item) =>
          typeof item === "string"
            ? {
                name: item,
                color: DEFAULT_LABEL_COLOR,
                placement: DEFAULT_LABEL_PLACEMENT,
              }
            : {
                name: item.name,
                color: normalizeLabelColor(item.color),
                placement: item.placement ?? DEFAULT_LABEL_PLACEMENT,
              },
        ),
        [],
      ),
    ),
});

export const createAppBodySchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  slug: z.string().min(1, "Informe o slug"),
  folder: z.string().optional().default(""),
  figmaUrl: z.string().optional().default(""),
  iosTestUrl: z.string().optional().default(""),
  androidTestUrl: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  requestedAdjustments: z.string().optional().default(""),
  copyCommon: z.boolean().optional().default(false),
});

export const patchAppBodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  folder: z.string().optional(),
  figmaUrl: z.string().optional(),
  iosTestUrl: z.string().optional(),
  androidTestUrl: z.string().optional(),
  notes: z.string().optional(),
  requestedAdjustments: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const storyInputSchema = z.object({
  code: z.string().min(1, "Informe o código"),
  text: z.string().min(1, "Informe a história"),
});

export const createSectionBodySchema = z.object({
  title: z.string().min(1, "Informe o título"),
  route: z.string().optional().default(""),
  kind: sectionKindSchema.default("specific"),
  stories: z.array(storyInputSchema).default([]),
});

export const patchSectionBodySchema = z.object({
  title: z.string().min(1).optional(),
  route: z.string().optional(),
  kind: sectionKindSchema.optional(),
  order: z.number().int().optional(),
});

export const patchStoryBodySchema = z.object({
  code: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  status: storyStatusSchema.optional(),
  notes: z.string().optional(),
});

export const createStoriesBodySchema = z.object({
  stories: z.array(storyInputSchema).min(1),
});

export const createComparisonBodySchema = z.object({
  platform: platformSchema.default("ios"),
  sectionId: z.string().nullable().optional(),
  listState: listStateSchema.nullable().optional().default(null),
  drawerLabel: z.string().nullable().optional().default(null),
});

export const patchComparisonBodySchema = z.object({
  listState: listStateSchema.nullable().optional(),
  drawerLabel: z.string().nullable().optional(),
});

export const createLabelBodySchema = z.object({
  name: z.string().min(1, "Informe o nome da label"),
  color: labelColorSchema.optional(),
  placement: labelPlacementSchema.optional(),
});

export const patchLabelBodySchema = z
  .object({
    from: z.string().min(1, "Informe a label atual"),
    to: z.string().min(1).optional(),
    color: labelColorSchema.optional(),
    placement: labelPlacementSchema.optional(),
  })
  .refine(
    (body) =>
      body.to !== undefined ||
      body.color !== undefined ||
      body.placement !== undefined,
    {
      message: "Informe o novo nome, a cor ou a posição.",
    },
  );

export type CatalogLabel = z.infer<typeof catalogLabelSchema>;
export type LabelPlacement = z.infer<typeof labelPlacementSchema>;
export type LabelColor = z.infer<typeof labelColorSchema>;
export type App = z.infer<typeof appSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Story = z.infer<typeof storySchema>;
export type Comparison = z.infer<typeof comparisonSchema>;
export type Recording = z.infer<typeof recordingSchema>;
export type Db = z.infer<typeof dbSchema>;
export type StoryStatus = z.infer<typeof storyStatusSchema>;
export type SectionKind = z.infer<typeof sectionKindSchema>;
export type ListState = z.infer<typeof listStateSchema>;

export const emptyDb = (): Db => ({
  apps: [],
  sections: [],
  stories: [],
  comparisons: [],
  recordings: [],
  labelCatalog: suggestedCatalogLabels(),
});
