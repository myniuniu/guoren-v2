import { useEffect, useMemo, useState } from 'react';
import {
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
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  APP_STATUS_OPTIONS,
  CONFIG_VALUE_TYPE_OPTIONS,
  DEPLOY_STATUS_OPTIONS,
  SOLUTION_STATUS_OPTIONS,
  TENANT_STATUS_OPTIONS,
  solutionApi,
  solutionCatalogApi,
  tenantApi,
} from './api';
import '../system/SystemModule.css';
import './SolutionManagementModule.css';

const { TextArea } = Input;

function getErrorMessage(error, fallback = '操作失败') {
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }
  return error?.message || fallback;
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 16);
}

function renderStatusTag(type, value) {
  const colorMap = {
    tenant: {
      ACTIVE: 'success',
      DISABLED: 'default',
    },
    app: {
      ACTIVE: 'success',
      DISABLED: 'default',
    },
    solution: {
      DRAFT: 'default',
      ACTIVE: 'processing',
      DISABLED: 'warning',
    },
    deploy: {
      TODO: 'default',
      IN_PROGRESS: 'processing',
      DONE: 'success',
      BLOCKED: 'error',
    },
  };
  const labelMap = {
    tenant: Object.fromEntries(TENANT_STATUS_OPTIONS.map((item) => [item.value, item.label])),
    app: Object.fromEntries(APP_STATUS_OPTIONS.map((item) => [item.value, item.label])),
    solution: Object.fromEntries(SOLUTION_STATUS_OPTIONS.map((item) => [item.value, item.label])),
    deploy: Object.fromEntries(DEPLOY_STATUS_OPTIONS.map((item) => [item.value, item.label])),
  };
  return (
    <Tag color={colorMap[type]?.[value] || 'default'} className="solution-status-tag">
      {labelMap[type]?.[value] || value || '-'}
    </Tag>
  );
}

function toSolutionPayload(values, statusOverride) {
  return {
    solutionCode: values.solutionCode || undefined,
    name: values.name,
    tenantId: values.tenantId,
    description: values.description,
    owner: values.owner,
    goLiveDate: values.goLiveDate || undefined,
    status: statusOverride || values.status,
  };
}

function toAppPayload(installedApps) {
  return (installedApps || []).map((item, index) => ({
    id: item.id,
    appId: item.appId,
    sortNo: item.sortNo ?? index + 1,
    deployStatus: item.deployStatus,
    installRequired: item.installRequired,
    remark: item.remark,
  }));
}

function emptyConfigRow(sortNo = 1) {
  return {
    configKey: '',
    configName: '',
    valueType: 'STRING',
    required: false,
    defaultValue: '',
    currentValue: '',
    optionsJson: '',
    placeholder: '',
    description: '',
    sortNo,
  };
}

