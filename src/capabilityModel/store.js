const INDUSTRY_STORAGE_KEY = 'gr.capability-model.industries.v3';
const SEQUENCE_STORAGE_KEY = 'gr.capability-model.sequences.v3';
const ROLE_STORAGE_KEY = 'gr.capability-model.roles.v3';
const MODEL_STORAGE_KEY = 'gr.capability-model.models.v3';
const EVIDENCE_TYPE_STORAGE_KEY = 'gr.capability-model.evidence-types.v1';
const REVIEW_SUBJECT_STORAGE_KEY = 'gr.capability-model.review-subjects.v1';
const SEED_KEY = 'gr.capability-model.seeded.v6';
const LEGACY_SEED_KEYS = ['gr.capability-model.seeded.v5', 'gr.capability-model.seeded.v3'];
const STORE_CHANGE_EVENT = 'gr:capability-model-change';
const MAX_CAPABILITY_DIMENSION_LEVEL = 4;

export const INDUSTRY_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

export const ROLE_STATUS_OPTIONS = INDUSTRY_STATUS_OPTIONS;

export const CAPABILITY_MODEL_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DISABLED', label: '已停用' },
];

export const CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS = [
  { value: 'LESSON_PLAN', label: '教案/课件' },
  { value: 'TASK_SHEET', label: '任务单/实训单' },
  { value: 'CLASS_VIDEO', label: '课堂录像/回看' },
  { value: 'ASSESSMENT_DATA', label: '考核数据/成绩分析' },
  { value: 'OBSERVATION_NOTE', label: '听评课/观察记录' },
  { value: 'RESEARCH_RECORD', label: '教研纪要/共创成果' },
  { value: 'ENTERPRISE_PRACTICE', label: '企业实践/企业项目' },
  { value: 'SAFETY_RECORD', label: '安全规范/实训记录' },
  { value: 'REVIEW_RESULT', label: '认定结果/评审结论' },
];

export const CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS = [
  { value: 'SELF', label: '本人' },
  { value: 'GROUP_LEADER', label: '教研组长' },
  { value: 'SUPERVISOR', label: '督导/教学管理者' },
  { value: 'ENTERPRISE_MENTOR', label: '企业导师' },
  { value: 'SCHOOL_REVIEW', label: '校级评审组' },
];

export const CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS = [
  { value: 'DISABLED', label: '不启用 AI' },
  { value: 'SUGGEST_ONLY', label: '仅建议稿' },
];

const LEVEL_LABEL_PRESETS = ['L1 认知', 'L2 应用', 'L3 熟练', 'L4 引领', 'L5 专家', 'L6 战略'];

function clone(data) {
  return JSON.parse(JSON.stringify(data));
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

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value, allowedValues = []) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(allowedValues);
  const normalized = value
    .map((item) => trimText(item))
    .filter(Boolean);
  return Array.from(new Set(
    allowed.size ? normalized.filter((item) => allowed.has(item)) : normalized,
  ));
}

function buildCapabilityItemDefaults(overrides = {}) {
  return {
    evidenceTypes: normalizeStringArray(overrides.evidenceTypes),
    requiredEvidenceCount: Math.max(1, Number(overrides.requiredEvidenceCount || 1)),
    requiredReviewRoles: normalizeStringArray(overrides.requiredReviewRoles),
    isGrowthOnly: Boolean(overrides.isGrowthOnly),
    aiAssistMode: trimText(overrides.aiAssistMode) || 'SUGGEST_ONLY',
  };
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function readList(storageKey) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[capability-model-store] failed to read ${storageKey}`, error);
    return [];
  }
}

function writeList(storageKey, list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(list));
}

function writeAll({ industries, sequences, roles, models, evidenceTypes, reviewSubjects }) {
  writeList(INDUSTRY_STORAGE_KEY, industries);
  writeList(SEQUENCE_STORAGE_KEY, sequences);
  writeList(ROLE_STORAGE_KEY, roles);
  writeList(MODEL_STORAGE_KEY, models);
  writeList(
    EVIDENCE_TYPE_STORAGE_KEY,
    Array.isArray(evidenceTypes) ? evidenceTypes : readList(EVIDENCE_TYPE_STORAGE_KEY),
  );
  writeList(
    REVIEW_SUBJECT_STORAGE_KEY,
    Array.isArray(reviewSubjects) ? reviewSubjects : readList(REVIEW_SUBJECT_STORAGE_KEY),
  );
  emitChange();
}

function readAll() {
  return {
    industries: readList(INDUSTRY_STORAGE_KEY),
    sequences: readList(SEQUENCE_STORAGE_KEY),
    roles: readList(ROLE_STORAGE_KEY),
    models: readList(MODEL_STORAGE_KEY).map((item) => normalizeModel(item)),
    evidenceTypes: readList(EVIDENCE_TYPE_STORAGE_KEY).map((item, index) => normalizeEvidenceType(item, index)),
    reviewSubjects: readList(REVIEW_SUBJECT_STORAGE_KEY).map((item, index) => normalizeReviewSubject(item, index)),
  };
}

function ensureRequired(value, label) {
  if (!trimText(value)) {
    throw new Error(`请输入${label}`);
  }
}

function ensureUniqueCode(list, code, currentId, label) {
  const duplicated = list.find((item) => item.code === code && item.id !== currentId);
  if (duplicated) {
    throw new Error(`${label}已存在`);
  }
}

function findSequenceByRole(role, sequences) {
  return sequences.find((item) => item.id === role?.sequenceId);
}

function createDuplicateModelCode(models, sourceCode) {
  let candidate = `${sourceCode}_COPY`;
  let index = 2;
  while (models.some((item) => item.modelCode === candidate)) {
    candidate = `${sourceCode}_COPY${index}`;
    index += 1;
  }
  return candidate;
}

function getModelVersionSeriesId(model) {
  return trimText(model?.versionSeriesId) || trimText(model?.id);
}

function getModelVersionNumber(model) {
  const value = Number.parseInt(model?.versionNumber, 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function createVersionModelCode(models, source, versionNumber) {
  const codeRoot = trimText(source?.versionCodeRoot) || trimText(source?.modelCode) || 'CAPABILITY_MODEL';
  let candidate = `${codeRoot}_V${versionNumber}`;
  let index = 2;
  while (models.some((item) => item.modelCode === candidate)) {
    candidate = `${codeRoot}_V${versionNumber}_${index}`;
    index += 1;
  }
  return candidate;
}

export function getCapabilityModelStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export function createDefaultLevelScheme(count = 4) {
  const safeCount = Math.max(2, Math.min(6, Number(count || 4)));
  return {
    count: safeCount,
    levels: Array.from({ length: safeCount }, (_, index) => ({
      key: `L${index + 1}`,
      label: LEVEL_LABEL_PRESETS[index] || `L${index + 1}`,
    })),
  };
}

function normalizeLevelScheme(levelScheme) {
  const fallback = createDefaultLevelScheme();
  const sourceLevels = Array.isArray(levelScheme?.levels) ? levelScheme.levels : fallback.levels;
  const count = Math.max(2, Math.min(6, Number(levelScheme?.count || sourceLevels.length || 4)));
  const levels = Array.from({ length: count }, (_, index) => {
    const current = sourceLevels[index] || {};
    return {
      key: `L${index + 1}`,
      label: trimText(current.label) || LEVEL_LABEL_PRESETS[index] || `L${index + 1}`,
    };
  });
  return { count, levels };
}

export function createEmptyCapabilityItem(levelScheme, overrides = {}) {
  const scheme = normalizeLevelScheme(levelScheme);
  return {
    id: overrides.id || createId('cap_item'),
    parentItemId: trimText(overrides.parentItemId) || null,
    name: overrides.name || '',
    description: overrides.description || '',
    sortNo: overrides.sortNo ?? 1,
    levelDescriptors: scheme.levels.map((level, index) => ({
      levelKey: level.key,
      text: overrides.levelDescriptors?.[index]?.text || '',
    })),
    evidenceExamples: Array.isArray(overrides.evidenceExamples) ? [...overrides.evidenceExamples] : [],
    ...buildCapabilityItemDefaults(overrides),
  };
}

export function createEmptyCapabilityDimension(levelScheme, overrides = {}) {
  const scheme = normalizeLevelScheme(levelScheme);
  const items = Array.isArray(overrides.items) && overrides.items.length
    ? overrides.items.map((item, index) => createEmptyCapabilityItem(scheme, { ...item, sortNo: index + 1 }))
    : [createEmptyCapabilityItem(scheme)];
  const level = Math.max(1, Math.min(MAX_CAPABILITY_DIMENSION_LEVEL, Number(overrides.level || 1)));
  return {
    id: overrides.id || createId('cap_dim'),
    parentId: overrides.parentId || null,
    level,
    name: overrides.name || '',
    description: overrides.description || '',
    sortNo: overrides.sortNo ?? 1,
    items,
  };
}

export function createCapabilityModelDraft(overrides = {}) {
  const levelScheme = normalizeLevelScheme(overrides.levelScheme);
  const dimensions = Array.isArray(overrides.dimensions) && overrides.dimensions.length
    ? overrides.dimensions.map((dimension, index) => createEmptyCapabilityDimension(levelScheme, { ...dimension, sortNo: index + 1 }))
    : [createEmptyCapabilityDimension(levelScheme)];
  const modelId = overrides.id;
  const modelCode = overrides.modelCode || '';

  return {
    id: modelId,
    modelCode,
    name: overrides.name || '',
    industryId: overrides.industryId || undefined,
    roleId: overrides.roleId || undefined,
    roleLevelId: overrides.roleLevelId || undefined,
    description: overrides.description || '',
    tags: Array.isArray(overrides.tags) ? [...overrides.tags] : [],
    status: overrides.status || 'DRAFT',
    versionSeriesId: overrides.versionSeriesId || modelId || '',
    versionNumber: getModelVersionNumber(overrides),
    versionCodeRoot: overrides.versionCodeRoot || modelCode,
    isCurrentVersion: Boolean(overrides.isCurrentVersion),
    publishedAt: overrides.publishedAt || null,
    levelScheme,
    dimensions,
    updatedAt: overrides.updatedAt || nowText(),
    createdAt: overrides.createdAt || nowText(),
  };
}

function normalizeEvidenceExamples(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimText(item)).filter(Boolean);
  }
  return [];
}

function normalizeItem(item, levelScheme, index) {
  const descriptors = Array.from({ length: levelScheme.levels.length }, (_, descriptorIndex) => ({
    levelKey: levelScheme.levels[descriptorIndex].key,
    text: trimText(item?.levelDescriptors?.[descriptorIndex]?.text || ''),
  }));
  return {
    id: item?.id || createId('cap_item'),
    parentItemId: trimText(item?.parentItemId) || null,
    name: trimText(item?.name),
    description: trimText(item?.description),
    sortNo: index + 1,
    levelDescriptors: descriptors,
    evidenceExamples: normalizeEvidenceExamples(item?.evidenceExamples),
    ...buildCapabilityItemDefaults(item),
  };
}

function normalizeDimension(dimension, levelScheme, index) {
  const items = (Array.isArray(dimension?.items) ? dimension.items : [])
    .map((item, itemIndex) => normalizeItem(item, levelScheme, itemIndex))
    .filter((item) => item.name);
  const itemIds = new Set(items.map((item) => item.id));
  return {
    id: dimension?.id || createId('cap_dim'),
    parentId: dimension?.parentId || null,
    level: Math.max(1, Math.min(MAX_CAPABILITY_DIMENSION_LEVEL, Number(dimension?.level || 1))),
    name: trimText(dimension?.name),
    description: trimText(dimension?.description),
    sortNo: index + 1,
    items: items.map((item) => ({
      ...item,
      parentItemId: item.parentItemId && itemIds.has(item.parentItemId) && item.parentItemId !== item.id
        ? item.parentItemId
        : null,
    })),
  };
}

function normalizeModel(model) {
  const levelScheme = normalizeLevelScheme(model?.levelScheme);
  const initialDimensions = (Array.isArray(model?.dimensions) ? model.dimensions : [])
    .map((dimension, index) => normalizeDimension(dimension, levelScheme, index))
    .filter((dimension) => dimension.name);
  const dimensionIds = new Set(initialDimensions.map((dimension) => dimension.id));
  const dimensionMap = new Map(initialDimensions.map((dimension) => [dimension.id, dimension]));
  const resolveLevel = (dimension, visiting = new Set()) => {
    if (!dimension?.parentId || !dimensionIds.has(dimension.parentId) || visiting.has(dimension.id)) {
      dimension.parentId = null;
      dimension.level = 1;
      return 1;
    }
    visiting.add(dimension.id);
    const parent = dimensionMap.get(dimension.parentId);
    const parentLevel = resolveLevel(parent, visiting);
    if (parentLevel >= MAX_CAPABILITY_DIMENSION_LEVEL) {
      dimension.parentId = null;
      dimension.level = 1;
      return 1;
    }
    dimension.level = Math.min(MAX_CAPABILITY_DIMENSION_LEVEL, parentLevel + 1);
    return dimension.level;
  };
  initialDimensions.forEach((dimension) => resolveLevel(dimension));
  const dimensions = initialDimensions.map((dimension, index) => ({
    ...dimension,
    sortNo: index + 1,
  }));
  const id = model?.id || createId('cap_model');
  const modelCode = trimText(model?.modelCode);
  const status = model?.status || 'DRAFT';

  return {
    id,
    modelCode,
    name: trimText(model?.name),
    industryId: model?.industryId || '',
    roleId: model?.roleId || '',
    roleLevelId: model?.roleLevelId || '',
    description: trimText(model?.description),
    tags: Array.isArray(model?.tags) ? model.tags.map((item) => trimText(item)).filter(Boolean) : [],
    status,
    versionSeriesId: trimText(model?.versionSeriesId) || id,
    versionNumber: getModelVersionNumber(model),
    versionCodeRoot: trimText(model?.versionCodeRoot) || modelCode,
    isCurrentVersion: typeof model?.isCurrentVersion === 'boolean' ? model.isCurrentVersion : status === 'PUBLISHED',
    publishedAt: trimText(model?.publishedAt) || null,
    levelScheme,
    dimensions,
    updatedAt: model?.updatedAt || nowText(),
    createdAt: model?.createdAt || nowText(),
  };
}

function normalizeSequenceLevel(level, index) {
  return {
    id: level?.id || createId('sequence_level'),
    code: trimText(level?.code),
    name: trimText(level?.name),
    description: trimText(level?.description),
    sortNo: index + 1,
  };
}

function normalizeIndustry(industry, index) {
  return {
    id: industry?.id || createId('industry'),
    code: trimText(industry?.code),
    name: trimText(industry?.name),
    description: trimText(industry?.description),
    status: industry?.status || 'ACTIVE',
    sortNo: Number(industry?.sortNo || index + 1),
  };
}

function normalizeSequence(sequence, index) {
  const levels = (Array.isArray(sequence?.levels) ? sequence.levels : [])
    .map((level, levelIndex) => normalizeSequenceLevel(level, levelIndex))
    .filter((level) => level.name);
  return {
    id: sequence?.id || createId('sequence'),
    industryId: sequence?.industryId || '',
    code: trimText(sequence?.code),
    name: trimText(sequence?.name),
    description: trimText(sequence?.description),
    status: sequence?.status || 'ACTIVE',
    sortNo: Number(sequence?.sortNo || index + 1),
    levels,
  };
}

function normalizeRole(role, index) {
  return {
    id: role?.id || createId('role'),
    industryId: role?.industryId || '',
    sequenceId: role?.sequenceId || '',
    code: trimText(role?.code),
    name: trimText(role?.name),
    description: trimText(role?.description),
    status: role?.status || 'ACTIVE',
    sortNo: Number(role?.sortNo || index + 1),
  };
}

function createSequenceRuleId(prefix, sequenceId, code, index) {
  const normalizedCode = trimText(code)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${prefix}_${sequenceId || 'sequence'}_${normalizedCode || index + 1}`;
}

