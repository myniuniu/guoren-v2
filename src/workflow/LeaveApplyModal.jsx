import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
} from 'antd';
import { leaveApi } from './api';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LEAVE_TYPES = [
  { value: 'sick', label: '病假' },
  { value: 'annual', label: '年假' },
  { value: 'personal', label: '事假' },
  { value: 'other', label: '其他' },
];

export default function LeaveApplyModal({ open, onClose, currentUser, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const [startDate, endDate] = values.dateRange || [];
      await leaveApi.submit({
        applicant: currentUser,
        leaveType: values.leaveType,
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        days: values.days,
        reason: values.reason,
      });

      message.success('请假申请已提交');
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.message) {
        message.error('提交失败: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="提交请假申请"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>提交</Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="leaveType" label="请假类型" rules={[{ required: true, message: '请选择请假类型' }]}>
          <Select options={LEAVE_TYPES} placeholder="请选择" />
        </Form.Item>
        <Form.Item name="dateRange" label="请假时间" rules={[{ required: true, message: '请选择请假时间' }]}>
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="days" label="请假天数" rules={[{ required: true, message: '请输入请假天数' }]}>
          <InputNumber min={0.5} max={30} step={0.5} style={{ width: '100%' }} placeholder="请输入天数" />
        </Form.Item>
        <Form.Item name="reason" label="请假原因" rules={[{ required: true, message: '请输入请假原因' }]}>
          <TextArea rows={3} placeholder="请输入请假原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
