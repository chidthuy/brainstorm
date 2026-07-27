import { describe, it, expect } from 'vitest';
import {
  decodeEntities, parseJson3, parseXmlCaptions, extractCaptionTracks, pickTrack
} from '../server/transcript.js';

describe('decodeEntities', () => {
  it('decodes named, numeric and hex entities', () => {
    expect(decodeEntities('a &amp; b')).toBe('a & b');
    expect(decodeEntities('it&#39;s')).toBe("it's");
    expect(decodeEntities('&#x41;BC')).toBe('ABC');
  });
  it('handles double-encoding when applied twice', () => {
    expect(decodeEntities(decodeEntities('it&amp;#39;s'))).toBe("it's");
  });
});

describe('parseJson3', () => {
  it('maps events to timed segments and skips empty ones', () => {
    const segs = parseJson3({
      events: [
        { tStartMs: 0, segs: [{ utf8: 'xin ' }, { utf8: 'chào' }] },
        { tStartMs: 1000 },                       // không có segs → bỏ
        { tStartMs: 2000, segs: [{ utf8: '\n' }] }, // rỗng sau khi trim → bỏ
        { tStartMs: 3000, segs: [{ utf8: 'thế giới' }] }
      ]
    });
    expect(segs).toEqual([
      { text: 'xin chào', start: 0 },
      { text: 'thế giới', start: 3000 }
    ]);
  });
  it('returns empty array for junk', () => {
    expect(parseJson3({})).toEqual([]);
    expect(parseJson3(null)).toEqual([]);
  });
});

describe('parseXmlCaptions', () => {
  it('parses start seconds into ms and strips tags/entities', () => {
    const xml = `<transcript>
      <text start="0" dur="2">Hello &amp;amp; welcome</text>
      <text start="12.5" dur="3"><b>bold</b> text</text>
    </transcript>`;
    expect(parseXmlCaptions(xml)).toEqual([
      { text: 'Hello & welcome', start: 0 },
      { text: 'bold text', start: 12500 }
    ]);
  });
});

describe('extractCaptionTracks', () => {
  it('extracts the balanced JSON array from watch-page HTML', () => {
    const html = `var x = {"captionTracks":[{"baseUrl":"https://a/b?x=1","languageCode":"vi","kind":"asr"},` +
      `{"baseUrl":"https://c/d","languageCode":"en"}],"audioTracks":[]};`;
    const tracks = extractCaptionTracks(html);
    expect(tracks).toHaveLength(2);
    expect(tracks[0].languageCode).toBe('vi');
  });
  it('tolerates brackets inside strings', () => {
    const html = `{"captionTracks":[{"baseUrl":"https://a?q=%5B%5D","name":"a ] b","languageCode":"en"}]}`;
    expect(extractCaptionTracks(html)).toHaveLength(1);
  });
  it('returns [] when absent or malformed', () => {
    expect(extractCaptionTracks('nothing here')).toEqual([]);
    expect(extractCaptionTracks('"captionTracks":[{bad')).toEqual([]);
  });
});

describe('pickTrack', () => {
  it('prefers manual captions over auto-generated', () => {
    const t = pickTrack([
      { languageCode: 'vi', kind: 'asr' },
      { languageCode: 'en' }
    ]);
    expect(t.languageCode).toBe('en');
  });
  it('uses language preference as tiebreaker among equals', () => {
    const t = pickTrack([{ languageCode: 'fr' }, { languageCode: 'vi' }]);
    expect(t.languageCode).toBe('vi');
  });
  it('returns null for empty input', () => {
    expect(pickTrack([])).toBeNull();
    expect(pickTrack(null)).toBeNull();
  });
});
