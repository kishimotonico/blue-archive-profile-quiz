import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { useDailyQuiz } from "../hooks/useDailyQuiz";
import { getTimeUntilNextReset, formatTimeUntilNextReset, getScoreRank } from "../quiz-core";
import type { QuestionResult } from "../quiz-core";
import { dailyStatsAtom } from "../store/daily";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import HaloRingGauge from "../components/common/HaloRingGauge";
import QuizScreen from "../components/quiz/QuizScreen";
import RankDistribution from "../components/quiz/RankDistribution";

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="text-xs text-ba-ink-soft">{label}</p>
      <p>
        <span className="font-display text-2xl font-black tabular-nums text-ba-navy">{value}</span>
        <span className="ml-0.5 text-xs text-ba-ink-soft">{unit}</span>
      </p>
    </div>
  );
}

function ResultModalBody({
  result,
  studentName,
  onPlayMore,
  onClose,
}: {
  result: QuestionResult;
  studentName: string;
  onPlayMore: () => void;
  onClose: () => void;
}) {
  const { totalAttempts, bestScore, rankCounts } = useAtomValue(dailyStatsAtom);

  return (
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
      <p className="font-display text-xl font-black text-ba-navy mb-2">{studentName}</p>

      {/* ランクは点数の補足なので、点数（ゲージ中央）より目立たせない */}
      <span className="inline-block rounded-full border border-ba-border px-2.5 py-0.5 text-sm text-ba-ink-soft mb-3">
        ランク {getScoreRank(result.score)}
      </span>

      <p className="text-sm text-ba-ink-soft mb-4">
        次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
      </p>

      <div className="border-t border-ba-border pt-3 mb-4 text-left">
        <h3 className="font-display text-base font-black text-ba-navy mb-2">統計情報</h3>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="挑戦回数" value={totalAttempts} unit="回" />
          <Stat label="ベストスコア" value={bestScore} unit="点" />
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-sm text-ba-ink-soft">ランク分布</p>
          <RankDistribution counts={rankCounts} highlightRank={getScoreRank(result.score)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Button variant="accent" className="w-full" onClick={onPlayMore}>
          もっと遊ぶ
        </Button>
        <Button variant="secondary" className="w-full" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </div>
  );
}

function DailyQuiz() {
  const { view, reveal, submit, giveUp } = useDailyQuiz();
  const navigate = useNavigate();
  const [showResultModal, setShowResultModal] = useState(false);

  const { round } = view;
  const result = round.status === "answered" ? round.result : null;

  const completedStatus = view.completedOnLoad && (
    <div className="flex flex-col items-end gap-1">
      <span className="rounded-full border border-ba-border bg-white px-2.5 text-xs font-bold text-ba-navy">
        完了済み
      </span>
      <span className="text-xs text-ba-ink-soft">次の問題は 4:00 から</span>
    </div>
  );

  // getDailyDate() ではなく出題日から作る。4:00 をまたいで開いたままでも問題と日付がずれない
  const [, month, day] = round.question.key.baseDate.split("-");
  const heading = `${Number(month)}月${Number(day)}日`;

  return (
    <>
      <QuizScreen
        modeLabel="日替わりクイズ"
        heading={heading}
        questionId={view.questionId}
        round={view.round}
        actions={{ reveal, submit, giveUp }}
        afterAnswer={{
          primaryAction: {
            label: "結果を見る",
            onClick: () => setShowResultModal(true),
          },
          status: completedStatus,
        }}
      />

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        ariaLabel="今日のクイズの結果"
      >
        {result && (
          <ResultModalBody
            result={result}
            studentName={round.question.student.fullName}
            onPlayMore={() => navigate("/regular")}
            onClose={() => setShowResultModal(false)}
          />
        )}
      </Modal>
    </>
  );
}

export default DailyQuiz;
