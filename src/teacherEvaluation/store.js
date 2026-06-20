const SCHEME_STORAGE_KEY = 'gr.teacher-evaluation.schemes.v1';
const RECORD_STORAGE_KEY = 'gr.teacher-evaluation.records.v1';
const AUDIT_STORAGE_KEY = 'gr.teacher-evaluation.audit.v1';
const SEED_KEY = 'gr.teacher-evaluation.seeded.v1';
const STORE_CHANGE_EVENT = 'gr:teacher-evaluation-change';

export const TEACHER_EVALUATION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_REVIEW', label: '评审中' },
  { value: 'SUPPLEMENT_REQUIRED', label: '待补证' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '未通过' },
  { value: 'APPEAL_PENDING', label: '申诉中' },
  { value: 'APPEAL_RESOLVED', label: '申诉已处理' },
];

export const TEACHER_EVALUATION_ROLE_OPTIONS = [
  { value: 'TEACHER', label: '教师' },
  { value: 'GROUP_LEADER', label: '教研组长' },
  { value: 'ENTERPRISE_MENTOR', label: '企业导师' },
  { value: 'SUPERVISOR', label: '督导/教学管理者' },
  { value: 'SCHOOL_REVIEW', label: '校级评审组' },
];

export const AI_DRAFT_STATUS_OPTIONS = [
  { value: 'PENDING_HUMAN', label: '待人工确认' },
  { value: 'CONFIRMED', label: '已采纳' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'REVISED', label: '人工修改后采纳' },
];

const ROLE_LABEL_MAP = Object.fromEntries(TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => [item.value, item.label]));
const STATUS_LABEL_MAP = Object.fromEntries(TEACHER_EVALUATION_STATUS_OPTIONS.map((item) => [item.value, item.label]));
const AI_STATUS_LABEL_MAP = Object.fromEntries(AI_DRAFT_STATUS_OPTIONS.map((item) => [item.value, item.label]));

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
    console.warn(`[teacher-evaluation-store] failed to read ${storageKey}`, error);
    return [];
  }
}

function writeList(storageKey, list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(list));
}

function writeAll({ schemes, records, auditLogs }) {
  writeList(SCHEME_STORAGE_KEY, schemes);
  writeList(RECORD_STORAGE_KEY, records);
  writeList(AUDIT_STORAGE_KEY, auditLogs);
  emitChange();
}

function readAll() {
  return {
    schemes: readList(SCHEME_STORAGE_KEY),
    records: readList(RECORD_STORAGE_KEY),
    auditLogs: readList(AUDIT_STORAGE_KEY),
  };
}

function createDefaultTeacherProfiles() {
  return [
    {
      teacherId: 'teacher_zhou_lan',
      name: '周岚',
      schoolName: '海右职业技术学院',
      departmentName: '智能制造教研组',
      roleName: '智能制造专业教师',
      targetLevel: '双师型骨干讲师',
    },
    {
      teacherId: 'teacher_sun_he',
      name: '孙鹤',
      schoolName: '海右职业技术学院',
      departmentName: '机电工程教研组',
      roleName: '机电一体化专业教师',
      targetLevel: '专业带头人',
    },
  ];
}

