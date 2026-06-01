import axios from 'axios';

/**
 * DMS 文档管理 API
 *
 * 后端：com.guoren.workflow.dms.controller.*
 * 文件上传复用通用接口 /api/file/upload?biz=dms
 */
const http = axios.create({ baseURL: '/api/dms' });

export const dmsApi = {
  /** 创建文档 */
  create: (data) => http.post('/document', data).then((r) => r.data),

  /** 更新文档 */
  update: (id, data) => http.put(`/document/${id}`, data).then((r) => r.data),

  /** 详情 */
  detail: (id) => http.get(`/document/${id}`).then((r) => r.data),

  /** 分页列表 */
  list: (params = {}) => http.get('/document/list', { params }).then((r) => r.data),

  /** 软删除 */
  remove: (id) => http.delete(`/document/${id}`).then((r) => r.data),

  /** 批量移动到分类（categoryId 为空 / 空字符串 = 移动到未分类） */
  bulkMove: (ids, categoryId) =>
    http.post('/document/bulk-move', { ids, categoryId: categoryId || '' }).then((r) => r.data),

  /** 版本列表 */
  versions: (id) => http.get(`/document/${id}/versions`).then((r) => r.data),

  /** 回滚到指定版本 */
  rollback: (id, versionId, operator) =>
    http
      .post(`/document/${id}/rollback/${versionId}`, null, { params: { operator } })
      .then((r) => r.data),
};

export const dmsCategoryApi = {
  /** 分类树（含 docCount） */
  tree: () => http.get('/category/tree').then((r) => r.data),

  /** 新建分类 */
  create: (data) => http.post('/category', data).then((r) => r.data),

  /** 更新（重命名 / 排序） */
  update: (id, data) => http.put(`/category/${id}`, data).then((r) => r.data),

  /** 移动到新父节点 */
  move: (id, parentId) =>
    http.post(`/category/${id}/move`, { parentId: parentId || null }).then((r) => r.data),

  /** 删除（含子分类下无文档时方可） */
  remove: (id) => http.delete(`/category/${id}`).then((r) => r.data),
};

export const dmsTagApi = {
  /** 全部标签（默认按使用频次倒序） */
  list: (orderBy = 'usage') =>
    http.get('/tag/list', { params: { orderBy } }).then((r) => r.data),
};

export const dmsWorkflowApi = {
  /** 提交审批（applicant 为提交人 id） */
  submit: (docId, applicant) =>
    http.post(`/workflow/submit/${docId}`, { applicant }).then((r) => r.data),

  /** 审批 */
  approve: (payload) =>
    http.post('/workflow/approve', payload).then((r) => r.data),

  /** 我的待办 */
  pending: (assignee) =>
    http.get('/workflow/pending', { params: { assignee } }).then((r) => r.data),

  /** 文档审批历史 */
  history: (docId) =>
    http.get(`/workflow/history/${docId}`).then((r) => {
      // 204 No Content -> r.data === ''
      return r.data && typeof r.data === 'object' ? r.data : null;
    }),
};

// 文档类型
export const DMS_DOC_TYPES = [
  { value: 'policy', label: '制度文件' },
  { value: 'contract', label: '合同协议' },
  { value: 'report', label: '报告文档' },
  { value: 'design', label: '设计稿' },
  { value: 'other', label: '其他' },
];

export const DMS_DOC_TYPE_MAP = DMS_DOC_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

// 状态映射
export const DMS_STATUS_MAP = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING: { label: '待审批', color: 'processing' },
  PUBLISHED: { label: '已发布', color: 'success' },
  REJECTED: { label: '已拒绝', color: 'error' },
  ARCHIVED: { label: '已归档', color: 'warning' },
};

// 文件大小友好显示
export function formatFileSize(bytes) {
  if (bytes == null) return '-';
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '-';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

export default dmsApi;
