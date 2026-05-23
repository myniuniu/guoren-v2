import React, { useState } from 'react';
import { Modal, Input, Button, message, Space } from 'antd';
import { leaveApi } from './api';

const { TextArea } = Input;

export default function ApprovalModal({ open, onClose, task, currentUser, onSuccess }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async (approved) => {
    if (!task) return;
    setLoading(true);
    try {
      await leaveApi.approve({
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
      message.error('操作失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="审批操作"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {task && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <p><strong>申请人：</strong>{task.applicant}</p>
            <p><strong>请假类型：</strong>{task.leaveType}</p>
            <p><strong>请假天数：</strong>{task.days}天</p>
            <p><strong>请假原因：</strong>{task.reason}</p>
          </div>
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
