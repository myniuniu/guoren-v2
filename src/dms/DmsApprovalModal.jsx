import { useState } from 'react';
import { Modal, Input, Button, message, Space, Descriptions, Tag } from 'antd';
import { dmsWorkflowApi, DMS_DOC_TYPE_MAP, DMS_STATUS_MAP } from './api';

const { TextArea } = Input;

/**
 * DMS 审批弹窗（与 src/workflow/ApprovalModal 风格一致，调 dmsWorkflowApi.approve）
 */
export default function DmsApprovalModal({ open, onClose, task, currentUser, onSuccess }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (approved) => {
    if (!task) return;
    setLoading(true);
    try {
      await dmsWorkflowApi.approve({
        taskId: task.taskId,
        approver: currentUser,
        approved,
        comment,
      });
      message.success(approved ? '已同意' : '已拒绝');
      setComment('');
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error('操作失败：' + (err?.response?.data?.message || err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = task?.status
    ? DMS_STATUS_MAP[task.status] || { label: task.status, color: 'default' }
    : null;

  return (
    <Modal
      title="文档审批"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
    >
      {task && (
        <div style={{ marginTop: 12 }}>
          <Descriptions
            size="small"
            column={1}
            bordered
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="文档编号">{task.docNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="文档标题">{task.docTitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="文档类型">
              {DMS_DOC_TYPE_MAP[task.docType] || task.docType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交人">{task.applicant || '-'}</Descriptions.Item>
            <Descriptions.Item label="任务节点">{task.taskName || '-'}</Descriptions.Item>
            {statusInfo && (
              <Descriptions.Item label="当前状态">
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
          <TextArea
            rows={3}
            placeholder="审批意见（选填）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button type="primary" loading={loading} onClick={() => handleApprove(true)}>
              同意
            </Button>
            <Button danger loading={loading} onClick={() => handleApprove(false)}>
              拒绝
            </Button>
            <Button onClick={onClose}>取消</Button>
          </Space>
        </div>
      )}
    </Modal>
  );
}
