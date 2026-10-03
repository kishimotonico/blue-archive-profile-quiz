import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Provider } from "jotai";
import DailyQuiz from "./pages/DailyQuiz";
import RegularQuiz from "./pages/RegularQuiz";
import Result from "./pages/Result";
import QuizLoadingState from "./components/quiz/QuizLoadingState";
import QuizErrorState from "./components/quiz/QuizErrorState";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Header from "./components/layout/Header";

// ErrorBoundary/Suspense は allStudentsAtom の読み込み用
function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<QuizErrorState />}>
      <Suspense fallback={<QuizLoadingState />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Header はルート遷移や Suspense 解決で再マウントされないよう、レイアウトルートに置く
function AppLayout() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
