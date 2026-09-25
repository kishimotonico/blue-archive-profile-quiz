import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "jotai";
import DailyQuiz from "./pages/DailyQuiz";
import RegularQuiz from "./pages/RegularQuiz";
import Result from "./pages/Result";
import QuizLoadingState from "./components/quiz/QuizLoadingState";
import QuizErrorState from "./components/quiz/QuizErrorState";
import ErrorBoundary from "./components/common/ErrorBoundary";

// プレイ状態はページの useReducer にあり、ルート遷移のアンマウントで消えるため、
// jotai の store はアプリで1つでよい。ErrorBoundary/Suspense は allStudentsAtom の読み込み用。
function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<QuizErrorState />}>
      <Suspense fallback={<QuizLoadingState />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RouteBoundary>
                <DailyQuiz />
              </RouteBoundary>
            }
          />
          <Route
            path="/regular"
            element={
              <RouteBoundary>
                <RegularQuiz />
              </RouteBoundary>
            }
          />
          <Route
            path="/result"
            element={
              <RouteBoundary>
                <Result />
              </RouteBoundary>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
