const STORAGE_KEY = 'gr.knowledge-graph.v1';
const STORE_CHANGE_EVENT = 'gr:knowledge-graph-change';

export const KNOWLEDGE_POINT_TYPE_OPTIONS = [
  { value: 'TOPIC', label: '主题' },
  { value: 'CONCEPT', label: '概念' },
  { value: 'SKILL', label: '技能' },
  { value: 'CASE', label: '案例' },
  { value: 'RESOURCE', label: '资源' },
];

export const RELATION_TYPE_OPTIONS = [
  { value: 'CONTAINS', label: '包含' },
  { value: 'PRECEDES', label: '前置' },
  { value: 'RELATED', label: '相关' },
  { value: 'CASE_OF', label: '案例' },
  { value: 'APPLIES_TO', label: '应用于' },
];

const RELATION_LABEL_MAP = Object.fromEntries(RELATION_TYPE_OPTIONS.map((item) => [item.value, item.label]));
const EDGE_LINE_STYLE_OPTIONS = ['solid', 'dashed', 'dotted'];
const EDGE_PATH_STYLE_OPTIONS = ['smoothstep', 'straight', 'step'];
const EDGE_MARKER_TYPE_OPTIONS = ['arrowclosed', 'arrow', 'none'];
const EDGE_START_MARKER_OPTIONS = ['none', 'arrow'];

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

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeTags(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  return Array.from(new Set(source.map((item) => trimText(item)).filter(Boolean)));
}

function sanitizeEdgeLineStyle(value, fallback = 'solid') {
  return EDGE_LINE_STYLE_OPTIONS.includes(value) ? value : fallback;
}

function sanitizeEdgeStrokeColor(value, fallback) {
  const color = trimText(value);
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : fallback;
}

function sanitizeEdgeStrokeWidth(value, fallback = 2) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(1, Math.min(8, next));
}

function sanitizeEdgeAnimated(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function sanitizeEdgePathStyle(value, fallback = 'smoothstep') {
  return EDGE_PATH_STYLE_OPTIONS.includes(value) ? value : fallback;
}

function sanitizeEdgeMarkerType(value, fallback = 'arrowclosed') {
  return EDGE_MARKER_TYPE_OPTIONS.includes(value) ? value : fallback;
}

function sanitizeEdgeStartMarker(value, fallback = 'none') {
  return EDGE_START_MARKER_OPTIONS.includes(value) ? value : fallback;
}

function sanitizeEdgeOpacity(value, fallback = 100) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.min(100, next));
}

function normalizeRelationAppearance(relation = {}) {
  const relationType = relation.relationType || 'RELATED';
  const fallbackAnimated = relationType === 'PRECEDES';
  return {
    strokeColor: sanitizeEdgeStrokeColor(relation.strokeColor, '#a78bfa'),
    strokeWidth: sanitizeEdgeStrokeWidth(relation.strokeWidth, 1.8),
    lineStyle: sanitizeEdgeLineStyle(relation.lineStyle, 'solid'),
    pathStyle: sanitizeEdgePathStyle(relation.pathStyle, 'smoothstep'),
    markerType: sanitizeEdgeMarkerType(relation.markerType, 'arrowclosed'),
    startMarker: sanitizeEdgeStartMarker(relation.startMarker, 'none'),
    opacity: sanitizeEdgeOpacity(relation.opacity, 100),
    animated: sanitizeEdgeAnimated(relation.animated, fallbackAnimated),
  };
}

function normalizeStageEdgeAppearance(edge = {}) {
  return {
    strokeColor: sanitizeEdgeStrokeColor(edge.strokeColor, '#60a5fa'),
    strokeWidth: sanitizeEdgeStrokeWidth(edge.strokeWidth, 2),
    lineStyle: sanitizeEdgeLineStyle(edge.lineStyle, 'solid'),
    pathStyle: sanitizeEdgePathStyle(edge.pathStyle, 'smoothstep'),
    markerType: sanitizeEdgeMarkerType(edge.markerType, 'arrowclosed'),
    startMarker: sanitizeEdgeStartMarker(edge.startMarker, 'none'),
    opacity: sanitizeEdgeOpacity(edge.opacity, 100),
    animated: sanitizeEdgeAnimated(edge.animated, false),
  };
}

const STAGE_EDGE_HANDLE_IDS = new Set([
  'stage-source-top',
  'stage-source-right',
  'stage-source-bottom',
  'stage-source-left',
  'stage-target-top',
  'stage-target-right',
  'stage-target-bottom',
  'stage-target-left',
]);

function sanitizeStageEdgeHandle(handleId, fallback = null) {
  if (!handleId) return fallback;
  return STAGE_EDGE_HANDLE_IDS.has(handleId) ? handleId : fallback;
}

function buildSection(id, title, color, description, sortNo) {
  return { id, title, color, description, sortNo };
}

function buildStructuredStage(id, name, color, description, sortNo) {
  return {
    id,
    name,
    color,
    description,
    sortNo,
    layoutColumns: 1,
  };
}

function sanitizeStageLayoutColumns(value) {
  return Math.max(1, Math.min(3, Number(value || 1) || 1));
}

function createDefaultSections() {
  return [
    buildSection(createId('kg_section'), '顶层概览', '#2f7e79', '呈现总主题、总目标或关键主线。', 1),
    buildSection(createId('kg_section'), '核心模块', '#4667d6', '按能力域或知识模块拆分主体内容。', 2),
    buildSection(createId('kg_section'), '实践与应用', '#8a58d6', '放置项目、案例、创作与任务型知识点。', 3),
    buildSection(createId('kg_section'), '规则与评估', '#da7f44', '放置边界、安全、评价与治理相关知识点。', 4),
  ];
}

function createDefaultStructuredStages() {
  return createDefaultSections().map((section, index) => buildStructuredStage(
    section.id,
    section.title,
    section.color,
    section.description,
    index + 1,
  ));
}

function getStructuredStagePosition(index) {
  return {
    x: index * 360,
    y: 0,
  };
}

function getStructuredStageSize() {
  return {
    width: 332,
  };
}

function getStructuredPointPosition(order = 1) {
  return {
    x: 18,
    y: 56 + Math.max(0, order - 1) * 162,
  };
}

function buildLegacyCurriculumViewFromStructured(structuredView) {
  const stages = Array.isArray(structuredView?.stages) ? structuredView.stages : [];
  const sections = stages.map((stage, index) => buildSection(
    stage.id,
    stage.name,
    stage.color,
    stage.description,
    Number(stage.sortNo || index + 1),
  ));
  const cards = {};
  Object.values(structuredView?.pointPlacements || {}).forEach((placement) => {
    cards[placement.pointId] = {
      pointId: placement.pointId,
      sectionId: placement.stageId,
      order: Number(placement.order || 1),
      width: 'normal',
    };
  });
  return { sections, cards };
}

