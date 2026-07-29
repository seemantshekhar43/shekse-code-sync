const REPO = "seemantshekhar43/shekse-code-sync";

export type ExtensionRelease = {
  version: string;
  assetName: string;
  downloadUrl: string;
};

/**
 * Latest packaged extension build off GitHub Releases. Read via the public
 * REST API (no token - the repo is public) so a new release ships without
 * touching the dashboard.
 */
export async function getLatestExtensionRelease(): Promise<ExtensionRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: "application/vnd.github+json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const release = (await res.json()) as {
    tag_name: string;
    assets: { name: string; browser_download_url: string }[];
  };
  const asset = release.assets.find(
    (a) => a.name.startsWith("scs-extension-") && a.name.endsWith(".zip"),
  );
  if (!asset) return null;

  return {
    version: release.tag_name.replace(/^v/, ""),
    assetName: asset.name,
    downloadUrl: asset.browser_download_url,
  };
}

export const EXTENSION_CI_BUILD_URL = `https://github.com/${REPO}/actions/workflows/build-images.yml`;
export const EXTENSION_REPO_URL = `https://github.com/${REPO}`;
