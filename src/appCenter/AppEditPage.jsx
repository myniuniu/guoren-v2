import { useState } from 'react';
import { Input, Button, Tag, Drawer, Checkbox } from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlusSquareOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
  UserOutlined,
  SendOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SyncOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  SwapOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  DownOutlined,
  UpOutlined,
  RobotOutlined,
  GlobalOutlined,
  LayoutOutlined,
  FileOutlined,
  TableOutlined,
  LinkOutlined,
  MobileOutlined,
  ApiOutlined,
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import './AppEditPage.css';

const sideMenuGroups = [
  {
    label: '基础信息',
    items: [
      { key: 'credentials', label: '凭证与基础信息', icon: <FileTextOutlined /> },
      { key: 'collaborators', label: '协作者管理', icon: <TeamOutlined /> },
    ],
  },
  {
    label: '应用能力',
    items: [
      { key: 'capabilities', label: '添加应用能力', icon: <PlusSquareOutlined /> },
    ],
  },
  {
    label: '开发配置',
    items: [
      { key: 'permissions', label: '权限管理', icon: <LockOutlined /> },
      { key: 'events', label: '事件与回调', icon: <BellOutlined /> },
      { key: 'security', label: '安全设置', icon: <SafetyOutlined /> },
      { key: 'testers', label: '测试企业和人员', icon: <UserOutlined /> },
    ],
  },
  {
    label: '应用发布',
    items: [
      { key: 'versions', label: '版本管理与发布', icon: <SendOutlined /> },
    ],
  },
  {
    label: '运营监控',
    items: [
      { key: 'logs', label: '日志检索', icon: <LineChartOutlined /> },
      {
        key: 'quality',
        label: '应用质量看板',
        icon: <BarChartOutlined />,
        children: [
          { key: 'feedback', label: '用户反馈' },
          { key: 'dev-quality', label: '开发质量' },
        ],
      },
    ],
  },
];

const topNav = [
  { key: 'cases', label: '客户案例' },
  { key: 'app-center', label: '应用中心' },
  { key: 'docs', label: '开发文档' },
  { key: 'assistant', label: '智能助手' },
  { key: 'changelog', label: '更新日志' },
];

const capabilityCards = [
  {
    key: 'robot',
    icon: <RobotOutlined />,
    title: '机器人',
    desc: '与用户在聊天中交互的应用，它可以向用户或群组自动发送消息，响应用户的消息。',
    color: '#f0f5ff',
  },
  {
    key: 'webapp',
    icon: <GlobalOutlined />,
    title: '网页应用',
    desc: '快速接入已有的网页应用，用户可以通过客户端免登录快速进入。',
    color: '#f0f5ff',
  },
  {
    key: 'workbench',
    icon: <LayoutOutlined />,
    title: '工作台小组件',
    desc: '将数据图表、图文资讯等信息通过组件添加到工作台。',
    color: '#f0f5ff',
  },
  {
    key: 'doc-widget',
    icon: <FileOutlined />,
    title: '云文档小组件',
    badge: '可添加多个',
    desc: '在云文档中扩展内容或添加快捷操作。',
    color: '#f0f5ff',
  },
  {
    key: 'table-plugin',
    icon: <TableOutlined />,
    title: '多维表格插件',
    badge: '可添加多个',
    desc: '在多维表格上制作视图、逻辑插件，让你的多维表格变得更强大。',
    color: '#f0f5ff',
  },
  {
    key: 'link-preview',
    icon: <LinkOutlined />,
    title: '链接预览',
    desc: '应用能力注册的域名自定义链接预览效果，用户发送链接时，能在链接下方展示。',
    color: '#f0f5ff',
  },
  {
    key: 'mobile-login',
    icon: <MobileOutlined />,
    title: '移动应用登录',
    desc: '移动应用可以通过账号进行登录。',
    color: '#f0f5ff',
  },
  {
    key: 'native-integration',
    icon: <ApiOutlined />,
    title: '原生集成应用',
    desc: '原生集成应用可以把原生 SDK 集成到本地，并调用其中的对应方法，为用户提供服务。',
    color: '#fff7e6',
  },
];

