import { useState } from 'react';
import {
  Button,
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
  return (
    <div className={`cap-model-editor${embedded ? ' cap-model-editor-embedded' : ''}`}>
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

      <div className="cap-model-editor-section">
        <div className="cap-model-section-head">
          <div>
            <div className="cap-model-section-title">能力框架</div>
            <div className="cap-model-section-desc">左侧维护能力结构，右侧只编辑当前选中的能力类与能力项，减少同屏嵌套。</div>
          </div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={onAddDimension}>新增能力类</Button>
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
                    onClick={() => onSelectDimension(dimension.id)}
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
                      <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => onAddItem(activeDimensionIndex)}>新增能力项</Button>
                    </div>
                    <div className="cap-model-framework-item-list">
                      {(activeDimension.items || []).map((item, itemIndex) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`cap-model-framework-item-row ${item.id === activeItem?.id ? 'is-active' : ''}`}
                          onClick={() => onSelectItem(activeDimension.id, item.id)}
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
                          <Button size="small" onClick={() => onMoveDimension(activeDimensionIndex, -1)} disabled={activeDimensionIndex === 0}>上移</Button>
                          <Button size="small" onClick={() => onMoveDimension(activeDimensionIndex, 1)} disabled={activeDimensionIndex === modelDraft.dimensions.length - 1}>下移</Button>
                          <Button size="small" danger onClick={() => onRemoveDimension(activeDimensionIndex)} disabled={modelDraft.dimensions.length === 1}>删除</Button>
                        </Space>
                      </div>

                      <div className="cap-model-form-grid cap-model-form-grid-2">
                        <div>
                          <div className="cap-model-field-label">能力类名称</div>
                          <Input
                            value={activeDimension.name}
                            onChange={(event) => onUpdateDimensionField(activeDimensionIndex, 'name', event.target.value)}
                            placeholder="例如：教学设计"
                          />
                        </div>
                        <div>
                          <div className="cap-model-field-label">能力类说明</div>
                          <Input
                            value={activeDimension.description}
                            onChange={(event) => onUpdateDimensionField(activeDimensionIndex, 'description', event.target.value)}
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
                            <Button size="small" onClick={() => onMoveItem(activeDimensionIndex, activeItemIndex, -1)} disabled={activeItemIndex === 0}>上移</Button>
                            <Button size="small" onClick={() => onMoveItem(activeDimensionIndex, activeItemIndex, 1)} disabled={activeItemIndex === activeDimension.items.length - 1}>下移</Button>
                            <Button size="small" danger onClick={() => onRemoveItem(activeDimensionIndex, activeItemIndex)} disabled={activeDimension.items.length === 1}>删除</Button>
                          </Space>
                        </div>

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

                        <div>
                          <div className="cap-model-field-label">成长记录示例</div>
                          <TextArea
                            rows={2}
                            value={(activeItem.evidenceExamples || []).join('\n')}
                            onChange={(event) => onUpdateItemEvidence(activeDimensionIndex, activeItemIndex, event.target.value)}
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
                                    onChange={(event) => onUpdateItemDescriptor(activeDimensionIndex, activeItemIndex, levelIndex, event.target.value)}
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
  );
}
