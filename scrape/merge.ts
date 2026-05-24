import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const MASTER_PATH = '../data/students-master.yaml';
const OVERRIDES_PATH = '../data/student-overrides.yaml';
const INPUT_DIR = './output/students';
const OUTPUT_PATH = '../data/students.json';

type Profile = Record<string, unknown> & {
  skills?: Record<string, unknown>;
};

type StudentOverride = {
  profile?: Profile;
  images?: {
    portrait?: string;
  };
  availableFrom?: never;
};

type ExistingStudent = {
  availableFrom?: string | null;
};

// JST 4:00 = UTC+5 0:00 (src/quiz-core からは import しない)
const QUIZ_DAY_OFFSET_MS = 5 * 60 * 60 * 1000;

function getNextQuizDate(): string {
  const now = new Date();
  const quizDay = new Date(now.getTime() + QUIZ_DAY_OFFSET_MS);
  const next = new Date(
    Date.UTC(quizDay.getUTCFullYear(), quizDay.getUTCMonth(), quizDay.getUTCDate() + 1),
  );
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

function readOverrides(masterIds: Set<string>): Record<string, StudentOverride> {
  if (!existsSync(OVERRIDES_PATH)) {
    return {};
  }

  const overrides = parse(readFileSync(OVERRIDES_PATH, 'utf-8')) as Record<string, StudentOverride> | null;
  if (!overrides) {
    return {};
  }

  const errors: string[] = [];
  for (const [id, override] of Object.entries(overrides)) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) {
      errors.push(`${id}: override はオブジェクトで指定してください`);
      continue;
    }

    if (!masterIds.has(id)) {
      errors.push(`${id}: students-master.yaml に存在しない生徒です`);
    }

    if ('availableFrom' in override) {
      errors.push(`${id}: availableFrom は override できません`);
    }
  }

  if (errors.length > 0) {
    console.error('Error: Invalid student overrides:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  return overrides;
}

function mergeProfile(profile: Profile, override: StudentOverride | undefined): Profile {
  if (!override?.profile) {
    return profile;
  }

  const { skills: overrideSkills, ...overrideProfile } = override.profile;

  return {
    ...profile,
    ...overrideProfile,
    skills: {
      ...(profile.skills ?? {}),
      ...(overrideSkills ?? {}),
    },
  };
}

function getAvailableFrom(existing: Record<string, ExistingStudent>, id: string, defaultAvailableFrom: string): string | null {
  if (Object.prototype.hasOwnProperty.call(existing, id)) {
    return existing[id].availableFrom ?? null;
  }

  return defaultAvailableFrom;
}

function main() {
  const yamlContent = readFileSync(MASTER_PATH, 'utf-8');
  const masterStudents: Record<string, string> = parse(yamlContent);
  const masterIds = new Set(Object.keys(masterStudents));
  const overrides = readOverrides(masterIds);

  const jsonFiles = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.json'));
  const jsonIds = new Set(jsonFiles.map((f) => f.replace('.json', '')));

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

  // 既存の students.json から availableFrom を継承する
  const existing: Record<string, ExistingStudent> = existsSync(OUTPUT_PATH)
    ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
    : {};

  // 新規生徒のデフォルト availableFrom は翌クイズ日（進行中のクイズに混入しない）
  const defaultAvailableFrom = getNextQuizDate();

  const students: Record<string, unknown> = {};
  for (const id of Object.keys(masterStudents)) {
    const raw = JSON.parse(readFileSync(`${INPUT_DIR}/${id}.json`, 'utf-8'));

    // 現行の個別 JSON は id / portraitImage を含むので profile に入れる前に除去する
    // これで StudentEntry.profile の型と実体が一致する
    const { id: _id, portraitImage: _portrait, ...profile } = raw;
    const override = overrides[id];

    students[id] = {
      profile: mergeProfile(profile, override),
      images: {
        portrait: override?.images?.portrait ?? `images/portrait/${id}.png`,
      },
      availableFrom: getAvailableFrom(existing, id, defaultAvailableFrom),
    };
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(students, null, 2), 'utf-8');
  console.log(`Merged ${Object.keys(students).length} students to ${OUTPUT_PATH}`);
}

main();
