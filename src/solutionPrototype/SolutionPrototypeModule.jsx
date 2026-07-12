import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import './SolutionPrototypeModule.css';

const { TextArea } = Input;

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DISABLED', label: '停用' },
];

const SCENARIO_OPTIONS = [
  '教学空间',
  '组织培训',
  '教研共创',
  '社区运营',
  '企业内训',
  '综合解决方案',
].map((value) => ({ value, label: value }));

const USER_OPTIONS = ['管理员', '教师', '学员', '专家', '运营人员', '组织负责人'].map((value) => ({
  value,
  label: value,
}));

const TAG_OPTIONS = ['AI', '培训', '协作', '证书', '资源沉淀', '知识管理', '活动运营', '问卷反馈'].map((value) => ({
  value,
  label: value,
}));

const PACKAGE_RESOURCE_NOTE_MAP = {
  SPACE: '空间数量上限、是否支持自定义创建场景等空间资源边界已迁移到套餐管理中定义。',
  RESOURCE_LIBRARY: '可用资源类型、单文件上传上限、资料库容量和 AI 解析次数等资料库资源边界已迁移到套餐管理中定义。',
  MESSAGE: '可用消息通道、月消息发送量和消息保留天数等消息资源边界已迁移到套餐管理中定义。',
  SEMINAR: '单场人数上限、报名人数上限和月研讨会场次等研讨会资源边界已迁移到套餐管理中定义。',
  SURVEY: '可用题型、月问卷数量和月答卷数量等问卷资源边界已迁移到套餐管理中定义。',
  CERTIFICATE: '可导出格式、证书模板数量和月发放数量等证书资源边界已迁移到套餐管理中定义。',
};

