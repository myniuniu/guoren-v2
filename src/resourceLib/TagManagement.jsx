import { useMemo, useState } from 'react';
import {
  Button, Input, Table, Tag, Tooltip, Modal, Form, message,
  Popconfirm, ColorPicker, Empty, Badge, Select,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  loadResourceLib,
  getOrganizationTagDefinitions,
  getOrganizationTagGroups,
  addTagDefinition,
  deleteTagDefinition,
  renameTagDefinition,
  updateTagColor,
  addTagGroup,
  updateTagGroup,
  deleteTagGroup,
} from './resourceLibStore';
import './TagManagement.css';

const PRESET_IDS = new Set([
  'tag_red', 'tag_orange', 'tag_yellow', 'tag_green',
  'tag_blue', 'tag_purple', 'tag_gray',
]);

const DEFAULT_TAG_COLOR = '#FF3B30';
const DEFAULT_GROUP_COLOR = '#1677ff';

function getChipStyle(color) {
  return {
    background: `${color}14`,
    borderColor: `${color}33`,
    color,
  };
}

export default function TagManagement() {
  const [data, setData] = useState(() => loadResourceLib());
  const [keyword, setKeyword] = useState('');

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(DEFAULT_TAG_COLOR);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(DEFAULT_GROUP_COLOR);
  const [groupTagIds, setGroupTagIds] = useState([]);

  const tagDefs = getOrganizationTagDefinitions(data);
  const tagGroups = getOrganizationTagGroups(data);

  const organizationItems = useMemo(
    () => Object.values(data.organizations || {}).flatMap((items) => items || []),
    [data],
  );

  const usageCounts = useMemo(() => {
    const counts = {};
    organizationItems.forEach((item) => {
      (item.tags || []).forEach((tagId) => {
        counts[tagId] = (counts[tagId] || 0) + 1;
      });
    });
    return counts;
  }, [organizationItems]);

  const tagMap = useMemo(
    () => new Map(tagDefs.map((tag) => [tag.id, tag])),
    [tagDefs],
  );

  const tagGroupMembershipMap = useMemo(() => {
    const map = new Map();
    tagGroups.forEach((group) => {
      (group.tagIds || []).forEach((tagId) => {
        const prev = map.get(tagId) || [];
        prev.push(group);
        map.set(tagId, prev);
      });
    });
    return map;
  }, [tagGroups]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredTags = useMemo(() => {
    if (!normalizedKeyword) return tagDefs;
    return tagDefs.filter((tag) => {
      const groupNames = (tagGroupMembershipMap.get(tag.id) || []).map((group) => group.name).join(' ');
      return `${tag.name || ''} ${groupNames}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [normalizedKeyword, tagDefs, tagGroupMembershipMap]);

  const filteredGroups = useMemo(() => {
    if (!normalizedKeyword) return tagGroups;
    return tagGroups.filter((group) => {
      const tagNames = (group.tagIds || [])
        .map((tagId) => tagMap.get(tagId)?.name)
        .filter(Boolean)
        .join(' ');
      return `${group.name || ''} ${tagNames}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [normalizedKeyword, tagGroups, tagMap]);

  const totalUsageCount = useMemo(
    () => Object.values(usageCounts).reduce((sum, count) => sum + count, 0),
    [usageCounts],
  );

  const resetTagEditor = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(DEFAULT_TAG_COLOR);
  };

  const openCreateTag = () => {
    resetTagEditor();
    setTagModalOpen(true);
  };

  const openEditTag = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagModalOpen(true);
  };

  const handleSaveTag = () => {
    const trimmed = tagName.trim();
    if (!trimmed) {
      message.warning('标签名称不能为空');
      return;
    }
    const color = typeof tagColor === 'string' ? tagColor : tagColor.toHexString();
    setData((prev) => {
      if (!editingTag) {
        return addTagDefinition(prev, { name: trimmed, color }, 'organization');
      }
      let next = renameTagDefinition(prev, editingTag.id, trimmed, 'organization');
      next = updateTagColor(next, editingTag.id, color, 'organization');
      return next;
    });
    setTagModalOpen(false);
    resetTagEditor();
    message.success(editingTag ? '组织标签已更新' : `组织标签「${trimmed}」已创建`);
  };

  const handleDeleteTag = (tag) => {
    setData((prev) => deleteTagDefinition(prev, tag.id, 'organization'));
    message.success('组织标签已删除');
  };

  const resetGroupEditor = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupColor(DEFAULT_GROUP_COLOR);
    setGroupTagIds([]);
  };

  const openCreateGroup = () => {
    resetGroupEditor();
    setGroupModalOpen(true);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupName(group.name || '');
    setGroupColor(group.color || DEFAULT_GROUP_COLOR);
    setGroupTagIds(group.tagIds || []);
    setGroupModalOpen(true);
  };

  const handleSaveGroup = () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      message.warning('标签组名称不能为空');
      return;
    }
    if (groupTagIds.length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }
    const color = typeof groupColor === 'string' ? groupColor : groupColor.toHexString();
    setData((prev) => {
      if (!editingGroup) {
        return addTagGroup(prev, { name: trimmed, color, tagIds: groupTagIds }, 'organization');
      }
      return updateTagGroup(prev, editingGroup.id, { name: trimmed, color, tagIds: groupTagIds }, 'organization');
    });
    setGroupModalOpen(false);
    resetGroupEditor();
    message.success(editingGroup ? '标签组已更新' : `标签组「${trimmed}」已创建`);
  };

  const handleDeleteGroup = (group) => {
    setData((prev) => deleteTagGroup(prev, group.id, 'organization'));
    message.success('标签组已删除');
  };

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
      width: 118,
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
      width: 110,
      align: 'center',
      render: (_, record) => {
        const count = usageCounts[record.id] || 0;
        return (
          <Badge
            count={count}
            showZero
            overflowCount={999}
            style={{ backgroundColor: count > 0 ? '#1677ff' : '#d9d9d9' }}
          />
        );
      },
    },
    {
      title: '所属标签组',
      key: 'groups',
      width: 260,
      render: (_, record) => {
        const groups = tagGroupMembershipMap.get(record.id) || [];
        if (groups.length === 0) return <span className="tm-muted">未分组</span>;
        return (
          <span className="tm-group-chip-list">
            {groups.map((group) => (
              <span key={group.id} className="tm-group-chip tm-group-chip-inline" style={getChipStyle(group.color)}>
                {group.name}
              </span>
            ))}
          </span>
        );
      },
    },
    {
      title: '类型',
      key: 'type',
      width: 120,
      render: (_, record) => {
        const isPreset = PRESET_IDS.has(record.id);
        return <Tag color={isPreset ? 'default' : 'blue'}>{isPreset ? '预设色标' : '业务标签'}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 176,
      align: 'center',
      render: (_, record) => {
        const isPreset = PRESET_IDS.has(record.id);
        return (
          <span className="tm-table-ops">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditTag(record)}>
              编辑
            </Button>
            {!isPreset ? (
              <Popconfirm
                title={`确认删除标签「${record.name}」？`}
                description="删除后会同步清除组织资料和标签组中的关联"
                onConfirm={() => handleDeleteTag(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            ) : (
              <Tooltip title="预设色标不可删除">
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
      <div className="tm-toolbar">
        <div className="tm-toolbar-note">组织标签库</div>
        <div className="tm-toolbar-actions">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索标签或标签组"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
          />
          <Button icon={<PlusOutlined />} onClick={openCreateGroup}>
            新建标签组
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTag}>
            新建标签
          </Button>
        </div>
      </div>

      <div className="tm-stats">
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.length}</span>
          <span className="tm-stat-label">组织标签</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.filter((tag) => PRESET_IDS.has(tag.id)).length}</span>
          <span className="tm-stat-label">预设色标</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagDefs.filter((tag) => !PRESET_IDS.has(tag.id)).length}</span>
          <span className="tm-stat-label">业务标签</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{tagGroups.length}</span>
          <span className="tm-stat-label">标签组</span>
        </div>
        <div className="tm-stat-item">
          <span className="tm-stat-num">{totalUsageCount}</span>
          <span className="tm-stat-label">组织使用次数</span>
        </div>
      </div>

      <div className="tm-info-bar">
        <InfoCircleOutlined />
        <span>标签组用于把多个组织标签归并成同一业务语义，方便统一维护；分组不会改写资料原有标签。</span>
      </div>

      <div className="tm-main">
        <section className="tm-panel tm-group-panel">
          <div className="tm-panel-head">
            <div>
              <div className="tm-panel-title">标签组</div>
              <div className="tm-panel-sub">一个标签组可以包含多个组织标签。</div>
            </div>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={openCreateGroup}>
              新建
            </Button>
          </div>
          <div className="tm-group-list">
            {filteredGroups.length > 0 ? filteredGroups.map((group) => {
              const memberTags = (group.tagIds || []).map((tagId) => tagMap.get(tagId)).filter(Boolean);
              return (
                <div key={group.id} className="tm-group-card">
                  <div className="tm-group-card-head">
                    <div className="tm-group-title-row">
                      <span className="tm-group-color" style={{ background: group.color }} />
                      <span className="tm-group-title">{group.name}</span>
                    </div>
                    <span className="tm-group-count">{memberTags.length} 个标签</span>
                  </div>
                  <div className="tm-group-chip-list">
                    {memberTags.length > 0 ? memberTags.map((tag) => (
                      <span key={tag.id} className="tm-group-chip" style={getChipStyle(tag.color)}>
                        {tag.name}
                      </span>
                    )) : (
                      <span className="tm-muted">当前组内暂无标签</span>
                    )}
                  </div>
                  <div className="tm-group-card-actions">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditGroup(group)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title={`确认删除标签组「${group.name}」？`}
                      description="删除后不会影响标签本身"
                      onConfirm={() => handleDeleteGroup(group)}
                    >
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  </div>
                </div>
              );
            }) : (
              <div className="tm-empty-wrap">
                <Empty description={normalizedKeyword ? '未找到匹配的标签组' : '暂无标签组'} />
              </div>
            )}
          </div>
        </section>

        <section className="tm-panel tm-table-panel">
          <div className="tm-panel-head">
            <div>
              <div className="tm-panel-title">组织标签</div>
              <div className="tm-panel-sub">维护组织资料库的标签颜色、命名和分组关系。</div>
            </div>
          </div>
          <div className="tm-table-wrap">
            <Table
              rowKey="id"
              size="middle"
              dataSource={filteredTags}
              columns={columns}
              pagination={filteredTags.length > 12 ? { pageSize: 12 } : false}
              locale={{ emptyText: <Empty description={normalizedKeyword ? '未找到匹配的标签' : '暂无组织标签'} /> }}
            />
          </div>
        </section>
      </div>

      <Modal
        title={editingTag ? '编辑组织标签' : '新建组织标签'}
        open={tagModalOpen}
        onCancel={() => {
          setTagModalOpen(false);
          resetTagEditor();
        }}
        onOk={handleSaveTag}
        okText={editingTag ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
        width={420}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称" required>
            <Input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="例如：正式文件、已评审、重点项目"
              maxLength={20}
              showCount
            />
          </Form.Item>
          <Form.Item label="标签颜色">
            <div className="tm-color-picker-row">
              <ColorPicker value={tagColor} onChange={(color) => setTagColor(color)} />
              <span className="tm-color-preview" style={{ background: typeof tagColor === 'string' ? tagColor : tagColor?.toHexString?.() || DEFAULT_TAG_COLOR }}>
                预览
              </span>
            </div>
          </Form.Item>
          <div className="tm-modal-tip">
            标签仅应用于：<b>组织资料库</b>
          </div>
        </Form>
      </Modal>

      <Modal
        title={editingGroup ? '编辑标签组' : '新建标签组'}
        open={groupModalOpen}
        onCancel={() => {
          setGroupModalOpen(false);
          resetGroupEditor();
        }}
        onOk={handleSaveGroup}
        okText={editingGroup ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
        width={520}
      >
        <Form layout="vertical">
          <Form.Item label="标签组名称" required>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例如：研发协作、文档状态、市场运营"
              maxLength={20}
              showCount
            />
          </Form.Item>
          <Form.Item label="标签组颜色">
            <div className="tm-color-picker-row">
              <ColorPicker value={groupColor} onChange={(color) => setGroupColor(color)} />
              <span className="tm-color-preview" style={{ background: typeof groupColor === 'string' ? groupColor : groupColor?.toHexString?.() || DEFAULT_GROUP_COLOR }}>
                预览
              </span>
            </div>
          </Form.Item>
          <Form.Item label="包含标签" required>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="选择一个或多个组织标签"
              value={groupTagIds}
              onChange={setGroupTagIds}
              maxTagCount="responsive"
              options={tagDefs.map((tag) => ({ value: tag.id, label: tag.name }))}
            />
          </Form.Item>
          <div className="tm-group-preview">
            <div className="tm-group-preview-label">当前分组成员</div>
            <div className="tm-group-chip-list">
              {groupTagIds.length > 0 ? groupTagIds.map((tagId) => {
                const tag = tagMap.get(tagId);
                if (!tag) return null;
                return (
                  <span key={tag.id} className="tm-group-chip" style={getChipStyle(tag.color)}>
                    {tag.name}
                  </span>
                );
              }) : (
                <span className="tm-muted">尚未选择标签</span>
              )}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
