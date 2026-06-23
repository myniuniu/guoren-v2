import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Segmented, Tag, Tooltip, message } from 'antd';
import {
  ApartmentOutlined,
  BookOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getAllItemsAcrossLibraries, loadResourceLib } from '../resourceLib/resourceLibStore';

const STAGE_WIDTH = 332;
const STAGE_MIN_HEIGHT = 288;
const STAGE_HEADER_HEIGHT = 78;
const STAGE_PADDING_X = 18;
const STAGE_PADDING_BOTTOM = 18;
const POINT_WIDTH = STAGE_WIDTH - STAGE_PADDING_X * 2;
const POINT_HEIGHT = 128;
const POINT_GAP = 16;
const RESOURCE_DRAG_TYPE = 'application/x-kg-resource';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildStageHeight(pointCount, maxPointY = 0) {
  return Math.max(
    STAGE_MIN_HEIGHT,
    STAGE_HEADER_HEIGHT + STAGE_PADDING_BOTTOM + Math.max(1, pointCount) * (POINT_HEIGHT + POINT_GAP),
    maxPointY + POINT_HEIGHT + STAGE_PADDING_BOTTOM,
  );
}

function StageNode({ data, selected }) {
  const stop = (event) => event.stopPropagation();
  return (
    <div
      className={`kg-structured-stage ${selected ? 'is-selected' : ''}`}
      style={{
        '--kg-stage-accent': data.color || '#4667d6',
        height: data.height,
      }}
    >
      <Handle type="target" position={Position.Left} className="kg-structured-handle" />
      <div className="kg-structured-stage-head">
        <div className="kg-structured-stage-copy">
          <span className="kg-structured-stage-pill" />
          <div>
            <div className="kg-structured-stage-title">{data.label}</div>
            <div className="kg-structured-stage-description">{data.description || '用于承载一组知识点与阶段路径。'}</div>
          </div>
        </div>
        <div className="kg-structured-stage-actions nodrag nopan" onMouseDown={stop} onClick={stop}>
          <Tooltip title="新增知识点">
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => data.onCreatePoint?.(data.stageId)}
            />
          </Tooltip>
          <Tooltip title="删除阶段">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={data.disableDelete}
              onClick={() => data.onDeleteStage?.(data.stageId)}
            />
          </Tooltip>
        </div>
      </div>
      <div className="kg-structured-stage-meta">
        <span>{data.pointCount} 个知识点</span>
        <span>{data.bindingCount} 条资料绑定</span>
      </div>
      <div className="kg-structured-stage-body">
        {data.pointCount ? null : (
          <div className="kg-structured-stage-empty">
            可在这里拖入知识点，或从右上角新增知识点。
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="kg-structured-handle" />
    </div>
  );
}

function PointNode({ data, selected }) {
  const stop = (event) => event.stopPropagation();

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = event.dataTransfer.getData(RESOURCE_DRAG_TYPE);
    if (!payload) return;
    try {
      const resource = JSON.parse(payload);
      data.onResourceDrop?.(data.pointId, resource);
    } catch {
      // ignore malformed payload
    }
  };

  return (
    <div
      className={`kg-structured-point ${selected ? 'is-selected' : ''}`}
      style={{ '--kg-point-accent': data.color || '#4667d6' }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Handle type="target" position={Position.Left} className="kg-structured-point-handle" />
      <div className="kg-structured-point-head">
        <div className="kg-structured-point-title-wrap">
          <div className="kg-structured-point-title">{data.label}</div>
          <Tag color="blue">{data.typeLabel}</Tag>
        </div>
        <div className="kg-structured-point-actions nodrag nopan" onMouseDown={stop} onClick={stop}>
          <Tooltip title="删除知识点">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => data.onDeletePoint?.(data.pointId)}
            />
          </Tooltip>
        </div>
      </div>
      <div className="kg-structured-point-summary">{data.summary || '未填写知识点摘要。'}</div>
      <div className="kg-structured-point-footer">
        <span>{data.tagCount} 个标签</span>
        <span>{data.bindingCount} 条资料</span>
      </div>
      <div className="kg-structured-point-binding">
        {data.bindingCount ? (
          (data.bindingNames || []).slice(0, 2).map((name) => (
            <span key={name} className="kg-structured-point-binding-item">{name}</span>
          ))
        ) : (
          <span className="kg-structured-point-binding-empty">拖入资料到该知识点进行绑定</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="kg-structured-point-handle" />
    </div>
  );
}

const nodeTypes = {
  kgStage: StageNode,
  kgPoint: PointNode,
};

function StructuredKnowledgeGraphView({
  graphId,
  points,
  relations,
  structuredView,
  pointTypeLabelMap,
  relationTypeLabelMap,
  selection,
  onSelectionChange,
  onCreateStage,
  onCreatePoint,
  onDeleteStage,
  onDeletePoint,
  onUpdateStagePosition,
  onMovePoint,
  onCreateStageEdge,
  onCreatePointRelation,
  onBindResourcesToPoint,
}) {
  const [resourceData, setResourceData] = useState(() => loadResourceLib());
  const [resourceScope, setResourceScope] = useState('all');
  const [resourceKeyword, setResourceKeyword] = useState('');
  const [resourcePanelOpen, setResourcePanelOpen] = useState(true);
  const [rfInstance, setRfInstance] = useState(null);

  useEffect(() => {
    setResourceData(loadResourceLib());
  }, [graphId]);

  useEffect(() => {
    if (!rfInstance) return;
    const timer = window.setTimeout(() => {
      rfInstance.fitView({ padding: 0.16, duration: 280 });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [graphId, rfInstance]);

  const pointMap = useMemo(
    () => Object.fromEntries(points.map((point) => [point.id, point])),
    [points],
  );

  const stages = useMemo(
    () => [...(structuredView?.stages || [])].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0)),
    [structuredView?.stages],
  );

  const pointPlacements = structuredView?.pointPlacements || {};
  const pointPositions = structuredView?.pointPositions || {};
  const stagePositions = structuredView?.stagePositions || {};
  const stageEdges = structuredView?.stageEdges || [];

  const stagePointEntries = useMemo(() => {
    const grouped = {};
    stages.forEach((stage) => {
      grouped[stage.id] = [];
    });
    points.forEach((point) => {
      const placement = pointPlacements[point.id];
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
  }, [pointPlacements, points, stages]);

  const stageMetrics = useMemo(
    () => Object.fromEntries(stages.map((stage) => {
      const entries = stagePointEntries[stage.id] || [];
      const bindingCount = entries.reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0);
      const maxPointY = entries.reduce((maxY, entry) => {
        const position = pointPositions[entry.point.id];
        return Math.max(maxY, Number(position?.y || 0));
      }, STAGE_HEADER_HEIGHT);
      return [stage.id, {
        pointCount: entries.length,
        bindingCount,
        height: buildStageHeight(entries.length, maxPointY),
      }];
    })),
    [pointPositions, stagePointEntries, stages],
  );

  const stageIdSet = useMemo(() => new Set(stages.map((stage) => stage.id)), [stages]);
  const pointIdSet = useMemo(() => new Set(points.map((point) => point.id)), [points]);

  const resourceItems = useMemo(() => {
    const keyword = String(resourceKeyword || '').trim().toLowerCase();
    return getAllItemsAcrossLibraries(resourceData).filter((item) => {
      if (resourceScope !== 'all' && item.libraryScope !== resourceScope) return false;
      if (!keyword) return true;
      const haystack = `${item.name} ${item.libraryName} ${item.fileType}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [resourceData, resourceKeyword, resourceScope]);

  const nodes = useMemo(() => {
    const stageNodes = stages.map((stage, index) => {
      const position = stagePositions[stage.id] || { x: index * 380, y: 0 };
      const metric = stageMetrics[stage.id] || { pointCount: 0, bindingCount: 0, height: buildStageHeight(0) };
      return {
        id: stage.id,
        type: 'kgStage',
        position,
        draggable: true,
        selectable: true,
        connectable: true,
        data: {
          stageId: stage.id,
          label: stage.name,
          description: stage.description,
          color: stage.color,
          pointCount: metric.pointCount,
          bindingCount: metric.bindingCount,
          height: metric.height,
          disableDelete: stages.length <= 1,
          onDeleteStage,
          onCreatePoint,
        },
        selected: selection?.type === 'stage' && selection.id === stage.id,
        style: {
          width: STAGE_WIDTH,
          height: metric.height,
          border: 'none',
          background: 'transparent',
        },
      };
    });

    const pointNodes = points.map((point) => {
      const placement = pointPlacements[point.id];
      if (!placement?.stageId) return null;
      const stagePosition = stagePositions[placement.stageId] || { x: 0, y: 0 };
      const rawRelativePosition = pointPositions[point.id] || {
        x: STAGE_PADDING_X,
        y: STAGE_HEADER_HEIGHT + (Math.max(0, (placement.order || 1) - 1) * (POINT_HEIGHT + POINT_GAP)),
      };
      const relativePosition = {
        x: clamp(Number(rawRelativePosition.x || STAGE_PADDING_X), STAGE_PADDING_X, STAGE_WIDTH - POINT_WIDTH - STAGE_PADDING_X),
        y: Math.max(STAGE_HEADER_HEIGHT, Number(rawRelativePosition.y || STAGE_HEADER_HEIGHT)),
      };
      return {
        id: point.id,
        type: 'kgPoint',
        position: {
          x: stagePosition.x + relativePosition.x,
          y: stagePosition.y + relativePosition.y,
        },
        draggable: true,
        selectable: true,
        connectable: true,
        data: {
          pointId: point.id,
          label: point.title,
          summary: point.summary,
          color: point.meta?.color || '#4667d6',
          typeLabel: pointTypeLabelMap[point.type] || point.type,
          tagCount: point.tags?.length || 0,
          bindingCount: point.resourceBindings?.length || 0,
          bindingNames: (point.resourceBindings || []).map((binding) => binding.resourceName),
          onDeletePoint,
          onResourceDrop: onBindResourcesToPoint,
        },
        selected: selection?.type === 'point' && selection.id === point.id,
        style: {
          width: POINT_WIDTH,
          border: 'none',
          background: 'transparent',
        },
      };
    }).filter(Boolean);

    return [...stageNodes, ...pointNodes];
  }, [
    onBindResourcesToPoint,
    onCreatePoint,
    onDeletePoint,
    onDeleteStage,
    pointPlacements,
    pointPositions,
    pointTypeLabelMap,
    points,
    selection,
    stageMetrics,
    stagePositions,
    stages,
  ]);

  const edges = useMemo(() => {
    const stageFlowEdges = stageEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || '阶段衔接',
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2b64d8' },
      labelStyle: { fill: '#2b64d8', fontSize: 12, fontWeight: 600 },
      style: {
        stroke: selection?.type === 'stage-edge' && selection.id === edge.id ? '#1d4ed8' : '#60a5fa',
        strokeWidth: selection?.type === 'stage-edge' && selection.id === edge.id ? 2.8 : 2,
      },
      data: { edgeType: 'stage-edge' },
      animated: false,
    }));

    const relationEdges = relations.map((relation) => ({
      id: relation.id,
      source: relation.sourceId,
      target: relation.targetId,
      label: relation.label || relationTypeLabelMap[relation.relationType] || relation.relationType,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed' },
      labelStyle: { fill: '#6d28d9', fontSize: 12, fontWeight: 600 },
      style: {
        stroke: selection?.type === 'relation' && selection.id === relation.id ? '#5b21b6' : '#a78bfa',
        strokeWidth: selection?.type === 'relation' && selection.id === relation.id ? 2.6 : 1.8,
      },
      data: { edgeType: 'relation' },
      animated: relation.relationType === 'PRECEDES',
    }));

    return [...stageFlowEdges, ...relationEdges];
  }, [relationTypeLabelMap, relations, selection, stageEdges]);

  const handleConnect = ({ source, target }) => {
    if (!source || !target || source === target) return;
    if (stageIdSet.has(source) && stageIdSet.has(target)) {
      onCreateStageEdge?.({ source, target });
      return;
    }
    if (pointIdSet.has(source) && pointIdSet.has(target)) {
      onCreatePointRelation?.({
        sourceId: source,
        targetId: target,
        relationType: 'RELATED',
      });
      return;
    }
    message.warning('结构化视图中只允许阶段与阶段、知识点与知识点分别连线。');
  };

  const handleNodeDragStop = (_, node) => {
    if (stageIdSet.has(node.id)) {
      onUpdateStagePosition?.(node.id, node.position);
      return;
    }
    if (!pointIdSet.has(node.id)) return;
    const point = pointMap[node.id];
    const currentPlacement = pointPlacements[node.id];
    if (!point || !currentPlacement) return;

    const centerX = node.position.x + POINT_WIDTH / 2;
    const centerY = node.position.y + POINT_HEIGHT / 2;
    const targetStage = stages.find((stage) => {
      const stagePosition = stagePositions[stage.id] || { x: 0, y: 0 };
      const stageHeight = stageMetrics[stage.id]?.height || buildStageHeight(0);
      return (
        centerX >= stagePosition.x
        && centerX <= stagePosition.x + STAGE_WIDTH
        && centerY >= stagePosition.y
        && centerY <= stagePosition.y + stageHeight
      );
    }) || stages.find((stage) => stage.id === currentPlacement.stageId);

    if (!targetStage) return;

    const stagePosition = stagePositions[targetStage.id] || { x: 0, y: 0 };
    const stageHeight = stageMetrics[targetStage.id]?.height || buildStageHeight(0);
    const nextRelativePosition = {
      x: clamp(node.position.x - stagePosition.x, STAGE_PADDING_X, STAGE_WIDTH - POINT_WIDTH - STAGE_PADDING_X),
      y: clamp(
        node.position.y - stagePosition.y,
        STAGE_HEADER_HEIGHT,
        Math.max(STAGE_HEADER_HEIGHT, stageHeight - POINT_HEIGHT - STAGE_PADDING_BOTTOM),
      ),
    };

    const siblings = (stagePointEntries[targetStage.id] || [])
      .filter((entry) => entry.point.id !== point.id)
      .sort((left, right) => {
        const leftPos = pointPositions[left.point.id] || { y: left.placement.order * (POINT_HEIGHT + POINT_GAP) };
        const rightPos = pointPositions[right.point.id] || { y: right.placement.order * (POINT_HEIGHT + POINT_GAP) };
        return leftPos.y - rightPos.y;
      });

    const targetIndex = siblings.findIndex((entry) => {
      const position = pointPositions[entry.point.id] || { y: STAGE_HEADER_HEIGHT };
      return nextRelativePosition.y < position.y + POINT_HEIGHT / 2;
    });

    onMovePoint?.(
      node.id,
      targetStage.id,
      targetIndex === -1 ? siblings.length : targetIndex,
      nextRelativePosition,
    );
  };

  return (
    <div className="kg-structured-shell">
      <div className="kg-structured-toolbar">
        <div className="kg-structured-toolbar-copy">
          <div className="kg-structured-toolbar-title">结构化画布</div>
          <div className="kg-structured-toolbar-subtitle">阶段对应分区，知识点对应活动，可直接拖拽编排与连线。</div>
        </div>
        <div className="kg-structured-toolbar-actions">
          <Button icon={<ApartmentOutlined />} onClick={() => onCreateStage?.()}>新增阶段</Button>
          <Button icon={<PlusOutlined />} onClick={() => onCreatePoint?.(selection?.type === 'stage' ? selection.id : null)}>
            新增知识点
          </Button>
          <Button
            icon={<BookOutlined />}
            type={resourcePanelOpen ? 'primary' : 'default'}
            onClick={() => setResourcePanelOpen((prev) => !prev)}
          >
            {resourcePanelOpen ? '隐藏资料来源' : '显示资料来源'}
          </Button>
        </div>
      </div>

      <div className="kg-structured-main">
        <div className="kg-structured-canvas kg-structured-canvas-overlay">
          <aside className={`kg-resource-drawer kg-resource-drawer-floating ${resourcePanelOpen ? 'is-open' : 'is-collapsed'}`}>
            <div className="kg-resource-drawer-head">
              <div>
                <div className="kg-resource-drawer-title">{resourcePanelOpen ? '资料来源' : '资料'}</div>
                {resourcePanelOpen ? (
                  <div className="kg-resource-drawer-subtitle">可拖到知识点节点上直接绑定。</div>
                ) : null}
              </div>
              <FolderOpenOutlined className="kg-resource-drawer-icon" />
            </div>
            {resourcePanelOpen ? (
              <>
                <Segmented
                  block
                  size="small"
                  value={resourceScope}
                  onChange={setResourceScope}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '个人库', value: 'personal' },
                    { label: '组织库', value: 'organization' },
                  ]}
                />
                <Input.Search
                  allowClear
                  placeholder="搜索资料"
                  value={resourceKeyword}
                  onChange={(event) => setResourceKeyword(event.target.value)}
                />
                <div className="kg-resource-drawer-list">
                  {resourceItems.length ? resourceItems.map((item) => (
                    <div
                      key={item.key}
                      className="kg-resource-drawer-item"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(RESOURCE_DRAG_TYPE, JSON.stringify(item));
                        event.dataTransfer.effectAllowed = 'copy';
                      }}
                    >
                      <div className="kg-resource-drawer-item-name">{item.name}</div>
                      <div className="kg-resource-drawer-item-meta">{item.libraryName} · {item.fileType}</div>
                    </div>
                  )) : (
                    <div className="kg-resource-drawer-empty">当前筛选条件下没有可用资料。</div>
                  )}
                </div>
              </>
            ) : (
              <div className="kg-resource-drawer-collapsed-tip">已收起</div>
            )}
          </aside>

          {!stages.length ? (
            <div className="kg-empty-shell">
              <Empty description="当前图谱还没有阶段" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<ApartmentOutlined />} onClick={() => onCreateStage?.()}>
                  新增阶段
                </Button>
              </Empty>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable
              nodesConnectable
              onNodeClick={(_, node) => {
                onSelectionChange?.({
                  type: stageIdSet.has(node.id) ? 'stage' : 'point',
                  id: node.id,
                });
              }}
              onEdgeClick={(_, edge) => {
                onSelectionChange?.({
                  type: edge.data?.edgeType === 'stage-edge' ? 'stage-edge' : 'relation',
                  id: edge.id,
                });
              }}
              onPaneClick={() => onSelectionChange?.({ type: 'graph', id: graphId })}
              onConnect={handleConnect}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              onInit={setRfInstance}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d4dbe6" gap={20} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}

export default StructuredKnowledgeGraphView;
