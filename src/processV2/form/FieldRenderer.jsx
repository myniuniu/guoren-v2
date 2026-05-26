import React from 'react';
import { Input, InputNumber, DatePicker, Radio, Checkbox, Upload, Button, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

/**
 * 画布中的字段渲染器（只读预览模式，展示字段外观）
 */
export default function FieldRenderer({ field }) {
  const { type, label, props: fProps = {} } = field;

  const renderField = () => {
    switch (type) {
      case 'input':
        return <Input placeholder={fProps.placeholder || '请输入'} disabled style={{ width: '100%' }} />;
      case 'textarea':
        return <Input.TextArea placeholder={fProps.placeholder || '请输入'} disabled rows={2} style={{ width: '100%' }} />;
      case 'inputNumber':
        return <InputNumber placeholder={fProps.placeholder || '请输入'} disabled style={{ width: '100%' }} />;
      case 'datePicker':
        return <DatePicker placeholder={fProps.placeholder || '请选择日期'} disabled style={{ width: '100%' }} />;
      case 'dateRange':
        return <DatePicker.RangePicker disabled style={{ width: '100%' }} />;
      case 'radio':
        return (
          <Radio.Group disabled>
            {(fProps.options || []).map((opt, i) => <Radio key={i} value={opt}>{opt}</Radio>)}
          </Radio.Group>
        );
      case 'checkbox':
        return (
          <Checkbox.Group disabled options={(fProps.options || []).map((o) => ({ label: o, value: o }))} />
        );
      case 'upload':
        return <Upload disabled><Button icon={<UploadOutlined />} disabled>点击上传</Button></Upload>;
      case 'alert':
        return <Alert message={fProps.content || '说明文字'} type="info" showIcon />;
      case 'tableForm':
        return <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, color: '#999' }}>明细/表格区域</div>;
      default:
        return <Input placeholder="未知组件" disabled />;
    }
  };

  return (
    <div className="field-renderer">
      {type !== 'alert' && (
        <div className="field-label">
          {fProps.required && <span className="field-required">*</span>}
          {label}
        </div>
      )}
      <div className="field-control">{renderField()}</div>
    </div>
  );
}