function normalizeSequenceRuleEntry(entry, index, prefix) {
  const code = trimText(entry?.code ?? entry?.value);
  const sequenceId = trimText(entry?.sequenceId);
  return {
    id: entry?.id || createSequenceRuleId(prefix, sequenceId, code, index),
    sequenceId,
    code,
    name: trimText(entry?.name ?? entry?.label),
    description: trimText(entry?.description),
    status: entry?.status || 'ACTIVE',
    sortNo: Number(entry?.sortNo || index + 1),
  };
}

function normalizeEvidenceType(entry, index) {
  return normalizeSequenceRuleEntry(entry, index, 'evidence_type');
}

function normalizeReviewSubject(entry, index) {
  return normalizeSequenceRuleEntry(entry, index, 'review_subject');
}

function createDefaultEvidenceTypesForSequence(sequenceId) {
  return CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS.map((item, index) => normalizeEvidenceType({
    id: createSequenceRuleId('evidence_type', sequenceId, item.value, index),
    sequenceId,
    code: item.value,
    name: item.label,
    status: 'ACTIVE',
    sortNo: index + 1,
  }, index));
}

function createDefaultReviewSubjectsForSequence(sequenceId) {
  return CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS.map((item, index) => normalizeReviewSubject({
    id: createSequenceRuleId('review_subject', sequenceId, item.value, index),
    sequenceId,
    code: item.value,
    name: item.label,
    status: 'ACTIVE',
    sortNo: index + 1,
  }, index));
}

function createDefaultRuleCatalogsForSequences(sequences = []) {
  return {
    evidenceTypes: sequences.flatMap((sequence) => createDefaultEvidenceTypesForSequence(sequence.id)),
    reviewSubjects: sequences.flatMap((sequence) => createDefaultReviewSubjectsForSequence(sequence.id)),
  };
}

function ensureDefaultRulesForSequences(data) {
  const next = clone({
    ...data,
    evidenceTypes: Array.isArray(data?.evidenceTypes) ? data.evidenceTypes : [],
    reviewSubjects: Array.isArray(data?.reviewSubjects) ? data.reviewSubjects : [],
  });
  let changed = false;

  const appendMissingRules = (list, sequenceId, defaults) => {
    const existingCodes = new Set(
      list
        .filter((item) => item.sequenceId === sequenceId)
        .map((item) => item.code)
        .filter(Boolean),
    );
    defaults.forEach((item) => {
      if (existingCodes.has(item.code)) return;
      list.push(item);
      existingCodes.add(item.code);
      changed = true;
    });
  };

  (next.sequences || []).forEach((sequence) => {
    appendMissingRules(next.evidenceTypes, sequence.id, createDefaultEvidenceTypesForSequence(sequence.id));
    appendMissingRules(next.reviewSubjects, sequence.id, createDefaultReviewSubjectsForSequence(sequence.id));
  });

  next.evidenceTypes = next.evidenceTypes.map((item, index) => normalizeEvidenceType(item, index));
  next.reviewSubjects = next.reviewSubjects.map((item, index) => normalizeReviewSubject(item, index));

  return { data: next, changed };
}

function sortSequenceRuleEntries(list = []) {
  return [...list].sort((left, right) => {
    if ((left.sequenceId || '') !== (right.sequenceId || '')) {
      return String(left.sequenceId || '').localeCompare(String(right.sequenceId || ''));
    }
    return (left.sortNo || 0) - (right.sortNo || 0);
  });
}

function ensureUniqueSequenceRuleCode(list, normalized, label) {
  const duplicated = list.find((item) => (
    item.sequenceId === normalized.sequenceId
    && item.code === normalized.code
    && item.id !== normalized.id
  ));
  if (duplicated) {
    throw new Error(`同一能力序列下的${label}编码不能重复`);
  }
}

