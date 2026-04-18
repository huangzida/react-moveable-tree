import Moveable from 'react-moveable';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { toDragRect } from '../adapters/moveableAdapter';
import { parseTreeJSON, stringifyTreeJSON } from '../core/serialization';
import {
  addNode as addTreeNode,
  findNode,
  getParentSize,
  moveNode as moveTreeNode,
  normalizeTreeRects,
  removeNode as removeTreeNode,
  updateNodeWithConstraints
} from '../core/tree';
import { useControlledTree } from '../react/useControlledTree';
import type { MoveableTreeProps, MoveableTreeRef } from '../types/api';
import type { TreePatch } from '../types/events';
import { TreeNode } from './TreeNode';

export const MoveableTree = forwardRef<MoveableTreeRef, MoveableTreeProps>((props, ref) => {
  const { tree, setTree } = useControlledTree({
    value: props.value,
    defaultValue: props.defaultValue,
    onChange: props.onChange
  });

  const treeRef = useRef(tree);
  treeRef.current = tree;
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const nodeElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const rootSize = useMemo(() => ({ width: props.width, height: props.height }), [props.width, props.height]);

  const findById = useCallback((id: string) => findNode(treeRef.current, id), []);

  const registerNodeElement = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeElementsRef.current.set(id, element);
      return;
    }

    nodeElementsRef.current.delete(id);
  }, []);

  const applyNextTree = useCallback(
    (
      next: typeof tree,
      meta: { source: 'api' | 'user' | 'external'; reason: 'drag' | 'resize' | 'add' | 'remove' | 'patch' | 'import' },
      patches: TreePatch[] = []
    ): void => {
      treeRef.current = next;
      setTree(next, meta);
      if (patches.length > 0) {
        props.onPatch?.(patches, meta);
      }
    },
    [props, setTree]
  );

  const patchRect = useCallback((id: string, prev: unknown, next: unknown): TreePatch[] => {
    return [
      {
        id,
        path: 'rect',
        prev,
        next
      }
    ];
  }, []);

  const normalizeIncomingTree = useCallback((next: typeof tree) => {
    return normalizeTreeRects(next, rootSize);
  }, [rootSize]);

  const updateNodePatch = useCallback(
    (
      id: string,
      patch: Partial<Parameters<MoveableTreeRef['updateNode']>[1]>,
      source: 'api' | 'user' | 'external',
      reason: 'drag' | 'resize' | 'add' | 'remove' | 'patch' | 'import'
    ) => {
      const current = findById(id);
      const next = updateNodeWithConstraints(treeRef.current, id, patch, rootSize);
      const nextNode = findNode(next, id);
      const patches =
        patch.rect && current && nextNode
          ? patchRect(id, current.rect, nextNode.rect)
          : [
              {
                id,
                path: '$',
                prev: current,
                next: nextNode
              }
            ];
      applyNextTree(next, { source, reason }, patches);
    },
    [applyNextTree, findById, patchRect, rootSize]
  );

  const updateNodeRectByUser = useCallback(
    (id: string, rect: { x: number; y: number; width: number; height: number }, reason: 'drag' | 'resize') => {
      const current = findById(id);
      if (!current) {
        return;
      }

      updateNodePatch(id, { rect }, 'user', reason);
    },
    [findById, updateNodePatch]
  );

  useImperativeHandle(
    ref,
    () => ({
      getTree: () => treeRef.current,
      setTree: next => {
        const normalized = normalizeIncomingTree(next);
        applyNextTree(normalized, { source: 'api', reason: 'patch' }, [
          {
            id: '__root__',
            path: '$',
            prev: treeRef.current,
            next: normalized
          }
        ]);
      },
      getNode: id => findById(id),
      updateNode: (id, patch, meta) => {
        updateNodePatch(id, patch, meta?.source ?? 'api', meta?.reason ?? 'patch');
      },
      updateNodes: (patches, meta) => {
        let next = treeRef.current;
        const nextPatches: TreePatch[] = [];
        for (const item of patches) {
          const prevNode = findNode(next, item.id);
          next = updateNodeWithConstraints(next, item.id, item.patch, rootSize);
          const nextNode = findNode(next, item.id);
          nextPatches.push({
            id: item.id,
            path: item.patch.rect ? 'rect' : '$',
            prev: item.patch.rect ? prevNode?.rect : prevNode,
            next: item.patch.rect ? nextNode?.rect : nextNode
          });
        }
        applyNextTree(next, { source: meta?.source ?? 'api', reason: meta?.reason ?? 'patch' }, nextPatches);
      },
      addNode: (parentId, node, meta) => {
        const parent = findById(parentId);
        const parentSize = parent
          ? {
              width: parent.rect.width,
              height: parent.rect.height
            }
          : rootSize;
        const normalizedNode = normalizeTreeRects([node], parentSize)[0];
        const next = addTreeNode(treeRef.current, parentId, normalizedNode);
        applyNextTree(next, {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'add'
        }, [
          {
            id: parentId,
            path: 'children',
            prev: findById(parentId)?.children,
            next: findNode(next, parentId)?.children
          }
        ]);
      },
      removeNode: (id, meta) => {
        const prev = findById(id);
        const next = removeTreeNode(treeRef.current, id);
        applyNextTree(next, {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'remove'
        }, [
          {
            id,
            path: '$',
            prev,
            next: undefined
          }
        ]);
        if (selectedId === id) {
          setSelectedId(undefined);
        }
      },
      moveNode: (id, toParentId, index, meta) => {
        const movedPrev = findById(id);
        let next = moveTreeNode(treeRef.current, id, toParentId, index);
        const movedAfter = findNode(next, id);
        if (movedAfter) {
          next = updateNodeWithConstraints(next, id, { rect: movedAfter.rect }, rootSize);
        }

        applyNextTree(next, {
          source: meta?.source ?? 'api',
          reason: meta?.reason ?? 'patch'
        }, [
          {
            id,
            path: '$',
            prev: movedPrev,
            next: findNode(next, id)
          }
        ]);
      },
      focusNode: id => {
        if (findById(id)) {
          setSelectedId(id);
        }
      },
      exportJSON: () => stringifyTreeJSON(treeRef.current),
      importJSON: raw => {
        const parsed = parseTreeJSON(raw);
        const normalized = normalizeIncomingTree(parsed);
        applyNextTree(normalized, { source: 'api', reason: 'import' }, [
          {
            id: '__root__',
            path: '$',
            prev: treeRef.current,
            next: normalized
          }
        ]);
      }
    }),
    [applyNextTree, findById, normalizeIncomingTree, rootSize, selectedId, updateNodePatch]
  );

  const selectedElement = selectedId ? nodeElementsRef.current.get(selectedId) ?? null : null;
  const selectedParentSize = selectedId ? getParentSize(treeRef.current, selectedId, rootSize) : rootSize;

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
      {!props.disabled ? (
        <Moveable
          target={selectedElement}
          draggable
          resizable
          keepRatio={false}
          bounds={{
            left: 0,
            top: 0,
            right: selectedParentSize.width,
            bottom: selectedParentSize.height
          }}
          onDrag={(event: { left: number; top: number }) => {
            if (!selectedId) {
              return;
            }

            const current = findById(selectedId);
            if (!current) {
              return;
            }

            const nextRect = toDragRect(current.rect, {
              left: event.left,
              top: event.top
            });

            updateNodeRectByUser(selectedId, nextRect, 'drag');
          }}
          onResize={
            (event: {
              width: number;
              height: number;
              drag?: { beforeTranslate?: number[] };
            }) => {
              if (!selectedId) {
                return;
              }

              const current = findById(selectedId);
              if (!current) {
                return;
              }

              const beforeTranslate = event.drag?.beforeTranslate;
              const translateX = beforeTranslate?.[0] ?? current.rect.x;
              const translateY = beforeTranslate?.[1] ?? current.rect.y;
              updateNodeRectByUser(
                selectedId,
                {
                  x: translateX,
                  y: translateY,
                  width: event.width,
                  height: event.height
                },
                'resize'
              );
            }
          }
        />
      ) : null}
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          renderSlot={props.renderSlot}
          getNodeClassName={props.getNodeClassName}
          getNodeStyle={props.getNodeStyle}
          selectedId={selectedId}
          onSelect={setSelectedId}
          registerNodeElement={registerNodeElement}
        />
      ))}
    </div>
  );
});

MoveableTree.displayName = 'MoveableTree';