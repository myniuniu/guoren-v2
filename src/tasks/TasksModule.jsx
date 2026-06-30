import { useEffect, useMemo, useRef, useState } from 'react';
import { Drawer } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellFilled,
  CalendarOutlined,
  CaretDownFilled,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CommentOutlined,
  DollarOutlined,
  EllipsisOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FieldNumberOutlined,
  FileTextOutlined,
  FilterOutlined,
  FlagOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  HolderOutlined,
  LinkOutlined,
  MoreOutlined,
  PartitionOutlined,
  PlusOutlined,
  RightOutlined,
  SettingOutlined,
  ShareAltOutlined,
  StarOutlined,
  SwapOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './TasksModule.css';

const CURRENT_USER_ID = 'zhang';

const MEMBER_MAP = {
  zhang: {
    id: 'zhang',
    name: '张洪磊',
    shortName: '磊',
    accent: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
  },
  yang: {
    id: 'yang',
    name: '杨金钰',
    shortName: '钰',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },
  xu: {
    id: 'xu',
    name: '徐子安',
    shortName: '安',
    accent: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
  },
  system: {
    id: 'system',
    name: '系统',
    shortName: '系',
    accent: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
};

const VIEW_OPTIONS = [
  { key: 'table', label: '图列表', icon: <UnorderedListOutlined /> },
  { key: 'board', label: '看板', icon: <AppstoreOutlined /> },
  { key: 'timeline', label: '甘特图', icon: <CalendarOutlined /> },
  { key: 'dashboard', label: '仪表盘', icon: <BarChartOutlined /> },
  { key: 'activity', label: '动态', icon: <ClockCircleOutlined /> },
];

const TOOLBAR_FILTERS = [
  { key: 'all', label: '全部任务', icon: <EyeOutlined /> },
  { key: 'filter', label: '筛选', icon: <FilterOutlined /> },
  { key: 'sort', label: '排序: 拖拽自定义', icon: <SwapOutlined /> },
  { key: 'group', label: '分组: 自定义分组', icon: <PartitionOutlined /> },
  { key: 'fields', label: '字段配置', icon: <SettingOutlined /> },
];

const FIELD_TYPE_ICON_MAP = {
  single: CheckCircleOutlined,
  multi: UnorderedListOutlined,
  member: UserOutlined,
  number: FieldNumberOutlined,
  date: CalendarOutlined,
  text: FontSizeOutlined,
  survey: FileTextOutlined,
  priority: FlagOutlined,
  price: DollarOutlined,
  risk: BellFilled,
  cost: DollarOutlined,
  progress: BarChartOutlined,
};

const DEFAULT_FIELD_ITEMS = [
  { id: 'owner', label: '负责人', type: 'member', visible: true, width: 'minmax(126px, 0.95fr)' },
  { id: 'startDate', label: '开始时间', type: 'date', visible: true, width: 'minmax(120px, 0.9fr)' },
  { id: 'dueDate', label: '截止时间', type: 'date', visible: true, width: 'minmax(120px, 0.9fr)' },
  { id: 'subtaskProgress', label: '子任务进度', type: 'progress', visible: false, width: 'minmax(150px, 1fr)' },
  { id: 'listName', label: '所属清单', type: 'single', visible: false, width: 'minmax(132px, 0.98fr)' },
  { id: 'source', label: '任务来源', type: 'text', visible: false, width: 'minmax(148px, 1.08fr)' },
  { id: 'creator', label: '创建人', type: 'member', visible: true, width: 'minmax(130px, 0.95fr)' },
  { id: 'assigner', label: '分配人', type: 'member', visible: false, width: 'minmax(130px, 0.95fr)' },
  { id: 'followers', label: '关注人', type: 'member', visible: false, width: 'minmax(130px, 0.95fr)' },
  { id: 'createdAt', label: '创建时间', type: 'date', visible: false, width: 'minmax(120px, 0.9fr)' },
  { id: 'completedAt', label: '完成时间', type: 'date', visible: false, width: 'minmax(120px, 0.9fr)' },
  { id: 'updatedAt', label: '更新时间', type: 'text', visible: false, width: 'minmax(130px, 0.95fr)' },
  { id: 'taskId', label: '任务 ID', type: 'text', visible: false, width: 'minmax(120px, 0.9fr)' },
  { id: 'sourceCategory', label: '来源类别', type: 'single', visible: false, width: 'minmax(126px, 0.95fr)' },
];

const CUSTOM_FIELD_TEMPLATE_SECTIONS = [
  {
    key: 'basic',
    label: '基础字段',
    items: [
      { key: 'single', label: '单选', type: 'single', width: 'minmax(132px, 0.98fr)', icon: CheckCircleOutlined },
      { key: 'multi', label: '多选', type: 'multi', width: 'minmax(170px, 1.18fr)', icon: UnorderedListOutlined },
      { key: 'member', label: '人员', type: 'member', width: 'minmax(130px, 0.95fr)', icon: UserOutlined },
      { key: 'number', label: '数值', type: 'number', width: 'minmax(118px, 0.85fr)', icon: FieldNumberOutlined },
      { key: 'date', label: '日期', type: 'date', width: 'minmax(120px, 0.9fr)', icon: CalendarOutlined },
      { key: 'text', label: '文本', type: 'text', width: 'minmax(180px, 1.2fr)', icon: FontSizeOutlined },
    ],
  },
  {
    key: 'form-app',
    label: '表单应用',
    items: [
      { key: 'survey', label: '问卷', type: 'survey', width: 'minmax(188px, 1.15fr)', icon: FileTextOutlined },
    ],
  },
  {
    key: 'recommend',
    label: '推荐字段',
    items: [
      { key: 'priority', label: '优先级', type: 'priority', width: 'minmax(108px, 0.8fr)', icon: FlagOutlined },
      { key: 'price', label: '价格', type: 'price', width: 'minmax(120px, 0.85fr)', icon: DollarOutlined },
      { key: 'risk', label: '风险级', type: 'risk', width: 'minmax(118px, 0.85fr)', icon: BellFilled },
      { key: 'cost', label: '成本', type: 'cost', width: 'minmax(120px, 0.85fr)', icon: DollarOutlined },
    ],
  },
];

const BASIC_FIELD_TEMPLATES = CUSTOM_FIELD_TEMPLATE_SECTIONS.find((section) => section.key === 'basic')?.items || [];
const FORM_APP_FIELD_TEMPLATES = CUSTOM_FIELD_TEMPLATE_SECTIONS.find((section) => section.key === 'form-app')?.items || [];
const CREATOR_FIELD_TEMPLATES = [...BASIC_FIELD_TEMPLATES, ...FORM_APP_FIELD_TEMPLATES];

const DATE_FORMAT_OPTIONS = [
  { value: 'iso', label: '2023-01-30' },
  { value: 'slash', label: '2023/01/30' },
  { value: 'cn', label: '2023年1月30日' },
  { value: 'monthDay', label: '01-30' },
];

const SURVEY_LIBRARY = {
  'task-module-ux': {
    id: 'task-module-ux',
    shortLabel: '字段体验',
    title: '任务模块字段体验问卷',
    description: '收集团队对问卷字段、抽屉预览和任务协同效率的反馈，帮助后续迭代任务模块的自定义字段能力。',
    status: '收集中',
    audience: '产品 / 设计 / 前端',
    responseCount: 18,
    updatedAt: '今天 11:20',
    questions: [
      {
        id: 'task-module-ux-q1',
        type: 'single',
        title: '你最常在任务列表里优先查看哪类字段？',
        options: ['负责人', '截止时间', '风险状态', '问卷反馈'],
      },
      {
        id: 'task-module-ux-q2',
        type: 'multi',
        title: '你希望问卷字段默认展示哪些摘要信息？',
        options: ['问卷标题', '答卷数量', '最近更新时间', '状态标签'],
      },
      {
        id: 'task-module-ux-q3',
        type: 'text',
        title: '还有哪些任务场景适合挂载问卷字段？',
      },
    ],
  },
  'workshop-precheck': {
    id: 'workshop-precheck',
    shortLabel: '会前调研',
    title: '研讨会会前准备调研问卷',
    description: '面向参会成员收集议题关注点、设备准备情况和共创需求，便于会前完成分工与材料补齐。',
    status: '已发布',
    audience: '参会成员',
    responseCount: 32,
    updatedAt: '昨天 18:42',
    questions: [
      {
        id: 'workshop-precheck-q1',
        type: 'single',
        title: '本次研讨你最关注的主题是？',
        options: ['版本规划', '交互体验', '交付风险', '协作机制'],
      },
      {
        id: 'workshop-precheck-q2',
        type: 'multi',
        title: '你希望会前补充哪些资料？',
        options: ['当前原型截图', '里程碑排期', '已知问题清单', '竞争产品参考'],
      },
      {
        id: 'workshop-precheck-q3',
        type: 'rating',
        title: '你对当前研讨会准备充分度的评分是？',
        scoreHint: '1 分表示准备不足，5 分表示准备充分',
      },
    ],
  },
};

const TASK_GROUPS = [
  {
    key: 'default',
    name: '默认分组',
    tasks: [],
  },
  {
    key: 'low-code',
    name: '低代码',
    tasks: [
      {
        id: 'low-code-1',
        title: '秒答参考用户体验',
        ownerId: null,
        creatorId: 'zhang',
        status: 'planning',
        metaCount: 1,
        metaType: 'comment',
        timelineStart: 20,
        timelineEnd: 24,
        surveyId: 'task-module-ux',
      },
      {
        id: 'low-code-2',
        title: 'OpenHands + GLM-5.1代码生成智能体',
        ownerId: null,
        creatorId: 'zhang',
        status: 'active',
        metaCount: 1,
        metaType: 'comment',
        timelineStart: 21,
        timelineEnd: 27,
      },
      {
        id: 'low-code-3',
        title: 'git + oss + ...流水线：自动化部署',
        ownerId: null,
        creatorId: 'zhang',
        status: 'planning',
        metaCount: 0,
        metaType: 'comment',
        timelineStart: 22,
        timelineEnd: 29,
      },
    ],
  },
  {
    key: 'h5',
    name: 'H5/小程序',
    tasks: [
      {
        id: 'h5-1',
        title: 'lucky',
        ownerId: 'yang',
        creatorId: 'zhang',
        status: 'active',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 18,
        timelineEnd: 25,
      },
      {
        id: 'h5-2',
        title: 'IM',
        ownerId: 'yang',
        creatorId: 'zhang',
        status: 'planning',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 19,
        timelineEnd: 26,
      },
      {
        id: 'h5-3',
        title: '研讨会',
        ownerId: 'yang',
        creatorId: 'zhang',
        status: 'risk',
        metaCount: 1,
        metaType: 'comment',
        dueLabel: '6月23日',
        timelineStart: 20,
        timelineEnd: 23,
        surveyId: 'workshop-precheck',
      },
      {
        id: 'h5-4',
        title: '日历',
        ownerId: 'yang',
        creatorId: 'zhang',
        status: 'active',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 22,
        timelineEnd: 28,
      },
      {
        id: 'h5-5',
        title: '任务',
        ownerId: 'yang',
        creatorId: 'zhang',
        status: 'active',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 24,
        timelineEnd: 30,
        surveyId: 'task-module-ux',
      },
    ],
  },
  {
    key: 'resource',
    name: '资料库',
    tasks: [
      {
        id: 'resource-1',
        title: 'macOS风格',
        ownerId: null,
        creatorId: 'zhang',
        status: 'done',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 17,
        timelineEnd: 21,
      },
      {
        id: 'resource-2',
        title: '移动到',
        ownerId: null,
        creatorId: 'zhang',
        status: 'planning',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 21,
        timelineEnd: 24,
      },
      {
        id: 'resource-3',
        title: '复制到',
        ownerId: null,
        creatorId: 'zhang',
        status: 'done',
        metaCount: 0,
        metaType: 'link',
        timelineStart: 23,
        timelineEnd: 25,
      },
    ],
  },
  {
    key: 'app-management',
    name: '应用管理',
    tasks: [],
  },
];

const ACTIVITY_ITEMS = [
  {
    id: 'activity-1',
    actorId: 'zhang',
    action: '创建了任务',
    target: 'git + oss + ...流水线：自动化部署',
    detail: '已放入 低代码 分组',
    time: '10分钟前',
  },
  {
    id: 'activity-2',
    actorId: 'yang',
    action: '更新了截止时间',
    target: '研讨会',
    detail: '截止时间调整为 6月23日',
    time: '38分钟前',
  },
  {
    id: 'activity-3',
    actorId: 'zhang',
    action: '完成了任务',
    target: 'macOS风格',
    detail: '资料库 分组状态已同步',
    time: '今天 09:26',
  },
  {
    id: 'activity-4',
    actorId: 'system',
    action: '自动保存了视图配置',
    target: '果仁6.30',
    detail: '分组方式保持为自定义分组',
    time: '今天 08:54',
  },
];

const TIMELINE_DAYS = Array.from({ length: 14 }, (_, index) => 17 + index);

const STATUS_META = {
  planning: {
    label: '待排期',
    tone: '#94a3b8',
    surface: '#f8fafc',
    border: '#e2e8f0',
  },
  active: {
    label: '进行中',
    tone: '#2563eb',
    surface: '#eff6ff',
    border: '#bfdbfe',
  },
  risk: {
    label: '风险',
    tone: '#dc2626',
    surface: '#fef2f2',
    border: '#fecaca',
  },
  done: {
    label: '已完成',
    tone: '#059669',
    surface: '#ecfdf5',
    border: '#a7f3d0',
  },
};

const QUESTION_TYPE_LABELS = {
  single: '单选题',
  multi: '多选题',
  text: '问答题',
  rating: '评分题',
};

function formatMonthDay(day) {
  if (!Number.isFinite(day) || day <= 0) return '';
  return `6月${day}日`;
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString('zh-CN')}`;
}

function getMember(memberId) {
  return memberId ? MEMBER_MAP[memberId] || null : null;
}

function renderAvatar(memberId, className = '') {
  const member = getMember(memberId);
  if (!member) {
    return (
      <span className={`tasks-avatar tasks-avatar-placeholder ${className}`.trim()} aria-hidden="true">
        <UserOutlined />
      </span>
    );
  }

  return (
    <span className={`tasks-avatar ${className}`.trim()} style={{ background: member.accent }} aria-hidden="true">
      {member.shortName}
    </span>
  );
}

function renderMemberChip(memberId) {
  const member = getMember(memberId);
  if (!member) {
    return (
      <span className="tasks-cell-placeholder" aria-label="未分配">
        <UserOutlined />
      </span>
    );
  }

  return (
    <span className="tasks-member-chip">
      {renderAvatar(memberId)}
      <span className="tasks-member-name">{member.name}</span>
    </span>
  );
}

function renderDateCell(dateLabel, emphasize = false) {
  if (!dateLabel) {
    return (
      <span className="tasks-cell-placeholder" aria-label="未设置时间">
        <CalendarOutlined />
      </span>
    );
  }

  return (
    <span className={`tasks-date-pill ${emphasize ? 'is-alert' : ''}`}>
      <span>{dateLabel}</span>
      {emphasize ? <BellFilled /> : null}
    </span>
  );
}

function renderTaskMetric(task) {
  if (!task.metaCount) return null;

  return (
    <span className="tasks-task-metric">
      {task.metaType === 'link' ? <LinkOutlined /> : <CommentOutlined />}
      <span>{task.metaCount}</span>
    </span>
  );
}

function buildAllTasks(groups) {
  return groups.flatMap((group) => (
    group.tasks.map((task) => ({
      ...task,
      groupKey: group.key,
      groupName: group.name,
    }))
  ));
}

function buildStatusBuckets(tasks) {
  return [
    { key: 'planning', label: '待排期', items: tasks.filter((task) => task.status === 'planning') },
    { key: 'active', label: '进行中', items: tasks.filter((task) => task.status === 'active') },
    { key: 'risk', label: '风险', items: tasks.filter((task) => task.status === 'risk') },
    { key: 'done', label: '已完成', items: tasks.filter((task) => task.status === 'done') },
  ];
}

function buildUniqueFieldLabel(baseLabel, fields) {
  const existingLabels = new Set(fields.map((field) => field.label));
  if (!existingLabels.has(baseLabel)) return baseLabel;

  let index = 2;
  while (existingLabels.has(`${baseLabel}${index}`)) {
    index += 1;
  }
  return `${baseLabel}${index}`;
}

function buildCustomField(template, fields, overrides = {}) {
  return {
    id: `custom-${template.key}-${fields.length + 1}`,
    label: overrides.label || buildUniqueFieldLabel(template.label, fields),
    type: template.type,
    visible: true,
    width: template.width,
    custom: true,
    config: overrides.config || {},
  };
}

function getSurvey(task) {
  if (!task?.surveyId) return null;
  return SURVEY_LIBRARY[task.surveyId] || null;
}

function getBasicFieldTemplate(templateKey) {
  return CREATOR_FIELD_TEMPLATES.find((item) => item.key === templateKey) || CREATOR_FIELD_TEMPLATES[0] || null;
}

function formatPresetDate(day, preset = 'iso') {
  if (!Number.isFinite(day) || day <= 0) return '';
  const month = 6;
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  switch (preset) {
    case 'slash':
      return `2023/${paddedMonth}/${paddedDay}`;
    case 'cn':
      return `2023年${month}月${day}日`;
    case 'monthDay':
      return `${paddedMonth}-${paddedDay}`;
    case 'iso':
    default:
      return `2023-${paddedMonth}-${paddedDay}`;
  }
}

function getTaskStartLabel(task) {
  return task.startLabel || formatMonthDay(task.timelineStart);
}

function getTaskDueLabel(task) {
  return task.dueLabel || formatMonthDay(task.timelineEnd);
}

function getTaskCreatedLabel(task) {
  return formatMonthDay(Math.max(1, (task.timelineStart || 18) - 2));
}

function getTaskCompletedLabel(task) {
  return task.status === 'done' ? formatMonthDay(task.timelineEnd) : '';
}

function getTaskUpdatedLabel(task) {
  if (task.status === 'done') return '今天 09:26';
  if (task.status === 'risk') return '今天 11:08';
  if (task.status === 'active') return formatMonthDay(Math.max(1, (task.timelineEnd || 24) - 1));
  return formatMonthDay(Math.max(1, (task.timelineStart || 18) - 1));
}

function getTaskFollowerId(task) {
  if (task.ownerId === 'yang') return 'xu';
  if (task.creatorId === 'zhang') return 'yang';
  return 'zhang';
}

function getTaskProgress(task) {
  if (task.status === 'done') return 100;
  if (task.status === 'risk') return 38;
  if (task.status === 'active') return 68;
  return 16;
}

function getTaskSingleValue(task) {
  return STATUS_META[task.status]?.label || '未设置';
}

function getTaskMultiValue(task) {
  return [task.groupName, task.metaCount ? '协作' : '常规'];
}

function getTaskNumberValue(task) {
  const duration = Math.max(1, (task.timelineEnd || 0) - (task.timelineStart || 0) + 1);
  return String(duration * 3 + task.metaCount);
}

function getTaskTextValue(task) {
  return `${task.groupName} · ${STATUS_META[task.status]?.label || '未设置'}`;
}

function getTaskPriority(task) {
  if (task.status === 'risk') return 'P0';
  if (task.status === 'active') return 'P1';
  if (task.status === 'planning') return 'P2';
  return 'P3';
}

function getTaskRiskLevel(task) {
  if (task.status === 'risk') return '高风险';
  if (task.status === 'active') return '中风险';
  if (task.status === 'planning') return '低风险';
  return '已关闭';
}

function getTaskPrice(task) {
  const duration = Math.max(1, (task.timelineEnd || 0) - (task.timelineStart || 0) + 1);
  return formatCurrency(duration * 780 + task.metaCount * 180);
}

function getTaskCost(task) {
  const duration = Math.max(1, (task.timelineEnd || 0) - (task.timelineStart || 0) + 1);
  return formatCurrency(duration * 420 + task.metaCount * 120);
}

function getFieldIconComponent(field) {
  return FIELD_TYPE_ICON_MAP[field.type] || AppstoreOutlined;
}

export default function TasksModule() {
  const [activeView, setActiveView] = useState('table');
  const [selectedListKey, setSelectedListKey] = useState('guoren-630');
  const [collapsedGroups, setCollapsedGroups] = useState({
    default: false,
    'low-code': false,
    h5: false,
    resource: false,
    'app-management': true,
  });
  const [fieldItems, setFieldItems] = useState(DEFAULT_FIELD_ITEMS);
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [customFieldMenuOpen, setCustomFieldMenuOpen] = useState(false);
  const [fieldCreatorOpen, setFieldCreatorOpen] = useState(false);
  const [fieldCreatorTab, setFieldCreatorTab] = useState('new');
  const [fieldCreatorTypeKey, setFieldCreatorTypeKey] = useState(CREATOR_FIELD_TEMPLATES[0]?.key || 'single');
  const [fieldCreatorTitle, setFieldCreatorTitle] = useState('');
  const [fieldCreatorDateFormat, setFieldCreatorDateFormat] = useState(DATE_FORMAT_OPTIONS[0]?.value || 'iso');
  const [selectedSurveyTask, setSelectedSurveyTask] = useState(null);
  const fieldConfigRef = useRef(null);

  const allTasks = useMemo(() => buildAllTasks(TASK_GROUPS), []);
  const statusBuckets = useMemo(() => buildStatusBuckets(allTasks), [allTasks]);
  const visibleFields = useMemo(() => fieldItems.filter((field) => field.visible), [fieldItems]);
  const createdCustomFields = useMemo(() => fieldItems.filter((field) => field.custom), [fieldItems]);
  const selectedSurvey = selectedSurveyTask ? getSurvey(selectedSurveyTask) : null;
  const fieldCreatorType = getBasicFieldTemplate(fieldCreatorTypeKey);
  const taskTotal = allTasks.length;
  const overdueCount = allTasks.filter((task) => task.status === 'risk').length;
  const doneCount = allTasks.filter((task) => task.status === 'done').length;
  const activeOwnerCount = new Set(allTasks.map((task) => task.ownerId).filter(Boolean)).size;
  const activeGroupCount = TASK_GROUPS.filter((group) => group.tasks.length > 0).length;

  const quickLinks = [
    { key: 'all', label: '全部任务' },
    { key: 'created', label: '我创建的' },
    { key: 'assigned', label: '我分配的' },
    { key: 'done', label: '已完成' },
  ];

  const listItems = [
    { key: '111', label: '111' },
    { key: 'guoren-630', label: '果仁6.30' },
    { key: 'scene-training', label: '场景-培训项目' },
    { key: 'mvp', label: '果仁-mvp版本（3.31）' },
    { key: 'general-ai', label: '果仁-人工智能通识培...' },
    { key: 'guoren-530', label: '果仁（5.30）' },
    { key: 'study-club', label: '果仁-研习社-飞行社（...' },
    { key: 'class-eval', label: '课堂评价（AI）' },
    { key: 'candidate', label: '果仁-候选功能' },
  ];

  const activeListLabel = listItems.find((item) => item.key === selectedListKey)?.label || '果仁6.30';
  const hasVisibleSurveyField = visibleFields.some((field) => field.type === 'survey');
  const canCreateField = fieldCreatorTitle.trim().length > 0 && Boolean(fieldCreatorType);

  const dashboardCards = [
    {
      key: 'tasks',
      label: '任务总数',
      value: taskTotal,
      hint: '当前清单内的有效任务项',
    },
    {
      key: 'groups',
      label: '分组数量',
      value: activeGroupCount,
      hint: '含有任务内容的自定义分组',
    },
    {
      key: 'owners',
      label: '负责人',
      value: activeOwnerCount,
      hint: '当前承担任务的成员数',
    },
    {
      key: 'risk',
      label: '风险任务',
      value: overdueCount,
      hint: '需要优先处理的延期或预警项',
    },
  ];

  const tableGridTemplateColumns = useMemo(() => (
    ['minmax(320px, 2.6fr)', ...visibleFields.map((field) => field.width), '44px'].join(' ')
  ), [visibleFields]);

  const tableGridMinWidth = useMemo(
    () => 400 + visibleFields.length * 150,
    [visibleFields],
  );

  useEffect(() => {
    if (!fieldConfigOpen) return undefined;

    const handlePointerDown = (event) => {
      if (fieldConfigRef.current?.contains(event.target)) return;
      setFieldConfigOpen(false);
      setCustomFieldMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [fieldConfigOpen]);

  const handleToggleGroup = (groupKey) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const handleToggleFieldConfig = () => {
    setFieldConfigOpen((current) => {
      const next = !current;
      if (!next) setCustomFieldMenuOpen(false);
      return next;
    });
  };

  const handleToggleFieldVisibility = (fieldId) => {
    setFieldItems((current) => current.map((field) => (
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    )));
  };

  const handleToggleCustomFieldMenu = () => {
    setCustomFieldMenuOpen((current) => !current);
  };

  const handleAddCustomField = (template) => {
    setFieldItems((current) => [...current, buildCustomField(template, current)]);
    setCustomFieldMenuOpen(false);
  };

  const handleOpenFieldCreator = (template) => {
    setFieldCreatorOpen(true);
    setFieldCreatorTab('new');
    setFieldCreatorTypeKey(template.key);
    setFieldCreatorTitle('');
    setFieldCreatorDateFormat(DATE_FORMAT_OPTIONS[0]?.value || 'iso');
    setCustomFieldMenuOpen(false);
    setFieldConfigOpen(false);
  };

  const handleCloseFieldCreator = () => {
    setFieldCreatorOpen(false);
  };

  const handleCreateField = () => {
    if (!fieldCreatorType || !canCreateField) return;

    setFieldItems((current) => [...current, buildCustomField(fieldCreatorType, current, {
      label: fieldCreatorTitle.trim(),
      config: fieldCreatorType.type === 'date'
        ? { dateFormat: fieldCreatorDateFormat }
        : {},
    })]);
    setFieldCreatorOpen(false);
  };

  const handleRevealCreatedField = (fieldId) => {
    setFieldItems((current) => current.map((field) => (
      field.id === fieldId ? { ...field, visible: true } : field
    )));
    setCustomFieldMenuOpen(false);
    setFieldCreatorOpen(false);
  };

  const handleOpenSurvey = (task) => {
    if (!getSurvey(task)) return;
    setSelectedSurveyTask(task);
  };

  const handleCloseSurvey = () => {
    setSelectedSurveyTask(null);
  };

  const renderSurveyField = (task, compact = false) => {
    const survey = getSurvey(task);
    if (!survey) {
      return (
        <span className="tasks-cell-placeholder" aria-label="未绑定问卷">
          <FileTextOutlined />
        </span>
      );
    }

    return (
      <button
        type="button"
        className={`tasks-survey-trigger ${compact ? 'is-compact' : ''}`}
        onClick={() => handleOpenSurvey(task)}
        aria-label={`查看问卷：${survey.title}`}
      >
        <span className="tasks-survey-trigger-main">
          <FileTextOutlined />
          <span className="tasks-survey-trigger-title">{survey.shortLabel || survey.title}</span>
        </span>
        <span className="tasks-survey-trigger-meta">{survey.responseCount} 份</span>
      </button>
    );
  };

  const renderTextValue = (value, code = false) => {
    if (!value) {
      return <span className="tasks-cell-placeholder">-</span>;
    }

    return (
      <span className={`tasks-field-text ${code ? 'is-code' : ''}`} title={value}>
        {value}
      </span>
    );
  };

  const renderPillValue = (value, tone = 'default') => {
    if (!value) {
      return <span className="tasks-cell-placeholder">-</span>;
    }

    return <span className={`tasks-field-pill is-${tone}`}>{value}</span>;
  };

  const renderTagList = (values) => {
    if (!values?.length) {
      return <span className="tasks-cell-placeholder">-</span>;
    }

    return (
      <span className="tasks-field-tag-list">
        {values.map((value) => (
          <span key={value} className="tasks-field-tag">{value}</span>
        ))}
      </span>
    );
  };

  const renderProgressCell = (value) => (
    <span className="tasks-field-progress">
      <span className="tasks-field-progress-bar">
        <span style={{ width: `${value}%` }} />
      </span>
      <span className="tasks-field-progress-value">{value}%</span>
    </span>
  );

  const renderFieldHeader = (field) => {
    const Icon = getFieldIconComponent(field);
    return (
      <>
        <Icon />
        <span>{field.label}</span>
      </>
    );
  };

  const renderFieldValue = (field, task) => {
    switch (field.id) {
      case 'owner':
        return renderMemberChip(task.ownerId);
      case 'startDate':
        return renderDateCell(getTaskStartLabel(task));
      case 'dueDate':
        return renderDateCell(getTaskDueLabel(task), task.status === 'risk');
      case 'subtaskProgress':
        return renderProgressCell(getTaskProgress(task));
      case 'listName':
        return renderPillValue(activeListLabel, 'default');
      case 'source':
        return renderTextValue('来自飞书项目');
      case 'creator':
        return renderMemberChip(task.creatorId);
      case 'assigner':
        return renderMemberChip(task.creatorId || CURRENT_USER_ID);
      case 'followers':
        return renderMemberChip(getTaskFollowerId(task));
      case 'createdAt':
        return renderDateCell(getTaskCreatedLabel(task));
      case 'completedAt':
        return renderDateCell(getTaskCompletedLabel(task));
      case 'updatedAt':
        return renderTextValue(getTaskUpdatedLabel(task));
      case 'taskId':
        return renderTextValue(task.id, true);
      case 'sourceCategory':
        return renderPillValue(task.groupName, 'default');
      default:
        break;
    }

    switch (field.type) {
      case 'single':
        return renderPillValue(getTaskSingleValue(task), 'default');
      case 'multi':
        return renderTagList(getTaskMultiValue(task));
      case 'member':
        return renderMemberChip(task.ownerId || task.creatorId);
      case 'number':
        return renderTextValue(getTaskNumberValue(task));
      case 'date':
        return renderDateCell(formatPresetDate(task.timelineEnd, field.config?.dateFormat || 'iso'));
      case 'text':
        return renderTextValue(getTaskTextValue(task));
      case 'survey':
        return renderSurveyField(task);
      case 'priority':
        return renderPillValue(getTaskPriority(task), 'priority');
      case 'price':
        return renderTextValue(getTaskPrice(task));
      case 'risk':
        return renderPillValue(getTaskRiskLevel(task), task.status === 'risk' ? 'alert' : 'default');
      case 'cost':
        return renderTextValue(getTaskCost(task));
      default:
        return renderTextValue('');
    }
  };

  return (
    <div className="tasks-module">
      <aside className="tasks-sidebar">
        <div className="tasks-sidebar-header">
          <div className="tasks-sidebar-title-wrap">
            <button type="button" className="tasks-icon-button" aria-label="展开菜单">
              <UnorderedListOutlined />
            </button>
            <span className="tasks-sidebar-title">任务</span>
          </div>
          <button type="button" className="tasks-icon-button" aria-label="更多操作">
            <EllipsisOutlined />
          </button>
        </div>

        <div className="tasks-sidebar-scroll">
          <section className="tasks-sidebar-section">
            <button type="button" className="tasks-sidebar-item is-highlight">
              <span className="tasks-sidebar-item-main">
                <UserOutlined />
                <span>我负责的</span>
              </span>
              <span className="tasks-sidebar-item-count">84</span>
            </button>
            <button type="button" className="tasks-sidebar-item">
              <span className="tasks-sidebar-item-main">
                <StarOutlined />
                <span>我关注的</span>
              </span>
            </button>
            <button type="button" className="tasks-sidebar-item">
              <span className="tasks-sidebar-item-main">
                <ClockCircleOutlined />
                <span>动态</span>
              </span>
            </button>
          </section>

          <section className="tasks-sidebar-section">
            <div className="tasks-sidebar-section-label">来自飞书项目</div>
            <button type="button" className="tasks-sidebar-item is-active">
              <span className="tasks-sidebar-item-main">
                <FolderOpenOutlined />
                <span>来自飞书项目</span>
              </span>
            </button>
          </section>

          <section className="tasks-sidebar-section">
            <div className="tasks-sidebar-section-label is-foldable">
              <span>快速访问</span>
              <CaretDownFilled />
            </div>
            {quickLinks.map((item) => (
              <button key={item.key} type="button" className="tasks-sidebar-item">
                <span className="tasks-sidebar-item-main">
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </section>

          <section className="tasks-sidebar-section">
            <div className="tasks-sidebar-section-title-row">
              <span className="tasks-sidebar-section-label">任务清单</span>
              <button type="button" className="tasks-icon-button" aria-label="新建清单">
                <PlusOutlined />
              </button>
            </div>
            <div className="tasks-sidebar-list">
              {listItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`tasks-sidebar-list-item ${selectedListKey === item.key ? 'is-active' : ''}`}
                  onClick={() => setSelectedListKey(item.key)}
                  title={item.label}
                >
                  <span className="tasks-sidebar-list-item-main">
                    <FolderOpenOutlined />
                    <span className="tasks-sidebar-list-item-text">{item.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="tasks-sidebar-section">
            <div className="tasks-sidebar-section-label is-foldable">
              <span>群组任务</span>
              <CaretDownFilled />
            </div>
            <button type="button" className="tasks-sidebar-footer-link">
              <PlusOutlined />
              <span>新建分组</span>
            </button>
          </section>
        </div>
      </aside>

      <main className="tasks-main">
        <header className="tasks-main-header">
          <div className="tasks-board-title-wrap">
            <span className="tasks-board-mark" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <div className="tasks-board-title-stack">
              <div className="tasks-board-title-row">
                <h1 className="tasks-board-title">果仁6.30</h1>
                <button type="button" className="tasks-inline-button" aria-label="更多操作">
                  <EllipsisOutlined />
                </button>
              </div>
              <div className="tasks-board-subtitle">项目任务清单</div>
            </div>
          </div>

          <div className="tasks-main-actions">
            <span className="tasks-user-avatar" aria-label={MEMBER_MAP[CURRENT_USER_ID].name}>
              {renderAvatar(CURRENT_USER_ID, 'is-small')}
            </span>
            <button type="button" className="tasks-secondary-button">
              <ShareAltOutlined />
              <span>分享</span>
            </button>
            <button type="button" className="tasks-icon-button" aria-label="布局设置">
              <AppstoreOutlined />
            </button>
            <button type="button" className="tasks-icon-button" aria-label="更多布局操作">
              <MoreOutlined />
            </button>
          </div>
        </header>

        <div className="tasks-view-tabs">
          {VIEW_OPTIONS.map((view) => (
            <button
              key={view.key}
              type="button"
              className={`tasks-view-tab ${activeView === view.key ? 'is-active' : ''}`}
              onClick={() => setActiveView(view.key)}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        <div className="tasks-toolbar">
          <div className="tasks-toolbar-primary">
            <button type="button" className="tasks-create-button">
              <PlusOutlined />
              <span>新建任务</span>
            </button>

            {TOOLBAR_FILTERS.map((item) => {
              if (item.key !== 'fields') {
                return (
                  <button key={item.key} type="button" className="tasks-filter-button">
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <div key={item.key} className="tasks-filter-button-wrap" ref={fieldConfigRef}>
                  <button
                    type="button"
                    className={`tasks-filter-button ${fieldConfigOpen ? 'is-active' : ''}`}
                    onClick={handleToggleFieldConfig}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>

                  {fieldConfigOpen ? (
                    <div className="tasks-field-config-popover">
                      <div className="tasks-field-config-panel">
                        <div className="tasks-field-config-panel-head">字段配置</div>

                        <button
                          type="button"
                          className={`tasks-field-add-trigger ${customFieldMenuOpen ? 'is-active' : ''}`}
                          onClick={handleToggleCustomFieldMenu}
                        >
                          <span className="tasks-field-add-trigger-main">
                            <PlusOutlined />
                            <span>添加自定义字段</span>
                          </span>
                          <RightOutlined className={`tasks-field-add-trigger-arrow ${customFieldMenuOpen ? 'is-open' : ''}`} />
                        </button>

                        <div className="tasks-field-list">
                          {fieldItems.map((field) => (
                            <div key={field.id} className={`tasks-field-item ${field.visible ? '' : 'is-hidden'}`}>
                              <span className="tasks-field-handle" aria-hidden="true">
                                <HolderOutlined />
                              </span>
                              <span className="tasks-field-name">{field.label}</span>
                              <button
                                type="button"
                                className="tasks-field-visibility"
                                onClick={() => handleToggleFieldVisibility(field.id)}
                                aria-label={field.visible ? `隐藏字段：${field.label}` : `显示字段：${field.label}`}
                              >
                                {field.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {customFieldMenuOpen ? (
                        <div className="tasks-field-type-menu">
                              {CUSTOM_FIELD_TEMPLATE_SECTIONS.map((section) => (
                                <section key={section.key} className="tasks-field-type-section">
                                  <div className="tasks-field-type-title">{section.label}</div>
                                  {section.items.map((template) => {
                                    const Icon = template.icon;
                                    return (
                                      <button
                                        key={template.key}
                                        type="button"
                                        className="tasks-field-type-option"
                                        onClick={() => (section.key === 'basic' || section.key === 'form-app'
                                          ? handleOpenFieldCreator(template)
                                          : handleAddCustomField(template))}
                                      >
                                        <Icon className="tasks-field-type-option-icon" />
                                        <span>{template.label}</span>
                                  </button>
                                );
                              })}
                            </section>
                          ))}

                          <section className="tasks-field-type-section is-created">
                            <div className="tasks-field-type-title">选择已创建的字段</div>
                            {createdCustomFields.length ? createdCustomFields.map((field) => {
                              const Icon = getFieldIconComponent(field);
                              return (
                                <button
                                  key={field.id}
                                  type="button"
                                  className="tasks-field-type-option"
                                  onClick={() => handleRevealCreatedField(field.id)}
                                >
                                  <Icon className="tasks-field-type-option-icon" />
                                  <span>{field.label}</span>
                                </button>
                              );
                            }) : (
                              <div className="tasks-field-created-empty">暂无已创建字段</div>
                            )}
                          </section>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <section className="tasks-main-body">
          {activeView === 'table' ? (
            <div className="tasks-surface-scroll">
              <div className="tasks-grid" style={{ minWidth: `${tableGridMinWidth}px` }}>
                <div className="tasks-grid-row tasks-grid-head" style={{ gridTemplateColumns: tableGridTemplateColumns }}>
                  <div className="tasks-grid-cell tasks-grid-cell-name">任务名称</div>
                  {visibleFields.map((field) => (
                    <div key={field.id} className="tasks-grid-cell">
                      {renderFieldHeader(field)}
                    </div>
                  ))}
                  <div className="tasks-grid-cell tasks-grid-cell-actions">
                    <PlusOutlined />
                  </div>
                </div>

                {TASK_GROUPS.map((group) => {
                  const collapsed = collapsedGroups[group.key];
                  return (
                    <section key={group.key} className="tasks-group">
                      <button
                        type="button"
                        className="tasks-group-header"
                        onClick={() => handleToggleGroup(group.key)}
                      >
                        <CaretDownFilled className={`tasks-group-arrow ${collapsed ? 'is-collapsed' : ''}`} />
                        <span className="tasks-group-title">{group.name}</span>
                        <span className="tasks-group-count">{group.tasks.length}</span>
                      </button>

                      {collapsed ? null : (
                        <div className="tasks-group-body">
                          {group.tasks.map((task) => {
                            const statusMeta = STATUS_META[task.status] || STATUS_META.planning;
                            return (
                              <div
                                key={task.id}
                                className="tasks-grid-row tasks-task-row"
                                style={{ gridTemplateColumns: tableGridTemplateColumns }}
                              >
                                <div className="tasks-grid-cell tasks-grid-cell-name">
                                  <span
                                    className="tasks-status-dot"
                                    style={{
                                      borderColor: statusMeta.border,
                                      background: statusMeta.surface,
                                      color: statusMeta.tone,
                                    }}
                                  />
                                  <span className="tasks-task-title">{task.title}</span>
                                  {renderTaskMetric(task)}
                                </div>

                                {visibleFields.map((field) => (
                                  <div key={field.id} className="tasks-grid-cell">
                                    {renderFieldValue(field, task)}
                                  </div>
                                ))}

                                <div className="tasks-grid-cell tasks-grid-cell-actions">
                                  <button type="button" className="tasks-row-action" aria-label="任务操作">
                                    <EllipsisOutlined />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          <button type="button" className="tasks-new-row">
                            新建任务
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeView === 'board' ? (
            <div className="tasks-surface-scroll">
              <div className="tasks-kanban">
                {statusBuckets.map((bucket) => {
                  const statusMeta = STATUS_META[bucket.key];
                  return (
                    <section key={bucket.key} className="tasks-kanban-column">
                      <header className="tasks-kanban-column-header">
                        <div className="tasks-kanban-column-title">
                          <span className="tasks-kanban-dot" style={{ background: statusMeta.tone }} />
                          <span>{bucket.label}</span>
                        </div>
                        <span className="tasks-kanban-count">{bucket.items.length}</span>
                      </header>

                      <div className="tasks-kanban-list">
                        {bucket.items.map((task) => (
                          <article key={task.id} className="tasks-kanban-card">
                            <div className="tasks-kanban-card-top">
                              <span className="tasks-kanban-card-group">{task.groupName}</span>
                              {renderTaskMetric(task)}
                            </div>
                            <div className="tasks-kanban-card-title">{task.title}</div>
                            <div className="tasks-kanban-card-meta">
                              <span
                                className="tasks-status-tag"
                                style={{
                                  color: statusMeta.tone,
                                  background: statusMeta.surface,
                                  borderColor: statusMeta.border,
                                }}
                              >
                                {statusMeta.label}
                              </span>
                              {task.dueLabel ? renderDateCell(task.dueLabel, task.status === 'risk') : <span className="tasks-card-muted">待设置时间</span>}
                            </div>
                            {hasVisibleSurveyField && getSurvey(task) ? (
                              <div className="tasks-kanban-card-survey">
                                {renderSurveyField(task, true)}
                              </div>
                            ) : null}
                            <div className="tasks-kanban-card-footer">
                              {renderMemberChip(task.ownerId)}
                              {renderAvatar(task.creatorId, 'is-small')}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeView === 'timeline' ? (
            <div className="tasks-surface-scroll">
              <div className="tasks-timeline-board">
                <div className="tasks-timeline-head">
                  <div className="tasks-timeline-title-cell">任务</div>
                  <div className="tasks-timeline-days">
                    {TIMELINE_DAYS.map((day) => (
                      <span key={day} className="tasks-timeline-day">{day}</span>
                    ))}
                  </div>
                </div>

                {allTasks.map((task) => {
                  const statusMeta = STATUS_META[task.status] || STATUS_META.planning;
                  const startIndex = Math.max(0, TIMELINE_DAYS.indexOf(task.timelineStart));
                  const endIndex = Math.max(startIndex, TIMELINE_DAYS.indexOf(task.timelineEnd));
                  return (
                    <div key={task.id} className="tasks-timeline-row">
                      <div className="tasks-timeline-title-cell">
                        <div className="tasks-timeline-task-title">{task.title}</div>
                        <div className="tasks-timeline-task-subtitle">{task.groupName}</div>
                      </div>
                      <div className="tasks-timeline-days">
                        <div
                          className="tasks-timeline-bar"
                          style={{
                            gridColumn: `${startIndex + 1} / ${endIndex + 2}`,
                            background: statusMeta.surface,
                            borderColor: statusMeta.border,
                            color: statusMeta.tone,
                          }}
                        >
                          {statusMeta.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeView === 'dashboard' ? (
            <div className="tasks-surface-scroll">
              <div className="tasks-dashboard">
                <div className="tasks-dashboard-grid">
                  {dashboardCards.map((card) => (
                    <article key={card.key} className="tasks-dashboard-card">
                      <div className="tasks-dashboard-label">{card.label}</div>
                      <div className="tasks-dashboard-value">{card.value}</div>
                      <div className="tasks-dashboard-hint">{card.hint}</div>
                    </article>
                  ))}
                </div>

                <div className="tasks-dashboard-split">
                  <section className="tasks-dashboard-panel">
                    <header className="tasks-panel-header">
                      <h2>分组进展</h2>
                      <span>按当前列表统计</span>
                    </header>
                    <div className="tasks-progress-list">
                      {TASK_GROUPS.map((group) => {
                        const groupDone = group.tasks.filter((task) => task.status === 'done').length;
                        const ratio = group.tasks.length ? Math.round((groupDone / group.tasks.length) * 100) : 0;
                        return (
                          <div key={group.key} className="tasks-progress-item">
                            <div className="tasks-progress-top">
                              <span>{group.name}</span>
                              <span>{group.tasks.length} 项</span>
                            </div>
                            <div className="tasks-progress-bar">
                              <span style={{ width: `${ratio}%` }} />
                            </div>
                            <div className="tasks-progress-hint">完成率 {ratio}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="tasks-dashboard-panel">
                    <header className="tasks-panel-header">
                      <h2>成员负载</h2>
                      <span>按负责人聚合</span>
                    </header>
                    <div className="tasks-owner-list">
                      {Object.values(MEMBER_MAP)
                        .filter((member) => member.id !== 'system')
                        .map((member) => {
                          const owned = allTasks.filter((task) => task.ownerId === member.id);
                          return (
                            <div key={member.id} className="tasks-owner-item">
                              <div className="tasks-owner-main">
                                {renderAvatar(member.id)}
                                <div className="tasks-owner-meta">
                                  <div className="tasks-owner-name">{member.name}</div>
                                  <div className="tasks-owner-hint">负责 {owned.length} 项任务</div>
                                </div>
                              </div>
                              <div className="tasks-owner-tags">
                                <span>{owned.filter((task) => task.status === 'active').length} 进行中</span>
                                <span>{owned.filter((task) => task.status === 'risk').length} 风险</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : null}

          {activeView === 'activity' ? (
            <div className="tasks-surface-scroll">
              <div className="tasks-activity-list">
                {ACTIVITY_ITEMS.map((item) => (
                  <article key={item.id} className="tasks-activity-item">
                    <div className="tasks-activity-avatar">{renderAvatar(item.actorId)}</div>
                    <div className="tasks-activity-main">
                      <div className="tasks-activity-title">
                        <strong>{getMember(item.actorId)?.name || '未知成员'}</strong>
                        <span>{item.action}</span>
                        <strong>{item.target}</strong>
                      </div>
                      <div className="tasks-activity-detail">{item.detail}</div>
                    </div>
                    <div className="tasks-activity-time">{item.time}</div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <footer className="tasks-footer">
          <div className="tasks-footer-item">已完成 {doneCount} 项</div>
          <div className="tasks-footer-item is-alert">风险 {overdueCount} 项</div>
          <div className="tasks-footer-item">视图: {VIEW_OPTIONS.find((item) => item.key === activeView)?.label}</div>
          <button type="button" className="tasks-footer-button">
            <AppstoreOutlined />
            <span>自定义布局</span>
          </button>
          <button type="button" className="tasks-footer-button">
            <FilterOutlined />
            <span>显示条件</span>
          </button>
          <button type="button" className="tasks-footer-button">
            <ShareAltOutlined />
            <span>共享视图</span>
          </button>
        </footer>

        {fieldCreatorOpen ? (
          <div className="tasks-field-modal-backdrop" onClick={handleCloseFieldCreator}>
            <div
              className="tasks-field-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tasks-field-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="tasks-field-modal-head">
                <h3 id="tasks-field-modal-title">添加自定义字段</h3>
                <button type="button" className="tasks-field-modal-close" onClick={handleCloseFieldCreator} aria-label="关闭弹窗">
                  <CloseOutlined />
                </button>
              </div>

              <div className="tasks-field-modal-tabs">
                <button
                  type="button"
                  className={`tasks-field-modal-tab ${fieldCreatorTab === 'new' ? 'is-active' : ''}`}
                  onClick={() => setFieldCreatorTab('new')}
                >
                  新建字段
                </button>
                <button
                  type="button"
                  className={`tasks-field-modal-tab ${fieldCreatorTab === 'existing' ? 'is-active' : ''}`}
                  onClick={() => setFieldCreatorTab('existing')}
                >
                  已创建字段
                </button>
              </div>

              <div className="tasks-field-modal-body">
                {fieldCreatorTab === 'new' ? (
                  <div className="tasks-field-form-grid">
                    <label className="tasks-field-form-item">
                      <span className="tasks-field-form-label">字段标题</span>
                      <input
                        className="tasks-field-form-input"
                        value={fieldCreatorTitle}
                        onChange={(event) => setFieldCreatorTitle(event.target.value)}
                        placeholder="请输入字段标题"
                        autoFocus
                      />
                    </label>

                    <label className="tasks-field-form-item">
                      <span className="tasks-field-form-label">字段类型</span>
                      <span className="tasks-field-form-select-wrap">
                        {fieldCreatorType?.icon ? <fieldCreatorType.icon className="tasks-field-form-select-icon" /> : null}
                        <select
                          className="tasks-field-form-select"
                          value={fieldCreatorTypeKey}
                          onChange={(event) => setFieldCreatorTypeKey(event.target.value)}
                        >
                          {CREATOR_FIELD_TEMPLATES.map((template) => (
                            <option key={template.key} value={template.key}>{template.label}</option>
                          ))}
                        </select>
                      </span>
                    </label>

                    {fieldCreatorType?.type === 'date' ? (
                      <label className="tasks-field-form-item is-full">
                        <span className="tasks-field-form-label">日期格式</span>
                        <span className="tasks-field-form-select-wrap is-plain">
                          <select
                            className="tasks-field-form-select"
                            value={fieldCreatorDateFormat}
                            onChange={(event) => setFieldCreatorDateFormat(event.target.value)}
                          >
                            {DATE_FORMAT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </span>
                      </label>
                    ) : null}

                    {fieldCreatorType?.type === 'survey' ? (
                      <div className="tasks-field-form-item is-full">
                        <span className="tasks-field-form-label">字段说明</span>
                        <div className="tasks-field-form-hint-card">
                          问卷字段创建后，会在任务单元格里直接显示问卷入口，点击后打开右侧问卷抽屉。
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="tasks-field-existing-list">
                    {createdCustomFields.length ? createdCustomFields.map((field) => {
                      const Icon = getFieldIconComponent(field);
                      return (
                        <button
                          key={field.id}
                          type="button"
                          className="tasks-field-existing-item"
                          onClick={() => handleRevealCreatedField(field.id)}
                        >
                          <span className="tasks-field-existing-item-main">
                            <span className="tasks-field-existing-item-icon">
                              <Icon />
                            </span>
                            <span className="tasks-field-existing-item-copy">
                              <strong>{field.label}</strong>
                              <span>{field.type === 'survey' ? '表单应用字段' : '已创建自定义字段'}</span>
                            </span>
                          </span>
                          <span className={`tasks-field-existing-item-state ${field.visible ? 'is-active' : ''}`}>
                            {field.visible ? '已显示' : '添加到当前视图'}
                          </span>
                        </button>
                      );
                    }) : (
                      <div className="tasks-field-existing-empty">当前还没有已创建字段</div>
                    )}
                  </div>
                )}
              </div>

              <div className="tasks-field-modal-footer">
                <button type="button" className="tasks-field-modal-secondary" onClick={handleCloseFieldCreator}>
                  取消
                </button>
                {fieldCreatorTab === 'new' ? (
                  <button
                    type="button"
                    className="tasks-field-modal-primary"
                    onClick={handleCreateField}
                    disabled={!canCreateField}
                  >
                    创建字段
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <Drawer
          title={null}
          placement="right"
          width={440}
          open={Boolean(selectedSurvey)}
          onClose={handleCloseSurvey}
          className="tasks-survey-drawer"
        >
          {selectedSurvey ? (
            <div className="tasks-survey-drawer-body">
              <div className="tasks-survey-drawer-hero">
                <div className="tasks-survey-drawer-kicker">问卷字段</div>
                <h3>{selectedSurvey.title}</h3>
                <p>{selectedSurvey.description}</p>
                <div className="tasks-survey-drawer-meta">
                  <span>关联任务：{selectedSurveyTask?.title || '-'}</span>
                  <span>状态：{selectedSurvey.status}</span>
                  <span>答卷：{selectedSurvey.responseCount} 份</span>
                  <span>题目：{selectedSurvey.questions.length} 题</span>
                </div>
              </div>

              <section className="tasks-survey-drawer-section">
                <div className="tasks-survey-drawer-section-head">
                  <span>投放信息</span>
                  <span>{selectedSurvey.updatedAt}</span>
                </div>
                <div className="tasks-survey-drawer-summary">
                  <div>
                    <strong>面向对象</strong>
                    <span>{selectedSurvey.audience}</span>
                  </div>
                  <div>
                    <strong>展示方式</strong>
                    <span>任务字段点击后右侧抽屉预览</span>
                  </div>
                </div>
              </section>

              <section className="tasks-survey-drawer-section">
                <div className="tasks-survey-drawer-section-head">
                  <span>问卷内容</span>
                  <span>{selectedSurvey.questions.length} 题</span>
                </div>
                <div className="tasks-survey-question-list">
                  {selectedSurvey.questions.map((question, index) => (
                    <article key={question.id} className="tasks-survey-question-card">
                      <div className="tasks-survey-question-order">Q{index + 1}</div>
                      <div className="tasks-survey-question-main">
                        <div className="tasks-survey-question-top">
                          <strong>{question.title}</strong>
                          <span>{QUESTION_TYPE_LABELS[question.type] || '题目'}</span>
                        </div>
                        {question.options?.length ? (
                          <div className="tasks-survey-option-list">
                            {question.options.map((option) => (
                              <span key={option} className="tasks-survey-option-pill">{option}</span>
                            ))}
                          </div>
                        ) : null}
                        {question.scoreHint ? <p className="tasks-survey-question-note">{question.scoreHint}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </Drawer>
      </main>
    </div>
  );
}
