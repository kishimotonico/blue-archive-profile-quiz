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
  // variant切り替え時（AnswerInputの空/入力あり）にも滑らかに色が変わるよう、
  // 既存のfilter/transform/box-shadowと同じ任意値リストにcolor系プロパティも足す
  // （transition-colorsを別クラスで足すとtransition-propertyが競合するため）
  const baseClasses =
    "inline-flex items-center justify-center font-display font-black rounded-lg shadow-sm transition-[filter,transform,box-shadow,background-color,border-color,color] duration-150 active:translate-y-0.5 active:shadow-none hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue focus-visible:ring-offset-1";

  const variantClasses = {
    // 白文字のコントラストを保つためグラデ両端の明度差が小さく、グラデに見えないため、
    // 文字が載らない上端にのみ ba-cyan の細いハイライト線を足して光沢感を出す。
    // box-shadow は1プロパティなので base の shadow-sm/active:shadow-none と共存できるよう、
    // 通常時の外側影とinsetハイライトを1つの任意値にまとめ、`!`（important）で明示的に上書きする。
    primary:
      "bg-linear-to-b from-ba-blue-light to-ba-blue text-white shadow-[inset_0_1px_0_0_rgb(71_197_251_/_0.9),0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)]! active:shadow-none!",
    secondary: "bg-white text-ba-navy border-2 border-ba-border shadow-none hover:bg-ba-bg",
    accent: "bg-linear-to-b from-yellow-100 to-ba-yellow text-ba-navy",
  };

  const sizeClasses = {
    sm: "min-h-11 py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button ref={ref} className={combinedClasses} {...props}>
      {children}
    </button>
  );
}

export default Button;