function createSeedSchemes() {
  return [
    {
      id: 'scheme_dual_teacher',
      name: '双师型教师认定',
      schemeType: '双师型认定',
      targetRole: '职教教师',
      targetLevel: '双师型骨干讲师',
      semester: '2026 春季学期',
      summary: '面向职业院校专业课教师，重点核验企业实践、技能考核设计和校企协同能力。',
      aiBoundary: '只做建议稿',
      status: 'ACTIVE',
      dimensionWeights: [
        { key: 'task_transfer', name: '岗位任务转化', weight: 20 },
        { key: 'integration', name: '理实一体教学', weight: 20 },
        { key: 'assessment', name: '学习评价与技能考核', weight: 20 },
        { key: 'enterprise', name: '校企协同与企业实践', weight: 25 },
        { key: 'teamwork', name: '专业建设与团队引领', weight: 15 },
      ],
      itemRubrics: [
        {
          key: 'rubric_enterprise',
          itemName: '企业项目融入',
          evidenceThreshold: '至少 2 条企业项目转化证据，且包含 1 条企业导师意见。',
          evaluatorRoles: ['本人', '教研组长', '企业导师'],
          aiAssistAllowed: true,
        },
        {
          key: 'rubric_assessment',
          itemName: '技能考核量规设计',
          evidenceThreshold: '至少 1 份量规、1 份考核数据分析和 1 条改进行动。',
          evaluatorRoles: ['本人', '教研组长'],
          aiAssistAllowed: true,
        },
        {
          key: 'rubric_safety',
          itemName: '安全规范落实',
          evidenceThreshold: '至少 1 份安全巡检记录和 1 次督导观察记录。',
          evaluatorRoles: ['本人', '督导/教学管理者'],
          aiAssistAllowed: false,
        },
      ],
      reviewFlow: [
        { key: 'submit', name: '教师提交证据', owner: 'TEACHER', output: '证据包与成长摘要' },
        { key: 'group_review', name: '组内初审', owner: 'GROUP_LEADER', output: '初审意见与补证要求' },
        { key: 'special_review', name: '专项评议', owner: 'ENTERPRISE_MENTOR', output: '专项评议意见' },
        { key: 'school_review', name: '校级复核', owner: 'SCHOOL_REVIEW', output: '认定结论' },
      ],
      aiAssistants: [
        {
          key: 'evidence_curator',
          name: '证据整理助手',
          roleScope: '教师 / 教研组长',
          responsibilities: ['自动归档材料', '提取关键事实', '生成成长摘要'],
          restrictions: ['不得给出最终认定结论'],
        },
        {
          key: 'rubric_prefill',
          name: '量规预填助手',
          roleScope: '教研组长 / 企业导师',
          responsibilities: ['按量规预填建议项', '标注缺证与错配', '草拟初审意见'],
          restrictions: ['只能生成建议稿，必须人工确认'],
        },
        {
          key: 'review_pack',
          name: '评审包助手',
          roleScope: '校级评审组',
          responsibilities: ['拼装评审包', '汇总争议点', '生成待确认项清单'],
          restrictions: ['不得自动通过或淘汰教师'],
        },
      ],
      createdAt: '2026-06-20 09:00:00',
      updatedAt: '2026-06-20 09:00:00',
    },
    {
      id: 'scheme_program_lead',
      name: '专业带头人评审',
      schemeType: '骨干/带头人遴选',
      targetRole: '职教教师',
      targetLevel: '专业带头人',
      semester: '2026 学年',
      summary: '用于专业带头人遴选，重点查看专业建设、团队带教、课程标准更新和校企共建成果。',
      aiBoundary: '只做建议稿',
      status: 'ACTIVE',
      dimensionWeights: [
        { key: 'program_building', name: '专业建设与团队引领', weight: 35 },
        { key: 'enterprise', name: '校企协同与企业实践', weight: 25 },
        { key: 'task_transfer', name: '岗位任务转化', weight: 15 },
        { key: 'assessment', name: '学习评价与技能考核', weight: 15 },
        { key: 'safety', name: '实训组织与安全规范', weight: 10 },
      ],
      itemRubrics: [
        {
          key: 'rubric_program',
          itemName: '专业建设推进',
          evidenceThreshold: '至少 1 份专业建设方案、1 份课程标准修订记录、1 条校级复核意见。',
          evaluatorRoles: ['本人', '教研组长', '校级评审组'],
          aiAssistAllowed: true,
        },
        {
          key: 'rubric_team',
          itemName: '双师团队带教',
          evidenceThreshold: '至少 2 条带教记录和 1 条专题教研成果。',
          evaluatorRoles: ['本人', '教研组长'],
          aiAssistAllowed: true,
        },
      ],
      reviewFlow: [
        { key: 'submit', name: '教师申报', owner: 'TEACHER', output: '申报表与证据清单' },
        { key: 'dept_review', name: '部门评议', owner: 'GROUP_LEADER', output: '部门推荐意见' },
        { key: 'school_review', name: '校级评审', owner: 'SCHOOL_REVIEW', output: '评审结论与复核意见' },
        { key: 'appeal', name: '结果确认 / 申诉', owner: 'TEACHER', output: '申诉或确认记录' },
      ],
      aiAssistants: [
        {
          key: 'program_brief',
          name: '专业建设摘要助手',
          roleScope: '教研组长 / 校级评审组',
          responsibilities: ['汇总建设成果', '生成时间线', '标注关键证据缺口'],
          restrictions: ['不得代替评审组形成最终结论'],
        },
      ],
      createdAt: '2026-06-20 09:00:00',
      updatedAt: '2026-06-20 09:00:00',
    },
  ];
}

