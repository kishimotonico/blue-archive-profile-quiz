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

### 新しい生徒を追加

生徒IDとWiki上のページ名を指定すると、マスターへの追記、対象生徒のスクレイピング、画像同期、`data/students.json` の再生成まで実行します。

たとえば `data/students-master.yaml` に `miyako: ミヤコ` と追加したい場合は、左側の `miyako` が生徒ID、右側の `ミヤコ` がWiki上のページ名です。

```bash
pnpm run add-student miyako ミヤコ
```

生徒IDは英小文字、数字、アンダースコアで指定します。既に登録済みの生徒IDを指定した場合は、マスター上の名前と一致しているときだけ後続処理を実行します。処理の最後に、R2 へ画像をアップロードするためのコマンドが表示されます。

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

`data/student-overrides.yaml` が存在する場合は、Wiki由来データに手修正を重ねてから出力します。`availableFrom` は既存の `data/students.json` から継承するため、override では指定できません。

```bash
pnpm run merge
```

### 画像の同期

スクレイピング済みの立ち絵画像を `data/images/portrait/` に同期します。既存画像と内容が異なる場合は、デフォルトでは上書きせず警告します。

```bash
pnpm run sync-images
pnpm run sync-images miyako
pnpm run sync-images miyako --force
```

### 画像アップロードコマンド

`pnpm run add-student <id> <wiki_name>` の最後に、追加した生徒の画像アップロードコマンドを表示します。`R2_BUCKET` が環境変数、`.env.local`、`.env` のいずれかにあればその値を使い、なければ `R2_BUCKET` というプレースホルダーを出力します。ローカルの値は `scrape/.env.local` に置くのを推奨します。

```bash
R2_BUCKET=your-bucket-name
R2_IMAGE_PREFIX=images/portrait
```

`R2_IMAGE_PREFIX` は省略できます。省略時は `images/portrait` です。

## ディレクトリ構成

```
scrape/
├── add-student.ts         # 新規追加用の一括実行コマンド
├── merge.ts               # 個別JSONをまとめてdata/students.jsonに出力
├── scrape.ts              # Wikiから生徒データと画像を取得
├── sync-images.ts         # 立ち絵画像をdata/images/portraitへ同期
├── cache/                 # 取得済みHTMLのキャッシュ（全件実行時に利用）
└── output/
    ├── students/          # 生徒ごとのJSONファイル（<id>.json）
    └── images/portrait/   # 立ち絵画像（<id>.png）
```

## 典型的なワークフロー

新しい生徒が追加されたとき、または既存データを更新したいときの手順です。

1. `pnpm run add-student miyako ミヤコ` のように追加コマンドを実行
2. 必要に応じて `data/student-overrides.yaml` に手修正を追加
3. 手修正を追加した場合は `pnpm run merge` を実行
4. `add-student` の最後に表示された画像アップロードコマンドをコピーして実行

特定の生徒だけ再取得したい場合は `pnpm run scrape <id>` を使います。
