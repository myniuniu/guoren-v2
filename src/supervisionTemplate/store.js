const TEMPLATE_STORAGE_KEY = 'gr.supervision-template.templates.v1';
const SEED_KEY = 'gr.supervision-template.seeded.v1';
const STORE_CHANGE_EVENT = 'gr:supervision-template-change';

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

function normalizeStatus(value) {
  return value === 'DISABLED' ? 'DISABLED' : 'ACTIVE';
}

function normalizeResultOptions(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimText(item)).filter(Boolean);
  }
  return trimText(value)
    .split(/[、,，/｜|]/)
    .map((item) => trimText(item))
    .filter(Boolean);
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function readTemplates() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[supervision-template-store] failed to read templates', error);
    return [];
  }
}

function writeTemplates(templates) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  emitChange();
}

function sortDimensions(dimensions = []) {
  return [...dimensions].sort((left, right) => {
    const leftOrder = Number(left.sortOrder) || 0;
    const rightOrder = Number(right.sortOrder) || 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left.code || '').localeCompare(String(right.code || ''), 'zh-CN');
  });
}

function sortIndicators(indicators = []) {
  return [...indicators].sort((left, right) => {
    const leftOrder = Number(left.sortOrder) || 0;
    const rightOrder = Number(right.sortOrder) || 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left.code || '').localeCompare(String(right.code || ''), 'zh-CN');
  });
}

function normalizeDimension(dimension = {}) {
  return {
    id: dimension.id || createId('dimension'),
    code: trimText(dimension.code),
    name: trimText(dimension.name),
    level: trimText(dimension.level) || '一级维度',
    parentId: trimText(dimension.parentId),
    sortOrder: Number(dimension.sortOrder) || 0,
    status: normalizeStatus(dimension.status),
    createdAt: dimension.createdAt || nowText(),
    updatedAt: dimension.updatedAt || nowText(),
  };
}

function normalizeIndicator(indicator = {}) {
  return {
    id: indicator.id || createId('indicator'),
    code: trimText(indicator.code),
    name: trimText(indicator.name),
    dimensionId: trimText(indicator.dimensionId),
    resultOptions: normalizeResultOptions(indicator.resultOptions),
    indicatorType: trimText(indicator.indicatorType) || '观察项',
    scoringMethod: trimText(indicator.scoringMethod) || '人工评分',
    required: Boolean(indicator.required),
    sortOrder: Number(indicator.sortOrder) || 0,
    status: normalizeStatus(indicator.status),
    createdAt: indicator.createdAt || nowText(),
    updatedAt: indicator.updatedAt || nowText(),
  };
}

function normalizeTemplate(template = {}) {
  return {
    id: template.id || createId('supervision_template'),
    name: trimText(template.name),
    templateType: trimText(template.templateType) || '听课督导',
    description: trimText(template.description),
    evaluationMode: trimText(template.evaluationMode) || '检查性',
    purpose: trimText(template.purpose) || '日常督导',
    permissionLevel: trimText(template.permissionLevel) || '校级',
    applicableObject: trimText(template.applicableObject) || '教师课堂教学',
    schoolType: trimText(template.schoolType) || '职业院校',
    status: normalizeStatus(template.status),
    dimensions: sortDimensions((template.dimensions || []).map((item) => normalizeDimension(item))),
    indicators: sortIndicators((template.indicators || []).map((item) => normalizeIndicator(item))),
    createdAt: template.createdAt || nowText(),
    updatedAt: template.updatedAt || nowText(),
  };
}

