import { type ButtonHTMLAttributes, type Ref } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "success" | "danger" | "accent";
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
  const baseClasses =
    "font-display font-black rounded-lg shadow-sm transition-[filter,transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-none hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100";

  const variantClasses = {
    // シアン光沢グラデーション
    primary: "bg-linear-to-b from-ba-cyan to-ba-blue text-white",
    // 白 + ボーダー
    secondary: "bg-white text-ba-navy border-2 border-ba-border shadow-none hover:bg-ba-bg",
    success: "bg-green-500 hover:bg-green-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    // 黄色（回答する等の重要アクション用）
    accent: "bg-linear-to-b from-yellow-100 to-ba-yellow text-ba-navy",
  };

  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
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
