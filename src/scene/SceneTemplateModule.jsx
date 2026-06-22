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
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  ASSIGNED_ACCESS_RULE_OPTIONS,
  ENTRY_METHOD_OPTIONS,
  MODE_TAB_PRESET_OPTIONS,
  ROLE_DATA_ACCESS_AREA_OPTIONS,
  ROLE_FUNCTION_PERMISSION_MODE_OPTIONS,
  ROLE_DATA_SCOPE_OPTIONS,
  ROLE_FUNCTION_PERMISSION_OPTIONS,
  ROLE_FUNCTION_PERMISSION_TREE,
  STATUS_RULE_CONTROL_OPTIONS,
  STATUS_RULE_STAGE_OPTIONS,
  TEMPLATE_STATUS_OPTIONS,
  TOOL_OPTIONS,
  TOOL_PLACEMENT_OPTIONS,
  VERSION_CREATE_MODE_OPTIONS,
  createRoleDraft,
  createTemplateDraft,
  getAssignedAccessRuleLabel,
  getRoleFunctionPermissionModeLabel,
  getSceneStoreChangeEventName,
  getStatusRuleControlLabel,
  getStatusRuleStageLabel,
  sceneApi,
} from './api';
import FormDesignerV2 from '../processV2/form/FormDesignerV2';
import {
  SCENE_THEME_COVER_PRESETS,
  getSceneThemeCoverPreset,
  getSceneThemeCoverStyle,
} from './themeCovers';
import '../system/SystemModule.css';
import './SceneTemplateModule.css';

const { TextArea } = Input;
const MODE_TAB_HINT_MAP = {
  knowledge: '用于知识资料、课程内容等展示；停用后该页签不会出现在主题中。',
  ai: '用于 AI 问答、辅学、共创助手等内容；停用后该页签不会出现在主题中。',
  practice: '用于实训任务、项目练习和过程产出；停用后该页签不会出现在主题中。',
  assessment: '用于考试、量规、评阅等考核配置；启用后会进入专用的考核配置页。',
};
const TOPIC_THEME_MODE_OPTIONS = [
  { value: 'DEFAULT', label: '默认浅灰白' },
  { value: 'SCENE', label: '跟随场景色' },
];

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

