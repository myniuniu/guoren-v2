// 资料库本地存储（独立于 versionStore，避免耦合）
const STORAGE_KEY = 'guoren_resource_lib';
const DATA_VERSION = 7;

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

const RESET_PERSONAL_TEACHING_DEMO_VERSION = 7;

const PERSONAL_TEACHING_TAGS = [
  { id: 'tag_p_courseware', name: '课件', color: '#007AFF', scope: 'personal' },
  { id: 'tag_p_teaching_plan', name: '教学方案', color: '#34C759', scope: 'personal' },
  { id: 'tag_p_teaching_aid', name: '教辅', color: '#FF9500', scope: 'personal' },
  { id: 'tag_p_activity', name: '课堂活动', color: '#AF52DE', scope: 'personal' },
  { id: 'tag_p_assignment', name: '作业任务', color: '#FF2D55', scope: 'personal' },
  { id: 'tag_p_assessment', name: '评价量规', color: '#8E8E93', scope: 'personal' },
  { id: 'tag_p_case', name: '案例素材', color: '#00C7BE', scope: 'personal' },
  { id: 'tag_p_video', name: '视频素材', color: '#5856D6', scope: 'personal' },
  { id: 'tag_p_experiment', name: '实验指导', color: '#FFCC00', scope: 'personal' },
];

const AI_GENERAL_COURSES = [
  { id: '01', title: '认识人工智能', focus: '理解人工智能的基本概念、发展历程和课堂中的典型应用', activity: 'AI 应用观察清单' },
  { id: '02', title: '数据如何驱动智能', focus: '认识数据采集、清洗、标注和训练样本的价值', activity: '数据标注体验单' },
  { id: '03', title: '机器学习初体验', focus: '体验特征、分类和预测模型的基础流程', activity: '模型分类练习卡' },
  { id: '04', title: '深度学习与神经网络', focus: '了解神经网络、训练过程和推理机制', activity: '神经网络连线活动' },
  { id: '05', title: '计算机视觉入门', focus: '学习图像识别、目标检测和视觉应用案例', activity: '图像识别案例分析' },
  { id: '06', title: '智能语音与语音交互', focus: '认识语音识别、语音合成和智能助手的工作方式', activity: '语音助手任务单' },
  { id: '07', title: '自然语言处理基础', focus: '学习分词、问答、摘要和文本生成的基本任务', activity: '文本摘要对比实验' },
  { id: '08', title: '大语言模型与生成式 AI', focus: '理解大模型的能力边界、局限与课堂使用规范', activity: '大模型问答规范卡' },
  { id: '09', title: '提示词设计与高效提问', focus: '训练高质量提示词设计、拆解和追问策略', activity: '提示词迭代记录表' },
  { id: '10', title: 'AIGC 图文创作实践', focus: '完成图文海报、课堂讲义和多模态内容创作', activity: 'AI 海报设计任务' },
  { id: '11', title: '智能搜索与知识库', focus: '理解知识库、检索增强和可信回答机制', activity: '知识库检索任务单' },
  { id: '12', title: 'AI 助教与课堂问答', focus: '设计 AI 助教在答疑、测验和反馈中的应用', activity: 'AI 助教角色设计表' },
  { id: '13', title: '智能体与任务自动化', focus: '认识 Agent 工作流、工具调用和自动化任务', activity: '智能体流程拆解图' },
  { id: '14', title: 'AI 编程辅助实践', focus: '学习用 AI 辅助代码生成、调试和网页制作', activity: 'AI 编程调试清单' },
  { id: '15', title: '教育数据与学习分析', focus: '通过学习数据看板理解学习分析与个性化反馈', activity: '学习数据看板解读' },
  { id: '16', title: 'AI 伦理与隐私保护', focus: '讨论公平性、隐私保护、版权和学术诚信问题', activity: 'AI 伦理情景辩论' },
  { id: '17', title: '智慧校园应用案例', focus: '分析智慧校园中的排课、巡检和服务机器人案例', activity: '智慧校园案例调研' },
  { id: '18', title: '机器人与具身智能', focus: '了解机器人感知、控制和具身智能场景', activity: '机器人任务路径规划' },
  { id: '19', title: '期末项目策划与实现', focus: '组织学生完成 AI 课程结课项目策划与分工', activity: '结课项目甘特表' },
  { id: '20', title: '课程复盘与成果展示', focus: '汇总课程成果、展示作品并完成课程反思评价', activity: '成果展示与课程反思' },
];

