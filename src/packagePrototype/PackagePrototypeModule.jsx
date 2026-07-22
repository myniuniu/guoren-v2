import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
} from '@ant-design/icons';
import './PackagePrototypeModule.css';

const { TextArea } = Input;

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '上架' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'DISABLED', label: '下架' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: 'DAY', label: '日' },
  { value: 'WEEK', label: '周' },
  { value: 'MONTH', label: '月' },
  { value: 'YEAR', label: '年' },
];

const ENTITLEMENT_CYCLE_OPTIONS = ['日', '周', '月', '年'];
const OFFICE_DOCUMENT_PERMISSION_OPTIONS = ['只读', '可编辑'];
const OFFICE_DOCUMENT_PERMISSION_LEVEL = {
  只读: 0,
  可编辑: 1,
};

const SOLUTION_OPTIONS = [
  {
    id: 'sol-training-camp',
    name: '教师数字素养提升培训方案',
    code: 'SOL-TRAINING-AI',
    scenario: '组织培训',
    modules: ['SPACE', 'RESOURCE_LIBRARY', 'OFFICE_DOCUMENT', 'VIDEO_PLAYBACK', 'LUCKY', 'MESSAGE', 'SEMINAR', 'SURVEY', 'CERTIFICATE'],
    requiredModules: ['SPACE', 'RESOURCE_LIBRARY'],
    officeDocumentPermission: '可编辑',
  },
  {
    id: 'sol-research-hub',
    name: '区域教研共创解决方案',
    code: 'SOL-RESEARCH-HUB',
    scenario: '教研共创',
    modules: ['SPACE', 'RESOURCE_LIBRARY', 'OFFICE_DOCUMENT', 'VIDEO_PLAYBACK', 'KNOWLEDGE_SPACE', 'MESSAGE'],
    requiredModules: ['SPACE', 'RESOURCE_LIBRARY'],
    officeDocumentPermission: '可编辑',
  },
  {
    id: 'sol-course-studio',
    name: 'AI 课程创作中心方案',
    code: 'SOL-COURSE-STUDIO',
    scenario: '课程创作',
    modules: ['SPACE', 'RESOURCE_LIBRARY', 'OFFICE_DOCUMENT', 'VIDEO_PLAYBACK', 'LUCKY', 'KNOWLEDGE_SPACE', 'MESSAGE'],
    requiredModules: ['SPACE', 'RESOURCE_LIBRARY', 'LUCKY'],
    officeDocumentPermission: '可编辑',
  },
];

const MODULES = [
  { key: 'SPACE', name: '空间模块', category: '基础承载' },
  { key: 'RESOURCE_LIBRARY', name: '资料库模块', category: '内容资产' },
  { key: 'OFFICE_DOCUMENT', name: 'Office 文档模块', category: '文档协作' },
  { key: 'VIDEO_PLAYBACK', name: '视频播放模块', category: '媒体服务' },
  { key: 'LUCKY', name: 'Lucky 模块', category: 'AI 能力' },
  { key: 'KNOWLEDGE_SPACE', name: '知识空间模块', category: '知识组织' },
  { key: 'MESSAGE', name: '消息模块', category: '运营触达' },
  { key: 'SEMINAR', name: '研讨会模块', category: '活动协作' },
  { key: 'SURVEY', name: '问卷模块', category: '反馈采集' },
  { key: 'CERTIFICATE', name: '证书模块', category: '成果认证' },
];

