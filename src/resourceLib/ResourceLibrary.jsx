import { useMemo, useRef, useState } from 'react';
import {
  Button, Input, Empty, Tooltip, Dropdown, Popover,
  Modal, Form, Select, message, Upload, ColorPicker,
} from 'antd';
import {
  PlusOutlined, SearchOutlined,
  LeftOutlined, RightOutlined,
  UnorderedListOutlined, ProfileOutlined,
  FolderAddOutlined, FileAddOutlined,
  EditOutlined, DeleteOutlined,
  FolderFilled, DesktopOutlined,
  DownloadOutlined, ClockCircleOutlined,
  CloudOutlined, ShareAltOutlined, GlobalOutlined,
  ExportOutlined, HighlightOutlined, SmileOutlined,
  CaretDownOutlined,
  FileTextOutlined, FilePdfOutlined, FileImageOutlined,
  PlayCircleOutlined, SoundOutlined, TagsOutlined,
  FileExcelOutlined, FileWordOutlined, FilePptOutlined,
} from '@ant-design/icons';
import {
  loadResourceLib, addItem, renameItem, deleteItem, setSelectedFolder, inferFileType,
  getTagDefinitions, addTagDefinition,
  addTagToItem, removeTagFromItem,
} from './resourceLibStore';
import { renderFileIcon } from './resourceIcons.jsx';
import { fileApi } from '../api/fileApi';
import './ResourceLibrary.css';

