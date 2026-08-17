import { useId } from "react";

const BRAND_GRADIENT = ["#ff7a59", "#ff4e6a"];

export function LogoMark({ size = 36, id, ...props }) {
  const uid = useId().replace(/:/g, "");
  const gradientId = id ?? `coral-brand-gradient-${uid}`;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="CoralHR logo"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND_GRADIENT[0]} />
          <stop offset="100%" stopColor={BRAND_GRADIENT[1]} />
        </linearGradient>
      </defs>
      <rect
        x="1" y="1" width="46" height="46" rx="12"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M31.8 16.2a11 11 0 1 0 0 15.6"
        fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round"
      />
      <path
        d="M15 38c2-2.4 4-2.4 6 0s4 2.4 6 0"
        fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = 36, wordmark = true, className = "", ...props }) {
  if (!wordmark) {
    return <LogoMark size={size} />;
  }
  return (
    <span className={`inline-flex items-center gap-3 font-extrabold text-foreground ${className}`} {...props}>
      <LogoMark size={size} />
      <span>CoralHR</span>
    </span>
  );
}
