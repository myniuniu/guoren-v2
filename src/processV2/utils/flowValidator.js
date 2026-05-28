/**
 * 流程数据校验器
 *
 * 提供两类校验：
 *  1. validateNodeConfig(node)       — 单节点配置校验（节点编辑面板"保存"时调用）
 *  2. validateFlow(flow, formSchema) — 整条流程校验（发布前调用）
 *
 * 返回结构：
 *   {
 *     valid: boolean,
 *     errors: Array<{ nodeId, nodeName, field, message, severity: 'error'|'warning' }>,
 *   }
 *
 * 设计原则：
 *  - 错误级别 error 必须阻断发布；warning 仅提示
 *  - 同节点字段命名与 ApprovalConfigPanel 完全对应，便于跳转定位
 */

const NODE_TYPE_LABEL = {
  start: '开始',
  approval: '审批',
  cc: '抄送',
  condition: '条件分支',
  end: '结束',
  branch: '分支',
};

/* ─────────── NCName / processKey ─────────── */

/**
 * XML NCName 合法性检查（简化版）
 * 规则：首字符为字母或下划线，后续字符为字母数字下划线连字符点
 * BPMN/Flowable 依赖 XML XSD，不允许以数字开头的 id
 */
const NCNAME_RE = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

export function isValidProcessKey(key) {
  if (key == null) return false;
  const s = String(key);
  if (s.length === 0 || s.length > 64) return false;
  return NCNAME_RE.test(s);
}

/**
 * 将任意输入归一为合法的 processKey
 *  - 非 [A-Za-z0-9_] 字符全部替换为 _
 *  - 首字符是数字时，前置 p_（避免 BPMN XSD 报 NCName 错）
 *  - 空值返回默认 processV2
 *  - 截断到 64 字符
 */
export function normalizeProcessKey(raw) {
  let s = (raw == null ? '' : String(raw)).trim();
  if (s.length === 0) return 'processV2';
  s = s.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!/^[A-Za-z_]/.test(s)) s = 'p_' + s;
  if (s.length > 64) s = s.slice(0, 64);
  return s;
}

/* ─────────── 节点配置校验 ─────────── */

/**
 * 校验单个节点的配置
 * @param {Object} node 流程节点
 * @returns {{valid: boolean, errors: Array}}
 */
