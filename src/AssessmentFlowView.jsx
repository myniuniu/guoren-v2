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
import { InputNumber, Select, Tooltip, Modal, Input, Button, Radio, message, Popconfirm, Divider, Dropdown } from 'antd';
import { FolderOutlined, AppstoreOutlined, DeleteOutlined, ClearOutlined, CloseOutlined, EditOutlined, FileOutlined, DatabaseOutlined, CopyOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, MoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';
import './AssessmentFlowView.css';

const activityTypeColor = { video: '#1677ff', live: '#13c2c2', exam: '#ff4d4f', offline: '#faad14', other: '#8c8c8c', '': '#bfbfbf' };

// 活动类型中文名
 const activityTypeLabelMap = { video: '视频课', live: '直播课', exam: '考试', offline: '线下集训', other: '其他' };
// 活动类型 -> 允许绑定的资料 type 列表（null = 不限制）
const allowedResourceTypeMap = {
  video: ['video'],
  live: ['file', 'video', 'activity'],
  exam: ['exam'],
  offline: ['activity'],
  other: null,
  '': null,
};
const resourceTypeLabelMap = { video: '视频', exam: '考试', activity: '活动', file: '文件', survey: '调查', vote: '投票', register: '报名' };
// 资料 type -> 活动 activityType 默认映射（单件场景）
const resourceTypeToActivityType = { video: 'video', exam: 'exam', file: 'live', activity: 'offline', survey: 'other', vote: 'other', register: 'other' };
// 根据资料 type 集合推断活动类型：单一类型取默认映射；多类型都在 live 允许集则归为 live；其余归为 other
function inferActivityType(resourceTypes) {
  if (!resourceTypes || resourceTypes.length === 0) return '';
  const set = new Set(resourceTypes);
  if (set.size === 1) {
    return resourceTypeToActivityType[[...set][0]] || 'other';
  }
  const liveAllowed = ['file', 'video', 'activity'];
  if ([...set].every((t) => liveAllowed.includes(t))) return 'live';
  return 'other';
}
// 收集资料项的叶子文件 type 集合（文件夹 -> 递归；文件 -> 自身 type）
function collectResourceTypes(payload, resources) {
  if (!payload) return [];
  if (!payload.isFolder) return payload.type ? [payload.type] : [];
  const types = new Set();
  const visit = (parentKey) => {
    resources.forEach((r) => {
      if (r.parentKey !== parentKey) return;
      if (r.isFolder) visit(r.key);
      else if (r.type) types.add(r.type);
    });
  };
  visit(payload.key);
  return [...types];
}

// 阶段节点（顶级文件夹） - 容器式，包含活动子节点
function StageNode({ data, selected }) {
  const stop = (e) => e.stopPropagation();
  const stageMenuItems = [
    { key: 'addActivity', icon: <PlusOutlined />, label: '添加活动容器' },
    { type: 'divider' },
    { key: 'deleteStage', icon: <DeleteOutlined />, danger: true, label: '删除阶段容器' },
  ];
  const handleStageMenuClick = ({ key, domEvent }) => {
    domEvent?.stopPropagation?.();
    if (key === 'addActivity') data.onAddActivity?.();
    if (key === 'deleteStage') {
      Modal.confirm({
        title: '确认删除该阶段容器？',
        content: `「${data.label || '阶段'}」将从当前考核画布中删除，相关归属关系会一并清理。`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => data.onDelete?.(),
      });
    }
  };
  return (
    <div className={`flow-stage-container ${data.isDropTarget ? 'is-drop-target' : ''} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#1677ff' }} />
      <div className="flow-stage-header">
        <FolderOutlined style={{ color: '#1677ff' }} />
        <span className="flow-stage-title">{data.label}</span>
        <span className="flow-stage-meta-inline">{data.activityCount} 个活动 · 总权重 {data.totalWeight}%</span>
      </div>
      {data.isDraft && (
        <div className="flow-stage-menu-trigger nodrag nopan" onMouseDown={stop} onClick={stop}>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{ items: stageMenuItems, onClick: handleStageMenuClick }}
            getPopupContainer={() => document.body}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="flow-stage-more-btn"
              onClick={stop}
              title="阶段操作"
            />
          </Dropdown>
        </div>
      )}
      {data.isDropTarget && (
        <div className="flow-stage-snap-tip">松开鼠标以吸附到槽位</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#1677ff' }} />
    </div>
  );
}

// 活动节点（子文件夹）
function ActivityNode({ data, selected }) {
  const color = activityTypeColor[data.activityType ?? ''] || activityTypeColor.other;
  const stop = (e) => e.stopPropagation();
  const activityMenuItems = [
    { key: 'addAbove', icon: <PlusOutlined />, label: '上方添加活动' },
    { key: 'addBelow', icon: <PlusOutlined />, label: '下方添加活动' },
    { type: 'divider' },
    {
      key: 'deleteActivity',
      icon: <DeleteOutlined />,
      danger: true,
      label: data.isCustomActivity ? '删除活动容器' : '删除活动',
    },
  ];
  const handleActivityMenuClick = ({ key, domEvent }) => {
    domEvent?.stopPropagation?.();
    if (key === 'addAbove') data.onAddAbove?.();
    if (key === 'addBelow') data.onAddBelow?.();
    if (key === 'deleteActivity') {
      Modal.confirm({
        title: data.isCustomActivity ? '确认删除该活动容器？' : '确认删除该活动？',
        content: data.isCustomActivity
          ? `「${data.label || '活动'}」及其已绑定资料、规则将被删除。`
          : `「${data.label || '活动'}」将从当前考核画布移除，资料仍会保留。`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => data.onDelete?.(),
      });
    }
  };
  return (
    <div
      className={`flow-activity-node ${selected ? 'is-selected' : ''}`}
      style={selected ? { borderColor: '#1677ff', borderWidth: 2 } : undefined}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, opacity: 0, pointerEvents: 'none' }} isConnectable={false} />
      <div className="flow-activity-header">
        <div className="flow-activity-header-main">
          <AppstoreOutlined style={{ color }} />
          <span className="flow-activity-title">{data.label}</span>
        </div>
        {data.isDraft && (
          <div className="flow-activity-header-actions nodrag nopan" onMouseDown={stop} onClick={stop}>
            <Tooltip title="上移">
              <Button
                type="text"
                size="small"
                className="flow-activity-sort-btn"
                icon={<ArrowUpOutlined />}
                disabled={!data.canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onMoveUp?.();
                }}
              />
            </Tooltip>
            <Tooltip title="下移">
              <Button
                type="text"
                size="small"
                className="flow-activity-sort-btn"
                icon={<ArrowDownOutlined />}
                disabled={!data.canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onMoveDown?.();
                }}
              />
            </Tooltip>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{ items: activityMenuItems, onClick: handleActivityMenuClick }}
              getPopupContainer={() => document.body}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className="flow-activity-more-btn"
                onClick={stop}
                title="活动操作"
              />
            </Dropdown>
          </div>
        )}
      </div>
      <div className="flow-activity-body">
        <div className="flow-row">
          <span className="flow-row-label">类型</span>
          <Select
            className="nodrag nopan"
            size="small"
            style={{ width: 90 }}
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
            style={{ width: 72 }}
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
            style={{ width: 72 }}
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
      {(data.isCustomActivity || (data.boundResources && data.boundResources.length > 0)) && (
        <div className="flow-activity-binding">
          <div className="flow-activity-binding-title">已绑定资料 · {data.boundResources?.length || 0}</div>
          {(!data.boundResources || data.boundResources.length === 0) ? (
            <div className="flow-activity-binding-empty">拖入资料以绑定</div>
          ) : (
            <div className="flow-activity-binding-list nodrag nopan" onMouseDown={stop} onWheelCapture={stop}>
              {data.boundResources.map((b) => (
                <div key={b.key} className="flow-activity-binding-item" title={b.name}>
                  {b.isFolder ? <FolderOutlined /> : <FileOutlined />}
                  <span className="flow-activity-binding-item-name">{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color, opacity: 0, pointerEvents: 'none' }} isConnectable={false} />
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
const DEFAULT_ACTIVITY_NAME = '新活动';
const STAGE_NODE_WIDTH = 240;
const ACTIVITY_NODE_X = 1;
const ACTIVITY_NODE_WIDTH = STAGE_NODE_WIDTH - ACTIVITY_NODE_X * 2;
const ACTIVITY_NODE_TOP_GAP = 6;
const STAGE_HEADER_H = 54;
const ACTIVITY_SLOT_H = 150;

function makeFlowKey(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function createDefaultActivityRule(folderKey, folderName = DEFAULT_ACTIVITY_NAME) {
  return {
    key: makeFlowKey('ar'),
    folderKey,
    folderName,
    activityType: '',
    weight: 0,
    passCondition: { metric: '完成率', op: '>=', value: 80 },
    required: true,
  };
}

export function createResourcePayload(resource) {
  return {
    key: resource.key,
    name: resource.name,
    isFolder: !!resource.isFolder,
    parentKey: resource.parentKey ?? null,
    type: resource.type ?? null,
  };
}

export function evaluateResourceBindingAvailability({ resource, boundKeys, activityType, resources }) {
  if (boundKeys.has(resource.key)) {
    return { selectable: false, reason: '已绑定' };
  }

  const payload = createResourcePayload(resource);
  const resourceTypes = collectResourceTypes(payload, resources);
  if (resource.isFolder && resourceTypes.length === 0) {
    return { selectable: false, reason: '空文件夹不可绑定' };
  }

  const allowed = allowedResourceTypeMap[activityType ?? ''];
  if (!allowed) {
    return { selectable: true, reason: '' };
  }

  const invalidTypes = resourceTypes.filter((type) => !allowed.includes(type));
  if (invalidTypes.length > 0) {
    const invalidLabels = invalidTypes.map((type) => resourceTypeLabelMap[type] || type).join('、');
    return { selectable: false, reason: `当前活动类型不支持：${invalidLabels}` };
  }

  return { selectable: true, reason: '' };
}

function bindResourceToCustomActivity({ assessment, activityKey, payload, resources }) {
  const customActivities = assessment.customActivities || [];
  const activityIndex = customActivities.findIndex((item) => item.key === activityKey);
  if (activityIndex === -1) {
    return { ok: false, level: 'error', message: '未找到活动容器，无法绑定资料' };
  }

  const target = customActivities[activityIndex];
  if (target.key === payload.key) {
    return { ok: false, level: 'warning', message: '不能绑定自身' };
  }

  const exists = (target.boundResources || []).some((item) => item.key === payload.key);
  if (exists) {
    return { ok: false, level: 'info', message: `「${payload.name}」已绑定，无需重复` };
  }

  const targetRule = (assessment.rules || []).find((rule) => rule.folderKey === activityKey);
  const activityType = targetRule?.activityType ?? '';
  const allowed = allowedResourceTypeMap[activityType];
  const resourceTypes = collectResourceTypes(payload, resources);

  if (resourceTypes.length === 0 && payload.isFolder) {
    return { ok: false, level: 'warning', message: `「${payload.name}」为空文件夹，未包含可绑定的资料文件` };
  }

  let autoFilledType = null;
  if (!activityType) {
    autoFilledType = inferActivityType(resourceTypes);
  } else if (allowed) {
    const invalid = resourceTypes.filter((type) => !allowed.includes(type));
    if (invalid.length > 0) {
      const actLabel = activityTypeLabelMap[activityType] || activityType;
      const allowedLabels = allowed.map((type) => resourceTypeLabelMap[type] || type).join('、');
      const invalidLabels = invalid.map((type) => resourceTypeLabelMap[type] || type).join('、');
      const tip = payload.isFolder
        ? `「${payload.name}」包含不允许的资料类型：${invalidLabels}。该活动容器为「${actLabel}」，仅可绑定：${allowedLabels}`
        : `「${payload.name}」为${invalidLabels}类型，与当前活动「${actLabel}」不匹配，仅可绑定：${allowedLabels}`;
      return { ok: false, level: 'warning', message: tip };
    }
  }

  const nextCustomActivities = [...customActivities];
  nextCustomActivities[activityIndex] = {
    ...target,
    boundResources: [
      ...(target.boundResources || []),
      { key: payload.key, name: payload.name, isFolder: !!payload.isFolder },
    ],
  };

  const nextAssessment = { ...assessment, customActivities: nextCustomActivities };
  if (autoFilledType) {
    const rules = assessment.rules || [];
    const ruleIndex = rules.findIndex((rule) => rule.folderKey === activityKey);
    if (ruleIndex >= 0) {
      const nextRules = [...rules];
      nextRules[ruleIndex] = { ...nextRules[ruleIndex], activityType: autoFilledType };
      nextAssessment.rules = nextRules;
    } else {
      nextAssessment.rules = [
        ...rules,
        { ...createDefaultActivityRule(activityKey, target.name || DEFAULT_ACTIVITY_NAME), activityType: autoFilledType },
      ];
    }
  }

  const successMessage = autoFilledType
    ? `已绑定「${payload.name}」到「${target.name || '活动'}」，活动类型已自动设为「${activityTypeLabelMap[autoFilledType] || autoFilledType}」`
    : `已绑定「${payload.name}」到「${target.name || '活动'}」`;

  return { ok: true, nextAssessment, autoFilledType, message: successMessage };
}

function createCustomActivityInStage({ assessment, stageId, siblingIds = [], insertIndex = siblingIds.length }) {
  const newKey = makeFlowKey('ca');
  const safeIndex = Math.max(0, Math.min(insertIndex, siblingIds.length));
  const order = [
    ...siblingIds.slice(0, safeIndex),
    newKey,
    ...siblingIds.slice(safeIndex),
  ];
  const positionsBatch = {};
  order.forEach((id, index) => {
    positionsBatch[id] = { x: ACTIVITY_NODE_X, y: STAGE_HEADER_H + ACTIVITY_NODE_TOP_GAP + index * ACTIVITY_SLOT_H };
  });

  return {
    newKey,
    nextAssessment: {
      ...assessment,
      customActivities: [
        ...(assessment.customActivities || []),
        { key: newKey, name: DEFAULT_ACTIVITY_NAME, parentKey: stageId, boundResources: [] },
      ],
      rules: [
        ...(assessment.rules || []),
        createDefaultActivityRule(newKey, DEFAULT_ACTIVITY_NAME),
      ],
      parentOverrides: { ...(assessment.parentOverrides || {}), [newKey]: stageId },
      flowPositions: { ...(assessment.flowPositions || {}), ...positionsBatch },
    },
  };
}

function getResourcePathLabel(resource, resources) {
  if (!resource) return '';
  const segments = [resource.name];
  let parentKey = resource.parentKey ?? null;
  while (parentKey !== null) {
    const parent = resources.find((item) => item.key === parentKey);
    if (!parent) break;
    segments.unshift(parent.name);
    parentKey = parent.parentKey ?? null;
  }
  return segments.join(' / ');
}

function collectCoveredResourceKeys(resourceKey, resources) {
  const covered = new Set([resourceKey]);
  const visit = (parentKey) => {
    resources.forEach((resource) => {
      if (resource.parentKey !== parentKey) return;
      covered.add(resource.key);
      if (resource.isFolder) visit(resource.key);
    });
  };
  visit(resourceKey);
  return covered;
}

function buildAssessmentRiskReport({ resources, nodes, edges }) {
  const resourceByKey = new Map(resources.map((resource) => [resource.key, resource]));
  const stageNodes = nodes.filter((node) => node.type === 'stage');
  const activityNodes = nodes.filter((node) => node.type === 'activity');
  const coveredResourceKeys = new Set();

  activityNodes.forEach((node) => {
    (node.data?.boundResources || []).forEach((bound) => {
      collectCoveredResourceKeys(bound.key, resources).forEach((key) => coveredResourceKeys.add(key));
    });
  });

  const leafResources = resources.filter((resource) => !resource.isFolder);
  const unboundLeafResources = leafResources.filter((resource) => !coveredResourceKeys.has(resource.key));
  const stageActivityCount = new Map(stageNodes.map((stage) => [stage.id, 0]));
  activityNodes.forEach((node) => {
    if (stageActivityCount.has(node.parentNode)) {
      stageActivityCount.set(node.parentNode, stageActivityCount.get(node.parentNode) + 1);
    }
  });
  const emptyStages = stageNodes.filter((stage) => (stageActivityCount.get(stage.id) || 0) === 0);
  const emptyActivities = activityNodes.filter((node) => {
    const boundResources = node.data?.boundResources || [];
    if (boundResources.length === 0) return true;
    const types = new Set();
    boundResources.forEach((bound) => {
      const resource = resourceByKey.get(bound.key);
      collectResourceTypes({
        key: bound.key,
        name: bound.name,
        isFolder: !!(resource?.isFolder ?? bound.isFolder),
        type: resource?.type ?? bound.type ?? null,
      }, resources).forEach((type) => types.add(type));
    });
    return types.size === 0;
  });
  const noTypeActivities = activityNodes.filter((node) => !node.data?.activityType);
  const zeroWeightActivities = activityNodes.filter((node) => Number(node.data?.weight || 0) <= 0);
  const totalWeight = activityNodes.reduce((sum, node) => sum + Number(node.data?.weight || 0), 0);
  const typeMismatchActivities = activityNodes.filter((node) => {
    const activityType = node.data?.activityType ?? '';
    const allowed = allowedResourceTypeMap[activityType];
    if (!allowed) return false;
    const types = new Set();
    (node.data?.boundResources || []).forEach((bound) => {
      const resource = resourceByKey.get(bound.key);
      collectResourceTypes({
        key: bound.key,
        name: bound.name,
        isFolder: !!(resource?.isFolder ?? bound.isFolder),
        type: resource?.type ?? bound.type ?? null,
      }, resources).forEach((type) => types.add(type));
    });
    return [...types].some((type) => !allowed.includes(type));
  });
  const stageEdges = edges.filter((edge) => {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    return source?.type === 'stage' && target?.type === 'stage';
  });

  const risks = [];
  const toNames = (items, mapper) => items.slice(0, 10).map(mapper);
  const overflowText = (count) => (count > 10 ? `另有 ${count - 10} 项未展示` : '');

  if (stageNodes.length === 0) {
    risks.push({ level: 'high', title: '尚未配置阶段容器', description: '当前画布没有阶段，考核流程无法形成完整结构。' });
  }
  if (activityNodes.length === 0) {
    risks.push({ level: 'high', title: '尚未配置活动', description: '当前画布没有活动，可能无法产生任何考核规则。' });
  }
  if (unboundLeafResources.length > 0) {
    risks.push({
      level: 'high',
      title: `存在 ${unboundLeafResources.length} 个未绑定资料`,
      description: '这些资料没有被任何活动覆盖，可能不会纳入当前考核。',
      items: toNames(unboundLeafResources, (resource) => getResourcePathLabel(resource, resources)),
      extra: overflowText(unboundLeafResources.length),
    });
  }
  if (emptyStages.length > 0) {
    risks.push({
      level: 'high',
      title: `存在 ${emptyStages.length} 个空阶段`,
      description: '空阶段内没有活动，学习路径和考核节点可能断档。',
      items: toNames(emptyStages, (stage) => stage.data?.label || stage.id),
      extra: overflowText(emptyStages.length),
    });
  }
  if (emptyActivities.length > 0) {
    risks.push({
      level: 'high',
      title: `存在 ${emptyActivities.length} 个未绑定有效资料的活动`,
      description: '这些活动没有资料或绑定的是空文件夹，可能无法支撑考核。',
      items: toNames(emptyActivities, (node) => node.data?.label || node.id),
      extra: overflowText(emptyActivities.length),
    });
  }
  if (noTypeActivities.length > 0) {
    risks.push({
      level: 'medium',
      title: `存在 ${noTypeActivities.length} 个活动未选择类型`,
      description: '活动类型会影响可绑定资料和考核规则，建议补齐。',
      items: toNames(noTypeActivities, (node) => node.data?.label || node.id),
      extra: overflowText(noTypeActivities.length),
    });
  }
  if (zeroWeightActivities.length > 0) {
    risks.push({
      level: 'medium',
      title: `存在 ${zeroWeightActivities.length} 个活动权重为 0`,
      description: '权重为 0 的活动不会贡献考核结果，确认是否符合预期。',
      items: toNames(zeroWeightActivities, (node) => node.data?.label || node.id),
      extra: overflowText(zeroWeightActivities.length),
    });
  }
  if (activityNodes.length > 0 && totalWeight !== 100) {
    risks.push({
      level: 'medium',
      title: `活动总权重当前为 ${totalWeight}%`,
      description: '总权重不等于 100%，最终成绩计算可能偏离预期。',
    });
  }
  if (typeMismatchActivities.length > 0) {
    risks.push({
      level: 'high',
      title: `存在 ${typeMismatchActivities.length} 个活动类型与资料不匹配`,
      description: '这些活动绑定的资料类型不符合当前活动类型限制。',
      items: toNames(typeMismatchActivities, (node) => node.data?.label || node.id),
      extra: overflowText(typeMismatchActivities.length),
    });
  }
  if (stageNodes.length > 1 && stageEdges.length === 0) {
    risks.push({
      level: 'low',
      title: '阶段间尚未配置连线',
      description: '多个阶段之间没有进入关系，若需要严格顺序，可补充阶段连线和进入规则。',
    });
  }

  return {
    stageCount: stageNodes.length,
    activityCount: activityNodes.length,
    resourceCount: leafResources.length,
    unboundResourceCount: unboundLeafResources.length,
    totalWeight,
    risks,
  };
}

function AssessmentFlowView({ resources, assessment, isDraft, onUpdateAssessment, onSelectFolder, onActivityBindingTargetChange }) {
  const [editingEdge, setEditingEdge] = useState(null);
  const [ruleForm, setRuleForm] = useState(DEFAULT_RULE);
  const [rfInstance, setRfInstance] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedActivityKey, setSelectedActivityKey] = useState(null);
  const [selectedStageKey, setSelectedStageKey] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!onActivityBindingTargetChange) return;
    if (!selectedActivityKey) {
      onActivityBindingTargetChange(null);
      return;
    }
    const customAct = (assessment.customActivities || []).find((item) => item.key === selectedActivityKey);
    const builtinActivity = resources.find((item) => item.key === selectedActivityKey);
    const rule = (assessment.rules || []).find((item) => item.folderKey === selectedActivityKey);
    onActivityBindingTargetChange({
      key: selectedActivityKey,
      isCustomActivity: !!customAct,
      activityType: rule?.activityType ?? '',
      boundKeys: customAct
        ? (customAct.boundResources || []).map((item) => item.key)
        : (builtinActivity?.isFolder ? [selectedActivityKey] : []),
    });
  }, [assessment.customActivities, assessment.rules, onActivityBindingTargetChange, resources, selectedActivityKey]);

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
    // custom activity = 工具栏拖拽创建的空活动容器（可绑定资料）
    const customActivities = (assessment.customActivities || [])
      .filter((ca) => !deletedNodeSet.has(ca.key))
      .map((ca) => ({
        key: ca.key,
        name: ca.name,
        isFolder: true,
        parentKey: ca.parentKey,
        isCustomActivity: true,
        boundResources: ca.boundResources || [],
      }));
    const customActivityKeys = customActivities.map((ca) => ca.key);
    void customActivityKeys; // 预留：后续资料绑定逻辑可能需要
    // 查找资源（含自定义活动）
    const findResource = (key) => resources.find((r) => r.key === key) || customActivities.find((c) => c.key === key);
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
      const r = findResource(actKey);
      if (!r || !r.isFolder) return;
      if (!stageKeySet.has(stageKey)) return;
      if (deletedNodeSet.has(stageKey)) return;
      activityParentMap.set(actKey, stageKey);
    });
    // 3) 自定义活动容器：依靠 parentKey 归属到对应阶段（overrides 优先）
    customActivities.forEach((ca) => {
      if (activityParentMap.has(ca.key)) return;
      const target = ca.parentKey;
      if (!stageKeySet.has(target)) return;
      if (deletedNodeSet.has(target)) return;
      activityParentMap.set(ca.key, target);
    });

    const decorate = (edge) => {
      const rule = edgeRules[edge.id];
      const label = formatRuleLabel(rule);
      const hasRule = !!label;
      return {
        ...edge,
        // 加宽边的点击命中区域（默认 stroke-width 只有 2px 难以点中）
        interactionWidth: 12,
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
        .map(([actKey]) => findResource(actKey))
        .filter(Boolean)
        .map((a) => {
          // 非自定义活动（资料区文件夹拖入阶段成为活动）：直接将该文件夹作为“已绑定资料”单项展示，不展开子项
          if (a.isCustomActivity) return a;
          if (!a.isFolder) return a;
          return { ...a, boundResources: [{ key: a.key, name: a.name, isFolder: true }] };
        });
      const stageX = sIdx * 380;
      const stageY = 0;
      const stageActivityRules = activities.map((a) => assessment.rules.find((r) => r.folderKey === a.key)).filter(Boolean);
      const totalWeight = stageActivityRules.reduce((sum, r) => sum + (r.weight || 0), 0);

      // 阶段容器尺寸：高度随活动数量动态伸缩
      const STAGE_WIDTH = STAGE_NODE_WIDTH;
      const HEADER_H = 54;
      const ACT_H = 150; // 活动节点高度估算
      const ACT_VISUAL_H = 144; // 活动卡实际渲染高度（header+body 3行+padding）
      const ACT_STACK_GAP = 14; // 卡片之间保留明显但不过松的可视间距
      const ACT_BINDING_HEADER_H = 32; // 绑定区标题、分割线与上下留白
      const STAGE_BOTTOM_PAD = 16; // 阶段容器底部安全留白，避免最后一张卡贴边/溢出
      // 考虑 flowPositions 中可能保存了旧坐标（如早期更大的 ACT_H 拖拽过的位置），
      // stageHeight 取「默认堆叠高度」与「活动实际最大底部」中的较大值，避免卡片溢出容器
      const computeActVisualH = (a) => {
        const cnt = a.boundResources?.length || 0;
        if (cnt === 0 && !a.isCustomActivity) return ACT_VISUAL_H;
        // 绑定区按真实视觉尺寸估算，避免把下一张卡片推得过远。
        // 空态提示约 30px；列表单项约 23px，双项含 gap 后约 49px，再多则内部滚动。
        const bindContent = cnt === 0 ? 30 : Math.min(49, cnt * 23 + Math.max(0, cnt - 1) * 3);
        const bindH = ACT_BINDING_HEADER_H + bindContent;
        return ACT_VISUAL_H + bindH;
      };
      // 按现有 flowPositions 中 y 坐标排序，按每张卡片真实高度紧凑堆叠重排，
      // 避免自定义活动卡片（含绑定区更高）与下一个活动重叠
      const sortedActs = activities.slice().sort((a, b) => {
        const ya = assessment.flowPositions?.[a.key]?.y ?? 0;
        const yb = assessment.flowPositions?.[b.key]?.y ?? 0;
        return ya - yb;
      });
      const actOrderIndexMap = new Map(sortedActs.map((a, idx) => [a.key, idx]));
      const computedActY = new Map();
      let cursorY = HEADER_H + ACTIVITY_NODE_TOP_GAP;
      sortedActs.forEach((a, idx) => {
        computedActY.set(a.key, cursorY);
        cursorY += computeActVisualH(a);
        if (idx < sortedActs.length - 1) cursorY += ACT_STACK_GAP;
      });
      const defaultBottom = HEADER_H + activities.length * ACT_H + 16;
      const actualBottom = cursorY + STAGE_BOTTOM_PAD;
      const stageHeight = Math.max(140, defaultBottom, actualBottom);

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
          onAddActivity: () => {
            if (!isDraft) return;
            const { newKey, nextAssessment } = createCustomActivityInStage({
              assessment,
              stageId: stage.key,
              siblingIds: sortedActs.map((a) => a.key),
            });
            onUpdateAssessment(nextAssessment);
            setSelectedStageKey(null);
            setSelectedActivityKey(newKey);
            message.success(`已在「${stage.name || '阶段'}」内新增空活动容器`);
          },
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
            setSelectedStageKey(null);
            setSelectedActivityKey(null);
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
        const actOrderIndex = actOrderIndexMap.get(act.key) ?? aIdx;
        const createAdjacentActivity = (insertIndex, directionLabel) => () => {
          if (!isDraft) return;
          const { newKey, nextAssessment } = createCustomActivityInStage({
            assessment,
            stageId: stage.key,
            siblingIds: sortedActs.map((item) => item.key),
            insertIndex,
          });
          onUpdateAssessment(nextAssessment);
          setSelectedStageKey(null);
          setSelectedActivityKey(newKey);
          message.success(`已在「${act.name || '活动'}」${directionLabel}新增空活动容器`);
        };
        nodes.push({
          id: act.key,
          type: 'activity',
          parentNode: stage.key,
          position: { x: ACTIVITY_NODE_X, y: computedActY.get(act.key) ?? (HEADER_H + ACTIVITY_NODE_TOP_GAP + aIdx * ACT_H) },
          style: { width: ACTIVITY_NODE_WIDTH },
          deletable: false,
          data: {
            label: act.name,
            folderKey: act.key,
            isCustomActivity: !!act.isCustomActivity,
            boundResources: act.boundResources || [],
            activityType: rule?.activityType ?? '',
            weight: rule?.weight ?? 0,
            required: rule?.required ?? true,
            isDraft,
            canMoveUp: actOrderIndex > 0,
            canMoveDown: actOrderIndex < sortedActs.length - 1,
            onAddAbove: createAdjacentActivity(actOrderIndex, '上方'),
            onAddBelow: createAdjacentActivity(actOrderIndex + 1, '下方'),
            onMoveUp: () => {
              if (!isDraft || actOrderIndex <= 0) return;
              const nextOrder = sortedActs.map((item) => item.key);
              [nextOrder[actOrderIndex - 1], nextOrder[actOrderIndex]] = [nextOrder[actOrderIndex], nextOrder[actOrderIndex - 1]];
              const flowPositions = { ...(assessment.flowPositions || {}) };
              nextOrder.forEach((key, idx) => {
                flowPositions[key] = { ...(flowPositions[key] || {}), x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + idx * ACT_H };
              });
              onUpdateAssessment({ ...assessment, flowPositions });
              message.success(`已将「${act.name || '活动'}」上移一位`);
            },
            onMoveDown: () => {
              if (!isDraft || actOrderIndex >= sortedActs.length - 1) return;
              const nextOrder = sortedActs.map((item) => item.key);
              [nextOrder[actOrderIndex], nextOrder[actOrderIndex + 1]] = [nextOrder[actOrderIndex + 1], nextOrder[actOrderIndex]];
              const flowPositions = { ...(assessment.flowPositions || {}) };
              nextOrder.forEach((key, idx) => {
                flowPositions[key] = { ...(flowPositions[key] || {}), x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + idx * ACT_H };
              });
              onUpdateAssessment({ ...assessment, flowPositions });
              message.success(`已将「${act.name || '活动'}」下移一位`);
            },
            onChange: (folderKey, field, value) => {
              // 实时类型一致性校验：切换 activityType 时，若已绑定资料与新类型不匹配则拒绝
              if (field === 'activityType' && value) {
                const customAct = (assessment.customActivities || []).find((ca) => ca.key === folderKey);
                if (customAct && (customAct.boundResources || []).length > 0) {
                  const allowed = allowedResourceTypeMap[value];
                  if (allowed) {
                    const types = new Set();
                    (customAct.boundResources || []).forEach((b) => {
                      const rr = resources.find((x) => x.key === b.key);
                      const p = { key: b.key, name: b.name, isFolder: !!b.isFolder, type: rr?.type ?? null };
                      collectResourceTypes(p, resources).forEach((t) => types.add(t));
                    });
                    const invalid = [...types].filter((t) => !allowed.includes(t));
                    if (invalid.length > 0) {
                      const actLabel = activityTypeLabelMap[value] || value;
                      const allowedLabels = allowed.map((t) => resourceTypeLabelMap[t] || t).join('、');
                      const invalidLabels = invalid.map((t) => resourceTypeLabelMap[t] || t).join('、');
                      message.warning(`已绑定资料中包含${invalidLabels}类型，与「${actLabel}」不匹配（仅可绑定：${allowedLabels}）。请先移除不匹配的资料再切换类型`);
                      // 强制刷新该节点，让 Select 重读 value prop 回滚显示
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === folderKey
                            ? { ...n, data: { ...n.data, _refresh: ((n.data._refresh || 0) + 1) } }
                            : n
                        )
                      );
                      return;
                    }
                  }
                }
              }
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
              if (act.isCustomActivity) {
                next.customActivities = (assessment.customActivities || []).filter((ca) => ca.key !== act.key);
                next.rules = (assessment.rules || []).filter((r) => r.folderKey !== act.key);
              } else if (!(assessment.deletedNodes || []).includes(act.key)) {
                next.deletedNodes = [...(assessment.deletedNodes || []), act.key];
              }
              const flowPositions = { ...(assessment.flowPositions || {}) };
              delete flowPositions[act.key];
              next.flowPositions = flowPositions;
              const parentOverrides = { ...(assessment.parentOverrides || {}) };
              delete parentOverrides[act.key];
              next.parentOverrides = parentOverrides;
              setSelectedActivityKey(null);
              onUpdateAssessment(next);
              message.success(`已${act.isCustomActivity ? '删除' : '从画布移除'}「${act.name || '活动'}」`);
            },
          },
          draggable: isDraft,
        });
      });
    });

    // 加载用户自定义的边（仅保留阶段间连线，活动间连线已下线）
    if (assessment.flowEdges && Array.isArray(assessment.flowEdges)) {
      assessment.flowEdges.forEach((e) => {
        if (!edges.some((ex) => ex.id === e.id)) {
          // 跳过任一端是活动节点的连线（兼容历史数据）
          const srcNode = nodes.find((n) => n.id === e.source);
          const tgtNode = nodes.find((n) => n.id === e.target);
          if (!srcNode || !tgtNode) return;
          if (srcNode.type !== 'stage' || tgtNode.type !== 'stage') return;
          pushEdge({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#1677ff', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#1677ff' },
          });
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [resources, assessment, isDraft, onUpdateAssessment]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const riskReport = useMemo(
    () => buildAssessmentRiskReport({ resources, nodes, edges }),
    [resources, nodes, edges]
  );

  // 拖动结束后短暂跳过一次 props 同步，避免 useEffect 把刚算好的位置覆盖回去
  const skipNextSyncRef = useRef(false);

  // 同步外部数据变化（同时保留 selected 状态，避免覆盖面板 state 對应的选中视觉）
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const enriched = initialNodes.map((n) => {
      const should =
        (n.type === 'activity' && n.id === selectedActivityKey) ||
        (n.type === 'stage' && n.id === selectedStageKey);
      return should ? { ...n, selected: true } : n;
    });
    setNodes(enriched);
    const enrichedEdges = initialEdges.map((e) =>
      e.id === selectedEdgeId ? { ...e, selected: true } : e
    );
    setEdges(enrichedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges, selectedActivityKey, selectedStageKey, selectedEdgeId]);

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
  const ACTIVITY_W = ACTIVITY_NODE_WIDTH;
  const ACTIVITY_H_VISUAL = 140;
  const HEADER_H = 54;
  const SLOT_H = 150;

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
    const currentNodes = rfInstance?.getNodes ? rfInstance.getNodes() : nodes;
    const clearDropTargets = (list) => list.map((n) =>
      n.type === 'stage' && n.data?.isDropTarget
        ? { ...n, data: { ...n.data, isDropTarget: false } }
        : n
    );

    if (node.type !== 'activity') {
      const flowPositions = { ...(assessment.flowPositions || {}), [node.id]: node.position };
      setNodes(clearDropTargets(currentNodes));
      skipNextSyncRef.current = true;
      onUpdateAssessment({ ...assessment, flowPositions });
      return;
    }

    // 活动拖动：检测命中阶段 + 把被拖节点和同阶段同胞一起按 y 排序，按槽位重排避免重叠
    const positionsToWrite = {};
    const draggedNode = currentNodes.find((n) => n.id === node.id) || node;
    const stageNodes = currentNodes.filter((n) => n.type === 'stage');
    const parentStage = stageNodes.find((s) => s.id === draggedNode.parentNode);
    const hit = findHitStage(draggedNode, stageNodes);

    if (!parentStage) {
      setNodes(clearDropTargets(currentNodes));
      return;
    }

    let newParentId = draggedNode.parentNode;
    let crossStage = false;
    let hitStageLabel = '';
    let snappedBack = false;

    // 未命中任何阶段 -> 「活动」不允许脱离阶段容器，snap 回原阶段末位
    if (!hit) {
      snappedBack = true;
      const oldSiblings = currentNodes
        .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === parentStage.id)
        .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
      const order = [...oldSiblings, { id: node.id }];
      order.forEach((n, i) => {
        positionsToWrite[n.id] = { x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + i * SLOT_H };
      });
      newParentId = parentStage.id;
    } else {
      const targetStage = hit.id !== draggedNode.parentNode ? hit : parentStage;
      if (!targetStage) {
        setNodes(clearDropTargets(currentNodes));
        return;
      }

      newParentId = targetStage.id;
      crossStage = newParentId !== draggedNode.parentNode;
      hitStageLabel = targetStage.data?.label || '';

      // 计算被拖节点在目标阶段内的局部 y
      // - 同 stage：直接用 position.y（嵌套节点 position 即相对父的局部 y）
      // - 跨 stage：把绝对 y 减去目标 stage 的 y
      let nodeLocalY;
      if (!crossStage) {
        nodeLocalY = draggedNode.position?.y ?? 0;
      } else {
        const absY = draggedNode.positionAbsolute?.y
          ?? ((parentStage.position?.y ?? 0) + (draggedNode.position?.y ?? 0));
        nodeLocalY = absY - targetStage.position.y;
      }

      const targetAll = [
        ...currentNodes
          .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === targetStage.id)
          .map((n) => ({ id: n.id, y: n.position?.y ?? 0 })),
        { id: node.id, y: nodeLocalY },
      ].sort((a, b) => a.y - b.y);

      targetAll.forEach((n, i) => {
        positionsToWrite[n.id] = { x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + i * SLOT_H };
      });

      // 跨阶段时，原阶段剩余活动也重排序避免空隔
      if (crossStage) {
        const oldSiblings = currentNodes
          .filter((n) => n.type === 'activity' && n.id !== node.id && n.parentNode === parentStage.id)
          .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
        oldSiblings.forEach((n, i) => {
          positionsToWrite[n.id] = { x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + i * SLOT_H };
        });
      }
    }

    const nextNodes = clearDropTargets(currentNodes).map((n) => {
      if (n.id === node.id) {
        return { ...n, parentNode: newParentId, position: positionsToWrite[n.id] || n.position };
      }
      if (positionsToWrite[n.id]) {
        return { ...n, position: positionsToWrite[n.id] };
      }
      return n;
    });
    setNodes(nextNodes);

    const next = { ...assessment };
    next.flowPositions = { ...(next.flowPositions || {}), ...positionsToWrite };
    if (crossStage) {
      next.parentOverrides = { ...(next.parentOverrides || {}), [node.id]: newParentId };
      message.success(`已归属到「${hitStageLabel || '新阶段'}」并插入到对应位置`);
    } else if (snappedBack) {
      message.warning('「活动」不能移出阶段容器，已自动返回原阶段');
    }
    // 不跳过同步：让 useMemo 按卡片真实高度紧凑堆叠重新布局，避免拖动后重叠
    onUpdateAssessment(next);
  }, [assessment, isDraft, onUpdateAssessment, setNodes, findHitStage, rfInstance, nodes]);

  // 连线串联校验：仅允许 activity ↔ activity，且同阶段内，且每个节点只能一进一出
  const validateActivityConnection = useCallback((params, currentEdges) => {
    const { source, target } = params || {};
    if (!source || !target || source === target) return { ok: false, reason: '不允许连接自身' };
    const allNodes = rfInstance?.getNodes ? rfInstance.getNodes() : nodes;
    const sNode = allNodes.find((n) => n.id === source);
    const tNode = allNodes.find((n) => n.id === target);
    if (!sNode || !tNode) return { ok: false, reason: '节点不存在' };
    if (sNode.type !== tNode.type) {
      return { ok: false, reason: '仅允许同类型节点互连（阶段↔阶段、活动↔活动）' };
    }
    if (sNode.type === 'activity') {
      if (sNode.parentNode !== tNode.parentNode) {
        return { ok: false, reason: '仅允许同一阶段内的活动串联' };
      }
    } else if (sNode.type === 'stage') {
      // 阶段间连线：两者必须都是顶层阶段（无 parentNode）
      if (sNode.parentNode || tNode.parentNode) {
        return { ok: false, reason: '阶段间连线仅允许顶层阶段互连' };
      }
    } else {
      return { ok: false, reason: '仅支持阶段或活动节点连线' };
    }
    const eds = currentEdges || edges;
    // 串联：source 只能有一个出边；target 只能有一个入边
    if (eds.some((e) => e.source === source)) return { ok: false, reason: '该节点已有下游连线（只能串联）' };
    if (eds.some((e) => e.target === target)) return { ok: false, reason: '该节点已有上游连线（只能串联）' };
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
    // 活动节点不再允许参与连线
    const allNodes = rfInstance?.getNodes ? rfInstance.getNodes() : nodes;
    const sNode = allNodes.find((n) => n.id === params.source);
    const tNode = allNodes.find((n) => n.id === params.target);
    if (!sNode || !tNode) return false;
    if (sNode.type === 'activity' || tNode.type === 'activity') return false;
    return validateActivityConnection(params, edges).ok;
  }, [isDraft, validateActivityConnection, edges, rfInstance, nodes]);

  // 添加新连线（仅保留阶段间）
  const onConnect = useCallback((params) => {
    if (!isDraft) return;
    // 活动节点不允许参与连线
    const allNodes = rfInstance?.getNodes ? rfInstance.getNodes() : nodes;
    const sNode = allNodes.find((n) => n.id === params.source);
    const tNode = allNodes.find((n) => n.id === params.target);
    if (!sNode || !tNode) return;
    if (sNode.type === 'activity' || tNode.type === 'activity') {
      message.warning('活动之间不再支持连线');
      return;
    }
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
      interactionWidth: 12,
      style: { stroke: '#1677ff', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1677ff' },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    const flowEdges = [...(assessment.flowEdges || []), { id: newEdge.id, source: newEdge.source, target: newEdge.target }];
    onUpdateAssessment({ ...assessment, flowEdges });
    message.success('已新建阶段间连线');
  }, [assessment, isDraft, onUpdateAssessment, setEdges, validateActivityConnection, edges, rfInstance, nodes]);

  // 节点点击 -> 打开右侧属性编辑面板
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'activity') {
      setSelectedActivityKey(node.id);
      setSelectedStageKey(null);
    } else if (node.type === 'stage') {
      setSelectedActivityKey(null);
      setSelectedStageKey(node.id);
    }
    setSelectedEdgeId(null);
    // 手动同步 ReactFlow 内部 selected 状态（避免卡片内控件 onMouseDown={stop} 拦截导致选中视觉不切换）
    setNodes((nds) => nds.map((n) => (n.selected === (n.id === node.id) ? n : { ...n, selected: n.id === node.id })));
  }, [setNodes]);

  // 点击画布空白 -> 关闭属性面板
  const onPaneClick = useCallback(() => {
    setSelectedActivityKey(null);
    setSelectedStageKey(null);
    setSelectedEdgeId(null);
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }, [setNodes]);

  // 双向同步：以「属性面板 state」为唯一真相、强制刷新 ReactFlow 节点 selected 状态。
  // 避免卡片内控件 onMouseDown stopPropagation 拦截后，RF 内部 selection 与面板 state 不一致。
  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        const should =
          (n.type === 'activity' && n.id === selectedActivityKey) ||
          (n.type === 'stage' && n.id === selectedStageKey);
        if (!!n.selected === should) return n;
        changed = true;
        return { ...n, selected: should };
      });
      return changed ? next : nds;
    });
  }, [selectedActivityKey, selectedStageKey, setNodes]);

  // 更新某个活动的 rule 字段（属性面板专用）
  const handleRuleChange = useCallback((folderKey, field, value) => {
    // 实时类型一致性校验：切换 activityType 时，若已绑定资料与新类型不匹配则拒绝
    if (field === 'activityType' && value) {
      const customAct = (assessment.customActivities || []).find((ca) => ca.key === folderKey);
      if (customAct && (customAct.boundResources || []).length > 0) {
        const allowed = allowedResourceTypeMap[value];
        if (allowed) {
          const types = new Set();
          (customAct.boundResources || []).forEach((b) => {
            const r = resources.find((x) => x.key === b.key);
            const p = { key: b.key, name: b.name, isFolder: !!b.isFolder, type: r?.type ?? null };
            collectResourceTypes(p, resources).forEach((t) => types.add(t));
          });
          const invalid = [...types].filter((t) => !allowed.includes(t));
          if (invalid.length > 0) {
            const actLabel = activityTypeLabelMap[value] || value;
            const allowedLabels = allowed.map((t) => resourceTypeLabelMap[t] || t).join('、');
            const invalidLabels = invalid.map((t) => resourceTypeLabelMap[t] || t).join('、');
            message.warning(`已绑定资料中包含${invalidLabels}类型，与「${actLabel}」不匹配（仅可绑定：${allowedLabels}）。请先移除不匹配的资料再切换类型`);
            return;
          }
        }
      }
    }
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

  // 单击连线 -> 选中并在右侧属性面板展示「连线属性」（与「活动属性」「阶段属性」互斥）
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (!isDraft) {
      message.info('当前版本不可编辑');
      return;
    }
    setSelectedEdgeId(edge.id);
    setSelectedActivityKey(null);
    setSelectedStageKey(null);
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    const existing = (assessment.edgeRules || {})[edge.id];
    setRuleForm(existing ? { ...DEFAULT_RULE, ...existing } : { ...DEFAULT_RULE });
  }, [assessment, isDraft]);

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
    message.success('已清空画布，可从资料面板拖入节点重新组装');
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
      if (tool?.tool === 'activity') {
        // 「活动容器」必须拖入某个阶段内才能创建
        let hitStage = null;
        if (rfInstance?.getNodes) {
          const allNodes = rfInstance.getNodes();
          const stageNodes = allNodes.filter((n) => n.type === 'stage');
          for (const s of stageNodes) {
            const sx = s.position.x;
            const sy = s.position.y;
            const sw = s.style?.width ?? 240;
            const sh = s.style?.height ?? 140;
            if (position.x >= sx && position.x <= sx + sw && position.y >= sy && position.y <= sy + sh) {
              hitStage = s;
              break;
            }
          }
        }
        if (!hitStage) {
          message.warning('「活动容器」仅能拖入「阶段容器」内，请拖到某个阶段内部');
          return;
        }
        // 插入到阶段内末位
        const allNodes = rfInstance.getNodes();
        const siblings = allNodes
          .filter((n) => n.type === 'activity' && n.parentNode === hitStage.id)
          .sort((a, b) => (a.position.y ?? 0) - (b.position.y ?? 0));
        const localY = position.y - hitStage.position.y;
        let insertIdx = siblings.findIndex((s) => localY < (s.position.y ?? 0) + ACTIVITY_SLOT_H / 2);
        if (insertIdx === -1) insertIdx = siblings.length;
        const { newKey, nextAssessment } = createCustomActivityInStage({
          assessment,
          stageId: hitStage.id,
          siblingIds: siblings.map((s) => s.id),
          insertIndex: insertIdx,
        });
        onUpdateAssessment(nextAssessment);
        setSelectedStageKey(null);
        setSelectedActivityKey(newKey);
        message.success(`已在「${hitStage.data?.label || '阶段'}」内新增空活动容器`);
        return;
      }
    }

    // 其次处理从资料面板拖入的资源项
    const raw = event.dataTransfer.getData('application/assessment-resource');
    if (!raw) return;
    let payload;
    try { payload = JSON.parse(raw); } catch { return; }
    if (!payload || !payload.key) return;

    // 0) 优先判定：拖入「自定义活动容器」→ 作为资料绑定（不走「提升为阶段/作为活动」逻辑）
    if (rfInstance?.getNodes) {
      const allNodes = rfInstance.getNodes();
      const stageById = new Map(
        allNodes.filter((n) => n.type === 'stage').map((n) => [n.id, n])
      );
      const hitCustomAct = allNodes.find((n) => {
        if (n.type !== 'activity' || !n.data?.isCustomActivity) return false;
        if (n.id === payload.key) return false;
        const parent = stageById.get(n.parentNode);
        const ax = (parent?.position?.x ?? 0) + (n.position?.x ?? 0);
        const ay = (parent?.position?.y ?? 0) + (n.position?.y ?? 0);
        const aw = n.width ?? ACTIVITY_NODE_WIDTH;
        const ah = n.height ?? 150;
        return position.x >= ax && position.x <= ax + aw && position.y >= ay && position.y <= ay + ah;
      });
      if (hitCustomAct) {
        const result = bindResourceToCustomActivity({
          assessment,
          activityKey: hitCustomAct.id,
          payload,
          resources,
        });
        if (!result.ok) {
          message[result.level || 'warning'](result.message);
          return;
        }
        onUpdateAssessment(result.nextAssessment);
        message.success(result.message);
        return;
      }
    }

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

    // 3) 文件夹角色判定：命中阶段容器 -> 作为活动；未命中 -> 仅一级目录（builtin stage）可独立放置于画布
    const positionsBatch = {};
    if (payload.isFolder) {
      // 「活动」只能拖入阶段容器：非一级目录且未命中任何阶段时拒绝放置
      if (!hitStage && payload.parentKey !== null) {
        message.warning('「活动」仅能拖入「阶段容器」内，请将「' + (payload.name || '该项') + '」拖到某个阶段内部');
        return;
      }
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
          positionsBatch[n.id] = { x: ACTIVITY_NODE_X, y: HEADER_H + ACTIVITY_NODE_TOP_GAP + i * SLOT_H };
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
        <Tooltip title="拖动节点调整位置；拖拽节点右侧圆点到目标节点新增关联；点击活动节点打开详情；点击连线配置进入规则或删除；从资料面板拖拽项目到画布定位节点">
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
          <div
            className={`flow-tool-item ${!isDraft ? 'disabled' : ''}`}
            draggable={isDraft}
            onDragStart={(e) => {
              if (!isDraft) { e.preventDefault(); return; }
              e.dataTransfer.setData(
                'application/assessment-tool',
                JSON.stringify({ tool: 'activity' })
              );
              e.dataTransfer.effectAllowed = 'move';
            }}
            title="拖拽到某个阶段内创建一个空活动容器，可再拖入资料进行绑定"
          >
            <AppstoreOutlined style={{ color: '#13c2c2' }} />
            <span>活动容器</span>
          </div>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <Button
            size="small"
            icon={<SafetyCertificateOutlined />}
            onClick={() => setRiskModalOpen(true)}
            title="检测资料绑定、活动配置、权重和流程遗漏风险"
          >
            风险检测
          </Button>
          <Button
            size="small"
            icon={<DatabaseOutlined />}
            onClick={() => setDataModalOpen(true)}
            title="查看当前方案的完整数据结构（用于后端持久化对接）"
          >
            查看数据
          </Button>
          <Popconfirm
            title="确定清空画布吗？"
            description="将移除当前画布上的所有节点、连线及进入规则。可重新从资料面板拖入资料重建。"
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
        deleteKeyCode={null}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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

      <Modal
        title={
          <span>
            <SafetyCertificateOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            风险检测
          </span>
        }
        open={riskModalOpen}
        onCancel={() => setRiskModalOpen(false)}
        width={760}
        footer={[
          <Button key="close" type="primary" onClick={() => setRiskModalOpen(false)}>知道了</Button>,
        ]}
      >
        <div className="assessment-risk-summary">
          <div className="assessment-risk-card">
            <span>阶段</span>
            <strong>{riskReport.stageCount}</strong>
          </div>
          <div className="assessment-risk-card">
            <span>活动</span>
            <strong>{riskReport.activityCount}</strong>
          </div>
          <div className="assessment-risk-card">
            <span>未绑定资料</span>
            <strong>{riskReport.unboundResourceCount}</strong>
          </div>
          <div className="assessment-risk-card">
            <span>总权重</span>
            <strong>{riskReport.totalWeight}%</strong>
          </div>
        </div>
        {riskReport.risks.length === 0 ? (
          <div className="assessment-risk-empty">
            <SafetyCertificateOutlined />
            <strong>暂未发现明显风险</strong>
            <span>当前资料绑定、活动配置和权重结构看起来比较完整。</span>
          </div>
        ) : (
          <div className="assessment-risk-list">
            {riskReport.risks.map((risk, index) => (
              <div key={`${risk.level}-${index}`} className={`assessment-risk-item assessment-risk-${risk.level}`}>
                <div className="assessment-risk-item-head">
                  <span className="assessment-risk-level">
                    {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '需关注' : '提示'}
                  </span>
                  <strong>{risk.title}</strong>
                </div>
                <p>{risk.description}</p>
                {risk.items?.length > 0 && (
                  <ul>
                    {risk.items.map((item) => <li key={item}>{item}</li>)}
                    {risk.extra && <li className="assessment-risk-more">{risk.extra}</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <span>
            <DatabaseOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            方案数据预览
            <span style={{ marginLeft: 12, fontSize: 12, color: '#8c8c8c', fontWeight: 'normal' }}>
              用于后端 MongoDB 持久化对接
            </span>
          </span>
        }
        open={dataModalOpen}
        onCancel={() => setDataModalOpen(false)}
        width={780}
        footer={[
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              try {
                const text = JSON.stringify(assessment, null, 2);
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(text).then(
                    () => message.success('已复制到剪贴板'),
                    () => message.error('复制失败，请手动选择复制')
                  );
                } else {
                  message.warning('当前环境不支持自动复制，请手动选择复制');
                }
              } catch (err) {
                message.error('复制失败');
              }
            }}
          >
            复制 JSON
          </Button>,
          <Button key="close" onClick={() => setDataModalOpen(false)}>关闭</Button>,
        ]}
      >
        <div style={{ marginBottom: 8, fontSize: 12, color: '#595959', lineHeight: 1.6 }}>
          以下为当前考核方案的完整数据结构，后端可直接存入 <code style={{ background: '#f5f5f5', padding: '0 4px', borderRadius: 3 }}>assessment</code> 集合：
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li><code>rules</code> 考核规则列表（每个活动的权重、及格条件、是否必修）</li>
            <li><code>customStages</code> / <code>customActivities</code> 自定义阶段与活动容器（含绑定资料）</li>
            <li><code>parentOverrides</code> 节点归属调整；deletedNodes / deletedEdges 画布删除记录</li>
            <li><code>edgeRules</code> 连线进入规则；flowPositions 节点位置；stagePromotions 阶段升级记录</li>
          </ul>
        </div>
        <pre
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.6,
            maxHeight: 500,
            overflow: 'auto',
            margin: 0,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          }}
        >
          {JSON.stringify(assessment, null, 2)}
        </pre>
      </Modal>

      {selectedActivityKey && (() => {
        const builtinFolder = resources.find((r) => r.key === selectedActivityKey);
        const customAct = (assessment.customActivities || []).find((ca) => ca.key === selectedActivityKey);
        const folder = builtinFolder || (customAct ? { key: customAct.key, name: customAct.name, isFolder: true } : null);
        if (!folder) return null;
        const isCustomActivity = !!customAct;
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
        const detachBuiltinResourceAsEmptyActivity = () => {
          if (isCustomActivity) return;
          const currentNode = nodes.find((node) => node.id === selectedActivityKey);
          const parentStageKey = currentNode?.parentNode || assessment.parentOverrides?.[folder.key] || folder.parentKey;
          if (!parentStageKey) {
            message.warning('未找到所属阶段，无法保留活动容器');
            return;
          }
          const newKey = makeFlowKey('ca');
          const next = { ...assessment };
          const flowPositions = { ...(assessment.flowPositions || {}) };
          flowPositions[newKey] = currentNode?.position || flowPositions[folder.key] || { x: ACTIVITY_NODE_X, y: STAGE_HEADER_H + ACTIVITY_NODE_TOP_GAP };
          delete flowPositions[folder.key];

          const parentOverrides = { ...(assessment.parentOverrides || {}) };
          delete parentOverrides[folder.key];
          parentOverrides[newKey] = parentStageKey;

          const deletedNodes = new Set(assessment.deletedNodes || []);
          deletedNodes.add(folder.key);

          const nextRule = {
            ...rule,
            key: makeFlowKey('ar'),
            folderKey: newKey,
            folderName: folder.name || DEFAULT_ACTIVITY_NAME,
          };

          next.customActivities = [
            ...(assessment.customActivities || []),
            { key: newKey, name: folder.name || DEFAULT_ACTIVITY_NAME, parentKey: parentStageKey, boundResources: [] },
          ];
          next.rules = [
            ...(assessment.rules || []).filter((item) => item.folderKey !== folder.key),
            nextRule,
          ];
          next.deletedNodes = [...deletedNodes];
          next.flowPositions = flowPositions;
          next.parentOverrides = parentOverrides;
          setSelectedActivityKey(newKey);
          onUpdateAssessment(next);
          message.success(`已解绑「${folder.name}」，并保留空活动容器`);
        };
        const removeCurrentActivityFromCanvas = () => {
          const next = { ...assessment };
          if (isCustomActivity) {
            next.customActivities = (assessment.customActivities || []).filter((ca) => ca.key !== folder.key);
            next.rules = (assessment.rules || []).filter((r) => r.folderKey !== folder.key);
          } else {
            next.deletedNodes = [...(assessment.deletedNodes || []), folder.key];
          }
          const flowPositions = { ...(assessment.flowPositions || {}) };
          delete flowPositions[folder.key];
          next.flowPositions = flowPositions;
          const parentOverrides = { ...(assessment.parentOverrides || {}) };
          delete parentOverrides[folder.key];
          next.parentOverrides = parentOverrides;
          setSelectedActivityKey(null);
          onUpdateAssessment(next);
          message.success(`已${isCustomActivity ? '删除' : '从画布移除'}「${folder.name || '活动'}」`);
        };
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
                <Input
                  value={folder.name}
                  disabled={!isCustomActivity || !isDraft}
                  onChange={(e) => {
                    if (!isCustomActivity) return;
                    const v = e.target.value;
                    const customActivities = (assessment.customActivities || []).map((ca) =>
                      ca.key === selectedActivityKey ? { ...ca, name: v } : ca
                    );
                    const rules = (assessment.rules || []).map((r) =>
                      r.folderKey === selectedActivityKey ? { ...r, folderName: v } : r
                    );
                    onUpdateAssessment({ ...assessment, customActivities, rules });
                  }}
                />
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
              {isCustomActivity ? (
                <>
                  <Divider style={{ margin: '12px 0' }}>已绑定资料 ({customAct.boundResources?.length || 0})</Divider>
                  {(!customAct.boundResources || customAct.boundResources.length === 0) ? (
                    <div className="inspector-empty-tip">尚未绑定资料，可从画布左上角资料面板拖入卡片</div>
                  ) : (
                    <div className="inspector-binding-list">
                      {customAct.boundResources.map((b) => (
                        <div key={b.key} className="inspector-binding-item">
                          {b.isFolder ? <FolderOutlined /> : <FileOutlined />}
                          <span className="inspector-binding-name" title={b.name}>{b.name}</span>
                          {isDraft && (
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => {
                                Modal.confirm({
                                  title: '确认移除该绑定资料？',
                                  content: `「${b.name}」将从该活动容器中移除。`,
                                  okText: '移除',
                                  cancelText: '取消',
                                  okButtonProps: { danger: true },
                                  onOk: () => {
                                    const customActivities = (assessment.customActivities || []).map((ca) => {
                                      if (ca.key !== selectedActivityKey) return ca;
                                      return { ...ca, boundResources: (ca.boundResources || []).filter((x) => x.key !== b.key) };
                                    });
                                    onUpdateAssessment({ ...assessment, customActivities });
                                    message.success(`已移除「${b.name}」`);
                                  },
                                });
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : folder.isFolder ? (
                <>
                  <Divider style={{ margin: '12px 0' }}>已绑定资料 (1)</Divider>
                  <div className="inspector-binding-list">
                    <div className="inspector-binding-item">
                      <FolderOutlined />
                      <span className="inspector-binding-name" title={folder.name}>{folder.name}</span>
                      {isDraft && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => {
                            Modal.confirm({
                              title: '确认移除该绑定资料？',
                              content: `「${folder.name}」将从当前活动中移除，资料本身仍会保留。`,
                              okText: '移除',
                              cancelText: '取消',
                              okButtonProps: { danger: true },
                              onOk: detachBuiltinResourceAsEmptyActivity,
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : null}
              {isDraft && (
                <div className="inspector-actions">
                  <Popconfirm
                    title={isCustomActivity ? '确认删除该活动容器？' : '确认从画布移除该活动？'}
                    description={isCustomActivity
                      ? `「${folder.name}」及其已绑定资料、规则将被删除（不可恢复）`
                      : `「${folder.name}」将从画布移除（仍保留于资料区，可重新拖入）`}
                    okText={isCustomActivity ? '删除' : '移除'}
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                    onConfirm={removeCurrentActivityFromCanvas}
                  >
                    <Button danger icon={<DeleteOutlined />} block>{isCustomActivity ? '删除活动容器' : '移除活动'}</Button>
                  </Popconfirm>
                </div>
              )}
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

      {selectedEdgeId && !selectedActivityKey && !selectedStageKey && (() => {
        const edge = edges.find((e) => e.id === selectedEdgeId);
        if (!edge) return null;
        const sNode = nodes.find((n) => n.id === edge.source);
        const tNode = nodes.find((n) => n.id === edge.target);
        const sourceLabel = sNode?.data?.label || edge.source;
        const targetLabel = tNode?.data?.label || edge.target;
        const commitRule = (patch) => {
          const newForm = { ...ruleForm, ...patch };
          setRuleForm(newForm);
          if (!isDraft) return;
          const next = { ...assessment };
          const edgeRulesMap = { ...(next.edgeRules || {}) };
          if (newForm.type === 'none') {
            delete edgeRulesMap[selectedEdgeId];
          } else {
            edgeRulesMap[selectedEdgeId] = { ...newForm };
          }
          next.edgeRules = edgeRulesMap;
          onUpdateAssessment(next);
        };
        return (
          <div className="flow-activity-inspector" onMouseDown={(e) => e.stopPropagation()}>
            <div className="inspector-header">
              <div className="inspector-title">
                <EditOutlined style={{ color: '#fa8c16' }} />
                <span>连线属性 · 进入规则</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setSelectedEdgeId(null)}
              />
            </div>
            <div className="inspector-body">
              <div className="inspector-field">
                <label>连线</label>
                <div className="inspector-readonly">
                  <strong>{sourceLabel}</strong>
                  <span style={{ margin: '0 6px', color: '#8c8c8c' }}>→</span>
                  <strong>{targetLabel}</strong>
                </div>
              </div>
              <div className="inspector-field">
                <label>规则类型</label>
                <Radio.Group
                  value={ruleForm.type}
                  disabled={!isDraft}
                  onChange={(e) => commitRule({ type: e.target.value })}
                >
                  <Radio value="none">无限制</Radio>
                  <Radio value="completion">完成率达标</Radio>
                  <Radio value="score">得分达标</Radio>
                  <Radio value="all-passed">全部活动通过</Radio>
                  <Radio value="custom">自定义</Radio>
                </Radio.Group>
              </div>
              {(ruleForm.type === 'completion' || ruleForm.type === 'score') && (
                <div className="inspector-field">
                  <label>阈值</label>
                  <InputNumber
                    min={0}
                    max={ruleForm.type === 'completion' ? 100 : 1000}
                    value={ruleForm.threshold}
                    disabled={!isDraft}
                    onChange={(v) => commitRule({ threshold: v ?? 0 })}
                    addonAfter={ruleForm.type === 'completion' ? '%' : '分'}
                    style={{ width: 160 }}
                  />
                </div>
              )}
              {ruleForm.type === 'custom' && (
                <div className="inspector-field">
                  <label>规则说明</label>
                  <Input.TextArea
                    value={ruleForm.note}
                    disabled={!isDraft}
                    onChange={(e) => commitRule({ note: e.target.value })}
                    placeholder="例如：必须先完成线下打卡且测验通过"
                    autoSize={{ minRows: 2, maxRows: 4 }}
                  />
                </div>
              )}
              {isDraft && (
                <div className="inspector-actions">
                  <Popconfirm
                    title="确认删除该连线？"
                    description="删除后连线上的「进入规则」将一同丢失"
                    okText="删除"
                    okButtonProps={{ danger: true }}
                    cancelText="取消"
                    onConfirm={handleDeleteSelectedEdge}
                  >
                    <Button danger icon={<DeleteOutlined />} block>删除连线</Button>
                  </Popconfirm>
                </div>
              )}
              {!isDraft && (
                <div className="inspector-readonly-tip">当前版本不可编辑，仅可查看</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AssessmentFlowView;
