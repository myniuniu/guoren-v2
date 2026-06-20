import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Progress,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  message,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  EditOutlined,
  HistoryOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  getAiDraftStatusLabel,
  getTeacherEvaluationRoleLabel,
  getTeacherEvaluationStatusLabel,
  TEACHER_EVALUATION_ROLE_OPTIONS,
  teacherEvaluationApi,
} from './api';
import { capabilityModelApi } from '../capabilityModel/api';
import '../system/SystemModule.css';
import './TeacherEvaluationModule.css';

const { TextArea } = Input;

const REVIEW_ROLE_LABEL_OPTIONS = TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.label,
}));

const SCHEME_TYPE_OPTIONS = [
  { label: '双师型认定', value: '双师型认定' },
  { label: '年度考核', value: '年度考核' },
  { label: '骨干/带头人遴选', value: '骨干/带头人遴选' },
  { label: '专业带头人评审', value: '专业带头人评审' },
  { label: '成长诊断', value: '成长诊断' },
];

const TARGET_ROLE_OPTIONS = [
  { label: '职教教师', value: '职教教师' },
  { label: '基础教育教师', value: '基础教育教师' },
  { label: '高校教师', value: '高校教师' },
];

const TARGET_LEVEL_OPTIONS = {
  职教教师: [
    { label: '初任讲师', value: '初任讲师' },
    { label: '双师型骨干讲师', value: '双师型骨干讲师' },
    { label: '专业带头人', value: '专业带头人' },
  ],
  基础教育教师: [
    { label: '新教师', value: '新教师' },
    { label: '青年教师', value: '青年教师' },
    { label: '骨干教师', value: '骨干教师' },
    { label: '学科带头人', value: '学科带头人' },
  ],
  高校教师: [
    { label: '青年教师', value: '青年教师' },
    { label: '骨干教师', value: '骨干教师' },
    { label: '学科负责人', value: '学科负责人' },
  ],
};

const AI_BOUNDARY_OPTIONS = [
  { label: '只做建议稿', value: '只做建议稿' },
  { label: '仅证据整理', value: '仅证据整理' },
  { label: '不启用 AI', value: '不启用 AI' },
];

const REVIEW_FLOW_NODE_OPTIONS = [
  { label: '教师提交证据', value: '教师提交证据', owner: 'TEACHER', output: '证据包与成长摘要' },
  { label: '组内初审', value: '组内初审', owner: 'GROUP_LEADER', output: '初审意见与补证要求' },
  { label: '专项评议', value: '专项评议', owner: 'ENTERPRISE_MENTOR', output: '专项评议意见' },
  { label: '校级复核', value: '校级复核', owner: 'SCHOOL_REVIEW', output: '认定结论' },
  { label: '结果确认 / 申诉', value: '结果确认 / 申诉', owner: 'TEACHER', output: '申诉或确认记录' },
];

const FLOW_OUTPUT_OPTIONS = REVIEW_FLOW_NODE_OPTIONS.map((item) => ({
  label: item.output,
  value: item.output,
}));

const AI_ASSISTANT_NAME_OPTIONS = [
  { label: '证据整理助手', value: '证据整理助手' },
  { label: '量规预填助手', value: '量规预填助手' },
  { label: '评审包助手', value: '评审包助手' },
  { label: '专业建设摘要助手', value: '专业建设摘要助手' },
];

const AI_ROLE_SCOPE_OPTIONS = [
  { label: '教师 / 教研组长', value: '教师 / 教研组长' },
  { label: '教研组长 / 企业导师', value: '教研组长 / 企业导师' },
  { label: '督导 / 教学管理者', value: '督导 / 教学管理者' },
  { label: '校级评审组', value: '校级评审组' },
];

const AI_RESPONSIBILITY_OPTIONS = [
  { label: '自动归档材料', value: '自动归档材料' },
  { label: '提取关键事实', value: '提取关键事实' },
  { label: '生成成长摘要', value: '生成成长摘要' },
  { label: '按量规预填建议项', value: '按量规预填建议项' },
  { label: '标注缺证与错配', value: '标注缺证与错配' },
  { label: '草拟初审意见', value: '草拟初审意见' },
  { label: '拼装评审包', value: '拼装评审包' },
  { label: '汇总争议点', value: '汇总争议点' },
  { label: '生成待确认项清单', value: '生成待确认项清单' },
  { label: '汇总建设成果', value: '汇总建设成果' },
  { label: '生成时间线', value: '生成时间线' },
];

const AI_RESTRICTION_OPTIONS = [
  { label: '不得给出最终认定结论', value: '不得给出最终认定结论' },
  { label: '只能生成建议稿，必须人工确认', value: '只能生成建议稿，必须人工确认' },
  { label: '不得自动通过或淘汰教师', value: '不得自动通过或淘汰教师' },
  { label: '不得代替评审组形成最终结论', value: '不得代替评审组形成最终结论' },
];

const DEFAULT_SCHEME_FORM = {
  name: '',
  schemeType: '双师型认定',
  targetRole: '职教教师',
  targetLevel: '双师型骨干讲师',
  semester: '2026 秋季学期',
  summary: '',
  aiBoundary: '只做建议稿',
  dimensionWeights: [
    { name: '岗位任务转化', weight: 20 },
    { name: '理实一体教学', weight: 20 },
    { name: '学习评价与技能考核', weight: 20 },
  ],
  itemRubrics: [
    {
      itemName: '企业项目融入',
      evidenceThreshold: '至少 2 条企业项目转化证据，并附 1 条企业导师意见。',
      evaluatorRoles: ['教师', '教研组长', '企业导师'],
      aiAssistAllowed: true,
    },
  ],
  reviewFlow: [
    { name: '教师提交证据', owner: 'TEACHER', output: '证据包与成长摘要' },
    { name: '组内初审', owner: 'GROUP_LEADER', output: '初审意见与补证要求' },
    { name: '校级复核', owner: 'SCHOOL_REVIEW', output: '认定结论' },
  ],
  aiAssistants: [
    {
      name: '证据整理助手',
      roleScope: '教师 / 教研组长',
      responsibilities: ['自动归档材料', '生成成长摘要'],
      restrictions: ['不得给出最终认定结论'],
    },
  ],
};

function weightColor(weight) {
  if (weight >= 25) return 'red';
  if (weight >= 20) return 'gold';
  return 'blue';
}

function statusColor(status) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    case 'SUPPLEMENT_REQUIRED':
      return 'warning';
    case 'APPEAL_PENDING':
      return 'processing';
    case 'APPEAL_RESOLVED':
      return 'cyan';
    case 'IN_REVIEW':
      return 'processing';
    default:
      return 'default';
  }
}

function aiDraftStatusColor(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'success';
    case 'REVISED':
      return 'processing';
    case 'REJECTED':
      return 'error';
    default:
      return 'default';
  }
}

function getNodeAllowedRoles(step) {
  if (!step) return [];
  if (step.owner === 'ENTERPRISE_MENTOR') {
    return ['ENTERPRISE_MENTOR', 'SUPERVISOR'];
  }
  return [step.owner];
}

function buildRecordTimeline(record, scheme) {
  const steps = (scheme?.reviewFlow || []).map((step) => {
    const opinions = (record.reviewOpinions || []).filter((item) => item.nodeKey === step.key);
    const description = opinions.length
      ? opinions.map((item) => `${getTeacherEvaluationRoleLabel(item.actorRole)} · ${item.actorName}：${item.opinion || item.action}`).join('；')
      : step.output;
    return {
      color: record.currentNode === step.key && ['IN_REVIEW', 'APPEAL_PENDING'].includes(record.status) ? 'blue' : opinions.length ? 'green' : 'gray',
      children: (
        <div className="teacher-evaluation-timeline-item">
          <strong>{step.name}</strong>
          <span>责任角色：{getNodeAllowedRoles(step).map((item) => getTeacherEvaluationRoleLabel(item)).join(' / ')}</span>
          <p>{description}</p>
        </div>
      ),
    };
  });

  if (record.finalDecision) {
    steps.push({
      color: record.finalDecision.result === 'APPROVED' ? 'green' : 'red',
      children: (
        <div className="teacher-evaluation-timeline-item">
          <strong>最终结论</strong>
          <span>{record.finalDecision.decidedBy} · {record.finalDecision.decidedAt}</span>
          <p>{record.finalDecision.summary}</p>
        </div>
      ),
    });
  }

  if (record.appeal) {
    steps.push({
      color: record.appeal.status === 'RESOLVED' ? 'cyan' : 'orange',
      children: (
        <div className="teacher-evaluation-timeline-item">
          <strong>申诉处理</strong>
          <span>{record.appeal.submittedBy} · {record.appeal.submittedAt}</span>
          <p>{record.appeal.reason}</p>
        </div>
      ),
    });
  }

  return steps;
}

function countPendingAiDrafts(records) {
  return records.reduce((sum, record) => (
    sum + (record.aiDrafts || []).filter((item) => item.reviewStatus === 'PENDING_HUMAN').length
  ), 0);
}

function toneToType(tone) {
  if (tone === 'primary') return 'primary';
  if (tone === 'danger') return 'primary';
  return 'default';
}

function parseMinimumEvidenceCount(text) {
  const matched = String(text || '').match(/至少\s*(\d+)/);
  return matched ? Number(matched[1]) : 1;
}

function getCapabilityReviewRoleLabel(role) {
  if (role === 'SELF') return '本人';
  return getTeacherEvaluationRoleLabel(role);
}

function distributeWeights(count) {
  if (!count) return [];
  const base = Math.floor(100 / count);
  let remainder = 100 - (base * count);
  return Array.from({ length: count }, () => {
    const current = base + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return current;
  });
}

