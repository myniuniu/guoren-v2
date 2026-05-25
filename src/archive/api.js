/**
 * 档案提交模块 API（基于 localStorage 模拟工作流审批）
 *
 * 流程：草稿 → 提交审批 → 主管审批 → 存入资料库（组织资料）
 */
import { loadResourceLib, saveResourceLib, inferFileType } from '../resourceLib/resourceLibStore';

const STORAGE_KEY = 'guoren_archive_submissions';

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

// ====== 档案类型 ======
export const ARCHIVE_TYPES = [
  { value: 'id_card', label: '身份证件' },
  { value: 'education', label: '学历证书' },
  { value: 'qualification', label: '资格证书' },
  { value: 'contract', label: '劳动合同' },
  { value: 'training', label: '培训记录' },
  { value: 'resume', label: '个人简历' },
  { value: 'other', label: '其他' },
];

export const ARCHIVE_TYPE_MAP = {
  id_card: { label: '身份证件', color: 'blue' },
  education: { label: '学历证书', color: 'green' },
  qualification: { label: '资格证书', color: 'purple' },
  contract: { label: '劳动合同', color: 'orange' },
  training: { label: '培训记录', color: 'cyan' },
  resume: { label: '个人简历', color: 'magenta' },
  other: { label: '其他', color: 'default' },
};

export const ARCHIVE_STATUS_MAP = {
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审批', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
};

// ====== 数据存取 ======
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Load archive data error:', e);
  }
  return [];
}

function saveData(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ====== API 方法 ======
export const archiveApi = {
  /** 获取我的档案提交列表 */
  getMyList: (applicant) => {
    const list = loadData();
    return Promise.resolve(
      list
        .filter((r) => !applicant || r.applicant === applicant)
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    );
  },

  /** 获取待审批列表（审批人可见所有 pending 状态） */
  getPendingList: () => {
    const list = loadData();
    return Promise.resolve(
      list
        .filter((r) => r.status === 'pending')
        .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
    );
  },

  /** 创建草稿 */
  create: (data) => {
    const list = loadData();
    const item = {
      id: 'arc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      ...data,
      status: 'draft',
      createTime: now(),
      updateTime: now(),
    };
    list.push(item);
    saveData(list);
    return Promise.resolve(item);
  },

  /** 更新草稿 */
  update: (id, data) => {
    const list = loadData();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return Promise.reject(new Error('记录不存在'));
    if (list[idx].status !== 'draft') return Promise.reject(new Error('仅草稿可编辑'));
    list[idx] = { ...list[idx], ...data, updateTime: now() };
    saveData(list);
    return Promise.resolve(list[idx]);
  },

  /** 删除草稿 */
  delete: (id) => {
    const list = loadData();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return Promise.resolve();
    if (list[idx].status !== 'draft') return Promise.reject(new Error('仅草稿可删除'));
    list.splice(idx, 1);
    saveData(list);
    return Promise.resolve();
  },

  /** 提交审批 */
  submit: (id) => {
    const list = loadData();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return Promise.reject(new Error('记录不存在'));
    if (list[idx].status !== 'draft') return Promise.reject(new Error('仅草稿可提交'));
    list[idx].status = 'pending';
    list[idx].submitTime = now();
    list[idx].updateTime = now();
    saveData(list);
    return Promise.resolve(list[idx]);
  },

  /** 审批操作 */
  approve: (id, approved, comment) => {
    const list = loadData();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return Promise.reject(new Error('记录不存在'));
    if (list[idx].status !== 'pending') return Promise.reject(new Error('非待审批状态'));
    list[idx].status = approved ? 'approved' : 'rejected';
    list[idx].approveComment = comment || '';
    list[idx].approveTime = now();
    list[idx].updateTime = now();
    saveData(list);

    // 审批通过 → 存入资料库（组织资料）
    if (approved && list[idx].attachments?.length) {
      try {
        const resLib = loadResourceLib();
        const orgList = resLib.organization || [];
        // 确保有"员工档案"文件夹
        let archiveFolder = orgList.find(
          (f) => f.isFolder && f.name === '员工档案' && f.parentKey === null
        );
        if (!archiveFolder) {
          archiveFolder = {
            key: 'o_archive_root',
            name: '员工档案',
            isFolder: true,
            parentKey: null,
            fileType: 'folder',
            owner: 'system',
            parseStatus: 'parsed',
            lastEdit: now(),
          };
          orgList.push(archiveFolder);
        }
        // 将附件存入该文件夹
        for (const att of list[idx].attachments) {
          orgList.push({
            key: 'o_arc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            name: att.fileName || att.name || '未命名文件',
            isFolder: false,
            parentKey: archiveFolder.key,
            fileType: inferFileType(att.fileName || att.name || ''),
            owner: list[idx].applicantName || list[idx].applicant,
            parseStatus: 'parsed',
            lastEdit: now(),
            url: att.url,
            size: att.size,
            mime: att.mime,
          });
        }
        resLib.organization = orgList;
        saveResourceLib(resLib);
      } catch (e) {
        console.error('存入资料库失败:', e);
      }
    }

    return Promise.resolve(list[idx]);
  },
};

export default archiveApi;
