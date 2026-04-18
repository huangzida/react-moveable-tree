import { describe, expect, it } from 'vitest';
import { clampDragRect, clampResizeRect } from '../../src/core/constraints';

describe('constraints', () => {
  it('clamps drag inside parent', () => {
    const next = clampDragRect({ x: 180, y: -20, width: 60, height: 40 }, { width: 200, height: 120 });

    expect(next).toEqual({ x: 140, y: 0, width: 60, height: 40 });
  });

  it('clamps resize with min size and parent edge', () => {
    const next = clampResizeRect(
      { x: 150, y: 90, width: 120, height: 100 },
      { width: 200, height: 120 },
      { minWidth: 30, minHeight: 20 }
    );

    expect(next).toEqual({ x: 150, y: 90, width: 50, height: 30 });
  });
});