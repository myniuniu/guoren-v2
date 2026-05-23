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
  Tree,
  message,
  Popconfirm,
  Row,
  Col,
  Card,
  Statistic,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import './SystemModule.css';

// ====== Mock 部门树数据 ======
const DEPT_TREE = [
  { id: 1, name: '总公司', parentId: null, orderNum: 1 },
  { id: 2, name: '技术部', parentId: 1, orderNum: 1 },
  { id: 3, name: '前端组', parentId: 2, orderNum: 1 },
  { id: 4, name: '后端组', parentId: 2, orderNum: 2 },
  { id: 9, name: '测试组', parentId: 2, orderNum: 3 },
  { id: 5, name: '人事部', parentId: 1, orderNum: 2 },
  { id: 6, name: '财务部', parentId: 1, orderNum: 3 },
  { id: 7, name: '市场部', parentId: 1, orderNum: 4 },
  { id: 8, name: '产品部', parentId: 1, orderNum: 5 },
];

// ====== Mock 人员数据 ======
let userIdCounter = 20;
const INIT_USERS = [
  { id: 1, username: 'admin', name: '管理员', dept: '总公司', deptId: 1, phone: '13900000001', email: 'admin@guoren.com', status: 1, role: '管理员', position: '总经理', gender: '男' },
  { id: 2, username: 'wangzong', name: '王总', dept: '总公司', deptId: 1, phone: '13800000001', email: 'wangzong@guoren.com', status: 1, role: '部门经理', position: '副总经理', gender: '男' },
  { id: 3, username: 'zhaogong', name: '赵工', dept: '技术部', deptId: 2, phone: '13800000002', email: 'zhaogong@guoren.com', status: 1, role: '部门经理', position: '技术总监', gender: '男' },
  { id: 4, username: 'zhangsan', name: '张三', dept: '前端组', deptId: 3, phone: '13900000003', email: 'zhangsan@guoren.com', status: 1, role: '普通用户', position: '前端工程师', gender: '男' },
  { id: 5, username: 'liusi', name: '刘四', dept: '前端组', deptId: 3, phone: '13900000004', email: 'liusi@guoren.com', status: 1, role: '普通用户', position: '前端工程师', gender: '女' },
  { id: 6, username: 'zhaoliu', name: '赵六', dept: '后端组', deptId: 4, phone: '13900000005', email: 'zhaoliu@guoren.com', status: 1, role: '管理员', position: '后端工程师', gender: '男' },
  { id: 7, username: 'huangqi', name: '黄七', dept: '后端组', deptId: 4, phone: '13900000006', email: 'huangqi@guoren.com', status: 0, role: '普通用户', position: '后端工程师', gender: '男' },
  { id: 8, username: 'fengce', name: '冯测', dept: '测试组', deptId: 9, phone: '13900000007', email: 'fengce@guoren.com', status: 1, role: '普通用户', position: '测试工程师', gender: '女' },
  { id: 9, username: 'lisi', name: '李四', dept: '人事部', deptId: 5, phone: '13900000008', email: 'lisi@guoren.com', status: 1, role: '部门经理', position: 'HR经理', gender: '女' },
  { id: 10, username: 'chenhr', name: '陈HR', dept: '人事部', deptId: 5, phone: '13900000009', email: 'chenhr@guoren.com', status: 1, role: '普通用户', position: '人事专员', gender: '女' },
  { id: 11, username: 'wangwu', name: '王五', dept: '财务部', deptId: 6, phone: '13900000010', email: 'wangwu@guoren.com', status: 1, role: '普通用户', position: '会计', gender: '男' },
  { id: 12, username: 'sunqi', name: '孙七', dept: '市场部', deptId: 7, phone: '13900000011', email: 'sunqi@guoren.com', status: 0, role: '普通用户', position: '市场专员', gender: '女' },
  { id: 13, username: 'zhouba', name: '周八', dept: '产品部', deptId: 8, phone: '13900000012', email: 'zhouba@guoren.com', status: 1, role: '部门经理', position: '产品经理', gender: '男' },
  { id: 14, username: 'wujing', name: '吴静', dept: '产品部', deptId: 8, phone: '13900000013', email: 'wujing@guoren.com', status: 1, role: '普通用户', position: '产品助理', gender: '女' },
];

const ROLE_OPTIONS = [
  { value: '管理员', label: '管理员' },
  { value: '部门经理', label: '部门经理' },
  { value: '普通用户', label: '普通用户' },
];

// 构建树形结构
function buildDeptTree(list, parentId = null) {
  return list
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((d) => ({
      key: String(d.id),
      title: d.name,
      children: buildDeptTree(list, d.id),
    }));
}

// 获取部门及所有子部门ID
function getDeptAndChildIds(list, deptId) {
  const ids = [deptId];
  const children = list.filter((d) => d.parentId === deptId);
  for (const child of children) {
    ids.push(...getDeptAndChildIds(list, child.id));
  }
  return ids;
}

// 部门名称映射
const DEPT_NAME_MAP = {};
DEPT_TREE.forEach((d) => { DEPT_NAME_MAP[d.id] = d.name; });

// 部门树形选项（用于弹窗选择）
function buildDeptSelectTree(list, parentId = null) {
  return list
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((d) => ({
      value: d.name,
      label: d.name,
      children: buildDeptSelectTree(list, d.id),
    }));
}

const AVATAR_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'];

