import { trackEvent } from '../shared/analytics';
import { createFieldSchema } from '../processV2/form/fieldDefs';
import { getDefaultSceneThemeCoverPresetId, getSceneThemeCoverPreset } from './themeCovers';

const TEMPLATE_STORAGE_KEY = 'gr.scene.templates.v1';
const SCENE_STORAGE_KEY = 'gr.scenes.v1';
const SEED_KEY = 'gr.scene.seeded.v1';
const BUILT_IN_SYNC_KEY = 'gr.scene.builtin-sync.v6';
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
  { value: 'course-creation-center', label: '课程创作中心' },
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

export const STATUS_RULE_STAGE_OPTIONS = [
  { value: 'PREPARING', label: '准备阶段' },
  { value: 'OPEN', label: '开放阶段' },
  { value: 'RUNNING', label: '运行阶段' },
  { value: 'REVIEWING', label: '评阅阶段' },
  { value: 'CLOSED', label: '结束阶段' },
  { value: 'ARCHIVED', label: '归档阶段' },
];

const STATUS_RULE_STAGE_DESCRIPTION_MAP = Object.freeze({
  PREPARING: '用于资料、成员、工具和任务准备，通常仅组织者或管理员可编辑。',
  OPEN: '用于报名、招募、邀请或征集，强调允许新增成员进入主题。',
  RUNNING: '用于主题正式运行中的学习、协作、互动和提交。',
  REVIEWING: '用于评阅、审核、评分和反馈，通常由评审角色主导。',
  CLOSED: '用于业务结束后的回看、复盘和结果查看，通常停止新增与编辑。',
  ARCHIVED: '用于历史沉淀和留档，通常仅保留浏览与检索能力。',
});