function isSequenceRuleReferenced(rule, models, roles, fieldName) {
  if (!rule?.sequenceId || !rule?.code) return false;
  return models.some((model) => {
    const role = roles.find((item) => item.id === model.roleId);
    if (role?.sequenceId !== rule.sequenceId) return false;
    return (model.dimensions || []).some((dimension) => (
      (dimension.items || []).some((item) => (
        Array.isArray(item?.[fieldName]) && item[fieldName].includes(rule.code)
      ))
    ));
  });
}

function ensureModelValid(model) {
  ensureRequired(model.name, '模型名称');
  ensureRequired(model.modelCode, '模型编码');
  ensureRequired(model.industryId, '所属行业');
  ensureRequired(model.roleId, '所属岗位');
  ensureRequired(model.roleLevelId, '所属序列等级');
  if (!Array.isArray(model.dimensions) || model.dimensions.length === 0) {
    throw new Error('请至少配置一个能力类');
  }
  if (model.dimensions.some((dimension) => !dimension.items?.length)) {
    throw new Error('每个能力类至少保留一个能力项');
  }
}

function createVocationalCapabilityItem(config) {
  return {
    ...config,
    aiAssistMode: config.aiAssistMode || 'SUGGEST_ONLY',
    requiredEvidenceCount: config.requiredEvidenceCount || 2,
    requiredReviewRoles: config.requiredReviewRoles || ['SELF', 'GROUP_LEADER'],
    evidenceTypes: config.evidenceTypes || ['TASK_SHEET', 'CLASS_VIDEO'],
    evidenceExamples: config.evidenceExamples || [],
  };
}

function makeVocationalTeacherModel(levelScheme, roleLevelId, name, modelCode, description, tags = [], overrides = {}) {
  const isLecturer = roleLevelId === 'sequence_vocational_teacher_growth_l1';
  const isDual = roleLevelId === 'sequence_vocational_teacher_growth_l2';
  const isLead = roleLevelId === 'sequence_vocational_teacher_growth_l3';

  return createCapabilityModelDraft({
    id: createId(overrides.idPrefix || 'cap_model_vocational_teacher'),
    modelCode,
    name,
    industryId: overrides.industryId || 'industry_vocational_edu',
    roleId: overrides.roleId || 'role_vocational_teacher',
    roleLevelId,
    status: 'PUBLISHED',
    tags,
    description,
    levelScheme,
    dimensions: [
      {
        id: 'dim_vocational_task_transfer',
        name: '岗位任务转化',
        description: '围绕岗位工作过程拆解教学目标、任务链与学习情境。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_task_analysis',
            name: '岗位任务分析',
            description: '能将岗位典型工作任务转化为教学任务和学习目标。',
            levelDescriptors: [
              { text: '能识别岗位典型任务并整理基础流程。' },
              { text: '能把岗位任务拆解为教学目标、任务步骤和产出要求。' },
              { text: '能结合企业标准重构跨任务链的项目化学习方案。' },
              { text: '能主导专业群岗位任务图谱与课程任务标准建设。' },
            ],
            evidenceExamples: ['岗位任务分析表', '课程任务链设计稿'],
            evidenceTypes: ['TASK_SHEET', 'LESSON_PLAN', 'ENTERPRISE_PRACTICE'],
            requiredEvidenceCount: isLead ? 3 : 2,
            requiredReviewRoles: isLead ? ['SELF', 'GROUP_LEADER', 'ENTERPRISE_MENTOR'] : ['SELF', 'GROUP_LEADER'],
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_context_design',
            name: '学习情境设计',
            description: '能把企业情境、工单或项目案例融入课堂任务设计。',
            levelDescriptors: [
              { text: '能使用现成案例组织基础教学活动。' },
              { text: '能根据岗位情境设计任务驱动学习活动。' },
              { text: '能构建理实一体、项目递进的学习情境。' },
              { text: '能沉淀校企共享的典型教学情境案例库。' },
            ],
            evidenceExamples: ['企业案例改编教案', '项目任务情境包'],
            evidenceTypes: ['LESSON_PLAN', 'TASK_SHEET', 'ENTERPRISE_PRACTICE'],
          }),
        ],
      },
      {
        id: 'dim_vocational_integration',
        name: '理实一体教学',
        description: '强调理论讲解、示范操作、任务实操与复盘一体化组织能力。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_demo_training',
            name: '示范与实操衔接',
            description: '能把讲解示范、任务实践和过程指导串成完整教学闭环。',
            levelDescriptors: [
              { text: '能完成基础示范和实操组织。' },
              { text: '能在示范后组织学生完成标准化任务实操。' },
              { text: '能针对差异化学情调配示范、实操和复盘节奏。' },
              { text: '能形成可复制的理实一体教学范式并指导团队。' },
            ],
            evidenceExamples: ['实训课录像', '过程指导记录'],
            evidenceTypes: ['CLASS_VIDEO', 'TASK_SHEET', 'OBSERVATION_NOTE'],
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_process_guidance',
            name: '过程指导与纠偏',
            description: '能在学生实操过程中及时发现偏差并进行纠正指导。',
            levelDescriptors: [
              { text: '能指出明显操作错误。' },
              { text: '能围绕关键步骤进行过程指导和即时反馈。' },
              { text: '能基于过程数据和作品表现实施分层纠偏。' },
              { text: '能建立团队共用的过程指导清单和观察标准。' },
            ],
            evidenceExamples: ['实操观察表', '作品讲评记录'],
            evidenceTypes: ['CLASS_VIDEO', 'OBSERVATION_NOTE', 'ASSESSMENT_DATA'],
          }),
        ],
      },
      {
        id: 'dim_vocational_safety',
        name: '实训组织与安全规范',
        description: '关注设备使用、现场组织、安全规范与质量控制。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_safety_control',
            name: '安全规范落实',
            description: '能组织实训现场并落实安全规范、设备检查和风险提示。',
            levelDescriptors: [
              { text: '能按要求完成实训前安全提醒。' },
              { text: '能组织设备检查并规范学生操作流程。' },
              { text: '能预判风险点并建立完整的安全控制措施。' },
              { text: '能主导建设专业实训安全规范与巡检机制。' },
            ],
            evidenceExamples: ['实训安全检查表', '设备点检记录'],
            evidenceTypes: ['SAFETY_RECORD', 'TASK_SHEET', 'OBSERVATION_NOTE'],
            requiredReviewRoles: ['SELF', 'GROUP_LEADER', 'SUPERVISOR'],
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_quality_control',
            name: '过程质量控制',
            description: '能对实训过程和产出质量进行标准化检查与反馈。',
            levelDescriptors: [
              { text: '能依据标准完成基础检查。' },
              { text: '能根据质量标准进行过程抽检和反馈。' },
              { text: '能构建任务过程与成果质量联动的检查机制。' },
              { text: '能推动专业层面的质量标准和抽检模板共用。' },
            ],
            evidenceExamples: ['质量抽检表', '成果验收记录'],
            evidenceTypes: ['ASSESSMENT_DATA', 'SAFETY_RECORD', 'REVIEW_RESULT'],
            requiredEvidenceCount: isLead ? 3 : 2,
          }),
        ],
      },
      {
        id: 'dim_vocational_assessment',
        name: '学习评价与技能考核',
        description: '强调技能评价、过程记录、结果反馈与证书考核衔接。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_rubric',
            name: '技能考核量规设计',
            description: '能设计与岗位标准一致的技能评价指标和评分规则。',
            levelDescriptors: [
              { text: '能按既有模板完成基础评分表。' },
              { text: '能结合任务要求设计分项评价标准。' },
              { text: '能把岗位标准、作品质量和过程表现纳入同一量规。' },
              { text: '能建立专业共用的技能评价模板并推动应用。' },
            ],
            evidenceExamples: ['技能考核量规', '评分规则说明'],
            evidenceTypes: ['ASSESSMENT_DATA', 'TASK_SHEET', 'RESEARCH_RECORD'],
            requiredReviewRoles: isDual || isLead ? ['SELF', 'GROUP_LEADER', 'ENTERPRISE_MENTOR'] : ['SELF', 'GROUP_LEADER'],
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_data_feedback',
            name: '考核数据反馈应用',
            description: '能利用技能考核数据分析问题并反馈到教学改进。',
            levelDescriptors: [
              { text: '能查看基础成绩和通过率。' },
              { text: '能识别主要薄弱点并提出改进建议。' },
              { text: '能形成阶段性复盘并调整教学与实训安排。' },
              { text: '能建立专业层面的考核数据分析模板与改进机制。' },
            ],
            evidenceExamples: ['技能考核分析表', '改进复盘纪要'],
            evidenceTypes: ['ASSESSMENT_DATA', 'RESEARCH_RECORD', 'REVIEW_RESULT'],
          }),
        ],
      },
      {
        id: 'dim_vocational_enterprise',
        name: '校企协同与企业实践',
        description: '关注企业实践、行业标准引入和校企共建能力。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_enterprise_project',
            name: '企业项目融入',
            description: '能将企业项目、工单或真实案例转化为教学资源。',
            levelDescriptors: [
              { text: '能理解企业项目基本流程。' },
              { text: '能把企业案例嵌入课程任务。' },
              { text: '能持续引入真实项目并形成课程转化成果。' },
              { text: '能牵头校企联合开发课程和项目资源。' },
            ],
            evidenceExamples: ['企业项目转化方案', '校企共建课程资料'],
            evidenceTypes: ['ENTERPRISE_PRACTICE', 'LESSON_PLAN', 'RESEARCH_RECORD'],
            requiredReviewRoles: ['SELF', 'GROUP_LEADER', 'ENTERPRISE_MENTOR'],
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_industry_update',
            name: '行业标准更新',
            description: '能跟进行业技术标准变化并更新课程内容与设备要求。',
            levelDescriptors: [
              { text: '能关注行业标准和设备变化。' },
              { text: '能将标准变化同步到课程和实训要求。' },
              { text: '能组织团队完成课程与标准的对齐更新。' },
              { text: '能主导专业建设中的行业标准引入机制。' },
            ],
            evidenceExamples: ['企业实践总结', '标准更新对照表'],
            evidenceTypes: ['ENTERPRISE_PRACTICE', 'RESEARCH_RECORD', 'REVIEW_RESULT'],
            requiredEvidenceCount: isLead ? 3 : 2,
          }),
        ],
      },
      {
        id: 'dim_vocational_leadership',
        name: '专业建设与团队引领',
        description: '面向双师团队培养、专业建设和制度化沉淀。',
        items: [
          createVocationalCapabilityItem({
            id: 'item_vocational_team_support',
            name: '双师团队带教',
            description: '能在团队中分享经验、带教青年教师并沉淀共同标准。',
            levelDescriptors: [
              { text: '能参与组内共备和基础分享。' },
              { text: '能输出资源并支持同伴改进课堂或实训。' },
              { text: '能牵头专题教研和双师共创活动。' },
              { text: '能主导专业团队培养机制和跨校推广。' },
            ],
            evidenceExamples: ['带教记录', '专题教研成果'],
            evidenceTypes: ['RESEARCH_RECORD', 'OBSERVATION_NOTE', 'REVIEW_RESULT'],
            requiredEvidenceCount: isLecturer ? 1 : 2,
            requiredReviewRoles: isLead ? ['SELF', 'GROUP_LEADER', 'SCHOOL_REVIEW'] : ['SELF', 'GROUP_LEADER'],
            isGrowthOnly: isLecturer,
          }),
          createVocationalCapabilityItem({
            id: 'item_vocational_program_building',
            name: '专业建设推进',
            description: '能参与或主导课程体系、实训条件和专业标准建设。',
            levelDescriptors: [
              { text: '能参与专业建设基础工作。' },
              { text: '能承担课程或实训条件建设任务。' },
              { text: '能牵头推进课程体系、标准和资源建设。' },
              { text: '能主导专业建设方案、校企协同机制和成果推广。' },
            ],
            evidenceExamples: ['专业建设方案', '课程标准修订记录'],
            evidenceTypes: ['RESEARCH_RECORD', 'ENTERPRISE_PRACTICE', 'REVIEW_RESULT'],
            requiredEvidenceCount: isLead ? 3 : 2,
            requiredReviewRoles: isLead ? ['SELF', 'GROUP_LEADER', 'SCHOOL_REVIEW'] : ['SELF', 'GROUP_LEADER'],
            isGrowthOnly: isLecturer,
          }),
        ],
      },
    ],
  });
}

