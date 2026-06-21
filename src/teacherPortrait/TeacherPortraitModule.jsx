import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Progress,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  message,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  ReloadOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { capabilityModelApi, getCapabilityModelStoreEventName } from '../capabilityModel/api';
import { getTeacherEvaluationStatusLabel, teacherEvaluationApi } from '../teacherEvaluation/api';
import '../system/SystemModule.css';
import './TeacherPortraitModule.css';

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 16);
}

function parseMinimumEvidenceCount(text) {
  const matched = String(text || '').match(/至少\s*(\d+)/);
  return matched ? Number(matched[1]) : 1;
}

function isClosedStatus(status) {
  return ['APPROVED', 'REJECTED', 'APPEAL_RESOLVED'].includes(status);
}

function getCoverageColor(value) {
  if (value >= 85) return '#52c41a';
  if (value >= 75) return '#1677ff';
  return '#fa8c16';
}

function getRiskMeta(riskLevel) {
  if (riskLevel === 'HIGH') return { label: '需要优先补证', color: 'error' };
  if (riskLevel === 'MEDIUM') return { label: '持续推进中', color: 'warning' };
  return { label: '画像相对稳定', color: 'success' };
}

function buildRecordSortValue(record) {
  return [
    record?.periodSortKey || '',
    record?.updatedAt || '',
    record?.createdAt || '',
    record?.id || '',
  ].join('_');
}

function summarizeEvidence(records = [], schemeMap = new Map()) {
  const itemMap = new Map();

  records.forEach((record) => {
    const scheme = schemeMap.get(record.schemeId);
    const rubricMap = new Map((scheme?.itemRubrics || []).map((item) => [item.itemName, item]));

    (record.evidenceItems || []).forEach((item) => {
      const itemName = item.relatedItemName || item.title || '待归类项';
      const current = itemMap.get(itemName) || {
        key: itemName,
        itemName,
        evidenceCount: 0,
        totalCoverage: 0,
        latestDate: '',
        latestSource: '',
        threshold: item.evidenceThreshold || rubricMap.get(itemName)?.evidenceThreshold || '',
        schemes: new Set(),
        statuses: new Set(),
      };

      current.evidenceCount += 1;
      current.totalCoverage += Number(item.coverage) || 0;
      current.threshold = current.threshold || item.evidenceThreshold || rubricMap.get(itemName)?.evidenceThreshold || '';
      current.latestSource = item.sourceLabel || current.latestSource || '我的档案';
      if (!current.latestDate || String(item.date || '').localeCompare(String(current.latestDate)) > 0) {
        current.latestDate = item.date || '';
      }
      current.schemes.add(record.schemeNameSnapshot || scheme?.name || '评价方案');
      if (item.statusLabel) {
        current.statuses.add(item.statusLabel);
      }
      itemMap.set(itemName, current);
    });
  });

  return Array.from(itemMap.values())
    .map((item) => {
      const minimumCount = parseMinimumEvidenceCount(item.threshold);
      const averageCoverage = item.evidenceCount ? Math.round(item.totalCoverage / item.evidenceCount) : 0;
      return {
        ...item,
        averageCoverage,
        minimumCount,
        gapCount: Math.max(0, minimumCount - item.evidenceCount),
        schemes: Array.from(item.schemes),
        statuses: Array.from(item.statuses),
      };
    })
    .sort((left, right) => {
      if (right.averageCoverage !== left.averageCoverage) {
        return right.averageCoverage - left.averageCoverage;
      }
      return right.evidenceCount - left.evidenceCount;
    });
}

