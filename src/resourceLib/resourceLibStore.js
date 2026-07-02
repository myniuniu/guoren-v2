import {
  createCollection as createKnowledgeGraphCollection,
  createGraph as createKnowledgeGraph,
  duplicateGraph as duplicateKnowledgeGraph,
  getCollections as getKnowledgeGraphCollections,
  loadKnowledgeGraphStore,
  updateGraph as updateKnowledgeGraph,
} from '../knowledgeGraph/store';

// 资料库本地存储（独立于 versionStore，避免耦合）
const STORAGE_KEY = 'guoren_resource_lib';
const DATA_VERSION = 19;

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
// fileType：folder | pdf | pptx | docx | xlsx | image | video | audio | whiteboard | note | test | knowledgeGraph | capabilityModel | other

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
  { id: 'org_knowledge_graph', name: '知识图谱' },
  { id: 'org_capability_model', name: '能力模型' },
];

const RESET_PERSONAL_TEACHING_DEMO_VERSION = 7;
const PERSONAL_TEACHING_ROOT_TAG_ID = 'tag_p_ai_general';
const DEFAULT_QUICK_TAG_IDS = new Set([
  'tag_p_courseware',
  'tag_p_teaching_plan',
  'tag_p_teaching_aid',
  'tag_p_assignment',
  'tag_p_activity',
  'tag_p_experiment',
]);

const PERSONAL_TEACHING_TAGS = [
  { id: PERSONAL_TEACHING_ROOT_TAG_ID, name: '人工智能通识', color: '#5AC8FA', scope: 'personal' },
  { id: 'tag_p_courseware', name: '课件', color: '#007AFF', scope: 'personal', quick: true },
  { id: 'tag_p_teaching_plan', name: '教学方案', color: '#34C759', scope: 'personal', quick: true },
  { id: 'tag_p_teaching_aid', name: '教辅', color: '#FF9500', scope: 'personal', quick: true },
  { id: 'tag_p_activity', name: '课堂活动', color: '#AF52DE', scope: 'personal', quick: true },
  { id: 'tag_p_assignment', name: '作业任务', color: '#FF2D55', scope: 'personal' },
  { id: 'tag_p_assessment', name: '评价量规', color: '#8E8E93', scope: 'personal' },
  { id: 'tag_p_case', name: '案例素材', color: '#00C7BE', scope: 'personal' },
  { id: 'tag_p_video', name: '视频素材', color: '#5856D6', scope: 'personal' },
  { id: 'tag_p_experiment', name: '实验指导', color: '#FFCC00', scope: 'personal', quick: true },
];

