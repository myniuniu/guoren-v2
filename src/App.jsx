import { useState } from 'react';
import { Layout, Menu, Input, Button, Card, Dropdown, Tag } from 'antd';
import {
  HomeOutlined,
  SearchOutlined,
  PlusOutlined,
  EllipsisOutlined,
  MessageOutlined,
  TeamOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  RobotOutlined,
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
  ApartmentOutlined,
  PartitionOutlined,
  CalendarOutlined,
  BankOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  FileImageOutlined,
  SendOutlined,
  RocketOutlined,
  CodeOutlined,
  LayoutOutlined,
  TagsOutlined,
  ScanOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import TopicDetail from './TopicDetail';
import LeaveWorkflow from './workflow/LeaveWorkflow';
import ProcessManagement from './workflow/ProcessManagement';
import LeaveModule from './leave/LeaveModule';
import DeptManagement from './system/DeptManagement';
import UserManagement from './system/UserManagement';
import RoleManagement from './system/RoleManagement';
import PositionManagement from './system/PositionManagement';
import CertificateModule from './certificate/CertificateModule';
import CertificateIssueModule from './certificate/CertificateIssueModule';
import ResourceLibrary from './resourceLib/ResourceLibrary';
import ResourceParseStatus from './resourceLib/ResourceParseStatus';
import ArchiveModule from './archive/ArchiveModule';
import StudyClubModule from './studyClub/StudyClubModule';
import OnlineDevModule from './onlineDev/OnlineDevModule';
import QuickBuildModule from './quickBuild/QuickBuildModule';
import PageDesignerModule from './pageDesigner/PageDesignerModule';
import TagManagement from './resourceLib/TagManagement';
import AppCenterModule from './appCenter/AppCenterModule';
import DevDocsPage from './appCenter/DevDocsPage';
import DevBackendPage from './appCenter/DevBackendPage';
import DmsModule from './dms/DmsModule';
import IntegrationModule from './integration/IntegrationModule';
import MessagesModule from './messages/MessagesModule';
import AgentQuotaModule from './agentQuota/AgentQuotaModule';
import ModelStatisticsModule from './modelStatistics/ModelStatisticsModule';
import SolutionManagementModule from './solution/SolutionManagementModule';
import { getMappedChannelSummary } from './studyClub/adminTopicMapping';
import './App.css';

const { Sider, Header, Content } = Layout;

function getInitialHashPage() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hash.replace('#', '');
}

