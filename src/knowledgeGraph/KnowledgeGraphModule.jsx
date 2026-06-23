import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Space,
  Statistic,
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
  NodeIndexOutlined,
  PlusOutlined,
  RobotOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TableOutlined,
} from '@ant-design/icons';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { getAllItemsAcrossLibraries, loadResourceLib } from '../resourceLib/resourceLibStore';
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
  removeCollection,
  removeGraph,
  removePoint,
  removeRelation,
  removeResourceBinding,
  removeStructuredStage,
  removeStructuredStageEdge,
  updateCollection,
  updateGraph,
  updateGraphNodePosition,
  updatePoint,
  updateRelation,
  updateStructuredStage,
  updateStructuredStageEdge,
  updateStructuredStagePosition,
  moveStructuredPoint,
  generateGraphDraft,
} from './store';
import StructuredKnowledgeGraphView from './StructuredKnowledgeGraphView';
import './KnowledgeGraphModule.css';
const RELATION_TYPE_LABEL_MAP = Object.fromEntries(RELATION_TYPE_OPTIONS.map((item) => [item.value, item.label]));
const POINT_TYPE_LABEL_MAP = Object.fromEntries(KNOWLEDGE_POINT_TYPE_OPTIONS.map((item) => [item.value, item.label]));

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

