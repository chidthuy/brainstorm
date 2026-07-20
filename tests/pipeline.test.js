import { describe, it, expect } from 'vitest';
import { runScreening } from '../server/pipeline.js';
import { FALLBACK_SCORE } from '../server/passes/compose.js';

const video = {
  id: 'abc12345678', title: 'T', channel: 'C', durationSec: 3600, viewCount: 100,
  transcript: [{ text: 'hello', start: 0 }],
  comments: [{ text: 'great', likes: 1 }]
};

const CONTENT = {
  author: 'a',
  summary: { theme: 't', highlights: 'h', conclusion: 'c', takeaway: 'k' },
  outline: [], stance: [], facts: ['f1'], focusAnswer: null
};
const FACTCHECK = { claims: [{ claim: 'f1', verdict: 'solid', note: '', sources: [] }] };
const SOCIAL = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
const RECOMMEND = { items: [{ title: 'x', channel: 'c', url: 'http://x', why: 'w' }] };
const SCORE = { score: 82, label: 'Đáng nghe trọn', reasons: ['r'] };

function fakeClaude(byPass) {
  return async ({ system }) => {
    if (system.includes('"author"')) return byPass.content ?? JSON.stringify(CONTENT);
    if (system.includes('fact-checker')) return byPass.factcheck ?? JSON.stringify(FACTCHECK);
    if (system.includes('social signals')) return byPass.social ?? JSON.stringify(SOCIAL);
    if (system.includes('gợi ý')) return byPass.recommend ?? JSON.stringify(RECOMMEND);
    if (system.includes('chấm điểm')) return byPass.compose ?? JSON.stringify(SCORE);
    throw new Error('unknown pass: ' + system.slice(0, 40));
  };
}

describe('runScreening', () => {
  it('happy path fills all sections and emits stages', async () => {
    const events = [];
    const report = await runScreening(video, { callClaude: fakeClaude({}) },
      (e, p) => events.push([e, p]));
    expect(report.content).toEqual(CONTENT);
    expect(report.factcheck).toEqual(FACTCHECK);
    expect(report.social).toEqual(SOCIAL);
    expect(report.recommend).toEqual(RECOMMEND);
    expect(report.score).toEqual(SCORE);
    expect(report.errors).toEqual({});
    expect(events.some(([e, p]) => e === 'stage' && p.stage === 'content')).toBe(true);
  });

  it('content failure skips factcheck/recommend but social + score still run', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ content: 'not json at all' }) }, () => {});
    expect(report.content).toBeNull();
    expect(report.errors.content).toBeTruthy();
    expect(report.factcheck).toBeNull();
    expect(report.recommend).toBeNull();
    expect(report.social).toEqual(SOCIAL);
    expect(report.score).toEqual(SCORE);
  });

  it('compose failure falls back to FALLBACK_SCORE', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ compose: 'garbage' }) }, () => {});
    expect(report.score).toEqual(FALLBACK_SCORE);
    expect(report.errors.compose).toBeTruthy();
  });

  it('no transcript → content error, social still runs', async () => {
    const report = await runScreening({ ...video, transcript: null },
      { callClaude: fakeClaude({}) }, () => {});
    expect(report.errors.content).toBe('Không có transcript');
    expect(report.social).toEqual(SOCIAL);
  });

  it('transcriptOverride wins over missing transcript', async () => {
    const report = await runScreening({ ...video, transcript: null, transcriptOverride: 'pasted' },
      { callClaude: fakeClaude({}) }, () => {});
    expect(report.content).toEqual(CONTENT);
  });

  it('passes question and language through', async () => {
    let seenSystem = '';
    const deps = { callClaude: async (b) => { if (b.system.includes('"author"')) seenSystem = b.system; return fakeClaude({}).call(null, b); }, language: 'English' };
    const report = await runScreening({ ...video, question: 'chi phí?' }, deps, () => {});
    expect(report.language).toBe('English');
    expect(report.question).toBe('chi phí?');
    expect(seenSystem).toContain('chi phí?');
  });
});