function buildModelMetas(models = [], roles = [], sequences = []) {
  const roleMap = new Map(roles.map((item) => [item.id, item]));
  const sequenceMap = new Map(sequences.map((item) => [item.id, item]));

  return models.map((model) => {
    const role = roleMap.get(model.roleId) || null;
    const sequence = role ? sequenceMap.get(role.sequenceId) || null : null;
    const roleLevel = sequence?.levels?.find((item) => item.id === model.roleLevelId) || null;
    const dimensionCount = Array.isArray(model.dimensions) ? model.dimensions.length : 0;
    const itemCount = (model.dimensions || []).reduce((sum, dimension) => sum + (dimension.items?.length || 0), 0);

    return {
      ...model,
      roleName: role?.name || '',
      sequenceName: sequence?.name || '',
      roleLevelName: roleLevel?.name || '',
      dimensionCount,
      itemCount,
    };
  });
}

function scoreModelFit(model, teacher) {
  const teacherText = `${teacher.roleName || ''} ${teacher.targetLevel || ''}`.toLowerCase();
  const modelText = `${model.name || ''} ${model.description || ''} ${model.roleName || ''} ${model.roleLevelName || ''} ${(model.tags || []).join(' ')}`.toLowerCase();
  let score = 0;

  if (model.roleLevelName && teacher.targetLevel && model.roleLevelName === teacher.targetLevel) {
    score += 55;
  }
  if (model.roleName && teacher.roleName && (teacher.roleName.includes(model.roleName) || model.roleName.includes(teacher.roleName))) {
    score += 35;
  }
  if (teacherText && modelText.includes(teacher.targetLevel?.toLowerCase() || '')) {
    score += 12;
  }
  if (teacherText && modelText.includes(teacher.roleName?.toLowerCase() || '')) {
    score += 10;
  }

  return score;
}

function buildPortraitTag(summary) {
  if (summary.averageCoverage >= 86 && summary.approvedCount > 0) {
    return '证据扎实型';
  }
  if (summary.focusNames.some((item) => /企业|校企/.test(item))) {
    return '校企协同型';
  }
  if (summary.gapCount >= 2 || summary.lowCoverageCount >= 2) {
    return '补证强化型';
  }
  if (summary.inReviewCount > 0) {
    return '评审推进型';
  }
  return '成长蓄能型';
}

function buildPortraitSummary(teacher, summary) {
  const focusLabel = summary.focusNames.length ? summary.focusNames.slice(0, 2).join('、') : '核心能力沉淀';
  if (summary.riskLevel === 'HIGH') {
    return `${teacher.name}当前以“${summary.portraitTag}”为主，近期最需要处理的是 ${focusLabel} 的补证和覆盖提升。`;
  }
  if (summary.inReviewCount > 0) {
    return `${teacher.name}当前处于“${summary.portraitTag}”阶段，已进入评审推进，建议继续围绕 ${focusLabel} 固化高质量证据。`;
  }
  return `${teacher.name}当前画像稳定在“${summary.portraitTag}”，优势主要体现在 ${focusLabel}，可以继续向 ${teacher.targetLevel || '目标层级'} 做深度积累。`;
}

