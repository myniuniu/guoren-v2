import React, { useEffect, useState } from 'react';
import {
  Modal, Table, Button, Space, Form, Input, InputNumber, Popconfirm,
  message, Tooltip, Tag, Typography, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, RedoOutlined,
} from '@ant-design/icons';
import { seqApi } from './api.js';

const { Text, Paragraph } = Typography;

const PLACEHOLDER_TIPS = [
  { token: '{yyyy}', desc: '4 位年份，如 2025' },
  { token: '{MM}', desc: '2 位月份，如 05' },
  { token: '{dd}', desc: '2 位日期，如 24' },
  { token: '{yyyyMMdd}', desc: '8 位日期，如 20250524' },
  { token: '{HH}{mm}{ss}', desc: '时分秒（24h）' },
  { token: '{seq}', desc: '当前流水号原值（不补零）' },
  { token: '{seq:0000}', desc: '按宽度补零，如 0001' },
];

const PRESET_PATTERNS = [
  { label: '默认', value: 'CERT-{yyyyMMdd}-{seq:0000}' },
  { label: '年度流水', value: 'CERT-{yyyy}-{seq:00000}' },
  { label: '简短', value: '{yyyyMMdd}{seq:000}' },
  { label: '带前缀', value: 'GR-{yyyy}{MM}-{seq:0000}' },
];

/**
 * 证书编号规则管理器
 *  - 列表（增/删/改）
 *  - 预览下一号（peek）
 *  - 重置流水号
 */
export default function SeqRuleManagerModal({ open, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [editing, setEditing] = useState(null); // null=未打开 / {ruleKey, rulePattern, isNew}
  const [previewMap, setPreviewMap] = useState({}); // ruleKey -> peek value
  const [resetTarget, setResetTarget] = useState(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const reload = async () => {
    setLoading(true);
    try {
      const list = await seqApi.list();
      setRules(list || []);
      // 自动预览所有规则
      const m = {};
      await Promise.all(
        (list || []).map(async (r) => {
          try {
            const v = await seqApi.peek(r.ruleKey);
            m[r.ruleKey] = v?.value || '';
          } catch (_) { m[r.ruleKey] = ''; }
        }),
      );
      setPreviewMap(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) reload();
  }, [open]);

  const openCreate = () => {
    setEditing({ ruleKey: '', rulePattern: 'CERT-{yyyyMMdd}-{seq:0000}', isNew: true });
    form.resetFields();
    form.setFieldsValue({ ruleKey: '', rulePattern: 'CERT-{yyyyMMdd}-{seq:0000}' });
  };

  const openEdit = (record) => {
    setEditing({ ruleKey: record.ruleKey, rulePattern: record.rulePattern, isNew: false });
    form.resetFields();
    form.setFieldsValue({ ruleKey: record.ruleKey, rulePattern: record.rulePattern });
  };

  const closeEdit = () => {
    setEditing(null);
    form.resetFields();
  };

  const submitEdit = async () => {
    const v = await form.validateFields();
    await seqApi.save(v.ruleKey.trim(), v.rulePattern.trim());
    message.success('保存成功');
    closeEdit();
    await reload();
    onChanged?.();
  };

  const handleDelete = async (record) => {
    await seqApi.remove(record.ruleKey);
    message.success(`已删除规则 ${record.ruleKey}`);
    await reload();
    onChanged?.();
  };

  const openReset = (record) => {
    setResetTarget(record);
    resetForm.resetFields();
    resetForm.setFieldsValue({ currentSeq: 0 });
  };

  const submitReset = async () => {
    const v = await resetForm.validateFields();
    await seqApi.reset(resetTarget.ruleKey, v.currentSeq);
    message.success(`已重置 ${resetTarget.ruleKey} 流水号到 ${v.currentSeq}`);
    setResetTarget(null);
    await reload();
    onChanged?.();
  };

  const handlePreview = async (record) => {
    try {
      const v = await seqApi.peek(record.ruleKey);
      setPreviewMap((m) => ({ ...m, [record.ruleKey]: v?.value || '' }));
      message.info(`下一个：${v?.value}`);
    } catch (e) {
      message.error('预览失败');
    }
  };

  const columns = [
    {
      title: '规则 Key',
      dataIndex: 'ruleKey',
      width: 140,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '规则模式',
      dataIndex: 'rulePattern',
      ellipsis: true,
      render: (v) => <Text code copyable={{ text: v }}>{v}</Text>,
    },
    {
      title: '当前流水',
      dataIndex: 'currentSeq',
      width: 100,
      align: 'right',
    },
    {
      title: '下一号预览',
      width: 220,
      render: (_, r) => (
        <Space size={4}>
          <Text code style={{ color: '#16a34a' }}>{previewMap[r.ruleKey] || '—'}</Text>
          <Tooltip title="刷新预览">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(r)} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Button size="small" icon={<RedoOutlined />} onClick={() => openReset(r)}>重置</Button>
          <Popconfirm title={`确认删除规则 ${r.ruleKey}？`} onConfirm={() => handleDelete(r)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="证书编号规则管理"
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增规则</Button>
          <Button icon={<ReloadOutlined />} onClick={reload}>刷新</Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="规则模式占位符说明"
          description={
            <Space wrap size={[12, 4]}>
              {PLACEHOLDER_TIPS.map((t) => (
                <Tooltip key={t.token} title={t.desc}>
                  <Tag style={{ cursor: 'help' }}>{t.token}</Tag>
                </Tooltip>
              ))}
            </Space>
          }
        />
        <Table
          rowKey="ruleKey"
          loading={loading}
          dataSource={rules}
          columns={columns}
          size="small"
          pagination={false}
          scroll={{ y: 360 }}
        />
      </Modal>

      {/* 新增/编辑规则弹窗 */}
      <Modal
        title={editing?.isNew ? '新增编号规则' : `编辑规则 ${editing?.ruleKey}`}
        open={!!editing}
        onCancel={closeEdit}
        onOk={submitEdit}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="规则 Key"
            name="ruleKey"
            rules={[
              { required: true, message: '请输入规则 Key' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线、短横线' },
            ]}
            extra="规则的唯一标识，如 default / cert2025 / inner"
          >
            <Input placeholder="如 default" disabled={!editing?.isNew} />
          </Form.Item>
          <Form.Item
            label="规则模式"
            name="rulePattern"
            rules={[{ required: true, message: '请输入规则模式' }]}
            extra={
              <Space wrap size={4}>
                <span>预设：</span>
                {PRESET_PATTERNS.map((p) => (
                  <Tag
                    key={p.value}
                    style={{ cursor: 'pointer' }}
                    onClick={() => form.setFieldValue('rulePattern', p.value)}
                  >
                    {p.label}：{p.value}
                  </Tag>
                ))}
              </Space>
            }
          >
            <Input placeholder="CERT-{yyyyMMdd}-{seq:0000}" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置流水号 */}
      <Modal
        title={`重置流水号：${resetTarget?.ruleKey}`}
        open={!!resetTarget}
        onCancel={() => setResetTarget(null)}
        onOk={submitReset}
        okText="确认重置"
        cancelText="取消"
        destroyOnClose
      >
        <Paragraph type="warning">
          重置后下一个号将从 <Text strong>{'(currentSeq + 1)'}</Text> 开始；填 0 表示从 1 重新计数。
        </Paragraph>
        <Form form={resetForm} layout="vertical" preserve={false}>
          <Form.Item
            label="重置到"
            name="currentSeq"
            rules={[{ required: true, message: '请输入数值' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
