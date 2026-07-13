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
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
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

const TAG_OPTIONS = ['AI', '培训', '协作', '证书', '资源沉淀', '知识管理', '日程协同', '任务协同', '活动运营', '问卷反馈'].map((value) => ({
  value,
  label: value,
}));

const PACKAGE_RESOURCE_NOTE_MAP = {
  SPACE: '空间数量上限、是否支持自定义创建场景等空间资源边界已迁移到套餐管理中定义。',
  RESOURCE_LIBRARY: '可用资源类型、单文件上传上限、资料库容量和 AI 解析次数等资料库资源边界已迁移到套餐管理中定义。',
  CALENDAR: '可建日历数量、外部日历同步和提醒发送额度等日程资源边界已迁移到套餐管理中定义。',
  MESSAGE: '可用消息通道、月消息发送量和消息保留天数等消息资源边界已迁移到套餐管理中定义。',
  TASKS: '可建任务数量、任务提醒频率和任务附件容量等任务资源边界已迁移到套餐管理中定义。',
  SEMINAR: '单场人数上限、报名人数上限和月研讨会场次等研讨会资源边界已迁移到套餐管理中定义。',
  SURVEY: '可用题型、月问卷数量和月答卷数量等问卷资源边界已迁移到套餐管理中定义。',
  CERTIFICATE: '可导出格式、证书模板数量和月发放数量等证书资源边界已迁移到套餐管理中定义。',
};

const VIRTUAL_MODULE_KEYS = new Set(['SEMINAR', 'SURVEY', 'CERTIFICATE']);

function getModuleKind(moduleDef) {
  return moduleDef?.moduleKind || (VIRTUAL_MODULE_KEYS.has(moduleDef?.key) ? 'VIRTUAL' : 'MENU');
}

function isMenuModule(moduleDef) {
  return getModuleKind(moduleDef) === 'MENU';
}

function getModuleKindLabel(moduleDef) {
  return isMenuModule(moduleDef) ? '菜单模块' : '虚拟能力';
}

function getMenuOrder(assignment, moduleDef) {
  if (!assignment || !isMenuModule(moduleDef)) return null;
  const rawValue = assignment.menuOrder ?? moduleDef.defaultMenuOrder ?? assignment.sortNo;
  const order = Number(rawValue);
  return Number.isFinite(order) ? order : null;
}

function compareCatalogModules(a, b) {
  const aMenu = isMenuModule(a);
  const bMenu = isMenuModule(b);
  if (aMenu !== bMenu) return aMenu ? -1 : 1;
  if (aMenu && bMenu) {
    return (a.defaultMenuOrder ?? 999) - (b.defaultMenuOrder ?? 999);
  }
  return 0;
}

