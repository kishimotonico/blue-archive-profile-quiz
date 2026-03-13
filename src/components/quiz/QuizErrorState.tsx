import Header from '../layout/Header';

function QuizErrorState() {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl text-gray-600">問題の読み込みに失敗しました</div>
      </div>
    </div>
  );
}

export default QuizErrorState;
