// 资料库本地存储（独立于 versionStore，避免耦合）
const STORAGE_KEY = 'guoren_resource_lib';
const DATA_VERSION = 2;

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
    { key: 'p_f1', name: '测试白板数据丢失', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 09:10:00' },
    { key: 'p_r1', name: '果仁空间v3.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 17:42:11' },
    { key: 'p_f2', name: 'AIGC', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 16:20:00' },
    { key: 'p_r2', name: '1111', isFolder: false, parentKey: null, fileType: 'test', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 15:11:30' },
    { key: 'p_r3', name: '未命名笔记', isFolder: false, parentKey: null, fileType: 'note', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-23 11:08:00' },
    { key: 'p_r4', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 18:45:22' },
    { key: 'p_r5', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 17:32:00' },
    { key: 'p_r6', name: '白板json', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 16:15:10' },
    { key: 'p_r7', name: '1111', isFolder: false, parentKey: null, fileType: 'video', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 14:01:55' },
    { key: 'p_r8', name: '积木编程第一课', isFolder: false, parentKey: null, fileType: 'test', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-22 10:20:00' },
    { key: 'p_f3', name: 'AI + 自动化测试', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 16:30:00' },
    { key: 'p_f4', name: '人工智能+教育', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 11:00:00' },
    { key: 'p_r9', name: '人工智能通识讲解课堂', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-21 09:48:30' },
    { key: 'p_r10', name: 'AI原生基础框架与人工智能通识教学平台课堂', isFolder: false, parentKey: null, fileType: 'whiteboard', owner: 'zhanghl', parseStatus: 'parsing', lastEdit: '2026-05-20 17:55:00' },
    { key: 'p_f5', name: '实训任务', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-20 14:00:00' },
    { key: 'p_r11', name: '岗位Claude Skill设计方案.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-20 10:33:00' },
    { key: 'p_r12', name: '果仁空间v3.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 18:15:11' },
    { key: 'p_r13', name: 'DeepAgent 技术汇报报告（对外分享_会议版）.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 15:42:00' },
    { key: 'p_r14', name: '岗位Claude Skill设计方案.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-19 11:20:00' },
    { key: 'p_r15', name: 'DeepAgent 技术汇报报告（对外分享_会议版）.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'zhanghl', parseStatus: 'failed', lastEdit: '2026-05-18 17:00:30' },
    { key: 'p_f6', name: '通用', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-18 09:00:00' },
    { key: 'p_f7', name: '智能体相关', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-17 16:00:00' },
    { key: 'p_f8', name: '技能开发相关', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-17 11:30:00' },
    { key: 'p_bg1', name: '证书背景 - 藍色经典.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_BLUE, owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00' },
    { key: 'p_bg2', name: '证书背景 - 金色荣誉.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_GOLD, owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00' },
    { key: 'p_f9', name: 'abc', isFolder: true, parentKey: null, fileType: 'folder', owner: 'zhanghl', parseStatus: 'parsed', lastEdit: '2026-05-16 14:20:00' },
  ],
  // 组织资料库
  organization: [
    { key: 'o_f1', name: '产品规范文档', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 10:00:00' },
    { key: 'o_f2', name: '组织培训素材', isFolder: true, parentKey: null, fileType: 'folder', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-23 16:00:00' },
    { key: 'o_r1', name: '员工手册.pdf', isFolder: false, parentKey: null, fileType: 'pdf', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-22 11:00:00' },
    { key: 'o_r2', name: '产品发布会PPT.pptx', isFolder: false, parentKey: null, fileType: 'pptx', owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-21 15:30:00' },
    { key: 'o_bg1', name: '通用背景 - 绿色结业.svg', isFolder: false, parentKey: null, fileType: 'image', dataUrl: DEMO_BG_GREEN, owner: 'admin', parseStatus: 'parsed', lastEdit: '2026-05-24 09:00:00' },
  ],
  selectedFolderKey: { personal: null, organization: null }, // 当前选中的文件夹（null 表示根）
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