const MODULE_RESOURCE_LIMIT_DEFS = {
  SPACE: [
    { key: 'maxSpaces', label: '最大空间数', type: 'NUMBER', required: true },
    { key: 'membersPerSpace', label: '单空间成员上限', type: 'NUMBER', required: true },
    { key: 'templateCount', label: '支持空间模板数', type: 'NUMBER', required: true },
    { key: 'allowCustomSceneCreation', label: '支持自定义创建场景', type: 'BOOLEAN' },
  ],
  LUCKY: [
    { key: 'skillLimit', label: '技能数量上限', type: 'NUMBER', required: true },
    { key: 'agentLimit', label: '智能体数量上限', type: 'NUMBER', required: true },
    { key: 'monthlyCalls', label: '月调用次数', type: 'NUMBER', required: true },
    {
      key: 'resourceAccessScope',
      label: '资料检索范围',
      type: 'MULTI_SELECT',
      options: ['组织资料库', '空间资料', '知识空间', '公开资源'],
    },
  ],
  RESOURCE_LIBRARY: [
    { key: 'capacityGb', label: '资料库容量(GB)', type: 'NUMBER', required: true },
    { key: 'singleFileMb', label: '单文件上传上限(MB)', type: 'NUMBER', required: true },
    { key: 'monthlyAiParse', label: 'AI 解析次数/月', type: 'NUMBER', required: true },
    {
      key: 'resourceTypes',
      label: '可用资源类型',
      type: 'MULTI_SELECT',
      options: ['文档', '图片', '视频', '音频', '链接', '压缩包'],
    },
  ],
  OFFICE_DOCUMENT: [
    {
      key: 'documentPermission',
      label: '文档权限',
      type: 'SELECT',
      options: OFFICE_DOCUMENT_PERMISSION_OPTIONS,
      required: true,
    },
  ],
  VIDEO_PLAYBACK: [
    {
      key: 'maxResolution',
      label: '最高播放分辨率',
      type: 'SELECT',
      options: ['480P', '720P', '1080P', '2K', '4K'],
      required: true,
    },
    {
      key: 'playbackHoursQuota',
      label: '播放时长(小时)',
      type: 'CYCLE_NUMBER',
      valueKey: 'playbackHours',
      cycleKey: 'playbackHoursCycle',
      options: ENTITLEMENT_CYCLE_OPTIONS,
      required: true,
    },
    { key: 'concurrentViewers', label: '并发播放人数', type: 'NUMBER', required: true },
    { key: 'singleStreamBandwidthMbps', label: '单路带宽(Mbps)', type: 'NUMBER', required: true },
    {
      key: 'supportedFormats',
      label: '支持视频格式',
      type: 'MULTI_SELECT',
      options: ['MP4', 'HLS', 'MOV', 'WebM', 'AVI'],
    },
    { key: 'allowTranscoding', label: '支持转码', type: 'BOOLEAN' },
    { key: 'enablePlaybackWatermark', label: '播放水印', type: 'BOOLEAN' },
  ],
  KNOWLEDGE_SPACE: [
    { key: 'spaceCount', label: '知识空间数量', type: 'NUMBER', required: true },
    { key: 'graphBindingCount', label: '知识图谱绑定数量', type: 'NUMBER', required: true },
    { key: 'roleCount', label: '成员角色数量', type: 'NUMBER', required: true },
  ],
  MESSAGE: [
    { key: 'monthlyMessages', label: '月消息发送量', type: 'NUMBER', required: true },
    { key: 'retentionDays', label: '消息保留天数', type: 'NUMBER', required: true },
    {
      key: 'channels',
      label: '可用消息通道',
      type: 'MULTI_SELECT',
      options: ['站内信', '系统通知', '短信', '邮件', 'Lucky 推送'],
    },
  ],
  SEMINAR: [
    {
      key: 'sessionsQuota',
      label: '研讨会场次',
      type: 'CYCLE_NUMBER',
      valueKey: 'monthlySessions',
      cycleKey: 'sessionCycle',
      options: ENTITLEMENT_CYCLE_OPTIONS,
      required: true,
    },
    {
      key: 'usageHoursQuota',
      label: '使用时长(小时)',
      type: 'CYCLE_NUMBER',
      valueKey: 'monthlyUsageHours',
      cycleKey: 'usageHoursCycle',
      options: ENTITLEMENT_CYCLE_OPTIONS,
      required: true,
    },
    {
      key: 'returnVisitRecordingQuota',
      label: '回访录制上限(小时)',
      type: 'CYCLE_NUMBER',
      valueKey: 'returnVisitRecordingHours',
      cycleKey: 'returnVisitRecordingCycle',
      options: ENTITLEMENT_CYCLE_OPTIONS,
      required: true,
    },
    { key: 'participantLimit', label: '单场人数上限', type: 'NUMBER', required: true },
    { key: 'registrationLimit', label: '报名人数上限', type: 'NUMBER', required: true },
  ],
  SURVEY: [
    { key: 'monthlySurveys', label: '月问卷数量', type: 'NUMBER', required: true },
    { key: 'monthlyResponses', label: '月答卷数量', type: 'NUMBER', required: true },
    {
      key: 'questionTypes',
      label: '可用题型',
      type: 'MULTI_SELECT',
      options: ['单选', '多选', '填空', '评分', '矩阵', '文件上传'],
    },
  ],
  CERTIFICATE: [
    { key: 'templateCount', label: '证书模板数量', type: 'NUMBER', required: true },
    { key: 'monthlyIssues', label: '月发放数量', type: 'NUMBER', required: true },
    {
      key: 'exportFormats',
      label: '可导出格式',
      type: 'MULTI_SELECT',
      options: ['PDF', 'PNG', 'Excel 名单', 'ZIP 批量包'],
    },
  ],
};

const MODULE_RESOURCE_LIMIT_PRESETS = {
  standard: {
    SPACE: { maxSpaces: 30, membersPerSpace: 80, templateCount: 3, allowCustomSceneCreation: false },
    LUCKY: { skillLimit: 8, agentLimit: 3, monthlyCalls: 10000, resourceAccessScope: ['组织资料库', '空间资料'] },
    RESOURCE_LIBRARY: { capacityGb: 200, singleFileMb: 500, monthlyAiParse: 1000, resourceTypes: ['文档', '图片', '视频', '链接'] },
    OFFICE_DOCUMENT: { documentPermission: '只读' },
    VIDEO_PLAYBACK: { maxResolution: '720P', playbackHoursCycle: '月', playbackHours: 500, concurrentViewers: 200, singleStreamBandwidthMbps: 4, supportedFormats: ['MP4', 'HLS'], allowTranscoding: false, enablePlaybackWatermark: true },
    KNOWLEDGE_SPACE: { spaceCount: 5, graphBindingCount: 2, roleCount: 4 },
    MESSAGE: { monthlyMessages: 20000, retentionDays: 180, channels: ['站内信', '系统通知', '邮件'] },
    SEMINAR: { sessionCycle: '月', monthlySessions: 12, usageHoursCycle: '月', monthlyUsageHours: 24, returnVisitRecordingCycle: '月', returnVisitRecordingHours: 12, participantLimit: 200, registrationLimit: 300 },
    SURVEY: { monthlySurveys: 20, monthlyResponses: 5000, questionTypes: ['单选', '多选', '填空', '评分'] },
    CERTIFICATE: { templateCount: 5, monthlyIssues: 3000, exportFormats: ['PDF', 'PNG'] },
  },
  professional: {
    SPACE: { maxSpaces: 120, membersPerSpace: 300, templateCount: 8, allowCustomSceneCreation: true },
    LUCKY: { skillLimit: 30, agentLimit: 12, monthlyCalls: 80000, resourceAccessScope: ['组织资料库', '空间资料', '知识空间'] },
    RESOURCE_LIBRARY: { capacityGb: 1000, singleFileMb: 1024, monthlyAiParse: 8000, resourceTypes: ['文档', '图片', '视频', '音频', '链接'] },
    OFFICE_DOCUMENT: { documentPermission: '可编辑' },
    VIDEO_PLAYBACK: { maxResolution: '1080P', playbackHoursCycle: '月', playbackHours: 5000, concurrentViewers: 1000, singleStreamBandwidthMbps: 8, supportedFormats: ['MP4', 'HLS', 'MOV', 'WebM'], allowTranscoding: true, enablePlaybackWatermark: true },
    KNOWLEDGE_SPACE: { spaceCount: 30, graphBindingCount: 12, roleCount: 8 },
    MESSAGE: { monthlyMessages: 120000, retentionDays: 365, channels: ['站内信', '系统通知', '短信', '邮件', 'Lucky 推送'] },
    SEMINAR: { sessionCycle: '月', monthlySessions: 60, usageHoursCycle: '月', monthlyUsageHours: 120, returnVisitRecordingCycle: '月', returnVisitRecordingHours: 60, participantLimit: 800, registrationLimit: 1200 },
    SURVEY: { monthlySurveys: 120, monthlyResponses: 50000, questionTypes: ['单选', '多选', '填空', '评分', '矩阵'] },
    CERTIFICATE: { templateCount: 20, monthlyIssues: 20000, exportFormats: ['PDF', 'PNG', 'Excel 名单'] },
  },
  ultimate: {
    SPACE: { maxSpaces: 500, membersPerSpace: 1000, templateCount: 20, allowCustomSceneCreation: true },
    LUCKY: { skillLimit: 120, agentLimit: 50, monthlyCalls: 500000, resourceAccessScope: ['组织资料库', '空间资料', '知识空间', '公开资源'] },
    RESOURCE_LIBRARY: { capacityGb: 5000, singleFileMb: 2048, monthlyAiParse: 50000, resourceTypes: ['文档', '图片', '视频', '音频', '链接', '压缩包'] },
    OFFICE_DOCUMENT: { documentPermission: '可编辑' },
    VIDEO_PLAYBACK: { maxResolution: '4K', playbackHoursCycle: '月', playbackHours: 30000, concurrentViewers: 5000, singleStreamBandwidthMbps: 25, supportedFormats: ['MP4', 'HLS', 'MOV', 'WebM', 'AVI'], allowTranscoding: true, enablePlaybackWatermark: true },
    KNOWLEDGE_SPACE: { spaceCount: 120, graphBindingCount: 60, roleCount: 16 },
    MESSAGE: { monthlyMessages: 800000, retentionDays: 1095, channels: ['站内信', '系统通知', '短信', '邮件', 'Lucky 推送'] },
    SEMINAR: { sessionCycle: '月', monthlySessions: 240, usageHoursCycle: '月', monthlyUsageHours: 480, returnVisitRecordingCycle: '月', returnVisitRecordingHours: 240, participantLimit: 3000, registrationLimit: 5000 },
    SURVEY: { monthlySurveys: 500, monthlyResponses: 300000, questionTypes: ['单选', '多选', '填空', '评分', '矩阵', '文件上传'] },
    CERTIFICATE: { templateCount: 80, monthlyIssues: 200000, exportFormats: ['PDF', 'PNG', 'Excel 名单', 'ZIP 批量包'] },
  },
};

