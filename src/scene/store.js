const TEMPLATE_STORAGE_KEY = 'gr.scene.templates.v1';
const SCENE_STORAGE_KEY = 'gr.scenes.v1';
const SEED_KEY = 'gr.scene.seeded.v1';
const STORE_CHANGE_EVENT = 'gr:scene-store-change';
const VERSION_STORAGE_KEY = 'guoren_version_data';

export const SCENE_TYPE_OPTIONS = [
  { value: 'TEACHING', label: '教学场景' },
  { value: 'RESEARCH', label: '教研场景' },
  { value: 'TRAINING', label: '培训场景' },
  { value: 'COMMUNITY', label: '社区共创' },
  { value: 'CUSTOM', label: '自定义场景' },
];

export const SCENE_MENU_OPTIONS = [
  { value: 'my-learning-space', label: '我的学习空间' },
  { value: 'workshop', label: '研讨会' },
  { value: 'study-club-channel', label: '研习社-频道' },
  { value: 'my-classroom', label: '我的课堂' },
  { value: 'workshop-cloud', label: '工作坊' },
  { value: 'teaching-research', label: '教研空间' },
  { value: 'org-training', label: '组织培训' },
];

export const TEMPLATE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'DISABLED', label: '停用' },
];

export const SCENE_VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: '公开' },
  { value: 'PRIVATE', label: '私密' },
  { value: 'INTERNAL', label: '组织内可见' },
];

export const SCENE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '运行中' },
  { value: 'ARCHIVED', label: '已归档' },
];

export const TOOL_OPTIONS = [
  { value: 'ONLINE_DOC', label: '在线文档' },
  { value: 'WHITEBOARD', label: '白板' },
  { value: 'IM', label: 'IM' },
  { value: 'FORUM', label: '论坛' },
  { value: 'LIVE', label: '直播' },
  { value: 'VOTE', label: '投票' },
  { value: 'REGISTER', label: '报名' },
  { value: 'ASSESSMENT', label: '测评' },
  { value: 'SURVEY', label: '调查' },
  { value: 'EXAM', label: '考试' },
  { value: 'CHAIN', label: '接龙' },
  { value: 'REVIEW_360', label: '360评估' },
  { value: 'COMPETITION', label: '大赛' },
  { value: 'RESOURCE_LIBRARY', label: '资料库' },
  { value: 'OFFICE_UPLOAD', label: 'Office文件上传' },
  { value: 'URL', label: '网址' },
  { value: 'KNOWLEDGE_GRAPH', label: '知识图谱' },
  { value: 'CAPABILITY_MODEL', label: '能力模型' },
  { value: 'ONLINE_VIDEO', label: '在线视频' },
];

export const TOOL_PLACEMENT_OPTIONS = [
  { value: 'RESOURCE_AREA', label: '资料区' },
  { value: 'RESULT_AREA', label: '创作结果区' },
  { value: 'BOTH', label: '两侧都显示' },
];

export const ENTRY_METHOD_OPTIONS = [
  { value: 'MANUAL', label: '手工添加' },
  { value: 'BATCH_IMPORT', label: '批量导入' },
  { value: 'FORM_TEMPLATE', label: '报名表单模板' },
  { value: 'INVITATION', label: '邀请链接 / 二维码' },
  { value: 'LEARNING_SQUARE', label: '学习广场' },
];

export const METADATA_FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: '文本' },
  { value: 'TEXTAREA', label: '多行文本' },
  { value: 'DATE', label: '日期' },
  { value: 'DATETIME', label: '日期时间' },
  { value: 'NUMBER', label: '数字' },
  { value: 'SELECT', label: '单选枚举' },
];

export const HOME_INTRO_MODE_OPTIONS = [
  { value: 'MANUAL', label: '人工编辑' },
  { value: 'AI', label: 'AI 生成' },
  { value: 'AI_OR_MANUAL', label: '人工 / AI 均可' },
];

export const ROLE_FUNCTION_PERMISSION_OPTIONS = [
  { value: 'TOPIC_EDIT', label: '主题配置管理' },
  { value: 'RESOURCE_CREATE', label: '新增资料' },
  { value: 'RESOURCE_EDIT', label: '资料编辑' },
  { value: 'RESOURCE_DELETE', label: '资料删除' },
  { value: 'TOOL_USE', label: '工具使用' },
  { value: 'LIVE_ACTIVITY_MANAGE', label: '直播/活动管理' },
  { value: 'ASSESSMENT_CONFIG', label: '考核配置' },
  { value: 'RESULT_SUBMIT', label: '成果提交' },
  { value: 'RESULT_REVIEW', label: '评阅反馈' },
  { value: 'COMMENT_INTERACT', label: '互动评论' },
  { value: 'MEMBER_MANAGE', label: '成员管理' },
  { value: 'DATA_EXPORT', label: '数据导出' },
];

export const ROLE_DATA_SCOPE_OPTIONS = [
  { value: 'ALL', label: '全部数据' },
  { value: 'ASSIGNED', label: '授权范围' },
  { value: 'OWN', label: '本人负责 / 创建' },
  { value: 'PARTICIPATED', label: '参与内容' },
  { value: 'PUBLIC', label: '公开内容' },
];

export const ROLE_DATA_ACCESS_AREA_OPTIONS = [
  { value: 'TOPIC_METADATA', label: '主题元数据' },
  { value: 'RESOURCE_AREA', label: '资料区' },
  { value: 'RESULT_AREA', label: '创作结果区' },
  { value: 'ASSESSMENT_DATA', label: '考核与评阅数据' },
  { value: 'MEMBER_DATA', label: '成员信息' },
  { value: 'OPERATION_DATA', label: '运营报表' },
];

export const MODE_TAB_PRESET_OPTIONS = [
  { value: 'knowledge', label: '知识模式' },
  { value: 'ai', label: 'AI模式' },
  { value: 'practice', label: '实训模式' },
  { value: 'assessment', label: '考核配置模式' },
];

export const VERSION_CREATE_MODE_OPTIONS = [
  { value: 'COPY_ACTIVE', label: '继承当前版本内容' },
  { value: 'EMPTY', label: '创建空白版本' },
];

const MODE_TAB_LABEL_MAP = Object.fromEntries(
  MODE_TAB_PRESET_OPTIONS.map((item) => [item.value, item.label]),
);

const DEFAULT_VERSIONING_CONFIG = Object.freeze({
  enabled: true,
  maxVersions: 5,
  namePattern: '版本 {index}',
  createMode: 'COPY_ACTIVE',
  allowRollback: true,
  allowDeletePublished: true,
  description: '',
});

