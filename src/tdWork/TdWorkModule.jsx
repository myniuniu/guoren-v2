import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Modal } from 'antd';
import {
  AppstoreOutlined,
  ArrowUpOutlined,
  AudioOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloudOutlined,
  CloudServerOutlined,
  ControlOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DesktopOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  FilterOutlined,
  FolderAddOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  LinkOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './TdWorkModule.css';

const NAV_ITEMS = [
  { key: 'new-task', label: '新工作任务', icon: <EditOutlined /> },
  { key: 'scheduled', label: '定时任务', icon: <ClockCircleOutlined /> },
  { key: 'skills', label: '技能 · 连接器 · 伙伴', icon: <RobotOutlined /> },
  { key: 'dialog', label: '伙伴对话', icon: <MessageOutlined /> },
  { key: 'cloud', label: '资料', icon: <FolderOutlined /> },
];

const PINNED_ITEMS = [
  { key: 'main-dialog', label: '主对话', tone: 'blue', icon: <MessageOutlined /> },
];

const PROJECT_ITEMS = [
  { key: 'local-files', label: '公司本地资料', tone: 'gray', icon: <FolderOutlined /> },
  { key: 'file-types', label: '询问文件种类', tone: 'blue', icon: <FileTextOutlined /> },
];

const RECENT_ITEMS = [
  { key: 'weekly-teaching', label: '周三教研活动纪要', tone: 'blue', icon: <ClockCircleOutlined /> },
  { key: 'training-budget', label: '教师培训经费测算表', tone: 'yellow', icon: <BarChartOutlined /> },
  { key: 'lesson-feedback', label: '课堂观察反馈整理', tone: 'pink', icon: <RobotOutlined /> },
  { key: 'course-polish', label: '研修课程文案润色', tone: 'purple', icon: <EditOutlined /> },
];

const RECOMMENDATIONS = [
  { key: 'routine', label: '处理日常工作', icon: <FileTextOutlined />, tone: 'blue', prompt: '帮我整理今天需要处理的工作任务，并按优先级排序。' },
  { key: 'content', label: '内容创作', icon: <EditOutlined />, tone: 'green', prompt: '帮我起草一篇面向老师的产品更新说明。' },
  { key: 'research', label: '完成调研分析', icon: <BarChartOutlined />, tone: 'purple', prompt: '帮我调研教育智能体在校内工作台中的使用场景。' },
  { key: 'design', label: '设计与创意', icon: <AppstoreOutlined />, tone: 'pink', prompt: '帮我设计一个智能体工作台的首屏交互方案。' },
];

const CONTEXT_TOOLS = [
  { key: 'task', label: '工作任务', icon: <ProjectOutlined />, active: true },
  { key: 'project', label: '项目', icon: <FolderOutlined /> },
  { key: 'confirm', label: '按需确认', icon: <CheckCircleOutlined /> },
  { key: 'knowledge', label: '企业知识', icon: <BookOutlined /> },
  { key: 'skills', label: '更多技能', icon: <MoreOutlined /> },
  { key: 'connectors', label: '连接器', icon: <LinkOutlined />, sparkle: true },
];

const PANEL_CONTENT = {
  task: ['新建待办', '拆分步骤', '生成执行清单'],
  project: ['公司本地资料', '询问文件种类', '产品会议项目'],
  confirm: ['发送前确认', '关键节点确认', '自动推进'],
  knowledge: ['制度文档', '产品资料', '课程素材'],
  skills: ['PPT 生成', '调研分析', '表格处理'],
  connectors: ['本地浏览器', '企业网盘', '飞书消息'],
};

const WORK_TASK_TARGETS = [
  { key: 'local', label: '工作任务', place: '本地电脑', tone: 'blue', icon: <LaptopOutlined /> },
  { key: 'cloud', label: '工作任务', place: '云电脑', tone: 'green', icon: <CloudOutlined /> },
];

const PROJECT_MENU_ITEMS = [
  {
    key: 'company-local',
    label: '公司本地资料',
    shortcut: '⌘ 1',
    icon: <FolderOutlined />,
    suffixIcon: <DesktopOutlined />,
  },
  {
    key: 'create-project',
    label: '创建新项目',
    shortcut: '⌘ 2',
    icon: <PlusOutlined />,
  },
  {
    key: 'add-local-folder',
    label: '添加本地文件夹',
    shortcut: '⌘ 3',
    icon: <FolderAddOutlined />,
  },
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
  { key: 'td-work-workbench', name: 'Lucky 工作助手', desc: '连接 guoren-v2 的任务、伙伴与连接器能力', logo: 'L', tone: 'blue', enabled: true },
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
  { key: 'messages', name: '消息中心', desc: '查看系统通知、伙伴推送和未读提醒', logo: '息', tone: 'green', enabled: true },
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
    name: '教研备课伙伴',
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
const WORK_TEAMS = PARTNER_CARDS.filter((item) => item.tag === '小队');

const PARTNER_MARKET_CATEGORIES = [
  '全部',
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
    owner: '教研备课伙伴',
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

const MATERIAL_VIEWS = [
  { key: 'recent', label: '最近' },
  { key: 'mine', label: '我的' },
  { key: 'shared', label: '共享' },
  { key: 'favorite', label: '收藏' },
];

const MATERIAL_FILES = [
  {
    key: 'training-project',
    title: '教师研修项目管理',
    type: 'space',
    badges: ['外部'],
    owner: '李伶',
    ownerTone: 'pink',
    createdAt: '8月17日 11:33',
    updatedAt: '8月25日 13:28',
  },
  {
    key: 'agent-platform-plan',
    title: '教师培训申请-智能体建设平台-张洪磊',
    type: 'doc',
    badges: [],
    owner: '李伶',
    ownerTone: 'pink',
    createdAt: '8月11日 15:17',
    updatedAt: '8月20日 17:20',
  },
  {
    key: 'course-optimization',
    title: '教师培训申请-优化定稿版-田宇(1)',
    type: 'doc',
    badges: [],
    owner: '李伶',
    ownerTone: 'pink',
    createdAt: '8月11日 14:44',
    updatedAt: '8月11日 14:44',
  },
  {
    key: 'feedback-bug',
    title: '培训平台 Bug 管理',
    type: 'space',
    badges: [],
    owner: '杨金玮',
    ownerTone: 'green',
    createdAt: '8月10日 16:55',
    updatedAt: '8月14日 08:48',
  },
  {
    key: 'topic-resource',
    title: '资料库与主题资料类型说明',
    type: 'doc',
    badges: [],
    owner: '王海鸥',
    ownerTone: 'orange',
    createdAt: '8月10日 09:10',
    updatedAt: '8月10日 09:53',
  },
  {
    key: 'ai-product-plan',
    title: 'AI原生产品底座-产品架构规划蓝图V2',
    type: 'doc',
    badges: [],
    owner: '张洪磊',
    ownerTone: 'orange',
    createdAt: '8月7日 05:27',
    updatedAt: '8月7日 05:28',
  },
  {
    key: 'thinking',
    title: '一些思考',
    type: 'doc',
    badges: [],
    owner: '张洪磊',
    ownerTone: 'orange',
    createdAt: '8月6日 19:33',
    updatedAt: '8月7日 10:16',
  },
  {
    key: 'home',
    title: '首页',
    type: 'doc',
    badges: [],
    owner: '张洪磊',
    ownerTone: 'orange',
    createdAt: '8月6日 19:33',
    updatedAt: '8月6日 19:33',
  },
  {
    key: 'efficiency-upgrade-copy',
    title: '你的首个效率升级包 Copy',
    type: 'space',
    badges: [],
    owner: '多维表格助手',
    ownerTone: 'purple',
    createdAt: '8月2日 18:41',
    updatedAt: '8月2日 18:41',
  },
  {
    key: 'efficiency-upgrade',
    title: '你的首个效率升级包',
    type: 'sheet',
    badges: [],
    owner: '多维表格助手',
    ownerTone: 'purple',
    createdAt: '8月2日 18:41',
    updatedAt: '8月2日 18:41',
  },
  {
    key: 'training-notice',
    title: '培训通知与签到表',
    type: 'doc',
    badges: [],
    owner: '何佳',
    ownerTone: 'sky',
    createdAt: '7月31日 13:17',
    updatedAt: '7月31日 13:17',
  },
  {
    key: 'smart-edu-cloud-doc',
    title: '国家智慧教育平台资源文档',
    type: 'doc',
    badges: [],
    owner: '云文档助手',
    ownerTone: 'blue',
    createdAt: '7月30日 15:27',
    updatedAt: '7月30日 15:27',
  },
  {
    key: 'teacher-growth-template',
    title: '教师成长档案模板',
    type: 'sheet',
    badges: ['模板', '外部'],
    owner: '李天天',
    ownerTone: 'mono',
    createdAt: '3月13日 11:18',
    updatedAt: '3月13日 19:19',
  },
];

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
    <section className="td-work-partner-market-page" aria-label="工作伙伴小队">
      <div className="td-work-partner-market-categories" aria-label="伙伴分类">
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

      <div className="td-work-partner-market-grid" aria-label="伙伴列表">
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
          没有找到与“{searchText}”匹配的工作伙伴
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

function MaterialFileIcon({ type }) {
  const icon = type === 'space'
    ? <AppstoreOutlined />
    : type === 'sheet'
      ? <DatabaseOutlined />
      : <FileTextOutlined />;

  return (
    <span className={`td-work-material-file-icon is-${type}`} aria-hidden="true">
      {icon}
    </span>
  );
}

function MaterialOwnerAvatar({ name, tone }) {
  return (
    <span className="td-work-material-owner">
      <span className={`td-work-material-owner-avatar is-${tone}`} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
      <span>{name}</span>
    </span>
  );
}

function MaterialsPage({
  views,
  activeView,
  filterOpen,
  viewMenuKey,
  renamingKey,
  renameValue,
  onViewChange,
  onAddView,
  onFilterOpenChange,
  onOpenViewMenu,
  onCloseViewMenu,
  onStartRenameView,
  onCommitRenameView,
  onCancelRenameView,
  onRenameValueChange,
  onDeleteView,
  onToast,
}) {
  const filterRef = useRef(null);
  const viewMenuRef = useRef(null);
  const visibleFiles = MATERIAL_FILES.filter((item) => {
    if (activeView === 'mine') return item.owner === '张洪磊';
    if (activeView === 'shared') return item.badges.includes('外部');
    if (activeView === 'favorite') return item.key === 'teacher-growth-template' || item.key === 'training-project';
    return true;
  });

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!filterRef.current?.contains(event.target)) {
        onFilterOpenChange(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [filterOpen, onFilterOpenChange]);

  useEffect(() => {
    if (!viewMenuKey) return undefined;
    const handlePointerDown = (event) => {
      if (!viewMenuRef.current?.contains(event.target)) {
        onCloseViewMenu();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [viewMenuKey, onCloseViewMenu]);

  return (
    <section className="td-work-material-page" aria-label="资料">
      <div className="td-work-material-inner">
        <div className="td-work-material-viewbar">
          <div className="td-work-material-tabs" role="tablist" aria-label="资料视图">
            {views.map((item, index) => {
              const isActive = activeView === item.key;
              const isRenaming = renamingKey === item.key;
              const isMenuOpen = viewMenuKey === item.key;

              return (
                <span
                  key={item.key}
                  ref={isMenuOpen ? viewMenuRef : null}
                  className={`td-work-material-tab-wrap ${isActive ? 'is-active' : ''} ${item.isCustom ? 'is-custom' : ''} ${item.isCustom && !views[index - 1]?.isCustom ? 'has-divider' : ''}`}
                >
                  {isRenaming ? (
                    <input
                      className="td-work-material-view-rename-input"
                      value={renameValue}
                      autoFocus
                      aria-label="重命名视图"
                      onChange={(event) => onRenameValueChange(event.target.value)}
                      onBlur={(event) => {
                        if (event.currentTarget.dataset.cancelRename === 'true') return;
                        onCommitRenameView();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          onCommitRenameView();
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          event.currentTarget.dataset.cancelRename = 'true';
                          onCancelRenameView();
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="td-work-material-tab-button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onViewChange(item.key)}
                    >
                      {item.label}
                    </button>
                  )}

                  {item.isCustom && isActive && !isRenaming ? (
                    <button
                      type="button"
                      className={`td-work-material-view-more ${isMenuOpen ? 'is-open' : ''}`}
                      title="视图操作"
                      aria-label="视图操作"
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      onClick={() => onOpenViewMenu(item.key)}
                    >
                      <MoreOutlined />
                    </button>
                  ) : null}

                  {item.isCustom && isMenuOpen ? (
                    <div className="td-work-material-view-menu" role="menu" aria-label={`${item.label}操作菜单`}>
                      <button type="button" role="menuitem" onClick={() => onStartRenameView(item)}>
                        <EditOutlined />
                        <span>重命名</span>
                      </button>
                      <button type="button" role="menuitem" onClick={() => onDeleteView(item.key)}>
                        <DeleteOutlined />
                        <span>删除</span>
                      </button>
                    </div>
                  ) : null}
                </span>
              );
            })}
            <button type="button" className="td-work-material-add-view" title="添加视图" aria-label="添加视图" onClick={onAddView}>
              <PlusOutlined />
            </button>
          </div>

          <div className="td-work-material-view-tools" aria-label="资料视图工具" ref={filterRef}>
            <button
              type="button"
              className={filterOpen ? 'is-active' : ''}
              title="筛选"
              aria-label="筛选"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              onClick={() => {
                onCloseViewMenu();
                onFilterOpenChange(!filterOpen);
              }}
            >
              <FilterOutlined />
            </button>
            <button type="button" title="排序" aria-label="排序" onClick={() => onToast('已打开资料排序')}>
              <ControlOutlined />
            </button>
            <button type="button" className="is-active" title="列表视图" aria-label="列表视图">
              <FileTextOutlined />
            </button>
            <button type="button" title="宫格视图" aria-label="宫格视图" onClick={() => onToast('已切换宫格视图')}>
              <AppstoreOutlined />
            </button>
            {filterOpen ? (
              <section className="td-work-material-filter-menu" role="dialog" aria-label="设置筛选条件">
                <h2>设置筛选条件</h2>
                <label>
                  <span>文件标题</span>
                  <input placeholder="请输入筛选关键词" />
                </label>
                <label>
                  <span>类型</span>
                  <span className="td-work-material-filter-select">
                    <input placeholder="请选择文档类型" readOnly />
                    <DownOutlined />
                  </span>
                </label>
                <label>
                  <span>所有者</span>
                  <input placeholder="请输入用户名" />
                </label>
                <label>
                  <span>共享者</span>
                  <input placeholder="请输入用户名" />
                </label>
                <label>
                  <span>所在对话</span>
                  <input placeholder="请输入会话名称" />
                </label>
              </section>
            ) : null}
          </div>
        </div>

        <section className="td-work-material-table" aria-label="资料列表">
          <header className="td-work-material-table-head">
            <span>标题</span>
            <span>所有者</span>
            <button type="button" onClick={() => onToast('已按创建时间排序')}>
              创建时间
              <DownOutlined />
            </button>
            <button type="button" onClick={() => onToast('已按修改时间排序')}>
              修改时间
              <DownOutlined />
            </button>
            <span />
          </header>

          <div className="td-work-material-rows">
            {visibleFiles.map((item) => (
              <button
                key={item.key}
                type="button"
                className="td-work-material-row"
                onClick={() => onToast(`已打开资料：${item.title}`)}
              >
                <span className="td-work-material-title">
                  <MaterialFileIcon type={item.type} />
                  <strong>{item.title}</strong>
                  {item.badges.map((badge) => (
                    <em key={badge}>{badge}</em>
                  ))}
                </span>
                <MaterialOwnerAvatar name={item.owner} tone={item.ownerTone} />
                <time>{item.createdAt}</time>
                <time>{item.updatedAt}</time>
                <span className="td-work-material-more" title="更多操作" aria-label="更多操作">
                  <MoreOutlined />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PartnerDialogPage({ onOpenPartner, onCreatePartner }) {
  return (
    <section className="td-work-partner-page" aria-label="伙伴对话">
      <div className="td-work-partner-content">
        <div className="td-work-partner-section-head">
          <div className="td-work-partner-page-title">伙伴 · 小队</div>
          <div className="td-work-partner-page-actions">
            <button type="button" onClick={() => onCreatePartner('创建伙伴')}>
              <PlusOutlined />
              创建
            </button>
            <span />
            <button type="button" onClick={() => onCreatePartner('全部伙伴')}>
              全部
              <span>›</span>
            </button>
          </div>
        </div>

        <div className="td-work-partner-grid" aria-label="伙伴小队">
          {PARTNER_CARDS.map((item) => (
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
  onTabChange,
  onSearchChange,
  onCreate,
  onCreateTask,
  onCreateAutomation,
  onOpenPartner,
  onOpenTask,
}) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef(null);
  const tabs = [
    { key: 'agents', label: '伙伴', count: WORK_PARTNERS.length },
    { key: 'teams', label: '小队', count: WORK_TEAMS.length },
    { key: 'tasks', label: '任务', count: PARTNER_MANAGE_TASKS.length },
    { key: 'automation', label: '自动化', count: PARTNER_MANAGE_AUTOMATIONS.length },
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const createLabel = {
    agents: '创建工作伙伴',
    teams: '创建工作小队',
    tasks: '创建任务',
    automation: '创建自动化',
  }[activeTab];
  const matchesSearch = (item) => !normalizedSearch
    || `${item.name || item.title} ${item.desc || ''} ${item.owner || ''} ${item.tag || ''}`.toLowerCase().includes(normalizedSearch);
  const visibleAgents = WORK_PARTNERS.filter(matchesSearch);
  const visibleTeams = WORK_TEAMS.filter(matchesSearch);
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
    <section className="td-work-partner-manage-page" aria-label="伙伴管理">
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
                  <span className="td-work-partner-manage-card-actions">
                    {index === 1 ? (
                      <button
                        type="button"
                        className="td-work-partner-message-btn"
                        title="更多操作"
                        aria-label="更多操作"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCreate(`${item.name}更多操作`);
                        }}
                      >
                        <MoreOutlined />
                      </button>
                    ) : null}
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
              <div className="td-work-partner-switch-menu" role="menu" aria-label="切换伙伴">
                <header className="td-work-partner-switch-head">
                  <span>工作伙伴</span>
                  <button type="button" title="创建工作伙伴" aria-label="创建工作伙伴" onClick={() => onCreatePartner('创建工作伙伴')}>
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
            伙伴详情
            <span>›</span>
          </button>
        </div>

        <section className="td-work-partner-goal-box" aria-label="输入伙伴任务">
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

        <section className="td-work-partner-work-list" aria-label="伙伴工作记录">
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
            <span>{isTeam ? '团队' : '伙伴'}</span>
          </h1>
          <p>{partner.desc}</p>

          <div className="td-work-partner-detail-stats" aria-label="伙伴统计">
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
            <p>以下群组的上下文默认可被工作伙伴解读使用</p>
            <div className="td-work-partner-group-empty">
              <FileTextOutlined />
              <span>暂未加入飞书群组</span>
            </div>
          </section>
        </aside>

        <section className="td-work-partner-detail-panel" aria-label="伙伴资料">
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
                  <p>添加企业知识，为工作伙伴提供更丰富的上下文</p>
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
                  ? '管理该伙伴可调用的教学、教研、培训与资料处理技能。'
                  : activeTab === 'knowledge'
                    ? '为伙伴添加校本制度、课程资源、培训资料和教研案例。'
                    : '配置伙伴可见范围、群组权限和自动化运行规则。'}
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

function ProjectMenu({ value, onChange }) {
  return (
    <div className="td-work-composer-project-menu" role="menu" aria-label="项目菜单">
      {PROJECT_MENU_ITEMS.map((item, index) => {
        const selected = value === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`td-work-composer-project-option ${selected ? 'is-selected' : ''} ${index === 0 ? 'has-divider' : ''}`}
            role="menuitemradio"
            aria-checked={selected}
            onClick={() => onChange(item)}
          >
            <span className="td-work-composer-project-icon" aria-hidden="true">{item.icon}</span>
            <span className="td-work-composer-project-label">
              <span>{item.label}</span>
              {item.suffixIcon ? (
                <span className="td-work-composer-project-suffix" aria-hidden="true">{item.suffixIcon}</span>
              ) : null}
            </span>
            <span className="td-work-composer-project-shortcut">{item.shortcut}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScheduledTasksPage({
  prompt,
  openPanel,
  activeMode,
  modeKey,
  taskTargetKey,
  projectKey,
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
  onProjectChange,
  onToggleSkill,
  onToast,
}) {
  return (
    <section className="td-work-schedule-page" aria-label="定时任务">
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
        aria-label="安排定时任务"
        ref={composerRef}
      >
        <div className={`td-work-composer ${openPanel === 'skills' ? 'is-skill-menu-open' : ''}`}>
          {openPanel === 'skills' ? (
            <ComposerSkillMenu
              selectedSkillKeys={selectedSkillKeys}
              onToggleSkill={onToggleSkill}
            />
          ) : null}

          {openPanel === 'project' ? (
            <ProjectMenu
              value={projectKey}
              onChange={onProjectChange}
            />
          ) : null}

          <ComposerPromptArea
            selectedSkills={selectedSkills}
            prompt={prompt}
            placeholder="给通达安排任务"
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
                  className={`td-work-tool-chip ${item.active ? 'is-active' : ''} ${openPanel === item.key ? 'is-open' : ''}`}
                  onClick={() => onSelectTool(item)}
                >
                  <span className={item.sparkle ? 'td-work-spark-icon' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.key === 'task' || item.key === 'connectors' ? <DownOutlined /> : null}
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

          {openPanel && openPanel !== 'mode' && openPanel !== 'skills' && openPanel !== 'task' && openPanel !== 'project' ? (
            <div className="td-work-popover" role="menu">
              {(PANEL_CONTENT[openPanel] || []).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onPromptChange(`定时提醒我处理：${label}`);
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

function WorkBrowserPanel({ onClose }) {
  return (
    <aside className="td-work-browser-panel" aria-label="右侧工作面板">
      <header className="td-work-browser-tabs">
        <div className="td-work-browser-tab is-active">
          <span className="td-work-browser-tab-dot" />
          <span>新标签页</span>
          <button type="button" aria-label="关闭标签" onClick={() => onClose()}>
            <CloseOutlined />
          </button>
        </div>
        <button type="button" className="td-work-browser-new-tab" title="新建标签" aria-label="新建标签">
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

export default function TdWorkModule({ accountMenu, accountMenuOpen, onAccountMenuOpenChange }) {
  const [activeNav, setActiveNav] = useState('new-task');
  const [activeSideItem, setActiveSideItem] = useState('main-dialog');
  const [prompt, setPrompt] = useState('');
  const [selectedComposerSkillKeys, setSelectedComposerSkillKeys] = useState([]);
  const [toast, setToast] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelExpanded, setSidePanelExpanded] = useState(false);
  const [sidePanelClosing, setSidePanelClosing] = useState(false);
  const [sidePanelPrimaryRatio, setSidePanelPrimaryRatio] = useState(46);
  const [sidePanelResizing, setSidePanelResizing] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [modeKey, setModeKey] = useState('auto');
  const [taskTargetKey, setTaskTargetKey] = useState('local');
  const [projectKey, setProjectKey] = useState('company-local');
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
  const [partnerView, setPartnerView] = useState('workspace');
  const [partnerPrompt, setPartnerPrompt] = useState('');
  const [partnerWorkTab, setPartnerWorkTab] = useState('tasks');
  const [partnerWorkSearch, setPartnerWorkSearch] = useState('');
  const [partnerDetailTab, setPartnerDetailTab] = useState('profile');
  const [partnerManageTab, setPartnerManageTab] = useState('agents');
  const [partnerManageSearch, setPartnerManageSearch] = useState('');
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [materialViews, setMaterialViews] = useState(MATERIAL_VIEWS);
  const [materialView, setMaterialView] = useState('recent');
  const [materialFilterOpen, setMaterialFilterOpen] = useState(false);
  const [materialViewMenuKey, setMaterialViewMenuKey] = useState(null);
  const [materialRenamingKey, setMaterialRenamingKey] = useState(null);
  const [materialRenameValue, setMaterialRenameValue] = useState('');
  const [enabledSkillKeys, setEnabledSkillKeys] = useState(
    () => new Set([
      ...MY_SKILLS.filter((item) => item.enabled).map((item) => item.key),
      'tongda-training',
    ]),
  );
  const composerRef = useRef(null);
  const createMenuRef = useRef(null);
  const mainRef = useRef(null);
  const sidePanelTimerRef = useRef(null);

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

  const openSidePanel = useCallback(() => {
    if (sidePanelTimerRef.current) {
      window.clearTimeout(sidePanelTimerRef.current);
      sidePanelTimerRef.current = null;
    }
    setSidebarCollapsed(true);
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

  const visibleConnectors = useMemo(() => {
    const normalizedSearch = connectorSearch.trim().toLowerCase();
    return CONNECTORS.filter((item) => {
      const matchesCategory = activeCategory === '精选' || item.category === activeCategory;
      const matchesSearch = !normalizedSearch
        || `${item.name} ${item.desc} ${item.category}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, connectorSearch]);

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

  const canSaveCustomConnector = Boolean(
    customConnectorForm.name.trim() && customConnectorForm.url.trim(),
  );

  const title = activeNav === 'new-task'
    ? '今天有什么工作要处理？'
    : `要处理哪些${NAV_ITEMS.find((item) => item.key === activeNav)?.label || '工作'}？`;
  const activeSideLabel = useMemo(() => {
    const allSideItems = [...PINNED_ITEMS, ...PROJECT_ITEMS, ...RECENT_ITEMS];
    return allSideItems.find((item) => item.key === activeSideItem)?.label || '';
  }, [activeSideItem]);
  const isFileQueryConversation = activeNav === 'new-task' && activeSideItem === 'file-types';

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (sidePanelTimerRef.current) {
      window.clearTimeout(sidePanelTimerRef.current);
    }
  }, []);

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
    setToast(activeNav === 'scheduled' ? '已安排定时任务' : '已创建工作任务');
    setPrompt('');
  };

  const handleQuickPrompt = (item) => {
    setPrompt(item.prompt);
    setToast(`已填入：${item.label}`);
  };

  const handleSelectTool = (item) => {
    setOpenPanel((current) => (current === item.key ? null : item.key));
    if (item.key !== 'task') setToast(`已打开${item.label}`);
  };

  const handleTaskTargetChange = useCallback((item) => {
    setTaskTargetKey(item.key);
    setOpenPanel(null);
    setToast(`工作任务已切换到${item.place}`);
  }, []);

  const handleProjectChange = useCallback((item) => {
    setProjectKey(item.key);
    setOpenPanel(null);
    if (item.key === 'create-project') {
      setPrompt((current) => current || '帮我创建一个新的教师研修项目。');
    }
    setToast(`已选择：${item.label}`);
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

  const handleSelectMaterialView = (key) => {
    setMaterialView(key);
    setMaterialFilterOpen(false);
    setMaterialViewMenuKey(null);
    setMaterialRenamingKey(null);
  };

  const handleAddMaterialView = () => {
    const key = `untitled-${Date.now()}`;
    setMaterialViews((current) => [
      ...current,
      { key, label: '未命名视图', isCustom: true },
    ]);
    setMaterialView(key);
    setMaterialFilterOpen(true);
    setMaterialViewMenuKey(null);
    setMaterialRenamingKey(null);
    setMaterialRenameValue('');
  };

  const handleOpenMaterialViewMenu = (key) => {
    setMaterialView(key);
    setMaterialFilterOpen(false);
    setMaterialRenamingKey(null);
    setMaterialViewMenuKey((current) => (current === key ? null : key));
  };

  const handleCloseMaterialViewMenu = () => {
    setMaterialViewMenuKey(null);
  };

  const handleStartRenameMaterialView = (view) => {
    setMaterialViewMenuKey(null);
    setMaterialRenamingKey(view.key);
    setMaterialRenameValue(view.label);
  };

  const handleCommitRenameMaterialView = () => {
    if (!materialRenamingKey) return;
    const nextLabel = materialRenameValue.trim() || '未命名视图';
    setMaterialViews((current) => current.map((view) => (
      view.key === materialRenamingKey ? { ...view, label: nextLabel } : view
    )));
    setMaterialRenamingKey(null);
    setMaterialRenameValue('');
  };

  const handleCancelRenameMaterialView = () => {
    setMaterialRenamingKey(null);
    setMaterialRenameValue('');
  };

  const deleteMaterialView = (key) => {
    setMaterialViews((current) => current.filter((view) => view.key !== key));
    setMaterialView((current) => (current === key ? 'recent' : current));
    setMaterialFilterOpen(false);
    setMaterialViewMenuKey(null);
    setMaterialRenamingKey(null);
    setMaterialRenameValue('');
  };

  const handleDeleteMaterialView = (key) => {
    const targetView = materialViews.find((view) => view.key === key);
    setMaterialViewMenuKey(null);

    Modal.confirm({
      title: '确认删除这个视图？',
      content: `删除「${targetView?.label || '未命名视图'}」后不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => deleteMaterialView(key),
    });
  };

  return (
    <div className={`td-work-module ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <aside className="td-work-sidebar" aria-label="工作导航">
        <div className="td-work-sidebar-head">
          <div className="td-work-app-name">
            <strong>通达</strong>
            <span>工作学习</span>
          </div>
          <button type="button" className="td-work-side-icon-btn" title="搜索" aria-label="搜索">
            <SearchOutlined />
          </button>
        </div>

        <nav className="td-work-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`td-work-nav-item ${activeNav === item.key ? 'is-active' : ''}`}
              onClick={() => {
                setActiveNav(item.key);
                setActiveSideItem('');
                setCreateMenuOpen(false);
                setPartnerPickerOpen(false);
                closeSidePanel(true);
                if (item.key === 'dialog') {
                  setActivePartner(null);
                  setPartnerView('workspace');
                }
              }}
              title={item.label}
            >
              <span className="td-work-nav-icon">{item.icon}</span>
              <span className="td-work-nav-label">{item.label}</span>
            </button>
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
                }}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="项目">
            {PROJECT_ITEMS.map((item) => (
              <SmallItem
                key={item.key}
                item={item}
                active={activeSideItem === item.key}
                onClick={() => {
                  setActiveSideItem(item.key);
                  setActiveNav('new-task');
                }}
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

      <main
        ref={mainRef}
        className={`td-work-main ${sidePanelMounted ? 'has-side-panel' : ''} ${sidePanelIsExpanded ? 'is-side-panel-open' : ''} ${sidePanelClosing ? 'is-side-panel-closing' : ''} ${sidePanelResizing ? 'is-side-panel-resizing' : ''}`}
        style={{ '--td-work-primary-size': `${sidePanelPrimaryRatio}%` }}
      >
        <section className="td-work-primary-pane" aria-label="主工作区">
        <header className={`td-work-topbar ${activeNav === 'skills' ? 'is-skill-topbar' : ''} ${activeNav === 'skills' && skillView === 'mine' ? 'is-my-skill-topbar' : ''} ${activeNav === 'dialog' ? 'is-partner-topbar' : ''} ${activeNav === 'dialog' && activePartner ? 'is-partner-workspace-topbar' : ''} ${activeNav === 'dialog' && partnerView === 'manage' ? 'is-partner-manage-topbar' : ''} ${activeNav === 'scheduled' ? 'is-schedule-topbar' : ''} ${activeNav === 'cloud' ? 'is-material-topbar' : ''}`}>
          {activeNav === 'dialog' && partnerView === 'manage' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-partner-workspace-breadcrumb" aria-label="当前位置">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerView('workspace');
                    setPartnerManageSearch('');
                  }}
                >
                  伙伴对话
                </button>
                <span>›</span>
                <strong>管理</strong>
              </div>
            </>
          ) : activeNav === 'dialog' && activePartner ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-partner-workspace-breadcrumb" aria-label="当前位置">
                <button
                  type="button"
                  onClick={() => {
                    setActivePartner(null);
                    setPartnerView('workspace');
                    setPartnerPickerOpen(false);
                  }}
                >
                  伙伴对话
                </button>
                <span>›</span>
                {partnerView === 'detail' ? (
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
                    <strong>详情</strong>
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
                  onClick={() => setToast('已打开伙伴详情更多操作')}
                >
                  <MoreOutlined />
                </button>
              ) : null}
            </>
          ) : activeNav === 'dialog' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-dialog-titlebar-copy">
                <strong>伙伴对话</strong>
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
          ) : activeNav === 'cloud' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-material-top-actions">
                <button type="button" className="td-work-material-new-btn" onClick={() => setToast('已进入新建资料')}>
                  <PlusOutlined />
                  新建
                </button>
                <button type="button" className="td-work-material-top-btn" onClick={() => setToast('已进入上传资料')}>
                  <UploadOutlined />
                  上传
                </button>
                <button type="button" className="td-work-material-top-btn" onClick={() => setToast('已打开资料搜索')}>
                  <SearchOutlined />
                  搜索
                </button>
              </div>
              <div className="td-work-material-top-right">
                <button type="button" className="td-work-material-more-btn" title="更多" aria-label="更多" onClick={() => setToast('已打开资料更多操作')}>
                  <MoreOutlined />
                </button>
                <span className="td-work-material-storage">已使用 916KB</span>
              </div>
            </>
          ) : activeNav === 'scheduled' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <button type="button" className="td-work-schedule-new-btn" onClick={() => setToast('已进入新建定时任务')}>
                <PlusOutlined />
                新建
              </button>
            </>
          ) : activeNav === 'skills' && skillView === 'mine' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-skill-breadcrumb" aria-label="当前位置">
                <button type="button" onClick={() => setSkillView('market')}>技能 · 连接器</button>
                <span>›</span>
                <strong>我的技能</strong>
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
          ) : activeNav === 'skills' && skillView === 'partners' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-skill-tabs" role="tablist" aria-label="技能页面">
                <button
                  type="button"
                  role="tab"
                  aria-selected="false"
                  onClick={() => {
                    setSkillView('market');
                    setConnectorSearch('');
                  }}
                >
                  技能 · 连接器
                </button>
                <button type="button" className="is-active" role="tab" aria-selected="true">
                  工作伙伴 · 小队
                </button>
              </div>

              <div className="td-work-skill-actions">
                <label className="td-work-skill-search" htmlFor="td-work-partner-market-search">
                  <SearchOutlined />
                  <input
                    id="td-work-partner-market-search"
                    value={partnerMarketSearch}
                    placeholder="搜索"
                    onChange={(event) => setPartnerMarketSearch(event.target.value)}
                  />
                </label>
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
                  我的伙伴
                </button>
              </div>
            </>
          ) : activeNav === 'skills' ? (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
              <div className="td-work-skill-tabs" role="tablist" aria-label="技能页面">
                <button type="button" className="is-active" role="tab" aria-selected="true" onClick={() => setSkillView('market')}>
                  技能 · 连接器
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected="false"
                  onClick={() => {
                    setSkillView('partners');
                    setPartnerMarketCategory('全部');
                    setPartnerMarketSearch('');
                  }}
                >
                  工作伙伴 · 小队
                </button>
              </div>

              <div className="td-work-skill-actions">
                <label className="td-work-skill-search" htmlFor="td-work-skill-search">
                  <SearchOutlined />
                  <input
                    id="td-work-skill-search"
                    value={connectorSearch}
                    placeholder="搜索技能"
                    onChange={(event) => setConnectorSearch(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="td-work-skill-action-btn"
                  onClick={() => {
                    setSkillView('mine');
                    setMySkillSearch('');
                  }}
                >
                  <ControlOutlined />
                  我的技能
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
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="td-work-top-icon"
                title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <SidebarToggleIcon />
              </button>
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

        {activeNav === 'skills' && skillView === 'mine' ? (
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
            onAddPartner={(item) => setToast(`已添加工作伙伴：${item.name}`)}
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
              onTabChange={setPartnerManageTab}
              onSearchChange={setPartnerManageSearch}
              onCreate={(label) => setToast(`已进入：${label}`)}
              onCreateTask={() => {
                const partner = WORK_PARTNERS[0];
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
                  const partner = WORK_PARTNERS[0];
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
              onOpenPartner={(item) => {
                setActivePartner(item);
                setPartnerView('workspace');
                setPartnerWorkTab('tasks');
                setPartnerWorkSearch('');
                setPartnerPrompt('');
                setPartnerPickerOpen(false);
                setPartnerDetailTab('profile');
              }}
              onOpenTask={(item) => setToast(`已打开任务：${item.title}`)}
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
              partners={WORK_PARTNERS}
              teams={WORK_TEAMS}
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
              onOpenPartner={(item) => {
                setActivePartner(item.name ? item : {
                  ...PARTNER_CARDS[0],
                  name: item.title,
                  key: item.key,
                  avatar: item.avatar,
                  tone: item.tone,
                });
                setPartnerWorkTab('tasks');
                setPartnerWorkSearch('');
                setPartnerPrompt('');
                setPartnerPickerOpen(false);
                setPartnerDetailTab('profile');
                setPartnerView('workspace');
              }}
              onCreatePartner={(label) => setToast(`已进入：${label}`)}
            />
          )
        ) : activeNav === 'cloud' ? (
          <MaterialsPage
            views={materialViews}
            activeView={materialView}
            filterOpen={materialFilterOpen}
            viewMenuKey={materialViewMenuKey}
            renamingKey={materialRenamingKey}
            renameValue={materialRenameValue}
            onViewChange={handleSelectMaterialView}
            onAddView={handleAddMaterialView}
            onFilterOpenChange={setMaterialFilterOpen}
            onOpenViewMenu={handleOpenMaterialViewMenu}
            onCloseViewMenu={handleCloseMaterialViewMenu}
            onStartRenameView={handleStartRenameMaterialView}
            onCommitRenameView={handleCommitRenameMaterialView}
            onCancelRenameView={handleCancelRenameMaterialView}
            onRenameValueChange={setMaterialRenameValue}
            onDeleteView={handleDeleteMaterialView}
            onToast={setToast}
          />
        ) : activeNav === 'scheduled' ? (
          <ScheduledTasksPage
            prompt={prompt}
            openPanel={openPanel}
            activeMode={activeMode}
            modeKey={modeKey}
            taskTargetKey={taskTargetKey}
            projectKey={projectKey}
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
            onProjectChange={handleProjectChange}
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

              {openPanel === 'project' ? (
                <ProjectMenu
                  value={projectKey}
                  onChange={handleProjectChange}
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
                    .filter((item) => !sidePanelOpen || ['task', 'confirm', 'knowledge'].includes(item.key))
                    .map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`td-work-tool-chip ${item.active ? 'is-active' : ''} ${openPanel === item.key ? 'is-open' : ''}`}
                      onClick={() => handleSelectTool(item)}
                    >
                      <span className={item.sparkle ? 'td-work-spark-icon' : ''}>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.key === 'task' || item.key === 'connectors' ? <DownOutlined /> : null}
                    </button>
                  ))}
                  {sidePanelOpen ? (
                    <button
                      type="button"
                      className={`td-work-tool-chip td-work-tool-more ${openPanel === 'compact-more' ? 'is-open' : ''}`}
                      aria-label="更多工具"
                      onClick={() => setOpenPanel((current) => (current === 'compact-more' ? null : 'compact-more'))}
                    >
                      <span>...</span>
                    </button>
                  ) : null}
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

              {openPanel && openPanel !== 'mode' && openPanel !== 'skills' && openPanel !== 'task' && openPanel !== 'project' ? (
                <div className="td-work-popover" role="menu">
                  {((openPanel === 'compact-more' ? ['项目', '更多技能', '连接器'] : PANEL_CONTENT[openPanel]) || []).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (label === '项目') {
                          setOpenPanel('project');
                          return;
                        }
                        if (label === '更多技能') {
                          setOpenPanel('skills');
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

      <Toast text={toast} />
    </div>
  );
}
