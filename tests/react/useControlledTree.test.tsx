import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControlledTree } from '../../src/react/useControlledTree';

describe('useControlledTree', () => {
  it('updates internal state in uncontrolled mode', () => {
    const initial = [{ id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 }, children: [] }];

    const { result } = renderHook(() => useControlledTree({ defaultValue: initial }));

    act(() => {
      result.current.setTree(
        [{ id: 'a', rect: { x: 5, y: 5, width: 10, height: 10 }, children: [] }],
        { source: 'api', reason: 'patch' }
      );
    });

    expect(result.current.tree[0].rect.x).toBe(5);
  });

  it('calls onChange in controlled mode', () => {
    const onChange = vi.fn();
    const value = [{ id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 }, children: [] }];

    const { result } = renderHook(() => useControlledTree({ value, onChange }));

    act(() => {
      result.current.setTree(
        [{ id: 'a', rect: { x: 9, y: 0, width: 10, height: 10 }, children: [] }],
        { source: 'user', reason: 'drag' }
      );
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('updates rendered tree immediately in controlled mode before parent value sync', () => {
    const onChange = vi.fn();
    const initial = [{ id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 }, children: [] }];
    const next = [{ id: 'a', rect: { x: 12, y: 8, width: 10, height: 10 }, children: [] }];

    const { result, rerender } = renderHook(
      ({ value }) =>
        useControlledTree({
          value,
          onChange
        }),
      {
        initialProps: {
          value: initial
        }
      }
    );

    act(() => {
      result.current.setTree(next, { source: 'user', reason: 'drag' });
    });

    expect(result.current.tree[0].rect).toEqual(next[0].rect);
    expect(onChange).toHaveBeenCalledTimes(1);

    const external = [{ id: 'a', rect: { x: 20, y: 16, width: 10, height: 10 }, children: [] }];
    rerender({ value: external });
    expect(result.current.tree[0].rect).toEqual(external[0].rect);
  });
});