const BUILT_IN_ROLE_AUTHORIZATION = {
  'TEACHING:teacher': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'RESULT_REVIEW'],
    dataAccessScope: 'ALL',
    dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
  },
  'TEACHING:student': {
    functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
  },
  'RESEARCH:leader': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA', 'MEMBER_DATA'],
  },
  'RESEARCH:teacher': {
    functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'TOPIC_METADATA'],
  },
  'RESEARCH:expert': {
    functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
    dataAccessScope: 'ASSIGNED',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
  },
  'TRAINING:admin': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA', 'MEMBER_DATA', 'OPERATION_DATA'],
  },
  'TRAINING:reviewer': {
    functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
    dataAccessScope: 'ASSIGNED',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
  },
  'TRAINING:student': {
    functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
  },
  'COMMUNITY:operator': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'MEMBER_MANAGE', 'COMMENT_INTERACT', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'MEMBER_DATA', 'OPERATION_DATA'],
  },
  'COMMUNITY:member': {
    functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'OWN',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA'],
  },
  'COMMUNITY:observer': {
    functionalPermissions: ['TOOL_USE', 'COMMENT_INTERACT'],
    dataAccessScope: 'PUBLIC',
    dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA'],
  },
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function nowIso() {
  return new Date().toISOString();
}