function makeTeacherModel(levelScheme, roleLevelId, name, modelCode, description, tags = [], overrides = {}) {
  return createCapabilityModelDraft({
    id: createId(overrides.idPrefix || 'cap_model_teacher'),
    modelCode,
    name,
    industryId: overrides.industryId || 'industry_edu',
    roleId: overrides.roleId || 'role_teacher',
    roleLevelId,
    status: 'PUBLISHED',
    tags,
    description,
    levelScheme,
    dimensions: [
      {
        id: 'dim_teacher_design',
        name: '教学设计',
        description: '围绕课程目标、学情分析与活动编排形成完整教学设计。',
        items: [
          {
            id: 'item_teacher_goal',
            name: '目标与学情对齐',
            description: '能根据学习者特点设定清晰且可评价的教学目标。',
            levelDescriptors: [
              { text: '能理解课程目标，但教学目标表述较泛。' },
              { text: '能结合学情拆解教学目标并对应基本活动。' },
              { text: '能根据差异化学情设计分层目标与学习路径。' },
              { text: '能沉淀跨学段可复用的目标设计方法并指导他人。' },
            ],
            evidenceExamples: ['目标-活动-评价一致性设计稿', '学情诊断记录'],
          },
          {
            id: 'item_teacher_activity',
            name: '学习活动设计',
            description: '能设计与目标匹配的课堂任务、资源与互动节奏。',
            levelDescriptors: [
              { text: '能套用现成活动模板完成课堂活动安排。' },
              { text: '能结合目标调整活动节奏与资源配置。' },
              { text: '能设计探究、协作、反思等复合型学习活动。' },
              { text: '能建立校本活动设计范式并推广使用。' },
            ],
            evidenceExamples: ['课堂任务单', '学习活动流程图'],
          },
        ],
      },
      {
        id: 'dim_teacher_delivery',
        name: '课堂实施',
        description: '聚焦课堂组织、互动引导与即时反馈能力。',
        items: [
          {
            id: 'item_teacher_interaction',
            name: '互动引导',
            description: '能通过提问、讨论、示范等方式引导学生深度参与。',
            levelDescriptors: [
              { text: '能按预设问题组织基础互动。' },
              { text: '能根据课堂反馈及时调整互动方式。' },
              { text: '能促进高质量讨论并激发学生主动表达。' },
              { text: '能形成高参与课堂方法论并用于示范课。' },
            ],
            evidenceExamples: ['课堂观察记录', '互动设计脚本'],
          },
          {
            id: 'item_teacher_regulation',
            name: '课堂调控',
            description: '能处理课堂节奏、突发情况与学习差异。',
            levelDescriptors: [
              { text: '能维持基本课堂秩序与时间安排。' },
              { text: '能根据学生表现做适度的节奏调整。' },
              { text: '能在复杂课堂情境下兼顾进度与学习效果。' },
              { text: '能提炼高难度课堂调控案例并进行经验输出。' },
            ],
            evidenceExamples: ['课堂回看分析', '班级管理案例'],
          },
        ],
      },
      {
        id: 'dim_teacher_assessment',
        name: '学习评价',
        description: '覆盖过程性评价、结果性评价与反馈应用。',
        items: [
          {
            id: 'item_teacher_feedback',
            name: '形成性反馈',
            description: '能在教学过程中进行有效观察、记录和反馈。',
            levelDescriptors: [
              { text: '能进行基础课堂观察并给出简单反馈。' },
              { text: '能根据表现数据给出针对性反馈。' },
              { text: '能设计形成性评价工具并反哺教学调整。' },
              { text: '能建立团队评价工具包并推动应用。' },
            ],
            evidenceExamples: ['评价量规', '学生成长记录'],
          },
          {
            id: 'item_teacher_data',
            name: '评价数据应用',
            description: '能使用学习数据分析教学效果与改进方向。',
            levelDescriptors: [
              { text: '能查看基础成绩和完成率数据。' },
              { text: '能识别主要问题并提出改进建议。' },
              { text: '能形成阶段性数据复盘并调整教学策略。' },
              { text: '能建立年级/学科层面的数据分析模板。' },
            ],
            evidenceExamples: ['阶段数据分析表', '教学改进方案'],
          },
        ],
      },
      {
        id: 'dim_teacher_growth',
        name: '专业发展',
        description: '强调教研反思、协作共享与持续精进。',
        items: [
          {
            id: 'item_teacher_reflection',
            name: '教学反思',
            description: '能对教学过程和结果进行系统复盘。',
            levelDescriptors: [
              { text: '能在课后完成基础反思记录。' },
              { text: '能围绕关键问题进行结构化复盘。' },
              { text: '能通过连续反思迭代稳定提升教学质量。' },
              { text: '能输出高质量教学案例并影响团队。' },
            ],
            evidenceExamples: ['教学反思日志', '示范课复盘报告'],
          },
          {
            id: 'item_teacher_collab',
            name: '教研协同',
            description: '能参与并推动集体备课、资源共建与经验传播。',
            levelDescriptors: [
              { text: '能参与日常教研活动并完成分配任务。' },
              { text: '能主动贡献资源并参与集体共创。' },
              { text: '能牵头组织专题教研并形成成果。' },
              { text: '能主导跨校教研协同与经验推广。' },
            ],
            evidenceExamples: ['教研活动纪要', '共享资源包'],
          },
        ],
      },
    ],
  });
}

