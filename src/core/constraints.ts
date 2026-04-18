import type { BoxBehavior, BoxRect } from '../types/model';

interface ParentSize {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function clampDragRect(rect: BoxRect, parent: ParentSize): BoxRect {
  const maxX = Math.max(0, parent.width - rect.width);
  const maxY = Math.max(0, parent.height - rect.height);

  return {
    ...rect,
    x: clamp(rect.x, 0, maxX),
    y: clamp(rect.y, 0, maxY)
  };
}

export function clampResizeRect(rect: BoxRect, parent: ParentSize, behavior?: BoxBehavior): BoxRect {
  const minWidth = behavior?.minWidth ?? 20;
  const minHeight = behavior?.minHeight ?? 20;
  const maxWidth = Math.max(minWidth, parent.width - rect.x);
  const maxHeight = Math.max(minHeight, parent.height - rect.y);

  return {
    ...rect,
    width: clamp(rect.width, minWidth, maxWidth),
    height: clamp(rect.height, minHeight, maxHeight)
  };
}