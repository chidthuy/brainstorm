import { describe, it, expect } from 'vitest';
import { isAuthorized } from '../server/auth.js';

describe('isAuthorized', () => {
  it('allows everything when no password configured', () => {
    expect(isAuthorized('', undefined)).toBe(true);
    expect(isAuthorized('', 'anything')).toBe(true);
  });

  it('accepts the matching password', () => {
    expect(isAuthorized('s3cret', 's3cret')).toBe(true);
  });

  it('rejects wrong or missing password', () => {
    expect(isAuthorized('s3cret', 'nope')).toBe(false);
    expect(isAuthorized('s3cret', undefined)).toBe(false);
    expect(isAuthorized('s3cret', '')).toBe(false);
  });
});
