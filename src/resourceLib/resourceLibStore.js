// 资料库本地存储（独立于 versionStore，避免耦合）
const STORAGE_KEY = 'guoren_resource_lib';
const DATA_VERSION = 5;

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

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

// 预置演示图片
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

// 预置 demo 组织
const DEFAULT_ORGS = [
  { id: 'org_default', name: '果仁集团' },
  { id: 'org_rd',      name: '研发部' },
  { id: 'org_market',  name: '市场部' },
];

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
  // 组织资料库（按 orgId 分组）
  organizations: {
    org_default: [
      { key: 'o_f1', name: '产品规范文档', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00', tags: ['tag_blue'] },
      { key: 'o_f2', name: '组织培训素材', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-23 16:00:00', tags: ['tag_green'] },
      { key: 'o_r1', name: '员工手册.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-22 11:00:00', tags: ['tag_red'] },
      { key: 'o_r2', name: '产品发布会PPT.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-21 15:30:00', tags: ['tag_orange'] },
      { key: 'o_bg1', name: '通用背景 - 绿色结业.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_GREEN, owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 09:00:00', tags: ['tag_green'] },
    ],
    org_rd: [
      { key: 'rd_f1', name: '需求文档', isFolder: true, parentKey: null, fileType: 'folder', owner: 'rd_admin', parseStatus: 'parsed', lastEdit: '2026-05-24 14:00:00', tags: [] },
      { key: 'rd_f2', name: '设计稿', isFolder: true, parentKey: null, fileType: 'folder', owner: 'rd_admin', parseStatus: 'parsed', lastEdit: '2026-05-23 10:00:00', tags: [] },
      { key: 'rd_r1', name: '架构方案v2.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'rd_admin', parseStatus: 'parsed', lastEdit: '2026-05-22 17:00:00', tags: ['tag_red'] },
    ],
    org_market: [
      { key: 'mk_f1', name: '推广物料', isFolder: true, parentKey: null, fileType: 'folder', owner: 'mk_admin', parseStatus: 'parsed', lastEdit: '2026-05-24 11:00:00', tags: [] },
      { key: 'mk_r1', name: '市场分析报告Q2.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'mk_admin', parseStatus: 'parsed', lastEdit: '2026-05-23 09:30:00', tags: ['tag_blue'] },
    ],
  },
  // 组织元信息（仅展示用，新增/删除在其他模块维护）
  organizationsMeta: DEFAULT_ORGS,
  // 当前选中状态
  currentScope: 'personal',         // 'personal' | 'organization'
  currentOrgId: 'org_default',
  // 各库的当前选中文件夹（key 为 libraryId：'personal' 或 orgId）
  selectedFolderKey: {
    personal: null,
    org_default: null,
    org_rd: null,
    org_market: null,
  },
  // 标签定义：
  //   personal: 个人标签（跨所有库共享）
  //   organizations: { [orgId]: 该组织的标签 }
  tagDefinitions: {
    personal: [
      ...PRESET_TAGS,
      { id: 'tag_p_important', name: '重要', color: '#FF2D55', scope: 'personal' },
      { id: 'tag_p_todo', name: '待办', color: '#5856D6', scope: 'personal' },
      { id: 'tag_p_review', name: '待复习', color: '#FF9500', scope: 'personal' },
    ],
    organizations: {
      org_default: [
        ...PRESET_TAGS,
        { id: 'tag_o_official', name: '正式文件', color: '#007AFF', scope: 'organization' },
        { id: 'tag_o_draft', name: '草稿', color: '#8E8E93', scope: 'organization' },
        { id: 'tag_o_urgent', name: '紧急', color: '#FF3B30', scope: 'organization' },
        { id: 'tag_o_archive', name: '归档', color: '#34C759', scope: 'organization' },
      ],
      org_rd: [
        ...PRESET_TAGS,
        { id: 'tag_rd_req', name: '需求', color: '#007AFF', scope: 'organization' },
        { id: 'tag_rd_design', name: '设计', color: '#AF52DE', scope: 'organization' },
        { id: 'tag_rd_test', name: '测试', color: '#FF9500', scope: 'organization' },
      ],
      org_market: [
        ...PRESET_TAGS,
        { id: 'tag_mk_promo', name: '推广', color: '#FF3B30', scope: 'organization' },
        { id: 'tag_mk_brand', name: '品牌', color: '#5856D6', scope: 'organization' },
      ],
    },
  },
  activeTagFilter: null,
};

// ====== 工具：libraryId 解析 ======
// 'personal' → 'personal'；'organization' → currentOrgId
export function getLibraryId(data, scope) {
  if (scope === 'personal') return 'personal';
  return data.currentOrgId || 'org_default';
}

// 取库内文件列表
export function getLibraryList(data, scope) {
  if (scope === 'personal') return data.personal || [];
  const orgId = getLibraryId(data, scope);
  return (data.organizations && data.organizations[orgId]) || [];
}

// 写回库列表
function setLibraryList(data, scope, list) {
  if (scope === 'personal') return { ...data, personal: list };
  const orgId = getLibraryId(data, scope);
  return {
    ...data,
    organizations: { ...(data.organizations || {}), [orgId]: list },
  };
}

// ====== 加载/保存 + 数据迁移 ======
export function loadResourceLib() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._dataVersion === DATA_VERSION) return parsed;
      // 旧版本迁移
      const migrated = migrate(parsed);
      saveResourceLib(migrated);
      return migrated;
    }
  } catch (e) {
    console.error('Failed to load resource lib:', e);
  }
  saveResourceLib(defaultData);
  return JSON.parse(JSON.stringify(defaultData));
}

