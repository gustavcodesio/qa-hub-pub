export type StoryStatus = "pending" | "passed" | "failed";
export type SectionKind = "common" | "specific";
export type Platform = "ios" | "android";
export type ListState = "empty" | "filled";
export type LabelColor = string;
export type LabelPlacement = "header" | "footer";

export type Recording = {
  id: string;
  storyId: string;
  kind: "image" | "video";
  url: string;
  originalName: string;
};

export type Story = {
  id: string;
  sectionId: string;
  code: string;
  text: string;
  status: StoryStatus;
  notes: string;
  recordings: Recording[];
};

export type Section = {
  id: string;
  appId: string;
  title: string;
  route: string;
  kind: SectionKind;
  order: number;
  stories: Story[];
};

export type Comparison = {
  id: string;
  appId: string;
  sectionId: string | null;
  platform: Platform;
  appImage: string;
  figmaImage: string;
  listState: ListState | null;
  drawerLabel: string | null;
};

export type AppSummary = {
  id: string;
  name: string;
  slug: string;
  folder: string;
  figmaUrl: string;
  iosTestUrl: string;
  androidTestUrl: string;
  notes: string;
  requestedAdjustments: string;
  labels: string[];
  createdAt: string;
  sectionCount: number;
  storyCount: number;
  passedCount: number;
  iosPhotoCount: number;
  hasIosPhotos: boolean;
  iconUrl: string | null;
};

export type LabelSummary = {
  name: string;
  color: LabelColor;
  placement: LabelPlacement;
  appCount: number;
  appIds: string[];
};

export type AppDocument = {
  id: string;
  name: string;
  slug: string;
  folder: string;
  figmaUrl: string;
  iosTestUrl: string;
  androidTestUrl: string;
  notes: string;
  requestedAdjustments: string;
  labels: string[];
  createdAt: string;
  sections: Section[];
  comparisons: Comparison[];
};
