import { describe, expect, it } from 'vitest';
import { boxNodeSchema } from '../../src/types/model';

describe('model schema', () => {
  it('accepts nested node tree', () => {
    const parsed = boxNodeSchema.parse({
      id: 'root-1',
      rect: { x: 0, y: 0, width: 200, height: 120 },
      children: [
        { id: 'child-1', rect: { x: 10, y: 10, width: 50, height: 50 }, children: [] }
      ]
    });

    expect(parsed.children?.length).toBe(1);
  });
});