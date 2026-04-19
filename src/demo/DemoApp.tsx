import { useMemo, useRef, useState } from 'react';
import { MoveableTree } from '../components/MoveableTree';
import type { MoveableTreeRef } from '../types/api';
import type { BoxNode } from '../types/model';

const createInitialTree = (): BoxNode[] => [
  {
    id: 'root-A',
    rect: { x: 24, y: 20, width: 420, height: 310 },
    view: { className: 'custom-group', style: { color: 'red' } },
    data: { kind: 'group', label: 'Group A' },
    children: [
      {
        id: 'A-1',
        rect: { x: 24, y: 34, width: 150, height: 110 },
        data: { kind: 'leaf', label: 'Node A-1' },
        children: []
      },
      {
        id: 'A-2',
        rect: { x: 220, y: 166, width: 160, height: 110 },
        data: { kind: 'leaf', label: 'Node A-2' },
        children: []
      }
    ]
  },
  {
    id: 'root-B',
    rect: { x: 476, y: 90, width: 280, height: 250 },
    data: { kind: 'group', label: 'Group B' },
    children: [
      {
        id: 'B-1',
        rect: { x: 36, y: 30, width: 110, height: 90 },
        data: { kind: 'leaf', label: 'Node B-1' },
        children: []
      }
    ]
  }
];

const formatTree = (tree: BoxNode[]): string => JSON.stringify(tree, null, 2);

