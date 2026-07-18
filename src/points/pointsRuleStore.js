export const POINT_TASK_RULE_STORE_KEY = 'guoren.points.taskRules.v1';
export const POINT_TASK_RULE_STORE_EVENT = 'guoren:points-task-rules-change';

export const POINT_EVENT_CATALOG = [
  {
    eventName: 'study.course.completed',
    eventLabel: '课程学习完成',
    sourceModule: '研习社',
    category: 'learning',
    defaultPoints: 20,
    defaultTaskTitle: '完成果仁新功能专题课',
    defaultTaskDesc: '完成研习社中的果仁课程，系统埋点触发后按规则计算积分。',
    conditionFields: ['courseType', 'courseId', 'courseResult'],
  },
  {
    eventName: 'beta.feedback.submitted',
    eventLabel: '内测反馈提交',
    sourceModule: '内测专区',
    category: 'beta',
    defaultPoints: 30,
    defaultTaskTitle: '参与空间内测并提交反馈',
    defaultTaskDesc: '在内测专区提交有效反馈，系统根据内测反馈事件进入审核或入账。',
    conditionFields: ['feedbackType', 'featureKey', 'hasEvidence'],
  },
  {
    eventName: 'ugc.share.created',
    eventLabel: 'UGC 分享发起',
    sourceModule: 'UGC 贡献专区',
    category: 'ugc',
    defaultPoints: 40,
    defaultTaskTitle: '发起一次 UGC 自主分享',
    defaultTaskDesc: '自主发起果仁使用技巧、场景案例或内测体验分享，完成后按规则计分。',
    conditionFields: ['shareType', 'hasMaterial', 'audienceCount'],
  },
  {
    eventName: 'knowledge.faq.created',
    eventLabel: 'FAQ 补充',
    sourceModule: '资历库',
    category: 'feedback',
    defaultPoints: 15,
    defaultTaskTitle: '补充一条高频问题 FAQ',
    defaultTaskDesc: '将高频问题整理为可复用 FAQ，经收录或审核后获得积分。',
    conditionFields: ['faqType', 'isDuplicate', 'sourceModule'],
  },
  {
    eventName: 'resource.template.accepted',
    eventLabel: '模板收录',
    sourceModule: '资料区',
    category: 'ugc',
    defaultPoints: 20,
    defaultTaskTitle: '贡献一个可复用模板',
    defaultTaskDesc: '贡献空间结构、任务、问卷、反馈或复盘模板，被资料区收录后计分。',
    conditionFields: ['templateType', 'isReusable', 'reviewResult'],
  },
  {
    eventName: 'im.answer.accepted',
    eventLabel: '答疑被采纳',
    sourceModule: 'IM 答疑群',
    category: 'qa',
    defaultPoints: 10,
    defaultTaskTitle: '帮助同事解决果仁使用问题',
    defaultTaskDesc: '在 IM、空间或研讨会中提供可验证答复，被采纳后按规则计分。',
    conditionFields: ['answerType', 'acceptedBy', 'relatedModule'],
  },
  {
    eventName: 'practice.case.collected',
    eventLabel: '最佳实践收录',
    sourceModule: '资历库',
    category: 'practice',
    defaultPoints: 60,
    defaultTaskTitle: '提交果仁最佳实践案例',
    defaultTaskDesc: '使用案例被沉淀为最佳实践、资料或研习社课程后获得积分。',
    conditionFields: ['caseType', 'reuseScope', 'convertedToCourse'],
  },
];

export const CONDITION_OPERATOR_OPTIONS = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '包含', value: 'contains' },
  { label: '大于等于', value: 'gte' },
  { label: '存在', value: 'exists' },
];

export const REVIEW_MODE_OPTIONS = [
  { label: '自动入账', value: '自动入账' },
  { label: '运营审核', value: '运营审核' },
  { label: '产品确认', value: '产品确认' },
];

export const LIMIT_MODE_OPTIONS = [
  { label: '每人一次', value: '每人一次' },
  { label: '每日一次', value: '每日一次' },
  { label: '每对象一次', value: '每对象一次' },
  { label: '每月上限 3 次', value: '每月上限 3 次' },
];

export const TARGET_AUDIENCE_OPTIONS = [
  { label: '全部员工', value: '全部员工' },
  { label: '市场/销售/售前/客户成功', value: '市场/销售/售前/客户成功' },
  { label: '内测用户', value: '内测用户' },
  { label: '空间管理员', value: '空间管理员' },
  { label: 'UGC 贡献者', value: 'UGC 贡献者' },
];