function buildStructuredViewFromLegacy(layout, pointsForGraph = []) {
  const legacySections = Array.isArray(layout?.curriculumView?.sections) && layout.curriculumView.sections.length
    ? layout.curriculumView.sections
    : createDefaultSections();
  const legacyCards = layout?.curriculumView?.cards || {};
  const stages = legacySections.map((section, index) => buildStructuredStage(
    section.id,
    trimText(section.title) || trimText(section.name) || `分区 ${index + 1}`,
    section.color || '#4667d6',
    trimText(section.description),
    Number(section.sortNo || index + 1),
  ));
  const stageIds = new Set(stages.map((stage) => stage.id));
  const pointPlacements = {};
  const pointPositions = {};
  const stagePositions = {};
  const stageSizes = {};

  stages.forEach((stage, index) => {
    stagePositions[stage.id] = getStructuredStagePosition(index);
    stageSizes[stage.id] = getStructuredStageSize();
  });

  pointsForGraph.forEach((point, index) => {
    const legacyCard = legacyCards[point.id] || {};
    const stageId = stageIds.has(legacyCard.sectionId) ? legacyCard.sectionId : stages[0]?.id;
    pointPlacements[point.id] = {
      pointId: point.id,
      stageId,
      order: Number(legacyCard.order || index + 1),
    };
  });

  stages.forEach((stage) => {
    const stagePoints = Object.values(pointPlacements)
      .filter((placement) => placement.stageId === stage.id)
      .sort((left, right) => (left.order || 0) - (right.order || 0));
    stagePoints.forEach((placement, index) => {
      pointPlacements[placement.pointId] = {
        ...placement,
        order: index + 1,
      };
      pointPositions[placement.pointId] = getStructuredPointPosition(index + 1);
    });
  });

  return {
    stages,
    pointPlacements,
    pointPositions,
    stagePositions,
    stageSizes,
    stageEdges: [],
  };
}

function normalizeStructuredView(layout, pointsForGraph = []) {
  const source = layout?.structuredView
    ? clone(layout.structuredView)
    : buildStructuredViewFromLegacy(layout, pointsForGraph);

  let stages = Array.isArray(source.stages) && source.stages.length
    ? source.stages
    : createDefaultStructuredStages();

  stages = stages
    .map((stage, index) => ({
      ...buildStructuredStage(
        stage.id || createId('kg_stage'),
        trimText(stage.name) || trimText(stage.title) || `分区 ${index + 1}`,
        stage.color || '#4667d6',
        trimText(stage.description),
        Number(stage.sortNo || index + 1),
      ),
      layoutColumns: sanitizeStageLayoutColumns(stage.layoutColumns),
    }))
    .sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0))
    .map((stage, index) => ({
      ...stage,
      sortNo: index + 1,
    }));

  const stageIds = new Set(stages.map((stage) => stage.id));
  const pointIds = new Set(pointsForGraph.map((point) => point.id));
  const pointPlacements = {};
  const pointPositions = { ...(source.pointPositions || {}) };
  const stagePositions = { ...(source.stagePositions || {}) };
  const stageSizes = { ...(source.stageSizes || {}) };
  const sourcePlacements = source.pointPlacements || {};

  pointsForGraph.forEach((point, index) => {
    const placement = sourcePlacements[point.id] || {};
    const stageId = stageIds.has(placement.stageId) ? placement.stageId : stages[0]?.id;
    pointPlacements[point.id] = {
      pointId: point.id,
      stageId,
      order: Number(placement.order || index + 1),
    };
  });

  Object.keys(pointPositions).forEach((pointId) => {
    if (!pointIds.has(pointId)) {
      delete pointPositions[pointId];
    }
  });

  stages.forEach((stage, stageIndex) => {
    if (!stagePositions[stage.id]) {
      stagePositions[stage.id] = getStructuredStagePosition(stageIndex);
    }
    if (!stageSizes[stage.id]) {
      stageSizes[stage.id] = getStructuredStageSize();
    }
    const stagePoints = Object.values(pointPlacements)
      .filter((placement) => placement.stageId === stage.id)
      .sort((left, right) => (left.order || 0) - (right.order || 0));
    stagePoints.forEach((placement, index) => {
      pointPlacements[placement.pointId] = {
        ...placement,
        order: index + 1,
      };
      if (!pointPositions[placement.pointId]) {
        pointPositions[placement.pointId] = getStructuredPointPosition(index + 1);
      }
    });
  });

  const stageEdges = Array.isArray(source.stageEdges)
    ? source.stageEdges
      .filter((edge) => stageIds.has(edge.source) && stageIds.has(edge.target) && edge.source !== edge.target)
      .map((edge) => ({
        id: edge.id || createId('kg_stage_edge'),
        source: edge.source,
        target: edge.target,
        sourceHandle: sanitizeStageEdgeHandle(edge.sourceHandle, 'stage-source-right'),
        targetHandle: sanitizeStageEdgeHandle(edge.targetHandle, 'stage-target-left'),
        label: trimText(edge.label),
        ...normalizeStageEdgeAppearance(edge),
        createdAt: edge.createdAt || nowText(),
        updatedAt: edge.updatedAt || edge.createdAt || nowText(),
      }))
    : [];

  return {
    stages,
    pointPlacements,
    pointPositions,
    stagePositions,
    stageSizes,
    stageEdges,
  };
}

function fallbackPosition(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 80 + column * 260,
    y: 80 + row * 160,
  };
}