const MODULE_CATALOG = [
  {
    key: 'SPACE',
    name: '空间模块',
    code: 'SPACE',
    icon: 'space',
    category: '基础承载',
    recommendedRequired: true,
    description: '提供解决方案落地后的空间创建、模板选择、入口与基础运营能力。',
    capabilityKeys: ['space_operation'],
    navLabel: '空间',
    deliveryItems: ['创建空间入口', '预置空间模板', '成员进入方式配置'],
    configTemplates: [
      {
        key: 'supported_space_templates',
        label: '支持的空间模板',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['教学场景', '组织培训场景'],
        options: ['教学场景', '组织培训场景', '教研场景', '社区共创场景', '课程创作中心'],
        description: '允许该方案创建的空间模板范围。',
      },
      {
        key: 'default_visibility',
        label: '默认可见范围',
        type: 'SELECT',
        required: true,
        defaultValue: '组织内可见',
        options: ['公开', '组织内可见', '私密'],
        description: '新建空间的默认可见范围。',
      },
      {
        key: 'entry_methods',
        label: '支持进入方式',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['手动邀请', '邀请链接'],
        options: ['手动邀请', '批量导入', '邀请链接', '报名表单', '学习广场'],
        description: '成员进入空间的方式。',
      },
    ],
  },
  {
    key: 'LUCKY',
    name: 'Lucky 模块',
    code: 'LUCKY',
    icon: 'lucky',
    category: 'AI 能力',
    description: '配置 Lucky 的技能、智能体、资料访问和面向用户的智能入口。',
    capabilityKeys: ['lucky_agent'],
    dependsOn: ['RESOURCE_LIBRARY'],
    navLabel: 'Lucky',
    deliveryItems: ['Lucky 工作台入口', '内置技能集合', '内置智能体集合'],
    configTemplates: [
      {
        key: 'skill_creation_enabled',
        label: '技能创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许用户创建新的 Lucky 技能。',
      },
      {
        key: 'agent_creation_enabled',
        label: '智能体创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许用户创建新的智能体。',
      },
      {
        key: 'builtin_skills',
        label: '内置技能',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['课程拆解', '资料综述', '题目讲评'],
        options: ['课程拆解', '资料综述', '题目讲评', '会议纪要', '评课分析', '学习路径规划'],
        description: '方案默认开放的 Lucky 技能。',
      },
      {
        key: 'builtin_agents',
        label: '内置智能体',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['学习教练', '培训运营助手'],
        options: ['学习教练', '培训运营助手', 'AI 助教', '教案协作者', '资源整理员', '课堂复盘官'],
        description: '方案默认开放的智能体。',
      },
      {
        key: 'library_scopes',
        label: '资料访问范围',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['组织资料库'],
        options: ['个人资料库', '组织资料库', '共享资料库', '当前空间资料'],
        description: 'Lucky 可检索和引用的资料范围。',
      },
    ],
  },
  {
    key: 'RESOURCE_LIBRARY',
    name: '资料库模块',
    code: 'RESOURCE_LIBRARY',
    icon: 'library',
    category: '内容资产',
    recommendedRequired: true,
    description: '管理个人、组织与共享资料，支持标签、解析、上传和成果归档。',
    capabilityKeys: ['resource_deposit'],
    navLabel: '资料库',
    deliveryItems: ['资料库入口', '资料类型规则', '标签与解析能力'],
    configTemplates: [
      {
        key: 'enabled_scopes',
        label: '启用库范围',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['组织资料库', '个人资料库'],
        options: ['个人资料库', '组织资料库', '共享资料库'],
        description: '方案中可使用的资料库范围。',
      },
      {
        key: 'tag_management_enabled',
        label: '标签管理开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用标签字典与快捷标签。',
      },
      {
        key: 'ai_parse_enabled',
        label: 'AI 解析开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用资料解析、摘要和结构化提取。',
      },
    ],
  },
  {
    key: 'KNOWLEDGE_SPACE',
    name: '知识空间模块',
    code: 'KNOWLEDGE_SPACE',
    icon: 'knowledge',
    category: '知识组织',
    description: '提供知识空间、成员角色、图谱绑定和面向学习/研究的知识导航。',
    capabilityKeys: ['knowledge_navigation'],
    dependsOn: ['SPACE'],
    navLabel: '知识空间',
    deliveryItems: ['知识空间入口', '成员角色模板', '知识图谱绑定能力'],
    configTemplates: [
      {
        key: 'create_enabled',
        label: '创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许创建知识空间。',
      },
      {
        key: 'supported_templates',
        label: '支持模板',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['教学知识空间', '教研知识空间'],
        options: ['教学知识空间', '教研知识空间', '培训知识空间', '项目知识空间'],
        description: '知识空间可使用的模板。',
      },
      {
        key: 'member_roles',
        label: '默认成员角色',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['管理员', '成员'],
        options: ['管理员', '教师', '学员', '专家', '成员', '访客'],
        description: '创建知识空间时预置的成员角色。',
      },
      {
        key: 'knowledge_graph_binding_enabled',
        label: '知识图谱绑定开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否允许从资料库绑定知识图谱。',
      },
      {
        key: 'default_visibility',
        label: '默认可见范围',
        type: 'SELECT',
        required: true,
        defaultValue: '组织内可见',
        options: ['公开', '组织内可见', '私密'],
        description: '知识空间默认可见范围。',
      },
    ],
  },
  {
    key: 'MESSAGE',
    name: '消息模块',
    code: 'MESSAGE',
    icon: 'message',
    category: '运营触达',
    description: '面向系统通知、Lucky 推送、审批提醒、活动提醒和消息留存的触达能力。',
    capabilityKeys: ['message_touch'],
    serves: ['研讨会模块', '问卷模块', '证书模块'],
    navLabel: '消息',
    deliveryItems: ['消息中心入口', '通知通道配置', '自动提醒规则'],
    configTemplates: [
      {
        key: 'lucky_push_enabled',
        label: 'Lucky 推送开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否允许 Lucky 主动推送建议和提醒。',
      },
      {
        key: 'system_notice_enabled',
        label: '系统通知开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否开启系统级通知。',
      },
      {
        key: 'approval_reminder_enabled',
        label: '审批提醒开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用审批相关提醒。',
      },
    ],
  },
  {
    key: 'SEMINAR',
    name: '研讨会模块',
    code: 'SEMINAR',
    icon: 'seminar',
    category: '活动协作',
    description: '支持研讨会创建、报名、协作工具、过程资料和成果沉淀。',
    capabilityKeys: ['seminar_operation'],
    navLabel: '研讨会',
    deliveryItems: ['研讨会入口', '报名和参与规则', '活动资料归档'],
    configTemplates: [
      {
        key: 'creation_enabled',
        label: '创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许创建研讨会。',
      },
      {
        key: 'default_tools',
        label: '默认工具',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['在线文档', '白板', '直播'],
        options: ['在线文档', '白板', '直播', '论坛', '投票', '资料库'],
        description: '研讨会默认开启的协作工具。',
      },
      {
        key: 'registration_enabled',
        label: '报名开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用报名流程。',
      },
      {
        key: 'certificate_binding_enabled',
        label: '证书联动开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '研讨会完成后是否可联动发放证书。',
      },
    ],
  },
  {
    key: 'SURVEY',
    name: '问卷模块',
    code: 'SURVEY',
    icon: 'survey',
    category: '反馈采集',
    description: '用于满意度、过程反馈、测评问卷和结果导出的轻量采集能力。',
    capabilityKeys: ['survey_feedback'],
    navLabel: '问卷',
    deliveryItems: ['问卷入口', '题型范围', '结果导出配置'],
    configTemplates: [
      {
        key: 'creation_enabled',
        label: '创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许创建问卷。',
      },
      {
        key: 'anonymous_allowed',
        label: '匿名开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否允许创建匿名问卷。',
      },
      {
        key: 'result_export_enabled',
        label: '结果导出开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否允许导出问卷结果。',
      },
      {
        key: 'bind_assessment_enabled',
        label: '考核联动开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: false,
        description: '问卷结果是否允许接入考核或评价。',
      },
    ],
  },
  {
    key: 'CERTIFICATE',
    name: '证书模块',
    code: 'CERTIFICATE',
    icon: 'certificate',
    category: '成果认证',
    description: '支持证书模板、编号规则、发放、导出、审批与归档。',
    capabilityKeys: ['certificate_issue'],
    dependsOnAny: ['SURVEY', 'SEMINAR'],
    navLabel: '证书',
    deliveryItems: ['证书模板入口', '发放批次能力', '证书资料归档'],
    configTemplates: [
      {
        key: 'template_creation_enabled',
        label: '模板创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许创建证书模板。',
      },
      {
        key: 'issue_enabled',
        label: '发放开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许发放证书。',
      },
      {
        key: 'serial_rule_pattern',
        label: '编号规则',
        type: 'STRING',
        required: true,
        defaultValue: 'CERT-{yyyyMMdd}-{seq}',
        description: '证书编号生成规则。',
      },
      {
        key: 'resource_library_archive_enabled',
        label: '归档到资料库',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '证书发放后是否自动归档到资料库。',
      },
      {
        key: 'approval_required',
        label: '发放审批开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: false,
        description: '证书发放前是否需要审批。',
      },
    ],
  },
];

function cloneValue(value) {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === 'object') return { ...value };
  return value;
}

function nowText() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildConfigs(moduleDef) {
  return Object.fromEntries(moduleDef.configTemplates.map((item) => [item.key, cloneValue(item.defaultValue)]));
}

