import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TreeSelect,
  Upload,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  StopOutlined,
  UpOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  ASSIGNED_ACCESS_RULE_OPTIONS,
  ENTRY_METHOD_OPTIONS,
  HOME_COMPONENT_OPTIONS,
  MODE_TAB_PRESET_OPTIONS,
  ROLE_DATA_ACCESS_AREA_OPTIONS,
  ROLE_FUNCTION_PERMISSION_MODE_OPTIONS,
  ROLE_DATA_SCOPE_OPTIONS,
  ROLE_FUNCTION_PERMISSION_OPTIONS,
  ROLE_FUNCTION_PERMISSION_TREE,
  STATUS_RULE_CONTROL_OPTIONS,
  STATUS_RULE_STAGE_OPTIONS,
  TEMPLATE_STATUS_OPTIONS,
  TOPIC_CARD_SIZE_OPTIONS,
  TOOL_OPTIONS,
  TOOL_PLACEMENT_OPTIONS,
  VERSION_CREATE_MODE_OPTIONS,
  buildSceneTypeStatusRules,
  createRoleDraft,
  createTemplateDraft,
  getAssignedAccessRuleLabel,
  getHomeComponentLabel,
  getRoleFunctionPermissionModeLabel,
  getSceneStoreChangeEventName,
  getSceneTypeLabel,
  getSceneTypeStatusGuidance,
  getSceneTypeStatusPreset,
  getStatusRuleControlLabel,
  getStatusRuleStageDescription,
  getStatusRuleStageLabel,
  getTopicCardSizeLabel,
  normalizeTopicCardConfig,
  normalizeVersioningConfig,
  sceneApi,
} from './api';
import FormDesignerV2 from '../processV2/form/FormDesignerV2';
import {
  SCENE_THEME_COVER_PRESETS,
  getSceneThemeCoverPreset,
  getSceneThemeCoverStyle,
} from './themeCovers';
import {
  SCENE_FOLDER_ICON_OPTIONS,
  SCENE_MODE_ICON_OPTIONS,
  SCENE_TOOL_ICON_OPTIONS,
  getSceneIconLabel,
  getSceneIconMeta,
  hasUploadedSceneIcon,
  renderSceneConfigIcon,
  resolveSceneFolderIconKey,
  resolveSceneModeTabIconKey,
  resolveSceneToolIconKey,
} from './iconCatalog.jsx';
import '../system/SystemModule.css';
import './SceneTemplateModule.css';

const { TextArea } = Input;
const TOPIC_THEME_MODE_OPTIONS = [
  { value: 'DEFAULT', label: '默认浅灰白' },
  { value: 'SCENE', label: '跟随场景色' },
];
const ROLE_LIBRARY_IMPORT_MODE_OPTIONS = [
  { value: 'COPY', label: '复制角色定义' },
  { value: 'REFERENCE', label: '引用角色定义' },
];
const MOCK_ROLE_LIBRARY = [
  {
    id: 'role_center_teacher',
    key: 'teacher',
    name: '教师',
    description: '负责授课组织、资料维护、课堂工具配置与学习反馈。',
    agentName: 'AI助教',
    functionalPermissionMode: 'INCLUDE',
    functionalPermissions: ['TOPIC_EDIT', 'RESOURCE_CREATE', 'RESOURCE_EDIT', 'TOOL_USE', 'LIVE_ACTIVITY_MANAGE', 'ASSESSMENT_CONFIG', 'RESULT_REVIEW'],
    permissionSummary: '可管理主题、资料、课堂工具和作业反馈。',
    dataAccessScope: 'ALL',
    assignedAccessRuleType: 'ALL',
    dataAccessAreas: [],
    authorizedFolderKeys: [],
    assignedAttributeRules: [],
    authorizedResourceRefs: [],
    scopeSummary: '拥有全部资料和教学过程数据的查看与管理权限。',
  },
  {
    id: 'role_center_student',
    key: 'student',
    name: '学员',
    description: '参与学习互动、资料查看与成果提交。',
    agentName: '',
    functionalPermissionMode: 'INCLUDE',
    functionalPermissions: ['TOOL_USE', 'RESULT_SUBMIT', 'COMMENT_INTERACT'],
    permissionSummary: '可参与互动、使用工具并提交成果。',
    dataAccessScope: 'PUBLIC',
    assignedAccessRuleType: 'ALL',
    dataAccessAreas: [],
    authorizedFolderKeys: [],
    assignedAttributeRules: [],
    authorizedResourceRefs: [],
    scopeSummary: '默认查看公开资料，并参与互动与成果提交流程。',
  },
  {
    id: 'role_center_reviewer',
    key: 'reviewer',
    name: '评阅老师',
    description: '负责查看成果、完成评阅和反馈说明。',
    agentName: '',
    functionalPermissionMode: 'INCLUDE',
    functionalPermissions: ['TOOL_USE', 'ASSESSMENT_CONFIG', 'RESULT_REVIEW', 'COMMENT_INTERACT'],
    permissionSummary: '可查看成果并完成评阅与反馈。',
    dataAccessScope: 'ASSIGNED',
    assignedAccessRuleType: 'RESOURCE_TYPE',
    dataAccessAreas: ['EXAM', 'NOTE'],
    authorizedFolderKeys: [],
    assignedAttributeRules: [],
    authorizedResourceRefs: [],
    scopeSummary: '仅查看指定资料类型与评阅相关内容。',
  },
];
const UNLIMITED_TOOL_VALUE = '__ALL__';

function getErrorMessage(error, fallback = '操作失败') {
  return error?.message || fallback;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 16);
}

function renderStatusTag(value) {
  const colorMap = {
    ACTIVE: 'success',
    DRAFT: 'processing',
    DISABLED: 'default',
  };
  const labelMap = Object.fromEntries(TEMPLATE_STATUS_OPTIONS.map((item) => [item.value, item.label]));
  return (
    <Tag color={colorMap[value] || 'default'}>
      {labelMap[value] || value || '-'}
    </Tag>
  );
}

function getToolLabel(toolKey) {
  return TOOL_OPTIONS.find((item) => item.value === toolKey)?.label || toolKey;
}

function getToolCardTitle(tool = {}) {
  return getToolLabel(tool?.key) || '未选择工具';
}

function buildToolIconLookup(toolConfigs = []) {
  return new Map(
    (Array.isArray(toolConfigs) ? toolConfigs : [])
      .filter((tool) => tool?.key)
      .map((tool) => [String(tool.key).trim().toUpperCase(), tool]),
  );
}

function resolveToolConfigByToolKey(toolKey, toolIconLookup) {
  const config = toolIconLookup?.get(String(toolKey || '').trim().toUpperCase()) || null;
  if (config) return config;
  const toolLabel = getToolLabel(toolKey);
  return {
    key: toolKey,
    name: toolLabel,
    iconSource: 'PRESET',
    iconKey: resolveSceneToolIconKey({
      key: toolKey,
      name: toolLabel,
    }),
    iconImage: '',
  };
}

function resolveToolIconKeyByToolKey(toolKey, toolIconLookup) {
  return resolveSceneToolIconKey(resolveToolConfigByToolKey(toolKey, toolIconLookup));
}

function sanitizeAllowedToolsSelection(values = []) {
  const normalizedValues = Array.isArray(values) ? values.filter(Boolean) : [];
  if (normalizedValues.includes(UNLIMITED_TOOL_VALUE)) {
    return [UNLIMITED_TOOL_VALUE];
  }
  return Array.from(new Set(normalizedValues));
}

function getAllowedToolDisplayList(values = []) {
  const normalizedValues = sanitizeAllowedToolsSelection(values);
  if (normalizedValues.includes(UNLIMITED_TOOL_VALUE)) {
    return [{ key: UNLIMITED_TOOL_VALUE, label: '不限' }];
  }
  return normalizedValues.map((toolKey) => ({
    key: toolKey,
    label: getToolLabel(toolKey),
  }));
}

function SceneTemplateIconLabel({ iconKey, label, colorMode = 'preset', config = null }) {
  const resolvedIconKey = iconKey
    || config?.iconKey
    || 'DOCUMENT';
  const meta = getSceneIconMeta(resolvedIconKey);
  const useUploadedIcon = hasUploadedSceneIcon(config || {});
  const iconColor = colorMode === 'inherit' ? 'inherit' : meta.color;
  const badgeClassName = [
    'scene-template-icon-badge',
    colorMode === 'inherit' && !useUploadedIcon ? 'is-plain' : '',
    useUploadedIcon ? 'is-upload' : '',
  ].filter(Boolean).join(' ');
  return (
    <span className="scene-template-icon-label">
      <span
        className={badgeClassName}
        style={colorMode === 'inherit' && !useUploadedIcon
          ? undefined
          : {
              color: meta.color,
              background: meta.background,
            }}
      >
        {renderSceneConfigIcon(useUploadedIcon ? config : resolvedIconKey, {
          size: useUploadedIcon ? 24 : 14,
          color: iconColor,
          defaultIconKey: resolvedIconKey,
          className: useUploadedIcon ? 'scene-template-icon-thumb' : undefined,
          radius: useUploadedIcon ? 8 : undefined,
        })}
      </span>
      <span>{label || getSceneIconLabel(resolvedIconKey)}</span>
    </span>
  );
}

