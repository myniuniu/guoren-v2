import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Modal, Input, Space, Tag, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import PageDesigner from './PageDesigner';
import PagePreview from './PagePreview';
import { pageApi } from './api';
import './PageDesignerModule.css';

const VIEW_LIST = 'list';
const VIEW_DESIGN = 'design';
const VIEW_PREVIEW = 'preview';

export default function PageDesignerModule() {
  const [view, setView] = useState(VIEW_LIST);
  const [pages, setPages] = useState([]);
  const [current, setCurrent] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');

  const refresh = useCallback(async () => {
    const list = await pageApi.list();
    setPages(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setCreateName('');
    setCreateOpen(true);
  };

  const handleCreateConfirm = async () => {
    const name = createName.trim() || '未命名页面';
    const page = await pageApi.save({
      name,
      schema: pageApi.defaultSchema(),
    });
    setCreateOpen(false);
    setCurrent(page);
    setView(VIEW_DESIGN);
  };

  const handleEdit = (record) => {
    setCurrent(record);
    setView(VIEW_DESIGN);
  };

  const handlePreviewFromList = (record) => {
    setCurrent(record);
    setView(VIEW_PREVIEW);
  };

  const handleRemove = async (record) => {
    await pageApi.remove(record.id);
    message.success('已删除');
    refresh();
  };

  const handleCopy = async (record) => {
    const cloned = await pageApi.save({
      name: `${record.name} 副本`,
      schema: JSON.parse(JSON.stringify(record.schema || {})),
    });
    message.success('已复制');
    refresh();
    return cloned;
  };

  const handleSaveFromDesigner = async (page) => {
    const saved = await pageApi.save(page);
    setCurrent(saved);
    refresh();
  };

  const handlePreviewFromDesigner = async (page) => {
    // 先持久化最新内容，再切到预览
    const saved = await pageApi.save(page);
    setCurrent(saved);
    refresh();
    setView(VIEW_PREVIEW);
  };

  const handleBackToList = () => {
    setView(VIEW_LIST);
    setCurrent(null);
    refresh();
  };

  const handleBackFromPreview = () => {
    // 若是从设计器进入的预览，返回设计器；否则回列表
    if (current) setView(VIEW_DESIGN);
    else setView(VIEW_LIST);
  };

  if (view === VIEW_DESIGN && current) {
    return (
      <PageDesigner
        page={current}
        onSave={handleSaveFromDesigner}
        onPreview={handlePreviewFromDesigner}
        onBack={handleBackToList}
      />
    );
  }

  if (view === VIEW_PREVIEW && current) {
    return (
      <PagePreview
        schema={current.schema}
        name={current.name}
        onBack={handleBackFromPreview}
      />
    );
  }

  const columns = [
    {
      title: '页面名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 220,
      render: (text) => <Tag color="default">{text}</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            设计
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreviewFromList(record)}>
            预览
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>
            复制
          </Button>
          <Popconfirm title="确认删除该页面？" onConfirm={() => handleRemove(record)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="pd-module">
      <div className="pd-header">
        <div className="pd-title">页面设计</div>
        <div className="pd-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建页面
          </Button>
        </div>
      </div>
      <div className="pd-content">
        <div className="pd-list-table">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={pages}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: '暂无页面，点击右上角「新建页面」开始' }}
          />
        </div>
      </div>

      <Modal
        title="新建页面"
        open={createOpen}
        onOk={handleCreateConfirm}
        onCancel={() => setCreateOpen(false)}
        okText="创建并开始设计"
        cancelText="取消"
      >
        <Input
          placeholder="请输入页面名称"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          maxLength={64}
          onPressEnter={handleCreateConfirm}
        />
      </Modal>
    </div>
  );
}
