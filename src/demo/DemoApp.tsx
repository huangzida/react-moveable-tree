import { useMemo, useRef, useState } from 'react';
import { MoveableTree } from '../components/MoveableTree';
import type { MoveableTreeRef } from '../types/api';
import type { BoxNode } from '../types/model';

const createInitialTree = (): BoxNode[] => [
  {
    id: 'root-A',
    rect: { x: 24, y: 20, width: 420, height: 310 },
    view: { slot: 'group' },
    data: { kind: 'group', label: 'Group A' },
    children: [
      {
        id: 'A-1',
        rect: { x: 24, y: 34, width: 150, height: 110 },
        view: { slot: 'leaf' },
        data: { kind: 'leaf', label: 'Node A-1' },
        children: []
      },
      {
        id: 'A-2',
        rect: { x: 220, y: 166, width: 160, height: 110 },
        view: { slot: 'leaf' },
        data: { kind: 'leaf', label: 'Node A-2' },
        children: []
      }
    ]
  },
  {
    id: 'root-B',
    rect: { x: 476, y: 90, width: 280, height: 250 },
    view: { slot: 'group' },
    data: { kind: 'group', label: 'Group B' },
    children: [
      {
        id: 'B-1',
        rect: { x: 36, y: 30, width: 110, height: 90 },
        view: { slot: 'leaf' },
        data: { kind: 'leaf', label: 'Node B-1' },
        children: []
      }
    ]
  }
];

const formatTree = (tree: BoxNode[]): string => JSON.stringify(tree, null, 2);

