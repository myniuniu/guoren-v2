import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Segmented,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ImportOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  CAPABILITY_MODEL_STATUS_OPTIONS,
  CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS,
  CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS,
  CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS,
  INDUSTRY_STATUS_OPTIONS,
  ROLE_STATUS_OPTIONS,
  capabilityModelApi,
  createCapabilityModelDraft,
  createDefaultLevelScheme,
  createEmptyCapabilityDimension,
  createEmptyCapabilityItem,
} from './api';
import {
  getRoleLevel,
  getSequenceForRole,
} from '../shared/profileEvidence';
import '../system/SystemModule.css';
import './CapabilityModelModule.css';

const { TextArea } = Input;
const EVIDENCE_TYPE_LABEL_MAP = Object.fromEntries(CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS.map((item) => [item.value, item.label]));
const REVIEW_ROLE_LABEL_MAP = Object.fromEntries(CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS.map((item) => [item.value, item.label]));
const AI_ASSIST_MODE_LABEL_MAP = Object.fromEntries(CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS.map((item) => [item.value, item.label]));

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 16);
}

function getErrorMessage(error, fallback = '操作失败') {
  return error?.message || fallback;
}

function renderStatusTag(value) {
  const colorMap = {
    DRAFT: 'processing',
    PUBLISHED: 'success',
    DISABLED: 'default',
    ACTIVE: 'success',
  };
  const labelMap = {
    ...Object.fromEntries(CAPABILITY_MODEL_STATUS_OPTIONS.map((item) => [item.value, item.label])),
    ...Object.fromEntries(INDUSTRY_STATUS_OPTIONS.map((item) => [item.value, item.label])),
  };
  return <Tag color={colorMap[value] || 'default'}>{labelMap[value] || value || '-'}</Tag>;
}

function createIndustryDraft() {
  return {
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    sortNo: 1,
  };
}

function createRoleDraft(industryId) {
  return {
    industryId: industryId || undefined,
    sequenceId: undefined,
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    sortNo: 1,
  };
}

function createSequenceLevelDraft() {
  return {
    name: '',
    code: '',
    description: '',
    sortNo: 1,
  };
}

function createSequenceDraft(industryId) {
  return {
    industryId: industryId || undefined,
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    sortNo: 1,
    levels: [createSequenceLevelDraft()],
  };
}

function cloneDraft(data) {
  return JSON.parse(JSON.stringify(data));
}

function getTotalCapabilityItems(model) {
  return (model?.dimensions || []).reduce((sum, dimension) => sum + (dimension.items?.length || 0), 0);
}

function sortBySortNo(list) {
  return [...list].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0));
}

function moveListItem(list, index, delta) {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next.map((current, currentIndex) => ({ ...current, sortNo: currentIndex + 1 }));
}

function syncDimensionsToLevelScheme(dimensions, nextLevelScheme) {
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

function escapeMarkdownText(value) {
  return String(value || '-')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br />');
}

function unescapeMarkdownText(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\\|/g, '|');
}

function splitMarkdownRow(line) {
  const cells = [];
  let current = '';
  let escaping = false;
  const content = String(line || '').trim().replace(/^\|/, '').replace(/\|$/, '');

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === '\\') {
      escaping = true;
      current += char;
      continue;
    }
    if (char === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells.map((cell) => unescapeMarkdownText(cell));
}

function makeImportedModelCode(baseCode = '') {
  const normalized = String(baseCode || '')
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!normalized) {
    return `IMPORT_${Date.now()}`;
  }
  return normalized.endsWith('_IMPORT') ? normalized : `${normalized}_IMPORT`;
}

function resolveImportScope(meta, industries, roles, sequences) {
  const industry = industries.find((item) => item.name === meta.industryName);
  if (!industry) {
    throw new Error(`未找到行业：${meta.industryName || '-'}`);
  }
  const role = roles.find((item) => item.name === meta.roleName && item.industryId === industry.id);
  if (!role) {
    throw new Error(`未找到岗位：${meta.roleName || '-'}`);
  }
  const sequence = sequences.find((item) => item.id === role.sequenceId);
  if (!sequence) {
    throw new Error(`岗位“${role.name}”未绑定能力序列`);
  }
  if (meta.sequenceName && sequence.name !== meta.sequenceName) {
    throw new Error(`导入文件中的能力序列“${meta.sequenceName}”与当前岗位主序列不一致`);
  }
  const roleLevel = sequence.levels?.find((item) => item.name === meta.roleLevelName);
  if (!roleLevel) {
    throw new Error(`未找到序列等级：${meta.roleLevelName || '-'}`);
  }
  return {
    industryId: industry.id,
    roleId: role.id,
    roleLevelId: roleLevel.id,
  };
}

function parseCapabilityModelMarkdown(text, industries, roles, sequences, fileName = '') {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const meta = {};
  const dimensions = [];
  let cursor = 0;

  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
  const titleLine = lines[cursor]?.trim();
  if (!titleLine?.startsWith('# ')) {
    throw new Error('Markdown 文件格式不正确，缺少模型标题');
  }

  const modelName = titleLine.replace(/^#\s+/, '').trim() || fileName.replace(/\.[^.]+$/, '') || '导入能力模型';
  cursor += 1;

  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (line.startsWith('## 模型说明')) break;
    if (line.startsWith('- ')) {
      const separatorIndex = line.indexOf('：');
      if (separatorIndex > 1) {
        const label = line.slice(2, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        meta[label] = value;
      }
    }
    cursor += 1;
  }

  if (!lines[cursor]?.trim().startsWith('## 模型说明')) {
    throw new Error('Markdown 文件格式不正确，缺少“模型说明”章节');
  }

  cursor += 1;
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
  const descriptionLines = [];
  while (cursor < lines.length && !lines[cursor].trim().startsWith('## ')) {
    descriptionLines.push(lines[cursor]);
    cursor += 1;
  }

  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    if (!line) {
      cursor += 1;
      continue;
    }
    const dimensionMatch = line.match(/^##\s+\d+\.\s+(.+)$/);
    if (!dimensionMatch) {
      cursor += 1;
      continue;
    }

    const dimension = {
      name: dimensionMatch[1].trim(),
      description: '',
      items: [],
    };
    cursor += 1;

    while (cursor < lines.length) {
      const current = lines[cursor].trim();
      if (!current) {
        cursor += 1;
        continue;
      }
      if (current.startsWith('### ') || current.startsWith('## ')) break;
      if (current.startsWith('- 能力类说明：')) {
        dimension.description = current.replace('- 能力类说明：', '').trim();
      }
      cursor += 1;
    }

    while (cursor < lines.length) {
      const current = lines[cursor].trim();
      if (!current) {
        cursor += 1;
        continue;
      }
      if (current.startsWith('## ')) break;
      const itemMatch = current.match(/^###\s+\d+\.\d+\s+(.+)$/);
      if (!itemMatch) {
        cursor += 1;
        continue;
      }

      const item = {
        name: itemMatch[1].trim(),
        description: '',
        evidenceExamples: [],
        levelDescriptors: [],
        evidenceTypes: [],
        requiredEvidenceCount: 1,
        requiredReviewRoles: [],
        isGrowthOnly: false,
        aiAssistMode: 'SUGGEST_ONLY',
      };
      cursor += 1;

      while (cursor < lines.length) {
        const detailLine = lines[cursor].trim();
        if (!detailLine) {
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('### ') || detailLine.startsWith('## ')) break;
        if (detailLine.startsWith('- 能力项说明：')) {
          item.description = detailLine.replace('- 能力项说明：', '').trim();
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('- 证据类型：')) {
          const value = detailLine.replace('- 证据类型：', '').trim();
          item.evidenceTypes = value && value !== '-'
            ? value.split('、').map((entry) => entry.trim()).filter(Boolean)
            : [];
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('- 最低证据数：')) {
          item.requiredEvidenceCount = Number(detailLine.replace('- 最低证据数：', '').trim()) || 1;
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('- 评价主体：')) {
          const value = detailLine.replace('- 评价主体：', '').trim();
          item.requiredReviewRoles = value && value !== '-'
            ? value.split('、').map((entry) => entry.trim()).filter(Boolean)
            : [];
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('- 成长档案专用：')) {
          item.isGrowthOnly = detailLine.replace('- 成长档案专用：', '').trim() === '是';
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('- AI辅助策略：')) {
          item.aiAssistMode = detailLine.replace('- AI辅助策略：', '').trim() || 'SUGGEST_ONLY';
          cursor += 1;
          continue;
        }
        if (detailLine === '- 成长记录示例：' || detailLine === '- 证据示例：') {
          cursor += 1;
          while (cursor < lines.length && lines[cursor].trim().startsWith('- ')) {
            item.evidenceExamples.push(lines[cursor].trim().replace(/^- /, '').trim());
            cursor += 1;
          }
          continue;
        }
        if (detailLine.startsWith('- 成长记录示例：') || detailLine.startsWith('- 证据示例：')) {
          const inlineExample = detailLine.replace(/^- (成长记录示例|证据示例)：/, '').trim();
          if (inlineExample && inlineExample !== '-') {
            item.evidenceExamples.push(inlineExample);
          }
          cursor += 1;
          continue;
        }
        if (detailLine.startsWith('| 等级 | 行为描述 |')) {
          cursor += 2;
          while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
            const [levelLabel, descriptorText] = splitMarkdownRow(lines[cursor]);
            item.levelDescriptors.push({
              levelKey: levelLabel,
              text: descriptorText === '-' ? '' : descriptorText,
              label: levelLabel,
            });
            cursor += 1;
          }
          continue;
        }
        cursor += 1;
      }

      dimension.items.push(item);
    }

    dimensions.push(dimension);
  }

  if (!dimensions.length) {
    throw new Error('Markdown 文件中未解析到能力类');
  }

  const levelLabels = dimensions[0]?.items?.[0]?.levelDescriptors?.map((item) => item.label).filter(Boolean) || [];
  const levelScheme = levelLabels.length
    ? {
      count: levelLabels.length,
      levels: levelLabels.map((label, index) => ({
        key: `L${index + 1}`,
        label,
      })),
    }
    : createDefaultLevelScheme(4);

  const scope = resolveImportScope({
    industryName: meta['所属行业'],
    roleName: meta['所属岗位'],
    sequenceName: meta['能力序列'],
    roleLevelName: meta['序列等级'],
  }, industries, roles, sequences);

  return createCapabilityModelDraft({
    name: modelName,
    modelCode: makeImportedModelCode(meta['模型编码']),
    industryId: scope.industryId,
    roleId: scope.roleId,
    roleLevelId: scope.roleLevelId,
    description: descriptionLines.join('\n').trim(),
    tags: meta['标签'] && meta['标签'] !== '-' ? meta['标签'].split('、').map((item) => item.trim()).filter(Boolean) : [],
    status: 'DRAFT',
    levelScheme,
    dimensions: dimensions.map((dimension) => ({
      ...dimension,
      items: (dimension.items || []).map((item) => ({
        ...item,
        evidenceTypes: (item.evidenceTypes || []).map((entry) => (
          CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS.find((option) => option.label === entry)?.value || entry
        )),
        levelDescriptors: levelScheme.levels.map((level, index) => ({
          levelKey: level.key,
          text: item.levelDescriptors?.[index]?.text || '',
        })),
        requiredReviewRoles: (item.requiredReviewRoles || []).map((entry) => (
          CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS.find((option) => option.label === entry)?.value || entry
        )),
        aiAssistMode: CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS.find((option) => option.label === item.aiAssistMode)?.value || item.aiAssistMode,
      })),
    })),
  });
}

function parseCapabilityModelJson(text, industries, roles, sequences, fileName = '') {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error('JSON 文件解析失败', { cause: error });
  }

  const payload = parsed?.model || parsed;
  if (!payload || !Array.isArray(payload.dimensions)) {
    throw new Error('JSON 文件缺少有效的模型结构');
  }

  let scope = {
    industryId: payload.industryId,
    roleId: payload.roleId,
    roleLevelId: payload.roleLevelId,
  };

  if (!scope.industryId || !scope.roleId || !scope.roleLevelId) {
    scope = resolveImportScope({
      industryName: payload.industryName,
      roleName: payload.roleName,
      sequenceName: payload.sequenceName,
      roleLevelName: payload.roleLevelName,
    }, industries, roles, sequences);
  }

  return createCapabilityModelDraft({
    ...payload,
    id: undefined,
    name: payload.name || fileName.replace(/\.[^.]+$/, '') || '导入能力模型',
    modelCode: makeImportedModelCode(payload.modelCode),
    industryId: scope.industryId,
    roleId: scope.roleId,
    roleLevelId: scope.roleLevelId,
    status: 'DRAFT',
  });
}

