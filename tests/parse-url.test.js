import { describe, it, expect } from 'vitest';
import { parseVideoId } from '../server/ingest.js';

describe('parseVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ']
  ])('parses %s', (url, id) => {
    expect(parseVideoId(url)).toBe(id);
  });

  it('throws on garbage', () => {
    expect(() => parseVideoId('https://example.com/abc')).toThrow('Không nhận diện được link YouTube');
    expect(() => parseVideoId('not a url')).toThrow();
  });
});