function buildStarterState() {
  const createdAt = nowText();
  const collectionId = createId('kg_collection');
  const graphId = createId('kg_graph');
  const sectionOverviewId = createId('kg_section');
  const sectionCoreId = createId('kg_section');
  const sectionPracticeId = createId('kg_section');
  const sectionSafetyId = createId('kg_section');

  const pointOverviewId = createId('kg_point');
  const pointVisionId = createId('kg_point');
  const pointLanguageId = createId('kg_point');
  const pointPracticeId = createId('kg_point');
  const pointEthicsId = createId('kg_point');

  const sections = [
    buildSection(sectionOverviewId, '顶层概览', '#2f7e79', '围绕课程目标和总体认识展开。', 1),
    buildSection(sectionCoreId, '核心能力', '#4667d6', '承载关键概念与主干技术。', 2),
    buildSection(sectionPracticeId, '创作与实践', '#8a58d6', '承载应用、项目与成果表达。', 3),
    buildSection(sectionSafetyId, '规则与责任', '#da7f44', '承载边界、伦理和风险治理。', 4),
  ];

  const points = [
    {
      id: pointOverviewId,
      graphId,
      title: 'AI 基本概念',
      summary: '认识 AI 的定义、能力边界和课程中的常见应用场景。',
      type: 'CONCEPT',
      tags: ['入门', '总览'],
      resourceBindings: [],
      meta: { color: '#2f7e79' },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: pointVisionId,
      graphId,
      title: '感知智能',
      summary: '覆盖图像识别、文本识别与语音识别等典型感知任务。',
      type: 'TOPIC',
      tags: ['视觉', '语音'],
      resourceBindings: [],
      meta: { color: '#4667d6' },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: pointLanguageId,
      graphId,
      title: '自然语言处理',
      summary: '包含分词、问答、机器翻译与聊天机器人等内容。',
      type: 'TOPIC',
      tags: ['NLP', '大模型'],
      resourceBindings: [],
      meta: { color: '#55a26f' },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: pointPracticeId,
      graphId,
      title: '生成式表达',
      summary: '围绕提示词设计、AI 写作、图像创作与综合项目展开。',
      type: 'SKILL',
      tags: ['AIGC', '创作'],
      resourceBindings: [],
      meta: { color: '#8a58d6' },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: pointEthicsId,
      graphId,
      title: 'AI 伦理与责任',
      summary: '关注可靠性、偏见、隐私保护与版权风险。',
      type: 'TOPIC',
      tags: ['安全', '伦理'],
      resourceBindings: [],
      meta: { color: '#da7f44' },
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const relations = [
    {
      id: createId('kg_relation'),
      graphId,
      sourceId: pointOverviewId,
      targetId: pointVisionId,
      relationType: 'CONTAINS',
      label: RELATION_LABEL_MAP.CONTAINS,
      weight: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId('kg_relation'),
      graphId,
      sourceId: pointOverviewId,
      targetId: pointLanguageId,
      relationType: 'CONTAINS',
      label: RELATION_LABEL_MAP.CONTAINS,
      weight: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId('kg_relation'),
      graphId,
      sourceId: pointLanguageId,
      targetId: pointPracticeId,
      relationType: 'PRECEDES',
      label: RELATION_LABEL_MAP.PRECEDES,
      weight: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId('kg_relation'),
      graphId,
      sourceId: pointPracticeId,
      targetId: pointEthicsId,
      relationType: 'RELATED',
      label: RELATION_LABEL_MAP.RELATED,
      weight: 1,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const cards = {
    [pointOverviewId]: {
      pointId: pointOverviewId,
      sectionId: sectionOverviewId,
      order: 1,
      width: 'wide',
    },
    [pointVisionId]: {
      pointId: pointVisionId,
      sectionId: sectionCoreId,
      order: 1,
      width: 'normal',
    },
    [pointLanguageId]: {
      pointId: pointLanguageId,
      sectionId: sectionCoreId,
      order: 2,
      width: 'normal',
    },
    [pointPracticeId]: {
      pointId: pointPracticeId,
      sectionId: sectionPracticeId,
      order: 1,
      width: 'wide',
    },
    [pointEthicsId]: {
      pointId: pointEthicsId,
      sectionId: sectionSafetyId,
      order: 1,
      width: 'wide',
    },
  };

  const positions = {
    [pointOverviewId]: { x: 80, y: 120 },
    [pointVisionId]: { x: 380, y: 80 },
    [pointLanguageId]: { x: 380, y: 240 },
    [pointPracticeId]: { x: 700, y: 160 },
    [pointEthicsId]: { x: 1010, y: 160 },
  };

  const structuredView = {
    stages: [
      buildStructuredStage(sectionOverviewId, '顶层概览', '#2f7e79', '围绕课程目标和总体认识展开。', 1),
      buildStructuredStage(sectionCoreId, '核心能力', '#4667d6', '承载关键概念与主干技术。', 2),
      buildStructuredStage(sectionPracticeId, '创作与实践', '#8a58d6', '承载应用、项目与成果表达。', 3),
      buildStructuredStage(sectionSafetyId, '规则与责任', '#da7f44', '承载边界、伦理和风险治理。', 4),
    ],
    pointPlacements: {
      [pointOverviewId]: { pointId: pointOverviewId, stageId: sectionOverviewId, order: 1 },
      [pointVisionId]: { pointId: pointVisionId, stageId: sectionCoreId, order: 1 },
      [pointLanguageId]: { pointId: pointLanguageId, stageId: sectionCoreId, order: 2 },
      [pointPracticeId]: { pointId: pointPracticeId, stageId: sectionPracticeId, order: 1 },
      [pointEthicsId]: { pointId: pointEthicsId, stageId: sectionSafetyId, order: 1 },
    },
    stagePositions: {
      [sectionOverviewId]: getStructuredStagePosition(0),
      [sectionCoreId]: getStructuredStagePosition(1),
      [sectionPracticeId]: getStructuredStagePosition(2),
      [sectionSafetyId]: getStructuredStagePosition(3),
    },
    stageSizes: {
      [sectionOverviewId]: getStructuredStageSize(),
      [sectionCoreId]: getStructuredStageSize(),
      [sectionPracticeId]: getStructuredStageSize(),
      [sectionSafetyId]: getStructuredStageSize(),
    },
    pointPositions: {
      [pointOverviewId]: getStructuredPointPosition(1),
      [pointVisionId]: getStructuredPointPosition(1),
      [pointLanguageId]: getStructuredPointPosition(2),
      [pointPracticeId]: getStructuredPointPosition(1),
      [pointEthicsId]: getStructuredPointPosition(1),
    },
    stageEdges: [],
  };

  return {
    version: 1,
    collections: [
      {
        id: collectionId,
        name: '默认图谱集',
        description: '用于沉淀课程结构、知识关系与资料绑定。',
        sortNo: 1,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    graphs: [
      {
        id: graphId,
        collectionId,
        name: 'AI 通识知识图谱',
        description: '演示图谱：用于展示两种视图和图谱编辑能力。',
        status: 'DRAFT',
        sourceMode: 'MANUAL',
        viewModeDefault: 'graph',
        createdAt,
        updatedAt: createdAt,
      },
    ],
    points,
    relations,
    layouts: {
      [graphId]: {
        graphView: { positions },
        structuredView,
        curriculumView: {
          sections,
          cards,
        },
      },
    },
    aiDrafts: [],
  };
}

function ensureSectionCardConsistency(state, graphId) {
  const layout = state.layouts[graphId] || {
    graphView: { positions: {} },
    structuredView: null,
    curriculumView: { sections: createDefaultSections(), cards: {} },
  };
  const pointsForGraph = state.points.filter((item) => item.graphId === graphId);
  const structuredView = normalizeStructuredView(layout, pointsForGraph);
  const curriculumView = buildLegacyCurriculumViewFromStructured(structuredView);
  state.layouts[graphId] = {
    graphView: {
      positions: { ...(layout.graphView?.positions || {}) },
    },
    structuredView,
    curriculumView,
  };
}

function normalizeState(state) {
  state.collections = Array.isArray(state.collections) ? state.collections : [];
  state.graphs = Array.isArray(state.graphs) ? state.graphs : [];
  state.points = Array.isArray(state.points) ? state.points : [];
  state.relations = Array.isArray(state.relations) ? state.relations : [];
  state.layouts = state.layouts && typeof state.layouts === 'object' ? state.layouts : {};
  state.aiDrafts = Array.isArray(state.aiDrafts) ? state.aiDrafts : [];

  state.collections = [...state.collections]
    .sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0))
    .map((item, index) => ({
      ...item,
      sortNo: index + 1,
      name: trimText(item.name) || `图谱集 ${index + 1}`,
      description: trimText(item.description),
      updatedAt: item.updatedAt || item.createdAt || nowText(),
      createdAt: item.createdAt || item.updatedAt || nowText(),
    }));

  state.graphs = [...state.graphs]
    .filter((graph) => state.collections.some((collection) => collection.id === graph.collectionId))
    .map((graph) => ({
      ...graph,
      name: trimText(graph.name) || '未命名图谱',
      description: trimText(graph.description),
      status: graph.status || 'DRAFT',
      sourceMode: graph.sourceMode || 'MANUAL',
      viewModeDefault: graph.viewModeDefault || 'graph',
      createdAt: graph.createdAt || nowText(),
      updatedAt: graph.updatedAt || graph.createdAt || nowText(),
    }));

  const graphIds = new Set(state.graphs.map((graph) => graph.id));
  state.points = state.points
    .filter((point) => graphIds.has(point.graphId))
    .map((point) => ({
      ...point,
      title: trimText(point.title) || '未命名知识点',
      summary: trimText(point.summary),
      type: point.type || 'TOPIC',
      tags: sanitizeTags(point.tags),
      resourceBindings: Array.isArray(point.resourceBindings) ? point.resourceBindings : [],
      meta: point.meta && typeof point.meta === 'object' ? point.meta : {},
      createdAt: point.createdAt || nowText(),
      updatedAt: point.updatedAt || point.createdAt || nowText(),
    }));

  const pointIds = new Set(state.points.map((point) => point.id));
  state.relations = state.relations
    .filter((relation) => graphIds.has(relation.graphId) && pointIds.has(relation.sourceId) && pointIds.has(relation.targetId))
    .map((relation) => ({
      ...relation,
      relationType: relation.relationType || 'RELATED',
      label: trimText(relation.label) || RELATION_LABEL_MAP[relation.relationType] || '关联',
      weight: Math.max(1, Number(relation.weight || 1)),
      ...normalizeRelationAppearance(relation),
      createdAt: relation.createdAt || nowText(),
      updatedAt: relation.updatedAt || relation.createdAt || nowText(),
    }));

  Object.keys(state.layouts).forEach((graphId) => {
    if (!graphIds.has(graphId)) {
      delete state.layouts[graphId];
    }
  });

  state.graphs.forEach((graph) => ensureSectionCardConsistency(state, graph.id));

  state.aiDrafts = state.aiDrafts
    .filter((draft) => graphIds.has(draft.graphId))
    .map((draft) => {
      const generatedNodes = Array.isArray(draft.generatedNodes) ? draft.generatedNodes : [];
      const baseLayout = draft.generatedLayout && typeof draft.generatedLayout === 'object'
        ? clone(draft.generatedLayout)
        : {
            graphView: { positions: {} },
            structuredView: {
              stages: createDefaultStructuredStages(),
              pointPlacements: {},
              pointPositions: {},
              stagePositions: {},
              stageSizes: {},
              stageEdges: [],
            },
            curriculumView: { sections: createDefaultSections(), cards: {} },
          };
      const structuredView = normalizeStructuredView(baseLayout, generatedNodes);
      return {
        ...draft,
        status: draft.status || 'PENDING',
        createdAt: draft.createdAt || nowText(),
        updatedAt: draft.updatedAt || draft.createdAt || nowText(),
        generatedNodes,
        generatedRelations: Array.isArray(draft.generatedRelations) ? draft.generatedRelations : [],
        generatedLayout: {
          graphView: {
            positions: { ...(baseLayout.graphView?.positions || {}) },
          },
          structuredView,
          curriculumView: buildLegacyCurriculumViewFromStructured(structuredView),
        },
      };
    });

  return state;
}

function readStore() {
  if (typeof window === 'undefined') {
    return buildStarterState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildStarterState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn('[knowledge-graph-store] failed to read storage', error);
    const fallback = buildStarterState();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore write failures in fallback path
    }
    return fallback;
  }
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function persistStore(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitChange();
}

function commit(mutator) {
  const next = normalizeState(clone(readStore()));
  mutator(next);
  const normalized = normalizeState(next);
  persistStore(normalized);
  return normalized;
}

function ensureGraphLayout(state, graphId) {
  if (!state.layouts[graphId]) {
    state.layouts[graphId] = {
      graphView: { positions: {} },
      structuredView: {
        stages: createDefaultStructuredStages(),
        pointPlacements: {},
        pointPositions: {},
        stagePositions: {},
        stageSizes: {},
        stageEdges: [],
      },
      curriculumView: {
        sections: createDefaultSections(),
        cards: {},
      },
    };
  }
  ensureSectionCardConsistency(state, graphId);
  return state.layouts[graphId];
}

function createResourceBindingSnapshot(resource) {
  const createdAt = nowText();
  return {
    bindingId: createId('kg_binding'),
    resourceKey: resource.key,
    resourceName: resource.name,
    fileType: resource.fileType,
    libraryId: resource.libraryId,
    libraryName: resource.libraryName,
    libraryScope: resource.libraryScope,
    snapshotUrl: resource.url || resource.dataUrl || '',
    snapshotPath: resource.path || `${resource.libraryName} / ${resource.name}`,
    createdAt,
  };
}

function createPointRecord(graphId, payload = {}) {
  const createdAt = nowText();
  return {
    id: createId('kg_point'),
    graphId,
    title: trimText(payload.title) || '未命名知识点',
    summary: trimText(payload.summary),
    type: payload.type || 'TOPIC',
    tags: sanitizeTags(payload.tags),
    resourceBindings: Array.isArray(payload.resourceBindings) ? payload.resourceBindings.map(createResourceBindingSnapshot) : [],
    meta: {
      color: payload.meta?.color || '#4667d6',
      note: trimText(payload.meta?.note),
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function createRelationRecord(graphId, payload = {}) {
  const createdAt = nowText();
  const relationType = payload.relationType || 'RELATED';
  const appearance = normalizeRelationAppearance({
    ...payload,
    relationType,
  });
  return {
    id: createId('kg_relation'),
    graphId,
    sourceId: payload.sourceId,
    targetId: payload.targetId,
    relationType,
    label: trimText(payload.label) || RELATION_LABEL_MAP[relationType] || '关联',
    weight: Math.max(1, Number(payload.weight || 1)),
    ...appearance,
    createdAt,
    updatedAt: createdAt,
  };
}

function createStageEdgeRecord(payload = {}) {
  const createdAt = nowText();
  const appearance = normalizeStageEdgeAppearance(payload);
  return {
    id: createId('kg_stage_edge'),
    source: payload.source,
    target: payload.target,
    sourceHandle: sanitizeStageEdgeHandle(payload.sourceHandle, 'stage-source-right'),
    targetHandle: sanitizeStageEdgeHandle(payload.targetHandle, 'stage-target-left'),
    label: trimText(payload.label),
    ...appearance,
    createdAt,
    updatedAt: createdAt,
  };
}

function createGraphRecord(payload = {}) {
  const createdAt = nowText();
  return {
    id: createId('kg_graph'),
    collectionId: payload.collectionId,
    name: trimText(payload.name) || '未命名图谱',
    description: trimText(payload.description),
    status: payload.status || 'DRAFT',
    sourceMode: payload.sourceMode || 'MANUAL',
    viewModeDefault: payload.viewModeDefault || 'graph',
    createdAt,
    updatedAt: createdAt,
  };
}

function createCollectionRecord(payload = {}, sortNo = 1) {
  const createdAt = nowText();
  return {
    id: createId('kg_collection'),
    name: trimText(payload.name) || `图谱集 ${sortNo}`,
    description: trimText(payload.description),
    sortNo,
    createdAt,
    updatedAt: createdAt,
  };
}

function reorderCards(cards, sectionId) {
  const scopedCards = Object.values(cards)
    .filter((item) => item.sectionId === sectionId)
    .sort((left, right) => (left.order || 0) - (right.order || 0));
  scopedCards.forEach((card, index) => {
    cards[card.pointId] = {
      ...card,
      order: index + 1,
    };
  });
}

function buildDraftLayout(nodes) {
  const sections = [
    buildStructuredStage(createId('kg_stage'), '总览与定义', '#2f7e79', '用于呈现课程主题、目标与主概念。', 1),
    buildStructuredStage(createId('kg_stage'), '核心主题', '#4667d6', '用于承载主要知识模块。', 2),
    buildStructuredStage(createId('kg_stage'), '应用与作品', '#8a58d6', '用于承载案例、项目与产出。', 3),
    buildStructuredStage(createId('kg_stage'), '规范与评估', '#da7f44', '用于承载风险、边界与评价方式。', 4),
  ];
  const cards = {};
  const positions = {};
  const pointPositions = {};
  const stagePositions = {};
  const stageSizes = {};
  sections.forEach((section, index) => {
    stagePositions[section.id] = getStructuredStagePosition(index);
    stageSizes[section.id] = getStructuredStageSize();
  });
  nodes.forEach((node, index) => {
    let sectionId = sections[1].id;
    if (index === 0) {
      sectionId = sections[0].id;
    } else if (node.type === 'CASE' || node.type === 'SKILL' || /实践|项目|创作|案例/.test(node.title)) {
      sectionId = sections[2].id;
    } else if (/规范|边界|安全|伦理|评估|评价/.test(node.title)) {
      sectionId = sections[3].id;
    }
    const sectionCards = Object.values(cards).filter((card) => card.sectionId === sectionId);
    cards[node.id] = {
      pointId: node.id,
      stageId: sectionId,
      order: sectionCards.length + 1,
    };
    positions[node.id] = fallbackPosition(index);
    pointPositions[node.id] = getStructuredPointPosition(sectionCards.length + 1);
  });
  const structuredView = {
    stages: sections,
    pointPlacements: cards,
    pointPositions,
    stagePositions,
    stageSizes,
    stageEdges: [],
  };
  return {
    graphView: { positions },
    structuredView,
    curriculumView: buildLegacyCurriculumViewFromStructured(structuredView),
  };
}

function stripFileExtension(name) {
  return String(name || '').replace(/\.[^.]+$/, '').trim();
}

export function getKnowledgeGraphStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export function loadKnowledgeGraphStore() {
  return readStore();
}

export function getCollections(state) {
  return [...(state?.collections || [])].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0));
}

export function getGraphsByCollection(state, collectionId) {
  return (state?.graphs || [])
    .filter((graph) => graph.collectionId === collectionId)
    .sort((left, right) => String(left.name).localeCompare(String(right.name), 'zh-CN'));
}

export function getGraphById(state, graphId) {
  return (state?.graphs || []).find((graph) => graph.id === graphId) || null;
}

export function getPointsByGraph(state, graphId) {
  return (state?.points || [])
    .filter((point) => point.graphId === graphId)
    .sort((left, right) => String(left.title).localeCompare(String(right.title), 'zh-CN'));
}

export function getRelationsByGraph(state, graphId) {
  return (state?.relations || [])
    .filter((relation) => relation.graphId === graphId)
    .sort((left, right) => String(left.label).localeCompare(String(right.label), 'zh-CN'));
}

export function getGraphLayout(state, graphId) {
  const graphLayout = state?.layouts?.[graphId];
  if (graphLayout) return graphLayout;
  const structuredView = {
    stages: createDefaultStructuredStages(),
    pointPlacements: {},
    pointPositions: {},
    stagePositions: {},
    stageSizes: {},
    stageEdges: [],
  };
  return {
    graphView: { positions: {} },
    structuredView,
    curriculumView: buildLegacyCurriculumViewFromStructured(structuredView),
  };
}

export function getLatestGraphDraft(state, graphId) {
  return (state?.aiDrafts || [])
    .filter((draft) => draft.graphId === graphId && draft.status === 'PENDING')
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt), 'zh-CN'))[0] || null;
}

export function createCollection(payload = {}) {
  return commit((state) => {
    const next = createCollectionRecord(payload, state.collections.length + 1);
    state.collections.push(next);
  });
}

export function updateCollection(collectionId, patch = {}) {
  return commit((state) => {
    const collection = state.collections.find((item) => item.id === collectionId);
    if (!collection) return;
    if (typeof patch.name !== 'undefined') collection.name = trimText(patch.name) || collection.name;
    if (typeof patch.description !== 'undefined') collection.description = trimText(patch.description);
    collection.updatedAt = nowText();
  });
}

export function removeCollection(collectionId) {
  return commit((state) => {
    const graphIds = new Set(state.graphs.filter((graph) => graph.collectionId === collectionId).map((graph) => graph.id));
    state.collections = state.collections.filter((item) => item.id !== collectionId);
    state.graphs = state.graphs.filter((graph) => graph.collectionId !== collectionId);
    state.points = state.points.filter((point) => !graphIds.has(point.graphId));
    state.relations = state.relations.filter((relation) => !graphIds.has(relation.graphId));
    state.aiDrafts = state.aiDrafts.filter((draft) => !graphIds.has(draft.graphId));
    graphIds.forEach((graphId) => {
      delete state.layouts[graphId];
    });
  });
}

export function createGraph(payload = {}) {
  return commit((state) => {
    const graph = createGraphRecord(payload);
    state.graphs.push(graph);
    ensureGraphLayout(state, graph.id);
  });
}

export function duplicateGraph(graphId) {
  return commit((state) => {
    const sourceGraph = state.graphs.find((graph) => graph.id === graphId);
    if (!sourceGraph) return;

    const duplicatedGraph = createGraphRecord({
      collectionId: sourceGraph.collectionId,
      name: `${sourceGraph.name} - 副本`,
      description: sourceGraph.description,
      sourceMode: sourceGraph.sourceMode,
      viewModeDefault: sourceGraph.viewModeDefault,
    });
    state.graphs.push(duplicatedGraph);

    const pointIdMap = new Map();
    const clonedPoints = state.points
      .filter((point) => point.graphId === graphId)
      .map((point) => {
        const clonedPoint = {
          ...clone(point),
          id: createId('kg_point'),
          graphId: duplicatedGraph.id,
          createdAt: nowText(),
          updatedAt: nowText(),
          resourceBindings: clone(point.resourceBindings || []),
        };
        pointIdMap.set(point.id, clonedPoint.id);
        return clonedPoint;
      });

    const clonedRelations = state.relations
      .filter((relation) => relation.graphId === graphId)
      .map((relation) => ({
        ...clone(relation),
        id: createId('kg_relation'),
        graphId: duplicatedGraph.id,
        sourceId: pointIdMap.get(relation.sourceId),
        targetId: pointIdMap.get(relation.targetId),
        createdAt: nowText(),
        updatedAt: nowText(),
      }));

    state.points.push(...clonedPoints);
    state.relations.push(...clonedRelations);

    const sourceLayout = getGraphLayout(state, graphId);
    const clonedPositions = {};
    Object.entries(sourceLayout.graphView.positions || {}).forEach(([pointId, position]) => {
      const nextPointId = pointIdMap.get(pointId);
      if (!nextPointId) return;
      clonedPositions[nextPointId] = clone(position);
    });
    const clonedPointPlacements = {};
    Object.values(sourceLayout.structuredView?.pointPlacements || {}).forEach((placement) => {
      if (!pointIdMap.has(placement.pointId)) return;
      clonedPointPlacements[pointIdMap.get(placement.pointId)] = {
        ...clone(placement),
        pointId: pointIdMap.get(placement.pointId),
      };
    });
    const clonedPointPositions = {};
    Object.entries(sourceLayout.structuredView?.pointPositions || {}).forEach(([pointId, position]) => {
      const nextPointId = pointIdMap.get(pointId);
      if (!nextPointId) return;
      clonedPointPositions[nextPointId] = clone(position);
    });

    state.layouts[duplicatedGraph.id] = {
      graphView: { positions: clonedPositions },
      structuredView: {
        stages: clone(sourceLayout.structuredView?.stages || createDefaultStructuredStages()),
        pointPlacements: clonedPointPlacements,
        pointPositions: clonedPointPositions,
        stagePositions: clone(sourceLayout.structuredView?.stagePositions || {}),
        stageSizes: clone(sourceLayout.structuredView?.stageSizes || {}),
        stageEdges: clone(sourceLayout.structuredView?.stageEdges || []),
      },
      curriculumView: buildLegacyCurriculumViewFromStructured({
        stages: clone(sourceLayout.structuredView?.stages || createDefaultStructuredStages()),
        pointPlacements: clonedPointPlacements,
      }),
    };
  });
}

export function updateGraph(graphId, patch = {}) {
  return commit((state) => {
    const graph = state.graphs.find((item) => item.id === graphId);
    if (!graph) return;
    if (typeof patch.collectionId !== 'undefined') graph.collectionId = patch.collectionId;
    if (typeof patch.name !== 'undefined') graph.name = trimText(patch.name) || graph.name;
    if (typeof patch.description !== 'undefined') graph.description = trimText(patch.description);
    if (typeof patch.viewModeDefault !== 'undefined') graph.viewModeDefault = patch.viewModeDefault || graph.viewModeDefault;
    if (typeof patch.sourceMode !== 'undefined') graph.sourceMode = patch.sourceMode || graph.sourceMode;
    graph.updatedAt = nowText();
  });
}

export function removeGraph(graphId) {
  return commit((state) => {
    state.graphs = state.graphs.filter((graph) => graph.id !== graphId);
    state.points = state.points.filter((point) => point.graphId !== graphId);
    state.relations = state.relations.filter((relation) => relation.graphId !== graphId);
    state.aiDrafts = state.aiDrafts.filter((draft) => draft.graphId !== graphId);
    delete state.layouts[graphId];
  });
}

export function createPoint(graphId, payload = {}) {
  return commit((state) => {
    const graph = state.graphs.find((item) => item.id === graphId);
    if (!graph) return;
    const point = createPointRecord(graphId, payload);
    state.points.push(point);
    const layout = ensureGraphLayout(state, graphId);
    layout.graphView.positions[point.id] = fallbackPosition(state.points.filter((item) => item.graphId === graphId).length - 1);
    const targetStageId = payload.stageId || payload.sectionId || layout.structuredView.stages[0]?.id;
    const currentStageCount = Object.values(layout.structuredView.pointPlacements || {})
      .filter((placement) => placement.stageId === targetStageId).length;
    layout.structuredView.pointPlacements[point.id] = {
      pointId: point.id,
      stageId: targetStageId,
      order: currentStageCount + 1,
    };
    layout.structuredView.pointPositions[point.id] = getStructuredPointPosition(currentStageCount + 1);
    graph.updatedAt = nowText();
  });
}

export function updatePoint(graphId, pointId, patch = {}) {
  return commit((state) => {
    const point = state.points.find((item) => item.id === pointId && item.graphId === graphId);
    if (!point) return;
    if (typeof patch.title !== 'undefined') point.title = trimText(patch.title) || point.title;
    if (typeof patch.summary !== 'undefined') point.summary = trimText(patch.summary);
    if (typeof patch.type !== 'undefined') point.type = patch.type || point.type;
    if (typeof patch.tags !== 'undefined') point.tags = sanitizeTags(patch.tags);
    if (patch.meta) {
      point.meta = {
        ...(point.meta || {}),
        ...patch.meta,
      };
    }
    point.updatedAt = nowText();
  });
}

export function removePoint(graphId, pointId) {
  return commit((state) => {
    state.points = state.points.filter((point) => !(point.graphId === graphId && point.id === pointId));
    state.relations = state.relations.filter((relation) => relation.sourceId !== pointId && relation.targetId !== pointId);
    const layout = ensureGraphLayout(state, graphId);
    delete layout.graphView.positions[pointId];
    delete layout.structuredView.pointPlacements[pointId];
    delete layout.structuredView.pointPositions[pointId];
  });
}

export function batchRemovePoints(graphId, pointIds = []) {
  const idSet = new Set(pointIds);
  return commit((state) => {
    state.points = state.points.filter((point) => !(point.graphId === graphId && idSet.has(point.id)));
    state.relations = state.relations.filter((relation) => !idSet.has(relation.sourceId) && !idSet.has(relation.targetId));
    const layout = ensureGraphLayout(state, graphId);
    pointIds.forEach((pointId) => {
      delete layout.graphView.positions[pointId];
      delete layout.structuredView.pointPlacements[pointId];
      delete layout.structuredView.pointPositions[pointId];
    });
  });
}

export function createRelation(graphId, payload = {}) {
  return commit((state) => {
    if (!payload.sourceId || !payload.targetId || payload.sourceId === payload.targetId) return;
    const exists = state.relations.some((relation) => (
      relation.graphId === graphId
      && relation.sourceId === payload.sourceId
      && relation.targetId === payload.targetId
      && relation.relationType === (payload.relationType || 'RELATED')
    ));
    if (exists) return;
    state.relations.push(createRelationRecord(graphId, payload));
  });
}

export function updateRelation(graphId, relationId, patch = {}) {
  return commit((state) => {
    const relation = state.relations.find((item) => item.id === relationId && item.graphId === graphId);
    if (!relation) return;
    if (typeof patch.relationType !== 'undefined') relation.relationType = patch.relationType || relation.relationType;
    if (typeof patch.label !== 'undefined') relation.label = trimText(patch.label) || RELATION_LABEL_MAP[relation.relationType] || relation.label;
    if (typeof patch.weight !== 'undefined') relation.weight = Math.max(1, Number(patch.weight || relation.weight));
    if (typeof patch.strokeColor !== 'undefined') {
      relation.strokeColor = sanitizeEdgeStrokeColor(patch.strokeColor, relation.strokeColor || '#a78bfa');
    }
    if (typeof patch.strokeWidth !== 'undefined') {
      relation.strokeWidth = sanitizeEdgeStrokeWidth(patch.strokeWidth, relation.strokeWidth || 1.8);
    }
    if (typeof patch.lineStyle !== 'undefined') {
      relation.lineStyle = sanitizeEdgeLineStyle(patch.lineStyle, relation.lineStyle || 'solid');
    }
    if (typeof patch.animated !== 'undefined') {
      relation.animated = sanitizeEdgeAnimated(patch.animated, relation.animated ?? relation.relationType === 'PRECEDES');
    }
    relation.updatedAt = nowText();
  });
}

export function removeRelation(graphId, relationId) {
  return commit((state) => {
    state.relations = state.relations.filter((relation) => !(relation.graphId === graphId && relation.id === relationId));
  });
}

export function bindResourcesToPoint(graphId, pointId, resources = []) {
  return commit((state) => {
    const point = state.points.find((item) => item.id === pointId && item.graphId === graphId);
    if (!point) return;
    const existingKeys = new Set((point.resourceBindings || []).map((binding) => binding.resourceKey));
    const nextBindings = [...(point.resourceBindings || [])];
    resources.forEach((resource) => {
      if (!resource?.key || existingKeys.has(resource.key)) return;
      nextBindings.push(createResourceBindingSnapshot(resource));
      existingKeys.add(resource.key);
    });
    point.resourceBindings = nextBindings;
    point.updatedAt = nowText();
  });
}

export function removeResourceBinding(graphId, pointId, bindingId) {
  return commit((state) => {
    const point = state.points.find((item) => item.id === pointId && item.graphId === graphId);
    if (!point) return;
    point.resourceBindings = (point.resourceBindings || []).filter((binding) => binding.bindingId !== bindingId);
    point.updatedAt = nowText();
  });
}

export function updateGraphNodePosition(graphId, pointId, position) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    layout.graphView.positions[pointId] = {
      x: Number(position?.x || 0),
      y: Number(position?.y || 0),
    };
  });
}

