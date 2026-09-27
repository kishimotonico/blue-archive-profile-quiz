# blue-archive-wiki-scraper

[ブルーアーカイブ非公式wiki](https://bluearchive.wikiru.jp/) から各生徒のプロフィールと立ち絵を取得し、クイズ用のデータを作るスクリプトです。

## ⚠️ 注意事項

このツールはクイズアプリのために限定的な利用を想定しています。実行にあたっては以下の点を守ってください。

- **短時間に大量のリクエストを送らないこと。** 全件取得は1リクエストあたり3秒以上の間隔を空けて実行します
- **取得済みのデータは再取得しないこと。** キャッシュや出力済みJSONがある場合は自動的にスキップされます
- **サイトに過度な負荷をかけないこと。** 必要最小限の処理にとどめてください

## 初回セットアップ

以降のコマンドはすべて `scrape/` ディレクトリで実行します。

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env
```

`.env` には、立ち絵をアップロードする Cloudflare R2 の情報を書きます。項目の意味は `.env.example` のコメントを見てください。

## 新しい生徒を追加する

普段の作業はこのセクションだけで完結します。

### 1. welcome を実行する

生徒IDとWikiのページ名を指定して実行します。生徒IDは英小文字の名前（例: `miyako`）、Wikiのページ名は日本語表記（例: `ミヤコ`）です。

```bash
pnpm run welcome miyako ミヤコ
```

このコマンドは次の処理をまとめて行います。

1. `data/students-master.yaml` に生徒を追記
2. Wikiから生徒データと立ち絵を取得
3. 立ち絵を `data/images/portrait/` にコピー
4. `data/students.json` を再生成
5. 立ち絵を R2 にアップロード

途中で失敗した場合は、原因を直してから同じコマンドをもう一度実行してください。登録済みの生徒はマスターに重複して追記されません。

### 2. 生成されたデータを確認する

`data/students.json` の差分を見て、プロフィールが正しく取れているか確認します。Wikiの記載が欠けていたり表記が揺れていたりすることがあるので、特に武器名などは目で確認してください。

### 3. 必要なら手修正する

おかしな値があれば `data/students.json` を直接編集し、次を実行します。

```bash
pnpm run update-overrides
```

編集した差分が `data/student-overrides.yaml` に保存されます。こうしておくと、あとで再スクレイピングして `students.json` を作り直しても手修正が残ります。

## その他のコマンド

`welcome` の中で使われているコマンドを個別に実行したいときに使います。新しい生徒を追加するだけなら使う必要はありません。

### 生徒データを取り直す

生徒IDを指定すると、その1人だけをキャッシュを使わずに取り直します。生徒IDは `data/students-master.yaml` のキーです。

```bash
pnpm run scrape aru
```

引数なしで実行すると、マスターに載っている全生徒が対象になります。取得済み（`output/students/<id>.json` がある）の生徒はスキップされます。

```bash
pnpm run scrape
```

### students.json を作り直す

`output/students/` の個別JSONをまとめ、`data/student-overrides.yaml` の手修正を重ねて `data/students.json` に出力します。マスターとJSONの件数が合わないときはエラーになります。

```bash
pnpm run merge
```

### 立ち絵をコピーし直す

取得済みの立ち絵を `data/images/portrait/` にコピーします。生徒IDを省略すると全員が対象です。コピー先に内容の違う画像がある場合は上書きせずに警告するので、上書きしたいときは `--force` を付けます。

```bash
pnpm run sync-images
pnpm run sync-images miyako
pnpm run sync-images miyako --force
```

## ディレクトリ構成

```
scrape/
├── welcome.ts             # 新規生徒追加の一括実行
├── scrape.ts              # Wikiから生徒データと画像を取得
├── merge.ts               # 個別JSONをまとめてdata/students.jsonに出力
├── update-overrides.ts    # students.jsonの手修正をoverrides.yamlに保存
├── sync-images.ts         # 立ち絵画像をdata/images/portraitへ同期
├── cache/                 # 取得済みHTMLのキャッシュ（全件実行時に利用）
└── output/
    ├── students/          # 生徒ごとのJSONファイル（<id>.json）
    └── images/portrait/   # 立ち絵画像（<id>.png）
```
