import { useMemo, useState } from 'react';
import { Input, Tag, Button, Popover, Switch } from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  SwapOutlined,
  AppstoreOutlined,
  DownOutlined,
  CustomerServiceOutlined,
  FormOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  LinkOutlined,
  PlayCircleFilled,
  LockOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import './AppCenterModule.css';

const navTabs = [
  { key: 'home', label: '首页' },
  { key: 'apps', label: '应用' },
  { key: 'solutions', label: '解决方案' },
  { key: 'ai', label: 'AI 产品', badge: '推荐' },
  { key: 'templates', label: '模板' },
];

const filterTags = [
  { key: 'recommend', label: '为你推荐', highlight: true },
  { key: 'pm', label: '项目管理', highlight: true },
  { key: 'agile', label: '敏捷研发' },
  { key: 'design', label: '设计工具' },
  { key: 'todo', label: '待办工具' },
  { key: 'data', label: '数据分析' },
  { key: 'survey', label: '问卷调研', highlight: true },
  { key: 'service', label: '客户服务' },
  { key: 'crm', label: '客户管理' },
  { key: 'hr', label: '综合人事' },
  { key: 'recruit', label: '招聘管理' },
  { key: 'culture', label: '企业文化' },
  { key: 'okr', label: '目标绩效' },
  { key: 'welfare', label: '企业福利' },
  { key: 'training', label: '培…' },
];

const appList = [
  {
    key: 'yyhcc',
    name: '用友好业财ERP-生产制造/项目/财...',
    desc: '项目管理|合同管理|生产报工工序计划排产|审批流程|工程管理工程项目|订单管理|供应链...',
    icon: 'AI ERP',
    iconBg: 'linear-gradient(135deg,#ff5b3b,#c41e1e)',
    color: '#fff',
    badge: 'AI',
  },
  {
    key: 'tita',
    name: 'Tita OKR和项目管理',
    desc: 'OKR AI 助理 | 目标管理 | 经营指标 | 项目管理 | 工作计划 | 任务 | 绩效考核 | 工单 | 流程管理 …',
    icon: 'tita',
    iconBg: '#fff',
    color: '#1d75e8',
    iconBorder: true,
  },
  {
    key: 'wjx',
    name: '问卷星',
    desc: '问卷调查、考试测评、表单投票、360度评估、市场调研、员工满意度 / 敬业度调查',
    icon: '★',
    iconBg: '#fff8e1',
    color: '#f8c440',
    iconBorder: true,
  },
  {
    key: 'vela',
    name: '维拉工时',
    desc: '一款简单易推广的工时记录和工时管理系统，适用于IPO企业合规、研发工时管理，人力…',
    icon: 'V',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'rsq',
    name: '日事清 - 让目标落地、项目流程可控、…',
    desc: '目标管理 | 绩效考核 | 项目推进 | 任务协作 | 流程审批 | 甘特图 | 多人协同 | 资源分配 | …',
    icon: '◉',
    iconBg: 'linear-gradient(135deg,#3a8cff,#1f5bd6)',
    color: '#fff',
  },
  {
    key: 'sales',
    name: 'SalesWork',
    desc: '面向专业服务企业提供"业财一体化"和"流程自动化"解决方案',
    icon: 'N',
    iconBg: '#1a1a1a',
    color: '#fff',
  },
  {
    key: 'banli',
    name: '板栗看板',
    desc: '分任务 | 管项目 | 列计划',
    icon: '●',
    iconBg: '#fff7d6',
    color: '#d6a200',
    iconBorder: true,
  },
  {
    key: 'mizzen',
    name: 'Mizzen Insight 觅深洞察',
    desc: 'Mizzen深访用研平台（Mizzen Insight）通过 AI-Agent 等能力，实现前期构建访谈大纲及…',
    icon: '◆',
    iconBg: 'linear-gradient(135deg,#1c5dd8,#0a2f80)',
    color: '#fff',
  },
  {
    key: 'todo',
    name: 'TodoNow',
    desc: '好用的项目、任务、敏捷开发、产品研发、合同管理工具',
    icon: '⚑',
    iconBg: '#fff',
    color: '#e63946',
    iconBorder: true,
  },
  {
    key: 'windchill',
    name: 'Windchill PLM',
    desc: 'Windchill是PTC公司推出的产品生命周期管理（PLM）软件，主要应用于汽车、航空航天…',
    icon: 'windchill',
    iconBg: '#fff',
    color: '#5d6b78',
    iconBorder: true,
  },
  {
    key: 'gcb',
    name: '工程宝',
    desc: '为项目型企业打造预算、合同、材料、结算、应收应付全流程管理',
    icon: '工程宝',
    iconBg: '#1f1f1f',
    color: '#fff',
    smallIconText: true,
  },
  {
    key: 'openvelo',
    name: '开目OpenVelo PLM',
    desc: '开目OpenVelo PLM是武汉开目信息技术股份有限公司子公司苏州即开即用科技有限公司…',
    icon: 'KM',
    iconBg: 'linear-gradient(135deg,#ffb14a,#ff7a00)',
    color: '#fff',
  },
  {
    key: 'ywtz',
    name: '阅微·投资云',
    desc: '一站式 VC/PE 数字化办公平台',
    icon: '∞',
    iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)',
    color: '#fff',
  },
  {
    key: 'rsq-jx',
    name: '日事清绩效',
    desc: '日事清绩效应用是一个强大且轻量的在线绩效考核工具，支持KPI、360环评、OKR等多种…',
    icon: '📈',
    iconBg: '#eaf4ff',
    color: '#1d75e8',
    iconBorder: true,
  },
  {
    key: 'aihk',
    name: 'AI获客数据管理平台',
    desc: 'AI驱动私信获客、销售对客转化的全链路管理平台，以 AI 技术为核心，解决企业从…',
    icon: '豚基',
    iconBg: '#1f1f1f',
    color: '#fff',
    smallIconText: true,
  },
  {
    key: 'hddi',
    name: 'HDDI 企业智库 | AI 商业咨询&智能决策',
    desc: '您的 7*24 小时专属AI商业顾问，提供市场洞察、战略规划与经营诊断，一站式辅助企业…',
    icon: 'H',
    iconBg: 'linear-gradient(135deg,#ff5fbe,#7d3cff)',
    color: '#fff',
  },
  {
    key: 'cky',
    name: '畅开言意见箱',
    desc: '一款安全、高效的意见反馈管理平台。让员工、成员或公众能够毫无顾虑地提出意见、…',
    icon: '◎',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'gbapqp',
    name: '功倍IPDxAPQP',
    desc: 'IPD（集成产品开发）| APQP（先进产品质量策划）| 新品立项 | 工艺设计与评审 | 技术…',
    icon: '◈',
    iconBg: 'linear-gradient(135deg,#28b6e6,#1875c9)',
    color: '#fff',
  },
];