const MODULE_CATALOG = [
  {
    key: 'SPACE',
    name: '空间模块',
    code: 'SPACE',
    icon: 'space',
    category: '基础承载',
    recommendedRequired: true,
    systemMenuKey: 'space',
    defaultMenuOrder: 10,
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
    systemMenuKey: 'lucky',
    defaultMenuOrder: 30,
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
    systemMenuKey: 'resource-library',
    defaultMenuOrder: 20,
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
    systemMenuKey: 'knowledge-space',
    defaultMenuOrder: 40,
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
    key: 'CALENDAR',
    name: '日历模块',
    code: 'CALENDAR',
    icon: 'calendar',
    category: '日程协同',
    systemMenuKey: 'calendar',
    defaultMenuOrder: 50,
    description: '提供个人、空间和组织维度的日程编排、提醒、冲突检查与协同看板能力。',
    capabilityKeys: ['calendar_schedule'],
    dependsOn: ['MESSAGE'],
    serves: ['研讨会模块', '任务模块', '培训运营'],
    navLabel: '日历',
    deliveryItems: ['日历入口', '日程类型规则', '提醒与冲突检查配置'],
    configTemplates: [
      {
        key: 'event_creation_enabled',
        label: '日程创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许用户在方案内创建日程。',
      },
      {
        key: 'default_calendar_scope',
        label: '默认日历范围',
        type: 'SELECT',
        required: true,
        defaultValue: '空间日历',
        options: ['个人日历', '空间日历', '组织日历'],
        description: '新建日程默认归属的日历范围。',
      },
      {
        key: 'enabled_event_types',
        label: '启用日程类型',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['课程安排', '研讨会', '任务截止'],
        options: ['课程安排', '研讨会', '任务截止', '证书发放', '审批节点', '直播活动'],
        description: '该方案中允许创建和展示的日程类型。',
      },
      {
        key: 'default_reminder_minutes',
        label: '默认提醒提前分钟',
        type: 'NUMBER',
        required: true,
        defaultValue: 30,
        description: '日程开始前默认提前多少分钟提醒参与人。',
      },
      {
        key: 'message_reminder_enabled',
        label: '消息提醒联动',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否将日程提醒同步到消息模块。',
      },
      {
        key: 'conflict_check_enabled',
        label: '冲突检查开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否在创建日程时检查参与人时间冲突。',
      },
      {
        key: 'attendee_visibility',
        label: '参与人可见范围',
        type: 'SELECT',
        required: true,
        defaultValue: '参与人可见',
        options: ['仅创建人可见', '参与人可见', '组织内可见'],
        description: '控制日程参与人信息在方案内的可见范围。',
      },
    ],
  },
  {
    key: 'MESSAGE',
    name: '消息模块',
    code: 'MESSAGE',
    icon: 'message',
    category: '运营触达',
    systemMenuKey: 'messages',
    defaultMenuOrder: 60,
    description: '面向系统通知、Lucky 推送、审批提醒、活动提醒和消息留存的触达能力。',
    capabilityKeys: ['message_touch'],
    serves: ['日历模块', '研讨会模块', '问卷模块', '证书模块'],
    navLabel: '消息',
    deliveryItems: ['消息中心入口', '通知通道配置', '自动提醒规则'],
    configTemplates: [
      {
        key: 'system_notice_enabled',
        label: '系统通知开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否开启系统级通知。',
      },
      {
        key: 'default_touch_strategy',
        label: '默认触达策略',
        type: 'SELECT',
        required: true,
        defaultValue: '站内消息优先',
        options: ['站内消息优先', '多通道同时触达', '失败后外部补发', '仅站内留痕'],
        description: '方案内通知默认采用的触达策略。',
      },
      {
        key: 'reminder_event_types',
        label: '启用提醒类型',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['审批提醒', '活动提醒', '日程提醒'],
        options: ['审批提醒', '活动提醒', '日程提醒', '任务提醒', '证书发放提醒', 'Lucky 建议提醒'],
        description: '允许消息模块自动触发提醒的业务事件。',
      },
      {
        key: 'digest_frequency',
        label: '摘要发送频率',
        type: 'SELECT',
        required: false,
        defaultValue: '每日',
        options: ['关闭', '每日', '每周'],
        description: '未读消息摘要的默认发送频率。',
      },
      {
        key: 'quiet_hours_enabled',
        label: '免打扰时段开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用夜间或休息日免打扰策略。',
      },
      {
        key: 'approval_reminder_enabled',
        label: '审批提醒开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用审批相关提醒。',
      },
      {
        key: 'lucky_push_enabled',
        label: 'Lucky 推送开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否允许 Lucky 主动推送建议和提醒。',
      },
    ],
  },
  {
    key: 'TASKS',
    name: '任务模块',
    code: 'TASKS',
    icon: 'tasks',
    category: '任务协同',
    systemMenuKey: 'tasks',
    defaultMenuOrder: 70,
    description: '提供任务创建、分派、截止提醒、看板跟进和完成证据沉淀能力。',
    capabilityKeys: ['task_management'],
    dependsOn: ['MESSAGE'],
    serves: ['日历模块', '研讨会模块', '培训运营'],
    navLabel: '任务',
    deliveryItems: ['任务中心入口', '任务类型规则', '截止提醒联动'],
    configTemplates: [
      {
        key: 'task_creation_enabled',
        label: '任务创建开关',
        type: 'BOOLEAN',
        required: true,
        defaultValue: true,
        description: '是否允许用户在方案内创建任务。',
      },
      {
        key: 'enabled_task_types',
        label: '启用任务类型',
        type: 'MULTI_SELECT',
        required: true,
        defaultValue: ['学习任务', '运营任务', '协作任务'],
        options: ['学习任务', '运营任务', '协作任务', '审批跟进', '资料补充', '证书发放'],
        description: '该方案中允许创建和展示的任务类型。',
      },
      {
        key: 'default_assignee_scope',
        label: '默认指派范围',
        type: 'SELECT',
        required: true,
        defaultValue: '空间成员',
        options: ['本人', '空间成员', '组织成员', '指定角色'],
        description: '创建任务时默认可指派的人群范围。',
      },
      {
        key: 'due_reminder_enabled',
        label: '截止提醒开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否在任务截止前通过消息模块提醒责任人。',
      },
      {
        key: 'calendar_binding_enabled',
        label: '日历联动开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否将任务截止时间同步到日历模块。',
      },
      {
        key: 'completion_evidence_required',
        label: '完成证据必填',
        type: 'BOOLEAN',
        required: false,
        defaultValue: false,
        description: '任务完成时是否必须上传说明、链接或附件作为证据。',
      },
      {
        key: 'kanban_view_enabled',
        label: '看板视图开关',
        type: 'BOOLEAN',
        required: false,
        defaultValue: true,
        description: '是否启用按状态拖拽流转的任务看板。',
      },
    ],
  },
  {
    key: 'SEMINAR',
    name: '研讨会模块',
    code: 'SEMINAR',
    icon: 'seminar',
    category: '活动协作',
    moduleKind: 'VIRTUAL',
    description: '支持研讨会创建、报名、协作工具、过程资料和成果沉淀。',
    capabilityKeys: ['seminar_operation'],
    navLabel: '研讨会',
    deliveryItems: ['研讨会能力配置', '报名和参与规则', '活动资料归档'],
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
    moduleKind: 'VIRTUAL',
    description: '用于满意度、过程反馈、测评问卷和结果导出的轻量采集能力。',
    capabilityKeys: ['survey_feedback'],
    navLabel: '问卷',
    deliveryItems: ['问卷能力配置', '题型范围', '结果导出配置'],
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
    moduleKind: 'VIRTUAL',
    description: '支持证书模板、编号规则、发放、导出、审批与归档。',
    capabilityKeys: ['certificate_issue'],
    dependsOnAny: ['SURVEY', 'SEMINAR'],
    navLabel: '证书',
    deliveryItems: ['证书能力配置', '发放批次能力', '证书资料归档'],
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
  const menuOrder = isMenuModule(moduleDef) ? (moduleDef.defaultMenuOrder ?? sortNo * 10) : null;
  return {
    id: `${moduleDef.key.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    moduleKey: moduleDef.key,
    required: Boolean(moduleDef.recommendedRequired),
    enabled: true,
    sortNo,
    menuOrder,
    deployStatus: 'CONFIGURING',
    configs: buildConfigs(moduleDef),
    remark: '',
  };
}

function buildInitialSolutions() {
  const findModule = (key) => MODULE_CATALOG.find((item) => item.key === key);
  const trainingModules = ['SPACE', 'RESOURCE_LIBRARY', 'LUCKY', 'CALENDAR', 'MESSAGE', 'TASKS', 'SEMINAR', 'SURVEY', 'CERTIFICATE']
    .map((key, index) => createModuleAssignment(findModule(key), index + 1));
  const researchModules = ['SPACE', 'RESOURCE_LIBRARY', 'KNOWLEDGE_SPACE', 'CALENDAR', 'MESSAGE', 'TASKS']
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
      tags: ['AI', '培训', '证书', '日程协同', '任务协同', '资源沉淀'],
      description: '面向教师数字素养提升项目，提供空间、资料、日程、任务、研讨、反馈与证书发放的一体化运营方案。',
      updatedAt: '2026-07-10 16:20',
      enabledCapabilities: ['space_operation', 'lucky_agent', 'resource_deposit', 'calendar_schedule', 'message_touch', 'task_management', 'seminar_operation', 'survey_feedback', 'certificate_issue'],
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
      tags: ['协作', '知识管理', '日程协同', '任务协同', '资源沉淀'],
      description: '用于跨校教研议题共创、资料沉淀、知识空间建设、日程任务协同和过程消息触达。',
      updatedAt: '2026-07-08 09:45',
      enabledCapabilities: ['space_operation', 'resource_deposit', 'knowledge_navigation', 'calendar_schedule', 'message_touch', 'task_management'],
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
    calendar: <CalendarOutlined />,
    message: <MessageOutlined />,
    tasks: <CheckSquareOutlined />,
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
  const menuAssignments = [];

  solution.modules.forEach((assignment) => {
    const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
    if (!moduleDef || !assignment.enabled) return;
    if (isMenuModule(moduleDef)) {
      menuAssignments.push({ assignment, moduleDef });
    }
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

  const menuMissing = menuAssignments.filter(({ assignment, moduleDef }) => getMenuOrder(assignment, moduleDef) == null);
  const menuOrderCounts = menuAssignments.reduce((acc, { assignment, moduleDef }) => {
    const order = getMenuOrder(assignment, moduleDef);
    if (order != null) acc.set(order, (acc.get(order) || 0) + 1);
    return acc;
  }, new Map());
  const duplicateMenuOrders = Array.from(menuOrderCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([order]) => order);

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
    {
      key: 'menu',
      title: '菜单模块位置已配置',
      passed: menuMissing.length === 0 && duplicateMenuOrders.length === 0,
      detail: menuMissing.length
        ? `缺少菜单位置：${menuMissing.map(({ moduleDef }) => moduleDef.name).join('、')}`
        : duplicateMenuOrders.length
          ? `菜单位置重复：${duplicateMenuOrders.join('、')}`
          : '菜单模块均已配置系统菜单位置，虚拟能力不参与菜单注册。',
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
    if (!selectedSolution) return [];
    const menuAssignments = [];
    const virtualAssignments = [];
    selectedSolution.modules.forEach((assignment) => {
      const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
      if (isMenuModule(moduleDef)) {
        menuAssignments.push(assignment);
      } else {
        virtualAssignments.push(assignment);
      }
    });
    menuAssignments.sort((a, b) => {
      const aModule = moduleCatalog.find((item) => item.key === a.moduleKey);
      const bModule = moduleCatalog.find((item) => item.key === b.moduleKey);
      return (getMenuOrder(a, aModule) ?? 0) - (getMenuOrder(b, bModule) ?? 0)
        || (a.sortNo || 0) - (b.sortNo || 0);
    });
    virtualAssignments.sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0));
    return [...menuAssignments, ...virtualAssignments];
  }, [moduleCatalog, selectedSolution]);

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
    const additions = [...moduleCatalog]
      .sort(compareCatalogModules)
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
      const sorted = solution.modules
        .filter((assignment) => {
          const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
          return isMenuModule(moduleDef);
        })
        .sort((a, b) => {
          const aModule = moduleCatalog.find((item) => item.key === a.moduleKey);
          const bModule = moduleCatalog.find((item) => item.key === b.moduleKey);
          return (getMenuOrder(a, aModule) ?? 0) - (getMenuOrder(b, bModule) ?? 0)
            || (a.sortNo || 0) - (b.sortNo || 0);
        });
      const currentIndex = sorted.findIndex((item) => item.id === assignmentId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
        return { modules: solution.modules };
      }
      const current = sorted[currentIndex];
      const next = sorted[nextIndex];
      const currentModule = moduleCatalog.find((item) => item.key === current.moduleKey);
      const nextModule = moduleCatalog.find((item) => item.key === next.moduleKey);
      const currentMenuOrder = getMenuOrder(current, currentModule);
      const nextMenuOrder = getMenuOrder(next, nextModule);
      return {
        modules: solution.modules.map((item) => {
          if (item.id === current.id) return { ...item, menuOrder: nextMenuOrder };
          if (item.id === next.id) return { ...item, menuOrder: currentMenuOrder };
          return item;
        }),
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
    const selectedMenuAssignments = selectedSortedModules.filter((assignment) => {
      const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
      return isMenuModule(moduleDef);
    });
    const previewMenuModules = selectedMenuAssignments
      .filter((item) => item.enabled)
      .map((assignment) => ({
        assignment,
        moduleDef: moduleCatalog.find((moduleDef) => moduleDef.key === assignment.moduleKey),
      }))
      .filter((item) => item.moduleDef);
    const previewVirtualModules = selectedSortedModules
      .filter((item) => item.enabled)
      .map((assignment) => ({
        assignment,
        moduleDef: moduleCatalog.find((moduleDef) => moduleDef.key === assignment.moduleKey),
      }))
      .filter((item) => item.moduleDef && !isMenuModule(item.moduleDef));
    const previewCapabilityModules = selectedSortedModules
      .filter((item) => item.enabled)
      .map((assignment) => ({
        assignment,
        moduleDef: moduleCatalog.find((moduleDef) => moduleDef.key === assignment.moduleKey),
      }))
      .filter((item) => item.moduleDef);

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
                <div className="sp-section-subtitle">菜单模块配置系统菜单位置，虚拟能力只维护方案能力与业务配置。</div>
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
                  <div className="sp-config-sidebar-title">菜单排序与虚拟能力</div>
                  {selectedSortedModules.map((assignment) => {
                    const moduleDef = moduleCatalog.find((item) => item.key === assignment.moduleKey);
                    if (!moduleDef) return null;
                    const configStatus = getModuleConfigStatus(assignment, moduleDef);
                    const isActive = activeConfigAssignment?.id === assignment.id;
                    const isMenu = isMenuModule(moduleDef);
                    const menuIndex = selectedMenuAssignments.findIndex((item) => item.id === assignment.id);
                    const menuOrder = getMenuOrder(assignment, moduleDef);
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
                            <small>
                              {getModuleKindLabel(moduleDef)} · {configStatus.percent}% 完成 · {assignment.required ? '必选' : '可选'}
                            </small>
                            <em>{isMenu ? `菜单位置 ${menuOrder ?? '-'}` : '不注册系统菜单'}</em>
                          </span>
                          <span className="sp-module-order-actions" onClick={(event) => event.stopPropagation()}>
                            {isMenu ? (
                              <>
                                <Tooltip title="菜单位置上移">
                                  <Button
                                    size="small"
                                    icon={<ArrowUpOutlined />}
                                    disabled={menuIndex === 0}
                                    onClick={() => handleMoveModule(assignment.id, 'up')}
                                  />
                                </Tooltip>
                                <Tooltip title="菜单位置下移">
                                  <Button
                                    size="small"
                                    icon={<ArrowDownOutlined />}
                                    disabled={menuIndex === selectedMenuAssignments.length - 1}
                                    onClick={() => handleMoveModule(assignment.id, 'down')}
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="虚拟能力不参与系统菜单排序">
                                <span className="sp-module-order-placeholder">虚拟</span>
                              </Tooltip>
                            )}
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
                            <Tag color={isMenuModule(activeConfigModule) ? 'cyan' : 'purple'}>
                              {getModuleKindLabel(activeConfigModule)}
                            </Tag>
                            {isMenuModule(activeConfigModule) ? (
                              <Tag color="blue">菜单位置 {getMenuOrder(activeConfigAssignment, activeConfigModule) ?? '-'}</Tag>
                            ) : (
                              <Tag>不注册菜单</Tag>
                            )}
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

                      {isMenuModule(activeConfigModule) ? (
                        <div className="sp-menu-config-strip">
                          <label>
                            <span>系统菜单位置</span>
                            <InputNumber
                              min={1}
                              value={getMenuOrder(activeConfigAssignment, activeConfigModule)}
                              onChange={(value) => handleChangeModule(activeConfigAssignment.id, { menuOrder: value })}
                              style={{ width: '100%' }}
                            />
                          </label>
                          <label>
                            <span>系统菜单 Key</span>
                            <Input value={activeConfigModule.systemMenuKey || activeConfigModule.key.toLowerCase()} readOnly />
                          </label>
                          <div>
                            菜单模块会注册到系统菜单，位置数字越小越靠前；左侧上移/下移会调整这个位置。
                          </div>
                        </div>
                      ) : (
                        <Alert
                          type="warning"
                          showIcon
                          className="sp-module-kind-note"
                          message="虚拟能力模块"
                          description="不注册到系统菜单，不参与菜单排序；在方案中作为研讨、反馈、证书等业务能力被其他菜单模块调用。"
                        />
                      )}

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
                {previewMenuModules.map(({ assignment, moduleDef }) => (
                  <div key={assignment.id} className="sp-preview-nav-item">
                    <ModuleIcon type={moduleDef.icon} />
                    <span>{moduleDef.navLabel}</span>
                    <small>#{getMenuOrder(assignment, moduleDef) ?? '-'}</small>
                  </div>
                ))}
              </div>
              {previewVirtualModules.length ? (
                <>
                  <div className="sp-preview-virtual-title">虚拟能力模块</div>
                  <div className="sp-preview-virtual-list">
                    {previewVirtualModules.map(({ assignment, moduleDef }) => (
                      <Tag key={assignment.id} color="purple">{moduleDef.name}</Tag>
                    ))}
                  </div>
                </>
              ) : null}
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
                {previewCapabilityModules.flatMap(({ moduleDef }) => moduleDef.deliveryItems.map((delivery) => (
                  <div key={`${moduleDef.key}-${delivery}`} className="sp-delivery-item">
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
    ? [...moduleCatalog]
        .sort(compareCatalogModules)
        .filter((item) => !selectedSolution.modules.some((moduleItem) => moduleItem.moduleKey === item.key))
    : [];

  return (
    <div className="solution-prototype-module">
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
                  {[...moduleCatalog].sort(compareCatalogModules).map((moduleDef) => (
                    <div key={moduleDef.key} className="sp-catalog-card">
                      <div className="sp-catalog-head">
                        <Avatar className="sp-module-avatar" shape="square" icon={<ModuleIcon type={moduleDef.icon} />} />
                        <div>
                          <div className="sp-catalog-title">{moduleDef.name}</div>
                          <div className="sp-module-meta">{moduleDef.code} · {moduleDef.category}</div>
                          <div className="sp-catalog-kind-row">
                            <Tag color={isMenuModule(moduleDef) ? 'cyan' : 'purple'}>{getModuleKindLabel(moduleDef)}</Tag>
                            {isMenuModule(moduleDef) ? (
                              <Tag>菜单位置 {moduleDef.defaultMenuOrder ?? '-'}</Tag>
                            ) : (
                              <Tag>不注册菜单</Tag>
                            )}
                          </div>
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
        width={680}
        className="sp-create-solution-modal"
        destroyOnClose
      >
        <Form form={solutionForm} layout="vertical" className="sp-create-form" initialValues={{ status: 'DRAFT', version: 'v1.0', targetUsers: [], tags: [] }}>
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
              <TextArea rows={2} placeholder="描述该方案的适用范围和交付目标" />
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
                  <div className="sp-catalog-kind-row">
                    <Tag color={isMenuModule(moduleDef) ? 'cyan' : 'purple'}>{getModuleKindLabel(moduleDef)}</Tag>
                    {isMenuModule(moduleDef) ? (
                      <Tag>菜单位置 {moduleDef.defaultMenuOrder ?? '-'}</Tag>
                    ) : (
                      <Tag>不注册菜单</Tag>
                    )}
                  </div>
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
