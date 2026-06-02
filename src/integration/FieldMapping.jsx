import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Select, Input, Popconfirm, message, Tooltip, Tag, Empty, InputNumber,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SwapOutlined, ThunderboltOutlined,
  SaveOutlined, UndoOutlined,
} from '@ant-design/icons';
import {
  mockFieldMappingApi, TRANSFORM_TYPE_OPTIONS,
} from './api';

export default function FieldMapping({ pipelineId, sourceFields, targetFields, editable = true }) {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    try {
      const data = await mockFieldMappingApi.list(pipelineId);
      setMappings(data.length ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => { load(); }, [load]);

  const addRow = () => {
    setMappings((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        pipelineId,
        sourceField: '',
        sourceType: 'STRING',
        targetField: '',
        targetType: 'STRING',
        transformType: 'direct',
        transformRule: null,
      },
    ]);
  };

  const removeRow = (id) => {
    setMappings((prev) => prev.filter((m) => m.id !== id));
  };

  const updateRow = (id, field, value) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAutoMatch = async () => {
    try {
      const res = await mockFieldMappingApi.autoMatch(pipelineId);
      message.success(`自动匹配完成：匹配 ${res.matched} 个字段，未匹配 ${res.unmatched} 个`);
      load();
    } catch (e) {
      message.error('自动匹配失败');
    }
  };

  const handleSave = async () => {
    const invalid = mappings.some((m) => !m.sourceField || !m.targetField);
    if (invalid) {
      message.warning('请完善所有映射的源字段和目标字段');
      return;
    }
    setSaving(true);
    try {
      await mockFieldMappingApi.save(pipelineId, mappings.map(({ id, ...rest }) => rest));
      message.success('字段映射已保存');
      load();
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const srcOpts = (sourceFields || []).map((f) => ({ value: f.name, label: `${f.name} (${f.type})` }));
  const tgtOpts = (targetFields || []).map((f) => ({ value: f.name, label: `${f.name} (${f.type})` }));

  const columns = [
    {
      title: '源字段',
      dataIndex: 'sourceField',
      width: 200,
      render: (v, row) =>
        editable ? (
          <Select
            showSearch
            value={v || undefined}
            placeholder="选择源字段"
            options={srcOpts}
            style={{ width: '100%' }}
            onChange={(val) => updateRow(row.id, 'sourceField', val)}
          />
        ) : (
          <code>{v}</code>
        ),
    },
    {
      title: '源类型',
      dataIndex: 'sourceType',
      width: 120,
      render: (v, row) =>
        editable ? (
          <Input value={v} onChange={(e) => updateRow(row.id, 'sourceType', e.target.value)} />
        ) : (
          <Tag>{v}</Tag>
        ),
    },
    {
      title: '',
      width: 40,
      align: 'center',
      render: () => <SwapOutlined style={{ color: '#d1d5db' }} />,
    },
    {
      title: '转换方式',
      dataIndex: 'transformType',
      width: 140,
      render: (v, row) =>
        editable ? (
          <Select
            value={v}
            options={TRANSFORM_TYPE_OPTIONS}
            style={{ width: '100%' }}
            onChange={(val) => updateRow(row.id, 'transformType', val)}
          />
        ) : (
          <Tag color="blue">{TRANSFORM_TYPE_OPTIONS.find((o) => o.value === v)?.label || v}</Tag>
        ),
    },
    {
      title: '转换规则',
      dataIndex: 'transformRule',
      width: 160,
      render: (v, row) => {
        if (row.transformType === 'direct') return <span style={{ color: '#d1d5db' }}>—</span>;
        return editable ? (
          <Input
            value={v || ''}
            placeholder="转换规则"
            onChange={(e) => updateRow(row.id, 'transformRule', e.target.value)}
          />
        ) : (
          <code>{v}</code>
        );
      },
    },
    {
      title: '目标字段',
      dataIndex: 'targetField',
      width: 200,
      render: (v, row) =>
        editable ? (
          <Select
            showSearch
            value={v || undefined}
            placeholder="选择目标字段"
            options={tgtOpts}
            style={{ width: '100%' }}
            onChange={(val) => updateRow(row.id, 'targetField', val)}
          />
        ) : (
          <code>{v}</code>
        ),
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      width: 100,
      render: (v, row) =>
        editable ? (
          <Input value={v} onChange={(e) => updateRow(row.id, 'targetType', e.target.value)} />
        ) : (
          <Tag>{v}</Tag>
        ),
    },
    ...(editable
      ? [
          {
            title: '',
            width: 50,
            align: 'center',
            render: (_, row) => (
              <Popconfirm title="确认删除该映射？" onConfirm={() => removeRow(row.id)}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      {editable && (
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<PlusOutlined />} onClick={addRow}>添加映射</Button>
            <Tooltip title="根据字段名称自动匹配源字段与目标字段">
              <Button icon={<ThunderboltOutlined />} onClick={handleAutoMatch}>自动匹配</Button>
            </Tooltip>
          </Space>
          <Space>
            <Button icon={<UndoOutlined />} onClick={load}>重置</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存映射</Button>
          </Space>
        </div>
      )}
      <Table
        rowKey="id"
        dataSource={mappings}
        columns={columns}
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: <Empty description="暂无字段映射，点击上方添加或自动匹配" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
