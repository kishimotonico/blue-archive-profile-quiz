import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white h-12 flex items-center px-4 shadow-sm">
      <Link to="/" className="text-lg font-bold hover:opacity-90 transition-opacity">
        ブルアカプロフクイズ
      </Link>
      <nav className="ml-auto flex gap-2">
        <Link
          to="/"
          className="text-sm px-3 py-1 rounded hover:bg-white/20 transition-colors"
        >
          日替わり
        </Link>
        <Link
          to="/regular"
          className="text-sm px-3 py-1 rounded hover:bg-white/20 transition-colors"
        >
          レギュラー
        </Link>
      </nav>
    </header>
  );
}

export default Header;