const defaultCardData = [
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

function getSceneCardDataMap() {
  const seniorSummary = getMappedChannelSummary('senior-community') || {};
  return {
    'study-club-channel': [
      {
        title: '老年社区',
        subtitle: '围绕智慧助老、康养服务和社区陪伴的银龄共创空间',
        visibility: '公开',
        count: seniorSummary.contentCount || 0,
      },
    ],
  };
}

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
      { key: 'study-club-channel', icon: <RocketOutlined />, label: '研习社-频道' },
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
  { key: 'my-space', icon: <AppstoreOutlined />, label: '空间', active: true },
  { key: 'cloud-disk', icon: <CloudOutlined />, label: '云盘' },
  { key: 'resource-lib', icon: <BookOutlined />, label: '资料库' },
  { key: 'resource-parse', icon: <ScanOutlined />, label: '资料解析' },
  { key: 'knowledge-space', icon: <BulbOutlined />, label: '知识空间' },
  { key: 'messages', icon: <MessageOutlined />, label: '消息' },
  { key: 'org-management', icon: <TeamOutlined />, label: '组织管理' },
  { key: 'workflow', icon: <ApartmentOutlined />, label: '工作流' },
  { key: 'process-management', icon: <PartitionOutlined />, label: '流程管理' },
  { key: 'leave', icon: <CalendarOutlined />, label: '请假' },
  { key: 'dept', icon: <BankOutlined />, label: '部门管理' },
  { key: 'user', icon: <SolutionOutlined />, label: '人员管理' },
  { key: 'role', icon: <SafetyCertificateOutlined />, label: '角色管理' },
  { key: 'position', icon: <IdcardOutlined />, label: '岗位管理' },
  { key: 'certificate', icon: <FileImageOutlined />, label: '证书模版' },
  { key: 'certificate-issue', icon: <SendOutlined />, label: '证书发放' },
  { key: 'archive', icon: <FolderOutlined />, label: '档案提交' },
  { key: 'study-club', icon: <RocketOutlined />, label: '研习社' },
  { key: 'lucky', icon: <ThunderboltOutlined />, label: 'lucky' },
  { key: 'lab', icon: <ExperimentOutlined />, label: '实验室' },
  { key: 'tasks', icon: <AppstoreOutlined />, label: '任务' },
  { key: 'lucky-backend', icon: <SettingOutlined />, label: 'lucky后台' },
  { key: 'learning-analytics', icon: <BarChartOutlined />, label: '模型统计' },
  { key: 'agent-quota', icon: <RobotOutlined />, label: '智能体配额' },
  { key: 'online-dev', icon: <CodeOutlined />, label: '在线开发' },
  { key: 'quick-build', icon: <ThunderboltOutlined />, label: '智搭' },
  { key: 'page-designer', icon: <LayoutOutlined />, label: '页面设计' },
  { key: 'tag-management', icon: <TagsOutlined />, label: '标签管理' },
  { key: 'app-center', icon: <AppstoreOutlined />, label: '应用中心' },
  { key: 'solution-management', icon: <AppstoreOutlined />, label: '解决方案' },
  { key: 'dms', icon: <FileTextOutlined />, label: '文档管理' },
  { key: 'integration', icon: <PartitionOutlined />, label: '三方对接' }
];