function createEvidenceItemsForRubric(rubric, teacherName) {
  const commonDate = nowText().slice(0, 10);
  return [
    {
      id: createId('evidence'),
      title: `${teacherName} · ${rubric.itemName}证据包`,
      sourceType: '成长档案记录',
      sourceLabel: '我的档案',
      relatedItemName: rubric.itemName,
      date: commonDate,
      summary: `${rubric.itemName}相关材料已归并为单个证据包，便于 AI 提取事实与评审引用。`,
      evidenceThreshold: rubric.evidenceThreshold,
      resourcePath: `教师评价 / ${rubric.itemName}`,
      coverage: 82,
      statusLabel: '证据初步具备',
    },
    {
      id: createId('evidence'),
      title: `${teacherName} · ${rubric.itemName}补充材料`,
      sourceType: '教研协同记录',
      sourceLabel: '教研数据',
      relatedItemName: rubric.itemName,
      date: commonDate,
      summary: `补充了 ${rubric.itemName} 的过程记录与改进行动。`,
      evidenceThreshold: rubric.evidenceThreshold,
      resourcePath: `教师评价 / ${rubric.itemName} / 补充材料`,
      coverage: 78,
      statusLabel: '证据初步具备',
    },
  ];
}

function createRecordFromScheme(scheme, teacher, overrides = {}) {
  const evidenceItems = (scheme.itemRubrics || []).flatMap((rubric) => createEvidenceItemsForRubric(rubric, teacher.name));
  const aiDrafts = (scheme.itemRubrics || []).map((rubric, index) => ({
    id: createId(`ai_draft_${index + 1}`),
    rubricKey: rubric.key,
    itemName: rubric.itemName,
    draftType: 'SUGGEST_ONLY',
    generatedBy: '评价辅助智能体',
    generatedAt: nowText(),
    summary: `已根据“${rubric.itemName}”的现有证据生成量规建议稿，供 ${rubric.evaluatorRoles.join(' / ')} 确认。`,
    suggestions: [
      `建议优先说明 ${teacher.name} 在“${rubric.itemName}”上的直接行为证据与结果证据。`,
      rubric.aiAssistAllowed ? '请人工确认量规建议项后再用于正式评议。' : '该项仅允许 AI 整理证据摘要，不允许 AI 预填判断。',
    ],
    references: evidenceItems.filter((item) => item.relatedItemName === rubric.itemName).map((item) => item.id),
    confidence: Number((0.76 + index * 0.04).toFixed(2)),
    reviewStatus: 'PENDING_HUMAN',
    reviewNote: '',
    reviewedBy: '',
    reviewedAt: '',
  }));
  const createdAt = overrides.createdAt || nowText();
  return {
    id: overrides.id || createId('eval_record'),
    schemeId: scheme.id,
    teacherId: teacher.teacherId,
    teacherName: teacher.name,
    schoolName: teacher.schoolName,
    departmentName: teacher.departmentName,
    roleName: teacher.roleName,
    targetLevel: teacher.targetLevel || scheme.targetLevel,
    status: overrides.status || 'DRAFT',
    currentNode: overrides.currentNode || scheme.reviewFlow?.[0]?.key || 'submit',
    submittedAt: overrides.submittedAt || '',
    createdAt,
    updatedAt: overrides.updatedAt || createdAt,
    evidenceItems,
    aiDrafts,
    reviewOpinions: Array.isArray(overrides.reviewOpinions) ? overrides.reviewOpinions : [],
    finalDecision: overrides.finalDecision || null,
    appeal: overrides.appeal || null,
  };
}

