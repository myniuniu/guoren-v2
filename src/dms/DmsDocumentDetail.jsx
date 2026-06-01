import { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Empty,
  Tabs,
  Table,
  Modal,
  Tooltip,
  message,
  Timeline,
  Alert,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  RollbackOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditFilled,
} from '@ant-design/icons';
import {
  DMS_DOC_TYPE_MAP,
  DMS_STATUS_MAP,
  formatFileSize,
  dmsApi,
  dmsWorkflowApi,
} from './api';

/**
 * DMS 文档详情抽屉（Tabs：基本信息 / 版本历史 / 审批轨迹）
 */
export default function DmsDocumentDetail({
  open,
  onClose,
  data,
  currentUser,
  onEdit,
  onChanged,
}) {
  const [activeKey, setActiveKey] = useState('basic');
  const [versions, setVersions] = useState([]);
  const [versionLoading, setVersionLoading] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const tagList = Array.isArray(data?.tags)
    ? data.tags
    : (data?.tags || '').split(',').filter(Boolean);
  const statusInfo = DMS_STATUS_MAP[data?.status] || { label: data?.status, color: 'default' };

  const loadVersions = useCallback(async () => {
    if (!data?.id) return;
    setVersionLoading(true);
    try {
      const list = await dmsApi.versions(data.id);
      setVersions(list || []);
    } catch {
      message.error('加载版本失败');
    } finally {
      setVersionLoading(false);
    }
  }, [data?.id]);

  const loadHistory = useCallback(async () => {
    if (!data?.id) return;
    setHistoryLoading(true);
    try {
      const h = await dmsWorkflowApi.history(data.id);
      setHistory(h);
    } catch {
      message.error('加载审批历史失败');
    } finally {
      setHistoryLoading(false);
    }
  }, [data?.id]);

  // 切换 Tab 时按需加载
  useEffect(() => {
    if (!open || !data?.id) return;
    if (activeKey === 'versions') loadVersions();
    if (activeKey === 'history') loadHistory();
  }, [open, activeKey, data?.id, loadVersions, loadHistory]);

  // 抽屉关闭时重置
  useEffect(() => {
    if (!open) {
      setActiveKey('basic');
      setVersions([]);
      setHistory(null);
    }
  }, [open]);

  const handleRollback = (record) => {
    Modal.confirm({
      title: `回滚到 v${record.versionNo}？`,
      content: `当前主文件将归档为新版本，v${record.versionNo} 的文件将被设为最新版。`,
      okText: '确认回滚',
      okButtonProps: { type: 'primary' },
      onOk: async () => {
        try {
          await dmsApi.rollback(data.id, record.id, currentUser);
          message.success('已回滚');
          await loadVersions();
          onChanged?.();
        } catch (e) {
          message.error('回滚失败：' + (e?.response?.data?.message || e?.message || ''));
        }
      },
    });
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: '提交审批？',
      content: `文档「${data?.title}」将进入审批流程，提交后不能再次编辑直至流程结束。`,
      okText: '确认提交',
      onOk: async () => {
        setSubmitLoading(true);
        try {
          await dmsWorkflowApi.submit(data.id, currentUser);
          message.success('已提交审批');
          onChanged?.();
        } catch (e) {
          message.error('提交失败：' + (e?.response?.data?.message || e?.message || ''));
        } finally {
          setSubmitLoading(false);
        }
      },
    });
  };

  const versionColumns = [
    { title: '版本', dataIndex: 'versionNo', width: 80, render: (v) => `v${v}` },
    { title: '文件名', dataIndex: 'fileName', ellipsis: true, render: (v) => v || '-' },
    { title: '大小', dataIndex: 'fileSize', width: 100, render: (v) => formatFileSize(v) },
    {
      title: '变更说明',
      dataIndex: 'changeLog',
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#a8acb3' }}>-</span>,
    },
    { title: '操作人', dataIndex: 'createBy', width: 100, render: (v) => v || '-' },
    { title: '时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'op',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="下载">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              disabled={!record.fileUrl}
              onClick={() => window.open(record.fileUrl, '_blank')}
            />
          </Tooltip>
          <Tooltip title="回滚到此版本">
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => handleRollback(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderFile = () => {
    if (!data?.fileUrl) {
      return <Empty description="暂未上传文件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
    return (
      <Space>
        <Button icon={<EyeOutlined />} onClick={() => window.open(data.fileUrl, '_blank')}>
          在新窗口打开
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          href={data.fileUrl}
          download={data.fileName || true}
        >
          下载附件
        </Button>
      </Space>
    );
  };

  const renderHistory = () => {
    if (historyLoading) return <div>加载中...</div>;
    if (!history) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未提交审批" />;
    }
    const logs = history.logs || [];
    const items = logs.map((log, idx) => {
      let icon;
      let color;
      switch (log.actionType) {
        case 'submit':
          icon = <EditFilled />;
          color = 'blue';
          break;
        case 'approve':
          icon = <CheckCircleOutlined />;
          color = 'green';
          break;
        case 'reject':
          icon = <CloseCircleOutlined />;
          color = 'red';
          break;
        case 'pending':
        default:
          icon = <ClockCircleOutlined />;
          color = 'gray';
      }
      return {
        key: idx,
        dot: icon,
        color,
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {log.nodeName} <Tag style={{ marginLeft: 6 }}>{log.action || '-'}</Tag>
            </div>
            <div style={{ color: '#8a8f99', fontSize: 12 }}>
              {log.assignee && <span>处理人：{log.assignee} · </span>}
              {log.time || '-'}
            </div>
            {log.comment && (
              <div
                style={{
                  marginTop: 4,
                  padding: '6px 10px',
                  background: '#f7f8fa',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              >
                {log.comment}
              </div>
            )}
          </div>
        ),
      };
    });
    return (
      <>
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="流程实例">
            {history.processInstanceId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">{history.applicant || '-'}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{history.startTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{history.endTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag>{history.currentStatus || '-'}</Tag>
          </Descriptions.Item>
        </Descriptions>
        <Timeline items={items} />
      </>
    );
  };

  const renderBasic = () => (
    <>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="文档编号">{data.docNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="文档类型">
          {DMS_DOC_TYPE_MAP[data.docType] || data.docType || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="版本">v{data.latestVersion || 1}</Descriptions.Item>
        <Descriptions.Item label="标签">
          {tagList.length === 0 ? '-' : tagList.map((t) => <Tag key={t}>{t}</Tag>)}
        </Descriptions.Item>
        <Descriptions.Item label="文件名">{data.fileName || '-'}</Descriptions.Item>
        <Descriptions.Item label="文件大小">{formatFileSize(data.fileSize)}</Descriptions.Item>
        <Descriptions.Item label="MIME">{data.mime || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建人">{data.createBy || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建部门">{data.createDept || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{data.createTime || '-'}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{data.updateTime || '-'}</Descriptions.Item>
        <Descriptions.Item label="描述">
          {data.description || <span style={{ color: '#a8acb3' }}>无</span>}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>附件</div>
        {renderFile()}
      </div>
    </>
  );

  const isDraft = data?.status === 'DRAFT';
  const isPending = data?.status === 'PENDING';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={data ? data.title : '文档详情'}
      width={720}
      destroyOnHidden
      extra={
        data ? (
          <Space>
            {isDraft && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={submitLoading}
                onClick={handleSubmit}
              >
                提交审批
              </Button>
            )}
            {onEdit && !isPending && (
              <Button icon={<EditOutlined />} onClick={() => onEdit(data)}>
                编辑
              </Button>
            )}
          </Space>
        ) : null
      }
    >
      {!data ? null : (
        <>
          {isPending && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="文档正在审批中，编辑被锁定。审批结果会自动写回状态。"
            />
          )}
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[
              { key: 'basic', label: '基本信息', children: renderBasic() },
              {
                key: 'versions',
                label: '版本历史',
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    loading={versionLoading}
                    dataSource={versions}
                    columns={versionColumns}
                    scroll={{ x: 720 }}
                    pagination={false}
                    locale={{ emptyText: '暂无历史版本' }}
                  />
                ),
              },
              { key: 'history', label: '审批轨迹', children: renderHistory() },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
