import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';

const SOURCE_DIR = './output/images/portrait';
const TARGET_DIR = '../data/images/portrait';

function parseArgs(): { targetId: string | null; force: boolean } {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const positional = args.filter((arg) => arg !== '--force');

  if (positional.length > 1) {
    console.error('Usage: pnpm run sync-images [student_id] [--force]');
    process.exit(1);
  }

  return { targetId: positional[0] ?? null, force };
}

function filesAreEqual(sourcePath: string, targetPath: string): boolean {
  return readFileSync(sourcePath).equals(readFileSync(targetPath));
}

function listSourceFiles(): string[] {
  if (!existsSync(SOURCE_DIR)) {
    return [];
  }

  return readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.png')).sort();
}

function main() {
  const { targetId, force } = parseArgs();
  mkdirSync(TARGET_DIR, { recursive: true });

  const sourceFiles = listSourceFiles();
  if (sourceFiles.length === 0) {
    console.error(`Error: Image source files not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const targetFiles = targetId ? [`${targetId}.png`] : sourceFiles;

  let copied = 0;
  let skipped = 0;
  let different = 0;
  let missing = 0;

  for (const file of targetFiles) {
    const sourcePath = `${SOURCE_DIR}/${file}`;
    const targetPath = `${TARGET_DIR}/${basename(file)}`;

    if (!existsSync(sourcePath)) {
      console.error(`Missing source image: ${file}`);
      missing++;
      continue;
    }

    if (existsSync(targetPath) && !force) {
      if (filesAreEqual(sourcePath, targetPath)) {
        skipped++;
      } else {
        console.warn(`Different image exists, skipped: ${targetPath}`);
        different++;
      }
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    copied++;
  }

  console.log(`Image sync completed: ${copied} copied, ${skipped} skipped, ${different} different, ${missing} missing`);

  if (missing > 0) {
    process.exit(1);
  }
}

main();
