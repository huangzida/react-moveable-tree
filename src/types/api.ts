import type { CSSProperties, ReactNode } from 'react';
import type { TreeChangeMeta, TreePatch } from './events';
import type { BoxNode, NodeId } from './model';

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