function buildTeacherSummary(teacher, records, schemes, modelMetas) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const sortedRecords = [...records].sort((left, right) => String(buildRecordSortValue(right)).localeCompare(String(buildRecordSortValue(left))));
  const latestRecord = sortedRecords[0] || null;
  const evidenceRows = summarizeEvidence(sortedRecords, schemeMap);
  const allEvidence = sortedRecords.flatMap((record) => record.evidenceItems || []);
  const totalEvidenceCount = allEvidence.length;
  const averageCoverage = totalEvidenceCount
    ? Math.round(allEvidence.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / totalEvidenceCount)
    : 0;
  const pendingAiDrafts = sortedRecords.reduce((sum, record) => (
    sum + (record.aiDrafts || []).filter((item) => item.reviewStatus === 'PENDING_HUMAN').length
  ), 0);
  const approvedCount = sortedRecords.filter((record) => record.status === 'APPROVED').length;
  const inReviewCount = sortedRecords.filter((record) => record.status === 'IN_REVIEW').length;
  const openCount = sortedRecords.filter((record) => !isClosedStatus(record.status)).length;
  const lowCoverageCount = evidenceRows.filter((item) => item.averageCoverage < 80).length;
  const gapCount = evidenceRows.reduce((sum, item) => sum + item.gapCount, 0);
  const focusNames = evidenceRows.slice(0, 3).map((item) => item.itemName);
  const riskLevel = gapCount >= 2 || averageCoverage < 75 ? 'HIGH' : gapCount > 0 || pendingAiDrafts > 0 || averageCoverage < 85 ? 'MEDIUM' : 'LOW';
  const portraitTag = buildPortraitTag({
    averageCoverage,
    approvedCount,
    focusNames,
    gapCount,
    lowCoverageCount,
    inReviewCount,
  });
  const strengths = evidenceRows
    .filter((item) => item.averageCoverage >= 80)
    .slice(0, 3)
    .map((item) => `${item.itemName} 已沉淀 ${item.evidenceCount} 条材料，平均覆盖 ${item.averageCoverage}%。`);
  const risks = [
    ...evidenceRows
      .filter((item) => item.gapCount > 0)
      .slice(0, 3)
      .map((item) => `${item.itemName} 距离当前量规还差 ${item.gapCount} 条关键证据。`),
    ...evidenceRows
      .filter((item) => item.averageCoverage < 80)
      .slice(0, 2)
      .map((item) => `${item.itemName} 当前覆盖仅 ${item.averageCoverage}%，建议补齐结果证据与过程记录。`),
  ].slice(0, 4);
  const recommendations = [
    gapCount > 0
      ? `优先补齐 ${evidenceRows.filter((item) => item.gapCount > 0).slice(0, 2).map((item) => item.itemName).join('、')} 的阈值证据，避免卡在当前评审节点。`
      : '当前量规阈值基本满足，可以把重点放在结果证据的表达质量上。',
    pendingAiDrafts > 0
      ? `还有 ${pendingAiDrafts} 份 AI 建议稿待人工确认，建议先完成核对，避免画像与评审结论脱节。`
      : 'AI 建议稿已基本处理完，可以继续沉淀可复用的高质量材料包。',
    latestRecord
      ? `围绕最近周期“${latestRecord.periodLabel || latestRecord.schemeNameSnapshot}”继续维护证据链，保证档案、评价和模型判断一致。`
      : '当前尚无评价实例，建议从我的档案中先形成首轮证据包。',
  ];

  const matchedModels = modelMetas
    .map((model) => ({
      ...model,
      fitScore: scoreModelFit(model, teacher),
    }))
    .filter((item) => item.fitScore > 0 && item.status === 'PUBLISHED')
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 3);

  const timelineItems = sortedRecords.slice(0, 5).map((record) => ({
    key: record.id,
    color: record.status === 'APPROVED' ? 'green' : record.status === 'IN_REVIEW' ? 'blue' : record.status === 'SUPPLEMENT_REQUIRED' ? 'orange' : 'gray',
    children: (
      <div className="teacher-portrait-timeline-item">
        <div className="teacher-portrait-timeline-head">
          <strong>{record.schemeNameSnapshot}</strong>
          <Tag color={record.status === 'APPROVED' ? 'success' : record.status === 'IN_REVIEW' ? 'processing' : record.status === 'SUPPLEMENT_REQUIRED' ? 'warning' : 'default'}>
            {getTeacherEvaluationStatusLabel(record.status)}
          </Tag>
        </div>
        <span>{record.periodLabel} · {formatDateTime(record.updatedAt || record.createdAt)}</span>
        <p>{record.evidenceItems?.length || 0} 条证据，当前节点：{record.currentNode || '-'}</p>
      </div>
    ),
  }));

  return {
    latestRecord,
    evidenceRows,
    totalEvidenceCount,
    averageCoverage,
    pendingAiDrafts,
    approvedCount,
    inReviewCount,
    openCount,
    lowCoverageCount,
    gapCount,
    focusNames,
    riskLevel,
    portraitTag,
    portraitSummary: buildPortraitSummary(teacher, {
      portraitTag,
      riskLevel,
      focusNames,
      inReviewCount,
    }),
    strengths: strengths.length ? strengths : ['当前还没有形成明显的优势项，建议先沉淀一轮完整证据。'],
    risks: risks.length ? risks : ['当前未识别到明显短板，可继续维持材料更新节奏。'],
    recommendations,
    matchedModels,
    timelineItems,
  };
}

