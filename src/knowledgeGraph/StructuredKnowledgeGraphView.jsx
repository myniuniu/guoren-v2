import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Modal, Tag, Tooltip, message } from 'antd';
import {
  ApartmentOutlined,
  DownOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SoundOutlined,
  UpOutlined,
} from '@ant-design/icons';
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  reconnectEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SpaceResourceImportBrowser } from '../resourceLib/SpaceResourceImportModal.jsx';

const STAGE_WIDTH = 332;
const STAGE_MIN_HEIGHT = 288;
const STAGE_HEADER_HEIGHT = 78;
const STAGE_PADDING_X = 18;
const STAGE_PADDING_BOTTOM = 18;
const POINT_MIN_WIDTH = 280;
const POINT_HEIGHT = 196;
const POINT_GAP = 16;
const RESOURCE_DRAG_TYPE = 'application/x-kg-resource';
const NAME_ONLY_COLUMN_KEYS = Object.freeze([]);
const DEFAULT_RESOURCE_PANEL_FRAME = Object.freeze({
  width: 460,
  height: 860,
});
const DEFAULT_RESOURCE_PANEL_POSITION = Object.freeze({
  left: 16,
  top: 40,
});
const MIN_RESOURCE_PANEL_FRAME = Object.freeze({
  width: 380,
  height: 360,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampResourcePanelFrame(frame, hostNode) {
  const hostWidth = Math.max(0, hostNode?.clientWidth || 0);
  const hostHeight = Math.max(0, hostNode?.clientHeight || 0);
  const maxWidth = Math.max(320, hostWidth - 32);
  const maxHeight = Math.max(280, hostHeight - 56);
  const minWidth = Math.min(MIN_RESOURCE_PANEL_FRAME.width, maxWidth);
  const minHeight = Math.min(MIN_RESOURCE_PANEL_FRAME.height, maxHeight);

  return {
    width: clamp(Math.round(frame?.width || DEFAULT_RESOURCE_PANEL_FRAME.width), minWidth, maxWidth),
    height: clamp(Math.round(frame?.height || DEFAULT_RESOURCE_PANEL_FRAME.height), minHeight, maxHeight),
  };
}

function clampResourcePanelPosition(position, frame, hostNode) {
  const hostWidth = Math.max(0, hostNode?.clientWidth || 0);
  const hostHeight = Math.max(0, hostNode?.clientHeight || 0);
  const minLeft = DEFAULT_RESOURCE_PANEL_POSITION.left;
  const minTop = DEFAULT_RESOURCE_PANEL_POSITION.top;
  const maxLeft = Math.max(minLeft, hostWidth - frame.width - 16);
  const maxTop = Math.max(minTop, hostHeight - frame.height - 16);

  return {
    left: clamp(Math.round(position?.left ?? minLeft), minLeft, maxLeft),
    top: clamp(Math.round(position?.top ?? minTop), minTop, maxTop),
  };
}

function getDefaultResourcePanelPosition(hostNode, frame) {
  const hostHeight = Math.max(0, hostNode?.clientHeight || 0);
  const freeVerticalSpace = Math.max(0, hostHeight - frame.height);
  const preferredTop = DEFAULT_RESOURCE_PANEL_POSITION.top + freeVerticalSpace * 0.28;
  return clampResourcePanelPosition({
    left: DEFAULT_RESOURCE_PANEL_POSITION.left,
    top: preferredTop,
  }, frame, hostNode);
}

function buildStageHeight(pointCount) {
  return Math.max(
    STAGE_MIN_HEIGHT,
    STAGE_HEADER_HEIGHT + STAGE_PADDING_BOTTOM + Math.max(1, pointCount) * (POINT_HEIGHT + POINT_GAP),
  );
}

function getStageGridMetrics(layoutColumns = 1, pointCount = 0) {
  const columns = clamp(Number(layoutColumns || 1) || 1, 1, 3);
  const width = Math.max(
    STAGE_WIDTH,
    STAGE_PADDING_X * 2 + columns * POINT_MIN_WIDTH + Math.max(0, columns - 1) * POINT_GAP,
  );
  const innerWidth = Math.max(POINT_MIN_WIDTH, width - STAGE_PADDING_X * 2);
  const cardWidth = (innerWidth - (columns - 1) * POINT_GAP) / columns;
  const rows = Math.max(1, Math.ceil(Math.max(1, pointCount) / columns));
  const height = Math.max(
    STAGE_MIN_HEIGHT,
    STAGE_HEADER_HEIGHT + STAGE_PADDING_BOTTOM + rows * POINT_HEIGHT + Math.max(0, rows - 1) * POINT_GAP,
  );
  return {
    width,
    innerWidth,
    columns,
    rows,
    cardWidth,
    height,
  };
}

function buildPreviewPlacements(pointPlacements, preview) {
  if (!preview?.pointId || !preview?.stageId) return pointPlacements;
  const currentPlacement = pointPlacements[preview.pointId];
  if (!currentPlacement) return pointPlacements;

  const nextPlacements = { ...pointPlacements };
  const sourceStageId = currentPlacement.stageId;
  const targetStageId = preview.stageId;
  const targetEntries = Object.values(pointPlacements)
    .filter((placement) => placement.stageId === targetStageId && placement.pointId !== preview.pointId)
    .sort((left, right) => (left.order || 0) - (right.order || 0));
  const targetIndex = Math.max(0, Math.min(Number(preview.targetIndex ?? targetEntries.length), targetEntries.length));

  targetEntries.splice(targetIndex, 0, {
    ...currentPlacement,
    stageId: targetStageId,
  });

  targetEntries.forEach((placement, index) => {
    nextPlacements[placement.pointId] = {
      ...placement,
      stageId: targetStageId,
      order: index + 1,
    };
  });

  if (sourceStageId !== targetStageId) {
    const sourceEntries = Object.values(pointPlacements)
      .filter((placement) => placement.stageId === sourceStageId && placement.pointId !== preview.pointId)
      .sort((left, right) => (left.order || 0) - (right.order || 0));

    sourceEntries.forEach((placement, index) => {
      nextPlacements[placement.pointId] = {
        ...placement,
        stageId: sourceStageId,
        order: index + 1,
      };
    });
  }

  return nextPlacements;
}

function isSamePosition(left, right) {
  return Number(left?.x || 0) === Number(right?.x || 0) && Number(left?.y || 0) === Number(right?.y || 0);
}

function isSameStyle(left, right) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {});
}

