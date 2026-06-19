import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ColorPicker,
  Dropdown,
  Empty,
  Input,
  Modal,
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
  EyeOutlined,
  FileAddOutlined,
  AppstoreOutlined,
  FolderFilled,
  FolderAddOutlined,
  FolderOpenFilled,
  FolderOutlined,
  HomeOutlined,
  MessageOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RightOutlined,
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
  isVersionEditable,
  loadFromStorage,
  moveResource,
  publishVersion,
  rollbackVersion,
  switchVersion,
  updateAssessment,
  updateAssessmentChat,
  updateResourceArchiveProfile,
  updateResource,
  updateVersionTagLibrary,
} from './versionStore';
import { buildSceneInitialVersionData, normalizeVersioningConfig } from './scene/api';
import { buildSceneResourceArchiveMeta, isSceneResourceArchived } from './shared/sceneGrowthRecords';
import { getTopicAdminConfig } from './studyClub/adminTopicMapping';
import './TopicDetail.css';

const EMPTY_TAB_INDICATOR = { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
const TOPIC_DROPDOWN_OVERLAY_CLASS = 'finder-liquid-glass-menu';

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
    `《${name}》围绕当前主题整理了背景说明、关键动作和执行要点，适合直接在空间内浏览。`,
    '内容会随着后台主题版本同步更新，方便在知识模式内持续维护和查看。',
    '如需进一步补充，可继续在当前版本中更新资料名称、标签或内容结构。',
  ];
}

