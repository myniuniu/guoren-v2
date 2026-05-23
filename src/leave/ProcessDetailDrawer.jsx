import React, { useEffect, useState, useMemo } from 'react';
import {
  Drawer,
  Tabs,
  Tag,
  Empty,
  Spin,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Tooltip,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  PrinterOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { leaveModuleApi } from './api';
import ProcessDiagramModal from './ProcessDiagramModal';
import './ProcessDetailDrawer.css';

const LEAVE_TYPE_OPTIONS = [
  { value: 'sick', label: '病假' },
  { value: 'annual', label: '年假' },
  { value: 'personal', label: '事假' },
  { value: 'other', label: '其他' },
];

const STATUS_TAG_CLASS = (status) => {
  if (!status) return 'pdd-status-tag pdd-status-pending';
  if (status === '已通过') return 'pdd-status-tag pdd-status-approved';
  if (status === '已拒绝') return 'pdd-status-tag pdd-status-rejected';
  if (status === '已结束') return 'pdd-status-tag pdd-status-done';
  return 'pdd-status-tag pdd-status-pending';
};

const STATUS_DISPLAY = (status) => {
  if (!status) return '处理中';
  if (status === '已通过' || status === '已拒绝' || status === '已结束') return status;
  return '处理中';
};

/**
 * 流程详情抽屉
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.record  - 列表行数据（含 processInstanceId / 表单字段）
 * @param {function} props.onClose
 */
export default function ProcessDetailDrawer({ open, record, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [fullscreen, setFullscreen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);

  const pid = record?.processInstanceId;

  useEffect(() => {
    if (!open) return;
    if (!pid) {
      setHistory(null);
      return;
    }
    setLoading(true);
    leaveModuleApi
      .getProcessHistory(pid)
      .then((data) => setHistory(data))
      .catch((err) => {
        console.error('加载流程历史失败', err);
        message.error('加载流程历史失败');
        setHistory(null);
      })
      .finally(() => setLoading(false));
  }, [open, pid]);

  useEffect(() => {
    if (!open) {
      setActiveTab('logs');
      setFullscreen(false);
      setDiagramOpen(false);
    }
  }, [open]);

  const status = history?.currentStatus || record?.status || '处理中';
  const dateRange = useMemo(() => {
    if (!record?.startDate || !record?.endDate) return null;
    return [dayjs(record.startDate), dayjs(record.endDate)];
  }, [record]);

  const drawerWidth = fullscreen ? '100vw' : '90vw';

  const renderHeader = () => (
    <div className="pdd-header">
      <div className="pdd-header-left">
        <span className="pdd-title">请假流程</span>
        <span className={STATUS_TAG_CLASS(status)}>{STATUS_DISPLAY(status)}</span>
      </div>
      <div className="pdd-header-actions">
        <Tooltip title="编辑（占位）">
          <Button type="text" icon={<EditOutlined />} disabled />
        </Tooltip>
        <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
          <Button
            type="text"
            icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => setFullscreen((v) => !v)}
          />
        </Tooltip>
        <Tooltip title="打印">
          <Button type="text" icon={<PrinterOutlined />} onClick={() => window.print()} />
        </Tooltip>
        <Tooltip title="关闭">
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={drawerWidth}
      closable={false}
      title={renderHeader()}
      className="process-detail-drawer"
      styles={{ body: { padding: 0, background: '#fff' } }}
    >
      <div className="pdd-body">
        {/* 左侧：表单 */}
        <div className="pdd-form-pane">
          <Form layout="horizontal" labelCol={{ span: 3 }} wrapperCol={{ span: 20 }} disabled>
            <Form.Item label="请假人">
              <Input value={record?.applicant || ''} placeholder="-" />
            </Form.Item>
            <Form.Item label="日期">
              <DatePicker.RangePicker
                value={dateRange}
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
              />
            </Form.Item>
            <Form.Item label="人员">
              <Select placeholder="请选择" />
            </Form.Item>
            <Form.Item label="签名" />
            <Form.Item label="附件" />
            <Form.Item label="图片" />
            <Form.Item label="流水号">
              <Input value={record?.processInstanceId || ''} placeholder="系统自动生成" />
            </Form.Item>
            <Form.Item label="签名" />
            <Form.Item label="请假类型">
              <Select
                value={record?.leaveType}
                options={LEAVE_TYPE_OPTIONS}
                placeholder="请选择"
              />
            </Form.Item>
            <Form.Item label="天数">
              <InputNumber value={record?.days} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="原因">
              <Input.TextArea
                value={record?.reason || ''}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="-"
              />
            </Form.Item>
          </Form>
        </div>

        {/* 右侧：流程日志 / 评论 */}
        <div className="pdd-side-pane">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarExtraContent={
              activeTab === 'logs' ? (
                <a
                  className="pdd-link-btn"
                  onClick={() => {
                    if (!pid) {
                      message.warning('该记录还未提交流程，无流程图可查看');
                      return;
                    }
                    setDiagramOpen(true);
                  }}
                >
                  查看流程图
                </a>
              ) : null
            }
            items={[
              {
                key: 'logs',
                label: '流程日志',
                children: (
                  <div className="pdd-log-wrapper">
                    {loading ? (
                      <div className="pdd-loading"><Spin /></div>
                    ) : history && history.logs?.length ? (
                      <ProcessLogTimeline logs={history.logs} />
                    ) : (
                      <Empty description="暂无流程日志" />
                    )}
                  </div>
                ),
              },
              {
                key: 'comments',
                label: '评 论',
                children: (
                  <div className="pdd-log-wrapper">
                    {loading ? (
                      <div className="pdd-loading"><Spin /></div>
                    ) : history?.comments?.length ? (
                      <ul className="pdd-comment-list">
                        {history.comments.map((c) => (
                          <li key={c.id} className="pdd-comment-item">
                            <div className="pdd-comment-author">
                              <span className="pdd-comment-name">{c.author || '-'}</span>
                              <span className="pdd-comment-time">{c.time}</span>
                            </div>
                            <div className="pdd-comment-content">{c.content}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty description="暂无评论" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <ProcessDiagramModal
        open={diagramOpen}
        processInstanceId={pid}
        onClose={() => setDiagramOpen(false)}
      />
    </Drawer>
  );
}

/* ================= 时间线 ================= */
function ProcessLogTimeline({ logs }) {
  return (
    <ul className="pdd-timeline">
      {logs.map((log, idx) => {
        const isLast = idx === logs.length - 1;
        return (
          <li key={idx} className={`pdd-timeline-item ${log.placeholder ? 'is-placeholder' : ''}`}>
            <div className="pdd-timeline-rail">
              <NodeDot log={log} />
              {!isLast && <div className={`pdd-timeline-line ${log.completed ? 'is-completed' : 'is-pending'}`} />}
            </div>
            <div className="pdd-timeline-content">
              {log.placeholder ? (
                <div className="pdd-timeline-placeholder">处理中</div>
              ) : (
                <>
                  <div className="pdd-timeline-row">
                    <div className="pdd-timeline-main">
                      <div className="pdd-node-name">{log.nodeName}</div>
                      <div className="pdd-node-assignee">
                        <span>{log.assignee || '-'}</span>
                        {log.action && (
                          <span className={`pdd-action-tag pdd-action-${log.actionType}`}>
                            {log.action}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.time && <div className="pdd-timeline-time">{log.time}</div>}
                  </div>
                  {log.comment && <div className="pdd-node-comment">{log.comment}</div>}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NodeDot({ log }) {
  if (log.placeholder) {
    return <div className="pdd-dot pdd-dot-placeholder" />;
  }
  if (!log.completed) {
    return (
      <div className="pdd-dot pdd-dot-stamp">
        <span className="pdd-stamp-text">系&nbsp;统</span>
      </div>
    );
  }
  if (log.actionType === 'reject') {
    return <CloseCircleFilled className="pdd-dot-icon pdd-dot-reject" />;
  }
  if (log.actionType === 'pending') {
    return <ClockCircleOutlined className="pdd-dot-icon pdd-dot-pending" />;
  }
  return <CheckCircleFilled className="pdd-dot-icon pdd-dot-approve" />;
}
