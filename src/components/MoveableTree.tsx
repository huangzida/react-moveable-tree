import { forwardRef, useImperativeHandle, useRef } from 'react';
import { parseTreeJSON, stringifyTreeJSON } from '../core/serialization';
import { addNode as addTreeNode, moveNode as moveTreeNode, removeNode as removeTreeNode, updateNode as updateTreeNode } from '../core/tree';
import { useControlledTree } from '../react/useControlledTree';
import type { MoveableTreeProps, MoveableTreeRef } from '../types/api';
import { TreeNode } from './TreeNode';

export const MoveableTree = forwardRef<MoveableTreeRef, MoveableTreeProps>((props, ref) => {
  const { tree, setTree } = useControlledTree({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onChange
  });

  const treeRef = useRef(tree);
  treeRef.current = tree;

  const findById = (id: string) => {
    const walk = (nodes: typeof tree): (typeof tree)[number] | undefined => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }

        const found = walk(node.children ?? []);
        if (found) {
          return found;
        }
      }

      return undefined;
    };

    return walk(treeRef.current);
  };

  const applyNextTree = (
    next: typeof tree,
    meta: { source: 'api' | 'user' | 'external'; reason: 'drag' | 'resize' | 'add' | 'remove' | 'patch' | 'import' }
  ): void => {
    treeRef.current = next;
    setTree(next, meta);
  };

  useImperativeHandle(
    ref,
    () => ({
      getTree: () => treeRef.current,
      setTree: next => applyNextTree(next, { source: 'api', reason: 'patch' }),
      getNode: id => findById(id),
      updateNode: (id, patch, meta) => {
        const next = updateTreeNode(treeRef.current, id, patch);
        applyNextTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' });
      },
      updateNodes: (patches, meta) => {
        let next = treeRef.current;
        for (const item of patches) {
          next = updateTreeNode(next, item.id, item.patch);
        }
        applyNextTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' });
      },
      addNode: (parentId, node, meta) => {
        applyNextTree(addTreeNode(treeRef.current, parentId, node), {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'add'
        });
      },
      removeNode: (id, meta) => {
        applyNextTree(removeTreeNode(treeRef.current, id), {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'remove'
        });
      },
      moveNode: (id, toParentId, index, meta) => {
        applyNextTree(moveTreeNode(treeRef.current, id, toParentId, index), {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'patch'
        });
      },
      focusNode: () => {},
      exportJSON: () => stringifyTreeJSON(treeRef.current),
      importJSON: raw => applyNextTree(parseTreeJSON(raw), { source: 'api', reason: 'import' })
    }),
    [setTree]
  );

  return (
    <div
      className={props.containerClassName}
      style={{
        position: 'relative',
        width: props.width,
        height: props.height,
        overflow: 'hidden',
        ...(props.containerStyle ?? {})
      }}
    >
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          renderSlot={props.renderSlot}
          getNodeClassName={props.getNodeClassName}
          getNodeStyle={props.getNodeStyle}
        />
      ))}
    </div>
  );
});

MoveableTree.displayName = 'MoveableTree';