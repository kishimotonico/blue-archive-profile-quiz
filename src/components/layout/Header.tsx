import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
      <span
        className={`block w-5 h-0.5 bg-blue-600 transition-all duration-300 ${
          isOpen ? "rotate-45 translate-y-2" : ""
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-blue-600 transition-all duration-300 ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-blue-600 transition-all duration-300 ${
          isOpen ? "-rotate-45 -translate-y-2" : ""
        }`}
      />
    </div>
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

  // Escapeキーでメニューを閉じる
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
      {/* デスクトップヘッダー（640px以上） */}
      <header className="hidden sm:flex bg-linear-to-r from-blue-600 to-blue-500 text-white h-12 items-center px-4 shadow-xs relative z-50">
        <Link to="/" className="text-lg font-bold hover:opacity-90 transition-opacity">
          ブルアカプロフクイズ
        </Link>

        {/* デスクトップナビ */}
        <nav className="ml-auto flex gap-2">
          <Link
            to="/"
            className="text-sm px-3 py-1 rounded-sm hover:bg-white/20 transition-colors"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            日替わり
          </Link>
          <Link
            to="/regular"
            className="text-sm px-3 py-1 rounded-sm hover:bg-white/20 transition-colors"
            aria-current={location.pathname === "/regular" ? "page" : undefined}
          >
            フリープレイ
          </Link>
        </nav>
      </header>

      {/* モバイルハンバーガーボタン（640px未満、固定配置） */}
      <button
        className="sm:hidden fixed top-3 right-3 z-50 w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-xs rounded-lg shadow-lg hover:bg-white transition-colors"
        onClick={toggleMenu}
        aria-label="メニュー"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        <HamburgerIcon isOpen={isMenuOpen} />
      </button>

      {/* 背景オーバーレイ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* モバイルサイドドロワー（右からスライドイン） */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`sm:hidden fixed top-0 right-0 h-full w-64 bg-linear-to-b from-blue-600 to-blue-500 text-white shadow-2xl z-50 transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 閉じるボタン */}
        <button
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
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
          <h2 className="text-xl font-bold">ブルアカプロフクイズ</h2>
        </div>

        {/* ナビゲーションリンク */}
        <nav className="flex flex-col">
          <Link
            to="/"
            className="px-6 py-4 hover:bg-white/20 transition-colors border-t border-white/10 text-base"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            日替わりクイズ
          </Link>
          <Link
            to="/regular"
            className="px-6 py-4 hover:bg-white/20 transition-colors border-t border-white/10 text-base"
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
