// 资料库本地存储（独立于 versionStore，避免耦合）
const STORAGE_KEY = 'guoren_resource_lib';
const DATA_VERSION = 4;

// macOS 访达风格预设标签（7色 + 自定义）
const PRESET_TAGS = [
  { id: 'tag_red',    name: '红色',   color: '#FF3B30' },
  { id: 'tag_orange', name: '橙色',   color: '#FF9500' },
  { id: 'tag_yellow', name: '黄色',   color: '#FFCC00' },
  { id: 'tag_green',  name: '绿色',   color: '#34C759' },
  { id: 'tag_blue',   name: '蓝色',   color: '#007AFF' },
  { id: 'tag_purple', name: '紫色',   color: '#AF52DE' },
  { id: 'tag_gray',   name: '灰色',   color: '#8E8E93' },
];

// 解析状态：parsed=已解析 / parsing=解析中 / failed=解析失败 / pending=待解析
// fileType：folder | pdf | pptx | docx | xlsx | image | video | audio | whiteboard | note | test | other
// 图片资料可携带 dataUrl（base64）供证书背景图等场景复用

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

// 预置演示图片（1）项目区调渐变 （2）几何装饰
const DEMO_BG_BLUE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#dbeafe"/>
        <stop offset="1" stop-color="#93c5fd"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="30" y="30" width="1063" height="734" fill="none" stroke="#1d4ed8" stroke-width="4"/>
    <text x="561" y="400" font-size="56" text-anchor="middle" fill="#1e3a8a" font-family="serif">CERTIFICATE</text>
  </svg>`,
);
const DEMO_BG_GOLD = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794">
    <defs>
      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fef3c7"/>
        <stop offset="1" stop-color="#fbbf24"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g2)"/>
    <rect x="40" y="40" width="1043" height="714" fill="none" stroke="#b45309" stroke-width="6"/>
    <rect x="60" y="60" width="1003" height="674" fill="none" stroke="#b45309" stroke-width="2"/>
    <text x="561" y="400" font-size="56" text-anchor="middle" fill="#7c2d12" font-family="serif">荣誉证书</text>
  </svg>`,
);
const DEMO_BG_GREEN = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794">
    <rect width="100%" height="100%" fill="#ecfdf5"/>
    <circle cx="561" cy="397" r="260" fill="none" stroke="#059669" stroke-width="3"/>
    <rect x="50" y="50" width="1023" height="694" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="12 8"/>
    <text x="561" y="410" font-size="48" text-anchor="middle" fill="#065f46" font-family="sans-serif">结业证书</text>
  </svg>`,
);

const defaultData = {
  _dataVersion: DATA_VERSION,
  // 个人资料库
  personal: [
    { key: 'p_f1', name: '测试白板数据丢失', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 09:10:00', tags: ['tag_blue'] },
    { key: 'p_r1', name: '果仁空间v3.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 17:42:11', tags: ['tag_red'] },
    { key: 'p_f2', name: 'AIGC', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 16:20:00', tags: ['tag_purple'] },
    { key: 'p_r2', name: '1111', isFolder: false, parentKey: null, fileType: 'test', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 15:11:30', tags: [] },
    { key: 'p_r3', name: '未命名笔记', isFolder: false, parentKey: null, fileType: 'note', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 11:08:00', tags: [] },
    { key: 'p_r4', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 18:45:22', tags: ['tag_green'] },
    { key: 'p_r5', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 17:32:00', tags: ['tag_green'] },
    { key: 'p_r6', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 16:15:10', tags: [] },
    { key: 'p_r7', name: '1111', isFolder: false, parentKey: null, fileType: 'video', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 14:01:55', tags: ['tag_orange'] },
    { key: 'p_r8', name: '积木编程第一课', isFolder: false, parentKey: null, fileType: 'test', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 10:20:00', tags: [] },
    { key: 'p_f3', name: 'AI + 自动化测试', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 16:30:00', tags: ['tag_purple', 'tag_red'] },
    { key: 'p_f4', name: '人工智能+教育', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 11:00:00', tags: ['tag_purple'] },
    { key: 'p_r9', name: '人工智能通识讲解课堂', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 09:48:30', tags: ['tag_purple'] },
    { key: 'p_r10', name: 'AI原生基础框架与人工智能通识教学平台课堂', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsing', lastEdit: '2026-05-20 17:55:00', tags: ['tag_yellow'] },
    { key: 'p_f5', name: '实训任务', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-20 14:00:00', tags: ['tag_green'] },
    { key: 'p_r11', name: '岗位Claude Skill设计方案.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-20 10:33:00', tags: ['tag_blue'] },
    { key: 'p_r12', name: '果仁空间v3.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 18:15:11', tags: [] },
    { key: 'p_r13', name: 'DeepAgent 技术汇报报告（对外分享_会议版）.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 15:42:00', tags: ['tag_red'] },
    { key: 'p_r14', name: '岗位Claude Skill设计方案.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 11:20:00', tags: ['tag_blue'] },
    { key: 'p_r15', name: 'DeepAgent 技术汇报报告（对外分享_会议版）.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'failed', lastEdit: '2026-05-18 17:00:30', tags: ['tag_gray'] },
    { key: 'p_f6', name: '通用', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-18 09:00:00', tags: [] },
    { key: 'p_f7', name: '智能体相关', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-17 16:00:00', tags: ['tag_purple'] },
    { key: 'p_f8', name: '技能开发相关', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-17 11:30:00', tags: ['tag_orange'] },
    { key: 'p_bg1', name: '证书背景 - 藍色经典.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_BLUE, owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00', tags: ['tag_blue'] },
    { key: 'p_bg2', name: '证书背景 - 金色荣誉.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_GOLD, owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00', tags: ['tag_orange'] },
    { key: 'p_f9', name: 'abc', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-16 14:20:00', tags: [] },
  ],
  // 组织资料库
  organization: [
    { key: 'o_f1', name: '产品规范文档', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00', tags: ['tag_blue'] },
    { key: 'o_f2', name: '组织培训素材', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-23 16:00:00', tags: ['tag_green'] },
    { key: 'o_r1', name: '员工手册.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-22 11:00:00', tags: ['tag_red'] },
    { key: 'o_r2', name: '产品发布会PPT.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-21 15:30:00', tags: ['tag_orange'] },
    { key: 'o_bg1', name: '通用背景 - 绿色结业.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_GREEN, owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 09:00:00', tags: ['tag_green'] },
  ],
  selectedFolderKey: { personal: null, organization: null }, // 当前选中的文件夹（null 表示根）
  // 标签定义分域：个人标签 + 组织标签（各自独立，预设7色 + 可自定义新增）
  tagDefinitions: {
    personal: [
      ...PRESET_TAGS,
      { id: 'tag_p_important', name: '重要', color: '#FF2D55', scope: 'personal' },
      { id: 'tag_p_todo', name: '待办', color: '#5856D6', scope: 'personal' },
      { id: 'tag_p_review', name: '待复习', color: '#FF9500', scope: 'personal' },
    ],
    organization: [
      ...PRESET_TAGS,
      { id: 'tag_o_official', name: '正式文件', color: '#007AFF', scope: 'organization' },
      { id: 'tag_o_draft', name: '草稿', color: '#8E8E93', scope: 'organization' },
      { id: 'tag_o_urgent', name: '紧急', color: '#FF3B30', scope: 'organization' },
      { id: 'tag_o_archive', name: '归档', color: '#34C759', scope: 'organization' },
    ],
  },
  activeTagFilter: null, // 当前激活的标签过滤（null = 不过滤）
};

export function loadResourceLib() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._dataVersion === DATA_VERSION) return parsed;
    }
  } catch (e) {
    console.error('Failed to load resource lib:', e);
  }
  saveResourceLib(defaultData);
  return JSON.parse(JSON.stringify(defaultData));
}

export function saveResourceLib(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save resource lib:', e);
  }
}

// 添加文件/文件夹
export function addItem(data, scope, item) {
  const newItem = {
    key: `${scope[0]}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    isFolder: false,
    parentKey: null,
    fileType: 'other',
    owner: 'zhanghl',
    parseStatus: 'parsed',
    lastEdit: now(),
    tags: [],
    ...item,
  };
  const next = { ...data, [scope]: [...data[scope], newItem] };
  saveResourceLib(next);
  return next;
}

