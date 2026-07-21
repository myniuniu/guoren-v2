import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Drawer,
  Empty,
  Input,
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
  BankOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  LoginOutlined,
  MobileOutlined,
  PlusOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  LOGIN_ACCENT_OPTIONS,
  LOGIN_METHOD_OPTIONS,
  LOGIN_TEMPLATE_OPTIONS,
  createLoginConfig,
  getLoginConfigFromSolutionNames,
} from '../shared/loginPageConfig';
import './TenantPrototypeModule.css';

const { TextArea } = Input;

const TENANT_STATUS_OPTIONS = [
  { value: 'TRIAL', label: '试用中', color: 'processing' },
  { value: 'ACTIVE', label: '启用', color: 'success' },
  { value: 'DISABLED', label: '停用', color: 'default' },
  { value: 'EXPIRED', label: '到期', color: 'warning' },
  { value: 'FROZEN', label: '冻结', color: 'error' },
];

const TENANT_TYPE_OPTIONS = [
  { value: 'SCHOOL', label: '学校' },
  { value: 'REGION', label: '区域' },
  { value: 'GROUP', label: '集团校' },
  { value: 'ENTERPRISE', label: '企业' },
];

const SERVICE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '服务中', color: 'success' },
  { value: 'TRIAL', label: '试用服务', color: 'processing' },
  { value: 'PENDING', label: '待开通', color: 'default' },
  { value: 'EXPIRED', label: '已到期', color: 'warning' },
  { value: 'PAUSED', label: '已暂停', color: 'error' },
];

const DOMAIN_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待验证', color: 'warning' },
  { value: 'VERIFIED', label: '已验证', color: 'success' },
  { value: 'FAILED', label: '验证失败', color: 'error' },
];

const DOMAIN_SSL_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待签发', color: 'warning' },
  { value: 'ISSUED', label: '已签发', color: 'success' },
  { value: 'EXPIRED', label: '已过期', color: 'error' },
];

const DOMAIN_USAGE_OPTIONS = [
  { value: 'LOGIN', label: '登录入口' },
  { value: 'PORTAL', label: '门户首页' },
  { value: 'API', label: '开放接口' },
];

const MODULE_CONFIG_ITEMS = [
  { key: 'login', title: '登录页面', desc: '入口样式、登录方式、租户选择', icon: <LoginOutlined />, active: true },
  { key: 'domain', title: '自定义域名', desc: '域名绑定、校验记录、HTTPS', icon: <GlobalOutlined />, active: true },
  { key: 'space', title: '空间模块', desc: '空间创建、成员加入、场景入口', icon: <BankOutlined /> },
  { key: 'resource', title: '资料库模块', desc: '容量、解析、上传限制', icon: <SettingOutlined /> },
  { key: 'message', title: '消息模块', desc: '通知策略、保留周期', icon: <MobileOutlined /> },
];

const PACKAGE_CATALOG = [
  {
    id: 'pkg-standard',
    name: '标准版套餐',
    code: 'PKG-STANDARD',
    price: 19800,
    cycle: '月',
    version: 'v1.0',
    solutionNames: ['教师数字素养提升培训方案'],
    userLimit: 200,
    adminLimit: 5,
    departmentLimit: 12,
    spaceLimit: 30,
    storageLimitGb: 200,
    moduleNames: ['空间模块', '资料库模块', 'Office 文档模块', 'Lucky 模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 30，单空间成员 80，不支持自定义创建场景',
      'Lucky 模块：技能 8，智能体 3，月调用 10,000',
      '资料库模块：容量 200GB，单文件 500MB',
      'Office 文档模块：只读',
      '消息模块：月发送 20,000，保留 180 天',
    ],
  },
  {
    id: 'pkg-pro',
    name: '专业版套餐',
    code: 'PKG-PRO',
    price: 49800,
    cycle: '季度',
    version: 'v1.0',
    solutionNames: ['教师数字素养提升培训方案', '区域教研共创解决方案'],
    userLimit: 800,
    adminLimit: 20,
    departmentLimit: 50,
    spaceLimit: 120,
    storageLimitGb: 1000,
    moduleNames: ['空间模块', '资料库模块', 'Office 文档模块', 'Lucky 模块', '知识空间模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 120，单空间成员 300，支持自定义创建场景',
      'Lucky 模块：技能 30，智能体 12，月调用 80,000',
      '资料库模块：容量 1000GB，AI 解析 8,000 次/月',
      'Office 文档模块：可编辑',
      '知识空间模块：知识空间 30，图谱绑定 12',
      '消息模块：月发送 120,000，保留 365 天',
    ],
  },
  {
    id: 'pkg-ultimate',
    name: '旗舰版套餐',
    code: 'PKG-ULTIMATE',
    price: 128000,
    cycle: '年',
    version: 'v1.0',
    solutionNames: ['教师数字素养提升培训方案', '区域教研共创解决方案', 'AI 课程创作中心方案'],
    userLimit: 3000,
    adminLimit: 80,
    departmentLimit: 200,
    spaceLimit: 500,
    storageLimitGb: 5000,
    moduleNames: ['空间模块', '资料库模块', 'Office 文档模块', 'Lucky 模块', '知识空间模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 500，单空间成员 1000，支持自定义创建场景',
      'Lucky 模块：技能 120，智能体 50，月调用 500,000',
      '资料库模块：容量 5000GB，AI 解析 50,000 次/月',
      'Office 文档模块：可编辑',
      '知识空间模块：知识空间 120，图谱绑定 60',
      '证书模块：模板 80，月发放 200,000',
    ],
  },
];

