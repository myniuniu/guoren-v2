import { useEffect, useState } from 'react';
import { Layout, Button, Table, Space, Popconfirm, message, Modal, Image, Empty, Input, Upload } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileImageOutlined,
  ImportOutlined, ExportOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import { templateApi, triggerDownload } from './api';
import CertificateDesigner from './CertificateDesigner';
import CertificateIssueTest from './CertificateIssueTest';
import './CertificateModule.css';

const { Header, Content } = Layout;

export default function CertificateModule() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState(null); // { id } 或 'new' 进入设计器
  const [previewItem, setPreviewItem] = useState(null);
  const [issueItem, setIssueItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await templateApi.list(keyword ? { keyword } : {});
      setList(data || []);
    } catch (e) {
      console.error(e);
      message.error('加载模版列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!editing) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleDelete = async (id) => {
    try {
      await templateApi.remove(id);
      message.success('已删除');
      load();
    } catch (e) {
      console.error(e);
      message.error('删除失败');
    }
  };

  if (editing) {
    return (
      <CertificateDesigner
        templateId={editing === 'new' ? null : editing}
        onBack={(refresh, newId) => {
          setEditing(null);
          if (newId) setTimeout(() => setEditing(newId), 0);
        }}
      />
    );
  }

  if (issueItem) {
    return <CertificateIssueTest template={issueItem} onBack={() => setIssueItem(null)} />;
  }

  const columns = [
    {
      title: '缩略图',
      dataIndex: 'thumbnail',
      width: 100,
      align: 'center',
      render: (v) => v
        ? <img src={v} alt="thumbnail" className="cm-thumb" />
        : <div className="cm-thumb cm-thumb-empty"><FileImageOutlined /></div>,
    },
    { title: '模版名称', dataIndex: 'name', width: 220, ellipsis: true },
    { title: '标识', dataIndex: 'tplKey', width: 200, ellipsis: true },
    {
      title: '尺寸',
      width: 110,
      align: 'center',
      render: (_, r) => <span style={{ color: '#475569' }}>{r.width || 0} × {r.height || 0}</span>,
    },
    { title: '字段数', dataIndex: 'fieldCount', width: 80, align: 'center' },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      align: 'center',
      render: (_, row) => (
        <Space size={0} wrap={false}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setPreviewItem(row)}>预览</Button>
          <Button type="link" size="small" icon={<ExperimentOutlined />} onClick={() => setIssueItem(row)}>发放</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditing(row.id)}>编辑</Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={async () => {
            try {
              const blob = await templateApi.exportTpl(row.id);
              triggerDownload(blob, `${row.name || 'cert-template'}.json`);
            } catch (e) { message.error('导出失败'); }
          }}>导出</Button>
          <Popconfirm title="确认删除该模版？" onConfirm={() => handleDelete(row.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="cert-module">
      <Header className="cm-header">
        <div className="cm-title">
          <FileImageOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          证书模版管理
        </div>
        <Space>
          <Input.Search
            placeholder="搜索模版名称"
            allowClear
            style={{ width: 240 }}
            onSearch={(v) => { setKeyword(v); }}
          />
          <Upload
            beforeUpload={async (f) => {
              try {
                const t = await templateApi.importTpl(f);
                message.success('导入成功');
                setEditing(t.id);
              } catch (e) { message.error('导入失败'); }
              return false;
            }}
            showUploadList={false}
            accept=".json"
          >
            <Button icon={<ImportOutlined />}>导入 JSON</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>
            新建证书模版
          </Button>
        </Space>
      </Header>
      <Content className="cm-content">
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 1290 }}
          pagination={{ pageSize: 10, showSizeChanger: false, size: 'default' }}
          locale={{
            emptyText: <Empty description="暂无证书模版，点击右上角新建" />,
          }}
        />
      </Content>

      <Modal
        open={!!previewItem}
        title={previewItem?.name}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {previewItem?.thumbnail
          ? <Image src={previewItem.thumbnail} style={{ width: '100%' }} />
          : <Empty description="暂无缩略图" />
        }
      </Modal>
    </Layout>
  );
}
