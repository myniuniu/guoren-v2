import { buildSceneInitialVersionData, getSceneTypeLabel } from '../scene/api';
import { getCurrentVersion, loadFromStorage } from '../versionStore';

const SCENE_SOURCE_KEY_MAP = {
  TEACHING: 'teaching',
  RESEARCH: 'research',
  TRAINING: 'study',
};

const ACTIVITY_RULES = {
  TEACHING: [
    {
      activityType: 'learning_evaluation',
      activityLabel: '学习评价',
      bundleKey: 'learning_evaluation',
      matches: ['作业', '练习', '考试', '评价', '反馈', '测评'],
      resourceTypes: ['exam', 'survey', 'vote', 'register'],
      dimensionNames: ['学习评价'],
      itemNames: ['形成性反馈', '评价数据应用'],
      coverageBase: 84,
      nextAction: '可继续补充作业讲评、错因分析和评价反馈记录，形成更完整的学习评价闭环。',
    },
    {
      activityType: 'classroom_implementation',
      activityLabel: '课堂实施',
      bundleKey: 'classroom_observation',
      matches: ['课堂', '回看', '互动', '公开课', '直播', '活动'],
      resourceTypes: ['video', 'activity'],
      dimensionNames: ['课堂实施'],
      itemNames: ['互动引导', '课堂调控'],
      coverageBase: 82,
      nextAction: '可继续补充课堂回看、互动节奏分析和学生回应记录，完善课堂实施画像。',
    },
    {
      activityType: 'lesson_design',
      activityLabel: '教学设计',
      bundleKey: 'lesson_design',
      matches: ['教案', '设计', '课件', '课程', '讲义', '任务单'],
      dimensionNames: ['教学设计'],
      itemNames: ['目标与学情对齐', '学习活动设计'],
      coverageBase: 86,
      nextAction: '建议持续补充教案修订、学情分析和任务单迭代记录，强化教学设计支撑。',
    },
  ],
  RESEARCH: [
    {
      activityType: 'lesson_review',
      activityLabel: '听评课反馈',
      bundleKey: 'classroom_observation',
      matches: ['听评', '评课', '观察', '课堂'],
      resourceTypes: ['video', 'activity'],
      dimensionNames: ['课堂实施', '专业发展'],
      itemNames: ['互动引导', '课堂调控', '教学反思'],
      coverageBase: 80,
      nextAction: '可继续补充评课意见、课堂观察纪要和改进前后对照记录。',
    },
    {
      activityType: 'research_collaboration',
      activityLabel: '教研协同',
      bundleKey: 'research_collaboration',
      matches: ['纪要', '教研', '研讨', '共创', '议题', '备课', '工作坊'],
      dimensionNames: ['专业发展', '教学设计'],
      itemNames: ['教研协同', '教学反思', '学习活动设计'],
      coverageBase: 85,
      nextAction: '建议沉淀后续共创成果、分工协作记录和复盘结论，增强教研协同连续性。',
    },
  ],
  TRAINING: [
    {
      activityType: 'training_assessment',
      activityLabel: '培训考核',
      bundleKey: 'learning_evaluation',
      matches: ['考试', '测评', '结业', '考核'],
      resourceTypes: ['exam', 'survey'],
      dimensionNames: ['学习评价', '专业发展'],
      itemNames: ['评价数据应用', '教学反思'],
      coverageBase: 80,
      nextAction: '建议继续沉淀测评反馈、阶段诊断和结业复盘，形成培训改进依据。',
    },
    {
      activityType: 'training_assignment',
      activityLabel: '研修成果',
      bundleKey: 'training_outcome',
      matches: ['作业', '成果', '项目', '任务', '实训'],
      resourceTypes: ['activity', 'file'],
      dimensionNames: ['专业发展', '教学设计'],
      itemNames: ['教学反思', '学习活动设计'],
      coverageBase: 84,
      nextAction: '建议补充作业点评、成果修订和实践应用反馈，增强研修成果沉淀。',
    },
    {
      activityType: 'training_learning',
      activityLabel: '培训研修',
      bundleKey: 'training_learning',
      matches: ['课程', '直播', '视频', '学习', '培训'],
      resourceTypes: ['video'],
      dimensionNames: ['专业发展'],
      itemNames: ['教学反思', '教研协同'],
      coverageBase: 82,
      nextAction: '建议持续补充课程学习笔记、直播回放摘录和转化实践记录。',
    },
  ],
};

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

