import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layout, Menu, Input, Button, Card, Dropdown, Empty, Modal, Tag, message } from 'antd';
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
  AuditOutlined,
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
import MyProfileModule from './myProfile/MyProfileModule';
import MessagesModule from './messages/MessagesModule';
import AgentQuotaModule from './agentQuota/AgentQuotaModule';
import ModelStatisticsModule from './modelStatistics/ModelStatisticsModule';
import SolutionManagementModule from './solution/SolutionManagementModule';
import SceneTemplateModule from './scene/SceneTemplateModule';
import CapabilityModelModule from './capabilityModel/CapabilityModelModule';
import TeacherEvaluationModule from './teacherEvaluation/TeacherEvaluationModule';
import TeacherEvaluationSchemeModule from './teacherEvaluation/TeacherEvaluationSchemeModule';
import TeacherDevelopmentModule from './teacherDevelopment/TeacherDevelopmentModule';
import TeacherPortraitModule from './teacherPortrait/TeacherPortraitModule';
import SceneCreateModal from './scene/SceneCreateModal';
import { getSceneStoreChangeEventName, getSceneTypeLabel, getSceneVisibilityLabel, sceneApi } from './scene/api';
import './App.css';

const { Sider, Header, Content } = Layout;
const EMPTY_MENU_INDICATOR = { x: 0, y: 0, width: 0, height: 0, opacity: 0 };

function getInitialHashPage() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hash.replace('#', '');
}

function getSceneTheme(scene) {
  return scene?.templateSnapshot?.theme || {};
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
  { key: 'scene-template', icon: <DesktopOutlined />, label: '场景模板' },
  { key: 'my-profile', icon: <IdcardOutlined />, label: '我的档案' },
  { key: 'teacher-portrait', icon: <SolutionOutlined />, label: '教师画像' },
  { key: 'teacher-development', icon: <BarChartOutlined />, label: '教师发展' },
  { key: 'teacher-evaluation-schemes', icon: <FileTextOutlined />, label: '评价方案' },
  { key: 'teacher-evaluation', icon: <AuditOutlined />, label: '教师评价' },
  { key: 'capability-model', icon: <AppstoreOutlined />, label: '能力模型' },
  { key: 'solution-management', icon: <AppstoreOutlined />, label: '解决方案' },
  { key: 'dms', icon: <FileTextOutlined />, label: '文档管理' },
  { key: 'integration', icon: <PartitionOutlined />, label: '三方对接' }
];

