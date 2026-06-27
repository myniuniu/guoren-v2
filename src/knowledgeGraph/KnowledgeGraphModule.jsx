import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  getAllItemsAcrossLibraries,
  loadResourceLib,
  removeKnowledgeGraphItemsByGraphIds,
} from '../resourceLib/resourceLibStore';
import SpaceResourceImportModal from '../resourceLib/SpaceResourceImportModal.jsx';
import {
  acceptGraphDraft,
  bindResourcesToPoint,
  createCollection,
  createGraph,
  createPoint,
  createRelation,
  createStructuredStage,
  createStructuredStageEdge,
  dismissGraphDraft,
  duplicateGraph,
  getCollections,
  getGraphById,
  getGraphLayout,
  getGraphsByCollection,
  getKnowledgeGraphStoreEventName,
  getLatestGraphDraft,
  getPointsByGraph,
  getRelationsByGraph,
  KNOWLEDGE_POINT_TYPE_OPTIONS,
  loadKnowledgeGraphStore,
  RELATION_TYPE_OPTIONS,
  STAGE_EDGE_SEMANTIC_OPTIONS,
  removeCollection,
  removeGraph,
  removePoint,
  removeRelation,
  removeResourceBinding,
  removeStructuredStage,
  removeStructuredStageEdge,
  updateCollection,
  updateGraph,
  updatePoint,
  updateRelation,
  updateStructuredStage,
  updateStructuredStageEdge,
  updateStructuredStagePosition,
  moveStructuredPoint,
  generateGraphDraft,
  getStageEdgeSemanticMeta,
} from './store';
import StructuredKnowledgeGraphView from './StructuredKnowledgeGraphView';
import './KnowledgeGraphModule.css';
const RELATION_TYPE_LABEL_MAP = Object.fromEntries(RELATION_TYPE_OPTIONS.map((item) => [item.value, item.label]));
const POINT_TYPE_LABEL_MAP = Object.fromEntries(KNOWLEDGE_POINT_TYPE_OPTIONS.map((item) => [item.value, item.label]));
const STAGE_EDGE_SEMANTIC_LABEL_MAP = Object.fromEntries(STAGE_EDGE_SEMANTIC_OPTIONS.map((item) => [item.value, item.label]));
const EDGE_LINE_STYLE_OPTIONS = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
];
const EDGE_COLOR_PRESETS = ['#1f1f24', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7c3aed'];
const EDGE_WIDTH_PRESETS = [1.6, 2.8, 4.2];
const EDGE_PATH_STYLE_OPTIONS = [
  { value: 'straight', label: '直线' },
  { value: 'smoothstep', label: '曲线' },
  { value: 'step', label: '折线' },
];
const EDGE_MARKER_TYPE_OPTIONS = [
  { value: 'arrow', label: '开放箭头' },
  { value: 'arrowclosed', label: '实心箭头' },
  { value: 'none', label: '无箭头' },
];
const EDGE_START_MARKER_OPTIONS = [
  { value: 'none', label: '无线尾' },
  { value: 'arrow', label: '箭头端点' },
];

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildKnowledgeGraphAgentWelcome(graphName, stageCount, pointCount, bindingCount) {
  return `你好！我是知识体系智能体。

当前知识图谱「${graphName || '未命名图谱'}」包含 ${stageCount} 个分区、${pointCount} 个知识点、${bindingCount} 条资料绑定。

你可以直接描述你的知识体系设计需求，例如：
• "帮我检查哪些分区还缺少学习资料"
• "这套知识图谱的学习路径是否清晰"
• "请给出每个分区的学习目标建议"

请描述你希望优化的知识体系问题：`;
}

function buildKnowledgeGraphAgentReply(userMessage, context) {
  const messageText = String(userMessage || '').trim().toLowerCase();
  const {
    graphName,
    stageSummaries,
    pointCount,
    relationCount,
    stageEdgeCount,
    bindingCount,
    unboundPoints,
  } = context;

  if (!messageText) {
    return '可以直接告诉我你想优化的知识体系问题，我会基于当前图谱给出分区建议。';
  }

  if (messageText.includes('资料') || messageText.includes('资源') || messageText.includes('绑定')) {
    if (!unboundPoints.length) {
      return `当前图谱的 ${pointCount} 个知识点都已经绑定资料，总计 ${bindingCount} 条资料绑定。下一步建议优先检查资料覆盖是否和分区目标一致。`;
    }
    const previewPoints = unboundPoints.slice(0, 5).map((point) => point.title).join('、');
    return `当前还有 ${unboundPoints.length} 个知识点未绑定资料，例如：${previewPoints}。建议优先补齐这些知识点的学习资料，再让学员进入预览视图浏览。`;
  }

  if (messageText.includes('阶段') || messageText.includes('分区')) {
    const summaryText = stageSummaries
      .map((stage) => `${stage.name}（${stage.pointCount} 个知识点，${stage.bindingCount} 条资料）`)
      .join('；');
    return summaryText
      ? `当前图谱「${graphName}」的分区分布如下：${summaryText}。如果你希望我进一步优化，我可以继续按“分区目标、核心知识点、资料覆盖”三个维度给建议。`
      : '当前图谱还没有分区。建议先按学习路径拆成 3 到 5 个分区，再逐步补知识点。';
  }

  if (messageText.includes('路径') || messageText.includes('顺序') || messageText.includes('前置') || messageText.includes('连线')) {
    if (!stageEdgeCount) {
      return '当前分区之间还没有学习路径连线。建议先补一条从基础到应用的主路径，再决定哪些分区需要并行或分支学习。';
    }
    return `当前分区之间已有 ${stageEdgeCount} 条路径连线，知识点总关系数为 ${relationCount}。建议重点检查每个分区是否只承担一个主目标，避免学员在预览视图里看到过多交叉路径。`;
  }

  if (messageText.includes('学员') || messageText.includes('预览')) {
    return `如果这套图谱要给学员预览，建议重点检查三件事：1. 分区命名是否直观；2. 每个知识点是否都绑定了可直接学习的资料；3. 分区之间的路径连线是否符合从基础到应用的顺序。`;
  }

  return `我建议先从三步检查当前图谱「${graphName}」：第一，分区是否按学习路径递进；第二，${pointCount} 个知识点是否都归属清晰；第三，${bindingCount} 条资料绑定是否覆盖核心知识点。如果你愿意，我可以继续按“分区目标”或“资料缺口”展开。`;
}

function EdgeStyleButton({ active, onClick, children }) {
  return (
    <button type="button" className={`kg-edge-style-button${active ? ' is-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function EdgeStyleConfigurator({ form }) {
  const strokeColor = Form.useWatch('strokeColor', form) || '#1f1f24';
  const strokeWidth = Number(Form.useWatch('strokeWidth', form) || 2.8);
  const lineStyle = Form.useWatch('lineStyle', form) || 'solid';
  const pathStyle = Form.useWatch('pathStyle', form) || 'smoothstep';
  const markerType = Form.useWatch('markerType', form) || 'arrowclosed';
  const startMarker = Form.useWatch('startMarker', form) || 'none';
  const opacity = Number(Form.useWatch('opacity', form) ?? 100);

  const setField = (name, value) => {
    form.setFieldValue(name, value);
  };

  return (
    <div className="kg-edge-style-editor">
      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">描边</div>
        <div className="kg-edge-color-row">
          {EDGE_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className={`kg-edge-color-swatch${strokeColor === color ? ' is-active' : ''}`}
              style={{ '--kg-edge-swatch': color }}
              onClick={() => setField('strokeColor', color)}
            />
          ))}
          <input
            type="color"
            className="kg-edge-color-picker"
            value={strokeColor}
            onChange={(event) => setField('strokeColor', event.target.value)}
          />
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">描边宽度</div>
        <div className="kg-edge-style-grid is-compact">
          {EDGE_WIDTH_PRESETS.map((item) => (
            <EdgeStyleButton key={item} active={Math.abs(strokeWidth - item) < 0.21} onClick={() => setField('strokeWidth', item)}>
              <span className="kg-edge-width-sample" style={{ '--kg-edge-width': `${item}px` }} />
            </EdgeStyleButton>
          ))}
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">边框样式</div>
        <div className="kg-edge-style-grid is-compact">
          {EDGE_LINE_STYLE_OPTIONS.map((item) => (
            <EdgeStyleButton key={item.value} active={lineStyle === item.value} onClick={() => setField('lineStyle', item.value)}>
              <span className={`kg-edge-line-sample is-${item.value}`} />
            </EdgeStyleButton>
          ))}
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">线条风格</div>
        <div className="kg-edge-style-grid is-compact">
          {EDGE_PATH_STYLE_OPTIONS.map((item) => (
            <EdgeStyleButton key={item.value} active={pathStyle === item.value} onClick={() => setField('pathStyle', item.value)}>
              <svg viewBox="0 0 40 24" className="kg-edge-path-icon">
                {item.value === 'straight' ? <path d="M4 18 L36 6" /> : null}
                {item.value === 'smoothstep' ? <path d="M4 18 C12 18 14 6 22 6 S32 18 36 10" /> : null}
                {item.value === 'step' ? <path d="M4 18 L16 18 L16 8 L30 8 L30 12 L36 12" /> : null}
              </svg>
            </EdgeStyleButton>
          ))}
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">箭头类型</div>
        <div className="kg-edge-style-grid is-compact">
          {EDGE_MARKER_TYPE_OPTIONS.map((item) => (
            <EdgeStyleButton key={item.value} active={markerType === item.value} onClick={() => setField('markerType', item.value)}>
              <svg viewBox="0 0 40 24" className="kg-edge-arrow-icon">
                <path d="M4 18 L30 6" />
                {item.value === 'arrow' ? <path d="M24 6 L30 6 L30 12" /> : null}
                {item.value === 'arrowclosed' ? <path d="M23 6 L30 6 L26 12 Z" className="is-fill" /> : null}
                {item.value === 'none' ? <path d="M25 5 L31 11 M31 5 L25 11" /> : null}
              </svg>
            </EdgeStyleButton>
          ))}
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">端点</div>
        <div className="kg-edge-style-grid is-compact">
          {EDGE_START_MARKER_OPTIONS.map((item) => (
            <EdgeStyleButton key={item.value} active={startMarker === item.value} onClick={() => setField('startMarker', item.value)}>
              <svg viewBox="0 0 40 24" className="kg-edge-arrow-icon">
                <path d="M8 12 L34 12" />
                {item.value === 'none' ? <path d="M6 7 L12 13 M12 7 L6 13" /> : null}
                {item.value === 'arrow' ? <path d="M8 12 L14 8 M8 12 L14 16" /> : null}
              </svg>
            </EdgeStyleButton>
          ))}
        </div>
      </div>

      <div className="kg-edge-style-group">
        <div className="kg-edge-style-label">透明度</div>
        <Slider min={0} max={100} value={opacity} onChange={(value) => setField('opacity', value)} />
        <div className="kg-edge-opacity-scale">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 16);
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function defaultSelection(graphId) {
  return graphId ? { type: 'graph', id: graphId } : null;
}

function getStageEdgeLineDashArray(lineStyle) {
  if (lineStyle === 'dashed') return '5 4';
  if (lineStyle === 'dotted') return '2 4';
  return undefined;
}

function getStageEdgeDisplayMeta(edge) {
  const semanticMeta = getStageEdgeSemanticMeta(edge?.semanticType);
  if (semanticMeta) return semanticMeta;
  return {
    label: '历史自定义',
    description: '保留旧的自由样式表达，尚未纳入分区关系语义规范。',
    appearance: {
      strokeColor: edge?.strokeColor || '#94a3b8',
      strokeWidth: edge?.strokeWidth || 2,
      lineStyle: edge?.lineStyle || 'solid',
      markerType: edge?.markerType || 'arrowclosed',
      startMarker: edge?.startMarker || 'none',
    },
  };
}

function StageEdgeSemanticPreview({ edge }) {
  const meta = getStageEdgeDisplayMeta(edge);
  const appearance = meta.appearance || {};
  const strokeColor = appearance.strokeColor || '#94a3b8';
  const strokeWidth = appearance.strokeWidth || 2;
  const dashArray = getStageEdgeLineDashArray(appearance.lineStyle);

  return (
    <div className="kg-stage-edge-preview">
      <svg viewBox="0 0 64 18" className="kg-stage-edge-preview-icon" aria-hidden="true">
        <path
          d="M10 9 L54 9"
          style={{
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: dashArray,
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        />
        {appearance.startMarker === 'arrow' ? (
          <>
            <path d="M10 9 L16 5" style={{ stroke: strokeColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }} />
            <path d="M10 9 L16 13" style={{ stroke: strokeColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }} />
          </>
        ) : null}
        {appearance.markerType === 'arrow' ? (
          <>
            <path d="M54 9 L48 5" style={{ stroke: strokeColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }} />
            <path d="M54 9 L48 13" style={{ stroke: strokeColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' }} />
          </>
        ) : null}
        {appearance.markerType === 'arrowclosed' ? (
          <path d="M54 9 L46 4 L46 14 Z" style={{ fill: strokeColor, stroke: strokeColor, strokeWidth: 1.4 }} />
        ) : null}
      </svg>
      <div className="kg-stage-edge-preview-copy">
        <div className="kg-stage-edge-preview-name">{meta.label}</div>
        <div className="kg-stage-edge-preview-desc">{meta.description}</div>
      </div>
    </div>
  );
}

function AIGenerateModal({ open, graph, onCancel, onGenerate }) {
  const [form] = Form.useForm();
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [selectedResourceKeys, setSelectedResourceKeys] = useState([]);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      theme: graph?.name || '',
      audience: '',
      goal: '',
      stylePrompt: '',
    });
    setData(loadResourceLib());
    setScope('all');
    setKeyword('');
    setSelectedResourceKeys([]);
  }, [form, graph, open]);

  const items = useMemo(() => {
    const allItems = getAllItemsAcrossLibraries(data);
    const normalizedKeyword = normalizeSearchText(keyword);
    return allItems.filter((item) => {
      if (scope !== 'all' && item.libraryScope !== scope) return false;
      if (!normalizedKeyword) return true;
      return `${item.name} ${item.libraryName} ${item.fileType}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [data, keyword, scope]);

  const selectedResources = useMemo(() => {
    const keySet = new Set(selectedResourceKeys);
    return items.filter((item) => keySet.has(item.key));
  }, [items, selectedResourceKeys]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onGenerate({
        ...values,
        resources: selectedResources,
      });
    } catch {
      // validation handled by antd
    }
  };

  return (
    <Modal
      title="AI 生成图谱草稿"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="生成草稿"
      cancelText="取消"
      width={980}
      destroyOnClose
    >
      <div className="kg-ai-modal">
        <div className="kg-ai-form">
          <Form form={form} layout="vertical">
            <Form.Item
              label="图谱主题"
              name="theme"
              rules={[{ required: true, message: '请输入图谱主题' }]}
            >
              <Input placeholder="例如：AI 基础课程、数字素养训练、项目式学习" />
            </Form.Item>
            <Form.Item label="目标人群" name="audience">
              <Input placeholder="例如：初中生、新教师、企业培训学员" />
            </Form.Item>
            <Form.Item label="图谱目标" name="goal">
              <Input.TextArea rows={3} placeholder="描述这张图谱希望解决的问题、课程用途或展示重点" />
            </Form.Item>
            <Form.Item label="生成风格提示" name="stylePrompt">
              <Input.TextArea rows={3} placeholder="例如：偏课程地图、偏项目路径、偏安全规范、偏演示展示" />
            </Form.Item>
          </Form>
        </div>
        <div className="kg-ai-resource-panel">
          <div className="kg-ai-resource-header">
            <div>
              <div className="kg-ai-resource-title">资料输入</div>
              <div className="kg-ai-resource-subtitle">可选取资料库资料辅助生成节点建议</div>
            </div>
            <Segmented
              size="small"
              value={scope}
              onChange={setScope}
              options={[
                { label: '全部', value: 'all' },
                { label: '个人库', value: 'personal' },
                { label: '组织库', value: 'organization' },
              ]}
            />
          </div>
          <Input.Search
            allowClear
            placeholder="搜索资料"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="kg-modal-search"
          />
          <Table
            rowKey="key"
            size="small"
            className="kg-resource-table"
            columns={[
              {
                title: '资料',
                dataIndex: 'name',
                render: (value, record) => (
                  <div className="kg-resource-name-cell">
                    <div className="kg-resource-name">{value}</div>
                    <div className="kg-resource-meta">{record.libraryName} · {record.fileType}</div>
                  </div>
                ),
              },
              {
                title: '库',
                dataIndex: 'libraryName',
                width: 120,
              },
            ]}
            dataSource={items}
            pagination={{ pageSize: 7, hideOnSinglePage: true }}
            locale={{ emptyText: '暂无可用资料' }}
            rowSelection={{
              selectedRowKeys: selectedResourceKeys,
              onChange: (keys) => setSelectedResourceKeys(keys),
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

function DraftPreviewModal({
  open,
  draft,
  currentGraph,
  onCancel,
  onApply,
  onDismiss,
  mergeMode,
  onMergeModeChange,
  setDraft,
}) {
  const nodeOptions = useMemo(
    () => (draft?.generatedNodes || []).map((node) => ({ label: node.title, value: node.id })),
    [draft],
  );

  if (!draft) return null;

  const updateNode = (nodeId, patch) => {
    setDraft((prev) => ({
      ...prev,
      generatedNodes: prev.generatedNodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    }));
  };

  const removeNode = (nodeId) => {
    setDraft((prev) => ({
      ...prev,
      generatedNodes: prev.generatedNodes.filter((node) => node.id !== nodeId),
      generatedRelations: prev.generatedRelations.filter((relation) => relation.sourceId !== nodeId && relation.targetId !== nodeId),
      generatedLayout: {
        ...prev.generatedLayout,
        graphView: {
          positions: Object.fromEntries(
            Object.entries(prev.generatedLayout?.graphView?.positions || {}).filter(([pointId]) => pointId !== nodeId),
          ),
        },
        structuredView: {
          ...(prev.generatedLayout?.structuredView || {}),
          pointPlacements: Object.fromEntries(
            Object.entries(prev.generatedLayout?.structuredView?.pointPlacements || {}).filter(([pointId]) => pointId !== nodeId),
          ),
          pointPositions: Object.fromEntries(
            Object.entries(prev.generatedLayout?.structuredView?.pointPositions || {}).filter(([pointId]) => pointId !== nodeId),
          ),
        },
        curriculumView: {
          sections: prev.generatedLayout?.curriculumView?.sections || [],
          cards: Object.fromEntries(
            Object.entries(prev.generatedLayout?.curriculumView?.cards || {}).filter(([pointId]) => pointId !== nodeId),
          ),
        },
      },
    }));
  };

  const updateRelationDraft = (relationId, patch) => {
    setDraft((prev) => ({
      ...prev,
      generatedRelations: prev.generatedRelations.map((relation) => (
        relation.id === relationId ? { ...relation, ...patch } : relation
      )),
    }));
  };

  const removeRelationDraft = (relationId) => {
    setDraft((prev) => ({
      ...prev,
      generatedRelations: prev.generatedRelations.filter((relation) => relation.id !== relationId),
    }));
  };

  return (
    <Modal
      title="预览 AI 生成草稿"
      open={open}
      onCancel={onCancel}
      onOk={onApply}
      okText={mergeMode === 'append' ? '追加到图谱' : '替换当前图谱'}
      cancelText="关闭"
      width={1080}
      destroyOnClose
    >
      <div className="kg-draft-meta">
        <Alert
          type="info"
          showIcon
          message={`当前图谱：${currentGraph?.name || '-'}，共生成 ${draft.generatedNodes.length} 个知识点、${draft.generatedRelations.length} 条关系。`}
          description="可以在应用前微调知识点标题、关系类型和删除不需要的草稿项。"
        />
        <Space>
          <Segmented
            value={mergeMode}
            onChange={onMergeModeChange}
            options={[
              { label: '替换当前图谱', value: 'replace' },
              { label: '追加到当前图谱', value: 'append' },
            ]}
          />
          <Button danger onClick={onDismiss}>丢弃草稿</Button>
        </Space>
      </div>
      <div className="kg-draft-grid">
        <div className="kg-draft-column">
          <div className="kg-draft-column-title">知识点草稿</div>
          <div className="kg-draft-list">
            {draft.generatedNodes.map((node) => (
              <Card
                key={node.id}
                size="small"
                className="kg-draft-card"
                extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeNode(node.id)} />}
              >
                <Space direction="vertical" size={10} className="kg-draft-card-body">
                  <Input
                    value={node.title}
                    onChange={(event) => updateNode(node.id, { title: event.target.value })}
                    placeholder="知识点名称"
                  />
                  <Input.TextArea
                    value={node.summary}
                    onChange={(event) => updateNode(node.id, { summary: event.target.value })}
                    rows={3}
                    placeholder="知识点摘要"
                  />
                  <Select
                    value={node.type}
                    onChange={(value) => updateNode(node.id, { type: value })}
                    options={KNOWLEDGE_POINT_TYPE_OPTIONS}
                  />
                </Space>
              </Card>
            ))}
          </div>
        </div>
        <div className="kg-draft-column">
          <div className="kg-draft-column-title">关系草稿</div>
          <div className="kg-draft-list">
            {draft.generatedRelations.map((relation) => (
              <Card
                key={relation.id}
                size="small"
                className="kg-draft-card"
                extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRelationDraft(relation.id)} />}
              >
                <Space direction="vertical" size={10} className="kg-draft-card-body">
                  <Select
                    value={relation.sourceId}
                    onChange={(value) => updateRelationDraft(relation.id, { sourceId: value })}
                    options={nodeOptions}
                    placeholder="源知识点"
                  />
                  <Select
                    value={relation.targetId}
                    onChange={(value) => updateRelationDraft(relation.id, { targetId: value })}
                    options={nodeOptions}
                    placeholder="目标知识点"
                  />
                  <Select
                    value={relation.relationType}
                    onChange={(value) => updateRelationDraft(relation.id, {
                      relationType: value,
                      label: RELATION_TYPE_LABEL_MAP[value] || relation.label,
                    })}
                    options={RELATION_TYPE_OPTIONS}
                  />
                  <Input
                    value={relation.label}
                    onChange={(event) => updateRelationDraft(relation.id, { label: event.target.value })}
                    placeholder="关系标签"
                  />
                </Space>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const KnowledgeGraphModule = forwardRef(function KnowledgeGraphModule({
  entryGraphId = null,
  entryCollectionId = null,
  entryMode = 'curriculum',
  entryRequestId = null,
  embedded = false,
  showBackButton = true,
  onExitEmbedded = null,
}, ref) {
  const [snapshot, setSnapshot] = useState(() => loadKnowledgeGraphStore());
  const [pageMode, setPageMode] = useState(embedded ? 'editor' : 'list');
  const [selectedCollectionId, setSelectedCollectionId] = useState(() => getCollections(loadKnowledgeGraphStore())[0]?.id || null);
  const [selectedGraphId, setSelectedGraphId] = useState(() => {
    const initialState = loadKnowledgeGraphStore();
    const initialCollection = getCollections(initialState)[0];
    return initialCollection ? getGraphsByCollection(initialState, initialCollection.id)[0]?.id || null : null;
  });
  const [selection, setSelection] = useState(() => defaultSelection(selectedGraphId));
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [viewMode, setViewMode] = useState('curriculum');
  const [collectionModalState, setCollectionModalState] = useState({ open: false, mode: 'create', record: null });
  const [graphModalState, setGraphModalState] = useState({ open: false, mode: 'create', record: null });
  const [pointModalState, setPointModalState] = useState({ open: false });
  const [sectionModalState, setSectionModalState] = useState({ open: false, mode: 'create', record: null });
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [pendingStageEdge, setPendingStageEdge] = useState(null);
  const [stageEdgeInspectorTab, setStageEdgeInspectorTab] = useState('basic');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [draftPreviewOpen, setDraftPreviewOpen] = useState(false);
  const [draftMergeMode, setDraftMergeMode] = useState('replace');
  const [draftEditor, setDraftEditor] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentCollapsed, setAgentCollapsed] = useState(embedded);
  const [agentWidth, setAgentWidth] = useState(320);
  const [collectionForm] = Form.useForm();
  const [graphForm] = Form.useForm();
  const [pointForm] = Form.useForm();
  const [sectionForm] = Form.useForm();
  const [graphEditorForm] = Form.useForm();
  const [pointEditorForm] = Form.useForm();
  const [stageEditorForm] = Form.useForm();
  const [relationEditorForm] = Form.useForm();
  const [stageEdgeEditorForm] = Form.useForm();
  const stageEdgeEditorSemanticType = Form.useWatch('semanticType', stageEdgeEditorForm);
  const agentMessagesEndRef = useRef(null);
  const agentReplyTimerRef = useRef(0);
  const entryRequestHandledRef = useRef(null);

  useEffect(() => {
    const handleStoreChange = () => setSnapshot(loadKnowledgeGraphStore());
    const eventName = getKnowledgeGraphStoreEventName();
    window.addEventListener(eventName, handleStoreChange);
    return () => window.removeEventListener(eventName, handleStoreChange);
  }, []);

  const collections = useMemo(() => getCollections(snapshot), [snapshot]);

  useEffect(() => {
    if (!collections.length) {
      setSelectedCollectionId(null);
      return;
    }
    if (!collections.some((item) => item.id === selectedCollectionId)) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const graphs = useMemo(
    () => (selectedCollectionId ? getGraphsByCollection(snapshot, selectedCollectionId) : []),
    [selectedCollectionId, snapshot],
  );

  useEffect(() => {
    if (!graphs.length) {
      setSelectedGraphId(null);
      setSelection(null);
      setPendingStageEdge(null);
      setPageMode('list');
      return;
    }
    if (!graphs.some((item) => item.id === selectedGraphId)) {
      setSelectedGraphId(graphs[0].id);
      setSelection(defaultSelection(graphs[0].id));
      setPendingStageEdge(null);
    }
  }, [graphs, selectedGraphId]);

  const currentGraph = useMemo(() => getGraphById(snapshot, selectedGraphId), [selectedGraphId, snapshot]);
  const currentPoints = useMemo(() => (selectedGraphId ? getPointsByGraph(snapshot, selectedGraphId) : []), [selectedGraphId, snapshot]);
  const currentRelations = useMemo(() => (selectedGraphId ? getRelationsByGraph(snapshot, selectedGraphId) : []), [selectedGraphId, snapshot]);
  const currentLayout = useMemo(() => getGraphLayout(snapshot, selectedGraphId), [selectedGraphId, snapshot]);
  const currentDraft = useMemo(() => getLatestGraphDraft(snapshot, selectedGraphId), [selectedGraphId, snapshot]);
  const structuredView = currentLayout.structuredView || {};
  const structuredStages = useMemo(
    () => [...(structuredView.stages || [])].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0)),
    [structuredView.stages],
  );
  const structuredPlacements = structuredView.pointPlacements || {};
  const structuredStageEdges = structuredView.stageEdges || [];

  useEffect(() => {
    if (!selectedGraphId) {
      setSelection(null);
      return;
    }
    if (!selection) {
      setSelection(defaultSelection(selectedGraphId));
      return;
    }
    if (selection.type === 'point' && !currentPoints.some((point) => point.id === selection.id)) {
      setSelection(defaultSelection(selectedGraphId));
      return;
    }
    if (selection.type === 'relation' && !currentRelations.some((relation) => relation.id === selection.id)) {
      setSelection(defaultSelection(selectedGraphId));
      return;
    }
    if (selection.type === 'stage' && !structuredStages.some((stage) => stage.id === selection.id)) {
      setSelection(defaultSelection(selectedGraphId));
      return;
    }
    if (selection.type === 'stage-edge' && !structuredStageEdges.some((edge) => edge.id === selection.id)) {
      setSelection(defaultSelection(selectedGraphId));
      return;
    }
    if (selection.type === 'graph' && selection.id !== selectedGraphId) {
      setSelection(defaultSelection(selectedGraphId));
    }
  }, [currentPoints, currentRelations, selectedGraphId, selection, structuredStageEdges, structuredStages]);

  useEffect(() => {
    if (pageMode !== 'editor' || !selectedGraphId) {
      setInspectorOpen(false);
      return;
    }
    if (viewMode === 'graph') {
      setInspectorOpen(false);
      return;
    }
    if (selection && selection.type !== 'graph') {
      setInspectorOpen(true);
    }
  }, [pageMode, selectedGraphId, selection, viewMode]);

  const selectedPoint = useMemo(
    () => (selection?.type === 'point' ? currentPoints.find((point) => point.id === selection.id) || null : null),
    [currentPoints, selection],
  );
  const selectedRelation = useMemo(
    () => (selection?.type === 'relation' ? currentRelations.find((relation) => relation.id === selection.id) || null : null),
    [currentRelations, selection],
  );
  const selectedStage = useMemo(
    () => (selection?.type === 'stage' ? structuredStages.find((stage) => stage.id === selection.id) || null : null),
    [selection, structuredStages],
  );
  const selectedStageEdge = useMemo(
    () => (selection?.type === 'stage-edge' ? structuredStageEdges.find((edge) => edge.id === selection.id) || null : null),
    [selection, structuredStageEdges],
  );

  useEffect(() => {
    if (selection?.type === 'graph' && currentGraph) {
      graphEditorForm.setFieldsValue({
        name: currentGraph.name,
        description: currentGraph.description,
      });
    }
  }, [currentGraph, graphEditorForm, selection]);

  useEffect(() => {
    if (selection?.type === 'point' && selectedPoint) {
      pointEditorForm.setFieldsValue({
        title: selectedPoint.title,
        summary: selectedPoint.summary,
        type: selectedPoint.type,
        tags: (selectedPoint.tags || []).join(', '),
        color: selectedPoint.meta?.color || '#4667d6',
      });
    }
  }, [pointEditorForm, selectedPoint, selection]);

  useEffect(() => {
    if (selection?.type === 'stage' && selectedStage) {
      stageEditorForm.setFieldsValue({
        name: selectedStage.name,
        description: selectedStage.description,
        color: selectedStage.color || '#4667d6',
        layoutColumns: Number(selectedStage.layoutColumns || 1),
      });
    }
  }, [selectedStage, selection, stageEditorForm]);

  useEffect(() => {
    if (selection?.type === 'relation' && selectedRelation) {
      relationEditorForm.setFieldsValue({
        label: selectedRelation.label,
        relationType: selectedRelation.relationType,
        weight: selectedRelation.weight,
        strokeColor: selectedRelation.strokeColor || '#a78bfa',
        strokeWidth: Number(selectedRelation.strokeWidth || 1.8),
        lineStyle: selectedRelation.lineStyle || 'solid',
        pathStyle: selectedRelation.pathStyle || 'smoothstep',
        markerType: selectedRelation.markerType || 'arrowclosed',
        startMarker: selectedRelation.startMarker || 'none',
        opacity: Number(selectedRelation.opacity ?? 100),
        animated: Boolean(selectedRelation.animated),
      });
    }
  }, [relationEditorForm, selectedRelation, selection]);

  useEffect(() => {
    if (selection?.type === 'stage-edge' && selectedStageEdge) {
      setStageEdgeInspectorTab('basic');
      stageEdgeEditorForm.setFieldsValue({
        semanticType: selectedStageEdge.semanticType,
        label: selectedStageEdge.label,
        strokeColor: selectedStageEdge.strokeColor || '#60a5fa',
        strokeWidth: Number(selectedStageEdge.strokeWidth || 2),
        lineStyle: selectedStageEdge.lineStyle || 'solid',
        pathStyle: selectedStageEdge.pathStyle || 'smoothstep',
        markerType: selectedStageEdge.markerType || 'arrowclosed',
        startMarker: selectedStageEdge.startMarker || 'none',
        opacity: Number(selectedStageEdge.opacity ?? 100),
      });
    }
  }, [selectedStageEdge, selection, stageEdgeEditorForm]);

  useEffect(() => {
    if (selection?.type !== 'stage-edge' || !selectedStageEdge) return;
    if (stageEdgeEditorSemanticType === selectedStageEdge.semanticType) return;
    const semanticMeta = getStageEdgeSemanticMeta(stageEdgeEditorSemanticType);
    if (!semanticMeta?.appearance) return;
    stageEdgeEditorForm.setFieldsValue({
      strokeColor: semanticMeta.appearance.strokeColor,
      strokeWidth: Number(semanticMeta.appearance.strokeWidth || 2),
      lineStyle: semanticMeta.appearance.lineStyle || 'solid',
      pathStyle: semanticMeta.appearance.pathStyle || 'smoothstep',
      markerType: semanticMeta.appearance.markerType || 'arrowclosed',
      startMarker: semanticMeta.appearance.startMarker || 'none',
      opacity: Number(semanticMeta.appearance.opacity ?? 100),
    });
  }, [selection, selectedStageEdge, stageEdgeEditorForm, stageEdgeEditorSemanticType]);

  const relationPointOptions = useMemo(
    () => currentPoints.map((point) => ({ label: point.title, value: point.id })),
    [currentPoints],
  );
  const pointMap = useMemo(
    () => Object.fromEntries(currentPoints.map((point) => [point.id, point])),
    [currentPoints],
  );

  const pointsByStage = useMemo(() => {
    const grouped = {};
    structuredStages.forEach((stage) => {
      grouped[stage.id] = [];
    });
    currentPoints.forEach((point) => {
      const placement = structuredPlacements[point.id];
      if (!placement?.stageId) return;
      if (!grouped[placement.stageId]) grouped[placement.stageId] = [];
      grouped[placement.stageId].push({
        point,
        placement,
      });
    });
    Object.keys(grouped).forEach((stageId) => {
      grouped[stageId].sort((left, right) => (left.placement.order || 0) - (right.placement.order || 0));
    });
    return grouped;
  }, [currentPoints, structuredPlacements, structuredStages]);

  const openCollectionModal = (mode, record = null) => {
    setCollectionModalState({ open: true, mode, record });
    collectionForm.setFieldsValue({
      name: record?.name || '',
      description: record?.description || '',
    });
  };

  const openGraphModal = (mode, record = null) => {
    setGraphModalState({ open: true, mode, record });
    graphForm.setFieldsValue({
      name: record?.name || '',
      description: record?.description || '',
      collectionId: record?.collectionId || selectedCollectionId,
    });
  };

  const openGraphWorkspace = useCallback((graphId, collectionId = null, mode = 'curriculum') => {
    if (collectionId) setSelectedCollectionId(collectionId);
    setSelectedGraphId(graphId);
    setViewMode(mode);
    setSelection(defaultSelection(graphId));
    setInspectorOpen(false);
    setPageMode('editor');
  }, []);

  useEffect(() => {
    if (!entryGraphId || !entryRequestId) return;
    if (entryRequestHandledRef.current === entryRequestId) return;
    const targetGraph = getGraphById(snapshot, entryGraphId);
    if (!targetGraph) return;
    entryRequestHandledRef.current = entryRequestId;
    openGraphWorkspace(targetGraph.id, entryCollectionId || targetGraph.collectionId, entryMode || 'curriculum');
  }, [entryCollectionId, entryGraphId, entryMode, entryRequestId, openGraphWorkspace, snapshot]);

  const completeExitEditor = useCallback(() => {
    if (embedded) {
      onExitEmbedded?.();
      return;
    }
    setPageMode('list');
    setInspectorOpen(false);
    setSelection(defaultSelection(selectedGraphId));
  }, [embedded, onExitEmbedded, selectedGraphId]);

  const openPointModal = (stageId = null) => {
    setPointModalState({ open: true });
    pointForm.setFieldsValue({
      title: '',
      summary: '',
      type: 'TOPIC',
      tags: '',
      stageId: stageId || selectedStage?.id || structuredStages[0]?.id || null,
    });
  };

  const openSectionModal = (mode, record = null) => {
    setSectionModalState({ open: true, mode, record });
    sectionForm.setFieldsValue({
      title: record?.title || record?.name || '',
      description: record?.description || '',
      color: record?.color || '#4667d6',
    });
  };

  const refreshAndMessage = useCallback((text) => {
    setSnapshot(loadKnowledgeGraphStore());
    if (text) message.success(text);
  }, []);

  const handleCreateCollection = async () => {
    try {
      const values = await collectionForm.validateFields();
      if (collectionModalState.mode === 'edit' && collectionModalState.record) {
        updateCollection(collectionModalState.record.id, values);
        refreshAndMessage('图谱集已更新');
      } else {
        const previousIds = new Set(snapshot.collections.map((item) => item.id));
        const nextState = createCollection(values);
        const nextCollection = nextState.collections.find((item) => !previousIds.has(item.id));
        setSelectedCollectionId(nextCollection?.id || null);
        refreshAndMessage('图谱集已创建');
      }
      setCollectionModalState({ open: false, mode: 'create', record: null });
    } catch {
      // validation handled by antd
    }
  };

  const handleCreateGraph = async () => {
    try {
      const values = await graphForm.validateFields();
      if (graphModalState.mode === 'edit' && graphModalState.record) {
        updateGraph(graphModalState.record.id, values);
        setSelectedCollectionId(values.collectionId);
        setSelectedGraphId(graphModalState.record.id);
        refreshAndMessage('图谱已更新');
      } else {
        const previousIds = new Set(snapshot.graphs.map((item) => item.id));
        const nextState = createGraph(values);
        const nextGraph = nextState.graphs.find((graph) => !previousIds.has(graph.id));
        setSelectedCollectionId(values.collectionId);
        setSelectedGraphId(nextGraph?.id || null);
        setViewMode('curriculum');
        setSelection(defaultSelection(nextGraph?.id || null));
        if (nextGraph?.id) setPageMode('editor');
        refreshAndMessage('图谱已创建');
      }
      setGraphModalState({ open: false, mode: 'create', record: null });
    } catch {
      // validation handled by antd
    }
  };

  const handleCreatePoint = async () => {
    if (!selectedGraphId) return;
    try {
      const values = await pointForm.validateFields();
      const previousIds = new Set(currentPoints.map((point) => point.id));
      const nextState = createPoint(selectedGraphId, values);
      const nextPoint = nextState.points.find((point) => point.graphId === selectedGraphId && !previousIds.has(point.id));
      if (nextPoint) {
        setSelection({ type: 'point', id: nextPoint.id });
      }
      refreshAndMessage('知识点已创建');
      setPointModalState({ open: false });
    } catch {
      // validation handled by antd
    }
  };

  const handleSectionSubmit = async () => {
    if (!selectedGraphId) return;
    try {
      const values = await sectionForm.validateFields();
      if (sectionModalState.mode === 'edit' && sectionModalState.record) {
        updateStructuredStage(selectedGraphId, sectionModalState.record.id, values);
        refreshAndMessage('分区已更新');
      } else {
        createStructuredStage(selectedGraphId, values);
        refreshAndMessage('分区已创建');
      }
      setSectionModalState({ open: false, mode: 'create', record: null });
    } catch {
      // validation handled by antd
    }
  };

  const handleDeleteCollection = (collectionId) => {
    const graphIds = snapshot.graphs
      .filter((graph) => graph.collectionId === collectionId)
      .map((graph) => graph.id);
    removeCollection(collectionId);
    if (graphIds.length) {
      removeKnowledgeGraphItemsByGraphIds(loadResourceLib(), graphIds);
    }
    refreshAndMessage('图谱集已删除');
  };

  const handleDeleteGraph = (graphId) => {
    removeGraph(graphId);
    removeKnowledgeGraphItemsByGraphIds(loadResourceLib(), [graphId]);
    refreshAndMessage('图谱已删除');
  };

  const handleSaveGraphEditor = async () => {
    if (!currentGraph) return false;
    try {
      const values = await graphEditorForm.validateFields();
      updateGraph(currentGraph.id, values);
      refreshAndMessage('图谱信息已保存');
      return true;
    } catch {
      // validation handled by antd
      return false;
    }
  };

  const handleSavePointEditor = async () => {
    if (!selectedPoint || !selectedGraphId) return false;
    try {
      const values = await pointEditorForm.validateFields();
      updatePoint(selectedGraphId, selectedPoint.id, {
        title: values.title,
        summary: values.summary,
        type: values.type,
        tags: values.tags,
        meta: { color: values.color },
      });
      refreshAndMessage('知识点已保存');
      return true;
    } catch {
      // validation handled by antd
      return false;
    }
  };

  const handleSaveStageEditor = async () => {
    if (!selectedStage || !selectedGraphId) return false;
    try {
      const values = await stageEditorForm.validateFields();
      updateStructuredStage(selectedGraphId, selectedStage.id, values);
      refreshAndMessage('分区已保存');
      return true;
    } catch {
      // validation handled by antd
      return false;
    }
  };

  const handleSaveRelationEditor = async () => {
    if (!selectedRelation || !selectedGraphId) return false;
    try {
      const values = await relationEditorForm.validateFields();
      updateRelation(selectedGraphId, selectedRelation.id, values);
      refreshAndMessage('关系已保存');
      return true;
    } catch {
      // validation handled by antd
      return false;
    }
  };

  const handleSaveStageEdgeEditor = async () => {
    if (!selectedStageEdge || !selectedGraphId) return false;
    try {
      const values = await stageEdgeEditorForm.validateFields();
      updateStructuredStageEdge(selectedGraphId, selectedStageEdge.id, values);
      refreshAndMessage('分区连线已保存');
      return true;
    } catch {
      // validation handled by antd
      return false;
    }
  };

  const enterEditMode = useCallback(() => {
    if (!currentGraph) return false;
    setViewMode('curriculum');
    setSelection(defaultSelection(currentGraph.id));
    setInspectorOpen(false);
    return true;
  }, [currentGraph]);

  const saveCurrentSelection = useCallback(async () => {
    if (!currentGraph) return false;
    if (viewMode === 'graph') {
      message.warning('当前为预览模式，请先进入编辑模式');
      return false;
    }
    if (selection?.type === 'stage' && selectedStage) return handleSaveStageEditor();
    if (selection?.type === 'point' && selectedPoint) return handleSavePointEditor();
    if (selection?.type === 'stage-edge' && selectedStageEdge) return handleSaveStageEdgeEditor();
    if (selection?.type === 'relation' && selectedRelation) return handleSaveRelationEditor();
    if (selection?.type === 'graph') return handleSaveGraphEditor();
    setSnapshot(loadKnowledgeGraphStore());
    message.success('当前修改已保存');
    return true;
  }, [
    currentGraph,
    handleSaveGraphEditor,
    handleSavePointEditor,
    handleSaveRelationEditor,
    handleSaveStageEditor,
    handleSaveStageEdgeEditor,
    selectedPoint,
    selectedRelation,
    selectedStage,
    selectedStageEdge,
    selection,
    viewMode,
  ]);

  useImperativeHandle(ref, () => ({
    enterEditMode,
    saveCurrentSelection,
  }), [enterEditMode, saveCurrentSelection]);

  const returnToListPage = useCallback(() => {
    if (pageMode !== 'editor' || viewMode !== 'curriculum') {
      completeExitEditor();
      return;
    }
    Modal.confirm({
      title: '退出编辑',
      content: '退出前请先保存当前编辑内容；点击“保存并退出”后将保存当前属性修改并返回。',
      okText: '保存并退出',
      cancelText: '取消',
      onOk: async () => {
        const saved = await saveCurrentSelection();
        if (!saved) {
          throw new Error('knowledge-graph-save-before-exit-failed');
        }
        completeExitEditor();
      },
    });
  }, [completeExitEditor, pageMode, saveCurrentSelection, viewMode]);

  const handleBindResources = ({ selectedItems = [] } = {}) => {
    if (!selectedGraphId || !selectedPoint) return;
    bindResourcesToPoint(selectedGraphId, selectedPoint.id, selectedItems);
    setResourceModalOpen(false);
    refreshAndMessage('资料已绑定到知识点');
  };

  const handleBindResourcesToPointDirect = (pointId, resource) => {
    if (!selectedGraphId || !pointId || !resource) return;
    bindResourcesToPoint(selectedGraphId, pointId, [resource]);
    refreshAndMessage('资料已绑定到知识点');
  };

  const handleGenerateDraft = (payload) => {
    if (!selectedGraphId) return;
    generateGraphDraft(selectedGraphId, payload);
    const nextState = loadKnowledgeGraphStore();
    const draft = getLatestGraphDraft(nextState, selectedGraphId);
    setAiModalOpen(false);
    setDraftMergeMode(currentPoints.length ? 'replace' : 'append');
    setDraftEditor(draft ? clone(draft) : null);
    setDraftPreviewOpen(Boolean(draft));
    setSnapshot(nextState);
    message.success('AI 草稿已生成，请先确认后再应用');
  };

  const handleApplyDraft = () => {
    if (!selectedGraphId || !draftEditor) return;
    acceptGraphDraft(selectedGraphId, draftEditor.id, {
      mergeMode: draftMergeMode,
      draftData: draftEditor,
    });
    setDraftPreviewOpen(false);
    setDraftEditor(null);
    refreshAndMessage(draftMergeMode === 'append' ? 'AI 草稿已追加到图谱' : 'AI 草稿已应用到图谱');
  };

  const handleDismissDraft = () => {
    if (!selectedGraphId || !draftEditor) return;
    dismissGraphDraft(selectedGraphId, draftEditor.id);
    setDraftPreviewOpen(false);
    setDraftEditor(null);
    refreshAndMessage('AI 草稿已丢弃');
  };

  const openDraftPreview = useCallback((draft) => {
    if (!draft) return;
    setDraftMergeMode(currentPoints.length ? 'replace' : 'append');
    setDraftEditor(clone(draft));
    setDraftPreviewOpen(true);
  }, [currentPoints.length]);

  const handleCreateStructuredStageEdge = (payload) => {
    if (!selectedGraphId) return;
    const exists = structuredStageEdges.some((edge) => edge.source === payload.source && edge.target === payload.target);
    if (exists) {
      message.warning('这两个分区之间已经存在连线。');
      return;
    }
    setPendingStageEdge(payload);
  };

  const handleCancelPendingStageEdge = () => {
    setPendingStageEdge(null);
  };

  const handleConfirmPendingStageEdge = (semanticType) => {
    if (!selectedGraphId || !pendingStageEdge) return;
    const nextState = createStructuredStageEdge(selectedGraphId, {
      ...pendingStageEdge,
      semanticType,
    });
    setSnapshot(nextState);
    const createdEdge = getGraphLayout(nextState, selectedGraphId).structuredView?.stageEdges?.find((edge) => (
      edge.source === pendingStageEdge.source && edge.target === pendingStageEdge.target
    ));
    setPendingStageEdge(null);
    if (createdEdge) {
      setSelection({ type: 'stage-edge', id: createdEdge.id });
      setInspectorOpen(true);
    }
    refreshAndMessage(`${STAGE_EDGE_SEMANTIC_LABEL_MAP[semanticType] || '分区'}关系已创建`);
  };

  const handleReconnectStructuredStageEdge = (edgeId, payload) => {
    if (!selectedGraphId || !edgeId) return;
    updateStructuredStageEdge(selectedGraphId, edgeId, payload);
    setSnapshot(loadKnowledgeGraphStore());
  };

  const handleCreateStructuredRelation = (payload) => {
    if (!selectedGraphId) return;
    createRelation(selectedGraphId, payload);
    refreshAndMessage('知识点关系已创建');
  };

  const handleMoveStructuredPoint = (pointId, stageId, targetIndex, pointPosition) => {
    if (!selectedGraphId) return;
    moveStructuredPoint(selectedGraphId, pointId, stageId, targetIndex, pointPosition);
    setSnapshot(loadKnowledgeGraphStore());
  };

  const selectedPointPlacement = useMemo(
    () => (selectedPoint ? structuredPlacements[selectedPoint.id] || null : null),
    [selectedPoint, structuredPlacements],
  );
  const selectedPointStage = useMemo(
    () => (selectedPointPlacement ? structuredStages.find((stage) => stage.id === selectedPointPlacement.stageId) || null : null),
    [selectedPointPlacement, structuredStages],
  );
  const selectedPointRelations = useMemo(
    () => (selectedPoint
      ? currentRelations.filter((relation) => relation.sourceId === selectedPoint.id || relation.targetId === selectedPoint.id)
      : []),
    [currentRelations, selectedPoint],
  );
  const stageSummaries = useMemo(
    () => structuredStages.map((stage) => {
      const stageEntries = pointsByStage[stage.id] || [];
      return {
        ...stage,
        pointCount: stageEntries.length,
        bindingCount: stageEntries.reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0),
      };
    }),
    [pointsByStage, structuredStages],
  );
  const recentPoints = useMemo(
    () => [...currentPoints]
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
      .slice(0, 6),
    [currentPoints],
  );
  const recentRelations = useMemo(
    () => [...currentRelations]
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
      .slice(0, 6),
    [currentRelations],
  );
  const totalBindingCount = useMemo(
    () => currentPoints.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0),
    [currentPoints],
  );
  const unboundPoints = useMemo(
    () => currentPoints.filter((point) => !(point.resourceBindings?.length)),
    [currentPoints],
  );
  const agentWelcomeMessage = useMemo(
    () => buildKnowledgeGraphAgentWelcome(currentGraph?.name, structuredStages.length, currentPoints.length, totalBindingCount),
    [currentGraph?.name, currentPoints.length, structuredStages.length, totalBindingCount],
  );
  const agentReplyContext = useMemo(
    () => ({
      graphName: currentGraph?.name || '未命名图谱',
      stageSummaries,
      pointCount: currentPoints.length,
      relationCount: currentRelations.length,
      stageEdgeCount: structuredStageEdges.length,
      bindingCount: totalBindingCount,
      unboundPoints,
    }),
    [
      currentGraph?.name,
      currentPoints.length,
      currentRelations.length,
      stageSummaries,
      structuredStageEdges.length,
      totalBindingCount,
      unboundPoints,
    ],
  );

  useEffect(() => {
    if (agentReplyTimerRef.current) {
      window.clearTimeout(agentReplyTimerRef.current);
      agentReplyTimerRef.current = 0;
    }
    return () => {
      if (agentReplyTimerRef.current) {
        window.clearTimeout(agentReplyTimerRef.current);
        agentReplyTimerRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (pageMode === 'editor' && viewMode === 'curriculum') return;
    if (agentReplyTimerRef.current) {
      window.clearTimeout(agentReplyTimerRef.current);
      agentReplyTimerRef.current = 0;
    }
    setAgentTyping(false);
  }, [pageMode, viewMode]);

  useEffect(() => {
    agentMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, agentTyping]);

  useEffect(() => {
    if (pageMode !== 'editor' || viewMode !== 'curriculum' || !currentGraph) return;
    setAgentInput('');
    setAgentTyping(false);
    setAgentMessages([{ role: 'assistant', content: agentWelcomeMessage }]);
  }, [currentGraph?.id, pageMode, viewMode]);

  const handleAgentSend = useCallback(() => {
    const text = String(agentInput || '').trim();
    if (!text) return;

    const userMessage = { role: 'user', content: text };
    setAgentMessages((prev) => [...prev, userMessage]);
    setAgentInput('');
    setAgentTyping(true);

    if (agentReplyTimerRef.current) {
      window.clearTimeout(agentReplyTimerRef.current);
    }

    agentReplyTimerRef.current = window.setTimeout(() => {
      const reply = buildKnowledgeGraphAgentReply(text, agentReplyContext);
      setAgentMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setAgentTyping(false);
      agentReplyTimerRef.current = 0;
    }, 720);
  }, [agentInput, agentReplyContext]);

  const handleAgentResizeStart = useCallback((event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = agentWidth;

    const handleMove = (moveEvent) => {
      const nextWidth = clampNumber(startWidth + (startX - moveEvent.clientX), 320, 520);
      setAgentWidth(nextWidth);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [agentWidth]);

  const inspectorTitle = selection?.type === 'stage'
    ? '分区属性'
    : selection?.type === 'point'
      ? '知识点属性'
      : selection?.type === 'stage-edge'
        ? '分区连线'
        : selection?.type === 'relation'
          ? '关系属性'
          : '图谱属性';
  const inspectorDrawerOffset = viewMode === 'curriculum'
    ? (agentCollapsed ? 64 : agentWidth + 28)
    : undefined;
  const showInspectorToggle = viewMode === 'curriculum'
    && !inspectorOpen
    && selection?.type
    && selection.type !== 'graph';

  const inspectorContent = (
    <div className="kg-inspector kg-inspector-drawer">
      {selection?.type === 'graph' && currentGraph ? (
        <div className="kg-inspector-block">
          <Form form={graphEditorForm} layout="vertical">
            <Form.Item
              label="图谱名称"
              name="name"
              rules={[{ required: true, message: '请输入图谱名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="图谱描述" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" block onClick={handleSaveGraphEditor}>保存图谱属性</Button>
          </Form>
          <div className="kg-inspector-meta">
            <div>最后更新：{formatDateTime(currentGraph.updatedAt)}</div>
            <div>来源：{currentGraph.sourceMode === 'AI_DRAFT_ACCEPTED' ? 'AI 草稿应用' : '人工维护'}</div>
          </div>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">结构化视图分布</div>
              <div className="kg-fill-list">
                {stageSummaries.map((stage) => (
                  <div key={stage.id} className="kg-fill-list-item">
                    <span className="kg-fill-color" style={{ background: stage.color }} />
                    <div className="kg-fill-list-copy">
                      <div className="kg-fill-list-name">{stage.name}</div>
                      <div className="kg-fill-list-meta">{stage.pointCount} 个知识点 · {stage.bindingCount} 条资料绑定</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">最近更新的知识点</div>
              <div className="kg-fill-list">
                {recentPoints.length ? recentPoints.map((point) => (
                  <div key={point.id} className="kg-fill-list-item">
                    <div className="kg-fill-list-copy">
                      <div className="kg-fill-list-name">{point.title}</div>
                      <div className="kg-fill-list-meta">{formatDateTime(point.updatedAt)} · {POINT_TYPE_LABEL_MAP[point.type] || point.type}</div>
                    </div>
                  </div>
                )) : (
                  <div className="kg-fill-empty">当前图谱还没有知识点。</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selection?.type === 'stage' && selectedStage ? (
        <div className="kg-inspector-block">
          <Form form={stageEditorForm} layout="vertical">
            <Form.Item
              label="分区名称"
              name="name"
              rules={[{ required: true, message: '请输入分区名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="分区描述" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="列数布局" name="layoutColumns">
              <Select
                options={[
                  { label: '1 列', value: 1 },
                  { label: '2 列', value: 2 },
                  { label: '3 列', value: 3 },
                ]}
              />
            </Form.Item>
            <Form.Item label="分区颜色" name="color">
              <input type="color" className="kg-color-input" />
            </Form.Item>
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSaveStageEditor}>保存分区</Button>
              <Popconfirm
                title="删除分区"
                description="分区中的知识点会自动迁移到首个分区。"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removeStructuredStage(selectedGraphId, selectedStage.id);
                  setInspectorOpen(false);
                  refreshAndMessage('分区已删除');
                }}
              >
                <Button danger disabled={structuredStages.length <= 1}>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">分区概览</div>
              <div className="kg-fill-feature-grid">
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">知识点数</span>
                  <strong>{(pointsByStage[selectedStage.id] || []).length}</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">资料绑定</span>
                  <strong>{(pointsByStage[selectedStage.id] || []).reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0)}</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">出边</span>
                  <strong>{structuredStageEdges.filter((edge) => edge.source === selectedStage.id).length}</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">入边</span>
                  <strong>{structuredStageEdges.filter((edge) => edge.target === selectedStage.id).length}</strong>
                </div>
              </div>
            </div>
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">分区内知识点</div>
              <div className="kg-fill-list">
                {(pointsByStage[selectedStage.id] || []).length ? (pointsByStage[selectedStage.id] || []).map((entry) => (
                  <div key={entry.point.id} className="kg-fill-list-item">
                    <div className="kg-fill-list-copy">
                      <div className="kg-fill-list-name">{entry.point.title}</div>
                      <div className="kg-fill-list-meta">{POINT_TYPE_LABEL_MAP[entry.point.type] || entry.point.type} · {entry.point.resourceBindings?.length || 0} 条资料</div>
                    </div>
                  </div>
                )) : (
                  <div className="kg-fill-empty">当前分区还没有知识点。</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selection?.type === 'point' && selectedPoint ? (
        <div className="kg-inspector-block">
          <Form form={pointEditorForm} layout="vertical">
            <Form.Item
              label="知识点名称"
              name="title"
              rules={[{ required: true, message: '请输入知识点名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="摘要" name="summary">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="类型" name="type">
              <Select options={KNOWLEDGE_POINT_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item label="标签（逗号分隔）" name="tags">
              <Input placeholder="例如：入门, 课程设计, 案例" />
            </Form.Item>
            <Form.Item label="节点颜色" name="color">
              <input type="color" className="kg-color-input" />
            </Form.Item>
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSavePointEditor}>保存知识点</Button>
              <Popconfirm
                title="删除知识点"
                description="会同时删除与该知识点相关的关系和卡片布局。"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removePoint(selectedGraphId, selectedPoint.id);
                  setInspectorOpen(false);
                  refreshAndMessage('知识点已删除');
                }}
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
          <div className="kg-inspector-divider" />
          <div className="kg-binding-header">
            <div>
              <div className="kg-binding-title">绑定资料</div>
              <div className="kg-binding-subtitle">从资料库绑定可追溯的原始资料</div>
            </div>
            <Button icon={<BookOutlined />} onClick={() => setResourceModalOpen(true)}>绑定资料</Button>
          </div>
          <div className="kg-binding-list">
            {selectedPoint.resourceBindings?.length ? selectedPoint.resourceBindings.map((binding) => (
              <div key={binding.bindingId} className="kg-binding-card">
                <div className="kg-binding-card-copy">
                  <div className="kg-binding-name">{binding.resourceName}</div>
                  <div className="kg-binding-path">{binding.snapshotPath}</div>
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} className="kg-binding-remove" onClick={() => {
                  removeResourceBinding(selectedGraphId, selectedPoint.id, binding.bindingId);
                  refreshAndMessage('绑定资料已移除');
                }} />
              </div>
            )) : (
              <div className="kg-binding-empty">当前知识点还没有绑定资料。</div>
            )}
          </div>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">所在位置</div>
              <div className="kg-fill-feature-grid">
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">结构化分区</span>
                  <strong>{selectedPointStage?.name || '未归类'}</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">关联关系</span>
                  <strong>{selectedPointRelations.length} 条</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">标签数</span>
                  <strong>{selectedPoint.tags?.length || 0}</strong>
                </div>
                <div className="kg-fill-feature">
                  <span className="kg-fill-feature-label">资料绑定</span>
                  <strong>{selectedPoint.resourceBindings?.length || 0}</strong>
                </div>
              </div>
            </div>
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">关联关系</div>
              <div className="kg-fill-list">
                {selectedPointRelations.length ? selectedPointRelations.map((relation) => {
                  const isSource = relation.sourceId === selectedPoint.id;
                  const targetPoint = pointMap[isSource ? relation.targetId : relation.sourceId];
                  return (
                    <div key={relation.id} className="kg-fill-list-item">
                      <div className="kg-fill-list-copy">
                        <div className="kg-fill-list-name">
                          {isSource ? '指向' : '来自'} {targetPoint?.title || '未知知识点'}
                        </div>
                        <div className="kg-fill-list-meta">{RELATION_TYPE_LABEL_MAP[relation.relationType] || relation.relationType} · {relation.label}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="kg-fill-empty">当前知识点还没有建立关系。</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selection?.type === 'stage-edge' && selectedStageEdge ? (
        <div className="kg-inspector-block">
          <Form form={stageEdgeEditorForm} layout="vertical">
            <Form.Item label="起始分区">
              <Input value={structuredStages.find((stage) => stage.id === selectedStageEdge.source)?.name || '未知分区'} disabled />
            </Form.Item>
            <Form.Item label="目标分区">
              <Input value={structuredStages.find((stage) => stage.id === selectedStageEdge.target)?.name || '未知分区'} disabled />
            </Form.Item>
            <Segmented
              block
              className="kg-inspector-segmented"
              value={stageEdgeInspectorTab}
              onChange={setStageEdgeInspectorTab}
              options={[
                { label: '基础', value: 'basic' },
                { label: '更多', value: 'more' },
              ]}
            />
            {stageEdgeInspectorTab === 'basic' ? (
              <div className="kg-inspector-tab-panel">
                <Form.Item label="关系类型" name="semanticType">
                  <Select
                    allowClear={!selectedStageEdge.semanticType}
                    placeholder={selectedStageEdge.semanticType ? undefined : '为历史连线选择关系类型后纳入规范'}
                    options={STAGE_EDGE_SEMANTIC_OPTIONS}
                  />
                </Form.Item>
                {!selectedStageEdge.semanticType ? (
                  <Alert
                    type="info"
                    showIcon
                    className="kg-stage-edge-legacy-alert"
                    message="当前为历史自定义连线"
                    description="它会保留现有箭头、方向和线型。选择关系类型并保存后，这条连线会按新的分区关系规范重绘。"
                  />
                ) : null}
                <Form.Item label="补充说明" name="label">
                  <Input placeholder="例如：建议先完成本分区，再进入下一分区" />
                </Form.Item>
                <div className="kg-stage-edge-preview-shell">
                  <div className="kg-stage-edge-preview-title">语义预览</div>
                  <StageEdgeSemanticPreview
                    edge={{
                      ...selectedStageEdge,
                      semanticType: stageEdgeEditorSemanticType || selectedStageEdge.semanticType,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="kg-inspector-tab-panel">
                <div className="kg-stage-edge-tab-hint">更多设置会覆盖当前连线的默认语义样式。</div>
                <Form.Item name="strokeColor" hidden><Input /></Form.Item>
                <Form.Item name="strokeWidth" hidden><InputNumber /></Form.Item>
                <Form.Item name="lineStyle" hidden><Input /></Form.Item>
                <Form.Item name="pathStyle" hidden><Input /></Form.Item>
                <Form.Item name="markerType" hidden><Input /></Form.Item>
                <Form.Item name="startMarker" hidden><Input /></Form.Item>
                <Form.Item name="opacity" hidden><InputNumber /></Form.Item>
                <EdgeStyleConfigurator form={stageEdgeEditorForm} />
              </div>
            )}
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSaveStageEdgeEditor}>保存连线</Button>
              <Popconfirm
                title="删除分区连线"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removeStructuredStageEdge(selectedGraphId, selectedStageEdge.id);
                  setInspectorOpen(false);
                  refreshAndMessage('分区连线已删除');
                }}
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
        </div>
      ) : null}

      {selection?.type === 'relation' && selectedRelation ? (
        <div className="kg-inspector-block">
          <Form form={relationEditorForm} layout="vertical">
            <Form.Item label="源知识点">
              <Select value={selectedRelation.sourceId} options={relationPointOptions} disabled />
            </Form.Item>
            <Form.Item label="目标知识点">
              <Select value={selectedRelation.targetId} options={relationPointOptions} disabled />
            </Form.Item>
            <Form.Item label="关系类型" name="relationType">
              <Select options={RELATION_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item label="关系标签" name="label">
              <Input />
            </Form.Item>
            <Form.Item label="关系强度" name="weight">
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="strokeColor" hidden><Input /></Form.Item>
            <Form.Item name="strokeWidth" hidden><InputNumber /></Form.Item>
            <Form.Item name="lineStyle" hidden><Input /></Form.Item>
            <Form.Item name="pathStyle" hidden><Input /></Form.Item>
            <Form.Item name="markerType" hidden><Input /></Form.Item>
            <Form.Item name="startMarker" hidden><Input /></Form.Item>
            <Form.Item name="opacity" hidden><InputNumber /></Form.Item>
            <EdgeStyleConfigurator form={relationEditorForm} />
            <Form.Item label="动态效果" name="animated" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSaveRelationEditor}>保存关系</Button>
              <Popconfirm
                title="删除关系"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removeRelation(selectedGraphId, selectedRelation.id);
                  setInspectorOpen(false);
                  refreshAndMessage('关系已删除');
                }}
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">关系两端</div>
              <div className="kg-fill-list">
                {[selectedRelation.sourceId, selectedRelation.targetId].map((pointId, index) => {
                  const point = pointMap[pointId];
                  return (
                    <div key={pointId} className="kg-fill-list-item">
                      <div className="kg-fill-list-copy">
                        <div className="kg-fill-list-name">{index === 0 ? '源知识点' : '目标知识点'} · {point?.title || '未知知识点'}</div>
                        <div className="kg-fill-list-meta">{point?.summary || '未填写知识点摘要'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">最近变更关系</div>
              <div className="kg-fill-list">
                {recentRelations.map((relation) => (
                    <div key={relation.id} className="kg-fill-list-item">
                      <div className="kg-fill-list-copy">
                        <div className="kg-fill-list-name">{pointMap[relation.sourceId]?.title || '未知'} → {pointMap[relation.targetId]?.title || '未知'}</div>
                      <div className="kg-fill-list-meta">{relation.label} · {relation.lineStyle || 'solid'} · {relation.strokeWidth || 1.8}px · {formatDateTime(relation.updatedAt)}</div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={`kg-module kg-module-page${embedded ? ' kg-module-embedded' : ''}`}>
      {!embedded && pageMode === 'list' ? (
        <main className="kg-list-page">
          <div className="kg-list-hero">
            <div>
              <div className="kg-list-title">知识图谱</div>
              <div className="kg-list-subtitle">图谱集列表、图谱入口与基础管理。</div>
            </div>
            <Space wrap>
              <Button type="primary" icon={<FolderAddOutlined />} onClick={() => openCollectionModal('create')}>
                新建图谱集
              </Button>
              <Button icon={<FileAddOutlined />} disabled={!selectedCollectionId} onClick={() => openGraphModal('create')}>
                新建图谱
              </Button>
            </Space>
          </div>
          <div className="kg-list-content">
            {collections.length ? collections.map((collection) => {
              const collectionGraphs = getGraphsByCollection(snapshot, collection.id);
              const isActiveCollection = collection.id === selectedCollectionId;
              return (
                <Card
                  key={collection.id}
                  size="small"
                  className={`kg-collection-card kg-collection-card-grid ${isActiveCollection ? 'is-active' : ''}`}
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <div className="kg-collection-head">
                    <div>
                      <div className="kg-collection-name">{collection.name}</div>
                      <div className="kg-collection-desc">{collection.description || '未填写图谱集说明'}</div>
                    </div>
                    <Space>
                      <Tooltip title="编辑图谱集">
                        <Button type="text" icon={<EditOutlined />} onClick={(event) => {
                          event.stopPropagation();
                          openCollectionModal('edit', collection);
                        }} />
                      </Tooltip>
                      <Popconfirm
                        title="删除图谱集"
                        description="会同时删除其下所有图谱、知识点和布局数据。"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                        onConfirm={(event) => {
                          event?.stopPropagation?.();
                          handleDeleteCollection(collection.id);
                        }}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={(event) => event.stopPropagation()} />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div className="kg-graph-actions">
                    <Tag color="blue">{collectionGraphs.length} 张图谱</Tag>
                    <Button
                      type="link"
                      size="small"
                      icon={<FileAddOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCollectionId(collection.id);
                        openGraphModal('create');
                      }}
                    >
                      新建图谱
                    </Button>
                  </div>
                  <div className="kg-graph-grid">
                    {collectionGraphs.length ? collectionGraphs.map((graph) => (
                          <div
                        key={graph.id}
                        className={`kg-graph-item kg-graph-item-grid ${graph.id === selectedGraphId ? 'is-selected' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openGraphWorkspace(graph.id, collection.id, 'curriculum');
                        }}
                      >
                        <div className="kg-graph-item-main">
                          <div className="kg-graph-item-name">{graph.name}</div>
                          <div className="kg-graph-item-meta">
                            {formatDateTime(graph.updatedAt)} · {graph.sourceMode === 'AI_DRAFT_ACCEPTED' ? 'AI 应用' : '人工维护'}
                          </div>
                          <div className="kg-graph-item-stats">
                            <span>{getPointsByGraph(snapshot, graph.id).length} 个知识点</span>
                            <span>{getRelationsByGraph(snapshot, graph.id).length} 条关系</span>
                          </div>
                        </div>
                        <Space size={4}>
                          <Tooltip title="预览视图">
                            <Button
                              type="text"
                              icon={<NodeIndexOutlined />}
                              onClick={(event) => {
                                event.stopPropagation();
                                openGraphWorkspace(graph.id, collection.id, 'graph');
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="复制图谱">
                            <Button
                              type="text"
                              icon={<ShareAltOutlined />}
                              onClick={(event) => {
                                event.stopPropagation();
                                duplicateGraph(graph.id);
                                refreshAndMessage('图谱已复制');
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="编辑图谱">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={(event) => {
                                event.stopPropagation();
                                openGraphModal('edit', graph);
                              }}
                            />
                          </Tooltip>
                          <Popconfirm
                            title="删除图谱"
                            description="该图谱下的知识点、关系和布局都会被删除。"
                            okText="删除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            onConfirm={(event) => {
                              event?.stopPropagation?.();
                              handleDeleteGraph(graph.id);
                            }}
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </Popconfirm>
                        </Space>
                      </div>
                    )) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前图谱集还没有图谱" />
                    )}
                  </div>
                </Card>
              );
            }) : (
              <div className="kg-empty-shell">
                <Empty description="还没有图谱集，先创建一个图谱集。" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <Button type="primary" icon={<FolderAddOutlined />} onClick={() => openCollectionModal('create')}>
                    新建图谱集
                  </Button>
                </Empty>
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="kg-workspace kg-editor-page">
          {!currentGraph ? (
            <div className="kg-empty-shell">
              <Empty
                description="还没有可编辑的图谱，先创建一个图谱集或图谱。"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Space>
                  <Button type="primary" icon={<FolderAddOutlined />} onClick={() => openCollectionModal('create')}>
                    新建图谱集
                  </Button>
                  <Button icon={<FileAddOutlined />} disabled={!selectedCollectionId} onClick={() => openGraphModal('create')}>
                    新建图谱
                  </Button>
                </Space>
              </Empty>
            </div>
          ) : (
            <>
              <div className="kg-toolbar">
                <div className="kg-toolbar-copy">
                  <div className="kg-toolbar-title-row">
                    {(embedded ? Boolean(onExitEmbedded) : showBackButton) ? (
                      <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="kg-toolbar-back"
                        onClick={returnToListPage}
                      />
                    ) : null}
                    <div className="kg-toolbar-title">{currentGraph.name}</div>
                  </div>
                  <div className="kg-toolbar-subtitle">
                    {currentGraph.description || (viewMode === 'graph'
                      ? '面向学员的知识图谱预览，可浏览知识点关系与学习路径。'
                      : '维护知识点、关系和资料绑定，并支持 AI 草稿生成。')}
                  </div>
                </div>
                <Space wrap>
                  {viewMode === 'graph' ? (
                    <Button type="primary" icon={<EditOutlined />} onClick={enterEditMode}>
                      编辑
                    </Button>
                  ) : null}
                  {viewMode === 'curriculum' ? (
                    <>
                      <Button type="primary" onClick={saveCurrentSelection}>
                        保存
                      </Button>
                      <Button icon={<ApartmentOutlined />} onClick={() => openSectionModal('create')}>
                        新增分区
                      </Button>
                      <Button icon={<SettingOutlined />} onClick={() => {
                        setSelection(defaultSelection(currentGraph.id));
                        setInspectorOpen(true);
                      }}
                      >
                        图谱属性
                      </Button>
                    </>
                  ) : null}
                </Space>
              </div>

              <div
                className={`kg-editor-layout${viewMode === 'curriculum' ? '' : ' is-preview'}`}
                style={viewMode === 'curriculum'
                  ? { gridTemplateColumns: agentCollapsed ? 'minmax(0, 1fr) 48px' : `minmax(0, 1fr) ${agentWidth}px` }
                  : undefined}
              >
                <div className="kg-editor-main">
                  {viewMode === 'curriculum' && currentDraft ? (
                    <Alert
                      type="warning"
                      showIcon
                      className="kg-draft-alert"
                      message="当前图谱存在一份待确认的 AI 草稿"
                      description="草稿尚未写入正式图谱，可先预览并决定替换或追加。"
                      action={<Button size="small" onClick={() => openDraftPreview(currentDraft)}>查看草稿</Button>}
                    />
                  ) : null}

                  <div className="kg-content kg-content-full">
                    <section className="kg-canvas-shell">
                      {viewMode === 'graph' ? (
                        <StructuredKnowledgeGraphView
                          graphId={selectedGraphId}
                          points={currentPoints}
                          relations={currentRelations}
                          structuredView={structuredView}
                          pointTypeLabelMap={POINT_TYPE_LABEL_MAP}
                          relationTypeLabelMap={RELATION_TYPE_LABEL_MAP}
                          selection={null}
                          onSelectionChange={() => {}}
                          readOnly
                        />
                      ) : (
                        <StructuredKnowledgeGraphView
                          graphId={selectedGraphId}
                          points={currentPoints}
                          relations={currentRelations}
                          structuredView={structuredView}
                          pointTypeLabelMap={POINT_TYPE_LABEL_MAP}
                          relationTypeLabelMap={RELATION_TYPE_LABEL_MAP}
                          selection={selection}
                          onSelectionChange={(nextSelection) => {
                            setSelection(nextSelection);
                            setInspectorOpen(nextSelection?.type && nextSelection.type !== 'graph');
                          }}
                          onCreateStage={() => openSectionModal('create')}
                          onCreatePoint={openPointModal}
                          onDeleteStage={(stageId) => {
                            removeStructuredStage(selectedGraphId, stageId);
                            setInspectorOpen(false);
                            refreshAndMessage('分区已删除');
                          }}
                          onDeletePoint={(pointId) => {
                            removePoint(selectedGraphId, pointId);
                            setInspectorOpen(false);
                            refreshAndMessage('知识点已删除');
                          }}
                          onUpdateStagePosition={(stageId, position) => updateStructuredStagePosition(selectedGraphId, stageId, position)}
                          onMovePoint={handleMoveStructuredPoint}
                          onCreateStageEdge={handleCreateStructuredStageEdge}
                          onReconnectStageEdge={handleReconnectStructuredStageEdge}
                          onCreatePointRelation={handleCreateStructuredRelation}
                          onBindResourcesToPoint={handleBindResourcesToPointDirect}
                        />
                      )}
                    </section>
                  </div>
                </div>

                {showInspectorToggle ? (
                  <button
                    type="button"
                    className="kg-inspector-collapsed"
                    style={agentCollapsed ? undefined : { right: `${agentWidth + 22}px` }}
                    onClick={() => setInspectorOpen(true)}
                  >
                    <MenuUnfoldOutlined className="kg-inspector-collapsed-icon" />
                    <span className="kg-inspector-collapsed-label">属性</span>
                  </button>
                ) : null}

                {viewMode === 'curriculum' ? (
                  agentCollapsed ? (
                    <div className="kg-agent-collapsed" onClick={() => setAgentCollapsed(false)}>
                      <MenuUnfoldOutlined className="kg-agent-collapsed-icon" />
                      <span className="kg-agent-collapsed-label">智能体</span>
                    </div>
                  ) : (
                    <>
                      <aside className="kg-agent-panel" style={{ width: agentWidth }}>
                        <div className="kg-agent-resize-handle" onMouseDown={handleAgentResizeStart} />
                        <div className="kg-agent-header">
                          <div className="kg-agent-header-main">
                            <RobotOutlined className="kg-agent-header-icon" />
                            <span>知识体系智能体</span>
                          </div>
                          <MenuFoldOutlined
                            className="kg-agent-collapse-icon"
                            title="折叠智能体"
                            onClick={() => setAgentCollapsed(true)}
                          />
                        </div>
                        <div className="kg-agent-messages">
                          {agentMessages.map((item, index) => (
                            <div key={`${item.role}-${index}`} className={`kg-agent-message kg-agent-message-${item.role}`}>
                              <div className="kg-agent-message-avatar">
                                {item.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />}
                              </div>
                              <div className="kg-agent-message-bubble">{item.content}</div>
                            </div>
                          ))}
                          {agentTyping ? (
                            <div className="kg-agent-typing">
                              <div className="kg-agent-typing-dot" />
                              <div className="kg-agent-typing-dot" />
                              <div className="kg-agent-typing-dot" />
                            </div>
                          ) : null}
                          <div ref={agentMessagesEndRef} />
                        </div>
                        <div className="kg-agent-input">
                          <Input.TextArea
                            value={agentInput}
                            onChange={(event) => setAgentInput(event.target.value)}
                            onPressEnter={(event) => {
                              if (!event.shiftKey) {
                                event.preventDefault();
                                handleAgentSend();
                              }
                            }}
                            placeholder="描述你的知识体系需求..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                          />
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            className="kg-agent-send"
                            disabled={!agentInput.trim()}
                            onClick={handleAgentSend}
                          >
                            发送
                          </Button>
                        </div>
                      </aside>
                    </>
                  )
                ) : null}
              </div>

              <Drawer
                title={inspectorTitle}
                open={inspectorOpen}
                onClose={() => setInspectorOpen(false)}
                width={336}
                destroyOnClose={false}
                className="kg-floating-drawer"
                rootStyle={viewMode === 'curriculum' ? { right: inspectorDrawerOffset } : undefined}
              >
                {inspectorContent}
              </Drawer>
            </>
          )}
        </main>
      )}

      <Modal
        title={collectionModalState.mode === 'edit' ? '编辑图谱集' : '新建图谱集'}
        open={collectionModalState.open}
        onCancel={() => setCollectionModalState({ open: false, mode: 'create', record: null })}
        onOk={handleCreateCollection}
        okText="保存"
        cancelText="取消"
      >
        <Form form={collectionForm} layout="vertical">
          <Form.Item label="图谱集名称" name="name" rules={[{ required: true, message: '请输入图谱集名称' }]}>
            <Input placeholder="例如：课程图谱、专题图谱、校本图谱" />
          </Form.Item>
          <Form.Item label="图谱集说明" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={graphModalState.mode === 'edit' ? '编辑图谱' : '新建图谱'}
        open={graphModalState.open}
        onCancel={() => setGraphModalState({ open: false, mode: 'create', record: null })}
        onOk={handleCreateGraph}
        okText="保存"
        cancelText="取消"
      >
        <Form form={graphForm} layout="vertical">
          <Form.Item label="所属图谱集" name="collectionId" rules={[{ required: true, message: '请选择图谱集' }]}>
            <Select options={collections.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="图谱名称" name="name" rules={[{ required: true, message: '请输入图谱名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="图谱描述" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建知识点"
        open={pointModalState.open}
        onCancel={() => setPointModalState({ open: false })}
        onOk={handleCreatePoint}
        okText="创建"
        cancelText="取消"
      >
        <Form form={pointForm} layout="vertical">
          <Form.Item label="知识点名称" name="title" rules={[{ required: true, message: '请输入知识点名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所属分区" name="stageId" rules={[{ required: true, message: '请选择所属分区' }]}>
            <Select options={structuredStages.map((stage) => ({ label: stage.name, value: stage.id }))} />
          </Form.Item>
          <Form.Item label="知识点摘要" name="summary">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="知识点类型" name="type">
            <Select options={KNOWLEDGE_POINT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="标签（逗号分隔）" name="tags">
            <Input placeholder="例如：概念, 应用, 练习" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={sectionModalState.mode === 'edit' ? '编辑分区' : '新建分区'}
        open={sectionModalState.open}
        onCancel={() => setSectionModalState({ open: false, mode: 'create', record: null })}
        onOk={handleSectionSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={sectionForm} layout="vertical">
          <Form.Item label="分区名称" name="title" rules={[{ required: true, message: '请输入分区名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="分区描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="分区颜色" name="color">
            <input type="color" className="kg-color-input" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择分区关系"
        open={!!pendingStageEdge}
        onCancel={handleCancelPendingStageEdge}
        footer={null}
        destroyOnClose
      >
        <div className="kg-stage-edge-semantic-modal-copy">
          {pendingStageEdge ? (
            <>
              <div className="kg-stage-edge-semantic-modal-title">
                {(structuredStages.find((stage) => stage.id === pendingStageEdge.source)?.name || '未知分区')}
                {' → '}
                {(structuredStages.find((stage) => stage.id === pendingStageEdge.target)?.name || '未知分区')}
              </div>
              <div className="kg-stage-edge-semantic-modal-subtitle">选择这条分区连线要表达的教学语义</div>
            </>
          ) : null}
        </div>
        <div className="kg-stage-edge-semantic-grid">
          {STAGE_EDGE_SEMANTIC_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className="kg-stage-edge-semantic-card"
              onClick={() => handleConfirmPendingStageEdge(item.value)}
            >
              <StageEdgeSemanticPreview edge={{ semanticType: item.value }} />
            </button>
          ))}
        </div>
      </Modal>

      <SpaceResourceImportModal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        onConfirm={handleBindResources}
        excludeFileTypes={['knowledgeGraph']}
      />

      <AIGenerateModal
        open={aiModalOpen}
        graph={currentGraph}
        onCancel={() => setAiModalOpen(false)}
        onGenerate={handleGenerateDraft}
      />

      <DraftPreviewModal
        open={draftPreviewOpen}
        draft={draftEditor}
        currentGraph={currentGraph}
        onCancel={() => setDraftPreviewOpen(false)}
        onApply={handleApplyDraft}
        onDismiss={handleDismissDraft}
        mergeMode={draftMergeMode}
        onMergeModeChange={setDraftMergeMode}
        setDraft={setDraftEditor}
      />
    </div>
  );
});

export default KnowledgeGraphModule;
