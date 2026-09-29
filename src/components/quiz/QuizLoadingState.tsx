function QuizLoadingState() {
  return (
    // Header はレイアウトルート（App.tsx）にあるため、ここでは画面残り高さを直接計算する
    <div className="flex h-[calc(100dvh-2.75rem)] md:h-[calc(100dvh-3rem)] flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="font-display text-xl font-black text-ba-ink-soft">読み込み中...</div>
      </div>
    </div>
  );
}

export default QuizLoadingState;
