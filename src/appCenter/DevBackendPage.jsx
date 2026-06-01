import { useState } from 'react';
import { Input, Button, Tag, Modal } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  CameraOutlined,
  CarOutlined,
  EnvironmentOutlined,
  MobileOutlined,
  CalendarOutlined,
  BellOutlined,
  SendOutlined,
  CoffeeOutlined,
  StarOutlined,
  TagOutlined,
  EditOutlined,
  FileOutlined,
  HeartOutlined,
  BankOutlined,
  TeamOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import './DevBackendPage.css';
import AppEditPage from './AppEditPage';

const bgColors = [
  '#3b5cff',
  '#14a07a',
  '#00c9c9',
  '#ffe066',
  '#ffa940',
  '#ff4d6a',
  '#b37feb',
  '#8c8c8c',
];

const iconOptions = [
  { key: 'cloud', icon: <CloudUploadOutlined /> },
  { key: 'car', icon: <CarOutlined /> },
  { key: 'env', icon: <EnvironmentOutlined /> },
  { key: 'mobile', icon: <MobileOutlined /> },
  { key: 'calendar', icon: <CalendarOutlined /> },
  { key: 'bell', icon: <BellOutlined /> },
  { key: 'send', icon: <SendOutlined /> },
  { key: 'coffee', icon: <CoffeeOutlined /> },
  { key: 'star', icon: <StarOutlined /> },
  { key: 'tag', icon: <TagOutlined /> },
  { key: 'edit', icon: <EditOutlined /> },
  { key: 'file', icon: <FileOutlined /> },
  { key: 'heart', icon: <HeartOutlined /> },
  { key: 'bank', icon: <BankOutlined /> },
  { key: 'team', icon: <TeamOutlined /> },
  { key: 'code', icon: <CodeOutlined /> },
];

const topNav = [
  { key: 'cases', label: '客户案例' },
  { key: 'app-center', label: '应用中心' },
  { key: 'docs', label: '开发文档' },
  { key: 'assistant', label: '智能助手' },
  { key: 'changelog', label: '更新日志' },
];

const myApps = [
  {
    key: 'data-analyst',
    name: '资深数据分析师',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2026-05-08 08:51 已发布',
    avatar: '📊',
    avatarBg: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    key: 'product-partner',
    name: '云舒产品思维伙伴',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2026-05-06 18:27 已发布',
    avatar: '🤖',
    avatarBg: 'linear-gradient(135deg, #f093fb, #f5576c)',
  },
  {
    key: 'expert-team',
    name: '我的专家团队',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2026-05-06 18:23 已发布',
    avatar: '👥',
    avatarBg: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  },
  {
    key: 'smart-helper',
    name: '张洪磊的智能助手',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2026-04-07 06:55 已发布',
    avatar: '🧠',
    avatarBg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  },
  {
    key: 'product-manual',
    name: '产品手册',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2025-04-17 16:07 已修改',
    avatar: '📖',
    avatarBg: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    key: 'test-app',
    name: 'test',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2024-06-21 17:41 已发布',
    avatar: '📦',
    avatarBg: 'linear-gradient(135deg, #f6d365, #fda085)',
  },
  {
    key: 'test-draft',
    name: 'Test',
    owner: '张洪磊',
    role: '所有者',
    status: '待上线',
    date: '2024-06-04 13:12 已修改',
    avatar: '🧪',
    avatarBg: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    key: 'test-old',
    name: 'test',
    owner: '张洪磊',
    role: '所有者',
    status: '已启用',
    date: '2022-10-15 07:33 已修改',
    avatar: '📦',
    avatarBg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  },
];

const devJourney = [
  {
    step: 1,
    title: '设计应用',
    desc: '基于丰富的开放能力，设计我的应用',
    links: [
      { icon: '📖', label: '开放能力介绍' },
      { icon: '💼', label: '实际客户案例' },
    ],
  },
  {
    step: 2,
    title: '搭建应用',
    desc: '基于教程与工具，快速上手搭建我的应用',
    links: [
      { icon: '🤖', label: '快速开发机器人' },
      { icon: '🎴', label: '快速开发互动卡片' },
      { icon: '🔧', label: '卡片搭建工具' },
      { icon: '🔗', label: '服务端 API 调试台' },
    ],
  },
  {
    step: 3,
    title: '发布应用',
    desc: '企业管理员审核后即可使用',
    links: [
      { icon: '👤', label: '审核与发布指南' },
      { icon: '⚙️', label: '运维与运营指南' },
    ],
  },
];

