import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Checkbox, Empty, Input, Select } from 'antd';
import {
  CaretDownOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DesktopOutlined,
  FolderFilled,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  getLibraryDescendantFiles,
  getLibraryItemPath,
  getLibraryItemsById,
  getOrganizations,
  getTagDefinitions,
  loadResourceLib,
} from './resourceLibStore';
import { getFileTypeLabel, renderFileIcon } from './resourceIcons.jsx';
import './SpaceResourceImportModal.css';

const ROOT_STATE = Object.freeze({
  selectedFolderKey: null,
  specialView: 'all',
  activeTagFilter: null,
});
const VIEWPORT_MARGIN = 24;
const DEFAULT_MODAL_FRAME = Object.freeze({
  width: 1120,
  height: 720,
});
const MIN_MODAL_FRAME = Object.freeze({
  width: 860,
  height: 560,
});
const DEFAULT_DETAIL_COL_WIDTHS = Object.freeze({
  name: 420,
  modified: 220,
  size: 96,
  kind: 160,
  added: 220,
});
const DETAIL_COL_MIN_WIDTHS = Object.freeze({
  name: 220,
  modified: 160,
  size: 72,
  kind: 110,
  added: 160,
});
const DETAIL_COL_KEYS = Object.freeze(['name', 'modified', 'size', 'kind', 'added']);

function getSelectableFileType(item) {
  if (item?.isFolder) return 'folder';
  return item?.fileType || item?.type || 'other';
}

