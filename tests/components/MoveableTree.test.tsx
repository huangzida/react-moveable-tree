import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, useMemo } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MoveableTree } from '../../src/components/MoveableTree';
import type { MoveableTreeRef } from '../../src/types/api';

let latestMoveableProps: Record<string, unknown> | null = null;

vi.mock('react-moveable', () => ({
  default: (props: { target: HTMLElement | null; origin?: boolean }) => {
    latestMoveableProps = props as unknown as Record<string, unknown>;
    return <div data-testid="moveable-mock" data-origin={props.origin ? 'true' : 'false'} data-target={props.target?.dataset.testid ?? ''} />;
  }
}));

describe('MoveableTree', () => {
  it('renders nested nodes with renderSlot and class/style hooks', () => {
    render(
      <MoveableTree
        width={400}
        height={300}
        defaultValue={[
          {
            id: 'a',
            rect: { x: 0, y: 0, width: 200, height: 120 },
            view: { className: 'title-node' },
            children: [{ id: 'b', rect: { x: 10, y: 10, width: 50, height: 50 }, children: [] }]
          }
        ]}
        renderSlot={node => (
          <span>
            content:{node.id}
          </span>
        )}
        getNodeClassName={node => `node-${node.id}`}
      />
    );

    expect(screen.getByText('content:a')).toBeTruthy();
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

  it('focusNode selects target for moveable', () => {
    const ref = createRef<MoveableTreeRef>();

    const view = render(
      <MoveableTree
        ref={ref}
        width={400}
        height={300}
        defaultValue={[{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }]}
      />
    );

    act(() => {
      ref.current?.focusNode('a');
    });

    expect(within(view.container).getByTestId('node-a').getAttribute('data-selected')).toBe('true');
    expect(within(view.container).getByTestId('moveable-mock').getAttribute('data-target')).toBe('node-a');
  });

  it('selects child node as moveable target on mouse down', () => {
    const view = render(
      <MoveableTree
        width={400}
        height={300}
        defaultValue={[
          {
            id: 'a',
            rect: { x: 0, y: 0, width: 200, height: 160 },
            children: [{ id: 'b', rect: { x: 12, y: 12, width: 80, height: 60 }, children: [] }]
          }
        ]}
      />
    );

    fireEvent.mouseDown(within(view.container).getByTestId('node-b'));
    expect(within(view.container).getByTestId('moveable-mock').getAttribute('data-target')).toBe('node-b');
  });

  it('emits onPatch and clamps rect on update', () => {
    const ref = createRef<MoveableTreeRef>();
    const onPatch = vi.fn();

    render(
      <MoveableTree
        ref={ref}
        width={120}
        height={100}
        onPatch={onPatch}
        defaultValue={[{ id: 'a', rect: { x: 0, y: 0, width: 80, height: 80 }, children: [] }]}
      />
    );

    ref.current?.updateNode('a', { rect: { x: 110, y: 80, width: 100, height: 100 } });
    expect(ref.current?.getNode('a')?.rect).toEqual({ x: 20, y: 0, width: 100, height: 100 });
    expect(onPatch).toHaveBeenCalledTimes(1);
    expect(onPatch.mock.calls[0]?.[0]?.[0]?.id).toBe('a');
  });

  it('hides moveable origin control point', () => {
    const view = render(
      <MoveableTree
        width={400}
        height={300}
        defaultValue={[{ id: 'a', rect: { x: 10, y: 20, width: 100, height: 100 }, children: [] }]}
      />
    );

    expect(within(view.container).getByTestId('moveable-mock').getAttribute('data-origin')).toBe('false');
    expect(latestMoveableProps?.origin).toBe(false);
  });

  it('uses drag left/top as absolute position during resize', () => {
    const ref = createRef<MoveableTreeRef>();

    render(
      <MoveableTree
        ref={ref}
        width={500}
        height={400}
        defaultValue={[{ id: 'a', rect: { x: 40, y: 30, width: 100, height: 90 }, children: [] }]}
      />
    );

    act(() => {
      ref.current?.focusNode('a');
    });

    act(() => {
      (latestMoveableProps?.onResize as
        | ((event: { width: number; height: number; drag: { left: number; top: number; beforeTranslate?: number[] } }) => void)
        | undefined)?.({
        width: 140,
        height: 120,
        drag: {
          left: 66,
          top: 44,
          beforeTranslate: [6, 4]
        }
      });
    });

    expect(ref.current?.getNode('a')?.rect).toEqual({ x: 66, y: 44, width: 140, height: 120 });
  });

  it('uses resize start rect when only beforeTranslate is provided', () => {
    const ref = createRef<MoveableTreeRef>();

    render(
      <MoveableTree
        ref={ref}
        width={500}
        height={400}
        defaultValue={[{ id: 'a', rect: { x: 40, y: 30, width: 100, height: 90 }, children: [] }]}
      />
    );

    act(() => {
      ref.current?.focusNode('a');
    });

    act(() => {
      (latestMoveableProps?.onResizeStart as (() => void) | undefined)?.();
      (latestMoveableProps?.onResize as
        | ((event: { width: number; height: number; drag: { beforeTranslate: number[] } }) => void)
        | undefined)?.({
        width: 120,
        height: 100,
        drag: {
          beforeTranslate: [6, 4]
        }
      });
      (latestMoveableProps?.onResize as
        | ((event: { width: number; height: number; drag: { beforeTranslate: number[] } }) => void)
        | undefined)?.({
        width: 140,
        height: 110,
        drag: {
          beforeTranslate: [20, 10]
        }
      });
    });

    expect(ref.current?.getNode('a')?.rect).toEqual({ x: 60, y: 40, width: 140, height: 110 });
  });

  it('keeps drag responsive in controlled mode before parent value sync', () => {
    function ControlledTree() {
      const value = useMemo(
        () => [{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }],
        []
      );

      return <MoveableTree width={400} height={300} value={value} onChange={() => {}} />;
    }

    const view = render(<ControlledTree />);
    fireEvent.mouseDown(within(view.container).getByTestId('node-a'));

    act(() => {
      (latestMoveableProps?.onDrag as ((event: { left: number; top: number }) => void) | undefined)?.({
        left: 42,
        top: 36
      });
    });

    const style = (within(view.container).getByTestId('node-a') as HTMLDivElement).style;
    expect(style.left).toBe('42px');
    expect(style.top).toBe('36px');
  });

  it('applies immediate resize styles before onChange callback work', () => {
    function ControlledTree(props: { onSnapshot: (snapshot: { left: string; top: string; width: string; height: string }) => void }) {
      const value = useMemo(
        () => [{ id: 'resize-immediate', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }],
        []
      );

      return (
        <MoveableTree
          width={400}
          height={300}
          value={value}
          onChange={() => {
            const node = document.querySelector('[data-testid="node-resize-immediate"]') as HTMLDivElement | null;
            props.onSnapshot({
              left: node?.style.left ?? '',
              top: node?.style.top ?? '',
              width: node?.style.width ?? '',
              height: node?.style.height ?? ''
            });
            // Simulate heavy synchronous user logic in onChange.
            let total = 0;
            for (let i = 0; i < 20000; i += 1) {
              total += i;
            }
            void total;
          }}
        />
      );
    }

    let snapshot = { left: '', top: '', width: '', height: '' };
    const view = render(<ControlledTree onSnapshot={next => (snapshot = next)} />);
    const target = within(view.container).getByTestId('node-resize-immediate') as HTMLDivElement;
    fireEvent.mouseDown(target);

    act(() => {
      (latestMoveableProps?.onResizeStart as (() => void) | undefined)?.();
      (latestMoveableProps?.onResize as
        | ((event: {
            target?: HTMLElement;
            width: number;
            height: number;
            drag: { left: number; top: number; beforeTranslate?: number[] };
          }) => void)
        | undefined)?.({
        target,
        width: 138,
        height: 124,
        drag: {
          left: 14,
          top: 16,
          beforeTranslate: [14, 16]
        }
      });
    });

    expect(snapshot).toEqual({
      left: '14px',
      top: '16px',
      width: '138px',
      height: '124px'
    });
  });

  it('keeps resize visually synced under high-frequency interaction pressure', () => {
    let expected = { left: 0, top: 0, width: 100, height: 100 };
    let mismatchCount = 0;
    let onChangeCount = 0;

    function ControlledTree() {
      const value = useMemo(
        () => [{ id: 'resize-pressure', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }],
        []
      );

      return (
        <MoveableTree
          width={600}
          height={500}
          value={value}
          onChange={() => {
            onChangeCount += 1;
            const node = document.querySelector('[data-testid="node-resize-pressure"]') as HTMLDivElement | null;
            if (!node) {
              mismatchCount += 1;
              return;
            }

            if (
              node.style.left !== `${expected.left}px` ||
              node.style.top !== `${expected.top}px` ||
              node.style.width !== `${expected.width}px` ||
              node.style.height !== `${expected.height}px`
            ) {
              mismatchCount += 1;
            }

            let total = 0;
            for (let i = 0; i < 30000; i += 1) {
              total += i;
            }
            void total;
          }}
        />
      );
    }

    const view = render(<ControlledTree />);
    fireEvent.mouseDown(within(view.container).getByTestId('node-resize-pressure'));

    act(() => {
      (latestMoveableProps?.onResizeStart as (() => void) | undefined)?.();

      for (let step = 1; step <= 120; step += 1) {
        expected = {
          left: step,
          top: Math.floor(step / 2),
          width: 100 + step,
          height: 100 + Math.floor(step / 3)
        };

        (latestMoveableProps?.onResize as
          | ((event: { width: number; height: number; drag: { left: number; top: number; beforeTranslate: number[] } }) => void)
          | undefined)?.({
          width: expected.width,
          height: expected.height,
          drag: {
            left: expected.left,
            top: expected.top,
            beforeTranslate: [expected.left, expected.top]
          }
        });
      }

      (latestMoveableProps?.onResizeEnd as (() => void) | undefined)?.();
    });

    const style = (within(view.container).getByTestId('node-resize-pressure') as HTMLDivElement).style;
    expect(onChangeCount).toBe(120);
    expect(mismatchCount).toBe(0);
    expect(style.left).toBe('120px');
    expect(style.top).toBe('60px');
    expect(style.width).toBe('220px');
    expect(style.height).toBe('140px');
  });
});
