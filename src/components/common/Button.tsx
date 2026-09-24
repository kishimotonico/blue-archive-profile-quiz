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
  const baseClasses =
    "inline-flex items-center justify-center font-display font-black rounded-lg shadow-sm transition-[filter,transform,box-shadow] duration-150 active:translate-y-0.5 active:shadow-none hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue focus-visible:ring-offset-1";

  const variantClasses = {
    primary: "bg-linear-to-b from-ba-cyan to-ba-blue text-white",
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
