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
  NodeIndexOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReadOutlined,
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
import KnowledgeGraphModule from './knowledgeGraph/KnowledgeGraphModule';
import CourseStudioModule from './courseStudio/CourseStudioModule';
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
import LuckyModule from './lucky/LuckyModule';
import TasksModule from './tasks/TasksModule';
import SceneCreateModal from './scene/SceneCreateModal';
import { getSceneStoreChangeEventName, getSceneTypeLabel, getSceneVisibilityLabel, sceneApi } from './scene/api';
import { getSceneThemeCoverStyle } from './scene/themeCovers';
import { getLuckyConversationId } from './messages/luckyPushStore';
import { setAnalyticsContext, trackEvent, trackPageView } from './shared/analytics';
import './App.css';

const { Sider, Header, Content } = Layout;
const EMPTY_MENU_INDICATOR = { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
const SCENE_SHORTCUT_KEY_PREFIX = 'scene-shortcut:';
const SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX = 'scene-system-menu:';
const ICON_BAR_WIDTH_STORAGE_KEY = 'gr.icon-bar-width.v1';
const SCENE_SIDER_WIDTH_STORAGE_KEY = 'gr.scene.sider-width.v1';
const DEFAULT_SCENE_GROUP_NAME = '人工智能通识体系';

function getDefaultIconBarWidth() {
  return 64;
}

function getBoundedIconBarWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) return getDefaultIconBarWidth();
  return Math.max(64, Math.min(220, Math.round(width)));
}

function loadIconBarWidth() {
  if (typeof window === 'undefined') return getDefaultIconBarWidth();
  try {
    return getBoundedIconBarWidth(window.localStorage.getItem(ICON_BAR_WIDTH_STORAGE_KEY));
  } catch {
    return getDefaultIconBarWidth();
  }
}

function persistIconBarWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ICON_BAR_WIDTH_STORAGE_KEY, String(getBoundedIconBarWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

function getDefaultSceneSiderWidth() {
  return 220;
}

function getBoundedSceneSiderWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) return getDefaultSceneSiderWidth();
  return Math.max(188, Math.min(420, Math.round(width)));
}

function loadSceneSiderWidth() {
  if (typeof window === 'undefined') return getDefaultSceneSiderWidth();
  try {
    return getBoundedSceneSiderWidth(window.localStorage.getItem(SCENE_SIDER_WIDTH_STORAGE_KEY));
  } catch {
    return getDefaultSceneSiderWidth();
  }
}

function persistSceneSiderWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCENE_SIDER_WIDTH_STORAGE_KEY, String(getBoundedSceneSiderWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

function parseHashRoute(rawHash = '') {
  const normalized = String(rawHash || '').replace(/^#/, '');
  if (!normalized) {
    return { page: '', params: {} };
  }

  const [pagePart, queryPart = ''] = normalized.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryPart).entries());
  return {
    page: pagePart,
    params,
  };
}

function getInitialHashRoute() {
  if (typeof window === 'undefined') {
    return { page: '', params: {} };
  }
  return parseHashRoute(window.location.hash);
}

function getInitialActiveIconKey() {
  const route = getInitialHashRoute();
  if (route.page === 'knowledge-graph-full') {
    return 'knowledge-graph';
  }
  if (route.page === 'capability-model-full') {
    return 'capability-model';
  }
  return route.page || 'my-space';
}

function getSceneTheme(scene) {
  return scene?.templateSnapshot?.theme || {};
}

const sceneMenuGroups = [
  {
    key: 'my-scenes',
    label: '我的场景',
    children: [
      { key: 'my-learning-space', icon: <DesktopOutlined />, label: '我的学习空间' },
      { key: 'workshop', icon: <TeamOutlined />, label: '研讨会' },
      { key: 'study-club-channel', icon: <RocketOutlined />, label: '研习社-频道' },
    ],
  },
  {
    key: 'cloud',
    label: '',
    children: [
      { key: 'my-classroom', icon: <CloudOutlined />, label: '我的课堂' },
      { key: 'workshop-cloud', icon: <FolderOutlined />, label: '工作坊' },
    ],
  },
  {
    key: 'resource',
    label: '',
    children: [
      { key: 'teaching-research', icon: <BookOutlined />, label: '教研空间' },
      { key: 'course-creation-center', icon: <ReadOutlined />, label: '课程创作中心' },
      { key: 'org-training', icon: <DatabaseOutlined />, label: '组织培训' },
    ],
  },
];

