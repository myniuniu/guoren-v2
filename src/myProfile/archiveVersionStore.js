import { SOURCE_META } from '../shared/profileEvidence';
import { matchNamePattern } from '../shared/resourceRecordAssociations';

const STORAGE_KEY = 'guoren_archive_versions';
const STORE_CHANGE_EVENT = 'guoren:archive-version-store-change';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readVersions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeVersions(versions) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function buildCoverageStatus(score) {
  if (score >= 86) {
    return { label: '证据充分', color: 'success' };
  }
  if (score >= 72) {
    return { label: '证据初步具备', color: 'processing' };
  }
  return { label: '证据待补充', color: 'warning' };
}

function inferScenarioFromCoverage(coverage) {
  if (coverage >= 86) {
    return { key: 'strong_match', label: '证据强支撑', shortLabel: '强支撑', color: 'success' };
  }
  if (coverage >= 72) {
    return { key: 'basic_match', label: '证据初步具备', shortLabel: '初步具备', color: 'processing' };
  }
  if (coverage > 0) {
    return { key: 'low_match', label: '证据偏弱', shortLabel: '偏弱', color: 'warning' };
  }
  return { key: 'missing_record', label: '证据缺失', shortLabel: '缺证', color: 'default' };
}

function buildItemLevelSummaryFromCells(cellMappings = []) {
  const focusCell = cellMappings.find((cell) => cell.statusKey === 'missing_record')
    || cellMappings.find((cell) => cell.statusKey === 'low_match')
    || cellMappings.find((cell) => cell.statusKey === 'basic_match')
    || cellMappings[cellMappings.length - 1]
    || null;

  return {
    levelBadges: cellMappings.map((cell) => ({
      levelKey: cell.levelKey,
      levelLabel: cell.levelLabel,
      statusKey: cell.statusKey,
      statusLabel: cell.statusLabel,
      shortLabel: cell.shortStatusLabel,
      statusColor: cell.statusColor,
    })),
    focusLevelLabel: focusCell?.levelLabel || '',
    summary: focusCell?.growthAdvice?.summary || focusCell?.note || '',
    actions: Array.isArray(focusCell?.growthAdvice?.actions) ? focusCell.growthAdvice.actions : [],
  };
}

function ensureSourceBuckets(recordsBySource = {}) {
  return Object.fromEntries(
    Object.keys(SOURCE_META).map((sourceKey) => [sourceKey, Array.isArray(recordsBySource[sourceKey]) ? recordsBySource[sourceKey] : []]),
  );
}

function flattenSnapshotMaterials(snapshot) {
  return Object.values(ensureSourceBuckets(snapshot?.recordsBySource || {})).flat();
}

function inferSourceKeyFromEvidence(evidence = {}) {
  const joinedText = `${trimText(evidence.sourceType)} ${trimText(evidence.sourceLabel)} ${trimText(evidence.resourcePath)}`;
  if (matchNamePattern(joinedText, '教研') || matchNamePattern(joinedText, '课题') || matchNamePattern(joinedText, '研究')) {
    return 'research';
  }
  if (matchNamePattern(joinedText, '研修') || matchNamePattern(joinedText, '培训') || matchNamePattern(joinedText, '学习')) {
    return 'study';
  }
  if (matchNamePattern(joinedText, '档案') || matchNamePattern(joinedText, '成长')) {
    return 'archive';
  }
  return 'teaching';
}

function chooseLevelIndex(levelCount, coverage) {
  if (!levelCount) return -1;
  if (coverage >= 86) return Math.min(levelCount - 1, Math.max(1, levelCount - 1));
  if (coverage >= 72) return Math.min(levelCount - 1, Math.max(0, levelCount - 2));
  if (coverage > 0) return 0;
  return -1;
}

