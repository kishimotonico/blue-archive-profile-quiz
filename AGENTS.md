## プロジェクト概要

@README.md

## ディレクトリ構成

```
/
├── scrape/              # スクレイピング関連のコード
├── specs/               # 仕様や開発に関するドキュメント
│   └── 001_app-concept.md
├── data/                # クイズに必要なデータ
│   ├── students.json    # 全生徒のプロフィール
│   └── images/portraits/ # 生徒の立ち絵画像
└── src/                 # アプリ本体
    ├── quiz-core/       # 純粋なゲームロジック
    │   ├── types.ts     # 型定義
    │   ├── students.ts  # 生徒データ読み込み
    │   ├── hints.ts     # ヒント生成ロジック
    │   ├── answer.ts    # 回答判定ロジック
    │   ├── scoring.ts   # スコア計算ロジック
    │   ├── daily.ts     # 日替わりクイズロジック
    │   └── index.ts
    ├── store/           # jotai atoms（グローバル状態管理）
    │   ├── quiz.ts      # フリープレイ用の状態
    │   └── daily.ts     # 日替わりクイズ用の状態
    ├── hooks/           # カスタムフック
    │   ├── useQuiz.ts   # フリープレイロジック
    │   └── useDailyQuiz.ts # 日替わりクイズロジック
    ├── components/      # Reactコンポーネント
    │   ├── common/      # 共通コンポーネント（Button, Modalなど）
    │   ├── quiz/        # クイズ関連（HintList, AnswerInputなど）
    │   └── layout/      # レイアウト（Header）
    ├── pages/           # ページコンポーネント
    │   ├── DailyQuiz.tsx    # 日替わりクイズページ（/ ルート）
    │   ├── RegularQuiz.tsx  # フリープレイページ（/regular）
    │   └── Result.tsx       # 結果表示ページ（/result）
    ├── App.tsx          # ルーティング設定
    └── main.tsx         # エントリーポイント
```

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
