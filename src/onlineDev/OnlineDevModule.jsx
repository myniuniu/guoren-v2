import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Avatar, Input, Tag, Checkbox, Switch, Select, message, Modal, Upload, Dropdown, Drawer, Popover } from 'antd';
import {
  CodeOutlined,
  LayoutOutlined,
  FileTextOutlined,
  BookOutlined,
  BarChartOutlined,
  PlusOutlined,
  ShareAltOutlined,
  RocketOutlined,
  UserOutlined,
  SendOutlined,
  SettingOutlined,
  BulbOutlined,
  ReloadOutlined,
  EyeOutlined,
  LinkOutlined,
  AppstoreOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  SearchOutlined,
  FilterOutlined,
  ImportOutlined,
  ExportOutlined,
  SyncOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ColumnHeightOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DownOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  MenuOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  NumberOutlined,
  SaveOutlined,
  CloseOutlined,
  ApiOutlined,
  RightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { dataManageApi } from './dataManageApi';
import LeaveModule from '../leave/LeaveModule';
import DesktopServiceNotice from '../shared/DesktopServiceNotice';
import './OnlineDevModule.css';

const DEFAULT_VSCODE_URL = 'http://localhost:8443/?folder=/Users/hongleizhang/Documents/GitHub/guoren-v2';

const tabs = [
  { key: 'preview', icon: <LayoutOutlined />, label: '预览', active: true },
  { key: 'code', icon: <CodeOutlined />, label: '代码' },
  { key: 'database', icon: <DatabaseOutlined />, label: '数据库' },
  { key: 'plugin', icon: <ApiOutlined />, label: '插件' },
  { key: 'bookmark', icon: <BookOutlined />, label: '' },
  { key: 'analytics', icon: <BarChartOutlined />, label: '' },
];

// 插件 mock 数据
const MOCK_PLUGINS = [
  {
    id: 'archive-notify',
    name: '档案审批结果通知',
    icon: '💬',
    updatedAt: '05月24日 12:02',
    description: '档案审批完成后自动发送飞书通知给相关人员，包含审批结果、档案信息、审批意见等内容',
  },
];

// 插件目录分类 mock
const PLUGIN_CATALOG_TABS = [
  { key: 'common', label: '常用' },
  { key: 'ai', label: 'AI' },
  { key: 'feishu', label: '飞书' },
];
const PLUGIN_CATALOG = {
  common: [
    { id: 'ai-write', icon: '✨', color: '#722ed1', name: '智能写作', desc: '根据需求快速生成高质量的文本内容' },
    { id: 'text-to-image', icon: '🖼', color: '#722ed1', name: '文生图', desc: '基于即梦 4.0，快速将文本转化为高质量图片' },
    { id: 'image-to-image', icon: '🎨', color: '#722ed1', name: '图生图', desc: '基于即梦 4.0，实现图片编辑、局部修改与多图...' },
    { id: 'feishu-msg', icon: '💬', color: '#1677ff', name: '发送飞书消息', desc: '给指定人员或群组发送飞书消息' },
  ],
  ai: [
    { id: 'ai-write-2', icon: '✨', color: '#722ed1', name: '智能写作', desc: '根据需求快速生成高质量的文本内容' },
    { id: 'text-to-image-2', icon: '🖼', color: '#722ed1', name: '文生图', desc: '基于即梦 4.0，快速将文本转化为高质量图片' },
    { id: 'file-parse', icon: '📄', color: '#1677ff', name: '文件解析', desc: '将文件解析为文本内容,支持PDF、DOC、DO...' },
    { id: 'text-to-json', icon: '{ }', color: '#52c41a', name: '文本转 JSON', desc: '将文本转为结构化 JSON，用于生成或提...' },
    { id: 'text-classify', icon: '☰', color: '#722ed1', name: '文本分类', desc: '根据自定义规则，将文本进行自动分类处理' },
    { id: 'image-extract', icon: '🖼', color: '#13c2c2', name: '图片信息提取', desc: '从图片中提取结构化信息，例如发票信息...' },
    { id: 'text-summary', icon: '≡', color: '#1677ff', name: '文本总结', desc: '对指定内容进行文本总结' },
    { id: 'translate', icon: '文A', color: '#fa8c16', name: '智能翻译', desc: '基于 AI 能力，支持多种语言互译，提供准确...' },
    { id: 'ai-search', icon: '🔍', color: '#1677ff', name: 'AI 搜索', desc: '根据你的问题自动搜索信息，并由 AI 整理和提...' },
    { id: 'tts', icon: '🔊', color: '#722ed1', name: '语音合成', desc: '将文本转换为语音，支持多种音色、语速和音...' },
    { id: 'asr', icon: '🎤', color: '#fa541c', name: '语音转文字', desc: '将音频文件精准识别为文字，支持多种语言...' },
    { id: 'bg-replace', icon: '🏞', color: '#722ed1', name: '背景替换', desc: '智能提取图片主体并替换为指定背景，实现自...' },
    { id: 'image-compare', icon: '🔀', color: '#13c2c2', name: '图片对比', desc: '支持传入主图和对比图，根据分析要求自动对...' },
    { id: 'web-read', icon: '🌐', color: '#1677ff', name: 'AI 网页读取', desc: '输入网页链接，AI 自动解析网页内容并提...' },
  ],
  feishu: [
    { id: 'fs-msg', icon: '💬', color: '#1677ff', name: '发送飞书消息', desc: '给指定人员或群组发送飞书消息' },
    { id: 'fs-group', icon: '👥', color: '#1677ff', name: '创建飞书群组', desc: '按指定成员一键创建飞书群组' },
    { id: 'fs-bitable', icon: '📊', color: '#1677ff', name: '飞书多维表格', desc: '管理飞书多维表格，支持数据的创建、查...' },
    { id: 'fs-approval', icon: '✓', color: '#fa8c16', name: '飞书审批', desc: '支持查看飞书审批定义详情、触发审批实例' },
  ],
};

// 新建数据表默认字段
const DEFAULT_NEW_TABLE_FIELDS = [
  { name: 'id', desc: '表唯一 ID', fieldType: 'uuid', dbType: 'uuid', multi: false, required: true, unique: true, primary: true, locked: true },
  { name: '_created_at', desc: '创建时间', fieldType: 'datetime', dbType: 'timestamptz', multi: false, required: true, unique: false, primary: false, locked: true },
  { name: '_created_by', desc: '创建人', fieldType: 'user', dbType: 'user_profile', multi: false, required: false, unique: false, primary: false, locked: true },
  { name: '_updated_at', desc: '更新时间', fieldType: 'datetime', dbType: 'timestamptz', multi: false, required: true, unique: false, primary: false, locked: true },
  { name: '_updated_by', desc: '更新人', fieldType: 'user', dbType: 'user_profile', multi: false, required: false, unique: false, primary: false, locked: true },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'uuid', label: 'uuid' },
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'datetime', label: '日期时间' },
  { value: 'user', label: '人员' },
  { value: 'select', label: '单选' },
  { value: 'multiselect', label: '多选' },
];

const DB_TYPE_OPTIONS = [
  { value: 'uuid', label: 'uuid' },
  { value: 'varchar', label: 'varchar' },
  { value: 'text', label: 'text' },
  { value: 'int4', label: 'int4' },
  { value: 'int8', label: 'int8' },
  { value: 'numeric', label: 'numeric' },
  { value: 'timestamptz', label: 'timestamptz' },
  { value: 'user_profile', label: 'user_profile' },
  { value: 'jsonb', label: 'jsonb' },
];

