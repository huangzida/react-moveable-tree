# react-moveable-tree

A React component library for nested draggable/resizable boxes inside bounded containers.

## Status

Design phase in progress. See the specification:

- docs/superpowers/specs/2026-04-18-react-moveable-tree-design.md

## Goals

- React 17+ compatibility
- Vite + React + TypeScript + Moveable
- Tree-based nested box rendering
- Controlled and uncontrolled data modes
- External imperative APIs for full and targeted updates
- Strong extensibility for future interaction capabilities

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
	renderSlot={(slot, node) => (
		<span>
			{slot}:{node.id}
		</span>
	)}
/>

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
