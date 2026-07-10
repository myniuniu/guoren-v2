import { findResourceAssociationRule, inferResourceSourceKey } from '../shared/resourceRecordAssociations';

const EXCLUDED_FILE_TYPES = new Set(['knowledgeGraph', 'capabilityModel', 'folder']);

export const RECOMMENDATION_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'evidence_gap', label: '补证优先' },
  { key: 'target', label: '目标提升' },
  { key: 'recent', label: '近期相关' },
  { key: 'quality', label: '高质量复用' },
];

export const REASON_LABEL_MAP = {
  PROFILE_GAP_MATCH: '匹配档案缺口',
  TARGET_LEVEL_SUPPORT: '支撑目标层级',
  EVIDENCE_SHORTAGE: '可补充证据',
  RESOURCE_TAG_MATCH: '资源标签吻合',
  SOURCE_ASSOCIATION: '材料来源相近',
  PARSED_CONTENT: '内容已解析',
  RECENT_UPDATE: '近期更新',
  HIGH_QUALITY_REUSE: '适合复用',
  ORG_LIBRARY_TRUSTED: '组织资料库',
  FALLBACK_ORG: '按组织资源推荐',
};

const FILE_TYPE_EVIDENCE_HINTS = {
  pdf: '适合作为制度、报告、案例或证明材料沉淀',
  docx: '适合作为方案、记录、总结或过程材料补充',
  pptx: '适合作为课程、汇报或培训展示材料复用',
  xlsx: '适合作为评价、统计或过程数据补充',
  video: '适合作为课堂实录、培训过程或场景证据',
  audio: '适合作为访谈、研讨或课堂过程记录',
  image: '适合作为现场照片、成果图或证明材料',
  note: '适合作为复盘、观察或过程说明',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function normalizeKeyword(value) {
  return String(value || '').trim();
}

function addUnique(list, value) {
  const text = normalizeKeyword(value);
  if (text && !list.includes(text)) list.push(text);
}

function parseDateValue(value) {
  if (!value) return null;
  const normalized = String(value)
    .trim()
    .replace(/[年.-]/g, '/')
    .replace(/月/g, '/')
    .replace(/日/g, '')
    .replace(/\s+/g, ' ');
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function getFreshnessScore(value) {
  const timestamp = parseDateValue(value);
  if (!timestamp) return 4;
  const days = Math.max(0, Math.round((Date.now() - timestamp) / (24 * 60 * 60 * 1000)));
  if (days <= 30) return 18;
  if (days <= 90) return 15;
  if (days <= 180) return 11;
  if (days <= 365) return 7;
  return 3;
}

function buildTagMap(tagDefinitions = []) {
  return new Map((tagDefinitions || []).map((tag) => [tag.id, tag.name]));
}

function getResourceTagNames(resource, tagMap) {
  return (resource?.tags || [])
    .map((tagId) => tagMap.get(tagId))
    .filter(Boolean);
}

function buildResourceSearchText(resource, tagNames = []) {
  const chunkText = Array.isArray(resource?.contentChunks)
    ? resource.contentChunks.map((chunk) => (typeof chunk === 'string' ? chunk : chunk?.text || '')).join(' ')
    : '';
  return normalizeText([
    resource?.name,
    resource?.summary,
    resource?.description,
    resource?.contentText,
    resource?.comment,
    resource?.extractedText,
    resource?.ocrText,
    resource?.transcript,
    resource?.noteText,
    resource?.text,
    resource?.libraryName,
    resource?.path,
    resource?.resourcePath,
    chunkText,
    ...tagNames,
  ].filter(Boolean).join(' '));
}

function includesLoose(haystack, needle) {
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedNeedle || normalizedNeedle.length < 2) return false;
  return haystack.includes(normalizedNeedle) || compactText(haystack).includes(compactText(normalizedNeedle));
}

function matchAnyKeyword(haystack, keywords = []) {
  return keywords.filter((keyword) => includesLoose(haystack, keyword));
}

function flattenRecordsBySource(snapshot) {
  return Object.values(snapshot?.recordsBySource || {})
    .flat()
    .filter(Boolean)
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
}

function buildFocusRows(snapshot) {
  const rows = Array.isArray(snapshot?.mappingRows) ? snapshot.mappingRows : [];
  return rows
    .map((row) => {
      const coverage = Number.isFinite(Number(row.coverage)) ? Number(row.coverage) : 0;
      const evidenceCount = Number.isFinite(Number(row.evidenceCount)) ? Number(row.evidenceCount) : 0;
      const requiredEvidenceCount = Math.max(1, Number(row.requiredEvidenceCount || 1));
      const hasAdvice = Boolean(row.adviceSummary || row.adviceActions?.length || row.levelFocusLabel);
      const groupKey = coverage < 60 || hasAdvice
        ? 'target'
        : (coverage < 72 || evidenceCount < requiredEvidenceCount ? 'evidence_gap' : 'stable');
      return {
        ...row,
        coverage,
        evidenceCount,
        requiredEvidenceCount,
        evidenceGapCount: Math.max(0, requiredEvidenceCount - evidenceCount),
        groupKey,
        priority: (groupKey === 'target' ? 70 : groupKey === 'evidence_gap' ? 50 : 20)
          + Math.max(0, 90 - coverage)
          + Math.max(0, requiredEvidenceCount - evidenceCount) * 8,
      };
    })
    .filter((row) => row.groupKey !== 'stable')
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 10);
}

