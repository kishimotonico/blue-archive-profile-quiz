## プロジェクト概要

@README.md

## ディレクトリ構成

```
/
├── scrape/              # スクレイピング関連のコード
├── specs/               # 仕様や開発に関するドキュメント
│   ├── 001_app-concept.md
│   └── design-mocks/    # デザイン検討時の静的HTMLモック（採用案はREADME参照）
├── data/                # クイズに必要なデータ
│   ├── students.json    # 全生徒のプロフィール
│   └── images/portrait/ # 生徒の立ち絵画像（リポジトリには含めない）
└── src/                 # アプリ本体
    ├── quiz-core/       # 純粋なゲームロジック
    │   ├── types.ts     # 型定義
    │   ├── key.ts       # QuizKey（version/baseDate/seed）の定義とエンコード
    │   ├── random.ts    # 決定論的な乱数・シャッフル・seed派生（v1/v2）
    │   ├── students.ts  # 生徒データ読み込み・出題プール・生徒選定
    │   ├── hints.ts     # ヒント生成ロジック
    │   ├── quiz.ts      # QuizKey から問題/問題セットを生成（version分岐）
    │   ├── answer.ts    # 回答判定ロジック
    │   ├── scoring.ts   # スコア計算ロジック
    │   ├── daily.ts     # 日替わりクイズロジック
    │   ├── result.ts    # 結果（正解/誤答/パス）判定
    │   └── index.ts
    ├── store/           # jotai atoms / 永続化
    │   ├── quiz.ts      # プレイ中の共有状態（ルート単位にProviderでスコープ）
    │   ├── regular.ts   # フリープレイ進捗（sessionStorage、Valibotで検証）
    │   └── daily.ts     # 日替わりクイズ結果（localStorage、Valibotで検証）
    ├── hooks/           # カスタムフック
    │   ├── useQuiz.ts        # 共通のクイズ操作ロジック
    │   ├── useRegularQuiz.ts # フリープレイ（10問・進捗永続化）
    │   └── useDailyQuiz.ts   # 日替わりクイズ
    ├── components/      # Reactコンポーネント
    │   ├── common/      # 共通コンポーネント（Button, Modal, ErrorBoundaryなど）
    │   ├── quiz/        # クイズ関連（HintList, AnswerInputなど）
    │   └── layout/      # レイアウト（Header）
    ├── pages/           # ページコンポーネント
    │   ├── DailyQuiz.tsx    # 日替わりクイズページ（/ ルート）
    │   ├── RegularQuiz.tsx  # フリープレイページ（/regular）
    │   └── Result.tsx       # 結果表示ページ（/result）
    ├── App.tsx          # ルーティング設定（各ルートをProvider/ErrorBoundary/Suspenseで包む）
    └── main.tsx         # エントリーポイント
```

出題アルゴリズムは `QuizKey.version` でバージョン管理しており、`*V1`/`*V2` のように関数を世代別に凍結する。過去に保存したキーを復元できるよう、既存バージョンの関数は変更しないこと（新しい挙動は version を上げて追加する）。

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

### UI/UX開発

- MUST: UI変更時は、モバイルとデスクトップのどちらに適用するか明確にすること
  - モバイルのみの変更なのか、両方に適用するのかを必ず確認
  - レスポンシブデザインを考慮し、適切なブレークポイントを使用
- SHOULD: モバイルではハンバーガーメニュー（サイドドロワー）、デスクトップではヘッダーメニューを使用

### Git運用

- MUST NOT: Gitの強制プッシュは禁止
- SHOULD: 変更範囲が明確な単位でコミットすること
