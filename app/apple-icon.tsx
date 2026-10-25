import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path d="M12.4 6.4l3.6 2.8 3.6-2.8" fill="none" stroke="#d7141a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 15.2A6 6 0 1 0 21 24.2" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
