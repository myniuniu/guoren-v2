import React from 'react';
import { Drawer, Form, Input, Radio, InputNumber } from 'antd';

const TYPE_TITLES = {
  start: '提交人配置',
  approval: '审批人配置',
  cc: '抄送人配置',
  condition: '条件分支配置',
  end: '结束节点配置',
  branch: '分支配置',
};

export default function ConfigDrawer({ node, open, onClose, onChange }) {
  if (!node) return null;

  const update = (key, value) => {
    onChange({ ...node, config: { ...node.config, [key]: value } });
  };

  const updateName = (name) => {
    onChange({ ...node, name });
  };

  return (
    <Drawer
      title={TYPE_TITLES[node.type] || '配置节点'}
      open={open}
      onClose={onClose}
      width={380}
      destroyOnClose={false}
      zIndex={1200}
    >
      <Form layout="vertical">
        <Form.Item label="节点名称">
          <Input value={node.name} onChange={(e) => updateName(e.target.value)} placeholder="请输入节点名称" />
        </Form.Item>

        {/* 提交节点 */}
        {node.type === 'start' && (
          <>
            <Form.Item label="提交人">
              <Radio.Group value={node.config?.submitterType} onChange={(e) => update('submitterType', e.target.value)}>
                <Radio value="all">全员可提交</Radio>
                <Radio value="role">指定角色</Radio>
                <Radio value="user">指定人员</Radio>
              </Radio.Group>
            </Form.Item>
            {node.config?.submitterType === 'role' && (
              <Form.Item label="角色">
                <Input value={node.config?.roles} onChange={(e) => update('roles', e.target.value)} placeholder="多个角色用逗号分隔" />
              </Form.Item>
            )}
            {node.config?.submitterType === 'user' && (
              <Form.Item label="人员">
                <Input value={node.config?.users} onChange={(e) => update('users', e.target.value)} placeholder="多个人员用逗号分隔" />
              </Form.Item>
            )}
          </>
        )}

        {/* 审批节点 */}
        {node.type === 'approval' && (
          <>
            <Form.Item label="审批人来源">
              <Radio.Group value={node.config?.approverType} onChange={(e) => update('approverType', e.target.value)}>
                <Radio value="user">指定人员</Radio>
                <Radio value="role">指定角色</Radio>
                <Radio value="leader">直属上级</Radio>
                <Radio value="self">提交人自选</Radio>
              </Radio.Group>
            </Form.Item>
            {node.config?.approverType === 'user' && (
              <Form.Item label="审批人">
                <Input value={node.config?.approvers} onChange={(e) => update('approvers', e.target.value)} placeholder="多个人员用逗号分隔" />
              </Form.Item>
            )}
            {node.config?.approverType === 'role' && (
              <Form.Item label="角色">
                <Input value={node.config?.roles} onChange={(e) => update('roles', e.target.value)} placeholder="多个角色用逗号分隔" />
              </Form.Item>
            )}
            <Form.Item label="多人审批方式">
              <Radio.Group value={node.config?.multiMode} onChange={(e) => update('multiMode', e.target.value)}>
                <Radio value="any">任一人通过即可</Radio>
                <Radio value="all">所有人通过</Radio>
                <Radio value="sequential">按顺序依次审批</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        {/* 抄送节点 */}
        {node.type === 'cc' && (
          <Form.Item label="抄送人">
            <Input value={node.config?.users} onChange={(e) => update('users', e.target.value)} placeholder="多个人员用逗号分隔" />
          </Form.Item>
        )}

        {/* 条件分支 / branch */}
        {(node.type === 'condition' || node.type === 'branch') && (
          <>
            <Form.Item label="条件表达式">
              <Input.TextArea
                value={node.config?.expression}
                onChange={(e) => update('expression', e.target.value)}
                rows={3}
                placeholder="如：${amount > 1000}"
              />
            </Form.Item>
            <Form.Item label="优先级">
              <InputNumber value={node.config?.priority} onChange={(v) => update('priority', v)} min={1} max={99} />
            </Form.Item>
          </>
        )}

        {/* 结束节点 */}
        {node.type === 'end' && (
          <Form.Item label="抄送人">
            <Input value={node.config?.ccUsers} onChange={(e) => update('ccUsers', e.target.value)} placeholder="流程结束后抄送给这些人" />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
