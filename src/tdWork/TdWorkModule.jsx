import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Dropdown, Empty, Input, Modal, Pagination, Segmented, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  AppstoreFilled,
  ArrowUpOutlined,
  AudioOutlined,
  BarChartOutlined,
  BookOutlined,
  BookFilled,
  CaretRightFilled,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  CloudOutlined,
  CloudFilled,
  CloudServerOutlined,
  CodeOutlined,
  ControlOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DatabaseFilled,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  FolderOutlined,
  FolderFilled,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HomeOutlined,
  HomeFilled,
  HeartOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  LeftOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RightOutlined,
  RobotOutlined,
  RobotFilled,
  SearchOutlined,
  ShareAltOutlined,
  StarOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import TopicDetail from '../TopicDetail';
import ResourceLibrary from '../resourceLib/ResourceLibrary';
import { getSceneTypeLabel, getSceneVisibilityLabel, normalizeTopicCardConfig, sceneApi } from '../scene/api';
import SceneCreateModal from '../scene/SceneCreateModal';
import { getSceneThemeCoverStyle } from '../scene/themeCovers';
import tongdaLogo from '../assets/tongda-logo.jpg';
import academyCreationBanner from '../assets/academy/creation-banner.jpg';
import academyReplayAnimation from '../assets/academy/replay-animation.png';
import academyReplayCourseware from '../assets/academy/replay-courseware.png';
import academyGuideEnglish from '../assets/academy/guide-english.jpg';
import academyGuideTraining from '../assets/academy/guide-training.jpg';
import academyTipCore from '../assets/academy/tip-core.jpg';
import academyTipEnglish from '../assets/academy/tip-english.jpg';
import academyTipPoem from '../assets/academy/tip-poem.jpg';
import academyTipPrompt from '../assets/academy/tip-prompt.jpg';
import academyTipFeatures from '../assets/academy/tip-features.jpg';
import academyTipGeometry from '../assets/academy/tip-geometry.jpg';
import './TdWorkModule.css';

const TD_WORK_SIDEBAR_STORAGE_KEY = 'td-work.sidebar-width.v3';
const TD_WORK_SIDEBAR_DEFAULT_WIDTH = 224;
const TD_WORK_SIDEBAR_COMPACT_WIDTH = 220;
const TD_WORK_SIDEBAR_MIN_WIDTH = 208;
const TD_WORK_SIDEBAR_MAX_WIDTH = 320;
const TD_WORK_SPACE_RAIL_STORAGE_KEY = 'td-work.space-rail-width.v1';
const TD_WORK_SPACE_RAIL_DEFAULT_WIDTH = 168;
const TD_WORK_SPACE_RAIL_COMPACT_WIDTH = 150;
const TD_WORK_SPACE_RAIL_MIN_WIDTH = 132;
const TD_WORK_SPACE_RAIL_MAX_WIDTH = 320;

function getDefaultTdWorkSidebarWidth() {
  if (typeof window !== 'undefined' && window.innerWidth <= 860) {
    return TD_WORK_SIDEBAR_COMPACT_WIDTH;
  }
  return TD_WORK_SIDEBAR_DEFAULT_WIDTH;
}

function getBoundedTdWorkSidebarWidth(value) {
  if (value == null || value === '') return getDefaultTdWorkSidebarWidth();
  const width = Number(value);
  const viewportMax = typeof window === 'undefined'
    ? TD_WORK_SIDEBAR_MAX_WIDTH
    : Math.max(TD_WORK_SIDEBAR_MIN_WIDTH, Math.min(TD_WORK_SIDEBAR_MAX_WIDTH, window.innerWidth - 420));
  if (!Number.isFinite(width)) return getDefaultTdWorkSidebarWidth();
  return Math.max(TD_WORK_SIDEBAR_MIN_WIDTH, Math.min(viewportMax, Math.round(width)));
}

function loadTdWorkSidebarWidth() {
  if (typeof window === 'undefined') return TD_WORK_SIDEBAR_DEFAULT_WIDTH;
  try {
    return getBoundedTdWorkSidebarWidth(window.localStorage.getItem(TD_WORK_SIDEBAR_STORAGE_KEY));
  } catch {
    return getDefaultTdWorkSidebarWidth();
  }
}

function persistTdWorkSidebarWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TD_WORK_SIDEBAR_STORAGE_KEY, String(getBoundedTdWorkSidebarWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

function getDefaultTdWorkSpaceRailWidth() {
  if (typeof window !== 'undefined' && window.innerWidth <= 860) {
    return TD_WORK_SPACE_RAIL_COMPACT_WIDTH;
  }
  return TD_WORK_SPACE_RAIL_DEFAULT_WIDTH;
}

function getBoundedTdWorkSpaceRailWidth(value) {
  if (value == null || value === '') return getDefaultTdWorkSpaceRailWidth();
  const width = Number(value);
  const viewportMax = typeof window === 'undefined'
    ? TD_WORK_SPACE_RAIL_MAX_WIDTH
    : Math.max(TD_WORK_SPACE_RAIL_MIN_WIDTH, Math.min(TD_WORK_SPACE_RAIL_MAX_WIDTH, window.innerWidth - 560));
  if (!Number.isFinite(width)) return getDefaultTdWorkSpaceRailWidth();
  return Math.max(TD_WORK_SPACE_RAIL_MIN_WIDTH, Math.min(viewportMax, Math.round(width)));
}

function loadTdWorkSpaceRailWidth() {
  if (typeof window === 'undefined') return TD_WORK_SPACE_RAIL_DEFAULT_WIDTH;
  try {
    return getBoundedTdWorkSpaceRailWidth(window.localStorage.getItem(TD_WORK_SPACE_RAIL_STORAGE_KEY));
  } catch {
    return getDefaultTdWorkSpaceRailWidth();
  }
}

function persistTdWorkSpaceRailWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TD_WORK_SPACE_RAIL_STORAGE_KEY, String(getBoundedTdWorkSpaceRailWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

const NAV_ITEMS = [
  { key: 'home', label: '首页', icon: <HomeOutlined />, activeIcon: <HomeFilled /> },
  { key: 'resource-market', label: '资源广场', icon: <CloudServerOutlined />, activeIcon: <DatabaseFilled /> },
  { key: 'app-market', label: '应用广场', icon: <AppstoreOutlined />, activeIcon: <AppstoreFilled /> },
  { key: 'academy', label: '通答学院', icon: <BookOutlined />, activeIcon: <BookFilled /> },
  { key: 'expert-studios', label: '专家工作室', icon: <TeamOutlined />, activeIcon: <TeamOutlined /> },
  { key: 'space', label: '空间', icon: <CloudOutlined />, activeIcon: <CloudFilled /> },
  { key: 'scheduled', label: '自动化', icon: <ClockCircleOutlined />, activeIcon: <ClockCircleFilled /> },
  { key: 'skills', label: '智能体 · 技能 · 连接器', icon: <RobotOutlined />, activeIcon: <RobotFilled /> },
  { key: 'cloud', label: '资料库', icon: <FolderOutlined />, activeIcon: <FolderFilled /> },
];

const PINNED_ITEMS = [
  { key: 'main-dialog', label: '主对话', tone: 'blue', icon: <MessageOutlined /> },
];

const SIDEBAR_SPACE_PRIORITY = [
  'scene_online_academy_training_seed_1',
  'scene_online_academy_training_seed_4',
  'scene_supervision_seed_1',
  'scene_course_studio_seed_1',
];

const SPACE_CONVERSATION_ITEMS = [
  {
    key: 'space-session-tongda-academy',
    label: '通答学院运营会话',
    tone: 'green',
    icon: <MessageOutlined />,
    kind: 'space-session',
    sceneId: 'scene_online_academy_training_seed_1',
  },
  {
    key: 'space-session-class-quality',
    label: '课堂教学质量专项督导会话',
    tone: 'blue',
    icon: <MessageOutlined />,
    kind: 'space-session',
    sceneId: 'scene_supervision_seed_1',
  },
  {
    key: 'space-session-new-teacher',
    label: '新教师岗前培训组织会话',
    tone: 'purple',
    icon: <MessageOutlined />,
    kind: 'space-session',
    sceneId: 'scene_training_seed_1',
  },
];

const RECENT_ITEMS = [
  { key: 'weekly-teaching', label: '周三教研活动纪要', tone: 'blue', icon: <ClockCircleOutlined /> },
  { key: 'training-budget', label: '教师培训经费测算表', tone: 'yellow', icon: <BarChartOutlined /> },
  { key: 'lesson-feedback', label: '课堂观察反馈整理', tone: 'pink', icon: <RobotOutlined /> },
  { key: 'course-polish', label: '研修课程文案润色', tone: 'purple', icon: <EditOutlined /> },
];

const SIDEBAR_TASK_STATUS_FILTERS = [
  { key: 'all', label: '全部状态' },
  { key: 'in-progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
  { key: 'pending', label: '待处理' },
  { key: 'planned', label: '规划中' },
];

const SIDEBAR_TASK_TIME_FILTERS = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'last-7-days', label: '最近 7 天' },
  { key: 'last-30-days', label: '最近 30 天' },
];

const DEFAULT_SPACE_SCENE_GROUP_NAME = '人工智能通识体系';

const AI_SPACE_DETAIL_THEME = {
  coverSource: 'COLOR',
  coverPresetId: null,
  coverStart: '#f4f5f7',
  coverEnd: '#ffffff',
  accentColor: '#606977',
  topicThemeMode: 'SCENE',
};

const SPACE_CARD_COVER_IMAGES = [
  '/assets/apps/pet-cover.jpg',
  '/assets/apps/peach-cover.jpg',
  '/assets/apps/island-cover.jpg',
  '/assets/apps/circuit-cover.jpg',
  '/assets/apps/drone-cover.jpg',
  '/assets/apps/writing-cover.jpg',
  '/assets/resources/geometry.jpg',
  '/assets/resources/classification.jpg',
  '/assets/resources/data.jpg',
  '/assets/expert-studios/studio-cover.png',
];

const SPACE_CARD_COVER_IMAGES_BY_TYPE = {
  SUPERVISION: ['/assets/resources/classification.jpg', '/assets/resources/circuit.jpg'],
  TEACHING: ['/assets/apps/island-cover.jpg', '/assets/apps/pet-cover.jpg', '/assets/resources/geometry.jpg'],
  RESEARCH: ['/assets/apps/circuit-cover.jpg', '/assets/apps/drone-cover.jpg', '/assets/resources/classification.jpg'],
  TRAINING: ['/assets/apps/writing-cover.jpg', '/assets/apps/peach-cover.jpg', '/assets/resources/geometry.jpg'],
  COMMUNITY: ['/assets/expert-studios/studio-cover.png', '/assets/apps/pet-cover.jpg', '/assets/apps/writing-cover.jpg'],
};

const RECOMMENDATIONS = [
  { key: 'routine', label: '处理日常工作', icon: <FileTextOutlined />, tone: 'blue', prompt: '帮我整理今天需要处理的工作任务，并按优先级排序。' },
  { key: 'content', label: '内容创作', icon: <EditOutlined />, tone: 'green', prompt: '帮我起草一篇面向老师的产品更新说明。' },
  { key: 'research', label: '完成调研分析', icon: <BarChartOutlined />, tone: 'purple', prompt: '帮我调研教育智能体在校内工作台中的使用场景。' },
  { key: 'design', label: '设计与创意', icon: <AppstoreOutlined />, tone: 'pink', prompt: '帮我设计一个智能体工作台的首屏交互方案。' },
];

const WORK_CONTENT_TABS = [
  { key: 'work-task', label: '工作任务', icon: <ProjectOutlined /> },
  { key: 'code-dev', label: '代码开发', icon: <CodeOutlined /> },
];

const CONTEXT_TOOLS = [
  { key: 'task', label: '工作任务', icon: <ProjectOutlined />, active: true },
  { key: 'space', label: '空间', icon: <AppstoreOutlined /> },
  { key: 'agent', label: '智能体', icon: <RobotOutlined /> },
  { key: 'confirm', label: '按需确认', icon: <CheckCircleOutlined /> },
];

const PANEL_CONTENT = {
  task: ['新建待办', '拆分步骤', '生成执行清单'],
  confirm: ['发送前确认', '关键节点确认', '自动推进'],
};

const WORK_TASK_TARGETS = [
  { key: 'local', label: '工作任务', place: '本地电脑', tone: 'blue', icon: <LaptopOutlined /> },
  { key: 'cloud', label: '工作任务', place: '云电脑', tone: 'green', icon: <CloudOutlined /> },
];

const COMPOSER_SKILLS = [
  {
    key: 'playwright',
    name: 'Playwright 浏览器自动化',
    desc: '通过 Playwright MCP 导航网页、检查页面状态、点击和输入内容。',
    shortcut: '⌘ 3',
    tone: 'gray',
    icon: <DatabaseOutlined />,
  },
  {
    key: 'lesson-ppt',
    name: 'PPT',
    desc: '帮你生成、编辑和美化培训课件、教研汇报与公开课展示。',
    shortcut: '⌘ 4',
    tone: 'cyan',
    icon: <FileTextOutlined />,
  },
  {
    key: 'creative-design',
    name: '创意设计',
    desc: '生成课程封面、活动海报、社群配图和视觉素材。',
    shortcut: '⌘ 5',
    tone: 'gray',
    icon: <AppstoreOutlined />,
  },
  {
    key: 'message',
    name: '消息',
    desc: '帮你发布通知、查询和总结聊天记录、管理群聊。',
    shortcut: '⌘ 6',
    tone: 'purple',
    icon: <MessageOutlined />,
  },
  {
    key: 'voice-transcript',
    name: '录音转写',
    desc: '帮你录音，可用于记录面聊或会议，生成摘要、纪要和待办。',
    shortcut: '⌘ 7',
    tone: 'purple',
    icon: <AudioOutlined />,
  },
  {
    key: 'calendar',
    name: '日历',
    desc: '帮你查看和安排日程、邀请参会人、查忙闲、订会议室。',
    shortcut: '⌘ 8',
    tone: 'gray',
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'email',
    name: '邮箱',
    desc: '帮你起草和发送邮件，整理培训通知与材料回执。',
    shortcut: '⌘ 9',
    tone: 'green',
    icon: <BookOutlined />,
  },
  {
    key: 'contacts',
    name: '通讯录',
    desc: '帮你查询教师、学员、培训负责人和协作成员的信息。',
    shortcut: '',
    tone: 'cyan',
    icon: <UserOutlined />,
  },
  {
    key: 'sheet',
    name: '多维表格',
    desc: '帮你搭建和管理多维表格，支持记录读写、跨表计算和图表分析。',
    shortcut: '',
    tone: 'blue',
    icon: <DatabaseOutlined />,
  },
  {
    key: 'board',
    name: '画板',
    desc: '帮你查看和编辑文档中的画板，支持把架构、流程、关系绘制成图形。',
    shortcut: '',
    tone: 'purple',
    icon: <AppstoreOutlined />,
  },
  {
    key: 'teaching-plan',
    name: '教案生成',
    desc: '根据课标、教材和学情生成教学设计、活动流程和板书建议。',
    shortcut: '',
    tone: 'orange',
    icon: <EditOutlined />,
  },
  {
    key: 'research-summary',
    name: '教研纪要',
    desc: '整理听评课记录、研讨共识、改进动作和责任人。',
    shortcut: '',
    tone: 'green',
    icon: <CheckCircleOutlined />,
  },
  {
    key: 'training-report',
    name: '研修报告',
    desc: '汇总培训签到、学习任务、作业反馈和教师成长证据。',
    shortcut: '',
    tone: 'blue',
    icon: <BarChartOutlined />,
  },
  {
    key: 'resource-curation',
    name: '资源整理',
    desc: '按主题归类课例、论文、政策文件和课程素材。',
    shortcut: '',
    tone: 'mint',
    icon: <FolderOutlined />,
  },
];

const MODE_OPTIONS = [
  { key: 'auto', label: 'Auto 高' },
  { key: 'balanced', label: 'Auto 均衡' },
  { key: 'fast', label: 'Auto 快' },
];

const createCustomConnectorForm = () => ({
  name: '',
  transport: 'HTTP',
  url: '',
  headers: [],
});

const SCHEDULED_TASK_TEMPLATES = [
  {
    key: 'teacher-weekly-report',
    title: '教师研修周报',
    desc: '自动汇总本周听评课、培训打卡与教学反思',
    prompt: '每周五下午帮我生成教师研修周报，汇总听评课、培训打卡和教学反思。',
  },
  {
    key: 'daily-class-brief',
    title: '每日授课简报',
    desc: '推送今日课程、班级提醒和课前准备事项',
    prompt: '每天早上 7 点整理今日授课安排、班级提醒和课前准备事项。',
  },
  {
    key: 'training-homework',
    title: '培训作业催办',
    desc: '提醒参训教师完成签到、学习任务和作业提交',
    prompt: '每周三提醒参训教师完成培训签到、学习任务和作业提交。',
  },
  {
    key: 'teaching-resource-push',
    title: '教研资料推送',
    desc: '汇总学科课例、政策文件、论文与资源动态',
    prompt: '每周一推送本学科最新课例、政策文件、论文和教学资源。',
  },
  {
    key: 'student-growth-follow',
    title: '学员成长跟进',
    desc: '定期整理学习表现、作业问题和个别辅导建议',
    prompt: '每周四整理学员学习表现、作业问题和个别辅导建议。',
  },
  {
    key: 'competition-research',
    title: '竞品课程调研',
    desc: '实时跟进同类培训项目、课程活动和招生动向',
    prompt: '每天上午帮我跟进同类培训项目、课程活动和招生动态。',
  },
  {
    key: 'daily-learning-words',
    title: '每日教育术语',
    desc: '每日推送一个教育教学术语、案例和应用提示',
    prompt: '每天早上推送一个教育教学术语，并给出课堂应用案例。',
  },
  {
    key: 'weekend-reading',
    title: '周末读书会提醒',
    desc: '为教师读书会准备议题、材料和签到提醒',
    prompt: '每周六上午提醒教师读书会安排，并准备议题和阅读材料。',
  },
  {
    key: 'certificate-deadline',
    title: '证书申报节点',
    desc: '跟踪培训证书、学时认定和材料提交截止时间',
    prompt: '每月检查培训证书、学时认定和材料提交截止时间。',
  },
];

const PROJECT_LIST_ITEMS = [
  {
    key: 'teacher-training',
    name: '教师研修项目',
    desc: '同步培训计划、学员任务、课程资源与成果材料',
    updatedAt: '添加于 1 小时前',
    members: 12,
  },
];

const PROJECT_TEMPLATES = [
  {
    key: 'training-flow',
    name: '教师研修全流程',
    desc: '从需求规划、报名签到到成果沉淀一站式推进',
  },
  {
    key: 'course-research',
    name: '教研活动与听评课',
    desc: '沉淀课堂观察、评课记录、改进建议和复盘材料',
  },
  {
    key: 'resource-base',
    name: '校本资源共建',
    desc: '持续沉淀 SOP、经验知识、课例和常见问答',
  },
  {
    key: 'project-delivery',
    name: '培训项目交付',
    desc: '管理培训需求、计划、风险和周报',
  },
  {
    key: 'learner-growth',
    name: '学员成长跟进',
    desc: '跟踪作业提交、学习反馈和个别辅导记录',
  },
];

const PROJECT_WORK_TABS = [
  { key: 'activity', label: '动态' },
  { key: 'plan', label: '计划' },
  { key: 'tasks', label: '任务' },
  { key: 'assets', label: '资产' },
];

const PROJECT_CONFIG_ITEMS = [
  {
    key: 'instruction',
    title: '指令',
    desc: '设定项目背景与规范，让 AI 与你高效协作',
    icon: <FileTextOutlined />,
  },
  {
    key: 'connector',
    title: '连接器',
    desc: '连接外部服务，扩展 AI 能力',
    icon: <LinkOutlined />,
  },
  {
    key: 'expert',
    title: '专家',
    desc: '配置项目专家，为成员提供专业服务',
    icon: <TeamOutlined />,
  },
  {
    key: 'skill',
    title: '技能',
    desc: '配置项目技能，让 AI 精准执行任务',
    icon: <RobotOutlined />,
  },
  {
    key: 'automation',
    title: '自动化',
    desc: '让 AI 按计划自动执行任务',
    icon: <ClockCircleOutlined />,
  },
];

const ACADEMY_REPLAYS = [
  { key: 'animation', title: '数理化教学动画的设计与使用', date: '2026.10.14', duration: '48:51', cover: academyReplayAnimation },
  { key: 'courseware', title: '多页课件设计与课堂交付', date: '2026.10.14', duration: '1:02:49', cover: academyReplayCourseware },
  { key: 'evidence', title: '课堂数据回收与循证教学', date: '2026.10.14', duration: '56:18', cover: academyTipCore },
  { key: 'workspace', title: '班级工作台从搭建到落地', date: '2026.09.24', duration: '52:06', cover: academyTipFeatures },
  { key: 'subject', title: '学科工作台搭建复用全流程', date: '2026.09.24', duration: '45:32', cover: academyTipPrompt },
  { key: 'rebuild', title: '重构学科备课与教研', date: '2026.09.11', duration: '50:24', cover: academyTipGeometry },
  { key: 'thinking', title: 'AI 课堂学生思维可视化', date: '2026.09.11', duration: '46:18', cover: academyTipEnglish },
  { key: 'evaluation', title: 'AI 赋能教学评一体化', date: '2026.09.11', duration: '58:42', cover: academyTipPoem },
  { key: 'math', title: '数学难点互动课件设计', date: '2026.08.29', duration: '42:16', cover: academyTipGeometry },
  { key: 'language', title: '词汇句型情境表达训练', date: '2026.08.29', duration: '39:54', cover: academyTipEnglish },
  { key: 'self-study', title: '全学科自学工作台搭建', date: '2026.08.29', duration: '51:22', cover: academyTipFeatures },
  { key: 'iteration', title: '教学应用搭建与数据迭代', date: '2026.08.29', duration: '47:08', cover: academyTipCore },
  { key: 'thinking-class', title: 'AI 辅助思考课堂设计', date: '2026.08.29', duration: '44:36', cover: academyTipPrompt },
  { key: '3d-courseware', title: '人机分工做 3D 交互课件', date: '2026.07.23', duration: '41:15', cover: academyTipGeometry },
  { key: 'math-game', title: '小学数学游戏化学习', date: '2026.07.23', duration: '38:48', cover: academyReplayAnimation },
  { key: 'class-management', title: '无代码班级管理系统', date: '2026.07.23', duration: '43:20', cover: academyReplayCourseware },
  { key: 'learning-portrait', title: '学情画像与教学偏好', date: '2026.07.23', duration: '36:52', cover: academyTipCore },
  { key: 'role-scaffold', title: '学习系统与角色脚手架', date: '2026.07.23', duration: '49:10', cover: academyTipFeatures },
  { key: 'open-course', title: 'AI 融合公开课课件打磨', date: '2026.07.23', duration: '54:26', cover: academyTipPoem },
];

const ACADEMY_GUIDE_TABS = ['全部', '官方推荐', '共创共学'];
const ACADEMY_GUIDES = [
  { key: 'english', title: '英语教学AI交互方法22讲', owner: '通答老师', category: '共创共学', cover: academyGuideEnglish },
  { key: 'training', title: '中小学教师AI培训实践任务操作手册', owner: '通答老师', category: '共创共学', cover: academyGuideTraining },
  { key: 'lesson', title: '课堂互动课件设计手册', owner: '通答老师', category: '官方推荐', cover: academyReplayCourseware },
  { key: 'starter', title: 'AI 教学创作入门路线', owner: '通答老师', category: '官方推荐', cover: academyReplayAnimation },
];

const ACADEMY_TIP_TABS = ['全部', '官方产品介绍', '上手指南', '使用技巧', '学科案例'];
const ACADEMY_FEATURE_TABS = ['全部', '教学动画', '教育应用', '教学游戏', '互动课件', 'AI命题', 'AI组题', 'AI教案·大单元'];
const ACADEMY_TUTORIALS = [
  { key: 'mobile', title: '网页端、手机端，随时随地开始创作', category: '上手指南', feature: '教育应用', cover: academyTipCore, duration: '01:43' },
  { key: 'upload', title: '上传教案，让你的课堂设计如虎添翼', category: '上手指南', feature: 'AI教案·大单元', cover: academyTipFeatures, duration: '01:59' },
  { key: 'confirm', title: '确认信息，让你的互动课件得心应手', category: '使用技巧', feature: '互动课件', cover: academyTipPrompt, duration: '01:38' },
  { key: 'prompt', title: '提示词怎么写，才能生成你真正想要的课件', category: '使用技巧', feature: '互动课件', cover: academyTipEnglish, duration: '02:03' },
  { key: 'resource', title: '插入资源，在课件中灵活调整资源', category: '使用技巧', feature: '互动课件', cover: academyTipPoem, duration: '02:36' },
  { key: 'edit', title: '编辑模式，什么时候适合手动编辑', category: '使用技巧', feature: '互动课件', cover: academyTipGeometry, duration: '01:50' },
  { key: 'optimize', title: '单页优化，快速优化你的单页课件', category: '使用技巧', feature: '互动课件', cover: academyTipCore, duration: '10:05' },
  { key: 'practice', title: '学生练习页：给学生一个专属的练习入口', category: '使用技巧', feature: '教育应用', cover: academyTipFeatures, duration: '02:24' },
  { key: 'points', title: '积分不够用？每天自动领，点赞下载还能赚', category: '官方产品介绍', feature: '教育应用', cover: academyTipPrompt, duration: '02:23' },
  { key: 'animation', title: '从生成动画到组织一堂好课', category: '学科案例', feature: '教学动画', cover: academyTipGeometry, duration: '01:59' },
  { key: 'poem', title: '圈点句画实操：给古诗课件加入批注与画笔互动', category: '学科案例', feature: '互动课件', cover: academyTipPoem, duration: '02:23' },
  { key: 'geometry', title: '小学几何交互动画：拖拽操作理解图形关系', category: '学科案例', feature: '教学动画', cover: academyTipGeometry, duration: '03:15' },
];

const ACADEMY_COURSE_DETAILS = {
  animation: {
    author: '陈霞',
    purpose: '互动课件',
    contentType: '使用技巧',
    audience: '理科教师',
    intro: '演示如何用好“一键改编”功能，快速改造出适合自己课堂的课件与仿真，讲解 AI 科学、合理、有边界地介入教学的方法。',
    goals: ['掌握资源广场调用与“一键改编”的操作方法', '学会制作参数可变的学科仿真并投入课堂使用', '理解 AI 介入教学的时机边界与伦理规范'],
  },
  courseware: {
    author: '陆建友',
    purpose: '互动课件',
    contentType: '使用技巧',
    audience: '全学科教师',
    intro: '围绕多页课件的结构规划、内容生成、页面优化和课堂交付，讲解如何把零散想法整理成可直接使用的教学方案。',
    goals: ['掌握多页课件的结构设计方法', '理解页面内容与课堂活动的衔接逻辑', '完成一套可持续修改和复用的课堂课件'],
  },
  evidence: {
    author: '张文',
    purpose: '教育应用',
    contentType: '课堂实践',
    audience: '一线教师',
    intro: '从课堂数据收集、结果分析到教学调整，介绍如何形成可追踪、可复盘的循证教学闭环。',
    goals: ['搭建课堂数据回收入口', '读懂学生反馈和学习结果', '根据数据持续优化教学设计'],
  },
};

const EXPERT_STUDIO_PROVINCES = [
  '全部', '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
  '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省',
  '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区',
  '新疆生产建设兵团', '香港特别行政区', '澳门特别行政区',
];

const EXPERT_STUDIOS = [
  {
    key: 'hou-qiying', name: '侯琪颖指导团队工作室', province: '福建省', cover: '/assets/expert-studios/hou-qiying.jpg', views: '822', follows: '14',
    desc: '本着“共学、共研、共创、共育、共享、共赢”理念，聚焦AI素养、智能教研、融合应用、素养评价、资源共建五大方向。',
  },
  {
    key: 'li-mingji', name: '李明姬指导团队工作室', province: '吉林省', cover: '/assets/expert-studios/li-mingji.jpg', views: '2188', follows: '40',
    desc: '对接国家中小学智慧教育平台与吉林省云校，构建“教研员引领、骨干教师为核心、城乡教师广泛参与”的成长模式。',
  },
  {
    key: 'yu-bin', name: '余斌AI素养指导团队工作室', province: '陕西省', cover: '/assets/expert-studios/yu-bin.jpg', views: '686', follows: '32',
    desc: '立足陕西组建省级线上教师AI素养专业指导团队，聚焦教师AI素养提升、AI赋能课堂与教学资源开发。',
  },
  {
    key: 'jin-fei', name: '金菲指导团队工作室', province: '江苏省', cover: '/assets/expert-studios/jin-fei.jpg', views: '873', follows: '14',
    desc: '由江苏省网络名师工作室领衔人主持，围绕教师人工智能素养提升，系统推进培训、教研、应用研究与技术支持。',
  },
  {
    key: 'zhang-lei', name: '张磊指导团队工作室', province: '四川省', cover: '/assets/expert-studios/zhang-lei.jpg', views: '6606', follows: '39',
    desc: '团队跨高校、教师发展机构和中小学校组建，在人工智能教育应用和教师数字素养提升方面成果丰富。',
  },
  {
    key: 'yi-hong', name: '易宏指导团队工作室', province: '云南省', cover: '/assets/expert-studios/yi-hong.jpg', views: '973', follows: '25',
    desc: '面向一线教师开展人工智能教育实践研究，通过专题研修、案例共创和课堂应用促进区域教师专业成长。',
  },
  {
    key: 'xing-zhihui', name: '邢至晖指导团队工作室', province: '上海市', cover: '/assets/expert-studios/xing-zhihui.jpg', views: '579', follows: '17',
    desc: '汇聚学科专家与骨干教师，探索生成式人工智能赋能备课、教学、评价和教师专业发展的实践路径。',
  },
  {
    key: 'chen-zhenzhen', name: '陈珍珍指导团队工作室', province: '河南省', cover: '/assets/expert-studios/chen-zhenzhen.jpg', views: '2751', follows: '239',
    desc: '坚持问题导向和任务驱动，开展AI教学工具应用、数字课程建设与教师人工智能素养提升研修。',
  },
  {
    key: 'wang-tao', name: '王涛指导团队工作室', province: '安徽省', cover: '/assets/expert-studios/wang-tao.jpg', views: '1276', follows: '24',
    desc: '围绕人工智能与学科教学深度融合，建设开放共享的教师学习共同体和优质数字教育资源。',
  },
  {
    key: 'cui-yong', name: '崔勇AI素养指导团队工作室', province: '四川省', cover: '/assets/expert-studios/cui-yong.jpg', views: '1035', follows: '164',
    desc: '以课堂创新为核心开展教师AI素养培训、区域教研和应用案例孵化，推动智能技术常态化应用。',
  },
  {
    key: 'meng-xianliang', name: '孟宪良指导团队工作室', province: '天津市', cover: '/assets/expert-studios/meng-xianliang.jpg', views: '4.3万', follows: '41',
    desc: '聚焦数字化转型中的教师能力建设，协同开展专题课程、实践任务、成果展示和专业指导。',
  },
  {
    key: 'han-junda', name: '韩君达指导团队工作室', province: '陕西省', cover: '/assets/expert-studios/han-junda.jpg', views: '1435', follows: '42',
    desc: '以人工智能通识教育和学科融合为重点，共建研修资源，分享可复制、可推广的教育教学经验。',
  },
  {
    key: 'zhou-wen', name: '周雯AI素养指导团队工作室', province: '浙江省', cover: '/assets/expert-studios/zhou-wen.jpg', views: '2.8万', follows: '43',
    desc: '依托线上工作室组织跨区域教研，形成教师AI素养提升、课堂应用创新和成果辐射的研修机制。',
  },
];

const EXPERT_STUDIO_TABS = [
  { key: 'home', label: '首页' },
  { key: 'discussion', label: '讨论区', count: 28 },
  { key: 'course', label: '课程', count: 6 },
  { key: 'article', label: '文章', count: 18 },
  { key: 'event', label: '活动', count: 4 },
  { key: 'more', label: '更多' },
];

const EXPERT_STUDIO_POSTS = [
  {
    key: 'geometry-practice', category: '文章', title: '基于智能教学环境的小学数学图形与几何教学实践研究', author: '鲤城林煜珍', date: '2026/10/24 21:42', likes: 0, comments: 0,
    desc: '以智慧课堂平台为载体，借AI教学决策数据化、评价即时、互动立体、推送智能等优势，实施课前精准分析学情、课中高效强化、课后个性辅导。',
  },
  {
    key: 'geometry-play', category: '文章', title: '从“看”到“玩”：人工智能技术优化小学低年级图形与几何课堂的实践研究', author: '鲤城林煜珍', date: '2026/10/24 21:40', likes: 0, comments: 0,
    desc: '针对低年级几何教学依赖静态图片、学生被动观察的困境，以VR积木搭建、AI剪纸动画、智能互动游戏把抽象几何变为可操作的动态场景。',
  },
  {
    key: 'virtual-lab', category: '资源', title: 'AI虚拟实验在小学“图形与几何”教学中的应用效果研究', author: '鲤城林煜珍', date: '2026/10/24 21:38', likes: 0, comments: 0,
    desc: '以三维建模、动态演示和交互操作构建AI虚拟实验，突破时空与教具局限，深化空间观念、几何概念理解与课堂参与。',
  },
  {
    key: 'unit-teaching', category: '文章', title: 'AI赋能下小学数学“图形与几何”大单元教学', author: '鲤城林煜珍', date: '2026/10/24 21:37', likes: 0, comments: 0,
    desc: '针对图形与几何抽象难懂、教学割裂等困境，依托AI从课前诊断学情、课中创设情境、课后创新作业和评价数据贯通四维发力。',
  },
  {
    key: 'thinking-visible', category: '文章', title: '人工智能支持下的小学数学思维可视化与兴趣激发研究', author: '鲤城林煜珍', date: '2026/10/24 20:32', likes: 1, comments: 0,
    desc: '借助人工智能的逻辑建模、动态图形和错题溯源能力实现思维可视化，解决小学数学思维隐性化和技术应用脱节问题。',
  },
  {
    key: 'ratio-lantern', category: '资源', title: 'AI赋能比例闹元宵——飞象老师一键链接实际生活', author: '鲤城区第五中心小学谢如月', date: '2026/10/24 17:22', likes: 1, comments: 1,
    desc: '分享用一句话生成互动动画的方法：输入提示词、拖动滑块实时演算，让鲜活生活情境快速进入数学课堂。',
  },
  {
    key: 'structured-teaching', category: '公告', title: '智慧结构化：数智，让知识更有序', author: '侯琪颖', date: '2026/10/24 15:54', likes: 1, comments: 0,
    desc: '数智结构化教学融合数学思维、大数据分析与数字化技术，精准把握学情，优化教学过程，促进学生独立思考和问题解决。',
  },
  {
    key: 'lesson-preparation', category: '资源', title: '让备课少些忙乱，让课堂多些生长——国家智慧教育平台与AI工具的教学应用', author: '侯琪颖', date: '2026/10/23 13:43', likes: 2, comments: 1,
    desc: '立足真实教学需求，介绍国家智慧教育平台与AI工具在资源选择、协同备课和学习反馈中的应用方法。',
  },
];

const EXPERT_STUDIO_RECOMMENDS = [
  { key: 'human-ai', title: '以智提效 以情育人——人机协同视域下小学班主任专业发展路径探索', author: '侯琪颖', date: '2026/09/22' },
  { key: 'erhu', title: '两弦承古韵，科技启新声——“智汇传音”智能电子二胡科教实践案例', author: '侯琪颖', date: '2026/10/07' },
];

const EXPERT_STUDIO_RANKING = [
  ['徐晓刚AI素养指导团队工作室', '670.89'],
  ['宋太铭指导团队工作室', '599.91'],
  ['贾长伟指导团队工作室', '272.3'],
  ['何毅指导团队工作室', '253.88'],
  ['林大华指导团队工作室', '244.29'],
  ['朱磊指导团队工作室', '240.78'],
  ['黄启东指导团队工作室', '223.71'],
  ['仇大成指导团队工作室', '223.41'],
  ['孟宪良指导团队工作室', '219.64'],
  ['张承强指导团队工作室', '204.83'],
];

const EXPERT_STUDIO_DISCUSSIONS = [
  {
    key: 'discussion-ai-lesson', author: '侯琪颖', role: '工作室主持人', time: '今天 09:32', likes: 26, comments: 8, pinned: true,
    title: '大家在AI辅助备课时，最希望优先解决哪个环节？',
    content: '本周共研想从真实问题出发。欢迎分享你在学情分析、任务设计、课堂互动或作业评价中的一个具体难点，我们会选择高频问题组织专题工作坊。',
    tags: ['AI备课', '共研话题'],
  },
  {
    key: 'discussion-geometry', author: '林煜珍', role: '骨干成员', time: '昨天 16:48', likes: 18, comments: 5,
    title: '低年级“图形与几何”课堂如何避免为了互动而互动？',
    content: '我尝试用动态拼摆替代静态观察，但发现学生容易被动画吸引而忽略数学表达。大家会怎样设计观察任务和交流支架？',
    tags: ['小学数学', '课堂实践'],
  },
  {
    key: 'discussion-resource', author: '谢如月', role: '工作室成员', time: '10月24日 17:22', likes: 13, comments: 3,
    title: '分享一个把生活情境快速做成互动课件的方法',
    content: '用一句提示词先生成元宵节比例问题，再通过滑块控制数量变化。学生能边操作边解释数量关系，课堂反馈比单纯播放动画更好。',
    tags: ['资源分享', '互动课件'],
  },
  {
    key: 'discussion-ethics', author: '王琳', role: '研修学员', time: '10月23日 20:15', likes: 9, comments: 4,
    title: '学生使用生成式AI完成探究任务时，边界应该怎样设定？',
    content: '想听听大家在过程记录、事实核验和成果署名方面的做法，也欢迎分享可以直接用于课堂的AI使用约定。',
    tags: ['AI伦理', '学生指导'],
  },
];

const EXPERT_STUDIO_COURSES = [
  { key: 'course-ai-literacy', title: '教师AI素养：从认知到课堂实践', lessons: 8, learners: 1264, cover: academyReplayAnimation },
  { key: 'course-smart-lesson', title: '智能教学环境下的课堂设计', lessons: 6, learners: 892, cover: academyReplayCourseware },
  { key: 'course-resource', title: 'AI教学资源开发与评价', lessons: 5, learners: 736, cover: academyGuideEnglish },
  { key: 'course-research', title: '数智赋能教研的行动研究方法', lessons: 7, learners: 628, cover: academyGuideTraining },
];

const EXPERT_STUDIO_EVENTS = [
  { key: 'event-workshop', status: '报名中', date: '10月30日 19:30', title: 'AI辅助备课：从问题诊断到任务设计', mode: '线上工作坊', members: 86 },
  { key: 'event-open-class', status: '预告', date: '11月06日 14:00', title: '图形与几何智能课堂公开课', mode: '在线直播', members: 142 },
  { key: 'event-review', status: '回放', date: '10月18日 19:00', title: '教师AI素养提升路径共研会', mode: '直播回放', members: 318 },
  { key: 'event-share', status: '已结束', date: '10月12日 09:00', title: '区域优质AI教学案例分享会', mode: '线上活动', members: 205 },
];

const HOME_CREATION_TYPES = [
  { key: 'animation', label: '教学动画', icon: <LaptopOutlined />, prompt: '设计一个能帮助学生理解抽象知识的教学动画' },
  { key: 'education-app', label: '教育应用', icon: <AppstoreOutlined />, prompt: '创建一个可收集课堂数据的教育应用' },
  { key: 'teaching-game', label: '教学游戏', icon: <ProjectOutlined />, prompt: '设计一个有故事线和闯关机制的教学游戏' },
  { key: 'courseware', label: '互动课件', icon: <ControlOutlined />, prompt: '制作一个支持拖拽、反馈和课堂互动的课件' },
];

const RESOURCE_MARKET_CATEGORIES = [
  '推荐', '语文', '数学', '英语', '物理', '化学', '生物', '道德与法治',
  '历史', '地理', '信息科技', '课堂工具', '学前教育', '高等教育', '职业教育', '其他',
];

const APP_MARKET_CATEGORIES = [
  '推荐', '学科应用', '教师工具', '学习工具', '教学管理', '学校管理', '语言学习',
  '阅读', '写作', '人文社科', '科学与技术', '考试与题库', '学术研究', '创意工具', '心理健康', '职业技能',
  '体育运动', '更多',
];

const RESOURCE_MARKET_ITEMS = [
  { key: 'resource-guide', title: '通答老师“教育应用”新手指南', owner: '通答老师3.0新手指南', category: '课堂工具', views: '17.4万', likes: '7936', badge: '', tone: 'green', mark: '指南', cover: '/assets/resources/guide.jpg' },
  { key: 'resource-data', title: '【数据回收】新手指引', owner: '叨叨老师爱讲课', category: '课堂工具', views: '8.8万', likes: '6921', badge: '热门', tone: 'mint', mark: '数据', cover: '/assets/resources/data.jpg' },
  { key: 'resource-geometry', title: '观察简单组合体5.0', owner: '陆老师的AI数学实验室', category: '数学', views: '4.6万', likes: '1851', badge: '热门', tone: 'blue', mark: '数学', cover: '/assets/resources/geometry.jpg' },
  { key: 'resource-miner', title: '小学数学黄金矿工计算练习', owner: '小叶老师用AI', category: '数学', views: '26.5万', likes: '7140', badge: '热门', tone: 'yellow', mark: '游戏', cover: '/assets/resources/miner.jpg' },
  { key: 'resource-vision', title: 'AI如何“看”世界——揭秘图像识别', owner: '樗老师的AI实验室', category: '信息科技', views: '10.7万', likes: '6778', badge: '热门', tone: 'purple', mark: 'AI', cover: '/assets/resources/vision.jpg' },
  { key: 'resource-paper', title: '一亿张纸有多高', owner: '通答用户', category: '数学', views: '1.7万', likes: '716', badge: '热门', tone: 'orange', mark: '数学', cover: '/assets/resources/paper.jpg' },
  { key: 'resource-classification', title: 'AI图像分类训练实验室【真实模型训练】【机器学习】', owner: '宇宙大爆炸到底大不大', category: '信息科技', views: '7.8万', likes: '6577', badge: '热门', tone: 'indigo', mark: 'AI', cover: '/assets/resources/classification.jpg' },
  { key: 'resource-cylinder', title: '【互动课件】小学数学六年级圆柱的体积', owner: '小叶老师用AI', category: '数学', views: '15.6万', likes: '6354', badge: '热门', tone: 'cyan', mark: '课件', cover: '/assets/resources/cylinder.jpg' },
  { key: 'resource-abstract', title: '学术英语写作Abstract互动学习网页', owner: 'Cora', category: '英语', views: '6.5万', likes: '6262', badge: '精选', tone: 'mint', mark: '英语', cover: '/assets/resources/abstract.jpg' },
  { key: 'resource-electric', title: '改编《金属棒+验电器——电荷定向移动、电流方向》', owner: '通答用户', category: '物理', views: '4.1万', likes: '3998', badge: '精选', tone: 'red', mark: '物理', cover: '/assets/resources/electric.jpg' },
  { key: 'resource-tips', title: '【玩转互动课件】必看小技巧', owner: '叨叨老师爱讲课', category: '课堂工具', views: '13.7万', likes: '7316', badge: '热门', tone: 'yellow', mark: '技巧', cover: '/assets/resources/tips.jpg' },
  { key: 'resource-billing', title: '《五年级分段计费3.0》', owner: '陆老师的AI数学实验室', category: '数学', views: '5.6万', likes: '4456', badge: '热门', tone: 'pink', mark: '数学', cover: '/assets/resources/billing.jpg' },
  { key: 'resource-circuit', title: '仿真物理实验：初中物理电路实验台（自由实验+教材实验）', owner: '物理郭老师', category: '物理', views: '7.5万', likes: '6576', badge: '热门', tone: 'dark', mark: '实验', cover: '/assets/resources/circuit.jpg' },
  { key: 'resource-food', title: 'Unit4 Healthy Food 第一课时', owner: '海淀教师勇闯AI圈', category: '英语', views: '13.5万', likes: '6783', badge: '热门', tone: 'mint', mark: '英语', cover: '/assets/resources/food.jpg' },
  { key: 'resource-daiyu', title: '生成黛玉进贾府- 沉浸式体验', owner: '伍月', category: '语文', views: '13.8万', likes: '6737', badge: '精选', tone: 'green', mark: '语文', cover: '/assets/resources/daiyu.jpg' },
  { key: 'resource-circle', title: '动圆系的动图', owner: '星光', category: '数学', views: '1.9万', likes: '1708', badge: '精选', tone: 'blue', mark: '数学', cover: '/assets/resources/circle.jpg' },
  { key: 'resource-zhufu', title: '《祝福》教学游戏——《谁杀了祥林嫂》祥林嫂死因探究剧本杀', owner: '魔仙', category: '语文', views: '10.3万', likes: '6397', badge: '精选', tone: 'pink', mark: '语文', cover: '/assets/resources/zhufu.jpg' },
  { key: 'resource-dog', title: '机灵狗去河边：垂线段最短互动课件', owner: '水哥Ai数', category: '数学', views: '7716', likes: '282', badge: '精选', tone: 'orange', mark: '数学', cover: '/assets/resources/dog.jpg' },
  { key: 'resource-qunying', title: '《群英会蒋干中计》互动课件', owner: '巧克力麦片', category: '语文', views: '8.8万', likes: '6254', badge: '热门', tone: 'red', mark: '语文', cover: '/assets/resources/qunying.jpg' },
  { key: 'resource-points', title: '不用编程：从0到1做出教师专属的班级积分系统', owner: '陆老师的AI数学实验室', category: '课堂工具', views: '7.5万', likes: '6160', badge: '', tone: 'green', mark: '班级', cover: '/assets/resources/points.jpg' },
];

const APP_MARKET_ITEMS = [
  { key: 'app-class-pet', title: '班级宠物乐园-一起进化吧！', owner: 'xixisimon', category: '教学管理', views: '6.5万', likes: '1981', badge: '精选', tone: 'green', mark: '班级', cover: '/assets/apps/pet-cover.jpg', icon: '/assets/apps/pet-icon.png' },
  { key: 'app-taohuayuan', title: '古文沉浸式漫游《桃花源记》', owner: '伍月', category: '学科应用', views: '4.6万', likes: '1895', badge: '热门', tone: 'pink', mark: '3D', cover: '/assets/apps/peach-cover.jpg', icon: '/assets/apps/peach-icon.png' },
  { key: 'app-taohuayuan-3d', title: '误入桃花源｜这一次，你就是渔人，第一人称3D体验', owner: '闪电', category: '学科应用', views: '1.5万', likes: '1424', badge: '精选', tone: 'green', mark: '3D', cover: '/assets/apps/peach-3d-cover.jpg', icon: '/assets/apps/peach-3d-icon.png' },
  { key: 'app-vision', title: '【真实模型·可改编资源】计算机视觉参考库', owner: '卢振霄', category: '科学与技术', views: '1.6万', likes: '1377', badge: '', tone: 'blue', mark: '视觉', cover: '/assets/apps/vision-cover.jpg', icon: '/assets/apps/vision-icon.jpg' },
  { key: 'app-marking', title: '试卷智能批改与学情诊断', owner: '通答用户', category: '考试与题库', views: '1.9万', likes: '1360', badge: '热门', tone: 'blue', mark: '批改', cover: '/assets/apps/marking-cover.jpg', icon: '/assets/apps/marking-icon.jpg' },
  { key: 'app-errors', title: '班级错题档案', owner: '阿子冲冲冲', category: '学习工具', views: '1.8万', likes: '1341', badge: '热门', tone: 'orange', mark: '错题', cover: '/assets/apps/errors-cover.jpg', icon: '/assets/apps/errors-icon.png' },
  { key: 'app-certificate', title: '荣誉证书模板生成器', owner: '通答用户', category: '教师工具', views: '2259', likes: '94', badge: '热门', tone: 'yellow', mark: '证书', cover: '/assets/apps/certificate-cover.jpg', icon: '/assets/apps/certificate-icon.jpg' },
  { key: 'app-speaking', title: '入戏 SpeakIn', owner: '一只老李', category: '语言学习', views: '1.7万', likes: '1297', badge: '热门', tone: 'purple', mark: '口语', cover: '/assets/apps/speakin-cover.jpg', icon: '/assets/apps/speakin-icon.png' },
  { key: 'app-sorting', title: '智能分拣实验室', owner: '卢振霄', category: '科学与技术', views: '1.3万', likes: '1253', badge: '热门', tone: 'cyan', mark: '实验', cover: '/assets/apps/sorting-cover.jpg', icon: '/assets/apps/sorting-icon.jpg' },
  { key: 'app-drone', title: '无人机地形测绘', owner: 'Inspire King', category: '科学与技术', views: '1.5万', likes: '1240', badge: '热门', tone: 'green', mark: '测绘', cover: '/assets/apps/drone-cover.jpg', icon: '/assets/apps/drone-icon.png' },
  { key: 'app-island', title: '班级岛', owner: 'Inspire King', category: '教学管理', views: '3万', likes: '1909', badge: '热门', tone: 'orange', mark: '班级', cover: '/assets/apps/island-cover.jpg', icon: '/assets/apps/island-icon.jpg' },
  { key: 'app-writing', title: '四季文学读写助手｜文学佳句采撷与仿写工具', owner: '琨琨', category: '写作', views: '1.6万', likes: '1438', badge: '热门', tone: 'mint', mark: '写作', cover: '/assets/apps/writing-cover.jpg', icon: '/assets/apps/writing-icon.png' },
  { key: 'app-future', title: '未来的我—职业形象创作器', owner: 'xixisimon', category: '职业技能', views: '1.8万', likes: '1418', badge: '热门', tone: 'red', mark: '生涯', cover: '/assets/apps/future-cover.jpg', icon: '/assets/apps/future-icon.png' },
  { key: 'app-earth', title: '地球文明观察器', owner: '阿赤头很痛.', category: '人文社科', views: '1.9万', likes: '1364', badge: '热门', tone: 'blue', mark: '地球', cover: '/assets/apps/earth-cover.jpg', icon: '/assets/apps/earth-icon.png' },
  { key: 'app-blackboard', title: 'AI 黑板', owner: 'Inspire King', category: '教师工具', views: '2万', likes: '1351', badge: '热门', tone: 'dark', mark: '黑板', cover: '/assets/apps/blackboard-cover.jpg', icon: '/assets/apps/blackboard-icon.png' },
  { key: 'app-robot', title: '具身智能机器人', owner: 'Inspire King', category: '科学与技术', views: '1.7万', likes: '1306', badge: '热门', tone: 'cyan', mark: '机器人', cover: '/assets/apps/robot-cover.jpg', icon: '/assets/apps/robot-icon.png' },
  { key: 'app-code', title: '码上解密-信息技术编码与二维码', owner: '卢振霄', category: '学科应用', views: '1.4万', likes: '1301', badge: '热门', tone: 'purple', mark: '编码', cover: '/assets/apps/code-cover.jpg', icon: '/assets/apps/code-icon.jpg' },
  { key: 'app-lab', title: 'AI智能3D电路实验室', owner: '闪电', category: '科学与技术', views: '1.5万', likes: '1284', badge: '热门', tone: 'cyan', mark: '实验', cover: '/assets/apps/circuit-cover.jpg', icon: '/assets/apps/circuit-icon.png' },
  { key: 'app-china', title: '住在中国', owner: 'Inspire King', category: '人文社科', views: '1.5万', likes: '1252', badge: '热门', tone: 'red', mark: '人文', cover: '/assets/apps/china-cover.jpg', icon: '/assets/apps/china-icon.png' },
  { key: 'app-trust', title: '社会心理学：信任的进化', owner: '啦啦', category: '心理健康', views: '1.3万', likes: '1238', badge: '热门', tone: 'green', mark: '心理', cover: '/assets/apps/trust-cover.jpg', icon: '/assets/apps/trust-icon.png' },
];

const SKILL_CATEGORIES = [
  '精选',
  '办公协作',
  '教研培训',
  '资源内容',
  '家校沟通',
  '数据分析',
  '论文科研',
  '政策法规',
  '继续教育',
];

const SKILL_HUB_TABS = [
  { key: 'partners', label: '智能体', icon: <RobotOutlined /> },
  { key: 'skills', label: '技能', icon: <ControlOutlined /> },
  { key: 'market', label: '连接器', icon: <LinkOutlined /> },
];

const CONNECTORS = [
  { key: 'wecom', name: '企业微信', desc: '同步教研通知、培训提醒和教师工作群消息', category: '办公协作', logo: '企', tone: 'cyan' },
  { key: 'dingtalk', name: '钉钉', desc: '连接班级群、培训群、签到和待办通知', category: '办公协作', logo: '钉', tone: 'sky' },
  { key: 'tencent-meeting', name: '腾讯会议', desc: '预约线上教研、远程培训和会议纪要整理', category: '教研培训', logo: '会', tone: 'blue' },
  { key: 'tencent-docs', name: '腾讯文档', desc: '协同编辑教案、培训表格和活动方案', category: '办公协作', logo: 'T', tone: 'blue' },
  { key: 'kingsoft-docs', name: '金山文档', desc: '读写、搜索、整理和管理培训协作文档', category: '办公协作', logo: '金', tone: 'indigo' },
  { key: 'notion', name: 'Notion', desc: '整理课程资料、教研笔记和项目知识库', category: '资源内容', logo: 'N', tone: 'mono' },
  { key: 'baidu-drive', name: '百度网盘', desc: '搜索、上传、下载和移动教学资源文件', category: '资源内容', logo: '百', tone: 'cyan' },
  { key: 'netease-mail', name: '网易邮箱', desc: '收发培训邮件、管理附件并诊断通知遗漏', category: '家校沟通', logo: '邮', tone: 'red' },
  { key: 'qq-mail', name: 'QQ 邮箱', desc: '收发报名回执、课程材料和家校沟通邮件', category: '家校沟通', logo: 'Q', tone: 'orange' },
  { key: 'ifind', name: '同花顺 iFinD', desc: '查询教育行业、上市公司和市场公开数据', category: '数据分析', logo: 'iF', tone: 'red' },
  { key: 'professional-dataset', name: '专业数据集检索', desc: '检索科研、统计、经济和教育相关数据集', category: '数据分析', logo: '数', tone: 'indigo' },
  { key: 'consensus', name: 'Consensus', desc: '检索同行评审论文，生成教育研究引用线索', category: '论文科研', logo: 'C', tone: 'mint' },
  { key: 'wolfram', name: 'Wolfram', desc: '用于统计计算、符号推导和数据分析验证', category: '论文科研', logo: 'W', tone: 'dark-red' },
  { key: 'legal-search', name: '法研·法律法规检索', desc: '查询教育法规、校园治理和培训合规条款', category: '政策法规', logo: '法', tone: 'yellow' },
  { key: 'pkulaw', name: '北大法宝·法律智能检索', desc: '检索教育政策、法规案例和依法治校资料', category: '政策法规', logo: '北', tone: 'stamp' },
  { key: 'huayu-law', name: '华宇元典法律数据', desc: '检索法律法规、案例文书及企业合规信息', category: '政策法规', logo: '律', tone: 'cyan' },
  { key: 'amap', name: '高德地图', desc: '规划培训会场、研学路线和教师外出安排', category: '继续教育', logo: '高', tone: 'mint' },
  { key: 'tencent-map', name: '腾讯地图', desc: '查询培训地点、校区位置和周边交通信息', category: '继续教育', logo: '腾', tone: 'sky' },
  { key: 'baidu-map', name: '百度地图', desc: '检索研修地点、导航路线和出行方案', category: '继续教育', logo: '度', tone: 'red' },
  { key: 'google-maps', name: 'Google Maps', desc: '查询海外研学地点，规划访学与会议路线', category: '继续教育', logo: 'G', tone: 'google' },
  { key: 'didi', name: '滴滴出行', desc: '为培训接待、校际交流和外出研修安排用车', category: '继续教育', logo: '滴', tone: 'orange' },
  { key: 'caocao', name: '曹操出行', desc: '支持教师培训接送、活动用车和行程确认', category: '继续教育', logo: '曹', tone: 'green' },
  { key: 'trip', name: 'Trip.com', desc: '查询培训差旅、酒店预订和行程信息', category: '继续教育', logo: 'Tr', tone: 'blue' },
  { key: 'flight-master', name: '飞常准', desc: '跟踪培训出差航班、延误和接站安排', category: '继续教育', logo: '飞', tone: 'sky' },
];

const MY_SKILL_TABS = [
  { key: 'skills', label: '技能' },
  { key: 'connectors', label: '连接器' },
];

const MY_SKILLS = [
  { key: 'td-work-workbench', name: 'Lucky 工作助手', desc: '连接 guoren-v2 的任务、智能体与连接器能力', logo: 'L', tone: 'blue', enabled: true },
  { key: 'tongda-training', name: '通答学院', desc: '汇集新手指南、培训模板、AI 助教案例和学院项目入口', logo: '院', tone: 'green', enabled: true },
  { key: 'resource-library', name: '资源库', desc: '管理课程资源、文件解析、标签与共享权限', logo: '资', tone: 'cyan', enabled: true },
  { key: 'knowledge-space', name: '知识空间', desc: '建设校本知识空间，组织资源与主题内容', logo: '知', tone: 'green', enabled: true },
  { key: 'knowledge-graph', name: '知识图谱', desc: '梳理知识点、能力目标和课程关系图谱', logo: '图', tone: 'indigo', enabled: true },
  { key: 'course-studio', name: '课程工作室', desc: '生成课程方案、课时设计和教学资源包', logo: '课', tone: 'orange', enabled: true },
  { key: 'teacher-portrait', name: '教师画像', desc: '汇总教师成长证据、能力状态和发展建议', logo: '像', tone: 'purple', enabled: true },
  { key: 'teacher-development', name: '教师发展', desc: '跟踪发展目标、研修路径和成长计划', logo: '发', tone: 'mint', enabled: true },
  { key: 'teacher-evaluation', name: '教师评价', desc: '发起评价任务，汇总结果并生成改进建议', logo: '评', tone: 'red', enabled: true },
  { key: 'capability-model', name: '能力模型', desc: '维护岗位序列、能力项和评价标准', logo: '能', tone: 'green', enabled: true },
  { key: 'supervision-template', name: '督导模板', desc: '配置督导检查模板、表单和评分规则', logo: '督', tone: 'sky', enabled: true },
  { key: 'supervision-inspection', name: '智慧督导', desc: '跟踪督导任务、整改反馈和过程材料', logo: '检', tone: 'blue', enabled: true },
  { key: 'scene-template', name: '场景模板', desc: '维护教学、培训、督导等空间模板', logo: '模', tone: 'indigo', enabled: true },
  { key: 'scene-space', name: '场景空间', desc: '创建教研、培训、课程建设协作空间', logo: '场', tone: 'cyan', enabled: true },
  { key: 'tasks', name: '任务中心', desc: '管理待办、协作任务和推进状态', logo: '任', tone: 'orange', enabled: true },
  { key: 'messages', name: '消息中心', desc: '查看系统通知、智能体推送和未读提醒', logo: '息', tone: 'green', enabled: true },
  { key: 'archive', name: '档案提交', desc: '提交教师成长档案、成果材料和审批记录', logo: '档', tone: 'purple', enabled: true },
  { key: 'certificate', name: '证书管理', desc: '维护培训结业、荣誉证书和模板发放', logo: '证', tone: 'orange', enabled: true },
  { key: 'points-admin', name: '积分管理', desc: '管理学习积分、兑换规则和组织运营', logo: '分', tone: 'red', enabled: true },
  { key: 'points-user', name: '我的积分', desc: '查看个人学习积分、任务奖励和兑换记录', logo: '积', tone: 'yellow', enabled: true },
  { key: 'study-club-channel', name: '学习社区', desc: '运营频道、课程文章、活动和成员共创', logo: '社', tone: 'mint', enabled: true },
  { key: 'my-learning-space', name: '我的学习空间', desc: '沉淀学习计划、课程进度和个人资料', logo: '学', tone: 'blue', enabled: true },
  { key: 'my-classroom', name: '我的课堂', desc: '管理课堂活动、课件资料和课后反馈', logo: '堂', tone: 'sky', enabled: true },
  { key: 'teaching-research', name: '教研空间', desc: '组织集体备课、听评课和教研纪要', logo: '研', tone: 'green', enabled: true },
  { key: 'workshop', name: '名师工作室', desc: '沉淀示范课、研修活动和成员成果', logo: '名', tone: 'purple', enabled: true },
  { key: 'org-training', name: '组织培训', desc: '配置培训项目、报名签到和学情跟踪', logo: '培', tone: 'orange', enabled: true },
  { key: 'workshop-cloud', name: '工作坊云空间', desc: '汇聚工作坊资源、作业和研讨记录', logo: '云', tone: 'cyan', enabled: true },
  { key: 'course-creation-center', name: '课程创作中心', desc: '组合直播、点播、测评和成果答辩材料', logo: '创', tone: 'red', enabled: true },
  { key: 'app-center', name: '应用中心', desc: '管理应用、能力、发布状态和访问权限', logo: '用', tone: 'indigo', enabled: true },
  { key: 'quick-build', name: '智搭', desc: '快速搭建教学应用、业务页面和演示入口', logo: '搭', tone: 'green', enabled: true },
  { key: 'online-dev', name: '在线开发', desc: '可视化开发页面、接口、模型和数据源', logo: '开', tone: 'blue', enabled: true },
  { key: 'integration', name: '三方对接', desc: '配置外部数据源、同步任务和字段映射', logo: '接', tone: 'mint', enabled: true },
  { key: 'page-designer', name: '页面设计器', desc: '编排业务看板、组件状态和预览页面', logo: '页', tone: 'purple', enabled: true },
  { key: 'solution-prototype', name: '方案原型', desc: '组合教育数字化方案、模块清单和报价口径', logo: '案', tone: 'orange', enabled: true },
  { key: 'package-prototype', name: '套餐原型', desc: '配置租户套餐、模块权益和资源限额', logo: '套', tone: 'sky', enabled: true },
  { key: 'tenant-prototype', name: '租户原型', desc: '管理租户版本、门户配置和演示入口', logo: '租', tone: 'cyan', enabled: true },
  { key: 'stats-dashboard', name: '数据统计', desc: '查看模型用量、服务调用和成本趋势', logo: '数', tone: 'green', enabled: true },
  { key: 'agent-quota', name: '智能体额度', desc: '配置智能体调用额度和组织分配规则', logo: '额', tone: 'indigo', enabled: true },
  { key: 'oa-leave', name: 'OA 请假', desc: '处理请假申请、审批流和销假记录', logo: '假', tone: 'red', enabled: false },
  { key: 'workflow', name: '流程管理', desc: '维护流程模板、节点、角色和审批规则', logo: '流', tone: 'blue', enabled: false },
  { key: 'doc-management', name: '文档管理', desc: '管理制度文档、版本、审批和归档', logo: '文', tone: 'green', enabled: true },
  { key: 'survey', name: '调查问卷', desc: '收集培训满意度、课堂反馈和督导问卷', logo: '问', tone: 'purple', enabled: true },
  { key: 'seminar', name: '研修活动', desc: '组织活动报名、直播、作业和成果共创', logo: '活', tone: 'orange', enabled: true },
  { key: 'office-document', name: '在线文档', desc: '协同编辑教案、方案、纪要和汇报材料', logo: '协', tone: 'cyan', enabled: true },
  { key: 'calendar', name: '日程管理', desc: '安排课程、培训、督导和教研提醒', logo: '历', tone: 'sky', enabled: true },
  { key: 'message-broadcast', name: '通知发布', desc: '面向教师、学员和管理者推送消息', logo: '通', tone: 'red', enabled: true },
  { key: 'evidence-link', name: '证据关联', desc: '关联资源、档案、评价和教师画像证据', logo: '链', tone: 'mint', enabled: true },
  { key: 'role-management', name: '组织与权限', desc: '维护部门、用户、角色和岗位授权', logo: '权', tone: 'indigo', enabled: true },
  { key: 'research-output', name: '成果管理', desc: '沉淀论文、课题、获奖和培训成果', logo: '果', tone: 'yellow', enabled: true },
];

const PARTNER_CARDS = [
  {
    key: 'teaching-research',
    name: '教研备课智能体',
    desc: '协助教师梳理课标要求、学情信息和教学资源，生成备课提纲与课堂活动建议。',
    avatar: 'zhang',
    tone: 'pink',
    chats: 3,
    members: 4,
    tag: '专属',
  },
  {
    key: 'teacher-growth',
    name: '教师研修规划师',
    desc: '结合岗位能力、培训主题和学习进度，为教师设计可执行、可复盘的研修路径。',
    avatar: 'mentor',
    tone: 'purple',
    chats: 1,
    members: 8,
    tag: '研修',
  },
  {
    key: 'training-squad',
    name: '培训项目小队',
    desc: '统筹培训通知、报名签到、课程资料、作业提交和证书发放等协作任务。',
    avatar: 'squad',
    tone: 'orange',
    chats: 0,
    members: 3,
    tag: '小队',
  },
  {
    key: 'courseware-polish',
    name: '课件汇报打磨师',
    desc: '面向培训课件、教研汇报和成果展示，优化结构、提炼重点并提供版式建议。',
    avatar: 'designer',
    tone: 'green',
    chats: 0,
    members: 4,
    tag: '课程',
  },
  {
    key: 'learner-coach',
    name: '学员成长辅导员',
    desc: '跟进学员学习表现、作业问题和培训反馈，整理个别辅导建议与成长记录。',
    avatar: 'forest',
    tone: 'sage',
    chats: 0,
    members: 12,
    tag: '学员',
  },
  {
    key: 'evaluation-assistant',
    name: '评价督导助手',
    desc: '支持课堂观察、培训评价和督导反馈的材料整理、问题归因与改进建议。',
    avatar: 'guide',
    tone: 'sky',
    chats: 0,
    members: 4,
    tag: '评价',
  },
];

const WORK_PARTNERS = PARTNER_CARDS.filter((item) => item.tag !== '小队');

const PARTNER_MARKET_CATEGORIES = [
  '全部',
  '组织培训',
  '教学备课',
  '教研培训',
  '学员管理',
  '资源内容',
  '测评评价',
  '办公提效',
  '数据分析',
  '学习教育',
  '家校沟通',
  '课题科研',
  '学校管理',
  '继续教育',
];

const PARTNER_MARKET_ITEMS = [
  { key: 'training-research-planner', name: '教研员', desc: '针对用户提出的组织培训需求，完成培训项目策划、目标设计与实施方案。', category: '组织培训', tags: ['项目策划', '培训方案'], logo: '研', tone: 'sage' },
  { key: 'training-admin-operator', name: '教务', desc: '根据教研员的策划内容，在平台配置培训项目、组织培训并跟进执行。', category: '组织培训', tags: ['项目配置', '培训组织'], logo: '务', tone: 'blue' },
  { key: 'learning-data-analyst', name: '学情数据分析师', desc: '擅长分析学员成绩、出勤与学习表现，输出改进建议。', category: '数据分析', tags: ['学情诊断', '质量分析'], logo: '数', tone: 'sky' },
  { key: 'ppt-lesson-expert', name: '课件制作专家', desc: '帮你把培训方案、教案和汇报材料转成清晰课件。', category: '资源内容', tags: ['课件生成', '汇报美化'], logo: 'P', tone: 'green' },
  { key: 'lesson-ui-designer', name: '课程活动设计师', desc: '专注课堂活动、学习任务单和互动环节设计。', category: '教学备课', tags: ['活动设计', '任务单'], logo: '设', tone: 'purple' },
  { key: 'ai-paint-teacher', name: 'AI 配图师', desc: '根据教学主题生成插图、封面和课程海报创意。', category: '资源内容', tags: ['文生图', '封面设计'], logo: '图', tone: 'red' },
  { key: 'dev-assistant', name: '平台配置工程师', desc: '帮你把培训流程、表单字段和自动化规则配置清楚。', category: '办公提效', tags: ['流程配置', '功能排查'], logo: '工', tone: 'blue' },
  { key: 'training-script-writer', name: '培训脚本编剧', desc: '面向视频课程和直播培训，组织讲稿、分镜和案例。', category: '教研培训', tags: ['脚本撰写', '培训表达'], logo: '剧', tone: 'orange' },
  { key: 'course-analyst', name: '授课分析师', desc: '整理听评课记录与课堂观察数据，生成诊断报告。', category: '测评评价', tags: ['听评课', '课堂观察'], logo: '析', tone: 'cyan' },
  { key: 'hr-training-assistant', name: '培训项目助手', desc: '为培训负责人整理报名、签到、作业和证书发放流程。', category: '教研培训', tags: ['项目管理', '证书发放'], logo: '培', tone: 'mint' },
  { key: 'micro-video-planner', name: '微课策划助手', desc: '围绕知识点拆解短课主题、脚本结构和拍摄清单。', category: '资源内容', tags: ['微课设计', '脚本提纲'], logo: '微', tone: 'pink' },
  { key: 'resource-curator', name: '教学资源策展师', desc: '筛选课例、论文和政策资料，按主题生成资源包。', category: '资源内容', tags: ['资源整理', '主题包'], logo: '资', tone: 'green' },
  { key: 'report-consultant', name: '研修报告顾问', desc: '帮助教师梳理学习收获、行动计划和成果亮点。', category: '继续教育', tags: ['研修总结', '成长复盘'], logo: '报', tone: 'orange' },
  { key: 'interview-coach', name: '教师面试陪练官', desc: '模拟试讲、结构化问答和岗位胜任力表达训练。', category: '学习教育', tags: ['试讲训练', '面试评估'], logo: '面', tone: 'red' },
  { key: 'video-teacher', name: '课程视频剪辑师', desc: '整理录课素材、口播文案和片头片尾制作建议。', category: '资源内容', tags: ['录课剪辑', '素材整理'], logo: '剪', tone: 'green' },
  { key: 'industry-researcher', name: '教育趋势研究专家', desc: '跟踪教育数字化、AI 教学和教师发展最新案例。', category: '课题科研', tags: ['趋势研究', '案例分析'], logo: '研', tone: 'sage' },
  { key: 'class-master', name: '班主任工作顾问', desc: '整理班级管理、家校沟通和学生成长支持方案。', category: '家校沟通', tags: ['班级管理', '家校协同'], logo: '班', tone: 'sky' },
  { key: 'work-guide', name: '工作台搭建师', desc: '一问话就能把教研任务变成在线协同、表格和看板。', category: '办公提效', tags: ['AI 搭网页', '数据看板'], logo: '台', tone: 'mint' },
  { key: 'sales-trainer', name: '课程顾问教练', desc: '帮助招生与培训咨询老师整理问答、邀约和跟进话术。', category: '学校管理', tags: ['咨询话术', '转化复盘'], logo: '销', tone: 'purple' },
  { key: 'commerce-ops', name: '培训项目运营官', desc: '面向课程运营，辅助排课、通知、社群和复盘动作。', category: '教研培训', tags: ['运营策略', '复盘分析'], logo: '营', tone: 'orange' },
  { key: 'math-teacher-aide', name: '教师教学助手', desc: '帮老师整理教学数据和日常材料，生成简洁说明。', category: '教学备课', tags: ['学情分析', '教研材料'], logo: '教', tone: 'blue' },
  { key: 'meeting-summary', name: '会议准备与复盘专家', desc: '面向团队负责人和项目成员，整理会议议程与纪要。', category: '办公提效', tags: ['信息提炼', '会议纪要'], logo: '会', tone: 'green' },
  { key: 'knowledge-manager', name: '知识沉淀管理员', desc: '整理校本培训知识库、制度问答和优秀教学案例。', category: '办公提效', tags: ['知识库', '案例沉淀'], logo: '知', tone: 'orange' },
  { key: 'office-efficiency', name: 'Office 效率全能王', desc: '帮你处理文档、表格、演示和培训材料批量整理。', category: '办公提效', tags: ['文档排版', '表格分析'], logo: 'O', tone: 'pink' },
  { key: 'growth-planner', name: '教师成长规划师', desc: '结合教师岗位能力与研修记录，生成成长目标和学习路径。', category: '继续教育', tags: ['成长路径', '研修规划'], logo: '长', tone: 'sky' },
  { key: 'history-support', name: '研修事务协办导师', desc: '帮助 HR 和用人经理梳理岗位需求、培训匹配和人才对比。', category: '学校管理', tags: ['岗位评估', '人才对比'], logo: '协', tone: 'cyan' },
  { key: 'process-optimizer', name: '效率流程改造师', desc: '帮助团队梳理实际工作流程，找出重复劳动并优化。', category: '办公提效', tags: ['流程诊断', '流程优化'], logo: '效', tone: 'green' },
  { key: 'group-copywriter', name: '群聊摘要与待办助手', desc: '帮助团队成员基于群聊记录提炼结论和待办。', category: '办公提效', tags: ['信息提炼', '任务推进'], logo: '群', tone: 'orange' },
  { key: 'review-master', name: '一图总结大师', desc: '擅长把复杂流程和学习报告信息变成结构化图文。', category: '资源内容', tags: ['画板梳理', '课程设计'], logo: '图', tone: 'sage' },
  { key: 'quality-supervisor', name: '智能教学系统质检官', desc: '面向教务和信息化团队，辅助检查平台配置与流程质量。', category: '学校管理', tags: ['质量把关', '最佳实践'], logo: '质', tone: 'purple' },
  { key: 'lesson-plan-maker', name: '教学设计生成师', desc: '结合课标、教材与学情，生成教案和课堂流程。', category: '教学备课', tags: ['教案生成', '活动设计'], logo: '案', tone: 'blue' },
  { key: 'homework-reviewer', name: '作业批阅分析员', desc: '汇总作业问题、提炼共性错因并生成讲评建议。', category: '测评评价', tags: ['作业分析', '错因归纳'], logo: '作', tone: 'mint' },
  { key: 'policy-reader', name: '教育政策解读员', desc: '解读培训制度、课程改革文件和校内管理规范。', category: '学校管理', tags: ['政策解读', '制度问答'], logo: '政', tone: 'red' },
  { key: 'research-project-coach', name: '课题申报教练', desc: '辅助教师完成选题、研究设计和申报材料初稿。', category: '课题科研', tags: ['课题申报', '研究设计'], logo: '题', tone: 'orange' },
];

const PARTNER_MARKET_AVATARS = [
  { bg: '#d9f4ff', skin: '#f0bd9c', hair: '#1d2631', shirt: '#274d8b', style: 'bob' },
  { bg: '#d6f2ee', skin: '#e8aa85', hair: '#563622', shirt: '#2e7d73', style: 'glasses' },
  { bg: '#eadfff', skin: '#d99070', hair: '#1f2733', shirt: '#f37b42', style: 'curly' },
  { bg: '#f5dccf', skin: '#c77c60', hair: '#21161a', shirt: '#9b2431', style: 'long' },
  { bg: '#d8f4ce', skin: '#d69b78', hair: '#20242b', shirt: '#2f946c', style: 'side' },
  { bg: '#ffe5ba', skin: '#e3a274', hair: '#5a3b24', shirt: '#925c24', style: 'round' },
  { bg: '#cfeff6', skin: '#d59777', hair: '#263d42', shirt: '#4f9da3', style: 'short' },
  { bg: '#e9f3ff', skin: '#f0c2a1', hair: '#182333', shirt: '#1f5c93', style: 'sleek' },
  { bg: '#ffe2d8', skin: '#efb28c', hair: '#74442f', shirt: '#f07c68', style: 'wave' },
  { bg: '#cdf1dc', skin: '#d99d7d', hair: '#1f3430', shirt: '#26735f', style: 'glasses' },
  { bg: '#f4e2c9', skin: '#e0a27a', hair: '#5a351d', shirt: '#d38b32', style: 'round' },
  { bg: '#f4d9e4', skin: '#d78b72', hair: '#25191c', shirt: '#df5a72', style: 'long' },
  { bg: '#daf6e2', skin: '#e7b38e', hair: '#173b2f', shirt: '#2d8b58', style: 'short' },
  { bg: '#f7dfd4', skin: '#c68768', hair: '#5c2d1f', shirt: '#bf6538', style: 'curly' },
  { bg: '#e2efd4', skin: '#e4a988', hair: '#5a2f21', shirt: '#7c9b54', style: 'side' },
  { bg: '#daf2ed', skin: '#d89a77', hair: '#1e2f2f', shirt: '#39a18f', style: 'glasses' },
];

const RECENT_DIALOGS = [
  { key: 'weekly-research', title: '整理本周教研活动纪要', avatar: 'zhang', tone: 'pink', time: '更新于 32 分钟前' },
  { key: 'new-teacher-path', title: '制定新教师研修学习路径', avatar: 'mentor', tone: 'purple', time: '08月17日 18:13' },
  { key: 'homework-review', title: '汇总培训作业共性问题', avatar: 'forest', tone: 'sage', time: '08月17日 17:39' },
  { key: 'class-observation', title: '设计课堂观察反馈表', avatar: 'guide', tone: 'sky', time: '07月30日 21:04' },
];

const PARTNER_WORK_TABS = [
  { key: 'tasks', label: '任务' },
  { key: 'automation', label: '自动化' },
  { key: 'artifact', label: '产物' },
];

const PARTNER_DETAIL_TABS = [
  { key: 'profile', label: '档案' },
  { key: 'skills', label: '技能' },
  { key: 'knowledge', label: '知识' },
  { key: 'manage', label: '管理' },
];

const PARTNER_DETAIL_SKILLS = [
  '教研纪要生成',
  '培训方案打磨',
  '课堂观察分析',
  '教师画像解读',
];

const PARTNER_WORK_ITEMS = {
  tasks: [
    { key: 'daily-teaching-task', title: '解答今日教研任务问题', time: '更新于 2 小时前' },
    { key: 'new-teacher-study-path', title: '制定新教师研修学习路径', time: '08月17日 17:39' },
    { key: 'observation-feedback', title: '整理课堂观察反馈表', time: '07月30日 21:04' },
  ],
  automation: [
    { key: 'weekly-research-summary', title: '每周生成教研活动纪要', time: '每周五 16:30' },
    { key: 'training-homework-reminder', title: '培训作业提交提醒', time: '每周三 09:00' },
    { key: 'teacher-growth-check', title: '教师成长档案补充提醒', time: '每月 25 日 10:00' },
  ],
  artifact: [
    { key: 'lesson-plan-doc', title: '跨学科主题教学设计.docx', time: '更新于 昨天' },
    { key: 'training-review-sheet', title: '教师研修过程记录表.xlsx', time: '08月17日 17:39' },
    { key: 'course-report', title: '培训成果汇报课件.pptx', time: '07月30日 21:04' },
  ],
};

const PARTNER_MANAGE_TASKS = [
  {
    key: 'research-minutes-task',
    title: '解答今日教研任务问题',
    desc: '从会议记录中提炼共识、问题清单和后续分工。',
    owner: '教研备课智能体',
    avatar: 'zhang',
    avatarTone: 'pink',
    status: '进行中',
    time: '更新于 3 小时前',
    tone: 'blue',
  },
  {
    key: 'teacher-path-task',
    title: '新教师研修路径拆解',
    desc: '拆分培训主题、学习节点、作业要求和复盘安排。',
    owner: '教师研修规划师',
    avatar: 'mentor',
    avatarTone: 'purple',
    status: '待确认',
    time: '08月17日 18:13',
    tone: 'purple',
  },
  {
    key: 'homework-follow-task',
    title: '课堂观察反馈整理',
    desc: '汇总未提交名单，生成提醒话术和补交截止时间。',
    owner: '学员成长辅导员',
    avatar: 'forest',
    avatarTone: 'sage',
    status: '待处理',
    time: '08月17日 17:39',
    tone: 'orange',
  },
  {
    key: 'observation-review-task',
    title: '介绍培训平台上手使用',
    desc: '分析课堂观察表，整理亮点、问题和改进建议。',
    owner: '评价督导助手',
    avatar: 'guide',
    avatarTone: 'sky',
    status: '已完成',
    time: '07月30日 21:04',
    tone: 'green',
  },
];

const PARTNER_MANAGE_AUTOMATIONS = [];

function SidebarSection({ title, children }) {
  return (
    <section className="td-work-side-section" aria-label={title}>
      <div className="td-work-side-title">{title}</div>
      {children}
    </section>
  );
}

function SmallItem({ item, active, onClick }) {
  return (
    <button type="button" className={`td-work-small-item ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className={`td-work-small-icon td-work-small-icon-${item.tone}`} aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return <div className="td-work-toast">{text}</div>;
}

function LuckyMark({ size = 'large' }) {
  return (
    <span className={`td-work-mark td-work-mark-${size}`} aria-hidden="true">
      <span />
    </span>
  );
}

function SidebarToggleIcon() {
  return <span className="td-work-sidebar-toggle-icon" aria-hidden="true" />;
}

function LuckyUserMenuTrigger({ accountMenu, accountMenuOpen, onAccountMenuOpenChange }) {
  const trigger = (
    <button type="button" className="td-work-user" aria-label="打开账号菜单">
      <span className="td-work-user-avatar">张</span>
      <span className="td-work-user-copy">
        <strong>张洪磊</strong>
        <em>标准套餐 · 国人通教育</em>
      </span>
    </button>
  );

  if (!accountMenu) return trigger;

  return (
    <Dropdown
      trigger={['click']}
      open={accountMenuOpen}
      onOpenChange={onAccountMenuOpenChange}
      placement="topLeft"
      popupRender={() => accountMenu}
      classNames={{ root: 'account-profile-dropdown' }}
      destroyOnHidden
    >
      {trigger}
    </Dropdown>
  );
}

function ConnectorLogo({ item }) {
  return (
    <span className={`td-work-connector-logo td-work-connector-logo-${item.tone}`} aria-hidden="true">
      {item.logo}
    </span>
  );
}

function AppMarketplaceCard({ item, onOpen }) {
  return (
    <button type="button" className="td-work-app-market-card" onClick={() => onOpen(item)} aria-label={`打开${item.title}`}>
      <span className="td-work-app-market-cover">
        <img src={item.cover} alt="" />
        {item.badge ? (
          <span className={`td-work-app-market-badge ${item.badge === '精选' ? 'is-featured' : 'is-hot'}`}>
            {item.badge}
          </span>
        ) : null}
        <span className="td-work-app-market-views"><EyeOutlined /> {item.views}</span>
      </span>
      <span className="td-work-app-market-detail">
        <span className="td-work-app-market-icon"><img src={item.icon} alt="" /></span>
        <span className="td-work-app-market-copy">
          <strong>{item.title}</strong>
          <span className="td-work-app-market-meta">
            <span className="td-work-app-market-owner">
              <span className="td-work-app-market-avatar">{item.owner.slice(0, 1)}</span>
              <span>{item.owner}</span>
            </span>
            <span className="td-work-app-market-likes"><StarOutlined /> {item.likes}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

function ResourceMarketplaceCard({ item, onOpen }) {
  return (
    <button type="button" className="td-work-resource-market-card" onClick={() => onOpen(item)} aria-label={`打开${item.title}`}>
      <span className="td-work-resource-market-cover">
        <img src={item.cover} alt="" />
        {item.badge ? (
          <span className={`td-work-app-market-badge ${item.badge === '精选' ? 'is-featured' : 'is-hot'}`}>
            {item.badge}
          </span>
        ) : null}
        <span className="td-work-app-market-views"><EyeOutlined /> {item.views}</span>
      </span>
      <span className="td-work-resource-market-detail">
        <strong>{item.title}</strong>
        <span className="td-work-resource-market-meta">
          <span className="td-work-app-market-owner">
            <span className="td-work-resource-market-avatar">{item.owner.slice(0, 1)}</span>
            <span>{item.owner}</span>
          </span>
          <span className="td-work-app-market-likes"><StarOutlined /> {item.likes}</span>
        </span>
      </span>
    </button>
  );
}

function ResourceDetailPage({ item, recommendations, onBack, onOpenResource, onCreate, kind = 'resource' }) {
  const [liked, setLiked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const isApp = kind === 'app';
  const contentLabel = isApp ? '应用' : '资源';

  const visibleRecommendations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const matched = recommendations.filter((resource) => (
      !keyword || `${resource.title} ${resource.owner} ${resource.category}`.toLowerCase().includes(keyword)
    ));
    return matched.slice(0, 12);
  }, [recommendations, searchText]);

  const downloadResource = () => {
    const anchor = document.createElement('a');
    anchor.href = item.cover;
    anchor.download = `${item.title}.jpg`;
    anchor.click();
    message.success('资源已开始下载');
  };

  return (
    <section className={`td-work-resource-detail-page ${isApp ? 'is-app-detail' : ''} ${fullscreen ? 'is-fullscreen' : ''}`} aria-label={`${item.title}${contentLabel}预览`}>
      <header className="td-work-resource-detail-header">
        <button type="button" className="td-work-resource-detail-back" onClick={onBack} title={`返回${contentLabel}广场`} aria-label={`返回${contentLabel}广场`}><LeftOutlined /></button>
        <button type="button" className="td-work-resource-detail-brand" onClick={onBack} title={`返回${contentLabel}广场`}>
          <img src={tongdaLogo} alt="通答" />
        </button>
        <i aria-hidden="true" />
        <span>tongda.work</span>
        <form
          className={`td-work-resource-detail-search ${searchFocused || searchText ? 'is-active' : ''}`}
          onSubmit={(event) => {
            event.preventDefault();
            message.success(searchText.trim() ? `已搜索“${searchText.trim()}”` : '请输入搜索内容');
          }}
        >
          <SearchOutlined />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            placeholder={isApp ? '输入关键词搜索应用' : '输入知识点搜索资源'}
            aria-label={isApp ? '输入关键词搜索应用' : '输入知识点搜索资源'}
          />
          <button type="submit">搜索</button>
        </form>
      </header>

      <main className="td-work-resource-detail-layout">
        <div className="td-work-resource-detail-primary">
          <section className="td-work-resource-preview-stage" aria-label="资源内容预览">
            <img src={item.cover} alt={item.title} />
            <div className="td-work-resource-preview-shade" />
            <div className="td-work-resource-preview-caption">
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <button type="button" onClick={() => message.success(`${contentLabel}体验已打开`)}>打开体验 <RightOutlined /></button>
            </div>
            <button type="button" className="td-work-resource-preview-fullscreen" onClick={() => setFullscreen((value) => !value)}>
              {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}{fullscreen ? '退出全屏' : '全屏'}
            </button>
          </section>

          <section className="td-work-resource-detail-actions" aria-label="资源操作">
            <div className="td-work-resource-detail-author">
              <span>{item.owner.slice(0, 1)}</span>
              <div><strong>{item.owner}</strong><small>{isApp ? '欢迎大家体验和改编我的应用～' : '欢迎大家收藏和下载我的作品～'}</small></div>
              <button type="button" onClick={() => message.success('已关注作者')}>+ 关注</button>
            </div>
            <div className="td-work-resource-detail-counts">
              <span><EyeOutlined /> {item.views}</span>
              <button type="button" className={liked ? 'is-liked' : ''} onClick={() => setLiked((value) => !value)}><StarOutlined /> {Number(item.likes) + (liked ? 1 : 0)}</button>
              <button type="button" onClick={() => message.success('资源链接已复制')}><ShareAltOutlined /> 分享</button>
            </div>
            <div className="td-work-resource-detail-commands">
              <button type="button" onClick={() => onCreate(`改编《${item.title}》，保留核心教学目标并适配我的课堂`)}><EditOutlined /> 一键改编</button>
              {isApp ? (
                <button type="button" className="is-primary" onClick={() => message.success('应用体验已打开')}>立即体验 <RightOutlined /></button>
              ) : (
                <button type="button" className="is-primary" onClick={downloadResource}><DownloadOutlined /> 下载</button>
              )}
            </div>
          </section>
        </div>

        <aside className="td-work-resource-related" aria-label="相关推荐">
          <h2>相关推荐</h2>
          <div>
            {visibleRecommendations.map((resource) => (
              <button key={resource.key} type="button" onClick={() => onOpenResource(resource)}>
                <span className="td-work-resource-related-cover">
                  <img src={resource.cover} alt="" />
                  {resource.badge ? <em>{resource.badge}</em> : null}
                </span>
                <span className="td-work-resource-related-copy">
                  <strong>{resource.title}</strong>
                  <small>{resource.owner}</small>
                  <span><span><EyeOutlined /> {resource.views}</span><span><StarOutlined /> {resource.likes}</span></span>
                </span>
              </button>
            ))}
            {visibleRecommendations.length === 0 ? <p>没有找到相关{contentLabel}</p> : null}
          </div>
        </aside>
      </main>
    </section>
  );
}

function MarketplacePage({ type, onCreate }) {
  const isResource = type === 'resource';
  const categories = isResource ? RESOURCE_MARKET_CATEGORIES : APP_MARKET_CATEGORIES;
  const items = isResource ? RESOURCE_MARKET_ITEMS : APP_MARKET_ITEMS;
  const [activeCategory, setActiveCategory] = useState('推荐');
  const [searchText, setSearchText] = useState('');
  const [appPrompt, setAppPrompt] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const categoryScrollRef = useRef(null);

  const visibleItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === '推荐' || activeCategory === '更多' || item.category === activeCategory;
      const matchesKeyword = !keyword || `${item.title} ${item.owner} ${item.category}`.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [activeCategory, items, searchText]);

  if (activeItem) {
    return (
      <ResourceDetailPage
        item={activeItem}
        recommendations={items.filter((item) => item.key !== activeItem.key)}
        onBack={() => setActiveItem(null)}
        onOpenResource={setActiveItem}
        onCreate={onCreate}
        kind={isResource ? 'resource' : 'app'}
      />
    );
  }

  if (!isResource) {
    const midpoint = Math.ceil(visibleItems.length / 2);
    const appColumns = [visibleItems.slice(0, midpoint), visibleItems.slice(midpoint)];
    const samplePrompt = '生成一个课堂小组积分应用，支持实时加分、排行榜、课堂表现记录和课后导出';
    const submitAppPrompt = () => onCreate?.(appPrompt.trim() || samplePrompt);

    return (
      <section className="td-work-market-page td-work-app-market-page" aria-label="应用广场">
        <div className="td-work-app-market-shell">
          <header className="td-work-app-market-heading">
            <h1>应用广场</h1>
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              placeholder="快速搜索应用"
              aria-label="快速搜索应用"
            />
          </header>

          <div className="td-work-app-market-categories" aria-label="应用广场分类">
            {categories.map((category) => (
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

          {visibleItems.length ? (
            <div className="td-work-app-market-columns" aria-label="应用列表">
              {appColumns.map((column, index) => (
                <div key={index} className="td-work-app-market-column">
                  {column.map((item) => <AppMarketplaceCard key={item.key} item={item} onOpen={setActiveItem} />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="td-work-market-empty"><Empty description="没有找到匹配应用" /></div>
          )}
        </div>

        <div className="td-work-app-market-composer">
          <span>教育应用</span>
          <input
            value={appPrompt}
            onChange={(event) => setAppPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitAppPrompt();
            }}
            placeholder={samplePrompt}
            aria-label="描述要生成的教育应用"
          />
          <button type="button" className="td-work-app-market-voice" title="语音输入" aria-label="语音输入"><AudioOutlined /></button>
          <button type="button" className="td-work-app-market-send" title="开始创建" aria-label="开始创建" onClick={submitAppPrompt}><ArrowUpOutlined /></button>
        </div>
      </section>
    );
  }

  const resourceMidpoint = Math.ceil(visibleItems.length / 2);
  const resourceColumns = [visibleItems.slice(0, resourceMidpoint), visibleItems.slice(resourceMidpoint)];
  const resourceSamplePrompt = '教学动画｜设计初中数学勾股定理互动教学活动，引导学生主动探究，培养几何直观、逻辑推理能力。';
  const submitResourcePrompt = () => onCreate?.(appPrompt.trim() || resourceSamplePrompt);

  return (
    <section className="td-work-market-page td-work-resource-market-page" aria-label="资源广场">
      <div className="td-work-resource-market-shell">
        <header className="td-work-resource-market-heading">
          <h1>资源广场</h1>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            placeholder="快速搜索资源"
            aria-label="快速搜索资源"
          />
        </header>

        <div className="td-work-resource-category-shell">
          <div ref={categoryScrollRef} className="td-work-resource-market-categories" aria-label="资源广场分类">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
                {category === '数学' ? <sup>Hot</sup> : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="td-work-resource-category-more"
            title="查看更多分类"
            aria-label="查看更多分类"
            onClick={() => categoryScrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
          >
            <RightOutlined />
          </button>
        </div>

        {visibleItems.length ? (
          <div className="td-work-resource-market-columns" aria-label="资源列表">
            {resourceColumns.map((column, index) => (
              <div key={index} className="td-work-resource-market-column">
                {column.map((item) => <ResourceMarketplaceCard key={item.key} item={item} onOpen={setActiveItem} />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="td-work-market-empty"><Empty description="没有找到匹配资源" /></div>
        )}
      </div>

      <div className="td-work-resource-market-composer">
        <input
          value={appPrompt}
          onChange={(event) => setAppPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitResourcePrompt();
          }}
          placeholder={resourceSamplePrompt}
          aria-label="描述要生成的教学资源"
        />
        <button type="button" title="语音输入" aria-label="语音输入"><AudioOutlined /></button>
        <button type="button" className="td-work-resource-market-send" title="开始创建" aria-label="开始创建" onClick={submitResourcePrompt}><ArrowUpOutlined /></button>
      </div>
    </section>
  );
}

function AiModeHomePage({ onCreateTask, onNavigate, onOpenItem }) {
  const [homePrompt, setHomePrompt] = useState('');
  const [activeCreationTypeKey, setActiveCreationTypeKey] = useState(null);
  const [activeShelf, setActiveShelf] = useState('resource');
  const homePromptRef = useRef(null);
  const activeCreationType = HOME_CREATION_TYPES.find((item) => item.key === activeCreationTypeKey) || null;
  const shelfItems = activeShelf === 'resource'
    ? [
      RESOURCE_MARKET_ITEMS[0],
      RESOURCE_MARKET_ITEMS[10],
      RESOURCE_MARKET_ITEMS[1],
      RESOURCE_MARKET_ITEMS[11],
      RESOURCE_MARKET_ITEMS[2],
      RESOURCE_MARKET_ITEMS[12],
    ]
    : APP_MARKET_ITEMS.slice(0, 6);

  const submitPrompt = () => {
    const nextPrompt = homePrompt.trim() || '帮我设计一个适合课堂使用的 AI 教学活动';
    onCreateTask(nextPrompt);
  };
  const focusHomePromptAtEnd = () => {
    requestAnimationFrame(() => {
      const editor = homePromptRef.current;
      if (!editor) return;
      editor.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  };

  return (
    <section className="td-work-home-page" aria-label="AI模式首页">
      <div className="td-work-home-hero">
        <div className="td-work-home-greeting">
          <LuckyMark size="small" />
          <h1>Hi,我是通答老师</h1>
        </div>

        <div className="td-work-home-composer">
          <div
            className={`td-work-home-prompt-editor ${activeCreationType ? 'has-selected-skill' : ''}`}
            onClick={(event) => {
              if (event.target.closest('.td-work-home-selected-skill')) return;
              homePromptRef.current?.focus();
            }}
          >
            {activeCreationType ? (
              <button
                type="button"
                className="td-work-home-selected-skill"
                title={`移除 ${activeCreationType.label}`}
                aria-label={`移除 ${activeCreationType.label}`}
                contentEditable={false}
                onClick={() => {
                  setActiveCreationTypeKey(null);
                  setHomePrompt('');
                  focusHomePromptAtEnd();
                }}
              >
                <span>{activeCreationType.label}</span>
                <CloseOutlined />
              </button>
            ) : null}
            <span
              ref={homePromptRef}
              className="td-work-home-prompt-text"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="输入教学创作需求"
              data-placeholder="教学动画｜设计初中数学勾股定理互动教学活动，引导学生主动探究，培养几何直观、逻辑推理能力。"
              onInput={(event) => setHomePrompt(event.currentTarget.innerText)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitPrompt();
                }
              }}
            >
              {homePrompt}
            </span>
          </div>
          <div className="td-work-home-composer-actions">
            <button type="button" className="td-work-home-add" title="添加附件" aria-label="添加附件">
              <PlusOutlined />
            </button>
            <div className="td-work-home-creation-types">
              {HOME_CREATION_TYPES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={activeCreationTypeKey === item.key ? 'is-selected' : ''}
                  onClick={() => {
                    setActiveCreationTypeKey(item.key);
                    setHomePrompt(item.prompt);
                    focusHomePromptAtEnd();
                  }}
                >
                  {item.icon}
                  {item.label}
                  {item.key === 'education-app' ? <sup>NEW</sup> : null}
                </button>
              ))}
            </div>
            <button type="button" className="td-work-home-more" onClick={() => onNavigate('app-market')}>
              更多 <DownOutlined />
            </button>
            <button type="button" className="td-work-home-voice" title="语音输入" aria-label="语音输入">
              <AudioOutlined />
            </button>
            <button type="button" className="td-work-home-send" title="开始创建" aria-label="开始创建" onClick={submitPrompt}>
              <ArrowUpOutlined />
            </button>
          </div>
        </div>
      </div>

      <div className="td-work-home-shelf-head">
        <div className="td-work-home-shelf-tabs" role="tablist" aria-label="首页推荐内容">
          <button
            type="button"
            role="tab"
            aria-selected={activeShelf === 'resource'}
            className={activeShelf === 'resource' ? 'is-active' : ''}
            onClick={() => setActiveShelf('resource')}
          >
            资源广场
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeShelf === 'app'}
            className={activeShelf === 'app' ? 'is-active' : ''}
            onClick={() => setActiveShelf('app')}
          >
            应用广场
          </button>
        </div>
      </div>

      <div className={`td-work-home-market-grid is-${activeShelf}`}>
        {shelfItems.map((item) => (
          activeShelf === 'resource'
            ? <ResourceMarketplaceCard key={item.key} item={item} onOpen={onOpenItem} />
            : <AppMarketplaceCard key={item.key} item={item} onOpen={onOpenItem} />
        ))}
      </div>
    </section>
  );
}

function ExpertStudioDetailPage({ studio, followed, onBack, onFollow, onToast }) {
  const [activeTab, setActiveTab] = useState('home');
  const [discussionSort, setDiscussionSort] = useState('hot');
  const [discussionDraft, setDiscussionDraft] = useState('');
  const [discussions, setDiscussions] = useState(EXPERT_STUDIO_DISCUSSIONS);
  const [likedDiscussionKeys, setLikedDiscussionKeys] = useState(() => new Set());
  const [replyPostKey, setReplyPostKey] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const isHouStudio = studio.key === 'hou-qiying';
  const detailDescription = isHouStudio
    ? '工作室本着“共学、共研、共创、共育、共享、共赢”理念，一起学习、一起研修、一起成长、一起卓越，聚焦“AI素养、智能教研、融合应用、素养评价、资源共建”五大研究方向，积极践行“AI赋能教育、智育启迪未来”主张，让教师智慧地教、学生快乐地学、师生幸福地成长。'
    : studio.desc;
  const sortedDiscussions = discussionSort === 'new'
    ? discussions
    : [...discussions].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));

  const publishDiscussion = () => {
    const content = discussionDraft.trim();
    if (!content) {
      onToast('请先输入讨论内容');
      return;
    }
    setDiscussions((current) => [{
      key: `discussion-${Date.now()}`,
      author: '张洪磊',
      role: '工作室成员',
      time: '刚刚',
      likes: 0,
      comments: 0,
      title: content.length > 30 ? `${content.slice(0, 30)}…` : content,
      content,
      tags: ['新讨论'],
    }, ...current]);
    setDiscussionDraft('');
    setActiveTab('discussion');
    onToast('讨论发布成功');
  };

  const toggleDiscussionLike = (key) => {
    setLikedDiscussionKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submitReply = (key) => {
    if (!replyDraft.trim()) return;
    setDiscussions((current) => current.map((item) => (
      item.key === key ? { ...item, comments: item.comments + 1 } : item
    )));
    setReplyDraft('');
    setReplyPostKey(null);
    onToast('回复已发布');
  };

  const renderArticlePosts = (posts = EXPERT_STUDIO_POSTS) => (
    <>
      <div className="td-work-expert-detail-posts">
        {posts.map((post) => (
          <article key={post.key} className="td-work-expert-detail-post" onClick={() => onToast(`已打开：${post.title}`)}>
            <h2>{post.title}</h2>
            <p>{post.desc}</p>
            <footer>
              <span className="td-work-expert-detail-author"><img src={studio.cover} alt="" />{post.author}</span>
              <time>{post.date}</time>
              <span><HeartOutlined /> {post.likes}</span>
              <span><MessageOutlined /> {post.comments}</span>
            </footer>
          </article>
        ))}
      </div>
      <button type="button" className="td-work-expert-detail-load" onClick={() => onToast('已加载更多工作室内容')}>查看更多</button>
    </>
  );

  const renderDiscussions = () => (
    <>
      <div className="td-work-expert-discussion-toolbar">
        <div>
          <h2>讨论区</h2>
          <span>和工作室成员一起交流教学实践</span>
        </div>
        <Segmented
          size="small"
          value={discussionSort}
          options={[{ label: '热门', value: 'hot' }, { label: '最新', value: 'new' }]}
          onChange={setDiscussionSort}
        />
      </div>
      <div className="td-work-expert-discussion-composer">
        <img src={studio.cover} alt="" />
        <div>
          <textarea
            value={discussionDraft}
            placeholder="分享一个问题、教学发现或资源经验…"
            onChange={(event) => setDiscussionDraft(event.target.value)}
          />
          <footer>
            <button type="button" onClick={() => onToast('已打开图片选择')}><UploadOutlined /> 图片</button>
            <button type="button" onClick={() => onToast('已打开资源选择')}><LinkOutlined /> 资源</button>
            <button type="button" onClick={() => onToast('已添加话题')}><AppstoreOutlined /> 话题</button>
            <button type="button" className="is-primary" disabled={!discussionDraft.trim()} onClick={publishDiscussion}>发布</button>
          </footer>
        </div>
      </div>
      <div className="td-work-expert-discussion-list">
        {sortedDiscussions.map((item) => {
          const liked = likedDiscussionKeys.has(item.key);
          return (
            <article key={item.key} className="td-work-expert-discussion-card">
              <header>
                <img src={item.author === '侯琪颖' ? studio.cover : EXPERT_STUDIOS[(item.title.length % (EXPERT_STUDIOS.length - 1)) + 1].cover} alt="" />
                <div><strong>{item.author}</strong><span>{item.role} · {item.time}</span></div>
                {item.pinned ? <em><StarOutlined /> 置顶</em> : null}
                <button type="button" aria-label="更多操作"><MoreOutlined /></button>
              </header>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
              <div className="td-work-expert-discussion-tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <footer>
                <button type="button" className={liked ? 'is-active' : ''} onClick={() => toggleDiscussionLike(item.key)}><HeartOutlined /> {item.likes + (liked ? 1 : 0)}</button>
                <button type="button" onClick={() => setReplyPostKey((current) => current === item.key ? null : item.key)}><MessageOutlined /> {item.comments}</button>
                <button type="button" onClick={() => onToast('已复制讨论链接')}><LinkOutlined /> 分享</button>
              </footer>
              {replyPostKey === item.key ? (
                <div className="td-work-expert-discussion-reply">
                  <Input
                    value={replyDraft}
                    placeholder={`回复 ${item.author}`}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    onPressEnter={() => submitReply(item.key)}
                  />
                  <Button type="primary" disabled={!replyDraft.trim()} onClick={() => submitReply(item.key)}>回复</Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );

  return (
    <section className="td-work-expert-detail" aria-label={`${studio.name}空间`}>
      <div className="td-work-expert-detail-shell">
        <header className="td-work-expert-detail-hero">
          <div className="td-work-expert-detail-cover">
            <button type="button" className="td-work-expert-detail-back" onClick={onBack} aria-label="返回专家工作室">
              <LeftOutlined />
              <span>返回</span>
            </button>
          </div>
          <div className="td-work-expert-detail-profile">
            <img className="td-work-expert-detail-avatar" src={studio.cover} alt="" />
            <div className="td-work-expert-detail-info">
              <div className="td-work-expert-detail-title-row">
                <h1>{studio.name}</h1>
                <span>市级</span>
                <span>{studio.province} · {isHouStudio ? '泉州市' : '教师发展中心'}</span>
              </div>
              <div className="td-work-expert-detail-stats">
                <button type="button" onClick={() => onToast(`已打开${studio.name}成员列表`)}><TeamOutlined /><strong>11</strong>成员</button>
                <span><HeartOutlined /><strong>{studio.follows}</strong>粉丝</span>
                <span><EyeOutlined /><strong>{isHouStudio ? '836' : studio.views}</strong>浏览量</span>
              </div>
              <p>{detailDescription}</p>
              <div className="td-work-expert-detail-meta">
                <strong>研究方向：</strong>
                <span>教师AI素养提升</span>
                <span>人工智能赋能教学创新</span>
                <span>教学资源开发</span>
              </div>
              <div className="td-work-expert-detail-project">
                <strong>在研课题：</strong>
                智慧教育平台乡村小学读思达教学法应用研究
              </div>
            </div>
            <button type="button" className={`td-work-expert-detail-follow ${followed ? 'is-followed' : ''}`} onClick={onFollow}>
              {followed ? <CheckOutlined /> : <PlusOutlined />}
              {followed ? '已关注' : '关注'}
            </button>
          </div>
        </header>

        <nav className="td-work-expert-detail-tabs" role="tablist" aria-label="工作室空间栏目">
          {EXPERT_STUDIO_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}{tab.count ? (
                <span>({tab.key === 'discussion' ? tab.count + discussions.length - EXPERT_STUDIO_DISCUSSIONS.length : tab.count})</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="td-work-expert-detail-layout">
          <main className="td-work-expert-detail-feed">
            {activeTab === 'home' ? (
              <>
                <section className="td-work-expert-hot-section">
                  <header><h2>正在热议</h2><button type="button" onClick={() => setActiveTab('discussion')}>查看全部 <RightOutlined /></button></header>
                  <div>
                    {discussions.slice(0, 3).map((item) => (
                      <button key={item.key} type="button" onClick={() => setActiveTab('discussion')}>
                        <span><img src={item.author === '侯琪颖' ? studio.cover : EXPERT_STUDIOS[2].cover} alt="" /><strong>{item.author}</strong><time>{item.time}</time></span>
                        <p>{item.title}</p>
                        <em><MessageOutlined /> {item.comments} 条回复</em>
                      </button>
                    ))}
                  </div>
                </section>
                <div className="td-work-expert-section-title"><h2>最新动态</h2><span>持续更新工作室研究与实践成果</span></div>
                {renderArticlePosts(EXPERT_STUDIO_POSTS.slice(0, 5))}
              </>
            ) : null}
            {activeTab === 'discussion' ? renderDiscussions() : null}
            {activeTab === 'article' ? (
              <>
                <div className="td-work-expert-section-title"><h2>精选文章</h2><span>共 18 篇</span></div>
                {renderArticlePosts(EXPERT_STUDIO_POSTS.filter((item) => item.category === '文章'))}
              </>
            ) : null}
            {activeTab === 'course' ? (
              <>
                <div className="td-work-expert-section-title"><h2>研修课程</h2><span>系统学习工作室核心研究成果</span></div>
                <div className="td-work-expert-course-grid">
                  {EXPERT_STUDIO_COURSES.map((item) => (
                    <button key={item.key} type="button" onClick={() => onToast(`已打开课程：${item.title}`)}>
                      <img src={item.cover} alt="" />
                      <strong>{item.title}</strong>
                      <span>{item.lessons}节课<em>{item.learners}人学习</em></span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {activeTab === 'event' ? (
              <>
                <div className="td-work-expert-section-title"><h2>工作室活动</h2><span>线上线下共同研修</span></div>
                <div className="td-work-expert-event-list">
                  {EXPERT_STUDIO_EVENTS.map((item) => (
                    <button key={item.key} type="button" onClick={() => onToast(`已打开活动：${item.title}`)}>
                      <time>{item.date}</time>
                      <div><span>{item.status}</span><h3>{item.title}</h3><p>{item.mode} · {item.members}人参与</p></div>
                      <RightOutlined />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {activeTab === 'more' ? (
              <div className="td-work-expert-about">
                <h2>关于工作室</h2>
                <p>{detailDescription}</p>
                <h3>研究方向</h3>
                <div><span>教师AI素养提升</span><span>人工智能赋能教学创新</span><span>教学资源开发</span></div>
                <h3>运行机制</h3>
                <p>实行双周线上例会、每月主题研讨、季度线下工作坊和年度成果展示，建立“工具推荐—使用指导—问题反馈”的闭环服务机制。</p>
              </div>
            ) : null}
          </main>

          <aside className="td-work-expert-detail-side">
            {activeTab === 'discussion' ? (
              <section className="td-work-expert-detail-panel td-work-expert-discussion-guide">
                <header><h2>讨论区指南</h2><span>共创交流</span></header>
                <p>围绕真实教学问题交流，描述清楚场景与目标；分享资源时请注明来源，保护学生与教师个人信息。</p>
                <div><strong>热门话题</strong><span>#AI备课</span><span>#课堂实践</span><span>#资源分享</span><span>#AI伦理</span></div>
              </section>
            ) : null}
            <section className="td-work-expert-detail-panel td-work-expert-active-members">
              <header><h2>活跃成员</h2><button type="button" onClick={() => onToast('已打开全部成员')}>全部成员</button></header>
              <div>
                {EXPERT_STUDIOS.slice(0, 6).map((item) => <img key={item.key} src={item.cover} alt="" title={item.name} />)}
              </div>
              <p>11 位成员正在共同研究与分享</p>
            </section>
            <section className="td-work-expert-detail-panel">
              <header><h2>精选推荐</h2><span>热门推荐</span></header>
              {EXPERT_STUDIO_RECOMMENDS.map((item) => (
                <button key={item.key} type="button" className="td-work-expert-recommend-item" onClick={() => onToast(`已打开：${item.title}`)}>
                  <strong>{item.title}</strong>
                  <span>{item.author}<time>{item.date}</time></span>
                </button>
              ))}
              <button type="button" className="td-work-expert-detail-refresh" onClick={() => onToast('已更新精选推荐')}><ReloadOutlined /> 换一换</button>
            </section>

            {activeTab !== 'discussion' ? <section className="td-work-expert-detail-panel td-work-expert-ranking">
              <header><h2>排行榜</h2><span>贡献值</span></header>
              <div className="td-work-expert-ranking-stats">
                <span><strong>4.07</strong>昨日新增</span>
                <span><strong>37.98</strong>2026学年</span>
                <span><strong>87</strong>排名</span>
              </div>
              <div className="td-work-expert-ranking-head"><span>排行</span><span>工作室名称</span><span>贡献值</span></div>
              <ol>
                {EXPERT_STUDIO_RANKING.map(([name, score], index) => (
                  <li key={name}>
                    <em className={index < 3 ? `is-top-${index + 1}` : ''}>{index + 1}</em>
                    <span>{name}</span>
                    <strong>{score}</strong>
                  </li>
                ))}
              </ol>
              <small>最近更新时间：2026/10/25 05:50:48</small>
            </section> : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

function ExpertStudiosPage({ onToast }) {
  const [province, setProvince] = useState('全部');
  const [showAll, setShowAll] = useState(false);
  const [followedKeys, setFollowedKeys] = useState(() => new Set());
  const [activeStudio, setActiveStudio] = useState(null);
  const filteredItems = useMemo(
    () => EXPERT_STUDIOS.filter((item) => province === '全部' || item.province === province),
    [province],
  );
  const visibleItems = showAll ? filteredItems : filteredItems.slice(0, 8);

  const toggleFollow = (event, item) => {
    event?.stopPropagation();
    setFollowedKeys((current) => {
      const next = new Set(current);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  };

  if (activeStudio) {
    return (
      <ExpertStudioDetailPage
        studio={activeStudio}
        followed={followedKeys.has(activeStudio.key)}
        onBack={() => setActiveStudio(null)}
        onFollow={(event) => toggleFollow(event, activeStudio)}
        onToast={onToast}
      />
    );
  }

  return (
    <section className="td-work-expert-page" aria-label="专家工作室">
      <div className="td-work-expert-content">
        <section className="td-work-expert-filter" aria-label="按省份筛选工作室">
          <strong>省份</strong>
          <div>
            {EXPERT_STUDIO_PROVINCES.map((item) => (
              <button
                key={item}
                type="button"
                className={province === item ? 'is-active' : ''}
                onClick={() => {
                  setProvince(item);
                  setShowAll(false);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {visibleItems.length ? (
          <div className="td-work-expert-grid">
            {visibleItems.map((item) => {
              const isFollowed = followedKeys.has(item.key);
              return (
                <article
                  key={item.key}
                  className="td-work-expert-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveStudio(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveStudio(item);
                    }
                  }}
                >
                  <div className="td-work-expert-card-cover">
                    <img src={item.cover} alt={item.name} />
                    <h2>{item.name}</h2>
                  </div>
                  <div className="td-work-expert-card-body">
                    <p>{item.desc}</p>
                    <footer>
                      <span><EyeOutlined /> {item.views}浏览</span>
                      <button
                        type="button"
                        className={isFollowed ? 'is-followed' : ''}
                        onClick={(event) => toggleFollow(event, item)}
                      >
                        <HeartOutlined /> {isFollowed ? '已关注' : `${item.follows}关注`}
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="td-work-expert-empty">该地区暂无工作室</div>
        )}

        {filteredItems.length > 8 ? (
          <button type="button" className="td-work-expert-more" onClick={() => setShowAll((value) => !value)}>
            {showAll ? '收起' : '查看更多'}
            <DownOutlined className={showAll ? 'is-open' : ''} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function AcademyCourseDetailPage({ course, relatedCourses, onBack, onSelectCourse, onToast }) {
  const [playing, setPlaying] = useState(false);
  const details = ACADEMY_COURSE_DETAILS[course.key] || {};
  const author = details.author || course.owner || '通答学院讲师';
  const purpose = details.purpose || course.feature || '教学实践';
  const contentType = details.contentType || course.category || '课程教程';
  const audience = details.audience || '一线教师';
  const intro = details.intro || `围绕“${course.title}”梳理核心操作、课堂应用方法与可复用的实践经验，帮助教师快速完成从理解到落地。`;
  const goals = details.goals || ['理解课程的核心方法与使用场景', '掌握可直接迁移到课堂的操作步骤', '形成可复用、可持续迭代的教学成果'];

  return (
    <div className="td-work-academy-detail">
      <button type="button" className="td-work-academy-detail-back" onClick={onBack}>
        <LeftOutlined /> 返回
      </button>

      <section className={`td-work-academy-player ${playing ? 'is-playing' : ''}`} aria-label={`${course.title}课程播放区`}>
        <img src={course.cover} alt={course.title} />
        <div className="td-work-academy-player-shade" />
        <div className="td-work-academy-player-controls">
          <button type="button" onClick={() => setPlaying((value) => !value)} title={playing ? '暂停' : '播放'} aria-label={playing ? '暂停课程' : '播放课程'}>
            <CaretRightFilled />
          </button>
          <span>{playing ? '0:18' : '0:00'} / {course.duration || '12:00'}</span>
          <i><b style={{ width: playing ? '18%' : '0%' }} /></i>
          <button type="button" onClick={() => onToast('已进入全屏播放')} title="全屏" aria-label="全屏播放"><FullscreenOutlined /></button>
          <button type="button" title="更多播放设置" aria-label="更多播放设置"><MoreOutlined /></button>
        </div>
      </section>

      <div className="td-work-academy-detail-grid">
        <article className="td-work-academy-detail-copy">
          <h1>{course.title}</h1>
          <strong>{author}</strong>
          <dl>
            <div><dt>用途分类</dt><dd>{purpose}</dd></div>
            <div><dt>内容类型</dt><dd>{contentType}</dd></div>
            <div><dt>适用对象</dt><dd>{audience}</dd></div>
          </dl>
          <section>
            <h2>课程简介</h2>
            <p>{intro}</p>
          </section>
          <section>
            <h2>课程目标</h2>
            <ul>{goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
          </section>
        </article>

        <aside className="td-work-academy-related" aria-label="更多课程">
          <h2>更多课程</h2>
          <div>
            {relatedCourses.slice(0, 8).map((item) => (
              <button key={item.key} type="button" onClick={() => onSelectCourse(item)}>
                <img src={item.cover} alt="" />
                <span><strong>{item.title}</strong><small>{item.duration || item.category}</small></span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AcademyCampaignDetailPage({ onBack, onToast }) {
  const directions = [
    ['教学动画', '让抽象知识动起来'],
    ['教育应用', '把课堂方法做成可使用的工具'],
    ['教学游戏', '用故事和任务激发主动学习'],
    ['互动课件', '让课堂讲解与学生操作相结合'],
  ];

  return (
    <div className="td-work-academy-campaign">
      <header>
        <button type="button" onClick={onBack}><LeftOutlined /> 返回</button>
        <button type="button" onClick={() => onToast('已打开我的投稿')}>我的投稿</button>
      </header>
      <section className="td-work-academy-campaign-hero" style={{ backgroundImage: `url(${academyCreationBanner})` }}>
        <div>
          <span>2026 教师 AI 教育创作</span>
          <h1>让你的教育智慧，<br />真正运行起来</h1>
          <p>从一个真实问题开始，把你的方法、经验和灵感，变成可以直接使用、持续改进、被更多人分享的 AI 教育作品。</p>
          <div><button type="button" onClick={() => onToast('已进入作品提交')}>立即提交作品</button><small>征集至 2026 年 11 月 30 日 23:59</small></div>
        </div>
      </section>
      <section className="td-work-academy-campaign-directions">
        <span>01 · 创作方向</span>
        <h2>你想把什么，做出来</h2>
        <div>{directions.map(([title, description]) => <article key={title}><strong>{title}</strong><p>{description}</p></article>)}</div>
      </section>
      <div className="td-work-academy-campaign-cta">
        <span><strong>把你的好方法做出来，让更多人真正用起来</strong><small>四大创作方向开放投稿</small></span>
        <button type="button" onClick={() => onToast('已进入作品提交')}>选择方向，提交作品</button>
      </div>
    </div>
  );
}

function TongdaAcademyPage({ onToast }) {
  const [showMoreReplays, setShowMoreReplays] = useState(false);
  const [guideTab, setGuideTab] = useState('全部');
  const [showMoreGuides, setShowMoreGuides] = useState(false);
  const [tipTab, setTipTab] = useState('全部');
  const [featureTab, setFeatureTab] = useState('全部');
  const [showMoreTips, setShowMoreTips] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const academyPageRef = useRef(null);

  const visibleGuides = useMemo(() => {
    const matches = ACADEMY_GUIDES.filter((item) => guideTab === '全部' || item.category === guideTab);
    return showMoreGuides ? matches : matches.slice(0, 2);
  }, [guideTab, showMoreGuides]);

  const matchingTips = useMemo(() => ACADEMY_TUTORIALS.filter((item) => {
    const matchesCategory = tipTab === '全部' || item.category === tipTab;
    const matchesFeature = featureTab === '全部' || item.feature === featureTab;
    return matchesCategory && matchesFeature;
  }), [featureTab, tipTab]);

  const visibleTips = showMoreTips ? matchingTips : matchingTips.slice(0, 6);
  const openDetail = (item, source) => {
    setActiveDetail({ type: 'course', item, source });
    requestAnimationFrame(() => academyPageRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  };
  const closeDetail = () => {
    setActiveDetail(null);
    requestAnimationFrame(() => academyPageRef.current?.scrollTo({ top: 0 }));
  };

  const relatedCourses = activeDetail?.source === 'guide'
    ? ACADEMY_GUIDES
    : activeDetail?.source === 'tutorial'
      ? ACADEMY_TUTORIALS
      : ACADEMY_REPLAYS;

  return (
    <section ref={academyPageRef} className={`td-work-academy-page ${activeDetail ? 'has-detail' : ''}`} aria-label="通答学院">
      <div className="td-work-academy-shell">
        {activeDetail?.type === 'course' ? (
          <AcademyCourseDetailPage
            course={activeDetail.item}
            relatedCourses={relatedCourses.filter((item) => item.key !== activeDetail.item.key)}
            onBack={closeDetail}
            onSelectCourse={(item) => openDetail(item, activeDetail.source)}
            onToast={onToast}
          />
        ) : activeDetail?.type === 'campaign' ? (
          <AcademyCampaignDetailPage onBack={closeDetail} onToast={onToast} />
        ) : (
          <>
        <header className="td-work-academy-heading">
          <h1>通答学院</h1>
          <div className="td-work-academy-heading-actions">
            <button type="button" className="is-primary" onClick={() => onToast('已进入作品提交')}>提交作品</button>
            <button type="button" onClick={() => onToast('已打开联系我们')}>联系我们</button>
          </div>
        </header>

        <section
          className="td-work-academy-banner"
          style={{ backgroundImage: `url(${academyCreationBanner})` }}
          aria-label="2026 教师 AI 教育创作征集"
        >
          <div>
            <span>四大创作方向开放投稿</span>
            <h2>2026 教师 AI 教育创作征集</h2>
            <p>把你的好方法做出来，让更多人真正用起来</p>
            <button type="button" onClick={() => {
              setActiveDetail({ type: 'campaign' });
              requestAnimationFrame(() => academyPageRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
            }}>立即参与 <span aria-hidden="true">›</span></button>
          </div>
        </section>

        <section className="td-work-academy-section" aria-labelledby="academy-replay-title">
          <h2 id="academy-replay-title">直播回放</h2>
          <div className="td-work-academy-content-grid">
            {(showMoreReplays ? ACADEMY_REPLAYS : ACADEMY_REPLAYS.slice(0, 2)).map((item) => (
              <button key={item.key} type="button" className="td-work-academy-media-card" onClick={() => openDetail(item, 'replay')}>
                <span className="td-work-academy-media">
                  <img src={item.cover} alt="" />
                  <em>{item.duration}</em>
                </span>
                <strong>{item.title}</strong>
                <small>{item.date}</small>
              </button>
            ))}
          </div>
          <button type="button" className="td-work-academy-expand" onClick={() => setShowMoreReplays((value) => !value)}>
            {showMoreReplays ? '收起' : '展开更多'}
            <DownOutlined className={showMoreReplays ? 'is-open' : ''} />
          </button>
        </section>

        <section className="td-work-academy-section" aria-labelledby="academy-guide-title">
          <h2 id="academy-guide-title">网页教程指南</h2>
          <div className="td-work-academy-filter-tabs" role="tablist" aria-label="网页教程指南分类">
            {ACADEMY_GUIDE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={guideTab === tab}
                className={guideTab === tab ? 'is-active' : ''}
                onClick={() => {
                  setGuideTab(tab);
                  setShowMoreGuides(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="td-work-academy-content-grid">
            {visibleGuides.map((item) => (
              <button key={item.key} type="button" className="td-work-academy-media-card" onClick={() => openDetail(item, 'guide')}>
                <span className="td-work-academy-media">
                  <img src={item.cover} alt="" />
                </span>
                <strong>{item.title}</strong>
                <small>{item.owner}<span>{item.category}</span></small>
              </button>
            ))}
          </div>
          {ACADEMY_GUIDES.filter((item) => guideTab === '全部' || item.category === guideTab).length > 2 && (
            <button type="button" className="td-work-academy-expand" onClick={() => setShowMoreGuides((value) => !value)}>
              {showMoreGuides ? '收起' : '展开更多'}
              <DownOutlined className={showMoreGuides ? 'is-open' : ''} />
            </button>
          )}
        </section>

        <section className="td-work-academy-section td-work-academy-tips" aria-labelledby="academy-tips-title">
          <h2 id="academy-tips-title">使用技巧攻略</h2>
          <div className="td-work-academy-filter-tabs is-spacious" role="tablist" aria-label="使用技巧攻略分类">
            {ACADEMY_TIP_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tipTab === tab}
                className={tipTab === tab ? 'is-active' : ''}
                onClick={() => {
                  setTipTab(tab);
                  setShowMoreTips(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="td-work-academy-feature-tabs" role="tablist" aria-label="创作功能分类">
            {ACADEMY_FEATURE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={featureTab === tab}
                className={featureTab === tab ? 'is-active' : ''}
                onClick={() => {
                  setFeatureTab(tab);
                  setShowMoreTips(false);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {visibleTips.length > 0 ? (
            <div className="td-work-academy-content-grid">
              {visibleTips.map((item) => (
                <button key={item.key} type="button" className="td-work-academy-media-card" onClick={() => openDetail(item, 'tutorial')}>
                  <span className="td-work-academy-media">
                    <img src={item.cover} alt="" />
                    <em>{item.duration}</em>
                  </span>
                  <strong>{item.title}</strong>
                  <small>通答老师<span>{item.feature}</span></small>
                </button>
              ))}
            </div>
          ) : (
            <div className="td-work-academy-empty">该分类内容正在更新</div>
          )}
          {matchingTips.length > 6 && (
            <button type="button" className="td-work-academy-expand" onClick={() => setShowMoreTips((value) => !value)}>
              {showMoreTips ? '收起' : '展开更多'}
              <DownOutlined className={showMoreTips ? 'is-open' : ''} />
            </button>
          )}
        </section>

        <footer className="td-work-academy-footer">© 2026 通答 · 通答学院 —— 让好课被更多人用到</footer>
          </>
        )}
      </div>
    </section>
  );
}

function SkillHubTabs({ activeView, onChange }) {
  return (
    <div className="td-work-skill-tabs" role="tablist" aria-label="智能体技能连接器栏目">
      {SKILL_HUB_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={activeView === tab.key ? 'is-active' : ''}
          role="tab"
          aria-selected={activeView === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SkillsConnectorsPage({
  activeCategory,
  searchText,
  connectors,
  onCategoryChange,
  onAddConnector,
}) {
  return (
    <section className="td-work-skill-page" aria-label="技能连接器">
      <div className="td-work-category-row" aria-label="连接器分类">
        {SKILL_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`td-work-category-chip ${activeCategory === category ? 'is-active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="td-work-special-title">特别推荐</div>

      <div className="td-work-connector-grid" aria-label="连接器列表">
        {connectors.map((item) => (
          <article key={item.key} className="td-work-connector-card">
            <ConnectorLogo item={item} />
            <div className="td-work-connector-copy">
              <div className="td-work-connector-name-row">
                <strong>{item.name}</strong>
                <span>连接器</span>
              </div>
              <p>{item.desc}</p>
            </div>
            <button
              type="button"
              className="td-work-connector-add"
              title={`添加${item.name}`}
              aria-label={`添加${item.name}`}
              onClick={() => onAddConnector(item)}
            >
              <PlusOutlined />
            </button>
          </article>
        ))}
      </div>

      {connectors.length === 0 ? (
        <div className="td-work-connector-empty">
          没有找到与“{searchText}”匹配的连接器
        </div>
      ) : null}
    </section>
  );
}

function SkillCataloguePage({
  searchText,
  skills,
  onOpenSkill,
}) {
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleItems = skills.filter((item) => (
    !normalizedSearch || `${item.name} ${item.desc} ${item.key}`.toLowerCase().includes(normalizedSearch)
  ));

  return (
    <section className="td-work-skill-page" aria-label="技能">
      <div className="td-work-special-title">推荐技能</div>

      <div className="td-work-connector-grid td-work-skill-catalog-grid" aria-label="技能列表">
        {visibleItems.map((item) => (
          <article key={item.key} className="td-work-connector-card">
            <ConnectorLogo item={item} />
            <div className="td-work-connector-copy">
              <div className="td-work-connector-name-row">
                <strong>{item.name}</strong>
                <span>技能</span>
              </div>
              <p>{item.desc}</p>
            </div>
            <button
              type="button"
              className="td-work-connector-add"
              title={`添加${item.name}`}
              aria-label={`添加${item.name}`}
              onClick={() => onOpenSkill(item)}
            >
              <PlusOutlined />
            </button>
          </article>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="td-work-connector-empty">
          没有找到与“{searchText}”匹配的技能
        </div>
      ) : null}
    </section>
  );
}

function PartnerMarketAvatar({ item, index }) {
  const avatar = PARTNER_MARKET_AVATARS[index % PARTNER_MARKET_AVATARS.length];
  return (
    <span
      className={`td-work-partner-market-avatar is-${item.tone} is-${avatar.style}`}
      style={{
        '--avatar-bg': avatar.bg,
        '--avatar-skin': avatar.skin,
        '--avatar-hair': avatar.hair,
        '--avatar-shirt': avatar.shirt,
      }}
      aria-hidden="true"
    >
      <i className="td-work-avatar-neck" />
      <i className="td-work-avatar-shirt" />
      <i className="td-work-avatar-hair" />
      <i className="td-work-avatar-face" />
    </span>
  );
}

function PartnerMarketPage({
  activeCategory,
  searchText,
  onCategoryChange,
  onAddPartner,
}) {
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleItems = PARTNER_MARKET_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
    const matchesSearch = !normalizedSearch
      || `${item.name} ${item.desc} ${item.category} ${item.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="td-work-partner-market-page" aria-label="智能体小队">
      <div className="td-work-partner-market-categories" aria-label="智能体分类">
        {PARTNER_MARKET_CATEGORIES.map((category) => (
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

      <div className="td-work-partner-market-grid" aria-label="智能体列表">
        {visibleItems.map((item, index) => (
          <article key={item.key} className={`td-work-partner-market-card ${index === 0 ? 'is-featured' : ''}`}>
            <PartnerMarketAvatar item={item} index={index} />
            <div className="td-work-partner-market-copy">
              <strong>{item.name}</strong>
              <p>{item.desc}</p>
              <div className="td-work-partner-market-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="td-work-partner-market-add"
              title={`添加${item.name}`}
              aria-label={`添加${item.name}`}
              onClick={() => onAddPartner(item)}
            >
              {item.key === 'growth-planner' ? <MessageOutlined /> : <PlusOutlined />}
            </button>
          </article>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="td-work-connector-empty">
          没有找到与“{searchText}”匹配的智能体
        </div>
      ) : null}
    </section>
  );
}

function SkillLogo({ item }) {
  return (
    <span className={`td-work-my-skill-logo td-work-connector-logo-${item.tone}`} aria-hidden="true">
      {item.logo}
    </span>
  );
}

function MySkillsPage({
  activeTab,
  searchText,
  skills,
  connectors,
  enabledSkillKeys,
  onTabChange,
  onOpenSkill,
  onToggleSkill,
}) {
  const source = activeTab === 'connectors' ? connectors : skills;
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleItems = source.filter((item) => (
    !normalizedSearch || `${item.name} ${item.desc} ${item.key}`.toLowerCase().includes(normalizedSearch)
  ));

  return (
    <section className="td-work-my-skills-page" aria-label="我的技能">
      <div className="td-work-my-skill-pills" role="tablist" aria-label="我的技能分类">
        {MY_SKILL_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'is-active' : ''}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            <span>{tab.key === 'skills' ? skills.length : connectors.length}</span>
          </button>
        ))}
      </div>

      <div className="td-work-my-skill-section-title">通达推荐</div>

      <div className="td-work-my-skill-grid" aria-label={activeTab === 'skills' ? '技能列表' : '连接器列表'}>
        {visibleItems.map((item) => {
          const enabled = enabledSkillKeys.has(item.key);
          return (
            <article key={item.key} className="td-work-my-skill-card">
              <button
                type="button"
                className="td-work-my-skill-open"
                onClick={() => onOpenSkill(item)}
                title={`打开${item.name}`}
                aria-label={`打开${item.name}`}
              >
                <SkillLogo item={item} />
                <span className="td-work-my-skill-copy">
                  <strong>{item.name}</strong>
                  <em>{item.desc}</em>
                </span>
              </button>
              <button
                type="button"
                className={`td-work-my-skill-switch ${enabled ? 'is-on' : ''}`}
                role="switch"
                aria-checked={enabled}
                aria-label={`${enabled ? '关闭' : '开启'}${item.name}`}
                onClick={() => onToggleSkill(item)}
              >
                <span />
              </button>
            </article>
          );
        })}
      </div>

      {visibleItems.length === 0 ? (
        <div className="td-work-connector-empty">
          没有找到与“{searchText}”匹配的内容
        </div>
      ) : null}
    </section>
  );
}

function SkillCreateMenu({
  open,
  menuRef,
  onToggle,
  onChatCreate,
  onUpload,
  onCustomConnector,
}) {
  return (
    <div className="td-work-skill-new-wrap" ref={menuRef}>
      <button
        type="button"
        className={`td-work-skill-new-btn ${open ? 'is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onToggle((value) => !value)}
      >
        <PlusOutlined />
        新建
      </button>

      {open ? (
        <div className="td-work-skill-create-menu" role="menu" aria-label="新建菜单">
          <button type="button" role="menuitem" onClick={onChatCreate}>
            <MessageOutlined />
            <span>与通达对话新建技能</span>
          </button>
          <button type="button" role="menuitem" onClick={onUpload}>
            <UploadOutlined />
            <span>上传技能</span>
          </button>
          <span className="td-work-skill-create-divider" />
          <button type="button" role="menuitem" onClick={onCustomConnector}>
            <LinkOutlined />
            <span>新建自定义连接器</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CustomConnectorModal({
  form,
  canSave,
  onChange,
  onAddHeader,
  onUpdateHeader,
  onRemoveHeader,
  onCancel,
  onSave,
}) {
  return (
    <div
      className="td-work-custom-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="td-work-custom-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="td-work-custom-connector-title"
      >
        <button
          type="button"
          className="td-work-custom-modal-close"
          title="关闭"
          aria-label="关闭"
          onClick={onCancel}
        >
          <CloseOutlined />
        </button>

        <header className="td-work-custom-modal-head">
          <h2 id="td-work-custom-connector-title">新建自定义连接器</h2>
          <p>自定义连接器仅支持在本地电脑中使用</p>
        </header>

        <div className="td-work-custom-form">
          <label className="td-work-custom-field">
            <span>
              服务器名称
              <sup>*</sup>
            </span>
            <input
              value={form.name}
              placeholder="请输入"
              autoFocus
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </label>

          <label className="td-work-custom-field">
            <span>传输类型</span>
            <span className="td-work-custom-select">
              <select
                value={form.transport}
                onChange={(event) => onChange({ transport: event.target.value })}
              >
                <option>HTTP</option>
                <option>SSE</option>
                <option>STDIO</option>
              </select>
              <DownOutlined />
            </span>
          </label>

          <label className="td-work-custom-field td-work-custom-field-full">
            <span>
              服务器 URL
              <sup>*</sup>
            </span>
            <input
              value={form.url}
              placeholder="https://mcp.example.com/mcp"
              onChange={(event) => onChange({ url: event.target.value })}
            />
          </label>

          <div className="td-work-custom-field td-work-custom-field-full">
            <span>自定义 Headers</span>
            {form.headers.length ? (
              <div className="td-work-custom-headers">
                {form.headers.map((header, index) => (
                  <div key={header.id} className="td-work-custom-header-row">
                    <input
                      value={header.key}
                      placeholder="Header Key"
                      onChange={(event) => onUpdateHeader(index, { key: event.target.value })}
                    />
                    <input
                      value={header.value}
                      placeholder="Header Value"
                      onChange={(event) => onUpdateHeader(index, { value: event.target.value })}
                    />
                    <button
                      type="button"
                      title="删除 Header"
                      aria-label="删除 Header"
                      onClick={() => onRemoveHeader(index)}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button type="button" className="td-work-custom-add-header" onClick={onAddHeader}>
              <PlusOutlined />
              添加
            </button>
          </div>
        </div>

        <footer className="td-work-custom-modal-foot">
          <button type="button" className="td-work-custom-cancel" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="td-work-custom-save"
            disabled={!canSave}
            onClick={onSave}
          >
            保存
          </button>
        </footer>
      </section>
    </div>
  );
}

function PartnerAvatar({ avatar, tone }) {
  return (
    <span className={`td-work-partner-avatar td-work-partner-avatar-${tone}`} aria-hidden="true">
      <span>{avatar === 'squad' ? <RobotOutlined /> : avatar === 'guide' ? <UserOutlined /> : avatar === 'mentor' ? '学' : avatar === 'designer' ? '演' : avatar === 'forest' ? '1' : '张'}</span>
    </span>
  );
}

function PartnerCardMoreMenu({ item, onOpen, onDelete }) {
  const isTeam = item.tag === '小队';
  const menuItems = [
    { key: 'view', label: isTeam ? '查看小队' : '查看详情' },
    { key: 'delete', label: '删除', danger: true },
  ];

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="td-work-partner-more-dropdown"
      menu={{
        items: menuItems,
        onClick: ({ key, domEvent }) => {
          domEvent?.stopPropagation();
          if (key === 'view') {
            onOpen(item);
            return;
          }
          onDelete(item);
        },
      }}
    >
      <button
        type="button"
        className="td-work-partner-message-btn td-work-partner-more-btn"
        title="更多操作"
        aria-label={`${item.name}更多操作`}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreOutlined />
      </button>
    </Dropdown>
  );
}

function PartnerDialogPage({ cards, onOpenPartner, onOpenPartnerMore, onDeletePartner, onCreatePartner }) {
  return (
    <section className="td-work-partner-page" aria-label="智能体对话">
      <div className="td-work-partner-content">
        <div className="td-work-partner-section-head">
          <div className="td-work-partner-page-title">智能体 · 小队</div>
          <div className="td-work-partner-page-actions">
            <button type="button" onClick={() => onCreatePartner('创建智能体')}>
              <PlusOutlined />
              创建
            </button>
            <span />
            <button type="button" onClick={() => onCreatePartner('全部智能体')}>
              全部
              <span>›</span>
            </button>
          </div>
        </div>

        <div className="td-work-partner-grid" aria-label="智能体小队">
          {cards.map((item) => (
            <article
              key={item.key}
              className="td-work-partner-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenPartner(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenPartner(item);
                }
              }}
            >
              <header className="td-work-partner-card-head">
                <div className="td-work-partner-card-profile">
                  <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                  <strong>{item.name}</strong>
                </div>
                <span className="td-work-partner-card-actions">
                  <PartnerCardMoreMenu item={item} onOpen={onOpenPartnerMore} onDelete={onDeletePartner} />
                  <button
                    type="button"
                    className="td-work-partner-message-btn"
                    title={`打开${item.name}对话`}
                    aria-label={`打开${item.name}对话`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenPartner(item);
                    }}
                  >
                    <MessageOutlined />
                  </button>
                </span>
              </header>

              <p>{item.desc}</p>

              <footer className="td-work-partner-card-foot">
                <span>
                  <MessageOutlined />
                  {item.chats}
                </span>
                <span>
                  <TeamOutlined />
                  {item.members}
                </span>
                {item.tag ? <em>{item.tag}</em> : null}
              </footer>
            </article>
          ))}
        </div>

        <section className="td-work-recent-dialogs" aria-label="最近对话">
          <div className="td-work-recent-head">
            <h2>最近</h2>
            <button type="button" onClick={() => onCreatePartner('全部最近对话')}>
              全部
              <span>›</span>
            </button>
          </div>

          <div className="td-work-recent-list">
            {RECENT_DIALOGS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="td-work-recent-row"
                onClick={() => onOpenPartner(item)}
              >
                <span className="td-work-recent-title">
                  <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                  <strong>{item.title}</strong>
                </span>
                <time>{item.time}</time>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PartnerManagePage({
  activeTab,
  searchText,
  partners,
  teams,
  onTabChange,
  onSearchChange,
  onCreate,
  onCreateTask,
  onCreateAutomation,
  onOpenPartner,
  onOpenPartnerMore,
  onDeletePartner,
  onOpenTask,
}) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef(null);
  const tabs = [
    { key: 'agents', label: '智能体', count: partners.length },
    { key: 'teams', label: '小队', count: teams.length },
    { key: 'tasks', label: '任务', count: PARTNER_MANAGE_TASKS.length },
    { key: 'automation', label: '自动化', count: PARTNER_MANAGE_AUTOMATIONS.length },
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const createLabel = {
    agents: '创建智能体',
    teams: '创建工作小队',
    tasks: '创建任务',
    automation: '创建自动化',
  }[activeTab];
  const matchesSearch = (item) => !normalizedSearch
    || `${item.name || item.title} ${item.desc || ''} ${item.owner || ''} ${item.tag || ''}`.toLowerCase().includes(normalizedSearch);
  const visibleAgents = partners.filter(matchesSearch);
  const visibleTeams = teams.filter(matchesSearch);
  const visibleTasks = PARTNER_MANAGE_TASKS.filter(matchesSearch);
  const visibleAutomations = PARTNER_MANAGE_AUTOMATIONS.filter(matchesSearch);
  const emptyLabel = activeTab === 'automation' ? '暂无自动化' : '没有找到相关内容';
  const searchPlaceholder = activeTab === 'tasks' ? '搜索名称' : '搜索';

  useEffect(() => {
    if (!createMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!createMenuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [createMenuOpen]);

  return (
    <section className="td-work-partner-manage-page" aria-label="智能体管理">
      <div className="td-work-partner-manage-inner">
        <div className="td-work-partner-manage-toolbar">
          <div className="td-work-partner-manage-tabs" role="tablist" aria-label="管理分类">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? 'is-active' : ''}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => {
                  setCreateMenuOpen(false);
                  onTabChange(tab.key);
                }}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="td-work-partner-manage-actions">
            <button type="button" className="td-work-partner-manage-filter" title="筛选" aria-label="筛选">
              <FilterOutlined />
            </button>
            <label className="td-work-partner-manage-search" htmlFor="td-work-partner-manage-search">
              <SearchOutlined />
              <input
                id="td-work-partner-manage-search"
                value={searchText}
                placeholder={searchPlaceholder}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
            <div className="td-work-partner-manage-create-wrap" ref={createMenuRef}>
              <button
                type="button"
                className={`td-work-partner-manage-create ${createMenuOpen ? 'is-open' : ''}`}
                onClick={() => {
                  if (activeTab === 'tasks') {
                    onCreateTask();
                    return;
                  }
                  if (activeTab === 'automation') {
                    setCreateMenuOpen((current) => !current);
                    return;
                  }
                  onCreate(createLabel);
                }}
              >
                <PlusOutlined />
                {createLabel}
                {activeTab === 'tasks' || activeTab === 'automation' ? null : <DownOutlined />}
              </button>
              {activeTab === 'automation' && createMenuOpen ? (
                <div className="td-work-partner-manage-create-menu" role="menu" aria-label="创建自动化">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      onCreateAutomation('chat');
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
                      onCreateAutomation('manual');
                    }}
                  >
                    <PlusOutlined />
                    手动创建
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {activeTab === 'agents' ? (
          <div className="td-work-partner-manage-grid" aria-label="智能体列表">
            {visibleAgents.map((item, index) => (
              <article
                key={item.key}
                className={`td-work-partner-card td-work-partner-manage-card ${index === 1 ? 'is-selected' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onOpenPartner(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenPartner(item);
                  }
                }}
              >
                <header className="td-work-partner-card-head">
                  <div className="td-work-partner-card-profile">
                    <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                    <strong>{item.name}</strong>
                  </div>
                  <span className="td-work-partner-card-actions td-work-partner-manage-card-actions">
                    <PartnerCardMoreMenu item={item} onOpen={onOpenPartnerMore} onDelete={onDeletePartner} />
                    <button
                      type="button"
                      className="td-work-partner-message-btn"
                      title={`打开${item.name}对话`}
                      aria-label={`打开${item.name}对话`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenPartner(item);
                      }}
                    >
                      <MessageOutlined />
                    </button>
                  </span>
                </header>

                <p>{item.desc}</p>

                <footer className="td-work-partner-card-foot">
                  <span>
                    <MessageOutlined />
                    {item.chats}
                  </span>
                  <span>
                    <TeamOutlined />
                    {item.members}
                  </span>
                  {item.tag ? <em>{item.tag}</em> : null}
                </footer>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'teams' ? (
          <div className="td-work-partner-manage-grid" aria-label="小队列表">
            {visibleTeams.map((item) => (
              <article
                key={item.key}
                className="td-work-partner-card td-work-partner-manage-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenPartner(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenPartner(item);
                  }
                }}
              >
                <header className="td-work-partner-card-head">
                  <div className="td-work-partner-card-profile">
                    <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                    <strong>{item.name}</strong>
                  </div>
                  <span className="td-work-partner-card-actions td-work-partner-manage-card-actions">
                    <PartnerCardMoreMenu item={item} onOpen={onOpenPartnerMore} onDelete={onDeletePartner} />
                    <button
                      type="button"
                      className="td-work-partner-message-btn"
                      title={`打开${item.name}`}
                      aria-label={`打开${item.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenPartner(item);
                      }}
                    >
                      <MessageOutlined />
                    </button>
                  </span>
                </header>
                <p>{item.desc}</p>
                <footer className="td-work-partner-card-foot">
                  <span>
                    <RobotOutlined />
                    {item.members} 名成员
                  </span>
                  <em>{item.tag}</em>
                </footer>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'tasks' ? (
          <section className="td-work-partner-manage-task-table" aria-label="任务列表">
            <header className="td-work-partner-manage-task-head">
              <span>任务名称</span>
              <span>更新时间</span>
              <span>操作</span>
            </header>
            <div className="td-work-partner-manage-task-rows">
              {visibleTasks.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="td-work-partner-manage-task-row"
                  onClick={() => onOpenTask(item)}
                >
                  <span className="td-work-partner-manage-task-name">
                    <PartnerAvatar avatar={item.avatar} tone={item.avatarTone} />
                    <strong>{item.title}</strong>
                  </span>
                  <time>{item.time}</time>
                  <span className="td-work-partner-manage-task-more" title="更多操作" aria-label="更多操作">
                    <MoreOutlined />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === 'automation' && visibleAutomations.length === 0)
          || (activeTab === 'agents' && visibleAgents.length === 0)
          || (activeTab === 'teams' && visibleTeams.length === 0)
          || (activeTab === 'tasks' && visibleTasks.length === 0) ? (
            <div className="td-work-partner-manage-empty">
              {activeTab === 'automation' ? <FileTextOutlined /> : <RobotOutlined />}
              <strong>{emptyLabel}</strong>
              {activeTab === 'automation' ? null : <p>可以从右上角新建，或调整搜索条件后再查看。</p>}
            </div>
          ) : null}
      </div>
    </section>
  );
}

const PARTNER_SQUAD_MEMBERS = {
  'training-squad': [
    {
      key: 'training-research-planner',
      name: '教研员',
      desc: '针对组织培训需求完成项目策划、目标设计与实施方案。',
      avatar: 'mentor',
      tone: 'sage',
      leader: true,
    },
    {
      key: 'training-admin-operator',
      name: '教务',
      desc: '根据策划内容完成平台项目配置、报名组织与执行跟进。',
      avatar: 'guide',
      tone: 'sky',
    },
    {
      key: 'hr-training-assistant',
      name: '培训项目助手',
      desc: '跟进培训通知、签到、作业、资料与证书发放等协作事项。',
      avatar: 'designer',
      tone: 'orange',
    },
  ],
};

function getSquadMembers(squad) {
  return PARTNER_SQUAD_MEMBERS[squad.key] || [
    {
      key: `${squad.key}-planner`,
      name: '任务规划员',
      desc: '拆解任务目标，明确协作流程与阶段产出。',
      avatar: 'mentor',
      tone: 'purple',
      leader: true,
    },
    {
      key: `${squad.key}-operator`,
      name: '执行协同员',
      desc: '承接执行动作，跟进节点、资料和结果整理。',
      avatar: 'guide',
      tone: 'sky',
    },
    {
      key: `${squad.key}-reviewer`,
      name: '质量复核员',
      desc: '检查交付质量，补充风险提示与优化建议。',
      avatar: 'forest',
      tone: 'sage',
    },
  ];
}

function PartnerSquadDetailPage({ squad, onBack, onAddPartner, onCreateTask }) {
  const [activeTab, setActiveTab] = useState('members');
  const members = useMemo(() => getSquadMembers(squad), [squad]);

  return (
    <section className="td-work-squad-detail-page" aria-label={`${squad.name}详情`}>
      <header className="td-work-squad-detail-head">
        <div className="td-work-squad-detail-titlebar">
          <PartnerAvatar avatar={squad.avatar} tone={squad.tone} />
          <div>
            <h1>
              {squad.name}
              <span>
                <TeamOutlined />
                {members.length}
              </span>
            </h1>
            <p>{squad.desc}</p>
          </div>
        </div>

        <div className="td-work-squad-detail-actions">
          <button type="button" onClick={onAddPartner}>
            <UserOutlined />
            添加智能体
          </button>
          <button type="button" onClick={onCreateTask}>
            <PlusOutlined />
            新任务
          </button>
        </div>
      </header>

      <nav className="td-work-squad-detail-tabs" aria-label="小队详情">
        <button
          type="button"
          className={activeTab === 'members' ? 'is-active' : ''}
          onClick={() => setActiveTab('members')}
        >
          小队成员
        </button>
        <button
          type="button"
          className={activeTab === 'guide' ? 'is-active' : ''}
          onClick={() => setActiveTab('guide')}
        >
          协作指引
        </button>
      </nav>

      {activeTab === 'members' ? (
        <div className="td-work-squad-canvas">
          <div className="td-work-squad-flow" aria-label="小队成员协作流">
            {members.map((member, index) => (
              <div key={member.key} className="td-work-squad-flow-item">
                <article className={`td-work-squad-member-node ${member.leader ? 'is-leader' : ''}`}>
                  <PartnerAvatar avatar={member.avatar} tone={member.tone} />
                  <div className="td-work-squad-member-copy">
                    <div className="td-work-squad-member-title">
                      <strong>{member.name}</strong>
                      {member.leader ? <CheckCircleOutlined /> : null}
                    </div>
                    <p>{member.desc}</p>
                  </div>
                  <button type="button" title="成员操作" aria-label={`${member.name}操作`}>
                    <MoreOutlined />
                  </button>
                </article>
                {index < members.length - 1 ? <span className="td-work-squad-connector" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>

          <div className="td-work-squad-zoom" aria-label="画布缩放">
            <button type="button" aria-label="缩小">−</button>
            <span>100%</span>
            <button type="button" aria-label="放大">+</button>
          </div>
        </div>
      ) : (
        <div className="td-work-squad-canvas td-work-squad-guide-canvas">
          <section className="td-work-squad-guide-panel">
            <h2>协作指引</h2>
            <p>
              教研员先明确培训目标、对象与实施路径，教务依据策划内容完成平台配置、通知组织与过程跟进，
              小队成员共同沉淀资料、记录问题并汇总交付结果。
            </p>
            <button type="button" onClick={onBack}>
              返回智能体对话
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

function PartnerWorkspacePage({
  partner,
  partners,
  teams,
  activeTab,
  searchText,
  prompt,
  pickerOpen,
  onTabChange,
  onSearchChange,
  onPromptChange,
  onPickerOpenChange,
  onSelectPartner,
  onCreatePartner,
  onSend,
  onOpenDetail,
  onOpenRecord,
}) {
  const pickerRef = useRef(null);
  const items = PARTNER_WORK_ITEMS[activeTab] || [];
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleItems = items.filter((item) => (
    !normalizedSearch || `${item.title} ${item.time}`.toLowerCase().includes(normalizedSearch)
  ));

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        onPickerOpenChange(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onPickerOpenChange, pickerOpen]);

  return (
    <section className="td-work-partner-workspace" aria-label={`${partner.name}工作页`}>
      <div className="td-work-partner-workspace-inner">
        <div className="td-work-partner-hero-row">
          <div className="td-work-partner-picker" ref={pickerRef}>
            <button
              type="button"
              className={`td-work-partner-identity ${pickerOpen ? 'is-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
              onClick={() => onPickerOpenChange(!pickerOpen)}
            >
              <PartnerAvatar avatar={partner.avatar} tone={partner.tone} />
              <strong>{partner.name}</strong>
              <DownOutlined />
            </button>

            {pickerOpen ? (
              <div className="td-work-partner-switch-menu" role="menu" aria-label="切换智能体">
                <header className="td-work-partner-switch-head">
                  <span>智能体</span>
                  <button type="button" title="创建智能体" aria-label="创建智能体" onClick={() => onCreatePartner('创建智能体')}>
                    <PlusOutlined />
                  </button>
                </header>

                <div className="td-work-partner-switch-list">
                  {partners.map((item) => {
                    const active = item.key === partner.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`td-work-partner-switch-row ${active ? 'is-active' : ''}`}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => onSelectPartner(item)}
                      >
                        <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                        <strong>{item.name}</strong>
                        {item.tag === '专属' ? <em>专属</em> : null}
                        {active ? <CheckOutlined /> : null}
                      </button>
                    );
                  })}
                </div>

                <header className="td-work-partner-switch-head is-team">
                  <span>
                    工作小队
                    <InfoCircleOutlined />
                  </span>
                  <button type="button" title="创建工作小队" aria-label="创建工作小队" onClick={() => onCreatePartner('创建工作小队')}>
                    <PlusOutlined />
                  </button>
                </header>

                <div className="td-work-partner-switch-list">
                  {teams.map((item) => {
                    const active = item.key === partner.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`td-work-partner-switch-row ${active ? 'is-active' : ''}`}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => onSelectPartner(item)}
                      >
                        <PartnerAvatar avatar={item.avatar} tone={item.tone} />
                        <strong>
                          {item.name}
                          {item.members ? `（${item.members}）` : ''}
                        </strong>
                        {active ? <CheckOutlined /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <button type="button" className="td-work-partner-detail-link" onClick={onOpenDetail}>
            智能体详情
            <span>›</span>
          </button>
        </div>

        <section className="td-work-partner-goal-box" aria-label="输入智能体任务">
          <textarea
            value={prompt}
            rows={2}
            placeholder="输入你的任务或目标"
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
          />
          <div className="td-work-partner-goal-actions">
            <button type="button" className="td-work-partner-goal-add" title="添加附件" aria-label="添加附件">
              <PlusOutlined />
            </button>
            <span>
              <button type="button" className="td-work-partner-goal-icon" title="语音输入" aria-label="语音输入">
                <AudioOutlined />
              </button>
              <button
                type="button"
                className={`td-work-partner-goal-send ${prompt.trim() ? 'is-ready' : ''}`}
                title="发送"
                aria-label="发送"
                onClick={onSend}
              >
                <ArrowUpOutlined />
              </button>
            </span>
          </div>
        </section>

        <section className="td-work-partner-work-list" aria-label="智能体工作记录">
          <header className="td-work-partner-work-head">
            <div className="td-work-partner-work-tabs" role="tablist" aria-label="工作记录分类">
              {PARTNER_WORK_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeTab === tab.key ? 'is-active' : ''}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => onTabChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="td-work-partner-work-tools">
              <button type="button" className="td-work-partner-filter" title="筛选" aria-label="筛选">
                <FilterOutlined />
              </button>
              <label className="td-work-partner-search" htmlFor="td-work-partner-work-search">
                <SearchOutlined />
                <input
                  id="td-work-partner-work-search"
                  value={searchText}
                  placeholder="搜索"
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </label>
            </div>
          </header>

          <div className="td-work-partner-work-rows">
            {visibleItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="td-work-partner-work-row"
                onClick={() => onOpenRecord(item)}
              >
                <strong>{item.title}</strong>
                <time>{item.time}</time>
              </button>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div className="td-work-partner-work-empty">没有找到相关记录</div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function PartnerDetailPage({
  partner,
  activeTab,
  onTabChange,
  onGoChat,
  onAddGroup,
  onAddKnowledge,
  onOpenSkill,
}) {
  const isTeam = partner.tag === '小队';
  const stats = isTeam
    ? { days: 24, tasks: partner.members || 3 }
    : { days: 16, tasks: partner.chats || 0 };
  const roleText = isTeam
    ? `你是${partner.name}，负责统筹教师培训、教研协同、任务推进与成果沉淀，帮助团队成员更高效地完成共同目标。`
    : `你是${partner.name}，负责回应教师在工作学习中的疑问，协助梳理教学、研修、评价与资料整理相关问题，提供合理的参考建议。`;

  return (
    <section className="td-work-partner-detail-page" aria-label={`${partner.name}详情`}>
      <div className="td-work-partner-detail-inner">
        <aside className="td-work-partner-detail-side">
          <PartnerAvatar avatar={partner.avatar} tone={partner.tone} />
          <h1>
            {partner.name}
            <span>{isTeam ? '团队' : '智能体'}</span>
          </h1>
          <p>{partner.desc}</p>

          <div className="td-work-partner-detail-stats" aria-label="智能体统计">
            <span>
              <strong>{stats.days}</strong>
              <em>陪伴天数</em>
            </span>
            <span>
              <strong>{stats.tasks}</strong>
              <em>任务数</em>
            </span>
          </div>

          <div className="td-work-partner-detail-actions">
            <button type="button" onClick={onGoChat}>
              <MessageOutlined />
              去飞书对话
            </button>
            <button type="button" onClick={onAddGroup}>
              <TeamOutlined />
              添加到群组
            </button>
          </div>

          <section className="td-work-partner-group-box" aria-label="已加入的飞书群组">
            <h2>已加入的飞书群组</h2>
            <p>以下群组的上下文默认可被智能体解读使用</p>
            <div className="td-work-partner-group-empty">
              <FileTextOutlined />
              <span>暂未加入飞书群组</span>
            </div>
          </section>
        </aside>

        <section className="td-work-partner-detail-panel" aria-label="智能体资料">
          <div className="td-work-partner-detail-tabs" role="tablist" aria-label="详情分类">
            {PARTNER_DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? 'is-active' : ''}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' ? (
            <div className="td-work-partner-detail-profile-panel">
              <section className="td-work-partner-instruction">
                <header>
                  <h2>工作指令</h2>
                  <button type="button" title="展开工作指令" aria-label="展开工作指令">
                    <DownOutlined />
                  </button>
                </header>

                <h3>角色定位</h3>
                <p>{roleText}</p>

                <h3>工作职责</h3>
                <ol>
                  <li>疑问解答：针对教师提出的通用工作、培训学习和教研协作问题，给出清晰易懂的答复内容。</li>
                  <li>问题梳理：协助成员梳理模糊的工作困惑，整理出可落地的思考方向。</li>
                  <li>规划提示：成员咨询协作相关规则时，明确告知现有公开规则内容，无法判断时提示补充信息或走审批流程。</li>
                </ol>

                <h3>行为约束</h3>
                <p>禁止编造不存在的规则、信息或审批结论；信息不足时应说明无法判断，并提示用户补充材料或向管理员确认。</p>
              </section>

              <section className="td-work-partner-detail-section">
                <header>
                  <h2>技能</h2>
                  <span>
                    <button type="button" title="添加技能" aria-label="添加技能" onClick={() => onOpenSkill('添加技能')}>
                      <PlusOutlined />
                    </button>
                    <button type="button" title="整理技能" aria-label="整理技能" onClick={() => onOpenSkill('整理技能')}>
                      <MoreOutlined />
                    </button>
                    <button type="button" title="展开技能" aria-label="展开技能">
                      <DownOutlined />
                    </button>
                  </span>
                </header>
                <div className="td-work-partner-skill-tags">
                  {PARTNER_DETAIL_SKILLS.map((item) => (
                    <button key={item} type="button" onClick={() => onOpenSkill(item)}>
                      <CheckCircleOutlined />
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <section className="td-work-partner-detail-section">
                <header>
                  <h2>知识</h2>
                  <span>
                    <button type="button" title="添加知识" aria-label="添加知识" onClick={onAddKnowledge}>
                      <PlusOutlined />
                    </button>
                    <button type="button" title="整理知识" aria-label="整理知识" onClick={() => onOpenSkill('整理知识')}>
                      <MoreOutlined />
                    </button>
                    <button type="button" title="展开知识" aria-label="展开知识">
                      <DownOutlined />
                    </button>
                  </span>
                </header>
                <div className="td-work-partner-knowledge-empty">
                  <FileTextOutlined />
                  <p>添加企业知识，为智能体提供更丰富的上下文</p>
                  <button type="button" onClick={onAddKnowledge}>
                    <PlusOutlined />
                    添加知识
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="td-work-partner-detail-placeholder">
              <h2>{PARTNER_DETAIL_TABS.find((tab) => tab.key === activeTab)?.label}</h2>
              <p>
                {activeTab === 'skills'
                  ? '管理该智能体可调用的教学、教研、培训与资料处理技能。'
                  : activeTab === 'knowledge'
                    ? '为智能体添加校本制度、课程资源、培训资料和教研案例。'
                    : '配置智能体可见范围、群组权限和自动化运行规则。'}
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function ComposerSkillMenu({ selectedSkillKeys, onToggleSkill }) {
  const selectedSet = new Set(selectedSkillKeys);

  return (
    <div
      className="td-work-composer-skill-menu"
      role="listbox"
      aria-label="选择更多技能"
      aria-multiselectable="true"
    >
      {COMPOSER_SKILLS.map((item) => {
        const selected = selectedSet.has(item.key);

        return (
          <button
            key={item.key}
            type="button"
            className={`td-work-composer-skill-option is-${item.tone} ${selected ? 'is-selected' : ''}`}
            role="option"
            aria-selected={selected}
            onClick={() => onToggleSkill(item.key)}
          >
            <span className="td-work-composer-skill-icon" aria-hidden="true">{item.icon}</span>
            <span className="td-work-composer-skill-copy">
              <strong>{item.name}</strong>
              <em>{item.desc}</em>
            </span>
            <span className="td-work-composer-skill-shortcut">
              {selected ? <CheckOutlined /> : item.shortcut}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ComposerPromptArea({
  selectedSkills,
  prompt,
  placeholder,
  onPromptChange,
  onSend,
  onToggleSkill,
}) {
  const hasSelectedSkills = selectedSkills.length > 0;
  const handleSelectedSkillKeyDown = (event, key) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    event.preventDefault();
    onToggleSkill(key);
  };

  return (
    <div className={`td-work-composer-prompt-area ${hasSelectedSkills ? 'has-selected-skills' : ''}`}>
      {selectedSkills.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`td-work-composer-selected-skill is-${item.tone}`}
          title={`移除 ${item.name}`}
          onClick={() => onToggleSkill(item.key)}
          onKeyDown={(event) => handleSelectedSkillKeyDown(event, item.key)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}
      <textarea
        value={prompt}
        rows={1}
        placeholder={hasSelectedSkills ? '' : placeholder}
        aria-label={placeholder}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Backspace'
            && event.currentTarget.selectionStart === 0
            && event.currentTarget.selectionEnd === 0
            && selectedSkills.length > 0
          ) {
            event.preventDefault();
            onToggleSkill(selectedSkills[selectedSkills.length - 1].key);
            return;
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
    </div>
  );
}

function WorkTaskTargetMenu({ value, onChange }) {
  return (
    <div className="td-work-popover td-work-task-target-menu" role="menu" aria-label="工作任务菜单">
      {WORK_TASK_TARGETS.map((item) => {
        const selected = value === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={selected ? 'is-selected' : ''}
            role="menuitemradio"
            aria-checked={selected}
            onClick={() => onChange(item)}
          >
            <span className="td-work-task-target-icon" aria-hidden="true">{item.icon}</span>
            <span className="td-work-task-target-label">{item.label}</span>
            <span className={`td-work-task-target-dot is-${item.tone}`} aria-hidden="true" />
            <span className="td-work-task-target-place">{item.place}</span>
            <span className="td-work-task-target-check" aria-hidden="true">
              {selected ? <CheckOutlined /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SpaceMenu({ value, spaces, loading, onChange }) {
  return (
    <div className="td-work-composer-project-menu td-work-composer-space-menu" role="menu" aria-label="空间菜单">
      <div className="td-work-composer-space-head">
        <strong>选择空间</strong>
        <span>单选</span>
      </div>

      {loading ? (
        <div className="td-work-composer-space-empty">正在加载空间...</div>
      ) : spaces.length ? (
        spaces.map((scene) => {
          const selected = value === scene.id;

          return (
            <button
              key={scene.id}
              type="button"
              className={`td-work-composer-project-option td-work-composer-space-option ${selected ? 'is-selected' : ''}`}
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => onChange(scene)}
            >
              <span className="td-work-composer-project-icon" aria-hidden="true">
                <AppstoreOutlined />
              </span>
              <span className="td-work-composer-project-label td-work-composer-space-label">
                <span>{scene.name}</span>
                <em>
                  {scene.sceneGroupName || '默认空间'}
                  {scene.visibility ? ` · ${getSceneVisibilityLabel(scene.visibility)}` : ''}
                </em>
              </span>
              <span className="td-work-composer-project-shortcut td-work-composer-space-check">
                {selected ? <CheckOutlined /> : `${scene.topicCount || 0} 主题`}
              </span>
            </button>
          );
        })
      ) : (
        <div className="td-work-composer-space-empty">暂无可选择空间</div>
      )}
    </div>
  );
}

function ComposerAgentMenu({ value, agents, onChange }) {
  return (
    <div className="td-work-composer-project-menu td-work-composer-agent-menu" role="menu" aria-label="智能体菜单">
      <div className="td-work-composer-space-head td-work-composer-agent-head">
        <strong>选择智能体</strong>
        <span>单选</span>
      </div>

      {agents.length ? (
        agents.map((agent, index) => {
          const selected = value === agent.selectionKey;
          const isMarketAgent = agent.source === 'market';

          return (
            <button
              key={agent.selectionKey}
              type="button"
              className={`td-work-composer-agent-option ${selected ? 'is-selected' : ''}`}
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => onChange(agent)}
            >
              <span className="td-work-composer-agent-avatar" aria-hidden="true">
                {isMarketAgent ? (
                  <PartnerMarketAvatar item={agent} index={agent.marketIndex ?? index} />
                ) : (
                  <PartnerAvatar avatar={agent.avatar} tone={agent.tone} />
                )}
              </span>
              <span className="td-work-composer-agent-copy">
                <strong>{agent.name}</strong>
                <em>{agent.desc}</em>
              </span>
              <span className="td-work-composer-agent-meta">
                {selected ? <CheckOutlined /> : (agent.meta || agent.category || agent.tag)}
              </span>
            </button>
          );
        })
      ) : (
        <div className="td-work-composer-space-empty">暂无可选择智能体</div>
      )}
    </div>
  );
}

function ScheduledTasksPage({
  prompt,
  openPanel,
  activeMode,
  modeKey,
  taskTargetKey,
  selectedSpaceId,
  selectedSpace,
  selectedAgent,
  selectedAgentKey,
  agents,
  spaces,
  spacesLoading,
  selectedSkills,
  selectedSkillKeys,
  composerRef,
  onPromptChange,
  onSend,
  onSelectTemplate,
  onSelectTool,
  onOpenPanelChange,
  onModeChange,
  onTaskTargetChange,
  onSpaceChange,
  onAgentChange,
  onToggleSkill,
  onToast,
}) {
  return (
    <section className="td-work-schedule-page" aria-label="自动化">
      <div className="td-work-schedule-content">
        <div className="td-work-schedule-label">为你推荐</div>
        <div className="td-work-schedule-grid">
          {SCHEDULED_TASK_TEMPLATES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="td-work-schedule-card"
              onClick={() => onSelectTemplate(item)}
            >
              <span className="td-work-schedule-copy">
                <strong>{item.title}</strong>
                <em>{item.desc}</em>
              </span>
              <PlusOutlined />
            </button>
          ))}
        </div>
      </div>

      <section
        className={`td-work-composer-shell td-work-schedule-composer-shell ${openPanel === 'skills' ? 'is-skill-menu-open' : ''}`}
        aria-label="安排自动化"
        ref={composerRef}
      >
        <div className={`td-work-composer ${openPanel === 'skills' ? 'is-skill-menu-open' : ''}`}>
          {openPanel === 'skills' ? (
            <ComposerSkillMenu
              selectedSkillKeys={selectedSkillKeys}
              onToggleSkill={onToggleSkill}
            />
          ) : null}

          {openPanel === 'space' ? (
            <SpaceMenu
              value={selectedSpaceId}
              spaces={spaces}
              loading={spacesLoading}
              onChange={onSpaceChange}
            />
          ) : null}

          {openPanel === 'agent' ? (
            <ComposerAgentMenu
              value={selectedAgentKey}
              agents={agents}
              onChange={onAgentChange}
            />
          ) : null}

          <ComposerPromptArea
            selectedSkills={selectedSkills}
            prompt={prompt}
            placeholder="给通达安排自动化任务"
            onPromptChange={onPromptChange}
            onSend={onSend}
            onToggleSkill={onToggleSkill}
          />

          <div className="td-work-composer-row">
            <div className="td-work-tool-row">
              <button type="button" className="td-work-add-btn" title="添加附件" aria-label="添加附件">
                <PlusOutlined />
              </button>
              <span className="td-work-divider" />
              {CONTEXT_TOOLS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`td-work-tool-chip ${item.active ? 'is-active' : ''} ${openPanel === item.key ? 'is-open' : ''} ${item.key === 'space' && selectedSpace ? 'has-selected-space' : ''} ${item.key === 'agent' && selectedAgent ? 'has-selected-agent' : ''}`}
                  title={item.key === 'space' && selectedSpace ? selectedSpace.name : item.key === 'agent' && selectedAgent ? selectedAgent.name : item.label}
                  onClick={() => onSelectTool(item)}
                >
                  <span className={item.sparkle ? 'td-work-spark-icon' : ''}>{item.icon}</span>
                  <span className="td-work-tool-label">
                    {item.key === 'space' && selectedSpace
                      ? selectedSpace.name
                      : item.key === 'agent' && selectedAgent
                        ? selectedAgent.name
                        : item.label}
                  </span>
                  {item.key === 'task' || item.key === 'space' || item.key === 'agent' ? <DownOutlined /> : null}
                </button>
              ))}
            </div>

            <div className="td-work-submit-row">
              <button
                type="button"
                className="td-work-mode-btn"
                aria-haspopup="menu"
                aria-expanded={openPanel === 'mode'}
                onClick={() => onOpenPanelChange(openPanel === 'mode' ? null : 'mode')}
              >
                {activeMode.label}
                <DownOutlined />
              </button>
              <button type="button" className="td-work-voice-btn" title="语音输入" aria-label="语音输入">
                <AudioOutlined />
              </button>
              <button type="button" className="td-work-send-btn" title="发送" aria-label="发送" onClick={onSend}>
                <ArrowUpOutlined />
              </button>
            </div>
          </div>

          {openPanel === 'task' ? (
            <WorkTaskTargetMenu
              value={taskTargetKey}
              onChange={onTaskTargetChange}
            />
          ) : null}

          {openPanel && openPanel !== 'mode' && openPanel !== 'skills' && openPanel !== 'task' && openPanel !== 'space' && openPanel !== 'agent' ? (
            <div className="td-work-popover" role="menu">
              {(PANEL_CONTENT[openPanel] || []).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onPromptChange(`自动化提醒我处理：${label}`);
                    onOpenPanelChange(null);
                  }}
                >
                  <CheckOutlined />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {openPanel === 'mode' ? (
            <div className="td-work-popover td-work-mode-popover" role="menu">
              {MODE_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={modeKey === item.key ? 'is-selected' : ''}
                  onClick={() => {
                    onModeChange(item.key);
                    onOpenPanelChange(null);
                    onToast(`已切换为 ${item.label}`);
                  }}
                >
                  <RobotOutlined />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}

function ProjectListIllustration() {
  return (
    <div className="td-work-project-illustration" aria-hidden="true">
      <span className="td-work-project-illustration-line is-top" />
      <span className="td-work-project-illustration-line is-bottom" />
      <span className="td-work-project-person is-left">
        <UserOutlined />
        <i />
      </span>
      <span className="td-work-project-person is-mid">
        <RobotOutlined />
        <i />
      </span>
      <span className="td-work-project-person is-right">
        <FileTextOutlined />
        <i />
      </span>
      <span className="td-work-project-bubble is-one"><MessageOutlined /></span>
      <span className="td-work-project-bubble is-two"><FolderOutlined /></span>
      <span className="td-work-project-bubble is-three"><CheckCircleOutlined /></span>
    </div>
  );
}

function ProjectCardIcon() {
  return (
    <span className="td-work-project-card-icon" aria-hidden="true">
      <ProjectOutlined />
    </span>
  );
}

function ProjectListPage({ onOpenProject, onCreateProject, onTemplateCreate }) {
  return (
    <section className="td-work-project-list-page" aria-label="项目列表">
      <div className="td-work-project-list-inner">
        <div className="td-work-project-list-hero">
          <div className="td-work-project-list-copy">
            <h1>项目</h1>
            <p>多人协同，打造超级团队</p>
            <button type="button" className="td-work-project-new-btn" onClick={onCreateProject}>
              <PlusOutlined />
              新建项目
            </button>
          </div>
          <ProjectListIllustration />
        </div>

        <div className="td-work-project-section-head">
          <h2>我的项目</h2>
          <label className="td-work-project-search" htmlFor="td-work-project-search">
            <SearchOutlined />
            <input id="td-work-project-search" placeholder="搜索项目" />
          </label>
        </div>

        <div className="td-work-project-card-grid is-owned">
          {PROJECT_LIST_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="td-work-project-list-card"
              onClick={() => onOpenProject(item)}
            >
              <ProjectCardIcon />
              <span className="td-work-project-list-card-copy">
                <strong>{item.name}</strong>
                <em>{item.desc} · {item.updatedAt}</em>
              </span>
              <span className="td-work-project-card-more" aria-hidden="true">
                <MoreOutlined />
              </span>
            </button>
          ))}
        </div>

        <div className="td-work-project-section-head is-template">
          <h2>从模板创建</h2>
        </div>

        <div className="td-work-project-card-grid is-template">
          {PROJECT_TEMPLATES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="td-work-project-list-card"
              onClick={() => onTemplateCreate(item)}
            >
              <ProjectCardIcon />
              <span className="td-work-project-list-card-copy">
                <strong>{item.name}</strong>
                <em>{item.desc}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectDetailBody({ activeTab }) {
  if (activeTab === 'activity') {
    return (
      <article className="td-work-project-activity-card">
        <header>
          <span className="td-work-project-bot-avatar" aria-hidden="true">
            <RobotOutlined />
          </span>
          <div>
            <strong>通达项目助手</strong>
            <span>1 小时前</span>
          </div>
          <button type="button" title="更多" aria-label="更多">
            <MoreOutlined />
          </button>
        </header>
        <h2>欢迎来到「教师研修项目」——这里是团队和 AI 共同协作的工作台</h2>
        <p>来帮你认识项目空间的核心功能：</p>
        <p>
          <strong>资料与项目配置：</strong>
          团队资源、培训方案、课程进度与学员反馈都可以统一沉淀，成员共享使用。
        </p>
        <p>
          <strong>计划看板：</strong>
          分阶段管理研修安排、负责人和截止时间，把教研活动、作业提交、证书申报都排清楚。
        </p>
        <p>
          <strong>任务协同：</strong>
          面向教师培训、听评课和资料整理分配任务，跟进进度并自动沉淀过程记录。
        </p>
        <p>
          <strong>自动化：</strong>
          自动收集学习反馈、提醒作业提交、生成项目周报，让重复事项自动推进。
        </p>
        <footer>
          <span>项目已经创建，可以开始推进。</span>
          <button type="button">收起</button>
        </footer>
      </article>
    );
  }

  const tabContent = {
    plan: [
      ['研修启动会', '确认培训目标、讲师安排和参训名单'],
      ['课程学习阶段', '发布课程任务，跟踪学习进度与讨论反馈'],
      ['成果复盘阶段', '收集作业、案例与证书申报材料'],
    ],
    tasks: [
      ['整理参训教师名单', '负责人：教务老师 · 今天 18:00 前'],
      ['生成培训通知初稿', '负责人：研修规划师 · 明天上午'],
      ['汇总课后反馈问卷', '负责人：数据分析师 · 本周五'],
    ],
    assets: [
      ['培训实施方案.docx', '项目说明、流程安排和职责分工'],
      ['教师研修任务清单.xlsx', '签到、学习任务、作业和证书字段'],
      ['示范课案例包', '课堂实录、听评课记录和改进建议'],
    ],
  };

  const titleMap = {
    plan: '计划看板',
    tasks: '任务列表',
    assets: '项目资产',
  };

  return (
    <section className="td-work-project-tab-panel" aria-label={titleMap[activeTab]}>
      <h2>{titleMap[activeTab]}</h2>
      <div className="td-work-project-simple-list">
        {(tabContent[activeTab] || []).map(([title, desc]) => (
          <button key={title} type="button">
            <span><CheckCircleOutlined /></span>
            <strong>{title}</strong>
            <em>{desc}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProjectDetailComposer({ onSend }) {
  return (
    <section className="td-work-project-detail-composer" aria-label="项目对话输入">
      <textarea placeholder="今天帮你做些什么？@引用资产文件、项目待办或调用技能" />
      <div className="td-work-project-detail-composer-row">
        <button type="button" className="td-work-project-detail-plus" title="添加" aria-label="添加">
          <PlusOutlined />
        </button>
        <div className="td-work-project-detail-meta">
          <button type="button">
            本地任务
            <DownOutlined />
          </button>
          <button type="button">
            选择工作空间
            <DownOutlined />
          </button>
          <button type="button">
            默认权限
            <DownOutlined />
          </button>
        </div>
        <div className="td-work-project-detail-submit">
          <button type="button">
            Auto
            <DownOutlined />
          </button>
          <button type="button" title="语音输入" aria-label="语音输入">
            <AudioOutlined />
          </button>
          <button type="button" className="td-work-project-detail-send" title="发送" aria-label="发送" onClick={onSend}>
            <ArrowUpOutlined />
          </button>
        </div>
      </div>
    </section>
  );
}

function ProjectDetailPage({ project, onToast }) {
  const [activeTab, setActiveTab] = useState('activity');

  return (
    <section className="td-work-project-detail-page" aria-label={`${project.name}详情`}>
      <div className="td-work-project-detail-shell">
        <main className="td-work-project-detail-main">
          <div className="td-work-project-detail-tabs" role="tablist" aria-label="项目工作区">
            {PROJECT_WORK_TABS.map((tab) => (
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

          <div className="td-work-project-feed-actions">
            <button type="button" className="td-work-project-publish-btn" onClick={() => onToast('已进入发布留言')}>
              <PlusOutlined />
              发布留言
            </button>
            <span />
            <button type="button" className="is-active" onClick={() => onToast('已筛选与我相关')}>
              与我相关
            </button>
            <button type="button" onClick={() => onToast('已查看成员动态')}>
              成员动态
            </button>
          </div>

          <div className="td-work-project-feed">
            <ProjectDetailBody activeTab={activeTab} />
            <div className="td-work-project-feed-end">没有更多了</div>
          </div>

          <ProjectDetailComposer onSend={() => onToast('已发送到项目对话')} />
        </main>

        <aside className="td-work-project-config" aria-label="项目配置">
          <div className="td-work-project-config-head">
            <h2>项目配置</h2>
            <button type="button" title="收起配置" aria-label="收起配置" onClick={() => onToast('已收起项目配置')}>
              <SidebarToggleIcon />
            </button>
          </div>
          <div className="td-work-project-config-list">
            {PROJECT_CONFIG_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="td-work-project-config-card"
                onClick={() => onToast(`已进入项目配置：${item.title}`)}
              >
                <span className="td-work-project-config-icon" aria-hidden="true">{item.icon}</span>
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.desc}</em>
                </span>
                <PlusOutlined />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProjectsPage({ activeProject, onOpenProject, onCreateProject, onTemplateCreate, onToast }) {
  if (activeProject) {
    return <ProjectDetailPage project={activeProject} onToast={onToast} />;
  }

  return (
    <ProjectListPage
      onOpenProject={onOpenProject}
      onCreateProject={onCreateProject}
      onTemplateCreate={onTemplateCreate}
    />
  );
}

const SPACE_HOME_OWNERSHIP_TABS = Object.freeze([
  { key: 'created', label: '我创建的' },
  { key: 'joined', label: '我加入的' },
]);
const SPACE_PAGE_SIZE = 6;

const JOINED_SPACE_ID_SET = new Set([
  'scene_research_seed_1',
  'scene_training_seed_1',
  'scene_training_seed_2',
  'scene_community_seed_1',
]);
const UNGROUPED_SPACE_MENU_KEY = '__ungrouped_spaces__';

function resolveSpaceOwnershipTab(scene = {}) {
  const membershipType = String(scene.membershipType || '').trim().toUpperCase();
  if (membershipType === 'JOINED') return 'joined';
  if (membershipType === 'CREATED') return 'created';
  if (JOINED_SPACE_ID_SET.has(scene.id)) return 'joined';
  return 'created';
}

function getSpaceOwnershipTabLabel(tabKey = 'created') {
  return SPACE_HOME_OWNERSHIP_TABS.find((item) => item.key === tabKey)?.label || SPACE_HOME_OWNERSHIP_TABS[0].label;
}

function getSpaceObjectLabel(scene) {
  return scene?.sceneType === 'SUPERVISION' ? '项目' : '空间';
}

function getSpaceGroupObjectLabel(group) {
  const spaces = Array.isArray(group?.spaces) ? group.spaces : [];
  return spaces.length > 0 && spaces.every((scene) => scene?.sceneType === 'SUPERVISION') ? '项目' : '空间';
}

function getSpaceMenuKey(scene) {
  return scene?.menuKey || UNGROUPED_SPACE_MENU_KEY;
}

function flattenSpaceMenuGroups(menuGroups = []) {
  return menuGroups.flatMap((group) => (
    (Array.isArray(group?.children) ? group.children : [])
      .map((item) => ({
        key: item?.key,
        name: item?.label || item?.key,
        groupLabel: group?.label || '',
      }))
      .filter((item) => item.key)
  ));
}

function buildSpaceMenuNavigationGroups(menuGroups = [], scenes = []) {
  const scenesByMenuKey = new Map();
  scenes.forEach((scene) => {
    const menuKey = getSpaceMenuKey(scene);
    const current = scenesByMenuKey.get(menuKey) || [];
    current.push(scene);
    scenesByMenuKey.set(menuKey, current);
  });

  const configuredMenuItems = flattenSpaceMenuGroups(menuGroups);
  const seenMenuKeys = new Set();
  const navigationGroups = configuredMenuItems.map((item) => {
    seenMenuKeys.add(item.key);
    const spaces = scenesByMenuKey.get(item.key) || [];
    return {
      ...item,
      spaces,
      sceneCount: spaces.length,
    };
  });

  scenesByMenuKey.forEach((spaces, menuKey) => {
    if (seenMenuKeys.has(menuKey)) return;
    navigationGroups.push({
      key: menuKey,
      name: menuKey === UNGROUPED_SPACE_MENU_KEY ? '未归类空间' : sceneApi.getSceneMenuLabel(menuKey),
      groupLabel: '',
      spaces,
      sceneCount: spaces.length,
    });
  });

  return navigationGroups;
}

function getSpaceContentCountText(scene) {
  const unit = scene?.sceneType === 'SUPERVISION' ? '任务' : '主题';
  return `${scene?.topicCount || 0} 个${unit}`;
}

function getSpaceTheme(scene) {
  const sceneTheme = scene?.templateSnapshot?.theme || {};
  const coverSeed = String(scene?.id || scene?.key || scene?.name || scene?.templateName || 'space');
  const coverImages = SPACE_CARD_COVER_IMAGES_BY_TYPE[scene?.sceneType] || SPACE_CARD_COVER_IMAGES;
  const coverIndex = Array.from(coverSeed).reduce((total, character) => total + character.codePointAt(0), 0)
    % coverImages.length;

  return {
    ...sceneTheme,
    ...AI_SPACE_DETAIL_THEME,
    coverSource: 'UPLOAD',
    coverImage: sceneTheme.coverImage || coverImages[coverIndex],
  };
}

function countSpacesInGroups(groups = []) {
  return groups.reduce((total, group) => total + (Array.isArray(group?.spaces) ? group.spaces.length : 0), 0);
}

function paginateSpaceGroups(groups = [], page = 1, pageSize = SPACE_PAGE_SIZE) {
  const startIndex = Math.max(0, (page - 1) * pageSize);
  const endIndex = startIndex + pageSize;
  let cursor = 0;

  return groups.reduce((result, group) => {
    const spaces = Array.isArray(group?.spaces) ? group.spaces : [];
    const nextCursor = cursor + spaces.length;
    const sliceStart = Math.max(0, startIndex - cursor);
    const sliceEnd = Math.min(spaces.length, endIndex - cursor);
    cursor = nextCursor;

    if (sliceStart >= sliceEnd) return result;
    result.push({
      ...group,
      totalCount: spaces.length,
      spaces: spaces.slice(sliceStart, sliceEnd),
    });
    return result;
  }, []);
}

function AiSpaceCard({ scene, onOpen, onEdit, onDelete, onToggleShortcut }) {
  const sceneObjectLabel = getSpaceObjectLabel(scene);
  const theme = getSpaceTheme(scene);
  const topicCardConfig = normalizeTopicCardConfig(scene.templateSnapshot?.topicCard);
  const roleList = (scene.templateSnapshot?.roles || []).slice(0, 3);
  const memberCount = Number.isFinite(Number(scene.memberCount)) && Number(scene.memberCount) > 0
    ? Number(scene.memberCount)
    : ((scene.templateSnapshot?.roles || []).length || 0);
  const sceneCardClassName = [
    'scene-card',
    `scene-card-size-${String(topicCardConfig.size || 'MEDIUM').toLowerCase()}`,
    topicCardConfig.showCover ? '' : 'scene-card-no-cover',
  ].filter(Boolean).join(' ');
  const cardMenu = {
    items: [
      {
        key: 'toggle-shortcut',
        label: scene.menuShortcutEnabled ? '从菜单移除快捷方式' : '添加到菜单快捷方式',
      },
      { key: 'edit', label: `编辑${sceneObjectLabel}` },
      { key: 'delete', label: `删除${sceneObjectLabel}`, danger: true },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'toggle-shortcut') {
        onToggleShortcut(scene, !scene.menuShortcutEnabled);
      } else if (key === 'edit') {
        onEdit(scene);
      } else if (key === 'delete') {
        onDelete(scene);
      }
    },
  };

  return (
    <Card
      className={sceneCardClassName}
      hoverable
      variant="borderless"
      styles={{ body: { padding: 0 } }}
      onClick={() => onOpen(scene)}
    >
      {topicCardConfig.showCover ? (
        <div className="card-cover">
          <div
            className="wave-bg"
            style={getSceneThemeCoverStyle(theme, {
              overlayStart: 'rgba(8, 18, 32, 0.58)',
              overlayEnd: 'rgba(8, 18, 32, 0.16)',
            })}
          >
            {topicCardConfig.showTitle ? (
              <div className="card-cover-copy">
                <div className="card-cover-title">{theme.heroTitle || scene.templateName}</div>
                <div className="card-cover-hint">{theme.surfaceHint || scene.templateName}</div>
              </div>
            ) : null}
            <svg className="wave-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
              <path d="M0,60 C100,20 150,100 250,50 C300,30 350,80 400,40 L400,120 L0,120 Z" fill="rgba(255,255,255,0.18)" />
              <path d="M0,80 C80,50 160,100 240,70 C320,40 360,90 400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
              <path d="M0,95 C60,75 120,110 200,88 C280,66 340,98 400,82 L400,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
            </svg>
          </div>
          <Dropdown menu={cardMenu} placement="bottomRight">
            <Button
              type="text"
              className="card-more-btn"
              icon={<EllipsisOutlined />}
              onClick={(event) => event.stopPropagation()}
            />
          </Dropdown>
        </div>
      ) : (
        <div className="scene-card-inline-actions">
          <Dropdown menu={cardMenu} placement="bottomRight">
            <Button
              type="text"
              className="card-more-btn"
              icon={<EllipsisOutlined />}
              onClick={(event) => event.stopPropagation()}
            />
          </Dropdown>
        </div>
      )}
      <div className="card-body">
        {topicCardConfig.showTitle ? (
          <div className="card-title" title={scene.name}>{scene.name}</div>
        ) : null}
        <div className="card-subtitle">{scene.description || theme.heroSubtitle || '未填写空间描述'}</div>
        <div className="scene-card-meta-line">
          <span>{scene.templateName}</span>
          {topicCardConfig.showSceneType ? (
            <span>{getSceneTypeLabel(scene.sceneType)}</span>
          ) : null}
          {topicCardConfig.showMemberCount ? (
            <span>{`${memberCount} 名成员`}</span>
          ) : null}
        </div>
        {roleList.length > 0 ? (
          <div className="scene-role-list">
            {roleList.map((role) => (
              <span key={role.id} className="scene-role-pill">{role.name}</span>
            ))}
          </div>
        ) : null}
        <div className="card-footer">
          {topicCardConfig.showTags && theme.badgeText ? (
            <Tag className="scene-theme-tag">{theme.badgeText}</Tag>
          ) : null}
          <Tag className="visibility-tag">{getSceneVisibilityLabel(scene.visibility)}</Tag>
          {scene.menuShortcutEnabled ? (
            <Tag className="scene-shortcut-tag">菜单快捷方式</Tag>
          ) : null}
          <span className="card-count">{getSpaceContentCountText(scene)}</span>
        </div>
      </div>
    </Card>
  );
}

function AiSpaceTopicPage({ scene, onBack }) {
  const sceneConfig = useMemo(() => {
    const templateSnapshot = scene?.templateSnapshot || {};
    return {
      ...templateSnapshot,
      theme: {
        ...(templateSnapshot.theme || {}),
        ...AI_SPACE_DETAIL_THEME,
        badgeText: templateSnapshot.theme?.badgeText || getSceneTypeLabel(scene?.sceneType),
      },
    };
  }, [scene]);

  return (
    <section className="td-work-space-topic-page" aria-label={`${scene.name}空间`}>
      <TopicDetail
        topicTitle={scene.name}
        onBack={onBack}
        sceneConfig={sceneConfig}
        sceneId={scene.id}
        sceneType={scene.sceneType}
        storageScopeKey={scene.storageScopeKey}
        sceneDescription={scene.description}
        sceneTypeLabel={getSceneTypeLabel(scene.sceneType)}
        headerLeftContent={(
          <div className="td-work-space-detail-breadcrumb" aria-label="当前位置">
            <button type="button" onClick={onBack}>
              空间
            </button>
            <span>›</span>
            <strong title={scene.name}>{scene.name}</strong>
          </div>
        )}
      />
    </section>
  );
}

function SpacesPage({
  currentGroups,
  visibleGroups,
  loading,
  searchText,
  activeSpace,
  activeGroupKey,
  ownershipTab,
  ownershipOptions,
  summary,
  emptyDescription,
  title,
  onSearchChange,
  onGroupChange,
  onOwnershipChange,
  onOpenSpace,
  onBack,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  onToggleShortcut,
}) {
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [spaceRailWidth, setSpaceRailWidth] = useState(loadTdWorkSpaceRailWidth);
  const [spaceRailResizing, setSpaceRailResizing] = useState(false);
  const [spacePage, setSpacePage] = useState(1);
  const spaceRailResizeStartRef = useRef(null);
  const spaceRailWidthRef = useRef(spaceRailWidth);
  const visibleSpaceCount = useMemo(() => countSpacesInGroups(visibleGroups), [visibleGroups]);
  const maxSpacePage = Math.max(1, Math.ceil(visibleSpaceCount / SPACE_PAGE_SIZE));
  const safeSpacePage = Math.min(spacePage, maxSpacePage);
  const pagedVisibleGroups = useMemo(
    () => paginateSpaceGroups(visibleGroups, safeSpacePage, SPACE_PAGE_SIZE),
    [safeSpacePage, visibleGroups],
  );
  const showPagination = visibleSpaceCount > SPACE_PAGE_SIZE;

  const updateSpaceRailWidth = useCallback((nextWidth) => {
    const nextBoundedWidth = getBoundedTdWorkSpaceRailWidth(nextWidth);
    spaceRailWidthRef.current = nextBoundedWidth;
    setSpaceRailWidth(nextBoundedWidth);
  }, []);

  const handleSpaceRailResizeStart = useCallback((event) => {
    if (railCollapsed) return;
    event.preventDefault();
    spaceRailResizeStartRef.current = {
      pointerX: event.clientX,
      width: spaceRailWidthRef.current,
    };
    setSpaceRailResizing(true);
  }, [railCollapsed]);

  const handleSpaceRailResizeKeyDown = useCallback((event) => {
    if (railCollapsed) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    if (event.key === 'Home') {
      updateSpaceRailWidth(TD_WORK_SPACE_RAIL_MIN_WIDTH);
      persistTdWorkSpaceRailWidth(TD_WORK_SPACE_RAIL_MIN_WIDTH);
      return;
    }
    if (event.key === 'End') {
      updateSpaceRailWidth(TD_WORK_SPACE_RAIL_MAX_WIDTH);
      persistTdWorkSpaceRailWidth(TD_WORK_SPACE_RAIL_MAX_WIDTH);
      return;
    }
    const nextWidth = spaceRailWidthRef.current + (event.key === 'ArrowLeft' ? -10 : 10);
    updateSpaceRailWidth(nextWidth);
    persistTdWorkSpaceRailWidth(nextWidth);
  }, [railCollapsed, updateSpaceRailWidth]);

  const resetSpacePage = useCallback(() => {
    setSpacePage(1);
  }, []);

  const handleGroupChange = useCallback((key) => {
    resetSpacePage();
    onGroupChange(key);
  }, [onGroupChange, resetSpacePage]);

  const handleOwnershipChange = useCallback((key) => {
    resetSpacePage();
    onOwnershipChange(key);
  }, [onOwnershipChange, resetSpacePage]);

  const handleSearchChange = useCallback((event) => {
    resetSpacePage();
    onSearchChange(event.target.value);
  }, [onSearchChange, resetSpacePage]);

  useEffect(() => {
    spaceRailWidthRef.current = spaceRailWidth;
  }, [spaceRailWidth]);

  useEffect(() => {
    const handleWindowResize = () => {
      updateSpaceRailWidth(spaceRailWidthRef.current);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [updateSpaceRailWidth]);

  useEffect(() => {
    if (!spaceRailResizing) return undefined;

    const handlePointerMove = (event) => {
      const resizeStart = spaceRailResizeStartRef.current;
      if (!resizeStart) return;
      updateSpaceRailWidth(resizeStart.width + event.clientX - resizeStart.pointerX);
    };

    const handlePointerUp = () => {
      setSpaceRailResizing(false);
      persistTdWorkSpaceRailWidth(spaceRailWidthRef.current);
      spaceRailResizeStartRef.current = null;
    };

    document.documentElement.classList.add('td-work-is-resizing');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.documentElement.classList.remove('td-work-is-resizing');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [spaceRailResizing, updateSpaceRailWidth]);

  if (activeSpace) {
    return <AiSpaceTopicPage scene={activeSpace} onBack={onBack} />;
  }

  const railContent = (
    <>
      <button type="button" className="td-work-space-rail-create" onClick={onCreateSpace}>
        <span className="td-work-space-rail-create-icon"><PlusOutlined /></span>
        <span>新建场景</span>
      </button>
      <button
        type="button"
        className={`td-work-space-rail-item ${!activeGroupKey ? 'is-active' : ''}`}
        onClick={() => handleGroupChange(null)}
      >
        <HomeOutlined />
        <span>首页</span>
      </button>
      <div className="td-work-space-rail-section">
        <div className="td-work-space-rail-title">我的场景</div>
        <div className="td-work-space-rail-list">
          {currentGroups.length ? (
            currentGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                className={`td-work-space-rail-item ${activeGroupKey === group.key ? 'is-active' : ''}`}
                onClick={() => handleGroupChange(group.key)}
                title={group.name}
              >
                <CloudOutlined />
                <span>{group.name}</span>
                {Number.isFinite(Number(group.sceneCount)) ? (
                  <em className="td-work-space-rail-count">{group.sceneCount}</em>
                ) : null}
              </button>
            ))
          ) : (
            <div className="td-work-space-rail-empty">暂无场景</div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <section
      className={`td-work-space-page td-work-space-standard-skin ${railCollapsed ? 'is-space-rail-collapsed' : ''} ${spaceRailResizing ? 'is-space-rail-resizing' : ''}`}
      style={{ '--td-work-space-rail-width': `${spaceRailWidth}px` }}
      aria-label="空间"
    >
      {!railCollapsed ? (
        <div className="td-work-space-rail-shell">
          <aside className="td-work-space-rail" aria-label="空间导航">
            <div className="td-work-space-rail-head">
              <span>空间</span>
              <button
                type="button"
                className="td-work-space-rail-toggle"
                title="收起空间导航"
                aria-label="收起空间导航"
                onClick={() => setRailCollapsed(true)}
              >
                <MenuFoldOutlined />
              </button>
            </div>
            {railContent}
          </aside>
          <div
            className="td-work-space-rail-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整空间导航宽度"
            aria-valuemin={TD_WORK_SPACE_RAIL_MIN_WIDTH}
            aria-valuemax={TD_WORK_SPACE_RAIL_MAX_WIDTH}
            aria-valuenow={spaceRailWidth}
            tabIndex={0}
            onPointerDown={handleSpaceRailResizeStart}
            onKeyDown={handleSpaceRailResizeKeyDown}
          />
        </div>
      ) : null}

      <div className="td-work-space-main">
        <div className="app-header td-work-space-standard-header">
          <div className="header-title td-work-space-header-title">
            {railCollapsed ? (
              <div className="td-work-space-title-menu">
                <button
                  type="button"
                  className="td-work-space-header-toggle"
                  title="展开空间导航"
                  aria-label="展开空间导航"
                  onClick={() => setRailCollapsed(false)}
                >
                  <MenuUnfoldOutlined />
                </button>
                <div className="td-work-space-header-flyout">
                  <aside className="td-work-space-rail td-work-space-rail-flyout-panel" aria-label="空间导航">
                    {railContent}
                  </aside>
                </div>
              </div>
            ) : null}
            <span>{title}</span>
          </div>
          <div className="header-actions">
            <Input
              placeholder="搜索空间名称..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              className="search-input"
              value={searchText}
              onChange={handleSearchChange}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="new-topic-btn"
              onClick={onCreateSpace}
            >
              新建空间
            </Button>
          </div>
        </div>

        <div className="app-content td-work-space-standard-content">
          {!loading ? (
            <div className="scene-home-toolbar">
              <Segmented
                value={ownershipTab}
                onChange={handleOwnershipChange}
                options={ownershipOptions}
                className="scene-home-segmented"
              />
              <div className="scene-home-toolbar-meta">{summary}</div>
            </div>
          ) : null}
          <div className="td-work-space-list-frame">
            {loading ? (
              <div className="scene-empty-state">空间加载中...</div>
            ) : visibleGroups.length === 0 ? (
              <div className="scene-empty-state">
                <Empty description={emptyDescription} />
              </div>
            ) : (
              <div className="scene-group-list">
                {pagedVisibleGroups.map((group) => (
                  <section key={group.key} className="scene-group-section">
                    {visibleGroups.length > 1 ? (
                      <div className="scene-group-header">
                        <div>
                          <div className="scene-group-title">{group.name}</div>
                          <div className="scene-group-subtitle">一个场景下可承载多个{getSpaceGroupObjectLabel(group)}。</div>
                        </div>
                        <div className="scene-group-count">{group.totalCount ?? group.spaces.length} 个{getSpaceGroupObjectLabel(group)}</div>
                      </div>
                    ) : null}
                    <div className="card-grid">
                      {group.spaces.map((scene) => (
                        <AiSpaceCard
                          key={scene.id}
                          scene={scene}
                          onOpen={onOpenSpace}
                          onEdit={onEditSpace}
                          onDelete={onDeleteSpace}
                          onToggleShortcut={onToggleShortcut}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
          {!loading && showPagination ? (
            <div className="td-work-space-pagination">
              <Pagination
                current={safeSpacePage}
                pageSize={SPACE_PAGE_SIZE}
                total={visibleSpaceCount}
                showSizeChanger={false}
                showLessItems
                onChange={setSpacePage}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WorkBrowserPanel({ onClose }) {
  const [tabs, setTabs] = useState([{ id: 'browser-tab-1', title: '新标签页' }]);
  const [activeTabId, setActiveTabId] = useState('browser-tab-1');
  const nextTabNumberRef = useRef(2);

  const handleCreateTab = () => {
    const nextNumber = nextTabNumberRef.current;
    nextTabNumberRef.current += 1;
    const nextTab = {
      id: `browser-tab-${nextNumber}`,
      title: `新标签页 ${nextNumber}`,
    };
    setTabs((current) => [...current, nextTab]);
    setActiveTabId(nextTab.id);
  };

  const handleCloseTab = (tabId, event) => {
    event.stopPropagation();
    if (tabs.length <= 1) {
      onClose();
      return;
    }
    const closingIndex = tabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = tabs.filter((tab) => tab.id !== tabId);
    if (activeTabId === tabId) {
      const nextActiveTab = tabs[closingIndex + 1] || tabs[closingIndex - 1] || nextTabs[0];
      setActiveTabId(nextActiveTab.id);
    }
    setTabs(nextTabs);
  };

  return (
    <aside className="td-work-browser-panel" aria-label="右侧工作面板">
      <header className="td-work-browser-tabs">
        <div className="td-work-browser-tab-list" role="tablist" aria-label="工作面板标签页">
          {tabs.map((tab) => {
            const active = activeTabId === tab.id;

            return (
              <div
                key={tab.id}
                className={`td-work-browser-tab ${active ? 'is-active' : ''}`}
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTabId(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveTabId(tab.id);
                  }
                }}
              >
                <span className="td-work-browser-tab-dot" />
                <span>{tab.title}</span>
                <button type="button" aria-label={`关闭${tab.title}`} onClick={(event) => handleCloseTab(tab.id, event)}>
                  <CloseOutlined />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="td-work-browser-new-tab"
          title="新建标签"
          aria-label="新建标签"
          onClick={handleCreateTab}
        >
          <PlusOutlined />
        </button>
        <div className="td-work-browser-top-actions">
          <button type="button" title="展开" aria-label="展开">
            <ProjectOutlined />
          </button>
          <button type="button" title="关闭右侧面板" aria-label="关闭右侧面板" onClick={() => onClose()}>
            <SidebarToggleIcon />
          </button>
        </div>
      </header>

      <div className="td-work-browser-home">
        <div className="td-work-browser-launcher">
          <label className="td-work-browser-search" htmlFor="td-work-browser-search">
            <SearchOutlined />
            <input id="td-work-browser-search" placeholder="搜索或输入网址" />
          </label>
          <button type="button">
            <FolderOutlined />
            <span>打开项目文件夹</span>
          </button>
          <button type="button">
            <CloudServerOutlined />
            <span>打开云盘文件</span>
          </button>
          <button type="button">
            <ControlOutlined />
            <span>打开终端</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function FileQueryConversation() {
  return (
    <div className="td-work-file-query-conversation">
      <article className="td-work-file-query-message">
        <div className="td-work-file-query-step">识别用户文件查询需求 <span>›</span></div>
        <p className="td-work-file-query-question">我来看看当前工作目录下有哪些文件。</p>

        <div className="td-work-file-query-step">核查项目目录状态 <span>›</span></div>
        <p>
          当前项目目录 <strong>/Users/zhanghl/Doubaowork/chats/2026-08-29/new-chat</strong> 是空的，
          里面没有任何文件或子文件夹。
        </p>
        <p>需要我帮你在其他位置查找文件吗？比如：</p>
        <ul>
          <li>浏览一下这个会话相邻的目录（如 chats 下的其他会话）</li>
          <li>指定某个路径让我列出</li>
        </ul>
        <p>告诉我具体想看哪里即可。</p>

        <div className="td-work-file-query-actions" aria-label="消息操作">
          <button type="button" title="复制" aria-label="复制"><FileTextOutlined /></button>
          <button type="button" title="朗读" aria-label="朗读"><AudioOutlined /></button>
          <button type="button" title="点赞" aria-label="点赞"><CheckOutlined /></button>
          <button type="button" title="反馈" aria-label="反馈"><CloseOutlined /></button>
          <button type="button" title="编辑" aria-label="编辑"><EditOutlined /></button>
          <button type="button" title="重新生成" aria-label="重新生成"><ReloadOutlined /></button>
          <button type="button" title="更多" aria-label="更多"><MoreOutlined /></button>
        </div>
      </article>
    </div>
  );
}

export default function TdWorkModule({
  accountMenu,
  accountMenuOpen,
  onAccountMenuOpenChange,
}) {
  const [activeNav, setActiveNav] = useState('home');
  const [homeSessionKey, setHomeSessionKey] = useState(0);
  const [activeSideItem, setActiveSideItem] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedComposerSkillKeys, setSelectedComposerSkillKeys] = useState([]);
  const [workContentTab, setWorkContentTab] = useState('work-task');
  const [toast, setToast] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(loadTdWorkSidebarWidth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarResizing, setSidebarResizing] = useState(false);
  const [sidebarSearchOpen, setSidebarSearchOpen] = useState(false);
  const [sidebarTaskSearch, setSidebarTaskSearch] = useState('');
  const [sidebarFilterOpen, setSidebarFilterOpen] = useState(false);
  const [sidebarTaskStatusFilter, setSidebarTaskStatusFilter] = useState('all');
  const [sidebarTaskTimeFilter, setSidebarTaskTimeFilter] = useState('all');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelExpanded, setSidePanelExpanded] = useState(false);
  const [sidePanelClosing, setSidePanelClosing] = useState(false);
  const [sidePanelPrimaryRatio, setSidePanelPrimaryRatio] = useState(46);
  const [sidePanelResizing, setSidePanelResizing] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [modeKey, setModeKey] = useState('auto');
  const [taskTargetKey, setTaskTargetKey] = useState('local');
  const [selectedComposerSpaceId, setSelectedComposerSpaceId] = useState('');
  const [selectedComposerAgentKey, setSelectedComposerAgentKey] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [spaceTemplates, setSpaceTemplates] = useState([]);
  const [spaceScenes, setSpaceScenes] = useState([]);
  const [spaceMenuGroups, setSpaceMenuGroups] = useState([]);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [spaceSearch, setSpaceSearch] = useState('');
  const [spaceMenuFilter, setSpaceMenuFilter] = useState(null);
  const [spaceOwnershipTab, setSpaceOwnershipTab] = useState('created');
  const [activeSpace, setActiveSpace] = useState(null);
  const [spaceCreateOpen, setSpaceCreateOpen] = useState(false);
  const [spaceEditing, setSpaceEditing] = useState(null);
  const [spaceCreateDefaultMenuKey, setSpaceCreateDefaultMenuKey] = useState(null);
  const [activeCategory, setActiveCategory] = useState('精选');
  const [connectorSearch, setConnectorSearch] = useState('');
  const [skillView, setSkillView] = useState('market');
  const [partnerMarketCategory, setPartnerMarketCategory] = useState('全部');
  const [partnerMarketSearch, setPartnerMarketSearch] = useState('');
  const [mySkillTab, setMySkillTab] = useState('skills');
  const [mySkillSearch, setMySkillSearch] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [customConnectorOpen, setCustomConnectorOpen] = useState(false);
  const [customConnectorForm, setCustomConnectorForm] = useState(createCustomConnectorForm);
  const [customConnectors, setCustomConnectors] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [deletedPartnerKeys, setDeletedPartnerKeys] = useState(() => new Set());
  const [partnerView, setPartnerView] = useState('workspace');
  const [partnerPrompt, setPartnerPrompt] = useState('');
  const [partnerWorkTab, setPartnerWorkTab] = useState('tasks');
  const [partnerWorkSearch, setPartnerWorkSearch] = useState('');
  const [partnerDetailTab, setPartnerDetailTab] = useState('profile');
  const [partnerManageTab, setPartnerManageTab] = useState('agents');
  const [partnerManageSearch, setPartnerManageSearch] = useState('');
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [enabledSkillKeys, setEnabledSkillKeys] = useState(
    () => new Set([
      ...MY_SKILLS.filter((item) => item.enabled).map((item) => item.key),
      'tongda-training',
    ]),
  );
  const composerRef = useRef(null);
  const createMenuRef = useRef(null);
  const mainRef = useRef(null);
  const sidebarResizeStartRef = useRef(null);
  const sidebarWidthRef = useRef(sidebarWidth);
  const sidePanelTimerRef = useRef(null);
  const spaceSidebarLoadedRef = useRef(false);

  const activeMode = useMemo(
    () => MODE_OPTIONS.find((item) => item.key === modeKey) || MODE_OPTIONS[0],
    [modeKey],
  );
  const selectedComposerSkills = useMemo(
    () => selectedComposerSkillKeys
      .map((key) => COMPOSER_SKILLS.find((item) => item.key === key))
      .filter(Boolean),
    [selectedComposerSkillKeys],
  );
  const sidePanelMounted = sidePanelOpen || sidePanelClosing;
  const sidePanelIsExpanded = sidePanelOpen && sidePanelExpanded && !sidePanelClosing;
  const clampSidePanelRatio = useCallback((value) => Math.min(68, Math.max(34, value)), []);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const openSidePanel = useCallback(() => {
    if (sidePanelTimerRef.current) {
      window.clearTimeout(sidePanelTimerRef.current);
      sidePanelTimerRef.current = null;
    }
    setSidePanelClosing(false);
    setSidePanelOpen(true);
    setSidePanelExpanded(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setSidePanelExpanded(true);
      });
    });
  }, []);

  const closeSidePanel = useCallback((options = {}) => {
    const immediate = options === true || options?.immediate === true;
    if (sidePanelTimerRef.current) {
      window.clearTimeout(sidePanelTimerRef.current);
      sidePanelTimerRef.current = null;
    }
    setSidePanelExpanded(false);
    setOpenPanel(null);
    if (immediate) {
      setSidePanelOpen(false);
      setSidePanelClosing(false);
      return;
    }
    setSidePanelClosing(true);
    sidePanelTimerRef.current = window.setTimeout(() => {
      setSidePanelOpen(false);
      setSidePanelClosing(false);
      sidePanelTimerRef.current = null;
    }, 420);
  }, []);

  const handleToggleSidePanel = useCallback(() => {
    if (sidePanelIsExpanded) {
      closeSidePanel();
      return;
    }
    openSidePanel();
  }, [closeSidePanel, openSidePanel, sidePanelIsExpanded]);

  const handleSidePanelResizeStart = useCallback((event) => {
    if (!sidePanelMounted) return;
    event.preventDefault();
    setSidePanelResizing(true);
  }, [sidePanelMounted]);

  const handleSidePanelResizeKeyDown = useCallback((event) => {
    if (!sidePanelMounted) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setSidePanelPrimaryRatio((current) => clampSidePanelRatio(current + (event.key === 'ArrowLeft' ? -4 : 4)));
  }, [clampSidePanelRatio, sidePanelMounted]);

  const updateSidebarWidth = useCallback((nextWidth, options = {}) => {
    const nextBoundedWidth = getBoundedTdWorkSidebarWidth(nextWidth);
    sidebarWidthRef.current = nextBoundedWidth;
    setSidebarWidth(nextBoundedWidth);
    if (options.persist) {
      persistTdWorkSidebarWidth(nextBoundedWidth);
    }
  }, []);

  const handleSidebarResizeStart = useCallback((event) => {
    if (sidebarCollapsed) return;
    event.preventDefault();
    sidebarResizeStartRef.current = {
      pointerX: event.clientX,
      width: sidebarWidthRef.current,
    };
    setSidebarResizing(true);
  }, [sidebarCollapsed]);

  const handleSidebarResizeKeyDown = useCallback((event) => {
    if (sidebarCollapsed) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    if (event.key === 'Home') {
      updateSidebarWidth(TD_WORK_SIDEBAR_MIN_WIDTH, { persist: true });
      return;
    }
    if (event.key === 'End') {
      updateSidebarWidth(TD_WORK_SIDEBAR_MAX_WIDTH, { persist: true });
      return;
    }
    updateSidebarWidth(
      sidebarWidthRef.current + (event.key === 'ArrowLeft' ? -12 : 12),
      { persist: true },
    );
  }, [sidebarCollapsed, updateSidebarWidth]);

  const loadAiSpaceData = useCallback(async (withLoading = true) => {
    if (withLoading) setSpaceLoading(true);
    try {
      await sceneApi.seed();
      const [nextTemplates, nextScenes, nextMenuGroups] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
        sceneApi.listSceneMenuGroups(),
      ]);
      setSpaceTemplates(nextTemplates);
      setSpaceScenes(nextScenes);
      setSpaceMenuGroups(nextMenuGroups);
      setActiveSpace((current) => (
        current ? nextScenes.find((scene) => scene.id === current.id) || null : current
      ));
    } catch {
      setToast('加载空间数据失败');
    } finally {
      if (withLoading) setSpaceLoading(false);
    }
  }, []);

  const buildAiSpaceGroups = useCallback((sceneList) => {
    const groupMap = new Map();
    sceneList.forEach((scene) => {
      const groupName = scene.sceneGroupName || DEFAULT_SPACE_SCENE_GROUP_NAME;
      const currentGroup = groupMap.get(groupName) || {
        key: groupName,
        name: groupName,
        spaces: [],
      };
      currentGroup.spaces.push(scene);
      groupMap.set(groupName, currentGroup);
    });
    return Array.from(groupMap.values());
  }, []);

  const spaceMenuNavigationGroups = useMemo(
    () => buildSpaceMenuNavigationGroups(spaceMenuGroups, spaceScenes),
    [spaceMenuGroups, spaceScenes],
  );

  const effectiveSpaceMenuFilter = useMemo(() => {
    if (!spaceMenuFilter) return null;
    if (spaceMenuNavigationGroups.length === 0) return spaceMenuFilter;
    return spaceMenuNavigationGroups.some((group) => group.key === spaceMenuFilter)
      ? spaceMenuFilter
      : null;
  }, [spaceMenuFilter, spaceMenuNavigationGroups]);

  const spaceMenuFilteredScenes = useMemo(() => {
    if (!effectiveSpaceMenuFilter) return spaceScenes;
    return spaceScenes.filter((scene) => getSpaceMenuKey(scene) === effectiveSpaceMenuFilter);
  }, [effectiveSpaceMenuFilter, spaceScenes]);

  const spaceOwnershipCounts = useMemo(() => {
    return spaceMenuFilteredScenes.reduce((acc, scene) => {
      const key = resolveSpaceOwnershipTab(scene);
      acc[key] += 1;
      return acc;
    }, { created: 0, joined: 0 });
  }, [spaceMenuFilteredScenes]);

  const effectiveSpaceOwnershipTab = useMemo(() => {
    if (spaceMenuFilteredScenes.length === 0 || (spaceOwnershipCounts[spaceOwnershipTab] || 0) > 0) {
      return spaceOwnershipTab;
    }
    const fallbackTab = spaceOwnershipTab === 'created' ? 'joined' : 'created';
    return (spaceOwnershipCounts[fallbackTab] || 0) > 0 ? fallbackTab : spaceOwnershipTab;
  }, [spaceMenuFilteredScenes.length, spaceOwnershipCounts, spaceOwnershipTab]);

  const ownershipFilteredSpaceScenes = useMemo(() => {
    return spaceMenuFilteredScenes.filter((scene) => resolveSpaceOwnershipTab(scene) === effectiveSpaceOwnershipTab);
  }, [effectiveSpaceOwnershipTab, spaceMenuFilteredScenes]);

  const visibleSpaceScenes = useMemo(() => {
    const normalizedKeyword = spaceSearch.trim().toLowerCase();
    return ownershipFilteredSpaceScenes.filter((scene) => {
      if (!normalizedKeyword) return true;
      const haystack = `${scene.name} ${scene.sceneGroupName || ''} ${scene.templateName} ${scene.description || ''}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [ownershipFilteredSpaceScenes, spaceSearch]);

  const currentSpaceGroups = useMemo(
    () => buildAiSpaceGroups(spaceMenuFilteredScenes),
    [buildAiSpaceGroups, spaceMenuFilteredScenes],
  );

  const visibleSpaceGroups = useMemo(
    () => buildAiSpaceGroups(visibleSpaceScenes),
    [buildAiSpaceGroups, visibleSpaceScenes],
  );

  const sidebarSpaceItems = useMemo(() => {
    const priorityMap = new Map(SIDEBAR_SPACE_PRIORITY.map((id, index) => [id, index]));
    return [...spaceScenes]
      .sort((a, b) => {
        const aPriority = priorityMap.has(a.id) ? priorityMap.get(a.id) : Number.POSITIVE_INFINITY;
        const bPriority = priorityMap.has(b.id) ? priorityMap.get(b.id) : Number.POSITIVE_INFINITY;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return String(b.updatedAt).localeCompare(String(a.updatedAt));
      })
      .slice(0, 3)
      .map((scene, index) => ({
        key: `space:${scene.id}`,
        label: scene.name,
        tone: index === 0 ? 'blue' : 'gray',
        icon: <AppstoreOutlined />,
        kind: 'space',
        scene,
      }));
  }, [spaceScenes]);

  const selectedComposerSpace = useMemo(
    () => spaceScenes.find((scene) => scene.id === selectedComposerSpaceId) || null,
    [selectedComposerSpaceId, spaceScenes],
  );

  const aiSpaceHomeTitle = useMemo(() => {
    if (effectiveSpaceMenuFilter) {
      return spaceMenuNavigationGroups.find((group) => group.key === effectiveSpaceMenuFilter)?.name
        || sceneApi.getSceneMenuLabel(effectiveSpaceMenuFilter);
    }
    if (currentSpaceGroups.length === 1) {
      return currentSpaceGroups[0].name;
    }
    return '全部空间';
  }, [currentSpaceGroups, effectiveSpaceMenuFilter, spaceMenuNavigationGroups]);

  const spaceOwnershipSegmentOptions = useMemo(() => {
    return SPACE_HOME_OWNERSHIP_TABS.map((item) => ({
      value: item.key,
      label: (
        <span className="scene-home-segment-label">
          <span>{item.label}</span>
          <span className="scene-home-segment-count">{spaceOwnershipCounts[item.key]}</span>
        </span>
      ),
    }));
  }, [spaceOwnershipCounts]);

  const spaceOwnershipSummary = useMemo(() => {
    const activeCount = spaceOwnershipCounts[effectiveSpaceOwnershipTab] || 0;
    if (spaceMenuFilteredScenes.length === 0) {
      return `${aiSpaceHomeTitle}当前分类下还没有空间`;
    }
    return `${aiSpaceHomeTitle} · ${getSpaceOwnershipTabLabel(effectiveSpaceOwnershipTab)} ${activeCount} 个，当前分类共 ${spaceMenuFilteredScenes.length} 个空间`;
  }, [aiSpaceHomeTitle, effectiveSpaceOwnershipTab, spaceMenuFilteredScenes.length, spaceOwnershipCounts]);

  const spaceEmptyDescription = useMemo(() => {
    const normalizedKeyword = spaceSearch.trim();
    if (normalizedKeyword) {
      return `没有找到符合条件的${getSpaceOwnershipTabLabel(effectiveSpaceOwnershipTab)}空间`;
    }
    if (spaceMenuFilteredScenes.length === 0) {
      return effectiveSpaceMenuFilter ? '当前栏目暂无空间，先新建一个。' : '暂无空间，先创建一个模板化空间。';
    }
    if ((spaceOwnershipCounts[effectiveSpaceOwnershipTab] || 0) === 0) {
      return `${getSpaceOwnershipTabLabel(effectiveSpaceOwnershipTab)}暂无空间`;
    }
    return '当前筛选下暂无空间';
  }, [effectiveSpaceMenuFilter, effectiveSpaceOwnershipTab, spaceMenuFilteredScenes.length, spaceOwnershipCounts, spaceSearch]);

  const spaceSceneGroupOptions = useMemo(() => {
    const groupNames = currentSpaceGroups.map((group) => group.name).filter(Boolean);
    const fallbackSceneGroupName = effectiveSpaceMenuFilter ? aiSpaceHomeTitle : DEFAULT_SPACE_SCENE_GROUP_NAME;
    return (groupNames.length ? groupNames : [fallbackSceneGroupName]).map((name) => ({
      label: name,
      value: name,
    }));
  }, [aiSpaceHomeTitle, currentSpaceGroups, effectiveSpaceMenuFilter]);

  const handleOpenAiSpace = useCallback(async (scene) => {
    if (!scene?.id) return;
    try {
      const detail = await sceneApi.detailScene(scene.id);
      setActiveSpace(detail || scene);
    } catch {
      setActiveSpace(scene);
    }
  }, []);

  const handleOpenAiSpaceCreate = useCallback(async () => {
    if (!spaceTemplates.length) {
      await loadAiSpaceData();
    }
    setSpaceEditing(null);
    setSpaceCreateDefaultMenuKey(effectiveSpaceMenuFilter || null);
    setSpaceCreateOpen(true);
  }, [effectiveSpaceMenuFilter, loadAiSpaceData, spaceTemplates.length]);

  const handleOpenTongdaAcademySpaces = useCallback(() => {
    setActiveNav('space');
    setActiveSideItem('');
    setActiveSpace(null);
    setSpaceSearch('');
    setSpaceMenuFilter('online-academy-training');
    setSpaceOwnershipTab('created');
    setCreateMenuOpen(false);
    setPartnerPickerOpen(false);
    closeSidePanel(true);
    if (spaceScenes.length === 0 && !spaceLoading) {
      loadAiSpaceData();
    }
    setToast('已打开通答学院项目');
  }, [closeSidePanel, loadAiSpaceData, spaceLoading, spaceScenes.length]);

  const handleEditAiSpace = useCallback((scene) => {
    setSpaceEditing(scene);
    setSpaceCreateDefaultMenuKey(null);
    setSpaceCreateOpen(true);
  }, []);

  const handleCancelAiSpaceCreate = useCallback(() => {
    setSpaceCreateOpen(false);
    setSpaceEditing(null);
    setSpaceCreateDefaultMenuKey(null);
  }, []);

  const handleSaveAiSpace = useCallback(async (values) => {
    try {
      const saved = await sceneApi.saveScene(values);
      setSpaceCreateOpen(false);
      setSpaceEditing(null);
      setSpaceCreateDefaultMenuKey(null);
      await loadAiSpaceData(false);
      setActiveSpace((current) => (current?.id === saved.id ? saved : current));
      const objectLabel = getSpaceObjectLabel(saved);
      message.success(values.id ? `${objectLabel}已更新` : `${objectLabel}已创建`);
    } catch (error) {
      message.error(error?.message || '保存空间失败');
    }
  }, [loadAiSpaceData]);

  const handleToggleAiSpaceShortcut = useCallback(async (scene, enabled) => {
    if (!scene?.id) return;
    try {
      const saved = await sceneApi.toggleSceneMenuShortcut(scene.id, enabled);
      setActiveSpace((current) => (current?.id === saved.id ? saved : current));
      await loadAiSpaceData(false);
      message.success(enabled ? '已添加到菜单快捷方式' : '已从菜单快捷方式移除');
    } catch (error) {
      message.error(error?.message || '更新菜单快捷方式失败');
    }
  }, [loadAiSpaceData]);

  const handleDeleteAiSpace = useCallback((scene) => {
    if (!scene?.id) return;
    const objectLabel = getSpaceObjectLabel(scene);
    Modal.confirm({
      title: `删除${objectLabel}`,
      content: `确定删除“${scene.name}”吗？该${objectLabel}下的本地内容数据也会一并清除。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await sceneApi.removeScene(scene.id);
          setActiveSpace((current) => (current?.id === scene.id ? null : current));
          await loadAiSpaceData(false);
          message.success(`${objectLabel}已删除`);
        } catch (error) {
          message.error(error?.message || `删除${objectLabel}失败`);
        }
      },
    });
  }, [loadAiSpaceData]);

  const visibleConnectors = useMemo(() => {
    const normalizedSearch = connectorSearch.trim().toLowerCase();
    return CONNECTORS.filter((item) => {
      const matchesCategory = activeCategory === '精选' || item.category === activeCategory;
      const matchesSearch = !normalizedSearch
        || `${item.name} ${item.desc} ${item.category}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, connectorSearch]);

  const handleSkillHubViewChange = useCallback((nextView) => {
    setSkillView(nextView);
    setCreateMenuOpen(false);
    if (nextView === 'partners') {
      setPartnerMarketCategory('全部');
      setPartnerMarketSearch('');
      return;
    }
    setConnectorSearch('');
  }, []);

  const ownedConnectors = useMemo(() => [
    {
      key: 'tongda-training',
      name: '通达教师研修平台',
      desc: '已连接 guoren-v2 培训项目、课程进度与学习记录',
      category: '教研培训',
      logo: '研',
      tone: 'blue',
    },
    ...customConnectors,
  ], [customConnectors]);

  const availablePartnerCards = useMemo(
    () => PARTNER_CARDS.filter((item) => !deletedPartnerKeys.has(item.key)),
    [deletedPartnerKeys],
  );

  const availableWorkPartners = useMemo(
    () => availablePartnerCards.filter((item) => item.tag !== '小队'),
    [availablePartnerCards],
  );

  const availableWorkTeams = useMemo(
    () => availablePartnerCards.filter((item) => item.tag === '小队'),
    [availablePartnerCards],
  );

  const composerAgents = useMemo(() => {
    const workspaceAgents = availableWorkPartners.map((item) => ({
      ...item,
      source: 'workspace',
      selectionKey: `workspace:${item.key}`,
      meta: item.tag,
    }));
    const marketAgents = PARTNER_MARKET_ITEMS.map((item, index) => ({
      ...item,
      source: 'market',
      selectionKey: `market:${item.key}`,
      marketIndex: index,
      meta: item.category,
    }));

    return [...workspaceAgents, ...marketAgents];
  }, [availableWorkPartners]);

  const selectedComposerAgent = useMemo(
    () => composerAgents.find((agent) => agent.selectionKey === selectedComposerAgentKey) || null,
    [composerAgents, selectedComposerAgentKey],
  );

  const openPartnerWorkspace = useCallback((item) => {
    setActivePartner(item);
    setPartnerView('workspace');
    setPartnerWorkTab('tasks');
    setPartnerWorkSearch('');
    setPartnerPrompt('');
    setPartnerPickerOpen(false);
    setPartnerDetailTab('profile');
  }, []);

  const openPartnerMore = useCallback((item) => {
    setActivePartner(item);
    setPartnerWorkTab('tasks');
    setPartnerWorkSearch('');
    setPartnerPrompt('');
    setPartnerPickerOpen(false);
    setPartnerDetailTab('profile');
    setPartnerView(item.tag === '小队' ? 'squad-detail' : 'detail');
  }, []);

  const deletePartner = useCallback((item) => {
    setDeletedPartnerKeys((current) => {
      if (current.has(item.key)) return current;
      const next = new Set(current);
      next.add(item.key);
      return next;
    });
    if (activePartner?.key === item.key) {
      setActivePartner(null);
      setPartnerView('workspace');
      setPartnerPickerOpen(false);
    }
    setToast(`已删除：${item.name}`);
  }, [activePartner?.key]);

  const canSaveCustomConnector = Boolean(
    customConnectorForm.name.trim() && customConnectorForm.url.trim(),
  );

  const title = activeNav === 'new-task'
    ? (workContentTab === 'code-dev' ? '今天要开发什么？' : '今天有什么工作要处理？')
    : `要处理哪些${NAV_ITEMS.find((item) => item.key === activeNav)?.label || '工作'}？`;
  const activeSideLabel = useMemo(() => {
    const allSideItems = [...PINNED_ITEMS, ...sidebarSpaceItems, ...SPACE_CONVERSATION_ITEMS, ...RECENT_ITEMS];
    return allSideItems.find((item) => item.key === activeSideItem)?.label || '';
  }, [activeSideItem, sidebarSpaceItems]);
  const sidebarSearchItems = useMemo(() => {
    const normalizedKeyword = sidebarTaskSearch.trim().toLowerCase();
    const allSideItems = [
      ...PINNED_ITEMS.map((item) => ({ ...item, group: '置顶' })),
      ...sidebarSpaceItems.map((item) => ({ ...item, group: '空间' })),
      ...SPACE_CONVERSATION_ITEMS.map((item) => ({ ...item, group: '空间会话' })),
      ...RECENT_ITEMS.map((item) => ({ ...item, group: '最近' })),
    ];
    if (!normalizedKeyword) return allSideItems;
    return allSideItems.filter((item) => (
      `${item.label} ${item.group}`.toLowerCase().includes(normalizedKeyword)
    ));
  }, [sidebarSpaceItems, sidebarTaskSearch]);
  const hasSidebarTaskFilter = sidebarTaskStatusFilter !== 'all' || sidebarTaskTimeFilter !== 'all';
  const isFileQueryConversation = activeNav === 'new-task' && activeSideItem === 'file-types';

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (spaceSidebarLoadedRef.current || spaceScenes.length > 0 || spaceLoading) return undefined;
    spaceSidebarLoadedRef.current = true;
    const loadTimer = window.setTimeout(() => {
      loadAiSpaceData();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadAiSpaceData, spaceLoading, spaceScenes.length]);

  useEffect(() => {
    if (activeNav !== 'space') return undefined;
    const loadTimer = window.setTimeout(() => {
      loadAiSpaceData();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [activeNav, loadAiSpaceData]);

  useEffect(() => {
    const eventName = sceneApi.getStoreEventName?.();
    if (!eventName) {
      return undefined;
    }
    const handleStoreChange = () => loadAiSpaceData(false);
    window.addEventListener(eventName, handleStoreChange);
    return () => {
      window.removeEventListener(eventName, handleStoreChange);
    };
  }, [loadAiSpaceData]);

  useEffect(() => {
    if (activeNav !== 'space' || !activeSpace) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById('root')?.scrollTo({ top: 0, left: 0 });
      mainRef.current?.scrollTo({ top: 0, left: 0 });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeNav, activeSpace]);

  useEffect(() => () => {
    if (sidePanelTimerRef.current) {
      window.clearTimeout(sidePanelTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      updateSidebarWidth(sidebarWidthRef.current);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [updateSidebarWidth]);

  useEffect(() => {
    if (!sidebarResizing) return undefined;

    const handlePointerMove = (event) => {
      const resizeStart = sidebarResizeStartRef.current;
      if (!resizeStart) return;
      updateSidebarWidth(resizeStart.width + event.clientX - resizeStart.pointerX);
    };

    const handlePointerUp = () => {
      setSidebarResizing(false);
      persistTdWorkSidebarWidth(sidebarWidthRef.current);
      sidebarResizeStartRef.current = null;
    };

    document.documentElement.classList.add('td-work-is-resizing');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.documentElement.classList.remove('td-work-is-resizing');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [sidebarResizing, updateSidebarWidth]);

  useEffect(() => {
    if (!sidePanelResizing) return undefined;

    const handlePointerMove = (event) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect?.width) return;
      const nextRatio = ((event.clientX - rect.left) / rect.width) * 100;
      setSidePanelPrimaryRatio(clampSidePanelRatio(nextRatio));
    };

    const handlePointerUp = () => {
      setSidePanelResizing(false);
    };

    document.documentElement.classList.add('td-work-is-resizing');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.documentElement.classList.remove('td-work-is-resizing');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [clampSidePanelRatio, sidePanelResizing]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!composerRef.current?.contains(event.target)) {
        setOpenPanel(null);
      }
      if (!createMenuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!customConnectorOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCustomConnectorOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [customConnectorOpen]);

  const handleSend = () => {
    const value = prompt.trim();
    if (!value) {
      setToast('先输入一个问题或任务');
      return;
    }
    setToast(activeNav === 'scheduled' ? '已创建自动化' : '已创建工作任务');
    setPrompt('');
  };

  const handleQuickPrompt = (item) => {
    setPrompt(item.prompt);
    setToast(`已填入：${item.label}`);
  };

  const handleSelectTool = (item) => {
    setOpenPanel((current) => (current === item.key ? null : item.key));
    if (item.key === 'space' && spaceScenes.length === 0 && !spaceLoading) {
      loadAiSpaceData();
    }
    if (item.key !== 'task') setToast(`已打开${item.label}`);
  };

  const handleTaskTargetChange = useCallback((item) => {
    setTaskTargetKey(item.key);
    setOpenPanel(null);
    setToast(`工作任务已切换到${item.place}`);
  }, []);

  const handleComposerSpaceChange = useCallback((scene) => {
    setSelectedComposerSpaceId(scene.id);
    setOpenPanel(null);
    setToast(`已选择空间：${scene.name}`);
  }, []);

  const handleComposerAgentChange = useCallback((agent) => {
    setSelectedComposerAgentKey(agent.selectionKey);
    setOpenPanel(null);
    setToast(`已选择智能体：${agent.name}`);
  }, []);

  const handleToggleComposerSkill = useCallback((key) => {
    setSelectedComposerSkillKeys((current) => (
      current.includes(key)
        ? current.filter((itemKey) => itemKey !== key)
        : [...current, key]
    ));
  }, []);

  const handleToggleSkill = (item) => {
    const isEnabled = enabledSkillKeys.has(item.key);
    setEnabledSkillKeys((current) => {
      const next = new Set(current);
      if (isEnabled) {
        next.delete(item.key);
      } else {
        next.add(item.key);
      }
      return next;
    });
    setToast(`${isEnabled ? '已关闭' : '已开启'}：${item.name}`);
  };

  const handleOpenCustomConnector = () => {
    setCreateMenuOpen(false);
    setCustomConnectorOpen(true);
  };

  const handleCancelCustomConnector = () => {
    setCustomConnectorOpen(false);
  };

  const handleChangeCustomConnector = (patch) => {
    setCustomConnectorForm((current) => ({ ...current, ...patch }));
  };

  const handleAddCustomHeader = () => {
    setCustomConnectorForm((current) => ({
      ...current,
      headers: [...current.headers, { id: `header-${Date.now()}`, key: '', value: '' }],
    }));
  };

  const handleUpdateCustomHeader = (index, patch) => {
    setCustomConnectorForm((current) => ({
      ...current,
      headers: current.headers.map((header, currentIndex) => (
        currentIndex === index ? { ...header, ...patch } : header
      )),
    }));
  };

  const handleRemoveCustomHeader = (index) => {
    setCustomConnectorForm((current) => ({
      ...current,
      headers: current.headers.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSaveCustomConnector = () => {
    if (!canSaveCustomConnector) return;
    const key = `custom-connector-${Date.now()}`;
    const connector = {
      key,
      name: customConnectorForm.name.trim(),
      desc: `${customConnectorForm.transport} 自定义服务：${customConnectorForm.url.trim()}`,
      category: '自定义',
      logo: customConnectorForm.name.trim().slice(0, 1).toUpperCase(),
      tone: 'mint',
      enabled: true,
    };
    setCustomConnectors((current) => [connector, ...current]);
    setEnabledSkillKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    setCustomConnectorOpen(false);
    setCustomConnectorForm(createCustomConnectorForm());
    setSkillView('mine');
    setMySkillTab('connectors');
    setToast(`已保存自定义连接器：${connector.name}`);
  };

  const handleOpenNewTask = useCallback((mode = 'work-task') => {
    setActiveNav('new-task');
    setActiveSideItem('');
    setWorkContentTab(mode);
    setActiveProject(null);
    setActiveSpace(null);
    setActivePartner(null);
    setPartnerView('workspace');
    setCreateMenuOpen(false);
    setPartnerPickerOpen(false);
    closeSidePanel(true);
  }, [closeSidePanel]);

  const handleCreateTaskFromHome = useCallback((nextPrompt) => {
    setPrompt(nextPrompt);
    handleOpenNewTask('work-task');
  }, [handleOpenNewTask]);

  const handleMarketplaceNavigate = useCallback((nextNav) => {
    setActiveNav(nextNav);
    setActiveSideItem('');
    setCreateMenuOpen(false);
    setPartnerPickerOpen(false);
    closeSidePanel(true);
  }, [closeSidePanel]);

  const handleOpenHomeFromNewTask = useCallback(() => {
    setHomeSessionKey((current) => current + 1);
    setPrompt('');
    handleMarketplaceNavigate('home');
  }, [handleMarketplaceNavigate]);

  const handleSidebarSearchOpenChange = (open) => {
    setSidebarSearchOpen(open);
    if (open) setSidebarFilterOpen(false);
  };

  const handleSidebarFilterOpenChange = (open) => {
    setSidebarFilterOpen(open);
    if (open) setSidebarSearchOpen(false);
  };

  const handleOpenSidebarSearchItem = (item) => {
    setSidebarSearchOpen(false);
    setSidebarTaskSearch('');
    if (item.kind === 'space') {
      setActiveSideItem(item.key);
      setActiveNav('space');
      setActiveProject(null);
      setActivePartner(null);
      setPartnerView('workspace');
      handleOpenAiSpace(item.scene);
      return;
    }
    if (item.kind === 'space-session') {
      const linkedScene = spaceScenes.find((scene) => scene.id === item.sceneId);
      setActiveSideItem(item.key);
      setActiveNav('new-task');
      setWorkContentTab('work-task');
      if (linkedScene) {
        setSelectedComposerSpaceId(linkedScene.id);
      }
      setToast(linkedScene ? `已打开${linkedScene.name}的会话数据` : '已打开空间会话数据');
      return;
    }
    setActiveSideItem(item.key);
    setActiveNav('new-task');
    setWorkContentTab('work-task');
  };

  const renderSidebarFilterOption = (item, activeKey, onSelect) => {
    const selected = activeKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        className={`td-work-sidebar-filter-option ${selected ? 'is-selected' : ''}`}
        role="menuitemradio"
        aria-checked={selected}
        onClick={() => onSelect(item.key)}
      >
        <span>{item.label}</span>
        {selected ? <CheckOutlined /> : null}
      </button>
    );
  };

  const sidebarSearchPanel = (
    <div className="td-work-sidebar-search-menu" role="dialog" aria-label="搜索任务">
      <Input
        autoFocus
        allowClear
        value={sidebarTaskSearch}
        prefix={<SearchOutlined />}
        placeholder="搜索任务"
        onChange={(event) => setSidebarTaskSearch(event.target.value)}
      />
      <div className="td-work-sidebar-search-list">
        {sidebarSearchItems.length ? (
          sidebarSearchItems.map((item) => (
            <button
              key={`${item.group}-${item.key}`}
              type="button"
              className="td-work-sidebar-search-row"
              onClick={() => handleOpenSidebarSearchItem(item)}
            >
              <span className={`td-work-small-icon td-work-small-icon-${item.tone}`}>{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <em>{item.group}</em>
              </span>
            </button>
          ))
        ) : (
          <div className="td-work-sidebar-search-empty">没有找到匹配任务</div>
        )}
      </div>
    </div>
  );

  const sidebarFilterPanel = (
    <div className="td-work-sidebar-filter-menu" role="menu" aria-label="任务筛选">
      <div className="td-work-sidebar-filter-title">筛选状态</div>
      <div className="td-work-sidebar-filter-options">
        {SIDEBAR_TASK_STATUS_FILTERS.map((item) => (
          renderSidebarFilterOption(item, sidebarTaskStatusFilter, setSidebarTaskStatusFilter)
        ))}
      </div>
      <div className="td-work-sidebar-filter-divider" />
      <div className="td-work-sidebar-filter-title">筛选时间</div>
      <div className="td-work-sidebar-filter-options">
        {SIDEBAR_TASK_TIME_FILTERS.map((item) => (
          renderSidebarFilterOption(item, sidebarTaskTimeFilter, setSidebarTaskTimeFilter)
        ))}
      </div>
      <div className="td-work-sidebar-filter-divider" />
      <button
        type="button"
        className="td-work-sidebar-filter-reset"
        disabled={!hasSidebarTaskFilter}
        onClick={() => {
          setSidebarTaskStatusFilter('all');
          setSidebarTaskTimeFilter('all');
        }}
      >
        重置筛选条件
      </button>
    </div>
  );

  const handleOpenNewTaskFromCollapsedTopbar = () => {
    setPrompt('');
    handleOpenNewTask('work-task');
  };

  const topbarSidebarCollapsedTools = sidebarCollapsed ? (
    <div className="td-work-collapsed-top-tools" aria-label="侧栏已收起工具">
      <button
        type="button"
        className="td-work-top-icon"
        title="展开侧栏"
        aria-label="展开侧栏"
        onClick={() => setSidebarCollapsed(false)}
      >
        <SidebarToggleIcon />
      </button>
      <button
        type="button"
        className="td-work-top-icon"
        title="新工作任务"
        aria-label="新工作任务"
        onClick={handleOpenNewTaskFromCollapsedTopbar}
      >
        <PlusOutlined />
      </button>
    </div>
  ) : null;
  const hideSpaceListTopbar = activeNav === 'space' && !activeSpace && !sidebarCollapsed;
  const hideMarketplaceTopbar = ['home', 'resource-market', 'app-market', 'academy', 'expert-studios'].includes(activeNav);
  const hideTopbar = hideSpaceListTopbar || hideMarketplaceTopbar;

  return (
    <div
      className={`td-work-module ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''} ${sidebarResizing ? 'is-sidebar-resizing' : ''}`}
      style={{ '--sidebar-width': `${sidebarWidth}px` }}
    >
      <aside className="td-work-sidebar" aria-label="工作导航">
        <div className="td-work-sidebar-toolbar" aria-label="侧栏工具">
          <div className="td-work-sidebar-window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="td-work-sidebar-tool-actions">
            <button
              type="button"
              className="td-work-side-icon-btn"
              title="收起左侧边栏"
              aria-label="收起左侧边栏"
              onClick={() => {
                setSidebarSearchOpen(false);
                setSidebarFilterOpen(false);
                setSidebarCollapsed(true);
              }}
            >
              <SidebarToggleIcon />
            </button>
            <Dropdown
              trigger={['click']}
              open={sidebarSearchOpen}
              onOpenChange={handleSidebarSearchOpenChange}
              popupRender={() => sidebarSearchPanel}
              placement="bottomRight"
              classNames={{ root: 'td-work-sidebar-search-dropdown' }}
              destroyOnHidden
            >
              <button
                type="button"
                className={`td-work-side-icon-btn ${sidebarSearchOpen ? 'is-active' : ''}`}
                title="搜索任务"
                aria-label="搜索任务"
              >
                <SearchOutlined />
              </button>
            </Dropdown>
            <Dropdown
              trigger={['click']}
              open={sidebarFilterOpen}
              onOpenChange={handleSidebarFilterOpenChange}
              popupRender={() => sidebarFilterPanel}
              placement="bottomRight"
              classNames={{ root: 'td-work-sidebar-filter-dropdown' }}
              destroyOnHidden
            >
              <button
                type="button"
                className={`td-work-side-icon-btn ${sidebarFilterOpen || hasSidebarTaskFilter ? 'is-active' : ''}`}
                title="筛选任务"
                aria-label="筛选任务"
              >
                <FilterOutlined />
              </button>
            </Dropdown>
          </div>
        </div>

        <div className="td-work-sidebar-head">
          <div className="td-work-app-name">
            <img src={tongdaLogo} alt="通答" />
          </div>
        </div>

        <button
          type="button"
          className="td-work-new-task-entry"
          onClick={handleOpenHomeFromNewTask}
        >
          <PlusOutlined />
          <span>新建任务</span>
        </button>

        <nav className="td-work-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <div key={item.key} className="td-work-nav-block">
              <button
                type="button"
                className={`td-work-nav-item ${activeNav === item.key ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveNav(item.key);
                  setActiveSideItem('');
                  setCreateMenuOpen(false);
                  setPartnerPickerOpen(false);
                  if (item.key === 'project') {
                    setActiveProject(null);
                  }
                  if (item.key === 'space') {
                    setActiveSpace(null);
                    setSpaceSearch('');
                    setSpaceMenuFilter(null);
                    setSpaceOwnershipTab('created');
                  }
                  closeSidePanel(true);
                  if (item.key === 'dialog') {
                    setActivePartner(null);
                    setPartnerView('workspace');
                  }
                }}
                title={item.label}
              >
                <span className="td-work-nav-icon">{activeNav === item.key ? item.activeIcon : item.icon}</span>
                <span className="td-work-nav-label">{item.label}</span>
              </button>
            </div>
          ))}
        </nav>

        <div className="td-work-sidebar-scroll">
          <SidebarSection title="置顶">
            {PINNED_ITEMS.map((item) => (
              <SmallItem
                key={item.key}
                item={item}
                active={activeSideItem === item.key}
                onClick={() => {
                  setActiveSideItem(item.key);
                  setActiveNav('new-task');
                  setWorkContentTab('work-task');
                }}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="空间">
            {sidebarSpaceItems.length ? (
              sidebarSpaceItems.map((item) => (
                <SmallItem
                  key={item.key}
                  item={item}
                  active={activeSideItem === item.key}
                  onClick={() => handleOpenSidebarSearchItem(item)}
                />
              ))
            ) : (
              <div className="td-work-side-empty">空间加载中...</div>
            )}
            <div className="td-work-side-subtitle">会话数据</div>
            {SPACE_CONVERSATION_ITEMS.map((item) => (
              <SmallItem
                key={item.key}
                item={item}
                active={activeSideItem === item.key}
                onClick={() => handleOpenSidebarSearchItem(item)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="最近">
            {RECENT_ITEMS.map((item) => (
              <SmallItem
                key={item.key}
                item={item}
                active={activeSideItem === item.key}
                onClick={() => {
                  setActiveSideItem(item.key);
                  setActiveNav('new-task');
                  setWorkContentTab('work-task');
                }}
              />
            ))}
          </SidebarSection>
        </div>

        <LuckyUserMenuTrigger
          accountMenu={accountMenu}
          accountMenuOpen={accountMenuOpen}
          onAccountMenuOpenChange={onAccountMenuOpenChange}
        />
      </aside>
      {!sidebarCollapsed ? (
        <div
          className="td-work-sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整侧栏宽度"
          aria-valuemin={TD_WORK_SIDEBAR_MIN_WIDTH}
          aria-valuemax={TD_WORK_SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          tabIndex={0}
          onPointerDown={handleSidebarResizeStart}
          onKeyDown={handleSidebarResizeKeyDown}
        />
      ) : null}

      <main
        ref={mainRef}
        className={`td-work-main ${sidePanelMounted ? 'has-side-panel' : ''} ${sidePanelIsExpanded ? 'is-side-panel-open' : ''} ${sidePanelClosing ? 'is-side-panel-closing' : ''} ${sidePanelResizing ? 'is-side-panel-resizing' : ''}`}
        style={{ '--td-work-primary-size': `${sidePanelPrimaryRatio}%` }}
      >
        <section className="td-work-primary-pane" aria-label="主工作区">
        <header className={`td-work-topbar ${hideTopbar ? 'is-hidden' : ''} ${activeNav === 'skills' ? 'is-skill-topbar' : ''} ${activeNav === 'skills' && skillView === 'mine' ? 'is-my-skill-topbar' : ''} ${activeNav === 'dialog' ? 'is-partner-topbar' : ''} ${activeNav === 'dialog' && activePartner ? 'is-partner-workspace-topbar' : ''} ${activeNav === 'dialog' && partnerView === 'manage' ? 'is-partner-manage-topbar' : ''} ${activeNav === 'scheduled' ? 'is-schedule-topbar' : ''} ${activeNav === 'project' ? 'is-project-topbar' : ''} ${activeNav === 'space' ? 'is-space-topbar' : ''} ${activeNav === 'space' && activeSpace ? 'is-space-detail-topbar' : ''} ${hideMarketplaceTopbar ? 'is-marketplace-topbar' : ''} ${activeNav === 'cloud' ? 'is-resource-library-topbar' : ''}`}>
          {activeNav === 'dialog' && partnerView === 'manage' ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-partner-workspace-breadcrumb" aria-label="当前位置">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerView('workspace');
                    setPartnerManageSearch('');
                  }}
                >
                  智能体对话
                </button>
                <span>›</span>
                <strong>管理</strong>
              </div>
            </>
          ) : activeNav === 'dialog' && activePartner ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-partner-workspace-breadcrumb" aria-label="当前位置">
                <button
                  type="button"
                  onClick={() => {
                    setActivePartner(null);
                    setPartnerView('workspace');
                    setPartnerPickerOpen(false);
                  }}
                >
                  智能体对话
                </button>
                <span>›</span>
                {partnerView === 'detail' || partnerView === 'squad-detail' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerView('workspace');
                        setPartnerPickerOpen(false);
                      }}
                    >
                      {activePartner.name}
                    </button>
                    <span>›</span>
                    <strong>{partnerView === 'squad-detail' ? '小队详情' : '详情'}</strong>
                  </>
                ) : (
                  <strong>{activePartner.name}</strong>
                )}
              </div>
              {partnerView === 'detail' ? (
                <button
                  type="button"
                  className="td-work-partner-detail-more"
                  title="更多"
                  aria-label="更多"
                  onClick={() => setToast('已打开智能体详情更多操作')}
                >
                  <MoreOutlined />
                </button>
              ) : null}
            </>
          ) : activeNav === 'dialog' ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-dialog-titlebar-copy">
                <strong>智能体对话</strong>
                <span>内容由豆包 AI 生成</span>
              </div>
              <button
                type="button"
                className="td-work-dialog-manage-btn"
                onClick={() => {
                  setActivePartner(null);
                  setPartnerView('manage');
                  setPartnerManageTab('agents');
                  setPartnerManageSearch('');
                }}
              >
                <ControlOutlined />
                管理
              </button>
            </>
          ) : activeNav === 'cloud' ? null : ['home', 'resource-market', 'app-market'].includes(activeNav) ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-dialog-titlebar-copy">
                <strong>{activeNav === 'home' ? '首页' : activeNav === 'resource-market' ? '资源广场' : '应用广场'}</strong>
                <span>{activeNav === 'home' ? 'AI 教学创作与精选内容' : activeNav === 'resource-market' ? '发现并复用优质教学资源' : '发现可直接使用的教育应用'}</span>
              </div>
              {activeNav !== 'home' ? (
                <button
                  type="button"
                  className="td-work-dialog-manage-btn"
                  onClick={() => handleMarketplaceNavigate('home')}
                >
                  <HomeOutlined />
                  返回首页
                </button>
              ) : null}
            </>
          ) : activeNav === 'academy' ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-dialog-titlebar-copy">
                <strong>通答学院</strong>
                <span>课程、资源、应用与培训项目入口</span>
              </div>
              <button
                type="button"
                className="td-work-dialog-manage-btn"
                onClick={handleOpenTongdaAcademySpaces}
              >
                <CloudOutlined />
                学院项目
              </button>
            </>
          ) : activeNav === 'expert-studios' ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-dialog-titlebar-copy">
                <strong>专家工作室</strong>
                <span>AI素养指导团队与共创教研室</span>
              </div>
            </>
          ) : activeNav === 'scheduled' ? (
            <>
              {topbarSidebarCollapsedTools}
              <button type="button" className="td-work-schedule-new-btn" onClick={() => setToast('已进入新建自动化')}>
                <PlusOutlined />
                新建
              </button>
            </>
          ) : activeNav === 'project' ? (
            <>
              {topbarSidebarCollapsedTools}
              {activeProject ? (
                <>
                  <div className="td-work-project-top-breadcrumb" aria-label="当前位置">
                    <button type="button" onClick={() => setActiveProject(null)}>
                      项目
                    </button>
                    <span>›</span>
                    <strong>{activeProject.name}</strong>
                  </div>
                  <button type="button" className="td-work-project-invite-btn" onClick={() => setToast('已打开项目邀请')}>
                    邀请
                  </button>
                </>
              ) : (
                <div className="td-work-project-top-tools">
                  <button type="button" className="td-work-top-icon" title="搜索项目" aria-label="搜索项目" onClick={() => setToast('已聚焦项目搜索')}>
                    <SearchOutlined />
                  </button>
                  <button type="button" className="td-work-top-icon" title="筛选项目" aria-label="筛选项目" onClick={() => setToast('已打开项目筛选')}>
                    <FilterOutlined />
                  </button>
                </div>
              )}
            </>
          ) : activeNav === 'space' ? (
            <>
              {activeSpace ? null : topbarSidebarCollapsedTools}
            </>
          ) : activeNav === 'skills' && skillView === 'mine' ? (
            <>
              {topbarSidebarCollapsedTools}
              <div className="td-work-skill-breadcrumb" aria-label="当前位置">
                <button type="button" onClick={() => setSkillView(mySkillTab === 'connectors' ? 'market' : 'skills')}>
                  {mySkillTab === 'connectors' ? '连接器' : '技能'}
                </button>
                <span>›</span>
                <strong>{mySkillTab === 'connectors' ? '我的连接器' : '我的技能'}</strong>
              </div>

              <div className="td-work-skill-actions">
                <label className="td-work-skill-search td-work-my-skill-search" htmlFor="td-work-my-skill-search">
                  <SearchOutlined />
                  <input
                    id="td-work-my-skill-search"
                    value={mySkillSearch}
                    placeholder="搜索技能"
                    onChange={(event) => setMySkillSearch(event.target.value)}
                  />
                </label>
                <SkillCreateMenu
                  open={createMenuOpen}
                  menuRef={createMenuRef}
                  onToggle={setCreateMenuOpen}
                  onChatCreate={() => {
                    setCreateMenuOpen(false);
                    setToast('已进入对话新建技能');
                  }}
                  onUpload={() => {
                    setCreateMenuOpen(false);
                    setToast('已进入上传技能');
                  }}
                  onCustomConnector={handleOpenCustomConnector}
                />
                <button
                  type="button"
                  className="td-work-skill-refresh-btn"
                  title="刷新"
                  aria-label="刷新"
                  onClick={() => setToast('已刷新我的技能')}
                >
                  <ReloadOutlined />
                </button>
              </div>
            </>
          ) : activeNav === 'skills' ? (
            <>
              {topbarSidebarCollapsedTools}
              <SkillHubTabs activeView={skillView} onChange={handleSkillHubViewChange} />

              <div className="td-work-skill-actions">
                <label
                  className="td-work-skill-search"
                  htmlFor={`td-work-${skillView}-search`}
                >
                  <SearchOutlined />
                  <input
                    id={`td-work-${skillView}-search`}
                    value={skillView === 'partners' ? partnerMarketSearch : connectorSearch}
                    placeholder={skillView === 'partners' ? '搜索智能体' : skillView === 'skills' ? '搜索技能' : '搜索连接器'}
                    onChange={(event) => {
                      if (skillView === 'partners') {
                        setPartnerMarketSearch(event.target.value);
                        return;
                      }
                      setConnectorSearch(event.target.value);
                    }}
                  />
                </label>
                {skillView === 'partners' ? (
                  <button
                    type="button"
                    className="td-work-skill-action-btn"
                    onClick={() => {
                      setActiveNav('dialog');
                      setActivePartner(null);
                      setPartnerView('manage');
                      setPartnerManageTab('agents');
                      setPartnerManageSearch('');
                    }}
                  >
                    <TeamOutlined />
                    我的智能体
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="td-work-skill-action-btn"
                      onClick={() => {
                        setSkillView('mine');
                        setMySkillTab(skillView === 'market' ? 'connectors' : 'skills');
                        setMySkillSearch('');
                      }}
                    >
                      {skillView === 'market' ? <LinkOutlined /> : <ControlOutlined />}
                      {skillView === 'market' ? '我的连接器' : '我的技能'}
                    </button>
                    <SkillCreateMenu
                      open={createMenuOpen}
                      menuRef={createMenuRef}
                      onToggle={setCreateMenuOpen}
                      onChatCreate={() => {
                        setCreateMenuOpen(false);
                        setToast('已进入对话新建技能');
                      }}
                      onUpload={() => {
                        setCreateMenuOpen(false);
                        setToast('已进入上传技能');
                      }}
                      onCustomConnector={handleOpenCustomConnector}
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {topbarSidebarCollapsedTools}
              {activeSideLabel && activeSideItem !== 'main-dialog' ? (
                <div className="td-work-task-titlebar">
                  <strong>{activeSideLabel}</strong>
                  <span><FolderOutlined /> zhanghl的MacBook Pro</span>
                </div>
              ) : null}
              <div className="td-work-top-actions">
                <button type="button" className="td-work-top-icon" title="刷新" aria-label="刷新">
                  <ClockCircleOutlined />
                </button>
                <button
                  type="button"
                  className={`td-work-top-icon td-work-browser-toggle ${sidePanelIsExpanded ? 'is-active' : ''}`}
                  title={sidePanelIsExpanded ? '关闭右侧面板' : '打开右侧面板'}
                  aria-label={sidePanelIsExpanded ? '关闭右侧面板' : '打开右侧面板'}
                  onClick={handleToggleSidePanel}
                >
                  <SidebarToggleIcon />
                </button>
              </div>
            </>
          )}
        </header>

        {activeNav === 'home' ? (
          <AiModeHomePage
            key={homeSessionKey}
            onCreateTask={handleCreateTaskFromHome}
            onNavigate={handleMarketplaceNavigate}
            onOpenItem={(item) => setToast(`已打开：${item.title}`)}
          />
        ) : activeNav === 'resource-market' ? (
          <MarketplacePage
            key="resource-market"
            type="resource"
            onCreate={handleCreateTaskFromHome}
          />
        ) : activeNav === 'app-market' ? (
          <MarketplacePage
            key="app-market"
            type="app"
            onCreate={handleCreateTaskFromHome}
          />
        ) : activeNav === 'project' ? (
          <ProjectsPage
            activeProject={activeProject}
            onOpenProject={(item) => setActiveProject(item)}
            onCreateProject={() => setToast('已进入新建项目')}
            onTemplateCreate={(item) => setToast(`已使用模板：${item.name}`)}
            onToast={setToast}
          />
        ) : activeNav === 'space' ? (
          <SpacesPage
            currentGroups={spaceMenuNavigationGroups}
            visibleGroups={visibleSpaceGroups}
            loading={spaceLoading}
            searchText={spaceSearch}
            activeSpace={activeSpace}
            activeGroupKey={effectiveSpaceMenuFilter}
            ownershipTab={effectiveSpaceOwnershipTab}
            ownershipOptions={spaceOwnershipSegmentOptions}
            summary={spaceOwnershipSummary}
            emptyDescription={spaceEmptyDescription}
            title={aiSpaceHomeTitle}
            onSearchChange={setSpaceSearch}
            onGroupChange={setSpaceMenuFilter}
            onOwnershipChange={setSpaceOwnershipTab}
            onOpenSpace={handleOpenAiSpace}
            onBack={() => setActiveSpace(null)}
            onCreateSpace={handleOpenAiSpaceCreate}
            onEditSpace={handleEditAiSpace}
            onDeleteSpace={handleDeleteAiSpace}
            onToggleShortcut={handleToggleAiSpaceShortcut}
          />
        ) : activeNav === 'academy' ? (
          <TongdaAcademyPage
            onOpenSpace={handleOpenTongdaAcademySpaces}
            onToast={setToast}
          />
        ) : activeNav === 'expert-studios' ? (
          <ExpertStudiosPage onToast={setToast} />
        ) : activeNav === 'skills' && skillView === 'mine' ? (
          <MySkillsPage
            activeTab={mySkillTab}
            searchText={mySkillSearch}
            skills={MY_SKILLS}
            connectors={ownedConnectors}
            enabledSkillKeys={enabledSkillKeys}
            onTabChange={setMySkillTab}
            onOpenSkill={(item) => setToast(`已打开 guoren-v2：${item.name}`)}
            onToggleSkill={handleToggleSkill}
          />
        ) : activeNav === 'skills' && skillView === 'partners' ? (
          <PartnerMarketPage
            activeCategory={partnerMarketCategory}
            searchText={partnerMarketSearch}
            onCategoryChange={setPartnerMarketCategory}
            onAddPartner={(item) => setToast(`已添加智能体：${item.name}`)}
          />
        ) : activeNav === 'skills' && skillView === 'skills' ? (
          <SkillCataloguePage
            searchText={connectorSearch}
            skills={MY_SKILLS}
            onOpenSkill={(item) => setToast(`已添加技能：${item.name}`)}
          />
        ) : activeNav === 'skills' ? (
          <SkillsConnectorsPage
            activeCategory={activeCategory}
            searchText={connectorSearch}
            connectors={visibleConnectors}
            onCategoryChange={setActiveCategory}
            onSearchChange={setConnectorSearch}
            onAddConnector={(item) => setToast(`已添加：${item.name}`)}
          />
        ) : activeNav === 'dialog' ? (
          partnerView === 'manage' ? (
            <PartnerManagePage
              activeTab={partnerManageTab}
              searchText={partnerManageSearch}
              partners={availableWorkPartners}
              teams={availableWorkTeams}
              onTabChange={setPartnerManageTab}
              onSearchChange={setPartnerManageSearch}
              onCreate={(label) => setToast(`已进入：${label}`)}
              onCreateTask={() => {
                const partner = availableWorkPartners[0] || WORK_PARTNERS[0];
                setActivePartner(partner);
                setPartnerView('workspace');
                setPartnerWorkTab('tasks');
                setPartnerWorkSearch('');
                setPartnerPrompt('');
                setPartnerPickerOpen(false);
                setPartnerDetailTab('profile');
                setToast(`已进入${partner.name}对话，可创建任务`);
              }}
              onCreateAutomation={(mode) => {
                if (mode === 'chat') {
                  const partner = availableWorkPartners[0] || WORK_PARTNERS[0];
                  setActivePartner(partner);
                  setPartnerView('workspace');
                  setPartnerWorkTab('automation');
                  setPartnerWorkSearch('');
                  setPartnerPrompt('帮我创建一个面向教师研修工作的自动化流程。');
                  setPartnerPickerOpen(false);
                  setPartnerDetailTab('profile');
                  setToast(`已进入${partner.name}对话，可创建自动化`);
                  return;
                }
                setToast('已进入手动创建自动化');
              }}
              onOpenPartner={openPartnerWorkspace}
              onOpenPartnerMore={openPartnerMore}
              onDeletePartner={deletePartner}
              onOpenTask={(item) => setToast(`已打开任务：${item.title}`)}
            />
          ) : activePartner && partnerView === 'squad-detail' ? (
            <PartnerSquadDetailPage
              squad={activePartner}
              onBack={() => {
                setActivePartner(null);
                setPartnerView('workspace');
              }}
              onAddPartner={() => setToast(`已进入添加智能体：${activePartner.name}`)}
              onCreateTask={() => {
                setPartnerView('workspace');
                setPartnerWorkTab('tasks');
                setPartnerWorkSearch('');
                setPartnerPrompt('');
                setPartnerPickerOpen(false);
                setToast(`已进入${activePartner.name}新任务`);
              }}
            />
          ) : activePartner && partnerView === 'detail' ? (
            <PartnerDetailPage
              partner={activePartner}
              activeTab={partnerDetailTab}
              onTabChange={setPartnerDetailTab}
              onGoChat={() => {
                setPartnerView('workspace');
                setToast(`已回到${activePartner.name}对话`);
              }}
              onAddGroup={() => setToast(`已进入添加群组：${activePartner.name}`)}
              onAddKnowledge={() => setToast(`已进入添加知识：${activePartner.name}`)}
              onOpenSkill={(label) => setToast(`已打开：${label}`)}
            />
          ) : activePartner ? (
            <PartnerWorkspacePage
              partner={activePartner}
              partners={availableWorkPartners}
              teams={availableWorkTeams}
              activeTab={partnerWorkTab}
              searchText={partnerWorkSearch}
              prompt={partnerPrompt}
              pickerOpen={partnerPickerOpen}
              onTabChange={setPartnerWorkTab}
              onSearchChange={setPartnerWorkSearch}
              onPromptChange={setPartnerPrompt}
              onPickerOpenChange={setPartnerPickerOpen}
              onSelectPartner={(item) => {
                setActivePartner(item);
                setPartnerPickerOpen(false);
                setPartnerWorkTab('tasks');
                setPartnerWorkSearch('');
                setPartnerPrompt('');
                setPartnerDetailTab('profile');
                setPartnerView('workspace');
                setToast(`已切换到：${item.name}`);
              }}
              onCreatePartner={(label) => {
                setPartnerPickerOpen(false);
                setToast(`已进入：${label}`);
              }}
              onSend={() => {
                if (!partnerPrompt.trim()) {
                  setToast('先输入任务或目标');
                  return;
                }
                setToast(`已交给${activePartner.name}处理`);
                setPartnerPrompt('');
              }}
              onOpenDetail={() => {
                setPartnerPickerOpen(false);
                setPartnerDetailTab('profile');
                setPartnerView('detail');
              }}
              onOpenRecord={(item) => setToast(`已打开：${item.title}`)}
            />
          ) : (
            <PartnerDialogPage
              cards={availablePartnerCards}
              onOpenPartner={(item) => openPartnerWorkspace(item.name ? item : {
                ...(availablePartnerCards[0] || PARTNER_CARDS[0]),
                name: item.title,
                key: item.key,
                avatar: item.avatar,
                tone: item.tone,
              })}
              onOpenPartnerMore={openPartnerMore}
              onDeletePartner={deletePartner}
              onCreatePartner={(label) => setToast(`已进入：${label}`)}
            />
          )
        ) : activeNav === 'cloud' ? (
          <section className="td-work-resource-library-page" aria-label="资料库">
            <ResourceLibrary />
          </section>
        ) : activeNav === 'scheduled' ? (
          <ScheduledTasksPage
            prompt={prompt}
            openPanel={openPanel}
            activeMode={activeMode}
            modeKey={modeKey}
            taskTargetKey={taskTargetKey}
            selectedSpaceId={selectedComposerSpaceId}
            selectedSpace={selectedComposerSpace}
            selectedAgent={selectedComposerAgent}
            selectedAgentKey={selectedComposerAgentKey}
            agents={composerAgents}
            spaces={spaceScenes}
            spacesLoading={spaceLoading}
            selectedSkills={selectedComposerSkills}
            selectedSkillKeys={selectedComposerSkillKeys}
            composerRef={composerRef}
            onPromptChange={setPrompt}
            onSend={handleSend}
            onSelectTemplate={(item) => {
              setPrompt(item.prompt);
              setToast(`已选择：${item.title}`);
            }}
            onSelectTool={handleSelectTool}
            onOpenPanelChange={setOpenPanel}
            onModeChange={setModeKey}
            onTaskTargetChange={handleTaskTargetChange}
            onSpaceChange={handleComposerSpaceChange}
            onAgentChange={handleComposerAgentChange}
            onToggleSkill={handleToggleComposerSkill}
            onToast={setToast}
          />
        ) : (
        <section className={`td-work-work-canvas ${isFileQueryConversation ? 'is-conversation' : ''}`} aria-label="新工作任务">
          {isFileQueryConversation ? (
            <FileQueryConversation />
          ) : (
            <>
              <div className="td-work-center">
                <LuckyMark />
                <h1>{title}</h1>
                {activeNav === 'new-task' && !activeSideItem ? (
                  <div className="td-work-content-tabs" role="tablist" aria-label="新工作任务模式">
                    {WORK_CONTENT_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`td-work-content-tab ${workContentTab === tab.key ? 'is-active' : ''}`}
                        role="tab"
                        aria-selected={workContentTab === tab.key}
                        onClick={() => setWorkContentTab(tab.key)}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="td-work-recommend">
                <div className="td-work-recommend-label">为你推荐</div>
                <div className="td-work-recommend-list">
                  {RECOMMENDATIONS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="td-work-recommend-chip"
                      onClick={() => handleQuickPrompt(item)}
                    >
                      <span className={`td-work-recommend-icon is-${item.tone}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <section className={`td-work-composer-shell ${openPanel === 'skills' ? 'is-skill-menu-open' : ''}`} aria-label="输入工作任务" ref={composerRef}>
            <div className={`td-work-composer ${openPanel === 'skills' ? 'is-skill-menu-open' : ''}`}>
              {openPanel === 'skills' ? (
                <ComposerSkillMenu
                  selectedSkillKeys={selectedComposerSkillKeys}
                  onToggleSkill={handleToggleComposerSkill}
                />
              ) : null}

              {openPanel === 'space' ? (
                <SpaceMenu
                  value={selectedComposerSpaceId}
                  spaces={spaceScenes}
                  loading={spaceLoading}
                  onChange={handleComposerSpaceChange}
                />
              ) : null}

              {openPanel === 'agent' ? (
                <ComposerAgentMenu
                  value={selectedComposerAgentKey}
                  agents={composerAgents}
                  onChange={handleComposerAgentChange}
                />
              ) : null}

              <ComposerPromptArea
                selectedSkills={selectedComposerSkills}
                prompt={prompt}
                placeholder="输入问题或任务，/ 选择技能"
                onPromptChange={setPrompt}
                onSend={handleSend}
                onToggleSkill={handleToggleComposerSkill}
              />

              <div className="td-work-composer-row">
                <div className="td-work-tool-row">
                  <button type="button" className="td-work-add-btn" title="添加附件" aria-label="添加附件">
                    <PlusOutlined />
                  </button>
                  <span className="td-work-divider" />
                  {CONTEXT_TOOLS
                    .filter((item) => !sidePanelOpen || ['task', 'space', 'agent', 'confirm'].includes(item.key))
                    .map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`td-work-tool-chip ${item.active ? 'is-active' : ''} ${openPanel === item.key ? 'is-open' : ''} ${item.key === 'space' && selectedComposerSpace ? 'has-selected-space' : ''} ${item.key === 'agent' && selectedComposerAgent ? 'has-selected-agent' : ''}`}
                      title={item.key === 'space' && selectedComposerSpace ? selectedComposerSpace.name : item.key === 'agent' && selectedComposerAgent ? selectedComposerAgent.name : item.label}
                      onClick={() => handleSelectTool(item)}
                    >
                      <span className={item.sparkle ? 'td-work-spark-icon' : ''}>{item.icon}</span>
                      <span className="td-work-tool-label">
                        {item.key === 'space' && selectedComposerSpace
                          ? selectedComposerSpace.name
                          : item.key === 'agent' && selectedComposerAgent
                            ? selectedComposerAgent.name
                            : item.label}
                      </span>
                      {item.key === 'task' || item.key === 'space' || item.key === 'agent' ? <DownOutlined /> : null}
                    </button>
                  ))}
                </div>

                <div className="td-work-submit-row">
                  <div className="td-work-mode-picker">
                    <button
                      type="button"
                      className="td-work-mode-btn"
                      aria-haspopup="menu"
                      aria-expanded={openPanel === 'mode'}
                      onClick={() => setOpenPanel((current) => (current === 'mode' ? null : 'mode'))}
                    >
                      {activeMode.label}
                      <DownOutlined />
                    </button>
                  </div>
                  <button type="button" className="td-work-voice-btn" title="语音输入" aria-label="语音输入">
                    <AudioOutlined />
                  </button>
                  <button type="button" className="td-work-send-btn" title="发送" aria-label="发送" onClick={handleSend}>
                    <ArrowUpOutlined />
                  </button>
                </div>
              </div>

              {openPanel === 'task' ? (
                <WorkTaskTargetMenu
                  value={taskTargetKey}
                  onChange={handleTaskTargetChange}
                />
              ) : null}

              {openPanel && openPanel !== 'mode' && openPanel !== 'skills' && openPanel !== 'task' && openPanel !== 'space' && openPanel !== 'agent' ? (
                <div className="td-work-popover" role="menu">
                  {(PANEL_CONTENT[openPanel] || []).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (label === '空间') {
                          if (spaceScenes.length === 0 && !spaceLoading) {
                            loadAiSpaceData();
                          }
                          setOpenPanel('space');
                          return;
                        }
                        setPrompt((current) => current || `帮我处理：${label}`);
                        setOpenPanel(null);
                      }}
                    >
                      <CheckOutlined />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {openPanel === 'mode' ? (
                <div className="td-work-popover td-work-mode-popover" role="menu">
                  {MODE_OPTIONS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={modeKey === item.key ? 'is-selected' : ''}
                      onClick={() => {
                        setModeKey(item.key);
                        setOpenPanel(null);
                        setToast(`已切换为 ${item.label}`);
                      }}
                    >
                      <RobotOutlined />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </section>
        )}
        </section>
        {sidePanelMounted ? (
          <div
            className="td-work-side-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整左右区域宽度"
            aria-valuemin={34}
            aria-valuemax={68}
            aria-valuenow={Math.round(sidePanelPrimaryRatio)}
            tabIndex={0}
            onPointerDown={handleSidePanelResizeStart}
            onKeyDown={handleSidePanelResizeKeyDown}
          />
        ) : null}
        {sidePanelMounted ? <WorkBrowserPanel onClose={closeSidePanel} /> : null}
      </main>

      {customConnectorOpen ? (
        <CustomConnectorModal
          form={customConnectorForm}
          canSave={canSaveCustomConnector}
          onChange={handleChangeCustomConnector}
          onAddHeader={handleAddCustomHeader}
          onUpdateHeader={handleUpdateCustomHeader}
          onRemoveHeader={handleRemoveCustomHeader}
          onCancel={handleCancelCustomConnector}
          onSave={handleSaveCustomConnector}
        />
      ) : null}

      <SceneCreateModal
        open={spaceCreateOpen}
        templates={spaceTemplates}
        sceneGroupOptions={spaceSceneGroupOptions}
        initialValues={spaceEditing}
        defaultMenuKey={spaceCreateDefaultMenuKey || undefined}
        defaultSceneGroupName={spaceSceneGroupOptions.length === 1 ? spaceSceneGroupOptions[0].value : undefined}
        mode="space"
        className="td-work-space-create-modal"
        onCancel={handleCancelAiSpaceCreate}
        onSubmit={handleSaveAiSpace}
      />

      <Toast text={toast} />
    </div>
  );
}
