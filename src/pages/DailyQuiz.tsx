import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { useDailyQuiz } from "../hooks/useDailyQuiz";
import { getTimeUntilNextReset, getScoreRank, getDailyDate } from "../quiz-core";
import { totalAttemptsAtom, scoreDistributionAtom, bestScoreAtom } from "../store/daily";
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
  const { state, reveal, submit, giveUp, answerFeedback, errorKey } = useDailyQuiz();

  const totalAttempts = useAtomValue(totalAttemptsAtom);
  const scoreDistribution = useAtomValue(scoreDistributionAtom);
  const bestScore = useAtomValue(bestScoreAtom);
  const navigate = useNavigate();
  const [showResultModal, setShowResultModal] = useState(false);
  const showResultButtonRef = useRef<HTMLButtonElement>(null);

  if (state.status === "loading") return <QuizLoadingState />;
  if (state.status === "error") return <QuizErrorState />;

  const { session } = state;
  const { round } = session;
  const result = round.status === "answered" ? round.result : null;

  const completedNotice = session.completedOnLoad && (
    <div className="bg-ba-sky-1 border border-ba-border rounded-2xl p-4 mb-3 text-center">
      <p className="font-display font-black text-ba-navy mb-2">今日のクイズは完了済みです</p>
      <p className="text-ba-ink-soft text-sm mb-2">
        次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
      </p>
      <Button variant="primary" size="sm" onClick={() => navigate("/regular")}>
        もっと遊ぶ
      </Button>
    </div>
  );

  const rankDistribution = [
    { label: "SS (10点)", count: scoreDistribution.perfect },
    { label: "S (8-9点)", count: scoreDistribution.veryHigh },
    { label: "A (6-7点)", count: scoreDistribution.high },
    { label: "B (4-5点)", count: scoreDistribution.medium },
    { label: "C (1-3点)", count: scoreDistribution.low },
    { label: "D (0点)", count: scoreDistribution.zero },
  ];

  const heading = (() => {
    const [, month, day] = getDailyDate().split("-");
    return `${Number(month)}月${Number(day)}日`;
  })();

  return (
    <>
      <QuizScreen
        modeLabel="日替わりクイズ"
        heading={heading}
        questionId={round.question.key.baseDate}
        round={round}
        actions={{ reveal, submit, giveUp }}
        answerError={{ message: answerFeedback, key: errorKey }}
        afterAnswerActions={
          <>
            {completedNotice}
            <Button
              ref={showResultButtonRef}
              variant="primary"
              className="w-full"
              onClick={() => setShowResultModal(true)}
            >
              結果を見る
            </Button>
          </>
        }
      />

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        ariaLabel="今日のクイズの結果"
        focusFallbackRef={showResultButtonRef}
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
              <span className="font-display text-3xl font-black text-ba-blue">
                {getScoreRank(result.score)}
              </span>
              <span className="text-[10px] tracking-widest text-ba-ink-soft">RANK</span>
            </HaloRingGauge>

            <h2 className="text-sm font-bold text-ba-ink-soft mb-1">
              {result.correct ? "正解！" : "正解は…"}
            </h2>
            <p className="font-display text-xl font-black text-ba-navy mb-2">
              {round.question.student.fullName}
            </p>

            <div className="flex items-baseline justify-center gap-1 rounded-lg border border-ba-yellow-soft bg-ba-yellow-soft/40 py-1.5 mb-3">
              <span className="font-display text-2xl font-black text-ba-navy">{result.score}</span>
              <span className="text-sm font-bold text-ba-ink-soft">/ 10 点</span>
            </div>

            <p className="text-sm text-ba-ink-soft mb-1">使用ヒント数: {result.usedHintCount}</p>
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
              <Button variant="primary" className="w-full" onClick={() => navigate("/regular")}>
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
