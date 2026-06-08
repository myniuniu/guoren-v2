import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ColorPicker,
  Dropdown,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
  message,
} from 'antd';
import {
  BranchesOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  AppstoreOutlined,
  FolderFilled,
  FolderOpenFilled,
  FolderOutlined,
  HomeOutlined,
  MessageOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SendOutlined,
  SoundOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons';
import AddResourceModal from './AddResourceModal';
import AssessmentConfig from './AssessmentConfig';
import ResourceLibraryTagPicker from './resourceLib/ResourceLibraryTagPicker.jsx';
import { inferFileType } from './resourceLib/resourceLibStore';
import { renderFileIcon } from './resourceLib/resourceIcons.jsx';
import {
  addResource,
  createNewVersion,
  deleteResource,
  deleteVersion,
  getCurrentVersion,
  getVersions,
  loadFromStorage,
  publishVersion,
  rollbackVersion,
  switchVersion,
  updateAssessment,
  updateAssessmentChat,
  updateResource,
  updateVersionTagLibrary,
} from './versionStore';
import { getTopicAdminConfig } from './studyClub/adminTopicMapping';
import './TopicDetail.css';

function getResourceIcon(type) {
  switch (type) {
    case 'video':
      return <PlayCircleOutlined style={{ color: '#7d8797' }} />;
    case 'activity':
      return <AppstoreOutlined style={{ color: '#f59e0b' }} />;
    case 'survey':
    case 'vote':
    case 'exam':
    case 'register':
      return <EditOutlined style={{ color: '#3b82f6' }} />;
    default:
      return renderFileIcon('other', { fontSize: 16, color: '#98a2b3' });
  }
}

function getTopicResourceFileType(resource) {
  if (!resource || resource.isFolder) return 'folder';
  if (resource.type === 'video') return 'video';
  if (/\.html?$/i.test(resource.name || '')) return 'note';
  const inferred = inferFileType(resource.name || '');
  if (inferred !== 'other') return inferred;
  switch (resource.type) {
    case 'activity':
      return 'pptx';
    case 'survey':
    case 'vote':
    case 'exam':
    case 'register':
      return 'test';
    default:
      return 'other';
  }
}

function getResourceTypeLabel(resource, fileType) {
  if (!resource) return '文件';
  if (resource.isFolder) return '文件夹';
  switch (resource.type) {
    case 'video':
      return '视频课件';
    case 'activity':
      return '活动资料';
    case 'survey':
      return '调查';
    case 'vote':
      return '投票';
    case 'exam':
      return '考试';
    case 'register':
      return '报名';
    default:
      break;
  }
  const labels = {
    pdf: 'PDF 文档',
    pptx: 'PPT 演示',
    docx: 'Word 文档',
    xlsx: '表格文件',
    image: '图片资料',
    video: '视频资料',
    audio: '音频资料',
    note: '网页/文本',
    test: '互动内容',
    other: '资料文件',
  };
  return labels[fileType] || '资料文件';
}

function buildPreviewParagraphs(name) {
  return [
    `这是「${name}」的预览示意区域，当前用于演示在空间主题内点击文件后的浏览流程。`,
    '后续可以按真实文件类型接入在线预览、内容转码、文本解析或第三方文档服务。',
    '现在先保留轻量的占位内容，方便确认交互入口、布局和信息展示方式。',
  ];
}

function loadTopicVersionData(topicConfig) {
  if (topicConfig) {
    return loadFromStorage({
      scopeKey: topicConfig.storageScopeKey,
      initialData: topicConfig.initialDataFactory,
    });
  }
  return loadFromStorage();
}

function TopicDetail({ topicTitle, onBack }) {
  const topicAdminConfig = getTopicAdminConfig(topicTitle);
  const topicStorageScopeKey = topicAdminConfig?.storageScopeKey || 'default';
  const [activeTab, setActiveTab] = useState('knowledge');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [versionData, setVersionData] = useState(() => loadTopicVersionData(topicAdminConfig));
  const [editingKey, setEditingKey] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [tagPickerTarget, setTagPickerTarget] = useState(null);
  const [tagPickerGroupFilter, setTagPickerGroupFilter] = useState('all');
  const [tagPickerListScrollActive, setTagPickerListScrollActive] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1677ff');
  const tagPickerScrollTimerRef = useRef(null);

  useEffect(() => {
    setVersionData(loadTopicVersionData(topicAdminConfig));
    setActiveTab('knowledge');
    setModalOpen(false);
    setPreviewItem(null);
    setEditingKey(null);
    setEditingName('');
    setExpandedFolders(new Set());
    setSelectedFolderKey(null);
    setCreatingFolder(false);
    setNewFolderName('');
    setTagPickerTarget(null);
    setTagPickerGroupFilter('all');
    setTagPickerListScrollActive(false);
    setAddTagOpen(false);
    setNewTagName('');
    setNewTagColor('#1677ff');
  }, [topicTitle, topicStorageScopeKey]);

  const currentVersion = getCurrentVersion(versionData);
  const versions = getVersions(versionData);
  const isDraft = currentVersion?.status === 'draft';
  const isActive = currentVersion?.status === 'active';
  const resources = currentVersion?.resources || [];
  const tagConfig = topicAdminConfig?.tagConfig || null;
  const tagDefs = currentVersion?.tagDefinitions?.length
    ? currentVersion.tagDefinitions
    : tagConfig?.definitions || [];
  const tagGroups = currentVersion?.tagGroups?.length
    ? currentVersion.tagGroups
    : tagConfig?.groups || [];
  const quickComboDefs = useMemo(
    () => (tagConfig?.quickCombos || []).filter((combo) => (
      Array.isArray(combo.tagIds) && combo.tagIds.every((tagId) => tagDefs.some((tag) => tag.id === tagId))
    )),
    [tagConfig, tagDefs],
  );
  const quickTagDefs = useMemo(
    () => tagDefs.filter((tag) => tag.quick),
    [tagDefs],
  );
  const tagDefMap = useMemo(
    () => new Map(tagDefs.map((tag) => [tag.id, tag])),
    [tagDefs],
  );
  const exclusiveTagIdsByTagId = useMemo(() => {
    const map = new Map();
    tagGroups.forEach((group) => {
      if (!group.exclusive) return;
      const groupTagIds = (group.tagIds || []).filter((tagId) => tagDefMap.has(tagId));
      groupTagIds.forEach((tagId) => {
        map.set(tagId, groupTagIds);
      });
    });
    return map;
  }, [tagDefMap, tagGroups]);

  const rootItems = resources.filter((r) => r.parentKey === null);
  const getChildren = (folderKey) => resources.filter((r) => r.parentKey === folderKey);
  const selectedFolder = selectedFolderKey ? resources.find((r) => r.key === selectedFolderKey && r.isFolder) : null;
  const folderChildren = selectedFolder ? getChildren(selectedFolderKey) : [];
  const folderCount = resources.filter((r) => r.isFolder).length;
  const fileCount = resources.filter((r) => !r.isFolder).length;
  const tagPickerItem = tagPickerTarget
    ? resources.find((resource) => resource.key === tagPickerTarget) || null
    : null;

  const clearTagPickerScrollTimer = () => {
    if (!tagPickerScrollTimerRef.current) return;
    window.clearTimeout(tagPickerScrollTimerRef.current);
    tagPickerScrollTimerRef.current = null;
  };

  useEffect(() => () => clearTagPickerScrollTimer(), []);

  useEffect(() => {
    if (tagPickerGroupFilter !== 'all' && !tagGroups.some((group) => group.id === tagPickerGroupFilter)) {
      setTagPickerGroupFilter('all');
    }
  }, [tagGroups, tagPickerGroupFilter]);

  const getResourceTagIds = (resource) => {
    if (!resource || !tagConfig) return [];
    const directTags = Array.isArray(resource.tags) ? resource.tags : [];
    const legacyNameMap = tagConfig.legacyNameMap || {};
    const legacyTags = [];
    if (resource.folderTags?.labelName && legacyNameMap[resource.folderTags.labelName]) {
      legacyTags.push(legacyNameMap[resource.folderTags.labelName]);
    }
    if (resource.folderTags?.level && legacyNameMap[resource.folderTags.level]) {
      legacyTags.push(legacyNameMap[resource.folderTags.level]);
    }
    return Array.from(new Set([...directTags, ...legacyTags].filter((tagId) => tagDefMap.has(tagId))));
  };

  const getResourceTags = (resource) => (
    getResourceTagIds(resource)
      .map((tagId) => tagDefMap.get(tagId))
      .filter(Boolean)
  );

  const renderResourceTagDots = (resource, className = 'project-item-tags') => {
    const tags = getResourceTags(resource);
    if (tags.length === 0) return null;
    return (
      <span className={className}>
        {tags.slice(0, 5).map((tag) => (
          <span
            key={tag.id}
            className="topic-tag-dot"
            style={{ background: tag.color }}
            title={tag.name}
          />
        ))}
      </span>
    );
  };

  const renderResourceTagText = (resource) => {
    const tags = getResourceTags(resource);
    if (tags.length === 0) return null;
    const tagText = tags.map((tag) => tag.name).join('、');
    return (
      <span className="topic-tags-inline" title={tagText}>
        <span className="topic-tags-dots">
          {tags.slice(0, 5).map((tag) => (
            <span
              key={tag.id}
              className="topic-tag-dot"
              style={{ background: tag.color }}
            />
          ))}
        </span>
        <span className="topic-tags-text">{tagText}</span>
      </span>
    );
  };

  const renderPreviewTagTokens = (resource) => {
    const tags = getResourceTags(resource);
    if (tags.length === 0) {
      return <span className="topic-tags-empty">未设置标签</span>;
    }
    return (
      <div className="topic-preview-tags">
        {tags.map((tag) => (
          <span key={tag.id} className="topic-preview-tag">
            <span className="topic-tag-dot" style={{ background: tag.color }} />
            <span>{tag.name}</span>
          </span>
        ))}
      </div>
    );
  };

  const handleTagPickerListScroll = () => {
    setTagPickerListScrollActive(true);
    clearTagPickerScrollTimer();
    tagPickerScrollTimerRef.current = window.setTimeout(() => {
      setTagPickerListScrollActive(false);
      tagPickerScrollTimerRef.current = null;
    }, 640);
  };

  const persistResourceTags = (resourceKey, nextTagIds) => {
    const sanitizedTags = Array.from(new Set(nextTagIds.filter((tagId) => tagDefMap.has(tagId))));
    const nextData = updateResource(versionData, currentVersion.id, resourceKey, {
      tags: sanitizedTags,
      folderTags: null,
    });
    setVersionData(nextData);
  };

  const mergeExclusiveTags = (currentTagIds, tagIdsToAdd) => {
    let nextTagIds = [...currentTagIds];
    tagIdsToAdd.forEach((tagId) => {
      const exclusiveGroupTagIds = exclusiveTagIdsByTagId.get(tagId) || [];
      if (exclusiveGroupTagIds.length > 0) {
        nextTagIds = nextTagIds.filter((id) => id === tagId || !exclusiveGroupTagIds.includes(id));
      }
      if (!nextTagIds.includes(tagId)) {
        nextTagIds.push(tagId);
      }
    });
    return Array.from(new Set(nextTagIds.filter((tagId) => tagDefMap.has(tagId))));
  };

  const toggleItemTagSelection = (itemKey, tagId, checked) => {
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    const target = resources.find((item) => item.key === itemKey);
    if (!target) return;
    const currentTagIds = getResourceTagIds(target);
    const nextTagIds = checked
      ? currentTagIds.filter((id) => id !== tagId)
      : mergeExclusiveTags(currentTagIds, [tagId]);
    persistResourceTags(itemKey, nextTagIds);
  };

  const handleApplyQuickCombo = (itemKey, combo) => {
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    const target = resources.find((item) => item.key === itemKey);
    if (!target) return;
    const comboTagIds = (combo?.tagIds || []).filter((tagId) => tagDefMap.has(tagId));
    if (comboTagIds.length === 0) return;
    const currentTagIds = getResourceTagIds(target);
    const alreadyChecked = comboTagIds.every((tagId) => currentTagIds.includes(tagId));
    if (alreadyChecked) {
      persistResourceTags(itemKey, currentTagIds.filter((tagId) => !comboTagIds.includes(tagId)));
      return;
    }
    const exclusiveConflictIds = new Set(
      comboTagIds.flatMap((tagId) => exclusiveTagIdsByTagId.get(tagId) || []),
    );
    const baseTagIds = currentTagIds.filter((tagId) => !exclusiveConflictIds.has(tagId));
    persistResourceTags(itemKey, mergeExclusiveTags(baseTagIds, comboTagIds));
  };

  const handleQuickTagToggle = (tagId, quick) => {
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    const nextDefs = tagDefs.map((tag) => (
      tag.id === tagId ? { ...tag, quick } : tag
    ));
    const nextData = updateVersionTagLibrary(versionData, currentVersion.id, {
      tagDefinitions: nextDefs,
      tagGroups,
    });
    setVersionData(nextData);
  };

  const handleOpenTagPicker = (resourceKey) => {
    if (!tagConfig) return;
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    setTagPickerTarget(resourceKey);
    setTagPickerGroupFilter('all');
  };

  const handleAddTagConfirm = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      message.warning('标签名称不能为空');
      return;
    }
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    const color = typeof newTagColor === 'string'
      ? newTagColor
      : newTagColor?.toHexString?.() || '#1677ff';
    const nextDefs = [
      ...tagDefs,
      {
        id: `tag_topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: trimmedName,
        color,
        quick: false,
      },
    ];
    const nextData = updateVersionTagLibrary(versionData, currentVersion.id, {
      tagDefinitions: nextDefs,
      tagGroups,
    });
    setVersionData(nextData);
    setAddTagOpen(false);
    setNewTagName('');
    setNewTagColor('#1677ff');
    message.success(`标签「${trimmedName}」已创建`);
  };

  const tabs = [
    { key: 'knowledge', label: '知识模式' },
    { key: 'ai', label: 'AI模式' },
    { key: 'practice', label: '实训模式' },
    { key: 'assessment', label: '考核配置模式' },
  ];

  const handleUpdateAssessment = (assessment) => {
    const newData = updateAssessment(versionData, currentVersion.id, assessment);
    setVersionData(newData);
  };

  const handleUpdateAssessmentChat = (chat) => {
    const newData = updateAssessmentChat(versionData, currentVersion.id, chat);
    setVersionData(newData);
  };

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

  const handleDeleteResource = (resourceKey) => {
    const newData = deleteResource(versionData, currentVersion.id, resourceKey);
    setVersionData(newData);
    if (resourceKey === selectedFolderKey) setSelectedFolderKey(null);
    if (resourceKey === previewItem?.key) setPreviewItem(null);
    if (resourceKey === tagPickerTarget) setTagPickerTarget(null);
    message.success('资料已删除');
  };

  const handleStartEdit = (record) => {
    setEditingKey(record.key);
    setEditingName(record.name);
  };

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

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingName('');
  };

  const handleCreateVersion = () => {
    const newData = createNewVersion(versionData);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('新版本已创建，已继承上一版本的资料');
  };

  const handlePublishVersion = (versionId) => {
    const newData = publishVersion(versionData, versionId);
    setVersionData(newData);
    message.success('版本已发布，资料已锁定不可修改');
  };

  const handleSwitchVersion = (versionId) => {
    const newData = switchVersion(versionData, versionId);
    setVersionData(newData);
  };

  const handleDeleteVersion = (versionId) => {
    const newData = deleteVersion(versionData, versionId);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('版本已删除');
  };

  const handleRollbackVersion = (versionId) => {
    const newData = rollbackVersion(versionData, versionId);
    setVersionData(newData);
    message.success('已回退到指定版本，该版本现已生效');
  };

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

  const handleOpenPreview = (resource) => {
    if (!resource || resource.isFolder) return;
    setPreviewItem(resource);
  };

  const handleCreateFolder = () => {
    if (!isDraft) {
      message.warning('当前版本不可编辑');
      return;
    }
    setCreatingFolder(true);
    setNewFolderName('');
  };

  const handleSaveNewFolder = () => {
    const name = newFolderName.trim();
    if (!name) {
      message.warning('文件夹名称不能为空');
      return;
    }
    const newData = addResource(versionData, currentVersion.id, {
      name,
      isFolder: true,
      parentKey: selectedFolderKey || null,
    });
    setVersionData(newData);
    setCreatingFolder(false);
    message.success('文件夹创建成功');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        if (editingKey === record.key) {
          return (
            <div className="file-name-cell">
              <span className="file-icon">
                {record.isFolder ? <FolderOutlined style={{ color: '#4facfe' }} /> : getResourceIcon(record.type)}
              </span>
              <Input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
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
          <div
            className="file-name-cell file-name-cell-clickable"
            onClick={() => {
              if (record.isFolder) handleSelectFolder(record.key);
              else handleOpenPreview(record);
            }}
          >
            <span className="file-icon">
              {record.isFolder ? <FolderOutlined style={{ color: '#4facfe' }} /> : getResourceIcon(record.type)}
            </span>
            <span className="file-name-text" style={record.isFolder ? { color: '#1677ff' } : {}}>
              {text}
            </span>
          </div>
        );
      },
    },
    ...(tagConfig
      ? [
          {
            title: '标签',
            key: 'tags',
            width: 200,
            render: (_, record) => renderResourceTagText(record) || <span className="topic-tags-empty">-</span>,
          },
        ]
      : []),
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
            width: tagConfig ? 184 : 120,
            render: (_, record) => (
              <div className="action-cell" onClick={(event) => event.stopPropagation()}>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleStartEdit(record)}
                >
                  编辑
                </Button>
                {tagConfig ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<TagsOutlined />}
                    onClick={() => handleOpenTagPicker(record.key)}
                  >
                    标签
                  </Button>
                ) : null}
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

  const renderTreeItem = (item) => {
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
            <span
              className="project-item-arrow"
              onClick={(event) => {
                event.stopPropagation();
                toggleFolder(item.key);
              }}
            >
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
            <span className="project-item-icon">
              {isExpanded
                ? <FolderOpenFilled style={{ color: '#56a8f5' }} />
                : <FolderFilled style={{ color: '#56a8f5' }} />}
            </span>
            <span className="project-item-title">{item.name}</span>
            {renderResourceTagDots(item)}
          </div>
          {isExpanded && (
            <div className="tree-children">
              {children.map((child) => renderTreeItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={item.key}
        className="project-item project-item-child"
        onClick={() => handleOpenPreview(item)}
      >
        <span className="project-item-icon">{getResourceIcon(item.type)}</span>
        <span className="project-item-title">{item.name}</span>
        {renderResourceTagDots(item)}
      </div>
    );
  };

  const renderPreviewContent = (item) => {
    const fileType = getTopicResourceFileType(item);
    const docParagraphs = buildPreviewParagraphs(item.name);

    if (fileType === 'image') {
      return item.url ? (
        <img src={item.url} alt={item.name} className="topic-preview-image" />
      ) : (
        <div className="topic-preview-placeholder">
          {renderFileIcon('image', { fontSize: 88 })}
          <div>图片预览示意</div>
          <div className="topic-preview-subtle">后续可替换为真实图片内容流。</div>
        </div>
      );
    }

    if (fileType === 'pdf') {
      return item.url ? (
        <iframe src={item.url} className="topic-preview-iframe" title="PDF 预览" />
      ) : (
        <div className="topic-preview-sheet">
          <div className="topic-preview-sheet-head">
            <span>PDF 预览示意</span>
            <span>第 1 / 12 页</span>
          </div>
          <div className="topic-preview-sheet-title">{item.name}</div>
          {docParagraphs.map((paragraph, index) => (
            <p key={index} className="topic-preview-sheet-paragraph">{paragraph}</p>
          ))}
        </div>
      );
    }

    if (fileType === 'video') {
      return item.url ? (
        <video src={item.url} controls className="topic-preview-video" />
      ) : (
        <div className="topic-preview-video-card">
          {renderFileIcon('video', { fontSize: 84 })}
          <div className="topic-preview-video-title">视频预览示意</div>
          <div className="topic-preview-subtle">可接入转码封面、播放进度和时间轴摘要。</div>
        </div>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="topic-preview-audio-card">
          <SoundOutlined className="topic-preview-audio-icon" />
          <div className="topic-preview-audio-wave">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ height: `${18 + ((index * 7) % 26)}px` }} />
            ))}
          </div>
          <div className="topic-preview-subtle">音频预览示意，可后续补充播放控制与转写片段。</div>
        </div>
      );
    }

    if (fileType === 'pptx') {
      return (
        <div className="topic-preview-slide-deck">
          {[1, 2, 3].map((page) => (
            <div key={page} className="topic-preview-slide">
              <div className="topic-preview-slide-index">0{page}</div>
              <div className="topic-preview-slide-title">{item.name}</div>
              <div className="topic-preview-slide-line" />
              <div className="topic-preview-slide-line topic-preview-slide-line-short" />
            </div>
          ))}
        </div>
      );
    }

    if (fileType === 'xlsx') {
      return (
        <div className="topic-preview-grid">
          <div className="topic-preview-grid-row topic-preview-grid-row-head">
            <span>字段</span>
            <span>示例值</span>
            <span>说明</span>
          </div>
          <div className="topic-preview-grid-row">
            <span>资料名称</span>
            <span>{item.name}</span>
            <span>当前文件标题</span>
          </div>
          <div className="topic-preview-grid-row">
            <span>所有者</span>
            <span>{item.owner || '--'}</span>
            <span>用于示意表格内容区</span>
          </div>
          <div className="topic-preview-grid-row">
            <span>更新时间</span>
            <span>{item.lastEdit || '--'}</span>
            <span>后续可展示真实单元格</span>
          </div>
        </div>
      );
    }

    return (
      <div className="topic-preview-sheet">
        <div className="topic-preview-sheet-head">
          <span>{getResourceTypeLabel(item, fileType)}</span>
          <span>示意预览</span>
        </div>
        <div className="topic-preview-sheet-title">{item.name}</div>
        {docParagraphs.map((paragraph, index) => (
          <p key={index} className="topic-preview-sheet-paragraph">{paragraph}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="topic-detail">
      <div className="detail-header">
        <div className="detail-header-left">
          <HomeOutlined className="detail-home-icon" onClick={onBack} />
          <span className="detail-title">{topicTitle}</span>
          {topicAdminConfig ? (
            <Tag color="blue" style={{ marginLeft: 10, borderRadius: 999, padding: '0 10px' }}>
              研习社频道后台
            </Tag>
          ) : null}
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
                ...versions.map((version) => {
                  const statusLabel = version.status === 'active' ? '生效中' : version.status === 'published' ? '已失效' : '草稿';
                  const statusColor = version.status === 'active' ? 'green' : version.status === 'published' ? 'default' : 'orange';
                  const canDelete = version.status !== 'active';
                  return {
                    key: `switch-${version.id}`,
                    icon: version.id === currentVersion?.id ? <CheckCircleOutlined /> : <SwapOutlined />,
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span onClick={() => handleSwitchVersion(version.id)} style={{ flex: 1 }}>
                          {version.name}
                          <Tag color={statusColor} style={{ marginLeft: 8, fontSize: 10 }}>
                            {statusLabel}
                          </Tag>
                        </span>
                        {canDelete && (
                          <DeleteOutlined
                            style={{ color: '#ff4d4f', fontSize: 12, marginLeft: 8 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteVersion(version.id);
                            }}
                          />
                        )}
                      </span>
                    ),
                    onClick: () => handleSwitchVersion(version.id),
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
            const newData = addResource(versionData, currentVersion.id, {
              name,
              isFolder: true,
              parentKey: null,
            });
            setVersionData(newData);
          }}
        />
      ) : (
        <div className="detail-body">
          <div className="detail-left-panel">
            <div className="panel-header">
              <span className="panel-title">资料</span>
              <MoreOutlined className="panel-more-icon" />
            </div>

            <div className="ai-qa-box">
              <MessageOutlined style={{ color: '#999', fontSize: 14 }} />
              <span className="ai-qa-text">AI 问答</span>
            </div>

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

            <div className="project-section">
              <div className="project-header">
                <span className="project-title">项目</span>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'new-folder',
                        icon: <FolderOutlined />,
                        label: '新建文件夹',
                        onClick: handleCreateFolder,
                        disabled: !isDraft,
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <MoreOutlined className="project-more-icon" />
                </Dropdown>
              </div>

              {creatingFolder && (
                <div className="new-folder-form">
                  <div className="new-folder-row">
                    <FolderOutlined style={{ color: '#4facfe', fontSize: 14 }} />
                    <Input
                      size="small"
                      placeholder="输入文件夹名称"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      onPressEnter={handleSaveNewFolder}
                      autoFocus
                      style={{ flex: 1 }}
                    />
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
                  rootItems.map((item) => renderTreeItem(item))
                )}
              </div>
            </div>
          </div>

          <div className="detail-right-panel">
            {selectedFolder ? (
              <>
                <div className="folder-info">
                  <div className="folder-info-left">
                    <div className="folder-big-icon"><FolderFilled /></div>
                    <div className="folder-meta">
                      <div className="folder-name">{selectedFolder.name}</div>
                      <div className="folder-desc">
                        {folderChildren.filter((child) => !child.isFolder).length} 个文件 {folderChildren.filter((child) => child.isFolder).length} 个文件夹
                      </div>
                      {tagConfig ? (
                        <div className="folder-tag-section">
                          <div className="folder-tag-row">
                            <span className="folder-tag-label">标签</span>
                            {renderResourceTagText(selectedFolder) || <span className="topic-tags-empty">未设置标签</span>}
                            {isDraft ? (
                              <Button size="small" icon={<TagsOutlined />} onClick={() => handleOpenTagPicker(selectedFolder.key)}>
                                编辑标签
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="folder-info-right">
                    <Button size="small" onClick={() => setSelectedFolderKey(null)}>返回概览</Button>
                    <Button icon={<PlusOutlined />} disabled={!isDraft} onClick={() => setModalOpen(true)}>添加资料</Button>
                  </div>
                </div>
                <Table
                  columns={columns}
                  dataSource={folderChildren}
                  pagination={false}
                  className="file-table"
                  size="middle"
                  locale={{ emptyText: '文件夹为空，点击“添加资料”按钮添加' }}
                  rowClassName={(record) => (record.isFolder ? 'folder-row' : 'file-preview-row')}
                />
              </>
            ) : (
              <>
                <div className="folder-info">
                  <div className="folder-info-left">
                    <div className="folder-big-icon"><FolderFilled /></div>
                    <div className="folder-meta">
                      <div className="folder-name">{currentVersion?.name || '资料'}</div>
                      <div className="folder-desc">{fileCount} 个文件 {folderCount} 个文件夹</div>
                    </div>
                  </div>
                  <Button className="add-resource-btn" icon={<PlusOutlined />} disabled={!isDraft} onClick={() => setModalOpen(true)}>
                    添加资料
                  </Button>
                </div>
                <Table
                  columns={columns}
                  dataSource={resources.filter((resource) => resource.parentKey === null && !resource.isFolder)}
                  pagination={false}
                  className="file-table"
                  size="middle"
                  locale={{ emptyText: '暂无资料，点击“添加资料”按钮添加' }}
                  rowClassName={() => 'file-preview-row'}
                />
              </>
            )}
          </div>
        </div>
      )}

      <AddResourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddResource}
      />

      <Modal
        title={previewItem ? `预览：${previewItem.name}` : '预览'}
        open={!!previewItem}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        width={860}
        destroyOnClose
        className="topic-preview-modal"
      >
        {previewItem ? (
          <div className="topic-preview-content">
            <div className="topic-preview-body">
              {renderPreviewContent(previewItem)}
            </div>
            <div className="topic-preview-footer">
              <div className="topic-preview-name">{previewItem.name}</div>
              <div className="topic-preview-meta-row">
                <span>{getResourceTypeLabel(previewItem, getTopicResourceFileType(previewItem))}</span>
                <span>{previewItem.owner || '--'}</span>
                <span>{previewItem.lastEdit || '--'}</span>
              </div>
              {tagConfig ? (
                <div className="topic-preview-tags-row">
                  <span className="topic-preview-footer-label">标签</span>
                  {renderPreviewTagTokens(previewItem)}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑标签"
        open={!!tagPickerTarget}
        onCancel={() => setTagPickerTarget(null)}
        footer={null}
        destroyOnClose
        width={320}
      >
        {tagPickerItem ? (
          <ResourceLibraryTagPicker
            item={{ ...tagPickerItem, tags: getResourceTagIds(tagPickerItem) }}
            tagDefs={tagDefs}
            quickTagDefs={quickTagDefs}
            tagGroups={tagGroups}
            quickComboDefs={quickComboDefs}
            activeGroupFilter={tagPickerGroupFilter}
            listScrollActive={tagPickerListScrollActive}
            onGroupFilterChange={setTagPickerGroupFilter}
            onListScroll={handleTagPickerListScroll}
            onToggleItemTagSelection={toggleItemTagSelection}
            onApplyQuickCombo={handleApplyQuickCombo}
            onQuickTagToggle={handleQuickTagToggle}
            onCreateTag={() => setAddTagOpen(true)}
          />
        ) : null}
      </Modal>

      <Modal
        title="新建自定义标签"
        open={addTagOpen}
        onCancel={() => {
          setAddTagOpen(false);
          setNewTagName('');
          setNewTagColor('#1677ff');
        }}
        onOk={handleAddTagConfirm}
        okText="创建"
        cancelText="取消"
        destroyOnClose
        width={360}
      >
        <div className="topic-tag-create-form">
          <div className="topic-tag-create-field">
            <div className="topic-tag-create-label">标签名称</div>
            <Input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="例如：重点、推荐、专题"
            />
          </div>
          <div className="topic-tag-create-field">
            <div className="topic-tag-create-label">标签颜色</div>
            <div className="topic-tag-create-color">
              <ColorPicker value={newTagColor} onChange={setNewTagColor} />
              <span
                className="topic-tag-create-swatch"
                style={{
                  background: typeof newTagColor === 'string'
                    ? newTagColor
                    : newTagColor?.toHexString?.() || '#1677ff',
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TopicDetail;