export default function ResourceLibrary() {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('personal');
  const [keyword, setKeyword] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState('file');
  const [addForm] = Form.useForm();
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#FF3B30');
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [navHistory, setNavHistory] = useState([null]); // 导航历史
  const [navIndex, setNavIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // list | detail | column
  const [sortBy, setSortBy] = useState('name'); // name | kind | date | size | tag
  const [newFolderInline, setNewFolderInline] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef(null);
  const columnScrollRef = useRef(null);
  // 分栏视图状态：各层打开的文件夹 key 路径
  const [columnPath, setColumnPath] = useState([null]); // [null, folderKey1, folderKey2, ...]
  const [columnSelectedItem, setColumnSelectedItem] = useState(null); // 分栏视图中选中的文件

  const list = data[scope] || [];
  const selectedFolderKey = data.selectedFolderKey?.[scope] ?? null;
  const tagDefs = getTagDefinitions(data);

  // 当前文件夹信息
  const currentFolder = useMemo(
    () => (selectedFolderKey ? list.find((r) => r.key === selectedFolderKey) : null),
    [list, selectedFolderKey],
  );

  // 当前文件夹下的子项
  const currentChildren = useMemo(() => {
    let items;
    if (activeTagFilter) {
      items = list.filter((r) => (r.tags || []).includes(activeTagFilter));
    } else {
      items = list.filter((r) => r.parentKey === selectedFolderKey);
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        items = items.filter((r) => r.name?.toLowerCase().includes(kw));
      }
    }
    // 排序
    return [...items].sort((a, b) => {
      // 文件夹永远排前面
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '', 'zh');
        case 'kind': return (a.fileType || '').localeCompare(b.fileType || '');
        case 'date': return (b.lastEdit || '').localeCompare(a.lastEdit || '');
        case 'size': return (b.size || 0) - (a.size || 0);
        case 'tag': return (b.tags || []).length - (a.tags || []).length;
        default: return 0;
      }
    });
  }, [list, selectedFolderKey, activeTagFilter, keyword, sortBy]);

  // 侧栏收藏夹项目（根文件夹）
  const rootFolders = useMemo(
    () => list.filter((r) => r.isFolder && r.parentKey === null),
    [list],
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

  // ====== 操作 ======
  const navigateTo = (folderKey) => {
    setData((d) => setSelectedFolder(d, scope, folderKey));
    setActiveTagFilter(null);
    setSelectedItemKey(null);
    // 更新导航历史
    const newHistory = navHistory.slice(0, navIndex + 1);
    newHistory.push(folderKey);
    setNavHistory(newHistory);
    setNavIndex(newHistory.length - 1);
  };

  const handleBack = () => {
    if (navIndex > 0) {
      const newIndex = navIndex - 1;
      setNavIndex(newIndex);
      setData((d) => setSelectedFolder(d, scope, navHistory[newIndex]));
      setActiveTagFilter(null);
    }
  };

  const handleForward = () => {
    if (navIndex < navHistory.length - 1) {
      const newIndex = navIndex + 1;
      setNavIndex(newIndex);
      setData((d) => setSelectedFolder(d, scope, navHistory[newIndex]));
    }
  };

  const handleDelete = (key) => {
    setData((d) => deleteItem(d, scope, key));
    if (selectedFolderKey === key) navigateTo(null);
    message.success('已删除');
  };

  const handleRename = (item) => {
    let newName = item.name;
    Modal.confirm({
      title: '重命名',
      icon: null,
      content: <Input defaultValue={item.name} onChange={(e) => { newName = e.target.value; }} placeholder="请输入新名称" />,
      onOk: () => {
        const trimmed = (newName || '').trim();
        if (!trimmed) { message.warning('名称不能为空'); return Promise.reject(); }
        setData((d) => renameItem(d, scope, item.key, trimmed));
        message.success('已重命名');
      },
    });
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
    setActiveTagFilter(activeTagFilter === tagId ? null : tagId);
    setSelectedItemKey(null);
  };

  const handleDoubleClick = (item) => {
    if (item.isFolder) navigateTo(item.key);
  };

  // ====== 分栏视图 - 点击文件夹时扩展列 ======
  const handleColumnFolderClick = (folderKey, colIndex) => {
    // 检查该文件夹是否有内容，没有内容则不扩展新列
    const children = list.filter((r) => r.parentKey === folderKey);
    const newPath = columnPath.slice(0, colIndex + 1);
    if (children.length > 0) {
      newPath.push(folderKey);
    }
    setColumnPath(newPath);
    setColumnSelectedItem(null);
    // 自动滚动到最右
    setTimeout(() => {
      columnScrollRef.current?.scrollTo({ left: columnScrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 50);
  };

  const handleColumnFileClick = (item, colIndex) => {
    // 截断后续列，选中该文件
    setColumnPath(columnPath.slice(0, colIndex + 1));
    setColumnSelectedItem(item);
    setSelectedItemKey(item.key);
  };

  // 分栏视图各列的子项
  const columnLevels = useMemo(() => {
    return columnPath.map((parentKey) => {
      let items = list.filter((r) => r.parentKey === parentKey);
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        items = items.filter((r) => r.name?.toLowerCase().includes(kw));
      }
      return [...items].sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return (a.name || '').localeCompare(b.name || '', 'zh');
      });
    });
  }, [columnPath, list, keyword]);

  // 切换视图模式时同步 columnPath
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'column') {
      // 从当前 breadcrumb 构建 columnPath
      const path = [null, ...breadcrumb.map((b) => b.key)];
      setColumnPath(path);
      setColumnSelectedItem(null);
    }
  };

  // ====== 快速新建文件夹 (内联) ======
  const handleNewFolderInline = () => {
    setNewFolderInline(true);
    setNewFolderName('未命名文件夹');
    setTimeout(() => newFolderInputRef.current?.focus(), 50);
  };

  const confirmNewFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      setData((d) => addItem(d, scope, {
        name: trimmed, isFolder: true, parentKey: selectedFolderKey, fileType: 'folder', parseStatus: 'parsed',
      }));
      message.success(`文件夹「${trimmed}」已创建`);
    }
    setNewFolderInline(false);
    setNewFolderName('');
  };

  // ====== Quick Look 预览（右侧面板常驻） ======
  const previewItem = useMemo(() => {
    if (!selectedItemKey) return null;
    return list.find((r) => r.key === selectedItemKey) || null;
  }, [selectedItemKey, list]);

  // 选中文件夹的子项数量
  const previewFolderCount = useMemo(() => {
    if (!previewItem?.isFolder) return 0;
    return list.filter((r) => r.parentKey === previewItem.key).length;
  }, [previewItem, list]);

  const [bgMenuPos, setBgMenuPos] = useState(null); // {x, y} 右键菜单位置

  // 右键菜单 - 文件/文件夹
  const getContextMenu = (item) => ({
    items: [
      { key: 'rename', icon: <EditOutlined />, label: '重命名' },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'rename') handleRename(item);
      if (key === 'delete') handleDelete(item.key);
    },
  });

  // 右键菜单 - 空白区域
  const bgContextMenu = {
    items: [
      { key: 'newFolder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'newFile', icon: <FileAddOutlined />, label: '新建资料' },
    ],
    onClick: ({ key }) => {
      if (key === 'newFolder') handleNewFolderInline();
      if (key === 'newFile') openAdd('file');
      setBgMenuPos(null);
    },
  };

  const handleBgContextMenu = (e) => {
    // 只在点击空白处触发，不在文件行上触发
    if (e.target.closest('.finder-file-row') || e.target.closest('.finder-detail-header')) return;
    e.preventDefault();
    setBgMenuPos({ x: e.clientX, y: e.clientY });
  };

  const addMenu = {
    items: [
      { key: 'folder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'file', icon: <FileAddOutlined />, label: '新建资料' },
    ],
    onClick: ({ key }) => {
      if (key === 'folder') handleNewFolderInline();
      else openAdd(key);
    },
  };

  // ====== 排序/分组菜单 ======
  const sortMenu = {
    items: [
      { key: 'name', label: '名称' },
      { key: 'kind', label: '种类' },
      { key: 'date', label: '修改日期' },
      { key: 'size', label: '大小' },
      { key: 'tag', label: '标签' },
    ],
    selectedKeys: [sortBy],
    onClick: ({ key }) => setSortBy(key),
  };

  // ====== 标签选择 Popover 内容 ======
  const renderTagPicker = (itemKey) => (
    <div className="rl-tag-picker">
      <div className="rl-tag-picker-title">编辑标签</div>
      <div className="rl-tag-picker-list">
        {tagDefs.map((t) => {
          const item = list.find((r) => r.key === itemKey);
          const checked = (item?.tags || []).includes(t.id);
          return (
            <div key={t.id} className={`rl-tag-picker-row ${checked ? 'rl-tag-picker-row-checked' : ''}`}
              onClick={() => {
                if (checked) setData((d) => removeTagFromItem(d, scope, itemKey, t.id));
                else setData((d) => addTagToItem(d, scope, itemKey, t.id));
              }}>
              <span className="rl-tag-dot" style={{ background: t.color }} />
              <span className="rl-tag-picker-row-name">{t.name}</span>
              {checked && <span className="rl-tag-picker-row-check">✓</span>}
            </div>
          );
        })}
      </div>
      <div className="rl-tag-picker-actions">
        <Button size="small" icon={<PlusOutlined />} onClick={() => { setNewTagName(''); setNewTagColor('#FF3B30'); setAddTagOpen(true); }}>
          新建标签
        </Button>
      </div>
    </div>
  );

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
      <div className="finder-sidebar">
        {/* 个人收藏 */}
        <div className="finder-sidebar-section">
          <div className="finder-sidebar-title">{scope === 'personal' ? '个人收藏' : '组织空间'}</div>
          <div
            className={`finder-sidebar-item ${!selectedFolderKey && !activeTagFilter ? 'finder-sidebar-item-active' : ''}`}
            onClick={() => { navigateTo(null); }}
          >
            <span className="finder-sidebar-item-icon" style={{ color: '#007aff' }}><DesktopOutlined /></span>
            <span className="finder-sidebar-item-label">全部资料</span>
          </div>
          <div className="finder-sidebar-item" onClick={() => navigateTo(null)}>
            <span className="finder-sidebar-item-icon" style={{ color: '#8e8e93' }}><ClockCircleOutlined /></span>
            <span className="finder-sidebar-item-label">最近使用</span>
          </div>
          <div className="finder-sidebar-item" onClick={() => navigateTo(null)}>
            <span className="finder-sidebar-item-icon" style={{ color: '#34c759' }}><DownloadOutlined /></span>
            <span className="finder-sidebar-item-label">下载</span>
          </div>
          {rootFolders.map((f) => (
            <div
              key={f.key}
              className={`finder-sidebar-item ${selectedFolderKey === f.key && !activeTagFilter ? 'finder-sidebar-item-active' : ''}`}
              onClick={() => navigateTo(f.key)}
            >
              <span className="finder-sidebar-item-icon" style={{ color: '#4facfe' }}><FolderFilled /></span>
              <span className="finder-sidebar-item-label">{f.name}</span>
            </div>
          ))}
        </div>

        {/* iCloud / 切换 scope */}
        <div className="finder-sidebar-section">
          <div className="finder-sidebar-title">{scope === 'personal' ? 'iCloud' : '位置'}</div>
          <div
            className={`finder-sidebar-item ${scope === 'organization' && !selectedFolderKey ? '' : ''}`}
            onClick={() => { setScope(scope === 'personal' ? 'organization' : 'personal'); navigateTo(null); setNavHistory([null]); setNavIndex(0); }}
          >
            <span className="finder-sidebar-item-icon" style={{ color: '#007aff' }}><CloudOutlined /></span>
            <span className="finder-sidebar-item-label">{scope === 'personal' ? '组织资料库' : '个人资料库'}</span>
          </div>
          <div className="finder-sidebar-item">
            <span className="finder-sidebar-item-icon" style={{ color: '#8e8e93' }}><ShareAltOutlined /></span>
            <span className="finder-sidebar-item-label">共享</span>
          </div>
        </div>

        {/* 位置 */}
        <div className="finder-sidebar-section">
          <div className="finder-sidebar-title">位置</div>
          <div className="finder-sidebar-item">
            <span className="finder-sidebar-item-icon" style={{ color: '#8e8e93' }}><GlobalOutlined /></span>
            <span className="finder-sidebar-item-label">网络</span>
          </div>
        </div>

        {/* 标签 */}
        <div className="finder-sidebar-section">
          <div className="finder-sidebar-title">标签</div>
          {tagDefs.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className={`finder-tag-item ${activeTagFilter === t.id ? 'finder-tag-item-active' : ''}`}
              onClick={() => handleTagFilter(t.id)}
            >
              <span className="finder-tag-dot" style={{ background: t.color }} />
              <span className="finder-tag-label">{t.name}</span>
            </div>
          ))}
          <div className="finder-all-tags-link" onClick={() => { /* 跳转标签管理 */ }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #86868b', display: 'inline-block' }} />
            <span>所有标签...</span>
          </div>
        </div>
      </div>

      {/* ===== 主面板 ===== */}
      <div className="finder-main">
        {/* 工具栏 */}
        <div className="finder-toolbar">
          <div className="finder-toolbar-nav">
            <button className="finder-toolbar-nav-btn" disabled={navIndex <= 0} onClick={handleBack}>
              <LeftOutlined />
            </button>
            <button className="finder-toolbar-nav-btn" disabled={navIndex >= navHistory.length - 1} onClick={handleForward}>
              <RightOutlined />
            </button>
          </div>
          <div className="finder-toolbar-title">
            {activeTagFilter
              ? tagDefs.find((t) => t.id === activeTagFilter)?.name || '标签'
              : (currentFolder?.name || (scope === 'personal' ? '全部资料' : '组织资料'))}
          </div>

          {/* 视图切换按钮组：仅保留列表和详情 */}
          <div className="finder-toolbar-views">
            <Tooltip title="列表">
              <button className={`finder-toolbar-view-btn ${viewMode === 'list' ? 'finder-toolbar-view-btn-active' : ''}`} onClick={() => handleViewModeChange('list')}>
                <UnorderedListOutlined />
              </button>
            </Tooltip>
            <Tooltip title="详情">
              <button className={`finder-toolbar-view-btn ${viewMode === 'detail' ? 'finder-toolbar-view-btn-active' : ''}`} onClick={() => handleViewModeChange('detail')}>
                <ProfileOutlined />
              </button>
            </Tooltip>
            <Tooltip title="分栏">
              <button className={`finder-toolbar-view-btn ${viewMode === 'column' ? 'finder-toolbar-view-btn-active' : ''}`} onClick={() => handleViewModeChange('column')}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>|||</span>
              </button>
            </Tooltip>
          </div>

          {/* 分组/排序按钮 */}
          <Dropdown menu={sortMenu} trigger={['click']}>
            <button className="finder-toolbar-action-btn finder-toolbar-group-btn">
              <TagsOutlined style={{ fontSize: 13 }} />
              <CaretDownOutlined style={{ fontSize: 8, marginLeft: 2 }} />
            </button>
          </Dropdown>

          {/* 操作按钮区 */}
          <div className="finder-toolbar-actions">
            <Tooltip title="分享">
              <button className="finder-toolbar-action-btn" onClick={() => message.info('分享功能')}>
                <ExportOutlined />
              </button>
            </Tooltip>
            <Tooltip title="标记">
              <button className="finder-toolbar-action-btn" onClick={() => message.info('标记功能')}>
                <HighlightOutlined />
              </button>
            </Tooltip>
            <Popover
              content={selectedItemKey ? renderTagPicker(selectedItemKey) : <span style={{ color: '#999', fontSize: 13 }}>请先选中一个文件</span>}
              trigger="click"
              title="标签"
            >
              <button className="finder-toolbar-action-btn finder-toolbar-group-btn">
                <SmileOutlined />
                <CaretDownOutlined style={{ fontSize: 8, marginLeft: 2 }} />
              </button>
            </Popover>
          </div>

          {/* 搜索框 */}
          <div className="finder-toolbar-search">
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#999', fontSize: 12 }} />}
              placeholder="搜索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              size="small"
            />
          </div>
        </div>

        {/* ===== 内容区域：文件列表 + 右侧预览面板 ===== */}
        <div className="finder-content-area">

          {/* ==== 分栏视图 ==== */}
          {viewMode === 'column' ? (
              <div className="finder-column-scroll" ref={columnScrollRef}>
                {columnLevels.map((items, colIdx) => (
                  <div className="finder-column" key={colIdx}>
                    {items.map((item) => {
                      const isActive = columnPath[colIdx + 1] === item.key || (columnSelectedItem?.key === item.key);
                      return (
                        <div
                          key={item.key}
                          className={`finder-column-item ${isActive ? 'finder-column-item-active' : ''}`}
                          onClick={() => {
                            if (item.isFolder) {
                              handleColumnFolderClick(item.key, colIdx);
                            } else {
                              handleColumnFileClick(item, colIdx);
                            }
                          }}
                        >
                          <span className="finder-column-item-icon">{renderFileIcon(item.fileType, { fontSize: 16 })}</span>
                          <span className="finder-column-item-name">{item.name}</span>
                          {item.isFolder && <RightOutlined className="finder-column-item-arrow" />}
                        </div>
                      );
                    })}
                  </div>
                ))}

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
          <div className="finder-file-list" onContextMenu={handleBgContextMenu}>
              {/* 详情模式表头 */}
              {viewMode === 'detail' && currentChildren.length > 0 && (
                <div className="finder-detail-header">
                  <span className="finder-detail-col-name">名称</span>
                  <span className="finder-detail-col-date">修改日期</span>
                  <span className="finder-detail-col-size">大小</span>
                  <span className="finder-detail-col-kind">种类</span>
                </div>
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
                <div className="finder-empty"><Empty description="此文件夹为空，右键新建" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
              ) : (
                currentChildren.map((item) => {
                  const isSelected = selectedItemKey === item.key;
                  const itemTags = (item.tags || []).map((tid) => tagDefs.find((t) => t.id === tid)).filter(Boolean);
                  return (
                    <Dropdown key={item.key} menu={getContextMenu(item)} trigger={['contextMenu']}>
                      <div
                        className={`finder-file-row ${isSelected ? 'finder-file-row-selected' : ''}`}
                        onClick={() => setSelectedItemKey(item.key)}
                        onDoubleClick={() => handleDoubleClick(item)}
                      >
                        <span className="finder-file-icon">{renderFileIcon(item.fileType, { fontSize: 18 })}</span>
                        <span className="finder-file-name">{item.name}</span>
                        {viewMode === 'list' && itemTags.length > 0 && (
                          <span className="finder-file-tags">
                            {itemTags.map((t) => (<span key={t.id} className="finder-file-tag-dot" style={{ background: t.color }} />))}
                          </span>
                        )}
                        {viewMode === 'detail' && (
                          <>
                            <span className="finder-detail-col-date">{item.lastEdit || '--'}</span>
                            <span className="finder-detail-col-size">{item.size ? `${(item.size / 1024).toFixed(1)} KB` : '--'}</span>
                            <span className="finder-detail-col-kind">{item.isFolder ? '文件夹' : (item.fileType || '--')}</span>
                          </>
                        )}
                        {viewMode === 'list' && <span className="finder-file-meta">{item.lastEdit || ''}</span>}
                        {item.isFolder && <span className="finder-file-chevron"><RightOutlined style={{ fontSize: 10 }} /></span>}
                      </div>
                    </Dropdown>
                  );
                })
              )}
          </div>

          {/* 右侧预览面板（常驻 - 文件内容预览） */}
          <div className="finder-preview-panel">
            {previewItem ? (
              <div className="finder-preview-content">
                {/* 内容预览区 */}
                <div className="finder-preview-body">
                  {previewItem.isFolder ? (
                    <div className="finder-preview-folder-grid">
                      <FolderFilled style={{ fontSize: 80, color: '#4facfe' }} />
                      <div className="finder-preview-folder-hint">文件夹包含 {previewFolderCount} 个项目</div>
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
                {/* 底部信息栏 */}
                <div className="finder-preview-footer">
                  <div className="finder-preview-name">{previewItem.name}</div>
                  <div className="finder-preview-meta-row">
                    <span>{previewItem.isFolder ? '文件夹' : (previewItem.fileType?.toUpperCase() || '文件')}</span>
                    {previewItem.size && <span>{(previewItem.size / 1024).toFixed(1)} KB</span>}
                    {previewItem.lastEdit && <span>{previewItem.lastEdit}</span>}
                  </div>
                  {(previewItem.tags || []).length > 0 && (
                    <div className="finder-preview-tags-row">
                      {(previewItem.tags || []).map((tid) => {
                        const t = tagDefs.find((td) => td.id === tid);
                        if (!t) return null;
                        return <span key={t.id} className="finder-preview-tag"><span className="finder-preview-tag-dot" style={{ background: t.color }} />{t.name}</span>;
                      })}
                    </div>
                  )}
                  {previewItem.url && (
                    <a href={previewItem.url} target="_blank" rel="noreferrer" className="finder-preview-open-link">打开原文件</a>
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
          <span className="finder-pathbar-segment" onClick={() => navigateTo(null)}>
            <span className="finder-pathbar-segment-icon"><DesktopOutlined /></span>
            <span>{scope === 'personal' ? '个人资料库' : '组织资料库'}</span>
          </span>
          {breadcrumb.map((seg) => (
            <span key={seg.key} style={{ display: 'contents' }}>
              <span className="finder-pathbar-sep">›</span>
              <span className="finder-pathbar-segment" onClick={() => navigateTo(seg.key)}>
                <span className="finder-pathbar-segment-icon"><FolderFilled style={{ color: '#4facfe', fontSize: 11 }} /></span>
                <span>{seg.name}</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ===== 新建标签 Modal ===== */}
      <Modal
        title="新建自定义标签"
        open={addTagOpen}
        onCancel={() => setAddTagOpen(false)}
        onOk={() => {
          const trimmed = newTagName.trim();
          if (!trimmed) { message.warning('标签名称不能为空'); return; }
          setData((d) => addTagDefinition(d, { name: trimmed, color: typeof newTagColor === 'string' ? newTagColor : newTagColor.toHexString() }, scope));
          setAddTagOpen(false);
          message.success(`标签「${trimmed}」已创建`);
        }}
        okText="创建" cancelText="取消" destroyOnClose width={360}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称">
            <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="例如：重要、待审核" />
          </Form.Item>
          <Form.Item label="标签颜色">
            <ColorPicker value={newTagColor} onChange={(c) => setNewTagColor(c)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 添加资料 Modal ===== */}
      <Modal
        title={addType === 'folder' ? '新建文件夹' : '新建资料'}
        open={addOpen} onCancel={() => setAddOpen(false)} onOk={handleAddSubmit}
        okText="确定" cancelText="取消" destroyOnClose
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder={addType === 'folder' ? '请输入文件夹名称' : '请输入资料名称'} />
          </Form.Item>
          {addType === 'file' && (
            <>
              <Form.Item label="文件类型" name="fileType" tooltip="留空则按文件名后缀自动识别">
                <Select allowClear placeholder="自动识别" options={[
                  { value: 'pdf', label: 'PDF' }, { value: 'pptx', label: 'PPT' },
                  { value: 'docx', label: 'Word' }, { value: 'xlsx', label: 'Excel' },
                  { value: 'image', label: '图片' }, { value: 'video', label: '视频' },
                  { value: 'audio', label: '音频' }, { value: 'other', label: '其他' },
                ]} />
              </Form.Item>
              <Form.Item label="本地上传（可选）">
                <Upload beforeUpload={async (file) => {
                  const inferred = inferFileType(file.name);
                  addForm.setFieldsValue({ name: file.name, fileType: inferred });
                  const hide = message.loading('上传中...', 0);
                  try {
                    const r = await fileApi.upload(file, 'resource-lib');
                    addForm.setFieldsValue({ url: r.url, size: r.size, mime: r.mime });
                    hide(); message.success('上传成功');
                  } catch { hide(); message.error('上传失败'); }
                  return false;
                }} maxCount={1}>
                  <Button icon={<FileAddOutlined />}>选择文件</Button>
                </Upload>
              </Form.Item>
              <Form.Item name="url" hidden><Input /></Form.Item>
              <Form.Item name="size" hidden><Input /></Form.Item>
              <Form.Item name="mime" hidden><Input /></Form.Item>
            </>
          )}
          <div className="rl-add-tip">将创建到：<b>{currentFolder ? currentFolder.name : '根目录'}</b></div>
        </Form>
      </Modal>
    </div>
    </>
  );
}
