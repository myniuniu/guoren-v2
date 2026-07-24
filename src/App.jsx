import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layout, Menu, Input, Button, Card, Dropdown, Empty, Form, Modal, Segmented, Tag, message } from 'antd';
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
  BranchesOutlined,
  CloudOutlined,
  BookOutlined,
  AuditOutlined,
  FolderOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  UserOutlined,
  ClusterOutlined,
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
  FileTextOutlined,
  GiftOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReadOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  CheckCircleFilled,
  CustomerServiceOutlined,
  LogoutOutlined,
  QrcodeOutlined,
  RightOutlined,
  TrophyOutlined,
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
import { setPendingResourceLibraryEntry } from './resourceLib/resourceLibraryEntry';
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
import KnowledgeSpaceModule from './knowledgeSpace/KnowledgeSpaceModule';
import KnowledgeGraphModule from './knowledgeGraph/KnowledgeGraphModule';
import CourseStudioModule from './courseStudio/CourseStudioModule';
import MyProfileModule from './myProfile/MyProfileModule';
import MessagesModule from './messages/MessagesModule';
import AgentQuotaModule from './agentQuota/AgentQuotaModule';
import ModelStatisticsModule from './modelStatistics/ModelStatisticsModule';
import SolutionPrototypeModule from './solutionPrototype/SolutionPrototypeModule';
import PackagePrototypeModule from './packagePrototype/PackagePrototypeModule';
import TenantPrototypeModule from './tenantPrototype/TenantPrototypeModule';
import SceneTemplateModule from './scene/SceneTemplateModule';
import CapabilityModelModule from './capabilityModel/CapabilityModelModule';
import TeacherEvaluationModule from './teacherEvaluation/TeacherEvaluationModule';
import TeacherEvaluationSchemeModule from './teacherEvaluation/TeacherEvaluationSchemeModule';
import TeacherDevelopmentModule from './teacherDevelopment/TeacherDevelopmentModule';
import TeacherPortraitModule from './teacherPortrait/TeacherPortraitModule';
import ResourceRecommendationModule from './resourceRecommendation/ResourceRecommendationModule';
import LuckyModule from './lucky/LuckyModule';
import TasksModule from './tasks/TasksModule';
import PointsUserModule from './points/PointsUserModule';
import PointsAdminModule from './points/PointsAdminModule';
import SceneCreateModal from './scene/SceneCreateModal';
import {
  getSceneStoreChangeEventName,
  getSceneTypeLabel,
  getSceneVisibilityLabel,
  normalizeTopicCardConfig,
  sceneApi,
} from './scene/api';
import { getSceneThemeCoverStyle } from './scene/themeCovers';
import { getLuckyConversationId, getLuckyPushStoreEventName, readLuckyConversation } from './messages/luckyPushStore';
import { getInitialMessagesUnreadCount } from './messages/messageUnread';
import { setAnalyticsContext, trackEvent, trackPageView } from './shared/analytics';
import './App.css';

