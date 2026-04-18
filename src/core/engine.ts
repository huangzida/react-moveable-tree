import type { TreeChangeMeta, TreeChangePayload } from '../types/events';
import { boxNodeSchema, type BoxNode, type NodeId } from '../types/model';
import { findNode, updateNodeRect } from './tree';

const defaultMeta: TreeChangeMeta = {
  source: 'api',
  reason: 'patch'
};

export function createEngine(initialTree: BoxNode[]) {
  let tree = initialTree;

  const normalizeMeta = (meta?: Partial<TreeChangeMeta>): TreeChangeMeta => ({
    source: meta?.source ?? defaultMeta.source,
    reason: meta?.reason ?? defaultMeta.reason
  });

  const setTree = (nextTree: BoxNode[]): void => {
    boxNodeSchema.array().parse(nextTree);
    tree = nextTree;
  };

  const getTree = (): BoxNode[] => tree;

  const updateNode = (id: NodeId, patch: Partial<BoxNode>, meta?: Partial<TreeChangeMeta>): TreeChangePayload => {
    const current = findNode(tree, id);
    if (!current) {
      return {
        tree,
        patches: [],
        meta: normalizeMeta(meta)
      };
    }

    const nextRect = patch.rect ?? current.rect;
    tree = updateNodeRect(tree, id, nextRect);

    return {
      tree,
      patches: [
        {
          id,
          path: 'rect',
          prev: current.rect,
          next: nextRect
        }
      ],
      meta: normalizeMeta(meta)
    };
  };

  return {
    getTree,
    setTree,
    updateNode
  };
}