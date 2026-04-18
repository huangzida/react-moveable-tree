import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MoveableTree } from '../../src/components/MoveableTree';

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
});