import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { issueApi } from './api';
import { removeCertificateIssueBatchFromPersonalLibrary } from '../resourceLib/resourceLibStore';

/**
 * 证书发放 - 批次列表（CRUD）
 *
 * Props:
 *  - onCreate(): 进入新建发放表单
 *  - onOpen(batch): 打开批次详情
 */
const STATUS_META = {
  COMPLETED: { color: 'success', text: '已完成' },
  PARTIAL: { color: 'warning', text: '部分成功' },
  FAILED: { color: 'error', text: '失败' },
};

const FORMAT_META = {
  png: 'PNG',
  jpg: 'JPG',
  pdf: 'PDF',
};

const CertificateIssueList = ({ onCreate, onOpen }) => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState(null);
  const [editForm] = Form.useForm();

  const load = async (override = {}) => {
    setLoading(true);
    try {
      const data = await issueApi.pageBatch({
        pageNo: override.pageNo ?? pageNo,
        pageSize: override.pageSize ?? pageSize,
        keyword: override.keyword ?? keyword,
      });
      setList(data?.records || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
      message.error('加载批次列表失败，请确认后端是否启动');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (row) => {
    try {
      await issueApi.removeBatch(row.id);
      removeCertificateIssueBatchFromPersonalLibrary(row.id);
      message.success('已删除');
      load();
    } catch (e) {
      console.error(e);
      message.error('删除失败');
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    editForm.setFieldsValue({ batchName: row.batchName, remark: row.remark });
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await issueApi.updateBatch(editing.id, values);
      message.success('已保存');
      setEditing(null);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '批次名',
      dataIndex: 'batchName',
      key: 'batchName',
      width: 220,
      ellipsis: true,
      render: (v, row) => (
        <a onClick={() => onOpen?.(row)} title={v}>{v}</a>
      ),
    },
    {
      title: '使用模版',
      dataIndex: 'templateName',
      key: 'templateName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 78,
      align: 'center',
      render: (v) => <Tag style={{ marginInlineEnd: 0 }}>{FORMAT_META[v] || (v || '').toUpperCase() || '-'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (v) => {
        const meta = STATUS_META[v] || { color: 'default', text: v || '-' };
        return <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>{meta.text}</Tag>;
      },
    },
    {
      title: '成功 / 总数',
      key: 'count',
      width: 110,
      align: 'center',
      render: (_, row) => `${row.successCount ?? 0} / ${row.totalCount ?? 0}`,
    },
    {
      title: '创建人',
      dataIndex: 'createBy',
      key: 'createBy',
      width: 100,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (v) => (v ? String(v).replace('T', ' ').slice(0, 19) : '-'),
    },
    {
      title: '操作',
      key: 'op',
      width: 200,
      fixed: 'right',
      align: 'center',
      render: (_, row) => (
        <Space size={0} wrap={false}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpen?.(row)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该批次？"
            description="将连同批次内所有明细一起删除"
            onConfirm={() => handleDelete(row)}
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
    <Card
      style={{ margin: 16 }}
      title="证书发放"
      extra={
        <Space>
          <Input
            placeholder="按批次名 / 模版搜索"
            prefix={<SearchOutlined />}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => load({ pageNo: 1 })}
            style={{ width: 240 }}
          />
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={() => load()} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onCreate?.()}>
            新建发放
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1148 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 个批次`,
          onChange: (p, ps) => {
            setPageNo(p);
            setPageSize(ps);
            load({ pageNo: p, pageSize: ps });
          },
        }}
      />

      <Modal
        title="编辑批次"
        open={!!editing}
        onOk={handleSaveEdit}
        onCancel={() => setEditing(null)}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item
            name="batchName"
            label="批次名"
            rules={[{ required: true, message: '请输入批次名' }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={512} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CertificateIssueList;
