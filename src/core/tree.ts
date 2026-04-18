import { produce } from 'immer';
import { clampDragRect, clampResizeRect } from './constraints';
import type { BoxNode, BoxRect, NodeId } from '../types/model';

interface Size {
  width: number;
  height: number;
}

export function findNode(tree: BoxNode[], id: NodeId): BoxNode | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }

    const found = findNode(node.children ?? [], id);
    if (found) {
      return found;
    }
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

        if (walk(node.children ?? [])) {
          return true;
        }
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

        if (walk(current.children ?? [])) {
          return true;
        }
      }

      return false;
    };

    walk(draft);
  });
}

export function removeNode(tree: BoxNode[], id: NodeId): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      const index = nodes.findIndex(node => node.id === id);
      if (index >= 0) {
        nodes.splice(index, 1);
        return true;
      }

      for (const node of nodes) {
        if (walk(node.children ?? [])) {
          return true;
        }
      }

      return false;
    };

    walk(draft);
  });
}

export function updateNode(tree: BoxNode[], id: NodeId, patch: Partial<BoxNode>): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          Object.assign(node, patch);
          return true;
        }

        if (walk(node.children ?? [])) {
          return true;
        }
      }

      return false;
    };

    walk(draft);
  });
}

export function moveNode(tree: BoxNode[], id: NodeId, toParentId: NodeId, index = -1): BoxNode[] {
  const moving = findNode(tree, id);
  if (!moving) {
    return tree;
  }

  const removed = removeNode(tree, id);

  return produce(removed, draft => {
    const walk = (nodes: BoxNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === toParentId) {
          node.children = node.children ?? [];
          if (index < 0 || index >= node.children.length) {
            node.children.push(moving);
          } else {
            node.children.splice(index, 0, moving);
          }
          return true;
        }

        if (walk(node.children ?? [])) {
          return true;
        }
      }

      return false;
    };

    walk(draft);
  });
}

export function findParentNode(tree: BoxNode[], id: NodeId, parent?: BoxNode): BoxNode | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return parent;
    }

    const found = findParentNode(node.children ?? [], id, node);
    if (found) {
      return found;
    }
  }

  return undefined;
}

export function getParentSize(tree: BoxNode[], id: NodeId, rootSize: Size): Size {
  const parent = findParentNode(tree, id);
  if (!parent) {
    return rootSize;
  }

  return {
    width: parent.rect.width,
    height: parent.rect.height
  };
}

function normalizeNodeRect(node: BoxNode, parentSize: Size): BoxRect {
  const dragged = clampDragRect(node.rect, parentSize);
  const resized = clampResizeRect(dragged, parentSize, node.behavior);
  return clampDragRect(resized, parentSize);
}

export function normalizeTreeRects(tree: BoxNode[], rootSize: Size): BoxNode[] {
  return produce(tree, draft => {
    const walk = (nodes: BoxNode[], parentSize: Size): void => {
      for (const node of nodes) {
        node.rect = normalizeNodeRect(node, parentSize);
        walk(node.children ?? [], {
          width: node.rect.width,
          height: node.rect.height
        });
      }
    };

    walk(draft, rootSize);
  });
}

export function updateNodeWithConstraints(
  tree: BoxNode[],
  id: NodeId,
  patch: Partial<BoxNode>,
  rootSize: Size
): BoxNode[] {
  const current = findNode(tree, id);
  if (!current) {
    return tree;
  }

  const nextPatch = { ...patch };
  if (patch.rect) {
    const parentSize = getParentSize(tree, id, rootSize);
    nextPatch.rect = normalizeNodeRect(
      {
        ...current,
        ...patch,
        rect: patch.rect
      },
      parentSize
    );
  }

  return updateNode(tree, id, nextPatch);
}