export function createStructuredStage(graphId, payload = {}) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    layout.structuredView.stages.push({
      ...buildStructuredStage(
      createId('kg_stage'),
      trimText(payload.name || payload.title) || `分区 ${layout.structuredView.stages.length + 1}`,
      payload.color || '#4667d6',
      trimText(payload.description),
      layout.structuredView.stages.length + 1,
      ),
      layoutColumns: sanitizeStageLayoutColumns(payload.layoutColumns),
    });
  });
}

export function updateStructuredStage(graphId, stageId, patch = {}) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    const stage = layout.structuredView.stages.find((item) => item.id === stageId);
    if (!stage) return;
    if (typeof patch.name !== 'undefined' || typeof patch.title !== 'undefined') {
      stage.name = trimText(patch.name || patch.title) || stage.name;
    }
    if (typeof patch.description !== 'undefined') stage.description = trimText(patch.description);
    if (typeof patch.color !== 'undefined') stage.color = patch.color || stage.color;
    if (typeof patch.layoutColumns !== 'undefined') {
      stage.layoutColumns = sanitizeStageLayoutColumns(patch.layoutColumns);
    }
  });
}

export function updateStructuredStagePosition(graphId, stageId, position) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    layout.structuredView.stagePositions[stageId] = {
      x: Number(position?.x || 0),
      y: Number(position?.y || 0),
    };
  });
}

