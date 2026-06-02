import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm,
  Tooltip, Empty, InputNumber, Badge, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined,
  DatabaseOutlined, ThunderboltOutlined, LinkOutlined,
  DisconnectOutlined, ReloadOutlined, SyncOutlined,
} from '@ant-design/icons';
import {
  mockDataSourceApi, SOURCE_TYPE_MAP, DB_TYPE_OPTIONS,
} from './api';

const { TextArea } = Input;

const TYPE_ICON_MAP = {
  database: <DatabaseOutlined />,
  api: <ApiOutlined />,
  event: <ThunderboltOutlined />,
};

export default function DataSourceConfig() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [testLoading, setTestLoading] = useState({});
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockDataSourceApi.list();
      setList(data);
    } catch (e) {
      console.error(e);
      message.error('加载数据源列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ type: 'database', dbType: 'mysql', port: 3306, authType: 'none', method: 'GET' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editItem) {
        await mockDataSourceApi.update(editItem.id, values);
        message.success('已更新');
      } else {
        await mockDataSourceApi.create(values);
        message.success('已创建');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e.errorFields) return;
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await mockDataSourceApi.remove(id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleTest = async (id) => {
    setTestLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await mockDataSourceApi.testConnection(id);
      if (res.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接测试失败：${res.message}`);
      }
      load();
    } catch (e) {
      message.error('测试异常');
    } finally {
      setTestLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const currentType = Form.useWatch('type', form);

  return (
    <div>
      <div className="pl-table-toolbar">
        <Space>
          <span style={{ fontSize: 14, color: '#6b7280' }}>已配置 {list.length} 个数据源</span>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增数据源</Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin tip="加载中..." /></div>
      ) : list.length === 0 ? (
        <Empty description="暂无数据源，点击右上角新增" />
      ) : (
        <div className="ds-card-grid">
          {list.map((item) => {
            const typeInfo = SOURCE_TYPE_MAP[item.type];
            return (
              <Card key={item.id} className="ds-card" size="small" styles={{ body: { padding: 16 } }}>
                <div className="ds-card-header">
                  <div className="ds-card-name">
                    <span className={`ds-type-icon ${item.type}`}>
                      {TYPE_ICON_MAP[item.type]}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                </div>
                <div className="ds-card-body">
                  {item.type === 'database' && (
                    <>
                      <div className="ds-card-info">
                        <DatabaseOutlined /> {item.dbType?.toUpperCase()} · {item.host}:{item.port}
                      </div>
                      <div className="ds-card-info">
                        <DatabaseOutlined /> 数据库：{item.database}
                      </div>
                    </>
                  )}
                  {item.type === 'api' && (
                    <>
                      <div className="ds-card-info">
                        <ApiOutlined /> {item.method} {item.apiUrl}
                      </div>
                      <div className="ds-card-info">
                        <ApiOutlined /> 认证：{item.authType === 'bearer' ? 'Bearer Token' : item.authType === 'basic' ? 'Basic Auth' : '无认证'}
                      </div>
                    </>
                  )}
                  {item.type === 'event' && (
                    <>
                      <div className="ds-card-info">
                        <ThunderboltOutlined /> {item.eventBus} · Topic: {item.topic}
                      </div>
                      <div className="ds-card-info">
                        <ThunderboltOutlined /> 消费组：{item.group}
                      </div>
                    </>
                  )}
                  {item.description && (
                    <div className="ds-card-info" style={{ color: '#9ca3af' }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <div className="ds-card-footer">
                  <Space size={4}>
                    <Badge
                      status={item.status === 'connected' ? 'success' : 'error'}
                      text={item.status === 'connected' ? '已连接' : '未连接'}
                    />
                  </Space>
                  <Space size={4}>
                    <Tooltip title="测试连接">
                      <Button
                        type="text"
                        size="small"
                        icon={testLoading[item.id] ? <SyncOutlined spin /> : <LinkOutlined />}
                        onClick={() => handleTest(item.id)}
                        loading={testLoading[item.id]}
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                    </Tooltip>
                    <Popconfirm title="确认删除该数据源？" onConfirm={() => handleDelete(item.id)}>
                      <Tooltip title="删除">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Modal
        open={modalOpen}
        title={editItem ? '编辑数据源' : '新增数据源'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={640}
        destroyOnClose
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div className="ds-form-section">
            <div className="ds-form-section-title">基本信息</div>
            <Form.Item name="name" label="数据源名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如：教务系统-MySQL" />
            </Form.Item>
            <Form.Item name="type" label="对接方式" rules={[{ required: true }]}>
              <Select options={Object.entries(SOURCE_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={2} placeholder="数据源用途说明" />
            </Form.Item>
          </div>

          {currentType === 'database' && (
            <div className="ds-form-section">
              <div className="ds-form-section-title"><DatabaseOutlined /> 数据库连接配置</div>
              <Form.Item name="dbType" label="数据库类型" rules={[{ required: true }]}>
                <Select options={DB_TYPE_OPTIONS} />
              </Form.Item>
              <Space style={{ width: '100%' }} size={12}>
                <Form.Item name="host" label="主机地址" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input placeholder="192.168.1.10" />
                </Form.Item>
                <Form.Item name="port" label="端口" rules={[{ required: true }]} style={{ width: 120 }}>
                  <InputNumber style={{ width: '100%' }} min={1} max={65535} />
                </Form.Item>
              </Space>
              <Form.Item name="database" label="数据库名" rules={[{ required: true }]}>
                <Input placeholder="academic_affairs" />
              </Form.Item>
              <Space style={{ width: '100%' }} size={12}>
                <Form.Item name="username" label="用户名" style={{ flex: 1 }}>
                  <Input placeholder="root" />
                </Form.Item>
                <Form.Item name="password" label="密码" style={{ flex: 1 }}>
                  <Input.Password placeholder="******" />
                </Form.Item>
              </Space>
            </div>
          )}

          {currentType === 'api' && (
            <div className="ds-form-section">
              <div className="ds-form-section-title"><ApiOutlined /> API 接口配置</div>
              <Space style={{ width: '100%' }} size={12}>
                <Form.Item name="method" label="请求方法" rules={[{ required: true }]} style={{ width: 120 }}>
                  <Select options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }]} />
                </Form.Item>
                <Form.Item name="apiUrl" label="接口地址" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input placeholder="https://api.example.com/v1/data" />
                </Form.Item>
              </Space>
              <Form.Item name="authType" label="认证方式">
                <Select options={[{ value: 'none', label: '无认证' }, { value: 'bearer', label: 'Bearer Token' }, { value: 'basic', label: 'Basic Auth' }, { value: 'apikey', label: 'API Key' }]} />
              </Form.Item>
              <Form.Item name="token" label="Token / API Key">
                <Input.Password placeholder="输入认证凭据" />
              </Form.Item>
              <Form.Item name="headers" label="自定义请求头（JSON）">
                <TextArea rows={2} placeholder='{"X-Custom-Header": "value"}' />
              </Form.Item>
            </div>
          )}

          {currentType === 'event' && (
            <div className="ds-form-section">
              <div className="ds-form-section-title"><ThunderboltOutlined /> 事件驱动配置</div>
              <Form.Item name="eventBus" label="消息总线" rules={[{ required: true }]}>
                <Select options={[{ value: 'Kafka', label: 'Apache Kafka' }, { value: 'RabbitMQ', label: 'RabbitMQ' }, { value: 'RocketMQ', label: 'RocketMQ' }, { value: 'Redis', label: 'Redis Stream' }, { value: 'MQTT', label: 'MQTT' }]} />
              </Form.Item>
              <Form.Item name="topic" label="Topic / 队列名" rules={[{ required: true }]}>
                <Input placeholder="teacher-dev-events" />
              </Form.Item>
              <Form.Item name="group" label="消费组" rules={[{ required: true }]}>
                <Input placeholder="portfolio-consumer" />
              </Form.Item>
              <Form.Item name="brokers" label="Broker 地址">
                <Input placeholder="192.168.1.30:9092,192.168.1.31:9092" />
              </Form.Item>
              <Form.Item name="eventFilter" label="事件过滤表达式">
                <TextArea rows={2} placeholder="event.type IN ('training','certificate')" />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