const solutionList = [
  {
    key: 'manuf',
    name: '制造业流程数字化管理方案',
    desc: '订单到交付一体化管控，流程透明可追溯',
    company: '北京创仕科锐信息技术有限公司',
    icon: '📋',
    iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)',
    color: '#fff',
  },
  {
    key: 'work-hours',
    name: '工时资源管理',
    desc: '“工时资源管理”深度融合项目，连接“人力资源”与“运营成本”，帮助企业实现工时的结构化记录与可视化分…',
    company: '深圳市轮动科技有限公司',
    icon: '✓',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'tayia',
    name: '泰雅-医学AI翻译解决方案',
    desc: '专属医疗领域的AI翻译解决方案，适用于医药&器械行业不同业务场景。',
    company: '北京雅信诚医学信息科技有限公司',
    icon: 'T',
    iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)',
    color: '#fff',
  },
  {
    key: 'ogsm',
    name: '战略规划和执行解决方案',
    desc: '北极星OGSM帮助企业告别战略与执行“两张皮”，化目标为每人每天的行动计划。',
    company: '湖南速博融云网络科技有限公司',
    icon: 'G',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'inspect',
    name: '制造业生产设备巡检与管理解决方案',
    desc: '本方案能够实现设备全周期监控，巡检报修闭环，备件库存精细管控',
    company: '北京炎黄盈动科技发展有限责任公司',
    icon: '✈',
    iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)',
    color: '#fff',
  },
  {
    key: 'culture',
    name: '助力大型连锁企业文化落地',
    desc: '激励00后新生代员工的利器，随时随地对员工的优秀表现给予奖励',
    company: '企趣（北京）科技有限公司',
    icon: 'Q',
    iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)',
    color: '#fff',
  },
  {
    key: 'industry-bf',
    name: '智慧智能行业项目业财一体方案',
    desc: '覆盖项目立项、母子合同、预算、合同、收支、成本、利润、进度、项目看板等全场景管理',
    company: '畅捷通信息技术股份有限公司',
    icon: '⚛',
    iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)',
    color: '#fff',
  },
  {
    key: 'okr',
    name: '目标与绩效一体化管理方案',
    desc: '让管理变得更简单！目标制定、过程追踪、绩效考核，人才评估',
    company: '湖南速博融云网络科技有限公司',
    icon: '◎',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'saber',
    name: 'AI 驱动项目管理系统',
    desc: '超越项目任务管理，一个真正AI驱动的项目中心',
    company: '石拱桥软件科技（深圳）有限公司',
    icon: 'Saber',
    iconBg: '#fff',
    color: '#5d6b78',
    iconBorder: true,
    smallIconText: true,
  },
  {
    key: 'cost',
    name: '智能制造项目成本精益管理方案',
    desc: '以精准工时数据，破解项目成本糊涂账，驱动利润持续增长',
    company: '深流科技（北京）有限公司',
    icon: 'V',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'reward',
    name: '一分钟搭建员工激励与认可平台',
    desc: '激励00后新生代员工的利器，随时随地对员工的优秀表现给予奖励',
    company: '企趣（北京）科技有限公司',
    icon: 'Q',
    iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)',
    color: '#fff',
  },
  {
    key: 'retail',
    name: '零售连锁门店精细化管理解决方案',
    desc: '打通总部与门店协作，优化业务流程，驱动零售管理提质增效',
    company: '北京创仕科锐信息技术有限公司',
    icon: '◉',
    iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)',
    color: '#fff',
  },
  {
    key: 'arch',
    name: '建筑工程行业业财一体化方案',
    desc: '内账管理神器，搞定“财务、项目核算、合同、报销”等业财问题',
    company: '账王（杭州）科技有限公司',
    icon: '≡',
    iconBg: 'linear-gradient(135deg,#a16cff,#6a3bff)',
    color: '#fff',
  },
  {
    key: 'kpi',
    name: '企业绩效一体化协同管理方案',
    desc: '支持KPI/OKR/360、在线考评与自动算分的绩效管理方案',
    company: '北京创仕科锐信息技术有限公司',
    icon: 'KPI',
    iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)',
    color: '#fff',
    smallIconText: true,
  },
  {
    key: 'ai-recruit',
    name: 'AI智能招聘',
    desc: 'Ai自动同步分析简历以及面试记录，辅助招聘全流程的管理，助力企业人才的择优',
    company: '杭州维动轻流软件开发有限公司',
    icon: 'S',
    iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)',
    color: '#fff',
  },
  {
    key: 'equity',
    name: '股权投资基金管理系统',
    desc: '一站式整合募集、投资、投后、风控及收益分配功能，提供高效智能服务',
    company: '阔象科技（北京）有限公司',
    icon: 'P',
    iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)',
    color: '#fff',
  },
  {
    key: 'pm-sol',
    name: '项目管理解决方案',
    desc: '深度集成，多场景提升“产品、研发、运营、客服”协作效率',
    company: '锐思信息科技有限公司',
    icon: '∇',
    iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)',
    color: '#fff',
  },
  {
    key: 'rd-time',
    name: '研发工时管理解决方案',
    desc: '工时填报效率提升90%，数据透明可追溯，满足内控与IPO合规需求。',
    company: '上海东凼信息科技有限公司',
    icon: '▲',
    iconBg: 'linear-gradient(135deg,#1f1f1f,#333)',
    color: '#fff',
  },
];

