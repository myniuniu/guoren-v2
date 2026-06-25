const COURSE_LEVEL_OPTIONS = ['小学', '初中', '高中', '职教', '高校', '教师培训'];

export const COURSE_DEPENDENCY_PRESETS = [
  {
    id: 'dep_beijing_outline',
    title: '《北京市中小学人工智能教育地方课程纲要》',
    region: '北京',
    category: '地方课程纲要',
    implication: '课程目标需体现人工智能素养、真实场景应用和伦理安全意识的递进。',
  },
  {
    id: 'dep_shanghai_guide',
    title: '《上海市中小学人工智能课程指南》',
    region: '上海',
    category: '课程指南',
    implication: '课程组织应兼顾探究式学习、项目实践和分层目标设计。',
  },
  {
    id: 'dep_guangdong_outline',
    title: '《广东省中小学人工智能课程指导纲要》',
    region: '广东',
    category: '指导纲要',
    implication: '课程内容需兼顾通识认知、工具应用、创新表达与区域实践案例。',
  },
  {
    id: 'dep_hangzhou_outline',
    title: '《杭州市中小学人工智能教育地方课程纲要》',
    region: '杭州',
    category: '地方课程纲要',
    implication: '课时安排应突出问题情境、任务体验和实践成果展示。',
  },
  {
    id: 'dep_inner_mongolia_outline',
    title: '《内蒙古自治区中小学人工智能课程纲要》',
    region: '内蒙古',
    category: '课程纲要',
    implication: '课程应兼顾普及性和差异化支持，避免对先验技术基础要求过高。',
  },
  {
    id: 'dep_fuzhou_guide',
    title: '《福州市中小学人工智能通识教育课程纲要与实施指南》',
    region: '福州',
    category: '实施指南',
    implication: '教学活动需要明确实施步骤、评价抓手和课后延伸路径。',
  },
];

export const COURSE_STRUCTURE_TEMPLATES = [
  {
    key: 'five-step',
    title: '五步教学法',
    subtitle: '导入→讲授→练习→小结→作业',
    description: '适合强调知识递进、课堂练习和课后巩固的常规课程。',
    steps: ['导入', '讲授', '练习', '小结', '作业'],
  },
  {
    key: 'five-e',
    title: '5E教学法',
    subtitle: '参与→探究→解释→拓展→评价',
    description: '适合围绕问题探究逐步建构概念与迁移应用的课程。',
    steps: ['参与', '探究', '解释', '拓展', '评价'],
  },
  {
    key: 'pbl',
    title: 'PBL教学法',
    subtitle: '项目驱动，解决真实问题',
    description: '适合跨知识点整合、产出导向和真实任务驱动课程。',
    steps: ['项目情境', '任务拆解', '协作研制', '成果发布', '复盘改进'],
  },
  {
    key: 'flipped',
    title: '翻转课堂',
    subtitle: '课前自学→课堂互动深化',
    description: '适合资料充分、需要把课堂时间留给互动和实践的主题。',
    steps: ['课前导学', '课堂答疑', '任务挑战', '同伴互评', '课后巩固'],
  },
  {
    key: 'ubd',
    title: 'UbD逆向设计',
    subtitle: '从目标出发逆向规划教学',
    description: '适合先锁定目标、证据与评价，再组织学习活动的课程。',
    steps: ['确定结果', '设计证据', '规划活动', '实施支架', '复盘校准'],
  },
  {
    key: 'custom',
    title: '自定义结构',
    subtitle: '自由定义课程结构',
    description: '适合已有成熟范式，需要按本校或本项目逻辑自定义阶段的课程。',
    steps: ['阶段一', '阶段二', '阶段三'],
  },
];

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      hour12: false,
    })
    .replace(/\//g, '-');
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimText(item)).filter(Boolean);
  }
  return String(value || '')
    .split('\n')
    .map((item) => trimText(item))
    .filter(Boolean);
}

function pluralizeLesson(index) {
  return `第 ${index + 1} 课时`;
}

export function getCourseLevelOptions() {
  return [...COURSE_LEVEL_OPTIONS];
}

export function getDependencyPresetById(id) {
  return COURSE_DEPENDENCY_PRESETS.find((item) => item.id === id) || null;
}

export function getStructureTemplateByKey(key) {
  return COURSE_STRUCTURE_TEMPLATES.find((item) => item.key === key) || COURSE_STRUCTURE_TEMPLATES[0];
}

