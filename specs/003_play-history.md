# プレイ履歴の保存仕様（案）

日替わりクイズの結果を保存する形式と、その保存層の作りを決めます。今の形式（直近100件 + スコア別件数）は、後から欲しくなる統計に足りず、形式を変えるたびにデータを捨ててきました。この案は、保存形式を「滅多に変えなくて済む形」にし、変えるときも決まった手順で済むようにするためのものです。

実装は Opus が設計案を書き、Fable がレビューしてから進めます。

## 方針

- データは捨てない。全件を残し、統計は読み出し時に計算する。1件は150バイト程度で、1日1件なら10年で約550KB。localStorage の上限（5MB前後）に対して十分小さい
- 保存するのは「問題を再生成するのに必要な最小の情報」と「確定した結果」だけ。問題の内容（ヒントの文言や順番）は `QuizKey` と現行の生徒データから再生成できるので持たない。生徒のプロフィールを訂正すると同じ key でもヒントの文言は変わるので、当時の文言の厳密な再現は対象外とする
- 記録に無い情報は捏造しない。欠落しているフィールドは「未記録」の意味を持ち、既定値で埋めるのはその値が過去の記録にも成り立つときだけ
- 保存形式のバージョンは中身に持ち、フィールドを足すだけの変更では上げない。上げるのは既存フィールドを消す・改名する・意味を変えるときだけ
- 進行中の状態（途中まで開示した日替わり、フリープレイの10問の途中）は履歴と寿命が違うので、別のキーに置き、この仕様には含めない
- 出題アルゴリズムのバージョン（`QuizKey.version`）と保存形式のバージョン（`schemaVersion`）は別物として管理する。前者はレコードの中の `key` に入っていて、後者は文書全体に1つ付く

## データモデル

### QuestionRecord（1問の記録）

```ts
interface QuestionRecord {
  key: QuizKey;             // { version, baseDate, seed }。問題の再生成に必要
  result: RecordedResult;   // 確定した結果
  playedAt: number;         // 回答を確定した時刻（epoch ms）
}

interface RecordedResult {
  studentId: string;        // key から導けるが、生徒別の統計を再生成なしで出すために持つ
  usedHintCount: number;    // 回答確定時の開示数。1〜hints.length+1（+1 はシルエット）
  correct: boolean;
  userAnswer?: string | null; // 文字列は提出した回答、null はギブアップ、欠落は未記録（v3 からの取り込み）
  score: number;            // 確定時に計算した記録。読み出し時に再計算しない
}
```

`RecordedResult` は quiz-core の `QuestionResult`（`userAnswer: string | null` が必須）を、`userAnswer` だけ欠落を許す形にしたものです。`QuestionResult` は構造的に `RecordedResult` へそのまま代入できるので、新規の記録に変換は要りません。新規の記録では `userAnswer` を必ず書き、欠落するのは v3 から取り込んだ記録だけです。フリープレイの1問の結果も同じ `QuestionResult` なので、将来フリープレイの履歴を保存するときも同じ `QuestionRecord` が使えます。

`score` を持つ理由: 採点関数は `QuizKey.version` で凍結されていないので、後から採点を変えたときに過去の記録が変わらないよう、確定時の値を記録として残します。満点は10で固定し、ランク（SS〜D）は表示時に現在の基準で計算します。

### DailyHistory（日替わりの履歴文書）

```ts
interface DailyHistory {
  schemaVersion: 1;
  records: QuestionRecord[];  // key.baseDate 昇順。key.baseDate は一意
}
```

- 1日1件。`key.baseDate` を識別子にし、同じ日付の記録は追加しない（冪等）
- 並び順は `key.baseDate` 昇順で保存する。出題日と回答日（`playedAt`）は 4:00 をまたぐと一致しないので、日付に関する計算（連続日数・月別）は出題日 `key.baseDate` を使う

## 保存

- localStorage のキーは `blue-archive-quiz-daily-history`。バージョンはキー名に付けない
- 中身は `DailyHistory` の JSON

### バージョンを上げる条件

| 変更の種類 | 例 | schemaVersion | 必要な作業 |
| --- | --- | --- | --- |
| フィールドを足す | 回答にかかった時間を記録する | 上げない | Valibot に `optional` で足す。欠落は「未記録」として扱い、過去の記録にも成り立つ値があるときだけ既定値を埋める |
| フィールドを消す・改名する・意味を変える | `playedAt` を ISO 文字列にする | +1 | `migrations` に1つ足し、フィクスチャを1つ足す |
| optional を必須にする・受け入れる値の範囲を狭める・欠落の解釈を変える | `userAnswer` を必須にする | +1 | 同上。以前の文書が同じ意味で読めなくなる変更はすべて移行の対象 |
| 文書の構造を変える | `records` を日付キーのオブジェクトにする | +1 | 同上 |
| 保存先を変える | IndexedDB に移す | 上げない | 文書の形式は据え置ける。ただし非同期の storage になると atom と controller の読み方（`store.get` の同期読み）も変わるので、その対応とデータの転送は別途必要 |

