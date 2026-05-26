import axios from 'axios';

/**
 * 数据管理 API：对接后端 /api/datamanage，支持 H2 / MySQL（视后端 datasource 而定）。
 */
const http = axios.create({ baseURL: '/api/datamanage' });

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.message || err?.message || '请求失败';
    return Promise.reject(new Error(msg));
  },
);

export const dataManageApi = {
  // 数据源信息
  getDataSource: () => http.get('/datasource').then((r) => r.data),

  // 表
  listTables: () => http.get('/tables').then((r) => r.data),
  createTable: (payload) => http.post('/tables', payload).then((r) => r.data),
  dropTable: (name) => http.delete(`/tables/${encodeURIComponent(name)}`).then((r) => r.data),
  renameTable: (name, newName) =>
    http.post(`/tables/${encodeURIComponent(name)}/rename`, { newName }).then((r) => r.data),

  // 列
  listColumns: (name) => http.get(`/tables/${encodeURIComponent(name)}/columns`).then((r) => r.data),
  addColumn: (name, column) =>
    http.post(`/tables/${encodeURIComponent(name)}/columns`, column).then((r) => r.data),
  dropColumn: (name, column) =>
    http
      .delete(`/tables/${encodeURIComponent(name)}/columns/${encodeURIComponent(column)}`)
      .then((r) => r.data),
  renameColumn: (name, column, newName) =>
    http
      .post(`/tables/${encodeURIComponent(name)}/columns/${encodeURIComponent(column)}/rename`, { newName })
      .then((r) => r.data),

  // 行
  listRows: (name, params = {}) => {
    const { page = 1, pageSize = 50, keyword, sortBy, sortDir, filters } = params;
    const q = { page, pageSize };
    if (keyword) q.keyword = keyword;
    if (sortBy) q.sortBy = sortBy;
    if (sortDir) q.sortDir = sortDir;
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q[`filter.${k}`] = v;
      });
    }
    return http.get(`/tables/${encodeURIComponent(name)}/rows`, { params: q }).then((r) => r.data);
  },
  insertRow: (name, data) =>
    http.post(`/tables/${encodeURIComponent(name)}/rows`, data).then((r) => r.data),
  updateRow: (name, id, data) =>
    http.put(`/tables/${encodeURIComponent(name)}/rows/${encodeURIComponent(id)}`, data).then((r) => r.data),
  deleteRow: (name, id) =>
    http.delete(`/tables/${encodeURIComponent(name)}/rows/${encodeURIComponent(id)}`).then((r) => r.data),
  batchDeleteRows: (name, ids) =>
    http.post(`/tables/${encodeURIComponent(name)}/rows/batch-delete`, { ids }).then((r) => r.data),
  truncate: (name) => http.post(`/tables/${encodeURIComponent(name)}/truncate`).then((r) => r.data),

  // 导入导出
  exportCsvUrl: (name) => `/api/datamanage/tables/${encodeURIComponent(name)}/export`,
  importCsv: (name, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http
      .post(`/tables/${encodeURIComponent(name)}/import`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

export default dataManageApi;
