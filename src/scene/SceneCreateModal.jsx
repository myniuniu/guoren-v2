import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select, Tag } from 'antd';
import {
  SCENE_MENU_OPTIONS,
  SCENE_STATUS_OPTIONS,
  SCENE_VISIBILITY_OPTIONS,
  TOOL_OPTIONS,
  getSceneMenuLabel,
  getSceneTypeLabel,
} from './api';
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

export default function SceneCreateModal({
  open,
  templates,
  initialValues,
  defaultMenuKey,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

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

  useEffect(() => {
    if (!open) return;
    const firstAvailableTemplate = sortedTemplates.find((item) => item.status === 'ACTIVE') || sortedTemplates[0] || null;
    const editing = initialValues || null;
    form.setFieldsValue({
      id: editing?.id,
      name: editing?.name || '',
      sceneCode: editing?.sceneCode || '',
      owner: editing?.owner || '',
      visibility: editing?.visibility || 'PUBLIC',
      status: editing?.status || 'ACTIVE',
      description: editing?.description || '',
      menuKey: editing?.menuKey || defaultMenuKey || firstAvailableTemplate?.defaultMenuKey,
      templateId: editing?.templateId || firstAvailableTemplate?.id,
      topicCount: editing?.topicCount ?? 0,
    });
  }, [defaultMenuKey, form, initialValues, open, sortedTemplates]);

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
      await onSubmit?.(values);
    } catch (error) {
      if (error?.errorFields) return;
    }
  };

  const templateTools = getTemplateToolSummary(selectedTemplate);

  return (
    <Modal
      title={initialValues?.id ? '编辑场景' : '新建场景'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={initialValues?.id ? '保存场景' : '创建场景'}
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
          rules={[{ required: true, message: '请选择场景模板' }]}
        >
          <Input />
        </Form.Item>

        <div className="scene-create-layout">
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
                      style={{
                        background: `linear-gradient(135deg, ${template.theme.coverStart} 0%, ${template.theme.coverEnd} 100%)`,
                      }}
                    >
                      <span className="scene-create-template-card-emoji">{template.theme.emoji}</span>
                      <span className="scene-create-template-card-badge">{template.theme.badgeText}</span>
                    </div>
                    <div className="scene-create-template-card-body">
                      <div className="scene-create-template-card-title-row">
                        <span className="scene-create-template-card-title">{template.name}</span>
                        {template.builtIn ? <Tag color="gold">内置</Tag> : null}
                      </div>
                      <div className="scene-create-template-card-meta">
                        {getSceneTypeLabel(template.sceneType)} · 默认归类 {getSceneMenuLabel(template.defaultMenuKey)}
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

          <div className="scene-create-form-panel">
            <div className="scene-create-panel-head">
              <div className="scene-create-panel-title">2. 填写场景信息</div>
              <div className="scene-create-panel-desc">创建后会复制一份模板快照到该场景中。</div>
            </div>

            <div className="scene-create-form-grid">
              <Form.Item
                label="场景名称"
                name="name"
                rules={[{ required: true, message: '请输入场景名称' }]}
              >
                <Input placeholder="例如：新教师岗前培训" />
              </Form.Item>
              <Form.Item label="场景编码" name="sceneCode">
                <Input placeholder="留空则自动生成" />
              </Form.Item>
              <Form.Item label="归类栏目" name="menuKey" rules={[{ required: true, message: '请选择归类栏目' }]}>
                <Select options={SCENE_MENU_OPTIONS} />
              </Form.Item>
              <Form.Item label="可见范围" name="visibility">
                <Select options={SCENE_VISIBILITY_OPTIONS} />
              </Form.Item>
              <Form.Item label="负责人" name="owner">
                <Input placeholder="例如：张老师 / 培训中心" />
              </Form.Item>
              <Form.Item label="状态" name="status">
                <Select options={SCENE_STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item label="主题数" name="topicCount">
                <Input type="number" min={0} />
              </Form.Item>
              <div />
              <Form.Item className="scene-create-form-span-2" label="场景简介" name="description">
                <TextArea rows={4} placeholder="填写场景简介，用于首页卡片和空间说明。" />
              </Form.Item>
            </div>

            {selectedTemplate ? (
              <div className="scene-create-preview">
                <div
                  className="scene-create-preview-hero"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTemplate.theme.coverStart} 0%, ${selectedTemplate.theme.coverEnd} 100%)`,
                  }}
                >
                  <div className="scene-create-preview-hero-copy">
                    <div className="scene-create-preview-kicker">{selectedTemplate.theme.badgeText}</div>
                    <div className="scene-create-preview-title">{selectedTemplate.theme.heroTitle}</div>
                    <div className="scene-create-preview-desc">{selectedTemplate.theme.heroSubtitle}</div>
                  </div>
                  <div className="scene-create-preview-emoji">{selectedTemplate.theme.emoji}</div>
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
