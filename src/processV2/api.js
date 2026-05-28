/** Process V2 API */

const PROCESS_API = '/api/workflow/process';
const CONFIG_API = '/api/workflow/process-config';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    // 尝试从 Spring Boot 默认错误 JSON 中提取 message 字段，否则用原始文本
    let msg = text || res.statusText;
    try {
      const errJson = JSON.parse(text);
      msg = errJson.message || errJson.error || errJson.msg || text;
    } catch { /* not JSON, use raw text */ }
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** 流程定义 API（Flowable 原生） */
export const processV2Api = {
  list: () => request(`${PROCESS_API}/list`),
  getByKey: (key) => request(`${PROCESS_API}/key/${encodeURIComponent(key)}`),
  getXml: (deploymentId) => request(`${PROCESS_API}/xml/${deploymentId}`),
  deploy: ({ name, xml }) =>
    request(`${PROCESS_API}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ name, xml }),
    }),
};

/** 流程配置 API（流程设计 V2 配套，后端数据库存储） */
export const processConfigApi = {
  /** 获取所有流程配置列表 */
  list: () => request(`${CONFIG_API}/list`),

  /** 根据 processKey 获取最新配置（草稿） */
  getByKey: (processKey) => request(`${CONFIG_API}/key/${encodeURIComponent(processKey)}`),

  /** 获取指定版本快照 */
  getVersion: (processKey, version) =>
    request(`${CONFIG_API}/key/${encodeURIComponent(processKey)}/version/${version}`),

  /** 获取所有版本列表 */
  listVersions: (processKey) =>
    request(`${CONFIG_API}/key/${encodeURIComponent(processKey)}/versions`),

  /** 保存草稿（创建或更新） */
  save: (data) =>
    request(`${CONFIG_API}/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 发布（生成版本快照 + 部署 BPMN 到 Flowable） */
  publish: (data) =>
    request(`${CONFIG_API}/publish`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 删除流程配置（逻辑删除） */
  remove: (processKey) =>
    request(`${CONFIG_API}/key/${encodeURIComponent(processKey)}`, {
      method: 'DELETE',
    }),

  /** 回滚草稿到指定版本 */
  rollback: (processKey, version) =>
    request(`${CONFIG_API}/key/${encodeURIComponent(processKey)}/rollback/${version}`, {
      method: 'POST',
    }),
};
