import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

// The share preview. It uses no request data, so it is rendered once at build
// time. Text is ImageResponse's bundled font; nothing is fetched.
export const alt = `${profile.name}: ${profile.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The dark palette from globals.css.
const dark = { bg: "#0b0b0b", fg: "#ededed", muted: "#9a9a9a" };

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: dark.bg,
        }}
      >
        <div style={{ fontSize: 88, lineHeight: 1.1, letterSpacing: "-0.02em", color: dark.fg }}>
          {profile.name}
        </div>
        <div style={{ marginTop: 28, maxWidth: 900, fontSize: 40, lineHeight: 1.35, color: dark.muted }}>
          {profile.tagline}
        </div>
      </div>
    ),
    size,
  );
}
