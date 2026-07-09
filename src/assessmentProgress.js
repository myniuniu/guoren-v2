const DEFAULT_LEARNER_ID = 'learner_self';

const ACTIVITY_TYPE_LABELS = {
  video: '视频课',
  live: '直播课',
  exam: '考试',
  offline: '线下集训',
  other: '其他',
  '': '活动',
};

const ACTIVITY_ALLOWED_RESOURCE_TYPES = {
  video: ['video'],
  live: ['file', 'video', 'activity'],
  exam: ['exam'],
  offline: ['activity'],
  other: null,
  '': null,
};

const REVIEW_STATUS_LABELS = {
  not_started: '未开始',
  in_progress: '进行中',
  pending: '待评阅',
  passed: '已达标',
  failed: '未达标',
};

const METRIC_KEY_BY_LABEL = {
  完成率: 'completionRate',
  出勤率: 'attendanceRate',
  提交率: 'submitRate',
  分数: 'score',
  得分: 'score',
  时长: 'durationMinutes',
  学习时长: 'durationMinutes',
  出勤次数: 'attendanceCount',
};

const UNNAMED_ACTIVITY_LABELS = new Set(['', '新活动', '未命名活动']);

function isLeafResourceVisibleForActivityProgress(resource, activityType = '') {
  if (!resource || resource.isFolder) return false;
  const allowedTypes = ACTIVITY_ALLOWED_RESOURCE_TYPES[activityType ?? ''];
  return !allowedTypes || allowedTypes.includes(resource.type);
}

function collectVisibleDescendantKeys(rootKey, activityType, childrenByParent, visibleKeys) {
  let hasVisibleDescendant = false;

  (childrenByParent.get(rootKey) || []).forEach((child) => {
    if (child.isFolder) {
      const childHasVisibleDescendant = collectVisibleDescendantKeys(child.key, activityType, childrenByParent, visibleKeys);
      if (childHasVisibleDescendant) {
        visibleKeys.add(child.key);
        hasVisibleDescendant = true;
      }
      return;
    }

    if (isLeafResourceVisibleForActivityProgress(child, activityType)) {
      visibleKeys.add(child.key);
      hasVisibleDescendant = true;
    }
  });

  return hasVisibleDescendant;
}

export function collectActivityProgressVisibleResourceKeys({
  rootKey,
  activityType = '',
  resourceMap,
  childrenByParent,
}) {
  const visibleKeys = new Set();
  if (!rootKey || !resourceMap?.has(rootKey)) return visibleKeys;
  collectVisibleDescendantKeys(rootKey, activityType, childrenByParent, visibleKeys);
  return visibleKeys;
}

export function shouldShowActivityProgressForResource({
  resourceKey,
  activityType = '',
  resourceMap,
  childrenByParent,
}) {
  if (!resourceKey || !resourceMap?.has(resourceKey)) return false;
  const resource = resourceMap.get(resourceKey);
  if (!resource?.isFolder) {
    return isLeafResourceVisibleForActivityProgress(resource, activityType);
  }
  return collectActivityProgressVisibleResourceKeys({
    rootKey: resourceKey,
    activityType,
    resourceMap,
    childrenByParent,
  }).size > 0;
}

export function getDefaultAssessmentProgress() {
  return {
    currentLearnerId: DEFAULT_LEARNER_ID,
    learners: [
      { id: DEFAULT_LEARNER_ID, name: '张同学', roleKey: 'student' },
      { id: 'learner_demo_2', name: '李同学', roleKey: 'student' },
    ],
    activityRecords: [],
  };
}

function normalizeMetricValues(metricValues = {}) {
  return {
    completionRate: Number(metricValues.completionRate ?? 0),
    attendanceRate: Number(metricValues.attendanceRate ?? 0),
    submitRate: Number(metricValues.submitRate ?? 0),
    score: Number(metricValues.score ?? 0),
    durationMinutes: Number(metricValues.durationMinutes ?? 0),
    attendanceCount: Number(metricValues.attendanceCount ?? 0),
  };
}

