import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CloseOutlined,
} from '@ant-design/icons';
import './ProcessManagement.css';

const PROCESS_API = '/api/workflow/process';
const DESIGNER_BASE = 'http://localhost:5176';
const DESIGNER_CACHE_BUSTER = '_t=' + Date.now();

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

const processApi = {
  list: () => apiRequest(`${PROCESS_API}/list`),
  remove: (deploymentId) =>
    apiRequest(`${PROCESS_API}/${deploymentId}`, { method: 'DELETE' }),
};

export default function ProcessManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterName, setFilterName] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [designerSrc, setDesignerSrc] = useState('');
  const [designerTitle, setDesignerTitle] = useState('');

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

  // 监听设计器 iframe 的部署完成消息，自动刷新列表
  useEffect(() => {
    const handler = (event) => {
      const data = event.data || {};
      if (data.type === 'process-deployed') {
        loadList();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
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
    setDesignerTitle('新建流程');
    setDesignerSrc(`${DESIGNER_BASE}/designer?${DESIGNER_CACHE_BUSTER}`);
  };

  const openDesignerEdit = (record) => {
    setDesignerTitle(`修改流程：${record.name}`);
    // 优先用 processKey 加载（自动取最新版本）
    const params = new URLSearchParams();
    if (record.key) params.set('processKey', record.key);
    else if (record.deploymentId) params.set('deploymentId', record.deploymentId);
    setDesignerSrc(`${DESIGNER_BASE}/designer?${params.toString()}&${DESIGNER_CACHE_BUSTER}`);
  };

  const closeDesigner = () => {
    setDesignerSrc('');
    setDesignerTitle('');
    loadList();
  };



  const handleDelete = (record) => {
    Modal.confirm({
      title: '删除确认',
      content: `确定要删除流程「${record.name}」（v${record.version}）吗？该操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await processApi.remove(record.deploymentId);
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
        <Tooltip title={record.key}>
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '流程标识',
      dataIndex: 'key',
      key: 'key',
      width: 180,
      align: 'center',
      ellipsis: true,
      render: (text) => <code style={{ color: '#666', fontSize: 12 }}>{text}</code>,
    },
    {
      title: '资源文件',
      dataIndex: 'resourceName',
      key: 'resourceName',
      width: 200,
      align: 'center',
      ellipsis: true,
      render: (text) => <span style={{ color: '#999', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 90,
      align: 'center',
      render: (v) => (
        <Tag color="green" className="process-version-tag">
          v{v}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'suspensionState',
      key: 'suspensionState',
      width: 90,
      align: 'center',
      render: (state) =>
        state === 1 ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag color="default">挂起</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openDesignerEdit(record)}
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
            rowKey="deploymentId"
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

      {/* 设计器全屏 */}
      {designerSrc && (
        <div className="designer-overlay">
          <div className="designer-overlay-header">
            <span className="designer-overlay-title">{designerTitle}</span>
            <Button
              icon={<CloseOutlined />}
              onClick={closeDesigner}
            >
              关闭
            </Button>
          </div>
          <iframe
            src={designerSrc}
            className="designer-overlay-iframe"
            title="流程设计器"
          />
        </div>
      )}
    </div>
  );
}