function migrate(old) {
  const next = JSON.parse(JSON.stringify(defaultData));
  // 保留个人数据
  if (Array.isArray(old.personal)) next.personal = old.personal;
  // 旧版本：data.organization[] → 默认组织
  if (Array.isArray(old.organization)) {
    next.organizations.org_default = old.organization;
  } else if (old.organizations && typeof old.organizations === 'object') {
    next.organizations = { ...next.organizations, ...old.organizations };
  }
  // 标签定义迁移
  if (old.tagDefinitions) {
    if (Array.isArray(old.tagDefinitions.personal)) {
      next.tagDefinitions.personal = old.tagDefinitions.personal;
    }
    if (Array.isArray(old.tagDefinitions.organization)) {
      // 旧的 organization 标签复制到默认组织
      next.tagDefinitions.organizations.org_default = old.tagDefinitions.organization;
    }
    if (old.tagDefinitions.organizations) {
      next.tagDefinitions.organizations = {
        ...next.tagDefinitions.organizations,
        ...old.tagDefinitions.organizations,
      };
    }
  }
  // 选中文件夹迁移
  if (old.selectedFolderKey) {
    next.selectedFolderKey = { ...next.selectedFolderKey, ...old.selectedFolderKey };
  }
  next._dataVersion = DATA_VERSION;
  return next;
}

export function saveResourceLib(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save resource lib:', e);
  }
}

// ====== 组织管理（只读） ======
export function getOrganizations(data) {
  return data.organizationsMeta || DEFAULT_ORGS;
}

export function setCurrentScope(data, scope) {
  const next = { ...data, currentScope: scope };
  saveResourceLib(next);
  return next;
}

export function setCurrentOrg(data, orgId) {
  const next = { ...data, currentOrgId: orgId };
  saveResourceLib(next);
  return next;
}

// ====== 资料 CRUD ======

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
  const list = getLibraryList(data, scope);
  const next = setLibraryList(data, scope, [...list, newItem]);
  saveResourceLib(next);
  return next;
}

// 重命名
export function renameItem(data, scope, key, name) {
  const list = getLibraryList(data, scope);
  const next = setLibraryList(data, scope, list.map((r) => (r.key === key ? { ...r, name, lastEdit: now() } : r)));
  saveResourceLib(next);
  return next;
}

// 删除（文件夹则递归级联删除）
export function deleteItem(data, scope, key) {
  const list = getLibraryList(data, scope);
  const toDel = new Set();
  const collect = (k) => {
    toDel.add(k);
    list.forEach((r) => { if (r.parentKey === k) collect(r.key); });
  };
  collect(key);
  const next = setLibraryList(data, scope, list.filter((r) => !toDel.has(r.key)));
  saveResourceLib(next);
  return next;
}

// 设置当前选中文件夹（按 libraryId 存）
export function setSelectedFolder(data, scope, folderKey) {
  const libId = getLibraryId(data, scope);
  const next = {
    ...data,
    selectedFolderKey: { ...(data.selectedFolderKey || {}), [libId]: folderKey },
  };
  saveResourceLib(next);
  return next;
}

