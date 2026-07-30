import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "../lib/site";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Google Fonts serves woff/ttf (not woff2, which satori can't parse) to older user agents. */
async function loadFont(family: string, weight: number) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36",
      },
    },
  ).then((res) => res.text());
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error(`Could not resolve font URL for ${family}`);
  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

export default async function OpengraphImage() {
  const [serif, sans, sansSemibold] = await Promise.all([
    loadFont("Source Serif 4", 600),
    loadFont("Inter", 400),
    loadFont("Inter", 600),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f5f2ed",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "#1a6b5a",
            }}
          />
          <div
            style={{
              fontFamily: "Source Serif 4",
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontFamily: "Source Serif 4",
            fontSize: "64px",
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "920px",
          }}
        >
          <span style={{ marginRight: "20px" }}>Solve on LeetCode.</span>
          <span style={{ color: "#1a6b5a" }}>[Own it on GitHub.]</span>
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontSize: "28px",
            color: "#6b6560",
            marginTop: "28px",
            maxWidth: "880px",
            lineHeight: 1.4,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Serif 4", data: serif, weight: 600, style: "normal" },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
        { name: "Inter", data: sansSemibold, weight: 600, style: "normal" },
      ],
    },
  );
}
