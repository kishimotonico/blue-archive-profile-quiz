import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
      <span
        className={`block w-5 h-0.5 bg-ba-navy transition-all duration-300 ${
          isOpen ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-ba-navy transition-all duration-300 ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-ba-navy transition-all duration-300 ${
          isOpen ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </div>
  );
}

function TitleMark() {
  return (
    <span
      className="inline-block w-2.5 h-[18px] bg-ba-sky shrink-0"
      style={{ clipPath: "polygon(40% 0, 100% 0, 60% 100%, 0 100%)" }}
      aria-hidden="true"
    />
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー開閉状態を切り替え
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // ドロワーが開いている間は全面オーバーレイで背後の操作を塞ぎ、モーダルと同時に開くことが
  // ないため、モーダル側のEscape処理（ネイティブのdialog）とは競合しない
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  return (
    <>
      {/* sticky にすると、モバイルの回答後フッターやデスクトップの固定要素と重なる余地が増えるため、
          スクロールするページが無い（3ページとも min-h-[100dvh] 1画面構成）今は static のままにする */}
      <header className="flex h-11 md:h-12 items-center px-4 bg-white/90 backdrop-blur-xs border-b border-ba-border relative z-50">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-base md:text-lg font-black text-ba-navy hover:opacity-80 transition-opacity"
        >
          <TitleMark />
          ブルアカプロフクイズ
        </Link>

        {/* デスクトップナビ */}
        <nav className="ml-auto hidden md:flex gap-2">
          <Link
            to="/"
            className={`text-sm font-bold px-3 py-1 transition-colors ${
              location.pathname === "/"
                ? // 14px の文字だと sky 上の白文字は AA (4.5:1) に届かないため、面には ba-blue を使う
                  "bg-ba-blue text-white"
                : "text-ba-navy hover:bg-ba-sky-1"
            }`}
            style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            日替わり
          </Link>
          <Link
            to="/regular"
            className={`text-sm font-bold px-3 py-1 transition-colors ${
              location.pathname === "/regular"
                ? "bg-ba-blue text-white"
                : "text-ba-navy hover:bg-ba-sky-1"
            }`}
            style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            aria-current={location.pathname === "/regular" ? "page" : undefined}
          >
            フリープレイ
          </Link>
        </nav>

        <button
          className="md:hidden ml-auto w-11 h-11 flex items-center justify-center"
          onClick={toggleMenu}
          aria-label="メニュー"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <HamburgerIcon isOpen={isMenuOpen} />
        </button>
      </header>

      {/* 背景オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* モバイルサイドドロワー（右からスライドイン） */}
      <div
        ref={menuRef}
        id="mobile-menu"
        inert={!isMenuOpen}
        className={`md:hidden fixed top-0 right-0 h-full w-64 bg-linear-to-b from-ba-blue-light to-ba-blue text-white shadow-2xl z-50 transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 閉じるボタン */}
        <button
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(false)}
          aria-label="メニューを閉じる"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* タイトル */}
        <div className="pt-16 px-6 pb-6">
          <h2 className="font-display text-xl font-black">ブルアカプロフクイズ</h2>
        </div>

        {/* ナビゲーションリンク */}
        <nav className="flex flex-col">
          <Link
            to="/"
            className="px-6 py-4 hover:bg-white/20 transition-colors border-t border-white/10 text-base font-bold"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            日替わりクイズ
          </Link>
          <Link
            to="/regular"
            className="px-6 py-4 hover:bg-white/20 transition-colors border-t border-white/10 text-base font-bold"
            aria-current={location.pathname === "/regular" ? "page" : undefined}
          >
            フリープレイ
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Header;