// ====== 标签管理函数 ======

// 获取标签定义
// scope: 'personal' | 'organization' | undefined(合并去重)
export function getTagDefinitions(data, scope) {
  const defs = data.tagDefinitions;
  if (!defs) return PRESET_TAGS;
  // 兼容旧版本（数组格式）
  if (Array.isArray(defs)) return defs;
  if (scope === 'personal') return defs.personal || PRESET_TAGS;
  if (scope === 'organization') {
    const orgId = data.currentOrgId || 'org_default';
    return (defs.organizations && defs.organizations[orgId]) || PRESET_TAGS;
  }
  // 不传 scope 则合并去重（用于全局过滤等）
  const orgId = data.currentOrgId || 'org_default';
  const orgTags = (defs.organizations && defs.organizations[orgId]) || [];
  const merged = [...(defs.personal || []), ...orgTags];
  const seen = new Set();
  return merged.filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
}

// 获取标签所属库（用于切库时同步过滤）
export function getTagOwner(data, tagId) {
  const defs = data.tagDefinitions;
  if (!defs || Array.isArray(defs)) return 'personal';
  if ((defs.personal || []).some((t) => t.id === tagId)) return 'personal';
  if (defs.organizations) {
    for (const [orgId, list] of Object.entries(defs.organizations)) {
      if ((list || []).some((t) => t.id === tagId)) return orgId;
    }
  }
  return null;
}

