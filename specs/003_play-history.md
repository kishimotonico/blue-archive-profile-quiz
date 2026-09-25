# プレイ履歴の保存仕様（案）

日替わりクイズの結果を保存する形式と、その保存層の作りを決めます。今の形式（直近100件 + スコア別件数）は、後から欲しくなる統計に足りず、形式を変えるたびにデータを捨ててきました。この案は、保存形式を「滅多に変えなくて済む形」にし、変えるときも決まった手順で済むようにするためのものです。

レビューしてほしい点は末尾の「未決」と、「将来の機能との突き合わせ」で漏れがないかです。

## 方針

- データは捨てない。全件を残し、統計は読み出し時に計算する。1件は150バイト程度で、1日1件なら10年で約550KB。localStorage の上限（5MB前後）に対して十分小さい
- 保存するのは「問題を再現するのに必要な最小の情報」と「確定した結果」だけ。問題の内容（ヒントの文言や順番）は `QuizKey` から再生成できるので持たない
- 保存形式のバージョンは中身に持ち、フィールドを足すだけの変更では上げない。上げるのは既存フィールドを消す・改名する・意味を変えるときだけ
- 進行中の状態（途中まで開示した日替わり、フリープレイの10問の途中）は履歴と寿命が違うので、別のキーに置き、この仕様には含めない
- 出題アルゴリズムのバージョン（`QuizKey.version`）と保存形式のバージョン（`schemaVersion`）は別物として管理する。前者はレコードの中の `key` に入っていて、後者は文書全体に1つ付く

## データモデル

### QuestionRecord（1問の記録）

```ts
interface QuestionRecord {
  key: QuizKey;             // { version, baseDate, seed }。問題の再現に必要
  result: QuestionResult;   // 確定した結果
  playedAt: number;         // 回答を確定した時刻（epoch ms）
}

interface QuestionResult {
  studentId: string;        // key から導けるが、生徒別の統計を再生成なしで出すために持つ
  usedHintCount: number;    // 回答確定時の開示数。1〜hints.length+1（+1 はシルエット）
  correct: boolean;
  userAnswer: string | null; // 確定回答。ギブアップは null
  score: number;            // 確定時に計算した記録。読み出し時に再計算しない
}
```

`QuestionResult` は quiz-core にある型をそのまま使います。フリープレイの1問の結果と同じ型なので、将来フリープレイの履歴を保存するときも同じ `QuestionRecord` が使えます。

`score` を持つ理由: 採点関数は `QuizKey.version` で凍結されていないので、後から採点を変えたときに過去の記録が変わらないよう、確定時の値を記録として残します。

### DailyHistory（日替わりの履歴文書）

```ts
interface DailyHistory {
  schemaVersion: 1;
  records: QuestionRecord[];  // playedAt 昇順。key.baseDate は一意
}
```

- 1日1件。`key.baseDate` を識別子にし、同じ日付の記録は追加しない（冪等）
- 並び順は `playedAt` 昇順で保存する。連続日数の計算や「最新の記録」の取得が、並べ替えなしで済む

## 保存

- localStorage のキーは `blue-archive-quiz-daily-history`。バージョンはキー名に付けない
- 中身は `DailyHistory` の JSON

### バージョンを上げる条件

| 変更の種類 | 例 | schemaVersion | 必要な作業 |
| --- | --- | --- | --- |
| フィールドを足す | 回答にかかった時間を記録する | 上げない | Valibot に `optional` で足し、正規化で既定値を埋める |
| フィールドを消す・改名する・意味を変える | `playedAt` を ISO 文字列にする | +1 | `migrations` に1つ足し、フィクスチャを1つ足す |
| 文書の構造を変える | `records` を日付キーのオブジェクトにする | +1 | 同上 |
| 保存先を変える | IndexedDB に移す | 上げない | 汎用の保存層の話。日替わりの定義は変えない |

「足すだけ」で済む設計を優先します。新しい情報が要るときは、既存のフィールドの意味を変えるのではなく、フィールドを足すことを先に考えます。

## 保存層の作り

汎用の「バージョン付き保存文書」を1つ作り、日替わりの履歴はそれに定義を渡すだけにします。

```ts
// store/persistedDocument.ts（汎用）
const dailyHistoryDocument = definePersistedDocument<DailyHistory>({
  key: "blue-archive-quiz-daily-history",
  version: 1,
  schema: dailyHistorySchema,   // Valibot。現在の形だけを知っている
  empty: { schemaVersion: 1, records: [] },
  migrations: [],               // { from: 1, migrate: (doc: unknown) => unknown } を将来足す
  legacyImports: [              // 本体キーが無いときだけ走る旧形式からの取り込み
    { key: "blue-archive-quiz-daily-results-v3", import: importDailyHistoryFromV3 },
  ],
});
```

読み込みの流れは固定です。

1. 本体キーを読む。無ければ `legacyImports` を順に試し、最初に見つかったものを取り込む
2. 中身の `schemaVersion` を見て、現在のバージョンまで `migrations` を順に当てる
3. Valibot で検証し、`optional` のフィールドに既定値を埋める。検証に落ちたら `empty` にする（壊れたデータを部分的に救う処理は入れない）
4. 読んだ形と保存されていた形が違えば（移行・取り込み・正規化が起きた）、本体キーに保存し直し、旧キーを消す

