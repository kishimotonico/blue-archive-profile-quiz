import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { stringify } from 'yaml';

const STUDENTS_PATH = '../data/students.json';
const SCRAPED_DIR = './output/students';
const OVERRIDES_PATH = '../data/student-overrides.yaml';

function main() {
  const students = JSON.parse(readFileSync(STUDENTS_PATH, 'utf-8'));
  const overrides: Record<string, Record<string, unknown>> = {};

  for (const [id, entry] of Object.entries<any>(students)) {
    const scrapedPath = `${SCRAPED_DIR}/${id}.json`;
    if (!existsSync(scrapedPath)) continue;

    const raw = JSON.parse(readFileSync(scrapedPath, 'utf-8'));
    const { id: _id, portraitImage: _portrait, ...scraped } = raw;

    const profileDiff: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry.profile as Record<string, unknown>)) {
      if (key === 'skills') continue;
      if (value !== scraped[key]) {
        profileDiff[key] = value;
      }
    }

    const currentSkills = (entry.profile.skills ?? {}) as Record<string, unknown>;
    const scrapedSkills = (scraped.skills ?? {}) as Record<string, unknown>;
    const skillsDiff: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(currentSkills)) {
      if (value !== scrapedSkills[key]) {
        skillsDiff[key] = value;
      }
    }
    if (Object.keys(skillsDiff).length > 0) {
      profileDiff.skills = skillsDiff;
    }

    const defaultPortrait = `images/portrait/${id}.png`;
    const hasImageOverride = entry.images?.portrait !== defaultPortrait;

    if (Object.keys(profileDiff).length > 0 || hasImageOverride) {
      const override: Record<string, unknown> = {};
      if (Object.keys(profileDiff).length > 0) override.profile = profileDiff;
      if (hasImageOverride) override.images = { portrait: entry.images.portrait };
      overrides[id] = override;
    }
  }

  if (Object.keys(overrides).length === 0) {
    console.log('No overrides needed');
    if (existsSync(OVERRIDES_PATH)) {
      unlinkSync(OVERRIDES_PATH);
      console.log(`Removed ${OVERRIDES_PATH}`);
    }
    return;
  }

  writeFileSync(OVERRIDES_PATH, stringify(overrides), 'utf-8');
  for (const [id, override] of Object.entries(overrides)) {
    const profile = (override.profile ?? {}) as Record<string, unknown>;
    const { skills, ...flat } = profile;
    const fields = [
      ...Object.keys(flat),
      ...Object.keys((skills ?? {}) as Record<string, unknown>).map((k) => `skills.${k}`),
      ...(override.images ? ['images.portrait'] : []),
    ];
    console.log(`  ${id}: ${fields.join(', ')}`);
  }
  console.log(`Updated ${OVERRIDES_PATH} (${Object.keys(overrides).length} students)`);
}

main();
