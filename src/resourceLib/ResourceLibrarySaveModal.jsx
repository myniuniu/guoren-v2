import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input, Select } from 'antd';
import {
  CaretDownOutlined,
  CaretRightOutlined,
  CloseOutlined,
  DesktopOutlined,
  FolderFilled,
  SearchOutlined,
} from '@ant-design/icons';
import {
  addItemToLibraryId,
  getLibraryItemPath,
  getLibraryItemsById,
  getLibraryNameById,
  getOrganizations,
  getTagDefinitions,
  inferFileType,
  loadResourceLib,
  renameItemByLibraryId,
} from './resourceLibStore';
import './ResourceLibrarySaveModal.css';

const VIEWPORT_MARGIN = 24;
const DEFAULT_MODAL_FRAME = Object.freeze({
  width: 1080,
  height: 720,
});
const MIN_MODAL_FRAME = Object.freeze({
  width: 860,
  height: 560,
});

function formatNow() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function parseDateValue(value) {
  if (!value) return 0;
  const ts = Date.parse(String(value).replace(/\./g, '-').replace(/\//g, '-'));
  return Number.isNaN(ts) ? 0 : ts;
}

function buildLuckySnapshot(item, draftName, libraryName, folderPath) {
  const normalizedName = draftName.trim();
  const inferred = inferFileType(normalizedName);
  const fileType = inferred === 'other' ? 'note' : inferred;
  const pathSuffix = folderPath ? `${folderPath} / ${normalizedName}` : normalizedName;

  return {
    name: normalizedName,
    fileType,
    contentText: [
      `Lucky 条目：${item.title}`,
      `来源：${item.source}`,
      `范围：${item.scope}`,
      `时间：${item.time}`,
      '',
      '该资料由 Lucky 模块另存为资料库快照生成。',
    ].join('\n'),
    summary: `${item.title} 已从 Lucky 另存到 ${libraryName}。`,
    comment: '由 Lucky 模块另存',
    sourceType: 'LUCKY',
    sourceMeta: {
      origin: 'LUCKY',
      luckyItemId: item.id,
      luckyTitle: item.title,
      luckySource: item.source,
      luckyScope: item.scope,
      savedAt: formatNow(),
      libraryName,
      folderPath: pathSuffix,
    },
  };
}

function clamp(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
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

  if (typeof window === 'undefined') return { ...frame, width, height };

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

export default function ResourceLibrarySaveModal({
  open,
  item,
  onClose,
  onSaved,
}) {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('personal');
  const [organizationId, setOrganizationId] = useState(() => loadResourceLib().currentOrgId || 'org_default');
  const [keyword, setKeyword] = useState('');
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [expandedFolderKeys, setExpandedFolderKeys] = useState(new Set());
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [editingFolderKey, setEditingFolderKey] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [modalFrame, setModalFrame] = useState(() => getInitialModalFrame());
  const [dragging, setDragging] = useState(false);
  const modalFrameRef = useRef(modalFrame);
  const pointerStateRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const nextData = loadResourceLib();
    const organizations = getOrganizations(nextData);
    setData(nextData);
    setScope('personal');
    setOrganizationId(nextData.currentOrgId || organizations[0]?.id || 'org_default');
    setKeyword('');
    setSelectedFolderKey(null);
    setExpandedFolderKeys(new Set());
    setActiveTagFilter(null);
    setDraftName(item?.title || '');
    setEditingFolderKey(null);
    setEditingFolderName('');
    setModalFrame(getInitialModalFrame());
    setDragging(false);
  }, [item, open]);

  useEffect(() => {
    modalFrameRef.current = modalFrame;
  }, [modalFrame]);

  useEffect(() => {
    if (!editingFolderKey || !renameInputRef.current) return;
    renameInputRef.current.focus();
    renameInputRef.current.select();
  }, [editingFolderKey]);

  useEffect(() => {
    if (!open) return undefined;
    const handleWindowResize = () => {
      setModalFrame((prev) => clampFrame(prev));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => () => {
    const pointerState = pointerStateRef.current;
    if (!pointerState) return;
    window.removeEventListener('mousemove', pointerState.onMove);
    window.removeEventListener('mouseup', pointerState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const organizations = useMemo(() => getOrganizations(data), [data]);
  const libraryId = scope === 'personal' ? 'personal' : organizationId;
  const libraryName = getLibraryNameById(data, libraryId);
  const libraryItems = useMemo(() => getLibraryItemsById(data, libraryId), [data, libraryId]);
  const folderItems = useMemo(
    () => libraryItems.filter((entry) => entry.isFolder),
    [libraryItems],
  );
  const tagDefs = useMemo(() => getTagDefinitions(data, scope), [data, scope]);
  const tagDefMap = useMemo(() => new Map(tagDefs.map((entry) => [entry.id, entry])), [tagDefs]);

  const sidebarTags = useMemo(() => {
    const usedTagIds = new Set();
    libraryItems.forEach((entry) => {
      (entry.tags || []).forEach((tagId) => {
        if (tagDefMap.has(tagId)) usedTagIds.add(tagId);
      });
    });
    return tagDefs.filter((entry) => usedTagIds.has(entry.id));
  }, [libraryItems, tagDefMap, tagDefs]);

  const folderMap = useMemo(
    () => new Map(folderItems.map((entry) => [entry.key, entry])),
    [folderItems],
  );
  const activeSelectedFolderKey = selectedFolderKey && folderMap.has(selectedFolderKey)
    ? selectedFolderKey
    : null;

  const childFolderMap = useMemo(() => {
    const nextMap = new Map();
    folderItems.forEach((entry) => {
      const parentKey = entry.parentKey ?? null;
      if (!nextMap.has(parentKey)) nextMap.set(parentKey, []);
      nextMap.get(parentKey).push(entry);
    });
    nextMap.forEach((entries, key) => {
      entries.sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN'));
      nextMap.set(key, entries);
    });
    return nextMap;
  }, [folderItems]);

  const visibleRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    let sourceFolders = folderItems;
    if (activeTagFilter) {
      sourceFolders = sourceFolders.filter((entry) => (entry.tags || []).includes(activeTagFilter));
    }

    if (normalizedKeyword || activeTagFilter) {
      return sourceFolders.filter((entry) => (
        `${entry.name} ${getLibraryItemPath(data, libraryId, entry)}`.toLowerCase().includes(normalizedKeyword)
      )).map((entry) => ({
        ...entry,
        _depth: 0,
        path: getLibraryItemPath(data, libraryId, entry),
      }));
    }

    const rows = [];
    const visit = (parentKey, depth) => {
      const children = (childFolderMap.get(parentKey ?? null) || []).filter((entry) => !activeTagFilter || (entry.tags || []).includes(activeTagFilter));
      children.forEach((entry) => {
        rows.push({
          ...entry,
          _depth: depth,
          path: getLibraryItemPath(data, libraryId, entry),
        });
        if (expandedFolderKeys.has(entry.key)) {
          visit(entry.key, depth + 1);
        }
      });
    };
    visit(null, 0);
    return rows;
  }, [activeTagFilter, childFolderMap, data, expandedFolderKeys, folderItems, keyword, libraryId]);

  const selectedFolderTrail = useMemo(() => {
    if (!activeSelectedFolderKey) return [];
    const trail = [];
    const visited = new Set();
    let cursor = folderMap.get(activeSelectedFolderKey) || null;
    while (cursor && !visited.has(cursor.key)) {
      trail.push(cursor);
      visited.add(cursor.key);
      cursor = cursor.parentKey ? folderMap.get(cursor.parentKey) || null : null;
    }
    return trail.reverse();
  }, [activeSelectedFolderKey, folderMap]);

  const canSubmit = draftName.trim().length > 0;

  const createFolderName = () => {
    const siblings = folderItems.filter((entry) => (entry.parentKey ?? null) === (activeSelectedFolderKey ?? null));
    const siblingNames = new Set(siblings.map((entry) => entry.name));
    if (!siblingNames.has('新建文件夹')) return '新建文件夹';
    let index = 2;
    while (siblingNames.has(`新建文件夹 ${index}`)) index += 1;
    return `新建文件夹 ${index}`;
  };

  const stopPointerInteraction = () => {
    const pointerState = pointerStateRef.current;
    if (!pointerState) return;
    window.removeEventListener('mousemove', pointerState.onMove);
    window.removeEventListener('mouseup', pointerState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    pointerStateRef.current = null;
    setDragging(false);
  };

  const handleToolbarMouseDown = (event) => {
    const interactiveTarget = event.target.closest(
      'button, input, .ant-input-affix-wrapper, .ant-input, .ant-select, .resource-library-save-close-btn',
    );
    if (interactiveTarget || event.button !== 0) return;
    event.preventDefault();
    stopPointerInteraction();

    const originFrame = modalFrameRef.current;
    const onMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - event.clientX;
      const deltaY = moveEvent.clientY - event.clientY;
      setModalFrame(clampFrame({
        ...originFrame,
        left: originFrame.left + deltaX,
        top: originFrame.top + deltaY,
      }));
    };
    const onUp = () => stopPointerInteraction();

    pointerStateRef.current = { onMove, onUp };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    setDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const expandFolderAncestors = (folderKey) => {
    if (!folderKey) return;
    const ancestorKeys = [];
    const visited = new Set();
    let cursor = folderMap.get(folderKey) || null;
    while (cursor?.parentKey && !visited.has(cursor.parentKey)) {
      ancestorKeys.push(cursor.parentKey);
      visited.add(cursor.parentKey);
      cursor = folderMap.get(cursor.parentKey) || null;
    }
    if (!ancestorKeys.length) return;
    setExpandedFolderKeys((prev) => {
      const next = new Set(prev);
      ancestorKeys.forEach((key) => next.add(key));
      return next;
    });
  };

  const handleSelectFolder = (folderKey) => {
    const nextKey = activeSelectedFolderKey === folderKey ? null : folderKey;
    setSelectedFolderKey(nextKey);
    if (nextKey) expandFolderAncestors(nextKey);
  };

  const handleSwitchPath = (folderKey) => {
    setSelectedFolderKey(folderKey);
    if (folderKey) expandFolderAncestors(folderKey);
  };

  const handleSave = () => {
    if (!item || !canSubmit) return;

    const folderPath = activeSelectedFolderKey
      ? getLibraryItemPath(data, libraryId, activeSelectedFolderKey).replace(`${libraryName} / `, '')
      : '';
    const snapshot = buildLuckySnapshot(item, draftName, libraryName, folderPath);
    const nextData = addItemToLibraryId(loadResourceLib(), libraryId, {
      ...snapshot,
      parentKey: activeSelectedFolderKey,
    });
    setData(nextData);
    onSaved?.({
      libraryId,
      libraryName,
      folderKey: activeSelectedFolderKey,
      name: draftName.trim(),
    });
    onClose?.();
  };

  const commitFolderRename = (folderKey, fallbackName = '') => {
    if (!folderKey) return;
    const normalizedName = editingFolderName.trim() || fallbackName;
    setEditingFolderKey(null);
    setEditingFolderName('');
    if (!normalizedName || normalizedName === fallbackName) return;
    const nextData = renameItemByLibraryId(loadResourceLib(), libraryId, folderKey, normalizedName);
    setData(nextData);
  };

  const handleCreateFolder = () => {
    const nextFolderName = createFolderName();
    const nextData = addItemToLibraryId(loadResourceLib(), libraryId, {
      name: nextFolderName,
      isFolder: true,
      fileType: 'folder',
      parentKey: activeSelectedFolderKey,
      tags: activeTagFilter ? [activeTagFilter] : [],
    });
    const nextFolder = [...getLibraryItemsById(nextData, libraryId)]
      .filter((entry) => entry.isFolder && (entry.parentKey ?? null) === (activeSelectedFolderKey ?? null))
      .sort((left, right) => parseDateValue(right.lastEdit) - parseDateValue(left.lastEdit))[0];
    setData(nextData);
    if (nextFolder?.key) {
      setSelectedFolderKey(nextFolder.key);
      if (nextFolder.parentKey) {
        setExpandedFolderKeys((prev) => new Set(prev).add(nextFolder.parentKey));
      }
      setEditingFolderKey(nextFolder.key);
      setEditingFolderName(nextFolder.name || nextFolderName);
    }
  };

  if (!open || !item || typeof document === 'undefined') return null;

  return createPortal(
    <div className="resource-library-save-layer">
      <div
        className="resource-library-save-frame"
        style={{
          width: `${modalFrame.width}px`,
          height: `${modalFrame.height}px`,
          left: `${modalFrame.left}px`,
          top: `${modalFrame.top}px`,
        }}
      >
        <div className={`resource-library-save-shell ${dragging ? 'is-dragging' : ''}`}>
          <div className="resource-library-save-main">
            <aside className="resource-library-save-sidebar">
              <div className="resource-library-save-scope-switcher">
                <button
                  type="button"
                  className={`resource-library-save-scope-btn ${scope === 'personal' ? 'is-active' : ''}`}
                  onClick={() => setScope('personal')}
                >
                  个人库
                </button>
                <button
                  type="button"
                  className={`resource-library-save-scope-btn ${scope === 'organization' ? 'is-active' : ''}`}
                  onClick={() => setScope('organization')}
                >
                  组织库
                </button>
              </div>

              {scope === 'organization' ? (
                <Select
                  size="small"
                  value={organizationId}
                  onChange={setOrganizationId}
                  options={organizations.map((entry) => ({ label: entry.name, value: entry.id }))}
                  className="resource-library-save-org-select"
                />
              ) : null}

              <div className="resource-library-save-sidebar-section">
                <div className="resource-library-save-sidebar-title">目录</div>
                <button
                  type="button"
                  className={`resource-library-save-sidebar-item ${activeTagFilter === null ? 'is-active' : ''}`}
                  onClick={() => setActiveTagFilter(null)}
                >
                  <span className="resource-library-save-sidebar-icon"><DesktopOutlined /></span>
                  <span className="resource-library-save-sidebar-text">全部目录</span>
                </button>
              </div>

              <div className="resource-library-save-sidebar-section">
                <div className="resource-library-save-sidebar-title">标签</div>
                {sidebarTags.length ? sidebarTags.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className={`resource-library-save-sidebar-item ${activeTagFilter === entry.id ? 'is-active' : ''}`}
                    onClick={() => setActiveTagFilter(entry.id)}
                  >
                    <span className="resource-library-save-tag-dot" style={{ background: entry.color }} />
                    <span className="resource-library-save-sidebar-text">{entry.name}</span>
                  </button>
                )) : (
                  <div className="resource-library-save-sidebar-empty">当前资料库暂无标签</div>
                )}
              </div>
            </aside>

            <section className="resource-library-save-content">
              <div className={`resource-library-save-toolbar ${dragging ? 'is-dragging' : ''}`} onMouseDown={handleToolbarMouseDown}>
                <div className="resource-library-save-toolbar-title">另存为资料库</div>
                <div className="resource-library-save-toolbar-search">
                  <Input
                    allowClear
                    size="small"
                    prefix={<SearchOutlined style={{ fontSize: 12, color: '#8d8d92' }} />}
                    placeholder="搜索目录"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="resource-library-save-close-btn"
                  onClick={onClose}
                  aria-label="关闭"
                >
                  <CloseOutlined />
                </button>
              </div>

              <div className="resource-library-save-meta">
                <div className="resource-library-save-meta-row">
                  <label htmlFor="resource-library-save-name">名称:</label>
                  <Input
                    id="resource-library-save-name"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="输入保存名称"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="resource-library-save-list-header">
                <span className="col-name">目录</span>
                <span className="col-time">修改日期</span>
              </div>

              <div className="resource-library-save-list">
                {visibleRows.map((entry) => {
                  const childCount = (childFolderMap.get(entry.key) || []).length;
                  const isExpanded = expandedFolderKeys.has(entry.key);
                  const isSelected = activeSelectedFolderKey === entry.key;
                  const isEditing = editingFolderKey === entry.key;
                  return (
                    <div
                      key={entry.key}
                      className={`resource-library-save-row ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectFolder(entry.key)}
                      onDoubleClick={() => {
                        if (childCount === 0) return;
                        setExpandedFolderKeys((prev) => {
                          const next = new Set(prev);
                          if (next.has(entry.key)) next.delete(entry.key);
                          else next.add(entry.key);
                          return next;
                        });
                      }}
                    >
                      <span className="resource-library-save-col col-name">
                        <span
                          className="resource-library-save-name-wrap"
                          style={{ paddingLeft: `${entry._depth * 18}px` }}
                        >
                          <button
                            type="button"
                            className={`resource-library-save-expander ${childCount > 0 ? 'is-folder' : 'is-empty'}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (childCount === 0) return;
                              setExpandedFolderKeys((prev) => {
                                const next = new Set(prev);
                                if (next.has(entry.key)) next.delete(entry.key);
                                else next.add(entry.key);
                                return next;
                              });
                            }}
                            aria-label={childCount > 0 ? (isExpanded ? '收起目录' : '展开目录') : '目录'}
                          >
                            {childCount > 0 ? (isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />) : null}
                          </button>
                          <span className="resource-library-save-folder-icon"><FolderFilled /></span>
                          {isEditing ? (
                            <input
                              ref={renameInputRef}
                              type="text"
                              className="resource-library-save-folder-rename-input"
                              value={editingFolderName}
                              onChange={(event) => setEditingFolderName(event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                              onDoubleClick={(event) => event.stopPropagation()}
                              onBlur={() => commitFolderRename(entry.key, entry.name)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  commitFolderRename(entry.key, entry.name);
                                } else if (event.key === 'Escape') {
                                  event.preventDefault();
                                  setEditingFolderKey(null);
                                  setEditingFolderName('');
                                }
                              }}
                            />
                          ) : (
                            <span className="resource-library-save-folder-name">{entry.name}</span>
                          )}
                        </span>
                      </span>
                      <span className="resource-library-save-col col-time">{entry.lastEdit || '--'}</span>
                    </div>
                  );
                })}
              </div>

            </section>
          </div>

          <div className="resource-library-save-footer">
            <div className="resource-library-save-name-field">
              <Button onClick={handleCreateFolder}>新建文件夹</Button>
            </div>
            <div className="resource-library-save-pathbar">
              <button
                type="button"
                className={`resource-library-save-pathbar-segment ${selectedFolderTrail.length === 0 ? 'is-current' : ''}`}
                onClick={() => handleSwitchPath(null)}
              >
                <span className="resource-library-save-pathbar-icon"><DesktopOutlined /></span>
                <span>{libraryName}</span>
              </button>
              {selectedFolderTrail.map((entry, index) => {
                const isCurrent = index === selectedFolderTrail.length - 1;
                return (
                  <span key={entry.key} className="resource-library-save-pathbar-item">
                    <span className="resource-library-save-pathbar-sep">›</span>
                    <button
                      type="button"
                      className={`resource-library-save-pathbar-segment ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => handleSwitchPath(entry.key)}
                      disabled={isCurrent}
                    >
                      <span className="resource-library-save-pathbar-icon"><FolderFilled /></span>
                      <span>{entry.name}</span>
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="resource-library-save-actions">
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" disabled={!canSubmit} onClick={handleSave}>存储</Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
