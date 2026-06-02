import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Popconfirm, message, Modal, Form, Input, Select, Switch, Drawer, Descriptions, Steps, Alert, Empty, Tooltip, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  PauseCircleOutlined, ReloadOutlined, EyeOutlined, RightOutlined,
  SearchOutlined, SwapOutlined, CloudDownloadOutlined, CloudUploadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  mockPipelineApi, mockDataSourceApi, PIPELINE_STATUS_MAP, SYNC_STRATEGY_MAP,
  TARGET_SYSTEM_OPTIONS, TRANSFORM_TYPE_OPTIONS, SOURCE_TYPE_MAP,
} from './api';
import FieldMapping from './FieldMapping';

const MOCK_SOURCE_FIELDS = [
  { name: 'course_name', type: 'VARCHAR(200)' },
  { name: 'start_date', type: 'DATE' },
  { name: 'teacher_id', type: 'BIGINT' },
  { name: 'course_type', type: 'INT' },
  { name: 'update_time', type: 'DATETIME' },
  { name: 'project_title', type: 'VARCHAR(500)' },
  { name: 'project_type', type: 'INT' },
  { name: 'event.data.trainingId', type: 'STRING' },
  { name: 'event.data.title', type: 'STRING' },
];

const MOCK_TARGET_FIELDS = [
  { name: 'courseName', type: 'STRING' },
  { name: 'startDate', type: 'STRING' },
  { name: 'teacherId', type: 'STRING' },
  { name: 'courseType', type: 'STRING' },
  { name: 'updatedAt', type: 'STRING' },
  { name: 'projectName', type: 'STRING' },
  { name: 'projectType', type: 'STRING' },
  { name: 'trainingId', type: 'STRING' },
  { name: 'trainingName', type: 'STRING' },
];

