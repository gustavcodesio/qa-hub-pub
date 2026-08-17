import type {
  AppDocument,
  AppSummary,
  LabelColor,
  LabelPlacement,
  LabelSummary,
  StoryStatus,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Falha na requisição.",
    );
  }
  return data as T;
}

export const api = {
  listApps: () => request<{ apps: AppSummary[] }>("/api/apps"),
  getApp: (id: string) => request<AppDocument>(`/api/apps/${id}`),
  createApp: (body: {
    name: string;
    slug: string;
    folder?: string;
    figmaUrl?: string;
    notes?: string;
    copyCommon?: boolean;
  }) =>
    request<AppDocument>("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  patchApp: (
    id: string,
    body: Partial<{
      figmaUrl: string;
      iosTestUrl: string;
      androidTestUrl: string;
      notes: string;
      requestedAdjustments: string;
      labels: string[];
    }>,
  ) =>
    request<AppDocument>(`/api/apps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  createSection: (
    appId: string,
    body: {
      title: string;
      route?: string;
      kind: "common" | "specific";
      stories: { code: string; text: string }[];
    },
  ) =>
    request<AppDocument>(`/api/apps/${appId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  patchStory: (id: string, body: { status?: StoryStatus; text?: string }) =>
    request<AppDocument>(`/api/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  addComparison: (appId: string, form: FormData) =>
    request<AppDocument>(`/api/apps/${appId}/comparisons`, {
      method: "POST",
      body: form,
    }),
  attachComparisonAppImage: (id: string, form: FormData) =>
    request<AppDocument>(`/api/comparisons/${id}/app-image`, {
      method: "POST",
      body: form,
    }),
  attachComparisonFigmaImage: (id: string, form: FormData) =>
    request<AppDocument>(`/api/comparisons/${id}/figma-image`, {
      method: "POST",
      body: form,
    }),
  clearComparisonImage: (id: string, side: "appImage" | "figmaImage") => {
    const path =
      side === "figmaImage"
        ? `/api/comparisons/${id}/figma-image`
        : `/api/comparisons/${id}/app-image`;
    return request<AppDocument>(path, { method: "DELETE" });
  },
  patchComparison: (
    id: string,
    body: { listState?: "empty" | "filled" | null; drawerLabel?: string | null },
  ) =>
    request<AppDocument>(`/api/comparisons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteComparison: (id: string) =>
    request<AppDocument>(`/api/comparisons/${id}`, { method: "DELETE" }),
  addRecording: (sectionId: string, form: FormData) =>
    request<AppDocument>(`/api/sections/${sectionId}/recordings`, {
      method: "POST",
      body: form,
    }),
  deleteRecording: (id: string) =>
    request<AppDocument>(`/api/recordings/${id}`, { method: "DELETE" }),
  listLabels: () => request<{ labels: LabelSummary[] }>("/api/labels"),
  createLabel: (name: string, color?: LabelColor) =>
    request<{ labels: LabelSummary[] }>("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    }),
  patchLabel: (
    from: string,
    patch: { to?: string; color?: LabelColor; placement?: LabelPlacement },
  ) =>
    request<{ labels: LabelSummary[] }>("/api/labels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...patch }),
    }),
  renameLabel: (from: string, to: string) =>
    request<{ labels: LabelSummary[] }>("/api/labels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    }),
  deleteLabel: (name: string) =>
    request<void>(`/api/labels/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
};