function App() {
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [activeIconKey, setActiveIconKey] = useState(() => getInitialHashPage() || 'my-space');
  const [currentPage, setCurrentPage] = useState(() => getInitialHashPage() || 'home'); // 'home', 'detail', or 'workflow'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const activeSceneKey = selectedKeys[0] || 'home';
  const sceneCardDataMap = getSceneCardDataMap();
  const visibleCardData = sceneCardDataMap[activeSceneKey] || defaultCardData;

  const handleCardClick = (card) => {
    setSelectedTopic(card.title);
    setCurrentPage('detail');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedTopic(null);
  };

  const handleIconBarClick = (key) => {
    setActiveIconKey(key);
    if (key === 'workflow') {
      setCurrentPage('workflow');
    } else if (key === 'messages') {
      setCurrentPage('messages');
    } else if (key === 'process-management') {
      setCurrentPage('process-management');
    } else if (key === 'leave') {
      setCurrentPage('leave');
    } else if (key === 'dept') {
      setCurrentPage('dept');
    } else if (key === 'user') {
      setCurrentPage('user');
    } else if (key === 'role') {
      setCurrentPage('role');
    } else if (key === 'position') {
      setCurrentPage('position');
    } else if (key === 'certificate') {
      setCurrentPage('certificate');
    } else if (key === 'certificate-issue') {
      setCurrentPage('certificate-issue');
    } else if (key === 'resource-lib') {
      setCurrentPage('resource-lib');
    } else if (key === 'resource-parse') {
      setCurrentPage('resource-parse');
    } else if (key === 'archive') {
      setCurrentPage('archive');
    } else if (key === 'study-club') {
      setCurrentPage('study-club');
    } else if (key === 'learning-analytics') {
      setCurrentPage('learning-analytics');
    } else if (key === 'agent-quota') {
      setCurrentPage('agent-quota');
    } else if (key === 'online-dev') {
      setCurrentPage('online-dev');
    } else if (key === 'quick-build') {
      setCurrentPage('quick-build');
    } else if (key === 'page-designer') {
      setCurrentPage('page-designer');
    } else if (key === 'tag-management') {
      setCurrentPage('tag-management');
    } else if (key === 'app-center') {
      setCurrentPage('app-center');
    } else if (key === 'solution-management') {
      setCurrentPage('solution-management');
    } else if (key === 'dms') {
      setCurrentPage('dms');
    } else if (key === 'integration') {
      setCurrentPage('integration');
    } else if (
      currentPage === 'messages' ||
      currentPage === 'workflow' ||
      currentPage === 'process-management' ||
      currentPage === 'leave' ||
      currentPage === 'dept' ||
      currentPage === 'user' ||
      currentPage === 'role' ||
      currentPage === 'position' ||
      currentPage === 'certificate' ||
      currentPage === 'certificate-issue' ||
      currentPage === 'resource-lib' ||
      currentPage === 'resource-parse' ||
      currentPage === 'archive' ||
      currentPage === 'study-club' ||
      currentPage === 'learning-analytics' ||
      currentPage === 'agent-quota' ||
      currentPage === 'online-dev' ||
      currentPage === 'quick-build' ||
      currentPage === 'page-designer' ||
      currentPage === 'tag-management' ||
      currentPage === 'app-center' ||
      currentPage === 'solution-management' ||
      currentPage === 'dms' ||
      currentPage === 'integration'
    ) {
      setCurrentPage('home');
    }
  };

  // 开发者文档页面（独立全屏，不带侧边图标栏）
  if (currentPage === 'dev-docs') {
    return <DevDocsPage />;
  }

  // 开发者后台页面（独立全屏）
  if (currentPage === 'dev-backend') {
    return <DevBackendPage />;
  }

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
              onClick={() => handleIconBarClick(item.key)}
            >
              <span className="icon-bar-icon">{item.icon}</span>
              <span className="icon-bar-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Content */}
      {currentPage === 'messages' ? (
        <MessagesModule />
      ) : currentPage === 'workflow' ? (
        <LeaveWorkflow onBack={handleBackToHome} />
      ) : currentPage === 'process-management' ? (
        <ProcessManagement />
      ) : currentPage === 'leave' ? (
        <LeaveModule />
      ) : currentPage === 'dept' ? (
        <DeptManagement />
      ) : currentPage === 'user' ? (
        <UserManagement />
      ) : currentPage === 'role' ? (
        <RoleManagement />
      ) : currentPage === 'position' ? (
        <PositionManagement />
      ) : currentPage === 'certificate' ? (
        <CertificateModule />
      ) : currentPage === 'certificate-issue' ? (
        <CertificateIssueModule />
      ) : currentPage === 'resource-lib' ? (
        <ResourceLibrary />
      ) : currentPage === 'resource-parse' ? (
        <ResourceParseStatus />
      ) : currentPage === 'archive' ? (
        <ArchiveModule />
      ) : currentPage === 'study-club' ? (
        <StudyClubModule />
      ) : currentPage === 'learning-analytics' ? (
        <ModelStatisticsModule />
      ) : currentPage === 'agent-quota' ? (
        <AgentQuotaModule />
      ) : currentPage === 'online-dev' ? (
        <OnlineDevModule />
      ) : currentPage === 'quick-build' ? (
        <QuickBuildModule />
      ) : currentPage === 'page-designer' ? (
        <PageDesignerModule />
      ) : currentPage === 'tag-management' ? (
        <TagManagement />
      ) : currentPage === 'app-center' ? (
        <AppCenterModule />
      ) : currentPage === 'solution-management' ? (
        <SolutionManagementModule />
      ) : currentPage === 'dms' ? (
        <DmsModule />
      ) : currentPage === 'integration' ? (
        <IntegrationModule />
      ) : currentPage === 'home' ? (
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
                {visibleCardData.map((card, index) => (
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
      )
      }
    </Layout>
  );
}

export default App;
