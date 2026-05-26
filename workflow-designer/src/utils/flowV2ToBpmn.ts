/**
 * 把 V2 钉钉风格 JSON 流程数据转换成 Flowable BPMN XML
 *
 * 设计：
 * - start 节点 -> bpmn:startEvent
 * - approval 节点 -> bpmn:userTask（candidateUsers / assignee）
 * - cc 节点 -> bpmn:serviceTask（带 cc:users 扩展属性）
 * - condition 节点 -> bpmn:exclusiveGateway + 多条带条件的 sequenceFlow
 * - end 节点 -> bpmn:endEvent
 *
 * 注意：当前为最小实现，仅保证可被 Flowable 解析部署，
 * 复杂条件 / 多分支合流 / 抄送 ServiceTask 实现类需后端补足。
 */

import type { FlowNode } from '../types/flowV2'

interface Element {
  type: string
  id: string
  name: string
  attrs?: Record<string, string>
  inner?: string
}

interface Flow {
  id: string
  source: string
  target: string
  condition?: string
}

let elements: Element[] = []
let flows: Flow[] = []
let counter = 0

function nextId(prefix: string) {
  counter += 1
  return `${prefix}_${counter}`
}

function escapeXml(s: string): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildElement(node: FlowNode): string {
  const id = mapNodeId(node)
  switch (node.type) {
    case 'start': {
      elements.push({
        type: 'startEvent',
        id,
        name: node.name || '开始',
      })
      return id
    }
    case 'approval': {
      const cfg = node.config || {}
      const attrs: Record<string, string> = {}
      if (cfg.approverType === 'user' && cfg.approvers) {
        attrs['flowable:candidateUsers'] = String(cfg.approvers)
      } else if (cfg.approverType === 'role' && cfg.roles) {
        attrs['flowable:candidateGroups'] = String(cfg.roles)
      } else if (cfg.approverType === 'leader') {
        attrs['flowable:assignee'] = '${leader}'
      } else if (cfg.approverType === 'self') {
        attrs['flowable:assignee'] = '${nextApprover}'
      }
      elements.push({
        type: 'userTask',
        id,
        name: node.name || '审批',
        attrs,
      })
      return id
    }
    case 'cc': {
      const cfg = node.config || {}
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
      })
      return id
    }
    case 'end': {
      const cfg = node.config || {}
      elements.push({
        type: 'endEvent',
        id,
        name: node.name || '结束',
        inner: cfg.ccUsers
          ? `<extensionElements><flowable:field name="ccUsers"><flowable:string>${escapeXml(
              cfg.ccUsers,
            )}</flowable:string></flowable:field></extensionElements>`
          : undefined,
      })
      return id
    }
    case 'condition': {
      elements.push({
        type: 'exclusiveGateway',
        id,
        name: node.name || '条件分支',
      })
      return id
    }
    default:
      return id
  }
}

function mapNodeId(node: FlowNode): string {
  // 用稳定 id 替换非法字符
  return node.id.replace(/[^a-zA-Z0-9_]/g, '_')
}

/**
 * 递归处理节点链：返回当前节点最后一个 element 的 id
 * 调用方负责把上一个节点的 id 与本次返回的 first id 之间建立 sequence flow
 */
function visit(node: FlowNode | undefined, prevId: string | null, condition?: string): string | null {
  if (!node) return prevId
  if (node.type === 'condition' && node.branches && node.branches.length) {
    const gatewayId = buildElement(node)
    if (prevId) {
      flows.push({ id: nextId('flow'), source: prevId, target: gatewayId, condition })
    }
    // 创建一个汇聚网关
    const joinId = nextId('gateway')
    elements.push({ type: 'exclusiveGateway', id: joinId, name: '汇聚' })

    node.branches.forEach((b: FlowNode, _idx: number) => {
      const cond =
        b.config?.expression ||
        `\${branch == '${b.id}'}`
      const branchEnd = visit(b.next, gatewayId, cond)
      // 分支没有 next 节点时直接连到汇聚
      const end = branchEnd || gatewayId
      flows.push({ id: nextId('flow'), source: end, target: joinId })
    })

    // 后续节点从 joinId 继续
    return visit(node.next, joinId)
  } else {
    const curId = buildElement(node)
    if (prevId) {
      flows.push({ id: nextId('flow'), source: prevId, target: curId, condition })
    }
    if (node.type === 'end') return curId
    return visit(node.next, curId)
  }
}

export function flowToBpmnXml(root: FlowNode, processKey = 'processV2', processName = '流程V2'): string {
  elements = []
  flows = []
  counter = 0

  // 如果根不是 start，就强制注入一个 start
  let startNode = root
  if (root.type !== 'start') {
    startNode = {
      id: 'start_auto',
      type: 'start',
      name: '开始',
      config: {},
      next: root,
    }
  }

  visit(startNode, null)

  // 如果没有 endEvent，需补充一个
  const hasEnd = elements.some((e) => e.type === 'endEvent')
  if (!hasEnd) {
    const endId = nextId('end')
    elements.push({ type: 'endEvent', id: endId, name: '结束' })
    // 把所有没有出向流的节点连到 end
    const sources = new Set(flows.map((f) => f.source))
    elements.forEach((el) => {
      if (el.type === 'endEvent') return
      if (!sources.has(el.id)) {
        flows.push({ id: nextId('flow'), source: el.id, target: endId })
      }
    })
  }

  const elXml = elements
    .map((el) => {
      const attrs = Object.entries(el.attrs || {})
        .map(([k, v]) => `${k}="${escapeXml(v)}"`)
        .join(' ')
      const open = `<bpmn:${el.type} id="${el.id}" name="${escapeXml(el.name)}"${attrs ? ' ' + attrs : ''}>`
      const close = `</bpmn:${el.type}>`
      return `${open}${el.inner || ''}${close}`
    })
    .join('\n    ')

  const flowXml = flows
    .map((f) => {
      const cond = f.condition
        ? `<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression"><![CDATA[${f.condition}]]></bpmn:conditionExpression>`
        : ''
      return `<bpmn:sequenceFlow id="${f.id}" sourceRef="${f.source}" targetRef="${f.target}">${cond}</bpmn:sequenceFlow>`
    })
    .join('\n    ')

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
</bpmn:definitions>`
}
