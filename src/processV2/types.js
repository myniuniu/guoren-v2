/**
 * 公共类型定义（JSDoc）
 *
 * @typedef {'start' | 'approval' | 'cc' | 'condition' | 'end' | 'branch'} NodeType
 *
 * @typedef {Object} FlowNode
 * @property {string} id
 * @property {NodeType} type
 * @property {string} name
 * @property {Object} config
 * @property {FlowNode} [next]
 * @property {FlowNode[]} [branches]
 *
 * @typedef {Object} FieldSchema
 * @property {string} id
 * @property {string} type - 字段类型（input/textarea/inputNumber/radio/checkbox/datePicker/dateRange/upload/tableForm/alert）
 * @property {string} label - 字段标题
 * @property {Object} props - 字段属性（placeholder/required/options 等）
 */

/** 生成随机 id */
export function genId() {
  return 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 创建默认流程 */
export function createDefaultFlow() {
  const endNode = { id: genId(), type: 'end', name: '结束', config: { ccUsers: '' } };
  const approvalNode = {
    id: genId(),
    type: 'approval',
    name: '审批人',
    config: { approverType: 'self', multiMode: 'any' },
    next: endNode,
  };
  return {
    id: genId(),
    type: 'start',
    name: '提交',
    config: { submitterType: 'all' },
    next: approvalNode,
  };
}