export const STATUS_RULE_CONTROL_OPTIONS = [
  { value: 'ADMIN_ONLY', label: '仅管理端可编辑' },
  { value: 'COLLABORATIVE', label: '协同开放' },
  { value: 'SUBMISSION_ONLY', label: '仅开放报名/提交' },
  { value: 'REVIEW_ONLY', label: '仅开放评阅' },
  { value: 'READ_ONLY', label: '只读' },
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

export const ROLE_FUNCTION_PERMISSION_TREE = [
  {
    value: 'CONTENT_GROUP',
    label: '内容与主题',
    title: '内容与主题',
    selectable: false,
    children: [
      { value: 'TOPIC_EDIT', label: '主题配置管理', title: '主题配置管理' },
      { value: 'RESOURCE_CREATE', label: '新增资料', title: '新增资料' },
      { value: 'RESOURCE_EDIT', label: '资料编辑', title: '资料编辑' },
      { value: 'RESOURCE_DELETE', label: '资料删除', title: '资料删除' },
    ],
  },
  {
    value: 'COLLAB_GROUP',
    label: '协作与互动',
    title: '协作与互动',
    selectable: false,
    children: [
      { value: 'TOOL_USE', label: '工具使用', title: '工具使用' },
      { value: 'LIVE_ACTIVITY_MANAGE', label: '直播/活动管理', title: '直播/活动管理' },
      { value: 'COMMENT_INTERACT', label: '互动评论', title: '互动评论' },
    ],
  },
  {
    value: 'ASSESS_GROUP',
    label: '考核与成果',
    title: '考核与成果',
    selectable: false,
    children: [
      { value: 'ASSESSMENT_CONFIG', label: '考核配置', title: '考核配置' },
      { value: 'RESULT_SUBMIT', label: '成果提交', title: '成果提交' },
      { value: 'RESULT_REVIEW', label: '评阅反馈', title: '评阅反馈' },
    ],
  },
  {
    value: 'ORG_GROUP',
    label: '组织与运营',
    title: '组织与运营',
    selectable: false,
    children: [
      { value: 'MEMBER_MANAGE', label: '成员管理', title: '成员管理' },
      { value: 'DATA_EXPORT', label: '数据导出', title: '数据导出' },
    ],
  },
];

export const ROLE_FUNCTION_PERMISSION_MODE_OPTIONS = [
  { value: 'INCLUDE', label: '包括以下功能' },
  { value: 'EXCLUDE', label: '不包括以下功能' },
];

export const ROLE_DATA_SCOPE_OPTIONS = [
  { value: 'ALL', label: '全部符合类型的资料' },
  { value: 'ASSIGNED', label: '指定授权资料' },
  { value: 'OWN', label: '本人创建资料' },
  { value: 'PARTICIPATED', label: '我参与的资料' },
  { value: 'PUBLIC', label: '公开资料' },
];

export const ASSIGNED_ACCESS_RULE_OPTIONS = [
  { value: 'ALL', label: '全部授权对象' },
  { value: 'RESOURCE_TYPE', label: '按资料类型' },
  { value: 'RESOURCE_ATTR', label: '按资料属性' },
  { value: 'RESOURCE_ITEM', label: '指定具体资料' },
];

export const ROLE_DATA_ACCESS_AREA_OPTIONS = [
  { value: 'SEMINAR', label: '研讨会' },
  { value: 'NOTE', label: '笔记' },
  { value: 'SURVEY', label: '调查' },
  { value: 'VOTE', label: '投票' },
  { value: 'EXAM', label: '考试' },
  { value: 'REGISTER', label: '报名' },
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

const DESIGNER_FIELD_TYPES = new Set([
  'input',
  'textarea',
  'alert',
  'inputNumber',
  'radio',
  'checkbox',
  'datePicker',
  'dateRange',
  'tableForm',
  'upload',
]);

const LEGACY_METADATA_FIELD_TYPE_MAP = Object.freeze({
  TEXT: 'input',
  TEXTAREA: 'textarea',
  DATE: 'datePicker',
  DATETIME: 'datePicker',
  NUMBER: 'inputNumber',
  SELECT: 'radio',
});

const MODE_TAB_LABEL_MAP = Object.fromEntries(
  MODE_TAB_PRESET_OPTIONS.map((item) => [item.value, item.label]),
);

const DEFAULT_VERSIONING_CONFIG = Object.freeze({
  enabled: false,
  maxVersions: 5,
  namePattern: '版本 {index}',
  createMode: 'COPY_ACTIVE',
  allowRollback: true,
  allowDeletePublished: true,
  description: '',
});

function isSceneVersioningSupported(sceneType = 'CUSTOM') {
  return sceneType === 'TRAINING';
}

function isSceneVersioningEnabledByDefault(sceneType = 'CUSTOM') {
  return isSceneVersioningSupported(sceneType);
}

const SCENE_TYPE_STATUS_PRESETS = Object.freeze({
  TEACHING: {
    description: '教学场景通常采用“准备 -> 运行 -> 结束”三段式，聚焦备课、授课和结课复盘。',
    rules: [
      {
        key: 'preparing',
        name: '备课中',
        stage: 'PREPARING',
        controlMode: 'ADMIN_ONLY',
        entryEnabled: false,
        roleKeys: ['teacher'],
        description: '仅教师可编辑资料、配置课堂工具和作业。',
      },
      {
        key: 'running',
        name: '上课中',
        stage: 'RUNNING',
        controlMode: 'COLLABORATIVE',
        entryEnabled: true,
        roleKeys: ['teacher', 'student'],
        description: '开放课堂互动、练习、问答与作业提交。',
      },
      {
        key: 'closed',
        name: '已结课',
        stage: 'CLOSED',
        controlMode: 'READ_ONLY',
        entryEnabled: false,
        roleKeys: ['teacher', 'student'],
        description: '保留回看与作业复盘，停止新增和编辑。',
      },
    ],
  },
  RESEARCH: {
    description: '教研场景通常采用“准备 -> 运行 -> 归档”，聚焦议题筹备、研讨共创和成果归档。',
    rules: [
      {
        key: 'planning',
        name: '筹备中',
        stage: 'PREPARING',
        controlMode: 'ADMIN_ONLY',
        entryEnabled: false,
        roleKeys: ['leader', 'teacher'],
        description: '聚焦议题征集、资料预热和议程准备。',
      },
      {
        key: 'running',
        name: '研讨中',
        stage: 'RUNNING',
        controlMode: 'COLLABORATIVE',
        entryEnabled: true,
        roleKeys: ['leader', 'teacher', 'expert'],
        description: '开放论坛、白板和共创文档协同。',
      },
      {
        key: 'archived',
        name: '已归档',
        stage: 'ARCHIVED',
        controlMode: 'READ_ONLY',
        entryEnabled: false,
        roleKeys: ['leader', 'teacher', 'expert'],
        description: '固化成果，保留浏览与复盘入口。',
      },
    ],
  },
  TRAINING: {
    description: '培训场景通常采用“开放 -> 运行 -> 评阅 -> 结束”，覆盖报名入营、学习过程和结营评定。',
    rules: [
      {
        key: 'enrolling',
        name: '报名中',
        stage: 'OPEN',
        controlMode: 'SUBMISSION_ONLY',
        entryEnabled: true,
        roleKeys: ['admin', 'student'],
        description: '开放报名、邀请、批量导入与入营确认。',
      },
      {
        key: 'running',
        name: '培训中',
        stage: 'RUNNING',
        controlMode: 'COLLABORATIVE',
        entryEnabled: false,
        roleKeys: ['admin', 'student'],
        description: '开放课程学习、直播参与和任务提交。',
      },
      {
        key: 'reviewing',
        name: '评阅中',
        stage: 'REVIEWING',
        controlMode: 'REVIEW_ONLY',
        entryEnabled: false,
        roleKeys: ['admin', 'reviewer'],
        description: '对考试和成果进入评阅反馈环节。',
      },
      {
        key: 'closed',
        name: '已结营',
        stage: 'CLOSED',
        controlMode: 'READ_ONLY',
        entryEnabled: false,
        roleKeys: ['admin', 'reviewer', 'student'],
        description: '仅保留复盘、证书与成果回看。',
      },
    ],
  },
  COMMUNITY: {
    description: '社区共创以持续运营为常态，可叠加活动开放期与沉淀回看期。',
    rules: [
      {
        key: 'operating',
        name: '运营中',
        stage: 'RUNNING',
        controlMode: 'COLLABORATIVE',
        entryEnabled: true,
        roleKeys: ['operator', 'member', 'observer'],
        description: '开放内容共创、报名和活动讨论。',
      },
      {
        key: 'campaign',
        name: '专题活动中',
        stage: 'OPEN',
        controlMode: 'SUBMISSION_ONLY',
        entryEnabled: true,
        roleKeys: ['operator', 'member'],
        description: '突出展示活动报名、互动参与和精选内容。',
      },
      {
        key: 'retrospective',
        name: '沉淀中',
        stage: 'CLOSED',
        controlMode: 'READ_ONLY',
        entryEnabled: false,
        roleKeys: ['operator', 'member', 'observer'],
        description: '聚焦精选内容沉淀、经验复盘与对外展示。',
      },
    ],
  },
  CUSTOM: {
    description: '自定义场景默认提供“准备 -> 运行 -> 结束”的通用三段式，可按模板继续调整。',
    rules: [
      {
        key: 'preparing',
        name: '准备中',
        stage: 'PREPARING',
        controlMode: 'ADMIN_ONLY',
        entryEnabled: false,
        roleKeys: [],
        description: '用于准备资料、成员、目录和工具配置。',
      },
      {
        key: 'running',
        name: '运行中',
        stage: 'RUNNING',
        controlMode: 'COLLABORATIVE',
        entryEnabled: true,
        roleKeys: [],
        description: '用于主题正式运行中的协作、学习与提交。',
      },
      {
        key: 'closed',
        name: '已结束',
        stage: 'CLOSED',
        controlMode: 'READ_ONLY',
        entryEnabled: false,
        roleKeys: [],
        description: '用于业务结束后的回看、复盘和结果浏览。',
      },
    ],
  },
});

const RESOURCE_ACCESS_TYPE_VALUES = ROLE_DATA_ACCESS_AREA_OPTIONS.map((item) => item.value);
const LEGACY_ROLE_DATA_ACCESS_MAP = Object.freeze({
  TOPIC_METADATA: ['NOTE'],
  RESOURCE_AREA: ['NOTE'],
  RESULT_AREA: ['SEMINAR', 'SURVEY', 'VOTE', 'EXAM', 'REGISTER'],
  ASSESSMENT_DATA: ['SURVEY', 'EXAM'],
  MEMBER_DATA: [],
  OPERATION_DATA: [],
});

const BUILT_IN_RESOURCE_ACCESS = Object.freeze({
  ALL: RESOURCE_ACCESS_TYPE_VALUES,
  TEACHING_LEARNER: ['NOTE', 'SURVEY', 'EXAM'],
  RESEARCH_CORE: ['SEMINAR', 'NOTE'],
  RESEARCH_EXPERT: ['SEMINAR', 'NOTE', 'SURVEY'],
  TRAINING_LEARNER: ['NOTE', 'SURVEY', 'EXAM', 'REGISTER'],
  TRAINING_REVIEWER: ['NOTE', 'EXAM'],
  COMMUNITY_OPERATOR: ['SEMINAR', 'NOTE', 'SURVEY', 'VOTE', 'REGISTER'],
  COMMUNITY_MEMBER: ['NOTE', 'VOTE', 'REGISTER'],
  COMMUNITY_PUBLIC: ['SURVEY', 'VOTE', 'REGISTER'],
});

const BUILT_IN_ROLE_AUTHORIZATION = {
  'TEACHING:teacher': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'RESULT_REVIEW'],
    dataAccessScope: 'ALL',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.ALL,
  },
  'TEACHING:student': {
    functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.TEACHING_LEARNER,
  },
  'RESEARCH:leader': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.ALL,
  },
  'RESEARCH:teacher': {
    functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.RESEARCH_CORE,
  },
  'RESEARCH:expert': {
    functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
    dataAccessScope: 'ASSIGNED',
    assignedAccessRuleType: 'RESOURCE_TYPE',
    dataAccessAreas: ['FOLDER::lesson_review'],
  },
  'TRAINING:admin': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.ALL,
  },
  'TRAINING:reviewer': {
    functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
    dataAccessScope: 'ASSIGNED',
    assignedAccessRuleType: 'RESOURCE_TYPE',
    dataAccessAreas: ['FOLDER::exam_repo', 'FOLDER::outcome'],
  },
  'TRAINING:student': {
    functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'PARTICIPATED',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.TRAINING_LEARNER,
  },
  'COMMUNITY:operator': {
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'LIVE_ACTIVITY_MANAGE', 'MEMBER_MANAGE', 'COMMENT_INTERACT', 'DATA_EXPORT'],
    dataAccessScope: 'ALL',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.COMMUNITY_OPERATOR,
  },
  'COMMUNITY:member': {
    functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    dataAccessScope: 'OWN',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.COMMUNITY_MEMBER,
  },
  'COMMUNITY:observer': {
    functionalPermissions: ['TOOL_USE', 'COMMENT_INTERACT'],
    dataAccessScope: 'PUBLIC',
    dataAccessAreas: BUILT_IN_RESOURCE_ACCESS.COMMUNITY_PUBLIC,
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

export function getRoleFunctionPermissionModeLabel(value) {
  return optionLabel(ROLE_FUNCTION_PERMISSION_MODE_OPTIONS, value, value || '-');
}

export function getAssignedAccessRuleLabel(value) {
  return optionLabel(ASSIGNED_ACCESS_RULE_OPTIONS, value, value || '-');
}

export function getStatusRuleStageLabel(value) {
  return optionLabel(STATUS_RULE_STAGE_OPTIONS, value, value || '-');
}

export function getStatusRuleStageDescription(value) {
  return STATUS_RULE_STAGE_DESCRIPTION_MAP[value] || '用于定义主题在该阶段下的默认业务边界和可执行动作。';
}

export function getStatusRuleControlLabel(value) {
  return optionLabel(STATUS_RULE_CONTROL_OPTIONS, value, value || '-');
}

function normalizeStatusPresetSceneType(sceneType) {
  return Object.prototype.hasOwnProperty.call(SCENE_TYPE_STATUS_PRESETS, sceneType)
    ? sceneType
    : 'CUSTOM';
}

export function getSceneTypeStatusPreset(sceneType = 'CUSTOM') {
  const normalizedType = normalizeStatusPresetSceneType(sceneType);
  return {
    sceneType: normalizedType,
    label: getSceneTypeLabel(normalizedType),
    ...(SCENE_TYPE_STATUS_PRESETS[normalizedType] || SCENE_TYPE_STATUS_PRESETS.CUSTOM),
  };
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

export function normalizeVersioningConfig(input = {}, sceneType = null) {
  const maxVersions = Number.parseInt(input?.maxVersions, 10);
  const versioningSupported = typeof sceneType === 'string' ? isSceneVersioningSupported(sceneType) : null;
  return {
    enabled: versioningSupported === false
      ? false
      : typeof input?.enabled === 'boolean'
        ? input.enabled
        : versioningSupported === true
          ? true
          : DEFAULT_VERSIONING_CONFIG.enabled,
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

function normalizeRoleDataAccessAreas(values) {
  const normalized = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    if (LEGACY_ROLE_DATA_ACCESS_MAP[value]) {
      LEGACY_ROLE_DATA_ACCESS_MAP[value].forEach((mappedValue) => normalized.add(mappedValue));
      return;
    }
    if (typeof value === 'string' && value.startsWith('FOLDER::')) {
      const folderKey = value.slice('FOLDER::'.length).trim();
      if (folderKey) normalized.add(`FOLDER::${folderKey}`);
      return;
    }
    if (ROLE_DATA_ACCESS_AREA_OPTIONS.some((item) => item.value === value)) {
      normalized.add(value);
    }
  });
  return Array.from(normalized);
}

function normalizeRoleFunctionalPermissions(values) {
  const allowedValues = new Set(ROLE_FUNCTION_PERMISSION_OPTIONS.map((item) => item.value));
  return (Array.isArray(values) ? values : []).filter((value) => allowedValues.has(value));
}

function normalizeRoleFolderKeys(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => trimToNull(value))
    .filter(Boolean);
}

function normalizeRoleTagValues(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => trimToNull(value))
    .filter(Boolean);
}