const PACKAGE_TEMPLATES = {
  standard: {
    templateName: '标准版',
    name: '标准版套餐',
    code: 'PKG-STANDARD',
    status: 'ACTIVE',
    version: 'v1.0',
    price: 19800,
    billingCycle: 'MONTH',
    solutionIds: ['sol-training-camp'],
    userLimit: 200,
    adminLimit: 5,
    departmentLimit: 12,
    spaceLimit: 30,
    storageLimitGb: 200,
    allowCustomTheme: false,
    allowAdvancedAnalytics: false,
    targetAudience: '中小规模培训项目、单校教研团队',
    recommendedScenario: '快速开通标准培训或教研能力。',
    sellingPoints: '开箱即用，覆盖空间、资料、研讨、问卷和证书基础流程。',
    limitationNote: '不包含高级统计和深度品牌定制。',
  },
  professional: {
    templateName: '专业版',
    name: '专业版套餐',
    code: 'PKG-PRO',
    status: 'ACTIVE',
    version: 'v1.0',
    price: 49800,
    billingCycle: 'YEAR',
    solutionIds: ['sol-training-camp', 'sol-research-hub'],
    userLimit: 800,
    adminLimit: 20,
    departmentLimit: 50,
    spaceLimit: 120,
    storageLimitGb: 1000,
    allowCustomTheme: true,
    allowAdvancedAnalytics: true,
    targetAudience: '区域培训、教研共同体、集团校',
    recommendedScenario: '需要多方案组合、AI 辅助和过程数据分析的组织。',
    sellingPoints: '覆盖培训、教研和知识沉淀，支持主题定制和高级统计。',
    limitationNote: '不包含专属私有化部署。',
  },
  ultimate: {
    templateName: '旗舰版',
    name: '旗舰版套餐',
    code: 'PKG-ULTIMATE',
    status: 'DRAFT',
    version: 'v1.0',
    price: 128000,
    billingCycle: 'YEAR',
    solutionIds: ['sol-training-camp', 'sol-research-hub', 'sol-course-studio'],
    userLimit: 3000,
    adminLimit: 80,
    departmentLimit: 200,
    spaceLimit: 500,
    storageLimitGb: 5000,
    allowCustomTheme: true,
    allowAdvancedAnalytics: true,
    targetAudience: '大型区域项目、综合数字化建设项目',
    recommendedScenario: '多业务场景统一交付，覆盖培训、教研和课程创作。',
    sellingPoints: '多解决方案组合，完整开放 AI、知识空间和成果认证能力。',
    limitationNote: '具体交付范围按项目合同确认。',
  },
};

function nowText() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getSolutionModuleUnion(solutionIds) {
  const moduleSet = new Set();
  SOLUTION_OPTIONS
    .filter((item) => solutionIds.includes(item.id))
    .forEach((solution) => solution.modules.forEach((moduleKey) => moduleSet.add(moduleKey)));
  return [...moduleSet];
}

function getRequiredModuleUnion(solutionIds) {
  const moduleSet = new Set();
  SOLUTION_OPTIONS
    .filter((item) => solutionIds.includes(item.id))
    .forEach((solution) => solution.requiredModules.forEach((moduleKey) => moduleSet.add(moduleKey)));
  return [...moduleSet];
}

