import { describe, expect, it } from 'vitest';
import { addNode, findNode, normalizeTreeRects, removeNode, updateNodeRect, updateNodeWithConstraints } from '../../src/core/tree';
import type { BoxNode } from '../../src/types/model';

const tree: BoxNode[] = [
  {
    id: 'a',
    rect: { x: 0, y: 0, width: 200, height: 120 },
    children: [{ id: 'b', rect: { x: 10, y: 10, width: 40, height: 40 }, children: [] }]
  }
];

describe('tree operations', () => {
  it('updates node rect by id', () => {
    const next = updateNodeRect(tree, 'b', { x: 20, y: 30, width: 50, height: 50 });

    expect(findNode(next, 'b')?.rect.x).toBe(20);
  });

  it('adds and removes child node', () => {
    const withNode = addNode(tree, 'a', {
      id: 'c',
      rect: { x: 0, y: 0, width: 20, height: 20 },
      children: []
    });

    expect(findNode(withNode, 'c')?.id).toBe('c');

    const removed = removeNode(withNode, 'c');
    expect(findNode(removed, 'c')).toBeUndefined();
  });

  it('clamps node rect when updating with constraints', () => {
    const next = updateNodeWithConstraints(
      tree,
      'b',
      {
        rect: { x: 300, y: 300, width: 400, height: 400 }
      },
      { width: 500, height: 500 }
    );

    const child = findNode(next, 'b');
    expect(child?.rect.x).toBe(0);
    expect(child?.rect.y).toBe(0);
    expect(child?.rect.width).toBe(200);
    expect(child?.rect.height).toBe(120);
  });

  it('normalizes imported tree recursively within bounds', () => {
    const next = normalizeTreeRects(
      [
        {
          id: 'root',
          rect: { x: 250, y: 250, width: 200, height: 200 },
          children: [
            {
              id: 'child',
              rect: { x: 180, y: 180, width: 100, height: 100 },
              children: []
            }
          ]
        }
      ],
      { width: 300, height: 300 }
    );

    expect(findNode(next, 'root')?.rect).toEqual({ x: 100, y: 100, width: 200, height: 200 });
    expect(findNode(next, 'child')?.rect).toEqual({ x: 100, y: 100, width: 100, height: 100 });
  });
});