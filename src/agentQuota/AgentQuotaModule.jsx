import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
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

const INITIAL_PLAN_TEMPLATES = [
  {
    id: 'plan-personal-base',
    name: '个人基础版',
    scope: 'PERSONAL_BASE',
    status: 'ACTIVE',
    resetCycle: 'MONTHLY',
    skillUsageLimit: 300,
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

function getMaxQuotaRate(record) {
  return Math.max(
    record.skillUsageLimit ? record.skillUsageUsed / record.skillUsageLimit : 0,
    record.tokenLimit ? record.tokenUsed / record.tokenLimit : 0,
    record.agentCreateLimit ? record.agentCreated / record.agentCreateLimit : 0,
    record.skillGenerateLimit ? record.skillGenerated / record.skillGenerateLimit : 0,
  );
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

function renderQuotaCell(record) {
  return (
    <div className="aq-free-list">
      <span>技能使用：{formatNumber(record.skillUsageLimit)} 次</span>
      <span>Token：{formatCompact(record.tokenLimit)}</span>
      <span>智能体创建：{formatNumber(record.agentCreateLimit)} 个</span>
      <span>技能生成：{formatNumber(record.skillGenerateLimit)} 次</span>
    </div>
  );
}

function renderFreeQuotaCell(record) {
  return (
    <div className="aq-free-list">
      <span>免费技能：{formatNumber(record.freeSkillUsagePerUser)} 次 / 人</span>
      <span>免费 Token：{formatCompact(record.freeTokenPerUser)} / 人</span>
      <span>免费建智能体：{formatNumber(record.freeAgentCreatePerUser)} 个 / 人</span>
      <span>免费生成技能：{formatNumber(record.freeSkillGeneratePerUser)} 次 / 人</span>
    </div>
  );
}

function buildPlanDefaults(plan) {
  return {
    planId: plan?.id,
    skillUsageLimit: plan?.skillUsageLimit || 0,
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
    skillUsageLimit: 10000,
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

export default function AgentQuotaModule({ initialTab = 'plans' }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState(INITIAL_PLAN_TEMPLATES);
  const [currentTenantQuota, setCurrentTenantQuota] = useState(INITIAL_CURRENT_TENANT_QUOTA);
  const [departmentBindings, setDepartmentBindings] = useState(INITIAL_DEPARTMENT_BINDINGS);
  const [personalBindings, setPersonalBindings] = useState(INITIAL_PERSONAL_BINDINGS);
  const [freePolicies, setFreePolicies] = useState(INITIAL_FREE_POLICIES);

  const [planKeyword, setPlanKeyword] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState(undefined);
  const [bindingKeyword, setBindingKeyword] = useState('');
  const [bindingPlanFilter, setBindingPlanFilter] = useState(undefined);
  const [policyKeyword, setPolicyKeyword] = useState('');

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

  const selectedBindingPlanId = Form.useWatch('planId', bindingForm);

  useEffect(() => {
    setActiveTab(initialTab || 'plans');
  }, [initialTab]);

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
      skillUsageLimit: record.skillUsageLimit,
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
      skillUsageLimit: record.skillUsageLimit,
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
      const payload = {
        name: values.name,
        scope: values.scope,
        status: values.status,
        resetCycle: values.resetCycle,
        skillUsageLimit: normalizeNumber(values.skillUsageLimit),
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
      skillUsageLimit: record.skillUsageLimit,
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
      const payload = {
        scopeType: bindingScope,
        targetName: values.targetName,
        owner: values.owner,
        seatCount: bindingScope === 'PERSONAL' ? 1 : normalizeNumber(values.seatCount),
        deptName: values.deptName,
        roleLabel: values.roleLabel,
        planId: values.planId,
        skillUsageLimit: normalizeNumber(values.skillUsageLimit),
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
      title: '适用层级',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      render: (value) => <Tag color="blue">{PLAN_SCOPE_LABEL_MAP[value] || value}</Tag>,
    },
    {
      title: '额度配置',
      key: 'quota',
      width: 220,
      render: (_, record) => renderQuotaCell(record),
    },
    {
      title: '自定义能力',
      key: 'custom',
      width: 180,
      render: (_, record) => (
        <div className="aq-tag-stack">
          {renderSupportTag(record.allowCustomSkill, '支持自定义技能', '禁用自定义技能')}
          {renderSupportTag(record.allowCustomAgent, '支持自定义智能体', '禁用自定义智能体')}
        </div>
      ),
    },
    {
      title: '每用户免费配额',
      key: 'free-quota',
      width: 260,
      render: (_, record) => renderFreeQuotaCell(record),
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPlan(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => openCopyPlan(record)}>
            复制
          </Button>
          {record.status === 'ACTIVE' ? (
            <Popconfirm
              title="确认停用该配额方案？"
              onConfirm={() => handlePlanStatusChange(record, 'DISABLED')}
            >
              <Button type="link" size="small" danger>
                停用
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确认启用该配额方案？"
              onConfirm={() => handlePlanStatusChange(record, 'ACTIVE')}
            >
              <Button type="link" size="small">
                启用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const currentTenantColumns = [
    {
      title: '当前租户',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div className="aq-identity-cell">
          <div className="aq-identity-title">{record.targetName}</div>
          <div className="aq-identity-desc">负责人：{record.owner} · {formatNumber(record.seatCount)} 人</div>
        </div>
      ),
    },
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
      title: '技能使用次数',
      key: 'skill-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillUsageUsed, record.skillUsageLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: 'Token 使用数量',
      key: 'token-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.tokenUsed, record.tokenLimit, (value) => formatCompact(value)),
    },
    {
      title: '智能体创建数量',
      key: 'agent-created',
      width: 220,
      render: (_, record) => renderUsageProgress(record.agentCreated, record.agentCreateLimit, (value) => `${formatNumber(value)} 个`),
    },
    {
      title: '技能生成数量',
      key: 'skill-generated',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillGenerated, record.skillGenerateLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: '自定义能力',
      key: 'custom',
      width: 180,
      render: (_, record) => (
        <div className="aq-tag-stack">
          {renderSupportTag(record.allowCustomSkill, '支持自定义技能', '禁用自定义技能')}
          {renderSupportTag(record.allowCustomAgent, '支持自定义智能体', '禁用自定义智能体')}
        </div>
      ),
    },
    {
      title: '每用户免费配额',
      key: 'free-quota',
      width: 260,
      render: (_, record) => renderFreeQuotaCell(record),
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditBinding(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const departmentColumns = [
    {
      title: '部门',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="aq-identity-cell">
          <div className="aq-identity-title">{record.targetName}</div>
          <div className="aq-identity-desc">负责人：{record.owner} · {formatNumber(record.seatCount)} 人</div>
        </div>
      ),
    },
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
      title: '技能使用次数',
      key: 'skill-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillUsageUsed, record.skillUsageLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: 'Token 使用数量',
      key: 'token-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.tokenUsed, record.tokenLimit, (value) => formatCompact(value)),
    },
    {
      title: '智能体创建数量',
      key: 'agent-created',
      width: 220,
      render: (_, record) => renderUsageProgress(record.agentCreated, record.agentCreateLimit, (value) => `${formatNumber(value)} 个`),
    },
    {
      title: '技能生成数量',
      key: 'skill-generated',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillGenerated, record.skillGenerateLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: '自定义能力',
      key: 'custom',
      width: 180,
      render: (_, record) => (
        <div className="aq-tag-stack">
          {renderSupportTag(record.allowCustomSkill, '支持自定义技能', '禁用自定义技能')}
          {renderSupportTag(record.allowCustomAgent, '支持自定义智能体', '禁用自定义智能体')}
        </div>
      ),
    },
    {
      title: '每用户免费配额',
      key: 'free-quota',
      width: 260,
      render: (_, record) => renderFreeQuotaCell(record),
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditBinding(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const personalColumns = [
    {
      title: '个人',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div className="aq-identity-cell">
          <div className="aq-identity-title">{record.targetName}</div>
          <div className="aq-identity-desc">{record.deptName} · {record.roleLabel}</div>
        </div>
      ),
    },
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
      title: '技能使用次数',
      key: 'skill-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillUsageUsed, record.skillUsageLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: 'Token 使用数量',
      key: 'token-usage',
      width: 220,
      render: (_, record) => renderUsageProgress(record.tokenUsed, record.tokenLimit, (value) => formatCompact(value)),
    },
    {
      title: '智能体创建数量',
      key: 'agent-created',
      width: 220,
      render: (_, record) => renderUsageProgress(record.agentCreated, record.agentCreateLimit, (value) => `${formatNumber(value)} 个`),
    },
    {
      title: '技能生成数量',
      key: 'skill-generated',
      width: 220,
      render: (_, record) => renderUsageProgress(record.skillGenerated, record.skillGenerateLimit, (value) => `${formatNumber(value)} 次`),
    },
    {
      title: '自定义能力',
      key: 'custom',
      width: 180,
      render: (_, record) => (
        <div className="aq-tag-stack">
          {renderSupportTag(record.allowCustomSkill, '支持自定义技能', '禁用自定义技能')}
          {renderSupportTag(record.allowCustomAgent, '支持自定义智能体', '禁用自定义智能体')}
        </div>
      ),
    },
    {
      title: '人均免费配额',
      key: 'free-quota',
      width: 260,
      render: (_, record) => renderFreeQuotaCell(record),
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditBinding(record)}>
          编辑
        </Button>
      ),
    },
  ];

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
      title: '免费技能使用',
      dataIndex: 'freeSkillUsagePerUser',
      key: 'freeSkillUsagePerUser',
      width: 130,
      render: (value) => `${formatNumber(value)} 次 / 人`,
    },
    {
      title: '免费 Token',
      dataIndex: 'freeTokenPerUser',
      key: 'freeTokenPerUser',
      width: 130,
      render: (value) => `${formatCompact(value)} / 人`,
    },
    {
      title: '免费建智能体',
      dataIndex: 'freeAgentCreatePerUser',
      key: 'freeAgentCreatePerUser',
      width: 130,
      render: (value) => `${formatNumber(value)} 个 / 人`,
    },
    {
      title: '免费生成技能',
      dataIndex: 'freeSkillGeneratePerUser',
      key: 'freeSkillGeneratePerUser',
      width: 130,
      render: (value) => `${formatNumber(value)} 次 / 人`,
    },
    {
      title: '自定义技能',
      dataIndex: 'allowCustomSkill',
      key: 'allowCustomSkill',
      width: 120,
      render: (value) => renderSupportTag(value, '支持', '不支持'),
    },
    {
      title: '自定义智能体',
      dataIndex: 'allowCustomAgent',
      key: 'allowCustomAgent',
      width: 130,
      render: (value) => renderSupportTag(value, '支持', '不支持'),
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPolicy(record)}>
          编辑
        </Button>
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

          <Card className="aq-table-card" bordered={false}>
            <Table
              rowKey="id"
              size="small"
              columns={planColumns}
              dataSource={filteredPlans}
              pagination={false}
              scroll={{ x: 1460 }}
            />
          </Card>
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
            description="当前租户总配额用于控制整体资源池；部门配额用于控制组织采纳和部门消耗；个人配额用于对重点成员做额外收紧或放宽。"
          />

          <Tabs
            className="aq-subtabs"
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
                            当前租户总配额优先于部门和个人配额，决定技能使用次数、Token、智能体创建、技能生成和人均免费额度的上限。
                          </div>
                        </div>
                        <div className="aq-toolbar-right">
                          <Button type="primary" icon={<EditOutlined />} onClick={() => openEditBinding(currentTenantRow)}>
                            编辑当前租户配额
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card className="aq-table-card" bordered={false}>
                      <Table
                        rowKey="id"
                        size="small"
                        columns={currentTenantColumns}
                        dataSource={[currentTenantRow]}
                        pagination={false}
                        scroll={{ x: 1860 }}
                      />
                    </Card>
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

                    <Card className="aq-table-card" bordered={false}>
                      <Table
                        rowKey="id"
                        size="small"
                        columns={departmentColumns}
                        dataSource={filteredDepartmentRows}
                        pagination={false}
                        scroll={{ x: 1860 }}
                      />
                    </Card>
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

                    <Card className="aq-table-card" bordered={false}>
                      <Table
                        rowKey="id"
                        size="small"
                        columns={personalColumns}
                        dataSource={filteredPersonalRows}
                        pagination={false}
                        scroll={{ x: 1840 }}
                      />
                    </Card>
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

          <Card className="aq-table-card" bordered={false}>
            <Table
              rowKey="id"
              size="small"
              columns={policyColumns}
              dataSource={filteredPolicies}
              pagination={false}
              scroll={{ x: 1540 }}
            />
          </Card>
        </div>
      ),
    },
  ];

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
            面向当前租户管理员，配置租内配额方案、当前租户总配额、部门配额、个人配额，以及自定义技能 / 自定义智能体开关和每用户免费额度。
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
          description="当前租户总配额优先于部门配额，部门配额优先于个人配额；配额方案用于快速带入默认额度，免费配额策略用于控制租内不同身份的人均赠送额度。"
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="aq-tabs"
          items={tabItems}
        />
      </div>

      <Modal
        open={planModalOpen}
        title={planModalMode === 'edit' ? '编辑配额方案' : planModalMode === 'copy' ? '复制配额方案' : '新建配额方案'}
        onCancel={() => setPlanModalOpen(false)}
        onOk={handlePlanSubmit}
        width={900}
        destroyOnClose
      >
        <Form form={planForm} layout="vertical">
          <div className="aq-form-grid aq-form-grid-3">
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
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="技能使用次数上限" name="skillUsageLimit" rules={[{ required: true, message: '请输入技能使用次数上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Token 使用上限" name="tokenLimit" rules={[{ required: true, message: '请输入 Token 使用上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="智能体创建上限" name="agentCreateLimit" rules={[{ required: true, message: '请输入智能体创建上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="技能生成上限" name="skillGenerateLimit" rules={[{ required: true, message: '请输入技能生成上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="每用户免费技能次数" name="freeSkillUsagePerUser" rules={[{ required: true, message: '请输入每用户免费技能次数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="每用户免费 Token" name="freeTokenPerUser" rules={[{ required: true, message: '请输入每用户免费 Token' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="每用户免费创建智能体" name="freeAgentCreatePerUser" rules={[{ required: true, message: '请输入每用户免费建智能体数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="每用户免费生成技能" name="freeSkillGeneratePerUser" rules={[{ required: true, message: '请输入每用户免费生成技能数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-3">
            <Form.Item label="是否支持自定义技能" name="allowCustomSkill" valuePropName="checked">
              <Switch checkedChildren="支持" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="是否支持自定义智能体" name="allowCustomAgent" valuePropName="checked">
              <Switch checkedChildren="支持" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item label="重置周期" name="resetCycle" rules={[{ required: true, message: '请选择重置周期' }]}>
              <Select options={RESET_CYCLE_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item label="方案说明" name="description">
            <TextArea rows={3} placeholder="可填写适用场景、限制说明和运营备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={bindingModalOpen}
        title={bindingModalTitle}
        onCancel={() => setBindingModalOpen(false)}
        onOk={handleBindingSubmit}
        width={980}
        destroyOnClose
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
              description={`方案默认值：技能 ${formatNumber(selectedBindingPlan.skillUsageLimit)} 次，Token ${formatCompact(selectedBindingPlan.tokenLimit)}，智能体 ${formatNumber(selectedBindingPlan.agentCreateLimit)} 个，技能生成 ${formatNumber(selectedBindingPlan.skillGenerateLimit)} 次。`}
            />
          ) : null}

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="技能使用次数上限" name="skillUsageLimit" rules={[{ required: true, message: '请输入技能使用次数上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Token 使用上限" name="tokenLimit" rules={[{ required: true, message: '请输入 Token 使用上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="智能体创建上限" name="agentCreateLimit" rules={[{ required: true, message: '请输入智能体创建上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="技能生成上限" name="skillGenerateLimit" rules={[{ required: true, message: '请输入技能生成上限' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="已使用技能次数" name="skillUsageUsed" rules={[{ required: true, message: '请输入已使用技能次数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="已使用 Token" name="tokenUsed" rules={[{ required: true, message: '请输入已使用 Token' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="已创建智能体" name="agentCreated" rules={[{ required: true, message: '请输入已创建智能体数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="已生成技能" name="skillGenerated" rules={[{ required: true, message: '请输入已生成技能数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="aq-form-grid aq-form-grid-4">
            <Form.Item label="每用户免费技能次数" name="freeSkillUsagePerUser" rules={[{ required: true, message: '请输入每用户免费技能次数' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="每用户免费 Token" name="freeTokenPerUser" rules={[{ required: true, message: '请输入每用户免费 Token' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="每用户免费创建智能体" name="freeAgentCreatePerUser" rules={[{ required: true, message: '请输入每用户免费建智能体数' }]}>
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
            <Form.Item label="是否支持自定义智能体" name="allowCustomAgent" valuePropName="checked">
              <Switch checkedChildren="支持" unCheckedChildren="关闭" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        open={policyModalOpen}
        title={policyModalMode === 'edit' ? '编辑免费配额策略' : '新建免费配额策略'}
        onCancel={() => setPolicyModalOpen(false)}
        onOk={handlePolicySubmit}
        width={860}
        destroyOnClose
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
      </Modal>
    </div>
  );
}