const LEGACY_ORGANIZATION_TAGS = [
  { id: 'tag_o_official', name: '正式文件', color: '#007AFF' },
  { id: 'tag_o_draft', name: '草稿', color: '#8E8E93' },
  { id: 'tag_o_urgent', name: '紧急', color: '#FF3B30' },
  { id: 'tag_o_archive', name: '归档', color: '#34C759' },
  { id: 'tag_rd_req', name: '需求', color: '#007AFF' },
  { id: 'tag_rd_design', name: '设计', color: '#AF52DE' },
  { id: 'tag_rd_test', name: '测试', color: '#FF9500' },
  { id: 'tag_mk_promo', name: '推广', color: '#FF3B30' },
  { id: 'tag_mk_brand', name: '品牌', color: '#5856D6' },
];
const LEGACY_ORGANIZATION_TAG_MAP = new Map(LEGACY_ORGANIZATION_TAGS.map((tag) => [tag.id, tag]));
const LEGACY_ORGANIZATION_TAG_IDS = new Set(LEGACY_ORGANIZATION_TAGS.map((tag) => tag.id));
const PRESET_TAG_IDS = new Set(PRESET_TAGS.map((tag) => tag.id));
const PERSONAL_ONLY_TAG_IDS = new Set(PERSONAL_TEACHING_TAGS.map((tag) => tag.id));
const PERSONAL_DEFAULT_TAGS = [
  ...PRESET_TAGS.map((tag) => ({ ...tag, scope: 'personal' })),
  ...withDefaultQuickTags(PERSONAL_TEACHING_TAGS),
];
const ORGANIZATION_DEFAULT_TAGS = [
  ...PRESET_TAGS.map((tag) => ({ ...tag, scope: 'organization' })),
  ...LEGACY_ORGANIZATION_TAGS.map((tag) => ({ ...tag, scope: 'organization', quick: false })),
];
const DEFAULT_PERSONAL_TAG_GROUPS = [
  {
    id: 'tag_group_p_ai_course',
    name: '课程主题',
    color: '#5AC8FA',
    tagIds: [PERSONAL_TEACHING_ROOT_TAG_ID],
  },
  {
    id: 'tag_group_p_design',
    name: '教学设计',
    color: '#1677ff',
    tagIds: ['tag_p_courseware', 'tag_p_teaching_plan', 'tag_p_teaching_aid'],
  },
  {
    id: 'tag_group_p_activity',
    name: '教学实施',
    color: '#34c759',
    tagIds: ['tag_p_activity', 'tag_p_assignment', 'tag_p_assessment', 'tag_p_experiment'],
  },
  {
    id: 'tag_group_p_material',
    name: '素材资源',
    color: '#af52de',
    tagIds: ['tag_p_case', 'tag_p_video'],
  },
];
const DEFAULT_ORGANIZATION_TAG_GROUPS = [
  {
    id: 'tag_group_doc_status',
    name: '文档状态',
    color: '#1677ff',
    tagIds: ['tag_o_official', 'tag_o_draft', 'tag_o_archive', 'tag_o_urgent'],
  },
  {
    id: 'tag_group_rd_flow',
    name: '研发协作',
    color: '#7c3aed',
    tagIds: ['tag_rd_req', 'tag_rd_design', 'tag_rd_test'],
  },
  {
    id: 'tag_group_market_work',
    name: '市场运营',
    color: '#f97316',
    tagIds: ['tag_mk_promo', 'tag_mk_brand'],
  },
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

const ORGANIZATION_CAPABILITY_MODEL_ORG_ID = 'org_capability_model';
const ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME = '能力模型';
const ORGANIZATION_CAPABILITY_MODEL_FOLDER_KEY = 'o_f_capability_models';
const ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID = 'org_knowledge_graph';
const ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME = '知识图谱';
const ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_KEY = 'okg_f_knowledge_graph';
const ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_RESOURCE_KEY = 'okg_r_demo_graph';
const ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_NAME = '组织示例知识图谱';
const ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_DESCRIPTION = '演示图谱：用于展示组织资料库中的知识图谱资产。';
const VISIBLE_ORGANIZATION_IDS = new Set([
  ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID,
  ORGANIZATION_CAPABILITY_MODEL_ORG_ID,
]);
const ORGANIZATION_CAPABILITY_MODEL_RESOURCE_TEMPLATES = [
  {
    key: 'o_cm_basic_teacher_l1',
    capabilityModelCode: 'BASIC_EDU_TEACHER_NEW',
    name: '基础教育新教师能力模型',
    description: '适用于基础教育新教师阶段，强调教学设计基本功、课堂执行和形成性反馈。',
    summary: '基础教育教师 / 新教师 · 4 个能力类 · 8 个能力项',
    lastEdit: createDemoTimestamp(2, 10, 20),
  },
  {
    key: 'o_cm_basic_teacher_l2',
    capabilityModelCode: 'BASIC_EDU_TEACHER_YOUNG',
    name: '基础教育青年教师能力模型',
    description: '适用于基础教育青年教师阶段，强调课堂优化、学情分析和教研协同。',
    summary: '基础教育教师 / 青年教师 · 4 个能力类 · 8 个能力项',
    lastEdit: createDemoTimestamp(2, 10, 35),
  },
  {
    key: 'o_cm_basic_teacher_l3',
    capabilityModelCode: 'BASIC_EDU_TEACHER_BACKBONE',
    name: '基础教育骨干教师能力模型',
    description: '适用于基础教育骨干教师阶段，强调示范引领、数据驱动改进和团队共建。',
    summary: '基础教育教师 / 骨干教师 · 4 个能力类 · 8 个能力项',
    lastEdit: createDemoTimestamp(2, 10, 50),
  },
  {
    key: 'o_cm_basic_teacher_l4',
    capabilityModelCode: 'BASIC_EDU_TEACHER_LEAD',
    name: '基础教育学科带头人能力模型',
    description: '适用于基础教育学科带头人阶段，强调学科建设、跨校教研和体系化引领。',
    summary: '基础教育教师 / 学科带头人 · 4 个能力类 · 8 个能力项',
    lastEdit: createDemoTimestamp(2, 11, 5),
  },
];

function buildOrganizationCapabilityModelDemoEntries(parentKey = ORGANIZATION_CAPABILITY_MODEL_FOLDER_KEY) {
  return [
    {
      key: parentKey,
      name: ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME,
      isFolder: true,
      parentKey: null,
      fileType: 'folder',
      owner: 'admin',
      parseStatus: 'parsed',
      lastEdit: createDemoTimestamp(2, 10, 0),
      tags: ['tag_green'],
    },
    ...ORGANIZATION_CAPABILITY_MODEL_RESOURCE_TEMPLATES.map((item) => ({
      key: item.key,
      name: item.name,
      isFolder: false,
      parentKey,
      fileType: 'capabilityModel',
      resourceKind: 'capabilityModel',
      capabilityModelCode: item.capabilityModelCode,
      owner: 'admin',
      parseStatus: 'parsed',
      contentText: item.summary,
      comment: item.description,
      lastEdit: item.lastEdit,
      tags: ['tag_green'],
    })),
  ];
}

function createOrganizationKnowledgeGraphFolder(parentKey = null, key = ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_KEY) {
  return {
    key,
    name: ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME,
    isFolder: true,
    parentKey,
    fileType: 'folder',
    owner: 'admin',
    parseStatus: 'parsed',
    lastEdit: createDemoTimestamp(2, 11, 20),
    tags: ['tag_blue'],
  };
}

function ensureOrganizationKnowledgeGraphDemoGraph() {
  if (typeof window === 'undefined') return null;

  let snapshot = loadKnowledgeGraphStore();
  let graph = (snapshot.graphs || []).find((item) => item.name === ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_NAME) || null;
  if (graph) return graph;

  const sourceGraph = (snapshot.graphs || []).find((item) => item.name === 'AI 通识知识图谱') || ensureAiGeneralKnowledgeGraph();
  if (!sourceGraph?.id) return null;

  snapshot = loadKnowledgeGraphStore();
  const previousGraphIds = new Set((snapshot.graphs || []).map((item) => item.id));
  const duplicatedState = duplicateKnowledgeGraph(sourceGraph.id);
  const duplicatedGraph = (duplicatedState.graphs || []).find((item) => !previousGraphIds.has(item.id)) || null;
  if (!duplicatedGraph?.id) return null;

  const renamedState = updateKnowledgeGraph(duplicatedGraph.id, {
    name: ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_NAME,
    description: ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_DESCRIPTION,
  });
  return (renamedState.graphs || []).find((item) => item.id === duplicatedGraph.id) || null;
}

function buildOrganizationKnowledgeGraphDemoEntry(parentKey = ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_KEY) {
  const graph = ensureOrganizationKnowledgeGraphDemoGraph();
  if (!graph?.id) return null;

  return createKnowledgeGraphResourceRecord({
    key: ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_RESOURCE_KEY,
    name: graph.name || ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_NAME,
    graphId: graph.id,
    description: graph.description || ORGANIZATION_KNOWLEDGE_GRAPH_DEMO_DESCRIPTION,
    parentKey,
    owner: 'admin',
    lastEdit: graph.updatedAt || graph.createdAt || now(),
    tags: ['tag_blue'],
  });
}

function ensureOrganizationKnowledgeGraphDemoEntries(items = [], parentKey = ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_KEY) {
  const demoEntry = buildOrganizationKnowledgeGraphDemoEntry(parentKey);
  const nextItems = [...items];

  if (!demoEntry) {
    return nextItems.map((item) => (
      !item?.isFolder
      && item.fileType === 'knowledgeGraph'
      && (item.parentKey ?? null) === null
        ? { ...item, parentKey }
        : item
    ));
  }

  const normalizedItems = nextItems.map((item) => (
    !item?.isFolder
    && item.fileType === 'knowledgeGraph'
    && (item.parentKey ?? null) === null
      ? { ...item, parentKey }
      : item
  ));

  const existingIndex = normalizedItems.findIndex((item) => (
    !item?.isFolder
    && item.fileType === 'knowledgeGraph'
    && (
      item.key === demoEntry.key
      || item.knowledgeGraphId === demoEntry.knowledgeGraphId
      || item.name === demoEntry.name
    )
  ));

  if (existingIndex < 0) {
    normalizedItems.unshift(demoEntry);
    return normalizedItems;
  }

  normalizedItems[existingIndex] = {
    ...normalizedItems[existingIndex],
    ...demoEntry,
    parentKey,
  };
  return normalizedItems;
}

function collectSubtreeKeys(items = [], rootKey) {
  const collected = new Set();
  const visit = (parentKey) => {
    if (!parentKey || collected.has(parentKey)) return;
    collected.add(parentKey);
    items.forEach((item) => {
      if (item.parentKey === parentKey) visit(item.key);
    });
  };
  visit(rootKey);
  return collected;
}

function ensureOrganizationKnowledgeGraphLibrary(organizations = {}) {
  const nextOrganizations = { ...(organizations || {}) };
  const targetList = [...(nextOrganizations[ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID] || [])];
  const hasKnowledgeGraphFolder = targetList.some((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME
  ));

  if (!hasKnowledgeGraphFolder) {
    const sourceEntry = Object.entries(nextOrganizations).find(([orgId, items]) => (
      orgId !== ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID
      && (items || []).some((item) => (
        item?.isFolder
        && (item.parentKey ?? null) === null
        && item.name === ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME
      ))
    ));

    if (sourceEntry) {
      const [sourceOrgId, sourceItems = []] = sourceEntry;
      const sourceFolder = sourceItems.find((item) => (
        item?.isFolder
        && (item.parentKey ?? null) === null
        && item.name === ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME
      ));
      const subtreeKeys = collectSubtreeKeys(sourceItems, sourceFolder?.key);
      const movedItems = sourceItems.filter((item) => subtreeKeys.has(item.key));
      nextOrganizations[sourceOrgId] = sourceItems.filter((item) => !subtreeKeys.has(item.key));
      targetList.push(...movedItems.map((item) => (
        item.key === sourceFolder?.key
          ? { ...item, parentKey: null }
          : item
      )));
    }
  }

  if (!targetList.some((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME
  ))) {
    targetList.unshift(createOrganizationKnowledgeGraphFolder());
  }

  const folder = targetList.find((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_NAME
  )) || null;
  const folderKey = folder?.key || ORGANIZATION_KNOWLEDGE_GRAPH_FOLDER_KEY;

  nextOrganizations[ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID] = ensureOrganizationKnowledgeGraphDemoEntries(targetList, folderKey);
  return nextOrganizations;
}

function mergeOrganizationMeta(defaults = [], existing = []) {
  const merged = [];
  const seen = new Set();
  [...(defaults || []), ...(existing || [])].forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    const preferred = (existing || []).find((entry) => entry?.id === item.id) || item;
    merged.push({
      id: item.id,
      name: preferred?.name || item.name || item.id,
    });
  });
  return merged;
}

