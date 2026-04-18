import { describe, expect, it } from 'vitest';
import { version } from '../../package.json';

describe('tooling smoke', () => {
  it('loads test environment', () => {
    expect(typeof version).toBe('string');
  });
});
