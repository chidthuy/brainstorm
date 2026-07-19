import { describe, it, expect } from 'vitest';
import { createJob, getJob } from '../server/jobs.js';

function fakeRes() {
  const chunks = [];
  return {
    chunks,
    setHeader() {}, flushHeaders() {},
    write(s) { chunks.push(s); },
    on() {}
  };
}

describe('jobs', () => {
  it('replays buffered events to late subscriber', () => {
    const job = createJob();
    job.emit('stage', { stage: 'content' });
    const res = fakeRes();
    job.subscribe(res);
    expect(res.chunks.join('')).toContain('"stage":"content"');
  });

  it('streams new events to existing subscriber and marks done', () => {
    const job = createJob();
    const res = fakeRes();
    job.subscribe(res);
    job.finish('done', { reportId: 'r1' });
    expect(res.chunks.join('')).toContain('"reportId":"r1"');
    expect(getJob(job.id).finished).toBe(true);
  });

  it('getJob returns undefined for unknown id', () => {
    expect(getJob('nope')).toBeUndefined();
  });
});