const sceneMenuIconMap = Object.freeze({
  'my-learning-space': <DesktopOutlined />,
  workshop: <TeamOutlined />,
  'study-club-channel': <RocketOutlined />,
  'my-classroom': <CloudOutlined />,
  'workshop-cloud': <FolderOutlined />,
  'teaching-research': <BookOutlined />,
  'course-creation-center': <ReadOutlined />,
  'org-training': <DatabaseOutlined />,
});

function getSceneShortcutMenuKey(sceneId) {
  return `${SCENE_SHORTCUT_KEY_PREFIX}${sceneId}`;
}

function getSceneSystemMenuShortcutKey(menuKey) {
  return `${SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX}${menuKey}`;
}

function getSceneMenuIcon(menuKey) {
  return sceneMenuIconMap[menuKey] || <AppstoreOutlined />;
}

// Left icon bar items
const baseIconBarItems = [
  { key: 'my-space', icon: <AppstoreOutlined />, label: '空间', active: true },
  { key: 'cloud-disk', icon: <CloudOutlined />, label: '云盘' },
  { key: 'resource-lib', icon: <BookOutlined />, label: '资料库' },
  { key: 'resource-parse', icon: <ScanOutlined />, label: '资料解析' },
  { key: 'knowledge-space', icon: <BulbOutlined />, label: '知识空间' },
  { key: 'knowledge-graph', icon: <NodeIndexOutlined />, label: '知识图谱' },
  { key: 'course-studio', icon: <ReadOutlined />, label: '课程创作中心' },
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
  const [activeIconKey, setActiveIconKey] = useState(() => getInitialActiveIconKey());
  const [currentPage, setCurrentPage] = useState(() => getInitialHashRoute().page || 'home'); // 'home', 'detail', or 'workflow'
  const [agentQuotaEntryTab, setAgentQuotaEntryTab] = useState('plans');
  const [teacherEvaluationEntryContext, setTeacherEvaluationEntryContext] = useState(null);
  const [messageEntryConversationId, setMessageEntryConversationId] = useState(null);
  const [knowledgeGraphEntry, setKnowledgeGraphEntry] = useState(() => {
    const route = getInitialHashRoute();
    if ((route.page !== 'knowledge-graph' && route.page !== 'knowledge-graph-full') || !route.params.graphId) return null;
    return {
      graphId: route.params.graphId,
      collectionId: route.params.collectionId || null,
      mode: route.params.mode || 'curriculum',
      requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  });
  const [capabilityModelEntry] = useState(() => {
    const route = getInitialHashRoute();
    if ((route.page !== 'capability-model' && route.page !== 'capability-model-full') || !route.params.modelId) return null;
    return {
      modelId: route.params.modelId,
      mode: route.params.mode || 'preview',
      requestId: route.params.requestId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  });
  const [selectedScene, setSelectedScene] = useState(null);
  const [sceneTemplates, setSceneTemplates] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [sceneKeyword, setSceneKeyword] = useState('');
  const [sceneDataLoading, setSceneDataLoading] = useState(true);
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [sceneEditing, setSceneEditing] = useState(null);
  const [sceneModalMode, setSceneModalMode] = useState('scene');
  const [sceneSystemMenuShortcutKeys, setSceneSystemMenuShortcutKeys] = useState([]);
  const [iconBarWidth, setIconBarWidth] = useState(() => loadIconBarWidth());
  const [sceneSiderWidth, setSceneSiderWidth] = useState(() => loadSceneSiderWidth());
  const [iconBarIndicatorStyle, setIconBarIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const [siderMenuIndicatorStyle, setSiderMenuIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const iconBarListRef = useRef(null);
  const iconBarItemRefs = useRef(new Map());
  const siderMenuShellRef = useRef(null);
  const iconBarWidthRef = useRef(iconBarWidth);
  const sceneSiderWidthRef = useRef(sceneSiderWidth);
  const handleToggleSceneSystemMenuShortcut = useCallback(async (menuKey, enabled) => {
    try {
      const nextKeys = await sceneApi.toggleSceneSystemMenuShortcut(menuKey, enabled);
      setSceneSystemMenuShortcutKeys(nextKeys);
      if (!enabled && activeIconKey === getSceneSystemMenuShortcutKey(menuKey)) {
        setActiveIconKey('my-space');
      }
      message.success(enabled ? '已添加到系统菜单' : '已从系统菜单移除');
    } catch (error) {
      message.error(error?.message || '更新系统菜单失败');
    }
  }, [activeIconKey]);
  const selectedSceneMenuKey = selectedKeys[0] || 'home';
  const activeSceneKey = selectedSceneMenuKey.startsWith(SCENE_SHORTCUT_KEY_PREFIX)
    ? 'home'
    : selectedSceneMenuKey;
  const isSystemMenuSceneCategoryEntry = activeIconKey.startsWith(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX);
  const shortcutScenes = useMemo(() => (
    scenes
      .filter((scene) => scene.menuShortcutEnabled)
      .sort((left, right) => String(left.menuShortcutAt || '').localeCompare(String(right.menuShortcutAt || '')))
  ), [scenes]);
  const systemMenuShortcutSet = useMemo(
    () => new Set(sceneSystemMenuShortcutKeys),
    [sceneSystemMenuShortcutKeys],
  );
  const iconBarItems = useMemo(() => {
    const sceneCategoryItems = sceneSystemMenuShortcutKeys.map((menuKey) => ({
      key: getSceneSystemMenuShortcutKey(menuKey),
      icon: getSceneMenuIcon(menuKey),
      label: sceneApi.getSceneMenuLabel(menuKey),
    }));
    return [
      ...baseIconBarItems.slice(0, 1),
      ...sceneCategoryItems,
      ...baseIconBarItems.slice(1),
    ];
  }, [sceneSystemMenuShortcutKeys]);
  const menuItems = useMemo(() => {
    const baseItems = [
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
      ...sceneMenuGroups.map((group) => ({
        key: group.key,
        type: 'group',
        label: group.label,
        children: group.children.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: (
            <span className="scene-menu-item-label">
              <span className="scene-menu-item-text" title={item.label}>{item.label}</span>
              <button
                type="button"
                className={`scene-menu-pin-btn ${systemMenuShortcutSet.has(item.key) ? 'is-pinned' : ''}`}
                aria-label={systemMenuShortcutSet.has(item.key) ? '从系统菜单移除' : '添加到系统菜单'}
                title={systemMenuShortcutSet.has(item.key) ? '从系统菜单移除' : '添加到系统菜单'}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleToggleSceneSystemMenuShortcut(item.key, !systemMenuShortcutSet.has(item.key));
                }}
              >
                {systemMenuShortcutSet.has(item.key) ? <PushpinFilled /> : <PushpinOutlined />}
              </button>
            </span>
          ),
        })),
      })),
    ];

    const shortcutItems = shortcutScenes.map((scene) => ({
      key: getSceneShortcutMenuKey(scene.id),
      icon: getSceneMenuIcon(scene.menuKey),
      label: <span className="scene-shortcut-menu-label" title={scene.name}>{scene.name}</span>,
    }));

    if (shortcutItems.length === 0) {
      return baseItems;
    }

    const insertIndex = baseItems.findIndex((item) => item.key === 'cloud');
    const shortcutGroup = {
      key: 'scene-shortcuts',
      type: 'group',
      label: '快捷方式',
      children: shortcutItems,
    };

    if (insertIndex === -1) {
      return [...baseItems, shortcutGroup];
    }

    return [
      ...baseItems.slice(0, insertIndex),
      shortcutGroup,
      ...baseItems.slice(insertIndex),
    ];
  }, [handleToggleSceneSystemMenuShortcut, shortcutScenes, systemMenuShortcutSet]);

  const menuFilteredScenes = useMemo(() => {
    return scenes.filter((scene) => (
      activeSceneKey === 'home' || scene.menuKey === activeSceneKey
    ));
  }, [activeSceneKey, scenes]);

  const visibleScenes = useMemo(() => {
    const normalizedKeyword = sceneKeyword.trim().toLowerCase();
    return menuFilteredScenes.filter((scene) => {
      if (!normalizedKeyword) return true;
      const haystack = `${scene.name} ${scene.sceneGroupName || ''} ${scene.templateName} ${scene.description || ''}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [menuFilteredScenes, sceneKeyword]);

  const buildSceneGroups = useCallback((sceneList) => {
    const groupMap = new Map();
    sceneList.forEach((scene) => {
      const groupName = scene.sceneGroupName || DEFAULT_SCENE_GROUP_NAME;
      const currentGroup = groupMap.get(groupName) || {
        key: groupName,
        name: groupName,
        spaces: [],
      };
      currentGroup.spaces.push(scene);
      groupMap.set(groupName, currentGroup);
    });
    return Array.from(groupMap.values());
  }, []);

  const currentSceneGroups = useMemo(
    () => buildSceneGroups(menuFilteredScenes),
    [buildSceneGroups, menuFilteredScenes],
  );

  const visibleSceneGroups = useMemo(
    () => buildSceneGroups(visibleScenes),
    [buildSceneGroups, visibleScenes],
  );

  const sceneGroupOptions = useMemo(() => {
    return currentSceneGroups.map((group) => ({
      label: group.name,
      value: group.name,
    }));
  }, [currentSceneGroups]);

  const homeHeaderTitle = useMemo(() => {
    if (currentSceneGroups.length === 1) {
      return currentSceneGroups[0].name;
    }
    if (isSystemMenuSceneCategoryEntry && activeSceneKey !== 'home') {
      return sceneApi.getSceneMenuLabel(activeSceneKey);
    }
    return DEFAULT_SCENE_GROUP_NAME;
  }, [activeSceneKey, currentSceneGroups, isSystemMenuSceneCategoryEntry]);

  const loadSceneHomeData = useCallback(async (withLoading = true) => {
    if (withLoading) {
      setSceneDataLoading(true);
    }
    try {
      await sceneApi.seed();
      const [nextTemplates, nextScenes, nextSystemMenuShortcutKeys] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
        sceneApi.listSceneSystemMenuShortcuts(),
      ]);
      setSceneTemplates(nextTemplates);
      setScenes(nextScenes);
      setSceneSystemMenuShortcutKeys(nextSystemMenuShortcutKeys);
      setSelectedScene((prev) => {
        if (!prev?.id) return prev;
        return nextScenes.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      message.error(error?.message || '加载空间数据失败');
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

  const handleSceneSiderResizeStart = useCallback((event) => {
    if (isSystemMenuSceneCategoryEntry) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sceneSiderWidth;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setSceneSiderWidth(getBoundedSceneSiderWidth(startWidth + deltaX));
    };

    const handlePointerUp = () => {
      persistSceneSiderWidth(sceneSiderWidthRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isSystemMenuSceneCategoryEntry, sceneSiderWidth]);

  const handleIconBarResizeStart = useCallback((event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = iconBarWidth;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setIconBarWidth(getBoundedIconBarWidth(startWidth + deltaX));
    };

    const handlePointerUp = () => {
      persistIconBarWidth(iconBarWidthRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [iconBarWidth]);

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
    setAnalyticsContext({
      product: 'guoren-v2',
      platform: 'web',
    });
  }, []);

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

  useEffect(() => {
    const currentKey = selectedKeys[0];
    if (!currentKey?.startsWith(SCENE_SHORTCUT_KEY_PREFIX)) return;

    const sceneId = currentKey.slice(SCENE_SHORTCUT_KEY_PREFIX.length);
    const matchedScene = scenes.find((scene) => scene.id === sceneId && scene.menuShortcutEnabled);
    if (matchedScene) return;

    setSelectedKeys([selectedScene?.menuKey || 'home']);
  }, [scenes, selectedKeys, selectedScene]);

  useEffect(() => {
    if (!activeIconKey.startsWith(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX)) return;
    const menuKey = activeIconKey.slice(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX.length);
    if (sceneSystemMenuShortcutKeys.includes(menuKey)) return;
    setActiveIconKey('my-space');
  }, [activeIconKey, sceneSystemMenuShortcutKeys]);

  useEffect(() => {
    iconBarWidthRef.current = iconBarWidth;
  }, [iconBarWidth]);

  useEffect(() => {
    sceneSiderWidthRef.current = sceneSiderWidth;
  }, [sceneSiderWidth]);

  useEffect(() => {
    const pageId = currentPage === 'detail' && selectedScene ? 'space_detail' : currentPage;
    const pageName = currentPage === 'detail' && selectedScene ? selectedScene.name : currentPage;
    const module = currentPage === 'home' || currentPage === 'detail'
      ? 'space'
      : currentPage.startsWith('teacher')
        ? 'teacher'
        : currentPage;

    setAnalyticsContext({
      pageId,
      pageName,
      module,
    });

    trackPageView(pageId, {
      module,
      pageName,
      objectType: currentPage === 'detail' && selectedScene ? 'scene' : 'page',
      objectId: currentPage === 'detail' && selectedScene ? selectedScene.id : pageId,
      properties: currentPage === 'detail' && selectedScene
        ? {
            sceneId: selectedScene.id,
            sceneName: selectedScene.name,
            sceneType: selectedScene.sceneType,
          }
        : {
            currentPage,
          },
    });
  }, [currentPage, selectedScene]);

  const handleCardClick = useCallback((scene, source = 'catalog') => {
    trackEvent('space_scene_open', {
      module: 'space',
      pageId: 'space_home',
      pageName: '空间首页',
      objectType: 'scene',
      objectId: scene.id,
      properties: {
        sceneName: scene.name,
        sceneType: scene.sceneType,
        templateName: scene.templateName,
        source,
      },
    });
    setSelectedScene(scene);
    setCurrentPage('detail');
  }, []);

  const handleBackToHome = () => {
    if (selectedKeys[0]?.startsWith(SCENE_SHORTCUT_KEY_PREFIX)) {
      setSelectedKeys([selectedScene?.menuKey || 'home']);
    }
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

  const openMyProfilePage = useCallback(() => {
    setActiveIconKey('my-profile');
    setCurrentPage('my-profile');
  }, []);

  const openMessagesPage = useCallback((conversationId = null) => {
    setActiveIconKey(conversationId === getLuckyConversationId() ? 'lucky' : 'messages');
    setMessageEntryConversationId(conversationId);
    setCurrentPage('messages');
  }, []);

  const openResourceLibraryPage = useCallback(() => {
    setActiveIconKey('resource-lib');
    setCurrentPage('resource-lib');
  }, []);

  const openKnowledgeGraphPage = useCallback((payload = {}) => {
    setActiveIconKey('knowledge-graph');
    const nextEntry = payload?.graphId ? {
      graphId: payload.graphId,
      collectionId: payload.collectionId || null,
      mode: payload.mode || 'curriculum',
      requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    } : null;
    setKnowledgeGraphEntry(nextEntry);
    if (typeof window !== 'undefined') {
      if (nextEntry?.graphId) {
        const params = new URLSearchParams({
          graphId: nextEntry.graphId,
          mode: nextEntry.mode || 'curriculum',
        });
        if (nextEntry.collectionId) {
          params.set('collectionId', nextEntry.collectionId);
        }
        window.location.hash = `knowledge-graph?${params.toString()}`;
      } else {
        window.location.hash = 'knowledge-graph';
      }
    }
    setCurrentPage('knowledge-graph');
  }, []);

  const openSceneRecommendation = useCallback((payload = {}) => {
    setActiveIconKey('my-space');
    if (payload.menuKey) {
      setSelectedKeys([payload.menuKey]);
    }

    const matchedScene = payload.sceneId
      ? scenes.find((item) => item.id === payload.sceneId) || null
      : null;

    if (matchedScene) {
      handleCardClick(matchedScene, 'recommendation');
      return;
    }

    setSelectedScene(null);
    setCurrentPage('home');
  }, [handleCardClick, scenes]);

  const openCreateSceneModal = () => {
    setSceneModalMode('scene');
    setSceneEditing(null);
    setSceneModalOpen(true);
  };

  const openCreateSpaceModal = () => {
    setSceneModalMode('space');
    setSceneEditing(null);
    setSceneModalOpen(true);
  };

  const openEditSceneModal = (scene) => {
    setSceneModalMode('space');
    setSceneEditing(scene);
    setSceneModalOpen(true);
  };

  const handleToggleSceneMenuShortcut = async (scene, enabled) => {
    if (!scene?.id) return;
    try {
      const saved = await sceneApi.toggleSceneMenuShortcut(scene.id, enabled);
      if (!enabled && selectedKeys[0] === getSceneShortcutMenuKey(scene.id)) {
        setSelectedKeys([saved.menuKey || 'home']);
      }
      setSelectedScene((prev) => (prev?.id === saved.id ? saved : prev));
      await loadSceneHomeData(false);
      message.success(enabled ? '已添加到菜单快捷方式' : '已从菜单快捷方式移除');
    } catch (error) {
      message.error(error?.message || '更新菜单快捷方式失败');
    }
  };

  const handleSceneSave = async (values) => {
    try {
      const saved = await sceneApi.saveScene(values);
      setSceneModalOpen(false);
      setSceneEditing(null);
      setSelectedKeys([saved.menuKey || 'home']);
      await loadSceneHomeData(false);
      message.success(values.id
        ? (sceneModalMode === 'scene' ? '场景已更新' : '空间已更新')
        : (sceneModalMode === 'scene' ? '场景已创建' : '空间已创建'));
    } catch (error) {
      message.error(error?.message || (sceneModalMode === 'scene' ? '保存场景失败' : '保存空间失败'));
    }
  };

  const handleDeleteScene = (scene) => {
    if (!scene?.id) return;
    Modal.confirm({
      title: '删除空间',
      content: `确定删除“${scene.name}”吗？该空间下的本地内容数据也会一并清除。`,
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
          message.success('空间已删除');
        } catch (error) {
          message.error(error?.message || '删除空间失败');
        }
      },
    });
  };

  const handleIconBarClick = (key) => {
    setActiveIconKey(key);
    if (key.startsWith(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX)) {
      const menuKey = key.slice(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX.length);
      setSelectedKeys([menuKey]);
      setSelectedScene(null);
      setCurrentPage('home');
    } else if (key === 'workflow') {
      setCurrentPage('workflow');
    } else if (key === 'messages') {
      openMessagesPage();
    } else if (key === 'lucky') {
      setCurrentPage('lucky');
    } else if (key === 'lucky-backend') {
      setCurrentPage('lucky-backend');
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
      openResourceLibraryPage();
    } else if (key === 'resource-parse') {
      setCurrentPage('resource-parse');
    } else if (key === 'knowledge-graph') {
      openKnowledgeGraphPage();
    } else if (key === 'course-studio') {
      setCurrentPage('course-studio');
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
    } else if (key === 'tasks') {
      setCurrentPage('tasks');
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
      currentPage === 'knowledge-graph' ||
      currentPage === 'course-studio' ||
      currentPage === 'archive' ||
      currentPage === 'study-club' ||
      currentPage === 'lucky' ||
      currentPage === 'lucky-backend' ||
      currentPage === 'learning-analytics' ||
      currentPage === 'agent-quota' ||
      currentPage === 'online-dev' ||
      currentPage === 'quick-build' ||
      currentPage === 'page-designer' ||
      currentPage === 'tasks' ||
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

  // 知识图谱全屏页面（独立全屏，不带侧边图标栏）
  if (currentPage === 'knowledge-graph-full') {
    return (
      <KnowledgeGraphModule
        entryGraphId={knowledgeGraphEntry?.graphId || null}
        entryCollectionId={knowledgeGraphEntry?.collectionId || null}
        entryMode={knowledgeGraphEntry?.mode || 'curriculum'}
        entryRequestId={knowledgeGraphEntry?.requestId || null}
        showBackButton={false}
      />
    );
  }

  if (currentPage === 'capability-model-full') {
    return (
      <CapabilityModelModule
        standalone
        entryModelId={capabilityModelEntry?.modelId || null}
        entryMode={capabilityModelEntry?.mode || 'preview'}
        entryRequestId={capabilityModelEntry?.requestId || null}
      />
    );
  }

  return (
    <Layout className="app-layout">
      {/* Far-left Icon Bar */}
      <div className="icon-bar" style={{ width: iconBarWidth, minWidth: iconBarWidth, maxWidth: iconBarWidth }}>
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
      <div className="icon-bar-resize-handle" onMouseDown={handleIconBarResizeStart} />

      {/* Page Content */}
      {currentPage === 'messages' ? (
        <MessagesModule
          key={messageEntryConversationId || 'messages-default'}
          initialConversationId={messageEntryConversationId}
          onNavigateToTeacherEvaluation={openTeacherEvaluationPage}
          onNavigateToResource={openResourceLibraryPage}
        />
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
        <ResourceLibrary onOpenKnowledgeGraph={openKnowledgeGraphPage} />
      ) : currentPage === 'resource-parse' ? (
        <ResourceParseStatus />
      ) : currentPage === 'knowledge-graph' ? (
        <KnowledgeGraphModule
          entryGraphId={knowledgeGraphEntry?.graphId || null}
          entryCollectionId={knowledgeGraphEntry?.collectionId || null}
          entryMode={knowledgeGraphEntry?.mode || 'curriculum'}
          entryRequestId={knowledgeGraphEntry?.requestId || null}
        />
      ) : currentPage === 'course-studio' ? (
        <CourseStudioModule />
      ) : currentPage === 'archive' ? (
        <ArchiveModule />
      ) : currentPage === 'study-club' ? (
        <StudyClubModule />
      ) : currentPage === 'lucky' ? (
        <LuckyModule key="lucky-workspace" mode="workspace" />
      ) : currentPage === 'lucky-backend' ? (
        <LuckyModule key="lucky-backend" mode="backend" />
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
      ) : currentPage === 'tasks' ? (
        <TasksModule />
      ) : currentPage === 'tag-management' ? (
        <TagManagement />
      ) : currentPage === 'app-center' ? (
        <AppCenterModule />
      ) : currentPage === 'scene-template' ? (
        <SceneTemplateModule />
      ) : currentPage === 'my-profile' ? (
        <MyProfileModule onNavigateToTeacherEvaluation={openTeacherEvaluationPage} />
      ) : currentPage === 'teacher-portrait' ? (
        <TeacherPortraitModule
          onNavigateToTeacherEvaluation={openTeacherEvaluationPage}
          onNavigateToScene={openSceneRecommendation}
          onNavigateToResource={openResourceLibraryPage}
        />
      ) : currentPage === 'teacher-development' ? (
        <TeacherDevelopmentModule />
      ) : currentPage === 'teacher-evaluation-schemes' ? (
        <TeacherEvaluationSchemeModule />
      ) : currentPage === 'teacher-evaluation' ? (
        <TeacherEvaluationModule initialContext={teacherEvaluationEntryContext} onNavigateToMyProfile={openMyProfilePage} />
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
          {!isSystemMenuSceneCategoryEntry ? (
            <>
              <Sider width={sceneSiderWidth} className="app-sider" style={{ width: sceneSiderWidth, minWidth: sceneSiderWidth, maxWidth: sceneSiderWidth }}>
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
                        if (e.key.startsWith(SCENE_SHORTCUT_KEY_PREFIX)) {
                          const sceneId = e.key.slice(SCENE_SHORTCUT_KEY_PREFIX.length);
                          const matchedScene = scenes.find((item) => item.id === sceneId) || null;
                          if (matchedScene) {
                            setSelectedKeys([e.key]);
                            handleCardClick(matchedScene, 'menu_shortcut');
                          }
                          return;
                        }
                        if (e.key === 'home') {
                          setActiveIconKey('my-space');
                        } else if (systemMenuShortcutSet.has(e.key)) {
                          setActiveIconKey(getSceneSystemMenuShortcutKey(e.key));
                        } else {
                          setActiveIconKey('my-space');
                        }
                        setSelectedKeys([e.key]);
                      }}
                      items={menuItems}
                      className="sider-menu"
                    />
                  </div>
                </div>
              </Sider>
              <div className="app-sider-resize-handle" onMouseDown={handleSceneSiderResizeStart} />
            </>
          ) : null}

          {/* Main Area */}
          <Layout>
            {/* Header */}
            <Header className="app-header">
              <div className="header-title">{homeHeaderTitle}</div>
              <div className="header-actions">
                <Input
                  placeholder="搜索空间名称..."
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
                  onClick={openCreateSpaceModal}
                >
                  新建空间
                </Button>
              </div>
            </Header>

            {/* Content */}
            <Content className={currentPage === 'agent-quota' ? 'app-content app-content-full' : 'app-content'}>
              {sceneDataLoading ? (
                <div className="scene-empty-state">空间加载中...</div>
              ) : visibleScenes.length === 0 ? (
                <div className="scene-empty-state">
                  <Empty
                    description={activeSceneKey === 'home' ? '暂无空间，先创建一个模板化空间。' : '当前栏目暂无空间，先新建一个。'}
                  />
                </div>
              ) : (
                <div className="scene-group-list">
                  {visibleSceneGroups.map((group) => (
                    <section key={group.key} className="scene-group-section">
                      {currentSceneGroups.length > 1 ? (
                        <div className="scene-group-header">
                          <div>
                            <div className="scene-group-title">{group.name}</div>
                            <div className="scene-group-subtitle">一个场景下可承载多个空间。</div>
                          </div>
                          <div className="scene-group-count">{group.spaces.length} 个空间</div>
                        </div>
                      ) : null}
                      <div className="card-grid">
                        {group.spaces.map((scene) => {
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
                                  style={getSceneThemeCoverStyle(theme, {
                                    overlayStart: 'rgba(15, 23, 42, 0.18)',
                                    overlayEnd: 'rgba(15, 23, 42, 0.04)',
                                  })}
                                >
                                  <div className="card-cover-copy">
                                    <span className="card-cover-badge">{theme.badgeText || getSceneTypeLabel(scene.sceneType)}</span>
                                    <div className="card-cover-title">{theme.heroTitle || scene.templateName}</div>
                                    <div className="card-cover-hint">{theme.surfaceHint || scene.templateName}</div>
                                  </div>
                                  <svg className="wave-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                                    <path d="M0,60 C100,20 150,100 250,50 C300,30 350,80 400,40 L400,120 L0,120 Z" fill="rgba(255,255,255,0.18)" />
                                    <path d="M0,80 C80,50 160,100 240,70 C320,40 360,90 400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
                                    <path d="M0,95 C60,75 120,110 200,88 C280,66 340,98 400,82 L400,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
                                  </svg>
                                </div>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'toggle-shortcut',
                                        label: scene.menuShortcutEnabled ? '从菜单移除快捷方式' : '添加到菜单快捷方式',
                                      },
                                      { key: 'edit', label: '编辑空间' },
                                      { key: 'delete', label: '删除空间', danger: true },
                                    ],
                                    onClick: ({ key, domEvent }) => {
                                      domEvent.stopPropagation();
                                      if (key === 'toggle-shortcut') {
                                        handleToggleSceneMenuShortcut(scene, !scene.menuShortcutEnabled);
                                      } else if (key === 'edit') {
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
                                <div className="card-subtitle">{scene.description || theme.heroSubtitle || '未填写空间描述'}</div>
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
                                  {scene.menuShortcutEnabled ? (
                                    <Tag className="scene-shortcut-tag">菜单快捷方式</Tag>
                                  ) : null}
                                  <span className="card-count">{scene.topicCount} 个主题</span>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </Content>
          </Layout>
        </>
      ) : currentPage === 'detail' && selectedScene ? (
        <TopicDetail
          topicTitle={selectedScene.name}
          onBack={handleBackToHome}
          onOpenKnowledgeGraph={openKnowledgeGraphPage}
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
        sceneGroupOptions={sceneGroupOptions}
        initialValues={sceneEditing}
        defaultMenuKey={activeSceneKey !== 'home' ? activeSceneKey : undefined}
        defaultSceneGroupName={currentSceneGroups.length === 1 ? currentSceneGroups[0].name : undefined}
        mode={sceneModalMode}
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
