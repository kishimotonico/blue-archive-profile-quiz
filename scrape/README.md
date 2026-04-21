# blue-archive-wiki-scraper

[ブルーアーカイブ非公式wiki](https://bluearchive.wikiru.jp/) から各生徒のプロフィールを取得して保存するためのスクリプトです。

## ⚠️ 注意事項

このツールはクイズアプリのために限定的な利用を想定しています。実行にあたっては以下の点を守ってください。

- **短時間に大量のリクエストを送らないこと。** 全件取得は1リクエストあたり3秒以上の間隔を空けて実行します
- **取得済みのデータは再取得しないこと。** キャッシュや出力済みJSONがある場合は自動的にスキップされます
- **サイトに過度な負荷をかけないこと。** 必要最小限の処理にとどめてください

## セットアップ

```bash
pnpm install
pnpm exec playwright install chromium
```

## 使い方

### 全件スクレイピング

`data/students-master.yaml` に記載された全生徒を対象にスクレイピングします。
既に `output/students/<id>.json` が存在する生徒はスキップされます。

```bash
pnpm run scrape
```

### 特定の生徒だけ再取得

生徒IDを引数に指定すると、その1件のみを取得します（キャッシュは使わず再取得）。

```bash
pnpm run scrape aru
```

生徒IDは `data/students-master.yaml` のキーに対応します。

### データのマージ

個別JSONを `data/students.json` にまとめます。マスターとJSONの件数が一致しない場合はエラーになります。

```bash
pnpm run merge
```

## ディレクトリ構成

```
scrape/
├── index.ts               # スクレイピング本体
├── merge.ts               # 個別JSONをまとめてdata/students.jsonに出力
├── cache/                 # 取得済みHTMLのキャッシュ（全件実行時に利用）
└── output/
    ├── students/          # 生徒ごとのJSONファイル（<id>.json）
    └── images/portraits/  # 立ち絵画像（<id>.png）
```

## 典型的なワークフロー

新しい生徒が追加されたとき、または既存データを更新したいときの手順です。

1. `data/students-master.yaml` に生徒IDと名前を追記
2. `pnpm run scrape` で全件スクレイピング（追加分のみ取得）
3. `output/images/portraits/` の画像を `data/images/portrait/` にコピー
4. `pnpm run merge` で `data/students.json` を更新

特定の生徒だけ再取得したい場合は `pnpm run scrape <id>` を使います。
