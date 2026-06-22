import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popover,
  Progress,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import {
  BellOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { capabilityModelApi } from '../capabilityModel/api';
import {
  getTeacherEvaluationStatusLabel,
  teacherEvaluationApi,
} from '../teacherEvaluation/api';
import {
  buildModelGrowthRecordSnapshot,
  GrowthRecordDetailDrawer,
  pickCurrentTeacherModel,
  resolveCellRecord,
  resolveGrowthRecordFromSnapshot,
  SOURCE_META,
} from '../shared/profileEvidence';
import {
  findResourceAssociationRule,
  inferResourceSourceKey,
  matchNamePattern,
} from '../shared/resourceRecordAssociations';
import { listArchivedSceneGrowthRecords } from '../shared/sceneGrowthRecords';
import { getAllItemsAcrossLibraries, loadResourceLib } from '../resourceLib/resourceLibStore';
import { sceneApi } from '../scene/api';
import { archiveVersionApi } from './archiveVersionApi';
import '../system/SystemModule.css';
import '../shared/profileEvidence.css';
import './MyProfileModule.css';

const PROFILE_BASE = {
  name: '周岚',
  roleTitle: '智能制造专业教师',
  schoolName: '海右职业技术学院',
  departmentName: '智能制造教研组',
  tenureLabel: '入职第 5 年',
  portraitTag: '双师型骨干教师',
  growthHint: '当前处于“强化校企协同 + 完善技能考核证据链”阶段',
};

const RESOURCE_FILE_TYPE_LABELS = {
  pdf: 'PDF 文档',
  pptx: 'PPT 课件',
  docx: 'Word 文档',
  xlsx: 'Excel 表格',
  image: '图片素材',
  video: '视频资料',
  audio: '音频资料',
  whiteboard: '白板资料',
  note: '笔记资料',
  test: '测试资料',
  other: '文件资料',
};

const RESOURCE_PARSE_STATUS_LABELS = {
  parsed: '已解析',
  parsing: '解析中',
  pending: '待解析',
  failed: '解析失败',
};

const REVIEW_ROLE_LABELS = {
  SELF: '本人',
  GROUP_LEADER: '教研组长',
  SUPERVISOR: '督导/教学管理者',
  ENTERPRISE_MENTOR: '企业导师',
  SCHOOL_REVIEW: '校级评审组',
};

const { TextArea } = Input;

function buildCoverageStatus(score) {
  if (score >= 86) {
    return { label: '证据充分', color: 'success' };
  }
  if (score >= 72) {
    return { label: '证据初步具备', color: 'processing' };
  }
  return { label: '证据待补充', color: 'warning' };
}

function getTrendMeta(trendTone) {
  if (trendTone === 'up') {
    return { label: '持续提升', color: 'success' };
  }
  if (trendTone === 'down') {
    return { label: '需要关注', color: 'error' };
  }
  return { label: '基本持平', color: undefined };
}

function getCoverageBarColor(score) {
  if (score >= 86) return '#52c41a';
  if (score >= 72) return '#1677ff';
  return '#fa8c16';
}

function buildSuggestedNextPeriodLabel() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  return month <= 7 ? `${year} 秋季学期` : `${year + 1} 春季学期`;
}

function buildFallbackTeacherProfile(profile = {}) {
  return {
    teacherId: 'teacher_zhou_lan',
    name: profile.name || PROFILE_BASE.name,
    schoolName: profile.schoolName || PROFILE_BASE.schoolName,
    departmentName: profile.departmentName || PROFILE_BASE.departmentName,
    roleName: profile.roleName || PROFILE_BASE.roleTitle,
    targetLevel: profile.roleLevelName || '双师型骨干讲师',
  };
}

function clampCoverage(score) {
  return Math.max(58, Math.min(96, Math.round(score)));
}

function buildHistoricalCoverage(baseCoverage, recentIndex, totalCount) {
  if (totalCount <= 1) return clampCoverage(baseCoverage);
  const normalized = (totalCount - recentIndex - 1) / (totalCount - 1);
  return clampCoverage(baseCoverage - 8 + normalized * 10);
}

function buildHistoryEntry(record, overrides = {}) {
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
    ...overrides,
  };
}

function buildTrendSummary(historyRecords = []) {
  if (historyRecords.length <= 1) {
    return '暂无更多历史记录';
  }
  const latestRecord = historyRecords[0];
  const earliestRecord = historyRecords[historyRecords.length - 1];
  const delta = latestRecord.coverage - earliestRecord.coverage;
  const direction = delta > 0 ? '提升' : delta < 0 ? '回落' : '持平';
  return `近 ${historyRecords.length} 条资料，证据覆盖度从 ${earliestRecord.coverage}% ${direction}到 ${latestRecord.coverage}%。`;
}

function formatCoverageDelta(delta) {
  if (!Number.isFinite(delta) || delta === 0) return '持平';
  return `${delta > 0 ? '+' : ''}${delta}%`;
}

function buildGrowthRecordMaterialEntries(growthRecord) {
  if (!growthRecord) return [];
  const bundleItems = Array.isArray(growthRecord.bundleItems) && growthRecord.bundleItems.length
    ? growthRecord.bundleItems
    : [{
      id: growthRecord.id,
      title: growthRecord.title,
      date: growthRecord.date,
      resourcePath: growthRecord.resourcePath || growthRecord.links?.[0]?.hint || '-',
      sourceKey: growthRecord.sourceKey,
      sourceLabel: growthRecord.sourceLabel,
      coverage: growthRecord.coverage,
      statusLabel: growthRecord.statusLabel,
      statusColor: growthRecord.statusColor,
      isCurrent: true,
    }];

  const seenKeys = new Set();
  return bundleItems.reduce((list, item, index) => {
    const resourcePath = String(item.resourcePath || '').trim() || '-';
    const dedupeKey = resourcePath && resourcePath !== '-'
      ? `path:${resourcePath}`
      : `entry:${item.id || `${growthRecord.id}_${index}`}`;
    if (seenKeys.has(dedupeKey)) {
      return list;
    }
    seenKeys.add(dedupeKey);
    list.push({
      id: item.id || `${growthRecord.id}_${index}`,
      title: item.title || growthRecord.title,
      date: item.date || growthRecord.date,
      resourcePath,
      sourceKey: item.sourceKey || growthRecord.sourceKey,
      sourceLabel: item.sourceLabel || growthRecord.sourceLabel,
      sourceType: SOURCE_META[item.sourceKey || growthRecord.sourceKey]?.sourceType || growthRecord.sourceType || '成长档案记录',
      coverage: typeof item.coverage === 'number' ? item.coverage : growthRecord.coverage,
      statusLabel: item.statusLabel || growthRecord.statusLabel,
      statusColor: item.statusColor || growthRecord.statusColor,
      summary: growthRecord.bundleItems?.length
        ? `${growthRecord.title}记录包材料：${item.title || growthRecord.title}`
        : growthRecord.summary,
      originGrowthRecordId: growthRecord.id,
      isCurrent: Boolean(item.isCurrent),
    });
    return list;
  }, []);
}

function matchRubricNamesForGrowthRecord(growthRecord, scheme) {
  const relatedItemNames = Array.from(new Set([
    growthRecord?.focusItemName,
    ...(growthRecord?.relatedItemNames || []),
  ].filter(Boolean)));
  return (scheme?.itemRubrics || [])
    .map((rubric) => rubric.itemName)
    .filter((itemName) => relatedItemNames.some((candidate) => (
      matchNamePattern(candidate, itemName) || matchNamePattern(itemName, candidate)
    )));
}

function buildSubmittedEvidenceHistoryMap(records = [], teacherName = '') {
  const historyMap = new Map();
  records
    .filter((record) => record.teacherName === teacherName && record.submittedAt)
    .forEach((record) => {
      (record.evidenceItems || []).forEach((item) => {
        const resourcePath = String(item.resourcePath || '').trim();
        if (!resourcePath || resourcePath === '-') return;
        const historyItem = {
          recordId: record.id,
          title: item.title || resourcePath,
          periodLabel: record.periodLabel || '-',
          schemeName: record.schemeNameSnapshot || '-',
          submittedAt: record.submittedAt,
        };
        const currentList = historyMap.get(resourcePath) || [];
        if (!currentList.some((entry) => entry.recordId === historyItem.recordId && entry.title === historyItem.title)) {
          currentList.push(historyItem);
          historyMap.set(resourcePath, currentList);
        }
      });
    });
  return historyMap;
}

function buildDirectSubmitEvidenceItems(growthRecords = [], selectionMap = {}, scheme = null) {
  const evidenceItems = [];
  const dedupeKeys = new Set();
  growthRecords.forEach((growthRecord) => {
    const relatedItemName = selectionMap[growthRecord.id];
    if (!relatedItemName) return;
    const rubric = (scheme?.itemRubrics || []).find((item) => item.itemName === relatedItemName) || null;
    buildGrowthRecordMaterialEntries(growthRecord).forEach((item) => {
      const dedupeKey = item.resourcePath && item.resourcePath !== '-'
        ? `${item.resourcePath}::${relatedItemName}`
        : `${item.id}::${relatedItemName}`;
      if (dedupeKeys.has(dedupeKey)) return;
      dedupeKeys.add(dedupeKey);
      evidenceItems.push({
        title: item.title,
        sourceType: item.sourceType,
        sourceLabel: item.sourceLabel,
        relatedItemName,
        date: item.date,
        summary: item.summary || growthRecord.summary || '从我的档案直接提交的成长材料。',
        evidenceThreshold: rubric?.evidenceThreshold || '',
        resourcePath: item.resourcePath || '-',
        coverage: typeof item.coverage === 'number' ? item.coverage : growthRecord.coverage,
        statusLabel: item.statusLabel || growthRecord.statusLabel || '证据初步具备',
        submissionSource: 'PROFILE_DIRECT_SUBMIT',
        originGrowthRecordId: growthRecord.id,
        originMaterialEntryId: item.id,
      });
    });
  });
  return evidenceItems;
}

function buildDirectSubmitReuseWarnings(evidenceItems = [], historyMap = new Map()) {
  const seenKeys = new Set();
  return evidenceItems.reduce((list, item) => {
    const resourcePath = String(item.resourcePath || '').trim();
    if (!resourcePath || resourcePath === '-') return list;
    if (seenKeys.has(resourcePath)) return list;
    const historyEntries = historyMap.get(resourcePath) || [];
    if (!historyEntries.length) return list;
    seenKeys.add(resourcePath);
    list.push({
      resourcePath,
      title: item.title || resourcePath,
      historyEntries,
    });
    return list;
  }, []);
}

function formatReviewRoles(reviewRoles = []) {
  return reviewRoles.map((item) => REVIEW_ROLE_LABELS[item] || item).join('、');
}

function buildResourcePath(item, resourceLibData) {
  const libraryItems = item.libraryId === 'personal'
    ? (resourceLibData.personal || [])
    : (resourceLibData.organizations?.[item.libraryId] || []);
  const itemMap = new Map(libraryItems.map((entry) => [entry.key, entry]));
  const pathParts = [item.libraryName];
  let cursor = itemMap.get(item.parentKey);

  while (cursor) {
    pathParts.push(cursor.name);
    cursor = itemMap.get(cursor.parentKey);
  }

  pathParts.push(item.name);
  return pathParts.join(' / ');
}

function resolveResourceCapabilityContext(item, baseSnapshot, fallbackRows) {
  const associationRule = findResourceAssociationRule(item);
  if (!associationRule) {
    const fallbackSourceKey = inferResourceSourceKey(item);
    const relatedDimensionNames = Array.from(new Set(fallbackRows.map((row) => row.dimensionName)));
    const relatedItemNames = Array.from(new Set(fallbackRows.map((row) => row.itemName)));
    const cellMappings = Object.values(baseSnapshot.cellEvidenceMap || {}).filter((mapping) => (
      relatedItemNames.includes(mapping.itemName)
    ));
    const relatedLevelLabels = Array.from(new Set(cellMappings.map((mapping) => mapping.levelLabel)));
    const coverage = cellMappings.length
      ? Math.round(cellMappings.reduce((sum, mapping) => sum + mapping.coverage, 0) / cellMappings.length)
      : fallbackRows.length
        ? Math.round(fallbackRows.reduce((sum, row) => sum + row.coverage, 0) / fallbackRows.length)
        : 0;

    return {
      sourceKey: fallbackSourceKey,
      relatedRows: fallbackRows,
      relatedDimensionNames,
      relatedItemNames,
      cellMappings,
      relatedLevelLabels,
      coverage,
      associationRule: null,
    };
  }

  const mappingRows = (baseSnapshot.mappingRows || []).filter((row) => (
    (associationRule.dimensionNames || []).some((name) => matchNamePattern(row.dimensionName, name))
      || (associationRule.itemNames || []).some((name) => matchNamePattern(row.itemName, name))
  ));
  const relatedRows = mappingRows.length ? mappingRows : fallbackRows;
  const relatedDimensionNames = Array.from(new Set([
    ...relatedRows.map((row) => row.dimensionName),
    ...(associationRule.dimensionNames || []),
  ].filter(Boolean)));
  const relatedItemNames = Array.from(new Set([
    ...relatedRows.map((row) => row.itemName),
    ...(associationRule.itemNames || []),
  ].filter(Boolean)));
  const cellMappings = Object.values(baseSnapshot.cellEvidenceMap || {}).filter((mapping) => (
    relatedItemNames.some((name) => matchNamePattern(mapping.itemName, name))
      || relatedDimensionNames.some((name) => matchNamePattern(mapping.dimensionName, name))
  ));
  const relatedLevelLabels = Array.from(new Set(cellMappings.map((mapping) => mapping.levelLabel)));
  const coverage = cellMappings.length
    ? Math.round(cellMappings.reduce((sum, mapping) => sum + mapping.coverage, 0) / cellMappings.length)
    : relatedRows.length
      ? Math.round(relatedRows.reduce((sum, row) => sum + row.coverage, 0) / relatedRows.length)
      : 0;

  return {
    sourceKey: associationRule.sourceKey,
    relatedRows,
    relatedDimensionNames,
    relatedItemNames,
    cellMappings,
    relatedLevelLabels,
    coverage,
    associationRule,
  };
}

