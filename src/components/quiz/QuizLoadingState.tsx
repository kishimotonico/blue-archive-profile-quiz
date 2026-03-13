import Header from "../layout/Header";

function QuizLoadingState() {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    </div>
  );
}

export default QuizLoadingState;