function createEducationIndustries() {
  return [
    normalizeIndustry({
      id: 'industry_edu',
      code: 'BASIC_EDU',
      name: '基础教育',
      description: '覆盖中小学教师、班主任、教研员等典型岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 0),
    normalizeIndustry({
      id: 'industry_vocational_edu',
      code: 'VOCATIONAL_EDU',
      name: '职业教育',
      description: '覆盖职业院校教师、双师型讲师、专业带头人等岗位。',
      status: 'ACTIVE',
      sortNo: 2,
    }, 1),
    normalizeIndustry({
      id: 'industry_higher_edu',
      code: 'HIGHER_EDU',
      name: '高等教育',
      description: '覆盖高校教师、课程负责人、学科带头人等岗位。',
      status: 'ACTIVE',
      sortNo: 3,
    }, 2),
  ];
}

function createEducationSequences() {
  return [
    normalizeSequence({
      id: 'sequence_teacher_growth',
      industryId: 'industry_edu',
      code: 'BASIC_TEACHER_GROWTH',
      name: '基础教育教师发展序列',
      description: '覆盖基础教育教师从入职到学科引领阶段的发展等级。',
      status: 'ACTIVE',
      sortNo: 1,
      levels: [
        { id: 'sequence_teacher_growth_l1', code: 'NEW', name: '新教师', description: '入职 1-3 年，以课堂基本功和教学执行为重点。', sortNo: 1 },
        { id: 'sequence_teacher_growth_l2', code: 'YOUNG', name: '青年教师', description: '能够独立完成稳定授课，并承担基础教研任务。', sortNo: 2 },
        { id: 'sequence_teacher_growth_l3', code: 'BACKBONE', name: '骨干教师', description: '在学科教学、教研共创和示范引领上承担核心角色。', sortNo: 3 },
        { id: 'sequence_teacher_growth_l4', code: 'LEAD', name: '学科带头人', description: '主导学科建设、校本教研和跨团队经验推广。', sortNo: 4 },
      ],
    }, 0),
    normalizeSequence({
      id: 'sequence_teaching_research',
      industryId: 'industry_edu',
      code: 'BASIC_TEACHING_RESEARCH',
      name: '基础教育教研发展序列',
      description: '面向基础教育教研统筹、课程研究与教师指导岗位的成长路径。',
      status: 'ACTIVE',
      sortNo: 2,
      levels: [
        { id: 'sequence_teaching_research_l1', code: 'SPECIALIST', name: '教研专员', description: '承担学科资源整理与基础教研组织工作。', sortNo: 1 },
        { id: 'sequence_teaching_research_l2', code: 'SENIOR', name: '高级教研员', description: '负责专题研究、教师指导和课程质量改进。', sortNo: 2 },
      ],
    }, 1),
    normalizeSequence({
      id: 'sequence_vocational_teacher_growth',
      industryId: 'industry_vocational_edu',
      code: 'VOCATIONAL_TEACHER_GROWTH',
      name: '职教教师发展序列',
      description: '覆盖职业教育教师从课程授课到专业建设引领的发展等级。',
      status: 'ACTIVE',
      sortNo: 1,
      levels: [
        { id: 'sequence_vocational_teacher_growth_l1', code: 'LECTURER', name: '初任讲师', description: '承担基础课程授课与实训协助，重点提升课堂组织和任务转化能力。', sortNo: 1 },
        { id: 'sequence_vocational_teacher_growth_l2', code: 'DUAL', name: '双师型骨干讲师', description: '能够完成项目化教学设计，并将企业案例融入教学与评价。', sortNo: 2 },
        { id: 'sequence_vocational_teacher_growth_l3', code: 'LEAD', name: '专业带头人', description: '主导专业建设、校企协同和双师团队培养。', sortNo: 3 },
      ],
    }, 2),
    normalizeSequence({
      id: 'sequence_higher_teacher_growth',
      industryId: 'industry_higher_edu',
      code: 'HIGHER_TEACHER_GROWTH',
      name: '高校教师发展序列',
      description: '覆盖高校教师从课程承担到课程体系与团队引领的发展等级。',
      status: 'ACTIVE',
      sortNo: 1,
      levels: [
        { id: 'sequence_higher_teacher_growth_l1', code: 'YOUNG', name: '青年教师', description: '承担课程教学与基础班级指导，重点夯实课堂组织和学业反馈能力。', sortNo: 1 },
        { id: 'sequence_higher_teacher_growth_l2', code: 'BACKBONE', name: '骨干教师', description: '能够持续迭代课程、开展教学研究并支撑学生发展。', sortNo: 2 },
        { id: 'sequence_higher_teacher_growth_l3', code: 'ACADEMIC', name: '学科负责人', description: '统筹课程体系建设、团队带教与学术育人协同。', sortNo: 3 },
      ],
    }, 3),
  ];
}

function createEducationRoles() {
  return [
    normalizeRole({
      id: 'role_teacher',
      industryId: 'industry_edu',
      sequenceId: 'sequence_teacher_growth',
      code: 'BASIC_TEACHER',
      name: '基础教育教师',
      description: '适用于中小学及基础教育阶段授课岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 0),
    normalizeRole({
      id: 'role_teaching_research',
      industryId: 'industry_edu',
      sequenceId: 'sequence_teaching_research',
      code: 'BASIC_TEACHING_RESEARCH',
      name: '基础教育教研员',
      description: '适用于基础教育教研统筹与课程研究岗位。',
      status: 'ACTIVE',
      sortNo: 2,
    }, 1),
    normalizeRole({
      id: 'role_vocational_teacher',
      industryId: 'industry_vocational_edu',
      sequenceId: 'sequence_vocational_teacher_growth',
      code: 'VOCATIONAL_TEACHER',
      name: '职教教师',
      description: '适用于职业院校理论课、实训课及项目化教学岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 2),
    normalizeRole({
      id: 'role_higher_teacher',
      industryId: 'industry_higher_edu',
      sequenceId: 'sequence_higher_teacher_growth',
      code: 'HIGHER_TEACHER',
      name: '高校教师',
      description: '适用于高校课程教学、课程建设和学生发展支持岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 3),
  ];
}

function createEducationModels(levelScheme) {
  return [
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l1', '基础教育新教师能力模型', 'BASIC_EDU_TEACHER_NEW', '适用于基础教育新教师阶段，强调教学设计基本功、课堂执行和形成性反馈。', ['基础教育', '教师', '新教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l2', '基础教育青年教师能力模型', 'BASIC_EDU_TEACHER_YOUNG', '适用于基础教育青年教师阶段，强调课堂优化、学情分析和教研协同。', ['基础教育', '教师', '青年教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l3', '基础教育骨干教师能力模型', 'BASIC_EDU_TEACHER_BACKBONE', '适用于基础教育骨干教师阶段，强调示范引领、数据驱动改进和团队共建。', ['基础教育', '教师', '骨干教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l4', '基础教育学科带头人能力模型', 'BASIC_EDU_TEACHER_LEAD', '适用于基础教育学科带头人阶段，强调学科建设、跨校教研和体系化引领。', ['基础教育', '教师', '学科带头人'])),
    normalizeModel(makeVocationalTeacherModel(levelScheme, 'sequence_vocational_teacher_growth_l1', '职业教育初任讲师能力模型', 'VOCATIONAL_EDU_TEACHER_LECTURER', '适用于职业教育初任讲师阶段，强调岗位任务转化、理实一体教学和基础实训组织。', ['职业教育', '职教教师', '初任讲师'])),
    normalizeModel(makeVocationalTeacherModel(levelScheme, 'sequence_vocational_teacher_growth_l2', '职业教育双师型骨干讲师能力模型', 'VOCATIONAL_EDU_TEACHER_DUAL', '适用于职业教育双师型骨干讲师阶段，强调企业项目融入、技能评价和校企协同。', ['职业教育', '职教教师', '双师型'])),
    normalizeModel(makeVocationalTeacherModel(levelScheme, 'sequence_vocational_teacher_growth_l3', '职业教育专业带头人能力模型', 'VOCATIONAL_EDU_TEACHER_LEAD', '适用于职业教育专业带头人阶段，强调专业建设、团队带教和校企共建机制。', ['职业教育', '职教教师', '专业带头人'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_higher_teacher_growth_l1', '高等教育青年教师能力模型', 'HIGHER_EDU_TEACHER_YOUNG', '适用于高校青年教师阶段，强调课程建设、课堂组织和学业反馈。', ['高等教育', '高校教师', '青年教师'], { industryId: 'industry_higher_edu', roleId: 'role_higher_teacher', idPrefix: 'cap_model_higher_teacher' })),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_higher_teacher_growth_l2', '高等教育骨干教师能力模型', 'HIGHER_EDU_TEACHER_BACKBONE', '适用于高校骨干教师阶段，强调教学研究、课程迭代和学生发展支持。', ['高等教育', '高校教师', '骨干教师'], { industryId: 'industry_higher_edu', roleId: 'role_higher_teacher', idPrefix: 'cap_model_higher_teacher' })),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_higher_teacher_growth_l3', '高等教育学科负责人能力模型', 'HIGHER_EDU_TEACHER_ACADEMIC', '适用于高校学科负责人阶段，强调课程体系规划、团队带教和学术育人协同。', ['高等教育', '高校教师', '学科负责人'], { industryId: 'industry_higher_edu', roleId: 'role_higher_teacher', idPrefix: 'cap_model_higher_teacher' })),
  ];
}

function makeSalesModel(levelScheme, roleLevelId, name, modelCode, description, tags = []) {
  return createCapabilityModelDraft({
    id: createId('cap_model_sales'),
    modelCode,
    name,
    industryId: 'industry_sales',
    roleId: 'role_sales_advisor',
    roleLevelId,
    status: 'PUBLISHED',
    tags,
    description,
    levelScheme,
    dimensions: [
      {
        name: '客户洞察',
        description: '识别客户需求、决策链与业务场景。',
        items: [
          {
            name: '需求挖掘',
            description: '通过访谈与问题链准确识别客户显性与隐性需求。',
            levelDescriptors: [
              { text: '能完成基础信息采集。' },
              { text: '能识别核心需求并整理关键痛点。' },
              { text: '能洞察多角色需求差异并判断优先级。' },
              { text: '能构建行业级客户洞察方法并培训团队。' },
            ],
            evidenceExamples: ['客户访谈纪要', '需求分析卡片'],
          },
          {
            name: '决策链识别',
            description: '判断客户内部关键角色和推进路径。',
            levelDescriptors: [
              { text: '能识别直接对接人。' },
              { text: '能梳理关键影响人与审批路径。' },
              { text: '能基于决策链设计分角色沟通策略。' },
              { text: '能沉淀复杂项目推进打法。' },
            ],
            evidenceExamples: ['客户关系图谱'],
          },
        ],
      },
      {
        name: '方案沟通',
        description: '围绕客户场景进行价值表达与异议处理。',
        items: [
          {
            name: '价值表达',
            description: '能将产品能力转译为客户可感知的业务价值。',
            levelDescriptors: [
              { text: '能介绍标准产品卖点。' },
              { text: '能结合场景说明价值与收益。' },
              { text: '能用案例和数据支撑方案可信度。' },
              { text: '能形成高转化的行业方案话术。' },
            ],
            evidenceExamples: ['销售方案 PPT'],
          },
          {
            name: '异议处理',
            description: '针对预算、风险和替代方案进行有效回应。',
            levelDescriptors: [
              { text: '能回应常见异议。' },
              { text: '能分类处理价格和功能异议。' },
              { text: '能在复杂博弈中稳定推进成交。' },
              { text: '能总结高难异议处理案例库。' },
            ],
            evidenceExamples: ['关键客户复盘'],
          },
        ],
      },
      {
        name: '成交推进',
        description: '确保商机按节奏推进并顺利签约。',
        items: [
          {
            name: '商机管理',
            description: '能跟进关键节点并维护推进节奏。',
            levelDescriptors: [
              { text: '能维护基本商机状态。' },
              { text: '能制定推进计划并跟踪执行。' },
              { text: '能预判风险并调整推进策略。' },
              { text: '能建立团队商机管理机制。' },
            ],
          },
          {
            name: '商务协同',
            description: '联动交付、产品和管理层促成关键签约。',
            levelDescriptors: [
              { text: '能独立完成基础商务流程。' },
              { text: '能协调内部资源支撑签约。' },
              { text: '能主导复杂项目的跨团队协同。' },
              { text: '能形成重大项目推进范式。' },
            ],
          },
        ],
      },
      {
        name: '客户经营',
        description: '持续拓展客户价值与长期合作关系。',
        items: [
          {
            name: '续约经营',
            description: '能通过服务与价值复盘促进续约与增购。',
            levelDescriptors: [
              { text: '能完成基础续约提醒。' },
              { text: '能识别续约风险并制定跟进方案。' },
              { text: '能结合成果证明推动增购续费。' },
              { text: '能建立客户经营体系并复制到团队。' },
            ],
          },
        ],
      },
    ],
  });
}

function makeServiceModel(levelScheme, roleLevelId, name, modelCode, description, tags = []) {
  return createCapabilityModelDraft({
    id: createId('cap_model_service'),
    modelCode,
    name,
    industryId: 'industry_service',
    roleId: 'role_customer_service',
    roleLevelId,
    status: 'PUBLISHED',
    tags,
    description,
    levelScheme,
    dimensions: [
      {
        name: '问题识别',
        description: '快速识别用户问题和场景风险。',
        items: [
          {
            name: '问题归类',
            description: '能对用户诉求进行准确分类与优先级判断。',
            levelDescriptors: [
              { text: '能识别常见问题类型。' },
              { text: '能结合规则完成优先级判断。' },
              { text: '能识别复杂场景下的潜在风险。' },
              { text: '能输出高质量问题分类标准。' },
            ],
          },
          {
            name: '情绪识别',
            description: '能识别客户情绪状态并及时调整沟通方式。',
            levelDescriptors: [
              { text: '能识别明显负向情绪。' },
              { text: '能根据情绪状态调整回复策略。' },
              { text: '能稳定处理高压、高投诉场景。' },
              { text: '能总结高风险客诉应对策略。' },
            ],
          },
        ],
      },
      {
        name: '服务沟通',
        description: '提升响应质量与客户体验。',
        items: [
          {
            name: '专业表达',
            description: '能准确、清晰、得体地完成服务沟通。',
            levelDescriptors: [
              { text: '能按标准话术完成基础沟通。' },
              { text: '能结合场景调整表达方式。' },
              { text: '能在复杂问题中保持清晰解释与安抚。' },
              { text: '能形成高满意度沟通模板。' },
            ],
          },
          {
            name: '预期管理',
            description: '能明确时效、边界和处理进度，减少重复咨询。',
            levelDescriptors: [
              { text: '能说明基础处理时效。' },
              { text: '能主动同步关键处理节点。' },
              { text: '能在不确定场景下做好预期控制。' },
              { text: '能建立标准预期管理机制。' },
            ],
          },
        ],
      },
      {
        name: '流程执行',
        description: '按规范完成受理、转单、升级和闭环。',
        items: [
          {
            name: '工单执行',
            description: '能按照标准流程完成受理和推进。',
            levelDescriptors: [
              { text: '能完成标准工单流转。' },
              { text: '能处理跨系统、多角色协同工单。' },
              { text: '能发现流程堵点并推动优化。' },
              { text: '能建设团队工单执行标准。' },
            ],
          },
        ],
      },
      {
        name: '反馈闭环',
        description: '推动问题复盘、经验沉淀与服务改进。',
        items: [
          {
            name: '复盘改进',
            description: '能从服务数据和案例中发现改进机会。',
            levelDescriptors: [
              { text: '能记录典型案例。' },
              { text: '能提炼常见问题和改进建议。' },
              { text: '能基于数据推动流程和知识库优化。' },
              { text: '能主导服务质量改进专项。' },
            ],
          },
        ],
      },
    ],
  });
}

function seedPayload() {
  const levelScheme = createDefaultLevelScheme(4);
  const industries = [
    ...createEducationIndustries(),
    normalizeIndustry({ id: 'industry_sales', code: 'SALES', name: '销售行业', description: '面向顾问式销售与客户经营岗位。', status: 'ACTIVE', sortNo: 4 }, 3),
    normalizeIndustry({ id: 'industry_service', code: 'SERVICE', name: '客户服务行业', description: '聚焦客户服务、热线和服务运营岗位。', status: 'ACTIVE', sortNo: 5 }, 4),
  ];

  const sequences = [
    ...createEducationSequences(),
    normalizeSequence({
      id: 'sequence_sales_growth',
      industryId: 'industry_sales',
      code: 'SALES_GROWTH',
      name: '销售顾问发展序列',
      description: '覆盖销售顾问从基础商机跟进到复杂项目经营的成长等级。',
      status: 'ACTIVE',
      sortNo: 1,
      levels: [
        { id: 'sequence_sales_growth_l1', code: 'JUNIOR', name: '初级销售顾问', description: '以线索跟进、需求收集和基础商机推进为主。', sortNo: 1 },
        { id: 'sequence_sales_growth_l2', code: 'MIDDLE', name: '中级销售顾问', description: '独立负责标准项目推进和基础客户经营。', sortNo: 2 },
        { id: 'sequence_sales_growth_l3', code: 'SENIOR', name: '高级销售顾问', description: '负责复杂项目成交、重大客户经营和团队带教。', sortNo: 3 },
      ],
    }, 4),
    normalizeSequence({
      id: 'sequence_service_growth',
      industryId: 'industry_service',
      code: 'SERVICE_GROWTH',
      name: '客服发展序列',
      description: '覆盖客服从标准咨询受理到服务机制优化的成长等级。',
      status: 'ACTIVE',
      sortNo: 1,
      levels: [
        { id: 'sequence_service_growth_l1', code: 'PRIMARY', name: '初级客服', description: '负责标准咨询受理和基础工单流转。', sortNo: 1 },
        { id: 'sequence_service_growth_l2', code: 'ADVANCED', name: '高级客服', description: '承担复杂问题受理、投诉安抚和跨团队协同。', sortNo: 2 },
        { id: 'sequence_service_growth_l3', code: 'EXPERT', name: '客服专家', description: '负责高风险客诉、服务机制优化和经验沉淀。', sortNo: 3 },
      ],
    }, 5),
  ];

  const roles = [
    ...createEducationRoles(),
    normalizeRole({
      id: 'role_sales_advisor',
      industryId: 'industry_sales',
      sequenceId: 'sequence_sales_growth',
      code: 'SALES_ADVISOR',
      name: '销售顾问',
      description: '适用于商机拓展和顾问式销售岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 4),
    normalizeRole({
      id: 'role_customer_service',
      industryId: 'industry_service',
      sequenceId: 'sequence_service_growth',
      code: 'CUSTOMER_SERVICE',
      name: '客服专员',
      description: '适用于在线客服、热线和服务支持岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 5),
  ];

  const models = [
    ...createEducationModels(levelScheme),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l1', '初级销售顾问能力模型', 'SALES_ADVISOR_JUNIOR', '面向初级销售顾问，强调需求挖掘、基础方案表达和标准商机推进。', ['销售', '初级'])),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l2', '中级销售顾问能力模型', 'SALES_ADVISOR_MIDDLE', '面向中级销售顾问，强调多角色沟通、异议处理和客户经营。', ['销售', '中级'])),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l3', '高级销售顾问能力模型', 'SALES_ADVISOR_SENIOR', '面向高级销售顾问，强调复杂项目推进、商务协同和大客户经营。', ['销售', '高级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l1', '初级客服能力模型', 'SERVICE_AGENT_PRIMARY', '适用于初级客服阶段，强调标准咨询受理、专业表达和基础工单执行。', ['客服', '初级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l2', '高级客服能力模型', 'SERVICE_AGENT_ADVANCED', '适用于高级客服阶段，强调复杂客诉处理、预期管理和流程协同。', ['客服', '高级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l3', '客服专家能力模型', 'SERVICE_AGENT_EXPERT', '适用于客服专家阶段，强调服务机制优化、经验沉淀和质量改进。', ['客服', '专家'])),
  ];

  const { evidenceTypes, reviewSubjects } = createDefaultRuleCatalogsForSequences(sequences);

  return { industries, sequences, roles, models, evidenceTypes, reviewSubjects };
}

function mergeIndustryTemplate(list, template, index) {
  const existingIndex = list.findIndex((item) => item.id === template.id);
  if (existingIndex >= 0) {
    list[existingIndex] = normalizeIndustry({ ...list[existingIndex], ...template }, index);
    return;
  }
  list.push(normalizeIndustry(template, index));
}

function mergeSequenceTemplate(list, template, index) {
  const existingIndex = list.findIndex((item) => item.id === template.id);
  if (existingIndex >= 0) {
    list[existingIndex] = normalizeSequence({
      ...list[existingIndex],
      ...template,
      levels: list[existingIndex].levels?.length ? list[existingIndex].levels : template.levels,
    }, index);
    return;
  }
  list.push(normalizeSequence(template, index));
}

function mergeRoleTemplate(list, template, index) {
  const existingIndex = list.findIndex((item) => item.id === template.id);
  if (existingIndex >= 0) {
    list[existingIndex] = normalizeRole({ ...list[existingIndex], ...template }, index);
    return;
  }
  list.push(normalizeRole(template, index));
}

function appendModelIfMissing(list, template) {
  if (list.some((item) => item.modelCode === template.modelCode)) return;
  list.push(normalizeModel(template));
}

function shouldUpgradePublishedTemplate(existing, template) {
  if (existing?.status !== 'PUBLISHED') return false;
  if (existing?.roleId !== template?.roleId) return false;
  const existingDimensionIds = new Set((existing?.dimensions || []).map((item) => item.id || item.name));
  const templateDimensionIds = new Set((template?.dimensions || []).map((item) => item.id || item.name));
  const existingLooksGenericTeacher = existingDimensionIds.has('dim_teacher_design') || existingDimensionIds.has('教学设计');
  const templateLooksVocational = templateDimensionIds.has('dim_vocational_task_transfer') || templateDimensionIds.has('岗位任务转化');
  return existingLooksGenericTeacher && templateLooksVocational;
}

function mergeModelTemplate(list, template) {
  const targetIndex = list.findIndex((item) => item.modelCode === template.modelCode);
  if (targetIndex === -1) {
    list.push(normalizeModel(template));
    return;
  }
  const existing = list[targetIndex];
  if (!shouldUpgradePublishedTemplate(existing, template)) return;
  list[targetIndex] = normalizeModel({
    ...template,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: nowText(),
  });
}

function upgradeLegacyEducationModels(list) {
  const legacyMap = {
    EDU_TEACHER_NEW: {
      modelCode: 'BASIC_EDU_TEACHER_NEW',
      name: '基础教育新教师能力模型',
      description: '适用于基础教育新教师阶段，强调教学设计基本功、课堂执行和形成性反馈。',
      tags: ['基础教育', '教师', '新教师'],
    },
    EDU_TEACHER_YOUNG: {
      modelCode: 'BASIC_EDU_TEACHER_YOUNG',
      name: '基础教育青年教师能力模型',
      description: '适用于基础教育青年教师阶段，强调课堂优化、学情分析和教研协同。',
      tags: ['基础教育', '教师', '青年教师'],
    },
    EDU_TEACHER_BACKBONE: {
      modelCode: 'BASIC_EDU_TEACHER_BACKBONE',
      name: '基础教育骨干教师能力模型',
      description: '适用于基础教育骨干教师阶段，强调示范引领、数据驱动改进和团队共建。',
      tags: ['基础教育', '教师', '骨干教师'],
    },
    EDU_TEACHER_LEAD: {
      modelCode: 'BASIC_EDU_TEACHER_LEAD',
      name: '基础教育学科带头人能力模型',
      description: '适用于基础教育学科带头人阶段，强调学科建设、跨校教研和体系化引领。',
      tags: ['基础教育', '教师', '学科带头人'],
    },
  };

  return list.map((item) => {
    const upgrade = legacyMap[item.modelCode];
    if (!upgrade) return item;
    return normalizeModel({
      ...item,
      ...upgrade,
      industryId: item.industryId || 'industry_edu',
      roleId: item.roleId || 'role_teacher',
    });
  });
}

function migrateToEducationSegments(data) {
  const next = clone(data);
  const hasLegacyEducation = next.industries.some((item) => item.id === 'industry_edu');
  const hasSegmentedEducation = next.industries.some((item) => item.id === 'industry_vocational_edu' || item.id === 'industry_higher_edu');
  const hasLegacyEducationModels = next.models.some((item) => String(item.modelCode || '').startsWith('EDU_TEACHER_'));
  if (!hasLegacyEducation && !hasSegmentedEducation && !hasLegacyEducationModels) {
    return null;
  }

  const educationIndustries = createEducationIndustries();
  const educationSequences = createEducationSequences();
  const educationRoles = createEducationRoles();
  const educationModels = createEducationModels(createDefaultLevelScheme(4));

  educationIndustries.forEach((item, index) => mergeIndustryTemplate(next.industries, item, index));
  educationSequences.forEach((item, index) => mergeSequenceTemplate(next.sequences, item, index));
  educationRoles.forEach((item, index) => mergeRoleTemplate(next.roles, item, index));

  next.models = upgradeLegacyEducationModels(next.models).map((item) => {
    if (item.industryId === 'industry_edu' && item.roleId === 'role_teacher' && item.tags?.includes('教师') && !item.tags.includes('基础教育')) {
      return normalizeModel({ ...item, tags: ['基础教育', ...item.tags] });
    }
    return item;
  });
  educationModels.forEach((item) => {
    mergeModelTemplate(next.models, item);
    appendModelIfMissing(next.models, item);
  });

  return next;
}

function clearLegacySeedKeys() {
  LEGACY_SEED_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export async function seedCapabilityModelData() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  const current = readAll();
  const hasExistingData = current.industries.length || current.sequences.length || current.roles.length || current.models.length;
  if (hasExistingData) {
    const migrated = migrateToEducationSegments(current) || current;
    const withRules = ensureDefaultRulesForSequences(migrated);
    if (migrated !== current || withRules.changed) {
      writeAll(withRules.data);
    }
    window.localStorage.setItem(SEED_KEY, '1');
    clearLegacySeedKeys();
    return;
  }
  const payload = seedPayload();
  writeAll(payload);
  window.localStorage.setItem(SEED_KEY, '1');
  clearLegacySeedKeys();
}

export async function listIndustries() {
  return readList(INDUSTRY_STORAGE_KEY)
    .sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0));
}

export async function listSequences() {
  return readList(SEQUENCE_STORAGE_KEY)
    .sort((left, right) => {
      if ((left.industryId || '') !== (right.industryId || '')) {
        return String(left.industryId || '').localeCompare(String(right.industryId || ''));
      }
      return (left.sortNo || 0) - (right.sortNo || 0);
    });
}

export async function listRoles() {
  return readList(ROLE_STORAGE_KEY)
    .sort((left, right) => {
      if ((left.industryId || '') !== (right.industryId || '')) {
        return String(left.industryId || '').localeCompare(String(right.industryId || ''));
      }
      return (left.sortNo || 0) - (right.sortNo || 0);
    });
}

export async function listEvidenceTypes() {
  return sortSequenceRuleEntries(readList(EVIDENCE_TYPE_STORAGE_KEY).map((item, index) => normalizeEvidenceType(item, index)));
}

export async function listReviewSubjects() {
  return sortSequenceRuleEntries(readList(REVIEW_SUBJECT_STORAGE_KEY).map((item, index) => normalizeReviewSubject(item, index)));
}

export async function listCapabilityModels() {
  return readAll().models
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export async function getCapabilityModel(id) {
  return clone(readAll().models.find((item) => item.id === id) || null);
}

export async function saveIndustry(industry) {
  const { industries, sequences, roles, models } = readAll();
  const normalized = normalizeIndustry(industry, industries.length);
  ensureRequired(normalized.name, '行业名称');
  ensureRequired(normalized.code, '行业编码');
  ensureUniqueCode(industries, normalized.code, normalized.id, '行业编码');
  const nextIndustries = industries.some((item) => item.id === normalized.id)
    ? industries.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...industries, normalized];
  writeAll({
    industries: nextIndustries,
    sequences,
    roles,
    models,
  });
  return clone(normalized);
}

export async function removeIndustry(id) {
  const { industries, sequences, roles, models } = readAll();
  if (sequences.some((item) => item.industryId === id)) {
    throw new Error('该行业下仍有关联能力序列，无法删除');
  }
  if (roles.some((item) => item.industryId === id)) {
    throw new Error('该行业下仍有关联岗位，无法删除');
  }
  if (models.some((item) => item.industryId === id)) {
    throw new Error('该行业下仍有关联模型，无法删除');
  }
  writeAll({
    industries: industries.filter((item) => item.id !== id),
    sequences,
    roles,
    models,
  });
}

export async function saveSequence(sequence) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  const normalized = normalizeSequence(sequence, sequences.length);
  ensureRequired(normalized.name, '序列名称');
  ensureRequired(normalized.code, '序列编码');
  ensureRequired(normalized.industryId, '所属行业');
  if (!industries.some((item) => item.id === normalized.industryId)) {
    throw new Error('所属行业不存在');
  }
  if (!Array.isArray(normalized.levels) || normalized.levels.length === 0) {
    throw new Error('请至少配置一个序列等级');
  }
  const levelCodeSet = new Set();
  normalized.levels.forEach((level) => {
    ensureRequired(level.name, '序列等级名称');
    ensureRequired(level.code, '序列等级编码');
    if (levelCodeSet.has(level.code)) {
      throw new Error('同一序列下的等级编码不能重复');
    }
    levelCodeSet.add(level.code);
  });
  ensureUniqueCode(sequences, normalized.code, normalized.id, '序列编码');

  const existing = sequences.find((item) => item.id === normalized.id);
  if (existing) {
    const nextLevelIds = new Set(normalized.levels.map((item) => item.id));
    const removedLevelIds = (existing.levels || [])
      .map((item) => item.id)
      .filter((levelId) => !nextLevelIds.has(levelId));
    if (removedLevelIds.length) {
      const orphanModel = models.find((item) => removedLevelIds.includes(item.roleLevelId));
      if (orphanModel) {
        throw new Error('存在模型仍绑定已删除的序列等级，请先调整模型后再保存');
      }
    }
  }

  const sequenceExists = sequences.some((item) => item.id === normalized.id);
  const nextSequences = sequenceExists
    ? sequences.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...sequences, normalized];
  const nextEvidenceTypes = sequenceExists
    ? evidenceTypes
    : [...evidenceTypes, ...createDefaultEvidenceTypesForSequence(normalized.id)];
  const nextReviewSubjects = sequenceExists
    ? reviewSubjects
    : [...reviewSubjects, ...createDefaultReviewSubjectsForSequence(normalized.id)];
  writeAll({
    industries,
    sequences: nextSequences,
    roles,
    models,
    evidenceTypes: nextEvidenceTypes,
    reviewSubjects: nextReviewSubjects,
  });
  return clone(normalized);
}

export async function removeSequence(id) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  if (roles.some((item) => item.sequenceId === id)) {
    throw new Error('该能力序列已被岗位引用，无法删除');
  }
  const sequence = sequences.find((item) => item.id === id);
  const levelIds = new Set((sequence?.levels || []).map((item) => item.id));
  if (models.some((item) => levelIds.has(item.roleLevelId))) {
    throw new Error('该能力序列下仍有关联模型，无法删除');
  }
  writeAll({
    industries,
    sequences: sequences.filter((item) => item.id !== id),
    roles,
    models,
    evidenceTypes: evidenceTypes.filter((item) => item.sequenceId !== id),
    reviewSubjects: reviewSubjects.filter((item) => item.sequenceId !== id),
  });
}

export async function saveEvidenceType(evidenceType) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  const normalized = normalizeEvidenceType(evidenceType, evidenceTypes.length);
  ensureRequired(normalized.sequenceId, '所属序列');
  ensureRequired(normalized.name, '证据类型名称');
  ensureRequired(normalized.code, '证据类型编码');
  if (!sequences.some((item) => item.id === normalized.sequenceId)) {
    throw new Error('所属能力序列不存在');
  }
  ensureUniqueSequenceRuleCode(evidenceTypes, normalized, '证据类型');
  const nextEvidenceTypes = evidenceTypes.some((item) => item.id === normalized.id)
    ? evidenceTypes.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...evidenceTypes, normalized];
  writeAll({
    industries,
    sequences,
    roles,
    models,
    evidenceTypes: nextEvidenceTypes,
    reviewSubjects,
  });
  return clone(normalized);
}

export async function removeEvidenceType(id) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  const target = evidenceTypes.find((item) => item.id === id);
  if (!target) return;
  if (isSequenceRuleReferenced(target, models, roles, 'evidenceTypes')) {
    throw new Error('该证据类型已被能力模型引用，无法删除，可改为停用');
  }
  writeAll({
    industries,
    sequences,
    roles,
    models,
    evidenceTypes: evidenceTypes.filter((item) => item.id !== id),
    reviewSubjects,
  });
}

export async function saveReviewSubject(reviewSubject) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  const normalized = normalizeReviewSubject(reviewSubject, reviewSubjects.length);
  ensureRequired(normalized.sequenceId, '所属序列');
  ensureRequired(normalized.name, '评价主体名称');
  ensureRequired(normalized.code, '评价主体编码');
  if (!sequences.some((item) => item.id === normalized.sequenceId)) {
    throw new Error('所属能力序列不存在');
  }
  ensureUniqueSequenceRuleCode(reviewSubjects, normalized, '评价主体');
  const nextReviewSubjects = reviewSubjects.some((item) => item.id === normalized.id)
    ? reviewSubjects.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...reviewSubjects, normalized];
  writeAll({
    industries,
    sequences,
    roles,
    models,
    evidenceTypes,
    reviewSubjects: nextReviewSubjects,
  });
  return clone(normalized);
}

export async function removeReviewSubject(id) {
  const { industries, sequences, roles, models, evidenceTypes, reviewSubjects } = readAll();
  const target = reviewSubjects.find((item) => item.id === id);
  if (!target) return;
  if (isSequenceRuleReferenced(target, models, roles, 'requiredReviewRoles')) {
    throw new Error('该评价主体已被能力模型引用，无法删除，可改为停用');
  }
  writeAll({
    industries,
    sequences,
    roles,
    models,
    evidenceTypes,
    reviewSubjects: reviewSubjects.filter((item) => item.id !== id),
  });
}

export async function saveRole(role) {
  const { industries, sequences, roles, models } = readAll();
  const normalized = normalizeRole(role, roles.length);
  ensureRequired(normalized.name, '岗位名称');
  ensureRequired(normalized.code, '岗位编码');
  ensureRequired(normalized.industryId, '所属行业');
  ensureRequired(normalized.sequenceId, '主能力序列');
  if (!industries.some((item) => item.id === normalized.industryId)) {
    throw new Error('所属行业不存在');
  }
  const matchedSequence = sequences.find((item) => item.id === normalized.sequenceId);
  if (!matchedSequence) {
    throw new Error('主能力序列不存在');
  }
  if (matchedSequence.industryId !== normalized.industryId) {
    throw new Error('岗位与主能力序列必须属于同一行业');
  }
  ensureUniqueCode(roles, normalized.code, normalized.id, '岗位编码');

  if (normalized.id) {
    const nextLevelIds = new Set((matchedSequence.levels || []).map((item) => item.id));
    const orphanModel = models.find((item) => item.roleId === normalized.id && item.roleLevelId && !nextLevelIds.has(item.roleLevelId));
    if (orphanModel) {
      throw new Error('存在模型仍绑定旧序列等级，请先调整模型后再保存');
    }
  }

  const nextRoles = roles.some((item) => item.id === normalized.id)
    ? roles.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...roles, normalized];
  writeAll({
    industries,
    sequences,
    roles: nextRoles,
    models,
  });
  return clone(normalized);
}

