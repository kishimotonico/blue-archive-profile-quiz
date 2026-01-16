import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

const MASTER_PATH = '../data/students-master.yaml';
const INPUT_DIR = './output/students';
const OUTPUT_PATH = '../data/students.json';

function main() {
  // マスターデータを読み込み
  const yamlContent = readFileSync(MASTER_PATH, 'utf-8');
  const masterStudents: Record<string, string> = parse(yamlContent);
  const masterIds = new Set(Object.keys(masterStudents));

  // 個別JSONファイルを取得
  const jsonFiles = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.json'));
  const jsonIds = new Set(jsonFiles.map((f) => f.replace('.json', '')));

  // 過不足チェック
  const missing = [...masterIds].filter((id) => !jsonIds.has(id));
  const extra = [...jsonIds].filter((id) => !masterIds.has(id));

  if (missing.length > 0) {
    console.error('Error: Missing students (in master but no JSON):');
    missing.forEach((id) => console.error(`  - ${id} (${masterStudents[id]})`));
  }

  if (extra.length > 0) {
    console.error('Error: Extra students (JSON exists but not in master):');
    extra.forEach((id) => console.error(`  - ${id}`));
  }

  if (missing.length > 0 || extra.length > 0) {
    process.exit(1);
  }

  // 全JSONを読み込んでマージ（IDをキーにしたオブジェクト）
  const students: Record<string, unknown> = {};
  for (const id of Object.keys(masterStudents)) {
    const jsonPath = `${INPUT_DIR}/${id}.json`;
    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    students[id] = data;
  }

  // 出力
  writeFileSync(OUTPUT_PATH, JSON.stringify(students, null, 2), 'utf-8');
  console.log(`Merged ${Object.keys(students).length} students to ${OUTPUT_PATH}`);
}

main();
