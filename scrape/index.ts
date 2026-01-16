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
  portraitImageUrl: string | null;
  skills: {
    ex: string | null;
    normal: string | null;
    passive: string | null;
    sub: string | null;
  };
};

async function scrapeStudentData(page: Page, studentId: string): Promise<StudentData> {
  const baseUrl = 'https://bluearchive.wikiru.jp/';

  // 基本情報テーブル内のテキストを取得するヘルパー関数
  const getProfileValue = async (label: string): Promise<string | null> => {
    const cell = page.locator(`//h2[contains(text(), "基本情報")]/following-sibling::div[1]//table//th[contains(text(), "${label}")]/following-sibling::td[1]`);
    if (await cell.count() > 0) {
      return (await cell.innerText()).trim();
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

  // 立ち絵画像の取得
  const portraitLocator = page.locator('//h2[contains(text(), "基本情報")]/following-sibling::div[1]//table//td[@rowspan]//img');
  let portraitImageUrl: string | null = null;
  if (await portraitLocator.count() > 0) {
    const src = await portraitLocator.getAttribute('src');
    if (src) portraitImageUrl = new URL(src, baseUrl).toString();
  }

  // スキル名の取得
  const getSkillName = async (sectionText: string): Promise<string | null> => {
    const header = page.locator(`//h3[contains(text(), "${sectionText}")]`);
    if (await header.count() === 0) return null;

    const skillNameLocator = header.locator('xpath=/following-sibling::div[1]//table//th').nth(0);
    if (await skillNameLocator.count() > 0) {
      return (await skillNameLocator.innerText()).trim();
    }
    return null;
  };

  const exSkill = await getSkillName('EXスキル');
  const normalSkill = await getSkillName('ノーマルスキル');
  const passiveSkill = await getSkillName('パッシブスキル');
  const subSkill = await getSkillName('サブスキル');

  return {
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
    portraitImageUrl,
    skills: {
      ex: exSkill,
      normal: normalSkill,
      passive: passiveSkill,
      sub: subSkill,
    },
  };
}

async function main() {
  // 生徒マスターデータを読み込み
  const yamlContent = readFileSync('../data/students-master.yaml', 'utf-8');
  const students: Record<string, string> = parse(yamlContent);

  // 出力ディレクトリを作成
  const outputDir = './output';
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: StudentData[] = [];

  for (const [studentId, studentName] of Object.entries(students)) {
    const url = `https://bluearchive.wikiru.jp/?${encodeURIComponent(studentName)}`;
    console.log(`Scraping: ${studentName} (${studentId}) - ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const data = await scrapeStudentData(page, studentId);
      results.push(data);
      console.log(`  -> OK: ${data.name}`);
    } catch (error) {
      console.error(`  -> Error: ${error}`);
    }

    // サーバー負荷軽減のため少し待機
    await page.waitForTimeout(500);
  }

  await browser.close();

  // 結果をJSON出力
  const outputPath = `${outputDir}/students.json`;
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nOutput saved to: ${outputPath}`);
}

main().catch(console.error);
