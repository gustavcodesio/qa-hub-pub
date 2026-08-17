import { describe, expect, it } from "vitest";
import {
  countIosAppPhotos,
  hasIosPhotosReady,
  IOS_PHOTOS_READY_THRESHOLD,
} from "./ios-photos.ts";

describe("fotos iOS", () => {
  it("ignora Android e prints vazios", () => {
    expect(
      countIosAppPhotos([
        { platform: "ios", appImage: "/uploads/a.png" },
        { platform: "ios", appImage: "  " },
        { platform: "ios", appImage: "" },
        { platform: "android", appImage: "/uploads/b.png" },
      ]),
    ).toBe(1);
  });

  it("considera pronto a partir de 3 fotos iOS", () => {
    expect(IOS_PHOTOS_READY_THRESHOLD).toBe(3);
    expect(hasIosPhotosReady(2)).toBe(false);
    expect(hasIosPhotosReady(3)).toBe(true);
    expect(hasIosPhotosReady(4)).toBe(true);
  });
});