function buildResourceLibrarySourceSnapshot(baseSnapshot, resourceLibData) {
  if (!baseSnapshot) return null;

  const allItems = getAllItemsAcrossLibraries(resourceLibData)
    .filter((item) => !item.isFolder)
    .sort((left, right) => String(right.lastOpenedAt || right.lastEdit || '').localeCompare(String(left.lastOpenedAt || left.lastEdit || '')));

  const recordsBySource = {
    teaching: [],
    archive: [],
    study: [],
    research: [],
  };
  const contextRows = baseSnapshot.mappingRows || [];
  let contextCursor = 0;

  function resolveRelatedRows() {
    const rows = contextRows;
    if (!rows.length) return [];
    const startIndex = contextCursor % rows.length;
    const bucketSize = Math.min(rows.length, rows.length > 1 ? 2 : 1);
    const relatedRows = Array.from({ length: bucketSize }, (_, offset) => rows[(startIndex + offset) % rows.length]);
    contextCursor += 1;
    return relatedRows;
  }

  allItems.forEach((item) => {
    const fallbackRows = resolveRelatedRows();
    const {
      sourceKey,
      relatedRows,
      relatedDimensionNames,
      relatedItemNames,
      cellMappings,
      relatedLevelLabels,
      coverage,
      associationRule,
    } = resolveResourceCapabilityContext(item, baseSnapshot, fallbackRows);
    const status = buildCoverageStatus(coverage || 68);
    const fileTypeLabel = RESOURCE_FILE_TYPE_LABELS[item.fileType] || '资料文件';
    const parseStatusLabel = RESOURCE_PARSE_STATUS_LABELS[item.parseStatus] || '已入库';
    const title = item.name;
    const resourcePath = buildResourcePath(item, resourceLibData);
    const summary = item.contentText || `${item.libraryName}中的${fileTypeLabel}，当前已纳入${SOURCE_META[sourceKey].label}来源。`;
    const recordTag = associationRule?.recordTag || fileTypeLabel;
    const keyFindings = [
      `资料来源：${item.libraryName}`,
      `文件类型：${fileTypeLabel}`,
      `解析状态：${parseStatusLabel}`,
      ...(associationRule?.recordTag ? [`识别类型：${associationRule.recordTag}`] : []),
    ];

    recordsBySource[sourceKey].push({
      id: `resource_${item.libraryId}_${item.key}`,
      title,
      ownerName: item.owner || '资料库',
      date: item.lastOpenedAt || item.lastEdit || '-',
      tag: recordTag,
      summary,
      keyFindings,
      evidenceExcerpt: item.contentText || `${title} 当前未提取更多正文内容，可前往资料库查看原始资料。`,
      attachments: [
        { name: title, type: fileTypeLabel, size: parseStatusLabel },
      ],
      links: [
        { title: '资料库定位', hint: `${item.libraryName} / ${title}` },
      ],
      matchNote: associationRule?.matchNote || `该条目来自资料库模块，当前归入${SOURCE_META[sourceKey].label}，用于展示该来源下的资料沉淀情况。`,
      nextAction: associationRule?.nextAction || `可继续在资料库补充同类${fileTypeLabel}，完善${SOURCE_META[sourceKey].label}资料积累。`,
      associationRuleId: associationRule?.id || null,
      bundleKey: associationRule?.bundleKey || null,
      sourceKey,
      sourceLabel: SOURCE_META[sourceKey].label,
      sourceType: SOURCE_META[sourceKey].sourceType,
      resourcePath,
      relatedDimensionNames,
      relatedItemNames,
      relatedLevelLabels,
      mappingRows: relatedRows,
      cellMappings,
      linkedItemCount: relatedItemNames.length,
      linkedLevelCount: relatedLevelLabels.length,
      coverage,
      statusLabel: status.label,
      statusColor: status.color,
    });
  });

  Object.values(recordsBySource).forEach((records) => {
    records.sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
  });

  const normalizedRecordsBySource = Object.fromEntries(
    Object.entries(recordsBySource).map(([sourceKey, records]) => [
      sourceKey,
      records.map((record, recordIndex) => {
        const coverage = buildHistoricalCoverage(record.coverage || 68, recordIndex, records.length);
        const status = buildCoverageStatus(coverage);
        return {
          ...record,
          coverage,
          statusLabel: status.label,
          statusColor: status.color,
        };
      }),
    ]),
  );

  const sourceHistoryMap = Object.fromEntries(
    Object.entries(normalizedRecordsBySource).map(([sourceKey, records]) => [
      sourceKey,
      records.map((record) => buildHistoryEntry(record)),
    ]),
  );

  const resourceEvidenceById = Object.fromEntries(
    Object.values(normalizedRecordsBySource).flatMap((records) => records.map((record) => {
      const historyRecords = (sourceHistoryMap[record.sourceKey] || []).map((item) => ({
        ...item,
        isCurrent: item.id === record.id,
      }));
      return [record.id, {
        ...record,
        historyRecords,
        trendSummary: buildTrendSummary(historyRecords),
      }];
    })),
  );

  const enrichedBaseEvidenceById = Object.fromEntries(
    Object.entries(baseSnapshot.evidenceById || {}).map(([evidenceId, evidence]) => {
      const currentHistory = buildHistoryEntry({
        id: evidence.id,
        title: evidence.title,
        date: evidence.date,
        coverage: evidence.coverage,
        statusLabel: evidence.statusLabel,
        statusColor: evidence.statusColor,
        resourcePath: evidence.resourcePath || '当前映射记录',
        tag: evidence.tag,
        sourceLabel: evidence.sourceLabel,
      }, { isCurrent: true });
      const sourceHistory = sourceHistoryMap[evidence.sourceKey] || [];
      const historyRecords = sourceHistory.some((item) => item.id === evidenceId)
        ? sourceHistory.map((item) => ({ ...item, isCurrent: item.id === evidenceId }))
        : [currentHistory, ...sourceHistory];
      return [evidenceId, {
        ...evidence,
        historyRecords,
        trendSummary: buildTrendSummary(historyRecords),
      }];
    }),
  );

  const sourceStats = baseSnapshot.sourceStats.map((item) => {
    const records = normalizedRecordsBySource[item.key] || [];
    return {
      ...item,
      averageScore: records.length
        ? Math.round(records.reduce((sum, record) => sum + record.coverage, 0) / records.length)
        : item.averageScore,
      evidenceCount: records.length,
      recordCount: records.length,
      latestRecord: resourceEvidenceById[records[0]?.id] || item.latestRecord,
    };
  });

  return {
    ...baseSnapshot,
    summary: {
      ...baseSnapshot.summary,
      totalEvidenceCount: Object.keys({
        ...enrichedBaseEvidenceById,
        ...resourceEvidenceById,
      }).length,
    },
    sourceStats,
    recordsBySource: normalizedRecordsBySource,
    evidenceById: {
      ...enrichedBaseEvidenceById,
      ...resourceEvidenceById,
    },
  };
}

function sortRecordsByDate(records = []) {
  return [...records].sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')));
}

function sortEvaluationRecords(records = []) {
  return [...records].sort((left, right) => {
    const leftPeriod = String(left.periodSortKey || '');
    const rightPeriod = String(right.periodSortKey || '');
    if (leftPeriod !== rightPeriod) return rightPeriod.localeCompare(leftPeriod);
    return String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || ''));
  });
}

function getEvaluationStatusColor(status) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'SUPPLEMENT_REQUIRED') return 'warning';
  if (status === 'IN_REVIEW' || status === 'APPEAL_PENDING') return 'processing';
  return 'default';
}

function isClosedEvaluationStatus(status) {
  return ['APPROVED', 'REJECTED', 'APPEAL_RESOLVED'].includes(status);
}

