import { useMemo, useState } from 'react';
import {
  Button, Input, Table, Tag, Tooltip, Modal, Form, message,
  Popconfirm, ColorPicker, Empty, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined,
  SearchOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  loadResourceLib, getTagDefinitions, addTagDefinition,
  deleteTagDefinition, renameTagDefinition, updateTagColor,
} from './resourceLibStore';
import './TagManagement.css';

// 预设标签ID列表（不可删除）
const PRESET_IDS = new Set([
  'tag_red', 'tag_orange', 'tag_yellow', 'tag_green',
  'tag_blue', 'tag_purple', 'tag_gray',
]);

export default function TagManagement() {
  const [data, setData] = useState(() => loadResourceLib());
  const [keyword, setKeyword] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF3B30');

  const tagDefs = getTagDefinitions(data);

  // 搜索过滤
  const filteredTags = useMemo(() => {
    if (!keyword.trim()) return tagDefs;
    const kw = keyword.trim().toLowerCase();
    return tagDefs.filter((t) => t.name?.toLowerCase().includes(kw));
  }, [tagDefs, keyword]);

  // 统计每个标签被使用的次数（跨全部资料）
  const usageCounts = useMemo(() => {
    const counts = {};
    const allItems = [
      ...(data.personal || []),
      ...Object.values(data.organizations || {}).flatMap((items) => items || []),
    ];
    allItems.forEach((item) => {
      (item.tags || []).forEach((tid) => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
    });
    return counts;
  }, [data]);

  const handleAdd = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) { message.warning('标签名称不能为空'); return; }
    const color = typeof newTagColor === 'string' ? newTagColor : newTagColor.toHexString();
    setData((d) => addTagDefinition(d, { name: trimmed, color }));
    setAddOpen(false);
    setNewTagName('');
    setNewTagColor('#FF3B30');
    message.success(`标签「${trimmed}」已创建`);
  };

  const handleDelete = (tagId) => {
    setData((d) => deleteTagDefinition(d, tagId));
    message.success('标签已删除');
  };

  const handleEditOpen = (tag) => {
    setEditItem(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editItem) return;
    const trimmed = newTagName.trim();
    if (!trimmed) { message.warning('标签名称不能为空'); return; }
    const color = typeof newTagColor === 'string' ? newTagColor : newTagColor.toHexString();
    setData((d) => {
      let next = renameTagDefinition(d, editItem.id, trimmed);
      next = updateTagColor(next, editItem.id, color);
      return next;
    });
    setEditOpen(false);
    setEditItem(null);
    message.success('标签已更新');
  };

  // ====== 表格列 ======
  const columns = [
    {
      title: '标签',
      dataIndex: 'name',
      render: (text, record) => (
        <span className="tm-tag-cell">
          <span className="tm-tag-dot" style={{ background: record.color }} />
          <span className="tm-tag-name">{text}</span>
        </span>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 100,
      render: (color) => (
        <span className="tm-color-cell">
          <span className="tm-color-block" style={{ background: color }} />
          <span className="tm-color-hex">{color}</span>
        </span>
      ),
    },
    {
      title: '使用次数',
      key: 'usage',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const count = usageCounts[record.id] || 0;
        return <Badge count={count} showZero overflowCount={999} style={{ backgroundColor: count > 0 ? '#1677ff' : '#d9d9d9' }} />;
      },
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_, record) => {
        const isPreset = PRESET_IDS.has(record.id);
        return <Tag color={isPreset ? 'default' : 'blue'}>{isPreset ? '预设' : '自定义'}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => {
        const isPreset = PRESET_IDS.has(record.id);
        return (
          <span className="tm-table-ops">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditOpen(record)}>
              编辑
            </Button>
            {!isPreset ? (
              <Popconfirm
                title={`确认删除标签「${record.name}」？`}
                description="删除后资料中的该标签将被自动清除"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            ) : (
              <Tooltip title="预设标签不可删除">
                <Button type="link" size="small" disabled icon={<DeleteOutlined />}>删除</Button>
              </Tooltip>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="tm-layout">
      {/* 顶部 Header */}
      <div className="tm-header">
        <div className="tm-header-left">
          <TagsOutlined className="tm-header-icon" />
          <span className="tm-header-title">标签管理</span>
          <span className="tm-header-sub">个人库与组织库共用同一套标签和快捷标签配置，用于资料分类与快速打标</span>
        </div>
      </div>

      {/* Tab + 工具栏 */}
      <div className="tm-toolbar">
        <div className="tm-toolbar-note">共享标签库</div>
        <div className="tm-toolbar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索标签名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setNewTagName(''); setNewTagColor('#FF3B30'); setAddOpen(true); }}>
            新建标签
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="tm-stats">
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.length}</span>
          <span className="tm-stat-label">标签总数</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.filter((t) => PRESET_IDS.has(t.id)).length}</span>
          <span className="tm-stat-label">预设标签</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.filter((t) => !PRESET_IDS.has(t.id)).length}</span>
          <span className="tm-stat-label">自定义标签</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{Object.values(usageCounts).reduce((a, b) => a + b, 0)}</span>
          <span className="tm-stat-label">使用总次数</span>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="tm-info-bar">
        <InfoCircleOutlined />
        <span>个人库与组织库共用同一套标签定义，快捷标签设置也会在两边同步生效。</span>
      </div>

      {/* 标签列表 */}
      <div className="tm-table-wrap">
        <Table
          rowKey="id"
          size="middle"
          dataSource={filteredTags}
          columns={columns}
          pagination={filteredTags.length > 15 ? { pageSize: 15 } : false}
          locale={{ emptyText: <Empty description="暂无标签" /> }}
        />
      </div>

      {/* 新建标签 Modal */}
      <Modal
        title="新建标签"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        okText="创建"
        cancelText="取消"
        destroyOnClose
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称" required>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="例如：重要、待审核、归档"
              maxLength={20}
              showCount
            />
          </Form.Item>
          <Form.Item label="标签颜色">
            <div className="tm-color-picker-row">
              <ColorPicker value={newTagColor} onChange={(c) => setNewTagColor(c)} />
              <span className="tm-color-preview" style={{ background: typeof newTagColor === 'string' ? newTagColor : newTagColor?.toHexString?.() || '#FF3B30' }}>
                预览
              </span>
            </div>
          </Form.Item>
          <div className="tm-modal-tip">
            标签将同步应用到：<b>个人库 + 组织库</b>
          </div>
        </Form>
      </Modal>

      {/* 编辑标签 Modal */}
      <Modal
        title="编辑标签"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditItem(null); }}
        onOk={handleEditSave}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称" required>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="输入标签名称"
              maxLength={20}
              showCount
            />
          </Form.Item>
          <Form.Item label="标签颜色">
            <div className="tm-color-picker-row">
              <ColorPicker value={newTagColor} onChange={(c) => setNewTagColor(c)} />
              <span className="tm-color-preview" style={{ background: typeof newTagColor === 'string' ? newTagColor : newTagColor?.toHexString?.() || '#FF3B30' }}>
                预览
              </span>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
