import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { parse, stringify } from 'yaml';

const MASTER_PATH = '../data/students-master.yaml';
const ID_PATTERN = /^[a-z0-9_]+$/;
const ENV_FILES = ['.env.local', '.env'];

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function appendStudentIfMissing(id: string, wikiName: string): void {
  const yamlContent = readFileSync(MASTER_PATH, 'utf-8');
  const students = parse(yamlContent) as Record<string, string>;

  if (students[id]) {
    if (students[id] !== wikiName) {
      console.error(`Error: ${id} is already registered as "${students[id]}"`);
      process.exit(1);
    }
    console.log(`Student already exists in master: ${id}`);
    return;
  }

  const suffix = yamlContent.endsWith('\n') ? '' : '\n';
  writeFileSync(MASTER_PATH, `${yamlContent}${suffix}${stringify({ [id]: wikiName })}`, 'utf-8');
  console.log(`Added to master: ${id}: ${wikiName}`);
}

function loadLocalEnvFiles(): void {
  for (const path of ENV_FILES) {
    if (existsSync(path)) {
      loadEnvFile(path);
    }
  }
}

function uploadImage(id: string): void {
  loadLocalEnvFiles();

  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    console.error('Error: R2_BUCKET is not set. Set it in scrape/.env and run `pnpm run welcome` again.');
    process.exit(1);
  }

  const prefix = process.env.R2_IMAGE_PREFIX ?? 'portrait';
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
  const objectPath = `${bucket}/${normalizedPrefix}/${id}.png`;
  const filePath = `../data/images/portrait/${id}.png`;

  console.log(`\nUploading to R2: ${objectPath}`);
  run('pnpm', ['exec', 'wrangler', 'r2', 'object', 'put', objectPath, '--file', filePath, '--remote']);
}

function main() {
  const [id, wikiName] = process.argv.slice(2);

  if (!id || !wikiName) {
    console.error('Usage: pnpm run welcome <student_id> <wiki_name>');
    process.exit(1);
  }

  if (!ID_PATTERN.test(id)) {
    console.error(`Error: invalid student_id "${id}". Use lowercase letters, numbers, and underscores.`);
    process.exit(1);
  }

  if (!existsSync(MASTER_PATH)) {
    console.error(`Error: master file not found: ${MASTER_PATH}`);
    process.exit(1);
  }

  appendStudentIfMissing(id, wikiName);
  run('pnpm', ['run', 'scrape', id]);
  run('pnpm', ['run', 'sync-images', id]);
  run('pnpm', ['run', 'merge']);
  uploadImage(id);
}

main();
