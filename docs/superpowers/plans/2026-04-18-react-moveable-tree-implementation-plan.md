# React Moveable Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React 17+ compatible npm library that renders nested draggable/resizable boxes inside bounded parents with controlled/uncontrolled modes and full imperative APIs.

**Architecture:** Use a layered design with pure TypeScript core logic for tree/constraint handling, a React binding layer for state bridging, and a recursive Moveable-powered UI layer. Keep geometric rules and tree mutations in core so UI remains thin and extensible.

**Tech Stack:** Vite (library mode), React, TypeScript, react-moveable, Immer, Zod, Vitest, React Testing Library, Changesets.

---

## File Structure Map

- `package.json`: package metadata, scripts, dependencies, peerDependencies.
- `tsconfig.json`: TypeScript build settings.
- `vite.config.ts`: library build configuration.
- `vitest.config.ts`: unit/component test config.
- `src/types/model.ts`: tree node and rect model types.
- `src/types/events.ts`: change event metadata types.
- `src/types/api.ts`: public props/ref API types.
- `src/core/constraints.ts`: boundary clamp and resize math.
- `src/core/tree.ts`: immutable tree get/update/add/remove/move helpers.
- `src/core/engine.ts`: action dispatcher + patch generation.
- `src/core/serialization.ts`: import/export parse and schema validation helpers.
- `src/react/useControlledTree.ts`: controlled/uncontrolled bridge hook.
- `src/components/TreeNode.tsx`: recursive node renderer + slot/class/style hooks.
- `src/components/MoveableTree.tsx`: root component + imperative API + moveable adapter.
- `src/index.ts`: public exports.
- `tests/core/constraints.test.ts`: geometry constraints tests.
- `tests/core/tree.test.ts`: tree operation tests.
- `tests/core/engine.test.ts`: action/event metadata tests.
- `tests/react/useControlledTree.test.tsx`: controlled/uncontrolled behavior tests.
- `tests/components/MoveableTree.test.tsx`: rendering and ref API tests.
- `README.md`: usage docs and API examples.

### Task 1: Scaffold Library Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/index.ts`
- Test: `npm run build`, `npm run test`

- [ ] **Step 1: Write a failing smoke test first**

```ts
// tests/core/smoke.test.ts
import { describe, expect, it } from 'vitest';
import { version } from '../../package.json';

describe('tooling smoke', () => {
  it('loads test environment', () => {
    expect(typeof version).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/smoke.test.ts`
Expected: FAIL with "Cannot find module '../../package.json'" because tooling is not configured.

- [ ] **Step 3: Add minimal tooling implementation**

```json
{
  "name": "react-moveable-tree",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/react-moveable-tree.umd.cjs",
  "module": "dist/react-moveable-tree.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=17",
    "react-dom": ">=17"
  },
  "dependencies": {
    "immer": "^10.1.1",
    "nanoid": "^5.1.6",
    "react-moveable": "^0.56.0",
    "zod": "^3.25.76",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "^5.8.3",
    "vite": "^7.2.0",
    "vitest": "^3.2.4",
    "jsdom": "^26.1.0",
    "changesets": "^2.29.6"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ReactMoveableTree',
      fileName: 'react-moveable-tree'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-moveable']
    }
  }
});
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx']
  }
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

```ts
// src/index.ts
export const __placeholder = 'react-moveable-tree';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && npm run test -- tests/core/smoke.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts vitest.config.ts src/index.ts tests/core/smoke.test.ts
git commit -m "chore: initialize library tooling and test baseline"
```

### Task 2: Define Public Types and Schemas

**Files:**
- Create: `src/types/model.ts`
- Create: `src/types/events.ts`
- Create: `src/types/api.ts`
- Create: `tests/core/model-schema.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing model/schema tests**

