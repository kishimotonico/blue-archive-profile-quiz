import type { ButtonHTMLAttributes, Ref } from "react";

const VARIANT_CLASSES = {
  primary:
    "border-transparent bg-ba-blue-light text-white shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-blue)_55%,transparent),0_1px_3px_0_rgb(0_0_0_/_0.1)] focus-visible:ring-ba-blue focus-visible:ring-offset-1",
  secondary:
    "border-ba-border bg-white text-ba-navy hover:bg-ba-bg focus-visible:ring-ba-blue focus-visible:ring-offset-1",
  // 黄色の地に青いフォーカス枠は浮いて見えるため、文字と同じ紺にする
  accent:
    "border-transparent bg-linear-to-b from-yellow-100 to-ba-yellow text-ba-navy shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-yellow)_50%,black),0_1px_3px_0_rgb(0_0_0_/_0.1)] focus-visible:ring-ba-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: keyof typeof VARIANT_CLASSES;
}

// 枠線は透明でも全 variant で border-2 にそろえる。同じ位置で variant が切り替わる（回答欄の入力有無など）ので、
// 枠の有無で高さがずれないようにするため
function Button({
  ref,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center rounded-lg border-2 px-6 py-3 font-sans text-base font-bold transition-[filter,transform,box-shadow,background-color,border-color,color] duration-150 hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

export default Button;
