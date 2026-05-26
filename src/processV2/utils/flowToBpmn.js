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
      if (cfg.approverType === 'user' && cfg.approvers) {
        attrs['flowable:candidateUsers'] = String(cfg.approvers);
      } else if (cfg.approverType === 'role' && cfg.roles) {
        attrs['flowable:candidateGroups'] = String(cfg.roles);
      } else if (cfg.approverType === 'leader') {
        attrs['flowable:assignee'] = '${leader}';
      } else if (cfg.approverType === 'self') {
        attrs['flowable:assignee'] = '${nextApprover}';
      }
      elements.push({
        type: 'userTask',
        id,
        name: node.name || '审批',
        attrs,
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
        inner: `<extensionElements><flowable:field name="ccUsers"><flowable:string>${escapeXml(
          cfg.users || '',
        )}</flowable:string></flowable:field></extensionElements>`,
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
