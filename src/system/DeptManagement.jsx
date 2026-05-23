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
  TreeSelect,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import './SystemModule.css';

// ====== Mock 数据 ======
let deptIdCounter = 10;
const INIT_DEPTS = [
  { id: 1, name: '总公司', parentId: null, leader: '王总', phone: '13800000001', status: 1, orderNum: 1 },
  { id: 2, name: '技术部', parentId: 1, leader: '赵工', phone: '13800000002', status: 1, orderNum: 1 },
  { id: 3, name: '前端组', parentId: 2, leader: '钱前端', phone: '13800000003', status: 1, orderNum: 1 },
  { id: 4, name: '后端组', parentId: 2, leader: '孙后端', phone: '13800000004', status: 1, orderNum: 2 },
  { id: 5, name: '人事部', parentId: 1, leader: '李人事', phone: '13800000005', status: 1, orderNum: 2 },
  { id: 6, name: '财务部', parentId: 1, leader: '周财务', phone: '13800000006', status: 1, orderNum: 3 },
  { id: 7, name: '市场部', parentId: 1, leader: '吴市场', phone: '13800000007', status: 0, orderNum: 4 },
  { id: 8, name: '产品部', parentId: 1, leader: '郑产品', phone: '13800000008', status: 1, orderNum: 5 },
  { id: 9, name: '测试组', parentId: 2, leader: '冯测试', phone: '13800000009', status: 1, orderNum: 3 },
];

function buildTree(list, parentId = null) {
  return list
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((d) => ({
      key: String(d.id),
      title: d.name,
      children: buildTree(list, d.id),
    }));
}

function getChildrenIds(list, parentId) {
  const ids = [];
  const direct = list.filter((d) => d.parentId === parentId);
  for (const d of direct) {
    ids.push(d.id);
    ids.push(...getChildrenIds(list, d.id));
  }
  return ids;
}

export default function DeptManagement() {
  const [depts, setDepts] = useState(INIT_DEPTS);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [editingDept, setEditingDept] = useState(null);
  const [form] = Form.useForm();

  // 构建树形数据
  const treeData = useMemo(() => buildTree(depts), [depts]);

  // 右侧表格：显示选中部门的子部门
  const displayDepts = useMemo(() => {
    let list = selectedDeptId
      ? depts.filter((d) => d.parentId === selectedDeptId)
      : depts.filter((d) => d.parentId === null);
    if (searchKeyword) {
      list = list.filter((d) => d.name.includes(searchKeyword));
    }
    return list.sort((a, b) => a.orderNum - b.orderNum);
  }, [depts, selectedDeptId, searchKeyword]);

  const selectedDeptName = selectedDeptId
    ? depts.find((d) => d.id === selectedDeptId)?.name
    : '顶级部门';

  // ====== 操作 ======
  const handleSelect = (selectedKeys) => {
    setSelectedDeptId(selectedKeys.length ? Number(selectedKeys[0]) : null);
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingDept(null);
    form.resetFields();
    if (selectedDeptId) {
      form.setFieldsValue({ parentId: selectedDeptId });
    }
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setModalMode('edit');
    setEditingDept(record);
    form.setFieldsValue({
      name: record.name,
      parentId: record.parentId,
      leader: record.leader,
      phone: record.phone,
      status: record.status,
      orderNum: record.orderNum,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'edit' && editingDept) {
        setDepts((prev) =>
          prev.map((d) => (d.id === editingDept.id ? { ...d, ...values } : d))
        );
        message.success('部门已更新');
      } else {
        const newDept = { id: ++deptIdCounter, ...values };
        setDepts((prev) => [...prev, newDept]);
        message.success('部门已创建');
      }
      setModalOpen(false);
    } catch (err) {
      // validation error
    }
  };

  const handleDelete = (record) => {
    const childIds = getChildrenIds(depts, record.id);
    if (childIds.length > 0) {
      message.warning('该部门下存在子部门，无法删除');
      return;
    }
    setDepts((prev) => prev.filter((d) => d.id !== record.id));
    message.success('部门已删除');
  };

  // 上级部门树形选项
  const deptTreeOptions = useMemo(() => {
    const build = (list, parentId = null, excludeId = null) => {
      return list
        .filter((d) => d.parentId === parentId && d.id !== excludeId)
        .map((d) => ({
          value: d.id,
          label: d.name,
          children: build(list, d.id, excludeId),
        }));
    };
    return build(depts, null, modalMode === 'edit' ? editingDept?.id : null);
  }, [depts, modalMode, editingDept]);

  const columns = [
    { title: '部门名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '负责人', dataIndex: 'leader', key: 'leader', width: 100 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s) =>
        s === 1 ? <Tag color="success">正常</Tag> : <Tag color="default">停用</Tag>,
    },
    { title: '排序', dataIndex: 'orderNum', key: 'orderNum', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该部门吗？"
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
          <span className="sys-module-header-title">部门管理</span>
          <span className="sys-module-header-subtitle">组织架构与部门维护</span>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增部门
          </Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="sys-dept-layout">
          {/* 左侧树 */}
          <div className="sys-dept-tree-panel">
            <div className="sys-dept-tree-panel-title">
              <span>组织架构</span>
              <Tooltip title="刷新">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => { setDepts([...INIT_DEPTS]); setSelectedDeptId(null); }}
                />
              </Tooltip>
            </div>
            <Input
              placeholder="搜索部门"
              prefix={<SearchOutlined />}
              allowClear
              style={{ marginBottom: 12 }}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <Tree
              showLine
              defaultExpandAll
              treeData={treeData}
              onSelect={handleSelect}
              selectedKeys={selectedDeptId ? [String(selectedDeptId)] : []}
            />
          </div>

          {/* 右侧表格 */}
          <div className="sys-dept-table-panel">
            <div className="sys-table-toolbar">
              <div className="sys-table-toolbar-left">
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedDeptName} — 子部门列表
                </span>
              </div>
              <div className="sys-table-toolbar-right">
                <Tooltip title="刷新">
                  <Button shape="circle" icon={<ReloadOutlined />} />
                </Tooltip>
              </div>
            </div>
            <Table
              rowKey="id"
              dataSource={displayDepts}
              columns={columns}
              size="middle"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新增部门' : '编辑部门'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="上级部门">
            <TreeSelect
              treeData={deptTreeOptions}
              placeholder="无（顶级部门）"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="leader" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="orderNum" label="排序" initialValue={0}>
            <Input type="number" placeholder="排序号" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select
              options={[
                { value: 1, label: '正常' },
                { value: 0, label: '停用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