function isSameArray(left = [], right = []) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function isSameNodeData(left, right, type) {
  if (!left || !right) return left === right;
  if (type === 'kgStage') {
    return (
      left.stageId === right.stageId
      && left.label === right.label
      && left.description === right.description
      && left.color === right.color
      && left.readOnly === right.readOnly
      && left.pointCount === right.pointCount
      && left.bindingCount === right.bindingCount
      && left.height === right.height
      && left.width === right.width
      && left.disableDelete === right.disableDelete
    );
  }

  if (type === 'kgPoint') {
    return (
      left.pointId === right.pointId
      && left.label === right.label
      && left.summary === right.summary
      && left.color === right.color
      && left.typeLabel === right.typeLabel
      && left.readOnly === right.readOnly
      && left.tagCount === right.tagCount
      && left.bindingCount === right.bindingCount
      && left.canMoveUp === right.canMoveUp
      && left.canMoveDown === right.canMoveDown
      && isSameArray(left.bindingNames || [], right.bindingNames || [])
    );
  }

  return false;
}

function reconcileFlowNodes(previousNodes = [], nextNodes = []) {
  const previousMap = new Map(previousNodes.map((node) => [node.id, node]));
  return nextNodes.map((node) => {
    const previous = previousMap.get(node.id);
    if (!previous) return node;
    const isEquivalent = (
      previous.id === node.id
      && previous.type === node.type
      && previous.selected === node.selected
      && previous.draggable === node.draggable
      && previous.selectable === node.selectable
      && previous.connectable === node.connectable
      && isSamePosition(previous.position, node.position)
      && isSameStyle(previous.style, node.style)
      && isSameNodeData(previous.data, node.data, node.type)
    );
    return isEquivalent ? previous : node;
  });
}

function reconcileFlowEdges(previousEdges = [], nextEdges = []) {
  const previousMap = new Map(previousEdges.map((edge) => [edge.id, edge]));
  return nextEdges.map((edge) => {
    const previous = previousMap.get(edge.id);
    if (!previous) return edge;
    const isEquivalent = (
      previous.id === edge.id
      && previous.source === edge.source
      && previous.target === edge.target
      && previous.label === edge.label
      && previous.type === edge.type
      && previous.animated === edge.animated
      && JSON.stringify(previous.style || {}) === JSON.stringify(edge.style || {})
      && JSON.stringify(previous.markerEnd || {}) === JSON.stringify(edge.markerEnd || {})
      && JSON.stringify(previous.labelStyle || {}) === JSON.stringify(edge.labelStyle || {})
    );
    return isEquivalent ? previous : edge;
  });
}

function renderBindingPreviewContent(binding) {
  if (!binding) return null;
  const fileType = binding.fileType || 'other';
  const previewUrl = binding.snapshotUrl || '';

  if (fileType === 'image') {
    return previewUrl
      ? <img src={previewUrl} alt={binding.resourceName} className="kg-binding-preview-image" />
      : <div className="kg-binding-preview-placeholder"><FileImageOutlined style={{ fontSize: 72 }} /><div>图片资料暂无预览</div></div>;
  }

  if (fileType === 'pdf') {
    return previewUrl
      ? <iframe src={previewUrl} title="PDF 预览" className="kg-binding-preview-iframe" />
      : <div className="kg-binding-preview-placeholder"><FilePdfOutlined style={{ fontSize: 72 }} /><div>PDF 资料暂无预览</div></div>;
  }

  if (fileType === 'video') {
    return previewUrl
      ? <video src={previewUrl} controls className="kg-binding-preview-video" />
      : <div className="kg-binding-preview-placeholder"><PlayCircleOutlined style={{ fontSize: 72 }} /><div>视频资料暂无预览</div></div>;
  }

  if (fileType === 'audio') {
    return (
      <div className="kg-binding-preview-placeholder">
        <SoundOutlined style={{ fontSize: 72 }} />
        <div>{binding.resourceName}</div>
        {previewUrl ? <audio src={previewUrl} controls className="kg-binding-preview-audio" /> : <div>音频资料暂无预览</div>}
      </div>
    );
  }

  if (fileType === 'pptx') {
    return <div className="kg-binding-preview-placeholder"><FilePptOutlined style={{ fontSize: 72 }} /><div>{binding.resourceName}</div><div>演示文稿预览</div></div>;
  }

  if (fileType === 'xlsx') {
    return <div className="kg-binding-preview-placeholder"><FileExcelOutlined style={{ fontSize: 72 }} /><div>{binding.resourceName}</div><div>表格资料预览</div></div>;
  }

  return <div className="kg-binding-preview-placeholder"><FileTextOutlined style={{ fontSize: 72 }} /><div>{binding.resourceName}</div><div>文档资料预览</div></div>;
}

