import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveReport, getReport, listReports } from '../server/store.js';

let dir;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'store-')); });

const mk = (id, title, createdAt) => ({
  id, createdAt,
  video: { title },
  verdict: { verdict: 'WATCH', confidence: 'high', reasons: [] }
});

describe('store', () => {
  it('round-trips a report', async () => {
    await saveReport(mk('abc', 'Video A', '2026-07-19T00:00:00Z'), dir);
    const got = await getReport('abc', dir);
    expect(got.video.title).toBe('Video A');
  });

  it('returns null for missing report', async () => {
    expect(await getReport('nope', dir)).toBeNull();
  });

  it('lists newest first with summary fields', async () => {
    await saveReport(mk('a', 'Old', '2026-07-18T00:00:00Z'), dir);
    await saveReport(mk('b', 'New', '2026-07-19T00:00:00Z'), dir);
    const list = await listReports(dir);
    expect(list.map(r => r.id)).toEqual(['b', 'a']);
    expect(list[0]).toMatchObject({ title: 'New', verdict: 'WATCH' });
  });

  it('rejects path-traversal ids', async () => {
    expect(await getReport('../etc/passwd', dir)).toBeNull();
  });
});