function inferAssignedAccessRuleType(role = {}) {
  if (role?.assignedAccessRuleType === 'FOLDER_TYPE') {
    return 'RESOURCE_TYPE';
  }
  if (ASSIGNED_ACCESS_RULE_OPTIONS.some((item) => item.value === role?.assignedAccessRuleType)) {
    return role.assignedAccessRuleType;
  }
  if ((role?.authorizedFolderKeys || []).length > 0) return 'RESOURCE_TYPE';
  if ((role?.authorizedResourceRefs || []).length > 0) return 'RESOURCE_ITEM';
  if ((role?.assignedAttributeRules || []).length > 0) return 'RESOURCE_ATTR';
  if ((role?.dataAccessAreas || []).length > 0) return 'RESOURCE_TYPE';
  return 'ALL';
}

function normalizeRole(role, index, sceneType, builtIn) {
  const roleKey = trimToNull(role?.key) || `role_${index + 1}`;
  const defaultAuthorization = builtIn ? getDefaultRoleAuthorization(sceneType, roleKey) : null;
  const dataAccessScope = Object.prototype.hasOwnProperty.call(role || {}, 'dataAccessScope')
    ? (trimToNull(role?.dataAccessScope) || 'ASSIGNED')
    : (defaultAuthorization?.dataAccessScope || 'ASSIGNED');
  const assignedAccessRuleType = inferAssignedAccessRuleType({
    ...defaultAuthorization,
    ...role,
  });
  const functionalPermissionMode = ROLE_FUNCTION_PERMISSION_MODE_OPTIONS.some((item) => item.value === role?.functionalPermissionMode)
    ? role.functionalPermissionMode
    : (defaultAuthorization?.functionalPermissionMode || 'INCLUDE');
  const mergedAssignedTypeTargets = normalizeRoleDataAccessAreas([
    ...(Array.isArray(defaultAuthorization?.dataAccessAreas) ? defaultAuthorization.dataAccessAreas : []),
    ...(Array.isArray(defaultAuthorization?.authorizedFolderKeys)
      ? defaultAuthorization.authorizedFolderKeys.map((folderKey) => `FOLDER::${folderKey}`)
      : []),
    ...(Array.isArray(role?.dataAccessAreas) ? role.dataAccessAreas : []),
    ...(Array.isArray(role?.authorizedFolderKeys)
      ? role.authorizedFolderKeys.map((folderKey) => `FOLDER::${folderKey}`)
      : []),
  ]);
  return {
    id: role?.id || roleKey,
    key: roleKey,
    name: trimToNull(role?.name) || `角色${index + 1}`,
    description: trimToNull(role?.description) || '',
    agentName: trimToNull(role?.agentName) || '',
    functionalPermissionMode,
    functionalPermissions: Array.isArray(role?.functionalPermissions)
      ? normalizeRoleFunctionalPermissions(role.functionalPermissions)
      : normalizeRoleFunctionalPermissions(defaultAuthorization?.functionalPermissions || []),
    permissionSummary: trimToNull(role?.permissionSummary) || '',
    dataAccessScope,
    assignedAccessRuleType: dataAccessScope === 'ASSIGNED' ? assignedAccessRuleType : 'ALL',
    dataAccessAreas: mergedAssignedTypeTargets,
    authorizedFolderKeys: Array.isArray(role?.authorizedFolderKeys)
      ? normalizeRoleFolderKeys(role.authorizedFolderKeys)
      : normalizeRoleFolderKeys(defaultAuthorization?.authorizedFolderKeys || []),
    assignedAttributeRules: Array.isArray(role?.assignedAttributeRules)
      ? normalizeRoleTagValues(role.assignedAttributeRules)
      : normalizeRoleTagValues(defaultAuthorization?.assignedAttributeRules || []),
    authorizedResourceRefs: Array.isArray(role?.authorizedResourceRefs)
      ? normalizeRoleTagValues(role.authorizedResourceRefs)
      : normalizeRoleTagValues(defaultAuthorization?.authorizedResourceRefs || []),
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
    functionalPermissionMode: 'INCLUDE',
    functionalPermissions: ['TOOL_USE'],
    permissionSummary: '',
    dataAccessScope: 'ASSIGNED',
    assignedAccessRuleType: 'ALL',
    dataAccessAreas: [],
    authorizedFolderKeys: [],
    assignedAttributeRules: [],
    authorizedResourceRefs: [],
    scopeSummary: '',
  };
}

