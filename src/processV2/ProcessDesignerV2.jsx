import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Modal, Input, Form, Switch, Select, InputNumber } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import FormDesignerV2 from './form/FormDesignerV2';
import FlowDesignerV2 from './flow/FlowDesignerV2';
import { processV2Api } from './api';
import { flowToBpmnXml } from './utils/flowToBpmn';
import { createDefaultFlow } from './types';
import './ProcessDesignerV2.css';

const STEPS = [
  { key: 'basic', label: '基础信息' },
  { key: 'form', label: '表单设计' },
  { key: 'flow', label: '流程设计' },
  { key: 'settings', label: '更多设置' },
];

/* ─── 基础信息 Tab ─── */
function BasicInfoPanel({ record, basicInfo, setBasicInfo }) {
  return (
    <div className="pdv2-basic-panel">
      <div className="pdv2-basic-card">
        <h3 className="pdv2-basic-card-title">流程基本信息</h3>
        <Form layout="vertical" className="pdv2-basic-form">
          <Form.Item label="流程名称">
            <Input
              value={basicInfo.name}
              onChange={(e) => setBasicInfo((p) => ({ ...p, name: e.target.value }))}
              placeholder="请输入流程名称"
            />
          </Form.Item>
          <Form.Item label="流程标识">
            <Input
              value={basicInfo.key}
              onChange={(e) => setBasicInfo((p) => ({ ...p, key: e.target.value }))}
              placeholder="英文标识，如 leave_apply"
            />
          </Form.Item>
          <Form.Item label="流程分组">
            <Select
              value={basicInfo.group}
              onChange={(v) => setBasicInfo((p) => ({ ...p, group: v }))}
              placeholder="请选择分组"
              options={[
                { value: 'oa', label: 'OA办公' },
                { value: 'hr', label: '人事管理' },
                { value: 'finance', label: '财务审批' },
                { value: 'other', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item label="流程说明">
            <Input.TextArea
              value={basicInfo.description}
              onChange={(e) => setBasicInfo((p) => ({ ...p, description: e.target.value }))}
              placeholder="简要描述该流程的用途"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="流程图标">
            <Input
              value={basicInfo.icon}
              onChange={(e) => setBasicInfo((p) => ({ ...p, icon: e.target.value }))}
              placeholder="图标名称或URL"
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

/* ─── 更多设置 Tab ─── */
function MoreSettingsPanel({ settings, setSettings }) {
  return (
    <div className="pdv2-settings-panel">
      <div className="pdv2-settings-card">
        <h3 className="pdv2-basic-card-title">高级设置</h3>
        <Form layout="vertical" className="pdv2-basic-form">
          <Form.Item label="允许撤回">
            <Switch
              checked={settings.allowRevoke}
              onChange={(v) => setSettings((p) => ({ ...p, allowRevoke: v }))}
            />
          </Form.Item>
          <Form.Item label="允许催办">
            <Switch
              checked={settings.allowUrge}
              onChange={(v) => setSettings((p) => ({ ...p, allowUrge: v }))}
            />
          </Form.Item>
          <Form.Item label="自动去重">
            <Switch
              checked={settings.autoDedup}
              onChange={(v) => setSettings((p) => ({ ...p, autoDedup: v }))}
            />
          </Form.Item>
          <Form.Item label="审批超时（小时）">
            <InputNumber
              min={0}
              value={settings.timeoutHours}
              onChange={(v) => setSettings((p) => ({ ...p, timeoutHours: v }))}
              placeholder="0 表示不限制"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="通知方式">
            <Select
              mode="multiple"
              value={settings.notifyChannels}
              onChange={(v) => setSettings((p) => ({ ...p, notifyChannels: v }))}
              placeholder="请选择通知方式"
              options={[
                { value: 'app', label: '站内消息' },
                { value: 'email', label: '邮件' },
                { value: 'sms', label: '短信' },
                { value: 'wechat', label: '企业微信' },
              ]}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default function ProcessDesignerV2({ record, onClose }) {
  const [tab, setTab] = useState('basic');
  const [schema, setSchema] = useState([]);
  const [flow, setFlow] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    name: record?.name || '',
    key: record?.key || '',
    group: '',
    description: '',
    icon: '',
  });
  const [settings, setSettings] = useState({
    allowRevoke: true,
    allowUrge: true,
    autoDedup: false,
    timeoutHours: 0,
    notifyChannels: ['app'],
  });

  // 加载已保存的数据
  useEffect(() => {
    const processKey = record?.key?.replace(/[^a-zA-Z0-9_]/g, '_') || '';
    // 加载表单 schema
    try {
      const stored = localStorage.getItem('gr_form_list');
      if (stored) {
        const list = JSON.parse(stored);
        const found = list.find((f) => f.key === record.key);
        if (found && found.rules) {
          setSchema(JSON.parse(found.rules));
        }
      }
    } catch { /* ignore */ }
    // 加载 V2 流程 JSON
    try {
      const stored = localStorage.getItem('gr_flow_v2');
      if (stored) {
        const map = JSON.parse(stored);
        if (map[processKey]) {
          setFlow(map[processKey]);
          return;
        }
      }
    } catch { /* ignore */ }
    setFlow(createDefaultFlow());
  }, [record]);

  const handlePublish = useCallback(async () => {
    if (!flow || (!flow.next && !flow.branches)) {
      message.warning('请先设计流程后再发布');
      return;
    }
    const processKey = (record?.key || record?.name || 'processV2').replace(/[^a-zA-Z0-9_]/g, '_');
    const processName = record?.name || '流程V2';

    // 弹窗让用户确认名称
    let deployName = processName;
    try {
      deployName = await new Promise((resolve, reject) => {
        let inputVal = processName;
        Modal.confirm({
          title: '部署流程',
          zIndex: 1200,
          content: (
            <div style={{ marginTop: 12 }}>
              <span>请输入流程名称：</span>
              <Input
                defaultValue={processName}
                style={{ marginTop: 8 }}
                onChange={(e) => { inputVal = e.target.value; }}
              />
            </div>
          ),
          okText: '部署',
          cancelText: '取消',
          onOk: () => resolve(inputVal),
          onCancel: () => reject('cancel'),
        });
      });
    } catch {
      return;
    }

    setPublishing(true);
    try {
      const xml = flowToBpmnXml(flow, processKey, deployName);
      await processV2Api.deploy({ name: deployName, xml });

      // 保存 V2 JSON 到 localStorage
      try {
        const stored = localStorage.getItem('gr_flow_v2') || '{}';
        const map = JSON.parse(stored);
        map[processKey] = flow;
        localStorage.setItem('gr_flow_v2', JSON.stringify(map));
      } catch { /* ignore */ }

      // 保存表单 schema 到 localStorage
      if (schema && schema.length) {
        try {
          const stored = localStorage.getItem('gr_form_list');
          const list = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex((f) => f.key === record.key);
          const formData = {
            key: record.key,
            name: record.name,
            rules: JSON.stringify(schema),
            updatedAt: new Date().toISOString(),
          };
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...formData };
          } else {
            list.push({ ...formData, createdAt: new Date().toISOString() });
          }
          localStorage.setItem('gr_form_list', JSON.stringify(list));
        } catch { /* ignore */ }
      }

      message.success('发布成功！');
      onClose && onClose();
    } catch (err) {
      if (err !== 'cancel') {
        message.error('发布失败: ' + (err.message || '未知错误'));
      }
    } finally {
      setPublishing(false);
    }
  }, [flow, schema, record, onClose]);

  const renderContent = () => {
    switch (tab) {
      case 'basic':
        return <BasicInfoPanel record={record} basicInfo={basicInfo} setBasicInfo={setBasicInfo} />;
      case 'form':
        return <FormDesignerV2 value={schema} onChange={setSchema} />;
      case 'flow':
        return flow ? <FlowDesignerV2 value={flow} onChange={setFlow} /> : null;
      case 'settings':
        return <MoreSettingsPanel settings={settings} setSettings={setSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="pdv2-container">
      <div className="pdv2-header">
        <div className="pdv2-header-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onClose} className="pdv2-back-btn" />
          <div className="pdv2-header-info">
            <span className="pdv2-header-title">{basicInfo.name || record?.name || '未命名流程'}</span>
            <span className="pdv2-header-subtitle">草稿</span>
          </div>
        </div>
        <div className="pdv2-header-center">
          {STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`pdv2-step${tab === step.key ? ' active' : ''}`}
              onClick={() => setTab(step.key)}
            >
              <span className="pdv2-step-num">{idx + 1}</span>
              <span className="pdv2-step-label">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="pdv2-header-right">
          <Button onClick={() => message.info('预览功能开发中')}>预览</Button>
          <Button type="primary" loading={publishing} onClick={handlePublish}>
            发布
          </Button>
        </div>
      </div>
      <div className="pdv2-body">
        {renderContent()}
      </div>
    </div>
  );
}