function getEdgeDashArray(lineStyle) {
  if (lineStyle === 'dashed') return '8 6';
  if (lineStyle === 'dotted') return '2 6';
  return undefined;
}

function getEdgeMarker(markerType, color) {
  if (markerType === 'arrow') {
    return { type: MarkerType.Arrow, color };
  }
  if (markerType === 'arrowclosed') {
    return { type: MarkerType.ArrowClosed, color };
  }
  return undefined;
}

const STAGE_HANDLE_CONFIGS = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
];

function StageNode({ data, selected }) {
  const stop = (event) => {
    event.stopPropagation();
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event.nativeEvent?.stopImmediatePropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };
  const handleClassName = `kg-structured-handle${data.readOnly ? ' is-hidden' : ''}`;
  return (
    <div
      className={`kg-structured-stage ${selected ? 'is-selected' : ''}`}
      style={{
        '--kg-stage-accent': data.color || '#4667d6',
        height: data.height,
      }}
    >
      {STAGE_HANDLE_CONFIGS.map((item) => (
        <Handle
          key={`target-${item.key}`}
          id={`stage-target-${item.key}`}
          type="target"
          position={item.position}
          className={`${handleClassName} is-${item.key} is-target`}
        />
      ))}
      {STAGE_HANDLE_CONFIGS.map((item) => (
        <Handle
          key={`source-${item.key}`}
          id={`stage-source-${item.key}`}
          type="source"
          position={item.position}
          className={`${handleClassName} is-${item.key} is-source`}
        />
      ))}
      <div className="kg-structured-stage-head">
        <div className="kg-structured-stage-copy">
          <span className="kg-structured-stage-pill" />
          <div>
            <div className="kg-structured-stage-title">{data.label}</div>
            <div className="kg-structured-stage-description">{data.description || '用于承载一组知识点与路径关系。'}</div>
          </div>
        </div>
        {data.readOnly ? null : (
          <div className="kg-structured-stage-actions nodrag nopan" onMouseDown={stop} onClick={stop}>
            <Tooltip title="新增知识点">
              <Button
                size="small"
                type="text"
                icon={<PlusOutlined />}
                onClick={() => data.onCreatePoint?.(data.stageId)}
              />
            </Tooltip>
            <Tooltip title="删除分区">
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
        )}
      </div>
      <div className="kg-structured-stage-meta">
        <span>{data.pointCount} 个知识点</span>
        <span>{data.bindingCount} 条资料绑定</span>
      </div>
      <div className="kg-structured-stage-body">
        {data.pointCount ? null : (
          <div className="kg-structured-stage-empty">
            {data.readOnly ? '当前分区还没有知识点。' : '可在这里拖入已有知识点进行编排。'}
          </div>
        )}
      </div>
    </div>
  );
}