export default function UserManagement() {
  const [users, setUsers] = useState(INIT_USERS);
  const [selectedDeptId, setSelectedDeptId] = useState(null); // null = 全部
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // 部门树数据
  const treeData = useMemo(() => buildDeptTree(DEPT_TREE), []);

  // 根据选中部门 + 关键词 + 状态过滤
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 部门过滤：选中部门时，包含该部门及所有子部门
      if (selectedDeptId !== null) {
        const allowedDeptIds = getDeptAndChildIds(DEPT_TREE, selectedDeptId);
        if (!allowedDeptIds.includes(u.deptId)) return false;
      }
      // 状态过滤
      if (searchStatus !== undefined && u.status !== searchStatus) return false;
      // 关键词过滤
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return (
          u.name.includes(kw) ||
          u.username.includes(kw) ||
          u.phone.includes(kw) ||
          u.email.includes(kw)
        );
      }
      return true;
    });
  }, [users, selectedDeptId, searchKeyword, searchStatus]);

  // 统计（基于当前过滤）
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 1).length;
  const disabledUsers = users.filter((u) => u.status === 0).length;

  // 当前选中部门名称
  const selectedDeptName = selectedDeptId !== null
    ? DEPT_NAME_MAP[selectedDeptId]
    : '全部';

  // ====== 部门树选择 ======
  const handleTreeSelect = (selectedKeys) => {
    setSelectedDeptId(selectedKeys.length ? Number(selectedKeys[0]) : null);
    setSearchKeyword('');
    setSearchStatus(undefined);
  };

  const handleSelectAll = () => {
    setSelectedDeptId(null);
    setSearchKeyword('');
    setSearchStatus(undefined);
  };

  // ====== 操作 ======
  const openCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    form.resetFields();
    // 如果当前选中了部门，预填
    if (selectedDeptId !== null) {
      form.setFieldsValue({ dept: DEPT_NAME_MAP[selectedDeptId] });
    }
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalMode('edit');
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      dept: record.dept,
      phone: record.phone,
      email: record.email,
      status: record.status,
      role: record.role,
      position: record.position,
      gender: record.gender,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // 根据 dept 名称找到 deptId
      const deptRecord = DEPT_TREE.find((d) => d.name === values.dept);
      const deptId = deptRecord ? deptRecord.id : null;
      if (modalMode === 'edit' && editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...values, deptId } : u))
        );
        message.success('人员已更新');
      } else {
        const newUser = { id: ++userIdCounter, ...values, deptId };
        setUsers((prev) => [...prev, newUser]);
        message.success('人员已创建');
      }
      setModalOpen(false);
    } catch (err) {
      // validation error
    }
  };

  const handleDelete = (record) => {
    setUsers((prev) => prev.filter((u) => u.id !== record.id));
    message.success('人员已删除');
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchStatus(undefined);
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar
            size={32}
            style={{ backgroundColor: AVATAR_COLORS[record.id % AVATAR_COLORS.length], flexShrink: 0 }}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.username}</div>
          </div>
        </Space>
      ),
    },
    { title: '部门', dataIndex: 'dept', key: 'dept', width: 100 },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 110 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 100, render: (r) => <Tag color="blue">{r}</Tag> },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      render: (g) =>
        g === '男' ? <Tag color="blue">男</Tag> : <Tag color="pink">女</Tag>,
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 180, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) =>
        s === 1 ? <Tag color="success">正常</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            修改
          </Button>
          <Popconfirm
            title="确定删除该人员吗？"
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
          <span className="sys-module-header-title">人员管理</span>
          <span className="sys-module-header-subtitle">系统用户与人员信息维护</span>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增人员
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        {/* 统计 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="总人数" value={totalUsers} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="正常" value={activeUsers} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="停用" value={disabledUsers} prefix={<StopOutlined />} valueStyle={{ color: '#999' }} />
            </Card>
          </Col>
        </Row>

        {/* 左树右表布局 */}
        <div className="sys-user-layout">
          {/* 左侧部门树 */}
          <div className="sys-user-tree-panel">
            <div className="sys-user-tree-panel-title">
              <ApartmentOutlined style={{ marginRight: 6 }} />
              部门导航
            </div>
            <div
              className={`sys-user-tree-all ${selectedDeptId === null ? 'sys-user-tree-all-active' : ''}`}
              onClick={handleSelectAll}
            >
              全部
            </div>
            <Tree
              showLine
              defaultExpandAll
              treeData={treeData}
              onSelect={handleTreeSelect}
              selectedKeys={selectedDeptId !== null ? [String(selectedDeptId)] : []}
            />
          </div>

          {/* 右侧用户表格 */}
          <div className="sys-user-table-panel">
            {/* 搜索栏 */}
            <div className="sys-search-card">
              <span className="search-label">当前部门</span>
              <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>{selectedDeptName}</Tag>
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
                placeholder="姓名/用户名/手机号"
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
            <div className="sys-table-card" style={{ marginTop: 16, flex: 1 }}>
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
                dataSource={filteredUsers}
                columns={columns}
                size="middle"
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新增人员' : '编辑人员'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dept" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
                <Select placeholder="请选择部门" options={buildDeptSelectTree(DEPT_TREE)} treeDefaultExpandAll />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="岗位">
                <Input placeholder="请输入岗位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="角色">
                <Select placeholder="请选择角色" options={ROLE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" initialValue="男">
                <Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
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
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
