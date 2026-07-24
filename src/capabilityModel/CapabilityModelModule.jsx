import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ImportOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
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
  writeCapabilityModelEditSession,
} from './api';
import {
  getRoleLevel,
  getSequenceForRole,
} from '../shared/profileEvidence';
import {
  CapabilityModelEditorPanel,
  CapabilityModelPreview,
} from './CapabilityModelShared';
import {
  MAX_CAPABILITY_DIMENSION_LEVEL,
  getCapabilityDimensionEntry,
  getCapabilityDimensionInsertIndex,
  removeCapabilityDimensionSubtree,
  getActiveCapabilityFrameworkSelection,
  getTotalCapabilityItems,
  moveCapabilityModelListItem,
  syncDimensionsToLevelScheme,
} from './shared';
import '../system/SystemModule.css';
import './CapabilityModelModule.css';

const { TextArea } = Input;

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

function getCapabilityModelStatusMeta(model) {
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

function renderCapabilityModelStatusTag(model, className = '') {
  const statusMeta = getCapabilityModelStatusMeta(model);
  return <Tag color={statusMeta.color} className={className}>{statusMeta.label}</Tag>;
}

function getCapabilityModelVersionLabel(model) {
  const versionNumber = Math.max(1, Number(model?.versionNumber || 1));
  return `版本 ${versionNumber}`;
}

function getCapabilityModelVersionSeriesId(model) {
  return model?.versionSeriesId || model?.id || '';
}

function compareCapabilityModelVersions(left, right) {
  const versionGap = Number(right?.versionNumber || 1) - Number(left?.versionNumber || 1);
  if (versionGap !== 0) return versionGap;
  return String(right?.updatedAt || '').localeCompare(String(left?.updatedAt || ''));
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

function createRuleDraft(roleId, roles = [], sequences = [], industryId) {
  const role = roles.find((item) => item.id === roleId);
  const sequence = sequences.find((item) => item.id === role?.sequenceId);
  return {
    industryId: role?.industryId || sequence?.industryId || industryId || undefined,
    roleId: role?.id || undefined,
    sequenceId: role?.sequenceId || undefined,
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    sortNo: 1,
  };
}

function cloneDraft(data) {
  return JSON.parse(JSON.stringify(data));
}

function sortBySortNo(list) {
  return [...list].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0));
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

function buildSequenceRuleImportResolver(sequenceId, rules = [], fallbackOptions = []) {
  const map = new Map();
  fallbackOptions.forEach((option) => {
    map.set(option.value, option.value);
    map.set(option.label, option.value);
  });
  (Array.isArray(rules) ? rules : [])
    .filter((item) => !sequenceId || item.sequenceId === sequenceId)
    .forEach((item) => {
      if (item.code) map.set(item.code, item.code);
      if (item.name) map.set(item.name, item.code);
    });
  return (value) => map.get(value) || value;
}

function mapRuleValues(values, resolveValue) {
  return (Array.isArray(values) ? values : [])
    .map((entry) => resolveValue(String(entry || '').trim()))
    .filter(Boolean);
}

function buildSequenceRuleOptions(rules = [], sequenceId) {
  return (Array.isArray(rules) ? rules : [])
    .filter((item) => item.sequenceId === sequenceId && item.status === 'ACTIVE')
    .sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0))
    .map((item) => ({
      value: item.code,
      label: item.name,
    }));
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

function parseCapabilityModelMarkdown(text, industries, roles, sequences, evidenceTypes, reviewSubjects, fileName = '') {
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
  const importRole = roles.find((item) => item.id === scope.roleId);
  const importSequenceId = importRole?.sequenceId || '';
  const resolveEvidenceType = buildSequenceRuleImportResolver(
    importSequenceId,
    evidenceTypes,
    CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS,
  );
  const resolveReviewSubject = buildSequenceRuleImportResolver(
    importSequenceId,
    reviewSubjects,
    CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS,
  );

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
        evidenceTypes: mapRuleValues(item.evidenceTypes, resolveEvidenceType),
        levelDescriptors: levelScheme.levels.map((level, index) => ({
          levelKey: level.key,
          text: item.levelDescriptors?.[index]?.text || '',
        })),
        requiredReviewRoles: mapRuleValues(item.requiredReviewRoles, resolveReviewSubject),
        aiAssistMode: CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS.find((option) => option.label === item.aiAssistMode)?.value || item.aiAssistMode,
      })),
    })),
  });
}

function parseCapabilityModelJson(text, industries, roles, sequences, evidenceTypes, reviewSubjects, fileName = '') {
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
  const importRole = roles.find((item) => item.id === scope.roleId);
  const importSequenceId = importRole?.sequenceId || '';
  const resolveEvidenceType = buildSequenceRuleImportResolver(
    importSequenceId,
    evidenceTypes,
    CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS,
  );
  const resolveReviewSubject = buildSequenceRuleImportResolver(
    importSequenceId,
    reviewSubjects,
    CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS,
  );
  const mappedDimensions = (payload.dimensions || []).map((dimension) => ({
    ...dimension,
    items: (dimension.items || []).map((item) => ({
      ...item,
      evidenceTypes: mapRuleValues(item.evidenceTypes, resolveEvidenceType),
      requiredReviewRoles: mapRuleValues(item.requiredReviewRoles, resolveReviewSubject),
    })),
  }));

  return createCapabilityModelDraft({
    ...payload,
    id: undefined,
    name: payload.name || fileName.replace(/\.[^.]+$/, '') || '导入能力模型',
    modelCode: makeImportedModelCode(payload.modelCode),
    industryId: scope.industryId,
    roleId: scope.roleId,
    roleLevelId: scope.roleLevelId,
    status: 'DRAFT',
    dimensions: mappedDimensions,
  });
}

