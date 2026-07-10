import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Collapse,
  Empty,
  Progress,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  AimOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { capabilityModelApi } from '../capabilityModel/api';
import { pickCurrentTeacherModel, buildModelGrowthRecordSnapshot } from '../shared/profileEvidence';
import { teacherEvaluationApi } from '../teacherEvaluation/api';
import { archiveVersionApi } from '../myProfile/archiveVersionApi';
import {
  getAllItemsAcrossLibraries,
  getLibraryItemPath,
  getOrganizations,
  getTagDefinitions,
  loadResourceLib,
} from '../resourceLib/resourceLibStore';
import { getFileTypeLabel, renderFileIcon } from '../resourceLib/resourceIcons.jsx';
import { trackRecommendationEvent } from '../shared/analytics';
import {
  RECOMMENDATION_FILTERS,
  buildArchiveResourceRecommendations,
} from './recommendationEngine';
import { loadKnowledgeGraphStore } from '../knowledgeGraph/store';
import './ResourceRecommendationModule.css';

const PROFILE_BASE = {
  name: '周岚',
  roleTitle: '智能制造专业教师',
  schoolName: '海右职业技术学院',
  departmentName: '智能制造教研组',
  tenureLabel: '入职第 5 年',
  portraitTag: '双师型骨干教师',
  growthHint: '当前处于“强化校企协同 + 完善技能考核证据链”阶段',
};

const COMPONENT_META = [
  { key: 'graph', label: '图谱关联', color: '#0f766e' },
  { key: 'ability', label: '能力匹配', color: '#2563eb' },
  { key: 'evidence', label: '证据补强', color: '#f97316' },
  { key: 'quality', label: '资源质量', color: '#16a34a' },
  { key: 'freshness', label: '时效性', color: '#db2777' },
];

function buildFallbackTeacherProfile(profile = {}) {
  return {
    teacherId: 'teacher_zhou_lan',
    name: profile.name || PROFILE_BASE.name,
    schoolName: profile.schoolName || PROFILE_BASE.schoolName,
    departmentName: profile.departmentName || PROFILE_BASE.departmentName,
    roleName: profile.roleName || profile.roleTitle || PROFILE_BASE.roleTitle,
    targetLevel: profile.roleLevelName || '双师型骨干讲师',
  };
}

function getCurrentNodeName(record, schemes = []) {
  return schemes
    .find((scheme) => scheme.id === record.schemeId)
    ?.reviewFlow
    ?.find((node) => node.key === record.currentNode)
    ?.name || record.currentNode || '';
}

async function loadArchiveProfileContext() {
  await Promise.all([
    capabilityModelApi.seed(),
    teacherEvaluationApi.seed(),
  ]);

  const [
    industries,
    sequences,
    roles,
    models,
    evaluationSchemes,
    evaluationTeachers,
    evaluationRecords,
  ] = await Promise.all([
    capabilityModelApi.listIndustries(),
    capabilityModelApi.listSequences(),
    capabilityModelApi.listRoles(),
    capabilityModelApi.listModels(),
    teacherEvaluationApi.listSchemes(),
    teacherEvaluationApi.listTeachers(),
    teacherEvaluationApi.listRecords(),
  ]);

  const currentModel = pickCurrentTeacherModel(models, roles, sequences, {
    preferredRoleCode: 'VOCATIONAL_TEACHER',
    preferredLevelCode: 'DUAL',
  });
  const baseSnapshot = currentModel
    ? buildModelGrowthRecordSnapshot(currentModel, industries, roles, sequences)
    : null;
  const profileSnapshot = baseSnapshot ? {
    ...baseSnapshot,
    profile: {
      ...PROFILE_BASE,
      ...baseSnapshot.context,
    },
  } : null;
  const profile = profileSnapshot?.profile || PROFILE_BASE;
  const teacherProfile = evaluationTeachers.find((item) => item.name === profile.name)
    || buildFallbackTeacherProfile(profile);
  const evaluationRecordsWithNodeNames = evaluationRecords.map((record) => ({
    ...record,
    currentNodeName: getCurrentNodeName(record, evaluationSchemes),
  }));

  if (profileSnapshot) {
    await archiveVersionApi.seed({
      teacherProfile,
      baseSnapshot: profileSnapshot,
      evaluationRecords: evaluationRecordsWithNodeNames,
      evaluationSchemes,
    });
  }

  const versions = await archiveVersionApi.list({
    teacherProfile,
    evaluationRecords: evaluationRecordsWithNodeNames,
  });
  const latestVersion = versions[0] || null;

  return {
    teacherProfile,
    version: latestVersion,
    snapshot: latestVersion?.snapshot || profileSnapshot,
  };
}

