# React Moveable Tree 设计规范

日期: 2026-04-18

## 1. 背景与目标

该库面向第三方 React 项目，提供一个支持树形嵌套盒子的编辑容器。每个盒子都支持拖拽与缩放，并且必须被约束在其父容器内部。组件需要根据树形数组动态渲染，支持外部读取完整数据、修改全部或指定节点，并支持自定义内容插槽和样式扩展。

核心目标:

1. 支持 React 17 及以上版本。
2. 技术栈采用 Vite + React + TypeScript + Moveable。
3. 支持受控与非受控双模式。
4. 支持递归嵌套、多节点交互与统一约束。
5. 对外暴露稳定 API，便于外部系统集成与二次扩展。

## 2. 架构方案与结论

### 2.1 候选方案

A. 单体组件方案
- 优点: 初期开发快。
- 缺点: 随着功能增长，维护与扩展成本高。

B. 分层方案（推荐）
- Core Engine（纯 TS 逻辑内核）
- Interaction Adapter（Moveable 事件适配）
- React Binding（受控/非受控桥接）
- UI Components（递归渲染层）
- Public API（声明式 + 命令式）
- 优点: 扩展性强、可测试性强、长期稳定。

C. Store-first 方案
- 优点: 状态集中、便于调试。
- 缺点: 对使用方有额外绑定成本，库侵入性较高。

### 2.2 最终决策

采用 B 分层方案，优先保证扩展性、稳定性和对接灵活性。

## 3. 核心数据模型

```ts
type NodeId = string;

interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoxBehavior {
  draggable?: boolean;
  resizable?: boolean;
  lockAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface BoxView {
  className?: string;
  style?: React.CSSProperties;
  slot?: string;
  slotProps?: Record<string, unknown>;
  zIndex?: number;
}

interface BoxNode {
  id: NodeId;
  rect: BoxRect;
  behavior?: BoxBehavior;
  view?: BoxView;
  data?: Record<string, unknown>;
  children?: BoxNode[];
}
```

### 3.1 坐标系统

采用局部坐标系:
- 子节点坐标相对于父节点。
- 根容器作为全局参考原点。

优势:
- 父节点移动时，子节点无需重写坐标数据。
- 递归约束计算更稳定。

### 3.2 约束规则

拖拽约束:
- x ∈ [0, parentWidth - width]
- y ∈ [0, parentHeight - height]

缩放约束:
- width ∈ [minWidth, parentWidth - x]
- height ∈ [minHeight, parentHeight - y]

所有结果在 Core 层统一 clamp，避免 UI 层分散逻辑。

## 4. 对外 API 设计

### 4.1 声明式 Props

- value?: BoxNode[]
- defaultValue?: BoxNode[]
- onChange?: (tree: BoxNode[]) => void
- onPatch?: (patches: TreePatch[]) => void
- width / height
- containerClassName / containerStyle
- disabled?: boolean
- renderSlot?: (slotName: string, node: BoxNode) => React.ReactNode
- getNodeClassName?: (node: BoxNode) => string | undefined
- getNodeStyle?: (node: BoxNode) => React.CSSProperties | undefined
- moveableOptions?: MoveableOptions
- onNodeDragStart / onNodeDrag / onNodeDragEnd
- onNodeResizeStart / onNodeResize / onNodeResizeEnd
- onSelectChange

### 4.2 命令式 Ref API

- getTree(): BoxNode[]
- setTree(next: BoxNode[]): void
- getNode(id: NodeId): BoxNode | undefined
- updateNode(id: NodeId, patch: Partial<BoxNode>): void
- updateNodes(patches: Array<{ id: NodeId; patch: Partial<BoxNode> }>): void
- addNode(parentId: NodeId, node: BoxNode): void
- removeNode(id: NodeId): void
- moveNode(id: NodeId, toParentId: NodeId, index?: number): void
- focusNode(id: NodeId): void
- exportJSON(): string
- importJSON(raw: string): void

### 4.3 事件元数据协议

每次变更附带来源和原因:
- source: user | api | external
- reason: drag | resize | add | remove | patch | import

## 5. 内部模块拆分

建议目录结构:

