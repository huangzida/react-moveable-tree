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
  const resizeStartRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const renderSlotRef = useRef(props.renderSlot);
  const getNodeClassNameRef = useRef(props.getNodeClassName);
  const getNodeStyleRef = useRef(props.getNodeStyle);
  const rootSize = useMemo(() => ({ width: props.width, height: props.height }), [props.width, props.height]);

  renderSlotRef.current = props.renderSlot;
  getNodeClassNameRef.current = props.getNodeClassName;
  getNodeStyleRef.current = props.getNodeStyle;

  const renderSlot = useCallback<NonNullable<MoveableTreeProps['renderSlot']>>((node) => {
    return renderSlotRef.current ? renderSlotRef.current(node) : null;
  }, []);

  const getNodeClassName = useCallback<NonNullable<MoveableTreeProps['getNodeClassName']>>((node) => {
    return getNodeClassNameRef.current ? getNodeClassNameRef.current(node) : undefined;
  }, []);

  const getNodeStyle = useCallback<NonNullable<MoveableTreeProps['getNodeStyle']>>((node) => {
    return getNodeStyleRef.current ? getNodeStyleRef.current(node) : undefined;
  }, []);

  const findById = useCallback((id: string) => findNode(treeRef.current, id), []);

  const registerNodeElement = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      nodeElementsRef.current.set(id, element);
      return;
    }

    nodeElementsRef.current.delete(id);
  }, []);

  const applyRectToElement = useCallback((id: string, rect: { x: number; y: number; width: number; height: number }) => {
    const element = nodeElementsRef.current.get(id);
    if (!element) {
      return;
    }

    element.style.left = `${rect.x}px`;
    element.style.top = `${rect.y}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
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

      const nextTree = updateNodeWithConstraints(treeRef.current, id, { rect }, rootSize);
      const nextNode = findNode(nextTree, id);
      if (!nextNode) {
        return;
      }

      if (
        current.rect.x === nextNode.rect.x &&
        current.rect.y === nextNode.rect.y &&
        current.rect.width === nextNode.rect.width &&
        current.rect.height === nextNode.rect.height
      ) {
        return;
      }

      applyRectToElement(id, nextNode.rect);
      applyNextTree(nextTree, { source: 'user', reason }, patchRect(id, current.rect, nextNode.rect));
    },
    [applyNextTree, applyRectToElement, findById, patchRect, rootSize]
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
          origin={false}
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
          onResizeStart={() => {
            if (!selectedId) {
              return;
            }

            const current = findById(selectedId);
            if (!current) {
              return;
            }

            resizeStartRectRef.current = { ...current.rect };
          }}
          onResize={
            (event: {
              width: number;
              height: number;
              drag?: { left?: number; top?: number; beforeTranslate?: number[] };
            }) => {
              if (!selectedId) {
                return;
              }

              const current = findById(selectedId);
              if (!current) {
                return;
              }

              const dragLeft = event.drag?.left;
              const dragTop = event.drag?.top;
              const beforeTranslate = event.drag?.beforeTranslate;
              const resizeStartRect = resizeStartRectRef.current ?? current.rect;
              const translateX = dragLeft ?? resizeStartRect.x + (beforeTranslate?.[0] ?? 0);
              const translateY = dragTop ?? resizeStartRect.y + (beforeTranslate?.[1] ?? 0);
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
          onResizeEnd={() => {
            resizeStartRectRef.current = null;
          }}
        />
      ) : null}
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          renderSlot={renderSlot}
          getNodeClassName={getNodeClassName}
          getNodeStyle={getNodeStyle}
          selectedId={selectedId}
          onSelect={setSelectedId}
          registerNodeElement={registerNodeElement}
        />
      ))}
    </div>
  );
});

MoveableTree.displayName = 'MoveableTree';