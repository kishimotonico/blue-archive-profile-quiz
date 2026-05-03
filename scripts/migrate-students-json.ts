// data/students.json を旧フラット形式から新階層形式に変換する1回限りのマイグレーションスクリプト
// 実行: pnpm exec tsx scripts/migrate-students-json.ts

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DATA_PATH = resolve(import.meta.dirname, '../data/students.json');
const INITIAL_AVAILABLE_FROM = '2026-04-21';

type OldStudent = {
  id: string;
  fullName: string;
  name: string;
  school: string;
  grade: string;
  club: string;
  age: string;
  birthday: string;
  height: string;
  hobby: string;
  weaponName: string;
  cv: string;
  portraitImage: string;
  skills: { ex: string; normal: string; passive: string; sub: string };
};

const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8')) as Record<string, OldStudent | unknown>;

// 既に新形式になっているか確認
const firstEntry = Object.values(raw)[0] as Record<string, unknown>;
if ('profile' in firstEntry) {
  console.log('Already migrated. Nothing to do.');
  process.exit(0);
}

const migrated: Record<string, unknown> = {};
for (const [id, entry] of Object.entries(raw)) {
  const student = entry as OldStudent;
  const { id: _id, portraitImage, ...profile } = student;
  migrated[id] = {
    profile,
    images: { portrait: portraitImage },
    availableFrom: INITIAL_AVAILABLE_FROM,
  };
}

writeFileSync(DATA_PATH, JSON.stringify(migrated, null, 2), 'utf-8');
console.log(`Migrated ${Object.keys(migrated).length} students. availableFrom = "${INITIAL_AVAILABLE_FROM}"`);