function DevBackendPage() {
  const [activeTab, setActiveTab] = useState('self-built');
  const [keyword, setKeyword] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [selectedBgColor, setSelectedBgColor] = useState('#8c8c8c');
  const [selectedIcon, setSelectedIcon] = useState('cloud');
  const [editingApp, setEditingApp] = useState(null);

  const handleCreate = () => {
    const newApp = {
      name: appName || '新应用',
      desc: appDesc,
      bgColor: selectedBgColor,
      icon: selectedIcon,
    };
    setCreateModalOpen(false);
    setEditingApp(newApp);
  };

  // 如果在编辑页，展示应用编辑页面
  if (editingApp) {
    return <AppEditPage app={editingApp} onBack={() => setEditingApp(null)} />;
  }

  const filteredApps = myApps.filter((app) => {
    if (!keyword.trim()) return true;
    return app.name.toLowerCase().includes(keyword.toLowerCase());
  });

  return (
    <div className="db-page">
      {/* 顶部导航 */}
      <div className="db-topbar">
        <div className="db-topbar-left">
          <div className="db-logo">
            <div className="db-logo-mark">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <defs>
                  <linearGradient id="db-logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6a82ff" />
                    <stop offset="100%" stopColor="#3b5cff" />
                  </linearGradient>
                </defs>
                <path
                  d="M5 4h10a4 4 0 014 4v3a4 4 0 01-4 4H9l-4 3V4z"
                  fill="url(#db-logo-grad)"
                />
              </svg>
            </div>
            <span className="db-logo-text">开放平台</span>
          </div>
          <nav className="db-topnav">
            {topNav.map((n) => (
              <span key={n.key} className="db-topnav-item">
                {n.label}
              </span>
            ))}
          </nav>
        </div>
        <div className="db-topbar-right">
          <Input
            size="small"
            className="db-topbar-search"
            placeholder="你可以输入文档关键词、开发问题、Log ID、错误码"
            prefix={<SearchOutlined />}
          />
          <Button type="primary" className="db-portal-btn">
            开发者后台
          </Button>
          <AppstoreOutlined className="db-icon-btn" />
          <div className="db-avatar" />
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="db-scroll">
        {/* Hero 区域 */}
        <section className="db-hero">
          <div className="db-hero-inner">
            <div className="db-hero-avatar">
              <div className="db-hero-avatar-img" />
            </div>
            <div className="db-hero-content">
              <h1 className="db-hero-title">
                创建 <span className="db-hero-highlight">智能体</span> 应用
              </h1>
              <p className="db-hero-desc">
                为你预置智能体所需的权限、事件配置，一键创建后，即可接入你的智能体服务（如 OpenClaw、Hermes Agent 等）
              </p>
            </div>
            <Button type="primary" className="db-hero-btn">
              立即创建
            </Button>
          </div>
        </section>

        {/* 标签页切换 */}
        <div className="db-tabs-wrapper">
          <div className="db-tabs">
            <span
              className={`db-tab ${activeTab === 'self-built' ? 'db-tab-active' : ''}`}
              onClick={() => setActiveTab('self-built')}
            >
              企业自建应用
            </span>
            <span
              className={`db-tab ${activeTab === 'store' ? 'db-tab-active' : ''}`}
              onClick={() => setActiveTab('store')}
            >
              商店应用
            </span>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="db-toolbar">
          <Button type="primary" icon={<PlusOutlined />} className="db-create-btn" onClick={() => setCreateModalOpen(true)}>
            创建企业自建应用
          </Button>
          <div className="db-toolbar-right">
            <Input
              className="db-search-input"
              placeholder="搜索应用名称或 App ID"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
            <Button icon={<FilterOutlined />} className="db-toolbar-icon-btn" />
            <div className="db-view-toggle">
              <span
                className={`db-view-btn ${viewMode === 'grid' ? 'db-view-btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <AppstoreOutlined />
              </span>
              <span
                className={`db-view-btn ${viewMode === 'list' ? 'db-view-btn-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <UnorderedListOutlined />
              </span>
            </div>
          </div>
        </div>

        {/* 提示条 */}
        <div className="db-notice">
          <InfoCircleOutlined className="db-notice-icon" />
          <span>
            北京国人通教育科技有限公司提示：应用仅供本企业内部使用，应用发布需经过企业管理员审核，请仔细阅读{' '}
            <a className="db-notice-link">应用审核说明</a>。
          </span>
        </div>

        {/* 应用卡片列表 */}
        <div className="db-app-grid">
          {filteredApps.map((app) => (
            <div key={app.key} className="db-app-card">
              <div className="db-app-card-main">
                <div
                  className="db-app-avatar"
                  style={{ background: app.avatarBg }}
                >
                  <span className="db-app-avatar-emoji">{app.avatar}</span>
                </div>
                <div className="db-app-info">
                  <div className="db-app-name-row">
                    <span className="db-app-name">{app.name}</span>
                    <Tag
                      className={`db-app-status ${app.status === '待上线' ? 'db-app-status-draft' : ''}`}
                    >
                      {app.status}
                    </Tag>
                  </div>
                  <div className="db-app-meta">
                    所有者：<a className="db-app-owner">{app.owner}</a>
                    <span className="db-app-meta-sep">·</span>
                    我的角色：{app.role}
                  </div>
                </div>
              </div>
              <div className="db-app-date">最新动态：{app.date}</div>
            </div>
          ))}
        </div>

        {/* 我的开发之旅 */}
        <section className="db-journey">
          <h2 className="db-journey-title">我的开发之旅</h2>
          <div className="db-journey-grid">
            {devJourney.map((step) => (
              <div key={step.step} className="db-journey-step">
                <div className="db-journey-step-header">
                  <h3 className="db-journey-step-title">{step.title}</h3>
                  <span className="db-journey-step-num">step {step.step}</span>
                </div>
                <p className="db-journey-step-desc">{step.desc}</p>
                <div className="db-journey-links">
                  {step.links.map((link, i) => (
                    <a key={i} className="db-journey-link">
                      <span className="db-journey-link-icon">{link.icon}</span>
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
                {step.step < 3 && <div className="db-journey-arrow">›</div>}
              </div>
            ))}
          </div>
        </section>

        <div className="db-bottom-space" />
      </div>

      {/* 创建企业自建应用弹窗 */}
      <Modal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        closable={false}
        width={640}
        className="db-create-modal"
        centered
      >
        <div className="db-modal-header">
          <h3 className="db-modal-title">创建企业自建应用</h3>
          <CloseOutlined className="db-modal-close" onClick={() => setCreateModalOpen(false)} />
        </div>
        <p className="db-modal-notice">
          该应用仅可在"北京国人通教育科技有限公司"内部使用，应用发布需经过企业管理员审核，请仔细阅读{' '}
          <a className="db-modal-link">应用审核规则</a>。
        </p>

        <div className="db-modal-field">
          <label className="db-modal-label">应用名称<span className="db-modal-required">*</span></label>
          <div className="db-modal-input-wrap">
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value.slice(0, 32))}
              maxLength={32}
              className="db-modal-input"
            />
            <span className="db-modal-counter">{appName.length}/32</span>
          </div>
        </div>

        <div className="db-modal-field">
          <label className="db-modal-label">应用描述<span className="db-modal-required">*</span></label>
          <div className="db-modal-input-wrap">
            <Input.TextArea
              value={appDesc}
              onChange={(e) => setAppDesc(e.target.value.slice(0, 120))}
              maxLength={120}
              rows={3}
              className="db-modal-textarea"
            />
            <span className="db-modal-counter db-modal-counter-area">{appDesc.length}/120</span>
          </div>
        </div>

        <div className="db-modal-field">
          <label className="db-modal-label">应用图标<span className="db-modal-required">*</span></label>
          <p className="db-modal-hint">JPEG/PNG/SVG/BMP 格式，2 MB 以内，大于 240*240 px，无圆角</p>
          <div className="db-modal-icon-section">
            <div className="db-modal-icon-preview-col">
              <div className="db-modal-icon-preview" style={{ background: selectedBgColor }}>
                {iconOptions.find((i) => i.key === selectedIcon)?.icon}
              </div>
              <Button size="small" className="db-modal-upload-btn">自定义上传</Button>
            </div>
            <div className="db-modal-icon-config">
              <div className="db-modal-config-label">选择背景色</div>
              <div className="db-modal-color-row">
                {bgColors.map((c) => (
                  <span
                    key={c}
                    className={`db-modal-color-dot ${selectedBgColor === c ? 'db-modal-color-dot-active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setSelectedBgColor(c)}
                  >
                    {selectedBgColor === c && <CheckOutlined />}
                  </span>
                ))}
              </div>
              <div className="db-modal-config-label">选择图标</div>
              <div className="db-modal-icon-grid">
                {iconOptions.map((item) => (
                  <span
                    key={item.key}
                    className={`db-modal-icon-item ${selectedIcon === item.key ? 'db-modal-icon-item-active' : ''}`}
                    onClick={() => setSelectedIcon(item.key)}
                  >
                    {item.icon}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="db-modal-footer">
          <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleCreate}>创建</Button>
        </div>
      </Modal>
    </div>
  );
}

export default DevBackendPage;