export function buildArchiveProfileBasis({ snapshot, version, teacherProfile } = {}) {
  const profile = {
    ...(snapshot?.context || {}),
    ...(snapshot?.profile || {}),
  };
  const focusRows = buildFocusRows(snapshot);
  const recentRecords = flattenRecordsBySource(snapshot).slice(0, 6);
  const profileKeywords = [];

  [
    profile.name,
    profile.roleName,
    profile.roleTitle,
    profile.roleLevelName,
    profile.industryName,
    profile.sequenceName,
    profile.departmentName,
    profile.schoolName,
    profile.growthHint,
    teacherProfile?.roleName,
    teacherProfile?.targetLevel,
    version?.targetLevel,
  ].forEach((item) => addUnique(profileKeywords, item));

  focusRows.forEach((row) => {
    addUnique(profileKeywords, row.itemName);
    addUnique(profileKeywords, row.dimensionName);
    addUnique(profileKeywords, row.levelFocusLabel);
    addUnique(profileKeywords, row.evidenceTag);
  });

  recentRecords.forEach((record) => {
    addUnique(profileKeywords, record.title);
    addUnique(profileKeywords, record.tag);
    addUnique(profileKeywords, record.focusItemName);
    (record.relatedItemNames || []).slice(0, 3).forEach((item) => addUnique(profileKeywords, item));
  });

  const summary = snapshot?.summary || {};
  return {
    hasProfile: Boolean(snapshot && (snapshot.mappingRows?.length || snapshot.profile || snapshot.context)),
    profile,
    version,
    teacherProfile,
    focusRows,
    recentRecords,
    profileKeywords: profileKeywords.filter((item) => item.length >= 2).slice(0, 40),
    targetLevel: version?.targetLevel || profile.roleLevelName || teacherProfile?.targetLevel || '当前目标层级',
    overallCoverage: Number.isFinite(Number(summary.overallCoverage)) ? Number(summary.overallCoverage) : null,
    focusItemCount: Number.isFinite(Number(summary.focusItemCount)) ? Number(summary.focusItemCount) : focusRows.length,
    missingLevelCount: Number.isFinite(Number(summary.missingLevelCount)) ? Number(summary.missingLevelCount) : 0,
    evidenceCount: Number.isFinite(Number(summary.totalEvidenceCount)) ? Number(summary.totalEvidenceCount) : recentRecords.length,
  };
}

