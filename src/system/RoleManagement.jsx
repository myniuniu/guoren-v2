import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  Tag,
  Tooltip,
  Checkbox,
  message,
  Popconfirm,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import './SystemModule.css';

// ====== Mock 数据 ======
let roleIdCounter = 10;
const INIT_ROLES = [
  { id: 1, name: '管理员', code: 'admin', status: 1, orderNum: 1, remark: '系统管理员，拥有全部权限', permissions: ['用户管理', '部门管理', '角色管理', '岗位管理', '流程管理'] },
  { id: 2, name: '部门经理', code: 'dept_manager', status: 1, orderNum: 2, remark: '部门经理，可管理部门内人员', permissions: ['用户管理', '部门管理'] },
  { id: 3, name: '普通用户', code: 'user', status: 1, orderNum: 3, remark: '普通用户，基本操作权限', permissions: ['流程管理'] },
  { id: 4, name: 'HR', code: 'hr', status: 1, orderNum: 4, remark: '人事角色，人员管理权限', permissions: ['用户管理', '部门管理', '岗位管理'] },
  { id: 5, name: '访客', code: 'guest', status: 0, orderNum: 5, remark: '访客角色，仅查看权限', permissions: [] },
];

const ALL_PERMISSIONS = [
  '用户管理',
  '部门管理',
  '角色管理',
  '岗位管理',
  '流程管理',
  '请假管理',
  '审批管理',
  '系统配置',
];

export default function RoleManagement() {
  const [roles, setRoles] = useState(INIT_ROLES);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  // 过滤
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (searchStatus !== undefined && r.status !== searchStatus) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return r.name.includes(kw) || r.code.includes(kw);
      }
      return true;
    });
  }, [roles, searchKeyword, searchStatus]);

  // 统计
  const totalRoles = roles.length;
  const activeRoles = roles.filter((r) => r.status === 1).length;
  const disabledRoles = roles.filter((r) => r.status === 0).length;

  const openCreate = () => {
    setModalMode('create');
    setEditingRole(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalMode('edit');
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      status: record.status,
      orderNum: record.orderNum,
      remark: record.remark,
      permissions: record.permissions,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'edit' && editingRole) {
        setRoles((prev) =>
          prev.map((r) => (r.id === editingRole.id ? { ...r, ...values } : r))
        );
        message.success('角色已更新');
      } else {
        const newRole = { id: ++roleIdCounter, ...values };
        setRoles((prev) => [...prev, newRole]);
        message.success('角色已创建');
      }
      setModalOpen(false);
    } catch (err) {
      // validation error
    }
  };

  const handleDelete = (record) => {
    setRoles((prev) => prev.filter((r) => r.id !== record.id));
    message.success('角色已删除');
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus(undefined);
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '角色编码', dataIndex: 'code', key: 'code', width: 140 },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <Space size={4} wrap>
          {(perms || []).map((p) => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
          {(!perms || perms.length === 0) && <Tag>无权限</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) =>
        s === 1 ? <Tag color="success">正常</Tag> : <Tag color="default">停用</Tag>,
    },
    { title: '排序', dataIndex: 'orderNum', key: 'orderNum', width: 70 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该角色吗？"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="sys-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">角色管理</span>
          <span className="sys-module-header-subtitle">系统角色与权限配置</span>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增角色
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        {/* 统计 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="角色总数" value={totalRoles} prefix={<SafetyCertificateOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="正常" value={activeRoles} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="停用" value={disabledRoles} prefix={<StopOutlined />} valueStyle={{ color: '#999' }} />
            </Card>
          </Col>
        </Row>

        {/* 搜索 */}
        <div className="sys-search-card">
          <span className="search-label">状态</span>
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 120 }}
            value={searchStatus}
            onChange={setSearchStatus}
            options={[
              { value: 1, label: '正常' },
              { value: 0, label: '停用' },
            ]}
          />
          <span className="search-label">关键词</span>
          <Input
            placeholder="角色名称/编码"
            style={{ width: 200 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
          />
          <div className="search-actions">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </div>
        </div>

        {/* 表格 */}
        <div className="sys-table-card">
          <div className="sys-table-toolbar">
            <div className="sys-table-toolbar-left">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增
              </Button>
            </div>
            <div className="sys-table-toolbar-right">
              <Tooltip title="刷新">
                <Button shape="circle" icon={<ReloadOutlined />} />
              </Tooltip>
            </div>
          </div>
          <Table
            rowKey="id"
            dataSource={filteredRoles}
            columns={columns}
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新增角色' : '编辑角色'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
                <Input placeholder="请输入角色编码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue={1}>
                <Select options={[{ value: 1, label: '正常' }, { value: 0, label: '停用' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="orderNum" label="排序" initialValue={0}>
                <Input type="number" placeholder="排序号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="permissions" label="权限分配">
            <Checkbox.Group options={ALL_PERMISSIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