function sortByDateAndCoverage(records = []) {
  return [...records].sort((left, right) => {
    const dateCompare = String(right.date || '').localeCompare(String(left.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return (right.coverage || 0) - (left.coverage || 0);
  });
}

function buildBlankSnapshot(templateSnapshot) {
  const snapshot = clone(templateSnapshot);
  snapshot.recordsBySource = ensureSourceBuckets({});
  snapshot.evidenceById = {};
  snapshot.sourceStats = Object.keys(SOURCE_META).map((sourceKey) => ({
    key: sourceKey,
    label: SOURCE_META[sourceKey].label,
    color: SOURCE_META[sourceKey].color,
    description: SOURCE_META[sourceKey].description,
    icon: SOURCE_META[sourceKey].icon,
    averageScore: 0,
    evidenceCount: 0,
    recordCount: 0,
    latestRecord: null,
  }));
  snapshot.mappingRows = (snapshot.mappingRows || []).map((row) => ({
    ...row,
    sourceKey: '',
    sourceLabel: '未映射',
    evidenceId: null,
    latestEvidenceTitle: '暂无版本材料',
    latestEvidenceDate: '-',
    evidenceTag: '待补充',
    coverage: 0,
    confidence: 0,
    evidenceCount: 0,
    note: '当前版本尚未形成直接证据映射。',
    statusLabel: '证据待补充',
    statusColor: 'warning',
    levelStatusSummary: [],
    levelFocusLabel: '',
    adviceSummary: '建议从资料库或成长档案导入材料后，再执行 AI 映射或人工确认。',
    adviceActions: ['先导入本版本材料，再确认与能力项的对应关系。'],
  }));
  snapshot.cellEvidenceMap = {};
  snapshot.cellStatusMap = Object.fromEntries(
    Object.entries(snapshot.cellStatusMap || {}).map(([key, cell]) => [key, {
      ...cell,
      sourceKey: '',
      sourceLabel: '',
      evidenceId: null,
      evidenceTitle: '',
      evidenceDate: '',
      evidenceTag: '',
      coverage: null,
      assessmentScore: 40,
      hasRecord: false,
      statusKey: 'missing_record',
      statusLabel: '证据缺失',
      shortStatusLabel: '缺证',
      statusColor: 'default',
      note: cell.growthAdvice?.summary || '当前版本尚未形成该等级的直接记录。',
    }]),
  );
  snapshot.summary = {
    ...snapshot.summary,
    overallCoverage: 0,
    strongItemCount: 0,
    focusItemCount: snapshot.mappingRows.length,
    totalEvidenceCount: 0,
    missingLevelCount: Object.keys(snapshot.cellStatusMap).length,
    lowMatchLevelCount: 0,
    strongLevelCount: 0,
  };
  snapshot.dimensions = (snapshot.dimensions || []).map((dimension) => ({
    ...dimension,
    averageScore: 0,
    strongestSourceKey: 'archive',
  }));
  return snapshot;
}

export function buildBlankArchiveVersionSnapshot(templateSnapshot) {
  return buildBlankSnapshot(templateSnapshot);
}

function createArchiveMaterialFromEvidence(evidence, record = {}) {
  const sourceKey = inferSourceKeyFromEvidence(evidence);
  const status = buildCoverageStatus(evidence.coverage || 0);
  return {
    id: createId('archive_material'),
    originType: 'TEACHER_EVALUATION',
    originRecordId: record.id || '',
    title: trimText(evidence.title) || '历史评价材料',
    ownerName: trimText(record.teacherName) || '教师本人',
    date: trimText(evidence.date) || '',
    tag: trimText(evidence.relatedItemName) || '评价材料',
    summary: trimText(evidence.summary) || '来自历史评价实例的证据材料。',
    keyFindings: [
      `评价项：${trimText(evidence.relatedItemName) || '-'}`,
      `来源：${trimText(evidence.sourceLabel) || '-'}`,
    ],
    evidenceExcerpt: trimText(evidence.summary) || '该材料来自历史评价实例。',
    attachments: [],
    links: [],
    matchNote: '该材料由历史评价实例迁移为档案版本材料。',
    nextAction: '可在当前版本中继续补充更新材料。',
    sourceKey,
    sourceLabel: trimText(evidence.sourceLabel) || SOURCE_META[sourceKey].label,
    sourceType: trimText(evidence.sourceType) || SOURCE_META[sourceKey].sourceType,
    resourcePath: trimText(evidence.resourcePath) || `教师评价 / ${trimText(evidence.relatedItemName) || '历史材料'}`,
    relatedDimensionNames: [],
    relatedItemNames: trimText(evidence.relatedItemName) ? [trimText(evidence.relatedItemName)] : [],
    relatedLevelLabels: [],
    mappingRows: [],
    cellMappings: [],
    linkedItemCount: trimText(evidence.relatedItemName) ? 1 : 0,
    linkedLevelCount: 0,
    coverage: typeof evidence.coverage === 'number' ? evidence.coverage : 76,
    statusLabel: trimText(evidence.statusLabel) || status.label,
    statusColor: status.color,
    importedAt: record.updatedAt || record.createdAt || nowText(),
    mappingStatus: trimText(evidence.relatedItemName) ? 'CONFIRMED' : 'UNMAPPED',
    resourceRef: null,
    aiSuggestion: null,
    submissionSource: trimText(evidence.submissionSource),
  };
}

function createArchiveMaterialFromResourceItem(item) {
  return {
    id: createId('archive_material'),
    originType: 'RESOURCE_LIBRARY',
    originRecordId: '',
    title: item.name,
    ownerName: item.owner || '资料库',
    date: item.lastOpenedAt || item.lastEdit || '',
    tag: item.fileType || '资料文件',
    summary: item.contentText || `${item.libraryName}中的资料已导入当前档案版本。`,
    keyFindings: [
      `资料库：${item.libraryName}`,
      `解析状态：${item.parseStatus || 'parsed'}`,
    ],
    evidenceExcerpt: item.contentText || `${item.name} 当前尚未提取正文摘要。`,
    attachments: [
      { name: item.name, type: item.fileType || 'other', size: item.parseStatus || 'parsed' },
    ],
    links: [
      { title: '资料库定位', hint: item.resourcePath || `${item.libraryName} / ${item.name}` },
    ],
    matchNote: '该材料从资料库导入到当前档案版本。',
    nextAction: '可使用 AI 自动映射建议，或人工确认对应能力项。',
    sourceKey: item.sourceKey || 'archive',
    sourceLabel: item.sourceLabel || SOURCE_META[item.sourceKey || 'archive'].label,
    sourceType: item.sourceType || SOURCE_META[item.sourceKey || 'archive'].sourceType,
    resourcePath: item.resourcePath || `${item.libraryName} / ${item.name}`,
    relatedDimensionNames: [],
    relatedItemNames: [],
    relatedLevelLabels: [],
    mappingRows: [],
    cellMappings: [],
    linkedItemCount: 0,
    linkedLevelCount: 0,
    coverage: typeof item.coverage === 'number' ? item.coverage : 72,
    statusLabel: '待确认映射',
    statusColor: 'default',
    importedAt: nowText(),
    mappingStatus: 'UNMAPPED',
    resourceRef: {
      libraryId: item.libraryId,
      itemKey: item.key,
      libraryName: item.libraryName,
      libraryScope: item.libraryScope,
    },
    aiSuggestion: null,
    submissionSource: 'RESOURCE_LIBRARY_IMPORT',
  };
}

function rebuildSnapshotFromMaterials(templateSnapshot, materials = []) {
  const snapshot = buildBlankSnapshot(templateSnapshot);
  const normalizedMaterials = sortByDateAndCoverage(
    materials.map((material) => ({
      ...material,
      relatedItemNames: Array.from(new Set((material.relatedItemNames || []).filter(Boolean))),
      relatedDimensionNames: Array.from(new Set((material.relatedDimensionNames || []).filter(Boolean))),
      relatedLevelLabels: Array.from(new Set((material.relatedLevelLabels || []).filter(Boolean))),
      mappingRows: [],
      cellMappings: [],
    })),
  );

  const levels = snapshot.modelDefinition?.levelScheme?.levels || [];
  const recordsBySource = ensureSourceBuckets({});
  const materialsByItem = new Map();

  normalizedMaterials.forEach((material) => {
    (material.relatedItemNames || []).forEach((itemName) => {
      const current = materialsByItem.get(itemName) || [];
      current.push(material);
      materialsByItem.set(itemName, current);
    });
  });

  snapshot.mappingRows = snapshot.mappingRows.map((row) => {
    const matchedMaterials = sortByDateAndCoverage(materialsByItem.get(row.itemName) || []);
    const latestMaterial = matchedMaterials[0] || null;
    const averageCoverage = matchedMaterials.length
      ? Math.round(matchedMaterials.reduce((sum, item) => sum + (item.coverage || 0), 0) / matchedMaterials.length)
      : 0;
    const status = buildCoverageStatus(averageCoverage);
    return {
      ...row,
      sourceKey: latestMaterial?.sourceKey || '',
      sourceLabel: latestMaterial?.sourceLabel || '未映射',
      evidenceId: latestMaterial?.id || null,
      latestEvidenceTitle: latestMaterial?.title || '暂无版本材料',
      latestEvidenceDate: latestMaterial?.date || '-',
      evidenceTag: latestMaterial?.tag || '待补充',
      coverage: averageCoverage,
      confidence: matchedMaterials.length ? Math.min(96, averageCoverage + 8) : 0,
      evidenceCount: matchedMaterials.length,
      note: latestMaterial?.summary || '当前版本尚未形成该能力项的直接证据映射。',
      statusLabel: status.label,
      statusColor: status.color,
    };
  });

  const nextCellStatusMap = {};
  const nextCellEvidenceMap = {};
  snapshot.mappingRows.forEach((row) => {
    const matchedMaterials = sortByDateAndCoverage(materialsByItem.get(row.itemName) || []);
    const latestMaterial = matchedMaterials[0] || null;
    const targetLevelIndex = chooseLevelIndex(levels.length, row.coverage || 0);
    const updatedCells = levels.map((level, levelIndex) => {
      const key = `${row.itemId}_${level.key}`;
      const baseCell = snapshot.cellStatusMap[key] || {
        cellKey: key,
        dimensionId: row.dimensionId,
        dimensionName: row.dimensionName,
        itemId: row.itemId,
        itemName: row.itemName,
        levelKey: level.key,
        levelLabel: level.label,
        descriptorText: '',
        growthAdvice: null,
      };
      if (!latestMaterial || levelIndex !== targetLevelIndex) {
        const scenario = inferScenarioFromCoverage(0);
        const nextCell = {
          ...baseCell,
          sourceKey: '',
          sourceLabel: '',
          evidenceId: null,
          evidenceTitle: '',
          evidenceDate: '',
          evidenceTag: '',
          coverage: null,
          assessmentScore: 40,
          hasRecord: false,
          statusKey: scenario.key,
          statusLabel: scenario.label,
          shortStatusLabel: scenario.shortLabel,
          statusColor: scenario.color,
          note: baseCell.growthAdvice?.summary || '当前版本尚未形成该等级的直接记录。',
        };
        nextCellStatusMap[key] = nextCell;
        return nextCell;
      }
      const scenario = inferScenarioFromCoverage(latestMaterial.coverage || row.coverage || 0);
      const nextCell = {
        ...baseCell,
        sourceKey: latestMaterial.sourceKey,
        sourceLabel: latestMaterial.sourceLabel,
        evidenceId: latestMaterial.id,
        evidenceTitle: latestMaterial.title,
        evidenceDate: latestMaterial.date,
        evidenceTag: latestMaterial.tag,
        coverage: latestMaterial.coverage || row.coverage || 0,
        assessmentScore: latestMaterial.coverage || row.coverage || 0,
        hasRecord: true,
        statusKey: scenario.key,
        statusLabel: scenario.label,
        shortStatusLabel: scenario.shortLabel,
        statusColor: scenario.color,
        note: latestMaterial.summary || baseCell.note,
      };
      nextCellStatusMap[key] = nextCell;
      nextCellEvidenceMap[key] = nextCell;
      return nextCell;
    });
    const levelSummary = buildItemLevelSummaryFromCells(updatedCells);
    row.levelStatusSummary = levelSummary.levelBadges;
    row.levelFocusLabel = levelSummary.focusLevelLabel;
    row.adviceSummary = levelSummary.summary || row.adviceSummary;
    row.adviceActions = levelSummary.actions || row.adviceActions;
  });

  const enrichedMaterials = normalizedMaterials.map((material) => {
    const matchedRows = snapshot.mappingRows.filter((row) => (
      (material.relatedItemNames || []).some((itemName) => matchNamePattern(itemName, row.itemName) || matchNamePattern(row.itemName, itemName))
    ));
    const relatedDimensionNames = Array.from(new Set(matchedRows.map((row) => row.dimensionName)));
    const relatedLevelLabels = Array.from(new Set(
      matchedRows.flatMap((row) => row.levelStatusSummary?.filter((entry) => entry.statusKey !== 'missing_record').map((entry) => entry.levelLabel) || []),
    ));
    const nextMaterial = {
      ...material,
      relatedDimensionNames,
      relatedLevelLabels,
      mappingRows: matchedRows.map((row) => ({
        key: row.key,
        itemName: row.itemName,
        dimensionName: row.dimensionName,
        coverage: row.coverage,
      })),
      linkedItemCount: matchedRows.length,
      linkedLevelCount: relatedLevelLabels.length,
      statusColor: material.mappingStatus === 'CONFIRMED'
        ? buildCoverageStatus(material.coverage || 0).color
        : 'default',
      statusLabel: material.mappingStatus === 'CONFIRMED'
        ? buildCoverageStatus(material.coverage || 0).label
        : material.statusLabel || '待确认映射',
    };
    recordsBySource[nextMaterial.sourceKey || 'archive'].push(nextMaterial);
    return nextMaterial;
  });

  snapshot.recordsBySource = Object.fromEntries(
    Object.entries(recordsBySource).map(([sourceKey, records]) => [sourceKey, sortByDateAndCoverage(records)]),
  );
  snapshot.evidenceById = Object.fromEntries(
    enrichedMaterials.map((material) => [material.id, material]),
  );
  snapshot.sourceStats = Object.keys(SOURCE_META).map((sourceKey) => {
    const records = snapshot.recordsBySource[sourceKey] || [];
    return {
      key: sourceKey,
      label: SOURCE_META[sourceKey].label,
      color: SOURCE_META[sourceKey].color,
      description: SOURCE_META[sourceKey].description,
      icon: SOURCE_META[sourceKey].icon,
      averageScore: records.length
        ? Math.round(records.reduce((sum, item) => sum + (item.coverage || 0), 0) / records.length)
        : 0,
      evidenceCount: records.length,
      recordCount: records.length,
      latestRecord: records[0] || null,
    };
  });
  snapshot.cellStatusMap = nextCellStatusMap;
  snapshot.cellEvidenceMap = nextCellEvidenceMap;
  snapshot.summary = {
    ...snapshot.summary,
    overallCoverage: snapshot.mappingRows.length
      ? Math.round(snapshot.mappingRows.reduce((sum, row) => sum + (row.coverage || 0), 0) / snapshot.mappingRows.length)
      : 0,
    strongItemCount: snapshot.mappingRows.filter((row) => row.coverage >= 86).length,
    focusItemCount: snapshot.mappingRows.filter((row) => row.coverage < 72).length,
    totalEvidenceCount: enrichedMaterials.length,
    missingLevelCount: Object.values(snapshot.cellStatusMap).filter((cell) => cell.statusKey === 'missing_record').length,
    lowMatchLevelCount: Object.values(snapshot.cellStatusMap).filter((cell) => cell.statusKey === 'low_match').length,
    strongLevelCount: Object.values(snapshot.cellStatusMap).filter((cell) => cell.statusKey === 'strong_match').length,
  };
  const rowMap = new Map(snapshot.mappingRows.map((row) => [row.dimensionId, []]));
  snapshot.mappingRows.forEach((row) => {
    const current = rowMap.get(row.dimensionId) || [];
    current.push(row.coverage || 0);
    rowMap.set(row.dimensionId, current);
  });
  snapshot.dimensions = (snapshot.dimensions || []).map((dimension) => {
    const dimensionRows = rowMap.get(dimension.key) || [];
    return {
      ...dimension,
      averageScore: dimensionRows.length
        ? Math.round(dimensionRows.reduce((sum, score) => sum + score, 0) / dimensionRows.length)
        : 0,
      strongestSourceKey: enrichedMaterials[0]?.sourceKey || 'archive',
    };
  });
  return snapshot;
}

function buildVersionApprovalInfo(record) {
  if (!record) {
    return {
      evaluationRecordId: '',
      currentNode: '',
      currentNodeName: '',
      submittedAt: '',
      finalDecision: null,
      appeal: null,
      reviewOpinions: [],
    };
  }
  return {
    evaluationRecordId: record.id,
    currentNode: record.currentNode,
    currentNodeName: record.currentNodeName || record.currentNode || '',
    submittedAt: record.submittedAt || '',
    finalDecision: record.finalDecision || null,
    appeal: record.appeal || null,
    reviewOpinions: Array.isArray(record.reviewOpinions) ? clone(record.reviewOpinions) : [],
  };
}

function hydrateArchiveSnapshot(snapshot) {
  if (!snapshot) return null;
  const nextSnapshot = clone(snapshot);
  nextSnapshot.sourceStats = Object.keys(SOURCE_META).map((sourceKey) => {
    const current = (snapshot.sourceStats || []).find((item) => item.key === sourceKey) || {};
    return {
      ...current,
      key: sourceKey,
      label: SOURCE_META[sourceKey].label,
      color: SOURCE_META[sourceKey].color,
      description: SOURCE_META[sourceKey].description,
      icon: SOURCE_META[sourceKey].icon,
    };
  });
  return nextSnapshot;
}

function normalizeVersion(version, evaluationRecords = []) {
  const linkedRecord = evaluationRecords.find((record) => record.id === version.evaluationRecordId) || null;
  const approvalInfo = buildVersionApprovalInfo(linkedRecord);
  return {
    ...version,
    teacherId: trimText(version.teacherId),
    teacherName: trimText(version.teacherName),
    periodLabel: trimText(version.periodLabel),
    schemeId: trimText(version.schemeId),
    schemeName: trimText(version.schemeName),
    scenarioLabel: trimText(version.scenarioLabel),
    applicationNote: trimText(version.applicationNote),
    targetLevel: trimText(version.targetLevel),
    baseVersionId: trimText(version.baseVersionId),
    evaluationRecordId: trimText(version.evaluationRecordId),
    versionStatus: linkedRecord?.status || version.versionStatus || 'DRAFT',
    status: linkedRecord?.status || version.versionStatus || 'DRAFT',
    approvalInfo,
    currentNode: approvalInfo.currentNode,
    currentNodeName: approvalInfo.currentNodeName,
    submittedAt: approvalInfo.submittedAt,
    finalDecision: approvalInfo.finalDecision,
    appeal: approvalInfo.appeal,
    reviewOpinions: approvalInfo.reviewOpinions,
    createdAt: version.createdAt || nowText(),
    updatedAt: linkedRecord?.updatedAt || version.updatedAt || version.createdAt || nowText(),
    snapshot: hydrateArchiveSnapshot(version.snapshot),
    mappingSuggestions: Array.isArray(version.mappingSuggestions) ? clone(version.mappingSuggestions) : [],
    creationMode: trimText(version.creationMode) || 'MIGRATED',
  };
}

function buildVersionFromEvaluationRecord(record, baseSnapshot, previousVersionId = '') {
  const migratedMaterials = (record.evidenceItems || []).map((item) => createArchiveMaterialFromEvidence(item, record));
  return {
    id: `archive_version_${record.id}`,
    teacherId: record.teacherId,
    teacherName: record.teacherName,
    periodLabel: record.periodLabel,
    schemeId: record.schemeId,
    schemeName: record.schemeNameSnapshot,
    scenarioLabel: record.scenarioLabel,
    applicationNote: record.applicationNote,
    targetLevel: record.targetLevel,
    baseVersionId: previousVersionId,
    evaluationRecordId: record.id,
    versionStatus: record.status,
    approvalInfo: buildVersionApprovalInfo(record),
    snapshot: rebuildSnapshotFromMaterials(baseSnapshot, migratedMaterials),
    mappingSuggestions: [],
    creationMode: 'MIGRATED',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || record.createdAt,
  };
}

function buildCurrentNodeName(record, schemes = []) {
  const scheme = schemes.find((item) => item.id === record.schemeId) || null;
  return scheme?.reviewFlow?.find((item) => item.key === record.currentNode)?.name || record.currentNode || '';
}

export function getArchiveVersionStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export async function ensureArchiveVersionSeedData({ teacherProfile, baseSnapshot, evaluationRecords = [], evaluationSchemes = [] }) {
  if (typeof window === 'undefined' || !teacherProfile || !baseSnapshot) return [];
  let currentVersions = readVersions();
  const teacherVersions = currentVersions.filter((item) => item.teacherId === teacherProfile.teacherId);
  const normalizedRecords = evaluationRecords
    .filter((item) => item.teacherId === teacherProfile.teacherId || item.teacherName === teacherProfile.name)
    .map((record) => ({
      ...record,
      currentNodeName: buildCurrentNodeName(record, evaluationSchemes),
    }))
    .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));

  const versionsByRecordId = new Map(teacherVersions.map((item) => [item.evaluationRecordId, item]));
  let previousVersionId = teacherVersions
    .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')))
    .slice(-1)[0]?.id || '';
  const appendedVersions = [];
  normalizedRecords.forEach((record) => {
    if (versionsByRecordId.has(record.id)) {
      previousVersionId = versionsByRecordId.get(record.id)?.id || previousVersionId;
      return;
    }
    const version = buildVersionFromEvaluationRecord(record, baseSnapshot, previousVersionId);
    appendedVersions.push(version);
    previousVersionId = version.id;
  });

  if (!teacherVersions.length && !normalizedRecords.length) {
    const starterVersion = {
      id: createId('archive_version'),
      teacherId: teacherProfile.teacherId,
      teacherName: teacherProfile.name,
      periodLabel: '',
      schemeId: '',
      schemeName: '',
      scenarioLabel: '',
      applicationNote: '',
      targetLevel: teacherProfile.targetLevel || '',
      baseVersionId: '',
      evaluationRecordId: '',
      versionStatus: 'DRAFT',
      approvalInfo: buildVersionApprovalInfo(null),
      snapshot: buildBlankSnapshot(baseSnapshot),
      mappingSuggestions: [],
      creationMode: 'BLANK',
      createdAt: nowText(),
      updatedAt: nowText(),
    };
    appendedVersions.push(starterVersion);
  }

  if (appendedVersions.length) {
    currentVersions = [...currentVersions, ...appendedVersions];
    writeVersions(currentVersions);
  }
  return currentVersions;
}