function getOfficeDocumentPermissionLimit(solutionIds) {
  const selectedPermissions = SOLUTION_OPTIONS
    .filter((item) => solutionIds.includes(item.id) && item.modules.includes('OFFICE_DOCUMENT'))
    .map((item) => item.officeDocumentPermission || '只读');
  if (!selectedPermissions.length) return null;
  return selectedPermissions.reduce((limit, permission) => (
    OFFICE_DOCUMENT_PERMISSION_LEVEL[permission] < OFFICE_DOCUMENT_PERMISSION_LEVEL[limit] ? permission : limit
  ), '可编辑');
}

function getOfficeDocumentPermissionOptions(solutionIds) {
  const limit = getOfficeDocumentPermissionLimit(solutionIds);
  if (!limit) return OFFICE_DOCUMENT_PERMISSION_OPTIONS;
  return OFFICE_DOCUMENT_PERMISSION_OPTIONS.filter(
    (permission) => OFFICE_DOCUMENT_PERMISSION_LEVEL[permission] <= OFFICE_DOCUMENT_PERMISSION_LEVEL[limit],
  );
}

function clampOfficeDocumentPermission(permission, solutionIds) {
  const limit = getOfficeDocumentPermissionLimit(solutionIds);
  if (!limit) return permission || '只读';
  const target = permission || limit;
  return OFFICE_DOCUMENT_PERMISSION_LEVEL[target] <= OFFICE_DOCUMENT_PERMISSION_LEVEL[limit] ? target : limit;
}

function applyModuleResourceLimitCaps(moduleResourceLimits, solutionIds) {
  if (!moduleResourceLimits?.OFFICE_DOCUMENT) return moduleResourceLimits;
  const nextPermission = clampOfficeDocumentPermission(
    moduleResourceLimits.OFFICE_DOCUMENT.documentPermission,
    solutionIds,
  );
  if (nextPermission === moduleResourceLimits.OFFICE_DOCUMENT.documentPermission) return moduleResourceLimits;
  return {
    ...moduleResourceLimits,
    OFFICE_DOCUMENT: {
      ...moduleResourceLimits.OFFICE_DOCUMENT,
      documentPermission: nextPermission,
    },
  };
}

function getModuleName(moduleKey) {
  return MODULES.find((item) => item.key === moduleKey)?.name || moduleKey;
}

function getModuleListDisplayName(moduleKey) {
  return getModuleName(moduleKey).replace(/\s*模块$/, '');
}

function getDefaultModuleResourceLimits(templateKey, moduleKey) {
  const preset = MODULE_RESOURCE_LIMIT_PRESETS[templateKey] || MODULE_RESOURCE_LIMIT_PRESETS.professional;
  return { ...(preset[moduleKey] || {}) };
}

function normalizeModuleResourceLimits(templateKey, moduleKeys, existingLimits = {}) {
  return moduleKeys.reduce((limits, moduleKey) => {
    limits[moduleKey] = {
      ...getDefaultModuleResourceLimits(templateKey, moduleKey),
      ...(existingLimits[moduleKey] || {}),
    };
    return limits;
  }, {});
}

function cloneModuleResourceLimits(limits = {}) {
  return Object.fromEntries(
    Object.entries(limits).map(([moduleKey, value]) => [
      moduleKey,
      Object.fromEntries(
        Object.entries(value).map(([fieldKey, fieldValue]) => [
          fieldKey,
          Array.isArray(fieldValue) ? [...fieldValue] : fieldValue,
        ]),
      ),
    ]),
  );
}

function buildPackage(templateKey, override = {}) {
  const template = PACKAGE_TEMPLATES[templateKey];
  const solutionIds = override.solutionIds || template.solutionIds;
  const moduleKeys = getSolutionModuleUnion(solutionIds);
  const moduleResourceLimits = applyModuleResourceLimitCaps(
    normalizeModuleResourceLimits(templateKey, moduleKeys, override.moduleResourceLimits),
    solutionIds,
  );
  return {
    id: override.id || `pkg-${templateKey}`,
    ...template,
    ...override,
    templateKey,
    solutionIds,
    enabledModuleKeys: override.enabledModuleKeys || moduleKeys,
    moduleResourceLimits,
    updatedAt: override.updatedAt || nowText(),
  };
}

function statusTag(status) {
  const map = {
    ACTIVE: { label: '上架', color: 'success' },
    DRAFT: { label: '草稿', color: 'default' },
    DISABLED: { label: '下架', color: 'warning' },
  };
  const target = map[status] || map.DRAFT;
  return <Tag color={target.color}>{target.label}</Tag>;
}

function cycleLabel(value) {
  return BILLING_CYCLE_OPTIONS.find((item) => item.value === value)?.label || value;
}

function formatPrice(value) {
  const numeric = Number(value) || 0;
  return `¥${numeric.toLocaleString('zh-CN')}`;
}

function getRequiredResourceWarnings(packageItem, requiredModuleKeys) {
  return requiredModuleKeys.flatMap((moduleKey) => {
    if (!packageItem.enabledModuleKeys.includes(moduleKey)) return [];
    const limits = packageItem.moduleResourceLimits?.[moduleKey] || {};
    return (MODULE_RESOURCE_LIMIT_DEFS[moduleKey] || [])
      .filter((field) => {
        const valueKey = field.type === 'CYCLE_NUMBER' ? field.valueKey : field.key;
        return ['NUMBER', 'CYCLE_NUMBER'].includes(field.type) && field.required && Number(limits[valueKey] || 0) <= 0;
      })
      .map((field) => `${getModuleName(moduleKey)}-${field.label}`);
  });
}

