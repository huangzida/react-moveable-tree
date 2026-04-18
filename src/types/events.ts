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