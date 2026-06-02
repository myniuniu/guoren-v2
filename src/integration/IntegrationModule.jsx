import { useState, useEffect, useCallback } from 'react';
import { Layout, Tabs, Card, Statistic, Space, Badge } from 'antd';
import {
  SwapOutlined, DatabaseOutlined, CloudSyncOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import DataSourceConfig from './DataSourceConfig';
import EtlPipeline from './EtlPipeline';
import SyncTaskList from './SyncTaskList';
import { mockDataSourceApi, mockPipelineApi, mockSyncTaskApi, SYNC_STATUS_MAP } from './api';
import './IntegrationModule.css';

const { Header, Content } = Layout;

export default function IntegrationModule() {
  const [activeTab, setActiveTab] = useState('datasource');
  const [stats, setStats] = useState({ dsTotal: 0, dsConnected: 0, plActive: 0, taskRunning: 0, taskSuccess: 0, taskFailed: 0 });

  const loadStats = useCallback(async () => {
    try {
      const [dsList, plList, taskRes] = await Promise.all([
        mockDataSourceApi.list(),
        mockPipelineApi.list(),
        mockSyncTaskApi.page({ page: 1, pageSize: 100 }),
      ]);
      setStats({
        dsTotal: dsList.length,
        dsConnected: dsList.filter((d) => d.status === 'connected').length,
        plActive: plList.filter((p) => p.status === 'active').length,
        taskRunning: taskRes.list.filter((t) => t.status === 'running').length,
        taskSuccess: taskRes.list.filter((t) => t.status === 'success').length,
        taskFailed: taskRes.list.filter((t) => t.status === 'failed').length,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const tabItems = [
    {
      key: 'datasource',
      label: (
        <span>
          <DatabaseOutlined /> 数据源管理
          {stats.dsTotal > 0 && (
            <Badge count={stats.dsTotal} size="small" style={{ marginLeft: 6 }} />
          )}
        </span>
      ),
      children: <DataSourceConfig />,
    },
    {
      key: 'pipeline',
      label: (
        <span>
          <SwapOutlined /> ETL管道
          {stats.plActive > 0 && (
            <Badge count={stats.plActive} size="small" style={{ marginLeft: 6, backgroundColor: '#52c41a' }} />
          )}
        </span>
      ),
      children: <EtlPipeline />,
    },
    {
      key: 'synctask',
      label: (
        <span>
          <CloudSyncOutlined /> 同步任务
          {stats.taskRunning > 0 && (
            <Badge dot style={{ marginLeft: 6 }} />
          )}
        </span>
      ),
      children: <SyncTaskList />,
    },
  ];

  return (
    <Layout className="integration-module">
      <Header className="intm-header">
        <div className="intm-title">
          <ApartmentOutlined className="intm-title-icon" />
          三方系统对接
        </div>
        <Space>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>配置数据源 → ETL管道 → 自动同步</span>
        </Space>
      </Header>

      <Content className="intm-content">
        {/* 统计概览 */}
        <div className="intm-stats">
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="数据源总数"
              value={stats.dsTotal}
              prefix={<DatabaseOutlined style={{ color: '#4facfe' }} />}
              valueStyle={{ color: '#4facfe' }}
            />
          </Card>
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="已连接"
              value={stats.dsConnected}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="活跃管道"
              value={stats.plActive}
              prefix={<SwapOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="运行中"
              value={stats.taskRunning}
              prefix={<SyncOutlined spin={stats.taskRunning > 0} style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="成功任务"
              value={stats.taskSuccess}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
          <Card size="small" className="intm-stat-card">
            <Statistic
              title="失败任务"
              value={stats.taskFailed}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: stats.taskFailed > 0 ? '#ff4d4f' : '#8c8c8c' }}
            />
          </Card>
        </div>

        {/* Tab 面板 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="intm-tabs"
        />
      </Content>
    </Layout>
  );
}