export function DemoApp() {
  const [tree, setTree] = useState<BoxNode[]>(() => createInitialTree());
  const [targetNodeId, setTargetNodeId] = useState('A-1');
  const [targetParentId, setTargetParentId] = useState('root-B');
  const [jsonEditor, setJsonEditor] = useState(formatTree(createInitialTree()));
  const [latestNodeInfo, setLatestNodeInfo] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const ref = useRef<MoveableTreeRef>(null);

  const nodeIdOptions = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: BoxNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        walk(node.children ?? []);
      }
    };
    walk(tree);
    return ids;
  }, [tree]);

  const appendLog = (line: string) => {
    setLogs(prev => {
      const next = [`${new Date().toLocaleTimeString()} ${line}`, ...prev];
      return next.slice(0, 18);
    });
  };

  const addChild = () => {
    const id = `N-${Date.now().toString().slice(-5)}`;
    ref.current?.addNode(targetNodeId, {
      id,
      rect: { x: 16, y: 16, width: 120, height: 80 },
      view: { slot: 'leaf' },
      data: { kind: 'leaf', label: `Node ${id}` },
      children: []
    });
    appendLog(`addNode -> ${targetNodeId}`);
  };

  const removeNode = () => {
    if (targetNodeId.startsWith('root-')) {
      appendLog('removeNode skipped (root node protected in demo)');
      return;
    }

    ref.current?.removeNode(targetNodeId);
    appendLog(`removeNode -> ${targetNodeId}`);
  };

  const focusNode = () => {
    ref.current?.focusNode(targetNodeId);
    appendLog(`focusNode -> ${targetNodeId}`);
  };

  const updateNodeRect = () => {
    const node = ref.current?.getNode(targetNodeId);
    if (!node) {
      appendLog(`updateNode skipped (${targetNodeId} not found)`);
      return;
    }

    ref.current?.updateNode(targetNodeId, {
      rect: {
        ...node.rect,
        x: node.rect.x + 12,
        y: node.rect.y + 8,
        width: node.rect.width + 6,
        height: node.rect.height + 4
      }
    });
    appendLog(`updateNode rect -> ${targetNodeId}`);
  };

  const batchUpdate = () => {
    const first = nodeIdOptions[0];
    const second = nodeIdOptions[1];
    if (!first || !second) {
      return;
    }

    const nodeOne = ref.current?.getNode(first);
    const nodeTwo = ref.current?.getNode(second);
    if (!nodeOne || !nodeTwo) {
      return;
    }

    ref.current?.updateNodes([
      {
        id: first,
        patch: {
          rect: {
            ...nodeOne.rect,
            x: nodeOne.rect.x + 10,
            y: nodeOne.rect.y + 10
          }
        }
      },
      {
        id: second,
        patch: {
          rect: {
            ...nodeTwo.rect,
            x: nodeTwo.rect.x + 6,
            y: nodeTwo.rect.y + 6
          }
        }
      }
    ]);
    appendLog(`updateNodes -> ${first}, ${second}`);
  };

  const moveNode = () => {
    ref.current?.moveNode(targetNodeId, targetParentId, 0);
    appendLog(`moveNode -> ${targetNodeId} to ${targetParentId}`);
  };

  const inspectNode = () => {
    const node = ref.current?.getNode(targetNodeId);
    setLatestNodeInfo(node ? JSON.stringify(node, null, 2) : `${targetNodeId} not found`);
    appendLog(`getNode -> ${targetNodeId}`);
  };

  const snapshotTree = () => {
    const next = ref.current?.getTree() ?? [];
    setJsonEditor(formatTree(next));
    appendLog('getTree snapshot');
  };

  const setTreeByApi = () => {
    ref.current?.setTree(createInitialTree());
    appendLog('setTree -> reset to initial data');
  };

  const exportJson = () => {
    const raw = ref.current?.exportJSON() ?? '[]';
    setJsonEditor(raw);
    appendLog('exportJSON');
  };

  const importJson = () => {
    try {
      ref.current?.importJSON(jsonEditor);
      appendLog('importJSON success');
    } catch (error) {
      appendLog(`importJSON failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="demo-shell">
      <section className="demo-panel demo-controls">
        <h1>react-moveable-tree 功能示例</h1>
        <p>左侧是 API 操作面板，右侧是可拖拽/缩放的树形节点画布。</p>

        <div className="demo-row">
          <label htmlFor="target-node">目标节点 ID</label>
          <select id="target-node" value={targetNodeId} onChange={event => setTargetNodeId(event.target.value)}>
            {nodeIdOptions.map(id => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        <div className="demo-row">
          <label htmlFor="target-parent">移动目标父节点</label>
          <select id="target-parent" value={targetParentId} onChange={event => setTargetParentId(event.target.value)}>
            {nodeIdOptions
              .filter(id => id !== targetNodeId)
              .map(id => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
          </select>
        </div>

        <div className="demo-actions">
          <button type="button" onClick={focusNode}>
            focusNode
          </button>
          <button type="button" onClick={inspectNode}>
            getNode
          </button>
          <button type="button" onClick={updateNodeRect}>
            updateNode
          </button>
          <button type="button" onClick={batchUpdate}>
            updateNodes
          </button>
          <button type="button" onClick={addChild}>
            addNode
          </button>
          <button type="button" className="danger" onClick={removeNode}>
            removeNode
          </button>
          <button type="button" onClick={moveNode}>
            moveNode
          </button>
          <button type="button" onClick={setTreeByApi}>
            setTree
          </button>
          <button type="button" onClick={snapshotTree}>
            getTree
          </button>
          <button type="button" onClick={exportJson}>
            exportJSON
          </button>
          <button type="button" onClick={importJson}>
            importJSON
          </button>
        </div>

        <div className="demo-row">
          <label htmlFor="json-editor">JSON 编辑器（getTree/exportJSON 输出，importJSON 输入）</label>
          <textarea
            id="json-editor"
            value={jsonEditor}
            onChange={event => setJsonEditor(event.target.value)}
          />
        </div>

        <div className="demo-row">
          <label htmlFor="node-view">节点详情（getNode）</label>
          <textarea id="node-view" value={latestNodeInfo} readOnly />
        </div>

        <div className="demo-row">
          <label>事件日志（onChange / onPatch）</label>
          <div className="demo-log">{logs.join('\n') || '暂无日志'}</div>
        </div>
      </section>

      <section className="demo-panel demo-playground">
        <div className="demo-playground-header">
          <h2>交互画布</h2>
          <span>点击节点后可拖拽 / 缩放，约束始终在父容器内</span>
        </div>

        <MoveableTree
          ref={ref}
          width={820}
          height={620}
          value={tree}
          onChange={(nextTree, meta) => {
            setTree(nextTree);
            appendLog(`onChange source=${meta.source} reason=${meta.reason}`);
          }}
          onPatch={(patches, meta) => {
            appendLog(`onPatch source=${meta.source} reason=${meta.reason} count=${patches.length}`);
          }}
          containerClassName="demo-canvas"
          renderSlot={(slot, node) => (
            <div className="demo-slot">
              <span>{slot}</span>
              <span>{String(node.data?.label ?? node.id)}</span>
            </div>
          )}
          getNodeClassName={node => {
            const kind = String(node.data?.kind ?? 'leaf');
            return kind === 'group' ? 'rmt-demo-node rmt-demo-node--group' : 'rmt-demo-node';
          }}
          getNodeStyle={node => {
            const kind = String(node.data?.kind ?? 'leaf');
            return kind === 'group'
              ? {
                  boxShadow: 'inset 0 0 0 1px rgba(18, 79, 155, 0.12)'
                }
              : {
                  background: '#ffffff'
                };
          }}
        />
      </section>
    </div>
  );
}
