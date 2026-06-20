import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
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
import '../system/SystemModule.css';
import './TeacherEvaluationModule.css';

const { TextArea } = Input;

const REVIEW_ROLE_LABEL_OPTIONS = TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.label,
}));

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

function createSchemeFormValues(scheme) {
  if (!scheme) return DEFAULT_SCHEME_FORM;
  return {
    name: scheme.name,
    schemeType: scheme.schemeType,
    targetRole: scheme.targetRole,
    targetLevel: scheme.targetLevel,
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

export default function TeacherEvaluationModule() {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSchemeId, setActiveSchemeId] = useState(undefined);
  const [selectedRecordId, setSelectedRecordId] = useState(undefined);
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [schemeDrawerOpen, setSchemeDrawerOpen] = useState(false);
  const [recordCreateDrawerOpen, setRecordCreateDrawerOpen] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState(undefined);
  const [activeRole, setActiveRole] = useState('GROUP_LEADER');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recordScope, setRecordScope] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [opinionText, setOpinionText] = useState('');
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [schemeForm] = Form.useForm();
  const [recordForm] = Form.useForm();
  const [evidenceForm] = Form.useForm();

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await teacherEvaluationApi.seed();
      const [nextSchemes, nextTeachers, nextRecords, nextAuditLogs] = await Promise.all([
        teacherEvaluationApi.listSchemes(),
        teacherEvaluationApi.listTeachers(),
        teacherEvaluationApi.listRecords(),
        teacherEvaluationApi.listAuditLogs(),
      ]);
      setSchemes(nextSchemes);
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

  const filteredRecords = useMemo(() => (
    records.filter((record) => {
      const scheme = schemes.find((item) => item.id === record.schemeId);
      return (
        (!activeSchemeId || record.schemeId === activeSchemeId)
        && (statusFilter === 'ALL' || record.status === statusFilter)
        && matchesKeyword(record, scheme, searchKeyword.trim())
        && matchesScope(record, scheme, activeRole, recordScope)
      );
    })
  ), [activeRole, activeSchemeId, recordScope, records, schemes, searchKeyword, statusFilter]);

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

  const availableActions = useMemo(
    () => resolveAvailableActions(selectedRecord, selectedScheme, activeRole),
    [activeRole, selectedRecord, selectedScheme],
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
      const payload = {
        id: editingSchemeId,
        name: values.name,
        schemeType: values.schemeType,
        targetRole: values.targetRole,
        targetLevel: values.targetLevel,
        semester: values.semester,
        summary: values.summary,
        aiBoundary: values.aiBoundary,
        status: 'ACTIVE',
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
            <Form.Item label="评价类型" name="schemeType" rules={[{ required: true, message: '请输入评价类型' }]}>
              <Input placeholder="例如：双师型认定" />
            </Form.Item>
            <Form.Item label="目标角色" name="targetRole">
              <Input placeholder="例如：职教教师" />
            </Form.Item>
            <Form.Item label="目标层级" name="targetLevel">
              <Input placeholder="例如：双师型骨干讲师" />
            </Form.Item>
            <Form.Item label="学期 / 周期" name="semester">
              <Input placeholder="例如：2026 秋季学期" />
            </Form.Item>
            <Form.Item label="AI 边界" name="aiBoundary">
              <Input placeholder="只做建议稿" />
            </Form.Item>
          </div>

          <Form.Item label="方案摘要" name="summary">
            <TextArea rows={3} placeholder="说明该方案服务于哪个场景、重点核验哪些能力。" />
          </Form.Item>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>维度权重</span>
              <Tag>{(schemeForm.getFieldValue('dimensionWeights') || []).length} 项</Tag>
            </div>
            <Form.List name="dimensionWeights">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-row">
                      <Form.Item {...field} name={[field.name, 'name']} label="维度名称" rules={[{ required: true, message: '请输入维度名称' }]}>
                        <Input placeholder="例如：岗位任务转化" />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'weight']} label="权重">
                        <InputNumber min={0} max={100} precision={0} className="teacher-evaluation-full-width" />
                      </Form.Item>
                      <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ weight: 20 })}>新增维度</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>量规与证据门槛</span>
            </div>
            <Form.List name="itemRubrics">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'itemName']} label="评价项" rules={[{ required: true, message: '请输入评价项名称' }]}>
                          <Input placeholder="例如：企业项目融入" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'evaluatorRoles']} label="评价主体">
                          <Select mode="multiple" options={REVIEW_ROLE_LABEL_OPTIONS} placeholder="选择评价主体" />
                        </Form.Item>
                      </div>
                      <Form.Item {...field} name={[field.name, 'evidenceThreshold']} label="证据门槛">
                        <Input placeholder="例如：至少 2 条企业项目转化证据，并附 1 条企业导师意见。" />
                      </Form.Item>
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'aiAssistAllowed']} label="允许 AI 预填">
                          <Select
                            options={[
                              { label: '允许', value: true },
                              { label: '不允许', value: false },
                            ]}
                          />
                        </Form.Item>
                        <div className="teacher-evaluation-dynamic-actions">
                          <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除评价项</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ aiAssistAllowed: true })}>新增评价项</Button>
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
                        <Form.Item {...field} name={[field.name, 'name']} label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
                          <Input placeholder="例如：组内初审" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'owner']} label="责任角色" rules={[{ required: true, message: '请选择责任角色' }]}>
                          <Select options={TEACHER_EVALUATION_ROLE_OPTIONS} />
                        </Form.Item>
                      </div>
                      <Form.Item {...field} name={[field.name, 'output']} label="节点输出">
                        <Input placeholder="例如：初审意见与补证要求" />
                      </Form.Item>
                      <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除节点</Button>
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
                        <Form.Item {...field} name={[field.name, 'name']} label="助手名称" rules={[{ required: true, message: '请输入助手名称' }]}>
                          <Input placeholder="例如：评审包助手" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'roleScope']} label="适用角色">
                          <Input placeholder="例如：校级评审组" />
                        </Form.Item>
                      </div>
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'responsibilities']} label="职责清单">
                          <Select mode="tags" placeholder="输入职责并回车确认" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'restrictions']} label="限制边界">
                          <Select mode="tags" placeholder="输入限制并回车确认" />
                        </Form.Item>
                      </div>
                      <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除助手</Button>
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
            <Tag>{selectedRecord.targetLevel}</Tag>
            <Tag>{selectedRecord.evidenceItems.length} 条证据</Tag>
            <Tag>{selectedRecord.aiDrafts.length} 份 AI 建议稿</Tag>
            {selectedRecord.applicationNote ? <Tag color="cyan">{selectedRecord.applicationNote}</Tag> : null}
          </div>
        </div>

        {renderReviewPackSummary(mode)}

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
            <span>证据包</span>
            <Tag>{selectedRecord.evidenceItems.length} 条</Tag>
          </div>
          <div className="teacher-evaluation-evidence-list">
            {selectedRecord.evidenceItems.map((item) => (
              <div key={item.id} className="teacher-evaluation-evidence-item">
                <div className="teacher-evaluation-evidence-head">
                  <strong>{item.title}</strong>
                  <Tag color="blue">{item.relatedItemName}</Tag>
                </div>
                <div className="teacher-evaluation-evidence-meta">
                  <span>{item.sourceLabel}</span>
                  <span>{item.date}</span>
                  <span>{item.statusLabel}</span>
                  <span>{item.coverage}% 覆盖</span>
                </div>
                <p>{item.summary}</p>
                <div className="teacher-evaluation-evidence-path">{item.resourcePath}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card bordered={false} className="teacher-evaluation-card teacher-evaluation-detail-card">
          <div className="teacher-evaluation-card-head">
            <span>AI 建议稿</span>
            <Tag color="processing">需人工确认</Tag>
          </div>
          <div className="teacher-evaluation-ai-grid">
            {selectedRecord.aiDrafts.map((draft) => (
              <div key={draft.id} className="teacher-evaluation-ai-draft-card">
                <div className="teacher-evaluation-ai-draft-head">
                  <strong>{draft.itemName}</strong>
                  <Tag color={aiDraftStatusColor(draft.reviewStatus)}>{getAiDraftStatusLabel(draft.reviewStatus)}</Tag>
                </div>
                <p>{draft.summary}</p>
                <div className="teacher-evaluation-tag-row">
                  <Tag color="blue">置信度 {Math.round((draft.confidence || 0) * 100)}%</Tag>
                  {(draft.references || []).map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
                <ul className="teacher-evaluation-list">
                  {(draft.suggestions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {draft.reviewNote ? (
                  <div className="teacher-evaluation-ai-review-note">
                    <strong>人工备注</strong>
                    <span>{draft.reviewNote}</span>
                  </div>
                ) : null}
                <div className="teacher-evaluation-action-row">
                  <Button size="small" onClick={() => handleAiDraftAction(draft.id, 'CONFIRM')} disabled={submitting}>采纳</Button>
                  <Button size="small" onClick={() => handleAiDraftAction(draft.id, 'REVISE')} disabled={submitting}>修订后采纳</Button>
                  <Button size="small" danger onClick={() => handleAiDraftAction(draft.id, 'REJECT')} disabled={submitting}>驳回</Button>
                  <Button size="small" type="link" onClick={() => handleAiDraftAction(draft.id, 'REGENERATE')} disabled={submitting}>重新生成</Button>
                </div>
              </div>
            ))}
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

  if (loading) {
    return <Spin className="teacher-evaluation-loading" />;
  }

  if (!activeScheme) {
    return <Empty description="暂无教师评价方案" />;
  }

  return (
    <div className="sys-module teacher-evaluation-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">教师评价</span>
          <span className="sys-module-header-subtitle">评价方案、评审流程、AI 建议稿确认和审计台账一体化运行</span>
        </div>
        <Space wrap>
          <Segmented
            value={activeRole}
            onChange={setActiveRole}
            options={TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
          <Button icon={<EditOutlined />} onClick={() => openSchemeDrawer('edit')}>编辑方案</Button>
          <Button icon={<PlusOutlined />} onClick={() => openSchemeDrawer('create')}>新建方案</Button>
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
                key: 'schemes',
                label: '评价方案',
                children: (
                  <div className="teacher-evaluation-section-stack">
                    <Card bordered={false} className="teacher-evaluation-card">
                      <div className="teacher-evaluation-card-head">
                        <span>方案概览</span>
                        <Space>
                          <Tag color="blue">{activeScheme.schemeType}</Tag>
                          <Tag color="purple">{activeScheme.targetLevel}</Tag>
                          <Tag color="orange">{activeScheme.semester}</Tag>
                        </Space>
                      </div>
                      <p className="teacher-evaluation-body-copy">{activeScheme.summary}</p>
                    </Card>
                    <Card bordered={false} className="teacher-evaluation-card">
                      <div className="teacher-evaluation-card-head">
                        <span>维度权重</span>
                        <Tag>{activeScheme.dimensionWeights.length} 个维度</Tag>
                      </div>
                      <div className="teacher-evaluation-weight-grid">
                        {activeScheme.dimensionWeights.map((item) => (
                          <div key={item.key} className="teacher-evaluation-weight-item">
                            <strong>{item.name}</strong>
                            <Tag color={weightColor(item.weight)}>{item.weight}%</Tag>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card bordered={false} className="teacher-evaluation-card">
                      <div className="teacher-evaluation-card-head">
                        <span>量规与证据门槛</span>
                        <Tag><AuditOutlined /> AI 仅预填建议项</Tag>
                      </div>
                      <Table rowKey="key" columns={rubricColumns} dataSource={activeScheme.itemRubrics} pagination={false} scroll={{ x: 880 }} />
                    </Card>
                    <Card bordered={false} className="teacher-evaluation-card">
                      <div className="teacher-evaluation-card-head">
                        <span>评议流程</span>
                        <Tag>{activeScheme.reviewFlow.length} 个节点</Tag>
                      </div>
                      <div className="teacher-evaluation-flow-list">
                        {activeScheme.reviewFlow.map((step, index) => (
                          <div key={step.key} className="teacher-evaluation-flow-card">
                            <div className="teacher-evaluation-flow-index">{index + 1}</div>
                            <div className="teacher-evaluation-flow-body">
                              <strong>{step.name}</strong>
                              <span>责任角色：{getNodeAllowedRoles(step).map((item) => getTeacherEvaluationRoleLabel(item)).join(' / ')}</span>
                              <p>{step.output}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card bordered={false} className="teacher-evaluation-card">
                      <div className="teacher-evaluation-card-head">
                        <span>AI 辅助角色</span>
                        <Tag color="processing">只做建议稿</Tag>
                      </div>
                      <div className="teacher-evaluation-ai-grid">
                        {activeScheme.aiAssistants.map((assistant) => (
                          <div key={assistant.key} className="teacher-evaluation-ai-draft-card">
                            <div className="teacher-evaluation-ai-draft-head">
                              <strong>{assistant.name}</strong>
                              <Tag color="blue">{assistant.roleScope}</Tag>
                            </div>
                            <div className="teacher-evaluation-tag-row">
                              {assistant.responsibilities.map((item) => <Tag key={item} color="processing">{item}</Tag>)}
                            </div>
                            <div className="teacher-evaluation-tag-row">
                              {assistant.restrictions.map((item) => <Tag key={item} color="red">{item}</Tag>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ),
              },
              {
                key: 'workbench',
                label: '评审工作台',
                children: (
                  <div className="teacher-evaluation-workbench">
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
                        <Input
                          allowClear
                          value={searchKeyword}
                          onChange={(event) => setSearchKeyword(event.target.value)}
                          prefix={<SearchOutlined />}
                          placeholder="搜索教师、部门、用途标签或评价状态"
                        />
                        <Tag color="blue">共 {filteredRecords.length} 条实例</Tag>
                      </div>
                      <Table
                        rowKey="id"
                        columns={recordColumns}
                        dataSource={filteredRecords}
                        pagination={{ pageSize: 6, showSizeChanger: false }}
                        scroll={{ x: 1080 }}
                        rowClassName={(record) => (record.id === selectedRecord?.id ? 'teacher-evaluation-record-row-active' : '')}
                        onRow={(record) => ({
                          onClick: () => {
                            setSelectedRecordId(record.id);
                          },
                        })}
                      />
                    </Card>
                    <div className="teacher-evaluation-workbench-detail">
                      {renderRecordDetail('panel')}
                    </div>
                  </div>
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

      {renderSchemeEditorDrawer()}
      {renderCreateRecordDrawer()}
      {renderEvidenceDrawer()}
    </div>
  );
}