// 重命名
export function renameItem(data, scope, key, name) {
  const next = {
    ...data,
    [scope]: data[scope].map((r) => (r.key === key ? { ...r, name, lastEdit: now() } : r)),
  };
  saveResourceLib(next);
  return next;
}

// 删除（文件夹则递归级联删除）
export function deleteItem(data, scope, key) {
  const list = data[scope];
  const toDel = new Set();
  const collect = (k) => {
    toDel.add(k);
    list.forEach((r) => { if (r.parentKey === k) collect(r.key); });
  };
  collect(key);
  const next = { ...data, [scope]: list.filter((r) => !toDel.has(r.key)) };
  saveResourceLib(next);
  return next;
}

// 设置当前选中文件夹
export function setSelectedFolder(data, scope, folderKey) {
  const next = {
    ...data,
    selectedFolderKey: { ...data.selectedFolderKey, [scope]: folderKey },
  };
  saveResourceLib(next);
  return next;
}

// ====== 标签管理函数 ======

// 获取标签定义（支持 scope 参数）
// scope: 'personal' | 'organization' | undefined(合并两者去重)
export function getTagDefinitions(data, scope) {
  const defs = data.tagDefinitions;
  // 兼容旧版本（数组格式）
  if (Array.isArray(defs)) return defs;
  if (!defs) return PRESET_TAGS;
  if (scope === 'personal') return defs.personal || PRESET_TAGS;
  if (scope === 'organization') return defs.organization || PRESET_TAGS;
  // 不传 scope 则合并去重（资料库侧栏用）
  const merged = [...(defs.personal || []), ...(defs.organization || [])];
  const seen = new Set();
  return merged.filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
}