function TeacherPortraitModule({ onNavigateToTeacherEvaluation }) {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [records, setRecords] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [modelMetas, setModelMetas] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const loadData = useCallback(async (withLoading = true) => {
    if (withLoading) {
      setLoading(true);
    }
    try {
      await Promise.all([
        teacherEvaluationApi.seed(),
        capabilityModelApi.seed(),
      ]);

      const [
        nextTeachers,
        nextRecords,
        nextSchemes,
        nextModels,
        nextRoles,
        nextSequences,
      ] = await Promise.all([
        teacherEvaluationApi.listTeachers(),
        teacherEvaluationApi.listRecords(),
        teacherEvaluationApi.listSchemes(),
        capabilityModelApi.listModels(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listSequences(),
      ]);

      setTeachers(nextTeachers);
      setRecords(nextRecords);
      setSchemes(nextSchemes);
      setModelMetas(buildModelMetas(nextModels, nextRoles, nextSequences));
      setSelectedTeacherId((prev) => {
        if (prev && nextTeachers.some((item) => item.teacherId === prev)) {
          return prev;
        }
        return nextTeachers.find((item) => item.teacherId === 'teacher_zhou_lan')?.teacherId || nextTeachers[0]?.teacherId || '';
      });
    } catch (error) {
      message.error(error?.message || '加载教师画像失败');
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const evaluationEventName = teacherEvaluationApi.getStoreEventName?.();
    const modelEventName = getCapabilityModelStoreEventName();
    const handleStoreChange = () => {
      loadData(false);
    };

    if (evaluationEventName) {
      window.addEventListener(evaluationEventName, handleStoreChange);
    }
    if (modelEventName) {
      window.addEventListener(modelEventName, handleStoreChange);
    }

    return () => {
      if (evaluationEventName) {
        window.removeEventListener(evaluationEventName, handleStoreChange);
      }
      if (modelEventName) {
        window.removeEventListener(modelEventName, handleStoreChange);
      }
    };
  }, [loadData]);

  const teacherOptions = useMemo(() => teachers.map((item) => ({
    label: `${item.name} · ${item.departmentName}`,
    value: item.teacherId,
  })), [teachers]);

  const selectedTeacher = useMemo(
    () => teachers.find((item) => item.teacherId === selectedTeacherId) || teachers[0] || null,
    [teachers, selectedTeacherId],
  );

  const selectedTeacherRecords = useMemo(
    () => records.filter((item) => item.teacherId === selectedTeacher?.teacherId),
    [records, selectedTeacher?.teacherId],
  );

  const portraitSummary = useMemo(
    () => (selectedTeacher ? buildTeacherSummary(selectedTeacher, selectedTeacherRecords, schemes, modelMetas) : null),
    [modelMetas, schemes, selectedTeacher, selectedTeacherRecords],
  );

  const evidenceColumns = useMemo(() => [
    {
      title: '画像维度',
      key: 'itemName',
      render: (_, item) => (
        <div className="teacher-portrait-evidence-cell">
          <strong>{item.itemName}</strong>
          <span>{item.threshold || '未配置量规阈值'}</span>
        </div>
      ),
    },
    {
      title: '材料数',
      dataIndex: 'evidenceCount',
      key: 'evidenceCount',
      width: 88,
    },
    {
      title: '覆盖度',
      key: 'averageCoverage',
      width: 180,
      render: (_, item) => (
        <div className="teacher-portrait-progress-cell">
          <Progress percent={item.averageCoverage} size="small" strokeColor={getCoverageColor(item.averageCoverage)} />
          <span>{item.averageCoverage}%</span>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 160,
      render: (_, item) => (
        <Tag color={item.gapCount > 0 || item.averageCoverage < 80 ? 'warning' : 'success'}>
          {item.gapCount > 0 ? `缺 ${item.gapCount} 条` : '达标'}
        </Tag>
      ),
    },
    {
      title: '最近来源',
      key: 'latestSource',
      render: (_, item) => (
        <div className="teacher-portrait-evidence-cell">
          <strong>{item.latestSource || '-'}</strong>
          <span>{item.latestDate || '-'}</span>
        </div>
      ),
    },
  ], []);

  const modelColumns = useMemo(() => [
    {
      title: '参照模型',
      key: 'name',
      render: (_, item) => (
        <div className="teacher-portrait-model-cell">
          <strong>{item.name}</strong>
          <span>{item.sequenceName ? `${item.sequenceName} / ${item.roleLevelName}` : item.roleLevelName || item.roleName || '-'}</span>
        </div>
      ),
    },
    {
      title: '结构',
      key: 'meta',
      render: (_, item) => `${item.dimensionCount} 个维度 / ${item.itemCount} 个能力项`,
    },
    {
      title: '匹配度',
      key: 'fitScore',
      width: 120,
      render: (_, item) => <Tag color="blue">{item.fitScore} 分</Tag>,
    },
  ], []);

  const riskMeta = portraitSummary ? getRiskMeta(portraitSummary.riskLevel) : getRiskMeta('LOW');

  return (
    <div className="sys-module teacher-portrait-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">教师画像</span>
          <span className="sys-module-header-subtitle">给教师本人查看的成长画像、证据状态和下一步行动建议</span>
        </div>
        <Space>
          <Select
            className="teacher-portrait-teacher-select"
            options={teacherOptions}
            value={selectedTeacher?.teacherId}
            onChange={setSelectedTeacherId}
            placeholder="选择教师"
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
            刷新画像
          </Button>
        </Space>
      </div>
      <div className="sys-module-body teacher-portrait-page">
        <Alert
          type="info"
          showIcon
          className="teacher-portrait-alert"
          message="画像用于教师自查与补证准备"
          description="系统根据当前评价实例、档案证据和能力模型规则生成画像标签与建议，用于帮助教师理解当前状态；正式认定结果仍以人工评审结论为准。"
        />

        {loading ? (
          <div className="teacher-portrait-loading">
            <Spin size="large" />
          </div>
        ) : !selectedTeacher || !portraitSummary ? (
          <Card className="teacher-portrait-card">
            <Empty description="当前没有可展示的教师画像数据" />
          </Card>
        ) : (
          <>
            <Card className="teacher-portrait-hero-card">
              <div className="teacher-portrait-hero-head">
                <div>
                  <span className="teacher-portrait-kicker">{selectedTeacher.schoolName} · {selectedTeacher.departmentName}</span>
                  <h2>{selectedTeacher.name} / {selectedTeacher.roleName}</h2>
                  <p>{portraitSummary.portraitSummary}</p>
                  <div className="teacher-portrait-tag-row">
                    <Tag color="blue">{portraitSummary.portraitTag}</Tag>
                    <Tag>{selectedTeacher.targetLevel}</Tag>
                    <Tag color={riskMeta.color}>{riskMeta.label}</Tag>
                    {portraitSummary.focusNames.map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>
                </div>
                <div className="teacher-portrait-hero-actions">
                  <Button
                    type="primary"
                    icon={<AuditOutlined />}
                    onClick={() => onNavigateToTeacherEvaluation?.()}
                  >
                    去教师评价
                  </Button>
                  <div className="teacher-portrait-hero-status">
                    <span>最近实例</span>
                    <strong>{portraitSummary.latestRecord ? getTeacherEvaluationStatusLabel(portraitSummary.latestRecord.status) : '暂无'}</strong>
                    <span>{portraitSummary.latestRecord ? `${portraitSummary.latestRecord.schemeNameSnapshot} · ${portraitSummary.latestRecord.periodLabel}` : '尚未发起评价流程'}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="teacher-portrait-summary-grid">
              <Card className="teacher-portrait-stat-card">
                <Statistic title="画像覆盖度" value={portraitSummary.averageCoverage} suffix="%" prefix={<RiseOutlined />} />
              </Card>
              <Card className="teacher-portrait-stat-card">
                <Statistic title="累计证据条数" value={portraitSummary.totalEvidenceCount} prefix={<IdcardOutlined />} />
              </Card>
              <Card className="teacher-portrait-stat-card">
                <Statistic title="评审推进中" value={portraitSummary.inReviewCount} prefix={<ClockCircleOutlined />} />
              </Card>
              <Card className="teacher-portrait-stat-card">
                <Statistic title="已通过实例" value={portraitSummary.approvedCount} prefix={<CheckCircleOutlined />} />
              </Card>
              <Card className="teacher-portrait-stat-card">
                <Statistic title="待确认 AI 稿" value={portraitSummary.pendingAiDrafts} prefix={<WarningOutlined />} />
              </Card>
              <Card className="teacher-portrait-stat-card">
                <Statistic title="进行中实例" value={portraitSummary.openCount} prefix={<AuditOutlined />} />
              </Card>
            </div>

            <div className="teacher-portrait-main-grid">
              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>我的优势标签</strong>
                    <span>系统根据已沉淀证据和最近周期表现归纳出的亮点。</span>
                  </div>
                  <Tag color="success">优势侧</Tag>
                </div>
                <div className="teacher-portrait-list">
                  {portraitSummary.strengths.map((item) => (
                    <div key={item} className="teacher-portrait-list-item is-success">
                      <strong>{item.split('，')[0]}</strong>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>当前关注项</strong>
                    <span>影响本轮画像和后续评审效率的主要短板与缺口。</span>
                  </div>
                  <Tag color={riskMeta.color}>{riskMeta.label}</Tag>
                </div>
                <div className="teacher-portrait-list">
                  {portraitSummary.risks.map((item) => (
                    <div key={item} className="teacher-portrait-list-item is-warning">
                      <strong>{item.split('，')[0]}</strong>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="teacher-portrait-main-grid">
              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>证据画像</strong>
                    <span>从量规项角度看我当前材料的覆盖和缺口。</span>
                  </div>
                  <Tag>{portraitSummary.evidenceRows.length} 个画像维度</Tag>
                </div>
                <Table
                  rowKey="key"
                  columns={evidenceColumns}
                  dataSource={portraitSummary.evidenceRows}
                  pagination={false}
                  scroll={{ x: 820 }}
                />
              </Card>

              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>最近轨迹</strong>
                    <span>把最近几个周期的状态变化串起来，方便自查。</span>
                  </div>
                  <Tag color="blue">{portraitSummary.timelineItems.length} 条</Tag>
                </div>
                <Timeline items={portraitSummary.timelineItems} />
              </Card>
            </div>

            <div className="teacher-portrait-main-grid">
              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>能力模型参照</strong>
                    <span>当前最适合拿来对照自查的已发布能力模型。</span>
                  </div>
                  <Tag color="processing">{portraitSummary.matchedModels.length} 个匹配模型</Tag>
                </div>
                {portraitSummary.matchedModels.length ? (
                  <Table
                    rowKey="id"
                    columns={modelColumns}
                    dataSource={portraitSummary.matchedModels}
                    pagination={false}
                    scroll={{ x: 760 }}
                  />
                ) : (
                  <Empty description="暂未匹配到可参考的能力模型" />
                )}
              </Card>

              <Card className="teacher-portrait-card">
                <div className="teacher-portrait-card-head">
                  <div>
                    <strong>下一步建议</strong>
                    <span>系统建议你优先处理的动作，按先后顺序排列。</span>
                  </div>
                  <Tag color="purple">行动清单</Tag>
                </div>
                <div className="teacher-portrait-list">
                  {portraitSummary.recommendations.map((item, index) => (
                    <div key={item} className="teacher-portrait-list-item is-processing">
                      <strong>动作 {index + 1}</strong>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeacherPortraitModule;
