import Header from "../layout/Header";

function QuizErrorState() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="font-display text-xl font-black text-ba-ink-soft">
          問題の読み込みに失敗しました
        </div>
      </div>
    </div>
  );
}

export default QuizErrorState;