```ts
// tests/core/model-schema.test.ts
import { describe, expect, it } from 'vitest';
import { boxNodeSchema } from '../../src/types/model';

describe('model schema', () => {
  it('accepts nested node tree', () => {
    const parsed = boxNodeSchema.parse({
      id: 'root-1',
      rect: { x: 0, y: 0, width: 200, height: 120 },
      children: [
        { id: 'child-1', rect: { x: 10, y: 10, width: 50, height: 50 }, children: [] }
      ]
    });
    expect(parsed.children?.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/model-schema.test.ts`
Expected: FAIL with "Cannot find module '../../src/types/model'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/types/model.ts
import { z } from 'zod';
import type { CSSProperties } from 'react';

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
  slot?: string;
  slotProps?: Record<string, unknown>;
  zIndex?: number;
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
        style: z.record(z.unknown()).optional(),
        slot: z.string().optional(),
        slotProps: z.record(z.unknown()).optional(),
        zIndex: z.number().optional()
      })
      .optional(),
    data: z.record(z.unknown()).optional(),
    children: z.array(boxNodeSchema).optional()
  })
);
```

```ts
// src/types/events.ts
import type { BoxNode, NodeId } from './model';

export type ChangeSource = 'user' | 'api' | 'external';
export type ChangeReason = 'drag' | 'resize' | 'add' | 'remove' | 'patch' | 'import';

export interface TreePatch {
  id: NodeId;
  path: string;
  prev: unknown;
  next: unknown;
}

export interface TreeChangeMeta {
  source: ChangeSource;
  reason: ChangeReason;
}

export interface TreeChangePayload {
  tree: BoxNode[];
  patches: TreePatch[];
  meta: TreeChangeMeta;
}
```

```ts
// src/types/api.ts
import type { CSSProperties, ReactNode } from 'react';
import type { BoxNode, NodeId } from './model';
import type { TreeChangeMeta, TreePatch } from './events';

export interface MoveableTreeRef {
  getTree(): BoxNode[];
  setTree(next: BoxNode[]): void;
  getNode(id: NodeId): BoxNode | undefined;
  updateNode(id: NodeId, patch: Partial<BoxNode>, meta?: Partial<TreeChangeMeta>): void;
  updateNodes(patches: Array<{ id: NodeId; patch: Partial<BoxNode> }>, meta?: Partial<TreeChangeMeta>): void;
  addNode(parentId: NodeId, node: BoxNode, meta?: Partial<TreeChangeMeta>): void;
  removeNode(id: NodeId, meta?: Partial<TreeChangeMeta>): void;
  moveNode(id: NodeId, toParentId: NodeId, index?: number, meta?: Partial<TreeChangeMeta>): void;
  focusNode(id: NodeId): void;
  exportJSON(): string;
  importJSON(raw: string, meta?: Partial<TreeChangeMeta>): void;
}

export interface MoveableTreeProps {
  value?: BoxNode[];
  defaultValue?: BoxNode[];
  width: number;
  height: number;
  disabled?: boolean;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  renderSlot?: (slotName: string, node: BoxNode) => ReactNode;
  getNodeClassName?: (node: BoxNode) => string | undefined;
  getNodeStyle?: (node: BoxNode) => CSSProperties | undefined;
  onChange?: (tree: BoxNode[], meta: TreeChangeMeta) => void;
  onPatch?: (patches: TreePatch[], meta: TreeChangeMeta) => void;
}
```

```ts
// src/index.ts
export * from './types/model';
export * from './types/events';
export * from './types/api';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/core/model-schema.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/types/model.ts src/types/events.ts src/types/api.ts src/index.ts tests/core/model-schema.test.ts
git commit -m "feat: define public model and event types"
```

### Task 3: Implement Boundary Constraints Core

**Files:**
- Create: `src/core/constraints.ts`
- Create: `tests/core/constraints.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing constraints tests**

```ts
// tests/core/constraints.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/constraints.test.ts`
Expected: FAIL with module not found for `src/core/constraints`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/core/constraints.ts
import type { BoxRect, BoxBehavior } from '../types/model';