function getArchiveVersionBucket(status) {
  if (['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(status)) return 'draft';
  if (['IN_REVIEW', 'APPEAL_PENDING'].includes(status)) return 'review';
  return 'closed';
}

function isEditableArchiveVersion(version) {
  const status = version?.versionStatus || version?.status;
  return ['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(status);
}

function getArchiveVersionActionMeta(record) {
  const status = record?.versionStatus || record?.status;
  if (!record) return null;
  if (status === 'DRAFT') {
    return {
      tone: 'draft',
      description: '当前周期仍处于草稿态，可继续整理材料后提交审批。',
      primaryAction: { key: 'SUBMIT', label: '提交审批', type: 'primary' },
      secondaryAction: { key: 'OPEN', label: '继续编辑' },
    };
  }
  if (status === 'SUPPLEMENT_REQUIRED') {
    return {
      tone: 'warning',
      description: '该周期已被退回补证，补齐材料后再重新提交。',
      primaryAction: { key: 'OPEN', label: '继续补证' },
    };
  }
  if (status === 'IN_REVIEW') {
    return {
      tone: 'review',
      description: '该周期已进入评审流程，可查看当前节点与审批进度。',
      primaryAction: { key: 'OPEN', label: '查看审批进度' },
    };
  }
  if (status === 'APPEAL_PENDING') {
    return {
      tone: 'review',
      description: '该周期处于申诉处理中，等待校级评审组复核。',
      primaryAction: { key: 'OPEN', label: '查看申诉进度' },
    };
  }
  if (status === 'REJECTED') {
    return {
      tone: 'closed',
      description: '该周期未通过评审，可查看结论并决定是否申诉。',
      primaryAction: { key: 'OPEN', label: '查看评审结论' },
    };
  }
  if (status === 'APPEAL_RESOLVED') {
    return {
      tone: 'closed',
      description: '该周期已形成复核结论，可查看最终归档意见。',
      primaryAction: { key: 'OPEN', label: '查看复核结论' },
    };
  }
  return {
    tone: 'closed',
    description: '该周期已形成正式归档结论，可查看材料与意见留痕。',
    primaryAction: { key: 'OPEN', label: '查看归档结论' },
  };
}

function getArchiveVersionTodoMeta(record) {
  const status = record?.versionStatus || record?.status;
  if (!record) return null;
  if (status === 'DRAFT') {
    return {
      key: `todo_${record.id}`,
      versionId: record.id,
      periodLabel: record.periodLabel || '-',
      schemeName: record.schemeName || '未绑定评价方案',
      status,
      title: '待提交审批',
      description: '当前周期还是草稿，确认材料和映射后可提交审批。',
      actionLabel: '去审批信息',
      priority: 2,
    };
  }
  if (status === 'SUPPLEMENT_REQUIRED') {
    return {
      key: `todo_${record.id}`,
      versionId: record.id,
      periodLabel: record.periodLabel || '-',
      schemeName: record.schemeName || '未绑定评价方案',
      status,
      title: '待补证',
      description: record?.reviewOpinions?.[0]?.comment || '当前周期已被退回补证，请根据审批意见继续补齐材料。',
      actionLabel: '去审批信息',
      priority: 1,
    };
  }
  if (['REJECTED', 'APPROVED', 'APPEAL_PENDING', 'APPEAL_RESOLVED'].includes(status)) {
    return {
      key: `todo_${record.id}`,
      versionId: record.id,
      periodLabel: record.periodLabel || '-',
      schemeName: record.schemeName || '未绑定评价方案',
      status,
      title: '待查看结论',
      description: record?.finalDecision?.summary || record?.appeal?.summary || '当前周期已有结论或复核状态，建议及时查看。',
      actionLabel: '去审批信息',
      priority: 3,
    };
  }
  return null;
}

function formatDateTimeText(value) {
  return value ? String(value).slice(0, 16) : '-';
}

function buildArchiveVersionSummary(versions = []) {
  const sortedVersions = [...versions].sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')));
  const currentVersion = sortedVersions[0] || null;
  return {
    totalRecords: versions.length,
    inReviewCount: versions.filter((item) => ['IN_REVIEW', 'APPEAL_PENDING'].includes(item.versionStatus || item.status)).length,
    supplementRequiredCount: versions.filter((item) => (item.versionStatus || item.status) === 'SUPPLEMENT_REQUIRED').length,
    approvedCount: versions.filter((item) => (item.versionStatus || item.status) === 'APPROVED').length,
    draftCount: versions.filter((item) => (item.versionStatus || item.status) === 'DRAFT').length,
    periodCount: new Set(versions.map((item) => item.periodLabel || '未标记周期')).size,
    currentPeriodLabel: currentVersion?.periodLabel || '-',
    currentPeriodPendingCount: versions.filter((item) => (item.periodLabel || '-') === (currentVersion?.periodLabel || '-') && !isClosedEvaluationStatus(item.versionStatus || item.status)).length,
  };
}

function buildArchiveVersionPeriodGroups(versions = []) {
  const grouped = new Map();
  sortEvaluationRecords(versions).forEach((version) => {
    const periodLabel = version.periodLabel || '未标记周期';
    if (!grouped.has(periodLabel)) {
      grouped.set(periodLabel, {
        key: periodLabel,
        periodLabel,
        records: [],
      });
    }
    grouped.get(periodLabel).records.push(version);
  });

  return Array.from(grouped.values()).map((group) => ({
    ...group,
    recordCount: group.records.length,
    inReviewCount: group.records.filter((item) => ['IN_REVIEW', 'APPEAL_PENDING'].includes(item.versionStatus || item.status)).length,
    supplementRequiredCount: group.records.filter((item) => (item.versionStatus || item.status) === 'SUPPLEMENT_REQUIRED').length,
    approvedCount: group.records.filter((item) => (item.versionStatus || item.status) === 'APPROVED').length,
    pendingCount: group.records.filter((item) => !isClosedEvaluationStatus(item.versionStatus || item.status)).length,
  }));
}

function buildTeacherEvaluationPeriodGroups(records = [], schemes = []) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const grouped = new Map();

  sortEvaluationRecords(records).forEach((record) => {
    const scheme = schemeMap.get(record.schemeId);
    const periodLabel = record.periodLabel || scheme?.semester || '未标记周期';
    const currentNodeName = scheme?.reviewFlow?.find((item) => item.key === record.currentNode)?.name || record.currentNode || '-';
    const normalizedRecord = {
      ...record,
      periodLabel,
      schemeNameSnapshot: record.schemeNameSnapshot || scheme?.name || '-',
      currentNodeName,
    };
    if (!grouped.has(periodLabel)) {
      grouped.set(periodLabel, {
        key: periodLabel,
        periodLabel,
        periodSortKey: record.periodSortKey || '',
        records: [],
      });
    }
    grouped.get(periodLabel).records.push(normalizedRecord);
  });

  return Array.from(grouped.values())
    .sort((left, right) => String(right.periodSortKey || '').localeCompare(String(left.periodSortKey || '')))
    .map((group) => ({
      ...group,
      recordCount: group.records.length,
      inReviewCount: group.records.filter((item) => item.status === 'IN_REVIEW').length,
      supplementRequiredCount: group.records.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length,
      approvedCount: group.records.filter((item) => item.status === 'APPROVED').length,
      pendingCount: group.records.filter((item) => !['APPROVED', 'REJECTED', 'APPEAL_RESOLVED'].includes(item.status)).length,
    }));
}

function findLatestSceneRecord(sceneRecords, row) {
  return sortRecordsByDate(sceneRecords).find((record) => (
    record.relatedItemNames?.includes(row.itemName)
      || record.relatedDimensionNames?.includes(row.dimensionName)
  )) || null;
}

function mergeSceneArchivedRecordSnapshot(baseSnapshot, sceneRecords) {
  if (!baseSnapshot || !sceneRecords.length) return baseSnapshot;

  const nextRecordsBySource = Object.fromEntries(
    Object.entries(baseSnapshot.recordsBySource || {}).map(([sourceKey, records]) => [sourceKey, [...records]]),
  );
  const nextEvidenceById = { ...(baseSnapshot.evidenceById || {}) };
  const sceneRecordsBySource = {};

  sceneRecords.forEach((record) => {
    const sourceMeta = SOURCE_META[record.sourceKey] || SOURCE_META.archive;
    const normalizedRecord = {
      ...record,
      sourceKey: record.sourceKey in SOURCE_META ? record.sourceKey : 'archive',
      sourceLabel: sourceMeta.label,
      sourceType: sourceMeta.sourceType,
      attachments: Array.isArray(record.attachments) ? record.attachments : [],
      links: Array.isArray(record.links) ? record.links : [],
      historyRecords: Array.isArray(record.historyRecords) ? record.historyRecords : [],
      trendSummary: record.trendSummary || '暂无更多历史记录',
    };
    const bucketKey = normalizedRecord.sourceKey;
    if (!nextRecordsBySource[bucketKey]) {
      nextRecordsBySource[bucketKey] = [];
    }
    nextRecordsBySource[bucketKey].push(normalizedRecord);
    nextEvidenceById[normalizedRecord.id] = normalizedRecord;
    if (!sceneRecordsBySource[bucketKey]) {
      sceneRecordsBySource[bucketKey] = [];
    }
    sceneRecordsBySource[bucketKey].push(normalizedRecord);
  });

  const recordsBySource = Object.fromEntries(
    Object.entries(nextRecordsBySource).map(([sourceKey, records]) => [sourceKey, sortRecordsByDate(records)]),
  );
  const normalizedSceneRecords = Object.values(sceneRecordsBySource).flat();

  const mappingRows = (baseSnapshot.mappingRows || []).map((row) => {
    const latestSceneRecord = findLatestSceneRecord(normalizedSceneRecords, row);
    if (!latestSceneRecord) return row;
    return {
      ...row,
      sourceKey: latestSceneRecord.sourceKey,
      sourceLabel: latestSceneRecord.sourceLabel,
      evidenceId: latestSceneRecord.id,
      latestEvidenceTitle: latestSceneRecord.title,
      latestEvidenceDate: latestSceneRecord.date,
      evidenceTag: latestSceneRecord.tag,
      note: latestSceneRecord.summary,
      coverage: Math.max(row.coverage, latestSceneRecord.coverage || 0),
      confidence: Math.min(97, Math.max(row.confidence || 0, (latestSceneRecord.coverage || 0) + 4)),
      statusLabel: latestSceneRecord.statusLabel,
      statusColor: latestSceneRecord.statusColor,
    };
  });

  const sourceStats = (baseSnapshot.sourceStats || []).map((item) => {
    const records = recordsBySource[item.key] || [];
    return {
      ...item,
      averageScore: records.length
        ? Math.round(records.reduce((sum, record) => sum + (record.coverage || 0), 0) / records.length)
        : 0,
      evidenceCount: records.length,
      recordCount: records.length,
      latestRecord: records[0] || item.latestRecord,
    };
  });

  return {
    ...baseSnapshot,
    summary: {
      ...baseSnapshot.summary,
      totalEvidenceCount: Object.keys(nextEvidenceById).length,
    },
    sourceStats,
    mappingRows,
    recordsBySource,
    evidenceById: nextEvidenceById,
  };
}

export default function MyProfileModule({ onNavigateToTeacherEvaluation = null }) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [archiveVersions, setArchiveVersions] = useState([]);
  const [workspaceView, setWorkspaceView] = useState('CURRENT');
  const [activeArchiveTab, setActiveArchiveTab] = useState('overview');
  const [selectedArchiveVersionId, setSelectedArchiveVersionId] = useState('');
  const [archiveVersionFilter, setArchiveVersionFilter] = useState('ALL');
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [todoPopoverOpen, setTodoPopoverOpen] = useState(false);
  const [evaluationSchemes, setEvaluationSchemes] = useState([]);
  const [evaluationTeachers, setEvaluationTeachers] = useState([]);
  const [evaluationRecordList, setEvaluationRecordList] = useState([]);
  const [resourceLibraryItems, setResourceLibraryItems] = useState([]);
  const [analysisDimensionFilter, setAnalysisDimensionFilter] = useState('ALL');
  const [analysisTrendFilter, setAnalysisTrendFilter] = useState('ALL');
  const [analysisCompareCount, setAnalysisCompareCount] = useState(4);
  const [analysisSortMode, setAnalysisSortMode] = useState('DELTA');
  const [analysisSearch, setAnalysisSearch] = useState('');
  const [selectedAnalysisItemId, setSelectedAnalysisItemId] = useState('');
  const [mappingView, setMappingView] = useState('matrix');
  const [activeMatrixAnchor, setActiveMatrixAnchor] = useState(undefined);
  const [growthRecordDrawerOpen, setGrowthRecordDrawerOpen] = useState(false);
  const [selectedGrowthRecord, setSelectedGrowthRecord] = useState(null);
  const [directSubmitOpen, setDirectSubmitOpen] = useState(false);
  const [directSubmitSubmitting, setDirectSubmitSubmitting] = useState(false);
  const [archiveActionLoadingId, setArchiveActionLoadingId] = useState('');
  const [resourceImportOpen, setResourceImportOpen] = useState(false);
  const [resourceImportLoading, setResourceImportLoading] = useState(false);
  const [resourceImportSelection, setResourceImportSelection] = useState([]);
  const [mappingSuggestionLoading, setMappingSuggestionLoading] = useState(false);
  const [directSubmitForm] = Form.useForm();
  const matrixSectionRefs = useRef({});

  const openGrowthRecordDetail = useCallback((growthRecordId, nextSnapshot = snapshot, focus = {}) => {
    const resolvedSnapshot = nextSnapshot || snapshot;
    const growthRecord = resolveGrowthRecordFromSnapshot(resolvedSnapshot, growthRecordId, focus)
      || Object.values(resolvedSnapshot?.recordsBySource || {})
        .flat()
        .find((item) => item.id === growthRecordId);
    if (!growthRecord) return;
    setSelectedGrowthRecord(growthRecord);
    setGrowthRecordDrawerOpen(true);
  }, [snapshot]);

  const selectedArchiveVersion = useMemo(
    () => archiveVersions.find((item) => item.id === selectedArchiveVersionId) || archiveVersions[0] || null,
    [archiveVersions, selectedArchiveVersionId],
  );

  async function loadData(withLoading = true) {
    if (withLoading) setLoading(true);
    try {
      await Promise.all([
        capabilityModelApi.seed(),
        sceneApi.seed(),
        teacherEvaluationApi.seed(),
      ]);
      const [industries, sequences, roles, models, nextEvaluationSchemes, nextEvaluationTeachers, evaluationRecords] = await Promise.all([
        capabilityModelApi.listIndustries(),
        capabilityModelApi.listSequences(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listModels(),
        teacherEvaluationApi.listSchemes(),
        teacherEvaluationApi.listTeachers(),
        teacherEvaluationApi.listRecords(),
      ]);
      const evaluationRecordsWithNodeNames = evaluationRecords.map((record) => ({
        ...record,
        currentNodeName: nextEvaluationSchemes.find((scheme) => scheme.id === record.schemeId)?.reviewFlow?.find((item) => item.key === record.currentNode)?.name || record.currentNode || '',
      }));
      setEvaluationSchemes(nextEvaluationSchemes);
      setEvaluationTeachers(nextEvaluationTeachers);
      setEvaluationRecordList(evaluationRecordsWithNodeNames);
      const currentModel = pickCurrentTeacherModel(models, roles, sequences, {
        preferredRoleCode: 'VOCATIONAL_TEACHER',
        preferredLevelCode: 'DUAL',
      });
      const baseSnapshot = buildModelGrowthRecordSnapshot(currentModel, industries, roles, sequences);
      const resourceLibData = loadResourceLib();
      const resourceAwareSnapshot = buildResourceLibrarySourceSnapshot(baseSnapshot, resourceLibData);
      const scenes = await sceneApi.listScenes();
      const archivedSceneRecords = listArchivedSceneGrowthRecords(scenes, resourceAwareSnapshot?.modelDefinition);
      const sceneAwareSnapshot = mergeSceneArchivedRecordSnapshot(resourceAwareSnapshot, archivedSceneRecords);
      const profileSnapshot = sceneAwareSnapshot ? {
        ...sceneAwareSnapshot,
        profile: {
          ...PROFILE_BASE,
          ...sceneAwareSnapshot.context,
        },
      } : null;
      const nextTeacherProfile = nextEvaluationTeachers.find((item) => item.name === (profileSnapshot?.profile?.name || PROFILE_BASE.name))
        || buildFallbackTeacherProfile(profileSnapshot?.profile);
      const importCandidates = getAllItemsAcrossLibraries(resourceLibData)
        .filter((item) => !item.isFolder)
        .map((item) => {
          const fallbackRows = (profileSnapshot?.mappingRows || []).slice(0, 2);
          const context = resolveResourceCapabilityContext(item, profileSnapshot, fallbackRows);
          return {
            ...item,
            importKey: `${item.libraryId}:${item.key}`,
            resourcePath: buildResourcePath(item, resourceLibData),
            sourceKey: context.sourceKey,
            sourceLabel: SOURCE_META[context.sourceKey].label,
            sourceType: SOURCE_META[context.sourceKey].sourceType,
            coverage: context.coverage,
          };
        })
        .sort((left, right) => String(right.lastOpenedAt || right.lastEdit || '').localeCompare(String(left.lastOpenedAt || left.lastEdit || '')));
      setResourceLibraryItems(importCandidates);
      await archiveVersionApi.seed({
        teacherProfile: nextTeacherProfile,
        baseSnapshot: profileSnapshot,
        evaluationRecords: evaluationRecordsWithNodeNames,
        evaluationSchemes: nextEvaluationSchemes,
      });
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: nextTeacherProfile,
        evaluationRecords: evaluationRecordsWithNodeNames,
      });
      setArchiveVersions(nextVersions);
      setSelectedArchiveVersionId((current) => {
        if (current && nextVersions.some((item) => item.id === current)) {
          return current;
        }
        return nextVersions[0]?.id || '';
      });
      if (selectedGrowthRecord?.id && profileSnapshot?.evidenceById?.[selectedGrowthRecord.id]) {
        setSelectedGrowthRecord(resolveGrowthRecordFromSnapshot(profileSnapshot, selectedGrowthRecord.id, selectedGrowthRecord));
      }
    } finally {
      if (withLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedArchiveVersion?.snapshot) {
      setSnapshot(null);
      return;
    }
    const evaluationSummary = buildArchiveVersionSummary(archiveVersions);
    const periodGroups = buildArchiveVersionPeriodGroups(archiveVersions);
    const nextSnapshot = {
      ...selectedArchiveVersion.snapshot,
      profile: {
        ...PROFILE_BASE,
        ...(selectedArchiveVersion.snapshot?.profile || {}),
      },
      evaluationSummary: {
        ...evaluationSummary,
        periodGroups,
      },
      archiveVersion: selectedArchiveVersion,
    };
    setSnapshot(nextSnapshot);
    if (selectedGrowthRecord?.id && nextSnapshot?.evidenceById?.[selectedGrowthRecord.id]) {
      setSelectedGrowthRecord((current) => resolveGrowthRecordFromSnapshot(nextSnapshot, selectedGrowthRecord.id, current || selectedGrowthRecord));
    }
  }, [archiveVersions, selectedArchiveVersion, selectedGrowthRecord?.id]);

  function resolveMappingRowGrowthRecord(record) {
    if (!record.evidenceId) return null;
    return resolveGrowthRecordFromSnapshot(snapshot, record.evidenceId, {
      focusItemId: record.itemId,
      focusDimensionName: record.dimensionName,
      focusItemName: record.itemName,
      focusCoverage: record.coverage,
    });
  }

  const mappingColumns = [
    {
      title: '能力类 / 能力项',
      key: 'item',
      width: 240,
      render: (_, record) => (
        <div className="profile-archive-item-cell">
          <strong>{record.itemName}</strong>
          <span>{record.dimensionName}</span>
          {record.levelStatusSummary?.length ? (
            <div className="profile-archive-level-badges">
              {record.levelStatusSummary.map((item) => (
                <Tag key={`${record.key}_${item.levelKey}`} color={item.statusColor}>
                  {item.levelLabel} · {item.shortLabel}
                </Tag>
              ))}
            </div>
          ) : null}
          {record.adviceSummary ? (
            <span className="profile-archive-item-advice">
              建议优先关注 {record.levelFocusLabel || '当前等级'}：{record.adviceSummary}
            </span>
          ) : null}
          <span className="profile-archive-item-submeta">
            证据要求：至少 {record.requiredEvidenceCount || 1} 条
            {record.requiredReviewRoles?.length ? ` · 评价主体 ${formatReviewRoles(record.requiredReviewRoles)}` : ''}
            {record.isGrowthOnly ? ' · 仅成长档案' : ' · 可进入正式评价'}
          </span>
        </div>
      ),
    },
    {
      title: '对应数据',
      dataIndex: 'sourceLabel',
      key: 'sourceLabel',
      width: 220,
      render: (_, record) => {
        const growthRecord = resolveMappingRowGrowthRecord(record);
        const bundleSourceKeys = growthRecord?.bundleSourceKeys?.length ? growthRecord.bundleSourceKeys : [record.sourceKey];
        const visibleSourceKeys = bundleSourceKeys.slice(0, 2);
        const hiddenSourceCount = Math.max(0, bundleSourceKeys.length - visibleSourceKeys.length);
        return (
          <div className="profile-archive-item-badges">
            {visibleSourceKeys.map((sourceKey) => (
              <Tag key={sourceKey} color={SOURCE_META[sourceKey]?.color}>
                {SOURCE_META[sourceKey]?.label || sourceKey}
              </Tag>
            ))}
            {hiddenSourceCount > 0 ? <Tag>+{hiddenSourceCount}</Tag> : null}
          </div>
        );
      },
    },
    {
      title: '最新记录',
      key: 'evidence',
      render: (_, record) => {
        const growthRecord = resolveMappingRowGrowthRecord(record);
        const bundleItems = growthRecord?.bundleItems || [];
        const bundleSourceKeys = growthRecord?.bundleSourceKeys || [];
        if (!record.evidenceId) {
          return (
            <div className="profile-archive-item-cell">
              <strong>暂无直接成长记录</strong>
              <span>{record.levelFocusLabel || '当前等级'} 待补记录</span>
              <span className="profile-archive-item-submeta">{record.adviceSummary || '建议优先补充直接支撑该能力项的成长记录。'}</span>
            </div>
          );
        }
        return (
          <div className="profile-archive-item-cell">
            <button
              type="button"
              className="profile-archive-record-link"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openGrowthRecordDetail(record.evidenceId, snapshot, {
                  focusItemId: record.itemId,
                  focusDimensionName: record.dimensionName,
                  focusItemName: record.itemName,
                  focusCoverage: record.coverage,
                });
              }}
            >
              {growthRecord?.title || record.latestEvidenceTitle}
            </button>
            <span>{growthRecord?.date || record.latestEvidenceDate} · {growthRecord?.tag || record.evidenceTag}</span>
            {bundleItems.length > 1 ? (
              <span className="profile-archive-item-submeta">
                记录包 · {bundleItems.length} 条资料
                {bundleSourceKeys.length > 1 ? ` · ${bundleSourceKeys.length} 类来源` : ''}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: '证据覆盖度',
      dataIndex: 'coverage',
      key: 'coverage',
      width: 150,
      render: (value) => <Progress percent={value} size="small" strokeColor="#1677ff" showInfo />,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => <Tag color={record.statusColor}>{record.statusLabel}</Tag>,
    },
  ];

  const modelDefinition = snapshot?.modelDefinition;
  const mappingMatrixSections = useMemo(() => (
    (modelDefinition?.dimensions || []).map((dimension) => ({
      key: dimension.id,
      name: dimension.name,
      description: dimension.description,
      items: (dimension.items || []).map((item) => ({
        ...item,
        cellMappings: (modelDefinition?.levelScheme?.levels || []).map((level) => ({
          level,
          descriptor: item.levelDescriptors?.find((entry) => entry.levelKey === level.key) || { levelKey: level.key, text: '' },
          growthRecord: resolveCellRecord(snapshot, item.id, level.key),
        })),
      })),
    }))
  ), [modelDefinition, snapshot]);
  const evaluationSummaryRecords = useMemo(
    () => sortEvaluationRecords(archiveVersions),
    [archiveVersions],
  );
  const canNavigateToTeacherEvaluation = typeof onNavigateToTeacherEvaluation === 'function';
  const archiveVersionSections = useMemo(() => {
    const bucketMap = {
      draft: [],
      review: [],
      closed: [],
    };
    evaluationSummaryRecords.forEach((record) => {
      bucketMap[getArchiveVersionBucket(record.versionStatus || record.status)].push(record);
    });
    return [
      {
        key: 'draft',
        label: '草稿周期',
        tagColor: 'gold',
        description: '尚未进入审批流的周期，适合继续整理材料后再提交。',
        emptyDescription: '当前没有草稿周期',
        records: bucketMap.draft,
      },
      {
        key: 'review',
        label: '审批中',
        tagColor: 'processing',
        description: '已经进入审批链路的周期，可持续跟踪节点进度与处理意见。',
        emptyDescription: '当前没有审批中的周期',
        records: bucketMap.review,
      },
      {
        key: 'closed',
        label: '已归档',
        tagColor: 'success',
        description: '已经形成结论的已归档周期，可查看最终结论与留痕。',
        emptyDescription: '当前没有已归档周期',
        records: bucketMap.closed,
      },
    ];
  }, [evaluationSummaryRecords]);
  const draftArchiveVersions = archiveVersionSections[0]?.records || [];
  const reviewingArchiveVersions = archiveVersionSections[1]?.records || [];
  const closedArchiveVersions = archiveVersionSections[2]?.records || [];
  const filteredArchiveVersions = useMemo(() => {
    if (archiveVersionFilter === 'CURRENT') {
      return evaluationSummaryRecords.filter((item) => (item.periodLabel || '-') === (snapshot?.evaluationSummary?.currentPeriodLabel || '-'));
    }
    if (archiveVersionFilter === 'DRAFT') {
      return draftArchiveVersions;
    }
    if (archiveVersionFilter === 'REVIEW') {
      return reviewingArchiveVersions;
    }
    if (archiveVersionFilter === 'HISTORY') {
      return closedArchiveVersions;
    }
    return evaluationSummaryRecords;
  }, [archiveVersionFilter, closedArchiveVersions, draftArchiveVersions, evaluationSummaryRecords, reviewingArchiveVersions, snapshot?.evaluationSummary?.currentPeriodLabel]);
  const selectedVersionMaterials = useMemo(
    () => Object.values(snapshot?.recordsBySource || {}).flat(),
    [snapshot],
  );
  const selectedVersionSuggestions = selectedArchiveVersion?.mappingSuggestions || [];
  const canEditSelectedVersion = isEditableArchiveVersion(selectedArchiveVersion);
  const selectedVersionStatus = selectedArchiveVersion?.versionStatus || selectedArchiveVersion?.status || 'DRAFT';
  const selectedVersionStatusLabel = getTeacherEvaluationStatusLabel(selectedVersionStatus);
  const selectedVersionStatusColor = getEvaluationStatusColor(selectedVersionStatus);
  const selectedVersionMaterialCount = selectedVersionMaterials.length;
  const selectedVersionConfirmedCount = selectedVersionMaterials.filter((item) => item.mappingStatus === 'CONFIRMED').length;
  const selectedVersionUnmappedCount = Math.max(0, selectedVersionMaterialCount - selectedVersionConfirmedCount);
  const selectedVersionReviewOpinions = selectedArchiveVersion?.reviewOpinions || [];
  const selectedVersionActionMeta = getArchiveVersionActionMeta(selectedArchiveVersion);
  const selectedVersionApprovalSummary = selectedArchiveVersion?.finalDecision?.summary
    || (selectedArchiveVersion?.appeal ? `申诉状态：${selectedArchiveVersion.appeal.status || '-'}` : '')
    || selectedVersionActionMeta?.description
    || '下方总览、证据映射、数据来源和审批信息均对应当前选中的档案周期。';
  const activeSourceCount = (snapshot?.sourceStats || []).filter((item) => item.evidenceCount > 0).length;
  const selectedVersionHeaderStats = [
    {
      label: '材料数',
      value: `${selectedVersionMaterialCount} 条`,
      hint: '当前周期材料快照',
    },
    {
      label: '已确认映射',
      value: `${selectedVersionConfirmedCount} 条`,
      hint: '已进入正式证据映射',
    },
    {
      label: '当前节点',
      value: selectedArchiveVersion?.currentNodeName || '尚未进入审批',
      hint: selectedArchiveVersion?.submittedAt ? `提交于 ${formatDateTimeText(selectedArchiveVersion.submittedAt)}` : '草稿阶段可继续整理',
    },
    {
      label: '最近更新',
      value: formatDateTimeText(selectedArchiveVersion?.updatedAt || selectedArchiveVersion?.createdAt),
      hint: selectedArchiveVersion?.schemeName || '未绑定评价方案',
    },
  ];
  const todoItems = useMemo(
    () => sortEvaluationRecords(archiveVersions)
      .map((record) => {
        const meta = getArchiveVersionTodoMeta(record);
        if (!meta) return null;
        return {
          ...meta,
          updatedAt: record.updatedAt || record.createdAt || '',
          currentNodeName: record.currentNodeName || '尚未进入审批',
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (left.priority !== right.priority) return left.priority - right.priority;
        return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
      }),
    [archiveVersions],
  );
  const todoCount = todoItems.length;
  const selectedVersionTodoMeta = useMemo(
    () => todoItems.find((item) => item.versionId === selectedArchiveVersion?.id) || null,
    [selectedArchiveVersion?.id, todoItems],
  );
  const compareVersions = useMemo(
    () => evaluationSummaryRecords.slice(0, Math.max(2, Math.min(analysisCompareCount, 4))),
    [analysisCompareCount, evaluationSummaryRecords],
  );
  const versionComparisonSections = useMemo(() => {
    if (!compareVersions.length || !modelDefinition?.dimensions?.length) return [];
    return (modelDefinition.dimensions || []).map((dimension) => ({
      key: dimension.id,
      name: dimension.name,
      description: dimension.description,
      items: (dimension.items || []).map((item) => {
        const cells = compareVersions.map((version) => {
          const matchedRow = (version.snapshot?.mappingRows || []).find((row) => row.itemId === item.id || row.itemName === item.name) || null;
          const coverage = matchedRow?.coverage || 0;
          const statusMeta = buildCoverageStatus(coverage);
          return {
            versionId: version.id,
            periodLabel: version.periodLabel || '-',
            versionLabel: `${version.periodLabel || '-'} · ${getTeacherEvaluationStatusLabel(version.versionStatus || version.status)}`,
            coverage,
            evidenceCount: matchedRow?.evidenceCount || 0,
            statusLabel: matchedRow?.statusLabel || statusMeta.label,
            statusColor: matchedRow?.statusColor || statusMeta.color,
            sourceLabel: matchedRow?.sourceLabel || matchedRow?.sourceKey || '暂无显著来源',
            latestEvidenceTitle: matchedRow?.latestEvidenceTitle || matchedRow?.evidenceTitle || '',
          };
        });
        const latestCell = cells[0] || null;
        const earliestCell = cells[cells.length - 1] || null;
        const delta = latestCell && earliestCell ? latestCell.coverage - earliestCell.coverage : 0;
        return {
          id: item.id,
          dimensionKey: dimension.id,
          dimensionName: dimension.name,
          name: item.name,
          description: item.description,
          latestCoverage: latestCell?.coverage || 0,
          earliestCoverage: earliestCell?.coverage || 0,
          delta,
          trendLabel: formatCoverageDelta(delta),
          trendTone: delta >= 8 ? 'up' : delta <= -8 ? 'down' : 'steady',
          cells,
        };
      }),
    }));
  }, [compareVersions, modelDefinition]);
  const filteredVersionComparisonSections = useMemo(() => {
    const normalizedSearch = analysisSearch.trim().toLowerCase();
    const nextSections = versionComparisonSections
      .filter((section) => analysisDimensionFilter === 'ALL' || section.key === analysisDimensionFilter)
      .map((section) => {
        const nextItems = section.items
          .filter((item) => {
            const matchedTrend = analysisTrendFilter === 'ALL'
              || (analysisTrendFilter === 'UP' && item.trendTone === 'up')
              || (analysisTrendFilter === 'DOWN' && item.trendTone === 'down')
              || (analysisTrendFilter === 'STEADY' && item.trendTone === 'steady');
            if (!matchedTrend) return false;
            if (!normalizedSearch) return true;
            const haystack = [section.name, item.name, item.description]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return haystack.includes(normalizedSearch);
          })
          .sort((left, right) => {
            if (analysisSortMode === 'LATEST') {
              return right.latestCoverage - left.latestCoverage || right.delta - left.delta;
            }
            if (analysisSortMode === 'NAME') {
              return left.name.localeCompare(right.name, 'zh-CN');
            }
            return right.delta - left.delta || right.latestCoverage - left.latestCoverage;
          });
        return {
          ...section,
          items: nextItems,
          improvedCount: nextItems.filter((item) => item.trendTone === 'up').length,
          regressedCount: nextItems.filter((item) => item.trendTone === 'down').length,
        };
      })
      .filter((section) => section.items.length);
    return nextSections;
  }, [analysisDimensionFilter, analysisSearch, analysisSortMode, analysisTrendFilter, versionComparisonSections]);
  const visibleComparisonItems = useMemo(
    () => filteredVersionComparisonSections.flatMap((section) => section.items),
    [filteredVersionComparisonSections],
  );
  const versionComparisonSummary = useMemo(() => {
    const allItems = visibleComparisonItems;
    const improvedItems = allItems.filter((item) => item.delta >= 8);
    const regressedItems = allItems.filter((item) => item.delta <= -8);
    const stableItems = allItems.filter((item) => item.delta > -8 && item.delta < 8);
    const strongestGrowthItem = [...allItems].sort((left, right) => right.delta - left.delta)[0] || null;
    const weakestItem = [...allItems].sort((left, right) => left.delta - right.delta)[0] || null;
    return {
      comparedVersionCount: compareVersions.length,
      improvedCount: improvedItems.length,
      regressedCount: regressedItems.length,
      stableCount: stableItems.length,
      strongestGrowthItem,
      weakestItem,
      visibleItemCount: allItems.length,
    };
  }, [compareVersions.length, visibleComparisonItems]);
  const analysisDimensionOptions = useMemo(
    () => [
      { label: '全部能力类', value: 'ALL' },
      ...(modelDefinition?.dimensions || []).map((dimension) => ({ label: dimension.name, value: dimension.id })),
    ],
    [modelDefinition],
  );
  const analysisCompareCountOptions = useMemo(
    () => [2, 3, 4].map((count) => ({
      label: `最近 ${count} 个周期`,
      value: count,
      disabled: evaluationSummaryRecords.length < count,
    })),
    [evaluationSummaryRecords.length],
  );
  const focusedAnalysisItem = useMemo(
    () => visibleComparisonItems.find((item) => item.id === selectedAnalysisItemId) || visibleComparisonItems[0] || null,
    [selectedAnalysisItemId, visibleComparisonItems],
  );
  const focusedAnalysisSuggestion = useMemo(() => {
    if (!focusedAnalysisItem) return '至少保留两个周期的材料沉淀，才能形成稳定的成长趋势判断。';
    if (focusedAnalysisItem.trendTone === 'up') {
      return '该能力项在最近周期持续走强，建议继续补充高质量成果型材料，巩固增长趋势。';
    }
    if (focusedAnalysisItem.trendTone === 'down') {
      return '该能力项较早期周期出现回落，建议优先补充本周期的新材料，并检查映射是否遗漏。';
    }
    return '该能力项整体保持平稳，建议继续维持常规材料沉淀，并尝试补充更能体现进阶水平的证据。';
  }, [focusedAnalysisItem]);
  const analysisLatestHint = compareVersions[0]
    ? `${compareVersions[0].periodLabel || '-'} · ${compareVersions[0].schemeName || '-'} · ${formatDateTimeText(compareVersions[0].updatedAt || compareVersions[0].createdAt)}`
    : '当前暂无可分析的周期数据';
  useEffect(() => {
    if (!visibleComparisonItems.length) {
      if (selectedAnalysisItemId) setSelectedAnalysisItemId('');
      return;
    }
    if (!selectedAnalysisItemId || !visibleComparisonItems.some((item) => item.id === selectedAnalysisItemId)) {
      setSelectedAnalysisItemId(visibleComparisonItems[0].id);
    }
  }, [selectedAnalysisItemId, visibleComparisonItems]);
  useEffect(() => {
    const maxCount = Math.min(4, Math.max(2, evaluationSummaryRecords.length || 2));
    if (analysisCompareCount > maxCount) {
      setAnalysisCompareCount(maxCount);
    }
  }, [analysisCompareCount, evaluationSummaryRecords.length]);
  const currentTeacherProfile = useMemo(() => {
    const profileName = snapshot?.profile?.name || PROFILE_BASE.name;
    return evaluationTeachers.find((item) => item.name === profileName) || buildFallbackTeacherProfile(snapshot?.profile);
  }, [evaluationTeachers, snapshot?.profile]);
  const directSubmitSchemes = useMemo(() => {
    const activeSchemes = evaluationSchemes.filter((item) => item.status === 'ACTIVE');
    if (!currentTeacherProfile?.targetLevel) return activeSchemes;
    const matchedSchemes = activeSchemes.filter((item) => item.targetLevel === currentTeacherProfile.targetLevel);
    return matchedSchemes.length ? matchedSchemes : activeSchemes;
  }, [currentTeacherProfile?.targetLevel, evaluationSchemes]);
  const watchedDirectSubmitSchemeId = Form.useWatch('schemeId', directSubmitForm);
  const selectedDirectSubmitScheme = useMemo(
    () => directSubmitSchemes.find((item) => item.id === watchedDirectSubmitSchemeId) || directSubmitSchemes[0] || null,
    [directSubmitSchemes, watchedDirectSubmitSchemeId],
  );
  const currentTeacherOpenPeriodsByScheme = useMemo(() => {
    const nextMap = new Map();
    archiveVersions
      .filter((item) => item.teacherName === currentTeacherProfile?.name && !isClosedEvaluationStatus(item.versionStatus || item.status))
      .forEach((item) => {
        const schemePeriods = nextMap.get(item.schemeId) || new Set();
        schemePeriods.add(item.periodLabel || '-');
        nextMap.set(item.schemeId, schemePeriods);
      });
    return nextMap;
  }, [archiveVersions, currentTeacherProfile?.name]);
  const selectedSchemeOpenPeriods = useMemo(
    () => Array.from(currentTeacherOpenPeriodsByScheme.get(selectedDirectSubmitScheme?.id) || []),
    [currentTeacherOpenPeriodsByScheme, selectedDirectSubmitScheme?.id],
  );

  const openDirectSubmitModal = useCallback(() => {
    const defaultScheme = directSubmitSchemes[0] || null;
    directSubmitForm.setFieldsValue({
      schemeId: defaultScheme?.id,
      periodLabel: buildSuggestedNextPeriodLabel(),
      scenarioLabel: defaultScheme?.schemeType || '正式评价',
      applicationNote: '从我的档案创建新周期草稿周期，先整理成长材料，再决定何时提交审批。',
      creationMode: 'INHERIT_LATEST',
    });
    setDirectSubmitOpen(true);
  }, [directSubmitForm, directSubmitSchemes]);

  const handleDirectSubmit = useCallback(async (values) => {
    if (!currentTeacherProfile) {
      message.error('当前教师档案未绑定评价主体，暂时无法发起评审');
      return;
    }
    setDirectSubmitSubmitting(true);
    try {
      const latestVersion = evaluationSummaryRecords[0] || null;
      const nextSnapshot = values.creationMode === 'BLANK'
        ? archiveVersionApi.buildBlankSnapshot(selectedArchiveVersion?.snapshot || snapshot)
        : JSON.parse(JSON.stringify(latestVersion?.snapshot || selectedArchiveVersion?.snapshot || snapshot));
      const createdVersion = await archiveVersionApi.create({
        teacherId: currentTeacherProfile.teacherId,
        teacherName: currentTeacherProfile.name,
        periodLabel: values.periodLabel,
        schemeId: values.schemeId,
        schemeName: selectedDirectSubmitScheme?.name || '',
        scenarioLabel: values.scenarioLabel,
        applicationNote: values.applicationNote,
        targetLevel: currentTeacherProfile.targetLevel,
        baseVersionId: values.creationMode === 'BLANK' ? '' : (latestVersion?.id || ''),
        snapshot: nextSnapshot,
        creationMode: values.creationMode,
      });
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: currentTeacherProfile,
        evaluationRecords: evaluationRecordList,
      });
      setArchiveVersions(nextVersions);
      setSelectedArchiveVersionId(createdVersion.id);
      setDirectSubmitOpen(false);
      directSubmitForm.resetFields();
      message.success(`已为「${values.periodLabel}」创建草稿周期，可在数据来源中继续导入材料`);
    } catch (error) {
      message.error(error?.message || '创建新周期草稿失败');
    } finally {
      setDirectSubmitSubmitting(false);
    }
  }, [
    currentTeacherProfile,
    directSubmitForm,
    evaluationRecordList,
    evaluationSummaryRecords,
    selectedArchiveVersion?.snapshot,
    selectedDirectSubmitScheme,
    snapshot,
  ]);

  const openTeacherEvaluationRecord = useCallback((record) => {
    if (!record || !canNavigateToTeacherEvaluation || !record.evaluationRecordId) return;
    onNavigateToTeacherEvaluation({
      recordId: record.evaluationRecordId,
      schemeId: record.schemeId,
      teacherName: record.teacherName || snapshot?.profile?.name || PROFILE_BASE.name,
      periodLabel: record.periodLabel || '',
      openRecordDrawer: true,
      source: 'my-profile',
    });
  }, [canNavigateToTeacherEvaluation, onNavigateToTeacherEvaluation, snapshot?.profile?.name]);

  const handleSubmitArchiveVersion = useCallback(async (record) => {
    if (!record || !['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(record.versionStatus || record.status)) return;
    if (!record.schemeId) {
      message.error('当前周期尚未绑定评价方案，暂时无法提交审批');
      return;
    }
    const evidenceItems = archiveVersionApi.buildEvidenceItems(record);
    if (!evidenceItems.length) {
      message.error('该草稿周期还没有已确认映射的材料，请先导入资料并确认证据映射');
      return;
    }
    const confirmed = await new Promise((resolve) => {
      Modal.confirm({
        title: '提交草稿周期审批',
        content: `将把「${record.periodLabel || '-'} / ${record.schemeName || '-'}」提交到审批流程，提交后周期会进入评审中状态。`,
        okText: '确认提交',
        cancelText: '再看看',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;
    setArchiveActionLoadingId(record.id);
    try {
      let targetRecordId = record.evaluationRecordId;
      let latestRecord = null;
      if (targetRecordId) {
        latestRecord = await teacherEvaluationApi.updateRecordDraft(targetRecordId, {
          archiveVersionId: record.id,
          periodLabel: record.periodLabel,
          applicationNote: record.applicationNote,
          scenarioLabel: record.scenarioLabel,
          requestedBy: record.teacherName || currentTeacherProfile?.name,
          evidenceItems,
          actorId: record.teacherId || currentTeacherProfile?.teacherId,
          actorName: record.teacherName || currentTeacherProfile?.name,
          actorRole: 'TEACHER',
        });
      } else {
        latestRecord = await teacherEvaluationApi.createRecord(record.schemeId, {
          archiveVersionId: record.id,
          teacherProfile: currentTeacherProfile,
          periodLabel: record.periodLabel,
          scenarioLabel: record.scenarioLabel,
          applicationNote: record.applicationNote,
          requestedBy: record.teacherName || currentTeacherProfile?.name,
          evidenceItems,
        });
        targetRecordId = latestRecord.id;
      }
      await teacherEvaluationApi.submitRecord(targetRecordId, {
        operatorId: record.teacherId || currentTeacherProfile?.teacherId,
        operatorName: record.teacherName || currentTeacherProfile?.name,
        operatorRole: 'TEACHER',
      });
      await archiveVersionApi.linkEvaluationRecord(record.id, {
        evaluationRecordId: targetRecordId,
        versionStatus: 'IN_REVIEW',
      });
      const nextRecords = await teacherEvaluationApi.listRecords();
      const nextRecordsWithNodeNames = nextRecords.map((item) => ({
        ...item,
        currentNodeName: evaluationSchemes.find((scheme) => scheme.id === item.schemeId)?.reviewFlow?.find((node) => node.key === item.currentNode)?.name || item.currentNode || '',
      }));
      setEvaluationRecordList(nextRecordsWithNodeNames);
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: currentTeacherProfile,
        evaluationRecords: nextRecordsWithNodeNames,
      });
      setArchiveVersions(nextVersions);
      message.success(`已提交「${record.periodLabel || '-'}」草稿周期进入审批`);
    } catch (error) {
      message.error(error?.message || '提交草稿周期失败');
    } finally {
      setArchiveActionLoadingId('');
    }
  }, [currentTeacherProfile, evaluationSchemes]);

  const handleOpenResourceImport = useCallback(() => {
    if (!selectedArchiveVersion || !canEditSelectedVersion) {
      message.info('请先选择一个可编辑的草稿周期');
      return;
    }
    setResourceImportSelection([]);
    setResourceImportOpen(true);
  }, [canEditSelectedVersion, selectedArchiveVersion]);

  const handleImportVersionResources = useCallback(async () => {
    if (!selectedArchiveVersion) return;
    const selectedItems = resourceLibraryItems.filter((item) => resourceImportSelection.includes(item.importKey));
    if (!selectedItems.length) {
      message.error('请至少选择 1 条资料库材料');
      return;
    }
    setResourceImportLoading(true);
    try {
      await archiveVersionApi.importMaterials(selectedArchiveVersion.id, selectedItems);
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: currentTeacherProfile,
        evaluationRecords: evaluationRecordList,
      });
      setArchiveVersions(nextVersions);
      setResourceImportOpen(false);
      setResourceImportSelection([]);
      message.success(`已向「${selectedArchiveVersion.periodLabel || '当前周期'}」导入 ${selectedItems.length} 条资料`);
    } catch (error) {
      message.error(error?.message || '导入资料库材料失败');
    } finally {
      setResourceImportLoading(false);
    }
  }, [currentTeacherProfile, evaluationRecordList, resourceImportSelection, resourceLibraryItems, selectedArchiveVersion]);

  const handleGenerateVersionMappingSuggestions = useCallback(async () => {
    if (!selectedArchiveVersion) return;
    setMappingSuggestionLoading(true);
    try {
      const suggestions = await archiveVersionApi.generateMappingSuggestions(selectedArchiveVersion.id);
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: currentTeacherProfile,
        evaluationRecords: evaluationRecordList,
      });
      setArchiveVersions(nextVersions);
      message.success(suggestions.length ? `已生成 ${suggestions.length} 条 AI 映射建议` : '当前没有可生成的 AI 映射建议');
    } catch (error) {
      message.error(error?.message || '生成 AI 映射建议失败');
    } finally {
      setMappingSuggestionLoading(false);
    }
  }, [currentTeacherProfile, evaluationRecordList, selectedArchiveVersion]);

  const handleApplyMappingSuggestions = useCallback(async (suggestionIds) => {
    if (!selectedArchiveVersion || !suggestionIds?.length) return;
    setMappingSuggestionLoading(true);
    try {
      await archiveVersionApi.applyMappingSuggestions(selectedArchiveVersion.id, suggestionIds);
      const nextVersions = await archiveVersionApi.list({
        teacherProfile: currentTeacherProfile,
        evaluationRecords: evaluationRecordList,
      });
      setArchiveVersions(nextVersions);
      message.success('已将 AI 映射建议写入当前周期');
    } catch (error) {
      message.error(error?.message || '应用 AI 映射建议失败');
    } finally {
      setMappingSuggestionLoading(false);
    }
  }, [currentTeacherProfile, evaluationRecordList, selectedArchiveVersion]);

  const handleArchiveVersionAction = useCallback((record, actionKey) => {
    if (actionKey === 'SUBMIT') {
      handleSubmitArchiveVersion(record);
      return;
    }
    setWorkspaceView('CURRENT');
    setSelectedArchiveVersionId(record.id);
    setActiveArchiveTab('approval');
  }, [handleSubmitArchiveVersion]);

  const openArchiveVersionTask = useCallback((versionId, targetTab = 'approval') => {
    if (!versionId) return;
    setTodoPopoverOpen(false);
    setWorkspaceView('CURRENT');
    setSelectedArchiveVersionId(versionId);
    setActiveArchiveTab(targetTab);
  }, []);

  const handleApprovalTaskAction = useCallback((record, actionKey) => {
    if (!record) return;
    if (actionKey === 'SUBMIT') {
      handleSubmitArchiveVersion(record);
      return;
    }
    if (actionKey === 'OPEN_TEACHER_EVALUATION') {
      openTeacherEvaluationRecord(record);
      return;
    }
    if (actionKey === 'GO_SOURCES') {
      openArchiveVersionTask(record.id, 'sources');
      return;
    }
    if (actionKey === 'GO_APPROVAL') {
      openArchiveVersionTask(record.id, 'approval');
    }
  }, [handleSubmitArchiveVersion, openArchiveVersionTask, openTeacherEvaluationRecord]);

  function renderArchiveVersionActions(record) {
    const actionMeta = getArchiveVersionActionMeta(record);
    if (!actionMeta) return null;
    return (
      <div className="profile-archive-version-actions">
        <span>{actionMeta.description}</span>
        <Space wrap>
          {actionMeta.primaryAction ? (
            <Button
              size="small"
              type={actionMeta.primaryAction.type || 'default'}
              loading={actionMeta.primaryAction.key === 'SUBMIT' && archiveActionLoadingId === record.id}
              onClick={() => handleArchiveVersionAction(record, actionMeta.primaryAction.key)}
            >
              {actionMeta.primaryAction.label}
            </Button>
          ) : null}
          {actionMeta.secondaryAction ? (
            <Button
              size="small"
              onClick={() => handleArchiveVersionAction(record, actionMeta.secondaryAction.key)}
            >
              {actionMeta.secondaryAction.label}
            </Button>
          ) : null}
        </Space>
      </div>
    );
  }

  function renderTodoPopoverContent() {
    if (!todoItems.length) {
      return (
        <div className="profile-archive-todo-popover">
          <div className="profile-archive-todo-popover-head">
            <strong>我的待办</strong>
            <span>当前没有需要在档案里处理的任务</span>
          </div>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待办" />
        </div>
      );
    }

    return (
      <div className="profile-archive-todo-popover">
        <div className="profile-archive-todo-popover-head">
          <strong>我的待办</strong>
          <span>点击任务后会切到对应周期的审批信息</span>
        </div>
        <div className="profile-archive-todo-list">
          {todoItems.map((item) => (
            <div key={item.key} className={`profile-archive-todo-item is-${item.status.toLowerCase()}`}>
              <div className="profile-archive-todo-item-head">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.periodLabel} · {item.schemeName}</span>
                </div>
                <Tag color={getEvaluationStatusColor(item.status)}>{getTeacherEvaluationStatusLabel(item.status)}</Tag>
              </div>
              <p>{item.description}</p>
              <div className="profile-archive-todo-item-foot">
                <span>{item.currentNodeName} · 最近更新 {formatDateTimeText(item.updatedAt)}</span>
                <Button size="small" type="primary" onClick={() => openArchiveVersionTask(item.versionId)}>
                  {item.actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function openCellGrowthRecord(item, level, cellRecord) {
    if (!cellRecord?.evidenceId) return;
    const growthRecord = resolveGrowthRecordFromSnapshot(snapshot, cellRecord?.evidenceId, {
      focusItemId: item.id,
      focusDimensionName: cellRecord?.dimensionName || '-',
      focusItemName: item.name,
      focusLevelKey: level.key,
      focusLevelLabel: level.label,
      focusCoverage: cellRecord?.coverage,
    });
    if (!growthRecord) return;
    setSelectedGrowthRecord(growthRecord);
    setGrowthRecordDrawerOpen(true);
  }

  useEffect(() => {
    if (mappingView !== 'matrix') return;
    const firstSectionKey = mappingMatrixSections[0]?.key;
    if (firstSectionKey) {
      setActiveMatrixAnchor(firstSectionKey);
    }
  }, [mappingMatrixSections, mappingView]);

  function scrollToMatrixSection(sectionKey) {
    const sectionNode = matrixSectionRefs.current[sectionKey];
    if (!sectionNode) return;
    setActiveMatrixAnchor(sectionKey);
    sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <div className="sys-module my-profile-module">
        <div className="profile-archive-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="sys-module my-profile-module">
        <div className="profile-archive-loading">
          <Empty description="暂无可展示的档案模型" />
        </div>
      </div>
    );
  }

  const overviewTab = (
    <div className="profile-archive-tab">
      <div className="profile-archive-grid profile-archive-grid-overview">
        <Card variant="borderless" className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>周期概况</span>
            <Tag color={selectedVersionStatusColor}>{selectedVersionStatusLabel}</Tag>
          </div>
          <div className="profile-archive-profile">
            <div className="profile-archive-avatar">
              <UserOutlined />
            </div>
            <div className="profile-archive-profile-meta">
              <h3>{snapshot.profile.name}</h3>
              <span>{snapshot.profile.schoolName} · {snapshot.profile.departmentName}</span>
              <span>{snapshot.profile.roleName} / {snapshot.profile.roleLevelName}</span>
              <span>{snapshot.profile.tenureLabel}</span>
            </div>
          </div>
          <div className="profile-archive-kv-list">
            <div><span>当前周期</span><strong>{selectedArchiveVersion?.periodLabel || '-'}</strong></div>
            <div><span>评价方案</span><strong>{selectedArchiveVersion?.schemeName || '未绑定评价方案'}</strong></div>
            <div><span>目标层级</span><strong>{selectedArchiveVersion?.targetLevel || snapshot.profile.roleLevelName}</strong></div>
            <div><span>当前节点</span><strong>{selectedArchiveVersion?.currentNodeName || '尚未进入审批'}</strong></div>
            <div><span>成长判断</span><strong>{snapshot.profile.growthHint}</strong></div>
            <div><span>周期说明</span><strong>{selectedArchiveVersion?.applicationNote || selectedVersionApprovalSummary}</strong></div>
          </div>
        </Card>

        <Card variant="borderless" className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>维度证据概览</span>
            <Tag color="green">{snapshot.currentModel.dimensionCount} 个能力类</Tag>
          </div>
          <div className="profile-archive-dimension-list">
            {snapshot.dimensions.map((dimension) => (
              <div key={dimension.key} className="profile-archive-dimension-row">
                <div className="profile-archive-dimension-meta">
                  <strong>{dimension.name}</strong>
                  <span>{dimension.description || '未填写能力类说明'}</span>
                </div>
                <div className="profile-archive-dimension-progress">
                  <Progress percent={dimension.averageScore} size="small" strokeColor={SOURCE_META[dimension.strongestSourceKey].color} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="profile-archive-overview-strip">
        <div className="profile-archive-overview-chip">
          <span>材料来源覆盖</span>
          <strong>{activeSourceCount} 类</strong>
          <em>当前周期已沉淀的来源类型</em>
        </div>
        <div className="profile-archive-overview-chip">
          <span>AI 待确认建议</span>
          <strong>{selectedVersionSuggestions.length} 条</strong>
          <em>可在“数据来源”中确认写入</em>
        </div>
        <div className="profile-archive-overview-chip">
          <span>审批留痕</span>
          <strong>{selectedVersionReviewOpinions.length} 条</strong>
          <em>当前周期已记录的审批意见</em>
        </div>
        <div className="profile-archive-overview-chip">
          <span>可分析周期</span>
          <strong>{snapshot.evaluationSummary?.periodCount || 0} 个</strong>
          <em>可切到“周期分析”查看能力成长轨迹</em>
        </div>
      </div>

      <div className="profile-archive-grid profile-archive-grid-sources">
        {snapshot.sourceStats.map((item) => (
          <Card key={item.key} variant="borderless" className="profile-archive-source-card">
            <div className="profile-archive-source-top">
              <div className="profile-archive-source-icon" style={{ background: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </div>
            </div>
            <div className="profile-archive-source-stats">
              <div><span>平均覆盖度</span><strong>{item.averageScore}%</strong></div>
              <div><span>记录条数</span><strong>{item.evidenceCount}</strong></div>
              <div>
                <span>最近记录</span>
                {item.latestRecord ? (
                  <button
                    type="button"
                    className="profile-archive-inline-link"
                    onClick={() => openGrowthRecordDetail(item.latestRecord.id)}
                  >
                    {item.latestRecord.title}
                  </button>
                ) : (
                  <span>当前周期暂无该来源资料</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const mappingTab = (
    <div className="profile-archive-tab">
      <Card variant="borderless" className="profile-archive-panel">
        <div className="profile-archive-panel-head">
          <div className="profile-archive-panel-head-main">
            <Space wrap>
              <Tag color="blue">当前模型 {snapshot.currentModel.itemCount} 项</Tag>
              <Tag color="green">证据充分 {snapshot.summary.strongItemCount} 项</Tag>
              <Tag color="warning">待补证 {snapshot.summary.focusItemCount} 项</Tag>
              <Tag>缺证等级 {snapshot.summary.missingLevelCount} 个</Tag>
              <Tag color="warning">证据偏弱等级 {snapshot.summary.lowMatchLevelCount} 个</Tag>
              <Tag color="success">证据强支撑等级 {snapshot.summary.strongLevelCount} 个</Tag>
            </Space>
          </div>
          <Segmented
            value={mappingView}
            onChange={setMappingView}
            options={[
              { label: '表格视图', value: 'table' },
              { label: '矩阵视图', value: 'matrix' },
            ]}
          />
        </div>
        {mappingView === 'table' ? (
          <Table
            rowKey="key"
            columns={mappingColumns}
            dataSource={snapshot.mappingRows}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 980 }}
          />
        ) : (
          <div className="profile-archive-matrix-view">
            <div className="profile-archive-matrix-anchor-bar">
              <span>能力目录</span>
              <div className="profile-archive-matrix-anchor-list">
                {mappingMatrixSections.map((dimension, index) => (
                  <button
                    key={dimension.key}
                    type="button"
                    className={`profile-archive-matrix-anchor-chip${activeMatrixAnchor === dimension.key ? ' is-active' : ''}`}
                    onClick={() => scrollToMatrixSection(dimension.key)}
                  >
                    {index + 1}. {dimension.name}
                  </button>
                ))}
              </div>
            </div>
            {mappingMatrixSections.map((dimension) => (
              <div
                key={dimension.key}
                ref={(node) => {
                  matrixSectionRefs.current[dimension.key] = node;
                }}
                className="profile-archive-matrix-section"
              >
                <div className="profile-archive-matrix-section-head">
                  <div>
                    <div className="profile-archive-matrix-section-title">{dimension.name}</div>
                    <div className="profile-archive-matrix-section-desc">{dimension.description || '未填写能力类说明'}</div>
                  </div>
                  <Tag color="blue">{dimension.items.length} 个能力项</Tag>
                </div>
                <div className="profile-archive-matrix">
                  <table>
                    <colgroup>
                      <col className="profile-archive-matrix-col-item" />
                      {(modelDefinition?.levelScheme?.levels || []).map((level) => (
                        <col key={level.key} className="profile-archive-matrix-col-level" />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        <th>
                          <div className="profile-archive-matrix-head-main">能力项</div>
                          <div className="profile-archive-matrix-head-sub">要求与成长记录</div>
                        </th>
                        {(modelDefinition?.levelScheme?.levels || []).map((level) => (
                          <th key={level.key}>
                            <div className="profile-archive-matrix-level-head">
                              <strong>{level.label}</strong>
                              <span>等级描述与证据</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dimension.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="profile-archive-matrix-item">{item.name}</div>
                            <div className="profile-archive-matrix-desc">{item.description || '未填写能力项说明'}</div>
                            <div className="profile-archive-matrix-item-meta">
                              <span>至少 {item.requiredEvidenceCount || 1} 条证据</span>
                              {item.requiredReviewRoles?.length ? (
                                <span>{formatReviewRoles(item.requiredReviewRoles)}</span>
                              ) : null}
                              <span>{item.isGrowthOnly ? '仅成长档案' : '可进入正式评价'}</span>
                            </div>
                            <div className="profile-archive-matrix-desc">
                              证据要求：围绕真实教学任务、可复核过程记录与结果材料组织证据。
                            </div>
                            {item.evidenceExamples?.length ? (
                              <div className="profile-archive-matrix-record">
                                成长记录示例：{item.evidenceExamples.join('、')}
                              </div>
                            ) : null}
                          </td>
                          {item.cellMappings.map(({ level, descriptor, growthRecord }) => (
                            <td key={`${item.id}_${level.key}`}>
                              <div className="profile-archive-matrix-cell">
                                {growthRecord ? (
                                  <div className="profile-archive-matrix-status">
                                    <Tag color={growthRecord.statusColor}>{growthRecord.statusLabel}</Tag>
                                    <span>
                                      {growthRecord.hasRecord && typeof growthRecord.coverage === 'number'
                                        ? `${growthRecord.coverage}% 覆盖`
                                        : '建议补充直接记录'}
                                    </span>
                                  </div>
                                ) : null}
                                <div className="profile-archive-matrix-cell-block">
                                  <div className="profile-archive-matrix-cell-label">等级描述</div>
                                  <div className="profile-archive-matrix-cell-text">{descriptor.text || '-'}</div>
                                </div>
                                <div className="profile-archive-matrix-cell-label">当前记录</div>
                                {growthRecord?.hasRecord ? (
                                  <button
                                    type="button"
                                    className="profile-archive-matrix-record-card"
                                    onClick={() => openCellGrowthRecord(item, level, growthRecord)}
                                  >
                                    <div className="profile-archive-matrix-record-head">
                                      <Tag color={SOURCE_META[growthRecord.sourceKey].color}>{growthRecord.sourceLabel}</Tag>
                                      <span>{growthRecord.coverage}% 覆盖</span>
                                    </div>
                                    <strong>{growthRecord.evidenceTitle}</strong>
                                    <span>{growthRecord.evidenceDate} · {growthRecord.evidenceTag}</span>
                                  </button>
                                ) : (
                                  <div className="profile-archive-matrix-record-empty">
                                    {growthRecord?.statusLabel || '暂无映射记录'}
                                  </div>
                                )}
                                {growthRecord?.growthAdvice?.summary ? (
                                  <div className="profile-archive-matrix-advice">
                                    <div className="profile-archive-matrix-cell-label">改进建议</div>
                                    <div>{growthRecord.growthAdvice.summary}</div>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const sourcesTab = (
    <div className="profile-archive-tab">
      <div className="profile-archive-grid profile-archive-grid-evaluation-summary">
        <Card variant="borderless" className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>当前周期数据来源</span>
            <Space wrap>
              <Tag color="blue">{selectedArchiveVersion?.periodLabel || '-'}</Tag>
              {canEditSelectedVersion ? (
                <>
                  <Button size="small" onClick={handleOpenResourceImport}>从资料库导入</Button>
                  <Button size="small" type="primary" loading={mappingSuggestionLoading} onClick={handleGenerateVersionMappingSuggestions}>
                    AI 自动映射
                  </Button>
                </>
              ) : null}
            </Space>
          </div>
          <div className="profile-archive-evaluation-summary-card">
            <div className="profile-archive-evaluation-summary-copy">
              <strong>{selectedArchiveVersion?.schemeName || '当前未绑定评价方案'}</strong>
              <p>
                当前周期共沉淀 {selectedVersionMaterials.length} 条材料，
                已确认映射 {selectedVersionMaterials.filter((item) => item.mappingStatus === 'CONFIRMED').length} 条，
                待确认 {selectedVersionSuggestions.length} 条 AI 建议。
              </p>
            </div>
            {selectedVersionSuggestions.length ? (
              <div className="profile-archive-version-suggestion-list">
                {selectedVersionSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="profile-archive-version-suggestion-item">
                    <div>
                      <strong>{suggestion.materialTitle}</strong>
                      <span>{suggestion.suggestedItemNames.join('、')} · 置信度 {suggestion.confidenceLabel}</span>
                    </div>
                    <div className="profile-archive-version-suggestion-actions">
                      <span>{suggestion.rationale}</span>
                      {canEditSelectedVersion ? (
                        <Button size="small" onClick={() => handleApplyMappingSuggestions([suggestion.id])}>确认写入</Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {canEditSelectedVersion ? (
                  <Button size="small" type="primary" onClick={() => handleApplyMappingSuggestions(selectedVersionSuggestions.map((item) => item.id))}>
                    全部写入当前周期
                  </Button>
                ) : null}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前暂无待确认的 AI 映射建议" />
            )}
          </div>
        </Card>
      </div>
      <div className="profile-archive-grid profile-archive-grid-sources-detail">
        {Object.entries(snapshot.recordsBySource).map(([key, records]) => (
          <Card key={key} variant="borderless" className="profile-archive-panel">
            <div className="profile-archive-panel-head">
              <Space>
                <span>{SOURCE_META[key].label}</span>
                <Tag color={SOURCE_META[key].color}>{records.length} 条记录</Tag>
              </Space>
              <Tag>{snapshot.sourceStats.find((item) => item.key === key)?.averageScore || 0}% 覆盖</Tag>
            </div>
            <div className="profile-archive-record-list">
              {records.length ? records.map((record) => (
                <div key={record.id} className="profile-archive-record-item">
                  <div className="profile-archive-record-top">
                    <strong>{record.title}</strong>
                    <span>{record.date}</span>
                  </div>
                  <div className="profile-archive-record-tags">
                    <Tag>{record.tag}</Tag>
                    <Tag color={record.statusColor}>{record.linkedItemCount} 个能力项</Tag>
                    {record.originType === 'RESOURCE_LIBRARY' ? <Tag color="blue">资料库导入</Tag> : <Tag>跨周期带入材料</Tag>}
                    {record.mappingStatus === 'CONFIRMED' ? <Tag color="success">已确认映射</Tag> : <Tag color="default">待确认映射</Tag>}
                  </div>
                  <p>{record.summary}</p>
                  <div className="profile-archive-record-foot">
                    <span>来源路径：{record.resourcePath || record.matchNote}</span>
                    <Button type="link" size="small" onClick={() => openGrowthRecordDetail(record.id)}>查看详情</Button>
                  </div>
                </div>
              )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`当前周期暂无${SOURCE_META[key].label}来源资料`} />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const approvalTab = (
    <div className="profile-archive-tab">
      <Card variant="borderless" className={`profile-archive-panel profile-archive-task-panel${selectedVersionTodoMeta ? ` is-${selectedVersionTodoMeta.status.toLowerCase()}` : ''}`}>
        <div className="profile-archive-panel-head">
          <span>当前任务</span>
          {selectedVersionTodoMeta ? (
            <Tag color={getEvaluationStatusColor(selectedVersionTodoMeta.status)}>{selectedVersionTodoMeta.title}</Tag>
          ) : (
            <Tag>当前无待办</Tag>
          )}
        </div>
        {selectedArchiveVersion ? (
          <div className="profile-archive-task-card">
            <div className="profile-archive-task-card-copy">
              <strong>{selectedVersionTodoMeta?.title || '当前周期暂无待办任务'}</strong>
              <p>{selectedVersionTodoMeta?.description || '当前周期没有教师侧待办任务，可在下方查看审批留痕与结论。'}</p>
            </div>
            <div className="profile-archive-task-meta-grid">
              <div className="profile-archive-task-meta-item">
                <span>当前周期</span>
                <strong>{selectedArchiveVersion.periodLabel || '-'}</strong>
                <em>{selectedArchiveVersion.schemeName || '未绑定评价方案'}</em>
              </div>
              <div className="profile-archive-task-meta-item">
                <span>当前节点</span>
                <strong>{selectedArchiveVersion.currentNodeName || '尚未进入审批'}</strong>
                <em>{selectedVersionStatusLabel}</em>
              </div>
              <div className="profile-archive-task-meta-item">
                <span>最近更新时间</span>
                <strong>{formatDateTimeText(selectedArchiveVersion.updatedAt || selectedArchiveVersion.createdAt)}</strong>
                <em>{selectedVersionReviewOpinions[0]?.stageName || '当前暂无审批意见'}</em>
              </div>
              <div className="profile-archive-task-meta-item">
                <span>最近意见</span>
                <strong>{selectedVersionReviewOpinions[0]?.resultLabel || selectedArchiveVersion.finalDecision?.decisionLabel || '待处理'}</strong>
                <em>{selectedVersionReviewOpinions[0]?.comment || selectedArchiveVersion.finalDecision?.summary || selectedArchiveVersion.appeal?.summary || '当前暂无新增意见'}</em>
              </div>
            </div>
            <Space wrap>
              {selectedVersionStatus === 'DRAFT' ? (
                <>
                  <Button
                    type="primary"
                    loading={archiveActionLoadingId === selectedArchiveVersion.id}
                    onClick={() => handleApprovalTaskAction(selectedArchiveVersion, 'SUBMIT')}
                  >
                    提交审批
                  </Button>
                  <Button onClick={() => handleApprovalTaskAction(selectedArchiveVersion, 'GO_SOURCES')}>
                    去数据来源整理材料
                  </Button>
                </>
              ) : null}
              {selectedVersionStatus === 'SUPPLEMENT_REQUIRED' ? (
                <Button type="primary" onClick={() => handleApprovalTaskAction(selectedArchiveVersion, 'GO_SOURCES')}>
                  去数据来源继续补证
                </Button>
              ) : null}
              {canNavigateToTeacherEvaluation && selectedArchiveVersion.evaluationRecordId ? (
                <Button onClick={() => handleApprovalTaskAction(selectedArchiveVersion, 'OPEN_TEACHER_EVALUATION')}>
                  打开教师评价实例
                </Button>
              ) : null}
            </Space>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前未选择周期" />
        )}
      </Card>
      <div className="profile-archive-grid profile-archive-grid-evaluation-summary">
        <Card variant="borderless" className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>当前周期审批信息</span>
            <Space wrap>
              <Tag color="blue">{selectedArchiveVersion?.periodLabel || '-'}</Tag>
              <Tag color={selectedVersionStatusColor}>{selectedVersionStatusLabel}</Tag>
              {canNavigateToTeacherEvaluation && selectedArchiveVersion?.evaluationRecordId ? (
                <Button size="small" onClick={() => openTeacherEvaluationRecord(selectedArchiveVersion)}>
                  打开教师评价实例
                </Button>
              ) : null}
            </Space>
          </div>
          <div className="profile-archive-evaluation-summary-card">
            <div className="profile-archive-evaluation-summary-copy">
              <strong>{selectedVersionStatusLabel}</strong>
              <p>{selectedVersionApprovalSummary}</p>
            </div>
            <div className="profile-archive-evaluation-highlight-grid">
              <div className="profile-archive-evaluation-highlight-item">
                <span>提交时间</span>
                <strong>{formatDateTimeText(selectedArchiveVersion?.submittedAt)}</strong>
                <em>{selectedArchiveVersion?.submittedAt ? '已进入正式流程留痕' : '当前仍未正式提交审批'}</em>
              </div>
              <div className="profile-archive-evaluation-highlight-item">
                <span>当前节点</span>
                <strong>{selectedArchiveVersion?.currentNodeName || '尚未进入审批'}</strong>
                <em>{selectedArchiveVersion?.schemeName || '未绑定评价方案'}</em>
              </div>
              <div className="profile-archive-evaluation-highlight-item">
                <span>审批意见</span>
                <strong>{selectedVersionReviewOpinions.length} 条</strong>
                <em>{selectedVersionReviewOpinions[0]?.stageName || '当前暂无审批意见'}</em>
              </div>
              <div className="profile-archive-evaluation-highlight-item">
                <span>最终结论</span>
                <strong>{selectedArchiveVersion?.finalDecision?.decisionLabel || (selectedArchiveVersion?.appeal ? '申诉处理中' : '待形成')}</strong>
                <em>{selectedArchiveVersion?.finalDecision?.summary || (selectedArchiveVersion?.appeal ? `当前申诉状态：${selectedArchiveVersion.appeal.status || '-'}` : '审批完成后会在此沉淀结论')}</em>
              </div>
            </div>
            {selectedArchiveVersion ? renderArchiveVersionActions(selectedArchiveVersion) : null}
          </div>
        </Card>
        <Card variant="borderless" className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>审批留痕</span>
            <Tag color="green">{selectedVersionReviewOpinions.length + (selectedArchiveVersion?.finalDecision ? 1 : 0) + (selectedArchiveVersion?.appeal ? 1 : 0)} 条记录</Tag>
          </div>
          {selectedVersionReviewOpinions.length || selectedArchiveVersion?.finalDecision || selectedArchiveVersion?.appeal ? (
            <div className="profile-archive-approval-log">
              {selectedArchiveVersion?.finalDecision ? (
                <div className="profile-archive-approval-log-item">
                  <div className="profile-archive-approval-log-top">
                    <strong>最终结论</strong>
                    <Tag color={selectedVersionStatusColor}>{selectedArchiveVersion.finalDecision.decisionLabel || selectedVersionStatusLabel}</Tag>
                  </div>
                  <span>{formatDateTimeText(selectedArchiveVersion.finalDecision.recordedAt || selectedArchiveVersion.updatedAt)}</span>
                  <p>{selectedArchiveVersion.finalDecision.summary || '已形成正式结论。'}</p>
                </div>
              ) : null}
              {selectedArchiveVersion?.appeal ? (
                <div className="profile-archive-approval-log-item">
                  <div className="profile-archive-approval-log-top">
                    <strong>申诉记录</strong>
                    <Tag color="processing">{selectedArchiveVersion.appeal.status || '申诉处理中'}</Tag>
                  </div>
                  <span>{formatDateTimeText(selectedArchiveVersion.appeal.submittedAt || selectedArchiveVersion.updatedAt)}</span>
                  <p>{selectedArchiveVersion.appeal.summary || '当前周期已进入申诉或复核流程。'}</p>
                </div>
              ) : null}
              {selectedVersionReviewOpinions.map((opinion) => (
                <div key={opinion.id || `${opinion.stageKey}_${opinion.reviewedAt}`} className="profile-archive-approval-log-item">
                  <div className="profile-archive-approval-log-top">
                    <strong>{opinion.stageName || opinion.reviewerRole || '审批意见'}</strong>
                    <Tag>{opinion.resultLabel || opinion.result || '已记录'}</Tag>
                  </div>
                  <span>{formatDateTimeText(opinion.reviewedAt || opinion.createdAt)}</span>
                  <p>{opinion.comment || '当前节点已记录审批意见。'}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前周期暂无审批留痕" />
          )}
        </Card>
      </div>
    </div>
  );

  const analysisSection = (
    <div className="profile-archive-analysis-section">
      <Card variant="borderless" className="profile-archive-panel">
        <div className="profile-archive-panel-head">
          <div className="profile-archive-history-head">
            <strong>周期分析</strong>
            <span>按最近多个周期对比各能力项的证据覆盖变化，帮助教师识别持续成长、平稳积累和需要优先补强的能力项。</span>
            <span>{analysisLatestHint}</span>
          </div>
          <Space wrap>
            <Tag color="blue">{compareVersions.length} 个对比周期</Tag>
            <Tag color="green">{versionComparisonSummary.visibleItemCount} 个能力项</Tag>
          </Space>
        </div>

        <div className="profile-archive-analysis-toolbar">
          <Segmented
            value={analysisCompareCount}
            onChange={setAnalysisCompareCount}
            options={analysisCompareCountOptions}
          />
          <Select
            value={analysisDimensionFilter}
            onChange={setAnalysisDimensionFilter}
            options={analysisDimensionOptions}
            style={{ minWidth: 180 }}
          />
          <Segmented
            value={analysisTrendFilter}
            onChange={setAnalysisTrendFilter}
            options={[
              { label: '全部趋势', value: 'ALL' },
              { label: '持续提升', value: 'UP' },
              { label: '需要关注', value: 'DOWN' },
              { label: '基本持平', value: 'STEADY' },
            ]}
          />
          <Select
            value={analysisSortMode}
            onChange={setAnalysisSortMode}
            style={{ minWidth: 160 }}
            options={[
              { label: '按变化幅度排序', value: 'DELTA' },
              { label: '按当前覆盖度排序', value: 'LATEST' },
              { label: '按能力项名称排序', value: 'NAME' },
            ]}
          />
          <Input
            allowClear
            value={analysisSearch}
            onChange={(event) => setAnalysisSearch(event.target.value)}
            placeholder="搜索能力项或能力类"
            className="profile-archive-analysis-search"
          />
        </div>
      </Card>

      {compareVersions.length >= 2 ? (
        <div className="profile-archive-analysis-layout">
          <div className="profile-archive-analysis-main">
            <div className="profile-archive-overview-strip">
              <div className="profile-archive-overview-chip">
                <span>对比周期</span>
                <strong>{versionComparisonSummary.comparedVersionCount} 个</strong>
                <em>按最近更新顺序比较能力项变化</em>
              </div>
              <div className="profile-archive-overview-chip">
                <span>明显提升</span>
                <strong>{versionComparisonSummary.improvedCount} 项</strong>
                <em>覆盖度提升 8% 及以上</em>
              </div>
              <div className="profile-archive-overview-chip">
                <span>需要关注</span>
                <strong>{versionComparisonSummary.regressedCount} 项</strong>
                <em>覆盖度回落 8% 及以上</em>
              </div>
              <div className="profile-archive-overview-chip">
                <span>最明显成长项</span>
                <strong>{versionComparisonSummary.strongestGrowthItem?.name || '暂无'}</strong>
                <em>{versionComparisonSummary.strongestGrowthItem ? `${versionComparisonSummary.strongestGrowthItem.trendLabel} · 当前 ${versionComparisonSummary.strongestGrowthItem.latestCoverage}%` : '需要至少两个周期后才能形成趋势'}</em>
              </div>
            </div>

            <Card variant="borderless" className="profile-archive-panel">
              <div className="profile-archive-panel-head">
                <div className="profile-archive-history-head">
                  <strong>周期轨迹</strong>
                  <span>点击任一能力项后，右侧会给出该能力项的细化趋势和建议。</span>
                </div>
                <div className="profile-archive-compare-legend">
                  {compareVersions.map((version) => (
                    <Tag key={version.id} color={getEvaluationStatusColor(version.versionStatus || version.status)}>
                      {version.periodLabel || '-'}
                    </Tag>
                  ))}
                </div>
              </div>

              {filteredVersionComparisonSections.length ? (
                <div className="profile-archive-analysis-section-list">
                  {filteredVersionComparisonSections.map((section) => (
                    <div key={section.key} className="profile-archive-analysis-group">
                      <div className="profile-archive-panel-head">
                        <div className="profile-archive-evaluation-period-head">
                          <strong>{section.name}</strong>
                          <span>{section.description || '按周期查看该能力类下各能力项的证据覆盖变化。'}</span>
                        </div>
                        <Space wrap>
                          <Tag color="blue">{section.items.length} 个能力项</Tag>
                          <Tag color="success">{section.improvedCount} 项提升</Tag>
                          <Tag color="error">{section.regressedCount} 项关注</Tag>
                        </Space>
                      </div>
                      <div className="profile-archive-analysis-item-list">
                        {section.items.map((item) => {
                          const trendMeta = getTrendMeta(item.trendTone);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`profile-archive-analysis-item${focusedAnalysisItem?.id === item.id ? ' is-active' : ''}`}
                              onClick={() => setSelectedAnalysisItemId(item.id)}
                            >
                              <div className="profile-archive-analysis-item-head">
                                <div className="profile-archive-analysis-item-copy">
                                  <strong>{item.name}</strong>
                                  <span>{item.description || '未填写能力项说明'}</span>
                                </div>
                                <Space wrap>
                                  <Tag color={trendMeta.color}>{trendMeta.label}</Tag>
                                  <Tag>{item.trendLabel}</Tag>
                                  <Tag color="blue">当前 {item.latestCoverage}%</Tag>
                                </Space>
                              </div>
                              <div className="profile-archive-analysis-track">
                                {item.cells.map((cell) => (
                                  <div key={`${item.id}_${cell.versionId}`} className="profile-archive-analysis-track-cell">
                                    <span>{cell.periodLabel}</span>
                                    <div className="profile-archive-analysis-track-bar">
                                      <i
                                        style={{
                                          width: `${Math.max(8, cell.coverage)}%`,
                                          background: getCoverageBarColor(cell.coverage),
                                        }}
                                      />
                                    </div>
                                    <strong>{cell.coverage}%</strong>
                                    <em>{cell.evidenceCount} 条材料</em>
                                  </div>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选条件下没有匹配的能力项" />
              )}
            </Card>
          </div>

          <Card variant="borderless" className="profile-archive-panel profile-archive-analysis-focus-panel">
            <div className="profile-archive-panel-head">
              <div className="profile-archive-history-head">
                <strong>重点观察项</strong>
                <span>围绕当前选中的能力项查看周期细节和后续建议。</span>
              </div>
              {focusedAnalysisItem ? <Tag color={getTrendMeta(focusedAnalysisItem.trendTone).color}>{getTrendMeta(focusedAnalysisItem.trendTone).label}</Tag> : null}
            </div>

            {focusedAnalysisItem ? (
              <div className="profile-archive-analysis-focus-body">
                <div className="profile-archive-analysis-focus-summary">
                  <strong>{focusedAnalysisItem.name}</strong>
                  <p>{focusedAnalysisItem.description || '该能力项当前尚未填写额外说明。'}</p>
                  <div className="profile-archive-record-tags">
                    <Tag color="blue">{focusedAnalysisItem.dimensionName}</Tag>
                    <Tag>{focusedAnalysisItem.trendLabel}</Tag>
                    <Tag color="geekblue">当前 {focusedAnalysisItem.latestCoverage}%</Tag>
                  </div>
                </div>

                <div className="profile-archive-analysis-focus-metrics">
                  <div className="profile-archive-analysis-focus-metric">
                    <span>起点覆盖</span>
                    <strong>{focusedAnalysisItem.earliestCoverage}%</strong>
                    <em>{compareVersions[compareVersions.length - 1]?.periodLabel || '-'}</em>
                  </div>
                  <div className="profile-archive-analysis-focus-metric">
                    <span>当前覆盖</span>
                    <strong>{focusedAnalysisItem.latestCoverage}%</strong>
                    <em>{compareVersions[0]?.periodLabel || '-'}</em>
                  </div>
                  <div className="profile-archive-analysis-focus-metric">
                    <span>变化幅度</span>
                    <strong>{focusedAnalysisItem.trendLabel}</strong>
                    <em>{focusedAnalysisItem.delta >= 0 ? '整体继续走强' : '当前较早期有所回落'}</em>
                  </div>
                </div>

                <div className="profile-archive-analysis-focus-timeline">
                  {focusedAnalysisItem.cells.map((cell) => (
                    <div key={`${focusedAnalysisItem.id}_${cell.versionId}`} className="profile-archive-analysis-focus-step">
                      <div className="profile-archive-analysis-focus-step-top">
                        <strong>{cell.periodLabel}</strong>
                        <Tag color={cell.statusColor}>{cell.statusLabel}</Tag>
                      </div>
                      <span>{cell.coverage}% 覆盖 · {cell.evidenceCount} 条材料</span>
                      <em>{cell.sourceLabel || '暂无显著来源'}{cell.latestEvidenceTitle ? ` · ${cell.latestEvidenceTitle}` : ''}</em>
                    </div>
                  ))}
                </div>

                <div className="profile-archive-analysis-focus-note">
                  <strong>建议动作</strong>
                  <p>{focusedAnalysisSuggestion}</p>
                </div>
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先从左侧选择一个能力项" />
            )}
          </Card>
        </div>
      ) : (
        <Card variant="borderless" className="profile-archive-panel">
          <Empty description="至少需要两个档案周期，才能形成能力项的跨周期对比分析" />
        </Card>
      )}
    </div>
  );

  return (
    <div className="sys-module my-profile-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">我的档案</span>
          <span className="sys-module-header-subtitle">围绕当前周期整理证据映射、数据来源和审批信息，并通过周期分析持续观察能力成长。</span>
        </div>
        <Space>
          <Button type="primary" onClick={() => setVersionDrawerOpen(true)}>
            周期切换
          </Button>
          <Segmented
            value={workspaceView}
            onChange={setWorkspaceView}
            options={[
              { label: '当前周期', value: 'CURRENT' },
              { label: '周期分析', value: 'ANALYSIS' },
            ]}
          />
          <Popover
            trigger="click"
            placement="bottomRight"
            open={todoPopoverOpen}
            onOpenChange={setTodoPopoverOpen}
            content={renderTodoPopoverContent()}
            overlayClassName="profile-archive-todo-popover-overlay"
          >
            <Badge count={todoCount} size="small">
              <Button icon={<BellOutlined />} aria-label="查看我的待办任务" />
            </Badge>
          </Popover>
        </Space>
      </div>

      <div className="sys-module-body profile-archive-body">
        {workspaceView === 'CURRENT' ? (
          <div className="profile-archive-workbench">
            <section className="profile-archive-workspace">
              <Card variant="borderless" className="profile-archive-panel profile-archive-version-context">
                <div className="profile-archive-version-context-top">
                  <div className="profile-archive-version-context-copy">
                    <div className="profile-archive-kicker">{snapshot.profile.industryName} · {snapshot.profile.sequenceName}</div>
                    <strong>{selectedArchiveVersion ? `${selectedArchiveVersion.periodLabel || '-'} · ${selectedArchiveVersion.schemeName || '未绑定评价方案'}` : '当前未选择周期'}</strong>
                    <p>{selectedArchiveVersion?.applicationNote || selectedVersionApprovalSummary}</p>
                  </div>
                  <div className="profile-archive-version-context-side">
                    <Space wrap>
                      <Tag color="blue">{snapshot.profile.roleName}</Tag>
                      <Tag color="geekblue">{snapshot.profile.roleLevelName}</Tag>
                      <Tag color={selectedVersionStatusColor}>{selectedVersionStatusLabel}</Tag>
                    </Space>
                    {selectedArchiveVersion ? renderArchiveVersionActions(selectedArchiveVersion) : null}
                  </div>
                </div>
                <div className="profile-archive-version-context-stats">
                  {selectedVersionHeaderStats.map((item) => (
                    <div key={item.label} className="profile-archive-version-context-stat">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <em>{item.hint}</em>
                    </div>
                  ))}
                </div>
              </Card>

              <Tabs
                activeKey={activeArchiveTab}
                onChange={setActiveArchiveTab}
                items={[
                  { key: 'overview', label: '周期总览', children: overviewTab },
                  { key: 'mapping', label: '证据映射', children: mappingTab },
                  { key: 'sources', label: '数据来源', children: sourcesTab },
                  { key: 'approval', label: '审批信息', children: approvalTab },
                ]}
              />
            </section>
          </div>
        ) : analysisSection}
      </div>

      <GrowthRecordDetailDrawer
        growthRecord={selectedGrowthRecord}
        open={growthRecordDrawerOpen}
        onClose={() => setGrowthRecordDrawerOpen(false)}
      />

      <Drawer
        title="周期与草稿"
        width={440}
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        className="profile-archive-version-drawer"
        extra={(
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => {
              setVersionDrawerOpen(false);
              openDirectSubmitModal();
            }}
            disabled={!directSubmitSchemes.length}
          >
            新建草稿周期
          </Button>
        )}
      >
        <div className="profile-archive-version-drawer-body">
          <div className="profile-archive-history-head">
            <strong>周期切换</strong>
            <span>先切换要查看的周期，当前周期工作台和周期分析都会同步更新；新建草稿周期也统一从这里发起。</span>
          </div>
          <Segmented
            value={archiveVersionFilter}
            onChange={setArchiveVersionFilter}
            block
            options={[
              { label: '全部', value: 'ALL' },
              { label: '当前', value: 'CURRENT' },
              { label: '草稿周期', value: 'DRAFT' },
              { label: '审批中', value: 'REVIEW' },
              { label: '历史', value: 'HISTORY' },
            ]}
          />
          {filteredArchiveVersions.length ? (
            <div className="profile-archive-version-switcher-list is-drawer">
              {filteredArchiveVersions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  className={`profile-archive-version-switcher-item${selectedArchiveVersionId === version.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setSelectedArchiveVersionId(version.id);
                    setVersionDrawerOpen(false);
                  }}
                >
                  <div>
                    <strong>{version.periodLabel || '-'}</strong>
                    <span>{version.schemeName || '未绑定评价方案'}</span>
                  </div>
                  <div className="profile-archive-version-switcher-meta">
                    <Tag color={getEvaluationStatusColor(version.versionStatus || version.status)}>{getTeacherEvaluationStatusLabel(version.versionStatus || version.status)}</Tag>
                    <span>{version.snapshot?.summary?.totalEvidenceCount || 0} 条材料</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有可切换的档案周期" />
          )}
          <div className="profile-archive-version-drawer-summary">
            <div className="profile-archive-history-head">
              <strong>档案总览</strong>
              <span>用于快速了解当前模型和周期规模。</span>
            </div>
            <div className="profile-archive-rail-summary-list">
              <div>
                <span>当前模型</span>
                <strong>{snapshot.currentModel.name}</strong>
              </div>
              <div>
                <span>总体覆盖度</span>
                <strong>{snapshot.summary.overallCoverage}%</strong>
              </div>
              <div>
                <span>证据充分项</span>
                <strong>{snapshot.summary.strongItemCount}</strong>
              </div>
              <div>
                <span>待补证项</span>
                <strong>{snapshot.summary.focusItemCount}</strong>
              </div>
              <div>
                <span>可分析周期</span>
                <strong>{snapshot.evaluationSummary?.periodCount || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        title="新建草稿周期"
        open={directSubmitOpen}
        onCancel={() => {
          setDirectSubmitOpen(false);
          directSubmitForm.resetFields();
        }}
        onOk={() => directSubmitForm.submit()}
        okText="保存为草稿"
        cancelText="取消"
        confirmLoading={directSubmitSubmitting}
        okButtonProps={{ disabled: !directSubmitSchemes.length }}
        destroyOnClose
      >
        {directSubmitSchemes.length ? (
          <Form
            layout="vertical"
            form={directSubmitForm}
            onFinish={handleDirectSubmit}
            preserve={false}
          >
            <Form.Item label="评价方案" name="schemeId" rules={[{ required: true, message: '请选择评价方案' }]}>
              <Select
                options={directSubmitSchemes.map((item) => ({
                  label: `${item.name} · ${item.targetLevel}`,
                  value: item.id,
                }))}
                placeholder="选择当前周期要发起的评价方案"
                onChange={(value) => {
                  const targetScheme = directSubmitSchemes.find((item) => item.id === value);
                  if (targetScheme) {
                    directSubmitForm.setFieldValue('scenarioLabel', targetScheme.schemeType || '正式评价');
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="初始化方式" name="creationMode">
              <Segmented
                options={[
                  { label: '带入上个周期', value: 'INHERIT_LATEST' },
                  { label: '完全新建', value: 'BLANK' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="新周期"
              name="periodLabel"
              rules={[
                { required: true, message: '请输入新周期名称' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const schemeId = getFieldValue('schemeId');
                    const normalizedValue = String(value || '').trim();
                    if (!schemeId || !normalizedValue) {
                      return Promise.resolve();
                    }
                    const openPeriods = currentTeacherOpenPeriodsByScheme.get(schemeId) || new Set();
                    if (openPeriods.has(normalizedValue)) {
                      return Promise.reject(new Error('该周期下已有进行中的评价实例，请更换周期名称或先完成当前实例'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input placeholder="例如：2026 秋季学期" />
            </Form.Item>
            <Form.Item label="用途标签" name="scenarioLabel">
              <Input placeholder="例如：双师型认定 / 年度考核 / 成长诊断" />
            </Form.Item>
            <Form.Item label="提交说明" name="applicationNote">
              <TextArea rows={4} placeholder="补充说明本周期重点关注的能力项、补证背景或成长目标。" />
            </Form.Item>
            <div className="profile-archive-direct-submit-section">
              <div className="profile-archive-direct-submit-section-head">
                <strong>周期初始化说明</strong>
                <span>草稿建成后，可在“数据来源”中导入资料库材料，再由 AI 生成映射建议。</span>
              </div>
              <div className="profile-archive-direct-submit-note">
                <span>带入上个周期：继承上一个周期的证据映射与数据来源，适合新周期延续整理。</span>
                <span>完全新建：生成空白草稿周期，后续从资料库重新导入并确认映射。</span>
              </div>
            </div>
            <div className="profile-archive-direct-submit-note">
              <strong>{currentTeacherProfile.name}</strong>
              <span>{currentTeacherProfile.departmentName} · {currentTeacherProfile.targetLevel}</span>
              <span>{selectedDirectSubmitScheme ? `将按「${selectedDirectSubmitScheme.name}」先创建草稿周期，后续可在数据来源中导入资料，并用 AI 建议辅助证据映射。` : '请选择评价方案后继续。'}</span>
              {selectedSchemeOpenPeriods.length ? (
                <span>当前方案下仍在推进的周期：{selectedSchemeOpenPeriods.join('、')}</span>
              ) : (
                <span>当前方案下暂无进行中的周期实例，可直接创建新周期草稿。</span>
              )}
            </div>
          </Form>
        ) : (
          <Empty description="当前没有可直接发起的评价方案" />
        )}
      </Modal>

      <Modal
        title="从资料库导入到当前周期"
        open={resourceImportOpen}
        onCancel={() => {
          setResourceImportOpen(false);
          setResourceImportSelection([]);
        }}
        onOk={handleImportVersionResources}
        okText="导入到当前周期"
        cancelText="取消"
        confirmLoading={resourceImportLoading}
        okButtonProps={{ disabled: !resourceImportSelection.length }}
        width={920}
      >
        <Table
          rowKey="importKey"
          size="small"
          pagination={{ pageSize: 6, showSizeChanger: false }}
          rowSelection={{
            selectedRowKeys: resourceImportSelection,
            onChange: (keys) => setResourceImportSelection(keys),
          }}
          columns={[
            { title: '资料', dataIndex: 'name', key: 'name', render: (_, record) => <div className="profile-archive-resource-import-name"><strong>{record.name}</strong><span>{record.resourcePath}</span></div> },
            { title: '资料库', dataIndex: 'libraryName', key: 'libraryName', width: 120 },
            { title: '建议来源', dataIndex: 'sourceLabel', key: 'sourceLabel', width: 120, render: (value, record) => <Tag color={SOURCE_META[record.sourceKey]?.color}>{value}</Tag> },
            { title: '解析状态', dataIndex: 'parseStatus', key: 'parseStatus', width: 100, render: (value) => <Tag>{RESOURCE_PARSE_STATUS_LABELS[value] || value}</Tag> },
            { title: '最近时间', dataIndex: 'lastOpenedAt', key: 'lastOpenedAt', width: 150, render: (_, record) => record.lastOpenedAt || record.lastEdit || '-' },
          ]}
          dataSource={resourceLibraryItems}
        />
      </Modal>
    </div>
  );
}