function calculateAbilityMatch(resource, searchText, focusRows, profileKeywords, associationRule) {
  const matchedRows = [];
  const matchedDimensions = [];

  focusRows.forEach((row) => {
    const itemHit = includesLoose(searchText, row.itemName);
    const dimensionHit = includesLoose(searchText, row.dimensionName);
    const associationHit = [...(associationRule?.dimensionNames || []), ...(associationRule?.itemNames || [])]
      .some((name) => includesLoose(row.itemName, name) || includesLoose(row.dimensionName, name));
    if (itemHit || dimensionHit || associationHit) {
      matchedRows.push({
        row,
        itemHit,
        dimensionHit,
        associationHit,
      });
      if (row.dimensionName && !matchedDimensions.includes(row.dimensionName)) {
        matchedDimensions.push(row.dimensionName);
      }
    }
  });

  const keywordHits = matchAnyKeyword(searchText, profileKeywords).slice(0, 8);
  const itemHitCount = matchedRows.filter((item) => item.itemHit).length;
  const dimensionHitCount = matchedRows.filter((item) => item.dimensionHit).length;
  const associationHitCount = matchedRows.filter((item) => item.associationHit).length;
  const score = clamp(
    itemHitCount * 14
      + dimensionHitCount * 8
      + associationHitCount * 6
      + keywordHits.length * 3,
    0,
    32,
  );

  return {
    score,
    matchedRows: matchedRows.map((item) => item.row),
    matchedDimensions,
    keywordHits,
  };
}

function calculateEvidenceBoost(resource, abilityMatch, associationRule, sourceKey) {
  const fileTypeHint = FILE_TYPE_EVIDENCE_HINTS[resource?.fileType] ? 5 : 2;
  const targetRows = abilityMatch.matchedRows.filter((row) => row.groupKey === 'target');
  const gapRows = abilityMatch.matchedRows.filter((row) => row.groupKey === 'evidence_gap');
  const sourceScore = associationRule || ['teaching', 'study', 'research'].includes(sourceKey) ? 6 : 0;
  return clamp(targetRows.length * 10 + gapRows.length * 8 + sourceScore + fileTypeHint, 0, 28);
}

function calculateQuality(resource, tagNames, pathText) {
  let score = 6;
  if (resource?.parseStatus === 'parsed') score += 8;
  if (resource?.parseStatus === 'failed') score -= 12;
  if (tagNames.length > 0) score += Math.min(5, tagNames.length * 2);
  if (resource?.summary || resource?.contentText || resource?.description) score += 5;
  if (pathText && pathText.includes('/')) score += 3;
  if (resource?.libraryScope === 'organization') score += 4;
  return clamp(score, 0, 22);
}

function buildPrimaryReason({ basis, abilityMatch, evidenceBoost, tagNames, qualityScore, freshnessScore, associationRule }) {
  const firstRow = abilityMatch.matchedRows[0];
  if (firstRow) {
    if (firstRow.groupKey === 'target') {
      return `匹配档案中的目标提升项：${firstRow.dimensionName || '能力项'} / ${firstRow.itemName}`;
    }
    return `可补充档案中的证据不足项：${firstRow.dimensionName || '能力项'} / ${firstRow.itemName}`;
  }
  if (abilityMatch.keywordHits.length) {
    return `与档案关键词“${abilityMatch.keywordHits.slice(0, 2).join('、')}”相关`;
  }
  if (associationRule) {
    return associationRule.matchNote || '资源材料类型与档案证据来源相近';
  }
  if (!basis.hasProfile) {
    return '档案信息不足，按组织资料库的解析状态、标签和更新时间推荐';
  }
  if (tagNames.length) {
    return `资源标签“${tagNames.slice(0, 2).join('、')}”可作为档案补充线索`;
  }
  if (qualityScore >= 16 || freshnessScore >= 12 || evidenceBoost > 0) {
    return '组织资料库中质量和时效性较好的可复用资源';
  }
  return '组织资料库中可进一步查看的候选资源';
}

function buildRecommendationCategories({ abilityMatch, evidenceBoost, qualityScore, freshnessScore }) {
  const categories = new Set(['all']);
  if (abilityMatch.matchedRows.some((row) => row.groupKey === 'evidence_gap') || evidenceBoost >= 14) {
    categories.add('evidence_gap');
  }
  if (abilityMatch.matchedRows.some((row) => row.groupKey === 'target')) {
    categories.add('target');
  }
  if (freshnessScore >= 11) {
    categories.add('recent');
  }
  if (qualityScore >= 16) {
    categories.add('quality');
  }
  return Array.from(categories);
}

