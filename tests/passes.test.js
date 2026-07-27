import { describe, it, expect } from 'vitest';
import { extractJson, resolveModel } from '../server/claude.js';
import { buildContent, parseContent } from '../server/passes/content.js';
import { buildFactcheck, parseFactcheck } from '../server/passes/factcheck.js';
import { buildSocial, parseSocial } from '../server/passes/social.js';
import { buildRecommend, parseRecommend } from '../server/passes/recommend.js';
import { buildCompose, parseCompose, FALLBACK_SCORE } from '../server/passes/compose.js';

const CONTENT_GOOD = {
  author: 'a',
  summary: { theme: 't', highlights: 'h', conclusion: 'c', takeaway: 'k' },
  outline: [{ timestamp: '0:45', point: 'p' }],
  stance: ['s'],
  facts: ['f'],
  focusAnswer: null
};

describe('extractJson', () => {
  it('pulls JSON out of chatter', () => {
    expect(extractJson('Here you go:\n{"a": 1}\nDone.')).toEqual({ a: 1 });
  });
  it('throws when no JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('resolveModel', () => {
  it('maps choices to model ids and falls back', () => {
    expect(resolveModel('opus')).toBe('claude-opus-4-8');
    expect(resolveModel('haiku')).toBe('claude-haiku-4-5');
    expect(resolveModel('sonnet')).toBe('claude-sonnet-5');
    expect(resolveModel('nonsense')).toBe('claude-sonnet-5');
  });
});

describe('content pass', () => {
  it('build includes transcript, language and focus question', () => {
    const req = buildContent({ title: 'T', channel: 'C', transcriptText: 'xin chào', question: 'chi phí?', language: 'English' });
    const all = JSON.stringify(req.messages) + req.system;
    expect(all).toContain('xin chào');
    expect(all).toContain('JSON');
    expect(all).toContain('English');
    expect(all).toContain('chi phí?');
  });
  it('parse validates shape', () => {
    expect(parseContent(JSON.stringify(CONTENT_GOOD))).toEqual(CONTENT_GOOD);
    expect(() => parseContent('{"author": "a"}')).toThrow();
  });
});

describe('factcheck pass', () => {
  it('build attaches web_search tool', () => {
    const req = buildFactcheck({ content: { facts: ['claim 1'] }, language: 'Tiếng Việt' });
    expect(req.tools[0].type).toBe('web_search_20260209');
  });
  it('parse validates verdict enum', () => {
    const good = { claims: [{ claim: 'c', verdict: 'solid', note: 'n', sources: ['http://x'] }] };
    expect(parseFactcheck(JSON.stringify(good))).toEqual(good);
    expect(parseFactcheck(JSON.stringify({ claims: [{ claim: 'c', verdict: 'weak', note: '', sources: [] }] }))).toBeTruthy();
    expect(() => parseFactcheck(JSON.stringify({ claims: [{ claim: 'c', verdict: 'supported', note: '', sources: [] }] }))).toThrow();
  });
});

describe('social pass', () => {
  it('build includes comments', () => {
    const req = buildSocial({ title: 'T', channel: 'C', viewCount: 9, comments: [{ text: 'bình luận sâu', likes: 3 }], language: 'Tiếng Việt' });
    expect(JSON.stringify(req.messages)).toContain('bình luận sâu');
  });
  it('parse validates shape', () => {
    const good = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
    expect(parseSocial(JSON.stringify(good))).toEqual(good);
    expect(() => parseSocial('{}')).toThrow();
  });
});

describe('recommend pass', () => {
  it('build attaches web_search tool', () => {
    const req = buildRecommend({ title: 'T', theme: 'agents', language: 'Tiếng Việt' });
    expect(req.tools[0].type).toBe('web_search_20260209');
  });
  it('parse validates shape', () => {
    const good = { items: [{ title: 'x', channel: 'c', url: 'http://x', why: 'w' }] };
    expect(parseRecommend(JSON.stringify(good))).toEqual(good);
    expect(() => parseRecommend(JSON.stringify({ items: [{ title: 'x' }] }))).toThrow();
  });
});

describe('compose pass (score)', () => {
  it('parse validates score range, rounds, and keeps focusAnswer', () => {
    expect(parseCompose(JSON.stringify({ score: 82.4, label: 'Đáng nghe', reasons: ['r'] })))
      .toEqual({ score: 82, label: 'Đáng nghe', reasons: ['r'], focusAnswer: null });
    expect(parseCompose(JSON.stringify({ score: 60, label: 'x', reasons: [], focusAnswer: 'trả lời' })).focusAnswer)
      .toBe('trả lời');
    expect(() => parseCompose(JSON.stringify({ score: 120, label: 'x', reasons: [] }))).toThrow();
    expect(() => parseCompose(JSON.stringify({ label: 'x', reasons: [] }))).toThrow();
  });
  it('fallback matches spec', () => {
    expect(FALLBACK_SCORE).toEqual({
      score: 50, label: 'Cân nhắc',
      reasons: ['Chấm điểm không khả dụng — compose pass lỗi.'],
      focusAnswer: null
    });
  });
  it('build includes language and user question', () => {
    const req = buildCompose({ content: { summary: {} }, factcheck: null, social: null, video: { title: 'T', durationSec: 60 }, question: 'số liệu?', language: 'English' });
    expect(req.system).toContain('English');
    expect(req.system).toContain('số liệu?');
  });
});
