import { produce } from 'immer';
import type { BoxNode, BoxRect, NodeId } from '../types/model';

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