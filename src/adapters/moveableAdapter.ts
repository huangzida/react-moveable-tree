import type { BoxRect } from '../types/model';

export interface DragPayload {
  left: number;
  top: number;
}

export interface ResizePayload {
  width: number;
  height: number;
}

export const toDragRect = (prev: BoxRect, payload: DragPayload): BoxRect => ({
  ...prev,
  x: payload.left,
  y: payload.top
});

export const toResizeRect = (prev: BoxRect, payload: ResizePayload): BoxRect => ({
  ...prev,
  width: payload.width,
  height: payload.height
});