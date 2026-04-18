import { forwardRef, useImperativeHandle } from 'react';
import { useControlledTree } from '../react/useControlledTree';
import type { MoveableTreeProps, MoveableTreeRef } from '../types/api';
import { TreeNode } from './TreeNode';

export const MoveableTree = forwardRef<MoveableTreeRef, MoveableTreeProps>((props, ref) => {
  const { tree, setTree } = useControlledTree({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onChange
  });

  useImperativeHandle(
    ref,
    () => ({
      getTree: () => tree,
      setTree: next => setTree(next, { source: 'api', reason: 'patch' }),
      getNode: id => {
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

        return walk(tree);
      },
      updateNode: () => {},
      updateNodes: () => {},
      addNode: () => {},
      removeNode: () => {},
      moveNode: () => {},
      focusNode: () => {},
      exportJSON: () => JSON.stringify(tree),
      importJSON: raw => setTree(JSON.parse(raw), { source: 'api', reason: 'import' })
    }),
    [setTree, tree]
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