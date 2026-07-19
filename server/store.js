import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_DIR = join(process.cwd(), 'data');
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

async function readIndex(dir) {
  try {
    return JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'));
  } catch {
    return [];
  }
}

export async function saveReport(report, dataDir = DEFAULT_DIR) {
  if (!SAFE_ID.test(report.id)) throw new Error('invalid report id');
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, `${report.id}.json`), JSON.stringify(report, null, 2));
  const index = (await readIndex(dataDir)).filter(e => e.id !== report.id);
  index.push({
    id: report.id,
    createdAt: report.createdAt,
    title: report.video?.title ?? '(không rõ tiêu đề)',
    verdict: report.verdict?.verdict ?? null
  });
  index.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await writeFile(join(dataDir, 'index.json'), JSON.stringify(index, null, 2));
}

export async function getReport(id, dataDir = DEFAULT_DIR) {
  if (!SAFE_ID.test(id)) return null;
  try {
    return JSON.parse(await readFile(join(dataDir, `${id}.json`), 'utf8'));
  } catch {
    return null;
  }
}

export async function listReports(dataDir = DEFAULT_DIR) {
  return readIndex(dataDir);
}