export default function EtlPipeline() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();
  const [dataSources, setDataSources] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockPipelineApi.list(keyword ? { keyword } : {});
      setList(data);
    } catch (e) {
      console.error(e);
      message.error('加载管道列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const loadDataSources = useCallback(async () => {
    try {
      const data = await mockDataSourceApi.list();
      setDataSources(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { load(); loadDataSources(); }, [load, loadDataSources]);

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ syncStrategy: 'incremental', status: 'draft', loadMode: 'upsert' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    form.setFieldsValue({
      ...item,
      extractTable: item.extractConfig?.table,
      extractQuery: item.extractConfig?.query,
      extractEndpoint: item.extractConfig?.endpoint,
      extractEventType: item.extractConfig?.eventType,
      loadTargetTable: item.loadConfig?.targetTable,
      loadMode: item.loadConfig?.mode,
      loadKeyField: item.loadConfig?.keyField,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        extractConfig: {
          table: values.extractTable,
          query: values.extractQuery,
          endpoint: values.extractEndpoint,
          eventType: values.extractEventType,
        },
        loadConfig: {
          targetTable: values.loadTargetTable,
          mode: values.loadMode,
          keyField: values.loadKeyField,
        },
      };
      delete payload.extractTable;
      delete payload.extractQuery;
      delete payload.extractEndpoint;
      delete payload.extractEventType;
      delete payload.loadTargetTable;
      delete payload.loadMode;
      delete payload.loadKeyField;

      if (editItem) {
        await mockPipelineApi.update(editItem.id, payload);
        message.success('已更新');
      } else {
        await mockPipelineApi.create(payload);
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
      await mockPipelineApi.remove(id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleRun = async (id) => {
    try {
      await mockPipelineApi.run(id);
      message.success('已触发同步任务');
      setTimeout(load, 2000);
    } catch (e) {
      message.error('触发失败');
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await mockPipelineApi.toggleSchedule(id, enabled);
      message.success(enabled ? '已启用' : '已禁用');
      load();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const openDetail = async (item) => {
    setDetailItem(item);
    setDrawerOpen(true);
  };

  const currentSourceId = Form.useWatch('sourceId', form);
  const currentSourceType = dataSources.find((d) => d.id === currentSourceId)?.type;
  const currentSyncStrategy = Form.useWatch('syncStrategy', form);

  const columns = [
    {
      title: '管道名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      render: (v, r) => (
        <a onClick={() => openDetail(r)} style={{ fontWeight: 500 }}>{v}</a>
      ),
    },
    {
      title: '数据源',
      dataIndex: 'sourceName',
      width: 160,
      ellipsis: true,
      render: (v, r) => (
        <Space size={4}>
          <Tag color={SOURCE_TYPE_MAP[r.sourceId?.startsWith('ds') ? 'database' : 'database']?.color}>
            {SOURCE_TYPE_MAP[r.sourceId?.startsWith('ds-2') ? 'api' : r.sourceId?.startsWith('ds-3') ? 'event' : 'database']?.label}
          </Tag>
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '目标系统',
      dataIndex: 'targetName',
      width: 120,
    },
    {
      title: '同步策略',
      dataIndex: 'syncStrategy',
      width: 110,
      render: (v) => {
        const meta = SYNC_STRATEGY_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => {
        const meta = PIPELINE_STATUS_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '最近同步',
      width: 170,
      render: (_, r) => (
        <Space size={4}>
          {r.lastSyncStatus && (
            <span className={`pl-status-dot ${r.lastSyncStatus === 'success' ? 'success' : 'failed'}`} />
          )}
          <span style={{ fontSize: 13, color: '#6b7280' }}>{r.lastSyncTime || '-'}</span>
        </Space>
      ),
    },
    {
      title: '调度表达式',
      dataIndex: 'cronExpression',
      width: 140,
      render: (v) => v ? <code style={{ fontSize: 12 }}>{v}</code> : <span style={{ color: '#d1d5db' }}>实时</span>,
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      align: 'center',
      render: (_, row) => (
        <Space size={0} wrap={false}>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)} />
          </Tooltip>
          <Tooltip title="手动运行">
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(row.id)} />
          </Tooltip>
          <Tooltip title={row.status === 'active' ? '禁用调度' : '启用调度'}>
            <Button
              type="link"
              size="small"
              icon={row.status === 'active' ? <PauseCircleOutlined /> : <ThunderboltOutlined />}
              onClick={() => handleToggle(row.id, row.status !== 'active')}
            />
          </Tooltip>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除该管道？" onConfirm={() => handleDelete(row.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="pl-table-toolbar">
        <Space>
          <Input.Search
            placeholder="搜索管道名称"
            allowClear
            style={{ width: 220 }}
            onSearch={setKeyword}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建ETL管道</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1350 }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <Empty description="暂无ETL管道" /> }}
      />

      {/* 新建/编辑管道弹窗 */}
      <Modal
        open={modalOpen}
        title={editItem ? '编辑ETL管道' : '新建ETL管道'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={720}
        destroyOnClose
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div className="pl-editor-section">
            <div className="pl-editor-section-title">基本信息</div>
            <Form.Item name="name" label="管道名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如：教务课程信息同步" />
            </Form.Item>
            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="sourceId" label="数据源" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select
                  placeholder="选择数据源"
                  options={dataSources.map((d) => ({
                    value: d.id,
                    label: `${d.name} (${SOURCE_TYPE_MAP[d.type]?.label})`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="targetType" label="目标系统" rules={[{ required: true }]} style={{ width: 200 }}>
                <Select options={TARGET_SYSTEM_OPTIONS} />
              </Form.Item>
            </Space>
            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="syncStrategy" label="同步策略" rules={[{ required: true }]} style={{ width: 200 }}>
                <Select options={Object.entries(SYNC_STRATEGY_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
              </Form.Item>
              {currentSyncStrategy !== 'realtime' && (
                <Form.Item name="cronExpression" label="Cron 表达式" style={{ flex: 1 }} tooltip="留空则仅手动触发">
                  <Input placeholder="0 0 2 * * ?" />
                </Form.Item>
              )}
            </Space>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} placeholder="管道用途说明" />
            </Form.Item>
          </div>

          {/* Extract 抽取配置 */}
          <div className="pl-editor-section">
            <div className="pl-editor-section-title">
              <CloudDownloadOutlined style={{ color: '#4facfe' }} /> 抽取配置 (Extract)
            </div>
            {currentSourceType === 'database' && (
              <>
                <Form.Item name="extractTable" label="源表名" rules={[{ required: true }]}>
                  <Input placeholder="course_info" />
                </Form.Item>
                <Form.Item name="extractQuery" label="查询SQL" tooltip="支持 ${lastSyncTime} 变量">
                  <Input.TextArea rows={2} placeholder="SELECT * FROM course_info WHERE update_time > ${lastSyncTime}" />
                </Form.Item>
              </>
            )}
            {currentSourceType === 'api' && (
              <>
                <Form.Item name="extractEndpoint" label="接口路径" rules={[{ required: true }]}>
                  <Input placeholder="/projects" />
                </Form.Item>
                <Form.Item name="extractPagination" label="分页方式">
                  <Select options={[{ value: 'none', label: '不分页' }, { value: 'offset', label: 'Offset分页' }, { value: 'cursor', label: '游标分页' }]} />
                </Form.Item>
              </>
            )}
            {currentSourceType === 'event' && (
              <Form.Item name="extractEventType" label="监听事件类型">
                <Input placeholder="training.completed" />
              </Form.Item>
            )}
            {currentSourceType === undefined && (
              <Alert message="请先选择数据源以显示对应抽取配置" type="info" showIcon />
            )}
          </div>

          {/* Load 加载配置 */}
          <div className="pl-editor-section">
            <div className="pl-editor-section-title">
              <CloudUploadOutlined style={{ color: '#43e97b' }} /> 加载配置 (Load)
            </div>
            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="loadTargetTable" label="目标表" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input placeholder="portfolio_course" />
              </Form.Item>
              <Form.Item name="loadMode" label="写入模式" style={{ width: 160 }}>
                <Select options={[{ value: 'upsert', label: 'Upsert（更新插入）' }, { value: 'append', label: 'Append（追加）' }, { value: 'replace', label: 'Replace（替换）' }]} />
              </Form.Item>
            </Space>
            <Form.Item name="loadKeyField" label="主键字段" tooltip="Upsert模式下的唯一键">
              <Input placeholder="course_id" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 管道详情抽屉 */}
      <Drawer
        open={drawerOpen}
        title={detailItem ? `ETL管道 - ${detailItem.name}` : ''}
        onClose={() => { setDrawerOpen(false); setDetailItem(null); }}
        width={800}
        destroyOnClose
      >
        {detailItem && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="数据源">{detailItem.sourceName}</Descriptions.Item>
              <Descriptions.Item label="目标系统">{detailItem.targetName}</Descriptions.Item>
              <Descriptions.Item label="同步策略">
                <Tag color={SYNC_STRATEGY_MAP[detailItem.syncStrategy]?.color}>
                  {SYNC_STRATEGY_MAP[detailItem.syncStrategy]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={PIPELINE_STATUS_MAP[detailItem.status]?.color}>
                  {PIPELINE_STATUS_MAP[detailItem.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="调度表达式">
                {detailItem.cronExpression ? <code>{detailItem.cronExpression}</code> : '实时'}
              </Descriptions.Item>
              <Descriptions.Item label="最近同步">
                <Space size={4}>
                  {detailItem.lastSyncStatus && (
                    <span className={`pl-status-dot ${detailItem.lastSyncStatus}`} />
                  )}
                  {detailItem.lastSyncTime || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{detailItem.description || '-'}</Descriptions.Item>
            </Descriptions>

            {/* ETL 流程可视化 */}
            <div className="etl-flow">
              <div className="etl-step">
                <div className="etl-step-title">
                  <span className="etl-step-icon extract"><CloudDownloadOutlined /></span>
                  抽取 (Extract)
                </div>
                <div className="etl-step-body">
                  {detailItem.extractConfig?.table && <div>源表：<code>{detailItem.extractConfig.table}</code></div>}
                  {detailItem.extractConfig?.query && <div>查询：<code>{detailItem.extractConfig.query}</code></div>}
                  {detailItem.extractConfig?.endpoint && <div>接口：<code>{detailItem.extractConfig.endpoint}</code></div>}
                  {detailItem.extractConfig?.eventType && <div>事件：<code>{detailItem.extractConfig.eventType}</code></div>}
                </div>
              </div>
              <div className="etl-arrow"><RightOutlined /></div>
              <div className="etl-step">
                <div className="etl-step-title">
                  <span className="etl-step-icon transform"><SwapOutlined /></span>
                  转换 (Transform)
                </div>
                <div className="etl-step-body">
                  {detailItem.transformConfig?.rules?.map((r, i) => (
                    <div key={i}>
                      <code>{r.source}</code>
                      {' → '}
                      <Tag color="blue" style={{ fontSize: 11 }}>
                        {TRANSFORM_TYPE_OPTIONS.find((o) => o.value === r.type)?.label || r.type}
                      </Tag>
                      {' → '}
                      <code>{r.target}</code>
                    </div>
                  )) || <div style={{ color: '#9ca3af' }}>无转换规则</div>}
                </div>
              </div>
              <div className="etl-arrow"><RightOutlined /></div>
              <div className="etl-step">
                <div className="etl-step-title">
                  <span className="etl-step-icon load"><CloudUploadOutlined /></span>
                  加载 (Load)
                </div>
                <div className="etl-step-body">
                  {detailItem.loadConfig?.targetTable && <div>目标表：<code>{detailItem.loadConfig.targetTable}</code></div>}
                  {detailItem.loadConfig?.mode && <div>写入模式：<code>{detailItem.loadConfig.mode}</code></div>}
                  {detailItem.loadConfig?.keyField && <div>主键：<code>{detailItem.loadConfig.keyField}</code></div>}
                </div>
              </div>
            </div>

            {/* 字段映射 */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>字段映射</h4>
              <FieldMapping
                pipelineId={detailItem.id}
                sourceFields={MOCK_SOURCE_FIELDS}
                targetFields={MOCK_TARGET_FIELDS}
                editable={true}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
