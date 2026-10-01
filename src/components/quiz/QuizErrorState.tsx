function QuizErrorState() {
  return (
    <div className="flex h-[calc(100dvh-var(--header-height))] flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="font-display text-xl font-black text-ba-ink-soft">
          問題の読み込みに失敗しました
        </div>
      </div>
    </div>
  );
}

export default QuizErrorState;