function SceneTemplateIconConfigurator({
  value = {},
  defaultIconKey,
  iconOptions,
  title,
  onPresetChange,
  onUpload,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const resolvedIconKey = value?.iconKey || defaultIconKey;
  const previewConfig = {
    ...value,
    iconKey: resolvedIconKey,
  };
  const uploaded = hasUploadedSceneIcon(previewConfig);
  const meta = getSceneIconMeta(resolvedIconKey);

  useEffect(() => {
    if (!pickerOpen) return;
    setActiveTab(uploaded ? 'upload' : 'gallery');
  }, [pickerOpen, uploaded]);

  function handleOpenPicker() {
    setActiveTab(uploaded ? 'upload' : 'gallery');
    setPickerOpen(true);
  }

  function handleSelectPreset(nextIconKey) {
    onPresetChange?.(nextIconKey);
    setPickerOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="scene-template-icon-trigger"
        onClick={handleOpenPicker}
        aria-label={`${title}，当前图标为${uploaded ? '自定义图标' : getSceneIconLabel(resolvedIconKey)}`}
      >
        <span className="scene-template-icon-trigger-stage">
          <span
            className={`scene-template-icon-trigger-symbol${uploaded ? ' is-upload' : ''}`}
            style={uploaded
              ? undefined
              : {
                  color: meta.color,
                  background: meta.background,
                }}
          >
            {renderSceneConfigIcon(uploaded ? previewConfig : resolvedIconKey, {
              size: uploaded ? 46 : 24,
              defaultIconKey: resolvedIconKey,
              className: uploaded ? 'scene-template-icon-thumb' : undefined,
              radius: uploaded ? 14 : undefined,
            })}
          </span>
          <span className="scene-template-icon-trigger-edit" aria-hidden="true">
            <EditOutlined />
          </span>
        </span>
      </button>
      <Modal
        title={title}
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={[
          <Button key="done" type="primary" onClick={() => setPickerOpen(false)}>
            完成
          </Button>,
        ]}
        width={760}
        className="scene-template-icon-modal"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'gallery',
              label: '图库',
              children: (
                <div className="scene-template-icon-panel">
                  <div className="scene-template-icon-gallery-grid">
                    {iconOptions.map((item) => {
                      const isActive = !uploaded && resolvedIconKey === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`scene-template-icon-gallery-tile ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleSelectPreset(item.value)}
                        >
                          <span
                            className="scene-template-icon-gallery-symbol"
                            style={{
                              color: item.color,
                              background: item.background,
                            }}
                          >
                            {renderSceneConfigIcon(item.value, {
                              size: 22,
                            })}
                          </span>
                          <span className="scene-template-icon-gallery-label">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              key: 'upload',
              label: '本地上传',
              children: (
                <div className="scene-template-icon-upload-panel">
                  <div className="scene-template-icon-upload-preview">
                    <span
                      className={`scene-template-icon-upload-preview-symbol${uploaded ? ' is-upload' : ''}`}
                      style={uploaded
                        ? undefined
                        : {
                            color: meta.color,
                            background: meta.background,
                          }}
                    >
                      {renderSceneConfigIcon(uploaded ? previewConfig : resolvedIconKey, {
                        size: uploaded ? 84 : 36,
                        defaultIconKey: resolvedIconKey,
                        className: uploaded ? 'scene-template-icon-thumb' : undefined,
                        radius: uploaded ? 20 : undefined,
                      })}
                    </span>
                    <div className="scene-template-icon-upload-copy">
                      <strong>{uploaded ? '当前已上传自定义图标' : `当前图标：${getSceneIconLabel(resolvedIconKey)}`}</strong>
                      <span>{uploaded ? '重新上传后会直接替换当前自定义图标。' : '上传后会替换当前预设图标。'}</span>
                    </div>
                  </div>
                  <div className="scene-template-icon-upload-actions">
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={onUpload}
                    >
                      <Button icon={<UploadOutlined />}>{uploaded ? '重新上传' : '本地上传'}</Button>
                    </Upload>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}

const TOOL_ICON_PICKER_OPTIONS = SCENE_TOOL_ICON_OPTIONS;

const FOLDER_ICON_PICKER_OPTIONS = SCENE_FOLDER_ICON_OPTIONS;

const MODE_ICON_PICKER_OPTIONS = SCENE_MODE_ICON_OPTIONS;

const ALLOWED_TOOL_SELECT_OPTIONS = [
  { value: UNLIMITED_TOOL_VALUE, label: '不限' },
  ...TOOL_OPTIONS,
];

function getEntryMethodLabel(method) {
  return ENTRY_METHOD_OPTIONS.find((item) => item.value === method)?.label || method;
}

function getOptionLabels(options, values) {
  const labelMap = new Map(options.map((item) => [item.value, item.label]));
  return (Array.isArray(values) ? values : [])
    .map((value) => labelMap.get(value) || value)
    .filter(Boolean);
}

function getRoleDataScopeLabel(value) {
  return ROLE_DATA_SCOPE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

function getAssignedResourceTargetLabels(values, folderNameMap) {
  const typeLabelMap = new Map(ROLE_DATA_ACCESS_AREA_OPTIONS.map((item) => [item.value, item.label]));
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      if (typeof value === 'string' && value.startsWith('FOLDER::')) {
        const folderKey = value.slice('FOLDER::'.length);
        return `目录类型 / ${folderNameMap.get(folderKey) || folderKey}`;
      }
      return typeLabelMap.get(value) || value;
    })
    .filter(Boolean);
}

function getAssignedAccessSummary(role, folderNameMap) {
  if (role?.dataAccessScope !== 'ASSIGNED') return [];
  switch (role?.assignedAccessRuleType) {
    case 'RESOURCE_TYPE':
      return getAssignedResourceTargetLabels(role?.dataAccessAreas, folderNameMap);
    case 'RESOURCE_ATTR':
      return role?.assignedAttributeRules || [];
    case 'RESOURCE_ITEM':
      return role?.authorizedResourceRefs || [];
    case 'ALL':
    default:
      return ['全部授权对象'];
  }
}

function getFunctionalPermissionSummary(role) {
  const labels = getOptionLabels(ROLE_FUNCTION_PERMISSION_OPTIONS, role?.functionalPermissions);
  if (role?.functionalPermissionMode === 'EXCLUDE' && labels.length === 0) {
    return ['未排除功能'];
  }
  return labels;
}

function getVersionCreateModeLabel(value) {
  return VERSION_CREATE_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

function applyTemplateVersioningDisplayDefaults(template) {
  if (!template?.builtIn) return template;
  const shouldEnable = template.sceneType === 'TRAINING';
  const normalizedVersioning = normalizeVersioningConfig(template.versioning || {}, template.sceneType || 'CUSTOM');
  if (normalizedVersioning.enabled === shouldEnable) return template;
  return {
    ...template,
    versioning: {
      ...normalizedVersioning,
      enabled: shouldEnable,
    },
  };
}

function getTopicThemeModeLabel(value) {
  return TOPIC_THEME_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

function countEnabledTools(template) {
  return new Set([
    ...(template?.toolAreas?.resourceAreaTools || []),
    ...(template?.toolAreas?.resultAreaTools || []),
  ]).size;
}

const METADATA_FIELD_TYPE_LABEL_MAP = {
  input: '单行文本',
  textarea: '多行文本',
  alert: '说明',
  inputNumber: '数字',
  radio: '单选',
  checkbox: '多选',
  datePicker: '日期',
  dateRange: '日期区间',
  tableForm: '明细/表格',
  upload: '图片/视频',
};

function getMetadataFieldTypeLabel(field) {
  return METADATA_FIELD_TYPE_LABEL_MAP[field?.type] || field?.type || '-';
}

function SceneTemplateStaticField({
  label,
  value,
  children,
  span = 1,
  empty = '-',
}) {
  const hasValue = value !== undefined && value !== null && value !== '';
  return (
    <div className={`scene-template-static-field${span === 2 ? ' scene-template-form-span-2' : ''}`}>
      <div className="scene-template-static-field-label">{label}</div>
      <div className="scene-template-static-field-value">
        {children || (hasValue ? value : <span className="scene-template-static-field-empty">{empty}</span>)}
      </div>
    </div>
  );
}

function getDisplayToggleLabel(enabled) {
  return enabled ? '显示' : '隐藏';
}

function SceneTemplateTopicCardPreview({ template, config }) {
  const resolvedConfig = normalizeTopicCardConfig(config);
  const sizeClassName = String(resolvedConfig.size || 'MEDIUM').toLowerCase();
  const sampleMemberCount = Math.max((template?.roles?.length || 0) * 12, 24);
  const bodyTitle = template?.name || '未命名主题';
  const coverTitle = template?.theme?.heroTitle || bodyTitle;
  const coverHint = template?.theme?.surfaceHint || template?.description || '主题卡片预览';
  const bodySummary = template?.description || template?.theme?.heroSubtitle || '主题摘要将在这里展示。';
  const themeTag = template?.theme?.badgeText || '主题标签';

  return (
    <div
      className={`scene-template-topic-card-preview scene-template-topic-card-preview-${sizeClassName}${resolvedConfig.showCover ? '' : ' is-cover-hidden'}`}
    >
      {resolvedConfig.showCover ? (
        <div
          className="scene-template-topic-card-preview-cover"
          style={getSceneThemeCoverStyle(template?.theme || {}, {
            overlayStart: 'rgba(15, 23, 42, 0.2)',
            overlayEnd: 'rgba(15, 23, 42, 0.06)',
          })}
        >
          {resolvedConfig.showTitle ? (
            <div className="scene-template-topic-card-preview-copy">
              <div className="scene-template-topic-card-preview-title">{coverTitle}</div>
              <div className="scene-template-topic-card-preview-hint">{coverHint}</div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="scene-template-topic-card-preview-body">
        {resolvedConfig.showTitle ? (
          <div className="scene-template-topic-card-preview-body-title" title={bodyTitle}>
            {bodyTitle}
          </div>
        ) : null}
        <div className="scene-template-topic-card-preview-body-subtitle">{bodySummary}</div>
        {resolvedConfig.showSceneType || resolvedConfig.showMemberCount ? (
          <div className="scene-template-topic-card-preview-meta">
            {resolvedConfig.showSceneType ? (
              <span>{getSceneTypeLabel(template?.sceneType)}</span>
            ) : null}
            {resolvedConfig.showMemberCount ? (
              <span>{`${sampleMemberCount} 名成员`}</span>
            ) : null}
          </div>
        ) : null}
        {resolvedConfig.showTags ? (
          <div className="scene-template-topic-card-preview-tags">
            <Tag color="blue">{themeTag}</Tag>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SceneTemplatePreview({ template, sceneCount }) {
  if (!template) {
    return (
      <div className="scene-template-preview-card">
        <Empty description="请选择一个模板查看配置预览" />
      </div>
    );
  }

  const roleNameMap = new Map((template.roles || []).map((role) => [role.id, role.name]));
  const folderNameMap = new Map((template.folderTypes || []).map((folder) => [folder.key, folder.name]));
  const toolIconLookup = buildToolIconLookup(template.toolConfigs || []);
  const currentThemeCoverPreset = getSceneThemeCoverPreset(template.theme?.coverPresetId);
  const statusPresetSceneType = template.statusPresetSceneType || template.sceneType || 'CUSTOM';
  const statusPreset = getSceneTypeStatusPreset(statusPresetSceneType);
  const statusGuidance = getSceneTypeStatusGuidance(statusPresetSceneType, template.statusRules);
  const modeTabs = Array.isArray(template.topicPage?.modeTabs) ? template.topicPage.modeTabs : [];
  const topicCardConfig = normalizeTopicCardConfig(template.topicCard);
  const enabledModeCount = modeTabs.filter((mode) => mode.enabled !== false).length;
  const enabledToolCount = countEnabledTools(template);
  const previewSummaryItems = [
    {
      label: '启用模式',
      value: `${enabledModeCount} 个`,
      hint: `共配置 ${modeTabs.length} 个主题模式`,
    },
    {
      label: '角色数量',
      value: `${template.roles?.length || 0} 个`,
      hint: '角色限定与授权配置',
    },
    {
      label: '工具能力',
      value: `${enabledToolCount} 个`,
      hint: '资料区与成果区工具',
    },
    {
      label: '资料目录',
      value: `${template.folderTypes?.length || 0} 类`,
      hint: '默认资料目录类型',
    },
  ];

  return (
    <div className="scene-template-preview-card">
      <div
        className="scene-template-preview-hero"
        style={getSceneThemeCoverStyle(template.theme, {
          overlayStart: 'rgba(15, 23, 42, 0.26)',
          overlayEnd: 'rgba(15, 23, 42, 0.08)',
        })}
      >
        <div>
          <div className="scene-template-preview-kicker">
            {template.theme?.badgeText || getSceneTypeLabel(template.sceneType)}
          </div>
          <div className="scene-template-preview-title">{template.name || '未命名模板'}</div>
          <div className="scene-template-preview-desc">
            {template.description || template.theme?.heroSubtitle || '未填写模板描述'}
          </div>
          <div className="scene-template-preview-meta">
            {renderStatusTag(template.status)}
            <Tag>{getSceneTypeLabel(template.sceneType)}</Tag>
            <Tag color="blue">{sceneCount} 个引用场景</Tag>
            <Tag color={template.versioning?.enabled !== false ? 'geekblue' : 'default'}>
              {template.versioning?.enabled !== false ? '启用版本管理' : '未启用版本管理'}
            </Tag>
          </div>
        </div>
        <div className="scene-template-preview-emoji">{template.theme?.emoji || '🧩'}</div>
      </div>

      <div className="scene-template-preview-summary-grid">
        {previewSummaryItems.map((item) => (
          <div key={item.label} className="scene-template-preview-summary-card">
            <span className="scene-template-preview-summary-label">{item.label}</span>
            <strong className="scene-template-preview-summary-value">{item.value}</strong>
            <span className="scene-template-preview-summary-hint">{item.hint}</span>
          </div>
        ))}
      </div>

      <div className="scene-template-preview-order-panel">
        <div className="scene-template-preview-order-title">主题模式顺序</div>
        <div className="scene-template-preview-order-list">
          {modeTabs.length ? modeTabs.map((mode, index) => (
            <div key={mode.id || mode.key || index} className="scene-template-preview-order-item">
              <span className="scene-template-preview-order-index">{index + 1}</span>
              <div className="scene-template-preview-order-copy">
                <div className="scene-template-preview-order-head">
                  <SceneTemplateIconLabel
                    iconKey={mode.iconKey || resolveSceneModeTabIconKey(mode)}
                    label={mode.label || mode.key || `模式 ${index + 1}`}
                    config={mode}
                  />
                  <Tag color={mode.enabled !== false ? 'blue' : 'default'}>
                    {mode.enabled !== false ? '已启用' : '未启用'}
                  </Tag>
                </div>
                <span>{`模式标识：${mode.key || '-'}`}</span>
              </div>
            </div>
          )) : <Empty description="未配置主题模式" />}
        </div>
      </div>

      <Tabs
        key={template.id}
        className="scene-template-preview-tabs"
        items={[
          {
            key: 'basic',
            label: '基础信息',
            children: (
              <div className="scene-template-drawer-section">
                <div className="scene-template-form-grid">
                  <SceneTemplateStaticField label="模板名称" value={template.name} />
                  <SceneTemplateStaticField label="模板编码" value={template.templateCode} />
                  <SceneTemplateStaticField label="模板状态">
                    {renderStatusTag(template.status)}
                  </SceneTemplateStaticField>
                  <SceneTemplateStaticField label="在用场景数" value={`${sceneCount} 个`} />
                  <SceneTemplateStaticField label="工具能力数" value={`${countEnabledTools(template)} 个`} />
                  <SceneTemplateStaticField span={2} label="模板描述" value={template.description} />
                </div>
              </div>
            ),
          },
          {
            key: 'metadata',
            label: '主题元数据',
            children: (
              <div className="scene-template-drawer-section">
                {template.metadataFields?.length ? template.metadataFields.map((field, index) => (
                  <div key={field.id || field.key || index} className="scene-template-list-card">
                    <div className="scene-template-list-card-head">
                      <strong>{field.label || `字段 ${index + 1}`}</strong>
                    </div>
                    <div className="scene-template-form-grid">
                      <SceneTemplateStaticField label="字段标识" value={field.key || field.id} />
                      <SceneTemplateStaticField label="字段类型" value={getMetadataFieldTypeLabel(field)} />
                      <SceneTemplateStaticField label="是否必填" value={field.props?.required ? '是' : '否'} />
                      <SceneTemplateStaticField label="占位提示" value={field.props?.placeholder} />
                      <SceneTemplateStaticField span={2} label="字段说明" value={field.description || field.props?.content} />
                    </div>
                  </div>
                )) : <Empty description="未配置主题元数据字段" />}
              </div>
            ),
          },
          {
            key: 'theme',
            label: '主题样式',
            children: (
              <div className="scene-template-drawer-section">
                <div className="scene-template-static-field">
                  <div className="scene-template-static-field-label">默认主题封面</div>
                  <div className="scene-template-static-field-value">
                    <div className="scene-template-cover-trigger scene-template-cover-trigger-readonly">
                      <div
                        className="scene-template-cover-trigger-preview"
                        style={getSceneThemeCoverStyle(template.theme, {
                          overlayStart: 'rgba(15, 23, 42, 0.14)',
                          overlayEnd: 'rgba(15, 23, 42, 0.03)',
                        })}
                      />
                      <div className="scene-template-cover-trigger-copy">
                        <strong>
                          {template.theme?.coverSource === 'UPLOAD'
                            ? '本地上传封面'
                            : (currentThemeCoverPreset?.name || '默认图库封面')}
                        </strong>
                        <span>
                          {template.theme?.coverSource === 'UPLOAD'
                            ? '当前使用上传图片作为主题封面'
                            : `当前来自 ${currentThemeCoverPreset?.category || '图库'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="scene-template-subsection-title">
                  <span>主题卡片</span>
                </div>
                <div className="scene-template-list-card">
                  <div className="scene-template-form-grid">
                    <SceneTemplateStaticField label="卡片大小" value={getTopicCardSizeLabel(topicCardConfig.size)} />
                    <SceneTemplateStaticField label="显示场景类型" value={getDisplayToggleLabel(topicCardConfig.showSceneType)} />
                    <SceneTemplateStaticField label="显示成员数量" value={getDisplayToggleLabel(topicCardConfig.showMemberCount)} />
                    <SceneTemplateStaticField label="显示主题标题" value={getDisplayToggleLabel(topicCardConfig.showTitle)} />
                    <SceneTemplateStaticField label="显示主题标签" value={getDisplayToggleLabel(topicCardConfig.showTags)} />
                    <SceneTemplateStaticField label="显示主题图片" value={getDisplayToggleLabel(topicCardConfig.showCover)} />
                  </div>
                </div>
                <div className="scene-template-subsection-title">
                  <span>卡片预览</span>
                </div>
                <SceneTemplateTopicCardPreview template={template} config={topicCardConfig} />
              </div>
            ),
          },
          {
            key: 'modeTabs',
            label: '主题模式',
            children: (
              <div className="scene-template-mode-page">
                <div className="scene-template-mode-grid">
                  {(template.topicPage?.modeTabs || []).map((mode) => (
                    <div key={mode.id || mode.key} className="scene-template-mode-card">
                      <div className="scene-template-list-card-head">
                        <SceneTemplateIconLabel
                          iconKey={mode.iconKey || resolveSceneModeTabIconKey(mode)}
                          label={mode.label || mode.key}
                          config={mode}
                        />
                        <Tag color={mode.enabled !== false ? 'blue' : 'default'}>
                          {mode.enabled !== false ? '已启用' : '未启用'}
                        </Tag>
                      </div>
                      <div className="scene-template-form-grid">
                        <SceneTemplateStaticField label="模式标识" value={mode.key} />
                        <SceneTemplateStaticField label="页签名称" value={mode.label} />
                        <SceneTemplateStaticField label="模式图标">
                          <SceneTemplateIconLabel
                            iconKey={mode.iconKey || resolveSceneModeTabIconKey(mode)}
                            label={mode.iconSource === 'UPLOAD' || mode.iconImage
                              ? '已上传自定义图标'
                              : getSceneIconLabel(mode.iconKey || resolveSceneModeTabIconKey(mode))}
                            config={mode}
                          />
                        </SceneTemplateStaticField>
                        {mode.key === 'home' ? (
                          <SceneTemplateStaticField
                            label="首页组件"
                            value={getHomeComponentLabel(mode.homeComponent) || template.homepage?.templateName}
                          />
                        ) : (
                          <>
                            <SceneTemplateStaticField label="资料区标题" value={mode.resourcePanelTitle || template.topicPage?.resourcePanelTitle} />
                            <SceneTemplateStaticField label="新增资料按钮" value={mode.addResourceLabel || template.topicPage?.addResourceLabel} />
                            <SceneTemplateStaticField label="应用区按钮" value={mode.appLabel || template.topicPage?.appLabel} />
                            <SceneTemplateStaticField label="空状态文案" value={mode.emptyStateText || template.topicPage?.emptyStateText} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: 'roles',
            label: '角色限定',
            children: (
              <div className="scene-template-drawer-section">
                {template.roles?.length ? (
                  <Tabs
                    key={`${template.id}_roles`}
                    defaultActiveKey={String(template.roles[0]?.id || 0)}
                    items={template.roles.map((role, index) => ({
                      key: String(role?.id || index),
                      label: role?.bindingMode === 'REFERENCE'
                        ? `${role?.name || `角色${index + 1}`}（引用）`
                        : (role?.name || `角色${index + 1}`),
                      children: (
                        <div className="scene-template-role-tab-panel">
                          <div className="scene-template-role-stack">
                            {role?.bindingMode === 'REFERENCE' ? (
                              <div className="scene-template-role-reference-note">
                                {`当前角色引用自已有角色「${role?.sourceRoleName || role?.name || '未命名角色'}」，这里只展示角色定义内容。`}
                              </div>
                            ) : null}
                            <div className="scene-template-role-editor-block scene-template-role-editor-block-basic">
                              <div className="scene-template-role-editor-title">基本信息</div>
                              <div className="scene-template-form-grid">
                                <SceneTemplateStaticField label="角色标识" value={role.key} />
                                <SceneTemplateStaticField label="角色名称" value={role.name} />
                                <SceneTemplateStaticField
                                  label="引入方式"
                                  value={role?.bindingMode === 'REFERENCE' ? '引用已有角色' : '复制 / 自定义角色'}
                                />
                                <SceneTemplateStaticField label="来源角色" value={role?.sourceRoleName || '-'} />
                                <SceneTemplateStaticField span={2} label="角色说明" value={role.description} />
                              </div>
                            </div>
                            <div className="scene-template-role-editor-sections">
                              <div className="scene-template-role-editor-block scene-template-role-editor-block-function">
                                <div className="scene-template-role-editor-title">功能授权</div>
                                <div className="scene-template-role-editor-stack-grid">
                                  <SceneTemplateStaticField label="授权方式" value={getRoleFunctionPermissionModeLabel(role.functionalPermissionMode)} />
                                  <SceneTemplateStaticField label="功能树授权">
                                    <div className="scene-template-tag-wrap">
                                      {getFunctionalPermissionSummary(role).length > 0
                                        ? getFunctionalPermissionSummary(role).map((label) => (
                                            <Tag key={`${role.id}_${label}`} color="blue">{label}</Tag>
                                          ))
                                        : <span className="scene-template-static-field-empty">未配置</span>}
                                    </div>
                                  </SceneTemplateStaticField>
                                  <SceneTemplateStaticField label="功能说明" value={role.permissionSummary} />
                                </div>
                              </div>
                              <div className="scene-template-role-editor-block scene-template-role-editor-block-data">
                                <div className="scene-template-role-editor-title">资料授权</div>
                                <div className="scene-template-role-editor-stack-grid">
                                  <SceneTemplateStaticField label="资料归属范围" value={getRoleDataScopeLabel(role.dataAccessScope)} />
                                  {role.dataAccessScope === 'ASSIGNED' ? (
                                    <>
                                      <SceneTemplateStaticField label="授权方式" value={getAssignedAccessRuleLabel(role.assignedAccessRuleType)} />
                                      <SceneTemplateStaticField label="授权对象">
                                        <div className="scene-template-tag-wrap">
                                          {getAssignedAccessSummary(role, folderNameMap).length > 0
                                            ? getAssignedAccessSummary(role, folderNameMap).map((label) => (
                                                <Tag key={`${role.id}_data_${label}`}>{label}</Tag>
                                              ))
                                            : <span className="scene-template-static-field-empty">未配置</span>}
                                        </div>
                                      </SceneTemplateStaticField>
                                    </>
                                  ) : (
                                    <SceneTemplateStaticField label="授权对象" value="当前范围下自动生效，无需单独指定" />
                                  )}
                                  <SceneTemplateStaticField label="资料权限说明" value={role.scopeSummary} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    }))}
                    className="scene-template-role-tabs"
                  />
                ) : <Empty description="未配置角色" />}
              </div>
            ),
          },
          {
            key: 'tools',
            label: '工具与资料',
            children: (
              <div className="scene-template-drawer-section">
                <div className="scene-template-form-grid">
                  <SceneTemplateStaticField label="资料区工具">
                    <div className="scene-template-tag-wrap">
                      {template.toolAreas?.resourceAreaTools?.length
                        ? template.toolAreas.resourceAreaTools.map((toolKey) => (
                            <Tag key={toolKey}>
                              <SceneTemplateIconLabel
                                config={resolveToolConfigByToolKey(toolKey, toolIconLookup)}
                                iconKey={resolveToolIconKeyByToolKey(toolKey, toolIconLookup)}
                                label={getToolLabel(toolKey)}
                                colorMode="inherit"
                              />
                            </Tag>
                          ))
                        : <span className="scene-template-static-field-empty">未配置</span>}
                    </div>
                  </SceneTemplateStaticField>
                  <SceneTemplateStaticField label="创作结果区工具">
                    <div className="scene-template-tag-wrap">
                      {template.toolAreas?.resultAreaTools?.length
                        ? template.toolAreas.resultAreaTools.map((toolKey) => (
                            <Tag key={toolKey}>
                              <SceneTemplateIconLabel
                                config={resolveToolConfigByToolKey(toolKey, toolIconLookup)}
                                iconKey={resolveToolIconKeyByToolKey(toolKey, toolIconLookup)}
                                label={getToolLabel(toolKey)}
                                colorMode="inherit"
                              />
                            </Tag>
                          ))
                        : <span className="scene-template-static-field-empty">未配置</span>}
                    </div>
                  </SceneTemplateStaticField>
                  <SceneTemplateStaticField label="允许根目录直接放资料" value={template.topicPage?.allowRootResources ? '是' : '否'} />
                </div>

                <div className="scene-template-subsection-title">
                  <span>工具配置项</span>
                </div>
                {template.toolConfigs?.length ? template.toolConfigs.map((tool, index) => (
                  <div key={tool?.id || index} className="scene-template-list-card">
                    <div className="scene-template-list-card-head">
                      <strong>{getToolCardTitle(tool)}</strong>
                    </div>
                    <div className="scene-template-form-grid">
                      <SceneTemplateStaticField label="工具名称" value={getToolLabel(tool.key) || '-'} />
                      <SceneTemplateStaticField label="工具别名" value={tool.name || '-'} />
                      <SceneTemplateStaticField label="工具图标">
                        <SceneTemplateIconLabel
                          config={tool}
                          iconKey={tool.iconKey || resolveSceneToolIconKey(tool)}
                          label={hasUploadedSceneIcon(tool)
                            ? '已上传自定义图标'
                            : getSceneIconLabel(tool.iconKey || resolveSceneToolIconKey(tool))}
                        />
                      </SceneTemplateStaticField>
                      <SceneTemplateStaticField label="出现位置" value={TOOL_PLACEMENT_OPTIONS.find((item) => item.value === tool.placement)?.label || tool.placement} />
                      <SceneTemplateStaticField label="启用" value={tool.enabled !== false ? '是' : '否'} />
                      <SceneTemplateStaticField span={2} label="配置说明" value={tool.description} />
                    </div>
                  </div>
                )) : <Empty description="未配置工具项" />}

                <div className="scene-template-subsection-title">
                  <span>资料目录类型</span>
                </div>
                {template.folderTypes?.length ? template.folderTypes.map((folder, index) => (
                  <div key={folder?.id || index} className="scene-template-list-card">
                    <div className="scene-template-list-card-head">
                      <strong>目录类型 {index + 1}</strong>
                    </div>
                    <div className="scene-template-form-grid">
                      <SceneTemplateStaticField label="目录标识" value={folder.key} />
                      <SceneTemplateStaticField label="目录名称" value={folder.name} />
                      <SceneTemplateStaticField label="目录图标">
                        <SceneTemplateIconLabel
                          config={folder}
                          iconKey={folder.iconKey || resolveSceneFolderIconKey(folder)}
                          label={hasUploadedSceneIcon(folder)
                            ? '已上传自定义图标'
                            : getSceneIconLabel(folder.iconKey || resolveSceneFolderIconKey(folder))}
                        />
                      </SceneTemplateStaticField>
                      <SceneTemplateStaticField label="角色限制">
                        <div className="scene-template-tag-wrap">
                          {folder.roleIds?.length
                            ? folder.roleIds.map((roleId) => (
                                <Tag key={`${folder.id}_${roleId}`}>{roleNameMap.get(roleId) || roleId}</Tag>
                              ))
                            : <span className="scene-template-static-field-empty">未限制</span>}
                        </div>
                      </SceneTemplateStaticField>
                      <SceneTemplateStaticField label="允许工具">
                        <div className="scene-template-tag-wrap">
                          {getAllowedToolDisplayList(folder.allowedTools).length
                            ? getAllowedToolDisplayList(folder.allowedTools).map((toolItem) => (
                                <Tag key={`${folder.id}_${toolItem.key}`}>
                                  <SceneTemplateIconLabel
                                    config={toolItem.key === UNLIMITED_TOOL_VALUE
                                      ? null
                                      : resolveToolConfigByToolKey(toolItem.key, toolIconLookup)}
                                    iconKey={toolItem.key === UNLIMITED_TOOL_VALUE
                                      ? 'GRID'
                                      : resolveToolIconKeyByToolKey(toolItem.key, toolIconLookup)}
                                    label={toolItem.label}
                                    colorMode="inherit"
                                  />
                                </Tag>
                              ))
                            : <span className="scene-template-static-field-empty">未配置</span>}
                        </div>
                      </SceneTemplateStaticField>
                      <SceneTemplateStaticField label="必选目录" value={folder.required ? '是' : '否'} />
                      <SceneTemplateStaticField span={2} label="目录说明" value={folder.description} />
                    </div>
                  </div>
                )) : <Empty description="未配置资料目录类型" />}
              </div>
            ),
          },
          {
            key: 'versioning',
            label: '版本管理',
            children: (
              <div className="scene-template-drawer-section">
                <div className="scene-template-list-card">
                  <div className="scene-template-form-grid">
                    <SceneTemplateStaticField label="启用版本管理" value={template.versioning?.enabled !== false ? '是' : '否'} />
                    <SceneTemplateStaticField label="最多版本数" value={template.versioning?.enabled !== false ? String(template.versioning?.maxVersions || 5) : '-'} />
                    <SceneTemplateStaticField label="新建版本规则" value={template.versioning?.enabled !== false ? getVersionCreateModeLabel(template.versioning?.createMode) : '-'} />
                    <SceneTemplateStaticField label="版本名称规则" value={template.versioning?.enabled !== false ? (template.versioning?.namePattern || '版本 {index}') : '-'} />
                    <SceneTemplateStaticField label="允许回退历史版本" value={template.versioning?.enabled !== false ? (template.versioning?.allowRollback ? '是' : '否') : '-'} />
                    <SceneTemplateStaticField label="允许删除已失效版本" value={template.versioning?.enabled !== false ? (template.versioning?.allowDeletePublished ? '是' : '否') : '-'} />
                    <SceneTemplateStaticField span={2} label="版本规则说明" value={template.versioning?.description} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'rules',
            label: '规则与进入',
            children: (
              <div className="scene-template-drawer-section">
                <div className="scene-template-form-grid">
                  <SceneTemplateStaticField span={2} label="进入主题的方式">
                    <div className="scene-template-tag-wrap">
                      {template.entryMethods?.length
                        ? template.entryMethods.map((method) => (
                            <Tag key={method}>{getEntryMethodLabel(method)}</Tag>
                          ))
                        : <span className="scene-template-static-field-empty">未配置</span>}
                    </div>
                  </SceneTemplateStaticField>
                </div>

                <div className="scene-template-subsection-title">
                  <span>状态控制规则</span>
                </div>
                <div className="scene-template-guidance-panel">
                  <div className="scene-template-guidance-title">当前空间主题阶段模型</div>
                  <div className="scene-template-guidance-text">
                    {`当前模板按 ${getSceneTypeLabel(statusPresetSceneType)} 的默认阶段模型解释这些规则。${statusPreset.description}`}
                  </div>
                </div>
                {statusGuidance.length > 0 ? (
                  <div className="scene-template-warning-list">
                    {statusGuidance.map((item) => (
                      <div key={item} className="scene-template-warning-item">{item}</div>
                    ))}
                  </div>
                ) : null}
                {template.statusRules?.length ? template.statusRules.map((rule, index) => (
                  <div key={rule?.id || index} className="scene-template-list-card">
                    <div className="scene-template-list-card-head">
                      <strong>状态规则 {index + 1}</strong>
                    </div>
                    <div className="scene-template-form-grid">
                      <SceneTemplateStaticField label="状态编码" value={rule.key} />
                      <SceneTemplateStaticField label="状态名称" value={rule.name} />
                      <SceneTemplateStaticField label="状态阶段" value={getStatusRuleStageLabel(rule.stage)} />
                      <SceneTemplateStaticField label="控制策略" value={getStatusRuleControlLabel(rule.controlMode)} />
                      <SceneTemplateStaticField label="开放进入" value={rule.entryEnabled ? '是' : '否'} />
                      <SceneTemplateStaticField label="适用角色">
                        <div className="scene-template-tag-wrap">
                          {rule.roleIds?.length
                            ? rule.roleIds.map((roleId) => (
                                <Tag key={`${rule.id}_${roleId}`}>{roleNameMap.get(roleId) || roleId}</Tag>
                              ))
                            : <span className="scene-template-static-field-empty">未限定角色</span>}
                        </div>
                      </SceneTemplateStaticField>
                      <SceneTemplateStaticField span={2} label="阶段语义" value={getStatusRuleStageDescription(rule.stage)} />
                      <SceneTemplateStaticField span={2} label="规则说明" value={rule.description} />
                    </div>
                  </div>
                )) : <Empty description="未配置状态控制规则" />}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export default function SceneTemplateModule() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeRoleTabKey, setActiveRoleTabKey] = useState(null);
  const [themeCoverModalOpen, setThemeCoverModalOpen] = useState(false);
  const [roleLibraryModalOpen, setRoleLibraryModalOpen] = useState(false);
  const [toolConfigPickerOpen, setToolConfigPickerOpen] = useState(false);
  const [selectedToolConfigKey, setSelectedToolConfigKey] = useState(null);

  const [templateForm] = Form.useForm();
  const [roleLibraryForm] = Form.useForm();
  const watchedRolesValue = Form.useWatch('roles', { form: templateForm, preserve: true });
  const watchedMetadataFieldsValue = Form.useWatch('metadataFields', { form: templateForm, preserve: true });
  const watchedToolConfigsValue = Form.useWatch('toolConfigs', { form: templateForm, preserve: true });
  const watchedFolderTypesValue = Form.useWatch('folderTypes', { form: templateForm, preserve: true });
  const watchedStatusRulesValue = Form.useWatch('statusRules', { form: templateForm, preserve: true });
  const watchedStatusPresetSceneTypeValue = Form.useWatch('statusPresetSceneType', { form: templateForm, preserve: true });
  const watchedThemeValue = Form.useWatch('theme', { form: templateForm, preserve: true });
  const watchedModeTabsValue = Form.useWatch(['topicPage', 'modeTabs'], { form: templateForm, preserve: true });
  const watchedTopicCardValue = Form.useWatch('topicCard', { form: templateForm, preserve: true });
  const watchedVersioningValue = Form.useWatch('versioning', { form: templateForm, preserve: true });
  const selectedRoleLibraryId = Form.useWatch('roleId', roleLibraryForm);
  const selectedRoleImportMode = Form.useWatch('importMode', roleLibraryForm);
  const watchedRoles = useMemo(() => watchedRolesValue || [], [watchedRolesValue]);
  const watchedMetadataFields = useMemo(() => watchedMetadataFieldsValue || [], [watchedMetadataFieldsValue]);
  const watchedToolConfigs = useMemo(() => watchedToolConfigsValue || [], [watchedToolConfigsValue]);
  const watchedFolderTypes = useMemo(() => watchedFolderTypesValue || [], [watchedFolderTypesValue]);
  const watchedToolIconLookup = useMemo(
    () => buildToolIconLookup(watchedToolConfigs),
    [watchedToolConfigs],
  );
  const configuredToolKeySet = useMemo(
    () => new Set(
      watchedToolConfigs
        .map((tool) => String(tool?.key || '').trim())
        .filter(Boolean),
    ),
    [watchedToolConfigs],
  );
  const availableToolConfigOptions = useMemo(
    () => TOOL_OPTIONS.filter((item) => !configuredToolKeySet.has(item.value)),
    [configuredToolKeySet],
  );
  const watchedStatusRules = useMemo(() => watchedStatusRulesValue || [], [watchedStatusRulesValue]);
  const watchedStatusPresetSceneType = useMemo(
    () => watchedStatusPresetSceneTypeValue || editingTemplate?.statusPresetSceneType || editingTemplate?.sceneType || 'CUSTOM',
    [editingTemplate, watchedStatusPresetSceneTypeValue],
  );
  const watchedTheme = useMemo(() => watchedThemeValue || {}, [watchedThemeValue]);
  const watchedModeTabs = useMemo(
    () => (Array.isArray(watchedModeTabsValue) && watchedModeTabsValue.length > 0
      ? watchedModeTabsValue
      : (editingTemplate?.topicPage?.modeTabs || [])),
    [editingTemplate?.topicPage?.modeTabs, watchedModeTabsValue],
  );
  const watchedTopicCard = useMemo(
    () => normalizeTopicCardConfig(watchedTopicCardValue || editingTemplate?.topicCard || {}),
    [editingTemplate?.topicCard, watchedTopicCardValue],
  );
  const roleLibraryOptions = useMemo(
    () => MOCK_ROLE_LIBRARY.map((role) => ({
      value: role.id,
      label: `${role.name}（${role.key}）`,
    })),
    [],
  );
  const selectedRoleLibraryDefinition = useMemo(
    () => MOCK_ROLE_LIBRARY.find((role) => role.id === selectedRoleLibraryId) || null,
    [selectedRoleLibraryId],
  );
  const watchedVersioningEnabled = useMemo(
    () => normalizeVersioningConfig(
      watchedVersioningValue || editingTemplate?.versioning || {},
      editingTemplate?.sceneType || 'CUSTOM',
    ).enabled !== false,
    [editingTemplate?.sceneType, editingTemplate?.versioning, watchedVersioningValue],
  );
  const versioningSupported = (editingTemplate?.sceneType || 'CUSTOM') === 'TRAINING';
  const uploadedThemeCoverImage = watchedTheme.coverSource === 'UPLOAD' ? watchedTheme.coverImage : '';
  const roleOptions = useMemo(
    () => watchedRoles
      .filter((role) => role?.id && role?.name)
      .map((role) => ({ value: role.id, label: role.name })),
    [watchedRoles],
  );
  const modePresetMap = useMemo(
    () => new Map(MODE_TAB_PRESET_OPTIONS.map((item) => [item.value, item])),
    [],
  );
  const assignedResourceTypeOptions = useMemo(
    () => watchedFolderTypes
      .filter((folder) => folder?.key && folder?.name)
      .reduce(
        (options, folder) => [
          ...options,
          { value: `FOLDER::${folder.key}`, label: `目录类型 / ${folder.name}` },
        ],
        [...ROLE_DATA_ACCESS_AREA_OPTIONS],
      ),
    [watchedFolderTypes],
  );
  const themeCoverPresetGroups = useMemo(() => {
    const grouped = new Map();
    SCENE_THEME_COVER_PRESETS.forEach((preset) => {
      const nextGroup = grouped.get(preset.category) || [];
      nextGroup.push(preset);
      grouped.set(preset.category, nextGroup);
    });
    return Array.from(grouped.entries()).map(([category, presets]) => ({ category, presets }));
  }, []);
  const currentThemeCoverPreset = useMemo(
    () => getSceneThemeCoverPreset(watchedTheme.coverPresetId),
    [watchedTheme.coverPresetId],
  );
  const currentStatusPreset = useMemo(
    () => getSceneTypeStatusPreset(watchedStatusPresetSceneType),
    [watchedStatusPresetSceneType],
  );
  const statusRuleGuidance = useMemo(
    () => getSceneTypeStatusGuidance(watchedStatusPresetSceneType, watchedStatusRules),
    [watchedStatusPresetSceneType, watchedStatusRules],
  );
  const sceneCountMap = useMemo(() => {
    return scenes.reduce((map, item) => {
      map[item.templateId] = (map[item.templateId] || 0) + 1;
      return map;
    }, {});
  }, [scenes]);

  const summary = useMemo(() => ({
    templateCount: templates.length,
    activeCount: templates.filter((item) => item.status === 'ACTIVE').length,
    usedSceneCount: scenes.length,
  }), [templates, scenes]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      if (normalizedKeyword) {
        const haystack = `${item.name} ${item.templateCode} ${item.description}`.toLowerCase();
        if (!haystack.includes(normalizedKeyword)) return false;
      }
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, statusFilter, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || null,
    [selectedTemplateId, templates],
  );
  const isExistingEditing = useMemo(
    () => !!editingTemplate && templates.some((item) => item.id === editingTemplate.id),
    [editingTemplate, templates],
  );
  const editingTemplateSceneCount = useMemo(
    () => (editingTemplate?.id ? (sceneCountMap[editingTemplate.id] || 0) : 0),
    [editingTemplate?.id, sceneCountMap],
  );

  const loadAll = useCallback(async (withLoading = true) => {
    if (withLoading) setLoading(true);
    try {
      const [templateList, sceneList] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
      ]);
      const normalizedTemplateList = templateList.map(applyTemplateVersioningDisplayDefaults);
      setTemplates(normalizedTemplateList);
      setScenes(sceneList);
      setSelectedTemplateId((prev) => (
        prev && normalizedTemplateList.some((item) => item.id === prev)
          ? prev
          : normalizedTemplateList[0]?.id || null
      ));
    } catch (error) {
      message.error(getErrorMessage(error, '加载模板数据失败'));
    } finally {
      if (withLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sceneApi.seed();
      loadAll();
    }, 0);
    const eventName = getSceneStoreChangeEventName();
    const handleChange = () => loadAll(false);
    window.addEventListener(eventName, handleChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(eventName, handleChange);
    };
  }, [loadAll]);

  useEffect(() => {
    if (!drawerOpen || !editingTemplate) return;
    templateForm.setFieldsValue({
      ...editingTemplate,
      topicPage: {
        ...(editingTemplate.topicPage || {}),
        modeTabs: (editingTemplate.topicPage?.modeTabs || []).map((mode) => ({
          ...mode,
          iconSource: mode?.iconSource === 'UPLOAD' || mode?.iconImage ? 'UPLOAD' : 'PRESET',
          iconKey: mode?.iconKey || resolveSceneModeTabIconKey(mode),
          iconImage: mode?.iconImage || '',
        })),
      },
      toolConfigs: (editingTemplate.toolConfigs || []).map((tool) => ({
        ...tool,
        iconSource: tool?.iconSource === 'UPLOAD' || tool?.iconImage ? 'UPLOAD' : 'PRESET',
        iconKey: tool?.iconKey || resolveSceneToolIconKey(tool),
        iconImage: tool?.iconImage || '',
      })),
      folderTypes: (editingTemplate.folderTypes || []).map((folder) => ({
        ...folder,
        iconSource: folder?.iconSource === 'UPLOAD' || folder?.iconImage ? 'UPLOAD' : 'PRESET',
        iconKey: folder?.iconKey || resolveSceneFolderIconKey(folder),
        iconImage: folder?.iconImage || '',
        allowedTools: sanitizeAllowedToolsSelection(folder?.allowedTools),
      })),
    });
    if ((!editingTemplate.roles || editingTemplate.roles.length === 0) && !isExistingEditing) {
      templateForm.setFieldValue('roles', [createRoleDraft(1)]);
    }
  }, [drawerOpen, editingTemplate, isExistingEditing, templateForm]);

  useEffect(() => {
    if (watchedRoles.length === 0) {
      setActiveRoleTabKey(null);
      return;
    }
    const hasActive = watchedRoles.some((role, index) => String(role?.id || index) === activeRoleTabKey);
    if (!hasActive) {
      setActiveRoleTabKey(String(watchedRoles[0]?.id || 0));
    }
  }, [activeRoleTabKey, watchedRoles]);

  useEffect(() => {
    if (!toolConfigPickerOpen) return;
    setSelectedToolConfigKey((prev) => (
      availableToolConfigOptions.some((item) => item.value === prev)
        ? prev
        : (availableToolConfigOptions[0]?.value || null)
    ));
  }, [availableToolConfigOptions, toolConfigPickerOpen]);

  function appendRole() {
    const currentRoles = templateForm.getFieldValue('roles') || [];
    const nextRole = createRoleDraft(currentRoles.length + 1);
    templateForm.setFieldValue('roles', [...currentRoles, nextRole]);
    setActiveRoleTabKey(String(nextRole.id));
  }

  function openRoleLibraryPicker() {
    roleLibraryForm.resetFields();
    roleLibraryForm.setFieldsValue({
      importMode: 'COPY',
    });
    setRoleLibraryModalOpen(true);
  }

  function inferNewToolConfigPlacement(toolKey) {
    const toolAreas = templateForm.getFieldValue('toolAreas') || {};
    const inResourceArea = Array.isArray(toolAreas.resourceAreaTools) && toolAreas.resourceAreaTools.includes(toolKey);
    const inResultArea = Array.isArray(toolAreas.resultAreaTools) && toolAreas.resultAreaTools.includes(toolKey);
    if (inResourceArea && inResultArea) return 'BOTH';
    if (inResultArea) return 'RESULT_AREA';
    return 'RESOURCE_AREA';
  }

  function openToolConfigPicker() {
    if (availableToolConfigOptions.length === 0) {
      message.info('可配置工具已全部添加');
      return;
    }
    setSelectedToolConfigKey(availableToolConfigOptions[0]?.value || null);
    setToolConfigPickerOpen(true);
  }

  function handleAddToolConfig() {
    if (!selectedToolConfigKey) {
      message.warning('请选择要配置的工具');
      return;
    }
    if (configuredToolKeySet.has(selectedToolConfigKey)) {
      message.warning('该工具已存在配置项');
      return;
    }
    const toolLabel = getToolLabel(selectedToolConfigKey);
    const nextTool = {
      id: `tool_${Date.now()}`,
      key: selectedToolConfigKey,
      name: toolLabel,
      iconSource: 'PRESET',
      iconKey: resolveSceneToolIconKey({
        key: selectedToolConfigKey,
        name: toolLabel,
      }),
      iconImage: '',
      placement: inferNewToolConfigPlacement(selectedToolConfigKey),
      enabled: true,
      description: '',
    };
    templateForm.setFieldsValue({
      toolConfigs: [...watchedToolConfigs, nextTool],
    });
    setToolConfigPickerOpen(false);
    setSelectedToolConfigKey(null);
  }

  function buildRoleFromLibrary(roleDefinition, importMode, seed) {
    const draft = createRoleDraft(seed);
    return {
      ...draft,
      key: roleDefinition.key,
      name: roleDefinition.name,
      description: roleDefinition.description,
      agentName: roleDefinition.agentName || '',
      bindingMode: importMode === 'REFERENCE' ? 'REFERENCE' : 'CUSTOM',
      sourceRoleId: importMode === 'REFERENCE' ? roleDefinition.id : '',
      sourceRoleName: importMode === 'REFERENCE' ? roleDefinition.name : '',
      functionalPermissionMode: roleDefinition.functionalPermissionMode || 'INCLUDE',
      functionalPermissions: [...(roleDefinition.functionalPermissions || [])],
      permissionSummary: roleDefinition.permissionSummary || '',
      dataAccessScope: roleDefinition.dataAccessScope || 'ASSIGNED',
      assignedAccessRuleType: roleDefinition.assignedAccessRuleType || 'ALL',
      dataAccessAreas: [...(roleDefinition.dataAccessAreas || [])],
      authorizedFolderKeys: [...(roleDefinition.authorizedFolderKeys || [])],
      assignedAttributeRules: [...(roleDefinition.assignedAttributeRules || [])],
      authorizedResourceRefs: [...(roleDefinition.authorizedResourceRefs || [])],
      scopeSummary: roleDefinition.scopeSummary || '',
    };
  }

  async function handleImportRoleFromLibrary() {
    try {
      const values = await roleLibraryForm.validateFields();
      const roleDefinition = MOCK_ROLE_LIBRARY.find((role) => role.id === values.roleId);
      if (!roleDefinition) {
        message.error('请选择已有角色');
        return;
      }
      const currentRoles = templateForm.getFieldValue('roles') || [];
      const nextRole = buildRoleFromLibrary(roleDefinition, values.importMode || 'COPY', currentRoles.length + 1);
      templateForm.setFieldValue('roles', [...currentRoles, nextRole]);
      setActiveRoleTabKey(String(nextRole.id));
      setRoleLibraryModalOpen(false);
      roleLibraryForm.resetFields();
      message.success(values.importMode === 'REFERENCE' ? '已引用角色定义' : '已复制角色定义');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error, '引入角色失败'));
    }
  }

  function removeRole(index) {
    const currentRoles = [...(templateForm.getFieldValue('roles') || [])];
    const removedRole = currentRoles[index];
    currentRoles.splice(index, 1);
    templateForm.setFieldValue('roles', currentRoles);
    if (String(removedRole?.id || index) === activeRoleTabKey) {
      const nextActiveRole = currentRoles[index] || currentRoles[index - 1] || null;
      setActiveRoleTabKey(nextActiveRole ? String(nextActiveRole.id) : null);
    }
  }

  function updateThemeConfig(patch) {
    const currentTheme = templateForm.getFieldValue('theme') || {};
    templateForm.setFieldValue('theme', {
      ...currentTheme,
      ...patch,
    });
  }

  function moveModeTab(index, offset) {
    const currentModeTabs = [...(templateForm.getFieldValue(['topicPage', 'modeTabs']) || [])];
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= currentModeTabs.length) return;
    const [movedMode] = currentModeTabs.splice(index, 1);
    currentModeTabs.splice(targetIndex, 0, movedMode);
    templateForm.setFieldValue(['topicPage', 'modeTabs'], currentModeTabs);
  }

  function handleModeTabChange(index, patch) {
    const currentModeTabs = [...(templateForm.getFieldValue(['topicPage', 'modeTabs']) || [])];
    currentModeTabs[index] = {
      ...(currentModeTabs[index] || {}),
      ...patch,
    };
    templateForm.setFieldValue(['topicPage', 'modeTabs'], currentModeTabs);
  }

  function handleSelectThemeCoverPreset(presetId) {
    const preset = getSceneThemeCoverPreset(presetId);
    if (!preset) return;
    updateThemeConfig({
      coverSource: 'PRESET',
      coverPresetId: preset.id,
      coverStart: preset.coverStart,
      coverEnd: preset.coverEnd,
    });
  }

  async function handleThemeCoverUpload(file) {
    if (!file.type?.startsWith('image/')) {
      message.error('请上传图片格式的主题封面');
      return Upload.LIST_IGNORE;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateThemeConfig({
        coverSource: 'UPLOAD',
        coverImage: dataUrl,
      });
      message.success('默认主题封面已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '主题封面上传失败'));
    }
    return Upload.LIST_IGNORE;
  }

  function updateFormListItem(listName, index, patch) {
    const currentList = [...(templateForm.getFieldValue(listName) || [])];
    currentList[index] = {
      ...(currentList[index] || {}),
      ...patch,
    };
    templateForm.setFieldsValue({
      [listName]: currentList,
    });
  }

  function handleToolConfigChange(index, patch) {
    updateFormListItem('toolConfigs', index, patch);
  }

  function handleFolderTypeChange(index, patch) {
    updateFormListItem('folderTypes', index, patch);
  }

  function handleBuiltinToolChange(index, nextToolKey) {
    const currentTool = templateForm.getFieldValue(['toolConfigs', index]) || {};
    const inferredCurrentIconKey = resolveSceneToolIconKey(currentTool);
    const nextPatch = {
      key: nextToolKey,
    };
    if (
      currentTool.iconSource !== 'UPLOAD'
      && (!currentTool.iconKey || currentTool.iconKey === inferredCurrentIconKey)
    ) {
      nextPatch.iconKey = resolveSceneToolIconKey({
        ...currentTool,
        key: nextToolKey,
        name: currentTool.name || getToolLabel(nextToolKey),
      });
    }
    handleToolConfigChange(index, nextPatch);
  }

  async function handleToolIconUpload(index, file) {
    if (!file.type?.startsWith('image/')) {
      message.error('请上传图片格式的工具图标');
      return Upload.LIST_IGNORE;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleToolConfigChange(index, {
        iconSource: 'UPLOAD',
        iconImage: dataUrl,
      });
      message.success('工具图标已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '工具图标上传失败'));
    }
    return Upload.LIST_IGNORE;
  }

  async function handleFolderIconUpload(index, file) {
    if (!file.type?.startsWith('image/')) {
      message.error('请上传图片格式的目录图标');
      return Upload.LIST_IGNORE;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleFolderTypeChange(index, {
        iconSource: 'UPLOAD',
        iconImage: dataUrl,
      });
      message.success('目录图标已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '目录图标上传失败'));
    }
    return Upload.LIST_IGNORE;
  }

  async function handleModeTabIconUpload(index, file) {
    if (!file.type?.startsWith('image/')) {
      message.error('请上传图片格式的模式图标');
      return Upload.LIST_IGNORE;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleModeTabChange(index, {
        iconSource: 'UPLOAD',
        iconImage: dataUrl,
      });
      message.success('模式图标已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '模式图标上传失败'));
    }
    return Upload.LIST_IGNORE;
  }

  function handleFolderAllowedToolsChange(index, values) {
    handleFolderTypeChange(index, {
      allowedTools: sanitizeAllowedToolsSelection(values),
    });
  }

  function handleRestoreStatusRules() {
    templateForm.setFieldValue(
      'statusRules',
      buildSceneTypeStatusRules(watchedStatusPresetSceneType, watchedRoles),
    );
    message.success(`已恢复为${getSceneTypeLabel(watchedStatusPresetSceneType)}默认阶段规则`);
  }

  function openCreateDrawer() {
    const draft = createTemplateDraft();
    setPreviewDrawerOpen(false);
    setEditingTemplate(draft);
    setDrawerOpen(true);
  }

  function openPreviewDrawer(record) {
    setSelectedTemplateId(record.id);
    setPreviewDrawerOpen(true);
  }

  function openEditDrawer(record) {
    setPreviewDrawerOpen(false);
    setEditingTemplate(record);
    setDrawerOpen(true);
  }

  async function handleSaveTemplate() {
    setSaving(true);
    try {
      await templateForm.validateFields();
      const values = templateForm.getFieldsValue(true);
      const modeTabs = Array.isArray(values.topicPage?.modeTabs) ? values.topicPage.modeTabs : [];
      const statusRules = Array.isArray(values.statusRules) ? values.statusRules : [];
      const toolConfigs = Array.isArray(values.toolConfigs) ? values.toolConfigs : [];
      if (modeTabs.filter((item) => item?.enabled !== false).length === 0) {
        message.error('至少启用一个主题模式');
        return;
      }
      const normalizedToolKeys = toolConfigs
        .map((tool) => String(tool?.key || '').trim())
        .filter(Boolean);
      if (new Set(normalizedToolKeys).size !== normalizedToolKeys.length) {
        message.error('同一个内置工具只能配置一次');
        return;
      }
      const normalizedStatusKeys = statusRules
        .map((rule) => String(rule?.key || '').trim())
        .filter(Boolean);
      if (new Set(normalizedStatusKeys).size !== normalizedStatusKeys.length) {
        message.error('状态编码不能重复');
        return;
      }
      const statusGuidanceMessages = getSceneTypeStatusGuidance(
        values.statusPresetSceneType || editingTemplate?.statusPresetSceneType || editingTemplate?.sceneType || 'CUSTOM',
        statusRules,
      );
      if (statusGuidanceMessages.length > 0) {
        message.warning(statusGuidanceMessages[0]);
      }
      const roleRules = Array.isArray(values.roles) ? values.roles : [];
      const invalidAssignedRole = roleRules.find((role) => {
        if (role?.dataAccessScope !== 'ASSIGNED') return false;
        switch (role?.assignedAccessRuleType) {
          case 'RESOURCE_TYPE':
            return !Array.isArray(role?.dataAccessAreas) || role.dataAccessAreas.length === 0;
          case 'RESOURCE_ATTR':
            return !Array.isArray(role?.assignedAttributeRules) || role.assignedAttributeRules.length === 0;
          case 'RESOURCE_ITEM':
            return !Array.isArray(role?.authorizedResourceRefs) || role.authorizedResourceRefs.length === 0;
          case 'ALL':
          default:
            return false;
        }
      });
      if (invalidAssignedRole) {
        message.error(`角色“${invalidAssignedRole.name || invalidAssignedRole.key || '未命名角色'}”需完善授权配置`);
        return;
      }
      if (
        editingTemplateSceneCount > 0
        && editingTemplate?.status !== 'DISABLED'
        && values.status === 'DISABLED'
      ) {
        message.error('该模板已有引用场景，不能停用');
        return;
      }
      const saved = await sceneApi.saveTemplate({
        ...editingTemplate,
        ...values,
      });
      setDrawerOpen(false);
      setEditingTemplate(null);
      setSelectedTemplateId(saved.id);
      message.success('模板已保存');
      await loadAll(false);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateTemplate(id) {
    try {
      const duplicated = await sceneApi.duplicateTemplate(id);
      setSelectedTemplateId(duplicated.id);
      setPreviewDrawerOpen(true);
      message.success('已复制模板');
      await loadAll(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleTemplateStatusChange(record, status) {
    try {
      if (status === 'DISABLED' && (sceneCountMap[record.id] || 0) > 0) {
        message.error('该模板已有引用场景，不能停用');
        return;
      }
      const saved = await sceneApi.saveTemplate({
        ...record,
        status,
      });
      setSelectedTemplateId(saved.id);
      message.success(
        status === 'ACTIVE'
          ? '模板已启用'
          : status === 'DISABLED'
            ? '模板已停用'
            : '模板状态已更新',
      );
      await loadAll(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleDeleteTemplate(id) {
    try {
      await sceneApi.removeTemplate(id);
      message.success('模板已删除');
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
        setPreviewDrawerOpen(false);
      }
      await loadAll(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  const columns = [
    {
      title: '模板名称',
      key: 'name',
      width: 280,
      render: (_, record) => (
        <div className="scene-template-name-cell">
          <div className="scene-template-name-row">
            <button type="button" className="scene-template-name-btn" onClick={() => openPreviewDrawer(record)}>
              {record.name}
            </button>
          </div>
          <div className="scene-template-subline">{record.description || '未填写描述'}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: '引用场景',
      key: 'sceneCount',
      width: 90,
      render: (_, record) => sceneCountMap[record.id] || 0,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 300,
      render: (_, record) => {
        const referencedSceneCount = sceneCountMap[record.id] || 0;
        const disableBlocked = referencedSceneCount > 0;
        return (
        <Space size={4} wrap onClick={(event) => event.stopPropagation()}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openPreviewDrawer(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
            编辑
          </Button>
          {record.status !== 'ACTIVE' ? (
            <Popconfirm
              title="启用模板"
              description="启用后新建场景时可直接选择该模板。"
              onConfirm={() => handleTemplateStatusChange(record, 'ACTIVE')}
              okText="启用"
              cancelText="取消"
            >
              <Button type="link" icon={<CheckCircleOutlined />}>
                启用
              </Button>
            </Popconfirm>
          ) : (
            disableBlocked ? (
              <span title="该模板已有引用场景，不能停用">
                <Button type="link" danger icon={<StopOutlined />} disabled>
                  停用
                </Button>
              </span>
            ) : (
              <Popconfirm
                title="停用模板"
                description="停用后新建场景时不可选择该模板，已创建场景不受影响。"
                onConfirm={() => handleTemplateStatusChange(record, 'DISABLED')}
                okText="停用"
                okButtonProps={{ danger: true }}
                cancelText="取消"
              >
                <Button type="link" danger icon={<StopOutlined />}>
                  停用
                </Button>
              </Popconfirm>
            )
          )}
          <Button type="link" icon={<CopyOutlined />} onClick={() => handleDuplicateTemplate(record.id)}>
            复制
          </Button>
          <Popconfirm
            title="删除模板"
            description="删除后不可恢复，已被场景使用的模板不能删除。"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
        );
      },
    },
  ];

  return (
    <div className="sys-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">场景模板</span>
          <span className="sys-module-header-subtitle">抽象角色、主题样式、文案、功能和资料结构，供新建场景时复用</span>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadAll()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            新建模板
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="scene-template-summary-grid">
          <div className="scene-template-stat-card">
            <div className="scene-template-stat-label">模板总数</div>
            <div className="scene-template-stat-value">{summary.templateCount}</div>
            <div className="scene-template-stat-hint">所有可维护的场景模板</div>
          </div>
          <div className="scene-template-stat-card">
            <div className="scene-template-stat-label">启用模板</div>
            <div className="scene-template-stat-value">{summary.activeCount}</div>
            <div className="scene-template-stat-hint">新建场景时可直接选择</div>
          </div>
          <div className="scene-template-stat-card">
            <div className="scene-template-stat-label">已创建场景</div>
            <div className="scene-template-stat-value">{summary.usedSceneCount}</div>
            <div className="scene-template-stat-hint">场景会复制一份模板快照</div>
          </div>
        </div>

        <div className="sys-search-card">
          <Input
            placeholder="搜索模板名称 / 编码 / 描述"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="模板状态"
            options={TEMPLATE_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 150 }}
          />
        </div>

        <div className="scene-template-main">
          <div className="scene-template-table-card">
            <Table
              loading={loading}
              rowKey="id"
              columns={columns}
              dataSource={filteredTemplates}
              pagination={{ pageSize: 8 }}
              rowClassName={(record) => record.id === selectedTemplateId ? 'scene-template-row-active' : ''}
              onRow={(record) => ({
                onClick: () => openPreviewDrawer(record),
              })}
            />
          </div>
        </div>
      </div>

      <Drawer
        title="查看场景模板"
        open={previewDrawerOpen}
        width={1040}
        onClose={() => setPreviewDrawerOpen(false)}
        extra={selectedTemplate ? (
          <Space>
            <Button icon={<CopyOutlined />} onClick={() => handleDuplicateTemplate(selectedTemplate.id)}>
              复制
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => openEditDrawer(selectedTemplate)}>
              编辑模板
            </Button>
          </Space>
        ) : null}
        destroyOnClose={false}
        className="scene-template-preview-drawer"
      >
        <SceneTemplatePreview
          template={selectedTemplate}
          sceneCount={selectedTemplate ? (sceneCountMap[selectedTemplate.id] || 0) : 0}
        />
      </Drawer>

      <Drawer
        title={isExistingEditing ? '编辑场景模板' : '新建场景模板'}
        open={drawerOpen}
        width={860}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTemplate(null);
        }}
        extra={(
          <Space>
            <Button onClick={() => {
              setDrawerOpen(false);
              setEditingTemplate(null);
            }}
            >
              取消
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveTemplate}>
              保存模板
            </Button>
          </Space>
        )}
        destroyOnClose
        className="scene-template-editor-drawer"
      >
        <Form form={templateForm} layout="vertical" className="scene-template-editor-form">
          <Tabs
            className="scene-template-editor-tabs"
            items={[
              {
                key: 'basic',
                label: '基础信息',
                children: (
                  <div className="scene-template-drawer-section">
                    <div className="scene-template-form-grid">
                      <Form.Item
                        label="模板名称"
                        name="name"
                        rules={[{ required: true, message: '请输入模板名称' }]}
                      >
                        <Input placeholder="例如：教学场景" />
                      </Form.Item>
                      <Form.Item label="模板编码" name="templateCode">
                        <Input placeholder="留空则自动生成" />
                      </Form.Item>
                      <Form.Item label="模板状态" name="status">
                        <Select
                          options={TEMPLATE_STATUS_OPTIONS.map((item) => ({
                            ...item,
                            disabled: item.value === 'DISABLED'
                              && editingTemplateSceneCount > 0
                              && editingTemplate?.status !== 'DISABLED',
                          }))}
                        />
                      </Form.Item>
                      <Form.Item className="scene-template-form-span-2" label="模板描述" name="description">
                        <TextArea rows={3} placeholder="描述这个模板适用的场景和目标对象" />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: 'metadata',
                label: '主题元数据',
                children: (
                  <div className="scene-template-drawer-section scene-template-metadata-section">
                    <div className="scene-template-metadata-form-designer">
                      <FormDesignerV2
                        value={watchedMetadataFields}
                        onChange={(nextFields) => templateForm.setFieldValue('metadataFields', nextFields)}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'theme',
                label: '主题样式',
                children: (
                  <div className="scene-template-drawer-section">
                    <Form.Item label="默认主题封面">
                      <div className="scene-template-cover-trigger">
                        <div
                          className="scene-template-cover-trigger-preview"
                          style={getSceneThemeCoverStyle(watchedTheme, {
                            overlayStart: 'rgba(15, 23, 42, 0.14)',
                            overlayEnd: 'rgba(15, 23, 42, 0.03)',
                          })}
                        />
                        <div className="scene-template-cover-trigger-copy">
                          <strong>
                            {watchedTheme.coverSource === 'UPLOAD'
                              ? '本地上传封面'
                              : (currentThemeCoverPreset?.name || '默认图库封面')}
                          </strong>
                          <span>
                            {watchedTheme.coverSource === 'UPLOAD'
                              ? '当前使用上传图片作为主题封面'
                              : `当前来自 ${currentThemeCoverPreset?.category || '图库'}，点击可重新选择`}
                          </span>
                        </div>
                        <Button onClick={() => setThemeCoverModalOpen(true)}>选择封面</Button>
                      </div>
                    </Form.Item>
                    <div className="scene-template-subsection-title">
                      <span>主题卡片</span>
                    </div>
                    <div className="scene-template-list-card">
                      <div className="scene-template-form-grid">
                        <Form.Item
                          label="卡片大小"
                          name={['topicCard', 'size']}
                          rules={[{ required: true, message: '请选择卡片大小' }]}
                        >
                          <Select options={TOPIC_CARD_SIZE_OPTIONS} />
                        </Form.Item>
                        <Form.Item label="显示场景类型" name={['topicCard', 'showSceneType']} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item label="显示成员数量" name={['topicCard', 'showMemberCount']} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item label="显示主题标题" name={['topicCard', 'showTitle']} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item label="显示主题标签" name={['topicCard', 'showTags']} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item label="显示主题图片" name={['topicCard', 'showCover']} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </div>
                    </div>
                    <div className="scene-template-subsection-title">
                      <span>卡片预览</span>
                    </div>
                    <SceneTemplateTopicCardPreview template={templateForm.getFieldsValue(true)} config={watchedTopicCard} />
                  </div>
                ),
              },
              {
                key: 'modeTabs',
                label: '主题模式',
                children: (
                  <div className="scene-template-mode-page">
                    <div className="scene-template-mode-grid">
                      {watchedModeTabs.map((mode, index) => {
                        const preset = modePresetMap.get(mode?.key) || null;
                        const modeLabel = preset?.label || mode?.label || mode?.key || `模式 ${index + 1}`;
                        return (
                        <div key={mode.id || mode.key || index} className="scene-template-mode-card">
                          <Form.Item name={['topicPage', 'modeTabs', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['topicPage', 'modeTabs', index, 'key']} hidden>
                            <Input />
                          </Form.Item>
                          <div className="scene-template-list-card-head">
                            <SceneTemplateIconLabel
                              iconKey={mode.iconKey || resolveSceneModeTabIconKey(mode)}
                              label={modeLabel}
                              config={mode}
                            />
                            <div className="scene-template-mode-head-actions">
                              <div className="scene-template-mode-sort-actions">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<UpOutlined />}
                                  disabled={index === 0}
                                  onClick={() => moveModeTab(index, -1)}
                                >
                                  上移
                                </Button>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DownOutlined />}
                                  disabled={index === watchedModeTabs.length - 1}
                                  onClick={() => moveModeTab(index, 1)}
                                >
                                  下移
                                </Button>
                              </div>
                              <div className="scene-template-mode-toggle">
                                <span>启用</span>
                                <Form.Item name={['topicPage', 'modeTabs', index, 'enabled']} valuePropName="checked" noStyle>
                                  <Switch />
                                </Form.Item>
                              </div>
                            </div>
                          </div>
                          <div className="scene-template-form-grid">
                            <Form.Item
                              label="页签名称"
                              name={['topicPage', 'modeTabs', index, 'label']}
                              rules={[{ required: true, message: '请输入页签名称' }]}
                            >
                              <Input placeholder={modeLabel} />
                            </Form.Item>
                            <Form.Item label="模式图标">
                              <SceneTemplateIconConfigurator
                                value={mode}
                                defaultIconKey={mode.iconKey || resolveSceneModeTabIconKey(mode)}
                                iconOptions={MODE_ICON_PICKER_OPTIONS}
                                title="选择模式图标"
                                onPresetChange={(nextIconKey) => handleModeTabChange(index, {
                                  iconSource: 'PRESET',
                                  iconKey: nextIconKey,
                                  iconImage: '',
                                })}
                                onUpload={(file) => handleModeTabIconUpload(index, file)}
                              />
                            </Form.Item>
                            {mode.key === 'home' ? (
                              <Form.Item
                                label="首页组件"
                                name={['topicPage', 'modeTabs', index, 'homeComponent']}
                                rules={[{ required: true, message: '请选择首页组件' }]}
                              >
                                <Select
                                  placeholder="请选择首页组件"
                                  options={HOME_COMPONENT_OPTIONS}
                                  optionFilterProp="label"
                                  showSearch
                                />
                              </Form.Item>
                            ) : (
                              <>
                                <Form.Item label="资料区标题" name={['topicPage', 'modeTabs', index, 'resourcePanelTitle']}>
                                  <Input placeholder="留空则使用上方默认资料区标题" />
                                </Form.Item>
                                <Form.Item label="新增资料按钮" name={['topicPage', 'modeTabs', index, 'addResourceLabel']}>
                                  <Input placeholder="留空则使用上方默认新增按钮文案" />
                                </Form.Item>
                                <Form.Item label="应用区按钮" name={['topicPage', 'modeTabs', index, 'appLabel']}>
                                  <Input placeholder="留空则使用上方默认应用区按钮文案" />
                                </Form.Item>
                                <Form.Item
                                  className="scene-template-form-span-2"
                                  label="空状态文案"
                                  name={['topicPage', 'modeTabs', index, 'emptyStateText']}
                                >
                                  <TextArea rows={2} placeholder="留空则使用上方默认空状态文案" />
                                </Form.Item>
                              </>
                            )}
                            <Form.Item name={['topicPage', 'modeTabs', index, 'iconSource']} hidden>
                              <Input />
                            </Form.Item>
                            <Form.Item name={['topicPage', 'modeTabs', index, 'iconKey']} hidden>
                              <Input />
                            </Form.Item>
                            <Form.Item name={['topicPage', 'modeTabs', index, 'iconImage']} hidden>
                              <Input />
                            </Form.Item>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              },
              {
                key: 'roles',
                label: '角色限定',
                children: (
                  <div className="scene-template-drawer-section">
                    <div className="scene-template-subsection-title with-action">
                      <span>角色限定</span>
                      <Space size={8} wrap>
                        <Button size="small" onClick={openRoleLibraryPicker}>
                          选择已有角色
                        </Button>
                        {watchedRoles.length > 0 ? (
                          <Button size="small" icon={<PlusOutlined />} onClick={appendRole}>
                            添加角色
                          </Button>
                        ) : null}
                      </Space>
                    </div>

                    {watchedRoles.length === 0 ? (
                      <div className="scene-template-role-empty-panel">
                        <div className="scene-template-role-empty-copy">
                          <strong>先创建角色，再配置功能权限和资料权限</strong>
                          <span>既可以新建角色，也可以从角色后台选择已有角色，按复制或引用方式引入。</span>
                        </div>
                        <Space wrap>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => templateForm.setFieldValue('roles', [createRoleDraft(1)])}
                          >
                            创建首个角色
                          </Button>
                          <Button onClick={openRoleLibraryPicker}>
                            选择已有角色
                          </Button>
                        </Space>
                      </div>
                    ) : null}

                    {watchedRoles.length > 0 ? (
                      <Tabs
                        type="editable-card"
                        hideAdd
                        activeKey={activeRoleTabKey || String(watchedRoles[0]?.id || 0)}
                        onChange={setActiveRoleTabKey}
                        onEdit={(targetKey, action) => {
                          if (action === 'remove') {
                            const removeIndex = watchedRoles.findIndex((role, index) => String(role?.id || index) === String(targetKey));
                            if (removeIndex >= 0) {
                              const targetRole = watchedRoles[removeIndex];
                              Modal.confirm({
                                title: '删除角色',
                                content: `确认删除角色“${targetRole?.name || `角色${removeIndex + 1}`}”吗？`,
                                okText: '删除',
                                okButtonProps: { danger: true },
                                cancelText: '取消',
                                onOk: () => removeRole(removeIndex),
                              });
                            }
                          }
                        }}
                        className="scene-template-role-tabs"
                        items={watchedRoles.map((role, index) => {
                          const roleReadonly = role?.bindingMode === 'REFERENCE';
                          return {
                            key: String(role?.id || index),
                            label: roleReadonly
                              ? `${role?.name || `角色${index + 1}`}（引用）`
                              : (role?.name || `角色${index + 1}`),
                            closable: watchedRoles.length > 1,
                            children: (
                              <div className="scene-template-role-tab-panel">
                                <div className="scene-template-role-stack">
                                  {roleReadonly ? (
                                    <div className="scene-template-role-reference-note">
                                      {`当前角色引用自已有角色「${role?.sourceRoleName || role?.name || '未命名角色'}」，角色定义内容仅可查看，不能修改。如需调整，请改用“复制角色定义”方式引入。`}
                                    </div>
                                  ) : null}
                                  <div className="scene-template-role-editor-block scene-template-role-editor-block-basic">
                                    <div className="scene-template-role-editor-title">基本信息</div>
                                    <div className="scene-template-form-grid">
                                      <Form.Item label="角色标识" name={['roles', index, 'key']}>
                                        <Input placeholder="例如：teacher" disabled={roleReadonly} />
                                      </Form.Item>
                                      <Form.Item label="角色名称" name={['roles', index, 'name']}>
                                        <Input placeholder="例如：教师" disabled={roleReadonly} />
                                      </Form.Item>
                                      <Form.Item className="scene-template-form-span-2" label="角色说明" name={['roles', index, 'description']}>
                                        <TextArea rows={2} placeholder="说明该角色在场景中的职责" disabled={roleReadonly} />
                                      </Form.Item>
                                    </div>
                                  </div>
                                  <div className="scene-template-role-editor-sections">
                                    <div className="scene-template-role-editor-block scene-template-role-editor-block-function">
                                      <div className="scene-template-role-editor-title">功能授权</div>
                                      <div className="scene-template-role-editor-stack-grid">
                                        <Form.Item label="授权方式" name={['roles', index, 'functionalPermissionMode']}>
                                          <Select options={ROLE_FUNCTION_PERMISSION_MODE_OPTIONS} disabled={roleReadonly} />
                                        </Form.Item>
                                        <div className="scene-template-mode-hint">
                                          支持正选和反选。选择“不包括以下功能”时，树中勾选的是排除项。
                                        </div>
                                        <Form.Item label="功能树授权" name={['roles', index, 'functionalPermissions']}>
                                          <TreeSelect
                                            treeData={ROLE_FUNCTION_PERMISSION_TREE}
                                            treeCheckable
                                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                                            placeholder="从功能树中选择授权项"
                                            allowClear
                                            disabled={roleReadonly}
                                          />
                                        </Form.Item>
                                        <Form.Item label="功能说明" name={['roles', index, 'permissionSummary']}>
                                          <Input placeholder="例如：可管理主题、资料和作业" disabled={roleReadonly} />
                                        </Form.Item>
                                      </div>
                                    </div>
                                    <div className="scene-template-role-editor-block scene-template-role-editor-block-data">
                                      <div className="scene-template-role-editor-title">资料授权</div>
                                      <div className="scene-template-role-editor-stack-grid">
                                        <Form.Item label="资料归属范围" name={['roles', index, 'dataAccessScope']}>
                                          <Select options={ROLE_DATA_SCOPE_OPTIONS} disabled={roleReadonly} />
                                        </Form.Item>
                                        {role?.dataAccessScope === 'ASSIGNED' ? (
                                          <>
                                            <Form.Item label="授权方式" name={['roles', index, 'assignedAccessRuleType']}>
                                              <Select options={ASSIGNED_ACCESS_RULE_OPTIONS} disabled={roleReadonly} />
                                            </Form.Item>
                                            <div className="scene-template-mode-hint">
                                              仅在“指定授权资料”下配置授权方式。默认“全部授权对象”，也可以按资料类型、目录类型、资料属性或具体资料逐项授权；目录类型已并入授权对象列表。
                                            </div>
                                            {role?.assignedAccessRuleType === 'RESOURCE_TYPE' ? (
                                              <Form.Item
                                                label="授权对象"
                                                name={['roles', index, 'dataAccessAreas']}
                                                rules={[{ required: true, message: '请选择授权对象' }]}
                                              >
                                                <Select
                                                  mode="multiple"
                                                  options={assignedResourceTypeOptions}
                                                  placeholder="选择资料类型或目录类型"
                                                  notFoundContent="请先在下方资料目录类型中配置目录"
                                                  disabled={roleReadonly}
                                                />
                                              </Form.Item>
                                            ) : null}
                                            {role?.assignedAccessRuleType === 'RESOURCE_ATTR' ? (
                                              <Form.Item
                                                label="授权对象"
                                                name={['roles', index, 'assignedAttributeRules']}
                                                rules={[{ required: true, message: '请输入资料属性条件' }]}
                                              >
                                                <Select
                                                  mode="tags"
                                                  placeholder="输入资料属性条件后回车，例如：学科=数学、阶段=结营、标签=重点"
                                                  disabled={roleReadonly}
                                                />
                                              </Form.Item>
                                            ) : null}
                                            {role?.assignedAccessRuleType === 'RESOURCE_ITEM' ? (
                                              <Form.Item
                                                label="授权对象"
                                                name={['roles', index, 'authorizedResourceRefs']}
                                                rules={[{ required: true, message: '请输入具体资料标识' }]}
                                              >
                                                <Select
                                                  mode="tags"
                                                  placeholder="输入具体资料名称、编码或唯一标识后回车"
                                                  disabled={roleReadonly}
                                                />
                                              </Form.Item>
                                            ) : null}
                                          </>
                                        ) : (
                                          <div className="scene-template-mode-hint">
                                            当前范围下无需逐项配置授权对象，系统会按“资料归属范围”自动生效。
                                          </div>
                                        )}
                                        <Form.Item label="资料权限说明" name={['roles', index, 'scopeSummary']}>
                                          <Input placeholder="例如：仅可查看公开的调查与投票数据" disabled={roleReadonly} />
                                        </Form.Item>
                                      </div>
                                    </div>
                                  </div>
                                  <Form.Item name={['roles', index, 'id']} hidden>
                                    <Input />
                                  </Form.Item>
                                  <Form.Item name={['roles', index, 'agentName']} hidden>
                                    <Input />
                                  </Form.Item>
                                  <Form.Item name={['roles', index, 'bindingMode']} hidden>
                                    <Input />
                                  </Form.Item>
                                  <Form.Item name={['roles', index, 'sourceRoleId']} hidden>
                                    <Input />
                                  </Form.Item>
                                  <Form.Item name={['roles', index, 'sourceRoleName']} hidden>
                                    <Input />
                                  </Form.Item>
                                </div>
                              </div>
                            ),
                          };
                        })}
                      />
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'tools',
                label: '工具与资料',
                children: (
                  <div className="scene-template-drawer-section">
                    <div className="scene-template-form-grid">
                      <Form.Item className="scene-template-form-span-2" label="资料区工具" name={['toolAreas', 'resourceAreaTools']}>
                        <Select mode="multiple" options={TOOL_OPTIONS} placeholder="选择在资料区出现的工具" />
                      </Form.Item>
                      <Form.Item className="scene-template-form-span-2" label="创作结果区工具" name={['toolAreas', 'resultAreaTools']}>
                        <Select mode="multiple" options={TOOL_OPTIONS} placeholder="选择在创作结果区出现的工具" />
                      </Form.Item>
                      <Form.Item
                        label="允许根目录直接放资料"
                        name={['topicPage', 'allowRootResources']}
                        valuePropName="checked"
                        extra="开启后可不创建资料目录，直接把资料放在根目录。"
                      >
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="scene-template-subsection-title with-action">
                      <span>工具配置项</span>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={openToolConfigPicker}
                      >
                        添加工具配置
                      </Button>
                    </div>

                    {watchedToolConfigs.map((tool, index) => (
                      <div key={tool?.id || index} className="scene-template-list-card scene-template-tool-config-card">
                        <div className="scene-template-list-card-head scene-template-tool-config-head">
                          <strong>{getToolCardTitle(tool)}</strong>
                          <div className="scene-template-tool-config-head-actions">
                            <div className="scene-template-tool-config-switch">
                              <span>启用</span>
                              <Form.Item name={['toolConfigs', index, 'enabled']} valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                            <Button
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const nextTools = [...watchedToolConfigs];
                                nextTools.splice(index, 1);
                                templateForm.setFieldsValue({ toolConfigs: nextTools });
                              }}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                        <div className="scene-template-form-grid">
                          <Form.Item
                            label="工具名称"
                            name={['toolConfigs', index, 'key']}
                            rules={[{ required: true, message: '请选择工具名称' }]}
                          >
                            <Select
                              options={TOOL_OPTIONS}
                              placeholder="请选择内置工具"
                              optionFilterProp="label"
                              showSearch
                              onChange={(value) => handleBuiltinToolChange(index, value)}
                            />
                          </Form.Item>
                          <Form.Item label="工具别名" name={['toolConfigs', index, 'name']}>
                            <Input placeholder="留空则默认使用内置工具名称" />
                          </Form.Item>
                          <Form.Item label="工具图标">
                            <SceneTemplateIconConfigurator
                              value={tool}
                              defaultIconKey={tool.iconKey || resolveSceneToolIconKey({
                                ...tool,
                                name: tool.name || getToolLabel(tool.key),
                              })}
                              iconOptions={TOOL_ICON_PICKER_OPTIONS}
                              title="选择工具图标"
                              onPresetChange={(nextIconKey) => handleToolConfigChange(index, {
                                iconSource: 'PRESET',
                                iconKey: nextIconKey,
                                iconImage: '',
                              })}
                              onUpload={(file) => handleToolIconUpload(index, file)}
                            />
                          </Form.Item>
                          <Form.Item label="出现位置" name={['toolConfigs', index, 'placement']}>
                            <Select options={TOOL_PLACEMENT_OPTIONS} />
                          </Form.Item>
                          <Form.Item className="scene-template-form-span-2" label="配置说明" name={['toolConfigs', index, 'description']}>
                            <TextArea rows={2} placeholder="说明这个工具的功能范围和使用约束" />
                          </Form.Item>
                          <Form.Item name={['toolConfigs', index, 'iconSource']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['toolConfigs', index, 'iconKey']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['toolConfigs', index, 'iconImage']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['toolConfigs', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
                        </div>
                      </div>
                    ))}

                    <div className="scene-template-subsection-title with-action">
                      <span>资料目录类型</span>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const nextFolders = [...watchedFolderTypes, {
                            id: `folder_${Date.now()}`,
                            key: '',
                            name: '',
                            iconSource: 'PRESET',
                            iconKey: 'FOLDER',
                            iconImage: '',
                            description: '',
                            roleIds: [],
                            allowedTools: [],
                            required: false,
                          }];
                          templateForm.setFieldsValue({ folderTypes: nextFolders });
                        }}
                      >
                        添加目录类型
                      </Button>
                    </div>

                    {watchedFolderTypes.map((folder, index) => (
                      <div key={folder?.id || index} className="scene-template-list-card">
                        <div className="scene-template-list-card-head">
                          <strong>目录类型 {index + 1}</strong>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const nextFolders = [...watchedFolderTypes];
                              nextFolders.splice(index, 1);
                              templateForm.setFieldsValue({ folderTypes: nextFolders });
                            }}
                          >
                            删除
                          </Button>
                        </div>
                        <div className="scene-template-form-grid">
                          <Form.Item label="目录标识" name={['folderTypes', index, 'key']}>
                            <Input placeholder="例如：courseware" />
                          </Form.Item>
                          <Form.Item label="目录名称" name={['folderTypes', index, 'name']}>
                            <Input placeholder="例如：课程课件" />
                          </Form.Item>
                          <Form.Item label="目录图标">
                            <SceneTemplateIconConfigurator
                              value={folder}
                              defaultIconKey={folder.iconKey || resolveSceneFolderIconKey(folder)}
                              iconOptions={FOLDER_ICON_PICKER_OPTIONS}
                              title="选择目录图标"
                              onPresetChange={(nextIconKey) => handleFolderTypeChange(index, {
                                iconSource: 'PRESET',
                                iconKey: nextIconKey,
                                iconImage: '',
                              })}
                              onUpload={(file) => handleFolderIconUpload(index, file)}
                            />
                          </Form.Item>
                          <Form.Item label="角色限制" name={['folderTypes', index, 'roleIds']}>
                            <Select mode="multiple" options={roleOptions} placeholder="限定可管理此目录的角色" />
                          </Form.Item>
                          <Form.Item label="允许工具" name={['folderTypes', index, 'allowedTools']}>
                            <Select
                              mode="multiple"
                              options={ALLOWED_TOOL_SELECT_OPTIONS}
                              placeholder="该目录允许的工具类型"
                              onChange={(values) => handleFolderAllowedToolsChange(index, values)}
                            />
                          </Form.Item>
                          <Form.Item label="必选目录" name={['folderTypes', index, 'required']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <div />
                          <Form.Item className="scene-template-form-span-2" label="目录说明" name={['folderTypes', index, 'description']}>
                            <TextArea rows={2} placeholder="说明这个目录承载的内容类型和依赖关系" />
                          </Form.Item>
                          <Form.Item name={['folderTypes', index, 'iconSource']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['folderTypes', index, 'iconKey']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['folderTypes', index, 'iconImage']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['folderTypes', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
                        </div>
                        <div className="scene-template-mode-hint">
                          当前目录允许工具：
                          {' '}
                          {getAllowedToolDisplayList(folder.allowedTools).length
                            ? getAllowedToolDisplayList(folder.allowedTools).map((toolItem) => (
                                <Tag key={`${folder?.id || index}_${toolItem.key}`}>
                                  <SceneTemplateIconLabel
                                    config={toolItem.key === UNLIMITED_TOOL_VALUE
                                      ? null
                                      : resolveToolConfigByToolKey(toolItem.key, watchedToolIconLookup)}
                                    iconKey={toolItem.key === UNLIMITED_TOOL_VALUE
                                      ? 'GRID'
                                      : resolveToolIconKeyByToolKey(toolItem.key, watchedToolIconLookup)}
                                    label={toolItem.label}
                                    colorMode="inherit"
                                  />
                                </Tag>
                              ))
                            : '未配置'}
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'versioning',
                label: '版本管理',
                children: (
                  <div className="scene-template-drawer-section">
                    <div className="scene-template-subsection-title">
                      <span>版本管理</span>
                    </div>

                    <div className="scene-template-list-card">
                      <div className="scene-template-form-grid">
                        <Form.Item label="启用版本管理" name={['versioning', 'enabled']} valuePropName="checked">
                          <Switch disabled={!versioningSupported} />
                        </Form.Item>
                        <div className="scene-template-mode-hint">
                          {versioningSupported
                            ? '关闭后主题内不显示版本切换入口，当前内容直接在单份资料上维护。'
                            : '当前仅组织培训场景支持版本管理，其他场景固定为单份内容维护。'}
                        </div>
                        {watchedVersioningEnabled ? (
                          <>
                            <Form.Item label="最多版本数" name={['versioning', 'maxVersions']}>
                              <InputNumber min={1} max={20} precision={0} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="新建版本规则" name={['versioning', 'createMode']}>
                              <Select options={VERSION_CREATE_MODE_OPTIONS} />
                            </Form.Item>
                            <Form.Item label="版本名称规则" name={['versioning', 'namePattern']}>
                              <Input placeholder="例如：版本 {index}" />
                            </Form.Item>
                            <Form.Item label="允许回退历史版本" name={['versioning', 'allowRollback']} valuePropName="checked">
                              <Switch />
                            </Form.Item>
                            <Form.Item label="允许删除已失效版本" name={['versioning', 'allowDeletePublished']} valuePropName="checked">
                              <Switch />
                            </Form.Item>
                            <div className="scene-template-mode-hint">
                              支持使用 <code>{'{index}'}</code> 作为版本序号占位符，例如 <code>第 {'{index}'} 版</code>。
                            </div>
                            <Form.Item className="scene-template-form-span-2" label="版本规则说明" name={['versioning', 'description']}>
                              <TextArea rows={2} placeholder="说明这个场景下的版本发布、回退和维护规范" />
                            </Form.Item>
                          </>
                        ) : (
                          <Form.Item className="scene-template-form-span-2" label="关闭说明" name={['versioning', 'description']}>
                            <TextArea rows={2} placeholder="例如：该场景不需要多版本，直接维护当前内容即可" />
                          </Form.Item>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'rules',
                label: '规则与进入',
                children: (
                  <div className="scene-template-drawer-section">
                    <Form.Item name="statusPresetSceneType" hidden>
                      <Input />
                    </Form.Item>
                    <div className="scene-template-form-grid">
                      <Form.Item className="scene-template-form-span-2" label="进入主题的方式" name="entryMethods">
                        <Select mode="multiple" options={ENTRY_METHOD_OPTIONS} placeholder="选择该场景支持的进入方式" />
                      </Form.Item>
                    </div>

                    <div className="scene-template-subsection-title with-action">
                      <span>状态控制规则</span>
                      <Space size="small">
                        <Popconfirm
                          title="恢复默认阶段"
                          description={`确认按${getSceneTypeLabel(watchedStatusPresetSceneType)}默认阶段模型重置当前状态规则吗？`}
                          okText="恢复默认"
                          cancelText="取消"
                          onConfirm={handleRestoreStatusRules}
                        >
                          <Button size="small" icon={<ReloadOutlined />}>
                            恢复默认阶段
                          </Button>
                        </Popconfirm>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const nextRules = [...watchedStatusRules, {
                              id: `rule_${Date.now()}`,
                              key: '',
                              name: '',
                              stage: 'RUNNING',
                              controlMode: 'COLLABORATIVE',
                              entryEnabled: true,
                              roleIds: [],
                              description: '',
                            }];
                            templateForm.setFieldsValue({ statusRules: nextRules });
                          }}
                        >
                          添加规则
                        </Button>
                      </Space>
                    </div>
                    <div className="scene-template-guidance-panel">
                      <div className="scene-template-guidance-title">当前空间主题阶段模型</div>
                      <div className="scene-template-guidance-text">
                        {`当前模板按 ${getSceneTypeLabel(watchedStatusPresetSceneType)} 的默认阶段模型解释这些规则。${currentStatusPreset.description}`}
                      </div>
                    </div>
                    <div className="scene-template-mode-hint">
                      阶段是平台级生命周期分类；具体名称和规则由空间主题预置。你可以调整状态名称、控制策略、开放进入和适用角色，但阶段类型仍限定为平台统一的 6 个阶段。
                    </div>
                    {statusRuleGuidance.length > 0 ? (
                      <div className="scene-template-warning-list">
                        {statusRuleGuidance.map((item) => (
                          <div key={item} className="scene-template-warning-item">{item}</div>
                        ))}
                      </div>
                    ) : null}

                    {watchedStatusRules.map((rule, index) => (
                      <div key={rule?.id || index} className="scene-template-list-card">
                        <div className="scene-template-list-card-head">
                          <strong>状态规则 {index + 1}</strong>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const nextRules = [...watchedStatusRules];
                              nextRules.splice(index, 1);
                              templateForm.setFieldsValue({ statusRules: nextRules });
                            }}
                          >
                            删除
                          </Button>
                        </div>
                        <div className="scene-template-form-grid">
                          <Form.Item
                            label="状态编码"
                            name={['statusRules', index, 'key']}
                            rules={[
                              { required: true, message: '请输入状态编码' },
                              { pattern: /^[a-z][a-z0-9_]*$/, message: '状态编码需使用英文小写字母、数字或下划线，且以字母开头' },
                            ]}
                          >
                            <Input placeholder="例如：running / reviewing" />
                          </Form.Item>
                          <Form.Item
                            label="状态名称"
                            name={['statusRules', index, 'name']}
                            rules={[{ required: true, message: '请输入状态名称' }]}
                          >
                            <Input placeholder="例如：培训中 / 已结课" />
                          </Form.Item>
                          <Form.Item label="状态阶段" name={['statusRules', index, 'stage']}>
                            <Select options={STATUS_RULE_STAGE_OPTIONS} />
                          </Form.Item>
                          <div className="scene-template-mode-hint scene-template-form-span-2">
                            {getStatusRuleStageDescription(rule?.stage)}
                          </div>
                          <Form.Item label="控制策略" name={['statusRules', index, 'controlMode']}>
                            <Select options={STATUS_RULE_CONTROL_OPTIONS} />
                          </Form.Item>
                          <Form.Item label="开放进入" name={['statusRules', index, 'entryEnabled']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Form.Item label="适用角色" name={['statusRules', index, 'roleIds']}>
                            <Select
                              mode="multiple"
                              options={roleOptions}
                              placeholder="选择该状态下允许操作的角色"
                            />
                          </Form.Item>
                          <Form.Item className="scene-template-form-span-2" label="规则说明" name={['statusRules', index, 'description']}>
                            <TextArea rows={2} placeholder="补充说明该状态下的业务限制、动作边界或自动化条件" />
                          </Form.Item>
                          <Form.Item name={['statusRules', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Form>
        <Modal
          title="选择要配置的工具"
          open={toolConfigPickerOpen}
          onCancel={() => {
            setToolConfigPickerOpen(false);
            setSelectedToolConfigKey(null);
          }}
          onOk={handleAddToolConfig}
          okText="添加配置"
          cancelText="取消"
          okButtonProps={{ disabled: !selectedToolConfigKey }}
          width={720}
          destroyOnClose
        >
          {availableToolConfigOptions.length ? (
            <div className="scene-template-tool-picker-grid">
              {availableToolConfigOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`scene-template-tool-picker-tile ${selectedToolConfigKey === item.value ? 'is-active' : ''}`}
                  onClick={() => setSelectedToolConfigKey(item.value)}
                >
                  <SceneTemplateIconLabel
                    config={resolveToolConfigByToolKey(item.value, watchedToolIconLookup)}
                    iconKey={resolveToolIconKeyByToolKey(item.value, watchedToolIconLookup)}
                    label={item.label}
                  />
                </button>
              ))}
            </div>
          ) : (
            <Empty description="可配置工具已全部添加" />
          )}
        </Modal>
        <Modal
          title="选择已有角色"
          open={roleLibraryModalOpen}
          onCancel={() => {
            setRoleLibraryModalOpen(false);
            roleLibraryForm.resetFields();
          }}
          onOk={handleImportRoleFromLibrary}
          okText="引入角色"
          cancelText="取消"
          width={720}
          destroyOnClose
        >
          <Form form={roleLibraryForm} layout="vertical">
            <div className="scene-template-form-grid">
              <Form.Item
                className="scene-template-form-span-2"
                label="已有角色"
                name="roleId"
                rules={[{ required: true, message: '请选择已有角色' }]}
              >
                <Select
                  placeholder="从管理后台选择已有角色"
                  options={roleLibraryOptions}
                  optionFilterProp="label"
                  showSearch
                />
              </Form.Item>
              <Form.Item
                className="scene-template-form-span-2"
                label="引入方式"
                name="importMode"
                rules={[{ required: true, message: '请选择引入方式' }]}
              >
                <Radio.Group
                  options={ROLE_LIBRARY_IMPORT_MODE_OPTIONS}
                  optionType="button"
                  buttonStyle="solid"
                />
              </Form.Item>
            </div>

            {selectedRoleLibraryDefinition ? (
              <div className="scene-template-role-library-preview">
                <div className="scene-template-role-library-preview-head">
                  <strong>{selectedRoleLibraryDefinition.name}</strong>
                  <Tag>{selectedRoleLibraryDefinition.key}</Tag>
                </div>
                <div className="scene-template-role-library-preview-meta">
                  <span>{selectedRoleLibraryDefinition.description || '未填写角色说明'}</span>
                  <span>{selectedRoleLibraryDefinition.permissionSummary || '未填写功能说明'}</span>
                  <span>{selectedRoleLibraryDefinition.scopeSummary || '未填写资料权限说明'}</span>
                </div>
              </div>
            ) : null}

            {selectedRoleImportMode === 'REFERENCE' ? (
              <div className="scene-template-role-library-hint">
                引用后角色定义仅可查看，不能在模板内修改；后续如需调整，请重新按“复制角色定义”方式引入。
              </div>
            ) : null}
            {selectedRoleImportMode === 'COPY' ? (
              <div className="scene-template-role-library-hint">
                复制后会生成当前模板自己的角色副本，后续字段、权限和资料范围都可以继续编辑。
              </div>
            ) : null}
          </Form>
        </Modal>
        <Modal
          title="选择默认主题封面"
          open={themeCoverModalOpen}
          onCancel={() => setThemeCoverModalOpen(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setThemeCoverModalOpen(false)}>
              完成
            </Button>,
          ]}
          width={1120}
          className="scene-template-cover-modal"
        >
          <Tabs
            activeKey={watchedTheme.coverSource === 'UPLOAD' ? 'upload' : 'gallery'}
            onChange={(key) => {
              if (key === 'gallery') {
                updateThemeConfig({ coverSource: 'PRESET' });
              } else {
                updateThemeConfig({ coverSource: 'UPLOAD' });
              }
            }}
            items={[
              {
                key: 'gallery',
                label: '图库',
                children: (
                  <div className="scene-template-cover-panel">
                    {themeCoverPresetGroups.map((group) => (
                      <div key={group.category} className="scene-template-cover-group">
                        <div className="scene-template-cover-group-title">{group.category}</div>
                        <div className="scene-template-cover-grid">
                          {group.presets.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              className={`scene-template-cover-tile ${watchedTheme.coverSource !== 'UPLOAD' && watchedTheme.coverPresetId === preset.id ? 'is-active' : ''}`}
                              onClick={() => handleSelectThemeCoverPreset(preset.id)}
                            >
                              <div
                                className="scene-template-cover-thumb"
                                style={{ backgroundImage: `url("${preset.image}")` }}
                              />
                              <span>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'upload',
                label: '本地上传',
                children: (
                  <div className="scene-template-cover-upload-panel">
                    <div
                      className="scene-template-cover-upload-preview"
                      style={uploadedThemeCoverImage
                        ? { backgroundImage: `url("${uploadedThemeCoverImage}")` }
                        : undefined}
                    >
                      {!uploadedThemeCoverImage ? '上传后在这里预览主题封面' : null}
                    </div>
                    <div className="scene-template-cover-upload-actions">
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleThemeCoverUpload}
                      >
                        <Button icon={<UploadOutlined />}>本地上传</Button>
                      </Upload>
                      <Button onClick={() => updateThemeConfig({ coverSource: 'PRESET' })}>
                        恢复图库封面
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Modal>
      </Drawer>
    </div>
  );
}
