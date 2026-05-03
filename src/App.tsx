import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DailyQuiz from "./pages/DailyQuiz";
import RegularQuiz from "./pages/RegularQuiz";
import Result from "./pages/Result";
import QuizLoadingState from "./components/quiz/QuizLoadingState";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<QuizLoadingState />}>
              <DailyQuiz />
            </Suspense>
          }
        />
        <Route
          path="/regular"
          element={
            <Suspense fallback={<QuizLoadingState />}>
              <RegularQuiz />
            </Suspense>
          }
        />
        <Route
          path="/result"
          element={
            <Suspense fallback={<QuizLoadingState />}>
              <Result />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
