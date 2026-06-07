import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Button, Input, Empty, Tooltip, Dropdown,
  Modal, Form, Select, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined,
  LeftOutlined, RightOutlined,
  FolderAddOutlined, FileAddOutlined,
  EditOutlined, DeleteOutlined,
  FolderFilled, DesktopOutlined,
  DownloadOutlined, ClockCircleOutlined,
  CloudOutlined, ShareAltOutlined, GlobalOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  CaretDownOutlined, MoreOutlined, CaretRightOutlined,
  FileTextOutlined, FilePdfOutlined, FileImageOutlined,
  PlayCircleOutlined, SoundOutlined, TagsOutlined,
  FileExcelOutlined, FileWordOutlined, FilePptOutlined,
  StarOutlined, StarFilled,
} from '@ant-design/icons';
import {
  loadResourceLib, addItem, renameItem, deleteItem, setSelectedFolder, inferFileType, moveItem,
  getTagDefinitions, addTagDefinition, reorderTagDefinition,
  addTagToItem, removeTagFromItem, toggleTagQuickAccess,
  getLibraryList, getLibraryId, getOrganizations, getTagGroups, setCurrentScope, setCurrentOrg, markItemOpened,
} from './resourceLibStore';
import { renderFileIcon } from './resourceIcons.jsx';
import ResourceLibraryOverlays from './ResourceLibraryOverlays.jsx';
import useResourceLibraryFileImport from './useResourceLibraryFileImport';
import './ResourceLibrary.css';

const ROOT_PARENT_KEY = '__resource_lib_root__';
const DETAIL_PREVIEW_MIN_WIDTH = 320;
const DETAIL_PREVIEW_MAX_WIDTH = 1120;
const DETAIL_PREVIEW_MIN_LIST_WIDTH = 260;
const DETAIL_PREVIEW_DEFAULT_RATIO = 0.5;
const FOLDER_HOVER_TIP_DELAY = 1;
const RESOURCE_LIB_HELP_TIPS = [
  '在文件夹上双击可进入文件夹。',
  '支持对文件、文件夹和空白区域使用鼠标右键操作。',
  '悬停行内按钮可快速添加资料或打开更多操作。',
];

