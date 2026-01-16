import { chromium, Page } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

// 生徒データの型定義
type StudentData = {
  id: string;
  fullName: string | null;
  name: string | null;
  school: string | null;
  club: string | null;
  age: string | null;
  birthday: string | null;
  height: string | null;
  hobby: string | null;
  weaponName: string | null;
  cv: string | null;
  portraitImage: string | null;
  skills: {
    ex: string | null;
    normal: string | null;
    passive: string | null;
    sub: string | null;
  };
};

const BASE_URL = 'https://bluearchive.wikiru.jp/';
const OUTPUT_DIR = './output/students';
const IMAGE_DIR = './output/images/portrait';
const CACHE_DIR = './cache';

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));
}

async function scrapeStudentData(page: Page, studentId: string): Promise<{ data: StudentData; imageUrl: string | null }> {
  // 基本情報テーブル内のテキストを取得するヘルパー関数（ルビを除外）
  const getProfileValue = async (label: string): Promise<string | null> => {
    const cell = page.locator(`//h2[contains(text(), "基本情報")]/following-sibling::div[1]//table//th[contains(text(), "${label}")]/following-sibling::td[1]`);
    if (await cell.count() > 0) {
      // <rt>タグ（ルビ）と<rp>タグ（括弧）を除外してテキストを取得
      const text = await cell.evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('rt, rp').forEach((node) => node.remove());
        return clone.textContent || '';
      });
      return text.trim();
    }
    return null;
  };

  // 基本情報の取得
  const name = await getProfileValue('名前');
  const fullName = await getProfileValue('フルネーム');
  const school = await getProfileValue('学園');
  const club = await getProfileValue('部活');
  const age = await getProfileValue('年齢');
  const birthday = await getProfileValue('誕生日');
  const height = await getProfileValue('身長');
  const hobby = await getProfileValue('趣味');
  const cv = await getProfileValue('CV');

  // 武器名の取得
  const weaponLocator = page.locator('//h2[contains(text(), "固有武器")]/following-sibling::div[1]//table//th[@colspan]');
  let weaponName: string | null = null;
  if (await weaponLocator.count() > 0) {
    weaponName = (await weaponLocator.first().innerText()).trim();
  }

  // 立ち絵画像URLの取得
  const portraitLocator = page.locator('//h2[contains(text(), "基本情報")]/following-sibling::div[1]//table//td[@rowspan]//img');
  let imageUrl: string | null = null;
  if (await portraitLocator.count() > 0) {
    const src = await portraitLocator.getAttribute('src');
    if (src) imageUrl = new URL(src, BASE_URL).toString();
  }

  // スキル名の取得
  const getSkillName = async (sectionText: string): Promise<string | null> => {
    const header = page.locator(`//h3[contains(text(), "${sectionText}")]`).first();
    if (await header.count() === 0) return null;

    const tableLocator = header.locator('xpath=/following-sibling::div[1]//table/thead/tr[1]');
    if (await tableLocator.count() === 0) return null;

    // colspan属性を持つthを優先的に探す
    const colspanTh = tableLocator.locator('th[colspan]').first();
    if (await colspanTh.count() > 0) {
      return (await colspanTh.innerText()).trim();
    }

    // 最初のセルがthかtdかで取得位置を変える
    const firstCell = tableLocator.locator('th, td').first();
    const firstCellTag = await firstCell.evaluate((el) => el.tagName.toLowerCase());

    if (firstCellTag === 'th') {
      // アイコンがth → 2番目のthがスキル名
      const secondTh = tableLocator.locator('th:nth-of-type(2)');
      if (await secondTh.count() > 0) {
        return (await secondTh.innerText()).trim();
      }
    } else {
      // アイコンがtd → 1番目のthがスキル名
      const firstTh = tableLocator.locator('th:nth-of-type(1)');
      if (await firstTh.count() > 0) {
        return (await firstTh.innerText()).trim();
      }
    }

    return null;
  };

  const exSkill = await getSkillName('EXスキル');
  const normalSkill = await getSkillName('ノーマルスキル');
  const passiveSkill = await getSkillName('パッシブスキル');
  const subSkill = await getSkillName('サブスキル');

  return {
    data: {
      id: studentId,
      fullName,
      name,
      school,
      club,
      age,
      birthday,
      height,
      hobby,
      weaponName,
      cv,
      portraitImage: imageUrl ? `images/portrait/${studentId}.png` : null,
      skills: {
        ex: exSkill,
        normal: normalSkill,
        passive: passiveSkill,
        sub: subSkill,
      },
    },
    imageUrl,
  };
}

async function processStudent(
  page: Page,
  studentId: string,
  studentName: string,
  useCache: boolean
): Promise<void> {
  const cachePath = `${CACHE_DIR}/${studentId}.html`;
  const jsonPath = `${OUTPUT_DIR}/${studentId}.json`;
  const imagePath = `${IMAGE_DIR}/${studentId}.png`;

  // キャッシュからHTMLを読み込むか、Webから取得
  if (useCache && existsSync(cachePath)) {
    console.log(`  -> Using cached HTML`);
    const html = readFileSync(cachePath, 'utf-8');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
  } else {
    const url = `${BASE_URL}?${encodeURIComponent(studentName)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // HTMLをキャッシュに保存
    const html = await page.content();
    writeFileSync(cachePath, html, 'utf-8');
    console.log(`  -> HTML cached`);

    // サーバー負荷軽減のため少し待機
    await page.waitForTimeout(500);
  }

  const { data, imageUrl } = await scrapeStudentData(page, studentId);

  // 画像をダウンロード
  if (imageUrl) {
    await downloadImage(imageUrl, imagePath);
    console.log(`  -> Image saved: ${imagePath}`);
  }

  // JSONを保存
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  -> OK: ${data.name}`);
}

async function main() {
  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const targetStudentId = args[0] || null;

  // 生徒マスターデータを読み込み
  const yamlContent = readFileSync('../data/students-master.yaml', 'utf-8');
  const students: Record<string, string> = parse(yamlContent);

  // 単体実行時のバリデーション
  if (targetStudentId && !students[targetStudentId]) {
    console.error(`Error: Student ID "${targetStudentId}" not found in students-master.yaml`);
    process.exit(1);
  }

  // 出力ディレクトリを作成
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(IMAGE_DIR, { recursive: true });
  mkdirSync(CACHE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 単体実行モード
  if (targetStudentId) {
    const studentName = students[targetStudentId];
    console.log(`Scraping: ${studentName} (${targetStudentId})`);

    try {
      // 単体実行時はキャッシュを使わない（再取得目的のため）
      await processStudent(page, targetStudentId, studentName, false);
    } catch (error) {
      console.error(`  -> Error: ${error}`);
    }

    await browser.close();
    return;
  }

  // 全件実行モード
  const entries = Object.entries(students);
  let processed = 0;
  let skipped = 0;

  for (const [studentId, studentName] of entries) {
    const jsonPath = `${OUTPUT_DIR}/${studentId}.json`;

    // 既に処理済みならスキップ
    if (existsSync(jsonPath)) {
      skipped++;
      console.log(`Skip: ${studentName} (${studentId}) - already exists`);
      continue;
    }

    console.log(`[${processed + skipped + 1}/${entries.length}] Scraping: ${studentName} (${studentId})`);

    try {
      await processStudent(page, studentId, studentName, true);
      processed++;
    } catch (error) {
      console.error(`  -> Error: ${error}`);
    }
  }

  await browser.close();

  console.log(`\nCompleted: ${processed} processed, ${skipped} skipped`);
}

main().catch(console.error);