export function updateStructuredStageSize(graphId, stageId, size = {}) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    layout.structuredView.stageSizes[stageId] = {
      width: Math.max(332, Number(size.width || getStructuredStageSize().width)),
    };
  });
}

export function removeStructuredStage(graphId, stageId) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    if (layout.structuredView.stages.length <= 1) return;
    layout.structuredView.stages = layout.structuredView.stages.filter((stage) => stage.id !== stageId);
    const fallbackStageId = layout.structuredView.stages[0]?.id;
    Object.values(layout.structuredView.pointPlacements).forEach((placement) => {
      if (placement.stageId === stageId) {
        placement.stageId = fallbackStageId;
      }
    });
    delete layout.structuredView.stagePositions[stageId];
    delete layout.structuredView.stageSizes[stageId];
    layout.structuredView.stageEdges = (layout.structuredView.stageEdges || []).filter((edge) => edge.source !== stageId && edge.target !== stageId);
    layout.structuredView.stages.forEach((stage) => {
      const stagePoints = Object.values(layout.structuredView.pointPlacements)
        .filter((item) => item.stageId === stage.id)
        .sort((left, right) => (left.order || 0) - (right.order || 0));
      stagePoints.forEach((item, index) => {
        layout.structuredView.pointPlacements[item.pointId] = {
          ...item,
          order: index + 1,
        };
        layout.structuredView.pointPositions[item.pointId] = getStructuredPointPosition(index + 1);
      });
    });
  });
}

