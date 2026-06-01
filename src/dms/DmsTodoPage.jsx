import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Space, Tooltip, message, Empty } from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  dmsWorkflowApi,
  DMS_DOC_TYPE_MAP,
  DMS_STATUS_MAP,
} from './api';
import DmsApprovalModal from './DmsApprovalModal';

/**
 * 我的待办（DMS）
 *
 * - 拉取 dmsWorkflowApi.pending(currentUser)
 * - 行操作「审批」→ DmsApprovalModal
 * - 行操作「查看文档」→ 调用父级 onView（在文档库 Tab 弹出抽屉）
 */
export default function DmsTodoPage({ currentUser, refreshFlag, onChanged, onView }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await dmsWorkflowApi.pending(currentUser);
      setRows(list || []);
    } catch (e) {
      message.error('加载待办失败：' + (e?.response?.data?.message || e?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load, refreshFlag]);

  const columns = [
    { title: '文档编号', dataIndex: 'docNo', width: 170, render: (v) => v || '-' },
    {
      title: '文档标题',
      dataIndex: 'docTitle',
      ellipsis: true,
      render: (v, r) =>
        onView ? (
          <a onClick={() => onView({ id: r.docId })}>{v}</a>
        ) : (
          v
        ),
    },
    {
      title: '类型',
      dataIndex: 'docType',
      width: 100,
      render: (v) => (v ? <Tag color="blue">{DMS_DOC_TYPE_MAP[v] || v}</Tag> : '-'),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      width: 110,
      render: (v) => {
        if (!v) return '-';
        const info = DMS_STATUS_MAP[v] || { label: v, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '任务节点', dataIndex: 'taskName', width: 140 },
    { title: '提交人', dataIndex: 'applicant', width: 100, render: (v) => v || '-' },
    { title: '到达时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'op',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {onView && record.docId && (
            <Tooltip title="查看文档">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView({ id: record.docId })}
              />
            </Tooltip>
          )}
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setActiveTask(record);
              setModalOpen(true);
            }}
          >
            审批
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="dms-todo-page">
      <div className="dms-toolbar">
        <div style={{ fontSize: 14, color: '#1f2329' }}>
          当前用户：<strong>{currentUser}</strong>
        </div>
        <div className="dms-toolbar-spacer" />
        <Button icon={<ReloadOutlined />} onClick={load}>
          刷新
        </Button>
      </div>

      <div className="dms-table-wrap">
        <Table
          rowKey="taskId"
          loading={loading}
          dataSource={rows}
          columns={columns}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无待办"
              />
            ),
          }}
        />
      </div>

      <DmsApprovalModal
        open={modalOpen}
        task={activeTask}
        currentUser={currentUser}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          load();
          onChanged?.();
        }}
      />
    </div>
  );
}