function buildSchemeDraftFromModel(model) {
  const dimensionWeights = (model?.dimensions || []).map((dimension, index) => ({
    key: dimension.id,
    name: dimension.name,
    weight: distributeWeights((model?.dimensions || []).length)[index] || 0,
  }));
  const itemRubrics = (model?.dimensions || []).flatMap((dimension) => (
    (dimension.items || []).map((item) => ({
      key: item.id,
      itemName: item.name,
      evidenceThreshold: `至少 ${item.requiredEvidenceCount || 1} 条证据${item.requiredReviewRoles?.length ? `，评价主体：${item.requiredReviewRoles.map((role) => getCapabilityReviewRoleLabel(role)).join(' / ')}` : ''}`,
      evaluatorRoles: (item.requiredReviewRoles || []).map((role) => getCapabilityReviewRoleLabel(role)),
      aiAssistAllowed: item.aiAssistMode !== 'DISABLED',
    }))
  ));
  return {
    capabilityModelId: model?.id,
    referencedDimensionKeys: (model?.dimensions || []).map((dimension) => dimension.id),
    referencedItemKeys: (model?.dimensions || []).flatMap((dimension) => (dimension.items || []).map((item) => item.id)),
    dimensionWeights,
    itemRubrics,
  };
}

function buildRubricConfigFromModelItem(modelItem) {
  if (!modelItem) {
    return {
      evidenceThreshold: '',
      evaluatorRoles: [],
      aiAssistAllowed: true,
      evidenceThresholdOptions: [],
    };
  }
  const thresholdText = `至少 ${modelItem.requiredEvidenceCount || 1} 条证据${modelItem.requiredReviewRoles?.length ? `，评价主体：${modelItem.requiredReviewRoles.map((role) => getCapabilityReviewRoleLabel(role)).join(' / ')}` : ''}`;
  return {
    evidenceThreshold: thresholdText,
    evaluatorRoles: (modelItem.requiredReviewRoles || []).map((role) => getCapabilityReviewRoleLabel(role)),
    aiAssistAllowed: modelItem.aiAssistMode !== 'DISABLED',
    evidenceThresholdOptions: [{ label: thresholdText, value: thresholdText }],
  };
}

function filterCapabilityModelsByTargetRole(models, targetRole) {
  if (!targetRole) return models;
  return models.filter((model) => {
    const tags = model.tags || [];
    const code = String(model.modelCode || '');
    if (targetRole === '职教教师') {
      return tags.includes('职业教育') || tags.includes('职教教师') || code.includes('VOCATIONAL');
    }
    if (targetRole === '高校教师') {
      return tags.includes('高等教育') || tags.includes('高校教师') || code.includes('HIGHER');
    }
    if (targetRole === '基础教育教师') {
      return tags.includes('基础教育') || tags.includes('教师') || code.includes('BASIC');
    }
    return true;
  });
}

function createSchemeFormValues(scheme) {
  if (!scheme) return DEFAULT_SCHEME_FORM;
  return {
    name: scheme.name,
    schemeType: scheme.schemeType,
    targetRole: scheme.targetRole,
    targetLevel: scheme.targetLevel,
    capabilityModelId: scheme.capabilityModelId,
    semester: scheme.semester,
    summary: scheme.summary,
    aiBoundary: scheme.aiBoundary || '只做建议稿',
    dimensionWeights: (scheme.dimensionWeights || []).map((item) => ({
      name: item.name,
      weight: item.weight,
    })),
    itemRubrics: (scheme.itemRubrics || []).map((item) => ({
      itemName: item.itemName,
      evidenceThreshold: item.evidenceThreshold,
      evaluatorRoles: item.evaluatorRoles || [],
      aiAssistAllowed: Boolean(item.aiAssistAllowed),
    })),
    reviewFlow: (scheme.reviewFlow || []).map((item) => ({
      name: item.name,
      owner: item.owner,
      output: item.output,
    })),
    aiAssistants: (scheme.aiAssistants || []).map((item) => ({
      name: item.name,
      roleScope: item.roleScope,
      responsibilities: item.responsibilities || [],
      restrictions: item.restrictions || [],
    })),
  };
}

function resolveAvailableActions(record, scheme, role) {
  if (!record || !scheme) return [];
  const currentNode = (scheme.reviewFlow || []).find((item) => item.key === record.currentNode) || null;
  const canHandleNode = getNodeAllowedRoles(currentNode).includes(role);

  if (role === 'TEACHER' && ['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(record.status)) {
    return [{ key: 'SUBMIT', label: '提交评审', tone: 'primary' }];
  }
  if (role === 'TEACHER' && record.status === 'REJECTED') {
    return [{ key: 'APPEAL', label: '提交申诉', tone: 'default' }];
  }
  if (role === 'SCHOOL_REVIEW' && record.status === 'APPEAL_PENDING') {
    return [{ key: 'RESOLVE_APPEAL', label: '处理申诉', tone: 'primary' }];
  }
  if (!canHandleNode || record.status !== 'IN_REVIEW') {
    return [];
  }
  if (currentNode?.key === 'school_review') {
    return [
      { key: 'REQUEST_SUPPLEMENT', label: '退回补证', tone: 'default' },
      { key: 'APPROVE', label: '通过评审', tone: 'primary' },
      { key: 'REJECT', label: '评审未通过', tone: 'danger' },
    ];
  }
  return [
    { key: 'REQUEST_SUPPLEMENT', label: '退回补证', tone: 'default' },
    { key: 'ADVANCE', label: '流转下一节点', tone: 'primary' },
  ];
}

function deriveRecordInsights(record, scheme) {
  if (!record || !scheme) {
    return {
      readiness: 0,
      averageCoverage: 0,
      pendingAiDrafts: 0,
      weakEvidenceCount: 0,
      thresholdRiskCount: 0,
      checklist: [],
      thresholdRiskItems: [],
    };
  }

  const pendingAiDrafts = (record.aiDrafts || []).filter((item) => item.reviewStatus === 'PENDING_HUMAN').length;
  const averageCoverage = record.evidenceItems.length
    ? Math.round(record.evidenceItems.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / record.evidenceItems.length)
    : 0;
  const weakEvidenceCount = (record.evidenceItems || []).filter((item) => Number(item.coverage) < 80).length;
  const thresholdRiskItems = (scheme.itemRubrics || []).filter((rubric) => {
    const evidenceCount = (record.evidenceItems || []).filter((item) => item.relatedItemName === rubric.itemName).length;
    return evidenceCount < parseMinimumEvidenceCount(rubric.evidenceThreshold);
  });
  const checklist = [];
  if (pendingAiDrafts) checklist.push(`仍有 ${pendingAiDrafts} 份 AI 建议稿待人工确认。`);
  if (thresholdRiskItems.length) checklist.push(`仍有 ${thresholdRiskItems.length} 个评价项未达到最低证据门槛。`);
  if (weakEvidenceCount) checklist.push(`当前有 ${weakEvidenceCount} 条证据覆盖度低于 80%，建议继续补强。`);
  if (record.status === 'SUPPLEMENT_REQUIRED') checklist.push('实例当前处于待补证状态，补充后需再次提交。');
  if (record.status === 'APPEAL_PENDING') checklist.push('存在待处理申诉，需校级评审组形成复核意见。');
  if (!checklist.length) checklist.push('当前记录满足进入下一步评议的基础条件。');

  const readiness = Math.max(
    0,
    Math.min(
      100,
      Math.round((averageCoverage * 0.55) + ((scheme.itemRubrics.length - thresholdRiskItems.length) / Math.max(scheme.itemRubrics.length, 1) * 30) + (((record.aiDrafts.length - pendingAiDrafts) / Math.max(record.aiDrafts.length, 1)) * 15)),
    ),
  );

  return {
    readiness,
    averageCoverage,
    pendingAiDrafts,
    weakEvidenceCount,
    thresholdRiskCount: thresholdRiskItems.length,
    checklist,
    thresholdRiskItems,
  };
}

function buildEvidencePackages(record, scheme) {
  if (!record || !scheme) return [];
  return (scheme.itemRubrics || []).map((rubric) => {
    const evidenceItems = (record.evidenceItems || []).filter((item) => item.relatedItemName === rubric.itemName);
    const aiDraft = (record.aiDrafts || []).find((item) => item.itemName === rubric.itemName) || null;
    const averageCoverage = evidenceItems.length
      ? Math.round(evidenceItems.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / evidenceItems.length)
      : 0;
    const minimumCount = parseMinimumEvidenceCount(rubric.evidenceThreshold);
    return {
      key: rubric.key || rubric.itemName,
      itemName: rubric.itemName,
      evidenceThreshold: rubric.evidenceThreshold,
      evaluatorRoles: rubric.evaluatorRoles || [],
      aiAssistAllowed: rubric.aiAssistAllowed,
      evidenceItems,
      aiDraft,
      averageCoverage,
      missingCount: Math.max(0, minimumCount - evidenceItems.length),
      thresholdMet: evidenceItems.length >= minimumCount,
    };
  });
}

function getDefaultExpandedEvidencePackageKeys(packages) {
  const riskKeys = (packages || [])
    .filter((item) => (
      !item.thresholdMet
      || item.averageCoverage < 80
      || item.evidenceItems.some((evidence) => Number(evidence.coverage) < 80)
      || item.aiDraft?.reviewStatus === 'PENDING_HUMAN'
    ))
    .map((item) => item.key);

  if (riskKeys.length) return riskKeys;
  return packages?.[0]?.key ? [packages[0].key] : [];
}

function matchesKeyword(record, scheme, keyword) {
  if (!keyword) return true;
  const searchText = [
    record.teacherName,
    record.departmentName,
    record.roleName,
    record.applicationNote,
    record.scenarioLabel,
    scheme?.name,
    getTeacherEvaluationStatusLabel(record.status),
  ].join(' ').toLowerCase();
  return searchText.includes(keyword.toLowerCase());
}

function matchesScope(record, scheme, activeRole, scope) {
  if (scope === 'ALL') return true;
  const availableActions = resolveAvailableActions(record, scheme, activeRole);
  if (scope === 'TODO') return availableActions.length > 0;
  if (scope === 'DONE') return (record.reviewOpinions || []).some((item) => item.actorRole === activeRole);
  return true;
}

function isClosedStatus(status) {
  return ['APPROVED', 'REJECTED', 'APPEAL_RESOLVED'].includes(status);
}

function sortTeacherEvaluationRecords(records = []) {
  return [...records].sort((left, right) => {
    const leftPeriod = String(left.periodSortKey || '');
    const rightPeriod = String(right.periodSortKey || '');
    if (leftPeriod !== rightPeriod) return rightPeriod.localeCompare(leftPeriod);
    return String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || ''));
  });
}