export function validateNodeConfig(node) {
  const errors = [];
  if (!node) return { valid: true, errors };

  const cfg = node.config || {};
  const base = { nodeId: node.id, nodeName: node.name || NODE_TYPE_LABEL[node.type] || '节点' };

  switch (node.type) {
    case 'approval':
      errors.push(...validateApprovalNode(node, cfg, base));
      break;
    case 'cc':
      errors.push(...validateCcNode(node, cfg, base));
      break;
    case 'condition':
      errors.push(...validateConditionNode(node, cfg, base));
      break;
    default:
      break;
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

function validateApprovalNode(node, cfg, base) {
  const errors = [];
  const approvalType = cfg.approvalType || 'manual';

  // 自动通过 / 自动拒绝不需要审批人
  if (approvalType !== 'manual') return errors;

  const approvers = Array.isArray(cfg.approvers) ? cfg.approvers : [];

  if (approvers.length === 0) {
    errors.push({
      ...base,
      field: 'approvers',
      severity: 'error',
      message: `审批节点「${base.nodeName}」未配置审批人`,
    });
    return errors;
  }

  approvers.forEach((a, idx) => {
    const prefix = approvers.length > 1 ? `「${base.nodeName}」审批人 ${idx + 1}` : `「${base.nodeName}」`;
    switch (a.type) {
      case 'leader':
        if (!a.level) {
          errors.push({ ...base, field: `approvers[${idx}].level`, severity: 'error', message: `${prefix} 未选择上级层级` });
        }
        break;
      case 'deptHead':
        if (!a.deptLevel) {
          errors.push({ ...base, field: `approvers[${idx}].deptLevel`, severity: 'error', message: `${prefix} 未选择部门负责人层级` });
        }
        break;
      case 'role': {
        const roles = (a.roles || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (roles.length === 0) {
          errors.push({ ...base, field: `approvers[${idx}].roles`, severity: 'error', message: `${prefix} 未选择角色` });
        }
        break;
      }
      case 'userGroup': {
        const groups = (a.userGroups || '').split(',').map((s) => s.trim()).filter(Boolean);
        if (groups.length === 0) {
          errors.push({ ...base, field: `approvers[${idx}].userGroups`, severity: 'error', message: `${prefix} 未选择用户组` });
        }
        break;
      }
      case 'specific': {
        const members = Array.isArray(a.members) ? a.members : [];
        if (members.length === 0) {
          errors.push({ ...base, field: `approvers[${idx}].members`, severity: 'error', message: `${prefix} 未选择指定成员` });
        } else if (members.length > 25) {
          errors.push({ ...base, field: `approvers[${idx}].members`, severity: 'error', message: `${prefix} 指定成员不能超过 25 人` });
        }
        break;
      }
      case 'submitterPick':
        if ((a.pickScope || 'all') === 'role') {
          const roles = (a.pickRoles || '').split(',').map((s) => s.trim()).filter(Boolean);
          if (roles.length === 0) {
            errors.push({ ...base, field: `approvers[${idx}].pickRoles`, severity: 'error', message: `${prefix} 自选范围为角色时，必须填写角色标识` });
          }
        }
        break;
      case 'multiLeader': {
        const endpoint = a.multiEndpointType || 'leader';
        if (endpoint === 'leader' && !a.multiLevel) {
          errors.push({ ...base, field: `approvers[${idx}].multiLevel`, severity: 'error', message: `${prefix} 未选择上级层级` });
        }
        if (endpoint === 'deptHead' && !a.multiDeptLevel) {
          errors.push({ ...base, field: `approvers[${idx}].multiDeptLevel`, severity: 'error', message: `${prefix} 未选择部门负责人层级` });
        }
        break;
      }
      case 'multiDeptHead': {
        const endpoint = a.multiEndpointType || 'deptHead';
        if (endpoint === 'leader' && !a.multiLevel) {
          errors.push({ ...base, field: `approvers[${idx}].multiLevel`, severity: 'error', message: `${prefix} 未选择上级层级` });
        }
        if (endpoint === 'deptHead' && !a.multiDeptLevel) {
          errors.push({ ...base, field: `approvers[${idx}].multiDeptLevel`, severity: 'error', message: `${prefix} 未选择部门负责人层级` });
        }
        break;
      }
      case 'formContact':
        if (!a.formField) {
          errors.push({ ...base, field: `approvers[${idx}].formField`, severity: 'error', message: `${prefix} 未选择表单内联系人字段` });
        }
        break;
      case 'formDept':
        if (!a.formDeptField) {
          errors.push({ ...base, field: `approvers[${idx}].formDeptField`, severity: 'error', message: `${prefix} 未选择表单内部门字段` });
        }
        if (!a.deptLevel) {
          errors.push({ ...base, field: `approvers[${idx}].deptLevel`, severity: 'error', message: `${prefix} 未选择部门负责人层级` });
        }
        break;
      case 'submitterSelf':
      case 'nodeApprover':
      default:
        break;
    }
  });

  // 抄送人数 ≤ 100
  if (Array.isArray(cfg.ccUsers) && cfg.ccUsers.length > 100) {
    errors.push({ ...base, field: 'ccUsers', severity: 'error', message: `「${base.nodeName}」抄送人数不能超过 100 人` });
  }

  // 互斥：rejectScope=specified 时（高级）— 仅 warning
  if (cfg.allowReject === false && cfg.rejectScope && cfg.rejectScope !== 'unlimited') {
    errors.push({ ...base, field: 'rejectScope', severity: 'warning', message: `「${base.nodeName}」已关闭"允许退回"，退回范围设置将不生效` });
  }

  return errors;
}

function validateCcNode(node, cfg, base) {
  const errors = [];
  const users = (cfg.users || '').toString().trim();
  if (!users) {
    errors.push({ ...base, field: 'users', severity: 'error', message: `抄送节点「${base.nodeName}」未配置抄送人` });
  }
  return errors;
}

function validateConditionNode(node, cfg, base) {
  const errors = [];
  const branches = Array.isArray(node.branches) ? node.branches : [];
  if (branches.length < 2) {
    errors.push({ ...base, field: 'branches', severity: 'error', message: `条件节点「${base.nodeName}」至少需要 2 个分支` });
  }
  // 至少一个分支需要有条件表达式或被标记为 default
  const hasDefault = branches.some((b) => b?.config?.isDefault);
  const hasExpr = branches.some((b) => (b?.config?.expression || '').trim());
  if (!hasDefault && !hasExpr) {
    errors.push({ ...base, field: 'branches', severity: 'warning', message: `条件节点「${base.nodeName}」建议至少配置一条分支表达式或默认分支` });
  }
  return errors;
}

/* ─────────── 整条流程校验 ─────────── */

/**
 * 遍历流程树收集所有节点（含分支内节点）
 */
function collectAllNodes(root) {
  const all = [];
  const walk = (n) => {
    if (!n) return;
    all.push(n);
    if (Array.isArray(n.branches)) {
      n.branches.forEach((b) => walk(b));
    }
    if (n.next) walk(n.next);
  };
  walk(root);
  return all;
}

/**
 * 检测一条主链是否能到达 end
 */
function hasEndOnAnyPath(root) {
  if (!root) return false;
  if (root.type === 'end') return true;
  if (Array.isArray(root.branches) && root.branches.length > 0) {
    // 每个分支都要能到达 end（任何一个分支断了都视为不闭合）
    const allBranchesEnd = root.branches.every((b) => hasEndOnAnyPath(b));
    // condition 节点本身也可能有 next（汇聚后续节点）
    if (root.next) return allBranchesEnd && hasEndOnAnyPath(root.next);
    return allBranchesEnd;
  }
  if (root.next) return hasEndOnAnyPath(root.next);
  return false;
}

/**
 * 校验整条流程
 * @param {Object} root 流程根节点
 * @param {Array}  formSchema 表单 schema（暂未使用，预留校验"表单内联系人字段是否存在"等）
 */
export function validateFlow(root, _formSchema, processKey) {
  const errors = [];

  // 0. processKey 合法性校验（BPMN 作为 XML，id 必须 NCName）
  if (processKey != null) {
    if (!isValidProcessKey(processKey)) {
      errors.push({
        severity: 'error',
        message: `流程标识“${processKey}”不合法：必须以字母或下划线开头，只能包含字母、数字、下划线、连字符和点（例如 leave_apply）`,
      });
    }
  }

  // 1. 必须有根节点
  if (!root) {
    errors.push({ severity: 'error', message: '流程为空，请先添加节点' });
    return { valid: false, errors };
  }

  const allNodes = collectAllNodes(root);

  // 2. 必须以 start 节点开始
  if (root.type !== 'start') {
    errors.push({ severity: 'error', message: '流程必须从"开始"节点起始' });
  }

  // 3. 必须有至少一个审批节点
  const approvalNodes = allNodes.filter((n) => n.type === 'approval');
  if (approvalNodes.length === 0) {
    errors.push({ severity: 'error', message: '流程至少需要一个审批节点' });
  }

  // 4. 必须有终止路径
  if (!hasEndOnAnyPath(root)) {
    errors.push({ severity: 'error', message: '流程未闭合：存在分支或末端节点没有连接到"结束"' });
  }

  // 5. 节点 id 不可重复
  const idSeen = new Set();
  allNodes.forEach((n) => {
    if (!n.id) {
      errors.push({ severity: 'error', message: `存在没有 id 的节点（${NODE_TYPE_LABEL[n.type] || n.type}）` });
      return;
    }
    if (idSeen.has(n.id)) {
      errors.push({ severity: 'error', message: `节点 id 重复：${n.id}` });
    }
    idSeen.add(n.id);
  });

  // 6. 逐节点配置校验
  allNodes.forEach((n) => {
    const r = validateNodeConfig(n);
    errors.push(...r.errors);
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * 把校验结果格式化为可读的多行字符串（用于 Modal/message 展示）
 */
export function formatErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return '';
  return errors
    .map((e, i) => `${i + 1}. [${e.severity === 'warning' ? '警告' : '错误'}] ${e.message}`)
    .join('\n');
}
