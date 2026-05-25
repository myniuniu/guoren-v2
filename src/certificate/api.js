import axios from 'axios';

const api = axios.create({ baseURL: '/api/certificate' });

export const templateApi = {
  list: (params) => api.get('/template/list', { params }).then((r) => r.data),
  detail: (id) => api.get(`/template/${id}`).then((r) => r.data),
  create: (data) => api.post('/template', data).then((r) => r.data),
  update: (id, data) => api.put(`/template/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/template/${id}`).then((r) => r.data),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  /** 单张渲染（PNG/JPG/PDF），返回 Blob，由调用方决定 mime */
  render: (body) => api.post('/issue/render', body, { responseType: 'blob' }).then((r) => r.data),
  /** 批量渲染：返回 [{ name, base64, mime }] */
  renderBatch: (body) => api.post('/issue/render-batch', body).then((r) => r.data),
  /** 批量打包 ZIP（PNG/JPG/PDF） */
  renderZip: (body) => api.post('/issue/render-zip', body, { responseType: 'blob' }).then((r) => r.data),
  /** Excel 解析为 dataList */
  parseExcel: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post('/issue/parse-excel', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  /** 模版 JSON 导出（D3） */
  exportTpl: (id) => api.get(`/template/${id}/export`, { responseType: 'blob' }).then((r) => r.data),
  /** 模版 JSON 导入（D3） */
  importTpl: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post('/template/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

export const fontApi = {
  recommend: () => api.get('/font/recommend').then((r) => r.data),
  check: (fonts) => api.post('/font/check', { fonts }).then((r) => r.data),
};

export const versionApi = {
  snapshot: (templateId, comment) => api.post('/version/snapshot', { templateId, comment }).then((r) => r.data),
  list: (templateId) => api.get('/version/list', { params: { templateId } }).then((r) => r.data),
  detail: (templateId, versionNo) => api.get('/version/detail', { params: { templateId, versionNo } }).then((r) => r.data),
  rollback: (templateId, versionNo) => api.post('/version/rollback', { templateId, versionNo }).then((r) => r.data),
};

export const seqApi = {
  list: () => api.get('/seq/list').then((r) => r.data),
  get: (ruleKey) => api.get(`/seq/${encodeURIComponent(ruleKey)}`).then((r) => r.data),
  save: (ruleKey, rulePattern) => api.post('/seq/save', { ruleKey, rulePattern }).then((r) => r.data),
  remove: (ruleKey) => api.delete(`/seq/${encodeURIComponent(ruleKey)}`).then((r) => r.data),
  reset: (ruleKey, currentSeq = 0) => api.post('/seq/reset', { ruleKey, currentSeq }).then((r) => r.data),
  next: (ruleKey) => api.post('/seq/next', { ruleKey }).then((r) => r.data),
  peek: (ruleKey) => api.get('/seq/peek', { params: { ruleKey } }).then((r) => r.data),
};

/** 证书发放批次 + 明细 CRUD（v1.2） */
export const issueApi = {
  /** 创建发放批次（同时调用后端渲染并落库） */
  createBatch: (body) => api.post('/issue/batch/create', body).then((r) => r.data),
  /** 批次分页列表 */
  pageBatch: (params) => api.get('/issue/batch/page', { params }).then((r) => r.data),
  /** 批次详情 */
  getBatch: (id) => api.get(`/issue/batch/${id}`).then((r) => r.data),
  /** 修改批次（batchName / remark） */
  updateBatch: (id, body) => api.put(`/issue/batch/${id}`, body).then((r) => r.data),
  /** 删除批次（连同明细） */
  removeBatch: (id) => api.delete(`/issue/batch/${id}`).then((r) => r.data),

  /** 明细分页 */
  pageRecord: (params) => api.get('/issue/record/page', { params }).then((r) => r.data),
  /** 明细详情 */
  getRecord: (id) => api.get(`/issue/record/${id}`).then((r) => r.data),
  /** 明细对应证书文件（预览或下载） */
  recordFile: (id, disposition = 'inline') =>
    api
      .get(`/issue/record/${id}/file`, {
        params: { disposition },
        responseType: 'blob',
      })
      .then((r) => r.data),
  /** 重新渲染 */
  rerender: (id) => api.post(`/issue/record/${id}/rerender`).then((r) => r.data),
  /** 删除明细 */
  removeRecord: (id) => api.delete(`/issue/record/${id}`).then((r) => r.data),
};

/** 把后端相对路径转成可访问的绝对 URL（走 vite 代理） */
export const toAbsoluteUrl = (relative) => {
  if (!relative) return '';
  if (relative.startsWith('http://') || relative.startsWith('https://') || relative.startsWith('data:')) {
    return relative;
  }
  return relative.startsWith('/') ? relative : '/' + relative;
};

/** 触发文件下载 */
export const triggerDownload = (blobOrUrl, filename) => {
  let url;
  if (blobOrUrl instanceof Blob) url = URL.createObjectURL(blobOrUrl);
  else url = blobOrUrl;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (blobOrUrl instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 2000);
};