export async function removeRole(id) {
  const { industries, sequences, roles, models } = readAll();
  if (models.some((item) => item.roleId === id)) {
    throw new Error('该岗位下仍有关联模型，无法删除');
  }
  writeAll({
    industries,
    sequences,
    roles: roles.filter((item) => item.id !== id),
    models,
  });
}

export async function saveCapabilityModel(model) {
  const { industries, sequences, roles, models } = readAll();
  const normalized = normalizeModel(model);
  ensureModelValid(normalized);

  if (!industries.some((item) => item.id === normalized.industryId)) {
    throw new Error('所属行业不存在');
  }

  const matchedRole = roles.find((item) => item.id === normalized.roleId);
  if (!matchedRole) {
    throw new Error('所属岗位不存在');
  }
  if (matchedRole.industryId !== normalized.industryId) {
    throw new Error('岗位与行业不匹配');
  }

  const matchedSequence = findSequenceByRole(matchedRole, sequences);
  if (!matchedSequence) {
    throw new Error('岗位未绑定主能力序列');
  }
  if (!matchedSequence.levels?.some((level) => level.id === normalized.roleLevelId)) {
    throw new Error('所属序列等级不存在');
  }

  const duplicated = models.find((item) => item.modelCode === normalized.modelCode && item.id !== normalized.id);
  if (duplicated) {
    throw new Error('模型编码已存在');
  }

  const payload = {
    ...normalized,
    versionSeriesId: normalized.versionSeriesId || normalized.id,
    versionNumber: getModelVersionNumber(normalized),
    versionCodeRoot: trimText(normalized.versionCodeRoot) || trimText(normalized.modelCode),
    isCurrentVersion: normalized.status === 'PUBLISHED' ? Boolean(normalized.isCurrentVersion) : false,
    publishedAt: normalized.status === 'PUBLISHED'
      ? (normalized.publishedAt || nowText())
      : null,
    updatedAt: nowText(),
    createdAt: normalized.createdAt || nowText(),
  };
  const nextModels = models.some((item) => item.id === payload.id)
    ? models.map((item) => (item.id === payload.id ? payload : item))
    : [payload, ...models];
  writeAll({
    industries,
    sequences,
    roles,
    models: nextModels,
  });
  return clone(payload);
}