const sceneGroups = [
  {
    title: '工作台场景',
    cards: [
      { key: 'desk-app', title: '工作台应用', capability: '网页应用 | 机器人', color: '#eaf3ff' },
      { key: 'desk-card', title: '工作台卡片', capability: '工作台小组件', color: '#fffbe6' },
    ],
  },
  {
    title: '会话场景',
    cards: [
      { key: 'send-msg', title: '发送和接收消息', capability: '机器人', color: '#eaf3ff' },
      { key: 'chat-plus', title: '聊天框\u201c+\u201d菜单', capability: '网页应用', color: '#f0f5ff' },
      { key: 'msg-shortcut', title: '消息快捷操作', capability: '网页应用', color: '#e8f7f0' },
      { key: 'link-prev', title: '链接预览', capability: '链接预览', color: '#f0f5ff' },
    ],
  },
  {
    title: '更多场景',
    cards: [
      { key: 'search-entry', title: '搜索结果快捷入口', capability: '网页应用', color: '#eaf3ff' },
      { key: 'cloud-doc', title: '云文档', capability: '云文档小组件', color: '#e8f7f0' },
      { key: 'multi-table', title: '多维表格', capability: '多维表格插件', color: '#f3eeff' },
    ],
  },
];

function AppEditPage({ app, onBack }) {
  const [activeMenu, setActiveMenu] = useState('credentials');
  const [expandedMenus, setExpandedMenus] = useState(['quality']);
  const [showSecret, setShowSecret] = useState(false);
  const [capTab, setCapTab] = useState('by-capability');
  const [permIntroOpen, setPermIntroOpen] = useState(true);
  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [permDrawerTab, setPermDrawerTab] = useState('tenant');
  const [permCategory, setPermCategory] = useState('全部');
  const [eventsIntroOpen, setEventsIntroOpen] = useState(true);
  const [eventsTab, setEventsTab] = useState('event-config');

  const toggleExpand = (key) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const appId = 'cli_aa9690937cf89bd8';
  const appSecret = '••••••••••••••••••••••••••••••••••••••••';

  return (
    <div className="ae-page">
      {/* 顶部导航 */}
      <div className="ae-topbar">
        <div className="ae-topbar-left">
          <div className="ae-logo">
            <div className="ae-logo-mark">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <defs>
                  <linearGradient id="ae-logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6a82ff" />
                    <stop offset="100%" stopColor="#3b5cff" />
                  </linearGradient>
                </defs>
                <path
                  d="M5 4h10a4 4 0 014 4v3a4 4 0 01-4 4H9l-4 3V4z"
                  fill="url(#ae-logo-grad)"
                />
              </svg>
            </div>
            <span className="ae-logo-text">开放平台</span>
          </div>
          <nav className="ae-topnav">
            {topNav.map((n) => (
              <span key={n.key} className="ae-topnav-item">
                {n.label}
              </span>
            ))}
          </nav>
        </div>
        <div className="ae-topbar-right">
          <Input
            size="small"
            className="ae-topbar-search"
            placeholder="你可以输入文档关键词、开发问题、Log ID、错误码"
            prefix={<SearchOutlined />}
          />
          <Button type="primary" className="ae-portal-btn">
            开发者后台
          </Button>
          <AppstoreOutlined className="ae-icon-btn" />
          <div className="ae-avatar" />
        </div>
      </div>

      {/* 主体区域 */}
      <div className="ae-body">
        {/* 左侧边栏 */}
        <aside className="ae-sidebar">
          {/* 应用信息头 */}
          <div className="ae-sidebar-header">
            <HomeOutlined className="ae-sidebar-home" onClick={onBack} />
            <div className="ae-sidebar-app-info">
              <div className="ae-sidebar-app-icon" style={{ background: app?.bgColor || '#8c8c8c' }}>
                <CloudUploadOutlined />
              </div>
              <div className="ae-sidebar-app-detail">
                <div className="ae-sidebar-app-name-row">
                  <span className="ae-sidebar-app-name">{app?.name || '11'}</span>
                  <Tag className="ae-sidebar-status-tag">待上线</Tag>
                </div>
                <span className="ae-sidebar-app-org">正式应用@北京国人通教育科技有限公司</span>
              </div>
            </div>
          </div>

          {/* 菜单列表 */}
          <nav className="ae-sidebar-menu">
            {sideMenuGroups.map((group) => (
              <div key={group.label} className="ae-menu-group">
                <div className="ae-menu-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <div key={item.key}>
                    <div
                      className={`ae-menu-item ${activeMenu === item.key ? 'ae-menu-item-active' : ''}`}
                      onClick={() => {
                        if (item.children) {
                          toggleExpand(item.key);
                        } else {
                          setActiveMenu(item.key);
                        }
                      }}
                    >
                      <span className="ae-menu-item-icon">{item.icon}</span>
                      <span className="ae-menu-item-label">{item.label}</span>
                      {item.children && (
                        <span className="ae-menu-item-arrow">
                          {expandedMenus.includes(item.key) ? <UpOutlined /> : <DownOutlined />}
                        </span>
                      )}
                    </div>
                    {item.children && expandedMenus.includes(item.key) && (
                      <div className="ae-menu-children">
                        {item.children.map((child) => (
                          <div
                            key={child.key}
                            className={`ae-menu-child-item ${activeMenu === child.key ? 'ae-menu-child-item-active' : ''}`}
                            onClick={() => setActiveMenu(child.key)}
                          >
                            {child.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* 内容区 */}
        <main className="ae-main">
          {/* 版本提示条 */}
          <div className="ae-version-bar">
            <span className="ae-version-bar-dot" />
            <span className="ae-version-bar-text">应用发布后，当前配置方可生效</span>
            <Button size="small" className="ae-version-bar-btn">创建版本</Button>
          </div>

          {/* 滚动内容 */}
          <div className="ae-content-scroll">
            {activeMenu === 'capabilities' ? (
              /* 添加应用能力页面 */
              <div className="ae-cap-page">
                <h2 className="ae-cap-title">添加应用能力</h2>
                <div className="ae-cap-desc">
                  <p>1. 你可以根据实际需求，为应用开启能力。单个应用可开启多种能力，一个能力可用于一个或多个场景。</p>
                  <p>2. 如果尚不确定需要添加什么能力，可切换至"按场景添加"，根据所需的业务场景选择能力。<a className="ae-cap-link">了解更多</a></p>
                </div>

                <div className="ae-cap-tabs">
                  <span
                    className={`ae-cap-tab ${capTab === 'by-capability' ? 'ae-cap-tab-active' : ''}`}
                    onClick={() => setCapTab('by-capability')}
                  >
                    按能力添加
                  </span>
                  <span
                    className={`ae-cap-tab ${capTab === 'by-scene' ? 'ae-cap-tab-active' : ''}`}
                    onClick={() => setCapTab('by-scene')}
                  >
                    按场景添加 <Tag color="red" className="ae-cap-new-badge">New</Tag>
                  </span>
                </div>

                {capTab === 'by-capability' ? (
                <div className="ae-cap-grid">
                  {capabilityCards.map((card) => (
                    <div key={card.key} className="ae-cap-card">
                      <div className="ae-cap-card-preview" style={{ background: card.color }} />
                      <div className="ae-cap-card-body">
                        <div className="ae-cap-card-title-row">
                          <span className="ae-cap-card-icon">{card.icon}</span>
                          <span className="ae-cap-card-name">{card.title}</span>
                          {card.badge && <Tag className="ae-cap-card-badge">{card.badge}</Tag>}
                        </div>
                        <p className="ae-cap-card-desc">{card.desc}</p>
                        <Button size="small" className="ae-cap-card-add-btn" icon={<PlusOutlined />}>
                          添加
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                <div className="ae-scene-content">
                  {sceneGroups.map((group) => (
                    <div key={group.title} className="ae-scene-group">
                      <h3 className="ae-scene-group-title">{group.title}</h3>
                      <div className="ae-scene-grid">
                        {group.cards.map((card) => (
                          <div key={card.key} className="ae-scene-card">
                            <div className="ae-scene-card-preview" style={{ background: card.color }} />
                            <div className="ae-scene-card-body">
                              <h4 className="ae-scene-card-title">{card.title}</h4>
                              <p className="ae-scene-card-cap">应用能力： {card.capability}</p>
                              <Button size="small" className="ae-cap-card-add-btn" icon={<PlusOutlined />}>
                                添加
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            ) : activeMenu === 'permissions' ? (
              /* 权限管理页面 */
              <div className="ae-perm-page">
                <h2 className="ae-cap-title">权限管理</h2>
                <div className="ae-perm-intro">
                  <p className="ae-perm-desc">
                    开通 API 权限后，应用才能以应用身份（tenant_access_token）或用户身份（user_access_token）调用 API；以应用身份调用 API 时，应用可能还需要申请对应的数据权限。<a className="ae-cap-link">了解更多</a>
                  </p>
                  <a className="ae-perm-toggle" onClick={() => setPermIntroOpen(!permIntroOpen)}>
                    {permIntroOpen ? '收起介绍 ∧' : '展开介绍 ∨'}
                  </a>
                  {permIntroOpen && (
                    <div className="ae-perm-flow">
                      <div className="ae-perm-flow-inner">
                        <div className="ae-perm-flow-row">
                          <span className="ae-perm-node ae-perm-node-blue">申请权限</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-node ae-perm-node-green">免审权限</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-node ae-perm-node-outline">用户身份权限 user_access_token 开通</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-step">✅ 权限开通成功，可调用 API/事件</span>
                        </div>
                        <div className="ae-perm-flow-row">
                          <span className="ae-perm-node-spacer" />
                          <span className="ae-perm-arrow" />
                          <span className="ae-perm-node ae-perm-node-orange">需审核权限</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-node ae-perm-node-outline">应用身份权限 tenant_access_token 开通</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-step">提交工单，管理员审核通过</span>
                          <span className="ae-perm-arrow">→</span>
                          <span className="ae-perm-step">✅ 权限开通成功，可调用 API/事件</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 操作栏 */}
                <div className="ae-perm-toolbar">
                  <div className="ae-perm-toolbar-left">
                    <Button type="primary" size="small" onClick={() => setPermDrawerOpen(true)}>开通权限</Button>
                    <Button size="small">批量导入/导出权限</Button>
                  </div>
                  <div className="ae-perm-toolbar-right">
                    <Input
                      size="small"
                      placeholder="例如：获取群组信息、im:ch..."
                      prefix={<SearchOutlined />}
                      className="ae-perm-search"
                    />
                    <Button size="small">权限名称 <DownOutlined /></Button>
                    <Button size="small">业务模块 <DownOutlined /></Button>
                    <Button size="small">权限类型 <DownOutlined /></Button>
                    <Button size="small">权限状态 <DownOutlined /></Button>
                  </div>
                </div>

                {/* 表格头 */}
                <div className="ae-perm-table">
                  <div className="ae-perm-table-header">
                    <span className="ae-perm-col ae-perm-col-name">权限名称</span>
                    <span className="ae-perm-col ae-perm-col-type">权限类型 <QuestionCircleOutlined className="ae-credential-help" /></span>
                    <span className="ae-perm-col ae-perm-col-status">权限状态</span>
                    <span className="ae-perm-col ae-perm-col-scope">可访问的数据范围 <a className="ae-cap-link">配置 &gt;</a></span>
                    <span className="ae-perm-col ae-perm-col-action">操作</span>
                  </div>

                  {/* 空状态 */}
                  <div className="ae-perm-empty">
                    <div className="ae-perm-empty-icon">
                      <SettingOutlined />
                    </div>
                    <p className="ae-perm-empty-text">暂未开通任何权限 <a className="ae-cap-link">去开通权限</a></p>
                  </div>
                </div>
              </div>
            ) : activeMenu === 'events' ? (
              /* 事件与回调页面 */
              <div className="ae-events-page">
                <h2 className="ae-cap-title">事件与回调</h2>
                <div className="ae-perm-intro">
                  <p className="ae-perm-desc">
                    订阅事件或回调后，开放平台将会在事件（如机器人入群）发生时向请求地址推送消息。注意：事件与回调的处理方式不同，订阅回调后，你需要立即返回响应内容、以反馈用户操作，而事件则不要求返回。<a className="ae-cap-link">了解更多</a>
                  </p>
                  <a className="ae-perm-toggle" onClick={() => setEventsIntroOpen(!eventsIntroOpen)}>
                    {eventsIntroOpen ? '收起介绍 ∧' : '展开介绍 ∨'}
                  </a>
                  {eventsIntroOpen && (
                    <div className="ae-events-flow">
                      <div className="ae-events-flow-inner">
                        {/* 事件流程 */}
                        <div className="ae-events-flow-row">
                          <span className="ae-perm-node ae-perm-node-green">事件</span>
                          <div className="ae-events-flow-icon">☁️</div>
                          <div className="ae-events-flow-center">
                            <div className="ae-events-flow-label">推送数据变化</div>
                            <div className="ae-events-flow-arrow">→ → → → →</div>
                            <div className="ae-events-flow-sublabel">← 可选择返回 HTTP 200，以确认收到数据</div>
                          </div>
                          <div className="ae-events-flow-icon">💻</div>
                          <span className="ae-events-flow-text">开发者服务器</span>
                        </div>
                        <div className="ae-events-flow-divider" />
                        {/* 回调流程 */}
                        <div className="ae-events-flow-row">
                          <span className="ae-perm-node ae-perm-node-blue">回调</span>
                          <div className="ae-events-flow-icon">👤</div>
                          <span className="ae-events-flow-text">终端用户</span>
                          <div className="ae-events-flow-center">
                            <div className="ae-events-flow-label">触发特定交互行为</div>
                            <div className="ae-events-flow-arrow">→ → → → →</div>
                            <div className="ae-events-flow-sublabel">← 反馈用户的交互行为</div>
                          </div>
                          <div className="ae-events-flow-icon">☁️</div>
                          <div className="ae-events-flow-center">
                            <div className="ae-events-flow-label">推送交互行为的上下文</div>
                            <div className="ae-events-flow-arrow">→ → → → →</div>
                            <div className="ae-events-flow-sublabel">← 立即返回响应内容</div>
                          </div>
                          <div className="ae-events-flow-icon">💻</div>
                          <span className="ae-events-flow-text">开发者服务器</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 事件配置 / 回调配置 / 加密策略 标签 */}
                <div className="ae-events-tabs">
                  <span
                    className={`ae-events-tab ${eventsTab === 'event-config' ? 'ae-events-tab-active' : ''}`}
                    onClick={() => setEventsTab('event-config')}
                  >
                    事件配置
                  </span>
                  <span
                    className={`ae-events-tab ${eventsTab === 'callback-config' ? 'ae-events-tab-active' : ''}`}
                    onClick={() => setEventsTab('callback-config')}
                  >
                    回调配置
                  </span>
                  <span
                    className={`ae-events-tab ${eventsTab === 'encrypt' ? 'ae-events-tab-active' : ''}`}
                    onClick={() => setEventsTab('encrypt')}
                  >
                    加密策略
                  </span>
                </div>

                {/* 事件配置 / 回调配置 / 加密策略内容 */}
                {eventsTab === 'event-config' && (
                <div className="ae-events-config">
                  <h3 className="ae-events-config-title">事件配置</h3>
                  <p className="ae-events-config-desc">
                    订阅事件后，开放平台将会在事件（如机器人入群）发生时向请求地址推送消息 <a className="ae-cap-link">了解更多</a>
                  </p>

                  <div className="ae-events-field">
                    <span className="ae-events-field-label">订阅方式 <EditOutlined className="ae-section-edit" /></span>
                    <span className="ae-events-field-value">未配置</span>
                  </div>

                  <div className="ae-events-added">
                    <div className="ae-events-added-header">
                      <span>已添加事件</span>
                      <Button type="primary" size="small">添加事件</Button>
                    </div>
                    <div className="ae-events-table">
                      <div className="ae-events-table-header">
                        <span className="ae-events-col ae-events-col-name">事件名称</span>
                        <span className="ae-events-col ae-events-col-type">订阅类型 <QuestionCircleOutlined className="ae-credential-help" /></span>
                        <span className="ae-events-col ae-events-col-perm">所需权限（开通以下任一权限即可）</span>
                        <span className="ae-events-col ae-events-col-action">操作</span>
                      </div>
                      {/* 空状态 */}
                      <div className="ae-perm-empty">
                        <div className="ae-perm-empty-icon">
                          <SettingOutlined />
                        </div>
                        <p className="ae-perm-empty-text">暂无数据</p>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {eventsTab === 'callback-config' && (
                <div className="ae-events-config">
                  <h3 className="ae-events-config-title">回调配置</h3>
                  <p className="ae-events-config-desc">
                    订阅回调后，开放平台将会在用户交互行为（如点击卡片按钮）发生时向配置的请求地址推送消息。你需要立即返回响应内容，以反馈用户的操作。<a className="ae-cap-link">了解更多</a>
                  </p>

                  <div className="ae-events-field">
                    <span className="ae-events-field-label">订阅方式 <EditOutlined className="ae-section-edit" /></span>
                    <span className="ae-events-field-value">未配置</span>
                  </div>

                  <div className="ae-events-added">
                    <div className="ae-events-added-header">
                      <span>已订阅的回调</span>
                      <Button type="primary" size="small">添加回调</Button>
                    </div>
                    <div className="ae-events-table">
                      <div className="ae-events-table-header">
                        <span className="ae-events-col ae-events-col-name">回调名称</span>
                        <span className="ae-events-col ae-events-col-action">操作</span>
                      </div>
                      {/* 空状态 */}
                      <div className="ae-perm-empty">
                        <div className="ae-perm-empty-icon">
                          <SettingOutlined />
                        </div>
                        <p className="ae-perm-empty-text">暂无数据</p>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {eventsTab === 'encrypt' && (
                <div className="ae-events-config">
                  <h3 className="ae-events-config-title">加密策略</h3>
                  <p className="ae-events-config-desc">
                    用于加密事件或回调的请求内容，校验请求来源。当订阅方式为“<a className="ae-cap-link">将事件发送至开发者服务器</a>”或“<a className="ae-cap-link">将回调发送至开发者服务器</a>”时生效
                  </p>

                  <div className="ae-events-field">
                    <span className="ae-events-field-label">Encrypt Key</span>
                    <div className="ae-events-field-row">
                      <span className="ae-events-field-value">未开启，请点击重置或进行自定义编辑</span>
                      <SyncOutlined className="ae-events-field-action" />
                      <EditOutlined className="ae-events-field-action" />
                    </div>
                  </div>

                  <div className="ae-events-field">
                    <span className="ae-events-field-label">Verification Token</span>
                    <div className="ae-events-field-row">
                      <span className="ae-events-field-value">********************************</span>
                      <EyeOutlined className="ae-events-field-action" />
                      <SyncOutlined className="ae-events-field-action" />
                      <EditOutlined className="ae-events-field-action" />
                    </div>
                  </div>
                </div>
                )}
              </div>
            ) : (
            <>
            <section className="ae-section">
              <h2 className="ae-section-title">应用凭证</h2>
              <div className="ae-credentials-grid">
                <div className="ae-credential-item">
                  <span className="ae-credential-label">
                    App ID <QuestionCircleOutlined className="ae-credential-help" />
                  </span>
                  <div className="ae-credential-value">
                    <span>{appId}</span>
                    <CopyOutlined className="ae-credential-action" />
                  </div>
                </div>
                <div className="ae-credential-item">
                  <span className="ae-credential-label">
                    App Secret <QuestionCircleOutlined className="ae-credential-help" />
                  </span>
                  <div className="ae-credential-value">
                    <span className="ae-secret-text">
                      {showSecret ? 'xK7mP2qR9wL4nB8vF1jD3hY6tA0cE5s' : appSecret}
                    </span>
                    <CopyOutlined className="ae-credential-action" />
                    {showSecret ? (
                      <EyeInvisibleOutlined className="ae-credential-action" onClick={() => setShowSecret(false)} />
                    ) : (
                      <EyeOutlined className="ae-credential-action" onClick={() => setShowSecret(true)} />
                    )}
                    <SyncOutlined className="ae-credential-action" />
                  </div>
                </div>
              </div>
            </section>

            {/* 综合信息 */}
            <section className="ae-section">
              <h2 className="ae-section-title">
                综合信息 <EditOutlined className="ae-section-edit" />
              </h2>
              <div className="ae-info-row">
                <span className="ae-info-label">应用图标</span>
                <p className="ae-info-hint">JPEG/PNG/SVG/BMP 格式，2 MB 以内，大于 240*240 px，无圆角</p>
                <div className="ae-info-icon-preview" style={{ background: app?.bgColor || '#8c8c8c' }}>
                  <CloudUploadOutlined />
                </div>
              </div>
              <div className="ae-info-row">
                <span className="ae-info-label">
                  管理后台主页 <QuestionCircleOutlined className="ae-info-help" />
                </span>
                <span className="ae-info-value-empty">暂无</span>
              </div>
            </section>

            {/* 国际化配置 */}
            <section className="ae-section">
              <h2 className="ae-section-title">
                国际化配置 <EditOutlined className="ae-section-edit" />
              </h2>
              <div className="ae-info-row">
                <span className="ae-info-label">应用名称</span>
                <span className="ae-info-value">{app?.name || '11'}</span>
              </div>
              <div className="ae-info-row">
                <span className="ae-info-label">应用描述</span>
                <span className="ae-info-value">{app?.desc || '1111'}</span>
              </div>
              <div className="ae-info-row">
                <span className="ae-info-label">
                  帮助文档 <QuestionCircleOutlined className="ae-info-help" />
                </span>
                <span className="ae-info-value-empty">暂无</span>
              </div>
            </section>

            {/* 更多操作 */}
            <section className="ae-section ae-section-gray">
              <h2 className="ae-section-title">更多操作</h2>
              <div className="ae-more-actions">
                <a className="ae-action-link ae-action-link-blue">
                  <SwapOutlined /> 转移应用所有权
                </a>
                <a className="ae-action-link ae-action-link-red">
                  <DeleteOutlined /> 删除应用
                </a>
              </div>
            </section>
            </>
            )}
          </div>
        </main>
      </div>

      {/* 开通权限抽屉 */}
      <Drawer
        title="开通权限"
        placement="right"
        width={680}
        open={permDrawerOpen}
        onClose={() => setPermDrawerOpen(false)}
        footer={
          <div className="ae-perm-drawer-footer">
            <Button onClick={() => setPermDrawerOpen(false)}>取消</Button>
            <Button type="primary">确认并开通权限</Button>
          </div>
        }
      >
        <div className="ae-perm-drawer-content">
          {/* 搜索栏 */}
          <div className="ae-perm-drawer-search">
            <Input
              placeholder="例如：获取群组信息、im:chat:readonly"
              prefix={<SearchOutlined />}
              className="ae-perm-drawer-search-input"
            />
            <Button>权限名称 <DownOutlined /></Button>
            <Button>是否需要审核 <DownOutlined /></Button>
          </div>

          {/* Tab切换 */}
          <div className="ae-perm-drawer-tabs">
            <span
              className={`ae-perm-drawer-tab ${permDrawerTab === 'tenant' ? 'ae-perm-drawer-tab-active' : ''}`}
              onClick={() => setPermDrawerTab('tenant')}
            >
              应用身份权限 tenant_access_token
            </span>
            <span
              className={`ae-perm-drawer-tab ${permDrawerTab === 'user' ? 'ae-perm-drawer-tab-active' : ''}`}
              onClick={() => setPermDrawerTab('user')}
            >
              用户身份权限 user_access_token
            </span>
            <a className="ae-perm-drawer-help">❓ 如何选择权限类型?</a>
          </div>

          {/* 主体区域: 左侧分类 + 右侧列表 */}
          <div className="ae-perm-drawer-body">
            {/* 左侧分类树 */}
            <div className="ae-perm-drawer-sidebar">
              {[
                { key: '全部', label: '全部', children: [] },
                { key: '身份验证', label: '身份验证', children: [] },
                { key: '事件订阅', label: '事件订阅', children: [] },
                { key: '通讯录', label: '通讯录', children: [] },
                { key: '组织架构', label: '组织架构', children: ['成员与部门'] },
                { key: '消息与群组', label: '消息与群组', children: [] },
                { key: '云文档', label: '云文档', children: [] },
                { key: '多维表格', label: '多维表格', children: [] },
                { key: '日历', label: '日历', children: [] },
                { key: '视频会议', label: '视会议', children: [] },
                { key: '会议室', label: '会议室', children: [] },
                { key: '考勤打卡', label: '考勤打卡', children: [] },
                { key: '审批', label: '审批', children: [] },
                { key: '服务台', label: '服务台', children: [] },
                { key: '任务', label: '任务', children: ['受限查询任务详情', '受限查询清单详情'] },
                { key: '工作台', label: '工作台', children: [] },
                { key: '邮箱', label: '邮箱', children: ['公共邮箱管理', '收信规则', '用户邮箱管理', '邮件数据', '邮件组管理', '邮箱文件夹', '邮箱联系人'] },
                { key: '应用信息', label: '应用信息', children: [] },
              ].map((cat) => (
                <div key={cat.key}>
                  <div
                    className={`ae-perm-cat-item ${permCategory === cat.key ? 'ae-perm-cat-item-active' : ''}`}
                    onClick={() => setPermCategory(cat.key)}
                  >
                    {cat.label}
                  </div>
                  {cat.children.length > 0 && (
                    <div className="ae-perm-cat-children">
                      {cat.children.map((child) => (
                        <div
                          key={child}
                          className={`ae-perm-cat-child ${permCategory === child ? 'ae-perm-cat-child-active' : ''}`}
                          onClick={() => setPermCategory(child)}
                        >
                          {child}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 右侧权限列表 */}
            <div className="ae-perm-drawer-list">
              <div className="ae-perm-drawer-list-header">
                <span className="ae-pdl-col ae-pdl-col-check"><Checkbox /></span>
                <span className="ae-pdl-col ae-pdl-col-name">权限名称</span>
                <span className="ae-pdl-col ae-pdl-col-audit">是否需要审核 <QuestionCircleOutlined className="ae-credential-help" /></span>
                <span className="ae-pdl-col ae-pdl-col-api">关联 API/事件</span>
              </div>
              <div className="ae-perm-drawer-list-body">
                {[
                  { name: '查看智能门禁记录', key: 'acs:access_record:readonly', audit: '免审权限', apis: ['[API] 获取门禁记录列表', '[事件] 新增门禁访问记录'] },
                  { name: '查看、创建、更新、删除门禁设备信息', key: 'acs:access_record:write', audit: '免审权限', apis: ['-'] },
                  { name: '写入门禁机设备信息', key: 'acs:device:write', audit: '免审权限', apis: ['[API] 创建或更新权限组', '[API] 删除权限组', '查看全部 ∨'] },
                  { name: '查看智能门禁设备列表', key: 'acs:devices:readonly', audit: '免审权限', apis: ['[API] 获取权限组信息', '[API] 获取门禁设备列表'] },
                  { name: '查看、更新智能门禁用户', key: 'acs:users', audit: '免审权限', apis: ['[API] 上传人脸图片', '[API] 下载人脸图片', '查看全部 ∨'] },
                  { name: '获取部门维度的用户活跃和功能使用数据', key: 'admin:admin_dept_stat:readonly', audit: '免审权限', apis: ['[API] 获取部门维度的用户活跃和功能使用数据'] },
                  { name: '获取用户维度的用户活跃和功能使用数据', key: 'admin:admin_user_stat:readonly', audit: '免审权限', apis: ['[API] 获取用户维度的用户活跃和功能使用数据'] },
                  { name: '获取应用管理员 ID', key: 'admin:app.admin_id:readonly', audit: '免审权限', apis: ['[API] 查询应用管理员列表'] },
                  { name: '校验用户是否为应用管理员', key: 'admin:app.admin:check', audit: '免审权限', apis: ['[API] 校验应用管理员', '查看全部 ∨'] },
                  { name: '获取应用管理员 ID、管理范围等信息', key: 'admin:app.admin:readonly', audit: '免审权限', apis: ['[API] 校验应用管理员', '查看全部 ∨'] },
                  { name: '更新应用分组', key: 'admin:app.category:update', audit: '免审权限', apis: ['[API] 更新应用分组信息'] },
                  { name: '启停用应用', key: 'admin:app.enable:write', audit: '免审权限', apis: ['[API] 启停用应用'] },
                  { name: '获取应用信息', key: 'admin:app.info:readonly', audit: '免审权限', apis: ['[API] 查看待审核的应用列表', '[API] 查询用户或部门是否在应用的可用或禁用名单', '查看全部 ∨'] },
                ].map((perm) => (
                  <div key={perm.key} className="ae-perm-drawer-row">
                    <span className="ae-pdl-col ae-pdl-col-check"><Checkbox /></span>
                    <span className="ae-pdl-col ae-pdl-col-name">
                      <div className="ae-pdl-name-main">{perm.name}</div>
                      <div className="ae-pdl-name-key">{perm.key}</div>
                    </span>
                    <span className="ae-pdl-col ae-pdl-col-audit">
                      <Tag color="green" style={{ borderRadius: 4 }}>{perm.audit}</Tag>
                    </span>
                    <span className="ae-pdl-col ae-pdl-col-api">
                      {perm.apis.map((api, idx) => (
                        <a key={idx} className="ae-pdl-api-link">{api}</a>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default AppEditPage;
