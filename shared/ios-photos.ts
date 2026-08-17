/** Mínimo de prints iOS (TestFlight) para considerar o app “com fotos”. */
export const IOS_PHOTOS_READY_THRESHOLD = 3;

type ComparisonPhoto = {
  platform: string;
  appImage?: string | null;
};

export function countIosAppPhotos(comparisons: ComparisonPhoto[]): number {
  return comparisons.filter(
    (item) => item.platform === "ios" && Boolean(item.appImage?.trim()),
  ).length;
}

export function hasIosPhotosReady(count: number): boolean {
  return count >= IOS_PHOTOS_READY_THRESHOLD;
}
