import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select, Tag } from 'antd';
import {
  SCENE_VISIBILITY_OPTIONS,
  TOOL_OPTIONS,
  getSceneTypeLabel,
} from './api';
import { getSceneThemeCoverStyle } from './themeCovers';
import './SceneCreateModal.css';

const { TextArea } = Input;

function getToolLabel(toolKey) {
  return TOOL_OPTIONS.find((item) => item.value === toolKey)?.label || toolKey;
}

function getTemplateToolSummary(template) {
  const keys = new Set([
    ...(template?.toolAreas?.resourceAreaTools || []),
    ...(template?.toolAreas?.resultAreaTools || []),
  ]);
  return Array.from(keys);
}

const DEFAULT_SCENE_GROUP_NAME = '人工智能通识体系';

export default function SceneCreateModal({
  open,
  templates,
  sceneGroupOptions = [],
  initialValues,
  defaultMenuKey,
  defaultSceneGroupName,
  mode = 'scene',
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const isSceneMode = mode === 'scene';

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      if (a.builtIn && !b.builtIn) return -1;
      if (!a.builtIn && b.builtIn) return 1;
      return String(a.name).localeCompare(String(b.name));
    });
  }, [templates]);

  const selectedTemplateId = Form.useWatch('templateId', form);
  const selectedTemplate = useMemo(
    () => sortedTemplates.find((item) => item.id === selectedTemplateId) || null,
    [sortedTemplates, selectedTemplateId],
  );

  const firstAvailableTemplate = useMemo(() => {
    const activeTemplates = sortedTemplates.filter((item) => item.status === 'ACTIVE');
    if (initialValues?.templateId) {
      return sortedTemplates.find((item) => item.id === initialValues.templateId) || activeTemplates[0] || sortedTemplates[0] || null;
    }
    if (defaultMenuKey) {
      return activeTemplates.find((item) => item.defaultMenuKey === defaultMenuKey)
        || sortedTemplates.find((item) => item.defaultMenuKey === defaultMenuKey)
        || activeTemplates[0]
        || sortedTemplates[0]
        || null;
    }
    return activeTemplates[0] || sortedTemplates[0] || null;
  }, [defaultMenuKey, initialValues?.templateId, sortedTemplates]);

  useEffect(() => {
    if (!open) return;
    const editing = initialValues || null;
    form.setFieldsValue({
      id: editing?.id,
      name: editing?.name || '',
      sceneGroupName: editing?.sceneGroupName || defaultSceneGroupName || sceneGroupOptions[0]?.value || editing?.name || DEFAULT_SCENE_GROUP_NAME,
      sceneCode: editing?.sceneCode || '',
      owner: editing?.owner || '',
      visibility: editing?.visibility || 'PUBLIC',
      status: editing?.status || 'ACTIVE',
      description: editing?.description || '',
      menuKey: editing?.menuKey || defaultMenuKey || firstAvailableTemplate?.defaultMenuKey,
      templateId: editing?.templateId || firstAvailableTemplate?.id,
      topicCount: editing?.topicCount ?? 0,
    });
  }, [defaultMenuKey, defaultSceneGroupName, firstAvailableTemplate, form, initialValues, open, sceneGroupOptions]);

  const handleSelectTemplate = (template) => {
    if (!template || (template.status !== 'ACTIVE' && template.id !== initialValues?.templateId)) return;
    const currentTemplate = sortedTemplates.find((item) => item.id === form.getFieldValue('templateId')) || null;
    const currentMenuKey = form.getFieldValue('menuKey');
    const shouldFollowTemplate =
      !currentMenuKey ||
      currentMenuKey === currentTemplate?.defaultMenuKey ||
      currentMenuKey === defaultMenuKey;
    form.setFieldsValue({
      templateId: template.id,
      menuKey: shouldFollowTemplate ? template.defaultMenuKey : currentMenuKey,
      description: initialValues?.id ? form.getFieldValue('description') : (form.getFieldValue('description') || template.theme?.heroSubtitle || ''),
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit?.(
        isSceneMode
          ? { ...values, sceneGroupName: values.name || DEFAULT_SCENE_GROUP_NAME }
          : values,
      );
    } catch (error) {
      if (error?.errorFields) return;
    }
  };

  const templateTools = getTemplateToolSummary(selectedTemplate);

  return (
    <Modal
      title={initialValues?.id ? (isSceneMode ? '编辑场景' : '编辑空间') : (isSceneMode ? '新建场景' : '新建空间')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={initialValues?.id ? (isSceneMode ? '保存场景' : '保存空间') : (isSceneMode ? '创建场景' : '创建空间')}
      cancelText="取消"
      width={1040}
      destroyOnClose
      className="scene-create-modal"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="templateId"
          hidden
          rules={[{ required: true, message: isSceneMode ? '请选择场景模板' : '请选择空间模板' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="menuKey" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="owner" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="status" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="topicCount" hidden>
          <Input />
        </Form.Item>

        <div className={`scene-create-layout ${isSceneMode ? '' : 'scene-create-layout-single'}`}>
          {isSceneMode ? (
            <div className="scene-create-template-panel">
              <div className="scene-create-panel-head">
                <div className="scene-create-panel-title">1. 选择场景模板</div>
                <div className="scene-create-panel-desc">模板定义了角色、主题样式、资料目录和可用工具。</div>
              </div>
              <div className="scene-create-template-grid">
                {sortedTemplates.map((template) => {
                  const active = template.id === selectedTemplateId;
                  const disabled = template.status !== 'ACTIVE' && template.id !== initialValues?.templateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={`scene-create-template-card ${active ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div
                        className="scene-create-template-card-cover"
                        style={getSceneThemeCoverStyle(template.theme, {
                          overlayStart: 'rgba(15, 23, 42, 0.16)',
                          overlayEnd: 'rgba(15, 23, 42, 0.02)',
                        })}
                      >
                        <span className="scene-create-template-card-badge">{template.theme.badgeText}</span>
                      </div>
                      <div className="scene-create-template-card-body">
                        <div className="scene-create-template-card-title-row">
                          <span className="scene-create-template-card-title">{template.name}</span>
                          {template.builtIn ? <Tag color="gold">内置</Tag> : null}
                        </div>
                        <div className="scene-create-template-card-meta">
                          {getSceneTypeLabel(template.sceneType)}
                        </div>
                        <div className="scene-create-template-card-desc">{template.description}</div>
                        <div className="scene-create-template-card-foot">
                          <span>{template.roles.length} 个角色</span>
                          <span>{getTemplateToolSummary(template).length} 个工具</span>
                          <span>{template.folderTypes.length} 类目录</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="scene-create-form-panel">
            <div className="scene-create-panel-head">
              <div className="scene-create-panel-title">{isSceneMode ? '2. 填写场景信息' : '填写空间信息'}</div>
              <div className="scene-create-panel-desc">
                {isSceneMode
                  ? '创建场景时会根据所选模板生成默认结构。'
                  : '新建空间会沿用当前场景模板，不需要再次选择模板。'}
              </div>
            </div>

            <div className="scene-create-form-grid">
              <Form.Item
                label={isSceneMode ? '场景名称' : '空间名称'}
                name="name"
                rules={[{ required: true, message: isSceneMode ? '请输入场景名称' : '请输入空间名称' }]}
              >
                <Input placeholder="例如：新教师岗前培训" />
              </Form.Item>
              <Form.Item label={isSceneMode ? '场景编码' : '空间编码'} name="sceneCode">
                <Input placeholder="留空则自动生成" />
              </Form.Item>
              {isSceneMode ? (
                <Form.Item label="可见范围" name="visibility">
                  <Select options={SCENE_VISIBILITY_OPTIONS} />
                </Form.Item>
              ) : (
                <>
                  <Form.Item
                    label="所属场景"
                    name="sceneGroupName"
                    rules={[{ required: true, message: '请选择所属场景' }]}
                  >
                    <Select
                      options={sceneGroupOptions}
                      placeholder="请选择所属场景"
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.Item name="visibility" hidden>
                    <Input />
                  </Form.Item>
                </>
              )}
              <Form.Item className="scene-create-form-span-2" label={isSceneMode ? '场景简介' : '空间简介'} name="description">
                <TextArea rows={4} placeholder={isSceneMode ? '填写场景简介，用于后续空间创建和展示说明。' : '填写空间简介，用于首页卡片和空间说明。'} />
              </Form.Item>
            </div>

            {selectedTemplate ? (
              <div className="scene-create-preview">
                <div
                  className="scene-create-preview-hero"
                  style={getSceneThemeCoverStyle(selectedTemplate.theme)}
                >
                  <div className="scene-create-preview-hero-copy">
                    <div className="scene-create-preview-kicker">{selectedTemplate.theme.badgeText}</div>
                    <div className="scene-create-preview-title">{selectedTemplate.theme.heroTitle}</div>
                    <div className="scene-create-preview-desc">{selectedTemplate.theme.heroSubtitle}</div>
                  </div>
                </div>

                <div className="scene-create-preview-sections">
                  <div className="scene-create-preview-section">
                    <div className="scene-create-preview-section-title">角色限定</div>
                    <div className="scene-create-tag-list">
                      {selectedTemplate.roles.map((role) => (
                        <Tag key={role.id}>{role.name}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="scene-create-preview-section">
                    <div className="scene-create-preview-section-title">主题页面</div>
                    <div className="scene-create-inline-meta">
                      <span>资料区：{selectedTemplate.topicPage.resourcePanelTitle}</span>
                      <span>新增按钮：{selectedTemplate.topicPage.addResourceLabel}</span>
                      <span>主页模板：{selectedTemplate.homepage.templateName}</span>
                    </div>
                    <div className="scene-create-tag-list">
                      {selectedTemplate.topicPage.modeTabs.filter((item) => item.enabled !== false).map((item) => (
                        <Tag key={item.key} color="blue">{item.label}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="scene-create-preview-section">
                    <div className="scene-create-preview-section-title">工具能力</div>
                    <div className="scene-create-tag-list">
                      {templateTools.slice(0, 8).map((toolKey) => (
                        <Tag key={toolKey}>{getToolLabel(toolKey)}</Tag>
                      ))}
                    </div>
                  </div>

                  <div className="scene-create-preview-section">
                    <div className="scene-create-preview-section-title">默认目录</div>
                    <div className="scene-create-inline-list">
                      {selectedTemplate.folderTypes.map((folder) => (
                        <span key={folder.id}>{folder.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Form>
    </Modal>
  );
}