function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return `rgba(86, 168, 245, ${alpha})`;
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(86, 168, 245, ${alpha})`;
  }
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getDefaultLeftPanelWidth() {
  if (typeof window === 'undefined') return 360;
  if (window.innerWidth <= 1120) return 308;
  if (window.innerWidth <= 1360) return 332;
  return 360;
}

function loadTopicVersionData(topicConfig, sceneConfig, storageScopeKey) {
  if (sceneConfig) {
    return loadFromStorage({
      scopeKey: storageScopeKey || 'default',
      initialData: () => buildSceneInitialVersionData(sceneConfig),
    });
  }
  if (topicConfig) {
    return loadFromStorage({
      scopeKey: topicConfig.storageScopeKey,
      initialData: topicConfig.initialDataFactory,
    });
  }
  return loadFromStorage();
}

function TopicDetail({
  topicTitle,
  onBack,
  sceneConfig = null,
  storageScopeKey,
  sceneDescription,
  sceneTypeLabel,
  sceneId = null,
  sceneType = null,
}) {
  const topicAdminConfig = sceneConfig ? null : getTopicAdminConfig(topicTitle);
  const topicStorageScopeKey = storageScopeKey || topicAdminConfig?.storageScopeKey || 'default';
  const [activeTab, setActiveTab] = useState('knowledge');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [versionData, setVersionData] = useState(() => loadTopicVersionData(topicAdminConfig, sceneConfig, topicStorageScopeKey));
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => getDefaultLeftPanelWidth());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [addResourceParentKey, setAddResourceParentKey] = useState(undefined);
  const [inlineRenameItemKey, setInlineRenameItemKey] = useState(null);
  const [inlineRenameName, setInlineRenameName] = useState('');
  const [inlineRenameSurface, setInlineRenameSurface] = useState('list');
  const [contextMenuItemKey, setContextMenuItemKey] = useState(null);
  const [bgMenuPos, setBgMenuPos] = useState(null);
  const [bgMenuSurface, setBgMenuSurface] = useState('list');
  const [dragOverFolderKey, setDragOverFolderKey] = useState(null);
  const [dragOverItemKey, setDragOverItemKey] = useState(null);
  const [dragOverSurface, setDragOverSurface] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [draggingItemKey, setDraggingItemKey] = useState(null);
  const [tagPickerTarget, setTagPickerTarget] = useState(null);
  const [tagPickerGroupFilter, setTagPickerGroupFilter] = useState('all');
  const [tagPickerListScrollActive, setTagPickerListScrollActive] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1677ff');
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState(EMPTY_TAB_INDICATOR);
  const detailBodyRef = useRef(null);
  const detailTabsRef = useRef(null);
  const detailTabRefs = useRef(new Map());
  const inlineRenameInputRef = useRef(null);
  const pendingRenameTimerRef = useRef(null);
  const tagPickerScrollTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragPayloadRef = useRef(null);

  useEffect(() => {
    setVersionData(loadTopicVersionData(topicAdminConfig, sceneConfig, topicStorageScopeKey));
    setActiveTab('knowledge');
    setModalOpen(false);
    setPreviewItem(null);
    setLeftPanelWidth(getDefaultLeftPanelWidth());
    setExpandedFolders(new Set());
    setSelectedFolderKey(null);
    setSelectedItemKey(null);
    setAddResourceParentKey(undefined);
    setInlineRenameItemKey(null);
    setInlineRenameName('');
    setInlineRenameSurface('list');
    setContextMenuItemKey(null);
    setBgMenuPos(null);
    setBgMenuSurface('list');
    setDragOverFolderKey(null);
    setDragOverItemKey(null);
    setDragOverSurface(null);
    setDropIndicator(null);
    setDraggingItemKey(null);
    setTagPickerTarget(null);
    setTagPickerGroupFilter('all');
    setTagPickerListScrollActive(false);
    setAddTagOpen(false);
    setNewTagName('');
    setNewTagColor('#1677ff');
    setTabIndicatorStyle(EMPTY_TAB_INDICATOR);
  }, [sceneConfig, topicAdminConfig, topicStorageScopeKey, topicTitle]);

  const currentVersion = getCurrentVersion(versionData);
  const versions = getVersions(versionData);
  const isDraft = currentVersion?.status === 'draft';
  const isActive = currentVersion?.status === 'active';
  const versioningConfig = useMemo(
    () => normalizeVersioningConfig(sceneConfig?.versioning),
    [sceneConfig],
  );
  const versioningEnabled = versioningConfig.enabled !== false;
  const canEditCurrentVersion = isVersionEditable(currentVersion, versioningConfig);
  const resources = currentVersion?.resources || [];
  const tagConfig = topicAdminConfig?.tagConfig || null;
  const sceneTheme = sceneConfig?.theme || null;
  const currentModeConfig = useMemo(() => {
    const configuredModes = Array.isArray(sceneConfig?.topicPage?.modeTabs)
      ? sceneConfig.topicPage.modeTabs
      : [];
    return configuredModes.find((item) => item?.key === activeTab) || null;
  }, [activeTab, sceneConfig]);
  const resourcePanelTitle = currentModeConfig?.resourcePanelTitle || sceneConfig?.topicPage?.resourcePanelTitle || '资料';
  const addResourceLabel = currentModeConfig?.addResourceLabel || sceneConfig?.topicPage?.addResourceLabel || '添加资料';
  const appLabel = currentModeConfig?.appLabel || sceneConfig?.topicPage?.appLabel || '应用';
  const emptyStateText = currentModeConfig?.emptyStateText || sceneConfig?.topicPage?.emptyStateText || '暂无资料，右键新建文件夹或添加资料';
  const useSceneTopicTheme = (sceneTheme?.topicThemeMode || 'DEFAULT') === 'SCENE';
  const detailThemeStyle = sceneTheme
    && useSceneTopicTheme
    ? {
        '--td-accent': sceneTheme.accentColor || '#56a8f5',
        '--td-accent-soft': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.14),
        '--td-accent-strong': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.24),
        '--td-accent-glow': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.36),
        '--td-panel-bg': `linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 58%, rgba(250, 251, 252, 0.9) 100%), linear-gradient(135deg, ${hexToRgba(sceneTheme.coverStart, 0.18)} 0%, ${hexToRgba(sceneTheme.coverEnd, 0.14)} 100%)`,
      }
    : undefined;
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
  const currentListItems = selectedFolder ? folderChildren : rootItems;
  const currentListParentKey = selectedFolderKey || null;
  const previewParentFolder = previewItem?.parentKey
    ? resources.find((resource) => resource.key === previewItem.parentKey && resource.isFolder) || null
    : null;
  const tagPickerItem = tagPickerTarget
    ? resources.find((resource) => resource.key === tagPickerTarget) || null
    : null;
  const activeSceneType = sceneType || sceneConfig?.sceneType || null;
  const canArchiveSceneResource = !!sceneConfig && !!activeSceneType;
  const previewItemArchived = previewItem ? isSceneResourceArchived(previewItem) : false;

  const clearTagPickerScrollTimer = () => {
    if (!tagPickerScrollTimerRef.current) return;
    window.clearTimeout(tagPickerScrollTimerRef.current);
    tagPickerScrollTimerRef.current = null;
  };

  const clearPendingRenameTrigger = () => {
    if (!pendingRenameTimerRef.current) return;
    window.clearTimeout(pendingRenameTimerRef.current);
    pendingRenameTimerRef.current = null;
  };

  const clearDragState = () => {
    setDragOverFolderKey(null);
    setDragOverItemKey(null);
    setDragOverSurface(null);
    setDropIndicator(null);
    setDraggingItemKey(null);
  };

  const hasResourceDragPayload = (event) => {
    if (dragPayloadRef.current?.key) return true;
    const dragTypes = Array.from(event.dataTransfer?.types || []);
    return dragTypes.includes('application/json') || dragTypes.includes('text/plain');
  };

  const getDraggedResourcePayload = (event) => {
    try {
      if (dragPayloadRef.current?.key) {
        const currentDragItem = resources.find((resource) => resource.key === dragPayloadRef.current.key);
        if (currentDragItem) {
          return {
            key: currentDragItem.key,
            name: currentDragItem.name,
            isFolder: currentDragItem.isFolder,
          };
        }
        return dragPayloadRef.current;
      }
      if (!hasResourceDragPayload(event)) return null;
      const raw = event.dataTransfer.getData('application/json');
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload?.key) return payload;
      }

      const fallbackKey = (event.dataTransfer.getData('text/plain') || '').trim();
      if (!fallbackKey) return null;
      const draggedItem = resources.find((resource) => resource.key === fallbackKey);
      if (!draggedItem) return null;
      return {
        key: draggedItem.key,
        name: draggedItem.name,
        isFolder: draggedItem.isFolder,
      };
    } catch {
      return null;
    }
  };

  const startResourceDrag = (event, item) => {
    if (!item?.key || inlineRenameItemKey === item.key) return;
    clearPendingRenameTrigger();
    setContextMenuItemKey(null);
    setBgMenuPos(null);
    setSelectedItemKey(item.key);
    setDraggingItemKey(item.key);
    isDraggingRef.current = true;
    const dragPayload = {
      key: item.key,
      name: item.name,
      isFolder: item.isFolder,
    };
    dragPayloadRef.current = dragPayload;
    const payload = JSON.stringify(dragPayload);
    event.dataTransfer.setData('application/json', payload);
    event.dataTransfer.setData('text/plain', item.key);
    event.dataTransfer.effectAllowed = 'move';
  };

  const finishResourceDrag = () => {
    isDraggingRef.current = false;
    window.setTimeout(() => {
      dragPayloadRef.current = null;
      clearDragState();
    }, 0);
  };

  const handleSidebarResizeStart = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = leftPanelWidth;
    const containerWidth = detailBodyRef.current?.getBoundingClientRect().width || window.innerWidth;
    const minWidth = 280;
    const minRightWidth = 320;
    const maxWidth = Math.max(minWidth, containerWidth - minRightWidth);

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setLeftPanelWidth(nextWidth);
    };

    const handlePointerUp = () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => () => {
    clearTagPickerScrollTimer();
    clearPendingRenameTrigger();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const containerWidth = detailBodyRef.current?.getBoundingClientRect().width || window.innerWidth;
      const minLeftWidth = 280;
      const minRightWidth = 320;
      const maxWidth = Math.max(minLeftWidth, containerWidth - minRightWidth);
      setLeftPanelWidth((prev) => Math.min(prev, maxWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tagPickerGroupFilter !== 'all' && !tagGroups.some((group) => group.id === tagPickerGroupFilter)) {
      setTagPickerGroupFilter('all');
    }
  }, [tagGroups, tagPickerGroupFilter]);

  useEffect(() => {
    if (selectedFolderKey && !resources.some((resource) => resource.key === selectedFolderKey && resource.isFolder)) {
      setSelectedFolderKey(null);
    }
    if (selectedItemKey && !resources.some((resource) => resource.key === selectedItemKey)) {
      setSelectedItemKey(null);
    }
    if (contextMenuItemKey && !resources.some((resource) => resource.key === contextMenuItemKey)) {
      setContextMenuItemKey(null);
    }
    if (draggingItemKey && !resources.some((resource) => resource.key === draggingItemKey)) {
      setDraggingItemKey(null);
    }
    if (dragOverFolderKey && !resources.some((resource) => resource.key === dragOverFolderKey && resource.isFolder)) {
      setDragOverFolderKey(null);
    }
    if (dragOverItemKey && !resources.some((resource) => resource.key === dragOverItemKey)) {
      setDragOverItemKey(null);
    }
    if (dropIndicator?.itemKey && !resources.some((resource) => resource.key === dropIndicator.itemKey)) {
      setDropIndicator(null);
    }
    if (inlineRenameItemKey && !resources.some((resource) => resource.key === inlineRenameItemKey)) {
      setInlineRenameItemKey(null);
      setInlineRenameName('');
    }
    if (!previewItem) return;
    const matchedPreviewItem = resources.find((resource) => resource.key === previewItem.key) || null;
    if (!matchedPreviewItem) {
      setPreviewItem(null);
      return;
    }
    if (matchedPreviewItem !== previewItem) {
      setPreviewItem(matchedPreviewItem);
    }
  }, [
    contextMenuItemKey,
    dragOverFolderKey,
    dragOverItemKey,
    dragOverSurface,
    draggingItemKey,
    dropIndicator,
    inlineRenameItemKey,
    previewItem,
    resources,
    selectedFolderKey,
    selectedItemKey,
  ]);

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

  const getPreviewOutlineEntries = (resource) => {
    const tocEntries = resource?.meta?.detail?.toc;
    if (!Array.isArray(tocEntries)) return [];
    return tocEntries
      .map((entry) => entry?.text || entry?.title || entry?.subtitle || '')
      .filter(Boolean);
  };

  const getPreviewSummary = (resource, fileType) => {
    const detail = resource?.meta?.detail || {};
    return (
      detail.description ||
      detail.desc ||
      detail.abstract ||
      detail.info ||
      resource?.meta?.summary ||
      resource?.meta?.content ||
      (fileType === 'video' ? `${resource?.name || '当前资料'}的视频内容。` : '') ||
      ''
    );
  };

  const getPreviewBodyBlocks = (resource) => {
    const detailBody = resource?.meta?.detail?.body;
    if (Array.isArray(detailBody) && detailBody.length > 0) return detailBody;
    if (Array.isArray(resource?.meta?.paragraphs) && resource.meta.paragraphs.length > 0) {
      return resource.meta.paragraphs.map((paragraph) => ({ type: 'paragraph', text: paragraph }));
    }
    return buildPreviewParagraphs(resource?.name || '当前资料').map((paragraph) => ({
      type: 'paragraph',
      text: paragraph,
    }));
  };

  const renderDocumentPreview = (resource, fileType) => {
    const outlineEntries = getPreviewOutlineEntries(resource);
    const summary = getPreviewSummary(resource, fileType);
    const bodyBlocks = getPreviewBodyBlocks(resource);

    const renderBodyBlock = (block, index) => {
      if (typeof block === 'string') {
        return <p key={index} className="topic-preview-doc-paragraph">{block}</p>;
      }
      if (!block || typeof block !== 'object') return null;

      if (block.type === 'heading') {
        return <h2 key={index} className="topic-preview-doc-heading">{block.text}</h2>;
      }

      if (block.type === 'blockquote') {
        return (
          <blockquote key={index} className="topic-preview-doc-quote">
            {block.text}
          </blockquote>
        );
      }

      if (block.type === 'highlight') {
        return (
          <div key={index} className="topic-preview-doc-highlight">
            {block.text}
          </div>
        );
      }

      if (block.type === 'list') {
        return (
          <ul key={index} className="topic-preview-doc-list">
            {(block.items || []).map((itemText, itemIndex) => (
              <li key={`${itemText}-${itemIndex}`}>{itemText}</li>
            ))}
          </ul>
        );
      }

      if (block.type === 'image') {
        return (
          <div
            key={index}
            className="topic-preview-doc-image"
            style={{ background: block.gradient || 'linear-gradient(135deg, #eef5ff 0%, #dce7ff 100%)' }}
          >
            <span>{block.alt || resource.name}</span>
          </div>
        );
      }

      if (block.type === 'link') {
        return (
          <div key={index} className="topic-preview-doc-link">
            <span>{block.text || '链接'}</span>
            <span>{block.url}</span>
          </div>
        );
      }

      return <p key={index} className="topic-preview-doc-paragraph">{block.text || ''}</p>;
    };

    return (
      <article className="topic-preview-document">
        <div className="topic-preview-document-kicker">{getResourceTypeLabel(resource, fileType)}</div>
        <h1 className="topic-preview-document-title">{resource.name}</h1>
        {summary ? <p className="topic-preview-document-summary">{summary}</p> : null}
        {outlineEntries.length > 0 ? (
          <div className="topic-preview-document-outline">
            {outlineEntries.slice(0, 8).map((entry, entryIndex) => (
              <span key={`${entry}-${entryIndex}`} className="topic-preview-document-outline-chip">{entry}</span>
            ))}
          </div>
        ) : null}
        <div className="topic-preview-document-body">
          {bodyBlocks.map(renderBodyBlock)}
        </div>
      </article>
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
    }, versioningConfig);
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
    if (!canEditCurrentVersion) {
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
    if (!canEditCurrentVersion) {
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
    if (!canEditCurrentVersion) {
      message.warning('当前版本不可编辑');
      return;
    }
    const nextDefs = tagDefs.map((tag) => (
      tag.id === tagId ? { ...tag, quick } : tag
    ));
    const nextData = updateVersionTagLibrary(versionData, currentVersion.id, {
      tagDefinitions: nextDefs,
      tagGroups,
    }, versioningConfig);
    setVersionData(nextData);
  };

  const handleOpenTagPicker = (resourceKey) => {
    if (!tagConfig) return;
    if (!canEditCurrentVersion) {
      message.warning('当前版本不可编辑');
      return;
    }
    clearPendingRenameTrigger();
    setTagPickerTarget(resourceKey);
    setTagPickerGroupFilter('all');
  };

  const handleAddTagConfirm = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      message.warning('标签名称不能为空');
      return;
    }
    if (!canEditCurrentVersion) {
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
    }, versioningConfig);
    setVersionData(nextData);
    setAddTagOpen(false);
    setNewTagName('');
    setNewTagColor('#1677ff');
    message.success(`标签「${trimmedName}」已创建`);
  };

  const tabs = useMemo(() => {
    const hasConfiguredTabs = Array.isArray(sceneConfig?.topicPage?.modeTabs);
    const configuredTabs = hasConfiguredTabs
      ? sceneConfig.topicPage.modeTabs.filter((item) => item.enabled !== false)
      : [];
    if (hasConfiguredTabs) {
      return configuredTabs.map((item, index) => ({
        key: item.key,
        label: item.label || item.key || `模式 ${index + 1}`,
      }));
    }
    return [
      { key: 'knowledge', label: '知识模式' },
      { key: 'ai', label: 'AI模式' },
      { key: 'practice', label: '实训模式' },
      { key: 'assessment', label: '考核配置模式' },
    ];
  }, [sceneConfig]);

  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTab('');
      return;
    }
    if (tabs.some((tab) => tab.key === activeTab)) return;
    setActiveTab(tabs[0].key);
  }, [activeTab, tabs]);

  const setDetailTabRef = useCallback((key, node) => {
    if (node) {
      detailTabRefs.current.set(key, node);
      return;
    }
    detailTabRefs.current.delete(key);
  }, []);

  const updateTabIndicator = useCallback(() => {
    const container = detailTabsRef.current;
    const target = detailTabRefs.current.get(activeTab) || null;

    if (!container || !target) {
      setTabIndicatorStyle((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextStyle = {
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height,
      opacity: 1,
    };

    setTabIndicatorStyle((prev) => {
      const unchanged = ['x', 'y', 'width', 'height', 'opacity']
        .every((key) => Math.abs((prev[key] || 0) - (nextStyle[key] || 0)) < 0.5);
      return unchanged ? prev : nextStyle;
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateTabIndicator();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeTab, updateTabIndicator]);

  useEffect(() => {
    const handleViewportChange = () => {
      updateTabIndicator();
    };

    window.addEventListener('resize', handleViewportChange);

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleViewportChange)
      : null;

    if (observer) {
      if (detailTabsRef.current) observer.observe(detailTabsRef.current);
      detailTabRefs.current.forEach((node) => observer.observe(node));
    }

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      observer?.disconnect();
    };
  }, [activeTab, updateTabIndicator]);

  const handleUpdateAssessment = (assessment) => {
    const newData = updateAssessment(versionData, currentVersion.id, assessment);
    setVersionData(newData);
  };

  const handleUpdateAssessmentChat = (chat) => {
    const newData = updateAssessmentChat(versionData, currentVersion.id, chat);
    setVersionData(newData);
  };

  useEffect(() => {
    if (!inlineRenameItemKey) return undefined;
    const timer = window.setTimeout(() => {
      inlineRenameInputRef.current?.focus?.();
      inlineRenameInputRef.current?.select?.();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [inlineRenameItemKey, inlineRenameSurface]);

  const handleCreateVersion = () => {
    const newData = createNewVersion(versionData, versioningConfig);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success(
      versioningConfig.createMode === 'EMPTY'
        ? '新版本已创建，请从空白版本开始配置'
        : '新版本已创建，已继承上一版本的资料',
    );
  };

  const handlePublishVersion = (versionId) => {
    const newData = publishVersion(versionData, versionId, versioningConfig);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('版本已发布，资料已锁定不可修改');
  };

  const handleSwitchVersion = (versionId) => {
    const newData = switchVersion(versionData, versionId);
    setVersionData(newData);
  };

  const handleDeleteVersion = (versionId) => {
    const newData = deleteVersion(versionData, versionId, versioningConfig);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('版本已删除');
  };

  const handleRollbackVersion = (versionId) => {
    const newData = rollbackVersion(versionData, versionId, versioningConfig);
    if (newData.error) {
      message.warning(newData.error);
      return;
    }
    setVersionData(newData);
    message.success('已回退到指定版本，该版本现已生效');
  };

  const closeAddResourceModal = () => {
    clearPendingRenameTrigger();
    setModalOpen(false);
    setAddResourceParentKey(undefined);
  };

  const openAddResourceModal = (parentKey = currentListParentKey) => {
    if (!canEditCurrentVersion) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再添加资料' : '当前内容不可编辑');
      return;
    }
    clearPendingRenameTrigger();
    setAddResourceParentKey(parentKey ?? null);
    setModalOpen(true);
  };

  const handleAddResource = (resource) => {
    if (!canEditCurrentVersion) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再添加资料' : '当前内容不可编辑');
      return;
    }
    const parentKey = typeof addResourceParentKey === 'undefined'
      ? currentListParentKey
      : addResourceParentKey;
    const newData = addResource(versionData, currentVersion.id, {
      ...resource,
      parentKey: parentKey ?? null,
    }, versioningConfig);
    setVersionData(newData);
    setAddResourceParentKey(undefined);
    message.success('资料添加成功');
  };

  const handleArchiveResourceToProfile = (resource) => {
    if (!resource || resource.isFolder || !canArchiveSceneResource) return;
    if (isSceneResourceArchived(resource)) {
      message.info('该业务活动已归档到我的档案');
      return;
    }
    const archiveProfile = buildSceneResourceArchiveMeta({
      scene: {
        id: sceneId,
        name: topicTitle,
        sceneType: activeSceneType,
        storageScopeKey: topicStorageScopeKey,
      },
      sceneId,
      sceneName: topicTitle,
      sceneType: activeSceneType,
      sceneTypeLabel,
      storageScopeKey: topicStorageScopeKey,
      resource,
      resources,
    });
    const nextData = updateResourceArchiveProfile(versionData, currentVersion.id, resource.key, archiveProfile);
    setVersionData(nextData);
    message.success(`已将「${resource.name}」归档到我的档案`);
  };

  const removeResource = (resourceKey) => {
    const newData = deleteResource(versionData, currentVersion.id, resourceKey, versioningConfig);
    setVersionData(newData);
    if (resourceKey === selectedFolderKey) setSelectedFolderKey(null);
    if (resourceKey === previewItem?.key) setPreviewItem(null);
    if (resourceKey === tagPickerTarget) setTagPickerTarget(null);
    if (resourceKey === selectedItemKey) setSelectedItemKey(null);
    if (resourceKey === inlineRenameItemKey) {
      setInlineRenameItemKey(null);
      setInlineRenameName('');
    }
    if (resourceKey === contextMenuItemKey) setContextMenuItemKey(null);
    message.success('资料已删除');
  };

  const requestDeleteResource = (resource) => {
    if (!resource || !canEditCurrentVersion) {
      if (!canEditCurrentVersion) message.warning('当前版本不可编辑');
      return;
    }
    clearPendingRenameTrigger();
    Modal.confirm({
      title: '确认删除',
      icon: null,
      content: `确定要删除“${resource.name}”吗？${resource.isFolder ? '删除文件夹会同时删除其中全部内容。' : ''}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => removeResource(resource.key),
    });
  };

  const cancelInlineRename = () => {
    clearPendingRenameTrigger();
    setInlineRenameItemKey(null);
    setInlineRenameName('');
  };

  const confirmInlineRename = () => {
    if (!inlineRenameItemKey) return;
    const target = resources.find((item) => item.key === inlineRenameItemKey);
    const trimmed = inlineRenameName.trim();

    if (target && trimmed && trimmed !== target.name) {
      const newData = updateResource(versionData, currentVersion.id, target.key, { name: trimmed }, versioningConfig);
      setVersionData(newData);
      message.success('已重命名');
    }

    cancelInlineRename();
  };

  const startInlineRename = (item, surface = 'list') => {
    if (!item?.key) return;
    if (!canEditCurrentVersion) {
      message.warning('当前版本不可编辑');
      return;
    }
    clearPendingRenameTrigger();
    setBgMenuPos(null);
    setContextMenuItemKey(null);
    setSelectedItemKey(item.key);
    setInlineRenameItemKey(item.key);
    setInlineRenameName(item.name || '');
    setInlineRenameSurface(surface);
  };

  const queueInlineRename = (item, surface = 'list', delay = 220) => {
    if (!item?.key || !canEditCurrentVersion) return;
    clearPendingRenameTrigger();
    pendingRenameTimerRef.current = window.setTimeout(() => {
      pendingRenameTimerRef.current = null;
      startInlineRename(item, surface);
    }, delay);
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
    clearPendingRenameTrigger();
    setContextMenuItemKey(null);
    setBgMenuPos(null);
    setPreviewItem(null);
    setSelectedItemKey(folderKey);
    setSelectedFolderKey(folderKey);
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderKey);
      return next;
    });
  };

  const handleOpenPreview = (resource) => {
    if (!resource || resource.isFolder) return;
    clearPendingRenameTrigger();
    setContextMenuItemKey(null);
    setBgMenuPos(null);
    setSelectedItemKey(resource.key);
    setSelectedFolderKey(resource.parentKey || null);
    setPreviewItem(resource);
  };

  const handleActivateItem = (item, surface = 'list') => {
    if (!item) return;
    if (selectedItemKey === item.key && inlineRenameItemKey !== item.key) {
      queueInlineRename(item, surface);
      return;
    }
    clearPendingRenameTrigger();
    setSelectedItemKey(item.key);
    if (surface === 'list') {
      if (item.isFolder) {
        setPreviewItem(null);
        return;
      }
      handleOpenPreview(item);
      return;
    }
    if (item.isFolder) {
      handleSelectFolder(item.key);
      return;
    }
    handleOpenPreview(item);
  };

  const handleListItemDoubleClick = (item) => {
    if (!item?.isFolder) return;
    clearPendingRenameTrigger();
    handleSelectFolder(item.key);
  };

  const moveDraggedResource = (draggedItem, targetParentKey, targetIndex = null) => {
    if (!canEditCurrentVersion) {
      message.warning('当前版本不可编辑');
      return false;
    }
    if (!draggedItem?.key) return false;
    const nextData = moveResource(
      versionData,
      currentVersion.id,
      draggedItem.key,
      targetParentKey,
      targetIndex,
      versioningConfig,
    );
    if (nextData === versionData) return false;
    setVersionData(nextData);
    if (targetParentKey) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(targetParentKey);
        return next;
      });
    }
    return true;
  };

  const resolveListRowDropMode = (event, item) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const edgeThreshold = Math.min(14, rect.height * 0.24);
    const folderEdgeThreshold = Math.min(8, Math.max(5, rect.height * 0.18));
    const isFolderDropZone = item.isFolder
      && offsetY > folderEdgeThreshold
      && offsetY < rect.height - folderEdgeThreshold;
    if (isFolderDropZone) {
      return { type: 'folder' };
    }
    return { type: 'reorder', position: offsetY < rect.height / 2 ? 'before' : 'after' };
  };

  const getSiblingDropIndex = (draggedKey, targetKey, position) => {
    const siblings = currentListItems.filter((item) => item.key !== draggedKey);
    const targetIndex = siblings.findIndex((item) => item.key === targetKey);
    if (targetIndex < 0) return null;
    return position === 'before' ? targetIndex : targetIndex + 1;
  };

  const handleListRowDragOver = (event, item) => {
    if (!hasResourceDragPayload(event)) return;
    const draggedItem = getDraggedResourcePayload(event);
    if (!draggedItem?.key || draggedItem.key === item.key) return;
    event.preventDefault();
    event.stopPropagation();
    const dropMode = resolveListRowDropMode(event, item);
    setDragOverItemKey(item.key);
    if (dropMode.type === 'folder') {
      setDragOverFolderKey(item.key);
      setDragOverSurface(null);
      setDropIndicator(null);
    } else {
      setDragOverFolderKey(null);
      setDragOverSurface(null);
      setDropIndicator({ itemKey: item.key, position: dropMode.position, surface: 'list' });
    }
    event.dataTransfer.dropEffect = 'move';
  };

  const handleListRowDragLeave = (event, itemKey) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (dragOverFolderKey === itemKey) setDragOverFolderKey(null);
    if (dragOverItemKey === itemKey) setDragOverItemKey(null);
    if (dropIndicator?.itemKey === itemKey && dropIndicator?.surface === 'list') setDropIndicator(null);
  };

  const handleListRowDrop = (event, targetItem) => {
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const draggedItem = getDraggedResourcePayload(event);
    const dropMode = resolveListRowDropMode(event, targetItem);
    finishResourceDrag();
    if (!draggedItem?.key || draggedItem.key === targetItem.key) return;

    if (dropMode.type === 'folder') {
      const moved = moveDraggedResource(draggedItem, targetItem.key, null);
      if (moved) {
        message.success(`已将「${draggedItem.name}」移动到「${targetItem.name}」`);
      }
      return;
    }

    const targetIndex = getSiblingDropIndex(draggedItem.key, targetItem.key, dropMode.position);
    if (targetIndex == null) return;
    moveDraggedResource(draggedItem, currentListParentKey, targetIndex);
  };

  const handleListDragOver = (event) => {
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    if (!event.target.closest('.topic-file-row')) {
      setDragOverSurface('list');
      setDragOverFolderKey(null);
      setDragOverItemKey(null);
      setDropIndicator(null);
    }
    event.dataTransfer.dropEffect = 'move';
  };

  const handleListDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    clearDragState();
  };

  const handleListDrop = (event) => {
    if (event.target.closest('.topic-file-row')) return;
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    const draggedItem = getDraggedResourcePayload(event);
    finishResourceDrag();
    if (!draggedItem?.key) return;
    const moved = moveDraggedResource(draggedItem, currentListParentKey, null);
    if (moved) {
      message.success(`已将「${draggedItem.name}」移动到${selectedFolder ? '当前文件夹' : '根目录'}`);
    }
  };

  const resolveTreeRowDropMode = (event, item) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const edgeThreshold = Math.min(14, rect.height * 0.24);
    const folderEdgeThreshold = Math.min(8, Math.max(5, rect.height * 0.18));
    const isFolderDropZone = item.isFolder
      && offsetY > folderEdgeThreshold
      && offsetY < rect.height - folderEdgeThreshold;
    if (isFolderDropZone) {
      return { type: 'folder' };
    }
    return { type: 'reorder', position: offsetY < rect.height / 2 ? 'before' : 'after' };
  };

  const getTreeSiblingDropIndex = (draggedKey, targetItem, position) => {
    const parentKey = targetItem?.parentKey ?? null;
    const siblings = resources.filter(
      (resource) => (resource.parentKey ?? null) === parentKey && resource.key !== draggedKey,
    );
    const targetIndex = siblings.findIndex((resource) => resource.key === targetItem.key);
    if (targetIndex < 0) return null;
    return position === 'before' ? targetIndex : targetIndex + 1;
  };

  const handleTreeFolderDragOver = (event, targetItem) => {
    if (!hasResourceDragPayload(event)) return;
    const draggedItem = getDraggedResourcePayload(event);
    if (!draggedItem?.key || draggedItem.key === targetItem?.key) return;
    event.preventDefault();
    event.stopPropagation();
    const dropMode = resolveTreeRowDropMode(event, targetItem);
    setDragOverItemKey(targetItem.key);
    setDragOverSurface(null);
    if (dropMode.type === 'folder') {
      setDragOverFolderKey(targetItem.key);
      setDropIndicator(null);
    } else {
      setDragOverFolderKey(null);
      setDropIndicator({ itemKey: targetItem.key, position: dropMode.position, surface: 'tree' });
    }
    event.dataTransfer.dropEffect = 'move';
  };

  const handleTreeFolderDragLeave = (event, itemKey) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (dragOverFolderKey === itemKey) setDragOverFolderKey(null);
    if (dragOverItemKey === itemKey) setDragOverItemKey(null);
    if (dropIndicator?.itemKey === itemKey && dropIndicator?.surface === 'tree') setDropIndicator(null);
  };

  const handleTreeFolderDrop = (event, targetItem) => {
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const draggedItem = getDraggedResourcePayload(event);
    const dropMode = resolveTreeRowDropMode(event, targetItem);
    finishResourceDrag();
    if (!draggedItem?.key || draggedItem.key === targetItem.key) return;
    if (dropMode.type === 'folder') {
      const moved = moveDraggedResource(draggedItem, targetItem.key, null);
      if (moved) {
        message.success(`已将「${draggedItem.name}」移动到「${targetItem.name}」`);
      }
      return;
    }
    const targetIndex = getTreeSiblingDropIndex(draggedItem.key, targetItem, dropMode.position);
    if (targetIndex == null) return;
    moveDraggedResource(draggedItem, targetItem.parentKey ?? null, targetIndex);
  };

  const handleTreeRootDragOver = (event) => {
    if (event.target.closest('.project-item')) return;
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    setDragOverSurface('tree');
    setDragOverFolderKey(null);
    setDragOverItemKey(null);
    setDropIndicator(null);
    event.dataTransfer.dropEffect = 'move';
  };

  const handleTreeRootDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    clearDragState();
  };

  const handleTreeRootDrop = (event) => {
    if (event.target.closest('.project-item')) return;
    if (!hasResourceDragPayload(event)) return;
    event.preventDefault();
    const draggedItem = getDraggedResourcePayload(event);
    finishResourceDrag();
    if (!draggedItem?.key) return;
    const moved = moveDraggedResource(draggedItem, null, null);
    if (moved) {
      message.success(`已将「${draggedItem.name}」移动到根目录`);
    }
  };

  const createFolderAndStartRename = (parentKey = currentListParentKey, surface = 'list') => {
    if (!canEditCurrentVersion) {
      message.warning('当前版本不可编辑');
      return;
    }
    const folderKey = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newData = addResource(versionData, currentVersion.id, {
      key: folderKey,
      name: '未命名文件夹',
      isFolder: true,
      parentKey: parentKey ?? null,
    }, versioningConfig);
    setVersionData(newData);
    if (parentKey) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(parentKey);
        return next;
      });
    }
    setBgMenuPos(null);
    setContextMenuItemKey(null);
    setInlineRenameItemKey(folderKey);
    setInlineRenameName('未命名文件夹');
    setInlineRenameSurface(surface);
    message.success('文件夹已创建');
  };

  const handleItemContextMenuOpenChange = (itemKey, open) => {
    if (open) {
      clearPendingRenameTrigger();
      setBgMenuPos(null);
      setContextMenuItemKey(itemKey);
      return;
    }
    setContextMenuItemKey((prev) => (prev === itemKey ? null : prev));
  };

  const handleItemMenuAction = (item, key, surface = 'list') => {
    if (!item) return;
    if (key === 'enter' && item.isFolder) {
      handleSelectFolder(item.key);
      return;
    }
    if (key === 'preview' && !item.isFolder) {
      handleOpenPreview(item);
      return;
    }
    if (key === 'addResource' && item.isFolder) {
      openAddResourceModal(item.key);
      return;
    }
    if (key === 'newFolder' && item.isFolder) {
      createFolderAndStartRename(item.key, surface);
      return;
    }
    if (key === 'rename') {
      startInlineRename(item, surface);
      return;
    }
    if (key === 'archiveProfile' && !item.isFolder) {
      handleArchiveResourceToProfile(item);
      return;
    }
    if (key === 'delete') {
      requestDeleteResource(item);
      return;
    }
    if (key === 'tags-manage') {
      handleOpenTagPicker(item.key);
    }
  };

  const getItemMoreMenu = (item, surface = 'list') => {
    const items = [
      item.isFolder
        ? { key: 'enter', icon: <RightOutlined />, label: '进入' }
        : { key: 'preview', icon: <EyeOutlined />, label: '预览' },
      { type: 'divider' },
      ...(item.isFolder
        ? [
            { key: 'addResource', icon: <FileAddOutlined />, label: addResourceLabel, disabled: !canEditCurrentVersion },
            { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹', disabled: !canEditCurrentVersion },
            { type: 'divider' },
          ]
        : []),
      ...(tagConfig
        ? [
            { key: 'tags-manage', icon: <TagsOutlined />, label: '编辑标签', disabled: !canEditCurrentVersion },
            { type: 'divider' },
          ]
        : []),
      ...(!item.isFolder && canArchiveSceneResource
        ? [
            {
              key: 'archiveProfile',
              icon: <CheckCircleOutlined />,
              label: isSceneResourceArchived(item) ? '已归档到我的档案' : '归档到我的档案',
              disabled: isSceneResourceArchived(item),
            },
            { type: 'divider' },
          ]
        : []),
      { key: 'rename', icon: <EditOutlined />, label: '重命名', disabled: !canEditCurrentVersion },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, disabled: !canEditCurrentVersion },
    ];

    return {
      items,
      onClick: ({ key, domEvent }) => {
        domEvent?.stopPropagation();
        handleItemMenuAction(item, key, surface);
      },
    };
  };

  const handleBgContextMenu = (event, surface = 'list') => {
    const itemSelector = surface === 'tree' ? '.project-item' : '.topic-file-row, .topic-file-list-header';
    if (event.target.closest(itemSelector)) return;
    event.preventDefault();
    clearPendingRenameTrigger();
    setContextMenuItemKey(null);
    setBgMenuSurface(surface);
    setBgMenuPos({ x: event.clientX, y: event.clientY });
  };

  const handleCreateFolderAtCurrentLocation = (surface = 'list') => {
    createFolderAndStartRename(surface === 'tree' ? null : currentListParentKey, surface);
  };

  const handleAddResourceAtCurrentLocation = (surface = 'list') => {
    openAddResourceModal(surface === 'tree' ? null : currentListParentKey);
  };

  useEffect(() => {
    if (!bgMenuPos) return undefined;

    const isInsideBgMenu = (target) => target instanceof Element && !!target.closest('.ant-dropdown');

    const handlePointerDown = (event) => {
      if (isInsideBgMenu(event.target)) return;
      setBgMenuPos(null);
    };

    const handleDocumentContextMenu = (event) => {
      if (isInsideBgMenu(event.target)) return;
      setBgMenuPos(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setBgMenuPos(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('contextmenu', handleDocumentContextMenu, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('contextmenu', handleDocumentContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [bgMenuPos]);

  const bgContextMenu = {
    items: [
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹', disabled: !canEditCurrentVersion },
      { key: 'addResource', icon: <FileAddOutlined />, label: addResourceLabel, disabled: !canEditCurrentVersion },
    ],
    onClick: ({ key }) => {
      if (key === 'newFolder') handleCreateFolderAtCurrentLocation(bgMenuSurface);
      if (key === 'addResource') handleAddResourceAtCurrentLocation(bgMenuSurface);
      setBgMenuPos(null);
    },
  };

  const renderTreeItem = (item) => {
    const rowMenu = getItemMoreMenu(item, 'tree');
    const isSelected = selectedItemKey === item.key;
    const isContextOpen = contextMenuItemKey === item.key;
    const isInlineRenaming = inlineRenameItemKey === item.key && inlineRenameSurface === 'tree';
    const isDragOverFolder = dragOverFolderKey === item.key;
    const isDragging = draggingItemKey === item.key;
    const treeDropPosition = dropIndicator?.itemKey === item.key && dropIndicator?.surface === 'tree'
      ? dropIndicator.position
      : null;

    if (item.isFolder) {
      const isExpanded = expandedFolders.has(item.key);
      const children = getChildren(item.key);
      return (
        <div key={item.key} className="tree-folder-group">
          <Dropdown
            overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
            menu={rowMenu}
            trigger={['contextMenu']}
            onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
          >
            <div
              className={`project-item project-item-folder ${isSelected ? 'project-item-selected' : ''} ${isContextOpen ? 'project-item-context-open' : ''} ${isDragOverFolder ? 'project-item-dragover' : ''} ${isDragging ? 'project-item-dragging' : ''} ${treeDropPosition === 'before' ? 'project-item-drop-before' : ''} ${treeDropPosition === 'after' ? 'project-item-drop-after' : ''}`}
              draggable={!isInlineRenaming}
              onDragStart={(event) => startResourceDrag(event, item)}
              onDragEnd={finishResourceDrag}
              onDragOver={(event) => handleTreeFolderDragOver(event, item)}
              onDragLeave={(event) => handleTreeFolderDragLeave(event, item.key)}
              onDrop={(event) => handleTreeFolderDrop(event, item)}
              onClick={() => {
                if (isDraggingRef.current) return;
                handleActivateItem(item, 'tree');
              }}
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
              {isInlineRenaming ? (
                <Input
                  ref={inlineRenameInputRef}
                  className="topic-inline-input topic-tree-inline-input"
                  value={inlineRenameName}
                  onChange={(event) => setInlineRenameName(event.target.value)}
                  onPressEnter={confirmInlineRename}
                  onBlur={confirmInlineRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') cancelInlineRename();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  size="small"
                />
              ) : (
                <span className="project-item-title">{item.name}</span>
              )}
              {!isInlineRenaming ? renderResourceTagDots(item) : null}
              {!isInlineRenaming ? (
                <span className="topic-tree-item-actions" onClick={(event) => event.stopPropagation()}>
                  {canEditCurrentVersion ? (
                    <button
                      type="button"
                      className="topic-action-btn"
                      aria-label={addResourceLabel}
                      title={addResourceLabel}
                      onClick={() => openAddResourceModal(item.key)}
                    >
                      <PlusOutlined style={{ fontSize: 12 }} />
                    </button>
                  ) : null}
                  <Dropdown
                    overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
                    menu={rowMenu}
                    trigger={['click']}
                    onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                  >
                    <button
                      type="button"
                      className="topic-action-btn"
                      aria-label="更多操作"
                      title="更多操作"
                    >
                      <MoreOutlined style={{ fontSize: 14 }} />
                    </button>
                  </Dropdown>
                </span>
              ) : null}
            </div>
          </Dropdown>
          {isExpanded && (
            <div className="tree-children">
              {children.map((child) => renderTreeItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Dropdown
        key={item.key}
        overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
        menu={rowMenu}
        trigger={['contextMenu']}
        onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
      >
        <div
          className={`project-item project-item-child ${isSelected ? 'project-item-selected' : ''} ${isContextOpen ? 'project-item-context-open' : ''} ${isDragging ? 'project-item-dragging' : ''} ${treeDropPosition === 'before' ? 'project-item-drop-before' : ''} ${treeDropPosition === 'after' ? 'project-item-drop-after' : ''}`}
          draggable={!isInlineRenaming}
          onDragStart={(event) => startResourceDrag(event, item)}
          onDragEnd={finishResourceDrag}
          onDragOver={(event) => handleTreeFolderDragOver(event, item)}
          onDragLeave={(event) => handleTreeFolderDragLeave(event, item.key)}
          onDrop={(event) => handleTreeFolderDrop(event, item)}
          onClick={() => {
            if (isDraggingRef.current) return;
            handleActivateItem(item, 'tree');
          }}
        >
          <span className="project-item-icon">{getResourceIcon(item.type)}</span>
          {isInlineRenaming ? (
            <Input
              ref={inlineRenameInputRef}
              className="topic-inline-input topic-tree-inline-input"
              value={inlineRenameName}
              onChange={(event) => setInlineRenameName(event.target.value)}
              onPressEnter={confirmInlineRename}
              onBlur={confirmInlineRename}
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancelInlineRename();
              }}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              size="small"
            />
          ) : (
            <span className="project-item-title">{item.name}</span>
          )}
          {!isInlineRenaming ? renderResourceTagDots(item) : null}
          {!isInlineRenaming ? (
            <span className="topic-tree-item-actions" onClick={(event) => event.stopPropagation()}>
              <Dropdown
                overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
                menu={rowMenu}
                trigger={['click']}
                onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
              >
                <button
                  type="button"
                  className="topic-action-btn"
                  aria-label="更多操作"
                  title="更多操作"
                >
                  <MoreOutlined style={{ fontSize: 14 }} />
                </button>
              </Dropdown>
            </span>
          ) : null}
        </div>
      </Dropdown>
    );
  };

  const renderListRow = (item) => {
    const rowMenu = getItemMoreMenu(item, 'list');
    const isSelected = selectedItemKey === item.key;
    const isContextOpen = contextMenuItemKey === item.key;
    const isInlineRenaming = inlineRenameItemKey === item.key && inlineRenameSurface === 'list';
    const isDragOverFolder = dragOverFolderKey === item.key;
    const isDragging = draggingItemKey === item.key;
    const dropPosition = dropIndicator?.itemKey === item.key && dropIndicator?.surface === 'list'
      ? dropIndicator.position
      : null;

    return (
      <Dropdown
        key={item.key}
        overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
        menu={rowMenu}
        trigger={['contextMenu']}
        onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
      >
        <div
          className={`topic-file-row ${isSelected ? 'topic-file-row-selected' : ''} ${isContextOpen ? 'topic-file-row-context-open' : ''} ${isDragOverFolder ? 'topic-file-row-dragover' : ''} ${isDragging ? 'topic-file-row-dragging' : ''} ${dropPosition === 'before' ? 'topic-file-row-drop-before' : ''} ${dropPosition === 'after' ? 'topic-file-row-drop-after' : ''}`}
          draggable={!isInlineRenaming}
          onDragStart={(event) => startResourceDrag(event, item)}
          onDragEnd={finishResourceDrag}
          onDragOver={(event) => handleListRowDragOver(event, item)}
          onDragLeave={(event) => handleListRowDragLeave(event, item.key)}
          onDrop={(event) => handleListRowDrop(event, item)}
          onClick={() => {
            if (isDraggingRef.current) return;
            handleActivateItem(item, 'list');
          }}
          onDoubleClick={() => {
            if (isDraggingRef.current) return;
            handleListItemDoubleClick(item);
          }}
        >
          <div className="topic-file-col topic-file-col-name">
            <span className="topic-file-icon">
              {item.isFolder
                ? <FolderFilled style={{ color: '#56a8f5' }} />
                : getResourceIcon(item.type)}
            </span>
            {isInlineRenaming ? (
              <Input
                ref={inlineRenameInputRef}
                className="topic-inline-input topic-file-inline-input"
                value={inlineRenameName}
                onChange={(event) => setInlineRenameName(event.target.value)}
                onPressEnter={confirmInlineRename}
                onBlur={confirmInlineRename}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') cancelInlineRename();
                }}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                size="small"
              />
            ) : (
              <span className={`topic-file-name ${item.isFolder ? 'topic-file-name-folder' : ''}`}>{item.name}</span>
            )}
            {!isInlineRenaming ? (
              <span className="topic-file-row-actions" onClick={(event) => event.stopPropagation()}>
                {item.isFolder && canEditCurrentVersion ? (
                  <button
                    type="button"
                    className="topic-action-btn"
                    aria-label={addResourceLabel}
                    title={addResourceLabel}
                    onClick={() => openAddResourceModal(item.key)}
                  >
                    <PlusOutlined style={{ fontSize: 12 }} />
                  </button>
                ) : null}
                <Dropdown
                  overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
                  menu={rowMenu}
                  trigger={['click']}
                  onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                >
                  <button
                    type="button"
                    className="topic-action-btn"
                    aria-label="更多操作"
                    title="更多操作"
                  >
                    <MoreOutlined style={{ fontSize: 14 }} />
                  </button>
                </Dropdown>
              </span>
            ) : null}
          </div>
          {tagConfig ? (
            <div className="topic-file-col topic-file-col-tags">
              {renderResourceTagText(item) || <span className="topic-tags-empty">-</span>}
            </div>
          ) : null}
          <div className="topic-file-col topic-file-col-owner">{item.owner || '--'}</div>
          <div className="topic-file-col topic-file-col-edit">{item.lastEdit || '--'}</div>
        </div>
      </Dropdown>
    );
  };

  const renderPreviewContent = (item) => {
    const fileType = getTopicResourceFileType(item);
    const previewSummary = getPreviewSummary(item, fileType);
    const outlineEntries = getPreviewOutlineEntries(item);

    if (fileType === 'image') {
      return item.url ? (
        <img src={item.url} alt={item.name} className="topic-preview-image" />
      ) : (
        <div className="topic-preview-placeholder">
          {renderFileIcon('image', { fontSize: 88 })}
          <div className="topic-preview-video-title">{item.name}</div>
          {previewSummary ? <div className="topic-preview-subtle">{previewSummary}</div> : null}
        </div>
      );
    }

    if (fileType === 'pdf') {
      return item.url
        ? <iframe src={item.url} className="topic-preview-iframe" title="PDF 预览" />
        : renderDocumentPreview(item, fileType);
    }

    if (fileType === 'video') {
      return item.url ? (
        <video src={item.url} controls className="topic-preview-video" />
      ) : (
        <div className="topic-preview-video-card">
          {renderFileIcon('video', { fontSize: 84 })}
          <div className="topic-preview-video-title">{item.name}</div>
          {previewSummary ? <div className="topic-preview-subtle">{previewSummary}</div> : null}
        </div>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="topic-preview-audio-card">
          <SoundOutlined className="topic-preview-audio-icon" />
          <div className="topic-preview-video-title">{item.name}</div>
          <div className="topic-preview-audio-wave">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ height: `${18 + ((index * 7) % 26)}px` }} />
            ))}
          </div>
          {item.url ? <audio src={item.url} controls className="topic-preview-audio-player" /> : null}
          {previewSummary ? <div className="topic-preview-subtle">{previewSummary}</div> : null}
        </div>
      );
    }

    if (fileType === 'pptx') {
      return (
        <div className="topic-preview-slide-deck">
          {(outlineEntries.length > 0 ? outlineEntries.slice(0, 3) : [item.name, '核心要点', '执行建议']).map((entry, index) => (
            <div key={`${entry}-${index}`} className="topic-preview-slide">
              <div className="topic-preview-slide-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="topic-preview-slide-title">{entry}</div>
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
            <span>标签</span>
            <span>{getResourceTags(item).map((tag) => tag.name).join('、') || '--'}</span>
            <span>已绑定到该资料的标签</span>
          </div>
          <div className="topic-preview-grid-row">
            <span>更新时间</span>
            <span>{item.lastEdit || '--'}</span>
            <span>最新内容更新时间</span>
          </div>
          <div className="topic-preview-grid-row">
            <span>摘要</span>
            <span>{previewSummary || '--'}</span>
            <span>右侧主区域直接显示的内容说明</span>
          </div>
        </div>
      );
    }

    if (fileType === 'note' && item.url) {
      return <iframe src={item.url} className="topic-preview-iframe" title={item.name} />;
    }

    return renderDocumentPreview(item, fileType);
  };

  return (
    <div className="topic-detail" style={detailThemeStyle}>
      <div className="detail-header">
        <div className="detail-header-left">
          <HomeOutlined className="detail-home-icon" onClick={onBack} />
          <span className="detail-title" title={sceneDescription || topicTitle}>{topicTitle}</span>
          {sceneConfig ? (
            <Tag
              style={{
                marginLeft: 10,
                borderRadius: 999,
                padding: '0 10px',
                color: sceneTheme?.accentColor || '#1677ff',
                borderColor: hexToRgba(sceneTheme?.accentColor || '#1677ff', 0.24),
                background: hexToRgba(sceneTheme?.accentColor || '#1677ff', 0.12),
              }}
            >
              {sceneTheme?.badgeText || sceneTypeLabel || '场景模板'}
            </Tag>
          ) : null}
          {topicAdminConfig ? (
            <Tag color="blue" style={{ marginLeft: 10, borderRadius: 999, padding: '0 10px' }}>
              研习社频道后台
            </Tag>
          ) : null}
        </div>
        <div className="detail-header-center">
          <div className="detail-tabs" ref={detailTabsRef}>
            <div
              className={`detail-tabs-liquid-indicator ${tabIndicatorStyle.opacity ? 'is-visible' : ''}`}
              style={{
                width: `${tabIndicatorStyle.width}px`,
                height: `${tabIndicatorStyle.height}px`,
                transform: `translate3d(${tabIndicatorStyle.x}px, ${tabIndicatorStyle.y}px, 0)`,
                opacity: tabIndicatorStyle.opacity,
              }}
            />
            {tabs.map((tab) => (
              <div
                key={tab.key}
                ref={(node) => setDetailTabRef(tab.key, node)}
                className={`detail-tab ${activeTab === tab.key ? 'detail-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>
        <div className="detail-header-right">
          {versioningEnabled ? (
            <Dropdown
              overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
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
                    const canDelete = version.status !== 'active'
                      && (version.status !== 'published' || versioningConfig.allowDeletePublished);
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
                          {canDelete ? (
                            <DeleteOutlined
                              style={{ color: '#ff4d4f', fontSize: 12, marginLeft: 8 }}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteVersion(version.id);
                              }}
                            />
                          ) : null}
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
                  ...(currentVersion?.status === 'published' && versioningConfig.allowRollback
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
          ) : null}
          <UserOutlined className="header-icon" />
          <CommentOutlined className="header-icon" />
        </div>
      </div>

      {bgMenuPos ? (
        <Dropdown
          overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
          menu={bgContextMenu}
          open
          onOpenChange={(open) => {
            if (!open) setBgMenuPos(null);
          }}
          trigger={[]}
        >
          <span style={{ position: 'fixed', left: bgMenuPos.x, top: bgMenuPos.y, width: 1, height: 1 }} />
        </Dropdown>
      ) : null}

      {activeTab === 'assessment' ? (
        <AssessmentConfig
          assessment={currentVersion?.assessment}
          assessmentChat={currentVersion?.assessmentChat}
          resources={resources}
          isDraft={canEditCurrentVersion}
          onUpdateAssessment={handleUpdateAssessment}
          onUpdateChat={handleUpdateAssessmentChat}
          onOpenAddModal={() => openAddResourceModal(null)}
          onCreateFolder={(name) => {
            const newData = addResource(versionData, currentVersion.id, {
              name,
              isFolder: true,
              parentKey: null,
            }, versioningConfig);
            setVersionData(newData);
          }}
        />
      ) : (
        <div className="detail-body" ref={detailBodyRef}>
          <div className="detail-left-panel" style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}>
            <div className="panel-header">
              <span className="panel-title">{resourcePanelTitle}</span>
              <MoreOutlined className="panel-more-icon" />
            </div>

            <div className="ai-qa-box">
              <MessageOutlined style={{ color: '#999', fontSize: 14 }} />
              <span className="ai-qa-text">AI 问答</span>
            </div>

            <div className="panel-actions">
              <div
                className={`panel-action-btn ${!canEditCurrentVersion ? 'panel-action-btn-disabled' : ''}`}
                onClick={() => canEditCurrentVersion && openAddResourceModal(currentListParentKey)}
              >
                <PlusOutlined style={{ fontSize: 12 }} />
                <span>{addResourceLabel}</span>
              </div>
              <div className="panel-action-btn">
                <AppstoreOutlined style={{ fontSize: 12 }} />
                <span>{appLabel}</span>
              </div>
            </div>

            <div
              className={`project-section ${dragOverSurface === 'tree' ? 'project-section-dragover' : ''}`}
              onContextMenu={(event) => handleBgContextMenu(event, 'tree')}
              onDragOver={handleTreeRootDragOver}
              onDragLeave={handleTreeRootDragLeave}
              onDrop={handleTreeRootDrop}
            >
              <div className="project-header">
                <span className="project-title">项目</span>
                <Dropdown
                  overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
                  menu={{
                    items: [
                      {
                        key: 'add-resource',
                        icon: <FileAddOutlined />,
                        label: addResourceLabel,
                        onClick: () => openAddResourceModal(null),
                        disabled: !canEditCurrentVersion,
                      },
                      {
                        key: 'new-folder',
                        icon: <FolderAddOutlined />,
                        label: '新建文件夹',
                        onClick: () => createFolderAndStartRename(null, 'tree'),
                        disabled: !canEditCurrentVersion,
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <MoreOutlined className="project-more-icon" />
                </Dropdown>
              </div>

              <div className="project-list">
                {rootItems.length === 0 ? (
                  <div className="project-empty">暂无{resourcePanelTitle}</div>
                ) : (
                  rootItems.map((item) => renderTreeItem(item))
                )}
              </div>
            </div>
          </div>

          <div className="topic-sidebar-resize-handle" onMouseDown={handleSidebarResizeStart} />

          <div className="detail-right-panel">
            {previewItem ? (
              <div className="topic-preview-main">
                <div className="topic-preview-main-head">
                    <div className="topic-preview-main-head-left">
                      <span className="topic-preview-main-icon">
                        {renderFileIcon(getTopicResourceFileType(previewItem), { fontSize: 18 })}
                      </span>
                      <div className="topic-preview-main-copy">
                        <div className="topic-preview-main-breadcrumb">
                          {previewParentFolder ? previewParentFolder.name : currentVersion?.name || resourcePanelTitle}
                        </div>
                        <div className="topic-preview-main-title">{previewItem.name}</div>
                      <div className="topic-preview-main-meta">
                        <span>{getResourceTypeLabel(previewItem, getTopicResourceFileType(previewItem))}</span>
                        <span>{previewItem.owner || '--'}</span>
                        <span>{previewItem.lastEdit || '--'}</span>
                        {previewItemArchived ? <Tag color="success">已归档到我的档案</Tag> : null}
                      </div>
                      {tagConfig ? (
                        <div className="topic-preview-main-tags">
                          {renderPreviewTagTokens(previewItem)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="topic-preview-main-head-actions">
                    {canArchiveSceneResource ? (
                      <Button
                        size="small"
                        type={previewItemArchived ? 'default' : 'primary'}
                        ghost={!previewItemArchived}
                        disabled={previewItemArchived}
                        onClick={() => handleArchiveResourceToProfile(previewItem)}
                      >
                        {previewItemArchived ? '已归档到我的档案' : '归档到我的档案'}
                      </Button>
                    ) : null}
                    {previewParentFolder ? (
                      <Button size="small" onClick={() => setPreviewItem(null)}>
                        返回文件夹
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="topic-preview-main-content">
                  <div className="topic-preview-body topic-preview-body-main">
                    {renderPreviewContent(previewItem)}
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                                {canEditCurrentVersion ? (
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
                        <Button icon={<PlusOutlined />} disabled={!canEditCurrentVersion} onClick={() => openAddResourceModal(currentListParentKey)}>{addResourceLabel}</Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="folder-info">
                      <div className="folder-info-left">
                        <div className="folder-big-icon"><FolderFilled /></div>
                        <div className="folder-meta">
                          <div className="folder-name">{currentVersion?.name || resourcePanelTitle}</div>
                          <div className="folder-desc">{fileCount} 个文件 {folderCount} 个文件夹</div>
                        </div>
                      </div>
                      <Button className="add-resource-btn" icon={<PlusOutlined />} disabled={!canEditCurrentVersion} onClick={() => openAddResourceModal(null)}>
                        {addResourceLabel}
                      </Button>
                    </div>
                  </>
                )}

                <div className="topic-right-content">
                  <div className="topic-file-list-wrap">
                    <div
                      className={`topic-file-list ${tagConfig ? 'topic-file-list-with-tags' : 'topic-file-list-no-tags'} ${dragOverSurface === 'list' ? 'topic-file-list-dragover' : ''}`}
                      onContextMenu={(event) => handleBgContextMenu(event, 'list')}
                      onDragOver={handleListDragOver}
                      onDragLeave={handleListDragLeave}
                      onDrop={handleListDrop}
                    >
                      <div className="topic-file-list-header">
                        <div className="topic-file-col topic-file-col-name">名称</div>
                        {tagConfig ? <div className="topic-file-col topic-file-col-tags">标签</div> : null}
                        <div className="topic-file-col topic-file-col-owner">所有者</div>
                        <div className="topic-file-col topic-file-col-edit">最近编辑</div>
                      </div>
                      {currentListItems.length === 0 ? (
                        <div className="topic-file-empty">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={selectedFolder ? `此${resourcePanelTitle}目录为空，可继续添加内容` : emptyStateText}
                          />
                        </div>
                      ) : (
                        currentListItems.map((item) => renderListRow(item))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AddResourceModal
        open={modalOpen}
        onClose={closeAddResourceModal}
        onAdd={handleAddResource}
      />

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