function groupRecordsByTeacher(records = []) {
  const grouped = new Map();
  sortTeacherEvaluationRecords(records).forEach((record) => {
    const key = record.teacherId || record.teacherName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        teacherId: record.teacherId,
        teacherName: record.teacherName,
        departmentName: record.departmentName,
        roleName: record.roleName,
        records: [],
      });
    }
    grouped.get(key).records.push(record);
  });
  return Array.from(grouped.values()).map((group) => ({
    ...group,
    latestPeriodLabel: group.records[0]?.periodLabel || '-',
    recordCount: group.records.length,
    inReviewCount: group.records.filter((item) => item.status === 'IN_REVIEW').length,
    supplementRequiredCount: group.records.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length,
    approvedCount: group.records.filter((item) => item.status === 'APPROVED').length,
    periodCount: new Set(group.records.map((item) => item.periodLabel || '-')).size,
  }));
}

function groupRecordsByPeriod(records = []) {
  const grouped = new Map();
  sortTeacherEvaluationRecords(records).forEach((record) => {
    const key = record.periodLabel || '未标记周期';
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        periodLabel: key,
        periodSortKey: record.periodSortKey || '',
        records: [],
      });
    }
    grouped.get(key).records.push(record);
  });
  return Array.from(grouped.values())
    .sort((left, right) => String(right.periodSortKey || '').localeCompare(String(left.periodSortKey || '')))
    .map((group) => ({
      ...group,
      recordCount: group.records.length,
      teacherCount: new Set(group.records.map((item) => item.teacherId || item.teacherName)).size,
      inReviewCount: group.records.filter((item) => item.status === 'IN_REVIEW').length,
      supplementRequiredCount: group.records.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length,
      approvedCount: group.records.filter((item) => item.status === 'APPROVED').length,
    }));
}

