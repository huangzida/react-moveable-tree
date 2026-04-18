import { describe, expect, it } from 'vitest';
import { addNode, findNode, removeNode, updateNodeRect } from '../../src/core/tree';
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
});