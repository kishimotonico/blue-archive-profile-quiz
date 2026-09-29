## プロジェクト概要

@README.md

## ディレクトリ構成

```
/
├── DESIGN.md            # デザインガイド
├── scrape/              # スクレイピング関連のコード
├── specs/               # 仕様や開発に関するドキュメント
│   ├── 001_app-concept.md
│   ├── 002_design-renewal-followups.md  # デザイン刷新後の設計改善案
│   └── 003_play-history.md              # プレイ履歴の保存仕様
├── data/                # クイズに必要なデータ
│   ├── students.json    # 全生徒のプロフィール
│   └── images/portrait/ # 生徒の立ち絵画像（リポジトリには含めない）
└── src/                 # アプリ本体
    ├── quiz-core/       # 純粋なゲームロジック
    │   ├── types.ts     # 型定義
    │   ├── key.ts       # QuizKey（version/baseDate/seed）の定義とエンコード
    │   ├── random.ts    # 決定論的な乱数・シャッフル・seed派生（v1/v2）
    │   ├── students.ts  # 生徒データのparse・出題プール・生徒選定（fetchは持たない）
    │   ├── hints.ts     # ヒント生成ロジック
    │   ├── quiz.ts      # QuizKey から問題/問題セットを生成（version分岐）
    │   ├── answer.ts    # 回答判定ロジック
    │   ├── scoring.ts   # スコア計算ロジック
    │   ├── stats.ts     # プレイ履歴（QuestionRecord[]）から統計を出す純粋関数
    │   ├── round.ts     # 一問の状態（playing/answered）の reducer と判定
    │   ├── reveal.ts    # 開示段階（立ち絵・残り段階・表示ヒント数）の導出
    │   ├── regularSession.ts # フリープレイ10問の状態の reducer
    │   ├── dailySession.ts   # 日替わりの状態の reducer
    │   ├── daily.ts     # 日替わりクイズロジック
    │   ├── result.ts    # 結果（正解/誤答/パス）判定
    │   └── index.ts
    ├── store/           # jotai atoms / 永続化
    │   ├── persistedDocument.ts  # バージョン付き保存文書（parse / 移行 / 旧キー取り込み / 別タブ購読）
    │   ├── daily.ts     # 日替わりの履歴文書（DailyHistory、localStorage 全件保存）と進捗、記録・統計の atom
    │   ├── regular.ts   # フリープレイ進捗（sessionStorage、Valibotで検証）
    │   ├── students.ts  # 生徒データのfetchとStudent[]変換を行うatom（allStudentsAtom）
    │   └── __fixtures__/ # 保存形式の過去バージョンごとの実データ相当（移行・取り込みのテスト用）
    ├── hooks/           # カスタムフック
    │   ├── useDailyQuiz.ts   # 日替わりクイズの controller
    │   └── useRegularQuiz.ts # フリープレイ（10問・進捗永続化）の controller
    ├── components/      # Reactコンポーネント
    │   ├── common/      # 共通コンポーネント（Button, Modal, ErrorBoundaryなど）
    │   ├── quiz/        # クイズ関連（QuizScreen, Mobile/DesktopQuizLayout, HintList, AnswerInputなど）
    │   └── layout/      # レイアウト（Header）
    ├── pages/           # ページコンポーネント
    │   ├── DailyQuiz.tsx    # 日替わりクイズページ（/ ルート）
    │   ├── RegularQuiz.tsx  # フリープレイページ（/regular）
    │   └── Result.tsx       # 結果表示ページ（/result）
    ├── App.tsx          # ルーティング設定（Provider はアプリで1つ、各ルートを ErrorBoundary/Suspense で包む）
    └── main.tsx         # エントリーポイント
```

出題アルゴリズムは `QuizKey.version` でバージョン管理しており、`*V1`/`*V2` のように関数を世代別に凍結する。過去に保存したキーを復元できるよう、既存バージョンの関数は変更しないこと（新しい挙動は version を上げて追加する）。

保存形式のバージョン（`schemaVersion`）を上げる条件は `specs/003_play-history.md` に従う。上げるときは `migrations` にエントリを1つ足し、`__fixtures__` に上げる前の文書を1つ足す。フィールドを足すだけなら上げない。

`store/` の永続化モジュールはモジュール評価時に `localStorage` を読むので、これを import するテストは `// @vitest-environment jsdom` を宣言する。

## 開発規約

### コーディング規約

- MUST: コミットログやプルリクは日本語で記述すること
- MUST: 変数名は英語ベースのベストプラクティスに沿うこと。ただしゲーム内のキャラクターは"character"ではなく"student"と表記すること
- SHOULD: 純粋なゲームロジックと、UIロジックは分離して適切に実装すること
  - ゲームロジックは`quiz-core/`に配置
  - React固有のロジックは`hooks/`または各コンポーネントに配置
- MUST: Reactのベストプラクティスに従うこと
  - useEffectの依存配列を適切に設定し、無限ループを避けること
  - 状態更新がre-renderを引き起こす場合、意図した動作か必ず確認すること
  - 見た目は状態から宣言的に導き、描画結果を観測して後から補正する実装で要件を満たさないこと
- SHOULD: コード内のコメントはWHY（理由・制約）とWHY NOT（代替案を採らない理由）だけを書き、WHAT/HOWや変更の経緯は書かない。ただしpropsのJSDocにはWHATを書いてもよい（名前と型から明らかなものは除く）

### UI/UX開発

- MUST: UI変更時は、モバイルとデスクトップのどちらに適用するか明確にすること
  - モバイルのみの変更なのか、両方に適用するのかを必ず確認
  - レスポンシブデザインを考慮し、適切なブレークポイントを使用
- SHOULD: モバイルではハンバーガーメニュー（サイドドロワー）、デスクトップではヘッダーメニューを使用
- MUST: 見た目を変えるときは `DESIGN.md` に従うこと

### Git運用

- MUST NOT: Gitの強制プッシュは禁止
- SHOULD: 変更範囲が明確な単位でコミットすること
