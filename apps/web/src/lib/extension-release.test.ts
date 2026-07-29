import { afterEach, describe, expect, it, vi } from "vitest";

import { getLatestExtensionRelease } from "./extension-release.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLatestExtensionRelease", () => {
  it("resolves the packaged zip asset from the latest release", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: "v1.2.3",
          assets: [
            { name: "scs-extension-1.2.3.zip", browser_download_url: "https://example.com/scs-extension-1.2.3.zip" },
            { name: "source.tar.gz", browser_download_url: "https://example.com/source.tar.gz" },
          ],
        }),
      }),
    );

    const release = await getLatestExtensionRelease();

    expect(release).toEqual({
      version: "1.2.3",
      assetName: "scs-extension-1.2.3.zip",
      downloadUrl: "https://example.com/scs-extension-1.2.3.zip",
    });
  });

  it("falls back to null when GitHub returns a non-ok response (e.g. 404 on a private repo)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(getLatestExtensionRelease()).resolves.toBeNull();
  });

  it("falls back to null instead of throwing when the fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(getLatestExtensionRelease()).resolves.toBeNull();
  });

  it("falls back to null when no release asset matches the expected zip naming", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: "v1.2.3", assets: [] }),
      }),
    );

    await expect(getLatestExtensionRelease()).resolves.toBeNull();
  });
});