```text
src/
  core/
    engine.ts
    constraints.ts
    geometry.ts
    tree-index.ts
    actions.ts
    patches.ts
    normalize.ts
  adapters/
    moveable-adapter.ts
  react/
    useBoxesEngine.ts
    useControlledState.ts
    context.ts
  components/
    Canvas.tsx
    BoxNodeView.tsx
    MoveableLayer.tsx
  types/
    model.ts
    events.ts
    api.ts
  utils/
    object-path.ts
    deep-clone.ts
  index.ts
```

职责边界:
- core: 可脱离 React 独立测试。
- adapters: 将 Moveable 事件转成统一 Action。
- react: 状态桥接与上下文。
- components: 视图递归渲染与交互挂载。

## 6. 开源依赖选择（优先成熟库）

运行时核心依赖:

1. react-moveable: 拖拽/缩放交互能力。
2. @scena/matrix（按需）: 复杂变换矩阵辅助。
3. immer: 不可变数据更新，提升树操作可维护性。
4. nanoid: 稳定节点 ID 生成。
5. clsx: className 组合。

开发依赖建议:

1. vite
2. @vitejs/plugin-react
3. typescript
4. vitest
5. jsdom
6. @types/react / @types/react-dom
7. eslint + @typescript-eslint + eslint-plugin-react-hooks
8. tsup 或 vite library mode（二选一，优先 Vite library mode）
9. changesets（版本发布与变更日志）

兼容策略:
- peerDependencies: react >=17, react-dom >=17
- 不依赖 React 18 专属 API（如 useId 的强绑定路径）

## 7. 可扩展性设计

### 7.1 扩展点

- 交互扩展: rotate、snap、guideline、multi-select。
- 行为扩展: 锁定节点、只读节点、权限策略。
- 渲染扩展: 自定义节点壳、Handle UI 替换。
- 数据扩展: 节点业务元数据与 schema 校验。

### 7.2 插件化机制（后续版本）

定义 plugin hooks:
- beforeAction(action, state)
- afterAction(result, state)
- onSerialize(tree)
- onDeserialize(raw)

这样可无侵入接入审计、协作、历史记录等能力。

## 8. 性能策略

1. 节点索引缓存（id -> path）减少树遍历。
2. 拖拽过程中仅更新活跃节点，交互结束后提交全量快照。
3. React 组件层使用 memo，避免递归树全量重渲染。
4. 批量 patch 合并，减少 onChange 触发频率。

## 9. 错误处理与健壮性

1. 非法节点尺寸自动修正并发出 warning 回调。
2. 缺失父节点或循环引用输入时直接 reject。
3. importJSON 提供 schema 校验失败信息。
4. 约束冲突（如 minWidth > parentWidth）执行降级策略并记录。

## 10. 测试策略

优先保证 core 层测试完备:

1. tree 操作单测（增删改查、跨父节点移动）。
2. 约束计算单测（边界、最小尺寸、比例锁定）。
3. 受控/非受控桥接测试（状态一致性）。
4. Moveable 事件适配测试（action 转换准确性）。
5. React 渲染基础测试（slot、class、style 透传）。

## 11. 版本与发布策略

1. 语义化版本（SemVer）。
2. changesets 生成 changelog。
3. npm 发布前执行 typecheck + test + build。
4. 提供 migration notes，降低升级成本。

## 12. 里程碑规划

M1: 最小可用版本
- 树渲染、拖拽、缩放、边界约束
- 受控/非受控双模式
- 核心 ref API

M2: 工程增强
- 单测完善
- 文档与示例
- 版本发布流水线

M3: 高级能力
- 对齐线、吸附、多选
- 插件机制初版

## 13. 非目标（当前阶段）

1. 实时多人协作。
2. 复杂 3D 变换。
3. 服务端布局引擎。

## 14. 风险与应对

风险:
1. 递归节点多时渲染抖动。
2. 受控模式与高频拖拽下的状态回跳。
3. React 17 与 18 行为差异导致边缘问题。

应对:
1. 将高频逻辑下沉 core，减少 React 频繁 setState。
2. 引入事务提交与版本号防抖。
3. 建立 React 17/18 双版本示例与回归测试矩阵。

## 15. 验收标准

1. 任意节点拖拽/缩放均不越界父容器。
2. 嵌套节点可独立交互且数据更新正确。
3. 外部可读取完整树并能单点/批量更新。
4. slot + class + style 自定义生效。
5. React 17+ 工程可正常安装与运行。