function buildResourceInputs() {
  const resourceLibData = loadResourceLib();
  const knowledgeGraphState = loadKnowledgeGraphStore();
  const organizationResources = getAllItemsAcrossLibraries(resourceLibData)
    .filter((item) => item.libraryScope === 'organization')
    .map((item) => ({
      ...item,
      path: getLibraryItemPath(resourceLibData, item.libraryId, item.key),
    }));
  return {
    resourceLibData,
    organizations: getOrganizations(resourceLibData),
    tagDefinitions: getTagDefinitions(resourceLibData, 'organization'),
    resources: organizationResources,
    knowledgeGraphState,
  };
}

function scoreTone(score) {
  if (score >= 88) return 'excellent';
  if (score >= 76) return 'strong';
  if (score >= 64) return 'steady';
  return 'basic';
}

function ProfileSummary({ basis, stats, loading }) {
  const profile = basis?.profile || {};
  return (
    <section className="resource-rec-hero">
      <div className="resource-rec-hero-main">
        <div className="resource-rec-kicker">组织资料库推荐</div>
        <h2>根据用户档案推荐可复用资源</h2>
        <p>
          {basis?.hasProfile
            ? `当前依据 ${profile.name || '当前用户'} 的档案版本、目标层级、证据覆盖情况和知识图谱关系生成。`
            : '档案信息不足，当前按组织资料库标签、解析状态和更新时间生成降级推荐。'}
        </p>
        <div className="resource-rec-profile-tags">
          <Tag color="blue">{profile.roleName || profile.roleTitle || '用户档案'}</Tag>
          <Tag color="geekblue">{basis?.targetLevel || '当前目标层级'}</Tag>
          {profile.departmentName ? <Tag>{profile.departmentName}</Tag> : null}
        </div>
      </div>
      <div className="resource-rec-hero-metrics" aria-busy={loading}>
        <div>
          <span>档案覆盖</span>
          <strong>{basis?.overallCoverage == null ? '-' : `${basis.overallCoverage}%`}</strong>
        </div>
        <div>
          <span>待补证项</span>
          <strong>{basis?.focusItemCount ?? 0}</strong>
        </div>
        <div>
          <span>图谱命中</span>
          <strong>{stats?.graphLinkedRecommendationCount ?? 0}</strong>
        </div>
        <div>
          <span>知识点</span>
          <strong>{stats?.graphPointCount ?? 0}</strong>
        </div>
      </div>
    </section>
  );
}

