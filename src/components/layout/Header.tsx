import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { getTimeUntilNextReset, formatTimeUntilNextReset } from "../../quiz-core";
import { todayDailyRecordAtom } from "../../store/daily";
import HaloRingGauge from "../common/HaloRingGauge";

const GITHUB_URL = "https://github.com/kishimotonico/blue-archive-profile-quiz";

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

// デスクトップナビの現在地と同じ形の語彙として、メニュー内の「表示中」にも同じ平行四辺形を使う
function CurrentBadge() {
  return (
    <span
      className="absolute -top-2 right-2 bg-ba-blue text-white text-[10px] font-bold px-2.5 py-0.5"
      style={{ clipPath: "polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)" }}
      aria-hidden="true"
    >
      表示中
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-6 h-6 text-ba-blue"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path strokeLinecap="round" d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg
      className="w-6 h-6 text-ba-blue"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6.5h4l9 11h5M3 17.5h4l2.2-2.7M14.2 8.7L16 6.5h5"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 3.5l3 3-3 3M18 20.5l3-3-3-3" />
    </svg>
  );
}

// Octicon "mark-github" のパス（16pxベース）。公式アセットは真似ず、GitHubへの導線とだけ分かる最小限として使う
function GithubIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// デスクトップナビの右端に置くGitHubへのアイコンリンク。モバイルパネルのリンクとURL・アイコンを共有する
function GithubLink({ className }: { className: string }) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="GitHub（新しいタブで開く）"
      aria-label="GitHub（新しいタブで開く）"
      className={className}
    >
      <GithubIcon className="w-5 h-5" />
    </a>
  );
}

interface MenuTileProps {
  to: string;
  isCurrent: boolean;
  icon: React.ReactNode;
  name: string;
  description: string;
}

function MenuTile({ to, isCurrent, icon, name, description }: MenuTileProps) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center gap-1 rounded-xl border bg-white px-2 py-2.5 text-center transition-colors ${
        isCurrent ? "border-ba-blue" : "border-ba-border hover:bg-ba-sky-1"
      }`}
      aria-current={isCurrent ? "page" : undefined}
    >
      {isCurrent && <CurrentBadge />}
      {icon}
      <span className="font-sans font-bold text-[15px] text-ba-navy">{name}</span>
      <span className="text-xs text-ba-ink-soft">{description}</span>
    </Link>
  );
}

// 今日の日替わりの状況（回答済み/未回答）と次の更新までの時間を表示する
function DailyStatusRow() {
  const todayRecord = useAtomValue(todayDailyRecordAtom);
  const score = todayRecord?.result.score ?? null;
  const nextReset = formatTimeUntilNextReset(getTimeUntilNextReset());

  return (
    <div className="flex items-center gap-3 rounded-lg bg-ba-bg px-3 py-2">
      <HaloRingGauge
        value={(score ?? 0) / 10}
        size={40}
        strokeWidth={4}
        trackColor="var(--color-ba-border)"
        fillFrom="var(--color-ba-yellow)"
        fillTo="var(--color-ba-blue)"
      >
        <span className="font-display text-sm font-black text-ba-navy tabular-nums">
          {score ?? "-"}
        </span>
      </HaloRingGauge>
      <div className="text-left">
        <p className="font-bold text-sm text-ba-navy">
          {score !== null ? `今日の日替わり ${score}点` : "今日の日替わりはまだ回答していません"}
        </p>
        <p className="text-xs text-ba-ink-soft">次の問題まで {nextReset}</p>
      </div>
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

  // パネルが開いている間は全面オーバーレイで背後の操作を塞ぎ、モーダルと同時に開くことが
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
          {/* nav に items-center が無いため、align-items: stretch でこのリンクが GithubLink（h-9）の
              高さまで伸び、文字はその中で上詰め（テキストは中央揃えにならない）になっていた。
              flex items-center + 固定高さ(h-9) で GithubLink・区切り線と光学的に揃える */}
          <Link
            to="/"
            className={`flex h-9 items-center text-sm font-bold px-3 transition-colors ${
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
            className={`flex h-9 items-center text-sm font-bold px-3 transition-colors ${
              location.pathname === "/regular"
                ? "bg-ba-blue text-white"
                : "text-ba-navy hover:bg-ba-sky-1"
            }`}
            style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            aria-current={location.pathname === "/regular" ? "page" : undefined}
          >
            フリープレイ
          </Link>
          <span className="w-px h-5 self-center bg-ba-border" aria-hidden="true" />
          <GithubLink className="flex items-center justify-center w-9 h-9 text-ba-navy rounded-lg transition-colors hover:bg-ba-sky-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue" />
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

      {/* 背景オーバーレイ。ヘッダー自体は隠さず、その下だけを覆う */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-11 bottom-0 bg-ba-navy/45 z-40"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* モバイルの下りパネル。常時マウントし、opacity/translateYだけで開閉することで
          閉じるアニメーションもCSSトランジションに乗せる */}
      <div
        ref={menuRef}
        id="mobile-menu"
        inert={!isMenuOpen}
        className={`md:hidden fixed inset-x-0 top-11 z-50 bg-white border-b border-ba-border shadow-lg transition-[opacity,transform] duration-200 motion-reduce:transition-none motion-reduce:duration-0 ${
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <MenuTile
              to="/"
              isCurrent={location.pathname === "/"}
              icon={<CalendarIcon />}
              name="日替わり"
              description="毎日4:00に更新・1日1回"
            />
            <MenuTile
              to="/regular"
              isCurrent={location.pathname === "/regular"}
              icon={<ShuffleIcon />}
              name="フリープレイ"
              description="ランダムに10問・何度でも"
            />
          </div>

          <DailyStatusRow />

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-end gap-1.5 h-11 text-sm text-ba-ink-soft hover:text-ba-navy transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
            GitHub
            <span className="sr-only">（新しいタブで開きます）</span>
          </a>
        </div>
      </div>
    </>
  );
}

export default Header;