function normalizeMetadataField(field, index) {
  const rawType = trimToNull(field?.type) || 'TEXT';
  const designerType = DESIGNER_FIELD_TYPES.has(rawType)
    ? rawType
    : (LEGACY_METADATA_FIELD_TYPE_MAP[rawType] || 'input');
  const defaultField = createFieldSchema(designerType);
  return {
    ...defaultField,
    ...field,
    id: field?.id || defaultField.id || createId(`field_${index}`),
    type: designerType,
    label: trimToNull(field?.label) || defaultField.label || `字段${index + 1}`,
    key: trimToNull(field?.key) || `field_${index + 1}`,
    description: trimToNull(field?.description) || '',
    sceneMetadataType: trimToNull(field?.sceneMetadataType) || (!DESIGNER_FIELD_TYPES.has(rawType) ? rawType : null),
    props: {
      ...(defaultField.props || {}),
      ...(field?.props || {}),
      required: typeof field?.required === 'boolean'
        ? field.required
        : Boolean(field?.props?.required ?? defaultField.props?.required),
    },
  };
}

function inferStatusRuleStage(rule = {}) {
  const text = `${rule?.key || ''} ${rule?.name || ''} ${rule?.description || ''}`;
  if (/备课|筹备|准备|预热/.test(text)) return 'PREPARING';
  if (/报名|招募|开放|邀请/.test(text)) return 'OPEN';
  if (/评阅|评审|审核/.test(text)) return 'REVIEWING';
  if (/归档/.test(text)) return 'ARCHIVED';
  if (/结课|结营|结束|关闭|沉淀|复盘/.test(text)) return 'CLOSED';
  return 'RUNNING';
}

