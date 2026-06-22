const SCENE_TYPE_LABEL_MAP = {
  TEACHING: '教学场景',
  RESEARCH: '教研场景',
  TRAINING: '培训场景',
  COMMUNITY: '社区共创',
  CUSTOM: '自定义场景',
};

const REASON_LABEL_MAP = {
  ABILITY_GAP_MATCH: '匹配当前能力短板',
  EVIDENCE_SHORTAGE: '可支持补证',
  CURRENT_REVIEW_STAGE: '贴合当前评审阶段',
  ROLE_LEVEL_MATCH: '匹配岗位层级',
  ROLE_GROWTH_MATCH: '匹配成长阶段',
  SPACE_RECOMMENDATION_ENABLED: '模板已开启推荐',
  HIGH_QUALITY_SPACE: '适合持续沉淀成果',
  RECENT_BEHAVIOR_MATCH: '贴合当前关注项',
  REVIEW_READY: '可直接用于推进评审',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function summarizeReasons(reasonCodes = []) {
  return reasonCodes.map((code) => REASON_LABEL_MAP[code] || code);
}

function buildFocusKeywords(teacher, portraitSummary) {
  const keywords = new Set();
  (portraitSummary?.focusNames || []).forEach((item) => {
    const text = String(item || '').trim();
    if (text) keywords.add(text);
  });

  const roleText = `${teacher?.roleName || ''} ${teacher?.departmentName || ''}`.split(/[\s/]+/).map((item) => item.trim()).filter(Boolean);
  roleText.forEach((item) => {
    if (item.length >= 2) keywords.add(item);
  });

  return Array.from(keywords);
}

function inferPrioritySceneTypes(teacher, portraitSummary) {
  const targetLevel = `${teacher?.targetLevel || ''}`;
  const roleName = `${teacher?.roleName || ''}`;
  const focusText = `${(portraitSummary?.focusNames || []).join(' ')} ${(portraitSummary?.portraitTag || '')}`;
  const types = [];

  if (/初任|青年|新教师/.test(targetLevel)) {
    types.push('TEACHING', 'TRAINING');
  }
  if (/带头人|负责人/.test(targetLevel)) {
    types.push('RESEARCH', 'COMMUNITY');
  }
  if (/双师|企业|校企/.test(`${targetLevel} ${focusText}`)) {
    types.push('TRAINING', 'RESEARCH');
  }
  if (/教研/.test(roleName) || /教研/.test(focusText)) {
    types.push('RESEARCH');
  }
  if (/课堂|教学/.test(focusText)) {
    types.push('TEACHING');
  }

  if (portraitSummary?.riskLevel === 'HIGH') {
    types.unshift('TRAINING');
  } else if (portraitSummary?.riskLevel === 'LOW') {
    types.unshift('RESEARCH');
  }

  types.push('TEACHING', 'RESEARCH', 'TRAINING');
  return Array.from(new Set(types));
}

function buildSceneRecommendation(scene, teacher, portraitSummary, prioritySceneTypes, focusKeywords) {
  const template = scene?.templateSnapshot || {};
  const recommendation = template.recommendation || {};
  const haystack = normalizeText([
    scene?.name,
    scene?.description,
    scene?.templateName,
    recommendation.description,
    recommendation.resourceScope,
    ...(template.folderTypes || []).map((item) => item.name),
    ...(template.toolConfigs || []).map((item) => item.name),
  ].join(' '));

  let score = 52;
  const reasonCodes = [];

  if (prioritySceneTypes.includes(scene.sceneType)) {
    score += 20 - (prioritySceneTypes.indexOf(scene.sceneType) * 3);
    reasonCodes.push('ROLE_GROWTH_MATCH');
  }

  if (recommendation.enabled) {
    score += 10;
    reasonCodes.push('SPACE_RECOMMENDATION_ENABLED');
  }

  const keywordHitCount = focusKeywords.filter((item) => haystack.includes(normalizeText(item))).length;
  if (keywordHitCount > 0) {
    score += Math.min(keywordHitCount * 8, 16);
    reasonCodes.push('ABILITY_GAP_MATCH');
    reasonCodes.push('RECENT_BEHAVIOR_MATCH');
  }

  if (portraitSummary?.gapCount > 0 && /培训|课程|考试|作业|研修/.test(haystack)) {
    score += 12;
    reasonCodes.push('EVIDENCE_SHORTAGE');
  }

  if (portraitSummary?.inReviewCount > 0 && /评审|成果|复盘|纪要|案例/.test(haystack)) {
    score += 10;
    reasonCodes.push('CURRENT_REVIEW_STAGE');
  }

  if (portraitSummary?.approvedCount > 0 && /共创|教研|精选|成果/.test(haystack)) {
    score += 6;
    reasonCodes.push('HIGH_QUALITY_SPACE');
  }

  if (teacher?.targetLevel && haystack.includes(normalizeText(teacher.targetLevel))) {
    score += 8;
    reasonCodes.push('ROLE_LEVEL_MATCH');
  }

  const finalScore = clamp(Math.round(score), 45, 98);
  const uniqueReasons = Array.from(new Set(reasonCodes));
  const reasonLabels = summarizeReasons(uniqueReasons);
  const subtitle = `${scene.templateName} · ${SCENE_TYPE_LABEL_MAP[scene.sceneType] || scene.sceneType}`;
  const reasonSummary = reasonLabels.slice(0, 2).join('，') || '推荐给当前成长阶段的教师';

  return {
    id: `scene_rec_${scene.id}`,
    type: 'scene',
    position: 'teacher_portrait',
    strategy: 'teacher_capability_rule_v1',
    score: finalScore,
    title: scene.name,
    subtitle,
    description: scene.description || template.theme?.heroSubtitle || '推荐进入该空间查看相关资料与任务。',
    emphasis: recommendation.resourceScope || recommendation.description || '可在空间内继续沉淀资料、成果与活动参与记录。',
    reasonCodes: uniqueReasons,
    reasonLabels,
    reasonSummary,
    actionLabel: '进入空间',
    target: {
      type: 'scene',
      sceneId: scene.id,
      menuKey: scene.menuKey,
    },
    meta: {
      sceneType: scene.sceneType,
      templateName: scene.templateName,
    },
  };
}

function buildActionRecommendations(teacher, portraitSummary) {
  const actions = [];
  const focusLabel = portraitSummary?.focusNames?.slice(0, 2).join('、') || '关键能力项';
  const teacherId = teacher?.teacherId || '';
  const evaluationTarget = {
    type: 'teacher_evaluation',
    teacherId,
    teacherName: teacher?.name || '',
  };

  if (portraitSummary?.gapCount > 0) {
    actions.push({
      id: `action_gap_${teacherId}`,
      type: 'action',
      position: 'teacher_portrait',
      strategy: 'teacher_capability_rule_v1',
      score: clamp(96 - portraitSummary.gapCount, 80, 96),
      title: `优先补齐 ${focusLabel} 的阈值证据`,
      subtitle: `当前仍缺 ${portraitSummary.gapCount} 条关键证据`,
      description: '建议先进入教师评价实例，围绕短板项补充直接行为证据、结果证据和过程材料。',
      emphasis: '优先完成补证动作，避免影响本轮评审推进。',
      reasonCodes: ['EVIDENCE_SHORTAGE', 'ABILITY_GAP_MATCH'],
      reasonLabels: summarizeReasons(['EVIDENCE_SHORTAGE', 'ABILITY_GAP_MATCH']),
      reasonSummary: '当前主要短板集中在缺证项，补齐后可直接改善画像稳定性。',
      actionLabel: '去教师评价',
      target: evaluationTarget,
    });
  }

  if (portraitSummary?.pendingAiDrafts > 0) {
    actions.push({
      id: `action_ai_${teacherId}`,
      type: 'action',
      position: 'teacher_portrait',
      strategy: 'teacher_capability_rule_v1',
      score: 90,
      title: '先核对待确认 AI 建议稿',
      subtitle: `${portraitSummary.pendingAiDrafts} 份待人工确认`,
      description: '建议先确认 AI 生成的成长摘要和量规预填草稿，避免画像、证据包和评审意见脱节。',
      emphasis: '该动作通常是推进评审的最快路径。',
      reasonCodes: ['CURRENT_REVIEW_STAGE', 'REVIEW_READY'],
      reasonLabels: summarizeReasons(['CURRENT_REVIEW_STAGE', 'REVIEW_READY']),
      reasonSummary: '当前已有可用草稿，人工确认后能直接提升推进效率。',
      actionLabel: '处理建议稿',
      target: evaluationTarget,
    });
  }

  if (portraitSummary?.inReviewCount > 0) {
    actions.push({
      id: `action_review_${teacherId}`,
      type: 'action',
      position: 'teacher_portrait',
      strategy: 'teacher_capability_rule_v1',
      score: 88,
      title: '围绕最新实例补强关键说明',
      subtitle: portraitSummary.latestRecord
        ? `${portraitSummary.latestRecord.schemeNameSnapshot} · ${portraitSummary.latestRecord.periodLabel}`
        : '当前已有评审推进中的实例',
      description: '把最近周期中最薄弱的证据项说明清楚，优先补齐结果佐证与同行/企业意见。',
      emphasis: '聚焦最近实例，避免分散准备精力。',
      reasonCodes: ['CURRENT_REVIEW_STAGE', 'ABILITY_GAP_MATCH'],
      reasonLabels: summarizeReasons(['CURRENT_REVIEW_STAGE', 'ABILITY_GAP_MATCH']),
      reasonSummary: '当前正处于评审阶段，继续围绕最新实例补强最有效。',
      actionLabel: '查看当前实例',
      target: evaluationTarget,
    });
  }

  if (portraitSummary?.riskLevel === 'LOW' && portraitSummary?.approvedCount > 0) {
    actions.push({
      id: `action_share_${teacherId}`,
      type: 'action',
      position: 'teacher_portrait',
      strategy: 'teacher_capability_rule_v1',
      score: 84,
      title: '把优势案例沉淀到教研/共创空间',
      subtitle: '当前画像稳定，可开始外化经验',
      description: '建议把高覆盖度能力项形成案例、研讨纪要或专题资料，沉淀为可复用的标杆经验。',
      emphasis: '稳定阶段更适合做经验输出与同伴带动。',
      reasonCodes: ['HIGH_QUALITY_SPACE', 'ROLE_GROWTH_MATCH'],
      reasonLabels: summarizeReasons(['HIGH_QUALITY_SPACE', 'ROLE_GROWTH_MATCH']),
      reasonSummary: '当前画像稳定，适合从补证转向经验沉淀与同伴带动。',
      actionLabel: '查看推荐空间',
      target: {
        type: 'space_catalog',
        menuKey: 'teaching-research',
      },
    });
  }

  return actions.slice(0, 3);
}

function buildResourceRecommendations(sceneRecommendations, portraitSummary) {
  return sceneRecommendations.slice(0, 3).map((item, index) => ({
    id: `resource_rec_${item.target.sceneId}`,
    type: 'resource',
    position: 'teacher_portrait',
    strategy: item.strategy,
    score: clamp(item.score - (index * 2), 60, 96),
    title: `${item.meta.templateName}推荐资料方向`,
    subtitle: item.title,
    description: item.emphasis || item.description,
    emphasis: portraitSummary?.focusNames?.length
      ? `建议优先关注：${portraitSummary.focusNames.slice(0, 2).join('、')}`
      : '建议优先围绕当前评价项与成长任务查看资料。',
    reasonCodes: item.reasonCodes,
    reasonLabels: item.reasonLabels,
    reasonSummary: item.reasonSummary,
    actionLabel: '打开对应空间',
    target: item.target,
  }));
}

export function buildTeacherCapabilityRecommendations({ teacher, portraitSummary, scenes = [] }) {
  if (!teacher || !portraitSummary) {
    return {
      preferredSceneTypes: [],
      sceneRecommendations: [],
      actionRecommendations: [],
      resourceRecommendations: [],
    };
  }

  const focusKeywords = buildFocusKeywords(teacher, portraitSummary);
  const preferredSceneTypes = inferPrioritySceneTypes(teacher, portraitSummary);
  const sceneRecommendations = scenes
    .map((scene) => buildSceneRecommendation(scene, teacher, portraitSummary, preferredSceneTypes, focusKeywords))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const actionRecommendations = buildActionRecommendations(teacher, portraitSummary);
  const resourceRecommendations = buildResourceRecommendations(sceneRecommendations, portraitSummary);

  return {
    preferredSceneTypes,
    sceneRecommendations,
    actionRecommendations,
    resourceRecommendations,
    summary: {
      sceneCount: sceneRecommendations.length,
      actionCount: actionRecommendations.length,
      resourceCount: resourceRecommendations.length,
    },
  };
}