const PERSONAL_DEMO_OWNER = 'teacher_li';

const padNumber = (value) => String(value).padStart(2, '0');

function createDemoTimestamp(daysAgo = 0, hour = 9, minute = 0) {
  const base = new Date(2026, 5, 6, 9, 0, 0, 0);
  base.setDate(base.getDate() - daysAgo);
  base.setHours(hour, minute, 0, 0);
  return `${base.getFullYear()}-${padNumber(base.getMonth() + 1)}-${padNumber(base.getDate())} ${padNumber(base.getHours())}:${padNumber(base.getMinutes())}:${padNumber(base.getSeconds())}`;
}

function dedupeTags(tags = []) {
  return Array.from(new Set(tags.filter(Boolean)));
}

function createTeachingFile({
  key,
  name,
  parentKey,
  fileType,
  tags,
  daysAgo,
  hour,
  minute,
  contentText,
  parseStatus = 'parsed',
  lastOpenedAt,
}) {
  return {
    key,
    name,
    isFolder: false,
    parentKey,
    fileType,
    owner: PERSONAL_DEMO_OWNER,
    parseStatus,
    lastEdit: createDemoTimestamp(daysAgo, hour, minute),
    tags: dedupeTags(tags),
    contentText,
    ...(lastOpenedAt ? { lastOpenedAt } : {}),
  };
}

function createTeachingFolder({
  key,
  name,
  parentKey = null,
  tags,
  daysAgo,
  hour,
  minute,
}) {
  return {
    key,
    name,
    isFolder: true,
    parentKey,
    fileType: 'folder',
    owner: PERSONAL_DEMO_OWNER,
    parseStatus: 'parsed',
    lastEdit: createDemoTimestamp(daysAgo, hour, minute),
    tags: dedupeTags(tags),
  };
}

