import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Tag,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  BookOutlined,
  BranchesOutlined,
  BulbOutlined,
  CopyOutlined,
  DeleteOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SaveOutlined,
  SendOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  getCapabilityModelStoreEventName,
} from '../capabilityModel/api';
import { getKnowledgeGraphStoreEventName } from '../knowledgeGraph/store';
import {
  courseStudioApi,
  COURSE_DEPENDENCY_PRESETS,
  COURSE_STRUCTURE_TEMPLATES,
  getCourseStudioStoreEventName,
} from './api';
import { getCourseLevelOptions, getStructureTemplateByKey } from './generation';
import './CourseStudioModule.css';

const { TextArea } = Input;

const STRUCTURE_ICON_MAP = {
  'five-step': <ApartmentOutlined />,
  'five-e': <BulbOutlined />,
  pbl: <BranchesOutlined />,
  flipped: <BookOutlined />,
  ubd: <SolutionOutlined />,
  custom: <NodeIndexOutlined />,
};

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 16);
}

function joinList(values = []) {
  return values.filter(Boolean).join('、') || '-';
}

function SupportSummaryCard({ icon, title, subtitle, metrics, children }) {
  return (
    <Card className="course-studio-support-card" variant="borderless">
      <div className="course-studio-support-head">
        <div className="course-studio-support-icon">{icon}</div>
        <div>
          <div className="course-studio-support-title">{title}</div>
          <div className="course-studio-support-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="course-studio-support-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="course-studio-support-metric">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      {children}
    </Card>
  );
}

function ResultSection({ title, children, extra }) {
  return (
    <Card
      className="course-studio-result-card"
      variant="borderless"
      title={<span className="course-studio-result-card-title">{title}</span>}
      extra={extra}
    >
      {children}
    </Card>
  );
}