function createSeedData() {
  const schemes = createSeedSchemes();
  const teachers = createDefaultTeacherProfiles();
  const records = [
    createRecordFromScheme(schemes[0], teachers[0], {
      id: 'record_dual_draft',
      status: 'DRAFT',
      currentNode: 'submit',
      createdAt: '2026-06-18 09:30:00',
      updatedAt: '2026-06-18 09:30:00',
    }),
    createRecordFromScheme(schemes[0], teachers[0], {
      id: 'record_dual_review',
      status: 'IN_REVIEW',
      currentNode: 'group_review',
      submittedAt: '2026-06-19 10:10:00',
      createdAt: '2026-06-19 10:10:00',
      updatedAt: '2026-06-20 09:40:00',
      reviewOpinions: [
        {
          id: 'opinion_group_1',
          nodeKey: 'group_review',
          actorRole: 'GROUP_LEADER',
          actorName: '刘燕',
          action: 'COMMENT',
          opinion: '证据链基本完整，建议补充企业导师对企业项目融入的专项评价后进入下一节点。',
          createdAt: '2026-06-20 09:40:00',
        },
      ],
    }),
    createRecordFromScheme(schemes[1], teachers[1], {
      id: 'record_program_approved',
      status: 'APPROVED',
      currentNode: 'school_review',
      submittedAt: '2026-06-12 14:10:00',
      createdAt: '2026-06-12 14:10:00',
      updatedAt: '2026-06-16 18:30:00',
      finalDecision: {
        result: 'APPROVED',
        decidedBy: '校级评审组',
        decidedAt: '2026-06-16 18:30:00',
        summary: '同意通过专业带头人评审，建议后续跟踪专业建设成果推广。',
      },
      reviewOpinions: [
        {
          id: 'opinion_dept_1',
          nodeKey: 'dept_review',
          actorRole: 'GROUP_LEADER',
          actorName: '王凯',
          action: 'ADVANCE',
          opinion: '部门评议通过，建议提交校级评审。',
          createdAt: '2026-06-14 10:20:00',
        },
        {
          id: 'opinion_school_1',
          nodeKey: 'school_review',
          actorRole: 'SCHOOL_REVIEW',
          actorName: '评审组',
          action: 'APPROVE',
          opinion: '证据充分，团队带教与专业建设成果明显。',
          createdAt: '2026-06-16 18:30:00',
        },
      ],
      aiDrafts: createRecordFromScheme(schemes[1], teachers[1]).aiDrafts.map((item, index) => ({
        ...item,
        reviewStatus: index === 0 ? 'REVISED' : 'CONFIRMED',
        reviewNote: index === 0 ? '人工调整摘要后采纳。' : '采纳 AI 证据整理建议。',
        reviewedBy: index === 0 ? '王凯' : '评审组',
        reviewedAt: index === 0 ? '2026-06-14 10:00:00' : '2026-06-16 18:10:00',
      })),
    }),
  ];

  const auditLogs = records.flatMap((record) => [
    {
      id: createId('audit'),
      recordId: record.id,
      actionType: 'CREATE_RECORD',
      operatorId: record.teacherId,
      operatorName: record.teacherName,
      operatorRole: 'TEACHER',
      targetType: 'TeacherEvaluationRecord',
      targetId: record.id,
      summary: `创建评价实例：${record.id}`,
      timestamp: record.createdAt,
    },
  ]);

  return { schemes, records, auditLogs };
}

function normalizeScheme(scheme) {
  return {
    ...scheme,
    id: scheme.id || createId('scheme'),
    name: trimText(scheme.name),
    status: scheme.status || 'ACTIVE',
    semester: trimText(scheme.semester),
    summary: trimText(scheme.summary),
    aiBoundary: trimText(scheme.aiBoundary) || '只做建议稿',
    dimensionWeights: Array.isArray(scheme.dimensionWeights) ? clone(scheme.dimensionWeights) : [],
    itemRubrics: Array.isArray(scheme.itemRubrics) ? clone(scheme.itemRubrics) : [],
    reviewFlow: Array.isArray(scheme.reviewFlow) ? clone(scheme.reviewFlow) : [],
    aiAssistants: Array.isArray(scheme.aiAssistants) ? clone(scheme.aiAssistants) : [],
    createdAt: scheme.createdAt || nowText(),
    updatedAt: scheme.updatedAt || nowText(),
  };
}

function normalizeAiDraft(draft) {
  return {
    ...draft,
    id: draft.id || createId('ai_draft'),
    generatedAt: draft.generatedAt || nowText(),
    reviewStatus: draft.reviewStatus || 'PENDING_HUMAN',
    reviewNote: trimText(draft.reviewNote),
    reviewedBy: trimText(draft.reviewedBy),
    reviewedAt: draft.reviewedAt || '',
    references: Array.isArray(draft.references) ? [...draft.references] : [],
    suggestions: Array.isArray(draft.suggestions) ? [...draft.suggestions] : [],
  };
}