const { Sider, Header, Content } = Layout;
const EMPTY_MENU_INDICATOR = { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
const SCENE_SHORTCUT_KEY_PREFIX = 'scene-shortcut:';
const SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX = 'scene-system-menu:';
const ICON_BAR_WIDTH_STORAGE_KEY = 'gr.icon-bar-width.v1';
const SCENE_SIDER_WIDTH_STORAGE_KEY = 'gr.scene.sider-width.v1';
const RESOURCE_LIBRARY_ENTRY_STORAGE_KEY = 'gr.resource-library-entry.v1';
const DEFAULT_SCENE_GROUP_NAME = '人工智能通识体系';
const SCENE_HOME_OWNERSHIP_TABS = Object.freeze([
  { key: 'created', label: '我创建的' },
  { key: 'joined', label: '我加入的' },
]);
const JOINED_SCENE_ID_SET = new Set([
  'scene_research_seed_1',
  'scene_training_seed_1',
  'scene_training_seed_2',
  'scene_community_seed_1',
]);

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

const APP_HASH_ROUTE_PAGES = new Set([
  'knowledge-graph',
  'knowledge-graph-full',
  'capability-model',
  'capability-model-full',
  'resource-recommendation',
]);

function replaceAppHash(nextHash = '') {
  if (typeof window === 'undefined') return;
  const normalizedHash = String(nextHash || '').replace(/^#/, '');
  const nextUrl = `${window.location.pathname}${window.location.search}${normalizedHash ? `#${normalizedHash}` : ''}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl === nextUrl) return;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function buildPersistentHashRoute(page, knowledgeGraphEntry, capabilityModelEntry) {
  if (page === 'knowledge-graph-full' && knowledgeGraphEntry?.graphId) {
    const params = new URLSearchParams({
      graphId: knowledgeGraphEntry.graphId,
      mode: knowledgeGraphEntry.mode || 'curriculum',
    });
    if (knowledgeGraphEntry.collectionId) {
      params.set('collectionId', knowledgeGraphEntry.collectionId);
    }
    return `knowledge-graph-full?${params.toString()}`;
  }

  if (page === 'capability-model-full' && capabilityModelEntry?.modelId) {
    const params = new URLSearchParams({
      modelId: capabilityModelEntry.modelId,
      mode: capabilityModelEntry.mode || 'preview',
    });
    if (capabilityModelEntry.requestId) {
      params.set('requestId', capabilityModelEntry.requestId);
    }
    return `capability-model-full?${params.toString()}`;
  }

  if (page === 'resource-recommendation') {
    return 'resource-recommendation';
  }

  return '';
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

function resolveSceneOwnershipTab(scene = {}) {
  const membershipType = String(scene.membershipType || '').trim().toUpperCase();
  if (membershipType === 'JOINED') return 'joined';
  if (membershipType === 'CREATED') return 'created';
  if (JOINED_SCENE_ID_SET.has(scene.id)) return 'joined';
  return 'created';
}

function getSceneOwnershipTabLabel(tabKey = 'created') {
  return SCENE_HOME_OWNERSHIP_TABS.find((item) => item.key === tabKey)?.label || SCENE_HOME_OWNERSHIP_TABS[0].label;
}

function getSceneTheme(scene) {
  return scene?.templateSnapshot?.theme || {};
}

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

const sceneMenuAccentColorMap = Object.freeze({
  'my-learning-space': '#4f7cff',
  workshop: '#f97316',
  'study-club-channel': '#ef4444',
  'my-classroom': '#0ea5e9',
  'workshop-cloud': '#6366f1',
  'teaching-research': '#eab308',
  'course-creation-center': '#10b981',
  'org-training': '#14b8a6',
});

const iconBarAccentColorMap = Object.freeze({
  'my-space': '#4f7cff',
  'cloud-disk': '#0ea5e9',
  'resource-lib': '#f59e0b',
  'resource-recommendation': '#0f766e',
  'resource-parse': '#8b5cf6',
  'knowledge-space': '#22c55e',
  'knowledge-graph': '#2563eb',
  'course-studio': '#f97316',
  messages: '#ec4899',
  'org-management': '#06b6d4',
  workflow: '#7c3aed',
  'process-management': '#8b5cf6',
  leave: '#fb7185',
  dept: '#14b8a6',
  user: '#3b82f6',
  role: '#10b981',
  position: '#f59e0b',
  certificate: '#a855f7',
  'certificate-issue': '#ef4444',
  archive: '#f97316',
  'study-club': '#dc2626',
  'points-user': '#0f766e',
  'points-admin': '#7c3aed',
  lucky: '#eab308',
  lab: '#8b5cf6',
  tasks: '#2563eb',
  'lucky-backend': '#64748b',
  'learning-analytics': '#0f766e',
  'agent-quota': '#2563eb',
  'online-dev': '#0f766e',
  'quick-build': '#f97316',
  'page-designer': '#8b5cf6',
  'tag-management': '#06b6d4',
  'app-center': '#4f46e5',
  'scene-template': '#22c55e',
  'my-profile': '#ec4899',
  'teacher-portrait': '#3b82f6',
  'teacher-development': '#14b8a6',
  'teacher-evaluation-schemes': '#8b5cf6',
  'teacher-evaluation': '#ef4444',
  'capability-model': '#0f766e',
  'industry-roles': '#0891b2',
  'solution-management': '#4f46e5',
  'package-management': '#7c3aed',
  'tenant-management': '#0f766e',
  dms: '#0891b2',
  integration: '#f97316',
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

function getSceneMenuAccentColor(menuKey) {
  return sceneMenuAccentColorMap[menuKey] || '#4f7cff';
}

function getIconBarAccentColor(iconKey) {
  if (iconKey.startsWith(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX)) {
    return getSceneMenuAccentColor(iconKey.slice(SCENE_SYSTEM_MENU_SHORTCUT_KEY_PREFIX.length));
  }
  return iconBarAccentColorMap[iconKey] || '#4f7cff';
}

// Left icon bar items
const baseIconBarItems = [
  { key: 'my-space', icon: <AppstoreOutlined />, label: '空间', active: true },
  { key: 'resource-lib', icon: <BookOutlined />, label: '资料库' },
  { key: 'resource-recommendation', icon: <ReadOutlined />, label: '推荐' },
  { key: 'knowledge-space', icon: <ClusterOutlined />, label: '知识空间' },
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
  { key: 'points-admin', icon: <GiftOutlined />, label: '积分管理' },
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
  { key: 'industry-roles', icon: <BranchesOutlined />, label: '行业岗位' },
  { key: 'solution-management', icon: <AppstoreOutlined />, label: '解决方案' },
  { key: 'package-management', icon: <TagsOutlined />, label: '套餐管理' },
  { key: 'tenant-management', icon: <BankOutlined />, label: '租户管理' },
  { key: 'dms', icon: <FileTextOutlined />, label: '文档管理' },
  { key: 'integration', icon: <PartitionOutlined />, label: '三方对接' }
];

const currentAccountProfile = {
  name: '张洪磊',
  company: '北京国人通教育科技有限公司',
  phone: '+8615313950356',
  verified: true,
};

const accountSwitchItems = [
  { key: 'xbb', title: 'xbb', subtitle: 'benbenxb', avatar: 'X', tone: 'blue' },
  { key: 'personal', title: '飞书个人用户', subtitle: '张洪磊', tone: 'feishu' },
  { key: 'test', title: 'test', subtitle: '张洪磊', avatar: 'T', tone: 'blue' },
  { key: 'guoren', title: '国人通教育科技有限公司', subtitle: '张洪磊', avatar: '国', tone: 'blue' },
  { key: 'meituan', title: '美团外卖', subtitle: 'xbb', avatar: '美', tone: 'blue', status: '未认证' },
  { key: 'developer', title: '飞书开发者体验企业', subtitle: '张洪磊', tone: 'feishu-wave', verified: true },
];

function renderAccountSwitchAvatar(account) {
  const tone = account.tone || 'blue';
  if (tone.startsWith('feishu')) {
    return (
      <span className={`account-switch-avatar account-switch-avatar-${tone}`}>
        <span className="account-feishu-mark" />
      </span>
    );
  }

  return (
    <span className={`account-switch-avatar account-switch-avatar-${tone}`}>
      {account.avatar || account.title?.slice(0, 1)}
    </span>
  );
}

function App({ onLogout }) {
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [activeIconKey, setActiveIconKey] = useState(() => getInitialActiveIconKey());
  const [currentPage, setCurrentPage] = useState(() => getInitialHashRoute().page || 'home'); // 'home', 'detail', or 'workflow'
  const [agentQuotaEntryTab, setAgentQuotaEntryTab] = useState('plans');
  const [teacherEvaluationEntryContext, setTeacherEvaluationEntryContext] = useState(null);
  const [resourceLibraryEntry, setResourceLibraryEntry] = useState(null);
  const resourceLibraryEntryRef = useRef(null);
  const [messageEntryConversationId, setMessageEntryConversationId] = useState(null);
  const [messageUnreadCount, setMessageUnreadCount] = useState(() => getInitialMessagesUnreadCount());
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountSwitchModalOpen, setAccountSwitchModalOpen] = useState(false);
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
  const [sceneMenuGroups, setSceneMenuGroups] = useState([]);
  const [sceneKeyword, setSceneKeyword] = useState('');
  const [sceneDataLoading, setSceneDataLoading] = useState(true);
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [sceneEditing, setSceneEditing] = useState(null);
  const [sceneModalMode, setSceneModalMode] = useState('scene');
  const [sceneModalDefaultMenuKey, setSceneModalDefaultMenuKey] = useState(null);
  const [sceneCategoryModalOpen, setSceneCategoryModalOpen] = useState(false);
  const [sceneCategoryEditing, setSceneCategoryEditing] = useState(null);
  const [sceneOwnershipTab, setSceneOwnershipTab] = useState('created');
  const [sceneSystemMenuShortcutKeys, setSceneSystemMenuShortcutKeys] = useState([]);
  const [sceneCategoryForm] = Form.useForm();
  const [iconBarWidth, setIconBarWidth] = useState(() => loadIconBarWidth());
  const [sceneSiderWidth, setSceneSiderWidth] = useState(() => loadSceneSiderWidth());
  const [iconBarIndicatorStyle, setIconBarIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const [siderMenuIndicatorStyle, setSiderMenuIndicatorStyle] = useState(EMPTY_MENU_INDICATOR);
  const iconBarListRef = useRef(null);
  const iconBarItemRefs = useRef(new Map());
  const siderMenuShellRef = useRef(null);
  const iconBarWidthRef = useRef(iconBarWidth);
  const sceneSiderWidthRef = useRef(sceneSiderWidth);
  const luckyUnreadCountRef = useRef(Number(readLuckyConversation()?.unread) || 0);
  const handleToggleSceneSystemMenuShortcut = useCallback(async (menuKey, enabled) => {
    try {
      const nextKeys = await sceneApi.toggleSceneSystemMenuShortcut(menuKey, enabled);
      setSceneSystemMenuShortcutKeys(nextKeys);
      if (!enabled && activeIconKey === getSceneSystemMenuShortcutKey(menuKey)) {
        setActiveIconKey('my-space');
      }
      message.success(enabled ? '已添加到菜单栏' : '已从菜单栏移除');
    } catch (error) {
      message.error(error?.message || '更新菜单栏失败');
    }
  }, [activeIconKey]);

  const openCreateSceneModal = useCallback(() => {
    setSceneModalMode('scene');
    setSceneEditing(null);
    setSceneModalDefaultMenuKey(null);
    setSceneModalOpen(true);
  }, []);

  const openCreateSpaceModal = useCallback((options = {}) => {
    setSceneModalMode('space');
    setSceneEditing(null);
    setSceneModalDefaultMenuKey(options?.menuKey || null);
    setSceneModalOpen(true);
  }, []);

  const openEditSceneModal = useCallback((scene) => {
    setSceneModalMode('space');
    setSceneEditing(scene);
    setSceneModalDefaultMenuKey(null);
    setSceneModalOpen(true);
  }, []);

  const refreshSceneMenuData = useCallback(async () => {
    const [nextMenuGroups, nextSystemMenuShortcutKeys] = await Promise.all([
      sceneApi.listSceneMenuGroups(),
      sceneApi.listSceneSystemMenuShortcuts(),
    ]);
    setSceneMenuGroups(nextMenuGroups);
    setSceneSystemMenuShortcutKeys(nextSystemMenuShortcutKeys);
  }, []);

  const openCreateSceneCategoryModal = useCallback(() => {
    setSceneCategoryEditing(null);
    sceneCategoryForm.resetFields();
    sceneCategoryForm.setFieldsValue({ label: '' });
    setSceneCategoryModalOpen(true);
  }, [sceneCategoryForm]);

  const openEditSceneCategoryModal = useCallback((category) => {
    setSceneCategoryEditing(category);
    sceneCategoryForm.resetFields();
    sceneCategoryForm.setFieldsValue({ label: category?.label || '' });
    setSceneCategoryModalOpen(true);
  }, [sceneCategoryForm]);

  const closeSceneCategoryModal = useCallback(() => {
    setSceneCategoryModalOpen(false);
    setSceneCategoryEditing(null);
    sceneCategoryForm.resetFields();
  }, [sceneCategoryForm]);

  const handleSaveSceneCategory = useCallback(async () => {
    try {
      const values = await sceneCategoryForm.validateFields();
      await sceneApi.saveSceneMenuCategory({
        key: sceneCategoryEditing?.key,
        label: values.label,
      });
      closeSceneCategoryModal();
      await refreshSceneMenuData();
      message.success(sceneCategoryEditing ? '场景分类已更新' : '场景分类已创建');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || '保存场景分类失败');
    }
  }, [closeSceneCategoryModal, refreshSceneMenuData, sceneCategoryEditing, sceneCategoryForm]);

  const handleDeleteSceneCategory = useCallback((category) => {
    const menuKey = category?.key || category?.value;
    if (!menuKey) return;
    const sceneCount = scenes.filter((scene) => scene.menuKey === menuKey).length;
    if (sceneCount > 0) {
      message.warning(`该分类下还有 ${sceneCount} 个空间，不能删除`);
      return;
    }

    Modal.confirm({
      title: '删除场景分类',
      content: `确定删除“${category.label}”吗？删除后该分类不会再显示在侧边栏。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await sceneApi.removeSceneMenuCategory(menuKey);
          if (selectedKeys[0] === menuKey) {
            setSelectedKeys(['home']);
            setSelectedScene(null);
            setCurrentPage('home');
          }
          if (activeIconKey === getSceneSystemMenuShortcutKey(menuKey)) {
            setActiveIconKey('my-space');
          }
          await refreshSceneMenuData();
          message.success('场景分类已删除');
        } catch (error) {
          message.error(error?.message || '删除场景分类失败');
        }
      },
    });
  }, [activeIconKey, refreshSceneMenuData, scenes, selectedKeys]);

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
  const sceneMenuLabelMap = useMemo(() => {
    const entries = sceneMenuGroups.flatMap((group) => (
      (group.children || []).map((item) => [item.key, item.label])
    ));
    return new Map(entries);
  }, [sceneMenuGroups]);
  const getSceneMenuDisplayLabel = useCallback((menuKey) => (
    sceneMenuLabelMap.get(menuKey) || sceneApi.getSceneMenuLabel(menuKey)
  ), [sceneMenuLabelMap]);
  const iconBarItems = useMemo(() => {
    const decoratedBaseItems = baseIconBarItems.map((item) => (
      item.key === 'messages'
        ? { ...item, badgeCount: messageUnreadCount }
        : item
    ));
    const sceneCategoryItems = sceneSystemMenuShortcutKeys.map((menuKey) => ({
      key: getSceneSystemMenuShortcutKey(menuKey),
      icon: getSceneMenuIcon(menuKey),
      label: getSceneMenuDisplayLabel(menuKey),
    }));
    return [
      ...decoratedBaseItems.slice(0, 1),
      ...sceneCategoryItems,
      ...decoratedBaseItems.slice(1),
    ];
  }, [getSceneMenuDisplayLabel, messageUnreadCount, sceneSystemMenuShortcutKeys]);
  const menuItems = useMemo(() => {
    const baseItems = [
      {
        key: 'new-scene',
        icon: <PlusOutlined />,
        label: '新建场景',
        className: 'new-scene-item',
      },
      {
        key: 'home',
        icon: <HomeOutlined />,
        label: '首页',
        className: 'scene-home-item',
      },
      ...sceneMenuGroups.map((group) => ({
        key: group.key,
        type: 'group',
        label: group.label,
        children: group.children.map((item) => {
          const pinned = systemMenuShortcutSet.has(item.key);
          const sceneCategoryMoreMenu = {
            items: [
              { key: 'create-category', icon: <PlusOutlined />, label: '创建场景分类' },
              { key: 'edit-category', icon: <EditOutlined />, label: '修改场景分类' },
              { key: 'delete-category', icon: <DeleteOutlined />, label: '删除场景分类', danger: true },
              { type: 'divider' },
              {
                key: 'toggle-system-menu-shortcut',
                icon: pinned ? <PushpinFilled /> : <PushpinOutlined />,
                label: pinned ? '从菜单栏移除' : '添加到菜单栏',
              },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent?.preventDefault();
              domEvent?.stopPropagation();
              if (key === 'create-category') {
                openCreateSceneCategoryModal();
                return;
              }
              if (key === 'edit-category') {
                openEditSceneCategoryModal(item);
                return;
              }
              if (key === 'delete-category') {
                handleDeleteSceneCategory(item);
                return;
              }
              if (key === 'toggle-system-menu-shortcut') {
                handleToggleSceneSystemMenuShortcut(item.key, !pinned);
              }
            },
          };

          return {
            key: item.key,
            icon: getSceneMenuIcon(item.key),
            label: (
              <span className="scene-menu-item-label">
                <span className="scene-menu-item-text" title={item.label}>{item.label}</span>
                <Dropdown menu={sceneCategoryMoreMenu} placement="bottomRight" trigger={['click']}>
                  <button
                    type="button"
                    className={`scene-menu-more-btn ${pinned ? 'is-active' : ''}`}
                    aria-label={`${item.label}更多操作`}
                    title="更多操作"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <EllipsisOutlined />
                  </button>
                </Dropdown>
              </span>
            ),
          };
        }),
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
  }, [
    handleDeleteSceneCategory,
    handleToggleSceneSystemMenuShortcut,
    openCreateSceneCategoryModal,
    openEditSceneCategoryModal,
    sceneMenuGroups,
    shortcutScenes,
    systemMenuShortcutSet,
  ]);

  const menuFilteredScenes = useMemo(() => {
    return scenes.filter((scene) => (
      activeSceneKey === 'home' || scene.menuKey === activeSceneKey
    ));
  }, [activeSceneKey, scenes]);

  const sceneOwnershipCounts = useMemo(() => {
    return menuFilteredScenes.reduce((acc, scene) => {
      const key = resolveSceneOwnershipTab(scene);
      acc[key] += 1;
      return acc;
    }, { created: 0, joined: 0 });
  }, [menuFilteredScenes]);

  const ownershipFilteredScenes = useMemo(() => {
    return menuFilteredScenes.filter((scene) => resolveSceneOwnershipTab(scene) === sceneOwnershipTab);
  }, [menuFilteredScenes, sceneOwnershipTab]);

  const visibleScenes = useMemo(() => {
    const normalizedKeyword = sceneKeyword.trim().toLowerCase();
    return ownershipFilteredScenes.filter((scene) => {
      if (!normalizedKeyword) return true;
      const haystack = `${scene.name} ${scene.sceneGroupName || ''} ${scene.templateName} ${scene.description || ''}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [ownershipFilteredScenes, sceneKeyword]);

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

  const sceneHomeDisplayName = useMemo(() => {
    if (selectedSceneMenuKey === 'home') {
      return '首页';
    }
    if (selectedSceneMenuKey.startsWith(SCENE_SHORTCUT_KEY_PREFIX)) {
      const shortcutSceneId = selectedSceneMenuKey.slice(SCENE_SHORTCUT_KEY_PREFIX.length);
      return scenes.find((item) => item.id === shortcutSceneId)?.name || '快捷空间';
    }
    if (activeSceneKey !== 'home') {
      return getSceneMenuDisplayLabel(activeSceneKey);
    }
    if (currentSceneGroups.length === 1) {
      return currentSceneGroups[0].name;
    }
    return '全部空间';
  }, [activeSceneKey, currentSceneGroups, getSceneMenuDisplayLabel, scenes, selectedSceneMenuKey]);

  const sceneOwnershipSegmentOptions = useMemo(() => {
    return SCENE_HOME_OWNERSHIP_TABS.map((item) => ({
      value: item.key,
      label: (
        <span className="scene-home-segment-label">
          <span>{item.label}</span>
          <span className="scene-home-segment-count">{sceneOwnershipCounts[item.key]}</span>
        </span>
      ),
    }));
  }, [sceneOwnershipCounts]);

  const sceneOwnershipSummary = useMemo(() => {
    const activeCount = sceneOwnershipCounts[sceneOwnershipTab] || 0;
    if (menuFilteredScenes.length === 0) {
      return `${sceneHomeDisplayName}当前分类下还没有空间`;
    }
    return `${sceneHomeDisplayName} · ${getSceneOwnershipTabLabel(sceneOwnershipTab)} ${activeCount} 个，当前分类共 ${menuFilteredScenes.length} 个空间`;
  }, [menuFilteredScenes.length, sceneHomeDisplayName, sceneOwnershipCounts, sceneOwnershipTab]);

  const sceneEmptyDescription = useMemo(() => {
    const normalizedKeyword = sceneKeyword.trim();
    if (normalizedKeyword) {
      return `没有找到符合条件的${getSceneOwnershipTabLabel(sceneOwnershipTab)}空间`;
    }
    if (menuFilteredScenes.length === 0) {
      return activeSceneKey === 'home' ? '暂无空间，先创建一个模板化空间。' : '当前栏目暂无空间，先新建一个。';
    }
    if ((sceneOwnershipCounts[sceneOwnershipTab] || 0) === 0) {
      return `${getSceneOwnershipTabLabel(sceneOwnershipTab)}暂无空间`;
    }
    return '当前筛选下暂无空间';
  }, [activeSceneKey, menuFilteredScenes.length, sceneKeyword, sceneOwnershipCounts, sceneOwnershipTab]);

  const sceneGroupOptions = useMemo(() => {
    return currentSceneGroups.map((group) => ({
      label: group.name,
      value: group.name,
    }));
  }, [currentSceneGroups]);

  const homeHeaderTitle = useMemo(() => {
    if (isSystemMenuSceneCategoryEntry && activeSceneKey !== 'home') {
      return getSceneMenuDisplayLabel(activeSceneKey);
    }
    return sceneHomeDisplayName;
  }, [activeSceneKey, getSceneMenuDisplayLabel, isSystemMenuSceneCategoryEntry, sceneHomeDisplayName]);

  useEffect(() => {
    if (menuFilteredScenes.length === 0) return;
    setSceneOwnershipTab((prev) => {
      if ((sceneOwnershipCounts[prev] || 0) > 0) return prev;
      const fallbackTab = prev === 'created' ? 'joined' : 'created';
      return (sceneOwnershipCounts[fallbackTab] || 0) > 0 ? fallbackTab : prev;
    });
  }, [activeSceneKey, menuFilteredScenes.length, sceneOwnershipCounts.created, sceneOwnershipCounts.joined]);

  const loadSceneHomeData = useCallback(async (withLoading = true) => {
    if (withLoading) {
      setSceneDataLoading(true);
    }
    try {
      await sceneApi.seed();
      const [nextTemplates, nextScenes, nextMenuGroups, nextSystemMenuShortcutKeys] = await Promise.all([
        sceneApi.listTemplates(),
        sceneApi.listScenes(),
        sceneApi.listSceneMenuGroups(),
        sceneApi.listSceneSystemMenuShortcuts(),
      ]);
      setSceneTemplates(nextTemplates);
      setScenes(nextScenes);
      setSceneMenuGroups(nextMenuGroups);
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
    const target = container?.querySelector('.ant-menu-item-selected:not(.new-scene-item):not(.scene-home-item)') || null;
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
    if (typeof window === 'undefined') return undefined;

    const handleLuckyUnreadChange = () => {
      const nextLuckyUnreadCount = Number(readLuckyConversation()?.unread) || 0;
      setMessageUnreadCount((prev) => (
        Math.max(0, prev - luckyUnreadCountRef.current + nextLuckyUnreadCount)
      ));
      luckyUnreadCountRef.current = nextLuckyUnreadCount;
    };

    const eventName = getLuckyPushStoreEventName();
    window.addEventListener(eventName, handleLuckyUnreadChange);
    return () => {
      window.removeEventListener(eventName, handleLuckyUnreadChange);
    };
  }, []);

  const handleMessageUnreadCountChange = useCallback((nextUnreadCount) => {
    luckyUnreadCountRef.current = Number(readLuckyConversation()?.unread) || 0;
    setMessageUnreadCount(Math.max(0, Number(nextUnreadCount) || 0));
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
    if (typeof window === 'undefined') return;

    const nextHash = buildPersistentHashRoute(currentPage, knowledgeGraphEntry, capabilityModelEntry);
    if (nextHash) {
      replaceAppHash(nextHash);
      return;
    }

    const route = parseHashRoute(window.location.hash);
    if (APP_HASH_ROUTE_PAGES.has(route.page)) {
      replaceAppHash('');
    }
  }, [capabilityModelEntry, currentPage, knowledgeGraphEntry]);

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

  const handleOpenAccountSwitchModal = useCallback(() => {
    setAccountMenuOpen(false);
    setAccountSwitchModalOpen(true);
  }, []);

  const handleAccountMenuPlaceholder = useCallback((label) => {
    message.info(`${label}暂未接入`);
  }, []);

  const handleLogout = useCallback(() => {
    setAccountMenuOpen(false);
    setAccountSwitchModalOpen(false);
    onLogout?.();
  }, [onLogout]);

  const openMyPointsPage = useCallback(() => {
    setAccountMenuOpen(false);
    setActiveIconKey('account-points');
    setCurrentPage('points-user');
  }, []);

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

  const openResourceLibraryPage = useCallback((entry = null) => {
    const nextEntry = entry ? {
      ...entry,
      requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    } : null;
    resourceLibraryEntryRef.current = nextEntry;
    setPendingResourceLibraryEntry(nextEntry);
    if (typeof window !== 'undefined') {
      if (nextEntry) {
        const serializedEntry = JSON.stringify(nextEntry);
        if (window.sessionStorage) {
          window.sessionStorage.setItem(RESOURCE_LIBRARY_ENTRY_STORAGE_KEY, serializedEntry);
        }
        window.localStorage.setItem(RESOURCE_LIBRARY_ENTRY_STORAGE_KEY, serializedEntry);
      } else {
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(RESOURCE_LIBRARY_ENTRY_STORAGE_KEY);
        }
        window.localStorage.removeItem(RESOURCE_LIBRARY_ENTRY_STORAGE_KEY);
      }
    }
    setActiveIconKey('resource-lib');
    setResourceLibraryEntry(nextEntry);
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
      setSceneModalDefaultMenuKey(null);
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
    } else if (key === 'resource-recommendation') {
      setCurrentPage('resource-recommendation');
    } else if (key === 'resource-parse') {
      setCurrentPage('resource-parse');
    } else if (key === 'knowledge-space') {
      setCurrentPage('knowledge-space');
    } else if (key === 'knowledge-graph') {
      openKnowledgeGraphPage();
    } else if (key === 'course-studio') {
      setCurrentPage('course-studio');
    } else if (key === 'archive') {
      setCurrentPage('archive');
    } else if (key === 'study-club') {
      setCurrentPage('study-club');
    } else if (key === 'points-user') {
      setCurrentPage('points-user');
    } else if (key === 'points-admin') {
      setCurrentPage('points-admin');
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
    } else if (key === 'industry-roles') {
      setCurrentPage('industry-roles');
    } else if (key === 'solution-management') {
      setCurrentPage('solution-management');
    } else if (key === 'package-management') {
      setCurrentPage('package-management');
    } else if (key === 'tenant-management') {
      setCurrentPage('tenant-management');
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
      currentPage === 'resource-recommendation' ||
      currentPage === 'resource-parse' ||
      currentPage === 'knowledge-space' ||
      currentPage === 'knowledge-graph' ||
      currentPage === 'course-studio' ||
      currentPage === 'archive' ||
      currentPage === 'study-club' ||
      currentPage === 'points-user' ||
      currentPage === 'points-admin' ||
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
      currentPage === 'industry-roles' ||
      currentPage === 'solution-management' ||
      currentPage === 'package-management' ||
      currentPage === 'tenant-management' ||
      currentPage === 'dms' ||
      currentPage === 'integration'
    ) {
      setCurrentPage('home');
    }
  };

  const accountProfileMenu = (
    <div className="account-profile-menu" onClick={(event) => event.stopPropagation()}>
      <div className="account-profile-head">
        <div className="account-profile-avatar">
          <UserOutlined />
        </div>
        <div className="account-profile-copy">
          <div className="account-profile-name-row">
            <span className="account-profile-name">{currentAccountProfile.name}</span>
            <EditOutlined className="account-profile-edit" />
          </div>
          <div className="account-profile-company-row">
            <span className="account-profile-company">{currentAccountProfile.company}</span>
            {currentAccountProfile.verified ? (
              <span className="account-profile-verified">
                <CheckCircleFilled />
                已认证
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="account-status-btn"
            onClick={() => handleAccountMenuPlaceholder('状态')}
          >
            + 状态
          </button>
        </div>
      </div>

      <button
        type="button"
        className="account-signature-input"
        onClick={() => handleAccountMenuPlaceholder('个性签名')}
      >
        输入你的个性签名...
      </button>

      <div
        className="account-points-card"
        role="button"
        tabIndex={0}
        onClick={openMyPointsPage}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMyPointsPage();
          }
        }}
      >
        <div className="account-points-top">
          <span className="account-points-badge">
            <TrophyOutlined />
            L3 共创者
          </span>
          <span className="account-points-note">果仁积分</span>
        </div>
        <div className="account-points-main">
          <div>
            <div className="account-points-value">245</div>
            <div className="account-points-caption">可用积分</div>
          </div>
          <div className="account-points-mini-stats">
            <span>待审核 2</span>
            <span>可兑换 4</span>
          </div>
        </div>
        <div className="account-points-progress">
          <span style={{ width: '61%' }} />
        </div>
        <div className="account-points-meta">距 L4 布道者还差 155 分</div>
        <div className="account-points-actions">
          <button
            type="button"
            className="account-points-primary"
            onClick={(event) => {
              event.stopPropagation();
              openMyPointsPage();
            }}
          >
            查看我的积分
          </button>
          <button
            type="button"
            className="account-points-secondary"
            onClick={(event) => {
              event.stopPropagation();
              openMyPointsPage();
            }}
          >
            去兑换
            <RightOutlined />
          </button>
        </div>
      </div>

      <div className="account-menu-section">
        <button type="button" className="account-menu-row" onClick={() => handleAccountMenuPlaceholder('我的个人名片')}>
          <span>我的个人名片</span>
        </button>
        <button type="button" className="account-menu-row" onClick={() => handleAccountMenuPlaceholder('我的二维码与链接')}>
          <span>我的二维码与链接</span>
          <QrcodeOutlined />
        </button>
        <button type="button" className="account-menu-row" onClick={handleOpenAccountSwitchModal}>
          <span>切换其他组织</span>
        </button>
      </div>

      <div className="account-menu-divider" />

      <div className="account-menu-section">
        <button type="button" className="account-menu-row" onClick={() => handleAccountMenuPlaceholder('帮助与客服')}>
          <span>帮助与客服</span>
          <CustomerServiceOutlined />
        </button>
        <button type="button" className="account-menu-row" onClick={() => handleAccountMenuPlaceholder('设置')}>
          <span>设置</span>
          <SettingOutlined />
        </button>
        <button type="button" className="account-menu-row" onClick={handleLogout}>
          <span>退出登录</span>
          <LogoutOutlined />
        </button>
      </div>

      <div className="account-menu-divider" />

      <button type="button" className="account-menu-row" onClick={() => handleAccountMenuPlaceholder('管理后台')}>
        <span>管理后台</span>
        <RightOutlined />
      </button>
    </div>
  );

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
          <Dropdown
            trigger={['click']}
            open={accountMenuOpen}
            onOpenChange={(open) => setAccountMenuOpen(open)}
            placement="bottomLeft"
            popupRender={() => accountProfileMenu}
            classNames={{ root: 'account-profile-dropdown' }}
            destroyOnHidden
          >
            <button type="button" className="avatar-circle" aria-label="打开账号菜单">
              <UserOutlined />
            </button>
          </Dropdown>
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
              style={{ '--icon-bar-accent': getIconBarAccentColor(item.key) }}
              onClick={() => handleIconBarClick(item.key)}
            >
              <span className="icon-bar-icon">{item.icon}</span>
              {item.badgeCount > 0 ? (
                <span className="icon-bar-unread-badge" aria-label={`${item.badgeCount} 条未读`}>
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </span>
              ) : null}
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
          onUnreadCountChange={handleMessageUnreadCountChange}
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
        <ResourceLibrary onOpenKnowledgeGraph={openKnowledgeGraphPage} entryRequest={resourceLibraryEntry || resourceLibraryEntryRef.current} />
      ) : currentPage === 'resource-recommendation' ? (
        <ResourceRecommendationModule onNavigateToResource={openResourceLibraryPage} />
      ) : currentPage === 'resource-parse' ? (
        <ResourceParseStatus />
      ) : currentPage === 'knowledge-space' ? (
        <KnowledgeSpaceModule />
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
      ) : currentPage === 'points-user' ? (
        <PointsUserModule />
      ) : currentPage === 'points-admin' ? (
        <PointsAdminModule />
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
        <CapabilityModelModule key="capability-model-module" />
      ) : currentPage === 'industry-roles' ? (
        <CapabilityModelModule key="industry-roles-module" mode="industryRoles" />
      ) : currentPage === 'solution-management' ? (
        <SolutionPrototypeModule />
      ) : currentPage === 'package-management' ? (
        <PackagePrototypeModule />
      ) : currentPage === 'tenant-management' ? (
        <TenantPrototypeModule />
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
              {!sceneDataLoading ? (
                <div className="scene-home-toolbar">
                  <Segmented
                    value={sceneOwnershipTab}
                    onChange={setSceneOwnershipTab}
                    options={sceneOwnershipSegmentOptions}
                    className="scene-home-segmented"
                  />
                  <div className="scene-home-toolbar-meta">{sceneOwnershipSummary}</div>
                </div>
              ) : null}
              {sceneDataLoading ? (
                <div className="scene-empty-state">空间加载中...</div>
              ) : visibleScenes.length === 0 ? (
                <div className="scene-empty-state">
                  <Empty
                    description={sceneEmptyDescription}
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
                          const topicCardConfig = normalizeTopicCardConfig(scene.templateSnapshot?.topicCard);
                          const roleList = (scene.templateSnapshot?.roles || []).slice(0, 3);
                          const memberCount = Number.isFinite(Number(scene.memberCount)) && Number(scene.memberCount) > 0
                            ? Number(scene.memberCount)
                            : ((scene.templateSnapshot?.roles || []).length || 0);
                          const sceneCardClassName = [
                            'scene-card',
                            `scene-card-size-${String(topicCardConfig.size || 'MEDIUM').toLowerCase()}`,
                            topicCardConfig.showCover ? '' : 'scene-card-no-cover',
                          ].filter(Boolean).join(' ');
                          const cardMenu = {
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
                          };
                          return (
                            <Card
                              key={scene.id}
                              className={sceneCardClassName}
                              hoverable
                              variant="borderless"
                              styles={{ body: { padding: 0 } }}
                              onClick={() => handleCardClick(scene)}
                            >
                              {topicCardConfig.showCover ? (
                                <div className="card-cover">
                                  <div
                                    className="wave-bg"
                                    style={getSceneThemeCoverStyle(theme, {
                                      overlayStart: 'rgba(15, 23, 42, 0.18)',
                                      overlayEnd: 'rgba(15, 23, 42, 0.04)',
                                    })}
                                  >
                                    {topicCardConfig.showTitle ? (
                                      <div className="card-cover-copy">
                                        <div className="card-cover-title">{theme.heroTitle || scene.templateName}</div>
                                        <div className="card-cover-hint">{theme.surfaceHint || scene.templateName}</div>
                                      </div>
                                    ) : null}
                                    <svg className="wave-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                                      <path d="M0,60 C100,20 150,100 250,50 C300,30 350,80 400,40 L400,120 L0,120 Z" fill="rgba(255,255,255,0.18)" />
                                      <path d="M0,80 C80,50 160,100 240,70 C320,40 360,90 400,60 L400,120 L0,120 Z" fill="rgba(255,255,255,0.12)" />
                                      <path d="M0,95 C60,75 120,110 200,88 C280,66 340,98 400,82 L400,120 L0,120 Z" fill="rgba(255,255,255,0.08)" />
                                    </svg>
                                  </div>
                                  <Dropdown menu={cardMenu} placement="bottomRight">
                                    <Button
                                      type="text"
                                      className="card-more-btn"
                                      icon={<EllipsisOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </Dropdown>
                                </div>
                              ) : (
                                <div className="scene-card-inline-actions">
                                  <Dropdown menu={cardMenu} placement="bottomRight">
                                    <Button
                                      type="text"
                                      className="card-more-btn"
                                      icon={<EllipsisOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </Dropdown>
                                </div>
                              )}
                              <div className="card-body">
                                {topicCardConfig.showTitle ? (
                                  <div className="card-title" title={scene.name}>{scene.name}</div>
                                ) : null}
                                <div className="card-subtitle">{scene.description || theme.heroSubtitle || '未填写空间描述'}</div>
                                <div className="scene-card-meta-line">
                                  <span>{scene.templateName}</span>
                                  {topicCardConfig.showSceneType ? (
                                    <span>{getSceneTypeLabel(scene.sceneType)}</span>
                                  ) : null}
                                  {topicCardConfig.showMemberCount ? (
                                    <span>{`${memberCount} 名成员`}</span>
                                  ) : null}
                                </div>
                                {roleList.length > 0 ? (
                                  <div className="scene-role-list">
                                    {roleList.map((role) => (
                                      <span key={role.id} className="scene-role-pill">{role.name}</span>
                                    ))}
                                  </div>
                                ) : null}
                                <div className="card-footer">
                                  {topicCardConfig.showTags && theme.badgeText ? (
                                    <Tag className="scene-theme-tag">{theme.badgeText}</Tag>
                                  ) : null}
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

      <Modal
        open={accountSwitchModalOpen}
        footer={null}
        closable={false}
        centered
        width={392}
        onCancel={() => setAccountSwitchModalOpen(false)}
        className="account-switch-modal"
        destroyOnHidden
      >
        <div className="account-switch-panel">
          <div className="account-switch-head">
            <h2>登录更多账号</h2>
            <button
              type="button"
              className="account-switch-close"
              aria-label="关闭"
              onClick={() => setAccountSwitchModalOpen(false)}
            >
              <CloseOutlined />
            </button>
          </div>
          <div className="account-switch-phone">{currentAccountProfile.phone} 已在以下企业或组织绑定了账号</div>

          <div className="account-switch-list">
            {accountSwitchItems.map((account) => (
              <button
                key={account.key}
                type="button"
                className="account-switch-row"
                onClick={() => handleAccountMenuPlaceholder(account.title)}
              >
                {renderAccountSwitchAvatar(account)}
                <span className="account-switch-copy">
                  <span className="account-switch-title">{account.title}</span>
                  <span className="account-switch-subtitle">
                    <span>{account.subtitle}</span>
                    {account.status ? <span className="account-switch-status">{account.status}</span> : null}
                    {account.verified ? (
                      <span className="account-switch-verified">
                        <CheckCircleFilled />
                        已认证
                      </span>
                    ) : null}
                  </span>
                </span>
                <RightOutlined className="account-switch-arrow" />
              </button>
            ))}
          </div>

        </div>
      </Modal>

      <Modal
        title={sceneCategoryEditing ? '修改场景分类' : '创建场景分类'}
        open={sceneCategoryModalOpen}
        okText="保存"
        cancelText="取消"
        onOk={handleSaveSceneCategory}
        onCancel={closeSceneCategoryModal}
        destroyOnHidden
      >
        <Form form={sceneCategoryForm} layout="vertical">
          <Form.Item
            name="label"
            label="分类名称"
            rules={[{ required: true, whitespace: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入场景分类名称" maxLength={24} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <SceneCreateModal
        open={sceneModalOpen}
        templates={sceneTemplates}
        sceneGroupOptions={sceneGroupOptions}
        initialValues={sceneEditing}
        defaultMenuKey={sceneModalDefaultMenuKey || (activeSceneKey !== 'home' ? activeSceneKey : undefined)}
        defaultSceneGroupName={currentSceneGroups.length === 1 ? currentSceneGroups[0].name : undefined}
        mode={sceneModalMode}
        onCancel={() => {
          setSceneModalOpen(false);
          setSceneEditing(null);
          setSceneModalDefaultMenuKey(null);
        }}
        onSubmit={handleSceneSave}
      />
    </Layout>
  );
}

export default App;
