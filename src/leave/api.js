/**
 * 请假模块 API 客户端
 */
const BASE = '/api/workflow/leave';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const leaveModuleApi = {
  // 草稿 CRUD
  listDrafts: (applicant) =>
    request(`/drafts${applicant ? `?applicant=${encodeURIComponent(applicant)}` : ''}`),
  createDraft: (data) =>
    request('/draft', { method: 'POST', body: JSON.stringify(data) }),
  updateDraft: (id, data) =>
    request(`/draft/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDraft: (id) =>
    request(`/draft/${id}`, { method: 'DELETE' }),
  submitDraft: (id) =>
    request(`/draft/${id}/submit`, { method: 'POST' }),

  // 流程相关（复用现有接口）
  getMyRequests: (applicant) =>
    request(`/my-requests?applicant=${encodeURIComponent(applicant)}`),
  getPending: (assignee) =>
    request(`/pending?assignee=${encodeURIComponent(assignee)}`),
  approve: (data) =>
    request('/approve', { method: 'POST', body: JSON.stringify(data) }),
  getProcessHistory: (processInstanceId) =>
    request(`/process-history/${encodeURIComponent(processInstanceId)}`),
  getProcessDiagram: (processInstanceId) =>
    request(`/process-diagram/${encodeURIComponent(processInstanceId)}`),
};
