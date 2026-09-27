import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { useDailyQuiz } from "../hooks/useDailyQuiz";
import { getTimeUntilNextReset, getScoreRank, getDailyDate } from "../quiz-core";
import { dailyStatsAtom } from "../store/daily";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import HaloRingGauge from "../components/common/HaloRingGauge";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizScreen from "../components/quiz/QuizScreen";

function formatTimeUntilNextReset({ hours, minutes }: { hours: number; minutes: number }): string {
  return hours > 0 ? `${hours}時間${minutes}分後` : `${minutes}分後`;
}

function DailyQuiz() {
  const { state, view, reveal, submit, giveUp, answerFeedback, errorKey } = useDailyQuiz();

  const { totalAttempts, bestScore, rankCounts } = useAtomValue(dailyStatsAtom);
  const navigate = useNavigate();
  const [showResultModal, setShowResultModal] = useState(false);

  if (!view) return state.status === "error" ? <QuizErrorState /> : <QuizLoadingState />;

  const { round } = view;
  const result = round.status === "answered" ? round.result : null;

  const completedNotice = view.completedOnLoad && (
    <div className="bg-ba-sky-1 border border-ba-border rounded-2xl p-4 mb-3 text-center">
      <p className="font-display font-black text-ba-navy mb-2">今日のクイズは完了済みです</p>
      <p className="text-ba-ink-soft text-sm mb-2">
        次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
      </p>
      {/* この通知は primaryAction（結果を見る、accent）と同時に表示されるため、
          画面内の強調ボタンが2つにならないよう secondary にする */}
      <Button variant="secondary" size="sm" onClick={() => navigate("/regular")}>
        もっと遊ぶ
      </Button>
    </div>
  );

  const rankDistribution = (
    [
      ["SS", "SS (10点)"],
      ["S", "S (8-9点)"],
      ["A", "A (6-7点)"],
      ["B", "B (4-5点)"],
      ["C", "C (1-3点)"],
      ["D", "D (0点)"],
    ] as const
  ).map(([rank, label]) => ({ label, count: rankCounts[rank] }));

  const heading = (() => {
    const [, month, day] = getDailyDate().split("-");
    return `${Number(month)}月${Number(day)}日`;
  })();

  return (
    <>
      <QuizScreen
        modeLabel="日替わりクイズ"
        heading={heading}
        questionId={view.questionId}
        round={view.round}
        actions={{ reveal, submit, giveUp }}
        answerError={{ message: answerFeedback, key: errorKey }}
        afterAnswer={{
          primaryAction: { label: "結果を見る", onClick: () => setShowResultModal(true) },
          notice: completedNotice,
        }}
      />

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        ariaLabel="今日のクイズの結果"
      >
        {result && (
          <div className="text-center">
            <HaloRingGauge
              value={result.score / 10}
              size={100}
              strokeWidth={7}
              trackColor="var(--color-ba-border)"
              fillFrom="var(--color-ba-yellow)"
              fillTo="var(--color-ba-blue)"
              className="mx-auto mb-1"
            >
              <span className="font-display text-3xl font-black text-ba-navy tabular-nums">
                {result.score}
              </span>
              <span className="text-[10px] tracking-widest text-ba-ink-soft">/ 10点</span>
            </HaloRingGauge>

            <h2 className="text-sm font-bold text-ba-ink-soft mb-1">
              {result.correct ? "正解！" : "正解は…"}
            </h2>
            <p className="font-display text-xl font-black text-ba-navy mb-2">
              {round.question.student.fullName}
            </p>

            {/* ランクは点数の補足なので、点数（ゲージ中央）より目立たせない */}
            <span className="inline-block rounded-full border border-ba-border px-2.5 py-0.5 text-sm text-ba-ink-soft mb-3">
              ランク {getScoreRank(result.score)}
            </span>

            <p className="text-sm text-ba-ink-soft mb-4">
              次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
            </p>

            {/* 統計情報 */}
            <div className="border-t border-ba-border pt-3 mb-4 text-left">
              <h3 className="font-display text-base font-black text-ba-navy mb-2">統計情報</h3>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ba-ink-soft">累積挑戦回数:</span>
                  <span className="font-semibold text-ba-navy">{totalAttempts}回</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ba-ink-soft">ベストスコア:</span>
                  <span className="font-semibold text-ba-navy">{bestScore}点</span>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm text-ba-ink-soft mb-1.5">ランク分布:</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs text-ba-navy">
                  {rankDistribution.map(({ label, count }) => (
                    <div key={label} className="rounded-lg bg-ba-bg px-2 py-1.5 text-center">
                      <div className="font-bold">{label}</div>
                      <div>{count}回</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Button variant="accent" className="w-full" onClick={() => navigate("/regular")}>
                もっと遊ぶ
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowResultModal(false)}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default DailyQuiz;