判断の基準は「以前に書いた文書を、同じ意味のまま読める変更か」です。読めるなら据え置き、読めないなら +1。「足すだけ」で済む設計を優先し、新しい情報が要るときは既存のフィールドの意味を変えるのではなく、フィールドを足すことを先に考えます。

同じ `schemaVersion` のまま新しい optional フィールドを足したとき、更新前から開いていた別タブ（古いコード）がその文書を読んで保存し直すことがあります。未知のフィールドを落とさないよう、Valibot は文書・record・result・key のすべての階層で `looseObject` を使います。

## 保存層の作り

汎用の「バージョン付き保存文書」を1つ作り、日替わりの履歴はそれに定義を渡すだけにします。

```ts
// store/persistedDocument.ts（汎用）
const dailyHistoryDocument = definePersistedDocument<DailyHistory>({
  key: "blue-archive-quiz-daily-history",
  schema: dailyHistorySchema,   // Valibot。現在の形だけを知っている
  empty: { schemaVersion: 1, records: [] },
  migrations: [],               // { from: 1, migrate: (doc: unknown) => unknown } を将来足す
  legacyImports: [              // 本体キーが無いときだけ走る旧形式からの取り込み
    { key: "blue-archive-quiz-daily-results-v3", import: importDailyHistoryFromV3 },
  ],
});
```

中心になるのは、副作用のない変換関数 `parse(raw: string | null): T` です。

1. JSON として読む
2. 中身の `schemaVersion` を見て、現在のバージョンまで `migrations` を順に当てる
3. Valibot（全階層 `looseObject`）で検証する。検証に落ちたら `empty` を返す（壊れたデータを部分的に救う処理は入れない）

この関数は、初回の読み込み、別タブの更新の購読、将来のインポート機能の3か所から使います。購読経由の値も同じ変換を通すために、`atomWithStorage` へ渡すカスタム storage は `getItem` / `setItem` / `removeItem` / `subscribe` の4つを実装し、`getItem` と `subscribe` の両方が `parse` を呼びます。

副作用のある処理は `getItem` の側にだけ置きます。

1. 本体キーを読む。無ければ `legacyImports` を順に試し、最初に見つかったものを `parse` と同じ形に変換する
2. `parse` の結果が保存されていた文字列と違えば（移行・取り込みが起きた）、本体キーに保存し直し、取り込み元の旧キーを消す

`getItem` は `getOnInit: true` の初期化時とマウント時の2回呼ばれるので、二度呼んでも結果が変わらないことをテストで固定します。controller の `store.get` や `getOnInit: true` の使い方は今のままです。

書き込みは `store/daily.ts` の write-only atom（`recordDailyResultAtom`）に閉じ、hooks や pages から `records` の構造を直接触りません。

## 旧データの取り込み

本番に出ている v3（`blue-archive-quiz-daily-results-v3`）から取り込みます。

- v3 の `recent[]`（`{ key, studentId, score, revealedHintCount, correct, timestamp }`）を `QuestionRecord` に変換する。`usedHintCount = revealedHintCount`、`playedAt = timestamp`。`userAnswer` は v3 に無いので書かない（欠落 = 未記録）。`null` にすると誤答がすべてギブアップ扱いになるため、埋めない
- v3 の `aggregated`（100件を超えた分のスコア別件数）は詳細が戻せないので捨てる。100日以上遊んだ利用者はいない想定
- v2 は取り込まない。v3 が出た時点で訪問時に自動移行されていて、今も v2 のままの人は v3 以降一度も来ていない
- master にある v4（`blue-archive-quiz-daily-results-v4`）は本番に出ていないので取り込まない。この仕様の実装で置き換える

取り込みは「旧 → 新」の一方向の変換です。新しい形式に与える影響は `userAnswer` の欠落を許すことだけで、これは「欠落 = 未記録」の一般規則と同じです。いつか消したくなったら `legacyImports` から1行消すだけです。

## 統計の計算

`QuestionRecord[]` を受け取る純粋関数として `quiz-core/stats.ts` に置きます。保存の形が変わっても統計側は影響を受けず、統計を増やしても保存側は変わりません。

今の画面に必要なもの: 累計挑戦回数、ベストスコア、ランク分布（SS/S/A/B/C/D の件数）。

