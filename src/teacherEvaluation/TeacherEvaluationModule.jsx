import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Progress,
  Segmented,
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
  HistoryOutlined,
  PlusOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
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

function toneToType(tone) {
  if (tone === 'primary') return 'primary';
  if (tone === 'danger') return 'primary';
  return 'default';
}

export default function TeacherEvaluationModule() {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSchemeId, setActiveSchemeId] = useState(undefined);
  const [selectedRecordId, setSelectedRecordId] = useState(undefined);
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('GROUP_LEADER');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [opinionText, setOpinionText] = useState('');
  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await teacherEvaluationApi.seed();
      const [nextSchemes, nextRecords, nextAuditLogs] = await Promise.all([
        teacherEvaluationApi.listSchemes(),
        teacherEvaluationApi.listRecords(),
        teacherEvaluationApi.listAuditLogs(),
      ]);
      setSchemes(nextSchemes);
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

  const activeScheme = useMemo(
    () => schemes.find((item) => item.id === activeSchemeId) || schemes[0] || null,
    [activeSchemeId, schemes],
  );

  const filteredRecords = useMemo(() => (
    records.filter((record) => (
      (!activeSchemeId || record.schemeId === activeSchemeId)
      && (statusFilter === 'ALL' || record.status === statusFilter)
    ))
  ), [activeSchemeId, records, statusFilter]);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedRecordId) || filteredRecords[0] || null,
    [filteredRecords, records, selectedRecordId],
  );

  const selectedScheme = useMemo(
    () => schemes.find((item) => item.id === selectedRecord?.schemeId) || activeScheme,
    [activeScheme, schemes, selectedRecord?.schemeId],
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
  }), [records]);

  async function handleCreateRecord() {
    if (!activeScheme) return;
    setSubmitting(true);
    try {
      const created = await teacherEvaluationApi.createRecord(activeScheme.id);
      message.success('已新建评价实例');
      setSelectedRecordId(created.id);
      setRecordDrawerOpen(true);
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
          </div>
        </div>

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
        <Space>
          <Segmented
            value={activeRole}
            onChange={setActiveRole}
            options={TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={handleCreateRecord} loading={submitting}>发起评价实例</Button>
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
                      </div>
                      <Table
                        rowKey="id"
                        columns={recordColumns}
                        dataSource={filteredRecords}
                        pagination={{ pageSize: 6, showSizeChanger: false }}
                        scroll={{ x: 860 }}
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
        width={720}
        title={selectedRecord ? `${selectedRecord.teacherName} · ${selectedScheme?.name || '评价实例'}` : '评价实例'}
        className="teacher-evaluation-drawer"
      >
        {renderRecordDetail('drawer')}
      </Drawer>
    </div>
  );
}