export function moveStructuredPoint(graphId, pointId, stageId, targetIndex = null, pointPosition = null) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    const placement = layout.structuredView.pointPlacements[pointId];
    if (!placement) return;
    const fromStageId = placement.stageId;
    const targetStagePoints = Object.values(layout.structuredView.pointPlacements)
      .filter((item) => item.stageId === stageId && item.pointId !== pointId)
      .sort((left, right) => (left.order || 0) - (right.order || 0));

    const nextIndex = targetIndex == null ? targetStagePoints.length : Math.max(0, Math.min(targetIndex, targetStagePoints.length));

    placement.stageId = stageId;
    targetStagePoints.splice(nextIndex, 0, placement);
    targetStagePoints.forEach((item, index) => {
      layout.structuredView.pointPlacements[item.pointId] = {
        ...item,
        stageId,
        order: index + 1,
      };
      if (item.pointId !== pointId || !pointPosition) {
        layout.structuredView.pointPositions[item.pointId] = getStructuredPointPosition(index + 1);
      }
    });
    if (pointPosition) {
      layout.structuredView.pointPositions[pointId] = {
        x: Number(pointPosition.x || 0),
        y: Number(pointPosition.y || 0),
      };
    }
    const sourceStagePoints = Object.values(layout.structuredView.pointPlacements)
      .filter((item) => item.stageId === fromStageId)
      .sort((left, right) => (left.order || 0) - (right.order || 0));
    sourceStagePoints.forEach((item, index) => {
      layout.structuredView.pointPlacements[item.pointId] = {
        ...item,
        order: index + 1,
      };
      if (fromStageId !== stageId || item.pointId !== pointId) {
        layout.structuredView.pointPositions[item.pointId] = getStructuredPointPosition(index + 1);
      }
    });
  });
}

