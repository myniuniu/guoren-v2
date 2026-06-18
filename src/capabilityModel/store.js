const INDUSTRY_STORAGE_KEY = 'gr.capability-model.industries.v3';
const SEQUENCE_STORAGE_KEY = 'gr.capability-model.sequences.v3';
const ROLE_STORAGE_KEY = 'gr.capability-model.roles.v3';
const MODEL_STORAGE_KEY = 'gr.capability-model.models.v3';
const SEED_KEY = 'gr.capability-model.seeded.v3';
const STORE_CHANGE_EVENT = 'gr:capability-model-change';

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

function writeAll({ industries, sequences, roles, models }) {
  writeList(INDUSTRY_STORAGE_KEY, industries);
  writeList(SEQUENCE_STORAGE_KEY, sequences);
  writeList(ROLE_STORAGE_KEY, roles);
  writeList(MODEL_STORAGE_KEY, models);
  emitChange();
}

function readAll() {
  return {
    industries: readList(INDUSTRY_STORAGE_KEY),
    sequences: readList(SEQUENCE_STORAGE_KEY),
    roles: readList(ROLE_STORAGE_KEY),
    models: readList(MODEL_STORAGE_KEY),
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
    name: overrides.name || '',
    description: overrides.description || '',
    sortNo: overrides.sortNo ?? 1,
    levelDescriptors: scheme.levels.map((level, index) => ({
      levelKey: level.key,
      text: overrides.levelDescriptors?.[index]?.text || '',
    })),
    evidenceExamples: Array.isArray(overrides.evidenceExamples) ? [...overrides.evidenceExamples] : [],
  };
}