function App() {
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [activeIconKey, setActiveIconKey] = useState(() => getInitialHashPage() || 'my-space');
  const [currentPage, setCurrentPage] = useState(() => getInitialHashPage() || 'home'); // 'home', 'detail', or 'workflow'
  const [agentQuotaEntryTab, setAgentQuotaEntryTab] = useState('plans');
  const [teacherEvaluationEntryContext, setTeacherEvaluationEntryContext] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [sceneTemplates, setSceneTemplates] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [sceneKeyword, setSceneKeyword] = useState('');
  const [sceneDataLoading, setSceneDataLoading] = useState(true);
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [sceneEditing, setSceneEditing] = useState(null);
  const [iconBarIndicatorStyle, setIconBarIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const [siderMenuIndicatorStyle, setSiderMenuIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const iconBarListRef = useRef(null);
  const iconBarItemRefs = useRef(new Map());
  const siderMenuShellRef = useRef(null);
  const activeSceneKey = selectedKeys[0] || 'home';
  const visibleScenes = useMemo(() => {
    const normalizedKeyword = sceneKeyword.trim().toLowerCase();
    return scenes.filter((scene) => {
      if (activeSceneKey !== 'home' && scene.menuKey !== activeSceneKey) return false;
      if (!normalizedKeyword) return true;
      const haystack = `${scene.name} ${scene.templateName} ${scene.description || ''}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [activeSceneKey, sceneKeyword, scenes]);

  const loadSceneHomeData = useCallback(async (withLoading = true) => {
    if (withLoading) {
      setSceneDataLoading(true);
    }
    try {
      await sceneApi.seed();
      const [nextTemplates, nextScenes] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
      ]);
      setSceneTemplates(nextTemplates);
      setScenes(nextScenes);
      setSelectedScene((prev) => {
        if (!prev?.id) return prev;
        return nextScenes.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      message.error(error?.message || '加载场景数据失败');
    } finally {
      if (withLoading) {
        setSceneDataLoading(false);
      }
    }
  }, []);

  const setIconBarItemRef = useCallback((key, node) => {
    if (node) {
      iconBarItemRefs.current.set(key, node);
      return;
    }
    iconBarItemRefs.current.delete(key);
  }, []);

  const updateIndicatorPosition = useCallback((container, target, setter) => {
    if (!container || !target) {
      setter((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextStyle = {
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height,
      opacity: 1,
    };

    setter((prev) => {
      const unchanged = ['x', 'y', 'width', 'height', 'opacity']
        .every((key) => Math.abs((prev[key] || 0) - (nextStyle[key] || 0)) < 0.5);
      return unchanged ? prev : nextStyle;
    });
  }, []);

  const updateIconBarIndicator = useCallback(() => {
    updateIndicatorPosition(
      iconBarListRef.current,
      iconBarItemRefs.current.get(activeIconKey) || null,
      setIconBarIndicatorStyle,
    );
  }, [activeIconKey, updateIndicatorPosition]);

  const updateSiderMenuIndicator = useCallback(() => {
    const container = siderMenuShellRef.current;
    const target = container?.querySelector('.ant-menu-item-selected:not(.new-scene-item)') || null;
    updateIndicatorPosition(container, target, setSiderMenuIndicatorStyle);
  }, [updateIndicatorPosition]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateIconBarIndicator();
      updateSiderMenuIndicator();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeIconKey, selectedKeys, updateIconBarIndicator, updateSiderMenuIndicator]);

  useEffect(() => {
    const handleViewportChange = () => {
      updateIconBarIndicator();
      updateSiderMenuIndicator();
    };

    window.addEventListener('resize', handleViewportChange);

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleViewportChange)
      : null;

    if (observer) {
      if (iconBarListRef.current) observer.observe(iconBarListRef.current);
      if (siderMenuShellRef.current) observer.observe(siderMenuShellRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      observer?.disconnect();
    };
  }, [updateIconBarIndicator, updateSiderMenuIndicator]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSceneHomeData();
    }, 0);
    const eventName = getSceneStoreChangeEventName();
    const handleStoreChange = () => {
      loadSceneHomeData(false);
    };
    window.addEventListener(eventName, handleStoreChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(eventName, handleStoreChange);
    };
  }, [loadSceneHomeData]);

  const handleCardClick = (scene) => {
    setSelectedScene(scene);
    setCurrentPage('detail');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedScene(null);
  };

  const openAgentQuotaPage = (tab = 'plans') => {
    setActiveIconKey('agent-quota');
    setAgentQuotaEntryTab(tab);
    setCurrentPage('agent-quota');
  };

  const openTeacherEvaluationPage = useCallback((context = null) => {
    setActiveIconKey('teacher-evaluation');
    setTeacherEvaluationEntryContext(context ? {
      ...context,
      requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    } : null);
    setCurrentPage('teacher-evaluation');
  }, []);

  const openCreateSceneModal = () => {
    setSceneEditing(null);
    setSceneModalOpen(true);
  };

  const openEditSceneModal = (scene) => {
    setSceneEditing(scene);
    setSceneModalOpen(true);
  };

  const handleSceneSave = async (values) => {
    try {
      const saved = await sceneApi.saveScene(values);
      setSceneModalOpen(false);
      setSceneEditing(null);
      setSelectedKeys([saved.menuKey || 'home']);
      await loadSceneHomeData(false);
      message.success(values.id ? '场景已更新' : '场景已创建');
    } catch (error) {
      message.error(error?.message || '保存场景失败');
    }
  };

  const handleDeleteScene = (scene) => {
    if (!scene?.id) return;
    Modal.confirm({
      title: '删除场景',
      content: `确定删除“${scene.name}”吗？该场景下的本地内容数据也会一并清除。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await sceneApi.removeScene(scene.id);
          if (selectedScene?.id === scene.id) {
            handleBackToHome();
          }
          await loadSceneHomeData(false);
          message.success('场景已删除');
        } catch (error) {
          message.error(error?.message || '删除场景失败');
        }
      },
    });
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
      openAgentQuotaPage('plans');
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
    } else if (key === 'scene-template') {
      setCurrentPage('scene-template');
    } else if (key === 'my-profile') {
      setCurrentPage('my-profile');
    } else if (key === 'teacher-portrait') {
      setCurrentPage('teacher-portrait');
    } else if (key === 'teacher-development') {
      setCurrentPage('teacher-development');
    } else if (key === 'teacher-evaluation-schemes') {
      setCurrentPage('teacher-evaluation-schemes');
    } else if (key === 'teacher-evaluation') {
      setTeacherEvaluationEntryContext(null);
      setCurrentPage('teacher-evaluation');
    } else if (key === 'capability-model') {
      setCurrentPage('capability-model');
    } else if (key === 'solution-management') {
      setCurrentPage('solution-management');
    } else if (key === 'dms') {
      setCurrentPage('dms');
    } else if (key === 'integration') {
      setCurrentPage('integration');
    } else if (
      currentPage === 'detail' ||
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
      currentPage === 'scene-template' ||
      currentPage === 'my-profile' ||
      currentPage === 'teacher-portrait' ||
      currentPage === 'teacher-development' ||
      currentPage === 'teacher-evaluation-schemes' ||
      currentPage === 'teacher-evaluation' ||
      currentPage === 'capability-model' ||
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
        <div className="icon-bar-list" ref={iconBarListRef}>
          <div
            className={`icon-bar-liquid-indicator ${iconBarIndicatorStyle.opacity ? 'is-visible' : ''}`}
            style={{
              width: `${iconBarIndicatorStyle.width}px`,
              height: `${iconBarIndicatorStyle.height}px`,
              transform: `translate3d(${iconBarIndicatorStyle.x}px, ${iconBarIndicatorStyle.y}px, 0)`,
              opacity: iconBarIndicatorStyle.opacity,
            }}
          />
          {iconBarItems.map((item) => (
            <div
              key={item.key}
              ref={(node) => setIconBarItemRef(item.key, node)}
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
        <ModelStatisticsModule onNavigateToQuota={openAgentQuotaPage} />
      ) : currentPage === 'agent-quota' ? (
        <AgentQuotaModule initialTab={agentQuotaEntryTab} />
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
      ) : currentPage === 'scene-template' ? (
        <SceneTemplateModule />
      ) : currentPage === 'my-profile' ? (
        <MyProfileModule onNavigateToTeacherEvaluation={openTeacherEvaluationPage} />
      ) : currentPage === 'teacher-portrait' ? (
        <TeacherPortraitModule onNavigateToTeacherEvaluation={openTeacherEvaluationPage} />
      ) : currentPage === 'teacher-development' ? (
        <TeacherDevelopmentModule />
      ) : currentPage === 'teacher-evaluation-schemes' ? (
        <TeacherEvaluationSchemeModule />
      ) : currentPage === 'teacher-evaluation' ? (
        <TeacherEvaluationModule initialContext={teacherEvaluationEntryContext} />
      ) : currentPage === 'capability-model' ? (
        <CapabilityModelModule />
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
              <div className="sider-menu-shell" ref={siderMenuShellRef}>
                <div
                  className={`sider-menu-liquid-indicator ${siderMenuIndicatorStyle.opacity ? 'is-visible' : ''}`}
                  style={{
                    width: `${siderMenuIndicatorStyle.width}px`,
                    height: `${siderMenuIndicatorStyle.height}px`,
                    transform: `translate3d(${siderMenuIndicatorStyle.x}px, ${siderMenuIndicatorStyle.y}px, 0)`,
                    opacity: siderMenuIndicatorStyle.opacity,
                  }}
                />
                <Menu
                  mode="inline"
                  selectedKeys={selectedKeys}
                  onClick={(e) => {
                    if (e.key === 'new-scene') {
                      openCreateSceneModal();
                      return;
                    }
                    setSelectedKeys([e.key]);
                  }}
                  items={menuItems}
                  className="sider-menu"
                />
              </div>
            </div>
          </Sider>

          {/* Main Area */}
          <Layout>
            {/* Header */}
            <Header className="app-header">
              <div className="header-title">果仁-沉浸式AI学习空间</div>
              <div className="header-actions">
                <Input
                  placeholder="搜索场景名称..."
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  className="search-input"
                  value={sceneKeyword}
                  onChange={(event) => setSceneKeyword(event.target.value)}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="new-topic-btn"
                  onClick={openCreateSceneModal}
                >
                  新建场景
                </Button>
              </div>
            </Header>

            {/* Content */}
            <Content className={currentPage === 'agent-quota' ? 'app-content app-content-full' : 'app-content'}>
              {sceneDataLoading ? (
                <div className="scene-empty-state">场景加载中...</div>
              ) : visibleScenes.length === 0 ? (
                <div className="scene-empty-state">
                  <Empty
                    description={activeSceneKey === 'home' ? '暂无场景，先创建一个模板化场景。' : '当前栏目暂无场景，先新建一个。'}
                  />
                </div>
              ) : (
                <div className="card-grid">
                  {visibleScenes.map((scene) => {
                    const theme = getSceneTheme(scene);
                    const roleList = (scene.templateSnapshot?.roles || []).slice(0, 3);
                    return (
                      <Card
                        key={scene.id}
                        className="scene-card"
                        hoverable
                        variant="borderless"
                        styles={{ body: { padding: 0 } }}
                        onClick={() => handleCardClick(scene)}
                      >
                        <div className="card-cover">
                          <div
                            className="wave-bg"
                            style={{
                              background: `linear-gradient(135deg, ${theme.coverStart || '#667eea'} 0%, ${theme.coverEnd || '#00f2fe'} 100%)`,
                            }}
                          >
                            <div className="card-cover-copy">
                              <span className="card-cover-badge">{theme.badgeText || getSceneTypeLabel(scene.sceneType)}</span>
                              <div className="card-cover-title">{theme.heroTitle || scene.templateName}</div>
                              <div className="card-cover-hint">{theme.surfaceHint || scene.templateName}</div>
                            </div>
                            <div className="card-cover-emoji">{theme.emoji || '🧩'}</div>
                            <svg className="wave-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                              <path d="M0,60 C100,20 150,100 250,50 C300,30 350,80 400,40 L400,120 L0,120 Z" fill="rgba(255,255,255,0.18)" />
                              <path d="M0,80 C80,50 160,100 240,70 C320,40 360,90 400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
                              <path d="M0,95 C60,75 120,110 200,88 C280,66 340,98 400,82 L400,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
                            </svg>
                          </div>
                          <Dropdown
                            menu={{
                              items: [
                                { key: 'edit', label: '编辑场景' },
                                { key: 'delete', label: '删除场景', danger: true },
                              ],
                              onClick: ({ key, domEvent }) => {
                                domEvent.stopPropagation();
                                if (key === 'edit') {
                                  openEditSceneModal(scene);
                                } else if (key === 'delete') {
                                  handleDeleteScene(scene);
                                }
                              },
                            }}
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
                          <div className="card-title" title={scene.name}>{scene.name}</div>
                          <div className="card-subtitle">{scene.description || theme.heroSubtitle || '未填写场景描述'}</div>
                          <div className="scene-card-meta-line">
                            <span>{scene.templateName}</span>
                            <span>{getSceneTypeLabel(scene.sceneType)}</span>
                          </div>
                          <div className="scene-role-list">
                            {roleList.map((role) => (
                              <span key={role.id} className="scene-role-pill">{role.name}</span>
                            ))}
                          </div>
                          <div className="card-footer">
                            <Tag className="visibility-tag">{getSceneVisibilityLabel(scene.visibility)}</Tag>
                            <span className="card-count">{scene.topicCount} 个主题</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Content>
          </Layout>
        </>
      ) : currentPage === 'detail' && selectedScene ? (
        <TopicDetail
          topicTitle={selectedScene.name}
          onBack={handleBackToHome}
          sceneConfig={selectedScene.templateSnapshot}
          sceneId={selectedScene.id}
          sceneType={selectedScene.sceneType}
          storageScopeKey={selectedScene.storageScopeKey}
          sceneDescription={selectedScene.description}
          sceneTypeLabel={getSceneTypeLabel(selectedScene.sceneType)}
        />
      ) : null}

      <SceneCreateModal
        open={sceneModalOpen}
        templates={sceneTemplates}
        initialValues={sceneEditing}
        defaultMenuKey={activeSceneKey !== 'home' ? activeSceneKey : undefined}
        onCancel={() => {
          setSceneModalOpen(false);
          setSceneEditing(null);
        }}
        onSubmit={handleSceneSave}
      />
    </Layout>
  );
}

export default App;