export async function duplicateCapabilityModel(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) {
    throw new Error('模型不存在');
  }
  const nextId = createId('cap_model');
  const nextCode = createDuplicateModelCode(models, source.modelCode);
  const duplicated = normalizeModel({
    ...clone(source),
    id: nextId,
    modelCode: nextCode,
    name: `${source.name}（副本）`,
    status: 'DRAFT',
    versionSeriesId: nextId,
    versionNumber: 1,
    versionCodeRoot: nextCode,
    isCurrentVersion: false,
    publishedAt: null,
    createdAt: nowText(),
    updatedAt: nowText(),
  });
  writeAll({
    industries,
    sequences,
    roles,
    models: [duplicated, ...models],
  });
  return clone(duplicated);
}

export async function createCapabilityModelVersion(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) {
    throw new Error('模型不存在');
  }
  const versionSeriesId = getModelVersionSeriesId(source) || source.id;
  const familyModels = models.filter((item) => getModelVersionSeriesId(item) === versionSeriesId);
  const nextVersionNumber = familyModels.reduce((max, item) => Math.max(max, getModelVersionNumber(item)), 0) + 1;
  const duplicated = normalizeModel({
    ...clone(source),
    id: createId('cap_model'),
    modelCode: createVersionModelCode(models, source, nextVersionNumber),
    status: 'DRAFT',
    versionSeriesId,
    versionNumber: nextVersionNumber,
    versionCodeRoot: trimText(source.versionCodeRoot) || trimText(source.modelCode),
    isCurrentVersion: false,
    publishedAt: null,
    createdAt: nowText(),
    updatedAt: nowText(),
  });
  writeAll({
    industries,
    sequences,
    roles,
    models: [duplicated, ...models],
  });
  return clone(duplicated);
}

