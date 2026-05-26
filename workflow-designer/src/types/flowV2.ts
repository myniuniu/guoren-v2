export type NodeType = 'start' | 'approval' | 'cc' | 'condition' | 'end' | 'branch'

export interface FlowNode {
  id: string
  type: NodeType
  name: string
  config: Record<string, any>
  next?: FlowNode
  branches?: FlowNode[]
}