`atomWithStorage` には、この文書を包んだカスタム storage（`getItem` が上の流れ、`setItem` が保存）を渡します。読む場所が1か所になるので、controller の `store.get` や `getOnInit: true` の使い方は今のままです。

書き込みは `store/daily.ts` の write-only atom（`recordDailyResultAtom`）に閉じ、hooks や pages から `records` の構造を直接触りません。

## 旧データの取り込み

本番に出ている v3（`blue-archive-quiz-daily-results-v3`）から取り込みます。

- v3 の `recent[]`（`{ key, studentId, score, revealedHintCount, correct, timestamp }`）を `QuestionRecord` に変換する。`usedHintCount = revealedHintCount`、`userAnswer = null`、`playedAt = timestamp`
- v3 の `aggregated`（100件を超えた分のスコア別件数）は詳細が戻せないので捨てる。100日以上遊んだ利用者はいない想定
- v2 は取り込まない。v3 が出た時点で訪問時に自動移行されていて、今も v2 のままの人は v3 以降一度も来ていない
- master にある v4（`blue-archive-quiz-daily-results-v4`）は本番に出ていないので取り込まない。この仕様の実装で置き換える

取り込みは「旧 → 新」の一方向の変換で、新しい形式に制約を与えません。いつか消したくなったら `legacyImports` から1行消すだけです。

## 統計の計算

`QuestionRecord[]` を受け取る純粋関数として `quiz-core/stats.ts` に置きます。保存の形が変わっても統計側は影響を受けず、統計を増やしても保存側は変わりません。

今の画面に必要なもの: 累計挑戦回数、ベストスコア、ランク分布（SS/S/A/B/C/D の件数）。

この形で追加できるもの: 連続日数（現在・最長）、生徒別の成績（出題回数・正解率・平均ヒント数）、月別の平均点、誤答とパスの内訳（`userAnswer` の有無で判定）。

## 将来の機能との突き合わせ

| 機能 | この形で足りるか | 備考 |
| --- | --- | --- |
| 連続日数 | 足りる | `key.baseDate` の連続を数える |
| 生徒別の成績 | 足りる | `result.studentId` で集計 |
| 誤答/パスの内訳 | 足りる | `result.userAnswer` の有無 |
| 過去の問題の見直し（どんなヒントで何と答えたか） | 足りる | `key` から問題を再生成し、`userAnswer` を添える |
| フリープレイの履歴 | 型は足りる | `QuestionRecord[]` を別の文書（例: `RegularHistory { sessions: { masterKey, records }[] }`）で持つ。この仕様では作らない |
| 回答にかかった時間 | 足りない | `QuestionResult` か `QuestionRecord` に optional で足す。バージョンは上がらない |
| 開示したヒントの順番 | 足りる | `key` から再生成できる。順番は出題アルゴリズムで決まる |
| エクスポート/インポート | 足りる | `DailyHistory` の JSON をそのまま出し入れする。取り込み側は同じ読み込みの流れを通す |
| 複数端末の同期 | 足りない | 端末ごとの記録を突き合わせるには、レコードの識別子（`key.baseDate` で足りる）と競合の解決規則が要る。同期先を決めるときに考える |
| 出題アルゴリズムの更新 | 足りる | `key.version` が記録に入っているので、古い記録は古いアルゴリズムで再現できる |

## 進行中の状態との分離

- 日替わりの進捗（`blue-archive-quiz-daily-progress-v2`、`{ key, revealedHintCount }`）は今のまま。回答が確定したら消す
- フリープレイの進捗（sessionStorage）も今のまま
- どちらも「捨ててよいデータ」で、形式を変えるときは互換性を保たない

## テスト

- 過去バージョンごとの実データ相当のフィクスチャを `src/store/__fixtures__/` に置く（最初は v3 と v1）。「どのフィクスチャからでも現在の形に到達して検証を通る」テストを1本持ち、移行や取り込みを足すときはフィクスチャを1つ足す
- 読み込みの流れ: 本体キーが無く v3 がある → 取り込んで保存し、v3 を消す / 本体キーがある → v3 があっても読まない / 壊れた JSON → `empty` / 二度読んでも結果が変わらない
- `recordDailyResultAtom`: 同じ `baseDate` を二度記録しても1件 / `playedAt` 昇順が保たれる
- `quiz-core/stats.ts`: 各統計を小さな `QuestionRecord[]` で確認

## 未決

1. 全件保存でよいか。上限を設けるなら何件か（設けない案を推す）
2. フリープレイの履歴は将来ほしいか。ほしいなら、今のうちに `RegularHistory` の形（セッション単位か1問単位か）だけ決めておく
3. `QuestionRecord` に最初から入れておきたい項目はあるか（回答にかかった時間、端末や画面幅など）。後から optional で足せるので、今は最小でよいと思っている
4. v3 からの取り込みを入れるか。入れない場合は本番の履歴が消える。20行程度の変換関数とフィクスチャ1つで済むので入れる案を推す
5. `playedAt` は epoch ms のままでよいか。ISO 文字列にするなら今決める（後から変えると改名相当でバージョンが上がる）

## 見送ったもの

- 直近100件 + スコア別件数の集約（今の形式）。容量の心配が無いので廃止する
- キー名にバージョンを付ける方式。バージョンごとにキーが増え、旧キーの掃除が要る
- 保存層を jotai から切り離す（`atomWithStorage` をやめる）。統計の派生 atom が読む先は今のままでよく、切り離しても得るものがない