export function normalizeAssessmentProgress(progress = {}) {
  const fallback = getDefaultAssessmentProgress();
  const learners = Array.isArray(progress.learners) && progress.learners.length
    ? progress.learners.map((learner, index) => ({
        id: learner?.id || (index === 0 ? DEFAULT_LEARNER_ID : `learner_${index + 1}`),
        name: learner?.name || `学员${index + 1}`,
        roleKey: learner?.roleKey || 'student',
      }))
    : fallback.learners;
  const learnerIds = new Set(learners.map((learner) => learner.id));
  const currentLearnerId = learnerIds.has(progress.currentLearnerId)
    ? progress.currentLearnerId
    : learners[0]?.id || DEFAULT_LEARNER_ID;

  return {
    currentLearnerId,
    learners,
    activityRecords: Array.isArray(progress.activityRecords)
      ? progress.activityRecords.map((record) => ({
          learnerId: record?.learnerId || currentLearnerId,
          activityKey: record?.activityKey || '',
          metricValues: normalizeMetricValues(record?.metricValues),
          reviewStatus: record?.reviewStatus || 'in_progress',
          updatedAt: record?.updatedAt || '',
          evidenceResourceKeys: Array.isArray(record?.evidenceResourceKeys) ? record.evidenceResourceKeys : [],
          note: record?.note || '',
        })).filter((record) => record.activityKey)
      : [],
  };
}

function getResourcePath(resource, resourceMap) {
  if (!resource) return '';
  const parts = [resource.name].filter(Boolean);
  const visited = new Set([resource.key]);
  let parentKey = resource.parentKey ?? null;

  while (parentKey && !visited.has(parentKey)) {
    visited.add(parentKey);
    const parent = resourceMap.get(parentKey);
    if (!parent) break;
    parts.unshift(parent.name);
    parentKey = parent.parentKey ?? null;
  }

  return parts.join(' / ');
}

function buildActivityParentMap({ resources, assessment, stages, customActivities, promotedSet, deletedSet }) {
  const resourceMap = new Map(resources.map((resource) => [resource.key, resource]));
  const customActivityMap = new Map(customActivities.map((activity) => [activity.key, activity]));
  const stageKeySet = new Set(stages.map((stage) => stage.key));
  const overrides = assessment?.parentOverrides || {};
  const activityParentMap = new Map();

  stages.forEach((stage) => {
    resources
      .filter((resource) => resource.isFolder && resource.parentKey === stage.key && !promotedSet.has(resource.key))
      .forEach((activity) => {
        const overriddenStageKey = overrides[activity.key];
        const validOverride = overriddenStageKey && stageKeySet.has(overriddenStageKey) && !deletedSet.has(overriddenStageKey);
        activityParentMap.set(activity.key, validOverride ? overriddenStageKey : stage.key);
      });
  });

  Object.entries(overrides).forEach(([activityKey, stageKey]) => {
    if (activityParentMap.has(activityKey)) return;
    if (deletedSet.has(activityKey) || deletedSet.has(stageKey)) return;
    if (promotedSet.has(activityKey) || stageKeySet.has(activityKey)) return;
    const activity = resourceMap.get(activityKey) || customActivityMap.get(activityKey);
    if (!activity?.isFolder || !stageKeySet.has(stageKey)) return;
    activityParentMap.set(activityKey, stageKey);
  });

  customActivities.forEach((activity) => {
    if (activityParentMap.has(activity.key)) return;
    const targetStageKey = overrides[activity.key] || activity.parentKey;
    if (!stageKeySet.has(targetStageKey) || deletedSet.has(targetStageKey)) return;
    activityParentMap.set(activity.key, targetStageKey);
  });

  return activityParentMap;
}

function getExplicitActivityName(activity) {
  const name = String(activity?.name ?? '').trim();
  return name && !UNNAMED_ACTIVITY_LABELS.has(name) ? name : '';
}

function getSingleBoundFolderActivityResource(customActivity, resourceMap) {
  const boundResources = Array.isArray(customActivity?.boundResources) ? customActivity.boundResources : [];
  if (boundResources.length !== 1) return null;
  const boundResource = boundResources[0];
  if (!boundResource?.key || !boundResource.isFolder) return null;
  const resource = resourceMap.get(boundResource.key);
  if (resource && !resource.isFolder) return null;
  return resource || {
    key: boundResource.key,
    name: boundResource.name || '',
    isFolder: true,
    parentKey: boundResource.parentKey ?? null,
  };
}