function FilterPanel({
  activeFilter,
  onFilterChange,
  fileType,
  onFileTypeChange,
  reason,
  onReasonChange,
  libraryId,
  onLibraryChange,
  fileTypeOptions,
  reasonOptions,
  libraryOptions,
  stats,
}) {
  return (
    <aside className="resource-rec-filter-panel">
      <div className="resource-rec-filter-title">
        <FileSearchOutlined />
        <span>筛选推荐</span>
      </div>
      <div className="resource-rec-filter-list">
        {RECOMMENDATION_FILTERS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`resource-rec-filter-btn ${activeFilter === item.key ? 'is-active' : ''}`}
            onClick={() => onFilterChange(item.key)}
          >
            <span>{item.label}</span>
            <em>{item.key === 'all' ? stats?.recommendationCount || 0 : ''}</em>
          </button>
        ))}
      </div>

      <div className="resource-rec-select-group">
        <label>组织库</label>
        <Select value={libraryId} onChange={onLibraryChange} options={libraryOptions} />
      </div>
      <div className="resource-rec-select-group">
        <label>资源类型</label>
        <Select value={fileType} onChange={onFileTypeChange} options={fileTypeOptions} />
      </div>
      <div className="resource-rec-select-group">
        <label>推荐原因</label>
        <Select value={reason} onChange={onReasonChange} options={reasonOptions} />
      </div>

      <div className="resource-rec-filter-note">
        <InfoCircleOutlined />
        <span>每条推荐都会展示档案项、资源命中点和推荐动作，便于判断是否采纳。</span>
      </div>
    </aside>
  );
}

function ComponentBars({ scores = {} }) {
  return (
    <div className="resource-rec-score-bars">
      {COMPONENT_META.map((item) => (
        <div className="resource-rec-score-bar" key={item.key}>
          <div>
            <span>{item.label}</span>
            <strong>{scores[item.key] || 0}%</strong>
          </div>
          <Progress
            percent={scores[item.key] || 0}
            showInfo={false}
            strokeColor={item.color}
            trailColor="#e5e7eb"
            size="small"
          />
        </div>
      ))}
    </div>
  );
}

function EvidencePath({ path = [] }) {
  return (
    <div className="resource-rec-evidence-path">
      {path.map((node, index) => (
        <div className="resource-rec-path-node" key={`${node.label}_${index}`}>
          <span>{node.label}</span>
          <strong>{node.value}</strong>
          {index < path.length - 1 ? <ArrowRightOutlined /> : null}
        </div>
      ))}
    </div>
  );
}

