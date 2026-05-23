import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Tooltip,
  Badge,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  FileTextOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import LeaveFormModal from './LeaveFormModal';
import ApprovalModal from '../workflow/ApprovalModal';
import ProcessDetailDrawer from './ProcessDetailDrawer';
import { leaveModuleApi } from './api';
import './LeaveModule.css';

const { Text } = Typography;

const LEAVE_TYPE_MAP = {
  sick: { label: '病假', color: 'orange' },
  annual: { label: '年假', color: 'green' },
  personal: { label: '事假', color: 'blue' },
  other: { label: '其他', color: 'default' },
};

const PROCESS_STATUS_CONFIG = {
  填写请假申请: { color: 'processing', icon: <ClockCircleOutlined /> },
  主管审批: { color: 'warning', icon: <AuditOutlined /> },
  HR审批: { color: 'warning', icon: <AuditOutlined /> },
  已通过: { color: 'success', icon: <CheckCircleOutlined /> },
  已拒绝: { color: 'error', icon: <CloseCircleOutlined /> },
  已结束: { color: 'default', icon: <CheckCircleOutlined /> },
};

const DEMO_USERS = [
  // 与系统人员管理模块 INIT_USERS 保持一致
  { id: 'admin', name: '管理员', dept: '总公司', role: '管理员', position: '总经理', group: '' },
  { id: 'wangzong', name: '王总', dept: '总公司', role: '部门经理', position: '副总经理', group: 'managers' },
  { id: 'zhaogong', name: '赵工', dept: '技术部', role: '部门经理', position: '技术总监', group: 'managers' },
  { id: 'zhangsan', name: '张三', dept: '前端组', role: '普通用户', position: '前端工程师', group: '' },
  { id: 'liusi', name: '刘四', dept: '前端组', role: '普通用户', position: '前端工程师', group: '' },
  { id: 'zhaoliu', name: '赵六', dept: '后端组', role: '管理员', position: '后端工程师', group: '' },
  { id: 'huangqi', name: '黄七', dept: '后端组', role: '普通用户', position: '后端工程师', group: '' },
  { id: 'fengce', name: '冯测', dept: '测试组', role: '普通用户', position: '测试工程师', group: '' },
  { id: 'lisi', name: '李四', dept: '人事部', role: '部门经理', position: 'HR经理', group: 'hr' },
  { id: 'chenhr', name: '陈HR', dept: '人事部', role: '普通用户', position: '人事专员', group: 'hr' },
  { id: 'wangwu', name: '王五', dept: '财务部', role: '普通用户', position: '会计', group: '' },
  { id: 'sunqi', name: '孙七', dept: '市场部', role: '普通用户', position: '市场专员', group: '' },
  { id: 'zhouba', name: '周八', dept: '产品部', role: '部门经理', position: '产品经理', group: 'managers' },
  { id: 'wujing', name: '吴静', dept: '产品部', role: '普通用户', position: '产品助理', group: '' },
];

