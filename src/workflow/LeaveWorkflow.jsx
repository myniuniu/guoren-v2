import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Select,
  Space,
  Tabs,
  Typography,
  Badge,
  Tooltip,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  AuditOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import LeaveApplyModal from './LeaveApplyModal';
import ApprovalModal from './ApprovalModal';
import { leaveApi } from './api';
import './LeaveWorkflow.css';

const { Title, Text } = Typography;

const LEAVE_TYPE_MAP = {
  sick: { label: '病假', color: 'orange' },
  annual: { label: '年假', color: 'green' },
  personal: { label: '事假', color: 'blue' },
  other: { label: '其他', color: 'default' },
};

const STATUS_CONFIG = {
  '填写请假申请': { color: 'processing', icon: <ClockCircleOutlined /> },
  '主管审批': { color: 'warning', icon: <AuditOutlined /> },
  'HR审批': { color: 'warning', icon: <AuditOutlined /> },
  '修改请假申请': { color: 'error', icon: <ClockCircleOutlined /> },
  '已通过': { color: 'success', icon: <CheckCircleOutlined /> },
  '已拒绝': { color: 'error', icon: <CloseCircleOutlined /> },
  '已结束': { color: 'default', icon: <CheckCircleOutlined /> },
};

const DEMO_USERS = [
  // 与系统人员/部门/角色/岗位管理模块的 mock 保持一致
  { id: 'zhangsan', name: '张三', dept: '前端组', role: '普通用户', position: '前端工程师', group: '' },
  { id: 'lisi', name: '李四', dept: '人事部', role: '部门经理', position: 'HR经理', group: 'hr' },
  { id: 'wangwu', name: '王五', dept: '财务部', role: '普通用户', position: '会计', group: '' },
  { id: 'zhaoliu', name: '赵六', dept: '后端组', role: '管理员', position: '后端工程师', group: '' },
  { id: 'sunqi', name: '孙七', dept: '市场部', role: '普通用户', position: '市场专员', group: '' },
  { id: 'zhouba', name: '周八', dept: '产品部', role: '部门经理', position: '产品经理', group: 'managers' },
];

export default function LeaveWorkflow({ onBack }) {
  const [currentUser, setCurrentUser] = useState('zhangsan');
  const [applyOpen, setApplyOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myRequests');

  const currentUserInfo = DEMO_USERS.find((u) => u.id === currentUser);

  const loadMyRequests = useCallback(async () => {
    try {
      const data = await leaveApi.getMyRequests(currentUser);
      setMyRequests(data);
    } catch (err) {
      console.error('加载我的申请失败', err);
    }
  }, [currentUser]);

  const loadPendingTasks = useCallback(async () => {
    setLoading(true);
    try {
      const assignee = currentUserInfo?.group || currentUser;
      const data = await leaveApi.getPending(assignee);
      setPendingTasks(data);
    } catch (err) {
      console.error('加载待办任务失败', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentUserInfo]);

  useEffect(() => {
    loadMyRequests();
    loadPendingTasks();
  }, [loadMyRequests, loadPendingTasks]);

  // 切换 tab
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleApproval = (task) => {
    setSelectedTask(task);
    setApprovalOpen(true);
  };

  const myRequestsColumns = [
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 100,
      render: (type) => {
        const config = LEAVE_TYPE_MAP[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 70,
      render: (days) => <Text strong>{days}</Text>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = STATUS_CONFIG[status] || { color: 'default', icon: null };
        return (
          <Tag icon={config.icon} color={config.color}>
            {status}
          </Tag>
        );
      },
    },
  ];

  const pendingColumns = [
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 90,
    },
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 100,
      render: (type) => {
        const config = LEAVE_TYPE_MAP[type] || { label: type, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 70,
      render: (days) => <Text strong>{days}</Text>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '当前节点',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 120,
      render: (name) => {
        const config = STATUS_CONFIG[name] || { color: 'warning', icon: <ClockCircleOutlined /> };
        return (
          <Tag icon={config.icon} color={config.color}>
            {name}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleApproval(record)}>
          审批
        </Button>
      ),
    },
  ];

  const pendingCount = pendingTasks.length;
  const approvedCount = myRequests.filter((r) => r.status === '已通过').length;
  const rejectedCount = myRequests.filter((r) => r.status === '已拒绝').length;

  return (
    <div className="leave-workflow-container">
      {/* 顶部栏 */}
      <div className="leave-workflow-header">
        <div className="leave-workflow-header-left">
          <Button onClick={onBack} style={{ marginRight: 12 }}>← 返回</Button>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              请假流程审批
            </Title>
            <Text type="secondary">Flowable 7.2.0 工作流 Demo</Text>
          </div>
        </div>
        <div className="leave-workflow-header-right">
          <Space>
            <Text>当前用户：</Text>
            <Select
              value={currentUser}
              onChange={setCurrentUser}
              style={{ width: 140 }}
              options={DEMO_USERS.map((u) => ({
                value: u.id,
                label: `${u.name}（${u.role === 'employee' ? '员工' : u.role === 'manager' ? '主管' : 'HR'}）`,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setApplyOpen(true)}
            >
              申请请假
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="leave-workflow-stats">
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="待办任务"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="已通过"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
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

      {/* 内容区 */}
      <Card className="leave-workflow-content" styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="workflow-tabs"
          defaultActiveKey="myRequests"
          items={[
            {
              key: 'myRequests',
              label: (
                <span>
                  <FileTextOutlined /> 我的申请
                </span>
              ),
              children: (
                <div className="workflow-tab-content">
                  <Table
                    dataSource={myRequests}
                    columns={myRequestsColumns}
                    rowKey="processInstanceId"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                  />
                </div>
              ),
            },
            {
              key: 'pendingTasks',
              label: (
                <span>
                  <Badge count={pendingCount} size="small" offset={[6, -2]}>
                    <AuditOutlined style={{ marginRight: 4 }} />
                  </Badge>
                  待办审批
                </span>
              ),
              children: (
                <div className="workflow-tab-content">
                  <Table
                    dataSource={pendingTasks}
                    columns={pendingColumns}
                    rowKey="taskId"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    loading={loading}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 流程说明 */}
      {/* 流程说明 - 始终显示 */}
      <Card className="leave-workflow-info" size="small">
        <Title level={5}>
          <UserSwitchOutlined /> 流程说明
        </Title>
        <div className="leave-workflow-flow-steps">
          <div className="flow-step">
            <div className="flow-step-icon">1</div>
            <Text>员工提交请假申请</Text>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="flow-step-icon">2</div>
            <Text>主管审批</Text>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="flow-step-icon" style={{ background: '#faad14' }}>3</div>
            <Tooltip title={"请假天数>3天时需要HR审批"}>
              <Text>{'HR审批（天数>3天）'}</Text>
            </Tooltip>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="flow-step-icon" style={{ background: '#52c41a' }}>4</div>
            <Text>审批完成</Text>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            Demo角色：张三（员工-提交申请）、李四（主管-审批）、王五（HR-审批）
          </Text>
        </div>
      </Card>

      {/* 弹窗 */}
      <LeaveApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          loadMyRequests();
          loadPendingTasks();
        }}
      />
      <ApprovalModal
        open={approvalOpen}
        onClose={() => {
          setApprovalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        currentUser={currentUser}
        onSuccess={() => {
          loadMyRequests();
          loadPendingTasks();
        }}
      />
    </div>
  );
}
