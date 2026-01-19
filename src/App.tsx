import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DailyQuiz from './pages/DailyQuiz';
import RegularQuiz from './pages/RegularQuiz';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter basename="/blue-archive-prof-quiz">
      <Routes>
        <Route path="/" element={<DailyQuiz />} />
        <Route path="/regular" element={<RegularQuiz />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
