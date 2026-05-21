import { useState } from 'react';
import { Button, Table, Popconfirm, Input, Dropdown, Tag, message } from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  EditOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  MessageOutlined,
  UserOutlined,
  CommentOutlined,
  DeleteOutlined,
  BranchesOutlined,
  SendOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import AddResourceModal from './AddResourceModal';
import AssessmentConfig from './AssessmentConfig';
import {
  loadFromStorage,
  getCurrentVersion,
  getVersions,
  getActiveVersion,
  createNewVersion,
  publishVersion,
  addResource,
  updateResource,
  deleteResource,
  switchVersion,
  rollbackVersion,
  updateAssessment,
  updateAssessmentChat,
} from './versionStore';
import './TopicDetail.css';

// 根据类型获取图标
function getResourceIcon(type) {
  switch (type) {
    case 'video':
      return <PlayCircleOutlined style={{ color: '#9b59b6' }} />;
    case 'activity':
      return <AppstoreOutlined style={{ color: '#f5a623' }} />;
    case 'survey':
    case 'vote':
    case 'exam':
    case 'register':
      return <EditOutlined style={{ color: '#52c41a' }} />;
    default:
      return <FileTextOutlined style={{ color: '#4facfe' }} />;
  }
}

function TopicDetail({ topicTitle, onBack }) {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [modalOpen, setModalOpen] = useState(false);
  const [versionData, setVersionData] = useState(() => loadFromStorage());
  const [editingKey, setEditingKey] = useState(null);
  const [editingName, setEditingName] = useState('');
  // 文件夹相关状态
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const currentVersion = getCurrentVersion(versionData);
  const versions = getVersions(versionData);
  const activeVersion = getActiveVersion(versionData);
  const isDraft = currentVersion?.status === 'draft';
  const isActive = currentVersion?.status === 'active';
  const resources = currentVersion?.resources || [];

  // 文件夹计算
  const rootItems = resources.filter((r) => r.parentKey === null);
  const getChildren = (folderKey) => resources.filter((r) => r.parentKey === folderKey);
  const selectedFolder = selectedFolderKey ? resources.find((r) => r.key === selectedFolderKey && r.isFolder) : null;
  const folderChildren = selectedFolder ? getChildren(selectedFolderKey) : [];
  const folderCount = resources.filter((r) => r.isFolder).length;
  const fileCount = resources.filter((r) => !r.isFolder).length;

  const tabs = [
    { key: 'knowledge', label: '知识模式' },
    { key: 'ai', label: 'AI模式' },
    { key: 'practice', label: '实训模式' },
    { key: 'assessment', label: '考核配置模式' },
  ];

  // 考核相关回调
  const handleUpdateAssessment = (assessment) => {
    const newData = updateAssessment(versionData, currentVersion.id, assessment);
    setVersionData(newData);
  };
  const handleUpdateAssessmentChat = (chat) => {
    const newData = updateAssessmentChat(versionData, currentVersion.id, chat);
    setVersionData(newData);
  };

  // 添加资料
  const handleAddResource = (resource) => {
    if (!isDraft) {
      message.warning('当前版本已发布，请新建版本后再添加资料');
      return;
    }
    const newData = addResource(versionData, currentVersion.id, {
      ...resource,
      parentKey: selectedFolderKey || null,
    });
    setVersionData(newData);
    message.success('资料添加成功');
  };

  // 删除资料
  const handleDeleteResource = (resourceKey) => {
    const newData = deleteResource(versionData, currentVersion.id, resourceKey);
    setVersionData(newData);
    if (resourceKey === selectedFolderKey) setSelectedFolderKey(null);
    message.success('资料已删除');
  };

  // 开始编辑
  const handleStartEdit = (record) => {
    setEditingKey(record.key);
    setEditingName(record.name);
  };

  // 保存编辑
  const handleSaveEdit = (resourceKey) => {
    if (!editingName.trim()) {
      message.warning('名称不能为空');
      return;
    }
    const newData = updateResource(versionData, currentVersion.id, resourceKey, { name: editingName.trim() });
    setVersionData(newData);
    setEditingKey(null);
    setEditingName('');
    message.success('资料已更新');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingName('');
  };

  // 新建版本
  const handleCreateVersion = () => {
    const newData = createNewVersion(versionData);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('新版本已创建，已继承上一版本的资料');
  };

  // 发布版本
  const handlePublishVersion = (versionId) => {
    const newData = publishVersion(versionData, versionId);
    setVersionData(newData);
    message.success('版本已发布，资料已锁定不可修改');
  };

  // 切换版本
  const handleSwitchVersion = (versionId) => {
    const newData = switchVersion(versionData, versionId);
    setVersionData(newData);
  };

  // 回退版本
  const handleRollbackVersion = (versionId) => {
    const newData = rollbackVersion(versionData, versionId);
    setVersionData(newData);
    message.success('已回退到指定版本，该版本现已生效');
  };

  // 文件夹操作
  const toggleFolder = (folderKey) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) next.delete(folderKey);
      else next.add(folderKey);
      return next;
    });
  };

  const handleSelectFolder = (folderKey) => {
    setSelectedFolderKey(folderKey);
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderKey);
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (!isDraft) { message.warning('当前版本不可编辑'); return; }
    setCreatingFolder(true);
    setNewFolderName('');
  };

  const handleSaveNewFolder = () => {
    const name = newFolderName.trim();
    if (!name) { message.warning('文件夹名称不能为空'); return; }
    const newData = addResource(versionData, currentVersion.id, {
      name,
      isFolder: true,
      parentKey: null,
    });
    setVersionData(newData);
    setCreatingFolder(false);
    message.success('文件夹创建成功');
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        if (editingKey === record.key) {
          return (
            <div className="file-name-cell">
              <span className="file-icon">{record.isFolder ? <FolderOutlined style={{ color: '#4facfe' }} /> : getResourceIcon(record.type)}</span>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onPressEnter={() => handleSaveEdit(record.key)}
                size="small"
                style={{ width: 240 }}
                autoFocus
              />
              <Button size="small" type="link" onClick={() => handleSaveEdit(record.key)}>保存</Button>
              <Button size="small" type="link" onClick={handleCancelEdit}>取消</Button>
            </div>
          );
        }
        return (
          <div className="file-name-cell" style={record.isFolder ? { cursor: 'pointer' } : {}}
            onClick={record.isFolder ? () => handleSelectFolder(record.key) : undefined}>
            <span className="file-icon">{record.isFolder ? <FolderOutlined style={{ color: '#4facfe' }} /> : getResourceIcon(record.type)}</span>
            <span className="file-name-text" style={record.isFolder ? { color: '#1677ff' } : {}}>{text}</span>
          </div>
        );
      },
    },
    {
      title: '所有者',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
    },
    {
      title: '最近编辑',
      dataIndex: 'lastEdit',
      key: 'lastEdit',
      width: 200,
    },
    ...(isDraft
      ? [
          {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_, record) => (
              <div className="action-cell">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleStartEdit(record)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title={record.isFolder ? '删除文件夹将同时删除其下所有内容，确认？' : '确认删除该资料？'}
                  onConfirm={() => handleDeleteResource(record.key)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];

  // 递归渲染左侧树形目录项
  const renderTreeItem = (item, depth) => {
    if (item.isFolder) {
      const isExpanded = expandedFolders.has(item.key);
      const isSelected = selectedFolderKey === item.key;
      const children = getChildren(item.key);
      return (
        <div key={item.key} className="tree-folder-group">
          <div
            className={`project-item project-item-folder ${isSelected ? 'project-item-selected' : ''}`}
            onClick={() => handleSelectFolder(item.key)}
          >
            <span className="project-item-arrow" onClick={(e) => { e.stopPropagation(); toggleFolder(item.key); }}>
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
            <span className="project-item-icon">
              {isExpanded
                ? <FolderOpenOutlined style={{ color: '#4facfe' }} />
                : <FolderOutlined style={{ color: '#4facfe' }} />}
            </span>
            <span className="project-item-title">{item.name}</span>
          </div>
          {isExpanded && (
            <div className="tree-children">
              {children.map((child) => renderTreeItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    // 普通文件
    return (
      <div key={item.key} className="project-item project-item-child">
        <span className="project-item-icon">{getResourceIcon(item.type)}</span>
        <span className="project-item-title">{item.name}</span>
      </div>
    );
  };

  return (
    <div className="topic-detail">
      {/* Top Header Bar */}
      <div className="detail-header">
        <div className="detail-header-left">
          <HomeOutlined className="detail-home-icon" onClick={onBack} />
          <span className="detail-title">{topicTitle}</span>
        </div>
        <div className="detail-header-center">
          <div className="detail-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`detail-tab ${activeTab === tab.key ? 'detail-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>
        <div className="detail-header-right">
          {/* Version Management Dropdown */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'current',
                  label: (
                    <span className="version-dropdown-current">
                      当前：{currentVersion?.name}
                      <Tag color={isDraft ? 'orange' : isActive ? 'green' : 'default'} style={{ marginLeft: 8, fontSize: 11 }}>
                        {isDraft ? '草稿' : isActive ? '生效中' : '已失效'}
                      </Tag>
                    </span>
                  ),
                  disabled: true,
                },
                { type: 'divider' },
                ...versions.map((v) => {
                  const statusLabel = v.status === 'active' ? '生效中' : v.status === 'published' ? '已失效' : '草稿';
                  const statusColor = v.status === 'active' ? 'green' : v.status === 'published' ? 'default' : 'orange';
                  return {
                    key: `switch-${v.id}`,
                    icon: v.id === currentVersion?.id ? <CheckCircleOutlined /> : <SwapOutlined />,
                    label: (
                      <span>
                        {v.name}
                        <Tag color={statusColor} style={{ marginLeft: 8, fontSize: 10 }}>
                          {statusLabel}
                        </Tag>
                      </span>
                    ),
                    onClick: () => handleSwitchVersion(v.id),
                  };
                }),
                { type: 'divider' },
                {
                  key: 'new-version',
                  icon: <PlusOutlined />,
                  label: '新建版本',
                  onClick: handleCreateVersion,
                },
                ...(isDraft
                  ? [
                      {
                        key: 'publish',
                        icon: <SendOutlined />,
                        label: '发布当前版本',
                        onClick: () => handlePublishVersion(currentVersion.id),
                      },
                    ]
                  : []),
                ...(currentVersion?.status === 'published'
                  ? [
                      {
                        key: 'rollback',
                        icon: <SwapOutlined />,
                        label: '回退到此版本（设为生效）',
                        onClick: () => handleRollbackVersion(currentVersion.id),
                      },
                    ]
                  : []),
              ],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              className="version-header-btn"
              icon={<BranchesOutlined />}
              size="small"
            >
              {currentVersion?.name}
              <Tag
                color={isDraft ? 'orange' : isActive ? 'green' : 'default'}
                className="version-header-tag"
              >
                {isDraft ? '草稿' : isActive ? '生效中' : '已失效'}
              </Tag>
            </Button>
          </Dropdown>
          <UserOutlined className="header-icon" />
          <CommentOutlined className="header-icon" />
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'assessment' ? (
        <AssessmentConfig
          assessment={currentVersion?.assessment}
          assessmentChat={currentVersion?.assessmentChat}
          resources={resources}
          isDraft={isDraft}
          onUpdateAssessment={handleUpdateAssessment}
          onUpdateChat={handleUpdateAssessmentChat}
          onOpenAddModal={() => setModalOpen(true)}
          onCreateFolder={(name) => {
            const newData = addResource(versionData, currentVersion.id, { name, isFolder: true, parentKey: null });
            setVersionData(newData);
          }}
        />
      ) : (
      <div className="detail-body">
        {/* Left Panel - 资料 */}
        <div className="detail-left-panel">
          <div className="panel-header">
            <span className="panel-title">资料</span>
            <MoreOutlined className="panel-more-icon" />
          </div>

          {/* AI 问答 */}
          <div className="ai-qa-box">
            <MessageOutlined style={{ color: '#999', fontSize: 14 }} />
            <span className="ai-qa-text">AI 问答</span>
          </div>

          {/* 操作按钮 */}
          <div className="panel-actions">
            <div
              className={`panel-action-btn ${!isDraft ? 'panel-action-btn-disabled' : ''}`}
              onClick={() => isDraft && setModalOpen(true)}
            >
              <PlusOutlined style={{ fontSize: 12 }} />
              <span>添加资料</span>
            </div>
            <div className="panel-action-btn">
              <AppstoreOutlined style={{ fontSize: 12 }} />
              <span>应用</span>
            </div>
          </div>

          {/* 项目列表 - 树形目录 */}
          <div className="project-section">
            <div className="project-header">
              <span className="project-title">项目</span>
              <Dropdown menu={{ items: [
                { key: 'new-folder', icon: <FolderOutlined />, label: '新建文件夹', onClick: handleCreateFolder, disabled: !isDraft },
              ] }} trigger={['click']}>
                <MoreOutlined className="project-more-icon" />
              </Dropdown>
            </div>

            {/* 新建文件夹表单 */}
            {creatingFolder && (
              <div className="new-folder-form">
                <div className="new-folder-row">
                  <FolderOutlined style={{ color: '#4facfe', fontSize: 14 }} />
                  <Input size="small" placeholder="输入文件夹名称" value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={handleSaveNewFolder} autoFocus style={{ flex: 1 }} />
                </div>
                <div className="new-folder-actions">
                  <Button size="small" onClick={() => setCreatingFolder(false)}>取消</Button>
                  <Button size="small" type="primary" onClick={handleSaveNewFolder}>创建</Button>
                </div>
              </div>
            )}

            <div className="project-list">
              {rootItems.length === 0 && !creatingFolder ? (
                <div className="project-empty">暂无资料</div>
              ) : (
                rootItems.map((item) => renderTreeItem(item, 0))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - 文件表格 */}
        <div className="detail-right-panel">
          {selectedFolder ? (
            <>
              {/* 选中了文件夹 */}
              <div className="folder-info">
                <div className="folder-info-left">
                  <div className="folder-big-icon"><FolderOutlined /></div>
                  <div className="folder-meta">
                    <div className="folder-name">{selectedFolder.name}</div>
                    <div className="folder-desc">
                      {folderChildren.filter(c => !c.isFolder).length} 个文件 {folderChildren.filter(c => c.isFolder).length} 个文件夹
                    </div>
                  </div>
                </div>
                <div className="folder-info-right">
                  <Button size="small" onClick={() => setSelectedFolderKey(null)}>返回概览</Button>
                  <Button icon={<PlusOutlined />} disabled={!isDraft} onClick={() => setModalOpen(true)}>添加资料</Button>
                </div>
              </div>
              <Table columns={columns} dataSource={folderChildren} pagination={false}
                className="file-table" size="middle" locale={{ emptyText: '文件夹为空，点击“添加资料”按钮添加' }}
                rowClassName={(record) => record.isFolder ? 'folder-row' : ''} />
            </>
          ) : (
            <>
              {/* 概览 */}
              <div className="folder-info">
                <div className="folder-info-left">
                  <div className="folder-big-icon"><FolderOutlined /></div>
                  <div className="folder-meta">
                    <div className="folder-name">{currentVersion?.name || '资料'}</div>
                    <div className="folder-desc">{fileCount} 个文件 {folderCount} 个文件夹</div>
                  </div>
                </div>
                <Button className="add-resource-btn" icon={<PlusOutlined />} disabled={!isDraft}
                  onClick={() => setModalOpen(true)}>添加资料</Button>
              </div>
              <Table columns={columns} dataSource={resources.filter(r => r.parentKey === null && !r.isFolder)}
                pagination={false} className="file-table" size="middle"
                locale={{ emptyText: '暂无资料，点击“添加资料”按钮添加' }} />
            </>
          )}
        </div>
      </div>

      )}

      {/* Add Resource Modal */}
      <AddResourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddResource}
      />
    </div>
  );
}

export default TopicDetail;
