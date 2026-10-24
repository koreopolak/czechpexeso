import { Icon } from "@/components/icons";

/** 0–3 stars. `animate` pops them in one by one (win screen). */
export function Stars({ value, size = 16, animate = false, label }: { value: number; size?: number; animate?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={label ? "img" : undefined} aria-label={label}>
      {[1, 2, 3].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          filled={i <= value}
          className={`${i <= value ? "text-fg" : "text-line"} ${animate && i <= value ? "star-in" : ""}`}
          style={animate ? { animationDelay: `${200 + i * 180}ms` } : undefined}
          strokeWidth={i <= value ? 1.2 : 1.6}
        />
      ))}
    </span>
  );
}