export function createEmptyCapabilityDimension(levelScheme, overrides = {}) {
  const scheme = normalizeLevelScheme(levelScheme);
  const items = Array.isArray(overrides.items) && overrides.items.length
    ? overrides.items.map((item, index) => createEmptyCapabilityItem(scheme, { ...item, sortNo: index + 1 }))
    : [createEmptyCapabilityItem(scheme)];
  return {
    id: overrides.id || createId('cap_dim'),
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

  return {
    id: overrides.id,
    modelCode: overrides.modelCode || '',
    name: overrides.name || '',
    industryId: overrides.industryId || undefined,
    roleId: overrides.roleId || undefined,
    roleLevelId: overrides.roleLevelId || undefined,
    description: overrides.description || '',
    tags: Array.isArray(overrides.tags) ? [...overrides.tags] : [],
    status: overrides.status || 'DRAFT',
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
    name: trimText(item?.name),
    description: trimText(item?.description),
    sortNo: index + 1,
    levelDescriptors: descriptors,
    evidenceExamples: normalizeEvidenceExamples(item?.evidenceExamples),
  };
}

function normalizeDimension(dimension, levelScheme, index) {
  const items = (Array.isArray(dimension?.items) ? dimension.items : [])
    .map((item, itemIndex) => normalizeItem(item, levelScheme, itemIndex))
    .filter((item) => item.name);
  return {
    id: dimension?.id || createId('cap_dim'),
    name: trimText(dimension?.name),
    description: trimText(dimension?.description),
    sortNo: index + 1,
    items,
  };
}

function normalizeModel(model) {
  const levelScheme = normalizeLevelScheme(model?.levelScheme);
  const dimensions = (Array.isArray(model?.dimensions) ? model.dimensions : [])
    .map((dimension, index) => normalizeDimension(dimension, levelScheme, index))
    .filter((dimension) => dimension.name);

  return {
    id: model?.id || createId('cap_model'),
    modelCode: trimText(model?.modelCode),
    name: trimText(model?.name),
    industryId: model?.industryId || '',
    roleId: model?.roleId || '',
    roleLevelId: model?.roleLevelId || '',
    description: trimText(model?.description),
    tags: Array.isArray(model?.tags) ? model.tags.map((item) => trimText(item)).filter(Boolean) : [],
    status: model?.status || 'DRAFT',
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

function makeTeacherModel(levelScheme, roleLevelId, name, modelCode, description, tags = []) {
  return createCapabilityModelDraft({
    id: createId('cap_model_teacher'),
    modelCode,
    name,
    industryId: 'industry_edu',
    roleId: 'role_teacher',
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
    normalizeIndustry({ id: 'industry_edu', code: 'EDU', name: '教育行业', description: '覆盖教师、教研、培训讲师等典型角色。', status: 'ACTIVE', sortNo: 1 }, 0),
    normalizeIndustry({ id: 'industry_sales', code: 'SALES', name: '销售行业', description: '面向顾问式销售与客户经营岗位。', status: 'ACTIVE', sortNo: 2 }, 1),
    normalizeIndustry({ id: 'industry_service', code: 'SERVICE', name: '客户服务行业', description: '聚焦客户服务、热线和服务运营岗位。', status: 'ACTIVE', sortNo: 3 }, 2),
  ];

  const sequences = [
    normalizeSequence({
      id: 'sequence_teacher_growth',
      industryId: 'industry_edu',
      code: 'TEACHER_GROWTH',
      name: '教师发展序列',
      description: '覆盖教师从入职到学科引领阶段的发展等级。',
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
      code: 'TEACHING_RESEARCH',
      name: '教研发展序列',
      description: '面向教研统筹、课程研究与教师指导岗位的成长路径。',
      status: 'ACTIVE',
      sortNo: 2,
      levels: [
        { id: 'sequence_teaching_research_l1', code: 'SPECIALIST', name: '教研专员', description: '承担学科资源整理与基础教研组织工作。', sortNo: 1 },
        { id: 'sequence_teaching_research_l2', code: 'SENIOR', name: '高级教研员', description: '负责专题研究、教师指导和课程质量改进。', sortNo: 2 },
      ],
    }, 1),
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
    }, 2),
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
    }, 3),
  ];

  const roles = [
    normalizeRole({
      id: 'role_teacher',
      industryId: 'industry_edu',
      sequenceId: 'sequence_teacher_growth',
      code: 'TEACHER',
      name: '教师',
      description: '适用于中小学及通用培训授课岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 0),
    normalizeRole({
      id: 'role_teaching_research',
      industryId: 'industry_edu',
      sequenceId: 'sequence_teaching_research',
      code: 'TEACHING_RESEARCH',
      name: '教研员',
      description: '适用于教研统筹与课程研究岗位。',
      status: 'ACTIVE',
      sortNo: 2,
    }, 1),
    normalizeRole({
      id: 'role_sales_advisor',
      industryId: 'industry_sales',
      sequenceId: 'sequence_sales_growth',
      code: 'SALES_ADVISOR',
      name: '销售顾问',
      description: '适用于商机拓展和顾问式销售岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 2),
    normalizeRole({
      id: 'role_customer_service',
      industryId: 'industry_service',
      sequenceId: 'sequence_service_growth',
      code: 'CUSTOMER_SERVICE',
      name: '客服专员',
      description: '适用于在线客服、热线和服务支持岗位。',
      status: 'ACTIVE',
      sortNo: 1,
    }, 3),
  ];

  const models = [
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l1', '新教师能力模型', 'EDU_TEACHER_NEW', '适用于新教师阶段，强调教学设计基本功、课堂执行和形成性反馈。', ['教师', '新教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l2', '青年教师能力模型', 'EDU_TEACHER_YOUNG', '适用于青年教师阶段，强调课堂优化、学情分析和教研协同。', ['教师', '青年教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l3', '骨干教师能力模型', 'EDU_TEACHER_BACKBONE', '适用于骨干教师阶段，强调示范引领、数据驱动改进和团队共建。', ['教师', '骨干教师'])),
    normalizeModel(makeTeacherModel(levelScheme, 'sequence_teacher_growth_l4', '学科带头人能力模型', 'EDU_TEACHER_LEAD', '适用于学科带头人阶段，强调学科建设、跨校教研和体系化引领。', ['教师', '学科带头人'])),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l1', '初级销售顾问能力模型', 'SALES_ADVISOR_JUNIOR', '面向初级销售顾问，强调需求挖掘、基础方案表达和标准商机推进。', ['销售', '初级'])),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l2', '中级销售顾问能力模型', 'SALES_ADVISOR_MIDDLE', '面向中级销售顾问，强调多角色沟通、异议处理和客户经营。', ['销售', '中级'])),
    normalizeModel(makeSalesModel(levelScheme, 'sequence_sales_growth_l3', '高级销售顾问能力模型', 'SALES_ADVISOR_SENIOR', '面向高级销售顾问，强调复杂项目推进、商务协同和大客户经营。', ['销售', '高级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l1', '初级客服能力模型', 'SERVICE_AGENT_PRIMARY', '适用于初级客服阶段，强调标准咨询受理、专业表达和基础工单执行。', ['客服', '初级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l2', '高级客服能力模型', 'SERVICE_AGENT_ADVANCED', '适用于高级客服阶段，强调复杂客诉处理、预期管理和流程协同。', ['客服', '高级'])),
    normalizeModel(makeServiceModel(levelScheme, 'sequence_service_growth_l3', '客服专家能力模型', 'SERVICE_AGENT_EXPERT', '适用于客服专家阶段，强调服务机制优化、经验沉淀和质量改进。', ['客服', '专家'])),
  ];

  return { industries, sequences, roles, models };
}

export async function seedCapabilityModelData() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  const payload = seedPayload();
  writeAll(payload);
  window.localStorage.setItem(SEED_KEY, '1');
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

export async function listCapabilityModels() {
  return readList(MODEL_STORAGE_KEY)
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export async function getCapabilityModel(id) {
  return clone(readList(MODEL_STORAGE_KEY).find((item) => item.id === id) || null);
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
  const { industries, sequences, roles, models } = readAll();
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

  const nextSequences = sequences.some((item) => item.id === normalized.id)
    ? sequences.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
    : [...sequences, normalized];
  writeAll({
    industries,
    sequences: nextSequences,
    roles,
    models,
  });
  return clone(normalized);
}

export async function removeSequence(id) {
  const { industries, sequences, roles, models } = readAll();
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
  const duplicated = normalizeModel({
    ...clone(source),
    id: createId('cap_model'),
    modelCode: createDuplicateModelCode(models, source.modelCode),
    name: `${source.name}（副本）`,
    status: 'DRAFT',
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
  writeAll({
    industries,
    sequences,
    roles,
    models: models.map((item) => (
      item.id === id ? { ...item, status: 'PUBLISHED', updatedAt: nowText() } : item
    )),
  });
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
      item.id === id ? { ...item, status: 'DISABLED', updatedAt: nowText() } : item
    )),
  });
}

export async function removeCapabilityModel(id) {
  const { industries, sequences, roles, models } = readAll();
  const source = models.find((item) => item.id === id);
  if (!source) return;
  if (source.status === 'PUBLISHED') {
    throw new Error('已发布模型不可直接删除，请先停用');
  }
  writeAll({
    industries,
    sequences,
    roles,
    models: models.filter((item) => item.id !== id),
  });
}
