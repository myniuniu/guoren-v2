import { useEffect, useRef, useState } from 'react';
import {
  Button,
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
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
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
  getCapabilityDimensionDescendantIds,
  getCapabilityDimensionEntries,
  getCapabilityFrameworkNodeSelection,
  getCapabilityFrameworkTreeEntries,
  getTotalCapabilityItems,
  isCapabilityFrameworkConfigNode,
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
  const dimensionEntries = getCapabilityDimensionEntries(model.dimensions);

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
            <span>能力类：{dimensionEntries.length}</span>
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
          {dimensionEntries.map(({ dimension, level, orderText }) => (
            <div key={dimension.id} className={`cap-model-preview-section is-level-${level}`}>
              <div className="cap-model-preview-section-head">
                <div>
                  <div className="cap-model-preview-section-title">{orderText}. {dimension.name}</div>
                  <div className="cap-model-preview-section-desc">{dimension.description || '未填写能力类说明'}</div>
                </div>
                <Tag color="blue">第 {level} 层 · {dimension.items?.length || 0} 个能力项</Tag>
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
  const [activeFrameworkNodeKey, setActiveFrameworkNodeKey] = useState(null);
  const [collapsedFrameworkNodeKeys, setCollapsedFrameworkNodeKeys] = useState(() => new Set());
  const [visibleScrollAreas, setVisibleScrollAreas] = useState({});
  const pendingSelectNewFrameworkNodeRef = useRef(false);
  const scrollHideTimersRef = useRef({});
  const dimensionEntries = getCapabilityDimensionEntries(modelDraft.dimensions);
  const frameworkTreeEntries = getCapabilityFrameworkTreeEntries(modelDraft);
  const frameworkTreeKeySignature = frameworkTreeEntries.map((node) => node.key).join('|');
  const fallbackFrameworkNode = frameworkTreeEntries.find((node) => isCapabilityFrameworkConfigNode(node))
    || frameworkTreeEntries[0]
    || null;
  const frameworkSelection = getCapabilityFrameworkNodeSelection(
    modelDraft,
    activeFrameworkNodeKey || fallbackFrameworkNode?.key,
  );
  const selectedFrameworkNode = frameworkSelection.node || fallbackFrameworkNode;
  const selectedDimension = selectedFrameworkNode?.dimension || null;
  const selectedDimensionIndex = selectedFrameworkNode?.dimensionIndex ?? -1;
  const selectedItem = selectedFrameworkNode?.item || null;
  const selectedItemIndex = selectedFrameworkNode?.itemIndex ?? -1;
  const totalDimensions = dimensionEntries.length;
  const selectedDimensionItemCount = selectedDimension?.items?.length || 0;
  const selectedNodeIsConfig = isCapabilityFrameworkConfigNode(selectedFrameworkNode);
  const visibleFrameworkNodes = frameworkTreeEntries.filter((node) => (
    node.ancestorKeys.every((key) => !collapsedFrameworkNodeKeys.has(key))
  ));
  const editorSections = [
    { key: 'base', label: '基础信息' },
    { key: 'levels', label: '等级体系' },
    { key: 'framework', label: '能力框架' },
  ];
  const showBaseSection = embedded || activeSection === 'base';
  const showLevelSection = embedded || activeSection === 'levels';
  const showFrameworkSection = embedded || activeSection === 'framework';

  useEffect(() => {
    if (!frameworkTreeEntries.length) {
      if (activeFrameworkNodeKey) setActiveFrameworkNodeKey(null);
      return;
    }
    if (!activeFrameworkNodeKey || frameworkTreeEntries.some((node) => node.key === activeFrameworkNodeKey)) return;
    setActiveFrameworkNodeKey(fallbackFrameworkNode?.key || null);
  }, [activeFrameworkNodeKey, fallbackFrameworkNode?.key, frameworkTreeEntries.length, frameworkTreeKeySignature]);

  useEffect(() => {
    if (!pendingSelectNewFrameworkNodeRef.current) return;
    if (!activeDimension?.id) return;

    if (activeItem?.id) {
      const nextItemNodeKey = `item:${activeDimension.id}:${activeItem.id}`;
      setActiveFrameworkNodeKey(
        frameworkTreeEntries.some((node) => node.key === nextItemNodeKey)
          ? nextItemNodeKey
          : `dimension:${activeDimension.id}`,
      );
      pendingSelectNewFrameworkNodeRef.current = false;
      return;
    }

    setActiveFrameworkNodeKey(`dimension:${activeDimension.id}`);
    pendingSelectNewFrameworkNodeRef.current = false;
  }, [activeDimension?.id, activeItem?.id, frameworkTreeKeySignature]);

  useEffect(() => () => {
    Object.values(scrollHideTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  const handleSelectFrameworkNode = (node) => {
    if (!node) return;
    setActiveFrameworkNodeKey(node.key);
    if (node.nodeType === 'item' && node.item?.id) {
      onSelectItem(node.dimension.id, node.item.id);
      return;
    }
    onSelectDimension(node.dimension.id);
  };

  const handleToggleFrameworkNode = (nodeKey) => {
    setCollapsedFrameworkNodeKeys((current) => {
      const next = new Set(current);
      if (next.has(nodeKey)) next.delete(nodeKey);
      else next.add(nodeKey);
      return next;
    });
  };

  const handleAddDimensionAndReturn = (parentDimensionId = null) => {
    pendingSelectNewFrameworkNodeRef.current = true;
    onAddDimension(parentDimensionId);
  };

  const handleAddItemForDimension = (dimensionIndex) => {
    if (dimensionIndex == null || dimensionIndex < 0) return;
    pendingSelectNewFrameworkNodeRef.current = true;
    onAddItem(dimensionIndex);
  };

  const handleRemoveDimensionWithFallback = (dimensionEntry) => {
    if (!dimensionEntry) return;
    const targetDimension = dimensionEntry.dimension;
    const removedIds = getCapabilityDimensionDescendantIds(modelDraft.dimensions, targetDimension?.id);
    removedIds.add(targetDimension?.id);
    const isRemovingSelectedDimension = Boolean(selectedDimension?.id && removedIds.has(selectedDimension.id));
    const currentEntryIndex = dimensionEntries.findIndex((entry) => entry.dimension.id === targetDimension?.id);
    const remainingEntries = dimensionEntries.filter((entry) => !removedIds.has(entry.dimension.id));
    const fallbackEntry = isRemovingSelectedDimension
      ? (remainingEntries[currentEntryIndex] || remainingEntries[currentEntryIndex - 1] || null)
      : null;

    onRemoveDimension(dimensionEntry.index);

    if (!isRemovingSelectedDimension || !fallbackEntry?.dimension) return;

    setActiveFrameworkNodeKey(`dimension:${fallbackEntry.dimension.id}`);
    onSelectDimension(fallbackEntry.dimension.id);
  };

  const handleRemoveItemWithFallback = (dimensionIndex, itemIndex) => {
    const items = modelDraft.dimensions[dimensionIndex]?.items || [];
    const fallbackItem = items[itemIndex + 1] || items[itemIndex - 1] || null;
    const dimension = modelDraft.dimensions[dimensionIndex];

    onRemoveItem(dimensionIndex, itemIndex);

    if (fallbackItem?.id && dimension?.id) {
      setActiveFrameworkNodeKey(`item:${dimension.id}:${fallbackItem.id}`);
      onSelectItem(dimension.id, fallbackItem.id);
      return;
    }
    if (dimension?.id) {
      setActiveFrameworkNodeKey(`dimension:${dimension.id}`);
      onSelectDimension(dimension.id);
    }
  };

  const handleRemoveFrameworkNode = (node) => {
    if (!node) return;
    if (node.nodeType === 'item') {
      handleRemoveItemWithFallback(node.dimensionIndex, node.itemIndex);
      return;
    }
    const dimensionEntry = dimensionEntries.find((entry) => entry.dimension.id === node.dimension.id);
    handleRemoveDimensionWithFallback(dimensionEntry);
  };

  const handleScrollAreaActivity = (areaKey) => {
    setVisibleScrollAreas((current) => (
      current[areaKey] ? current : { ...current, [areaKey]: true }
    ));

    if (scrollHideTimersRef.current[areaKey]) {
      window.clearTimeout(scrollHideTimersRef.current[areaKey]);
    }
    scrollHideTimersRef.current[areaKey] = window.setTimeout(() => {
      setVisibleScrollAreas((current) => {
        if (!current[areaKey]) return current;
        return { ...current, [areaKey]: false };
      });
    }, 800);
  };

  const getFrameworkNodeTitle = (node) => (
    node?.nodeType === 'item'
      ? (node.item?.name || '未命名能力')
      : (node?.dimension?.name || '未命名能力')
  );

  const getFrameworkNodeDescription = (node) => (
    node?.nodeType === 'item'
      ? (node.item?.description || '未填写能力说明')
      : (node?.dimension?.description || '未填写能力说明')
  );

  const getFrameworkNodeMeta = (node) => {
    if (!node) return '';
    if (node.nodeType === 'item') return `能力配置 · ${node.orderText}`;
    const childrenText = [
      node.dimensionChildCount ? `${node.dimensionChildCount} 个下级分类` : '',
      node.itemCount ? `${node.itemCount} 个能力配置` : '',
    ].filter(Boolean).join(' · ');
    return `第 ${node.level} 层${childrenText ? ` · ${childrenText}` : ''}`;
  };

  const renderFrameworkNode = (node) => {
    const isActive = node.key === selectedFrameworkNode?.key;
    const isCollapsed = collapsedFrameworkNodeKeys.has(node.key);
    const canDeleteNode = node.nodeType === 'item'
      ? (node.itemIndex >= 0 && (node.dimension?.items?.length || 0) > 1)
      : (node.dimensionIndex >= 0 && totalDimensions > 1);
    const menuItems = node.nodeType === 'item'
      ? [
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除能力',
            danger: true,
            disabled: !canDeleteNode,
            onClick: () => handleRemoveFrameworkNode(node),
          },
        ]
      : [
          {
            key: 'add-dimension',
            icon: <PlusOutlined />,
            label: '新增下级分类',
            disabled: !node.canAddChildDimension,
            onClick: () => handleAddDimensionAndReturn(node.dimension.id),
          },
          {
            key: 'add-item',
            icon: <FileTextOutlined />,
            label: '新增能力配置',
            disabled: !node.canAddItem,
            onClick: () => handleAddItemForDimension(node.dimensionIndex),
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除能力',
            danger: true,
            disabled: !canDeleteNode,
            onClick: () => handleRemoveFrameworkNode(node),
          },
        ];

    return (
      <div
        key={node.key}
        className={`cap-model-framework-tree-node is-level-${node.level} is-${node.nodeType}${isActive ? ' is-active' : ''}`}
        style={{ '--cap-tree-level': node.level - 1 }}
      >
        <button
          type="button"
          className="cap-model-framework-tree-row"
          onClick={() => handleSelectFrameworkNode(node)}
        >
          <span
            className={`cap-model-framework-tree-toggle${node.hasChildren ? '' : ' is-empty'}`}
            onClick={(event) => {
              event.stopPropagation();
              if (node.hasChildren) handleToggleFrameworkNode(node.key);
            }}
          >
            {node.hasChildren ? (isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />) : null}
          </span>
          <span className="cap-model-framework-tree-icon">
            {node.nodeType === 'item' ? <FileTextOutlined /> : <AppstoreOutlined />}
          </span>
          <span className="cap-model-framework-tree-copy">
            <span className="cap-model-framework-tree-title">{getFrameworkNodeTitle(node)}</span>
            <span className="cap-model-framework-tree-meta">{getFrameworkNodeMeta(node)}</span>
          </span>
        </button>
        <span className="cap-model-framework-tree-actions" onClick={(event) => event.stopPropagation()}>
          {node.nodeType === 'dimension' && node.canAddChildDimension ? (
            <button
              type="button"
              className="cap-model-framework-tree-action"
              title="新增下级分类"
              onClick={() => handleAddDimensionAndReturn(node.dimension.id)}
            >
              <PlusOutlined />
            </button>
          ) : null}
          <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: menuItems }}>
            <button type="button" className="cap-model-framework-tree-action" title="更多操作">
              <MoreOutlined />
            </button>
          </Dropdown>
        </span>
      </div>
    );
  };

  const selectedDeleteDisabled = selectedFrameworkNode?.nodeType === 'item'
    ? (selectedItemIndex < 0 || selectedDimensionItemCount <= 1)
    : (selectedDimensionIndex < 0 || totalDimensions <= 1);

  const renderFrameworkSection = () => (
    <div className={`cap-model-editor-section${isLayeredEditor ? ' is-linked' : ''}`}>
      <div className="cap-model-framework-workspace">
        {totalDimensions === 0 ? (
          <div className="cap-model-empty-panel cap-model-framework-empty">
            <Empty description="暂无能力，请先新增" />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddDimensionAndReturn()}>
              新增能力
            </Button>
          </div>
        ) : (
          <div className="cap-model-framework-split">
            <aside className="cap-model-framework-tree-panel">
              <div className="cap-model-framework-tree-head">
                <div>
                  <div className="cap-model-dimension-title">能力结构</div>
                  <div className="cap-model-section-desc">{totalDimensions} 个分类 · {getTotalCapabilityItems(modelDraft)} 个配置</div>
                </div>
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => handleAddDimensionAndReturn()}>
                  新增
                </Button>
              </div>
              <div
                className={`cap-model-framework-tree-list${visibleScrollAreas.tree ? ' is-scrolling' : ''}`}
                onScroll={() => handleScrollAreaActivity('tree')}
              >
                {visibleFrameworkNodes.map((node) => renderFrameworkNode(node))}
              </div>
            </aside>

            <section
              className={`cap-model-framework-config-panel${visibleScrollAreas.config ? ' is-scrolling' : ''}`}
              onScroll={() => handleScrollAreaActivity('config')}
            >
              {selectedFrameworkNode ? (
                <div className="cap-model-framework-config-card">
                  <div className="cap-model-framework-config-head">
                    <div className="cap-model-framework-config-title-wrap">
                      <div className="cap-model-framework-stage-kicker">
                        {selectedNodeIsConfig ? '能力配置' : '能力分类'}
                      </div>
                      <div className="cap-model-framework-stage-title">{getFrameworkNodeTitle(selectedFrameworkNode)}</div>
                      <div className="cap-model-section-desc">{getFrameworkNodeDescription(selectedFrameworkNode)}</div>
                    </div>
                    <Space size={8} wrap>
                      <Tag color="blue">{selectedFrameworkNode.orderText}</Tag>
                      <Tag>{selectedNodeIsConfig ? '可配置' : `第 ${selectedFrameworkNode.level} 层`}</Tag>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={selectedDeleteDisabled}
                        onClick={() => handleRemoveFrameworkNode(selectedFrameworkNode)}
                      >
                        删除能力
                      </Button>
                    </Space>
                  </div>

                  {selectedNodeIsConfig && selectedItem ? (
                    <div className="cap-model-item-card">
                      <div className="cap-model-item-section">
                        <div className="cap-model-subsection-head">
                          <div className="cap-model-item-title">基础</div>
                        </div>
                        <div className="cap-model-form-grid cap-model-form-grid-2">
                          <div>
                            <div className="cap-model-field-label">能力名称</div>
                            <Input
                              value={selectedFrameworkNode.nodeType === 'item' ? selectedItem.name : selectedDimension?.name}
                              onChange={(event) => {
                                if (selectedFrameworkNode.nodeType === 'item') {
                                  onUpdateItemField(selectedDimensionIndex, selectedItemIndex, 'name', event.target.value);
                                  return;
                                }
                                onUpdateDimensionField(selectedDimensionIndex, 'name', event.target.value);
                              }}
                              placeholder="例如：目标与学情对齐"
                            />
                          </div>
                          <div>
                            <div className="cap-model-field-label">能力说明</div>
                            <Input
                              value={selectedFrameworkNode.nodeType === 'item' ? selectedItem.description : selectedDimension?.description}
                              onChange={(event) => {
                                if (selectedFrameworkNode.nodeType === 'item') {
                                  onUpdateItemField(selectedDimensionIndex, selectedItemIndex, 'description', event.target.value);
                                  return;
                                }
                                onUpdateDimensionField(selectedDimensionIndex, 'description', event.target.value);
                              }}
                              placeholder="说明该能力关注的行为表现"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="cap-model-item-section">
                        <div className="cap-model-subsection-head">
                          <div className="cap-model-item-title">规则</div>
                        </div>
                        <div className="cap-model-form-grid cap-model-form-grid-2">
                          <div>
                            <div className="cap-model-field-label">证据类型</div>
                            <Select
                              mode="multiple"
                              value={selectedItem.evidenceTypes || []}
                              onChange={(values) => onUpdateItemStringListField(selectedDimensionIndex, selectedItemIndex, 'evidenceTypes', values)}
                              options={CAPABILITY_ITEM_EVIDENCE_TYPE_OPTIONS}
                              placeholder="选择该能力允许使用的证据类型"
                            />
                          </div>
                          <div>
                            <div className="cap-model-field-label">评价主体</div>
                            <Select
                              mode="multiple"
                              value={selectedItem.requiredReviewRoles || []}
                              onChange={(values) => onUpdateItemStringListField(selectedDimensionIndex, selectedItemIndex, 'requiredReviewRoles', values)}
                              options={CAPABILITY_ITEM_REVIEW_ROLE_OPTIONS}
                              placeholder="选择该能力的复核主体"
                            />
                          </div>
                        </div>

                        <div className="cap-model-form-grid cap-model-form-grid-2">
                          <div>
                            <div className="cap-model-field-label">最低证据数</div>
                            <InputNumber
                              min={1}
                              max={10}
                              value={selectedItem.requiredEvidenceCount || 1}
                              onChange={(value) => onUpdateItemField(selectedDimensionIndex, selectedItemIndex, 'requiredEvidenceCount', value || 1)}
                            />
                          </div>
                          <div>
                            <div className="cap-model-field-label">AI辅助策略</div>
                            <Select
                              value={selectedItem.aiAssistMode || 'SUGGEST_ONLY'}
                              onChange={(value) => onUpdateItemField(selectedDimensionIndex, selectedItemIndex, 'aiAssistMode', value)}
                              options={CAPABILITY_ITEM_AI_ASSIST_MODE_OPTIONS}
                            />
                          </div>
                        </div>

                        <div className="cap-model-form-grid cap-model-form-grid-2">
                          <div>
                            <div className="cap-model-field-label">成长档案专用</div>
                            <Switch
                              checked={Boolean(selectedItem.isGrowthOnly)}
                              checkedChildren="是"
                              unCheckedChildren="否"
                              onChange={(checked) => onUpdateItemField(selectedDimensionIndex, selectedItemIndex, 'isGrowthOnly', checked)}
                            />
                          </div>
                        </div>

                        <div className="cap-model-field-stack">
                          <div className="cap-model-field-label">成长记录示例</div>
                          <TextArea
                            rows={3}
                            value={(selectedItem.evidenceExamples || []).join('\n')}
                            onChange={(event) => onUpdateItemEvidence(selectedDimensionIndex, selectedItemIndex, event.target.value)}
                            placeholder="每行一条，例如：课堂观察记录"
                          />
                        </div>
                      </div>

                      <div className="cap-model-item-section cap-model-descriptor-panel">
                        <div className="cap-model-subsection-head">
                          <div className="cap-model-item-title">等级描述</div>
                          <Tag>{modelDraft.levelScheme.levels.length} 个等级</Tag>
                        </div>
                        <Tabs
                          size="small"
                          items={modelDraft.levelScheme.levels.map((level, levelIndex) => ({
                            key: level.key,
                            label: level.label,
                            children: (
                              <div className="cap-model-descriptor-tab">
                                <TextArea
                                  rows={6}
                                  value={selectedItem.levelDescriptors?.[levelIndex]?.text || ''}
                                  onChange={(event) => onUpdateItemDescriptor(selectedDimensionIndex, selectedItemIndex, levelIndex, event.target.value)}
                                  placeholder={`填写 ${level.label} 的行为描述`}
                                />
                              </div>
                            ),
                          }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="cap-model-item-card">
                      <div className="cap-model-item-section">
                        <div className="cap-model-subsection-head">
                          <div className="cap-model-item-title">基础</div>
                        </div>
                        <div className="cap-model-form-grid cap-model-form-grid-2">
                          <div>
                            <div className="cap-model-field-label">能力名称</div>
                            <Input
                              value={selectedDimension?.name}
                              onChange={(event) => onUpdateDimensionField(selectedDimensionIndex, 'name', event.target.value)}
                              placeholder="例如：教学设计"
                            />
                          </div>
                          <div>
                            <div className="cap-model-field-label">能力说明</div>
                            <Input
                              value={selectedDimension?.description}
                              onChange={(event) => onUpdateDimensionField(selectedDimensionIndex, 'description', event.target.value)}
                              placeholder="说明该能力分类聚焦的核心范围"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="cap-model-framework-node-tools">
                        <div className="cap-model-framework-node-tool-card">
                          <div className="cap-model-framework-node-tool-title">下级分类</div>
                          <div className="cap-model-section-desc">继续拆分能力结构，最多支持 3 层。</div>
                          <Button
                            icon={<PlusOutlined />}
                            disabled={!selectedFrameworkNode.canAddChildDimension}
                            onClick={() => handleAddDimensionAndReturn(selectedDimension.id)}
                          >
                            新增下级分类
                          </Button>
                        </div>
                        <div className="cap-model-framework-node-tool-card">
                          <div className="cap-model-framework-node-tool-title">能力配置</div>
                          <div className="cap-model-section-desc">为当前分类补充可评价的能力配置。</div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            disabled={!selectedFrameworkNode.canAddItem}
                            onClick={() => handleAddItemForDimension(selectedDimensionIndex)}
                          >
                            新增能力配置
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cap-model-empty-panel cap-model-framework-empty">
                  <Empty description="请选择一个能力开始编辑" />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`cap-model-editor${embedded ? ' cap-model-editor-embedded' : ' cap-model-editor-layered'}`}>
      {isLayeredEditor ? (
        <div className="cap-model-editor-stage-shell">
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
          <div className={`cap-model-editor-section${isLayeredEditor ? ' is-linked' : ''}`}>
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
          </div>
        </Form>
      ) : null}

      {showLevelSection ? (
        <div className={`cap-model-editor-section${isLayeredEditor ? ' is-linked' : ''}`}>
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
        </div>
      ) : null}

      {showFrameworkSection ? renderFrameworkSection() : null}

    </div>
  );
}