export async function publishCapabilityModel(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) {
    throw new Error('模型不存在');
  }
  if (source.status !== 'DRAFT') {
    throw new Error('仅草稿模型可发布');
  }
  const now = nowText();
  const versionSeriesId = getModelVersionSeriesId(source);
  const nextModels = models.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'PUBLISHED',
        isCurrentVersion: true,
        publishedAt: now,
        updatedAt: now,
      };
    }
    if (versionSeriesId && getModelVersionSeriesId(item) === versionSeriesId && item.status === 'PUBLISHED' && item.isCurrentVersion) {
      return {
        ...item,
        isCurrentVersion: false,
        updatedAt: now,
      };
    }
    return item;
  });
  writeAll({
    industries,
    sequences,
    roles,
    models: nextModels,
  });
  return clone(nextModels.find((item) => item.id === id) || null);
}

export async function disableCapabilityModel(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) {
    throw new Error('模型不存在');
  }
  if (source.status !== 'PUBLISHED') {
    throw new Error('仅已发布模型可停用');
  }
  writeAll({
    industries,
    sequences,
    roles,
    models: models.map((item) => (
      item.id === id ? { ...item, status: 'DISABLED', isCurrentVersion: false, updatedAt: nowText() } : item
    )),
  });
}

export async function removeCapabilityModel(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) return;
  if (source.status === 'PUBLISHED' && source.isCurrentVersion) {
    throw new Error('当前生效版本不可直接删除，请先新建版本或停用');
  }
  writeAll({
    industries,
    sequences,
    roles,
    models: models.filter((item) => item.id !== id),
  });
}