function normalizeRecord(record) {
  return {
    ...record,
    id: record.id || createId('eval_record'),
    status: record.status || 'DRAFT',
    currentNode: record.currentNode || 'submit',
    teacherName: trimText(record.teacherName),
    schoolName: trimText(record.schoolName),
    departmentName: trimText(record.departmentName),
    roleName: trimText(record.roleName),
    targetLevel: trimText(record.targetLevel),
    evidenceItems: Array.isArray(record.evidenceItems) ? clone(record.evidenceItems) : [],
    aiDrafts: Array.isArray(record.aiDrafts) ? record.aiDrafts.map((item) => normalizeAiDraft(item)) : [],
    reviewOpinions: Array.isArray(record.reviewOpinions) ? clone(record.reviewOpinions) : [],
    finalDecision: record.finalDecision || null,
    appeal: record.appeal || null,
    submittedAt: record.submittedAt || '',
    createdAt: record.createdAt || nowText(),
    updatedAt: record.updatedAt || nowText(),
  };
}

function normalizeAuditLog(log) {
  return {
    ...log,
    id: log.id || createId('audit'),
    timestamp: log.timestamp || nowText(),
    summary: trimText(log.summary),
  };
}

function getSchemeById(schemes, schemeId) {
  return schemes.find((item) => item.id === schemeId) || null;
}

function getCurrentFlowIndex(record, scheme) {
  return (scheme?.reviewFlow || []).findIndex((item) => item.key === record.currentNode);
}

function getNextFlowNode(record, scheme) {
  const currentIndex = getCurrentFlowIndex(record, scheme);
  if (currentIndex === -1) return null;
  return scheme.reviewFlow[currentIndex + 1] || null;
}

function appendAuditLog(auditLogs, payload) {
  auditLogs.unshift(normalizeAuditLog(payload));
}

function appendOpinion(record, payload) {
  record.reviewOpinions.push({
    id: createId('opinion'),
    nodeKey: payload.nodeKey,
    actorRole: payload.actorRole,
    actorName: payload.actorName,
    action: payload.action,
    opinion: trimText(payload.opinion),
    createdAt: nowText(),
  });
}

export function getTeacherEvaluationStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export async function seedTeacherEvaluationData() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  const current = readAll();
  if (current.schemes.length || current.records.length || current.auditLogs.length) {
    window.localStorage.setItem(SEED_KEY, '1');
    return;
  }
  writeAll(createSeedData());
  window.localStorage.setItem(SEED_KEY, '1');
}

export async function listTeacherEvaluationSchemes() {
  return readList(SCHEME_STORAGE_KEY).map((item) => normalizeScheme(item));
}

export async function saveTeacherEvaluationScheme(payload) {
  const current = readAll();
  const scheme = normalizeScheme(payload);
  const nextSchemes = current.schemes.map((item) => (item.id === scheme.id ? scheme : item));
  if (!nextSchemes.some((item) => item.id === scheme.id)) {
    nextSchemes.unshift(scheme);
  }
  writeAll({ ...current, schemes: nextSchemes });
  return clone(scheme);
}

export async function listTeacherEvaluationRecords() {
  return readList(RECORD_STORAGE_KEY).map((item) => normalizeRecord(item));
}

export async function getTeacherEvaluationRecord(id) {
  const target = readList(RECORD_STORAGE_KEY).find((item) => item.id === id);
  return target ? normalizeRecord(target) : null;
}

export async function createTeacherEvaluationRecord(schemeId, teacherProfile = null) {
  const current = readAll();
  const schemes = current.schemes.map((item) => normalizeScheme(item));
  const scheme = getSchemeById(schemes, schemeId);
  if (!scheme) {
    throw new Error('评价方案不存在');
  }
  const teacher = teacherProfile || createDefaultTeacherProfiles().find((item) => item.targetLevel === scheme.targetLevel) || createDefaultTeacherProfiles()[0];
  const record = normalizeRecord(createRecordFromScheme(scheme, teacher));
  const nextRecords = [record, ...current.records];
  const nextAuditLogs = [...current.auditLogs];
  appendAuditLog(nextAuditLogs, {
    recordId: record.id,
    actionType: 'CREATE_RECORD',
    operatorId: teacher.teacherId,
    operatorName: teacher.name,
    operatorRole: 'TEACHER',
    targetType: 'TeacherEvaluationRecord',
    targetId: record.id,
    summary: `新建评价实例「${record.id}」`,
  });
  writeAll({ ...current, records: nextRecords, auditLogs: nextAuditLogs });
  return clone(record);
}