export default function LeaveModule() {
  const [currentUser, setCurrentUser] = useState('zhangsan');
  const [activeTab, setActiveTab] = useState('myLeaves');

  // 数据
  const [drafts, setDrafts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  // 搜索
  const [searchType, setSearchType] = useState();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState({ type: undefined, kw: '' });

  // 弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formInitial, setFormInitial] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);

  const currentUserInfo = DEMO_USERS.find((u) => u.id === currentUser);

  // ============ Data loaders ============
  const loadDrafts = useCallback(async () => {
    try {
      const data = await leaveModuleApi.listDrafts(currentUser);
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error('加载草稿失败：' + err.message);
    }
  }, [currentUser]);

  const loadRequests = useCallback(async () => {
    try {
      const data = await leaveModuleApi.getMyRequests(currentUser);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载我的申请失败', err);
    }
  }, [currentUser]);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const assignee = currentUserInfo?.group || currentUser;
      const data = await leaveModuleApi.getPending(assignee);
      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载待办失败', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentUserInfo]);

  const reloadAll = useCallback(() => {
    loadDrafts();
    loadRequests();
    loadPending();
  }, [loadDrafts, loadRequests, loadPending]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // ============ 表格数据合并：草稿 + 已提交流程 ============
  const myLeaves = useMemo(() => {
    const draftRows = drafts.map((d) => ({
      _key: 'draft:' + d.id,
      _kind: 'draft',
      id: d.id,
      applicant: d.applicant,
      leaveType: d.leaveType,
      startDate: d.startDate,
      endDate: d.endDate,
      days: d.days,
      reason: d.reason,
      status: d.status === 'submitted' ? '已提交' : '草稿',
      processInstanceId: d.processInstanceId,
      createTime: d.createTime,
    }));
    const requestRows = requests
      .filter((r) => !drafts.some((d) => d.processInstanceId === r.processInstanceId))
      .map((r) => ({
        _key: 'pi:' + r.processInstanceId,
        _kind: 'process',
        id: r.processInstanceId,
        applicant: r.applicant,
        leaveType: r.leaveType,
        startDate: r.startDate,
        endDate: r.endDate,
        days: r.days,
        reason: r.reason,
        status: r.status,
        processInstanceId: r.processInstanceId,
      }));
    const merged = [...draftRows, ...requestRows];
    // 同步草稿中已提交的状态显示
    return merged.map((row) => {
      if (row._kind === 'draft' && row.processInstanceId) {
        const live = requests.find((r) => r.processInstanceId === row.processInstanceId);
        if (live) row.status = live.status;
      }
      return row;
    });
  }, [drafts, requests]);

  const filteredLeaves = useMemo(() => {
    const kw = (filter.kw || '').trim();
    return myLeaves.filter((row) => {
      if (filter.type && row.leaveType !== filter.type) return false;
      if (kw && !(row.reason || '').includes(kw)) return false;
      return true;
    });
  }, [myLeaves, filter]);

  // ============ 操作 ============
  const handleSearch = () => setFilter({ type: searchType, kw: searchKeyword });
  const handleReset = () => {
    setSearchType(undefined);
    setSearchKeyword('');
    setFilter({ type: undefined, kw: '' });
  };

  const openCreate = () => {
    setFormMode('create');
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    if (row._kind !== 'draft' || row.status !== '草稿') {
      message.warning('已提交的请假不可编辑');
      return;
    }
    setFormMode('edit');
    setFormInitial(row);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (formMode === 'edit' && formInitial?.id) {
        await leaveModuleApi.updateDraft(formInitial.id, values);
        message.success('草稿已更新');
      } else {
        await leaveModuleApi.createDraft(values);
        message.success('草稿已保存');
      }
      setFormOpen(false);
      loadDrafts();
    } catch (err) {
      message.error('保存失败：' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (row) => {
    if (row._kind !== 'draft' || row.status !== '草稿') {
      message.warning('仅草稿可删除');
      return;
    }
    Modal.confirm({
      title: '删除确认',
      content: `确定要删除该请假草稿吗？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await leaveModuleApi.deleteDraft(row.id);
          message.success('已删除');
          loadDrafts();
        } catch (err) {
          message.error('删除失败：' + err.message);
        }
      },
    });
  };

  const handleSubmitDraft = (row) => {
    Modal.confirm({
      title: '提交流程审批',
      content: `提交后将进入主管审批流程，且无法再编辑。确定提交吗？`,
      okText: '提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await leaveModuleApi.submitDraft(row.id);
          message.success('已提交，进入审批流程');
          reloadAll();
        } catch (err) {
          message.error('提交失败：' + err.message);
        }
      },
    });
  };

  const openDetail = (row) => {
    setDetailRecord(row);
    setDetailOpen(true);
  };

  const handleApprove = (task) => {
    setSelectedTask(task);
    setApprovalOpen(true);
  };

  // ============ 列定义 ============
  const myLeavesColumns = [
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 100,
      render: (t) => {
        const cfg = LEAVE_TYPE_MAP[t] || { label: t, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 110 },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 110 },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 70,
      render: (d) => <Text strong>{d}</Text>,
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '流程状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => {
        if (s === '草稿') return <Tag>草稿</Tag>;
        if (s === '已提交') return <Tag color="processing">已提交</Tag>;
        const cfg = PROCESS_STATUS_CONFIG[s] || { color: 'default', icon: null };
        return (
          <Tag icon={cfg.icon} color={cfg.color}>
            {s}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, row) => {
        const isDraft = row._kind === 'draft' && row.status === '草稿';
        const hasProcess = !!row.processInstanceId;
        return (
          <Space size={4}>
            {hasProcess && (
              <Button
                type="link"
                size="small"
                icon={<FileSearchOutlined />}
                onClick={() => openDetail(row)}
              >
                流程详情
              </Button>
            )}
            {isDraft ? (
              <>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmitDraft(row)}>
                  提交
                </Button>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(row)}>
                  删除
                </Button>
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const pendingColumns = [
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 100,
      render: (t) => {
        const cfg = LEAVE_TYPE_MAP[t] || { label: t, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '天数', dataIndex: 'days', key: 'days', width: 70, render: (d) => <Text strong>{d}</Text> },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '当前节点',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 120,
      render: (n) => {
        const cfg = PROCESS_STATUS_CONFIG[n] || { color: 'warning', icon: <ClockCircleOutlined /> };
        return (
          <Tag icon={cfg.icon} color={cfg.color}>
            {n}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, row) => (
        <Button type="link" onClick={() => handleApprove(row)}>
          审批
        </Button>
      ),
    },
  ];

  // ============ 统计 ============
  const draftCount = drafts.filter((d) => d.status === 'draft').length;
  const inProgressCount = requests.filter(
    (r) => !['已通过', '已拒绝', '已结束'].includes(r.status)
  ).length;
  const approvedCount = requests.filter((r) => r.status === '已通过').length;
  const rejectedCount = requests.filter((r) => r.status === '已拒绝').length;
  const pendingCount = pending.length;

  return (
    <div className="leave-module">
      {/* 顶部 */}
      <div className="leave-module-header">
        <div>
          <span className="leave-module-header-title">请假</span>
          <span className="leave-module-header-subtitle">
            请假申请管理与流程审批
          </span>
        </div>
        <Space>
          <Text type="secondary">当前用户：</Text>
          <Select
            value={currentUser}
            onChange={setCurrentUser}
            style={{ width: 220 }}
            options={DEMO_USERS.map((u) => ({
              value: u.id,
              label: `${u.name}（${u.dept}·${u.role}）`,
            }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建请假
          </Button>
        </Space>
      </div>

      {/* 主体 */}
      <div className="leave-module-body">
        {/* 统计 */}
        <Row gutter={16} className="leave-stats-row">
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="草稿"
                value={draftCount}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="审批中"
                value={inProgressCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已通过"
                value={approvedCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已拒绝"
                value={rejectedCount}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'myLeaves',
              label: (
                <span>
                  <FileTextOutlined /> 我的请假
                </span>
              ),
              children: (
                <>
                  <div className="leave-search-card">
                    <span className="search-label">类型</span>
                    <Select
                      placeholder="全部类型"
                      allowClear
                      style={{ width: 140 }}
                      value={searchType}
                      onChange={setSearchType}
                      options={Object.entries(LEAVE_TYPE_MAP).map(([k, v]) => ({
                        value: k,
                        label: v.label,
                      }))}
                    />
                    <span className="search-label">关键词</span>
                    <Input
                      placeholder="按原因模糊搜索"
                      style={{ width: 220 }}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onPressEnter={handleSearch}
                      allowClear
                    />
                    <div className="search-actions">
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        搜索
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={handleReset}>
                        重置
                      </Button>
                    </div>
                  </div>

                  <div className="leave-table-card" style={{ marginTop: 16 }}>
                    <div className="leave-table-toolbar">
                      <div className="leave-table-toolbar-left">
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                          新增
                        </Button>
                      </div>
                      <div className="leave-table-toolbar-right">
                        <Tooltip title="刷新">
                          <Button shape="circle" icon={<ReloadOutlined />} onClick={reloadAll} />
                        </Tooltip>
                      </div>
                    </div>
                    <Table
                      rowKey="_key"
                      dataSource={filteredLeaves}
                      columns={myLeavesColumns}
                      size="middle"
                      pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    />
                  </div>
                </>
              ),
            },
            {
              key: 'pending',
              label: (
                <span>
                  <Badge count={pendingCount} size="small" offset={[6, -2]}>
                    <AuditOutlined style={{ marginRight: 4 }} />
                  </Badge>
                  待我审批
                </span>
              ),
              children: (
                <div className="leave-table-card">
                  <div className="leave-table-toolbar">
                    <div />
                    <Tooltip title="刷新">
                      <Button shape="circle" icon={<ReloadOutlined />} onClick={loadPending} />
                    </Tooltip>
                  </div>
                  <Table
                    rowKey="taskId"
                    dataSource={pending}
                    columns={pendingColumns}
                    size="middle"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 表单 */}
      <LeaveFormModal
        open={formOpen}
        mode={formMode}
        initial={formInitial}
        currentUser={currentUser}
        users={DEMO_USERS}
        loading={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormOpen(false)}
      />

      {/* 审批 */}
      <ApprovalModal
        open={approvalOpen}
        onClose={() => {
          setApprovalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        currentUser={currentUser}
        onSuccess={reloadAll}
      />

      {/* 流程详情抽屉 */}
      <ProcessDetailDrawer
        open={detailOpen}
        record={detailRecord}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
