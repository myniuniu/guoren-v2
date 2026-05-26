import React, { useState, useCallback, useRef } from 'react';
import { Button, message } from 'antd';
import FlowNode from './FlowNode';
import ConfigDrawer from './ConfigDrawer';
import AddNodeDialog from './AddNodeDialog';
import { genId } from '../types';
import './FlowDesignerV2.css';

export default function FlowDesignerV2({ value, onChange }) {
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [currentNode, setCurrentNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState('');
  const rootRef = useRef(value);
  rootRef.current = value;

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.6));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  // 在节点树中找到节点
  const findNode = useCallback((root, id) => {
    if (!root) return null;
    if (root.id === id) return root;
    if (root.next) {
      const found = findNode(root.next, id);
      if (found) return found;
    }
    if (root.branches) {
      for (const b of root.branches) {
        const found = findNode(b, id);
        if (found) return found;
        if (b.next) {
          const f2 = findNode(b.next, id);
          if (f2) return f2;
        }
      }
    }
    return null;
  }, []);

  // 深拷贝 + 更新节点
  const updateNodeInTree = useCallback((root, id, updater) => {
    if (!root) return root;
    const node = JSON.parse(JSON.stringify(root));
    function walk(n) {
      if (!n) return;
      if (n.id === id) {
        const updated = updater(n);
        Object.assign(n, updated);
        return;
      }
      walk(n.next);
      if (n.branches) n.branches.forEach((b) => { walk(b); walk(b.next); });
    }
    walk(node);
    return node;
  }, []);

  // 在 parentId 后插入新节点
  const insertAfter = useCallback((root, parentId, newNode) => {
    const tree = JSON.parse(JSON.stringify(root));
    function walk(n) {
      if (!n) return false;
      if (n.id === parentId) {
        newNode.next = n.next || undefined;
        n.next = newNode;
        return true;
      }
      if (walk(n.next)) return true;
      if (n.branches) {
        for (const b of n.branches) {
          if (b.id === parentId) {
            newNode.next = b.next || undefined;
            b.next = newNode;
            return true;
          }
          if (walk(b)) return true;
          if (walk(b.next)) return true;
        }
      }
      return false;
    }
    walk(tree);
    return tree;
  }, []);

  // 删除节点
  const removeNode = useCallback((root, nodeId) => {
    const tree = JSON.parse(JSON.stringify(root));
    function walk(n) {
      if (!n) return;
      if (n.next && n.next.id === nodeId) {
        n.next = n.next.next || undefined;
        return;
      }
      walk(n.next);
      if (n.branches) {
        n.branches.forEach((b) => {
          if (b.next && b.next.id === nodeId) {
            b.next = b.next.next || undefined;
            return;
          }
          walk(b);
          walk(b.next);
        });
      }
    }
    walk(tree);
    return tree;
  }, []);

  const handleSelect = useCallback((node) => {
    setSelectedId(node.id);
    setCurrentNode(node);
    setDrawerOpen(true);
  }, []);

  const handleAdd = useCallback((parentId) => {
    setAddParentId(parentId);
    setAddOpen(true);
  }, []);

  const handleRemove = useCallback((nodeId) => {
    const newTree = removeNode(rootRef.current, nodeId);
    onChange(newTree);
    if (selectedId === nodeId) {
      setSelectedId('');
      setCurrentNode(null);
      setDrawerOpen(false);
    }
  }, [onChange, removeNode, selectedId]);

  const handleConfirmAdd = useCallback((type) => {
    let newNode;
    if (type === 'condition') {
      newNode = {
        id: genId(),
        type: 'condition',
        name: '条件分支',
        config: {},
        branches: [
          { id: genId(), type: 'branch', name: '条件1', config: { priority: 1, expression: '' } },
          { id: genId(), type: 'branch', name: '条件2', config: { priority: 2, expression: '' } },
        ],
      };
    } else if (type === 'cc') {
      newNode = { id: genId(), type: 'cc', name: '抄送人', config: { users: '' } };
    } else {
      newNode = { id: genId(), type: 'approval', name: '审批人', config: { approverType: 'self', multiMode: 'any' } };
    }
    const newTree = insertAfter(rootRef.current, addParentId, newNode);
    onChange(newTree);
    setAddOpen(false);
    message.success('节点已添加');
  }, [addParentId, insertAfter, onChange]);

  const handleConfigChange = useCallback((updatedNode) => {
    const newTree = updateNodeInTree(rootRef.current, updatedNode.id, () => updatedNode);
    onChange(newTree);
    setCurrentNode(updatedNode);
  }, [onChange, updateNodeInTree]);

  return (
    <div className="flow-v2-wrap">
      {/* 工具栏 */}
      <div className="flow-v2-toolbar">
        <span className="flow-v2-tip">点击节点可配置，点击 + 可添加节点</span>
        <div className="flow-v2-toolbar-right">
          <Button size="small" onClick={zoomOut}>-</Button>
          <span className="flow-v2-zoom">{Math.round(zoom * 100)}%</span>
          <Button size="small" onClick={zoomIn}>+</Button>
          <Button size="small" onClick={resetZoom}>重置</Button>
        </div>
      </div>

      {/* 画布 */}
      <div className="flow-v2-canvas">
        <div className="flow-v2-flow" style={{ transform: `scale(${zoom})` }}>
          {value && (
            <FlowNode
              node={value}
              selectedId={selectedId}
              onSelect={handleSelect}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          )}
        </div>
      </div>

      {/* 配置抽屉 */}
      <ConfigDrawer
        node={currentNode}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onChange={handleConfigChange}
      />

      {/* 添加节点弹窗 */}
      <AddNodeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
}
