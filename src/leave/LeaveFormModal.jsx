import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Button,
} from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LEAVE_TYPES = [
  { value: 'sick', label: '病假' },
  { value: 'annual', label: '年假' },
  { value: 'personal', label: '事假' },
  { value: 'other', label: '其他' },
];

/**
 * 请假表单弹窗（新建/编辑双模式）
 *
 * @param {object} props
 * @param {boolean} props.open - 显示
 * @param {'create'|'edit'} props.mode - 模式
 * @param {object|null} props.initial - 编辑模式下的初始草稿
 * @param {string} props.currentUser - 默认申请人
 * @param {Array} props.users - 用户列表
 * @param {boolean} props.loading
 * @param {(values:object)=>void} props.onSubmit
 * @param {()=>void} props.onCancel
 */
export default function LeaveFormModal({
  open,
  mode = 'create',
  initial = null,
  currentUser,
  users = [],
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      form.setFieldsValue({
        applicant: initial.applicant || currentUser,
        leaveType: initial.leaveType,
        dateRange:
          initial.startDate && initial.endDate
            ? [dayjs(initial.startDate), dayjs(initial.endDate)]
            : null,
        days: initial.days,
        reason: initial.reason,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ applicant: currentUser });
    }
  }, [open, mode, initial, currentUser, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange || [];
      onSubmit?.({
        applicant: values.applicant,
        leaveType: values.leaveType,
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        days: values.days,
        reason: values.reason,
      });
    } catch {
      /* validation failed */
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? '编辑请假草稿' : '新建请假申请'}
      open={open}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="ok" type="primary" loading={loading} onClick={handleOk}>
          {mode === 'edit' ? '保存' : '保存为草稿'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="applicant"
          label="申请人"
          rules={[{ required: true, message: '请选择申请人' }]}
        >
          <Select
            options={users.map((u) => ({
              value: u.id,
              label: `${u.name}（${
                u.role === 'employee' ? '员工' : u.role === 'manager' ? '主管' : 'HR'
              }）`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="leaveType"
          label="请假类型"
          rules={[{ required: true, message: '请选择请假类型' }]}
        >
          <Select options={LEAVE_TYPES} placeholder="请选择" />
        </Form.Item>
        <Form.Item
          name="dateRange"
          label="请假时间"
          rules={[{ required: true, message: '请选择请假时间' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="days"
          label="请假天数"
          rules={[{ required: true, message: '请输入请假天数' }]}
        >
          <InputNumber min={0.5} max={30} step={0.5} style={{ width: '100%' }} placeholder="请输入天数" />
        </Form.Item>
        <Form.Item
          name="reason"
          label="请假原因"
          rules={[{ required: true, message: '请输入请假原因' }]}
        >
          <TextArea rows={3} placeholder="请输入请假原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
