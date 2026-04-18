# react-moveable-tree

`react-moveable-tree` 是一个面向 React 17+ 的树形可视化编辑组件库，基于 `react-moveable` 提供嵌套节点的拖拽、缩放、父容器边界约束和外部命令式控制能力。

## 核心能力

- React 17+ 兼容（`react` / `react-dom` 为 peerDependencies）
- 支持树形嵌套节点渲染（节点坐标相对父容器）
- 节点拖拽与缩放，运行时强制约束在父容器范围内
- 受控与非受控双模式
- 命令式 API：整树读写、单节点/批量节点更新、增删移动、JSON 导入导出
- 可扩展渲染能力：`renderSlot`、`getNodeClassName`、`getNodeStyle`
- 变更事件：`onChange` + `onPatch`

## 安装

```bash
npm install react-moveable-tree
```

## 快速使用

```tsx
import { useRef, useState } from 'react';
import { MoveableTree } from 'react-moveable-tree';
import type { BoxNode, MoveableTreeRef } from 'react-moveable-tree';

const initialTree: BoxNode[] = [
	{
		id: 'root-A',
		rect: { x: 20, y: 20, width: 320, height: 220 },
		view: { slot: 'group' },
		children: [{ id: 'A-1', rect: { x: 16, y: 16, width: 120, height: 80 }, children: [] }]
	}
];

export function Example() {
	const ref = useRef<MoveableTreeRef>(null);
	const [tree, setTree] = useState<BoxNode[]>(initialTree);

	return (
		<MoveableTree
			ref={ref}
			width={820}
			height={560}
			value={tree}
			onChange={(nextTree) => setTree(nextTree)}
			onPatch={(patches, meta) => {
				console.log('patches', patches, meta);
			}}
			renderSlot={(slot, node) => (
				<span>
					{slot}:{node.id}
				</span>
			)}
			getNodeClassName={(node) =>
				String(node.data?.kind ?? 'leaf') === 'group' ? 'rmt-node-group' : 'rmt-node-leaf'
			}
			getNodeStyle={(node) =>
				String(node.data?.kind ?? 'leaf') === 'group'
					? { border: '1px dashed #7aa2d9' }
					: { border: '1px solid #b8bfd0' }
			}
		/>
	);
}
```

非受控模式：使用 `defaultValue` 替代 `value`。

## 命令式 API

`MoveableTreeRef` 提供以下方法：

- `getTree()`
- `setTree(next)`
- `getNode(id)`
- `updateNode(id, patch, meta?)`
- `updateNodes(patches, meta?)`
- `addNode(parentId, node, meta?)`
- `removeNode(id, meta?)`
- `moveNode(id, toParentId, index?, meta?)`
- `focusNode(id)`
- `exportJSON()`
- `importJSON(raw, meta?)`

## 本地开发与示例页

仓库内已提供完整示例页，覆盖拖拽/缩放、边界约束、slot、class/style、自定义事件与全部 ref API 的交互测试。

```bash
npm install
npm run demo
```

打开浏览器访问 Vite 输出地址即可使用示例页。

## 脚本

- `npm run demo`：启动示例页（Vite dev server）
- `npm run typecheck`：TypeScript 检查
- `npm run test`：运行 Vitest
- `npm run build`：构建组件库产物

## 设计与计划文档

- `docs/superpowers/specs/2026-04-18-react-moveable-tree-design.md`
- `docs/superpowers/plans/2026-04-18-react-moveable-tree-implementation-plan.md`
