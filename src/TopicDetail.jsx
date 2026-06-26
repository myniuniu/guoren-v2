import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  ColorPicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  Segmented,
  Switch,
  Tag,
  message,
} from 'antd';
import {
  BranchesOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  LeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FullscreenOutlined,
  AppstoreOutlined,
  FolderFilled,
  FolderAddOutlined,
  FolderOpenFilled,
  FolderOutlined,
  GlobalOutlined,
  HomeOutlined,
  MessageOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SendOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
  NodeIndexOutlined,
  DatabaseOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import AddResourceModal from './AddResourceModal';
import AssessmentConfig from './AssessmentConfig';
import SpaceResourceImportModal from './resourceLib/SpaceResourceImportModal.jsx';
import ResourceLibraryTagPicker from './resourceLib/ResourceLibraryTagPicker.jsx';
import { getAllItemsAcrossLibraries, inferFileType, loadResourceLib } from './resourceLib/resourceLibStore';
import { buildTopicResourcesFromLibrarySelection } from './resourceLib/topicResourceImport.js';
import { renderFileIcon } from './resourceLib/resourceIcons.jsx';
import { getSceneThemeCoverPalette } from './scene/themeCovers';
import {
  addResource,
  addResources,
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
  updateVersionKnowledgeGraphRef,
  updateResourceArchiveProfile,
  updateResource,
  updateVersionTagLibrary,
} from './versionStore';
import { buildSceneInitialVersionData, normalizeVersioningConfig } from './scene/api';
import { buildSceneResourceArchiveMeta, isSceneResourceArchived } from './shared/sceneGrowthRecords';
import { getTopicAdminConfig } from './studyClub/adminTopicMapping';
import {
  getGraphById,
  getGraphLayout,
  getPointsByGraph,
  getRelationsByGraph,
  KNOWLEDGE_POINT_TYPE_OPTIONS,
  RELATION_TYPE_OPTIONS,
  getKnowledgeGraphStoreEventName,
  loadKnowledgeGraphStore,
} from './knowledgeGraph/store';
import KnowledgeGraphModule from './knowledgeGraph/KnowledgeGraphModule';
import StructuredKnowledgeGraphView from './knowledgeGraph/StructuredKnowledgeGraphView';
import './TopicDetail.css';

const EMPTY_TAB_INDICATOR = { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
const TOPIC_DROPDOWN_OVERLAY_CLASS = 'finder-liquid-glass-menu';
const KNOWLEDGE_GRAPH_POINT_TYPE_LABEL_MAP = Object.fromEntries(
  KNOWLEDGE_POINT_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);
const KNOWLEDGE_GRAPH_RELATION_TYPE_LABEL_MAP = Object.fromEntries(
  RELATION_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

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
  if (resource.fileType && resource.fileType !== 'other') return resource.fileType;
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
  if (resource.fileType === 'knowledgeGraph' || fileType === 'knowledgeGraph') return '知识图谱';
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

function formatTopicGraphDateTime(value) {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(/\//g, '-');
}

function getDefaultLeftPanelWidth() {
  if (typeof window === 'undefined') return 360;
  if (window.innerWidth <= 1120) return 308;
  if (window.innerWidth <= 1360) return 332;
  return 360;
}

function getAiKnowledgeGraphLeftPanelWidth(containerWidth) {
  const fallbackWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const width = containerWidth || fallbackWidth;
  const minLeftWidth = 280;
  const minRightWidth = 320;
  const maxWidth = Math.max(minLeftWidth, width - minRightWidth);
  const targetWidth = Math.round(width * 0.6);
  return Math.max(minLeftWidth, Math.min(maxWidth, targetWidth));
}

function getBoundedDefaultLeftPanelWidth(containerWidth) {
  const fallbackWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const width = containerWidth || fallbackWidth;
  const minLeftWidth = 280;
  const minRightWidth = 320;
  const maxWidth = Math.max(minLeftWidth, width - minRightWidth);
  return Math.max(minLeftWidth, Math.min(maxWidth, getDefaultLeftPanelWidth()));
}

function getTopicPanelViewStorageKey(scopeKey = 'default') {
  return `gr:topic-panel-view:${scopeKey}`;
}

function loadTopicPanelView(scopeKey = 'default') {
  if (typeof window === 'undefined') return 'resources';
  try {
    return window.localStorage.getItem(getTopicPanelViewStorageKey(scopeKey)) === 'knowledgeGraph'
      ? 'knowledgeGraph'
      : 'resources';
  } catch {
    return 'resources';
  }
}

function persistTopicPanelView(scopeKey = 'default', view = 'resources') {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getTopicPanelViewStorageKey(scopeKey),
      view === 'knowledgeGraph' ? 'knowledgeGraph' : 'resources',
    );
  } catch {
    // ignore persistence failure
  }
}

function buildTopicBindingPreviewResource(binding, liveResource, pointTitle, stageName) {
  const resourceName = liveResource?.name || binding?.resourceName || '未命名资料';
  return {
    key: liveResource?.key || binding?.resourceKey || binding?.bindingId || resourceName,
    name: resourceName,
    isFolder: false,
    type: liveResource?.type || (binding?.fileType === 'video' ? 'video' : 'file'),
    fileType: liveResource?.fileType || binding?.fileType || inferFileType(resourceName),
    url: liveResource?.url || liveResource?.dataUrl || binding?.snapshotUrl || '',
    owner: liveResource?.owner || binding?.libraryName || '--',
    lastEdit: liveResource?.lastEdit || binding?.createdAt || '--',
    meta: {
      ...(liveResource?.meta || {}),
      summary: liveResource?.meta?.summary || `该资料绑定于知识点「${pointTitle}」。`,
      paragraphs: Array.isArray(liveResource?.meta?.paragraphs) && liveResource.meta.paragraphs.length
        ? liveResource.meta.paragraphs
        : [
            `资料来源于知识图谱中的知识点「${pointTitle}」，所属分区「${stageName}」。`,
            binding?.libraryName ? `当前资料库：${binding.libraryName}。` : '该资料来自外部资料库绑定快照。',
            binding?.snapshotPath ? `资料路径：${binding.snapshotPath}` : '可在资料库中维护该资料内容。',
          ],
    },
  };
}

function buildKnowledgeGraphMirrorResources(stages, stagePointEntries, resourceLibraryItemMap) {
  const nextResources = [];
  stages.forEach((stage) => {
    const stageKey = `kg_stage_${stage.id}`;
    nextResources.push({
      key: stageKey,
      name: stage.name,
      isFolder: true,
      parentKey: null,
      owner: '知识图谱',
      lastEdit: '--',
      meta: {
        summary: stage.description || '知识图谱分区目录',
      },
      __kgMirror: true,
      __kgEntityType: 'stage',
      __kgStageId: stage.id,
    });

    const entries = stagePointEntries[stage.id] || [];
    entries.forEach(({ point }) => {
      const pointKey = `kg_point_${point.id}`;
      nextResources.push({
        key: pointKey,
        name: point.title,
        isFolder: true,
        parentKey: stageKey,
        owner: '知识图谱',
        lastEdit: point.updatedAt || '--',
        meta: {
          summary: point.summary || '知识点绑定资料目录',
        },
        __kgMirror: true,
        __kgEntityType: 'point',
        __kgStageId: stage.id,
        __kgPointId: point.id,
      });

      (point.resourceBindings || []).forEach((binding) => {
        const liveResource = resourceLibraryItemMap.get(`${binding.libraryId}:${binding.resourceKey}`) || null;
        const previewResource = buildTopicBindingPreviewResource(binding, liveResource, point.title, stage.name);
        nextResources.push({
          ...previewResource,
          key: `kg_binding_${binding.bindingId}`,
          parentKey: pointKey,
          owner: liveResource?.owner || binding.libraryName || '--',
          lastEdit: liveResource?.lastEdit || binding.createdAt || '--',
          __kgMirror: true,
          __kgEntityType: 'binding',
          __kgStageId: stage.id,
          __kgPointId: point.id,
          __kgBindingId: binding.bindingId,
        });
      });
    });
  });
  return nextResources;
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
  onOpenKnowledgeGraph = null,
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
  const [resourcePanelView, setResourcePanelView] = useState(() => loadTopicPanelView(topicStorageScopeKey));
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [addResourceParentKey, setAddResourceParentKey] = useState(undefined);
  const [resourceImportOpen, setResourceImportOpen] = useState(false);
  const [resourceImportParentKey, setResourceImportParentKey] = useState(null);
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
  const [knowledgeGraphStoreSnapshot, setKnowledgeGraphStoreSnapshot] = useState(() => loadKnowledgeGraphStore());
  const [resourceLibraryData, setResourceLibraryData] = useState(() => loadResourceLib());
  const [knowledgeGraphPickerOpen, setKnowledgeGraphPickerOpen] = useState(false);
  const [knowledgeGraphPickerMode, setKnowledgeGraphPickerMode] = useState('bind');
  const [knowledgeGraphPickerScope, setKnowledgeGraphPickerScope] = useState('all');
  const [knowledgeGraphPickerKeyword, setKnowledgeGraphPickerKeyword] = useState('');
  const [selectedKnowledgeGraphResourceKey, setSelectedKnowledgeGraphResourceKey] = useState(null);
  const [knowledgeGraphSelection, setKnowledgeGraphSelection] = useState({ type: 'graph', id: null });
  const [knowledgeGraphExpandedStageIds, setKnowledgeGraphExpandedStageIds] = useState(new Set());
  const [selectedKnowledgeGraphBindingId, setSelectedKnowledgeGraphBindingId] = useState(null);
  const [knowledgeGraphPreviewMode, setKnowledgeGraphPreviewMode] = useState('preview');
  const [knowledgeGraphDrawerOpen, setKnowledgeGraphDrawerOpen] = useState(false);
  const [aiKnowledgeGraphPreviewOpen, setAiKnowledgeGraphPreviewOpen] = useState(false);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState(EMPTY_TAB_INDICATOR);
  const [aiActivePanel, setAiActivePanel] = useState('course');
  const [aiSelectedSkill, setAiSelectedSkill] = useState(null);
  const [aiSelectedStructure, setAiSelectedStructure] = useState('ubd');
  const [aiStructureTouched, setAiStructureTouched] = useState(false);
  const [aiSelectedOutline, setAiSelectedOutline] = useState(null);
  const [aiSelectedToolGroup, setAiSelectedToolGroup] = useState('aigc');
  const [aiSelectedTools, setAiSelectedTools] = useState([]);
  const [aiInternetSearchEnabled, setAiInternetSearchEnabled] = useState(true);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const [aiLibraryCollapsed, setAiLibraryCollapsed] = useState(false);
  const [aiFloatingPanelOffset, setAiFloatingPanelOffset] = useState(0);
  const detailBodyRef = useRef(null);
  const detailTabsRef = useRef(null);
  const detailTabRefs = useRef(new Map());
  const knowledgeGraphBindingItemRefs = useRef(new Map());
  const inlineRenameInputRef = useRef(null);
  const pendingRenameTimerRef = useRef(null);
  const tagPickerScrollTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragPayloadRef = useRef(null);
  const aiComposerRef = useRef(null);
  const aiPromptInputRef = useRef(null);
  const aiComposerToolbarRef = useRef(null);
  const aiFloatingPanelRef = useRef(null);
  const aiToolbarAnchorRefs = useRef(new Map());
  const knowledgeGraphCanvasAreaRef = useRef(null);
  const knowledgeGraphPanelRef = useRef(null);
  const knowledgeGraphDrawerRef = useRef(null);

  useEffect(() => {
    setVersionData(loadTopicVersionData(topicAdminConfig, sceneConfig, topicStorageScopeKey));
    setActiveTab('knowledge');
    setModalOpen(false);
    setPreviewItem(null);
    setLeftPanelWidth(getDefaultLeftPanelWidth());
    setAiKnowledgeGraphPreviewOpen(false);
    setExpandedFolders(new Set());
    setSelectedFolderKey(null);
    setSelectedItemKey(null);
    setAddResourceParentKey(undefined);
    setResourceImportOpen(false);
    setResourceImportParentKey(null);
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
    setKnowledgeGraphDrawerOpen(false);
    setTabIndicatorStyle(EMPTY_TAB_INDICATOR);
    setAiActivePanel('course');
    setAiSelectedSkill(null);
    setAiSelectedStructure('ubd');
    setAiStructureTouched(false);
    setAiSelectedOutline(null);
    setAiSelectedToolGroup('aigc');
    setAiSelectedTools([]);
    setAiInternetSearchEnabled(true);
    setAiPromptValue('');
    setAiLibraryCollapsed(false);
  }, [sceneConfig, topicAdminConfig, topicStorageScopeKey, topicTitle]);

  const currentVersion = getCurrentVersion(versionData);
  const versions = getVersions(versionData);
  const isDraft = currentVersion?.status === 'draft';
  const isActive = currentVersion?.status === 'active';
  const versioningConfig = useMemo(
    () => normalizeVersioningConfig(sceneConfig?.versioning, sceneType || sceneConfig?.sceneType || 'CUSTOM'),
    [sceneConfig, sceneType],
  );
  const versioningEnabled = versioningConfig.enabled !== false;
  const canEditCurrentVersion = isVersionEditable(currentVersion, versioningConfig);
  const sourceResources = currentVersion?.resources || [];
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
  const enabledAddResourceEntries = Array.isArray(sceneConfig?.toolAreas?.resourceAreaTools) && sceneConfig.toolAreas.resourceAreaTools.length
    ? sceneConfig.toolAreas.resourceAreaTools
    : undefined;
  const useSceneTopicTheme = (sceneTheme?.topicThemeMode || 'DEFAULT') === 'SCENE';
  const sceneThemePalette = useMemo(
    () => getSceneThemeCoverPalette(sceneTheme || {}),
    [sceneTheme],
  );
  const detailThemeStyle = sceneTheme
    && useSceneTopicTheme
    ? {
        '--td-accent': sceneTheme.accentColor || '#56a8f5',
        '--td-accent-soft': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.14),
        '--td-accent-strong': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.24),
        '--td-accent-glow': hexToRgba(sceneTheme.accentColor || '#56a8f5', 0.36),
        '--td-panel-bg': `linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 58%, rgba(250, 251, 252, 0.9) 100%), linear-gradient(135deg, ${hexToRgba(sceneThemePalette.coverStart, 0.18)} 0%, ${hexToRgba(sceneThemePalette.coverEnd, 0.14)} 100%)`,
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

  const activeSceneType = sceneType || sceneConfig?.sceneType || null;
  const canArchiveSceneResource = !!sceneConfig && !!activeSceneType;
  const previewItemArchived = previewItem ? isSceneResourceArchived(previewItem) : false;
  const knowledgeGraphRef = currentVersion?.knowledgeGraphRef || null;
  const knowledgeGraphGraph = useMemo(
    () => (knowledgeGraphRef?.knowledgeGraphId ? getGraphById(knowledgeGraphStoreSnapshot, knowledgeGraphRef.knowledgeGraphId) : null),
    [knowledgeGraphRef?.knowledgeGraphId, knowledgeGraphStoreSnapshot],
  );
  const knowledgeGraphLayout = useMemo(
    () => (knowledgeGraphGraph ? getGraphLayout(knowledgeGraphStoreSnapshot, knowledgeGraphGraph.id) : {}),
    [knowledgeGraphGraph, knowledgeGraphStoreSnapshot],
  );
  const knowledgeGraphPoints = useMemo(
    () => (knowledgeGraphGraph ? getPointsByGraph(knowledgeGraphStoreSnapshot, knowledgeGraphGraph.id) : []),
    [knowledgeGraphGraph, knowledgeGraphStoreSnapshot],
  );
  const knowledgeGraphRelations = useMemo(
    () => (knowledgeGraphGraph ? getRelationsByGraph(knowledgeGraphStoreSnapshot, knowledgeGraphGraph.id) : []),
    [knowledgeGraphGraph, knowledgeGraphStoreSnapshot],
  );
  const knowledgeGraphStructuredView = knowledgeGraphLayout?.structuredView || {};
  const knowledgeGraphStages = useMemo(
    () => [...(knowledgeGraphStructuredView.stages || [])].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0)),
    [knowledgeGraphStructuredView.stages],
  );
  const knowledgeGraphPointPlacements = knowledgeGraphStructuredView.pointPlacements || {};
  const knowledgeGraphStagePointEntries = useMemo(() => {
    const grouped = {};
    knowledgeGraphStages.forEach((stage) => {
      grouped[stage.id] = [];
    });
    knowledgeGraphPoints.forEach((point) => {
      const placement = knowledgeGraphPointPlacements[point.id];
      if (!placement?.stageId) return;
      if (!grouped[placement.stageId]) grouped[placement.stageId] = [];
      grouped[placement.stageId].push({ point, placement });
    });
    Object.keys(grouped).forEach((stageId) => {
      grouped[stageId].sort((left, right) => (left.placement.order || 0) - (right.placement.order || 0));
    });
    return grouped;
  }, [knowledgeGraphPointPlacements, knowledgeGraphPoints, knowledgeGraphStages]);
  const knowledgeGraphPointMap = useMemo(
    () => new Map(knowledgeGraphPoints.map((point) => [point.id, point])),
    [knowledgeGraphPoints],
  );
  const knowledgeGraphStageMap = useMemo(
    () => new Map(knowledgeGraphStages.map((stage) => [stage.id, stage])),
    [knowledgeGraphStages],
  );
  const allLibraryItems = useMemo(
    () => getAllItemsAcrossLibraries(resourceLibraryData),
    [resourceLibraryData],
  );
  const resourceLibraryItemMap = useMemo(
    () => new Map(allLibraryItems.map((item) => [`${item.libraryId}:${item.key}`, item])),
    [allLibraryItems],
  );
  const knowledgeGraphBindingCount = useMemo(
    () => knowledgeGraphPoints.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0),
    [knowledgeGraphPoints],
  );
  const knowledgeGraphBindingLocationMap = useMemo(() => {
    const map = new Map();
    Object.entries(knowledgeGraphStagePointEntries).forEach(([stageId, entries]) => {
      entries.forEach(({ point }) => {
        (point.resourceBindings || []).forEach((binding) => {
          if (binding?.bindingId) {
            map.set(binding.bindingId, { stageId, pointId: point.id });
          }
        });
      });
    });
    return map;
  }, [knowledgeGraphStagePointEntries]);
  const knowledgeGraphStageEdgeMap = useMemo(
    () => new Map((knowledgeGraphStructuredView.stageEdges || []).map((edge) => [edge.id, edge])),
    [knowledgeGraphStructuredView.stageEdges],
  );
  const knowledgeGraphPickerItems = useMemo(() => {
    const keyword = knowledgeGraphPickerKeyword.trim().toLowerCase();
    return allLibraryItems.filter((item) => {
      if (item.fileType !== 'knowledgeGraph' || !item.knowledgeGraphId) return false;
      if (knowledgeGraphPickerScope !== 'all' && item.libraryScope !== knowledgeGraphPickerScope) return false;
      if (!keyword) return true;
      const haystack = `${item.name} ${item.libraryName} ${item.knowledgeGraphId}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [allLibraryItems, knowledgeGraphPickerKeyword, knowledgeGraphPickerScope]);
  const knowledgeGraphMirrorResources = useMemo(
    () => buildKnowledgeGraphMirrorResources(knowledgeGraphStages, knowledgeGraphStagePointEntries, resourceLibraryItemMap),
    [knowledgeGraphStagePointEntries, knowledgeGraphStages, resourceLibraryItemMap],
  );
  const resources = knowledgeGraphGraph ? knowledgeGraphMirrorResources : sourceResources;
  const canEditDisplayedResources = canEditCurrentVersion && !knowledgeGraphGraph;
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
  const aiStructureOptions = [
    { key: 'five-step', label: '五步教学法', description: '导入-讲授-练习-小结-作业', icon: <BranchesOutlined /> },
    { key: '5e', label: '5E教学法', description: '参与-探索-解释-拓展-评价', icon: <SwapOutlined /> },
    { key: 'pbl', label: 'PBL教学法', description: '项目驱动，解决真实问题', icon: <AppstoreOutlined /> },
    { key: 'flip', label: '翻转课堂', description: '课前自学-课堂互动深化', icon: <EditOutlined /> },
    { key: 'ubd', label: 'UbD逆向设计', description: '从目标出发逆向规划教学', icon: <CheckCircleOutlined /> },
    { key: 'custom', label: '自定义结构', description: '自由定义课程结构', icon: <NodeIndexOutlined /> },
  ];
  const aiOutlineOptions = [
    '《北京市中小学人工智能教育地方课程纲要》',
    '《上海市中小学人工智能课程指南》',
    '《广东省中小学人工智能课程指导纲要》',
    '《杭州市中小学人工智能教育地方课程纲要》',
    '《内蒙古自治区中小学人工智能课程纲要》',
    '《福州市中小学人工智能通识教育课程纲要与实施指南》',
  ];
  const aiToolGroups = [
    { key: 'aigc', label: 'AIGC创作工坊', items: ['AI写作', 'AI绘画', 'AI视频', 'AI建模', 'AI音乐', 'AI编程'] },
    { key: 'experience', label: 'AI体验馆', items: ['图像识别', '语音交互', '智能推荐', '机器翻译'] },
    { key: 'training', label: 'AI训练馆', items: ['数据标注', '模型训练', '推理部署', '效果评测'] },
  ];
  const aiGenerationSkills = [
    { key: 'course', label: '课程生成', description: '生成课程蓝图、目标、活动与课时安排。' },
    { key: 'courseware', label: '课件生成', description: '生成适合授课展示的课件内容与页面结构。' },
    { key: 'teaching-plan', label: '教案生成', description: '生成课堂流程、提问策略与教学组织建议。' },
    { key: 'interactive-courseware', label: '互动课件生成', description: '生成包含互动环节与反馈机制的课件方案。' },
  ];
  const hasAiFloatingPanel = aiActivePanel === 'plus' || aiActivePanel === 'structure' || aiActivePanel === 'outline' || aiActivePanel === 'tool';
  const selectedStructureOption = aiStructureOptions.find((item) => item.key === aiSelectedStructure) || aiStructureOptions[4];
  const selectedToolGroup = aiToolGroups.find((group) => group.key === aiSelectedToolGroup) || aiToolGroups[0];
  const aiStructureLabel = aiStructureTouched ? selectedStructureOption.label : '课程结构';
  const aiOutlineLabel = aiSelectedOutline || '课程标准/纲要';
  const aiToolLabel = aiSelectedTools.length === 0
    ? '实训工具'
    : aiSelectedTools.length <= 2
      ? aiSelectedTools.join('、')
      : `${aiSelectedTools.slice(0, 2).join('、')}等${aiSelectedTools.length}项`;
  const aiVisibleSkills = aiSelectedSkill
    ? aiGenerationSkills.filter((skill) => skill.label === aiSelectedSkill)
    : aiGenerationSkills;
  const aiPrimarySkills = aiSelectedSkill ? aiVisibleSkills : aiVisibleSkills.slice(0, 3);
  const aiOverflowSkills = aiSelectedSkill ? [] : aiVisibleSkills.slice(3);
  const isAiMode = activeTab === 'ai';
  const isKnowledgeGraphView = resourcePanelView === 'knowledgeGraph';
  const isAiKnowledgeGraphLayout = activeTab === 'ai' && isKnowledgeGraphView;
  const isAiKnowledgeGraphPreviewVisible = isAiKnowledgeGraphLayout && aiKnowledgeGraphPreviewOpen;
  const isStandaloneKnowledgeGraphView = isKnowledgeGraphView && !isAiMode;
  const aiComposerItems = aiSelectedSkill
    ? [
        { key: 'structure', label: aiStructureLabel },
        { key: 'outline', label: aiOutlineLabel },
        { key: 'tool', label: aiToolLabel },
      ]
    : [];
  const tagPickerItem = tagPickerTarget
    ? resources.find((resource) => resource.key === tagPickerTarget) || null
    : null;

  const setAiToolbarAnchorRef = useCallback((key, node) => {
    if (node) {
      aiToolbarAnchorRefs.current.set(key, node);
      return;
    }
    aiToolbarAnchorRefs.current.delete(key);
  }, []);

  const applyAiKnowledgeGraphLeftPanelWidth = useCallback(() => {
    const containerWidth = detailBodyRef.current?.getBoundingClientRect().width || window.innerWidth;
    setLeftPanelWidth(getAiKnowledgeGraphLeftPanelWidth(containerWidth));
  }, []);

  const applyDefaultLeftPanelWidth = useCallback(() => {
    const containerWidth = detailBodyRef.current?.getBoundingClientRect().width || window.innerWidth;
    setLeftPanelWidth(getBoundedDefaultLeftPanelWidth(containerWidth));
  }, []);

  const updateAiFloatingPanelPosition = useCallback(() => {
    if (!hasAiFloatingPanel) return;
    const toolbarNode = aiComposerToolbarRef.current;
    const panelNode = aiFloatingPanelRef.current;
    const anchorNode = aiToolbarAnchorRefs.current.get(aiActivePanel) || null;

    if (!toolbarNode || !panelNode || !anchorNode) return;

    const toolbarRect = toolbarNode.getBoundingClientRect();
    const panelRect = panelNode.getBoundingClientRect();
    const anchorRect = anchorNode.getBoundingClientRect();
    const anchorCenter = anchorRect.left - toolbarRect.left + (anchorRect.width / 2);
    const maxLeft = Math.max(0, toolbarRect.width - panelRect.width);
    const nextLeft = Math.max(0, Math.min(maxLeft, anchorCenter - (panelRect.width / 2)));

    setAiFloatingPanelOffset((prev) => (Math.abs(prev - nextLeft) < 1 ? prev : nextLeft));
  }, [aiActivePanel, hasAiFloatingPanel]);

  const toggleAiPanel = useCallback((panelKey) => {
    setAiActivePanel((prev) => (prev === panelKey ? 'course' : panelKey));
  }, []);

  const toggleAiToolSelection = (toolName) => {
    setAiSelectedTools((prev) => (
      prev.includes(toolName)
        ? prev.filter((item) => item !== toolName)
        : [...prev, toolName]
    ));
  };

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
    persistTopicPanelView(topicStorageScopeKey, resourcePanelView);
  }, [resourcePanelView, topicStorageScopeKey]);

  useEffect(() => {
    const handleKnowledgeGraphStoreChange = () => {
      setKnowledgeGraphStoreSnapshot(loadKnowledgeGraphStore());
    };
    const eventName = getKnowledgeGraphStoreEventName();
    window.addEventListener(eventName, handleKnowledgeGraphStoreChange);
    return () => window.removeEventListener(eventName, handleKnowledgeGraphStoreChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const containerWidth = detailBodyRef.current?.getBoundingClientRect().width || window.innerWidth;
      const minLeftWidth = 280;
      const minRightWidth = 320;
      const maxWidth = Math.max(minLeftWidth, containerWidth - minRightWidth);
      if (isAiKnowledgeGraphLayout) {
        setLeftPanelWidth(getAiKnowledgeGraphLeftPanelWidth(containerWidth));
        return;
      }
      setLeftPanelWidth((prev) => Math.min(prev, maxWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAiKnowledgeGraphLayout]);

  useEffect(() => {
    if (!knowledgeGraphPickerOpen && resourcePanelView !== 'knowledgeGraph') return;
    setResourceLibraryData(loadResourceLib());
  }, [knowledgeGraphPickerOpen, resourcePanelView]);

  useEffect(() => {
    if (activeTab === 'assessment' && resourcePanelView !== 'resources') {
      setResourcePanelView('resources');
    }
  }, [activeTab, resourcePanelView]);

  useEffect(() => {
    if (knowledgeGraphRef || resourcePanelView !== 'knowledgeGraph') return;
    setResourcePanelView('resources');
  }, [knowledgeGraphRef, resourcePanelView]);

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

  useEffect(() => {
    const stageIds = knowledgeGraphStages.map((stage) => stage.id);
    const stageIdSet = new Set(stageIds);
    const pointIdSet = new Set(knowledgeGraphPoints.map((point) => point.id));
    if (!knowledgeGraphGraph) {
      setKnowledgeGraphExpandedStageIds(new Set());
      setKnowledgeGraphSelection({ type: 'graph', id: null });
      setSelectedKnowledgeGraphBindingId(null);
      return;
    }
    setKnowledgeGraphExpandedStageIds((prev) => {
      const next = new Set([...prev].filter((stageId) => stageIdSet.has(stageId)));
      if (!next.size) {
        stageIds.forEach((stageId) => next.add(stageId));
      }
      return next;
    });
    setKnowledgeGraphSelection((prev) => {
      if (prev?.type === 'stage' && stageIdSet.has(prev.id)) return prev;
      if (prev?.type === 'point' && pointIdSet.has(prev.id)) return prev;
      return { type: 'graph', id: knowledgeGraphGraph.id };
    });
  }, [knowledgeGraphGraph, knowledgeGraphPoints, knowledgeGraphStages]);

  const selectedKnowledgeGraphPoint = knowledgeGraphSelection?.type === 'point'
    ? knowledgeGraphPointMap.get(knowledgeGraphSelection.id) || null
    : null;
  const selectedKnowledgeGraphStage = knowledgeGraphSelection?.type === 'stage'
    ? knowledgeGraphStageMap.get(knowledgeGraphSelection.id) || null
    : null;
  const selectedKnowledgeGraphStageEdge = knowledgeGraphSelection?.type === 'stage-edge'
    ? knowledgeGraphStageEdgeMap.get(knowledgeGraphSelection.id) || null
    : null;
  const selectedKnowledgeGraphPointPlacement = selectedKnowledgeGraphPoint
    ? knowledgeGraphPointPlacements[selectedKnowledgeGraphPoint.id] || null
    : null;
  const selectedKnowledgeGraphPointStage = selectedKnowledgeGraphPointPlacement?.stageId
    ? knowledgeGraphStageMap.get(selectedKnowledgeGraphPointPlacement.stageId) || null
    : null;

  useEffect(() => {
    if (!selectedKnowledgeGraphPoint) {
      setSelectedKnowledgeGraphBindingId(null);
      return;
    }
    const bindings = selectedKnowledgeGraphPoint.resourceBindings || [];
    if (!bindings.length) {
      setSelectedKnowledgeGraphBindingId(null);
      return;
    }
    if (!bindings.some((binding) => binding.bindingId === selectedKnowledgeGraphBindingId)) {
      setSelectedKnowledgeGraphBindingId(bindings[0].bindingId);
    }
  }, [selectedKnowledgeGraphBindingId, selectedKnowledgeGraphPoint]);

  useEffect(() => {
    setKnowledgeGraphPreviewMode('preview');
    setKnowledgeGraphDrawerOpen(false);
  }, [knowledgeGraphGraph?.id]);

  useEffect(() => {
    if (!selectedKnowledgeGraphBindingId || resourcePanelView !== 'knowledgeGraph') return undefined;
    const timer = window.setTimeout(() => {
      const target = knowledgeGraphBindingItemRefs.current.get(selectedKnowledgeGraphBindingId);
      target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [knowledgeGraphExpandedStageIds, resourcePanelView, selectedKnowledgeGraphBindingId]);

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
    if (!canEditDisplayedResources) {
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
    if (!canEditDisplayedResources) {
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
    if (!canEditDisplayedResources) {
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
    if (!canEditDisplayedResources) {
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
    if (!canEditDisplayedResources) {
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

  useLayoutEffect(() => {
    if (!hasAiFloatingPanel) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      updateAiFloatingPanelPosition();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [aiActivePanel, hasAiFloatingPanel, updateAiFloatingPanelPosition]);

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

  useEffect(() => {
    if (!hasAiFloatingPanel) return undefined;

    const handleResize = () => {
      updateAiFloatingPanelPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasAiFloatingPanel, updateAiFloatingPanelPosition]);

  useEffect(() => {
    if (!hasAiFloatingPanel || typeof ResizeObserver === 'undefined' || !aiComposerToolbarRef.current) return undefined;

    const observer = new ResizeObserver(() => {
      updateAiFloatingPanelPosition();
    });

    observer.observe(aiComposerToolbarRef.current);
    return () => observer.disconnect();
  }, [hasAiFloatingPanel, updateAiFloatingPanelPosition]);

  useEffect(() => {
    if (!hasAiFloatingPanel) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (aiFloatingPanelRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-ai-panel-trigger="true"]')) return;
      setAiActivePanel('course');
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [hasAiFloatingPanel]);

  useEffect(() => {
    if (!isKnowledgeGraphView || !knowledgeGraphDrawerOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (knowledgeGraphPanelRef.current?.contains(target)) return;
      if (knowledgeGraphDrawerRef.current?.contains(target)) return;
      setKnowledgeGraphDrawerOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isKnowledgeGraphView, knowledgeGraphDrawerOpen]);

  useLayoutEffect(() => {
    const node = aiPromptInputRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${node.scrollHeight}px`;
  }, [aiPromptValue]);

  const handleUpdateAssessment = (assessment) => {
    const newData = updateAssessment(versionData, currentVersion.id, assessment);
    setVersionData(newData);
  };

  const handleUpdateAssessmentChat = (chat) => {
    const newData = updateAssessmentChat(versionData, currentVersion.id, chat);
    setVersionData(newData);
  };

  const handleSwitchResourcePanelView = (nextView) => {
    setResourcePanelView(nextView);
    if (nextView === 'knowledgeGraph') {
      if (activeTab === 'ai') {
        applyAiKnowledgeGraphLeftPanelWidth();
        setAiKnowledgeGraphPreviewOpen(false);
      }
      setResourceLibraryData(loadResourceLib());
      if (previewItem && !previewItem.__kgMirror) {
        setPreviewItem(null);
      }
      return;
    }
    if (activeTab === 'ai') {
      applyDefaultLeftPanelWidth();
    }
    setAiKnowledgeGraphPreviewOpen(false);
  };

  const handleOpenKnowledgeGraphPicker = () => {
    if (!canEditCurrentVersion) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再绑定知识图谱' : '当前内容不可编辑');
      return;
    }
    setKnowledgeGraphPickerMode('bind');
    setResourceLibraryData(loadResourceLib());
    setKnowledgeGraphPickerScope('all');
    setKnowledgeGraphPickerKeyword('');
    setSelectedKnowledgeGraphResourceKey(
      knowledgeGraphRef?.libraryId && knowledgeGraphRef?.resourceKey
        ? `${knowledgeGraphRef.libraryId}:${knowledgeGraphRef.resourceKey}`
        : null,
    );
    setKnowledgeGraphPickerOpen(true);
  };

  const handleConfirmKnowledgeGraphBinding = () => {
    const selectedItem = knowledgeGraphPickerItems.find(
      (item) => `${item.libraryId}:${item.key}` === selectedKnowledgeGraphResourceKey,
    );
    if (!selectedItem?.knowledgeGraphId) {
      message.warning('请选择一张知识图谱');
      return;
    }
    const nextData = updateVersionKnowledgeGraphRef(versionData, currentVersion.id, {
      resourceKey: selectedItem.key,
      knowledgeGraphId: selectedItem.knowledgeGraphId,
      libraryId: selectedItem.libraryId,
      name: selectedItem.name,
    }, versioningConfig);
    setVersionData(nextData);
    setKnowledgeGraphPickerOpen(false);
    setResourcePanelView('knowledgeGraph');
    message.success(
      knowledgeGraphPickerMode === 'add'
        ? `已导入知识图谱「${selectedItem.name}」`
        : `已绑定知识图谱「${selectedItem.name}」`,
    );
  };

  const handleUnbindKnowledgeGraph = () => {
    if (!canEditCurrentVersion) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再解绑知识图谱' : '当前内容不可编辑');
      return;
    }
    Modal.confirm({
      title: '解除知识图谱关联',
      icon: null,
      content: '解除后仅取消当前主题版本与知识图谱的关联，不会删除资料库中的图谱资产。',
      okText: '解除关联',
      cancelText: '取消',
      onOk: () => {
        const nextData = updateVersionKnowledgeGraphRef(versionData, currentVersion.id, null, versioningConfig);
        setVersionData(nextData);
        setKnowledgeGraphSelection({ type: 'graph', id: null });
        setSelectedKnowledgeGraphBindingId(null);
        message.success('已解除知识图谱关联');
      },
    });
  };

  const openKnowledgeGraphInNewTab = useCallback((graph, mode = 'graph') => {
    if (!graph?.id || typeof window === 'undefined') return;
    const params = new URLSearchParams({
      graphId: graph.id,
      mode,
    });
    if (graph.collectionId) {
      params.set('collectionId', graph.collectionId);
    }
    const targetUrl = `${window.location.pathname}${window.location.search}#knowledge-graph?${params.toString()}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleSelectKnowledgeGraphOverview = () => {
    if (!knowledgeGraphGraph?.id) return;
    if (activeTab === 'ai') setAiKnowledgeGraphPreviewOpen(true);
    setKnowledgeGraphSelection({ type: 'graph', id: knowledgeGraphGraph.id });
    setSelectedKnowledgeGraphBindingId(null);
    setPreviewItem(null);
    setKnowledgeGraphDrawerOpen(true);
  };

  const handleToggleKnowledgeGraphStage = (stageId) => {
    setKnowledgeGraphExpandedStageIds((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const handleSelectKnowledgeGraphStage = (stageId) => {
    if (activeTab === 'ai') setAiKnowledgeGraphPreviewOpen(true);
    setKnowledgeGraphExpandedStageIds((prev) => {
      const next = new Set(prev);
      next.add(stageId);
      return next;
    });
    setKnowledgeGraphSelection({ type: 'stage', id: stageId });
    setSelectedKnowledgeGraphBindingId(null);
    setPreviewItem(null);
    setKnowledgeGraphDrawerOpen(true);
  };

  const handleSelectKnowledgeGraphPoint = (stageId, pointId) => {
    if (activeTab === 'ai') setAiKnowledgeGraphPreviewOpen(true);
    setKnowledgeGraphExpandedStageIds((prev) => {
      const next = new Set(prev);
      next.add(stageId);
      return next;
    });
    setKnowledgeGraphSelection({ type: 'point', id: pointId });
    setSelectedKnowledgeGraphBindingId(null);
    setPreviewItem(null);
    setKnowledgeGraphDrawerOpen(true);
  };

  const handleSelectKnowledgeGraphPreviewBinding = (binding) => {
    if (!binding?.bindingId) return;
    if (activeTab === 'ai') setAiKnowledgeGraphPreviewOpen(true);
    const matchedResource = resources.find((item) => item.__kgBindingId === binding.bindingId) || null;
    if (!matchedResource) return;
    const location = knowledgeGraphBindingLocationMap.get(binding.bindingId);
    if (location?.stageId) {
      setKnowledgeGraphExpandedStageIds((prev) => {
        const next = new Set(prev);
        next.add(location.stageId);
        return next;
      });
    }
    if (location?.pointId) {
      setKnowledgeGraphSelection({ type: 'point', id: location.pointId });
    }
    setSelectedKnowledgeGraphBindingId(binding.bindingId);
    setSelectedItemKey(matchedResource.key);
    setSelectedFolderKey(matchedResource.parentKey || null);
    setPreviewItem(matchedResource);
    setKnowledgeGraphDrawerOpen(true);
  };

  const handleSelectKnowledgeGraphCanvasSelection = (nextSelection) => {
    const fallbackSelection = { type: 'graph', id: knowledgeGraphGraph?.id || null };
    const normalizedSelection = nextSelection?.type ? nextSelection : fallbackSelection;
    if (activeTab === 'ai') setAiKnowledgeGraphPreviewOpen(true);
    setKnowledgeGraphSelection(normalizedSelection);
    if (normalizedSelection.type !== 'point') {
      setSelectedKnowledgeGraphBindingId(null);
    }
    setPreviewItem(null);
    setKnowledgeGraphDrawerOpen(true);
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

  const closeResourceImportModal = () => {
    setResourceImportOpen(false);
    setResourceImportParentKey(null);
  };

  const openAddResourceModal = (parentKey = currentListParentKey) => {
    if (!canEditDisplayedResources) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再添加资料' : '当前内容不可编辑');
      return;
    }
    clearPendingRenameTrigger();
    setAddResourceParentKey(parentKey ?? null);
    setModalOpen(true);
  };

  const openResourceImportModal = (parentKey = currentListParentKey) => {
    if (!canEditDisplayedResources) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再添加资料' : '当前内容不可编辑');
      return;
    }
    setResourceLibraryData(loadResourceLib());
    setResourceImportParentKey(parentKey ?? null);
    setResourceImportOpen(true);
  };

  const handlePickLibraryEntry = () => {
    const parentKey = typeof addResourceParentKey === 'undefined'
      ? currentListParentKey
      : addResourceParentKey;
    clearPendingRenameTrigger();
    setModalOpen(false);
    setAddResourceParentKey(undefined);
    openResourceImportModal(parentKey ?? null);
  };

  const handleAddResource = (resource) => {
    if (resource?.type === 'knowledgeGraph') {
      if (!canEditCurrentVersion) {
        message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再导入知识图谱' : '当前内容不可编辑');
        return;
      }
      if (knowledgeGraphRef) {
        message.warning('当前主题最多添加 1 张知识图谱，如需调整请使用“更换图谱”');
        return;
      }
      setKnowledgeGraphPickerMode('add');
      setResourceLibraryData(loadResourceLib());
      setKnowledgeGraphPickerScope('all');
      setKnowledgeGraphPickerKeyword('');
      setSelectedKnowledgeGraphResourceKey(
        knowledgeGraphRef?.libraryId && knowledgeGraphRef?.resourceKey
          ? `${knowledgeGraphRef.libraryId}:${knowledgeGraphRef.resourceKey}`
          : null,
      );
      setKnowledgeGraphPickerOpen(true);
      return;
    }
    if (!canEditDisplayedResources) {
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

  const handleImportResourcesFromLibrary = ({ selectedItems = [], includeDirectories = true, libraryId = 'personal' }) => {
    if (!canEditDisplayedResources) {
      message.warning(versioningEnabled ? '当前版本已发布，请新建版本后再添加资料' : '当前内容不可编辑');
      return;
    }
    const latestResourceLibraryData = loadResourceLib();
    setResourceLibraryData(latestResourceLibraryData);
    const importedResources = buildTopicResourcesFromLibrarySelection(selectedItems, {
      targetParentKey: resourceImportParentKey ?? null,
      includeDirectories,
      libraryData: latestResourceLibraryData,
      libraryId,
      existingResources: sourceResources,
      excludedFileTypes: ['knowledgeGraph'],
    });
    if (!importedResources.length) {
      message.warning('所选内容中没有可导入的资料');
      return;
    }
    const nextData = addResources(versionData, currentVersion.id, importedResources, versioningConfig);
    setVersionData(nextData);
    closeResourceImportModal();
    const folderCount = importedResources.filter((item) => item.isFolder).length;
    const fileCount = importedResources.length - folderCount;
    const suffix = includeDirectories ? '，已保留目录结构' : '，未保留目录';
    message.success(`已导入 ${fileCount} 个文件${folderCount ? `、${folderCount} 个目录` : ''}${suffix}`);
  };

  const handleArchiveResourceToProfile = (resource) => {
    if (!resource || resource.isFolder || resource.__kgMirror || !canArchiveSceneResource) return;
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
    if (!resource || !canEditDisplayedResources) {
      if (!canEditDisplayedResources) message.warning('当前版本不可编辑');
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
    if (!canEditDisplayedResources) {
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
    if (!item?.key || !canEditDisplayedResources) return;
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
    if (!canEditDisplayedResources) {
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
    if (!canEditDisplayedResources) {
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
            { key: 'addResource', icon: <FileAddOutlined />, label: addResourceLabel, disabled: !canEditDisplayedResources },
            { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹', disabled: !canEditDisplayedResources },
            { type: 'divider' },
          ]
        : []),
      ...(tagConfig
        ? [
            { key: 'tags-manage', icon: <TagsOutlined />, label: '编辑标签', disabled: !canEditDisplayedResources },
            { type: 'divider' },
          ]
        : []),
      ...(!item.isFolder && canArchiveSceneResource && !item.__kgMirror
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
      { key: 'rename', icon: <EditOutlined />, label: '重命名', disabled: !canEditDisplayedResources },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, disabled: !canEditDisplayedResources },
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

  const resourcePanelViewOptions = useMemo(() => (
    knowledgeGraphRef
      ? [
          { label: '资料', value: 'resources' },
          { label: '知识图谱', value: 'knowledgeGraph' },
        ]
      : [
          { label: '资料', value: 'resources' },
        ]
  ), [knowledgeGraphRef]);

  const bgContextMenu = {
    items: [
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹', disabled: !canEditDisplayedResources },
      { key: 'addResource', icon: <FileAddOutlined />, label: addResourceLabel, disabled: !canEditDisplayedResources },
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
              draggable={!isInlineRenaming && canEditDisplayedResources}
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
                  {canEditDisplayedResources ? (
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
          draggable={!isInlineRenaming && canEditDisplayedResources}
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
          draggable={!isInlineRenaming && canEditDisplayedResources}
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
                {item.isFolder && canEditDisplayedResources ? (
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

  const renderKnowledgeGraphPreviewPane = () => {
    const renderKnowledgeGraphDrawerContent = () => {
      if (!knowledgeGraphGraph) return null;

      if (previewItem && !previewItem.isFolder) {
        const previewType = getTopicResourceFileType(previewItem);
        const previewSummary = getPreviewSummary(previewItem, previewType);
        return (
          <div className="topic-knowledge-inspector topic-knowledge-inspector-resource">
            <div className="topic-knowledge-inspector-kicker">绑定资源预览</div>
            <div className="topic-knowledge-inspector-title">{previewItem.name}</div>
            <div className="topic-knowledge-inspector-desc">
              {previewSummary || '当前资源已绑定到知识图谱节点，可在抽屉内直接查看预览内容。'}
            </div>
            <div className="topic-knowledge-inspector-list">
              <div className="topic-knowledge-inspector-list-item">
                <span>资源类型</span>
                <strong>{getResourceTypeLabel(previewItem, previewType)}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>所在目录</span>
                <strong>{previewParentFolder ? previewParentFolder.name : knowledgeGraphGraph.name}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>所有者</span>
                <strong>{previewItem.owner || '--'}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>更新时间</span>
                <strong>{previewItem.lastEdit || '--'}</strong>
              </div>
            </div>
            {getResourceTags(previewItem).length ? (
              <div className="topic-knowledge-inspector-section">
                <div className="topic-knowledge-inspector-section-title">资源标签</div>
                <div className="topic-preview-main-tags">
                  {renderPreviewTagTokens(previewItem)}
                </div>
              </div>
            ) : null}
            <div className="topic-knowledge-drawer-preview">
              {renderPreviewContent(previewItem)}
            </div>
          </div>
        );
      }

      if (selectedKnowledgeGraphPoint) {
        const pointBindings = selectedKnowledgeGraphPoint.resourceBindings || [];
        return (
          <div className="topic-knowledge-inspector">
            <div className="topic-knowledge-inspector-kicker">知识点属性</div>
            <div className="topic-knowledge-inspector-title">{selectedKnowledgeGraphPoint.title}</div>
            <div className="topic-knowledge-inspector-desc">
              {selectedKnowledgeGraphPoint.summary || '当前知识点未填写摘要。'}
            </div>
            <div className="topic-knowledge-inspector-grid">
              <div className="topic-knowledge-inspector-metric">
                <span>所属分区</span>
                <strong>{selectedKnowledgeGraphPointStage?.name || '--'}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>知识点类型</span>
                <strong>{KNOWLEDGE_GRAPH_POINT_TYPE_LABEL_MAP[selectedKnowledgeGraphPoint.type] || selectedKnowledgeGraphPoint.type || '--'}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>标签数</span>
                <strong>{selectedKnowledgeGraphPoint.tags?.length || 0}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>绑定资料</span>
                <strong>{pointBindings.length}</strong>
              </div>
            </div>
            <div className="topic-knowledge-inspector-section">
              <div className="topic-knowledge-inspector-section-title">基础信息</div>
              <div className="topic-knowledge-inspector-list">
                <div className="topic-knowledge-inspector-list-item">
                  <span>最后更新</span>
                  <strong>{formatTopicGraphDateTime(selectedKnowledgeGraphPoint.updatedAt)}</strong>
                </div>
                <div className="topic-knowledge-inspector-list-item">
                  <span>点位颜色</span>
                  <strong>{selectedKnowledgeGraphPoint.meta?.color || '--'}</strong>
                </div>
              </div>
            </div>
            <div className="topic-knowledge-inspector-section">
              <div className="topic-knowledge-inspector-section-title">绑定资料</div>
              <div className="topic-knowledge-inspector-chip-list">
                {pointBindings.length ? pointBindings.map((binding) => (
                  <button
                    key={binding.bindingId}
                    type="button"
                    className={`topic-knowledge-inspector-chip ${selectedKnowledgeGraphBindingId === binding.bindingId ? 'is-active' : ''}`}
                    onClick={() => handleSelectKnowledgeGraphPreviewBinding(binding)}
                  >
                    {binding.resourceName || '未命名资料'}
                  </button>
                )) : (
                  <div className="topic-knowledge-inspector-empty">当前知识点暂无绑定资料。</div>
                )}
              </div>
            </div>
          </div>
        );
      }

      if (selectedKnowledgeGraphStage) {
        const stageEntries = knowledgeGraphStagePointEntries[selectedKnowledgeGraphStage.id] || [];
        const stageBindingCount = stageEntries.reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0);
        return (
          <div className="topic-knowledge-inspector">
            <div className="topic-knowledge-inspector-kicker">分区属性</div>
            <div className="topic-knowledge-inspector-title">{selectedKnowledgeGraphStage.name}</div>
            <div className="topic-knowledge-inspector-desc">
              {selectedKnowledgeGraphStage.description || '当前分区未填写描述。'}
            </div>
            <div className="topic-knowledge-inspector-grid">
              <div className="topic-knowledge-inspector-metric">
                <span>知识点数</span>
                <strong>{stageEntries.length}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>绑定资料</span>
                <strong>{stageBindingCount}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>布局列数</span>
                <strong>{selectedKnowledgeGraphStage.layoutColumns || 1}</strong>
              </div>
              <div className="topic-knowledge-inspector-metric">
                <span>分区颜色</span>
                <strong>{selectedKnowledgeGraphStage.color || '--'}</strong>
              </div>
            </div>
            <div className="topic-knowledge-inspector-section">
              <div className="topic-knowledge-inspector-section-title">分区知识点</div>
              <div className="topic-knowledge-inspector-list">
                {stageEntries.length ? stageEntries.map(({ point }) => (
                  <button
                    key={point.id}
                    type="button"
                    className="topic-knowledge-inspector-row"
                    onClick={() => handleSelectKnowledgeGraphCanvasSelection({ type: 'point', id: point.id })}
                  >
                    <span>{point.title}</span>
                    <strong>{point.resourceBindings?.length || 0} 条资料</strong>
                  </button>
                )) : (
                  <div className="topic-knowledge-inspector-empty">当前分区还没有知识点。</div>
                )}
              </div>
            </div>
          </div>
        );
      }

      if (selectedKnowledgeGraphStageEdge) {
        const sourceStage = knowledgeGraphStageMap.get(selectedKnowledgeGraphStageEdge.source) || null;
        const targetStage = knowledgeGraphStageMap.get(selectedKnowledgeGraphStageEdge.target) || null;
        return (
          <div className="topic-knowledge-inspector">
            <div className="topic-knowledge-inspector-kicker">分区连线</div>
            <div className="topic-knowledge-inspector-title">{selectedKnowledgeGraphStageEdge.label || '未命名连线'}</div>
            <div className="topic-knowledge-inspector-desc">当前为只读查看模式，连线属性不可编辑。</div>
            <div className="topic-knowledge-inspector-list">
              <div className="topic-knowledge-inspector-list-item">
                <span>起点分区</span>
                <strong>{sourceStage?.name || '--'}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>终点分区</span>
                <strong>{targetStage?.name || '--'}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>线条样式</span>
                <strong>{selectedKnowledgeGraphStageEdge.lineStyle || 'solid'}</strong>
              </div>
              <div className="topic-knowledge-inspector-list-item">
                <span>更新时间</span>
                <strong>{formatTopicGraphDateTime(selectedKnowledgeGraphStageEdge.updatedAt)}</strong>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="topic-knowledge-inspector">
          <div className="topic-knowledge-inspector-kicker">图谱属性</div>
          <div className="topic-knowledge-inspector-title">{knowledgeGraphGraph.name}</div>
          <div className="topic-knowledge-inspector-desc">
            {knowledgeGraphGraph.description || '当前图谱用于组织分区路径、知识点结构与资料绑定。'}
          </div>
          <div className="topic-knowledge-inspector-grid">
            <div className="topic-knowledge-inspector-metric">
              <span>分区数</span>
              <strong>{knowledgeGraphStages.length}</strong>
            </div>
            <div className="topic-knowledge-inspector-metric">
              <span>知识点数</span>
              <strong>{knowledgeGraphPoints.length}</strong>
            </div>
            <div className="topic-knowledge-inspector-metric">
              <span>资料绑定</span>
              <strong>{knowledgeGraphBindingCount}</strong>
            </div>
            <div className="topic-knowledge-inspector-metric">
              <span>最后更新</span>
              <strong>{formatTopicGraphDateTime(knowledgeGraphGraph.updatedAt)}</strong>
            </div>
          </div>
          <div className="topic-knowledge-inspector-section">
            <div className="topic-knowledge-inspector-section-title">分区概览</div>
            <div className="topic-knowledge-inspector-list">
              {knowledgeGraphStages.map((stage) => {
                const stageEntries = knowledgeGraphStagePointEntries[stage.id] || [];
                return (
                  <button
                    key={stage.id}
                    type="button"
                    className="topic-knowledge-inspector-row"
                    onClick={() => handleSelectKnowledgeGraphCanvasSelection({ type: 'stage', id: stage.id })}
                  >
                    <span>{stage.name}</span>
                    <strong>{stageEntries.length} 个点</strong>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    if (!knowledgeGraphRef) {
      return (
        <div className="topic-preview-main topic-knowledge-preview-main" ref={knowledgeGraphPanelRef}>
          <div className="topic-preview-main-head">
            <div className="topic-preview-main-head-left">
              <span className="topic-preview-main-icon">
                <NodeIndexOutlined />
              </span>
              <div className="topic-preview-main-copy">
                <div className="topic-preview-main-breadcrumb">知识图谱</div>
                <div className="topic-preview-main-title">当前主题尚未绑定知识图谱</div>
                <div className="topic-preview-main-meta">
                  <span>从资料库中选择 1 张主知识图谱后即可在空间内浏览。</span>
                </div>
              </div>
            </div>
            {canEditCurrentVersion ? (
              <div className="topic-preview-main-head-actions">
                <Button type="primary" onClick={handleOpenKnowledgeGraphPicker}>
                  从资料库绑定
                </Button>
              </div>
            ) : null}
          </div>
          <div className="topic-preview-main-content topic-knowledge-preview-empty-shell">
            <Empty description="当前主题版本还没有绑定知识图谱" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
      );
    }

    if (!knowledgeGraphGraph) {
      return (
        <div className="topic-preview-main topic-knowledge-preview-main" ref={knowledgeGraphPanelRef}>
          <div className="topic-preview-main-head">
            <div className="topic-preview-main-head-left">
              <span className="topic-preview-main-icon">
                <NodeIndexOutlined />
              </span>
              <div className="topic-preview-main-copy">
                <div className="topic-preview-main-breadcrumb">知识图谱</div>
                <div className="topic-preview-main-title">{knowledgeGraphRef.name || '关联图谱不可用'}</div>
                <div className="topic-preview-main-meta">
                  <span>原图谱已删除或当前不可访问，可重新从资料库绑定。</span>
                </div>
              </div>
            </div>
            {canEditCurrentVersion ? (
              <div className="topic-preview-main-head-actions">
                <Button onClick={handleOpenKnowledgeGraphPicker}>重新绑定</Button>
              </div>
            ) : null}
          </div>
          <div className="topic-preview-main-content topic-knowledge-preview-empty-shell">
            <Empty description="当前主题绑定的知识图谱不可用" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
      );
    }

    const previewData = {
      graph: knowledgeGraphGraph,
      points: knowledgeGraphPoints,
      relations: knowledgeGraphRelations,
      structuredView: knowledgeGraphStructuredView,
    };

    if (knowledgeGraphPreviewMode === 'edit') {
      return (
        <div className="finder-kg-preview-embed finder-kg-preview-embed-edit" ref={knowledgeGraphPanelRef}>
          <div className="finder-kg-preview-head">
            <div className="finder-kg-preview-head-copy">
              <div className="finder-kg-preview-head-title">{previewData.graph.name}</div>
              <div className="finder-kg-preview-head-meta">
                {previewData.graph.description || '知识图谱结构化编辑'}
              </div>
          </div>
          <div className="finder-kg-preview-head-actions">
            <Button icon={<DatabaseOutlined />} onClick={handleOpenKnowledgeGraphPicker} disabled={!canEditCurrentVersion}>
              {knowledgeGraphRef ? '更换图谱' : '绑定图谱'}
            </Button>
            {canEditCurrentVersion ? (
              <Button danger onClick={handleUnbindKnowledgeGraph}>
                解除关联
              </Button>
            ) : null}
            <Button icon={<FullscreenOutlined />} onClick={() => openKnowledgeGraphInNewTab(previewData.graph, 'curriculum')}>
              全屏
            </Button>
            </div>
          </div>
          <KnowledgeGraphModule
            embedded
            entryGraphId={previewData.graph.id}
            entryCollectionId={previewData.graph.collectionId}
            entryMode="curriculum"
            entryRequestId={`topic-${currentVersion?.id || 'default'}-${previewData.graph.id}-edit`}
            onExitEmbedded={() => setKnowledgeGraphPreviewMode('preview')}
          />
        </div>
      );
    }

    return (
      <div className="finder-kg-preview-embed topic-kg-preview-embed" ref={knowledgeGraphPanelRef}>
        <div className="finder-kg-preview-head">
          <div className="finder-kg-preview-head-copy">
            <div className="finder-kg-preview-head-title">{previewData.graph.name}</div>
            <div className="finder-kg-preview-head-meta">
              {previewData.graph.description || '知识图谱结构化预览'}
            </div>
          </div>
          <div className="finder-kg-preview-head-actions">
            <Button icon={<DatabaseOutlined />} onClick={handleOpenKnowledgeGraphPicker} disabled={!canEditCurrentVersion}>
              {knowledgeGraphRef ? '更换图谱' : '绑定图谱'}
            </Button>
            {canEditCurrentVersion ? (
              <Button danger onClick={handleUnbindKnowledgeGraph}>
                解除关联
              </Button>
            ) : null}
            <Button type="primary" icon={<EditOutlined />} onClick={() => setKnowledgeGraphPreviewMode('edit')} disabled={!canEditCurrentVersion}>
              编辑
            </Button>
            <Button icon={<FullscreenOutlined />} onClick={() => openKnowledgeGraphInNewTab(previewData.graph, 'graph')}>
              全屏
            </Button>
          </div>
        </div>
        <div className="topic-kg-preview-stage">
          <div className="topic-kg-preview-canvas-area" ref={knowledgeGraphCanvasAreaRef}>
            <StructuredKnowledgeGraphView
              graphId={previewData.graph.id}
              points={previewData.points}
              relations={previewData.relations}
              structuredView={previewData.structuredView}
              pointTypeLabelMap={KNOWLEDGE_GRAPH_POINT_TYPE_LABEL_MAP}
              relationTypeLabelMap={KNOWLEDGE_GRAPH_RELATION_TYPE_LABEL_MAP}
              selection={knowledgeGraphSelection}
              onSelectionChange={handleSelectKnowledgeGraphCanvasSelection}
              onPreviewBinding={handleSelectKnowledgeGraphPreviewBinding}
              readOnly
              interactiveReadOnly
            />
          </div>
          {knowledgeGraphDrawerOpen ? (
            <aside className="topic-knowledge-drawer" ref={knowledgeGraphDrawerRef}>
              <div className="topic-knowledge-drawer-head">
                <span className="topic-knowledge-drawer-head-label">{previewItem ? '绑定资源预览' : '右侧预览'}</span>
                <button
                  type="button"
                  className="topic-knowledge-drawer-action"
                  onClick={() => setKnowledgeGraphDrawerOpen(false)}
                  aria-label="收起右侧预览"
                >
                  <RightOutlined />
                </button>
              </div>
              <div className="topic-knowledge-drawer-body">
                {renderKnowledgeGraphDrawerContent()}
              </div>
            </aside>
          ) : (
            <button
              type="button"
              className="topic-knowledge-drawer-toggle"
              onClick={() => setKnowledgeGraphDrawerOpen(true)}
              aria-label="展开右侧预览"
            >
              <LeftOutlined />
              <span>展开预览</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderKnowledgeGraphSidebar = () => {
    if (!knowledgeGraphRef) {
      return (
        <div className="topic-knowledge-panel-empty">
          <NodeIndexOutlined className="topic-knowledge-panel-empty-icon" />
          <div className="topic-knowledge-panel-empty-title">当前主题尚未绑定知识图谱</div>
          <div className="topic-knowledge-panel-empty-text">
            从资料库中选择一张知识图谱，作为本主题的主学习路径视图。
          </div>
          {canEditCurrentVersion && !isAiMode ? (
            <Button type="primary" onClick={handleOpenKnowledgeGraphPicker}>
              从资料库绑定
            </Button>
          ) : null}
        </div>
      );
    }

    if (!knowledgeGraphGraph) {
      return (
        <div className="topic-knowledge-panel-empty">
          <NodeIndexOutlined className="topic-knowledge-panel-empty-icon" />
          <div className="topic-knowledge-panel-empty-title">{knowledgeGraphRef.name || '知识图谱不可用'}</div>
          <div className="topic-knowledge-panel-empty-text">
            当前绑定的图谱已失效，可重新从资料库绑定新的知识图谱。
          </div>
          {canEditCurrentVersion && !isAiMode ? (
            <Button type="primary" onClick={handleOpenKnowledgeGraphPicker}>
              重新绑定
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="topic-knowledge-panel">
        <div className="topic-knowledge-panel-summary">
          <div className="topic-knowledge-panel-summary-head">
            <button
              type="button"
              className={`topic-knowledge-overview-btn ${knowledgeGraphSelection?.type === 'graph' ? 'is-active' : ''}`}
              onClick={handleSelectKnowledgeGraphOverview}
            >
              <span className="topic-knowledge-overview-icon"><NodeIndexOutlined /></span>
              <span className="topic-knowledge-overview-copy">
                <strong>{knowledgeGraphGraph.name}</strong>
                <span>{knowledgeGraphGraph.description || '点击查看图谱概览与分区分布。'}</span>
              </span>
            </button>
          </div>
          <div className="topic-knowledge-panel-stats">
            <span>{knowledgeGraphStages.length} 分区</span>
            <span>{knowledgeGraphPoints.length} 知识点</span>
            <span>{knowledgeGraphBindingCount} 资料</span>
          </div>
        </div>

        <div className="topic-knowledge-stage-list">
          {knowledgeGraphStages.map((stage) => {
            const isExpanded = knowledgeGraphExpandedStageIds.has(stage.id);
            const stageEntries = knowledgeGraphStagePointEntries[stage.id] || [];
            const isSelectedStage = knowledgeGraphSelection?.type === 'stage' && knowledgeGraphSelection.id === stage.id;
            return (
              <div key={stage.id} className={`topic-knowledge-stage-card ${isSelectedStage ? 'is-selected' : ''}`}>
                <div className="topic-knowledge-stage-head">
                  <button
                    type="button"
                    className="topic-knowledge-stage-main"
                    onClick={() => handleSelectKnowledgeGraphStage(stage.id)}
                  >
                    <strong>{stage.name}</strong>
                    <span>{stageEntries.length} 个知识点 · {stageEntries.reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0)} 条资料</span>
                  </button>
                  <button
                    type="button"
                    className="topic-knowledge-stage-toggle"
                    onClick={() => handleToggleKnowledgeGraphStage(stage.id)}
                  >
                    {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                  </button>
                </div>
                {isExpanded ? (
                  <div className="topic-knowledge-point-list">
                    {stageEntries.length ? stageEntries.map(({ point }) => {
                      const isSelectedPoint = knowledgeGraphSelection?.type === 'point' && knowledgeGraphSelection.id === point.id;
                      const bindings = point.resourceBindings || [];
                      return (
                        <div
                          key={point.id}
                          className={`topic-knowledge-point-card ${isSelectedPoint ? 'is-selected' : ''}`}
                        >
                          <button
                            type="button"
                            className={`topic-knowledge-point-item ${isSelectedPoint ? 'is-selected' : ''}`}
                            onClick={() => handleSelectKnowledgeGraphPoint(stage.id, point.id)}
                          >
                            <strong>{point.title}</strong>
                            <span>{point.summary || '未填写知识点摘要。'}</span>
                            <div className="topic-knowledge-point-meta">
                              <span>{bindings.length} 条资料</span>
                              <span>{point.tags?.length || 0} 个标签</span>
                            </div>
                          </button>
                          <div className="topic-knowledge-binding-list">
                            {bindings.length ? bindings.map((binding) => {
                              const liveResource = resourceLibraryItemMap.get(`${binding.libraryId}:${binding.resourceKey}`) || null;
                              const bindingName = liveResource?.name || binding.resourceName || '未命名资料';
                              const bindingPath = binding.snapshotPath
                                ? `${binding.libraryName || '资料库'} / ${binding.snapshotPath}`
                                : (binding.libraryName || '资料库');
                              const isSelectedBinding = selectedKnowledgeGraphBindingId === binding.bindingId;
                              return (
                                <button
                                  key={binding.bindingId}
                                  type="button"
                                  className={`topic-knowledge-binding-item ${isSelectedBinding ? 'is-selected' : ''}`}
                                  ref={(node) => {
                                    if (node) knowledgeGraphBindingItemRefs.current.set(binding.bindingId, node);
                                    else knowledgeGraphBindingItemRefs.current.delete(binding.bindingId);
                                  }}
                                  onClick={() => handleSelectKnowledgeGraphPreviewBinding(binding)}
                                >
                                  <strong>{bindingName}</strong>
                                  <span>{bindingPath}</span>
                                </button>
                              );
                            }) : (
                              <div className="topic-knowledge-binding-empty">当前知识点未绑定资料</div>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="topic-knowledge-stage-empty">该分区暂时没有知识点</div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`topic-detail ${sceneConfig ? 'topic-detail-scene-theme' : ''}`} style={detailThemeStyle}>
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
          <div className={`detail-tabs ${tabs.length === 1 ? 'detail-tabs-single' : ''}`} ref={detailTabsRef}>
            {tabs.length > 1 ? (
              <div
                className={`detail-tabs-liquid-indicator ${tabIndicatorStyle.opacity ? 'is-visible' : ''}`}
                style={{
                  width: `${tabIndicatorStyle.width}px`,
                  height: `${tabIndicatorStyle.height}px`,
                  transform: `translate3d(${tabIndicatorStyle.x}px, ${tabIndicatorStyle.y}px, 0)`,
                  opacity: tabIndicatorStyle.opacity,
                }}
              />
            ) : null}
            {tabs.map((tab) => (
              <div
                key={tab.key}
                ref={(node) => setDetailTabRef(tab.key, node)}
                className={`detail-tab ${activeTab === tab.key ? 'detail-tab-active' : ''} ${tabs.length === 1 ? 'detail-tab-single' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'ai' && resourcePanelView === 'knowledgeGraph') {
                    applyAiKnowledgeGraphLeftPanelWidth();
                    setAiKnowledgeGraphPreviewOpen(false);
                  }
                }}
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
          {!isStandaloneKnowledgeGraphView ? (
            <>
              <div className="detail-left-panel" style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}>
                {(!isAiKnowledgeGraphPreviewVisible || isAiKnowledgeGraphLayout) ? (
                  <div className="panel-header">
                    <span className="panel-title">{resourcePanelView === 'knowledgeGraph' ? '知识图谱' : resourcePanelTitle}</span>
                    {resourcePanelViewOptions.length > 1 ? (
                      <Segmented
                        size="small"
                        value={resourcePanelView}
                        onChange={handleSwitchResourcePanelView}
                        options={resourcePanelViewOptions}
                        className="topic-panel-view-switcher"
                      />
                    ) : null}
                  </div>
                ) : null}

                {resourcePanelView === 'resources' ? (
                  <>
                    <div className={`panel-actions ${isAiMode ? 'panel-actions-single' : ''}`}>
                      <div
                        className={`panel-action-btn ${!canEditDisplayedResources ? 'panel-action-btn-disabled' : ''}`}
                        onClick={() => canEditDisplayedResources && openAddResourceModal(currentListParentKey)}
                      >
                        <PlusOutlined style={{ fontSize: 12 }} />
                        <span>{addResourceLabel}</span>
                      </div>
                      {!isAiMode ? (
                        <div className="panel-action-btn">
                          <AppstoreOutlined style={{ fontSize: 12 }} />
                          <span>{appLabel}</span>
                        </div>
                      ) : null}
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
                                disabled: !canEditDisplayedResources,
                              },
                              {
                                key: 'new-folder',
                                icon: <FolderAddOutlined />,
                                label: '新建文件夹',
                                onClick: () => createFolderAndStartRename(null, 'tree'),
                                disabled: !canEditDisplayedResources,
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
                  </>
                ) : (
                  <div className="topic-knowledge-panel-shell">
                    {isAiKnowledgeGraphLayout
                      ? renderKnowledgeGraphPreviewPane()
                      : (isAiKnowledgeGraphPreviewVisible ? renderKnowledgeGraphPreviewPane() : renderKnowledgeGraphSidebar())}
                  </div>
                )}
              </div>

              <div className="topic-sidebar-resize-handle" onMouseDown={handleSidebarResizeStart} />
            </>
          ) : null}

          <div className="detail-right-panel">
            {isStandaloneKnowledgeGraphView ? (
              <>
                <div className="panel-header topic-standalone-panel-header">
                  <span className="panel-title">知识图谱</span>
                  {resourcePanelViewOptions.length > 1 ? (
                    <Segmented
                      size="small"
                      value={resourcePanelView}
                      onChange={handleSwitchResourcePanelView}
                      options={resourcePanelViewOptions}
                      className="topic-panel-view-switcher"
                    />
                  ) : null}
                </div>
                {renderKnowledgeGraphPreviewPane()}
              </>
            ) : activeTab === 'ai' ? (
              <div className="topic-ai-shell">
                <div className="topic-ai-main">
                  <div className="topic-ai-workbench">
                    <div className="topic-ai-toolbar">
                      <div className="topic-ai-agent">
                        <span className="topic-ai-agent-icon">
                          <MessageOutlined />
                        </span>
                        <span>课程创作智能体</span>
                      </div>
                      <div className="topic-ai-toolbar-actions">
                        <span className="topic-ai-toolbar-action">
                          <CommentOutlined />
                          <span>新会话</span>
                        </span>
                        <span className="topic-ai-toolbar-action">
                          <EyeOutlined />
                          <span>共创记录</span>
                        </span>
                      </div>
                    </div>

                    <div className="topic-ai-stage">
                      <div className={`topic-ai-stage-body ${isKnowledgeGraphView ? 'topic-ai-stage-body-knowledge' : ''}`}>
                        {!isKnowledgeGraphView ? (
                          <div className="topic-ai-resource-stage">
                            <div className="topic-ai-resource-stage-head">
                              <div className="topic-ai-resource-stage-copy">
                                <div className="topic-ai-resource-stage-title">
                                  {selectedFolder ? selectedFolder.name : currentVersion?.name || resourcePanelTitle}
                                </div>
                                <div className="topic-ai-resource-stage-meta">
                                  {selectedFolder
                                    ? `${folderChildren.filter((child) => !child.isFolder).length} 个文件 ${folderChildren.filter((child) => child.isFolder).length} 个文件夹`
                                    : `${fileCount} 个文件 ${folderCount} 个文件夹`}
                                </div>
                              </div>
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                disabled={!canEditDisplayedResources}
                                onClick={() => openAddResourceModal(currentListParentKey)}
                              >
                                {addResourceLabel}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="topic-ai-composer" ref={aiComposerRef}>
                        <textarea
                          ref={aiPromptInputRef}
                          className="topic-ai-composer-input"
                          placeholder="请描述课程主题、适用年级、课程结构与额外要求"
                          value={aiPromptValue}
                          onChange={(event) => setAiPromptValue(event.target.value)}
                          rows={1}
                        />
                        <div className="topic-ai-composer-toolbar" ref={aiComposerToolbarRef}>
                          {hasAiFloatingPanel ? (
                            <div
                              ref={aiFloatingPanelRef}
                              className={`topic-ai-floating-panel topic-ai-floating-panel-${aiActivePanel}`}
                              style={{ left: `${aiFloatingPanelOffset}px` }}
                            >
                              {aiActivePanel === 'plus' ? (
                                <div className="topic-ai-plus-panel">
                                  <div className="topic-ai-plus-menu">
                                    <button type="button" className="topic-ai-plus-menu-item">
                                      <span className="topic-ai-plus-menu-icon"><PaperClipOutlined /></span>
                                      <span>上传本地文件</span>
                                    </button>
                                    <button type="button" className="topic-ai-plus-menu-item">
                                      <span className="topic-ai-plus-menu-icon"><FileAddOutlined /></span>
                                      <span>从资料库中添加</span>
                                    </button>
                                    <div className="topic-ai-plus-menu-item topic-ai-plus-menu-item-active">
                                      <span className="topic-ai-plus-menu-icon"><ThunderboltOutlined /></span>
                                      <span>技能</span>
                                      <RightOutlined />
                                    </div>
                                    <div className="topic-ai-plus-menu-item topic-ai-plus-menu-item-switch">
                                      <span className="topic-ai-plus-menu-item-copy">
                                        <span className="topic-ai-plus-menu-icon"><GlobalOutlined /></span>
                                        <span>互联网检索</span>
                                      </span>
                                      <Switch
                                        size="small"
                                        checked={aiInternetSearchEnabled}
                                        onChange={setAiInternetSearchEnabled}
                                      />
                                    </div>
                                  </div>
                                  <div className="topic-ai-plus-skills">
                                    <div className="topic-ai-plus-skills-head">
                                      <div className="topic-ai-plus-skills-title">技能</div>
                                      <div className="topic-ai-plus-skills-search">
                                        <SearchOutlined />
                                        <span>搜索技能</span>
                                      </div>
                                    </div>
                                    <div className="topic-ai-plus-skill-list">
                                      {aiGenerationSkills.map((skill) => (
                                        <button
                                          key={skill.key}
                                          type="button"
                                          className={`topic-ai-plus-skill-card ${aiSelectedSkill === skill.label ? 'topic-ai-plus-skill-card-active' : ''}`}
                                          onClick={() => {
                                            setAiSelectedSkill(skill.label);
                                            setAiActivePanel('course');
                                          }}
                                        >
                                          <span className="topic-ai-plus-skill-icon"><ThunderboltOutlined /></span>
                                          <span className="topic-ai-plus-skill-copy">
                                            <span className="topic-ai-plus-skill-name">{skill.label}</span>
                                            <span className="topic-ai-plus-skill-desc">{skill.description}</span>
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                    <button type="button" className="topic-ai-plus-manage">
                                      <SettingOutlined />
                                      <span>管理技能</span>
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              {aiActivePanel === 'structure' ? (
                                <div className="topic-ai-selector-panel">
                                  <div className="topic-ai-selector-head">
                                    <div className="topic-ai-selector-title topic-ai-selector-title-required">课程结构</div>
                                    <div className="topic-ai-selector-hint">选择一种适合当前课程的教学组织方式</div>
                                  </div>
                                  <div className="topic-ai-structure-grid">
                                    {aiStructureOptions.map((option) => (
                                      <button
                                        key={option.key}
                                        type="button"
                                        className={`topic-ai-structure-card ${option.key === aiSelectedStructure ? 'topic-ai-structure-card-active' : ''}`}
                                        onClick={() => {
                                          setAiSelectedStructure(option.key);
                                          setAiStructureTouched(true);
                                        }}
                                      >
                                        <div className="topic-ai-structure-icon">{option.icon}</div>
                                        <div className="topic-ai-structure-title">{option.label}</div>
                                        <div className="topic-ai-structure-desc">{option.description}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {aiActivePanel === 'outline' ? (
                                <div className="topic-ai-selector-panel">
                                  <div className="topic-ai-selector-head">
                                    <div className="topic-ai-selector-title">课程标准/纲要</div>
                                    <div className="topic-ai-selector-hint">选择一份参考纲要，用于约束课程目标和内容边界</div>
                                  </div>
                                  <div className="topic-ai-outline-list">
                                    {aiOutlineOptions.map((item) => (
                                      <button
                                        key={item}
                                        type="button"
                                        className={`topic-ai-outline-item ${aiSelectedOutline === item ? 'topic-ai-outline-item-active' : ''}`}
                                        onClick={() => setAiSelectedOutline(item)}
                                      >
                                        {item}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {aiActivePanel === 'tool' ? (
                                <div className="topic-ai-selector-panel">
                                  <div className="topic-ai-tool-panel">
                                    <div className="topic-ai-selector-head">
                                      <div className="topic-ai-selector-title">课程实训工具</div>
                                      <div className="topic-ai-selector-hint">按分类多选工具，后续会自动纳入课程设计建议</div>
                                    </div>
                                    <div className="topic-ai-tool-search">
                                      <span>{aiSelectedTools.length ? `已选择 ${aiSelectedTools.length} 项工具` : '请选择实训工具（可多选）'}</span>
                                      <span>{selectedToolGroup.label}</span>
                                    </div>
                                    <div className="topic-ai-tool-content">
                                      <div className="topic-ai-tool-groups">
                                        {aiToolGroups.map((group) => (
                                          <button
                                            key={group.key}
                                            type="button"
                                            className={`topic-ai-tool-group ${group.key === aiSelectedToolGroup ? 'topic-ai-tool-group-active' : ''}`}
                                            onClick={() => setAiSelectedToolGroup(group.key)}
                                          >
                                            <span>{group.label}</span>
                                            <RightOutlined />
                                          </button>
                                        ))}
                                      </div>
                                      <div className="topic-ai-tool-options">
                                        {selectedToolGroup.items.map((item) => (
                                          <label
                                            key={item}
                                            className={`topic-ai-tool-option ${aiSelectedTools.includes(item) ? 'topic-ai-tool-option-active' : ''}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={aiSelectedTools.includes(item)}
                                              onChange={() => toggleAiToolSelection(item)}
                                            />
                                            <span>{item}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            ref={(node) => setAiToolbarAnchorRef('plus', node)}
                            className={`topic-ai-composer-plus ${aiActivePanel === 'plus' ? 'topic-ai-composer-plus-active' : ''}`}
                            aria-label="添加"
                            data-ai-panel-trigger="true"
                            aria-expanded={aiActivePanel === 'plus' ? 'true' : undefined}
                            onClick={() => toggleAiPanel('plus')}
                          >
                            <PlusOutlined />
                          </button>
                          <span className="topic-ai-composer-divider" />
                          <div className={`topic-ai-composer-skills ${aiSelectedSkill ? 'topic-ai-composer-skills-has-selection' : ''}`}>
                            {aiPrimarySkills.map((skill) => (
                              <button
                                key={skill.key}
                                type="button"
                                className={`topic-ai-composer-skill ${aiSelectedSkill === skill.label ? 'topic-ai-composer-skill-active' : ''}`}
                                title={skill.label}
                                onClick={() => {
                                  setAiSelectedSkill(skill.label);
                                  setAiActivePanel('course');
                                }}
                              >
                                <ThunderboltOutlined />
                                <span className="topic-ai-composer-skill-label">{skill.label}</span>
                                {aiSelectedSkill === skill.label ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="topic-ai-composer-skill-remove"
                                    aria-label="清空技能"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setAiSelectedSkill(null);
                                      setAiActivePanel('course');
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key !== 'Enter' && event.key !== ' ') return;
                                      event.preventDefault();
                                      event.stopPropagation();
                                      setAiSelectedSkill(null);
                                      setAiActivePanel('course');
                                    }}
                                  >
                                    <CloseOutlined />
                                  </span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                          {aiOverflowSkills.length ? (
                            <Dropdown
                              overlayClassName={TOPIC_DROPDOWN_OVERLAY_CLASS}
                              menu={{
                                items: aiOverflowSkills.map((skill) => ({
                                  key: skill.key,
                                  label: skill.label,
                                })),
                                onClick: ({ key }) => {
                                  const targetSkill = aiOverflowSkills.find((skill) => skill.key === key) || null;
                                  if (!targetSkill) return;
                                  setAiSelectedSkill(targetSkill.label);
                                  setAiActivePanel('course');
                                },
                              }}
                              trigger={['click']}
                            >
                              <button
                                type="button"
                                className="topic-ai-composer-overflow-btn"
                                aria-label="更多技能"
                              >
                                ...
                              </button>
                            </Dropdown>
                          ) : null}
                          {aiSelectedSkill ? <span className="topic-ai-composer-divider" /> : null}
                          {aiComposerItems.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              ref={(node) => {
                                if (item.key === 'structure') setAiToolbarAnchorRef('structure', node);
                                if (item.key === 'outline') setAiToolbarAnchorRef('outline', node);
                                if (item.key === 'tool') setAiToolbarAnchorRef('tool', node);
                              }}
                              className={`topic-ai-composer-chip ${(
                                (item.key === 'structure' && aiActivePanel === 'structure')
                                || (item.key === 'outline' && aiActivePanel === 'outline')
                                || (item.key === 'tool' && aiActivePanel === 'tool')
                              ) ? 'topic-ai-composer-chip-selected' : ''}`}
                              data-ai-panel-trigger="true"
                              aria-expanded={
                                (item.key === 'structure' && aiActivePanel === 'structure')
                                || (item.key === 'outline' && aiActivePanel === 'outline')
                                || (item.key === 'tool' && aiActivePanel === 'tool')
                                ? 'true'
                                : undefined
                              }
                              title={item.label}
                              onClick={() => {
                                if (item.key === 'structure') toggleAiPanel('structure');
                                if (item.key === 'outline') toggleAiPanel('outline');
                                if (item.key === 'tool') toggleAiPanel('tool');
                              }}
                            >
                              <span className="topic-ai-composer-chip-label">{item.label}</span>
                              <CaretDownOutlined />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className={`topic-ai-library ${aiLibraryCollapsed ? 'topic-ai-library-collapsed' : ''}`}>
                  <div className="topic-ai-library-head">
                    <span className="topic-ai-library-title">库</span>
                    <button
                      type="button"
                      className="topic-ai-library-toggle"
                      aria-label={aiLibraryCollapsed ? '展开库' : '收起库'}
                      onClick={() => setAiLibraryCollapsed((prev) => !prev)}
                    >
                      {aiLibraryCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </button>
                  </div>
                  {!aiLibraryCollapsed ? (
                    <>
                      <div className="topic-ai-library-body">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="暂无数据"
                          className="topic-ai-library-empty"
                        />
                      </div>
                      <div className="topic-ai-library-footer">
                        <button type="button" className="topic-ai-library-create">
                          <PlusOutlined />
                          <span>新建笔记</span>
                        </button>
                      </div>
                    </>
                  ) : null}
                </aside>
              </div>
            ) : (
              previewItem ? (
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
                      {canArchiveSceneResource && !previewItem.__kgMirror ? (
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
                                  {canEditDisplayedResources ? (
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
                          <Button icon={<PlusOutlined />} disabled={!canEditDisplayedResources} onClick={() => openAddResourceModal(currentListParentKey)}>{addResourceLabel}</Button>
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
                        <Button className="add-resource-btn" icon={<PlusOutlined />} disabled={!canEditDisplayedResources} onClick={() => openAddResourceModal(null)}>
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
              )
            )}
          </div>
        </div>
      )}

      <Modal
        title={knowledgeGraphPickerMode === 'add' ? '从资料库导入知识图谱' : '从资料库绑定知识图谱'}
        open={knowledgeGraphPickerOpen}
        onCancel={() => setKnowledgeGraphPickerOpen(false)}
        onOk={handleConfirmKnowledgeGraphBinding}
        okText={knowledgeGraphPickerMode === 'add' ? '导入图谱' : '绑定图谱'}
        cancelText="取消"
        okButtonProps={{ disabled: !selectedKnowledgeGraphResourceKey }}
        width={720}
        destroyOnClose
      >
        <div className="topic-knowledge-picker">
          <div className="topic-knowledge-picker-toolbar">
            <Segmented
              size="small"
              value={knowledgeGraphPickerScope}
              onChange={setKnowledgeGraphPickerScope}
              options={[
                { label: '全部', value: 'all' },
                { label: '个人库', value: 'personal' },
                { label: '组织库', value: 'organization' },
              ]}
            />
            <Input
              allowClear
              placeholder="搜索知识图谱名称"
              value={knowledgeGraphPickerKeyword}
              onChange={(event) => setKnowledgeGraphPickerKeyword(event.target.value)}
            />
          </div>
          <div className="topic-knowledge-picker-list">
            {knowledgeGraphPickerItems.length ? knowledgeGraphPickerItems.map((item) => (
              <button
                key={`${item.libraryId}:${item.key}`}
                type="button"
                className={`topic-knowledge-picker-item ${selectedKnowledgeGraphResourceKey === `${item.libraryId}:${item.key}` ? 'is-active' : ''}`}
                onClick={() => setSelectedKnowledgeGraphResourceKey(`${item.libraryId}:${item.key}`)}
              >
                <span className="topic-knowledge-picker-item-icon">
                  {renderFileIcon('knowledgeGraph', { fontSize: 18 })}
                </span>
                <span className="topic-knowledge-picker-item-copy">
                  <strong>{item.name}</strong>
                  <span>{item.libraryName} · {item.knowledgeGraphId}</span>
                  {item.contentText ? <span>{item.contentText}</span> : null}
                </span>
              </button>
            )) : (
              <div className="topic-knowledge-picker-empty">
                <Empty description="当前资料库里没有可绑定的知识图谱" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <AddResourceModal
        open={modalOpen}
        onClose={closeAddResourceModal}
        onAdd={handleAddResource}
        onPickLibrary={handlePickLibraryEntry}
        enabledEntries={enabledAddResourceEntries}
        hiddenTypes={knowledgeGraphRef ? ['knowledgeGraph'] : []}
      />

      <SpaceResourceImportModal
        open={resourceImportOpen}
        onClose={closeResourceImportModal}
        onConfirm={handleImportResourcesFromLibrary}
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