function PointNode({ data, selected }) {
  const stop = (event) => {
    event.stopPropagation();
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (event.nativeEvent?.stopImmediatePropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };
  const stopBubbleOnly = (event) => {
    event.stopPropagation();
    if (event.nativeEvent?.stopImmediatePropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };

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
      onDragOver={data.readOnly ? undefined : (event) => event.preventDefault()}
      onDrop={data.readOnly ? undefined : handleDrop}
    >
      <div className="kg-structured-point-head">
        <div className="kg-structured-point-title-wrap">
          <div className="kg-structured-point-title">{data.label}</div>
          <Tag color="blue">{data.typeLabel}</Tag>
        </div>
        {data.readOnly ? null : (
          <div className="kg-structured-point-actions nodrag nopan" onMouseDown={stop} onClick={stop}>
            <Tooltip title="上移">
              <Button
                size="small"
                type="text"
                icon={<UpOutlined />}
                disabled={!data.canMoveUp}
                onClick={() => data.onMoveUp?.(data.pointId)}
              />
            </Tooltip>
            <Tooltip title="下移">
              <Button
                size="small"
                type="text"
                icon={<DownOutlined />}
                disabled={!data.canMoveDown}
                onClick={() => data.onMoveDown?.(data.pointId)}
              />
            </Tooltip>
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
        )}
      </div>
      <div className="kg-structured-point-summary">{data.summary || '未填写知识点摘要。'}</div>
      <div className="kg-structured-point-footer">
        <span>{data.tagCount} 个标签</span>
        <span>{data.bindingCount} 条资料</span>
      </div>
      <div
        className="kg-structured-point-binding nodrag nopan nowheel"
        onPointerDown={stopBubbleOnly}
        onPointerUp={stopBubbleOnly}
        onMouseDown={stopBubbleOnly}
        onTouchStart={stopBubbleOnly}
        onClick={stopBubbleOnly}
      >
        {data.bindingCount ? (
          (data.bindings || []).map((binding) => (
            <button
              key={binding.bindingId}
              type="button"
              className={`kg-structured-point-binding-item ${data.readOnly ? 'is-previewable' : ''} nodrag nopan nowheel`}
              onPointerDown={stopBubbleOnly}
              onPointerUp={stopBubbleOnly}
              onMouseDown={stopBubbleOnly}
              onTouchStart={stopBubbleOnly}
              onClickCapture={stopBubbleOnly}
              onClick={(event) => {
                if (!data.onPreviewBinding) return;
                event.stopPropagation();
                if (event.nativeEvent?.stopImmediatePropagation) {
                  event.nativeEvent.stopImmediatePropagation();
                }
                data.onPreviewBinding(binding);
              }}
            >
              {binding.resourceName}
            </button>
          ))
        ) : (
          <span className="kg-structured-point-binding-empty">
            {data.readOnly ? '当前知识点未绑定学习资料' : '拖入资料到该知识点进行绑定'}
          </span>
        )}
      </div>
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
  structuredView,
  pointTypeLabelMap,
  selection,
  onSelectionChange,
  onCreateStage,
  onCreatePoint,
  onDeleteStage,
  onDeletePoint,
  onUpdateStagePosition,
  onMovePoint,
  onCreateStageEdge,
  onReconnectStageEdge,
  onBindResourcesToPoint,
  readOnly = false,
  interactiveReadOnly = false,
  onPreviewBinding = null,
}) {
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);
  const [resourcePanelFrame, setResourcePanelFrame] = useState(DEFAULT_RESOURCE_PANEL_FRAME);
  const [resourcePanelPosition, setResourcePanelPosition] = useState(DEFAULT_RESOURCE_PANEL_POSITION);
  const [resourcePanelDragging, setResourcePanelDragging] = useState(false);
  const [rfInstance, setRfInstance] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [stageDragPreview, setStageDragPreview] = useState(null);
  const [renderNodes, setRenderNodes] = useState([]);
  const [renderEdges, setRenderEdges] = useState([]);
  const [previewBinding, setPreviewBinding] = useState(null);
  const dragFrameRef = useRef(0);
  const dragNodeRef = useRef(null);
  const resourcePanelHostRef = useRef(null);
  const resourcePanelFrameRef = useRef(DEFAULT_RESOURCE_PANEL_FRAME);
  const resourcePanelPositionRef = useRef(DEFAULT_RESOURCE_PANEL_POSITION);
  const resourceResizeStateRef = useRef(null);
  const resourceDragStateRef = useRef(null);

  useEffect(() => {
    if (!rfInstance) return;
    const timer = window.setTimeout(() => {
      rfInstance.fitView({ padding: 0.16, duration: 280 });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [graphId, rfInstance]);

  useEffect(() => () => {
    if (dragFrameRef.current) {
      window.cancelAnimationFrame(dragFrameRef.current);
    }
  }, []);

  useEffect(() => {
    resourcePanelFrameRef.current = resourcePanelFrame;
  }, [resourcePanelFrame]);

  useEffect(() => {
    resourcePanelPositionRef.current = resourcePanelPosition;
  }, [resourcePanelPosition]);

  useEffect(() => {
    if (!resourcePanelOpen) return;
    const hostNode = resourcePanelHostRef.current;
    const nextFrame = clampResourcePanelFrame(resourcePanelFrameRef.current, hostNode);
    const nextPosition = getDefaultResourcePanelPosition(hostNode, nextFrame);
    setResourcePanelFrame(nextFrame);
    setResourcePanelPosition(nextPosition);
  }, [resourcePanelOpen]);

  useEffect(() => {
    const handleViewportResize = () => {
      const hostNode = resourcePanelHostRef.current;
      const nextFrame = clampResourcePanelFrame(resourcePanelFrameRef.current, hostNode);
      const nextPosition = clampResourcePanelPosition(resourcePanelPositionRef.current, nextFrame, hostNode);
      setResourcePanelFrame(nextFrame);
      setResourcePanelPosition(nextPosition);
    };
    handleViewportResize();
    const hostNode = resourcePanelHostRef.current;
    if (typeof ResizeObserver === 'undefined' || !hostNode) {
      window.addEventListener('resize', handleViewportResize);
      return () => window.removeEventListener('resize', handleViewportResize);
    }
    const observer = new ResizeObserver(() => handleViewportResize());
    observer.observe(hostNode);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    const resizeState = resourceResizeStateRef.current;
    if (!resizeState) return;
    window.removeEventListener('mousemove', resizeState.onMove);
    window.removeEventListener('mouseup', resizeState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  useEffect(() => () => {
    const dragState = resourceDragStateRef.current;
    if (!dragState) return;
    window.removeEventListener('mousemove', dragState.onMove);
    window.removeEventListener('mouseup', dragState.onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const pointMap = useMemo(
    () => Object.fromEntries(points.map((point) => [point.id, point])),
    [points],
  );

  const stages = useMemo(
    () => [...(structuredView?.stages || [])].sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0)),
    [structuredView?.stages],
  );

  const pointPlacements = structuredView?.pointPlacements || {};
  const effectivePointPlacements = useMemo(
    () => buildPreviewPlacements(pointPlacements, dragPreview),
    [dragPreview, pointPlacements],
  );
  const stagePositions = structuredView?.stagePositions || {};
  const effectiveStagePositions = useMemo(() => {
    if (!stageDragPreview?.stageId) return stagePositions;
    return {
      ...stagePositions,
      [stageDragPreview.stageId]: stageDragPreview.position,
    };
  }, [stageDragPreview, stagePositions]);
  const stageEdges = structuredView?.stageEdges || [];

  const stagePointEntries = useMemo(() => {
    const grouped = {};
    stages.forEach((stage) => {
      grouped[stage.id] = [];
    });
    points.forEach((point) => {
      const placement = effectivePointPlacements[point.id];
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
  }, [effectivePointPlacements, points, stages]);

  const stageMetrics = useMemo(
    () => Object.fromEntries(stages.map((stage) => {
      const entries = stagePointEntries[stage.id] || [];
      const bindingCount = entries.reduce((sum, entry) => sum + (entry.point.resourceBindings?.length || 0), 0);
      const grid = getStageGridMetrics(stage.layoutColumns, entries.length);
      return [stage.id, {
        pointCount: entries.length,
        bindingCount,
        width: grid.width,
        columns: grid.columns,
        cardWidth: grid.cardWidth,
        height: grid.height,
      }];
    })),
    [stagePointEntries, stages],
  );

  const stageIdSet = useMemo(() => new Set(stages.map((stage) => stage.id)), [stages]);
  const pointIdSet = useMemo(() => new Set(points.map((point) => point.id)), [points]);

  const handleMovePointByStep = (pointId, direction) => {
    const placement = pointPlacements[pointId];
    if (!placement?.stageId) return;
    const stageEntries = stagePointEntries[placement.stageId] || [];
    const currentIndex = stageEntries.findIndex((entry) => entry.point.id === pointId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= stageEntries.length) return;
    onMovePoint?.(pointId, placement.stageId, targetIndex);
  };

  const resolvePointDropPreview = (node) => {
    if (!node || !pointIdSet.has(node.id)) return null;
    const point = pointMap[node.id];
    const currentPlacement = pointPlacements[node.id];
    if (!point || !currentPlacement) return null;

    const currentStageMetric = stageMetrics[currentPlacement.stageId]
      || getStageGridMetrics(
        stages.find((stage) => stage.id === currentPlacement.stageId)?.layoutColumns,
        (stagePointEntries[currentPlacement.stageId] || []).length,
      );
    const draggedWidth = Number(node.width || currentStageMetric.cardWidth);
    const centerX = node.position.x + draggedWidth / 2;
    const centerY = node.position.y + POINT_HEIGHT / 2;
    const targetStage = stages.find((stage) => {
      const stagePosition = effectiveStagePositions[stage.id] || { x: 0, y: 0 };
      const fallbackMetric = getStageGridMetrics(stage.layoutColumns, (stagePointEntries[stage.id] || []).length);
      const stageWidth = stageMetrics[stage.id]?.width || fallbackMetric.width;
      const stageHeight = stageMetrics[stage.id]?.height || fallbackMetric.height;
      return (
        centerX >= stagePosition.x
        && centerX <= stagePosition.x + stageWidth
        && centerY >= stagePosition.y
        && centerY <= stagePosition.y + stageHeight
      );
    }) || stages.find((stage) => stage.id === currentPlacement.stageId);

    if (!targetStage) return null;

    const stagePosition = effectiveStagePositions[targetStage.id] || { x: 0, y: 0 };
    const stageMetric = stageMetrics[targetStage.id]
      || getStageGridMetrics(targetStage.layoutColumns, (stagePointEntries[targetStage.id] || []).length);
    const relativeX = clamp(
      node.position.x - stagePosition.x,
      STAGE_PADDING_X,
      Math.max(STAGE_PADDING_X, stageMetric.width - stageMetric.cardWidth - STAGE_PADDING_X),
    );
    const relativeY = clamp(
      node.position.y - stagePosition.y,
      STAGE_HEADER_HEIGHT,
      Math.max(STAGE_HEADER_HEIGHT, stageMetric.height - POINT_HEIGHT - STAGE_PADDING_BOTTOM),
    );

    const siblings = (stagePointEntries[targetStage.id] || [])
      .filter((entry) => entry.point.id !== point.id)
      .sort((left, right) => (left.placement.order || 0) - (right.placement.order || 0));

    const targetColumn = clamp(
      Math.floor((relativeX - STAGE_PADDING_X) / (stageMetric.cardWidth + POINT_GAP)),
      0,
      Math.max(0, stageMetric.columns - 1),
    );
    const targetRow = Math.max(0, Math.floor((relativeY - STAGE_HEADER_HEIGHT) / (POINT_HEIGHT + POINT_GAP)));
    const candidateIndex = targetRow * stageMetric.columns + targetColumn;
    const targetIndex = Math.max(0, Math.min(candidateIndex, siblings.length));

    return {
      pointId: node.id,
      stageId: targetStage.id,
      targetIndex,
      position: node.position,
      width: draggedWidth,
    };
  };

  const schedulePointDragPreview = (node) => {
    dragNodeRef.current = node;
    if (dragFrameRef.current) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = 0;
      const nextPreview = resolvePointDropPreview(dragNodeRef.current);
      setDragPreview((prev) => {
        if (
          prev?.pointId === nextPreview?.pointId
          && prev?.stageId === nextPreview?.stageId
          && prev?.targetIndex === nextPreview?.targetIndex
          && prev?.position?.x === nextPreview?.position?.x
          && prev?.position?.y === nextPreview?.position?.y
        ) {
          return prev;
        }
        return nextPreview;
      });
    });
  };

  const nodes = useMemo(() => {
    const stageNodes = stages.map((stage, index) => {
      const position = effectiveStagePositions[stage.id] || { x: index * 380, y: 0 };
      const metric = stageMetrics[stage.id] || { pointCount: 0, bindingCount: 0, width: STAGE_WIDTH, height: buildStageHeight(0) };
      return {
        id: stage.id,
        type: 'kgStage',
        position,
        draggable: true,
        selectable: !readOnly || interactiveReadOnly,
        connectable: true,
        data: {
          stageId: stage.id,
          label: stage.name,
          description: stage.description,
          color: stage.color,
          pointCount: metric.pointCount,
          bindingCount: metric.bindingCount,
          height: metric.height,
          width: metric.width,
          disableDelete: stages.length <= 1,
          readOnly,
          onCreatePoint,
          onDeleteStage,
        },
        selected: selection?.type === 'stage' && selection.id === stage.id,
        style: {
          width: metric.width,
          height: metric.height,
          border: 'none',
          background: 'transparent',
          zIndex: 1,
        },
      };
    });

    const pointNodes = points.map((point) => {
      const placement = pointPlacements[point.id];
      if (!placement?.stageId) return null;
      const previewPlacement = effectivePointPlacements[point.id] || placement;
      const stageEntries = stagePointEntries[previewPlacement.stageId] || [];
      const stageIndex = stageEntries.findIndex((entry) => entry.point.id === point.id);
      const isDraggingPoint = dragPreview?.pointId === point.id;
      const stagePosition = effectiveStagePositions[previewPlacement.stageId] || { x: 0, y: 0 };
      const stageMetric = stageMetrics[previewPlacement.stageId]
        || getStageGridMetrics(stages.find((stage) => stage.id === previewPlacement.stageId)?.layoutColumns, stageEntries.length);
      const columnIndex = Math.max(0, stageIndex) % stageMetric.columns;
      const rowIndex = Math.floor(Math.max(0, stageIndex) / stageMetric.columns);
      const relativePosition = {
        x: STAGE_PADDING_X + columnIndex * (stageMetric.cardWidth + POINT_GAP),
        y: STAGE_HEADER_HEIGHT + rowIndex * (POINT_HEIGHT + POINT_GAP),
      };
      return {
        id: point.id,
        type: 'kgPoint',
        position: isDraggingPoint
          ? dragPreview.position
          : {
              x: stagePosition.x + relativePosition.x,
              y: stagePosition.y + relativePosition.y,
            },
        draggable: !readOnly,
        selectable: !readOnly || interactiveReadOnly,
        connectable: false,
        data: {
          pointId: point.id,
          label: point.title,
          summary: point.summary,
          color: point.meta?.color || '#4667d6',
          typeLabel: pointTypeLabelMap[point.type] || point.type,
          tagCount: point.tags?.length || 0,
          bindingCount: point.resourceBindings?.length || 0,
          bindings: point.resourceBindings || [],
          bindingNames: (point.resourceBindings || []).map((binding) => binding.resourceName),
          readOnly,
          canMoveUp: stageIndex > 0,
          canMoveDown: stageIndex > -1 && stageIndex < stageEntries.length - 1,
          onMoveUp: () => handleMovePointByStep(point.id, 'up'),
          onMoveDown: () => handleMovePointByStep(point.id, 'down'),
          onDeletePoint,
          onResourceDrop: onBindResourcesToPoint,
          onPreviewBinding: onPreviewBinding || setPreviewBinding,
        },
        selected: selection?.type === 'point' && selection.id === point.id,
        style: {
          width: stageMetric.cardWidth,
          border: 'none',
          background: 'transparent',
          zIndex: 5,
        },
      };
    }).filter(Boolean);

    return [...stageNodes, ...pointNodes];
  }, [
    onBindResourcesToPoint,
    onCreatePoint,
    onDeletePoint,
    onDeleteStage,
    onMovePoint,
    readOnly,
    dragPreview,
    effectivePointPlacements,
    pointPlacements,
    pointTypeLabelMap,
    points,
    selection,
    stageMetrics,
    stagePointEntries,
    effectiveStagePositions,
    stages,
  ]);

  const edges = useMemo(() => {
    const stageFlowEdges = stageEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'stage-source-right',
      targetHandle: edge.targetHandle || 'stage-target-left',
      label: edge.label || '分区衔接',
      type: edge.pathStyle || 'smoothstep',
      markerStart: getEdgeMarker(edge.startMarker, edge.strokeColor || '#60a5fa'),
      markerEnd: getEdgeMarker(edge.markerType, edge.strokeColor || '#60a5fa'),
      labelStyle: {
        fill: edge.strokeColor || '#60a5fa',
        fontSize: 12,
        fontWeight: 600,
        opacity: Number(edge.opacity ?? 100) / 100,
      },
      style: {
        stroke: edge.strokeColor || '#60a5fa',
        strokeWidth: (edge.strokeWidth || 2) + (selection?.type === 'stage-edge' && selection.id === edge.id ? 0.8 : 0),
        strokeDasharray: getEdgeDashArray(edge.lineStyle),
        opacity: Number(edge.opacity ?? 100) / 100,
      },
      data: { edgeType: 'stage-edge' },
      animated: Boolean(edge.animated),
    }));

    return stageFlowEdges;
  }, [selection, stageEdges]);

  useEffect(() => {
    setRenderNodes((current) => reconcileFlowNodes(current, nodes));
  }, [nodes]);

  useEffect(() => {
    setRenderEdges((current) => reconcileFlowEdges(current, edges));
  }, [edges]);

  const handleNodesChange = (changes) => {
    setRenderNodes((current) => applyNodeChanges(changes, current));
  };

  const handleEdgesChange = (changes) => {
    setRenderEdges((current) => applyEdgeChanges(changes, current));
  };

  const handleConnect = ({ source, target, sourceHandle, targetHandle }) => {
    if (readOnly) return;
    if (!source || !target || source === target) return;
    if (stageIdSet.has(source) && stageIdSet.has(target)) {
      onCreateStageEdge?.({
        source,
        target,
        sourceHandle,
        targetHandle,
      });
      return;
    }
    message.warning('结构化视图中只允许分区与分区之间连线。');
  };

  const handleReconnect = (oldEdge, nextConnection) => {
    if (readOnly) return;
    if (!oldEdge?.id || !nextConnection?.source || !nextConnection?.target) return;
    if (nextConnection.source === nextConnection.target) {
      message.warning('分区连线不能连接到自身。');
      return;
    }
    if (!stageIdSet.has(nextConnection.source) || !stageIdSet.has(nextConnection.target)) {
      message.warning('结构化视图中只允许分区与分区之间连线。');
      return;
    }
    setRenderEdges((current) => reconnectEdge(oldEdge, nextConnection, current));
    onReconnectStageEdge?.(oldEdge.id, {
      source: nextConnection.source,
      target: nextConnection.target,
      sourceHandle: nextConnection.sourceHandle,
      targetHandle: nextConnection.targetHandle,
    });
  };

  const handleNodeDragStart = (_, node) => {
    if (readOnly) return;
    if (stageIdSet.has(node.id)) {
      setStageDragPreview({
        stageId: node.id,
        position: node.position,
      });
      return;
    }
    if (pointIdSet.has(node.id)) {
      setDragPreview({
        pointId: node.id,
        stageId: pointPlacements[node.id]?.stageId,
        targetIndex: Math.max(0, Number(pointPlacements[node.id]?.order || 1) - 1),
        position: node.position,
        width: Number(node.width || 0),
      });
    }
  };

  const handleNodeDrag = (_, node) => {
    if (readOnly) return;
    if (stageIdSet.has(node.id)) {
      setStageDragPreview({
        stageId: node.id,
        position: node.position,
      });
      return;
    }
    if (pointIdSet.has(node.id)) {
      schedulePointDragPreview(node);
    }
  };

  const handleNodeDragStop = (_, node) => {
    if (readOnly) return;
    if (stageIdSet.has(node.id)) {
      setStageDragPreview(null);
      onUpdateStagePosition?.(node.id, node.position);
      return;
    }
    if (!pointIdSet.has(node.id)) return;
    const nextPreview = resolvePointDropPreview(node) || dragPreview;
    if (dragFrameRef.current) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = 0;
    }
    dragNodeRef.current = null;
    setDragPreview(null);
    if (!nextPreview?.stageId) return;
    onMovePoint?.(node.id, nextPreview.stageId, nextPreview.targetIndex);
  };

  const handleResourcePanelResizeStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startFrame = resourcePanelFrameRef.current;
    const startPosition = resourcePanelPositionRef.current;
    const onMove = (moveEvent) => {
      const nextFrame = clampResourcePanelFrame({
        width: startFrame.width + (moveEvent.clientX - startX),
        height: startFrame.height + (moveEvent.clientY - startY),
      }, resourcePanelHostRef.current);
      setResourcePanelFrame(nextFrame);
      setResourcePanelPosition(clampResourcePanelPosition(startPosition, nextFrame, resourcePanelHostRef.current));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      resourceResizeStateRef.current = null;
    };
    resourceResizeStateRef.current = { onMove, onUp };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  };

  const handleResourcePanelToolbarMouseDown = (event) => {
    const interactiveTarget = event.target.closest(
      'button, input, .ant-input-affix-wrapper, .ant-input, .ant-select, .ant-checkbox-wrapper, .space-resource-import-close-btn, .space-resource-import-field-btn',
    );
    if (interactiveTarget || event.button !== 0) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = resourcePanelPositionRef.current;
    const frame = resourcePanelFrameRef.current;
    const onMove = (moveEvent) => {
      setResourcePanelPosition(clampResourcePanelPosition({
        left: startPosition.left + (moveEvent.clientX - startX),
        top: startPosition.top + (moveEvent.clientY - startY),
      }, frame, resourcePanelHostRef.current));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      resourceDragStateRef.current = null;
      setResourcePanelDragging(false);
    };
    resourceDragStateRef.current = { onMove, onUp };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    setResourcePanelDragging(true);
  };

  return (
    <div className="kg-structured-shell">
      <div ref={resourcePanelHostRef} className="kg-structured-main">
        <div className="kg-structured-canvas kg-structured-canvas-overlay">
          {!readOnly && resourcePanelOpen ? (
            <aside
              className="kg-resource-drawer kg-resource-drawer-floating is-open"
              style={{
                left: `${resourcePanelPosition.left}px`,
                top: `${resourcePanelPosition.top}px`,
                width: `${resourcePanelFrame.width}px`,
                height: `${resourcePanelFrame.height}px`,
              }}
            >
              <SpaceResourceImportBrowser
                active={resourcePanelOpen}
                embedded
                dragging={resourcePanelDragging}
                frameWidth={resourcePanelFrame.width}
                showFooter
                showFooterActions={false}
                showIncludeDirectories={false}
                showFooterSummary={false}
                showFooterPath
                footerHint="可直接拖动资料到知识点上绑定"
                onClose={() => setResourcePanelOpen(false)}
                onToolbarMouseDown={handleResourcePanelToolbarMouseDown}
                onResizeMouseDown={handleResourcePanelResizeStart}
                excludeFileTypes={['knowledgeGraph']}
                shellStyle={{ height: '100%' }}
                defaultVisibleColumnKeys={NAME_ONLY_COLUMN_KEYS}
                allowColumnVisibilityMenu={false}
                disableCompactLayout
                showSidebar={false}
                showScopeSwitcherInToolbar
                showToolbarTitle={false}
                closeButtonMode="collapse"
                itemDragConfig={{
                  type: RESOURCE_DRAG_TYPE,
                  effectAllowed: 'copy',
                  serialize: (item, context) => ({
                    ...item,
                    fileType: item.fileType || 'other',
                    libraryId: context.libraryId,
                    libraryName: context.libraryName,
                    libraryScope: context.libraryScope,
                    path: context.path,
                  }),
                }}
              />
            </aside>
          ) : !readOnly ? (
            <Button
              className="kg-resource-drawer-toggle"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setResourcePanelOpen(true)}
            />
          ) : null}

          {!stages.length ? (
            <div className="kg-empty-shell">
              {readOnly ? (
                <Empty description="当前预览图谱还没有分区内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Empty description="当前图谱还没有分区" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <Button type="primary" icon={<ApartmentOutlined />} onClick={() => onCreateStage?.()}>
                    新增分区
                  </Button>
                </Empty>
              )}
            </div>
          ) : (
            <ReactFlow
              nodes={renderNodes}
              edges={renderEdges}
              fitView
              nodesDraggable={!readOnly}
              nodesConnectable={!readOnly}
              edgesReconnectable={!readOnly}
              elementsSelectable={!readOnly || interactiveReadOnly}
              connectionMode={ConnectionMode.Strict}
              connectionRadius={36}
              reconnectRadius={36}
              nodeDragThreshold={1}
              connectionDragThreshold={6}
              onlyRenderVisibleElements
              elevateNodesOnSelect={false}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeClick={readOnly && !interactiveReadOnly ? undefined : (_, node) => {
                onSelectionChange?.({
                  type: stageIdSet.has(node.id) ? 'stage' : 'point',
                  id: node.id,
                });
              }}
              onEdgeClick={readOnly && !interactiveReadOnly ? undefined : (_, edge) => {
                onSelectionChange?.({
                  type: edge.data?.edgeType === 'stage-edge' ? 'stage-edge' : 'relation',
                  id: edge.id,
                });
              }}
              onPaneClick={readOnly && !interactiveReadOnly ? undefined : () => onSelectionChange?.({ type: 'graph', id: graphId })}
              onConnect={readOnly ? undefined : handleConnect}
              onReconnect={readOnly ? undefined : handleReconnect}
              onNodeDragStart={readOnly ? undefined : handleNodeDragStart}
              onNodeDrag={readOnly ? undefined : handleNodeDrag}
              onNodeDragStop={readOnly ? undefined : handleNodeDragStop}
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

      <Modal
        title={previewBinding?.resourceName || '资料预览'}
        open={!!previewBinding}
        onCancel={() => setPreviewBinding(null)}
        footer={null}
        width={920}
        destroyOnClose
        className="kg-binding-preview-modal"
      >
        {previewBinding ? (
          <div className="kg-binding-preview-shell">
            <div className="kg-binding-preview-meta">
              <span>{previewBinding.libraryName || '未知资料库'}</span>
              <span>{previewBinding.fileType || 'other'}</span>
              <span>{previewBinding.snapshotPath || '-'}</span>
            </div>
            <div className="kg-binding-preview-body">
              {renderBindingPreviewContent(previewBinding)}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default StructuredKnowledgeGraphView;
