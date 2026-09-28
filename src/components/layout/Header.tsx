import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Calendar, Shuffle } from "lucide-react";
import { getDailyDate, getTimeUntilNextReset, formatTimeUntilNextReset } from "../../quiz-core";
import { currentDailyDateAtom, todayDailyRecordAtom } from "../../store/daily";
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

// @primer/octicons 19.38.0 の mark-github-16 をそのまま使う。GitHub のブランドガイドラインでマークの変形・加工が禁止され、
// 色も白か黒に限られているため、パスには手を入れず、周りの文字色に合わせず黒で固定する
function GithubIcon({ className }: { className: string }) {
  return (
    <svg
      className={`text-black ${className}`}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
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
  const setCurrentDailyDate = useSetAtom(currentDailyDateAtom);

  // メニュー開閉状態を切り替え
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // メニュー内のDailyStatusRowは常時マウントされているため、開くタイミングで出題日を
  // 読み直さないと、朝4:00をまたいだ後の再訪でも前日の記録を表示し続けてしまう
  useEffect(() => {
    if (isMenuOpen) setCurrentDailyDate(getDailyDate());
  }, [isMenuOpen, setCurrentDailyDate]);

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
              icon={<Calendar className="w-6 h-6 text-ba-blue" />}
              name="日替わり"
              description="毎日4:00に更新・1日1回"
            />
            <MenuTile
              to="/regular"
              isCurrent={location.pathname === "/regular"}
              icon={<Shuffle className="w-6 h-6 text-ba-blue" />}
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
