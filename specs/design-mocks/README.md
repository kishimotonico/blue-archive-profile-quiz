# デザインモック

wip/design-renewal でのデザイン刷新時に作った静的HTMLモックです。ブラウザで直接開いて確認できます。

## 採用案

- `game-ui-v2.html`: 全体の方向性（配色・フォント・部品）。`src/index.css` のデザイントークンはこのモックの CSS 変数に対応しています
- `quiz-desktop-a.html`: デスクトップのクイズ画面レイアウト（ヒント2列＋右カラムに立ち絵と回答欄）

実装ではその後、装飾を整理しています（英語タグ・ストライプ帯・グラデーションの削減など）。見た目の正は実装側で、モックは経緯の記録として残しています。

## 不採用案

- `game-ui.html`: game-ui-v2 の初版
- `dossier.html`: 機密調書風
- `momotalk.html`: チャット風
- `seito-techo.html`: 生徒手帳風
- `quiz-desktop-b.html`: デスクトップ案B（下部にフル幅の回答バー）
- `quiz-desktop-c.html`: デスクトップ案C（中央に立ち絵、ヒントを左右に配置）
