import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center text-blue-900 mb-4">ブルアカプロフクイズ</h1>
        <p className="text-center text-gray-600 mb-12">ヒントから生徒を当てるクイズゲーム</p>

        <div className="max-w-md mx-auto space-y-4">
          <Link
            to="/daily"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg text-center transition-colors"
          >
            日替わりクイズ
          </Link>

          <Link
            to="/regular"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-center transition-colors"
          >
            フリープレイ
          </Link>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>ブルーアーカイブの生徒プロフィールクイズ</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