export async function submitTeacherEvaluationRecord(recordId, actor = {}) {
  const current = readAll();
  const schemes = current.schemes.map((item) => normalizeScheme(item));
  const nextRecords = current.records.map((item) => normalizeRecord(item));
  const record = nextRecords.find((item) => item.id === recordId);
  if (!record) throw new Error('评价实例不存在');
  const scheme = getSchemeById(schemes, record.schemeId);
  const nextNode = scheme?.reviewFlow?.[1] || null;
  if (!nextNode) throw new Error('评价流程未配置下一节点');
  record.status = 'IN_REVIEW';
  record.currentNode = nextNode.key;
  record.submittedAt = nowText();
  record.updatedAt = nowText();
  const nextAuditLogs = [...current.auditLogs];
  appendAuditLog(nextAuditLogs, {
    recordId,
    actionType: 'SUBMIT_RECORD',
    operatorId: actor.operatorId || record.teacherId,
    operatorName: actor.operatorName || record.teacherName,
    operatorRole: actor.operatorRole || 'TEACHER',
    targetType: 'TeacherEvaluationRecord',
    targetId: recordId,
    summary: `提交评价实例，流转到「${nextNode.name}」`,
  });
  writeAll({ ...current, records: nextRecords, auditLogs: nextAuditLogs });
  return clone(record);
}

export async function reviewTeacherEvaluationRecord(recordId, payload) {
  const current = readAll();
  const schemes = current.schemes.map((item) => normalizeScheme(item));
  const nextRecords = current.records.map((item) => normalizeRecord(item));
  const record = nextRecords.find((item) => item.id === recordId);
  if (!record) throw new Error('评价实例不存在');
  const scheme = getSchemeById(schemes, record.schemeId);
  if (!scheme) throw new Error('评价方案不存在');
  const currentNode = scheme.reviewFlow.find((item) => item.key === record.currentNode) || scheme.reviewFlow[0];
  appendOpinion(record, {
    nodeKey: currentNode.key,
    actorRole: payload.actorRole,
    actorName: payload.actorName,
    action: payload.action,
    opinion: payload.opinion,
  });

  if (payload.action === 'REQUEST_SUPPLEMENT') {
    record.status = 'SUPPLEMENT_REQUIRED';
    record.currentNode = scheme.reviewFlow[0]?.key || 'submit';
  } else if (payload.action === 'ADVANCE') {
    const nextNode = getNextFlowNode(record, scheme);
    if (nextNode) {
      record.status = 'IN_REVIEW';
      record.currentNode = nextNode.key;
    } else {
      record.status = 'APPROVED';
      record.finalDecision = {
        result: 'APPROVED',
        decidedBy: ROLE_LABEL_MAP[payload.actorRole] || payload.actorRole,
        decidedAt: nowText(),
        summary: trimText(payload.opinion) || '评审通过',
      };
    }
  } else if (payload.action === 'APPROVE') {
    record.status = 'APPROVED';
    record.finalDecision = {
      result: 'APPROVED',
      decidedBy: ROLE_LABEL_MAP[payload.actorRole] || payload.actorRole,
      decidedAt: nowText(),
      summary: trimText(payload.opinion) || '评审通过',
    };
  } else if (payload.action === 'REJECT') {
    record.status = 'REJECTED';
    record.finalDecision = {
      result: 'REJECTED',
      decidedBy: ROLE_LABEL_MAP[payload.actorRole] || payload.actorRole,
      decidedAt: nowText(),
      summary: trimText(payload.opinion) || '评审未通过',
    };
  } else if (payload.action === 'RESOLVE_APPEAL') {
    record.status = 'APPEAL_RESOLVED';
    record.appeal = {
      ...(record.appeal || {}),
      status: 'RESOLVED',
      resolvedBy: payload.actorName,
      resolvedAt: nowText(),
      resolution: trimText(payload.opinion),
    };
  }

  record.updatedAt = nowText();
  const nextAuditLogs = [...current.auditLogs];
  appendAuditLog(nextAuditLogs, {
    recordId,
    actionType: payload.action,
    operatorId: payload.actorId || payload.actorRole,
    operatorName: payload.actorName,
    operatorRole: payload.actorRole,
    targetType: 'TeacherEvaluationRecord',
    targetId: recordId,
    summary: `${payload.actorName} 执行「${payload.action}」：${trimText(payload.opinion) || '无附加意见'}`,
  });
  writeAll({ ...current, records: nextRecords, auditLogs: nextAuditLogs });
  return clone(record);
}