function getInheritedLoginConfigFromPackage(packageId, tenantName = '') {
  const packageItem = PACKAGE_CATALOG.find((item) => item.id === packageId);
  if (!packageItem) {
    return {
      sourceSolutionName: '',
      loginConfig: createLoginConfig(tenantName ? {
        platformName: `${tenantName}智能教学平台`,
      } : {}),
    };
  }
  return getLoginConfigFromSolutionNames(packageItem.solutionNames);
}

function createDomainRecord(tenantCode, overrides = {}) {
  const normalizedCode = String(tenantCode || 'tenant').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const domain = overrides.domain || `${normalizedCode}.example.com`;
  return {
    id: `domain-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    domain,
    usage: 'LOGIN',
    status: 'PENDING',
    sslStatus: 'PENDING',
    cnameTarget: `${normalizedCode}.tenant.guoren.ai`,
    verifyType: 'TXT',
    verifyName: `_gr_verify.${domain}`,
    verifyValue: `gr-site-verification=${normalizedCode}`,
    remark: '',
    ...overrides,
  };
}

function createDomainConfig(tenantCode, overrides = {}) {
  return {
    enabled: true,
    forceHttps: true,
    domains: [],
    ...overrides,
    domains: (overrides.domains || []).map((item) => createDomainRecord(tenantCode, item)),
  };
}

const INITIAL_TENANTS = [
  {
    id: 'tenant-east-edu',
    name: '华东教育集团',
    code: 'TENANT-EAST-EDU',
    status: 'ACTIVE',
    type: 'GROUP',
    industry: '基础教育',
    region: '上海',
    contactName: '周明',
    contactPhone: '138-0000-1201',
    packageId: 'pkg-pro',
    serviceStart: '2026-01-01',
    serviceEnd: '2026-12-31',
    serviceStatus: 'ACTIVE',
    successOwner: '李婧',
    remark: '区域教研与教师培训联合项目。',
    updatedAt: '2026-07-11 16:20',
    loginConfigSource: getInheritedLoginConfigFromPackage('pkg-pro').sourceSolutionName,
    loginConfig: getInheritedLoginConfigFromPackage('pkg-pro').loginConfig,
    domainConfig: createDomainConfig('TENANT-EAST-EDU', {
      domains: [
        {
          id: 'domain-east-login',
          domain: 'ai.huadong-edu.example.cn',
          status: 'VERIFIED',
          sslStatus: 'ISSUED',
          cnameTarget: 'tenant-east-edu.tenant.guoren.ai',
          verifyName: '_gr_verify.ai.huadong-edu.example.cn',
          verifyValue: 'gr-site-verification=tenant-east-edu',
          remark: '集团统一登录入口',
        },
      ],
    }),
  },
  {
    id: 'tenant-river-school',
    name: '江湾实验学校',
    code: 'TENANT-RIVER-SCHOOL',
    status: 'TRIAL',
    type: 'SCHOOL',
    industry: '基础教育',
    region: '杭州',
    contactName: '陈颖',
    contactPhone: '139-0000-2318',
    packageId: 'pkg-standard',
    serviceStart: '2026-06-01',
    serviceEnd: '2026-09-01',
    serviceStatus: 'TRIAL',
    successOwner: '王南',
    remark: '试点教师数字素养提升项目。',
    updatedAt: '2026-07-10 09:45',
    loginConfigSource: getInheritedLoginConfigFromPackage('pkg-standard').sourceSolutionName,
    loginConfig: getInheritedLoginConfigFromPackage('pkg-standard').loginConfig,
    domainConfig: createDomainConfig('TENANT-RIVER-SCHOOL'),
  },
  {
    id: 'tenant-north-lab',
    name: '北辰创新中心',
    code: 'TENANT-NORTH-LAB',
    status: 'DISABLED',
    type: 'ENTERPRISE',
    industry: '教育科技',
    region: '北京',
    contactName: '赵可',
    contactPhone: '137-0000-8812',
    packageId: null,
    serviceStart: '',
    serviceEnd: '',
    serviceStatus: 'PENDING',
    successOwner: '未分配',
    remark: '待确认正式服务范围。',
    updatedAt: '2026-07-08 14:12',
    loginConfigSource: '',
    loginConfig: createLoginConfig({
      platformName: '北辰创新中心智能培训平台',
    }),
    domainConfig: createDomainConfig('TENANT-NORTH-LAB', {
      enabled: false,
    }),
  },
];

function nowText() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getOptionLabel(options, value) {
  return options.find((item) => item.value === value)?.label || value || '-';
}

function renderStatusTag(options, value) {
  const target = options.find((item) => item.value === value) || options[0];
  return <Tag color={target.color}>{target.label}</Tag>;
}

function formatPrice(value) {
  const numeric = Number(value) || 0;
  return `¥${numeric.toLocaleString('zh-CN')}`;
}

function getPackageById(packageId) {
  return PACKAGE_CATALOG.find((item) => item.id === packageId) || null;
}

function TenantPrototypeModule() {
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState(null);
  const [activeTenantConfigKey, setActiveTenantConfigKey] = useState('login');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    name: '',
    code: '',
    status: 'TRIAL',
    type: 'SCHOOL',
    packageId: null,
  });

  const activeTenant = useMemo(
    () => tenants.find((item) => item.id === activeTenantId) || null,
    [activeTenantId, tenants],
  );

  const activePackage = useMemo(
    () => getPackageById(activeTenant?.packageId),
    [activeTenant],
  );

  const filteredTenants = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return tenants.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!normalized) return true;
      const currentPackage = getPackageById(item.packageId);
      const text = `${item.name} ${item.code} ${item.contactName} ${item.industry} ${item.region} ${currentPackage?.name || ''}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, statusFilter, tenants]);

  const summary = useMemo(() => {
    const activeCount = tenants.filter((item) => item.status === 'ACTIVE').length;
    const withPackageCount = tenants.filter((item) => item.packageId).length;
    const memberTotal = tenants.reduce((sum, item) => sum + Number(getPackageById(item.packageId)?.userLimit || 0), 0);
    return { activeCount, withPackageCount, memberTotal };
  }, [tenants]);

  const updateTenant = (id, patchOrUpdater) => {
    setTenants((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(item) : patchOrUpdater;
      return { ...item, ...patch, updatedAt: nowText() };
    }));
  };

  const openTenant = (record) => {
    setActiveTenantId(record.id);
    setActiveTenantConfigKey('login');
    setDrawerOpen(true);
  };

  const handleCreateTenant = () => {
    if (!createDraft.name.trim()) {
      message.warning('请输入租户名称');
      return;
    }
    const inheritedLogin = getInheritedLoginConfigFromPackage(createDraft.packageId, createDraft.name.trim());
    const nextTenant = {
      id: `tenant-${Date.now()}`,
      name: createDraft.name.trim(),
      code: createDraft.code.trim() || `TENANT-${String(tenants.length + 1).padStart(3, '0')}`,
      status: createDraft.status,
      type: createDraft.type,
      industry: '',
      region: '',
      contactName: '',
      contactPhone: '',
      packageId: createDraft.packageId,
      serviceStart: '',
      serviceEnd: '',
      serviceStatus: createDraft.packageId ? 'ACTIVE' : 'PENDING',
      successOwner: '',
      remark: '',
      updatedAt: nowText(),
      loginConfigSource: inheritedLogin.sourceSolutionName,
      loginConfig: inheritedLogin.loginConfig,
      domainConfig: createDomainConfig(createDraft.code.trim() || createDraft.name.trim()),
    };
    setTenants((prev) => [nextTenant, ...prev]);
    setCreateModalOpen(false);
    setCreateDraft({ name: '', code: '', status: 'TRIAL', type: 'SCHOOL', packageId: null });
    setActiveTenantId(nextTenant.id);
    setDrawerOpen(true);
    message.success('租户已创建');
  };

  const handleCopyTenant = (record) => {
    const copyIndex = tenants.filter((item) => item.id.startsWith(`${record.id}-copy`)).length + 1;
    const copied = {
      ...record,
      id: `${record.id}-copy-${copyIndex}`,
      name: `${record.name} 副本`,
      code: `${record.code}-COPY-${copyIndex}`,
      status: 'TRIAL',
      serviceStatus: record.packageId ? 'TRIAL' : 'PENDING',
      updatedAt: nowText(),
      loginConfig: createLoginConfig(record.loginConfig),
      domainConfig: {
        ...(record.domainConfig || createDomainConfig(record.code)),
        domains: (record.domainConfig?.domains || []).map((item) => ({
          ...item,
          id: `${item.id}-copy-${copyIndex}`,
        })),
      },
    };
    setTenants((prev) => [copied, ...prev]);
    message.success('已复制为新租户');
  };

  const handleDeleteTenant = (id) => {
    setTenants((prev) => prev.filter((item) => item.id !== id));
    if (activeTenantId === id) {
      setDrawerOpen(false);
      setActiveTenantId(null);
    }
    message.success('租户已删除');
  };

  const packageOptions = PACKAGE_CATALOG.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.code}`,
  }));

  const columns = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value, record) => (
        <Button type="link" className="tenant-name-button" onClick={() => openTenant(record)}>
          {value}
        </Button>
      ),
    },
    { title: '租户编码', dataIndex: 'code', key: 'code', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (value) => renderStatusTag(TENANT_STATUS_OPTIONS, value),
    },
    {
      title: '租户类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (value) => getOptionLabel(TENANT_TYPE_OPTIONS, value),
    },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 110 },
    {
      title: '成员上限',
      key: 'userLimit',
      width: 100,
      render: (_, record) => getPackageById(record.packageId)?.userLimit || '-',
    },
    {
      title: '当前套餐',
      dataIndex: 'packageId',
      key: 'packageId',
      width: 160,
      render: (value) => getPackageById(value)?.name || <Tag>未开通套餐</Tag>,
    },
    {
      title: '服务周期',
      key: 'servicePeriod',
      width: 210,
      render: (_, record) => (record.serviceStart && record.serviceEnd ? `${record.serviceStart} 至 ${record.serviceEnd}` : '-'),
    },
    { title: '到期时间', dataIndex: 'serviceEnd', key: 'serviceEnd', width: 120, render: (value) => value || '-' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openTenant(record)}>
            编辑
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyTenant(record)} />
          <Popconfirm title="确定删除该租户吗？" onConfirm={() => handleDeleteTenant(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderPackageSummary = (packageItem) => {
    if (!packageItem) {
      return (
        <div className="tenant-empty-package">
          <Empty description="未开通套餐" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }

    return (
      <div className="tenant-package-summary">
        <div className="tenant-package-hero">
          <div>
            <div className="tenant-package-name">{packageItem.name}</div>
            <div className="tenant-muted">{packageItem.code} · {packageItem.version} · {packageItem.cycle}</div>
          </div>
          <Tag color="purple">{formatPrice(packageItem.price)}</Tag>
        </div>
        <div className="tenant-quota-grid">
          <div>
            <span>成员上限</span>
            <strong>{packageItem.userLimit}</strong>
          </div>
          <div>
            <span>管理员上限</span>
            <strong>{packageItem.adminLimit}</strong>
          </div>
          <div>
            <span>部门上限</span>
            <strong>{packageItem.departmentLimit}</strong>
          </div>
          <div>
            <span>空间上限</span>
            <strong>{packageItem.spaceLimit}</strong>
          </div>
          <div>
            <span>存储上限</span>
            <strong>{packageItem.storageLimitGb} GB</strong>
          </div>
        </div>
        <div className="tenant-summary-block">
          <div className="tenant-block-title">适用解决方案</div>
          <Space wrap>
            {packageItem.solutionNames.map((name) => <Tag key={name} color="blue">{name}</Tag>)}
          </Space>
        </div>
        <div className="tenant-summary-block">
          <div className="tenant-block-title">开放模块</div>
          <Space wrap>
            {packageItem.moduleNames.map((name) => <Tag key={name}>{name}</Tag>)}
          </Space>
        </div>
        <div className="tenant-summary-block">
          <div className="tenant-block-title">模块资源限制摘要</div>
          <div className="tenant-resource-list">
            {packageItem.resourceSummary.map((item) => <div key={item}>{item}</div>)}
          </div>
        </div>
      </div>
    );
  };

  const updateLoginConfig = (patch) => {
    if (!activeTenant) return;
    updateTenant(activeTenant.id, (tenant) => ({
      loginConfig: createLoginConfig({
        ...(tenant.loginConfig || {}),
        ...patch,
      }),
    }));
  };

  const updateLoginMethod = (methodKey, enabled) => {
    if (!activeTenant) return;
    const loginConfig = createLoginConfig(activeTenant.loginConfig);
    const nextMethods = {
      ...loginConfig.loginMethods,
      [methodKey]: enabled,
    };
    if (!nextMethods.account && !nextMethods.phone) {
      message.warning('至少保留一种登录方式');
      return;
    }

    const nextDefaultMethod = nextMethods[loginConfig.defaultMethod]
      ? loginConfig.defaultMethod
      : LOGIN_METHOD_OPTIONS.find((item) => nextMethods[item.value])?.value || 'phone';

    updateLoginConfig({
      loginMethods: nextMethods,
      defaultMethod: nextDefaultMethod,
    });
  };

  const updateDomainConfig = (patch) => {
    if (!activeTenant) return;
    updateTenant(activeTenant.id, (tenant) => ({
      domainConfig: {
        ...createDomainConfig(tenant.code),
        ...(tenant.domainConfig || {}),
        ...patch,
      },
    }));
  };

  const updateDomainRecord = (domainId, patch) => {
    if (!activeTenant) return;
    const domainConfig = {
      ...createDomainConfig(activeTenant.code),
      ...(activeTenant.domainConfig || {}),
    };
    updateDomainConfig({
      domains: domainConfig.domains.map((item) => (item.id === domainId ? { ...item, ...patch } : item)),
    });
  };

  const handleAddDomain = () => {
    if (!activeTenant) return;
    const domainConfig = {
      ...createDomainConfig(activeTenant.code),
      ...(activeTenant.domainConfig || {}),
    };
    updateDomainConfig({
      enabled: true,
      domains: [
        ...domainConfig.domains,
        createDomainRecord(activeTenant.code, {
          domain: '',
          cnameTarget: `${String(activeTenant.code || activeTenant.id).toLowerCase()}.tenant.guoren.ai`,
          verifyName: '_gr_verify',
          verifyValue: `gr-site-verification=${String(activeTenant.code || activeTenant.id).toLowerCase()}`,
        }),
      ],
    });
  };

  const handleDeleteDomain = (domainId) => {
    if (!activeTenant) return;
    const domainConfig = activeTenant.domainConfig || createDomainConfig(activeTenant.code);
    updateDomainConfig({
      domains: domainConfig.domains.filter((item) => item.id !== domainId),
    });
  };

  const handleVerifyDomain = (domainId) => {
    updateDomainRecord(domainId, {
      status: 'VERIFIED',
      sslStatus: 'ISSUED',
    });
    message.success('域名校验已通过，HTTPS 证书已签发（原型）');
  };

  const handleCopyDomainText = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      message.success('已复制');
    } catch {
      message.info(text);
    }
  };

  const renderLoginConfigPreview = (loginConfig) => {
    const enabledMethods = LOGIN_METHOD_OPTIONS.filter((item) => loginConfig.loginMethods[item.value]);
    const defaultMethodLabel = LOGIN_METHOD_OPTIONS.find((item) => item.value === loginConfig.defaultMethod)?.label || enabledMethods[0]?.label;

    return (
      <div className={`tenant-login-preview tenant-login-preview-${loginConfig.template}`} style={{ '--tenant-preview-accent': loginConfig.accentColor }}>
        <div className="tenant-login-preview-hero">
          <div>
            <strong>{loginConfig.heroTitle}</strong>
            <span>{loginConfig.heroSubtitle}</span>
          </div>
          <div className="tenant-login-preview-orbit">AI</div>
        </div>
        <div className="tenant-login-preview-panel">
          <div className="tenant-login-preview-welcome">{loginConfig.welcomeText}</div>
          <div className="tenant-login-preview-title">{loginConfig.platformName}</div>
          <div className="tenant-login-preview-tabs">
            {enabledMethods.map((item) => (
              <span key={item.value} className={item.value === loginConfig.defaultMethod ? 'is-active' : ''}>
                {item.label}
              </span>
            ))}
          </div>
          <div className="tenant-login-preview-input" />
          <div className="tenant-login-preview-input is-short" />
          <div className="tenant-login-preview-button">立即登录</div>
          <div className="tenant-login-preview-flags">
            {defaultMethodLabel ? <Tag color="blue">默认：{defaultMethodLabel}</Tag> : null}
            {loginConfig.captchaEnabled ? <Tag>验证码</Tag> : null}
            {loginConfig.agreementRequired ? <Tag>协议确认</Tag> : null}
            {loginConfig.tenantSelectEnabled ? <Tag color="purple">登录后选企业</Tag> : null}
          </div>
        </div>
      </div>
    );
  };

  const renderTenantConfig = () => {
    if (!activeTenant) return null;
    const loginConfig = createLoginConfig(activeTenant.loginConfig);
    const domainConfig = {
      ...createDomainConfig(activeTenant.code),
      ...(activeTenant.domainConfig || {}),
    };
    const methodSelectOptions = LOGIN_METHOD_OPTIONS.map((item) => ({
      ...item,
      disabled: !loginConfig.loginMethods[item.value],
    }));
    const activeConfigItem = MODULE_CONFIG_ITEMS.find((item) => item.key === activeTenantConfigKey) || MODULE_CONFIG_ITEMS[0];
    const implementedConfigKeys = new Set(['login', 'domain']);

    return (
      <div className="tenant-config-layout">
        <aside className="tenant-module-config-list">
          {MODULE_CONFIG_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`tenant-module-config-item ${activeTenantConfigKey === item.key ? 'is-active' : ''}`}
              onClick={() => setActiveTenantConfigKey(item.key)}
            >
              <span className="tenant-module-config-icon">{item.icon}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
              </span>
              {activeTenantConfigKey === item.key
                ? <Tag color="blue">当前</Tag>
                : implementedConfigKeys.has(item.key)
                  ? <Tag color="success">已配置</Tag>
                  : <Tag>待配置</Tag>}
            </button>
          ))}
        </aside>

        <div className="tenant-config-content">
          <div className="tenant-config-title-row">
            <div>
              <div className="tenant-block-title">{activeConfigItem.title}配置</div>
              <p>{activeConfigItem.desc}。解决方案提供默认值，租户可继续覆盖。</p>
            </div>
            <Space wrap>
              {activeTenant.loginConfigSource ? <Tag color="blue">初始继承自：{activeTenant.loginConfigSource}</Tag> : null}
              <Tag color="purple">{activeTenant.name}</Tag>
            </Space>
          </div>

          {activeTenantConfigKey === 'domain' ? (
          <div className="tenant-domain-config-card">
            <div className="tenant-domain-config-head">
              <div>
                <div className="tenant-config-card-title">自定义域名</div>
                <p>为租户配置独立访问域名，可用于登录入口、门户首页或开放接口。</p>
              </div>
              <Space wrap>
                <span className="tenant-domain-switch-label">启用域名</span>
                <Switch checked={domainConfig.enabled} onChange={(checked) => updateDomainConfig({ enabled: checked })} />
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddDomain}>
                  添加域名
                </Button>
              </Space>
            </div>

            <div className="tenant-domain-options">
              <div className="tenant-domain-option-row">
                <div>
                  <strong>强制 HTTPS</strong>
                  <span>域名验证通过后自动使用 HTTPS 访问。</span>
                </div>
                <Switch checked={domainConfig.forceHttps} onChange={(checked) => updateDomainConfig({ forceHttps: checked })} />
              </div>
              <div className="tenant-domain-option-row">
                <div>
                  <strong>默认 CNAME 目标</strong>
                  <span>{`${String(activeTenant.code || activeTenant.id).toLowerCase()}.tenant.guoren.ai`}</span>
                </div>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyDomainText(`${String(activeTenant.code || activeTenant.id).toLowerCase()}.tenant.guoren.ai`)}>
                  复制
                </Button>
              </div>
            </div>

            {domainConfig.domains.length ? (
              <div className="tenant-domain-list">
                {domainConfig.domains.map((domainItem) => (
                  <div key={domainItem.id} className="tenant-domain-row">
                    <div className="tenant-domain-main">
                      <label>
                        <span>域名</span>
                        <Input
                          value={domainItem.domain}
                          placeholder="例如 ai.example.com"
                          onChange={(event) => {
                            const nextDomain = event.target.value.trim();
                            updateDomainRecord(domainItem.id, {
                              domain: nextDomain,
                              verifyName: nextDomain ? `_gr_verify.${nextDomain}` : '_gr_verify',
                            });
                          }}
                        />
                      </label>
                      <label>
                        <span>用途</span>
                        <Select
                          value={domainItem.usage}
                          options={DOMAIN_USAGE_OPTIONS}
                          onChange={(value) => updateDomainRecord(domainItem.id, { usage: value })}
                        />
                      </label>
                      <div className="tenant-domain-status">
                        {renderStatusTag(DOMAIN_STATUS_OPTIONS, domainItem.status)}
                        {renderStatusTag(DOMAIN_SSL_STATUS_OPTIONS, domainItem.sslStatus)}
                      </div>
                      <Space>
                        <Button
                          size="small"
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => handleVerifyDomain(domainItem.id)}
                          disabled={!domainItem.domain}
                        >
                          模拟验证
                        </Button>
                        <Popconfirm title="确定删除该域名吗？" onConfirm={() => handleDeleteDomain(domainItem.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                    <div className="tenant-domain-records">
                      <div className="tenant-domain-record">
                        <span>CNAME 指向</span>
                        <code>{domainItem.cnameTarget}</code>
                        <Button size="small" type="link" onClick={() => handleCopyDomainText(domainItem.cnameTarget)}>复制</Button>
                      </div>
                      <div className="tenant-domain-record">
                        <span>TXT 校验</span>
                        <code>{domainItem.verifyName}</code>
                        <code>{domainItem.verifyValue}</code>
                        <Button size="small" type="link" onClick={() => handleCopyDomainText(`${domainItem.verifyName} ${domainItem.verifyValue}`)}>复制</Button>
                      </div>
                      {domainItem.remark ? <div className="tenant-domain-remark">{domainItem.remark}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tenant-domain-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无自定义域名">
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDomain}>
                    添加第一个域名
                  </Button>
                </Empty>
              </div>
            )}
          </div>
          ) : null}

          {activeTenantConfigKey === 'login' ? (
          <div className="tenant-login-config-grid">
            <div className="tenant-config-card">
              <div className="tenant-config-card-title">页面文案</div>
              <div className="tenant-form-grid tenant-config-inner-grid">
                <label>
                  <span>欢迎语</span>
                  <Input value={loginConfig.welcomeText} onChange={(event) => updateLoginConfig({ welcomeText: event.target.value })} />
                </label>
                <label>
                  <span>平台名称</span>
                  <Input value={loginConfig.platformName} onChange={(event) => updateLoginConfig({ platformName: event.target.value })} />
                </label>
                <label>
                  <span>左侧主标题</span>
                  <Input value={loginConfig.heroTitle} onChange={(event) => updateLoginConfig({ heroTitle: event.target.value })} />
                </label>
                <label>
                  <span>左侧副标题</span>
                  <Input value={loginConfig.heroSubtitle} onChange={(event) => updateLoginConfig({ heroSubtitle: event.target.value })} />
                </label>
              </div>
            </div>

            <div className="tenant-config-card">
              <div className="tenant-config-card-title">登录功能</div>
              <div className="tenant-config-toggle-list">
                <div className="tenant-config-toggle-row">
                  <div>
                    <strong>账号密码登录</strong>
                    <span>支持账号/邮箱 + 密码 + 图形验证码</span>
                  </div>
                  <Switch checked={loginConfig.loginMethods.account} onChange={(checked) => updateLoginMethod('account', checked)} />
                </div>
                <div className="tenant-config-toggle-row">
                  <div>
                    <strong>手机号登录</strong>
                    <span>支持手机号 + 短信验证码</span>
                  </div>
                  <Switch checked={loginConfig.loginMethods.phone} onChange={(checked) => updateLoginMethod('phone', checked)} />
                </div>
                <div className="tenant-config-toggle-row">
                  <div>
                    <strong>图形验证码</strong>
                    <span>账号密码登录时展示图形验证码</span>
                  </div>
                  <Switch checked={loginConfig.captchaEnabled} onChange={(checked) => updateLoginConfig({ captchaEnabled: checked })} />
                </div>
                <div className="tenant-config-toggle-row">
                  <div>
                    <strong>登录协议确认</strong>
                    <span>要求用户勾选用户协议与隐私政策</span>
                  </div>
                  <Switch checked={loginConfig.agreementRequired} onChange={(checked) => updateLoginConfig({ agreementRequired: checked })} />
                </div>
                <div className="tenant-config-toggle-row">
                  <div>
                    <strong>登录后选择企业</strong>
                    <span>验证通过后先进入企业/组织选择页</span>
                  </div>
                  <Switch checked={loginConfig.tenantSelectEnabled} onChange={(checked) => updateLoginConfig({ tenantSelectEnabled: checked })} />
                </div>
                <label className="tenant-config-default-method">
                  <span>默认登录方式</span>
                  <Select value={loginConfig.defaultMethod} options={methodSelectOptions} onChange={(value) => updateLoginConfig({ defaultMethod: value })} />
                </label>
              </div>
            </div>

            <div className="tenant-config-card">
              <div className="tenant-config-card-title">视觉模板</div>
              <div className="tenant-form-grid tenant-config-inner-grid">
                <label>
                  <span>页面模板</span>
                  <Select value={loginConfig.template} options={LOGIN_TEMPLATE_OPTIONS} onChange={(value) => updateLoginConfig({ template: value })} />
                </label>
                <label>
                  <span>品牌主色</span>
                  <Select
                    value={loginConfig.accentColor}
                    onChange={(value) => updateLoginConfig({ accentColor: value })}
                    options={LOGIN_ACCENT_OPTIONS.map((item) => ({
                      value: item.value,
                      label: (
                        <span className="tenant-color-option">
                          <i style={{ background: item.value }} />
                          {item.label}
                        </span>
                      ),
                    }))}
                  />
                </label>
              </div>
              <div className="tenant-config-note">
                租户初始值来自套餐绑定的解决方案；修改后以租户级配置为准，后续可由登录页按租户域名或租户编码读取。
              </div>
            </div>

            <div className="tenant-config-card tenant-config-preview-card">
              <div className="tenant-config-card-title">登录页预览</div>
              {renderLoginConfigPreview(loginConfig)}
            </div>
          </div>
          ) : null}

          {!implementedConfigKeys.has(activeTenantConfigKey) ? (
            <div className="tenant-config-placeholder">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`${activeConfigItem.title}配置暂未实现`}
              />
              <div>这里将承载该模块的租户级配置项，左侧切换不会再展示其他模块配置。</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDrawer = () => {
    if (!activeTenant) return null;

    return (
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="min(1080px, 96vw)"
        title={null}
        destroyOnClose={false}
      >
        <div className="tenant-drawer-head">
          <div className="tenant-drawer-title-wrap">
            <Avatar className="tenant-avatar" icon={<BankOutlined />} />
            <div>
              <div className="tenant-drawer-title">{activeTenant.name}</div>
              <div className="tenant-drawer-subtitle">
                {activeTenant.code} · {getOptionLabel(TENANT_TYPE_OPTIONS, activeTenant.type)} · {activeTenant.region || '未设置地区'}
              </div>
              <Space wrap className="tenant-tag-row">
                {renderStatusTag(TENANT_STATUS_OPTIONS, activeTenant.status)}
                {activePackage ? <Tag color="purple">{activePackage.name}</Tag> : <Tag>未开通套餐</Tag>}
                {renderStatusTag(SERVICE_STATUS_OPTIONS, activeTenant.serviceStatus)}
              </Space>
            </div>
          </div>
          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={() => handleCopyTenant(activeTenant)}>
              复制租户
            </Button>
            <Popconfirm title="确定删除该租户吗？" onConfirm={() => handleDeleteTenant(activeTenant.id)}>
              <Button danger icon={<DeleteOutlined />}>
                删除租户
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Tabs
          items={[
            {
              key: 'base',
              label: '基本信息',
              children: (
                <div className="tenant-section">
                  <div className="tenant-form-grid">
                    <label>
                      <span>租户名称</span>
                      <Input value={activeTenant.name} onChange={(event) => updateTenant(activeTenant.id, { name: event.target.value })} />
                    </label>
                    <label>
                      <span>租户编码</span>
                      <Input value={activeTenant.code} onChange={(event) => updateTenant(activeTenant.id, { code: event.target.value })} />
                    </label>
                    <label>
                      <span>状态</span>
                      <Select value={activeTenant.status} options={TENANT_STATUS_OPTIONS} onChange={(value) => updateTenant(activeTenant.id, { status: value })} />
                    </label>
                    <label>
                      <span>租户类型</span>
                      <Select value={activeTenant.type} options={TENANT_TYPE_OPTIONS} onChange={(value) => updateTenant(activeTenant.id, { type: value })} />
                    </label>
                    <label>
                      <span>行业</span>
                      <Input value={activeTenant.industry} onChange={(event) => updateTenant(activeTenant.id, { industry: event.target.value })} />
                    </label>
                    <label>
                      <span>地区</span>
                      <Input value={activeTenant.region} onChange={(event) => updateTenant(activeTenant.id, { region: event.target.value })} />
                    </label>
                    <label>
                      <span>联系人</span>
                      <Input value={activeTenant.contactName} onChange={(event) => updateTenant(activeTenant.id, { contactName: event.target.value })} />
                    </label>
                    <label>
                      <span>联系方式</span>
                      <Input value={activeTenant.contactPhone} onChange={(event) => updateTenant(activeTenant.id, { contactPhone: event.target.value })} />
                    </label>
                    <label className="tenant-form-span">
                      <span>备注</span>
                      <TextArea rows={4} value={activeTenant.remark} onChange={(event) => updateTenant(activeTenant.id, { remark: event.target.value })} />
                    </label>
                  </div>
                </div>
              ),
            },
            {
              key: 'package',
              label: '套餐信息',
              children: (
                <div className="tenant-section">
                  <div className="tenant-form-grid">
                    <label className="tenant-form-span">
                      <span>选择套餐</span>
                      <Select
                        allowClear
                        value={activeTenant.packageId}
                        options={packageOptions}
                        placeholder="未开通套餐"
                        onChange={(value) => {
                          const inheritedLogin = getInheritedLoginConfigFromPackage(value || null, activeTenant.name);
                          updateTenant(activeTenant.id, {
                            packageId: value || null,
                            serviceStatus: value ? activeTenant.serviceStatus === 'PENDING' ? 'ACTIVE' : activeTenant.serviceStatus : 'PENDING',
                            loginConfigSource: inheritedLogin.sourceSolutionName,
                            loginConfig: inheritedLogin.loginConfig,
                          });
                          if (value) {
                            message.success('已按套餐关联解决方案初始化登录页配置，可在配置页签继续修改');
                          }
                        }}
                      />
                    </label>
                    <label>
                      <span>服务开始时间</span>
                      <Input value={activeTenant.serviceStart} placeholder="YYYY-MM-DD" onChange={(event) => updateTenant(activeTenant.id, { serviceStart: event.target.value })} />
                    </label>
                    <label>
                      <span>服务结束时间</span>
                      <Input value={activeTenant.serviceEnd} placeholder="YYYY-MM-DD" onChange={(event) => updateTenant(activeTenant.id, { serviceEnd: event.target.value })} />
                    </label>
                    <label>
                      <span>开通状态</span>
                      <Select value={activeTenant.serviceStatus} options={SERVICE_STATUS_OPTIONS} onChange={(value) => updateTenant(activeTenant.id, { serviceStatus: value })} />
                    </label>
                    <label>
                      <span>客户成功负责人</span>
                      <Input value={activeTenant.successOwner} onChange={(event) => updateTenant(activeTenant.id, { successOwner: event.target.value })} />
                    </label>
                  </div>
                </div>
              ),
            },
            {
              key: 'summary',
              label: '套餐权益摘要',
              children: (
                <div className="tenant-section">
                  {renderPackageSummary(activePackage)}
                </div>
              ),
            },
            {
              key: 'config',
              label: '配置',
              children: (
                <div className="tenant-section tenant-config-section">
                  {renderTenantConfig()}
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    );
  };

  return (
    <div className="tenant-prototype-module">
      <div className="tenant-page-header">
        <div>
          <div className="tenant-eyebrow">前端原型</div>
          <h1>租户管理</h1>
          <p>维护租户基本信息，并选择一个套餐作为权益来源；套餐权益在这里只读展示。</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建租户
        </Button>
      </div>

      <div className="tenant-summary-grid">
        <div className="tenant-summary-card">
          <span>租户数量</span>
          <strong>{tenants.length}</strong>
          <small>当前原型内租户</small>
        </div>
        <div className="tenant-summary-card">
          <span>启用租户</span>
          <strong>{summary.activeCount}</strong>
          <small>可正常服务</small>
        </div>
        <div className="tenant-summary-card">
          <span>已选套餐</span>
          <strong>{summary.withPackageCount}</strong>
          <small>拥有套餐权益来源</small>
        </div>
        <div className="tenant-summary-card">
          <span>成员上限</span>
          <strong>{summary.memberTotal}</strong>
          <small>按所选套餐汇总</small>
        </div>
      </div>

      <div className="tenant-main-panel">
        <div className="tenant-toolbar">
          <Input
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索租户、编码、联系人、行业或套餐"
            allowClear
            style={{ maxWidth: 440 }}
          />
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="全部状态"
              allowClear
              options={TENANT_STATUS_OPTIONS}
              style={{ width: 140 }}
            />
            <Button onClick={() => {
              setKeyword('');
              setStatusFilter(undefined);
            }}>
              重置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建租户
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTenants}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1500 }}
        />
      </div>

      {renderDrawer()}

      <Modal
        title="新建租户"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateTenant}
        okText="创建"
        width={760}
        destroyOnClose
      >
        <div className="tenant-create-grid">
          <label>
            <span>租户名称</span>
            <Input value={createDraft.name} onChange={(event) => setCreateDraft((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label>
            <span>租户编码</span>
            <Input value={createDraft.code} placeholder="不填则自动生成" onChange={(event) => setCreateDraft((prev) => ({ ...prev, code: event.target.value }))} />
          </label>
          <label>
            <span>状态</span>
            <Select value={createDraft.status} options={TENANT_STATUS_OPTIONS} onChange={(value) => setCreateDraft((prev) => ({ ...prev, status: value }))} />
          </label>
          <label>
            <span>租户类型</span>
            <Select value={createDraft.type} options={TENANT_TYPE_OPTIONS} onChange={(value) => setCreateDraft((prev) => ({ ...prev, type: value }))} />
          </label>
          <label className="tenant-form-span">
            <span>套餐</span>
            <Select
              allowClear
              value={createDraft.packageId}
              options={packageOptions}
              placeholder="未开通套餐"
              onChange={(value) => setCreateDraft((prev) => ({ ...prev, packageId: value || null }))}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

export default TenantPrototypeModule;