function buildPersonalTeachingDemo() {
  return AI_GENERAL_COURSES.flatMap((course, index) => {
    const folderKey = `p_course_${course.id}`;
    const daysAgo = 25 - index;
    const folderTags = ['tag_p_courseware', 'tag_p_teaching_plan', 'tag_p_teaching_aid'];
    const courseItems = [];
    const recentOpenedAt = index < 12 ? createDemoTimestamp(11 - index, 18, 10 + ((index % 4) * 10)) : undefined;

    courseItems.push(createTeachingFile({
      key: `${folderKey}_slides`,
      name: `第${course.id}课 ${course.title} 课件.pptx`,
      parentKey: folderKey,
      fileType: 'pptx',
      tags: ['tag_p_courseware'],
      daysAgo,
      hour: 9,
      minute: 10,
      contentText: `本课件围绕“${course.title}”展开，聚焦${course.focus}，用于教师进行人工智能通识课讲解和课堂演示。`,
      lastOpenedAt: recentOpenedAt,
    }));

    courseItems.push(createTeachingFile({
      key: `${folderKey}_plan`,
      name: `第${course.id}课 ${course.title} 教学方案.docx`,
      parentKey: folderKey,
      fileType: 'docx',
      tags: ['tag_p_teaching_plan'],
      daysAgo,
      hour: 9,
      minute: 40,
      contentText: `该教学方案明确了第${course.id}课《${course.title}》的教学目标、教学流程、提问设计和板书安排，适用于教师备课。`,
    }));

    courseItems.push(createTeachingFile({
      key: `${folderKey}_aid`,
      name: `第${course.id}课 ${course.title} 教辅资料.pdf`,
      parentKey: folderKey,
      fileType: 'pdf',
      tags: ['tag_p_teaching_aid'],
      daysAgo,
      hour: 10,
      minute: 5,
      contentText: `教辅资料汇总了“${course.title}”的概念说明、案例阅读和延伸知识，帮助教师组织分层教学和课后辅导。`,
    }));

    if (index % 2 === 0) {
      folderTags.push('tag_p_activity');
      courseItems.push(createTeachingFile({
        key: `${folderKey}_activity`,
        name: `第${course.id}课 ${course.activity}.xlsx`,
        parentKey: folderKey,
        fileType: 'xlsx',
        tags: ['tag_p_activity'],
        daysAgo,
        hour: 10,
        minute: 30,
        contentText: `课堂活动单用于组织学生完成“${course.activity}”，帮助教师围绕${course.focus}开展课堂互动与小组协作。`,
      }));
    } else {
      folderTags.push('tag_p_assignment');
      courseItems.push(createTeachingFile({
        key: `${folderKey}_assignment`,
        name: `第${course.id}课 ${course.title} 作业任务单.docx`,
        parentKey: folderKey,
        fileType: 'docx',
        tags: ['tag_p_assignment'],
        daysAgo,
        hour: 10,
        minute: 30,
        contentText: `作业任务单围绕“${course.title}”布置课后实践，要求学生结合${course.focus}完成观察、记录或设计任务。`,
      }));
    }

    if (index % 3 === 0) {
      folderTags.push('tag_p_case');
      const caseFolderKey = `${folderKey}_cases`;
      courseItems.push(createTeachingFolder({
        key: caseFolderKey,
        name: '拓展案例',
        parentKey: folderKey,
        tags: ['tag_p_case'],
        daysAgo,
        hour: 11,
        minute: 0,
      }));
      courseItems.push(createTeachingFile({
        key: `${caseFolderKey}_note`,
        name: `第${course.id}课 ${course.title} 案例研读.md`,
        parentKey: caseFolderKey,
        fileType: 'note',
        tags: ['tag_p_case'],
        daysAgo,
        hour: 11,
        minute: 20,
        contentText: `案例研读笔记收集了与“${course.title}”相关的课堂案例、讨论问题和反思提示，便于教师引导学生进行情境分析。`,
      }));
    }

    if (index % 4 === 0) {
      folderTags.push('tag_p_video');
      courseItems.push(createTeachingFile({
        key: `${folderKey}_video`,
        name: `第${course.id}课 ${course.title} 讲解视频.mp4`,
        parentKey: folderKey,
        fileType: 'video',
        tags: ['tag_p_video'],
        daysAgo,
        hour: 11,
        minute: 40,
        parseStatus: index === 8 ? 'parsing' : 'parsed',
        contentText: `讲解视频用于辅助教师进行翻转课堂或课后复习，视频内容覆盖${course.focus}和重点概念讲解。`,
      }));
    }

    if (index % 5 === 0) {
      folderTags.push('tag_p_assessment');
      courseItems.push(createTeachingFile({
        key: `${folderKey}_rubric`,
        name: `第${course.id}课 ${course.title} 评价量规.xlsx`,
        parentKey: folderKey,
        fileType: 'xlsx',
        tags: ['tag_p_assessment'],
        daysAgo,
        hour: 12,
        minute: 5,
        contentText: `评价量规用于教师对“${course.title}”的课堂表现、合作情况和任务成果进行分项评价。`,
      }));
    }

    if (index % 6 === 0) {
      folderTags.push('tag_p_experiment');
      courseItems.push(createTeachingFile({
        key: `${folderKey}_experiment`,
        name: `第${course.id}课 ${course.title} 实验指导.docx`,
        parentKey: folderKey,
        fileType: 'docx',
        tags: ['tag_p_experiment'],
        daysAgo,
        hour: 12,
        minute: 30,
        contentText: `实验指导文档用于教师安排“${course.title}”的上机或分组实验，内容包含步骤提示、操作要求和结果记录方式。`,
      }));
    }

    return [
      createTeachingFolder({
        key: folderKey,
        name: `第${course.id}课 ${course.title}`,
        tags: folderTags,
        daysAgo,
        hour: 8,
        minute: 50,
      }),
      ...courseItems,
    ];
  });
}

const DEMO_CONTENT_TEXT_BY_KEY = {
  o_r1: '员工手册正文包含入职制度、行为规范、内容安全要求和资料协作流程。',
  o_r2: '发布会 PPT 内容包含产品路线、React 门户改版、AI 能力矩阵与商业化计划。',
  rd_r1: '架构方案涉及 React 前端分层、微前端集成、向量搜索和解析服务治理。',
  mk_r1: '市场分析报告覆盖用户画像、内容传播策略、React 官网投放页和线索转化。',
};

