import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Select, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  ArrowUpOutlined,
  AudioOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  CodeOutlined,
  MessageOutlined,
  CloseOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FilePptOutlined,
  FolderOutlined,
  PlusOutlined,
  ProductOutlined,
  ProjectOutlined,
  RobotOutlined,
  SearchOutlined,
  ShopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import ResourceLibrarySaveModal from '../resourceLib/ResourceLibrarySaveModal.jsx';
import './LuckyModule.css';

const PAGE_SIZE = 14;
const LUCKY_SIDEBAR_WIDTH_STORAGE_KEY = 'gr.lucky.sidebar-width.v1';
const DEFAULT_LUCKY_SIDEBAR_WIDTH = 224;
const MIN_LUCKY_SIDEBAR_WIDTH = 188;
const MAX_LUCKY_SIDEBAR_WIDTH = 320;

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
  { key: 'office', label: '办公', icon: <AppstoreOutlined /> },
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

const COMPOSER_CONTEXTS = [
  { key: 'agent', label: '张洪磊的智能伙伴', icon: <RobotOutlined /> },
  { key: 'project', label: '进入项目工作', icon: <FolderOutlined /> },
  { key: 'browser', label: '云端浏览器', icon: <CloudServerOutlined />, hasNotice: true },
];

const RECOMMENDATION_CARDS = [
  { key: 'ppt', label: '幻灯片', title: '做一份跨部门项目启动会 PPT', icon: <FilePptOutlined /> },
  { key: 'research', label: '深度研究', title: '研究 AI 会议助手领域的市场格局', icon: <CloudServerOutlined /> },
  { key: 'data', label: '数据可视化', title: '做一份国内旅游数据可视化分析', icon: <BarChartOutlined /> },
];

const AGENT_TABS = [
  { key: 'mine', label: '我的智能体', count: 2 },
  { key: 'team', label: '智能体小队', count: 1 },
];

const AGENT_CARDS = [
  {
    key: 'personal',
    name: '张洪磊的智能伙伴',
    desc: '暂无描述',
    tag: '专属',
    tagTone: 'purple',
    avatar: 'personal',
  },
  {
    key: 'coach',
    name: '辅导员',
    desc: '负责团队协作场景下的疑问解答、问题梳理及规则提示辅助工作',
    tag: '团队',
    tagTone: 'muted',
    avatar: 'coach',
  },
];

const CREATE_AGENT_OPTIONS = [
  {
    key: 'team',
    title: '团队智能伙伴',
    desc: '团队专属智能伙伴，聚焦多人协作场景，高效沉淀团队知识，跨群共享上下文',
    action: '添加',
    image: 'team',
    primary: true,
  },
  {
    key: 'third-party',
    title: '第三方智能体',
    badge: '限时免费',
    desc: '将多来源智能体（如 OpenClaw、Hermes 等）无缝接入飞书，打破平台边界，实现多智能体协同工作',
    link: '查看帮助文档',
    action: '接入',
    image: 'third-party',
  },
  {
    key: 'market',
    title: '去专家市场逛逛',
    desc: '市场运营、文案编写、内容生成、人事行政、产品研发等等，各领域的专家等你招募',
    action: '浏览专家市场',
    image: 'market',
  },
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
    description: '管理可协作的智能伙伴，按任务选择最合适的角色。',
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

function LuckyHome({ promptText, onPromptChange, onSend }) {
  return (
    <div className="lucky-home">
      <div className="lucky-home-avatar" aria-hidden="true">
        <span className="lucky-home-avatar-face">张</span>
      </div>
      <h1 className="lucky-home-title">让张洪磊的智能伙伴帮你做点什么？</h1>

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
                <button
                  type="button"
                  className="lucky-auto-button"
                  title="自动选择能力"
                  onClick={() => message.info('已切换为 Auto 模式')}
                >
                  <ThunderboltOutlined />
                  <span>Auto</span>
                  <DownOutlined />
                </button>
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
            ))}
          </div>
        </div>
      </section>

      <div className="lucky-quick-actions" aria-label="快捷能力">
        {QUICK_ACTIONS.map((item) => (
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

function AgentAvatar({ type }) {
  return (
    <span className={`lucky-agent-card-avatar lucky-agent-card-avatar-${type}`} aria-hidden="true">
      <span />
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

function CreateAgentModal({ open, onClose }) {
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

function AgentManagementPage({ activeTab, onTabChange, onOpenCreate }) {
  const visibleCards = activeTab === 'mine' ? AGENT_CARDS : AGENT_CARDS.slice(1);

  return (
    <section className="lucky-agent-page" aria-label="智能体">
      <div className="lucky-agent-page-title">智能体</div>
      <div className="lucky-agent-board">
        <div className="lucky-agent-topbar">
          <div className="lucky-agent-tabs" role="tablist" aria-label="智能体分类">
            {AGENT_TABS.map((tab) => (
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
            onClick={onOpenCreate}
          >
            <PlusOutlined />
            创建智能体
          </button>
        </div>

        <div className="lucky-agent-card-grid">
          {visibleCards.map((agent) => (
            <article key={agent.key} className="lucky-agent-card">
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
                  onClick={() => message.info(`已打开：${agent.name}`)}
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
                  onClick={() => message.info(`${agent.name} 已切换为 Auto`)}
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
  const [workMode, setWorkMode] = useState('office');
  const [agentTab, setAgentTab] = useState('mine');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [promptText, setPromptText] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
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

  const sectionCopy = SECTION_COPY[activeSection];
  const showHome = activeSection === 'new';
  const showAgents = activeSection === 'partners';
  const showLibrary = activeSection === 'library';

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

  return (
    <div className="lucky-module">
      <aside
        className="lucky-sidebar"
        style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
      >
        <div className="lucky-sidebar-profile">
          <div className="lucky-sidebar-brand">
            <span className="lucky-brand-logo" aria-hidden="true" />
            <span className="lucky-sidebar-name">lucky</span>
          </div>
          <div className="lucky-sidebar-tools">
            <button type="button" className="lucky-sidebar-tool" title="搜索" aria-label="搜索">
              <SearchOutlined />
            </button>
            <button type="button" className="lucky-sidebar-tool" title="收起侧栏" aria-label="收起侧栏">
              <ControlOutlined />
            </button>
          </div>
        </div>

        <div className="lucky-work-mode-switch" aria-label="工作模式">
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

        <nav className="lucky-sidebar-nav" aria-label="Lucky 导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-nav-item ${activeSection === item.key ? 'is-active' : ''}`}
              onClick={() => setActiveSection(item.key)}
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
            className={`lucky-task-shortcut ${activeSection === 'new' ? 'is-active' : ''}`}
            onClick={() => setActiveSection('new')}
          >
            <span className="lucky-task-text">介绍并引导上手使用</span>
            <span className="lucky-task-dot" aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div
        className="lucky-sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整侧栏宽度"
        onPointerDown={handleSidebarResizeStart}
      />

      <main className="lucky-main">
        <div className="lucky-main-inner">
          {showHome ? (
            <LuckyHome
              promptText={promptText}
              onPromptChange={setPromptText}
              onSend={handleSendPrompt}
            />
          ) : showAgents ? (
            <AgentManagementPage
              activeTab={agentTab}
              onTabChange={setAgentTab}
              onOpenCreate={() => setCreateAgentOpen(true)}
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
      <CreateAgentModal open={createAgentOpen} onClose={() => setCreateAgentOpen(false)} />
    </div>
  );
}

export default LuckyModule;