export function updateStructuredPointPosition(graphId, pointId, position) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    if (!layout.structuredView.pointPlacements[pointId]) return;
    layout.structuredView.pointPositions[pointId] = {
      x: Number(position?.x || 0),
      y: Number(position?.y || 0),
    };
  });
}

export function createStructuredStageEdge(graphId, payload = {}) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    if (!payload.source || !payload.target || payload.source === payload.target) return;
    const exists = (layout.structuredView.stageEdges || []).some((edge) => edge.source === payload.source && edge.target === payload.target);
    if (exists) return;
    layout.structuredView.stageEdges.push(createStageEdgeRecord(payload));
  });
}

export function updateStructuredStageEdge(graphId, edgeId, patch = {}) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    const edge = (layout.structuredView.stageEdges || []).find((item) => item.id === edgeId);
    if (!edge) return;
    const nextSource = patch.source || edge.source;
    const nextTarget = patch.target || edge.target;
    if (nextSource === nextTarget) return;
    const duplicatedEdge = (layout.structuredView.stageEdges || []).find((item) => (
      item.id !== edgeId
      && item.source === nextSource
      && item.target === nextTarget
    ));
    if (duplicatedEdge) return;
    if (typeof patch.source !== 'undefined') edge.source = patch.source;
    if (typeof patch.target !== 'undefined') edge.target = patch.target;
    if (typeof patch.sourceHandle !== 'undefined') {
      edge.sourceHandle = sanitizeStageEdgeHandle(patch.sourceHandle, edge.sourceHandle || 'stage-source-right');
    }
    if (typeof patch.targetHandle !== 'undefined') {
      edge.targetHandle = sanitizeStageEdgeHandle(patch.targetHandle, edge.targetHandle || 'stage-target-left');
    }
    if (typeof patch.label !== 'undefined') edge.label = trimText(patch.label);
    if (typeof patch.strokeColor !== 'undefined') {
      edge.strokeColor = sanitizeEdgeStrokeColor(patch.strokeColor, edge.strokeColor || '#60a5fa');
    }
    if (typeof patch.strokeWidth !== 'undefined') {
      edge.strokeWidth = sanitizeEdgeStrokeWidth(patch.strokeWidth, edge.strokeWidth || 2);
    }
    if (typeof patch.lineStyle !== 'undefined') {
      edge.lineStyle = sanitizeEdgeLineStyle(patch.lineStyle, edge.lineStyle || 'solid');
    }
    if (typeof patch.animated !== 'undefined') {
      edge.animated = sanitizeEdgeAnimated(patch.animated, edge.animated ?? false);
    }
    edge.updatedAt = nowText();
  });
}

export function removeStructuredStageEdge(graphId, edgeId) {
  return commit((state) => {
    const layout = ensureGraphLayout(state, graphId);
    layout.structuredView.stageEdges = (layout.structuredView.stageEdges || []).filter((edge) => edge.id !== edgeId);
  });
}

export function createCurriculumSection(graphId, payload = {}) {
  return createStructuredStage(graphId, payload);
}

export function updateCurriculumSection(graphId, sectionId, patch = {}) {
  return updateStructuredStage(graphId, sectionId, patch);
}

export function removeCurriculumSection(graphId, sectionId) {
  return removeStructuredStage(graphId, sectionId);
}

export function moveCurriculumCard(graphId, pointId, sectionId, targetIndex = null) {
  return moveStructuredPoint(graphId, pointId, sectionId, targetIndex);
}