export function buildAssessmentTree(resources = [], assessment = {}) {
  const safeAssessment = assessment || {};
  const deletedSet = new Set(safeAssessment.deletedNodes || []);
  const resourceMap = new Map(resources.map((resource) => [resource.key, resource]));
  const promotedSet = new Set((safeAssessment.stagePromotions || []).filter((key) => !deletedSet.has(key)));
  const builtinStages = resources
    .filter((resource) => resource.isFolder && resource.parentKey === null && !deletedSet.has(resource.key))
    .map((resource) => ({ key: resource.key, name: resource.name, sourceType: 'resource' }));
  const promotedStages = [...promotedSet]
    .map((key) => resourceMap.get(key))
    .filter((resource) => resource?.isFolder && resource.parentKey !== null)
    .map((resource) => ({ key: resource.key, name: resource.name, sourceType: 'promoted' }));
  const customStages = (safeAssessment.customStages || [])
    .filter((stage) => stage?.key && !deletedSet.has(stage.key))
    .map((stage) => ({ key: stage.key, name: stage.name || '未命名阶段', sourceType: 'custom' }));
  const stages = [...builtinStages, ...promotedStages, ...customStages];
  const customActivities = (safeAssessment.customActivities || [])
    .filter((activity) => activity?.key && !deletedSet.has(activity.key))
    .map((activity) => ({
      key: activity.key,
      name: typeof activity.name === 'string' ? activity.name : '',
      isFolder: true,
      parentKey: activity.parentKey,
      isCustomActivity: true,
      boundResources: Array.isArray(activity.boundResources) ? activity.boundResources : [],
    }));
  const customActivityMap = new Map(customActivities.map((activity) => [activity.key, activity]));
  const rules = Array.isArray(safeAssessment.rules) ? safeAssessment.rules : [];
  const ruleMap = new Map(rules.filter((rule) => rule?.folderKey).map((rule) => [rule.folderKey, rule]));
  const activityParentMap = buildActivityParentMap({
    resources,
    assessment: safeAssessment,
    stages,
    customActivities,
    promotedSet,
    deletedSet,
  });

  const stageNodes = stages.map((stage) => {
    const activities = [...activityParentMap.entries()]
      .filter(([activityKey, stageKey]) => stageKey === stage.key && ruleMap.has(activityKey) && !deletedSet.has(activityKey))
      .map(([activityKey]) => {
        const customActivity = customActivityMap.get(activityKey);
        const resourceActivity = resourceMap.get(activityKey);
        const activity = customActivity || resourceActivity;
        if (!activity) return null;
        const rule = ruleMap.get(activityKey);
        const singleBoundFolderActivity = customActivity
          ? getSingleBoundFolderActivityResource(customActivity, resourceMap)
          : null;
        const explicitActivityName = customActivity ? getExplicitActivityName(customActivity) : activity.name;
        const activityName = explicitActivityName
          || singleBoundFolderActivity?.name
          || rule.folderName
          || activity.name
          || '未命名活动';
        const boundResources = customActivity
          ? customActivity.boundResources
          : [{ key: activity.key, name: activity.name, isFolder: !!activity.isFolder }];
        return {
          key: activity.key,
          name: activityName,
          path: singleBoundFolderActivity
            ? getResourcePath(singleBoundFolderActivity, resourceMap)
            : resourceActivity
              ? getResourcePath(resourceActivity, resourceMap)
              : rule.folderName || activityName || '',
          displayResourceKey: singleBoundFolderActivity?.key || resourceActivity?.key || '',
          activityType: rule.activityType || '',
          activityTypeLabel: ACTIVITY_TYPE_LABELS[rule.activityType || ''] || ACTIVITY_TYPE_LABELS.other,
          weight: Number(rule.weight || 0),
          required: rule.required !== false,
          passCondition: rule.passCondition || { metric: '完成率', op: '>=', value: 80 },
          boundResources,
          isCustomActivity: !!customActivity,
        };
      })
      .filter(Boolean);

    return {
      ...stage,
      activities,
      totalWeight: activities.reduce((sum, activity) => sum + activity.weight, 0),
    };
  }).filter((stage) => stage.activities.length > 0);

  return {
    stages: stageNodes,
    activities: stageNodes.flatMap((stage) => stage.activities.map((activity) => ({ ...activity, stageKey: stage.key }))),
  };
}

export function getMetricKey(metricLabel) {
  return METRIC_KEY_BY_LABEL[metricLabel] || 'completionRate';
}

export function getMetricUnit(metricLabel) {
  if (['完成率', '出勤率', '提交率'].includes(metricLabel)) return '%';
  if (metricLabel === '分数' || metricLabel === '得分') return '分';
  if (metricLabel === '时长' || metricLabel === '学习时长') return '分钟';
  if (metricLabel === '出勤次数') return '次';
  return '';
}

function compareValue(actual, op, target) {
  switch (op) {
    case '>':
      return actual > target;
    case '=':
      return actual === target;
    case '<=':
      return actual <= target;
    case '>=':
    default:
      return actual >= target;
  }
}