export default function TeacherEvaluationModule() {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [capabilityModels, setCapabilityModels] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSchemeId, setActiveSchemeId] = useState(undefined);
  const [selectedRecordId, setSelectedRecordId] = useState(undefined);
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [evidencePackDrawerOpen, setEvidencePackDrawerOpen] = useState(false);
  const [schemeDrawerOpen, setSchemeDrawerOpen] = useState(false);
  const [recordCreateDrawerOpen, setRecordCreateDrawerOpen] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState(undefined);
  const [activeRole, setActiveRole] = useState('GROUP_LEADER');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recordScope, setRecordScope] = useState('ALL');
  const [workbenchView, setWorkbenchView] = useState('TEACHER');
  const [workbenchSchemeScope, setWorkbenchSchemeScope] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeEvidencePackKey, setActiveEvidencePackKey] = useState(undefined);
  const [expandedEvidencePackageKeys, setExpandedEvidencePackageKeys] = useState([]);
  const [opinionText, setOpinionText] = useState('');
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [schemeForm] = Form.useForm();
  const [recordForm] = Form.useForm();
  const [evidenceForm] = Form.useForm();
  const watchedSchemeTargetRole = Form.useWatch('targetRole', schemeForm);
  const watchedCapabilityModelId = Form.useWatch('capabilityModelId', schemeForm);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await teacherEvaluationApi.seed();
      await capabilityModelApi.seed();
      const [nextSchemes, nextCapabilityModels, nextTeachers, nextRecords, nextAuditLogs] = await Promise.all([
        teacherEvaluationApi.listSchemes(),
        capabilityModelApi.listModels(),
        teacherEvaluationApi.listTeachers(),
        teacherEvaluationApi.listRecords(),
        teacherEvaluationApi.listAuditLogs(),
      ]);
      setSchemes(nextSchemes);
      setCapabilityModels(nextCapabilityModels);
      setTeachers(nextTeachers);
      setRecords(nextRecords);
      setAuditLogs(nextAuditLogs);
      setActiveSchemeId((current) => current || nextSchemes[0]?.id);
      setSelectedRecordId((current) => current || nextRecords[0]?.id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const eventName = teacherEvaluationApi.getStoreEventName?.();
    if (!eventName || typeof window === 'undefined') return undefined;
    const handler = () => {
      refreshData();
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [refreshData]);

  useEffect(() => {
    if (!selectedRecordId && records[0]?.id) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  const activeScheme = useMemo(
    () => schemes.find((item) => item.id === activeSchemeId) || schemes[0] || null,
    [activeSchemeId, schemes],
  );

  const activeCapabilityModel = useMemo(
    () => capabilityModels.find((item) => item.id === activeScheme?.capabilityModelId) || null,
    [activeScheme?.capabilityModelId, capabilityModels],
  );

  const schemeModelOptions = useMemo(
    () => filterCapabilityModelsByTargetRole(capabilityModels, watchedSchemeTargetRole || activeScheme?.targetRole),
    [activeScheme?.targetRole, capabilityModels, watchedSchemeTargetRole],
  );

  const selectedSchemeFormModel = useMemo(
    () => capabilityModels.find((item) => item.id === watchedCapabilityModelId) || null,
    [capabilityModels, watchedCapabilityModelId],
  );

  const dimensionNameOptions = useMemo(
    () => (selectedSchemeFormModel?.dimensions || []).map((dimension) => ({
      label: dimension.name,
      value: dimension.name,
    })),
    [selectedSchemeFormModel],
  );

  const itemNameOptions = useMemo(
    () => (selectedSchemeFormModel?.dimensions || []).map((dimension) => ({
      label: dimension.name,
      options: (dimension.items || []).map((item) => ({
        label: item.name,
        value: item.name,
      })),
    })),
    [selectedSchemeFormModel],
  );

  const periodOptions = useMemo(() => {
    const periodMap = new Map();
    records.forEach((record) => {
      const key = record.periodLabel || '未标记周期';
      if (!periodMap.has(key)) {
        periodMap.set(key, record.periodSortKey || '');
      }
    });
    return [
      { label: '全部周期', value: 'ALL' },
      ...Array.from(periodMap.entries())
        .sort((left, right) => String(right[1] || '').localeCompare(String(left[1] || '')))
        .map(([label]) => ({
          label,
          value: label,
        })),
    ];
  }, [records]);

  const filteredRecords = useMemo(() => (
    records.filter((record) => {
      const scheme = schemes.find((item) => item.id === record.schemeId);
      return (
        (workbenchSchemeScope === 'ALL' || !activeSchemeId || record.schemeId === activeSchemeId)
        && (periodFilter === 'ALL' || (record.periodLabel || '未标记周期') === periodFilter)
        && (statusFilter === 'ALL' || record.status === statusFilter)
        && matchesKeyword(record, scheme, searchKeyword.trim())
        && matchesScope(record, scheme, activeRole, recordScope)
      );
    })
  ), [activeRole, activeSchemeId, periodFilter, recordScope, records, schemes, searchKeyword, statusFilter, workbenchSchemeScope]);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedRecordId) || filteredRecords[0] || null,
    [filteredRecords, records, selectedRecordId],
  );

  const selectedScheme = useMemo(
    () => schemes.find((item) => item.id === selectedRecord?.schemeId) || activeScheme,
    [activeScheme, schemes, selectedRecord?.schemeId],
  );

  const selectedInsights = useMemo(
    () => deriveRecordInsights(selectedRecord, selectedScheme),
    [selectedRecord, selectedScheme],
  );

  const selectedEvidencePackages = useMemo(
    () => buildEvidencePackages(selectedRecord, selectedScheme),
    [selectedRecord, selectedScheme],
  );

  useEffect(() => {
    setExpandedEvidencePackageKeys(getDefaultExpandedEvidencePackageKeys(selectedEvidencePackages));
  }, [selectedEvidencePackages, selectedRecord?.id, selectedScheme?.id]);

  const activeEvidencePackage = useMemo(
    () => selectedEvidencePackages.find((item) => item.key === activeEvidencePackKey || item.itemName === activeEvidencePackKey) || selectedEvidencePackages[0] || null,
    [activeEvidencePackKey, selectedEvidencePackages],
  );

  const availableActions = useMemo(
    () => resolveAvailableActions(selectedRecord, selectedScheme, activeRole),
    [activeRole, selectedRecord, selectedScheme],
  );

  const teacherWorkbenchGroups = useMemo(
    () => groupRecordsByTeacher(filteredRecords),
    [filteredRecords],
  );

  const periodWorkbenchGroups = useMemo(
    () => groupRecordsByPeriod(filteredRecords),
    [filteredRecords],
  );

  const summaryStats = useMemo(() => ({
    totalRecords: records.length,
    inReview: records.filter((item) => item.status === 'IN_REVIEW').length,
    supplementRequired: records.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length,
    pendingAiDrafts: countPendingAiDrafts(records),
    appeals: records.filter((item) => item.status === 'APPEAL_PENDING').length,
    todoForRole: records.filter((record) => {
      const scheme = schemes.find((item) => item.id === record.schemeId);
      return resolveAvailableActions(record, scheme, activeRole).length > 0;
    }).length,
  }), [activeRole, records, schemes]);

  const recommendedTeacherId = useMemo(() => {
    if (!activeScheme || !teachers.length) return undefined;
    const matchedTeachers = teachers.filter((item) => item.targetLevel === activeScheme.targetLevel);
    const teacherPool = matchedTeachers.length ? matchedTeachers : teachers;
    const scoredPool = [...teacherPool].sort((left, right) => {
      const leftOpen = records.filter((item) => item.schemeId === activeScheme.id && item.teacherId === left.teacherId && !isClosedStatus(item.status)).length;
      const rightOpen = records.filter((item) => item.schemeId === activeScheme.id && item.teacherId === right.teacherId && !isClosedStatus(item.status)).length;
      if (leftOpen !== rightOpen) return leftOpen - rightOpen;
      const leftTotal = records.filter((item) => item.schemeId === activeScheme.id && item.teacherId === left.teacherId).length;
      const rightTotal = records.filter((item) => item.schemeId === activeScheme.id && item.teacherId === right.teacherId).length;
      if (leftTotal !== rightTotal) return leftTotal - rightTotal;
      return left.name.localeCompare(right.name, 'zh-CN');
    });
    return scoredPool[0]?.teacherId;
  }, [activeScheme, records, teachers]);

  const rubricColumns = [
    {
      title: '评价项',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 220,
    },
    {
      title: '证据门槛',
      dataIndex: 'evidenceThreshold',
      key: 'evidenceThreshold',
    },
    {
      title: '评价主体',
      dataIndex: 'evaluatorRoles',
      key: 'evaluatorRoles',
      width: 220,
      render: (value) => (value || []).map((item) => <Tag key={item}>{item}</Tag>),
    },
    {
      title: 'AI 预填',
      dataIndex: 'aiAssistAllowed',
      key: 'aiAssistAllowed',
      width: 120,
      render: (value) => <Tag color={value ? 'processing' : 'default'}>{value ? '允许' : '不允许'}</Tag>,
    },
  ];

  const recordColumns = [
    {
      title: '教师',
      key: 'teacher',
      width: 220,
      render: (_, record) => (
        <div className="teacher-evaluation-record-cell">
          <strong>{record.teacherName}</strong>
          <span>{record.departmentName}</span>
          {record.applicationNote ? <span className="teacher-evaluation-muted">{record.applicationNote}</span> : null}
        </div>
      ),
    },
    {
      title: '周期 / 方案',
      key: 'period',
      width: 220,
      render: (_, record) => (
        <div className="teacher-evaluation-record-cell">
          <strong>{record.periodLabel || '-'}</strong>
          <span>{record.schemeNameSnapshot || '-'}</span>
        </div>
      ),
    },
    {
      title: '当前节点',
      key: 'currentNode',
      width: 180,
      render: (_, record) => {
        const scheme = schemes.find((item) => item.id === record.schemeId);
        const node = scheme?.reviewFlow?.find((item) => item.key === record.currentNode);
        return (
          <div className="teacher-evaluation-record-cell">
            <strong>{node?.name || record.currentNode}</strong>
            <span>{node ? getNodeAllowedRoles(node).map((item) => getTeacherEvaluationRoleLabel(item)).join(' / ') : '-'}</span>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <Tag color={statusColor(value)}>{getTeacherEvaluationStatusLabel(value)}</Tag>,
    },
    {
      title: '评审包',
      key: 'risk',
      width: 180,
      render: (_, record) => {
        const scheme = schemes.find((item) => item.id === record.schemeId);
        const insight = deriveRecordInsights(record, scheme);
        return (
          <div className="teacher-evaluation-record-cell">
            <strong>{insight.readiness}% 就绪</strong>
            <span>{insight.thresholdRiskCount ? `${insight.thresholdRiskCount} 项门槛待补` : '门槛已覆盖'}</span>
          </div>
        );
      },
    },
    {
      title: 'AI 草稿',
      key: 'aiDrafts',
      width: 140,
      render: (_, record) => {
        const total = (record.aiDrafts || []).length;
        const confirmed = (record.aiDrafts || []).filter((item) => item.reviewStatus !== 'PENDING_HUMAN').length;
        return <Progress percent={total ? Math.round((confirmed / total) * 100) : 0} size="small" format={() => `${confirmed}/${total}`} />;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (value) => String(value || '-').slice(0, 16),
    },
  ];

  const auditColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (value) => String(value || '-').slice(0, 16),
    },
    {
      title: '角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 140,
      render: (value) => getTeacherEvaluationRoleLabel(value),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 140,
    },
    {
      title: '动作',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 180,
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
    },
  ];

  function openCreateRecordDrawer() {
    recordForm.setFieldsValue({
      teacherId: recommendedTeacherId,
      scenarioLabel: activeScheme?.schemeType || '正式评价',
      applicationNote: '',
    });
    setRecordCreateDrawerOpen(true);
  }

  function openRecordDetail(recordId) {
    setSelectedRecordId(recordId);
    setRecordDrawerOpen(true);
  }

  function renderWorkbenchGroups() {
    const groups = workbenchView === 'TEACHER' ? teacherWorkbenchGroups : periodWorkbenchGroups;
    if (!groups.length) {
      return <Empty description="当前筛选条件下暂无评价实例" />;
    }

    return (
      <Collapse
        ghost
        className="teacher-evaluation-workbench-groups"
        defaultActiveKey={groups.slice(0, 2).map((item) => item.key)}
        items={groups.map((group) => ({
          key: group.key,
          label: (
            <div className="teacher-evaluation-workbench-group-head">
              <div className="teacher-evaluation-workbench-group-main">
                <strong>{workbenchView === 'TEACHER' ? group.teacherName : group.periodLabel}</strong>
                <span>
                  {workbenchView === 'TEACHER'
                    ? `${group.departmentName} · ${group.roleName}`
                    : `${group.teacherCount} 位教师 · ${group.recordCount} 条实例`}
                </span>
              </div>
              <div className="teacher-evaluation-workbench-group-metrics">
                {workbenchView === 'TEACHER' ? <Tag>{group.periodCount} 个周期</Tag> : null}
                {workbenchView === 'TEACHER' ? <Tag color="blue">{group.latestPeriodLabel}</Tag> : null}
                <Tag color="processing">评审中 {group.inReviewCount}</Tag>
                <Tag color="warning">待补证 {group.supplementRequiredCount}</Tag>
                <Tag color="success">已通过 {group.approvedCount}</Tag>
              </div>
            </div>
          ),
          children: (
            <Table
              rowKey="id"
              columns={recordColumns}
              dataSource={group.records}
              pagination={false}
              scroll={{ x: 1260 }}
              rowClassName={(record) => (record.id === selectedRecord?.id ? 'teacher-evaluation-record-row-active' : '')}
              onRow={(record) => ({
                onClick: () => openRecordDetail(record.id),
              })}
            />
          ),
        }))}
      />
    );
  }

  function openSchemeDrawer(mode) {
    if (mode === 'edit' && activeScheme) {
      setEditingSchemeId(activeScheme.id);
      schemeForm.setFieldsValue(createSchemeFormValues(activeScheme));
    } else {
      setEditingSchemeId(undefined);
      schemeForm.setFieldsValue(createSchemeFormValues(activeScheme ? {
        ...activeScheme,
        id: undefined,
        name: '',
      } : null));
    }
    setSchemeDrawerOpen(true);
  }

  function openEvidenceDrawer() {
    if (!selectedRecord || !selectedScheme) return;
    evidenceForm.setFieldsValue({
      title: '',
      relatedItemName: selectedScheme.itemRubrics?.[0]?.itemName,
      sourceLabel: '人工补证',
      summary: '',
      resourcePath: `教师评价 / ${selectedRecord.teacherName} / 补充材料`,
      coverage: 80,
    });
    setEvidenceDrawerOpen(true);
  }

  function openEvidencePackDrawer(packageKey = '') {
    setActiveEvidencePackKey(packageKey || selectedEvidencePackages[0]?.key);
    setEvidencePackDrawerOpen(true);
  }

  async function handleCreateRecord(values) {
    if (!activeScheme) return;
    setSubmitting(true);
    try {
      const teacherProfile = teachers.find((item) => item.teacherId === values.teacherId);
      const created = await teacherEvaluationApi.createRecord(activeScheme.id, {
        teacherProfile,
        scenarioLabel: values.scenarioLabel,
        applicationNote: values.applicationNote,
        requestedBy: getTeacherEvaluationRoleLabel(activeRole),
      });
      message.success('已新建评价实例');
      setSelectedRecordId(created.id);
      setRecordCreateDrawerOpen(false);
      recordForm.resetFields();
      await refreshData();
    } catch (error) {
      message.error(error?.message || '创建评价实例失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveScheme(values) {
    setSubmitting(true);
    try {
      const selectedModel = capabilityModels.find((item) => item.id === values.capabilityModelId) || null;
      const referencedDimensionKeys = selectedModel
        ? (values.dimensionWeights || [])
          .map((item) => selectedModel.dimensions?.find((dimension) => dimension.name === item.name)?.id)
          .filter(Boolean)
        : [];
      const referencedItemKeys = selectedModel
        ? (values.itemRubrics || [])
          .map((item) => selectedModel.dimensions?.flatMap((dimension) => dimension.items || [])
            .find((modelItem) => modelItem.name === item.itemName)?.id)
          .filter(Boolean)
        : [];
      const payload = {
        id: editingSchemeId,
        name: values.name,
        schemeType: values.schemeType,
        targetRole: values.targetRole,
        targetLevel: values.targetLevel,
        capabilityModelId: values.capabilityModelId,
        semester: values.semester,
        summary: values.summary,
        aiBoundary: values.aiBoundary,
        status: 'ACTIVE',
        referencedDimensionKeys,
        referencedItemKeys,
        dimensionWeights: (values.dimensionWeights || [])
          .filter((item) => item?.name)
          .map((item, index) => ({
            key: `dimension_${index + 1}`,
            name: item.name,
            weight: Number(item.weight) || 0,
          })),
        itemRubrics: (values.itemRubrics || [])
          .filter((item) => item?.itemName)
          .map((item, index) => ({
            key: `rubric_${index + 1}`,
            itemName: item.itemName,
            evidenceThreshold: item.evidenceThreshold,
            evaluatorRoles: item.evaluatorRoles || [],
            aiAssistAllowed: Boolean(item.aiAssistAllowed),
          })),
        reviewFlow: (values.reviewFlow || [])
          .filter((item) => item?.name && item?.owner)
          .map((item, index) => ({
            key: index === 0 ? 'submit' : index === (values.reviewFlow || []).length - 1 ? 'school_review' : `flow_${index + 1}`,
            name: item.name,
            owner: item.owner,
            output: item.output,
          })),
        aiAssistants: (values.aiAssistants || [])
          .filter((item) => item?.name)
          .map((item, index) => ({
            key: `assistant_${index + 1}`,
            name: item.name,
            roleScope: item.roleScope,
            responsibilities: item.responsibilities || [],
            restrictions: item.restrictions || [],
          })),
      };
      const saved = await teacherEvaluationApi.saveScheme(payload);
      message.success(editingSchemeId ? '评价方案已更新' : '评价方案已创建');
      setSchemeDrawerOpen(false);
      setActiveSchemeId(saved.id);
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWorkflowAction(actionKey) {
    if (!selectedRecord || !selectedScheme) return;
    setSubmitting(true);
    try {
      if (actionKey === 'SUBMIT') {
        await teacherEvaluationApi.submitRecord(selectedRecord.id, {
          operatorName: selectedRecord.teacherName,
          operatorRole: activeRole,
        });
        message.success('已提交评审');
      } else if (actionKey === 'APPEAL') {
        await teacherEvaluationApi.submitAppeal(selectedRecord.id, {
          actorName: selectedRecord.teacherName,
          actorRole: activeRole,
          reason: appealText || '对当前评审结论提出申诉，请求补充复核。',
        });
        setAppealText('');
        message.success('已提交申诉');
      } else {
        await teacherEvaluationApi.reviewRecord(selectedRecord.id, {
          actorRole: activeRole,
          actorName: getTeacherEvaluationRoleLabel(activeRole),
          action: actionKey,
          opinion: opinionText,
        });
        setOpinionText('');
        message.success('处理完成');
      }
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAiDraftAction(draftId, action) {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await teacherEvaluationApi.updateAiDraft(selectedRecord.id, draftId, {
        actorRole: activeRole,
        actorName: getTeacherEvaluationRoleLabel(activeRole),
        action,
        reviewNote: opinionText || (action === 'CONFIRM' ? '人工确认采纳。' : action === 'REVISE' ? '人工修订后采纳。' : '人工驳回当前建议稿。'),
      });
      if (action !== 'REGENERATE') {
        setOpinionText('');
      }
      message.success(action === 'REGENERATE' ? '已重新生成建议稿' : 'AI 建议稿已更新');
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAppendEvidence(values) {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      await teacherEvaluationApi.appendEvidence(selectedRecord.id, {
        ...values,
        actorRole: activeRole,
        actorName: getTeacherEvaluationRoleLabel(activeRole),
      });
      message.success('已补充证据');
      setEvidenceDrawerOpen(false);
      evidenceForm.resetFields();
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  }

  function renderSchemeEditorDrawer() {
    return (
      <Drawer
        title={editingSchemeId ? '编辑评价方案' : '新建评价方案'}
        width={840}
        open={schemeDrawerOpen}
        onClose={() => setSchemeDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={schemeForm} onFinish={handleSaveScheme}>
          <div className="teacher-evaluation-form-grid">
            <Form.Item label="方案名称" name="name" rules={[{ required: true, message: '请输入方案名称' }]}>
              <Input placeholder="例如：双师型教师认定" />
            </Form.Item>
            <Form.Item label="评价类型" name="schemeType" rules={[{ required: true, message: '请选择评价类型' }]}>
              <Select options={SCHEME_TYPE_OPTIONS} placeholder="选择评价类型" />
            </Form.Item>
            <Form.Item label="目标角色" name="targetRole" rules={[{ required: true, message: '请选择目标角色' }]}>
              <Select
                options={TARGET_ROLE_OPTIONS}
                placeholder="选择目标角色"
                onChange={(value) => {
                  const targetLevelOptions = TARGET_LEVEL_OPTIONS[value] || [];
                  const currentTargetLevel = schemeForm.getFieldValue('targetLevel');
                  if (!targetLevelOptions.some((item) => item.value === currentTargetLevel)) {
                    schemeForm.setFieldValue('targetLevel', targetLevelOptions[0]?.value);
                  }
                  const currentModelId = schemeForm.getFieldValue('capabilityModelId');
                  if (currentModelId && !filterCapabilityModelsByTargetRole(capabilityModels, value).some((item) => item.id === currentModelId)) {
                    schemeForm.setFieldsValue({
                      capabilityModelId: undefined,
                      dimensionWeights: [],
                      itemRubrics: [],
                    });
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="目标层级" name="targetLevel" rules={[{ required: true, message: '请选择目标层级' }]}>
              <Select
                options={TARGET_LEVEL_OPTIONS[watchedSchemeTargetRole || '职教教师'] || []}
                placeholder="选择目标层级"
              />
            </Form.Item>
            <Form.Item label="关联能力模型" name="capabilityModelId" rules={[{ required: true, message: '请选择能力模型' }]}>
              <Select
                placeholder="选择能力模型"
                options={schemeModelOptions.map((model) => ({
                  label: `${model.name}${model.status !== 'PUBLISHED' ? `（${model.status === 'DRAFT' ? '草稿' : '停用'}）` : ''}`,
                  value: model.id,
                }))}
                onChange={(modelId) => {
                  const selectedModel = capabilityModels.find((item) => item.id === modelId);
                  if (!selectedModel) return;
                  const derived = buildSchemeDraftFromModel(selectedModel);
                  schemeForm.setFieldsValue({
                    dimensionWeights: derived.dimensionWeights,
                    itemRubrics: derived.itemRubrics,
                  });
                }}
              />
            </Form.Item>
            <Form.Item label="学期 / 周期" name="semester">
              <Input placeholder="例如：2026 秋季学期" />
            </Form.Item>
            <Form.Item label="AI 边界" name="aiBoundary">
              <Select options={AI_BOUNDARY_OPTIONS} placeholder="选择 AI 边界" />
            </Form.Item>
          </div>

          <Alert
            type="info"
            showIcon
            className="teacher-evaluation-inline-alert"
            message="选择能力模型后会同步默认维度权重和评价项"
            description="评价方案应基于能力模型派生。切换能力模型时，当前表单中的“维度权重”和“量规与证据门槛”会按所选模型重置为默认值。"
          />

          <Form.Item label="方案摘要" name="summary">
            <TextArea rows={3} placeholder="说明该方案服务于哪个场景、重点核验哪些能力。" />
          </Form.Item>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>维度权重（对应能力分类）</span>
              <Tag>{(schemeForm.getFieldValue('dimensionWeights') || []).length} 项</Tag>
            </div>
            <Form.List name="dimensionWeights">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-row">
                      <Form.Item {...field} name={[field.name, 'name']} label="维度名称" rules={[{ required: true, message: '请选择维度名称' }]}>
                        <Select
                          options={dimensionNameOptions}
                          placeholder={selectedSchemeFormModel ? '选择能力分类' : '请先关联能力模型'}
                          disabled={!selectedSchemeFormModel}
                        />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'weight']} label="权重">
                        <InputNumber min={0} max={100} precision={0} className="teacher-evaluation-full-width" />
                      </Form.Item>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ weight: 20 })} disabled={!selectedSchemeFormModel}>新增维度</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>量规与证据门槛（对应能力项目）</span>
            </div>
            <Form.List name="itemRubrics">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'itemName']} label="评价项" rules={[{ required: true, message: '请选择评价项' }]}>
                          <Select
                            options={itemNameOptions}
                            placeholder={selectedSchemeFormModel ? '选择能力项目' : '请先关联能力模型'}
                            disabled={!selectedSchemeFormModel}
                            onChange={(value) => {
                              const modelItem = selectedSchemeFormModel?.dimensions
                                ?.flatMap((dimension) => dimension.items || [])
                                .find((item) => item.name === value);
                              if (!modelItem) return;
                              const index = field.name;
                              const nextConfig = buildRubricConfigFromModelItem(modelItem);
                              schemeForm.setFields([
                                {
                                  name: ['itemRubrics', index, 'evidenceThreshold'],
                                  value: nextConfig.evidenceThreshold,
                                },
                                {
                                  name: ['itemRubrics', index, 'evaluatorRoles'],
                                  value: nextConfig.evaluatorRoles,
                                },
                                {
                                  name: ['itemRubrics', index, 'aiAssistAllowed'],
                                  value: nextConfig.aiAssistAllowed,
                                },
                              ]);
                            }}
                          />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'evaluatorRoles']} label="评价主体">
                          <Select mode="multiple" options={REVIEW_ROLE_LABEL_OPTIONS} placeholder="选择评价主体" />
                        </Form.Item>
                      </div>
                      <Form.Item noStyle shouldUpdate={(prev, current) => (
                        prev.itemRubrics?.[field.name]?.itemName !== current.itemRubrics?.[field.name]?.itemName
                      )}>
                        {() => {
                          const selectedItemName = schemeForm.getFieldValue(['itemRubrics', field.name, 'itemName']);
                          const modelItem = selectedSchemeFormModel?.dimensions
                            ?.flatMap((dimension) => dimension.items || [])
                            .find((item) => item.name === selectedItemName);
                          const thresholdOptions = buildRubricConfigFromModelItem(modelItem).evidenceThresholdOptions;
                          return (
                            <Form.Item {...field} name={[field.name, 'evidenceThreshold']} label="证据门槛">
                              <Select
                                options={thresholdOptions}
                                placeholder={modelItem ? '选择标准证据门槛' : '请先选择评价项'}
                                disabled={!modelItem}
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                      <div className="teacher-evaluation-dynamic-grid teacher-evaluation-rubric-footer">
                        <Form.Item {...field} name={[field.name, 'aiAssistAllowed']} label="允许 AI 预填">
                          <Select
                            options={[
                              { label: '允许', value: true },
                              { label: '不允许', value: false },
                            ]}
                          />
                        </Form.Item>
                        <div className="teacher-evaluation-dynamic-actions">
                          <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除评价项</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ aiAssistAllowed: true })} disabled={!selectedSchemeFormModel}>新增评价项</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>评议流程</span>
            </div>
            <Form.List name="reviewFlow">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'name']} label="节点名称" rules={[{ required: true, message: '请选择节点名称' }]}>
                          <Select
                            options={REVIEW_FLOW_NODE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
                            placeholder="选择标准节点"
                            onChange={(value) => {
                              const node = REVIEW_FLOW_NODE_OPTIONS.find((item) => item.value === value);
                              if (!node) return;
                              schemeForm.setFields([
                                { name: ['reviewFlow', field.name, 'owner'], value: node.owner },
                                { name: ['reviewFlow', field.name, 'output'], value: node.output },
                              ]);
                            }}
                          />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'owner']} label="责任角色" rules={[{ required: true, message: '请选择责任角色' }]}>
                          <Select options={TEACHER_EVALUATION_ROLE_OPTIONS} />
                        </Form.Item>
                      </div>
                      <Form.Item {...field} name={[field.name, 'output']} label="节点输出">
                        <Select options={FLOW_OUTPUT_OPTIONS} placeholder="选择节点输出" />
                      </Form.Item>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除节点</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ owner: 'GROUP_LEADER' })}>新增流程节点</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>AI 辅助角色</span>
            </div>
            <Form.List name="aiAssistants">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'name']} label="助手名称" rules={[{ required: true, message: '请选择助手名称' }]}>
                          <Select options={AI_ASSISTANT_NAME_OPTIONS} placeholder="选择 AI 助手" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'roleScope']} label="适用角色">
                          <Select options={AI_ROLE_SCOPE_OPTIONS} placeholder="选择适用角色" />
                        </Form.Item>
                      </div>
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'responsibilities']} label="职责清单">
                          <Select mode="multiple" options={AI_RESPONSIBILITY_OPTIONS} placeholder="选择职责清单" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'restrictions']} label="限制边界">
                          <Select mode="multiple" options={AI_RESTRICTION_OPTIONS} placeholder="选择限制边界" />
                        </Form.Item>
                      </div>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除助手</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ responsibilities: [], restrictions: [] })}>新增 AI 助手</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-footer">
            <Button onClick={() => setSchemeDrawerOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>保存方案</Button>
          </div>
        </Form>
      </Drawer>
    );
  }

  function renderCreateRecordDrawer() {
    return (
      <Drawer
        title="发起评价实例"
        width={520}
        open={recordCreateDrawerOpen}
        onClose={() => setRecordCreateDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={recordForm} onFinish={handleCreateRecord}>
          <Form.Item label="评价方案">
            <Input value={activeScheme?.name} disabled />
          </Form.Item>
          <Form.Item label="继承周期">
            <Input value={activeScheme?.semester || '-'} disabled />
          </Form.Item>
          <Form.Item label="教师" name="teacherId" rules={[{ required: true, message: '请选择教师' }]}>
            <Select
              options={teachers.map((item) => ({
                label: `${item.name} · ${item.departmentName}`,
                value: item.teacherId,
              }))}
              placeholder="选择教师"
            />
          </Form.Item>
          <Form.Item label="用途标签" name="scenarioLabel">
            <Input placeholder="例如：双师型认定 / 年度考核 / 骨干遴选" />
          </Form.Item>
          <Form.Item label="发起说明" name="applicationNote">
            <TextArea rows={4} placeholder="说明本次评价的发起背景、需要重点关注的证据项或补证要求。" />
          </Form.Item>
          <div className="teacher-evaluation-form-footer">
            <Button onClick={() => setRecordCreateDrawerOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>创建实例</Button>
          </div>
        </Form>
      </Drawer>
    );
  }

  function renderEvidenceDrawer() {
    return (
      <Drawer
        title="补充证据"
        width={520}
        open={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={evidenceForm} onFinish={handleAppendEvidence}>
          <Form.Item label="证据标题" name="title" rules={[{ required: true, message: '请输入证据标题' }]}>
            <Input placeholder="例如：企业项目融入补充材料" />
          </Form.Item>
          <Form.Item label="关联评价项" name="relatedItemName" rules={[{ required: true, message: '请选择关联评价项' }]}>
            <Select
              options={(selectedScheme?.itemRubrics || []).map((item) => ({
                label: item.itemName,
                value: item.itemName,
              }))}
            />
          </Form.Item>
          <Form.Item label="来源标签" name="sourceLabel">
            <Select
              options={[
                { label: '人工补证', value: '人工补证' },
                { label: '企业实践记录', value: '企业实践记录' },
                { label: '教研协同记录', value: '教研协同记录' },
                { label: '课堂观察记录', value: '课堂观察记录' },
              ]}
            />
          </Form.Item>
          <Form.Item label="证据摘要" name="summary">
            <TextArea rows={3} placeholder="简要说明补充证据包含的行为事实、结果或改进行动。" />
          </Form.Item>
          <div className="teacher-evaluation-form-grid">
            <Form.Item label="资源路径" name="resourcePath">
              <Input placeholder="教师评价 / 教师姓名 / 补充材料" />
            </Form.Item>
            <Form.Item label="覆盖度" name="coverage">
              <InputNumber min={0} max={100} precision={0} className="teacher-evaluation-full-width" />
            </Form.Item>
          </div>
          <div className="teacher-evaluation-form-footer">
            <Button onClick={() => setEvidenceDrawerOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<UploadOutlined />} loading={submitting}>写入补证</Button>
          </div>
        </Form>
      </Drawer>
    );
  }

  function renderReviewPackSummary(mode = 'panel') {
    if (!selectedRecord || !selectedScheme) return null;
    return (
      <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
        <div className="teacher-evaluation-card-head">
          <span>评审包摘要</span>
          <Space>
            <Tag color="blue">{selectedRecord.scenarioLabel || selectedScheme.schemeType}</Tag>
            <Button size="small" onClick={() => openEvidencePackDrawer()}>查看证据包</Button>
            {mode !== 'drawer' ? <Button size="small" icon={<UploadOutlined />} onClick={openEvidenceDrawer}>补充证据</Button> : null}
          </Space>
        </div>
        <div className="teacher-evaluation-pack-grid">
          <div className="teacher-evaluation-pack-metric">
            <span>评审就绪度</span>
            <strong>{selectedInsights.readiness}%</strong>
          </div>
          <div className="teacher-evaluation-pack-metric">
            <span>平均证据覆盖</span>
            <strong>{selectedInsights.averageCoverage}%</strong>
          </div>
          <div className="teacher-evaluation-pack-metric">
            <span>待确认 AI 草稿</span>
            <strong>{selectedInsights.pendingAiDrafts}</strong>
          </div>
          <div className="teacher-evaluation-pack-metric">
            <span>门槛风险项</span>
            <strong>{selectedInsights.thresholdRiskCount}</strong>
          </div>
        </div>
        <div className="teacher-evaluation-pack-checklist">
          {selectedInsights.checklist.map((item) => (
            <div key={item} className="teacher-evaluation-pack-checkitem">{item}</div>
          ))}
        </div>
        {selectedInsights.thresholdRiskItems.length ? (
          <div className="teacher-evaluation-tag-row">
            {selectedInsights.thresholdRiskItems.map((item) => (
              <Tag key={item.key} color="warning">{item.itemName}</Tag>
            ))}
          </div>
        ) : null}
      </Card>
    );
  }

  function renderIntegratedEvidencePackages() {
    if (!selectedEvidencePackages.length) {
      return (
        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <div className="teacher-evaluation-card-head">
            <span>证据包与 AI 建议稿</span>
            <Button size="small" onClick={() => openEvidencePackDrawer()}>
              查看完整证据包
            </Button>
          </div>
          <Empty description="当前评价实例尚未形成可查看的证据包" />
        </Card>
      );
    }

    return (
      <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
        <div className="teacher-evaluation-card-head">
          <span>证据包与 AI 建议稿</span>
          <Space>
            <Tag>{selectedEvidencePackages.length} 个评价项</Tag>
            <Button size="small" onClick={() => openEvidencePackDrawer()}>
              查看完整证据包
            </Button>
          </Space>
        </div>
        <Collapse
          ghost
          className="teacher-evaluation-package-collapse"
          activeKey={expandedEvidencePackageKeys}
          onChange={(nextKeys) => setExpandedEvidencePackageKeys(Array.isArray(nextKeys) ? nextKeys : [nextKeys])}
          items={selectedEvidencePackages.map((item) => {
            const riskTags = [];
            if (!item.thresholdMet) riskTags.push({ label: `缺 ${item.missingCount} 条`, color: 'warning' });
            if (item.averageCoverage < 80) riskTags.push({ label: '覆盖偏低', color: 'gold' });
            if (item.aiDraft?.reviewStatus === 'PENDING_HUMAN') riskTags.push({ label: 'AI 待确认', color: 'processing' });
            if (!item.aiDraft && item.aiAssistAllowed) riskTags.push({ label: '未生成 AI 稿', color: 'default' });

            return {
              key: item.key,
              label: (
                <div className="teacher-evaluation-package-summary">
                  <div className="teacher-evaluation-package-summary-main">
                    <strong>{item.itemName}</strong>
                    <span>{item.evidenceThreshold}</span>
                  </div>
                  <div className="teacher-evaluation-package-summary-metrics">
                    <Tag color={item.thresholdMet ? 'success' : 'warning'}>
                      {item.thresholdMet ? '门槛已满足' : `缺 ${item.missingCount} 条`}
                    </Tag>
                    <Tag>{item.evidenceItems.length} 条证据</Tag>
                    <Tag>{item.averageCoverage}% 覆盖</Tag>
                    <Tag color={item.aiDraft ? aiDraftStatusColor(item.aiDraft.reviewStatus) : 'default'}>
                      {item.aiDraft ? getAiDraftStatusLabel(item.aiDraft.reviewStatus) : '未生成 AI 稿'}
                    </Tag>
                  </div>
                </div>
              ),
              children: (
                <div className="teacher-evaluation-package-body">
                  <div className="teacher-evaluation-package-topline">
                    <div className="teacher-evaluation-tag-row">
                      <Tag>{item.evaluatorRoles.join(' / ') || '未配置评价主体'}</Tag>
                      <Tag color={item.aiAssistAllowed ? 'processing' : 'default'}>
                        {item.aiAssistAllowed ? 'AI 可预填' : 'AI 不预填'}
                      </Tag>
                      {riskTags.map((risk) => (
                        <Tag key={risk.label} color={risk.color}>
                          {risk.label}
                        </Tag>
                      ))}
                    </div>
                    <Button size="small" type="link" onClick={() => openEvidencePackDrawer(item.key)}>
                      在包视图中展开
                    </Button>
                  </div>
                  <div className="teacher-evaluation-package-layout">
                    <div className="teacher-evaluation-package-column">
                      <div className="teacher-evaluation-package-column-head">
                        <span>提交证据</span>
                        <Tag>{item.evidenceItems.length} 条</Tag>
                      </div>
                      {item.evidenceItems.length ? (
                        <div className="teacher-evaluation-evidence-list">
                          {item.evidenceItems.map((evidence) => (
                            <div key={evidence.id} className="teacher-evaluation-evidence-item">
                              <div className="teacher-evaluation-evidence-head">
                                <strong>{evidence.title}</strong>
                                <Tag color="blue">{evidence.sourceLabel}</Tag>
                              </div>
                              <div className="teacher-evaluation-evidence-meta">
                                <span>{evidence.date}</span>
                                <span>{evidence.statusLabel}</span>
                                <span>{evidence.coverage}% 覆盖</span>
                              </div>
                              <p>{evidence.summary}</p>
                              <div className="teacher-evaluation-evidence-path">{evidence.resourcePath}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="teacher-evaluation-package-empty">
                          <strong>当前评价项暂无已归集证据</strong>
                          <span>请先补充满足门槛要求的证据，再进入后续评议。</span>
                        </div>
                      )}
                    </div>
                    <div className="teacher-evaluation-package-column">
                      <div className="teacher-evaluation-package-column-head">
                        <span>AI 建议稿</span>
                        <Tag color={item.aiAssistAllowed ? 'processing' : 'default'}>
                          {item.aiAssistAllowed ? '需人工确认' : '人工评议'}
                        </Tag>
                      </div>
                      {item.aiDraft ? (
                        <div className="teacher-evaluation-ai-draft-card teacher-evaluation-package-ai-card">
                          <div className="teacher-evaluation-ai-draft-head">
                            <strong>{item.aiDraft.itemName}</strong>
                            <Tag color={aiDraftStatusColor(item.aiDraft.reviewStatus)}>
                              {getAiDraftStatusLabel(item.aiDraft.reviewStatus)}
                            </Tag>
                          </div>
                          <p>{item.aiDraft.summary}</p>
                          <div className="teacher-evaluation-tag-row">
                            <Tag color="blue">置信度 {Math.round((item.aiDraft.confidence || 0) * 100)}%</Tag>
                            {(item.aiDraft.references || []).map((reference) => (
                              <Tag key={reference}>{reference}</Tag>
                            ))}
                          </div>
                          <ul className="teacher-evaluation-list">
                            {(item.aiDraft.suggestions || []).map((suggestion) => (
                              <li key={suggestion}>{suggestion}</li>
                            ))}
                          </ul>
                          {item.aiDraft.reviewNote ? (
                            <div className="teacher-evaluation-ai-review-note">
                              <strong>人工备注</strong>
                              <span>{item.aiDraft.reviewNote}</span>
                            </div>
                          ) : null}
                          <div className="teacher-evaluation-action-row">
                            <Button size="small" onClick={() => handleAiDraftAction(item.aiDraft.id, 'CONFIRM')} disabled={submitting}>
                              采纳
                            </Button>
                            <Button size="small" onClick={() => handleAiDraftAction(item.aiDraft.id, 'REVISE')} disabled={submitting}>
                              修订后采纳
                            </Button>
                            <Button size="small" danger onClick={() => handleAiDraftAction(item.aiDraft.id, 'REJECT')} disabled={submitting}>
                              驳回
                            </Button>
                            <Button size="small" type="link" onClick={() => handleAiDraftAction(item.aiDraft.id, 'REGENERATE')} disabled={submitting}>
                              重新生成
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="teacher-evaluation-package-empty">
                          <strong>{item.aiAssistAllowed ? '当前尚未生成 AI 建议稿' : '该评价项不启用 AI 预填'}</strong>
                          <span>
                            {item.aiAssistAllowed
                              ? '可先在完整证据包中核对材料，再由系统补齐 AI 建议稿。'
                              : '该评价项需由人工直接评议，不生成 AI 建议内容。'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ),
            };
          })}
        />
      </Card>
    );
  }

  function renderWorkflowSection(mode = 'panel') {
    if (!selectedRecord || !selectedScheme) return null;

    return (
      <div className="teacher-evaluation-section-stack">
        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <div className="teacher-evaluation-card-head">
            <span>当前动作</span>
            <Space>
              <Tag color="blue">{getTeacherEvaluationRoleLabel(activeRole)}</Tag>
              {mode !== 'drawer' ? (
                <Button size="small" type="link" onClick={() => setRecordDrawerOpen(true)}>侧栏展开</Button>
              ) : null}
            </Space>
          </div>
          {availableActions.length ? (
            <>
              {availableActions.some((item) => item.key !== 'SUBMIT' && item.key !== 'APPEAL') ? (
                <TextArea
                  rows={3}
                  value={opinionText}
                  onChange={(event) => setOpinionText(event.target.value)}
                  placeholder="填写本次节点意见，系统将连同 AI 草稿确认记录一起留痕。"
                />
              ) : null}
              {availableActions.some((item) => item.key === 'APPEAL') ? (
                <TextArea
                  rows={3}
                  value={appealText}
                  onChange={(event) => setAppealText(event.target.value)}
                  placeholder="填写申诉理由，例如：补充新的企业实践证据或说明评审争议点。"
                />
              ) : null}
              <div className="teacher-evaluation-action-row">
                {availableActions.map((action) => (
                  <Button
                    key={action.key}
                    type={toneToType(action.tone)}
                    danger={action.tone === 'danger'}
                    icon={action.key === 'SUBMIT' ? <SendOutlined /> : action.key === 'APPROVE' ? <CheckCircleOutlined /> : undefined}
                    loading={submitting}
                    onClick={() => handleWorkflowAction(action.key)}
                  >
                    {action.label}
                  </Button>
                ))}
                <Button icon={<UploadOutlined />} onClick={openEvidenceDrawer}>补充证据</Button>
              </div>
            </>
          ) : (
            <Alert
              type="info"
              showIcon
              message="当前角色没有可执行动作"
              description="可以切换角色模拟不同视角，或先确认 AI 建议稿、补充意见后再进入对应节点。"
            />
          )}
        </Card>

        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <div className="teacher-evaluation-card-head">
            <span>流程信息</span>
            <Tag>{selectedScheme.reviewFlow.length} 个节点</Tag>
          </div>
          <div className="teacher-evaluation-flow-list">
            {selectedScheme.reviewFlow.map((step, index) => {
              const opinions = (selectedRecord.reviewOpinions || []).filter((item) => item.nodeKey === step.key);
              const isCurrent = selectedRecord.currentNode === step.key && ['IN_REVIEW', 'APPEAL_PENDING'].includes(selectedRecord.status);
              const isCompleted = opinions.length > 0 || (!isCurrent && index < selectedScheme.reviewFlow.findIndex((item) => item.key === selectedRecord.currentNode));
              return (
                <div key={step.key} className="teacher-evaluation-flow-card">
                  <div className="teacher-evaluation-flow-index">{index + 1}</div>
                  <div className="teacher-evaluation-flow-body">
                    <div className="teacher-evaluation-card-head">
                      <strong>{step.name}</strong>
                      <Tag color={isCurrent ? 'processing' : isCompleted ? 'success' : 'default'}>
                        {isCurrent ? '当前节点' : isCompleted ? '已流转' : '待处理'}
                      </Tag>
                    </div>
                    <span>责任角色：{getNodeAllowedRoles(step).map((item) => getTeacherEvaluationRoleLabel(item)).join(' / ')}</span>
                    <p>{step.output}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <div className="teacher-evaluation-card-head">
            <span>流程与意见历史</span>
            <Tag><AuditOutlined /> {selectedRecord.reviewOpinions.length} 条意见</Tag>
          </div>
          <Timeline items={buildRecordTimeline(selectedRecord, selectedScheme)} />
        </Card>
      </div>
    );
  }

  function renderRecordDetail(mode = 'panel') {
    if (!selectedRecord || !selectedScheme) {
      return (
        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <Empty description="请选择评价实例" />
        </Card>
      );
    }

    const bodyClassName = mode === 'drawer'
      ? 'teacher-evaluation-drawer-body'
      : 'teacher-evaluation-detail-body';

    return (
      <div className={bodyClassName}>
        <div className="teacher-evaluation-drawer-hero">
          <div className="teacher-evaluation-drawer-kicker">{selectedRecord.schoolName} · {selectedRecord.departmentName}</div>
          <h3>{selectedRecord.teacherName} / {selectedRecord.roleName}</h3>
          <p>{selectedScheme.summary}</p>
          <div className="teacher-evaluation-meta-row">
            <Tag color={statusColor(selectedRecord.status)}>{getTeacherEvaluationStatusLabel(selectedRecord.status)}</Tag>
            <Tag color="blue">{selectedRecord.periodLabel || selectedScheme.semester}</Tag>
            <Tag>{selectedRecord.targetLevel}</Tag>
            <Tag>{selectedRecord.schemeNameSnapshot || selectedScheme.name}</Tag>
            <Tag>{selectedRecord.evidenceItems.length} 条证据</Tag>
            <Tag>{selectedRecord.aiDrafts.length} 份 AI 建议稿</Tag>
            {selectedRecord.applicationNote ? <Tag color="cyan">{selectedRecord.applicationNote}</Tag> : null}
          </div>
        </div>

        <Tabs
          className="teacher-evaluation-detail-tabs"
          defaultActiveKey="review"
          items={[
            {
              key: 'review',
              label: '评审内容',
              children: (
                <div className="teacher-evaluation-section-stack">
                  {renderReviewPackSummary(mode)}
                  {renderIntegratedEvidencePackages()}
                </div>
              ),
            },
            {
              key: 'workflow',
              label: '流程处理',
              children: renderWorkflowSection(mode),
            },
          ]}
        />
      </div>
    );
  }

  function renderEvidencePackDrawer() {
    return (
      <Drawer
        title={selectedRecord ? `${selectedRecord.teacherName} · 证据包查看` : '证据包查看'}
        width={880}
        open={evidencePackDrawerOpen}
        onClose={() => setEvidencePackDrawerOpen(false)}
        className="teacher-evaluation-drawer"
      >
        {!selectedRecord || !selectedScheme || !activeEvidencePackage ? (
          <Empty description="暂无可查看的证据包" />
        ) : (
          <div className="teacher-evaluation-drawer-body">
            <div className="teacher-evaluation-evidence-pack-nav">
              {selectedEvidencePackages.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`teacher-evaluation-evidence-pack-chip${item.key === activeEvidencePackage.key ? ' is-active' : ''}`}
                  onClick={() => setActiveEvidencePackKey(item.key)}
                >
                  <strong>{item.itemName}</strong>
                  <span>{item.evidenceItems.length} 条证据</span>
                </button>
              ))}
            </div>

            <div className="teacher-evaluation-evidence-pack-hero">
              <div className="teacher-evaluation-drawer-kicker">对应评价项</div>
              <h3>{activeEvidencePackage.itemName}</h3>
              <p>{activeEvidencePackage.evidenceThreshold}</p>
              <div className="teacher-evaluation-tag-row">
                <Tag color={activeEvidencePackage.thresholdMet ? 'success' : 'warning'}>
                  {activeEvidencePackage.thresholdMet ? '已达到门槛' : `缺 ${activeEvidencePackage.missingCount} 条`}
                </Tag>
                <Tag>{activeEvidencePackage.averageCoverage}% 平均覆盖</Tag>
                <Tag>{activeEvidencePackage.evaluatorRoles.join(' / ') || '未配置评价主体'}</Tag>
                <Tag color={activeEvidencePackage.aiAssistAllowed ? 'processing' : 'default'}>
                  {activeEvidencePackage.aiAssistAllowed ? 'AI 可预填' : 'AI 不预填'}
                </Tag>
              </div>
            </div>

            <div className="teacher-evaluation-pack-grid">
              <div className="teacher-evaluation-pack-metric">
                <span>证据数量</span>
                <strong>{activeEvidencePackage.evidenceItems.length}</strong>
              </div>
              <div className="teacher-evaluation-pack-metric">
                <span>平均覆盖</span>
                <strong>{activeEvidencePackage.averageCoverage}%</strong>
              </div>
              <div className="teacher-evaluation-pack-metric">
                <span>AI 草稿状态</span>
                <strong>{activeEvidencePackage.aiDraft ? getAiDraftStatusLabel(activeEvidencePackage.aiDraft.reviewStatus) : '未生成'}</strong>
              </div>
              <div className="teacher-evaluation-pack-metric">
                <span>门槛差额</span>
                <strong>{activeEvidencePackage.thresholdMet ? 0 : activeEvidencePackage.missingCount}</strong>
              </div>
            </div>

            {activeEvidencePackage.aiDraft ? (
              <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
                <div className="teacher-evaluation-card-head">
                  <span>关联 AI 建议稿</span>
                  <Tag color={aiDraftStatusColor(activeEvidencePackage.aiDraft.reviewStatus)}>
                    {getAiDraftStatusLabel(activeEvidencePackage.aiDraft.reviewStatus)}
                  </Tag>
                </div>
                <p className="teacher-evaluation-body-copy">{activeEvidencePackage.aiDraft.summary}</p>
                <ul className="teacher-evaluation-list">
                  {(activeEvidencePackage.aiDraft.suggestions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
              <div className="teacher-evaluation-card-head">
                <span>证据明细</span>
                <Tag>{activeEvidencePackage.evidenceItems.length} 条</Tag>
              </div>
              {activeEvidencePackage.evidenceItems.length ? (
                <div className="teacher-evaluation-evidence-list">
                  {activeEvidencePackage.evidenceItems.map((item) => (
                    <div key={item.id} className="teacher-evaluation-evidence-item">
                      <div className="teacher-evaluation-evidence-head">
                        <strong>{item.title}</strong>
                        <Tag color="blue">{item.sourceLabel}</Tag>
                      </div>
                      <div className="teacher-evaluation-evidence-meta">
                        <span>{item.date}</span>
                        <span>{item.statusLabel}</span>
                        <span>{item.coverage}% 覆盖</span>
                      </div>
                      <p>{item.summary}</p>
                      <div className="teacher-evaluation-evidence-path">{item.resourcePath}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="当前评价项暂无已归集证据" />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    );
  }

  if (loading) {
    return <Spin className="teacher-evaluation-loading" />;
  }

  if (!activeScheme) {
    return <Empty description="暂无教师评价方案，请先到“评价方案”模块创建方案" />;
  }

  return (
    <div className="sys-module teacher-evaluation-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">教师评价</span>
          <span className="sys-module-header-subtitle">评审工作台、AI 建议稿确认和审计台账一体化运行</span>
        </div>
        <Space wrap>
          <Segmented
            value={activeRole}
            onChange={setActiveRole}
            options={TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={openCreateRecordDrawer} loading={submitting}>发起评价实例</Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="teacher-evaluation-page">
          <Alert
            showIcon
            type="warning"
            className="teacher-evaluation-alert"
            message="AI 输出只作为建议稿"
            description="AI 可以归档、抽取、摘要、预填量规和草拟意见，但最终评分、认定、申诉处理和负向结论必须由人工确认。当前工作台支持完整留痕。"
          />

          <div className="teacher-evaluation-hero-grid">
            <Card bordered={false} className="teacher-evaluation-hero-card">
              <div className="teacher-evaluation-hero-kicker">当前角色</div>
              <h3>{getTeacherEvaluationRoleLabel(activeRole)}</h3>
              <p>你当前看到的是该角色下的操作视角与节点动作。AI 草稿确认、退回补证和流转动作都会记入审计日志。</p>
              <div className="teacher-evaluation-meta-row">
                <Tag color="processing"><RobotOutlined /> AI 输出需人工确认</Tag>
                <Tag color="warning"><SafetyCertificateOutlined /> 最终结论不得由 AI 写入</Tag>
              </div>
            </Card>
            <Card bordered={false} className="teacher-evaluation-hero-card">
              <div className="teacher-evaluation-hero-kicker">评审概览</div>
              <div className="teacher-evaluation-summary-grid">
                <Statistic title="评价实例" value={summaryStats.totalRecords} />
                <Statistic title="评审中" value={summaryStats.inReview} />
                <Statistic title="待补证" value={summaryStats.supplementRequired} />
                <Statistic title="待确认 AI 草稿" value={summaryStats.pendingAiDrafts} />
                <Statistic title="角色待办" value={summaryStats.todoForRole} />
                <Statistic title="申诉中" value={summaryStats.appeals} />
              </div>
            </Card>
          </div>

          <div className="teacher-evaluation-scheme-tabs">
            {schemes.map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                className={`teacher-evaluation-scheme-chip ${scheme.id === activeScheme.id ? 'is-active' : ''}`}
                onClick={() => setActiveSchemeId(scheme.id)}
              >
                <strong>{scheme.name}</strong>
                <span>{scheme.targetLevel} · {scheme.semester}</span>
              </button>
            ))}
          </div>

          <Tabs
            className="teacher-evaluation-tabs"
            items={[
              {
                key: 'workbench',
                label: '评审工作台',
                children: (
                  <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-records-card">
                    <div className="teacher-evaluation-card-head">
                      <span>评价实例</span>
                      <Space wrap>
                        <Segmented
                          value={recordScope}
                          onChange={setRecordScope}
                          options={[
                            { label: '全部', value: 'ALL' },
                            { label: '我的待办', value: 'TODO' },
                            { label: '我已处理', value: 'DONE' },
                          ]}
                        />
                        <Segmented
                          value={statusFilter}
                          onChange={setStatusFilter}
                          options={[
                            { label: '全部', value: 'ALL' },
                            { label: '评审中', value: 'IN_REVIEW' },
                            { label: '待补证', value: 'SUPPLEMENT_REQUIRED' },
                            { label: '已通过', value: 'APPROVED' },
                            { label: '申诉中', value: 'APPEAL_PENDING' },
                          ]}
                        />
                      </Space>
                    </div>
                    <div className="teacher-evaluation-toolbar">
                      <Space wrap>
                        <Segmented
                          value={workbenchView}
                          onChange={setWorkbenchView}
                          options={[
                            { label: '按教师', value: 'TEACHER' },
                            { label: '按周期', value: 'PERIOD' },
                          ]}
                        />
                        <Segmented
                          value={workbenchSchemeScope}
                          onChange={setWorkbenchSchemeScope}
                          options={[
                            { label: '全部周期', value: 'ALL' },
                            { label: '当前方案', value: 'ACTIVE' },
                          ]}
                        />
                        <Select
                          value={periodFilter}
                          onChange={setPeriodFilter}
                          options={periodOptions}
                          className="teacher-evaluation-period-select"
                        />
                      </Space>
                      <Input
                        allowClear
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                        prefix={<SearchOutlined />}
                        placeholder="搜索教师、部门、方案或评价状态"
                      />
                      <Space wrap>
                        <Tag color="blue">共 {filteredRecords.length} 条实例</Tag>
                        <Tag>{workbenchView === 'TEACHER' ? `${teacherWorkbenchGroups.length} 位教师` : `${periodWorkbenchGroups.length} 个周期`}</Tag>
                        <Tag>点击行查看评审详情</Tag>
                      </Space>
                    </div>
                    {renderWorkbenchGroups()}
                  </Card>
                ),
              },
              {
                key: 'audit',
                label: '审计台账',
                children: (
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>操作留痕</span>
                      <Tag icon={<HistoryOutlined />}>{selectedRecord ? '当前评价实例' : '全部实例'}</Tag>
                    </div>
                    <Table
                      rowKey="id"
                      columns={auditColumns}
                      dataSource={selectedRecord ? auditLogs.filter((item) => item.recordId === selectedRecord.id) : auditLogs}
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      scroll={{ x: 860 }}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Drawer
        open={recordDrawerOpen}
        onClose={() => setRecordDrawerOpen(false)}
        width={760}
        title={selectedRecord ? `${selectedRecord.teacherName} · ${selectedScheme?.name || '评价实例'}` : '评价实例'}
        className="teacher-evaluation-drawer"
      >
        {renderRecordDetail('drawer')}
      </Drawer>

      {renderEvidencePackDrawer()}
      {renderCreateRecordDrawer()}
      {renderEvidenceDrawer()}
    </div>
  );
}