export function generateGraphDraft(graphId, input = {}) {
  return commit((state) => {
    const graph = state.graphs.find((item) => item.id === graphId);
    if (!graph) return;
    const resources = Array.isArray(input.resources) ? input.resources : [];
    const theme = trimText(input.theme) || graph.name || '知识图谱';
    const audience = trimText(input.audience);
    const goal = trimText(input.goal);
    const stylePrompt = trimText(input.stylePrompt);

    const resourceNodeTitles = Array.from(new Set(
      resources
        .slice(0, 4)
        .map((resource) => stripFileExtension(resource.name))
        .filter(Boolean),
    ));

    const nodes = [
      createPointRecord(graphId, {
        title: `${theme}总览`,
        summary: [audience && `面向${audience}`, goal && `目标：${goal}`].filter(Boolean).join('；') || `围绕 ${theme} 构建课程全景认知。`,
        type: 'CONCEPT',
        tags: [theme, 'AI 草稿'],
        meta: { color: '#2f7e79' },
      }),
      createPointRecord(graphId, {
        title: `${theme}核心概念`,
        summary: `梳理 ${theme} 的主干概念、关键术语和核心结构。`,
        type: 'TOPIC',
        tags: ['核心概念'],
        meta: { color: '#4667d6' },
      }),
      createPointRecord(graphId, {
        title: `${theme}典型能力`,
        summary: `聚焦 ${theme} 在课堂中需要掌握的关键能力与操作方法。`,
        type: 'SKILL',
        tags: ['能力'],
        meta: { color: '#4667d6' },
      }),
      createPointRecord(graphId, {
        title: `${theme}应用实践`,
        summary: stylePrompt ? `按“${stylePrompt}”风格组织项目、任务和产出。` : `围绕 ${theme} 设计任务、案例与成果表达。`,
        type: 'CASE',
        tags: ['实践'],
        meta: { color: '#8a58d6' },
      }),
      createPointRecord(graphId, {
        title: `${theme}边界与规范`,
        summary: `明确使用边界、风险控制与评价要求，确保图谱可落地。`,
        type: 'TOPIC',
        tags: ['规范', '治理'],
        meta: { color: '#da7f44' },
      }),
    ];

    resourceNodeTitles.forEach((title, index) => {
      nodes.push(createPointRecord(graphId, {
        title,
        summary: `从资料库资料《${title}》提取的主题建议，可进一步整理为知识点。`,
        type: index % 2 === 0 ? 'RESOURCE' : 'CASE',
        tags: ['资料库输入'],
        meta: { color: index % 2 === 0 ? '#5b8def' : '#8a58d6' },
      }));
    });

    const relations = [
      createRelationRecord(graphId, {
        sourceId: nodes[0].id,
        targetId: nodes[1].id,
        relationType: 'CONTAINS',
      }),
      createRelationRecord(graphId, {
        sourceId: nodes[1].id,
        targetId: nodes[2].id,
        relationType: 'PRECEDES',
      }),
      createRelationRecord(graphId, {
        sourceId: nodes[2].id,
        targetId: nodes[3].id,
        relationType: 'APPLIES_TO',
      }),
      createRelationRecord(graphId, {
        sourceId: nodes[3].id,
        targetId: nodes[4].id,
        relationType: 'RELATED',
      }),
    ];

    nodes.slice(5).forEach((node, index) => {
      relations.push(createRelationRecord(graphId, {
        sourceId: nodes[index % 2 === 0 ? 1 : 3].id,
        targetId: node.id,
        relationType: node.type === 'RESOURCE' ? 'CONTAINS' : 'CASE_OF',
      }));
    });

    const nextDraft = {
      id: createId('kg_draft'),
      graphId,
      prompt: {
        theme,
        audience,
        goal,
        stylePrompt,
      },
      sourceResourceKeys: resources.map((resource) => resource.key),
      generatedNodes: nodes,
      generatedRelations: relations,
      generatedLayout: buildDraftLayout(nodes),
      status: 'PENDING',
      createdAt: nowText(),
      updatedAt: nowText(),
    };

    state.aiDrafts = state.aiDrafts.filter((draft) => !(draft.graphId === graphId && draft.status === 'PENDING'));
    state.aiDrafts.push(nextDraft);
  });
}

export function acceptGraphDraft(graphId, draftId, options = {}) {
  return commit((state) => {
    const persistedDraft = state.aiDrafts.find((item) => item.id === draftId && item.graphId === graphId);
    const graph = state.graphs.find((item) => item.id === graphId);
    if (!persistedDraft || !graph) return;
    const mergeMode = options.mergeMode === 'append' ? 'append' : 'replace';
    const draft = options.draftData ? clone(options.draftData) : clone(persistedDraft);

    if (mergeMode === 'replace') {
      state.points = state.points.filter((point) => point.graphId !== graphId);
      state.relations = state.relations.filter((relation) => relation.graphId !== graphId);
      delete state.layouts[graphId];
    }

    const existingPointIds = new Set(state.points.filter((point) => point.graphId === graphId).map((point) => point.id));
    draft.generatedNodes.forEach((node) => {
      if (existingPointIds.has(node.id)) return;
      state.points.push({
        ...clone(node),
        graphId,
        createdAt: node.createdAt || nowText(),
        updatedAt: nowText(),
      });
      existingPointIds.add(node.id);
    });

    const existingRelationIds = new Set(state.relations.map((relation) => relation.id));
    draft.generatedRelations.forEach((relation) => {
      if (existingRelationIds.has(relation.id)) return;
      state.relations.push({
        ...clone(relation),
        graphId,
        createdAt: relation.createdAt || nowText(),
        updatedAt: nowText(),
      });
      existingRelationIds.add(relation.id);
    });

    const layout = ensureGraphLayout(state, graphId);
    const draftLayout = draft.generatedLayout || buildDraftLayout(draft.generatedNodes || []);
    if (mergeMode === 'replace') {
      state.layouts[graphId] = clone(draftLayout);
    } else {
      const existingStageIds = new Set(layout.structuredView.stages.map((stage) => stage.id));
      draftLayout.structuredView.stages.forEach((stage) => {
        if (existingStageIds.has(stage.id)) return;
        layout.structuredView.stages.push({
          ...clone(stage),
          sortNo: layout.structuredView.stages.length + 1,
        });
      });
      Object.entries(draftLayout.structuredView.pointPlacements || {}).forEach(([pointId, placement]) => {
        layout.structuredView.pointPlacements[pointId] = clone(placement);
      });
      Object.entries(draftLayout.structuredView.pointPositions || {}).forEach(([pointId, position]) => {
        layout.structuredView.pointPositions[pointId] = clone(position);
      });
      Object.entries(draftLayout.structuredView.stagePositions || {}).forEach(([stageId, position]) => {
        layout.structuredView.stagePositions[stageId] = clone(position);
      });
      Object.entries(draftLayout.structuredView.stageSizes || {}).forEach(([stageId, size]) => {
        layout.structuredView.stageSizes[stageId] = clone(size);
      });
      const existingStageEdgeIds = new Set((layout.structuredView.stageEdges || []).map((edge) => edge.id));
      draftLayout.structuredView.stageEdges.forEach((edge) => {
        if (existingStageEdgeIds.has(edge.id)) return;
        layout.structuredView.stageEdges.push(clone(edge));
      });
      Object.entries(draftLayout.graphView?.positions || {}).forEach(([pointId, position]) => {
        layout.graphView.positions[pointId] = clone(position);
      });
    }

    graph.sourceMode = 'AI_DRAFT_ACCEPTED';
    graph.updatedAt = nowText();
    state.aiDrafts = state.aiDrafts.filter((item) => item.id !== draftId);
  });
}

export function dismissGraphDraft(graphId, draftId) {
  return commit((state) => {
    state.aiDrafts = state.aiDrafts.filter((draft) => !(draft.graphId === graphId && draft.id === draftId));
  });
}
