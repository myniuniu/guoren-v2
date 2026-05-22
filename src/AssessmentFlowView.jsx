import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import { InputNumber, Select, Tooltip, Modal, Input, Button, Radio, message, Popconfirm, Divider } from 'antd';
import { FolderOutlined, AppstoreOutlined, DeleteOutlined, ClearOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';
import './AssessmentFlowView.css';

const activityTypeColor = { video: '#1677ff', live: '#13c2c2', exam: '#ff4d4f', offline: '#faad14', other: '#8c8c8c', '': '#bfbfbf' };

// 阶段节点（顶级文件夹） - 容器式，包含活动子节点
function StageNode({ data }) {
  const stop = (e) => e.stopPropagation();
  return (
    <div className={`flow-stage-container ${data.isDropTarget ? 'is-drop-target' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#1677ff' }} />
      <div className="flow-stage-header">
        <FolderOutlined style={{ color: '#1677ff' }} />
        <span className="flow-stage-title">{data.label}</span>
        <span className="flow-stage-meta-inline">{data.activityCount} 个活动 · 总权重 {data.totalWeight}%</span>
      </div>
      {data.isDropTarget && (
        <div className="flow-stage-snap-tip">松开鼠标以吸附到槽位</div>
      )}
      {data.isDraft && data.onDelete && (
        <div
          className="flow-node-delete-badge nodrag nopan"
          title="删除阶段容器"
          onMouseDown={stop}
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
        >
          <CloseOutlined />
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#1677ff' }} />
    </div>
  );
}

// 活动节点（子文件夹）
function ActivityNode({ data }) {
  const color = activityTypeColor[data.activityType ?? ''] || activityTypeColor.other;
  const stop = (e) => e.stopPropagation();
  return (
    <div className="flow-activity-node" style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      {data.isDraft && data.onDelete && (
        <div
          className="flow-node-delete-badge nodrag nopan"
          title="从画布移除该活动"
          onMouseDown={stop}
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
        >
          <CloseOutlined />
        </div>
      )}
      <div className="flow-activity-header">
        <AppstoreOutlined style={{ color }} />
        <span className="flow-activity-title">{data.label}</span>
      </div>
      <div className="flow-activity-body">
        <div className="flow-row">
          <span className="flow-row-label">类型</span>
          <Select
            className="nodrag nopan"
            size="small"
            style={{ width: 100 }}
            value={data.activityType ?? ''}
            disabled={!data.isDraft}
            onChange={(v) => data.onChange(data.folderKey, 'activityType', v)}
            options={[
              { label: '请选择', value: '' },
              { label: '视频课', value: 'video' },
              { label: '直播课', value: 'live' },
              { label: '考试', value: 'exam' },
              { label: '线下集训', value: 'offline' },
              { label: '其他', value: 'other' },
            ]}
            onMouseDown={stop}
            onClick={stop}
            getPopupContainer={() => document.body}
          />
        </div>
        <div className="flow-row">
          <span className="flow-row-label">权重</span>
          <InputNumber
            className="nodrag nopan"
            size="small"
            style={{ width: 80 }}
            min={0}
            max={100}
            value={data.weight ?? 0}
            disabled={!data.isDraft}
            onChange={(v) => data.onChange(data.folderKey, 'weight', v || 0)}
            onMouseDown={stop}
            onClick={stop}
            addonAfter="%"
          />
        </div>
        <div className="flow-row">
          <span className="flow-row-label">必修</span>
          <Select
            className="nodrag nopan"
            size="small"
            style={{ width: 80 }}
            value={data.required ? 'yes' : 'no'}
            disabled={!data.isDraft}
            onChange={(v) => data.onChange(data.folderKey, 'required', v === 'yes')}
            options={[{ label: '必修', value: 'yes' }, { label: '选修', value: 'no' }]}
            onMouseDown={stop}
            onClick={stop}
            getPopupContainer={() => document.body}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  );
}

const nodeTypes = { stage: StageNode, activity: ActivityNode };

// 规则文案
function formatRuleLabel(rule) {
  if (!rule || !rule.type || rule.type === 'none') return '';
  if (rule.type === 'completion') return `完成率 ≥ ${rule.threshold ?? 0}%`;
  if (rule.type === 'score') return `得分 ≥ ${rule.threshold ?? 0}`;
  if (rule.type === 'all-passed') return '全部活动通过';
  if (rule.type === 'custom') return rule.note ? `自定义：${rule.note}` : '自定义规则';
  return '';
}

const DEFAULT_RULE = { type: 'none', threshold: 80, note: '' };

function AssessmentFlowView({ resources, assessment, isDraft, onUpdateAssessment, onSelectFolder }) {
  const [editingEdge, setEditingEdge] = useState(null);
  const [ruleForm, setRuleForm] = useState(DEFAULT_RULE);
  const [rfInstance, setRfInstance] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedActivityKey, setSelectedActivityKey] = useState(null);
  const [selectedStageKey, setSelectedStageKey] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const wrapperRef = useRef(null);

  // 计算初始节点和边
  const { initialNodes, initialEdges } = useMemo(() => {
    const deletedSet = new Set(assessment.deletedEdges || []);
    const deletedNodeSet = new Set(assessment.deletedNodes || []);
    const edgeRules = assessment.edgeRules || {};
    const overrides = assessment.parentOverrides || {};

    // builtin stage = 资料区一级目录
    const builtinStages = resources.filter((r) => r.isFolder && r.parentKey === null);
    // promoted stage = 任意层级资料文件夹被拖到画布空白处，提升为阶段
    const promotionKeys = (assessment.stagePromotions || []).filter((k) => !deletedNodeSet.has(k));
    const promotedSet = new Set(promotionKeys);
    const promotedStages = promotionKeys
      .map((k) => resources.find((r) => r.key === k))
      .filter((r) => r && r.isFolder && r.parentKey !== null) // 一级目录本身已是 builtin，不需提升
      .map((r) => ({ key: r.key, name: r.name, isFolder: true, parentKey: null, isPromoted: true }));
    // custom stage = 工具栏拖拽创建的空阶段容器
    const customStages = (assessment.customStages || [])
      .filter((cs) => !deletedNodeSet.has(cs.key))
      .map((cs) => ({ key: cs.key, name: cs.name, isFolder: true, parentKey: null, isCustom: true }));
    const stages = [...builtinStages, ...promotedStages, ...customStages];
    const stageKeySet = new Set(stages.map((s) => s.key));
    const nodes = [];
    const edges = [];

    // 构建 activityKey -> stageKey 的归属 map（考虑 parentOverrides）
    const activityParentMap = new Map();
    // 1) 资料区二级目录：默认归属到原 stage（但如果已提升成 stage，跳过）
    stages.forEach((s) => {
      resources.filter((r) => r.isFolder && r.parentKey === s.key && !promotedSet.has(r.key)).forEach((a) => {
        const overridden = overrides[a.key];
        // 覆盖后的 stageKey 必须仍是存在且未被删除的阶段
        const valid = overridden && stageKeySet.has(overridden) && !deletedNodeSet.has(overridden);
        activityParentMap.set(a.key, valid ? overridden : s.key);
      });
    });
    // 2) parentOverrides 中：任意层级文件夹被拖入 stage 容器，作为活动
    Object.entries(overrides).forEach(([actKey, stageKey]) => {
      if (activityParentMap.has(actKey)) return;
      if (promotedSet.has(actKey)) return; // 被提升为 stage 的不能同时当活动
      if (stageKeySet.has(actKey)) return; // 本身就是 stage 的不能当活动
      if (deletedNodeSet.has(actKey)) return;
      const r = resources.find((rr) => rr.key === actKey);
      if (!r || !r.isFolder) return;
      if (!stageKeySet.has(stageKey)) return;
      if (deletedNodeSet.has(stageKey)) return;
      activityParentMap.set(actKey, stageKey);
    });

    const decorate = (edge) => {
      const rule = edgeRules[edge.id];
      const label = formatRuleLabel(rule);
      const hasRule = !!label;
      return {
        ...edge,
        label: hasRule ? label : undefined,
        labelStyle: hasRule ? { fill: '#1677ff', fontWeight: 600, fontSize: 11 } : undefined,
        labelBgPadding: hasRule ? [6, 3] : undefined,
        labelBgBorderRadius: hasRule ? 4 : undefined,
        labelBgStyle: hasRule ? { fill: '#fff', fillOpacity: 0.95, stroke: '#1677ff', strokeWidth: 0.5 } : undefined,
        // 规则边强调样式
        style: hasRule ? { ...(edge.style || {}), stroke: '#1677ff', strokeWidth: 2.5 } : edge.style,
        markerEnd: hasRule ? { type: MarkerType.ArrowClosed, color: '#1677ff' } : edge.markerEnd,
      };
    };
    const pushEdge = (e) => {
      if (deletedSet.has(e.id)) return;
      // 边的任一端节点被软删除，边也不显示
      if (deletedNodeSet.has(e.source) || deletedNodeSet.has(e.target)) return;
      edges.push(decorate(e));
    };

    stages.forEach((stage, sIdx) => {
      if (deletedNodeSet.has(stage.key)) return;
      // 取归属到此 stage 的所有活动（含 parentOverrides）
      const activities = [...activityParentMap.entries()]
        .filter(([actKey, stageKey]) => stageKey === stage.key && !deletedNodeSet.has(actKey))
        .map(([actKey]) => resources.find((r) => r.key === actKey))
        .filter(Boolean);
      const stageX = sIdx * 380;
      const stageY = 0;
      const stageActivityRules = activities.map((a) => assessment.rules.find((r) => r.folderKey === a.key)).filter(Boolean);
      const totalWeight = stageActivityRules.reduce((sum, r) => sum + (r.weight || 0), 0);

      // 阶段容器尺寸：高度随活动数量动态伸缩
      const STAGE_WIDTH = 300;
      const HEADER_H = 60;
      const ACT_H = 200; // 活动节点高度估算
      const stageHeight = Math.max(160, HEADER_H + activities.length * ACT_H + 20);

      nodes.push({
        id: stage.key,
        type: 'stage',
        position: assessment.flowPositions?.[stage.key] || { x: stageX, y: stageY },
        style: { width: STAGE_WIDTH, height: stageHeight },
        deletable: false,
        data: {
          label: stage.name,
          activityCount: activities.length,
          totalWeight,
          isDraft,
          onDelete: () => {
            if (!isDraft) return;
            const next = { ...assessment };
            if (stage.isCustom) {
              next.customStages = (assessment.customStages || []).filter((cs) => cs.key !== stage.key);
            } else if (stage.isPromoted) {
              next.stagePromotions = (assessment.stagePromotions || []).filter((k) => k !== stage.key);
            } else {
              next.deletedNodes = [...(assessment.deletedNodes || []), stage.key];
            }
            const flowPositions = { ...(assessment.flowPositions || {}) };
            delete flowPositions[stage.key];
            next.flowPositions = flowPositions;
            const parentOverrides = { ...(assessment.parentOverrides || {}) };
            Object.keys(parentOverrides).forEach((k) => {
              if (parentOverrides[k] === stage.key) delete parentOverrides[k];
            });
            next.parentOverrides = parentOverrides;
            onUpdateAssessment(next);
            message.success(`已删除「${stage.name || '阶段'}」`);
          },
        },
        draggable: isDraft,
      });

      // 阶段间顺序连接（仅资料区一级目录阶段间自动串联，提升/自定义阶段保持自由摆放）
      if (sIdx > 0 && !stage.isCustom && !stage.isPromoted) {
        const prev = stages[sIdx - 1];
        if (!deletedNodeSet.has(prev.key) && !prev.isCustom && !prev.isPromoted) {
          pushEdge({
            id: `${prev.key}->${stage.key}`,
            source: prev.key,
            target: stage.key,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#1677ff', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#1677ff' },
          });
        }
      }

      // 活动节点——作为阶段子节点嵌套在阶段容器内
      activities.forEach((act, aIdx) => {
        const rule = assessment.rules.find((r) => r.folderKey === act.key);
        nodes.push({
          id: act.key,
          type: 'activity',
          parentNode: stage.key,
          position: assessment.flowPositions?.[act.key] || { x: 20, y: HEADER_H + aIdx * ACT_H },
          deletable: false,
          data: {
            label: act.name,
            folderKey: act.key,
            activityType: rule?.activityType ?? '',
            weight: rule?.weight ?? 0,
            required: rule?.required ?? true,
            isDraft,
            onChange: (folderKey, field, value) => {
              const rules = [...assessment.rules];
              const idx = rules.findIndex((r) => r.folderKey === folderKey);
              if (idx >= 0) {
                rules[idx] = { ...rules[idx], [field]: value };
              } else {
                rules.push({
                  key: `ar_${Date.now()}`,
                  folderKey,
                  folderName: act.name,
                  activityType: '',
                  weight: 0,
                  passCondition: { metric: '完成率', op: '>=', value: 80 },
                  required: true,
                  [field]: value,
                });
              }
              onUpdateAssessment({ ...assessment, rules });
            },
            onDelete: () => {
              if (!isDraft) return;
              const next = { ...assessment };
              next.deletedNodes = [...(assessment.deletedNodes || []), act.key];
              const flowPositions = { ...(assessment.flowPositions || {}) };
              delete flowPositions[act.key];
              next.flowPositions = flowPositions;
              const parentOverrides = { ...(assessment.parentOverrides || {}) };
              delete parentOverrides[act.key];
              next.parentOverrides = parentOverrides;
              onUpdateAssessment(next);
              message.success(`已从画布移除「${act.name || '活动'}」`);
            },
          },
          draggable: isDraft,
        });
      });
    });

    // 加载用户自定义的边
    if (assessment.flowEdges && Array.isArray(assessment.flowEdges)) {
      assessment.flowEdges.forEach((e) => {
        if (!edges.some((ex) => ex.id === e.id)) {
          pushEdge({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#52c41a', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#52c41a' },
          });
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [resources, assessment, isDraft, onUpdateAssessment]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 拖动结束后短暂跳过一次 props 同步，避免 useEffect 把刚算好的位置覆盖回去
  const skipNextSyncRef = useRef(false);

  // 同步外部数据变化
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    setNodes(initialNodes);
    setEdges(initialEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  // 节点拖动开始 -> 高亮父阶段、记录状态
  const onNodeDragStart = useCallback((event, node) => {
    if (!isDraft) return;
    if (node.type !== 'activity' || !node.parentNode) return;
    setNodes((nds) => nds.map((n) =>
      n.id === node.parentNode
        ? { ...n, data: { ...n.data, isDropTarget: true } }
        : n
    ));
  }, [isDraft, setNodes]);

  // 拖动中：实时检测活动中心落在哪个阶段内，切换高亮
  const ACTIVITY_W = 240;
  const ACTIVITY_H_VISUAL = 180;
  const HEADER_H = 60;
  const SLOT_H = 200;

  const findHitStage = useCallback((node, stageNodes) => {
    if (node.type !== 'activity') return null;
    // 优先使用 ReactFlow 提供的画布绝对坐标，避免嵌套节点 position 语义歧义
    const absX = node.positionAbsolute?.x ?? node.position.x;
    const absY = node.positionAbsolute?.y ?? node.position.y;
    const cx = absX + ACTIVITY_W / 2;
    const cy = absY + ACTIVITY_H_VISUAL / 2;
    for (const s of stageNodes) {
      const sx = s.position.x;
      const sy = s.position.y;
      const sw = s.style?.width ?? 300;
      const sh = s.style?.height ?? 160;
      if (cx >= sx && cx <= sx + sw && cy >= sy && cy <= sy + sh) {
        return s;
      }
    }
    return null;
  }, []);

  const onNodeDrag = useCallback((event, node) => {
    if (!isDraft) return;
    if (node.type !== 'activity') return;
    setNodes((nds) => {
      const stageNodes = nds.filter((n) => n.type === 'stage');
      const hit = findHitStage(node, stageNodes);
      const targetId = hit?.id || node.parentNode; // 未命中仍高亮原阶段
      let changed = false;
      const next = nds.map((n) => {
        if (n.type !== 'stage') return n;
        const should = n.id === targetId;
        if (!!n.data?.isDropTarget !== should) {
          changed = true;
          return { ...n, data: { ...n.data, isDropTarget: should } };
        }
        return n;
      });
      return changed ? next : nds;
    });
  }, [isDraft, findHitStage, setNodes]);

  // 节点拖动结束 -> 跨阶段归属 + 同阶段按 y 重排序以避免重叠
  const onNodeDragStop = useCallback((event, node) => {
    if (!isDraft) return;

    if (node.type !== 'activity') {
      const flowPositions = { ...(assessment.flowPositions || {}), [node.id]: node.position };
      setNodes((nds) => nds.map((n) =>
        n.type === 'stage' && n.data?.isDropTarget
          ? { ...n, data: { ...n.data, isDropTarget: false } }
          : n
      ));
      skipNextSyncRef.current = true;
      onUpdateAssessment({ ...assessment, flowPositions });
      return;
    }

    // 活动拖动：检测命中阶段 + 把被拖节点和同阶段同胞一起按 y 排序，按槽位重排避免重叠
    const positionsToWrite = {};
    let newParentId = node.parentNode;
    let crossStage = false;
    let hitStageLabel = '';
    let needPromote = false;
    let promoteAbsX = 0;
    let promoteAbsY = 0;

    setNodes((nds) => {
      // 关键：从 state 中读取被拖节点的最新 position（ReactFlow 已经把拖动后的位置写进来了）
      const draggedFromState = nds.find((n) => n.id === node.id) || node;
      const stageNodes = nds.filter((n) => n.type === 'stage');
      const parentStage = stageNodes.find((s) => s.id === draggedFromState.parentNode);
      const hit = findHitStage(draggedFromState, stageNodes);

      // 未命中任何阶段 -> 提升为阶段容器
      if (!hit) {
        needPromote = true;
        promoteAbsX = draggedFromState.positionAbsolute?.x
          ?? ((parentStage?.position.x ?? 0) + (draggedFromState.position?.x ?? 0));
        promoteAbsY = draggedFromState.positionAbsolute?.y
          ?? ((parentStage?.position.y ?? 0) + (draggedFromState.position?.y ?? 0));
        // 原阶段剩余活动重排避免空隔
        if (parentStage) {
          const oldSiblings = nds
            .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === parentStage.id)
            .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
          oldSiblings.forEach((n, i) => {
            positionsToWrite[n.id] = { x: 20, y: HEADER_H + i * SLOT_H };
          });
        }
        return nds.map((n) => {
          if (n.type === 'stage' && n.data?.isDropTarget) {
            return { ...n, data: { ...n.data, isDropTarget: false } };
          }
          return n;
        });
      }

      const targetStage = (hit && hit.id !== draggedFromState.parentNode) ? hit : parentStage;
      if (!targetStage) return nds;

      newParentId = targetStage.id;
      crossStage = newParentId !== draggedFromState.parentNode;
      hitStageLabel = targetStage.data?.label || '';

      // 计算被拖节点在目标阶段内的局部 y
      // - 同 stage：直接用 position.y（嵌套节点 position 即相对父的局部 y）
      // - 跨 stage：把绝对 y 减去目标 stage 的 y
      let nodeLocalY;
      if (!crossStage) {
        nodeLocalY = draggedFromState.position?.y ?? 0;
      } else {
        const absY = draggedFromState.positionAbsolute?.y
          ?? ((parentStage?.position.y ?? 0) + (draggedFromState.position?.y ?? 0));
        nodeLocalY = absY - targetStage.position.y;
      }

      // 把被拖节点也参与目标阶段的整体排序
      const targetAll = [
        ...nds
          .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === targetStage.id)
          .map((n) => ({ id: n.id, y: n.position?.y ?? 0 })),
        { id: node.id, y: nodeLocalY },
      ].sort((a, b) => a.y - b.y);

      targetAll.forEach((n, i) => {
        positionsToWrite[n.id] = { x: 20, y: HEADER_H + i * SLOT_H };
      });

      // 跨阶段时，原阶段剩余活动也重排序避免空隔
      if (crossStage && parentStage) {
        const oldSiblings = nds
          .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === parentStage.id)
          .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
        oldSiblings.forEach((n, i) => {
          positionsToWrite[n.id] = { x: 20, y: HEADER_H + i * SLOT_H };
        });
      }

      return nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, parentNode: newParentId, position: positionsToWrite[n.id] };
        }
        if (positionsToWrite[n.id]) {
          return { ...n, position: positionsToWrite[n.id] };
        }
        if (n.type === 'stage' && n.data?.isDropTarget) {
          return { ...n, data: { ...n.data, isDropTarget: false } };
        }
        return n;
      });
    });

    // 持久化
    if (needPromote) {
      const next = { ...assessment };
      const promotions = new Set(assessment.stagePromotions || []);
      promotions.add(node.id);
      next.stagePromotions = [...promotions];
      if (next.parentOverrides && next.parentOverrides[node.id]) {
        const { [node.id]: _omit, ...rest } = next.parentOverrides;
        next.parentOverrides = rest;
      }
      next.flowPositions = {
        ...(assessment.flowPositions || {}),
        ...positionsToWrite,
        [node.id]: { x: promoteAbsX, y: promoteAbsY },
      };
      // 注意：promote 会改变节点 type（activity → stage）与 parentNode 关系，
      // 必须让 useEffect 重新同步 initialNodes，所以这里不能跳过同步。
      onUpdateAssessment(next);
      message.success(`已将「${node.data?.label || '活动'}」提升为阶段容器`);
      return;
    }

    const next = { ...assessment };
    next.flowPositions = { ...(next.flowPositions || {}), ...positionsToWrite };
    if (crossStage) {
      next.parentOverrides = { ...(next.parentOverrides || {}), [node.id]: newParentId };
      message.success(`已归属到「${hitStageLabel || '新阶段'}」并插入到对应位置`);
    }
    skipNextSyncRef.current = true;
    onUpdateAssessment(next);
  }, [assessment, isDraft, onUpdateAssessment, setNodes, findHitStage]);

  // 连线串联校验：仅允许 activity ↔ activity，且同阶段内，且每个节点只能一进一出
  const validateActivityConnection = useCallback((params, currentEdges) => {
    const { source, target } = params || {};
    if (!source || !target || source === target) return { ok: false, reason: '不允许连接自身' };
    const allNodes = rfInstance?.getNodes ? rfInstance.getNodes() : nodes;
    const sNode = allNodes.find((n) => n.id === source);
    const tNode = allNodes.find((n) => n.id === target);
    if (!sNode || !tNode) return { ok: false, reason: '节点不存在' };
    if (sNode.type !== 'activity' || tNode.type !== 'activity') {
      return { ok: false, reason: '连线仅允许在活动卡片之间' };
    }
    if (sNode.parentNode !== tNode.parentNode) {
      return { ok: false, reason: '仅允许同一阶段内的活动串联' };
    }
    const eds = currentEdges || edges;
    // 串联：source 只能有一个出边；target 只能有一个入边
    if (eds.some((e) => e.source === source)) return { ok: false, reason: '该活动已有下游连线（只能串联）' };
    if (eds.some((e) => e.target === target)) return { ok: false, reason: '该活动已有上游连线（只能串联）' };
    // 防环：检查从 target 出发能否回到 source
    const visited = new Set();
    const stack = [target];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === source) return { ok: false, reason: '不允许产生环形依赖' };
      if (visited.has(cur)) continue;
      visited.add(cur);
      eds.filter((e) => e.source === cur).forEach((e) => stack.push(e.target));
    }
    return { ok: true };
  }, [rfInstance, nodes, edges]);

  const isValidConnection = useCallback((params) => {
    if (!isDraft) return false;
    return validateActivityConnection(params, edges).ok;
  }, [isDraft, validateActivityConnection, edges]);

  // 添加新连线
  const onConnect = useCallback((params) => {
    if (!isDraft) return;
    const check = validateActivityConnection(params, edges);
    if (!check.ok) {
      message.warning(check.reason);
      return;
    }
    const newEdge = {
      ...params,
      id: `${params.source}->${params.target}-${Date.now()}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#52c41a', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#52c41a' },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    const flowEdges = [...(assessment.flowEdges || []), { id: newEdge.id, source: newEdge.source, target: newEdge.target }];
    onUpdateAssessment({ ...assessment, flowEdges });
    message.success('已新建串联连线，点击连线可配置进入条件');
  }, [assessment, isDraft, onUpdateAssessment, setEdges, validateActivityConnection, edges]);

  // 节点点击 -> 打开右侧属性编辑面板
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'activity') {
      setSelectedActivityKey(node.id);
      setSelectedStageKey(null);
    } else if (node.type === 'stage') {
      setSelectedActivityKey(null);
      setSelectedStageKey(node.id);
    }
  }, []);

  // 点击画布空白 -> 关闭属性面板
  const onPaneClick = useCallback(() => {
    setSelectedActivityKey(null);
    setSelectedStageKey(null);
    setSelectedEdgeId(null);
  }, []);

  // 更新某个活动的 rule 字段（属性面板专用）
  const handleRuleChange = useCallback((folderKey, field, value) => {
    const folder = resources.find((r) => r.key === folderKey);
    const rules = [...(assessment.rules || [])];
    const idx = rules.findIndex((r) => r.folderKey === folderKey);
    if (idx >= 0) {
      rules[idx] = { ...rules[idx], [field]: value };
    } else {
      rules.push({
        key: `ar_${Date.now()}`,
        folderKey,
        folderName: folder?.name || '',
        activityType: '',
        weight: 0,
        passCondition: { metric: '完成率', op: '>=', value: 80 },
        required: true,
        [field]: value,
      });
    }
    onUpdateAssessment({ ...assessment, rules });
  }, [assessment, onUpdateAssessment, resources]);

  // 单击连线 -> 仅选中（弹出顶部连线工具条，不开 Modal，避免焦点被锁在 Modal 内导致 Del 键失效）
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (!isDraft) {
      message.info('当前版本不可编辑');
      return;
    }
    setSelectedEdgeId(edge.id);
    setSelectedActivityKey(null);
    setSelectedStageKey(null);
  }, [isDraft]);

  // 双击连线 -> 打开进入规则 Modal
  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (!isDraft) {
      message.info('当前版本不可编辑');
      return;
    }
    const existing = (assessment.edgeRules || {})[edge.id];
    setRuleForm(existing ? { ...DEFAULT_RULE, ...existing } : { ...DEFAULT_RULE });
    setEditingEdge(edge);
  }, [assessment, isDraft]);

  // 工具条「配置进入规则」按钮
  const handleEditSelectedEdgeRule = useCallback(() => {
    if (!selectedEdgeId) return;
    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return;
    const existing = (assessment.edgeRules || {})[edge.id];
    setRuleForm(existing ? { ...DEFAULT_RULE, ...existing } : { ...DEFAULT_RULE });
    setEditingEdge(edge);
  }, [selectedEdgeId, edges, assessment]);

  // 工具条「删除连线」按钮
  const handleDeleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return;
    const next = { ...assessment };
    let deletedEdges = [...(next.deletedEdges || [])];
    let flowEdges = [...(next.flowEdges || [])];
    const isCustom = flowEdges.some((e) => e.id === edge.id);
    if (isCustom) {
      flowEdges = flowEdges.filter((e) => e.id !== edge.id);
    } else if (!deletedEdges.includes(edge.id)) {
      deletedEdges.push(edge.id);
    }
    let edgeRulesMap = { ...(next.edgeRules || {}) };
    if (edgeRulesMap[edge.id]) {
      const { [edge.id]: _omit, ...rest } = edgeRulesMap;
      edgeRulesMap = rest;
    }
    next.deletedEdges = deletedEdges;
    next.flowEdges = flowEdges;
    next.edgeRules = edgeRulesMap;
    onUpdateAssessment(next);
    setSelectedEdgeId(null);
    message.success('已删除连线');
  }, [selectedEdgeId, edges, assessment, onUpdateAssessment]);

  // 保存进入规则
  const handleSaveRule = () => {
    if (!editingEdge) return;
    const next = { ...assessment };
    const edgeRules = { ...(next.edgeRules || {}) };
    if (ruleForm.type === 'none') {
      delete edgeRules[editingEdge.id];
    } else {
      edgeRules[editingEdge.id] = { ...ruleForm };
    }
    next.edgeRules = edgeRules;
    onUpdateAssessment(next);
    setEditingEdge(null);
    message.success('已保存进入规则');
  };

  // ReactFlow 默认 Del 键删除回调：将删除的边写回 assessment
  // （节点设了 deletable:false，不会被误删）
  const onEdgesDelete = useCallback((deleted) => {
    if (!isDraft) return;
    if (!deleted || deleted.length === 0) return;
    const next = { ...assessment };
    let deletedEdges = [...(next.deletedEdges || [])];
    let flowEdges = [...(next.flowEdges || [])];
    let edgeRules = { ...(next.edgeRules || {}) };
    deleted.forEach((edge) => {
      const isCustom = flowEdges.some((e) => e.id === edge.id);
      if (isCustom) {
        flowEdges = flowEdges.filter((e) => e.id !== edge.id);
      } else if (!deletedEdges.includes(edge.id)) {
        deletedEdges.push(edge.id);
      }
      if (edgeRules[edge.id]) {
        const { [edge.id]: _omit, ...rest } = edgeRules;
        edgeRules = rest;
      }
    });
    next.deletedEdges = deletedEdges;
    next.flowEdges = flowEdges;
    next.edgeRules = edgeRules;
    onUpdateAssessment(next);
    message.success(`已删除 ${deleted.length} 条连线`);
  }, [assessment, isDraft, onUpdateAssessment]);

  // 删除连线
  const handleDeleteEdge = () => {
    if (!editingEdge) return;
    const edgeId = editingEdge.id;
    const next = { ...assessment };
    // 1) 自定义边：从 flowEdges 中移除
    const isCustom = (assessment.flowEdges || []).some((e) => e.id === edgeId);
    if (isCustom) {
      next.flowEdges = (assessment.flowEdges || []).filter((e) => e.id !== edgeId);
    } else {
      // 内置边：加入 deletedEdges
      next.deletedEdges = [...(assessment.deletedEdges || []), edgeId];
    }
    // 2) 同时清除该边的规则
    if (next.edgeRules && next.edgeRules[edgeId]) {
      const { [edgeId]: _, ...rest } = next.edgeRules;
      next.edgeRules = rest;
    }
    onUpdateAssessment(next);
    setEditingEdge(null);
    message.success('已删除连线');
  };

  // 一键清空画布
  const handleClearCanvas = () => {
    if (!isDraft) {
      message.info('当前版本不可编辑');
      return;
    }
    const allKeys = resources.filter((r) => r.isFolder).map((r) => r.key);
    const next = {
      ...assessment,
      deletedNodes: allKeys,
      flowEdges: [],
      edgeRules: {},
      deletedEdges: [],
      flowPositions: {},
      parentOverrides: {},
      customStages: [],
      stagePromotions: [],
    };
    setSelectedActivityKey(null);
    setSelectedStageKey(null);
    onUpdateAssessment(next);
    message.success('已清空画布，可从左侧资料区拖入节点重新组装');
  };

  // 拖拽资料到画布
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const onDragLeave = useCallback((event) => {
    // 仅当鼠标离开 wrapper 范围才取消高亮
    if (wrapperRef.current && !wrapperRef.current.contains(event.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (!isDraft) {
      message.info('当前版本不可编辑');
      return;
    }

    // 计算 drop 在画布坐标系中的位置
    let position = { x: 0, y: 0 };
    if (rfInstance && rfInstance.screenToFlowPosition) {
      position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    } else if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      position = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    // 优先处理工具栏拖入的工具（如：阶段容器）
    const toolRaw = event.dataTransfer.getData('application/assessment-tool');
    if (toolRaw) {
      let tool;
      try { tool = JSON.parse(toolRaw); } catch { return; }
      if (tool?.tool === 'stage') {
        const newKey = `cs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newCustom = { key: newKey, name: '新阶段' };
        const next = { ...assessment };
        next.customStages = [...(assessment.customStages || []), newCustom];
        next.flowPositions = { ...(assessment.flowPositions || {}), [newKey]: position };
        onUpdateAssessment(next);
        setSelectedActivityKey(null);
        setSelectedStageKey(newKey);
        message.success('已新增空阶段容器，可在右侧面板修改属性');
        return;
      }
    }

    // 其次处理从左侧资料区拖入的资源项
    const raw = event.dataTransfer.getData('application/assessment-resource');
    if (!raw) return;
    let payload;
    try { payload = JSON.parse(raw); } catch { return; }
    if (!payload || !payload.key) return;

    const next = { ...assessment };
    // 1) 若该节点曾被软删除（deletedNodes），恢复它
    if (Array.isArray(next.deletedNodes) && next.deletedNodes.includes(payload.key)) {
      next.deletedNodes = next.deletedNodes.filter((k) => k !== payload.key);
    }

    // 2) 检测落点是否命中某个阶段容器（除了文件夹自身如果已是 stage）
    let hitStage = null;
    if (payload.isFolder && rfInstance?.getNodes) {
      const allNodes = rfInstance.getNodes();
      const stageNodes = allNodes.filter((n) => n.type === 'stage' && n.id !== payload.key);
      for (const s of stageNodes) {
        const sx = s.position.x;
        const sy = s.position.y;
        const sw = s.style?.width ?? 300;
        const sh = s.style?.height ?? 160;
        if (position.x >= sx && position.x <= sx + sw && position.y >= sy && position.y <= sy + sh) {
          hitStage = s;
          break;
        }
      }
    }

    // 3) 文件夹角色判定：命中阶段容器 -> 作为活动；未命中 -> 作为阶段
    const positionsBatch = {};
    if (payload.isFolder) {
      // 为任何层级文件夹初始化一条默认规则（作为活动时需要）
      const exists = (assessment.rules || []).some((r) => r.folderKey === payload.key);
      if (!exists) {
        next.rules = [
          ...(assessment.rules || []),
          {
            key: `ar_${Date.now()}`,
            folderKey: payload.key,
            folderName: payload.name,
            activityType: '',
            weight: 0,
            passCondition: { metric: '完成率', op: '>=', value: 80 },
            required: true,
          },
        ];
      }

      if (hitStage) {
        // 3a) 作为活动：写 parentOverrides + 重排序同阶段所有活动
        const HEADER_H = 60;
        const SLOT_H = 200;
        const localY = position.y - hitStage.position.y;
        const allNodes = rfInstance.getNodes();
        const siblings = allNodes
          .filter((n) => n.type === 'activity' && n.id !== payload.key && n.parentNode === hitStage.id)
          .sort((a, b) => (a.position.y ?? 0) - (b.position.y ?? 0));
        let insertIdx = siblings.findIndex((s) => localY < (s.position.y ?? 0) + SLOT_H / 2);
        if (insertIdx === -1) insertIdx = siblings.length;
        const order = [
          ...siblings.slice(0, insertIdx),
          { id: payload.key },
          ...siblings.slice(insertIdx),
        ];
        order.forEach((n, i) => {
          positionsBatch[n.id] = { x: 20, y: HEADER_H + i * SLOT_H };
        });
        next.parentOverrides = { ...(next.parentOverrides || {}), [payload.key]: hitStage.id };
        // 若该文件夹之前被提升为阶段，现在恢复为活动
        if (Array.isArray(next.stagePromotions)) {
          next.stagePromotions = next.stagePromotions.filter((k) => k !== payload.key);
        }
      } else if (payload.parentKey !== null) {
        // 3b) 未命中且不是一级目录：提升为阶段（一级目录本身已是 builtin stage）
        const promotions = new Set(assessment.stagePromotions || []);
        promotions.add(payload.key);
        next.stagePromotions = [...promotions];
        // 解除其作为活动的归属
        if (next.parentOverrides && next.parentOverrides[payload.key]) {
          const { [payload.key]: _omit, ...rest } = next.parentOverrides;
          next.parentOverrides = rest;
        }
      }
      // 一级目录未命中：仅写 flowPositions（保持 builtin stage 身份）
    }

    // 4) 持久化位置：命中阶段使用批量重排序位置，否则使用画布绝对坐标
    if (Object.keys(positionsBatch).length > 0) {
      next.flowPositions = { ...(next.flowPositions || {}), ...positionsBatch };
    } else {
      next.flowPositions = { ...(next.flowPositions || {}), [payload.key]: position };
    }

    onUpdateAssessment(next);
    if (hitStage) {
      message.success(`已落入「${hitStage.data?.label || '阶段'}」作为活动`);
    } else if (payload.isFolder && payload.parentKey !== null) {
      message.success(`已将「${payload.name}」提升为阶段容器`);
    } else {
      message.success(`已放置“${payload.name}”到画布`);
    }
  }, [assessment, isDraft, onUpdateAssessment, rfInstance]);

  return (
    <div
      className={`flow-view-wrapper ${isDragOver ? 'flow-view-wrapper-dragover' : ''}`}
      ref={wrapperRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flow-view-tip">
        <Tooltip title="拖动节点调整位置；拖拽节点右侧圆点到目标节点新增关联；点击活动节点打开详情；点击连线配置进入规则或删除；从左侧资料区拖拽项目到画布定位节点">
          <span style={{ color: '#1677ff', cursor: 'help' }}>💡 操作说明</span>
        </Tooltip>
      </div>
      <div className="flow-view-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">工具</span>
          <div
            className={`flow-tool-item ${!isDraft ? 'disabled' : ''}`}
            draggable={isDraft}
            onDragStart={(e) => {
              if (!isDraft) { e.preventDefault(); return; }
              e.dataTransfer.setData(
                'application/assessment-tool',
                JSON.stringify({ tool: 'stage' })
              );
              e.dataTransfer.effectAllowed = 'move';
            }}
            title="拖拽到画布创建一个空阶段容器"
          >
            <FolderOutlined style={{ color: '#1677ff' }} />
            <span>阶段容器</span>
          </div>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <Popconfirm
            title="确定清空画布吗？"
            description="将移除当前画布上的所有节点、连线及进入规则。可重新从左侧拖入资料重建。"
            okText="确定清空"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={handleClearCanvas}
            disabled={!isDraft}
          >
            <Button
              size="small"
              danger
              icon={<ClearOutlined />}
              disabled={!isDraft}
            >
              清空画布
            </Button>
          </Popconfirm>
        </div>
        {selectedEdgeId && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-group">
              <span className="toolbar-label">已选中连线</span>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={handleEditSelectedEdgeRule}
                disabled={!isDraft}
              >
                配置进入规则
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSelectedEdge}
                disabled={!isDraft}
              >
                删除连线
              </Button>
            </div>
          </>
        )}
      </div>
      {isDragOver && (
        <div className="flow-drop-hint">松开鼠标以在此处放置资料</div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={isDraft ? ['Delete', 'Backspace'] : null}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneClick={onPaneClick}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#f0f0f0" gap={16} />
        <Controls />
        <MiniMap nodeColor={(n) => n.type === 'stage' ? '#1677ff' : '#52c41a'} pannable zoomable />
      </ReactFlow>

      {selectedActivityKey && (() => {
        const folder = resources.find((r) => r.key === selectedActivityKey);
        if (!folder) return null;
        const rule = (assessment.rules || []).find((r) => r.folderKey === selectedActivityKey) || {
          folderKey: selectedActivityKey,
          folderName: folder.name,
          activityType: '',
          weight: 0,
          passCondition: { metric: '完成率', op: '>=', value: 80 },
          required: true,
        };
        const pc = rule.passCondition || { metric: '完成率', op: '>=', value: 80 };
        const updatePc = (patch) => handleRuleChange(selectedActivityKey, 'passCondition', { ...pc, ...patch });
        return (
          <div className="flow-activity-inspector" onMouseDown={(e) => e.stopPropagation()}>
            <div className="inspector-header">
              <div className="inspector-title">
                <EditOutlined style={{ color: '#1677ff' }} />
                <span>活动属性</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedActivityKey(null)}
              />
            </div>
            <div className="inspector-body">
              <div className="inspector-field">
                <label>活动名称</label>
                <Input value={folder.name} disabled />
              </div>
              <div className="inspector-field">
                <label>活动类型</label>
                <Select
                  value={rule.activityType ?? ''}
                  disabled={!isDraft}
                  style={{ width: '100%' }}
                  onChange={(v) => handleRuleChange(selectedActivityKey, 'activityType', v)}
                  options={[
                    { label: '请选择', value: '' },
                    { label: '视频课', value: 'video' },
                    { label: '直播课', value: 'live' },
                    { label: '考试', value: 'exam' },
                    { label: '线下集训', value: 'offline' },
                    { label: '其他', value: 'other' },
                  ]}
                />
              </div>
              <div className="inspector-field">
                <label>权重（%）</label>
                <InputNumber
                  min={0}
                  max={100}
                  value={rule.weight ?? 0}
                  disabled={!isDraft}
                  style={{ width: '100%' }}
                  onChange={(v) => handleRuleChange(selectedActivityKey, 'weight', v || 0)}
                  addonAfter="%"
                />
              </div>
              <div className="inspector-field">
                <label>是否必修</label>
                <Radio.Group
                  value={rule.required ? 'yes' : 'no'}
                  disabled={!isDraft}
                  onChange={(e) => handleRuleChange(selectedActivityKey, 'required', e.target.value === 'yes')}
                >
                  <Radio value="yes">必修</Radio>
                  <Radio value="no">选修</Radio>
                </Radio.Group>
              </div>
              <Divider style={{ margin: '12px 0' }}>通过条件</Divider>
              <div className="inspector-field">
                <label>指标</label>
                <Select
                  value={pc.metric}
                  disabled={!isDraft}
                  style={{ width: '100%' }}
                  onChange={(v) => updatePc({ metric: v })}
                  options={[
                    { label: '完成率', value: '完成率' },
                    { label: '得分', value: '得分' },
                    { label: '出勤次数', value: '出勤次数' },
                    { label: '学习时长', value: '学习时长' },
                  ]}
                />
              </div>
              <div className="inspector-row-2">
                <div className="inspector-field">
                  <label>操作符</label>
                  <Select
                    value={pc.op}
                    disabled={!isDraft}
                    style={{ width: '100%' }}
                    onChange={(v) => updatePc({ op: v })}
                    options={[
                      { label: '≥', value: '>=' },
                      { label: '>', value: '>' },
                      { label: '=', value: '=' },
                      { label: '≤', value: '<=' },
                    ]}
                  />
                </div>
                <div className="inspector-field">
                  <label>阈值</label>
                  <InputNumber
                    min={0}
                    value={pc.value ?? 0}
                    disabled={!isDraft}
                    style={{ width: '100%' }}
                    onChange={(v) => updatePc({ value: v ?? 0 })}
                  />
                </div>
              </div>
              {!isDraft && (
                <div className="inspector-readonly-tip">当前版本不可编辑，仅可查看</div>
              )}
            </div>
          </div>
        );
      })()}

      {selectedStageKey && !selectedActivityKey && (() => {
        const builtin = resources.find((r) => r.key === selectedStageKey && r.isFolder && r.parentKey === null);
        const custom = (assessment.customStages || []).find((cs) => cs.key === selectedStageKey);
        const isPromoted = (assessment.stagePromotions || []).includes(selectedStageKey);
        const promotedRes = isPromoted ? resources.find((r) => r.key === selectedStageKey && r.isFolder) : null;
        if (!builtin && !custom && !promotedRes) return null;
        const isCustom = !!custom;
        const stageName = isCustom ? custom.name : (promotedRes ? promotedRes.name : builtin.name);
        // 统计该阶段内活动数量（含 parentOverrides）
        const overrides = assessment.parentOverrides || {};
        const deletedNodeSet = new Set(assessment.deletedNodes || []);
        const promotedSet = new Set(assessment.stagePromotions || []);
        const activitiesInStage = resources.filter((r) => {
          if (!r.isFolder || r.parentKey === null) return false;
          if (deletedNodeSet.has(r.key)) return false;
          if (promotedSet.has(r.key)) return false;
          const overridden = overrides[r.key];
          const stageKey = overridden || r.parentKey;
          return stageKey === selectedStageKey;
        });
        const handleStageNameChange = (v) => {
          if (!isCustom) return;
          const customStages = (assessment.customStages || []).map((cs) =>
            cs.key === selectedStageKey ? { ...cs, name: v } : cs
          );
          onUpdateAssessment({ ...assessment, customStages });
        };
        const handleDeleteCustomStage = () => {
          if (!isCustom) return;
          const customStages = (assessment.customStages || []).filter((cs) => cs.key !== selectedStageKey);
          // 清理该阶段的 flowPositions、指向其的 parentOverrides
          const flowPositions = { ...(assessment.flowPositions || {}) };
          delete flowPositions[selectedStageKey];
          const parentOverrides = { ...(assessment.parentOverrides || {}) };
          Object.keys(parentOverrides).forEach((k) => {
            if (parentOverrides[k] === selectedStageKey) delete parentOverrides[k];
          });
          onUpdateAssessment({ ...assessment, customStages, flowPositions, parentOverrides });
          setSelectedStageKey(null);
          message.success('已删除阶段容器');
        };
        const handleRevokePromotion = () => {
          if (!isPromoted) return;
          const stagePromotions = (assessment.stagePromotions || []).filter((k) => k !== selectedStageKey);
          // 清理该阶段的位置与其下所有活动的 parentOverrides
          const flowPositions = { ...(assessment.flowPositions || {}) };
          delete flowPositions[selectedStageKey];
          const parentOverrides = { ...(assessment.parentOverrides || {}) };
          Object.keys(parentOverrides).forEach((k) => {
            if (parentOverrides[k] === selectedStageKey) delete parentOverrides[k];
          });
          onUpdateAssessment({ ...assessment, stagePromotions, flowPositions, parentOverrides });
          setSelectedStageKey(null);
          message.success('已取消阶段提升');
        };
        const stageTypeLabel = isCustom
          ? '自定义阶段（画布创建）'
          : isPromoted
            ? '提升阶段（资料子目录）'
            : '资料区一级目录阶段';
        return (
          <div className="flow-activity-inspector" onMouseDown={(e) => e.stopPropagation()}>
            <div className="inspector-header">
              <div className="inspector-title">
                <FolderOutlined style={{ color: '#1677ff' }} />
                <span>阶段属性</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedStageKey(null)}
              />
            </div>
            <div className="inspector-body">
              <div className="inspector-field">
                <label>阶段名称</label>
                <Input
                  value={stageName}
                  disabled={!isDraft || !isCustom}
                  onChange={(e) => handleStageNameChange(e.target.value)}
                  placeholder="输入阶段名称"
                />
                {!isCustom && (
                  <div className="inspector-readonly-tip">源于资料区的阶段，名称请到资料区修改</div>
                )}
              </div>
              <div className="inspector-field">
                <label>阶段类型</label>
                <Input value={stageTypeLabel} disabled />
              </div>
              <div className="inspector-field">
                <label>包含活动数</label>
                <Input value={`${activitiesInStage.length} 个`} disabled />
              </div>
              {isCustom && isDraft && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Popconfirm
                    title="确定删除该阶段容器吗？"
                    description="如果该阶段内有归属活动，活动将回到原资料区阶段。"
                    okText="确定删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDeleteCustomStage}
                  >
                    <Button danger icon={<DeleteOutlined />} block>删除阶段容器</Button>
                  </Popconfirm>
                </>
              )}
              {isPromoted && isDraft && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Popconfirm
                    title="取消提升为阶段？"
                    description="该阶段内的活动会同时从画布移除，可重新从资料区拖入。"
                    okText="确定取消"
                    cancelText="取消"
                    onConfirm={handleRevokePromotion}
                  >
                    <Button block>取消阶段提升</Button>
                  </Popconfirm>
                </>
              )}
              {!isDraft && (
                <div className="inspector-readonly-tip">当前版本不可编辑，仅可查看</div>
              )}
            </div>
          </div>
        );
      })()}

      <Modal
        open={!!editingEdge}
        title="配置进入规则"
        onCancel={() => setEditingEdge(null)}
        width={460}
        footer={[
          <Button key="del" danger icon={<DeleteOutlined />} onClick={handleDeleteEdge}>
            删除连线
          </Button>,
          <Button key="cancel" onClick={() => setEditingEdge(null)}>取消</Button>,
          <Button key="ok" type="primary" onClick={handleSaveRule}>保存</Button>,
        ]}
      >
        {editingEdge && (
          <div className="edge-rule-form">
            <div className="edge-rule-info">
              连线：<code>{editingEdge.source}</code> → <code>{editingEdge.target}</code>
            </div>
            <div className="edge-rule-row">
              <div className="edge-rule-label">规则类型</div>
              <Radio.Group
                value={ruleForm.type}
                onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
              >
                <Radio value="none">无限制</Radio>
                <Radio value="completion">完成率达标</Radio>
                <Radio value="score">得分达标</Radio>
                <Radio value="all-passed">全部活动通过</Radio>
                <Radio value="custom">自定义</Radio>
              </Radio.Group>
            </div>
            {(ruleForm.type === 'completion' || ruleForm.type === 'score') && (
              <div className="edge-rule-row">
                <div className="edge-rule-label">阈值</div>
                <InputNumber
                  min={0}
                  max={ruleForm.type === 'completion' ? 100 : 1000}
                  value={ruleForm.threshold}
                  onChange={(v) => setRuleForm({ ...ruleForm, threshold: v ?? 0 })}
                  addonAfter={ruleForm.type === 'completion' ? '%' : '分'}
                  style={{ width: 160 }}
                />
              </div>
            )}
            {ruleForm.type === 'custom' && (
              <div className="edge-rule-row">
                <div className="edge-rule-label">规则说明</div>
                <Input.TextArea
                  value={ruleForm.note}
                  onChange={(e) => setRuleForm({ ...ruleForm, note: e.target.value })}
                  placeholder="例如：必须先完成线下打卡且测验通过"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AssessmentFlowView;
