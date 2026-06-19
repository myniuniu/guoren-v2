import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Progress,
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { capabilityModelApi } from '../capabilityModel/api';
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
import '../system/SystemModule.css';
import '../shared/profileEvidence.css';
import './MyProfileModule.css';

const PROFILE_BASE = {
  name: '林知夏',
  roleTitle: '语文教师',
  schoolName: '海右实验学校',
  departmentName: '初中语文教研组',
  tenureLabel: '入职第 5 年',
  portraitTag: '青年教师',
  growthHint: '当前处于“夯实课堂实施 + 强化学习评价”阶段',
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

function buildCoverageStatus(score) {
  if (score >= 86) {
    return { label: '已形成优势', color: 'success' };
  }
  if (score >= 72) {
    return { label: '基本匹配', color: 'processing' };
  }
  return { label: '待补强', color: 'warning' };
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
  return `近 ${historyRecords.length} 条资料，匹配度从 ${earliestRecord.coverage}% ${direction}到 ${latestRecord.coverage}%。`;
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

export default function MyProfileModule() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [mappingView, setMappingView] = useState('table');
  const [activeMatrixAnchor, setActiveMatrixAnchor] = useState(undefined);
  const [growthRecordDrawerOpen, setGrowthRecordDrawerOpen] = useState(false);
  const [selectedGrowthRecord, setSelectedGrowthRecord] = useState(null);
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

  async function loadData(withLoading = true) {
    if (withLoading) setLoading(true);
    try {
      await Promise.all([
        capabilityModelApi.seed(),
        sceneApi.seed(),
      ]);
      const [industries, sequences, roles, models] = await Promise.all([
        capabilityModelApi.listIndustries(),
        capabilityModelApi.listSequences(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listModels(),
      ]);
      const currentModel = pickCurrentTeacherModel(models, roles, sequences);
      const baseSnapshot = buildModelGrowthRecordSnapshot(currentModel, industries, roles, sequences);
      const resourceLibData = loadResourceLib();
      const resourceAwareSnapshot = buildResourceLibrarySourceSnapshot(baseSnapshot, resourceLibData);
      const scenes = await sceneApi.listScenes();
      const archivedSceneRecords = listArchivedSceneGrowthRecords(scenes, resourceAwareSnapshot?.modelDefinition);
      const sceneAwareSnapshot = mergeSceneArchivedRecordSnapshot(resourceAwareSnapshot, archivedSceneRecords);
      const nextSnapshot = sceneAwareSnapshot ? {
        ...sceneAwareSnapshot,
        profile: {
          ...PROFILE_BASE,
          ...sceneAwareSnapshot.context,
        },
      } : null;
      setSnapshot(nextSnapshot);
      if (selectedGrowthRecord?.id && nextSnapshot?.evidenceById?.[selectedGrowthRecord.id]) {
        setSelectedGrowthRecord(resolveGrowthRecordFromSnapshot(nextSnapshot, selectedGrowthRecord.id, selectedGrowthRecord));
      }
    } finally {
      if (withLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resolveMappingRowGrowthRecord(record) {
    return resolveGrowthRecordFromSnapshot(snapshot, record.evidenceId, {
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
        return (
          <div className="profile-archive-item-cell">
            <button
              type="button"
              className="profile-archive-record-link"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openGrowthRecordDetail(record.evidenceId, snapshot, {
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
      title: '匹配度',
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

  function openCellGrowthRecord(item, level, cellRecord) {
    const growthRecord = resolveGrowthRecordFromSnapshot(snapshot, cellRecord?.evidenceId, {
      focusDimensionName: cellRecord?.dimensionName || '-',
      focusItemName: item.name,
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
        <Card bordered={false} className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>当前序列画像</span>
            <Tag color="blue">{snapshot.profile.portraitTag}</Tag>
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
            <div><span>当前能力序列</span><strong>{snapshot.profile.sequenceName}</strong></div>
            <div><span>当前模型</span><strong>{snapshot.currentModel.name}</strong></div>
            <div><span>模型编码</span><strong>{snapshot.currentModel.code}</strong></div>
            <div><span>成长判断</span><strong>{snapshot.profile.growthHint}</strong></div>
          </div>
        </Card>

        <Card bordered={false} className="profile-archive-panel">
          <div className="profile-archive-panel-head">
            <span>维度匹配概览</span>
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

      <div className="profile-archive-grid profile-archive-grid-sources">
        {snapshot.sourceStats.map((item) => (
          <Card key={item.key} bordered={false} className="profile-archive-source-card">
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
              <div><span>平均匹配度</span><strong>{item.averageScore}%</strong></div>
              <div><span>记录条数</span><strong>{item.evidenceCount}</strong></div>
              <div>
                <span>最近记录</span>
                <button
                  type="button"
                  className="profile-archive-inline-link"
                  onClick={() => openGrowthRecordDetail(item.latestRecord.id)}
                >
                  {item.latestRecord.title}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const mappingTab = (
    <div className="profile-archive-tab">
      <Card bordered={false} className="profile-archive-panel">
        <div className="profile-archive-panel-head">
          <div className="profile-archive-panel-head-main">
            <Space wrap>
              <Tag color="blue">当前模型 {snapshot.currentModel.itemCount} 项</Tag>
              <Tag color="green">已形成优势 {snapshot.summary.strongItemCount} 项</Tag>
              <Tag color="warning">待补强 {snapshot.summary.focusItemCount} 项</Tag>
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
                    <thead>
                      <tr>
                        <th>能力项</th>
                        {(modelDefinition?.levelScheme?.levels || []).map((level) => (
                          <th key={level.key}>{level.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dimension.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="profile-archive-matrix-item">{item.name}</div>
                            <div className="profile-archive-matrix-desc">{item.description || '未填写能力项说明'}</div>
                            {item.evidenceExamples?.length ? (
                              <div className="profile-archive-matrix-record">
                                成长记录示例：{item.evidenceExamples.join('、')}
                              </div>
                            ) : null}
                          </td>
                          {item.cellMappings.map(({ level, descriptor, growthRecord }) => (
                            <td key={`${item.id}_${level.key}`}>
                              <div className="profile-archive-matrix-cell">
                                <div className="profile-archive-matrix-cell-text">{descriptor.text || '-'}</div>
                                {growthRecord ? (
                                  <button
                                    type="button"
                                    className="profile-archive-matrix-record-card"
                                    onClick={() => openCellGrowthRecord(item, level, growthRecord)}
                                  >
                                    <div className="profile-archive-matrix-record-head">
                                      <Tag color={SOURCE_META[growthRecord.sourceKey].color}>{growthRecord.sourceLabel}</Tag>
                                      <span>{growthRecord.coverage}% 匹配</span>
                                    </div>
                                    <strong>{growthRecord.evidenceTitle}</strong>
                                    <span>{growthRecord.evidenceDate} · {growthRecord.evidenceTag}</span>
                                  </button>
                                ) : (
                                  <div className="profile-archive-matrix-record-empty">暂无映射记录</div>
                                )}
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
      <div className="profile-archive-grid profile-archive-grid-sources-detail">
        {Object.entries(snapshot.recordsBySource).map(([key, records]) => (
          <Card key={key} bordered={false} className="profile-archive-panel">
            <div className="profile-archive-panel-head">
              <Space>
                <span>{SOURCE_META[key].label}</span>
                <Tag color={SOURCE_META[key].color}>{records.length} 条记录</Tag>
              </Space>
              <Tag>{snapshot.sourceStats.find((item) => item.key === key)?.averageScore || 0}% 匹配</Tag>
            </div>
            <div className="profile-archive-record-list">
              {records.map((record) => (
                <div key={record.id} className="profile-archive-record-item">
                  <div className="profile-archive-record-top">
                    <strong>{record.title}</strong>
                    <span>{record.date}</span>
                  </div>
                  <div className="profile-archive-record-tags">
                    <Tag>{record.tag}</Tag>
                    <Tag color={record.statusColor}>{record.linkedItemCount} 个能力项</Tag>
                  </div>
                  <p>{record.summary}</p>
                  <div className="profile-archive-record-foot">
                    <span>来源路径：{record.resourcePath || record.matchNote}</span>
                    <Button type="link" size="small" onClick={() => openGrowthRecordDetail(record.id)}>查看详情</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sys-module my-profile-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">我的档案</span>
          <span className="sys-module-header-subtitle">查看当前序列模型与教学、档案、培训研修、教研数据的成长记录映射情况</span>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => loadData(false)}>刷新画像</Button>
      </div>

      <div className="sys-module-body profile-archive-body">
        <div className="profile-archive-hero">
          <div className="profile-archive-hero-main">
            <div className="profile-archive-kicker">{snapshot.profile.industryName} · {snapshot.profile.sequenceName}</div>
            <h2>{snapshot.currentModel.name}</h2>
            <p>{snapshot.currentModel.description || '当前序列模型已与个人多来源成长记录建立映射。'}</p>
            <div className="profile-archive-hero-tags">
              <Tag color="blue">{snapshot.profile.roleName}</Tag>
              <Tag color="geekblue">{snapshot.profile.roleLevelName}</Tag>
              <Tag color="purple">{snapshot.currentModel.dimensionCount} 个能力类</Tag>
              <Tag color="green">{snapshot.currentModel.itemCount} 个能力项</Tag>
            </div>
          </div>
          <div className="profile-archive-hero-stats">
            <div className="profile-archive-stat-card">
              <span>总体匹配度</span>
              <strong>{snapshot.summary.overallCoverage}%</strong>
            </div>
            <div className="profile-archive-stat-card">
              <span>优势能力项</span>
              <strong>{snapshot.summary.strongItemCount}</strong>
            </div>
            <div className="profile-archive-stat-card">
              <span>待补强能力项</span>
              <strong>{snapshot.summary.focusItemCount}</strong>
            </div>
            <div className="profile-archive-stat-card">
              <span>累计记录</span>
              <strong>{snapshot.summary.totalEvidenceCount}</strong>
            </div>
          </div>
        </div>

        <Tabs
          defaultActiveKey="overview"
          items={[
            { key: 'overview', label: '总览', children: overviewTab },
            { key: 'mapping', label: '模型映射', children: mappingTab },
            { key: 'sources', label: '数据来源', children: sourcesTab },
          ]}
        />
      </div>

      <GrowthRecordDetailDrawer
        growthRecord={selectedGrowthRecord}
        open={growthRecordDrawerOpen}
        onClose={() => setGrowthRecordDrawerOpen(false)}
      />
    </div>
  );
}
