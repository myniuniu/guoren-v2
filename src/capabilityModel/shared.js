import {
  CAPABILITY_MODEL_STATUS_OPTIONS,
  CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS,
  CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS,
  CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS,
  createCapabilityModelDraft,
  createDefaultLevelScheme,
} from './api';
import {
  getRoleLevel,
  getSequenceForRole,
} from '../shared/profileEvidence';

const EVIDENCE_TYPE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);
const REVIEW_ROLE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS.map((item) => [item.value, item.label]),
);
const AI_ASSIST_MODE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS.map((item) => [item.value, item.label]),
);
const STATUS_LABEL_MAP = Object.fromEntries(
  CAPABILITY_MODEL_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

export const MAX_CAPABILITY_DIMENSION_LEVEL = 3;

export function getCapabilityModelStatusMeta(model) {
  if (!model) {
    return { color: 'default', label: '-' };
  }
  if (model.status === 'DRAFT') {
    return { color: 'processing', label: '草稿' };
  }
  if (model.status === 'DISABLED') {
    return { color: 'default', label: '已停用' };
  }
  if (model.status === 'PUBLISHED' && model.isCurrentVersion) {
    return { color: 'success', label: '生效中' };
  }
  if (model.status === 'PUBLISHED') {
    return { color: 'default', label: '已失效' };
  }
  return { color: 'default', label: model.status || '-' };
}

export function getCapabilityModelVersionLabel(model) {
  const versionNumber = Math.max(1, Number(model?.versionNumber || 1));
  return `版本 ${versionNumber}`;
}

export function cloneCapabilityModelDraft(data) {
  return JSON.parse(JSON.stringify(data || null));
}

function getDimensionParentId(dimension) {
  return dimension?.parentId || null;
}

export function getCapabilityDimensionEntries(dimensions = []) {
  const source = Array.isArray(dimensions) ? dimensions : [];
  const indexById = new Map(source.map((dimension, index) => [dimension.id, index]));
  const childrenByParent = new Map();

  source.forEach((dimension, index) => {
    const parentId = getDimensionParentId(dimension);
    const safeParentId = parentId && indexById.has(parentId) ? parentId : null;
    const list = childrenByParent.get(safeParentId) || [];
    list.push({ dimension, index });
    childrenByParent.set(safeParentId, list);
  });

  childrenByParent.forEach((list) => {
    list.sort((left, right) => (
      Number(left.dimension?.sortNo || left.index + 1) - Number(right.dimension?.sortNo || right.index + 1)
    ));
  });

  const entries = [];
  const visit = (parentId, level, prefix = '') => {
    const children = childrenByParent.get(parentId) || [];
    children.forEach((entry, siblingIndex) => {
      const orderText = prefix ? `${prefix}.${siblingIndex + 1}` : `${siblingIndex + 1}`;
      const normalizedLevel = Math.max(1, Math.min(MAX_CAPABILITY_DIMENSION_LEVEL, level));
      entries.push({
        ...entry,
        level: normalizedLevel,
        parentId,
        orderText,
        childCount: (childrenByParent.get(entry.dimension.id) || []).length,
      });
      if (normalizedLevel < MAX_CAPABILITY_DIMENSION_LEVEL) {
        visit(entry.dimension.id, normalizedLevel + 1, orderText);
      }
    });
  };

  visit(null, 1);
  return entries;
}

function createCapabilityDimensionNodeKey(dimensionId) {
  return `dimension:${dimensionId}`;
}

function createCapabilityItemNodeKey(dimensionId, itemId) {
  return `item:${dimensionId}:${itemId}`;
}

export function getCapabilityFrameworkTreeEntries(modelOrDimensions = []) {
  const dimensions = Array.isArray(modelOrDimensions)
    ? modelOrDimensions
    : (modelOrDimensions?.dimensions || []);
  const dimensionEntries = getCapabilityDimensionEntries(dimensions);
  const entriesByParent = new Map();

  dimensionEntries.forEach((entry) => {
    const parentId = entry.parentId || null;
    const list = entriesByParent.get(parentId) || [];
    list.push(entry);
    entriesByParent.set(parentId, list);
  });

  const result = [];
  const visitDimension = (dimensionEntry, ancestorKeys = []) => {
    const { dimension, index, level, orderText } = dimensionEntry;
    const childDimensions = entriesByParent.get(dimension.id) || [];
    const items = Array.isArray(dimension.items) ? dimension.items : [];
    const isMaxLevel = level >= MAX_CAPABILITY_DIMENSION_LEVEL;
    const absorbedItem = isMaxLevel ? (items[0] || null) : null;
    const dimensionKey = createCapabilityDimensionNodeKey(dimension.id);
    const childCount = childDimensions.length + (isMaxLevel ? 0 : items.length);
    const node = {
      key: dimensionKey,
      nodeType: 'dimension',
      dimension,
      dimensionIndex: index,
      item: absorbedItem,
      itemIndex: absorbedItem ? 0 : -1,
      level,
      parentKey: dimension.parentId ? createCapabilityDimensionNodeKey(dimension.parentId) : null,
      ancestorKeys,
      orderText,
      childCount,
      dimensionChildCount: childDimensions.length,
      itemCount: items.length,
      hasChildren: childCount > 0,
      canAddChildDimension: level < MAX_CAPABILITY_DIMENSION_LEVEL,
      canAddItem: level < MAX_CAPABILITY_DIMENSION_LEVEL,
      canEditRules: Boolean(absorbedItem),
    };
    result.push(node);

    if (isMaxLevel) return;

    const nextAncestors = [...ancestorKeys, dimensionKey];
    childDimensions.forEach((childEntry) => visitDimension(childEntry, nextAncestors));
    items.forEach((item, itemIndex) => {
      result.push({
        key: createCapabilityItemNodeKey(dimension.id, item.id),
        nodeType: 'item',
        dimension,
        dimensionIndex: index,
        item,
        itemIndex,
        level: Math.min(MAX_CAPABILITY_DIMENSION_LEVEL, level + 1),
        parentKey: dimensionKey,
        ancestorKeys: nextAncestors,
        orderText: `${orderText}.${childDimensions.length + itemIndex + 1}`,
        childCount: 0,
        dimensionChildCount: 0,
        itemCount: 0,
        hasChildren: false,
        canAddChildDimension: false,
        canAddItem: false,
        canEditRules: true,
      });
    });
  };

  (entriesByParent.get(null) || []).forEach((entry) => visitDimension(entry));
  return result;
}

export function getCapabilityFrameworkNodeSelection(modelDraft, activeNodeKey) {
  const entries = getCapabilityFrameworkTreeEntries(modelDraft);
  const node = entries.find((entry) => entry.key === activeNodeKey) || entries[0] || null;
  return {
    node,
    entries,
    dimension: node?.dimension || null,
    dimensionIndex: node?.dimensionIndex ?? -1,
    item: node?.item || null,
    itemIndex: node?.itemIndex ?? -1,
  };
}

export function isCapabilityFrameworkConfigNode(node) {
  return Boolean(node?.canEditRules && node?.item);
}

export function getCapabilityDimensionEntry(dimensions = [], dimensionId) {
  if (!dimensionId) return null;
  return getCapabilityDimensionEntries(dimensions).find((entry) => entry.dimension.id === dimensionId) || null;
}

export function getCapabilityDimensionDescendantIds(dimensions = [], dimensionId) {
  if (!dimensionId) return new Set();
  const childrenByParent = new Map();
  (Array.isArray(dimensions) ? dimensions : []).forEach((dimension) => {
    const parentId = getDimensionParentId(dimension);
    if (!parentId) return;
    const list = childrenByParent.get(parentId) || [];
    list.push(dimension);
    childrenByParent.set(parentId, list);
  });

  const result = new Set();
  const visit = (parentId) => {
    (childrenByParent.get(parentId) || []).forEach((child) => {
      if (!child?.id || result.has(child.id)) return;
      result.add(child.id);
      visit(child.id);
    });
  };
  visit(dimensionId);
  return result;
}

export function getCapabilityDimensionInsertIndex(dimensions = [], parentDimensionId = null) {
  const source = Array.isArray(dimensions) ? dimensions : [];
  if (!parentDimensionId) return source.length;
  const descendantIds = getCapabilityDimensionDescendantIds(source, parentDimensionId);
  const parentIndex = source.findIndex((dimension) => dimension.id === parentDimensionId);
  if (parentIndex < 0) return source.length;
  const lastSubtreeIndex = source.reduce((lastIndex, dimension, index) => (
    dimension.id === parentDimensionId || descendantIds.has(dimension.id)
      ? Math.max(lastIndex, index)
      : lastIndex
  ), parentIndex);
  return lastSubtreeIndex + 1;
}

export function removeCapabilityDimensionSubtree(dimensions = [], dimensionId) {
  if (!dimensionId) return Array.isArray(dimensions) ? dimensions : [];
  const removedIds = getCapabilityDimensionDescendantIds(dimensions, dimensionId);
  removedIds.add(dimensionId);
  return (Array.isArray(dimensions) ? dimensions : [])
    .filter((dimension) => !removedIds.has(dimension.id))
    .map((dimension, index) => ({ ...dimension, sortNo: index + 1 }));
}

export function getTotalCapabilityItems(model) {
  return (model?.dimensions || []).reduce(
    (sum, dimension) => sum + (dimension.items?.length || 0),
    0,
  );
}

export function moveCapabilityModelListItem(list, index, delta) {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next.map((current, currentIndex) => ({
    ...current,
    sortNo: currentIndex + 1,
  }));
}

export function syncDimensionsToLevelScheme(dimensions, nextLevelScheme) {
  return (dimensions || []).map((dimension, dimensionIndex) => ({
    ...dimension,
    sortNo: dimensionIndex + 1,
    items: (dimension.items || []).map((item, itemIndex) => ({
      ...item,
      sortNo: itemIndex + 1,
      levelDescriptors: nextLevelScheme.levels.map((level, levelIndex) => ({
        levelKey: level.key,
        text: item.levelDescriptors?.[levelIndex]?.text || '',
      })),
    })),
  }));
}

export function getActiveCapabilityFrameworkSelection(modelDraft, activeDimensionId, activeItemId) {
  const dimensions = modelDraft?.dimensions || [];
  const entries = getCapabilityDimensionEntries(dimensions);
  const matchedEntry = entries.find((entry) => entry.dimension.id === activeDimensionId) || entries[0] || null;
  const safeDimensionIndex = matchedEntry?.index ?? -1;
  const dimension = matchedEntry?.dimension || null;
  const items = dimension?.items || [];
  const itemIndex = items.findIndex((item) => item.id === activeItemId);
  const safeItemIndex = itemIndex >= 0 ? itemIndex : (items.length ? 0 : -1);
  const item = safeItemIndex >= 0 ? items[safeItemIndex] : null;
  return {
    dimension,
    dimensionIndex: safeDimensionIndex,
    dimensionEntry: matchedEntry,
    item,
    itemIndex: safeItemIndex,
  };
}

function escapeMarkdownText(value) {
  return String(value || '-')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br />');
}

export function buildCapabilityModelMarkdown(model, industries, roles, sequences) {
  const industryName = industries.find((item) => item.id === model.industryId)?.name || '-';
  const role = roles.find((item) => item.id === model.roleId);
  const sequence = getSequenceForRole(role, sequences);
  const roleLevelName = getRoleLevel(role, model.roleLevelId, sequences)?.name || '-';
  const statusText = STATUS_LABEL_MAP[model.status] || model.status || '-';
  const lines = [
    `# ${model.name || '未命名能力模型'}`,
    '',
    `- 模型编码：${model.modelCode || '-'}`,
    `- 所属行业：${industryName}`,
    `- 所属岗位：${role?.name || '-'}`,
    `- 能力序列：${sequence?.name || '-'}`,
    `- 序列等级：${roleLevelName}`,
    `- 模型状态：${statusText}`,
    `- 能力类数量：${model.dimensions?.length || 0}`,
    `- 能力项数量：${getTotalCapabilityItems(model)}`,
    model.tags?.length ? `- 标签：${model.tags.join('、')}` : '- 标签：-',
    '',
    '## 模型说明',
    '',
    model.description || '未填写模型说明',
    '',
  ];

  getCapabilityDimensionEntries(model.dimensions).forEach(({ dimension, level, orderText }) => {
    lines.push(`${'#'.repeat(Math.min(6, level + 1))} ${orderText}. ${dimension.name || '未命名能力类'}`);
    lines.push('');
    lines.push(`- 能力类说明：${dimension.description || '未填写能力类说明'}`);
    lines.push(`- 能力类层级：${level}`);
    lines.push(`- 能力项数量：${dimension.items?.length || 0}`);
    lines.push('');

    (dimension.items || []).forEach((item, itemIndex) => {
      lines.push(`${'#'.repeat(Math.min(6, level + 2))} ${orderText}.${itemIndex + 1} ${item.name || '未命名能力项'}`);
      lines.push('');
      lines.push(`- 能力项说明：${item.description || '未填写能力项说明'}`);
      lines.push(`- 证据类型：${item.evidenceTypes?.length ? item.evidenceTypes.map((entry) => EVIDENCE_TYPE_LABEL_MAP[entry] || entry).join('、') : '-'}`);
      lines.push(`- 最低证据数：${item.requiredEvidenceCount || 1}`);
      lines.push(`- 评价主体：${item.requiredReviewRoles?.length ? item.requiredReviewRoles.map((entry) => REVIEW_ROLE_LABEL_MAP[entry] || entry).join('、') : '-'}`);
      lines.push(`- 成长档案专用：${item.isGrowthOnly ? '是' : '否'}`);
      lines.push(`- AI辅助策略：${AI_ASSIST_MODE_LABEL_MAP[item.aiAssistMode] || item.aiAssistMode || '-'}`);
      if (item.evidenceExamples?.length) {
        lines.push('- 成长记录示例：');
        item.evidenceExamples.forEach((example) => {
          lines.push(`  - ${example}`);
        });
      } else {
        lines.push('- 成长记录示例：-');
      }
      lines.push('');
      lines.push('| 等级 | 行为描述 |');
      lines.push('| --- | --- |');
      model.levelScheme?.levels?.forEach((level, levelIndex) => {
        lines.push(`| ${escapeMarkdownText(level.label)} | ${escapeMarkdownText(item.levelDescriptors?.[levelIndex]?.text || '-')} |`);
      });
      lines.push('');
    });
  });

  return lines.join('\n').trim();
}

export function buildCapabilityModelResourceMeta(model, role = null, roleLevel = null) {
  const dimensionEntries = getCapabilityDimensionEntries(model?.dimensions || []);
  const dimensionNames = dimensionEntries.map(({ dimension, orderText }) => `${orderText}. ${dimension.name}`).filter(Boolean);
  const itemCount = getTotalCapabilityItems(model);
  const roleText = [role?.name, roleLevel?.name].filter(Boolean).join(' / ');
  const summary = [
    roleText || '能力模型',
    `${model?.dimensions?.length || 0} 个能力类`,
    `${itemCount} 个能力项`,
  ].join(' · ');

  return {
    summary,
    detail: {
      toc: dimensionNames,
      body: [
        {
          type: 'paragraph',
          text: model?.description || `${model?.name || '当前能力模型'}用于沉淀岗位能力结构、能力分级与证据要求。`,
        },
        {
          type: 'highlight',
          text: summary,
        },
        {
          type: 'heading',
          text: '能力结构',
        },
        {
          type: 'list',
          items: dimensionEntries.map(({ dimension, orderText }) => {
            const itemNames = (dimension.items || []).map((item) => item.name).filter(Boolean);
            return `${orderText}. ${dimension.name || '未命名能力类'}：${itemNames.join('、') || '待补充能力项'}`;
          }),
        },
      ],
    },
  };
}

export function resolveCapabilityModelResourceEntry(item, catalog = {}, options = {}) {
  if (item?.fileType !== 'capabilityModel') {
    return { model: null, role: null, sequence: null, roleLevel: null };
  }

  const overrideModelId = typeof options === 'string'
    ? options
    : (options.overrideModelId || options.modelId || null);
  const models = catalog.models || [];
  const explicitModel = overrideModelId
    ? models.find((entry) => entry.id === overrideModelId) || null
    : null;
  const matchedModel = explicitModel || (
    item.capabilityModelId
      ? models.find((entry) => entry.id === item.capabilityModelId) || null
      : null
  ) || (
    item.capabilityModelCode
      ? models.find((entry) => entry.modelCode === item.capabilityModelCode) || null
      : null
  ) || null;
  const versionSeriesId = item.capabilityModelSeriesId
    || explicitModel?.versionSeriesId
    || explicitModel?.id
    || matchedModel?.versionSeriesId
    || matchedModel?.id
    || null;
  const activeSeriesModel = !explicitModel && versionSeriesId
    ? models.find((entry) => (
      (entry.versionSeriesId || entry.id) === versionSeriesId
      && entry.status === 'PUBLISHED'
      && entry.isCurrentVersion
    )) || null
    : null;
  const model = explicitModel || activeSeriesModel || matchedModel;

  if (!model) {
    return { model: null, role: null, sequence: null, roleLevel: null };
  }

  const roles = catalog.roles || [];
  const sequences = catalog.sequences || [];
  const role = roles.find((entry) => entry.id === model.roleId) || null;
  const sequence = getSequenceForRole(role, sequences);
  const roleLevel = getRoleLevel(role, model.roleLevelId, sequences) || null;

  return {
    model,
    role,
    sequence,
    roleLevel,
  };
}

export function createCapabilityModelCode(name) {
  const normalized = String(name || '')
    .trim()
    .replace(/[^A-Za-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  const prefix = normalized || 'CAPABILITY_MODEL';
  return `${prefix}_${Date.now().toString(36).toUpperCase()}`;
}

export function createCapabilityModelStarterDraft({
  name,
  description = '',
  role,
  roleLevel,
}) {
  return createCapabilityModelDraft({
    modelCode: createCapabilityModelCode(name),
    name,
    description,
    industryId: role?.industryId,
    roleId: role?.id,
    roleLevelId: roleLevel?.id,
    status: 'DRAFT',
    tags: [role?.name, roleLevel?.name].filter(Boolean),
    levelScheme: createDefaultLevelScheme(),
    dimensions: [
      {
        name: '能力结构',
        description: '用于沉淀该模型下的能力类与能力项。',
        items: [
          {
            name: '核心能力项',
            description: '请继续补充该能力项的分级描述、证据要求与示例。',
          },
        ],
      },
    ],
  });
}