const templateTypeMap = {
  base: { label: '多维表格模板', cls: 'tpl-tag-base' },
  bot: { label: '机器人模板', cls: 'tpl-tag-bot' },
  integ: { label: '集成模板', cls: 'tpl-tag-integ' },
  lowcode: { label: '低代码模板', cls: 'tpl-tag-lowcode' },
  lowsol: { label: '低代码解决方案', cls: 'tpl-tag-lowsol' },
};

const templateList = [
  { key: 't1', name: '任务管理', type: 'base', desc: '清晰掌握任务状态和优先级，随时查看任务进展情况', icon: '☰', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't2', name: '门店管理', type: 'base', desc: '一键拥有移动端简单易用的开店管理小程序，在手机上轻…', icon: '⌂', iconBg: 'linear-gradient(135deg,#a16cff,#6a3bff)', color: '#fff' },
  { key: 't3', name: '项目管理甘特图', type: 'base', desc: '使用甘特图管理各任务排期，跟踪进展；各项目拆解任务…', icon: '◧', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't4', name: '数据推送机器人模版', type: 'bot', desc: '企业外部数据推送、预警，不用再多端来回操作，在多维…', icon: '⛁', iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)', color: '#fff' },
  { key: 't5', name: '敏捷项目管理', type: 'base', desc: '基于多维表格的敏捷项目管理工具', icon: '✓', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't6', name: '开店管理系统', type: 'base', desc: '利用多维表格制定开店计划', icon: '⌗', iconBg: 'linear-gradient(135deg,#f364a2,#d63873)', color: '#fff' },
  { key: 't7', name: '月度计划看板', type: 'base', desc: '基于多维表格的月度计划管理工具', icon: '⧖', iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)', color: '#fff' },
  { key: 't8', name: 'Jira 数据自动同步至多维表格', type: 'integ', desc: '将 Jira 中项目的任务状态、需求进展实时同步至多维表格', icon: 'J', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't9', name: '电商选品管理系统', type: 'base', desc: '利用多维表格完成电商选品、立项管理、项目任务跟踪管理', icon: '≡', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't10', name: '门店销售额管理', type: 'base', desc: '基于多维表格的销售额管理', icon: '▰', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't11', name: '任务督办平台', type: 'base', desc: '任务督办是指对上级要求和本单位重要决策部署的贯彻落实', icon: '◉', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't12', name: '研发项目管理', type: 'base', desc: '一张表帮助研发完成项目跟进', icon: '◉', iconBg: 'linear-gradient(135deg,#7da82a,#4f7c1f)', color: '#fff' },
  { key: 't13', name: '一张表管公司', type: 'base', desc: '电商&新消费专用模版，实现一表管理公司', icon: '☸', iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)', color: '#fff' },
  { key: 't14', name: '采购管理：采购合同', type: 'base', desc: '使用多维表格来管理采购信息，利用采购数据快速自动的…', icon: '▤', iconBg: 'linear-gradient(135deg,#a16cff,#6a3bff)', color: '#fff' },
  { key: 't15', name: '管家婆进销存订单数据同步至多维表格', type: 'integ', desc: '管家婆系统订单数据自动同步至多维表格', icon: '管', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff', smallIconText: true },
  { key: 't16', name: '设计项目管理', type: 'base', desc: '设计项目管理贯穿整个设计流程，完成合理的规划与管控。', icon: 'A', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't17', name: '周会管理机器人模版', type: 'bot', desc: '智能周会管理机器人，在周会前发送多次提醒，自动创建…', icon: '▣', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't18', name: '多维表格管理Jira项目', type: 'integ', desc: '在多维表格中的需求任务信息自动创建、更新同步至Jira…', icon: 'J', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't19', name: 'TAPD需求自动同步到多维表格', type: 'integ', desc: '将TAPD中的需求，自动同步至多维表格，更灵活的管理…', icon: 'T', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't20', name: '项目任务管理', type: 'lowcode', desc: '为团队提供项目的日常管理维护、项目任务分解等功能，…', icon: '◧', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't21', name: '门店经营数据填报', type: 'base', desc: '通过多维表格完成店铺经营分析和数据可视化', icon: '⌂', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't22', name: '建筑材料管理', type: 'lowcode', desc: '面向施工团队的建筑材料管理应用，帮助团队在线维护材…', icon: '◧', iconBg: 'linear-gradient(135deg,#a16cff,#6a3bff)', color: '#fff' },
  { key: 't23', name: '通过多维表格发送邮件', type: 'integ', desc: '批量发送邮件，支持多种邮箱平台', icon: '✉', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't24', name: '需求管理平台', type: 'lowcode', desc: '集客户声音反馈、需求分析、设计、开发、测试、验收和…', icon: '▶', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't25', name: '用户体验度量看板', type: 'lowcode', desc: '包含各维度的指标卡、趋势图、雷达图等多种元素，可视…', icon: '☰', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't26', name: '客户声音管理', type: 'lowcode', desc: '支持新建、合并、跟踪客户声音，支持 PC 端和移动端随…', icon: '✎', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't27', name: '项目的需求全量同步至多维表格', type: 'integ', desc: '将项目指定空间内需求全量同步至多维表格，让项目…', icon: '↻', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't28', name: '广告投放管理', type: 'lowsol', desc: '实现从KOL、供应商、客户到项目进度的一体化管理和业…', icon: 'AD', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff', smallIconText: true },
  { key: 't29', name: '业务流程引擎', type: 'lowsol', desc: '灵活、快速部署的 BPM 解决方案，专为集团型企业设计…', icon: '⛭', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't30', name: 'PLM 变更管理', type: 'lowsol', desc: '应用引擎助力 PLM 系统，实现一站式变更管理，简…', icon: '✪', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't31', name: '抖音来客门店订单数据同步至多维表格', type: 'integ', desc: '整合核销、售卖、门店、计量本地推（短视频推门店/商品…', icon: '♫', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't32', name: '出入库管理：出库单', type: 'base', desc: '多维表格管理产品检验记录，一键生成样品抽检报告', icon: '▤', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't33', name: '定时获取抖音评论至多维表格并进行自动…', type: 'integ', desc: '实现抖音评论数据的获取、整合至多维表格，并进行自动回复', icon: '♫', iconBg: 'linear-gradient(135deg,#1f1f1f,#333)', color: '#fff' },
  { key: 't34', name: '生产任务管理：任务单生成', type: 'base', desc: '多维表格管理生产任务，一键生成生产任务单，相关人员…', icon: '⛭', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't35', name: 'Boss直聘/猎聘/拉勾等候选人自动打招呼…', type: 'integ', desc: '根据限制条件在招聘网站上筛选简历，给筛选出来的求职…', icon: 'B', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't36', name: '产品检验管理：样品抽检报告单', type: 'base', desc: '多维表格管理产品检验记录，一键生成样品抽检报告', icon: '⚛', iconBg: 'linear-gradient(135deg,#7d6cff,#4a3bdb)', color: '#fff' },
  { key: 't37', name: '一张表管理审批信息', type: 'integ', desc: '将审批的表单信息及流程信息自动同步至多维表…', icon: '▰', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't38', name: '百度/巨量千川/抖+/广点通投放数据监测…', type: 'integ', desc: '实现百度、巨量千川、DOU+、广点通等全域广告投放平…', icon: '●', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't39', name: '失物招领', type: 'bot', desc: '有人提交丢失、招领信息之后，机器人同步消息到群里…', icon: '⚑', iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)', color: '#fff' },
  { key: 't40', name: '门店排班表', type: 'base', desc: '使用多维表格实现门店排班', icon: '⧫', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't41', name: '考勤管理', type: 'base', desc: '多维表格的考勤管理模版', icon: '⦾', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
  { key: 't42', name: '群智能助手', type: 'bot', desc: '关键词自动回复，入群欢迎，给群成员私发信息，统统帮…', icon: '❆', iconBg: 'linear-gradient(135deg,#3ec7e0,#1f8cd6)', color: '#fff' },
  { key: 't43', name: '群签到机器人模版', type: 'bot', desc: '客户拜访等签到场景，自动获取定位和时间，准确掌握员…', icon: '⌖', iconBg: 'linear-gradient(135deg,#ff9a3b,#ff5b3b)', color: '#fff' },
  { key: 't44', name: '离职交接机器人模版', type: 'bot', desc: '离职申请、离职交接，上级查看离职原因、进行审批等。', icon: '☰', iconBg: 'linear-gradient(135deg,#5e8bff,#2a59d6)', color: '#fff' },
  { key: 't45', name: '会议行程管理', type: 'base', desc: '会议行程一键同步日历，一张表管理所有日程', icon: '◎', iconBg: 'linear-gradient(135deg,#3ed598,#1aa674)', color: '#fff' },
];

function AppIcon({ app }) {
  const style = {
    background: app.iconBg,
    color: app.color || '#fff',
    border: app.iconBorder ? '1px solid #eef0f3' : 'none',
  };
  return (
    <div className="ac-app-icon" style={style}>
      <span className={app.smallIconText ? 'ac-app-icon-text-sm' : ''}>{app.icon}</span>
    </div>
  );
}

function AppCenterModule() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState(['recommend', 'pm', 'survey']);
  const [keyword, setKeyword] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailTab, setDetailTab] = useState('intro');
  const [allowBrowse, setAllowBrowse] = useState(true);
  const [allowApply, setAllowApply] = useState(true);

  const filteredApps = useMemo(() => {
    if (!keyword.trim()) return appList;
    const k = keyword.trim().toLowerCase();
    return appList.filter(
      (app) => app.name.toLowerCase().includes(k) || app.desc.toLowerCase().includes(k)
    );
  }, [keyword]);

  const toggleFilter = (key) => {
    setActiveFilter((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const manageMenu = (
    <div className="ac-manage-menu">
      <div className="ac-manage-row ac-manage-row-toggle">
        <span>允许成员浏览未安装的应用</span>
        <Switch checked={allowBrowse} onChange={setAllowBrowse} />
      </div>
      <div className="ac-manage-divider" />
      <div className="ac-manage-row ac-manage-row-toggle">
        <span>允许成员申请使用应用</span>
        <Switch checked={allowApply} onChange={setAllowApply} />
      </div>
      <div className="ac-manage-divider" />
      <div className="ac-manage-row ac-manage-row-link">
        <span>浏览已安装应用</span>
        <RightOutlined />
      </div>
      <div className="ac-manage-row ac-manage-row-link ac-manage-row-active">
        <span>管理已安装应用</span>
        <RightOutlined />
      </div>
      <div className="ac-manage-row ac-manage-row-link">
        <span>查看历史订单</span>
        <RightOutlined />
      </div>
    </div>
  );

  // 如果选中了应用，展示详情页
  if (selectedApp) {
    return (
      <AppDetailPage
        app={selectedApp}
        activeTab={detailTab}
        onTabChange={setDetailTab}
        onBack={() => setSelectedApp(null)}
      />
    );
  }

  return (
    <div className="ac-module">
      {/* 顶部导航 */}
      <div className="ac-header">
        <div className="ac-header-left">
          <div className="ac-logo">
            <div className="ac-logo-mark">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <defs>
                  <linearGradient id="ac-logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3ec7e0" />
                    <stop offset="100%" stopColor="#1f6dd6" />
                  </linearGradient>
                </defs>
                <path
                  d="M5 4h10a4 4 0 014 4v3a4 4 0 01-4 4H9l-4 3V4z"
                  fill="url(#ac-logo-grad)"
                />
              </svg>
            </div>
            <span className="ac-logo-text">应用中心</span>
          </div>
          <div className="ac-nav">
            {navTabs.map((tab) => (
              <div
                key={tab.key}
                className={`ac-nav-item ${activeTab === tab.key ? 'ac-nav-item-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                {tab.badge && <span className="ac-nav-badge">{tab.badge}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="ac-header-right">
          <Popover
            content={manageMenu}
            placement="bottomRight"
            trigger="click"
            arrow={false}
            overlayClassName="ac-manage-popover"
          >
            <span className="ac-header-action">
              <SettingOutlined /> 管理应用
            </span>
          </Popover>
          <span
            className="ac-header-action"
            onClick={() => window.open(`${window.location.origin}${window.location.pathname}#dev-backend`, '_blank')}
          >
            <PlusOutlined /> 创建应用
          </span>
          <span className="ac-header-action">
            <SwapOutlined /> 偏好设置
          </span>
        </div>
      </div>

      {/* 滚动区域 */}
      <div className="ac-scroll">
        {activeTab === 'solutions' ? (
          <>
            {/* 筛选条（浅色背景） */}
            <div className="ac-filter-bar">
              <div className="ac-filter-row ac-filter-row-plain">
                {filterTags.map((t) => {
                  const active = activeFilter.includes(t.key);
                  return (
                    <span
                      key={t.key}
                      className={`ac-filter-tag ${active ? 'ac-filter-tag-active' : ''}`}
                      onClick={() => toggleFilter(t.key)}
                    >
                      {t.label}
                      {active && <span className="ac-filter-tag-close">×</span>}
                    </span>
                  );
                })}
                <span className="ac-filter-more">
                  更多筛选 <DownOutlined />
                </span>
              </div>
            </div>

            {/* 解决方案全量网格 */}
            <div className="ac-section ac-section-solutions">
              <div className="ac-section-header">
                <div className="ac-section-title-group">
                  <span className="ac-section-title">解决方案</span>
                  <span className="ac-section-divider" />
                  <span className="ac-section-subtitle">量身定制，助力企业数字化转型</span>
                </div>
              </div>

              <div className="ac-solution-page-grid">
                {solutionList.map((sol) => (
                  <div
                    key={sol.key}
                    className="ac-solution-page-card"
                    onClick={() => { setSelectedApp(sol); setDetailTab('intro'); }}
                  >
                    <div className="ac-sp-head">
                      <AppIcon app={sol} />
                      <div className="ac-sp-name">{sol.name}</div>
                      <span className="ac-card-cta">免费咨询</span>
                    </div>
                    <div className="ac-sp-desc">
                      <span className="ac-sp-quote">“</span>{sol.desc}
                    </div>
                    <div className="ac-sp-company">
                      <EnvironmentOutlined /> {sol.company}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ac-footer-space" />
            </div>
          </>
        ) : activeTab === 'templates' ? (
          <>
            {/* 模板页筛选条 */}
            <div className="ac-filter-bar">
              <div className="ac-filter-row ac-filter-row-plain">
                {filterTags.map((t) => {
                  const active = activeFilter.includes(t.key);
                  return (
                    <span
                      key={t.key}
                      className={`ac-filter-tag ${active ? 'ac-filter-tag-active' : ''}`}
                      onClick={() => toggleFilter(t.key)}
                    >
                      {t.label}
                      {active && <span className="ac-filter-tag-close">×</span>}
                    </span>
                  );
                })}
                <span className="ac-filter-more">
                  更多筛选 <DownOutlined />
                </span>
              </div>
            </div>

            {/* 模板全量网格 */}
            <div className="ac-section ac-section-templates">
              <div className="ac-section-header">
                <div className="ac-section-title-group">
                  <span className="ac-section-title">模板</span>
                  <span className="ac-section-divider" />
                  <span className="ac-section-subtitle">使用模板，快速搭建业务系统</span>
                </div>
              </div>

              <div className="ac-template-grid">
                {templateList.map((tpl) => {
                  const meta = templateTypeMap[tpl.type] || templateTypeMap.base;
                  return (
                    <div key={tpl.key} className="ac-template-card">
                      <div className="ac-tpl-icon-wrap">
                        <AppIcon app={tpl} />
                      </div>
                      <div className="ac-tpl-body">
                        <div className="ac-tpl-title-row">
                          <span className="ac-tpl-name">{tpl.name}</span>
                          <span className={`ac-tpl-tag ${meta.cls}`}>{meta.label}</span>
                        </div>
                        <div className="ac-tpl-desc">{tpl.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="ac-footer-space" />
            </div>
          </>
        ) : (
          <>
        {/* Hero搜索区 */}
        <div className="ac-hero">
          <div className="ac-hero-bg" />
          <h1 className="ac-hero-title">
            发现适合你的<span className="ac-hero-highlight"> 应用或解决方案</span>
          </h1>
          <div className="ac-hero-search">
            <Input
              size="large"
              placeholder="搜索"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              variant="borderless"
            />
          </div>

          {/* 标签筛选行 */}
          <div className="ac-filter-row">
            {filterTags.map((t) => {
              const active = activeFilter.includes(t.key);
              return (
                <span
                  key={t.key}
                  className={`ac-filter-tag ${active ? 'ac-filter-tag-active' : ''}`}
                  onClick={() => toggleFilter(t.key)}
                >
                  {t.label}
                  {active && <span className="ac-filter-tag-close">×</span>}
                </span>
              );
            })}
            <span className="ac-filter-more">
              更多筛选 <DownOutlined />
            </span>
          </div>
        </div>

        {/* 应用列表区 */}
        <div className="ac-section">
          <div className="ac-section-header">
            <div className="ac-section-title-group">
              <span className="ac-section-title">应用</span>
              <span className="ac-section-divider" />
              <span className="ac-section-subtitle">通过业务应用提升企业效能</span>
            </div>
            <a className="ac-section-more">查看全部</a>
          </div>

          <div className="ac-card-grid">
            {filteredApps.map((app) => (
              <div key={app.key} className="ac-card" onClick={() => { setSelectedApp(app); setDetailTab('intro'); }}>
                <div className="ac-card-top">
                  <AppIcon app={app} />
                  <span className="ac-card-cta">免费咨询</span>
                </div>
                <div className="ac-card-name">
                  {app.name}
                  {app.badge && <span className="ac-card-name-badge">{app.badge}</span>}
                </div>
                <div className="ac-card-desc">{app.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 解决方案区 */}
        <div className="ac-section">
          <div className="ac-section-header">
            <div className="ac-section-title-group">
              <span className="ac-section-title">解决方案</span>
              <span className="ac-section-divider" />
              <span className="ac-section-subtitle">量身定制，助力企业数字化转型</span>
            </div>
            <a className="ac-section-more">查看全部</a>
          </div>

          <div className="ac-solution-grid">
            {solutionList.map((sol) => (
              <div key={sol.key} className="ac-solution-card" onClick={() => { setSelectedApp(sol); setDetailTab('intro'); }}>
                <div className="ac-solution-top">
                  <AppIcon app={sol} />
                  <div className="ac-solution-info">
                    <div className="ac-card-name">{sol.name}</div>
                    <div className="ac-card-desc">{sol.desc}</div>
                  </div>
                  <span className="ac-card-cta">免费咨询</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ac-footer-space" />
          </>
        )}
      </div>

      {/* 右下浮动按钮 */}
      <div className="ac-floats">
        <Button className="ac-float-btn" icon={<FormOutlined />}>
          <span>提交需求</span>
        </Button>
        <Button className="ac-float-btn" icon={<CustomerServiceOutlined />}>
          <span>联系我们</span>
        </Button>
      </div>
    </div>
  );
}

function AppDetailPage({ app, activeTab, onTabChange, onBack }) {
  // 将 desc 按 | 分割为标签作为补充展示
  const tagList = (app.desc || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 8);

  const features = [
    '生产企业解决方案：以销定产、BOM、MRP、委外、齐套分析，管清生产进度与成本',
    '项目型企业解决方案：合同、预算、人机料费、收支、发票、利润一体管理，项目盈亏实时可见',
    '商贸进销存解决方案：采购、销售、库存、往来、成本全流程在线，库存预警、资金情况随时掌握',
    '电商经营解决方案：SKU、网店、订单、物流、库存、财务统一管理，多平台经营更高效',
    'AI 经营解决方案：AI 审批、AI 财务分析、AI 经营分析、AI 风险查验，辅助老板看经营、财务提效率',
  ];

  return (
    <div className="ac-detail">
      <div className="ac-detail-topbar">
        <span className="ac-detail-back" onClick={onBack}>
          <ArrowLeftOutlined /> 返回应用中心
        </span>
      </div>

      <div className="ac-detail-scroll">
        <div className="ac-detail-inner">
          <div className="ac-detail-header">
            <div className="ac-detail-icon">
              <AppIcon app={{ ...app }} />
            </div>
            <div className="ac-detail-info">
              <div className="ac-detail-title-row">
                <span className="ac-detail-title">{app.name}</span>
                <span className="ac-detail-type-tag">应用</span>
                <span className="ac-detail-free-tag">含免费版</span>
              </div>
              <div className="ac-detail-tagline">{app.desc}</div>
              <div className="ac-detail-actions">
                <Button type="primary" className="ac-detail-btn-primary">获取</Button>
                <Button className="ac-detail-btn-default">免费咨询</Button>
                <Button className="ac-detail-btn-icon" icon={<LinkOutlined />} />
              </div>
            </div>
          </div>

          <div className="ac-detail-divider" />

          <div className="ac-detail-body">
            <div className="ac-detail-main">
              <div className="ac-detail-tabs">
                <span
                  className={`ac-detail-tab ${activeTab === 'intro' ? 'ac-detail-tab-active' : ''}`}
                  onClick={() => onTabChange('intro')}
                >介绍</span>
                <span
                  className={`ac-detail-tab ${activeTab === 'pricing' ? 'ac-detail-tab-active' : ''}`}
                  onClick={() => onTabChange('pricing')}
                >付费方案</span>
              </div>

              {activeTab === 'intro' ? (
                <>
                  <div className="ac-detail-text">
                    <p>{app.name}，面向生产、项目、商贸、电商等多行业经营场景，提供业财一体化解决方案。🚀</p>
                    <p>通过打通 OA 审批、消息通知、多维表和通讯录，让订单、库存、项目、生产、财务数据自动流转，帮助企业实现业务在线、财务自动、经营可视。📊</p>
                  </div>
                  <ul className="ac-detail-features">
                    {features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  <div className="ac-detail-more">查看更多 <DownOutlined /></div>

                  <div className="ac-detail-video">
                    <div className="ac-detail-video-bg" />
                    <div className="ac-detail-video-play"><PlayCircleFilled /></div>
                  </div>

                  <div className="ac-detail-banner">
                    <div className="ac-detail-banner-content">
                      <div className="ac-detail-banner-brand">
                        <span className="ac-detail-banner-feishu">品牌</span>
                        <span className="ac-detail-banner-x">×</span>
                        <span className="ac-detail-banner-app">{app.name.split('-')[0]}</span>
                      </div>
                      <div className="ac-detail-banner-headline">
                        <div>让<span className="hl">协同</span>进入业务</div>
                        <div>让<span className="hl">数据</span>回到经营</div>
                      </div>
                      <div className="ac-detail-banner-sub">一体化连接，让协同更高效，让经营更清晰。</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="ac-detail-pricing">
                  <div className="ac-pricing-card">
                    <div className="ac-pricing-name">免费版</div>
                    <div className="ac-pricing-price">¥ 0 <span>/年</span></div>
                    <div className="ac-pricing-desc">适合个人与初创团队试用，包含基础功能</div>
                    <Button block>免费使用</Button>
                  </div>
                  <div className="ac-pricing-card ac-pricing-card-primary">
                    <div className="ac-pricing-name">专业版</div>
                    <div className="ac-pricing-price">¥ 1980 <span>/年</span></div>
                    <div className="ac-pricing-desc">适合中小企业使用，全部业务模块与 AI 能力</div>
                    <Button type="primary" block>购买</Button>
                  </div>
                  <div className="ac-pricing-card">
                    <div className="ac-pricing-name">企业版</div>
                    <div className="ac-pricing-price">咨询</div>
                    <div className="ac-pricing-desc">适合中大型企业，支持私部署与定制化</div>
                    <Button block>联系我们</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="ac-detail-side">
              <div className="ac-side-section-title">开发者</div>
              <div className="ac-side-card">
                <div className="ac-side-dev">
                  <div className="ac-side-dev-logo">开</div>
                  <span className="ac-side-dev-name">开发者信息技术股份有限公司</span>
                </div>
                <div className="ac-side-divider-light" />
                <div className="ac-side-row"><PhoneOutlined /> <a className="ac-side-link">17610120599</a></div>
                <div className="ac-side-row"><MailOutlined /> <a className="ac-side-link">contact@example.com</a></div>
                <div className="ac-side-row"><GlobalOutlined /> <a className="ac-side-link">应用官网</a></div>
              </div>

              <div className="ac-side-section-title">标签</div>
              <div className="ac-side-tags">
                {tagList.length > 0 ? tagList.map((t, i) => (
                  <Tag key={i} className="ac-side-tag">{t}</Tag>
                )) : <Tag className="ac-side-tag">业务应用</Tag>}
              </div>

              <div className="ac-side-section-title">帮助信息</div>
              <div className="ac-side-help">
                <div className="ac-side-help-item"><LockOutlined /> 隐私协议</div>
                <div className="ac-side-help-item"><FileTextOutlined /> 使用协议</div>
                <div className="ac-side-help-item"><QuestionCircleOutlined /> 帮助文档</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppCenterModule;