import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('readme', () => {
  it('documents controlled usage and ref api', () => {
    const readme = readFileSync('README.md', 'utf-8');

    expect(readme.includes('value')).toBe(true);
    expect(readme.includes('defaultValue')).toBe(true);
    expect(readme.includes('updateNode')).toBe(true);
  });
});