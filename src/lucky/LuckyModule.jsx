import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Select, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  ArrowUpOutlined,
  AudioOutlined,
  BarChartOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  CompassOutlined,
  MessageOutlined,
  CloseOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  FireOutlined,
  FilterOutlined,
  FileImageOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FolderOutlined,
  HomeOutlined,
  LockOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MinusOutlined,
  PlusOutlined,
  ProductOutlined,
  ProjectOutlined,
  RightOutlined,
  RobotOutlined,
  SearchOutlined,
  ShareAltOutlined,
  ShopOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import ResourceLibrarySaveModal from '../resourceLib/ResourceLibrarySaveModal.jsx';
import './LuckyModule.css';

const PAGE_SIZE = 14;
const LUCKY_SIDEBAR_WIDTH_STORAGE_KEY = 'gr.lucky.sidebar-width.v1';
const DEFAULT_LUCKY_SIDEBAR_WIDTH = 224;
const MIN_LUCKY_SIDEBAR_WIDTH = 188;
const MAX_LUCKY_SIDEBAR_WIDTH = 320;
const INTRO_TASK_SECTION_KEY = 'task-intro-guide';
const INTRO_TASK_KEY = 'intro-guide';

const TASK_STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'in-progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
  { key: 'pending', label: '待处理' },
  { key: 'planned', label: '规划中' },
];

const TASK_TIME_FILTERS = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'last-7-days', label: '最近 7 天' },
  { key: 'last-30-days', label: '最近 30 天' },
];

function getBoundedLuckySidebarWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  return Math.max(MIN_LUCKY_SIDEBAR_WIDTH, Math.min(MAX_LUCKY_SIDEBAR_WIDTH, Math.round(width)));
}

function loadLuckySidebarWidth() {
  if (typeof window === 'undefined') return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  try {
    return getBoundedLuckySidebarWidth(window.localStorage.getItem(LUCKY_SIDEBAR_WIDTH_STORAGE_KEY));
  } catch {
    return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  }
}

function persistLuckySidebarWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LUCKY_SIDEBAR_WIDTH_STORAGE_KEY, String(getBoundedLuckySidebarWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

const WORK_MODES = [
  { key: 'office', label: '学习办公', icon: <AppstoreOutlined /> },
  { key: 'code', label: '编程', icon: <CodeOutlined /> },
];

const NAV_ITEMS = [
  { key: 'new', label: '新任务', icon: <EditOutlined /> },
  { key: 'automation', label: '自动化', icon: <ThunderboltOutlined /> },
  { key: 'partners', label: '智能体', icon: <RobotOutlined /> },
  { key: 'projects', label: '项目', icon: <ProjectOutlined /> },
  { key: 'library', label: '资源库', icon: <DatabaseOutlined /> },
  { key: 'market', label: '市场', icon: <ShopOutlined />, meta: '专家 · 技能' },
];

const QUICK_ACTIONS = [
  { key: 'slides', label: '幻灯片', icon: <FilePptOutlined /> },
  { key: 'research', label: '深度研究', icon: <CloudServerOutlined /> },
  { key: 'chart', label: '数据可视化', icon: <BarChartOutlined /> },
  { key: 'prototype', label: '产品原型', icon: <ProductOutlined /> },
  { key: 'office', label: '日常办公', icon: <FolderOutlined /> },
  { key: 'image', label: '图像生成', icon: <FileImageOutlined /> },
];

const AGENT_QUICK_ACTIONS = {
  'party-affairs': [
    { key: 'party-notice', label: '党务通知', icon: <FileTextOutlined /> },
    { key: 'party-meeting', label: '会议材料', icon: <FilePptOutlined /> },
    { key: 'party-activity', label: '活动方案', icon: <ProjectOutlined /> },
    { key: 'party-archive', label: '资料归档', icon: <DatabaseOutlined /> },
    { key: 'party-checklist', label: '审核清单', icon: <CheckOutlined /> },
    { key: 'party-ledger', label: '台账统计', icon: <BarChartOutlined /> },
  ],
  'party-review': [
    { key: 'review-material', label: '材料审核', icon: <CheckOutlined /> },
    { key: 'review-standard', label: '规范校验', icon: <FileTextOutlined /> },
    { key: 'review-points', label: '要点提取', icon: <SearchOutlined /> },
    { key: 'review-risk', label: '风险提示', icon: <ThunderboltOutlined /> },
    { key: 'review-polish', label: '表述润色', icon: <EditOutlined /> },
    { key: 'review-report', label: '审核报告', icon: <FilePptOutlined /> },
  ],
  'counselor-agent': [
    { key: 'counselor-notice', label: '学生通知', icon: <FileTextOutlined /> },
    { key: 'counselor-talk', label: '谈心记录', icon: <MessageOutlined /> },
    { key: 'counselor-class', label: '班会方案', icon: <ProjectOutlined /> },
    { key: 'counselor-aid', label: '资助摸排', icon: <SearchOutlined /> },
    { key: 'counselor-warning', label: '预警跟进', icon: <ThunderboltOutlined /> },
    { key: 'counselor-weekly', label: '周报汇总', icon: <BarChartOutlined /> },
  ],
  'college-cadre-position': [
    { key: 'cadre-duty', label: '岗位职责', icon: <FileTextOutlined /> },
    { key: 'cadre-review', label: '履职评价', icon: <CheckOutlined /> },
    { key: 'cadre-training', label: '培训计划', icon: <ProjectOutlined /> },
    { key: 'cadre-report', label: '述职材料', icon: <FilePptOutlined /> },
    { key: 'cadre-model', label: '能力模型', icon: <ProductOutlined /> },
    { key: 'cadre-dashboard', label: '数据看板', icon: <BarChartOutlined /> },
  ],
  'college-teacher': [
    { key: 'college-course', label: '课程建设', icon: <FileTextOutlined /> },
    { key: 'college-research', label: '科研选题', icon: <CloudServerOutlined /> },
    { key: 'college-reform', label: '教改方案', icon: <ProjectOutlined /> },
    { key: 'college-class', label: '课堂评价', icon: <CheckOutlined /> },
    { key: 'college-growth', label: '成长档案', icon: <FolderOutlined /> },
    { key: 'college-achievement', label: '成果汇总', icon: <BarChartOutlined /> },
  ],
  'school-nucleus': [
    { key: 'school-qa', label: '校情问答', icon: <MessageOutlined /> },
    { key: 'school-notice', label: '通知起草', icon: <FileTextOutlined /> },
    { key: 'school-policy', label: '制度检索', icon: <SearchOutlined /> },
    { key: 'school-minutes', label: '会议纪要', icon: <EditOutlined /> },
    { key: 'school-follow', label: '事项跟进', icon: <ClockCircleOutlined /> },
    { key: 'school-dashboard', label: '数据看板', icon: <BarChartOutlined /> },
  ],
  'teacher-ability-map': [
    { key: 'ability-portrait', label: '能力画像', icon: <RobotOutlined /> },
    { key: 'ability-gap', label: '差距分析', icon: <BarChartOutlined /> },
    { key: 'ability-advice', label: '发展建议', icon: <FileTextOutlined /> },
    { key: 'ability-path', label: '培训路径', icon: <ProjectOutlined /> },
    { key: 'ability-list', label: '清单绘制', icon: <CheckOutlined /> },
    { key: 'ability-report', label: '报告生成', icon: <FilePptOutlined /> },
  ],
  'vocational-moral-education': [
    { key: 'moral-activity', label: '德育活动', icon: <ProjectOutlined /> },
    { key: 'moral-class', label: '主题班会', icon: <FilePptOutlined /> },
    { key: 'moral-case', label: '育人案例', icon: <FileTextOutlined /> },
    { key: 'moral-student', label: '学生画像', icon: <RobotOutlined /> },
    { key: 'moral-home', label: '家校协同', icon: <MessageOutlined /> },
    { key: 'moral-record', label: '过程记录', icon: <FolderOutlined /> },
  ],
  'k12-principal': [
    { key: 'principal-school', label: '校情分析', icon: <BarChartOutlined /> },
    { key: 'principal-plan', label: '发展规划', icon: <ProjectOutlined /> },
    { key: 'principal-rectify', label: '督导整改', icon: <CheckOutlined /> },
    { key: 'principal-teaching', label: '教研安排', icon: <FolderOutlined /> },
    { key: 'principal-safety', label: '安全台账', icon: <DatabaseOutlined /> },
    { key: 'principal-report', label: '汇报材料', icon: <FilePptOutlined /> },
  ],
  'k12-teacher': [
    { key: 'teacher-lesson', label: '备课设计', icon: <FileTextOutlined /> },
    { key: 'teacher-homework', label: '作业设计', icon: <EditOutlined /> },
    { key: 'teacher-activity', label: '课堂活动', icon: <ProjectOutlined /> },
    { key: 'teacher-learning', label: '学情分析', icon: <BarChartOutlined /> },
    { key: 'teacher-reflect', label: '教学反思', icon: <MessageOutlined /> },
    { key: 'teacher-courseware', label: '课件生成', icon: <FilePptOutlined /> },
  ],
  'ai-teacher-training': [
    { key: 'training-path', label: '选学路径', icon: <ProjectOutlined /> },
    { key: 'training-resource', label: '资源推荐', icon: <FolderOutlined /> },
    { key: 'training-remind', label: '学习提醒', icon: <ClockCircleOutlined /> },
    { key: 'training-evaluate', label: '成果评价', icon: <CheckOutlined /> },
    { key: 'training-qa', label: '培训问答', icon: <MessageOutlined /> },
    { key: 'training-dashboard', label: '进度看板', icon: <BarChartOutlined /> },
  ],
  'class-teacher-helper': [
    { key: 'class-notice', label: '班级通知', icon: <FileTextOutlined /> },
    { key: 'class-home', label: '家校沟通', icon: <MessageOutlined /> },
    { key: 'class-growth', label: '学生成长', icon: <RobotOutlined /> },
    { key: 'class-remind', label: '事务提醒', icon: <ClockCircleOutlined /> },
    { key: 'class-meeting', label: '班会方案', icon: <FilePptOutlined /> },
    { key: 'class-weekly', label: '周报汇总', icon: <BarChartOutlined /> },
  ],
  'elderly-education': [
    { key: 'elder-course', label: '课程排期', icon: <ClockCircleOutlined /> },
    { key: 'elder-activity', label: '活动组织', icon: <ProjectOutlined /> },
    { key: 'elder-care', label: '学员关怀', icon: <MessageOutlined /> },
    { key: 'elder-health', label: '健康提示', icon: <ThunderboltOutlined /> },
    { key: 'elder-feedback', label: '课堂反馈', icon: <CheckOutlined /> },
    { key: 'elder-resource', label: '资源推荐', icon: <FolderOutlined /> },
  ],
  'tongda-ai-teaching': [
    { key: 'tongda-qa', label: '平台问答', icon: <MessageOutlined /> },
    { key: 'tongda-guide', label: '应用指引', icon: <CompassOutlined /> },
    { key: 'tongda-course', label: '课程方案', icon: <FileTextOutlined /> },
    { key: 'tongda-training', label: '教师培训', icon: <ProjectOutlined /> },
    { key: 'tongda-resource', label: '资源检索', icon: <SearchOutlined /> },
    { key: 'tongda-report', label: '使用报告', icon: <BarChartOutlined /> },
  ],
  'family-education': [
    { key: 'family-talk', label: '亲子沟通', icon: <MessageOutlined /> },
    { key: 'family-record', label: '咨询记录', icon: <FileTextOutlined /> },
    { key: 'family-growth', label: '成长建议', icon: <RobotOutlined /> },
    { key: 'family-activity', label: '家庭活动', icon: <ProjectOutlined /> },
    { key: 'family-emotion', label: '情绪支持', icon: <ThunderboltOutlined /> },
    { key: 'family-case', label: '案例分析', icon: <SearchOutlined /> },
  ],
  'elderly-agent': [
    { key: 'elderly-chat', label: '陪伴问答', icon: <MessageOutlined /> },
    { key: 'elderly-service', label: '服务导航', icon: <CompassOutlined /> },
    { key: 'elderly-remind', label: '健康提醒', icon: <ClockCircleOutlined /> },
    { key: 'elderly-activity', label: '活动推荐', icon: <ProjectOutlined /> },
    { key: 'elderly-life', label: '生活咨询', icon: <FileTextOutlined /> },
    { key: 'elderly-summary', label: '家属摘要', icon: <FilePptOutlined /> },
  ],
  'education-supervision': [
    { key: 'supervision-record', label: '督导记录', icon: <EditOutlined /> },
    { key: 'supervision-rectify', label: '整改跟踪', icon: <CheckOutlined /> },
    { key: 'supervision-material', label: '材料核查', icon: <FileTextOutlined /> },
    { key: 'supervision-list', label: '现场清单', icon: <DatabaseOutlined /> },
    { key: 'supervision-report', label: '报告生成', icon: <FilePptOutlined /> },
    { key: 'supervision-dashboard', label: '数据看板', icon: <BarChartOutlined /> },
  ],
  'agri-electric': [
    { key: 'agri-consult', label: '用电咨询', icon: <MessageOutlined /> },
    { key: 'agri-service', label: '业务办理', icon: <FileTextOutlined /> },
    { key: 'agri-repair', label: '故障报修', icon: <ThunderboltOutlined /> },
    { key: 'agri-policy', label: '政策解读', icon: <SearchOutlined /> },
    { key: 'agri-ledger', label: '台账查询', icon: <DatabaseOutlined /> },
    { key: 'agri-return', label: '服务回访', icon: <ClockCircleOutlined /> },
  ],
};

const TEAM_QUICK_ACTIONS = {
  'party-work-squad': [
    { key: 'party-squad-brief', label: '材料统筹', icon: <FolderOutlined /> },
    { key: 'party-squad-draft', label: '分工起草', icon: <EditOutlined /> },
    { key: 'party-squad-review', label: '协同审核', icon: <CheckOutlined /> },
    { key: 'party-squad-meeting', label: '会议包', icon: <FilePptOutlined /> },
    { key: 'party-squad-archive', label: '归档清单', icon: <DatabaseOutlined /> },
    { key: 'party-squad-summary', label: '汇总报告', icon: <BarChartOutlined /> },
  ],
  'college-teacher-development-squad': [
    { key: 'teacher-squad-portrait', label: '教师画像', icon: <RobotOutlined /> },
    { key: 'teacher-squad-gap', label: '能力诊断', icon: <BarChartOutlined /> },
    { key: 'teacher-squad-duty', label: '岗位匹配', icon: <ProductOutlined /> },
    { key: 'teacher-squad-supervision', label: '督导反馈', icon: <CheckOutlined /> },
    { key: 'teacher-squad-growth', label: '成长路径', icon: <ProjectOutlined /> },
    { key: 'teacher-squad-report', label: '发展报告', icon: <FilePptOutlined /> },
  ],
  'k12-ai-teaching-squad': [
    { key: 'k12-squad-school', label: '校本方案', icon: <ProjectOutlined /> },
    { key: 'k12-squad-lesson', label: '备课共创', icon: <FileTextOutlined /> },
    { key: 'k12-squad-training', label: '培训路径', icon: <CompassOutlined /> },
    { key: 'k12-squad-class', label: '班级应用', icon: <MessageOutlined /> },
    { key: 'k12-squad-evaluate', label: '成效评价', icon: <CheckOutlined /> },
    { key: 'k12-squad-board', label: '进度看板', icon: <BarChartOutlined /> },
  ],
  'moral-classroom-squad': [
    { key: 'moral-squad-theme', label: '育人主题', icon: <StarOutlined /> },
    { key: 'moral-squad-activity', label: '活动设计', icon: <ProjectOutlined /> },
    { key: 'moral-squad-class', label: '班级执行', icon: <CheckOutlined /> },
    { key: 'moral-squad-family', label: '家校话术', icon: <MessageOutlined /> },
    { key: 'moral-squad-record', label: '过程记录', icon: <FolderOutlined /> },
    { key: 'moral-squad-case', label: '案例沉淀', icon: <FileTextOutlined /> },
  ],
  'lifelong-education-service-squad': [
    { key: 'lifelong-squad-course', label: '课程服务', icon: <FileTextOutlined /> },
    { key: 'lifelong-squad-activity', label: '活动排期', icon: <ClockCircleOutlined /> },
    { key: 'lifelong-squad-consult', label: '咨询问答', icon: <MessageOutlined /> },
    { key: 'lifelong-squad-family', label: '家庭支持', icon: <HomeOutlined /> },
    { key: 'lifelong-squad-care', label: '关怀提醒', icon: <ThunderboltOutlined /> },
    { key: 'lifelong-squad-feedback', label: '服务反馈', icon: <BarChartOutlined /> },
  ],
  'smart-platform-operation-squad': [
    { key: 'platform-squad-guide', label: '平台介绍', icon: <CompassOutlined /> },
    { key: 'platform-squad-scenario', label: '应用场景', icon: <AppstoreOutlined /> },
    { key: 'platform-squad-supervision', label: '督导反馈', icon: <CheckOutlined /> },
    { key: 'platform-squad-process', label: '落地流程', icon: <ProjectOutlined /> },
    { key: 'platform-squad-service', label: '服务问答', icon: <MessageOutlined /> },
    { key: 'platform-squad-report', label: '运营报告', icon: <BarChartOutlined /> },
  ],
};

const COMPOSER_CONTEXTS = [
  { key: 'agent', label: '张洪磊的智能体', icon: <RobotOutlined /> },
  { key: 'project', label: '进入项目工作', icon: <FolderOutlined /> },
  { key: 'browser', label: '云端浏览器', icon: <CloudServerOutlined />, hasNotice: true },
];

const RECOMMENDATION_CARDS = [
  { key: 'ppt', label: '幻灯片', title: '生成一份党务智能体应用培训 PPT', icon: <FilePptOutlined /> },
  { key: 'research', label: '深度研究', title: '研究教育智能体在学校治理中的落地场景', icon: <CloudServerOutlined /> },
  { key: 'data', label: '数据可视化', title: '制作智能体任务完成率与使用效果看板', icon: <BarChartOutlined /> },
];

const CODE_NAV_ITEMS = [
  { key: 'new-app', label: '新应用', icon: <PlusOutlined /> },
  { key: 'discover', label: '发现', icon: <CompassOutlined /> },
];

const CODE_APP_ITEMS = [
  { key: 'sql-path', name: 'SQL 学习路径 · 3 个月工作取...', color: '#1fbf8f' },
];

const CODE_RECENT_APPS = [
  { key: 'pilot-supervision', name: '试点版-智慧教育督导平台', color: '#1677ff' },
  { key: 'sql-path', name: 'SQL 学习路径 · 3 个月工作取数计划', color: '#1fbf8f' },
];

const CODE_APP_DETAILS = {
  'sql-path': {
    title: 'SQL 学习路径 · 3 个月工作取数计划',
    updatedAt: '最近更新：8月17日 18:13',
    appName: 'SQL 学习路径',
    desc: '3 个月工作取数计划 · 每周 6 小时',
    goal: '创建一个交互式 SQL 3 个月学习路径可视化网页，包含阶段时间线、每周学习安排、练习建议和进度追踪。',
    stats: [
      { key: 'hours', label: '总时长', value: '78 小时', sub: '13 周 x 6 小时/周', tone: 'blue' },
      { key: 'stages', label: '学习阶段', value: '3 个', sub: '地基 > 进阶 > 巩固', tone: 'green' },
      { key: 'weekly', label: '每周投入', value: '6 小时', sub: '约每天 1 小时', tone: 'orange' },
      { key: 'target', label: '最终目标', value: '独立取数', sub: '应对工作中的数据需求', tone: 'slate' },
    ],
    phases: [
      { key: 'base', name: '阶段 1：地基搭建', weeks: '0/6 周', color: '#3f7af8' },
      { key: 'practice', name: '阶段 2：实战进阶', weeks: '0/4 周', color: '#20b983' },
      { key: 'review', name: '阶段 3：巩固提速', weeks: '0/3 周', color: '#f59e0b' },
    ],
    tasks: [
      { key: 'w1', phase: '阶段 1：地基搭建', week: '第 1 周', hours: '6h', title: 'SQL 环境与基础查询' },
      { key: 'w2', phase: '阶段 1：地基搭建', week: '第 2 周', hours: '6h', title: '条件筛选' },
      { key: 'w3', phase: '阶段 1：地基搭建', week: '第 3 周', hours: '6h', title: '聚合函数' },
      { key: 'w4', phase: '阶段 1：地基搭建', week: '第 4 周', hours: '6h', title: '多表关联' },
      { key: 'w5', phase: '阶段 1：地基搭建', week: '第 5 周', hours: '6h', title: '日期与字符串函数' },
      { key: 'w6', phase: '阶段 1：地基搭建', week: '第 6 周', hours: '6h', title: '阶段复习 + 综合练习' },
      { key: 'w7', phase: '阶段 2：实战进阶', week: '第 7 周', hours: '6h', title: '业务指标拆解' },
      { key: 'w8', phase: '阶段 2：实战进阶', week: '第 8 周', hours: '6h', title: '窗口函数入门' },
    ],
    messages: [
      '我来为你创建这个 SQL 学习路径可视化页面。先加载设计技能确立视觉方向，然后搭建完整的交互页面。',
      '现在开始搭建页面。我先规划视觉方向，然后一次性写出完整的交互式页面。',
    ],
  },
};

const CODE_PROMPT_CHIPS = [
  { key: 'agent-app', label: '智能体应用', icon: <RobotOutlined /> },
  { key: 'agent-squad', label: '小队编排', icon: <ProjectOutlined /> },
  { key: 'knowledge-qa', label: '知识库问答', icon: <DatabaseOutlined /> },
  { key: 'quality-check', label: '输出质检', icon: <CheckOutlined /> },
  { key: 'tool-permission', label: '工具权限', icon: <ControlOutlined /> },
];

const CODE_STYLE_TEMPLATES = [
  { key: 'party-review', name: '党务材料审核台', tone: 'lime', metric: '24项', dark: false },
  { key: 'teacher-profile', name: '教师能力画像', tone: 'blue', metric: '93%', dark: true },
  { key: 'school-dashboard', name: '校情数据看板', tone: 'cream', metric: '10.4K', dark: false },
  { key: 'class-helper', name: '班级事务助手', tone: 'green', metric: '80%', dark: false },
  { key: 'supervision-report', name: '督导周报工具', tone: 'black', metric: '58', dark: true },
  { key: 'home-school', name: '家校沟通脚本', tone: 'violet', metric: '62', dark: true },
  { key: 'knowledge-qa', name: '知识库问答台', tone: 'terra', metric: '59.8', dark: false },
  { key: 'training-path', name: '培训路径规划', tone: 'paper', metric: '44.4K', dark: false },
  { key: 'moral-plan', name: '德育活动策划', tone: 'antd', metric: '73%', dark: true },
  { key: 'agent-quality', name: '智能体质检台', tone: 'mint', metric: '70', dark: false },
  { key: 'meeting-todo', name: '会议纪要待办', tone: 'slate', metric: '22.8', dark: true },
  { key: 'resource-citation', name: '资料引用检索', tone: 'royal', metric: '13', dark: true },
  { key: 'elderly-activity', name: '老年教育活动', tone: 'beige', metric: '43.8', dark: false },
  { key: 'family-advisor', name: '家庭教育咨询', tone: 'purple', metric: '55.8', dark: true },
  { key: 'agri-electric', name: '农电服务台账', tone: 'emerald', metric: '8.4K', dark: false },
  { key: 'squad-board', name: '智能体小队看板', tone: 'magenta', metric: '75', dark: true },
];

const CODE_DISCOVER_TABS = ['发现', '应用', '插件', '组件'];

const CODE_DISCOVER_APPS = [
  {
    key: 'party-agent-review',
    title: '党务智能体材料审核台',
    tone: 'navy',
    tags: ['智能体应用', '材料审核', '精选'],
  },
  {
    key: 'agent-squad-orchestration',
    title: '智能体小队任务编排中心',
    tone: 'festival',
    tags: ['多智能体', '任务分发', '精选'],
  },
  {
    key: 'teacher-agent-portrait',
    title: '教师能力画像智能体工作台',
    tone: 'spot',
    tags: ['智能体应用', '能力画像', '数据分析'],
  },
  {
    key: 'class-agent-home-school',
    title: '班主任智能体家校沟通台',
    tone: 'business',
    tags: ['智能体应用', '家校沟通', '效率工具'],
  },
  {
    key: 'supervision-agent-rectify',
    title: '督学智能体整改跟踪系统',
    tone: 'table',
    tags: ['智能体应用', '督导整改', '业务系统'],
  },
  {
    key: 'knowledge-agent-qa',
    title: '知识库问答智能体门户',
    tone: 'sheet',
    tags: ['知识库', '问答智能体', '精选'],
  },
  {
    key: 'ai-training-agent-path',
    title: 'AI 选学培训智能体路径助手',
    tone: 'flower',
    tags: ['培训路径', '智能推荐', '精选'],
  },
  {
    key: 'agent-output-quality',
    title: '智能体输出质检与追踪台',
    tone: 'cinema',
    tags: ['输出质检', '安全校验', '效率工具'],
  },
  {
    key: 'moral-agent-planner',
    title: '德育活动智能体策划台',
    tone: 'canteen',
    tags: ['德育活动', '班会方案', '智能体应用'],
  },
  {
    key: 'elderly-agent-service',
    title: '老年教育智能体服务台',
    tone: 'mint',
    tags: ['老年教育', '服务问答', '精选'],
  },
  {
    key: 'family-agent-advisor',
    title: '家庭教育咨询智能体',
    tone: 'benefit',
    tags: ['家庭教育', '亲子沟通', '咨询助手'],
  },
  {
    key: 'agri-electric-agent',
    title: '农电通服务智能体台账',
    tone: 'violet',
    tags: ['服务智能体', '业务台账', '效率工具'],
  },
];

const CODE_DISCOVER_PLUGINS = [
  {
    key: 'agent-prompt-polish',
    title: '智能体提示词优化',
    desc: '检查角色、边界和输出格式，让智能体指令更稳定',
    icon: <EditOutlined />,
    tone: 'purple',
  },
  {
    key: 'agent-task-dispatch',
    title: '智能体任务分发',
    desc: '按任务类型自动派发给合适的智能体或小队成员',
    icon: <MessageOutlined />,
    tone: 'cyan',
  },
  {
    key: 'agent-citation-check',
    title: '知识库引用校验',
    desc: '核验智能体回答是否引用了项目知识和可信来源',
    icon: <FileTextOutlined />,
    tone: 'indigo',
  },
  {
    key: 'agent-tool-permission',
    title: '工具权限检查',
    desc: '检查智能体可用工具、数据范围和敏感操作权限',
    icon: <ControlOutlined />,
    tone: 'blue',
  },
];

const AUTOMATION_RECOMMENDATIONS = [
  {
    key: 'daily-report',
    title: '每日工作汇报',
    desc: '工作日 19:00 定时生成日报，自动发送',
    icon: <ClockCircleOutlined />,
    tone: 'clock',
  },
  {
    key: 'bitable-check',
    title: '多维表数据巡检',
    desc: '每小时跑一次，异常自动告警',
    icon: <DatabaseOutlined />,
    tone: 'table',
  },
  {
    key: 'weekly-report',
    title: '周报自动生成',
    desc: '每周五 17:00 出周报草稿',
    icon: <FileTextOutlined />,
    tone: 'scroll',
  },
];

const MARKET_TABS = ['专家', '技能', '最佳实践', '企业智能体'];

const MARKET_RANKING_CARDS = [
  {
    key: 'agent-build',
    title: '智能体搭建',
    badge: '专属推荐',
    desc: '从人设、指令到工具权限，快速搭建可用智能体',
    tone: 'pink',
    icon: <TrophyOutlined />,
    items: [
      { name: '智能体人设架构师', category: '人设配置', avatar: 'peach' },
      { name: '指令优化专家', category: '提示词优化', avatar: 'orange' },
      { name: '工具权限设计师', category: '边界控制', avatar: 'blue' },
    ],
  },
  {
    key: 'operation',
    title: '运营榜',
    desc: '智能体上线、质检、复盘和持续迭代全流程支持',
    tone: 'gold',
    icon: <FireOutlined />,
    items: [
      { name: '智能体运营管家', category: '效果追踪', avatar: 'green' },
      { name: '输出质检专员', category: '质量审核', avatar: 'brown' },
      { name: '知识库维护专家', category: '资料更新', avatar: 'violet' },
    ],
  },
  {
    key: 'squad',
    title: '协作榜',
    desc: '多智能体小队分工、调度、汇总和复盘',
    tone: 'blue',
    icon: <TrophyOutlined />,
    items: [
      { name: '小队编排专家', category: '多智能体协作', avatar: 'amber' },
      { name: '任务路由设计师', category: '任务分发', avatar: 'cyan' },
      { name: '结果汇总专家', category: '报告合成', avatar: 'purple' },
    ],
  },
];

const MARKET_CATEGORIES = [
  '全部',
  '智能体搭建',
  '指令优化',
  '小队协作',
  '知识库',
  '工具权限',
  '输出质检',
  '教育智能体',
  '党务智能体',
  '督导智能体',
  '运营分析',
];

const MARKET_EXPERTS = [
  {
    key: 'agent-persona-architect',
    name: '智能体人设架构师',
    category: '智能体搭建',
    desc: '根据业务场景梳理智能体角色定位、服务边界、语气风格和行为约束，生成可直接配置的人设档案。',
    tags: ['角色定位', '边界设定', '人设档案'],
    avatar: 'cyan',
  },
  {
    key: 'instruction-optimizer',
    name: '智能体指令优化专家',
    category: '指令优化',
    desc: '将零散需求整理为结构化提示词，补齐输入条件、执行步骤、输出格式和禁止事项。',
    tags: ['提示词优化', '输出格式', '规则补齐'],
    avatar: 'green',
  },
  {
    key: 'squad-orchestrator',
    name: '智能体小队编排专家',
    category: '小队协作',
    desc: '把复杂任务拆解给队长和成员智能体，设计协作顺序、汇报节点和最终合成规则。',
    tags: ['任务拆解', '成员分工', '汇总规则'],
    avatar: 'purple',
  },
  {
    key: 'knowledge-curator',
    name: '智能体知识库专家',
    category: '知识库',
    desc: '负责资料清洗、知识切片、引用规则和更新机制，让智能体回答更有依据。',
    tags: ['知识切片', '引用校验', '资料更新'],
    avatar: 'blue',
  },
  {
    key: 'tool-permission-designer',
    name: '工具权限设计师',
    category: '工具权限',
    desc: '为智能体配置可调用工具、审批边界、敏感操作提醒和数据访问范围。',
    tags: ['工具调用', '权限边界', '审批规则'],
    avatar: 'brown',
  },
  {
    key: 'agent-quality-auditor',
    name: '智能体输出质检专家',
    category: '输出质检',
    desc: '检查智能体回答的事实依据、格式一致性、风险措辞和人工复核点。',
    tags: ['事实核验', '风险提示', '人工复核'],
    avatar: 'amber',
  },
  {
    key: 'party-agent-builder',
    name: '党务智能体专家',
    category: '党务智能体',
    desc: '面向党务通知、会议纪要、活动方案和材料审核，设计党务智能体的流程和模板。',
    tags: ['党务材料', '审核清单', '归档汇编'],
    avatar: 'peach',
  },
  {
    key: 'teacher-agent-expert',
    name: '教师发展智能体专家',
    category: '教育智能体',
    desc: '围绕教师能力画像、研修路径、听评课记录和发展建议，搭建教育智能体方案。',
    tags: ['能力画像', '研修路径', '听评课'],
    avatar: 'orange',
  },
  {
    key: 'supervision-agent-expert',
    name: '督导智能体专家',
    category: '督导智能体',
    desc: '支持督导记录、问题清单、整改跟踪和复盘报告的智能体设计与评估。',
    tags: ['督导记录', '整改跟踪', '复盘报告'],
    avatar: 'violet',
  },
  {
    key: 'agent-ops-analyst',
    name: '智能体运营分析师',
    category: '运营分析',
    desc: '跟踪智能体调用量、完成率、用户反馈和问题分布，输出运营看板和优化建议。',
    tags: ['调用分析', '效果看板', '优化建议'],
    avatar: 'green',
  },
  {
    key: 'agent-safety-specialist',
    name: '智能体安全边界专家',
    category: '输出质检',
    desc: '为智能体建立敏感内容、越权调用和高风险任务的拦截与提醒机制。',
    tags: ['安全边界', '敏感识别', '越权拦截'],
    avatar: 'cyan',
  },
  {
    key: 'agent-template-consultant',
    name: '智能体模板顾问',
    category: '智能体搭建',
    desc: '将成熟业务流程沉淀为可复用智能体模板，包含开场语、任务流程、知识和工具配置。',
    tags: ['模板沉淀', '流程复用', '配置建议'],
    avatar: 'purple',
  },
];

const MARKET_SKILL_BANNERS = [
  {
    key: 'publish-skill',
    title: '你的智能体技能值得被更多人复用',
    desc: '将沉淀好的工作方法、提示词和工具流程发布到 SkillHub，让智能体能力持续积累。',
    action: '了解详情',
    tone: 'blue',
    icon: <CloudServerOutlined />,
  },
  {
    key: 'agent-board',
    title: '一句话生成智能体工作流',
    desc: '安装并使用智能体 Flow Pack，一键编排任务拆解、资料检索、审核和汇报链路。',
    action: '了解详情',
    tone: 'warm',
    icon: <ProjectOutlined />,
  },
];

const MARKET_SKILL_SCOPES = ['全部', '企业专属', '我的'];

const MARKET_SKILL_CATEGORIES = [
  '官方精选',
  '智能体搭建',
  '小队协作',
  '知识库增强',
  '工具调用',
  '审核质检',
  '教育教学',
  '数据分析',
  '内容生成',
  '组织管理',
];

const MARKET_SKILL_PACKS = [
  {
    key: 'party-agent-pack',
    title: '党务智能体技能包',
    desc: '适用于党务通知、会议纪要、活动方案、材料审核和归档汇编，让党务智能体从起草到审核形成闭环。',
    tags: ['党务材料生成', '审核清单', '归档汇编'],
    count: '8,426',
    scope: '企业专属',
  },
  {
    key: 'teacher-growth-pack',
    title: '教师发展智能体技能包',
    desc: '面向高校和中小学教师成长，支持能力画像、研修路径、听评课记录和发展建议自动生成。',
    tags: ['能力画像', '研修推荐', '听评课记录'],
    count: '6,938',
    scope: '官方精选',
  },
  {
    key: 'squad-orchestration-pack',
    title: '智能体小队协作技能包',
    desc: '为多智能体小队提供任务拆解、成员分工、阶段汇报、结果合成和复盘报告等协作能力。',
    tags: ['任务拆解', '成员调度', '汇总复盘'],
    count: '9,204',
    scope: '官方精选',
  },
  {
    key: 'knowledge-agent-pack',
    title: '知识库问答增强技能包',
    desc: '支持从制度文件、课程资料和项目文档中抽取知识，增强智能体问答的依据、引用和可信度。',
    tags: ['知识抽取', '引用生成', '问答增强'],
    count: '7,715',
    scope: '企业专属',
  },
  {
    key: 'education-service-pack',
    title: '终身教育服务技能包',
    desc: '围绕老年教育、家庭教育和社区学习服务，生成课程活动、咨询话术和服务记录模板。',
    tags: ['活动方案', '服务问答', '记录模板'],
    count: '4,382',
    scope: '官方精选',
  },
  {
    key: 'agent-evaluation-pack',
    title: '智能体评测与质检技能包',
    desc: '为智能体输出建立质量检查、事实核验、敏感内容提醒和人工复核建议。',
    tags: ['输出质检', '事实核验', '风险提醒'],
    count: '5,991',
    scope: '我的',
  },
];

const MARKET_SKILL_ITEMS = [
  {
    key: 'agent-persona-builder',
    title: '智能体人设生成',
    desc: '根据业务对象、服务边界和语气要求，生成可直接填入智能体配置的人设、目标和约束。',
    tags: ['人设档案', '角色目标', '行为约束'],
    category: '智能体搭建',
    scope: '官方精选',
    count: '128,430',
    icon: <RobotOutlined />,
  },
  {
    key: 'agent-instruction-polish',
    title: '智能体指令优化',
    desc: '将零散的工作要求整理成结构化指令，补齐输入、流程、输出格式和禁止事项。',
    tags: ['提示词优化', '输出格式', '规则补齐'],
    category: '智能体搭建',
    scope: '企业专属',
    count: '96,275',
    icon: <EditOutlined />,
  },
  {
    key: 'squad-task-router',
    title: '小队任务拆解器',
    desc: '把用户目标拆成多个子任务，并为队长和成员生成分工、依赖关系与交付物要求。',
    tags: ['任务拆解', '成员分工', '交付清单'],
    category: '小队协作',
    scope: '官方精选',
    count: '88,612',
    icon: <ProjectOutlined />,
  },
  {
    key: 'squad-report-merger',
    title: '小队汇报合成',
    desc: '收集多个智能体的阶段结果，去重、归并和排序，输出统一汇报稿或行动清单。',
    tags: ['结果汇总', '去重归并', '汇报生成'],
    category: '小队协作',
    scope: '官方精选',
    count: '76,904',
    icon: <FileTextOutlined />,
  },
  {
    key: 'party-material-review',
    title: '党务材料审核链',
    desc: '对党务通知、会议记录、活动方案和总结材料进行完整性、规范性与表述一致性检查。',
    tags: ['党务审核', '材料规范', '风险提示'],
    category: '审核质检',
    scope: '企业专属',
    count: '62,188',
    icon: <CheckOutlined />,
  },
  {
    key: 'teacher-ability-profile',
    title: '教师能力画像生成',
    desc: '基于教师能力清单、研修记录和评价材料，生成能力画像、短板诊断和发展建议。',
    tags: ['能力画像', '差距分析', '成长建议'],
    category: '教育教学',
    scope: '企业专属',
    count: '58,732',
    icon: <BarChartOutlined />,
  },
  {
    key: 'lesson-plan-maker',
    title: '教案课件一键生成',
    desc: '根据课标、学情和知识点，为教师智能体生成教案、课堂活动和课件大纲。',
    tags: ['教案生成', '课堂活动', '课件大纲'],
    category: '教育教学',
    scope: '官方精选',
    count: '54,930',
    icon: <FilePptOutlined />,
  },
  {
    key: 'knowledge-rag-index',
    title: '知识库索引构建',
    desc: '将制度文件、课程资料和项目文档转为可检索知识片段，便于智能体基于资料回答。',
    tags: ['知识切片', '索引生成', '引用问答'],
    category: '知识库增强',
    scope: '官方精选',
    count: '49,385',
    icon: <DatabaseOutlined />,
  },
  {
    key: 'policy-summary',
    title: '政策文件摘要',
    desc: '自动提炼政策文件中的适用对象、关键要求、时间节点和待办事项。',
    tags: ['政策解读', '要点提炼', '待办生成'],
    category: '内容生成',
    scope: '企业专属',
    count: '46,019',
    icon: <FileTextOutlined />,
  },
  {
    key: 'supervision-record',
    title: '督导听评课记录',
    desc: '为督学智能体生成听评课记录、问题清单、整改建议和跟踪反馈模板。',
    tags: ['听评课', '问题清单', '整改反馈'],
    category: '教育教学',
    scope: '企业专属',
    count: '42,377',
    icon: <ControlOutlined />,
  },
  {
    key: 'home-school-message',
    title: '家校沟通话术',
    desc: '面向班主任和家庭教育智能体，生成不同情境下的家长沟通话术和注意事项。',
    tags: ['家校沟通', '话术生成', '情绪安抚'],
    category: '内容生成',
    scope: '官方精选',
    count: '38,746',
    icon: <MessageOutlined />,
  },
  {
    key: 'training-path-recommend',
    title: '教师培训路径推荐',
    desc: '根据教师画像、岗位目标和课程库，为培训智能体推荐个性化选学路径。',
    tags: ['培训路径', '课程推荐', '进度跟踪'],
    category: '教育教学',
    scope: '官方精选',
    count: '35,804',
    icon: <FolderOutlined />,
  },
  {
    key: 'workflow-node-composer',
    title: '工作流节点编排',
    desc: '把智能体任务转换为可执行节点，生成触发条件、输入字段、处理步骤和异常分支。',
    tags: ['流程编排', '节点配置', '异常分支'],
    category: '工具调用',
    scope: '我的',
    count: '31,980',
    icon: <CodeOutlined />,
  },
  {
    key: 'table-data-diagnosis',
    title: '表格数据诊断',
    desc: '让智能体读取表格指标，自动发现异常波动、缺失字段和可解释的业务结论。',
    tags: ['指标诊断', '异常发现', '表格分析'],
    category: '数据分析',
    scope: '官方精选',
    count: '29,416',
    icon: <BarChartOutlined />,
  },
  {
    key: 'agent-output-check',
    title: '智能体输出质检',
    desc: '检查智能体回复是否偏题、遗漏约束、引用缺失或存在不适合发布的内容。',
    tags: ['输出质检', '约束检查', '人工复核'],
    category: '审核质检',
    scope: '企业专属',
    count: '27,603',
    icon: <CheckOutlined />,
  },
  {
    key: 'campus-service-faq',
    title: '校园服务问答生成',
    desc: '基于校内制度和服务流程，为校氪类智能体生成高频问答、办理指引和兜底话术。',
    tags: ['高频问答', '办理指引', '兜底话术'],
    category: '知识库增强',
    scope: '企业专属',
    count: '24,912',
    icon: <SearchOutlined />,
  },
  {
    key: 'class-affairs-reminder',
    title: '班级事务提醒器',
    desc: '把班级工作安排转换为提醒任务，生成通知文案、执行清单和跟进记录。',
    tags: ['班级管理', '提醒任务', '通知文案'],
    category: '组织管理',
    scope: '我的',
    count: '21,706',
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'elderly-course-plan',
    title: '老年教育活动设计',
    desc: '为老年教育智能体生成课程活动方案、物料清单、风险提醒和活动复盘。',
    tags: ['活动设计', '物料清单', '复盘报告'],
    category: '教育教学',
    scope: '官方精选',
    count: '19,854',
    icon: <FileImageOutlined />,
  },
  {
    key: 'agent-tool-permission',
    title: '智能体工具权限配置',
    desc: '根据智能体职责推荐可调用工具、权限边界、审批方式和使用提示。',
    tags: ['工具权限', '边界控制', '审批设置'],
    category: '工具调用',
    scope: '企业专属',
    count: '18,209',
    icon: <ControlOutlined />,
  },
  {
    key: 'agent-retrospective',
    title: '任务复盘报告',
    desc: '对智能体任务过程、调用结果和用户反馈进行复盘，沉淀可复用的优化建议。',
    tags: ['任务复盘', '质量分析', '优化建议'],
    category: '组织管理',
    scope: '我的',
    count: '15,687',
    icon: <FileTextOutlined />,
  },
];

const MARKET_PRACTICE_CATEGORIES = [
  '全部',
  '幻灯片',
  '深度研究',
  '数据分析',
  '产品原型',
  '日常办公',
  '图像生成',
];

const MARKET_BEST_PRACTICES = [
  {
    key: 'party-agent-portrait',
    title: '党务智能体画像与职责边界设计',
    category: '日常办公',
    agent: '党务智能体',
    visual: 'profile',
    size: 'medium',
    color: '#f59e0b',
    heat: 9820,
    fresh: 12,
    preview: ['会议材料', '活动方案', '归档提醒'],
  },
  {
    key: 'party-review-flow',
    title: '党务材料审核助手的三步质检流程',
    category: '日常办公',
    agent: '党务工作智能审核助手',
    visual: 'workflow',
    size: 'short',
    color: '#ef6c5b',
    heat: 9124,
    fresh: 18,
    preview: ['格式核查', '要点校验', '风险提示'],
  },
  {
    key: 'teacher-growth-report',
    title: '高校教师能力画像分析报告',
    category: '深度研究',
    agent: '师能智绘助手',
    visual: 'report',
    size: 'tall',
    color: '#4f7cff',
    heat: 8951,
    fresh: 23,
    preview: ['能力维度', '短板诊断', '成长路径'],
  },
  {
    key: 'squad-summary-board',
    title: '智能体小队任务分工与汇总看板',
    category: '数据分析',
    agent: '智能体小队',
    visual: 'board',
    size: 'medium',
    color: '#20c7a8',
    heat: 8732,
    fresh: 8,
    preview: ['队长拆解', '成员协同', '统一汇报'],
  },
  {
    key: 'supervision-weekly',
    title: '督学智能体工作周报生成',
    category: '日常办公',
    agent: '智慧教育督导平台',
    visual: 'document',
    size: 'tall',
    color: '#377ef4',
    heat: 8429,
    fresh: 31,
    preview: ['听评课', '问题清单', '整改跟踪'],
  },
  {
    key: 'class-parent-message',
    title: '班主任智能体家校沟通案例库',
    category: '日常办公',
    agent: '班主任智能体“班小助”',
    visual: 'chat',
    size: 'short',
    color: '#f26ca7',
    heat: 8068,
    fresh: 15,
    preview: ['情绪安抚', '问题反馈', '协同建议'],
  },
  {
    key: 'school-knowledge-qa',
    title: '校氪知识库问答搭建实录',
    category: '产品原型',
    agent: '校氪',
    visual: 'cards',
    size: 'medium',
    color: '#8b5cf6',
    heat: 7920,
    fresh: 44,
    preview: ['制度切片', '引用问答', '兜底话术'],
  },
  {
    key: 'k12-lesson-agent',
    title: '中小学教师智能体生成一节 AI 融合课',
    category: '幻灯片',
    agent: '中小学教师智能体',
    visual: 'poster',
    size: 'medium',
    color: '#14b8c4',
    heat: 7716,
    fresh: 26,
    preview: ['教学目标', '课堂活动', '评价任务'],
  },
  {
    key: 'principal-data-dashboard',
    title: '中小学校长智能体的校情数据看板',
    category: '数据分析',
    agent: '中小学校长智能体',
    visual: 'dashboard',
    size: 'short',
    color: '#22c55e',
    heat: 7464,
    fresh: 35,
    preview: ['质量分析', '风险预警', '治理建议'],
  },
  {
    key: 'training-path',
    title: 'AI 选学培训项目的个性化路径推荐',
    category: '数据分析',
    agent: 'AI 选学培训项目',
    visual: 'timeline',
    size: 'medium',
    color: '#6366f1',
    heat: 7240,
    fresh: 7,
    preview: ['能力诊断', '课程推荐', '学习跟踪'],
  },
  {
    key: 'moral-activity-plan',
    title: '职业学校德育活动从主题到执行清单',
    category: '日常办公',
    agent: '德育工作智能助手“职小班”',
    visual: 'calendar',
    size: 'short',
    color: '#fb7185',
    heat: 6902,
    fresh: 39,
    preview: ['主题设计', '过程记录', '育人案例'],
  },
  {
    key: 'tongda-product-story',
    title: '通答教学平台智能体产品说明页',
    category: '产品原型',
    agent: '通答人工智能教学平台',
    visual: 'product',
    size: 'medium',
    color: '#0ea5e9',
    heat: 6680,
    fresh: 20,
    preview: ['能力地图', '应用路径', '案例呈现'],
  },
  {
    key: 'family-education-script',
    title: '家庭教育智能体的亲子沟通脚本',
    category: '日常办公',
    agent: '家庭教育智能体',
    visual: 'chat',
    size: 'medium',
    color: '#f97316',
    heat: 6412,
    fresh: 42,
    preview: ['场景识别', '沟通建议', '行动约定'],
  },
  {
    key: 'elderly-course-card',
    title: '老年教育智能体活动卡片生成',
    category: '图像生成',
    agent: '老年教育智能体',
    visual: 'poster',
    size: 'short',
    color: '#a855f7',
    heat: 6198,
    fresh: 11,
    preview: ['活动海报', '课程安排', '报名提示'],
  },
  {
    key: 'agri-electric-faq',
    title: '“农电通”AI 智能体服务问答台账',
    category: '日常办公',
    agent: '“农电通”AI智能体',
    visual: 'document',
    size: 'medium',
    color: '#84cc16',
    heat: 5965,
    fresh: 55,
    preview: ['业务办理', '用电咨询', '服务记录'],
  },
  {
    key: 'agent-safe-output',
    title: '智能体输出质检与人工复核模板',
    category: '日常办公',
    agent: '智能体质检',
    visual: 'checklist',
    size: 'medium',
    color: '#64748b',
    heat: 5728,
    fresh: 28,
    preview: ['事实核验', '风险分级', '复核建议'],
  },
  {
    key: 'agent-resource-citation',
    title: '让知识库回答带上资料引用',
    category: '深度研究',
    agent: '知识库问答智能体',
    visual: 'report',
    size: 'tall',
    color: '#06b6d4',
    heat: 5480,
    fresh: 33,
    preview: ['引用定位', '证据摘要', '答案合成'],
  },
  {
    key: 'meeting-agent-minutes',
    title: '会议智能体自动生成纪要与待办',
    category: '日常办公',
    agent: '党务材料协作小队',
    visual: 'timeline',
    size: 'short',
    color: '#f59e0b',
    heat: 5312,
    fresh: 63,
    preview: ['议题提炼', '责任人', '截止时间'],
  },
  {
    key: 'agent-workbench-screen',
    title: '智能体工作台首屏信息架构',
    category: '产品原型',
    agent: '智能体',
    visual: 'dashboard',
    size: 'medium',
    color: '#3b82f6',
    heat: 5069,
    fresh: 49,
    preview: ['入口分组', '任务推荐', '上下文选择'],
  },
  {
    key: 'data-agent-chart',
    title: '数据分析智能体生成经营诊断图表',
    category: '数据分析',
    agent: '数据分析师',
    visual: 'chart',
    size: 'short',
    color: '#10b981',
    heat: 4893,
    fresh: 58,
    preview: ['指标拆解', '趋势判断', '行动建议'],
  },
  {
    key: 'teacher-team-review',
    title: '教师发展小队月度复盘材料',
    category: '幻灯片',
    agent: '高校教师发展小队',
    visual: 'board',
    size: 'tall',
    color: '#7c3aed',
    heat: 4635,
    fresh: 73,
    preview: ['进展同步', '问题归因', '下月计划'],
  },
  {
    key: 'image-agent-poster',
    title: '智能体生成校园活动主视觉',
    category: '图像生成',
    agent: '图像生成技能',
    visual: 'poster',
    size: 'medium',
    color: '#ec4899',
    heat: 4388,
    fresh: 66,
    preview: ['主题提炼', '视觉风格', '海报文案'],
  },
];

const INITIAL_AGENT_DATA = [
  {
    key: 'party-affairs',
    name: '党务智能体',
    desc: '辅助党务通知、会议材料、活动方案和党建资料整理。',
  },
  {
    key: 'party-review',
    name: '党务工作智能审核助手',
    desc: '用于党务材料初审、要点核查和规范性提示。',
  },
  {
    key: 'counselor-agent',
    name: '辅导员智能体',
    desc: '支持学生管理、谈心谈话、通知提醒和过程记录。',
  },
  {
    key: 'college-cadre-position',
    name: '高校干部岗位智能体',
    desc: '面向高校干部岗位职责、履职评价和岗位能力建设。',
  },
  {
    key: 'college-teacher',
    name: '高校教师智能体',
    desc: '服务高校教师教学、科研、教改和成长发展场景。',
  },
  {
    key: 'school-nucleus',
    name: '校氪',
    desc: '围绕学校日常运营提供信息问答、材料生成和协同辅助。',
  },
  {
    key: 'teacher-ability-map',
    name: '师能智绘助手——基于高职学校教师能力清单绘制工作',
    desc: '基于教师能力清单生成画像、差距分析和发展建议。',
  },
  {
    key: 'vocational-moral-education',
    name: '职业学校德育工作智能助手“职小班”',
    desc: '支持职业学校德育活动设计、班级管理和育人案例沉淀。',
  },
  {
    key: 'k12-principal',
    name: '中小学校长智能体',
    desc: '辅助校长开展学校治理、质量分析和发展规划。',
  },
  {
    key: 'k12-teacher',
    name: '中小学教师智能体',
    desc: '支持备课、作业设计、课堂活动和教学反思。',
  },
  {
    key: 'ai-teacher-training',
    name: '人工智能赋能中小学教师智能选学培训项目',
    desc: '围绕教师 AI 选学培训提供路径规划、资源推荐和过程跟进。',
  },
  {
    key: 'class-teacher-helper',
    name: '班主任智能体“班小助”——全场景智慧教育智能体',
    desc: '服务班主任家校沟通、班级管理、学生成长和事务提醒。',
  },
  {
    key: 'elderly-education',
    name: '老年教育智能体',
    desc: '辅助老年教育课程设计、活动组织和学习支持。',
  },
  {
    key: 'tongda-ai-teaching',
    name: '通答人工智能教学平台',
    desc: '提供 AI 教学平台能力问答、方案介绍和应用指引。',
  },
  {
    key: 'family-education',
    name: '家庭教育智能体',
    desc: '面向家庭教育咨询、亲子沟通和成长陪伴提供建议。',
  },
  {
    key: 'elderly-agent',
    name: '老年智能体',
    desc: '面向老年服务场景提供陪伴问答、服务引导和信息提醒。',
  },
  {
    key: 'education-supervision',
    name: '智慧教育督导平台（督学智能体）',
    desc: '支持教育督导资料梳理、现场记录和整改跟踪。',
  },
  {
    key: 'agri-electric',
    name: '“农电通”AI智能体',
    desc: '面向农业用电、服务咨询和业务办理提供智能辅助。',
  },
];

const AGENT_CARDS = INITIAL_AGENT_DATA.map((agent, index) => ({
  tag: index % 3 === 0 ? '组织' : '团队',
  tagTone: index % 3 === 0 ? 'purple' : 'muted',
  avatar: index % 2 === 0 ? 'personal' : 'coach',
  ...agent,
}));

const COMPOSER_EXTRA_AGENTS = [];

const COMPOSER_TEAM_OPTIONS = [
  {
    key: 'party-work-squad',
    name: '党务材料协作小队',
    desc: '面向党建活动、党务材料和流程审核的日常协作小队。',
    avatarColor: '#f59e0b',
    memberKeys: ['party-affairs', 'party-review', 'school-nucleus'],
    leaderKey: 'party-affairs',
    memberNotes: {
      'party-affairs': '负责党建通知、会议材料、活动方案和归档材料的统筹起草。',
      'party-review': '负责对党务材料进行规范性、完整性和表述风险初审。',
      'school-nucleus': '负责补充学校运营口径、校内制度和协同事项提醒。',
    },
    instruction: '党务智能体作为队长接收需求并拆解材料类型，党务审核助手负责规范校验，校氪补充学校运营口径，最终由队长汇总为可提交版本。',
  },
  {
    key: 'college-teacher-development-squad',
    name: '高校教师发展小队',
    desc: '聚焦高校教师成长、能力画像、岗位职责和督导反馈闭环。',
    avatarColor: '#4f7cff',
    memberKeys: ['college-teacher', 'teacher-ability-map', 'college-cadre-position', 'education-supervision'],
    leaderKey: 'college-teacher',
    memberNotes: {
      'college-teacher': '负责统筹高校教师教学、科研、教改和发展场景需求。',
      'teacher-ability-map': '负责生成教师能力画像、差距分析和成长建议。',
      'college-cadre-position': '负责补充岗位职责、履职评价和干部能力要求。',
      'education-supervision': '负责引入督导视角，形成问题清单和改进闭环。',
    },
    instruction: '高校教师智能体先明确发展目标和对象，师能智绘助手输出能力画像，干部岗位智能体补充岗位要求，督学智能体形成诊断和整改建议。',
  },
  {
    key: 'k12-ai-teaching-squad',
    name: '中小学 AI 教研小队',
    desc: '服务中小学课堂教学、校本教研、教师培训和班级应用场景。',
    avatarColor: '#20c7a8',
    memberKeys: ['k12-principal', 'k12-teacher', 'ai-teacher-training', 'class-teacher-helper'],
    leaderKey: 'k12-principal',
    memberNotes: {
      'k12-principal': '负责学校治理视角、实施路径和阶段目标统筹。',
      'k12-teacher': '负责备课、作业、课堂活动和教学反思等一线教学设计。',
      'ai-teacher-training': '负责 AI 选学培训路径、资源推荐和学习过程跟进。',
      'class-teacher-helper': '负责班级管理、家校沟通和学生成长支持场景补充。',
    },
    instruction: '中小学校长智能体担任队长，先确定学校层面的目标和约束，再由教师、培训和班主任智能体分别产出教学方案、培训安排和班级应用建议。',
  },
  {
    key: 'moral-classroom-squad',
    name: '德育与班主任协作小队',
    desc: '围绕德育活动、班级治理、学生支持和家校沟通开展协作。',
    avatarColor: '#f26ca7',
    memberKeys: ['vocational-moral-education', 'class-teacher-helper', 'counselor-agent', 'family-education'],
    leaderKey: 'vocational-moral-education',
    memberNotes: {
      'vocational-moral-education': '负责德育主题、活动设计、育人案例和职业学校场景统筹。',
      'class-teacher-helper': '负责班级事务、家校沟通和学生成长陪伴方案。',
      'counselor-agent': '负责学生管理、谈心谈话和过程记录建议。',
      'family-education': '负责家庭教育、亲子沟通和家校协同建议。',
    },
    instruction: '德育智能助手先确定育人目标和活动主线，班主任与辅导员智能体补充班级执行方案，家庭教育智能体完善家校协同话术和注意事项。',
  },
  {
    key: 'lifelong-education-service-squad',
    name: '终身教育服务小队',
    desc: '面向老年教育、家庭教育和社区学习服务的咨询支持小队。',
    avatarColor: '#8b5cf6',
    memberKeys: ['elderly-education', 'elderly-agent', 'family-education'],
    leaderKey: 'elderly-education',
    memberNotes: {
      'elderly-education': '负责老年教育课程、活动组织和学习支持方案。',
      'elderly-agent': '负责老年服务咨询、陪伴问答和生活信息提醒。',
      'family-education': '负责家庭关系、亲子沟通和跨代协同建议。',
    },
    instruction: '老年教育智能体统筹学习服务目标，老年智能体补充服务触点和陪伴问答，家庭教育智能体完善家庭支持与沟通建议。',
  },
  {
    key: 'smart-platform-operation-squad',
    name: '智慧教学平台运营小队',
    desc: '支持智慧教育平台介绍、应用落地、督导反馈和服务问答。',
    avatarColor: '#377ef4',
    memberKeys: ['tongda-ai-teaching', 'education-supervision', 'school-nucleus', 'agri-electric'],
    leaderKey: 'tongda-ai-teaching',
    memberNotes: {
      'tongda-ai-teaching': '负责 AI 教学平台能力介绍、应用指引和方案包装。',
      'education-supervision': '负责从督导视角梳理评价指标、整改记录和反馈闭环。',
      'school-nucleus': '负责结合学校运营场景补充落地流程和协作节点。',
      'agri-electric': '负责公共服务咨询、业务办理和基层服务场景参考。',
    },
    instruction: '通答人工智能教学平台作为队长梳理平台能力和应用路径，督学智能体补充评价反馈，校氪完善校内落地流程，农电通提供基层服务问答场景参考。',
  },
];

const SQUAD_AVATAR_OPTIONS = [
  { key: 'orange', color: '#f59e0b' },
  { key: 'blue', color: '#4f7cff' },
  { key: 'rose', color: '#f26ca7' },
  { key: 'violet', color: '#8b5cf6' },
  { key: 'cyan', color: '#2fb7d3' },
  { key: 'olive', color: '#b5bf42' },
  { key: 'green', color: '#3f9f68' },
  { key: 'red', color: '#ff5b5f' },
  { key: 'coral', color: '#ff8a3d' },
  { key: 'magenta', color: '#c65be8' },
  { key: 'indigo', color: '#6675f0' },
  { key: 'royal', color: '#377ef4' },
  { key: 'lime', color: '#76b900' },
  { key: 'teal', color: '#20c7a8' },
];

const DEFAULT_PROJECTS = [
  {
    key: 'project-xx-training',
    name: 'XX小学培训',
    instruction: '围绕小学 AI 培训沉淀任务、资料与项目上下文。',
    createdAt: '创建于 昨天 10:54',
    status: '进行中',
    color: '#20c7a8',
    agents: ['中小学教师智能体', 'AI 选学培训项目', '班主任智能体“班小助”'],
  },
  {
    key: 'project-party-materials',
    name: '党务材料协作与审核',
    instruction: '由党务智能体统筹材料起草，审核助手完成规范性检查和归档建议。',
    createdAt: '更新于 今天 09:20',
    status: '待审核',
    color: '#f59e0b',
    agents: ['党务智能体', '党务工作智能审核助手', '党务材料协作小队'],
  },
  {
    key: 'project-teacher-portrait',
    name: '教师能力画像与发展建议',
    instruction: '结合教师能力清单、督导反馈和岗位要求生成画像、差距分析及成长路径。',
    createdAt: '更新于 昨天 18:12',
    status: '分析中',
    color: '#4f7cff',
    agents: ['师能智绘助手', '高校教师智能体', '智慧教育督导平台'],
  },
  {
    key: 'project-supervision-rectify',
    name: '智慧教育督导整改闭环',
    instruction: '沉淀督导记录、问题清单、整改任务和复盘报告，支持督学智能体持续跟进。',
    createdAt: '创建于 8月18日 15:40',
    status: '跟进中',
    color: '#377ef4',
    agents: ['智慧教育督导平台', '校氪', '中小学校长智能体'],
  },
  {
    key: 'project-k12-ai-lesson',
    name: '中小学 AI 教研共创',
    instruction: '围绕课堂活动、作业设计和校本教研任务，让教师智能体与校长智能体协同推进。',
    createdAt: '创建于 8月17日 11:08',
    status: '共创中',
    color: '#8b5cf6',
    agents: ['中小学教师智能体', '中小学校长智能体', '中小学 AI 教研小队'],
  },
  {
    key: 'project-class-growth',
    name: '班级成长与家校沟通',
    instruction: '组织班级通知、学生成长记录、家校沟通话术和主题班会材料。',
    createdAt: '更新于 8月16日 16:30',
    status: '进行中',
    color: '#f26ca7',
    agents: ['班主任智能体“班小助”', '辅导员智能体', '家庭教育智能体'],
  },
  {
    key: 'project-lifelong-service',
    name: '老年教育服务支持',
    instruction: '围绕老年教育课程、社区活动、学员关怀和服务问答建立项目上下文。',
    createdAt: '创建于 8月15日 10:06',
    status: '筹备中',
    color: '#c65be8',
    agents: ['老年教育智能体', '老年智能体', '终身教育服务小队'],
  },
  {
    key: 'project-platform-operation',
    name: '智慧教学平台运营落地',
    instruction: '沉淀平台介绍、应用场景、培训材料、反馈问题和运营报告。',
    createdAt: '更新于 8月14日 14:28',
    status: '运营中',
    color: '#20a7d8',
    agents: ['通答人工智能教学平台', '智慧教学平台运营小队', '校氪'],
  },
];

const CREATE_AGENT_OPTIONS = [
  {
    key: 'team',
    title: '团队智能体',
    desc: '团队专属智能体，聚焦多人协作场景，高效沉淀团队知识，跨群共享上下文',
    action: '添加',
    image: 'team',
    primary: true,
  },
  {
    key: 'market',
    title: '去专家市场逛逛',
    desc: '市场运营、文案编写、内容生成、人事行政、产品研发等等，各领域的专家等你招募',
    action: '浏览专家市场',
    image: 'market',
  },
];

const TEAM_AGENT_AVATARS = [
  { key: 'avatar-1', type: 'personal' },
  { key: 'avatar-2', type: 'coach' },
  { key: 'avatar-3', type: 'personal' },
  { key: 'avatar-4', type: 'coach' },
  { key: 'avatar-5', type: 'personal' },
  { key: 'avatar-6', type: 'coach' },
  { key: 'avatar-7', type: 'personal' },
  { key: 'avatar-8', type: 'personal' },
  { key: 'avatar-9', type: 'coach' },
];

const AGENT_EDITOR_TABS = ['档案', '技能', '知识', '模型', '管理'];
const AGENT_EDITOR_SKILLS = ['飞书卡片生成', '用户工作画像', '技能调试优化', 'AI生成技能'];
const BUILT_IN_AGENT_KEY = 'personal';
const BUILT_IN_AGENT_TABS = ['人设', '产物', '技能', '模型', '安全'];
const BUILT_IN_AGENT_ARCHIVE_TABS = ['智能体档案', '用户档案', '行为准则'];
const DEFAULT_AGENT_INSTRUCTION_MARKDOWN = `## 角色定位

- 你是团队协作场景下的通用协作角色，可响应团队成员的各类常规咨询与协作需求，交付清晰明确的反馈结果。

## 工作职责

1. 需求响应：接收团队成员提出的合法合理问题与协作请求，快速给出明确回应。
2. 信息核实：对信息不明确的需求，第一时间向提出人确认补充信息，不随意臆断。
3. 结果反馈：完成需求处理后及时同步给相关人员，确保信息同步无遗漏。

## 行为约束

禁止编造未明确提供的信息、功能与权限，所有不确定的内容需先向用户确认，不做超出常规协作范围的承诺。`;

const SKILL_PACKS = [
  {
    key: 'investment',
    title: '投资分析技能包',
    desc: '适用于投资研究、二级市场跟踪和上市公司分析等场景，可查询 A 股、港股和美股行情。',
    tags: ['股票行情查询', '股票打板筛选', '金融新闻聚合'],
    count: '3,667',
  },
  {
    key: 'research',
    title: '行业研究技能包',
    desc: '行业研究、经营诊断、用户洞察和数据运营，可围绕市场与竞争格局开展调研。',
    tags: ['行业研究分析', '用户研究洞察', '趋势解读'],
    count: '7,011',
  },
  {
    key: 'content',
    title: '内容创作技能包',
    desc: '内容运营、品牌传播和社媒增长。可完成热点洞察、脚本生成与内容改写。',
    tags: ['爆款选题助手', '社媒爆文', '短视频开头'],
    count: '4,812',
  },
];

const SKILL_MARKET_CATEGORIES = ['官方精选', '内容创作', '通用工具', '营销运营', '产品研发', '数据分析', '组织管理', '金融法律'];

const SKILL_MARKET_ITEMS = [
  {
    key: 'feishu-card',
    title: '飞书卡片生成',
    desc: '根据用户的自然语言诉求生成有效的飞书 Lark 互动卡片 JSON，用户可实时生成创建设计卡片。',
    tags: ['工程研发', '编程'],
    count: '4,303,970',
    icon: <FilePptOutlined />,
  },
  {
    key: 'text-polish',
    title: '去除文本 AI 痕迹',
    desc: '识别和去除 AI 生成文本的痕迹，使文字听起来更自然、更有质感。',
    tags: ['去AI味', '自然改写', '内容创作'],
    count: '37,690',
    icon: <EditOutlined />,
  },
  {
    key: 'product-brainstorm',
    title: '产品需求共创',
    desc: '在实现任何需求之前，用于讨论、规划和设计方案，包括需求梳理、方案共创和风险识别。',
    tags: ['需求评审', '方案对比', '产品研发'],
    count: '23,448',
    icon: <ProductOutlined />,
  },
  {
    key: 'whiteboard',
    title: '飞书画板大师',
    desc: '使用 35 种精选配色风格生成美观、可编辑的飞书画板，适合视觉化表达。',
    tags: ['飞书画板', '图形生成', '产品研发'],
    count: '19,935',
    icon: <FileImageOutlined />,
  },
  {
    key: 'insight-collection',
    title: '用户洞察提炼',
    desc: '通过主题分析、亲和图分析法，帮助提炼用户反馈和调研信息。',
    tags: ['用户洞察', '访谈总结', '产品研发'],
    count: '16,228',
    icon: <SearchOutlined />,
  },
  {
    key: 'html-slides',
    title: '精美HTML幻灯片生成',
    desc: '从 32 款精美 HTML 模板中自动匹配风格，一键生成高颜值演示幻灯片。',
    tags: ['PPT生成', 'HTML幻灯片', '产品研发'],
    count: '15,774',
    icon: <FilePptOutlined />,
  },
  {
    key: 'marketing-copy',
    title: '营销文案撰写',
    desc: '用于分任务撰写品牌稿、改写软文化营销文案，包括首页、海报页和活动页。',
    tags: ['落地页文案', 'CTA转化', '营销运营'],
    count: '15,574',
    icon: <EditOutlined />,
  },
  {
    key: 'content-planning',
    title: '内容选题规划',
    desc: '用于规划内容策略，决定创作方向和选题主题，帮助提升内容传播。',
    tags: ['内容选题', '选题规划', '营销运营'],
    count: '12,907',
    icon: <FolderOutlined />,
  },
  {
    key: 'slide-ppt',
    title: '飞书幻灯片 PPT',
    desc: '将用户输入的材料文档、会议纪要、调研资料，方案草稿快速生成演示材料。',
    tags: ['文档转PPT', '模板生成幻灯片', '内容创作'],
    count: '10,876',
    icon: <FilePptOutlined />,
  },
];

const BUILTIN_SKILL_META = {
  飞书卡片生成: {
    desc: '根据用户的自然语言诉求生成有效的飞书/Lark 互动卡片 JSON，用户要求生成/创建/设计卡片时可直接使用。',
    source: '内置',
    icon: <FilePptOutlined />,
  },
  用户工作画像: {
    desc: '基于用户的多维度信息（飞书文档、会议记录、聊天记录及持久化记忆）分析个人特质、偏好和工作方式。',
    source: '内置',
    icon: <ProductOutlined />,
  },
  技能调试优化: {
    desc: '用于检查、测试或优化某个技能。包括验证技能描述是否能被正确触发、优化描述表达和补齐关键参数。',
    source: '内置',
    icon: <ThunderboltOutlined />,
  },
  AI生成技能: {
    desc: '帮助用户创建和更新技能，扩展 aily 工作助手的功能。',
    source: '内置',
    icon: <RobotOutlined />,
  },
};

function getAgentSkillMeta(skillName) {
  const builtIn = BUILTIN_SKILL_META[skillName];
  if (builtIn) {
    return {
      title: skillName,
      ...builtIn,
    };
  }

  const marketSkill = SKILL_MARKET_ITEMS.find((item) => item.title === skillName);
  if (marketSkill) {
    return {
      title: marketSkill.title,
      desc: marketSkill.desc,
      source: '开源',
      icon: marketSkill.icon,
    };
  }

  return {
    title: skillName,
    desc: '用于处理当前智能体的扩展任务，按需为团队协作提供额外能力支持。',
    source: '开源',
    icon: <ThunderboltOutlined />,
  };
}

const AGENT_MODEL_OPTIONS = [
  { key: 'auto', name: 'Auto', rate: '', tone: 'auto' },
  { key: 'doubao-seed', name: 'Doubao-Seed-2.1-turbo', rate: 'x0.38', tone: 'doubao' },
  { key: 'deepseek-v4', name: 'DeepSeek-V4-Pro', rate: 'x0.86', tone: 'deepseek' },
  { key: 'kimi-k3', name: 'Kimi-K3', rate: 'x1.35', tone: 'kimi', badge: '模型上新', badgeTone: 'green' },
  { key: 'kimi-k26', name: 'Kimi-K2.6', rate: 'x0.73', tone: 'kimi' },
  { key: 'glm-52', name: 'GLM-5.2', rate: 'x0.74', tone: 'glm', badge: '旗舰效果', badgeTone: 'purple' },
  { key: 'minimax-m3', name: 'MiniMax-M3', rate: 'x0.25', tone: 'minimax', badge: '高性价比', badgeTone: 'blue' },
  { key: 'qwen-38', name: 'Qwen-3.8-max', rate: 'x0.76', tone: 'qwen', badge: '模型上新', badgeTone: 'green' },
  { key: 'qwen-37', name: 'Qwen-3.7-max', rate: 'x0.68', tone: 'qwen' },
];

const SECTION_COPY = {
  automation: {
    title: '自动化',
    description: '把重复任务沉淀成可执行流程，让 Lucky 帮你自动推进。',
    cards: [
      { title: '消息提醒', desc: '按时间、状态和负责人触发后续动作。', accent: 'blue' },
      { title: '资料归档', desc: '自动整理任务产物并保存到资源库。', accent: 'green' },
      { title: '进度同步', desc: '把项目节点同步到相关团队。', accent: 'gold' },
    ],
  },
  partners: {
    title: '智能体',
    description: '管理可协作的智能体，按任务选择最合适的角色。',
    cards: [
      { title: '教案协作者', desc: '辅助梳理目标、活动和板书设计。', accent: 'blue' },
      { title: '资源整理员', desc: '负责筛选、命名与结构化归档资料。', accent: 'green' },
      { title: '课堂复盘官', desc: '基于记录自动生成课后复盘。', accent: 'gold' },
    ],
  },
  projects: {
    title: '项目',
    description: '围绕真实业务创建工作项目，集中管理任务、资料和输出。',
    cards: [
      { title: 'AI 培训项目', desc: '适合课程、通知、作业和评估一体推进。', accent: 'blue' },
      { title: '市场研究项目', desc: '汇总资料、调研问题和阶段性报告。', accent: 'green' },
      { title: '产品原型项目', desc: '沉淀需求、页面和演示材料。', accent: 'gold' },
    ],
  },
  market: {
    title: '市场',
    description: '浏览可复用的专家智能体与技能模板。',
    cards: [
      { title: '深度研究助手', desc: '快速生成调研框架、资料清单和分析报告。', accent: 'blue' },
      { title: '数据可视化技能', desc: '把表格数据转换成可读图表和结论。', accent: 'green' },
      { title: '会议材料生成', desc: '按会议目标自动组织议程和 PPT。', accent: 'gold' },
    ],
  },
};

const LIBRARY_ROW_TEMPLATES = [
  { title: 'AI评课·动物王国开大会', source: '通用智能体', scope: '全部来源', type: '其他' },
  { title: 'AI评课·动物王国开大会', source: '通用智能体', scope: '组织库', type: '其他' },
  { title: 'AI评课·动物王国开大会5M', source: '通用智能体', scope: '组织库', type: '其他' },
  { title: 'AI评课·小象危险尾巴', source: '通用智能体', scope: '个人库', type: '其他' },
  { title: 'AI评课·专题报告：从认知到实践：赋能中小学人工智...', source: '通用智能体', scope: '共享库', type: '其他' },
  { title: 'AI评课·小象危险尾巴', source: '学海导航者', scope: '个人库', type: '其他' },
  { title: '大学四年规划指南.md', source: '学海导航者', scope: '个人库', type: '文档' },
  { title: 'SKILL.md', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'course-ai-1hour.md', source: '通用智能体', scope: '个人库', type: '文档' },
  { title: 'course-ai.md', source: '通用智能体', scope: '个人库', type: '文档' },
  { title: 'course-ai-60min.md', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'course-ai.md', source: '通用智能体', scope: '共享库', type: '文档' },
  { title: 'AI评课·动物王国开大会', source: '小助手', scope: '全部来源', type: '其他' },
  { title: '模型训练指南.docx', source: '通用智能体', scope: '共享库', type: '文档' },
  { title: 'ai_education_courseware.html', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'ai_education_courseware.html', source: '通用智能体', scope: '组织库', type: '文档' },
];

const SOURCE_OPTIONS = [
  { label: '全部来源', value: 'all' },
  { label: '通用智能体', value: '通用智能体' },
  { label: '学海导航者', value: '学海导航者' },
  { label: '小助手', value: '小助手' },
];

const SCOPE_OPTIONS = [
  { label: '全部来源', value: 'all' },
  { label: '个人库', value: '个人库' },
  { label: '组织库', value: '组织库' },
  { label: '共享库', value: '共享库' },
];

function buildLibraryRows() {
  return Array.from({ length: 42 }, (_, index) => {
    const template = LIBRARY_ROW_TEMPLATES[index % LIBRARY_ROW_TEMPLATES.length];
    const cycle = Math.floor(index / LIBRARY_ROW_TEMPLATES.length);
    const day = Math.max(1, 22 - cycle);
    const hour = String((18 - (index % 9) + 24) % 24).padStart(2, '0');
    const minute = String((5 + index * 7) % 60).padStart(2, '0');
    const second = String((12 + index * 13) % 60).padStart(2, '0');
    return {
      id: `lucky-library-${index + 1}`,
      ...template,
      time: `2026-06-${String(day).padStart(2, '0')} ${hour}:${minute}:${second}`,
    };
  });
}

const LIBRARY_ROWS = buildLibraryRows();

function StatCard({ title, value, hint }) {
  return (
    <div className="lucky-stat-card">
      <div className="lucky-stat-title">{title}</div>
      <div className="lucky-stat-value">{value}</div>
      <div className="lucky-stat-hint">{hint}</div>
    </div>
  );
}

function ShowcaseSection({ title, description, cards }) {
  return (
    <div className="lucky-placeholder-view">
      <div className="lucky-placeholder-header">
        <div className="lucky-page-title">{title}</div>
        <div className="lucky-page-subtitle">{description}</div>
      </div>
      <div className="lucky-showcase-grid">
        {cards.map((card) => (
          <div key={card.title} className={`lucky-showcase-card lucky-showcase-card-${card.accent}`}>
            <div className="lucky-showcase-title">{card.title}</div>
            <div className="lucky-showcase-desc">{card.desc}</div>
            <button
              type="button"
              className="lucky-showcase-action"
              onClick={() => message.success(`已打开：${card.title}`)}
            >
              打开
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketAvatar({ tone, label }) {
  const initial = label?.slice(0, 1) || '专';
  return (
    <span className={`lucky-market-avatar lucky-market-avatar-${tone}`} aria-hidden="true">
      <span>{initial}</span>
    </span>
  );
}

function MarketRankingCard({ card }) {
  return (
    <section className={`lucky-market-ranking-card lucky-market-ranking-${card.tone}`} aria-label={card.title}>
      <div className="lucky-market-ranking-copy">
        <div className="lucky-market-ranking-title">
          <h2>{card.title}</h2>
          {card.badge ? <span>{card.badge}</span> : null}
        </div>
        <p>{card.desc}</p>
      </div>

      <div className="lucky-market-ranking-icon">{card.icon}</div>

      <div className="lucky-market-ranking-list">
        {card.items.map((item) => (
          <button
            key={item.name}
            type="button"
            className="lucky-market-ranking-row"
            onClick={() => message.success(`已打开专家：${item.name}`)}
          >
            <MarketAvatar tone={item.avatar} label={item.name} />
            <span>{item.name}</span>
            <em>{item.category}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function MarketSkillBanner({ banner }) {
  return (
    <button
      type="button"
      className={`lucky-market-skill-banner lucky-market-skill-banner-${banner.tone}`}
      onClick={() => message.info(banner.title)}
    >
      <span className="lucky-market-skill-banner-copy">
        <strong>{banner.title}</strong>
        <span>{banner.desc}</span>
        <em>
          {banner.action}
          <RightOutlined />
        </em>
      </span>
      <span className="lucky-market-skill-banner-art" aria-hidden="true">
        {banner.icon}
        <i />
        <b />
      </span>
    </button>
  );
}

function MarketSkillPackCard({ pack }) {
  return (
    <article className="lucky-market-skill-pack-card">
      <div className="lucky-market-skill-pack-top">
        <div>
          <h3>{pack.title}</h3>
          <p>{pack.desc}</p>
        </div>
        <button type="button" onClick={() => message.success(`已添加：${pack.title}`)}>
          一键添加
        </button>
      </div>
      <div className="lucky-market-skill-pack-foot">
        <span>Skill Pack</span>
        <div>
          {pack.tags.map((tag) => <em key={tag}>{tag}</em>)}
        </div>
        <strong>{pack.count}</strong>
      </div>
    </article>
  );
}

function MarketSkillCard({ skill }) {
  return (
    <article className="lucky-market-skill-card">
      <div className="lucky-market-skill-card-head">
        <span className="lucky-market-skill-card-icon" aria-hidden="true">{skill.icon}</span>
        <div>
          <h3>{skill.title}</h3>
          <p>{skill.category}</p>
        </div>
        <button type="button" onClick={() => message.success(`已添加：${skill.title}`)}>
          添加
        </button>
      </div>
      <p className="lucky-market-skill-card-desc">{skill.desc}</p>
      <div className="lucky-market-skill-card-tags">
        {skill.tags.map((tag) => <span key={tag}>{tag}</span>)}
        <strong>{skill.count}</strong>
      </div>
    </article>
  );
}

function MarketSkillPage({
  searchText,
  activeScope,
  activeCategory,
  onScopeChange,
  onCategoryChange,
}) {
  const visibleSkills = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return MARKET_SKILL_ITEMS.filter((skill) => {
      if (activeScope !== '全部' && skill.scope !== activeScope) return false;
      if (activeCategory !== '官方精选' && skill.category !== activeCategory) return false;
      if (!normalizedSearch) return true;
      return `${skill.title} ${skill.desc} ${skill.category} ${skill.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
    });
  }, [activeCategory, activeScope, searchText]);

  return (
    <div className="lucky-market-skill-view">
      <div className="lucky-market-skill-banners">
        {MARKET_SKILL_BANNERS.map((banner) => (
          <MarketSkillBanner key={banner.key} banner={banner} />
        ))}
      </div>

      <div className="lucky-market-skill-scope" aria-label="技能范围">
        {MARKET_SKILL_SCOPES.map((scope) => (
          <button
            key={scope}
            type="button"
            className={activeScope === scope ? 'is-active' : ''}
            onClick={() => onScopeChange(scope)}
          >
            {scope}
          </button>
        ))}
      </div>

      <section className="lucky-market-skill-section" aria-label="精选技能包">
        <div className="lucky-market-skill-section-head">
          <span>精选技能包</span>
          <button type="button" onClick={() => message.info('更多技能包')}>
            更多
            <RightOutlined />
          </button>
        </div>
        <div className="lucky-market-skill-pack-grid">
          {MARKET_SKILL_PACKS.map((pack) => (
            <MarketSkillPackCard key={pack.key} pack={pack} />
          ))}
        </div>
      </section>

      <div className="lucky-market-skill-filterbar">
        <div className="lucky-market-skill-categories" aria-label="技能分类">
          {MARKET_SKILL_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'is-active' : ''}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <button type="button" className="lucky-market-skill-filter" onClick={() => message.info('筛选技能')}>
          <ControlOutlined />
          筛选
        </button>
      </div>

      <div className="lucky-market-skill-grid">
        {visibleSkills.map((skill) => (
          <MarketSkillCard key={skill.key} skill={skill} />
        ))}
      </div>
    </div>
  );
}

function MarketPracticeThumb({ practice }) {
  const preview = practice.preview || [];
  const accentStyle = { '--practice-accent': practice.color };

  return (
    <div
      className={`lucky-market-practice-thumb lucky-market-practice-thumb-${practice.visual} lucky-market-practice-thumb-${practice.size}`}
      style={accentStyle}
      aria-hidden="true"
    >
      <div className="lucky-market-practice-thumb-head">
        <span>{practice.agent}</span>
        <em>{practice.category}</em>
      </div>
      <div className="lucky-market-practice-visual">
        {practice.visual === 'profile' ? (
          <>
            <span className="lucky-market-practice-avatar" />
            <div className="lucky-market-practice-profile-lines">
              {preview.map((item) => <i key={item}>{item}</i>)}
            </div>
          </>
        ) : practice.visual === 'workflow' || practice.visual === 'timeline' ? (
          <div className="lucky-market-practice-flow">
            {preview.map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : practice.visual === 'dashboard' || practice.visual === 'chart' ? (
          <div className="lucky-market-practice-dashboard">
            <div className="lucky-market-practice-bars">
              {preview.map((item, index) => <i key={item} style={{ height: `${38 + index * 18}%` }} />)}
            </div>
            <div>
              {preview.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        ) : practice.visual === 'chat' ? (
          <div className="lucky-market-practice-chat">
            {preview.map((item, index) => (
              <span key={item} className={index % 2 ? 'is-right' : ''}>{item}</span>
            ))}
          </div>
        ) : practice.visual === 'poster' || practice.visual === 'product' ? (
          <div className="lucky-market-practice-poster">
            <strong>{practice.title}</strong>
            <div>
              {preview.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        ) : practice.visual === 'calendar' ? (
          <div className="lucky-market-practice-calendar">
            {preview.map((item, index) => (
              <span key={item}>
                <em>{String(index + 1).padStart(2, '0')}</em>
                {item}
              </span>
            ))}
          </div>
        ) : practice.visual === 'board' ? (
          <div className="lucky-market-practice-board">
            {preview.map((item, index) => (
              <span key={item}>
                <i />
                <b>{item}</b>
                <em>{['已完成', '进行中', '待确认'][index]}</em>
              </span>
            ))}
          </div>
        ) : practice.visual === 'cards' ? (
          <div className="lucky-market-practice-card-stack">
            {preview.map((item, index) => (
              <span key={item} style={{ '--practice-card-index': index }}>
                {item}
              </span>
            ))}
          </div>
        ) : practice.visual === 'report' ? (
          <div className="lucky-market-practice-report">
            <strong>{practice.title}</strong>
            {preview.map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : practice.visual === 'checklist' ? (
          <div className="lucky-market-practice-checklist">
            {preview.map((item) => <span key={item}>{item}</span>)}
          </div>
        ) : (
          <div className="lucky-market-practice-doc">
            {preview.map((item) => <span key={item}>{item}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketPracticeCard({ practice }) {
  const openPractice = () => message.success(`已打开案例：${practice.title}`);

  return (
    <article
      className="lucky-market-practice-card"
      role="button"
      tabIndex={0}
      onClick={openPractice}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPractice();
        }
      }}
    >
      <MarketPracticeThumb practice={practice} />
      <h3>{practice.title}</h3>
      <p>{practice.agent}</p>
    </article>
  );
}

function MarketBestPracticePage({
  searchText,
  activeCategory,
  sortMode,
  onCategoryChange,
  onSortChange,
}) {
  const visiblePractices = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return MARKET_BEST_PRACTICES
      .filter((practice) => {
        if (activeCategory !== '全部' && practice.category !== activeCategory) return false;
        if (!normalizedSearch) return true;
        return `${practice.title} ${practice.agent} ${practice.category} ${practice.preview.join(' ')}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => (
        sortMode === 'new'
          ? left.fresh - right.fresh
          : right.heat - left.heat
      ));
  }, [activeCategory, searchText, sortMode]);

  return (
    <div className="lucky-market-practice-view">
      <div className="lucky-market-practice-filterbar">
        <div className="lucky-market-practice-categories" aria-label="最佳实践分类">
          {MARKET_PRACTICE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'is-active' : ''}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="lucky-market-sort" aria-label="最佳实践排序">
          <button
            type="button"
            className={sortMode === 'hot' ? 'is-active' : ''}
            onClick={() => onSortChange('hot')}
          >
            最热
          </button>
          <button
            type="button"
            className={sortMode === 'new' ? 'is-active' : ''}
            onClick={() => onSortChange('new')}
          >
            最新
          </button>
        </div>
      </div>

      <div className="lucky-market-practice-masonry">
        {visiblePractices.map((practice) => (
          <MarketPracticeCard key={practice.key} practice={practice} />
        ))}
      </div>
    </div>
  );
}

function MarketComingSoon({ title }) {
  return (
    <section className="lucky-market-coming-soon" aria-label={title}>
      <RobotOutlined />
      <h2>{title}</h2>
      <p>这里会继续补充与智能体生态相关的内容。</p>
    </section>
  );
}

function MarketPage() {
  const [activeTab, setActiveTab] = useState(MARKET_TABS[0]);
  const [activeCategory, setActiveCategory] = useState(MARKET_CATEGORIES[0]);
  const [activeSkillScope, setActiveSkillScope] = useState(MARKET_SKILL_SCOPES[0]);
  const [activeSkillCategory, setActiveSkillCategory] = useState(MARKET_SKILL_CATEGORIES[0]);
  const [activePracticeCategory, setActivePracticeCategory] = useState(MARKET_PRACTICE_CATEGORIES[0]);
  const [sortMode, setSortMode] = useState('hot');
  const [searchText, setSearchText] = useState('');
  const isSkillTab = activeTab === '技能';
  const isPracticeTab = activeTab === '最佳实践';

  const visibleExperts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return MARKET_EXPERTS.filter((expert) => {
      if (activeCategory !== '全部' && expert.category !== activeCategory) return false;
      if (!normalizedSearch) return true;
      return `${expert.name} ${expert.desc} ${expert.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
    });
  }, [activeCategory, searchText]);

  return (
    <section className="lucky-market-page" aria-label="市场">
      <header className="lucky-market-header">
        <div className="lucky-market-title">市场</div>
      </header>

      <div className="lucky-market-topline">
        <nav className="lucky-market-tabs" aria-label="市场分类">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== '专家' && tab !== '技能' && tab !== '最佳实践') message.info(`${tab}页面即将上线`);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="lucky-market-actions">
          <label className="lucky-market-search" htmlFor="lucky-market-search">
            <SearchOutlined />
            <input
            id="lucky-market-search"
            value={searchText}
            placeholder="搜索"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          {!isPracticeTab ? (
            <button
              type="button"
              className="lucky-market-custom"
              onClick={() => message.info(isSkillTab ? '已打开新建技能' : '已打开自定义专家')}
            >
              <PlusOutlined />
              {isSkillTab ? '新建' : '自定义专家'}
              {isSkillTab ? <DownOutlined /> : null}
            </button>
          ) : null}
        </div>
      </div>

      {isSkillTab ? (
        <MarketSkillPage
          searchText={searchText}
          activeScope={activeSkillScope}
          activeCategory={activeSkillCategory}
          onScopeChange={setActiveSkillScope}
          onCategoryChange={setActiveSkillCategory}
        />
      ) : isPracticeTab ? (
        <MarketBestPracticePage
          searchText={searchText}
          activeCategory={activePracticeCategory}
          sortMode={sortMode}
          onCategoryChange={setActivePracticeCategory}
          onSortChange={setSortMode}
        />
      ) : activeTab === '专家' ? (
        <>
          <div className="lucky-market-rankings">
            {MARKET_RANKING_CARDS.map((card) => (
              <MarketRankingCard key={card.key} card={card} />
            ))}
          </div>

          <div className="lucky-market-filterbar">
            <div className="lucky-market-categories" aria-label="专家领域">
              {MARKET_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? 'is-active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="lucky-market-sort" aria-label="排序">
              <button
                type="button"
                className={sortMode === 'hot' ? 'is-active' : ''}
                onClick={() => setSortMode('hot')}
              >
                最热
              </button>
              <button
                type="button"
                className={sortMode === 'new' ? 'is-active' : ''}
                onClick={() => setSortMode('new')}
              >
                最新
              </button>
            </div>
          </div>

          <div className="lucky-market-grid">
            {visibleExperts.map((expert) => (
              <article key={expert.key} className="lucky-market-expert-card">
                <div className="lucky-market-expert-head">
                  <MarketAvatar tone={expert.avatar} label={expert.name} />
                  <div>
                    <h3>{expert.name}</h3>
                    <p>{expert.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => message.success(`已招募：${expert.name}`)}
                  >
                    招募专家
                  </button>
                </div>
                <p className="lucky-market-expert-desc">{expert.desc}</p>
                <div className="lucky-market-expert-tags">
                  {expert.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <MarketComingSoon title={activeTab} />
      )}
    </section>
  );
}

function AutomationManualModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="lucky-automation-modal-overlay" role="presentation">
      <section className="lucky-automation-modal" role="dialog" aria-modal="true" aria-labelledby="automation-modal-title">
        <div className="lucky-automation-modal-main">
          <div className="lucky-automation-modal-left">
            <h2 id="automation-modal-title">新建自动化</h2>

            <label className="lucky-automation-field">
              <span>标题</span>
              <input type="text" autoFocus placeholder="请输入标题" />
            </label>

            <label className="lucky-automation-field lucky-automation-description-field">
              <span>描述</span>
              <div className="lucky-automation-description-box">
                <textarea placeholder="请输入你想完成的任务" />
                <button type="button" aria-label="添加描述内容" onClick={() => message.info('已打开添加内容')}>
                  <PlusOutlined />
                </button>
              </div>
            </label>

            <div className="lucky-automation-bottom-fields">
              <label className="lucky-automation-field">
                <span>指派给</span>
                <button type="button" className="lucky-automation-select-button">
                  <span className="lucky-automation-user-avatar" aria-hidden="true">张</span>
                  张洪磊的智能体
                  <DownOutlined />
                </button>
              </label>

              <label className="lucky-automation-field">
                <span>选择项目</span>
                <button type="button" className="lucky-automation-select-button">
                  <FolderOutlined />
                  选择项目
                  <DownOutlined />
                </button>
              </label>
            </div>
          </div>

          <aside className="lucky-automation-modal-right">
            <button type="button" className="lucky-automation-modal-close" aria-label="关闭" onClick={onClose}>
              <CloseOutlined />
            </button>

            <div className="lucky-automation-config-section">
              <h3>触发器配置</h3>

              <label className="lucky-automation-config-field">
                <span>触发方式</span>
                <button type="button" className="lucky-automation-config-select is-compact">
                  <ClockCircleOutlined />
                  定时触发
                  <DownOutlined />
                </button>
              </label>

              <label className="lucky-automation-config-field">
                <span>执行频率</span>
                <button type="button" className="lucky-automation-config-select is-compact">
                  每天
                  <DownOutlined />
                </button>
              </label>

              <button type="button" className="lucky-automation-config-select">
                上午 11:09
                <DownOutlined />
              </button>

              <div className="lucky-automation-idle-row">
                <div>
                  <div>闲时执行</div>
                  <p>开启后，任务会在资源空闲时段（00:00-06:00）执行，并按设定的通知时间推送结果，以减少高峰期排队等待。关闭后，任务将按设置的执行时间运行</p>
                </div>
                <button type="button" className="lucky-automation-switch" aria-label="闲时执行" aria-pressed="false" />
              </div>

              <button type="button" className="lucky-automation-advanced">
                高级配置
                <DownOutlined />
              </button>
            </div>

            <div className="lucky-automation-config-section lucky-automation-push-section">
              <h3>推送配置</h3>
              <p>任务完成后，智能体会将执行结果发送给你；企业智能体在群组中创建的自动化任务，任务执行结果会发送到群里</p>

              <label className="lucky-automation-config-field">
                <span>推送给</span>
                <div className="lucky-automation-receiver-box">
                  <span className="lucky-automation-receiver-tag">
                    <span className="lucky-automation-user-avatar" aria-hidden="true">张</span>
                    张洪磊
                    <span aria-hidden="true">×</span>
                  </span>
                </div>
              </label>
            </div>
          </aside>
        </div>

        <footer className="lucky-automation-modal-footer">
          <button type="button" className="lucky-automation-modal-cancel" onClick={onClose}>取消</button>
          <button
            type="button"
            className="lucky-automation-modal-submit"
            onClick={() => {
              onClose();
              message.success('已创建自动化');
            }}
          >
            创建
          </button>
        </footer>
      </section>
    </div>
  );
}

function AutomationPage() {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const createMenuRef = useRef(null);

  useEffect(() => {
    if (!createMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (createMenuRef.current?.contains(event.target)) return;
      setCreateMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [createMenuOpen]);

  return (
    <section className="lucky-automation-page" aria-label="自动化">
      <div className="lucky-automation-title">自动化</div>

      <div className="lucky-automation-center">
        <div className="lucky-automation-empty">
          <div className="lucky-automation-empty-icon" aria-hidden="true" />
          <p>为智能体安排自动化任务。你可以使用推荐模板，或从空白新建</p>
          <div className="lucky-automation-create-wrap" ref={createMenuRef}>
            <button
              type="button"
              className={`lucky-automation-create ${createMenuOpen ? 'is-active' : ''}`}
              aria-haspopup="menu"
              aria-expanded={createMenuOpen}
              onClick={() => setCreateMenuOpen((open) => !open)}
            >
              <PlusOutlined />
              新建自动化
              <DownOutlined />
            </button>
            {createMenuOpen ? (
              <div className="lucky-automation-create-menu" role="menu" aria-label="新建自动化方式">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateMenuOpen(false);
                    message.info('已进入对话创建自动化');
                  }}
                >
                  <MessageOutlined />
                  使用对话创建
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCreateMenuOpen(false);
                    setManualModalOpen(true);
                  }}
                >
                  <PlusOutlined />
                  手动创建
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lucky-automation-divider" />

        <div className="lucky-automation-recommend">
          <div className="lucky-automation-recommend-title">推荐</div>
          <div className="lucky-automation-card-grid">
            {AUTOMATION_RECOMMENDATIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="lucky-automation-card"
                onClick={() => message.success(`已选择模板：${item.title}`)}
              >
                <span className={`lucky-automation-card-icon lucky-automation-card-icon-${item.tone}`}>
                  {item.icon}
                </span>
                <span className="lucky-automation-card-title">{item.title}</span>
                <span className="lucky-automation-card-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AutomationManualModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />
    </section>
  );
}

function TaskDetailPage({ onSendReply }) {
  const scoreStars = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <section className="lucky-task-detail-page" aria-label="任务详情">
      <header className="lucky-task-detail-topbar">
        <div className="lucky-task-detail-title">介绍并引导上手使用</div>
        <div className="lucky-task-detail-actions">
          <button type="button" aria-label="任务视图" onClick={() => message.info('已切换任务视图')}>
            <MenuOutlined />
          </button>
          <button type="button" aria-label="分享任务" onClick={() => message.info('已复制分享入口')}>
            <ShareAltOutlined />
          </button>
          <button type="button" aria-label="更多" onClick={() => message.info('更多操作')}>
            <EllipsisOutlined />
          </button>
        </div>
      </header>

      <div className="lucky-task-detail-body">
        <div className="lucky-task-thread">
          <div className="lucky-task-intro-row">
            <article className="lucky-task-intro-card">
              <p>我刚完成初始设置，第一次用你。带我认识你。</p>
              <p>这个过程中，记着：和我多轮对话，一步步来，每次只带一小步，做完停下等我回应；真的动手操作（建任务 / 加技能 / 设自动化），不要写文档、也不要只讲不做。</p>
              <h3>先简单介绍你</h3>
              <p>结合我的角色和场景，用几句话说清你是什么、能帮我做什么，给我个大方向；别罗列功能，说完就带我动手做第一件事。</p>
              <h3>带我做这几件事（挑一个适合我的真实场景，把下面几件事自然串进去）</h3>
              <ol>
                <li>创建第一个任务（不要创建自动化任务）</li>
                <li>加一个技能</li>
                <li>设一个自动化（我同意后你再创建）</li>
              </ol>
              <h3>关于我</h3>
              <ul>
                <li>工作：技术部部门总监</li>
                <li>喜欢的沟通方式：高效务实，注重结果导向</li>
              </ul>
            </article>
            <span className="lucky-task-author-badge" aria-label="张洪磊">
              <AgentAvatar type="personal" />
            </span>
          </div>

          <article className="lucky-task-message">
            <AgentAvatar type="personal" />
            <div className="lucky-task-message-content">
              <p>
                张洪磊，你好。我是你的智能工作搭档——帮你盯事、跑腿、串联飞书里的消息/文档/日程/任务，
                让你少在琐事上花时间，多聚焦在技术决策和团队管理上。
              </p>
              <p>
                咱们直接上手。先帮你建一个任务试试——比如你最近技术部有什么需要跟进的事？选一个：
              </p>
              <div className="lucky-task-message-meta">
                <span>07月30日 21:05</span>
                <span>结果评分</span>
                <span className="lucky-task-score" aria-label="结果评分">
                  {scoreStars.map((star) => (
                    <StarOutlined key={star} />
                  ))}
                </span>
              </div>
            </div>
          </article>
        </div>

        <aside className="lucky-task-info-card" aria-label="基础信息">
          <h2>基础信息</h2>
          <dl>
            <div>
              <dt>状态</dt>
              <dd>
                <span className="lucky-task-status-dot" />
                进行中
              </dd>
            </div>
            <div>
              <dt>指派给</dt>
              <dd>
                <span className="lucky-task-mini-avatar">
                  <AgentAvatar type="personal" />
                </span>
                张洪磊的智能体
              </dd>
            </div>
            <div>
              <dt>创建者</dt>
              <dd>
                <span className="lucky-task-mini-avatar">
                  <AgentAvatar type="personal" />
                </span>
                张洪磊
              </dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>2026年07月30日 21:04</dd>
            </div>
            <div>
              <dt>最近更新</dt>
              <dd>2026年07月30日 21:04</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="lucky-task-reply-wrap">
        <div className="lucky-task-reply-box">
          <textarea rows={2} placeholder="继续补充信息，或 @智能体 派发任务" />
          <div className="lucky-task-reply-actions">
            <button type="button" aria-label="添加">
              <PlusOutlined />
            </button>
            <div>
              <button type="button" aria-label="语音输入">
                <AudioOutlined />
              </button>
              <button type="button" className="lucky-task-reply-send" aria-label="发送" onClick={onSendReply}>
                <ArrowUpOutlined />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LuckyHome({
  promptText,
  onPromptChange,
  onSend,
  agents = [],
  teams = COMPOSER_TEAM_OPTIONS,
  projects = DEFAULT_PROJECTS,
  onOpenCreateProject,
}) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [browserMenuOpen, setBrowserMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [selectedModelKey, setSelectedModelKey] = useState(AGENT_MODEL_OPTIONS[0].key);
  const [selectedTarget, setSelectedTarget] = useState({ type: 'agent', key: 'party-affairs' });
  const [selectedProjectKey, setSelectedProjectKey] = useState(projects[0]?.key || '');
  const [projectSearchText, setProjectSearchText] = useState('');
  const contextPickerRef = useRef(null);
  const projectPickerRef = useRef(null);
  const browserPickerRef = useRef(null);
  const modelPickerRef = useRef(null);
  const composerAgents = useMemo(() => {
    const agentMap = new Map();
    [...agents, ...COMPOSER_EXTRA_AGENTS].forEach((agent) => {
      if (!agentMap.has(agent.key)) agentMap.set(agent.key, agent);
    });
    return [...agentMap.values()];
  }, [agents]);
  const composerTeams = teams.length > 0 ? teams : COMPOSER_TEAM_OPTIONS;
  const selectedAgent = composerAgents.find((agent) => agent.key === selectedTarget.key) || composerAgents[0];
  const selectedTeam = composerTeams.find((team) => team.key === selectedTarget.key) || composerTeams[0];
  const selectedContextLabel = selectedTarget.type === 'team' ? selectedTeam?.name : selectedAgent?.name;
  const selectedModel = AGENT_MODEL_OPTIONS.find((model) => model.key === selectedModelKey) || AGENT_MODEL_OPTIONS[0];
  const selectedProject = projects.find((project) => project.key === selectedProjectKey) || projects[0];
  const activeQuickActions = selectedTarget.type === 'team'
    ? TEAM_QUICK_ACTIONS[selectedTeam?.key] || QUICK_ACTIONS
    : AGENT_QUICK_ACTIONS[selectedAgent?.key] || QUICK_ACTIONS;
  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectSearchText.trim().toLowerCase();
    if (!normalizedSearch) return projects;
    return projects.filter((project) => (
      `${project.name} ${project.instruction || ''}`.toLowerCase().includes(normalizedSearch)
    ));
  }, [projectSearchText, projects]);

  useEffect(() => {
    if (!contextMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (contextPickerRef.current?.contains(event.target)) return;
      setContextMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setContextMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenuOpen]);

  useEffect(() => {
    if (!projectMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (projectPickerRef.current?.contains(event.target)) return;
      setProjectMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProjectMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [projectMenuOpen]);

  useEffect(() => {
    if (!browserMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (browserPickerRef.current?.contains(event.target)) return;
      setBrowserMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBrowserMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [browserMenuOpen]);

  useEffect(() => {
    if (!modelMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (modelPickerRef.current?.contains(event.target)) return;
      setModelMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setModelMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modelMenuOpen]);

  useEffect(() => {
    if (selectedProjectKey || !projects[0]) return;
    setSelectedProjectKey(projects[0].key);
  }, [projects, selectedProjectKey]);

  const handleSelectContextTarget = (type, option) => {
    setSelectedTarget({ type, key: option.key });
    setContextMenuOpen(false);
    message.success(`已切换到：${option.name}`);
  };

  const handleSelectProject = (project) => {
    setSelectedProjectKey(project.key);
    setProjectMenuOpen(false);
    message.success(`已进入项目：${project.name}`);
  };

  return (
    <div className="lucky-home">
      <div className="lucky-home-avatar" aria-hidden="true">
        <span className="lucky-home-avatar-face">张</span>
      </div>
      <h1 className="lucky-home-title">让{selectedContextLabel || '智能体'}帮你做点什么？</h1>

      <section className="lucky-composer-shell" aria-label="创建新任务">
        <div className="lucky-composer-frame">
          <div className="lucky-composer-box">
            <textarea
              value={promptText}
              className="lucky-composer-input"
              placeholder="输入你的任务或目标"
              rows={2}
              onChange={(event) => onPromptChange(event.target.value)}
            />
            <div className="lucky-composer-actions">
              <button
                type="button"
                className="lucky-icon-button"
                title="添加附件"
                aria-label="添加附件"
                onClick={() => message.info('已打开附件入口')}
              >
                <PlusOutlined />
              </button>
              <div className="lucky-composer-action-right">
                <div className="lucky-model-picker" ref={modelPickerRef}>
                  <button
                    type="button"
                    className={`lucky-auto-button ${modelMenuOpen ? 'is-open' : ''}`}
                    title="选择模型"
                    aria-haspopup="menu"
                    aria-expanded={modelMenuOpen}
                    onClick={() => {
                      setContextMenuOpen(false);
                      setProjectMenuOpen(false);
                      setBrowserMenuOpen(false);
                      setModelMenuOpen((open) => !open);
                    }}
                  >
                    <ThunderboltOutlined />
                    <span>{selectedModel.name}</span>
                    <DownOutlined />
                  </button>

                  {modelMenuOpen ? (
                    <div className="lucky-model-menu" role="menu" aria-label="选择模型">
                      <div className="lucky-model-menu-title">
                        切换“{selectedContextLabel || '智能体'}”所用模型
                      </div>
                      <div className="lucky-model-menu-list">
                        {AGENT_MODEL_OPTIONS.map((model) => {
                          const isSelected = model.key === selectedModelKey;
                          return (
                            <button
                              key={model.key}
                              type="button"
                              role="menuitemradio"
                              aria-checked={isSelected}
                              className={`lucky-model-menu-row ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setSelectedModelKey(model.key);
                                setModelMenuOpen(false);
                                message.success(`已切换模型：${model.name}`);
                              }}
                            >
                              <span className={`lucky-agent-model-logo lucky-agent-model-logo-${model.tone}`} aria-hidden="true">
                                {model.tone === 'auto' ? <ThunderboltOutlined /> : null}
                              </span>
                              <span className="lucky-model-menu-name">
                                <span>{model.name}</span>
                                {model.badge ? (
                                  <span className={`lucky-agent-model-badge lucky-agent-model-badge-${model.badgeTone}`}>
                                    {model.badge}
                                  </span>
                                ) : null}
                              </span>
                              <span className="lucky-model-menu-rate">{model.rate}</span>
                              {isSelected ? <CheckOutlined className="lucky-model-menu-check" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="lucky-icon-button"
                  title="语音输入"
                  aria-label="语音输入"
                  onClick={() => message.info('已打开语音输入')}
                >
                  <AudioOutlined />
                </button>
                <button
                  type="button"
                  className="lucky-send-button"
                  title="发送"
                  aria-label="发送"
                  onClick={onSend}
                >
                  <ArrowUpOutlined />
                </button>
              </div>
            </div>
          </div>
          <div className="lucky-context-bar">
            {COMPOSER_CONTEXTS.map((item) => (
              item.key === 'agent' ? (
                <div key={item.key} className="lucky-context-picker" ref={contextPickerRef}>
                  <button
                    type="button"
                    className={`lucky-context-item lucky-context-picker-trigger ${contextMenuOpen ? 'is-open' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={contextMenuOpen}
                    onClick={() => {
                      setModelMenuOpen(false);
                      setContextMenuOpen((open) => !open);
                    }}
                  >
                    <span className="lucky-context-icon">{item.icon}</span>
                    <span className="lucky-context-label">{selectedContextLabel}</span>
                    <DownOutlined className="lucky-context-arrow" />
                  </button>

                  {contextMenuOpen ? (
                    <div className="lucky-context-menu lucky-target-context-menu" role="menu" aria-label="选择智能体或小队">
                      <div className="lucky-context-menu-section">
                        <div className="lucky-context-menu-head">
                          <span>智能体</span>
                          <button
                            type="button"
                            aria-label="新建智能体"
                            onClick={() => message.info('已打开新建智能体')}
                          >
                            <PlusOutlined />
                          </button>
                        </div>

                        <div className="lucky-context-option-list">
                          {composerAgents.map((agent) => {
                            const isSelected = selectedTarget.type === 'agent' && selectedTarget.key === agent.key;
                            return (
                              <button
                                key={agent.key}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isSelected}
                                className={`lucky-context-option ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => handleSelectContextTarget('agent', agent)}
                              >
                                <AgentAvatar type={agent.avatar} />
                                <span className="lucky-context-option-name">{agent.name}</span>
                                {agent.tag === '专属' ? <span className="lucky-context-option-badge">专属</span> : null}
                                {isSelected ? <CheckOutlined className="lucky-context-option-check" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lucky-context-menu-section">
                        <div className="lucky-context-menu-head">
                          <span>小队</span>
                          <button
                            type="button"
                            aria-label="新建智能体小队"
                            onClick={() => message.info('已打开新建智能体小队')}
                          >
                            <PlusOutlined />
                          </button>
                        </div>

                        <div className="lucky-context-option-list">
                          {composerTeams.map((team) => {
                            const isSelected = selectedTarget.type === 'team' && selectedTarget.key === team.key;
                            return (
                              <button
                                key={team.key}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isSelected}
                                className={`lucky-context-option ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => handleSelectContextTarget('team', team)}
                              >
                                <span className="lucky-context-team-icon" aria-hidden="true">
                                  <RobotOutlined />
                                </span>
                                <span className="lucky-context-option-name">{team.name}</span>
                                {isSelected ? <CheckOutlined className="lucky-context-option-check" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : item.key === 'project' ? (
                <div key={item.key} className="lucky-context-picker lucky-context-project-picker" ref={projectPickerRef}>
                  <button
                    type="button"
                    className={`lucky-context-item lucky-context-picker-trigger ${projectMenuOpen ? 'is-open' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={projectMenuOpen}
                    onClick={() => {
                      setModelMenuOpen(false);
                      setProjectMenuOpen((open) => !open);
                    }}
                  >
                    <span className="lucky-context-icon">{item.icon}</span>
                    <span className="lucky-context-label">{selectedProject ? selectedProject.name : item.label}</span>
                    <DownOutlined className="lucky-context-arrow" />
                  </button>

                  {projectMenuOpen ? (
                    <div className="lucky-context-menu lucky-project-context-menu" role="menu" aria-label="选择项目">
                      <label className="lucky-project-context-search" htmlFor="lucky-project-context-search">
                        <SearchOutlined />
                        <input
                          id="lucky-project-context-search"
                          value={projectSearchText}
                          placeholder="搜索"
                          onChange={(event) => setProjectSearchText(event.target.value)}
                        />
                      </label>

                      <div className="lucky-context-option-list lucky-project-context-list">
                        {filteredProjects.map((project) => {
                          const isSelected = project.key === selectedProject?.key;
                          return (
                            <button
                              key={project.key}
                              type="button"
                              role="menuitemradio"
                              aria-checked={isSelected}
                              className={`lucky-context-option lucky-project-context-option ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => handleSelectProject(project)}
                            >
                              <span className="lucky-context-project-icon" aria-hidden="true">
                                <FolderOutlined />
                              </span>
                              <span className="lucky-context-option-name">{project.name}</span>
                              {isSelected ? <CheckOutlined className="lucky-context-option-check" /> : null}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="lucky-project-context-create"
                        onClick={() => {
                          setProjectMenuOpen(false);
                          onOpenCreateProject?.();
                        }}
                      >
                        <PlusOutlined />
                        新建项目
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : item.key === 'browser' ? (
                <div key={item.key} className="lucky-context-picker lucky-context-browser-picker" ref={browserPickerRef}>
                  <button
                    type="button"
                    className={`lucky-context-item lucky-context-picker-trigger ${browserMenuOpen ? 'is-open' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={browserMenuOpen}
                    onClick={() => {
                      setModelMenuOpen(false);
                      setBrowserMenuOpen((open) => !open);
                    }}
                  >
                    <span className="lucky-context-icon">{item.icon}</span>
                    <span className="lucky-context-label">{item.label}</span>
                    <DownOutlined className="lucky-context-arrow" />
                    {item.hasNotice ? <span className="lucky-context-notice" /> : null}
                  </button>

                  {browserMenuOpen ? (
                    <div className="lucky-context-menu lucky-browser-context-menu" role="menu" aria-label="选择浏览器">
                      <p className="lucky-browser-context-desc">
                        使用浏览器处理网页操作任务，未开启本地浏览器时将使用云端浏览器
                      </p>

                      <div className="lucky-browser-context-row">
                        <span className="lucky-browser-context-icon" aria-hidden="true">
                          <CloudServerOutlined />
                        </span>
                        <span className="lucky-browser-context-copy">
                          <strong>使用我的浏览器</strong>
                          <em>便捷访问需登录或验证的网站</em>
                        </span>
                        <button
                          type="button"
                          className="lucky-browser-install-btn"
                          onClick={() => message.success('已开始安装浏览器插件')}
                        >
                          安装
                        </button>
                      </div>

                      <button
                        type="button"
                        className="lucky-browser-manage-row"
                        onClick={() => {
                          setBrowserMenuOpen(false);
                          message.info('已打开浏览器管理');
                        }}
                      >
                        <ControlOutlined />
                        <span>管理</span>
                        <RightOutlined />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className="lucky-context-item"
                  onClick={() => message.info(`已选择：${item.label}`)}
                >
                  <span className="lucky-context-icon">{item.icon}</span>
                  <span className="lucky-context-label">{item.label}</span>
                  <DownOutlined className="lucky-context-arrow" />
                  {item.hasNotice ? <span className="lucky-context-notice" /> : null}
                </button>
              )
            ))}
          </div>
        </div>
      </section>

      <div className="lucky-quick-actions" aria-label="快捷能力">
        {activeQuickActions.map((item) => (
          <button
            key={item.key}
            type="button"
            className="lucky-quick-chip"
            onClick={() => message.info(`已选择：${item.label}`)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <section className="lucky-recommend-section">
        <div className="lucky-recommend-title">为你推荐</div>
        <div className="lucky-recommend-grid">
          {RECOMMENDATION_CARDS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="lucky-recommend-card"
              onClick={() => message.success(`已选择推荐任务：${item.title}`)}
            >
              <span className="lucky-recommend-card-kicker">
                {item.icon}
                {item.label}
              </span>
              <span className="lucky-recommend-card-title">{item.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function CodeSidebarContent({
  activeCodeSection,
  activeCodeAppKey,
  onCodeSectionChange,
  onOpenCodeApp,
}) {
  return (
    <div className="lucky-code-sidebar-content">
      <nav className="lucky-code-nav" aria-label="编程导航">
        {CODE_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`lucky-code-nav-item ${activeCodeSection === item.key ? 'is-active' : ''}`}
            onClick={() => {
              onCodeSectionChange(item.key);
              onOpenCodeApp(null);
            }}
          >
            <span className="lucky-code-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <section className="lucky-code-app-section" aria-label="应用">
        <div className="lucky-code-sidebar-label">应用</div>
        <div className="lucky-code-app-list">
          {CODE_APP_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-code-app-item ${activeCodeAppKey === item.key ? 'is-active' : ''}`}
              onClick={() => {
                onCodeSectionChange('');
                onOpenCodeApp(item.key);
              }}
            >
              <span className="lucky-code-app-dot" style={{ '--code-app-color': item.color }} aria-hidden="true" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="lucky-code-sidebar-end">到底了</div>
      </section>

      <div className="lucky-code-sidebar-user">
        <span className="lucky-code-user-avatar">张</span>
        <span className="lucky-code-user-copy">
          <strong>张洪磊</strong>
          <em>企业版</em>
        </span>
        <button type="button" aria-label="锁定" onClick={() => message.info('已锁定')}>
          <LockOutlined />
        </button>
      </div>
    </div>
  );
}

function CodeStyleCard({ item }) {
  return (
    <button
      type="button"
      className={`lucky-code-style-card lucky-code-style-${item.tone} ${item.dark ? 'is-dark' : ''}`}
      onClick={() => message.success(`已选择风格：${item.name}`)}
    >
      <span className="lucky-code-style-preview" aria-hidden="true">
        <span className="lucky-code-style-cover">{item.name}</span>
        <span className="lucky-code-style-panel">
          <i />
          <strong>{item.metric}</strong>
          <em />
          <b />
        </span>
      </span>
      <span className="lucky-code-style-name">{item.name}</span>
    </button>
  );
}

function CodeDiscoverAppCard({ app }) {
  return (
    <button
      type="button"
      className="lucky-code-discover-card"
      onClick={() => message.success(`已打开应用：${app.title}`)}
    >
      <span className={`lucky-code-discover-thumb lucky-code-discover-thumb-${app.tone}`} aria-hidden="true">
        <span className="lucky-code-discover-window">
          <i />
          <i />
          <i />
        </span>
        <span className="lucky-code-discover-chart">
          <b />
          <b />
          <b />
        </span>
        <span className="lucky-code-discover-lines">
          <i />
          <i />
          <i />
        </span>
      </span>
      <span className="lucky-code-discover-title">{app.title}</span>
      <span className="lucky-code-discover-tags">
        {app.tags.map((tag) => (
          <em key={tag}>{tag}</em>
        ))}
      </span>
    </button>
  );
}

function CodeDiscoverPluginCard({ plugin }) {
  return (
    <button
      type="button"
      className="lucky-code-plugin-card"
      onClick={() => message.success(`已选择插件：${plugin.title}`)}
    >
      <span className={`lucky-code-plugin-icon lucky-code-plugin-icon-${plugin.tone}`} aria-hidden="true">
        {plugin.icon}
      </span>
      <span>
        <strong>{plugin.title}</strong>
        <em>{plugin.desc}</em>
      </span>
    </button>
  );
}

function CodeDiscoverPage() {
  const [activeTab, setActiveTab] = useState(CODE_DISCOVER_TABS[0]);
  const [searchText, setSearchText] = useState('');
  const normalizedSearch = searchText.trim().toLowerCase();
  const showApps = activeTab === '发现' || activeTab === '应用';
  const showPlugins = activeTab === '发现' || activeTab === '插件';
  const filteredApps = CODE_DISCOVER_APPS.filter((app) => {
    if (!normalizedSearch) return true;
    return `${app.title} ${app.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
  });
  const filteredPlugins = CODE_DISCOVER_PLUGINS.filter((plugin) => {
    if (!normalizedSearch) return true;
    return `${plugin.title} ${plugin.desc}`.toLowerCase().includes(normalizedSearch);
  });

  return (
    <section className="lucky-code-discover-page" aria-label="发现">
      <header className="lucky-code-discover-head">
        <nav className="lucky-code-discover-tabs" aria-label="发现分类">
          {CODE_DISCOVER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab);
                setSearchText('');
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <label className="lucky-code-discover-search" htmlFor="lucky-code-discover-search">
          <SearchOutlined />
          <input
            id="lucky-code-discover-search"
            value={searchText}
            placeholder="搜索"
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
      </header>

      {showApps ? (
        <section className="lucky-code-discover-section" aria-label="应用">
          <div className="lucky-code-discover-section-head">
            <h2>
              <ProductOutlined />
              应用
            </h2>
            <button type="button" onClick={() => setActiveTab('应用')}>
              查看全部
              <RightOutlined />
            </button>
          </div>
          <div className="lucky-code-discover-grid">
            {filteredApps.map((app) => (
              <CodeDiscoverAppCard key={app.key} app={app} />
            ))}
          </div>
        </section>
      ) : null}

      {showPlugins ? (
        <section className="lucky-code-discover-section lucky-code-plugin-section" aria-label="插件">
          <div className="lucky-code-discover-section-head">
            <h2>
              <ProjectOutlined />
              插件
            </h2>
            <button type="button" onClick={() => setActiveTab('插件')}>
              查看全部
              <RightOutlined />
            </button>
          </div>
          <div className="lucky-code-plugin-grid">
            {filteredPlugins.map((plugin) => (
              <CodeDiscoverPluginCard key={plugin.key} plugin={plugin} />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === '组件' ? (
        <section className="lucky-code-discover-empty" aria-label="组件">
          <ProductOutlined />
          <strong>组件库正在整理中</strong>
          <span>可复用表单、看板、流程节点等组件将沉淀到这里。</span>
        </section>
      ) : null}
    </section>
  );
}

function CodeModeHome({
  promptText,
  onPromptChange,
  onSend,
}) {
  return (
    <section className="lucky-code-home" aria-label="编程">
      <div className="lucky-code-hero">
        <h1>灵感落地生花，即刻智搭万物</h1>

        <div className="lucky-code-type-switch" aria-label="创作类型">
          <button type="button" className="is-active" onClick={() => message.info('已选择应用开发')}>
            <ProductOutlined />
            应用开发
          </button>
          <button type="button" onClick={() => message.info('已选择创意设计')}>
            <FileImageOutlined />
            创意设计
          </button>
        </div>

        <section className="lucky-code-composer" aria-label="创建应用">
          <textarea
            value={promptText}
            placeholder="创建一个党务材料审核与归档工具"
            rows={2}
            onChange={(event) => onPromptChange(event.target.value)}
          />
          <span className="lucky-code-tab-hint">tab</span>
          <div className="lucky-code-composer-actions">
            <div>
              <button type="button" aria-label="添加" onClick={() => message.info('已打开添加入口')}>
                <PlusOutlined />
              </button>
              <button type="button" aria-label="引用" onClick={() => message.info('已打开引用入口')}>
                @
              </button>
            </div>
            <div>
              <button type="button" aria-label="语音输入" onClick={() => message.info('已打开语音输入')}>
                <AudioOutlined />
              </button>
              <button type="button" aria-label="参数设置" onClick={() => message.info('已打开参数设置')}>
                <ControlOutlined />
              </button>
              <button type="button" className="lucky-code-send" aria-label="生成应用" onClick={onSend}>
                <ArrowUpOutlined />
              </button>
            </div>
          </div>
        </section>

        <div className="lucky-code-chip-row" aria-label="应用类型">
          {CODE_PROMPT_CHIPS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => message.info(`已选择：${item.label}`)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="lucky-code-style-section" aria-label="推荐场景">
        <h2>推荐场景</h2>
        <div className="lucky-code-style-grid">
          {CODE_STYLE_TEMPLATES.map((item) => (
            <CodeStyleCard key={item.key} item={item} />
          ))}
        </div>
      </section>
    </section>
  );
}

function CodeAppDetailPage({ app, onBackHome, onOpenRecentApp }) {
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const appMenuRef = useRef(null);

  useEffect(() => {
    if (!appMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (appMenuRef.current?.contains(event.target)) return;
      setAppMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setAppMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [appMenuOpen]);

  if (!app) return null;

  const phaseOneTasks = app.tasks.filter((task) => task.phase === app.phases[0]?.name);
  const phaseTwoTasks = app.tasks.filter((task) => task.phase === app.phases[1]?.name);

  return (
    <section className="lucky-code-app-detail" aria-label={app.title}>
      <aside className="lucky-code-builder-panel">
        <div className="lucky-code-builder-toolbar">
          <div className="lucky-code-app-menu-wrap" ref={appMenuRef}>
            <button
              type="button"
              className="lucky-code-app-menu-trigger"
              aria-label="打开应用菜单"
              aria-haspopup="menu"
              aria-expanded={appMenuOpen}
              onClick={() => setAppMenuOpen((open) => !open)}
            >
              <MenuOutlined />
            </button>
            {appMenuOpen ? (
              <div className="lucky-code-app-menu" role="menu" aria-label="应用菜单">
                <button
                  type="button"
                  className="lucky-code-app-menu-home"
                  role="menuitem"
                  onClick={() => {
                    setAppMenuOpen(false);
                    onBackHome();
                  }}
                >
                  <HomeOutlined />
                  返回首页
                </button>

                <div className="lucky-code-app-menu-section">
                  <span>最近应用</span>
                  {CODE_RECENT_APPS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAppMenuOpen(false);
                        if (CODE_APP_DETAILS[item.key]) {
                          onOpenRecentApp(item.key);
                        } else {
                          message.info(`已选择：${item.name}`);
                        }
                      }}
                    >
                      <i style={{ '--recent-app-color': item.color }} />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="lucky-code-builder-toolbar-actions">
            <button type="button" aria-label="历史记录" onClick={() => message.info('已打开历史记录')}>
              <ClockCircleOutlined />
            </button>
            <button type="button" aria-label="面板设置" onClick={() => message.info('已打开面板设置')}>
              <ControlOutlined />
            </button>
          </div>
        </div>

        <div className="lucky-code-request-card">
          <strong>## 任务简述</strong>
          <p>{app.goal}</p>
          <strong>## 详细需求</strong>
          <p>
            USER REQUEST: 我想 3 个月学会 SQL 用于工作取数，每周 6 小时，帮我排可视化路径。
          </p>
          <strong>要求：</strong>
          <p>页面标题为“{app.title}”，显示关键参数卡片、整体进度、阶段进度和每周任务。</p>
          <button type="button" onClick={() => message.info('已展开任务描述')}>展开</button>
          <span>08月17日 18:08</span>
        </div>

        <div className="lucky-code-builder-chat">
          {app.messages.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <ul>
            <li>世界：开发者终端 + 数据工作台的总览感</li>
            <li>材质：代码编辑器的语法光、数据表格横线、终端光标</li>
          </ul>
        </div>

        <div className="lucky-code-builder-input">
          <input placeholder="告诉我如何修改应用" />
          <div>
            <button type="button" aria-label="添加"><PlusOutlined /></button>
            <button type="button">Plan</button>
            <button type="button" aria-label="语音"><AudioOutlined /></button>
            <button type="button" aria-label="设置"><ControlOutlined /></button>
            <button type="button" className="lucky-code-builder-send" aria-label="发送"><ArrowUpOutlined /></button>
          </div>
        </div>
      </aside>

      <section className="lucky-code-preview-panel">
        <header className="lucky-code-preview-topbar">
          <div>
            <strong>{app.title}</strong>
            <span>{app.updatedAt}</span>
          </div>
          <div className="lucky-code-preview-actions">
            <button type="button" className="is-dark" onClick={() => message.success('已分享应用')}>
              <ShareAltOutlined />
              分享
            </button>
            <button type="button" onClick={() => message.info('已进入编辑模式')}>
              <EditOutlined />
              编辑
            </button>
            <button type="button" aria-label="更多"><EllipsisOutlined /></button>
          </div>
        </header>

        <div className="lucky-sql-app-shell">
          <div className="lucky-sql-app-head">
            <span className="lucky-sql-logo">SQL</span>
            <div>
              <h2>{app.appName}</h2>
              <p>{app.desc}</p>
            </div>
            <button type="button" onClick={() => message.info('已重置进度')}>
              <ControlOutlined />
              重置进度
            </button>
          </div>

          <div className="lucky-sql-stat-grid">
            {app.stats.map((stat) => (
              <article key={stat.key} className={`lucky-sql-stat-card lucky-sql-stat-${stat.tone}`}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <em>{stat.sub}</em>
              </article>
            ))}
          </div>

          <div className="lucky-sql-progress-grid">
            <article className="lucky-sql-overall-card">
              <div className="lucky-sql-card-head">
                <strong>整体进度</strong>
                <span>0/13 周</span>
              </div>
              <div className="lucky-sql-ring" aria-label="整体进度 0%">
                <span>0%</span>
                <em>已完成</em>
              </div>
              <div className="lucky-sql-date-row">
                <span>开始日期<br /><strong>2026-08-17</strong></span>
                <span>预计完成<br /><strong>2026-11-16</strong></span>
              </div>
            </article>

            <article className="lucky-sql-phase-card">
              <div className="lucky-sql-card-head">
                <strong>阶段进度</strong>
                <span>尚未开始</span>
              </div>
              <div className="lucky-sql-phase-list">
                {app.phases.map((phase) => (
                  <div key={phase.key} className="lucky-sql-phase-row">
                    <span style={{ '--phase-color': phase.color }} />
                    <strong>{phase.name}</strong>
                    <em>{phase.weeks}</em>
                    <i />
                  </div>
                ))}
              </div>
              <div className="lucky-sql-invest-row">
                <span>已投入<br /><strong>0 小时</strong></span>
                <span>还需投入<br /><strong>78 小时</strong></span>
              </div>
            </article>
          </div>

          <div className="lucky-sql-filter-row">
            <button type="button" className="is-active">全部</button>
            {app.phases.map((phase) => (
              <button key={phase.key} type="button">{phase.name}</button>
            ))}
          </div>

          <section className="lucky-sql-task-section">
            <div className="lucky-sql-section-head">
              <h3>
                <span>1</span>
                {app.phases[0].name}
              </h3>
              <em>第 1-6 周 · 基础 · 36h · 0/6 完成</em>
            </div>
            <div className="lucky-sql-task-grid">
              {phaseOneTasks.map((task) => (
                <button key={task.key} type="button" className="lucky-sql-task-card">
                  <span className="lucky-sql-task-check" />
                  <span className="lucky-sql-task-week">{task.week}</span>
                  <em>{task.hours}</em>
                  <strong>{task.title}</strong>
                  <DownOutlined />
                </button>
              ))}
            </div>
          </section>

          <section className="lucky-sql-task-section">
            <div className="lucky-sql-section-head is-green">
              <h3>
                <span>2</span>
                {app.phases[1].name}
              </h3>
              <em>第 7-10 周 · 探索 · 24h · 0/4 完成</em>
            </div>
            <div className="lucky-sql-task-grid">
              {phaseTwoTasks.map((task) => (
                <button key={task.key} type="button" className="lucky-sql-task-card">
                  <span className="lucky-sql-task-check" />
                  <span className="lucky-sql-task-week">{task.week}</span>
                  <em>{task.hours}</em>
                  <strong>{task.title}</strong>
                  <DownOutlined />
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}

function CreateProjectModal({ open, onClose, onCreate }) {
  const [projectName, setProjectName] = useState('');
  const [projectInstruction, setProjectInstruction] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    setProjectName('');
    setProjectInstruction('');

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const canCreate = projectName.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      name: projectName.trim(),
      instruction: projectInstruction.trim(),
    });
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-create-project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-create-project-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-create-project-head">
          <h2 id="lucky-create-project-title">创建项目</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        <label className="lucky-create-project-field">
          <span>
            项目名
            <em>*</em>
          </span>
          <input
            type="text"
            autoFocus
            value={projectName}
            placeholder="请输入项目名称"
            onChange={(event) => setProjectName(event.target.value)}
          />
        </label>

        <label className="lucky-create-project-field">
          <span>指令</span>
          <textarea
            value={projectInstruction}
            placeholder="用于引导智能体在该项目中的行为规范、工作风格及流程。例如：留存数据按自然周计算，结论中附上数据来源。"
            onChange={(event) => setProjectInstruction(event.target.value)}
          />
        </label>

        <footer className="lucky-create-project-footer">
          <button type="button" className="lucky-create-project-cancel" onClick={onClose}>取消</button>
          <button
            type="button"
            className={`lucky-create-project-submit ${canCreate ? 'is-ready' : ''}`}
            disabled={!canCreate}
            onClick={handleCreate}
          >
            创建
          </button>
        </footer>
      </section>
    </div>
  );
}

function ProjectsPage({ projects, onOpenCreate, onOpenProject }) {
  const [projectSearch, setProjectSearch] = useState('');
  const normalizedSearch = projectSearch.trim().toLowerCase();
  const visibleProjects = projects.filter((project) => {
    if (!normalizedSearch) return true;
    return `${project.name} ${project.instruction || ''} ${(project.agents || []).join(' ')} ${project.status || ''}`
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <section className="lucky-project-page" aria-label="项目">
      <header className="lucky-project-page-head">
        <div className="lucky-project-title">项目</div>
        <div className="lucky-project-actions">
          <label className="lucky-project-search" htmlFor="lucky-project-search">
            <SearchOutlined />
            <input
              id="lucky-project-search"
              value={projectSearch}
              placeholder="搜索"
              onChange={(event) => setProjectSearch(event.target.value)}
            />
          </label>
          <button type="button" className="lucky-project-create-btn" onClick={onOpenCreate}>
            <PlusOutlined />
            新建项目
          </button>
        </div>
      </header>

      <div className="lucky-project-board">
        <div className="lucky-project-section-title">我的项目 ({projects.length})</div>
        <div className="lucky-project-grid">
          {visibleProjects.map((project) => (
            <button
              key={project.key}
              type="button"
              className="lucky-project-card"
              style={{ '--project-color': project.color || '#5f6875' }}
              onClick={() => onOpenProject(project)}
            >
              <span className="lucky-project-card-icon" aria-hidden="true">
                <FolderOutlined />
              </span>
              <span className="lucky-project-card-copy">
                <span className="lucky-project-card-title-row">
                  <strong>{project.name}</strong>
                  {project.status ? <i>{project.status}</i> : null}
                </span>
                <span className="lucky-project-card-desc">{project.instruction}</span>
                {project.agents?.length ? (
                  <span className="lucky-project-card-agents">
                    {project.agents.slice(0, 3).map((agentName) => (
                      <b key={agentName}>{agentName}</b>
                    ))}
                  </span>
                ) : null}
                <em>{project.createdAt}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectDetailPage({ project, onBackToProjects }) {
  return (
    <section className="lucky-project-detail-page" aria-label={`${project.name} 项目`}>
      <header className="lucky-project-detail-topbar">
        <div className="lucky-project-detail-breadcrumb">
          <button type="button" onClick={onBackToProjects}>项目</button>
          <span>/</span>
          <strong>{project.name}</strong>
        </div>
        <div className="lucky-project-detail-actions">
          <button type="button" aria-label="视图" onClick={() => message.info('已切换项目视图')}>
            <MenuOutlined />
          </button>
          <button type="button" aria-label="更多" onClick={() => message.info('更多项目操作')}>
            <EllipsisOutlined />
          </button>
        </div>
      </header>

      <div className="lucky-project-detail-layout">
        <main className="lucky-project-detail-main">
          <h1>{project.name}</h1>

          <section className="lucky-project-task-composer" aria-label="项目任务输入">
            <div className="lucky-project-task-box">
              <textarea rows={3} placeholder="指派智能体开始任务" />
              <div className="lucky-project-task-actions">
                <button type="button" aria-label="添加">
                  <PlusOutlined />
                </button>
                <div>
                  <button type="button" className="lucky-project-auto-button">
                    <ThunderboltOutlined />
                    Auto
                    <RightOutlined />
                  </button>
                  <button type="button" aria-label="语音输入">
                    <AudioOutlined />
                  </button>
                  <button
                    type="button"
                    className="lucky-project-task-send"
                    aria-label="发送"
                    onClick={() => message.success('已发送项目任务')}
                  >
                    <ArrowUpOutlined />
                  </button>
                </div>
              </div>
            </div>

            <div className="lucky-project-context-row">
              <button type="button" onClick={() => message.info('选择智能体')}>
                <RobotOutlined />
                张洪磊的智能体
                <DownOutlined />
              </button>
              <button type="button" onClick={() => message.info('选择项目')}>
                <FolderOutlined />
                {project.name}
                <DownOutlined />
              </button>
            </div>
          </section>

          <section className="lucky-project-task-list" aria-label="我的任务">
            <h2>我的任务 (0)</h2>
            <div className="lucky-project-empty-task">
              <span className="lucky-project-empty-illustration" aria-hidden="true" />
              <p>暂无任务</p>
            </div>
          </section>
        </main>

        <aside className="lucky-project-detail-side" aria-label="项目配置">
          <section className="lucky-project-side-card">
            <div className="lucky-project-side-card-head">
              <h2>指令</h2>
              <button type="button" aria-label="编辑指令" onClick={() => message.info('编辑项目指令')}>
                <EditOutlined />
              </button>
            </div>
            <p>设置指令，用于引导智能体在该项目中的行为规范、工作风格及流程。项目中的所有任务均会遵循该指令</p>
          </section>

          <section className="lucky-project-side-card">
            <div className="lucky-project-side-card-head">
              <h2>知识</h2>
              <button type="button" aria-label="添加知识" onClick={() => message.info('添加项目知识')}>
                <PlusOutlined />
              </button>
            </div>
            <p>暂无知识，添加后将自动共享至本项目的所有任务</p>
          </section>

          <section className="lucky-project-side-card lucky-project-side-member-card">
            <div className="lucky-project-side-card-head">
              <h2>协作者</h2>
              <button type="button" aria-label="添加协作者" onClick={() => message.info('添加协作者')}>
                <PlusOutlined />
              </button>
            </div>
            <div className="lucky-project-member-row">
              <span className="lucky-project-member-avatar">
                <AgentAvatar type="personal" />
              </span>
              <span>张洪磊</span>
              <em>所有者</em>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function LuckyGlobalSearchModal({ open, onClose, onCreateTask, onOpenIntroTask }) {
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setSearchText('');
    window.setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const normalizedSearch = searchText.trim().toLowerCase();
  const showRecentTask = !normalizedSearch || '介绍并引导上手使用'.toLowerCase().includes(normalizedSearch);
  const showCreateTask = !normalizedSearch || '新建任务'.includes(normalizedSearch);

  return (
    <div className="lucky-global-search-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-global-search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="搜索"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <label className="lucky-global-search-input" htmlFor="lucky-global-search-input">
          <SearchOutlined />
          <input
            ref={inputRef}
            id="lucky-global-search-input"
            value={searchText}
            placeholder="搜索任务或选择快捷操作"
            onChange={(event) => setSearchText(event.target.value)}
          />
          <button type="button" aria-label="关闭搜索" onClick={onClose}>
            <CloseOutlined />
          </button>
        </label>

        <div className="lucky-global-search-content">
          {showCreateTask ? (
            <section className="lucky-global-search-section">
              <h2>快捷功能</h2>
              <button type="button" className="lucky-global-search-row is-highlighted" onClick={onCreateTask}>
                <PlusOutlined />
                <span>新建任务</span>
              </button>
            </section>
          ) : null}

          {showRecentTask ? (
            <section className="lucky-global-search-section">
              <h2>最近任务</h2>
              <button type="button" className="lucky-global-search-row" onClick={onOpenIntroTask}>
                <span className="lucky-global-search-status" aria-hidden="true" />
                <span>介绍并引导上手使用</span>
              </button>
            </section>
          ) : null}

          {!showCreateTask && !showRecentTask ? (
            <div className="lucky-global-search-empty">暂无匹配结果</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function AgentAvatar({ type }) {
  return (
    <span className={`lucky-agent-card-avatar lucky-agent-card-avatar-${type}`} aria-hidden="true">
      <span />
    </span>
  );
}

function SquadAvatar({ color = '#f59e0b', compact = false }) {
  return (
    <span
      className={`lucky-squad-avatar ${compact ? 'is-compact' : ''}`}
      style={{ '--lucky-squad-avatar-color': color }}
      aria-hidden="true"
    >
      <RobotOutlined />
    </span>
  );
}

function CreateAgentIllustration({ type }) {
  return (
    <div className={`lucky-create-agent-visual lucky-create-agent-visual-${type}`} aria-hidden="true">
      <span className="lucky-create-agent-dot lucky-create-agent-dot-1" />
      <span className="lucky-create-agent-dot lucky-create-agent-dot-2" />
      <span className="lucky-create-agent-dot lucky-create-agent-dot-3" />
      <span className="lucky-create-agent-core" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-1" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-2" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-3" />
    </div>
  );
}

function CreateAgentSquadModal({ open, agents, onClose, onCreate }) {
  const [selectedAvatar, setSelectedAvatar] = useState(SQUAD_AVATAR_OPTIONS[0].key);
  const [squadName, setSquadName] = useState('');
  const [squadDesc, setSquadDesc] = useState('');
  const [selectedMemberKeys, setSelectedMemberKeys] = useState([]);
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    setSelectedAvatar(SQUAD_AVATAR_OPTIONS[0].key);
    setSquadName('');
    setSquadDesc('');
    setSelectedMemberKeys([]);
    setInstruction('');

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedAvatarOption = SQUAD_AVATAR_OPTIONS.find((avatar) => avatar.key === selectedAvatar) || SQUAD_AVATAR_OPTIONS[0];
  const canCreate = squadName.trim().length > 0 && selectedMemberKeys.length > 0;

  const handleToggleMember = (agentKey) => {
    setSelectedMemberKeys((prev) => (
      prev.includes(agentKey)
        ? prev.filter((key) => key !== agentKey)
        : [...prev, agentKey]
    ));
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      key: `agent-squad-${Date.now()}`,
      name: squadName.trim(),
      desc: squadDesc.trim() || '由多个智能体共同协作',
      avatarColor: selectedAvatarOption.color,
      memberKeys: selectedMemberKeys,
      instruction: instruction.trim(),
    });
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-create-squad-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-create-squad-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-create-squad-head">
          <div>
            <h2 id="lucky-create-squad-title">新建智能体小队</h2>
            <p>可指定小队内的智能体成员和协作方式，由队长接收任务并协调分配</p>
          </div>
          <button
            type="button"
            className="lucky-create-agent-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-create-squad-field">
          <div className="lucky-create-squad-label">头像</div>
          <div className="lucky-squad-avatar-row">
            {SQUAD_AVATAR_OPTIONS.map((avatar, index) => (
              <button
                key={avatar.key}
                type="button"
                className={`lucky-squad-avatar-option ${selectedAvatar === avatar.key ? 'is-selected' : ''}`}
                aria-label={`选择小队头像 ${index + 1}`}
                onClick={() => setSelectedAvatar(avatar.key)}
              >
                <SquadAvatar color={avatar.color} />
                {index === 0 ? <span className="lucky-squad-avatar-camera" /> : null}
              </button>
            ))}
          </div>
        </div>

        <label className="lucky-create-squad-field" htmlFor="lucky-create-squad-name">
          <span className="lucky-create-squad-label">
            名称
            <em>*</em>
          </span>
          <div className="lucky-create-squad-input-wrap">
            <input
              id="lucky-create-squad-name"
              type="text"
              autoFocus
              maxLength={20}
              value={squadName}
              placeholder="请输入名称"
              onChange={(event) => setSquadName(event.target.value)}
            />
            <span>{squadName.length}/20</span>
          </div>
        </label>

        <label className="lucky-create-squad-field" htmlFor="lucky-create-squad-desc">
          <span className="lucky-create-squad-label">描述</span>
          <div className="lucky-create-squad-input-wrap">
            <input
              id="lucky-create-squad-desc"
              type="text"
              maxLength={100}
              value={squadDesc}
              placeholder="请描述小队负责的工作"
              onChange={(event) => setSquadDesc(event.target.value)}
            />
            <span>{squadDesc.length}/100</span>
          </div>
        </label>

        <div className="lucky-create-squad-field">
          <span className="lucky-create-squad-label">
            小队成员
            <em>*</em>
          </span>
          <p className="lucky-create-squad-helper">
            选择小队成员，并设置其中一位为队长。队长可指派任务给成员，成员之间可互相协作完成任务
          </p>
          <div className="lucky-squad-member-grid">
            {agents.map((agent) => {
              const selected = selectedMemberKeys.includes(agent.key);
              const leader = selected && selectedMemberKeys[0] === agent.key;
              return (
                <button
                  key={agent.key}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  className={`lucky-squad-member-option ${selected ? 'is-selected' : ''}`}
                  onClick={() => handleToggleMember(agent.key)}
                >
                  <span className="lucky-squad-member-checkbox" aria-hidden="true">
                    {selected ? <CheckOutlined /> : null}
                  </span>
                  <AgentAvatar type={agent.avatar} />
                  <span className="lucky-squad-member-name">{agent.name}</span>
                  {leader ? <em>队长</em> : null}
                </button>
              );
            })}
          </div>
        </div>

        <label className="lucky-create-squad-field" htmlFor="lucky-create-squad-instruction">
          <span className="lucky-create-squad-label">协作指引</span>
          <p className="lucky-create-squad-helper">设定成员之间的协作方式、任务规划机制等，支持从模板导入</p>
          <div className="lucky-create-squad-textarea-wrap">
            <textarea
              id="lucky-create-squad-instruction"
              maxLength={20000}
              value={instruction}
              placeholder="请输入协作规则，或 @ 使用模板"
              onChange={(event) => setInstruction(event.target.value)}
            />
            <button type="button" onClick={() => message.info('已打开协作模板')}>
              <RobotOutlined />
              使用模板
            </button>
            <span>{instruction.length}/20000</span>
          </div>
        </label>

        <footer className="lucky-create-squad-footer">
          <button type="button" className="lucky-create-squad-cancel" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={`lucky-create-squad-submit ${canCreate ? 'is-ready' : ''}`}
            disabled={!canCreate}
            onClick={handleCreate}
          >
            创建
          </button>
        </footer>
      </section>
    </div>
  );
}

function CreateAgentModal({ open, onClose, onAddTeamAgent, onOpenMarket }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const handleOptionClick = (option) => {
    if (option.key === 'team') {
      onClose();
      onAddTeamAgent();
      return;
    }
    if (option.key === 'market') {
      onClose();
      onOpenMarket();
      return;
    }
    message.success(`已选择：${option.title}`);
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-create-agent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-create-agent-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-create-agent-head">
          <h2 id="lucky-create-agent-title">创建智能体</h2>
          <button
            type="button"
            className="lucky-create-agent-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-create-agent-options">
          {CREATE_AGENT_OPTIONS.map((option) => (
            <article key={option.key} className="lucky-create-agent-option">
              <CreateAgentIllustration type={option.image} />
              <div className="lucky-create-agent-copy">
                <div className="lucky-create-agent-option-title">
                  {option.title}
                  {option.badge ? <span>{option.badge}</span> : null}
                </div>
                <p>
                  {option.desc}
                  {option.link ? <button type="button">{option.link}</button> : null}
                </p>
              </div>
              <button
                type="button"
                className={`lucky-create-agent-action ${option.primary ? 'is-primary' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                {option.action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamAgentModal({ open, onClose, onCreate }) {
  const [selectedAvatar, setSelectedAvatar] = useState(TEAM_AGENT_AVATARS[7].key);
  const [agentName, setAgentName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedAvatarType = TEAM_AGENT_AVATARS.find((avatar) => avatar.key === selectedAvatar)?.type || 'personal';
  const canCreate = agentName.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      key: `created-agent-${Date.now()}`,
      name: agentName.trim(),
      desc: selectedGroup ? '已添加到群组，可协同处理团队任务' : '暂无描述',
      tag: selectedGroup ? '团队' : '专属',
      tagTone: selectedGroup ? 'muted' : 'purple',
      avatar: selectedAvatarType,
    });
    setAgentName('');
    setSelectedGroup('');
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-team-agent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-team-agent-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-team-agent-head">
          <h2 id="lucky-team-agent-title">新建团队智能体</h2>
          <button
            type="button"
            className="lucky-create-agent-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-team-agent-field">
          <label>头像</label>
          <div className="lucky-team-avatar-row">
            {TEAM_AGENT_AVATARS.map((avatar) => (
              <button
                key={avatar.key}
                type="button"
                className={`lucky-team-avatar-option ${selectedAvatar === avatar.key ? 'is-selected' : ''}`}
                onClick={() => setSelectedAvatar(avatar.key)}
              >
                <AgentAvatar type={avatar.type} />
                {avatar.key === TEAM_AGENT_AVATARS[0].key ? <span className="lucky-team-avatar-camera" /> : null}
              </button>
            ))}
            <button
              type="button"
              className="lucky-team-avatar-more"
              title="更多头像"
              aria-label="更多头像"
              onClick={() => message.info('已打开更多头像')}
            >
              <DownOutlined />
            </button>
          </div>
        </div>

        <div className="lucky-team-agent-field">
          <label htmlFor="lucky-team-agent-name">名称</label>
          <input
            id="lucky-team-agent-name"
            value={agentName}
            className="lucky-team-agent-input"
            placeholder="请输入智能体名称"
            onChange={(event) => setAgentName(event.target.value)}
          />
        </div>

        <div className="lucky-team-agent-field">
          <label htmlFor="lucky-team-agent-group">添加到群组</label>
          <div className="lucky-team-agent-helper">
            创建后，会将智能体添加到所选群组中，并默认共享所有群内的上下文，以提升协作效率
          </div>
          <div className="lucky-team-agent-select-wrap">
            <select
              id="lucky-team-agent-group"
              value={selectedGroup}
              className="lucky-team-agent-select"
              onChange={(event) => setSelectedGroup(event.target.value)}
            >
              <option value="">选择群组</option>
              <option value="project">项目协作群</option>
              <option value="teaching">教研共创群</option>
              <option value="training">培训运营群</option>
            </select>
            <DownOutlined />
          </div>
        </div>

        <div className="lucky-team-agent-footer">
          <button type="button" className="lucky-team-agent-cancel" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={`lucky-team-agent-submit ${canCreate ? 'is-ready' : ''}`}
            disabled={!canCreate}
            onClick={handleCreate}
          >
            创建
          </button>
        </div>
      </section>
    </div>
  );
}

function SkillMarketModal({ open, selectedSkills, onClose, onAddSkill }) {
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState(SKILL_MARKET_CATEGORIES[0]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedSkillSet = new Set(selectedSkills);
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleSkills = SKILL_MARKET_ITEMS.filter((skill) => {
    if (!normalizedSearch) return true;
    return `${skill.title} ${skill.desc} ${skill.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
  });
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'enterprise', label: '企业专属' },
    { key: 'mine', label: '我的' },
  ];

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-skill-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-skill-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-skill-modal-head">
          <div className="lucky-skill-modal-tabs" role="tablist" aria-label="技能来源">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="lucky-skill-search" htmlFor="lucky-skill-search-input">
            <SearchOutlined />
            <input
              id="lucky-skill-search-input"
              value={searchText}
              placeholder="搜索"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="lucky-skill-modal-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-skill-modal-body">
          <div className="lucky-skill-section-head">
            <h2 id="lucky-skill-modal-title">精选技能包</h2>
            <button type="button" onClick={() => message.info('已展开更多技能包')}>
              更多
              <DownOutlined />
            </button>
          </div>

          <div className="lucky-skill-pack-grid">
            {SKILL_PACKS.map((pack) => (
              <article key={pack.key} className="lucky-skill-pack-card">
                <div className="lucky-skill-pack-top">
                  <h3>{pack.title}</h3>
                  <button type="button" onClick={() => message.success(`已一键添加：${pack.title}`)}>
                    一键添加
                  </button>
                </div>
                <p>{pack.desc}</p>
                <div className="lucky-skill-pack-tags">
                  {pack.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="lucky-skill-count">{pack.count}</div>
              </article>
            ))}
          </div>

          <div className="lucky-skill-category-row">
            {SKILL_MARKET_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
            <button type="button" className="lucky-skill-filter" onClick={() => message.info('已打开筛选')}>
              <ControlOutlined />
              筛选
              <DownOutlined />
            </button>
          </div>

          <div className="lucky-skill-card-grid">
            {visibleSkills.map((skill) => {
              const isAdded = selectedSkillSet.has(skill.title);
              return (
                <article key={skill.key} className="lucky-skill-card">
                  <div className="lucky-skill-card-head">
                    <span className="lucky-skill-card-icon">{skill.icon}</span>
                    <h3>{skill.title}</h3>
                    <button
                      type="button"
                      className={isAdded ? 'is-added' : ''}
                      disabled={isAdded}
                      onClick={() => onAddSkill(skill.title)}
                    >
                      {isAdded ? '已添加' : '+ 添加'}
                    </button>
                  </div>
                  <p>{skill.desc}</p>
                  <div className="lucky-skill-card-tags">
                    {skill.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="lucky-skill-count">{skill.count}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function KnowledgeEmptyState({ compact = false }) {
  return (
    <div className={`lucky-agent-editor-knowledge-empty ${compact ? 'is-compact' : ''}`}>
      <div className="lucky-agent-editor-empty-icon" aria-hidden="true" />
      <p>添加企业知识，为智能体提供更丰富的上下文</p>
      <button type="button" onClick={() => message.info('已打开添加知识')}>+ 添加知识</button>
    </div>
  );
}

function AgentKnowledgeView() {
  return (
    <section className="lucky-agent-knowledge-view" aria-label="知识">
      <div className="lucky-agent-skill-list-toolbar">
        <span>知识</span>
        <div>
          <button type="button" aria-label="搜索知识" onClick={() => message.info('已打开知识搜索')}>
            <SearchOutlined />
          </button>
          <button type="button" aria-label="添加知识" onClick={() => message.info('已打开添加知识')}>
            <PlusOutlined />
          </button>
        </div>
      </div>
      <KnowledgeEmptyState />
    </section>
  );
}

function AgentModelView({ selectedModel, onSelectModel }) {
  return (
    <section className="lucky-agent-model-view" aria-label="模型">
      <div className="lucky-agent-model-head">
        <h3>选择模型</h3>
        <button type="button" aria-label="添加模型" onClick={() => message.info('已打开添加模型')}>
          <PlusOutlined />
        </button>
      </div>

      <div className="lucky-agent-model-list">
        {AGENT_MODEL_OPTIONS.map((model) => {
          const checked = selectedModel === model.key;
          return (
            <button
              key={model.key}
              type="button"
              className={`lucky-agent-model-row ${checked ? 'is-selected' : ''}`}
              onClick={() => onSelectModel(model.key)}
            >
              <span className="lucky-agent-model-radio" aria-hidden="true" />
              <span className={`lucky-agent-model-logo lucky-agent-model-logo-${model.tone}`} aria-hidden="true">
                {model.tone === 'auto' ? <ThunderboltOutlined /> : null}
              </span>
              <span className="lucky-agent-model-name">
                {model.name}
                {model.badge ? (
                  <span className={`lucky-agent-model-badge lucky-agent-model-badge-${model.badgeTone}`}>
                    {model.badge}
                  </span>
                ) : null}
              </span>
              <span className="lucky-agent-model-rate">{model.rate}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BuiltInAgentEditorPage({ agent, skills, onOpenSkillMarket, onBack, onStartNewTask }) {
  const [activeTab, setActiveTab] = useState('人设');
  const [selectedModel, setSelectedModel] = useState('auto');
  const statItems = [
    { label: '陪伴天数', value: 15 },
    { label: '对话数', value: 1 },
    { label: '任务数', value: 1 },
  ];
  const skillListItems = skills.map((skill) => getAgentSkillMeta(skill));

  useEffect(() => {
    setActiveTab('人设');
    setSelectedModel('auto');
  }, [agent.key]);

  return (
    <section className="lucky-builtin-agent-editor" aria-label={`${agent.name} 内置编辑页`}>
      <div className="lucky-agent-editor-breadcrumb">
        <button type="button" onClick={onBack}>智能体</button>
        <span>/</span>
        <strong>{agent.name}</strong>
        <button
          type="button"
          className="lucky-agent-editor-more"
          title="更多"
          aria-label="更多"
          onClick={() => message.info('已打开更多操作')}
        >
          <EllipsisOutlined />
        </button>
      </div>

      <div className="lucky-builtin-agent-layout">
        <aside className="lucky-builtin-agent-profile">
          <div className="lucky-builtin-agent-avatar" aria-hidden="true">
            <span className="lucky-builtin-avatar-hair" />
            <span className="lucky-builtin-avatar-face" />
            <span className="lucky-builtin-avatar-glasses" />
            <span className="lucky-builtin-avatar-body" />
          </div>

          <div className="lucky-builtin-agent-name-row">
            <h2>{agent.name}</h2>
            <span>{agent.tag}</span>
          </div>
          <p className="lucky-builtin-agent-desc">{agent.desc}</p>
          <button
            type="button"
            className="lucky-builtin-auto"
            onClick={() => message.info(`${agent.name} 已切换为 Auto`)}
          >
            <ThunderboltOutlined />
            Auto
          </button>

          <div className="lucky-builtin-stats">
            {statItems.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="lucky-builtin-actions">
            <button
              type="button"
              className="lucky-builtin-action-secondary"
              onClick={() => message.info('已打开飞书对话')}
            >
              <MessageOutlined />
              去飞书对话
            </button>
            <button
              type="button"
              className="lucky-builtin-action-primary"
              onClick={onStartNewTask}
            >
              <EditOutlined />
              新任务
            </button>
          </div>
        </aside>

        <section className="lucky-builtin-agent-panel">
          <div className="lucky-builtin-tabs" role="tablist" aria-label="内置智能体编辑分区">
            {BUILT_IN_AGENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? 'is-active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="lucky-builtin-panel-body">
            {activeTab === '人设' ? (
              <>
                <div className="lucky-builtin-archive-tabs" aria-label="人设档案分类">
                  {BUILT_IN_AGENT_ARCHIVE_TABS.map((tab, index) => (
                    <button key={tab} type="button" className={index === 0 ? 'is-active' : ''}>
                      {tab}
                    </button>
                  ))}
                  <button type="button">
                    全部
                    <RightOutlined />
                  </button>
                </div>

                <div className="lucky-builtin-file-meta">
                  <h3>IDENTITY.md</h3>
                  <p>智能体的名字、性格和身份定义</p>
                </div>

                <article className="lucky-builtin-identity-doc">
                  <h2>IDENTITY.md - 你的名片</h2>
                  <p>第一次对话时填写。开始成为你自己。</p>
                  <ul>
                    <li><strong>名字：</strong>张洪磊的智能体</li>
                    <li><strong>身份：</strong>（管家、搭档、影子幕僚、数字分身……什么都行，别急着定义）</li>
                    <li><strong>风格：</strong>（冷静精确，先给答案再解释 / 温暖周到，想得比你多但说得比你少 / 话不多，句句有用 / 毒舌但中肯，越吵越明白。或者，用自己的话描述）</li>
                    <li><strong>签名：</strong>（一句话，写给还不认识你的人）</li>
                    <li><strong>头像：</strong>（工作空间相对路径，如 avatars/avatar.png）</li>
                  </ul>
                  <p>这不是档案，是起点。</p>
                </article>
              </>
            ) : activeTab === '技能' ? (
              <section className="lucky-agent-skill-list-view" aria-label="技能列表">
                <div className="lucky-agent-skill-list-toolbar">
                  <span>技能</span>
                  <div>
                    <button type="button" aria-label="搜索技能" onClick={() => message.info('已打开技能搜索')}>
                      <SearchOutlined />
                    </button>
                    <button type="button" aria-label="添加技能" onClick={onOpenSkillMarket}>
                      <PlusOutlined />
                    </button>
                  </div>
                </div>

                <div className="lucky-agent-skill-list">
                  {skillListItems.map((skill) => (
                    <article key={skill.title} className="lucky-agent-skill-row">
                      <span className="lucky-agent-skill-row-icon">{skill.icon}</span>
                      <div className="lucky-agent-skill-row-copy">
                        <div className="lucky-agent-skill-row-title">
                          <strong>{skill.title}</strong>
                          <span>{skill.source}</span>
                        </div>
                        <p>{skill.desc}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`${skill.title} 更多`}
                        onClick={() => message.info(`已打开：${skill.title}`)}
                      >
                        <EllipsisOutlined />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : activeTab === '模型' ? (
              <AgentModelView selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            ) : (
              <div className="lucky-builtin-empty-panel">
                <h3>{activeTab}</h3>
                <p>该内置智能体的{activeTab}配置将在这里维护。</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function AgentEditorPage({
  agent,
  skills,
  instructionMarkdown,
  onInstructionChange,
  onOpenSkillMarket,
  onDeleteAgent,
  onBack,
  onStartNewTask,
}) {
  const [activeEditorTab, setActiveEditorTab] = useState('档案');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const statItems = [
    { label: '陪伴天数', value: 1 },
    { label: '对话数', value: 0 },
    { label: '任务数', value: 0 },
  ];
  const instructionEditorId = `lucky-agent-instruction-${agent.key}`;
  const skillListItems = skills.map((skill) => getAgentSkillMeta(skill));

  useEffect(() => {
    setActiveEditorTab('档案');
    setSelectedModel('auto');
    setMoreMenuOpen(false);
  }, [agent.key]);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (moreMenuRef.current?.contains(event.target)) return;
      setMoreMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreMenuOpen]);

  return (
    <section className="lucky-agent-editor" aria-label={`${agent.name} 编辑页`}>
      <div className="lucky-agent-editor-breadcrumb">
        <button type="button" onClick={onBack}>智能体</button>
        <span>/</span>
        <strong>{agent.name}</strong>
        <div className="lucky-agent-editor-more-wrap" ref={moreMenuRef}>
          <button
            type="button"
            className={`lucky-agent-editor-more ${moreMenuOpen ? 'is-active' : ''}`}
            title="更多"
            aria-label="更多"
            aria-haspopup="menu"
            aria-expanded={moreMenuOpen}
            onClick={() => setMoreMenuOpen((open) => !open)}
          >
            <EllipsisOutlined />
          </button>
          {moreMenuOpen ? (
            <div className="lucky-agent-more-menu" role="menu" aria-label="智能体更多操作">
              <button
                type="button"
                className="lucky-agent-more-row"
                role="menuitem"
                onClick={() => message.info('已打开所有者设置')}
              >
                <span>所有者</span>
                <strong>
                  <span className="lucky-agent-more-owner-avatar" aria-hidden="true">张</span>
                  张洪磊
                </strong>
              </button>
              <button
                type="button"
                className="lucky-agent-more-row"
                role="menuitem"
                onClick={() => message.info('已打开可用范围设置')}
              >
                <span>可用范围</span>
                <strong>指定成员</strong>
              </button>
              <button
                type="button"
                className="lucky-agent-more-row is-danger"
                role="menuitem"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onDeleteAgent(agent);
                }}
              >
                删除
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lucky-agent-editor-layout">
        <aside className="lucky-agent-editor-profile">
          <div className={`lucky-agent-editor-avatar lucky-agent-editor-avatar-${agent.avatar}`} aria-hidden="true">
            <span />
          </div>
          <div className="lucky-agent-editor-name">{agent.name}</div>
          <div className="lucky-agent-editor-type">{agent.tag}</div>
          <p className="lucky-agent-editor-desc">
            通用协作角色，处理团队常规咨询需求，交付清晰反馈结果。
          </p>
          <button
            type="button"
            className="lucky-agent-editor-auto"
            onClick={() => message.info(`${agent.name} 已切换为 Auto`)}
          >
            <ThunderboltOutlined />
            Auto
          </button>

          <div className="lucky-agent-editor-stats">
            {statItems.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="lucky-agent-editor-actions">
            <button
              type="button"
              className="lucky-agent-editor-action-primary"
              onClick={onStartNewTask}
            >
              <EditOutlined />
              新任务
            </button>
          </div>
        </aside>

        <section className="lucky-agent-editor-panel">
          <div className="lucky-agent-editor-tabs" role="tablist" aria-label="智能体编辑分区">
            {AGENT_EDITOR_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeEditorTab === tab}
                className={activeEditorTab === tab ? 'is-active' : ''}
                onClick={() => {
                  if (tab === '档案' || tab === '技能' || tab === '知识' || tab === '模型') {
                    setActiveEditorTab(tab);
                    return;
                  }
                  message.info(`已切换到${tab}`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="lucky-agent-editor-scroll">
            {activeEditorTab === '技能' ? (
              <section className="lucky-agent-skill-list-view" aria-label="技能列表">
                <div className="lucky-agent-skill-list-toolbar">
                  <span>技能</span>
                  <div>
                    <button type="button" aria-label="搜索技能" onClick={() => message.info('已打开技能搜索')}>
                      <SearchOutlined />
                    </button>
                    <button type="button" aria-label="添加技能" onClick={onOpenSkillMarket}>
                      <PlusOutlined />
                    </button>
                  </div>
                </div>

                <div className="lucky-agent-skill-list">
                  {skillListItems.map((skill) => (
                    <article key={skill.title} className="lucky-agent-skill-row">
                      <span className="lucky-agent-skill-row-icon">{skill.icon}</span>
                      <div className="lucky-agent-skill-row-copy">
                        <div className="lucky-agent-skill-row-title">
                          <strong>{skill.title}</strong>
                          <span>{skill.source}</span>
                        </div>
                        <p>{skill.desc}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`${skill.title} 更多`}
                        onClick={() => message.info(`已打开：${skill.title}`)}
                      >
                        <EllipsisOutlined />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : activeEditorTab === '知识' ? (
              <AgentKnowledgeView />
            ) : activeEditorTab === '模型' ? (
              <AgentModelView selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            ) : (
              <>
                <section className="lucky-agent-editor-section">
                  <button type="button" className="lucky-agent-editor-section-title" aria-controls={instructionEditorId}>
                    <span>工作指令</span>
                    <DownOutlined />
                  </button>
                  <textarea
                    id={instructionEditorId}
                    className="lucky-agent-markdown-editor"
                    value={instructionMarkdown}
                    spellCheck={false}
                    onChange={(event) => onInstructionChange(event.target.value)}
                  />
                </section>

                <section className="lucky-agent-editor-section lucky-agent-editor-slim-section">
                  <div className="lucky-agent-editor-section-head">
                    <h3>技能</h3>
                    <div>
                      <button type="button" aria-label="添加技能" onClick={onOpenSkillMarket}><PlusOutlined /></button>
                      <button
                        type="button"
                        aria-label="技能列表"
                        onClick={() => setActiveEditorTab('技能')}
                      >
                        <ControlOutlined />
                      </button>
                      <button type="button" aria-label="展开技能"><DownOutlined /></button>
                    </div>
                  </div>
                  <div className="lucky-agent-editor-skills">
                    {skills.map((skill) => (
                      <button key={skill} type="button" onClick={() => message.info(`已打开：${skill}`)}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="lucky-agent-editor-section lucky-agent-editor-slim-section">
                  <div className="lucky-agent-editor-section-head">
                    <h3>知识</h3>
                    <div>
                      <button type="button" aria-label="添加知识"><PlusOutlined /></button>
                      <button
                        type="button"
                        aria-label="知识列表"
                        onClick={() => setActiveEditorTab('知识')}
                      >
                        <ControlOutlined />
                      </button>
                      <button type="button" aria-label="展开知识"><DownOutlined /></button>
                    </div>
                  </div>
                  <KnowledgeEmptyState compact />
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function AgentSquadCard({ squad, members, onOpen }) {
  const previewMembers = members.slice(0, 4);
  const extraCount = Math.max(0, members.length - previewMembers.length);

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpen();
  };

  return (
    <article
      className="lucky-agent-card lucky-squad-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="lucky-agent-card-head">
        <SquadAvatar color={squad.avatarColor} />
        <div className="lucky-agent-card-main">
          <div className="lucky-agent-card-name">{squad.name}</div>
          <div className="lucky-agent-card-desc">{squad.desc}</div>
        </div>
        <button
          type="button"
          className="lucky-agent-card-message"
          title="打开小队"
          aria-label={`打开${squad.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <MessageOutlined />
        </button>
      </div>
      <div className="lucky-agent-card-footer lucky-squad-card-footer">
        <span className="lucky-squad-member-stack" aria-label={`${members.length} 位成员`}>
          {previewMembers.map((member) => (
            <span key={member.key} className="lucky-squad-member-stack-item">
              <AgentAvatar type={member.avatar} />
            </span>
          ))}
          {extraCount > 0 ? <span className="lucky-squad-member-extra">+{extraCount}</span> : null}
        </span>
        <span className="lucky-agent-badge lucky-agent-badge-muted">
          {members.length} 位成员
        </span>
      </div>
    </article>
  );
}

function AgentSquadEditorPage({ squad, agents, onBack, onStartNewTask, onSaveRules }) {
  const [activeTab, setActiveTab] = useState('members');
  const [memberKeys, setMemberKeys] = useState(squad.memberKeys || []);
  const [leaderKey, setLeaderKey] = useState(squad.leaderKey || squad.memberKeys?.[0] || '');
  const [openMemberMenuKey, setOpenMemberMenuKey] = useState(null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [ruleText, setRuleText] = useState(squad.instruction || '');

  const agentByKey = useMemo(() => new Map(agents.map((agent) => [agent.key, agent])), [agents]);
  const members = useMemo(
    () => memberKeys.map((key) => agentByKey.get(key)).filter(Boolean),
    [agentByKey, memberKeys],
  );
  const availableMembers = useMemo(
    () => agents.filter((agent) => !memberKeys.includes(agent.key)),
    [agents, memberKeys],
  );
  const leader = members.find((member) => member.key === leaderKey) || members[0];
  const leaderName = leader?.name || '队长';
  const ruleChanged = ruleText !== (squad.instruction || '');

  useEffect(() => {
    setRuleText(squad.instruction || '');
  }, [squad.key, squad.instruction]);

  const handleAddMember = (agent) => {
    setMemberKeys((prevKeys) => {
      if (prevKeys.includes(agent.key)) return prevKeys;
      return [...prevKeys, agent.key];
    });
    if (!leaderKey) setLeaderKey(agent.key);
    setOpenMemberMenuKey(null);
    setMemberPickerOpen(false);
    message.success(`已添加：${agent.name}`);
  };

  const handleSetLeader = (member) => {
    setLeaderKey(member.key);
    setOpenMemberMenuKey(null);
    message.success(`已将${member.name}设为队长`);
  };

  const handleRemoveMember = (member) => {
    if (memberKeys.length <= 1) {
      message.info('小队至少保留 1 位成员');
      return;
    }
    setMemberKeys((prevKeys) => prevKeys.filter((key) => key !== member.key));
    if (leaderKey === member.key) {
      const nextLeaderKey = memberKeys.find((key) => key !== member.key) || '';
      setLeaderKey(nextLeaderKey);
    }
    setOpenMemberMenuKey(null);
    message.success(`已移出：${member.name}`);
  };

  const handleUseRulesTemplate = () => {
    setRuleText('队长接收任务后先澄清目标、拆解子任务，并根据成员能力分派工作；成员完成各自任务后向队长提交阶段结果，队长负责合并、校验和形成最终交付物。遇到信息不足或结论冲突时，成员应补充说明依据并发起复核。');
    message.success('已填入协作规则模板');
  };

  const handleSaveRules = () => {
    onSaveRules?.(squad.key, ruleText.trim());
  };

  return (
    <section className="lucky-squad-editor" aria-label={`${squad.name}编辑页`}>
      <header className="lucky-squad-editor-header">
        <nav className="lucky-squad-breadcrumb" aria-label="小队详情面包屑">
          <button
            type="button"
            onClick={() => {
              setMemberPickerOpen(false);
              setOpenMemberMenuKey(null);
              onBack();
            }}
          >
            智能体
          </button>
          <span aria-hidden="true">/</span>
          <strong>智能体小队详情</strong>
        </nav>

        <div className="lucky-squad-editor-top">
          <div className="lucky-squad-editor-titlebar">
            <SquadAvatar color={squad.avatarColor} />
            <div>
              <h1>
                {squad.name}
                <span>{members.length}</span>
              </h1>
              <p>{squad.desc}</p>
            </div>
          </div>

          <div className="lucky-squad-editor-actions">
            <div className="lucky-squad-add-member-wrap">
              <button
                type="button"
                className="lucky-squad-action-btn"
                onClick={() => setMemberPickerOpen((current) => !current)}
              >
                <PlusOutlined />
                添加成员
              </button>

              {memberPickerOpen ? (
                <div className="lucky-squad-add-member-menu">
                  {availableMembers.length > 0 ? availableMembers.slice(0, 8).map((agent) => (
                    <button key={agent.key} type="button" onClick={() => handleAddMember(agent)}>
                      <AgentAvatar type={agent.avatar} />
                      <span>{agent.name}</span>
                    </button>
                  )) : (
                    <div className="lucky-squad-add-member-empty">暂无可添加成员</div>
                  )}
                </div>
              ) : null}
            </div>
            <button type="button" className="lucky-squad-action-btn" onClick={onStartNewTask}>
              <EditOutlined />
              新任务
            </button>
            <button
              type="button"
              className="lucky-squad-action-btn is-icon-only"
              aria-label="更多小队操作"
              onClick={() => message.info('更多小队操作')}
            >
              <EllipsisOutlined />
            </button>
          </div>
        </div>

        <nav className="lucky-squad-editor-tabs" aria-label="小队编辑">
          <button
            type="button"
            className={activeTab === 'members' ? 'is-active' : ''}
            onClick={() => {
              setActiveTab('members');
              setMemberPickerOpen(false);
            }}
          >
            小队成员
          </button>
          <button
            type="button"
            className={activeTab === 'rules' ? 'is-active' : ''}
            onClick={() => {
              setActiveTab('rules');
              setMemberPickerOpen(false);
            }}
          >
            协作规则
          </button>
        </nav>
      </header>

      {activeTab === 'members' ? (
        <div className="lucky-squad-canvas" onClick={() => {
          setOpenMemberMenuKey(null);
          setMemberPickerOpen(false);
        }}>
          <div className="lucky-squad-flow">
            {members.map((member, index) => {
              const isLeader = member.key === leaderKey;
              const note = squad.memberNotes?.[member.key] || member.desc || '暂无描述';

              return (
                <div key={member.key} className="lucky-squad-flow-item">
                  <article
                    className={`lucky-squad-member-node ${isLeader ? 'is-leader' : ''}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <AgentAvatar type={member.avatar} />
                    <div className="lucky-squad-member-copy">
                      <div className="lucky-squad-member-title">
                        <strong>{member.name}</strong>
                        {isLeader ? <StarOutlined /> : null}
                      </div>
                      <p>{note}</p>
                    </div>
                    <button
                      type="button"
                      className="lucky-squad-member-more"
                      aria-label={`${member.name}操作`}
                      onClick={() => setOpenMemberMenuKey((current) => (current === member.key ? null : member.key))}
                    >
                      <EllipsisOutlined />
                    </button>

                    {openMemberMenuKey === member.key ? (
                      <div className="lucky-squad-member-menu">
                        <button type="button" onClick={() => message.info(`${member.name}汇报给${leaderName}`)}>
                          <span>汇报给</span>
                          <strong>
                            {isLeader ? '暂无' : leaderName}
                            <RightOutlined />
                          </strong>
                        </button>
                        <button type="button" onClick={() => handleSetLeader(member)}>
                          设置为队长
                        </button>
                        <button type="button" className="is-danger" onClick={() => handleRemoveMember(member)}>
                          移出小队
                        </button>
                      </div>
                    ) : null}
                  </article>

                  {index < members.length - 1 ? (
                    <div className="lucky-squad-connector" aria-hidden="true">
                      <span />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="lucky-squad-zoom" aria-label="画布缩放">
            <button type="button" aria-label="缩小"><MinusOutlined /></button>
            <span>100%</span>
            <button type="button" aria-label="放大"><PlusOutlined /></button>
          </div>
        </div>
      ) : (
        <div className="lucky-squad-canvas lucky-squad-rules-canvas">
          <section className="lucky-squad-rules-panel">
            <p className="lucky-squad-rules-helper">设定成员之间的协作方式、任务规划机制等</p>
            <div className="lucky-squad-rules-editor">
              <textarea
                aria-label="协作规则"
                maxLength={20000}
                value={ruleText}
                onChange={(event) => setRuleText(event.target.value)}
              />
              {!ruleText ? (
                <div className="lucky-squad-rules-placeholder">
                  <span>请输入协作规则，或</span>
                  <button type="button" onClick={handleUseRulesTemplate}>
                    <RobotOutlined />
                    使用模板
                  </button>
                </div>
              ) : null}
              <span className="lucky-squad-rules-count">{ruleText.length}/20000</span>
            </div>
            <button
              type="button"
              className={`lucky-squad-rules-save ${ruleChanged ? 'is-ready' : ''}`}
              disabled={!ruleChanged}
              onClick={handleSaveRules}
            >
              保存
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

function AgentManagementPage({
  activeTab,
  agents,
  agentSquads,
  onTabChange,
  onOpenCreateAgent,
  onOpenCreateSquad,
  onOpenAgent,
  onOpenSquad,
}) {
  const tabs = [
    { key: 'mine', label: '我的智能体', count: agents.length },
    { key: 'team', label: '智能体小队', count: agentSquads.length },
  ];
  const visibleCards = activeTab === 'mine' ? agents : agentSquads;
  const agentByKey = useMemo(() => new Map(agents.map((agent) => [agent.key, agent])), [agents]);

  const handleCardKeyDown = (event, agent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpenAgent(agent);
  };

  return (
    <section className="lucky-agent-page" aria-label="智能体">
      <div className="lucky-agent-page-title">智能体</div>
      <div className="lucky-agent-board">
        <div className="lucky-agent-topbar">
          <div className="lucky-agent-tabs" role="tablist" aria-label="智能体分类">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`lucky-agent-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
                <span>({tab.count})</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="lucky-agent-create-btn"
            onClick={activeTab === 'team' ? onOpenCreateSquad : onOpenCreateAgent}
          >
            <PlusOutlined />
            {activeTab === 'team' ? '创建小队' : '创建智能体'}
          </button>
        </div>

        <div className="lucky-agent-card-grid">
          {activeTab === 'team' ? visibleCards.map((squad) => {
            const members = (squad.memberKeys || []).map((key) => agentByKey.get(key)).filter(Boolean);
            return (
              <AgentSquadCard
                key={squad.key}
                squad={squad}
                members={members}
                onOpen={() => onOpenSquad(squad)}
              />
            );
          }) : visibleCards.map((agent) => (
            <article
              key={agent.key}
              className="lucky-agent-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenAgent(agent)}
              onKeyDown={(event) => handleCardKeyDown(event, agent)}
            >
              <div className="lucky-agent-card-head">
                <AgentAvatar type={agent.avatar} />
                <div className="lucky-agent-card-main">
                  <div className="lucky-agent-card-name">{agent.name}</div>
                  <div className="lucky-agent-card-desc">{agent.desc}</div>
                </div>
                <button
                  type="button"
                  className="lucky-agent-card-message"
                  title="打开对话"
                  aria-label={`打开${agent.name}对话`}
                  onClick={(event) => {
                    event.stopPropagation();
                    message.info(`已打开：${agent.name}`);
                  }}
                >
                  <MessageOutlined />
                </button>
              </div>
              <div className="lucky-agent-card-footer">
                <span className={`lucky-agent-badge lucky-agent-badge-${agent.tagTone}`}>
                  {agent.tag}
                </span>
                <button
                  type="button"
                  className="lucky-agent-auto"
                  onClick={(event) => {
                    event.stopPropagation();
                    message.info(`${agent.name} 已切换为 Auto`);
                  }}
                >
                  <ThunderboltOutlined />
                  <span>Auto</span>
                  <DownOutlined />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LuckyModule() {
  const [sidebarWidth, setSidebarWidth] = useState(() => loadLuckySidebarWidth());
  const [activeSection, setActiveSection] = useState('new');
  const [activeTaskKey, setActiveTaskKey] = useState(null);
  const [workMode, setWorkMode] = useState('office');
  const [activeCodeSection, setActiveCodeSection] = useState('new-app');
  const [activeCodeAppKey, setActiveCodeAppKey] = useState(null);
  const [agentTab, setAgentTab] = useState('mine');
  const [createdAgents, setCreatedAgents] = useState([]);
  const [createdSquads, setCreatedSquads] = useState([]);
  const [squadOverrides, setSquadOverrides] = useState({});
  const [deletedAgentKeys, setDeletedAgentKeys] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [editingSquad, setEditingSquad] = useState(null);
  const [agentInstructions, setAgentInstructions] = useState({});
  const [agentSkills, setAgentSkills] = useState({});
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [activeProject, setActiveProject] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [promptText, setPromptText] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [teamAgentOpen, setTeamAgentOpen] = useState(false);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [skillMarketOpen, setSkillMarketOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskFilterOpen, setTaskFilterOpen] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskTimeFilter, setTaskTimeFilter] = useState('all');
  const sidebarWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const handleSidebarResizeStart = useCallback((event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setSidebarWidth(getBoundedLuckySidebarWidth(startWidth + deltaX));
    };

    const handlePointerUp = () => {
      persistLuckySidebarWidth(sidebarWidthRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [sidebarWidth]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return LIBRARY_ROWS.filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
      if (!normalizedKeyword) return true;
      return `${item.title} ${item.source} ${item.type}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [keyword, scopeFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [activePage, filteredRows]);

  const stats = useMemo(() => {
    const documentCount = filteredRows.filter((item) => item.type === '文档').length;
    const skillCount = filteredRows.filter((item) => item.source === '学海导航者').length;
    return {
      total: filteredRows.length,
      documents: documentCount,
      skills: skillCount,
    };
  }, [filteredRows]);

  const sectionCopy = SECTION_COPY[activeSection] ?? SECTION_COPY.new;
  const showTaskDetail = activeSection === INTRO_TASK_SECTION_KEY && activeTaskKey === INTRO_TASK_KEY;
  const showHome = activeSection === 'new' && !showTaskDetail;
  const showAutomation = activeSection === 'automation';
  const showAgents = activeSection === 'partners';
  const showProjectDetail = activeSection === 'projects' && Boolean(activeProject);
  const showProjects = activeSection === 'projects' && !showProjectDetail;
  const showLibrary = activeSection === 'library';
  const showMarket = activeSection === 'market';
  const isCodeMode = workMode === 'code';
  const activeCodeApp = activeCodeAppKey ? CODE_APP_DETAILS[activeCodeAppKey] : null;
  const showCodeAppDetail = isCodeMode && Boolean(activeCodeApp);
  const activeNavIndex = Math.max(0, NAV_ITEMS.findIndex((item) => item.key === activeSection));
  const hasTaskFilter = taskStatusFilter !== 'all' || taskTimeFilter !== 'all';
  const mineAgents = useMemo(
    () => [...AGENT_CARDS, ...createdAgents].filter((agent) => !deletedAgentKeys.includes(agent.key)),
    [createdAgents, deletedAgentKeys],
  );
  const agentSquads = useMemo(
    () => [...COMPOSER_TEAM_OPTIONS, ...createdSquads].map((squad) => ({
      ...squad,
      ...(squadOverrides[squad.key] || {}),
    })),
    [createdSquads, squadOverrides],
  );
  const squadMemberOptions = useMemo(
    () => {
      const agentMap = new Map();
      [...mineAgents, ...COMPOSER_EXTRA_AGENTS].forEach((agent) => {
        if (!agentMap.has(agent.key)) agentMap.set(agent.key, agent);
      });
      return [...agentMap.values()];
    },
    [mineAgents],
  );
  const editingAgentSkills = editingAgent ? (agentSkills[editingAgent.key] ?? AGENT_EDITOR_SKILLS) : AGENT_EDITOR_SKILLS;
  const editingSquadData = editingSquad
    ? agentSquads.find((squad) => squad.key === editingSquad.key) || editingSquad
    : null;

  const handleOpenSaveModal = (item) => {
    setSavingItem(item);
    setSaveModalOpen(true);
  };

  const handleSendPrompt = () => {
    if (!promptText.trim()) {
      message.info('请输入任务或目标');
      return;
    }
    message.success('已创建新任务');
    setPromptText('');
  };

  const handleCreateTeamAgent = (agent) => {
    setCreatedAgents((prev) => [...prev, agent]);
    setAgentTab('mine');
    message.success(`已创建：${agent.name}`);
  };

  const handleCreateAgentSquad = (squad) => {
    setCreatedSquads((prev) => [...prev, squad]);
    setAgentTab('team');
    message.success(`已创建小队：${squad.name}`);
  };

  const handleSaveSquadRules = (squadKey, instruction) => {
    setSquadOverrides((prev) => ({
      ...prev,
      [squadKey]: {
        ...(prev[squadKey] || {}),
        instruction,
      },
    }));
    message.success('协作规则已保存');
  };

  const handleCreateProject = ({ name, instruction }) => {
    const project = {
      key: `project-${Date.now()}`,
      name,
      instruction,
      createdAt: '创建于 刚刚',
    };
    setProjects((prev) => [...prev, project]);
    message.success(`已创建项目：${name}`);
  };

  const handleAgentInstructionChange = (agentKey, nextMarkdown) => {
    setAgentInstructions((prev) => ({
      ...prev,
      [agentKey]: nextMarkdown,
    }));
  };

  const handleAddAgentSkill = (skillName) => {
    if (!editingAgent) return;
    setAgentSkills((prev) => {
      const currentSkills = prev[editingAgent.key] ?? AGENT_EDITOR_SKILLS;
      if (currentSkills.includes(skillName)) return prev;
      return {
        ...prev,
        [editingAgent.key]: [...currentSkills, skillName],
      };
    });
    message.success(`已添加技能：${skillName}`);
  };

  const handleDeleteAgent = (agent) => {
    setDeletedAgentKeys((prev) => (prev.includes(agent.key) ? prev : [...prev, agent.key]));
    setCreatedAgents((prev) => prev.filter((item) => item.key !== agent.key));
    setAgentInstructions((prev) => {
      const next = { ...prev };
      delete next[agent.key];
      return next;
    });
    setAgentSkills((prev) => {
      const next = { ...prev };
      delete next[agent.key];
      return next;
    });
    setSkillMarketOpen(false);
    setEditingAgent(null);
    message.success(`已删除：${agent.name}`);
  };

  const handleSelectSection = (key) => {
    setActiveSection(key);
    setActiveTaskKey(null);
    setActiveProject(null);
    setSkillMarketOpen(false);
    if (key === 'partners') {
      setEditingAgent(null);
      setEditingSquad(null);
      return;
    }
    setEditingAgent(null);
    setEditingSquad(null);
  };

  const handleOpenIntroTask = () => {
    setActiveSection(INTRO_TASK_SECTION_KEY);
    setActiveTaskKey(INTRO_TASK_KEY);
    setActiveProject(null);
    setSkillMarketOpen(false);
    setEditingAgent(null);
    setEditingSquad(null);
  };

  const handleOpenIntroTaskFromSearch = () => {
    setGlobalSearchOpen(false);
    handleOpenIntroTask();
  };

  const handleCreateTaskFromSearch = () => {
    setGlobalSearchOpen(false);
    handleSelectSection('new');
  };

  const handleOpenProject = (project) => {
    setActiveSection('projects');
    setActiveTaskKey(null);
    setActiveProject(project);
    setSkillMarketOpen(false);
    setEditingAgent(null);
    setEditingSquad(null);
  };

  const renderTaskFilterOption = (item, activeKey, onSelect) => {
    const selected = activeKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        className={`lucky-task-filter-option ${selected ? 'is-selected' : ''}`}
        role="menuitemradio"
        aria-checked={selected}
        onClick={() => onSelect(item.key)}
      >
        <span>{item.label}</span>
        {selected ? <CheckOutlined /> : null}
      </button>
    );
  };

  const taskFilterPanel = (
    <div className="lucky-task-filter-menu" role="menu" aria-label="任务筛选">
      <div className="lucky-task-filter-label">筛选状态</div>
      <div className="lucky-task-filter-options">
        {TASK_STATUS_FILTERS.map((item) => renderTaskFilterOption(item, taskStatusFilter, setTaskStatusFilter))}
      </div>
      <div className="lucky-task-filter-divider" />
      <div className="lucky-task-filter-label">筛选时间</div>
      <div className="lucky-task-filter-options">
        {TASK_TIME_FILTERS.map((item) => renderTaskFilterOption(item, taskTimeFilter, setTaskTimeFilter))}
      </div>
      <div className="lucky-task-filter-divider" />
      <button
        type="button"
        className="lucky-task-filter-reset"
        disabled={!hasTaskFilter}
        onClick={() => {
          setTaskStatusFilter('all');
          setTaskTimeFilter('all');
        }}
      >
        重置筛选条件
      </button>
    </div>
  );

  return (
    <div className={`lucky-module ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      {!showCodeAppDetail ? (
        <>
          {sidebarCollapsed ? (
            <button
              type="button"
              className="lucky-sidebar-floating-toggle"
              title="展开侧栏"
              aria-label="展开侧栏"
              onClick={() => setSidebarCollapsed(false)}
            >
              <MenuUnfoldOutlined />
            </button>
          ) : null}
          <aside
            className={`lucky-sidebar ${isCodeMode ? 'is-code-mode' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            style={
              sidebarCollapsed
                ? { width: 0, minWidth: 0, maxWidth: 0 }
                : { width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }
            }
          >
            <div className="lucky-sidebar-topbar">
              <div className="lucky-window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="lucky-sidebar-tools">
                <button
                  type="button"
                  className="lucky-sidebar-tool"
                  title="收起侧栏"
                  aria-label="收起侧栏"
                  onClick={() => {
                    setTaskFilterOpen(false);
                    setSidebarCollapsed(true);
                  }}
                >
                  <MenuFoldOutlined />
                </button>
                <button
                  type="button"
                  className="lucky-sidebar-tool"
                  title="搜索任务"
                  aria-label="搜索任务"
                  onClick={() => setGlobalSearchOpen(true)}
                >
                  <SearchOutlined />
                </button>
                <Dropdown
                  trigger={['click']}
                  open={taskFilterOpen}
                  onOpenChange={setTaskFilterOpen}
                  popupRender={() => taskFilterPanel}
                  placement="bottomRight"
                  classNames={{ root: 'lucky-task-filter-dropdown' }}
                  destroyOnHidden
                >
                  <button
                    type="button"
                    className={`lucky-sidebar-tool ${taskFilterOpen || hasTaskFilter ? 'is-active' : ''}`}
                    title="筛选任务"
                    aria-label="筛选任务"
                  >
                    <FilterOutlined />
                  </button>
                </Dropdown>
              </div>
            </div>

            <div className="lucky-sidebar-profile">
              <div className="lucky-sidebar-brand">
                <span className="lucky-brand-logo" aria-hidden="true" />
                <span className="lucky-sidebar-name">lucky</span>
              </div>
            </div>

            <div className={`lucky-work-mode-switch ${workMode === 'code' ? 'is-code' : 'is-office'}`} aria-label="工作模式">
              {WORK_MODES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`lucky-mode-button ${workMode === item.key ? 'is-active' : ''}`}
                  onClick={() => setWorkMode(item.key)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {isCodeMode ? (
              <CodeSidebarContent
                activeCodeSection={activeCodeSection}
                activeCodeAppKey={activeCodeAppKey}
                onCodeSectionChange={setActiveCodeSection}
                onOpenCodeApp={setActiveCodeAppKey}
              />
            ) : (
              <>
                <nav
                  className={`lucky-sidebar-nav ${showTaskDetail ? 'is-task-detail' : ''}`}
                  style={{ '--lucky-nav-active-y': `${activeNavIndex * 38}px` }}
                  aria-label="Lucky 导航"
                >
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`lucky-nav-item ${!showTaskDetail && activeSection === item.key ? 'is-active' : ''}`}
                      onClick={() => handleSelectSection(item.key)}
                    >
                      <span className="lucky-nav-icon">{item.icon}</span>
                      <span className="lucky-nav-label">{item.label}</span>
                      {item.meta ? <span className="lucky-nav-meta">{item.meta}</span> : null}
                    </button>
                  ))}
                </nav>

                <div className="lucky-task-section">
                  <div className="lucky-task-head">
                    <span>任务</span>
                    <button type="button" className="lucky-sidebar-tool" title="任务设置" aria-label="任务设置">
                      <ControlOutlined />
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`lucky-task-shortcut ${showTaskDetail ? 'is-active' : ''}`}
                    onClick={handleOpenIntroTask}
                  >
                    <span className="lucky-task-text">介绍并引导上手使用</span>
                    <span className="lucky-task-dot" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </aside>
          {!sidebarCollapsed ? (
            <div
              className="lucky-sidebar-resize-handle"
              role="separator"
              aria-orientation="vertical"
              aria-label="调整侧栏宽度"
              onPointerDown={handleSidebarResizeStart}
            />
          ) : null}
        </>
      ) : null}

      <main className="lucky-main">
        <div className="lucky-main-inner">
          {isCodeMode ? (
            activeCodeApp ? (
              <CodeAppDetailPage
                app={activeCodeApp}
                onBackHome={() => {
                  setActiveCodeAppKey(null);
                  setActiveCodeSection('new-app');
                }}
                onOpenRecentApp={setActiveCodeAppKey}
              />
            ) : activeCodeSection === 'discover' ? (
              <CodeDiscoverPage />
            ) : (
              <CodeModeHome
                promptText={promptText}
                onPromptChange={setPromptText}
                onSend={handleSendPrompt}
              />
            )
          ) : showTaskDetail ? (
            <TaskDetailPage onSendReply={() => message.success('已发送补充信息')} />
          ) : showHome ? (
            <LuckyHome
              promptText={promptText}
              onPromptChange={setPromptText}
              onSend={handleSendPrompt}
              agents={mineAgents}
              teams={agentSquads}
              projects={projects}
              onOpenCreateProject={() => setCreateProjectOpen(true)}
            />
          ) : showAutomation ? (
            <AutomationPage />
          ) : showAgents ? (
            editingSquadData ? (
              <AgentSquadEditorPage
                key={editingSquadData.key}
                squad={editingSquadData}
                agents={mineAgents}
                onBack={() => {
                  setAgentTab('team');
                  setEditingSquad(null);
                }}
                onStartNewTask={() => {
                  setEditingSquad(null);
                  setActiveSection('new');
                  setActiveTaskKey(null);
                }}
                onSaveRules={handleSaveSquadRules}
              />
            ) : editingAgent ? (
              editingAgent.key === BUILT_IN_AGENT_KEY ? (
                <BuiltInAgentEditorPage
                  agent={editingAgent}
                  skills={editingAgentSkills}
                  onOpenSkillMarket={() => setSkillMarketOpen(true)}
                  onBack={() => {
                    setSkillMarketOpen(false);
                    setEditingAgent(null);
                    setEditingSquad(null);
                  }}
                  onStartNewTask={() => {
                    setSkillMarketOpen(false);
                    setEditingAgent(null);
                    setEditingSquad(null);
                    setActiveSection('new');
                    setActiveTaskKey(null);
                  }}
                />
              ) : (
                <AgentEditorPage
                  agent={editingAgent}
                  skills={editingAgentSkills}
                  instructionMarkdown={agentInstructions[editingAgent.key] ?? DEFAULT_AGENT_INSTRUCTION_MARKDOWN}
                  onInstructionChange={(nextMarkdown) => handleAgentInstructionChange(editingAgent.key, nextMarkdown)}
                  onOpenSkillMarket={() => setSkillMarketOpen(true)}
                  onDeleteAgent={handleDeleteAgent}
                  onBack={() => {
                    setSkillMarketOpen(false);
                    setEditingAgent(null);
                    setEditingSquad(null);
                  }}
                  onStartNewTask={() => {
                    setSkillMarketOpen(false);
                    setEditingAgent(null);
                    setEditingSquad(null);
                    setActiveSection('new');
                    setActiveTaskKey(null);
                  }}
                />
              )
            ) : (
              <AgentManagementPage
                activeTab={agentTab}
                agents={mineAgents}
                agentSquads={agentSquads}
                onTabChange={setAgentTab}
                onOpenCreateAgent={() => setCreateAgentOpen(true)}
                onOpenCreateSquad={() => setCreateSquadOpen(true)}
                onOpenAgent={(agent) => {
                  setEditingSquad(null);
                  setEditingAgent(agent);
                }}
                onOpenSquad={(squad) => {
                  setEditingAgent(null);
                  setEditingSquad(squad);
                }}
              />
            )
          ) : showProjectDetail ? (
            <ProjectDetailPage project={activeProject} onBackToProjects={() => setActiveProject(null)} />
          ) : showProjects ? (
            <ProjectsPage
              projects={projects}
              onOpenCreate={() => setCreateProjectOpen(true)}
              onOpenProject={handleOpenProject}
            />
          ) : showLibrary ? (
            <div className="lucky-workspace-card lucky-library-view">
              <div className="lucky-page-header">
                <div>
                  <div className="lucky-page-title">资源库</div>
                </div>
                <div className="lucky-toolbar">
                  <Select
                    value={sourceFilter}
                    options={SOURCE_OPTIONS}
                    className="lucky-select"
                    onChange={(value) => {
                      setSourceFilter(value);
                      setCurrentPage(1);
                    }}
                  />
                  <Select
                    value={scopeFilter}
                    options={SCOPE_OPTIONS}
                    className="lucky-select"
                    onChange={(value) => {
                      setScopeFilter(value);
                      setCurrentPage(1);
                    }}
                  />
                  <Input
                    allowClear
                    value={keyword}
                    className="lucky-search"
                    placeholder="搜索"
                    prefix={<SearchOutlined />}
                    onChange={(event) => {
                      setKeyword(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="lucky-stat-grid">
                <StatCard title="全部条目" value={stats.total} hint="当前筛选结果" />
                <StatCard title="文档" value={stats.documents} hint="可直接查看与复用" />
                <StatCard title="导航者资源" value={stats.skills} hint="来自学海导航者" />
              </div>

              <div className="lucky-library-table-scroll">
                <div className="lucky-library-table">
                  <div className="lucky-library-row lucky-library-row-header">
                    <div className="lucky-library-cell col-name">名称</div>
                    <div className="lucky-library-cell col-source">来源</div>
                    <div className="lucky-library-cell col-type">类型</div>
                    <div className="lucky-library-cell col-time">时间</div>
                    <div className="lucky-library-cell col-view">查看</div>
                    <div className="lucky-library-cell col-action">操作</div>
                  </div>

                  {pagedRows.map((item) => (
                    <div key={item.id} className="lucky-library-row">
                      <div className="lucky-library-cell col-name lucky-library-name" title={item.title}>
                        {item.title}
                      </div>
                      <div className="lucky-library-cell col-source">{item.source}</div>
                      <div className="lucky-library-cell col-type">
                        <Tag className={`lucky-type-tag ${item.type === '文档' ? 'is-document' : ''}`}>
                          {item.type}
                        </Tag>
                      </div>
                      <div className="lucky-library-cell col-time">{item.time}</div>
                      <div className="lucky-library-cell col-view">
                        <button
                          type="button"
                          className="lucky-link-button"
                          onClick={() => message.success(`已打开详情：${item.title}`)}
                        >
                          查看详情
                        </button>
                      </div>
                      <div className="lucky-library-cell col-action">
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            items: [
                              {
                                key: 'save-to-library',
                                label: '另存为资源库',
                              },
                            ],
                            onClick: ({ key }) => {
                              if (key === 'save-to-library') handleOpenSaveModal(item);
                            },
                          }}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            className="lucky-row-action"
                            icon={<EllipsisOutlined />}
                          />
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lucky-table-footer">
                <div className="lucky-table-meta">
                  第 {activePage} / {totalPages} 页，共 {filteredRows.length} 条
                </div>
                <div className="lucky-pagination">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        type="button"
                        className={`lucky-page-btn ${page === activePage ? 'is-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="lucky-page-btn lucky-page-next"
                    disabled={activePage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          ) : showMarket ? (
            <MarketPage />
          ) : (
            <ShowcaseSection
              title={sectionCopy.title}
              description={sectionCopy.description}
              cards={sectionCopy.cards}
            />
          )}
        </div>
      </main>

      <ResourceLibrarySaveModal
        open={saveModalOpen}
        item={savingItem}
        onClose={() => {
          setSaveModalOpen(false);
          setSavingItem(null);
        }}
        onSaved={({ libraryName, name }) => {
          message.success(`已将「${name}」另存到${libraryName}`);
        }}
      />
      <CreateAgentModal
        open={createAgentOpen}
        onClose={() => setCreateAgentOpen(false)}
        onAddTeamAgent={() => setTeamAgentOpen(true)}
        onOpenMarket={() => handleSelectSection('market')}
      />
      <TeamAgentModal
        open={teamAgentOpen}
        onClose={() => setTeamAgentOpen(false)}
        onCreate={handleCreateTeamAgent}
      />
      <CreateAgentSquadModal
        open={createSquadOpen}
        agents={squadMemberOptions}
        onClose={() => setCreateSquadOpen(false)}
        onCreate={handleCreateAgentSquad}
      />
      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreate={handleCreateProject}
      />
      <SkillMarketModal
        open={skillMarketOpen && Boolean(editingAgent)}
        selectedSkills={editingAgentSkills}
        onClose={() => setSkillMarketOpen(false)}
        onAddSkill={handleAddAgentSkill}
      />
      <LuckyGlobalSearchModal
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onCreateTask={handleCreateTaskFromSearch}
        onOpenIntroTask={handleOpenIntroTaskFromSearch}
      />
    </div>
  );
}

export default LuckyModule;