function getVisibleOrganizationsFromList(orgs = []) {
  return (orgs || []).filter((item) => item?.id && VISIBLE_ORGANIZATION_IDS.has(item.id));
}

function getPreferredOrganizationId(orgs = []) {
  const visibleOrganizations = getVisibleOrganizationsFromList(orgs);
  return visibleOrganizations.find((item) => item.id === ORGANIZATION_CAPABILITY_MODEL_ORG_ID)?.id
    || visibleOrganizations[0]?.id
    || ORGANIZATION_CAPABILITY_MODEL_ORG_ID;
}

function ensureOrganizationCapabilityModelDemoEntries(items = [], parentKey = ORGANIZATION_CAPABILITY_MODEL_FOLDER_KEY) {
  const list = Array.isArray(items) ? [...items] : [];
  const normalizedList = list.map((item) => (
    !item?.isFolder
    && item.fileType === 'capabilityModel'
    && (item.parentKey ?? null) === null
      ? { ...item, parentKey }
      : item
  ));
  const existingFolder = normalizedList.find((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
  )) || null;
  const folderKey = existingFolder?.key || parentKey || ORGANIZATION_CAPABILITY_MODEL_FOLDER_KEY;

  if (!existingFolder) {
    normalizedList.unshift(buildOrganizationCapabilityModelDemoEntries(folderKey)[0]);
  }

  const existingCodes = new Set(
    normalizedList
      .filter((item) => item?.fileType === 'capabilityModel')
      .map((item) => item.capabilityModelCode)
      .filter(Boolean),
  );
  const existingNames = new Set(
    normalizedList
      .filter((item) => item?.fileType === 'capabilityModel')
      .map((item) => item.name)
      .filter(Boolean),
  );

  buildOrganizationCapabilityModelDemoEntries(folderKey)
    .slice(1)
    .forEach((item) => {
      if (existingCodes.has(item.capabilityModelCode) || existingNames.has(item.name)) return;
      normalizedList.push(item);
    });

  return normalizedList;
}

function ensureOrganizationCapabilityModelLibrary(organizations = {}) {
  const nextOrganizations = { ...(organizations || {}) };
  const targetList = [...(nextOrganizations[ORGANIZATION_CAPABILITY_MODEL_ORG_ID] || [])];
  const hasCapabilityFolder = targetList.some((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
  ));

  if (!hasCapabilityFolder) {
    const sourceEntry = Object.entries(nextOrganizations).find(([orgId, items]) => (
      orgId !== ORGANIZATION_CAPABILITY_MODEL_ORG_ID
      && (items || []).some((item) => (
        item?.isFolder
        && (item.parentKey ?? null) === null
        && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
      ))
    ));

    if (sourceEntry) {
      const [sourceOrgId, sourceItems = []] = sourceEntry;
      const sourceFolder = sourceItems.find((item) => (
        item?.isFolder
        && (item.parentKey ?? null) === null
        && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
      )) || null;
      const subtreeKeys = collectSubtreeKeys(sourceItems, sourceFolder?.key);
      const movedItems = sourceItems.filter((item) => subtreeKeys.has(item.key));
      nextOrganizations[sourceOrgId] = sourceItems.filter((item) => !subtreeKeys.has(item.key));
      targetList.push(...movedItems.map((item) => (
        item.key === sourceFolder?.key
          ? { ...item, parentKey: null }
          : item
      )));
    }
  }

  if (!targetList.some((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
  ))) {
    targetList.unshift(buildOrganizationCapabilityModelDemoEntries()[0]);
  }

  const folder = targetList.find((item) => (
    item?.isFolder
    && (item.parentKey ?? null) === null
    && item.name === ORGANIZATION_CAPABILITY_MODEL_FOLDER_NAME
  )) || null;
  const folderKey = folder?.key || ORGANIZATION_CAPABILITY_MODEL_FOLDER_KEY;

  nextOrganizations[ORGANIZATION_CAPABILITY_MODEL_ORG_ID] = ensureOrganizationCapabilityModelDemoEntries(targetList, folderKey);
  return nextOrganizations;
}

