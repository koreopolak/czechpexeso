import Link from "next/link";
import { Icon } from "@/components/icons";

/**
 * Soft paywall shown instead of locked content. Explains what Premium adds
 * and offers a way back to free content — never a dead end.
 */
export function Paywall({
  icon = "lock",
  title,
  text,
  cta,
  back,
}: {
  icon?: string;
  title: string;
  text: string;
  cta: string;
  back: string;
}) {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-invert text-invert-fg">
          <Icon name={icon} size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">{text}</p>

        <div className="mt-10 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/pricing" className="btn btn-lg">
            <Icon name="sparkle" size={16} filled strokeWidth={0} />
            {cta}
          </Link>
          <Link href="/play" className="btn btn-lg btn-ghost">
            {back}
          </Link>
        </div>
      </div>
    </div>
  );
}
