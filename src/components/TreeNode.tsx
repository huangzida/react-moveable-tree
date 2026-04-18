import clsx from 'clsx';
import { memo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { BoxNode } from '../types/model';

interface TreeNodeProps {
  node: BoxNode;
  renderSlot?: (node: BoxNode) => ReactNode;
  getNodeClassName?: (node: BoxNode) => string | undefined;
  getNodeStyle?: (node: BoxNode) => CSSProperties | undefined;
  selectedId?: string;
  onSelect?: (id: string) => void;
  registerNodeElement?: (id: string, element: HTMLDivElement | null) => void;
}

function TreeNodeComponent({
  node,
  renderSlot,
  getNodeClassName,
  getNodeStyle,
  selectedId,
  onSelect,
  registerNodeElement
}: TreeNodeProps) {
  return (
    <div
      data-testid={`node-${node.id}`}
      data-selected={selectedId === node.id ? 'true' : 'false'}
      ref={element => registerNodeElement?.(node.id, element)}
      onMouseDown={event => {
        event.stopPropagation();
        onSelect?.(node.id);
      }}
      className={clsx('rmt-node', node.view?.className, getNodeClassName?.(node))}
      style={{
        position: 'absolute',
        left: node.rect.x,
        top: node.rect.y,
        width: node.rect.width,
        height: node.rect.height,
        ...(node.view?.style ?? {}),
        ...(getNodeStyle?.(node) ?? {})
      }}
    >
      {renderSlot?.(node)}
      {(node.children ?? []).map(child => (
        <TreeNode
          key={child.id}
          node={child}
          renderSlot={renderSlot}
          getNodeClassName={getNodeClassName}
          getNodeStyle={getNodeStyle}
          selectedId={selectedId}
          onSelect={onSelect}
          registerNodeElement={registerNodeElement}
        />
      ))}
    </div>
  );
}

function areTreeNodePropsEqual(prev: TreeNodeProps, next: TreeNodeProps): boolean {
  return (
    prev.node === next.node &&
    prev.selectedId === next.selectedId &&
    prev.renderSlot === next.renderSlot &&
    prev.getNodeClassName === next.getNodeClassName &&
    prev.getNodeStyle === next.getNodeStyle &&
    prev.onSelect === next.onSelect &&
    prev.registerNodeElement === next.registerNodeElement
  );
}

export const TreeNode = memo(TreeNodeComponent, areTreeNodePropsEqual);