function dedupeTags(tags = []) {
  return Array.from(new Set(tags.filter(Boolean)));
}

function withDefaultQuickTags(tagList = []) {
  return tagList.map((tag) => (
    DEFAULT_QUICK_TAG_IDS.has(tag.id) && typeof tag.quick === 'undefined'
      ? { ...tag, quick: true }
      : tag
  ));
}

function mergeTagDefinitions(...tagLists) {
  const merged = [];
  const indexById = new Map();

  tagLists.flat().forEach((tag) => {
    if (!tag?.id) return;
    const normalized = withDefaultQuickTags([tag])[0] || tag;
    const existingIndex = indexById.get(normalized.id);
    if (typeof existingIndex === 'undefined') {
      merged.push({ ...normalized, quick: Boolean(normalized.quick) });
      indexById.set(normalized.id, merged.length - 1);
      return;
    }
    const prev = merged[existingIndex];
    merged[existingIndex] = {
      ...prev,
      ...normalized,
      quick: Boolean(prev.quick || normalized.quick),
    };
  });

  return merged;
}

function normalizeTagList(tagList = [], fallbackScope) {
  return mergeTagDefinitions(
    (tagList || [])
      .filter((tag) => tag?.id)
      .map((tag) => ({
        ...tag,
        scope: tag.scope || fallbackScope,
        quick: Boolean(tag.quick),
      })),
  );
}

function normalizeTagGroupList(groupList = []) {
  return (groupList || [])
    .filter((group) => group?.id)
    .map((group) => ({
      id: group.id,
      name: (group.name || '').trim() || '未命名标签组',
      color: group.color || '#1677ff',
      tagIds: dedupeTags(group.tagIds || []),
    }));
}

function mergeTagGroupLists(...groupLists) {
  const merged = [];
  const indexById = new Map();

  groupLists.flat().forEach((group) => {
    if (!group?.id) return;
    const normalized = normalizeTagGroupList([group])[0];
    const existingIndex = indexById.get(normalized.id);
    if (typeof existingIndex === 'undefined') {
      merged.push(normalized);
      indexById.set(normalized.id, merged.length - 1);
      return;
    }
    merged[existingIndex] = {
      ...merged[existingIndex],
      ...normalized,
      tagIds: dedupeTags([
        ...(merged[existingIndex]?.tagIds || []),
        ...(normalized.tagIds || []),
      ]),
    };
  });

  return merged;
}

function collectUsedTagIds(data = {}) {
  const usedTagIds = new Set();
  const orgItems = Object.values(data.organizations || {}).flatMap((items) => items || []);
  const allItems = [...(data.personal || []), ...(data.organization || []), ...orgItems];
  allItems.forEach((item) => {
    (item.tags || []).forEach((tagId) => usedTagIds.add(tagId));
  });
  return usedTagIds;
}

function collectUsedTagIdsByScope(data = {}) {
  const personal = new Set();
  const organization = new Set();

  (data.personal || []).forEach((item) => {
    (item.tags || []).forEach((tagId) => personal.add(tagId));
  });

  Object.values(data.organizations || {}).forEach((items) => {
    (items || []).forEach((item) => {
      (item.tags || []).forEach((tagId) => organization.add(tagId));
    });
  });

  return { personal, organization };
}

function shouldKeepLegacyOrganizationTag(tag, usedTagIds) {
  if (!tag?.id) return false;
  if (!LEGACY_ORGANIZATION_TAG_IDS.has(tag.id)) return true;
  if (usedTagIds.has(tag.id) || tag.quick) return true;
  const baseline = LEGACY_ORGANIZATION_TAG_MAP.get(tag.id);
  return !baseline || baseline.name !== tag.name || baseline.color !== tag.color;
}

function collectLegacyOrganizationTags(defs, data = {}) {
  if (!defs || Array.isArray(defs)) return [];
  const usedTagIds = collectUsedTagIds(data);
  const scopedLists = [];
  if (Array.isArray(defs.organization)) scopedLists.push(defs.organization);
  Object.values(defs.organizations || {}).forEach((list) => {
    if (Array.isArray(list)) scopedLists.push(list);
  });
  return scopedLists
    .flat()
    .filter((tag) => shouldKeepLegacyOrganizationTag(tag, usedTagIds));
}

function buildLegacySharedTagDefinitions(defs, data = {}) {
  if (!defs) return mergeTagDefinitions(PERSONAL_DEFAULT_TAGS, ORGANIZATION_DEFAULT_TAGS);
  if (Array.isArray(defs)) return mergeTagDefinitions(PERSONAL_DEFAULT_TAGS, ORGANIZATION_DEFAULT_TAGS, defs);
  const sharedPersonal = Array.isArray(defs.personal) ? defs.personal : [];
  const sharedOrganization = Array.isArray(defs.organization) ? defs.organization : [];
  const legacyOrgTags = collectLegacyOrganizationTags(defs, data);
  return mergeTagDefinitions(
    PERSONAL_DEFAULT_TAGS,
    ORGANIZATION_DEFAULT_TAGS,
    sharedPersonal,
    sharedOrganization,
    legacyOrgTags,
  );
}

