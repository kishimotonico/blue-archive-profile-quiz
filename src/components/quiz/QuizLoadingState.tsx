import Header from "../layout/Header";

function QuizLoadingState() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="font-display text-xl font-black text-ba-ink-soft">読み込み中...</div>
      </div>
    </div>
  );
}

export default QuizLoadingState;
