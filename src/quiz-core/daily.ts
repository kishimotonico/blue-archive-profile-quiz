/**
 * 日替わりクイズ用のシード生成
 * 4:00 JST で日付が切り替わる
 */

/**
 * 現在の日替わりクイズの日付を取得（4:00 JST基準）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getDailyDate(): string {
  const now = new Date();

  // JSTに変換（UTC+9）
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstTime = new Date(now.getTime() + jstOffset);

  // 4:00より前の場合は前日とする
  if (jstTime.getHours() < 4) {
    jstTime.setDate(jstTime.getDate() - 1);
  }

  // YYYY-MM-DD形式で返す
  const year = jstTime.getFullYear();
  const month = String(jstTime.getMonth() + 1).padStart(2, '0');
  const day = String(jstTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 日付文字列からシードを生成
 */
export function dateToSeed(date: string): number {
  // YYYY-MM-DD を数値に変換
  const [year, month, day] = date.split('-').map(Number);
  // 日付を一意の数値に変換
  return year * 10000 + month * 100 + day;
}

/**
 * 現在の日替わりクイズ用のシードを取得
 */
export function getDailySeed(): number {
  const date = getDailyDate();
  return dateToSeed(date);
}

/**
 * 特定の日付の日替わりクイズ用のシードを取得
 */
export function getSeedForDate(date: string): number {
  return dateToSeed(date);
}
