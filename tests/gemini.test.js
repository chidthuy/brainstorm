import { describe, it, expect } from 'vitest';
import {
  planWindows, normalizeWindowTranscript, fmtTimestamp, parseTimestamp, transcribeWindow, WINDOW_SEC
} from '../server/gemini.js';

describe('planWindows', () => {
  it('cuts a long video into windows covering the whole duration', () => {
    const w = planWindows(7450);   // 2h04
    expect(w.length).toBe(Math.ceil(7450 / WINDOW_SEC));
    expect(w[0]).toMatchObject({ index: 0, startSec: 0, endSec: WINDOW_SEC });
    expect(w.at(-1).endSec).toBe(7450);
    // không hở, không chồng lấn
    for (let i = 1; i < w.length; i++) expect(w[i].startSec).toBe(w[i - 1].endSec);
  });
  it('keeps a short video in one window', () => {
    expect(planWindows(600)).toEqual([{ index: 0, startSec: 0, endSec: 600, total: 1 }]);
  });
  it('falls back to a single open-ended window when duration is unknown', () => {
    expect(planWindows(0)).toEqual([{ index: 0, startSec: 0, endSec: null, total: 1 }]);
  });
});

describe('timestamps', () => {
  it('formats m:ss and h:mm:ss', () => {
    expect(fmtTimestamp(45)).toBe('0:45');
    expect(fmtTimestamp(3723)).toBe('1:02:03');
  });
  it('parses both shapes', () => {
    expect(parseTimestamp('0:45')).toBe(45);
    expect(parseTimestamp('1:02:03')).toBe(3723);
    expect(parseTimestamp('nonsense')).toBe(null);
  });
});

describe('normalizeWindowTranscript', () => {
  it('normalizes assorted line shapes to [m:ss] text', () => {
    const raw = '[0:05] xin chào\n(1:10) nội dung hai\n2:20 - nội dung ba\nrác không có mốc';
    expect(normalizeWindowTranscript(raw, 0)).toBe(
      '[0:05] xin chào\n[1:10] nội dung hai\n[2:20] nội dung ba'
    );
  });
  it('keeps absolute timestamps when the model already used video time', () => {
    // cửa sổ bắt đầu ở 20:00, model đánh mốc theo gốc video
    expect(normalizeWindowTranscript('[20:05] tiếp tục', 1200)).toBe('[20:05] tiếp tục');
  });
  it('rebases relative timestamps onto video time', () => {
    // cùng cửa sổ, nhưng model đánh mốc từ đầu đoạn cắt
    expect(normalizeWindowTranscript('[0:05] tiếp tục', 1200)).toBe('[20:05] tiếp tục');
  });
  it('returns empty string when nothing parses', () => {
    expect(normalizeWindowTranscript('không có dòng nào hợp lệ', 0)).toBe('');
    expect(normalizeWindowTranscript('', 0)).toBe('');
  });
});

function fakeFetch(payload, { ok = true, status = 200 } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return { ok, status, json: async () => payload };
  };
  fn.calls = calls;
  return fn;
}

const reply = (text) => ({ candidates: [{ content: { parts: [{ text }] } }] });

describe('transcribeWindow', () => {
  it('sends the YouTube URL and the window offsets, and normalizes the reply', async () => {
    const f = fakeFetch(reply('[0:05] xin chào\n[0:10] nội dung'));
    const out = await transcribeWindow({
      videoId: 'abcdefghijk', startSec: 1200, endSec: 2400, fetchImpl: f, apiKey: 'k'
    });
    const part = f.calls[0].body.contents[0].parts[1];
    expect(part.file_data.file_uri).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(part.video_metadata).toMatchObject({ start_offset: '1200s', end_offset: '2400s' });
    expect(f.calls[0].url).toContain('key=k');
    // mốc tương đối được đưa về gốc video
    expect(out.text).toBe('[20:05] xin chào\n[20:10] nội dung');
    expect(out.empty).toBe(false);
  });

  it('omits offsets for a single open-ended window', async () => {
    const f = fakeFetch(reply('[0:01] a'));
    await transcribeWindow({ videoId: 'abcdefghijk', startSec: 0, endSec: null, fetchImpl: f, apiKey: 'k' });
    const meta = f.calls[0].body.contents[0].parts[1].video_metadata;
    expect(meta.start_offset).toBeUndefined();
    expect(meta.end_offset).toBeUndefined();
  });

  it('flags a silent window instead of inventing content', async () => {
    const f = fakeFetch(reply('KHONG_CO_LOI_NOI'));
    const out = await transcribeWindow({ videoId: 'abcdefghijk', fetchImpl: f, apiKey: 'k' });
    expect(out).toEqual({ text: '', empty: true });
  });

  it('retries with a minimal config when the API rejects the tuning options', async () => {
    let n = 0;
    const fetchImpl = async (_url, init) => {
      n++;
      const body = JSON.parse(init.body);
      if (n === 1) {
        expect(body.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_LOW');
        return { ok: false, status: 400, json: async () => ({ error: { message: 'Unknown name "mediaResolution"' } }) };
      }
      expect(body.generationConfig.mediaResolution).toBeUndefined();
      expect(body.generationConfig.thinkingConfig).toBeUndefined();
      return { ok: true, status: 200, json: async () => reply('[0:01] a') };
    };
    const out = await transcribeWindow({ videoId: 'abcdefghijk', fetchImpl, apiKey: 'k' });
    expect(n).toBe(2);
    expect(out.text).toBe('[0:01] a');
  });

  it('does not waste a second call when the key itself is rejected', async () => {
    const f = fakeFetch(
      { error: { message: 'API key not valid. Please pass a valid API key.' } },
      { ok: false, status: 400 }
    );
    await expect(transcribeWindow({ videoId: 'abcdefghijk', fetchImpl: f, apiKey: 'bad' }))
      .rejects.toThrow('API key not valid');
    expect(f.calls.length).toBe(1);
  });

  it('surfaces non-400 errors instead of silently retrying', async () => {
    const f = fakeFetch({ error: { message: 'RESOURCE_EXHAUSTED' } }, { ok: false, status: 429 });
    await expect(transcribeWindow({ videoId: 'abcdefghijk', fetchImpl: f, apiKey: 'k' }))
      .rejects.toThrow('RESOURCE_EXHAUSTED');
    expect(f.calls.length).toBe(1);
  });

  it('refuses to run without an API key', async () => {
    await expect(transcribeWindow({ videoId: 'abcdefghijk', fetchImpl: fakeFetch({}), apiKey: '' }))
      .rejects.toThrow('GEMINI_API_KEY');
  });
});