function createModuleAssignment(moduleDef, sortNo) {
  return {
    id: `${moduleDef.key.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    moduleKey: moduleDef.key,
    required: Boolean(moduleDef.recommendedRequired),
    enabled: true,
    sortNo,
    deployStatus: 'CONFIGURING',
    configs: buildConfigs(moduleDef),
    remark: '',
  };
}

function buildInitialSolutions() {
  const findModule = (key) => MODULE_CATALOG.find((item) => item.key === key);
  const trainingModules = ['SPACE', 'RESOURCE_LIBRARY', 'LUCKY', 'MESSAGE', 'SEMINAR', 'SURVEY', 'CERTIFICATE']
    .map((key, index) => createModuleAssignment(findModule(key), index + 1));
  const researchModules = ['SPACE', 'RESOURCE_LIBRARY', 'KNOWLEDGE_SPACE', 'MESSAGE']
    .map((key, index) => createModuleAssignment(findModule(key), index + 1));

  return [
    {
      id: 'sol-training-camp',
      name: '教师数字素养提升培训方案',
      code: 'SOL-TRAINING-AI',
      status: 'DRAFT',
      version: 'v1.0',
      versionNote: '首版培训方案，覆盖研讨、问卷、证书闭环。',
      owner: '运营中心',
      scenario: '组织培训',
      targetUsers: ['管理员', '教师', '学员'],
      tags: ['AI', '培训', '证书', '资源沉淀'],
      description: '面向教师数字素养提升项目，提供空间、资料、研讨、反馈与证书发放的一体化运营方案。',
      updatedAt: '2026-07-10 16:20',
      enabledCapabilities: ['space_operation', 'lucky_agent', 'resource_deposit', 'message_touch', 'seminar_operation', 'survey_feedback', 'certificate_issue'],
      modules: trainingModules,
    },
    {
      id: 'sol-research-hub',
      name: '区域教研共创解决方案',
      code: 'SOL-RESEARCH-HUB',
      status: 'PUBLISHED',
      version: 'v1.2',
      versionNote: '增加知识空间与资料归档能力。',
      owner: '教研中心',
      scenario: '教研共创',
      targetUsers: ['管理员', '教师', '专家'],
      tags: ['协作', '知识管理', '资源沉淀'],
      description: '用于跨校教研议题共创、资料沉淀、知识空间建设和过程消息触达。',
      updatedAt: '2026-07-08 09:45',
      enabledCapabilities: ['space_operation', 'resource_deposit', 'knowledge_navigation', 'message_touch'],
      modules: researchModules,
    },
  ];
}

function statusTag(status) {
  const map = {
    DRAFT: { color: 'default', label: '草稿' },
    PUBLISHED: { color: 'success', label: '已发布' },
    DISABLED: { color: 'warning', label: '停用' },
  };
  const target = map[status] || map.DRAFT;
  return <Tag color={target.color}>{target.label}</Tag>;
}

function deployTag(status) {
  const map = {
    TODO: { color: 'default', label: '待配置' },
    CONFIGURING: { color: 'processing', label: '配置中' },
    READY: { color: 'success', label: '已就绪' },
    BLOCKED: { color: 'error', label: '有风险' },
  };
  const target = map[status] || map.TODO;
  return <Tag color={target.color}>{target.label}</Tag>;
}

function ModuleIcon({ type }) {
  const iconMap = {
    space: <AppstoreOutlined />,
    lucky: <ThunderboltOutlined />,
    library: <DatabaseOutlined />,
    knowledge: <ClusterOutlined />,
    message: <MessageOutlined />,
    seminar: <TeamOutlined />,
    survey: <FileTextOutlined />,
    certificate: <SafetyCertificateOutlined />,
  };
  return iconMap[type] || <AppstoreOutlined />;
}

function isFilled(value, type) {
  if (type === 'BOOLEAN') return typeof value === 'boolean';
  if (type === 'NUMBER') return value !== null && value !== undefined && value !== '';
  if (type === 'MULTI_SELECT') return Array.isArray(value) && value.length > 0;
  if (type === 'JSON') {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function getModuleConfigStatus(assignment, moduleDef) {
  const requiredItems = moduleDef.configTemplates.filter((item) => item.required);
  if (!requiredItems.length) return { percent: 100, missing: [] };
  const missing = requiredItems.filter((item) => !isFilled(assignment.configs?.[item.key], item.type));
  return {
    percent: Math.round(((requiredItems.length - missing.length) / requiredItems.length) * 100),
    missing,
  };
}

function getSolutionChecks(solution, moduleCatalog) {
  if (!solution) return [];
  const moduleKeys = new Set(solution.modules.map((item) => item.moduleKey));
  const missingBaseline = moduleCatalog.filter((item) => item.recommendedRequired && !moduleKeys.has(item.key));
  const configMissing = [];
  const dependencyMissing = [];

  solution.modules.forEach((assignment) => {
    const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
    if (!moduleDef || !assignment.enabled) return;
    const configStatus = getModuleConfigStatus(assignment, moduleDef);
    if (assignment.required && configStatus.missing.length) {
      configMissing.push(`${moduleDef.name}: ${configStatus.missing.map((item) => item.label).join('、')}`);
    }
    (moduleDef.dependsOn || []).forEach((depKey) => {
      if (!moduleKeys.has(depKey)) {
        dependencyMissing.push(`${moduleDef.name} 依赖 ${moduleCatalog.find((item) => item.key === depKey)?.name || depKey}`);
      }
    });
    if (moduleDef.dependsOnAny?.length && !moduleDef.dependsOnAny.some((depKey) => moduleKeys.has(depKey))) {
      dependencyMissing.push(`${moduleDef.name} 需要 ${moduleDef.dependsOnAny.map((depKey) => moduleCatalog.find((item) => item.key === depKey)?.name || depKey).join(' 或 ')}`);
    }
  });

  const baseMissing = [];
  if (!solution.name?.trim()) baseMissing.push('方案名称');
  if (!solution.code?.trim()) baseMissing.push('方案编码');
  if (!solution.scenario?.trim()) baseMissing.push('适用场景');
  if (!solution.description?.trim()) baseMissing.push('方案简介');
  if (!solution.targetUsers?.length) baseMissing.push('目标用户');

  return [
    {
      key: 'base',
      title: '基础信息完整',
      passed: baseMissing.length === 0,
      detail: baseMissing.length ? `缺少：${baseMissing.join('、')}` : '基础画像已经完整。',
    },
    {
      key: 'baseline',
      title: '推荐必选模块已添加',
      passed: missingBaseline.length === 0,
      detail: missingBaseline.length ? `建议添加：${missingBaseline.map((item) => item.name).join('、')}` : '空间和资料库等基础模块已添加。',
    },
    {
      key: 'config',
      title: '必填配置已完成',
      passed: configMissing.length === 0,
      detail: configMissing.length ? configMissing.join('；') : '必装模块的必填配置均已完成。',
    },
    {
      key: 'dependency',
      title: '模块依赖已满足',
      passed: dependencyMissing.length === 0,
      detail: dependencyMissing.length ? dependencyMissing.join('；') : '当前模块依赖关系正常。',
    },
  ];
}

function getSolutionCompleteness(solution, moduleCatalog) {
  const checks = getSolutionChecks(solution, moduleCatalog);
  if (!checks.length) return 0;
  return Math.round((checks.filter((item) => item.passed).length / checks.length) * 100);
}

function getFieldOptions(template) {
  return (template.options || []).map((item) => ({ label: item, value: item }));
}

function SolutionPrototypeModule() {
  const [moduleCatalog, setModuleCatalog] = useState(MODULE_CATALOG);
  const [solutions, setSolutions] = useState(buildInitialSolutions);
  const [activeTab, setActiveTab] = useState('solutions');
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState('base');
  const [selectedSolutionId, setSelectedSolutionId] = useState(null);
  const [activeConfigAssignmentId, setActiveConfigAssignmentId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [configModal, setConfigModal] = useState({ open: false });
  const [solutionForm] = Form.useForm();
  const [inlineConfigForm] = Form.useForm();
  const [configForm] = Form.useForm();

  const selectedSolution = useMemo(
    () => solutions.find((item) => item.id === selectedSolutionId) || null,
    [solutions, selectedSolutionId],
  );

  const selectedSortedModules = useMemo(() => {
    return selectedSolution ? [...selectedSolution.modules].sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0)) : [];
  }, [selectedSolution]);

  const activeConfigAssignment = useMemo(() => {
    if (!selectedSortedModules.length) return null;
    return selectedSortedModules.find((item) => item.id === activeConfigAssignmentId) || selectedSortedModules[0];
  }, [activeConfigAssignmentId, selectedSortedModules]);

  const activeConfigModule = useMemo(() => {
    if (!activeConfigAssignment) return null;
    return moduleCatalog.find((item) => item.key === activeConfigAssignment.moduleKey) || null;
  }, [activeConfigAssignment, moduleCatalog]);

  const filteredSolutions = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return solutions;
    return solutions.filter((item) => {
      const text = `${item.name} ${item.code} ${item.scenario} ${item.owner} ${(item.tags || []).join(' ')}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, solutions]);

  const summary = useMemo(() => {
    const publishedCount = solutions.filter((item) => item.status === 'PUBLISHED').length;
    const avgCompleteness = solutions.length
      ? Math.round(solutions.reduce((sum, item) => sum + getSolutionCompleteness(item, moduleCatalog), 0) / solutions.length)
      : 0;
    const moduleCount = solutions.reduce((sum, item) => sum + item.modules.length, 0);
    return { publishedCount, avgCompleteness, moduleCount };
  }, [moduleCatalog, solutions]);

  useEffect(() => {
    if (!activeConfigAssignment || !activeConfigModule) {
      inlineConfigForm.resetFields();
      return;
    }
    inlineConfigForm.setFieldsValue(activeConfigAssignment.configs || buildConfigs(activeConfigModule));
  }, [activeConfigAssignment, activeConfigModule, inlineConfigForm]);

  const updateSolution = (id, updater) => {
    setSolutions((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const patch = typeof updater === 'function' ? updater(item) : updater;
      return { ...item, ...patch, updatedAt: nowText() };
    }));
  };

  const openSolution = (solution) => {
    setSelectedSolutionId(solution.id);
    setDrawerActiveTab('base');
    setActiveConfigAssignmentId(solution.modules[0]?.id || null);
    setDrawerOpen(true);
  };

  const handleCreateSolution = async () => {
    const values = await solutionForm.validateFields();
    const next = {
      id: `solution-${Date.now()}`,
      name: values.name,
      code: values.code || `SOL-${Date.now().toString().slice(-6)}`,
      status: values.status || 'DRAFT',
      version: values.version || 'v1.0',
      versionNote: values.versionNote || '',
      owner: values.owner || '',
      scenario: values.scenario || '',
      targetUsers: values.targetUsers || [],
      tags: values.tags || [],
      description: values.description || '',
      updatedAt: nowText(),
      enabledCapabilities: [],
      modules: [],
    };
    setSolutions((prev) => [next, ...prev]);
    setCreateModalOpen(false);
    solutionForm.resetFields();
    openSolution(next);
    message.success('解决方案已创建');
  };

  const handleDeleteSolution = (id) => {
    setSolutions((prev) => prev.filter((item) => item.id !== id));
    if (selectedSolutionId === id) {
      setDrawerOpen(false);
      setSelectedSolutionId(null);
    }
    message.success('解决方案已删除');
  };

  const handleDuplicateSolution = (solution) => {
    const copyIndex = solutions.filter((item) => item.id.startsWith(`${solution.id}-copy`)).length + 1;
    const next = {
      ...solution,
      id: `${solution.id}-copy-${copyIndex}`,
      name: `${solution.name} 副本`,
      code: `${solution.code}-COPY-${copyIndex}`,
      status: 'DRAFT',
      version: 'v1.0',
      updatedAt: nowText(),
      modules: solution.modules.map((item, index) => ({
        ...item,
        id: `${item.id}-copy-${copyIndex}-${index}`,
        configs: Object.fromEntries(Object.entries(item.configs || {}).map(([key, value]) => [key, cloneValue(value)])),
      })),
    };
    setSolutions((prev) => [next, ...prev]);
    message.success('已复制为新方案');
  };

  const handleChangeSelectedField = (field, value) => {
    if (!selectedSolution) return;
    updateSolution(selectedSolution.id, { [field]: value });
  };

  const handleAddModule = (moduleDef) => {
    if (!selectedSolution) return;
    if (selectedSolution.modules.some((item) => item.moduleKey === moduleDef.key)) {
      message.warning('该模块已在当前方案中');
      return;
    }
    const nextModule = createModuleAssignment(moduleDef, selectedSolution.modules.length + 1);
    updateSolution(selectedSolution.id, (solution) => ({
      modules: [...solution.modules, nextModule],
      enabledCapabilities: Array.from(new Set([...solution.enabledCapabilities, ...(moduleDef.capabilityKeys || [])])),
    }));
    setActiveConfigAssignmentId(nextModule.id);
    setDrawerActiveTab('module-capability');
    setAddModuleOpen(false);
    message.success(`${moduleDef.name} 已加入方案`);
  };

  const handleInitStandardModules = () => {
    if (!selectedSolution) return;
    const existing = new Set(selectedSolution.modules.map((item) => item.moduleKey));
    const additions = moduleCatalog
      .filter((item) => !existing.has(item.key))
      .map((item, index) => createModuleAssignment(item, selectedSolution.modules.length + index + 1));
    if (!additions.length) {
      message.info('当前方案已包含全部标准模块');
      return;
    }
    updateSolution(selectedSolution.id, (solution) => ({
      modules: [...solution.modules, ...additions],
      enabledCapabilities: Array.from(new Set([
        ...solution.enabledCapabilities,
        ...moduleCatalog.flatMap((item) => item.capabilityKeys || []),
      ])),
    }));
    setActiveConfigAssignmentId(additions[0].id);
    setDrawerActiveTab('module-capability');
    message.success('已加入全部标准模块');
  };

  const handleRemoveModule = (assignmentId) => {
    if (!selectedSolution) return;
    updateSolution(selectedSolution.id, (solution) => ({
      modules: solution.modules
        .filter((item) => item.id !== assignmentId)
        .map((item, index) => ({ ...item, sortNo: index + 1 })),
    }));
    message.success('模块已移除');
  };

  const handleChangeModule = (assignmentId, patch) => {
    if (!selectedSolution) return;
    updateSolution(selectedSolution.id, (solution) => ({
      modules: solution.modules.map((item) => (item.id === assignmentId ? { ...item, ...patch } : item)),
    }));
  };

  const handleMoveModule = (assignmentId, direction) => {
    if (!selectedSolution) return;
    updateSolution(selectedSolution.id, (solution) => {
      const sorted = [...solution.modules].sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0));
      const currentIndex = sorted.findIndex((item) => item.id === assignmentId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
        return { modules: solution.modules };
      }
      const nextModules = [...sorted];
      [nextModules[currentIndex], nextModules[nextIndex]] = [nextModules[nextIndex], nextModules[currentIndex]];
      return {
        modules: nextModules.map((item, index) => ({ ...item, sortNo: index + 1 })),
      };
    });
  };

  const openTemplateConfig = (moduleDef) => {
    configForm.setFieldsValue(buildConfigs(moduleDef));
    setConfigModal({ open: true, moduleKey: moduleDef.key });
  };

  const handleSaveTemplateConfig = async () => {
    const values = await configForm.validateFields();
    const moduleDef = moduleCatalog.find((item) => item.key === configModal.moduleKey);
    if (!moduleDef) return;
    setModuleCatalog((prev) => prev.map((item) => {
      if (item.key !== moduleDef.key) return item;
      return {
        ...item,
        configTemplates: item.configTemplates.map((template) => ({
          ...template,
          defaultValue: cloneValue(values[template.key]),
        })),
      };
    }));
    message.success('模块默认配置已更新');
    setConfigModal({ open: false });
    configForm.resetFields();
  };

  const handleSaveInlineConfig = async () => {
    if (!activeConfigAssignment || !activeConfigModule) return;
    const values = await inlineConfigForm.validateFields();
    handleChangeModule(activeConfigAssignment.id, { configs: values, deployStatus: 'READY' });
    message.success(`${activeConfigModule.name} 配置已保存`);
  };

  const handleResetInlineConfig = () => {
    if (!activeConfigModule) return;
    inlineConfigForm.setFieldsValue(buildConfigs(activeConfigModule));
    message.info('已还原为模块默认配置，保存后生效');
  };

  const tryPublish = () => {
    if (!selectedSolution) return;
    const checks = getSolutionChecks(selectedSolution, moduleCatalog);
    const failed = checks.filter((item) => !item.passed);
    if (failed.length) {
      message.warning(`还有 ${failed.length} 项完整性检查未通过`);
      return;
    }
    updateSolution(selectedSolution.id, { status: 'PUBLISHED' });
    message.success('方案已发布');
  };

  const renderConfigField = (template) => {
    const commonProps = {
      label: (
        <Space size={6}>
          <span>{template.label}</span>
          {template.required ? <Tag color="red">必填</Tag> : null}
        </Space>
      ),
      name: template.key,
      rules: template.required
        ? [{ required: true, message: `请配置${template.label}` }]
        : [],
      extra: template.description,
    };
    if (template.type === 'BOOLEAN') {
      return (
        <Form.Item key={template.key} {...commonProps} valuePropName="checked">
          <Switch checkedChildren="开" unCheckedChildren="关" />
        </Form.Item>
      );
    }
    if (template.type === 'NUMBER') {
      return (
        <Form.Item key={template.key} {...commonProps}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      );
    }
    if (template.type === 'SELECT') {
      return (
        <Form.Item key={template.key} {...commonProps}>
          <Select options={getFieldOptions(template)} placeholder="请选择" />
        </Form.Item>
      );
    }
    if (template.type === 'MULTI_SELECT') {
      return (
        <Form.Item key={template.key} {...commonProps}>
          <Select mode="multiple" options={getFieldOptions(template)} placeholder="请选择，可多选" />
        </Form.Item>
      );
    }
    if (template.type === 'TEXTAREA' || template.type === 'JSON') {
      return (
        <Form.Item key={template.key} {...commonProps}>
          <TextArea rows={4} placeholder={template.type === 'JSON' ? '{"key":"value"}' : '请输入'} />
        </Form.Item>
      );
    }
    return (
      <Form.Item key={template.key} {...commonProps}>
        <Input placeholder="请输入" />
      </Form.Item>
    );
  };

  const solutionColumns = [
    {
      title: '方案名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (value, record) => (
        <Button type="link" className="sp-name-button" onClick={() => openSolution(record)}>
          {value}
        </Button>
      ),
    },
    { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: statusTag,
    },
    { title: '适用场景', dataIndex: 'scenario', key: 'scenario', width: 120 },
    {
      title: '模块数',
      key: 'moduleCount',
      width: 90,
      render: (_, record) => record.modules.length,
    },
    {
      title: '完整度',
      key: 'completeness',
      width: 150,
      render: (_, record) => (
        <Progress
          percent={getSolutionCompleteness(record, moduleCatalog)}
          size="small"
          status={getSolutionCompleteness(record, moduleCatalog) === 100 ? 'success' : 'active'}
        />
      ),
    },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 170,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openSolution(record)}>
            查看
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateSolution(record)} />
          <Popconfirm title="确定删除该方案吗？" onConfirm={() => handleDeleteSolution(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderDrawer = () => {
    if (!selectedSolution) return null;
    const checks = getSolutionChecks(selectedSolution, moduleCatalog);
    const completeness = getSolutionCompleteness(selectedSolution, moduleCatalog);
    const previewModules = selectedSortedModules
      .filter((item) => item.enabled)
      .map((item) => moduleCatalog.find((moduleDef) => moduleDef.key === item.moduleKey))
      .filter(Boolean);

    const drawerTabs = [
      {
        key: 'base',
        label: '基础信息',
        children: (
          <div className="sp-section">
            <div className="sp-form-grid">
              <label>
                <span>方案名称</span>
                <Input value={selectedSolution.name} onChange={(event) => handleChangeSelectedField('name', event.target.value)} />
              </label>
              <label>
                <span>方案编码</span>
                <Input value={selectedSolution.code} onChange={(event) => handleChangeSelectedField('code', event.target.value)} />
              </label>
              <label>
                <span>版本号</span>
                <Input value={selectedSolution.version} onChange={(event) => handleChangeSelectedField('version', event.target.value)} />
              </label>
              <label>
                <span>负责人</span>
                <Input value={selectedSolution.owner} onChange={(event) => handleChangeSelectedField('owner', event.target.value)} />
              </label>
              <label>
                <span>状态</span>
                <Select value={selectedSolution.status} options={STATUS_OPTIONS} onChange={(value) => handleChangeSelectedField('status', value)} />
              </label>
              <label>
                <span>适用场景</span>
                <Select value={selectedSolution.scenario} options={SCENARIO_OPTIONS} onChange={(value) => handleChangeSelectedField('scenario', value)} />
              </label>
              <label>
                <span>目标用户</span>
                <Select
                  mode="multiple"
                  value={selectedSolution.targetUsers}
                  options={USER_OPTIONS}
                  onChange={(value) => handleChangeSelectedField('targetUsers', value)}
                />
              </label>
              <label>
                <span>方案标签</span>
                <Select
                  mode="tags"
                  value={selectedSolution.tags}
                  options={TAG_OPTIONS}
                  onChange={(value) => handleChangeSelectedField('tags', value)}
                />
              </label>
              <label className="sp-form-span">
                <span>方案简介</span>
                <TextArea rows={4} value={selectedSolution.description} onChange={(event) => handleChangeSelectedField('description', event.target.value)} />
              </label>
              <label className="sp-form-span">
                <span>版本说明</span>
                <TextArea rows={3} value={selectedSolution.versionNote} onChange={(event) => handleChangeSelectedField('versionNote', event.target.value)} />
              </label>
            </div>
          </div>
        ),
      },
      {
        key: 'module-capability',
        label: '模块能力',
        children: (
          <div className="sp-section sp-module-capability-section">
            <div className="sp-section-toolbar">
              <div>
                <div className="sp-section-title">模块编排与配置</div>
                <div className="sp-section-subtitle">在同一个视图完成模块排序、启停、必选和当前模块配置。</div>
              </div>
              <Space wrap>
                <Button icon={<PlusOutlined />} onClick={() => setAddModuleOpen(true)}>
                  添加模块
                </Button>
                <Button icon={<RocketOutlined />} type="primary" onClick={handleInitStandardModules}>
                  一键加入标准模块
                </Button>
              </Space>
            </div>

            {selectedSortedModules.length ? (
              <div className="sp-config-layout sp-unified-config-layout">
                <div className="sp-config-sidebar">
                  <div className="sp-config-sidebar-title">模块编排</div>
                  {selectedSortedModules.map((assignment, index) => {
                    const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
                    if (!moduleDef) return null;
                    const configStatus = getModuleConfigStatus(assignment, moduleDef);
                    const isActive = activeConfigAssignment?.id === assignment.id;
                    return (
                      <div key={assignment.id} className={`sp-config-module-card ${isActive ? 'is-active' : ''}`}>
                        <button
                          type="button"
                          className="sp-config-module-item"
                          onClick={() => setActiveConfigAssignmentId(assignment.id)}
                        >
                          <Avatar className="sp-module-avatar" shape="square" icon={<ModuleIcon type={moduleDef.icon} />} />
                          <span className="sp-config-module-main">
                            <strong>{moduleDef.name}</strong>
                            <small>{configStatus.percent}% 完成 · {assignment.required ? '必选' : '可选'}</small>
                          </span>
                          <span className="sp-module-order-actions" onClick={(event) => event.stopPropagation()}>
                            <Tooltip title="上移">
                              <Button
                                size="small"
                                icon={<ArrowUpOutlined />}
                                disabled={index === 0}
                                onClick={() => handleMoveModule(assignment.id, 'up')}
                              />
                            </Tooltip>
                            <Tooltip title="下移">
                              <Button
                                size="small"
                                icon={<ArrowDownOutlined />}
                                disabled={index === selectedSortedModules.length - 1}
                                onClick={() => handleMoveModule(assignment.id, 'down')}
                              />
                            </Tooltip>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="sp-config-detail">
                  {activeConfigAssignment && activeConfigModule ? (
                    <>
                      <div className="sp-config-detail-head">
                        <div>
                          <div className="sp-config-detail-title">{activeConfigModule.name}</div>
                          <div className="sp-config-detail-desc">{activeConfigModule.description}</div>
                          <Space wrap className="sp-tag-row">
                            <Tag>{activeConfigModule.code}</Tag>
                            <Tag color="geekblue">{activeConfigModule.category}</Tag>
                            {activeConfigAssignment.required ? <Tag color="blue">必选模块</Tag> : <Tag>可选模块</Tag>}
                            {activeConfigAssignment.enabled ? <Tag color="success">已启用</Tag> : <Tag>已停用</Tag>}
                            {deployTag(activeConfigAssignment.deployStatus)}
                          </Space>
                        </div>
                        <Progress
                          type="circle"
                          size={62}
                          percent={getModuleConfigStatus(activeConfigAssignment, activeConfigModule).percent}
                        />
                      </div>

                      {[
                        ...(activeConfigModule.dependsOn || []).map((depKey) => `依赖 ${moduleCatalog.find((item) => item.key === depKey)?.name || depKey}`),
                        ...(activeConfigModule.dependsOnAny?.length
                          ? [`需要 ${activeConfigModule.dependsOnAny.map((depKey) => moduleCatalog.find((item) => item.key === depKey)?.name || depKey).join(' 或 ')}`]
                          : []),
                        ...(activeConfigModule.serves || []).map((name) => `服务于 ${name}`),
                      ].length ? (
                        <div className="sp-dependency-line sp-config-dependency">
                          <ToolOutlined />
                          {[
                            ...(activeConfigModule.dependsOn || []).map((depKey) => `依赖 ${moduleCatalog.find((item) => item.key === depKey)?.name || depKey}`),
                            ...(activeConfigModule.dependsOnAny?.length
                              ? [`需要 ${activeConfigModule.dependsOnAny.map((depKey) => moduleCatalog.find((item) => item.key === depKey)?.name || depKey).join(' 或 ')}`]
                              : []),
                            ...(activeConfigModule.serves || []).map((name) => `服务于 ${name}`),
                          ].join('；')}
                        </div>
                      ) : null}

                      {PACKAGE_RESOURCE_NOTE_MAP[activeConfigModule.key] ? (
                        <Alert
                          type="info"
                          showIcon
                          className="sp-config-note"
                          message="资源限制由套餐定义"
                          description={`${PACKAGE_RESOURCE_NOTE_MAP[activeConfigModule.key]}解决方案这里只保留模块能力与业务配置。`}
                        />
                      ) : null}

                      <Form form={inlineConfigForm} layout="vertical" className="sp-config-form sp-inline-config-form">
                        {activeConfigModule.configTemplates.map(renderConfigField)}
                      </Form>

                      <div className="sp-inline-config-actions">
                        <div>
                          <Popconfirm title="确定从方案中删除当前模块吗？" onConfirm={() => handleRemoveModule(activeConfigAssignment.id)}>
                            <Button danger icon={<DeleteOutlined />}>
                              删除当前模块
                            </Button>
                          </Popconfirm>
                        </div>
                        <Space>
                          <Button onClick={handleResetInlineConfig}>还原默认配置</Button>
                          <Button type="primary" icon={<SettingOutlined />} onClick={handleSaveInlineConfig}>
                            保存当前模块配置
                          </Button>
                        </Space>
                      </div>
                    </>
                  ) : (
                    <Empty description="请选择左侧模块" />
                  )}
                </div>
              </div>
            ) : (
              <Empty description="当前方案还没有可配置模块">
                <Button type="primary" icon={<RocketOutlined />} onClick={handleInitStandardModules}>
                  一键加入标准模块
                </Button>
              </Empty>
            )}
          </div>
        ),
      },
      {
        key: 'checks',
        label: '完整性检查',
        children: (
          <div className="sp-section">
            <Alert
              type={completeness === 100 ? 'success' : 'warning'}
              showIcon
              message={completeness === 100 ? '方案可以发布' : '方案仍有待完善项'}
              description={`当前完整度 ${completeness}%。发布前需完成基础信息、推荐模块、必填配置和依赖关系。`}
            />
            <div className="sp-check-list">
              {checks.map((item) => (
                <div key={item.key} className={`sp-check-item ${item.passed ? 'is-pass' : 'is-risk'}`}>
                  <div className="sp-check-icon">{item.passed ? <CheckCircleOutlined /> : <WarningOutlined />}</div>
                  <div>
                    <div className="sp-check-title">{item.title}</div>
                    <div className="sp-check-detail">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        key: 'preview',
        label: '方案预览',
        children: (
          <div className="sp-preview-grid">
            <div className="sp-preview-panel">
              <div className="sp-preview-title">默认导航结构</div>
              <div className="sp-preview-nav">
                {previewModules.map((item) => (
                  <div key={item.key} className="sp-preview-nav-item">
                    <ModuleIcon type={item.icon} />
                    <span>{item.navLabel}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sp-preview-panel">
              <div className="sp-preview-title">角色体验</div>
              <div className="sp-role-list">
                {(selectedSolution.targetUsers.length ? selectedSolution.targetUsers : ['管理员']).map((role) => (
                  <div key={role} className="sp-role-item">
                    <Avatar size={32} icon={<TeamOutlined />} />
                    <div>
                      <div className="sp-role-name">{role}</div>
                      <div className="sp-role-desc">进入后可看到与该角色匹配的模块入口、资料和任务提醒。</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sp-preview-panel sp-preview-wide">
              <div className="sp-preview-title">交付清单</div>
              <div className="sp-delivery-grid">
                {previewModules.flatMap((item) => item.deliveryItems.map((delivery) => (
                  <div key={`${item.key}-${delivery}`} className="sp-delivery-item">
                    <CheckCircleOutlined />
                    <span>{delivery}</span>
                  </div>
                )))}
              </div>
            </div>
          </div>
        ),
      },
    ];

    return (
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="min(1180px, 96vw)"
        destroyOnClose={false}
      >
        <div className="sp-drawer-head">
          <div className="sp-drawer-id">
            <Avatar className="sp-solution-avatar" icon={<AppstoreOutlined />} />
            <div>
              <div className="sp-drawer-title">{selectedSolution.name}</div>
              <div className="sp-drawer-subtitle">
                {selectedSolution.code} · {selectedSolution.version} · {selectedSolution.updatedAt}
              </div>
              <Space wrap className="sp-tag-row">
                {statusTag(selectedSolution.status)}
                <Tag color="geekblue">{selectedSolution.scenario || '未选择场景'}</Tag>
                {selectedSolution.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </Space>
            </div>
          </div>
          <div className="sp-drawer-actions">
            <Progress type="circle" size={64} percent={completeness} />
            <Button icon={<CopyOutlined />} onClick={() => handleDuplicateSolution(selectedSolution)}>
              复制方案
            </Button>
            <Button type="primary" icon={<RocketOutlined />} onClick={tryPublish}>
              发布方案
            </Button>
          </div>
        </div>
        <Tabs activeKey={drawerActiveTab} onChange={setDrawerActiveTab} items={drawerTabs} />
      </Drawer>
    );
  };

  const currentConfigModule = moduleCatalog.find((item) => item.key === configModal.moduleKey);
  const availableModules = selectedSolution
    ? moduleCatalog.filter((item) => !selectedSolution.modules.some((moduleItem) => moduleItem.moduleKey === item.key))
    : [];

  return (
    <div className="solution-prototype-module">
      <div className="sp-page-header">
        <div>
          <div className="sp-eyebrow">独立前端原型</div>
          <h1>解决方案管理</h1>
          <p>管理方案画像、模块编排、配置完整性与发布预览。数据仅保存在当前页面状态。</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建方案
        </Button>
      </div>

      <div className="sp-summary-grid">
        <div className="sp-summary-card">
          <span>解决方案</span>
          <strong>{solutions.length}</strong>
          <small>当前原型内方案数量</small>
        </div>
        <div className="sp-summary-card">
          <span>已发布</span>
          <strong>{summary.publishedCount}</strong>
          <small>通过完整性检查后可发布</small>
        </div>
        <div className="sp-summary-card">
          <span>平均完整度</span>
          <strong>{summary.avgCompleteness}%</strong>
          <small>基础信息、模块、配置和依赖</small>
        </div>
        <div className="sp-summary-card">
          <span>模块实例</span>
          <strong>{summary.moduleCount}</strong>
          <small>所有方案已选模块合计</small>
        </div>
      </div>

      <div className="sp-main-panel">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'solutions',
              label: '解决方案',
              children: (
                <div className="sp-tab-content">
                  <div className="sp-toolbar">
                    <Input.Search
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="搜索方案名称、编码、场景、负责人"
                      allowClear
                      style={{ maxWidth: 420 }}
                    />
                    <Space>
                      <Button onClick={() => setKeyword('')}>重置</Button>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                        新建方案
                      </Button>
                    </Space>
                  </div>
                  <Table
                    rowKey="id"
                    columns={solutionColumns}
                    dataSource={filteredSolutions}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 1280 }}
                  />
                </div>
              ),
            },
            {
              key: 'catalog',
              label: '模块目录',
              children: (
                <div className="sp-catalog-grid">
                  {moduleCatalog.map((moduleDef) => (
                    <div key={moduleDef.key} className="sp-catalog-card">
                      <div className="sp-catalog-head">
                        <Avatar className="sp-module-avatar" shape="square" icon={<ModuleIcon type={moduleDef.icon} />} />
                        <div>
                          <div className="sp-catalog-title">{moduleDef.name}</div>
                          <div className="sp-module-meta">{moduleDef.code} · {moduleDef.category}</div>
                        </div>
                      </div>
                      <p>{moduleDef.description}</p>
                      <div className="sp-catalog-configs">
                        {moduleDef.configTemplates.map((template) => (
                          <Tooltip key={template.key} title={template.description}>
                            <Tag color={template.required ? 'blue' : 'default'}>{template.label}</Tag>
                          </Tooltip>
                        ))}
                      </div>
                      <Button icon={<EditOutlined />} onClick={() => openTemplateConfig(moduleDef)}>
                        编辑默认配置
                      </Button>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      {renderDrawer()}

      <Modal
        title="新建解决方案"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateSolution}
        okText="创建"
        width={760}
        destroyOnClose
      >
        <Form form={solutionForm} layout="vertical" initialValues={{ status: 'DRAFT', version: 'v1.0', targetUsers: [], tags: [] }}>
          <div className="sp-form-grid">
            <Form.Item label="方案名称" name="name" rules={[{ required: true, message: '请输入方案名称' }]}>
              <Input placeholder="例如：教师数字素养提升培训方案" />
            </Form.Item>
            <Form.Item label="方案编码" name="code">
              <Input placeholder="留空自动生成" />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="版本号" name="version">
              <Input placeholder="v1.0" />
            </Form.Item>
            <Form.Item label="负责人" name="owner">
              <Input placeholder="方案负责人" />
            </Form.Item>
            <Form.Item label="适用场景" name="scenario">
              <Select options={SCENARIO_OPTIONS} placeholder="请选择" />
            </Form.Item>
            <Form.Item label="目标用户" name="targetUsers">
              <Select mode="multiple" options={USER_OPTIONS} placeholder="请选择" />
            </Form.Item>
            <Form.Item label="方案标签" name="tags">
              <Select mode="tags" options={TAG_OPTIONS} placeholder="输入或选择标签" />
            </Form.Item>
            <Form.Item className="sp-form-span" label="方案简介" name="description">
              <TextArea rows={3} placeholder="描述该方案的适用范围和交付目标" />
            </Form.Item>
            <Form.Item className="sp-form-span" label="版本说明" name="versionNote">
              <TextArea rows={2} placeholder="记录当前版本的设计说明" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="添加标准模块"
        open={addModuleOpen}
        onCancel={() => setAddModuleOpen(false)}
        footer={null}
        width={900}
      >
        {availableModules.length ? (
          <div className="sp-add-module-grid">
            {availableModules.map((moduleDef) => (
              <div key={moduleDef.key} className="sp-add-module-card">
                <Avatar className="sp-module-avatar" shape="square" icon={<ModuleIcon type={moduleDef.icon} />} />
                <div>
                  <div className="sp-catalog-title">{moduleDef.name}</div>
                  <div className="sp-module-meta">{moduleDef.code} · {moduleDef.category}</div>
                  <p>{moduleDef.description}</p>
                  <Button type="primary" onClick={() => handleAddModule(moduleDef)}>
                    加入方案
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="当前方案已包含全部标准模块" />
        )}
      </Modal>

      <Modal
        title={`默认配置：${currentConfigModule?.name || ''}`}
        open={configModal.open}
        onCancel={() => {
          setConfigModal({ open: false });
          configForm.resetFields();
        }}
        onOk={handleSaveTemplateConfig}
        okText="保存配置"
        width={820}
        destroyOnClose
      >
        {currentConfigModule ? (
          <Form form={configForm} layout="vertical" className="sp-config-form">
            {currentConfigModule.configTemplates.map(renderConfigField)}
          </Form>
        ) : null}
      </Modal>
    </div>
  );
}

export default SolutionPrototypeModule;