export function DemoApp() {
  const [tree, setTree] = useState<BoxNode[]>(() => createInitialTree());
  const [theme, setTheme] = useState<'warm' | 'noir'>('warm');
  const [targetNodeId, setTargetNodeId] = useState('A-1');
  const [targetParentId, setTargetParentId] = useState('root-B');
  const [jsonEditor, setJsonEditor] = useState(formatTree(createInitialTree()));
  const [latestNodeInfo, setLatestNodeInfo] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [eventStats, setEventStats] = useState({ changeEvents: 0, patchBatches: 0 });
  const [lastActionMs, setLastActionMs] = useState<number | null>(null);
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

  const rootGroupCount = tree.length;
  const totalNodeCount = nodeIdOptions.length;
  const logCount = logs.length;
  const themeLabel = theme === 'warm' ? '暖调工作台' : '夜航工作台';

  const appendLog = (line: string) => {
    setLogs(prev => {
      const next = [`${new Date().toLocaleTimeString()} ${line}`, ...prev];
      return next.slice(0, 18);
    });
  };

  const runMeasured = (task: () => void) => {
    const start = performance.now();
    task();
    setLastActionMs(Number((performance.now() - start).toFixed(2)));
  };

  const addChild = () => {
    const id = `N-${Date.now().toString().slice(-5)}`;
    ref.current?.addNode(targetNodeId, {
      id,
      rect: { x: 16, y: 16, width: 120, height: 80 },
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
    <div className="demo-app" data-theme={theme}>
      <div className="demo-backdrop" aria-hidden="true" />
      <header className="demo-hero">
        <div className="demo-hero-copy">
          <p className="demo-kicker">React Moveable Tree Playground</p>
          <h1>节点编排工作台</h1>
          <p className="demo-subtitle">通过 API 面板驱动树结构，再在画布中实时拖拽与缩放，观察状态与补丁流转。</p>
          <div className="demo-hero-tools">
            <button type="button" className="demo-theme-toggle" onClick={() => setTheme(prev => (prev === 'warm' ? 'noir' : 'warm'))}>
              切换到{theme === 'warm' ? '夜航' : '暖调'}主题
            </button>
            <span>{themeLabel}</span>
          </div>
        </div>
        <div className="demo-metric-strip" aria-label="当前树统计">
          <div className="demo-metric">
            <span>Root Groups</span>
            <strong>{rootGroupCount}</strong>
          </div>
          <div className="demo-metric">
            <span>Total Nodes</span>
            <strong>{totalNodeCount}</strong>
          </div>
          <div className="demo-metric">
            <span>Change Events</span>
            <strong>{eventStats.changeEvents}</strong>
          </div>
          <div className="demo-metric">
            <span>Patch Batches</span>
            <strong>{eventStats.patchBatches}</strong>
          </div>
          <div className="demo-metric">
            <span>Last Action</span>
            <strong data-wide="true">{lastActionMs === null ? '--' : `${lastActionMs}ms`}</strong>
          </div>
          <div className="demo-metric">
            <span>Recent Logs</span>
            <strong>{logCount}</strong>
          </div>
        </div>
      </header>

      <main className="demo-layout">
        <section className="demo-console" aria-label="API 控制台">
          <div className="demo-card">
            <h2>目标上下文</h2>
            <p>选择目标节点与移动目标父节点，下面的 API 操作都会基于这两个字段执行。</p>
            <div className="demo-field-grid">
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
                <select
                  id="target-parent"
                  value={targetParentId}
                  onChange={event => setTargetParentId(event.target.value)}
                >
                  {nodeIdOptions
                    .filter(id => id !== targetNodeId)
                    .map(id => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h2>操作面板</h2>
            <div className="demo-action-cluster">
              <h3>节点查询与更新</h3>
              <div className="demo-action-grid">
                <button type="button" onClick={() => runMeasured(focusNode)}>
                  focusNode
                </button>
                <button type="button" onClick={() => runMeasured(inspectNode)}>
                  getNode
                </button>
                <button type="button" onClick={() => runMeasured(updateNodeRect)}>
                  updateNode
                </button>
                <button type="button" onClick={() => runMeasured(batchUpdate)}>
                  updateNodes
                </button>
              </div>
            </div>

            <div className="demo-action-cluster">
              <h3>树结构调整</h3>
              <div className="demo-action-grid">
                <button type="button" onClick={() => runMeasured(addChild)}>
                  addNode
                </button>
                <button type="button" className="danger" onClick={() => runMeasured(removeNode)}>
                  removeNode
                </button>
                <button type="button" onClick={() => runMeasured(moveNode)}>
                  moveNode
                </button>
                <button type="button" onClick={() => runMeasured(setTreeByApi)}>
                  setTree
                </button>
              </div>
            </div>

            <div className="demo-action-cluster">
              <h3>序列化与快照</h3>
              <div className="demo-action-grid">
                <button type="button" onClick={() => runMeasured(snapshotTree)}>
                  getTree
                </button>
                <button type="button" onClick={() => runMeasured(exportJson)}>
                  exportJSON
                </button>
                <button type="button" className="accent" onClick={() => runMeasured(importJson)}>
                  importJSON
                </button>
              </div>
            </div>
          </div>

          <div className="demo-card">
            <h2>数据窗口</h2>
            <div className="demo-row">
              <label htmlFor="json-editor">JSON 编辑器（可直接 importJSON）</label>
              <textarea
                id="json-editor"
                value={jsonEditor}
                onChange={event => setJsonEditor(event.target.value)}
              />
            </div>

            <div className="demo-row">
              <label htmlFor="node-view">节点详情（getNode 输出）</label>
              <textarea id="node-view" value={latestNodeInfo} readOnly />
            </div>

            <div className="demo-row">
              <label>事件日志（onChange / onPatch）</label>
              <div className="demo-log">{logs.join('\n') || '暂无日志'}</div>
            </div>
          </div>
        </section>

        <section className="demo-stage" aria-label="交互画布">
          <div className="demo-stage-header">
            <h2>交互画布</h2>
            <div className="demo-stage-tags">
              <span>选中后拖拽 / 缩放</span>
              <span>约束保持在父容器内</span>
              <span>目标节点: {targetNodeId}</span>
            </div>
          </div>

          <MoveableTree
            ref={ref}
            width={820}
            height={620}
            value={tree}
            onChange={(nextTree, meta) => {
              setTree(nextTree);
              if (meta.reason !== 'drag' && meta.reason !== 'resize') {
                setEventStats(prev => ({
                  ...prev,
                  changeEvents: prev.changeEvents + 1
                }));
                appendLog(`onChange source=${meta.source} reason=${meta.reason}`);
              }
            }}
            onPatch={(patches, meta) => {
              if (meta.reason !== 'drag' && meta.reason !== 'resize') {
                setEventStats(prev => ({
                  ...prev,
                  patchBatches: prev.patchBatches + 1
                }));
                appendLog(`onPatch source=${meta.source} reason=${meta.reason} count=${patches.length}`);
              }
            }}
            containerClassName="demo-canvas"
            renderSlot={node => (
              <div className="demo-slot">
                <span>{String(node.data?.kind ?? 'node')}</span>
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
                    boxShadow:
                      theme === 'noir'
                        ? 'inset 0 0 0 1px rgba(138, 168, 214, 0.24)'
                        : 'inset 0 0 0 1px rgba(41, 62, 97, 0.25)',
                    background:
                      theme === 'noir'
                        ? 'linear-gradient(140deg, rgba(24, 34, 49, 0.92), rgba(35, 45, 63, 0.82))'
                        : 'linear-gradient(140deg, rgba(241, 246, 255, 0.92), rgba(255, 255, 255, 0.8))'
                  }
                : {
                    background:
                      theme === 'noir'
                        ? 'linear-gradient(140deg, rgba(44, 56, 78, 0.95), rgba(31, 40, 56, 0.95))'
                        : 'linear-gradient(140deg, #ffffff, #f8f4ef)'
                  };
            }}
          />
        </section>
      </main>
    </div>
  );
}