export default function CourseStudioModule() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [capabilityModels, setCapabilityModels] = useState([]);
  const [graphs, setGraphs] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);

  const loadData = useCallback(async (keepSelection = true) => {
    setLoading(true);
    try {
      await courseStudioApi.seed();
      const [nextProjects, nextModels, nextGraphs] = await Promise.all([
        courseStudioApi.listProjects(),
        courseStudioApi.listCapabilityModels(),
        courseStudioApi.listKnowledgeGraphs(),
      ]);
      setProjects(nextProjects);
      setCapabilityModels(nextModels);
      setGraphs(nextGraphs);

      const fallbackId = keepSelection ? selectedProjectId : '';
      const nextSelectedId = nextProjects.find((item) => item.id === fallbackId)?.id || nextProjects[0]?.id || '';
      setSelectedProjectId(nextSelectedId);
      setDraft(nextProjects.find((item) => item.id === nextSelectedId) || null);
      setDirty(false);
    } catch (error) {
      message.error(error?.message || '加载课程创作中心失败');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData(false);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => {
      loadData(true);
    };
    window.addEventListener(getCourseStudioStoreEventName(), handleRefresh);
    window.addEventListener(getCapabilityModelStoreEventName(), handleRefresh);
    window.addEventListener(getKnowledgeGraphStoreEventName(), handleRefresh);
    return () => {
      window.removeEventListener(getCourseStudioStoreEventName(), handleRefresh);
      window.removeEventListener(getCapabilityModelStoreEventName(), handleRefresh);
      window.removeEventListener(getKnowledgeGraphStoreEventName(), handleRefresh);
    };
  }, [loadData]);

  const selectedProject = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const activeDraft = draft || selectedProject;
  const selectedModel = capabilityModels.find((item) => item.id === activeDraft?.capabilityModelId) || null;
  const selectedGraph = graphs.find((item) => item.id === activeDraft?.knowledgeGraphId) || null;
  const latestRun = activeDraft?.generationRuns?.[0] || null;
  const latestOutput = activeDraft?.latestOutput || null;

  const handleSelectProject = (project) => {
    if (!project) return;
    setSelectedProjectId(project.id);
    setDraft(project);
    setDirty(false);
  };

  const updateDraft = (patch) => {
    setDraft((current) => ({
      ...(current || courseStudioApi.createDraft()),
      ...patch,
    }));
    setDirty(true);
  };

  const handleSaveProject = async (nextDraft = draft) => {
    if (!nextDraft) return null;
    setSaving(true);
    try {
      const saved = await courseStudioApi.saveProject(nextDraft);
      setSelectedProjectId(saved.id);
      setDraft(saved);
      setDirty(false);
      await loadData(true);
      message.success('课程项目已保存');
      return saved;
    } catch (error) {
      message.error(error?.message || '保存课程项目失败');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async () => {
    const nextDraft = courseStudioApi.createDraft({
      name: `AI课程项目 ${projects.length + 1}`,
      capabilityModelId: capabilityModels[0]?.id || '',
      knowledgeGraphId: graphs[0]?.id || '',
    });
    setSaving(true);
    try {
      const saved = await courseStudioApi.saveProject(nextDraft);
      await loadData(false);
      setSelectedProjectId(saved.id);
      setDraft(saved);
      setDirty(false);
      message.success('已创建课程项目');
    } catch (error) {
      message.error(error?.message || '创建课程项目失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateProject = async (projectId) => {
    setSaving(true);
    try {
      const duplicated = await courseStudioApi.duplicateProject(projectId);
      await loadData(false);
      setSelectedProjectId(duplicated.id);
      setDraft(duplicated);
      setDirty(false);
      message.success('课程项目已复制');
    } catch (error) {
      message.error(error?.message || '复制课程项目失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProject = (project) => {
    Modal.confirm({
      title: `删除课程项目「${project.name}」`,
      content: '删除后将同时清空该项目的 Lucky 生成记录。',
      okButtonProps: { danger: true },
      onOk: async () => {
        await courseStudioApi.removeProject(project.id);
        await loadData(false);
        message.success('课程项目已删除');
      },
    });
  };

  const handleRunLucky = async () => {
    if (!activeDraft) return;
    setGenerating(true);
    try {
      const saved = dirty ? await handleSaveProject(activeDraft) : activeDraft;
      if (!saved?.id) return;
      const result = await courseStudioApi.runCourseGeneration(saved.id);
      setSelectedProjectId(result.project.id);
      setDraft(result.project);
      setDirty(false);
      await loadData(true);
      message.success('Lucky 已生成课程结果并同步到消息会话');
    } catch (error) {
      message.error(error?.message || 'Lucky 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const structureTemplate = getStructureTemplateByKey(activeDraft?.structureTemplateKey);
  const courseLevelOptions = getCourseLevelOptions().map((item) => ({ label: item, value: item }));

  if (loading && !activeDraft) {
    return (
      <div className="course-studio-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="course-studio-module">
      <div className="course-studio-sidebar">
        <div className="course-studio-sidebar-head">
          <div>
            <div className="course-studio-sidebar-title">课程项目</div>
            <div className="course-studio-sidebar-subtitle">管理 Lucky 的课程创作任务</div>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject} loading={saving}>
            新建
          </Button>
        </div>

        <div className="course-studio-project-list">
          {projects.length ? (
            projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={`course-studio-project-item ${selectedProjectId === project.id ? 'is-active' : ''}`}
                onClick={() => handleSelectProject(project)}
              >
                <div className="course-studio-project-top">
                  <strong>{project.name}</strong>
                  <Tag color={project.status === 'generated' ? 'success' : 'processing'}>
                    {project.status === 'generated' ? '已生成' : '草稿'}
                  </Tag>
                </div>
                <span>{project.stage} · {project.subject}</span>
                <span>{project.lessonCount} 课时 · 最近更新 {formatDateTime(project.updatedAt)}</span>
                <div className="course-studio-project-actions">
                  <Button size="small" icon={<CopyOutlined />} onClick={(event) => {
                    event.stopPropagation();
                    handleDuplicateProject(project.id);
                  }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveProject(project);
                    }}
                  />
                </div>
              </button>
            ))
          ) : (
            <Empty description="暂无课程项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>

      <div className="course-studio-main">
        {activeDraft ? (
          <>
            <Card className="course-studio-hero-card" variant="borderless">
              <div className="course-studio-hero-head">
                <div>
                  <div className="course-studio-eyebrow">课程创作中心</div>
                  <h2>{activeDraft.name || '未命名课程项目'}</h2>
                  <p>
                    绑定能力模型、知识图谱、课程依赖和课程结构后，交给 Lucky 生成结构化课程方案。
                  </p>
                </div>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={() => loadData(true)} loading={loading}>
                    刷新
                  </Button>
                  <Button icon={<SaveOutlined />} onClick={() => handleSaveProject(activeDraft)} loading={saving}>
                    保存项目
                  </Button>
                  <Button type="primary" icon={<RobotOutlined />} onClick={handleRunLucky} loading={generating}>
                    Lucky 生成
                  </Button>
                </Space>
              </div>

              <div className="course-studio-hero-grid">
                <Input
                  value={activeDraft.name}
                  placeholder="课程项目名称"
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
                <Select
                  value={activeDraft.stage}
                  options={courseLevelOptions}
                  onChange={(value) => updateDraft({ stage: value })}
                />
                <Input
                  value={activeDraft.subject}
                  placeholder="学科，如人工智能"
                  onChange={(event) => updateDraft({ subject: event.target.value })}
                />
                <Input
                  value={activeDraft.audience}
                  placeholder="目标对象"
                  onChange={(event) => updateDraft({ audience: event.target.value })}
                />
                <InputNumber
                  min={1}
                  max={32}
                  value={activeDraft.lessonCount}
                  onChange={(value) => updateDraft({ lessonCount: value || 1 })}
                  className="course-studio-input-number"
                />
                <InputNumber
                  min={20}
                  max={180}
                  step={5}
                  value={activeDraft.durationMinutes}
                  onChange={(value) => updateDraft({ durationMinutes: value || 40 })}
                  className="course-studio-input-number"
                />
              </div>

              <TextArea
                rows={3}
                value={activeDraft.description}
                placeholder="补充课程背景、使用场景、交付要求或教研目标"
                onChange={(event) => updateDraft({ description: event.target.value })}
              />
              {dirty ? <Alert type="info" showIcon message="当前项目有未保存修改，运行 Lucky 前会先自动保存。" /> : null}
            </Card>

            <div className="course-studio-support-grid">
              <SupportSummaryCard
                icon={<SolutionOutlined />}
                title="能力模型"
                subtitle={selectedModel?.name || '选择 1 个能力模型作为课程目标来源'}
                metrics={[
                  { label: '能力类', value: selectedModel?.dimensions?.length || 0 },
                  { label: '能力项', value: (selectedModel?.dimensions || []).reduce((sum, item) => sum + (item.items?.length || 0), 0) },
                ]}
              >
                <Select
                  value={activeDraft.capabilityModelId || undefined}
                  placeholder="选择能力模型"
                  options={capabilityModels.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={(value) => updateDraft({ capabilityModelId: value })}
                />
                {selectedModel ? (
                  <div className="course-studio-support-tags">
                    {(selectedModel.dimensions || []).slice(0, 4).map((dimension) => (
                      <Tag key={dimension.id || dimension.name}>{dimension.name}</Tag>
                    ))}
                  </div>
                ) : null}
              </SupportSummaryCard>

              <SupportSummaryCard
                icon={<NodeIndexOutlined />}
                title="知识图谱"
                subtitle={selectedGraph?.name || '选择 1 张知识图谱作为学习路径'}
                metrics={[
                  { label: '阶段数', value: selectedGraph?.stageCount || 0 },
                  { label: '知识点', value: selectedGraph?.pointCount || 0 },
                  { label: '资源绑定', value: selectedGraph?.bindingCount || 0 },
                ]}
              >
                <Select
                  value={activeDraft.knowledgeGraphId || undefined}
                  placeholder="选择知识图谱"
                  options={graphs.map((item) => ({
                    label: `${item.name} · ${item.collectionName}`,
                    value: item.id,
                  }))}
                  onChange={(value) => updateDraft({ knowledgeGraphId: value })}
                />
                {selectedGraph ? (
                  <div className="course-studio-support-inline">
                    <Tag color="blue">{selectedGraph.collectionName}</Tag>
                    <span>{selectedGraph.stageCount} 个阶段 / {selectedGraph.pointCount} 个知识点</span>
                  </div>
                ) : null}
              </SupportSummaryCard>
            </div>

            <Card className="course-studio-panel-card" variant="borderless">
              <div className="course-studio-section-head">
                <div>
                  <div className="course-studio-section-title">课程依赖</div>
                  <div className="course-studio-section-desc">选择要纳入 Lucky 设计约束的课程纲要、指南或自定义依据。</div>
                </div>
              </div>
              <div className="course-studio-dependency-grid">
                {COURSE_DEPENDENCY_PRESETS.map((dependency) => {
                  const active = activeDraft.dependencyIds.includes(dependency.id);
                  return (
                    <button
                      key={dependency.id}
                      type="button"
                      className={`course-studio-dependency-card ${active ? 'is-active' : ''}`}
                      onClick={() => updateDraft({
                        dependencyIds: active
                          ? activeDraft.dependencyIds.filter((item) => item !== dependency.id)
                          : [...activeDraft.dependencyIds, dependency.id],
                      })}
                    >
                      <div className="course-studio-dependency-top">
                        <Tag color={active ? 'blue' : 'default'}>{dependency.region}</Tag>
                        <span>{dependency.category}</span>
                      </div>
                      <strong>{dependency.title}</strong>
                      <p>{dependency.implication}</p>
                    </button>
                  );
                })}
              </div>

              <div className="course-studio-custom-field">
                <div className="course-studio-field-label">自定义依赖</div>
                <Select
                  mode="tags"
                  value={activeDraft.customDependencies}
                  placeholder="补充校本要求、项目约束或其他课程依据"
                  onChange={(value) => updateDraft({ customDependencies: value })}
                  tokenSeparators={[',']}
                />
              </div>
            </Card>

            <Card className="course-studio-panel-card" variant="borderless">
              <div className="course-studio-section-head">
                <div>
                  <div className="course-studio-section-title">课程结构</div>
                  <div className="course-studio-section-desc">Lucky 将把所选结构模板映射成课时组织方式。</div>
                </div>
              </div>
              <div className="course-studio-structure-grid">
                {COURSE_STRUCTURE_TEMPLATES.map((template) => {
                  const active = activeDraft.structureTemplateKey === template.key;
                  return (
                    <button
                      key={template.key}
                      type="button"
                      className={`course-studio-structure-card ${active ? 'is-active' : ''}`}
                      onClick={() => updateDraft({ structureTemplateKey: template.key })}
                    >
                      <div className="course-studio-structure-icon">
                        {STRUCTURE_ICON_MAP[template.key] || <ApartmentOutlined />}
                      </div>
                      <strong>{template.title}</strong>
                      <span>{template.subtitle}</span>
                    </button>
                  );
                })}
              </div>
              <div className="course-studio-structure-desc">{structureTemplate.description}</div>

              {activeDraft.structureTemplateKey === 'custom' ? (
                <div className="course-studio-custom-field">
                  <div className="course-studio-field-label">自定义阶段</div>
                  <Select
                    mode="tags"
                    value={activeDraft.customStructureBlocks}
                    placeholder="输入自定义课程阶段，如：情境导入、项目创作、成果答辩"
                    onChange={(value) => updateDraft({ customStructureBlocks: value })}
                    tokenSeparators={[',']}
                  />
                </div>
              ) : null}
            </Card>

            <div className="course-studio-generation-grid">
              <Card className="course-studio-panel-card" variant="borderless">
                <div className="course-studio-section-head">
                  <div>
                    <div className="course-studio-section-title">Lucky 技能链</div>
                    <div className="course-studio-section-desc">Lucky 会按固定 5 步，把课程信息转成结构化课程方案。</div>
                  </div>
                </div>
                <Steps
                  direction="vertical"
                  size="small"
                  current={latestRun ? latestRun.steps.length - 1 : 4}
                  items={(latestRun?.steps || [
                    { title: '课程目标提炼', description: '从能力模型提取维度、目标层级和核心成果。', status: 'process' },
                    { title: '知识路径整理', description: '从知识图谱提取阶段主线、知识点和资料缺口。', status: 'process' },
                    { title: '依赖约束注入', description: '把政策与校本依赖转成设计约束。', status: 'process' },
                    { title: '结构模板映射', description: '按选定模板形成课程结构块。', status: 'process' },
                    { title: '课程包生成', description: '输出课程目标、课时安排、活动与风险提示。', status: 'process' },
                  ]).map((item) => ({
                    title: item.title,
                    description: item.summary || item.description,
                    status: item.status || 'process',
                  }))}
                />
                <Alert
                  showIcon
                  type="warning"
                  message="Lucky 输出会同步一条摘要到消息会话"
                  description="完整结果以本页面的结构化结果页为主，Lucky 会话仅保留摘要。"
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleRunLucky} loading={generating} block>
                  运行 Lucky 课程生成
                </Button>
              </Card>

              <Card className="course-studio-panel-card" variant="borderless">
                <div className="course-studio-section-head">
                  <div>
                    <div className="course-studio-section-title">最近生成记录</div>
                    <div className="course-studio-section-desc">保留最近 10 次 Lucky 运行快照。</div>
                  </div>
                </div>
                {(activeDraft.generationRuns || []).length ? (
                  <div className="course-studio-run-list">
                    {activeDraft.generationRuns.map((run) => (
                      <div key={run.runId} className="course-studio-run-item">
                        <div className="course-studio-run-top">
                          <strong>{run.output?.projectName || activeDraft.name}</strong>
                          <Tag color="success">已同步</Tag>
                        </div>
                        <span>{formatDateTime(run.createdAt)}</span>
                        <span>{run.output?.structureDesign?.title || '-'} · {run.output?.lessonPlan?.length || 0} 课时</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="尚未生成课程结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </div>

            {latestOutput ? (
              <div className="course-studio-result-stack">
                <ResultSection
                  title="课程定位"
                  extra={<Tag color="blue">{latestOutput.positioning.stage} · {latestOutput.positioning.subject}</Tag>}
                >
                  <div className="course-studio-stat-grid">
                    <Statistic title="目标对象" value={latestOutput.positioning.audience} />
                    <Statistic title="课时数" value={latestOutput.positioning.lessonCount} suffix="课时" />
                    <Statistic title="单课时长" value={latestOutput.positioning.durationMinutes} suffix="分钟" />
                  </div>
                  <p className="course-studio-result-paragraph">{latestOutput.positioning.description}</p>
                </ResultSection>

                <ResultSection title="课程目标">
                  <div className="course-studio-bullet-list">
                    {latestOutput.courseObjectives.map((item) => (
                      <div key={item} className="course-studio-bullet-item">{item}</div>
                    ))}
                  </div>
                </ResultSection>

                <ResultSection title="能力目标映射">
                  <div className="course-studio-grid-2">
                    {latestOutput.capabilityMappings.map((mapping) => (
                      <div key={mapping.id || mapping.dimensionName} className="course-studio-mini-card">
                        <strong>{mapping.dimensionName}</strong>
                        <span>{joinList(mapping.focusItems)}</span>
                        <p>{mapping.designHint}</p>
                      </div>
                    ))}
                  </div>
                </ResultSection>

                <ResultSection title="知识图谱学习路径">
                  <div className="course-studio-path-list">
                    {latestOutput.knowledgePath.map((stage) => (
                      <div key={stage.id} className="course-studio-path-item">
                        <div className="course-studio-path-index">{stage.sequence || '-'}</div>
                        <div>
                          <strong>{stage.stageName}</strong>
                          <p>{stage.objective}</p>
                          <span>知识点：{joinList(stage.pointTitles)}</span>
                          <span>{stage.resourceHint}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultSection>

                <ResultSection title="课程依赖说明">
                  <div className="course-studio-grid-2">
                    {latestOutput.dependencyNotes.map((dependency) => (
                      <div key={dependency.id} className="course-studio-mini-card">
                        <strong>{dependency.title}</strong>
                        <span>{dependency.region} · {dependency.category}</span>
                        <p>{dependency.implication}</p>
                      </div>
                    ))}
                  </div>
                </ResultSection>

                <ResultSection title="课程结构设计">
                  <div className="course-studio-structure-result-head">
                    <div>
                      <strong>{latestOutput.structureDesign.title}</strong>
                      <span>{latestOutput.structureDesign.subtitle}</span>
                    </div>
                    <Tag color="processing">{latestOutput.structureDesign.blocks.length} 个结构块</Tag>
                  </div>
                  <div className="course-studio-grid-2">
                    {latestOutput.structureDesign.blocks.map((block) => (
                      <div key={block.key} className="course-studio-mini-card">
                        <strong>{block.title}</strong>
                        <span>关联阶段：{joinList(block.linkedStageNames)}</span>
                        <p>{block.focus}</p>
                        <Tag>{block.expectedArtifact}</Tag>
                      </div>
                    ))}
                  </div>
                </ResultSection>

                <ResultSection title="课时安排">
                  <div className="course-studio-lesson-list">
                    {latestOutput.lessonPlan.map((lesson) => (
                      <div key={lesson.id} className="course-studio-lesson-item">
                        <div>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.phase} · {lesson.linkedStage}</span>
                        </div>
                        <p>{lesson.objective}</p>
                        <span>活动建议：{lesson.activity}</span>
                        <span>阶段产出：{lesson.deliverable}</span>
                      </div>
                    ))}
                  </div>
                </ResultSection>

                <div className="course-studio-result-grid">
                  <ResultSection title="关键活动建议">
                    <div className="course-studio-bullet-list">
                      {latestOutput.activitySuggestions.map((item) => (
                        <div key={item.id} className="course-studio-bullet-item">
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </ResultSection>

                  <ResultSection title="资源与资料建议">
                    <div className="course-studio-bullet-list">
                      {latestOutput.resourceSuggestions.map((item) => (
                        <div key={item.id} className="course-studio-bullet-item">
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </ResultSection>
                </div>

                <ResultSection title="风险与待补项" extra={<Tag color="gold">{latestOutput.riskNotes.length} 项</Tag>}>
                  <div className="course-studio-bullet-list">
                    {latestOutput.riskNotes.map((item) => (
                      <div key={item} className="course-studio-bullet-item">{item}</div>
                    ))}
                  </div>
                </ResultSection>
              </div>
            ) : (
              <Card className="course-studio-panel-card" variant="borderless">
                <Empty description="尚未生成课程结果，配置好支撑信息后运行 Lucky。" />
              </Card>
            )}
          </>
        ) : (
          <Card className="course-studio-panel-card" variant="borderless">
            <Empty description="先创建一个课程项目" />
          </Card>
        )}
      </div>
    </div>
  );
}