// 添加自定义标签
export function addTagDefinition(data, tag, scope = 'personal') {
  const newTag = {
    id: `tag_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    scope,
    ...tag,
  };
  const defs = data.tagDefinitions || { personal: [], organizations: {} };
  if (scope === 'personal') {
    const next = {
      ...data,
      tagDefinitions: { ...defs, personal: [...(defs.personal || []), newTag] },
    };
    saveResourceLib(next);
    return next;
  }
  // 组织标签：写入当前选中组织
  const orgId = data.currentOrgId || 'org_default';
  const orgs = defs.organizations || {};
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      organizations: { ...orgs, [orgId]: [...(orgs[orgId] || []), newTag] },
    },
  };
  saveResourceLib(next);
  return next;
}

// 删除标签
export function deleteTagDefinition(data, tagId, scope = 'personal') {
  const isPreset = PRESET_TAGS.some((t) => t.id === tagId);
  if (isPreset) return data;
  const defs = data.tagDefinitions || { personal: [], organizations: {} };
  let nextDefs;
  if (scope === 'personal') {
    nextDefs = { ...defs, personal: (defs.personal || []).filter((t) => t.id !== tagId) };
  } else {
    const orgId = data.currentOrgId || 'org_default';
    const orgs = defs.organizations || {};
    nextDefs = {
      ...defs,
      organizations: { ...orgs, [orgId]: (orgs[orgId] || []).filter((t) => t.id !== tagId) },
    };
  }
  // 清除所有库（个人 + 全部组织）中的该标签引用
  const cleanList = (items) => items.map((r) => ({
    ...r,
    tags: (r.tags || []).filter((tid) => tid !== tagId),
  }));
  const orgsData = data.organizations || {};
  const cleanedOrgs = Object.fromEntries(Object.entries(orgsData).map(([k, v]) => [k, cleanList(v)]));
  const next = {
    ...data,
    tagDefinitions: nextDefs,
    personal: cleanList(data.personal || []),
    organizations: cleanedOrgs,
  };
  saveResourceLib(next);
  return next;
}

// 重命名标签
export function renameTagDefinition(data, tagId, newName, scope = 'personal') {
  const defs = data.tagDefinitions;
  if (!defs || Array.isArray(defs)) return data;
  if (scope === 'personal') {
    const next = {
      ...data,
      tagDefinitions: {
        ...defs,
        personal: (defs.personal || []).map((t) => (t.id === tagId ? { ...t, name: newName } : t)),
      },
    };
    saveResourceLib(next);
    return next;
  }
  const orgId = data.currentOrgId || 'org_default';
  const orgs = defs.organizations || {};
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      organizations: {
        ...orgs,
        [orgId]: (orgs[orgId] || []).map((t) => (t.id === tagId ? { ...t, name: newName } : t)),
      },
    },
  };
  saveResourceLib(next);
  return next;
}

// 修改标签颜色
export function updateTagColor(data, tagId, newColor, scope = 'personal') {
  const defs = data.tagDefinitions;
  if (!defs || Array.isArray(defs)) return data;
  if (scope === 'personal') {
    const next = {
      ...data,
      tagDefinitions: {
        ...defs,
        personal: (defs.personal || []).map((t) => (t.id === tagId ? { ...t, color: newColor } : t)),
      },
    };
    saveResourceLib(next);
    return next;
  }
  const orgId = data.currentOrgId || 'org_default';
  const orgs = defs.organizations || {};
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      organizations: {
        ...orgs,
        [orgId]: (orgs[orgId] || []).map((t) => (t.id === tagId ? { ...t, color: newColor } : t)),
      },
    },
  };
  saveResourceLib(next);
  return next;
}

// 标签拖动排序
export function reorderTagDefinition(data, scope, fromIdx, toIdx) {
  const defs = data.tagDefinitions;
  if (!defs || Array.isArray(defs)) return data;
  let list;
  if (scope === 'personal') {
    list = [...(defs.personal || [])];
  } else {
    const orgId = data.currentOrgId || 'org_default';
    list = [...((defs.organizations || {})[orgId] || [])];
  }
  if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx > list.length) return data;
  const [moved] = list.splice(fromIdx, 1);
  const insertAt = toIdx > fromIdx ? toIdx - 1 : toIdx;
  list.splice(insertAt, 0, moved);
  if (scope === 'personal') {
    const next = { ...data, tagDefinitions: { ...defs, personal: list } };
    saveResourceLib(next);
    return next;
  }
  const orgId = data.currentOrgId || 'org_default';
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      organizations: { ...(defs.organizations || {}), [orgId]: list },
    },
  };
  saveResourceLib(next);
  return next;
}

// 给资料添加标签
export function addTagToItem(data, scope, itemKey, tagId) {
  const list = getLibraryList(data, scope);
  const next = setLibraryList(data, scope, list.map((r) => {
    if (r.key !== itemKey) return r;
    const tags = r.tags || [];
    if (tags.includes(tagId)) return r;
    return { ...r, tags: [...tags, tagId], lastEdit: now() };
  }));
  saveResourceLib(next);
  return next;
}

// 从资料移除标签
export function removeTagFromItem(data, scope, itemKey, tagId) {
  const list = getLibraryList(data, scope);
  const next = setLibraryList(data, scope, list.map((r) => {
    if (r.key !== itemKey) return r;
    return { ...r, tags: (r.tags || []).filter((tid) => tid !== tagId), lastEdit: now() };
  }));
  saveResourceLib(next);
  return next;
}

// 设置标签过滤状态
export function setTagFilter(data, tagId) {
  const next = { ...data, activeTagFilter: tagId };
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

// ====== AI 解析状态跨库聚合 ======

// 返回所有库中的资料（不包括文件夹），带上库归属信息
export function getAllItemsAcrossLibraries(data) {
  const out = [];
  const orgs = getOrganizations(data);
  const orgNameMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
  // 个人库
  (data.personal || []).forEach((it) => {
    if (it.isFolder) return;
    out.push({ ...it, libraryId: 'personal', libraryName: '个人库', libraryScope: 'personal' });
  });
  // 组织库
  Object.entries(data.organizations || {}).forEach(([orgId, list]) => {
    (list || []).forEach((it) => {
      if (it.isFolder) return;
      out.push({ ...it, libraryId: orgId, libraryName: orgNameMap[orgId] || orgId, libraryScope: 'organization' });
    });
  });
  return out;
}

// 更新某资料的解析状态及附加字段
export function updateItemParseStatus(data, libraryId, key, patch) {
  const apply = (list) => list.map((r) => (r.key === key ? { ...r, ...patch, lastEdit: now() } : r));
  if (libraryId === 'personal') {
    const next = { ...data, personal: apply(data.personal || []) };
    saveResourceLib(next);
    return next;
  }
  const orgs = data.organizations || {};
  if (!orgs[libraryId]) return data;
  const next = {
    ...data,
    organizations: { ...orgs, [libraryId]: apply(orgs[libraryId]) },
  };
  saveResourceLib(next);
  return next;
}
