const API_BASE = '/api/workflow/leave';

const request = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

export const leaveApi = {
  /** 提交请假申请 */
  submit: (data) => request('/submit', { method: 'POST', body: JSON.stringify(data) }),

  /** 获取待办任务 */
  getPending: (assignee) => request(`/pending?assignee=${encodeURIComponent(assignee)}`),

  /** 审批操作 */
  approve: (data) => request('/approve', { method: 'POST', body: JSON.stringify(data) }),

  /** 获取我的请假申请 */
  getMyRequests: (applicant) => request(`/my-requests?applicant=${encodeURIComponent(applicant)}`),

  /** 获取流程详情 */
  getDetail: (processInstanceId) => request(`/detail/${processInstanceId}`),

  /** 获取用户列表 */
  getUsers: () => request('/users'),
};