export function createConditionLeaf(field = 'type', operator = 'eq', value = '有效') {
  return {
    type: 'condition',
    field,
    operator,
    value: operator === 'exists' ? '' : value,
  };
}

export function createConditionGroup(logic = 'AND', children = []) {
  return {
    type: 'group',
    logic: logic === 'OR' ? 'OR' : 'AND',
    children,
  };
}

function normalizeConditionLeaf(condition = {}) {
  const operator = condition.operator || 'eq';
  return createConditionLeaf(
    condition.field || '',
    operator,
    operator === 'exists' ? '' : String(condition.value ?? ''),
  );
}

export function conditionsToTree(conditions = []) {
  return createConditionGroup(
    'AND',
    conditions.map((condition) => normalizeConditionLeaf(condition)),
  );
}

export function normalizeConditionTree(input, fallbackConditions = []) {
  if (Array.isArray(input)) return conditionsToTree(input);
  if (input?.type === 'condition') return normalizeConditionLeaf(input);
  if (input?.type === 'group') {
    return createConditionGroup(
      input.logic,
      (input.children || [])
        .map((child) => normalizeConditionTree(child))
        .filter(Boolean),
    );
  }
  return conditionsToTree(fallbackConditions);
}

export function cloneConditionTree(tree) {
  return JSON.parse(JSON.stringify(normalizeConditionTree(tree)));
}

export function validateConditionTree(tree) {
  const normalizedTree = normalizeConditionTree(tree);
  if (normalizedTree.type !== 'group' || !normalizedTree.children.length) {
    return { valid: false, message: '请至少配置一个触发条件' };
  }

  let errorMessage = '';
  const walk = (node) => {
    if (errorMessage) return;
    if (node.type === 'group') {
      if (!node.children.length) {
        errorMessage = '条件组不能为空，请添加条件或删除该组';
        return;
      }
      node.children.forEach(walk);
      return;
    }
    if (!node.field) {
      errorMessage = '请完善每个条件的字段';
      return;
    }
    if (!node.operator) {
      errorMessage = '请完善每个条件的操作符';
      return;
    }
    if (node.operator !== 'exists' && !String(node.value ?? '').trim()) {
      errorMessage = '非“存在”条件必须填写条件值';
    }
  };

  walk(normalizedTree);
  return errorMessage
    ? { valid: false, message: errorMessage }
    : { valid: true, message: '', tree: normalizedTree };
}

const DEFAULT_RULES = [
  createPointTaskRule({
    id: 'ptr-course-completed',
    name: '完成果仁新功能专题课计分',
    eventName: 'study.course.completed',
    conditions: [{ field: 'courseType', operator: 'eq', value: '新功能专题课' }],
    validFrom: '2026-07-01',
    validTo: '2026-08-31',
  }),
  createPointTaskRule({
    id: 'ptr-beta-feedback',
    name: '提交有效内测反馈计分',
    eventName: 'beta.feedback.submitted',
    conditionTree: createConditionGroup('AND', [
      createConditionLeaf('feedbackType', 'neq', '重复问题'),
      createConditionGroup('OR', [
        createConditionLeaf('hasEvidence', 'eq', '是'),
        createConditionLeaf('featureKey', 'exists', ''),
      ]),
    ]),
    validFrom: '2026-07-10',
    validTo: '2026-08-10',
  }),
  createPointTaskRule({
    id: 'ptr-ugc-share',
    name: 'UGC 自主分享完成计分',
    eventName: 'ugc.share.created',
    conditions: [{ field: 'hasMaterial', operator: 'eq', value: '是' }],
    validFrom: '2026-07-01',
    validTo: '2026-09-30',
  }),
  createPointTaskRule({
    id: 'ptr-faq-created',
    name: 'FAQ 补充收录计分',
    eventName: 'knowledge.faq.created',
    conditions: [{ field: 'isDuplicate', operator: 'eq', value: '否' }],
    reviewMode: '运营审核',
    validFrom: '2026-07-01',
    validTo: '2026-12-31',
  }),
  createPointTaskRule({
    id: 'ptr-practice-collected',
    name: '最佳实践收录计分',
    eventName: 'practice.case.collected',
    conditions: [{ field: 'reuseScope', operator: 'gte', value: '2 个团队' }],
    reviewMode: '运营审核',
    validFrom: '2026-07-01',
    validTo: '2026-12-31',
  }),
];

