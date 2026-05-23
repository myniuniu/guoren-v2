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
  IdcardOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import './SystemModule.css';

// ====== Mock 数据 ======
let posIdCounter = 10;
const INIT_POSITIONS = [
  { id: 1, name: '总经理', code: 'CEO', dept: '总公司', deptId: 1, level: 1, status: 1, orderNum: 1, remark: '公司最高管理岗位' },
  { id: 2, name: '部门经理', code: 'DEPT_MGR', dept: '技术部', deptId: 2, level: 2, status: 1, orderNum: 2, remark: '部门负责人' },
  { id: 3, name: '前端工程师', code: 'FE_ENG', dept: '前端组', deptId: 3, level: 4, status: 1, orderNum: 3, remark: '前端开发岗位' },
  { id: 4, name: '后端工程师', code: 'BE_ENG', dept: '后端组', deptId: 4, level: 4, status: 1, orderNum: 4, remark: '后端开发岗位' },
  { id: 5, name: 'HR经理', code: 'HR_MGR', dept: '人事部', deptId: 5, level: 2, status: 1, orderNum: 5, remark: '人事部门负责人' },
  { id: 6, name: '会计', code: 'ACCOUNTANT', dept: '财务部', deptId: 6, level: 3, status: 1, orderNum: 6, remark: '财务核算岗位' },
  { id: 7, name: '市场专员', code: 'MKT_SPEC', dept: '市场部', deptId: 7, level: 4, status: 0, orderNum: 7, remark: '市场推广岗位' },
  { id: 8, name: '产品经理', code: 'PM', dept: '产品部', deptId: 8, level: 3, status: 1, orderNum: 8, remark: '产品规划岗位' },
  { id: 9, name: '测试工程师', code: 'QA_ENG', dept: '测试组', deptId: 9, level: 4, status: 1, orderNum: 9, remark: '质量保障岗位' },
];

const DEPT_OPTIONS = [
  { value: '总公司', label: '总公司' },
  { value: '技术部', label: '技术部' },
  { value: '前端组', label: '前端组' },
  { value: '后端组', label: '后端组' },
  { value: '测试组', label: '测试组' },
  { value: '人事部', label: '人事部' },
  { value: '财务部', label: '财务部' },
  { value: '市场部', label: '市场部' },
  { value: '产品部', label: '产品部' },
];

const LEVEL_MAP = {
  1: { label: '高层', color: 'red' },
  2: { label: '中层', color: 'orange' },
  3: { label: '基层', color: 'blue' },
  4: { label: '员工', color: 'default' },
};

export default function PositionManagement() {
  const [positions, setPositions] = useState(INIT_POSITIONS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchDept, setSearchDept] = useState(undefined);
  const [searchStatus, setSearchStatus] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingPos, setEditingPos] = useState(null);
  const [form] = Form.useForm();

  // 过滤
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      if (searchDept && p.dept !== searchDept) return false;
      if (searchStatus !== undefined && p.status !== searchStatus) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        return p.name.includes(kw) || p.code.includes(kw);
      }
      return true;
    });
  }, [positions, searchKeyword, searchDept, searchStatus]);

  // 统计
  const totalPositions = positions.length;
  const activePositions = positions.filter((p) => p.status === 1).length;
  const disabledPositions = positions.filter((p) => p.status === 0).length;

  const openCreate = () => {
    setModalMode('create');
    setEditingPos(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalMode('edit');
    setEditingPos(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      dept: record.dept,
      level: record.level,
      status: record.status,
      orderNum: record.orderNum,
      remark: record.remark,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'edit' && editingPos) {
        setPositions((prev) =>
          prev.map((p) => (p.id === editingPos.id ? { ...p, ...values } : p))
        );
        message.success('岗位已更新');
      } else {
        const newPos = { id: ++posIdCounter, ...values };
        setPositions((prev) => [...prev, newPos]);
        message.success('岗位已创建');
      }
      setModalOpen(false);
    } catch (err) {
      // validation error
    }
  };

  const handleDelete = (record) => {
    setPositions((prev) => prev.filter((p) => p.id !== record.id));
    message.success('岗位已删除');
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchDept(undefined);
    setSearchStatus(undefined);
  };

  const columns = [
    { title: '岗位名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '岗位编码', dataIndex: 'code', key: 'code', width: 130 },
    { title: '所属部门', dataIndex: 'dept', key: 'dept', width: 100 },
    {
      title: '岗位层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (l) => {
        const cfg = LEVEL_MAP[l] || { label: '未知', color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
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
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
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
            title="确定删除该岗位吗？"
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
          <span className="sys-module-header-title">岗位管理</span>
          <span className="sys-module-header-subtitle">组织岗位与职级体系维护</span>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增岗位
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        {/* 统计 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic title="岗位总数" value={totalPositions} prefix={<IdcardOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="正常" value={activePositions} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic title="停用" value={disabledPositions} prefix={<StopOutlined />} valueStyle={{ color: '#999' }} />
            </Card>
          </Col>
        </Row>

        {/* 搜索 */}
        <div className="sys-search-card">
          <span className="search-label">部门</span>
          <Select
            placeholder="全部部门"
            allowClear
            style={{ width: 140 }}
            value={searchDept}
            onChange={setSearchDept}
            options={DEPT_OPTIONS}
          />
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
            placeholder="岗位名称/编码"
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
            dataSource={filteredPositions}
            columns={columns}
            size="middle"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新增岗位' : '编辑岗位'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
                <Input placeholder="请输入岗位名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="岗位编码" rules={[{ required: true, message: '请输入岗位编码' }]}>
                <Input placeholder="请输入岗位编码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dept" label="所属部门" rules={[{ required: true, message: '请选择所属部门' }]}>
                <Select placeholder="请选择部门" options={DEPT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="岗位层级" initialValue={4}>
                <Select
                  options={Object.entries(LEVEL_MAP).map(([k, v]) => ({
                    value: Number(k),
                    label: v.label,
                  }))}
                />
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
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