export async function updateTeacherEvaluationAiDraft(recordId, draftId, payload) {
  const current = readAll();
  const nextRecords = current.records.map((item) => normalizeRecord(item));
  const record = nextRecords.find((item) => item.id === recordId);
  if (!record) throw new Error('评价实例不存在');
  const draft = record.aiDrafts.find((item) => item.id === draftId);
  if (!draft) throw new Error('AI 建议稿不存在');

  if (payload.action === 'REGENERATE') {
    draft.generatedAt = nowText();
    draft.reviewStatus = 'PENDING_HUMAN';
    draft.reviewNote = '';
    draft.reviewedBy = '';
    draft.reviewedAt = '';
    draft.summary = `已重新生成“${draft.itemName}”的建议稿，请重新人工确认。`;
    draft.suggestions = [
      `建议重新核对“${draft.itemName}”的核心证据与评价主体意见。`,
      '请确认重新生成的建议稿是否可进入正式评议。',
    ];
  } else {
    draft.reviewStatus = payload.action === 'CONFIRM' ? 'CONFIRMED' : payload.action === 'REVISE' ? 'REVISED' : 'REJECTED';
    draft.reviewNote = trimText(payload.reviewNote);
    draft.reviewedBy = payload.actorName;
    draft.reviewedAt = nowText();
  }

  record.updatedAt = nowText();
  const nextAuditLogs = [...current.auditLogs];
  appendAuditLog(nextAuditLogs, {
    recordId,
    actionType: `AI_DRAFT_${payload.action}`,
    operatorId: payload.actorId || payload.actorRole,
    operatorName: payload.actorName,
    operatorRole: payload.actorRole,
    targetType: 'AiSuggestionDraft',
    targetId: draftId,
    summary: `${payload.actorName} 对 AI 建议稿执行「${payload.action}」`,
  });
  writeAll({ ...current, records: nextRecords, auditLogs: nextAuditLogs });
  return clone(draft);
}

export async function submitTeacherEvaluationAppeal(recordId, payload) {
  const current = readAll();
  const schemes = current.schemes.map((item) => normalizeScheme(item));
  const nextRecords = current.records.map((item) => normalizeRecord(item));
  const record = nextRecords.find((item) => item.id === recordId);
  if (!record) throw new Error('评价实例不存在');
  const scheme = getSchemeById(schemes, record.schemeId);
  const appealNode = scheme?.reviewFlow?.find((item) => item.key === 'appeal');
  record.status = 'APPEAL_PENDING';
  record.currentNode = appealNode?.key || record.currentNode;
  record.appeal = {
    status: 'PENDING',
    reason: trimText(payload.reason),
    submittedBy: payload.actorName,
    submittedAt: nowText(),
  };
  record.updatedAt = nowText();
  const nextAuditLogs = [...current.auditLogs];
  appendAuditLog(nextAuditLogs, {
    recordId,
    actionType: 'SUBMIT_APPEAL',
    operatorId: payload.actorId || payload.actorRole,
    operatorName: payload.actorName,
    operatorRole: payload.actorRole,
    targetType: 'TeacherEvaluationRecord',
    targetId: recordId,
    summary: `提交申诉：${trimText(payload.reason)}`,
  });
  writeAll({ ...current, records: nextRecords, auditLogs: nextAuditLogs });
  return clone(record);
}

export async function listTeacherEvaluationAuditLogs(recordId = '') {
  const logs = readList(AUDIT_STORAGE_KEY).map((item) => normalizeAuditLog(item));
  return recordId ? logs.filter((item) => item.recordId === recordId) : logs;
}

export function getTeacherEvaluationStatusLabel(status) {
  return STATUS_LABEL_MAP[status] || status;
}

export function getTeacherEvaluationRoleLabel(role) {
  return ROLE_LABEL_MAP[role] || role;
}

export function getAiDraftStatusLabel(status) {
  return AI_STATUS_LABEL_MAP[status] || status;
}