function clampCoverage(score) {
  return Math.max(64, Math.min(96, Math.round(score)));
}

function buildStatusTag(score) {
  if (score >= 86) {
    return { label: '证据充分', color: 'success' };
  }
  if (score >= 72) {
    return { label: '证据初步具备', color: 'processing' };
  }
  return { label: '证据待补充', color: 'warning' };
}

function normalizeText(value) {
  return String(value || '').trim();
}

function buildResourceLookup(resources = []) {
  return new Map(resources.map((resource) => [resource.key, resource]));
}

function buildResourcePathSegments(resource, resourceLookup) {
  const segments = [];
  let cursor = resource?.parentKey ? resourceLookup.get(resource.parentKey) : null;

  while (cursor) {
    segments.unshift(cursor.name);
    cursor = cursor.parentKey ? resourceLookup.get(cursor.parentKey) : null;
  }

  return segments;
}

function buildResourcePath(scene, resource, resources) {
  const resourceLookup = buildResourceLookup(resources);
  const pathSegments = [scene.name, ...buildResourcePathSegments(resource, resourceLookup), resource.name];
  return pathSegments.filter(Boolean).join(' / ');
}

function buildRuleText(resource, resourcePath, resourceSummary) {
  return [
    resource?.name,
    resource?.type,
    resourcePath,
    resourceSummary,
  ].filter(Boolean).join(' ');
}

function resolveFileTypeLabel(resource) {
  switch (resource?.type) {
    case 'video':
      return '视频资料';
    case 'activity':
      return '活动记录';
    case 'exam':
      return '考试记录';
    case 'survey':
      return '调查问卷';
    case 'vote':
      return '投票记录';
    case 'register':
      return '报名信息';
    default:
      break;
  }

  const name = normalizeText(resource?.name).toLowerCase();
  if (name.endsWith('.pdf')) return 'PDF 文档';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'PPT 课件';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word 文档';
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '表格文件';
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(name)) return '图片资料';
  if (/\.(mp3|wav|m4a)$/i.test(name)) return '音频资料';
  return '资料文件';
}

function extractResourceSummary(resource) {
  if (resource?.meta?.summary) return resource.meta.summary;
  if (Array.isArray(resource?.meta?.paragraphs) && resource.meta.paragraphs.length > 0) {
    return resource.meta.paragraphs[0];
  }
  return '';
}

function findActivityRule(sceneType, resource, resourcePath, resourceSummary) {
  const rules = ACTIVITY_RULES[sceneType] || [];
  const text = buildRuleText(resource, resourcePath, resourceSummary);

  return rules.find((rule) => (
    (rule.resourceTypes || []).includes(resource?.type)
      || (rule.matches || []).some((pattern) => text.includes(pattern))
  )) || rules[0] || null;
}

function getSourceKeyBySceneType(sceneType) {
  return SCENE_SOURCE_KEY_MAP[sceneType] || 'archive';
}

