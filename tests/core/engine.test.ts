import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine';

describe('engine', () => {
  it('emits source and reason in change payload', () => {
    const engine = createEngine([{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }]);

    const payload = engine.updateNode(
      'a',
      { rect: { x: 10, y: 20, width: 100, height: 100 } },
      { source: 'api', reason: 'patch' }
    );

    expect(payload.meta).toEqual({ source: 'api', reason: 'patch' });
    expect(payload.tree[0].rect.x).toBe(10);
  });
});