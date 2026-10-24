import Link from "next/link";

/** Wordmark: a black "card" with č (the red háček is the only colour on the site). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--fg)" />
      <path d="M11.2 7.8l4.8 3.4 4.8-3.4" fill="none" stroke="var(--brand-red)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21.6 22.6a7.6 7.6 0 0 1-5.1 1.9c-4.4 0-7.4-3-7.4-7s3-7 7.4-7c2 0 3.8.7 5.1 1.9"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Czech Pexeso — home">
      <LogoMark />
      <span className="text-[1.05rem]">
        czech<span className="text-muted">pexeso</span>
      </span>
    </Link>
  );
}
