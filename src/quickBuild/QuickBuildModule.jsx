import { useState } from 'react';
import { Input, Button, Tag } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  AppstoreOutlined,
  CloudUploadOutlined,
  ShopOutlined,
  TeamOutlined,
  LinkOutlined,
  CodeOutlined,
  BulbOutlined,
  SettingOutlined,
  SearchOutlined,
  SmileOutlined,
  DesktopOutlined,
  FormOutlined,
  ToolOutlined,
  UsergroupAddOutlined,
  EyeOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './QuickBuildModule.css';

const sideMenuItems = [
  { key: 'new-app', icon: <PlusOutlined />, label: '新应用', highlight: true },
  { key: 'import', icon: <ImportOutlined />, label: '导入' },
  { key: 'my-apps', icon: <AppstoreOutlined />, label: '我的应用' },
  { key: 'deploy', icon: <CloudUploadOutlined />, label: '部署 OpenClaw' },
  { key: 'market', icon: <ShopOutlined />, label: '市场' },
  { key: 'community', icon: <TeamOutlined />, label: '开发者社区' },
];

const recentApps = [
  { key: 'welfare', icon: '🟢', label: '员工福利中心' },
  { key: 'archive', icon: '📋', label: '员工档案审批系统' },
  { key: 'pension', icon: '🏦', label: '个人养老金计算器' },
  { key: 'ai-team', icon: '🤖', label: '张洪磊的智能体团队' },
  { key: 'sbt', icon: '🎯', label: 'SBT测试' },
  { key: 'ecommerce', icon: '🛒', label: '电商库存管理系统' },
];

const categories = [
  { icon: <DesktopOutlined />, label: '企业 IT 系统' },
  { icon: <BulbOutlined />, label: 'AI 应用' },
  { icon: <FormOutlined />, label: '活动报名' },
  { icon: <ToolOutlined />, label: '轻型业务系统' },
  { icon: <UsergroupAddOutlined />, label: '团队协作工具' },
];

const appCards = [
  {
    title: '限时领取影视飓风同款专属福利',
    image: 'https://picsum.photos/seed/app1/400/200',
    tags: [],
    featured: true,
  },
  {
    title: '2026 飞书先进生产力峰会·重庆站',
    image: 'https://picsum.photos/seed/app2/300/200',
    tags: ['灵感', '精选', '资讯站点', '营销活动'],
  },
  {
    title: '影视飓风–提词器',
    image: 'https://picsum.photos/seed/app3/300/200',
    tags: ['应用', '效率工具', '移动端精选', '精选'],
  },
  {
    title: 'AI 灵感食堂',
    image: 'https://picsum.photos/seed/app4/300/200',
    tags: ['应用', '精选', '官网落地页', '资讯站点'],
  },
  {
    title: '跨境商品物流管理系统',
    image: 'https://picsum.photos/seed/app5/300/200',
    tags: ['应用', '精选', '业务系统', '效率工具'],
  },
  {
    title: '电商库存管理系统',
    image: 'https://picsum.photos/seed/app6/300/200',
    tags: ['应用', '精选', '业务系统', '效率工具'],
  },
  {
    title: 'Seedance2.0 视频生成站',
    image: 'https://picsum.photos/seed/app7/300/200',
    tags: ['应用', '精选', '效率工具'],
  },
];

function QuickBuildModule() {
  const [activeTab, setActiveTab] = useState('explore');
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="quick-build-module">
      {/* 左侧菜单 */}
      <div className="qb-sidebar">
        <div className="qb-sidebar-header">
          <span className="qb-logo">⚡ 智搭</span>
        </div>
        <div className="qb-sidebar-menu">
          {sideMenuItems.map((item) => (
            <div
              key={item.key}
              className={`qb-sidebar-item ${item.highlight ? 'qb-sidebar-item-highlight' : ''}`}
            >
              <span className="qb-sidebar-icon">{item.icon}</span>
              <span className="qb-sidebar-label">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="qb-sidebar-recent">
          <div className="qb-sidebar-recent-title">最近应用</div>
          {recentApps.map((app) => (
            <div key={app.key} className="qb-sidebar-item">
              <span className="qb-sidebar-emoji">{app.icon}</span>
              <span className="qb-sidebar-label">{app.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="qb-main">
        {/* 头部标语 */}
        <div className="qb-hero">
          <h1 className="qb-hero-title">
            灵感落地生花，即刻智搭万物
            <span className="qb-hero-sparkle">✦</span>
          </h1>
          <div className="qb-hero-actions">
            <span className="qb-hero-free">限时免费</span>
            <span className="qb-hero-deploy">一键部署 OpenClaw &gt;</span>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="qb-tabs">
          <div
            className={`qb-tab ${activeTab === 'explore' ? 'qb-tab-active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <SearchOutlined /> 灵感探索
          </div>
          <div
            className={`qb-tab ${activeTab === 'develop' ? 'qb-tab-active' : ''}`}
            onClick={() => setActiveTab('develop')}
          >
            <CodeOutlined /> 应用开发
          </div>
        </div>

        {/* 输入区域 */}
        <div className="qb-input-area">
          <Input.TextArea
            className="qb-textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="开发一个员工自助领用办公用品的系统"
            autoSize={{ minRows: 1, maxRows: 3 }}
          />
          <div className="qb-input-toolbar">
            <div className="qb-input-toolbar-left">
              <PlusOutlined className="qb-toolbar-icon" />
              <LinkOutlined className="qb-toolbar-icon" />
              <SmileOutlined className="qb-toolbar-icon" />
              <BulbOutlined className="qb-toolbar-icon" />
            </div>
            <div className="qb-input-toolbar-right">
              <span className="qb-expert-mode">&lt;/&gt; 专家模式</span>
              <BulbOutlined className="qb-toolbar-icon" />
              <SettingOutlined className="qb-toolbar-icon" />
              <Button type="primary" shape="circle" size="small" className="qb-send-btn" disabled={!inputValue.trim()}>
                ↑
              </Button>
            </div>
          </div>
        </div>

        {/* 描述文字 */}
        <div className="qb-desc">
          内置数据库、AI 及飞书插件，一站式交付应用。你可以用来实现：
        </div>

        {/* 分类标签 */}
        <div className="qb-categories">
          {categories.map((cat, idx) => (
            <div key={idx} className="qb-category-item">
              {cat.icon} {cat.label}
            </div>
          ))}
        </div>

        {/* 应用卡片网格 */}
        <div className="qb-card-grid">
          {appCards.map((card, idx) => (
            <div key={idx} className={`qb-card ${card.featured ? 'qb-card-featured' : ''}`}>
              <div className="qb-card-image">
                <img src={card.image} alt={card.title} />
                <div className="qb-card-hover-overlay">
                  <div className="qb-card-hover-actions">
                    <Button
                      shape="circle"
                      icon={<EyeOutlined />}
                      className="qb-card-preview-btn"
                    />
                    <Button
                      type="primary"
                      icon={<RocketOutlined />}
                      className="qb-card-clone-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${window.location.origin}${window.location.pathname}#online-dev`, '_blank');
                      }}
                    >
                      做同款
                    </Button>
                  </div>
                </div>
              </div>
              <div className="qb-card-info">
                <div className="qb-card-title">{card.title}</div>
                {card.tags.length > 0 && (
                  <div className="qb-card-tags">
                    {card.tags.map((tag, i) => (
                      <Tag key={i} className="qb-card-tag">{tag}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickBuildModule;