function getActivityScorePercent(activity, actualValue) {
  const metric = activity.passCondition?.metric || '完成率';
  const target = Number(activity.passCondition?.value ?? 0);
  if (metric === '分数' || metric === '得分' || ['完成率', '出勤率', '提交率'].includes(metric)) {
    return Math.max(0, Math.min(100, actualValue));
  }
  if (target > 0) {
    return Math.max(0, Math.min(100, (actualValue / target) * 100));
  }
  return actualValue > 0 ? 100 : 0;
}

export function evaluateActivityProgress(activity, record = null) {
  const condition = activity.passCondition || { metric: '完成率', op: '>=', value: 80 };
  const metricKey = getMetricKey(condition.metric);
  const metricValues = normalizeMetricValues(record?.metricValues);
  const actualValue = Number(metricValues[metricKey] ?? 0);
  const targetValue = Number(condition.value ?? 0);
  const hasRecord = !!record;
  const hasMetric = hasRecord && Number.isFinite(actualValue) && actualValue > 0;
  const passed = hasRecord && compareValue(actualValue, condition.op || '>=', targetValue);
  let statusKey;

  if (!hasRecord) {
    statusKey = 'not_started';
  } else if (record.reviewStatus === 'pending') {
    statusKey = 'pending';
  } else if (!hasMetric) {
    statusKey = 'not_started';
  } else if (passed || record.reviewStatus === 'passed') {
    statusKey = 'passed';
  } else if (record.reviewStatus === 'failed') {
    statusKey = 'failed';
  } else {
    statusKey = 'in_progress';
  }

  const scorePercent = getActivityScorePercent(activity, actualValue);

  return {
    ...activity,
    record,
    metricKey,
    metricLabel: condition.metric || '完成率',
    metricUnit: getMetricUnit(condition.metric),
    actualValue,
    targetValue,
    passed: statusKey === 'passed',
    statusKey,
    statusLabel: REVIEW_STATUS_LABELS[statusKey],
    scorePercent,
    weightedScore: (Number(activity.weight || 0) * scorePercent) / 100,
    progressPercent: scorePercent,
  };
}

export function buildLearnerAssessmentProgress({ resources = [], assessment = {}, assessmentProgress = {} }) {
  const normalizedProgress = normalizeAssessmentProgress(assessmentProgress);
  const learnerId = normalizedProgress.currentLearnerId;
  const learner = normalizedProgress.learners.find((item) => item.id === learnerId) || normalizedProgress.learners[0] || null;
  const recordMap = new Map(
    normalizedProgress.activityRecords
      .filter((record) => record.learnerId === learnerId)
      .map((record) => [record.activityKey, record]),
  );
  const tree = buildAssessmentTree(resources, assessment);
  const stages = tree.stages.map((stage) => {
    const activities = stage.activities.map((activity) => evaluateActivityProgress(activity, recordMap.get(activity.key) || null));
    const totalWeight = activities.reduce((sum, activity) => sum + activity.weight, 0);
    const weightedScore = activities.reduce((sum, activity) => sum + activity.weightedScore, 0);
    const passedCount = activities.filter((activity) => activity.passed).length;

    return {
      ...stage,
      activities,
      totalWeight,
      weightedScore,
      progressPercent: totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0,
      passedCount,
    };
  });
  const activities = stages.flatMap((stage) => stage.activities);
  const totalWeight = activities.reduce((sum, activity) => sum + activity.weight, 0);
  const weightedScore = activities.reduce((sum, activity) => sum + activity.weightedScore, 0);
  const requiredActivities = activities.filter((activity) => activity.required);
  const requiredPassedCount = requiredActivities.filter((activity) => activity.passed).length;
  const passScore = Number(assessment?.passScore ?? 60);
  const estimatedScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const allRequiredPassed = requiredActivities.length === 0 || requiredPassedCount === requiredActivities.length;
  const passedOverall = activities.length > 0 && allRequiredPassed && estimatedScore >= passScore;
  const nextActions = activities
    .filter((activity) => activity.statusKey !== 'passed')
    .sort((left, right) => Number(right.required) - Number(left.required) || right.weight - left.weight)
    .slice(0, 3);

  return {
    learner,
    stages,
    activities,
    summary: {
      totalActivities: activities.length,
      completedActivities: activities.filter((activity) => activity.statusKey === 'passed').length,
      progressPercent: totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0,
      estimatedScore,
      passScore,
      requiredTotal: requiredActivities.length,
      requiredPassed: requiredPassedCount,
      allRequiredPassed,
      passedOverall,
      certificateEnabled: !!assessment?.certificate,
      nextActions,
    },
  };
}