interface ParentSize {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
```

```ts
// src/index.ts
export * from './core/constraints';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/core/constraints.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/constraints.ts src/index.ts tests/core/constraints.test.ts
git commit -m "feat: add core boundary constraint utilities"
```

### Task 4: Implement Tree Operations Core

**Files:**
- Create: `src/core/tree.ts`
- Create: `tests/core/tree.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing tree operation tests**

```ts
// tests/core/tree.test.ts
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
    const withNode = addNode(tree, 'a', { id: 'c', rect: { x: 0, y: 0, width: 20, height: 20 }, children: [] });
    expect(findNode(withNode, 'c')?.id).toBe('c');
    const removed = removeNode(withNode, 'c');
    expect(findNode(removed, 'c')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/tree.test.ts`
Expected: FAIL with module not found for `src/core/tree`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/core/tree.ts
import { produce } from 'immer';
import type { BoxNode, BoxRect, NodeId } from '../types/model';

export function findNode(tree: BoxNode[], id: NodeId): BoxNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node;
    const child = findNode(node.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

export function updateNodeRect(tree: BoxNode[], id: NodeId, rect: BoxRect): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          node.rect = rect;
          return true;
        }
        if (walk(node.children ?? [])) return true;
      }
      return false;
    };
    walk(draft);
  });
}

export function addNode(tree: BoxNode[], parentId: NodeId, node: BoxNode): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const current of nodes) {
        if (current.id === parentId) {
          current.children = current.children ?? [];
          current.children.push(node);
          return true;
        }
        if (walk(current.children ?? [])) return true;
      }
      return false;
    };
    walk(draft);
  });
}

export function removeNode(tree: BoxNode[], id: NodeId): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      const index = nodes.findIndex(n => n.id === id);
      if (index >= 0) {
        nodes.splice(index, 1);
        return true;
      }
      for (const node of nodes) {
        if (walk(node.children ?? [])) return true;
      }
      return false;
    };
    walk(draft);
  });
}
```

```ts
// src/index.ts
export * from './core/tree';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/core/tree.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/tree.ts src/index.ts tests/core/tree.test.ts
git commit -m "feat: add immutable tree mutation utilities"
```

### Task 5: Implement Engine Actions and Metadata

**Files:**
- Create: `src/core/engine.ts`
- Create: `tests/core/engine.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing engine tests**

```ts
// tests/core/engine.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/core/engine';

describe('engine', () => {
  it('emits source and reason in change payload', () => {
    const engine = createEngine([{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 }, children: [] }]);
    const payload = engine.updateNode('a', { rect: { x: 10, y: 20, width: 100, height: 100 } }, { source: 'api', reason: 'patch' });
    expect(payload.meta).toEqual({ source: 'api', reason: 'patch' });
    expect(payload.tree[0].rect.x).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/engine.test.ts`
Expected: FAIL with module not found for `src/core/engine`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/core/engine.ts
import { boxNodeSchema, type BoxNode, type NodeId } from '../types/model';
import type { TreeChangeMeta, TreeChangePayload } from '../types/events';
import { findNode, updateNodeRect } from './tree';

const defaultMeta: TreeChangeMeta = { source: 'api', reason: 'patch' };

export function createEngine(initialTree: BoxNode[]) {
  let tree = initialTree;

  const normalizeMeta = (meta?: Partial<TreeChangeMeta>): TreeChangeMeta => ({
    source: meta?.source ?? defaultMeta.source,
    reason: meta?.reason ?? defaultMeta.reason
  });

  const setTree = (nextTree: BoxNode[]) => {
    boxNodeSchema.array().parse(nextTree);
    tree = nextTree;
  };

  const getTree = () => tree;

  const updateNode = (id: NodeId, patch: Partial<BoxNode>, meta?: Partial<TreeChangeMeta>): TreeChangePayload => {
    const node = findNode(tree, id);
    if (!node) {
      return { tree, patches: [], meta: normalizeMeta(meta) };
    }

    const nextRect = patch.rect ?? node.rect;
    tree = updateNodeRect(tree, id, nextRect);

    return {
      tree,
      patches: [{ id, path: 'rect', prev: node.rect, next: nextRect }],
      meta: normalizeMeta(meta)
    };
  };

  return { getTree, setTree, updateNode };
}
```

```ts
// src/index.ts
export * from './core/engine';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/core/engine.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/core/engine.ts src/index.ts tests/core/engine.test.ts
git commit -m "feat: add engine action dispatcher with change metadata"
```

### Task 6: Build Controlled/Uncontrolled React Bridge

**Files:**
- Create: `src/react/useControlledTree.ts`
- Create: `tests/react/useControlledTree.test.tsx`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing hook tests**

```tsx
// tests/react/useControlledTree.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlledTree } from '../../src/react/useControlledTree';