この形で追加できるもの: 連続日数（現在・最長。`key.baseDate` の連続で数える）、生徒別の成績（出題回数・正解率・平均ヒント数）、月別の平均点（出題月で集計）、誤答とパスの内訳（`userAnswer` が文字列なら誤答、`null` ならパス、欠落なら内訳の対象外）。

## 将来の機能との突き合わせ

| 機能 | この形で足りるか | 備考 |
| --- | --- | --- |
| 連続日数 | 足りる | `key.baseDate` の連続を数える |
| 生徒別の成績 | 足りる | `result.studentId` で集計 |
| 誤答/パスの内訳 | 足りる | `result.userAnswer` の有無 |
| 過去の問題の見直し（どんなヒントで何と答えたか） | 足りる | `key` から現行の生徒データで問題を再生成し、`userAnswer` を添える。プロフィール訂正後は当時と文言が変わることがある。v3 から取り込んだ記録は回答が未記録 |
| 採点基準の変更 | 足りる | 確定点は `score` に残る。満点10は固定、ランクは現在の基準で再計算。満点や採点規則まで変えるなら、そのとき採点規則の版を record に足す |
| フリープレイの履歴 | 型は足りる | `QuestionRecord[]` を別の文書（例: `RegularHistory { sessions: { masterKey, records }[] }`）で持つ。この仕様では作らない |
| 回答にかかった時間 | 足りない | `QuestionResult` か `QuestionRecord` に optional で足す。バージョンは上がらない |
| 開示したヒントの順番 | 足りる | `key` から再生成できる。順番は出題アルゴリズムで決まる |
| エクスポート/インポート | 足りる | `DailyHistory` の JSON をそのまま出し入れする。取り込み側は `parse`（移行・検証）を再利用し、旧キー探索や削除は通さない。既存の履歴と置換するか `baseDate` でマージするかは機能を作るときに決める |
| 複数端末の同期 | 足りない | 端末ごとの記録を突き合わせるには、レコードの識別子（`key.baseDate` で足りる）と競合の解決規則が要る。同期先を決めるときに考える |
| 出題アルゴリズムの更新 | 足りる | `key.version` が記録に入っているので、古い記録は古いアルゴリズムで再現できる |

## 進行中の状態との分離

- 日替わりの進捗（`blue-archive-quiz-daily-progress-v2`、`{ key, revealedHintCount }`）は今のまま。回答が確定したら消す
- フリープレイの進捗（sessionStorage）も今のまま
- どちらも「捨ててよいデータ」で、形式を変えるときは互換性を保たない

## テスト

- 過去バージョンごとの実データ相当のフィクスチャを `src/store/__fixtures__/` に置く（最初は v3 と v1）。「どのフィクスチャからでも現在の形に到達して検証を通る」テストを1本持ち、移行や取り込みを足すときはフィクスチャを1つ足す。同じバージョン内で optional を足したときも、足す前のフィクスチャを残して欠落の扱いを確認する
- `parse`: 壊れた JSON → `empty` / 未知のフィールドが全階層で保持される / v3 のフィクスチャで `userAnswer` が欠落のまま
- `getItem`: 本体キーが無く v3 がある → 取り込んで保存し、v3 を消す / 本体キーがある → v3 があっても読まない / 二度読んでも結果が変わらない
- `subscribe`: 別タブの storage イベントで届いた値も `parse` を通る
- `recordDailyResultAtom`: 同じ `baseDate` を二度記録しても1件 / `key.baseDate` 昇順が保たれる
- `quiz-core/stats.ts`: 各統計を小さな `QuestionRecord[]` で確認

## 決めたこと

- 全件保存にする。上限は設けない
- フリープレイの履歴は今は作らない。`QuestionRecord` をフリープレイと共通の型にしておくのはコストが無いので、そのままにする
- `QuestionRecord` の項目は最小のまま。回答にかかった時間などは要るときに optional で足す
- v3 からの取り込みを入れる。回答は未記録のまま取り込み、捏造しない
- `playedAt` は epoch ms のまま。日替わりの識別日は `key.baseDate`

## レビューの経緯

Astra のレビュー（2026-09-25）で次を直しました。v3 の回答を `null` にすると誤答がギブアップ扱いになる点、`QuizKey` では当時の生徒データまで固定できない点、optional 追加時の欠落値と未知フィールドの扱い、カスタム storage の `subscribe` も検証を通す必要がある点、IndexedDB 化は adapter の交換だけでは済まない点。

## 見送ったもの

- 直近100件 + スコア別件数の集約（今の形式）。容量の心配が無いので廃止する
- キー名にバージョンを付ける方式。バージョンごとにキーが増え、旧キーの掃除が要る
- 保存層を jotai から切り離す（`atomWithStorage` をやめる）。統計の派生 atom が読む先は今のままでよく、切り離しても得るものがない