const DEMO_RECENT_OPENED_AT_BY_KEY = {
  o_r2: '2026-05-29 16:40:00',
  rd_r1: '2026-05-26 10:05:00',
};

function withDemoContentText(item) {
  if (!item || item.isFolder) return item;
  let next = item;
  if (!next.contentText) {
    const demoContentText = DEMO_CONTENT_TEXT_BY_KEY[next.key];
    if (demoContentText) next = { ...next, contentText: demoContentText };
  }
  if (!next.lastOpenedAt) {
    const demoLastOpenedAt = DEMO_RECENT_OPENED_AT_BY_KEY[next.key];
    if (demoLastOpenedAt) next = { ...next, lastOpenedAt: demoLastOpenedAt };
  }
  return next;
}

function hydrateSearchContent(data) {
  const hydrateList = (items = []) => items.map(withDemoContentText);
  return {
    ...data,
    personal: hydrateList(data.personal),
    organizations: Object.fromEntries(
      Object.entries(data.organizations || {}).map(([orgId, items]) => [orgId, hydrateList(items)]),
    ),
  };
}

const defaultData = {
  _dataVersion: DATA_VERSION,
  // 个人资料库
  personal: buildPersonalTeachingDemo(),
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
      ...PERSONAL_TEACHING_TAGS,
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
      if (parsed._dataVersion === DATA_VERSION) return hydrateSearchContent(parsed);
      // 旧版本迁移
      const migrated = migrate(parsed);
      saveResourceLib(migrated);
      return migrated;
    }
  } catch (e) {
    console.error('Failed to load resource lib:', e);
  }
  const seeded = hydrateSearchContent(JSON.parse(JSON.stringify(defaultData)));
  saveResourceLib(seeded);
  return seeded;
}

function migrate(old) {
  const next = JSON.parse(JSON.stringify(defaultData));
  const shouldResetPersonalDemo = (old?._dataVersion || 0) < RESET_PERSONAL_TEACHING_DEMO_VERSION;
  // 保留个人数据
  if (!shouldResetPersonalDemo && Array.isArray(old.personal)) next.personal = old.personal;
  // 旧版本：data.organization[] → 默认组织
  if (Array.isArray(old.organization)) {
    next.organizations.org_default = old.organization;
  } else if (old.organizations && typeof old.organizations === 'object') {
    next.organizations = { ...next.organizations, ...old.organizations };
  }
  // 标签定义迁移
  if (old.tagDefinitions) {
    if (!shouldResetPersonalDemo && Array.isArray(old.tagDefinitions.personal)) {
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
    if (shouldResetPersonalDemo) next.selectedFolderKey.personal = null;
  }
  next._dataVersion = DATA_VERSION;
  return hydrateSearchContent(next);
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
    contentText: '',
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

// 移动项目到目标文件夹
export function moveItem(data, scope, itemKey, targetFolderKey) {
  const list = getLibraryList(data, scope);
  const item = list.find((r) => r.key === itemKey);
  if (!item) return data;
  
  // 防止将文件夹移动到自身或自身的子文件夹中
  if (item.isFolder && targetFolderKey) {
    const isDescendant = (parentKey, targetKey) => {
      if (parentKey === targetKey) return true;
      const parent = list.find((r) => r.key === parentKey);
      if (!parent || !parent.parentKey) return false;
      return isDescendant(parent.parentKey, targetKey);
    };
    if (isDescendant(targetFolderKey, itemKey)) {
      return data; // 不允许移动到自己的子文件夹中
    }
  }
  
  const next = setLibraryList(data, scope, list.map((r) => 
    r.key === itemKey ? { ...r, parentKey: targetFolderKey, lastEdit: now() } : r
  ));
  saveResourceLib(next);
  return next;
}

// 标记资料最近打开时间
export function markItemOpened(data, scope, key, openedAt = now()) {
  const list = getLibraryList(data, scope);
  const next = setLibraryList(data, scope, list.map((r) => (
    r.key === key ? { ...r, lastOpenedAt: openedAt } : r
  )));
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