function buildReasonCodes({ basis, abilityMatch, evidenceBoost, tagNames, qualityScore, freshnessScore, associationRule }) {
  const codes = [];
  if (abilityMatch.matchedRows.length) codes.push('PROFILE_GAP_MATCH');
  if (abilityMatch.matchedRows.some((row) => row.groupKey === 'target')) codes.push('TARGET_LEVEL_SUPPORT');
  if (evidenceBoost >= 12) codes.push('EVIDENCE_SHORTAGE');
  if (tagNames.length) codes.push('RESOURCE_TAG_MATCH');
  if (associationRule) codes.push('SOURCE_ASSOCIATION');
  if (qualityScore >= 14) codes.push('HIGH_QUALITY_REUSE');
  codes.push('ORG_LIBRARY_TRUSTED');
  if (qualityScore >= 12) codes.push('PARSED_CONTENT');
  if (freshnessScore >= 11) codes.push('RECENT_UPDATE');
  if (!basis.hasProfile && !codes.includes('FALLBACK_ORG')) codes.unshift('FALLBACK_ORG');
  return Array.from(new Set(codes));
}

function buildEvidencePath({ basis, resource, abilityMatch, tagNames, pathText, primaryReason }) {
  const firstRow = abilityMatch.matchedRows[0];
  const profileName = basis.profile?.name || basis.teacherProfile?.name || '当前用户';
  const abilityNode = firstRow
    ? `${firstRow.dimensionName || '能力项'} / ${firstRow.itemName}`
    : (abilityMatch.keywordHits.slice(0, 2).join('、') || basis.targetLevel || '组织资源线索');
  const matchNode = tagNames.length
    ? `标签：${tagNames.slice(0, 3).join('、')}`
    : `标题：${resource.name}`;

  return [
    { label: '用户档案', value: `${profileName} · ${basis.targetLevel}` },
    { label: firstRow ? '档案关注项' : '推荐线索', value: abilityNode },
    { label: '资源命中点', value: matchNode },
    { label: '资料库路径', value: pathText || `${resource.libraryName || '组织资料库'} / ${resource.name}` },
    { label: '推荐动作', value: primaryReason },
  ];
}