export async function listArchiveVersions({ teacherProfile, evaluationRecords = [] }) {
  const currentVersions = readVersions().filter((item) => item.teacherId === teacherProfile.teacherId);
  return currentVersions
    .map((version) => normalizeVersion(version, evaluationRecords))
    .sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')));
}

export async function createArchiveVersion(payload) {
  const currentVersions = readVersions();
  const version = {
    id: createId('archive_version'),
    teacherId: payload.teacherId,
    teacherName: payload.teacherName,
    periodLabel: trimText(payload.periodLabel),
    schemeId: trimText(payload.schemeId),
    schemeName: trimText(payload.schemeName),
    scenarioLabel: trimText(payload.scenarioLabel),
    applicationNote: trimText(payload.applicationNote),
    targetLevel: trimText(payload.targetLevel),
    baseVersionId: trimText(payload.baseVersionId),
    evaluationRecordId: '',
    versionStatus: 'DRAFT',
    approvalInfo: buildVersionApprovalInfo(null),
    snapshot: clone(payload.snapshot),
    mappingSuggestions: [],
    creationMode: trimText(payload.creationMode) || 'BLANK',
    createdAt: nowText(),
    updatedAt: nowText(),
  };
  writeVersions([version, ...currentVersions]);
  return clone(version);
}