function PackagePrototypeModule() {
  const [packages, setPackages] = useState(() => [
    buildPackage('standard', { id: 'pkg-standard', updatedAt: '2026-07-11 10:20' }),
    buildPackage('professional', { id: 'pkg-pro', updatedAt: '2026-07-10 15:48' }),
    buildPackage('ultimate', { id: 'pkg-ultimate', updatedAt: '2026-07-09 11:16' }),
  ]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePackageId, setActivePackageId] = useState(null);
  const [activeEntitlementModuleKey, setActiveEntitlementModuleKey] = useState('SPACE');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTemplateKey, setCreateTemplateKey] = useState('professional');
  const [createForm] = Form.useForm();

  const activePackage = useMemo(
    () => packages.find((item) => item.id === activePackageId) || null,
    [packages, activePackageId],
  );

  const filteredPackages = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return packages.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!normalized) return true;
      const solutionNames = item.solutionIds
        .map((id) => SOLUTION_OPTIONS.find((solution) => solution.id === id)?.name || '')
        .join(' ');
      const text = `${item.name} ${item.code} ${item.targetAudience} ${solutionNames}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, packages, statusFilter]);

  const summary = useMemo(() => {
    const activeCount = packages.filter((item) => item.status === 'ACTIVE').length;
    const solutionCount = new Set(packages.flatMap((item) => item.solutionIds)).size;
    const avgPrice = packages.length
      ? Math.round(packages.reduce((sum, item) => sum + Number(item.price || 0), 0) / packages.length)
      : 0;
    return { activeCount, solutionCount, avgPrice };
  }, [packages]);

  const updatePackage = (id, patchOrUpdater) => {
    setPackages((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(item) : patchOrUpdater;
      return { ...item, ...patch, updatedAt: nowText() };
    }));
  };

  const openPackage = (record) => {
    setActivePackageId(record.id);
    setDrawerOpen(true);
  };

  const handleTemplateChange = (templateKey) => {
    setCreateTemplateKey(templateKey);
    const template = PACKAGE_TEMPLATES[templateKey];
    createForm.setFieldsValue({
      ...template,
      code: `${template.code}-${packages.length + 1}`,
    });
  };

  const openCreateModal = () => {
    const template = PACKAGE_TEMPLATES[createTemplateKey];
    createForm.setFieldsValue({
      ...template,
      code: `${template.code}-${packages.length + 1}`,
    });
    setCreateModalOpen(true);
  };

  const handleCreatePackage = async () => {
    const values = await createForm.validateFields();
    const solutionIds = values.solutionIds || [];
    const moduleKeys = getSolutionModuleUnion(solutionIds);
    const nextPackage = buildPackage(createTemplateKey, {
      id: `pkg-${packages.length + 1}`,
      ...values,
      solutionIds,
      enabledModuleKeys: moduleKeys,
      moduleResourceLimits: normalizeModuleResourceLimits(createTemplateKey, moduleKeys),
      updatedAt: nowText(),
    });
    setPackages((prev) => [nextPackage, ...prev]);
    setCreateModalOpen(false);
    setActivePackageId(nextPackage.id);
    setDrawerOpen(true);
    message.success('套餐已创建');
  };

  const handleDeletePackage = (id) => {
    setPackages((prev) => prev.filter((item) => item.id !== id));
    if (activePackageId === id) {
      setDrawerOpen(false);
      setActivePackageId(null);
    }
    message.success('套餐已删除');
  };

  const handleCopyPackage = (record) => {
    const copyIndex = packages.filter((item) => item.id.startsWith(`${record.id}-copy`)).length + 1;
    const copied = {
      ...record,
      id: `${record.id}-copy-${copyIndex}`,
      name: `${record.name} 副本`,
      code: `${record.code}-COPY-${copyIndex}`,
      status: 'DRAFT',
      moduleResourceLimits: cloneModuleResourceLimits(record.moduleResourceLimits),
      updatedAt: nowText(),
    };
    setPackages((prev) => [copied, ...prev]);
    message.success('已复制为新套餐');
  };

  const handleSolutionChange = (solutionIds) => {
    if (!activePackage) return;
    const moduleKeys = getSolutionModuleUnion(solutionIds);
    if (moduleKeys.length && !moduleKeys.includes(activeEntitlementModuleKey)) {
      setActiveEntitlementModuleKey(moduleKeys[0]);
    }
    updatePackage(activePackage.id, {
      solutionIds,
      enabledModuleKeys: moduleKeys,
      moduleResourceLimits: applyModuleResourceLimitCaps(
        normalizeModuleResourceLimits(
          activePackage.templateKey,
          moduleKeys,
          activePackage.moduleResourceLimits,
        ),
        solutionIds,
      ),
    });
  };

  const updateModuleResourceLimit = (moduleKey, fieldKey, value) => {
    if (!activePackage) return;
    updatePackage(activePackage.id, (item) => ({
      moduleResourceLimits: {
        ...item.moduleResourceLimits,
        [moduleKey]: {
          ...(item.moduleResourceLimits?.[moduleKey] || {}),
          [fieldKey]: moduleKey === 'OFFICE_DOCUMENT' && fieldKey === 'documentPermission'
            ? clampOfficeDocumentPermission(value, item.solutionIds)
            : value,
        },
      },
    }));
  };

  const togglePackageModule = (moduleKey, checked) => {
    if (!activePackage) return;
    const nextModuleKeys = checked
      ? [...new Set([...activePackage.enabledModuleKeys, moduleKey])]
      : activePackage.enabledModuleKeys.filter((item) => item !== moduleKey);
    updatePackage(activePackage.id, { enabledModuleKeys: nextModuleKeys });
  };

  const packageColumns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (value, record) => (
        <Button type="link" className="pkg-name-button" onClick={() => openPackage(record)}>
          {value}
        </Button>
      ),
    },
    { title: '套餐编码', dataIndex: 'code', key: 'code', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: statusTag,
    },
    {
      title: '适用方案',
      key: 'solutions',
      width: 110,
      render: (_, record) => `${record.solutionIds.length} 个`,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: formatPrice,
    },
    {
      title: '周期',
      dataIndex: 'billingCycle',
      key: 'billingCycle',
      width: 90,
      render: cycleLabel,
    },
    { title: '成员上限', dataIndex: 'userLimit', key: 'userLimit', width: 100 },
    { title: '管理员上限', dataIndex: 'adminLimit', key: 'adminLimit', width: 110 },
    { title: '部门上限', dataIndex: 'departmentLimit', key: 'departmentLimit', width: 100 },
    { title: '空间上限', dataIndex: 'spaceLimit', key: 'spaceLimit', width: 100 },
    {
      title: '存储上限',
      dataIndex: 'storageLimitGb',
      key: 'storageLimitGb',
      width: 110,
      render: (value) => `${value} GB`,
    },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openPackage(record)}>
            编辑
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyPackage(record)} />
          <Popconfirm title="确定删除该套餐吗？" onConfirm={() => handleDeletePackage(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderPackageDrawer = () => {
    if (!activePackage) return null;
    const solutionModuleKeys = getSolutionModuleUnion(activePackage.solutionIds);
    const requiredModuleKeys = getRequiredModuleUnion(activePackage.solutionIds);
    const disabledRequiredModules = requiredModuleKeys.filter((moduleKey) => !activePackage.enabledModuleKeys.includes(moduleKey));
    const requiredResourceWarnings = getRequiredResourceWarnings(activePackage, requiredModuleKeys);
    const selectedSolutions = SOLUTION_OPTIONS.filter((item) => activePackage.solutionIds.includes(item.id));
    const currentModuleKey = solutionModuleKeys.includes(activeEntitlementModuleKey)
      ? activeEntitlementModuleKey
      : solutionModuleKeys[0];
    const currentModuleDef = MODULES.find((item) => item.key === currentModuleKey);
    const isCurrentRequiredModule = requiredModuleKeys.includes(currentModuleKey);
    const isCurrentEnabledModule = activePackage.enabledModuleKeys.includes(currentModuleKey);
    const currentModuleLimits = {
      ...getDefaultModuleResourceLimits(activePackage.templateKey, currentModuleKey),
      ...(activePackage.moduleResourceLimits?.[currentModuleKey] || {}),
    };
    const officeDocumentPermissionLimit = getOfficeDocumentPermissionLimit(activePackage.solutionIds);
    const getSelectOptions = (field) => {
      if (currentModuleKey === 'OFFICE_DOCUMENT' && field.key === 'documentPermission') {
        return getOfficeDocumentPermissionOptions(activePackage.solutionIds).map((option) => ({ value: option, label: option }));
      }
      return (field.options || []).map((option) => ({ value: option, label: option }));
    };

    return (
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="min(1120px, 96vw)"
        title={null}
        destroyOnClose={false}
      >
        <div className="pkg-drawer-head">
          <div className="pkg-drawer-title-wrap">
            <Avatar className="pkg-avatar" icon={<GiftOutlined />} />
            <div>
              <div className="pkg-drawer-title">{activePackage.name}</div>
              <div className="pkg-drawer-subtitle">
                {activePackage.code} · {activePackage.version} · {cycleLabel(activePackage.billingCycle)}
              </div>
              <Space wrap className="pkg-tag-row">
                {statusTag(activePackage.status)}
                <Tag color="blue">{formatPrice(activePackage.price)}</Tag>
                <Tag>{activePackage.solutionIds.length} 个解决方案</Tag>
              </Space>
            </div>
          </div>
          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={() => handleCopyPackage(activePackage)}>
              复制套餐
            </Button>
            <Popconfirm title="确定删除该套餐吗？" onConfirm={() => handleDeletePackage(activePackage.id)}>
              <Button danger icon={<DeleteOutlined />}>
                删除套餐
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Tabs
          items={[
            {
              key: 'base',
              label: '基础信息',
              children: (
                <div className="pkg-section">
                  <div className="pkg-form-grid">
                    <label>
                      <span>套餐名称</span>
                      <Input value={activePackage.name} onChange={(event) => updatePackage(activePackage.id, { name: event.target.value })} />
                    </label>
                    <label>
                      <span>套餐编码</span>
                      <Input value={activePackage.code} onChange={(event) => updatePackage(activePackage.id, { code: event.target.value })} />
                    </label>
                    <label>
                      <span>状态</span>
                      <Select value={activePackage.status} options={STATUS_OPTIONS} onChange={(value) => updatePackage(activePackage.id, { status: value })} />
                    </label>
                    <label>
                      <span>版本</span>
                      <Input value={activePackage.version} onChange={(event) => updatePackage(activePackage.id, { version: event.target.value })} />
                    </label>
                    <label>
                      <span>价格</span>
                      <InputNumber min={0} value={activePackage.price} onChange={(value) => updatePackage(activePackage.id, { price: value || 0 })} />
                    </label>
                    <label>
                      <span>周期</span>
                      <Select value={activePackage.billingCycle} options={BILLING_CYCLE_OPTIONS} onChange={(value) => updatePackage(activePackage.id, { billingCycle: value })} />
                    </label>
                    <label className="pkg-form-span">
                      <span>套餐说明</span>
                      <TextArea rows={4} value={activePackage.sellingPoints} onChange={(event) => updatePackage(activePackage.id, { sellingPoints: event.target.value })} />
                    </label>
                  </div>
                </div>
              ),
            },
            {
              key: 'solutions',
              label: '适用解决方案',
              children: (
                <div className="pkg-section">
                  <div className="pkg-section-head">
                    <div>
                      <div className="pkg-section-title">选择适用解决方案</div>
                      <div className="pkg-section-desc">套餐只选择可开通的方案，不修改方案内部模块配置。</div>
                    </div>
                    <Select
                      mode="multiple"
                      value={activePackage.solutionIds}
                      options={SOLUTION_OPTIONS.map((item) => ({ value: item.id, label: item.name }))}
                      onChange={handleSolutionChange}
                      style={{ minWidth: 360 }}
                    />
                  </div>
                  <div className="pkg-solution-grid">
                    {selectedSolutions.map((solution) => (
                      <div key={solution.id} className="pkg-solution-card">
                        <div className="pkg-solution-title">{solution.name}</div>
                        <div className="pkg-solution-code">{solution.code} · {solution.scenario}</div>
                        <div className="pkg-module-tags">
                          {solution.modules.map((moduleKey) => (
                            <Tag key={moduleKey} color={solution.requiredModules.includes(moduleKey) ? 'blue' : 'default'}>
                              {getModuleName(moduleKey)}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'entitlements',
              label: '权益配置',
              children: (
                <div className="pkg-section">
                  {disabledRequiredModules.length || requiredResourceWarnings.length ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="存在权益风险"
                      description={(
                        <div className="pkg-risk-list">
                          {disabledRequiredModules.length ? (
                            <div>关闭必选模块：{disabledRequiredModules.map(getModuleName).join('、')}。</div>
                          ) : null}
                          {requiredResourceWarnings.length ? (
                            <div>必选资源额度为 0：{requiredResourceWarnings.join('、')}。</div>
                          ) : null}
                        </div>
                      )}
                      style={{ marginBottom: 16 }}
                    />
                  ) : null}
                  <div className="pkg-entitlement-block">
                    <div className="pkg-section-title">全局额度</div>
                    <div className="pkg-limit-grid">
                      <label>
                        <span>成员上限</span>
                        <InputNumber min={0} value={activePackage.userLimit} onChange={(value) => updatePackage(activePackage.id, { userLimit: value || 0 })} />
                      </label>
                      <label>
                        <span>管理员上限</span>
                        <InputNumber min={0} value={activePackage.adminLimit} onChange={(value) => updatePackage(activePackage.id, { adminLimit: value || 0 })} />
                      </label>
                      <label>
                        <span>部门上限</span>
                        <InputNumber min={0} value={activePackage.departmentLimit} onChange={(value) => updatePackage(activePackage.id, { departmentLimit: value || 0 })} />
                      </label>
                      <label>
                        <span>空间上限</span>
                        <InputNumber min={0} value={activePackage.spaceLimit} onChange={(value) => updatePackage(activePackage.id, { spaceLimit: value || 0 })} />
                      </label>
                      <label>
                        <span>存储上限(GB)</span>
                        <InputNumber min={0} value={activePackage.storageLimitGb} onChange={(value) => updatePackage(activePackage.id, { storageLimitGb: value || 0 })} />
                      </label>
                      <label className="pkg-switch-line">
                        <span>自定义主题</span>
                        <Switch checked={activePackage.allowCustomTheme} onChange={(checked) => updatePackage(activePackage.id, { allowCustomTheme: checked })} />
                      </label>
                      <label className="pkg-switch-line">
                        <span>高级统计</span>
                        <Switch checked={activePackage.allowAdvancedAnalytics} onChange={(checked) => updatePackage(activePackage.id, { allowAdvancedAnalytics: checked })} />
                      </label>
                    </div>
                  </div>
                  <div className="pkg-entitlement-block">
                    <div className="pkg-section-head pkg-resource-head">
                      <div>
                        <div className="pkg-section-title">模块权益配置</div>
                        <div className="pkg-section-desc">左侧控制套餐开放模块，右侧配置当前模块的资源额度、次数和范围。</div>
                      </div>
                    </div>
                    <div className="pkg-module-entitlement-layout">
                      <div className="pkg-module-pane">
                        <div className="pkg-pane-title">可用模块</div>
                        <div className="pkg-module-list">
                          {solutionModuleKeys.map((moduleKey) => {
                            const moduleDef = MODULES.find((item) => item.key === moduleKey);
                            const isRequiredModule = requiredModuleKeys.includes(moduleKey);
                            const isEnabledModule = activePackage.enabledModuleKeys.includes(moduleKey);
                            const isActiveModule = currentModuleKey === moduleKey;
                            return (
                              <button
                                key={moduleKey}
                                type="button"
                                className={`pkg-module-list-item ${isActiveModule ? 'is-active' : ''} ${isEnabledModule ? '' : 'is-disabled'}`}
                                onClick={() => setActiveEntitlementModuleKey(moduleKey)}
                              >
                                <Checkbox
                                  checked={isEnabledModule}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => togglePackageModule(moduleKey, event.target.checked)}
                                />
                                <div className="pkg-module-list-copy">
                                  <div className="pkg-module-name">{getModuleListDisplayName(moduleKey)}</div>
                                  <div className="pkg-module-category">{moduleDef?.category || '-'}</div>
                                </div>
                                {isRequiredModule ? <Tag color="blue">方案必选</Tag> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="pkg-resource-pane">
                        {currentModuleKey ? (
                          <div className={`pkg-resource-card pkg-resource-card-detail ${isCurrentEnabledModule ? '' : 'is-disabled'}`}>
                            <div className="pkg-resource-card-head">
                              <div>
                                <div className="pkg-resource-name">{currentModuleDef?.name || currentModuleKey}</div>
                                <div className="pkg-resource-category">{currentModuleDef?.category || '-'}</div>
                              </div>
                              <Space size={4} wrap>
                                {isCurrentRequiredModule ? <Tag color="blue">方案必选</Tag> : <Tag>方案可选</Tag>}
                                <Tag color={isCurrentEnabledModule ? 'green' : 'default'}>{isCurrentEnabledModule ? '套餐开放' : '套餐关闭'}</Tag>
                              </Space>
                            </div>
                            <div className="pkg-resource-fields">
                              {(MODULE_RESOURCE_LIMIT_DEFS[currentModuleKey] || []).map((field) => (
                                <label key={field.key} className="pkg-resource-field">
                                  <span>{field.label}</span>
                                  {field.type === 'NUMBER' ? (
                                    <InputNumber
                                      min={0}
                                      disabled={!isCurrentEnabledModule}
                                      value={currentModuleLimits[field.key] ?? 0}
                                      onChange={(value) => updateModuleResourceLimit(currentModuleKey, field.key, value || 0)}
                                    />
                                  ) : null}
                                  {field.type === 'CYCLE_NUMBER' ? (
                                    <div className="pkg-cycle-number-field">
                                      <InputNumber
                                        min={0}
                                        disabled={!isCurrentEnabledModule}
                                        value={currentModuleLimits[field.valueKey] ?? 0}
                                        onChange={(value) => updateModuleResourceLimit(currentModuleKey, field.valueKey, value || 0)}
                                      />
                                      <Select
                                        disabled={!isCurrentEnabledModule}
                                        value={currentModuleLimits[field.cycleKey] || field.options?.[0]}
                                        options={(field.options || []).map((option) => ({ value: option, label: option }))}
                                        onChange={(value) => updateModuleResourceLimit(currentModuleKey, field.cycleKey, value)}
                                      />
                                    </div>
                                  ) : null}
                                  {field.type === 'MULTI_SELECT' ? (
                                    <Select
                                      mode="multiple"
                                      disabled={!isCurrentEnabledModule}
                                      value={currentModuleLimits[field.key] || []}
                                      options={(field.options || []).map((option) => ({ value: option, label: option }))}
                                      onChange={(value) => updateModuleResourceLimit(currentModuleKey, field.key, value)}
                                    />
                                  ) : null}
                                  {field.type === 'SELECT' ? (
                                    <>
                                      <Select
                                        disabled={!isCurrentEnabledModule}
                                        value={
                                          currentModuleKey === 'OFFICE_DOCUMENT' && field.key === 'documentPermission'
                                            ? clampOfficeDocumentPermission(currentModuleLimits[field.key], activePackage.solutionIds)
                                            : currentModuleLimits[field.key]
                                        }
                                        options={getSelectOptions(field)}
                                        onChange={(value) => updateModuleResourceLimit(currentModuleKey, field.key, value)}
                                      />
                                      {currentModuleKey === 'OFFICE_DOCUMENT' && field.key === 'documentPermission' && officeDocumentPermissionLimit ? (
                                        <small className="pkg-field-tip">方案上限：{officeDocumentPermissionLimit}，套餐只可降级。</small>
                                      ) : null}
                                    </>
                                  ) : null}
                                  {field.type === 'BOOLEAN' ? (
                                    <Switch
                                      disabled={!isCurrentEnabledModule}
                                      checked={Boolean(currentModuleLimits[field.key])}
                                      onChange={(checked) => updateModuleResourceLimit(currentModuleKey, field.key, checked)}
                                    />
                                  ) : null}
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pkg-empty-pane">请选择适用解决方案后配置模块权益。</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'sales',
              label: '开通说明',
              children: (
                <div className="pkg-section">
                  <div className="pkg-form-grid">
                    <label>
                      <span>适用对象</span>
                      <TextArea rows={4} value={activePackage.targetAudience} onChange={(event) => updatePackage(activePackage.id, { targetAudience: event.target.value })} />
                    </label>
                    <label>
                      <span>推荐场景</span>
                      <TextArea rows={4} value={activePackage.recommendedScenario} onChange={(event) => updatePackage(activePackage.id, { recommendedScenario: event.target.value })} />
                    </label>
                    <label>
                      <span>售卖亮点</span>
                      <TextArea rows={4} value={activePackage.sellingPoints} onChange={(event) => updatePackage(activePackage.id, { sellingPoints: event.target.value })} />
                    </label>
                    <label>
                      <span>限制说明</span>
                      <TextArea rows={4} value={activePackage.limitationNote} onChange={(event) => updatePackage(activePackage.id, { limitationNote: event.target.value })} />
                    </label>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    );
  };

  return (
    <div className="package-prototype-module">
      <div className="pkg-page-header">
        <div>
          <div className="pkg-eyebrow">前端原型</div>
          <h1>套餐管理</h1>
          <p>面向解决方案配置可售卖权益边界，不覆盖解决方案内部模块配置。</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          新建套餐
        </Button>
      </div>

      <div className="pkg-summary-grid">
        <div className="pkg-summary-card">
          <span>套餐数量</span>
          <strong>{packages.length}</strong>
          <small>当前原型内套餐</small>
        </div>
        <div className="pkg-summary-card">
          <span>上架套餐</span>
          <strong>{summary.activeCount}</strong>
          <small>可售卖状态</small>
        </div>
        <div className="pkg-summary-card">
          <span>覆盖方案</span>
          <strong>{summary.solutionCount}</strong>
          <small>被套餐引用的方案数</small>
        </div>
        <div className="pkg-summary-card">
          <span>平均价格</span>
          <strong>{formatPrice(summary.avgPrice)}</strong>
          <small>按当前套餐粗略统计</small>
        </div>
      </div>

      <div className="pkg-main-panel">
        <div className="pkg-toolbar">
          <Input
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索套餐、编码、对象或解决方案"
            allowClear
            style={{ maxWidth: 420 }}
          />
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="全部状态"
              allowClear
              options={STATUS_OPTIONS}
              style={{ width: 140 }}
            />
            <Button onClick={() => {
              setKeyword('');
              setStatusFilter(undefined);
            }}>
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建套餐
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={packageColumns}
          dataSource={filteredPackages}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1580 }}
        />
      </div>

      {renderPackageDrawer()}

      <Modal
        title="新建套餐"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreatePackage}
        okText="创建"
        width={860}
        destroyOnClose
      >
        <div className="pkg-template-row">
          {Object.entries(PACKAGE_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              type="button"
              className={`pkg-template-card ${createTemplateKey === key ? 'is-active' : ''}`}
              onClick={() => handleTemplateChange(key)}
            >
              <StarOutlined />
              <strong>{template.templateName}</strong>
              <span>{formatPrice(template.price)} · {cycleLabel(template.billingCycle)}</span>
            </button>
          ))}
        </div>
        <Form form={createForm} layout="vertical" className="pkg-create-form">
          <div className="pkg-form-grid">
            <Form.Item label="套餐名称" name="name" rules={[{ required: true, message: '请输入套餐名称' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="套餐编码" name="code" rules={[{ required: true, message: '请输入套餐编码' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="版本" name="version">
              <Input />
            </Form.Item>
            <Form.Item label="价格" name="price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="周期" name="billingCycle">
              <Select options={BILLING_CYCLE_OPTIONS} />
            </Form.Item>
            <Form.Item className="pkg-form-span" label="适用解决方案" name="solutionIds" rules={[{ required: true, message: '请选择适用解决方案' }]}>
              <Select mode="multiple" options={SOLUTION_OPTIONS.map((item) => ({ value: item.id, label: item.name }))} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default PackagePrototypeModule;