export function buildSampleAssessmentProgress(assessment = {}, resources = []) {
  const fallback = getDefaultAssessmentProgress();
  const rules = Array.isArray(assessment?.rules) ? assessment.rules : [];
  const ruleActivityKeys = new Set(rules.map((rule) => rule?.folderKey).filter(Boolean));
  const firstStage = resources.find((resource) => (
    resource?.isFolder && (resource.parentKey ?? null) === null
  ));
  const firstStageActivityKeys = firstStage
    ? resources
        .filter((resource) => resource?.isFolder && resource.parentKey === firstStage.key && ruleActivityKeys.has(resource.key))
        .map((resource) => resource.key)
    : [];
  const fullStageActivityKeys = new Set(
    firstStageActivityKeys.length
      ? firstStageActivityKeys
      : rules.slice(0, Math.min(3, rules.length)).map((rule) => rule?.folderKey).filter(Boolean),
  );
  const fullStageSample = {
    completionRate: 100,
    attendanceRate: 100,
    submitRate: 100,
    score: 100,
    durationMinutes: 120,
    attendanceCount: 3,
    reviewStatus: 'passed',
    note: '阶段整体达标示例：该活动已满进度完成，所在阶段汇总显示 100%。',
  };
  const patterns = [
    { completionRate: 100, attendanceRate: 96, submitRate: 100, score: 88, durationMinutes: 82, attendanceCount: 3, reviewStatus: 'passed', note: '已完成学习要求，记录已归档。' },
    { completionRate: 94, attendanceRate: 92, submitRate: 100, score: 78, durationMinutes: 68, attendanceCount: 2, reviewStatus: 'passed', note: '完成情况良好，可继续推进下一阶段。' },
    { completionRate: 86, attendanceRate: 84, submitRate: 100, score: 72, durationMinutes: 54, attendanceCount: 1, reviewStatus: 'passed', note: '已达到当前活动通过条件。' },
    { completionRate: 73, attendanceRate: 68, submitRate: 60, score: 54, durationMinutes: 36, attendanceCount: 1, reviewStatus: 'in_progress', note: '仍需补齐学习或参与记录。' },
    { completionRate: 100, attendanceRate: 100, submitRate: 100, score: 0, durationMinutes: 76, attendanceCount: 2, reviewStatus: 'pending', note: '已提交，等待评阅老师确认。' },
    { completionRate: 42, attendanceRate: 0, submitRate: 0, score: 0, durationMinutes: 18, attendanceCount: 0, reviewStatus: 'in_progress', note: '已开始学习，尚未达到通过条件。' },
    { completionRate: 100, attendanceRate: 76, submitRate: 100, score: 62, durationMinutes: 58, attendanceCount: 1, reviewStatus: 'failed', note: '本次结果未达标，建议补学后重新提交。' },
    { completionRate: 0, attendanceRate: 0, submitRate: 0, score: 0, durationMinutes: 0, attendanceCount: 0, reviewStatus: 'not_started', note: '' },
  ];
  const childrenByParent = resources.reduce((map, resource) => {
    const parentKey = resource.parentKey || '';
    if (!parentKey) return map;
    const list = map.get(parentKey) || [];
    list.push(resource);
    map.set(parentKey, list);
    return map;
  }, new Map());

  return {
    ...fallback,
    activityRecords: rules.map((rule, index) => {
      const sample = fullStageActivityKeys.has(rule.folderKey) ? fullStageSample : patterns[index % patterns.length];
      const metricValues = {
        completionRate: sample.completionRate,
        attendanceRate: sample.attendanceRate,
        submitRate: sample.submitRate,
        score: sample.score,
        durationMinutes: sample.durationMinutes,
        attendanceCount: sample.attendanceCount,
      };
      return {
        learnerId: DEFAULT_LEARNER_ID,
        activityKey: rule.folderKey,
        metricValues,
        reviewStatus: sample.reviewStatus,
        updatedAt: `2026-05-${String(8 + index).padStart(2, '0')} 18:00:00`,
        evidenceResourceKeys: (childrenByParent.get(rule.folderKey) || [])
          .filter((resource) => !resource.isFolder)
          .slice(0, 2)
          .map((resource) => resource.key),
        note: sample.note,
      };
    }),
  };
}
