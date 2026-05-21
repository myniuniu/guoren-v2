import { useState } from 'react';
import { Layout, Menu, Input, Button, Card, Dropdown, Tag, Tooltip } from 'antd';
import {
  HomeOutlined,
  SearchOutlined,
  PlusOutlined,
  EllipsisOutlined,
  MessageOutlined,
  TeamOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  CloudOutlined,
  BookOutlined,
  FolderOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  UserOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import TopicDetail from './TopicDetail';
import './App.css';

const { Sider, Header, Content } = Layout;

const cardData = [
  { title: '心理健康学习', subtitle: '暂无', visibility: '公开', count: 8 },
  { title: '人工智能学习', subtitle: '暂无', visibility: '公开', count: 5 },
  { title: '人工智能学习专题', subtitle: '暂无', visibility: '公开', count: 11 },
  { title: '积木编程第二课', subtitle: '暂无', visibility: '公开', count: 2 },
  { title: '人工智能通识学习', subtitle: '暂无', visibility: '公开', count: 7 },
  { title: '心理健康课程', subtitle: '暂无', visibility: '公开', count: 9 },
  { title: '美丽校园', subtitle: '暂无', visibility: '公开', count: 4 },
  { title: '积木编程第一课', subtitle: '暂无', visibility: '公开', count: 11 },
  { title: '人工智能教育变革系列课程', subtitle: '包含周建设教授...及AI相关研究方法课程', visibility: '公开', count: 11 },
  { title: '语文组-课堂教学质量教研会', subtitle: '暂无', visibility: '公开', count: 0 },
  { title: '教师AIGC：课堂练习与评估生成', subtitle: '教师AIGC：课堂练习与评估生成', visibility: '公开', count: 0 },
  { title: 'python实训1', subtitle: '暂无', visibility: '公开', count: 4 },
];

const menuItems = [
  {
    key: 'new-scene',
    label: '+ 新建场景',
    className: 'new-scene-item',
  },
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: 'my-scenes',
    type: 'group',
    label: '我的场景',
    children: [
      { key: 'my-learning-space', icon: <DesktopOutlined />, label: '我的学习空间' },
      { key: 'workshop', icon: <TeamOutlined />, label: '研讨会' },
    ],
  },
  {
    key: 'cloud',
    type: 'group',
    label: '',
    children: [
      { key: 'my-classroom', icon: <CloudOutlined />, label: '我的课堂' },
      { key: 'workshop-cloud', icon: <FolderOutlined />, label: '工作坊' },
    ],
  },
  {
    key: 'resource',
    type: 'group',
    label: '',
    children: [
      { key: 'teaching-research', icon: <BookOutlined />, label: '教研空间' },
      { key: 'org-training', icon: <DatabaseOutlined />, label: '组织培训' },
    ],
  },
];

// Left icon bar items
const iconBarItems = [
  { key: 'my-space', icon: <AppstoreOutlined />, label: '我的空间', active: true },
  { key: 'cloud-disk', icon: <CloudOutlined />, label: '云盘' },
  { key: 'resource-lib', icon: <BookOutlined />, label: '资料库' },
  { key: 'knowledge-space', icon: <BulbOutlined />, label: '知识空间' },
  { key: 'messages', icon: <MessageOutlined />, label: '消息' },
  { key: 'org-management', icon: <TeamOutlined />, label: '组织管理' },
  { key: 'lucky', icon: <ThunderboltOutlined />, label: 'lucky' },
  { key: 'lab', icon: <ExperimentOutlined />, label: '实验室' },
  { key: 'tasks', icon: <AppstoreOutlined />, label: '任务' },
  { key: 'lucky-backend', icon: <SettingOutlined />, label: 'lucky后台' },
  { key: 'learning-analytics', icon: <BarChartOutlined />, label: '学情分析' },
];

function App() {
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [activeIconKey, setActiveIconKey] = useState('my-space');
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'detail'
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleCardClick = (card) => {
    setSelectedTopic(card.title);
    setCurrentPage('detail');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedTopic(null);
  };

  return (
    <Layout className="app-layout">
      {/* Far-left Icon Bar */}
      <div className="icon-bar">
        <div className="icon-bar-avatar">
          <div className="avatar-circle">
            <UserOutlined />
          </div>
        </div>
        <div className="icon-bar-list">
          {iconBarItems.map((item) => (
            <div
              key={item.key}
              className={`icon-bar-item ${activeIconKey === item.key ? 'icon-bar-item-active' : ''}`}
              onClick={() => setActiveIconKey(item.key)}
            >
              <span className="icon-bar-icon">{item.icon}</span>
              <span className="icon-bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Content - switches between home and detail */}
      {currentPage === 'home' ? (
        <>
          {/* Scene Sidebar */}
          <Sider width={220} className="app-sider">
            <div className="sider-top">
              <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                onClick={(e) => setSelectedKeys([e.key])}
                items={menuItems}
                className="sider-menu"
              />
            </div>
          </Sider>

          {/* Main Area */}
          <Layout>
            {/* Header */}
            <Header className="app-header">
              <div className="header-title">果仁-沉浸式AI学习空间</div>
              <div className="header-actions">
                <Input
                  placeholder="搜索主题名称..."
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  className="search-input"
                  allowClear
                />
                <Button type="primary" icon={<PlusOutlined />} className="new-topic-btn">
                  新建主题
                </Button>
              </div>
            </Header>

            {/* Content */}
            <Content className="app-content">
              <div className="card-grid">
                {cardData.map((card, index) => (
                  <Card
                    key={index}
                    className="scene-card"
                    hoverable
                    variant="borderless"
                    styles={{ body: { padding: 0 } }}
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="card-cover">
                      <div className="wave-bg">
                        <svg className="wave-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                          <path d="M0,60 C100,20 150,100 250,50 C300,30 350,80 400,40 L400,120 L0,120 Z" fill="rgba(255,255,255,0.18)" />
                          <path d="M0,80 C80,50 160,100 240,70 C320,40 360,90 400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
                          <path d="M0,95 C60,75 120,110 200,88 C280,66 340,98 400,82 L400,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
                        </svg>
                      </div>
                      <Dropdown
                        menu={{ items: [{ key: '1', label: '编辑' }, { key: '2', label: '删除' }] }}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          className="card-more-btn"
                          icon={<EllipsisOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    <div className="card-body">
                      <div className="card-title" title={card.title}>{card.title}</div>
                      <div className="card-subtitle">{card.subtitle}</div>
                      <div className="card-footer">
                        <Tag className="visibility-tag">{card.visibility}</Tag>
                        <span className="card-count">{card.count}个内容</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Content>
          </Layout>
        </>
      ) : (
        <TopicDetail topicTitle={selectedTopic} onBack={handleBackToHome} />
      )}
    </Layout>
  );
}

export default App;