function parseImportedCapabilityFile(text, fileName, industries, roles, sequences, evidenceTypes, reviewSubjects) {
  const lowerName = String(fileName || '').toLowerCase();
  if (lowerName.endsWith('.json')) {
    return parseCapabilityModelJson(text, industries, roles, sequences, evidenceTypes, reviewSubjects, fileName);
  }
  return parseCapabilityModelMarkdown(text, industries, roles, sequences, evidenceTypes, reviewSubjects, fileName);
}

export default function CapabilityModelModule({
  standalone = false,
  entryModelId = null,
  entryMode = 'preview',
  entryRequestId = null,
  mode = 'models',
}) {
  const isIndustryRolesModule = mode === 'industryRoles';
  const [activeTab, setActiveTab] = useState(isIndustryRolesModule ? 'resources' : 'models');
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [roles, setRoles] = useState([]);
  const [models, setModels] = useState([]);
  const [evidenceTypes, setEvidenceTypes] = useState([]);
  const [reviewSubjects, setReviewSubjects] = useState([]);

  const [industryKeyword, setIndustryKeyword] = useState('');
  const [sequenceKeyword, setSequenceKeyword] = useState('');
  const [sequenceIndustryFilter, setSequenceIndustryFilter] = useState(undefined);
  const [roleKeyword, setRoleKeyword] = useState('');
  const [roleIndustryFilter, setRoleIndustryFilter] = useState(undefined);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleIndustryFilter, setRuleIndustryFilter] = useState(undefined);
  const [ruleRoleFilter, setRuleRoleFilter] = useState(undefined);

  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [modelDrawerMode, setModelDrawerMode] = useState('create');
  const [modelDraft, setModelDraft] = useState(() => createCapabilityModelDraft());
  const [activeDimensionId, setActiveDimensionId] = useState(undefined);
  const [activeItemId, setActiveItemId] = useState(undefined);
  const [standaloneModelId, setStandaloneModelId] = useState(() => (standalone ? entryModelId : null));

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
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleModalType, setRuleModalType] = useState('evidenceType');
  const [ruleEditing, setRuleEditing] = useState(null);

  const [industryForm] = Form.useForm();
  const [sequenceForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [modelBaseForm] = Form.useForm();

  const watchedIndustryId = Form.useWatch('industryId', modelBaseForm);
  const watchedRoleId = Form.useWatch('roleId', modelBaseForm);
  const watchedRoleIndustryId = Form.useWatch('industryId', roleForm);
  const watchedRuleIndustryId = Form.useWatch('industryId', ruleForm);
  const watchedRuleRoleId = Form.useWatch('roleId', ruleForm);
  const watchedRuleSequenceId = Form.useWatch('sequenceId', ruleForm);
  const handledEntryRequestRef = useRef(null);

  const replaceStandaloneHash = useCallback((modelId, mode = 'preview') => {
    if (!standalone || !modelId || typeof window === 'undefined') return;
    const params = new URLSearchParams({
      modelId,
      mode,
    });
    if (entryRequestId) {
      params.set('requestId', entryRequestId);
    }
    const nextUrl = `${window.location.pathname}${window.location.search}#capability-model-full?${params.toString()}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl === nextUrl) return;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [entryRequestId, standalone]);

  const syncStandaloneEditSession = useCallback((record, editorState, options = {}) => {
    if (!standalone || !entryRequestId || !record?.id) return null;
    return writeCapabilityModelEditSession({
      requestId: entryRequestId,
      currentModelId: record.id,
      versionSeriesId: record.versionSeriesId || record.id,
      updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
      editorState,
      bumpRevision: options.bumpRevision === true,
    });
  }, [entryRequestId, standalone]);

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
    if (!ruleModalOpen) return;
    const currentRoleId = ruleForm.getFieldValue('roleId');
    if (!currentRoleId || !watchedRuleIndustryId) return;
    const currentRole = roles.find((item) => item.id === currentRoleId);
    if (currentRole?.industryId !== watchedRuleIndustryId) {
      ruleForm.setFieldsValue({
        roleId: undefined,
        sequenceId: undefined,
      });
    }
  }, [roles, ruleForm, ruleModalOpen, watchedRuleIndustryId]);

  useEffect(() => {
    if (!ruleModalOpen || !watchedRuleRoleId) return;
    const role = roles.find((item) => item.id === watchedRuleRoleId);
    if (!role) return;
    ruleForm.setFieldsValue({
      industryId: role.industryId || undefined,
      sequenceId: role.sequenceId || undefined,
    });
  }, [roles, ruleForm, ruleModalOpen, watchedRuleRoleId]);

  useEffect(() => {
    if (!modelDrawerOpen || modelDrawerMode === 'preview') return;
    const dimensions = modelDraft?.dimensions || [];
    const frameId = window.requestAnimationFrame(() => {
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
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeDimensionId, activeItemId, modelDraft, modelDrawerMode, modelDrawerOpen]);

  const loadAllData = useCallback(async (withLoading = true) => {
    if (withLoading) setLoading(true);
    try {
      await capabilityModelApi.seed();
      const [nextIndustries, nextSequences, nextRoles, nextModels, nextEvidenceTypes, nextReviewSubjects] = await Promise.all([
        capabilityModelApi.listIndustries(),
        capabilityModelApi.listSequences(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listModels(),
        capabilityModelApi.listEvidenceTypes(),
        capabilityModelApi.listReviewSubjects(),
      ]);
      setIndustries(sortBySortNo(nextIndustries));
      setSequences(nextSequences);
      setRoles(nextRoles);
      setModels(nextModels);
      setEvidenceTypes(nextEvidenceTypes);
      setReviewSubjects(nextReviewSubjects);
    } catch (error) {
      message.error(getErrorMessage(error, '加载能力模型数据失败'));
    } finally {
      if (withLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadAllData();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [loadAllData]);

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

  const ruleRoleOptions = useMemo(() => roles.map((role) => {
    const industry = industries.find((item) => item.id === role.industryId);
    const sequence = sequences.find((item) => item.id === role.sequenceId);
    return {
      value: role.id,
      label: `${role.name} / ${sequence?.name || '未绑定序列'}`,
      industryId: role.industryId,
      sequenceId: role.sequenceId,
      status: role.status,
      searchText: `${role.name} ${role.code} ${industry?.name || ''} ${sequence?.name || ''}`,
    };
  }), [industries, roles, sequences]);

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

  const activeRuleRoleOptions = useMemo(() => (
    ruleRoleOptions.filter((item) => !watchedRuleIndustryId || item.industryId === watchedRuleIndustryId)
  ), [ruleRoleOptions, watchedRuleIndustryId]);

  const filteredRuleRoleOptions = useMemo(() => (
    ruleRoleOptions.filter((item) => !ruleIndustryFilter || item.industryId === ruleIndustryFilter)
  ), [ruleIndustryFilter, ruleRoleOptions]);

  const modelRuleSequenceId = useMemo(() => {
    const role = roles.find((item) => item.id === (watchedRoleId || modelDraft?.roleId));
    return role?.sequenceId || '';
  }, [modelDraft?.roleId, roles, watchedRoleId]);

  const activeEvidenceTypeOptions = useMemo(
    () => buildSequenceRuleOptions(evidenceTypes, modelRuleSequenceId),
    [evidenceTypes, modelRuleSequenceId],
  );

  const activeReviewSubjectOptions = useMemo(
    () => buildSequenceRuleOptions(reviewSubjects, modelRuleSequenceId),
    [modelRuleSequenceId, reviewSubjects],
  );

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

  const filterSequenceRules = useCallback((rules) => {
    const keyword = ruleKeyword.trim().toLowerCase();
    const selectedRole = roles.find((role) => role.id === ruleRoleFilter);
    return rules.filter((item) => {
      const sequence = sequences.find((sequenceItem) => sequenceItem.id === item.sequenceId);
      const industry = industries.find((industryItem) => industryItem.id === sequence?.industryId);
      const boundRoles = roles.filter((role) => role.sequenceId === item.sequenceId);
      const roleNames = boundRoles.map((role) => role.name).join(' ');
      if (ruleIndustryFilter && sequence?.industryId !== ruleIndustryFilter) return false;
      if (ruleRoleFilter && item.sequenceId !== selectedRole?.sequenceId) return false;
      if (!keyword) return true;
      return `${item.name} ${item.code} ${item.description || ''} ${roleNames} ${sequence?.name || ''} ${industry?.name || ''}`.toLowerCase().includes(keyword);
    });
  }, [industries, roles, ruleIndustryFilter, ruleKeyword, ruleRoleFilter, sequences]);

  const filteredEvidenceTypes = useMemo(
    () => filterSequenceRules(evidenceTypes),
    [evidenceTypes, filterSequenceRules],
  );

  const filteredReviewSubjects = useMemo(
    () => filterSequenceRules(reviewSubjects),
    [filterSequenceRules, reviewSubjects],
  );

  const watchedRuleRole = useMemo(
    () => roles.find((item) => item.id === watchedRuleRoleId),
    [roles, watchedRuleRoleId],
  );

  const ruleModalSequence = useMemo(
    () => sequences.find((item) => item.id === (watchedRuleRole?.sequenceId || watchedRuleSequenceId)),
    [sequences, watchedRuleRole?.sequenceId, watchedRuleSequenceId],
  );

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
    return getActiveCapabilityFrameworkSelection(modelDraft, activeDimensionId, activeItemId);
  }, [activeDimensionId, activeItemId, modelDraft]);

  const activeDimension = activeFrameworkSelection.dimension;
  const activeDimensionIndex = activeFrameworkSelection.dimensionIndex;
  const activeItem = activeFrameworkSelection.item;
  const activeItemIndex = activeFrameworkSelection.itemIndex;
  const isStandaloneEntry = standalone && Boolean(standaloneModelId);
  const standaloneSourceModel = useMemo(
    () => (standaloneModelId ? models.find((item) => item.id === standaloneModelId) || null : null),
    [models, standaloneModelId],
  );
  const standaloneVersionAnchor = useMemo(
    () => (standaloneSourceModel || (modelDraft?.id ? modelDraft : null)),
    [modelDraft, standaloneSourceModel],
  );
  const standaloneVersionOptions = useMemo(() => {
    const versionSeriesId = getCapabilityModelVersionSeriesId(standaloneVersionAnchor);
    if (!versionSeriesId) return [];
    return models
      .filter((item) => getCapabilityModelVersionSeriesId(item) === versionSeriesId)
      .sort(compareCapabilityModelVersions);
  }, [models, standaloneVersionAnchor]);

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

  const openEditModel = useCallback((record) => {
    if (standalone) {
      setStandaloneModelId(record.id);
      replaceStandaloneHash(record.id, 'edit');
      syncStandaloneEditSession(record, 'editing');
    }
    setModelDrawerMode('edit');
    setModelDraft(createCapabilityModelDraft(cloneDraft(record)));
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
  }, [replaceStandaloneHash, standalone, syncStandaloneEditSession]);

  const openPreviewModel = useCallback((record) => {
    if (standalone) {
      setStandaloneModelId(record.id);
      replaceStandaloneHash(record.id, 'preview');
      syncStandaloneEditSession(record, 'ended');
    }
    setModelDrawerMode('preview');
    setModelDraft(createCapabilityModelDraft(cloneDraft(record)));
    setActiveDimensionId(undefined);
    setActiveItemId(undefined);
    setModelDrawerOpen(true);
  }, [replaceStandaloneHash, standalone, syncStandaloneEditSession]);

  async function handleSaveModel() {
    try {
      const values = await modelBaseForm.validateFields();
      const saved = await capabilityModelApi.saveModel({
        ...modelDraft,
        ...values,
      });
      syncStandaloneEditSession(saved, 'editing', { bumpRevision: true });
      setModelDraft(createCapabilityModelDraft(saved));
      if (isStandaloneEntry) {
        setStandaloneModelId(saved.id);
        replaceStandaloneHash(saved.id, 'preview');
        setModelDrawerMode('preview');
        setModelDrawerOpen(true);
      } else {
        setModelDrawerOpen(false);
      }
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
      const draft = parseImportedCapabilityFile(text, file.name, industries, roles, sequences, evidenceTypes, reviewSubjects);
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

  const runStandaloneVersionAction = useCallback((action, options = {}) => {
    if (!standalone || modelDrawerMode !== 'edit') {
      void action();
      return;
    }
    Modal.confirm({
      title: options.title || '离开当前编辑？',
      content: options.content || '未保存的修改将丢失，确定继续吗？',
      okText: '继续',
      cancelText: '取消',
      onOk: action,
    });
  }, [modelDrawerMode, standalone]);

  const handleCreateVersionFromModel = useCallback(async (record) => {
    if (!record?.id) return;
    try {
      const draft = await capabilityModelApi.createVersion(record.id);
      openEditModel(draft);
      await loadAllData(false);
      message.success(`已基于${getCapabilityModelVersionLabel(record)}创建新版本草稿`);
    } catch (error) {
      message.error(getErrorMessage(error, '新建版本失败'));
    }
  }, [loadAllData, openEditModel]);

  const handleStartEditModel = useCallback(async (record) => {
    if (record.status === 'DRAFT') {
      openEditModel(record);
      return;
    }

    try {
      const draft = await capabilityModelApi.createVersion(record.id);
      openEditModel(draft);
      await loadAllData(false);
      message.success('已基于当前版本创建新版本草稿，可直接编辑');
    } catch (error) {
      message.error(getErrorMessage(error, '进入编辑失败'));
    }
  }, [loadAllData, openEditModel]);

  const handleSwitchStandaloneVersion = useCallback((record) => {
    if (!record) return;
    runStandaloneVersionAction(
      async () => openPreviewModel(record),
      {
        title: '切换版本？',
        content: '未保存的修改将丢失，确定切换到所选版本吗？',
      },
    );
  }, [openPreviewModel, runStandaloneVersionAction]);

  const handleCreateStandaloneVersion = useCallback((record) => {
    if (!record) return;
    runStandaloneVersionAction(
      async () => handleCreateVersionFromModel(record),
      {
        title: '新建版本？',
        content: '未保存的修改将丢失，确定基于当前版本创建新版本吗？',
      },
    );
  }, [handleCreateVersionFromModel, runStandaloneVersionAction]);

  useEffect(() => {
    if (!entryModelId || !entryRequestId) return;
    if (handledEntryRequestRef.current === entryRequestId) return;
    const matchedModel = models.find((item) => item.id === entryModelId) || null;
    if (!matchedModel) return;

    const frameId = window.requestAnimationFrame(() => {
      handledEntryRequestRef.current = entryRequestId;
      setStandaloneModelId(entryModelId);
      setActiveTab('models');
      if (entryMode === 'edit') {
        void handleStartEditModel(matchedModel);
        return;
      }
      openPreviewModel(matchedModel);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [entryMode, entryModelId, entryRequestId, handleStartEditModel, models, openPreviewModel]);

  function handleOpenStandalonePreview() {
    const sourceModel = standaloneSourceModel || modelDraft;
    if (!sourceModel) return;
    openPreviewModel(sourceModel);
  }

  function handleOpenStandaloneEdit() {
    const sourceModel = standaloneSourceModel || modelDraft;
    if (!sourceModel) return;
    if ((sourceModel.status || 'DRAFT') === 'DRAFT') {
      openEditModel(sourceModel);
      return;
    }
    void handleStartEditModel(sourceModel);
  }

  if (isStandaloneEntry) {
    const standaloneLocalModel = modelDrawerMode === 'edit'
      ? modelDraft
      : (modelDraft?.id === standaloneModelId ? modelDraft : null);
    const standaloneViewMode = modelDrawerMode === 'edit' ? 'edit' : 'preview';
    const standaloneModel = standaloneViewMode === 'edit'
      ? standaloneLocalModel
      : (standaloneLocalModel || standaloneSourceModel);
    const standaloneRole = roles.find((item) => item.id === standaloneModel?.roleId) || null;
    const standaloneSequence = getSequenceForRole(standaloneRole, sequences);
    const standaloneRoleLevel = getRoleLevel(standaloneRole, standaloneModel?.roleLevelId, sequences) || null;
    const standaloneStatusLabel = getCapabilityModelStatusMeta(standaloneModel).label;
    const standaloneReady = standaloneViewMode === 'edit' ? Boolean(standaloneLocalModel) : Boolean(standaloneModel);
    const standaloneCurrentVersion = standaloneModel || standaloneSourceModel || standaloneLocalModel || standaloneVersionAnchor;
    const standaloneVersionMenuItems = [
      {
        key: 'current',
        label: (
          <span className="cap-model-version-current">
            当前：{getCapabilityModelVersionLabel(standaloneCurrentVersion)}
            {renderCapabilityModelStatusTag(standaloneCurrentVersion, 'cap-model-version-current-tag')}
          </span>
        ),
        disabled: true,
      },
      ...(standaloneVersionOptions.length ? [{ type: 'divider' }] : []),
      ...standaloneVersionOptions.map((version) => ({
        key: `switch-${version.id}`,
        icon: version.id === standaloneCurrentVersion?.id ? <CheckCircleOutlined /> : <BranchesOutlined />,
        label: (
          <span className="cap-model-version-option">
            <span>{getCapabilityModelVersionLabel(version)}</span>
            {renderCapabilityModelStatusTag(version, 'cap-model-version-option-tag')}
          </span>
        ),
        onClick: () => handleSwitchStandaloneVersion(version),
      })),
      { type: 'divider' },
      {
        key: 'new-version',
        icon: <PlusOutlined />,
        label: '新建版本',
        onClick: () => handleCreateStandaloneVersion(standaloneCurrentVersion),
      },
      ...(standaloneCurrentVersion?.status === 'DRAFT'
        ? [{
            key: 'publish',
            icon: <SendOutlined />,
            label: '发布当前版本',
            onClick: () => handlePublishModel(standaloneCurrentVersion),
          }]
        : []),
    ];

    return (
      <div className="sys-module capability-model-module cap-model-standalone-shell">
        <div className="cap-model-standalone-frame">
          <div className="cap-model-standalone-header">
            <div className="cap-model-standalone-copy">
              <div className="cap-model-standalone-kicker">
                {standaloneViewMode === 'edit' ? '能力模型编辑' : '能力模型预览'}
              </div>
              <div className="cap-model-standalone-title-row">
                <div className="cap-model-standalone-title">{standaloneModel?.name || '能力模型'}</div>
                {standaloneModel ? renderCapabilityModelStatusTag(standaloneModel) : null}
              </div>
              <div className="cap-model-standalone-subtitle">
                {standaloneModel
                  ? `${getCapabilityModelVersionLabel(standaloneModel)} · ${standaloneRole?.name || '-'} / ${standaloneRoleLevel?.name || '-'} / ${standaloneSequence?.name || '-'} · ${standaloneStatusLabel}`
                  : '正在加载当前能力模型'}
              </div>
            </div>
            <Space wrap className="cap-model-standalone-actions">
              {standaloneCurrentVersion ? (
                <Dropdown
                  menu={{ items: standaloneVersionMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button className="cap-model-version-btn" icon={<BranchesOutlined />}>
                    {getCapabilityModelVersionLabel(standaloneCurrentVersion)}
                    {renderCapabilityModelStatusTag(standaloneCurrentVersion, 'cap-model-version-tag')}
                  </Button>
                </Dropdown>
              ) : null}
              {standaloneViewMode === 'edit' ? (
                <>
                  <Button onClick={handleOpenStandalonePreview}>取消编辑</Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveModel}>
                    保存
                  </Button>
                </>
              ) : (
                <Button type="primary" icon={<EditOutlined />} onClick={handleOpenStandaloneEdit} disabled={!standaloneModel}>
                  编辑
                </Button>
              )}
            </Space>
          </div>

          <div className={`cap-model-standalone-body ${standaloneViewMode === 'edit' ? 'is-edit' : 'is-preview'}`}>
            {!standaloneReady ? (
              <div className="cap-model-standalone-placeholder">
                {!loading && !standaloneSourceModel && !standaloneLocalModel ? (
                  <Empty description="未找到该能力模型" />
                ) : (
                  <div className="cap-model-standalone-loading">正在加载能力模型...</div>
                )}
              </div>
            ) : standaloneViewMode === 'edit' ? (
              <CapabilityModelEditorPanel
                modelDraft={standaloneLocalModel}
                modelBaseForm={modelBaseForm}
                industryOptions={activeIndustryOptions}
                roleOptions={activeRoleOptions}
                roleLevelOptions={activeRoleLevelOptions}
                watchedRoleId={watchedRoleId}
                ruleSequenceId={modelRuleSequenceId}
                evidenceTypes={evidenceTypes}
                reviewSubjects={reviewSubjects}
                evidenceTypeOptions={activeEvidenceTypeOptions}
                reviewSubjectOptions={activeReviewSubjectOptions}
                activeDimension={activeDimension}
                activeDimensionIndex={activeDimensionIndex}
                activeItem={activeItem}
                activeItemIndex={activeItemIndex}
                onLevelCountChange={handleLevelCountChange}
                onLevelLabelChange={handleLevelLabelChange}
                onAddDimension={addDimension}
                onSelectDimension={selectDimension}
                onAddItem={addItem}
                onSelectItem={selectItem}
                onMoveDimension={moveDimension}
                onRemoveDimension={removeDimension}
                onUpdateDimensionField={updateDimensionField}
                onMoveItem={moveItem}
                onRemoveItem={removeItem}
                onUpdateItemField={updateItemField}
                onUpdateItemStringListField={updateItemStringListField}
                onUpdateItemEvidence={updateItemEvidence}
                onUpdateItemDescriptor={updateItemDescriptor}
              />
            ) : (
              <CapabilityModelPreview
                model={standaloneModel}
                industries={industries}
                roles={roles}
                sequences={sequences}
                evidenceTypes={evidenceTypes}
                reviewSubjects={reviewSubjects}
                showHero={false}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  async function handlePublishModel(record) {
    try {
      let targetRecord = record;
      if (standalone && modelDrawerMode === 'edit' && modelDraft?.id === record?.id) {
        const values = await modelBaseForm.validateFields();
        const saved = await capabilityModelApi.saveModel({
          ...modelDraft,
          ...values,
        });
        setModelDraft(createCapabilityModelDraft(saved));
        targetRecord = saved;
      }
      const published = await capabilityModelApi.publishModel(targetRecord.id);
      syncStandaloneEditSession(published, 'editing', { bumpRevision: true });
      await loadAllData(false);
      if (standalone && published?.id) {
        openPreviewModel(published);
      }
      message.success('模型已发布');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '发布模型失败'));
    }
  }

  useEffect(() => {
    if (!standalone || !entryRequestId || typeof window === 'undefined') return undefined;

    const handlePageHide = () => {
      const targetRecord = standaloneSourceModel || modelDraft || (standaloneModelId ? {
        id: standaloneModelId,
        versionSeriesId: standaloneModelId,
      } : null);
      syncStandaloneEditSession(targetRecord, 'ended');
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [
    entryRequestId,
    modelDraft,
    standalone,
    standaloneModelId,
    standaloneSourceModel,
    syncStandaloneEditSession,
  ]);

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

  function openRuleModal(type, record, roleId) {
    const matchedRole = record
      ? roles.find((item) => item.sequenceId === record.sequenceId)
      : roles.find((item) => item.id === roleId);
    const matchedSequence = sequences.find((item) => item.id === (record?.sequenceId || matchedRole?.sequenceId));
    const draft = record
      ? {
          ...record,
          industryId: matchedRole?.industryId || matchedSequence?.industryId,
          roleId: matchedRole?.id,
          sequenceId: record.sequenceId,
        }
      : createRuleDraft(roleId, roles, sequences, ruleIndustryFilter);
    setRuleModalType(type);
    setRuleEditing(record || null);
    ruleForm.setFieldsValue(draft);
    setRuleModalOpen(true);
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

  async function handleSaveRule() {
    try {
      const values = await ruleForm.validateFields();
      const { industryId, roleId, ...payload } = values;
      const role = roles.find((item) => item.id === roleId);
      const sequenceId = role?.sequenceId || payload.sequenceId;
      if (!sequenceId) {
        throw new Error('请选择适用岗位');
      }
      if (ruleModalType === 'evidenceType') {
        await capabilityModelApi.saveEvidenceType({
          ...ruleEditing,
          ...payload,
          sequenceId,
        });
      } else {
        await capabilityModelApi.saveReviewSubject({
          ...ruleEditing,
          ...payload,
          sequenceId,
        });
      }
      setRuleModalOpen(false);
      setRuleEditing(null);
      await loadAllData(false);
      message.success(ruleEditing ? '证据规则已更新' : '证据规则已创建');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '保存证据规则失败'));
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

  async function handleRemoveRule(type, record) {
    try {
      if (type === 'evidenceType') {
        await capabilityModelApi.removeEvidenceType(record.id);
      } else {
        await capabilityModelApi.removeReviewSubject(record.id);
      }
      await loadAllData(false);
      message.success('证据规则已删除');
    } catch (error) {
      message.error(getErrorMessage(error, '删除证据规则失败'));
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

  function addDimension(parentDimensionId = null) {
    const parentEntry = getCapabilityDimensionEntry(modelDraft.dimensions, parentDimensionId);
    if (parentDimensionId && (!parentEntry || parentEntry.level >= MAX_CAPABILITY_DIMENSION_LEVEL)) {
      message.warning(`能力类最多支持 ${MAX_CAPABILITY_DIMENSION_LEVEL} 个层级`);
      return;
    }
    const insertIndex = getCapabilityDimensionInsertIndex(modelDraft.dimensions, parentEntry?.dimension?.id || null);
    const nextDimension = createEmptyCapabilityDimension(modelDraft.levelScheme, {
      parentId: parentEntry?.dimension?.id || null,
      level: parentEntry ? parentEntry.level + 1 : 1,
      sortNo: insertIndex + 1,
    });
    updateModelDraftState((draft) => {
      draft.dimensions = [
        ...draft.dimensions.slice(0, insertIndex),
        nextDimension,
        ...draft.dimensions.slice(insertIndex),
      ].map((dimension, index) => ({ ...dimension, sortNo: index + 1 }));
      return draft;
    });
    setActiveDimensionId(nextDimension.id);
    setActiveItemId(nextDimension.items?.[0]?.id);
  }

  function removeDimension(index) {
    const dimensionId = modelDraft.dimensions[index]?.id;
    updateModelDraftState((draft) => {
      draft.dimensions = removeCapabilityDimensionSubtree(draft.dimensions, dimensionId);
      return draft;
    });
  }

  function moveDimension(index, delta) {
    updateModelDraftState((draft) => {
      draft.dimensions = moveCapabilityModelListItem(draft.dimensions, index, delta);
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

  function addItem(dimensionIndex, parentItemId = null) {
    const normalizedParentItemId = parentItemId || null;
    const nextItem = createEmptyCapabilityItem(modelDraft.levelScheme, {
      parentItemId: normalizedParentItemId,
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
      const targetItemId = dimension.items?.[itemIndex]?.id;
      const removedItemIds = new Set(targetItemId ? [targetItemId] : []);
      let changed = true;
      while (changed) {
        changed = false;
        (dimension.items || []).forEach((item) => {
          if (item.parentItemId && removedItemIds.has(item.parentItemId) && !removedItemIds.has(item.id)) {
            removedItemIds.add(item.id);
            changed = true;
          }
        });
      }
      dimension.items = dimension.items
        .filter((item, currentIndex) => currentIndex !== itemIndex && !removedItemIds.has(item.id))
        .map((item, currentIndex) => ({ ...item, sortNo: currentIndex + 1 }));
      return draft;
    });
  }

  function moveItem(dimensionIndex, itemIndex, delta) {
    updateModelDraftState((draft) => {
      const dimension = draft.dimensions[dimensionIndex];
      dimension.items = moveCapabilityModelListItem(dimension.items, itemIndex, delta);
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
            {record.status === 'DRAFT' ? '编辑' : '新建版本'}
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

  const createRuleColumns = (type) => [
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
    {
      title: '适用岗位 / 主序列',
      dataIndex: 'sequenceId',
      key: 'sequenceId',
      width: 240,
      render: (value) => {
        const sequence = sequences.find((item) => item.id === value);
        const industry = industries.find((item) => item.id === sequence?.industryId);
        const boundRoles = roles.filter((item) => item.sequenceId === value);
        const roleNames = boundRoles.length ? boundRoles.map((item) => item.name).join('、') : '未绑定岗位';
        return (
          <div className="cap-model-name-cell">
            <div className="cap-model-name">{roleNames}</div>
            <div className="cap-model-name-sub">{sequence ? `${industry?.name || '-'} / ${sequence.name}` : '-'}</div>
          </div>
        );
      },
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
      width: 90,
      render: (value) => renderStatusTag(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openRuleModal(type, record)}>编辑</Button>
          <Popconfirm
            title={type === 'evidenceType' ? '删除证据类型' : '删除评价主体'}
            description={`确定删除“${record.name}”吗？已被模型引用时不能删除。`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleRemoveRule(type, record)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const evidenceTypeColumns = createRuleColumns('evidenceType');
  const reviewSubjectColumns = createRuleColumns('reviewSubject');

  const modelTabContent = (
    <div className="cap-model-page">
      <div className="sys-table-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">模型库</span>
            <Tag>{models.length} 个结果</Tag>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={modelColumns}
          dataSource={models}
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

      <div className="sys-table-card cap-model-rule-card">
        <div className="sys-table-toolbar">
          <div className="sys-table-toolbar-left">
            <span className="cap-model-table-title">证据规则</span>
            <Tag>{filteredEvidenceTypes.length + filteredReviewSubjects.length}</Tag>
          </div>
          <div className="sys-table-toolbar-right">
            <Input
              value={ruleKeyword}
              onChange={(event) => setRuleKeyword(event.target.value)}
              placeholder="名称 / 编码 / 岗位"
              allowClear
              style={{ width: 220 }}
            />
            <Select
              value={ruleIndustryFilter}
              onChange={(value) => {
                setRuleIndustryFilter(value);
                const selectedRole = roles.find((item) => item.id === ruleRoleFilter);
                if (value && selectedRole?.industryId !== value) {
                  setRuleRoleFilter(undefined);
                }
              }}
              placeholder="筛选行业"
              allowClear
              style={{ width: 180 }}
              options={industryOptions}
            />
            <Select
              value={ruleRoleFilter}
              onChange={setRuleRoleFilter}
              placeholder="筛选岗位"
              allowClear
              style={{ width: 220 }}
              options={filteredRuleRoleOptions}
            />
          </div>
        </div>

        <div className="cap-model-rule-grid">
          <div className="cap-model-rule-table-panel">
            <div className="cap-model-rule-table-head">
              <div>
                <span className="cap-model-table-title">证据类型</span>
                <Tag>{filteredEvidenceTypes.length}</Tag>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openRuleModal('evidenceType', null, ruleRoleFilter)}>
                新增证据类型
              </Button>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              columns={evidenceTypeColumns}
              dataSource={filteredEvidenceTypes}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              scroll={{ x: 820 }}
            />
          </div>

          <div className="cap-model-rule-table-panel">
            <div className="cap-model-rule-table-head">
              <div>
                <span className="cap-model-table-title">评价主体</span>
                <Tag>{filteredReviewSubjects.length}</Tag>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openRuleModal('reviewSubject', null, ruleRoleFilter)}>
                新增评价主体
              </Button>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              columns={reviewSubjectColumns}
              dataSource={filteredReviewSubjects}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              scroll={{ x: 820 }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const moduleTitle = isIndustryRolesModule ? '行业岗位' : '能力模型';
  const moduleSubtitle = isIndustryRolesModule
    ? '维护行业、能力序列与岗位基础数据，为能力模型提供配置来源'
    : '构建覆盖基础教育、职业教育、高等教育等场景的能力模型框架与模板';
  const moduleBodyContent = isIndustryRolesModule ? resourceTabContent : modelTabContent;

  return (
    <div className={`sys-module capability-model-module ${isIndustryRolesModule ? 'cap-model-industry-role-module' : ''}`}>
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">{moduleTitle}</span>
          <span className="sys-module-header-subtitle">{moduleSubtitle}</span>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadAllData(false)}>刷新数据</Button>
          {!isIndustryRolesModule ? (
            <>
              <Button icon={<ImportOutlined />} onClick={openImportModal}>导入模型</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModel}>新建模型</Button>
            </>
          ) : null}
        </Space>
      </div>

      <div className="sys-module-body">
        {mode === 'all' ? (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'models', label: '模型库', children: modelTabContent },
              { key: 'resources', label: '行业岗位', children: resourceTabContent },
            ]}
          />
        ) : moduleBodyContent}
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
          <CapabilityModelPreview
            model={modelDraft}
            industries={industries}
            roles={roles}
            sequences={sequences}
            evidenceTypes={evidenceTypes}
            reviewSubjects={reviewSubjects}
          />
        ) : (
          <CapabilityModelEditorPanel
            modelDraft={modelDraft}
            modelBaseForm={modelBaseForm}
            industryOptions={activeIndustryOptions}
            roleOptions={activeRoleOptions}
            roleLevelOptions={activeRoleLevelOptions}
            watchedRoleId={watchedRoleId}
            ruleSequenceId={modelRuleSequenceId}
            evidenceTypes={evidenceTypes}
            reviewSubjects={reviewSubjects}
            evidenceTypeOptions={activeEvidenceTypeOptions}
            reviewSubjectOptions={activeReviewSubjectOptions}
            activeDimension={activeDimension}
            activeDimensionIndex={activeDimensionIndex}
            activeItem={activeItem}
            activeItemIndex={activeItemIndex}
            onLevelCountChange={handleLevelCountChange}
            onLevelLabelChange={handleLevelLabelChange}
            onAddDimension={addDimension}
            onSelectDimension={selectDimension}
            onAddItem={addItem}
            onSelectItem={selectItem}
            onMoveDimension={moveDimension}
            onRemoveDimension={removeDimension}
            onUpdateDimensionField={updateDimensionField}
            onMoveItem={moveItem}
            onRemoveItem={removeItem}
            onUpdateItemField={updateItemField}
            onUpdateItemStringListField={updateItemStringListField}
            onUpdateItemEvidence={updateItemEvidence}
            onUpdateItemDescriptor={updateItemDescriptor}
          />
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

      <Modal
        open={ruleModalOpen}
        title={`${ruleEditing ? '编辑' : '新增'}${ruleModalType === 'evidenceType' ? '证据类型' : '评价主体'}`}
        onCancel={() => {
          setRuleModalOpen(false);
          setRuleEditing(null);
        }}
        onOk={handleSaveRule}
        destroyOnClose
      >
        <Form form={ruleForm} layout="vertical" initialValues={createRuleDraft()}>
          <Form.Item label="所属行业" name="industryId" rules={[{ required: true, message: '请选择所属行业' }]}>
            <Select options={activeIndustryOptions} placeholder="选择行业" />
          </Form.Item>
          <Form.Item label="适用岗位" name="roleId" rules={[{ required: true, message: '请选择适用岗位' }]}>
            <Select
              options={activeRuleRoleOptions}
              placeholder="选择适用岗位"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="sequenceId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="主能力序列">
            <Input
              value={ruleModalSequence?.name || '选择岗位后自动带出'}
              readOnly
            />
          </Form.Item>
          <Form.Item
            label={ruleModalType === 'evidenceType' ? '证据类型名称' : '评价主体名称'}
            name="name"
            rules={[{ required: true, message: ruleModalType === 'evidenceType' ? '请输入证据类型名称' : '请输入评价主体名称' }]}
          >
            <Input placeholder={ruleModalType === 'evidenceType' ? '例如：课堂录像/回看' : '例如：教研组长'} />
          </Form.Item>
          <Form.Item
            label={ruleModalType === 'evidenceType' ? '证据类型编码' : '评价主体编码'}
            name="code"
            rules={[{ required: true, message: ruleModalType === 'evidenceType' ? '请输入证据类型编码' : '请输入评价主体编码' }]}
          >
            <Input placeholder={ruleModalType === 'evidenceType' ? '例如：CLASS_VIDEO' : '例如：GROUP_LEADER'} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={ROLE_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="排序号" name="sortNo">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} placeholder="说明该规则项适用的材料来源、使用边界或复核职责" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