function inferStatusRuleControl(stage) {
  switch (stage) {
    case 'PREPARING':
      return 'ADMIN_ONLY';
    case 'OPEN':
      return 'SUBMISSION_ONLY';
    case 'REVIEWING':
      return 'REVIEW_ONLY';
    case 'CLOSED':
    case 'ARCHIVED':
      return 'READ_ONLY';
    case 'RUNNING':
    default:
      return 'COLLABORATIVE';
  }
}

function inferStatusRuleEntryEnabled(rule = {}, stage) {
  const text = `${rule?.key || ''} ${rule?.name || ''} ${rule?.description || ''}`;
  if (/停止|关闭|归档|结课|结营/.test(text)) return false;
  return stage === 'OPEN' || /报名|邀请|开放/.test(text);
}

function normalizeStatusRule(rule, index, normalizeRoleIds = (roleIds) => (
  Array.isArray(roleIds) ? roleIds.filter(Boolean) : []
)) {
  const stage = STATUS_RULE_STAGE_OPTIONS.some((item) => item.value === rule?.stage)
    ? rule.stage
    : inferStatusRuleStage(rule);
  const controlMode = STATUS_RULE_CONTROL_OPTIONS.some((item) => item.value === rule?.controlMode)
    ? rule.controlMode
    : inferStatusRuleControl(stage);
  return {
    id: rule?.id || createId(`rule_${index}`),
    key: trimToNull(rule?.key) || `status_${index + 1}`,
    name: trimToNull(rule?.name) || `规则${index + 1}`,
    stage,
    controlMode,
    entryEnabled: typeof rule?.entryEnabled === 'boolean'
      ? rule.entryEnabled
      : inferStatusRuleEntryEnabled(rule, stage),
    roleIds: normalizeRoleIds(rule?.roleIds),
    description: trimToNull(rule?.description) || '',
  };
}

export function buildSceneTypeStatusRules(sceneType = 'CUSTOM', roles = []) {
  const preset = getSceneTypeStatusPreset(sceneType);
  const shouldFallbackToRoleKey = !(Array.isArray(roles) && roles.some((role) => role?.id));
  const roleRefMap = new Map(
    (Array.isArray(roles) ? roles : [])
      .filter((role) => role?.key || role?.id)
      .map((role) => [role.key, role.id || role.key]),
  );
  return preset.rules.map((rule, index) => normalizeStatusRule({
    ...rule,
    roleIds: Array.isArray(rule.roleKeys) && rule.roleKeys.length > 0
      ? rule.roleKeys
        .map((roleKey) => roleRefMap.get(roleKey) || (shouldFallbackToRoleKey ? roleKey : null))
        .filter(Boolean)
      : [],
  }, index, (roleIds) => (Array.isArray(roleIds) ? roleIds.filter(Boolean) : [])));
}