export function findPointEvent(eventName) {
  return POINT_EVENT_CATALOG.find((item) => item.eventName === eventName) || POINT_EVENT_CATALOG[0];
}

export function createPointTaskRule(overrides = {}) {
  const event = findPointEvent(overrides.eventName || 'study.course.completed');
  const fallbackConditions = [
    { field: event.conditionFields[0] || 'type', operator: 'eq', value: '有效' },
  ];
  return {
    id: overrides.id || `ptr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: overrides.name || `${event.eventLabel}计分规则`,
    category: overrides.category || event.category,
    sourceModule: overrides.sourceModule || event.sourceModule,
    eventName: event.eventName,
    eventLabel: event.eventLabel,
    conditionTree: normalizeConditionTree(overrides.conditionTree, overrides.conditions || fallbackConditions),
    points: Number.isFinite(Number(overrides.points)) ? Number(overrides.points) : event.defaultPoints,
    reviewMode: overrides.reviewMode || '运营审核',
    limitMode: overrides.limitMode || '每人一次',
    targetAudience: overrides.targetAudience || '全部员工',
    validFrom: overrides.validFrom || '2026-07-01',
    validTo: overrides.validTo || '2026-12-31',
    taskTitle: overrides.taskTitle || event.defaultTaskTitle,
    taskDesc: overrides.taskDesc || event.defaultTaskDesc,
    taskDisplay: overrides.taskDisplay ?? true,
    enabled: overrides.enabled ?? true,
  };
}

export function migratePointTaskRule(rule = {}) {
  const event = findPointEvent(rule.eventName || 'study.course.completed');
  const fallbackConditions = [
    { field: event.conditionFields[0] || 'type', operator: 'eq', value: '有效' },
  ];
  const migrated = {
    ...createPointTaskRule({ eventName: event.eventName }),
    ...rule,
    eventName: event.eventName,
    eventLabel: event.eventLabel,
    sourceModule: rule.sourceModule || event.sourceModule,
    category: rule.category || event.category,
    points: Number.isFinite(Number(rule.points)) ? Number(rule.points) : event.defaultPoints,
    conditionTree: normalizeConditionTree(rule.conditionTree, rule.conditions || fallbackConditions),
  };
  delete migrated.conditions;
  return migrated;
}

export function getDefaultPointTaskRules() {
  return DEFAULT_RULES.map((item) => migratePointTaskRule(item));
}

export function readPointTaskRules() {
  if (typeof window === 'undefined') return getDefaultPointTaskRules();
  try {
    const raw = window.localStorage.getItem(POINT_TASK_RULE_STORE_KEY);
    if (!raw) return getDefaultPointTaskRules();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length
      ? parsed.map((rule) => migratePointTaskRule(rule))
      : getDefaultPointTaskRules();
  } catch {
    return getDefaultPointTaskRules();
  }
}

export function writePointTaskRules(rules) {
  if (typeof window === 'undefined') return;
  const migratedRules = rules.map((rule) => migratePointTaskRule(rule));
  window.localStorage.setItem(POINT_TASK_RULE_STORE_KEY, JSON.stringify(migratedRules));
  window.dispatchEvent(new CustomEvent(POINT_TASK_RULE_STORE_EVENT, { detail: migratedRules }));
}

export function formatCondition(condition) {
  const operator = CONDITION_OPERATOR_OPTIONS.find((item) => item.value === condition.operator)?.label || condition.operator;
  if (condition.operator === 'exists') return `${condition.field} ${operator}`;
  return `${condition.field} ${operator} ${condition.value}`;
}

function formatConditionNode(node, isRoot = true) {
  if (!node) return '';
  if (Array.isArray(node)) return formatConditionNode(conditionsToTree(node), isRoot);
  if (node.type === 'condition') return formatCondition(node);
  if (node.type !== 'group') return '';

  const parts = (node.children || [])
    .map((child) => formatConditionNode(child, false))
    .filter(Boolean);
  if (!parts.length) return '';

  const joined = parts.join(` ${node.logic === 'OR' ? 'OR' : 'AND'} `);
  return isRoot ? joined : `(${joined})`;
}

export function formatConditions(conditionTree = []) {
  const text = formatConditionNode(conditionTree);
  return text || '无附加条件';
}

export function getVisiblePointTaskRules(rules = readPointTaskRules()) {
  return rules.filter((rule) => rule.enabled && rule.taskDisplay);
}
