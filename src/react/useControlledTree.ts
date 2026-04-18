import { useMemo, useState } from 'react';
import type { TreeChangeMeta } from '../types/events';
import type { BoxNode } from '../types/model';

interface UseControlledTreeOptions {
  value?: BoxNode[];
  defaultValue?: BoxNode[];
  onChange?: (tree: BoxNode[], meta: TreeChangeMeta) => void;
}

interface UseControlledTreeResult {
  tree: BoxNode[];
  setTree: (next: BoxNode[], meta: TreeChangeMeta) => void;
  isControlled: boolean;
}

export function useControlledTree(options: UseControlledTreeOptions): UseControlledTreeResult {
  const { value, defaultValue = [], onChange } = options;
  const isControlled = value !== undefined;
  const [innerTree, setInnerTree] = useState<BoxNode[]>(defaultValue);

  const tree = useMemo(() => {
    return isControlled ? (value as BoxNode[]) : innerTree;
  }, [isControlled, value, innerTree]);

  const setTree = (next: BoxNode[], meta: TreeChangeMeta): void => {
    if (!isControlled) {
      setInnerTree(next);
    }
    onChange?.(next, meta);
  };

  return {
    tree,
    setTree,
    isControlled
  };
}