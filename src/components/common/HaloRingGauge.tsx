import { useId, type ReactNode } from "react";

interface HaloRingGaugeProps {
  /** 進捗率（0〜1）。範囲外の値は自動でクランプされる */
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillFrom?: string;
  fillTo?: string;
  /** 指定するとリングが意味のある画像としてスクリーンリーダーに扱われる */
  label?: string;
  className?: string;
  children?: ReactNode;
}

function HaloRingGauge({
  value,
  size = 64,
  strokeWidth = 6,
  trackColor = "rgba(43,58,85,0.12)",
  fillFrom = "var(--color-ba-cyan)",
  fillTo = "var(--color-ba-blue)",
  label,
  className = "",
  children,
}: HaloRingGaugeProps) {
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, value));
  const dashOffset = circumference * (1 - ratio);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fillFrom} />
            <stop offset="100%" stopColor={fillTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="ba-ring-fill"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          {children}
        </div>
      )}
    </div>
  );
}

export default HaloRingGauge;