function nowText() {
  return new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function trimToNull(value) {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readList(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[scene-store] failed to read ${storageKey}`, error);
    return [];
  }
}

function writeList(storageKey, list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

export function getSceneStoreChangeEventName() {
  return STORE_CHANGE_EVENT;
}

function optionLabel(options, value, fallback = '-') {
  return options.find((item) => item.value === value)?.label || fallback;
}

export function getSceneTypeLabel(value) {
  return optionLabel(SCENE_TYPE_OPTIONS, value, value || '-');
}

export function getSceneMenuLabel(value) {
  return optionLabel(SCENE_MENU_OPTIONS, value, value || '-');
}

export function getSceneVisibilityLabel(value) {
  return optionLabel(SCENE_VISIBILITY_OPTIONS, value, value || '-');
}

export function getTemplateStatusLabel(value) {
  return optionLabel(TEMPLATE_STATUS_OPTIONS, value, value || '-');
}

function defaultMenuKeyByType(sceneType) {
  switch (sceneType) {
    case 'TEACHING':
      return 'my-classroom';
    case 'RESEARCH':
      return 'teaching-research';
    case 'TRAINING':
      return 'org-training';
    case 'COMMUNITY':
      return 'study-club-channel';
    default:
      return 'my-learning-space';
  }
}

function getModeTabDefaultLabel(key) {
  return MODE_TAB_LABEL_MAP[key] || null;
}

function getDefaultRoleAuthorization(sceneType, roleKey) {
  return BUILT_IN_ROLE_AUTHORIZATION[`${sceneType}:${roleKey}`] || null;
}

function normalizeModeTab(modeTab, preset, index) {
  return {
    id: modeTab?.id || `mode_${preset.value}_${index + 1}`,
    key: preset.value,
    label: trimToNull(modeTab?.label) || getModeTabDefaultLabel(preset.value) || preset.label || `模式${index + 1}`,
    enabled: modeTab?.enabled !== false,
    resourcePanelTitle: trimToNull(modeTab?.resourcePanelTitle) || '',
    addResourceLabel: trimToNull(modeTab?.addResourceLabel) || '',
    appLabel: trimToNull(modeTab?.appLabel) || '',
    emptyStateText: trimToNull(modeTab?.emptyStateText) || '',
  };
}

function createModeTabs(labels = {}, modeConfigs = {}) {
  return MODE_TAB_PRESET_OPTIONS.map((item, index) => normalizeModeTab({
    ...(modeConfigs[item.value] || {}),
    key: item.value,
    label: labels[item.value] || modeConfigs[item.value]?.label || item.label,
    enabled: modeConfigs[item.value]?.enabled !== false,
  }, item, index));
}

function ensureModeTabs(modeTabs) {
  const hasConfiguredTabs = Array.isArray(modeTabs);
  const byKey = new Map(
    (hasConfiguredTabs ? modeTabs : [])
      .filter((item) => item !== null && typeof item !== 'undefined')
      .map((item) => [item?.key, item]),
  );
  return MODE_TAB_PRESET_OPTIONS.map((item, index) => normalizeModeTab(
    byKey.get(item.value) || (hasConfiguredTabs ? { key: item.value, enabled: false } : null),
    item,
    index,
  ));
}

export function normalizeVersioningConfig(input = {}) {
  const maxVersions = Number.parseInt(input?.maxVersions, 10);
  return {
    enabled: input?.enabled !== false,
    maxVersions: Number.isFinite(maxVersions)
      ? Math.min(Math.max(maxVersions, 1), 20)
      : DEFAULT_VERSIONING_CONFIG.maxVersions,
    namePattern: trimToNull(input?.namePattern) || DEFAULT_VERSIONING_CONFIG.namePattern,
    createMode: VERSION_CREATE_MODE_OPTIONS.some((item) => item.value === input?.createMode)
      ? input.createMode
      : DEFAULT_VERSIONING_CONFIG.createMode,
    allowRollback: input?.allowRollback !== false,
    allowDeletePublished: input?.allowDeletePublished !== false,
    description: trimToNull(input?.description) || '',
  };
}

export function formatVersionName(namePattern, index) {
  const pattern = trimToNull(namePattern) || DEFAULT_VERSIONING_CONFIG.namePattern;
  const versionIndex = Number.isFinite(Number(index)) ? Number(index) : 1;
  if (pattern.includes('{index}')) {
    return pattern.replace(/\{index\}/g, String(versionIndex));
  }
  return `${pattern} ${versionIndex}`;
}

function normalizeRole(role, index, sceneType, builtIn) {
  const roleKey = trimToNull(role?.key) || `role_${index + 1}`;
  const defaultAuthorization = builtIn ? getDefaultRoleAuthorization(sceneType, roleKey) : null;
  return {
    id: role?.id || roleKey,
    key: roleKey,
    name: trimToNull(role?.name) || `角色${index + 1}`,
    description: trimToNull(role?.description) || '',
    agentName: trimToNull(role?.agentName) || '',
    functionalPermissions: Array.isArray(role?.functionalPermissions)
      ? role.functionalPermissions.filter(Boolean)
      : (defaultAuthorization?.functionalPermissions || []),
    permissionSummary: trimToNull(role?.permissionSummary) || '',
    dataAccessScope: Object.prototype.hasOwnProperty.call(role || {}, 'dataAccessScope')
      ? (trimToNull(role?.dataAccessScope) || 'ASSIGNED')
      : (defaultAuthorization?.dataAccessScope || 'ASSIGNED'),
    dataAccessAreas: Array.isArray(role?.dataAccessAreas)
      ? role.dataAccessAreas.filter(Boolean)
      : (defaultAuthorization?.dataAccessAreas || []),
    scopeSummary: trimToNull(role?.scopeSummary) || '',
  };
}

export function createRoleDraft(seed = 1) {
  return {
    id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    name: `角色${seed}`,
    description: '',
    agentName: '',
    functionalPermissions: ['TOOL_USE'],
    permissionSummary: '',
    dataAccessScope: 'ASSIGNED',
    dataAccessAreas: ['RESOURCE_AREA'],
    scopeSummary: '',
  };
}

function normalizeMetadataField(field, index) {
  return {
    id: field?.id || createId(`field_${index}`),
    key: trimToNull(field?.key) || `field_${index + 1}`,
    label: trimToNull(field?.label) || `字段${index + 1}`,
    type: trimToNull(field?.type) || 'TEXT',
    required: Boolean(field?.required),
    description: trimToNull(field?.description) || '',
  };
}

function normalizeStatusRule(rule, index) {
  return {
    id: rule?.id || createId(`rule_${index}`),
    name: trimToNull(rule?.name) || `规则${index + 1}`,
    description: trimToNull(rule?.description) || '',
  };
}

function normalizeToolConfig(tool, index) {
  return {
    id: tool?.id || createId(`tool_${index}`),
    key: trimToNull(tool?.key) || trimToNull(tool?.name) || `tool_${index + 1}`,
    name: trimToNull(tool?.name) || `工具${index + 1}`,
    placement: trimToNull(tool?.placement) || 'RESOURCE_AREA',
    enabled: tool?.enabled !== false,
    description: trimToNull(tool?.description) || '',
  };
}

function normalizeFolderType(folder, index) {
  return {
    id: folder?.id || createId(`folder_${index}`),
    key: trimToNull(folder?.key) || `folder_${index + 1}`,
    name: trimToNull(folder?.name) || `文件夹类型${index + 1}`,
    description: trimToNull(folder?.description) || '',
    roleIds: Array.isArray(folder?.roleIds) ? folder.roleIds.filter(Boolean) : [],
    allowedTools: Array.isArray(folder?.allowedTools) ? folder.allowedTools.filter(Boolean) : [],
    required: Boolean(folder?.required),
  };
}

function normalizeAgent(agent, index) {
  return {
    id: agent?.id || createId(`agent_${index}`),
    name: trimToNull(agent?.name) || `智能体${index + 1}`,
    roleIds: Array.isArray(agent?.roleIds) ? agent.roleIds.filter(Boolean) : [],
    knowledgeSource: trimToNull(agent?.knowledgeSource) || '',
    prompt: trimToNull(agent?.prompt) || '',
    avatar: trimToNull(agent?.avatar) || '',
  };
}

function normalizeTemplate(input = {}) {
  const sceneType = trimToNull(input.sceneType) || 'CUSTOM';
  const builtIn = Boolean(input.builtIn);
  const roles = (Array.isArray(input.roles) ? input.roles : []).map((role, index) => (
    normalizeRole(role, index, sceneType, builtIn)
  ));
  const roleIdMap = new Map();
  roles.forEach((role) => {
    roleIdMap.set(role.id, role.id);
    roleIdMap.set(role.key, role.id);
  });
  const normalizeRoleIds = (roleIds) => (
    (Array.isArray(roleIds) ? roleIds : [])
      .map((roleId) => roleIdMap.get(roleId) || roleId)
      .filter(Boolean)
  );
  return {
    id: input.id || createId('tpl'),
    templateCode: trimToNull(input.templateCode) || `TPL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: trimToNull(input.name) || '未命名场景模板',
    sceneType,
    defaultMenuKey: trimToNull(input.defaultMenuKey) || defaultMenuKeyByType(sceneType),
    description: trimToNull(input.description) || '',
    status: trimToNull(input.status) || 'ACTIVE',
    builtIn,
    theme: {
      badgeText: trimToNull(input.theme?.badgeText) || getSceneTypeLabel(sceneType),
      emoji: trimToNull(input.theme?.emoji) || '🧩',
      topicThemeMode: trimToNull(input.theme?.topicThemeMode) || 'DEFAULT',
      coverStart: trimToNull(input.theme?.coverStart) || '#4f8cff',
      coverEnd: trimToNull(input.theme?.coverEnd) || '#7ee4ff',
      accentColor: trimToNull(input.theme?.accentColor) || '#3b82f6',
      heroTitle: trimToNull(input.theme?.heroTitle) || '可配置场景模板',
      heroSubtitle: trimToNull(input.theme?.heroSubtitle) || '通过角色、资料结构、工具与主题页面配置快速生成空间场景。',
      surfaceHint: trimToNull(input.theme?.surfaceHint) || '适用于多种业务场景',
    },
    homepage: {
      templateName: trimToNull(input.homepage?.templateName) || '标准主页模板',
      introMode: trimToNull(input.homepage?.introMode) || 'AI_OR_MANUAL',
      introText: trimToNull(input.homepage?.introText) || '',
    },
    topicPage: {
      resourcePanelTitle: trimToNull(input.topicPage?.resourcePanelTitle) || '资料',
      addResourceLabel: trimToNull(input.topicPage?.addResourceLabel) || '添加资料',
      appLabel: trimToNull(input.topicPage?.appLabel) || '应用',
      emptyStateText: trimToNull(input.topicPage?.emptyStateText) || '暂无资料，右键新建文件夹或添加资料',
      modeTabs: ensureModeTabs(input.topicPage?.modeTabs),
    },
    roles,
    metadataFields: (Array.isArray(input.metadataFields) ? input.metadataFields : []).map(normalizeMetadataField),
    statusRules: (Array.isArray(input.statusRules) ? input.statusRules : []).map(normalizeStatusRule),
    toolAreas: {
      resourceAreaTools: Array.isArray(input.toolAreas?.resourceAreaTools)
        ? input.toolAreas.resourceAreaTools.filter(Boolean)
        : [],
      resultAreaTools: Array.isArray(input.toolAreas?.resultAreaTools)
        ? input.toolAreas.resultAreaTools.filter(Boolean)
        : [],
    },
    toolConfigs: (Array.isArray(input.toolConfigs) ? input.toolConfigs : []).map(normalizeToolConfig),
    folderTypes: (Array.isArray(input.folderTypes) ? input.folderTypes : []).map((folder, index) => (
      {
        ...normalizeFolderType(folder, index),
        roleIds: normalizeRoleIds(folder?.roleIds),
      }
    )),
    agents: (Array.isArray(input.agents) ? input.agents : []).map((agent, index) => (
      {
        ...normalizeAgent(agent, index),
        roleIds: normalizeRoleIds(agent?.roleIds),
      }
    )),
    entryMethods: Array.isArray(input.entryMethods) ? input.entryMethods.filter(Boolean) : [],
    recommendation: {
      enabled: input.recommendation?.enabled !== false,
      resourceScope: trimToNull(input.recommendation?.resourceScope) || '',
      description: trimToNull(input.recommendation?.description) || '',
    },
    versioning: normalizeVersioningConfig(input.versioning),
    createdAt: input.createdAt || nowIso(),
    updatedAt: input.updatedAt || nowIso(),
  };
}

function normalizeScene(input = {}, templates = []) {
  const template =
    templates.find((item) => item.id === input.templateId) ||
    (input.templateSnapshot ? normalizeTemplate(input.templateSnapshot) : null);
  if (!template) {
    throw new Error('场景缺少有效模板');
  }
  return {
    id: input.id || createId('scene'),
    sceneCode: trimToNull(input.sceneCode) || `SCN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: trimToNull(input.name) || '未命名场景',
    description: trimToNull(input.description) || template.theme.heroSubtitle || '',
    owner: trimToNull(input.owner) || '',
    visibility: trimToNull(input.visibility) || 'PUBLIC',
    status: trimToNull(input.status) || 'ACTIVE',
    menuKey: trimToNull(input.menuKey) || template.defaultMenuKey,
    topicCount: Number.isFinite(Number(input.topicCount)) ? Number(input.topicCount) : 0,
    templateId: template.id,
    templateName: template.name,
    templateCode: template.templateCode,
    sceneType: template.sceneType,
    storageScopeKey: trimToNull(input.storageScopeKey) || `scene:${input.id || createId('scope')}`,
    templateSnapshot: clone(template),
    createdAt: input.createdAt || nowIso(),
    updatedAt: input.updatedAt || nowIso(),
  };
}

function readTemplates() {
  return readList(TEMPLATE_STORAGE_KEY).map(normalizeTemplate);
}

function readScenes(templates = readTemplates()) {
  return readList(SCENE_STORAGE_KEY).map((item) => normalizeScene(item, templates));
}

function assertUniqueCode(list, fieldName, code, currentId, label) {
  const normalized = trimToNull(code);
  if (!normalized) return;
  const matched = list.find((item) => item[fieldName] === normalized && item.id !== currentId);
  if (matched) {
    throw new Error(`${label}已存在，请调整后重试`);
  }
}

function buildPresetTemplates() {
  const presets = [
    {
      id: 'tpl_teaching_builtin',
      templateCode: 'TPL-TEACHING',
      name: '教学场景',
      sceneType: 'TEACHING',
      defaultMenuKey: 'my-classroom',
      description: '面向课堂授课、课程学习和课后练习的教学空间模板。',
      builtIn: true,
      theme: {
        badgeText: '课堂教学',
        emoji: '📘',
        coverStart: '#3568ff',
        coverEnd: '#6fd6ff',
        accentColor: '#2f64f2',
        heroTitle: '以课程、作业和课堂互动为核心的教学空间',
        heroSubtitle: '支持教师组织授课、学生学习、练习与课后反馈。',
        surfaceHint: '课程课件、作业、练习、课堂互动',
      },
      homepage: {
        templateName: '课程主页模板',
        introMode: 'AI_OR_MANUAL',
        introText: '用于呈现课程目标、学习路径、课前提醒与课堂说明。',
      },
      topicPage: {
        resourcePanelTitle: '课程资料',
        addResourceLabel: '添加课件',
        appLabel: '教学工具',
        emptyStateText: '暂无课件，可先创建课程目录或上传资料',
        modeTabs: createModeTabs({
          knowledge: '课程资料',
          ai: 'AI助教',
          practice: '课堂练习',
          assessment: '作业考核',
        }),
      },
      roles: [
        {
          key: 'teacher',
          name: '教师',
          agentName: 'AI助教',
          functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'RESULT_REVIEW'],
          permissionSummary: '可管理主题、资料、作业和课堂工具',
          dataAccessScope: 'ALL',
          dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
          scopeSummary: '拥有全部资料和主题的编辑权限',
          description: '负责授课、布置任务和过程指导。',
        },
        {
          key: 'student',
          name: '学生',
          agentName: '学习助手',
          functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
          permissionSummary: '可查看资料、提交练习、参与互动',
          dataAccessScope: 'PARTICIPATED',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
          scopeSummary: '仅可访问教学公开内容与个人任务',
          description: '参与课程学习和课堂活动。',
        },
      ],
      metadataFields: [
        { key: 'class_name', label: '授课班级', type: 'TEXT', required: true, description: '例如：高一(3)班' },
        { key: 'start_time', label: '开始时间', type: 'DATETIME', required: true },
        { key: 'end_time', label: '结束时间', type: 'DATETIME', required: true },
        { key: 'course_target', label: '课程目标', type: 'TEXTAREA', required: false },
      ],
      statusRules: [
        { name: '备课中', description: '仅教师可编辑资料与课堂工具。' },
        { name: '上课中', description: '开放课堂互动、练习和问答。' },
        { name: '已结课', description: '保留回看与作业复盘，停止编辑。' },
      ],
      toolAreas: {
        resourceAreaTools: ['ONLINE_DOC', 'RESOURCE_LIBRARY', 'OFFICE_UPLOAD', 'LIVE'],
        resultAreaTools: ['WHITEBOARD', 'FORUM', 'EXAM'],
      },
      toolConfigs: [
        { key: 'live', name: '直播', placement: 'RESOURCE_AREA', enabled: true, description: '课堂直播、答疑与回放。' },
        { key: 'exam', name: '考试', placement: 'RESULT_AREA', enabled: true, description: '课堂测验与作业考核。' },
        { key: 'forum', name: '论坛', placement: 'RESULT_AREA', enabled: true, description: '课后讨论与答疑沉淀。' },
      ],
      folderTypes: [
        { key: 'courseware', name: '课程课件', required: true, allowedTools: ['ONLINE_DOC', 'OFFICE_UPLOAD'], roleIds: ['teacher'], description: '用于沉淀讲义、讲稿和参考资料。' },
        { key: 'practice', name: '课堂练习', required: true, allowedTools: ['EXAM', 'SURVEY'], roleIds: ['teacher', 'student'], description: '课堂练习与即时反馈。' },
        { key: 'homework', name: '作业提交', required: true, allowedTools: ['ONLINE_DOC', 'OFFICE_UPLOAD'], roleIds: ['teacher', 'student'], description: '用于发布和收集课后作业。' },
        { key: 'showcase', name: '优秀成果', required: false, allowedTools: ['ONLINE_DOC', 'URL'], roleIds: ['teacher'], description: '展示优秀作业与学习成果。' },
      ],
      agents: [
        { name: 'AI助教', roleIds: ['teacher'], knowledgeSource: '课程资料', prompt: '辅助教师生成讲解提纲、课堂问答与练习题。', avatar: '🧑‍🏫' },
        { name: '学习助手', roleIds: ['student'], knowledgeSource: '课程资料与作业', prompt: '为学生提供答疑、学习建议与练习反馈。', avatar: '🤖' },
      ],
      entryMethods: ['MANUAL', 'BATCH_IMPORT', 'INVITATION', 'LEARNING_SQUARE'],
      recommendation: {
        enabled: true,
        resourceScope: '当前教学场景内的资料与作业',
        description: '根据课程进度、学习记录和作业完成度推荐资源。',
      },
    },
    {
      id: 'tpl_research_builtin',
      templateCode: 'TPL-RESEARCH',
      name: '教研场景',
      sceneType: 'RESEARCH',
      defaultMenuKey: 'teaching-research',
      description: '用于教研组共创、听评课复盘和课题协作的教研空间模板。',
      builtIn: true,
      theme: {
        badgeText: '教研共创',
        emoji: '🧠',
        coverStart: '#0f766e',
        coverEnd: '#72f0cf',
        accentColor: '#14867a',
        heroTitle: '围绕备课、听评课与课题协作的教研空间',
        heroSubtitle: '支持教研组研讨、共创文档和成果沉淀。',
        surfaceHint: '听评课、共创文档、课题资料、研讨纪要',
      },
      homepage: {
        templateName: '教研主页模板',
        introMode: 'MANUAL',
        introText: '聚合教研议题、会议纪要、课题资料与阶段成果。',
      },
      topicPage: {
        resourcePanelTitle: '教研资料',
        addResourceLabel: '添加资料',
        appLabel: '教研工具',
        emptyStateText: '暂无教研资料，可先创建议题目录或上传共创材料',
        modeTabs: createModeTabs({
          knowledge: '议题资料',
          ai: 'AI共创',
          practice: '研讨协作',
          assessment: '阶段评审',
        }),
      },
      roles: [
        {
          key: 'leader',
          name: '教研负责人',
          agentName: 'AI教研助手',
          functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
          permissionSummary: '维护议题、阶段目标和成果产出',
          dataAccessScope: 'ALL',
          dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA', 'MEMBER_DATA'],
          scopeSummary: '可管理全部主题与资料结构',
          description: '负责教研活动组织与成果验收。',
        },
        {
          key: 'teacher',
          name: '参与教师',
          agentName: '备课助手',
          functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
          permissionSummary: '参与研讨、提交材料、共创文档',
          dataAccessScope: 'PARTICIPATED',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'TOPIC_METADATA'],
          scopeSummary: '可编辑参与议题下的资料与文档',
          description: '围绕课堂问题共创方案。',
        },
        {
          key: 'expert',
          name: '专家顾问',
          agentName: '点评助手',
          functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
          permissionSummary: '可评阅资料、提供建议与结论',
          dataAccessScope: 'ASSIGNED',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
          scopeSummary: '可查看全部资料并在评审区评论',
          description: '提供专业点评与外部建议。',
        },
      ],
      metadataFields: [
        { key: 'research_theme', label: '教研主题', type: 'TEXT', required: true },
        { key: 'host_dept', label: '组织部门', type: 'TEXT', required: true },
        { key: 'meeting_time', label: '研讨时间', type: 'DATETIME', required: false },
        { key: 'semester', label: '学期', type: 'SELECT', required: false, description: '如：2026春季学期' },
      ],
      statusRules: [
        { name: '筹备中', description: '聚焦议题征集与资料预热。' },
        { name: '研讨中', description: '开放论坛、白板和共创文档协同。' },
        { name: '已归档', description: '固化成果，保留浏览与复盘入口。' },
      ],
      toolAreas: {
        resourceAreaTools: ['ONLINE_DOC', 'RESOURCE_LIBRARY', 'WHITEBOARD'],
        resultAreaTools: ['FORUM', 'LIVE', 'ONLINE_DOC'],
      },
      toolConfigs: [
        { key: 'whiteboard', name: '白板', placement: 'RESOURCE_AREA', enabled: true, description: '用于共创脑暴与研讨整理。' },
        { key: 'forum', name: '论坛', placement: 'RESULT_AREA', enabled: true, description: '沉淀听评课意见与研讨结论。' },
        { key: 'live', name: '直播/会议', placement: 'RESULT_AREA', enabled: true, description: '在线教研会议与专家连线。' },
      ],
      folderTypes: [
        { key: 'topic_pool', name: '议题池', required: true, allowedTools: ['ONLINE_DOC'], roleIds: ['leader', 'teacher'], description: '收集教研问题、议题和背景说明。' },
        { key: 'lesson_review', name: '听评课资料', required: true, allowedTools: ['ONLINE_DOC', 'OFFICE_UPLOAD', 'ONLINE_VIDEO'], roleIds: ['leader', 'teacher', 'expert'], description: '沉淀课堂实录、评课记录与反思。' },
        { key: 'co_creation', name: '共创产出', required: true, allowedTools: ['ONLINE_DOC', 'WHITEBOARD'], roleIds: ['leader', 'teacher'], description: '教案、方案和共创内容。' },
        { key: 'minutes', name: '会议纪要', required: false, allowedTools: ['ONLINE_DOC'], roleIds: ['leader'], description: '教研会议纪要与行动项。' },
      ],
      agents: [
        { name: 'AI教研助手', roleIds: ['leader'], knowledgeSource: '议题池与会议纪要', prompt: '帮助沉淀议题、总结研讨结论和生成行动清单。', avatar: '🧭' },
        { name: '备课助手', roleIds: ['teacher'], knowledgeSource: '听评课资料与共创产出', prompt: '辅助生成课堂优化建议与备课提纲。', avatar: '📝' },
      ],
      entryMethods: ['MANUAL', 'INVITATION'],
      recommendation: {
        enabled: true,
        resourceScope: '教研空间中的议题、听评课资料与共创结果',
        description: '根据议题标签和阶段状态推荐参考案例与共创资料。',
      },
    },
    {
      id: 'tpl_training_builtin',
      templateCode: 'TPL-TRAINING',
      name: '组织培训场景',
      sceneType: 'TRAINING',
      defaultMenuKey: 'org-training',
      description: '用于组织培训、学习营和考核闭环的培训空间模板。',
      builtIn: true,
      theme: {
        badgeText: '组织培训',
        emoji: '🎓',
        coverStart: '#f97316',
        coverEnd: '#facc15',
        accentColor: '#ea580c',
        heroTitle: '围绕课程、考试、直播和成果提交的培训空间',
        heroSubtitle: '支持管理员、评阅老师和学员的分角色训练流程。',
        surfaceHint: '直播、考试、视频课、研修成果',
      },
      homepage: {
        templateName: '培训营主页模板',
        introMode: 'AI_OR_MANUAL',
        introText: '展示培训安排、学习路径、考试说明与优秀成果。',
      },
      topicPage: {
        resourcePanelTitle: '培训资料',
        addResourceLabel: '添加培训内容',
        appLabel: '培训工具',
        emptyStateText: '暂无培训内容，可先创建课程模块或上传资料',
        modeTabs: createModeTabs({
          knowledge: '学习内容',
          ai: 'AI辅学',
          practice: '研修任务',
          assessment: '考试评阅',
        }),
      },
      roles: [
        {
          key: 'admin',
          name: '管理员',
          agentName: '培训运营助手',
          functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
          permissionSummary: '维护课程、学员、考试与培训规则',
          dataAccessScope: 'ALL',
          dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA', 'MEMBER_DATA', 'OPERATION_DATA'],
          scopeSummary: '拥有全部目录与工具权限',
          description: '负责培训组织和过程管理。',
        },
        {
          key: 'reviewer',
          name: '评阅老师',
          agentName: '评阅助手',
          functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
          permissionSummary: '查看指定资料夹、批注并完成评阅',
          dataAccessScope: 'ASSIGNED',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
          scopeSummary: '仅对被授权的试卷或成果文件夹拥有评阅权限',
          description: '负责考试评阅与成果点评。',
        },
        {
          key: 'student',
          name: '学员',
          agentName: '学习教练',
          functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
          permissionSummary: '学习课程、参与直播、提交作业与考试',
          dataAccessScope: 'PARTICIPATED',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA'],
          scopeSummary: '仅访问开放给学员的课程与任务',
          description: '参加培训活动并完成考核。',
        },
      ],
      metadataFields: [
        { key: 'train_name', label: '培训名称', type: 'TEXT', required: true },
        { key: 'start_date', label: '开始时间', type: 'DATETIME', required: true },
        { key: 'end_date', label: '结束时间', type: 'DATETIME', required: true },
        { key: 'target_group', label: '培训对象', type: 'TEXT', required: false },
      ],
      statusRules: [
        { name: '报名中', description: '开放报名、邀请和批量导入。' },
        { name: '培训中', description: '开放课程学习、直播和任务提交。' },
        { name: '评阅中', description: '对考试和成果进入评阅环节。' },
        { name: '已结营', description: '仅保留复盘、证书与成果回看。' },
      ],
      toolAreas: {
        resourceAreaTools: ['RESOURCE_LIBRARY', 'ONLINE_DOC', 'LIVE', 'ONLINE_VIDEO'],
        resultAreaTools: ['EXAM', 'SURVEY', 'REGISTER', 'FORUM'],
      },
      toolConfigs: [
        { key: 'exam', name: '考试', placement: 'RESULT_AREA', enabled: true, description: '支持阶段测试、结业考试和评阅。' },
        { key: 'survey', name: '调查', placement: 'RESULT_AREA', enabled: true, description: '采集满意度和问卷反馈。' },
        { key: 'register', name: '报名', placement: 'RESULT_AREA', enabled: true, description: '支持报名和邀请入营。' },
        { key: 'live', name: '直播', placement: 'RESOURCE_AREA', enabled: true, description: '线上授课与直播回放。' },
      ],
      folderTypes: [
        { key: 'vod', name: '点播视频课', required: true, allowedTools: ['ONLINE_VIDEO', 'OFFICE_UPLOAD'], roleIds: ['admin'], description: '沉淀录播课程和讲义资料。' },
        { key: 'live_course', name: '直播课程', required: true, allowedTools: ['LIVE'], roleIds: ['admin'], description: '直播安排、回放和互动资料。' },
        { key: 'exam_repo', name: '考试题库', required: true, allowedTools: ['EXAM'], roleIds: ['admin', 'reviewer'], description: '用于阶段测试与结营考试。' },
        { key: 'outcome', name: '研修成果', required: false, allowedTools: ['ONLINE_DOC', 'OFFICE_UPLOAD'], roleIds: ['admin', 'reviewer', 'student'], description: '学员提交作业和项目成果。' },
      ],
      agents: [
        { name: '培训运营助手', roleIds: ['admin'], knowledgeSource: '课程安排与学员信息', prompt: '辅助生成开营通知、课程安排和过程提醒。', avatar: '📣' },
        { name: '学习教练', roleIds: ['student'], knowledgeSource: '培训资料与考试结果', prompt: '为学员提供学习提醒、阶段建议和复盘提示。', avatar: '🚀' },
      ],
      entryMethods: ['MANUAL', 'BATCH_IMPORT', 'FORM_TEMPLATE', 'INVITATION', 'LEARNING_SQUARE'],
      recommendation: {
        enabled: true,
        resourceScope: '培训空间内课程、考试与成果资料',
        description: '根据学习阶段和考试结果推荐补充课程与复习内容。',
      },
    },
    {
      id: 'tpl_community_builtin',
      templateCode: 'TPL-COMMUNITY',
      name: '社区共创场景',
      sceneType: 'COMMUNITY',
      defaultMenuKey: 'study-club-channel',
      description: '适用于频道、社群运营、活动共创与内容沉淀的社区模板。',
      builtIn: true,
      theme: {
        badgeText: '社区频道',
        emoji: '🌱',
        coverStart: '#6b7cff',
        coverEnd: '#c7e4ff',
        accentColor: '#6673f4',
        heroTitle: '围绕议题讨论、活动报名和共创内容的社区空间',
        heroSubtitle: '支持运营者组织活动、成员共创与内容持续沉淀。',
        surfaceHint: '议题池、活动、共创成果、精选内容',
      },
      homepage: {
        templateName: '频道主页模板',
        introMode: 'AI_OR_MANUAL',
        introText: '用于展示频道介绍、精选活动、最新讨论与共创成果。',
      },
      topicPage: {
        resourcePanelTitle: '社区内容',
        addResourceLabel: '添加内容',
        appLabel: '社区工具',
        emptyStateText: '暂无内容，可先发布议题、活动或上传共创资料',
        modeTabs: createModeTabs({
          knowledge: '内容资料',
          ai: 'AI灵感',
          practice: '活动共创',
          assessment: '运营复盘',
        }),
      },
      roles: [
        {
          key: 'operator',
          name: '运营者',
          agentName: '运营助手',
          functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'MEMBER_MANAGE', 'COMMENT_INTERACT', 'DATA_EXPORT'],
          permissionSummary: '维护频道内容、活动、标签和推荐位',
          dataAccessScope: 'ALL',
          dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'MEMBER_DATA', 'OPERATION_DATA'],
          scopeSummary: '可管理全部议题、活动和精选内容',
          description: '负责社区频道运营与活动策划。',
        },
        {
          key: 'member',
          name: '共创成员',
          agentName: '灵感助手',
          functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
          permissionSummary: '参与讨论、提交内容、报名活动',
          dataAccessScope: 'OWN',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA'],
          scopeSummary: '可编辑自己参与的共创内容',
          description: '围绕社区议题持续产出内容。',
        },
        {
          key: 'observer',
          name: '观察员',
          agentName: '洞察助手',
          functionalPermissions: ['TOOL_USE', 'COMMENT_INTERACT'],
          permissionSummary: '浏览内容、参与投票和反馈',
          dataAccessScope: 'PUBLIC',
          dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA'],
          scopeSummary: '仅查看开放内容与公开活动',
          description: '负责收集反馈和观察社区趋势。',
        },
      ],
      metadataFields: [
        { key: 'channel_theme', label: '频道主题', type: 'TEXT', required: true },
        { key: 'operation_cycle', label: '运营周期', type: 'TEXT', required: false },
        { key: 'start_time', label: '启动时间', type: 'DATE', required: false },
      ],
      statusRules: [
        { name: '运营中', description: '开放内容共创、报名和活动讨论。' },
        { name: '专题活动中', description: '突出展示活动报名和精选内容。' },
        { name: '沉淀中', description: '聚焦精选内容和经验复盘。' },
      ],
      toolAreas: {
        resourceAreaTools: ['ONLINE_DOC', 'RESOURCE_LIBRARY', 'URL'],
        resultAreaTools: ['FORUM', 'REGISTER', 'VOTE', 'SURVEY'],
      },
      toolConfigs: [
        { key: 'forum', name: '论坛', placement: 'RESULT_AREA', enabled: true, description: '围绕议题发起讨论和复盘。' },
        { key: 'register', name: '报名', placement: 'RESULT_AREA', enabled: true, description: '支持活动报名与邀请。' },
        { key: 'vote', name: '投票', placement: 'RESULT_AREA', enabled: true, description: '支持内容共创与活动投票。' },
      ],
      folderTypes: [
        { key: 'topic', name: '议题池', required: true, allowedTools: ['ONLINE_DOC', 'FORUM'], roleIds: ['operator', 'member'], description: '沉淀议题、问题和讨论上下文。' },
        { key: 'activity', name: '活动报名', required: true, allowedTools: ['REGISTER', 'LIVE'], roleIds: ['operator'], description: '活动安排、报名和直播信息。' },
        { key: 'output', name: '共创成果', required: true, allowedTools: ['ONLINE_DOC', 'WHITEBOARD'], roleIds: ['operator', 'member'], description: '沉淀内容成果、提案和总结。' },
        { key: 'featured', name: '精选内容', required: false, allowedTools: ['URL', 'ONLINE_DOC'], roleIds: ['operator'], description: '对外展示精选文章、课程和活动。' },
      ],
      agents: [
        { name: '运营助手', roleIds: ['operator'], knowledgeSource: '议题池与活动数据', prompt: '帮助整理活动计划、精选内容与运营复盘。', avatar: '🎯' },
        { name: '灵感助手', roleIds: ['member'], knowledgeSource: '社区内容与精选成果', prompt: '帮助成员生成内容提纲和活动建议。', avatar: '💡' },
      ],
      entryMethods: ['MANUAL', 'INVITATION', 'LEARNING_SQUARE'],
      recommendation: {
        enabled: true,
        resourceScope: '频道内议题、活动与精选内容',
        description: '根据成员关注话题与活动行为推荐内容。',
      },
    },
  ];

  return presets.map(normalizeTemplate);
}

function buildPresetScenes(templates) {
  const byCode = new Map(templates.map((item) => [item.templateCode, item]));
  const presets = [
    {
      id: 'scene_teaching_seed_1',
      sceneCode: 'SCN-CLASS-AI',
      name: '人工智能通识课堂',
      description: '面向班级授课的 AI 通识教学场景。',
      owner: '张老师',
      visibility: 'PUBLIC',
      menuKey: 'my-classroom',
      topicCount: 12,
      templateId: byCode.get('TPL-TEACHING')?.id,
    },
    {
      id: 'scene_teaching_seed_2',
      sceneCode: 'SCN-BLOCK-CODE',
      name: '积木编程第二课',
      description: '聚焦课堂练习与作业反馈的教学场景。',
      owner: '李老师',
      visibility: 'INTERNAL',
      menuKey: 'my-learning-space',
      topicCount: 6,
      templateId: byCode.get('TPL-TEACHING')?.id,
    },
    {
      id: 'scene_research_seed_1',
      sceneCode: 'SCN-CHN-RESEARCH',
      name: '语文组课堂教学质量教研会',
      description: '用于课堂观察、听评课记录和教研共创。',
      owner: '王主任',
      visibility: 'INTERNAL',
      menuKey: 'teaching-research',
      topicCount: 8,
      templateId: byCode.get('TPL-RESEARCH')?.id,
    },
    {
      id: 'scene_research_seed_2',
      sceneCode: 'SCN-WS-DESIGN',
      name: '跨校教学设计工作坊',
      description: '跨校教师围绕教学设计议题协作共创。',
      owner: '陈老师',
      visibility: 'PUBLIC',
      menuKey: 'workshop',
      topicCount: 5,
      templateId: byCode.get('TPL-RESEARCH')?.id,
    },
    {
      id: 'scene_training_seed_1',
      sceneCode: 'SCN-NEW-TEACHER',
      name: '新教师岗前培训',
      description: '围绕课程、直播、考试和结营成果的培训场景。',
      owner: '培训中心',
      visibility: 'INTERNAL',
      menuKey: 'org-training',
      topicCount: 10,
      templateId: byCode.get('TPL-TRAINING')?.id,
    },
    {
      id: 'scene_training_seed_2',
      sceneCode: 'SCN-LEADER-CAMP',
      name: '青年干部训练营',
      description: '支持直播授课、项目研修与成果评阅。',
      owner: '组织部',
      visibility: 'PRIVATE',
      menuKey: 'workshop-cloud',
      topicCount: 7,
      templateId: byCode.get('TPL-TRAINING')?.id,
    },
    {
      id: 'scene_community_seed_1',
      sceneCode: 'SCN-SENIOR-COMMUNITY',
      name: '老年社区',
      description: '围绕智慧助老、康养服务与社区陪伴的共创频道。',
      owner: '社区运营组',
      visibility: 'PUBLIC',
      menuKey: 'study-club-channel',
      topicCount: 9,
      templateId: byCode.get('TPL-COMMUNITY')?.id,
    },
  ];

  return presets
    .filter((item) => item.templateId)
    .map((item) => normalizeScene(item, templates));
}

export function seedSceneData() {
  try {
    if (localStorage.getItem(SEED_KEY)) return;
    const existingTemplates = readList(TEMPLATE_STORAGE_KEY);
    const existingScenes = readList(SCENE_STORAGE_KEY);
    if (existingTemplates.length > 0 || existingScenes.length > 0) {
      localStorage.setItem(SEED_KEY, '1');
      return;
    }
    const templates = buildPresetTemplates();
    const scenes = buildPresetScenes(templates);
    writeList(TEMPLATE_STORAGE_KEY, templates);
    writeList(SCENE_STORAGE_KEY, scenes);
    localStorage.setItem(SEED_KEY, '1');
    emitChange();
  } catch (error) {
    console.warn('[scene-store] seed failed', error);
  }
}

export function listSceneTemplates() {
  return readTemplates().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function getSceneTemplate(id) {
  return readTemplates().find((item) => item.id === id) || null;
}

export function createTemplateDraft(sceneType = 'CUSTOM') {
  return normalizeTemplate({
    sceneType,
    status: 'ACTIVE',
    roles: [createRoleDraft(1)],
    topicPage: {
      modeTabs: createModeTabs(),
    },
  });
}

export function saveSceneTemplate(template) {
  const list = readTemplates();
  const existing = template?.id ? list.find((item) => item.id === template.id) : null;
  const normalized = normalizeTemplate({
    ...existing,
    ...clone(template),
    createdAt: existing?.createdAt || template?.createdAt || nowIso(),
    updatedAt: nowIso(),
  });
  if (!trimToNull(normalized.name)) {
    throw new Error('模板名称不能为空');
  }
  assertUniqueCode(list, 'templateCode', normalized.templateCode, normalized.id, '模板编码');
  const nextList = existing
    ? list.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...list];
  writeList(TEMPLATE_STORAGE_KEY, nextList);
  emitChange();
  return normalized;
}

export function duplicateSceneTemplate(id) {
  const source = getSceneTemplate(id);
  if (!source) {
    throw new Error('模板不存在');
  }
  return saveSceneTemplate({
    ...clone(source),
    id: undefined,
    builtIn: false,
    name: `${source.name} 副本`,
    templateCode: undefined,
  });
}

export function removeSceneTemplate(id) {
  const scenes = readScenes();
  if (scenes.some((item) => item.templateId === id)) {
    throw new Error('该模板已被场景使用，请先删除或迁移关联场景');
  }
  const list = readTemplates();
  writeList(
    TEMPLATE_STORAGE_KEY,
    list.filter((item) => item.id !== id),
  );
  emitChange();
}

export function listScenes() {
  const templates = readTemplates();
  return readScenes(templates).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function getScene(id) {
  const templates = readTemplates();
  return readScenes(templates).find((item) => item.id === id) || null;
}

export function saveScene(scene) {
  const templates = readTemplates();
  const list = readScenes(templates);
  const existing = scene?.id ? list.find((item) => item.id === scene.id) : null;
  const normalized = normalizeScene({
    ...existing,
    ...clone(scene),
    createdAt: existing?.createdAt || scene?.createdAt || nowIso(),
    updatedAt: nowIso(),
  }, templates);
  if (!trimToNull(normalized.name)) {
    throw new Error('场景名称不能为空');
  }
  assertUniqueCode(list, 'sceneCode', normalized.sceneCode, normalized.id, '场景编码');
  const nextList = existing
    ? list.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...list];
  writeList(SCENE_STORAGE_KEY, nextList);
  emitChange();
  return normalized;
}

export function removeScene(id) {
  const list = readScenes();
  const target = list.find((item) => item.id === id);
  if (!target) return;
  writeList(
    SCENE_STORAGE_KEY,
    list.filter((item) => item.id !== id),
  );
  localStorage.removeItem(`${VERSION_STORAGE_KEY}:${target.storageScopeKey}`);
  emitChange();
}

function guessResourceType(folder) {
  const name = `${folder?.name || ''} ${folder?.description || ''}`;
  if (/考试|测评|题库/.test(name)) return 'exam';
  if (/视频|直播/.test(name)) return 'video';
  if (/活动/.test(name)) return 'activity';
  return 'file';
}

export function buildSceneInitialVersionData(sceneOrTemplate) {
  const template = normalizeTemplate(sceneOrTemplate?.templateSnapshot || sceneOrTemplate);
  const rootFolders = template.folderTypes.length > 0
    ? template.folderTypes
    : [{ name: template.topicPage.resourcePanelTitle || '资料区', description: template.theme.heroSubtitle || '' }];
  const resources = [];

  rootFolders.forEach((folder, index) => {
    const folderKey = `folder_${index + 1}`;
    resources.push({
      key: folderKey,
      name: folder.name,
      isFolder: true,
      parentKey: null,
      owner: template.roles[0]?.name || '系统',
      lastEdit: nowText(),
    });
    if (index < 2) {
      resources.push({
        key: `resource_${index + 1}`,
        name: `${folder.name}说明文档`,
        type: guessResourceType(folder),
        isFolder: false,
        parentKey: folderKey,
        owner: template.roles[0]?.name || '系统',
        lastEdit: nowText(),
        meta: {
          summary: folder.description || template.theme.heroSubtitle || '',
          paragraphs: [
            `${folder.name}用于承载该场景下的核心资料与任务内容。`,
            folder.description || '可以在这里继续补充文档、视频或互动活动。',
            `当前模板为“${template.name}”，已根据模板自动创建初始目录。`,
          ],
        },
      });
    }
  });

  return {
    versions: [
      {
        id: 'v1',
        name: formatVersionName(template.versioning?.namePattern, 1),
        status: 'active',
        createdAt: nowText(),
        publishedAt: nowText(),
        resources,
        assessment: {
          totalHours: Math.max(rootFolders.length * 2, 4),
          passScore: 60,
          certificate: template.sceneType === 'TRAINING',
          rules: [],
        },
        assessmentChat: [],
      },
    ],
    currentVersionId: 'v1',
  };
}
