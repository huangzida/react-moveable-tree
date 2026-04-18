import { useEffect, useState } from 'react';
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
  const [innerTree, setInnerTree] = useState<BoxNode[]>(() => {
    return isControlled ? (value as BoxNode[]) : defaultValue;
  });

  useEffect(() => {
    if (isControlled) {
      setInnerTree(value as BoxNode[]);
    }
  }, [isControlled, value]);

  const setTree = (next: BoxNode[], meta: TreeChangeMeta): void => {
    setInnerTree(next);
    onChange?.(next, meta);
  };

  return {
    tree: innerTree,
    setTree,
    isControlled
  };
}