export default function ResourceLibrary() {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState(() => data?.currentScope || 'personal');
  const [currentOrgId, setCurrentOrgId] = useState(() => data?.currentOrgId || 'org_default');
  const [keyword, setKeyword] = useState('');
  const [specialView, setSpecialView] = useState('all'); // all | recent
  const [searchMode, setSearchMode] = useState('name'); // name | content
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState('file');
  const [addForm] = Form.useForm();
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [tagFilterContextFolderKeys, setTagFilterContextFolderKeys] = useState([]);
  const [selectedItemKeys, setSelectedItemKeys] = useState([]); // 多选
  const [inlineRenameItemKey, setInlineRenameItemKey] = useState(null);
  const [inlineRenameName, setInlineRenameName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF3B30');
  const [newFolderParentKey, setNewFolderParentKey] = useState(null);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [tagPickerTarget, setTagPickerTarget] = useState(null); // 分栏视图中标签管理目标item key
  const [tagPickerGroupFilter, setTagPickerGroupFilter] = useState('all');
  const [tagPickerListScrollActive, setTagPickerListScrollActive] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogParentKey, setAddDialogParentKey] = useState(null);
  const [parseDrawerOpen, setParseDrawerOpen] = useState(false);
  const [showAllSidebarTags, setShowAllSidebarTags] = useState(false);
  const [folderHoverTip, setFolderHoverTip] = useState(null);
  const [contextMenuItemKey, setContextMenuItemKey] = useState(null);
  const [pendingNewFolder, setPendingNewFolder] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const initLibId = (data?.currentScope === 'organization' ? (data?.currentOrgId || 'org_default') : 'personal');
      return JSON.parse(localStorage.getItem(`guoren_rl_favorites_${initLibId}`) || '[]');
    } catch { return []; }
  }); // 侧栏快捷方式（按库隔离）
  const [hiddenSidebarFolders, setHiddenSidebarFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('guoren_rl_hidden_sidebar') || '[]'); } catch { return []; }
  });
  const [favDragOver, setFavDragOver] = useState(false);
  const [favDragIdx, setFavDragIdx] = useState(null); // 拖拽排序中的源索引
  const [favDropIdx, setFavDropIdx] = useState(null); // 拖抽插入位置指示器
  const [tagDragIdx, setTagDragIdx] = useState(null); // 标签拖拽源索引（当前显示列表）
  const [tagDropIdx, setTagDropIdx] = useState(null); // 标签拖拽插入位置（当前显示列表）
  const [tagDropTargetId, setTagDropTargetId] = useState(null); // 拖入资料时高亮的标签
  const [dragOverFolderKey, setDragOverFolderKey] = useState(null); // 当前拖放目标文件夹 key
  const [navHistory, setNavHistory] = useState([null]); // 导航历史
  const [navIndex, setNavIndex] = useState(0);
  const [viewMode, setViewMode] = useState('detail'); // detail | column
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // 详情视图中展开的文件夹 key
  const [sortBy, setSortBy] = useState('name'); // name | kind | date | size | tag
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  // 详情视图各列宽度（可拖拽调整）
  const [detailColWidths, setDetailColWidths] = useState({
    name: 320, date: 120, size: 80, kind: 80,
    createdAt: 140, addedAt: 140, lastOpenedAt: 140, tags: 100, comment: 140, version: 80,
  });
  // 详情视图可见列（顺序决定显示顺序）
  const [visibleCols, setVisibleCols] = useState(['date', 'size', 'kind']);
  // 名称列是否被拖过：默认 false 时名称列使用 flex:1 占满剩余空间
  const [nameColResized, setNameColResized] = useState(false);
  const detailColResizeRef = useRef(null);
  const handleDetailColResizeStart = (field, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (field === 'name') setNameColResized(true);
    const startX = e.clientX;
    const startWidth = field === 'name' && !nameColResized
      ? (e.currentTarget?.parentElement?.getBoundingClientRect().width || detailColWidths.name)
      : detailColWidths[field];
    detailColResizeRef.current = { field, startX, startWidth };
    const onMove = (ev) => {
      if (!detailColResizeRef.current) return;
      const delta = ev.clientX - detailColResizeRef.current.startX;
      const newW = Math.max(80, Math.min(600, detailColResizeRef.current.startWidth + delta));
      setDetailColWidths((w) => ({ ...w, [detailColResizeRef.current.field]: newW }));
    };
    const onUp = () => {
      detailColResizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  // 点击表头：同列切换升降序，换列重置为该列默认顺序
  const handleHeaderSort = (field) => {
    if (field === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      // 默认顺序：名称/种类升序，日期/大小/标签降序
      setSortOrder(field === 'name' || field === 'kind' ? 'asc' : 'desc');
    }
  };
  const [newFolderInline, setNewFolderInline] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef(null);
  const inlineRenameInputRef = useRef(null);
  const pendingRenameTriggerRef = useRef(null);
  const columnScrollRef = useRef(null);
  // 分栏视图状态：各层打开的文件夹 key 路径
  const [columnPath, setColumnPath] = useState([null]); // [null, folderKey1, folderKey2, ...]
  const [columnSelectedItem, setColumnSelectedItem] = useState(null); // 分栏视图中选中的文件
  // 侧栏宽度拖拽
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const sidebarDragRef = useRef(null);
  // 预览面板宽度拖拽
  const [previewWidth, setPreviewWidth] = useState(560);
  const tagPickerScrollTimerRef = useRef(null);
  const previewDragRef = useRef(null);
  const contentAreaRef = useRef(null);
  const searchBoxRef = useRef(null);
  const folderHoverTipTimerRef = useRef(null);
  // 记录用户是否在列表视图下手动拖过，避免覆盖用户选择
  const previewListResizedRef = useRef(false);
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    sidebarDragRef.current = { startX, startWidth };
    const onMouseMove = (ev) => {
      if (!sidebarDragRef.current) return;
      const delta = ev.clientX - sidebarDragRef.current.startX;
      const newWidth = Math.max(140, Math.min(400, sidebarDragRef.current.startWidth + delta));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      sidebarDragRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  const clearTagPickerScrollTimer = useCallback(() => {
    if (!tagPickerScrollTimerRef.current) return;
    window.clearTimeout(tagPickerScrollTimerRef.current);
    tagPickerScrollTimerRef.current = null;
  }, []);

  const handleTagPickerListScroll = useCallback(() => {
    setTagPickerListScrollActive(true);
    clearTagPickerScrollTimer();
    tagPickerScrollTimerRef.current = window.setTimeout(() => {
      setTagPickerListScrollActive(false);
      tagPickerScrollTimerRef.current = null;
    }, 640);
  }, [clearTagPickerScrollTimer]);

  const handlePreviewResizeStart = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = previewWidth;
    previewListResizedRef.current = true;
    previewDragRef.current = { startX, startWidth };
    const onMouseMove = (ev) => {
      if (!previewDragRef.current) return;
      const delta = previewDragRef.current.startX - ev.clientX;
      const containerW = contentAreaRef.current?.getBoundingClientRect().width || 1600;
      const upper = Math.min(
        DETAIL_PREVIEW_MAX_WIDTH,
        Math.max(DETAIL_PREVIEW_MIN_WIDTH, Math.round(containerW - DETAIL_PREVIEW_MIN_LIST_WIDTH)),
      );
      const newWidth = Math.max(
        DETAIL_PREVIEW_MIN_WIDTH,
        Math.min(upper, previewDragRef.current.startWidth + delta),
      );
      setPreviewWidth(newWidth);
    };
    const onMouseUp = () => {
      previewDragRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [previewWidth]);

  const clearFolderHoverTipTimer = useCallback(() => {
    if (!folderHoverTipTimerRef.current) return;
    clearTimeout(folderHoverTipTimerRef.current);
    folderHoverTipTimerRef.current = null;
  }, []);

  const getFolderHoverTipPosition = useCallback((clientX, clientY) => {
    const tipWidth = 132;
    const tipHeight = 34;
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const nextX = Math.min(clientX + 14, Math.max(8, viewportWidth - tipWidth));
    const nextY = Math.min(clientY + 18, Math.max(8, viewportHeight - tipHeight));
    return { x: nextX, y: nextY };
  }, []);

  const handleFolderHoverEnter = useCallback((itemKey, event) => {
    clearFolderHoverTipTimer();
    const position = getFolderHoverTipPosition(event.clientX, event.clientY);
    setFolderHoverTip({ key: itemKey, ...position, visible: false });
    folderHoverTipTimerRef.current = window.setTimeout(() => {
      setFolderHoverTip((prev) => (prev?.key === itemKey ? { ...prev, visible: true } : prev));
      folderHoverTipTimerRef.current = null;
    }, FOLDER_HOVER_TIP_DELAY * 1000);
  }, [clearFolderHoverTipTimer, getFolderHoverTipPosition]);

  const handleFolderHoverMove = useCallback((itemKey, event) => {
    const position = getFolderHoverTipPosition(event.clientX, event.clientY);
    setFolderHoverTip((prev) => (prev?.key === itemKey ? { ...prev, ...position } : prev));
  }, [getFolderHoverTipPosition]);

  const hideFolderHoverTip = useCallback((itemKey) => {
    clearFolderHoverTipTimer();
    setFolderHoverTip((prev) => {
      if (!prev) return null;
      if (itemKey && prev.key !== itemKey) return prev;
      return null;
    });
  }, [clearFolderHoverTipTimer]);

  // 列表视图预览区默认更宽，用户手动拖过后不再覆盖
  useEffect(() => {
    if (viewMode !== 'detail' || previewListResizedRef.current) return;
    const el = contentAreaRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w > 0) {
      const upper = Math.min(
        DETAIL_PREVIEW_MAX_WIDTH,
        Math.max(DETAIL_PREVIEW_MIN_WIDTH, Math.round(w - DETAIL_PREVIEW_MIN_LIST_WIDTH)),
      );
      const nextWidth = Math.max(
        DETAIL_PREVIEW_MIN_WIDTH,
        Math.min(Math.round(w * DETAIL_PREVIEW_DEFAULT_RATIO), upper),
      );
      setPreviewWidth(nextWidth);
    }
  }, [viewMode]);
  // 分栏视图列宽拖拽
  const [columnWidths, setColumnWidths] = useState({}); // { colIdx: width }
  const dragRef = useRef(null);
  const handleColumnResizeStart = useCallback((colIdx, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const colEl = e.target.parentElement;
    const startWidth = colEl?.getBoundingClientRect().width || 220;
    dragRef.current = { colIdx, startX, startWidth };
    const onMouseMove = (ev) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      const newWidth = Math.max(140, Math.min(500, dragRef.current.startWidth + delta));
      setColumnWidths((prev) => ({ ...prev, [dragRef.current.colIdx]: newWidth }));
    };
    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const list = getLibraryList(data, scope);
  const libraryId = getLibraryId(data, scope);
  const selectedFolderKey = data.selectedFolderKey?.[libraryId] ?? null;
  const organizations = getOrganizations(data);
  const tagDefs = getTagDefinitions(data, scope);
  const tagGroups = getTagGroups(data, scope);
  const quickTagDefs = useMemo(
    () => tagDefs.filter((tag) => tag.quick),
    [tagDefs],
  );
  const menuQuickTagDefs = useMemo(
    () => (quickTagDefs.length > 0 ? quickTagDefs : tagDefs.slice(0, 7)),
    [quickTagDefs, tagDefs],
  );
  const normalizedKeyword = keyword.trim();
  const hasActiveSearch = normalizedKeyword.length > 0;
  const normalizedKeywordLower = normalizedKeyword.toLowerCase();
  const isRecentView = specialView === 'recent';

  const parseDateValue = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date) return value.getTime();
    const normalized = String(value)
      .trim()
      .replace(/[年.-]/g, '/')
      .replace(/月/g, '/')
      .replace(/日/g, '')
      .replace(/\s+/g, ' ');
    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  const sortLibraryItems = useCallback((items) => [...items].sort((a, b) => {
    const pendingParentKey = pendingNewFolder?.parentKey ?? null;
    if (
      pendingNewFolder?.key
      && (a.parentKey ?? null) === pendingParentKey
      && (b.parentKey ?? null) === pendingParentKey
    ) {
      if (a.key === pendingNewFolder.key && b.key !== pendingNewFolder.key) return 1;
      if (b.key === pendingNewFolder.key && a.key !== pendingNewFolder.key) return -1;
    }
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    let cmp = 0;
    switch (sortBy) {
      case 'name': cmp = (a.name || '').localeCompare(b.name || '', 'zh'); break;
      case 'kind': cmp = (a.fileType || '').localeCompare(b.fileType || ''); break;
      case 'date': cmp = (a.lastEdit || '').localeCompare(b.lastEdit || ''); break;
      case 'size': cmp = (a.size || 0) - (b.size || 0); break;
      case 'tag': cmp = (a.tags || []).length - (b.tags || []).length; break;
      default: cmp = 0;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  }), [pendingNewFolder, sortBy, sortOrder]);

  const getItemContentSearchText = useCallback((item) => {
    const tagNames = (item.tags || [])
      .map((tagId) => tagDefs.find((tag) => tag.id === tagId)?.name)
      .filter(Boolean)
      .join(' ');
    const chunkText = Array.isArray(item.contentChunks)
      ? item.contentChunks.map((chunk) => (typeof chunk === 'string' ? chunk : chunk?.text || '')).join(' ')
      : '';
    return [
      item.contentText,
      item.summary,
      item.description,
      item.comment,
      item.extractedText,
      item.ocrText,
      item.transcript,
      item.noteText,
      item.text,
      chunkText,
      tagNames,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }, [tagDefs]);

  const matchesSearch = useCallback((item) => {
    if (!hasActiveSearch) return true;
    if (searchMode === 'content') {
      return getItemContentSearchText(item).includes(normalizedKeywordLower);
    }
    return (item.name || '').toLowerCase().includes(normalizedKeywordLower);
  }, [getItemContentSearchText, hasActiveSearch, normalizedKeywordLower, searchMode]);

  const searchResults = useMemo(() => {
    if (!hasActiveSearch) return [];
    return sortLibraryItems(list.filter(matchesSearch));
  }, [hasActiveSearch, list, matchesSearch, sortLibraryItems]);

  const recentItems = useMemo(() => {
    const nowTs = Date.now();
    const monthAgoTs = nowTs - 30 * 24 * 60 * 60 * 1000;
    return list
      .filter((item) => !item.isFolder)
      .map((item) => ({ item, openedAtTs: parseDateValue(item.lastOpenedAt) }))
      .filter(({ openedAtTs }) => openedAtTs && openedAtTs >= monthAgoTs && openedAtTs <= nowTs)
      .sort((a, b) => b.openedAtTs - a.openedAtTs)
      .map(({ item }) => item);
  }, [list, parseDateValue]);

  // 库切换时：重新加载该库的收藏，清空选中/过滤/导航历史
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(`guoren_rl_favorites_${libraryId}`) || '[]');
      setFavorites(favs);
    } catch { setFavorites([]); }
    setActiveTagFilter(null);
    setKeyword('');
    setSpecialView('all');
    setSearchPanelOpen(false);
    setSelectedItemKeys([]);
    setTagFilterContextFolderKeys([]);
    setInlineRenameItemKey(null);
    setInlineRenameName('');
    setNewFolderInline(false);
    setNewFolderName('');
    setNewFolderParentKey(null);
    setColumnPath([null]);
    setColumnSelectedItem(null);
    setNavHistory([null]);
    setNavIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryId]);

  useEffect(() => {
    setFavorites((prev) => {
      const nextFavs = prev.filter((fav) => list.some((item) => item.key === fav.key && item.isFolder));
      if (nextFavs.length !== prev.length) {
        localStorage.setItem(`guoren_rl_favorites_${libraryId}`, JSON.stringify(nextFavs));
      }
      return nextFavs;
    });
  }, [libraryId, list]);

  useEffect(() => {
    setShowAllSidebarTags(false);
  }, [activeTagFilter, columnPath, libraryId, normalizedKeyword, searchMode, selectedFolderKey, specialView, viewMode]);

  useEffect(() => {
    setInlineRenameItemKey(null);
    setInlineRenameName('');
    setNewFolderInline(false);
    setNewFolderName('');
    setNewFolderParentKey(null);
  }, [libraryId, normalizedKeyword, searchMode, selectedFolderKey, specialView, viewMode]);

  useEffect(() => {
    if (!activeTagFilter && tagFilterContextFolderKeys.length > 0) {
      setTagFilterContextFolderKeys([]);
    }
  }, [activeTagFilter, tagFilterContextFolderKeys.length]);

  useEffect(() => {
    setTagFilterContextFolderKeys([]);
  }, [libraryId, normalizedKeyword, searchMode, selectedFolderKey, specialView, viewMode]);

  useEffect(() => {
    setTagPickerGroupFilter('all');
    setTagPickerListScrollActive(false);
    clearTagPickerScrollTimer();
  }, [clearTagPickerScrollTimer, tagPickerTarget, scope]);

  useEffect(() => {
    if (tagPickerGroupFilter !== 'all' && !tagGroups.some((group) => group.id === tagPickerGroupFilter)) {
      setTagPickerGroupFilter('all');
    }
  }, [tagGroups, tagPickerGroupFilter]);

  useEffect(() => {
    if (contextMenuItemKey && !list.some((item) => item.key === contextMenuItemKey)) {
      setContextMenuItemKey(null);
    }
  }, [contextMenuItemKey, list]);

  // 切换个人/组织库
  const handleScopeChange = (nextScope) => {
    if (nextScope === scope) return;
    setScope(nextScope);
    setData((d) => setCurrentScope(d, nextScope));
  };

  // 切换组织
  const handleOrgChange = (orgId) => {
    if (orgId === currentOrgId) return;
    setCurrentOrgId(orgId);
    setData((d) => setCurrentOrg(d, orgId));
  };

  const recordItemOpened = useCallback((item) => {
    if (!item || item.isFolder) return;
    setData((d) => markItemOpened(d, scope, item.key));
  }, [scope]);

  // 当前文件夹信息
  const currentFolder = useMemo(
    () => (selectedFolderKey ? list.find((r) => r.key === selectedFolderKey) : null),
    [list, selectedFolderKey],
  );

  const detailContextItems = useMemo(() => {
    if (hasActiveSearch) return searchResults;
    if (isRecentView) return recentItems;
    return sortLibraryItems(list.filter((r) => r.parentKey === selectedFolderKey));
  }, [hasActiveSearch, isRecentView, list, recentItems, searchResults, selectedFolderKey, sortLibraryItems]);

  const columnContextItems = useMemo(() => {
    if (hasActiveSearch) return searchResults;
    if (isRecentView) return recentItems;
    const parentKey = columnPath[columnPath.length - 1] ?? null;
    return sortLibraryItems(list.filter((item) => item.parentKey === parentKey));
  }, [columnPath, hasActiveSearch, isRecentView, list, recentItems, searchResults, sortLibraryItems]);

  const folderContextItemMap = useMemo(
    () => new Map(list.map((item) => [item.key, item])),
    [list],
  );

  const folderContextChildMap = useMemo(() => {
    const childMap = new Map();
    list.forEach((item) => {
      const siblings = childMap.get(item.parentKey) || [];
      siblings.push(item);
      childMap.set(item.parentKey, siblings);
    });
    return childMap;
  }, [list]);

  const collectFolderContextItems = useCallback((folderKeys = []) => {
    const selectedFolders = folderKeys
      .map((key) => folderContextItemMap.get(key))
      .filter((item) => item?.isFolder);

    if (selectedFolders.length === 0) return [];

    const collected = [];
    const visited = new Set();
    const visit = (item) => {
      if (!item || visited.has(item.key)) return;
      visited.add(item.key);
      collected.push(item);
      if (!item.isFolder) return;
      (folderContextChildMap.get(item.key) || []).forEach(visit);
    };

    selectedFolders.forEach(visit);
    return collected;
  }, [folderContextChildMap, folderContextItemMap]);

  const selectedFolderContextKeys = useMemo(() => {
    if (viewMode !== 'detail' || selectedItemKeys.length === 0) return [];
    return selectedItemKeys.filter((key) => folderContextItemMap.get(key)?.isFolder);
  }, [folderContextItemMap, selectedItemKeys, viewMode]);

  const selectedFolderContextItems = useMemo(() => {
    if (selectedFolderContextKeys.length === 0) return [];
    return collectFolderContextItems(selectedFolderContextKeys);
  }, [collectFolderContextItems, selectedFolderContextKeys]);

  const selectedFileContextItems = useMemo(() => {
    if (viewMode !== 'detail' || selectedItemKeys.length === 0) return [];
    const collected = [];
    const visited = new Set();

    const collectAncestors = (item) => {
      let parentKey = item?.parentKey;
      while (parentKey) {
        const parent = folderContextItemMap.get(parentKey);
        if (!parent?.isFolder) break;
        if (!visited.has(parent.key)) {
          visited.add(parent.key);
          collected.push(parent);
        }
        parentKey = parent.parentKey;
      }
    };

    selectedItemKeys.forEach((key) => {
      const item = folderContextItemMap.get(key);
      if (!item || item.isFolder || visited.has(item.key)) return;
      visited.add(item.key);
      collected.push(item);
      collectAncestors(item);
    });

    return collected;
  }, [folderContextItemMap, selectedItemKeys, viewMode]);

  const persistedTagFilterContextItems = useMemo(() => {
    if (viewMode !== 'detail' || !activeTagFilter || tagFilterContextFolderKeys.length === 0) return [];
    return collectFolderContextItems(tagFilterContextFolderKeys);
  }, [activeTagFilter, collectFolderContextItems, tagFilterContextFolderKeys, viewMode]);

  // 当前上下文下的子项
  const currentChildren = useMemo(() => {
    if (!activeTagFilter) return detailContextItems;
    if (persistedTagFilterContextItems.length > 0) {
      return sortLibraryItems(
        persistedTagFilterContextItems.filter((item) => (item.tags || []).includes(activeTagFilter)),
      );
    }
    return detailContextItems.filter((item) => (item.tags || []).includes(activeTagFilter));
  }, [activeTagFilter, detailContextItems, persistedTagFilterContextItems, sortLibraryItems]);

  const sidebarTagContextItems = useMemo(() => {
    if (viewMode === 'column') return columnContextItems;
    if (activeTagFilter && persistedTagFilterContextItems.length > 0) return persistedTagFilterContextItems;
    if (selectedFolderContextItems.length > 0) return selectedFolderContextItems;
    if (selectedFileContextItems.length > 0) return selectedFileContextItems;
    return detailContextItems;
  }, [
    activeTagFilter,
    columnContextItems,
    detailContextItems,
    persistedTagFilterContextItems,
    selectedFileContextItems,
    selectedFolderContextItems,
    viewMode,
  ]);

  const allSidebarTagEntries = useMemo(() => tagDefs, [tagDefs]);

  const contextualSidebarTagSourceMap = useMemo(() => {
    const sourceMap = new Map();

    const markSource = (items, sourceKey) => {
      items.forEach((item) => {
        (item?.tags || []).forEach((tagId) => {
          const prev = sourceMap.get(tagId) || { fromFolder: false, fromContent: false };
          sourceMap.set(tagId, { ...prev, [sourceKey]: true });
        });
      });
    };

    if (viewMode === 'column') {
      markSource(columnContextItems.filter((item) => item.isFolder), 'fromFolder');
      markSource(columnContextItems.filter((item) => !item.isFolder), 'fromContent');
      return sourceMap;
    }

    if (activeTagFilter && persistedTagFilterContextItems.length > 0) {
      const contextFolderKeySet = new Set(tagFilterContextFolderKeys);
      markSource(
        persistedTagFilterContextItems.filter((item) => contextFolderKeySet.has(item.key)),
        'fromFolder',
      );
      markSource(
        persistedTagFilterContextItems.filter((item) => !contextFolderKeySet.has(item.key)),
        'fromContent',
      );
      return sourceMap;
    }

    if (selectedFolderContextItems.length > 0) {
      const selectedFolderKeySet = new Set(selectedFolderContextKeys);
      markSource(
        selectedFolderContextItems.filter((item) => selectedFolderKeySet.has(item.key)),
        'fromFolder',
      );
      markSource(
        selectedFolderContextItems.filter((item) => !selectedFolderKeySet.has(item.key)),
        'fromContent',
      );
      return sourceMap;
    }

    if (selectedFileContextItems.length > 0) {
      markSource(selectedFileContextItems.filter((item) => item.isFolder), 'fromFolder');
      markSource(selectedFileContextItems.filter((item) => !item.isFolder), 'fromContent');
      return sourceMap;
    }

    if (!hasActiveSearch && !isRecentView && currentFolder) {
      // 已进入文件夹时，不再把“当前文件夹自身”的标签计入上下文，
      // 只展示该文件夹内容里的标签来源，避免侧栏重复强调当前文件夹标签。
      markSource(detailContextItems.filter((item) => item.isFolder), 'fromFolder');
      markSource(detailContextItems.filter((item) => !item.isFolder), 'fromContent');
      return sourceMap;
    }

    markSource(sidebarTagContextItems.filter((item) => item.isFolder), 'fromFolder');
    markSource(sidebarTagContextItems.filter((item) => !item.isFolder), 'fromContent');
    return sourceMap;
  }, [
    activeTagFilter,
    columnContextItems,
    currentFolder,
    detailContextItems,
    hasActiveSearch,
    isRecentView,
    persistedTagFilterContextItems,
    selectedFileContextItems,
    selectedFolderContextItems,
    selectedFolderContextKeys,
    sidebarTagContextItems,
    tagFilterContextFolderKeys,
    viewMode,
  ]);

  const contextualSidebarTagEntries = useMemo(() => {
    const visibleTagIds = new Set(contextualSidebarTagSourceMap.keys());
    if (activeTagFilter) visibleTagIds.add(activeTagFilter);
    return allSidebarTagEntries.filter((tag) => visibleTagIds.has(tag.id));
  }, [activeTagFilter, allSidebarTagEntries, contextualSidebarTagSourceMap]);

  const sidebarTagEntries = showAllSidebarTags ? allSidebarTagEntries : contextualSidebarTagEntries;
  const sidebarTagToggleLabel = showAllSidebarTags
    ? '只看当前标签'
    : contextualSidebarTagEntries.length > 0
      ? '所有标签...'
      : '显示全部标签...';

  // 详情视图递归展开后的表示列表（带 depth 缩进）
  const displayChildren = useMemo(() => {
    if (viewMode !== 'detail') return currentChildren.map((it) => ({ ...it, _depth: 0 }));
    if (hasActiveSearch || isRecentView || activeTagFilter) return currentChildren.map((it) => ({ ...it, _depth: 0 }));
    const result = [];
    const walk = (items, depth) => {
      const sorted = sortLibraryItems(items);
      sorted.forEach((it) => {
        result.push({ ...it, _depth: depth });
        if (it.isFolder && expandedFolders.has(it.key)) {
          const childItems = list.filter((r) => r.parentKey === it.key);
          walk(childItems, depth + 1);
        }
      });
    };
    walk(currentChildren, 0);
    return result;
  }, [activeTagFilter, currentChildren, expandedFolders, hasActiveSearch, isRecentView, list, sortLibraryItems, viewMode]);

  // 详情视图可选列定义（顺序 = 菜单顺序）
  const COL_DEFS = [
    { key: 'date', label: '修改日期', sortable: true },
    { key: 'createdAt', label: '创建日期', sortable: false },
    { key: 'lastOpenedAt', label: '上次打开日期', sortable: false },
    { key: 'addedAt', label: '添加日期', sortable: false },
    { key: 'size', label: '大小', sortable: true },
    { key: 'kind', label: '种类', sortable: true },
    { key: 'version', label: '版本', sortable: false },
    { key: 'comment', label: '注释', sortable: false },
    { key: 'tags', label: '标签', sortable: false },
  ];
  // 渲染某列单元格内容
  const renderColCell = (colKey, item) => {
    switch (colKey) {
      case 'date': return item.lastEdit || '--';
      case 'createdAt': return item.createdAt || item.lastEdit || '--';
      case 'lastOpenedAt': return item.lastOpenedAt || '--';
      case 'addedAt': return item.addedAt || item.lastEdit || '--';
      case 'size': return item.size ? `${(item.size / 1024).toFixed(1)} KB` : '--';
      case 'kind': return item.isFolder ? '文件夹' : (item.fileType || '--');
      case 'version': return item.version || '--';
      case 'comment': return item.comment || '--';
      case 'tags': {
        const tagsArr = (item.tags || []).map((tid) => tagDefs.find((t) => t.id === tid)).filter(Boolean);
        if (tagsArr.length === 0) return '--';
        const tagText = tagsArr.map((t) => t.name).join('、');
        return (
          <span className="finder-detail-tags-text" title={tagText}>
            <span className="finder-detail-tags-dots">
              {tagsArr.slice(0, 5).map((t) => (
                <span key={t.id} className="finder-detail-tags-dot" style={{ background: t.color }} />
              ))}
            </span>
            <span className="finder-detail-tags-text-value">{tagText}</span>
          </span>
        );
      }
      default: return '--';
    }
  };
  // 表头右键菜单：列显示设置
  const colVisibilityMenu = {
    items: COL_DEFS.map((c) => ({
      key: c.key,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
          <span style={{ width: 14, display: 'inline-block', textAlign: 'center', color: '#1677ff' }}>
            {visibleCols.includes(c.key) ? '✓' : ''}
          </span>
          {c.label}
        </span>
      ),
    })),
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      setVisibleCols((prev) => {
        if (prev.includes(key)) return prev.filter((k) => k !== key);
        // 按原始定义顺序插入
        const next = [...prev, key];
        return COL_DEFS.map((c) => c.key).filter((k) => next.includes(k));
      });
    },
  };
  // 可见列总宽（用于计算 actions 位置）
  const visibleColsTotalWidth = visibleCols.reduce((sum, k) => sum + (detailColWidths[k] || 100), 0);

  // 侧栏收藏夹项目（根文件夹）
  const rootFolders = useMemo(
    () => list.filter((r) => r.isFolder && r.parentKey === null && !hiddenSidebarFolders.includes(r.key)),
    [list, hiddenSidebarFolders],
  );

  // 面包屑路径
  const breadcrumb = useMemo(() => {
    const path = [];
    let curr = currentFolder;
    while (curr) {
      path.unshift(curr);
      curr = list.find((r) => r.key === curr.parentKey);
    }
    return path;
  }, [currentFolder, list]);

  const activeTagFilterDef = useMemo(
    () => tagDefs.find((tag) => tag.id === activeTagFilter) || null,
    [activeTagFilter, tagDefs],
  );

  const tagFilterContextFolders = useMemo(
    () => tagFilterContextFolderKeys
      .map((key) => folderContextItemMap.get(key))
      .filter((item) => item?.isFolder),
    [folderContextItemMap, tagFilterContextFolderKeys],
  );

  const isTagFilterContextActive = viewMode === 'detail'
    && !!activeTagFilter
    && tagFilterContextFolders.length > 0;

  const tagFilterContextLabel = useMemo(() => {
    if (tagFilterContextFolders.length === 0) return '';
    if (tagFilterContextFolders.length === 1) return tagFilterContextFolders[0].name;
    return `${tagFilterContextFolders[0].name} 等 ${tagFilterContextFolders.length} 个文件夹`;
  }, [tagFilterContextFolders]);

  const buildFolderBreadcrumb = useCallback((folderKey) => {
    const path = [];
    let curr = folderContextItemMap.get(folderKey);
    while (curr?.isFolder) {
      path.unshift(curr);
      curr = curr.parentKey ? folderContextItemMap.get(curr.parentKey) : null;
    }
    return path;
  }, [folderContextItemMap]);

  const tagFilterContextBreadcrumb = useMemo(() => {
    if (!isTagFilterContextActive || tagFilterContextFolders.length !== 1) return [];
    return buildFolderBreadcrumb(tagFilterContextFolders[0].key);
  }, [buildFolderBreadcrumb, isTagFilterContextActive, tagFilterContextFolders]);

  const restoreTagFilterContext = useCallback(() => {
    const restoreKeys = tagFilterContextFolders.map((item) => item.key);
    setActiveTagFilter(null);
    setTagFilterContextFolderKeys([]);
    setSelectedItemKeys(restoreKeys);
    setColumnSelectedItem(null);
  }, [tagFilterContextFolders]);

  const canNavigateBack = navIndex > 0 || isTagFilterContextActive;
  const canNavigateForward = navIndex < navHistory.length - 1;

  // ====== 操作 ======
  const navigateTo = (folderKey) => {
    clearPendingRenameTrigger();
    setSpecialView('all');
    setData((d) => setSelectedFolder(d, scope, folderKey));
    setActiveTagFilter(null);
    setSelectedItemKeys([]);
    const newHistory = navHistory.slice(0, navIndex + 1);
    newHistory.push(folderKey);
    setNavHistory(newHistory);
    setNavIndex(newHistory.length - 1);
    // 同步分栏视图的 columnPath
    if (viewMode === 'column') {
      if (folderKey) {
        // 直接以该文件夹为起点，显示其子内容
        setColumnPath([folderKey]);
      } else {
        setColumnPath([null]);
      }
      setColumnSelectedItem(null);
      setTimeout(() => {
        columnScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleBack = () => {
    clearPendingRenameTrigger();
    if (isTagFilterContextActive) {
      restoreTagFilterContext();
      return;
    }
    if (navIndex > 0) {
      const newIndex = navIndex - 1;
      setNavIndex(newIndex);
      setSpecialView('all');
      setData((d) => setSelectedFolder(d, scope, navHistory[newIndex]));
      setActiveTagFilter(null);
      setSelectedItemKeys([]);
      setColumnSelectedItem(null);
    }
  };

  const handleForward = () => {
    clearPendingRenameTrigger();
    if (navIndex < navHistory.length - 1) {
      const newIndex = navIndex + 1;
      setNavIndex(newIndex);
      setSpecialView('all');
      setData((d) => setSelectedFolder(d, scope, navHistory[newIndex]));
      setActiveTagFilter(null);
      setSelectedItemKeys([]);
      setColumnSelectedItem(null);
    }
  };

  const openRecentView = () => {
    clearPendingRenameTrigger();
    setSpecialView('recent');
    setActiveTagFilter(null);
    setKeyword('');
    setSearchPanelOpen(false);
    setSelectedItemKeys([]);
    setColumnSelectedItem(null);
    setColumnPath([null]);
    setData((d) => setSelectedFolder(d, scope, null));
  };

  const handleDelete = (key) => {
    const targetItem = list.find((item) => item.key === key);
    const targetName = targetItem?.name || '该项目';
    Modal.confirm({
      title: '确认删除',
      icon: null,
      content: `确定要删除“${targetName}”吗？${targetItem?.isFolder ? '删除文件夹会同时删除其中全部内容。' : ''}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setData((d) => deleteItem(d, scope, key));
        if (selectedFolderKey === key) navigateTo(null);
        message.success('已删除');
      },
    });
  };

  const handleRename = (item) => {
    startInlineRename(item);
  };

  // ====== 侧栏快捷方式（拖拽收藏） ======
  const saveFavorites = (newFavs) => {
    setFavorites(newFavs);
    localStorage.setItem(`guoren_rl_favorites_${libraryId}`, JSON.stringify(newFavs));
  };
  const handleFavDrop = (e) => {
    e.preventDefault();
    setFavDragOver(false);
    setFavDropIdx(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const itemData = JSON.parse(raw);
      if (!itemData || !itemData.key) return;

      // 内部排序（收藏项之间拖拽）
      if (favDragIdx !== null) {
        const newFavs = [...favorites];
        const [moved] = newFavs.splice(favDragIdx, 1);
        const targetIdx = favDropIdx !== null ? (favDropIdx > favDragIdx ? favDropIdx - 1 : favDropIdx) : newFavs.length;
        newFavs.splice(targetIdx, 0, moved);
        saveFavorites(newFavs);
        setFavDragIdx(null);
        return;
      }

      // 外部拖入（从分栏视图拖入）
      if (!itemData.isFolder) {
        message.warning('仅文件夹可添加到收藏');
        return;
      }
      if (favorites.some((f) => f.key === itemData.key)) {
        message.info('该项已在收藏中');
        return;
      }
      const insertAt = favDropIdx !== null ? favDropIdx : favorites.length;
      const newFavs = [...favorites];
      newFavs.splice(insertAt, 0, { key: itemData.key, name: itemData.name, isFolder: itemData.isFolder, fileType: itemData.fileType });
      saveFavorites(newFavs);
      message.success(`「${itemData.name}」已添加到收藏`);
    } catch { /* ignore */ }
  };
  const handleFavSectionDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = favDragIdx !== null ? 'move' : 'link';
    setFavDragOver(true);
    // 根据鼠标 Y 与每个 fav 项中点比较，计算 favDropIdx
    const items = e.currentTarget.querySelectorAll('[data-fav-idx]');
    if (items.length === 0) {
      setFavDropIdx(0);
      return;
    }
    let dropIdx = items.length;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) { dropIdx = i; break; }
    }
    setFavDropIdx(dropIdx);
  };
  const handleFavItemDragOver = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setFavDropIdx(e.clientY < midY ? idx : idx + 1);
  };
  const removeFavorite = (key) => {
    saveFavorites(favorites.filter((f) => f.key !== key));
  };
  const renameFavorite = (fav) => {
    let newName = fav.name;
    Modal.confirm({
      title: '重命名收藏',
      icon: null,
      content: <Input defaultValue={fav.name} onChange={(e) => { newName = e.target.value; }} placeholder="请输入新名称" />,
      onOk: () => {
        const trimmed = (newName || '').trim();
        if (!trimmed) { message.warning('名称不能为空'); return Promise.reject(); }
        saveFavorites(favorites.map((f) => f.key === fav.key ? { ...f, name: trimmed } : f));
        message.success('已重命名');
      },
    });
  };

  const renameSidebarFolder = (folder) => {
    let newName = folder.name;
    Modal.confirm({
      title: '重命名文件夹',
      icon: null,
      content: <Input defaultValue={folder.name} onChange={(e) => { newName = e.target.value; }} placeholder="请输入新名称" />,
      onOk: () => {
        const trimmed = (newName || '').trim();
        if (!trimmed) { message.warning('名称不能为空'); return Promise.reject(); }
        setData((d) => renameItem(d, scope, folder.key, trimmed));
        message.success('已重命名');
      },
    });
  };

  const hideSidebarFolder = (key) => {
    const newHidden = [...hiddenSidebarFolders, key];
    setHiddenSidebarFolders(newHidden);
    localStorage.setItem('guoren_rl_hidden_sidebar', JSON.stringify(newHidden));
    message.success('已从边栏移除');
  };

  const handleAddSubmit = async () => {
    try {
      const v = await addForm.validateFields();
      const isFolder = addType === 'folder';
      const fileType = isFolder ? 'folder' : (v.fileType || inferFileType(v.name));
      setData((d) => addItem(d, scope, {
        name: v.name, isFolder, parentKey: selectedFolderKey, fileType,
        url: isFolder ? undefined : (v.url || undefined),
        size: isFolder ? undefined : (v.size || undefined),
        mime: isFolder ? undefined : (v.mime || undefined),
        parseStatus: isFolder ? 'parsed' : 'parsing',
      }));
      setAddOpen(false);
      addForm.resetFields();
      message.success(`${isFolder ? '文件夹' : '资料'}已创建`);
    } catch { /* ignore */ }
  };

  const openAdd = (type) => { setAddType(type); addForm.resetFields(); setAddOpen(true); };

  const handleTagFilter = (tagId) => {
    const nextTagFilter = activeTagFilter === tagId ? null : tagId;
    if (!nextTagFilter) {
      if (isTagFilterContextActive) {
        restoreTagFilterContext();
        return;
      }
      setTagFilterContextFolderKeys([]);
    } else if (selectedFolderContextKeys.length > 0) {
      setTagFilterContextFolderKeys(selectedFolderContextKeys);
    }
    setActiveTagFilter(nextTagFilter);
    setSelectedItemKeys([]);
    setColumnSelectedItem(null);
  };

  const hasResourceDragPayload = (e) => {
    const dragTypes = Array.from(e.dataTransfer?.types || []);
    return dragTypes.includes('application/json') || dragTypes.includes('text/plain');
  };

  const getDraggedResourcePayload = (e) => {
    try {
      if (!hasResourceDragPayload(e)) return null;
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload?.key) return payload;
      }

      const fallbackKey = (e.dataTransfer.getData('text/plain') || '').trim();
      if (!fallbackKey) return null;
      const draggedItem = list.find((item) => item.key === fallbackKey);
      if (!draggedItem) return null;
      return {
        key: draggedItem.key,
        name: draggedItem.name,
        isFolder: draggedItem.isFolder,
        fileType: draggedItem.fileType,
      };
    } catch {
      return null;
    }
  };

  const clearTagDragState = () => {
    setTagDropIdx(null);
    setTagDropTargetId(null);
  };

  const clearPendingRenameTrigger = useCallback(() => {
    if (pendingRenameTriggerRef.current) {
      clearTimeout(pendingRenameTriggerRef.current);
      pendingRenameTriggerRef.current = null;
    }
  }, []);

  const queueInlineRename = (item, delay = 220) => {
    if (!item?.key) return;
    clearPendingRenameTrigger();
    pendingRenameTriggerRef.current = setTimeout(() => {
      pendingRenameTriggerRef.current = null;
      startInlineRename(item);
    }, delay);
  };

  const startResourceDrag = useCallback((e, item) => {
    if (!item?.key) return;
    clearPendingRenameTrigger();
    const payload = JSON.stringify({
      key: item.key,
      name: item.name,
      isFolder: item.isFolder,
      fileType: item.fileType,
    });
    isDraggingRef.current = true;
    setContextMenuItemKey(null);
    e.dataTransfer.setData('application/json', payload);
    // Safari/WebKit 对 text/plain 的支持更稳定，顺带写一份。
    e.dataTransfer.setData('text/plain', item.key);
    e.dataTransfer.effectAllowed = 'all';
  }, [clearPendingRenameTrigger, setContextMenuItemKey]);

  const handleTagItemDragOver = (e, tagId, idx) => {
    e.preventDefault();
    e.stopPropagation();

    if (tagDragIdx !== null) {
      setTagDropTargetId(null);
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      setTagDropIdx(e.clientY < midY ? idx : idx + 1);
      e.dataTransfer.dropEffect = 'move';
      return;
    }

    if (!hasResourceDragPayload(e)) return;
    setTagDropIdx(null);
    setTagDropTargetId(tagId);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleTagItemDragLeave = (e, tagId) => {
    if (!e.currentTarget.contains(e.relatedTarget) && tagDropTargetId === tagId) {
      setTagDropTargetId(null);
    }
  };

  const handleTagItemDrop = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedResource = getDraggedResourcePayload(e);
    if (draggedResource) {
      clearTagDragState();
      const targetItem = list.find((r) => r.key === draggedResource.key);
      if (!targetItem) return;
      if ((targetItem.tags || []).includes(tag.id)) {
        message.info(`「${targetItem.name}」已关联标签「${tag.name}」`);
        return;
      }
      setData((d) => addTagToItem(d, scope, draggedResource.key, tag.id));
      message.success(`已为「${targetItem.name}」关联标签「${tag.name}」`);
      return;
    }

    if (tagDragIdx !== null && tagDropIdx !== null) {
      const draggedEntry = sidebarTagEntries[tagDragIdx];
      const unchangedDropPosition = tagDropIdx === tagDragIdx || tagDropIdx === tagDragIdx + 1;
      const scopedTags = getTagDefinitions(data, scope);
      const fromGlobal = scopedTags.findIndex((at) => at.id === draggedEntry?.id);
      const toItem = tagDropIdx < sidebarTagEntries.length ? sidebarTagEntries[tagDropIdx] : null;
      const lastVisibleItem = sidebarTagEntries[sidebarTagEntries.length - 1] || null;
      const toGlobal = toItem
        ? scopedTags.findIndex((at) => at.id === toItem.id)
        : (lastVisibleItem ? scopedTags.findIndex((at) => at.id === lastVisibleItem.id) + 1 : scopedTags.length);
      if (!unchangedDropPosition && fromGlobal >= 0 && toGlobal >= 0) {
        setData((d) => reorderTagDefinition(d, fromGlobal, toGlobal, scope));
      }
    }

    clearTagDragState();
    setTagDragIdx(null);
  };

  // 多选点击处理（Cmd+Click 切换选中，Shift+Click 范围选，普通点击单选）
  const lastClickedIdx = useRef(null);
  const handleItemClick = (item, idx, e) => {
    if (e.metaKey || e.ctrlKey) {
      clearPendingRenameTrigger();
      // Cmd/Ctrl + Click: toggle
      setSelectedItemKeys((prev) =>
        prev.includes(item.key) ? prev.filter((k) => k !== item.key) : [...prev, item.key]
      );
      lastClickedIdx.current = idx;
    } else if (e.shiftKey && lastClickedIdx.current !== null) {
      clearPendingRenameTrigger();
      // Shift + Click: range select
      const start = Math.min(lastClickedIdx.current, idx);
      const end = Math.max(lastClickedIdx.current, idx);
      const rangeKeys = currentChildren.slice(start, end + 1).map((it) => it.key);
      setSelectedItemKeys(rangeKeys);
    } else if (
      selectedItemKeys.length === 1
      && selectedItemKeys[0] === item.key
      && inlineRenameItemKey !== item.key
    ) {
      queueInlineRename(item);
    } else {
      clearPendingRenameTrigger();
      // 普通点击：单选
      setSelectedItemKeys([item.key]);
      lastClickedIdx.current = idx;
      recordItemOpened(item);
    }
  };

  const handleDoubleClick = (item) => {
    clearPendingRenameTrigger();
    if (!item.isFolder) return;
    if (hasActiveSearch) {
      setKeyword('');
      setSearchPanelOpen(false);
    }
    navigateTo(item.key);
  };

  // ====== 拖放处理 ======
  const isDraggingRef = useRef(false); // 跟踪是否正在拖拽
  
  const handleFolderDragOver = (e, folderKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderKey(folderKey);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFolderDragLeave = (e, folderKey) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开的目标确实是当前 folderKey 时才清除
    if (dragOverFolderKey === folderKey) {
      setDragOverFolderKey(null);
    }
  };

  const handleFolderDrop = (e, targetFolderKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderKey(null);
    isDraggingRef.current = false;
    
    try {
      const draggedItem = getDraggedResourcePayload(e);
      if (!draggedItem) return;

      const {
        key: itemKey,
        name,
        isFolder,
      } = draggedItem;
      if (!itemKey) return;
      
      // 不能将文件夹拖到自己里面
      if (isFolder && itemKey === targetFolderKey) {
        message.warning('不能将文件夹移动到自己里面');
        return;
      }

      const sourceItem = list.find((item) => item.key === itemKey);
      if (!sourceItem) return;
      if ((sourceItem.parentKey ?? null) === (targetFolderKey ?? null)) {
        message.info(`「${name}」已在该文件夹中`);
        return;
      }

      setData((d) => moveItem(d, scope, itemKey, targetFolderKey));
      message.success(`已将「${name}」移动到文件夹`);
    } catch (err) {
      console.error('Drop failed:', err);
    }
  };

  // 空白区域拖放（移动到当前文件夹）
  const handleListDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleListDrop = (e) => {
    e.preventDefault();
    isDraggingRef.current = false;
    setDragOverFolderKey(null);
    try {
      const draggedItem = getDraggedResourcePayload(e);
      if (!draggedItem) return;

      const { key: itemKey, name } = draggedItem;
      if (!itemKey) return;

      const sourceItem = list.find((item) => item.key === itemKey);
      if (!sourceItem) return;
      if ((sourceItem.parentKey ?? null) === (selectedFolderKey ?? null)) {
        message.info(`「${name}」已在当前位置`);
        return;
      }

      // 移动到当前文件夹（selectedFolderKey）
      setData((d) => moveItem(d, scope, itemKey, selectedFolderKey));
      message.success(`已将「${name}」移动到当前位置`);
    } catch (err) {
      console.error('Drop failed:', err);
    }
  };

  const clearListSelection = () => {
    clearPendingRenameTrigger();
    setSelectedItemKeys([]);
  };

  const handleListBlankClick = (e) => {
    if (
      e.target.closest('.finder-file-row')
      || e.target.closest('.finder-detail-header')
      || e.target.closest('.finder-inline-input')
      || e.target.closest('.ant-dropdown')
    ) return;
    clearListSelection();
  };

  const handleColumnBlankClick = (e, colIdx) => {
    if (
      e.target.closest('.finder-column-item')
      || e.target.closest('.finder-column-resize-handle')
      || e.target.closest('.ant-dropdown')
    ) return;
    clearPendingRenameTrigger();
    setSelectedItemKeys([]);
    setColumnSelectedItem(null);
    setColumnPath((prev) => prev.slice(0, Math.min(prev.length, colIdx + 1)));
  };

  // ====== 分栏视图 - 点击文件夹时扩展列 ======
  const handleColumnFolderClick = (folderKey, colIndex) => {
    clearPendingRenameTrigger();
    if (hasActiveSearch) {
      setKeyword('');
      setSearchPanelOpen(false);
      navigateTo(folderKey);
      return;
    }
    const newPath = columnPath.slice(0, colIndex + 1);
    newPath.push(folderKey);
    setColumnPath(newPath);
    setColumnSelectedItem(null);
    // 自动滚动到最右
    setTimeout(() => {
      columnScrollRef.current?.scrollTo({ left: columnScrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 50);
  };

  const handleColumnFileClick = (item, colIndex) => {
    clearPendingRenameTrigger();
    // 截断后续列，选中该文件
    setColumnPath(columnPath.slice(0, colIndex + 1));
    setColumnSelectedItem(item);
    setSelectedItemKeys([item.key]);
    recordItemOpened(item);
  };

  // 分栏视图各列的子项
  const columnLevels = useMemo(() => {
    if (hasActiveSearch) {
      return [activeTagFilter
        ? searchResults.filter((item) => (item.tags || []).includes(activeTagFilter))
        : searchResults];
    }
    if (isRecentView) {
      return [activeTagFilter
        ? recentItems.filter((item) => (item.tags || []).includes(activeTagFilter))
        : recentItems];
    }
    return columnPath.map((parentKey, idx) => {
      const items = idx === columnPath.length - 1
        ? columnContextItems
        : sortLibraryItems(list.filter((r) => r.parentKey === parentKey));
      if (activeTagFilter && idx === columnPath.length - 1) {
        return items.filter((item) => (item.tags || []).includes(activeTagFilter));
      }
      return items;
    });
  }, [activeTagFilter, columnContextItems, columnPath, hasActiveSearch, isRecentView, list, recentItems, searchResults, sortLibraryItems]);

  // 切换视图模式时同步 columnPath
  const handleViewModeChange = (mode) => {
    clearPendingRenameTrigger();
    setViewMode(mode);
    if (mode === 'column') {
      // 从当前 breadcrumb 构建 columnPath
      const path = hasActiveSearch ? [null] : [null, ...breadcrumb.map((b) => b.key)];
      setColumnPath(path);
      setColumnSelectedItem(null);
    }
  };

  const createFolderAndStartRename = useCallback((parentKey = null, options = {}) => {
    const {
      revealParentKey = null,
      columnPathToOpen = null,
      successMessage = '文件夹已创建',
    } = options;
    const folderKey = `${scope[0]}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const normalizedParentKey = parentKey ?? null;

    setData((d) => addItem(d, scope, {
      key: folderKey,
      name: '未命名文件夹',
      isFolder: true,
      parentKey: normalizedParentKey,
      fileType: 'folder',
      parseStatus: 'parsed',
    }));
    setPendingNewFolder({
      key: folderKey,
      parentKey: normalizedParentKey,
      revealParentKey,
      columnPathToOpen,
      shouldStartRename: true,
    });
    setContextMenuItemKey(null);
    message.success(successMessage);
    return folderKey;
  }, [scope]);

  // ====== 快速新建文件夹 (内联) ======
  const handleNewFolderInline = (parentKey = selectedFolderKey) => {
    setInlineRenameItemKey(null);
    setInlineRenameName('');
    setNewFolderInline(true);
    setNewFolderName('未命名文件夹');
    setNewFolderParentKey(parentKey);
    setTimeout(() => {
      newFolderInputRef.current?.focus();
      newFolderInputRef.current?.select?.();
    }, 50);
  };

  const confirmNewFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      setData((d) => addItem(d, scope, {
        name: trimmed,
        isFolder: true,
        parentKey: newFolderParentKey,
        fileType: 'folder',
        parseStatus: 'parsed',
      }));
      message.success(`文件夹「${trimmed}」已创建`);
    }
    setNewFolderInline(false);
    setNewFolderName('');
    setNewFolderParentKey(null);
  };

  const cancelInlineRename = useCallback((itemKey = inlineRenameItemKey) => {
    clearPendingRenameTrigger();
    if (itemKey) {
      setPendingNewFolder((prev) => (prev?.key === itemKey ? null : prev));
    }
    setInlineRenameItemKey(null);
    setInlineRenameName('');
  }, [clearPendingRenameTrigger, inlineRenameItemKey]);

  const confirmInlineRename = useCallback(() => {
    if (!inlineRenameItemKey) return;
    const targetItem = list.find((item) => item.key === inlineRenameItemKey);
    const trimmed = inlineRenameName.trim();

    if (targetItem && trimmed && trimmed !== targetItem.name) {
      setData((d) => renameItem(d, scope, targetItem.key, trimmed));
      message.success('已重命名');
    }

    cancelInlineRename(inlineRenameItemKey);
  }, [cancelInlineRename, inlineRenameItemKey, inlineRenameName, list, scope]);

  const startInlineRename = useCallback((item) => {
    if (!item?.key) return;
    clearPendingRenameTrigger();
    hideFolderHoverTip(item.key);
    setNewFolderInline(false);
    setNewFolderName('');
    setNewFolderParentKey(null);
    setInlineRenameItemKey(item.key);
    setInlineRenameName(item.name || '');
    setSelectedItemKeys([item.key]);
    if (viewMode === 'column') {
      setColumnSelectedItem(item.isFolder ? null : item);
    }
    setTimeout(() => {
      inlineRenameInputRef.current?.focus();
      inlineRenameInputRef.current?.select?.();
    }, 50);
  }, [clearPendingRenameTrigger, hideFolderHoverTip, viewMode]);

  useEffect(() => () => {
    clearPendingRenameTrigger();
  }, [clearPendingRenameTrigger]);

  useEffect(() => {
    if (!pendingNewFolder?.shouldStartRename) return;
    const createdItem = list.find((item) => item.key === pendingNewFolder.key);
    if (!createdItem) return;

    if (viewMode === 'detail' && pendingNewFolder.revealParentKey) {
      setExpandedFolders((prev) => {
        if (prev.has(pendingNewFolder.revealParentKey)) return prev;
        const next = new Set(prev);
        next.add(pendingNewFolder.revealParentKey);
        return next;
      });
    }

    if (viewMode === 'column' && Array.isArray(pendingNewFolder.columnPathToOpen)) {
      setColumnPath(pendingNewFolder.columnPathToOpen);
      setColumnSelectedItem(null);
    }

    startInlineRename(createdItem);
    setPendingNewFolder((prev) => (
      prev?.key === createdItem.key
        ? { ...prev, shouldStartRename: false }
        : prev
    ));
  }, [list, pendingNewFolder, startInlineRename, viewMode]);

  // ====== Quick Look 预览（右侧面板常驻） ======
  const selectedItemKey = selectedItemKeys.length === 1 ? selectedItemKeys[0] : null;
  const previewItem = useMemo(() => {
    if (!selectedItemKey) return null;
    return list.find((r) => r.key === selectedItemKey) || null;
  }, [selectedItemKey, list]);
  const toolbarMenuTargetItem = previewItem;

  // 选中文件夹的子项数量
  const previewFolderCount = useMemo(() => {
    if (!previewItem?.isFolder) return 0;
    return list.filter((r) => r.parentKey === previewItem.key).length;
  }, [previewItem, list]);
  const [bgMenuPos, setBgMenuPos] = useState(null); // {x, y} 右键菜单位置
  const currentBlankAreaParentKey = viewMode === 'column'
    ? (columnPath[columnPath.length - 1] ?? null)
    : selectedFolderKey;
  const { uploadFilesToLibrary } = useResourceLibraryFileImport({
    activeTagFilter,
    addDialogOpen,
    addOpen,
    addTagOpen,
    contextMenuItemKey,
    currentBlankAreaParentKey,
    hasActiveSearch,
    isRecentView,
    list,
    parseDrawerOpen,
    scope,
    selectedItemKeys,
    setBgMenuPos,
    setContextMenuItemKey,
    setData,
    setExpandedFolders,
    tagPickerTarget,
    viewMode,
  });

  const renderCheckedMenuLabel = (checked, label) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 116 }}>
      <span style={{ width: 14, display: 'inline-block', textAlign: 'center', color: '#1677ff' }}>
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </span>
  );

  const toggleItemTagSelection = useCallback((itemKey, tagId, checked) => {
    setData((d) => (
      checked
        ? removeTagFromItem(d, scope, itemKey, tagId)
        : addTagToItem(d, scope, itemKey, tagId)
    ));
  }, [scope]);

  const handleQuickTagToggle = useCallback((tagId, quick) => {
    setData((d) => toggleTagQuickAccess(d, tagId, quick, scope));
  }, [scope]);

  const renderMenuTagDots = (item, { disabled = false } = {}) => {
    const itemTagIds = item?.tags || [];
    return (
      <div
        className={`finder-menu-tags-row ${disabled ? 'finder-menu-tags-row-disabled' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {menuQuickTagDefs.map((t) => {
          const hasTag = itemTagIds.includes(t.id);
          return (
            <button
              type="button"
              key={t.id}
              className={`finder-menu-quick-tag ${hasTag ? 'finder-menu-quick-tag-active' : ''}`}
              title={t.name}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled || !item) return;
                toggleItemTagSelection(item.key, t.id, hasTag);
              }}
            >
              <span
                className={`finder-menu-quick-tag-dot ${hasTag ? 'finder-menu-quick-tag-dot-active' : ''}`}
                style={{ background: t.color, color: t.color }}
              />
              <span className="finder-menu-quick-tag-label">{t.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const handleItemMenuAction = (item, key, {
    includeFavorite = false,
    columnPathToOpen = null,
  } = {}) => {
    const isFavorited = item.isFolder && favorites.some((f) => f.key === item.key);
    if (key === 'enter' && item.isFolder) {
      navigateTo(item.key);
      return;
    }
    if (key === 'addResource' && item.isFolder) {
      setAddDialogParentKey(item.key);
      setAddDialogOpen(true);
    }
    if (key === 'newFolder') {
      createFolderAndStartRename(item.key, {
        revealParentKey: viewMode === 'detail' ? item.key : null,
        columnPathToOpen: viewMode === 'column' ? columnPathToOpen : null,
      });
    }
    if (key === 'favorite' && includeFavorite && item.isFolder) {
      if (isFavorited) {
        saveFavorites(favorites.filter((f) => f.key !== item.key));
        message.success('已取消收藏');
      } else {
        saveFavorites([...favorites, { key: item.key, name: item.name, isFolder: item.isFolder, fileType: item.fileType }]);
        message.success(`「${item.name}」已添加到收藏`);
      }
    }
    if (key === 'rename') handleRename(item);
    if (key === 'delete') handleDelete(item.key);
    if (key === 'tags-manage') setTagPickerTarget(item.key);
  };

  const getItemMoreMenu = (item, {
    includeFavorite = false,
    includeAddResource = false,
    columnPathToOpen = null,
  } = {}) => {
    const isFavorited = item.isFolder && favorites.some((f) => f.key === item.key);
    return {
      items: [
        ...(item.isFolder ? [
          { key: 'enter', icon: <RightOutlined />, label: '进入' },
          { type: 'divider' },
        ] : []),
        ...(includeAddResource && item.isFolder ? [
          { key: 'addResource', icon: <PlusOutlined />, label: '添加资料' },
          { type: 'divider' },
        ] : []),
        { key: 'tags-row', label: renderMenuTagDots(item) },
        { key: 'tags-manage', icon: <TagsOutlined />, label: '标签…' },
        { type: 'divider' },
        ...(item.isFolder ? [
          { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹' },
          { type: 'divider' },
        ] : []),
        ...(includeFavorite && item.isFolder ? [
          { key: 'favorite', icon: isFavorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />, label: isFavorited ? '取消收藏' : '收藏' },
          { type: 'divider' },
        ] : []),
        { key: 'rename', icon: <EditOutlined />, label: '重命名' },
        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
      ],
      onClick: ({ key, domEvent }) => {
        domEvent?.stopPropagation();
        handleItemMenuAction(item, key, { includeFavorite, columnPathToOpen });
      },
    };
  };

  // 右键菜单 - 文件/文件夹
  const getContextMenu = (item, { includeFavorite = false } = {}) => (
    getItemMoreMenu(item, { includeFavorite, includeAddResource: true })
  );

  const handleItemContextMenuOpenChange = useCallback((itemKey, open) => {
    if (open) clearPendingRenameTrigger();
    setContextMenuItemKey((prev) => {
      if (open) return itemKey;
      return prev === itemKey ? null : prev;
    });
  }, [clearPendingRenameTrigger]);

  const handleCreateFolderAtCurrentLocation = () => {
    createFolderAndStartRename(currentBlankAreaParentKey, {
      columnPathToOpen: viewMode === 'column' ? [...columnPath] : null,
    });
  };

  const handleAddResourceAtCurrentLocation = () => {
    setAddDialogParentKey(currentBlankAreaParentKey ?? ROOT_PARENT_KEY);
    setAddDialogOpen(true);
  };

  const handleToolbarMenuAction = ({ key, domEvent }) => {
    domEvent?.stopPropagation();

    if (key === 'newFolder') {
      handleCreateFolderAtCurrentLocation();
      return;
    }
    if (key === 'addResource') {
      handleAddResourceAtCurrentLocation();
      return;
    }
    if (key === 'tags-manage') {
      if (!toolbarMenuTargetItem) return;
      setTagPickerTarget(toolbarMenuTargetItem.key);
      return;
    }
    if (key === 'rename') {
      if (!toolbarMenuTargetItem) return;
      handleRename(toolbarMenuTargetItem);
      return;
    }
    if (key === 'delete') {
      if (!toolbarMenuTargetItem) return;
      handleDelete(toolbarMenuTargetItem.key);
      return;
    }
    if (key.startsWith('sort-')) {
      const nextSort = key.slice(5);
      if (nextSort === 'order-asc') setSortOrder('asc');
      else if (nextSort === 'order-desc') setSortOrder('desc');
      else setSortBy(nextSort);
      return;
    }
    if (key === 'display-view-detail') {
      handleViewModeChange('detail');
      return;
    }
    if (key === 'display-view-column') {
      handleViewModeChange('column');
      return;
    }
    if (key.startsWith('display-col-')) {
      const colKey = key.slice('display-col-'.length);
      setVisibleCols((prev) => {
        if (prev.includes(colKey)) return prev.filter((k) => k !== colKey);
        const next = [...prev, colKey];
        return COL_DEFS.map((c) => c.key).filter((k) => next.includes(k));
      });
    }
  };

  const toolbarMoreMenu = {
    items: [
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'addResource', icon: <FileAddOutlined />, label: '添加资料' },
      { type: 'divider' },
      { key: 'tags-row', label: renderMenuTagDots(toolbarMenuTargetItem, { disabled: !toolbarMenuTargetItem }), disabled: !toolbarMenuTargetItem },
      { key: 'tags-manage', icon: <TagsOutlined />, label: '标签…', disabled: !toolbarMenuTargetItem },
      { type: 'divider' },
      { key: 'rename', icon: <EditOutlined />, label: '重命名', disabled: !toolbarMenuTargetItem },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, disabled: !toolbarMenuTargetItem },
      { type: 'divider' },
      {
        key: 'sort',
        label: '排序方式',
        children: [
          { key: 'sort-name', label: renderCheckedMenuLabel(sortBy === 'name', '名称') },
          { key: 'sort-date', label: renderCheckedMenuLabel(sortBy === 'date', '修改日期') },
          { key: 'sort-size', label: renderCheckedMenuLabel(sortBy === 'size', '大小') },
          { key: 'sort-kind', label: renderCheckedMenuLabel(sortBy === 'kind', '种类') },
          { key: 'sort-tag', label: renderCheckedMenuLabel(sortBy === 'tag', '标签') },
          { type: 'divider' },
          { key: 'sort-order-asc', label: renderCheckedMenuLabel(sortOrder === 'asc', '升序') },
          { key: 'sort-order-desc', label: renderCheckedMenuLabel(sortOrder === 'desc', '降序') },
        ],
      },
      {
        key: 'display',
        label: '查看显示选项',
        children: [
          { key: 'display-view-detail', label: renderCheckedMenuLabel(viewMode === 'detail', '列表') },
          { key: 'display-view-column', label: renderCheckedMenuLabel(viewMode === 'column', '分栏') },
          { type: 'divider' },
          ...COL_DEFS.map((col) => ({
            key: `display-col-${col.key}`,
            label: renderCheckedMenuLabel(visibleCols.includes(col.key), col.label),
            disabled: viewMode !== 'detail',
          })),
        ],
      },
    ],
    onClick: handleToolbarMenuAction,
  };

  // 右键菜单 - 空白区域
  const bgContextMenu = {
    items: [
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'addResource', icon: <FileAddOutlined />, label: '添加资料' },
    ],
    onClick: ({ key }) => {
      if (key === 'newFolder') handleCreateFolderAtCurrentLocation();
      if (key === 'addResource') handleAddResourceAtCurrentLocation();
      setBgMenuPos(null);
    },
  };

  const handleBgContextMenu = (e) => {
    // 只在点击空白处触发，不在文件行上触发
    if (
      e.target.closest('.finder-file-row')
      || e.target.closest('.finder-detail-header')
      || e.target.closest('.finder-column-item')
      || e.target.closest('.finder-column-resize-handle')
      || e.target.closest('.finder-preview-content')
    ) return;
    e.preventDefault();
    clearPendingRenameTrigger();
    setContextMenuItemKey(null);
    setBgMenuPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!bgMenuPos) return undefined;

    const isInsideBgMenu = (target) => target instanceof Element && !!target.closest('.ant-dropdown');

    const handlePointerDown = (e) => {
      if (isInsideBgMenu(e.target)) return;
      setBgMenuPos(null);
    };

    const handleDocumentContextMenu = (e) => {
      if (isInsideBgMenu(e.target)) return;
      setBgMenuPos(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setBgMenuPos(null);
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

  useEffect(() => {
    if (!searchPanelOpen) return undefined;

    const handlePointerDown = (e) => {
      if (searchBoxRef.current?.contains(e.target)) return;
      setSearchPanelOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchPanelOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchPanelOpen]);

  useEffect(() => () => {
    clearFolderHoverTipTimer();
    clearTagPickerScrollTimer();
  }, [clearFolderHoverTipTimer, clearTagPickerScrollTimer]);

  useEffect(() => {
    hideFolderHoverTip();
  }, [hideFolderHoverTip, libraryId, normalizedKeyword, searchMode, selectedFolderKey, specialView, viewMode]);

  useEffect(() => {
    const visibleKeys = new Set(
      viewMode === 'column'
        ? columnLevels.flatMap((items) => items.map((item) => item.key))
        : displayChildren.map((item) => item.key),
    );
    setSelectedItemKeys((prev) => {
      const next = prev.filter((key) => visibleKeys.has(key));
      return next.length === prev.length && next.every((key, idx) => key === prev[idx])
        ? prev
        : next;
    });
    setColumnSelectedItem((prev) => (prev && visibleKeys.has(prev.key) ? prev : null));
  }, [columnLevels, displayChildren, viewMode]);

  const handleSearchChange = (e) => {
    const nextKeyword = e.target.value;
    setKeyword(nextKeyword);
    setSearchPanelOpen(nextKeyword.trim().length > 0);
    if (nextKeyword.trim().length === 0) {
      setSelectedItemKeys([]);
      setColumnSelectedItem(null);
    }
  };

  const applySearchMode = (mode) => {
    setSearchMode(mode);
    if (normalizedKeyword) setSearchPanelOpen(false);
  };
  const tagPickerItem = useMemo(
    () => (tagPickerTarget ? list.find((item) => item.key === tagPickerTarget) || null : null),
    [list, tagPickerTarget],
  );

  const activeSearchDescription = searchMode === 'name'
    ? `名称包含 “${normalizedKeyword}”`
    : `内容包含 “${normalizedKeyword}”`;

  return (
    <>
    {/* 背景右键菜单(脱离布局流) */}
    {bgMenuPos && (
      <Dropdown menu={bgContextMenu} open onOpenChange={(v) => { if (!v) setBgMenuPos(null); }} trigger={[]}>
        <span style={{ position: 'fixed', left: bgMenuPos.x, top: bgMenuPos.y, width: 1, height: 1 }} />
      </Dropdown>
    )}
    <div className="finder-layout">
      {/* ===== 左侧栏（macOS Finder 侧栏） ===== */}
      <div className="finder-sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        {/* 库类型切换 Bar */}
        <div className="finder-library-switcher">
          <div className="finder-library-tabs">
            <span
              className={`finder-library-tab ${scope === 'personal' ? 'finder-library-tab-active' : ''}`}
              onClick={() => handleScopeChange('personal')}
            >
              个人库
            </span>
            <span
              className={`finder-library-tab ${scope === 'organization' ? 'finder-library-tab-active' : ''}`}
              onClick={() => handleScopeChange('organization')}
            >
              组织库
            </span>
          </div>
          {scope === 'organization' && (
            <Select
              size="small"
              className="finder-library-org-select"
              value={currentOrgId}
              onChange={handleOrgChange}
              options={organizations.map((o) => ({ label: o.name, value: o.id }))}
              suffixIcon={<CaretDownOutlined style={{ fontSize: 10 }} />}
            />
          )}
        </div>

        {/* 个人收藏 */}
        <div
          className={`finder-sidebar-section ${favDragOver ? 'finder-sidebar-fav-dragover' : ''}`}
          onDragOver={handleFavSectionDragOver}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setFavDragOver(false); setFavDropIdx(null); } }}
          onDrop={handleFavDrop}
        >
          <div className="finder-sidebar-title">{scope === 'personal' ? '个人收藏' : '组织收藏'}</div>
          <div
            className={`finder-sidebar-item ${specialView === 'all' && !selectedFolderKey && !activeTagFilter && !hasActiveSearch ? 'finder-sidebar-item-active' : ''}`}
            onClick={() => { navigateTo(null); }}
          >
            <span className="finder-sidebar-item-icon" style={{ color: '#007aff' }}><DesktopOutlined /></span>
            <span className="finder-sidebar-item-label">全部资料</span>
            <span className="finder-sidebar-root-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="finder-sidebar-root-action-btn"
                aria-label="新建文件夹"
                title="新建文件夹"
                onClick={() => {
                  if (viewMode === 'column') {
                    setData((d) => addItem(d, scope, {
                      name: '未命名文件夹',
                      isFolder: true,
                      parentKey: null,
                      fileType: 'folder',
                      parseStatus: 'parsed',
                    }));
                    message.success('文件夹已创建到根目录');
                    return;
                  }
                  if (selectedFolderKey || hasActiveSearch || isRecentView || activeTagFilter) {
                    navigateTo(null);
                    setTimeout(() => handleNewFolderInline(null), 80);
                    return;
                  }
                  handleNewFolderInline(null);
                }}
              >
                <FolderAddOutlined />
              </button>
              <button
                type="button"
                className="finder-sidebar-root-action-btn"
                aria-label="添加资料"
                title="添加资料"
                onClick={() => {
                  setAddDialogParentKey(ROOT_PARENT_KEY);
                  setAddDialogOpen(true);
                }}
              >
                <FileAddOutlined />
              </button>
            </span>
          </div>
          <div
            className={`finder-sidebar-item ${isRecentView && !hasActiveSearch ? 'finder-sidebar-item-active' : ''}`}
            onClick={openRecentView}
          >
            <span className="finder-sidebar-item-icon" style={{ color: '#8e8e93' }}><ClockCircleOutlined /></span>
            <span className="finder-sidebar-item-label">最近使用</span>
          </div>
          {/* 拖拽收藏的快捷方式（可拖动排序） */}
          {favorites.map((fav, idx) => (
            <div key={`fav_${fav.key}`} data-fav-idx={idx}>
              {favDropIdx === idx && <div className="finder-sidebar-fav-drop-indicator" />}
              <div
                className={`finder-sidebar-item ${specialView === 'all' && selectedFolderKey === fav.key && !activeTagFilter && !hasActiveSearch ? 'finder-sidebar-item-active' : ''} ${favDragIdx === idx ? 'finder-sidebar-item-dragging' : ''}`}
                draggable
                onDragStart={(e) => {
                  setFavDragIdx(idx);
                  e.dataTransfer.setData('application/json', JSON.stringify(fav));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => { setFavDragIdx(null); setFavDropIdx(null); }}
                onClick={() => { if (fav.isFolder) navigateTo(fav.key); }}
              >
                <span className="finder-sidebar-item-icon" style={{ color: fav.isFolder ? '#4facfe' : '#8e8e93' }}>
                  {fav.isFolder ? <FolderFilled /> : renderFileIcon(fav.fileType, { fontSize: 14 })}
                </span>
                <span className="finder-sidebar-item-label">{fav.name}</span>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: ({ domEvent }) => { domEvent.stopPropagation(); renameFavorite(fav); } },
                      { type: 'divider' },
                      { key: 'remove', icon: <DeleteOutlined />, label: '从边栏移除', danger: true, onClick: ({ domEvent }) => { domEvent.stopPropagation(); removeFavorite(fav.key); } },
                    ],
                  }}
                >
                  <span className="finder-sidebar-fav-more" onClick={(e) => e.stopPropagation()}><MoreOutlined /></span>
                </Dropdown>
              </div>
            </div>
          ))}
          {favDropIdx === favorites.length && favorites.length > 0 && <div className="finder-sidebar-fav-drop-indicator" />}
        </div>

        {/* 位置 */}
        <div className="finder-sidebar-section">
          <div className="finder-sidebar-title">位置</div>
          <div className="finder-sidebar-item">
            <span className="finder-sidebar-item-icon" style={{ color: '#8e8e93' }}><GlobalOutlined /></span>
            <span className="finder-sidebar-item-label">云电脑</span>
          </div>
        </div>

        {/* 标签 */}
        <div
          className="finder-sidebar-section"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              clearTagDragState();
            }
          }}
        >
          <div className="finder-sidebar-title">标签</div>
          {sidebarTagEntries.map((t, idx) => {
            const tagSourceMeta = showAllSidebarTags ? null : contextualSidebarTagSourceMap.get(t.id);
            return (
              <div key={t.id}>
                {tagDropIdx === idx && <div className="finder-sidebar-fav-drop-indicator" />}
                <div
                  className={`finder-tag-item ${activeTagFilter === t.id ? 'finder-tag-item-active' : ''} ${tagDragIdx === idx ? 'finder-sidebar-item-dragging' : ''} ${tagDropTargetId === t.id ? 'finder-tag-item-drop-target' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    setTagDragIdx(idx);
                    setTagDropTargetId(null);
                    e.dataTransfer.setData('text/plain', t.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => { setTagDragIdx(null); clearTagDragState(); }}
                  onDragOver={(e) => handleTagItemDragOver(e, t.id, idx)}
                  onDragLeave={(e) => handleTagItemDragLeave(e, t.id)}
                  onDrop={(e) => handleTagItemDrop(e, t)}
                  onClick={() => handleTagFilter(t.id)}
                >
                  <span className="finder-tag-dot" style={{ background: t.color }} />
                  <span className="finder-tag-label-wrap">
                    <span className="finder-tag-label">{t.name}</span>
                    {tagSourceMeta && (
                      <span className="finder-tag-source-list">
                        {tagSourceMeta.fromFolder && (
                          <span className="finder-tag-source-badge finder-tag-source-badge-folder">文件夹</span>
                        )}
                        {tagSourceMeta.fromContent && (
                          <span className="finder-tag-source-badge finder-tag-source-badge-content">内容</span>
                        )}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          {!showAllSidebarTags && sidebarTagEntries.length === 0 && (
            <div className="finder-sidebar-tag-empty">当前内容暂无标签</div>
          )}
          {tagDropIdx === sidebarTagEntries.length && <div className="finder-sidebar-fav-drop-indicator" />}
          <div className="finder-all-tags-link" onClick={() => setShowAllSidebarTags((prev) => !prev)}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #86868b', display: 'inline-block' }} />
            <span>{sidebarTagToggleLabel}</span>
          </div>
        </div>
      </div>

      {/* 侧栏拖拽调整宽度手柄 */}
      <div className="finder-sidebar-resize-handle" onMouseDown={handleSidebarResizeStart} />

      {/* ===== 主面板 ===== */}
      <div className="finder-main">
        {/* 工具栏 */}
        <div className="finder-toolbar">
          <div className="finder-toolbar-nav">
            <button className="finder-toolbar-nav-btn" disabled={!canNavigateBack} onClick={handleBack}>
              <LeftOutlined />
            </button>
            <button className="finder-toolbar-nav-btn" disabled={!canNavigateForward} onClick={handleForward}>
              <RightOutlined />
            </button>
          </div>
          <div className="finder-toolbar-title">
            {hasActiveSearch
              ? `正在搜索“${normalizedKeyword}”`
              : isRecentView
              ? '最近使用'
              : activeTagFilter
              ? `${activeTagFilterDef?.name || '标签'}${isTagFilterContextActive && tagFilterContextLabel ? ` · ${tagFilterContextLabel}` : ''}`
              : (currentFolder?.name || (scope === 'personal' ? '全部资料' : '组织资料'))}
          </div>

          <Dropdown menu={toolbarMoreMenu} trigger={['click']} overlayClassName="finder-toolbar-more-dropdown" placement="bottomLeft">
            <button
              type="button"
              className="finder-toolbar-action-btn finder-toolbar-icon-btn"
              aria-label="操作"
              title="操作"
            >
              <span className="finder-toolbar-action-combo" aria-hidden="true">
                <span className="finder-toolbar-action-combo-circle">
                  <MoreOutlined />
                </span>
                <CaretDownOutlined className="finder-toolbar-action-combo-caret" />
              </span>
            </button>
          </Dropdown>

          {/* 视图切换按钮组：仅保留列表和分栏 */}
          <div className="finder-toolbar-views">
            <Tooltip title="列表">
              <button className={`finder-toolbar-view-btn ${viewMode === 'detail' ? 'finder-toolbar-view-btn-active' : ''}`} onClick={() => handleViewModeChange('detail')}>
                <span className="finder-toolbar-view-icon finder-toolbar-view-icon-list" aria-hidden="true">
                  <span className="finder-toolbar-view-icon-list-row">
                    <span className="finder-toolbar-view-icon-dot" />
                    <span className="finder-toolbar-view-icon-line" />
                  </span>
                  <span className="finder-toolbar-view-icon-list-row">
                    <span className="finder-toolbar-view-icon-dot" />
                    <span className="finder-toolbar-view-icon-line" />
                  </span>
                  <span className="finder-toolbar-view-icon-list-row">
                    <span className="finder-toolbar-view-icon-dot" />
                    <span className="finder-toolbar-view-icon-line" />
                  </span>
                </span>
              </button>
            </Tooltip>
            <Tooltip title="分栏">
              <button className={`finder-toolbar-view-btn ${viewMode === 'column' ? 'finder-toolbar-view-btn-active' : ''}`} onClick={() => handleViewModeChange('column')}>
                <span className="finder-toolbar-view-icon finder-toolbar-view-icon-columns" aria-hidden="true">
                  <span className="finder-toolbar-view-icon-column" />
                  <span className="finder-toolbar-view-icon-column" />
                  <span className="finder-toolbar-view-icon-column" />
                </span>
              </button>
            </Tooltip>
          </div>

          {/* 操作按钮区 */}
          <div className="finder-toolbar-actions">
            <button
              type="button"
              className="finder-toolbar-action-btn finder-toolbar-icon-btn"
              aria-label="AI解析"
              title="AI解析"
              onClick={() => setParseDrawerOpen(true)}
            >
              <RobotOutlined />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="finder-toolbar-search" ref={searchBoxRef}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#999', fontSize: 12 }} />}
              placeholder="按文件名或内容搜索"
              value={keyword}
              onChange={handleSearchChange}
              onFocus={() => { if (normalizedKeyword) setSearchPanelOpen(true); }}
              onClick={() => { if (normalizedKeyword) setSearchPanelOpen(true); }}
              onPressEnter={() => setSearchPanelOpen(false)}
              size="small"
            />
            {searchPanelOpen && hasActiveSearch && (
              <div className="finder-search-panel">
                <div className="finder-search-panel-section">
                  <div className="finder-search-panel-title">文件名</div>
                  <button
                    type="button"
                    className={`finder-search-panel-option ${searchMode === 'name' ? 'finder-search-panel-option-active' : ''}`}
                    onClick={() => applySearchMode('name')}
                  >
                    名称包含 “{normalizedKeyword}”
                  </button>
                </div>
                <div className="finder-search-panel-divider" />
                <div className="finder-search-panel-section">
                  <div className="finder-search-panel-title">内容</div>
                  <button
                    type="button"
                    className={`finder-search-panel-option ${searchMode === 'content' ? 'finder-search-panel-option-active' : ''}`}
                    onClick={() => applySearchMode('content')}
                  >
                    包含 “{normalizedKeyword}”
                  </button>
                </div>
              </div>
            )}
          </div>

          <Tooltip
            placement="bottomRight"
            overlayClassName="finder-toolbar-help-tooltip"
            title={(
              <div className="finder-toolbar-help-tip-list">
                {RESOURCE_LIB_HELP_TIPS.map((tip) => (
                  <div key={tip} className="finder-toolbar-help-tip-item">{tip}</div>
                ))}
              </div>
            )}
          >
            <button
              type="button"
              className="finder-toolbar-action-btn finder-toolbar-help-btn"
              aria-label="帮助"
              title="帮助"
            >
              <QuestionCircleOutlined />
            </button>
          </Tooltip>
        </div>

        {hasActiveSearch && (
          <div className="finder-search-summary-bar">
            <span className="finder-search-summary-label">搜索：</span>
            <button
              type="button"
              className={`finder-search-summary-chip ${searchMode === 'name' ? 'finder-search-summary-chip-active' : ''}`}
              onClick={() => setSearchMode('name')}
            >
              文件名
            </button>
            <button
              type="button"
              className={`finder-search-summary-chip ${searchMode === 'content' ? 'finder-search-summary-chip-active' : ''}`}
              onClick={() => setSearchMode('content')}
            >
              内容
            </button>
            <span className="finder-search-summary-text">{activeSearchDescription}</span>
            <span className="finder-search-summary-count">共 {currentChildren.length} 项</span>
          </div>
        )}

        {!hasActiveSearch && isTagFilterContextActive && (
          <div className="finder-search-summary-bar">
            <span className="finder-search-summary-label">上下文：</span>
            <button
              type="button"
              className="finder-search-summary-chip"
              onClick={restoreTagFilterContext}
            >
              返回已选文件夹
            </button>
            <span className="finder-search-summary-text">
              {`当前查看“${activeTagFilterDef?.name || '标签'}”在 ${tagFilterContextLabel} 中的相关内容`}
            </span>
            <span className="finder-search-summary-count">共 {currentChildren.length} 项</span>
          </div>
        )}

        {/* ===== 内容区域：文件列表 + 右侧预览面板 ===== */}
        <div className="finder-content-area" ref={contentAreaRef}>

          {/* ==== 分栏视图 ==== */}
          {viewMode === 'column' ? (
              <div className="finder-column-scroll" ref={columnScrollRef} onContextMenu={handleBgContextMenu}>
                {columnLevels.map((items, colIdx) => {
                  const colWidth = columnWidths[colIdx];
                  return (
                  <div
                    className="finder-column"
                    key={colIdx}
                    style={colWidth ? { width: colWidth, minWidth: colWidth, maxWidth: colWidth } : undefined}
                    onClick={(e) => handleColumnBlankClick(e, colIdx)}
                  >
                    {items.length === 0 && colIdx === 0 && hasActiveSearch ? (
                      <div className="finder-column-empty">无匹配资料</div>
                    ) : items.map((item) => {
                      const isActive = columnPath[colIdx + 1] === item.key || (columnSelectedItem?.key === item.key);
                      const isContextMenuTarget = contextMenuItemKey === item.key;
                      const isInlineRenaming = inlineRenameItemKey === item.key;
                      const itemMoreMenu = getItemMoreMenu(item, {
                        columnPathToOpen: [...columnPath.slice(0, colIdx + 1), item.key],
                      });

                      return (
                        <Dropdown
                          key={item.key}
                          menu={getContextMenu(item)}
                          trigger={['contextMenu']}
                          onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                        >
                          <div
                            className={`finder-column-item ${isActive ? 'finder-column-item-active' : ''} ${selectedItemKeys.includes(item.key) && !isActive ? 'finder-column-item-selected' : ''} ${isContextMenuTarget ? 'finder-column-item-context-open' : ''} ${item.isFolder && dragOverFolderKey === item.key ? 'finder-column-item-dragover' : ''}`}
                            draggable={!isInlineRenaming}
                            onDragStart={(e) => {
                              startResourceDrag(e, item);
                            }}
                            onDragEnd={() => {
                              isDraggingRef.current = false;
                            }}
                            onDragOver={item.isFolder ? (e) => handleFolderDragOver(e, item.key) : undefined}
                            onDragLeave={item.isFolder ? (e) => handleFolderDragLeave(e, item.key) : undefined}
                            onDrop={item.isFolder ? (e) => handleFolderDrop(e, item.key) : undefined}
                            onClick={(e) => {
                              // 如果刚刚完成拖拽，不触发点击
                              if (isDraggingRef.current) return;
                              
                              if (e.metaKey || e.ctrlKey) {
                                clearPendingRenameTrigger();
                                // Cmd/Ctrl+Click: 切换选中
                                setSelectedItemKeys((prev) =>
                                  prev.includes(item.key) ? prev.filter((k) => k !== item.key) : [...prev, item.key]
                                );
                              } else if (e.shiftKey) {
                                clearPendingRenameTrigger();
                                // Shift+Click: 范围选
                                const colItems = columnLevels[colIdx] || [];
                                const curIdx = colItems.findIndex((it) => it.key === item.key);
                                const lastIdx = colItems.findIndex((it) => selectedItemKeys.includes(it.key));
                                if (lastIdx >= 0 && curIdx >= 0) {
                                  const start = Math.min(lastIdx, curIdx);
                                  const end = Math.max(lastIdx, curIdx);
                                  const rangeKeys = colItems.slice(start, end + 1).map((it) => it.key);
                                  setSelectedItemKeys(rangeKeys);
                                } else {
                                  setSelectedItemKeys([item.key]);
                                }
                              } else if (
                                selectedItemKeys.length === 1
                                && selectedItemKeys[0] === item.key
                                && inlineRenameItemKey !== item.key
                              ) {
                                queueInlineRename(item);
                              } else {
                                clearPendingRenameTrigger();
                                // 普通点击
                                setSelectedItemKeys([item.key]);
                                if (item.isFolder) {
                                  handleColumnFolderClick(item.key, colIdx);
                                } else {
                                  handleColumnFileClick(item, colIdx);
                                }
                              }
                            }}
                            onDoubleClick={() => {
                              clearPendingRenameTrigger();
                            }}
                          >
                            <span className="finder-column-item-icon">{renderFileIcon(item.fileType, { fontSize: 16 })}</span>
                            {isInlineRenaming ? (
                              <Input
                                ref={inlineRenameInputRef}
                                className="finder-inline-input finder-column-item-name"
                                value={inlineRenameName}
                                onChange={(e) => setInlineRenameName(e.target.value)}
                                onPressEnter={confirmInlineRename}
                                onBlur={confirmInlineRename}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') cancelInlineRename();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                size="small"
                              />
                            ) : (
                              <span className="finder-column-item-name">{item.name}</span>
                            )}
                            {!isInlineRenaming && (
                              <span className="finder-column-item-actions">
                                {item.isFolder && (
                                  <button
                                    type="button"
                                    className="finder-column-action-btn"
                                    aria-label="添加资料"
                                    title="添加资料"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddDialogParentKey(item.key);
                                      setAddDialogOpen(true);
                                    }}
                                  >
                                    <PlusOutlined style={{ fontSize: 12 }} />
                                  </button>
                                )}
                                <Dropdown
                                  menu={itemMoreMenu}
                                  trigger={['click']}
                                  onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                                >
                                  <button
                                    type="button"
                                    className="finder-column-action-btn"
                                    aria-label="更多操作"
                                    title="更多操作"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreOutlined style={{ fontSize: 14 }} />
                                  </button>
                                </Dropdown>
                              </span>
                            )}
                            {item.isFolder && <RightOutlined className="finder-column-item-arrow" />}
                          </div>
                        </Dropdown>
                      );
                    })}
                    <div className="finder-column-resize-handle" onMouseDown={(e) => handleColumnResizeStart(colIdx, e)} />
                  </div>
                  );
                })}

                {/* 分栏视图预览（紧跟最后一列，填满剩余空间） */}
                <div className="finder-column-preview">
                  {columnSelectedItem ? (
                    <div className="finder-preview-content">
                      <div className="finder-preview-body">
                        {columnSelectedItem.fileType === 'image' && columnSelectedItem.url
                          ? <img src={columnSelectedItem.url} alt={columnSelectedItem.name} className="finder-preview-image" />
                          : columnSelectedItem.fileType === 'pdf' && columnSelectedItem.url
                          ? <iframe src={columnSelectedItem.url} className="finder-preview-iframe" title="PDF 预览" />
                          : columnSelectedItem.fileType === 'video' && columnSelectedItem.url
                          ? <video src={columnSelectedItem.url} controls className="finder-preview-video" />
                          : <div className="finder-preview-placeholder">
                              {renderFileIcon(columnSelectedItem.fileType, { fontSize: 80 })}
                              <div>{columnSelectedItem.name}</div>
                            </div>
                        }
                      </div>
                      <div className="finder-preview-footer">
                        <div className="finder-preview-name">{columnSelectedItem.name}</div>
                        <div className="finder-preview-meta-row">
                          <span>{columnSelectedItem.fileType?.toUpperCase() || '文件'}</span>
                          {columnSelectedItem.size && <span>{(columnSelectedItem.size / 1024).toFixed(1)} KB</span>}
                          {columnSelectedItem.lastEdit && <span>{columnSelectedItem.lastEdit}</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="finder-preview-empty">
                      <FileTextOutlined style={{ fontSize: 48, color: '#d1d1d6' }} />
                      <div>选择一个文件预览</div>
                    </div>
                  )}
                </div>
              </div>
          ) : (
            <>
          {/* ==== 列表/详情视图 ==== */}
          <div 
            className="finder-file-list" 
            onContextMenu={handleBgContextMenu}
            onDragOver={handleListDragOver}
            onDrop={handleListDrop}
            onClick={handleListBlankClick}
          >
              {/* 详情模式表头 */}
              {viewMode === 'detail' && currentChildren.length > 0 && (
                <Dropdown menu={colVisibilityMenu} trigger={['contextMenu']}>
                  <div className="finder-detail-header">
                    <span className={`finder-detail-col-name finder-detail-col-sortable ${sortBy === 'name' ? 'finder-detail-col-active' : ''}`} style={nameColResized ? { width: detailColWidths.name, flex: 'none' } : { flex: 1, minWidth: 200 }} onClick={() => handleHeaderSort('name')}>
                      名称{sortBy === 'name' && <span className="finder-detail-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                      <span className="finder-detail-col-resize-handle" onMouseDown={(e) => handleDetailColResizeStart('name', e)} onClick={(e) => e.stopPropagation()} />
                    </span>
                    {visibleCols.map((colKey) => {
                      const def = COL_DEFS.find((c) => c.key === colKey);
                      if (!def) return null;
                      return (
                        <span
                          key={colKey}
                          className={`finder-detail-col-${colKey} ${def.sortable ? 'finder-detail-col-sortable' : ''} ${sortBy === colKey ? 'finder-detail-col-active' : ''}`}
                          style={{ width: detailColWidths[colKey] }}
                          onClick={() => def.sortable && handleHeaderSort(colKey)}
                        >
                          {def.label}{sortBy === colKey && <span className="finder-detail-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                          <span className="finder-detail-col-resize-handle" onMouseDown={(e) => handleDetailColResizeStart(colKey, e)} onClick={(e) => e.stopPropagation()} />
                        </span>
                      );
                    })}
                  </div>
                </Dropdown>
              )}
              {/* 内联新建文件夹 */}
              {newFolderInline && (
                <div className="finder-file-row finder-file-row-selected">
                  <span className="finder-file-icon"><FolderFilled style={{ fontSize: 18, color: '#4facfe' }} /></span>
                  <Input
                    ref={newFolderInputRef}
                    className="finder-inline-input"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={confirmNewFolder}
                    onBlur={confirmNewFolder}
                    size="small"
                    style={{ flex: 1 }}
                  />
                </div>
              )}
              {currentChildren.length === 0 && !newFolderInline ? (
                <div className="finder-empty"><Empty description={hasActiveSearch ? '无匹配资料' : (isRecentView ? '近一个月暂无最近打开的文件' : '此文件夹为空，右键新建')} image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
              ) : (
                displayChildren.map((item, idx) => {
                  const isSelected = selectedItemKeys.includes(item.key);
                  const isContextMenuTarget = contextMenuItemKey === item.key;
                  const isInlineRenaming = inlineRenameItemKey === item.key;
                  const depth = item._depth || 0;
                  const isExpanded = expandedFolders.has(item.key);
                  const rowMoreMenu = getItemMoreMenu(item, { includeFavorite: true });
                  const rowContent = (
                    <div
                      className={`finder-file-row ${isSelected ? 'finder-file-row-selected' : ''} ${isContextMenuTarget ? 'finder-file-row-context-open' : ''} ${item.isFolder && dragOverFolderKey === item.key ? 'finder-file-row-dragover' : ''}`}
                      draggable={!isInlineRenaming}
                      onMouseEnter={item.isFolder && !isInlineRenaming ? (e) => handleFolderHoverEnter(item.key, e) : undefined}
                      onMouseMove={item.isFolder && !isInlineRenaming ? (e) => handleFolderHoverMove(item.key, e) : undefined}
                      onMouseLeave={item.isFolder ? () => hideFolderHoverTip(item.key) : undefined}
                      onDragStart={(e) => {
                        hideFolderHoverTip(item.key);
                        startResourceDrag(e, item);
                      }}
                      onDragEnd={() => {
                        isDraggingRef.current = false;
                      }}
                      onDragOver={item.isFolder ? (e) => handleFolderDragOver(e, item.key) : undefined}
                      onDragLeave={item.isFolder ? (e) => handleFolderDragLeave(e, item.key) : undefined}
                      onDrop={item.isFolder ? (e) => handleFolderDrop(e, item.key) : undefined}
                      onClick={(e) => {
                        // 如果刚刚完成拖拽，不触发点击
                        if (isDraggingRef.current) return;
                        hideFolderHoverTip(item.key);
                        handleItemClick(item, idx, e);
                      }}
                      onDoubleClick={() => {
                        hideFolderHoverTip(item.key);
                        handleDoubleClick(item);
                      }}
                    >
                      {/* 展开三角（详情视图专用） */}
                      {viewMode === 'detail' && !hasActiveSearch && (
                        <span
                          className="finder-detail-expand-icon"
                          style={{ marginLeft: depth * 16 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!item.isFolder) return;
                            setExpandedFolders((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              return next;
                            });
                          }}
                        >
                          {item.isFolder ? (
                            isExpanded
                              ? <CaretDownOutlined style={{ fontSize: 10 }} />
                              : <CaretRightOutlined style={{ fontSize: 10 }} />
                          ) : null}
                        </span>
                      )}
                      <span className="finder-file-icon">{renderFileIcon(item.fileType, { fontSize: 18 })}</span>
                      {isInlineRenaming ? (
                        <Input
                          ref={inlineRenameInputRef}
                          className="finder-inline-input finder-file-name"
                          value={inlineRenameName}
                          onChange={(e) => setInlineRenameName(e.target.value)}
                          onPressEnter={confirmInlineRename}
                          onBlur={confirmInlineRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelInlineRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          size="small"
                          style={viewMode === 'detail' ? (nameColResized ? { width: detailColWidths.name - 28 - 16 - depth * 16, flex: 'none' } : { flex: 1, minWidth: 0, marginRight: 0 }) : { flex: 1 }}
                        />
                      ) : (
                        <span className="finder-file-name" style={viewMode === 'detail' ? (nameColResized ? { width: detailColWidths.name - 28 - 16 - depth * 16, flex: 'none' } : { flex: 1, minWidth: 0, marginRight: 0 }) : undefined}>{item.name}</span>
                      )}
                      {/* hover 显示的操作区：+ 和三个点 */}
                      {!isInlineRenaming && (
                        <span
                          className="finder-file-row-actions"
                          style={viewMode === 'detail' ? {
                            right: visibleColsTotalWidth + 20 + 12,
                          } : { right: 20 }}
                        >
                          {item.isFolder && (
                            <button
                              type="button"
                              className="finder-column-action-btn"
                              aria-label="添加资料"
                              title="添加资料"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddDialogParentKey(item.key);
                                setAddDialogOpen(true);
                              }}
                            >
                              <PlusOutlined style={{ fontSize: 12 }} />
                            </button>
                          )}
                          <Dropdown
                            menu={rowMoreMenu}
                            trigger={['click']}
                            onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                          >
                            <button
                              type="button"
                              className="finder-column-action-btn"
                              aria-label="更多操作"
                              title="更多操作"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreOutlined style={{ fontSize: 14 }} />
                            </button>
                          </Dropdown>
                        </span>
                      )}
                      {viewMode === 'detail' && visibleCols.map((colKey) => (
                        <span
                          key={colKey}
                          className={`finder-detail-col-${colKey}`}
                          style={{ width: detailColWidths[colKey] }}
                        >
                          {renderColCell(colKey, item)}
                        </span>
                      ))}
                      {item.isFolder && viewMode !== 'detail' && <span className="finder-file-chevron"><RightOutlined style={{ fontSize: 10 }} /></span>}
                    </div>
                  );
                  return (
                    <Dropdown
                      key={item.key}
                      menu={getContextMenu(item, { includeFavorite: true })}
                      trigger={['contextMenu']}
                      onOpenChange={(open) => handleItemContextMenuOpenChange(item.key, open)}
                    >
                      {rowContent}
                    </Dropdown>
                  );
                })
              )}
          </div>

          {folderHoverTip?.visible && (
            <div
              className="finder-folder-hover-tip"
              style={{ left: folderHoverTip.x, top: folderHoverTip.y }}
            >
              双击进入文件夹
            </div>
          )}

          {/* 预览面板拖拽调整宽度手柄 */}
          <div className="finder-preview-resize-handle" onMouseDown={handlePreviewResizeStart} />

          {/* 右侧预览面板（常驻 - 文件内容预览） */}
          <div className="finder-preview-panel" style={{ width: previewWidth }}>
            {previewItem ? (
              <div className="finder-preview-content">
                {/* 内容预览区 */}
                <div className="finder-preview-body">
                  {previewItem.isFolder ? (
                    <div className="finder-preview-folder-grid">
                      <FolderFilled style={{ fontSize: 80, color: '#4facfe' }} />
                      <div className="finder-preview-folder-hint">文件夹包含 {previewFolderCount} 个项目</div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ marginTop: 16 }}
                        onClick={() => {
                          setAddDialogParentKey(previewItem.key);
                          setAddDialogOpen(true);
                        }}
                      >
                        添加资料
                      </Button>
                    </div>
                  ) : previewItem.fileType === 'image' ? (
                    previewItem.url
                      ? <img src={previewItem.url} alt={previewItem.name} className="finder-preview-image" />
                      : <div className="finder-preview-placeholder"><FileImageOutlined style={{ fontSize: 80, color: '#007aff' }} /><div>图片预览</div></div>
                  ) : previewItem.fileType === 'pdf' ? (
                    previewItem.url
                      ? <iframe src={previewItem.url} className="finder-preview-iframe" title="PDF 预览" />
                      : <div className="finder-preview-placeholder"><FilePdfOutlined style={{ fontSize: 80, color: '#ff3b30' }} /><div>PDF 文档</div></div>
                  ) : previewItem.fileType === 'video' ? (
                    previewItem.url
                      ? <video src={previewItem.url} controls className="finder-preview-video" />
                      : <div className="finder-preview-placeholder"><PlayCircleOutlined style={{ fontSize: 80, color: '#007aff' }} /><div>视频文件</div></div>
                  ) : previewItem.fileType === 'audio' ? (
                    <div className="finder-preview-placeholder">
                      <SoundOutlined style={{ fontSize: 80, color: '#af52de' }} />
                      <div>音频文件</div>
                      {previewItem.url && <audio src={previewItem.url} controls style={{ marginTop: 16, width: '80%' }} />}
                    </div>
                  ) : previewItem.fileType === 'pptx' ? (
                    <div className="finder-preview-placeholder"><FilePptOutlined style={{ fontSize: 80, color: '#ff9500' }} /><div>PPT 演示文稿</div></div>
                  ) : previewItem.fileType === 'xlsx' ? (
                    <div className="finder-preview-placeholder"><FileExcelOutlined style={{ fontSize: 80, color: '#34c759' }} /><div>Excel 表格</div></div>
                  ) : previewItem.fileType === 'docx' ? (
                    <div className="finder-preview-placeholder"><FileWordOutlined style={{ fontSize: 80, color: '#007aff' }} /><div>Word 文档</div></div>
                  ) : (
                    <div className="finder-preview-placeholder"><FileTextOutlined style={{ fontSize: 80, color: '#8e8e93' }} /><div>文件预览</div></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="finder-preview-empty">
                <FileTextOutlined style={{ fontSize: 48, color: '#d1d1d6' }} />
                <div>选择一个文件预览</div>
              </div>
            )}
          </div>
          </>
          )}
        </div>

        {/* 底部路径栏 */}
        <div className="finder-pathbar">
          <span className="finder-pathbar-segment" onClick={() => { if (viewMode === 'column') { setColumnPath([null]); setColumnSelectedItem(null); } else { navigateTo(null); } }}>
            <span className="finder-pathbar-segment-icon"><DesktopOutlined /></span>
            <span>{scope === 'personal' ? '个人资料库' : '组织资料库'}</span>
          </span>
          {hasActiveSearch ? (
            <>
              <span className="finder-pathbar-sep">›</span>
              <span className="finder-pathbar-segment finder-pathbar-segment-current">
                <span className="finder-pathbar-segment-icon"><SearchOutlined /></span>
                <span>{activeSearchDescription}</span>
              </span>
            </>
          ) : isRecentView ? (
            <>
              <span className="finder-pathbar-sep">›</span>
              <span className="finder-pathbar-segment finder-pathbar-segment-current">
                <span className="finder-pathbar-segment-icon"><ClockCircleOutlined /></span>
                <span>最近使用</span>
              </span>
            </>
          ) : viewMode === 'detail' && activeTagFilter ? (
            <>
              {isTagFilterContextActive ? (
                tagFilterContextBreadcrumb.length > 0 ? (
                  tagFilterContextBreadcrumb.map((seg, idx) => {
                    const isContextFolder = idx === tagFilterContextBreadcrumb.length - 1;
                    return (
                      <span key={seg.key} style={{ display: 'contents' }}>
                        <span className="finder-pathbar-sep">›</span>
                        <span
                          className="finder-pathbar-segment"
                          onClick={() => {
                            if (isContextFolder) {
                              restoreTagFilterContext();
                              return;
                            }
                            navigateTo(seg.key);
                          }}
                          title={isContextFolder ? '返回到已选文件夹' : undefined}
                        >
                          <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 13 }} /></span>
                          <span>{seg.name}</span>
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <>
                    <span className="finder-pathbar-sep">›</span>
                    <span
                      className="finder-pathbar-segment"
                      onClick={restoreTagFilterContext}
                      title="返回到已选文件夹"
                    >
                      <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 13 }} /></span>
                      <span>{tagFilterContextLabel || '已选文件夹'}</span>
                    </span>
                  </>
                )
              ) : (
                breadcrumb.map((seg) => (
                  <span key={seg.key} style={{ display: 'contents' }}>
                    <span className="finder-pathbar-sep">›</span>
                    <span className="finder-pathbar-segment" onClick={() => navigateTo(seg.key)}>
                      <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 13 }} /></span>
                      <span>{seg.name}</span>
                    </span>
                  </span>
                ))
              )}
              <span className="finder-pathbar-sep">›</span>
              <span className="finder-pathbar-segment finder-pathbar-segment-current">
                <span className="finder-pathbar-segment-icon"><TagsOutlined /></span>
                <span>{activeTagFilterDef?.name || '标签'}</span>
              </span>
            </>
          ) : viewMode === 'column' ? (
            // 分栏视图：根据 columnPath 显示路径
            <>
              {columnPath.slice(1).map((folderKey, idx) => {
                const folder = list.find((r) => r.key === folderKey);
                if (!folder) return null;
                return (
                  <span key={folderKey} style={{ display: 'contents' }}>
                    <span className="finder-pathbar-sep">›</span>
                    <span className="finder-pathbar-segment" onClick={() => {
                      setColumnPath(columnPath.slice(0, idx + 2));
                      setColumnSelectedItem(null);
                    }}>
                      <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 13 }} /></span>
                      <span>{folder.name}</span>
                    </span>
                  </span>
                );
              })}
              {columnSelectedItem && (
                <span style={{ display: 'contents' }}>
                  <span className="finder-pathbar-sep">›</span>
                  <span className="finder-pathbar-segment finder-pathbar-segment-current">
                    <span className="finder-pathbar-segment-icon">{renderFileIcon(columnSelectedItem.fileType, { fontSize: 13 })}</span>
                    <span>{columnSelectedItem.name}</span>
                  </span>
                </span>
              )}
            </>
          ) : (
            // 列表/详情视图：原有 breadcrumb
            breadcrumb.map((seg) => (
              <span key={seg.key} style={{ display: 'contents' }}>
                <span className="finder-pathbar-sep">›</span>
                <span className="finder-pathbar-segment" onClick={() => navigateTo(seg.key)}>
                  <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 13 }} /></span>
                  <span>{seg.name}</span>
                </span>
              </span>
            ))
          )}
        </div>
      </div>

      <ResourceLibraryOverlays
        tagPicker={{
          open: !!tagPickerTarget,
          onClose: () => setTagPickerTarget(null),
          item: tagPickerItem,
          tagDefs,
          quickTagDefs,
          tagGroups,
          groupFilter: tagPickerGroupFilter,
          listScrollActive: tagPickerListScrollActive,
          onGroupFilterChange: setTagPickerGroupFilter,
          onListScroll: handleTagPickerListScroll,
          onToggleItemTagSelection: toggleItemTagSelection,
          onQuickTagToggle: handleQuickTagToggle,
          onCreateTag: () => {
            setNewTagName('');
            setNewTagColor('#FF3B30');
            setAddTagOpen(true);
          },
        }}
        addTag={{
          open: addTagOpen,
          onClose: () => setAddTagOpen(false),
          onConfirm: () => {
            const trimmed = newTagName.trim();
            if (!trimmed) {
              message.warning('标签名称不能为空');
              return;
            }
            setData((d) => addTagDefinition(d, {
              name: trimmed,
              color: typeof newTagColor === 'string' ? newTagColor : newTagColor.toHexString(),
            }, scope));
            setAddTagOpen(false);
            message.success(`标签「${trimmed}」已创建`);
          },
          name: newTagName,
          onNameChange: setNewTagName,
          color: newTagColor,
          onColorChange: setNewTagColor,
        }}
        createEntry={{
          open: addOpen,
          onClose: () => setAddOpen(false),
          onConfirm: handleAddSubmit,
          type: addType,
          form: addForm,
          currentFolderName: currentFolder ? currentFolder.name : '根目录',
        }}
        resourceImport={{
          open: addDialogOpen,
          onClose: () => {
            setAddDialogOpen(false);
            setAddDialogParentKey(null);
          },
          onUpload: async (files) => {
            const parentKey = addDialogParentKey === ROOT_PARENT_KEY ? null : (addDialogParentKey ?? selectedFolderKey);
            const { successCount, failureCount } = await uploadFilesToLibrary(files, { parentKey });
            setAddDialogParentKey(null);
            if (successCount > 0) {
              message.success(
                failureCount > 0
                  ? `已上传 ${successCount} 个文件，${failureCount} 个失败`
                  : `已上传 ${successCount} 个文件`,
              );
            }
          },
        }}
        parseDrawer={{
          open: parseDrawerOpen,
          onClose: () => setParseDrawerOpen(false),
        }}
      />
    </div>
    </>
  );
}
