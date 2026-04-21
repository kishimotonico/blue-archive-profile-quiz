ブルアカプロフクイズアプリ
==========================

## 概要

ゲーム[「ブルーアーカイブ」](https://bluearchive.jp/) に登場する生徒（キャラクター）をヒントから特定するクイズアプリです。

## 機能

### 日替わりクイズ
- 毎日4:00 JSTに問題が切り替わります
- 1日1回のみプレイ可能
- 結果はローカルストレージに保存されます

### フリープレイ
- ランダムに10問出題
- 何度でもプレイ可能
- 合計スコアと問題ごとのスコアを表示

### ヒントシステム
- 9つのヒント（所属、部活、年齢、誕生日、身長、趣味、武器、CV、姓）
- ヒントを少なく正解するほど高得点
- 最初のヒントで正解すると10点、2つ目のヒントだと9点、以降1点ずつ減少
- 最後に立ち絵のシルエットが表示され、それで正解すると1点

## 技術スタック

- TypeScript
- React 19
- Vite
- Tailwind CSS
- jotai (状態管理)
- React Router (ルーティング)
- Zod (バリデーション)

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## デプロイ

**公開URL:** https://blue-archive-quiz.kishimotonico.dev

Cloudflare Pages の Git連携で自動デプロイされます。`master` ブランチへの push で自動的にビルド・デプロイが実行されます。

立ち絵画像は Cloudflare R2 から配信されます。ビルド時に環境変数 `VITE_IMAGE_BASE_URL` で R2 の公開URLを指定してください。

## ディレクトリ構成

```
src/
├── quiz-core/         # 純粋なゲームロジック
├── store/            # jotai atoms
├── hooks/            # カスタムフック
├── components/       # Reactコンポーネント
│   ├── common/       # 共通コンポーネント
│   ├── quiz/         # クイズ関連
│   └── layout/       # レイアウト
├── pages/            # ページコンポーネント
├── main.tsx          # エントリーポイント
└── App.tsx           # ルーティング設定
```

## データ

生徒データは `data/students.json` に格納されています。
立ち絵画像は `data/images/portrait/` に配置されています。
