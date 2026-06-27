import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Modal, Input, Space, Tag, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { pageApi } from './api';
import DesktopServiceNotice from '../shared/DesktopServiceNotice';
import './PageDesignerModule.css';

const AMIS_DESIGNER_URL =
  import.meta.env.VITE_AMIS_DESIGNER_URL || 'http://127.0.0.1:5177';
const CHANNEL = 'amis-designer';

export default function PageDesignerModule() {
  const [pages, setPages] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');

  const refresh = useCallback(async () => {
    const list = await pageApi.list();
    setPages(list);
  }, []);

  useEffect(() => {
    pageApi.seedDashboardPage();
    refresh();
  }, [refresh]);

  // 监听来自果仁设计器新标签页的消息
  useEffect(() => {
    async function handleMessage(e) {
      const data = e?.data;
      if (!data || data.channel !== CHANNEL) return;

      console.log('[pageDesigner] received:', data.type, data.payload);

      if (data.type === 'request-init') {
        // 设计器请求数据：根据 pageId 查找并发送
        const { pageId } = data.payload || {};
        if (pageId) {
          const page = await pageApi.get(pageId);
          console.log('[pageDesigner] page found:', page ? 'yes' : 'no', 'source:', e.source ? 'yes' : 'no');
          if (page && e.source) {
            e.source.postMessage(
              {
                channel: CHANNEL,
                type: 'init',
                payload: { schema: page.schema, name: page.name, pageId: page.id },
              },
              '*'
            );
          }
        }
      } else if (data.type === 'save') {
        // 设计器保存数据
        const { pageId, schema, name } = data.payload || {};
        if (pageId) {
          const existing = await pageApi.get(pageId);
          await pageApi.save({ id: pageId, name, schema, createdAt: existing?.createdAt });
          refresh();
          if (e.source) {
            e.source.postMessage({ channel: CHANNEL, type: 'save-success' }, '*');
          }
          message.success('页面已保存');
        }
      } else if (data.type === 'preview') {
        // 设计器发起预览：保存后打开预览新标签页
        const { pageId, schema, name } = data.payload || {};
        if (pageId) {
          const existing = await pageApi.get(pageId);
          await pageApi.save({ id: pageId, name, schema, createdAt: existing?.createdAt });
          refresh();
          window.open(`${AMIS_DESIGNER_URL}/?mode=preview&pageId=${pageId}`, '_blank');
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
    // 创建后在新标签页打开设计器
    window.open(`${AMIS_DESIGNER_URL}/?mode=editor&pageId=${page.id}`, '_blank');
  };

  const handleEdit = (record) => {
    // 在新标签页打开设计器
    window.open(`${AMIS_DESIGNER_URL}/?mode=editor&pageId=${record.id}`, '_blank');
  };

  const handlePreviewFromList = (record) => {
    // 在新标签页打开预览
    window.open(`${AMIS_DESIGNER_URL}/?mode=preview&pageId=${record.id}`, '_blank');
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
        <DesktopServiceNotice
          title="页面设计器依赖外部 amis 服务"
          serviceName="amis-designer"
          serviceUrl={AMIS_DESIGNER_URL}
          extraText="桌面版会继续复用你本地运行的 amis-designer；如果服务未启动，设计和预览窗口将无法打开。"
        />
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