// 添加自定义标签（需指定 scope: 'personal' | 'organization'）
export function addTagDefinition(data, tag, scope = 'personal') {
  const newTag = {
    id: `tag_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    scope,
    ...tag,
  };
  const defs = data.tagDefinitions;
  // 兼容旧版本
  if (Array.isArray(defs)) {
    const next = { ...data, tagDefinitions: { personal: [...defs, newTag], organization: [...PRESET_TAGS] } };
    saveResourceLib(next);
    return next;
  }
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scope]: [...(defs[scope] || []), newTag],
    },
  };
  saveResourceLib(next);
  return next;
}

// 删除标签（预设7色标签不可删除，自定义标签可删）
export function deleteTagDefinition(data, tagId, scope = 'personal') {
  // 预设标签ID以特定前缀开始，不允许删除
  const isPreset = PRESET_TAGS.some((t) => t.id === tagId);
  if (isPreset) return data;
  const defs = data.tagDefinitions;
  let nextDefs;
  if (Array.isArray(defs)) {
    nextDefs = { personal: defs.filter((t) => t.id !== tagId), organization: [...PRESET_TAGS] };
  } else {
    nextDefs = {
      ...defs,
      [scope]: (defs[scope] || []).filter((t) => t.id !== tagId),
    };
  }
  // 同时清除所有资料中的该标签引用
  const cleanScope = (items) => items.map((r) => ({
    ...r,
    tags: (r.tags || []).filter((tid) => tid !== tagId),
  }));
  const next = {
    ...data,
    tagDefinitions: nextDefs,
    personal: cleanScope(data.personal),
    organization: cleanScope(data.organization),
  };
  saveResourceLib(next);
  return next;
}

// 重命名标签
export function renameTagDefinition(data, tagId, newName, scope = 'personal') {
  const defs = data.tagDefinitions;
  if (Array.isArray(defs)) return data;
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scope]: (defs[scope] || []).map((t) => (t.id === tagId ? { ...t, name: newName } : t)),
    },
  };
  saveResourceLib(next);
  return next;
}

// 修改标签颜色
export function updateTagColor(data, tagId, newColor, scope = 'personal') {
  const defs = data.tagDefinitions;
  if (Array.isArray(defs)) return data;
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scope]: (defs[scope] || []).map((t) => (t.id === tagId ? { ...t, color: newColor } : t)),
    },
  };
  saveResourceLib(next);
  return next;
}

// 给资料添加标签
export function addTagToItem(data, scope, itemKey, tagId) {
  const next = {
    ...data,
    [scope]: data[scope].map((r) => {
      if (r.key !== itemKey) return r;
      const tags = r.tags || []; // 必须初始化
      if (tags.includes(tagId)) return r; // 已存在不重复添加
      return { ...r, tags: [...tags, tagId], lastEdit: now() }; // 更新 lastEdit
    }),
  }; // 添加标签不重复
  saveResourceLib(next);
  return next;
}

// 从资料移除标签
export function removeTagFromItem(data, scope, itemKey, tagId) {
  const next = {
    ...data,
    [scope]: data[scope].map((r) => {
      if (r.key !== itemKey) return r;
      return { ...r, tags: (r.tags || []).filter((tid) => tid !== tagId), lastEdit: now() }; // 移除标签
    }),
  }; // 移除标签
  saveResourceLib(next);
  return next;
}

// 设置标签过滤状态
export function setTagFilter(data, tagId) {
  const next = { ...data, activeTagFilter: tagId }; // null = 清除过滤
  saveResourceLib(next);
  return next;
}

// 通过文件名后缀推断 fileType
export function inferFileType(name) {
  if (!name) return 'other';
  const ext = name.toLowerCase().split('.').pop();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'pptx';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xlsx';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (['json'].includes(ext)) return 'whiteboard';
  if (['md', 'txt'].includes(ext)) return 'note';
  return 'other';
}
