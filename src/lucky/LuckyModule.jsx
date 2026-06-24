import { useMemo, useState } from 'react';
import { Avatar, Button, Dropdown, Input, Select, Tag, message } from 'antd';
import {
  BookOutlined,
  CompassOutlined,
  EllipsisOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ResourceLibrarySaveModal from '../resourceLib/ResourceLibrarySaveModal.jsx';
import './LuckyModule.css';

const PAGE_SIZE = 14;

const NAV_ITEMS = [
  { key: 'new', label: '新建', icon: <PlusOutlined /> },
  { key: 'discover', label: '发现', icon: <CompassOutlined /> },
  { key: 'library', label: '库', icon: <BookOutlined /> },
  { key: 'skills', label: '技能', icon: <ThunderboltOutlined /> },
  { key: 'partners', label: '智能伙伴', icon: <RobotOutlined /> },
  { key: 'assistant', label: '小助手', icon: <UserOutlined /> },
];

const CUSTOM_AGENT_ITEMS = [
  { key: 'navigator', label: '学海导航者' },
];

const HISTORY_GROUPS = [
  {
    title: '7天内',
    items: [
      '/ai-course-review',
      '今天天气怎么样？',
      '评价课堂效果',
      '帮我创建一个研讨会',
      '/ai-course-review评课',
      '/ai-course-review讲课',
      '帮我约个会议室，明天...',
    ],
  },
  {
    title: '7天外',
    items: [
      '介绍一下北京智慧城市...',
      '北京智慧城市教育科技...',
      '我刚进大学，对未来...',
      '创建一个结营流程白板',
      '/skill-creator 帮我创建...',
      '给我推荐一些人工智能...',
      '对课堂实录进行评课',
    ],
  },
];

const SECTION_COPY = {
  new: {
    title: '新建',
    description: '从技能、智能体或资料集合开始，快速创建新的 Lucky 工作项。',
    cards: [
      { title: '创建智能体', desc: '配置角色、提示词、工具与知识源。', accent: 'blue' },
      { title: '上传资料入库', desc: '把文档、网页和课件沉淀到 Lucky 的资源库。', accent: 'gold' },
      { title: '发起工作流', desc: '基于现有技能直接搭一个可复用流程。', accent: 'green' },
    ],
  },
  discover: {
    title: '发现',
    description: '浏览近期活跃的智能体、技能与沉淀资料，挑选可直接复用的内容。',
    cards: [
      { title: 'AI 评课助手', desc: '本周被 28 个教学团队复用。', accent: 'blue' },
      { title: '课程大纲生成器', desc: '最近 7 天新增 112 次调用。', accent: 'gold' },
      { title: '学海导航者', desc: '适合课堂导学与个性化推荐。', accent: 'green' },
    ],
  },
  skills: {
    title: '技能',
    description: '查看当前 Lucky 模块里的高频技能组件，统一管理可复用能力。',
    cards: [
      { title: '课程拆解', desc: '自动提取章节、知识点与学习任务。', accent: 'blue' },
      { title: '资料综述', desc: '多篇资料聚合后生成摘要和行动建议。', accent: 'gold' },
      { title: '题目讲评', desc: '结合课堂表现生成讲评提纲。', accent: 'green' },
    ],
  },
  partners: {
    title: '智能伙伴',
    description: 'Lucky 已沉淀多个可即用的角色助手，适合按任务协同调用。',
    cards: [
      { title: '教案协作者', desc: '辅助梳理目标、活动和板书设计。', accent: 'blue' },
      { title: '资源整理员', desc: '负责筛选、命名与结构化归档资料。', accent: 'gold' },
      { title: '课堂复盘官', desc: '基于记录自动生成课后复盘。', accent: 'green' },
    ],
  },
  assistant: {
    title: '小助手',
    description: '常用即时助手集合，适合短任务、快反馈的轻量使用方式。',
    cards: [
      { title: '灵感便签', desc: '快速记下想法并自动归类。', accent: 'blue' },
      { title: '会议纪要', desc: '从聊天或录音快速生成纪要。', accent: 'gold' },
      { title: '今日总结', desc: '按任务与成果整理每日输出。', accent: 'green' },
    ],
  },
  navigator: {
    title: '学海导航者',
    description: '面向教学与学习任务的专属导航智能体，聚合资源、技能与建议。',
    cards: [
      { title: '课程诊断', desc: '依据目标、资料与课堂数据做诊断。', accent: 'blue' },
      { title: '学习路径', desc: '按能力层级给出阶段性学习建议。', accent: 'gold' },
      { title: '资源推荐', desc: '联动 Lucky 资料库生成个性化推荐。', accent: 'green' },
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
    <div className="lucky-workspace-card">
      <div className="lucky-page-header">
        <div>
          <div className="lucky-page-title">{title}</div>
          <div className="lucky-page-subtitle">{description}</div>
        </div>
      </div>
      <div className="lucky-showcase-grid">
        {cards.map((card) => (
          <div key={card.title} className={`lucky-showcase-card lucky-showcase-card-${card.accent}`}>
            <div className="lucky-showcase-title">{card.title}</div>
            <div className="lucky-showcase-desc">{card.desc}</div>
            <Button
              type="text"
              className="lucky-showcase-action"
              onClick={() => message.success(`已打开：${card.title}`)}
            >
              打开
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LuckyModule({ mode = 'workspace' }) {
  const [activeSection, setActiveSection] = useState('library');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);

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
  const showLibrary = activeSection === 'library';
  const surfaceLabel = mode === 'backend' ? 'Lucky 后台' : 'Lucky';
  const handleOpenSaveModal = (item) => {
    setSavingItem(item);
    setSaveModalOpen(true);
  };

  return (
    <div className="lucky-module">
      <aside className="lucky-sidebar">
        <div className="lucky-sidebar-profile">
          <Avatar size={28} className="lucky-sidebar-avatar">L</Avatar>
          <span className="lucky-sidebar-name">lucky</span>
        </div>

        <div className="lucky-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-nav-item ${activeSection === item.key ? 'is-active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="lucky-nav-icon">{item.icon}</span>
              <span className="lucky-nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="lucky-sidebar-group">
          <div className="lucky-sidebar-group-title">自定义智能体</div>
          <Button
            type="text"
            size="small"
            className="lucky-sidebar-add-btn"
            icon={<PlusOutlined />}
            onClick={() => message.success('已打开自定义智能体创建入口')}
          />
        </div>
        <div className="lucky-sidebar-nav lucky-sidebar-nav-compact">
          {CUSTOM_AGENT_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-nav-item ${activeSection === item.key ? 'is-active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="lucky-nav-icon lucky-nav-icon-dot" />
              <span className="lucky-nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="lucky-history">
          {HISTORY_GROUPS.map((group) => (
            <div key={group.title} className="lucky-history-group">
              <div className="lucky-history-title">{group.title}</div>
              <div className="lucky-history-list">
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="lucky-history-item"
                    onClick={() => message.info(`已打开会话：${item}`)}
                  >
                    <span className="lucky-history-bullet" />
                    <span className="lucky-history-text">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="lucky-main">
        <div className="lucky-main-inner">
          <div className="lucky-surface-badge">{surfaceLabel}</div>

          {showLibrary ? (
            <div className="lucky-workspace-card">
              <div className="lucky-page-header">
                <div>
                  <div className="lucky-page-title">库</div>
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
                                label: '另存为资料库',
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
    </div>
  );
}

export default LuckyModule;
