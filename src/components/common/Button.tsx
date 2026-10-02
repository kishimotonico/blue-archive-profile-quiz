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
    "inline-flex items-center justify-center font-sans font-bold rounded-lg shadow-sm transition-[filter,transform,box-shadow,background-color,border-color,color] duration-150 active:translate-y-0.5 active:shadow-none hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2";

  // secondary だけ border-2 で枠を見せ、primary/accent は同じ太さの透明枠を敷いて高さを揃える。
  // ボタンは同じ位置で variant が切り替わる（回答欄の入力有無など）ため、枠の有無で高さが変わると
  // 隣接する立ち絵エリアなどのレイアウトまでずれる
  // フォーカス枠の色と offset は variant ごとに持つ。base と variant で同じユーティリティを重ねると、
  // Tailwind はクラスの並びではなく CSS の生成順で勝つため、意図した方が効かなくなる。
  // accent は黄色の地に青い枠が浮いて見えるため、文字と同じ紺にして白いすき間で地から離す
  const variantClasses = {
    // box-shadow は1つのプロパティで base の shadow-sm と上書きし合うため、外側の影もまとめて important で指定する。
    // 立体感は下端の内側影で出す。影の色は地の色のトークンから導出し、地の色を変えても追従させる。
    // 地は ba-blue-light（白文字比4.5:1）。ba-sky は3.48:1のため通常サイズの太字文字には使えない
    primary:
      "border-2 border-transparent bg-ba-blue-light text-white shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-blue)_55%,transparent),0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)]! active:shadow-none! focus-visible:ring-ba-blue focus-visible:ring-offset-1",
    secondary:
      "bg-white text-ba-navy border-2 border-ba-border shadow-none hover:bg-ba-bg focus-visible:ring-ba-blue focus-visible:ring-offset-1",
    accent:
      "border-2 border-transparent bg-linear-to-b from-yellow-100 to-ba-yellow text-ba-navy shadow-[inset_0_-3px_0_0_color-mix(in_srgb,var(--color-ba-yellow)_50%,black),0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)]! active:shadow-none! focus-visible:ring-ba-navy focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  };

  // 文字サイズは variant ではなく size にだけ紐づける。同じボタンが状態（回答欄の入力有無など）で
  // primary/secondary/accent を切り替えるとき、文字サイズが variant で変わるとボタンの高さが跳ねるため
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