function getScopedTagDefinitionStateFromLegacy(data) {
  const legacyTags = buildLegacySharedTagDefinitions(data?.tagDefinitions, data);
  const { personal: personalUsedTagIds, organization: organizationUsedTagIds } = collectUsedTagIdsByScope(data);

  return {
    personal: normalizeTagList(
      mergeTagDefinitions(
        PERSONAL_DEFAULT_TAGS,
        legacyTags.filter((tag) => PERSONAL_ONLY_TAG_IDS.has(tag.id) || personalUsedTagIds.has(tag.id)),
      ),
      'personal',
    ),
    organization: normalizeTagList(
      mergeTagDefinitions(
        ORGANIZATION_DEFAULT_TAGS,
        legacyTags.filter((tag) => {
          if (PERSONAL_ONLY_TAG_IDS.has(tag.id)) return false;
          if (organizationUsedTagIds.has(tag.id)) return true;
          return !personalUsedTagIds.has(tag.id);
        }),
      ),
      'organization',
    ),
    groups: {
      personal: mergeTagGroupLists(DEFAULT_PERSONAL_TAG_GROUPS),
      organization: mergeTagGroupLists(DEFAULT_ORGANIZATION_TAG_GROUPS),
    },
  };
}

function getScopedTagDefinitionState(data) {
  const defs = data.tagDefinitions;
  if (!defs || Array.isArray(defs) || !Array.isArray(defs.organization)) {
    return getScopedTagDefinitionStateFromLegacy(data);
  }
  return {
    personal: Array.isArray(defs.personal)
      ? normalizeTagList(defs.personal, 'personal')
      : normalizeTagList(PERSONAL_DEFAULT_TAGS, 'personal'),
    organization: Array.isArray(defs.organization)
      ? normalizeTagList(defs.organization, 'organization')
      : normalizeTagList(ORGANIZATION_DEFAULT_TAGS, 'organization'),
    groups: {
      personal: Array.isArray(defs.groups?.personal) && defs.groups.personal.length > 0
        ? normalizeTagGroupList(defs.groups.personal)
        : mergeTagGroupLists(DEFAULT_PERSONAL_TAG_GROUPS),
      organization: normalizeTagGroupList(defs.groups?.organization || []),
    },
  };
}

function stripInheritedTagsFromPersonalDemoFolders(items = []) {
  return items.map((item) => {
    if (!item?.isFolder) return item;
    const key = item.key || '';
    const caseMatch = key.match(/^p_course_(\d{2})_cases$/);
    if (caseMatch) {
      const nextTags = (item.tags || []).filter((tagId) => tagId !== 'tag_p_case');
      return nextTags.length === (item.tags || []).length ? item : { ...item, tags: nextTags };
    }
    const courseMatch = key.match(/^p_course_(\d{2})$/);
    if (!courseMatch) return item;
    const courseIndex = Number(courseMatch[1]) - 1;
    if (!Number.isInteger(courseIndex) || courseIndex < 0) return item;
    const inheritedTagIds = new Set([
      'tag_p_courseware',
      'tag_p_teaching_plan',
      'tag_p_teaching_aid',
      courseIndex % 2 === 0 ? 'tag_p_activity' : 'tag_p_assignment',
      ...(courseIndex % 3 === 0 ? ['tag_p_case'] : []),
      ...(courseIndex % 4 === 0 ? ['tag_p_video'] : []),
      ...(courseIndex % 5 === 0 ? ['tag_p_assessment'] : []),
      ...(courseIndex % 6 === 0 ? ['tag_p_experiment'] : []),
    ]);
    const nextTags = (item.tags || []).filter((tagId) => !inheritedTagIds.has(tagId));
    return nextTags.length === (item.tags || []).length ? item : { ...item, tags: nextTags };
  });
}