function createSeedTemplates() {
  return [
    normalizeTemplate({
      id: 'supervision_template_classroom_vocational',
      name: '[APL_TEST]课堂教学督导评价模板（职本）',
      templateType: '听课督导',
      description: '面向职业本科课堂教学过程质量督导，覆盖目标设计、课堂组织、教学互动、实训安全、数字资源使用与改进建议。',
      evaluationMode: '检查性',
      purpose: '日常督导',
      permissionLevel: '校级',
      applicableObject: '教师课堂教学',
      schoolType: '职业本科院校',
      status: 'ACTIVE',
      createdAt: '2026-08-01 09:00:00',
      updatedAt: '2026-08-01 09:00:00',
      dimensions: [
        { id: 'dim_c', code: 'C', name: '课堂质量评价', level: '一级维度', parentId: '', sortOrder: 10, status: 'ACTIVE' },
        { id: 'dim_c_goal', code: 'C-1', name: '目标与任务设计', level: '二级维度', parentId: 'dim_c', sortOrder: 11, status: 'ACTIVE' },
        { id: 'dim_c_process', code: 'C-2', name: '教学过程组织', level: '二级维度', parentId: 'dim_c', sortOrder: 12, status: 'ACTIVE' },
        { id: 'dim_c_result', code: 'C-3', name: '学习评价与反馈', level: '二级维度', parentId: 'dim_c', sortOrder: 13, status: 'ACTIVE' },
        { id: 'dim_b', code: 'B', name: '教师发展评价', level: '一级维度', parentId: '', sortOrder: 20, status: 'ACTIVE' },
        { id: 'dim_b_growth', code: 'B-1', name: '教研反思与改进', level: '二级维度', parentId: 'dim_b', sortOrder: 21, status: 'ACTIVE' },
      ],
      indicators: [
        {
          id: 'indicator_c4',
          code: 'C-4',
          name: '教学目标清晰具体',
          dimensionId: 'dim_c_goal',
          resultOptions: ['优秀', '良好', '合格', '需改进'],
          indicatorType: '定性',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 4,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_c5',
          code: 'C-5',
          name: '设施设备利用率',
          dimensionId: 'dim_c_process',
          resultOptions: ['高', '中', '低'],
          indicatorType: '定量',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 5,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_c6',
          code: 'C-6',
          name: '课堂工作与数据交互',
          dimensionId: 'dim_c_process',
          resultOptions: ['优秀', '良好', '合格', '需改进'],
          indicatorType: '观察项',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 6,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_c7',
          code: 'C-7',
          name: '课堂评价',
          dimensionId: 'dim_c_result',
          resultOptions: ['达成', '部分达成', '未达成'],
          indicatorType: '观察项',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 7,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_b1',
          code: 'B-1',
          name: '学校组织参与合理',
          dimensionId: 'dim_b_growth',
          resultOptions: ['优秀', '良好', '合格', '需改进'],
          indicatorType: '定性',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 21,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_b2',
          code: 'B-2',
          name: '目标个性适配',
          dimensionId: 'dim_b_growth',
          resultOptions: ['优秀', '良好', '合格', '需改进'],
          indicatorType: '定性',
          scoringMethod: '人工评分',
          required: false,
          sortOrder: 22,
          status: 'ACTIVE',
        },
      ],
    }),
    normalizeTemplate({
      id: 'supervision_template_training_safety',
      name: '实训课堂安全与规范督导模板',
      templateType: '巡课督导',
      description: '聚焦实训课堂安全规范、设备使用、学生操作过程和异常处置，适合实训室巡课与专项检查。',
      evaluationMode: '诊断性',
      purpose: '专项检查',
      permissionLevel: '院系级',
      applicableObject: '实训课堂',
      schoolType: '中高职院校',
      status: 'ACTIVE',
      createdAt: '2026-08-03 11:00:00',
      updatedAt: '2026-08-03 11:00:00',
      dimensions: [
        { id: 'dim_safe_a', code: 'A', name: '实训准备', level: '一级维度', parentId: '', sortOrder: 10, status: 'ACTIVE' },
        { id: 'dim_safe_b', code: 'B', name: '过程安全', level: '一级维度', parentId: '', sortOrder: 20, status: 'ACTIVE' },
        { id: 'dim_safe_c', code: 'C', name: '复盘改进', level: '一级维度', parentId: '', sortOrder: 30, status: 'ACTIVE' },
      ],
      indicators: [
        {
          id: 'indicator_safe_a1',
          code: 'A-1',
          name: '安全提示与防护用品到位',
          dimensionId: 'dim_safe_a',
          resultOptions: ['达标', '基本达标', '不达标'],
          indicatorType: '检查项',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 1,
          status: 'ACTIVE',
        },
        {
          id: 'indicator_safe_b1',
          code: 'B-1',
          name: '学生操作过程符合规范',
          dimensionId: 'dim_safe_b',
          resultOptions: ['优秀', '良好', '合格', '需改进'],
          indicatorType: '观察项',
          scoringMethod: '人工评分',
          required: true,
          sortOrder: 2,
          status: 'ACTIVE',
        },
      ],
    }),
  ];
}