export function summarizeCapabilityModel(model) {
  const dimensions = Array.isArray(model?.dimensions) ? model.dimensions : [];
  const dimensionSummaries = dimensions.map((dimension) => ({
    id: dimension.id,
    name: dimension.name || '未命名能力类',
    description: dimension.description || '',
    itemCount: (dimension.items || []).length,
    itemNames: (dimension.items || []).slice(0, 3).map((item) => item.name).filter(Boolean),
  }));

  return {
    id: model?.id || '',
    name: model?.name || '未选择能力模型',
    description: model?.description || '',
    levelLabels: (model?.levelScheme?.levels || []).map((item) => item.label).filter(Boolean),
    dimensionCount: dimensionSummaries.length,
    itemCount: dimensionSummaries.reduce((sum, item) => sum + item.itemCount, 0),
    dimensions: dimensionSummaries,
  };
}

export function summarizeKnowledgeGraph(graphBundle) {
  const graph = graphBundle?.graph || null;
  const points = Array.isArray(graphBundle?.points) ? graphBundle.points : [];
  const relations = Array.isArray(graphBundle?.relations) ? graphBundle.relations : [];
  const layout = graphBundle?.layout || {};
  const stages = Array.isArray(layout?.structuredView?.stages) ? layout.structuredView.stages : [];
  const pointPlacements = layout?.structuredView?.pointPlacements || {};

  const pointMap = new Map(points.map((point) => [point.id, point]));
  const stageSummaries = stages.map((stage) => {
    const stagePoints = Object.values(pointPlacements)
      .filter((placement) => placement.stageId === stage.id)
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .map((placement) => pointMap.get(placement.pointId))
      .filter(Boolean);
    const bindingCount = stagePoints.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0);
    const unboundCount = stagePoints.filter((point) => !(point.resourceBindings || []).length).length;
    return {
      id: stage.id,
      name: stage.name || '未命名阶段',
      description: stage.description || '',
      pointCount: stagePoints.length,
      pointTitles: stagePoints.map((point) => point.title),
      bindingCount,
      unboundCount,
    };
  });

  const bindingCount = points.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0);
  const unboundPoints = points.filter((point) => !(point.resourceBindings || []).length);

  return {
    id: graph?.id || '',
    name: graph?.name || '未选择知识图谱',
    description: graph?.description || '',
    pointCount: points.length,
    relationCount: relations.length,
    stageCount: stageSummaries.length,
    bindingCount,
    unboundPoints,
    stageSummaries,
  };
}

function buildCapabilityGoal(summary, project) {
  if (!summary.dimensionCount) {
    return ['当前尚未绑定能力模型，建议先确定课程目标再运行 Lucky。'];
  }

  return summary.dimensions.slice(0, 4).map((dimension, index) => {
    const itemText = dimension.itemNames.length
      ? `重点覆盖 ${dimension.itemNames.join('、')}`
      : '补充对应的能力项描述';
    return `${index + 1}. 面向${project.stage || '目标学段'}的“${dimension.name}”能力培养，${itemText}。`;
  });
}

function buildDependencyNotes(context) {
  const notes = context.dependencies.map((item, index) => ({
    id: item.id || `dep_${index}`,
    title: item.title,
    category: item.category || '自定义依赖',
    region: item.region || '自定义',
    implication: item.implication || `课程设计时需显式回应“${item.title}”提出的目标和实施要求。`,
  }));

  if (!notes.length) {
    notes.push({
      id: 'dep_default',
      title: '未指定外部依赖',
      category: '默认约束',
      region: '通用',
      implication: 'Lucky 将按课程目标与知识图谱主线生成课程，不追加地方政策约束。',
    });
  }
  return notes;
}

function buildStructureBlocks(context, graphSummary) {
  const template = context.structureTemplate;
  const customBlocks = normalizeStringArray(context.project.customStructureBlocks);
  const stageNames = graphSummary.stageSummaries.map((item) => item.name);
  const stepNames = template.key === 'custom' && customBlocks.length ? customBlocks : template.steps;

  return stepNames.map((stepName, index) => ({
    key: `${template.key}_${index}`,
    title: stepName,
    focus: graphSummary.stageSummaries[index]?.description
      || graphSummary.stageSummaries[index]?.pointTitles?.slice(0, 3).join('、')
      || `围绕${stageNames[index] || '课程目标'}组织学习活动`,
    linkedStageNames: stageNames.length ? [stageNames[index % stageNames.length]] : [],
    expectedArtifact: index === stepNames.length - 1 ? '学习单/作业/评价记录' : '阶段性任务成果',
  }));
}

function buildKnowledgePath(graphSummary) {
  if (!graphSummary.stageSummaries.length) {
    return [{
      id: 'path_default',
      stageName: '待补充知识主线',
      objective: '当前尚未绑定可解析的知识图谱阶段，请先完善阶段划分。',
      pointTitles: [],
      resourceHint: '建议补齐至少 3 个核心知识点和对应资源。',
    }];
  }

  return graphSummary.stageSummaries.map((stage, index) => ({
    id: stage.id,
    stageName: stage.name,
    objective: stage.description || `围绕 ${stage.name} 建立本阶段的学习目标和活动挑战。`,
    pointTitles: stage.pointTitles,
    resourceHint: stage.unboundCount
      ? `当前仍有 ${stage.unboundCount} 个知识点未绑定资料，建议先补齐演示素材或任务单。`
      : `已覆盖 ${stage.bindingCount} 条资料绑定，可直接支撑活动设计。`,
    sequence: index + 1,
  }));
}

