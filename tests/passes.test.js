import { describe, it, expect } from 'vitest';
import { extractJson } from '../server/claude.js';
import { buildContent, parseContent } from '../server/passes/content.js';
import { buildFactcheck, parseFactcheck } from '../server/passes/factcheck.js';
import { buildSocial, parseSocial } from '../server/passes/social.js';
import { buildCompose, parseCompose, FALLBACK_VERDICT } from '../server/passes/compose.js';

describe('extractJson', () => {
  it('pulls JSON out of chatter', () => {
    expect(extractJson('Here you go:\n{"a": 1}\nDone.')).toEqual({ a: 1 });
  });
  it('throws when no JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('content pass', () => {
  it('build includes transcript and asks for JSON', () => {
    const req = buildContent({ title: 'T', channel: 'C', transcriptText: 'xin chào' });
    const all = JSON.stringify(req.messages) + req.system;
    expect(all).toContain('xin chào');
    expect(all).toContain('JSON');
  });
  it('parse validates shape', () => {
    const good = { summary: 's', structure: [{ heading: 'h', gist: 'g' }], facts: ['f'], stance: ['q'] };
    expect(parseContent(JSON.stringify(good))).toEqual(good);
    expect(() => parseContent('{"summary": "s"}')).toThrow();
  });
});

describe('factcheck pass', () => {
  it('build attaches web_search tool', () => {
    const req = buildFactcheck({ content: { summary: 's', facts: ['claim 1'], stance: [] } });
    expect(req.tools[0].type).toBe('web_search_20260209');
  });
  it('parse validates verdict enum', () => {
    const good = { claims: [{ claim: 'c', verdict: 'supported', note: 'n', sources: ['http://x'] }] };
    expect(parseFactcheck(JSON.stringify(good))).toEqual(good);
    expect(() => parseFactcheck(JSON.stringify({ claims: [{ claim: 'c', verdict: 'maybe', note: '', sources: [] }] }))).toThrow();
  });
});

describe('social pass', () => {
  it('build includes comments', () => {
    const req = buildSocial({ title: 'T', channel: 'C', viewCount: 9, comments: [{ text: 'bình luận sâu', likes: 3 }] });
    expect(JSON.stringify(req.messages)).toContain('bình luận sâu');
  });
  it('parse validates shape', () => {
    const good = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
    expect(parseSocial(JSON.stringify(good))).toEqual(good);
    expect(() => parseSocial('{}')).toThrow();
  });
});

describe('compose pass', () => {
  it('parse validates verdict enum', () => {
    const good = { verdict: 'WATCH', confidence: 'high', reasons: ['r'] };
    expect(parseCompose(JSON.stringify(good))).toEqual(good);
    expect(() => parseCompose(JSON.stringify({ verdict: 'MAYBE', confidence: 'high', reasons: [] }))).toThrow();
  });
  it('fallback matches spec', () => {
    expect(FALLBACK_VERDICT).toEqual({
      verdict: 'SKIM', confidence: 'low',
      reasons: ['Verdict không khả dụng — compose pass lỗi.']
    });
  });
});