export function getSceneTypeStatusGuidance(sceneType = 'CUSTOM', statusRules = []) {
  const rules = Array.isArray(statusRules) ? statusRules : [];
  const normalizedType = normalizeStatusPresetSceneType(sceneType);
  const stageCountMap = rules.reduce((map, rule) => {
    const stage = trimToNull(rule?.stage);
    if (!stage) return map;
    map.set(stage, (map.get(stage) || 0) + 1);
    return map;
  }, new Map());
  const messages = [];

  if (normalizedType === 'TRAINING') {
    if (!stageCountMap.has('OPEN')) {
      messages.push('培训场景通常应包含“开放阶段”，用于报名、邀请或导入成员。');
    }
    if (!stageCountMap.has('REVIEWING')) {
      messages.push('培训场景通常应包含“评阅阶段”，用于考试、作业和成果评定。');
    }
  }

  if (normalizedType === 'TEACHING' && stageCountMap.has('ARCHIVED')) {
    messages.push('教学场景一般不单独配置“归档阶段”，通常使用“结束阶段”完成结课与复盘。');
  }

  rules.forEach((rule) => {
    if (rule?.stage === 'OPEN' && rule?.entryEnabled === false) {
      messages.push(`规则“${rule?.name || rule?.key || '未命名规则'}”属于开放阶段，通常应允许进入。`);
    }
    if (rule?.stage === 'REVIEWING' && rule?.controlMode !== 'REVIEW_ONLY') {
      messages.push(`规则“${rule?.name || rule?.key || '未命名规则'}”属于评阅阶段，通常建议使用“仅开放评阅”。`);
    }
  });

  Array.from(stageCountMap.entries())
    .filter(([, count]) => count > 1)
    .forEach(([stage, count]) => {
      messages.push(`${getStatusRuleStageLabel(stage)}已配置 ${count} 条规则，保存后会并行生效，请确认不是重复配置。`);
    });

  return Array.from(new Set(messages));
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
  const statusPresetSceneType = normalizeStatusPresetSceneType(trimToNull(input.statusPresetSceneType) || sceneType);
  const builtIn = Boolean(input.builtIn);
  const defaultCoverPresetId = getDefaultSceneThemeCoverPresetId(sceneType);
  const coverSource = trimToNull(input.theme?.coverSource) === 'UPLOAD'
    ? 'UPLOAD'
    : ((trimToNull(input.theme?.coverSource) === 'PRESET' || !trimToNull(input.theme?.coverImage))
      ? 'PRESET'
      : 'UPLOAD');
  const coverPresetId = trimToNull(input.theme?.coverPresetId) || defaultCoverPresetId;
  const coverPreset = getSceneThemeCoverPreset(coverPresetId) || getSceneThemeCoverPreset(defaultCoverPresetId);
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
    statusPresetSceneType,
    defaultMenuKey: trimToNull(input.defaultMenuKey) || defaultMenuKeyByType(sceneType),
    description: trimToNull(input.description) || '',
    status: trimToNull(input.status) || 'ACTIVE',
    builtIn,
    theme: {
      badgeText: trimToNull(input.theme?.badgeText) || getSceneTypeLabel(sceneType),
      emoji: trimToNull(input.theme?.emoji) || '🧩',
      coverSource,
      coverPresetId,
      coverImage: coverSource === 'UPLOAD' ? (trimToNull(input.theme?.coverImage) || '') : '',
      topicThemeMode: trimToNull(input.theme?.topicThemeMode) || 'DEFAULT',
      coverStart: trimToNull(input.theme?.coverStart) || coverPreset?.coverStart || '#4f8cff',
      coverEnd: trimToNull(input.theme?.coverEnd) || coverPreset?.coverEnd || '#7ee4ff',
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
    statusRules: (Array.isArray(input.statusRules) ? input.statusRules : []).map((rule, index) => (
      normalizeStatusRule(rule, index, normalizeRoleIds)
    )),
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
    versioning: normalizeVersioningConfig(input.versioning, sceneType),
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
  const courseStudioRoles = [
    {
      key: 'leader',
      name: '课程负责人',
      agentName: '课程策划助手',
      functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'ASSESSMENT_CONFIG', 'MEMBER_MANAGE', 'DATA_EXPORT'],
      permissionSummary: '维护课程目标、结构与发布节奏',
      dataAccessScope: 'ALL',
      dataAccessAreas: ['TOPIC_METADATA', 'RESOURCE_AREA', 'RESULT_AREA', 'ASSESSMENT_DATA', 'MEMBER_DATA'],
      scopeSummary: '可管理全部课程资料、目录与评审数据',
      description: '负责课程定位、结构设计和版本发布。',
    },
    {
      key: 'teacher',
      name: '课程设计师',
      agentName: '教案共创助手',
      functionalPermissions: ['RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
      permissionSummary: '参与课程共创、课时设计和素材整理',
      dataAccessScope: 'PARTICIPATED',
      dataAccessAreas: ['RESOURCE_AREA', 'RESULT_AREA', 'TOPIC_METADATA'],
      scopeSummary: '可编辑参与的课程蓝图、课时方案与知识映射内容',
      description: '负责大纲编写、课时设计和课程素材整理。',
    },
    {
      key: 'expert',
      name: '评审专家',
      agentName: '评审助手',
      functionalPermissions: ['TOOL_USE', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
      permissionSummary: '对指定目录进行评审、批注与反馈',
      dataAccessScope: 'ASSIGNED',
      dataAccessAreas: ['FOLDER::knowledge_map', 'FOLDER::review_feedback'],
      scopeSummary: '聚焦知识映射与评审反馈目录进行审阅',
      description: '负责课程质量把关和改进建议输出。',
    },
  ];
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
        coverSource: 'PRESET',
        coverPresetId: 'abstract_blue_wave',
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
      statusRules: buildSceneTypeStatusRules('TEACHING'),
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
        coverSource: 'PRESET',
        coverPresetId: 'abstract_portal',
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
      statusRules: buildSceneTypeStatusRules('RESEARCH'),
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
        coverSource: 'PRESET',
        coverPresetId: 'abstract_gold',
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
      statusRules: buildSceneTypeStatusRules('TRAINING'),
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
      id: 'tpl_course_studio_builtin',
      templateCode: 'TPL-COURSE-STUDIO',
      name: '课程创作中心',
      sceneType: 'RESEARCH',
      defaultMenuKey: 'course-creation-center',
      description: '面向人工智能通识体系课程策划、课时设计、知识图谱映射与专家评审的课程创作空间模板。',
      builtIn: true,
      theme: {
        badgeText: '人工智能通识体系',
        emoji: '🧭',
        coverSource: 'PRESET',
        coverPresetId: 'abstract_sunset_flow',
        coverStart: '#2457ff',
        coverEnd: '#ff8b5d',
        accentColor: '#2f5bf2',
        heroTitle: '人工智能通识体系下的课程创作中心',
        heroSubtitle: '围绕课程框架、知识图谱映射与课时共创，支撑通识课程方案设计与专家评审。',
        surfaceHint: '课程框架、知识图谱、课时设计、评审发布',
      },
      homepage: {
        templateName: '课程创作主页模板',
        introMode: 'AI_OR_MANUAL',
        introText: '聚合课程定位、目标人群、结构设计、知识映射与评审进度。',
      },
      topicPage: {
        resourcePanelTitle: '课程素材',
        addResourceLabel: '添加课程素材',
        appLabel: '创作工具',
        emptyStateText: '暂无课程素材，可先创建课程蓝图、知识图谱映射或课时设计目录',
        modeTabs: createModeTabs({
          knowledge: '课程框架',
          ai: 'AI共创',
          practice: '课时设计',
          assessment: '评审发布',
        }),
      },
      roles: courseStudioRoles,
      metadataFields: [
        { key: 'course_name', label: '课程名称', type: 'TEXT', required: true },
        { key: 'subject', label: '学科领域', type: 'TEXT', required: true },
        { key: 'target_audience', label: '适用对象', type: 'TEXT', required: false },
        { key: 'lesson_count', label: '课时数', type: 'NUMBER', required: false },
        { key: 'design_goal', label: '设计目标', type: 'TEXTAREA', required: false },
      ],
      statusRules: [
        {
          key: 'planning',
          name: '策划中',
          stage: 'PREPARING',
          controlMode: 'ADMIN_ONLY',
          entryEnabled: false,
          roleIds: ['leader', 'teacher'],
          description: '用于明确课程目标、能力要求与整体结构。',
        },
        {
          key: 'co_creation',
          name: '共创中',
          stage: 'RUNNING',
          controlMode: 'COLLABORATIVE',
          entryEnabled: true,
          roleIds: ['leader', 'teacher', 'expert'],
          description: '开放大纲编写、知识映射、课时设计与讨论协作。',
        },
        {
          key: 'reviewing',
          name: '评审中',
          stage: 'REVIEWING',
          controlMode: 'REVIEW_ONLY',
          entryEnabled: false,
          roleIds: ['leader', 'expert'],
          description: '用于专家评审、问题反馈与版本修订建议。',
        },
        {
          key: 'published',
          name: '已定稿',
          stage: 'CLOSED',
          controlMode: 'READ_ONLY',
          entryEnabled: false,
          roleIds: ['leader', 'teacher', 'expert'],
          description: '保留课程方案、设计依据和发布素材的查看与复盘。',
        },
      ],
      toolAreas: {
        resourceAreaTools: ['ONLINE_DOC', 'RESOURCE_LIBRARY', 'WHITEBOARD', 'KNOWLEDGE_GRAPH', 'OFFICE_UPLOAD'],
        resultAreaTools: ['FORUM', 'SURVEY', 'URL'],
      },
      toolConfigs: [
        { key: 'knowledge_graph', name: '知识图谱', placement: 'RESOURCE_AREA', enabled: true, description: '梳理课程知识点、能力目标与活动映射。' },
        { key: 'whiteboard', name: '白板', placement: 'RESOURCE_AREA', enabled: true, description: '用于课程结构脑暴与课时流程共创。' },
        { key: 'forum', name: '评审讨论', placement: 'RESULT_AREA', enabled: true, description: '沉淀专家点评、问题清单与修订建议。' },
      ],
      folderTypes: [
        { key: 'curriculum_blueprint', name: '课程蓝图', required: true, allowedTools: ['ONLINE_DOC', 'OFFICE_UPLOAD'], roleIds: ['leader', 'teacher'], description: '沉淀课程定位、目标、课时结构和能力要求。' },
        { key: 'knowledge_map', name: '知识图谱映射', required: true, allowedTools: ['KNOWLEDGE_GRAPH', 'ONLINE_DOC'], roleIds: ['leader', 'teacher', 'expert'], description: '映射知识点、能力点与教学活动。' },
        { key: 'lesson_design', name: '课时设计', required: true, allowedTools: ['ONLINE_DOC', 'WHITEBOARD', 'OFFICE_UPLOAD'], roleIds: ['leader', 'teacher'], description: '按课时沉淀任务、活动与资源设计。' },
        { key: 'review_feedback', name: '评审反馈', required: false, allowedTools: ['FORUM', 'SURVEY'], roleIds: ['leader', 'expert'], description: '集中管理专家意见、修订记录与确认结论。' },
        { key: 'release_asset', name: '发布素材', required: false, allowedTools: ['URL', 'OFFICE_UPLOAD'], roleIds: ['leader'], description: '沉淀封面、课程介绍、推广文案和发布链接。' },
      ],
      agents: [
        { name: '课程策划助手', roleIds: ['leader'], knowledgeSource: '课程蓝图与知识图谱映射', prompt: '辅助梳理课程定位、课时结构和发布节奏。', avatar: '🧭' },
        { name: '教案共创助手', roleIds: ['teacher'], knowledgeSource: '课时设计与课程素材', prompt: '帮助生成课时目标、活动流程和资源建议。', avatar: '✍️' },
        { name: '评审助手', roleIds: ['expert'], knowledgeSource: '评审反馈与课程蓝图', prompt: '辅助汇总评审意见、识别风险并形成修订建议。', avatar: '🔍' },
      ],
      entryMethods: ['MANUAL', 'INVITATION'],
      recommendation: {
        enabled: true,
        resourceScope: '课程蓝图、知识图谱映射与课时设计资料',
        description: '根据课程结构、知识点和历史评审意见推荐参考素材与设计样例。',
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
        coverSource: 'PRESET',
        coverPresetId: 'abstract_mint',
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
      statusRules: buildSceneTypeStatusRules('COMMUNITY'),
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
      id: 'scene_course_studio_seed_1',
      sceneCode: 'SCN-COURSE-STUDIO',
      name: '课程创作中心',
      description: '围绕人工智能通识体系开展课程框架梳理、知识图谱映射与课时设计共创。',
      owner: '人工智能通识教研组',
      visibility: 'INTERNAL',
      menuKey: 'course-creation-center',
      topicCount: 11,
      templateId: byCode.get('TPL-COURSE-STUDIO')?.id,
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

function mergeMissingBuiltInTemplates(existingTemplates, presetTemplates) {
  const existingIdentitySet = new Set();
  existingTemplates.forEach((template) => {
    if (template?.id) existingIdentitySet.add(`id:${template.id}`);
    if (template?.templateCode) existingIdentitySet.add(`code:${template.templateCode}`);
  });
  return presetTemplates.filter((template) => (
    !existingIdentitySet.has(`id:${template.id}`) && !existingIdentitySet.has(`code:${template.templateCode}`)
  ));
}

function mergeMissingBuiltInScenes(existingScenes, templates) {
  const presetScenes = buildPresetScenes(templates);
  const existingIdentitySet = new Set();
  existingScenes.forEach((scene) => {
    if (scene?.id) existingIdentitySet.add(`id:${scene.id}`);
    if (scene?.sceneCode) existingIdentitySet.add(`code:${scene.sceneCode}`);
  });
  return presetScenes.filter((scene) => (
    !existingIdentitySet.has(`id:${scene.id}`) && !existingIdentitySet.has(`code:${scene.sceneCode}`)
  ));
}

function migrateBuiltInCourseStudioEntries(existingTemplates, existingScenes) {
  let templateChanged = false;
  let sceneChanged = false;
  const presetTemplates = buildPresetTemplates();
  const presetTemplate = presetTemplates.find((template) => (
    template?.id === 'tpl_course_studio_builtin' || template?.templateCode === 'TPL-COURSE-STUDIO'
  )) || null;
  const presetScenes = buildPresetScenes(presetTemplates);
  const presetScene = presetScenes.find((scene) => (
    scene?.id === 'scene_course_studio_seed_1' || scene?.sceneCode === 'SCN-COURSE-STUDIO'
  )) || null;

  const nextTemplates = existingTemplates.map((template) => {
    if (
      template?.id === 'tpl_course_studio_builtin'
      || template?.templateCode === 'TPL-COURSE-STUDIO'
    ) {
      const nextTemplate = {
        ...template,
        defaultMenuKey: 'course-creation-center',
        name: presetTemplate?.name || template.name,
        description: presetTemplate?.description || template.description,
        theme: presetTemplate?.theme ? clone(presetTemplate.theme) : template.theme,
        homepage: presetTemplate?.homepage ? clone(presetTemplate.homepage) : template.homepage,
        topicPage: presetTemplate?.topicPage ? clone(presetTemplate.topicPage) : template.topicPage,
      };
      const changed = JSON.stringify({
        defaultMenuKey: template.defaultMenuKey,
        name: template.name,
        description: template.description,
        theme: template.theme,
        homepage: template.homepage,
        topicPage: template.topicPage,
      }) !== JSON.stringify({
        defaultMenuKey: nextTemplate.defaultMenuKey,
        name: nextTemplate.name,
        description: nextTemplate.description,
        theme: nextTemplate.theme,
        homepage: nextTemplate.homepage,
        topicPage: nextTemplate.topicPage,
      });
      if (changed) {
        templateChanged = true;
        return {
          ...nextTemplate,
          updatedAt: nowIso(),
        };
      }
    }
    return template;
  });

  const nextScenes = existingScenes.map((scene) => {
    if (
      scene?.id === 'scene_course_studio_seed_1'
      || scene?.sceneCode === 'SCN-COURSE-STUDIO'
    ) {
      const nextScene = {
        ...scene,
        name: presetScene?.name || scene.name,
        description: presetScene?.description || scene.description,
        owner: presetScene?.owner || scene.owner,
        menuKey: 'course-creation-center',
        templateSnapshot: presetTemplate ? clone(presetTemplate) : scene.templateSnapshot,
      };
      const changed = JSON.stringify({
        name: scene.name,
        description: scene.description,
        owner: scene.owner,
        menuKey: scene.menuKey,
        templateSnapshot: scene.templateSnapshot,
      }) !== JSON.stringify({
        name: nextScene.name,
        description: nextScene.description,
        owner: nextScene.owner,
        menuKey: nextScene.menuKey,
        templateSnapshot: nextScene.templateSnapshot,
      });
      if (changed) {
        sceneChanged = true;
        return {
          ...nextScene,
          updatedAt: nowIso(),
        };
      }
    }
    return scene;
  });

  return {
    nextTemplates,
    nextScenes,
    templateChanged,
    sceneChanged,
  };
}

function migrateTemplateVersioningPolicy(existingTemplates) {
  let changed = false;
  const nextTemplates = existingTemplates.map((template) => {
    const shouldEnableVersioning = template?.sceneType === 'TRAINING';
    const normalizedVersioning = normalizeVersioningConfig(template?.versioning, template?.sceneType || 'CUSTOM');
    if (normalizedVersioning.enabled === shouldEnableVersioning) {
      return template;
    }
    changed = true;
    return {
      ...template,
      versioning: {
        ...normalizedVersioning,
        enabled: shouldEnableVersioning,
      },
      updatedAt: nowIso(),
    };
  });
  return {
    nextTemplates,
    changed,
  };
}

export function seedSceneData() {
  try {
    const existingTemplates = readTemplates();
    const existingScenes = readList(SCENE_STORAGE_KEY);

    if (existingTemplates.length === 0 && existingScenes.length === 0) {
      const templates = buildPresetTemplates();
      const scenes = buildPresetScenes(templates);
      writeList(TEMPLATE_STORAGE_KEY, templates);
      writeList(SCENE_STORAGE_KEY, scenes);
      localStorage.setItem(SEED_KEY, '1');
      localStorage.setItem(BUILT_IN_SYNC_KEY, '1');
      emitChange();
      return;
    }

    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(SEED_KEY, '1');
    }
    if (localStorage.getItem(BUILT_IN_SYNC_KEY)) {
      return;
    }

    const presetTemplates = buildPresetTemplates();
    const templatesToAppend = mergeMissingBuiltInTemplates(existingTemplates, presetTemplates);
    const mergedTemplates = templatesToAppend.length > 0
      ? [...existingTemplates, ...templatesToAppend]
      : existingTemplates;
    const { nextTemplates: migratedMenuTemplates, nextScenes, templateChanged, sceneChanged } = migrateBuiltInCourseStudioEntries(
      mergedTemplates,
      existingScenes,
    );
    const { nextTemplates, changed: versioningChanged } = migrateTemplateVersioningPolicy(migratedMenuTemplates);
    const scenesToAppend = mergeMissingBuiltInScenes(nextScenes, nextTemplates);

    if (templatesToAppend.length > 0 || templateChanged || versioningChanged) {
      writeList(TEMPLATE_STORAGE_KEY, nextTemplates);
    }
    if (scenesToAppend.length > 0 || sceneChanged) {
      writeList(SCENE_STORAGE_KEY, [...nextScenes, ...scenesToAppend]);
    }

    localStorage.setItem(BUILT_IN_SYNC_KEY, '1');
    if (templatesToAppend.length > 0 || scenesToAppend.length > 0 || templateChanged || sceneChanged || versioningChanged) {
      emitChange();
    }
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
  const roles = [createRoleDraft(1)];
  return normalizeTemplate({
    sceneType,
    status: 'ACTIVE',
    statusPresetSceneType: sceneType,
    versioning: {
      enabled: isSceneVersioningEnabledByDefault(sceneType),
    },
    roles,
    statusRules: buildSceneTypeStatusRules(sceneType, roles),
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
  trackEvent(existing ? 'space_template_update_success' : 'space_template_create_success', {
    module: 'space',
    objectType: 'scene_template',
    objectId: normalized.id,
    properties: {
      templateName: normalized.name,
      templateCode: normalized.templateCode,
      sceneType: normalized.sceneType,
      builtIn: normalized.builtIn,
      recommendationEnabled: normalized.recommendation?.enabled !== false,
    },
  });
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
  const target = list.find((item) => item.id === id);
  writeList(
    TEMPLATE_STORAGE_KEY,
    list.filter((item) => item.id !== id),
  );
  if (target) {
    trackEvent('space_template_delete_success', {
      module: 'space',
      objectType: 'scene_template',
      objectId: target.id,
      properties: {
        templateName: target.name,
        templateCode: target.templateCode,
        sceneType: target.sceneType,
      },
    });
  }
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
  trackEvent(existing ? 'space_scene_update_success' : 'space_scene_create_success', {
    module: 'space',
    objectType: 'scene',
    objectId: normalized.id,
    properties: {
      sceneName: normalized.name,
      sceneCode: normalized.sceneCode,
      sceneType: normalized.sceneType,
      templateName: normalized.templateName,
      visibility: normalized.visibility,
      menuKey: normalized.menuKey,
    },
  });
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
  trackEvent('space_scene_delete_success', {
    module: 'space',
    objectType: 'scene',
    objectId: target.id,
    properties: {
      sceneName: target.name,
      sceneCode: target.sceneCode,
      sceneType: target.sceneType,
      templateName: target.templateName,
      menuKey: target.menuKey,
    },
  });
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
