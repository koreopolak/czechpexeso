/**
 * Re-mounted on every navigation (unlike layout.tsx), so each page fades in.
 * See .page-in in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
