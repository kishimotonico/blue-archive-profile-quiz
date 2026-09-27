import { type ButtonHTMLAttributes, type Ref } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
}

function Button({
  ref,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  // transition-colors を別クラスで足すと transition-property が上書きし合うため、色も同じリストに含める
  const baseClasses =
    "inline-flex items-center justify-center font-display font-black rounded-lg shadow-sm transition-[filter,transform,box-shadow,background-color,border-color,color] duration-150 active:translate-y-0.5 active:shadow-none hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue focus-visible:ring-offset-1";

  const variantClasses = {
    // box-shadow は1つのプロパティで base の shadow-sm と上書きし合うため、外側の影もまとめて important で指定する。
    // 立体感は下端の内側影で出す。影の色は地の色のトークンから導出し、地の色を変えても追従させる
    primary:
      "bg-ba-sky text-white shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-blue)_55%,transparent),0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)]! active:shadow-none!",
    secondary: "bg-white text-ba-navy border-2 border-ba-border shadow-none hover:bg-ba-bg",
    accent:
      "bg-linear-to-b from-yellow-100 to-ba-yellow text-ba-navy shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-yellow)_50%,black),0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)]! active:shadow-none!",
  };

  // 文字サイズは variant ではなく size にだけ紐づける。同じボタンが状態（回答欄の入力有無など）で
  // primary/secondary/accent を切り替えるとき、文字サイズが variant で変わるとボタンの高さが跳ねるため。
  // primary（sky地に白文字）が19px以上の太字を要件とするので、他の variant も含めてこの基準に揃える
  const sizeClasses = {
    sm: "min-h-11 py-2 px-4 text-[19px]",
    md: "py-3 px-6 text-xl",
    lg: "py-4 px-8 text-2xl",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button ref={ref} className={combinedClasses} {...props}>
      {children}
    </button>
  );
}

export default Button;
