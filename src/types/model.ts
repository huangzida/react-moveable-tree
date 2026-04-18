import type { CSSProperties } from 'react';
import { z } from 'zod';

export type NodeId = string;

export interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxBehavior {
  draggable?: boolean;
  resizable?: boolean;
  lockAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface BoxView {
  className?: string;
  style?: CSSProperties;
}

export interface BoxNode {
  id: NodeId;
  rect: BoxRect;
  behavior?: BoxBehavior;
  view?: BoxView;
  data?: Record<string, unknown>;
  children?: BoxNode[];
}

export const boxRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative()
});

export const boxNodeSchema: z.ZodType<BoxNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    rect: boxRectSchema,
    behavior: z
      .object({
        draggable: z.boolean().optional(),
        resizable: z.boolean().optional(),
        lockAspectRatio: z.boolean().optional(),
        minWidth: z.number().nonnegative().optional(),
        minHeight: z.number().nonnegative().optional(),
        maxWidth: z.number().nonnegative().optional(),
        maxHeight: z.number().nonnegative().optional()
      })
      .optional(),
    view: z
      .object({
        className: z.string().optional(),
        style: z.record(z.unknown()).optional()
      })
      .optional(),
    data: z.record(z.unknown()).optional(),
    children: z.array(boxNodeSchema).optional()
  })
);