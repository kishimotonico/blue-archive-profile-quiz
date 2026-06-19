import { Suspense, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, createStore } from "jotai";
import DailyQuiz from "./pages/DailyQuiz";
import RegularQuiz from "./pages/RegularQuiz";
import Result from "./pages/Result";
import QuizLoadingState from "./components/quiz/QuizLoadingState";
import QuizErrorState from "./components/quiz/QuizErrorState";
import ErrorBoundary from "./components/common/ErrorBoundary";

/**
 * 各ルートを独立した jotai Provider でラップするコンポーネント。
 * useMemo で store をルートのライフサイクルに束縛し、ページ間でプレイ中 atom が共有されない。
 */
function ScopedRoute({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => createStore(), []);
  return (
    <Provider store={store}>
      <ErrorBoundary fallback={<QuizErrorState />}>
        <Suspense fallback={<QuizLoadingState />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ScopedRoute>
              <DailyQuiz />
            </ScopedRoute>
          }
        />
        <Route
          path="/regular"
          element={
            <ScopedRoute>
              <RegularQuiz />
            </ScopedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ScopedRoute>
              <Result />
            </ScopedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
