import { ImageResponse } from "next/og";

export const alt = "Czech Pexeso — learn Czech words with a memory game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview image, rendered at build time. */
export default function OpengraphImage() {
  const cards: { text: string; dark: boolean }[] = [
    { text: "pes", dark: true },
    { text: "", dark: false },
    { text: "dog", dark: false },
    { text: "", dark: false },
    { text: "voda", dark: true },
    { text: "", dark: false },
    { text: "", dark: false },
    { text: "water", dark: false },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="64" height="64" viewBox="0 0 32 32">
              <rect x="1" y="1" width="30" height="30" rx="8" fill="#0a0a0a" />
              <path d="M11.2 7.8l4.8 3.4 4.8-3.4" fill="none" stroke="#d7141a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21.6 22.6a7.6 7.6 0 0 1-5.1 1.9c-4.4 0-7.4-3-7.4-7s3-7 7.4-7c2 0 3.8.7 5.1 1.9" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#0a0a0a" }}>czechpexeso.net</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, color: "#0a0a0a", letterSpacing: -2 }}>Learn Czech, one pair at a time.</span>
            <span style={{ fontSize: 30, color: "#6b6b6b", marginTop: 24 }}>A memory game · from EN, UA, RU or PL</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, width: 420, marginLeft: "auto", alignContent: "center" }}>
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                width: 190,
                height: 104,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 700,
                background: c.dark ? "#0a0a0a" : c.text ? "#ffffff" : "#f0f0ee",
                color: c.dark ? "#ffffff" : "#0a0a0a",
                border: "3px solid #0a0a0a",
              }}
            >
              {c.text}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
