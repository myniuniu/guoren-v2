import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

const TYPE_LABELS = {
  start: '提交',
  approval: '审批',
  cc: '抄送',
  condition: '条件分支',
  end: '结束',
  branch: '分支',
};

function getContentText(node) {
  switch (node.type) {
    case 'start': {
      const t = node.config?.submitterType;
      if (t === 'all') return '提交人：全员可提交';
      if (t === 'role') return `提交人：角色 ${node.config?.roles || '未配置'}`;
      if (t === 'user') return `提交人：${node.config?.users || '未配置'}`;
      return '可设置提交人';
    }
    case 'approval': {
      // 兼容旧数据（直接用 approverType）
      const cfg = node.config || {};
      const approvers = cfg.approvers;
      if (Array.isArray(approvers) && approvers.length > 0) {
        // 新数据：approvers 数组
        const labels = approvers.map((a) => {
          switch (a.type) {
            case 'leader':
              return a.level || '直属上级';
            case 'deptHead':
              return a.deptLevel || '直属部门负责人';
            case 'role': {
              const roles = a.roles;
              if (!roles) return '角色（未配置）';
              return '角色: ' + roles;
            }
            case 'userGroup': {
              const groups = a.userGroups;
              if (!groups) return '用户组（未配置）';
              return '用户组: ' + groups;
            }
            case 'specific': {
              const members = a.members;
              if (Array.isArray(members) && members.length > 0)
                return members.map((m) => m.name).join('、');
              return '指定成员（未选择）';
            }
            case 'submitterPick':
              return '提交人自选';
            case 'submitterSelf':
              return '提交人本人';
            case 'multiLeader':
              return '连续多级上级';
            case 'multiDeptHead':
              return '连续多级部门负责人';
            case 'formContact':
              return '表单内联系人';
            case 'formDept':
              return '表单内部门';
            default:
              return a.type || '未配置';
          }
        });
        return '审批人：' + labels.join(' → ');
      }
      // 旧数据兼容：approverType 单值
      const t = cfg.approverType;
      if (t === 'self') return '审批人：提交人自选';
      if (t === 'leader') return '审批人：直属上级';
      if (t === 'role') return `审批人：角色 ${cfg.roles || '未配置'}`;
      if (t === 'user') {
        const val = cfg.approvers;
        if (Array.isArray(val)) return `审批人：${val.map((m) => (typeof m === 'string' ? m : m.name)).join('、')}`;
        return `审批人：${val || '未配置'}`;
      }
      return '请选择审批人';
    }
    case 'cc':
      return node.config?.users ? `抄送：${node.config.users}` : '请选择抄送人';
    case 'condition':
      return '请配置分支条件';
    case 'end': {
      const cc = node.config?.ccUsers;
      if (Array.isArray(cc) && cc.length > 0) return `抄送：${cc.join('、')}`;
      if (typeof cc === 'string' && cc) return `抄送：${cc}`;
      return '可设置抄送人';
    }
    default:
      return '';
  }
}

function canRemove(node) {
  return node.type !== 'start' && node.type !== 'end';
}

export default function FlowNode({ node, selectedId, onSelect, onAdd, onRemove }) {
  if (!node) return null;

  return (
    <div className="pdv2-node-block">
      {/* 非 branch 类型：渲染节点卡片 */}
      {node.type !== 'branch' && (
        <div
          className={`pdv2-node ${node.type}${selectedId === node.id ? ' selected' : ''}`}
          onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        >
          <div className="pdv2-node-header">
            <span className="pdv2-node-title">{TYPE_LABELS[node.type] || node.name}</span>
            {canRemove(node) && (
              <span
                className="pdv2-node-close"
                onClick={(e) => { e.stopPropagation(); onRemove(node.id); }}
              >
                <CloseOutlined style={{ fontSize: 12 }} />
              </span>
            )}
          </div>
          <div className="pdv2-node-body">
            <span className="pdv2-node-content">{getContentText(node)}</span>
            <span className="pdv2-node-arrow">›</span>
          </div>
        </div>
      )}

      {/* 条件分支横向排列 */}
      {node.type === 'condition' && node.branches && node.branches.length > 0 && (
        <div className="pdv2-branches">
          <div className="pdv2-branch-line-top" />
          <div className="pdv2-branch-cols">
            {node.branches.map((b, idx) => (
              <div key={b.id} className="pdv2-branch-col">
                <div
                  className={`pdv2-branch-header${selectedId === b.id ? ' selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSelect(b); }}
                >
                  <span className="pdv2-branch-title">{b.name || `条件${idx + 1}`}</span>
                  <span className="pdv2-branch-priority">
                    优先级{b.config?.priority || idx + 1}
                  </span>
                </div>
                {b.next ? (
                  <div className="pdv2-branch-children">
                    <div className="pdv2-add-btn" onClick={(e) => { e.stopPropagation(); onAdd(b.id); }}>
                      <PlusOutlined />
                    </div>
                    <FlowNode
                      node={b.next}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onAdd={onAdd}
                      onRemove={onRemove}
                    />
                  </div>
                ) : (
                  <div className="pdv2-add-btn solo" onClick={(e) => { e.stopPropagation(); onAdd(b.id); }}>
                    <PlusOutlined />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pdv2-branch-line-bottom" />
        </div>
      )}

      {/* + 按钮（非 end/branch） */}
      {node.type !== 'end' && node.type !== 'branch' && (
        <div className="pdv2-add-btn" onClick={(e) => { e.stopPropagation(); onAdd(node.id); }}>
          <PlusOutlined />
        </div>
      )}

      {/* 递归下一个节点 */}
      {node.next && (
        <FlowNode
          node={node.next}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}