function applyPersonalTeachingRootTag(items = []) {
  return items.map((item) => {
    if (!item?.isFolder || item.parentKey !== null) return item;
    if (!/^p_course_(\d{2})$/.test(item.key || '')) return item;
    if ((item.tags || []).includes(PERSONAL_TEACHING_ROOT_TAG_ID)) return item;
    return {
      ...item,
      tags: dedupeTags([...(item.tags || []), PERSONAL_TEACHING_ROOT_TAG_ID]),
    };
  });
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

function ensureAiGeneralKnowledgeGraph() {
  if (typeof window === 'undefined') return null;

  let snapshot = loadKnowledgeGraphStore();
  let graph = (snapshot.graphs || []).find((item) => item.name === 'AI 通识知识图谱') || null;
  if (graph) return graph;

  let collection = getKnowledgeGraphCollections(snapshot)[0] || null;
  if (!collection) {
    const nextState = createKnowledgeGraphCollection({
      name: '默认图谱集',
      description: '用于沉淀课程结构、知识关系与资料绑定。',
    });
    snapshot = nextState;
    collection = getKnowledgeGraphCollections(nextState)[0] || null;
  }

  if (!collection) return null;

  const previousGraphIds = new Set((snapshot.graphs || []).map((item) => item.id));
  const nextState = createKnowledgeGraph({
    collectionId: collection.id,
    name: 'AI 通识知识图谱',
    description: '演示图谱：用于展示两种视图和图谱编辑能力。',
  });

  return nextState.graphs.find((item) => !previousGraphIds.has(item.id))
    || nextState.graphs.find((item) => item.name === 'AI 通识知识图谱')
    || null;
}

function createKnowledgeGraphResourceRecord({
  key,
  name,
  graphId,
  description = '',
  parentKey = null,
  owner = PERSONAL_DEMO_OWNER,
  lastEdit = now(),
  tags = [],
}) {
  return {
    key,
    name,
    isFolder: false,
    parentKey,
    fileType: 'knowledgeGraph',
    resourceKind: 'knowledgeGraph',
    knowledgeGraphId: graphId,
    owner,
    parseStatus: 'parsed',
    lastEdit,
    tags: dedupeTags(tags),
    contentText: description || `知识图谱资产「${name}」，点击可进入知识图谱编辑模式。`,
  };
}

function buildPersonalKnowledgeGraphDemoEntry() {
  const graph = ensureAiGeneralKnowledgeGraph();
  if (!graph?.id) return null;

  return createKnowledgeGraphResourceRecord({
    key: 'p_ai_general_knowledge_graph',
    name: graph.name || 'AI 通识知识图谱',
    graphId: graph.id,
    description: graph.description || '演示图谱：用于展示两种视图和图谱编辑能力。',
    parentKey: null,
    owner: PERSONAL_DEMO_OWNER,
    lastEdit: graph.updatedAt || graph.createdAt || now(),
    tags: [PERSONAL_TEACHING_ROOT_TAG_ID],
  });
}

function ensurePersonalKnowledgeGraphDemoEntry(items = []) {
  const demoEntry = buildPersonalKnowledgeGraphDemoEntry();
  if (!demoEntry) return items;

  const nextItems = [...items];
  const existingIndex = nextItems.findIndex((item) => (
    !item?.isFolder
    && item.fileType === 'knowledgeGraph'
    && (
      item.key === demoEntry.key
      || item.knowledgeGraphId === demoEntry.knowledgeGraphId
      || item.name === demoEntry.name
    )
  ));

  if (existingIndex < 0) {
    nextItems.unshift(demoEntry);
    return nextItems;
  }

  nextItems[existingIndex] = {
    ...nextItems[existingIndex],
    ...demoEntry,
    parentKey: nextItems[existingIndex].parentKey ?? demoEntry.parentKey,
  };
  return nextItems;
}

function buildPersonalTeachingDemo() {
  return AI_GENERAL_COURSES.flatMap((course, index) => {
    const folderKey = `p_course_${course.id}`;
    const daysAgo = 25 - index;
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
      const caseFolderKey = `${folderKey}_cases`;
      courseItems.push(createTeachingFolder({
        key: caseFolderKey,
        name: '拓展案例',
        parentKey: folderKey,
        tags: [],
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
        tags: [PERSONAL_TEACHING_ROOT_TAG_ID],
        daysAgo,
        hour: 8,
        minute: 50,
      }),
      ...courseItems,
    ];
  });
}

function ensureProfileAssociationDemoEntries(items = []) {
  const nextItems = [...items];
  const existingKeys = new Set(nextItems.map((item) => item.key));

  const demoEntries = [
    createTeachingFile({
      key: 'p_course_03_class_transcript',
      name: '第03课 机器学习初体验 课堂实录.mp4',
      parentKey: 'p_course_03',
      fileType: 'video',
      tags: ['tag_p_video', 'tag_p_activity'],
      daysAgo: 14,
      hour: 14,
      minute: 20,
      contentText: '课堂实录记录了“机器学习初体验”课堂中的学生互动、教师提问和板书推进节奏，可用于课堂回看和教学反思。',
      lastOpenedAt: createDemoTimestamp(2, 20, 10),
    }),
    createTeachingFile({
      key: 'p_course_03_ai_eval',
      name: '第03课 机器学习初体验 AI课堂评价报告.pdf',
      parentKey: 'p_course_03',
      fileType: 'pdf',
      tags: ['tag_p_assessment'],
      daysAgo: 13,
      hour: 16,
      minute: 5,
      contentText: 'AI课堂评价报告汇总了课堂提问分布、学生参与热区、反馈节奏和课堂调控建议，可直接用于教学改进。',
      lastOpenedAt: createDemoTimestamp(1, 9, 35),
    }),
  ];

  demoEntries.forEach((entry) => {
    if (!existingKeys.has(entry.key)) {
      nextItems.push(entry);
    }
  });

  return nextItems;
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
  personal: ensureProfileAssociationDemoEntries(ensurePersonalKnowledgeGraphDemoEntry(buildPersonalTeachingDemo())),
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
    [ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID]: ensureOrganizationKnowledgeGraphDemoEntries([
      createOrganizationKnowledgeGraphFolder(),
    ]),
    [ORGANIZATION_CAPABILITY_MODEL_ORG_ID]: ensureOrganizationCapabilityModelDemoEntries([
      buildOrganizationCapabilityModelDemoEntries()[0],
    ]),
  },
  // 组织元信息（仅展示用，新增/删除在其他模块维护）
  organizationsMeta: DEFAULT_ORGS,
  // 当前选中状态
  currentScope: 'personal',         // 'personal' | 'organization'
  currentOrgId: ORGANIZATION_CAPABILITY_MODEL_ORG_ID,
  // 各库的当前选中文件夹（key 为 libraryId：'personal' 或 orgId）
  selectedFolderKey: {
    personal: null,
    org_default: null,
    org_rd: null,
    org_market: null,
    [ORGANIZATION_KNOWLEDGE_GRAPH_ORG_ID]: null,
    [ORGANIZATION_CAPABILITY_MODEL_ORG_ID]: null,
  },
  // 标签定义：
  //   personal: 个人资料库使用的标签与快捷标签配置
  //   organization: 组织资料库使用的标签与快捷标签配置
  //   groups.organization: 组织标签组定义
  tagDefinitions: {
    personal: normalizeTagList(PERSONAL_DEFAULT_TAGS, 'personal'),
    organization: normalizeTagList(ORGANIZATION_DEFAULT_TAGS, 'organization'),
    groups: {
      personal: mergeTagGroupLists(DEFAULT_PERSONAL_TAG_GROUPS),
      organization: mergeTagGroupLists(DEFAULT_ORGANIZATION_TAG_GROUPS),
    },
  },
  activeTagFilter: null,
};