function RecommendationCard({ recommendation, onOpen }) {
  const tone = scoreTone(recommendation.score);
  const componentScores = recommendation.meta?.componentScores || {};
  const matchedRows = recommendation.meta?.matchedRows || [];
  const graphMatches = recommendation.meta?.graphMatches || [];
  const primaryGraphMatch = graphMatches[0] || null;
  const details = [
    {
      key: 'why',
      label: '为什么推荐',
      children: (
        <div className="resource-rec-why">
          <EvidencePath path={recommendation.meta?.evidencePath || []} />
          {graphMatches.length ? (
            <div className="resource-rec-graph-grid">
              {graphMatches.map((match) => (
                <div key={`${match.graphId}_${match.pointId}`}>
                  <span>{match.matchType === 'binding' ? '图谱显式绑定' : '图谱语义命中'}</span>
                  <strong>{match.graphName} / {match.pointTitle}</strong>
                  {match.relationPath?.length ? (
                    <em>
                      关系：{match.relationPath.map((relation) => `${relation.label} ${relation.neighborTitle}`).join('；')}
                    </em>
                  ) : (
                    <em>暂无相邻关系路径</em>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="resource-rec-graph-empty">该资源暂无知识图谱绑定或知识点命中，本条为档案与组织资源规则降级推荐。</p>
          )}
          {matchedRows.length ? (
            <div className="resource-rec-match-grid">
              {matchedRows.map((row) => (
                <div key={`${row.dimensionName}_${row.itemName}`}>
                  <span>{row.groupKey === 'target' ? '目标提升项' : '证据不足项'}</span>
                  <strong>{row.dimensionName} / {row.itemName}</strong>
                  <em>当前覆盖度 {row.coverage}%</em>
                </div>
              ))}
            </div>
          ) : null}
          {recommendation.meta?.associationNote ? (
            <p className="resource-rec-association-note">{recommendation.meta.associationNote}</p>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <article className={`resource-rec-card is-${tone}`}>
      <div className="resource-rec-card-head">
        <div className="resource-rec-file-icon">
          {renderFileIcon(recommendation.meta?.fileType, { fontSize: 28 })}
        </div>
        <div className="resource-rec-title-block">
          <div className="resource-rec-title-line">
            <h3>{recommendation.title}</h3>
            <Tag>{getFileTypeLabel(recommendation.meta?.fileType)}</Tag>
          </div>
          <p>{recommendation.meta?.pathText}</p>
        </div>
        <div className="resource-rec-score">
          <span>匹配分</span>
          <strong>{recommendation.score}</strong>
        </div>
      </div>

      <div className="resource-rec-reason-row">
        <div>
          <AimOutlined />
          <strong>{recommendation.reasonSummary}</strong>
        </div>
        <Space size={[4, 6]} wrap>
          {(recommendation.reasonLabels || []).slice(0, 4).map((label) => (
            <Tag key={`${recommendation.id}_${label}`} color="blue">{label}</Tag>
          ))}
        </Space>
      </div>

      <p className="resource-rec-description">{recommendation.description}</p>
      <ComponentBars scores={componentScores} />

      <div className="resource-rec-card-meta">
        <span><DatabaseOutlined /> {recommendation.meta?.libraryName || '组织资料库'}</span>
        {primaryGraphMatch ? (
          <span><AimOutlined /> {primaryGraphMatch.graphName} / {primaryGraphMatch.pointTitle}</span>
        ) : (
          <span><InfoCircleOutlined /> 暂无图谱绑定</span>
        )}
        <span><CheckCircleOutlined /> {recommendation.meta?.parseStatus === 'parsed' ? '内容已解析' : '解析状态待确认'}</span>
        <span><ThunderboltOutlined /> {recommendation.meta?.lastEdit || '暂无更新时间'}</span>
      </div>

      <Collapse
        ghost
        items={details}
        className="resource-rec-collapse"
      />

      <div className="resource-rec-card-actions">
        <span>{recommendation.emphasis}</span>
        <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => onOpen(recommendation)}>
          去资料库
        </Button>
      </div>
    </article>
  );
}

export default function ResourceRecommendationModule({ onNavigateToResource }) {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [fileType, setFileType] = useState('all');
  const [reason, setReason] = useState('all');
  const [libraryId, setLibraryId] = useState('all');
  const exposedRecommendationIdsRef = useRef(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resourceInputs = buildResourceInputs();
      const profileContext = await loadArchiveProfileContext();
      const recommendationBundle = buildArchiveResourceRecommendations({
        ...profileContext,
        resources: resourceInputs.resources,
        tagDefinitions: resourceInputs.tagDefinitions,
        knowledgeGraphState: resourceInputs.knowledgeGraphState,
      });
      setBundle({
        ...recommendationBundle,
        organizations: resourceInputs.organizations,
      });
    } catch (error) {
      message.error(error?.message || '加载推荐失败');
      setBundle({
        basis: null,
        recommendations: [],
        stats: {
          organizationResourceCount: 0,
          recommendationCount: 0,
          averageScore: 0,
          topReasonLabel: '',
          focusItemCount: 0,
          missingLevelCount: 0,
        },
        organizations: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const recommendations = useMemo(() => bundle?.recommendations || [], [bundle?.recommendations]);

  const fileTypeOptions = useMemo(() => [
    { value: 'all', label: '全部类型' },
    ...Array.from(new Set(recommendations.map((item) => item.meta?.fileType).filter(Boolean))).map((type) => ({
      value: type,
      label: getFileTypeLabel(type),
    })),
  ], [recommendations]);

  const reasonOptions = useMemo(() => [
    { value: 'all', label: '全部原因' },
    ...Array.from(new Set(recommendations.flatMap((item) => item.reasonLabels || []))).map((label) => ({
      value: label,
      label,
    })),
  ], [recommendations]);

  const libraryOptions = useMemo(() => [
    { value: 'all', label: '全部组织库' },
    ...Array.from(new Map(recommendations.map((item) => [
      item.meta?.libraryId,
      {
        value: item.meta?.libraryId,
        label: item.meta?.libraryName || item.meta?.libraryId,
      },
    ])).values()).filter((item) => item.value),
  ], [recommendations]);

  const filteredRecommendations = useMemo(() => recommendations.filter((item) => {
    if (activeFilter !== 'all' && !(item.categories || []).includes(activeFilter)) return false;
    if (fileType !== 'all' && item.meta?.fileType !== fileType) return false;
    if (reason !== 'all' && !(item.reasonLabels || []).includes(reason)) return false;
    if (libraryId !== 'all' && item.meta?.libraryId !== libraryId) return false;
    return true;
  }), [activeFilter, fileType, libraryId, reason, recommendations]);

  useEffect(() => {
    filteredRecommendations.slice(0, 12).forEach((recommendation, index) => {
      const exposeKey = `${recommendation.id}_${index}`;
      if (exposedRecommendationIdsRef.current.has(exposeKey)) return;
      exposedRecommendationIdsRef.current.add(exposeKey);
      trackRecommendationEvent('expose', recommendation, {
        module: 'resource_recommendation',
        recommendPosition: 'org_resource_page',
        properties: {
          rank: index + 1,
          filter: activeFilter,
        },
      });
    });
  }, [activeFilter, filteredRecommendations]);

  const handleOpenResource = useCallback((recommendation) => {
    trackRecommendationEvent('click', recommendation, {
      module: 'resource_recommendation',
      recommendPosition: 'org_resource_page',
      objectType: 'resource',
      objectId: recommendation.target?.resourceKey || recommendation.id,
    });
    const navigationPayload = {
      scope: 'organization',
      libraryScope: 'organization',
      libraryId: recommendation.target?.libraryId,
      resourceKey: recommendation.target?.resourceKey,
      keyword: recommendation.target?.keyword || recommendation.title,
      source: 'resource_recommendation',
    };
    onNavigateToResource?.(navigationPayload);
  }, [onNavigateToResource]);

  return (
    <main className="resource-recommendation-module">
      <ProfileSummary basis={bundle?.basis} stats={bundle?.stats} loading={loading} />

      <div className="resource-rec-toolbar">
        <div>
          <RiseOutlined />
          <span>
            推荐依据：{bundle?.stats?.topReasonLabel || '档案匹配'} ·
            图谱 {bundle?.stats?.graphCount || 0} 个 / 知识点 {bundle?.stats?.graphPointCount || 0} 个 / 命中 {bundle?.stats?.graphLinkedRecommendationCount || 0} 条
          </span>
        </div>
        <Tooltip title="重新读取档案与组织资料库">
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
        </Tooltip>
      </div>

      <div className="resource-rec-content">
        <FilterPanel
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          fileType={fileType}
          onFileTypeChange={setFileType}
          reason={reason}
          onReasonChange={setReason}
          libraryId={libraryId}
          onLibraryChange={setLibraryId}
          fileTypeOptions={fileTypeOptions}
          reasonOptions={reasonOptions}
          libraryOptions={libraryOptions}
          stats={bundle?.stats}
        />

        <section className="resource-rec-list-shell">
          {loading ? (
            <div className="resource-rec-loading">
              <Spin size="large" />
              <span>正在读取档案和组织资料库</span>
            </div>
          ) : recommendations.length === 0 ? (
            <Empty description="组织资料库暂无可推荐资源" />
          ) : filteredRecommendations.length === 0 ? (
            <Empty description="当前筛选下暂无推荐资源" />
          ) : (
            <>
              <div className="resource-rec-list-head">
                <div>
                  <strong>{filteredRecommendations.length}</strong>
                  <span>条组织资源推荐</span>
                </div>
                <span>
                  {bundle?.basis?.hasProfile
                    ? `已结合知识图谱、档案证据缺口、目标层级和资源质量排序；图谱命中 ${bundle?.stats?.graphLinkedRecommendationCount || 0} 条`
                    : '档案不足时按组织资源质量排序'}
                </span>
              </div>
              <div className="resource-rec-list">
                {filteredRecommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onOpen={handleOpenResource}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
