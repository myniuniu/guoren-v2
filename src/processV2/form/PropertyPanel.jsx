import React from 'react';
import { Input, Switch, InputNumber, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getFieldProperties } from './fieldDefs';

export default function PropertyPanel({ field, onChange }) {
  if (!field) {
    return (
      <div className="property-panel">
        <div className="property-empty">请选择一个组件</div>
      </div>
    );
  }

  const properties = getFieldProperties(field.type);

  const updateField = (key, value, path) => {
    if (path === 'props') {
      onChange({ ...field, props: { ...field.props, [key]: value } });
    } else {
      onChange({ ...field, [key]: value });
    }
  };

  const updateOption = (index, value) => {
    const options = [...(field.props?.options || [])];
    options[index] = value;
    onChange({ ...field, props: { ...field.props, options } });
  };

  const addOption = () => {
    const options = [...(field.props?.options || []), `选项${(field.props?.options?.length || 0) + 1}`];
    onChange({ ...field, props: { ...field.props, options } });
  };

  const removeOption = (index) => {
    const options = [...(field.props?.options || [])];
    options.splice(index, 1);
    onChange({ ...field, props: { ...field.props, options } });
  };

  return (
    <div className="property-panel">
      <div className="property-title">属性配置</div>
      <div className="property-list">
        {properties.map((prop) => (
          <div key={prop.key} className="property-item">
            <label className="property-label">{prop.label}</label>
            <div className="property-control">
              {prop.inputType === 'text' && (
                <Input
                  size="small"
                  value={prop.path === 'props' ? field.props?.[prop.key] : field[prop.key]}
                  onChange={(e) => updateField(prop.key, e.target.value, prop.path)}
                  placeholder={`请输入${prop.label}`}
                />
              )}
              {prop.inputType === 'textarea' && (
                <Input.TextArea
                  size="small"
                  rows={2}
                  value={prop.path === 'props' ? field.props?.[prop.key] : field[prop.key]}
                  onChange={(e) => updateField(prop.key, e.target.value, prop.path)}
                  placeholder={`请输入${prop.label}`}
                />
              )}
              {prop.inputType === 'number' && (
                <InputNumber
                  size="small"
                  style={{ width: '100%' }}
                  value={prop.path === 'props' ? field.props?.[prop.key] : field[prop.key]}
                  onChange={(v) => updateField(prop.key, v, prop.path)}
                />
              )}
              {prop.inputType === 'switch' && (
                <Switch
                  size="small"
                  checked={!!(prop.path === 'props' ? field.props?.[prop.key] : field[prop.key])}
                  onChange={(v) => updateField(prop.key, v, prop.path)}
                />
              )}
              {prop.inputType === 'options' && (
                <div className="property-options">
                  {(field.props?.options || []).map((opt, idx) => (
                    <div key={idx} className="property-option-row">
                      <Input
                        size="small"
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeOption(idx)}
                      />
                    </div>
                  ))}
                  <Button type="dashed" size="small" block icon={<PlusOutlined />} onClick={addOption}>
                    添加选项
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