function parseImportedCapabilityFile(text, fileName, industries, roles, sequences) {
  const lowerName = String(fileName || '').toLowerCase();
  if (lowerName.endsWith('.json')) {
    return parseCapabilityModelJson(text, industries, roles, sequences, fileName);
  }
  return parseCapabilityModelMarkdown(text, industries, roles, sequences, fileName);
}

function buildCapabilityModelMarkdown(model, industries, roles, sequences) {
  const industryName = industries.find((item) => item.id === model.industryId)?.name || '-';
  const role = roles.find((item) => item.id === model.roleId);
  const sequence = getSequenceForRole(role, sequences);
  const roleLevelName = getRoleLevel(role, model.roleLevelId, sequences)?.name || '-';
  const statusText = CAPABILITY_MODEL_STATUS_OPTIONS.find((item) => item.value === model.status)?.label || model.status || '-';
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

function CapabilityModelPreview({ model, industries, roles, sequences }) {
  const [previewMode, setPreviewMode] = useState('structured');

  useEffect(() => {
    setPreviewMode('structured');
  }, [model?.id]);

  if (!model) {
    return <Empty description="暂无模型数据" />;
  }

  const industryName = industries.find((item) => item.id === model.industryId)?.name || '-';
  const role = roles.find((item) => item.id === model.roleId);
  const sequence = getSequenceForRole(role, sequences);
  const roleLevelName = getRoleLevel(role, model.roleLevelId, sequences)?.name || '-';
  const markdownText = buildCapabilityModelMarkdown(model, industries, roles, sequences);

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdownText);
      message.success('Markdown 已复制');
    } catch {
      message.error('复制 Markdown 失败');
    }
  }

  return (
    <div className="cap-model-preview">
      <div className="cap-model-preview-hero">
        <div className="cap-model-preview-kicker">{industryName}</div>
        <div className="cap-model-preview-title">{model.name}</div>
        <div className="cap-model-preview-desc">{model.description || '未填写模型说明'}</div>
        <div className="cap-model-preview-meta">
          <span>岗位：{role?.name || '-'}</span>
          <span>能力序列：{sequence?.name || '-'}</span>
          <span>序列等级：{roleLevelName}</span>
          <span>等级：{model.levelScheme?.levels?.length || 0} 级</span>
          <span>能力类：{model.dimensions?.length || 0}</span>
          <span>能力项：{getTotalCapabilityItems(model)}</span>
          <span>状态：{CAPABILITY_MODEL_STATUS_OPTIONS.find((item) => item.value === model.status)?.label || model.status}</span>
        </div>
        {model.tags?.length ? (
          <div className="cap-model-preview-tags">
            {model.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
          </div>
        ) : null}
        <div className="cap-model-preview-toolbar">
          <Segmented
            value={previewMode}
            onChange={setPreviewMode}
            options={[
              { label: '结构预览', value: 'structured' },
              { label: 'Markdown', value: 'markdown' },
            ]}
          />
          {previewMode === 'markdown' ? (
            <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown}>复制 Markdown</Button>
          ) : null}
        </div>
      </div>
      {previewMode === 'structured' ? (
        <>
          {(model.dimensions || []).map((dimension) => (
            <div key={dimension.id} className="cap-model-preview-section">
              <div className="cap-model-preview-section-head">
                <div>
                  <div className="cap-model-preview-section-title">{dimension.name}</div>
                  <div className="cap-model-preview-section-desc">{dimension.description || '未填写能力类说明'}</div>
                </div>
                <Tag color="blue">{dimension.items?.length || 0} 个能力项</Tag>
              </div>
              <div className="cap-model-matrix">
                <table>
                  <thead>
                    <tr>
                      <th>能力项</th>
                      {model.levelScheme?.levels?.map((level) => (
                        <th key={level.key}>{level.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(dimension.items || []).map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="cap-model-matrix-item">{item.name}</div>
                          <div className="cap-model-matrix-desc">{item.description || '未填写能力项说明'}</div>
                          <div className="cap-model-matrix-desc">
                            证据类型：{item.evidenceTypes?.length ? item.evidenceTypes.map((entry) => EVIDENCE_TYPE_LABEL_MAP[entry] || entry).join('、') : '未配置'}
                          </div>
                          <div className="cap-model-matrix-desc">
                            最低证据数：{item.requiredEvidenceCount || 1} · 评价主体：{item.requiredReviewRoles?.length ? item.requiredReviewRoles.map((entry) => REVIEW_ROLE_LABEL_MAP[entry] || entry).join('、') : '未配置'}
                          </div>
                          <div className="cap-model-matrix-desc">
                            适用范围：{item.isGrowthOnly ? '仅成长档案' : '可进入正式评价'} · AI：{AI_ASSIST_MODE_LABEL_MAP[item.aiAssistMode] || item.aiAssistMode || '未配置'}
                          </div>
                          {item.evidenceExamples?.length ? (
                            <div className="cap-model-matrix-record">
                              成长记录示例：{item.evidenceExamples.join('、')}
                            </div>
                          ) : null}
                        </td>
                        {(model.levelScheme?.levels || []).map((level) => (
                          <td key={`${item.id}_${level.key}`}>
                            {item.levelDescriptors?.find((descriptor) => descriptor.levelKey === level.key)?.text || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="cap-model-markdown-panel">
          <div className="cap-model-markdown-toolbar">
            <div className="cap-model-section-desc">适合直接复制到文档、知识库或 AI 提示词中使用。</div>
            <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown}>复制 Markdown</Button>
          </div>
          <TextArea
            readOnly
            value={markdownText}
            autoSize={{ minRows: 20, maxRows: 32 }}
            className="cap-model-markdown-textarea"
          />
        </div>
      )}
    </div>
  );
}

export default function CapabilityModelModule() {
  const [activeTab, setActiveTab] = useState('models');
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [roles, setRoles] = useState([]);
  const [models, setModels] = useState([]);

  const [modelKeyword, setModelKeyword] = useState('');
  const [modelIndustryFilter, setModelIndustryFilter] = useState(undefined);
  const [modelRoleFilter, setModelRoleFilter] = useState(undefined);
  const [modelRoleLevelFilter, setModelRoleLevelFilter] = useState(undefined);
  const [modelStatusFilter, setModelStatusFilter] = useState(undefined);

  const [industryKeyword, setIndustryKeyword] = useState('');
  const [sequenceKeyword, setSequenceKeyword] = useState('');
  const [sequenceIndustryFilter, setSequenceIndustryFilter] = useState(undefined);
  const [roleKeyword, setRoleKeyword] = useState('');
  const [roleIndustryFilter, setRoleIndustryFilter] = useState(undefined);

  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [modelDrawerMode, setModelDrawerMode] = useState('create');
  const [modelDraft, setModelDraft] = useState(() => createCapabilityModelDraft());
  const [activeDimensionId, setActiveDimensionId] = useState(undefined);
  const [activeItemId, setActiveItemId] = useState(undefined);

  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [industryEditing, setIndustryEditing] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('library');
  const [importKeyword, setImportKeyword] = useState('');
  const [selectedImportModelId, setSelectedImportModelId] = useState(undefined);
  const [uploadedImportDraft, setUploadedImportDraft] = useState(null);
  const [uploadedImportName, setUploadedImportName] = useState('');
  const [sequenceModalOpen, setSequenceModalOpen] = useState(false);
  const [sequenceEditing, setSequenceEditing] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState(null);

  const [industryForm] = Form.useForm();
  const [sequenceForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [modelBaseForm] = Form.useForm();

  const watchedIndustryId = Form.useWatch('industryId', modelBaseForm);
  const watchedRoleId = Form.useWatch('roleId', modelBaseForm);
  const watchedRoleIndustryId = Form.useWatch('industryId', roleForm);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!modelDrawerOpen || !modelDraft) return;
    modelBaseForm.setFieldsValue({
      modelCode: modelDraft.modelCode,
      name: modelDraft.name,
      industryId: modelDraft.industryId || undefined,
      roleId: modelDraft.roleId || undefined,
      roleLevelId: modelDraft.roleLevelId || undefined,
      description: modelDraft.description,
      tags: modelDraft.tags || [],
    });
  }, [modelDrawerOpen, modelDraft, modelBaseForm]);

  useEffect(() => {
    if (!modelDrawerOpen || modelDrawerMode === 'preview') return;
    const currentRoleId = modelBaseForm.getFieldValue('roleId');
    const availableRoles = roles.filter((item) => item.industryId === watchedIndustryId && item.status === 'ACTIVE');
    if (currentRoleId && !availableRoles.some((item) => item.id === currentRoleId)) {
      modelBaseForm.setFieldValue('roleId', undefined);
      modelBaseForm.setFieldValue('roleLevelId', undefined);
    }
  }, [modelBaseForm, modelDrawerMode, modelDrawerOpen, roles, watchedIndustryId]);

  useEffect(() => {
    if (!modelDrawerOpen || modelDrawerMode === 'preview') return;
    const currentLevelId = modelBaseForm.getFieldValue('roleLevelId');
    const role = roles.find((item) => item.id === watchedRoleId);
    const nextSequence = getSequenceForRole(role, sequences);
    const availableLevels = nextSequence?.levels || [];
    if (currentLevelId && !availableLevels.some((item) => item.id === currentLevelId)) {
      modelBaseForm.setFieldValue('roleLevelId', undefined);
    }
  }, [modelBaseForm, modelDrawerMode, modelDrawerOpen, roles, sequences, watchedRoleId]);

  useEffect(() => {
    if (!roleModalOpen) return;
    const currentSequenceId = roleForm.getFieldValue('sequenceId');
    const availableSequences = sequences.filter((item) => item.industryId === watchedRoleIndustryId && item.status === 'ACTIVE');
    if (currentSequenceId && !availableSequences.some((item) => item.id === currentSequenceId)) {
      roleForm.setFieldValue('sequenceId', undefined);
    }
  }, [roleForm, roleModalOpen, sequences, watchedRoleIndustryId]);

  useEffect(() => {
    if (!modelDrawerOpen || modelDrawerMode === 'preview') return;
    const dimensions = modelDraft?.dimensions || [];
    if (!dimensions.length) {
      if (activeDimensionId) setActiveDimensionId(undefined);
      if (activeItemId) setActiveItemId(undefined);
      return;
    }

    const matchedDimension = dimensions.find((item) => item.id === activeDimensionId) || dimensions[0];
    const matchedItem = matchedDimension.items?.find((item) => item.id === activeItemId) || matchedDimension.items?.[0];

    if (matchedDimension.id !== activeDimensionId) {
      setActiveDimensionId(matchedDimension.id);
    }
    if ((matchedItem?.id || undefined) !== activeItemId) {
      setActiveItemId(matchedItem?.id);
    }
  }, [activeDimensionId, activeItemId, modelDraft, modelDrawerMode, modelDrawerOpen]);

  async function loadAllData(withLoading = true) {
    if (withLoading) setLoading(true);
    try {
      await capabilityModelApi.seed();
      const [nextIndustries, nextSequences, nextRoles, nextModels] = await Promise.all([
        capabilityModelApi.listIndustries(),
        capabilityModelApi.listSequences(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listModels(),
      ]);
      setIndustries(sortBySortNo(nextIndustries));
      setSequences(nextSequences);
      setRoles(nextRoles);
      setModels(nextModels);
    } catch (error) {
      message.error(getErrorMessage(error, '加载能力模型数据失败'));
    } finally {
      if (withLoading) setLoading(false);
    }
  }

  const modelSummary = useMemo(() => ({
    industryCount: industries.length,
    roleCount: roles.length,
    modelCount: models.length,
    publishedCount: models.filter((item) => item.status === 'PUBLISHED').length,
  }), [industries, models, roles]);

  const industryOptions = useMemo(() => industries.map((item) => ({
    value: item.id,
    label: item.name,
    status: item.status,
  })), [industries]);

  const activeIndustryOptions = useMemo(() => industryOptions.filter((item) => item.status === 'ACTIVE'), [industryOptions]);

  const sequenceOptions = useMemo(() => sequences.map((item) => ({
    value: item.id,
    label: item.name,
    industryId: item.industryId,
    status: item.status,
    levels: item.levels || [],
  })), [sequences]);

  const activeSequenceOptions = useMemo(() => (
    sequenceOptions.filter((item) => item.status === 'ACTIVE' && (!watchedRoleIndustryId || item.industryId === watchedRoleIndustryId))
  ), [sequenceOptions, watchedRoleIndustryId]);

  const roleOptions = useMemo(() => roles.map((item) => ({
    value: item.id,
    label: item.name,
    industryId: item.industryId,
    status: item.status,
    sequenceId: item.sequenceId,
  })), [roles]);

  const activeRoleOptions = useMemo(() => (
    roleOptions.filter((item) => item.status === 'ACTIVE' && (!watchedIndustryId || item.industryId === watchedIndustryId))
  ), [roleOptions, watchedIndustryId]);

  const activeRoleLevelOptions = useMemo(() => {
    const role = roles.find((item) => item.id === watchedRoleId);
    const sequence = getSequenceForRole(role, sequences);
    return (sequence?.levels || []).map((level) => ({
      value: level.id,
      label: level.name,
    }));
  }, [roles, sequences, watchedRoleId]);

  const filteredRoleLevelOptions = useMemo(() => {
    const role = roles.find((item) => item.id === modelRoleFilter);
    const sequence = getSequenceForRole(role, sequences);
    return (sequence?.levels || []).map((level) => ({
      value: level.id,
      label: level.name,
    }));
  }, [modelRoleFilter, roles, sequences]);

  const filteredModels = useMemo(() => {
    return models.filter((item) => {
      const keyword = modelKeyword.trim().toLowerCase();
      const role = roles.find((roleItem) => roleItem.id === item.roleId);
      const sequence = getSequenceForRole(role, sequences);
      const industryName = industries.find((industry) => industry.id === item.industryId)?.name || '';
      const roleName = role?.name || '';
      const sequenceName = sequence?.name || '';
      const roleLevelName = getRoleLevel(role, item.roleLevelId, sequences)?.name || '';

      if (keyword) {
        const haystack = `${item.name || ''} ${item.modelCode || ''} ${industryName} ${roleName} ${sequenceName} ${roleLevelName}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (modelIndustryFilter && item.industryId !== modelIndustryFilter) return false;
      if (modelRoleFilter && item.roleId !== modelRoleFilter) return false;
      if (modelRoleLevelFilter && item.roleLevelId !== modelRoleLevelFilter) return false;
      if (modelStatusFilter && item.status !== modelStatusFilter) return false;
      return true;
    });
  }, [
    industries,
    modelIndustryFilter,
    modelKeyword,
    modelRoleFilter,
    modelRoleLevelFilter,
    modelStatusFilter,
    models,
    roles,
    sequences,
  ]);

  const filteredIndustries = useMemo(() => {
    const keyword = industryKeyword.trim().toLowerCase();
    return industries.filter((item) => {
      if (!keyword) return true;
      return `${item.name} ${item.code} ${item.description || ''}`.toLowerCase().includes(keyword);
    });
  }, [industries, industryKeyword]);

  const filteredSequences = useMemo(() => {
    const keyword = sequenceKeyword.trim().toLowerCase();
    return sequences.filter((item) => {
      if (sequenceIndustryFilter && item.industryId !== sequenceIndustryFilter) return false;
      if (!keyword) return true;
      const industryName = industries.find((industry) => industry.id === item.industryId)?.name || '';
      const levelNames = (item.levels || []).map((level) => `${level.name} ${level.code}`).join(' ');
      return `${item.name} ${item.code} ${item.description || ''} ${industryName} ${levelNames}`.toLowerCase().includes(keyword);
    });
  }, [industries, sequenceIndustryFilter, sequenceKeyword, sequences]);

  const filteredRoles = useMemo(() => {
    const keyword = roleKeyword.trim().toLowerCase();
    return roles.filter((item) => {
      if (roleIndustryFilter && item.industryId !== roleIndustryFilter) return false;
      if (!keyword) return true;
      const industryName = industries.find((industry) => industry.id === item.industryId)?.name || '';
      const sequenceName = sequences.find((sequence) => sequence.id === item.sequenceId)?.name || '';
      return `${item.name} ${item.code} ${item.description || ''} ${industryName} ${sequenceName}`.toLowerCase().includes(keyword);
    });
  }, [industries, roleIndustryFilter, roleKeyword, roles, sequences]);

  const importableLibraryModels = useMemo(() => {
    const keyword = importKeyword.trim().toLowerCase();
    return models.filter((item) => {
      if (item.status !== 'PUBLISHED') return false;
      const role = roles.find((roleItem) => roleItem.id === item.roleId);
      const sequence = getSequenceForRole(role, sequences);
      const industryName = industries.find((industry) => industry.id === item.industryId)?.name || '';
      const roleName = role?.name || '';
      const sequenceName = sequence?.name || '';
      const roleLevelName = getRoleLevel(role, item.roleLevelId, sequences)?.name || '';
      if (!keyword) return true;
      return `${item.name} ${item.modelCode} ${industryName} ${roleName} ${sequenceName} ${roleLevelName}`.toLowerCase().includes(keyword);
    });
  }, [importKeyword, industries, models, roles, sequences]);

  const activeFrameworkSelection = useMemo(() => {
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
  }, [activeDimensionId, activeItemId, modelDraft]);

  const activeDimension = activeFrameworkSelection.dimension;
  const activeDimensionIndex = activeFrameworkSelection.dimensionIndex;
  const activeItem = activeFrameworkSelection.item;
  const activeItemIndex = activeFrameworkSelection.itemIndex;

  function openCreateModel() {
    setModelDrawerMode('create');
    setModelDraft(createCapabilityModelDraft());
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
  }

  function openImportModal() {
    setImportModalOpen(true);
    setImportTab('library');
    setImportKeyword('');
    setSelectedImportModelId(undefined);
    setUploadedImportDraft(null);
    setUploadedImportName('');
  }

  function openEditModel(record) {
    setModelDrawerMode('edit');
    setModelDraft(createCapabilityModelDraft(cloneDraft(record)));
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
  }

  function openPreviewModel(record) {
    setModelDrawerMode('preview');
    setModelDraft(createCapabilityModelDraft(cloneDraft(record)));
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
  }

  async function handleSaveModel() {
    try {
      const values = await modelBaseForm.validateFields();
      const saved = await capabilityModelApi.saveModel({
        ...modelDraft,
        ...values,
      });
      setModelDraft(createCapabilityModelDraft(saved));
      setModelDrawerOpen(false);
      await loadAllData(false);
      message.success(modelDrawerMode === 'create' ? '模型已创建' : '模型已更新');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '保存模型失败'));
    }
  }

  async function handleDuplicateModel(record) {
    try {
      await capabilityModelApi.duplicateModel(record.id);
      await loadAllData(false);
      message.success('模型已复制为草稿');
    } catch (error) {
      message.error(getErrorMessage(error, '复制模型失败'));
    }
  }

  async function handleImportFromLibrary() {
    if (!selectedImportModelId) {
      message.warning('请选择一个资料库模型');
      return;
    }
    try {
      const draft = await capabilityModelApi.duplicateModel(selectedImportModelId);
      setImportModalOpen(false);
      setModelDrawerMode('edit');
      setModelDraft(createCapabilityModelDraft(draft));
      setActiveDimensionId(undefined);
      setActiveItemId(undefined);
      setModelDrawerOpen(true);
      await loadAllData(false);
      message.success('资料库模型已导入为草稿');
    } catch (error) {
      message.error(getErrorMessage(error, '资料库导入失败'));
    }
  }

  async function handleImportFile(file) {
    try {
      const text = await file.text();
      const draft = parseImportedCapabilityFile(text, file.name, industries, roles, sequences);
      setUploadedImportDraft(draft);
      setUploadedImportName(file.name);
      message.success(`已解析文件：${file.name}`);
    } catch (error) {
      setUploadedImportDraft(null);
      setUploadedImportName('');
      message.error(getErrorMessage(error, '文件解析失败'));
    }
    return false;
  }

  function handleLoadUploadedDraft() {
    if (!uploadedImportDraft) {
      message.warning('请先上传并解析文件');
      return;
    }
    setImportModalOpen(false);
    setModelDrawerMode('create');
    setModelDraft(createCapabilityModelDraft(uploadedImportDraft));
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
    message.success('文件内容已载入编辑器，请确认后保存');
  }

  async function handleStartEditModel(record) {
    if (record.status === 'DRAFT') {
      openEditModel(record);
      return;
    }

    try {
      const draft = await capabilityModelApi.duplicateModel(record.id);
      setModelDrawerMode('edit');
      setModelDraft(createCapabilityModelDraft(draft));
      setModelDrawerOpen(true);
      await loadAllData(false);
      message.success('已基于当前模型生成草稿，可直接编辑');
    } catch (error) {
      message.error(getErrorMessage(error, '进入编辑失败'));
    }
  }

  async function handlePublishModel(record) {
    try {
      await capabilityModelApi.publishModel(record.id);
      await loadAllData(false);
      message.success('模型已发布');
    } catch (error) {
      message.error(getErrorMessage(error, '发布模型失败'));
    }
  }

  async function handleDisableModel(record) {
    try {
      await capabilityModelApi.disableModel(record.id);
      await loadAllData(false);
      message.success('模型已停用');
    } catch (error) {
      message.error(getErrorMessage(error, '停用模型失败'));
    }
  }

  async function handleRemoveModel(record) {
    try {
      await capabilityModelApi.removeModel(record.id);
      await loadAllData(false);
      message.success('模型已删除');
    } catch (error) {
      message.error(getErrorMessage(error, '删除模型失败'));
    }
  }

  function openIndustryModal(record) {
    setIndustryEditing(record || null);
    industryForm.setFieldsValue(record || createIndustryDraft());
    setIndustryModalOpen(true);
  }

  function openSequenceModal(record, industryId) {
    setSequenceEditing(record || null);
    sequenceForm.setFieldsValue(record || createSequenceDraft(industryId));
    setSequenceModalOpen(true);
  }

  function openRoleModal(record, industryId) {
    setRoleEditing(record || null);
    roleForm.setFieldsValue(record || createRoleDraft(industryId));
    setRoleModalOpen(true);
  }

  async function handleSaveIndustry() {
    try {
      const values = await industryForm.validateFields();
      await capabilityModelApi.saveIndustry({
        ...industryEditing,
        ...values,
      });
      setIndustryModalOpen(false);
      setIndustryEditing(null);
      await loadAllData(false);
      message.success(industryEditing ? '行业已更新' : '行业已创建');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '保存行业失败'));
    }
  }

  async function handleSaveSequence() {
    try {
      const values = await sequenceForm.validateFields();
      await capabilityModelApi.saveSequence({
        ...sequenceEditing,
        ...values,
      });
      setSequenceModalOpen(false);
      setSequenceEditing(null);
      await loadAllData(false);
      message.success(sequenceEditing ? '能力序列已更新' : '能力序列已创建');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '保存能力序列失败'));
    }
  }

  async function handleSaveRole() {
    try {
      const values = await roleForm.validateFields();
      await capabilityModelApi.saveRole({
        ...roleEditing,
        ...values,
      });
      setRoleModalOpen(false);
      setRoleEditing(null);
      await loadAllData(false);
      message.success(roleEditing ? '岗位已更新' : '岗位已创建');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '保存岗位失败'));
    }
  }

  async function handleRemoveIndustry(record) {
    try {
      await capabilityModelApi.removeIndustry(record.id);
      await loadAllData(false);
      message.success('行业已删除');
    } catch (error) {
      message.error(getErrorMessage(error, '删除行业失败'));
    }
  }

  async function handleRemoveSequence(record) {
    try {
      await capabilityModelApi.removeSequence(record.id);
      await loadAllData(false);
      message.success('能力序列已删除');
    } catch (error) {
      message.error(getErrorMessage(error, '删除能力序列失败'));
    }
  }

  async function handleRemoveRole(record) {
    try {
      await capabilityModelApi.removeRole(record.id);
      await loadAllData(false);
      message.success('岗位已删除');
    } catch (error) {
      message.error(getErrorMessage(error, '删除岗位失败'));
    }
  }

  function updateModelDraftState(updater) {
    setModelDraft((prev) => updater(cloneDraft(prev)));
  }

  function selectDimension(dimensionId) {
    const dimension = modelDraft.dimensions.find((item) => item.id === dimensionId);
    setActiveDimensionId(dimensionId);
    if (!dimension) return;
    const matchedItem = dimension.items?.find((item) => item.id === activeItemId);
    setActiveItemId(matchedItem?.id || dimension.items?.[0]?.id);
  }

  function selectItem(dimensionId, itemId) {
    setActiveDimensionId(dimensionId);
    setActiveItemId(itemId);
  }

  function handleLevelCountChange(nextCount) {
    updateModelDraftState((draft) => {
      const fallback = createDefaultLevelScheme(nextCount);
      const nextLevelScheme = {
        count: fallback.count,
        levels: fallback.levels.map((level, index) => ({
          ...level,
          label: draft.levelScheme?.levels?.[index]?.label || level.label,
        })),
      };
      draft.levelScheme = nextLevelScheme;
      draft.dimensions = syncDimensionsToLevelScheme(draft.dimensions, nextLevelScheme);
      return draft;
    });
  }

  function handleLevelLabelChange(index, label) {
    updateModelDraftState((draft) => {
      const nextLevels = draft.levelScheme.levels.map((level, levelIndex) => (
        levelIndex === index ? { ...level, label } : level
      ));
      const nextLevelScheme = {
        count: nextLevels.length,
        levels: nextLevels,
      };
      draft.levelScheme = nextLevelScheme;
      draft.dimensions = syncDimensionsToLevelScheme(draft.dimensions, nextLevelScheme);
      return draft;
    });
  }

  function addDimension() {
    const nextDimension = createEmptyCapabilityDimension(modelDraft.levelScheme, { sortNo: modelDraft.dimensions.length + 1 });
    updateModelDraftState((draft) => {
      draft.dimensions = [
        ...draft.dimensions,
        nextDimension,
      ];
      return draft;
    });
    setActiveDimensionId(nextDimension.id);
    setActiveItemId(nextDimension.items?.[0]?.id);
  }

  function removeDimension(index) {
    updateModelDraftState((draft) => {
      draft.dimensions = draft.dimensions.filter((_, currentIndex) => currentIndex !== index)
        .map((dimension, currentIndex) => ({ ...dimension, sortNo: currentIndex + 1 }));
      return draft;
    });
  }

  function moveDimension(index, delta) {
    updateModelDraftState((draft) => {
      draft.dimensions = moveListItem(draft.dimensions, index, delta);
      return draft;
    });
  }

  function updateDimensionField(index, field, value) {
    updateModelDraftState((draft) => {
      draft.dimensions[index] = {
        ...draft.dimensions[index],
        [field]: value,
      };
      return draft;
    });
  }

  function addItem(dimensionIndex) {
    const nextItem = createEmptyCapabilityItem(modelDraft.levelScheme, {
      sortNo: (modelDraft.dimensions[dimensionIndex]?.items?.length || 0) + 1,
    });
    const dimensionId = modelDraft.dimensions[dimensionIndex]?.id;
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items = [
        ...(dimension.items || []),
        nextItem,
      ];
      return draft;
    });
    setActiveDimensionId(dimensionId);
    setActiveItemId(nextItem.id);
  }

  function removeItem(dimensionIndex, itemIndex) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items = dimension.items
        .filter((_, currentIndex) => currentIndex !== itemIndex)
        .map((item, currentIndex) => ({ ...item, sortNo: currentIndex + 1 }));
      return draft;
    });
  }

  function moveItem(dimensionIndex, itemIndex, delta) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items = moveListItem(dimension.items, itemIndex, delta);
      return draft;
    });
  }

  function updateItemField(dimensionIndex, itemIndex, field, value) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items[itemIndex] = {
        ...dimension.items[itemIndex],
        [field]: value,
      };
      return draft;
    });
  }

  function updateItemDescriptor(dimensionIndex, itemIndex, levelIndex, text) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      const item = dimension.items[itemIndex];
      item.levelDescriptors = item.levelDescriptors.map((descriptor, descriptorIndex) => (
        descriptorIndex === levelIndex ? { ...descriptor, text } : descriptor
      ));
      return draft;
    });
  }

  function updateItemEvidence(dimensionIndex, itemIndex, value) {
    updateModelDraftState((draft) => {
      const lines = String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items[itemIndex] = {
        ...dimension.items[itemIndex],
        evidenceExamples: lines,
      };
      return draft;
    });
  }

  function updateItemStringListField(dimensionIndex, itemIndex, field, values) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items[itemIndex] = {
        ...dimension.items[itemIndex],
        [field]: Array.isArray(values) ? values : [],
      };
      return draft;
    });
  }

  const modelColumns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (_, record) => (
        <div className="cap-model-name-cell">
          <div className="cap-model-name">{record.name}</div>
          <div className="cap-model-name-sub">{record.modelCode}</div>
        </div>
      ),
    },
    {
      title: '行业 / 岗位 / 序列等级',
      key: 'scope',
      width: 280,
      render: (_, record) => {
        const role = roles.find((item) => item.id === record.roleId);
        const sequence = getSequenceForRole(role, sequences);
        const roleLevel = getRoleLevel(role, record.roleLevelId, sequences);
        return (
          <div className="cap-model-name-cell">
            <div className="cap-model-name">{industries.find((item) => item.id === record.industryId)?.name || '-'}</div>
            <div className="cap-model-name-sub">{role?.name || '-'} / {roleLevel?.name || '-'}</div>
            <div className="cap-model-name-sub">{sequence?.name || '-'}</div>
          </div>
        );
      },
    },
    {
      title: '等级体系',
      key: 'levelScheme',
      width: 120,
      render: (_, record) => `${record.levelScheme?.levels?.length || 0} 级`,
    },
    {
      title: '能力规模',
      key: 'size',
      width: 120,
      render: (_, record) => (
        <span>{record.dimensions?.length || 0} 类 / {getTotalCapabilityItems(record)} 项</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => renderStatusTag(value),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => openPreviewModel(record)}>查看</Button>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleStartEditModel(record)}>
            {record.status === 'DRAFT' ? '编辑' : '编辑副本'}
          </Button>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleDuplicateModel(record)}>复制</Button>
          {record.status === 'DRAFT' ? (
            <Button size="small" type="text" icon={<SaveOutlined />} onClick={() => handlePublishModel(record)}>发布</Button>
          ) : null}
          {record.status === 'PUBLISHED' ? (
            <Button size="small" type="text" danger onClick={() => handleDisableModel(record)}>停用</Button>
          ) : null}
          {record.status !== 'PUBLISHED' ? (
            <Popconfirm
              title="删除模型"
              description={`确定删除“${record.name}”吗？`}
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => handleRemoveModel(record)}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const industryColumns = [
    { title: '行业名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (value) => <span className="cap-model-table-desc">{value || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => renderStatusTag(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openIndustryModal(record)}>编辑</Button>
          <Popconfirm
            title="删除行业"
            description={`确定删除“${record.name}”吗？`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleRemoveIndustry(record)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const sequenceColumns = [
    { title: '序列名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
    {
      title: '所属行业',
      dataIndex: 'industryId',
      key: 'industryId',
      width: 140,
      render: (value) => industries.find((item) => item.id === value)?.name || '-',
    },
    {
      title: '等级设置',
      key: 'levels',
      width: 280,
      render: (_, record) => (
        <div className="cap-model-level-tag-wrap">
          {(record.levels || []).map((level) => (
            <Tag key={level.id} color="blue">{level.name}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => renderStatusTag(value),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (value) => <span className="cap-model-table-desc">{value || '-'}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openSequenceModal(record)}>编辑</Button>
          <Popconfirm
            title="删除能力序列"
            description={`确定删除“${record.name}”吗？`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleRemoveSequence(record)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const roleColumns = [
    { title: '岗位名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
    {
      title: '所属行业',
      dataIndex: 'industryId',
      key: 'industryId',
      width: 140,
      render: (value) => industries.find((item) => item.id === value)?.name || '-',
    },
    {
      title: '主能力序列',
      dataIndex: 'sequenceId',
      key: 'sequenceId',
      width: 220,
      render: (value) => sequences.find((item) => item.id === value)?.name || '-',
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (value) => <span className="cap-model-table-desc">{value || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => renderStatusTag(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openRoleModal(record)}>编辑</Button>
          <Popconfirm
            title="删除岗位"
            description={`确定删除“${record.name}”吗？`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleRemoveRole(record)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modelTabContent = (
    <div className="cap-model-page">
      <div className="cap-model-summary-grid">
        <Card bordered={false} className="cap-model-summary-card">
          <Statistic title="行业数" value={modelSummary.industryCount} prefix={<BankOutlined />} />
        </Card>
        <Card bordered={false} className="cap-model-summary-card">
          <Statistic title="岗位数" value={modelSummary.roleCount} prefix={<TeamOutlined />} />
        </Card>
        <Card bordered={false} className="cap-model-summary-card">
          <Statistic title="模型总数" value={modelSummary.modelCount} prefix={<AppstoreOutlined />} />
        </Card>
        <Card bordered={false} className="cap-model-summary-card">
          <Statistic title="已发布模型" value={modelSummary.publishedCount} prefix={<SaveOutlined />} />
        </Card>
      </div>

      <div className="sys-search-card">
        <span className="search-label">模型检索</span>
        <Input
          value={modelKeyword}
          onChange={(event) => setModelKeyword(event.target.value)}
          placeholder="模型名称 / 编码"
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={modelIndustryFilter}
          onChange={(value) => {
            setModelIndustryFilter(value);
            setModelRoleFilter(undefined);
            setModelRoleLevelFilter(undefined);
          }}
          placeholder="所属行业"
          allowClear
          style={{ width: 180 }}
          options={industryOptions}
        />
        <Select
          value={modelRoleFilter}
          onChange={(value) => {
            setModelRoleFilter(value);
            setModelRoleLevelFilter(undefined);
          }}
          placeholder="所属岗位"
          allowClear
          style={{ width: 180 }}
          options={roleOptions.filter((item) => !modelIndustryFilter || item.industryId === modelIndustryFilter)}
        />
        <Select
          value={modelRoleLevelFilter}
          onChange={setModelRoleLevelFilter}
          placeholder="序列等级"
          allowClear
          style={{ width: 180 }}
          disabled={!modelRoleFilter}
          options={filteredRoleLevelOptions}
        />
        <Select
          value={modelStatusFilter}
          onChange={setModelStatusFilter}
          placeholder="模型状态"
          allowClear
          style={{ width: 160 }}
          options={CAPABILITY_MODEL_STATUS_OPTIONS}
        />
        <div className="search-actions">
          <Button icon={<ReloadOutlined />} onClick={() => loadAllData(false)}>刷新</Button>
          <Button icon={<ImportOutlined />} onClick={openImportModal}>导入模型</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModel}>新建模型</Button>
        </div>
      </div>

      <div className="sys-table-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">模型库</span>
            <Tag>{filteredModels.length} 个结果</Tag>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={modelColumns}
          dataSource={filteredModels}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1320 }}
        />
      </div>
    </div>
  );

  const resourceTabContent = (
    <div className="cap-model-resource-layout">
      <div className="sys-table-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">行业管理</span>
            <Tag>{filteredIndustries.length}</Tag>
          </div>
          <div className="sys-table-toolbar-right">
            <Input
              value={industryKeyword}
              onChange={(event) => setIndustryKeyword(event.target.value)}
              placeholder="行业名称 / 编码"
              allowClear
              style={{ width: 220 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openIndustryModal(null)}>新增行业</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={industryColumns}
          dataSource={filteredIndustries}
          pagination={{ pageSize: 6, showSizeChanger: false }}
        />
      </div>

      <div className="sys-table-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">能力序列</span>
            <Tag>{filteredSequences.length}</Tag>
          </div>
          <div className="sys-table-toolbar-right">
            <Input
              value={sequenceKeyword}
              onChange={(event) => setSequenceKeyword(event.target.value)}
              placeholder="序列名称 / 编码"
              allowClear
              style={{ width: 220 }}
            />
            <Select
              value={sequenceIndustryFilter}
              onChange={setSequenceIndustryFilter}
              placeholder="筛选行业"
              allowClear
              style={{ width: 180 }}
              options={industryOptions}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openSequenceModal(null, sequenceIndustryFilter)}>新增序列</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={sequenceColumns}
          dataSource={filteredSequences}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 1180 }}
        />
      </div>

      <div className="sys-table-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">岗位管理</span>
            <Tag>{filteredRoles.length}</Tag>
          </div>
          <div className="sys-table-toolbar-right">
            <Input
              value={roleKeyword}
              onChange={(event) => setRoleKeyword(event.target.value)}
              placeholder="岗位名称 / 编码"
              allowClear
              style={{ width: 220 }}
            />
            <Select
              value={roleIndustryFilter}
              onChange={setRoleIndustryFilter}
              placeholder="筛选行业"
              allowClear
              style={{ width: 180 }}
              options={industryOptions}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoleModal(null, roleIndustryFilter)}>新增岗位</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={roleColumns}
          dataSource={filteredRoles}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1080 }}
        />
      </div>
    </div>
  );

  return (
    <div className="sys-module capability-model-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">能力模型</span>
          <span className="sys-module-header-subtitle">构建覆盖基础教育、职业教育、高等教育等场景的能力模型框架与模板</span>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadAllData(false)}>刷新数据</Button>
          <Button icon={<ImportOutlined />} onClick={openImportModal}>导入模型</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModel}>新建模型</Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'models', label: '模型库', children: modelTabContent },
            { key: 'resources', label: '行业岗位', children: resourceTabContent },
          ]}
        />
      </div>

      <Drawer
        open={modelDrawerOpen}
        title={
          modelDrawerMode === 'preview'
            ? '模型预览'
            : modelDrawerMode === 'edit'
              ? '编辑能力模型'
              : '新建能力模型'
        }
        onClose={() => setModelDrawerOpen(false)}
        width={1200}
        placement="right"
        className="cap-model-drawer"
        destroyOnClose={false}
        extra={modelDrawerMode === 'preview' ? null : (
          <Space>
            <Button onClick={() => setModelDrawerOpen(false)}>取消</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveModel}>保存</Button>
          </Space>
        )}
      >
        {modelDrawerMode === 'preview' ? (
          <CapabilityModelPreview model={modelDraft} industries={industries} roles={roles} sequences={sequences} />
        ) : (
          <div className="cap-model-editor">
            <Form form={modelBaseForm} layout="vertical">
              <div className="cap-model-editor-section">
                <div className="cap-model-section-head">
                  <div>
                    <div className="cap-model-section-title">基础信息</div>
                    <div className="cap-model-section-desc">确定模型所属行业、岗位以及岗位主序列下的等级。</div>
                  </div>
                </div>
                <div className="cap-model-form-grid cap-model-form-grid-2">
                  <Form.Item label="模型名称" name="name" rules={[{ required: true, message: '请输入模型名称' }]}>
                    <Input placeholder="例如：基础教育青年教师能力模型" />
                  </Form.Item>
                  <Form.Item label="模型编码" name="modelCode" rules={[{ required: true, message: '请输入模型编码' }]}>
                    <Input placeholder="例如：BASIC_EDU_TEACHER_YOUNG" />
                  </Form.Item>
                  <Form.Item label="所属行业" name="industryId" rules={[{ required: true, message: '请选择所属行业' }]}>
                    <Select options={activeIndustryOptions} placeholder="选择行业" />
                  </Form.Item>
                  <Form.Item label="所属岗位" name="roleId" rules={[{ required: true, message: '请选择所属岗位' }]}>
                    <Select options={activeRoleOptions} placeholder="选择岗位" />
                  </Form.Item>
                  <Form.Item label="序列等级" name="roleLevelId" rules={[{ required: true, message: '请选择序列等级' }]}>
                    <Select options={activeRoleLevelOptions} placeholder="选择岗位主序列下的等级" disabled={!watchedRoleId} />
                  </Form.Item>
                  <Form.Item label="标签" name="tags" className="cap-model-form-span-2">
                    <Select mode="tags" placeholder="输入标签后回车" tokenSeparators={[',']} />
                  </Form.Item>
                  <Form.Item label="模型说明" name="description" className="cap-model-form-span-2">
                    <TextArea rows={3} placeholder="说明该模型适用的行业场景、岗位阶段与使用方式" />
                  </Form.Item>
                </div>
              </div>
            </Form>

            <div className="cap-model-editor-section">
              <div className="cap-model-section-head">
                <div>
                  <div className="cap-model-section-title">等级体系</div>
                  <div className="cap-model-section-desc">默认 4 级，可按单个模型调整等级数与各级名称。</div>
                </div>
              </div>
              <div className="cap-model-level-toolbar">
                <span>等级数</span>
                <InputNumber min={2} max={6} value={modelDraft.levelScheme.levels.length} onChange={handleLevelCountChange} />
              </div>
              <div className="cap-model-level-grid">
                {modelDraft.levelScheme.levels.map((level, index) => (
                  <div key={level.key} className="cap-model-level-card">
                    <div className="cap-model-level-key">{level.key}</div>
                    <Input value={level.label} onChange={(event) => handleLevelLabelChange(index, event.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="cap-model-editor-section">
              <div className="cap-model-section-head">
                <div>
                  <div className="cap-model-section-title">能力框架</div>
                  <div className="cap-model-section-desc">左侧维护能力结构，右侧只编辑当前选中的能力类与能力项，减少同屏嵌套。</div>
                </div>
                <Button type="dashed" icon={<PlusOutlined />} onClick={addDimension}>新增能力类</Button>
              </div>

              {modelDraft.dimensions.length === 0 ? (
                <Empty description="暂无能力类，请先新增" />
              ) : (
                <div className="cap-model-framework-shell">
                  <div className="cap-model-framework-rail">
                    <div className="cap-model-framework-rail-head">
                      <div>
                        <div className="cap-model-section-title">能力类</div>
                        <div className="cap-model-section-desc">先聚焦一个能力类，再维护该类下的能力项。</div>
                      </div>
                      <Tag color="blue">{modelDraft.dimensions.length} 个能力类</Tag>
                    </div>
                    <div className="cap-model-framework-rail-list">
                      {modelDraft.dimensions.map((dimension, dimensionIndex) => (
                        <button
                          key={dimension.id}
                          type="button"
                          className={`cap-model-framework-rail-chip ${dimension.id === activeDimension?.id ? 'is-active' : ''}`}
                          onClick={() => selectDimension(dimension.id)}
                        >
                          <span className="cap-model-framework-node-kicker">能力类 {dimensionIndex + 1}</span>
                          <span className="cap-model-framework-node-title">{dimension.name || '未命名能力类'}</span>
                          <span className="cap-model-framework-node-meta">{dimension.items?.length || 0} 个能力项</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cap-model-framework-board">
                    {activeDimension ? (
                      <>
                        <div className="cap-model-framework-side">
                          <div className="cap-model-framework-side-head">
                            <div>
                              <div className="cap-model-dimension-title">能力项清单</div>
                              <div className="cap-model-name-sub">当前能力类下共 {activeDimension.items?.length || 0} 项</div>
                            </div>
                            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addItem(activeDimensionIndex)}>新增能力项</Button>
                          </div>
                          <div className="cap-model-framework-item-list">
                            {(activeDimension.items || []).map((item, itemIndex) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`cap-model-framework-item-row ${item.id === activeItem?.id ? 'is-active' : ''}`}
                                onClick={() => selectItem(activeDimension.id, item.id)}
                              >
                                <span className="cap-model-framework-item-index">能力项 {itemIndex + 1}</span>
                                <strong>{item.name || '未命名能力项'}</strong>
                                <span>{item.description || '未填写能力项说明'}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="cap-model-framework-main">
                          <div className="cap-model-dimension-card">
                            <div className="cap-model-dimension-head">
                              <div>
                                <div className="cap-model-dimension-title">当前能力类</div>
                                <div className="cap-model-name-sub">
                                  能力类 {activeDimensionIndex + 1} / {activeDimension.items?.length || 0} 个能力项
                                </div>
                              </div>
                              <Space size={4} wrap>
                                <Button size="small" onClick={() => moveDimension(activeDimensionIndex, -1)} disabled={activeDimensionIndex === 0}>上移</Button>
                                <Button size="small" onClick={() => moveDimension(activeDimensionIndex, 1)} disabled={activeDimensionIndex === modelDraft.dimensions.length - 1}>下移</Button>
                                <Button size="small" danger onClick={() => removeDimension(activeDimensionIndex)} disabled={modelDraft.dimensions.length === 1}>删除</Button>
                              </Space>
                            </div>

                            <div className="cap-model-form-grid cap-model-form-grid-2">
                              <div>
                                <div className="cap-model-field-label">能力类名称</div>
                                <Input
                                  value={activeDimension.name}
                                  onChange={(event) => updateDimensionField(activeDimensionIndex, 'name', event.target.value)}
                                  placeholder="例如：教学设计"
                                />
                              </div>
                              <div>
                                <div className="cap-model-field-label">能力类说明</div>
                                <Input
                                  value={activeDimension.description}
                                  onChange={(event) => updateDimensionField(activeDimensionIndex, 'description', event.target.value)}
                                  placeholder="说明该能力类聚焦的核心能力范围"
                                />
                              </div>
                            </div>
                          </div>

                          {activeItem ? (
                            <div className="cap-model-item-card">
                              <div className="cap-model-item-head">
                                <div>
                                  <div className="cap-model-item-title">当前能力项</div>
                                  <div className="cap-model-name-sub">
                                    能力项 {activeItemIndex + 1} / 行为描述按等级逐项填写
                                  </div>
                                </div>
                                <Space size={4} wrap>
                                  <Button size="small" onClick={() => moveItem(activeDimensionIndex, activeItemIndex, -1)} disabled={activeItemIndex === 0}>上移</Button>
                                  <Button size="small" onClick={() => moveItem(activeDimensionIndex, activeItemIndex, 1)} disabled={activeItemIndex === activeDimension.items.length - 1}>下移</Button>
                                  <Button size="small" danger onClick={() => removeItem(activeDimensionIndex, activeItemIndex)} disabled={activeDimension.items.length === 1}>删除</Button>
                                </Space>
                              </div>

                              <div className="cap-model-form-grid cap-model-form-grid-2">
                                <div>
                                  <div className="cap-model-field-label">能力项名称</div>
                                  <Input
                                    value={activeItem.name}
                                    onChange={(event) => updateItemField(activeDimensionIndex, activeItemIndex, 'name', event.target.value)}
                                    placeholder="例如：目标与学情对齐"
                                  />
                                </div>
                                <div>
                                  <div className="cap-model-field-label">能力项说明</div>
                                  <Input
                                    value={activeItem.description}
                                    onChange={(event) => updateItemField(activeDimensionIndex, activeItemIndex, 'description', event.target.value)}
                                    placeholder="说明该能力项关注的行为表现"
                                  />
                                </div>
                              </div>

                              <div className="cap-model-form-grid cap-model-form-grid-2">
                                <div>
                                  <div className="cap-model-field-label">证据类型</div>
                                  <Select
                                    mode="multiple"
                                    value={activeItem.evidenceTypes || []}
                                    onChange={(values) => updateItemStringListField(activeDimensionIndex, activeItemIndex, 'evidenceTypes', values)}
                                    options={CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS}
                                    placeholder="选择该能力项允许使用的证据类型"
                                  />
                                </div>
                                <div>
                                  <div className="cap-model-field-label">评价主体</div>
                                  <Select
                                    mode="multiple"
                                    value={activeItem.requiredReviewRoles || []}
                                    onChange={(values) => updateItemStringListField(activeDimensionIndex, activeItemIndex, 'requiredReviewRoles', values)}
                                    options={CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS}
                                    placeholder="选择该能力项的复核主体"
                                  />
                                </div>
                              </div>

                              <div className="cap-model-form-grid cap-model-form-grid-2">
                                <div>
                                  <div className="cap-model-field-label">最低证据数</div>
                                  <InputNumber
                                    min={1}
                                    max={10}
                                    value={activeItem.requiredEvidenceCount || 1}
                                    onChange={(value) => updateItemField(activeDimensionIndex, activeItemIndex, 'requiredEvidenceCount', value || 1)}
                                  />
                                </div>
                                <div>
                                  <div className="cap-model-field-label">AI辅助策略</div>
                                  <Select
                                    value={activeItem.aiAssistMode || 'SUGGEST_ONLY'}
                                    onChange={(value) => updateItemField(activeDimensionIndex, activeItemIndex, 'aiAssistMode', value)}
                                    options={CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS}
                                  />
                                </div>
                              </div>

                              <div className="cap-model-form-grid cap-model-form-grid-2">
                                <div>
                                  <div className="cap-model-field-label">成长档案专用</div>
                                  <Switch
                                    checked={Boolean(activeItem.isGrowthOnly)}
                                    checkedChildren="是"
                                    unCheckedChildren="否"
                                    onChange={(checked) => updateItemField(activeDimensionIndex, activeItemIndex, 'isGrowthOnly', checked)}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="cap-model-field-label">成长记录示例</div>
                                <TextArea
                                  rows={2}
                                  value={(activeItem.evidenceExamples || []).join('\n')}
                                  onChange={(event) => updateItemEvidence(activeDimensionIndex, activeItemIndex, event.target.value)}
                                  placeholder="每行一条，例如：课堂观察记录"
                                />
                              </div>

                              <div className="cap-model-descriptor-panel">
                                <div className="cap-model-subsection-head">
                                  <span>等级行为描述</span>
                                  <Tag>{modelDraft.levelScheme.levels.length} 个等级</Tag>
                                </div>
                                <Tabs
                                  size="small"
                                  items={modelDraft.levelScheme.levels.map((level, levelIndex) => ({
                                    key: level.key,
                                    label: level.label,
                                    children: (
                                      <div className="cap-model-descriptor-tab">
                                        <div className="cap-model-field-label">{level.label}</div>
                                        <TextArea
                                          rows={6}
                                          value={activeItem.levelDescriptors?.[levelIndex]?.text || ''}
                                          onChange={(event) => updateItemDescriptor(activeDimensionIndex, activeItemIndex, levelIndex, event.target.value)}
                                          placeholder={`填写 ${level.label} 的行为描述`}
                                        />
                                      </div>
                                    ),
                                  }))}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="cap-model-empty-panel">
                              <Empty description="当前能力类下暂无能力项，请先新增能力项" />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="cap-model-empty-panel">
                        <Empty description="请选择一个能力类开始编辑" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={importModalOpen}
        title="导入模型"
        width={860}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Tabs
          activeKey={importTab}
          onChange={setImportTab}
          items={[
            {
              key: 'library',
              label: '资料库',
              children: (
                <div className="cap-model-import-panel">
                  <div className="cap-model-import-toolbar">
                    <Input
                      value={importKeyword}
                      onChange={(event) => setImportKeyword(event.target.value)}
                      placeholder="搜索模型名称 / 编码 / 岗位"
                      allowClear
                      style={{ width: 280 }}
                    />
                    <Button
                      type="primary"
                      icon={<InboxOutlined />}
                      disabled={!selectedImportModelId}
                      onClick={handleImportFromLibrary}
                    >
                      导入为草稿
                    </Button>
                  </div>

                  <div className="cap-model-import-grid">
                    {importableLibraryModels.length ? importableLibraryModels.map((item) => {
                      const role = roles.find((roleItem) => roleItem.id === item.roleId);
                      const sequence = getSequenceForRole(role, sequences);
                      const roleLevel = getRoleLevel(role, item.roleLevelId, sequences);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`cap-model-import-card ${selectedImportModelId === item.id ? 'is-active' : ''}`}
                          onClick={() => setSelectedImportModelId(item.id)}
                        >
                          <div className="cap-model-import-card-head">
                            <strong>{item.name}</strong>
                          </div>
                          <span>{item.modelCode}</span>
                          <span>{industries.find((industry) => industry.id === item.industryId)?.name || '-'} / {role?.name || '-'}</span>
                          <span>{sequence?.name || '-'} / {roleLevel?.name || '-'}</span>
                          <span>{item.dimensions?.length || 0} 类 / {getTotalCapabilityItems(item)} 项</span>
                        </button>
                      );
                    }) : (
                      <div className="cap-model-empty-panel">
                        <Empty description="暂无可导入的资料库模型" />
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'upload',
              label: '文件上传',
              children: (
                <div className="cap-model-import-panel">
                  <Alert
                    type="info"
                    showIcon
                    message="支持上传 JSON、Markdown、TXT 文件"
                    description="Markdown 推荐使用系统导出的模型文档格式；解析成功后会先载入编辑器，不会直接覆盖现有模型。"
                  />
                  <Upload.Dragger
                    accept=".json,.md,.markdown,.txt"
                    showUploadList={false}
                    beforeUpload={handleImportFile}
                    className="cap-model-upload-dragger"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到这里上传</p>
                    <p className="ant-upload-hint">建议上传从系统导出的 Markdown，或包含模型结构的 JSON 文件。</p>
                  </Upload.Dragger>

                  {uploadedImportDraft ? (
                    <div className="cap-model-upload-summary">
                      <div className="cap-model-import-card-head">
                        <strong>{uploadedImportDraft.name}</strong>
                        <Tag color="blue">{uploadedImportName}</Tag>
                      </div>
                      <div className="cap-model-upload-summary-grid">
                        <span>模型编码：{uploadedImportDraft.modelCode}</span>
                        <span>能力类：{uploadedImportDraft.dimensions?.length || 0}</span>
                        <span>能力项：{getTotalCapabilityItems(uploadedImportDraft)}</span>
                        <span>等级数：{uploadedImportDraft.levelScheme?.levels?.length || 0}</span>
                      </div>
                      <div className="cap-model-import-actions">
                        <Button onClick={() => {
                          setUploadedImportDraft(null);
                          setUploadedImportName('');
                        }}
                        >
                          清空
                        </Button>
                        <Button type="primary" icon={<ImportOutlined />} onClick={handleLoadUploadedDraft}>
                          载入到编辑器
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="cap-model-empty-panel">
                      <Empty description="上传文件后会在这里显示导入摘要" />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        open={industryModalOpen}
        title={industryEditing ? '编辑行业' : '新增行业'}
        onCancel={() => {
          setIndustryModalOpen(false);
          setIndustryEditing(null);
        }}
        onOk={handleSaveIndustry}
        destroyOnClose
      >
        <Form form={industryForm} layout="vertical" initialValues={createIndustryDraft()}>
          <Form.Item label="行业名称" name="name" rules={[{ required: true, message: '请输入行业名称' }]}>
            <Input placeholder="例如：基础教育" />
          </Form.Item>
          <Form.Item label="行业编码" name="code" rules={[{ required: true, message: '请输入行业编码' }]}>
            <Input placeholder="例如：BASIC_EDU" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={INDUSTRY_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="排序号" name="sortNo">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} placeholder="说明该行业覆盖的典型岗位和适用边界" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={sequenceModalOpen}
        title={sequenceEditing ? '编辑能力序列' : '新增能力序列'}
        onCancel={() => {
          setSequenceModalOpen(false);
          setSequenceEditing(null);
        }}
        onOk={handleSaveSequence}
        destroyOnClose
      >
        <Form form={sequenceForm} layout="vertical" initialValues={createSequenceDraft()}>
          <Form.Item label="所属行业" name="industryId" rules={[{ required: true, message: '请选择所属行业' }]}>
            <Select options={activeIndustryOptions} placeholder="选择行业" />
          </Form.Item>
          <Form.Item label="序列名称" name="name" rules={[{ required: true, message: '请输入序列名称' }]}>
            <Input placeholder="例如：教师发展序列" />
          </Form.Item>
          <Form.Item label="序列编码" name="code" rules={[{ required: true, message: '请输入序列编码' }]}>
            <Input placeholder="例如：TEACHER_GROWTH" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={ROLE_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="排序号" name="sortNo">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} placeholder="说明该序列适用的人才发展通道或阶段划分逻辑" />
          </Form.Item>
          <Form.List name="levels">
            {(fields, { add, remove }) => (
              <div className="cap-model-sequence-levels">
                <div className="cap-model-subsection-head">
                  <span>序列等级</span>
                  <Button
                    size="small"
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add(createSequenceLevelDraft())}
                  >
                    新增等级
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.key} className="cap-model-sequence-level-card">
                    <div className="cap-model-item-head">
                      <div className="cap-model-item-title">等级 {index + 1}</div>
                      <Button
                        size="small"
                        danger
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                      >
                        删除
                      </Button>
                    </div>
                    <div className="cap-model-form-grid cap-model-form-grid-2">
                      <Form.Item
                        {...field}
                        label="等级名称"
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: '请输入等级名称' }]}
                      >
                        <Input placeholder="例如：青年教师" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        label="等级编码"
                        name={[field.name, 'code']}
                        rules={[{ required: true, message: '请输入等级编码' }]}
                      >
                        <Input placeholder="例如：YOUNG" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        label="等级说明"
                        name={[field.name, 'description']}
                        className="cap-model-form-span-2"
                      >
                        <Input placeholder="说明该序列等级的典型职责、经验要求或适用边界" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        open={roleModalOpen}
        title={roleEditing ? '编辑岗位' : '新增岗位'}
        onCancel={() => {
          setRoleModalOpen(false);
          setRoleEditing(null);
        }}
        onOk={handleSaveRole}
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical" initialValues={createRoleDraft()}>
          <Form.Item label="所属行业" name="industryId" rules={[{ required: true, message: '请选择所属行业' }]}>
            <Select options={activeIndustryOptions} placeholder="选择行业" />
          </Form.Item>
          <Form.Item label="岗位名称" name="name" rules={[{ required: true, message: '请输入岗位名称' }]}>
            <Input placeholder="例如：教师" />
          </Form.Item>
          <Form.Item label="岗位编码" name="code" rules={[{ required: true, message: '请输入岗位编码' }]}>
            <Input placeholder="例如：TEACHER" />
          </Form.Item>
          <Form.Item label="主能力序列" name="sequenceId" rules={[{ required: true, message: '请选择主能力序列' }]}>
            <Select options={activeSequenceOptions} placeholder="选择岗位主能力序列" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={ROLE_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="排序号" name="sortNo">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} placeholder="说明该岗位的适用层级、职责范围或使用建议" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
