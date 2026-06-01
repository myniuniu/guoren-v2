import { useEffect, useState, useCallback, useMemo } from 'react';
import { Tree, Dropdown, Modal, Input, Form, Button, message, Empty, Tag } from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { dmsCategoryApi } from './api';

/**
 * DMS 分类树
 *
 * - 支持节点拖拽（onDrop）调用后端 move
 * - 节点右键 / 操作按钮：新增子级、重命名、移动到、删除
 */
export default function CategoryTree({
  selectedId,
  onSelect,
  refreshKey, // 外部触发刷新
}) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState([]);

  const [editVisible, setEditVisible] = useState(false);
  const [editMode, setEditMode] = useState('create'); // create | rename
  const [editTarget, setEditTarget] = useState(null);
  const [editForm] = Form.useForm();

  const [moveVisible, setMoveVisible] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveParentId, setMoveParentId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dmsCategoryApi.tree();
      setTree(data || []);
    } catch {
      message.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  /** 把后端节点转成 antd Tree 数据 */
  const treeData = useMemo(() => {
    const wrap = (nodes) =>
      (nodes || []).map((n) => ({
        key: n.id,
        title: (
          <NodeRow
            node={n}
            onAddChild={() => openCreate(n.id)}
            onRename={() => openRename(n)}
            onMove={() => openMove(n)}
            onRemove={() => handleRemove(n)}
          />
        ),
        rawNode: n,
        icon: ({ expanded: e }) => (e ? <FolderOpenOutlined /> : <FolderOutlined />),
        children: wrap(n.children),
      }));
    return wrap(tree);
  }, [tree]);

  // 默认展开第一层
  useEffect(() => {
    setExpanded((prev) => {
      if (prev.length) return prev;
      return (tree || []).map((n) => n.id);
    });
  }, [tree]);

  // ---------- CRUD ----------

  const openCreate = (parentId) => {
    setEditMode('create');
    setEditTarget({ parentId });
    editForm.resetFields();
    setEditVisible(true);
  };

  const openRename = (node) => {
    setEditMode('rename');
    setEditTarget(node);
    editForm.setFieldsValue({ name: node.name });
    setEditVisible(true);
  };

  const openMove = (node) => {
    setMoveTarget(node);
    setMoveParentId(null);
    setMoveVisible(true);
  };

  const handleRemove = (node) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除分类「${node.name}」（含子分类），仅当其下没有文档时方可删除。继续？`,
      okType: 'danger',
      onOk: async () => {
        try {
          await dmsCategoryApi.remove(node.id);
          message.success('已删除');
          load();
          if (selectedId === node.id) onSelect?.(null);
        } catch (e) {
          message.error(
            '删除失败：' + (e?.response?.data?.message || e?.message || ''),
          );
        }
      },
    });
  };

  const submitEdit = async () => {
    try {
      const v = await editForm.validateFields();
      if (editMode === 'create') {
        await dmsCategoryApi.create({
          parentId: editTarget?.parentId || null,
          name: v.name,
        });
        message.success('已新增分类');
      } else {
        await dmsCategoryApi.update(editTarget.id, { name: v.name });
        message.success('已重命名');
      }
      setEditVisible(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('保存失败：' + (e?.response?.data?.message || e?.message || ''));
    }
  };

  const submitMove = async () => {
    try {
      await dmsCategoryApi.move(moveTarget.id, moveParentId || null);
      message.success('已移动');
      setMoveVisible(false);
      load();
    } catch (e) {
      message.error('移动失败：' + (e?.response?.data?.message || e?.message || ''));
    }
  };

  // ---------- 拖拽 ----------

  const onDrop = async (info) => {
    const dragId = info.dragNode.key;
    const dropId = info.node.key;
    // dropToGap = true 表示拖到节点之间 → 挂到同级（用 dropNode 的 parentId）
    let newParentId;
    if (info.dropToGap) {
      newParentId = info.node.rawNode?.parentId || null;
    } else {
      newParentId = dropId;
    }
    if (newParentId === info.dragNode.rawNode?.parentId) {
      // 同父间排序当前不支持；忽略
      return;
    }
    try {
      await dmsCategoryApi.move(dragId, newParentId);
      message.success('已移动');
      load();
    } catch (e) {
      message.error('拖拽失败：' + (e?.response?.data?.message || e?.message || ''));
    }
  };

  // ---------- 移动选择树（用扁平 select；简化实现） ----------

  const flatOptions = useMemo(() => {
    const ret = [{ id: '', name: '— 根（顶级分类）—', depth: 0 }];
    const dfs = (nodes, depth) => {
      (nodes || []).forEach((n) => {
        ret.push({ id: n.id, name: n.name, depth });
        dfs(n.children, depth + 1);
      });
    };
    dfs(tree, 1);
    return ret;
  }, [tree]);

  // ---------- 渲染 ----------

  return (
    <div className="dms-category-tree">
      <div className="dms-category-tree-header">
        <span className="dms-sider-section-title">分类</span>
        <span style={{ flex: 1 }} />
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          title="新建顶级分类"
          onClick={() => openCreate(null)}
        />
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          title="刷新"
          onClick={load}
        />
      </div>

      <div
        className={
          'dms-sider-item' + (selectedId == null ? ' dms-sider-item-active' : '')
        }
        onClick={() => onSelect?.(null)}
      >
        <FolderOutlined />
        <span>全部文档</span>
      </div>

      {tree.length === 0 && !loading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="尚未创建分类"
          style={{ marginTop: 24 }}
        />
      ) : (
        <Tree
          showIcon
          blockNode
          draggable
          treeData={treeData}
          expandedKeys={expanded}
          onExpand={setExpanded}
          selectedKeys={selectedId ? [selectedId] : []}
          onSelect={(keys) => onSelect?.(keys[0] || null)}
          onDrop={onDrop}
          allowDrop={() => true}
        />
      )}

      <Modal
        title={editMode === 'create' ? '新建分类' : '重命名分类'}
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={submitEdit}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input maxLength={64} placeholder="如：制度文件 / 合同档案" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`移动分类：${moveTarget?.name || ''}`}
        open={moveVisible}
        onCancel={() => setMoveVisible(false)}
        onOk={submitMove}
        destroyOnHidden
        okText="移动"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8, color: '#8a8f99' }}>选择新的父级分类：</div>
        <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
          {flatOptions.map((opt) => {
            // 不能移到自身或自身的子节点；为简化 UI，仅校验自身
            const disabled = opt.id === moveTarget?.id;
            return (
              <div
                key={opt.id || '__root__'}
                style={{
                  padding: '6px 12px',
                  paddingLeft: 12 + (opt.depth || 0) * 16,
                  background:
                    moveParentId === (opt.id || null) ? '#e6f4ff' : 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: disabled ? '#bfbfbf' : 'inherit',
                }}
                onClick={() => !disabled && setMoveParentId(opt.id || null)}
              >
                <FolderOutlined style={{ marginRight: 6 }} />
                {opt.name}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

function NodeRow({ node, onAddChild, onRename, onMove, onRemove }) {
  const items = [
    { key: 'add', label: '新增子分类', icon: <PlusOutlined /> },
    { key: 'rename', label: '重命名', icon: <EditOutlined /> },
    { key: 'move', label: '移动到…', icon: <SwapOutlined /> },
    { type: 'divider' },
    { key: 'remove', label: '删除', icon: <DeleteOutlined />, danger: true },
  ];
  const onClick = ({ key, domEvent }) => {
    domEvent?.stopPropagation();
    if (key === 'add') onAddChild();
    else if (key === 'rename') onRename();
    else if (key === 'move') onMove();
    else if (key === 'remove') onRemove();
  };
  return (
    <Dropdown menu={{ items, onClick }} trigger={['contextMenu']}>
      <span className="dms-tree-node">
        <span className="dms-tree-node-name">{node.name}</span>
        {!!node.docCount && (
          <Tag style={{ marginLeft: 6 }} color="blue">
            {node.docCount}
          </Tag>
        )}
      </span>
    </Dropdown>
  );
}