function buildLessonPlan(context, structureBlocks, capabilitySummary, graphSummary) {
  const lessonCount = Math.max(1, Number(context.project.lessonCount || structureBlocks.length || 4));
  const dimensionNames = capabilitySummary.dimensions.map((item) => item.name);
  const stageNames = graphSummary.stageSummaries.map((item) => item.name);

  return Array.from({ length: lessonCount }, (_, index) => {
    const block = structureBlocks[index % structureBlocks.length];
    return {
      id: `lesson_${index + 1}`,
      title: pluralizeLesson(index),
      phase: block?.title || `阶段 ${index + 1}`,
      objective: dimensionNames.length
        ? `聚焦 ${dimensionNames[index % dimensionNames.length]}，完成“${block?.title || '学习任务'}”的阶段目标。`
        : `围绕课程主题完成“${block?.title || '学习任务'}”的阶段目标。`,
      linkedStage: stageNames[index % Math.max(stageNames.length, 1)] || '待补充知识主线',
      activity: block?.focus || '组织导学、练习与反馈活动。',
      deliverable: block?.expectedArtifact || '阶段性学习成果',
    };
  });
}

function buildActivitySuggestions(context, capabilitySummary, graphSummary) {
  const suggestions = [];

  capabilitySummary.dimensions.slice(0, 3).forEach((dimension, index) => {
    suggestions.push({
      id: `activity_cap_${index}`,
      title: `${dimension.name}任务`,
      description: `围绕 ${dimension.name} 设计一个与学段贴合的真实情境任务，优先覆盖 ${dimension.itemNames.join('、') || '核心能力项'}。`,
    });
  });

  graphSummary.stageSummaries.slice(0, 3).forEach((stage, index) => {
    suggestions.push({
      id: `activity_graph_${index}`,
      title: `${stage.name}探究`,
      description: `从知识图谱阶段“${stage.name}”中选取 ${stage.pointTitles.slice(0, 2).join('、') || '核心知识点'} 作为课堂探究主题。`,
    });
  });

  return suggestions.slice(0, 5);
}

function buildResourceSuggestions(graphSummary) {
  const suggestions = graphSummary.stageSummaries.map((stage) => ({
    id: `resource_${stage.id}`,
    title: `${stage.name}资源配置`,
    description: stage.bindingCount
      ? `当前已绑定 ${stage.bindingCount} 条资源，可优先复用其中的演示素材与任务单。`
      : `当前阶段尚未绑定资源，建议补充视频、讲义或任务单后再发布课程。`,
  }));

  if (!suggestions.length) {
    suggestions.push({
      id: 'resource_default',
      title: '补齐基础资源',
      description: '建议至少准备导学材料、活动任务单和形成性评价记录模板。',
    });
  }

  return suggestions.slice(0, 4);
}

function buildRiskNotes(context, capabilitySummary, graphSummary, dependencyNotes) {
  const notes = [];

  if (!context.project.capabilityModelId) {
    notes.push('尚未绑定能力模型，课程目标与能力映射仍不完整。');
  }
  if (!context.project.knowledgeGraphId) {
    notes.push('尚未绑定知识图谱，Lucky 无法给出完整的知识路径建议。');
  }
  if (graphSummary.unboundPoints.length) {
    notes.push(`知识图谱中仍有 ${graphSummary.unboundPoints.length} 个知识点未绑定资源，课堂实施时可能出现资料缺口。`);
  }
  if (!context.project.dependencyIds?.length && !normalizeStringArray(context.project.customDependencies).length) {
    notes.push('当前未指定课程依赖或政策依据，如需对齐地方课程要求建议补充依赖。');
  }
  if (!capabilitySummary.dimensionCount) {
    notes.push('能力目标尚未明确，建议至少绑定一个已发布能力模型后再定稿。');
  }
  if (dependencyNotes.length >= 3) {
    notes.push('已选依赖较多，建议在课程说明里明确“核心遵循版本”，避免要求冲突。');
  }

  return notes.slice(0, 5);
}