// ====== 工具：libraryId 解析 ======
// 'personal' → 'personal'；'organization' → currentOrgId
export function getLibraryId(data, scope) {
  if (scope === 'personal') return 'personal';
  const organizations = getOrganizations(data);
  if (organizations.some((item) => item.id === data.currentOrgId)) {
    return data.currentOrgId;
  }
  return getPreferredOrganizationId(organizations);
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
  if (Array.isArray(old.organizationsMeta) && old.organizationsMeta.length) {
    next.organizationsMeta = mergeOrganizationMeta(DEFAULT_ORGS, old.organizationsMeta);
  }
  if (old.currentScope === 'personal' || old.currentScope === 'organization') {
    next.currentScope = old.currentScope;
  }
  if (typeof old.currentOrgId === 'string' && old.currentOrgId) {
    next.currentOrgId = old.currentOrgId;
  }
  // 保留个人数据
  if (!shouldResetPersonalDemo && Array.isArray(old.personal)) next.personal = old.personal;
  // 旧版本：data.organization[] → 默认组织
  if (Array.isArray(old.organization)) {
    next.organizations.org_default = old.organization;
  } else if (old.organizations && typeof old.organizations === 'object') {
    next.organizations = { ...next.organizations, ...old.organizations };
  }
  next.organizations = ensureOrganizationCapabilityModelLibrary(next.organizations);
  next.organizations = ensureOrganizationKnowledgeGraphLibrary(next.organizations);
  // 标签定义迁移：拆分为个人标签、组织标签与组织标签组
  next.tagDefinitions = getScopedTagDefinitionState({ ...next, tagDefinitions: old.tagDefinitions });
  next.personal = stripInheritedTagsFromPersonalDemoFolders(next.personal);
  next.personal = applyPersonalTeachingRootTag(next.personal);
  next.personal = ensurePersonalKnowledgeGraphDemoEntry(next.personal);
  next.personal = ensureProfileAssociationDemoEntries(next.personal);
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
  return getVisibleOrganizationsFromList(data.organizationsMeta || DEFAULT_ORGS);
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

export function addItemToLibraryId(data, libraryId = 'personal', item) {
  const scopePrefix = libraryId === 'personal' ? 'p' : 'o';
  const newItem = {
    key: `${scopePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  const next = libraryId === 'personal'
    ? {
        ...data,
        personal: [...(data.personal || []), newItem],
      }
    : {
        ...data,
        organizations: {
          ...(data.organizations || {}),
          [libraryId]: [...(data.organizations?.[libraryId] || []), newItem],
        },
      };

  saveResourceLib(next);
  return next;
}

export function renameItemByLibraryId(data, libraryId = 'personal', key, name) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return data;

  const next = libraryId === 'personal'
    ? {
        ...data,
        personal: (data.personal || []).map((item) => (
          item.key === key ? { ...item, name: normalizedName, lastEdit: now() } : item
        )),
      }
    : {
        ...data,
        organizations: {
          ...(data.organizations || {}),
          [libraryId]: (data.organizations?.[libraryId] || []).map((item) => (
            item.key === key ? { ...item, name: normalizedName, lastEdit: now() } : item
          )),
        },
      };

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

// 批量删除（文件夹则递归级联删除）
export function deleteItems(data, scope, keys = []) {
  const list = getLibraryList(data, scope);
  const targetKeys = Array.from(new Set((keys || []).filter(Boolean)));
  if (targetKeys.length === 0) return data;
  const toDel = new Set();
  const collect = (k) => {
    toDel.add(k);
    list.forEach((r) => { if (r.parentKey === k) collect(r.key); });
  };
  targetKeys.forEach(collect);
  const next = setLibraryList(data, scope, list.filter((r) => !toDel.has(r.key)));
  saveResourceLib(next);
  return next;
}

// 删除单项
export function deleteItem(data, scope, key) {
  return deleteItems(data, scope, [key]);
}

export function removeKnowledgeGraphItemsByGraphIds(data, graphIds = []) {
  const targetIds = new Set((graphIds || []).filter(Boolean));
  if (targetIds.size === 0) return data;

  const filterList = (items = []) => items.filter((item) => (
    item?.fileType !== 'knowledgeGraph'
    || !targetIds.has(item.knowledgeGraphId)
  ));

  const next = {
    ...data,
    personal: filterList(data.personal || []),
    organizations: Object.fromEntries(
      Object.entries(data.organizations || {}).map(([orgId, items]) => [orgId, filterList(items)]),
    ),
  };

  saveResourceLib(next);
  return next;
}

// 移动项目到目标文件夹
export function moveItem(data, scope, itemKey, targetFolderKey) {
  const list = getLibraryList(data, scope);
  const item = list.find((r) => r.key === itemKey);
  if (!item) return data;

  const normalizedTargetFolderKey = targetFolderKey ?? null;
  if ((item.parentKey ?? null) === normalizedTargetFolderKey) return data;

  if (normalizedTargetFolderKey) {
    const targetFolder = list.find((r) => r.key === normalizedTargetFolderKey);
    if (!targetFolder?.isFolder) return data;
  }

  // 防止将文件夹移动到自身或自身的子文件夹中
  if (item.isFolder && normalizedTargetFolderKey) {
    let currentParentKey = normalizedTargetFolderKey;
    while (currentParentKey) {
      if (currentParentKey === itemKey) return data;
      const parent = list.find((r) => r.key === currentParentKey);
      currentParentKey = parent?.parentKey ?? null;
    }
  }

  const next = setLibraryList(data, scope, list.map((r) => (
    r.key === itemKey ? { ...r, parentKey: normalizedTargetFolderKey, lastEdit: now() } : r
  )));
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

function getTagScopeKey(scope) {
  return scope === 'personal' ? 'personal' : 'organization';
}

function cleanItemTagReferences(items = [], tagId) {
  return items.map((item) => ({
    ...item,
    tags: (item.tags || []).filter((tid) => tid !== tagId),
  }));
}

// 获取标签定义：按资料库范围返回对应标签
export function getTagDefinitions(data, scope = 'organization') {
  const defs = getScopedTagDefinitionState(data);
  if (scope === 'personal') return defs.personal;
  if (scope === 'organization') return defs.organization;
  return mergeTagDefinitions(defs.organization, defs.personal);
}

export function getOrganizationTagDefinitions(data) {
  return getTagDefinitions(data, 'organization');
}

export function getTagGroups(data, scope = 'organization') {
  const defs = getScopedTagDefinitionState(data);
  const scopeKey = getTagScopeKey(scope);
  return defs.groups?.[scopeKey] || [];
}

export function getOrganizationTagGroups(data) {
  return getTagGroups(data, 'organization');
}

// 获取标签所属范围（兼容旧调用）
export function getTagOwner(data, tagId) {
  const defs = getScopedTagDefinitionState(data);
  const inPersonal = defs.personal.some((tag) => tag.id === tagId);
  const inOrganization = defs.organization.some((tag) => tag.id === tagId);
  if (inPersonal && inOrganization) return 'both';
  if (inPersonal) return 'personal';
  if (inOrganization) return 'organization';
  return null;
}

// 添加自定义标签
export function addTagDefinition(data, tag, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const newTag = {
    id: `tag_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    scope: scopeKey,
    quick: false,
    ...tag,
  };
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scopeKey]: [...(defs[scopeKey] || []), newTag],
    },
  };
  saveResourceLib(next);
  return next;
}

