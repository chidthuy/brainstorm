import { describe, it, expect } from 'vitest';
import { friendlyError } from '../server/errors.js';

describe('friendlyError', () => {
  it('translates the out-of-credit error into an actionable Vietnamese message', () => {
    const raw = '400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}';
    const out = friendlyError(raw);
    expect(out).toContain('Hết credit');
    expect(out).toContain('Billing');
    expect(out).not.toContain('{');
  });

  it('translates auth, rate limit and overload errors', () => {
    expect(friendlyError('401 invalid x-api-key')).toContain('API key');
    expect(friendlyError('429 rate_limit_error')).toContain('giới hạn tốc độ');
    expect(friendlyError('529 overloaded_error')).toContain('quá tải');
  });

  it('translates ingest-side failures', () => {
    expect(friendlyError('Không nhận diện được link YouTube')).toContain('định dạng YouTube');
    expect(friendlyError('Video không tồn tại hoặc bị ẩn')).toContain('riêng tư');
  });

  it('passes unknown messages through and never returns empty', () => {
    expect(friendlyError('điều gì đó lạ')).toBe('điều gì đó lạ');
    expect(friendlyError('')).toBe('Lỗi không rõ.');
    expect(friendlyError(null)).toBe('Lỗi không rõ.');
  });
});
