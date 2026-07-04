import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Checkbox, Dropdown, Empty, Input, Select } from 'antd';
import {
  CaretDownOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DesktopOutlined,
  FolderFilled,
  LeftOutlined,
  MenuFoldOutlined,
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
const DETAIL_COLUMN_DEFS = Object.freeze([
  { key: 'date', widthKey: 'modified', label: '修改日期', sortable: true, className: 'modified' },
  { key: 'size', widthKey: 'size', label: '大小', sortable: true, className: 'size' },
  { key: 'kind', widthKey: 'kind', label: '种类', sortable: true, className: 'kind' },
  { key: 'addedAt', widthKey: 'added', label: '添加日期', sortable: false, className: 'added' },
]);
const DEFAULT_VISIBLE_COLUMN_KEYS = Object.freeze(['kind', 'addedAt']);

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

function fitColumnWidths(preferredWidths, minWidths, availableWidth, keys = DETAIL_COL_KEYS) {
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

export function SpaceResourceImportBrowser({
  active = true,
  onClose,
  onConfirm,
  excludeFileTypes = ['knowledgeGraph', 'capabilityModel'],
  frameWidth = null,
  shellStyle,
  dragging = false,
  embedded = false,
  showCloseButton = true,
  showFooter = true,
  showFooterActions = true,
  showIncludeDirectories = true,
  showFooterSummary = true,
  onToolbarMouseDown,
  onResizeMouseDown,
  itemDragConfig = null,
  defaultVisibleColumnKeys = DEFAULT_VISIBLE_COLUMN_KEYS,
  allowColumnVisibilityMenu = true,
  disableCompactLayout = false,
  showSidebar = true,
  showScopeSwitcherInToolbar = false,
  showToolbarTitle = true,
  showFooterPath = false,
  footerHint = '',
  closeButtonMode = 'close',
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
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(defaultVisibleColumnKeys);
  const [measuredWidth, setMeasuredWidth] = useState(() => frameWidth || DEFAULT_MODAL_FRAME.width);
  const lastClickedIndexRef = useRef(null);
  const detailColResizeRef = useRef(null);
  const shellRef = useRef(null);
  const listBodyRef = useRef(null);
  const rowNodeMapRef = useRef(new Map());
  const [selectionIndicator, setSelectionIndicator] = useState({
    visible: false,
    top: 0,
    height: 0,
    key: null,
  });

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
    if (!active) return;
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
    setVisibleColumnKeys(defaultVisibleColumnKeys);
    lastClickedIndexRef.current = null;
  }, [active, defaultVisibleColumnKeys]);

  useEffect(() => {
    if (!active || frameWidth) return undefined;
    const node = shellRef.current;
    if (!node) return undefined;
    const updateWidth = () => {
      const nextWidth = Math.max(640, Math.round(node.clientWidth || DEFAULT_MODAL_FRAME.width));
      setMeasuredWidth(nextWidth);
    };
    updateWidth();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, frameWidth]);

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

  useEffect(() => {
    if (sortBy === 'name') return;
    if (visibleColumnKeys.includes(sortBy)) return;
    setSortBy('name');
    setSortOrder('asc');
  }, [sortBy, visibleColumnKeys]);

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
  const currentPathLabel = useMemo(() => {
    if (activeTagFilter) {
      return `${libraryName} / 标签 / ${tagDefMap.get(activeTagFilter)?.name || '标签'}`;
    }
    if (specialView === 'recent') {
      return `${libraryName} / 最近使用`;
    }
    if (currentFolder) {
      return getLibraryItemPath(data, libraryId, currentFolder);
    }
    return libraryName;
  }, [activeTagFilter, currentFolder, data, libraryId, libraryName, specialView, tagDefMap]);
  const effectiveWidth = Math.max(640, Math.round(frameWidth || measuredWidth || DEFAULT_MODAL_FRAME.width));
  const isCompactLayout = !disableCompactLayout && effectiveWidth < 920;
  const isNarrowLayout = !disableCompactLayout && !isCompactLayout && effectiveWidth < 1120;
  const relaxedToolbarLayout = showScopeSwitcherInToolbar && !showToolbarTitle;
  const sidebarWidth = showSidebar
    ? (
      isCompactLayout
        ? 0
        : (
          scope === 'organization'
            ? (isNarrowLayout ? 236 : 256)
            : (isNarrowLayout ? 200 : 220)
        )
    )
    : 0;
  const toolbarSearchWidth = isCompactLayout ? null : (isNarrowLayout ? 164 : 184);
  const visibleDetailColumns = useMemo(
    () => DETAIL_COLUMN_DEFS.filter((column) => visibleColumnKeys.includes(column.key)),
    [visibleColumnKeys],
  );
  const activeWidthKeys = useMemo(
    () => ['name', ...visibleDetailColumns.map((column) => column.widthKey)],
    [visibleDetailColumns],
  );
  const availableTableWidth = Math.max(
    activeWidthKeys.reduce((sum, key) => sum + DETAIL_COL_MIN_WIDTHS[key], 0),
    Math.floor(effectiveWidth - sidebarWidth - (isCompactLayout ? 28 : 46)),
  );
  const closeButtonIcon = closeButtonMode === 'collapse' ? <MenuFoldOutlined /> : <CloseOutlined />;
  const closeButtonLabel = closeButtonMode === 'collapse' ? '收起' : '关闭';
  const fittedDetailColWidths = useMemo(
    () => fitColumnWidths(detailColWidths, DETAIL_COL_MIN_WIDTHS, availableTableWidth, activeWidthKeys),
    [activeWidthKeys, availableTableWidth, detailColWidths],
  );
  const detailGridTemplateColumns = useMemo(
    () => activeWidthKeys.map((key) => `${fittedDetailColWidths[key]}px`).join(' '),
    [activeWidthKeys, fittedDetailColWidths],
  );
  const columnVisibilityMenu = {
    items: DETAIL_COLUMN_DEFS.map((column) => ({
      key: column.key,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 104 }}>
          <span style={{ width: 14, display: 'inline-block', textAlign: 'center', color: '#1677ff' }}>
            {visibleColumnKeys.includes(column.key) ? '✓' : ''}
          </span>
          {column.label}
        </span>
      ),
    })),
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      setVisibleColumnKeys((prev) => {
        if (prev.includes(key)) {
          if (prev.length === 1) return prev;
          return prev.filter((item) => item !== key);
        }
        const next = [...prev, key];
        return DETAIL_COLUMN_DEFS.map((column) => column.key).filter((item) => next.includes(item));
      });
    },
  };

  const sortLibraryItems = (items) => [...items].sort((left, right) => {
    if (left.isFolder !== right.isFolder) return left.isFolder ? -1 : 1;

    let comparison;
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
  const contextualSelectedItems = useMemo(() => (
    selectedItems.map((item) => ({
      ...item,
      libraryId,
      libraryName,
      libraryScope: scope,
      path: getLibraryItemPath(data, libraryId, item),
    }))
  ), [data, libraryId, libraryName, scope, selectedItems]);
  const selectedFolderCount = selectedItems.filter((item) => item.isFolder).length;
  const selectedFileCount = selectedItems.length - selectedFolderCount;
  const canNavigateBack = navIndex > 0;
  const canNavigateForward = navIndex < navHistory.length - 1;

  useLayoutEffect(() => {
    if (!active) {
      setSelectionIndicator((prev) => (prev.visible ? { visible: false, top: 0, height: 0, key: null } : prev));
      return;
    }
    if (selectedKeys.length !== 1) {
      setSelectionIndicator((prev) => (prev.visible ? { ...prev, visible: false, key: null } : prev));
      return;
    }
    const selectedKey = selectedKeys[0];
    if (!displayItems.some((item) => item.key === selectedKey)) {
      setSelectionIndicator((prev) => (prev.visible ? { ...prev, visible: false, key: null } : prev));
      return;
    }
    const listBodyNode = listBodyRef.current;
    const rowNode = rowNodeMapRef.current.get(selectedKey);
    if (!listBodyNode || !rowNode) return;
    // The indicator sits inside the scrollable content layer, so it needs
    // content offsets instead of viewport-relative rects.
    const nextTop = Math.max(0, Math.round(rowNode.offsetTop + 2));
    const nextHeight = Math.max(0, Math.round(rowNode.offsetHeight - 4));
    setSelectionIndicator((prev) => {
      if (
        prev.visible
        && prev.key === selectedKey
        && Math.abs(prev.top - nextTop) < 0.5
        && Math.abs(prev.height - nextHeight) < 0.5
      ) {
        return prev;
      }
      return {
        visible: true,
        top: nextTop,
        height: nextHeight,
        key: selectedKey,
      };
    });
  }, [active, displayItems, detailGridTemplateColumns, selectedKeys]);

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
    if (!active) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onClose]);

  if (!active) return null;

  return (
    <div
      ref={shellRef}
      className={`space-resource-import-shell ${dragging ? 'is-dragging' : ''} ${embedded ? 'is-embedded' : ''} ${isCompactLayout ? 'is-compact' : ''} ${isNarrowLayout ? 'is-narrow' : ''}`}
      style={shellStyle}
    >
      <div className="space-resource-import-main">
        {showSidebar ? (
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
              <button
                type="button"
                className={`space-resource-import-sidebar-item ${specialView === 'all' && !selectedFolderKey && !activeTagFilter ? 'is-active' : ''}`}
                onClick={() => applyNavigationState(ROOT_STATE)}
              >
                <span className="space-resource-import-sidebar-icon" style={{ color: '#007aff' }}><DesktopOutlined /></span>
                <span className="space-resource-import-sidebar-text">全部资料</span>
              </button>
              <button
                type="button"
                className={`space-resource-import-sidebar-item ${specialView === 'recent' ? 'is-active' : ''}`}
                onClick={() => applyNavigationState({ selectedFolderKey: null, specialView: 'recent', activeTagFilter: null })}
              >
                <span className="space-resource-import-sidebar-icon" style={{ color: '#8e8e93' }}><ClockCircleOutlined /></span>
                <span className="space-resource-import-sidebar-text">最近使用</span>
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
        ) : null}

        <section className="space-resource-import-content">
          <div
            className={`space-resource-import-toolbar ${dragging ? 'is-dragging' : ''} ${onToolbarMouseDown ? '' : 'is-static'} ${relaxedToolbarLayout ? 'is-relaxed' : ''}`}
            onMouseDown={onToolbarMouseDown}
          >
            {relaxedToolbarLayout ? (
              <>
                <div className="space-resource-import-toolbar-row space-resource-import-toolbar-row-primary">
                  {showScopeSwitcherInToolbar ? (
                    <div className="space-resource-import-toolbar-scope">
                      <div className="space-resource-import-scope-switcher is-toolbar">
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
                        <div className="space-resource-import-toolbar-org-field">
                          <Select
                            size="small"
                            value={organizationId}
                            onChange={handleOrganizationChange}
                            options={organizations.map((item) => ({ label: item.name, value: item.id }))}
                            className="space-resource-import-org-select space-resource-import-org-select-toolbar"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {showCloseButton ? (
                    <button
                      type="button"
                      className="space-resource-import-close-btn"
                      onClick={onClose}
                      aria-label={closeButtonLabel}
                      title={closeButtonLabel}
                    >
                      {closeButtonIcon}
                    </button>
                  ) : null}
                </div>
                <div className="space-resource-import-toolbar-row space-resource-import-toolbar-row-secondary">
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
                  <div className="space-resource-import-toolbar-search is-fluid">
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
                </div>
              </>
            ) : (
              <>
                {showScopeSwitcherInToolbar ? (
                  <div className="space-resource-import-toolbar-scope">
                    <div className="space-resource-import-scope-switcher is-toolbar">
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
                      <div className="space-resource-import-toolbar-org-field">
                        <Select
                          size="small"
                          value={organizationId}
                          onChange={handleOrganizationChange}
                          options={organizations.map((item) => ({ label: item.name, value: item.id }))}
                          className="space-resource-import-org-select space-resource-import-org-select-toolbar"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
                {showToolbarTitle ? (
                  <div className="space-resource-import-toolbar-title">{currentTitle}</div>
                ) : null}
                <div
                  className={`space-resource-import-toolbar-search ${showToolbarTitle ? '' : 'is-fluid'}`}
                  style={showToolbarTitle && toolbarSearchWidth ? { width: `${toolbarSearchWidth}px` } : undefined}
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
                {showCloseButton ? (
                  <button
                    type="button"
                    className="space-resource-import-close-btn"
                    onClick={onClose}
                    aria-label={closeButtonLabel}
                    title={closeButtonLabel}
                  >
                    {closeButtonIcon}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="space-resource-import-table">
            {allowColumnVisibilityMenu ? (
              <Dropdown
                menu={columnVisibilityMenu}
                trigger={['contextMenu']}
                overlayClassName="space-resource-import-col-menu"
              >
                <div className="space-resource-import-list-header" style={{ gridTemplateColumns: detailGridTemplateColumns }}>
                  <span
                    className={`space-resource-import-header-cell space-resource-import-col-name space-resource-import-col-sortable ${sortBy === 'name' ? 'is-active' : ''}`}
                    onClick={() => handleHeaderSort('name')}
                  >
                    <span className="space-resource-import-col-label">
                      名称
                      {sortBy === 'name' ? (
                        <span className="space-resource-import-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      ) : null}
                    </span>
                    <span
                      className="space-resource-import-col-resize-handle"
                      onMouseDown={(event) => handleDetailColResizeStart('name', event)}
                    />
                  </span>
                  {visibleDetailColumns.map((column) => (
                    <span
                      key={column.key}
                      className={`space-resource-import-header-cell space-resource-import-col-${column.className} ${column.sortable ? 'space-resource-import-col-sortable' : ''} ${sortBy === column.key ? 'is-active' : ''}`}
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
              </Dropdown>
            ) : (
              <div className="space-resource-import-list-header" style={{ gridTemplateColumns: detailGridTemplateColumns }}>
                    <span
                      className={`space-resource-import-header-cell space-resource-import-col-name space-resource-import-col-sortable ${sortBy === 'name' ? 'is-active' : ''}`}
                      onClick={() => handleHeaderSort('name')}
                    >
                      <span className="space-resource-import-col-label">
                        名称
                        {sortBy === 'name' ? (
                          <span className="space-resource-import-col-arrow">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        ) : null}
                      </span>
                      <span
                        className="space-resource-import-col-resize-handle"
                        onMouseDown={(event) => handleDetailColResizeStart('name', event)}
                      />
                    </span>
                    {visibleDetailColumns.map((column) => (
                      <span
                        key={column.key}
                        className={`space-resource-import-header-cell space-resource-import-col-${column.className} ${column.sortable ? 'space-resource-import-col-sortable' : ''} ${sortBy === column.key ? 'is-active' : ''}`}
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
            )}

            <div
              ref={listBodyRef}
              className={`space-resource-import-list-body ${selectionIndicator.visible && selectedKeys.length === 1 ? 'has-single-selection' : ''}`}
            >
              <div
                className={`space-resource-import-selection-indicator ${selectionIndicator.visible ? 'is-visible' : ''}`}
                style={{
                  transform: `translateY(${selectionIndicator.top}px)`,
                  height: `${selectionIndicator.height}px`,
                }}
                aria-hidden="true"
              />
              {displayItems.length ? displayItems.map((item, index) => {
                const isSelected = selectedKeys.includes(item.key);
                const isExpanded = expandedFolderKeys.has(item.key);
                const isRowDraggable = Boolean(itemDragConfig && !item.isFolder);
                return (
                  <div
                    key={item.key}
                    ref={(node) => {
                      if (node) rowNodeMapRef.current.set(item.key, node);
                      else rowNodeMapRef.current.delete(item.key);
                    }}
                    className={`space-resource-import-row ${isSelected ? 'is-selected' : ''} ${isRowDraggable ? 'is-draggable' : ''}`}
                    style={{ gridTemplateColumns: detailGridTemplateColumns }}
                    onClick={(event) => handleSelectRow(item, index, event)}
                    onDoubleClick={() => {
                      if (item.isFolder) {
                        handleOpenFolder(item.key);
                        return;
                      }
                      itemDragConfig?.onItemDoubleClick?.(item, {
                        libraryId,
                        libraryName,
                        libraryScope: scope,
                        path: getLibraryItemPath(data, libraryId, item),
                      });
                    }}
                    draggable={isRowDraggable}
                    onDragStart={isRowDraggable ? (event) => {
                      const payload = itemDragConfig.serialize?.(item, {
                        libraryId,
                        libraryName,
                        libraryScope: scope,
                        path: getLibraryItemPath(data, libraryId, item),
                      }) ?? item;
                      event.dataTransfer.setData(itemDragConfig.type, JSON.stringify(payload));
                      event.dataTransfer.effectAllowed = itemDragConfig.effectAllowed || 'copy';
                    } : undefined}
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
                            <span className={`space-resource-import-row-icon ${item.isFolder ? 'is-folder' : 'is-file'}`}>
                              {renderFileIcon(getSelectableFileType(item), { fontSize: 18 })}
                            </span>
                            <span className="space-resource-import-row-name">{item.name}</span>
                          </span>
                        </span>
                        {visibleDetailColumns.map((column) => {
                          if (column.key === 'date') {
                            return <span key={column.key} className="space-resource-import-col-modified">{formatDate(item.lastEdit)}</span>;
                          }
                          if (column.key === 'size') {
                            return <span key={column.key} className="space-resource-import-col-size">{formatSize(item.size)}</span>;
                          }
                          if (column.key === 'kind') {
                            return <span key={column.key} className="space-resource-import-col-kind">{formatKind(item)}</span>;
                          }
                          if (column.key === 'addedAt') {
                            return <span key={column.key} className="space-resource-import-col-added">{formatDate(item.addedAt || item.lastEdit)}</span>;
                          }
                          return null;
                        })}
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

      {showFooter ? (
        <div className="space-resource-import-footer">
          {footerHint ? (
            <div className="space-resource-import-footer-hint-badge">{footerHint}</div>
          ) : null}
          {showFooterPath || showIncludeDirectories ? (
            <div className="space-resource-import-footer-left">
              {showFooterPath ? (
                <div className="space-resource-import-footer-path" title={currentPathLabel}>
                  <span className="space-resource-import-footer-path-label">路径</span>
                  <span className="space-resource-import-footer-path-value">{currentPathLabel}</span>
                </div>
              ) : null}
              {showIncludeDirectories ? (
                <Checkbox checked={includeDirectories} onChange={(event) => setIncludeDirectories(event.target.checked)}>
                  包括目录
                </Checkbox>
              ) : null}
            </div>
          ) : null}
          {showFooterSummary ? (
            <div className="space-resource-import-footer-summary">
              <span>已选 {selectedItems.length} 项</span>
              <span>{selectedFolderCount} 个文件夹</span>
              <span>{selectedFileCount} 个文件</span>
            </div>
          ) : showFooterActions ? <div className="space-resource-import-footer-summary is-empty" /> : null}
          {showFooterActions ? (
            <div className="space-resource-import-footer-actions">
              <Button onClick={onClose}>取消</Button>
                <Button
                  type="primary"
                  disabled={selectedItems.length === 0}
                  onClick={() => onConfirm?.({ selectedItems: contextualSelectedItems, includeDirectories, libraryId })}
                >
                  导入
                </Button>
            </div>
          ) : null}
          {onResizeMouseDown ? (
            <button
              type="button"
              className="space-resource-import-resize-handle"
              onMouseDown={onResizeMouseDown}
              aria-label="调整窗口大小"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function SpaceResourceImportModal({
  open,
  onClose,
  onConfirm,
  excludeFileTypes = ['knowledgeGraph', 'capabilityModel'],
}) {
  const [modalFrame, setModalFrame] = useState(() => getInitialModalFrame());
  const [dragInteractionType, setDragInteractionType] = useState(null);
  const modalFrameRef = useRef(modalFrame);
  const pointerStateRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setModalFrame(getInitialModalFrame());
    setDragInteractionType(null);
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
      'button, input, .ant-input-affix-wrapper, .ant-input, .ant-select, .ant-checkbox-wrapper, .space-resource-import-close-btn, .space-resource-import-field-btn',
    );
    if (interactiveTarget) return;
    startPointerInteraction(event, 'drag');
  };

  const handleResizeMouseDown = (event) => {
    event.stopPropagation();
    startPointerInteraction(event, 'resize');
  };

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
        <SpaceResourceImportBrowser
          active={open}
          onClose={onClose}
          onConfirm={onConfirm}
          excludeFileTypes={excludeFileTypes}
          frameWidth={modalFrame.width}
          shellStyle={{ height: `${modalFrame.height}px` }}
          dragging={dragInteractionType === 'drag'}
          onToolbarMouseDown={handleToolbarMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
        />
      </div>
    </div>,
    document.body,
  );
}
