import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Tag, Select, Modal, message, Drawer, Descriptions, Timeline, Empty, Tooltip, Badge, Input,
} from 'antd';
import {
  ReloadOutlined, PlayCircleOutlined, StopOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, ExclamationCircleOutlined, FilterOutlined,
} from '@ant-design/icons';
import { mockSyncTaskApi, SYNC_STATUS_MAP, SYNC_STRATEGY_MAP } from './api';

const STATUS_ICON_MAP = {
  running: <SyncOutlined spin style={{ color: '#1677ff' }} />,
  success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  cancelled: <ExclamationCircleOutlined style={{ color: '#8c8c8c' }} />,
  pending: <ClockCircleOutlined style={{ color: '#faad14' }} />,
};

const MOCK_LOGS = {
  'st-1': [
    { time: '2026-05-31 02:00:00', level: 'INFO', message: '开始增量同步任务' },
    { time: '2026-05-31 02:00:01', level: 'INFO', message: '连接数据源教务系统-MySQL成功' },
    { time: '2026-05-31 02:00:02', level: 'INFO', message: '执行查询: SELECT * FROM course_info WHERE update_time > 2026-05-30 02:00:00' },
    { time: '2026-05-31 02:00:05', level: 'INFO', message: '抽取到 128 条记录' },
    { time: '2026-05-31 02:00:06', level: 'INFO', message: '开始字段转换...' },
    { time: '2026-05-31 02:01:30', level: 'INFO', message: '字段转换完成，应用 4 条转换规则' },
    { time: '2026-05-31 02:01:31', level: 'INFO', message: '开始写入目标表 portfolio_course...' },
    { time: '2026-05-31 02:03:24', level: 'INFO', message: 'Upsert 写入完成，影响 128 行' },
    { time: '2026-05-31 02:03:25', level: 'INFO', message: '同步任务完成，耗时 3分25秒' },
  ],
  'st-4': [
    { time: '2026-05-30 04:00:00', level: 'INFO', message: '开始增量同步任务' },
    { time: '2026-05-30 04:00:01', level: 'INFO', message: '尝试连接数据源人事系统-PostgreSQL...' },
    { time: '2026-05-30 04:00:12', level: 'ERROR', message: '连接失败: Connection refused: 192.168.1.20:5432' },
    { time: '2026-05-30 04:00:12', level: 'ERROR', message: '同步任务失败，请检查数据源连接配置' },
  ],
};

export default function SyncTaskList() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockSyncTaskApi.page({ status: statusFilter, page, pageSize: 10 });
      setList(res.list);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id) => {
    try {
      await mockSyncTaskApi.retry(id);
      message.success('已重新触发');
      setTimeout(load, 2000);
    } catch (e) {
      message.error('重试失败');
    }
  };

  const handleCancel = async (id) => {
    Modal.confirm({
      title: '确认取消任务？',
      content: '取消后正在处理的数据将不会回滚',
      okText: '确认取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await mockSyncTaskApi.cancel(id);
          message.success('任务已取消');
          load();
        } catch (e) {
          message.error('取消失败');
        }
      },
    });
  };

  const openDetail = (item) => {
    setDetailItem(item);
    setLogs(MOCK_LOGS[item.id] || [
      { time: item.startTime, level: 'INFO', message: '任务开始执行' },
      { time: item.endTime || new Date().toLocaleString('zh-CN'), level: item.status === 'failed' ? 'ERROR' : 'INFO', message: item.status === 'success' ? `同步完成，共处理 ${item.records} 条记录` : item.error || '任务执行中' },
    ]);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      width: 100,
      render: (v) => <code style={{ fontSize: 12 }}>{v}</code>,
    },
    {
      title: '管道名称',
      dataIndex: 'pipelineName',
      width: 180,
      ellipsis: true,
      render: (v, r) => <a onClick={() => openDetail(r)}>{v}</a>,
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      width: 100,
      render: (v) => {
        const meta = SYNC_STRATEGY_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v) => {
        const meta = SYNC_STATUS_MAP[v];
        return (
          <Space size={4}>
            {STATUS_ICON_MAP[v]}
            <Tag color={meta?.color}>{meta?.label || v}</Tag>
          </Space>
        );
      },
    },
    {
      title: '记录数',
      dataIndex: 'records',
      width: 90,
      align: 'right',
      render: (v) => <span className="st-record-badge">{v?.toLocaleString() || '-'}</span>,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 170,
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 100,
      render: (v, r) => (
        <span style={{ color: r.status === 'running' ? '#1677ff' : '#6b7280' }}>{v}</span>
      ),
    },
    {
      title: '操作',
      width: 150,
      align: 'center',
      render: (_, row) => (
        <Space size={0} wrap={false}>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)} />
          </Tooltip>
          {row.status === 'failed' && (
            <Tooltip title="重试">
              <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRetry(row.id)} />
            </Tooltip>
          )}
          {row.status === 'running' && (
            <Tooltip title="取消任务">
              <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(row.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="pl-table-toolbar">
        <Space>
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            <FilterOutlined /> 筛选
          </span>
          <Select
            placeholder="任务状态"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={Object.entries(SYNC_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage,
        }}
        locale={{ emptyText: <Empty description="暂无同步任务" /> }}
      />

      {/* 任务详情 + 日志 */}
      <Drawer
        open={drawerOpen}
        title={detailItem ? `同步任务 - ${detailItem.pipelineName}` : ''}
        onClose={() => { setDrawerOpen(false); setDetailItem(null); }}
        width={640}
        destroyOnClose
      >
        {detailItem && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="任务ID"><code>{detailItem.id}</code></Descriptions.Item>
              <Descriptions.Item label="管道">{detailItem.pipelineName}</Descriptions.Item>
              <Descriptions.Item label="策略">
                <Tag color={SYNC_STRATEGY_MAP[detailItem.strategy]?.color}>
                  {SYNC_STRATEGY_MAP[detailItem.strategy]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Space size={4}>
                  {STATUS_ICON_MAP[detailItem.status]}
                  <Tag color={SYNC_STATUS_MAP[detailItem.status]?.color}>
                    {SYNC_STATUS_MAP[detailItem.status]?.label}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="记录数">{detailItem.records?.toLocaleString() || '-'}</Descriptions.Item>
              <Descriptions.Item label="耗时">{detailItem.duration}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{detailItem.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{detailItem.endTime || '-'}</Descriptions.Item>
              {detailItem.error && (
                <Descriptions.Item label="错误信息" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{detailItem.error}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 执行日志 */}
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>执行日志</h4>
            <Timeline
              items={logs.map((log, i) => ({
                color: log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'orange' : 'blue',
                children: (
                  <div key={i} style={{ fontSize: 13 }}>
                    <span style={{ color: '#8c8c8c', marginRight: 8, fontSize: 12 }}>{log.time}</span>
                    <Tag
                      color={log.level === 'ERROR' ? 'error' : log.level === 'WARN' ? 'warning' : 'processing'}
                      style={{ fontSize: 11, marginRight: 8 }}
                    >
                      {log.level}
                    </Tag>
                    <span style={{ color: log.level === 'ERROR' ? '#ff4d4f' : '#4b5563' }}>{log.message}</span>
                  </div>
                ),
              }))}
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                {detailItem.status === 'failed' && (
                  <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => { handleRetry(detailItem.id); setDrawerOpen(false); }}>
                    重试
                  </Button>
                )}
                {detailItem.status === 'running' && (
                  <Button danger icon={<StopOutlined />} onClick={() => { handleCancel(detailItem.id); setDrawerOpen(false); }}>
                    取消任务
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