function buildResourceRecommendation(resource, basis, tagMap) {
  const tagNames = getResourceTagNames(resource, tagMap);
  const searchText = buildResourceSearchText(resource, tagNames);
  const associationRule = findResourceAssociationRule(resource, { ignoreFileType: !resource?.fileType });
  const sourceKey = inferResourceSourceKey(resource);
  const abilityMatch = calculateAbilityMatch(resource, searchText, basis.focusRows, basis.profileKeywords, associationRule);
  const evidenceBoost = calculateEvidenceBoost(resource, abilityMatch, associationRule, sourceKey);
  const pathText = resource.path || resource.resourcePath || `${resource.libraryName || '组织资料库'} / ${resource.name}`;
  const qualityScore = calculateQuality(resource, tagNames, pathText);
  const freshnessScore = getFreshnessScore(resource.lastEdit || resource.updatedAt || resource.createdAt);
  const failedPenalty = resource.parseStatus === 'failed' ? 14 : 0;
  const noProfileBoost = basis.hasProfile ? 0 : Math.min(10, qualityScore + freshnessScore > 24 ? 8 : 4);
  const score = clamp(
    Math.round(38 + abilityMatch.score + evidenceBoost + qualityScore * 0.65 + freshnessScore * 0.5 + noProfileBoost - failedPenalty),
    45,
    98,
  );
  const primaryReason = buildPrimaryReason({
    basis,
    abilityMatch,
    evidenceBoost,
    tagNames,
    qualityScore,
    freshnessScore,
    associationRule,
  });
  const reasonCodes = buildReasonCodes({
    basis,
    abilityMatch,
    evidenceBoost,
    tagNames,
    qualityScore,
    freshnessScore,
    associationRule,
  });
  const reasonLabels = reasonCodes.map((code) => REASON_LABEL_MAP[code] || code);
  const categories = buildRecommendationCategories({
    abilityMatch,
    evidenceBoost,
    qualityScore,
    freshnessScore,
  });
  const evidencePath = buildEvidencePath({
    basis,
    resource,
    abilityMatch,
    tagNames,
    pathText,
    primaryReason,
  });
  const firstRow = abilityMatch.matchedRows[0];

  return {
    id: `org_resource_rec_${resource.libraryId}_${resource.key}`,
    type: 'resource',
    position: 'resource_recommendation',
    strategy: 'archive_profile_org_resource_rule_v1',
    score,
    title: resource.name,
    subtitle: `${resource.libraryName || '组织资料库'} · ${resource.fileType || '资源'}`,
    description: resource.summary || resource.contentText || resource.description || FILE_TYPE_EVIDENCE_HINTS[resource.fileType] || '推荐进入组织资料库查看该资源。',
    emphasis: firstRow
      ? `建议用于补充“${firstRow.itemName}”相关材料，当前覆盖度 ${firstRow.coverage}%`
      : primaryReason,
    reasonCodes,
    reasonLabels,
    reasonSummary: primaryReason,
    actionLabel: '去资料库',
    categories,
    target: {
      type: 'resource',
      resourceId: resource.key,
      resourceKey: resource.key,
      libraryScope: 'organization',
      libraryId: resource.libraryId,
      keyword: resource.name,
    },
    meta: {
      libraryId: resource.libraryId,
      libraryName: resource.libraryName,
      pathText,
      fileType: resource.fileType,
      parseStatus: resource.parseStatus || 'pending',
      lastEdit: resource.lastEdit || resource.updatedAt || '',
      tagNames,
      sourceKey,
      matchedRows: abilityMatch.matchedRows.slice(0, 3).map((row) => ({
        itemName: row.itemName,
        dimensionName: row.dimensionName,
        coverage: row.coverage,
        groupKey: row.groupKey,
      })),
      keywordHits: abilityMatch.keywordHits,
      componentScores: {
        ability: clamp(Math.round((abilityMatch.score / 32) * 100), 0, 100),
        evidence: clamp(Math.round((evidenceBoost / 28) * 100), 0, 100),
        quality: clamp(Math.round((qualityScore / 22) * 100), 0, 100),
        freshness: clamp(Math.round((freshnessScore / 18) * 100), 0, 100),
      },
      rawComponentScores: {
        ability: abilityMatch.score,
        evidence: evidenceBoost,
        quality: qualityScore,
        freshness: freshnessScore,
      },
      evidencePath,
      associationNote: associationRule?.matchNote || '',
      nextAction: associationRule?.nextAction || '',
    },
  };
}

export function buildArchiveResourceRecommendations({ snapshot, version, teacherProfile, resources = [], tagDefinitions = [] } = {}) {
  const tagMap = buildTagMap(tagDefinitions);
  const basis = buildArchiveProfileBasis({ snapshot, version, teacherProfile });
  const seen = new Set();
  const organizationResources = (resources || [])
    .filter((resource) => resource?.libraryScope === 'organization')
    .filter((resource) => !resource?.isFolder)
    .filter((resource) => !EXCLUDED_FILE_TYPES.has(resource?.fileType))
    .filter((resource) => {
      const dedupeKey = `${normalizeText(resource.libraryId)}:${normalizeText(resource.name)}:${normalizeText(resource.fileType)}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });

  const recommendations = organizationResources
    .map((resource) => buildResourceRecommendation(resource, basis, tagMap))
    .sort((left, right) => right.score - left.score)
    .slice(0, 24);

  const topReason = recommendations
    .flatMap((item) => item.reasonLabels || [])
    .reduce((best, label, _, labels) => {
      const count = labels.filter((item) => item === label).length;
      return count > best.count ? { label, count } : best;
    }, { label: '', count: 0 });

  return {
    basis,
    recommendations,
    stats: {
      organizationResourceCount: organizationResources.length,
      recommendationCount: recommendations.length,
      averageScore: recommendations.length
        ? Math.round(recommendations.reduce((sum, item) => sum + item.score, 0) / recommendations.length)
        : 0,
      topReasonLabel: topReason.label || (basis.hasProfile ? '档案匹配' : '组织资源质量'),
      focusItemCount: basis.focusItemCount,
      missingLevelCount: basis.missingLevelCount,
    },
  };
}