function ensureTemplateExists(templates, templateId) {
  const template = templates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error('督导模板不存在');
  }
  return template;
}

function ensureDimensionCodeUnique(template, dimension) {
  const duplicated = template.dimensions.some((item) => item.id !== dimension.id && item.code === dimension.code);
  if (duplicated) {
    throw new Error(`维度编码「${dimension.code}」已存在`);
  }
}

function ensureIndicatorCodeUnique(template, indicator) {
  const duplicated = template.indicators.some((item) => item.id !== indicator.id && item.code === indicator.code);
  if (duplicated) {
    throw new Error(`指标编码「${indicator.code}」已存在`);
  }
}

function validateDimension(template, dimension) {
  if (!dimension.code) throw new Error('请输入维度编码');
  if (!dimension.name) throw new Error('请输入维度名称');
  ensureDimensionCodeUnique(template, dimension);
  const dimensionMap = new Map(template.dimensions.map((item) => [item.id, item]));
  let parentId = dimension.parentId;
  while (parentId && dimensionMap.has(parentId)) {
    if (parentId === dimension.id) {
      throw new Error('父级维度不能选择自身或自己的下级维度');
    }
    parentId = dimensionMap.get(parentId)?.parentId;
  }
  if (dimension.parentId && !template.dimensions.some((item) => item.id === dimension.parentId)) {
    throw new Error('父级维度不存在');
  }
}

function validateIndicator(template, indicator) {
  if (!indicator.code) throw new Error('请输入指标编码');
  if (!indicator.name) throw new Error('请输入指标名称');
  if (!indicator.dimensionId) throw new Error('请选择所属维度');
  if (!template.dimensions.some((item) => item.id === indicator.dimensionId)) {
    throw new Error('所属维度不存在');
  }
  ensureIndicatorCodeUnique(template, indicator);
}

export function getSupervisionTemplateStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export async function seedSupervisionTemplateData() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  const current = readTemplates();
  if (current.length) {
    window.localStorage.setItem(SEED_KEY, '1');
    return;
  }
  writeTemplates(createSeedTemplates());
  window.localStorage.setItem(SEED_KEY, '1');
}

export async function listSupervisionTemplates() {
  return readTemplates().map((item) => normalizeTemplate(item));
}

export async function saveSupervisionTemplate(payload) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const existing = templates.find((item) => item.id === payload.id);
  const template = normalizeTemplate({
    ...(existing || {}),
    ...payload,
    dimensions: payload.dimensions || existing?.dimensions || [],
    indicators: payload.indicators || existing?.indicators || [],
    createdAt: existing?.createdAt || payload.createdAt || nowText(),
    updatedAt: nowText(),
  });

  if (!template.name) {
    throw new Error('请输入模板名称');
  }

  const nextTemplates = templates.map((item) => (item.id === template.id ? template : item));
  if (!nextTemplates.some((item) => item.id === template.id)) {
    nextTemplates.unshift(template);
  }
  writeTemplates(nextTemplates);
  return clone(template);
}