function OnlineDevModule() {
  const [vscodeUrl, setVscodeUrl] = useState(DEFAULT_VSCODE_URL);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');

  // ====================== 预览可视化编辑状态 ======================
  const [previewEditMode, setPreviewEditMode] = useState(false);
  const [previewHoverRect, setPreviewHoverRect] = useState(null); // {left, top, width, height, tag}
  const [previewSelectedRect, setPreviewSelectedRect] = useState(null);
  const [previewSelectedText, setPreviewSelectedText] = useState('');
  const [previewEditPanelTab, setPreviewEditPanelTab] = useState('style'); // style | layout
  const [previewTextAlign, setPreviewTextAlign] = useState('left'); // left | center | right | justify
  const previewFrameRef = useRef(null);
  const previewSelectedNodeRef = useRef(null);
  const previewEditingNodeRef = useRef(null);

  // 退出当前的文本编辑态
  const exitTextEditing = () => {
    const node = previewEditingNodeRef.current;
    if (node) {
      node.removeAttribute('contenteditable');
      node.classList.remove('online-dev-preview-editing-text');
    }
    previewEditingNodeRef.current = null;
  };

  // 计算相对于 preview-frame 的位置
  const calcRectInFrame = (target) => {
    const frame = previewFrameRef.current;
    if (!frame || !target || !target.getBoundingClientRect) return null;
    const f = frame.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    return {
      left: r.left - f.left + frame.scrollLeft,
      top: r.top - f.top + frame.scrollTop,
      width: r.width,
      height: r.height,
      tag: (target.tagName || 'div').toLowerCase(),
    };
  };

  const handlePreviewMouseMove = (e) => {
    if (!previewEditMode) return;
    const t = e.target;
    if (!t || t === previewFrameRef.current) {
      setPreviewHoverRect(null);
      return;
    }
    if (previewEditingNodeRef.current === t) {
      setPreviewHoverRect(null);
      return;
    }
    setPreviewHoverRect(calcRectInFrame(t));
  };

  const handlePreviewMouseLeave = () => {
    if (!previewEditMode) return;
    setPreviewHoverRect(null);
  };

  const handlePreviewClickCapture = (e) => {
    if (!previewEditMode) return;
    const t = e.target;
    if (!t || t === previewFrameRef.current) return;
    // 如果点击的是已进入编辑的元素本身，不拦截默认行为 (允许设置光标)
    if (previewEditingNodeRef.current === t) return;
    e.preventDefault();
    e.stopPropagation();
    // 二次点击同一选中元素 → 进入文本编辑态
    if (previewSelectedNodeRef.current === t) {
      exitTextEditing();
      previewEditingNodeRef.current = t;
      t.setAttribute('contenteditable', 'true');
      t.classList.add('online-dev-preview-editing-text');
      setTimeout(() => {
        t.focus();
        // 将光标放到末尾
        try {
          const range = document.createRange();
          range.selectNodeContents(t);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) { /* ignore */ }
      }, 0);
      setPreviewHoverRect(null);
      return;
    }
    // 选中新元素 - 清除之前编辑态
    exitTextEditing();
    previewSelectedNodeRef.current = t;
    setPreviewSelectedRect(calcRectInFrame(t));
    setPreviewSelectedText(t.textContent || '');
  };

  const handleEnterEditMode = () => {
    setPreviewEditMode(true);
    setPreviewHoverRect(null);
    setPreviewSelectedRect(null);
    setPreviewSelectedText('');
    previewSelectedNodeRef.current = null;
  };

  const handleExitEditMode = () => {
    exitTextEditing();
    previewSelectedNodeRef.current = null;
    setPreviewEditMode(false);
    setPreviewHoverRect(null);
    setPreviewSelectedRect(null);
    setPreviewSelectedText('');
  };

  // 跳转到代码页签并定位到选中元素的源码位置
  const handleViewCode = () => {
    const node = previewSelectedNodeRef.current;
    if (!node) {
      message.warning('请先选中一个元素');
      return;
    }

    let fileName = null;
    let lineNumber = null;
    let columnNumber = null;

    // 首选：从 DOM 节点读 data-src-* 属性（由 vite babel plugin 注入，只在 dev 生效，定位准确）
    let cur = node;
    while (cur && cur !== previewFrameRef.current) {
      if (cur.dataset && cur.dataset.srcFile && cur.dataset.srcLine) {
        fileName = cur.dataset.srcFile;
        lineNumber = parseInt(cur.dataset.srcLine, 10);
        columnNumber = parseInt(cur.dataset.srcCol, 10) || 1;
        break;
      }
      cur = cur.parentElement;
    }

    // 兑底：从 React Fiber 探测源码位置（兼容 React 18/19）
    if (!fileName) {
      const fiberKey = Object.keys(node).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      if (fiberKey) {
        const WORKSPACE_ROOT = '/Users/hongleizhang/Documents/GitHub/guoren-v2';
        const pickFromStack = (f) => {
          if (!f) return null;
          const raw = f._debugStack;
          if (!raw) return null;
          const stackStr = typeof raw === 'string' ? raw : (raw.stack || '');
          if (!stackStr) return null;
          const lines = stackStr.split('\n');
          for (const line of lines) {
            if (/react-dom|jsx-dev-runtime|jsx-runtime|node_modules|@react-refresh|\.vite/.test(line)) continue;
            const m = line.match(/https?:\/\/[^\/\s]+(\/[^\s):?]+)(?:\?[^\s):]*)?:(\d+):(\d+)/);
            if (m && /\.(jsx?|tsx?)$/.test(m[1])) {
              return { fileName: WORKSPACE_ROOT + m[1], lineNumber: parseInt(m[2], 10), columnNumber: parseInt(m[3], 10) };
            }
          }
          return null;
        };
        const pickSource = (f) => {
          if (!f) return null;
          if (f._debugSource) return f._debugSource;
          const mp = f.memoizedProps || f.pendingProps;
          if (mp && mp.__source) return mp.__source;
          return pickFromStack(f);
        };
        let source = null;
        let cf = node[fiberKey];
        while (cf && !source) {
          source = pickSource(cf);
          if (source) break;
          let owner = cf._debugOwner;
          while (owner && !source) { source = pickSource(owner); owner = owner._debugOwner; }
          if (source) break;
          cf = cf.return;
        }
        if (source && source.fileName) {
          fileName = source.fileName;
          lineNumber = source.lineNumber;
          columnNumber = source.columnNumber || 1;
        }
      }
    }

    if (!fileName || !lineNumber) {
      message.warning('未能定位到源码位置，请刷新页面后重试');
      setActiveTab('code');
      return;
    }

    const col = columnNumber || 1;
    // code-server 的 payload 仅可靠识别 openFile/openFolder，vscode.open + selection 可能被忽略
    // 另外 URL 层 :line:col 后缀会让 server 端 stat 不到路径（ENOENT）
    // 所以：URI 仅传文件路径，同时将行号复制到剪贴板，提示用户按 ⌘G · ⌘V · Enter 完成定位
    const fileUri = `vscode-remote://localhost:8443${fileName}`;
    const payload = [["openFile", fileUri]];
    const newUrl = `${DEFAULT_VSCODE_URL}&payload=${encodeURIComponent(JSON.stringify(payload))}`;
    try {
      navigator.clipboard && navigator.clipboard.writeText(`${lineNumber}:${col}`);
    } catch (_) {}
    setVscodeUrl(newUrl);
    setLoading(true);
    // 保留预览页签的编辑状态（previewEditMode/selectedRect 等），仅切换页签
    setActiveTab('code');
    message.success(`已跳转到 ${fileName.split('/').pop()}；行号 ${lineNumber}:${col} 已复制，按 ⌘G · ⌘V · Enter 即可定位`, 5);
  };

  // 同步文本内容到被选中节点
  const handlePreviewTextChange = (e) => {
    const v = e.target.value;
    setPreviewSelectedText(v);
    if (previewSelectedNodeRef.current) {
      previewSelectedNodeRef.current.textContent = v;
      // 重新计算 rect
      setPreviewSelectedRect(calcRectInFrame(previewSelectedNodeRef.current));
    }
  };

  // 计算面板在 frame 内的位置（跟随选中元素）
  const PANEL_W = 280;
  const PANEL_OFFSET = 12;
  const computePanelPosition = (rect) => {
    if (!rect) return { left: 16, top: 16 };
    const frame = previewFrameRef.current;
    const frameW = frame?.clientWidth || 1200;
    const scrollLeft = frame?.scrollLeft || 0;
    let left = rect.left + rect.width + PANEL_OFFSET;
    if (left + PANEL_W > scrollLeft + frameW) {
      left = rect.left - PANEL_W - PANEL_OFFSET;
    }
    if (left < scrollLeft + 8) left = scrollLeft + 8;
    let top = rect.top;
    if (top < 8) top = 8;
    return { left, top };
  };

  // ====================== 插件状态 ======================
  const [pluginSearch, setPluginSearch] = useState('');
  const [activePluginId, setActivePluginId] = useState('archive-notify');
  // 插件列表由 state 管理，支持从插件目录动态添加
  const [pluginList, setPluginList] = useState(MOCK_PLUGINS);
  const [pluginInnerTab, setPluginInnerTab] = useState('detail'); // detail | log
  // 插件目录弹窗
  const [pluginCatalogOpen, setPluginCatalogOpen] = useState(false);
  const [pluginCatalogTab, setPluginCatalogTab] = useState('common');
  const [pluginCatalogKw, setPluginCatalogKw] = useState('');
  // 飞书审批插件状态
  const [approvalProcesses, setApprovalProcesses] = useState([]);
  const [approvalDropOpen, setApprovalDropOpen] = useState(false);
  const [approvalSearch, setApprovalSearch] = useState('');
  const [approvalSelected, setApprovalSelected] = useState(null);

  // 加载已发布流程列表（供飞书审批插件使用）
  useEffect(() => {
    if (activePluginId === 'fs-approval') {
      fetch('/api/workflow/process/list')
        .then((r) => r.json())
        .then((data) => setApprovalProcesses(Array.isArray(data) ? data : []))
        .catch(() => setApprovalProcesses([]));
    }
  }, [activePluginId]);

  // ====================== 数据库状态 ======================
  const [dbTables, setDbTables] = useState([]); // [{name, comment, rowCount}]
  const [tableSearch, setTableSearch] = useState('');
  const [activeDbTable, setActiveDbTable] = useState(null);
  const [dbColumns, setDbColumns] = useState([]); // 当前表的列信息
  const [dbRows, setDbRows] = useState([]);
  const [dbTotal, setDbTotal] = useState(0);
  const [dbPage, setDbPage] = useState(1);
  const [dbPageSize, setDbPageSize] = useState(50);
  const [dbKeyword, setDbKeyword] = useState('');
  const [dbSortBy, setDbSortBy] = useState(null);
  const [dbSortDir, setDbSortDir] = useState('asc');
  const [dbFilters, setDbFilters] = useState({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState(null);

  // 列设置（隐藏/显示）
  const [hiddenCols, setHiddenCols] = useState({}); // { tableName: Set(colName) }
  const [showColSettings, setShowColSettings] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // 选中行
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // 行编辑
  const [editingRowId, setEditingRowId] = useState(null); // 'new' | id
  const [selectedCell, setSelectedCell] = useState(null); // { rowId, colName }
  const [editingCell, setEditingCell] = useState(null); // { rowId, colName }
  const [cellEditValue, setCellEditValue] = useState('');
  const [editingRowData, setEditingRowData] = useState({});

  // 新增列
  const [addColOpen, setAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColFieldType, setNewColFieldType] = useState('');
  const [newColRequired, setNewColRequired] = useState(false);

  // 新建表
  const [creatingTable, setCreatingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDesc, setNewTableDesc] = useState('');
  const [newTableFields, setNewTableFields] = useState(DEFAULT_NEW_TABLE_FIELDS);

  const [chatInput, setChatInput] = useState('');
  const [chatFlex, setChatFlex] = useState(null); // null = use CSS default 3.5
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const bodyRef = useRef(null);
  const importInputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: '已完成将备注字段改为必填的所有修改：\n1. **数据库** - remark 字段已设为 NOT NULL\n2. **类型定义** (shared/api.interface.ts) - 两处 remark 字段从可选改为必填\n3. **前端表单** (ArchiveList.tsx)：\n• 添加备注必填验证\n• 移除提交时的 || undefined 处理\n• 标签显示 “备注 *” 标记\n• 添加错误提示\n4. **后端服务** (archive.service.ts)：\n• 更新创建档案时的 remark 处理\n• 更新档案详情返回的 remark 处理',
    },
    {
      role: 'user',
      content: '增加保存按钮，点击该按钮，不会提交流程',
    },
    {
      role: 'thinking',
      content: '思考了 6 秒',
    },
    {
      role: 'system',
      content: '我来为上传弹窗添加保存按钮，实现本地暂存草稿功能。',
    },
    {
      role: 'tool',
      content: '调用 5 次工具',
    },
    {
      role: 'task-card',
      title: '添加保存草稿按钮功能',
      time: '昨天 12:30 开发完成',
    },
    {
      role: 'system',
      content: '已完成保存草稿按钮功能：\n\n新增功能：\n1. **保存按钮** - 点击“保存”会将当前表单内容保存到浏览器本地存储\n2. **自动恢复** - 打开上传弹窗时，会自动恢复上次保存的草稿\n3. **提交清空** - 成功提交后会自动清除草稿\n\n按钮顺序：取消 → 保存 → 提交\n保存草稿不会调用后端接口，只是本地暂存，方便用户中断填写后下次继续。',
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ====================== 数据库 effect ======================

  // 进入数据库 Tab 时加载表列表 + 数据源信息
  useEffect(() => {
    if (activeTab !== 'database') return;
    reloadTables();
    dataManageApi.getDataSource().then(setDataSourceInfo).catch(() => {});
  }, [activeTab]);

  // 切换当前表时加载列 + 行
  useEffect(() => {
    if (activeTab !== 'database') return;
    if (!activeDbTable) {
      setDbColumns([]);
      setDbRows([]);
      setDbTotal(0);
      return;
    }
    loadColumns(activeDbTable);
    setDbPage(1);
    setSelectedRowIds([]);
    setDbKeyword('');
    setDbSortBy(null);
    setDbSortDir('asc');
    setDbFilters({});
    setSelectedCell(null);
    setEditingCell(null);
  }, [activeDbTable]);

  // 点击单元格外部区域时清除单元格选中
  useEffect(() => {
    if (!selectedCell && !editingCell) return;
    const onDocClick = (e) => {
      // 点击不在数据单元格内，清除选中
      const cell = e.target.closest && e.target.closest('.online-dev-db-td');
      if (!cell) {
        setSelectedCell(null);
        setEditingCell(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [selectedCell, editingCell]);

  // 查询条件变化时重拉行
  useEffect(() => {
    if (activeTab !== 'database' || !activeDbTable) return;
    loadRows(activeDbTable);
  }, [activeDbTable, dbPage, dbPageSize, dbKeyword, dbSortBy, dbSortDir, dbFilters]);

  const reloadTables = async () => {
    try {
      const list = await dataManageApi.listTables();
      setDbTables(list || []);
      // 默认选中第一张表
      if (list && list.length > 0) {
        const stillExists = list.find((t) => t.name === activeDbTable);
        if (!stillExists) setActiveDbTable(list[0].name);
      } else {
        setActiveDbTable(null);
      }
    } catch (e) {
      message.error('加载表列表失败：' + e.message);
    }
  };

  const loadColumns = async (table) => {
    try {
      const cols = await dataManageApi.listColumns(table);
      setDbColumns(cols || []);
    } catch (e) {
      message.error('加载列信息失败：' + e.message);
    }
  };

  const loadRows = async (table) => {
    setDbLoading(true);
    try {
      const resp = await dataManageApi.listRows(table, {
        page: dbPage,
        pageSize: dbPageSize,
        keyword: dbKeyword,
        sortBy: dbSortBy,
        sortDir: dbSortDir,
        filters: dbFilters,
      });
      setDbRows(resp.rows || []);
      setDbTotal(resp.total || 0);
    } catch (e) {
      message.error('加载数据失败：' + e.message);
      setDbRows([]);
      setDbTotal(0);
    } finally {
      setDbLoading(false);
    }
  };

  const visibleColumns = useMemo(() => {
    const hidden = hiddenCols[activeDbTable] || new Set();
    return dbColumns.filter((c) => !hidden.has(c.name));
  }, [dbColumns, hiddenCols, activeDbTable]);

  const filteredTables = useMemo(() => {
    if (!tableSearch) return dbTables;
    const k = tableSearch.toLowerCase();
    return dbTables.filter(
      (t) => t.name.toLowerCase().includes(k) || (t.comment || '').toLowerCase().includes(k),
    );
  }, [dbTables, tableSearch]);

  // ====================== 行操作 ======================
  const handleAddRow = () => {
    setEditingRowId('new');
    const init = {};
    dbColumns.forEach((c) => { init[c.name] = ''; });
    setEditingRowData(init);
  };

  const handleEditRow = (row) => {
    setEditingRowId(row.id);
    setEditingRowData({ ...row });
    setSelectedCell(null);
    setEditingCell(null);
  };

  // 单元格点击：未选中→选中，已选中→进入编辑
  const handleCellClick = (e, row, col) => {
    e.stopPropagation();
    // 整行编辑/新增模式时禁用单元格交互
    if (editingRowId === row.id || editingRowId === 'new') return;
    const readOnlyCols = ['id', '_created_at', '_updated_at', '_created_by', '_updated_by'];
    const isReadOnly = readOnlyCols.includes(col.name);
    const isSameSelected = selectedCell && selectedCell.rowId === row.id && selectedCell.colName === col.name;
    if (isSameSelected) {
      if (isReadOnly) return;
      setEditingCell({ rowId: row.id, colName: col.name });
      setCellEditValue(row[col.name] == null ? '' : String(row[col.name]));
      return;
    }
    setSelectedCell({ rowId: row.id, colName: col.name });
    setEditingCell(null);
  };

  const handleCellSave = async (row, col) => {
    const original = row[col.name] == null ? '' : String(row[col.name]);
    if (cellEditValue === original) {
      setEditingCell(null);
      return;
    }
    try {
      await dataManageApi.updateRow(activeDbTable, row.id, { [col.name]: cellEditValue });
      message.success('保存成功');
      setEditingCell(null);
      setCellEditValue('');
      loadRows(activeDbTable);
    } catch (err) {
      message.error('保存失败：' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setCellEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingRowData({});
  };

  const handleSaveRow = async () => {
    try {
      if (editingRowId === 'new') {
        await dataManageApi.insertRow(activeDbTable, editingRowData);
        message.success('新增成功');
      } else {
        await dataManageApi.updateRow(activeDbTable, editingRowId, editingRowData);
        message.success('保存成功');
      }
      setEditingRowId(null);
      setEditingRowData({});
      loadRows(activeDbTable);
      reloadTables();
    } catch (e) {
      message.error('保存失败：' + e.message);
    }
  };

  const handleDeleteRow = (row) => {
    Modal.confirm({
      title: '确定删除该行？',
      content: `id = ${row.id}`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dataManageApi.deleteRow(activeDbTable, row.id);
          message.success('已删除');
          loadRows(activeDbTable);
          reloadTables();
        } catch (e) {
          message.error('删除失败：' + e.message);
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowIds.length === 0) {
      message.warning('请先选中要删除的行');
      return;
    }
    Modal.confirm({
      title: `确定删除选中的 ${selectedRowIds.length} 行？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dataManageApi.batchDeleteRows(activeDbTable, selectedRowIds);
          message.success('批量删除成功');
          setSelectedRowIds([]);
          loadRows(activeDbTable);
          reloadTables();
        } catch (e) {
          message.error('删除失败：' + e.message);
        }
      },
    });
  };

  // ====================== 表操作 ======================
  const handleSubmitNewTable = async () => {
    if (!newTableName) {
      message.error('请输入数据表名称');
      return;
    }
    try {
      await dataManageApi.createTable({
        name: newTableName,
        comment: newTableDesc,
        columns: newTableFields
          .filter((f) => f.name)
          .map((f) => ({
            name: f.name,
            fieldType: f.fieldType,
            dbType: f.dbType,
            comment: f.desc,
            nullable: !f.required,
            primary: !!f.primary,
            unique: !!f.unique,
            multi: !!f.multi,
          })),
      });
      message.success('创建成功');
      setCreatingTable(false);
      reloadTables();
      setActiveDbTable(newTableName);
    } catch (e) {
      message.error('创建失败：' + e.message);
    }
  };

  const handleDropTable = (tableName) => {
    Modal.confirm({
      title: `确定删除表 ${tableName}？`,
      content: '表数据将被一同清空，不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dataManageApi.dropTable(tableName);
          message.success('已删除');
          if (activeDbTable === tableName) setActiveDbTable(null);
          reloadTables();
        } catch (e) {
          message.error('删除失败：' + e.message);
        }
      },
    });
  };

  const handleTruncateTable = () => {
    Modal.confirm({
      title: `确定清空表 ${activeDbTable} 的所有数据？`,
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dataManageApi.truncate(activeDbTable);
          message.success('已清空');
          loadRows(activeDbTable);
          reloadTables();
        } catch (e) {
          message.error('清空失败：' + e.message);
        }
      },
    });
  };

  // ====================== 导入导出 ======================
  const handleExport = () => {
    if (!activeDbTable) return;
    window.open(dataManageApi.exportCsvUrl(activeDbTable), '_blank');
  };

  const handleImportClick = () => {
    if (!activeDbTable) {
      message.warning('请先选择表');
      return;
    }
    importInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const resp = await dataManageApi.importCsv(activeDbTable, file);
      message.success(`导入完成：成功 ${resp.successCount}，失败 ${resp.failCount}`);
      loadRows(activeDbTable);
      reloadTables();
    } catch (err) {
      message.error('导入失败：' + err.message);
    }
  };

  const handleAddColumn = async () => {
    if (!newColName.trim()) {
      message.error('请输入名称');
      return;
    }
    if (!newColFieldType) {
      message.error('请选择类型');
      return;
    }
    try {
      await dataManageApi.addColumn(activeDbTable, {
        name: newColName.trim(),
        fieldType: newColFieldType,
        comment: newColDesc.trim() || undefined,
        nullable: !newColRequired,
      });
      message.success('列添加成功');
      setAddColOpen(false);
      setNewColName('');
      setNewColDesc('');
      setNewColFieldType('');
      setNewColRequired(false);
      loadColumns(activeDbTable);
    } catch (e) {
      message.error('添加列失败：' + e.message);
    }
  };

  const handleSync = async () => {
    if (!activeDbTable) return;
    await loadColumns(activeDbTable);
    await loadRows(activeDbTable);
    await reloadTables();
    message.success('数据已同步');
  };

  const toggleColumnHidden = (colName) => {
    setHiddenCols((prev) => {
      const next = { ...prev };
      const set = new Set(next[activeDbTable] || []);
      if (set.has(colName)) set.delete(colName);
      else set.add(colName);
      next[activeDbTable] = set;
      return next;
    });
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { role: 'user', content: chatInput }]);
    setChatInput('');
    // TODO: 集成AI接口
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '正在处理你的请求...' }]);
    }, 500);
  };

  const handleDragStart = (e) => {
    // 只在卡片左边缘附近触发
    const editorEl = e.currentTarget;
    const rect = editorEl.getBoundingClientRect();
    if (e.clientX - rect.left > 8) return;
    isDragging.current = true;
    startX.current = e.clientX;
    const chatEl = editorEl.previousElementSibling;
    startWidth.current = chatEl ? chatEl.getBoundingClientRect().width : 300;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(240, Math.min(600, startWidth.current + diff));
    setChatFlex(newWidth);
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  return (
    <div className="online-dev-module">
      <div style={{ padding: '16px 16px 0' }}>
        <DesktopServiceNotice
          title="在线开发依赖外部 code-server"
          serviceName="code-server"
          serviceUrl={vscodeUrl}
          extraText="桌面版会直接连接你本地运行的 code-server；未启动时，代码页签会停留在加载状态。"
        />
      </div>
      {/* 主体区域 - 左右并排 */}
      <div className="online-dev-body">
        {/* 左侧对话区 */}
        <div className="online-dev-chat" style={chatFlex ? { flex: `0 0 ${chatFlex}px` } : undefined}>
          {/* 左侧顶部：应用信息 */}
          <div className="online-dev-chat-header">
            <div className="online-dev-app-info">
              <RocketOutlined className="online-dev-app-icon" />
              <span className="online-dev-app-name">员工档案审批系统</span>
              <Tag color="green" className="online-dev-app-tag">应用</Tag>
            </div>
            <div className="online-dev-chat-header-icons">
              <ReloadOutlined className="online-dev-header-action" />
              <LinkOutlined className="online-dev-header-action" />
              <EyeOutlined className="online-dev-header-action" />
              <AppstoreOutlined className="online-dev-header-action" />
            </div>
          </div>
          {/* 操作按钮 */}
          <div className="online-dev-chat-top-actions">
            <Button size="small" icon={<EyeOutlined />}>预览应用</Button>
            <Button size="small" icon={<RollbackOutlined />}>回退</Button>
          </div>
          <div className="online-dev-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`online-dev-chat-msg online-dev-chat-msg-${msg.role}`}>
                {msg.role === 'user' && (
                  <div className="online-dev-chat-bubble-user">
                    <span>{msg.content}</span>
                    <Avatar size={24} src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" className="online-dev-chat-avatar" />
                  </div>
                )}
                {msg.role === 'system' && (
                  <div className="online-dev-chat-bubble-ai">
                    {msg.content.split('\n').map((line, i) => {
                      // 粗体处理
                      const parts = line.split(/\*\*(.*?)\*\*/);
                      return (
                        <p key={i}>
                          {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </p>
                      );
                    })}
                  </div>
                )}
                {msg.role === 'thinking' && (
                  <div className="online-dev-chat-thinking">
                    <ClockCircleOutlined /> {msg.content}
                  </div>
                )}
                {msg.role === 'tool' && (
                  <div className="online-dev-chat-tool">
                    <ToolOutlined /> {msg.content}
                    <span className="online-dev-chat-tool-icons">
                      <CodeOutlined />
                      <CodeOutlined />
                      <FileTextOutlined />
                      <BookOutlined />
                      ···
                    </span>
                  </div>
                )}
                {msg.role === 'task-card' && (
                  <div className="online-dev-chat-task-card">
                    <div className="online-dev-task-card-header">
                      <CheckCircleOutlined className="online-dev-task-card-icon" />
                      <div>
                        <div className="online-dev-task-card-title">{msg.title}</div>
                        <div className="online-dev-task-card-time">{msg.time}</div>
                      </div>
                    </div>
                    <div className="online-dev-task-card-actions">
                      <Button size="small" icon={<EyeOutlined />}>预览应用</Button>
                      <Button size="small" icon={<CodeOutlined />}>查看变更</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="online-dev-chat-input-area">
            <Input.TextArea
              className="online-dev-chat-textarea"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="告诉妙搭如何修改应用"
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <div className="online-dev-chat-actions">
              <div className="online-dev-chat-actions-left">
                <PlusOutlined className="online-dev-chat-action-icon" />
                <LinkOutlined className="online-dev-chat-action-icon" />
                <span className="online-dev-chat-action-slash">/</span>
                <span className="online-dev-chat-mode">Plan</span>
                <BulbOutlined className="online-dev-chat-action-icon" />
                <SettingOutlined className="online-dev-chat-action-icon" />
              </div>
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!chatInput.trim()}
                className="online-dev-chat-send-btn"
              />
            </div>
            <div className="online-dev-chat-disclaimer">
              AI 生成内容可能有误，请核实并谨慎使用
            </div>
          </div>
        </div>

        {/* 右侧编辑器卡片 */}
        <div className="online-dev-editor" onMouseDown={handleDragStart}>
          {/* 卡片内Tab栏 + 右侧按钮 */}
          <div className="online-dev-card-tabs">
            <div className="online-dev-card-tabs-left">
              {tabs.map((tab) => (
                <div
                  key={tab.key}
                  className={`online-dev-tab ${activeTab === tab.key ? 'online-dev-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="online-dev-tab-icon">{tab.icon}</span>
                  {tab.label && <span className="online-dev-tab-label">{tab.label}</span>}
                </div>
              ))}
              <div className="online-dev-tab online-dev-tab-add">
                <PlusOutlined />
              </div>
            </div>
            <div className="online-dev-card-tabs-right">
              <Avatar size={28} src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
              <Avatar size={28} icon={<UserOutlined />} />
              <Button className="online-dev-btn-share" icon={<ShareAltOutlined />}>
                分享
              </Button>
              <Popover
                trigger="click"
                placement="bottomRight"
                overlayClassName="online-dev-publish-popover"
                content={(
                  <div className="online-dev-publish-pop">
                    <div className="online-dev-publish-pop-header">
                      <span className="online-dev-publish-pop-title">发布</span>
                      <span className="online-dev-publish-pop-badge">
                        <span className="online-dev-publish-pop-badge-dot" />
                        存在新的变更内容
                      </span>
                    </div>
                    <div className="online-dev-publish-pop-section">
                      <div className="online-dev-publish-pop-label">线上版本</div>
                      <div className="online-dev-publish-pop-meta">
                        5月24日 12:16 由 <a className="online-dev-publish-pop-user">张洪磊</a> 更新为 V7
                      </div>
                    </div>
                    <div className="online-dev-publish-pop-section">
                      <div className="online-dev-publish-pop-label">可用范围</div>
                      <div
                        className="online-dev-publish-pop-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => message.info('设置可用范围')}
                      >
                        <span>仅指定用户可访问</span>
                        <RightOutlined className="online-dev-publish-pop-row-arrow" />
                      </div>
                    </div>
                    <div className="online-dev-publish-pop-section">
                      <div className="online-dev-publish-pop-label">访问地址</div>
                      <div className="online-dev-publish-pop-url">https://guortcorp.aiforce.cloud/app/app_4k7fgtb95g27d</div>
                    </div>
                    <Button
                      type="primary"
                      block
                      className="online-dev-publish-pop-btn"
                      icon={<RocketOutlined />}
                      onClick={() => message.success('已发布到线上版本')}
                    >
                      发布
                    </Button>
                  </div>
                )}
              >
                <Button type="primary" className="online-dev-btn-publish" icon={<RocketOutlined />}>
                  发布
                </Button>
              </Popover>
            </div>
          </div>
          <div className="online-dev-iframe-container">
              <div className="online-dev-preview" style={activeTab === 'preview' ? undefined : { display: 'none' }}>
                <div className="online-dev-preview-toolbar">
                  <Button type="text" size="small" icon={<ArrowLeftOutlined />} disabled />
                  <Button type="text" size="small" icon={<ArrowRightOutlined />} disabled />
                  <Button type="text" size="small" icon={<ReloadOutlined />} />
                  <span className="online-dev-preview-status">
                    <span className="online-dev-preview-status-dot" />
                    {previewEditMode ? '编辑中' : '刚刚更新'}
                  </span>
                  <div className="online-dev-preview-toolbar-spacer" />
                  {previewEditMode ? (
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleExitEditMode}>退出编辑</Button>
                  ) : (
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={handleEnterEditMode}>编辑</Button>
                  )}
                  <Button type="text" size="small" icon={<ShareAltOutlined />} />
                  <Button type="text" size="small" icon={<LinkOutlined />} />
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </div>
                <div className="online-dev-preview-addrbar">
                  <span className="online-dev-preview-addr-icon"><AppstoreOutlined /></span>
                  <Input
                    size="small"
                    value="/leave"
                    readOnly
                    className="online-dev-preview-addr-input"
                    bordered={false}
                  />
                  <span className="online-dev-preview-addr-icon"><ExportOutlined /></span>
                  <span className="online-dev-preview-addr-icon"><DownOutlined /></span>
                </div>
                <div
                  className={`online-dev-preview-frame ${previewEditMode ? 'online-dev-preview-frame-editing' : ''}`}
                  ref={previewFrameRef}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseLeave={handlePreviewMouseLeave}
                  onClickCapture={handlePreviewClickCapture}
                >
                  <LeaveModule />
                  {previewEditMode && previewHoverRect && (
                    <div
                      className="online-dev-preview-edit-overlay online-dev-preview-edit-overlay-hover"
                      style={{ left: previewHoverRect.left, top: previewHoverRect.top, width: previewHoverRect.width, height: previewHoverRect.height }}
                    >
                      <span className="online-dev-preview-edit-tag">{previewHoverRect.tag}</span>
                    </div>
                  )}
                  {previewEditMode && previewSelectedRect && (
                    <div
                      className="online-dev-preview-edit-overlay online-dev-preview-edit-overlay-selected"
                      style={{ left: previewSelectedRect.left, top: previewSelectedRect.top, width: previewSelectedRect.width, height: previewSelectedRect.height }}
                    >
                      <span className="online-dev-preview-edit-tag online-dev-preview-edit-tag-selected">
                        {previewSelectedRect.tag}
                        <ArrowUpOutlined className="online-dev-preview-edit-tag-icon" />
                      </span>
                    </div>
                  )}
                </div>
                {previewEditMode && (
                  <>
                    {/* 左下浮动属性面板 - 仅选中元素后显示 */}
                    {previewSelectedRect && (() => {
                      const pos = computePanelPosition(previewSelectedRect);
                      return (
                    <div className="online-dev-preview-edit-panel" style={{ left: pos.left, top: pos.top, width: PANEL_W }}>
                      <div className="online-dev-preview-edit-panel-head">
                        <Input size="small" placeholder="请描述你的修改需求" bordered={false} className="online-dev-preview-edit-panel-input" />
                        <CloseOutlined className="online-dev-preview-edit-panel-close" onClick={() => { exitTextEditing(); previewSelectedNodeRef.current = null; setPreviewSelectedRect(null); }} />
                      </div>
                      {/* 文本内容 */}
                      <div className="online-dev-preview-edit-panel-textblock">
                        <div className="online-dev-preview-edit-panel-section-title">文本内容</div>
                        <textarea
                          className="online-dev-preview-edit-panel-textarea"
                          value={previewSelectedText}
                          onChange={handlePreviewTextChange}
                          rows={3}
                        />
                      </div>
                      <div className="online-dev-preview-edit-panel-tabs">
                        <span
                          className={`online-dev-preview-edit-panel-tab ${previewEditPanelTab === 'style' ? 'online-dev-preview-edit-panel-tab-active' : ''}`}
                          onClick={() => setPreviewEditPanelTab('style')}
                        >样式</span>
                        <span
                          className={`online-dev-preview-edit-panel-tab ${previewEditPanelTab === 'layout' ? 'online-dev-preview-edit-panel-tab-active' : ''}`}
                          onClick={() => setPreviewEditPanelTab('layout')}
                        >布局</span>
                      </div>
                      <div className="online-dev-preview-edit-panel-body">
                        {/* 文字 */}
                        <div className="online-dev-preview-edit-panel-section">
                          <div className="online-dev-preview-edit-panel-section-head">
                            <span>文字</span>
                            <DownOutlined style={{ transform: 'rotate(180deg)' }} />
                          </div>
                          <div className="online-dev-preview-edit-panel-row">
                            <span className="online-dev-preview-edit-panel-label">字号</span>
                            <Select
                              size="small"
                              defaultValue="sm"
                              className="online-dev-preview-edit-panel-select"
                              options={[
                                { value: 'xs', label: 'xs (12px)' },
                                { value: 'sm', label: 'sm (14px)' },
                                { value: 'base', label: 'base (16px)' },
                                { value: 'lg', label: 'lg (18px)' },
                                { value: 'xl', label: 'xl (20px)' },
                              ]}
                            />
                          </div>
                          <div className="online-dev-preview-edit-panel-row">
                            <span className="online-dev-preview-edit-panel-label">字重</span>
                            <Select
                              size="small"
                              defaultValue="medium"
                              className="online-dev-preview-edit-panel-select"
                              options={[
                                { value: 'normal', label: '常规 (Normal)' },
                                { value: 'medium', label: '中粗 (Medium)' },
                                { value: 'bold', label: '粗体 (Bold)' },
                              ]}
                            />
                          </div>
                          <div className="online-dev-preview-edit-panel-row">
                            <span className="online-dev-preview-edit-panel-label">对齐</span>
                            <div className="online-dev-preview-edit-align-group">
                              {[
                                { k: 'left', icon: <AlignLeftOutlined /> },
                                { k: 'center', icon: <AlignCenterOutlined /> },
                                { k: 'right', icon: <AlignRightOutlined /> },
                                { k: 'justify', icon: <MenuOutlined /> },
                              ].map(b => (
                                <span
                                  key={b.k}
                                  className={`online-dev-preview-edit-align-btn ${previewTextAlign === b.k ? 'online-dev-preview-edit-align-btn-active' : ''}`}
                                  onClick={() => setPreviewTextAlign(b.k)}
                                >{b.icon}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* 颜色 */}
                        <div className="online-dev-preview-edit-panel-section">
                          <div className="online-dev-preview-edit-panel-section-head">
                            <span>颜色</span>
                            <DownOutlined />
                          </div>
                        </div>
                        {/* 边框 */}
                        <div className="online-dev-preview-edit-panel-section">
                          <div className="online-dev-preview-edit-panel-section-head">
                            <span>边框</span>
                            <DownOutlined />
                          </div>
                        </div>
                        {/* 阴影 */}
                        <div className="online-dev-preview-edit-panel-section">
                          <div className="online-dev-preview-edit-panel-section-head">
                            <span>阴影</span>
                            <DownOutlined />
                          </div>
                        </div>
                      </div>
                      <div className="online-dev-preview-edit-panel-footer">
                        <Button type="text" size="small" icon={<DeleteOutlined />}>删除元素</Button>
                        <span className="online-dev-preview-edit-panel-divider" />
                        <Button type="text" size="small" icon={<CodeOutlined />} onClick={handleViewCode}>查看代码</Button>
                      </div>
                    </div>
                      );
                    })()}
                    {/* 底部浮动工具栏 */}
                    <div className="online-dev-preview-edit-bottombar">
                      <span className="online-dev-preview-edit-bottombar-icon"><ArrowLeftOutlined style={{ transform: 'rotate(-45deg)' }} /></span>
                      <span className="online-dev-preview-edit-bottombar-icon"><ColumnHeightOutlined /></span>
                      <span className="online-dev-preview-edit-bottombar-divider" />
                      <span className="online-dev-preview-edit-bottombar-icon"><ClockCircleOutlined /> 0</span>
                      <span className="online-dev-preview-edit-bottombar-icon"><RollbackOutlined /></span>
                      <span className="online-dev-preview-edit-bottombar-icon"><RollbackOutlined style={{ transform: 'scaleX(-1)' }} /></span>
                      <span className="online-dev-preview-edit-bottombar-divider" />
                      <Button size="small" className="online-dev-preview-edit-bottombar-exit" onClick={handleExitEditMode}>退出</Button>
                      <Button size="small" type="primary" className="online-dev-preview-edit-bottombar-submit">提交(⌘S)</Button>
                    </div>
                  </>
                )}
              </div>
              <div className="online-dev-plugin" style={activeTab === 'plugin' ? undefined : { display: 'none' }}>
                {/* 左侧插件列表 */}
                <div className="online-dev-plugin-sidebar">
                  <div className="online-dev-plugin-sidebar-title">插件</div>
                  <div className="online-dev-plugin-search">
                    <Input
                      size="small"
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      suffix={<FilterOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="搜索"
                      value={pluginSearch}
                      onChange={(e) => setPluginSearch(e.target.value)}
                      bordered
                    />
                    <Popover
                      open={pluginCatalogOpen}
                      onOpenChange={setPluginCatalogOpen}
                      trigger="click"
                      placement="rightTop"
                      overlayClassName="online-dev-plugin-catalog-popover"
                      content={(
                        <div className="online-dev-plugin-catalog">
                          <div className="online-dev-plugin-catalog-head">
                            <div className="online-dev-plugin-catalog-tabs">
                              {PLUGIN_CATALOG_TABS.map((t) => (
                                <span
                                  key={t.key}
                                  className={`online-dev-plugin-catalog-tab ${pluginCatalogTab === t.key ? 'online-dev-plugin-catalog-tab-active' : ''}`}
                                  onClick={() => setPluginCatalogTab(t.key)}
                                >{t.label}</span>
                              ))}
                            </div>
                            <SearchOutlined className="online-dev-plugin-catalog-search-icon" />
                          </div>
                          <div className="online-dev-plugin-catalog-list">
                            <div className="online-dev-plugin-catalog-section-title">
                              {PLUGIN_CATALOG_TABS.find(t => t.key === pluginCatalogTab)?.label}
                            </div>
                            {(PLUGIN_CATALOG[pluginCatalogTab] || [])
                              .filter(p => !pluginCatalogKw || p.name.includes(pluginCatalogKw) || p.desc.includes(pluginCatalogKw))
                              .map((p) => (
                                <div
                                  key={p.id}
                                  className="online-dev-plugin-catalog-item"
                                  onClick={() => {
                                    // 将所选插件加入左侧列表（按 id 去重），并设为当前选中
                                    setPluginList((prev) => {
                                      if (prev.some(it => it.id === p.id)) return prev;
                                      const today = new Date();
                                      const pad = (n) => String(n).padStart(2, '0');
                                      const updatedAt = `今天 ${pad(today.getHours())}:${pad(today.getMinutes())}`;
                                      return [
                                        ...prev,
                                        { id: p.id, name: p.name, icon: p.icon, updatedAt, description: p.desc },
                                      ];
                                    });
                                    setActivePluginId(p.id);
                                    message.success(`已添加插件：${p.name}`);
                                    setPluginCatalogOpen(false);
                                  }}
                                >
                                  <span className="online-dev-plugin-catalog-icon" style={{ background: p.color }}>{p.icon}</span>
                                  <span className="online-dev-plugin-catalog-name">{p.name}</span>
                                  <span className="online-dev-plugin-catalog-divider">|</span>
                                  <span className="online-dev-plugin-catalog-desc">{p.desc}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    >
                      <Button size="small" icon={<PlusOutlined />} className="online-dev-plugin-add-btn" />
                    </Popover>
                  </div>
                  <div className="online-dev-plugin-list">
                    {pluginList.filter(p => !pluginSearch || p.name.includes(pluginSearch)).map((p) => (
                      <div
                        key={p.id}
                        className={`online-dev-plugin-item ${activePluginId === p.id ? 'online-dev-plugin-item-active' : ''}`}
                        onClick={() => setActivePluginId(p.id)}
                      >
                        <span className="online-dev-plugin-item-icon">{p.icon}</span>
                        <span className="online-dev-plugin-item-name">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 右侧插件详情 */}
                <div className="online-dev-plugin-main">
                  {(() => {
                    const plugin = pluginList.find(p => p.id === activePluginId);
                    if (!plugin) {
                      return <div className="online-dev-db-empty-main">请选择插件</div>;
                    }
                    return (
                      <>
                        {/* 顶部信息 */}
                        <div className="online-dev-plugin-header">
                          <div className="online-dev-plugin-header-row">
                            <span className="online-dev-plugin-header-icon">{plugin.icon}</span>
                            <span className="online-dev-plugin-header-name">{plugin.name}</span>
                            <Dropdown
                              menu={{
                                items: [
                                  { key: 'edit', icon: <EditOutlined />, label: '修改基本信息' },
                                  { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                                ],
                                onClick: ({ key }) => {
                                  if (key === 'delete') {
                                    Modal.confirm({
                                      title: '删除插件',
                                      content: `确定要删除插件「${plugin.name}」吗？`,
                                      okText: '删除',
                                      okButtonProps: { danger: true },
                                      cancelText: '取消',
                                      onOk: () => {
                                        setPluginList((prev) => prev.filter((p) => p.id !== plugin.id));
                                        if (activePluginId === plugin.id) setActivePluginId('');
                                        message.success('已删除插件');
                                      },
                                    });
                                  } else if (key === 'edit') {
                                    message.info('修改基本信息功能开发中');
                                  }
                                },
                              }}
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <MoreOutlined className="online-dev-plugin-header-more" />
                            </Dropdown>
                          </div>
                          <div className="online-dev-plugin-header-meta">
                            <span>更新于: {plugin.updatedAt}</span>
                            <span className="online-dev-plugin-header-divider">|</span>
                            <span>描述: {plugin.description}</span>
                          </div>
                        </div>
                        {/* 内部 Tab */}
                        <div className="online-dev-plugin-tabs">
                          <span
                            className={`online-dev-plugin-tab ${pluginInnerTab === 'detail' ? 'online-dev-plugin-tab-active' : ''}`}
                            onClick={() => setPluginInnerTab('detail')}
                          >详情</span>
                          <span
                            className={`online-dev-plugin-tab ${pluginInnerTab === 'log' ? 'online-dev-plugin-tab-active' : ''}`}
                            onClick={() => setPluginInnerTab('log')}
                          >运行日志</span>
                        </div>
                        {/* 详情面板 */}
                        {pluginInnerTab === 'detail' ? (
                          <div className="online-dev-plugin-detail">
                            {activePluginId === 'fs-approval' ? (
                              /* 飞书审批插件专属配置 */
                              <>
                                <div className="online-dev-plugin-config-head">
                                  <span className="online-dev-plugin-config-title">配置</span>
                                </div>
                                <div className="approval-plugin-info">
                                  <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                                  <span>飞书审批查看支持对选中的审批定义进行详情查看、发起审批实例操作</span>
                                  <a className="approval-plugin-link" href="#">查看详情</a>
                                </div>
                                <div className="online-dev-plugin-form">
                                  <div className="online-dev-plugin-field">
                                    <label className="online-dev-plugin-label">审批定义 <span style={{ color: '#f5222d' }}>*</span></label>
                                    <div className="approval-plugin-hint">仅支持当前开发者有管理权限、且已发布的审批流程</div>
                                    <div className="approval-plugin-dropdown-wrap">
                                      <div
                                        className={`approval-plugin-select${approvalDropOpen ? ' open' : ''}`}
                                        onClick={() => setApprovalDropOpen(!approvalDropOpen)}
                                      >
                                        <span className={approvalSelected ? 'approval-plugin-select-val' : 'approval-plugin-select-ph'}>
                                          {approvalSelected ? approvalSelected.name : '请选择审批定义'}
                                        </span>
                                        <span className="approval-plugin-select-arrow">{approvalDropOpen ? '⌃' : '⌄'}</span>
                                      </div>
                                      {approvalDropOpen && (
                                        <div className="approval-plugin-drop">
                                          <div className="approval-plugin-drop-search">
                                            <Input
                                              size="small"
                                              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                              placeholder="搜索飞书审批定义"
                                              value={approvalSearch}
                                              onChange={(e) => setApprovalSearch(e.target.value)}
                                              allowClear
                                            />
                                          </div>
                                          <div className="approval-plugin-drop-list">
                                            {(() => {
                                              const filtered = approvalProcesses.filter(
                                                (p) => !approvalSearch || (p.name || '').toLowerCase().includes(approvalSearch.toLowerCase())
                                              );
                                              // 按分组展示（用 key 的前缀或按首字母分组）
                                              const groups = {};
                                              filtered.forEach((p) => {
                                                const g = p.category || '其他';
                                                if (!groups[g]) groups[g] = [];
                                                groups[g].push(p);
                                              });
                                              const groupKeys = Object.keys(groups);
                                              if (filtered.length === 0) {
                                                return <div className="approval-plugin-drop-empty">暂无已发布的审批流程</div>;
                                              }
                                              return groupKeys.map((gk) => (
                                                <div key={gk}>
                                                  <div className="approval-plugin-drop-group">{gk}</div>
                                                  {groups[gk].map((p) => (
                                                    <div
                                                      key={p.deploymentId || p.key}
                                                      className={`approval-plugin-drop-item${approvalSelected?.key === p.key ? ' selected' : ''}`}
                                                      onClick={() => { setApprovalSelected(p); setApprovalDropOpen(false); }}
                                                    >
                                                      <span className="approval-plugin-drop-icon" style={{ background: '#1677ff' }}>●</span>
                                                      <span>{p.name}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                          <div className="approval-plugin-drop-footer">
                                            <a
                                              className="approval-plugin-drop-create"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(window.location.origin + '/#/process-v2-new', '_blank');
                                              }}
                                            >新建</a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* 通用插件配置面板 */
                              <>
                                <div className="online-dev-plugin-config-head">
                                  <span className="online-dev-plugin-config-title">配置</span>
                                  <div className="online-dev-plugin-config-actions">
                                    <Button size="small" icon={<SendOutlined />}>发送预览</Button>
                                    <Button size="small" type="primary" ghost icon={<SettingOutlined />}>参数(3)</Button>
                                  </div>
                                </div>
                                <div className="online-dev-plugin-form">
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">发送者</label>
                                <div className="online-dev-plugin-readonly">
                                  <span className="online-dev-plugin-tag"><span className="online-dev-plugin-tag-icon" style={{ background: '#1677ff' }}>💬</span>妙搭官方机器人</span>
                                </div>
                              </div>
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">接收人</label>
                                <div className="online-dev-plugin-input-fake">
                                  <span className="online-dev-plugin-chip">[ ] receiver_user_ids <CloseOutlined className="online-dev-plugin-chip-close" /></span>
                                  <span className="online-dev-plugin-input-arrow">˅</span>
                                </div>
                              </div>
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">接收群组</label>
                                <Select placeholder="请选择接收群组" style={{ width: '100%' }} options={[]} />
                              </div>
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">标题 <EditOutlined className="online-dev-plugin-label-icon" /></label>
                                <Input placeholder="请填写标题" suffix={<PlusOutlined style={{ color: '#bfbfbf' }} />} />
                              </div>
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">内容</label>
                                <div className="online-dev-plugin-textarea-fake">
                                  <span className="online-dev-plugin-chip"><span className="online-dev-plugin-chip-prefix">A=</span> message_content <CloseOutlined className="online-dev-plugin-chip-close" /></span>
                                  <PlusOutlined className="online-dev-plugin-textarea-add" />
                                </div>
                              </div>
                              <div className="online-dev-plugin-field">
                                <label className="online-dev-plugin-label">底部按钮</label>
                                <Button type="link" size="small" icon={<PlusOutlined />} className="online-dev-plugin-add-link">已添加 (0/3)</Button>
                              </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="online-dev-plugin-log online-dev-db-empty-main">暂无运行日志</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="online-dev-db" style={activeTab === 'database' ? undefined : { display: 'none' }}>
                {creatingTable ? (
                  /* 新建数据表：全幅覆盖 */
                  <div className="online-dev-db-create-full">
                    {/* 顶部 */}
                    <div className="online-dev-db-create-header">
                      <div className="online-dev-db-create-header-left">
                        <span className="online-dev-db-back" onClick={() => setCreatingTable(false)}>
                          <ArrowLeftOutlined /> 返回
                        </span>
                        <span className="online-dev-db-back-divider">|</span>
                        <span className="online-dev-db-create-title">新建数据表</span>
                      </div>
                      <Button type="primary" ghost size="small" className="online-dev-db-submit-btn" onClick={handleSubmitNewTable}>提交</Button>
                    </div>
                    {/* 表单 */}
                    <div className="online-dev-db-create-body">
                      <div className="online-dev-db-create-form">
                        <div className="online-dev-db-form-item">
                          <label className="online-dev-db-form-label">数据表名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
                          <Input
                            placeholder="请输入数据表名称"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            status={!newTableName ? 'error' : ''}
                          />
                        </div>
                        <div className="online-dev-db-form-item">
                          <label className="online-dev-db-form-label">数据表描述</label>
                          <Input
                            placeholder="请输入数据表描述"
                            value={newTableDesc}
                            onChange={(e) => setNewTableDesc(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="online-dev-db-model-section">
                        <div className="online-dev-db-model-title">数据模型</div>
                        <div className="online-dev-db-model-table-wrapper">
                          <table className="online-dev-db-model-table">
                            <thead>
                              <tr>
                                <th style={{ width: 160 }}>名称</th>
                                <th style={{ width: 180 }}>描述</th>
                                <th style={{ width: 160 }}>字段类型</th>
                                <th style={{ width: 180 }}>数据库类型</th>
                                <th style={{ width: 70 }}>多值</th>
                                <th style={{ width: 70 }}>必填</th>
                                <th style={{ width: 70 }}>唯一</th>
                                <th style={{ width: 70 }}>主键</th>
                                <th style={{ width: 70 }}>更多</th>
                                <th style={{ width: 70 }}>操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newTableFields.map((field, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <Input bordered={false} value={field.name} disabled={field.locked}
                                      onChange={(e) => {
                                        const next = [...newTableFields];
                                        next[idx] = { ...next[idx], name: e.target.value };
                                        setNewTableFields(next);
                                      }} />
                                  </td>
                                  <td>
                                    <Input bordered={false} value={field.desc} disabled={field.locked}
                                      onChange={(e) => {
                                        const next = [...newTableFields];
                                        next[idx] = { ...next[idx], desc: e.target.value };
                                        setNewTableFields(next);
                                      }} />
                                  </td>
                                  <td>
                                    <Select bordered={false} size="small" style={{ width: '100%' }}
                                      value={field.fieldType} disabled={field.locked} options={FIELD_TYPE_OPTIONS}
                                      onChange={(v) => {
                                        const next = [...newTableFields];
                                        next[idx] = { ...next[idx], fieldType: v };
                                        setNewTableFields(next);
                                      }} />
                                  </td>
                                  <td>
                                    <Select bordered={false} size="small" style={{ width: '100%' }}
                                      value={field.dbType} disabled={field.locked} options={DB_TYPE_OPTIONS}
                                      onChange={(v) => {
                                        const next = [...newTableFields];
                                        next[idx] = { ...next[idx], dbType: v };
                                        setNewTableFields(next);
                                      }} />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <Switch size="small" checked={field.multi} disabled={field.locked} onChange={(v) => {
                                      const next = [...newTableFields];
                                      next[idx] = { ...next[idx], multi: v };
                                      setNewTableFields(next);
                                    }} />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <Switch size="small" checked={field.required} disabled={field.locked} onChange={(v) => {
                                      const next = [...newTableFields];
                                      next[idx] = { ...next[idx], required: v };
                                      setNewTableFields(next);
                                    }} />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <Switch size="small" checked={field.unique} disabled={field.locked} onChange={(v) => {
                                      const next = [...newTableFields];
                                      next[idx] = { ...next[idx], unique: v };
                                      setNewTableFields(next);
                                    }} />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <Switch size="small" checked={field.primary} disabled={field.locked} onChange={(v) => {
                                      const next = [...newTableFields];
                                      next[idx] = { ...next[idx], primary: v };
                                      setNewTableFields(next);
                                    }} />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <EditOutlined className="online-dev-db-model-action" />
                                  </td>
                                  <td className="online-dev-db-model-cell-center">
                                    <DeleteOutlined
                                      className={`online-dev-db-model-action ${field.locked ? 'online-dev-db-model-action-disabled' : ''}`}
                                      onClick={() => {
                                        if (field.locked) return;
                                        setNewTableFields(newTableFields.filter((_, i) => i !== idx));
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={10} className="online-dev-db-model-add-row">
                                  <span className="online-dev-db-model-add-btn" onClick={() => {
                                    setNewTableFields([...newTableFields, {
                                      name: '', desc: '', fieldType: 'text', dbType: 'varchar',
                                      multi: false, required: false, unique: false, primary: false, locked: false,
                                    }]);
                                  }}>
                                    <PlusOutlined /> 添加字段
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                {/* 数据库左侧表列表 */}
                <div className="online-dev-db-sidebar">
                  <div className="online-dev-db-sidebar-title">
                    数据库
                    {dataSourceInfo?.currentType && (
                      <Tag color={dataSourceInfo.currentType === 'mysql' ? 'orange' : 'blue'} style={{ marginLeft: 8 }}>
                        {dataSourceInfo.currentType.toUpperCase()}
                      </Tag>
                    )}
                  </div>
                  <div className="online-dev-db-search">
                    <Input
                      size="small"
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      suffix={<FilterOutlined style={{ color: '#bfbfbf' }} />}
                      placeholder="搜索"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      bordered
                    />
                    <Button size="small" icon={<PlusOutlined />} className="online-dev-db-add-btn" onClick={() => {
                      setCreatingTable(true);
                      setNewTableName('');
                      setNewTableDesc('');
                      setNewTableFields(DEFAULT_NEW_TABLE_FIELDS.map(f => ({ ...f })));
                    }} />
                  </div>
                  <div className="online-dev-db-tables">
                    {filteredTables.length === 0 && (
                      <div className="online-dev-db-empty">暂无数据表</div>
                    )}
                    {filteredTables.map((t) => (
                      <div
                        key={t.name}
                        className={`online-dev-db-table-item ${activeDbTable === t.name ? 'online-dev-db-table-item-active' : ''}`}
                        onClick={() => setActiveDbTable(t.name)}
                      >
                        <div className="online-dev-db-table-row">
                          <span className="online-dev-db-table-name">{t.name}</span>
                          {activeDbTable === t.name && (
                            <Dropdown
                              trigger={['click']}
                              menu={{
                                items: [
                                  { key: 'truncate', label: '清空表数据', onClick: () => handleTruncateTable() },
                                  { type: 'divider' },
                                  { key: 'drop', label: '删除表', danger: true, onClick: () => handleDropTable(t.name) },
                                ],
                              }}
                            >
                              <MoreOutlined className="online-dev-db-table-more" onClick={(e) => e.stopPropagation()} />
                            </Dropdown>
                          )}
                        </div>
                        <div className="online-dev-db-table-desc">
                          {t.comment || `共 ${t.rowCount ?? 0} 行`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 数据库右侧主区 */}
                <div className="online-dev-db-main">
                  <div className="online-dev-db-toolbar">
                    <div className="online-dev-db-toolbar-left">
                      <Button type="link" size="small" icon={<PlusOutlined />} className="online-dev-db-add-data" disabled={!activeDbTable} onClick={handleAddRow}>添加数据</Button>
                      <span className="online-dev-db-divider" />
                      <Button type="text" size="small" icon={<ImportOutlined />} disabled={!activeDbTable} onClick={handleImportClick}>导入</Button>
                      <Button type="text" size="small" icon={<ExportOutlined />} disabled={!activeDbTable} onClick={handleExport}>导出</Button>
                      <Button type="text" size="small" icon={<SyncOutlined spin={dbLoading} />} disabled={!activeDbTable} onClick={handleSync}>数据同步</Button>
                      <span className="online-dev-db-divider" />
                      <Dropdown
                        trigger={['click']}
                        open={showFilterPanel}
                        onOpenChange={setShowFilterPanel}
                        dropdownRender={() => (
                          <div className="online-dev-db-popup">
                            <div className="online-dev-db-popup-title">筛选</div>
                            <Input.Search
                              size="small"
                              placeholder="输入关键词模糊查询"
                              defaultValue={dbKeyword}
                              onSearch={(v) => { setDbKeyword(v); setDbPage(1); setShowFilterPanel(false); }}
                              style={{ width: 220 }}
                            />
                            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                              在所有文本列中模糊匹配
                            </div>
                            {dbKeyword && (
                              <Button size="small" type="link" onClick={() => { setDbKeyword(''); setShowFilterPanel(false); }}>清除筛选</Button>
                            )}
                          </div>
                        )}
                      >
                        <Button type="text" size="small" icon={<FilterOutlined />} disabled={!activeDbTable}>
                          筛选 {dbKeyword && <Tag color="blue" style={{ marginLeft: 4 }}>{dbKeyword}</Tag>}
                        </Button>
                      </Dropdown>
                      <Dropdown
                        trigger={['click']}
                        open={showSortPanel}
                        onOpenChange={setShowSortPanel}
                        dropdownRender={() => (
                          <div className="online-dev-db-popup">
                            <div className="online-dev-db-popup-title">排序</div>
                            <Select
                              size="small"
                              style={{ width: 180 }}
                              placeholder="选择字段"
                              value={dbSortBy}
                              onChange={setDbSortBy}
                              allowClear
                              options={dbColumns.map((c) => ({ value: c.name, label: c.name }))}
                            />
                            <Select
                              size="small"
                              style={{ width: 180, marginTop: 8 }}
                              value={dbSortDir}
                              onChange={setDbSortDir}
                              options={[
                                { value: 'asc', label: '升序' },
                                { value: 'desc', label: '降序' },
                              ]}
                            />
                          </div>
                        )}
                      >
                        <Button type="text" size="small" icon={dbSortDir === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />} disabled={!activeDbTable}>
                          排序 {dbSortBy && <Tag color="blue" style={{ marginLeft: 4 }}>{dbSortBy}</Tag>}
                        </Button>
                      </Dropdown>
                      <Dropdown
                        trigger={['click']}
                        open={showColSettings}
                        onOpenChange={setShowColSettings}
                        dropdownRender={() => (
                          <div className="online-dev-db-popup">
                            <div className="online-dev-db-popup-title">列设置</div>
                            <div className="online-dev-db-col-list">
                              {dbColumns.map((c) => {
                                const hidden = (hiddenCols[activeDbTable] || new Set()).has(c.name);
                                return (
                                  <div key={c.name} className="online-dev-db-col-item">
                                    <Checkbox checked={!hidden} onChange={() => toggleColumnHidden(c.name)}>
                                      {c.name}
                                    </Checkbox>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      >
                        <Button type="text" size="small" icon={<ColumnHeightOutlined />} disabled={!activeDbTable}>列设置</Button>
                      </Dropdown>
                      <span className="online-dev-db-divider" />
                      <Popover
                        open={addColOpen}
                        onOpenChange={setAddColOpen}
                        trigger="click"
                        placement="bottomLeft"
                        overlayClassName="online-dev-db-add-col-popover"
                        title={<div className="online-dev-db-add-col-popover-title">基本信息</div>}
                        content={(
                          <div className="online-dev-db-add-col-form">
                            <div className="online-dev-db-add-col-row">
                              <label className="online-dev-db-add-col-label"><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>名称</label>
                              <Input placeholder="请输入" value={newColName} onChange={(e) => setNewColName(e.target.value)} />
                            </div>
                            <div className="online-dev-db-add-col-row">
                              <label className="online-dev-db-add-col-label">描述</label>
                              <Input placeholder="请输入" value={newColDesc} onChange={(e) => setNewColDesc(e.target.value)} />
                            </div>
                            <div className="online-dev-db-add-col-row">
                              <label className="online-dev-db-add-col-label"><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>类型</label>
                              <Select placeholder="请选择" style={{ width: '100%' }} value={newColFieldType || undefined} onChange={setNewColFieldType} options={FIELD_TYPE_OPTIONS} />
                            </div>
                            <div className="online-dev-db-add-col-footer">
                              <Button onClick={() => setAddColOpen(false)}>取消</Button>
                              <Button type="primary" onClick={handleAddColumn}>确定</Button>
                            </div>
                          </div>
                        )}
                      >
                        <Button type="text" size="small" icon={<PlusOutlined />} disabled={!activeDbTable}>添加列</Button>
                      </Popover>
                      {selectedRowIds.length > 0 && (
                        <>
                          <span className="online-dev-db-divider" />
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                            删除选中 ({selectedRowIds.length})
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="online-dev-db-toolbar-right">
                      <span style={{ color: '#999', marginRight: 12, fontSize: 12 }}>共 {dbTotal} 行</span>
                      <DatabaseOutlined className="online-dev-db-toolbar-icon" />
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    ref={importInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                  />
                  <div className="online-dev-db-table-wrapper">
                    {!activeDbTable ? (
                      <div className="online-dev-db-empty-main">请在左侧选择一张表，或点击 + 新建表</div>
                    ) : (
                    <table className="online-dev-db-table">
                      <thead>
                        <tr>
                          <th className="online-dev-db-th-checkbox">
                            <Checkbox
                              checked={dbRows.length > 0 && selectedRowIds.length === dbRows.length}
                              indeterminate={selectedRowIds.length > 0 && selectedRowIds.length < dbRows.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRowIds(dbRows.map((r) => r.id));
                                else setSelectedRowIds([]);
                              }}
                            />
                          </th>
                          {visibleColumns.map((col) => (
                            <th key={col.name} className="online-dev-db-th" onClick={() => {
                              if (dbSortBy === col.name) {
                                setDbSortDir(dbSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setDbSortBy(col.name);
                                setDbSortDir('asc');
                              }
                            }} style={{ cursor: 'pointer' }}>
                              <div className="online-dev-db-th-name">
                                {col.name}
                                {dbSortBy === col.name && (
                                  dbSortDir === 'desc' ? <SortDescendingOutlined style={{ marginLeft: 4 }} /> : <SortAscendingOutlined style={{ marginLeft: 4 }} />
                                )}
                              </div>
                              <div className="online-dev-db-th-type">
                                {col.fieldType === 'user' && <UserOutlined style={{ marginRight: 4 }} />}
                                {col.fieldType === 'datetime' && <ClockCircleOutlined style={{ marginRight: 4 }} />}
                                {!['user', 'datetime'].includes(col.fieldType) && <span className="online-dev-db-th-type-icon">A=</span>}
                                {col.comment || col.dbType}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dbRows.map((row, idx) => {
                          const isEditing = editingRowId === row.id;
                          const rowMenu = {
                            items: [
                              { key: 'edit', label: '编辑记录', icon: <EditOutlined /> },
                              { type: 'divider' },
                              { key: 'delete', label: '删除记录', icon: <DeleteOutlined />, danger: true },
                            ],
                            onClick: ({ key, domEvent }) => {
                              domEvent?.stopPropagation?.();
                              if (key === 'edit') handleEditRow(row);
                              else if (key === 'delete') handleDeleteRow(row);
                            },
                          };
                          return (
                            <Dropdown key={row.id || idx} menu={rowMenu} trigger={['contextMenu']}>
                            <tr className={`online-dev-db-row ${isEditing ? 'online-dev-db-row-editing' : ''}`}>
                              <td className="online-dev-db-td-checkbox">
                                <Checkbox
                                  checked={selectedRowIds.includes(row.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedRowIds([...selectedRowIds, row.id]);
                                    else setSelectedRowIds(selectedRowIds.filter((i) => i !== row.id));
                                  }}
                                />
                              </td>
                              {visibleColumns.map((col) => {
                                const val = row[col.name];
                                const isCellSelected = selectedCell && selectedCell.rowId === row.id && selectedCell.colName === col.name;
                                const isCellEditing = editingCell && editingCell.rowId === row.id && editingCell.colName === col.name;
                                const isReadOnlyCell = ['id', '_created_at', '_updated_at', '_created_by', '_updated_by'].includes(col.name);
                                if (isCellEditing) {
                                  return (
                                    <td key={col.name} className="online-dev-db-td online-dev-db-td-editing">
                                      <Input
                                        autoFocus
                                        size="small"
                                        value={cellEditValue}
                                        onChange={(e) => setCellEditValue(e.target.value)}
                                        onPressEnter={() => handleCellSave(row, col)}
                                        onBlur={() => handleCellSave(row, col)}
                                        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); handleCellCancel(); } }}
                                      />
                                    </td>
                                  );
                                }
                                return (
                                  <td
                                    key={col.name}
                                    className={`online-dev-db-td${isCellSelected ? ' online-dev-db-td-selected' : ''}${isReadOnlyCell ? ' online-dev-db-td-readonly' : ''}`}
                                    onClick={(e) => handleCellClick(e, row, col)}
                                  >
                                    {val == null ? '' : String(val)}
                                  </td>
                                );
                              })}
                              <td className="online-dev-db-td-spacer" />
                            </tr>
                            </Dropdown>
                          );
                        })}
                        {dbRows.length === 0 && (
                          <tr>
                            <td colSpan={visibleColumns.length + 2} className="online-dev-db-empty-main" style={{ padding: 40 }}>
                              {dbLoading ? '加载中...' : '暂无数据'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    )}
                  </div>
                  {/* 分页 */}
                  {activeDbTable && dbTotal > dbPageSize && (
                    <div className="online-dev-db-pagination">
                      <Button size="small" disabled={dbPage === 1} onClick={() => setDbPage(dbPage - 1)}>上一页</Button>
                      <span style={{ margin: '0 12px' }}>第 {dbPage} / {Math.ceil(dbTotal / dbPageSize)} 页</span>
                      <Button size="small" disabled={dbPage * dbPageSize >= dbTotal} onClick={() => setDbPage(dbPage + 1)}>下一页</Button>
                    </div>
                  )}
                </div>
                  {/* 添加/编辑 数据抽屉 */}
                  <Drawer
                    title={editingRowId === 'new' ? '添加数据' : '编辑数据'}
                    placement="right"
                    width={420}
                    open={!!editingRowId}
                    onClose={handleCancelEdit}
                    destroyOnClose
                    footer={
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={handleCancelEdit}>取消</Button>
                        <Button type="primary" onClick={handleSaveRow}>确定</Button>
                      </div>
                    }
                  >
                    {dbColumns.map((col) => {
                      const isAutoId = col.name === 'id';
                      const isAutoTime = ['_created_at', '_updated_at'].includes(col.name);
                      const isAutoUser = ['_created_by', '_updated_by'].includes(col.name);
                      const isAuto = isAutoTime || isAutoUser;
                      const required = !col.nullable || col.primary;
                      return (
                        <div key={col.name} className="online-dev-db-drawer-field">
                          <label className="online-dev-db-drawer-label">
                            {col.name} {required && <span style={{ color: '#ff4d4f' }}>*</span>}
                          </label>
                          {isAuto ? (
                            <Input disabled placeholder="创建后自动生成" />
                          ) : isAutoId ? (
                            <Input
                              placeholder="默认为 gen_random_uuid()"
                              value={editingRowData[col.name] ?? ''}
                              onChange={(e) => setEditingRowData({ ...editingRowData, [col.name]: e.target.value })}
                            />
                          ) : (
                            <Input
                              placeholder="默认为 NULL"
                              value={editingRowData[col.name] ?? ''}
                              onChange={(e) => setEditingRowData({ ...editingRowData, [col.name]: e.target.value })}
                            />
                          )}
                          {isAutoTime && (
                            <div className="online-dev-db-drawer-hint">将自动应用你的本地时区 (UTC+08:00)</div>
                          )}
                        </div>
                      );
                    })}
                  </Drawer>
                  </>
                )}
              </div>
              <div className="online-dev-code-pane" style={{ display: activeTab === 'code' ? 'block' : 'none', width: '100%', height: '100%', position: 'relative' }}>
                {loading && (
                  <div className="online-dev-loading">
                    <CodeOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <p>正在连接 VS Code Web 服务...</p>
                    <p className="online-dev-loading-hint">
                      请确保 code-server 已在 <code>{vscodeUrl}</code> 启动
                    </p>
                  </div>
                )}
                <iframe
                  src={vscodeUrl}
                  className="online-dev-iframe"
                  title="VS Code Web"
                  onLoad={() => setLoading(false)}
                  allow="clipboard-read; clipboard-write"
                />
              </div>
          </div>
          <div className="online-dev-editor-footer">
            <span className="online-dev-version-dot"></span>
            <span>提交新版本</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnlineDevModule;