function getTopicThemeModeLabel(value) {
  return TOPIC_THEME_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

function countEnabledTools(template) {
  return new Set([
    ...(template?.toolAreas?.resourceAreaTools || []),
    ...(template?.toolAreas?.resultAreaTools || []),
  ]).size;
}

function SceneTemplatePreview({ template, sceneCount }) {
  if (!template) {
    return (
      <div className="scene-template-preview-card">
        <Empty description="请选择一个模板查看配置预览" />
      </div>
    );
  }

  const enabledModes = (template.topicPage?.modeTabs || []).filter((item) => item.enabled !== false);
  const roleNameMap = new Map((template.roles || []).map((role) => [role.id, role.name]));
  const folderNameMap = new Map((template.folderTypes || []).map((folder) => [folder.key, folder.name]));

  return (
    <div className="scene-template-preview-card">
      <div
        className="scene-template-preview-hero"
        style={getSceneThemeCoverStyle(template.theme)}
      >
        <div className="scene-template-preview-copy">
          <div className="scene-template-preview-kicker">{template.theme.badgeText}</div>
          <div className="scene-template-preview-title">{template.name}</div>
          <div className="scene-template-preview-desc">{template.theme.heroSubtitle}</div>
          <div className="scene-template-preview-meta">
            <span>{sceneCount} 个场景在用</span>
            <span>{countEnabledTools(template)} 个工具能力</span>
          </div>
        </div>
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">角色限定</div>
        <div className="scene-template-role-grid">
          {template.roles.map((role) => (
            <div key={role.id} className="scene-template-role-card">
              <div className="scene-template-role-head">
                <strong>{role.name}</strong>
              </div>
              <div className="scene-template-role-desc">{role.description || '未填写角色说明'}</div>
              <div className="scene-template-role-block scene-template-role-block-function">
                <div className="scene-template-role-block-title">功能授权</div>
                <div className="scene-template-role-meta">
                  <div className="scene-template-tag-wrap">
                    <Tag color={role.functionalPermissionMode === 'EXCLUDE' ? 'volcano' : 'blue'}>
                      {getRoleFunctionPermissionModeLabel(role.functionalPermissionMode)}
                    </Tag>
                    {getFunctionalPermissionSummary(role).length > 0
                      ? getFunctionalPermissionSummary(role).map((label) => (
                          <Tag key={`${role.id}_${label}`} color="blue">{label}</Tag>
                        ))
                      : <span className="scene-template-role-empty">未配置</span>}
                  </div>
                </div>
                {role.permissionSummary ? (
                  <div className="scene-template-role-note">功能说明：{role.permissionSummary}</div>
                ) : null}
              </div>
              <div className="scene-template-role-block scene-template-role-block-data">
                <div className="scene-template-role-block-title">资料授权</div>
                <div className="scene-template-role-meta">
                  <div className="scene-template-tag-wrap">
                    <Tag color="geekblue">{getRoleDataScopeLabel(role.dataAccessScope)}</Tag>
                    {role.dataAccessScope === 'ASSIGNED'
                      ? (
                          <>
                            <Tag color="purple">{getAssignedAccessRuleLabel(role.assignedAccessRuleType)}</Tag>
                            {getAssignedAccessSummary(role, folderNameMap).map((label) => (
                              <Tag key={`${role.id}_data_${label}`}>{label}</Tag>
                            ))}
                          </>
                        )
                      : null}
                  </div>
                </div>
                {role.scopeSummary ? (
                  <div className="scene-template-role-note">资料权限说明：{role.scopeSummary}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">主题模式与文案</div>
        <div className="scene-template-inline-meta">
          <span>详情页主题：{getTopicThemeModeLabel(template.theme?.topicThemeMode || 'DEFAULT')}</span>
          <span>资料区：{template.topicPage.resourcePanelTitle}</span>
          <span>新增按钮：{template.topicPage.addResourceLabel}</span>
        </div>
        <div className="scene-template-tag-wrap">
          {enabledModes.map((item) => (
            <Tag key={item.key} color="blue">{item.label}</Tag>
          ))}
        </div>
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">资料结构</div>
        <div className="scene-template-folder-list">
          {template.folderTypes.map((folder) => (
            <div key={folder.id} className="scene-template-folder-card">
              <div className="scene-template-folder-head">
                <span>{folder.name}</span>
                {folder.required ? <Tag color="orange">必选</Tag> : null}
              </div>
              <div className="scene-template-folder-desc">{folder.description || '未填写说明'}</div>
              <div className="scene-template-folder-tools">
                {(folder.allowedTools || []).map((toolKey) => (
                  <span key={toolKey}>{getToolLabel(toolKey)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">工具与进入方式</div>
        <div className="scene-template-inline-columns">
          <div>
            <div className="scene-template-subtitle">资料区工具</div>
            <div className="scene-template-tag-wrap">
              {(template.toolAreas.resourceAreaTools || []).map((toolKey) => (
                <Tag key={toolKey}>{getToolLabel(toolKey)}</Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="scene-template-subtitle">创作结果区工具</div>
            <div className="scene-template-tag-wrap">
              {(template.toolAreas.resultAreaTools || []).map((toolKey) => (
                <Tag key={toolKey}>{getToolLabel(toolKey)}</Tag>
              ))}
            </div>
          </div>
          <div>
            <div className="scene-template-subtitle">进入方式</div>
            <div className="scene-template-tag-wrap">
              {(template.entryMethods || []).map((method) => (
                <Tag key={method}>{getEntryMethodLabel(method)}</Tag>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">版本管理</div>
        <div className="scene-template-inline-meta">
          <span>{template.versioning?.enabled !== false ? '启用版本管理' : '不启用版本管理'}</span>
          {template.versioning?.enabled !== false ? (
            <>
              <span>最多 {template.versioning?.maxVersions || 5} 个版本</span>
              <span>{getVersionCreateModeLabel(template.versioning?.createMode)}</span>
            </>
          ) : null}
        </div>
        {template.versioning?.enabled !== false ? (
          <div className="scene-template-tag-wrap">
            {template.versioning?.allowRollback ? <Tag color="blue">允许回退</Tag> : <Tag>不允许回退</Tag>}
            {template.versioning?.allowDeletePublished ? <Tag color="blue">允许删除历史版本</Tag> : <Tag>历史版本不可删</Tag>}
            <Tag>{template.versioning?.namePattern || '版本 {index}'}</Tag>
          </div>
        ) : null}
        {template.versioning?.description ? (
          <div className="scene-template-role-note">规则说明：{template.versioning.description}</div>
        ) : null}
      </div>

      <div className="scene-template-preview-section">
        <div className="scene-template-preview-section-title">状态规则</div>
        <div className="scene-template-preview-list">
          {(template.statusRules || []).map((rule) => (
            <div key={rule.id} className="scene-template-preview-list-row">
              <strong>{rule.name}</strong>
              <div className="scene-template-tag-wrap">
                <Tag>{rule.key || '未设编码'}</Tag>
                <Tag color="blue">{getStatusRuleStageLabel(rule.stage)}</Tag>
                <Tag color="geekblue">{getStatusRuleControlLabel(rule.controlMode)}</Tag>
                <Tag color={rule.entryEnabled ? 'green' : 'default'}>
                  {rule.entryEnabled ? '开放进入' : '关闭进入'}
                </Tag>
                {(rule.roleIds || []).length > 0
                  ? rule.roleIds.map((roleId) => (
                      <Tag key={`${rule.id}_${roleId}`}>{roleNameMap.get(roleId) || roleId}</Tag>
                    ))
                  : <Tag>未限定角色</Tag>}
              </div>
              <span>{rule.description || '未填写规则说明'}</span>
            </div>
          ))}
        </div>
      </div>
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

  const [templateForm] = Form.useForm();
  const watchedRolesValue = Form.useWatch('roles', { form: templateForm, preserve: true });
  const watchedMetadataFieldsValue = Form.useWatch('metadataFields', { form: templateForm, preserve: true });
  const watchedToolConfigsValue = Form.useWatch('toolConfigs', { form: templateForm, preserve: true });
  const watchedFolderTypesValue = Form.useWatch('folderTypes', { form: templateForm, preserve: true });
  const watchedStatusRulesValue = Form.useWatch('statusRules', { form: templateForm, preserve: true });
  const watchedThemeValue = Form.useWatch('theme', { form: templateForm, preserve: true });
  const watchedVersioningValue = Form.useWatch('versioning', { form: templateForm, preserve: true });
  const watchedRoles = useMemo(() => watchedRolesValue || [], [watchedRolesValue]);
  const watchedMetadataFields = useMemo(() => watchedMetadataFieldsValue || [], [watchedMetadataFieldsValue]);
  const watchedToolConfigs = useMemo(() => watchedToolConfigsValue || [], [watchedToolConfigsValue]);
  const watchedFolderTypes = useMemo(() => watchedFolderTypesValue || [], [watchedFolderTypesValue]);
  const watchedStatusRules = useMemo(() => watchedStatusRulesValue || [], [watchedStatusRulesValue]);
  const watchedTheme = useMemo(() => watchedThemeValue || {}, [watchedThemeValue]);
  const watchedVersioning = useMemo(() => watchedVersioningValue || {}, [watchedVersioningValue]);
  const uploadedThemeCoverImage = watchedTheme.coverSource === 'UPLOAD' ? watchedTheme.coverImage : '';
  const roleOptions = useMemo(
    () => watchedRoles
      .filter((role) => role?.id && role?.name)
      .map((role) => ({ value: role.id, label: role.name })),
    [watchedRoles],
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
  const sceneCountMap = useMemo(() => {
    return scenes.reduce((map, item) => {
      map[item.templateId] = (map[item.templateId] || 0) + 1;
      return map;
    }, {});
  }, [scenes]);

  const summary = useMemo(() => ({
    templateCount: templates.length,
    activeCount: templates.filter((item) => item.status === 'ACTIVE').length,
    builtInCount: templates.filter((item) => item.builtIn).length,
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

  const loadAll = useCallback(async (withLoading = true) => {
    if (withLoading) setLoading(true);
    try {
      const [templateList, sceneList] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
      ]);
      setTemplates(templateList);
      setScenes(sceneList);
      setSelectedTemplateId((prev) => (
        prev && templateList.some((item) => item.id === prev)
          ? prev
          : templateList[0]?.id || null
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
    templateForm.setFieldsValue(editingTemplate);
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

  function appendRole() {
    const currentRoles = templateForm.getFieldValue('roles') || [];
    const nextRole = createRoleDraft(currentRoles.length + 1);
    templateForm.setFieldValue('roles', [...currentRoles, nextRole]);
    setActiveRoleTabKey(String(nextRole.id));
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
      const values = await templateForm.validateFields();
      const modeTabs = Array.isArray(values.topicPage?.modeTabs) ? values.topicPage.modeTabs : [];
      const statusRules = Array.isArray(values.statusRules) ? values.statusRules : [];
      if (modeTabs.filter((item) => item?.enabled !== false).length === 0) {
        message.error('至少启用一个主题模式');
        return;
      }
      const normalizedStatusKeys = statusRules
        .map((rule) => String(rule?.key || '').trim())
        .filter(Boolean);
      if (new Set(normalizedStatusKeys).size !== normalizedStatusKeys.length) {
        message.error('状态编码不能重复');
        return;
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
      render: (_, record) => (
        <div className="scene-template-name-cell">
          <div className="scene-template-name-row">
            <button type="button" className="scene-template-name-btn" onClick={() => openPreviewDrawer(record)}>
              {record.name}
            </button>
            {record.builtIn ? <Tag color="gold">内置</Tag> : null}
          </div>
          <div className="scene-template-subline">{record.description || '未填写描述'}</div>
        </div>
      ),
    },
    {
      title: '配置摘要',
      key: 'summary',
      width: 220,
      render: (_, record) => (
        <div className="scene-template-summary-cell">
          <span>{record.roles.length} 个角色</span>
          <span>{countEnabledTools(record)} 个工具</span>
          <span>{record.folderTypes.length} 类目录</span>
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
      width: 210,
      render: (_, record) => (
        <Space size={4} onClick={(event) => event.stopPropagation()}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openPreviewDrawer(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
            编辑
          </Button>
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
      ),
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
            <div className="scene-template-stat-label">内置模板</div>
            <div className="scene-template-stat-value">{summary.builtInCount}</div>
            <div className="scene-template-stat-hint">覆盖教学、教研、培训、社区等典型场景</div>
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
        width={760}
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
        width={1040}
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
      >
        <Form form={templateForm} layout="vertical">
          <Tabs
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
                        <Select options={TEMPLATE_STATUS_OPTIONS} />
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
                  <div className="scene-template-drawer-section">
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
                    <div className="scene-template-form-grid">
                      <Form.Item label="模板角标" name={['theme', 'badgeText']}>
                        <Input placeholder="例如：课堂教学" />
                      </Form.Item>
                      <Form.Item label="详情页主题" name={['theme', 'topicThemeMode']}>
                        <Select options={TOPIC_THEME_MODE_OPTIONS} />
                      </Form.Item>
                      <Form.Item label="强调色" name={['theme', 'accentColor']}>
                        <Input placeholder="#2f64f2" />
                      </Form.Item>
                      <Form.Item className="scene-template-form-span-2" label="默认主题封面">
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
                      <Form.Item label="首页短提示" name={['theme', 'surfaceHint']}>
                        <Input placeholder="例如：课件、作业、互动" />
                      </Form.Item>
                      <Form.Item className="scene-template-form-span-2" label="主页主标题" name={['theme', 'heroTitle']}>
                        <Input placeholder="例如：以课程、作业和课堂互动为核心的教学空间" />
                      </Form.Item>
                      <Form.Item className="scene-template-form-span-2" label="主页副标题" name={['theme', 'heroSubtitle']}>
                        <TextArea rows={3} placeholder="说明该场景的主题风格、定位和能力范围" />
                      </Form.Item>
                      <Form.Item label="左侧资料区标题" name={['topicPage', 'resourcePanelTitle']}>
                        <Input placeholder="例如：课程资料" />
                      </Form.Item>
                      <Form.Item label="新增资料按钮文案" name={['topicPage', 'addResourceLabel']}>
                        <Input placeholder="例如：添加课件" />
                      </Form.Item>
                      <Form.Item label="应用区按钮文案" name={['topicPage', 'appLabel']}>
                        <Input placeholder="例如：教学工具" />
                      </Form.Item>
                      <Form.Item label="空状态文案" name={['topicPage', 'emptyStateText']}>
                        <Input placeholder="例如：暂无课件，可先创建课程目录" />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: 'modeTabs',
                label: '主题模式',
                children: (
                  <div className="scene-template-mode-page">
                    <div className="scene-template-mode-grid">
                      {MODE_TAB_PRESET_OPTIONS.map((mode, index) => (
                        <div key={mode.value} className="scene-template-mode-card">
                          <Form.Item name={['topicPage', 'modeTabs', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['topicPage', 'modeTabs', index, 'key']} hidden>
                            <Input />
                          </Form.Item>
                          <div className="scene-template-list-card-head">
                            <strong>{mode.label}</strong>
                            <div className="scene-template-mode-toggle">
                              <span>启用</span>
                              <Form.Item name={['topicPage', 'modeTabs', index, 'enabled']} valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                          </div>
                          <div className="scene-template-form-grid">
                            <Form.Item
                              label="页签名称"
                              name={['topicPage', 'modeTabs', index, 'label']}
                              rules={[{ required: true, message: '请输入页签名称' }]}
                            >
                              <Input placeholder={mode.label} />
                            </Form.Item>
                            <div className="scene-template-mode-hint">
                              {MODE_TAB_HINT_MAP[mode.value] || '可修改名称和模式内文案配置。'}
                            </div>
                            <Form.Item label="资料区标题" name={['topicPage', 'modeTabs', index, 'resourcePanelTitle']}>
                              <Input placeholder="留空则使用上方默认资料区标题" />
                            </Form.Item>
                            <Form.Item label="新增资料按钮" name={['topicPage', 'modeTabs', index, 'addResourceLabel']}>
                              <Input placeholder="留空则使用上方默认新增按钮文案" />
                            </Form.Item>
                            <Form.Item label="应用区按钮" name={['topicPage', 'modeTabs', index, 'appLabel']}>
                              <Input placeholder="留空则使用上方默认应用区按钮文案" />
                            </Form.Item>
                            <div />
                            <Form.Item
                              className="scene-template-form-span-2"
                              label="空状态文案"
                              name={['topicPage', 'modeTabs', index, 'emptyStateText']}
                            >
                              <TextArea rows={2} placeholder="留空则使用上方默认空状态文案" />
                            </Form.Item>
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
                    <div className="scene-template-subsection-title with-action">
                      <span>角色限定</span>
                      {watchedRoles.length > 0 ? (
                        <Button size="small" icon={<PlusOutlined />} onClick={appendRole}>
                          添加角色
                        </Button>
                      ) : null}
                    </div>

                    {watchedRoles.length === 0 ? (
                      <div className="scene-template-role-empty-panel">
                        <div className="scene-template-role-empty-copy">
                          <strong>先创建角色，再配置功能权限和资料权限</strong>
                          <span>每个角色都可以单独设置功能授权，以及资料归属范围和授权对象。</span>
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => templateForm.setFieldValue('roles', [createRoleDraft(1)])}
                        >
                          创建首个角色
                        </Button>
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
                        items={watchedRoles.map((role, index) => ({
                          key: String(role?.id || index),
                          label: role?.name || `角色${index + 1}`,
                          closable: watchedRoles.length > 1,
                          children: (
                            <div className="scene-template-role-tab-panel">
                              <div className="scene-template-role-stack">
                                <div className="scene-template-role-editor-block scene-template-role-editor-block-basic">
                                  <div className="scene-template-role-editor-title">基本信息</div>
                                  <div className="scene-template-form-grid">
                                    <Form.Item label="角色标识" name={['roles', index, 'key']}>
                                      <Input placeholder="例如：teacher" />
                                    </Form.Item>
                                    <Form.Item label="角色名称" name={['roles', index, 'name']}>
                                      <Input placeholder="例如：教师" />
                                    </Form.Item>
                                    <Form.Item className="scene-template-form-span-2" label="角色说明" name={['roles', index, 'description']}>
                                      <TextArea rows={2} placeholder="说明该角色在场景中的职责" />
                                    </Form.Item>
                                  </div>
                                </div>
                                <div className="scene-template-role-editor-sections">
                                  <div className="scene-template-role-editor-block scene-template-role-editor-block-function">
                                    <div className="scene-template-role-editor-title">功能授权</div>
                                    <div className="scene-template-role-editor-stack-grid">
                                      <Form.Item label="授权方式" name={['roles', index, 'functionalPermissionMode']}>
                                        <Select options={ROLE_FUNCTION_PERMISSION_MODE_OPTIONS} />
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
                                        />
                                      </Form.Item>
                                      <Form.Item label="功能说明" name={['roles', index, 'permissionSummary']}>
                                        <Input placeholder="例如：可管理主题、资料和作业" />
                                      </Form.Item>
                                    </div>
                                  </div>
                                  <div className="scene-template-role-editor-block scene-template-role-editor-block-data">
                                    <div className="scene-template-role-editor-title">资料授权</div>
                                    <div className="scene-template-role-editor-stack-grid">
                                      <Form.Item label="资料归属范围" name={['roles', index, 'dataAccessScope']}>
                                        <Select options={ROLE_DATA_SCOPE_OPTIONS} />
                                      </Form.Item>
                                      {role?.dataAccessScope === 'ASSIGNED' ? (
                                        <>
                                          <Form.Item label="授权方式" name={['roles', index, 'assignedAccessRuleType']}>
                                            <Select options={ASSIGNED_ACCESS_RULE_OPTIONS} />
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
                                        <Input placeholder="例如：仅可查看公开的调查与投票数据" />
                                      </Form.Item>
                                    </div>
                                  </div>
                                </div>
                                <Form.Item name={['roles', index, 'id']} hidden>
                                  <Input />
                                </Form.Item>
                              </div>
                            </div>
                          ),
                        }))}
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
                    </div>

                    <div className="scene-template-subsection-title with-action">
                      <span>工具配置项</span>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          const nextTools = [...watchedToolConfigs, {
                            id: `tool_${Date.now()}`,
                            key: '',
                            name: '',
                            placement: 'RESOURCE_AREA',
                            enabled: true,
                            description: '',
                          }];
                          templateForm.setFieldsValue({ toolConfigs: nextTools });
                        }}
                      >
                        添加工具配置
                      </Button>
                    </div>

                    {watchedToolConfigs.map((tool, index) => (
                      <div key={tool?.id || index} className="scene-template-list-card">
                        <div className="scene-template-list-card-head">
                          <strong>工具配置 {index + 1}</strong>
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
                        <div className="scene-template-form-grid">
                          <Form.Item label="工具标识" name={['toolConfigs', index, 'key']}>
                            <Input placeholder="例如：exam" />
                          </Form.Item>
                          <Form.Item label="工具名称" name={['toolConfigs', index, 'name']}>
                            <Input placeholder="例如：考试" />
                          </Form.Item>
                          <Form.Item label="出现位置" name={['toolConfigs', index, 'placement']}>
                            <Select options={TOOL_PLACEMENT_OPTIONS} />
                          </Form.Item>
                          <Form.Item label="启用" name={['toolConfigs', index, 'enabled']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Form.Item className="scene-template-form-span-2" label="配置说明" name={['toolConfigs', index, 'description']}>
                            <TextArea rows={2} placeholder="说明这个工具的功能范围和使用约束" />
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
                          <Form.Item label="角色限制" name={['folderTypes', index, 'roleIds']}>
                            <Select mode="multiple" options={roleOptions} placeholder="限定可管理此目录的角色" />
                          </Form.Item>
                          <Form.Item label="允许工具" name={['folderTypes', index, 'allowedTools']}>
                            <Select mode="multiple" options={TOOL_OPTIONS} placeholder="该目录允许的工具类型" />
                          </Form.Item>
                          <Form.Item label="必选目录" name={['folderTypes', index, 'required']} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <div />
                          <Form.Item className="scene-template-form-span-2" label="目录说明" name={['folderTypes', index, 'description']}>
                            <TextArea rows={2} placeholder="说明这个目录承载的内容类型和依赖关系" />
                          </Form.Item>
                          <Form.Item name={['folderTypes', index, 'id']} hidden>
                            <Input />
                          </Form.Item>
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
                          <Switch />
                        </Form.Item>
                        <div className="scene-template-mode-hint">
                          关闭后主题内不显示版本切换入口，当前内容直接在单份资料上维护。
                        </div>
                        {watchedVersioning.enabled !== false ? (
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
                    <div className="scene-template-form-grid">
                      <Form.Item className="scene-template-form-span-2" label="进入主题的方式" name="entryMethods">
                        <Select mode="multiple" options={ENTRY_METHOD_OPTIONS} placeholder="选择该场景支持的进入方式" />
                      </Form.Item>
                    </div>

                    <div className="scene-template-subsection-title with-action">
                      <span>状态控制规则</span>
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
                    </div>

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
