import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Input,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import ProcessDesignerV2 from '../processV2/ProcessDesignerV2';
import { processConfigApi } from '../processV2/api';
import './ProcessManagement.css';

const processApi = {
  list: () => processConfigApi.list(),
  remove: (processKey) => processConfigApi.remove(processKey),
};

export default function ProcessManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterName, setFilterName] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [v2DesignerRecord, setV2DesignerRecord] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await processApi.list();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error('加载流程列表失败：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const filteredList = useMemo(() => {
    const kw = (filterName || '').trim().toLowerCase();
    if (!kw) return list;
    return list.filter((p) => (p.name || '').toLowerCase().includes(kw));
  }, [list, filterName]);

  const handleSearch = () => setFilterName(searchName);
  const handleReset = () => {
    setSearchName('');
    setFilterName('');
  };

  const openDesignerNew = () => {
    setV2DesignerRecord({});
  };

  const handleDelete = (record) => {
    const key = record.processKey || record.key;
    const displayName = record.name || key;
    const verText = record.latestVersion ? `（v${record.latestVersion}）` : '（草稿）';
    Modal.confirm({
      title: '删除确认',
      content: `确定要删除流程「${displayName}」${verText}吗？该操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await processApi.remove(key);
          message.success('删除成功');
          loadList();
        } catch (err) {
          message.error('删除失败：' + err.message);
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (!selectedKeys.length) {
      message.info('请先选择要删除的流程');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedKeys.length} 个流程吗？该操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await Promise.all(selectedKeys.map((id) => processApi.remove(id)));
          message.success(`已删除 ${selectedKeys.length} 个流程`);
          setSelectedKeys([]);
          loadList();
        } catch (err) {
          message.error('批量删除失败：' + err.message);
        }
      },
    });
  };

  const columns = [
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={record.processKey || record.key}>
          <span style={{ fontWeight: 500 }}>{text || record.processKey}</span>
        </Tooltip>
      ),
    },
    {
      title: '流程标识',
      dataIndex: 'processKey',
      key: 'processKey',
      width: 180,
      align: 'center',
      ellipsis: true,
      render: (text) => <code style={{ color: '#666', fontSize: 12 }}>{text}</code>,
    },
    {
      title: '分组',
      dataIndex: 'processGroup',
      key: 'processGroup',
      width: 120,
      align: 'center',
      render: (text) => <span style={{ color: '#999', fontSize: 12 }}>{text || '-'}</span>,
    },
    {
      title: '版本',
      dataIndex: 'latestVersion',
      key: 'latestVersion',
      width: 90,
      align: 'center',
      render: (v) =>
        v ? (
          <Tag color="green" className="process-version-tag">v{v}</Tag>
        ) : (
          <Tag color="default" className="process-version-tag">草稿</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) =>
        status === 'PUBLISHED' ? (
          <Tag color="success">已发布</Tag>
        ) : (
          <Tag color="processing">草稿</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setV2DesignerRecord(record)}
          >
            修改
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="process-management">
      {/* 顶部 */}
      <div className="process-management-header">
        <div>
          <span className="process-management-header-title">流程管理</span>
          <span className="process-management-header-subtitle">
            管理 BPMN 流程定义，新建、修改与版本部署
          </span>
        </div>
      </div>

      {/* 主体 */}
      <div className="process-management-body">
        {/* 搜索区 */}
        <div className="process-search-card">
          <div className="search-field">
            <span className="search-label">流程名称</span>
            <Input
              placeholder="请输入流程名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 220 }}
            />
          </div>
          <div className="search-actions">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>

        {/* 表格区 */}
        <div className="process-table-card">
          <div className="process-table-toolbar">
            <div className="process-table-toolbar-left">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openDesignerNew}
              >
                新增
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={!selectedKeys.length}
                onClick={handleBatchDelete}
              >
                删除
              </Button>
            </div>
            <div className="process-table-toolbar-right">
              <Tooltip title="刷新">
                <Button
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={loadList}
                />
              </Tooltip>
            </div>
          </div>

          <Table
            rowKey="processKey"
            columns={columns}
            dataSource={filteredList}
            loading={loading}
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
            }}
          />
        </div>
      </div>

      {/* 流程设计器全屏（V2） */}
      {v2DesignerRecord && (
        <ProcessDesignerV2
          record={v2DesignerRecord}
          onClose={() => { setV2DesignerRecord(null); loadList(); }}
        />
      )}
    </div>
  );
}
