import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './AgentQuotaModule.css';

const { TextArea } = Input;

const NOW_TEXT = '2026-06-10 18:00';
const CURRENT_OPERATOR = '张洪磊';

const PLAN_STATUS_OPTIONS = [
  { label: '启用中', value: 'ACTIVE' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已停用', value: 'DISABLED' },
];

const PLAN_SCOPE_OPTIONS = [
  { label: '个人基础', value: 'PERSONAL_BASE' },
  { label: '部门标准', value: 'DEPARTMENT_STANDARD' },
  { label: '当前租户标准', value: 'TENANT_STANDARD' },
  { label: '重点部门', value: 'KEY_DEPARTMENT' },
];

const RESET_CYCLE_OPTIONS = [
  { label: '按日重置', value: 'DAILY' },
  { label: '按周重置', value: 'WEEKLY' },
  { label: '按月重置', value: 'MONTHLY' },
  { label: '按季度重置', value: 'QUARTERLY' },
];

const USER_GROUP_OPTIONS = [
  { label: '租户成员', value: 'MEMBER' },
  { label: '部门管理员', value: 'DEPT_ADMIN' },
  { label: '租户管理员', value: 'TENANT_ADMIN' },
];

const PLAN_STATUS_LABEL_MAP = Object.fromEntries(PLAN_STATUS_OPTIONS.map((item) => [item.value, item.label]));
const PLAN_SCOPE_LABEL_MAP = Object.fromEntries(PLAN_SCOPE_OPTIONS.map((item) => [item.value, item.label]));
const RESET_CYCLE_LABEL_MAP = Object.fromEntries(RESET_CYCLE_OPTIONS.map((item) => [item.value, item.label]));
const USER_GROUP_LABEL_MAP = Object.fromEntries(USER_GROUP_OPTIONS.map((item) => [item.value, item.label]));
const DIMENSION_TAB_ITEMS = [
  { key: 'skill', label: '技能维度' },
  { key: 'token', label: 'Token 维度' },
  { key: 'agent', label: '智能体维度' },
];
const DEFAULT_ENABLED_DIMENSIONS = DIMENSION_TAB_ITEMS.map((item) => item.key);
const DIMENSION_OPTIONS = DIMENSION_TAB_ITEMS.map((item) => ({ label: item.label, value: item.key }));
const DIMENSION_LABEL_MAP = Object.fromEntries(DIMENSION_TAB_ITEMS.map((item) => [item.key, item.label]));
const MULTI_DIMENSION_STRATEGY_OPTIONS = [
  { label: '联合收口', value: 'STRICT' },
  { label: '综合均衡', value: 'BALANCED' },
];
const MULTI_DIMENSION_STRATEGY_GUIDE_ITEMS = [
  {
    value: 'STRICT',
    title: '联合收口',
    summary: '任一维度先触达阈值，就按最严格口径整体收紧。',
    detail: '适合风险优先、需要硬约束的场景；即使其他维度仍有余量，也不会继续放量。',
  },
  {
    value: 'BALANCED',
    title: '综合均衡',
    summary: '按各维度综合使用率统一判断整体放量节奏。',
    detail: '适合体验优先、希望平滑控制的场景；单一维度短时偏高，不会立刻触发整体收紧。',
  },
];
const MULTI_DIMENSION_STRATEGY_LABEL_MAP = {
  SINGLE: '单维度直控',
  STRICT: '联合收口',
  BALANCED: '综合均衡',
};
const MULTI_DIMENSION_STRATEGY_DESCRIPTION_MAP = {
  SINGLE: '仅启用单一维度时，直接按该维度进行控制。',
  STRICT: '多个维度同时生效时，任一维度先接近或达到上限，都会按最严格口径触发整体收口。',
  BALANCED: '多个维度同时生效时，按综合使用率统一评估整体风险和放量节奏，不因单一维度短时偏高立即收紧。',
};

const SKILL_CATALOG = [
  { value: 'knowledge-search', label: '知识检索', color: 'blue' },
  { value: 'ppt-generate', label: 'PPT 生成', color: 'purple' },
  { value: 'data-analysis', label: '数据分析', color: 'gold' },
  { value: 'image-generate', label: '图片生成', color: 'magenta' },
  { value: 'workflow-run', label: '流程执行', color: 'cyan' },
  { value: 'agent-publish', label: '智能体发布', color: 'green' },
];

const SKILL_LABEL_MAP = Object.fromEntries(SKILL_CATALOG.map((item) => [item.value, item.label]));
const SKILL_META_MAP = new Map(SKILL_CATALOG.map((item) => [item.value, item]));

function createPlanSkillRule(skillKey, limit) {
  return { skillKey, limit };
}

function createBindingSkillRule(skillKey, limit, used = 0) {
  return { skillKey, limit, used };
}

function normalizeEnabledDimensions(enabledDimensions) {
  const next = Array.isArray(enabledDimensions) ? enabledDimensions.filter(Boolean) : [];
  const unique = Array.from(new Set(next));
  return unique.length ? unique : [...DEFAULT_ENABLED_DIMENSIONS];
}

function withDimensionConfig(record, enabledDimensions = DEFAULT_ENABLED_DIMENSIONS, dimensionStrategy = 'STRICT') {
  const nextEnabledDimensions = normalizeEnabledDimensions(enabledDimensions);
  return {
    ...record,
    enabledDimensions: nextEnabledDimensions,
    dimensionStrategy: nextEnabledDimensions.length > 1 ? dimensionStrategy : 'SINGLE',
  };
}

const INITIAL_PLAN_TEMPLATES = [
  {
    id: 'plan-personal-base',
    name: '个人基础版',
    scope: 'PERSONAL_BASE',
    status: 'ACTIVE',
    resetCycle: 'MONTHLY',
    skillUsageLimit: 300,
    skillRules: [
      createPlanSkillRule('knowledge-search', 120),
      createPlanSkillRule('ppt-generate', 40),
    ],
    tokenLimit: 180000,
    agentCreateLimit: 2,
    skillGenerateLimit: 3,
    allowCustomSkill: false,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 20,
    freeTokenPerUser: 12000,
    freeAgentCreatePerUser: 0,
    freeSkillGeneratePerUser: 1,
    description: '适用于当前租户内的新成员和低频使用者，用于控制个人试运行成本。',
    updatedAt: '2026-06-08 11:20',
    updatedBy: '徐佳倩',
  },
  {
    id: 'plan-department-standard',
    name: '部门标准版',
    scope: 'DEPARTMENT_STANDARD',
    status: 'ACTIVE',
    resetCycle: 'MONTHLY',
    skillUsageLimit: 5000,
    skillRules: [
      createPlanSkillRule('knowledge-search', 1800),
      createPlanSkillRule('workflow-run', 1200),
      createPlanSkillRule('data-analysis', 900),
    ],
    tokenLimit: 3200000,
    agentCreateLimit: 18,
    skillGenerateLimit: 28,
    allowCustomSkill: true,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 45,
    freeTokenPerUser: 28000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    description: '适用于当前租户内常规业务部门，开放自定义技能，控制智能体创建节奏。',
    updatedAt: '2026-06-09 16:40',
    updatedBy: '赵敏',
  },
  {
    id: 'plan-tenant-standard',
    name: '当前租户标准版',
    scope: 'TENANT_STANDARD',
    status: 'ACTIVE',
    resetCycle: 'MONTHLY',
    skillUsageLimit: 22000,
    skillRules: [
      createPlanSkillRule('knowledge-search', 6800),
      createPlanSkillRule('workflow-run', 4200),
      createPlanSkillRule('data-analysis', 3000),
      createPlanSkillRule('ppt-generate', 2200),
    ],
    tokenLimit: 12000000,
    agentCreateLimit: 80,
    skillGenerateLimit: 160,
    allowCustomSkill: true,
    allowCustomAgent: true,
    freeSkillUsagePerUser: 120,
    freeTokenPerUser: 65000,
    freeAgentCreatePerUser: 2,
    freeSkillGeneratePerUser: 5,
    description: '适用于当前租户的主力协作团队，支持自定义技能、自定义智能体和更高免费额度。',
    updatedAt: '2026-06-10 09:15',
    updatedBy: '张洪磊',
  },
  {
    id: 'plan-key-department',
    name: '重点部门增强版',
    scope: 'KEY_DEPARTMENT',
    status: 'DRAFT',
    resetCycle: 'MONTHLY',
    skillUsageLimit: 60000,
    skillRules: [
      createPlanSkillRule('knowledge-search', 14000),
      createPlanSkillRule('workflow-run', 9000),
      createPlanSkillRule('data-analysis', 7000),
      createPlanSkillRule('image-generate', 4000),
      createPlanSkillRule('agent-publish', 2000),
    ],
    tokenLimit: 32000000,
    agentCreateLimit: 220,
    skillGenerateLimit: 360,
    allowCustomSkill: true,
    allowCustomAgent: true,
    freeSkillUsagePerUser: 260,
    freeTokenPerUser: 150000,
    freeAgentCreatePerUser: 4,
    freeSkillGeneratePerUser: 10,
    description: '适用于当前租户内高并发、高复用的重点部门，便于集中扩容和重点运营。',
    updatedAt: '2026-06-07 19:10',
    updatedBy: '王子瑜',
  },
];

const INITIAL_CURRENT_TENANT_QUOTA = {
  id: 'quota-current',
  scopeType: 'CURRENT',
  targetName: '华东教育集团',
  owner: '张洪磊',
  seatCount: 386,
  planId: 'plan-tenant-standard',
  skillUsageLimit: 22000,
  skillRules: [
    createBindingSkillRule('knowledge-search', 6800, 4980),
    createBindingSkillRule('workflow-run', 4200, 3360),
    createBindingSkillRule('data-analysis', 3000, 1960),
    createBindingSkillRule('ppt-generate', 2200, 1420),
  ],
  tokenLimit: 12000000,
  agentCreateLimit: 80,
  skillGenerateLimit: 160,
  allowCustomSkill: true,
  allowCustomAgent: true,
  freeSkillUsagePerUser: 120,
  freeTokenPerUser: 65000,
  freeAgentCreatePerUser: 2,
  freeSkillGeneratePerUser: 5,
  skillUsageUsed: 16420,
  tokenUsed: 8360000,
  agentCreated: 52,
  skillGenerated: 118,
  updatedAt: '2026-06-10 09:45',
  updatedBy: '张洪磊',
};

const INITIAL_DEPARTMENT_BINDINGS = [
  {
    id: 'binding-dept-1',
    scopeType: 'DEPARTMENT',
    targetName: '客户成功部',
    owner: '王子瑜',
    seatCount: 38,
    planId: 'plan-department-standard',
    skillUsageLimit: 5200,
    skillRules: [
      createBindingSkillRule('knowledge-search', 1700, 1240),
      createBindingSkillRule('workflow-run', 1200, 980),
      createBindingSkillRule('data-analysis', 820, 610),
    ],
    tokenLimit: 3100000,
    agentCreateLimit: 16,
    skillGenerateLimit: 26,
    allowCustomSkill: true,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 45,
    freeTokenPerUser: 28000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    skillUsageUsed: 3980,
    tokenUsed: 2480000,
    agentCreated: 11,
    skillGenerated: 21,
    updatedAt: '2026-06-10 09:20',
    updatedBy: '张洪磊',
  },
  {
    id: 'binding-dept-2',
    scopeType: 'DEPARTMENT',
    targetName: '智能应用组',
    owner: '张洪磊',
    seatCount: 26,
    planId: 'plan-key-department',
    skillUsageLimit: 7600,
    skillRules: [
      createBindingSkillRule('knowledge-search', 2200, 1620),
      createBindingSkillRule('workflow-run', 1600, 1380),
      createBindingSkillRule('data-analysis', 1200, 860),
      createBindingSkillRule('image-generate', 620, 540),
    ],
    tokenLimit: 4200000,
    agentCreateLimit: 24,
    skillGenerateLimit: 46,
    allowCustomSkill: true,
    allowCustomAgent: true,
    freeSkillUsagePerUser: 80,
    freeTokenPerUser: 42000,
    freeAgentCreatePerUser: 2,
    freeSkillGeneratePerUser: 4,
    skillUsageUsed: 5640,
    tokenUsed: 3320000,
    agentCreated: 18,
    skillGenerated: 35,
    updatedAt: '2026-06-10 09:35',
    updatedBy: '张洪磊',
  },
  {
    id: 'binding-dept-3',
    scopeType: 'DEPARTMENT',
    targetName: '交付运营部',
    owner: '赵敏',
    seatCount: 29,
    planId: 'plan-department-standard',
    skillUsageLimit: 4600,
    skillRules: [
      createBindingSkillRule('knowledge-search', 1500, 920),
      createBindingSkillRule('workflow-run', 960, 620),
      createBindingSkillRule('data-analysis', 700, 430),
    ],
    tokenLimit: 2700000,
    agentCreateLimit: 12,
    skillGenerateLimit: 18,
    allowCustomSkill: true,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 38,
    freeTokenPerUser: 26000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    skillUsageUsed: 2840,
    tokenUsed: 1760000,
    agentCreated: 8,
    skillGenerated: 12,
    updatedAt: '2026-06-09 18:10',
    updatedBy: '赵敏',
  },
  {
    id: 'binding-dept-4',
    scopeType: 'DEPARTMENT',
    targetName: '品牌市场部',
    owner: '徐佳倩',
    seatCount: 21,
    planId: 'plan-department-standard',
    skillUsageLimit: 1200,
    skillRules: [
      createBindingSkillRule('knowledge-search', 420, 320),
      createBindingSkillRule('ppt-generate', 180, 156),
    ],
    tokenLimit: 820000,
    agentCreateLimit: 5,
    skillGenerateLimit: 8,
    allowCustomSkill: false,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 20,
    freeTokenPerUser: 12000,
    freeAgentCreatePerUser: 0,
    freeSkillGeneratePerUser: 1,
    skillUsageUsed: 980,
    tokenUsed: 638000,
    agentCreated: 4,
    skillGenerated: 6,
    updatedAt: '2026-06-08 14:50',
    updatedBy: '徐佳倩',
  },
];

const INITIAL_PERSONAL_BINDINGS = [
  {
    id: 'binding-user-1',
    scopeType: 'PERSONAL',
    targetName: '赵敏',
    deptName: '交付运营部',
    roleLabel: '部门管理员',
    planId: 'plan-department-standard',
    skillUsageLimit: 280,
    skillRules: [
      createBindingSkillRule('knowledge-search', 110, 92),
      createBindingSkillRule('workflow-run', 60, 48),
    ],
    tokenLimit: 180000,
    agentCreateLimit: 3,
    skillGenerateLimit: 4,
    allowCustomSkill: true,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 30,
    freeTokenPerUser: 18000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 1,
    skillUsageUsed: 224,
    tokenUsed: 136000,
    agentCreated: 2,
    skillGenerated: 3,
    updatedAt: '2026-06-10 08:55',
    updatedBy: '张洪磊',
  },
  {
    id: 'binding-user-2',
    scopeType: 'PERSONAL',
    targetName: '李昕',
    deptName: '产品研发中心',
    roleLabel: '研发负责人',
    planId: 'plan-tenant-standard',
    skillUsageLimit: 420,
    skillRules: [
      createBindingSkillRule('knowledge-search', 120, 96),
      createBindingSkillRule('data-analysis', 80, 58),
      createBindingSkillRule('workflow-run', 70, 52),
    ],
    tokenLimit: 260000,
    agentCreateLimit: 5,
    skillGenerateLimit: 8,
    allowCustomSkill: true,
    allowCustomAgent: true,
    freeSkillUsagePerUser: 60,
    freeTokenPerUser: 32000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    skillUsageUsed: 336,
    tokenUsed: 208000,
    agentCreated: 4,
    skillGenerated: 6,
    updatedAt: '2026-06-10 08:30',
    updatedBy: '张洪磊',
  },
  {
    id: 'binding-user-3',
    scopeType: 'PERSONAL',
    targetName: '王子瑜',
    deptName: '客户成功部',
    roleLabel: '一线运营',
    planId: 'plan-personal-base',
    skillUsageLimit: 180,
    skillRules: [
      createBindingSkillRule('knowledge-search', 70, 44),
      createBindingSkillRule('ppt-generate', 24, 20),
    ],
    tokenLimit: 120000,
    agentCreateLimit: 1,
    skillGenerateLimit: 2,
    allowCustomSkill: false,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 18,
    freeTokenPerUser: 10000,
    freeAgentCreatePerUser: 0,
    freeSkillGeneratePerUser: 1,
    skillUsageUsed: 132,
    tokenUsed: 76000,
    agentCreated: 1,
    skillGenerated: 1,
    updatedAt: '2026-06-09 17:20',
    updatedBy: '王子瑜',
  },
  {
    id: 'binding-user-4',
    scopeType: 'PERSONAL',
    targetName: '徐佳倩',
    deptName: '品牌市场部',
    roleLabel: '运营专员',
    planId: 'plan-personal-base',
    skillUsageLimit: 150,
    skillRules: [
      createBindingSkillRule('knowledge-search', 60, 40),
      createBindingSkillRule('ppt-generate', 20, 18),
    ],
    tokenLimit: 96000,
    agentCreateLimit: 1,
    skillGenerateLimit: 2,
    allowCustomSkill: false,
    allowCustomAgent: false,
    freeSkillUsagePerUser: 16,
    freeTokenPerUser: 9000,
    freeAgentCreatePerUser: 0,
    freeSkillGeneratePerUser: 1,
    skillUsageUsed: 118,
    tokenUsed: 64000,
    agentCreated: 0,
    skillGenerated: 1,
    updatedAt: '2026-06-09 16:05',
    updatedBy: '徐佳倩',
  },
];

const INITIAL_FREE_POLICIES = [
  {
    id: 'policy-member',
    name: '租户成员默认策略',
    userGroup: 'MEMBER',
    resetCycle: 'MONTHLY',
    freeSkillUsagePerUser: 60,
    freeTokenPerUser: 36000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    allowCustomSkill: true,
    allowCustomAgent: false,
    isDefault: true,
    description: '适用于当前租户成员的默认免费额度，结合配额方案生效。',
    updatedAt: '2026-06-10 08:30',
    updatedBy: '张洪磊',
  },
  {
    id: 'policy-dept-admin',
    name: '部门管理员增强策略',
    userGroup: 'DEPT_ADMIN',
    resetCycle: 'MONTHLY',
    freeSkillUsagePerUser: 90,
    freeTokenPerUser: 60000,
    freeAgentCreatePerUser: 2,
    freeSkillGeneratePerUser: 3,
    allowCustomSkill: true,
    allowCustomAgent: false,
    isDefault: true,
    description: '适用于租内部门管理员，便于承担推广、培训和治理动作。',
    updatedAt: '2026-06-10 09:10',
    updatedBy: '张洪磊',
  },
  {
    id: 'policy-tenant-admin',
    name: '租户管理员策略',
    userGroup: 'TENANT_ADMIN',
    resetCycle: 'MONTHLY',
    freeSkillUsagePerUser: 180,
    freeTokenPerUser: 120000,
    freeAgentCreatePerUser: 3,
    freeSkillGeneratePerUser: 5,
    allowCustomSkill: true,
    allowCustomAgent: true,
    isDefault: true,
    description: '适用于当前租户管理员，用于配置、巡检和治理场景的额外额度保障。',
    updatedAt: '2026-06-10 09:25',
    updatedBy: '张洪磊',
  },
];

function seedPlanTemplates() {
  return INITIAL_PLAN_TEMPLATES.map((item) => {
    if (item.id === 'plan-personal-base') {
      return withDimensionConfig(item, ['skill']);
    }
    if (item.id === 'plan-department-standard') {
      return withDimensionConfig(item, ['skill', 'token'], 'BALANCED');
    }
    return withDimensionConfig(item, DEFAULT_ENABLED_DIMENSIONS, 'STRICT');
  });
}

function seedCurrentTenantQuota() {
  return withDimensionConfig(INITIAL_CURRENT_TENANT_QUOTA, DEFAULT_ENABLED_DIMENSIONS, 'STRICT');
}

function seedDepartmentBindings() {
  return INITIAL_DEPARTMENT_BINDINGS.map((item) => {
    if (item.id === 'binding-dept-4') {
      return withDimensionConfig(item, ['skill']);
    }
    return withDimensionConfig(item, ['skill', 'token'], 'BALANCED');
  });
}

function seedPersonalBindings() {
  return INITIAL_PERSONAL_BINDINGS.map((item) => {
    if (item.planId === 'plan-personal-base') {
      return withDimensionConfig(item, ['skill']);
    }
    return withDimensionConfig(item, ['skill', 'token'], 'BALANCED');
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatCompact(value) {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  if (abs >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (abs >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return formatNumber(num);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function normalizeNumber(value) {
  return Number(value || 0);
}

function getEnabledDimensionKeys(enabledDimensions) {
  return normalizeEnabledDimensions(enabledDimensions);
}

function getDimensionStrategyLabel(recordOrStrategy, enabledDimensions) {
  if (typeof recordOrStrategy === 'string') {
    return MULTI_DIMENSION_STRATEGY_LABEL_MAP[recordOrStrategy] || recordOrStrategy;
  }

  const activeDimensions = getEnabledDimensionKeys(enabledDimensions || recordOrStrategy?.enabledDimensions);
  const strategyKey = activeDimensions.length > 1 ? (recordOrStrategy?.dimensionStrategy || 'STRICT') : 'SINGLE';
  return MULTI_DIMENSION_STRATEGY_LABEL_MAP[strategyKey] || strategyKey;
}

function getDimensionStrategyDescription(recordOrStrategy, enabledDimensions) {
  const activeDimensions = getEnabledDimensionKeys(enabledDimensions || recordOrStrategy?.enabledDimensions);
  const strategyKey = typeof recordOrStrategy === 'string'
    ? recordOrStrategy
    : (activeDimensions.length > 1 ? (recordOrStrategy?.dimensionStrategy || 'STRICT') : 'SINGLE');
  return MULTI_DIMENSION_STRATEGY_DESCRIPTION_MAP[strategyKey] || '';
}

function renderDimensionStrategySummary(record) {
  const enabledDimensions = getEnabledDimensionKeys(record.enabledDimensions);
  return (
    <div className="aq-free-list">
      <span>启用维度：{enabledDimensions.map((item) => DIMENSION_LABEL_MAP[item] || item).join(' / ')}</span>
      <span>整体策略：{getDimensionStrategyLabel(record, enabledDimensions)}</span>
      <span>{getDimensionStrategyDescription(record, enabledDimensions)}</span>
    </div>
  );
}

function renderMultiDimensionStrategyGuide(selectedStrategy) {
  return (
    <div className="aq-strategy-guide">
      {MULTI_DIMENSION_STRATEGY_GUIDE_ITEMS.map((item) => (
        <div
          key={item.value}
          className={`aq-strategy-guide-item${selectedStrategy === item.value ? ' aq-strategy-guide-item-active' : ''}`}
        >
          <div className="aq-strategy-guide-title">{item.title}</div>
          <div className="aq-strategy-guide-summary">{item.summary}</div>
          <div className="aq-strategy-guide-detail">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}

function cloneSkillRules(skillRules = [], includeUsed = false) {
  return (Array.isArray(skillRules) ? skillRules : []).map((item) => ({
    skillKey: item?.skillKey,
    limit: normalizeNumber(item?.limit),
    ...(includeUsed ? { used: normalizeNumber(item?.used) } : {}),
  }));
}

function buildBindingSkillRules(plan) {
  return cloneSkillRules(plan?.skillRules).map((item) => ({
    ...item,
    used: 0,
  }));
}

function normalizeSkillRules(skillRules = [], { includeUsed = false } = {}) {
  return (Array.isArray(skillRules) ? skillRules : [])
    .filter((item) => item?.skillKey)
    .map((item) => ({
      skillKey: item.skillKey,
      limit: normalizeNumber(item.limit),
      ...(includeUsed ? { used: normalizeNumber(item.used) } : {}),
    }));
}

function validateSkillRules(skillRules, totalLimit, { includeUsed = false } = {}) {
  const uniqueKeys = new Set();

  for (const item of skillRules) {
    if (uniqueKeys.has(item.skillKey)) {
      message.error(`技能「${SKILL_LABEL_MAP[item.skillKey] || item.skillKey}」重复配置，请保留一条规则。`);
      return false;
    }
    uniqueKeys.add(item.skillKey);

    if (item.limit > normalizeNumber(totalLimit)) {
      message.error(`技能「${SKILL_LABEL_MAP[item.skillKey] || item.skillKey}」的上限不能超过总技能次数上限。`);
      return false;
    }

    if (includeUsed && item.used > item.limit) {
      message.error(`技能「${SKILL_LABEL_MAP[item.skillKey] || item.skillKey}」的已使用次数不能超过该技能上限。`);
      return false;
    }
  }

  return true;
}

function renderSkillRuleCell(skillRules, { showUsage = false } = {}) {
  if (!skillRules?.length) {
    return <span className="aq-muted-text">未配置技能级限制，按总技能次数控制</span>;
  }

  return (
    <div className="aq-skill-rule-list">
      {skillRules.slice(0, 4).map((item) => {
        const meta = SKILL_META_MAP.get(item.skillKey);
        const rate = showUsage && item.limit ? Math.min(100, (normalizeNumber(item.used) / item.limit) * 100) : 0;

        return (
          <div key={item.skillKey} className="aq-skill-rule-item">
            <div className="aq-skill-rule-head">
              <Tag color={meta?.color || 'default'}>{meta?.label || item.skillKey}</Tag>
              <span>{formatNumber(item.limit)} 次</span>
            </div>
            {showUsage ? (
              <div className="aq-skill-rule-progress">
                <div className="aq-skill-rule-progress-text">
                  <span>{formatNumber(item.used)} / {formatNumber(item.limit)}</span>
                  <span>{formatPercent(rate)}</span>
                </div>
                <Progress
                  percent={Math.round(rate)}
                  showInfo={false}
                  strokeColor={getUsageColor(rate)}
                  trailColor="#eef2f7"
                  size="small"
                />
              </div>
            ) : null}
          </div>
        );
      })}
      {skillRules.length > 4 ? <span className="aq-muted-text">其余 {skillRules.length - 4} 个技能规则已折叠</span> : null}
    </div>
  );
}

function renderStatusTag(status) {
  const colorMap = {
    ACTIVE: 'success',
    DRAFT: 'processing',
    DISABLED: 'default',
  };
  return <Tag color={colorMap[status] || 'default'}>{PLAN_STATUS_LABEL_MAP[status] || status}</Tag>;
}

function renderSupportTag(flag, yesText, noText) {
  return <Tag color={flag ? 'success' : 'default'}>{flag ? yesText : noText}</Tag>;
}

function getUsageColor(rate) {
  if (rate >= 90) return '#ff4d4f';
  if (rate >= 75) return '#faad14';
  return '#52c41a';
}

function getDimensionRates(record) {
  const enabledDimensions = getEnabledDimensionKeys(record.enabledDimensions);
  const skillRuleRates = (record.skillRules || []).map((item) => (
    item.limit ? normalizeNumber(item.used) / item.limit : 0
  ));
  const skillRates = [
    record.skillUsageLimit ? normalizeNumber(record.skillUsageUsed) / record.skillUsageLimit : 0,
    record.skillGenerateLimit ? normalizeNumber(record.skillGenerated) / record.skillGenerateLimit : 0,
    ...skillRuleRates,
  ];
  const rates = [];

  if (enabledDimensions.includes('skill')) {
    rates.push(Math.max(...skillRates, 0));
  }
  if (enabledDimensions.includes('token')) {
    rates.push(record.tokenLimit ? normalizeNumber(record.tokenUsed) / record.tokenLimit : 0);
  }
  if (enabledDimensions.includes('agent')) {
    rates.push(record.agentCreateLimit ? normalizeNumber(record.agentCreated) / record.agentCreateLimit : 0);
  }

  return rates;
}

function getMaxQuotaRate(record) {
  const dimensionRates = getDimensionRates(record);
  if (!dimensionRates.length) return 0;

  if ((record.dimensionStrategy || 'STRICT') === 'BALANCED' && dimensionRates.length > 1) {
    return dimensionRates.reduce((sum, item) => sum + item, 0) / dimensionRates.length;
  }

  return Math.max(...dimensionRates);
}

function renderUsageProgress(used, limit, formatter) {
  const safeLimit = Number(limit || 0);
  const rate = safeLimit > 0 ? Math.min(100, (Number(used || 0) / safeLimit) * 100) : 0;
  return (
    <div className="aq-progress-cell">
      <div className="aq-progress-text">
        <span>{formatter(used)} / {formatter(limit)}</span>
        <span>{formatPercent(rate)}</span>
      </div>
      <Progress
        percent={Math.round(rate)}
        showInfo={false}
        strokeColor={getUsageColor(rate)}
        trailColor="#eef2f7"
        size="small"
      />
    </div>
  );
}

function renderDimensionCell(sections) {
  return (
    <div className="aq-dimension-list">
      {sections.map((section) => (
        <div key={section.title} className="aq-dimension-card">
          <div className="aq-dimension-card-title">{section.title}</div>
          <div className="aq-dimension-card-items">
            {section.items.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderQuotaCell(record) {
  return renderDimensionCell([
    {
      title: '技能维度',
      items: [
        `技能使用：${formatNumber(record.skillUsageLimit)} 次`,
        `技能生成：${formatNumber(record.skillGenerateLimit)} 次`,
        `技能细分：${record.skillRules?.length ? `${formatNumber(record.skillRules.length)} 个技能` : '未配置'}`,
      ],
    },
    {
      title: 'Token 维度',
      items: [
        `Token 上限：${formatCompact(record.tokenLimit)}`,
      ],
    },
    {
      title: '智能体维度',
      items: [
        `创建上限：${formatNumber(record.agentCreateLimit)} 个`,
      ],
    },
  ]);
}

function renderFreeQuotaCell(record) {
  return renderDimensionCell([
    {
      title: '技能维度',
      items: [
        `免费技能：${formatNumber(record.freeSkillUsagePerUser)} 次 / 人`,
        `免费生成：${formatNumber(record.freeSkillGeneratePerUser)} 次 / 人`,
      ],
    },
    {
      title: 'Token 维度',
      items: [
        `免费 Token：${formatCompact(record.freeTokenPerUser)} / 人`,
      ],
    },
    {
      title: '智能体维度',
      items: [
        `免费创建：${formatNumber(record.freeAgentCreatePerUser)} 个 / 人`,
      ],
    },
  ]);
}

function renderSkillPlanCell(record) {
  return (
    <div className="aq-free-list">
      <span>技能使用上限：{formatNumber(record.skillUsageLimit)} 次</span>
      <span>技能生成上限：{formatNumber(record.skillGenerateLimit)} 次</span>
      <span>免费技能：{formatNumber(record.freeSkillUsagePerUser)} 次 / 人</span>
      <span>免费生成：{formatNumber(record.freeSkillGeneratePerUser)} 次 / 人</span>
    </div>
  );
}

function renderTokenPlanCell(record) {
  return (
    <div className="aq-free-list">
      <span>Token 上限：{formatCompact(record.tokenLimit)}</span>
      <span>免费 Token：{formatCompact(record.freeTokenPerUser)} / 人</span>
    </div>
  );
}

function renderAgentPlanCell(record) {
  return (
    <div className="aq-free-list">
      <span>创建上限：{formatNumber(record.agentCreateLimit)} 个</span>
      <span>免费创建：{formatNumber(record.freeAgentCreatePerUser)} 个 / 人</span>
    </div>
  );
}

function renderBindingSkillPolicyCell(record) {
  return (
    <div className="aq-free-list">
      <span>免费技能：{formatNumber(record.freeSkillUsagePerUser)} 次 / 人</span>
      <span>免费生成：{formatNumber(record.freeSkillGeneratePerUser)} 次 / 人</span>
      <span>{record.allowCustomSkill ? '支持' : '禁用'}自定义技能</span>
    </div>
  );
}

function renderBindingTokenPolicyCell(record) {
  return (
    <div className="aq-free-list">
      <span>Token 上限：{formatCompact(record.tokenLimit)}</span>
      <span>免费 Token：{formatCompact(record.freeTokenPerUser)} / 人</span>
    </div>
  );
}

function renderBindingAgentPolicyCell(record) {
  return (
    <div className="aq-free-list">
      <span>智能体上限：{formatNumber(record.agentCreateLimit)} 个</span>
      <span>免费创建：{formatNumber(record.freeAgentCreatePerUser)} 个 / 人</span>
      <span>{record.allowCustomAgent ? '支持' : '禁用'}自定义智能体</span>
    </div>
  );
}

function renderRiskCell(record) {
  const rate = Math.min(100, Math.round(getMaxQuotaRate(record) * 100));
  const status = rate >= 90 ? '超高' : rate >= 75 ? '预警' : '健康';

  return (
    <div className="aq-progress-cell">
      <div className="aq-progress-text">
        <span>{status}</span>
        <span>{formatPercent(rate)}</span>
      </div>
      <Progress
        percent={rate}
        showInfo={false}
        strokeColor={getUsageColor(rate)}
        trailColor="#eef2f7"
        size="small"
      />
    </div>
  );
}

function renderPolicySkillCell(record) {
  return (
    <div className="aq-free-list">
      <span>免费技能：{formatNumber(record.freeSkillUsagePerUser)} 次 / 人</span>
      <span>免费生成：{formatNumber(record.freeSkillGeneratePerUser)} 次 / 人</span>
      <span>{record.allowCustomSkill ? '支持' : '不支持'}自定义技能</span>
    </div>
  );
}

function renderPolicyTokenCell(record) {
  return (
    <div className="aq-free-list">
      <span>免费 Token：{formatCompact(record.freeTokenPerUser)} / 人</span>
    </div>
  );
}

function renderPolicyAgentCell(record) {
  return (
    <div className="aq-free-list">
      <span>免费创建：{formatNumber(record.freeAgentCreatePerUser)} 个 / 人</span>
      <span>{record.allowCustomAgent ? '支持' : '不支持'}自定义智能体</span>
    </div>
  );
}

function buildPlanDefaults(plan) {
  return {
    planId: plan?.id,
    enabledDimensions: getEnabledDimensionKeys(plan?.enabledDimensions),
    dimensionStrategy: getEnabledDimensionKeys(plan?.enabledDimensions).length > 1 ? (plan?.dimensionStrategy || 'STRICT') : 'SINGLE',
    skillUsageLimit: plan?.skillUsageLimit || 0,
    skillRules: buildBindingSkillRules(plan),
    tokenLimit: plan?.tokenLimit || 0,
    agentCreateLimit: plan?.agentCreateLimit || 0,
    skillGenerateLimit: plan?.skillGenerateLimit || 0,
    allowCustomSkill: !!plan?.allowCustomSkill,
    allowCustomAgent: !!plan?.allowCustomAgent,
    freeSkillUsagePerUser: plan?.freeSkillUsagePerUser || 0,
    freeTokenPerUser: plan?.freeTokenPerUser || 0,
    freeAgentCreatePerUser: plan?.freeAgentCreatePerUser || 0,
    freeSkillGeneratePerUser: plan?.freeSkillGeneratePerUser || 0,
  };
}

function defaultPlanFormValues() {
  return {
    name: '',
    scope: 'TENANT_STANDARD',
    status: 'ACTIVE',
    resetCycle: 'MONTHLY',
    enabledDimensions: [...DEFAULT_ENABLED_DIMENSIONS],
    dimensionStrategy: 'STRICT',
    skillUsageLimit: 10000,
    skillRules: [
      createPlanSkillRule('knowledge-search', 3000),
      createPlanSkillRule('workflow-run', 1800),
    ],
    tokenLimit: 6000000,
    agentCreateLimit: 50,
    skillGenerateLimit: 80,
    allowCustomSkill: true,
    allowCustomAgent: true,
    freeSkillUsagePerUser: 80,
    freeTokenPerUser: 40000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 3,
    description: '',
  };
}

function defaultPolicyFormValues() {
  return {
    name: '',
    userGroup: 'MEMBER',
    resetCycle: 'MONTHLY',
    freeSkillUsagePerUser: 60,
    freeTokenPerUser: 36000,
    freeAgentCreatePerUser: 1,
    freeSkillGeneratePerUser: 2,
    allowCustomSkill: true,
    allowCustomAgent: false,
    isDefault: false,
    description: '',
  };
}

export default function AgentQuotaModule() {
  const [activeTenantQuotaTab, setActiveTenantQuotaTab] = useState('current');
  const [plans, setPlans] = useState(() => seedPlanTemplates());
  const [currentTenantQuota, setCurrentTenantQuota] = useState(() => seedCurrentTenantQuota());
  const [departmentBindings, setDepartmentBindings] = useState(() => seedDepartmentBindings());
  const [personalBindings, setPersonalBindings] = useState(() => seedPersonalBindings());
  const [freePolicies, setFreePolicies] = useState(INITIAL_FREE_POLICIES);

  const [planKeyword, setPlanKeyword] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState(undefined);
  const [bindingKeyword, setBindingKeyword] = useState('');
  const [bindingPlanFilter, setBindingPlanFilter] = useState(undefined);
  const [policyKeyword, setPolicyKeyword] = useState('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState('plan');
  const [detailRecord, setDetailRecord] = useState(null);
  const [tableScrollY, setTableScrollY] = useState({
    plans: undefined,
    current: undefined,
    department: undefined,
    personal: undefined,
    policy: undefined,
  });

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalMode, setPlanModalMode] = useState('create');
  const [editingPlan, setEditingPlan] = useState(null);

  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [bindingModalMode, setBindingModalMode] = useState('create');
  const [editingBinding, setEditingBinding] = useState(null);
  const [bindingScope, setBindingScope] = useState('DEPARTMENT');

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalMode, setPolicyModalMode] = useState('create');
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [planForm] = Form.useForm();
  const [bindingForm] = Form.useForm();
  const [policyForm] = Form.useForm();
  const planTableShellRef = useRef(null);
  const currentTableShellRef = useRef(null);
  const departmentTableShellRef = useRef(null);
  const personalTableShellRef = useRef(null);
  const policyTableShellRef = useRef(null);

  const selectedBindingPlanId = Form.useWatch('planId', bindingForm);
  const planEnabledDimensions = getEnabledDimensionKeys(Form.useWatch('enabledDimensions', planForm));
  const bindingEnabledDimensions = getEnabledDimensionKeys(Form.useWatch('enabledDimensions', bindingForm));
  const planDimensionStrategy = Form.useWatch('dimensionStrategy', planForm);
  const bindingDimensionStrategy = Form.useWatch('dimensionStrategy', bindingForm);

  const planMap = useMemo(() => new Map(plans.map((item) => [item.id, item])), [plans]);
  const selectedBindingPlan = selectedBindingPlanId ? planMap.get(selectedBindingPlanId) : null;

  function attachPlanInfo(record) {
    return {
      ...record,
      planName: planMap.get(record.planId)?.name || '未绑定模板',
      planStatus: planMap.get(record.planId)?.status,
    };
  }

  const currentTenantRow = useMemo(() => attachPlanInfo(currentTenantQuota), [currentTenantQuota, planMap]);
  const departmentRows = useMemo(() => departmentBindings.map(attachPlanInfo), [departmentBindings, planMap]);
  const personalRows = useMemo(() => personalBindings.map(attachPlanInfo), [personalBindings, planMap]);

  const summary = useMemo(() => {
    const enabledPlans = plans.filter((item) => item.status === 'ACTIVE');
    const quotaObjects = [currentTenantRow, ...departmentRows, ...personalRows];
    const riskObjects = quotaObjects.filter((item) => getMaxQuotaRate(item) >= 0.8).length;
    const monthlyFreeTokens = normalizeNumber(currentTenantRow.freeTokenPerUser) * normalizeNumber(currentTenantRow.seatCount);

    return {
      totalPlans: plans.length,
      enabledPlans: enabledPlans.length,
      currentTenantMembers: currentTenantRow.seatCount,
      departmentQuotaCount: departmentRows.length,
      personalQuotaCount: personalRows.length,
      monthlyFreeTokens,
      customSkillPlans: enabledPlans.filter((item) => item.allowCustomSkill).length,
      customAgentPlans: enabledPlans.filter((item) => item.allowCustomAgent).length,
      riskObjects,
    };
  }, [plans, currentTenantRow, departmentRows, personalRows]);

  const filteredPlans = useMemo(() => {
    return plans.filter((item) => {
      const keyword = planKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.name} ${item.description || ''} ${PLAN_SCOPE_LABEL_MAP[item.scope] || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (planStatusFilter && item.status !== planStatusFilter) return false;
      return true;
    });
  }, [plans, planKeyword, planStatusFilter]);

  const filteredDepartmentRows = useMemo(() => {
    return departmentRows.filter((item) => {
      const keyword = bindingKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.targetName} ${item.owner || ''} ${item.planName} ${item.deptName || ''} ${item.roleLabel || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (bindingPlanFilter && item.planId !== bindingPlanFilter) return false;
      return true;
    });
  }, [departmentRows, bindingKeyword, bindingPlanFilter]);

  const filteredPersonalRows = useMemo(() => {
    return personalRows.filter((item) => {
      const keyword = bindingKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.targetName} ${item.deptName || ''} ${item.roleLabel || ''} ${item.planName}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (bindingPlanFilter && item.planId !== bindingPlanFilter) return false;
      return true;
    });
  }, [personalRows, bindingKeyword, bindingPlanFilter]);

  const filteredPolicies = useMemo(() => {
    return freePolicies.filter((item) => {
      const keyword = policyKeyword.trim().toLowerCase();
      if (!keyword) return true;
      const haystack = `${item.name} ${USER_GROUP_LABEL_MAP[item.userGroup] || ''} ${item.description || ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [freePolicies, policyKeyword]);

  const computeAdaptiveScrollY = useCallback((shell, rowCount) => {
    if (!shell || typeof window === 'undefined') return undefined;
    const rect = shell.getBoundingClientRect();
    const available = Math.floor(window.innerHeight - rect.top - 20);
    if (available <= 160) return undefined;

    const estimatedTableBodyHeight = rowCount > 0 ? rowCount * 54 + 16 : 140;
    return Math.min(estimatedTableBodyHeight, available);
  }, []);

  useLayoutEffect(() => {
    let frameId = 0;

    function updateScrollY() {
      setTableScrollY({
        plans: computeAdaptiveScrollY(planTableShellRef.current, filteredPlans.length),
        current: computeAdaptiveScrollY(currentTableShellRef.current, 1),
        department: computeAdaptiveScrollY(departmentTableShellRef.current, filteredDepartmentRows.length),
        personal: computeAdaptiveScrollY(personalTableShellRef.current, filteredPersonalRows.length),
        policy: computeAdaptiveScrollY(policyTableShellRef.current, filteredPolicies.length),
      });
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateScrollY);
    }

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [
    activeTenantQuotaTab,
    computeAdaptiveScrollY,
    filteredDepartmentRows.length,
    filteredPersonalRows.length,
    filteredPlans.length,
    filteredPolicies.length,
  ]);

  const planOptionList = useMemo(() => {
    return plans.map((item) => ({
      value: item.id,
      label: `${item.name} · ${PLAN_SCOPE_LABEL_MAP[item.scope] || item.scope}`,
    }));
  }, [plans]);

  function resetPlanFilters() {
    setPlanKeyword('');
    setPlanStatusFilter(undefined);
  }

  function resetBindingFilters() {
    setBindingKeyword('');
    setBindingPlanFilter(undefined);
  }

  function resetPolicyFilters() {
    setPolicyKeyword('');
  }

  function openDetailModal(type, record) {
    setDetailModalType(type);
    setDetailRecord(record);
    setDetailModalOpen(true);
  }

  function openCreatePlan() {
    setPlanModalMode('create');
    setEditingPlan(null);
    planForm.setFieldsValue(defaultPlanFormValues());
    setPlanModalOpen(true);
  }

  function openEditPlan(record) {
    setPlanModalMode('edit');
    setEditingPlan(record);
    planForm.setFieldsValue({
      name: record.name,
      scope: record.scope,
      status: record.status,
      resetCycle: record.resetCycle,
      enabledDimensions: getEnabledDimensionKeys(record.enabledDimensions),
      dimensionStrategy: getEnabledDimensionKeys(record.enabledDimensions).length > 1 ? (record.dimensionStrategy || 'STRICT') : 'SINGLE',
      skillUsageLimit: record.skillUsageLimit,
      skillRules: cloneSkillRules(record.skillRules),
      tokenLimit: record.tokenLimit,
      agentCreateLimit: record.agentCreateLimit,
      skillGenerateLimit: record.skillGenerateLimit,
      allowCustomSkill: record.allowCustomSkill,
      allowCustomAgent: record.allowCustomAgent,
      freeSkillUsagePerUser: record.freeSkillUsagePerUser,
      freeTokenPerUser: record.freeTokenPerUser,
      freeAgentCreatePerUser: record.freeAgentCreatePerUser,
      freeSkillGeneratePerUser: record.freeSkillGeneratePerUser,
      description: record.description,
    });
    setPlanModalOpen(true);
  }

  function openCopyPlan(record) {
    setPlanModalMode('copy');
    setEditingPlan(record);
    planForm.setFieldsValue({
      name: `${record.name}-副本`,
      scope: record.scope,
      status: 'DRAFT',
      resetCycle: record.resetCycle,
      enabledDimensions: getEnabledDimensionKeys(record.enabledDimensions),
      dimensionStrategy: getEnabledDimensionKeys(record.enabledDimensions).length > 1 ? (record.dimensionStrategy || 'STRICT') : 'SINGLE',
      skillUsageLimit: record.skillUsageLimit,
      skillRules: cloneSkillRules(record.skillRules),
      tokenLimit: record.tokenLimit,
      agentCreateLimit: record.agentCreateLimit,
      skillGenerateLimit: record.skillGenerateLimit,
      allowCustomSkill: record.allowCustomSkill,
      allowCustomAgent: record.allowCustomAgent,
      freeSkillUsagePerUser: record.freeSkillUsagePerUser,
      freeTokenPerUser: record.freeTokenPerUser,
      freeAgentCreatePerUser: record.freeAgentCreatePerUser,
      freeSkillGeneratePerUser: record.freeSkillGeneratePerUser,
      description: record.description,
    });
    setPlanModalOpen(true);
  }

  async function handlePlanSubmit() {
    try {
      const values = await planForm.validateFields();
      const enabledDimensions = getEnabledDimensionKeys(values.enabledDimensions);
      if (!enabledDimensions.length) {
        message.error('请至少启用一个维度。');
        return;
      }
      const skillRules = normalizeSkillRules(values.skillRules);
      if (!validateSkillRules(skillRules, values.skillUsageLimit)) return;

      const payload = {
        name: values.name,
        scope: values.scope,
        status: values.status,
        resetCycle: values.resetCycle,
        enabledDimensions,
        dimensionStrategy: enabledDimensions.length > 1 ? (values.dimensionStrategy || 'STRICT') : 'SINGLE',
        skillUsageLimit: normalizeNumber(values.skillUsageLimit),
        skillRules,
        tokenLimit: normalizeNumber(values.tokenLimit),
        agentCreateLimit: normalizeNumber(values.agentCreateLimit),
        skillGenerateLimit: normalizeNumber(values.skillGenerateLimit),
        allowCustomSkill: !!values.allowCustomSkill,
        allowCustomAgent: !!values.allowCustomAgent,
        freeSkillUsagePerUser: normalizeNumber(values.freeSkillUsagePerUser),
        freeTokenPerUser: normalizeNumber(values.freeTokenPerUser),
        freeAgentCreatePerUser: normalizeNumber(values.freeAgentCreatePerUser),
        freeSkillGeneratePerUser: normalizeNumber(values.freeSkillGeneratePerUser),
        description: values.description,
        updatedAt: NOW_TEXT,
        updatedBy: CURRENT_OPERATOR,
      };

      if (planModalMode === 'edit' && editingPlan) {
        setPlans((prev) => prev.map((item) => (item.id === editingPlan.id ? { ...item, ...payload } : item)));
        message.success('配额方案已更新');
      } else {
        setPlans((prev) => [
          {
            id: `plan-${Date.now()}`,
            ...payload,
          },
          ...prev,
        ]);
        message.success(planModalMode === 'copy' ? '配额方案副本已创建' : '配额方案已创建');
      }
      setPlanModalOpen(false);
    } catch (error) {
      // validation errors are handled by antd form
    }
  }

  function handlePlanStatusChange(record, nextStatus) {
    setPlans((prev) => prev.map((item) => (item.id === record.id ? { ...item, status: nextStatus, updatedAt: NOW_TEXT, updatedBy: CURRENT_OPERATOR } : item)));
    message.success(nextStatus === 'ACTIVE' ? '配额方案已启用' : '配额方案已停用');
  }

  function openCreateBinding(scopeType = 'DEPARTMENT') {
    const defaultPlan = plans.find((item) => item.status === 'ACTIVE') || plans[0];
    setBindingScope(scopeType);
    setBindingModalMode('create');
    setEditingBinding(null);
    bindingForm.resetFields();

    if (scopeType === 'PERSONAL') {
      bindingForm.setFieldsValue({
        targetName: '',
        deptName: '',
        roleLabel: '',
        owner: undefined,
        seatCount: undefined,
        skillUsageUsed: 0,
        skillRules: buildBindingSkillRules(defaultPlan),
        tokenUsed: 0,
        agentCreated: 0,
        skillGenerated: 0,
        ...buildPlanDefaults(defaultPlan),
      });
    } else {
      bindingForm.setFieldsValue({
        targetName: scopeType === 'CURRENT' ? currentTenantRow.targetName : '',
        owner: scopeType === 'CURRENT' ? currentTenantRow.owner : '',
        seatCount: scopeType === 'CURRENT' ? currentTenantRow.seatCount : 20,
        deptName: undefined,
        roleLabel: undefined,
        skillUsageUsed: 0,
        skillRules: buildBindingSkillRules(defaultPlan),
        tokenUsed: 0,
        agentCreated: 0,
        skillGenerated: 0,
        ...buildPlanDefaults(defaultPlan),
      });
    }
    setBindingModalOpen(true);
  }

  function openEditBinding(record) {
    setBindingScope(record.scopeType);
    setBindingModalMode('edit');
    setEditingBinding(record);
    bindingForm.resetFields();
    bindingForm.setFieldsValue({
      targetName: record.targetName,
      owner: record.owner,
      seatCount: record.seatCount,
      deptName: record.deptName,
      roleLabel: record.roleLabel,
      planId: record.planId,
      enabledDimensions: getEnabledDimensionKeys(record.enabledDimensions),
      dimensionStrategy: getEnabledDimensionKeys(record.enabledDimensions).length > 1 ? (record.dimensionStrategy || 'STRICT') : 'SINGLE',
      skillUsageLimit: record.skillUsageLimit,
      skillRules: cloneSkillRules(record.skillRules, true),
      tokenLimit: record.tokenLimit,
      agentCreateLimit: record.agentCreateLimit,
      skillGenerateLimit: record.skillGenerateLimit,
      allowCustomSkill: record.allowCustomSkill,
      allowCustomAgent: record.allowCustomAgent,
      freeSkillUsagePerUser: record.freeSkillUsagePerUser,
      freeTokenPerUser: record.freeTokenPerUser,
      freeAgentCreatePerUser: record.freeAgentCreatePerUser,
      freeSkillGeneratePerUser: record.freeSkillGeneratePerUser,
      skillUsageUsed: record.skillUsageUsed,
      tokenUsed: record.tokenUsed,
      agentCreated: record.agentCreated,
      skillGenerated: record.skillGenerated,
    });
    setBindingModalOpen(true);
  }

  function handleBindingPlanChange(planId) {
    const nextPlan = planMap.get(planId);
    if (!nextPlan) return;
    bindingForm.setFieldsValue({
      ...buildPlanDefaults(nextPlan),
    });
    message.info('已按配额方案带入默认额度，可继续单独调整。');
  }

  async function handleBindingSubmit() {
    try {
      const values = await bindingForm.validateFields();
      const enabledDimensions = getEnabledDimensionKeys(values.enabledDimensions);
      if (!enabledDimensions.length) {
        message.error('请至少启用一个维度。');
        return;
      }
      const skillRules = normalizeSkillRules(values.skillRules, { includeUsed: true });
      if (!validateSkillRules(skillRules, values.skillUsageLimit, { includeUsed: true })) return;

      const payload = {
        scopeType: bindingScope,
        targetName: values.targetName,
        owner: values.owner,
        seatCount: bindingScope === 'PERSONAL' ? 1 : normalizeNumber(values.seatCount),
        deptName: values.deptName,
        roleLabel: values.roleLabel,
        planId: values.planId,
        enabledDimensions,
        dimensionStrategy: enabledDimensions.length > 1 ? (values.dimensionStrategy || 'STRICT') : 'SINGLE',
        skillUsageLimit: normalizeNumber(values.skillUsageLimit),
        skillRules,
        tokenLimit: normalizeNumber(values.tokenLimit),
        agentCreateLimit: normalizeNumber(values.agentCreateLimit),
        skillGenerateLimit: normalizeNumber(values.skillGenerateLimit),
        allowCustomSkill: !!values.allowCustomSkill,
        allowCustomAgent: !!values.allowCustomAgent,
        freeSkillUsagePerUser: normalizeNumber(values.freeSkillUsagePerUser),
        freeTokenPerUser: normalizeNumber(values.freeTokenPerUser),
        freeAgentCreatePerUser: normalizeNumber(values.freeAgentCreatePerUser),
        freeSkillGeneratePerUser: normalizeNumber(values.freeSkillGeneratePerUser),
        skillUsageUsed: normalizeNumber(values.skillUsageUsed),
        tokenUsed: normalizeNumber(values.tokenUsed),
        agentCreated: normalizeNumber(values.agentCreated),
        skillGenerated: normalizeNumber(values.skillGenerated),
        updatedAt: NOW_TEXT,
        updatedBy: CURRENT_OPERATOR,
      };

      if (bindingModalMode === 'edit' && editingBinding) {
        if (bindingScope === 'CURRENT') {
          setCurrentTenantQuota((prev) => ({ ...prev, ...payload }));
          message.success('当前租户配额已更新');
        } else if (bindingScope === 'DEPARTMENT') {
          setDepartmentBindings((prev) => prev.map((item) => (item.id === editingBinding.id ? { ...item, ...payload } : item)));
          message.success('部门配额已更新');
        } else {
          setPersonalBindings((prev) => prev.map((item) => (item.id === editingBinding.id ? { ...item, ...payload } : item)));
          message.success('个人配额已更新');
        }
      } else {
        const nextRecord = {
          id: `binding-${Date.now()}`,
          ...payload,
        };

        if (bindingScope === 'DEPARTMENT') {
          setDepartmentBindings((prev) => [nextRecord, ...prev]);
          message.success('部门配额已创建');
        } else if (bindingScope === 'PERSONAL') {
          setPersonalBindings((prev) => [nextRecord, ...prev]);
          message.success('个人配额已创建');
        } else {
          setCurrentTenantQuota((prev) => ({ ...prev, ...nextRecord }));
          message.success('当前租户配额已创建');
        }
      }
      setBindingModalOpen(false);
    } catch (error) {
      // validation errors are handled by antd form
    }
  }

  function openCreatePolicy() {
    setPolicyModalMode('create');
    setEditingPolicy(null);
    policyForm.setFieldsValue(defaultPolicyFormValues());
    setPolicyModalOpen(true);
  }

  function openEditPolicy(record) {
    setPolicyModalMode('edit');
    setEditingPolicy(record);
    policyForm.setFieldsValue({
      name: record.name,
      userGroup: record.userGroup,
      resetCycle: record.resetCycle,
      freeSkillUsagePerUser: record.freeSkillUsagePerUser,
      freeTokenPerUser: record.freeTokenPerUser,
      freeAgentCreatePerUser: record.freeAgentCreatePerUser,
      freeSkillGeneratePerUser: record.freeSkillGeneratePerUser,
      allowCustomSkill: record.allowCustomSkill,
      allowCustomAgent: record.allowCustomAgent,
      isDefault: record.isDefault,
      description: record.description,
    });
    setPolicyModalOpen(true);
  }

  async function handlePolicySubmit() {
    try {
      const values = await policyForm.validateFields();
      const payload = {
        name: values.name,
        userGroup: values.userGroup,
        resetCycle: values.resetCycle,
        freeSkillUsagePerUser: normalizeNumber(values.freeSkillUsagePerUser),
        freeTokenPerUser: normalizeNumber(values.freeTokenPerUser),
        freeAgentCreatePerUser: normalizeNumber(values.freeAgentCreatePerUser),
        freeSkillGeneratePerUser: normalizeNumber(values.freeSkillGeneratePerUser),
        allowCustomSkill: !!values.allowCustomSkill,
        allowCustomAgent: !!values.allowCustomAgent,
        isDefault: !!values.isDefault,
        description: values.description,
        updatedAt: NOW_TEXT,
        updatedBy: CURRENT_OPERATOR,
      };

      setFreePolicies((prev) => {
        const nextList = prev.map((item) => {
          if (payload.isDefault && item.userGroup === payload.userGroup) {
            return { ...item, isDefault: false };
          }
          return item;
        });

        if (policyModalMode === 'edit' && editingPolicy) {
          return nextList.map((item) => (item.id === editingPolicy.id ? { ...item, ...payload } : item));
        }

        return [
          {
            id: `policy-${Date.now()}`,
            ...payload,
          },
          ...nextList,
        ];
      });

      message.success(policyModalMode === 'edit' ? '免费配额策略已更新' : '免费配额策略已创建');
      setPolicyModalOpen(false);
    } catch (error) {
      // validation errors are handled by antd form
    }
  }

  const summaryCards = [
    {
      key: 'plans',
      title: '启用配额方案',
      value: summary.enabledPlans,
      suffix: `/ ${summary.totalPlans}`,
      icon: <SettingOutlined style={{ color: '#1677ff' }} />,
    },
    {
      key: 'members',
      title: '当前租户成员',
      value: summary.currentTenantMembers,
      suffix: '人',
      icon: <TeamOutlined style={{ color: '#52c41a' }} />,
    },
    {
      key: 'departments',
      title: '部门配额',
      value: summary.departmentQuotaCount,
      suffix: '个部门',
      icon: <ApartmentOutlined style={{ color: '#722ed1' }} />,
    },
    {
      key: 'persons',
      title: '个人配额',
      value: summary.personalQuotaCount,
      suffix: '人',
      icon: <UserOutlined style={{ color: '#13c2c2' }} />,
    },
    {
      key: 'free-tokens',
      title: '月度免费 Token 池',
      value: formatCompact(summary.monthlyFreeTokens),
      suffix: '',
      icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
    },
    {
      key: 'custom-skill',
      title: '支持自定义技能',
      value: summary.customSkillPlans,
      suffix: '个方案',
      icon: <RobotOutlined style={{ color: '#722ed1' }} />,
    },
    {
      key: 'custom-agent',
      title: '支持自定义智能体',
      value: summary.customAgentPlans,
      suffix: '个方案',
      icon: <RobotOutlined style={{ color: '#13c2c2' }} />,
    },
    {
      key: 'risk',
      title: '临近阈值对象',
      value: summary.riskObjects,
      suffix: '个',
      icon: <ThunderboltOutlined style={{ color: '#ff4d4f' }} />,
    },
  ];

  const planColumns = [
    {
      title: '配额方案',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      fixed: 'left',
      render: (_, record) => (
        <div className="aq-identity-cell">
          <div className="aq-identity-title">{record.name}</div>
          <div className="aq-identity-desc">{record.description}</div>
        </div>
      ),
    },
    {
      title: '适用层级',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      render: (value) => <Tag color="blue">{PLAN_SCOPE_LABEL_MAP[value] || value}</Tag>,
    },
    {
      title: '重置周期',
      dataIndex: 'resetCycle',
      key: 'resetCycle',
      width: 120,
      render: (value) => RESET_CYCLE_LABEL_MAP[value] || value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: '最近更新',
      key: 'updated',
      width: 160,
      render: (_, record) => (
        <div className="aq-updated-cell">
          <span>{record.updatedAt}</span>
          <span>{record.updatedBy}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" onClick={() => openDetailModal('plan', record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPlan(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => openCopyPlan(record)}>
            复制
          </Button>
          {record.status === 'ACTIVE' ? (
            <Popconfirm title="确认停用该配额方案？" onConfirm={() => handlePlanStatusChange(record, 'DISABLED')}>
              <Button type="link" size="small" danger>
                停用
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认启用该配额方案？" onConfirm={() => handlePlanStatusChange(record, 'ACTIVE')}>
              <Button type="link" size="small">
                启用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  function buildBindingColumns(scopeType) {
    const identityColumn = scopeType === 'PERSONAL'
      ? {
          title: '个人',
          dataIndex: 'targetName',
          key: 'targetName',
          width: 220,
          fixed: 'left',
          render: (_, record) => (
            <div className="aq-identity-cell">
              <div className="aq-identity-title">{record.targetName}</div>
              <div className="aq-identity-desc">{record.deptName} · {record.roleLabel}</div>
            </div>
          ),
        }
      : {
          title: scopeType === 'CURRENT' ? '当前租户' : '部门',
          dataIndex: 'targetName',
          key: 'targetName',
          width: 240,
          fixed: 'left',
          render: (_, record) => (
            <div className="aq-identity-cell">
              <div className="aq-identity-title">{record.targetName}</div>
              <div className="aq-identity-desc">负责人：{record.owner} · {formatNumber(record.seatCount)} 人</div>
            </div>
          ),
        };

    return [
      identityColumn,
      {
        title: '绑定方案',
        key: 'plan',
        width: 160,
        render: (_, record) => (
          <div className="aq-tag-stack">
            <Tag color="blue">{record.planName}</Tag>
            {renderStatusTag(record.planStatus || 'DRAFT')}
          </div>
        ),
      },
      {
        title: '配额风险',
        key: 'risk',
        width: 220,
        render: (_, record) => renderRiskCell(record),
      },
      {
        title: '最近更新',
        key: 'updated',
        width: 160,
        render: (_, record) => (
          <div className="aq-updated-cell">
            <span>{record.updatedAt}</span>
            <span>{record.updatedBy}</span>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Space size={4} wrap>
            <Button type="link" size="small" onClick={() => openDetailModal('binding', record)}>
              详情
            </Button>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditBinding(record)}>
              编辑
            </Button>
          </Space>
        ),
      },
    ];
  }

  const currentTenantColumns = buildBindingColumns('CURRENT');
  const departmentColumns = buildBindingColumns('DEPARTMENT');
  const personalColumns = buildBindingColumns('PERSONAL');

  const policyColumns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="aq-identity-cell">
          <div className="aq-identity-title">{record.name}</div>
          <div className="aq-identity-desc">{record.description}</div>
        </div>
      ),
    },
    {
      title: '租内身份',
      dataIndex: 'userGroup',
      key: 'userGroup',
      width: 130,
      render: (value) => <Tag color="geekblue">{USER_GROUP_LABEL_MAP[value] || value}</Tag>,
    },
    {
      title: '重置周期',
      dataIndex: 'resetCycle',
      key: 'resetCycle',
      width: 120,
      render: (value) => RESET_CYCLE_LABEL_MAP[value] || value,
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 80,
      render: (value) => (value ? <Badge status="success" text="默认" /> : <span className="aq-muted-text">否</span>),
    },
    {
      title: '最近更新',
      key: 'updated',
      width: 160,
      render: (_, record) => (
        <div className="aq-updated-cell">
          <span>{record.updatedAt}</span>
          <span>{record.updatedBy}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" onClick={() => openDetailModal('policy', record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPolicy(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'plans',
      label: (
        <span>
          配额方案
          <Badge count={filteredPlans.length} size="small" style={{ marginInlineStart: 8 }} />
        </span>
      ),
      children: (
        <div className="aq-tab-panel">
          <Card className="aq-toolbar-card" bordered={false}>
            <div className="aq-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                placeholder="搜索方案名称或说明"
                value={planKeyword}
                onChange={(e) => setPlanKeyword(e.target.value)}
                style={{ width: 260 }}
              />
              <Select
                allowClear
                placeholder="状态"
                value={planStatusFilter}
                onChange={setPlanStatusFilter}
                options={PLAN_STATUS_OPTIONS}
                style={{ width: 140 }}
              />
              <div className="aq-toolbar-right">
                <Button icon={<ReloadOutlined />} onClick={resetPlanFilters}>重置筛选</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlan}>新建配额方案</Button>
              </div>
            </div>
          </Card>

          <div ref={planTableShellRef} className={tableScrollY.plans ? 'aq-table-shell aq-table-shell-fill' : 'aq-table-shell'}>
            <Card className="aq-table-card" bordered={false}>
              <Table
                rowKey="id"
                size="small"
                columns={planColumns}
                dataSource={filteredPlans}
                pagination={false}
                scroll={{ x: 1160, y: tableScrollY.plans }}
              />
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'tenant',
      label: (
        <span>
          当前租户配额
          <Badge count={1 + departmentRows.length + personalRows.length} size="small" style={{ marginInlineStart: 8 }} />
        </span>
      ),
      children: (
        <div className="aq-tab-panel">
          <Alert
            className="aq-inline-alert"
            type="info"
            showIcon
            message={`当前租户：${currentTenantRow.targetName}`}
            description="当前租户总配额用于控制整体资源池；部门配额用于控制组织采纳和部门消耗；个人配额用于对重点成员做额外收紧或放宽；每条配额还可以细化到单个技能次数。"
          />

          <Tabs
            className="aq-subtabs"
            activeKey={activeTenantQuotaTab}
            onChange={setActiveTenantQuotaTab}
            items={[
              {
                key: 'current',
                label: (
                  <span>
                    当前租户
                    <Badge count={1} size="small" style={{ marginInlineStart: 8 }} />
                  </span>
                ),
                children: (
                  <div className="aq-subtab-panel">
                    <Card className="aq-toolbar-card" bordered={false}>
                      <div className="aq-toolbar aq-tenant-toolbar">
                        <div className="aq-tenant-brief">
                          <div className="aq-tenant-brief-title">总配额优先级最高</div>
                          <div className="aq-tenant-brief-desc">
                            当前租户总配额优先于部门和个人配额，决定技能使用次数、单技能使用次数、Token、智能体创建、技能生成和人均免费额度的上限。
                          </div>
                        </div>
                        <div className="aq-toolbar-right">
                          <Button type="primary" icon={<EditOutlined />} onClick={() => openEditBinding(currentTenantRow)}>
                            编辑当前租户配额
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <div ref={currentTableShellRef} className={tableScrollY.current ? 'aq-table-shell aq-table-shell-fill' : 'aq-table-shell'}>
                      <Card className="aq-table-card" bordered={false}>
                        <Table
                          rowKey="id"
                          size="small"
                          columns={currentTenantColumns}
                          dataSource={[currentTenantRow]}
                          pagination={false}
                          scroll={{ x: 1080, y: tableScrollY.current }}
                        />
                      </Card>
                    </div>
                  </div>
                ),
              },
              {
                key: 'department',
                label: (
                  <span>
                    部门配额
                    <Badge count={filteredDepartmentRows.length} size="small" style={{ marginInlineStart: 8 }} />
                  </span>
                ),
                children: (
                  <div className="aq-subtab-panel">
                    <Card className="aq-toolbar-card" bordered={false}>
                      <div className="aq-toolbar">
                        <Input
                          allowClear
                          prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                          placeholder="搜索部门名称、负责人或方案"
                          value={bindingKeyword}
                          onChange={(e) => setBindingKeyword(e.target.value)}
                          style={{ width: 280 }}
                        />
                        <Select
                          allowClear
                          placeholder="配额方案"
                          value={bindingPlanFilter}
                          onChange={setBindingPlanFilter}
                          options={planOptionList}
                          style={{ width: 220 }}
                        />
                        <div className="aq-toolbar-right">
                          <Button icon={<ReloadOutlined />} onClick={resetBindingFilters}>重置筛选</Button>
                          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateBinding('DEPARTMENT')}>新增部门配额</Button>
                        </div>
                      </div>
                    </Card>

                    <div ref={departmentTableShellRef} className={tableScrollY.department ? 'aq-table-shell aq-table-shell-fill' : 'aq-table-shell'}>
                      <Card className="aq-table-card" bordered={false}>
                        <Table
                          rowKey="id"
                          size="small"
                          columns={departmentColumns}
                          dataSource={filteredDepartmentRows}
                          pagination={false}
                          scroll={{ x: 1120, y: tableScrollY.department }}
                        />
                      </Card>
                    </div>
                  </div>
                ),
              },
              {
                key: 'personal',
                label: (
                  <span>
                    个人配额
                    <Badge count={filteredPersonalRows.length} size="small" style={{ marginInlineStart: 8 }} />
                  </span>
                ),
                children: (
                  <div className="aq-subtab-panel">
                    <Card className="aq-toolbar-card" bordered={false}>
                      <div className="aq-toolbar">
                        <Input
                          allowClear
                          prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                          placeholder="搜索用户姓名、部门或方案"
                          value={bindingKeyword}
                          onChange={(e) => setBindingKeyword(e.target.value)}
                          style={{ width: 280 }}
                        />
                        <Select
                          allowClear
                          placeholder="配额方案"
                          value={bindingPlanFilter}
                          onChange={setBindingPlanFilter}
                          options={planOptionList}
                          style={{ width: 220 }}
                        />
                        <div className="aq-toolbar-right">
                          <Button icon={<ReloadOutlined />} onClick={resetBindingFilters}>重置筛选</Button>
                          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateBinding('PERSONAL')}>新增个人配额</Button>
                        </div>
                      </div>
                    </Card>

                    <div ref={personalTableShellRef} className={tableScrollY.personal ? 'aq-table-shell aq-table-shell-fill' : 'aq-table-shell'}>
                      <Card className="aq-table-card" bordered={false}>
                        <Table
                          rowKey="id"
                          size="small"
                          columns={personalColumns}
                          dataSource={filteredPersonalRows}
                          pagination={false}
                          scroll={{ x: 1080, y: tableScrollY.personal }}
                        />
                      </Card>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'free',
      label: (
        <span>
          免费配额策略
          <Badge count={filteredPolicies.length} size="small" style={{ marginInlineStart: 8 }} />
        </span>
      ),
      children: (
        <div className="aq-tab-panel">
          <Alert
            className="aq-inline-alert"
            type="info"
            showIcon
            message="免费配额策略只作用于当前租户内部身份"
            description="当前页只配置租户成员、部门管理员、租户管理员的人均赠送额度，不处理租外试用对象。"
          />

          <Card className="aq-toolbar-card" bordered={false}>
            <div className="aq-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
                placeholder="搜索策略名称或租内身份"
                value={policyKeyword}
                onChange={(e) => setPolicyKeyword(e.target.value)}
                style={{ width: 280 }}
              />
              <div className="aq-toolbar-right">
                <Button icon={<ReloadOutlined />} onClick={resetPolicyFilters}>重置筛选</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePolicy}>新建免费策略</Button>
              </div>
            </div>
          </Card>

          <div ref={policyTableShellRef} className={tableScrollY.policy ? 'aq-table-shell aq-table-shell-fill' : 'aq-table-shell'}>
            <Card className="aq-table-card" bordered={false}>
              <Table
                rowKey="id"
                size="small"
                columns={policyColumns}
                dataSource={filteredPolicies}
                pagination={false}
                scroll={{ x: 980, y: tableScrollY.policy }}
              />
            </Card>
          </div>
        </div>
      ),
    },
  ];
  const planSectionContent = tabItems.find((item) => item.key === 'plans')?.children || null;
  const tenantSectionContent = tabItems.find((item) => item.key === 'tenant')?.children || null;

  const isPersonalBinding = bindingScope === 'PERSONAL';
  const isCurrentBinding = bindingScope === 'CURRENT';
  const bindingModalTitle = bindingModalMode === 'edit'
    ? isCurrentBinding
      ? '编辑当前租户配额'
      : isPersonalBinding
        ? '编辑个人配额'
        : '编辑部门配额'
    : isPersonalBinding
      ? '新增个人配额'
      : '新增部门配额';

  const detailModalTitle = detailModalType === 'plan'
    ? '配额方案详情'
    : detailModalType === 'policy'
      ? '免费配额策略详情'
      : '配额详情';

  function renderDetailContent() {
    if (!detailRecord) return null;

    if (detailModalType === 'plan') {
      const planDimensionKeys = getEnabledDimensionKeys(detailRecord.enabledDimensions);
      return (
        <div className="aq-detail-layout">
          <div className="aq-detail-grid">
            <div className="aq-detail-item">
              <span>方案名称</span>
              <strong>{detailRecord.name}</strong>
            </div>
            <div className="aq-detail-item">
              <span>适用层级</span>
              <strong>{PLAN_SCOPE_LABEL_MAP[detailRecord.scope] || detailRecord.scope}</strong>
            </div>
            <div className="aq-detail-item">
              <span>重置周期</span>
              <strong>{RESET_CYCLE_LABEL_MAP[detailRecord.resetCycle] || detailRecord.resetCycle}</strong>
            </div>
            <div className="aq-detail-item">
              <span>状态</span>
              <strong>{PLAN_STATUS_LABEL_MAP[detailRecord.status] || detailRecord.status}</strong>
            </div>
            <div className="aq-detail-item">
              <span>启用维度</span>
              <strong>{planDimensionKeys.map((item) => DIMENSION_LABEL_MAP[item] || item).join(' / ')}</strong>
            </div>
            <div className="aq-detail-item">
              <span>整体策略</span>
              <strong>{getDimensionStrategyLabel(detailRecord, planDimensionKeys)}</strong>
            </div>
          </div>
          <div className="aq-dimension-panel">{renderDimensionStrategySummary(detailRecord)}</div>
          <Tabs
            className="aq-dimension-tabs"
            defaultActiveKey="skill"
            items={planDimensionKeys.map((key) => {
              if (key === 'skill') {
                return {
                  key: 'skill',
                  label: '技能维度',
                  children: (
                    <div className="aq-detail-layout">
                      <div className="aq-dimension-panel">{renderSkillPlanCell(detailRecord)}</div>
                      <div className="aq-dimension-panel">{renderSkillRuleCell(detailRecord.skillRules)}</div>
                    </div>
                  ),
                };
              }

              if (key === 'token') {
                return {
                  key: 'token',
                  label: 'Token 维度',
                  children: <div className="aq-dimension-panel">{renderTokenPlanCell(detailRecord)}</div>,
                };
              }

              return {
                key: 'agent',
                label: '智能体维度',
                children: <div className="aq-dimension-panel">{renderAgentPlanCell(detailRecord)}</div>,
              };
            })}
          />
        </div>
      );
    }

    if (detailModalType === 'policy') {
      return (
        <div className="aq-detail-layout">
          <div className="aq-detail-grid">
            <div className="aq-detail-item">
              <span>策略名称</span>
              <strong>{detailRecord.name}</strong>
            </div>
            <div className="aq-detail-item">
              <span>租内身份</span>
              <strong>{USER_GROUP_LABEL_MAP[detailRecord.userGroup] || detailRecord.userGroup}</strong>
            </div>
            <div className="aq-detail-item">
              <span>重置周期</span>
              <strong>{RESET_CYCLE_LABEL_MAP[detailRecord.resetCycle] || detailRecord.resetCycle}</strong>
            </div>
            <div className="aq-detail-item">
              <span>默认策略</span>
              <strong>{detailRecord.isDefault ? '是' : '否'}</strong>
            </div>
          </div>
          <Tabs
            className="aq-dimension-tabs"
            defaultActiveKey="skill"
            items={[
              {
                key: 'skill',
                label: '技能维度',
                children: <div className="aq-dimension-panel">{renderPolicySkillCell(detailRecord)}</div>,
              },
              {
                key: 'token',
                label: 'Token 维度',
                children: <div className="aq-dimension-panel">{renderPolicyTokenCell(detailRecord)}</div>,
              },
              {
                key: 'agent',
                label: '智能体维度',
                children: <div className="aq-dimension-panel">{renderPolicyAgentCell(detailRecord)}</div>,
              },
            ]}
          />
        </div>
      );
    }

    const bindingDimensionKeys = getEnabledDimensionKeys(detailRecord.enabledDimensions);
    return (
      <div className="aq-detail-layout">
        <div className="aq-detail-grid">
          <div className="aq-detail-item">
            <span>对象</span>
            <strong>{detailRecord.targetName}</strong>
          </div>
          <div className="aq-detail-item">
            <span>绑定方案</span>
            <strong>{detailRecord.planName}</strong>
          </div>
          <div className="aq-detail-item">
            <span>最近更新</span>
            <strong>{detailRecord.updatedAt}</strong>
          </div>
          <div className="aq-detail-item">
            <span>风险状态</span>
            <strong>{formatPercent(Math.min(100, getMaxQuotaRate(detailRecord) * 100))}</strong>
          </div>
          <div className="aq-detail-item">
            <span>启用维度</span>
            <strong>{bindingDimensionKeys.map((item) => DIMENSION_LABEL_MAP[item] || item).join(' / ')}</strong>
          </div>
          <div className="aq-detail-item">
            <span>整体策略</span>
            <strong>{getDimensionStrategyLabel(detailRecord, bindingDimensionKeys)}</strong>
          </div>
        </div>
        <div className="aq-dimension-panel">{renderDimensionStrategySummary(detailRecord)}</div>
        <Tabs
          className="aq-dimension-tabs"
          defaultActiveKey="skill"
          items={bindingDimensionKeys.map((key) => {
            if (key === 'skill') {
              return {
                key: 'skill',
                label: '技能维度',
                children: (
                  <div className="aq-detail-layout">
                    <div className="aq-dimension-panel">
                      {renderUsageProgress(detailRecord.skillUsageUsed, detailRecord.skillUsageLimit, (value) => `${formatNumber(value)} 次`)}
                    </div>
                    <div className="aq-dimension-panel">
                      {renderUsageProgress(detailRecord.skillGenerated, detailRecord.skillGenerateLimit, (value) => `${formatNumber(value)} 次`)}
                    </div>
                    <div className="aq-dimension-panel">{renderBindingSkillPolicyCell(detailRecord)}</div>
                    <div className="aq-dimension-panel">{renderSkillRuleCell(detailRecord.skillRules, { showUsage: true })}</div>
                  </div>
                ),
              };
            }

            if (key === 'token') {
              return {
                key: 'token',
                label: 'Token 维度',
                children: (
                  <div className="aq-detail-layout">
                    <div className="aq-dimension-panel">
                      {renderUsageProgress(detailRecord.tokenUsed, detailRecord.tokenLimit, (value) => formatCompact(value))}
                    </div>
                    <div className="aq-dimension-panel">{renderBindingTokenPolicyCell(detailRecord)}</div>
                  </div>
                ),
              };
            }

            return {
              key: 'agent',
              label: '智能体维度',
              children: (
                <div className="aq-detail-layout">
                  <div className="aq-dimension-panel">
                    {renderUsageProgress(detailRecord.agentCreated, detailRecord.agentCreateLimit, (value) => `${formatNumber(value)} 个`)}
                  </div>
                  <div className="aq-dimension-panel">{renderBindingAgentPolicyCell(detailRecord)}</div>
                </div>
              ),
            };
          })}
        />
      </div>
    );
  }

  return (
    <div className="agent-quota-module">
      <div className="aq-header">
        <div className="aq-header-main">
          <div className="aq-title">
            <RobotOutlined className="aq-title-icon" />
            <span>智能体配额配置</span>
            <Tag color="gold">Mock 配置</Tag>
          </div>
          <div className="aq-subtitle">
            面向当前租户管理员，按技能、Token、智能体等维度配置租内配额方案、当前租户总配额、部门配额和个人配额，并支持单技能次数限制。
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => message.success('智能体配额配置已刷新')}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlan}>
            新建配额方案
          </Button>
        </Space>
      </div>

      <div className="aq-content">
        <div className="aq-summary-grid">
          {summaryCards.map((item) => (
            <Card key={item.key} className="aq-summary-card" bordered={false}>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                prefix={item.icon}
              />
            </Card>
          ))}
        </div>

        <Alert
          className="aq-alert"
          type="info"
          showIcon
          message="配额生效顺序"
          description="当前租户总配额优先于部门配额，部门配额优先于个人配额；每层配额支持单维度直控，也支持技能、Token、智能体等多维度联合治理，并可继续细化单技能次数限制。"
        />

        <div className="aq-page-sections">
          <section className="aq-page-section">
            <div className="aq-page-section-head">
              <div className="aq-page-section-title">配额方案</div>
              <Badge count={filteredPlans.length} size="small" />
            </div>
            {planSectionContent}
          </section>

          <section className="aq-page-section">
            <div className="aq-page-section-head">
              <div className="aq-page-section-title">当前租户配额</div>
              <Badge count={1 + filteredDepartmentRows.length + filteredPersonalRows.length} size="small" />
            </div>
            {tenantSectionContent}
          </section>
        </div>
      </div>

      <Drawer
        open={detailModalOpen}
        title={detailModalTitle}
        onClose={() => setDetailModalOpen(false)}
        width={920}
        placement="right"
        className="aq-side-drawer"
        destroyOnClose
        styles={{ header: { padding: '18px 24px' }, body: { padding: '20px 24px 28px' } }}
      >
        {renderDetailContent()}
      </Drawer>

      <Drawer
        open={planModalOpen}
        title={planModalMode === 'edit' ? '编辑配额方案' : planModalMode === 'copy' ? '复制配额方案' : '新建配额方案'}
        onClose={() => setPlanModalOpen(false)}
        width={900}
        placement="right"
        className="aq-side-drawer"
        destroyOnClose
        extra={(
          <Space>
            <Button onClick={() => setPlanModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handlePlanSubmit}>保存</Button>
          </Space>
        )}
        styles={{ header: { padding: '18px 24px' }, body: { padding: '20px 24px 28px' } }}
      >
        <Form form={planForm} layout="vertical">
          <div className="aq-dimension-governance-card">
            <div className="aq-section-header">
              <div className="aq-section-title">维度启用策略</div>
              <div className="aq-section-desc">支持只启用单一维度，也支持组合多个维度共同生效；当启用多个维度时，需要明确整体治理策略。</div>
            </div>

            <div className="aq-form-grid aq-form-grid-2">
              <Form.Item
                label="启用维度"
                name="enabledDimensions"
                rules={[{ required: true, type: 'array', min: 1, message: '请至少启用一个维度' }]}
              >
                <Checkbox.Group options={DIMENSION_OPTIONS} />
              </Form.Item>
              {planEnabledDimensions.length > 1 ? (
                <Form.Item
                  label="多维度整体策略"
                  name="dimensionStrategy"
                  rules={[{ required: true, message: '请选择多维度整体策略' }]}
                  extra={renderMultiDimensionStrategyGuide(planDimensionStrategy)}
                >
                  <Select options={MULTI_DIMENSION_STRATEGY_OPTIONS} />
                </Form.Item>
              ) : (
                <div className="aq-dimension-single-hint">
                  <span className="aq-dimension-single-title">单维度直控</span>
                  <span>{getDimensionStrategyDescription('SINGLE')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item
              label="方案名称"
              name="name"
              rules={[{ required: true, message: '请输入方案名称' }]}
            >
              <Input placeholder="例如：当前租户标准版" />
            </Form.Item>
            <Form.Item
              label="适用层级"
              name="scope"
              rules={[{ required: true, message: '请选择适用层级' }]}
            >
              <Select options={PLAN_SCOPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select options={PLAN_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="重置周期" name="resetCycle" rules={[{ required: true, message: '请选择重置周期' }]}>
              <Select options={RESET_CYCLE_OPTIONS} />
            </Form.Item>
          </div>

          <Tabs
            className="aq-dimension-tabs"
            defaultActiveKey="skill"
            items={planEnabledDimensions.map((key) => {
              if (key === 'skill') {
                return {
                  key: 'skill',
                  label: '技能维度',
                  children: (
                    <div className="aq-dimension-panel">
                      <div className="aq-section-header">
                        <div className="aq-section-title">技能维度</div>
                        <div className="aq-section-desc">配置技能使用、技能生成、自定义技能开关，以及单个技能的专项次数限制。</div>
                      </div>

                      <div className="aq-form-grid aq-form-grid-4">
                        <Form.Item label="技能使用次数上限" name="skillUsageLimit" rules={[{ required: true, message: '请输入技能使用次数上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="技能生成上限" name="skillGenerateLimit" rules={[{ required: true, message: '请输入技能生成上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="每用户免费技能次数" name="freeSkillUsagePerUser" rules={[{ required: true, message: '请输入每用户免费技能次数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="每用户免费生成技能" name="freeSkillGeneratePerUser" rules={[{ required: true, message: '请输入每用户免费生成技能数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>

                      <div className="aq-form-grid aq-form-grid-2">
                        <Form.Item label="是否支持自定义技能" name="allowCustomSkill" valuePropName="checked">
                          <Switch checkedChildren="支持" unCheckedChildren="关闭" />
                        </Form.Item>
                      </div>

                      <div className="aq-section-header">
                        <div className="aq-section-title">技能级次数限制</div>
                        <div className="aq-section-desc">为指定技能设置单独上限。未配置的技能仅受总技能次数上限约束。</div>
                      </div>

                      <Form.List name="skillRules">
                        {(fields, { add, remove }) => (
                          <div className="aq-form-list">
                            {fields.length ? (
                              fields.map((field) => (
                                <div key={field.key} className="aq-skill-form-row aq-skill-form-row-plan">
                                  <Form.Item
                                    {...field}
                                    label="技能"
                                    name={[field.name, 'skillKey']}
                                    rules={[{ required: true, message: '请选择技能' }]}
                                  >
                                    <Select options={SKILL_CATALOG} placeholder="选择技能" />
                                  </Form.Item>
                                  <Form.Item
                                    {...field}
                                    label="次数上限"
                                    name={[field.name, 'limit']}
                                    rules={[{ required: true, message: '请输入次数上限' }]}
                                  >
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                  </Form.Item>
                                  <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    className="aq-skill-form-remove"
                                    onClick={() => remove(field.name)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="aq-empty-skill-rules">未配置技能级规则，将仅按总技能次数控制。</div>
                            )}
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => add({ skillKey: undefined, limit: 0 })}
                            >
                              新增技能规则
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </div>
                  ),
                };
              }

              if (key === 'token') {
                return {
                  key: 'token',
                  label: 'Token 维度',
                  children: (
                    <div className="aq-dimension-panel">
                      <div className="aq-section-header">
                        <div className="aq-section-title">Token 维度</div>
                        <div className="aq-section-desc">配置总 Token 消耗上限和人均免费 Token 配额。</div>
                      </div>

                      <div className="aq-form-grid aq-form-grid-2">
                        <Form.Item label="Token 使用上限" name="tokenLimit" rules={[{ required: true, message: '请输入 Token 使用上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="每用户免费 Token" name="freeTokenPerUser" rules={[{ required: true, message: '请输入每用户免费 Token' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                };
              }

              return {
                key: 'agent',
                label: '智能体维度',
                children: (
                  <div className="aq-dimension-panel">
                    <div className="aq-section-header">
                      <div className="aq-section-title">智能体维度</div>
                      <div className="aq-section-desc">配置智能体创建额度和自定义智能体能力。</div>
                    </div>

                    <div className="aq-form-grid aq-form-grid-3">
                      <Form.Item label="智能体创建上限" name="agentCreateLimit" rules={[{ required: true, message: '请输入智能体创建上限' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="每用户免费创建智能体" name="freeAgentCreatePerUser" rules={[{ required: true, message: '请输入每用户免费建智能体数' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="是否支持自定义智能体" name="allowCustomAgent" valuePropName="checked">
                        <Switch checkedChildren="支持" unCheckedChildren="关闭" />
                      </Form.Item>
                    </div>
                  </div>
                ),
              };
            })}
          />

          <Form.Item label="方案说明" name="description">
            <TextArea rows={3} placeholder="可填写适用场景、限制说明和运营备注" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        open={bindingModalOpen}
        title={bindingModalTitle}
        onClose={() => setBindingModalOpen(false)}
        width={980}
        placement="right"
        className="aq-side-drawer"
        destroyOnClose
        extra={(
          <Space>
            <Button onClick={() => setBindingModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleBindingSubmit}>保存</Button>
          </Space>
        )}
        styles={{ header: { padding: '18px 24px' }, body: { padding: '20px 24px 28px' } }}
      >
        <Form form={bindingForm} layout="vertical">
          {isPersonalBinding ? (
            <div className="aq-form-grid aq-form-grid-4">
              <Form.Item label="用户姓名" name="targetName" rules={[{ required: true, message: '请输入用户姓名' }]}>
                <Input placeholder="例如：赵敏" />
              </Form.Item>
              <Form.Item label="所属部门" name="deptName" rules={[{ required: true, message: '请输入所属部门' }]}>
                <Input placeholder="例如：交付运营部" />
              </Form.Item>
              <Form.Item label="岗位 / 身份" name="roleLabel" rules={[{ required: true, message: '请输入岗位或身份' }]}>
                <Input placeholder="例如：部门管理员" />
              </Form.Item>
              <Form.Item label="配额方案" name="planId" rules={[{ required: true, message: '请选择配额方案' }]}>
                <Select options={planOptionList} onChange={handleBindingPlanChange} />
              </Form.Item>
            </div>
          ) : (
            <div className="aq-form-grid aq-form-grid-4">
              <Form.Item
                label={isCurrentBinding ? '当前租户名称' : '部门名称'}
                name="targetName"
                rules={[{ required: true, message: isCurrentBinding ? '请输入当前租户名称' : '请输入部门名称' }]}
              >
                <Input placeholder={isCurrentBinding ? '例如：华东教育集团' : '例如：客户成功部'} />
              </Form.Item>
              <Form.Item
                label={isCurrentBinding ? '租户负责人' : '部门负责人'}
                name="owner"
                rules={[{ required: true, message: isCurrentBinding ? '请输入租户负责人' : '请输入部门负责人' }]}
              >
                <Input placeholder="例如：张洪磊" />
              </Form.Item>
              <Form.Item
                label={isCurrentBinding ? '成员数' : '部门人数'}
                name="seatCount"
                rules={[{ required: true, message: isCurrentBinding ? '请输入成员数' : '请输入部门人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="配额方案" name="planId" rules={[{ required: true, message: '请选择配额方案' }]}>
                <Select options={planOptionList} onChange={handleBindingPlanChange} />
              </Form.Item>
            </div>
          )}

          {selectedBindingPlan ? (
            <Alert
              className="aq-inline-alert"
              type="success"
              showIcon
              message={`已选择：${selectedBindingPlan.name}`}
              description={`方案默认值已按技能、Token、智能体三个维度带入；其中技能维度包含 ${formatNumber(selectedBindingPlan.skillRules?.length)} 个技能级限制。`}
            />
          ) : null}

          <div className="aq-dimension-governance-card">
            <div className="aq-section-header">
              <div className="aq-section-title">维度启用策略</div>
              <div className="aq-section-desc">可按对象实际场景只启用部分维度；若同时启用多个维度，需要定义整体治理方式。</div>
            </div>

            <div className="aq-form-grid aq-form-grid-2">
              <Form.Item
                label="启用维度"
                name="enabledDimensions"
                rules={[{ required: true, type: 'array', min: 1, message: '请至少启用一个维度' }]}
              >
                <Checkbox.Group options={DIMENSION_OPTIONS} />
              </Form.Item>
              {bindingEnabledDimensions.length > 1 ? (
                <Form.Item
                  label="多维度整体策略"
                  name="dimensionStrategy"
                  rules={[{ required: true, message: '请选择多维度整体策略' }]}
                  extra={renderMultiDimensionStrategyGuide(bindingDimensionStrategy)}
                >
                  <Select options={MULTI_DIMENSION_STRATEGY_OPTIONS} />
                </Form.Item>
              ) : (
                <div className="aq-dimension-single-hint">
                  <span className="aq-dimension-single-title">单维度直控</span>
                  <span>{getDimensionStrategyDescription('SINGLE')}</span>
                </div>
              )}
            </div>
          </div>

          <Tabs
            className="aq-dimension-tabs"
            defaultActiveKey="skill"
            items={bindingEnabledDimensions.map((key) => {
              if (key === 'skill') {
                return {
                  key: 'skill',
                  label: '技能维度',
                  children: (
                    <div className="aq-dimension-panel">
                      <div className="aq-section-header">
                        <div className="aq-section-title">技能维度</div>
                        <div className="aq-section-desc">统一配置技能使用、技能生成、免费技能额度、自定义技能开关，以及每个技能的专项上限和已用次数。</div>
                      </div>

                      <div className="aq-form-grid aq-form-grid-4">
                        <Form.Item label="技能使用次数上限" name="skillUsageLimit" rules={[{ required: true, message: '请输入技能使用次数上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="已使用技能次数" name="skillUsageUsed" rules={[{ required: true, message: '请输入已使用技能次数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="技能生成上限" name="skillGenerateLimit" rules={[{ required: true, message: '请输入技能生成上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="已生成技能" name="skillGenerated" rules={[{ required: true, message: '请输入已生成技能数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>

                      <div className="aq-form-grid aq-form-grid-3">
                        <Form.Item label="每用户免费技能次数" name="freeSkillUsagePerUser" rules={[{ required: true, message: '请输入每用户免费技能次数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="每用户免费生成技能" name="freeSkillGeneratePerUser" rules={[{ required: true, message: '请输入每用户免费生成技能数' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="是否支持自定义技能" name="allowCustomSkill" valuePropName="checked">
                          <Switch checkedChildren="支持" unCheckedChildren="关闭" />
                        </Form.Item>
                      </div>

                      <div className="aq-section-header">
                        <div className="aq-section-title">技能级次数限制</div>
                        <div className="aq-section-desc">这里可对单个技能单独收紧或放宽，并记录该技能当前已使用次数。</div>
                      </div>

                      <Form.List name="skillRules">
                        {(fields, { add, remove }) => (
                          <div className="aq-form-list">
                            {fields.length ? (
                              fields.map((field) => (
                                <div key={field.key} className="aq-skill-form-row">
                                  <Form.Item
                                    {...field}
                                    label="技能"
                                    name={[field.name, 'skillKey']}
                                    rules={[{ required: true, message: '请选择技能' }]}
                                  >
                                    <Select options={SKILL_CATALOG} placeholder="选择技能" />
                                  </Form.Item>
                                  <Form.Item
                                    {...field}
                                    label="次数上限"
                                    name={[field.name, 'limit']}
                                    rules={[{ required: true, message: '请输入次数上限' }]}
                                  >
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                  </Form.Item>
                                  <Form.Item
                                    {...field}
                                    label="已使用次数"
                                    name={[field.name, 'used']}
                                    rules={[{ required: true, message: '请输入已使用次数' }]}
                                  >
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                  </Form.Item>
                                  <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    className="aq-skill-form-remove"
                                    onClick={() => remove(field.name)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="aq-empty-skill-rules">未配置技能级规则，将仅按总技能次数控制。</div>
                            )}
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => add({ skillKey: undefined, limit: 0, used: 0 })}
                            >
                              新增技能规则
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </div>
                  ),
                };
              }

              if (key === 'token') {
                return {
                  key: 'token',
                  label: 'Token 维度',
                  children: (
                    <div className="aq-dimension-panel">
                      <div className="aq-section-header">
                        <div className="aq-section-title">Token 维度</div>
                        <div className="aq-section-desc">统一配置 Token 上限、当前消耗和人均免费 Token。</div>
                      </div>

                      <div className="aq-form-grid aq-form-grid-3">
                        <Form.Item label="Token 使用上限" name="tokenLimit" rules={[{ required: true, message: '请输入 Token 使用上限' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="已使用 Token" name="tokenUsed" rules={[{ required: true, message: '请输入已使用 Token' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="每用户免费 Token" name="freeTokenPerUser" rules={[{ required: true, message: '请输入每用户免费 Token' }]}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                };
              }

              return {
                key: 'agent',
                label: '智能体维度',
                children: (
                  <div className="aq-dimension-panel">
                    <div className="aq-section-header">
                      <div className="aq-section-title">智能体维度</div>
                      <div className="aq-section-desc">统一配置智能体创建、免费创建和自定义智能体能力。</div>
                    </div>

                    <div className="aq-form-grid aq-form-grid-4">
                      <Form.Item label="智能体创建上限" name="agentCreateLimit" rules={[{ required: true, message: '请输入智能体创建上限' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="已创建智能体" name="agentCreated" rules={[{ required: true, message: '请输入已创建智能体数' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="每用户免费创建智能体" name="freeAgentCreatePerUser" rules={[{ required: true, message: '请输入每用户免费建智能体数' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="是否支持自定义智能体" name="allowCustomAgent" valuePropName="checked">
                        <Switch checkedChildren="支持" unCheckedChildren="关闭" />
                      </Form.Item>
                    </div>
                  </div>
                ),
              };
            })}
          />
        </Form>
      </Drawer>

      <Drawer
        open={policyModalOpen}
        title={policyModalMode === 'edit' ? '编辑免费配额策略' : '新建免费配额策略'}
        onClose={() => setPolicyModalOpen(false)}
        width={860}
        placement="right"
        className="aq-side-drawer"
        destroyOnClose
        extra={(
          <Space>
            <Button onClick={() => setPolicyModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handlePolicySubmit}>保存</Button>
          </Space>
        )}
        styles={{ header: { padding: '18px 24px' }, body: { padding: '20px 24px 28px' } }}
      >
        <Form form={policyForm} layout="vertical">
          <div className="aq-form-grid aq-form-grid-3">
            <Form.Item label="策略名称" name="name" rules={[{ required: true, message: '请输入策略名称' }]}>
              <Input placeholder="例如：租户成员默认策略" />
            </Form.Item>
            <Form.Item label="租内身份" name="userGroup" rules={[{ required: true, message: '请选择租内身份' }]}>
              <Select options={USER_GROUP_OPTIONS} />
            </Form.Item>
            <Form.Item label="重置周期" name="resetCycle" rules={[{ required: true, message: '请选择重置周期' }]}>
              <Select options={RESET_CYCLE_OPTIONS} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="免费技能次数 / 人" name="freeSkillUsagePerUser" rules={[{ required: true, message: '请输入免费技能次数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="免费 Token / 人" name="freeTokenPerUser" rules={[{ required: true, message: '请输入免费 Token' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="免费创建智能体 / 人" name="freeAgentCreatePerUser" rules={[{ required: true, message: '请输入免费建智能体数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="免费生成技能 / 人" name="freeSkillGeneratePerUser" rules={[{ required: true, message: '请输入免费生成技能数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-3">
            <Form.Item label="支持自定义技能" name="allowCustomSkill" valuePropName="checked">
              <Switch checkedChildren="支持" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="支持自定义智能体" name="allowCustomAgent" valuePropName="checked">
              <Switch checkedChildren="支持" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="是否默认策略" name="isDefault" valuePropName="checked">
              <Switch checkedChildren="默认" unCheckedChildren="否" />
            </Form.Item>
          </div>

          <Form.Item label="策略说明" name="description">
            <TextArea rows={3} placeholder="填写适用身份、限制条件或发放说明" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
