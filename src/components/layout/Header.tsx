import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:text-blue-100">
            ブルアカプロフクイズ
          </Link>

          <nav className="flex gap-4">
            <Link
              to="/daily"
              className="px-4 py-2 rounded hover:bg-blue-500 transition-colors"
            >
              日替わり
            </Link>
            <Link
              to="/regular"
              className="px-4 py-2 rounded hover:bg-blue-500 transition-colors"
            >
              レギュラー
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
