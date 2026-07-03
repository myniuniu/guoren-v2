import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  CAPABILITY_MODEL_STATUS_OPTIONS,
  CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS,
  CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS,
  CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS,
} from './api';
import {
  buildCapabilityModelMarkdown,
  getTotalCapabilityItems,
} from './shared';
import {
  getRoleLevel,
  getSequenceForRole,
} from '../shared/profileEvidence';
import './CapabilityModelModule.css';

const { TextArea } = Input;

const EVIDENCE_TYPE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);
const REVIEW_ROLE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS.map((item) => [item.value, item.label]),
);
const AI_ASSIST_MODE_LABEL_MAP = Object.fromEntries(
  CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS.map((item) => [item.value, item.label]),
);

function CapabilityModelPreviewContent({
  model,
  industries,
  roles,
  sequences,
  embedded = false,
  allowCopyMarkdown = true,
  showHero = true,
}) {
  const [previewMode, setPreviewMode] = useState('structured');

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
    <div className={`cap-model-preview${embedded ? ' cap-model-preview-embedded' : ''}`}>
      {showHero ? (
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
            {allowCopyMarkdown && previewMode === 'markdown' ? (
              <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown}>复制 Markdown</Button>
            ) : null}
          </div>
        </div>
      ) : null}
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
            {allowCopyMarkdown ? (
              <Button icon={<CopyOutlined />} onClick={handleCopyMarkdown}>复制 Markdown</Button>
            ) : null}
          </div>
          <TextArea
            readOnly
            value={markdownText}
            autoSize={{ minRows: embedded ? 14 : 20, maxRows: embedded ? 24 : 32 }}
            className="cap-model-markdown-textarea"
          />
        </div>
      )}
    </div>
  );
}

export function CapabilityModelPreview(props) {
  return <CapabilityModelPreviewContent key={props.model?.id || 'capability-model-preview'} {...props} />;
}