// 删除标签
export function deleteTagDefinition(data, tagId, scope = 'organization') {
  const isPreset = PRESET_TAG_IDS.has(tagId);
  if (isPreset) return data;

  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const nextTagDefinitions = {
    ...defs,
    [scopeKey]: (defs[scopeKey] || []).filter((tag) => tag.id !== tagId),
    groups: {
      ...(defs.groups || {}),
      [scopeKey]: (defs.groups?.[scopeKey] || []).map((group) => ({
        ...group,
        tagIds: (group.tagIds || []).filter((tid) => tid !== tagId),
      })),
    },
  };

  const next = scopeKey === 'personal'
    ? {
        ...data,
        activeTagFilter: data.activeTagFilter === tagId ? null : data.activeTagFilter,
        tagDefinitions: nextTagDefinitions,
        personal: cleanItemTagReferences(data.personal || [], tagId),
      }
    : {
        ...data,
        activeTagFilter: data.activeTagFilter === tagId ? null : data.activeTagFilter,
        tagDefinitions: nextTagDefinitions,
        organizations: Object.fromEntries(
          Object.entries(data.organizations || {}).map(([orgId, items]) => [orgId, cleanItemTagReferences(items, tagId)]),
        ),
      };

  saveResourceLib(next);
  return next;
}

// 重命名标签
export function renameTagDefinition(data, tagId, newName, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scopeKey]: (defs[scopeKey] || []).map((tag) => (tag.id === tagId ? { ...tag, name: newName } : tag)),
    },
  };
  saveResourceLib(next);
  return next;
}

// 修改标签颜色
export function updateTagColor(data, tagId, newColor, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scopeKey]: (defs[scopeKey] || []).map((tag) => (tag.id === tagId ? { ...tag, color: newColor } : tag)),
    },
  };
  saveResourceLib(next);
  return next;
}

export function toggleTagQuickAccess(data, tagId, quick, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  let changed = false;
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scopeKey]: (defs[scopeKey] || []).map((tag) => {
        if (tag.id !== tagId) return tag;
        if (tag.quick === quick) return tag;
        changed = true;
        return { ...tag, quick };
      }),
    },
  };
  if (!changed) return data;
  saveResourceLib(next);
  return next;
}

// 标签拖动排序
export function reorderTagDefinition(data, fromIdx, toIdx, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const list = [...(defs[scopeKey] || [])];
  if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx > list.length) return data;
  const [moved] = list.splice(fromIdx, 1);
  const insertAt = toIdx > fromIdx ? toIdx - 1 : toIdx;
  list.splice(insertAt, 0, moved);
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      [scopeKey]: list,
    },
  };
  saveResourceLib(next);
  return next;
}

export function addTagGroup(data, group, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const nextGroup = normalizeTagGroupList([{
    id: `tag_group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...group,
  }])[0];
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      groups: {
        ...(defs.groups || {}),
        [scopeKey]: [...(defs.groups?.[scopeKey] || []), nextGroup],
      },
    },
  };
  saveResourceLib(next);
  return next;
}

export function updateTagGroup(data, groupId, patch, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  let changed = false;
  const nextGroups = (defs.groups?.[scopeKey] || []).map((group) => {
    if (group.id !== groupId) return group;
    changed = true;
    return normalizeTagGroupList([{ ...group, ...patch }])[0];
  });
  if (!changed) return data;
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      groups: {
        ...(defs.groups || {}),
        [scopeKey]: nextGroups,
      },
    },
  };
  saveResourceLib(next);
  return next;
}

export function deleteTagGroup(data, groupId, scope = 'organization') {
  const scopeKey = getTagScopeKey(scope);
  const defs = getScopedTagDefinitionState(data);
  const next = {
    ...data,
    tagDefinitions: {
      ...defs,
      groups: {
        ...(defs.groups || {}),
        [scopeKey]: (defs.groups?.[scopeKey] || []).filter((group) => group.id !== groupId),
      },
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

export function getLibraryItemsById(data, libraryId = 'personal') {
  if (libraryId === 'personal') return data.personal || [];
  return data.organizations?.[libraryId] || [];
}

export function getLibraryNameById(data, libraryId = 'personal') {
  if (libraryId === 'personal') return '个人库';
  const org = getOrganizations(data).find((item) => item.id === libraryId);
  return org?.name || libraryId;
}

export function buildLibraryItemMap(data, libraryId = 'personal') {
  return new Map(getLibraryItemsById(data, libraryId).map((item) => [item.key, item]));
}

export function getLibraryItemPath(data, libraryId = 'personal', itemOrKey) {
  const itemMap = buildLibraryItemMap(data, libraryId);
  const item = typeof itemOrKey === 'string' ? itemMap.get(itemOrKey) : itemOrKey;
  if (!item) return getLibraryNameById(data, libraryId);

  const pathParts = [getLibraryNameById(data, libraryId)];
  const parents = [];
  let cursor = item.parentKey ? itemMap.get(item.parentKey) : null;
  while (cursor) {
    parents.push(cursor.name);
    cursor = cursor.parentKey ? itemMap.get(cursor.parentKey) : null;
  }
  pathParts.push(...parents.reverse(), item.name);
  return pathParts.join(' / ');
}

export function getLibrarySubtreeItems(data, libraryId = 'personal', rootKey, options = {}) {
  const { includeRoot = true } = options;
  const list = getLibraryItemsById(data, libraryId);
  const rootItem = list.find((item) => item.key === rootKey);
  if (!rootItem) return [];
  const childrenMap = new Map();
  list.forEach((item) => {
    const parentKey = item.parentKey ?? null;
    if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
    childrenMap.get(parentKey).push(item);
  });

  const result = [];
  const visit = (item) => {
    result.push(item);
    const children = childrenMap.get(item.key) || [];
    children.forEach(visit);
  };

  if (includeRoot) {
    visit(rootItem);
  } else {
    const children = childrenMap.get(rootItem.key) || [];
    children.forEach(visit);
  }

  return result;
}

export function getLibraryDescendantFiles(data, libraryId = 'personal', rootKey) {
  return getLibrarySubtreeItems(data, libraryId, rootKey, { includeRoot: false })
    .filter((item) => !item.isFolder);
}

export function getAllLibraryEntriesAcrossLibraries(data) {
  const out = [];
  const orgs = getOrganizations(data);
  const orgNameMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

  (data.personal || []).forEach((item) => {
    out.push({ ...item, libraryId: 'personal', libraryName: '个人库', libraryScope: 'personal' });
  });

  Object.entries(data.organizations || {}).forEach(([orgId, list]) => {
    (list || []).forEach((item) => {
      out.push({
        ...item,
        libraryId: orgId,
        libraryName: orgNameMap[orgId] || orgId,
        libraryScope: 'organization',
      });
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