export default function SolutionManagementModule() {
  const [activeTab, setActiveTab] = useState('solutions');
  const [loading, setLoading] = useState(true);
  const [solutions, setSolutions] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [catalogApps, setCatalogApps] = useState([]);

  const [solutionKeyword, setSolutionKeyword] = useState('');
  const [solutionTenantFilter, setSolutionTenantFilter] = useState(undefined);
  const [solutionStatusFilter, setSolutionStatusFilter] = useState(undefined);

  const [tenantKeyword, setTenantKeyword] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState(undefined);

  const [appKeyword, setAppKeyword] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState(undefined);

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [tenantEditing, setTenantEditing] = useState(null);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appEditing, setAppEditing] = useState(null);
  const [solutionCreateOpen, setSolutionCreateOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [solutionDraft, setSolutionDraft] = useState(null);

  const [addAppModalOpen, setAddAppModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configEditingApp, setConfigEditingApp] = useState(null);

  const [tenantForm] = Form.useForm();
  const [appForm] = Form.useForm();
  const [solutionCreateForm] = Form.useForm();
  const [solutionBaseForm] = Form.useForm();
  const [addAppForm] = Form.useForm();
  const [configForm] = Form.useForm();

  const usedTenantIds = useMemo(() => new Set(solutions.map((item) => item.tenantId)), [solutions]);

  const solutionSummary = useMemo(() => ({
    tenantCount: tenants.length,
    solutionCount: solutions.length,
    pendingAppCount: solutions.reduce((sum, item) => sum + (item.pendingAppCount || 0), 0),
  }), [tenants, solutions]);

  const filteredSolutions = useMemo(() => {
    return solutions.filter((item) => {
      const keyword = solutionKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.name || ''} ${item.solutionCode || ''} ${item.tenantName || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (solutionTenantFilter && item.tenantId !== solutionTenantFilter) return false;
      if (solutionStatusFilter && item.status !== solutionStatusFilter) return false;
      return true;
    });
  }, [solutions, solutionKeyword, solutionTenantFilter, solutionStatusFilter]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((item) => {
      const keyword = tenantKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.name || ''} ${item.tenantCode || ''} ${item.contactName || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (tenantStatusFilter && item.status !== tenantStatusFilter) return false;
      return true;
    });
  }, [tenants, tenantKeyword, tenantStatusFilter]);

  const filteredCatalogApps = useMemo(() => {
    return catalogApps.filter((item) => {
      const keyword = appKeyword.trim().toLowerCase();
      if (keyword) {
        const haystack = `${item.name || ''} ${item.appCode || ''} ${item.category || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (appStatusFilter && item.status !== appStatusFilter) return false;
      return true;
    });
  }, [catalogApps, appKeyword, appStatusFilter]);

  const editableTenantOptions = useMemo(() => {
    return tenants
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => ({
        value: item.id,
        label: item.name,
        disabled: usedTenantIds.has(item.id) && item.id !== solutionDraft?.tenantId,
      }));
  }, [tenants, usedTenantIds, solutionDraft]);

  const creatableTenantOptions = useMemo(() => {
    return tenants
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => ({
        value: item.id,
        label: item.name,
        disabled: usedTenantIds.has(item.id),
      }));
  }, [tenants, usedTenantIds]);

  const addableCatalogApps = useMemo(() => {
    const installedIds = new Set((solutionDraft?.installedApps || []).map((item) => item.appId));
    return catalogApps.filter((item) => item.status === 'ACTIVE' && !installedIds.has(item.id));
  }, [catalogApps, solutionDraft]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!solutionDraft) return;
    solutionBaseForm.setFieldsValue({
      solutionCode: solutionDraft.solutionCode,
      name: solutionDraft.name,
      tenantId: solutionDraft.tenantId,
      description: solutionDraft.description,
      owner: solutionDraft.owner,
      goLiveDate: solutionDraft.goLiveDate,
      status: solutionDraft.status,
    });
  }, [solutionDraft, solutionBaseForm]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [solutionList, tenantList, appList] = await Promise.all([
        solutionApi.list(),
        tenantApi.list(),
        solutionCatalogApi.list(),
      ]);
      setSolutions(solutionList || []);
      setTenants(tenantList || []);
      setCatalogApps(appList || []);
    } catch (error) {
      message.error(getErrorMessage(error, '加载解决方案数据失败'));
    } finally {
      setLoading(false);
    }
  }

  async function openSolutionDrawer(id) {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await solutionApi.detail(id);
      setSolutionDraft(detail);
    } catch (error) {
      message.error(getErrorMessage(error, '加载方案详情失败'));
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshSolutionDetail(id = solutionDraft?.id) {
    if (!id) return;
    const detail = await solutionApi.detail(id);
    setSolutionDraft(detail);
  }

  function openTenantModal(record = null) {
    setTenantEditing(record);
    setTenantModalOpen(true);
    tenantForm.setFieldsValue({
      tenantCode: record?.tenantCode,
      name: record?.name,
      contactName: record?.contactName,
      contactPhone: record?.contactPhone,
      industry: record?.industry,
      status: record?.status || 'ACTIVE',
      remark: record?.remark,
    });
  }

  function openAppModal(record = null) {
    setAppEditing(record);
    setAppModalOpen(true);
    appForm.setFieldsValue({
      appCode: record?.appCode,
      name: record?.name,
      category: record?.category,
      description: record?.description,
      icon: record?.icon,
      status: record?.status || 'ACTIVE',
    });
  }

  function openCreateSolution() {
    solutionCreateForm.resetFields();
    solutionCreateForm.setFieldsValue({ status: 'DRAFT' });
    setSolutionCreateOpen(true);
  }

  async function handleSaveTenant() {
    try {
      const values = await tenantForm.validateFields();
      if (tenantEditing) {
        await tenantApi.update(tenantEditing.id, values);
        message.success('租户已更新');
      } else {
        await tenantApi.create(values);
        message.success('租户已创建');
      }
      setTenantModalOpen(false);
      setTenantEditing(null);
      tenantForm.resetFields();
      await loadAllData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  async function handleSaveCatalogApp() {
    try {
      const values = await appForm.validateFields();
      if (appEditing) {
        await solutionCatalogApi.update(appEditing.id, values);
        message.success('应用目录已更新');
      } else {
        await solutionCatalogApi.create(values);
        message.success('应用目录已创建');
      }
      setAppModalOpen(false);
      setAppEditing(null);
      appForm.resetFields();
      await loadAllData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  async function handleCreateSolution() {
    try {
      const values = await solutionCreateForm.validateFields();
      const detail = await solutionApi.create(toSolutionPayload(values, 'DRAFT'));
      message.success('解决方案已创建');
      setSolutionCreateOpen(false);
      solutionCreateForm.resetFields();
      await loadAllData();
      setSolutionDraft(detail);
      setDrawerOpen(true);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  async function handleSaveSolutionBase(statusOverride) {
    if (!solutionDraft?.id) return;
    try {
      const values = await solutionBaseForm.validateFields();
      const detail = await solutionApi.update(solutionDraft.id, toSolutionPayload(values, statusOverride));
      setSolutionDraft(detail);
      await loadAllData();
      message.success(statusOverride ? '方案状态已更新' : '方案基础信息已保存');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  async function handleDeleteSolution(id) {
    try {
      await solutionApi.remove(id);
      if (solutionDraft?.id === id) {
        setDrawerOpen(false);
        setSolutionDraft(null);
      }
      await loadAllData();
      message.success('方案已删除');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleQuickSolutionStatus(id, status) {
    try {
      await solutionApi.update(id, { status });
      await loadAllData();
      if (solutionDraft?.id === id) {
        await refreshSolutionDetail(id);
      }
      message.success(status === 'ACTIVE' ? '方案已激活' : '方案已停用');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleDeleteTenant(id) {
    try {
      await tenantApi.remove(id);
      await loadAllData();
      message.success('租户已删除');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleDeleteCatalogApp(id) {
    try {
      await solutionCatalogApi.remove(id);
      await loadAllData();
      message.success('应用目录已删除');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  function handleInstalledAppFieldChange(appId, patch) {
    setSolutionDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        installedApps: prev.installedApps.map((item) =>
          item.id === appId ? { ...item, ...patch } : item
        ),
      };
    });
  }

  async function handleSaveInstalledApps() {
    if (!solutionDraft?.id) return;
    try {
      const detail = await solutionApi.updateApps(solutionDraft.id, toAppPayload(solutionDraft.installedApps));
      setSolutionDraft(detail);
      await loadAllData();
      message.success('应用清单已保存');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  async function handleRemoveInstalledApp(appId) {
    if (!solutionDraft?.id) return;
    try {
      const nextApps = (solutionDraft.installedApps || []).filter((item) => item.id !== appId);
      const detail = await solutionApi.updateApps(solutionDraft.id, toAppPayload(nextApps));
      setSolutionDraft(detail);
      await loadAllData();
      message.success('应用已移出方案');
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  function openAddAppsModal() {
    addAppForm.setFieldsValue({ appIds: [] });
    setAddAppModalOpen(true);
  }

  async function handleAddApps() {
    if (!solutionDraft?.id) return;
    try {
      const values = await addAppForm.validateFields();
      const selectedApps = addableCatalogApps.filter((item) => values.appIds.includes(item.id));
      const nextPayload = [
        ...toAppPayload(solutionDraft.installedApps),
        ...selectedApps.map((item, index) => ({
          appId: item.id,
          sortNo: (solutionDraft.installedApps?.length || 0) + index + 1,
          deployStatus: 'TODO',
          installRequired: true,
          remark: '',
        })),
      ];
      const detail = await solutionApi.updateApps(solutionDraft.id, nextPayload);
      setSolutionDraft(detail);
      setAddAppModalOpen(false);
      addAppForm.resetFields();
      await loadAllData();
      message.success('应用已加入方案');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  function openConfigModal(appItem) {
    setConfigEditingApp(appItem);
    setConfigModalOpen(true);
    configForm.setFieldsValue({
      configs: appItem?.configs?.length
        ? appItem.configs.map((item, index) => ({
            ...item,
            sortNo: item.sortNo ?? index + 1,
          }))
        : [emptyConfigRow(1)],
    });
  }

  async function handleSaveConfigs() {
    if (!solutionDraft?.id || !configEditingApp?.id) return;
    try {
      const values = await configForm.validateFields();
      const detail = await solutionApi.updateAppConfigs(
        solutionDraft.id,
        configEditingApp.id,
        values.configs || []
      );
      setSolutionDraft(detail);
      setConfigModalOpen(false);
      setConfigEditingApp(null);
      await loadAllData();
      message.success('应用配置已保存');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    }
  }

  const solutionColumns = [
    {
      title: '解决方案',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <Button type="link" className="solution-name-btn" onClick={() => openSolutionDrawer(record.id)}>
          {record.name}
        </Button>
      ),
    },
    {
      title: '租户',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => renderStatusTag('solution', value),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '应用数',
      dataIndex: 'appCount',
      key: 'appCount',
      width: 90,
    },
    {
      title: '待实施',
      dataIndex: 'pendingAppCount',
      key: 'pendingAppCount',
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openSolutionDrawer(record.id)}>
            管理
          </Button>
          {record.status !== 'ACTIVE' ? (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleQuickSolutionStatus(record.id, 'ACTIVE')}>
              激活
            </Button>
          ) : (
            <Button type="link" size="small" icon={<StopOutlined />} onClick={() => handleQuickSolutionStatus(record.id, 'DISABLED')}>
              停用
            </Button>
          )}
          <Popconfirm
            title="确定删除该解决方案吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteSolution(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tenantColumns = [
    { title: '租户名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '租户编码', dataIndex: 'tenantCode', key: 'tenantCode', width: 160 },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 120, render: (value) => value || '-' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 140, render: (value) => value || '-' },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 140, render: (value) => value || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (value) => renderStatusTag('tenant', value) },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openTenantModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该租户吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteTenant(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const appColumns = [
    { title: '应用名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '应用编码', dataIndex: 'appCode', key: 'appCode', width: 160 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 140, render: (value) => value || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (value) => renderStatusTag('app', value) },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openAppModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该应用目录项吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteCatalogApp(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'solutions',
      label: '方案列表',
      children: (
        <div className="solution-tab-pane">
          <div className="sys-search-card">
            <span className="search-label">方案检索</span>
            <Input
              style={{ width: 220 }}
              allowClear
              placeholder="搜索方案、编码、租户"
              prefix={<SearchOutlined />}
              value={solutionKeyword}
              onChange={(e) => setSolutionKeyword(e.target.value)}
            />
            <Select
              style={{ width: 200 }}
              allowClear
              placeholder="筛选租户"
              options={tenants.map((item) => ({ value: item.id, label: item.name }))}
              value={solutionTenantFilter}
              onChange={setSolutionTenantFilter}
            />
            <Select
              style={{ width: 160 }}
              allowClear
              placeholder="筛选状态"
              options={SOLUTION_STATUS_OPTIONS}
              value={solutionStatusFilter}
              onChange={setSolutionStatusFilter}
            />
            <div className="search-actions">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSolutionKeyword('');
                  setSolutionTenantFilter(undefined);
                  setSolutionStatusFilter(undefined);
                }}
              >
                重置
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSolution}>
                新建方案
              </Button>
            </div>
          </div>
          <div className="sys-table-card">
            <div className="sys-table-toolbar">
              <div className="sys-table-toolbar-left">
                <span style={{ fontSize: 14, fontWeight: 600 }}>租户解决方案绑定清单</span>
              </div>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredSolutions}
              columns={solutionColumns}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 1180 }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'tenants',
      label: '租户管理',
      children: (
        <div className="solution-tab-pane">
          <div className="sys-search-card">
            <span className="search-label">租户检索</span>
            <Input
              style={{ width: 220 }}
              allowClear
              placeholder="搜索租户、编码、联系人"
              prefix={<SearchOutlined />}
              value={tenantKeyword}
              onChange={(e) => setTenantKeyword(e.target.value)}
            />
            <Select
              style={{ width: 160 }}
              allowClear
              placeholder="筛选状态"
              options={TENANT_STATUS_OPTIONS}
              value={tenantStatusFilter}
              onChange={setTenantStatusFilter}
            />
            <div className="search-actions">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setTenantKeyword('');
                  setTenantStatusFilter(undefined);
                }}
              >
                重置
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openTenantModal()}>
                新增租户
              </Button>
            </div>
          </div>
          <div className="sys-table-card">
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredTenants}
              columns={tenantColumns}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 980 }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'catalog',
      label: '应用目录',
      children: (
        <div className="solution-tab-pane">
          <div className="sys-search-card">
            <span className="search-label">应用检索</span>
            <Input
              style={{ width: 220 }}
              allowClear
              placeholder="搜索应用、编码、分类"
              prefix={<SearchOutlined />}
              value={appKeyword}
              onChange={(e) => setAppKeyword(e.target.value)}
            />
            <Select
              style={{ width: 160 }}
              allowClear
              placeholder="筛选状态"
              options={APP_STATUS_OPTIONS}
              value={appStatusFilter}
              onChange={setAppStatusFilter}
            />
            <div className="search-actions">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setAppKeyword('');
                  setAppStatusFilter(undefined);
                }}
              >
                重置
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openAppModal()}>
                新增应用
              </Button>
            </div>
          </div>
          <div className="sys-table-card">
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredCatalogApps}
              columns={appColumns}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 980 }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="sys-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">解决方案管理</span>
          <span className="sys-module-header-subtitle">租户绑定、应用安装与实施配置编排</span>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadAllData}>
            刷新数据
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSolution}>
            新建方案
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="solution-summary-grid">
          <div className="solution-summary-card">
            <div className="solution-summary-label">租户总数</div>
            <div className="solution-summary-value">{solutionSummary.tenantCount}</div>
            <div className="solution-summary-hint">维护真实 tenant 主数据</div>
          </div>
          <div className="solution-summary-card">
            <div className="solution-summary-label">解决方案数</div>
            <div className="solution-summary-value">{solutionSummary.solutionCount}</div>
            <div className="solution-summary-hint">一租户最多绑定一套方案</div>
          </div>
          <div className="solution-summary-card">
            <div className="solution-summary-label">待实施应用数</div>
            <div className="solution-summary-value">{solutionSummary.pendingAppCount}</div>
            <div className="solution-summary-hint">统计非 DONE 的安装应用</div>
          </div>
        </div>

        <div className="solution-tabs-card">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </div>
      </div>

      <Drawer
        title={null}
        open={drawerOpen}
        width={820}
        destroyOnClose
        onClose={() => {
          setDrawerOpen(false);
          setSolutionDraft(null);
        }}
      >
        {detailLoading ? (
          <div className="solution-empty">加载方案详情中...</div>
        ) : solutionDraft ? (
          <>
            <div className="solution-drawer-head">
              <div>
                <div className="solution-drawer-title">{solutionDraft.name}</div>
                <div className="solution-drawer-subtitle">
                  绑定租户：{solutionDraft.tenantName || '-'} · 编码：{solutionDraft.solutionCode || '-'}
                </div>
              </div>
              <div className="solution-status-row">
                {renderStatusTag('solution', solutionDraft.status)}
                <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleSaveSolutionBase('ACTIVE')}>
                  激活
                </Button>
                <Button size="small" icon={<StopOutlined />} onClick={() => handleSaveSolutionBase('DISABLED')}>
                  停用
                </Button>
              </div>
            </div>

            <div className="solution-section">
              <div className="solution-section-header">
                <div>
                  <div className="solution-section-title">方案基础信息</div>
                  <div className="solution-section-desc">维护租户绑定、负责人和上线日期</div>
                </div>
              </div>
              <Form form={solutionBaseForm} layout="vertical">
                <div className="solution-form-grid">
                  <Form.Item label="方案编码" name="solutionCode">
                    <Input placeholder="留空自动生成" />
                  </Form.Item>
                  <Form.Item
                    label="方案名称"
                    name="name"
                    rules={[{ required: true, message: '请输入方案名称' }]}
                  >
                    <Input placeholder="请输入方案名称" />
                  </Form.Item>
                  <Form.Item
                    label="绑定租户"
                    name="tenantId"
                    rules={[{ required: true, message: '请选择租户' }]}
                  >
                    <Select
                      placeholder="请选择租户"
                      options={editableTenantOptions}
                    />
                  </Form.Item>
                  <Form.Item label="方案负责人" name="owner">
                    <Input placeholder="例如：实施负责人 / PM" />
                  </Form.Item>
                  <Form.Item label="计划上线日期" name="goLiveDate">
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                  <Form.Item label="状态" name="status">
                    <Select options={SOLUTION_STATUS_OPTIONS} />
                  </Form.Item>
                  <Form.Item label="方案说明" name="description" style={{ gridColumn: '1 / -1' }}>
                    <TextArea rows={3} placeholder="描述该解决方案的范围、目标和交付说明" />
                  </Form.Item>
                </div>
              </Form>
              <div className="solution-drawer-footer">
                <Button onClick={() => refreshSolutionDetail()}>还原</Button>
                <Button type="primary" onClick={() => handleSaveSolutionBase()}>
                  保存基础信息
                </Button>
              </div>
            </div>

            <div className="solution-section">
              <div className="solution-section-header">
                <div>
                  <div className="solution-section-title">安装应用清单</div>
                  <div className="solution-section-desc">选择需要安装的应用，并维护部署状态与安装要求</div>
                </div>
                <div className="solution-inline-actions">
                  <Button icon={<AppstoreOutlined />} onClick={openAddAppsModal}>
                    添加应用
                  </Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveInstalledApps}>
                    保存应用清单
                  </Button>
                </div>
              </div>

              {(solutionDraft.installedApps || []).length ? (
                <div className="solution-app-list">
                  {solutionDraft.installedApps.map((item, index) => (
                    <div key={item.id || item.appId} className="solution-app-card">
                      <div className="solution-app-card-head">
                        <div className="solution-app-card-title">
                          <Avatar shape="square" size={44} className="solution-app-avatar">
                            {(item.appName || item.appCode || 'A').slice(0, 2)}
                          </Avatar>
                          <div>
                            <div className="solution-app-name">{item.appName}</div>
                            <div className="solution-app-meta">
                              {item.appCode || '-'} · {item.category || '未分类'}
                            </div>
                            <div className="solution-app-desc">{item.description || '暂无应用说明'}</div>
                            <div className="solution-config-count">
                              配置项 {item.configs?.length || 0} 个
                            </div>
                          </div>
                        </div>
                        <div className="solution-status-row">
                          {renderStatusTag('deploy', item.deployStatus)}
                          {item.installRequired ? <Tag color="blue">必装</Tag> : <Tag>可选</Tag>}
                        </div>
                      </div>

                      <div className="solution-app-grid">
                        <div>
                          <div style={{ marginBottom: 6, fontSize: 12, color: '#667085' }}>排序</div>
                          <InputNumber
                            min={1}
                            value={item.sortNo ?? index + 1}
                            onChange={(value) => handleInstalledAppFieldChange(item.id, { sortNo: value ?? index + 1 })}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <div style={{ marginBottom: 6, fontSize: 12, color: '#667085' }}>部署状态</div>
                          <Select
                            value={item.deployStatus}
                            options={DEPLOY_STATUS_OPTIONS}
                            onChange={(value) => handleInstalledAppFieldChange(item.id, { deployStatus: value })}
                          />
                        </div>
                        <div>
                          <div style={{ marginBottom: 6, fontSize: 12, color: '#667085' }}>实施备注</div>
                          <Input
                            value={item.remark}
                            placeholder="例如：依赖第三方证书、需先开通账号"
                            onChange={(e) => handleInstalledAppFieldChange(item.id, { remark: e.target.value })}
                          />
                        </div>
                        <div className="solution-app-actions">
                          <div>
                            <div style={{ marginBottom: 6, fontSize: 12, color: '#667085' }}>必装</div>
                            <Switch
                              checked={Boolean(item.installRequired)}
                              onChange={(checked) => handleInstalledAppFieldChange(item.id, { installRequired: checked })}
                            />
                          </div>
                          <Button onClick={() => openConfigModal(item)}>配置项</Button>
                          <Button danger onClick={() => handleRemoveInstalledApp(item.id)}>
                            移除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="solution-empty">当前方案尚未安装应用，先从应用目录中选择一个或多个应用。</div>
              )}
            </div>
          </>
        ) : null}
      </Drawer>

      <Modal
        title={tenantEditing ? '编辑租户' : '新增租户'}
        open={tenantModalOpen}
        onCancel={() => {
          setTenantModalOpen(false);
          setTenantEditing(null);
        }}
        onOk={handleSaveTenant}
        okText="保存"
        destroyOnClose
        width={720}
      >
        <Form form={tenantForm} layout="vertical" initialValues={{ status: 'ACTIVE' }}>
          <div className="solution-modal-grid">
            <Form.Item label="租户编码" name="tenantCode">
              <Input placeholder="留空自动生成" />
            </Form.Item>
            <Form.Item label="租户名称" name="name" rules={[{ required: true, message: '请输入租户名称' }]}>
              <Input placeholder="请输入租户名称" />
            </Form.Item>
            <Form.Item label="联系人" name="contactName">
              <Input placeholder="联系人姓名" />
            </Form.Item>
            <Form.Item label="联系电话" name="contactPhone">
              <Input placeholder="联系电话" />
            </Form.Item>
            <Form.Item label="所属行业" name="industry">
              <Input placeholder="例如：制造、教育、连锁零售" />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={TENANT_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="备注" name="remark" style={{ gridColumn: '1 / -1' }}>
              <TextArea rows={3} placeholder="租户补充说明" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={appEditing ? '编辑应用目录' : '新增应用目录'}
        open={appModalOpen}
        onCancel={() => {
          setAppModalOpen(false);
          setAppEditing(null);
        }}
        onOk={handleSaveCatalogApp}
        okText="保存"
        destroyOnClose
        width={720}
      >
        <Form form={appForm} layout="vertical" initialValues={{ status: 'ACTIVE' }}>
          <div className="solution-modal-grid">
            <Form.Item label="应用编码" name="appCode">
              <Input placeholder="留空自动生成" />
            </Form.Item>
            <Form.Item label="应用名称" name="name" rules={[{ required: true, message: '请输入应用名称' }]}>
              <Input placeholder="请输入应用名称" />
            </Form.Item>
            <Form.Item label="分类" name="category">
              <Input placeholder="例如：流程、文档、集成、报表" />
            </Form.Item>
            <Form.Item label="图标" name="icon">
              <Input placeholder="图标文本或资源地址" />
            </Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={APP_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="应用说明" name="description" style={{ gridColumn: '1 / -1' }}>
              <TextArea rows={3} placeholder="描述应用能力与使用场景" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="新建解决方案"
        open={solutionCreateOpen}
        onCancel={() => setSolutionCreateOpen(false)}
        onOk={handleCreateSolution}
        okText="创建"
        destroyOnClose
        width={720}
      >
        <Form form={solutionCreateForm} layout="vertical" initialValues={{ status: 'DRAFT' }}>
          <div className="solution-modal-grid">
            <Form.Item label="方案编码" name="solutionCode">
              <Input placeholder="留空自动生成" />
            </Form.Item>
            <Form.Item label="方案名称" name="name" rules={[{ required: true, message: '请输入方案名称' }]}>
              <Input placeholder="请输入方案名称" />
            </Form.Item>
            <Form.Item label="绑定租户" name="tenantId" rules={[{ required: true, message: '请选择租户' }]}>
              <Select placeholder="请选择未绑定的启用租户" options={creatableTenantOptions} />
            </Form.Item>
            <Form.Item label="负责人" name="owner">
              <Input placeholder="方案负责人" />
            </Form.Item>
            <Form.Item label="计划上线日期" name="goLiveDate">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="方案说明" name="description" style={{ gridColumn: '1 / -1' }}>
              <TextArea rows={3} placeholder="输入方案摘要，创建后进入详情页继续配置应用" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="添加应用到方案"
        open={addAppModalOpen}
        onCancel={() => setAddAppModalOpen(false)}
        onOk={handleAddApps}
        okText="加入方案"
        destroyOnClose
        width={760}
      >
        <Form form={addAppForm} layout="vertical">
          <Form.Item
            label="选择应用"
            name="appIds"
            rules={[{ required: true, message: '至少选择一个应用' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              {addableCatalogApps.length ? (
                <div className="solution-add-app-list">
                  {addableCatalogApps.map((item) => (
                    <div key={item.id} className="solution-add-app-item">
                      <Checkbox value={item.id}>
                        <div>
                          <div className="solution-add-app-name">{item.name}</div>
                          <div className="solution-add-app-meta">
                            {item.appCode || '-'} · {item.category || '未分类'}
                          </div>
                          <div className="solution-add-app-desc">{item.description || '暂无说明'}</div>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="solution-empty">没有可加入的启用应用，请先在“应用目录”维护应用。</div>
              )}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={configEditingApp ? `配置应用：${configEditingApp.appName}` : '配置项'}
        open={configModalOpen}
        onCancel={() => {
          setConfigModalOpen(false);
          setConfigEditingApp(null);
        }}
        onOk={handleSaveConfigs}
        okText="保存配置"
        destroyOnClose
        width={980}
      >
        <Form form={configForm} layout="vertical">
          <Form.List name="configs">
            {(fields, { add, remove }) => (
              <>
                <div className="solution-inline-actions" style={{ marginBottom: 16 }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => add(emptyConfigRow(fields.length + 1))}
                  >
                    新增配置项
                  </Button>
                </div>
                <div className="solution-config-list">
                  {fields.length ? fields.map((field, index) => (
                    <div key={field.key} className="solution-config-card">
                      <div className="solution-config-card-head">
                        <div className="solution-config-card-title">配置项 #{index + 1}</div>
                        <Button danger type="link" onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </div>
                      <div className="solution-config-grid">
                        <Form.Item
                          {...field}
                          label="配置 Key"
                          name={[field.name, 'configKey']}
                          rules={[{ required: true, message: '请输入配置 Key' }]}
                        >
                          <Input placeholder="例如：client_id" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label="配置名称"
                          name={[field.name, 'configName']}
                          rules={[{ required: true, message: '请输入配置名称' }]}
                        >
                          <Input placeholder="例如：Client ID" />
                        </Form.Item>
                        <Form.Item {...field} label="值类型" name={[field.name, 'valueType']}>
                          <Select options={CONFIG_VALUE_TYPE_OPTIONS} />
                        </Form.Item>
                        <Form.Item {...field} label="排序" name={[field.name, 'sortNo']}>
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item {...field} label="默认值" name={[field.name, 'defaultValue']}>
                          <Input placeholder="默认值" />
                        </Form.Item>
                        <Form.Item {...field} label="当前值" name={[field.name, 'currentValue']}>
                          <Input placeholder="部署时实际配置值" />
                        </Form.Item>
                        <Form.Item {...field} label="占位提示" name={[field.name, 'placeholder']}>
                          <Input placeholder="输入提示" />
                        </Form.Item>
                        <Form.Item {...field} label="选项 JSON" name={[field.name, 'optionsJson']}>
                          <Input placeholder='例如：["A","B"]' />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label="是否必填"
                          name={[field.name, 'required']}
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                        <Form.Item {...field} label="说明" name={[field.name, 'description']} style={{ gridColumn: '1 / -1' }}>
                          <TextArea rows={2} placeholder="配置项说明、依赖或注意事项" />
                        </Form.Item>
                      </div>
                    </div>
                  )) : (
                    <div className="solution-empty">当前应用还没有配置项，点击“新增配置项”开始维护。</div>
                  )}
                </div>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
