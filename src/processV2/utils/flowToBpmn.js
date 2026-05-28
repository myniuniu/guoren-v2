/**
 * 把 V2 钉钉风格 JSON 流程数据转换成 Flowable BPMN XML
 * 移植自 workflow-designer/src/utils/flowV2ToBpmn.ts
 */

let elements = [];
let flows = [];
let counter = 0;

function nextId(prefix) {
  counter += 1;
  return `${prefix}_${counter}`;
}

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mapNodeId(node) {
  return String(node.id).replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildElement(node) {
  const id = mapNodeId(node);
  switch (node.type) {
    case 'start': {
      elements.push({
        type: 'startEvent',
        id,
        name: node.name || '开始',
      });
      return id;
    }
    case 'approval': {
      const cfg = node.config || {};
      const attrs = {};
      let inner = '';

      // 优先使用新结构：approvers 数组
      const approvers = Array.isArray(cfg.approvers) ? cfg.approvers : null;

      // 收集各类型的审批人表达，最终合并为 candidateUsers / candidateGroups / assignee
      const candidateUsers = []; // 具体人员 ID
      const candidateGroups = []; // 角色 / 用户组 / 冲击
      const assigneeExprs = []; // 表达式（上级、部门负责人、表单联系人等）
      const extFields = []; // extensionElements/flowable:field 定制字段，供后端后期实际解析

      if (approvers && approvers.length > 0) {
        approvers.forEach((a, idx) => {
          switch (a.type) {
            case 'leader': {
              // 上级：交给后端表达式解析
              const level = a.level || '直属上级';
              assigneeExprs.push(`\${approvalService.resolveLeader(execution, '${level}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'leader' });
              extFields.push({ name: `approver_${idx}_level`, value: level });
              break;
            }
            case 'deptHead': {
              const level = a.deptLevel || '直属部门负责人';
              const mode = a.deptHeadMode || 'up';
              assigneeExprs.push(`\${approvalService.resolveDeptHead(execution, '${level}', '${mode}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'deptHead' });
              extFields.push({ name: `approver_${idx}_level`, value: level });
              extFields.push({ name: `approver_${idx}_mode`, value: mode });
              break;
            }
            case 'role': {
              // 角色→ candidateGroups（与后端 taskCandidateGroup 查询一致）
              const roles = (a.roles || '').split(',').map((s) => s.trim()).filter(Boolean);
              roles.forEach((r) => candidateGroups.push(r));
              break;
            }
            case 'userGroup': {
              const groups = (a.userGroups || '').split(',').map((s) => s.trim()).filter(Boolean);
              groups.forEach((g) => candidateGroups.push(g));
              break;
            }
            case 'specific': {
              // 指定成员 → candidateUsers（取 id）
              const members = Array.isArray(a.members) ? a.members : [];
              members.forEach((m) => {
                if (m && m.id) candidateUsers.push(String(m.id));
              });
              break;
            }
            case 'submitterPick': {
              // 提交人自选：发起时写入变量 submitterPick_<idx>
              assigneeExprs.push(`\${submitterPick_${idx}}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'submitterPick' });
              extFields.push({ name: `approver_${idx}_scope`, value: a.pickScope || 'all' });
              if (a.pickScope === 'role' && a.pickRoles) {
                extFields.push({ name: `approver_${idx}_roles`, value: a.pickRoles });
              }
              break;
            }
            case 'submitterSelf': {
              assigneeExprs.push('${applicant}');
              extFields.push({ name: `approver_${idx}_type`, value: 'submitterSelf' });
              break;
            }
            case 'multiLeader': {
              const endpoint = a.multiEndpointType || 'leader';
              const level = endpoint === 'leader'
                ? (a.multiLevel || '直属上级')
                : (a.multiDeptLevel || '直属部门负责人');
              const mode = endpoint === 'leader' ? (a.multiMode || 'up') : (a.multiDeptMode || 'up');
              assigneeExprs.push(`\${approvalService.resolveMultiLevel(execution, '${endpoint}', '${level}', '${mode}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'multiLeader' });
              extFields.push({ name: `approver_${idx}_endpoint`, value: endpoint });
              extFields.push({ name: `approver_${idx}_level`, value: level });
              extFields.push({ name: `approver_${idx}_mode`, value: mode });
              break;
            }
            case 'multiDeptHead': {
              const endpoint = a.multiEndpointType || 'deptHead';
              const level = endpoint === 'deptHead'
                ? (a.multiDeptLevel || '直属部门负责人')
                : (a.multiLevel || '直属上级');
              const mode = endpoint === 'deptHead' ? (a.multiDeptMode || 'up') : (a.multiMode || 'up');
              assigneeExprs.push(`\${approvalService.resolveMultiLevel(execution, '${endpoint}', '${level}', '${mode}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'multiDeptHead' });
              extFields.push({ name: `approver_${idx}_endpoint`, value: endpoint });
              extFields.push({ name: `approver_${idx}_level`, value: level });
              extFields.push({ name: `approver_${idx}_mode`, value: mode });
              break;
            }
            case 'formContact': {
              const fld = a.formField || 'contact';
              assigneeExprs.push(`\${approvalService.resolveFormContact(execution, '${fld}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'formContact' });
              extFields.push({ name: `approver_${idx}_field`, value: fld });
              break;
            }
            case 'formDept': {
              const fld = a.formDeptField || 'dept';
              const lvl = a.deptLevel || '直属部门负责人';
              assigneeExprs.push(`\${approvalService.resolveFormDept(execution, '${fld}', '${lvl}')}`);
              extFields.push({ name: `approver_${idx}_type`, value: 'formDept' });
              extFields.push({ name: `approver_${idx}_field`, value: fld });
              extFields.push({ name: `approver_${idx}_level`, value: lvl });
              break;
            }
            default:
              break;
          }
        });

        // 汇总到 BPMN attrs
        if (candidateUsers.length > 0) {
          attrs['flowable:candidateUsers'] = candidateUsers.join(',');
        }
        if (candidateGroups.length > 0) {
          attrs['flowable:candidateGroups'] = candidateGroups.join(',');
        }
        if (assigneeExprs.length > 0 && !attrs['flowable:candidateUsers'] && !attrs['flowable:candidateGroups']) {
          // 只有表达式时才用 assignee（同时存在 candidateUsers/Groups 的表达式会冲突，优先后者）
          attrs['flowable:assignee'] = assigneeExprs[0];
        }

        // 其他高级配置（emptyPolicy / sameAsSubmitter / excludeFromStats / approvalType / ccUsers）
        // 全部以 extensionElements/flowable:field 存储，供后端服务读取
        if (cfg.approvalType) extFields.push({ name: 'approvalType', value: cfg.approvalType });
        if (cfg.emptyPolicy) extFields.push({ name: 'emptyPolicy', value: cfg.emptyPolicy });
        if (cfg.sameAsSubmitter) extFields.push({ name: 'sameAsSubmitter', value: cfg.sameAsSubmitter });
        if (cfg.excludeFromStats) extFields.push({ name: 'excludeFromStats', value: 'true' });
        if (Array.isArray(cfg.ccUsers) && cfg.ccUsers.length > 0) {
          extFields.push({ name: 'ccUsers', value: cfg.ccUsers.join(',') });
        }
        // 表单权限：每个字段存 formPerm_<fieldId>=<readable>:<editable>
        if (cfg.formPerms && typeof cfg.formPerms === 'object') {
          for (const [fid, perm] of Object.entries(cfg.formPerms)) {
            const readable = perm.readable !== false ? '1' : '0';
            const editable = perm.editable === true ? '1' : '0';
            extFields.push({ name: `formPerm_${fid}`, value: `${readable}:${editable}` });
          }
        }
        // 操作权限
        if (cfg.allowTransfer === false) extFields.push({ name: 'allowTransfer', value: 'false' });
        if (cfg.allowAddSign === false) extFields.push({ name: 'allowAddSign', value: 'false' });
        if (cfg.allowReject === false) extFields.push({ name: 'allowReject', value: 'false' });
        if (cfg.rejectScope && cfg.rejectScope !== 'unlimited') extFields.push({ name: 'rejectScope', value: cfg.rejectScope });
        if (cfg.requireSignature) extFields.push({ name: 'requireSignature', value: 'true' });
        if (cfg.requireComment) extFields.push({ name: 'requireComment', value: 'true' });
      } else {
        // 向后兼容：旧 approverType 逻辑
        if (cfg.approverType === 'user' && cfg.approvers) {
          const v = cfg.approvers;
          if (Array.isArray(v)) {
            attrs['flowable:candidateUsers'] = v
              .map((m) => (typeof m === 'string' ? m : m.id))
              .filter(Boolean)
              .join(',');
          } else {
            attrs['flowable:candidateUsers'] = String(v);
          }
        } else if (cfg.approverType === 'role' && cfg.roles) {
          attrs['flowable:candidateGroups'] = String(cfg.roles);
        } else if (cfg.approverType === 'leader') {
          attrs['flowable:assignee'] = '${leader}';
        } else if (cfg.approverType === 'self') {
          attrs['flowable:assignee'] = '${nextApprover}';
        }
      }

      if (extFields.length > 0) {
        const fieldsXml = extFields
          .map(
            (f) =>
              `<flowable:field name="${escapeXml(f.name)}"><flowable:string>${escapeXml(
                f.value,
              )}</flowable:string></flowable:field>`,
          )
          .join('');
        inner = `<bpmn:extensionElements>${fieldsXml}</bpmn:extensionElements>`;
      }

      // 自动拒绝 / 自动通过的节点不分配人员（后端可识别 approvalType 后直接 complete）
      if (cfg.approvalType === 'autoApprove' || cfg.approvalType === 'autoReject') {
        delete attrs['flowable:candidateUsers'];
        delete attrs['flowable:candidateGroups'];
        delete attrs['flowable:assignee'];
      }

      elements.push({
        type: 'userTask',
        id,
        name: node.name || '审批',
        attrs,
        inner,
      });
      return id;
    }
    case 'cc': {
      const cfg = node.config || {};
      elements.push({
        type: 'serviceTask',
        id,
        name: node.name || '抄送',
        attrs: {
          'flowable:expression': '${ccService.notify(execution)}',
          'flowable:resultVariable': 'ccResult',
        },
        inner: `<bpmn:extensionElements><flowable:field name="ccUsers"><flowable:string>${escapeXml(
          cfg.users || '',
        )}</flowable:string></flowable:field></bpmn:extensionElements>`,
      });
      return id;
    }
    case 'condition': {
      elements.push({
        type: 'exclusiveGateway',
        id,
        name: node.name || '条件分支',
      });
      return id;
    }
    case 'end': {
      elements.push({
        type: 'endEvent',
        id,
        name: node.name || '结束',
      });
      return id;
    }
    default: {
      // branch 等不在主链直接渲染
      elements.push({
        type: 'task',
        id,
        name: node.name || '任务',
      });
      return id;
    }
  }
}

/**
 * 递归处理节点链：返回当前节点最后一个 element 的 id
 */
function visit(node, prevId, condition) {
  if (!node) return prevId;
  if (node.type === 'condition' && node.branches && node.branches.length) {
    const gatewayId = buildElement(node);
    if (prevId) {
      flows.push({ id: nextId('flow'), source: prevId, target: gatewayId, condition });
    }
    const joinId = nextId('gateway');
    elements.push({ type: 'exclusiveGateway', id: joinId, name: '汇聚' });

    node.branches.forEach((b) => {
      const cond = (b.config && b.config.expression) || `\${branch == '${b.id}'}`;
      const branchEnd = visit(b.next, gatewayId, cond);
      const end = branchEnd || gatewayId;
      flows.push({ id: nextId('flow'), source: end, target: joinId });
    });

    return visit(node.next, joinId);
  } else {
    const curId = buildElement(node);
    if (prevId) {
      flows.push({ id: nextId('flow'), source: prevId, target: curId, condition });
    }
    if (node.type === 'end') return curId;
    return visit(node.next, curId);
  }
}

export function flowToBpmnXml(root, processKey = 'processV2', processName = '流程V2') {
  elements = [];
  flows = [];
  counter = 0;

  let startNode = root;
  if (!root) return '';
  if (root.type !== 'start') {
    startNode = {
      id: 'start_auto',
      type: 'start',
      name: '开始',
      config: {},
      next: root,
    };
  }

  visit(startNode, null);

  const hasEnd = elements.some((e) => e.type === 'endEvent');
  if (!hasEnd) {
    const endId = nextId('end');
    elements.push({ type: 'endEvent', id: endId, name: '结束' });
    const sources = new Set(flows.map((f) => f.source));
    elements.forEach((el) => {
      if (el.type === 'endEvent') return;
      if (!sources.has(el.id)) {
        flows.push({ id: nextId('flow'), source: el.id, target: endId });
      }
    });
  }

  const elXml = elements
    .map((el) => {
      const attrs = Object.entries(el.attrs || {})
        .map(([k, v]) => `${k}="${escapeXml(v)}"`)
        .join(' ');
      const open = `<bpmn:${el.type} id="${el.id}" name="${escapeXml(el.name)}"${attrs ? ' ' + attrs : ''}>`;
      const close = `</bpmn:${el.type}>`;
      return `${open}${el.inner || ''}${close}`;
    })
    .join('\n    ');

  const flowXml = flows
    .map((f) => {
      const cond = f.condition
        ? `<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression"><![CDATA[${f.condition}]]></bpmn:conditionExpression>`
        : '';
      return `<bpmn:sequenceFlow id="${f.id}" sourceRef="${f.source}" targetRef="${f.target}">${cond}</bpmn:sequenceFlow>`;
    })
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:flowable="http://flowable.org/bpmn"
  targetNamespace="http://www.flowable.org/processdef">
  <bpmn:process id="${processKey}" name="${escapeXml(processName)}" isExecutable="true">
    ${elXml}
    ${flowXml}
  </bpmn:process>
</bpmn:definitions>`;
}
