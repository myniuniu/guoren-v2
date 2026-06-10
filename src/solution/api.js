import axios from 'axios';

const tenantHttp = axios.create({ baseURL: '/api/tenant' });
const solutionHttp = axios.create({ baseURL: '/api/solution' });

export const tenantApi = {
  list: (params = {}) => tenantHttp.get('/list', { params }).then((r) => r.data),
  detail: (id) => tenantHttp.get(`/${id}`).then((r) => r.data),
  create: (data) => tenantHttp.post('', data).then((r) => r.data),
  update: (id, data) => tenantHttp.put(`/${id}`, data).then((r) => r.data),
  remove: (id) => tenantHttp.delete(`/${id}`).then((r) => r.data),
};

export const solutionCatalogApi = {
  list: (params = {}) => solutionHttp.get('/apps', { params }).then((r) => r.data),
  detail: (id) => solutionHttp.get(`/apps/${id}`).then((r) => r.data),
  create: (data) => solutionHttp.post('/apps', data).then((r) => r.data),
  update: (id, data) => solutionHttp.put(`/apps/${id}`, data).then((r) => r.data),
  remove: (id) => solutionHttp.delete(`/apps/${id}`).then((r) => r.data),
};

export const solutionApi = {
  list: (params = {}) => solutionHttp.get('/list', { params }).then((r) => r.data),
  detail: (id) => solutionHttp.get(`/${id}`).then((r) => r.data),
  create: (data) => solutionHttp.post('', data).then((r) => r.data),
  update: (id, data) => solutionHttp.put(`/${id}`, data).then((r) => r.data),
  remove: (id) => solutionHttp.delete(`/${id}`).then((r) => r.data),
  updateApps: (id, apps) => solutionHttp.put(`/${id}/apps`, apps).then((r) => r.data),
  updateAppConfigs: (id, solutionAppId, configs) =>
    solutionHttp.put(`/${id}/apps/${solutionAppId}/configs`, configs).then((r) => r.data),
};

export const TENANT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

export const APP_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

export const SOLUTION_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'ACTIVE', label: '生效中' },
  { value: 'DISABLED', label: '停用' },
];

export const DEPLOY_STATUS_OPTIONS = [
  { value: 'TODO', label: '待实施' },
  { value: 'IN_PROGRESS', label: '实施中' },
  { value: 'DONE', label: '已完成' },
  { value: 'BLOCKED', label: '已阻塞' },
];

export const CONFIG_VALUE_TYPE_OPTIONS = [
  { value: 'STRING', label: '字符串' },
  { value: 'NUMBER', label: '数字' },
  { value: 'BOOLEAN', label: '布尔值' },
  { value: 'SELECT', label: '枚举选择' },
  { value: 'PASSWORD', label: '密文' },
  { value: 'URL', label: '地址' },
  { value: 'JSON', label: 'JSON' },
];