export function CapabilityModelEditorPanel({
  modelDraft,
  modelBaseForm,
  industryOptions,
  roleOptions,
  roleLevelOptions,
  watchedRoleId,
  activeDimension,
  activeDimensionIndex,
  activeItem,
  activeItemIndex,
  onLevelCountChange,
  onLevelLabelChange,
  onAddDimension,
  onSelectDimension,
  onAddItem,
  onSelectItem,
  onMoveDimension,
  onRemoveDimension,
  onUpdateDimensionField,
  onMoveItem,
  onRemoveItem,
  onUpdateItemField,
  onUpdateItemStringListField,
  onUpdateItemEvidence,
  onUpdateItemDescriptor,
  embedded = false,
}) {
  const isLayeredEditor = !embedded;
  const [activeSection, setActiveSection] = useState('base');
  const [activeItemSubsection, setActiveItemSubsection] = useState('overview');
  const [dimensionDrawerOpen, setDimensionDrawerOpen] = useState(false);
  const lastSelectedItemByDimensionRef = useRef({});
  const watchedModelName = Form.useWatch('name', modelBaseForm);
  const currentModelName = watchedModelName || modelDraft.name || '未命名能力模型';
  const totalCapabilityItems = getTotalCapabilityItems(modelDraft);
  const totalDimensions = modelDraft.dimensions.length;
  const activeDimensionItemCount = activeDimension?.items?.length || 0;
  const activeDimensionItems = activeDimension?.items || [];
  const editorSections = [
    { key: 'base', label: '基础信息' },
    { key: 'levels', label: '等级体系' },
    { key: 'framework', label: '能力框架' },
  ];
  const activeSectionIndex = editorSections.findIndex((section) => section.key === activeSection);
  const previousSection = activeSectionIndex > 0 ? editorSections[activeSectionIndex - 1] : null;
  const nextSection = activeSectionIndex < editorSections.length - 1 ? editorSections[activeSectionIndex + 1] : null;
  const showBaseSection = embedded || activeSection === 'base';
  const showLevelSection = embedded || activeSection === 'levels';
  const showFrameworkSection = embedded || activeSection === 'framework';
  const activeDimensionOrderText = activeDimension
    ? `能力类 ${activeDimensionIndex + 1} / ${totalDimensions}`
    : '未选择能力类';

  useEffect(() => {
    setActiveItemSubsection('overview');
  }, [activeItem?.id]);

  useEffect(() => {
    if (!activeDimension?.id || !activeItem?.id) return;
    lastSelectedItemByDimensionRef.current[activeDimension.id] = activeItem.id;
  }, [activeDimension?.id, activeItem?.id]);

  useEffect(() => {
    if (activeDimension?.id) return;
    setDimensionDrawerOpen(false);
  }, [activeDimension?.id]);

  const getPreferredItemId = (dimension) => {
    if (!dimension?.id) return null;
    const rememberedItemId = lastSelectedItemByDimensionRef.current[dimension.id];
    if (rememberedItemId && dimension.items?.some((item) => item.id === rememberedItemId)) {
      return rememberedItemId;
    }
    return dimension.items?.[0]?.id || null;
  };

  const handleSelectDimensionWithMemory = (dimension) => {
    if (!dimension?.id) return;
    const preferredItemId = getPreferredItemId(dimension);
    if (preferredItemId) {
      onSelectItem(dimension.id, preferredItemId);
      return;
    }
    onSelectDimension(dimension.id);
  };

  const handleSelectActiveItem = (itemId) => {
    if (!activeDimension?.id || !itemId) return;
    onSelectItem(activeDimension.id, itemId);
  };

  const handleAddDimensionAndReturn = () => {
    onAddDimension();
  };

  const handleAddItemAndReturn = () => {
    if (activeDimensionIndex == null || activeDimensionIndex < 0) return;
    onAddItem(activeDimensionIndex);
    setActiveItemSubsection('overview');
  };

  const handleOpenDimensionDrawerFor = (dimension) => {
    if (!dimension?.id) return;
    handleSelectDimensionWithMemory(dimension);
    setDimensionDrawerOpen(true);
  };

  const handleEditItemFromMenu = (itemId) => {
    if (!itemId) return;
    setActiveItemSubsection('overview');
    handleSelectActiveItem(itemId);
  };

  const handleRemoveDimensionWithFallback = (dimensionIndex) => {
    const dimensions = modelDraft.dimensions || [];
    const targetDimension = dimensions[dimensionIndex];
    const isRemovingActiveDimension = targetDimension?.id && targetDimension.id === activeDimension?.id;
    const fallbackDimension = isRemovingActiveDimension
      ? (dimensions[dimensionIndex + 1] || dimensions[dimensionIndex - 1] || null)
      : null;

    onRemoveDimension(dimensionIndex);

    if (!isRemovingActiveDimension || !fallbackDimension) return;

    const fallbackItemId = getPreferredItemId(fallbackDimension);
    if (fallbackItemId) {
      onSelectItem(fallbackDimension.id, fallbackItemId);
      return;
    }
    onSelectDimension(fallbackDimension.id);
  };

  const handleRemoveItemWithFallback = (dimensionIndex, itemIndex) => {
    const items = modelDraft.dimensions[dimensionIndex]?.items || [];
    const targetItem = items[itemIndex];
    const isRemovingActiveItem = targetItem?.id && targetItem.id === activeItem?.id;
    const fallbackItem = isRemovingActiveItem
      ? (items[itemIndex + 1] || items[itemIndex - 1] || null)
      : null;

    onRemoveItem(dimensionIndex, itemIndex);

    if (!isRemovingActiveItem || !activeDimension?.id) return;

    if (fallbackItem?.id) {
      onSelectItem(activeDimension.id, fallbackItem.id);
      return;
    }
    onSelectDimension(activeDimension.id);
  };

  const renderStepActions = () => {
    if (!isLayeredEditor) return null;
    return (
      <div className="cap-model-editor-step-actions">
        <div className="cap-model-editor-step-actions-left">
          {previousSection ? (
            <Button onClick={() => setActiveSection(previousSection.key)}>
              上一步：{previousSection.label}
            </Button>
          ) : null}
        </div>
        {nextSection ? (
          <div className="cap-model-editor-step-actions-right">
            <Button type="primary" onClick={() => setActiveSection(nextSection.key)}>
              继续：{nextSection.label}
            </Button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`cap-model-editor${embedded ? ' cap-model-editor-embedded' : ' cap-model-editor-layered'}`}>
      {isLayeredEditor ? (
        <div className="cap-model-editor-stage-shell">
          <div className="cap-model-editor-stage-head">
            <div className="cap-model-editor-stage-copy">
              <div className="cap-model-editor-stage-kicker">分步编辑</div>
              <div className="cap-model-editor-stage-title">{currentModelName}</div>
              <div className="cap-model-editor-stage-desc">每次只聚焦一个区块，先补基础信息，再维护等级和能力框架。</div>
            </div>
            <div className="cap-model-editor-stage-stats">
              <div className="cap-model-editor-stage-stat">
                <span>等级</span>
                <strong>{modelDraft.levelScheme.levels.length}</strong>
              </div>
              <div className="cap-model-editor-stage-stat">
                <span>能力类</span>
                <strong>{modelDraft.dimensions.length}</strong>
              </div>
              <div className="cap-model-editor-stage-stat">
                <span>能力项</span>
                <strong>{totalCapabilityItems}</strong>
              </div>
            </div>
          </div>
          <Segmented
            block
            value={activeSection}
            onChange={setActiveSection}
            className="cap-model-editor-stage-switch"
            options={editorSections.map((section, index) => ({
              label: `${index + 1}. ${section.label}`,
              value: section.key,
            }))}
          />
        </div>
      ) : null}

      {showBaseSection ? (
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
                <Select options={industryOptions} placeholder="选择行业" />
              </Form.Item>
              <Form.Item label="所属岗位" name="roleId" rules={[{ required: true, message: '请选择所属岗位' }]}>
                <Select options={roleOptions} placeholder="选择岗位" />
              </Form.Item>
              <Form.Item label="序列等级" name="roleLevelId" rules={[{ required: true, message: '请选择序列等级' }]}>
                <Select options={roleLevelOptions} placeholder="选择岗位主序列下的等级" disabled={!watchedRoleId} />
              </Form.Item>
              <Form.Item label="标签" name="tags" className="cap-model-form-span-2">
                <Select mode="tags" placeholder="输入标签后回车" tokenSeparators={[',']} />
              </Form.Item>
              <Form.Item label="模型说明" name="description" className="cap-model-form-span-2">
                <TextArea rows={3} placeholder="说明该模型适用的行业场景、岗位阶段与使用方式" />
              </Form.Item>
            </div>
            {renderStepActions()}
          </div>
        </Form>
      ) : null}

      {showLevelSection ? (
        <div className="cap-model-editor-section">
          <div className="cap-model-section-head">
            <div>
              <div className="cap-model-section-title">等级体系</div>
              <div className="cap-model-section-desc">默认 4 级，可按单个模型调整等级数与各级名称。</div>
            </div>
          </div>
          <div className="cap-model-level-toolbar">
            <span>等级数</span>
            <InputNumber min={2} max={6} value={modelDraft.levelScheme.levels.length} onChange={onLevelCountChange} />
          </div>
          <div className="cap-model-level-grid">
            {modelDraft.levelScheme.levels.map((level, index) => (
              <div key={level.key} className="cap-model-level-card">
                <div className="cap-model-level-key">{level.key}</div>
                <Input value={level.label} onChange={(event) => onLevelLabelChange(index, event.target.value)} />
              </div>
            ))}
          </div>
          {renderStepActions()}
        </div>
      ) : null}

      {showFrameworkSection ? (
        <div className="cap-model-editor-section">
          <div className="cap-model-framework-workspace">
            {totalDimensions === 0 ? (
              <div className="cap-model-empty-panel cap-model-framework-empty">
                <Empty description="暂无能力类，请先新增" />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDimensionAndReturn}>
                  新增能力类
                </Button>
              </div>
            ) : (
              <>
                <div className="cap-model-framework-dimension-band">
                  <div className="cap-model-framework-dimension-band-head">
                    <div className="cap-model-dimension-title">能力类</div>
                    <Space size={8} wrap>
                      {activeDimension ? <Tag>{activeDimensionOrderText}</Tag> : null}
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDimensionAndReturn}>
                        新增能力类
                      </Button>
                    </Space>
                  </div>
                  <div className="cap-model-framework-dimension-strip">
                    {modelDraft.dimensions.map((dimension, dimensionIndex) => {
                      const isActive = dimension.id === activeDimension?.id;
                      const dimensionMenuItems = [
                        {
                          key: 'edit',
                          icon: <EditOutlined />,
                          label: '编辑能力类',
                          onClick: () => handleOpenDimensionDrawerFor(dimension),
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: '删除能力类',
                          danger: true,
                          disabled: totalDimensions === 1,
                          onClick: () => handleRemoveDimensionWithFallback(dimensionIndex),
                        },
                      ];
                      return (
                        <div
                          key={dimension.id}
                          className={`cap-model-framework-dimension-node ${isActive ? 'is-active' : ''}`}
                        >
                          <button
                            type="button"
                            className="cap-model-framework-dimension-card"
                            onClick={() => handleSelectDimensionWithMemory(dimension)}
                          >
                            <span className="cap-model-framework-node-kicker">能力类 {dimensionIndex + 1}</span>
                            <span className="cap-model-framework-node-title">{dimension.name || '未命名能力类'}</span>
                            <span className="cap-model-framework-node-meta">{dimension.items?.length || 0} 个能力项</span>
                          </button>
                          <div className="cap-model-framework-node-actions">
                            <Dropdown
                              trigger={['click']}
                              placement="bottomRight"
                              menu={{ items: dimensionMenuItems }}
                            >
                              <Button
                                size="small"
                                type="text"
                                className="cap-model-framework-menu-trigger"
                                icon={<MoreOutlined />}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </Dropdown>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {activeDimension ? (
                  <div className="cap-model-framework-studio">
                    <div className="cap-model-framework-sidebar">
                      <div className="cap-model-framework-sidebar-card">
                        <div className="cap-model-framework-sidebar-head">
                          <div className="cap-model-dimension-title">能力项</div>
                          <Space size={8} wrap>
                            <Tag color="blue">{activeDimensionItemCount} 项</Tag>
                            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddItemAndReturn}>
                              新增
                            </Button>
                          </Space>
                        </div>

                        {activeDimensionItemCount > 0 ? (
                          <div className="cap-model-framework-item-list">
                            {activeDimensionItems.map((item, itemIndex) => {
                              const isActive = item.id === activeItem?.id;
                              const itemMenuItems = [
                                {
                                  key: 'edit',
                                  icon: <EditOutlined />,
                                  label: '编辑能力项',
                                  onClick: () => handleEditItemFromMenu(item.id),
                                },
                                {
                                  key: 'delete',
                                  icon: <DeleteOutlined />,
                                  label: '删除能力项',
                                  danger: true,
                                  disabled: activeDimensionItemCount === 1,
                                  onClick: () => handleRemoveItemWithFallback(activeDimensionIndex, itemIndex),
                                },
                              ];
                              return (
                                <div
                                  key={item.id}
                                  className={`cap-model-framework-item-row ${isActive ? 'is-active' : ''}`}
                                >
                                  <button
                                    type="button"
                                    className="cap-model-framework-item-row-main"
                                    onClick={() => handleSelectActiveItem(item.id)}
                                  >
                                    <span className="cap-model-framework-item-index">能力项 {itemIndex + 1}</span>
                                    <strong>{item.name || '未命名能力项'}</strong>
                                    <span>{item.description || '未填写能力项说明'}</span>
                                  </button>
                                  <div className="cap-model-framework-item-actions">
                                    <Dropdown
                                      trigger={['click']}
                                      placement="bottomRight"
                                      menu={{ items: itemMenuItems }}
                                    >
                                      <Button
                                        size="small"
                                        type="text"
                                        className="cap-model-framework-menu-trigger"
                                        icon={<MoreOutlined />}
                                        onClick={(event) => event.stopPropagation()}
                                      />
                                    </Dropdown>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="cap-model-empty-panel cap-model-framework-empty">
                            <Empty description="当前能力类下暂无能力项" />
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItemAndReturn}>
                              新增能力项
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cap-model-framework-stage">
                      {activeItem ? (
                        <>
                          <div className="cap-model-framework-stage-head is-centered">
                            <Segmented
                              size="small"
                              value={activeItemSubsection}
                              onChange={setActiveItemSubsection}
                              options={[
                                { label: '基础', value: 'overview' },
                                { label: '规则', value: 'rules' },
                                { label: '等级描述', value: 'descriptors' },
                              ]}
                            />
                          </div>

                          <div className="cap-model-item-card">
                            {activeItemSubsection === 'overview' ? (
                              <div className="cap-model-form-grid cap-model-form-grid-2">
                                <div>
                                  <div className="cap-model-field-label">能力项名称</div>
                                  <Input
                                    value={activeItem.name}
                                    onChange={(event) => onUpdateItemField(activeDimensionIndex, activeItemIndex, 'name', event.target.value)}
                                    placeholder="例如：目标与学情对齐"
                                  />
                                </div>
                                <div>
                                  <div className="cap-model-field-label">能力项说明</div>
                                  <Input
                                    value={activeItem.description}
                                    onChange={(event) => onUpdateItemField(activeDimensionIndex, activeItemIndex, 'description', event.target.value)}
                                    placeholder="说明该能力项关注的行为表现"
                                  />
                                </div>
                              </div>
                            ) : null}

                            {activeItemSubsection === 'rules' ? (
                              <>
                                <div className="cap-model-form-grid cap-model-form-grid-2">
                                  <div>
                                    <div className="cap-model-field-label">证据类型</div>
                                    <Select
                                      mode="multiple"
                                      value={activeItem.evidenceTypes || []}
                                      onChange={(values) => onUpdateItemStringListField(activeDimensionIndex, activeItemIndex, 'evidenceTypes', values)}
                                      options={CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS}
                                      placeholder="选择该能力项允许使用的证据类型"
                                    />
                                  </div>
                                  <div>
                                    <div className="cap-model-field-label">评价主体</div>
                                    <Select
                                      mode="multiple"
                                      value={activeItem.requiredReviewRoles || []}
                                      onChange={(values) => onUpdateItemStringListField(activeDimensionIndex, activeItemIndex, 'requiredReviewRoles', values)}
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
                                      onChange={(value) => onUpdateItemField(activeDimensionIndex, activeItemIndex, 'requiredEvidenceCount', value || 1)}
                                    />
                                  </div>
                                  <div>
                                    <div className="cap-model-field-label">AI辅助策略</div>
                                    <Select
                                      value={activeItem.aiAssistMode || 'SUGGEST_ONLY'}
                                      onChange={(value) => onUpdateItemField(activeDimensionIndex, activeItemIndex, 'aiAssistMode', value)}
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
                                      onChange={(checked) => onUpdateItemField(activeDimensionIndex, activeItemIndex, 'isGrowthOnly', checked)}
                                    />
                                  </div>
                                </div>

                                <div className="cap-model-field-stack">
                                  <div className="cap-model-field-label">成长记录示例</div>
                                  <TextArea
                                    rows={3}
                                    value={(activeItem.evidenceExamples || []).join('\n')}
                                    onChange={(event) => onUpdateItemEvidence(activeDimensionIndex, activeItemIndex, event.target.value)}
                                    placeholder="每行一条，例如：课堂观察记录"
                                  />
                                </div>
                              </>
                            ) : null}

                            {activeItemSubsection === 'descriptors' ? (
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
                                          onChange={(event) => onUpdateItemDescriptor(activeDimensionIndex, activeItemIndex, levelIndex, event.target.value)}
                                          placeholder={`填写 ${level.label} 的行为描述`}
                                        />
                                      </div>
                                    ),
                                  }))}
                                />
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className="cap-model-empty-panel cap-model-framework-empty">
                          <Empty description="请选择一个能力项开始编辑" />
                          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItemAndReturn}>
                            新增能力项
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cap-model-empty-panel">
                    <Empty description="请选择一个能力类开始编辑" />
                  </div>
                )}
              </>
            )}
          </div>
          {renderStepActions()}
        </div>
      ) : null}

      <Drawer
        open={dimensionDrawerOpen}
        onClose={() => setDimensionDrawerOpen(false)}
        title="编辑能力类"
        width={embedded ? 420 : 500}
        className="cap-model-dimension-drawer"
        extra={(
          <Button type="primary" onClick={() => setDimensionDrawerOpen(false)}>
            完成
          </Button>
        )}
      >
        {activeDimension ? (
          <div className="cap-model-dimension-drawer-body">
            <div className="cap-model-dimension-drawer-meta">
              能力类 {activeDimensionIndex + 1} / {modelDraft.dimensions.length} · {activeDimensionItemCount} 个能力项
            </div>
            <div className="cap-model-field-stack">
              <div className="cap-model-field-label">能力类名称</div>
              <Input
                value={activeDimension.name}
                onChange={(event) => onUpdateDimensionField(activeDimensionIndex, 'name', event.target.value)}
                placeholder="例如：教学设计"
              />
            </div>
            <div className="cap-model-field-stack">
              <div className="cap-model-field-label">能力类说明</div>
              <TextArea
                rows={4}
                value={activeDimension.description}
                onChange={(event) => onUpdateDimensionField(activeDimensionIndex, 'description', event.target.value)}
                placeholder="说明该能力类聚焦的核心能力范围"
              />
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
