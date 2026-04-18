import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { MoveableTree } from '../../src/components/MoveableTree';
import type { MoveableTreeRef } from '../../src/types/api';

describe('MoveableTree', () => {
  it('renders nested nodes with slot and class/style hooks', () => {
    render(
      <MoveableTree
        width={400}
        height={300}
        defaultValue={[
          {
            id: 'a',
            rect: { x: 0, y: 0, width: 200, height: 120 },
            view: { slot: 'title' },
            children: [{ id: 'b', rect: { x: 10, y: 10, width: 50, height: 50 }, children: [] }]
          }
        ]}
        renderSlot={(name, node) => (
          <span>
            {name}:{node.id}
          </span>
        )}
        getNodeClassName={node => `node-${node.id}`}
      />
    );

    expect(screen.getByText('title:a')).toBeTruthy();
    expect(screen.getByTestId('node-b')).toBeTruthy();
  });

  it('supports updateNode, updateNodes and moveNode through ref api', () => {
    const ref = createRef<MoveableTreeRef>();

    render(
      <MoveableTree
        ref={ref}
        width={400}
        height={300}
        defaultValue={[{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }]}
      />
    );

    ref.current?.updateNode('a', { rect: { x: 30, y: 10, width: 100, height: 100 } });
    expect(ref.current?.getNode('a')?.rect.x).toBe(30);

    ref.current?.updateNodes([{ id: 'a', patch: { rect: { x: 40, y: 20, width: 90, height: 80 } } }]);
    expect(ref.current?.getNode('a')?.rect.width).toBe(90);

    ref.current?.addNode('a', {
      id: 'child-1',
      rect: { x: 5, y: 5, width: 20, height: 20 },
      children: []
    });
    ref.current?.moveNode('child-1', 'a', 0);
    expect(ref.current?.getNode('child-1')?.id).toBe('child-1');
  });
});