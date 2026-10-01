function QuizLoadingState() {
  return (
    <div className="flex h-[calc(100dvh-var(--header-height))] flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="font-display text-xl font-black text-ba-ink-soft">読み込み中...</div>
      </div>
    </div>
  );
}

export default QuizLoadingState;
