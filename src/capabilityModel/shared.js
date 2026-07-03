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
  const dimensionIndex = dimensions.findIndex((item) => item.id === activeDimensionId);
  const safeDimensionIndex = dimensionIndex >= 0 ? dimensionIndex : (dimensions.length ? 0 : -1);
  const dimension = safeDimensionIndex >= 0 ? dimensions[safeDimensionIndex] : null;
  const items = dimension?.items || [];
  const itemIndex = items.findIndex((item) => item.id === activeItemId);
  const safeItemIndex = itemIndex >= 0 ? itemIndex : (items.length ? 0 : -1);
  const item = safeItemIndex >= 0 ? items[safeItemIndex] : null;
  return {
    dimension,
    dimensionIndex: safeDimensionIndex,
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

  (model.dimensions || []).forEach((dimension, dimensionIndex) => {
    lines.push(`## ${dimensionIndex + 1}. ${dimension.name || '未命名能力类'}`);
    lines.push('');
    lines.push(`- 能力类说明：${dimension.description || '未填写能力类说明'}`);
    lines.push(`- 能力项数量：${dimension.items?.length || 0}`);
    lines.push('');

    (dimension.items || []).forEach((item, itemIndex) => {
      lines.push(`### ${dimensionIndex + 1}.${itemIndex + 1} ${item.name || '未命名能力项'}`);
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
  const dimensionNames = (model?.dimensions || []).map((dimension) => dimension.name).filter(Boolean);
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
          items: (model?.dimensions || []).map((dimension) => {
            const itemNames = (dimension.items || []).map((item) => item.name).filter(Boolean);
            return `${dimension.name || '未命名能力类'}：${itemNames.join('、') || '待补充能力项'}`;
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