function parseDateValue(value) {
  if (!value) return 0;
  const ts = Date.parse(String(value).replace(/\./g, '-').replace(/\//g, '-'));
  return Number.isNaN(ts) ? 0 : ts;
}

function formatSize(size) {
  if (!size || Number.isNaN(Number(size))) return '--';
  const numericSize = Number(size);
  if (numericSize >= 1024 * 1024) return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
  if (numericSize >= 1024) return `${(numericSize / 1024).toFixed(1)} KB`;
  return `${numericSize} B`;
}

function formatKind(item) {
  if (item?.isFolder) return '文件夹';
  return getFileTypeLabel(item?.fileType || item?.type);
}

function formatDate(value) {
  return value || '--';
}

function getFavorites(libraryId) {
  try {
    return JSON.parse(localStorage.getItem(`guoren_rl_favorites_${libraryId}`) || '[]');
  } catch {
    return [];
  }
}

function normalizeNavigationState(nextState = {}) {
  return {
    selectedFolderKey: nextState.selectedFolderKey ?? null,
    specialView: nextState.specialView || 'all',
    activeTagFilter: nextState.activeTagFilter ?? null,
  };
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function fitColumnWidths(preferredWidths, minWidths, availableWidth) {
  const keys = DETAIL_COL_KEYS;
  const preferredTotal = keys.reduce((sum, key) => sum + preferredWidths[key], 0);
  const minTotal = keys.reduce((sum, key) => sum + minWidths[key], 0);

  if (availableWidth >= preferredTotal) return preferredWidths;
  if (availableWidth <= minTotal) return minWidths;

  const ratio = (availableWidth - minTotal) / Math.max(1, preferredTotal - minTotal);
  const fitted = {};

  keys.forEach((key) => {
    const min = minWidths[key];
    const preferred = preferredWidths[key];
    fitted[key] = Math.round(min + (preferred - min) * ratio);
  });

  const fittedTotal = keys.reduce((sum, key) => sum + fitted[key], 0);
  const delta = availableWidth - fittedTotal;
  if (delta !== 0) {
    fitted.name = Math.max(minWidths.name, fitted.name + delta);
  }

  return fitted;
}

function getViewportBounds() {
  if (typeof window === 'undefined') {
    return {
      minWidth: MIN_MODAL_FRAME.width,
      minHeight: MIN_MODAL_FRAME.height,
      maxWidth: DEFAULT_MODAL_FRAME.width,
      maxHeight: DEFAULT_MODAL_FRAME.height,
    };
  }

  const maxWidth = Math.max(640, window.innerWidth - VIEWPORT_MARGIN * 2);
  const maxHeight = Math.max(480, window.innerHeight - VIEWPORT_MARGIN * 2);

  return {
    minWidth: Math.min(MIN_MODAL_FRAME.width, maxWidth),
    minHeight: Math.min(MIN_MODAL_FRAME.height, maxHeight),
    maxWidth,
    maxHeight,
  };
}

function clampFrame(frame) {
  const bounds = getViewportBounds();
  const width = clamp(frame.width, bounds.minWidth, bounds.maxWidth);
  const height = clamp(frame.height, bounds.minHeight, bounds.maxHeight);

  if (typeof window === 'undefined') {
    return { ...frame, width, height };
  }

  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - width);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN - height);

  return {
    width,
    height,
    left: clamp(frame.left, VIEWPORT_MARGIN, maxLeft),
    top: clamp(frame.top, VIEWPORT_MARGIN, maxTop),
  };
}

function getInitialModalFrame() {
  const bounds = getViewportBounds();
  const width = clamp(DEFAULT_MODAL_FRAME.width, bounds.minWidth, bounds.maxWidth);
  const height = clamp(DEFAULT_MODAL_FRAME.height, bounds.minHeight, bounds.maxHeight);

  if (typeof window === 'undefined') {
    return {
      width,
      height,
      left: VIEWPORT_MARGIN,
      top: VIEWPORT_MARGIN,
    };
  }

  return {
    width,
    height,
    left: Math.max(VIEWPORT_MARGIN, Math.round((window.innerWidth - width) / 2)),
    top: Math.max(VIEWPORT_MARGIN, Math.round((window.innerHeight - height) / 2)),
  };
}

export default function SpaceResourceImportModal({
  open,
  onClose,
  onConfirm,
  excludeFileTypes = ['knowledgeGraph'],
}) {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('personal');
  const [organizationId, setOrganizationId] = useState(() => data.currentOrgId || 'org_default');
  const [keyword, setKeyword] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [includeDirectories, setIncludeDirectories] = useState(true);
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [expandedFolderKeys, setExpandedFolderKeys] = useState(new Set());
  const [specialView, setSpecialView] = useState('all');
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [navHistory, setNavHistory] = useState([ROOT_STATE]);
  const [navIndex, setNavIndex] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [detailColWidths, setDetailColWidths] = useState(DEFAULT_DETAIL_COL_WIDTHS);
  const [dragInteractionType, setDragInteractionType] = useState(null);
  const [modalFrame, setModalFrame] = useState(() => getInitialModalFrame());
  const lastClickedIndexRef = useRef(null);
  const modalFrameRef = useRef(modalFrame);
  const pointerStateRef = useRef(null);
  const detailColResizeRef = useRef(null);

  const organizations = useMemo(() => getOrganizations(data), [data]);
  const libraryId = scope === 'personal' ? 'personal' : organizationId;
  const libraryName = scope === 'personal'
    ? '个人资料库'
    : (organizations.find((item) => item.id === organizationId)?.name || '组织资料库');
  const excludeSet = useMemo(() => new Set(excludeFileTypes), [excludeFileTypes]);
  const libraryItems = useMemo(() => getLibraryItemsById(data, libraryId), [data, libraryId]);
  const itemMap = useMemo(() => new Map(libraryItems.map((item) => [item.key, item])), [libraryItems]);
  const tagDefs = useMemo(() => getTagDefinitions(data, scope), [data, scope]);
  const tagDefMap = useMemo(() => new Map(tagDefs.map((tag) => [tag.id, tag])), [tagDefs]);

  const visibleFileAllowed = (item) => {
    if (!item) return false;
    if (item.isFolder) {
      return getLibraryDescendantFiles(data, libraryId, item.key).some((file) => !excludeSet.has(file.fileType));
    }
    return !excludeSet.has(item.fileType);
  };

  useEffect(() => {
    if (!open) return;
    const nextData = loadResourceLib();
    const nextOrganizations = getOrganizations(nextData);
    setData(nextData);
    setScope('personal');
    setOrganizationId(nextData.currentOrgId || nextOrganizations[0]?.id || 'org_default');
    setKeyword('');
    setSelectedKeys([]);
    setIncludeDirectories(true);
    setSelectedFolderKey(null);
    setExpandedFolderKeys(new Set());
    setSpecialView('all');
    setActiveTagFilter(null);
    setNavHistory([ROOT_STATE]);
    setNavIndex(0);
    setSortBy('name');
    setSortOrder('asc');
    setDetailColWidths(DEFAULT_DETAIL_COL_WIDTHS);
    setDragInteractionType(null);
    setModalFrame(getInitialModalFrame());
    lastClickedIndexRef.current = null;
  }, [open]);

  useEffect(() => {
    modalFrameRef.current = modalFrame;
  }, [modalFrame]);

  useEffect(() => {
    if (!open) return undefined;
    const handleWindowResize = () => {
      setModalFrame((prev) => clampFrame(prev));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [open]);

  useEffect(() => () => {
    const pointerState = pointerStateRef.current;
    if (!pointerState) return;
    window.removeEventListener('mousemove', pointerState.onMove);
    window.removeEventListener('mouseup', pointerState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  useEffect(() => () => {
    const resizeState = detailColResizeRef.current;
    if (!resizeState) return;
    window.removeEventListener('mousemove', resizeState.onMove);
    window.removeEventListener('mouseup', resizeState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (scope !== 'organization') return;
    if (organizations.some((item) => item.id === organizationId)) return;
    setOrganizationId(organizations[0]?.id || 'org_default');
  }, [scope, organizationId, organizations]);

  const favorites = useMemo(() => (
    getFavorites(libraryId)
      .map((entry) => itemMap.get(entry.key))
      .filter((item) => item && visibleFileAllowed(item))
  ), [itemMap, libraryId]);

  const sidebarTags = useMemo(() => {
    const usedTagIds = new Set();
    libraryItems.forEach((item) => {
      (item.tags || []).forEach((tagId) => {
        if (tagDefMap.has(tagId)) usedTagIds.add(tagId);
      });
    });
    return tagDefs.filter((tag) => usedTagIds.has(tag.id));
  }, [libraryItems, tagDefMap, tagDefs]);

  const currentFolder = selectedFolderKey ? itemMap.get(selectedFolderKey) || null : null;
  const currentTitle = activeTagFilter
    ? (tagDefMap.get(activeTagFilter)?.name || '标签')
    : specialView === 'recent'
      ? '最近使用'
      : currentFolder?.name || libraryName;
  const isCompactLayout = modalFrame.width < 920;
  const isNarrowLayout = !isCompactLayout && modalFrame.width < 1120;
  const sidebarWidth = isCompactLayout ? 0 : (isNarrowLayout ? 200 : 220);
  const toolbarSearchWidth = isCompactLayout ? null : (isNarrowLayout ? 164 : 184);
  const detailColumnClassMap = {
    name: 'name',
    date: 'modified',
    size: 'size',
    kind: 'kind',
    addedAt: 'added',
  };
  const detailColumns = [
    { key: 'name', widthKey: 'name', label: '名称', sortable: true },
    { key: 'date', widthKey: 'modified', label: '修改日期', sortable: true },
    { key: 'size', widthKey: 'size', label: '大小', sortable: true },
    { key: 'kind', widthKey: 'kind', label: '种类', sortable: true },
    { key: 'addedAt', widthKey: 'added', label: '添加日期', sortable: false },
  ];
  const availableTableWidth = Math.max(
    DETAIL_COL_KEYS.reduce((sum, key) => sum + DETAIL_COL_MIN_WIDTHS[key], 0),
    Math.floor(modalFrame.width - sidebarWidth - (isCompactLayout ? 28 : 46)),
  );
  const fittedDetailColWidths = useMemo(
    () => fitColumnWidths(detailColWidths, DETAIL_COL_MIN_WIDTHS, availableTableWidth),
    [availableTableWidth, detailColWidths],
  );
  const detailGridTemplateColumns = `${fittedDetailColWidths.name}px ${fittedDetailColWidths.modified}px ${fittedDetailColWidths.size}px ${fittedDetailColWidths.kind}px ${fittedDetailColWidths.added}px`;

  const sortLibraryItems = (items) => [...items].sort((left, right) => {
    if (left.isFolder !== right.isFolder) return left.isFolder ? -1 : 1;

    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = parseDateValue(left.lastEdit) - parseDateValue(right.lastEdit);
        break;
      case 'size':
        comparison = Number(left.size || 0) - Number(right.size || 0);
        break;
      case 'kind':
        comparison = String(left.fileType || left.type || '').localeCompare(String(right.fileType || right.type || ''), 'zh-CN');
        break;
      case 'name':
      default:
        comparison = String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN');
        break;
    }

    if (comparison === 0) {
      comparison = String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN');
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleHeaderSort = (field) => {
    if (field === sortBy) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder(field === 'name' || field === 'kind' ? 'asc' : 'desc');
  };

  const applyNavigationState = (nextState, options = {}) => {
    const normalized = normalizeNavigationState(nextState);
    setSelectedFolderKey(normalized.selectedFolderKey);
    setExpandedFolderKeys(new Set());
    setSpecialView(normalized.specialView);
    setActiveTagFilter(normalized.activeTagFilter);
    setSelectedKeys([]);
    lastClickedIndexRef.current = null;

    if (options.pushHistory === false) return;
    const nextHistory = [...navHistory.slice(0, navIndex + 1), normalized];
    setNavHistory(nextHistory);
    setNavIndex(nextHistory.length - 1);
  };

  const resetNavigation = () => {
    setSelectedFolderKey(null);
    setExpandedFolderKeys(new Set());
    setSpecialView('all');
    setActiveTagFilter(null);
    setSelectedKeys([]);
    setNavHistory([ROOT_STATE]);
    setNavIndex(0);
    lastClickedIndexRef.current = null;
  };

  const handleScopeChange = (nextScope) => {
    if (nextScope === scope) return;
    setScope(nextScope);
    setKeyword('');
    setSelectedFolderKey(null);
    setExpandedFolderKeys(new Set());
    setSpecialView('all');
    setActiveTagFilter(null);
    setSelectedKeys([]);
    setNavHistory([ROOT_STATE]);
    setNavIndex(0);
    lastClickedIndexRef.current = null;
  };

  const handleOrganizationChange = (nextOrgId) => {
    if (nextOrgId === organizationId) return;
    setOrganizationId(nextOrgId);
    setKeyword('');
    resetNavigation();
  };

  const baseItems = useMemo(() => {
    let items;
    if (activeTagFilter) {
      items = libraryItems.filter((item) => visibleFileAllowed(item) && (item.tags || []).includes(activeTagFilter));
      return sortLibraryItems(items);
    }

    if (specialView === 'recent') {
      items = libraryItems.filter((item) => visibleFileAllowed(item) && (item.lastOpenedAt || item.lastEdit));
      return sortLibraryItems(items);
    }

    const parentKey = selectedFolderKey ?? null;
    items = libraryItems.filter((item) => (item.parentKey ?? null) === parentKey && visibleFileAllowed(item));
    return sortLibraryItems(items);
  }, [activeTagFilter, libraryItems, selectedFolderKey, sortBy, sortOrder, specialView]);

  const visibleItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return baseItems;
    return baseItems.filter((item) => {
      const haystack = `${item.name} ${getLibraryItemPath(data, libraryId, item)} ${item.fileType || ''}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [baseItems, data, keyword, libraryId]);
  const isTreeMode = !keyword.trim() && specialView === 'all' && !activeTagFilter;
  const sortedChildMap = useMemo(() => {
    const map = new Map();
    libraryItems.forEach((item) => {
      if (!visibleFileAllowed(item)) return;
      const parentKey = item.parentKey ?? null;
      if (!map.has(parentKey)) map.set(parentKey, []);
      map.get(parentKey).push(item);
    });
    map.forEach((items, key) => {
      map.set(key, sortLibraryItems(items));
    });
    return map;
  }, [libraryItems, sortBy, sortOrder]);
  const displayItems = useMemo(() => {
    if (!isTreeMode) return visibleItems.map((item) => ({ ...item, _depth: 0 }));
    const result = [];
    const visit = (parentKey, depth) => {
      const children = sortedChildMap.get(parentKey ?? null) || [];
      children.forEach((item) => {
        result.push({ ...item, _depth: depth });
        if (item.isFolder && expandedFolderKeys.has(item.key)) {
          visit(item.key, depth + 1);
        }
      });
    };
    visit(selectedFolderKey ?? null, 0);
    return result;
  }, [expandedFolderKeys, isTreeMode, selectedFolderKey, sortedChildMap, visibleItems]);

  const selectedItems = useMemo(() => (
    selectedKeys.map((key) => itemMap.get(key)).filter(Boolean)
  ), [itemMap, selectedKeys]);
  const selectedFolderCount = selectedItems.filter((item) => item.isFolder).length;
  const selectedFileCount = selectedItems.length - selectedFolderCount;
  const canNavigateBack = navIndex > 0;
  const canNavigateForward = navIndex < navHistory.length - 1;

  const handleBack = () => {
    if (!canNavigateBack) return;
    const nextIndex = navIndex - 1;
    setNavIndex(nextIndex);
    const state = navHistory[nextIndex] || ROOT_STATE;
    setSelectedFolderKey(state.selectedFolderKey);
    setSpecialView(state.specialView);
    setActiveTagFilter(state.activeTagFilter);
    setSelectedKeys([]);
    lastClickedIndexRef.current = null;
  };

  const handleForward = () => {
    if (!canNavigateForward) return;
    const nextIndex = navIndex + 1;
    setNavIndex(nextIndex);
    const state = navHistory[nextIndex] || ROOT_STATE;
    setSelectedFolderKey(state.selectedFolderKey);
    setSpecialView(state.specialView);
    setActiveTagFilter(state.activeTagFilter);
    setSelectedKeys([]);
    lastClickedIndexRef.current = null;
  };

  const handleOpenFolder = (folderKey) => {
    applyNavigationState({
      selectedFolderKey: folderKey,
      specialView: 'all',
      activeTagFilter: null,
    });
  };

  const handleToggleFolderExpand = (folderKey) => {
    setExpandedFolderKeys((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) next.delete(folderKey);
      else next.add(folderKey);
      return next;
    });
  };

  const handleOpenFavorite = (item) => {
    if (!item) return;
    if (item.isFolder) {
      handleOpenFolder(item.key);
      return;
    }
    applyNavigationState({
      selectedFolderKey: item.parentKey ?? null,
      specialView: 'all',
      activeTagFilter: null,
    });
    setSelectedKeys([item.key]);
  };

  const handleSelectRow = (item, rowIndex, event) => {
    if (event.shiftKey && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, rowIndex);
      const end = Math.max(lastClickedIndexRef.current, rowIndex);
      const rangeKeys = displayItems.slice(start, end + 1).map((entry) => entry.key);
      setSelectedKeys(rangeKeys);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      setSelectedKeys((prev) => (
        prev.includes(item.key)
          ? prev.filter((key) => key !== item.key)
          : [...prev, item.key]
      ));
      lastClickedIndexRef.current = rowIndex;
      return;
    }

    setSelectedKeys([item.key]);
    lastClickedIndexRef.current = rowIndex;
  };

  const stopPointerInteraction = () => {
    const pointerState = pointerStateRef.current;
    if (!pointerState) return;
    window.removeEventListener('mousemove', pointerState.onMove);
    window.removeEventListener('mouseup', pointerState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    pointerStateRef.current = null;
    setDragInteractionType(null);
  };

  const startPointerInteraction = (event, type) => {
    if (event.button !== 0) return;
    event.preventDefault();

    stopPointerInteraction();

    const originFrame = modalFrameRef.current;
    const onMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - event.clientX;
      const deltaY = moveEvent.clientY - event.clientY;

      if (type === 'drag') {
        setModalFrame(clampFrame({
          ...originFrame,
          left: originFrame.left + deltaX,
          top: originFrame.top + deltaY,
        }));
        return;
      }

      setModalFrame(clampFrame({
        ...originFrame,
        width: originFrame.width + deltaX,
        height: originFrame.height + deltaY,
      }));
    };
    const onUp = () => stopPointerInteraction();

    pointerStateRef.current = { onMove, onUp };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    setDragInteractionType(type);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = type === 'drag' ? 'grabbing' : 'nwse-resize';
  };

  const handleToolbarMouseDown = (event) => {
    const interactiveTarget = event.target.closest(
      'button, input, .ant-input-affix-wrapper, .ant-input, .ant-select, .ant-checkbox-wrapper, .space-resource-import-close-btn',
    );
    if (interactiveTarget) return;
    startPointerInteraction(event, 'drag');
  };

  const handleResizeMouseDown = (event) => {
    event.stopPropagation();
    startPointerInteraction(event, 'resize');
  };

  const handleDetailColResizeStart = (widthKey, event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = detailColWidths[widthKey];
    const minWidth = DETAIL_COL_MIN_WIDTHS[widthKey] || 80;
    const onMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      setDetailColWidths((prev) => ({
        ...prev,
        [widthKey]: Math.max(minWidth, startWidth + delta),
      }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      detailColResizeRef.current = null;
    };
    detailColResizeRef.current = { onMove, onUp };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="space-resource-import-layer">
      <div
        className="space-resource-import-window-frame"
        style={{
          left: `${modalFrame.left}px`,
          top: `${modalFrame.top}px`,
          width: `${modalFrame.width}px`,
        }}
      >
        <div
          className={`space-resource-import-shell ${dragInteractionType === 'drag' ? 'is-dragging' : ''} ${isCompactLayout ? 'is-compact' : ''} ${isNarrowLayout ? 'is-narrow' : ''}`}
          style={{ height: `${modalFrame.height}px` }}
        >
          <div className="space-resource-import-main">
            <aside
              className="space-resource-import-sidebar"
              style={isCompactLayout ? undefined : { width: `${sidebarWidth}px`, flexBasis: `${sidebarWidth}px` }}
            >
            <div className="space-resource-import-scope-switcher">
              <button
                type="button"
                className={`space-resource-import-scope-btn ${scope === 'personal' ? 'is-active' : ''}`}
                onClick={() => handleScopeChange('personal')}
              >
                个人库
              </button>
              <button
                type="button"
                className={`space-resource-import-scope-btn ${scope === 'organization' ? 'is-active' : ''}`}
                onClick={() => handleScopeChange('organization')}
              >
                组织库
              </button>
            </div>

            {scope === 'organization' ? (
              <Select
                size="small"
                value={organizationId}
                onChange={handleOrganizationChange}
                options={organizations.map((item) => ({ label: item.name, value: item.id }))}
                className="space-resource-import-org-select"
              />
            ) : null}

            <div className="space-resource-import-sidebar-section">
              <div className="space-resource-import-sidebar-title">{scope === 'personal' ? '个人收藏' : '组织收藏'}</div>
              <button
                type="button"
                className={`space-resource-import-sidebar-item ${specialView === 'all' && !selectedFolderKey && !activeTagFilter ? 'is-active' : ''}`}
                onClick={() => applyNavigationState(ROOT_STATE)}
              >
                <span className="space-resource-import-sidebar-icon"><DesktopOutlined /></span>
                <span>全部资料</span>
              </button>
              <button
                type="button"
                className={`space-resource-import-sidebar-item ${specialView === 'recent' ? 'is-active' : ''}`}
                onClick={() => applyNavigationState({ selectedFolderKey: null, specialView: 'recent', activeTagFilter: null })}
              >
                <span className="space-resource-import-sidebar-icon"><ClockCircleOutlined /></span>
                <span>最近使用</span>
              </button>
              {favorites.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`space-resource-import-sidebar-item ${selectedFolderKey === item.key && specialView === 'all' && !activeTagFilter ? 'is-active' : ''}`}
                  onClick={() => handleOpenFavorite(item)}
                >
                  <span className="space-resource-import-sidebar-icon">
                    {item.isFolder ? <FolderFilled /> : <StarFilled />}
                  </span>
                  <span className="space-resource-import-sidebar-text">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="space-resource-import-sidebar-section">
              <div className="space-resource-import-sidebar-title">标签</div>
              {sidebarTags.length ? sidebarTags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={`space-resource-import-sidebar-item ${activeTagFilter === tag.id ? 'is-active' : ''}`}
                  onClick={() => applyNavigationState({ selectedFolderKey: null, specialView: 'all', activeTagFilter: tag.id })}
                >
                  <span className="space-resource-import-tag-dot" style={{ background: tag.color }} />
                  <span className="space-resource-import-sidebar-text">{tag.name}</span>
                </button>
              )) : (
                <div className="space-resource-import-sidebar-empty">当前资料库暂无标签</div>
              )}
            </div>
          </aside>

            <section className="space-resource-import-content">
              <div
                className={`space-resource-import-toolbar ${dragInteractionType === 'drag' ? 'is-dragging' : ''}`}
                onMouseDown={handleToolbarMouseDown}
              >
              <div className="space-resource-import-toolbar-nav">
                <button
                  type="button"
                  className="space-resource-import-nav-btn"
                  onClick={handleBack}
                  disabled={!canNavigateBack}
                >
                  <LeftOutlined />
                </button>
                <button
                  type="button"
                  className="space-resource-import-nav-btn"
                  onClick={handleForward}
                  disabled={!canNavigateForward}
                >
                  <RightOutlined />
                </button>
              </div>
              <div className="space-resource-import-toolbar-title">{currentTitle}</div>
              <div
                className="space-resource-import-toolbar-search"
                style={toolbarSearchWidth ? { width: `${toolbarSearchWidth}px` } : undefined}
              >
                <Input
                  allowClear
                  size="small"
                  prefix={<SearchOutlined style={{ fontSize: 12, color: '#8d8d92' }} />}
                  placeholder="搜索"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setSelectedKeys([]);
                    lastClickedIndexRef.current = null;
                  }}
                />
              </div>
              <button
                type="button"
                className="space-resource-import-close-btn"
                onClick={onClose}
                aria-label="关闭"
              >
                <CloseOutlined />
              </button>
              </div>

              <div className="space-resource-import-table">
                <div className="space-resource-import-list-header" style={{ gridTemplateColumns: detailGridTemplateColumns }}>
                  {detailColumns.map((column) => (
                    <span
                      key={column.key}
                      className={`space-resource-import-header-cell space-resource-import-col-${detailColumnClassMap[column.key]} ${column.sortable ? 'space-resource-import-col-sortable' : ''} ${sortBy === column.key ? 'is-active' : ''}`}
                      onClick={() => column.sortable && handleHeaderSort(column.key)}
                    >
                      <span className="space-resource-import-col-label">
                        {column.label}
                        {sortBy === column.key ? (
                          <span className="space-resource-import-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        ) : null}
                      </span>
                      <span
                        className="space-resource-import-col-resize-handle"
                        onMouseDown={(event) => handleDetailColResizeStart(column.widthKey, event)}
                      />
                    </span>
                  ))}
                </div>

                <div className="space-resource-import-list-body">
                  {displayItems.length ? displayItems.map((item, index) => {
                    const isSelected = selectedKeys.includes(item.key);
                    const isExpanded = expandedFolderKeys.has(item.key);
                    return (
                      <div
                        key={item.key}
                        className={`space-resource-import-row ${isSelected ? 'is-selected' : ''}`}
                        style={{ gridTemplateColumns: detailGridTemplateColumns }}
                        onClick={(event) => handleSelectRow(item, index, event)}
                        onDoubleClick={() => {
                          if (item.isFolder) handleOpenFolder(item.key);
                        }}
                      >
                        <span className="space-resource-import-col-name">
                          <span
                            className="space-resource-import-row-name-wrap"
                            style={{ paddingLeft: `${item._depth * 20}px` }}
                          >
                            <button
                              type="button"
                              className={`space-resource-import-row-expander ${item.isFolder ? 'is-folder' : 'is-empty'}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (item.isFolder) handleToggleFolderExpand(item.key);
                              }}
                              aria-label={item.isFolder ? (isExpanded ? '收起文件夹' : '展开文件夹') : '文件'}
                              tabIndex={item.isFolder ? 0 : -1}
                            >
                              {item.isFolder ? (
                                isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />
                              ) : null}
                            </button>
                            <span className="space-resource-import-row-icon">
                              {renderFileIcon(getSelectableFileType(item), { fontSize: 18 })}
                            </span>
                            <span className="space-resource-import-row-name">{item.name}</span>
                          </span>
                        </span>
                        <span className="space-resource-import-col-modified">{formatDate(item.lastEdit)}</span>
                        <span className="space-resource-import-col-size">{formatSize(item.size)}</span>
                        <span className="space-resource-import-col-kind">{formatKind(item)}</span>
                        <span className="space-resource-import-col-added">{formatDate(item.addedAt || item.lastEdit)}</span>
                      </div>
                    );
                  }) : (
                    <div className="space-resource-import-empty">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={keyword ? `没有匹配“${keyword}”的资料` : '当前目录没有可导入的资料'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-resource-import-footer">
            <div className="space-resource-import-footer-left">
              <Checkbox checked={includeDirectories} onChange={(event) => setIncludeDirectories(event.target.checked)}>
                包括目录
              </Checkbox>
            </div>
            <div className="space-resource-import-footer-summary">
              <span>已选 {selectedItems.length} 项</span>
              <span>{selectedFolderCount} 个文件夹</span>
              <span>{selectedFileCount} 个文件</span>
            </div>
            <div className="space-resource-import-footer-actions">
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                disabled={selectedItems.length === 0}
                onClick={() => onConfirm?.({ selectedItems, includeDirectories, libraryId })}
              >
                导入
              </Button>
            </div>
            <button
              type="button"
              className="space-resource-import-resize-handle"
              onMouseDown={handleResizeMouseDown}
              aria-label="调整窗口大小"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
