import { Drawer, Form, Input, Radio, InputNumber } from 'antd';
import ApprovalConfigPanel from './ApprovalConfigPanel';

const TYPE_TITLES = {
  start: '提交人配置',
  approval: '审批人配置',
  cc: '抄送人配置',
  condition: '条件分支配置',
  end: '结束节点配置',
  branch: '分支配置',
};

export default function ConfigDrawer({ node, open, onClose, onChange, formSchema }) {
  if (!node) return null;

  const update = (key, value) => {
    onChange({ ...node, config: { ...node.config, [key]: value } });
  };

  const updateName = (name) => {
    onChange({ ...node, name });
  };

  // 审批节点使用专用面板（带 取消/保存 footer）
  if (node.type === 'approval') {
    return (
      <Drawer
        title={null}
        closable={false}
        open={open}
        onClose={onClose}
        width={520}
        destroyOnClose
        zIndex={1200}
        styles={{ body: { padding: 0 } }}
      >
        <ApprovalConfigPanel
          node={node}
          onSave={(updated) => {
            onChange(updated);
            onClose();
          }}
          onCancel={onClose}
          formSchema={formSchema}
        />
      </Drawer>
    );
  }

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

        {/* 审批节点：由 ApprovalConfigPanel 统一接管（不会走到这里） */}

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