function matchName(target, candidate) {
  const left = normalizeText(target);
  const right = normalizeText(candidate);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function resolveCapabilityMappings(modelDefinition, rule) {
  const dimensions = modelDefinition?.dimensions || [];
  const matchedItems = [];

  dimensions.forEach((dimension) => {
    const dimensionMatched = (rule?.dimensionNames || []).some((name) => matchName(dimension.name, name));
    (dimension.items || []).forEach((item) => {
      const itemMatched = (rule?.itemNames || []).some((name) => matchName(item.name, name));
      if (itemMatched || (dimensionMatched && matchedItems.length < 3)) {
        matchedItems.push({
          dimensionName: dimension.name,
          itemName: item.name,
        });
      }
    });
  });

  const dedupedItems = [];
  const seen = new Set();

  matchedItems.forEach((item) => {
    const key = `${item.dimensionName}__${item.itemName}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedupedItems.push(item);
  });

  const mappingRows = dedupedItems.map((item, index) => ({
    key: `${item.dimensionName}_${item.itemName}_${index}`,
    dimensionName: item.dimensionName,
    itemName: item.itemName,
    coverage: clampCoverage((rule?.coverageBase || 78) + index * 3),
  }));

  return {
    dimensionNames: Array.from(new Set(mappingRows.map((item) => item.dimensionName))),
    itemNames: Array.from(new Set(mappingRows.map((item) => item.itemName))),
    mappingRows,
  };
}

export function isSceneResourceArchived(resource) {
  return resource?.meta?.archiveProfile?.status === 'archived';
}

export function buildSceneResourceArchiveMeta({
  scene,
  sceneId,
  sceneName,
  sceneType,
  sceneTypeLabel,
  storageScopeKey,
  resource,
  resources = [],
}) {
  const resolvedSceneType = sceneType || scene?.sceneType || scene?.templateSnapshot?.sceneType || 'CUSTOM';
  const resolvedSceneName = sceneName || scene?.name || '未命名空间';
  const resolvedSceneId = sceneId || scene?.id || storageScopeKey || resolvedSceneName;
  const resolvedSceneTypeLabel = sceneTypeLabel || getSceneTypeLabel(resolvedSceneType);
  const resourcePath = buildResourcePath({ name: resolvedSceneName }, resource, resources);
  const resourceSummary = extractResourceSummary(resource);
  const activityRule = findActivityRule(resolvedSceneType, resource, resourcePath, resourceSummary);
  const sourceKey = getSourceKeyBySceneType(resolvedSceneType);

  return {
    status: 'archived',
    archivedAt: nowText(),
    sourceKey,
    sceneId: resolvedSceneId,
    sceneName: resolvedSceneName,
    sceneType: resolvedSceneType,
    sceneTypeLabel: resolvedSceneTypeLabel,
    storageScopeKey: storageScopeKey || scene?.storageScopeKey || '',
    resourceKey: resource?.key || '',
    resourceName: resource?.name || '',
    resourcePath,
    activityType: activityRule?.activityType || 'scene_activity',
    activityLabel: activityRule?.activityLabel || '业务活动',
    bundleKey: activityRule?.bundleKey || activityRule?.activityType || 'scene_activity',
    dimensionHints: activityRule?.dimensionNames || [],
    capabilityHints: activityRule?.itemNames || [],
    summary: resourceSummary || `来自“${resolvedSceneName}”的${activityRule?.activityLabel || '业务活动'}已归档到我的档案。`,
    nextAction: activityRule?.nextAction || '可继续补充同类业务活动材料，完善成长记录沉淀。',
  };
}

function buildHistoryEntry(record) {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    coverage: record.coverage,
    statusLabel: record.statusLabel,
    statusColor: record.statusColor,
    resourcePath: record.resourcePath || '-',
    tag: record.tag,
    sourceLabel: record.sourceLabel,
    isCurrent: true,
  };
}

function buildSceneGrowthRecord(scene, resource, currentVersion, modelDefinition) {
  const archiveProfile = resource?.meta?.archiveProfile;
  if (!archiveProfile || archiveProfile.status !== 'archived') return null;

  const sourceKey = archiveProfile.sourceKey || getSourceKeyBySceneType(archiveProfile.sceneType || scene.sceneType);
  const activityRule = {
    coverageBase: 80,
    dimensionNames: archiveProfile.dimensionHints || [],
    itemNames: archiveProfile.capabilityHints || [],
  };
  const capabilityMappings = resolveCapabilityMappings(modelDefinition, activityRule);
  const coverageList = capabilityMappings.mappingRows.map((item) => item.coverage);
  const coverage = clampCoverage(
    coverageList.length
      ? coverageList.reduce((sum, item) => sum + item, 0) / coverageList.length
      : activityRule.coverageBase,
  );
  const status = buildStatusTag(coverage);
  const fileTypeLabel = resolveFileTypeLabel(resource);
  const summary = archiveProfile.summary || extractResourceSummary(resource) || `来自“${scene.name}”的${archiveProfile.activityLabel || '业务活动'}已归档到我的档案。`;
  const relatedItemNames = capabilityMappings.itemNames.length
    ? capabilityMappings.itemNames
    : (archiveProfile.capabilityHints || []);
  const relatedDimensionNames = capabilityMappings.dimensionNames.length
    ? capabilityMappings.dimensionNames
    : (archiveProfile.dimensionHints || []);

  const record = {
    id: `scene_record_${scene.id}_${currentVersion?.id || 'current'}_${resource.key}`,
    title: resource.name,
    ownerName: resource.owner || scene.owner || '空间成员',
    date: archiveProfile.archivedAt || resource.lastEdit || '-',
    tag: archiveProfile.activityLabel || '业务活动',
    summary,
    keyFindings: [
      `来源空间：${archiveProfile.sceneName || scene.name}`,
      `业务类型：${archiveProfile.activityLabel || '业务活动'}`,
      relatedItemNames.length
        ? `关联能力项：${relatedItemNames.join('、')}`
        : `关联能力类：${relatedDimensionNames.join('、') || '待补充'}`,
    ],
    evidenceExcerpt: extractResourceSummary(resource) || summary,
    attachments: [
      { name: resource.name, type: fileTypeLabel, size: resource.size || archiveProfile.sceneTypeLabel || '空间资料' },
    ],
    links: [
      { title: '来源空间', hint: archiveProfile.sceneName || scene.name },
      { title: '来源路径', hint: archiveProfile.resourcePath || resource.name },
    ],
    matchNote: relatedItemNames.length
      ? `该条记录来自“${archiveProfile.sceneName || scene.name}”，当前主要支撑 ${relatedItemNames.join('、')} 等能力项。`
      : `该条记录来自“${archiveProfile.sceneName || scene.name}”，当前已归入${archiveProfile.activityLabel || '业务活动'}成长记录。`,
    nextAction: archiveProfile.nextAction || '可继续补充同类业务活动材料，完善成长记录沉淀。',
    sourceKey,
    sourceLabel: '',
    sourceType: '',
    resourcePath: archiveProfile.resourcePath || resource.name,
    relatedDimensionNames,
    relatedItemNames,
    relatedLevelLabels: [],
    mappingRows: capabilityMappings.mappingRows,
    cellMappings: [],
    linkedItemCount: relatedItemNames.length,
    linkedLevelCount: 0,
    coverage,
    statusLabel: status.label,
    statusColor: status.color,
    sceneId: archiveProfile.sceneId || scene.id,
    sceneName: archiveProfile.sceneName || scene.name,
    sceneType: archiveProfile.sceneType || scene.sceneType,
    sceneTypeLabel: archiveProfile.sceneTypeLabel || getSceneTypeLabel(scene.sceneType),
    activityId: resource.key,
    activityType: archiveProfile.activityType || 'scene_activity',
    activityLabel: archiveProfile.activityLabel || '业务活动',
    bundleKey: archiveProfile.bundleKey || archiveProfile.activityType || 'scene_activity',
  };

  return {
    ...record,
    historyRecords: [buildHistoryEntry(record)],
    trendSummary: '当前仅有 1 条空间归档记录。',
  };
}

export function listArchivedSceneGrowthRecords(scenes = [], modelDefinition = null) {
  return scenes.flatMap((scene) => {
    const versionData = loadFromStorage({
      scopeKey: scene.storageScopeKey,
      initialData: () => buildSceneInitialVersionData(scene),
    });
    const currentVersion = getCurrentVersion(versionData);
    return (currentVersion?.resources || [])
      .filter((resource) => !resource.isFolder && isSceneResourceArchived(resource))
      .map((resource) => buildSceneGrowthRecord(scene, resource, currentVersion, modelDefinition))
      .filter(Boolean);
  });
}
