import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path d="M11.2 7.8l4.8 3.4 4.8-3.4" fill="none" stroke="#d7141a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21.6 22.6a7.6 7.6 0 0 1-5.1 1.9c-4.4 0-7.4-3-7.4-7s3-7 7.4-7c2 0 3.8.7 5.1 1.9" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