export function buildCourseGenerationContext(project, capabilityModel, graphBundle) {
  const dependencyIds = Array.isArray(project?.dependencyIds) ? project.dependencyIds : [];
  const customDependencies = normalizeStringArray(project?.customDependencies);
  const structureTemplate = getStructureTemplateByKey(project?.structureTemplateKey);

  return {
    project: {
      ...project,
      name: trimText(project?.name) || '未命名课程项目',
      stage: trimText(project?.stage) || '小学',
      subject: trimText(project?.subject) || '人工智能',
      audience: trimText(project?.audience) || '中小学教师',
      description: trimText(project?.description),
      lessonCount: Math.max(1, Number(project?.lessonCount || 6)),
      durationMinutes: Math.max(20, Number(project?.durationMinutes || 40)),
    },
    capabilitySummary: summarizeCapabilityModel(capabilityModel),
    graphSummary: summarizeKnowledgeGraph(graphBundle),
    structureTemplate,
    dependencies: [
      ...dependencyIds.map((id) => getDependencyPresetById(id)).filter(Boolean),
      ...customDependencies.map((title, index) => ({
        id: `custom_dep_${index}`,
        title,
        category: '自定义依赖',
        region: '自定义',
        implication: `课程需显式回应“${title}”提出的目标、内容或实施要求。`,
      })),
    ],
  };
}

export function buildLuckyCourseSummary(output) {
  const summary = `${output.projectName} · ${output.structureDesign.title} · ${output.lessonPlan.length} 课时`;
  const firstRisk = output.riskNotes[0] || '课程结构、目标与资源建议已生成。';
  const firstStage = output.knowledgePath[0]?.stageName || '课程主线';
  return {
    summary,
    content: `课程《${output.projectName}》已生成。当前采用 ${output.structureDesign.title}，主学习路径从“${firstStage}”展开。${firstRisk}`,
  };
}

export function runCourseStudioSkills(context) {
  const capabilityGoals = buildCapabilityGoal(context.capabilitySummary, context.project);
  const dependencyNotes = buildDependencyNotes(context);
  const knowledgePath = buildKnowledgePath(context.graphSummary);
  const structureBlocks = buildStructureBlocks(context, context.graphSummary);
  const lessonPlan = buildLessonPlan(context, structureBlocks, context.capabilitySummary, context.graphSummary);
  const activitySuggestions = buildActivitySuggestions(context, context.capabilitySummary, context.graphSummary);
  const resourceSuggestions = buildResourceSuggestions(context.graphSummary);
  const riskNotes = buildRiskNotes(context, context.capabilitySummary, context.graphSummary, dependencyNotes);

  const capabilityMappings = context.capabilitySummary.dimensions.map((dimension) => ({
    id: dimension.id,
    dimensionName: dimension.name,
    focusItems: dimension.itemNames,
    designHint: dimension.description || `围绕 ${dimension.name} 设置可观测学习产出与评价标准。`,
  }));

  const output = {
    projectName: context.project.name,
    generatedAt: nowText(),
    positioning: {
      stage: context.project.stage,
      subject: context.project.subject,
      audience: context.project.audience,
      lessonCount: context.project.lessonCount,
      durationMinutes: context.project.durationMinutes,
      description: context.project.description || '暂无补充说明',
    },
    courseObjectives: capabilityGoals,
    capabilityMappings,
    knowledgePath,
    dependencyNotes,
    structureDesign: {
      key: context.structureTemplate.key,
      title: context.structureTemplate.title,
      subtitle: context.structureTemplate.subtitle,
      description: context.structureTemplate.description,
      blocks: structureBlocks,
    },
    lessonPlan,
    activitySuggestions,
    resourceSuggestions,
    riskNotes,
  };

  const steps = [
    {
      key: 'goal-refinement',
      title: '课程目标提炼',
      status: 'success',
      summary: `已从 ${context.capabilitySummary.name} 中提炼 ${Math.max(capabilityGoals.length, 1)} 条课程目标。`,
    },
    {
      key: 'knowledge-path',
      title: '知识路径整理',
      status: 'success',
      summary: `已整理 ${context.graphSummary.stageCount || 0} 个阶段、${context.graphSummary.pointCount || 0} 个知识点。`,
    },
    {
      key: 'dependency-injection',
      title: '依赖约束注入',
      status: 'success',
      summary: `已注入 ${dependencyNotes.length} 条课程依赖与实施约束。`,
    },
    {
      key: 'structure-mapping',
      title: '结构模板映射',
      status: 'success',
      summary: `已按 ${context.structureTemplate.title} 生成 ${structureBlocks.length} 个结构块。`,
    },
    {
      key: 'course-package',
      title: '课程包生成',
      status: 'success',
      summary: `已输出 ${lessonPlan.length} 个课时建议及配套活动、资源与风险提示。`,
    },
  ];

  return {
    runId: createId('course_run'),
    status: 'success',
    createdAt: nowText(),
    inputSnapshot: {
      project: context.project,
      capabilityModelId: context.capabilitySummary.id,
      knowledgeGraphId: context.graphSummary.id,
      dependencyIds: context.dependencies.map((item) => item.id),
      structureTemplateKey: context.structureTemplate.key,
    },
    steps,
    output,
  };
}
