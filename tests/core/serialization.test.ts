import { describe, expect, it } from 'vitest';
import { parseTreeJSON } from '../../src/core/serialization';

describe('serialization', () => {
  it('rejects malformed json tree', () => {
    expect(() => parseTreeJSON('[{"id":1}]')).toThrow();
  });

  it('accepts valid json tree', () => {
    expect(() =>
      parseTreeJSON('[{"id":"a","rect":{"x":0,"y":0,"width":10,"height":10},"children":[]}]')
    ).not.toThrow();
  });
});