export async function updateArchiveVersion(versionId, payload = {}) {
  const currentVersions = readVersions();
  const index = currentVersions.findIndex((item) => item.id === versionId);
  if (index === -1) throw new Error('档案版本不存在');
  const nextVersion = {
    ...currentVersions[index],
    ...payload,
    snapshot: payload.snapshot ? clone(payload.snapshot) : currentVersions[index].snapshot,
    updatedAt: nowText(),
  };
  const nextVersions = [...currentVersions];
  nextVersions[index] = nextVersion;
  writeVersions(nextVersions);
  return clone(nextVersion);
}

export async function importArchiveVersionMaterials(versionId, items = []) {
  const currentVersions = readVersions();
  const index = currentVersions.findIndex((item) => item.id === versionId);
  if (index === -1) throw new Error('档案版本不存在');
  const version = currentVersions[index];
  const existingMaterials = flattenSnapshotMaterials(version.snapshot);
  const existingRefKeys = new Set(existingMaterials
    .filter((item) => item.resourceRef?.libraryId && item.resourceRef?.itemKey)
    .map((item) => `${item.resourceRef.libraryId}:${item.resourceRef.itemKey}`));
  const newMaterials = items
    .filter((item) => !existingRefKeys.has(`${item.libraryId}:${item.key}`))
    .map((item) => createArchiveMaterialFromResourceItem(item));
  const nextSnapshot = rebuildSnapshotFromMaterials(version.snapshot, [...existingMaterials, ...newMaterials]);
  const nextVersion = {
    ...version,
    snapshot: nextSnapshot,
    mappingSuggestions: [],
    updatedAt: nowText(),
  };
  const nextVersions = [...currentVersions];
  nextVersions[index] = nextVersion;
  writeVersions(nextVersions);
  return clone(nextVersion);
}