describe('useControlledTree', () => {
  it('updates internal state in uncontrolled mode', () => {
    const initial = [{ id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 }, children: [] }];
    const { result } = renderHook(() => useControlledTree({ defaultValue: initial }));
    act(() => {
      result.current.setTree([{ id: 'a', rect: { x: 5, y: 5, width: 10, height: 10 }, children: [] }], { source: 'api', reason: 'patch' });
    });
    expect(result.current.tree[0].rect.x).toBe(5);
  });

  it('calls onChange in controlled mode', () => {
    const onChange = vi.fn();
    const value = [{ id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 }, children: [] }];
    const { result } = renderHook(() => useControlledTree({ value, onChange }));
    act(() => {
      result.current.setTree([{ id: 'a', rect: { x: 9, y: 0, width: 10, height: 10 }, children: [] }], { source: 'user', reason: 'drag' });
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/react/useControlledTree.test.tsx`
Expected: FAIL with module not found for `src/react/useControlledTree`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/react/useControlledTree.ts
import { useMemo, useState } from 'react';
import type { BoxNode } from '../types/model';
import type { TreeChangeMeta } from '../types/events';

interface UseControlledTreeOptions {
  value?: BoxNode[];
  defaultValue?: BoxNode[];
  onChange?: (tree: BoxNode[], meta: TreeChangeMeta) => void;
}

export function useControlledTree(options: UseControlledTreeOptions) {
  const { value, defaultValue = [], onChange } = options;
  const isControlled = value !== undefined;
  const [innerTree, setInnerTree] = useState<BoxNode[]>(defaultValue);
  const tree = useMemo(() => (isControlled ? (value as BoxNode[]) : innerTree), [isControlled, value, innerTree]);

  const setTree = (next: BoxNode[], meta: TreeChangeMeta) => {
    if (!isControlled) {
      setInnerTree(next);
    }
    onChange?.(next, meta);
  };

  return { tree, setTree, isControlled };
}
```

```ts
// src/index.ts
export * from './react/useControlledTree';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/react/useControlledTree.test.tsx`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/react/useControlledTree.ts src/index.ts tests/react/useControlledTree.test.tsx
git commit -m "feat: add controlled and uncontrolled state bridge hook"
```

### Task 7: Implement Recursive Renderer with Slot and Styling

**Files:**
- Create: `src/components/TreeNode.tsx`
- Create: `src/components/MoveableTree.tsx`
- Create: `tests/components/MoveableTree.test.tsx`
- Modify: `src/index.ts`

- [ ] **Step 1: Write failing component tests**

```tsx
// tests/components/MoveableTree.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
        renderSlot={(name, node) => <span>{name}:{node.id}</span>}
        getNodeClassName={node => `node-${node.id}`}
      />
    );

    expect(screen.getByText('title:a')).toBeInTheDocument();
    expect(screen.getByTestId('node-b')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/components/MoveableTree.test.tsx`
Expected: FAIL with module not found for `src/components/MoveableTree`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/TreeNode.tsx
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import type { BoxNode } from '../types/model';

interface TreeNodeProps {
  node: BoxNode;
  renderSlot?: (slotName: string, node: BoxNode) => React.ReactNode;
  getNodeClassName?: (node: BoxNode) => string | undefined;
  getNodeStyle?: (node: BoxNode) => CSSProperties | undefined;
}

export function TreeNode({ node, renderSlot, getNodeClassName, getNodeStyle }: TreeNodeProps) {
  return (
    <div
      data-testid={`node-${node.id}`}
      className={clsx('rmt-node', node.view?.className, getNodeClassName?.(node))}
      style={{
        position: 'absolute',
        left: node.rect.x,
        top: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        ...(node.view?.style ?? {}),
        ...(getNodeStyle?.(node) ?? {})
      }}
    >
      {node.view?.slot ? renderSlot?.(node.view.slot, node) : null}
      {(node.children ?? []).map(child => (
        <TreeNode
          key={child.id}
          node={child}
          renderSlot={renderSlot}
          getNodeClassName={getNodeClassName}
          getNodeStyle={getNodeStyle}
        />
      ))}
    </div>
  );
}
```

```tsx
// src/components/MoveableTree.tsx
import { forwardRef, useImperativeHandle } from 'react';
import type { MoveableTreeProps, MoveableTreeRef } from '../types/api';
import { useControlledTree } from '../react/useControlledTree';
import { TreeNode } from './TreeNode';

export const MoveableTree = forwardRef<MoveableTreeRef, MoveableTreeProps>((props, ref) => {
  const { tree, setTree } = useControlledTree({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onChange
  });

  useImperativeHandle(ref, () => ({
    getTree: () => tree,
    setTree: next => setTree(next, { source: 'api', reason: 'patch' }),
    getNode: id => {
      const walk = (nodes: typeof tree): typeof tree[number] | undefined => {
        for (const node of nodes) {
          if (node.id === id) return node;
          const found = walk(node.children ?? []);
          if (found) return found;
        }
        return undefined;
      };
      return walk(tree);
    },
    updateNode: () => {},
    updateNodes: () => {},
    addNode: () => {},
    removeNode: () => {},
    moveNode: () => {},
    focusNode: () => {},
    exportJSON: () => JSON.stringify(tree),
    importJSON: raw => setTree(JSON.parse(raw), { source: 'api', reason: 'import' })
  }));

  return (
    <div
      style={{
        position: 'relative',
        width: props.width,
        height: props.height,
        overflow: 'hidden',
        ...(props.containerStyle ?? {})
      }}
      className={props.containerClassName}
    >
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          renderSlot={props.renderSlot}
          getNodeClassName={props.getNodeClassName}
          getNodeStyle={props.getNodeStyle}
        />
      ))}
    </div>
  );
});

MoveableTree.displayName = 'MoveableTree';
```

```ts
// src/index.ts
export { MoveableTree } from './components/MoveableTree';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/components/MoveableTree.test.tsx`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/components/TreeNode.tsx src/components/MoveableTree.tsx src/index.ts tests/components/MoveableTree.test.tsx
git commit -m "feat: add recursive renderer with slot and style extension hooks"
```

### Task 8: Add Moveable Adapter and Imperative Mutations

**Files:**
- Modify: `src/components/MoveableTree.tsx`
- Create: `src/adapters/moveableAdapter.ts`
- Modify: `src/core/tree.ts`
- Modify: `tests/components/MoveableTree.test.tsx`

- [ ] **Step 1: Write failing imperative API tests**

```tsx
// append in tests/components/MoveableTree.test.tsx
import { createRef } from 'react';
import type { MoveableTreeRef } from '../../src/types/api';

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

  ref.current?.updateNodes([
    { id: 'a', patch: { rect: { x: 40, y: 20, width: 90, height: 80 } } }
  ]);
  expect(ref.current?.getNode('a')?.rect.width).toBe(90);

  ref.current?.addNode('a', { id: 'child-1', rect: { x: 5, y: 5, width: 20, height: 20 }, children: [] });
  ref.current?.moveNode('child-1', 'a', 0);
  expect(ref.current?.getNode('child-1')?.id).toBe('child-1');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/components/MoveableTree.test.tsx -t "supports updateNode, updateNodes and moveNode"`
Expected: FAIL because `updateNode` and `updateNodes` are empty implementations.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/adapters/moveableAdapter.ts
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
```

```ts
// append in src/core/tree.ts
export function updateNode(tree: BoxNode[], id: NodeId, patch: Partial<BoxNode>): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          Object.assign(node, patch);
          return true;
        }
        if (walk(node.children ?? [])) return true;
      }
      return false;
    };
    walk(draft);
  });
}

export function moveNode(tree: BoxNode[], id: NodeId, toParentId: NodeId, index = -1): BoxNode[] {
  const node = findNode(tree, id);
  if (!node) return tree;

  const removed = removeNode(tree, id);
  return produce(removed, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const current of nodes) {
        if (current.id === toParentId) {
          current.children = current.children ?? [];
          if (index < 0 || index >= current.children.length) {
            current.children.push(node);
          } else {
            current.children.splice(index, 0, node);
          }
          return true;
        }
        if (walk(current.children ?? [])) return true;
      }
      return false;
    };
    walk(draft);
  });
}
```

```tsx
// replace empty methods in src/components/MoveableTree.tsx useImperativeHandle
import { addNode as addTreeNode, moveNode as moveTreeNode, removeNode as removeTreeNode, updateNode as updateTreeNode } from '../core/tree';

updateNode: (id, patch, meta) => {
  const next = updateTreeNode(tree, id, patch);
  setTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' });
},
updateNodes: (patches, meta) => {
  let next = tree;
  for (const item of patches) {
    next = updateTreeNode(next, item.id, item.patch);
  }
  setTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' });
},
addNode: (parentId, node, meta) => {
  setTree(addTreeNode(tree, parentId, node), { source: meta?.source ?? 'api', reason: meta?.reason ?? 'add' });
},
removeNode: (id, meta) => {
  setTree(removeTreeNode(tree, id), { source: meta?.source ?? 'api', reason: meta?.reason ?? 'remove' });
},
moveNode: (id, toParentId, index, meta) => {
  setTree(moveTreeNode(tree, id, toParentId, index), { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' });
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/components/MoveableTree.test.tsx`
Expected: PASS with all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/adapters/moveableAdapter.ts src/core/tree.ts src/components/MoveableTree.tsx tests/components/MoveableTree.test.tsx
git commit -m "feat: implement imperative mutation APIs and moveable adapter helpers"
```

### Task 9: Add Import/Export Validation and Error Paths

**Files:**
- Create: `src/core/serialization.ts`
- Modify: `src/components/MoveableTree.tsx`
- Create: `tests/core/serialization.test.ts`

- [ ] **Step 1: Write failing import/export validation tests**

```ts
// tests/core/serialization.test.ts
import { describe, expect, it } from 'vitest';
import { parseTreeJSON } from '../../src/core/serialization';

describe('serialization', () => {
  it('rejects malformed json tree', () => {
    expect(() => parseTreeJSON('[{"id":1}]')).toThrow();
  });

  it('accepts valid json tree', () => {
    expect(() =>
      parseTreeJSON('[{"id":"a","rect":{"x":0,"y":0,"width":10,"height":10},"children":[]}]')
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/serialization.test.ts`
Expected: FAIL with module not found for `src/core/serialization`.

- [ ] **Step 3: Write minimal implementation and correct test**

```ts
// src/core/serialization.ts
import { boxNodeSchema, type BoxNode } from '../types/model';

export function parseTreeJSON(raw: string): BoxNode[] {
  const parsed = JSON.parse(raw);
  return boxNodeSchema.array().parse(parsed);
}

export function stringifyTreeJSON(tree: BoxNode[]): string {
  return JSON.stringify(tree);
}
```

```ts
// tests/core/serialization.test.ts
import { describe, expect, it } from 'vitest';
import { parseTreeJSON } from '../../src/core/serialization';

describe('serialization', () => {
  it('rejects malformed json tree', () => {
    expect(() => parseTreeJSON('[{"id":1}]')).toThrow();
  });

  it('accepts valid json tree', () => {
    expect(() =>
      parseTreeJSON('[{"id":"a","rect":{"x":0,"y":0,"width":10,"height":10},"children":[]}]')
    ).not.toThrow();
  });
});
```

```tsx
// modify importJSON in src/components/MoveableTree.tsx
import { parseTreeJSON, stringifyTreeJSON } from '../core/serialization';

exportJSON: () => stringifyTreeJSON(tree),
importJSON: (raw, meta) => {
  const next = parseTreeJSON(raw);
  setTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'import' });
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/core/serialization.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/core/serialization.ts src/components/MoveableTree.tsx tests/core/serialization.test.ts
git commit -m "feat: validate import/export tree payloads with zod"
```

### Task 10: Documentation, Build, and Release Readiness

**Files:**
- Modify: `README.md`
- Create: `.changeset/initial-release.md`

- [ ] **Step 1: Write failing doc usage test as markdown snippet verification**

```ts
// tests/core/readme-snippet.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('readme', () => {
  it('documents controlled usage and ref api', () => {
    const readme = readFileSync('README.md', 'utf-8');
    expect(readme.includes('value')).toBe(true);
    expect(readme.includes('defaultValue')).toBe(true);
    expect(readme.includes('updateNode')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/core/readme-snippet.test.ts`
Expected: FAIL because README does not contain full API docs yet.

- [ ] **Step 3: Write minimal implementation**

````md
<!-- append in README.md -->
## Usage

```tsx
import { MoveableTree } from 'react-moveable-tree';
import { useRef } from 'react';
import type { MoveableTreeRef } from 'react-moveable-tree';

const ref = useRef<MoveableTreeRef>(null);

<MoveableTree
  ref={ref}
  width={800}
  height={500}
  value={tree}
  onChange={(next, meta) => setTree(next)}
  renderSlot={(slot, node) => <span>{slot}:{node.id}</span>}
/>;

ref.current?.updateNode('node-1', {
  rect: { x: 20, y: 30, width: 220, height: 160 }
});
```

### Non-controlled mode

Use `defaultValue` instead of `value`.

### Imperative methods

- getTree
- setTree
- getNode
- updateNode
- updateNodes
- addNode
- removeNode
- moveNode
- focusNode
- exportJSON
- importJSON
```
````

```md
# .changeset/initial-release.md
---
"react-moveable-tree": minor
---

Initial release with nested bounded draggable/resizable tree component, controlled/uncontrolled modes, and imperative API support.
```

- [ ] **Step 4: Run full verification to confirm everything passes**

Run: `npm run typecheck && npm run test && npm run build`
Expected: PASS with zero TypeScript errors, all tests passing, and dist output generated.

- [ ] **Step 5: Commit**

```bash
git add README.md .changeset/initial-release.md tests/core/readme-snippet.test.ts
git commit -m "docs: add usage guide and release metadata"
```

## Self-Review

### Spec Coverage Check

1. React 17+ compatibility: Covered in Task 1 (`peerDependencies`) and Task 10 verification.
2. Vite + React + TS + Moveable stack: Covered in Task 1 and Task 8.
3. Nested tree render and bounded drag/resize: Covered in Task 3 and Task 7.
4. Controlled/uncontrolled dual mode: Covered in Task 6.
5. External full/targeted updates API: Covered in Task 8.
6. Slot + class + style extension: Covered in Task 7.
7. Import/export and validation robustness: Covered in Task 9.
8. Test strategy across core/react/components: Covered in Tasks 1-10.

No uncovered spec requirement found.

### Placeholder Scan

- No "TBD", "TODO", "implement later", or undefined steps.
- Every task includes file paths, code snippets, commands, expected outcomes, and commit command.

### Type Consistency Check

- `BoxNode`, `TreeChangeMeta`, `MoveableTreeRef`, and `MoveableTreeProps` names remain consistent across tasks.
- `updateNode` / `updateNodes` method names and signatures are consistent between API type and component usage.
