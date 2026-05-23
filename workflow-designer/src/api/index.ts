import axios from 'axios'

const api = axios.create({
  baseURL: '/api/workflow/process',
  headers: { 'Content-Type': 'application/json' },
})

/** 流程定义信息 */
export interface ProcessDefinitionVO {
  id: string
  key: string
  name: string
  version: number
  deploymentId: string
  resourceName: string
  suspensionState: number
}

/** 部署请求 */
export interface DeployRequest {
  name: string
  xml: string
}

/** 流程管理 API */
export const processApi = {
  /** 获取流程定义列表 */
  list: () => api.get<ProcessDefinitionVO[]>('/list'),

  /** 根据流程key获取最新版本 */
  getByKey: (key: string) => api.get<ProcessDefinitionVO>('/key/' + key),

  /** 获取流程XML */
  getXml: (deploymentId: string) =>
    api.get('/xml/' + deploymentId, { responseType: 'text' }),

  /** 部署流程定义 */
  deploy: (data: DeployRequest) => api.post('/deploy', data),

  /** 删除流程定义 */
  remove: (deploymentId: string) => api.delete('/' + deploymentId),
}