export async function generateArchiveVersionMappingSuggestions(versionId) {
  const currentVersions = readVersions();
  const index = currentVersions.findIndex((item) => item.id === versionId);
  if (index === -1) throw new Error('档案版本不存在');
  const version = currentVersions[index];
  const materials = flattenSnapshotMaterials(version.snapshot);
  const mappingRows = version.snapshot?.mappingRows || [];
  const suggestions = materials
    .filter((material) => material.originType === 'RESOURCE_LIBRARY' && material.mappingStatus !== 'CONFIRMED')
    .map((material) => {
      const candidateRows = mappingRows
        .map((row) => {
          const haystack = `${material.title} ${material.summary} ${material.tag} ${material.resourcePath}`;
          let score = 0;
          if (matchNamePattern(haystack, row.itemName)) score += 6;
          if (matchNamePattern(haystack, row.dimensionName)) score += 4;
          if ((material.keyFindings || []).some((item) => matchNamePattern(item, row.itemName))) score += 2;
          return { row, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 2);
      if (!candidateRows.length) return null;
      return {
        id: createId('mapping_suggestion'),
        materialId: material.id,
        materialTitle: material.title,
        suggestedItemNames: candidateRows.map((entry) => entry.row.itemName),
        rationale: candidateRows.map((entry) => `${entry.row.itemName}（匹配 ${entry.row.dimensionName} 关键词）`).join('；'),
        confidenceLabel: candidateRows[0].score >= 6 ? '较高' : '中等',
        status: 'PENDING',
        createdAt: nowText(),
      };
    })
    .filter(Boolean);
  const nextVersion = {
    ...version,
    mappingSuggestions: suggestions,
    updatedAt: nowText(),
  };
  const nextVersions = [...currentVersions];
  nextVersions[index] = nextVersion;
  writeVersions(nextVersions);
  return clone(suggestions);
}

export async function applyArchiveVersionMappingSuggestions(versionId, suggestionIds = []) {
  const currentVersions = readVersions();
  const index = currentVersions.findIndex((item) => item.id === versionId);
  if (index === -1) throw new Error('档案版本不存在');
  const version = currentVersions[index];
  const targetSuggestionIds = new Set(suggestionIds);
  const materials = flattenSnapshotMaterials(version.snapshot).map((material) => ({ ...material }));
  const suggestions = (version.mappingSuggestions || []).map((suggestion) => ({ ...suggestion }));

  suggestions
    .filter((suggestion) => targetSuggestionIds.has(suggestion.id))
    .forEach((suggestion) => {
      const material = materials.find((item) => item.id === suggestion.materialId);
      if (!material) return;
      material.relatedItemNames = Array.from(new Set([
        ...(material.relatedItemNames || []),
        ...(suggestion.suggestedItemNames || []),
      ]));
      material.mappingStatus = 'CONFIRMED';
      material.statusLabel = '证据初步具备';
      suggestion.status = 'APPLIED';
    });

  const nextSnapshot = rebuildSnapshotFromMaterials(version.snapshot, materials);
  const nextVersion = {
    ...version,
    snapshot: nextSnapshot,
    mappingSuggestions: suggestions.filter((item) => item.status !== 'APPLIED'),
    updatedAt: nowText(),
  };
  const nextVersions = [...currentVersions];
  nextVersions[index] = nextVersion;
  writeVersions(nextVersions);
  return clone(nextVersion);
}

export async function linkArchiveVersionEvaluationRecord(versionId, payload = {}) {
  return updateArchiveVersion(versionId, {
    evaluationRecordId: trimText(payload.evaluationRecordId),
    versionStatus: trimText(payload.versionStatus),
    approvalInfo: payload.approvalInfo ? clone(payload.approvalInfo) : undefined,
  });
}

export function buildArchiveVersionEvidenceItems(version) {
  const materials = flattenSnapshotMaterials(version?.snapshot);
  const dedupe = new Set();
  return materials.flatMap((material) => (
    (material.relatedItemNames || []).map((itemName) => {
      const key = `${trimText(material.resourcePath)}::${trimText(itemName)}`;
      if (dedupe.has(key)) return null;
      dedupe.add(key);
      return {
        title: material.title,
        sourceType: material.sourceType,
        sourceLabel: material.sourceLabel,
        relatedItemName: itemName,
        date: material.date,
        summary: material.summary,
        evidenceThreshold: '',
        resourcePath: material.resourcePath,
        coverage: typeof material.coverage === 'number' ? material.coverage : 76,
        statusLabel: material.statusLabel || '证据初步具备',
        submissionSource: material.submissionSource || 'ARCHIVE_VERSION',
      };
    })
  )).filter(Boolean);
}