function ResourceBindingModal({ open, onCancel, onConfirm, disabledKeys = [] }) {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    if (!open) return;
    setData(loadResourceLib());
    setKeyword('');
    setSelectedKeys([]);
  }, [open]);

  const items = useMemo(() => {
    const allItems = getAllItemsAcrossLibraries(data);
    const normalizedKeyword = normalizeSearchText(keyword);
    return allItems.filter((item) => {
      if (scope !== 'all' && item.libraryScope !== scope) return false;
      if (!normalizedKeyword) return true;
      const haystack = `${item.name} ${item.libraryName} ${item.fileType}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [data, keyword, scope]);

  const selectedRows = useMemo(() => {
    const keySet = new Set(selectedKeys);
    return items.filter((item) => keySet.has(item.key));
  }, [items, selectedKeys]);

  return (
    <Modal
      title="绑定资料库资料"
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm(selectedRows)}
      okText="绑定到知识点"
      cancelText="取消"
      width={860}
      okButtonProps={{ disabled: selectedRows.length === 0 }}
      destroyOnClose
    >
      <div className="kg-modal-toolbar">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { label: '全部资料', value: 'all' },
            { label: '个人库', value: 'personal' },
            { label: '组织库', value: 'organization' },
          ]}
        />
        <Input.Search
          allowClear
          placeholder="搜索资料名称、资料库"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="kg-modal-search"
        />
      </div>
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
            title: '资料库',
            dataIndex: 'libraryName',
            width: 140,
          },
          {
            title: '类型',
            dataIndex: 'fileType',
            width: 110,
            render: (value) => <Tag>{value}</Tag>,
          },
        ]}
        dataSource={items}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
        locale={{ emptyText: '资料库暂无可绑定资料' }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
          getCheckboxProps: (record) => ({
            disabled: disabledKeys.includes(record.key),
          }),
        }}
      />
    </Modal>
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

function KnowledgeGraphModule() {
  const [snapshot, setSnapshot] = useState(() => loadKnowledgeGraphStore());
  const [pageMode, setPageMode] = useState('list');
  const [selectedCollectionId, setSelectedCollectionId] = useState(() => getCollections(loadKnowledgeGraphStore())[0]?.id || null);
  const [selectedGraphId, setSelectedGraphId] = useState(() => {
    const initialState = loadKnowledgeGraphStore();
    const initialCollection = getCollections(initialState)[0];
    return initialCollection ? getGraphsByCollection(initialState, initialCollection.id)[0]?.id || null : null;
  });
  const [selection, setSelection] = useState(() => defaultSelection(selectedGraphId));
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [viewMode, setViewMode] = useState('graph');
  const [collectionModalState, setCollectionModalState] = useState({ open: false, mode: 'create', record: null });
  const [graphModalState, setGraphModalState] = useState({ open: false, mode: 'create', record: null });
  const [pointModalState, setPointModalState] = useState({ open: false });
  const [sectionModalState, setSectionModalState] = useState({ open: false, mode: 'create', record: null });
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [draftPreviewOpen, setDraftPreviewOpen] = useState(false);
  const [draftMergeMode, setDraftMergeMode] = useState('replace');
  const [draftEditor, setDraftEditor] = useState(null);
  const [collectionForm] = Form.useForm();
  const [graphForm] = Form.useForm();
  const [pointForm] = Form.useForm();
  const [sectionForm] = Form.useForm();
  const [graphEditorForm] = Form.useForm();
  const [pointEditorForm] = Form.useForm();
  const [stageEditorForm] = Form.useForm();
  const [relationEditorForm] = Form.useForm();
  const [stageEdgeEditorForm] = Form.useForm();

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
      setPageMode('list');
      return;
    }
    if (!graphs.some((item) => item.id === selectedGraphId)) {
      setSelectedGraphId(graphs[0].id);
      setSelection(defaultSelection(graphs[0].id));
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
    if (currentGraph?.viewModeDefault) {
      setViewMode(currentGraph.viewModeDefault);
    }
  }, [currentGraph?.id, currentGraph?.viewModeDefault]);

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
    if (selection && selection.type !== 'graph') {
      setInspectorOpen(true);
    }
  }, [pageMode, selectedGraphId, selection]);

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
        viewModeDefault: currentGraph.viewModeDefault,
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
      });
    }
  }, [selectedStage, selection, stageEditorForm]);

  useEffect(() => {
    if (selection?.type === 'relation' && selectedRelation) {
      relationEditorForm.setFieldsValue({
        label: selectedRelation.label,
        relationType: selectedRelation.relationType,
        weight: selectedRelation.weight,
      });
    }
  }, [relationEditorForm, selectedRelation, selection]);

  useEffect(() => {
    if (selection?.type === 'stage-edge' && selectedStageEdge) {
      stageEdgeEditorForm.setFieldsValue({
        label: selectedStageEdge.label,
      });
    }
  }, [selectedStageEdge, selection, stageEdgeEditorForm]);

  const relationPointOptions = useMemo(
    () => currentPoints.map((point) => ({ label: point.title, value: point.id })),
    [currentPoints],
  );
  const pointMap = useMemo(
    () => Object.fromEntries(currentPoints.map((point) => [point.id, point])),
    [currentPoints],
  );

  const graphStats = useMemo(() => ({
    pointCount: currentPoints.length,
    relationCount: currentRelations.length,
    bindingCount: currentPoints.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0),
  }), [currentPoints, currentRelations]);

  const graphNodes = useMemo(() => currentPoints.map((point, index) => ({
    id: point.id,
    position: currentLayout.graphView.positions?.[point.id] || { x: 80 + (index % 3) * 260, y: 80 + Math.floor(index / 3) * 160 },
    data: {
      label: (
        <div className="kg-flow-node">
          <div className="kg-flow-node-head">
            <span className="kg-flow-node-title">{point.title}</span>
            <span className="kg-flow-node-type">{POINT_TYPE_LABEL_MAP[point.type] || point.type}</span>
          </div>
          <div className="kg-flow-node-summary">{point.summary || '未填写知识点摘要'}</div>
          <div className="kg-flow-node-footer">
            <span>{point.tags?.length || 0} 个标签</span>
            <span>{point.resourceBindings?.length || 0} 条资料</span>
          </div>
        </div>
      ),
    },
    selected: selection?.type === 'point' && selection.id === point.id,
    style: {
      borderRadius: 18,
      border: selection?.type === 'point' && selection.id === point.id ? '2px solid #0f172a' : '1px solid rgba(15, 23, 42, 0.12)',
      background: point.meta?.color || '#4667d6',
      color: '#fff',
      width: 220,
      padding: 16,
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
    },
  })), [currentLayout.graphView.positions, currentPoints, selection]);

  const graphEdges = useMemo(() => currentRelations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    label: relation.label,
    type: 'smoothstep',
    animated: relation.relationType === 'PRECEDES',
    markerEnd: { type: 'arrowclosed', color: '#667085' },
    labelStyle: { fill: '#475467', fontSize: 12, fontWeight: 600 },
    style: {
      stroke: selection?.type === 'relation' && selection.id === relation.id ? '#0f172a' : '#64748b',
      strokeWidth: selection?.type === 'relation' && selection.id === relation.id ? 2.4 : 1.6,
    },
    selected: selection?.type === 'relation' && selection.id === relation.id,
  })), [currentRelations, selection]);

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

  const openGraphEditor = useCallback((graphId, collectionId = null) => {
    if (collectionId) setSelectedCollectionId(collectionId);
    setSelectedGraphId(graphId);
    setSelection(defaultSelection(graphId));
    setInspectorOpen(false);
    setPageMode('editor');
  }, []);

  const returnToListPage = useCallback(() => {
    setPageMode('list');
    setInspectorOpen(false);
    setSelection(defaultSelection(selectedGraphId));
  }, [selectedGraphId]);

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
        refreshAndMessage('阶段已更新');
      } else {
        createStructuredStage(selectedGraphId, values);
        refreshAndMessage('阶段已创建');
      }
      setSectionModalState({ open: false, mode: 'create', record: null });
    } catch {
      // validation handled by antd
    }
  };

  const handleDeleteCollection = (collectionId) => {
    removeCollection(collectionId);
    refreshAndMessage('图谱集已删除');
  };

  const handleDeleteGraph = (graphId) => {
    removeGraph(graphId);
    refreshAndMessage('图谱已删除');
  };

  const handleSaveGraphEditor = async () => {
    if (!currentGraph) return;
    try {
      const values = await graphEditorForm.validateFields();
      updateGraph(currentGraph.id, values);
      setViewMode(values.viewModeDefault);
      refreshAndMessage('图谱信息已保存');
    } catch {
      // validation handled by antd
    }
  };

  const handleSavePointEditor = async () => {
    if (!selectedPoint || !selectedGraphId) return;
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
    } catch {
      // validation handled by antd
    }
  };

  const handleSaveStageEditor = async () => {
    if (!selectedStage || !selectedGraphId) return;
    try {
      const values = await stageEditorForm.validateFields();
      updateStructuredStage(selectedGraphId, selectedStage.id, values);
      refreshAndMessage('阶段已保存');
    } catch {
      // validation handled by antd
    }
  };

  const handleSaveRelationEditor = async () => {
    if (!selectedRelation || !selectedGraphId) return;
    try {
      const values = await relationEditorForm.validateFields();
      updateRelation(selectedGraphId, selectedRelation.id, values);
      refreshAndMessage('关系已保存');
    } catch {
      // validation handled by antd
    }
  };

  const handleSaveStageEdgeEditor = async () => {
    if (!selectedStageEdge || !selectedGraphId) return;
    try {
      const values = await stageEdgeEditorForm.validateFields();
      updateStructuredStageEdge(selectedGraphId, selectedStageEdge.id, values);
      refreshAndMessage('阶段连线已保存');
    } catch {
      // validation handled by antd
    }
  };

  const handleBindResources = (resources) => {
    if (!selectedGraphId || !selectedPoint) return;
    bindResourcesToPoint(selectedGraphId, selectedPoint.id, resources);
    setResourceModalOpen(false);
    refreshAndMessage('资料已绑定到知识点');
  };

  const handleBindResourcesToPointDirect = (pointId, resource) => {
    if (!selectedGraphId || !pointId || !resource) return;
    bindResourcesToPoint(selectedGraphId, pointId, [resource]);
    setSelection({ type: 'point', id: pointId });
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

  const handleConnect = ({ source, target }) => {
    if (!selectedGraphId || !source || !target || source === target) return;
    createRelation(selectedGraphId, {
      sourceId: source,
      targetId: target,
      relationType: 'RELATED',
    });
    refreshAndMessage('关系已创建');
  };

  const handleCreateStructuredStageEdge = (payload) => {
    if (!selectedGraphId) return;
    createStructuredStageEdge(selectedGraphId, payload);
    refreshAndMessage('阶段连线已创建');
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

  const boundResourceKeys = useMemo(
    () => (selectedPoint?.resourceBindings || []).map((binding) => binding.resourceKey),
    [selectedPoint],
  );
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

  const inspectorTitle = selection?.type === 'stage'
    ? '阶段属性'
    : selection?.type === 'point'
      ? '知识点属性'
      : selection?.type === 'stage-edge'
        ? '阶段连线'
        : selection?.type === 'relation'
          ? '关系属性'
          : '图谱属性';

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
            <Form.Item label="默认视图" name="viewModeDefault">
              <Select
                options={[
                  { label: 'Neo4j 视图', value: 'graph' },
                  { label: '结构化视图', value: 'curriculum' },
                ]}
              />
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
              label="阶段名称"
              name="name"
              rules={[{ required: true, message: '请输入阶段名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="阶段描述" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="阶段颜色" name="color">
              <input type="color" className="kg-color-input" />
            </Form.Item>
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSaveStageEditor}>保存阶段</Button>
              <Popconfirm
                title="删除阶段"
                description="阶段中的知识点会自动迁移到首个阶段。"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removeStructuredStage(selectedGraphId, selectedStage.id);
                  setInspectorOpen(false);
                  refreshAndMessage('阶段已删除');
                }}
              >
                <Button danger disabled={structuredStages.length <= 1}>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">阶段概览</div>
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
              <div className="kg-fill-panel-title">阶段内知识点</div>
              <div className="kg-fill-list">
                {(pointsByStage[selectedStage.id] || []).length ? (pointsByStage[selectedStage.id] || []).map((entry) => (
                  <div key={entry.point.id} className="kg-fill-list-item">
                    <div className="kg-fill-list-copy">
                      <div className="kg-fill-list-name">{entry.point.title}</div>
                      <div className="kg-fill-list-meta">{POINT_TYPE_LABEL_MAP[entry.point.type] || entry.point.type} · {entry.point.resourceBindings?.length || 0} 条资料</div>
                    </div>
                  </div>
                )) : (
                  <div className="kg-fill-empty">当前阶段还没有知识点。</div>
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
              <Card
                key={binding.bindingId}
                size="small"
                className="kg-binding-card"
                extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
                  removeResourceBinding(selectedGraphId, selectedPoint.id, binding.bindingId);
                  refreshAndMessage('绑定资料已移除');
                }} />}
              >
                <div className="kg-binding-name">{binding.resourceName}</div>
                <div className="kg-binding-meta">{binding.libraryName} · {binding.fileType}</div>
                <div className="kg-binding-path">{binding.snapshotPath}</div>
              </Card>
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
                  <span className="kg-fill-feature-label">结构化阶段</span>
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
            <Form.Item label="起始阶段">
              <Input value={structuredStages.find((stage) => stage.id === selectedStageEdge.source)?.name || '未知阶段'} disabled />
            </Form.Item>
            <Form.Item label="目标阶段">
              <Input value={structuredStages.find((stage) => stage.id === selectedStageEdge.target)?.name || '未知阶段'} disabled />
            </Form.Item>
            <Form.Item label="连线标签" name="label">
              <Input placeholder="例如：下一阶段、依次推进、学习路径" />
            </Form.Item>
            <Space className="kg-inspector-actions">
              <Button type="primary" onClick={handleSaveStageEdgeEditor}>保存连线</Button>
              <Popconfirm
                title="删除阶段连线"
                okText="删除"
                cancelText="取消"
                onConfirm={() => {
                  removeStructuredStageEdge(selectedGraphId, selectedStageEdge.id);
                  setInspectorOpen(false);
                  refreshAndMessage('阶段连线已删除');
                }}
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </Form>
          <div className="kg-inspector-divider" />
          <div className="kg-inspector-fill">
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">连线说明</div>
              <div className="kg-fill-list">
                <div className="kg-fill-list-item">
                  <div className="kg-fill-list-copy">
                    <div className="kg-fill-list-name">
                      {structuredStages.find((stage) => stage.id === selectedStageEdge.source)?.name || '未知阶段'}
                      {' → '}
                      {structuredStages.find((stage) => stage.id === selectedStageEdge.target)?.name || '未知阶段'}
                    </div>
                    <div className="kg-fill-list-meta">
                      {selectedStageEdge.label || '未填写标签'} · 最近更新 {formatDateTime(selectedStageEdge.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="kg-fill-panel">
              <div className="kg-fill-panel-title">最近阶段连线</div>
              <div className="kg-fill-list">
                {[...structuredStageEdges]
                  .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
                  .slice(0, 6)
                  .map((edge) => (
                    <div key={edge.id} className="kg-fill-list-item">
                      <div className="kg-fill-list-copy">
                        <div className="kg-fill-list-name">
                          {structuredStages.find((stage) => stage.id === edge.source)?.name || '未知'}
                          {' → '}
                          {structuredStages.find((stage) => stage.id === edge.target)?.name || '未知'}
                        </div>
                        <div className="kg-fill-list-meta">{edge.label || '未填写标签'} · {formatDateTime(edge.updatedAt)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
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
                      <div className="kg-fill-list-meta">{relation.label} · {formatDateTime(relation.updatedAt)}</div>
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
    <div className="kg-module kg-module-page">
      {pageMode === 'list' ? (
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
                          openGraphEditor(graph.id, collection.id);
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
                  <div className="kg-toolbar-breadcrumb">
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={returnToListPage}>返回列表</Button>
                  </div>
                  <div className="kg-toolbar-title">{currentGraph.name}</div>
                  <div className="kg-toolbar-subtitle">{currentGraph.description || '维护知识点、关系和资料绑定，并支持 AI 草稿生成。'}</div>
                </div>
                <Space wrap>
                  <Segmented
                    value={viewMode}
                    onChange={(value) => {
                      setViewMode(value);
                      updateGraph(currentGraph.id, { viewModeDefault: value });
                      setSnapshot(loadKnowledgeGraphStore());
                    }}
                    options={[
                      { label: 'Neo4j 视图', value: 'graph', icon: <NodeIndexOutlined /> },
                      { label: '结构化视图', value: 'curriculum', icon: <TableOutlined /> },
                    ]}
                  />
                  <Button icon={<SettingOutlined />} onClick={() => {
                    setSelection(defaultSelection(currentGraph.id));
                    setInspectorOpen(true);
                  }}
                  >
                    图谱属性
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={openPointModal}>新建知识点</Button>
                  {viewMode === 'curriculum' ? (
                    <Button icon={<ApartmentOutlined />} onClick={() => openSectionModal('create')}>新增阶段</Button>
                  ) : null}
                  <Button type="primary" icon={<RobotOutlined />} onClick={() => setAiModalOpen(true)}>
                    AI 生成图谱
                  </Button>
                </Space>
              </div>

              {currentDraft ? (
                <Alert
                  type="warning"
                  showIcon
                  className="kg-draft-alert"
                  message="当前图谱存在一份待确认的 AI 草稿"
                  description="草稿尚未写入正式图谱，可先预览并决定替换或追加。"
                  action={<Button size="small" onClick={() => openDraftPreview(currentDraft)}>查看草稿</Button>}
                />
              ) : null}

              <div className="kg-stats-row">
                <Card size="small"><Statistic title="知识点" value={graphStats.pointCount} /></Card>
                <Card size="small"><Statistic title="关系" value={graphStats.relationCount} /></Card>
                <Card size="small"><Statistic title="资料绑定" value={graphStats.bindingCount} /></Card>
              </div>

              <div className="kg-content kg-content-full">
                <section className="kg-canvas-shell">
                  {viewMode === 'graph' ? (
                    <div className="kg-graph-canvas">
                      {currentPoints.length === 0 ? (
                        <div className="kg-empty-shell">
                          <Empty description="当前图谱还没有知识点" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                            <Space>
                              <Button type="primary" icon={<PlusOutlined />} onClick={openPointModal}>新建知识点</Button>
                              <Button icon={<RobotOutlined />} onClick={() => setAiModalOpen(true)}>AI 生成草稿</Button>
                            </Space>
                          </Empty>
                        </div>
                      ) : (
                        <ReactFlow
                          nodes={graphNodes}
                          edges={graphEdges}
                          fitView
                          nodesDraggable
                          nodesConnectable
                          onNodeClick={(_, node) => {
                            setSelection({ type: 'point', id: node.id });
                            setInspectorOpen(true);
                          }}
                          onEdgeClick={(_, edge) => {
                            setSelection({ type: 'relation', id: edge.id });
                            setInspectorOpen(true);
                          }}
                          onPaneClick={() => {
                            setSelection(defaultSelection(selectedGraphId));
                            setInspectorOpen(false);
                          }}
                          onConnect={handleConnect}
                          onNodeDragStop={(_, node) => updateGraphNodePosition(selectedGraphId, node.id, node.position)}
                          proOptions={{ hideAttribution: true }}
                        >
                          <Background color="#d0d5dd" gap={20} />
                          <Controls />
                          <MiniMap pannable zoomable />
                        </ReactFlow>
                      )}
                    </div>
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
                        refreshAndMessage('阶段已删除');
                      }}
                      onDeletePoint={(pointId) => {
                        removePoint(selectedGraphId, pointId);
                        setInspectorOpen(false);
                        refreshAndMessage('知识点已删除');
                      }}
                      onUpdateStagePosition={(stageId, position) => updateStructuredStagePosition(selectedGraphId, stageId, position)}
                      onMovePoint={handleMoveStructuredPoint}
                      onCreateStageEdge={handleCreateStructuredStageEdge}
                      onCreatePointRelation={handleCreateStructuredRelation}
                      onBindResourcesToPoint={handleBindResourcesToPointDirect}
                    />
                  )}
                </section>
              </div>

              <Drawer
                title={inspectorTitle}
                open={inspectorOpen}
                onClose={() => setInspectorOpen(false)}
                width={380}
                destroyOnClose={false}
                className="kg-floating-drawer"
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
          <Form.Item label="所属阶段" name="stageId" rules={[{ required: true, message: '请选择所属阶段' }]}>
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
        title={sectionModalState.mode === 'edit' ? '编辑阶段' : '新建阶段'}
        open={sectionModalState.open}
        onCancel={() => setSectionModalState({ open: false, mode: 'create', record: null })}
        onOk={handleSectionSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={sectionForm} layout="vertical">
          <Form.Item label="阶段名称" name="title" rules={[{ required: true, message: '请输入阶段名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="阶段描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="阶段颜色" name="color">
            <input type="color" className="kg-color-input" />
          </Form.Item>
        </Form>
      </Modal>

      <ResourceBindingModal
        open={resourceModalOpen}
        onCancel={() => setResourceModalOpen(false)}
        onConfirm={handleBindResources}
        disabledKeys={boundResourceKeys}
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
}

export default KnowledgeGraphModule;