export async function copySupervisionTemplate(templateId) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const source = ensureTemplateExists(templates, templateId);
  const dimensionIdMap = new Map();
  const dimensions = source.dimensions.map((dimension) => {
    const nextId = createId('dimension');
    dimensionIdMap.set(dimension.id, nextId);
    return {
      ...dimension,
      id: nextId,
      createdAt: nowText(),
      updatedAt: nowText(),
    };
  }).map((dimension) => ({
    ...dimension,
    parentId: dimension.parentId ? dimensionIdMap.get(dimension.parentId) || '' : '',
  }));
  const indicators = source.indicators.map((indicator) => ({
    ...indicator,
    id: createId('indicator'),
    dimensionId: dimensionIdMap.get(indicator.dimensionId) || '',
    createdAt: nowText(),
    updatedAt: nowText(),
  }));
  const copied = normalizeTemplate({
    ...source,
    id: createId('supervision_template'),
    name: `${source.name} 副本`,
    status: 'DISABLED',
    dimensions,
    indicators,
    createdAt: nowText(),
    updatedAt: nowText(),
  });
  writeTemplates([copied, ...templates]);
  return clone(copied);
}

export async function deleteSupervisionTemplate(templateId) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const template = ensureTemplateExists(templates, templateId);
  if (template.dimensions.length || template.indicators.length) {
    throw new Error('当前模板已包含维度或指标，请先清理后再删除');
  }
  const nextTemplates = templates.filter((item) => item.id !== templateId);
  writeTemplates(nextTemplates);
  return clone(template);
}

export async function saveSupervisionTemplateDimension(templateId, payload) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const template = ensureTemplateExists(templates, templateId);
  const existing = template.dimensions.find((item) => item.id === payload.id);
  const dimension = normalizeDimension({
    ...(existing || {}),
    ...payload,
    createdAt: existing?.createdAt || payload.createdAt || nowText(),
    updatedAt: nowText(),
  });
  validateDimension(template, dimension);
  template.dimensions = sortDimensions([
    ...template.dimensions.filter((item) => item.id !== dimension.id),
    dimension,
  ]);
  template.updatedAt = nowText();
  writeTemplates(templates);
  return clone(dimension);
}

export async function deleteSupervisionTemplateDimension(templateId, dimensionId) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const template = ensureTemplateExists(templates, templateId);
  const dimension = template.dimensions.find((item) => item.id === dimensionId);
  if (!dimension) {
    throw new Error('维度不存在');
  }
  if (template.dimensions.some((item) => item.parentId === dimensionId)) {
    throw new Error('当前维度存在下级维度，请先调整或删除下级维度');
  }
  if (template.indicators.some((item) => item.dimensionId === dimensionId)) {
    throw new Error('当前维度已被指标引用，请先删除或迁移相关指标');
  }
  template.dimensions = template.dimensions.filter((item) => item.id !== dimensionId);
  template.updatedAt = nowText();
  writeTemplates(templates);
  return clone(dimension);
}

export async function saveSupervisionTemplateIndicator(templateId, payload) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const template = ensureTemplateExists(templates, templateId);
  const existing = template.indicators.find((item) => item.id === payload.id);
  const indicator = normalizeIndicator({
    ...(existing || {}),
    ...payload,
    createdAt: existing?.createdAt || payload.createdAt || nowText(),
    updatedAt: nowText(),
  });
  validateIndicator(template, indicator);
  template.indicators = sortIndicators([
    ...template.indicators.filter((item) => item.id !== indicator.id),
    indicator,
  ]);
  template.updatedAt = nowText();
  writeTemplates(templates);
  return clone(indicator);
}

export async function deleteSupervisionTemplateIndicator(templateId, indicatorId) {
  const templates = readTemplates().map((item) => normalizeTemplate(item));
  const template = ensureTemplateExists(templates, templateId);
  const indicator = template.indicators.find((item) => item.id === indicatorId);
  if (!indicator) {
    throw new Error('指标不存在');
  }
  template.indicators = template.indicators.filter((item) => item.id !== indicatorId);
  template.updatedAt = nowText();
  writeTemplates(templates);
  return clone(indicator);
}
