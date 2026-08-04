import { describe, it, expect } from 'vitest';
import {
  runStep, transcriptWithTimes, capTranscript, normalizePastedTranscript, MAX_TRANSCRIPT_CHARS
} from '../server/steps.js';
import { parseIsoDuration } from '../server/ingest.js';

const CONTENT = {
  author: 'a',
  summary: { theme: 't', highlights: ['h1', 'h2'], conclusion: 'c', takeaway: 'k' },
  outline: [{ timestamp: '0:45', point: 'p' }],
  stance: ['s'], facts: [{ claim: 'f1', supports: 'luận điểm chính' }],
  descriptionGap: null, focusAnswer: null
};
const FACTCHECK = { claims: [{ claim: 'f1', verdict: 'solid', note: '', sources: [] }] };
const SOCIAL = { readout: 'Một phản biện đáng chú ý về số liệu.', dataGaps: [] };
const RECOMMEND = { items: [{ title: 'x', channel: 'c', url: 'http://x', why: 'w' }] };
const SCORE = {
  score: 82, label: 'Đáng nghe trọn', reasons: ['r'],
  breakdown: [{ criterion: 'rich', impact: 'plus', note: 'dày dữ kiện' }],
  focusAnswer: 'đáp'
};
const SCORE_OUT = {
  ...SCORE,
  breakdown: [{ criterion: 'rich', label: 'Nội dung dày', impact: 'plus', note: 'dày dữ kiện' }]
};

function fakeClaude(response) {
  const calls = [];
  const fn = async (build) => { calls.push(build); return JSON.stringify(response); };
  fn.calls = calls;
  return fn;
}

describe('transcript helpers', () => {
  it('formats timestamps m:ss and h:mm:ss', () => {
    const out = transcriptWithTimes([
      { text: 'a', start: 45000 }, { text: 'b', start: 3723000 }
    ]);
    expect(out).toContain('[0:45] a');
    expect(out).toContain('[1:02:03] b');
  });
  it('merges YouTube panel timestamps onto their text line', () => {
    const pasted = '0:00\nGiới thiệu chương trình\n12:30\nBa xu hướng nền tảng\n1:02:03\nPhản biện';
    expect(normalizePastedTranscript(pasted)).toBe(
      '[0:00] Giới thiệu chương trình\n[12:30] Ba xu hướng nền tảng\n[1:02:03] Phản biện'
    );
  });
  it('leaves already-tagged or plain transcripts intact', () => {
    expect(normalizePastedTranscript('[0:45] xin chào')).toBe('[0:45] xin chào');
    expect(normalizePastedTranscript('một đoạn văn xuôi\ndòng hai')).toBe('một đoạn văn xuôi\ndòng hai');
  });
  it('caps overly long transcripts', () => {
    const long = 'x'.repeat(MAX_TRANSCRIPT_CHARS + 500);
    const capped = capTranscript(long);
    expect(capped.length).toBeLessThan(long.length);
    expect(capped).toContain('đã bị cắt');
  });
});

describe('parseIsoDuration', () => {
  it('parses ISO8601 durations', () => {
    expect(parseIsoDuration('PT2H4M10S')).toBe(7450);
    expect(parseIsoDuration('PT15M')).toBe(900);
    expect(parseIsoDuration('')).toBe(0);
  });
});

describe('runStep', () => {
  it('content step passes question + language into prompt', async () => {
    const cc = fakeClaude(CONTENT);
    const data = await runStep('content',
      { title: 'T', channel: 'C', transcriptText: 'xin chào', question: 'chi phí?' },
      { language: 'English' }, { callClaude: cc });
    expect(data).toEqual(CONTENT);
    expect(cc.calls[0].system).toContain('English');
    expect(cc.calls[0].system).toContain('chi phí?');
  });

  it('factcheck step validates verdict enum', async () => {
    const data = await runStep('factcheck', { content: CONTENT }, {}, { callClaude: fakeClaude(FACTCHECK) });
    expect(data).toEqual(FACTCHECK);
  });

  it('social step tolerates empty comments and uses no web search', async () => {
    const cc = fakeClaude(SOCIAL);
    const data = await runStep('social', { comments: [] }, {}, { callClaude: cc });
    expect(data).toEqual(SOCIAL);
    expect(JSON.stringify(cc.calls[0].messages)).toContain('KHÔNG lấy được comment');
    expect(cc.calls[0].tools).toBeUndefined();
  });

  it('social step falls back to NO_SIGNAL for an empty readout', async () => {
    const data = await runStep('social', { comments: [{ text: 'hay', likes: 1 }] }, {},
      { callClaude: fakeClaude({ readout: '' }) });
    expect(data.readout).toBe('Không có ghi nhận nào đáng kể.');
  });

  it('recommend and compose steps round-trip', async () => {
    expect(await runStep('recommend', { title: 'T', theme: 'ai' }, {}, { callClaude: fakeClaude(RECOMMEND) }))
      .toEqual(RECOMMEND);
    expect(await runStep('compose',
      { content: CONTENT, factcheck: FACTCHECK, social: SOCIAL, video: { title: 'T', durationSec: 60 }, question: 'q' },
      {}, { callClaude: fakeClaude(SCORE) })).toEqual(SCORE_OUT);
  });

  it('rejects unknown steps', async () => {
    await expect(runStep('hack', {}, {}, { callClaude: fakeClaude({}) })).rejects.toThrow('không hợp lệ');
  });
});
