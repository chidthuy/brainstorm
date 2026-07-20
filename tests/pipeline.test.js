import { describe, it, expect } from 'vitest';
import { runScreening } from '../server/pipeline.js';
import { FALLBACK_VERDICT } from '../server/passes/compose.js';

const video = {
  id: 'abc12345678', title: 'T', channel: 'C', durationSec: 3600, viewCount: 100,
  transcript: [{ text: 'hello', start: 0 }],
  comments: [{ text: 'great', likes: 1 }]
};

const CONTENT = { thesis: 't', summary: 's', structure: [], facts: ['f1'], stance: [], caveats: ['weak point'] };
const FACTCHECK = { claims: [{ claim: 'f1', verdict: 'supported', note: '', sources: [] }] };
const SOCIAL = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
const VERDICT = { verdict: 'WATCH', confidence: 'high', reasons: ['r'] };

function fakeClaude(byPass) {
  return async ({ system }) => {
    if (system.includes('"thesis"')) return byPass.content ?? JSON.stringify(CONTENT);
    if (system.includes('fact-checker')) return byPass.factcheck ?? JSON.stringify(FACTCHECK);
    if (system.includes('social signals')) return byPass.social ?? JSON.stringify(SOCIAL);
    if (system.includes('verdict screening')) return byPass.compose ?? JSON.stringify(VERDICT);
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
    expect(report.verdict).toEqual(VERDICT);
    expect(report.errors).toEqual({});
    expect(events.some(([e, p]) => e === 'stage' && p.stage === 'content')).toBe(true);
  });

  it('content failure skips factcheck but social + verdict still run', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ content: 'not json at all' }) }, () => {});
    expect(report.content).toBeNull();
    expect(report.errors.content).toBeTruthy();
    expect(report.factcheck).toBeNull();
    expect(report.social).toEqual(SOCIAL);
    expect(report.verdict).toEqual(VERDICT);
  });

  it('compose failure falls back to FALLBACK_VERDICT', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ compose: 'garbage' }) }, () => {});
    expect(report.verdict).toEqual(FALLBACK_VERDICT);
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
});
