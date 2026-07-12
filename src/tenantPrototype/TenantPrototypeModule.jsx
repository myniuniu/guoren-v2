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
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
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
    moduleNames: ['空间模块', '资料库模块', 'Lucky 模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 30，单空间成员 80，不支持自定义创建场景',
      'Lucky 模块：技能 8，智能体 3，月调用 10,000',
      '资料库模块：容量 200GB，单文件 500MB',
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
    moduleNames: ['空间模块', '资料库模块', 'Lucky 模块', '知识空间模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 120，单空间成员 300，支持自定义创建场景',
      'Lucky 模块：技能 30，智能体 12，月调用 80,000',
      '资料库模块：容量 1000GB，AI 解析 8,000 次/月',
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
    moduleNames: ['空间模块', '资料库模块', 'Lucky 模块', '知识空间模块', '消息模块', '研讨会模块', '问卷模块', '证书模块'],
    resourceSummary: [
      '空间模块：最大空间 500，单空间成员 1000，支持自定义创建场景',
      'Lucky 模块：技能 120，智能体 50，月调用 500,000',
      '资料库模块：容量 5000GB，AI 解析 50,000 次/月',
      '知识空间模块：知识空间 120，图谱绑定 60',
      '证书模块：模板 80，月发放 200,000',
    ],
  },
];

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
    setDrawerOpen(true);
  };

  const handleCreateTenant = () => {
    if (!createDraft.name.trim()) {
      message.warning('请输入租户名称');
      return;
    }
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
                        onChange={(value) => updateTenant(activeTenant.id, {
                          packageId: value || null,
                          serviceStatus: value ? activeTenant.serviceStatus === 'PENDING' ? 'ACTIVE' : activeTenant.serviceStatus : 'PENDING',
                        })}
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
