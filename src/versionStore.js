const STORAGE_KEY = 'guoren_version_data';
const DATA_VERSION = 3; // 增加版本号，当默认数据结构变化时递增，自动重置本地存储

// 默认初始数据
const defaultData = {
  versions: [
    {
      id: 'v1',
      name: '版本 1',
      status: 'active', // active=生效中, published=已发布但失效, draft=草稿
      createdAt: '2026-05-07 10:00:00',
      publishedAt: '2026-05-07 12:00:00',
      resources: [
        // ==============================
        // 一级文件夹：第一阶段 · AI基础入门
        // ==============================
        { key: 'm1', name: '第一阶段 · AI基础入门', isFolder: true, parentKey: null, owner: 'zhanghl', lastEdit: '2026-05-07 10:00:00' },
        // -- 二级文件夹：精讲视频课
        { key: 'm1a1', name: '精讲视频课', isFolder: true, parentKey: 'm1', owner: 'zhanghl', lastEdit: '2026-05-07 10:00:00' },
        { key: 'm1a1r1', name: 'AI发展简史与核心概念.mp4', type: 'video', isFolder: false, parentKey: 'm1a1', owner: 'zhanghl', lastEdit: '2026-05-07 10:15:00' },
        { key: 'm1a1r2', name: '机器学习入门讲解.mp4', type: 'video', isFolder: false, parentKey: 'm1a1', owner: 'lisi', lastEdit: '2026-05-07 11:20:00' },
        { key: 'm1a1r3', name: '深度学习基础_神经网络原理.mp4', type: 'video', isFolder: false, parentKey: 'm1a1', owner: 'zhanghl', lastEdit: '2026-05-07 14:30:00' },
        // -- 二级文件夹：直播课
        { key: 'm1a2', name: '直播课', isFolder: true, parentKey: 'm1', owner: 'lisi', lastEdit: '2026-05-06 09:00:00' },
        { key: 'm1a2r1', name: 'AI技术前沿趋势分享直播', type: 'file', isFolder: false, parentKey: 'm1a2', owner: 'lisi', lastEdit: '2026-05-06 09:30:00' },
        { key: 'm1a2r2', name: '课程答疑互动直播', type: 'file', isFolder: false, parentKey: 'm1a2', owner: 'lisi', lastEdit: '2026-05-06 14:00:00' },
        // -- 二级文件夹：课后作业
        { key: 'm1a3', name: '课后作业', isFolder: true, parentKey: 'm1', owner: 'zhanghl', lastEdit: '2026-05-05 16:00:00' },
        { key: 'm1a3r1', name: 'AI概念思维导图作业', type: 'file', isFolder: false, parentKey: 'm1a3', owner: 'zhanghl', lastEdit: '2026-05-05 16:30:00' },
        { key: 'm1a3r2', name: '机器学习算法分类练习', type: 'file', isFolder: false, parentKey: 'm1a3', owner: 'wangwu', lastEdit: '2026-05-05 17:00:00' },

        // ==============================
        // 一级文件夹：第二阶段 · 编程实践
        // ==============================
        { key: 'm2', name: '第二阶段 · 编程实践', isFolder: true, parentKey: null, owner: 'zhanghl', lastEdit: '2026-05-06 08:00:00' },
        // -- 二级文件夹：精讲视频课
        { key: 'm2a1', name: '精讲视频课', isFolder: true, parentKey: 'm2', owner: 'zhanghl', lastEdit: '2026-05-06 08:00:00' },
        { key: 'm2a1r1', name: 'Python编程基础入门.mp4', type: 'video', isFolder: false, parentKey: 'm2a1', owner: 'zhanghl', lastEdit: '2026-05-06 08:30:00' },
        { key: 'm2a1r2', name: '数据处理与可视化实战.mp4', type: 'video', isFolder: false, parentKey: 'm2a1', owner: 'lisi', lastEdit: '2026-05-06 10:00:00' },
        { key: 'm2a1r3', name: '积木编程入门_趣味动画制作.html', type: 'file', isFolder: false, parentKey: 'm2a1', owner: 'zhanghl', lastEdit: '2026-05-06 11:30:00' },
        // -- 二级文件夹：阶段考试
        { key: 'm2a2', name: '阶段考试', isFolder: true, parentKey: 'm2', owner: 'wangwu', lastEdit: '2026-05-05 09:00:00' },
        { key: 'm2a2r1', name: '编程基础能力测试', type: 'exam', isFolder: false, parentKey: 'm2a2', owner: 'wangwu', lastEdit: '2026-05-05 09:30:00' },
        { key: 'm2a2r2', name: '数据分析实操考核', type: 'exam', isFolder: false, parentKey: 'm2a2', owner: 'wangwu', lastEdit: '2026-05-05 10:00:00' },
        // -- 二级文件夹：线下集训
        { key: 'm2a3', name: '线下集训', isFolder: true, parentKey: 'm2', owner: 'zhanghl', lastEdit: '2026-05-04 08:00:00' },
        { key: 'm2a3r1', name: '编程马拉松实训营_Day1', type: 'activity', isFolder: false, parentKey: 'm2a3', owner: 'zhanghl', lastEdit: '2026-05-04 09:00:00' },
        { key: 'm2a3r2', name: '编程马拉松实训营_Day2', type: 'activity', isFolder: false, parentKey: 'm2a3', owner: 'zhanghl', lastEdit: '2026-05-04 17:00:00' },

        // ==============================
        // 一级文件夹：第三阶段 · 项目实战
        // ==============================
        { key: 'm3', name: '第三阶段 · 项目实战', isFolder: true, parentKey: null, owner: 'wangwu', lastEdit: '2026-05-04 10:00:00' },
        // -- 二级文件夹：直播课
        { key: 'm3a1', name: '直播课', isFolder: true, parentKey: 'm3', owner: 'lisi', lastEdit: '2026-05-04 10:00:00' },
        { key: 'm3a1r1', name: '项目架构设计直播', type: 'file', isFolder: false, parentKey: 'm3a1', owner: 'lisi', lastEdit: '2026-05-04 10:30:00' },
        { key: 'm3a1r2', name: '代码评审与最佳实践直播', type: 'file', isFolder: false, parentKey: 'm3a1', owner: 'lisi', lastEdit: '2026-05-04 14:00:00' },
        // -- 二级文件夹：课题研讨
        { key: 'm3a2', name: '课题研讨', isFolder: true, parentKey: 'm3', owner: 'wangwu', lastEdit: '2026-05-03 09:00:00' },
        { key: 'm3a2r1', name: '智能客服系统设计方案', type: 'file', isFolder: false, parentKey: 'm3a2', owner: 'wangwu', lastEdit: '2026-05-03 10:00:00' },
        { key: 'm3a2r2', name: '图像识别应用场景研讨', type: 'file', isFolder: false, parentKey: 'm3a2', owner: 'zhanghl', lastEdit: '2026-05-03 14:00:00' },
        { key: 'm3a2r3', name: '小组课题答辩准备材料', type: 'file', isFolder: false, parentKey: 'm3a2', owner: 'lisi', lastEdit: '2026-05-03 16:30:00' },
        // -- 二级文件夹：结业考核
        { key: 'm3a3', name: '结业考核', isFolder: true, parentKey: 'm3', owner: 'wangwu', lastEdit: '2026-05-02 10:00:00' },
        { key: 'm3a3r1', name: '综合项目答辩', type: 'exam', isFolder: false, parentKey: 'm3a3', owner: 'wangwu', lastEdit: '2026-05-02 10:30:00' },
        { key: 'm3a3r2', name: '个人技术报告提交', type: 'file', isFolder: false, parentKey: 'm3a3', owner: 'wangwu', lastEdit: '2026-05-02 15:00:00' },
      ],
    },
  ],
  currentVersionId: 'v1',
};

// 从 localStorage 加载数据
export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._dataVersion === DATA_VERSION) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load version data from localStorage:', e);
  }
  // 版本不匹配或无数据，初始化并写入
  const initial = { ...defaultData, _dataVersion: DATA_VERSION };
  saveToStorage(initial);
  return initial;
}

// 保存到 localStorage
export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save version data to localStorage:', e);
  }
}

// 获取所有版本
export function getVersions(data) {
  return data.versions;
}

// 获取当前版本
export function getCurrentVersion(data) {
  return data.versions.find((v) => v.id === data.currentVersionId) || data.versions[0];
}

// 获取当前生效版本（最新的 active 状态版本）
export function getActiveVersion(data) {
  return data.versions.find((v) => v.status === 'active') || null;
}

// 最大版本数量
const MAX_VERSIONS = 5;

// 新建版本（继承当前生效版本的资料）
export function createNewVersion(data) {
  if (data.versions.length >= MAX_VERSIONS) {
    return { ...data, error: `最多支持 ${MAX_VERSIONS} 个版本，请删除旧版本后再创建` };
  }

  const activeVersion = data.versions.find((v) => v.status === 'active');
  const inheritedResources = activeVersion
    ? activeVersion.resources.map((r) => ({ ...r, key: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }))
    : [];

  const newVersion = {
    id: `v${Date.now()}`,
    name: `版本 ${data.versions.length + 1}`,
    status: 'draft',
    createdAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
    publishedAt: null,
    resources: inheritedResources,
  };

  const newData = {
    ...data,
    versions: [...data.versions, newVersion],
    currentVersionId: newVersion.id,
  };
  saveToStorage(newData);
  return newData;
}

// 发布版本（新发布的版本变为 active，之前的 active 变为 published/失效）
export function publishVersion(data, versionId) {
  const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-');
  const newData = {
    ...data,
    versions: data.versions.map((v) => {
      if (v.id === versionId) {
        return { ...v, status: 'active', publishedAt: now };
      }
      // 之前生效的版本降为 published（已失效）
      if (v.status === 'active') {
        return { ...v, status: 'published' };
      }
      return v;
    }),
  };
  saveToStorage(newData);
  return newData;
}

// 添加资料（仅 draft，支持指定 parentKey）
export function addResource(data, versionId, resource) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!version || version.status !== 'draft') return data;

  const newResource = {
    ...resource,
    key: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    isFolder: resource.isFolder || false,
    parentKey: resource.parentKey || null,
    owner: 'zhanghl',
    lastEdit: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
  };

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId ? { ...v, resources: [...v.resources, newResource] } : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

// 更新资料（仅 draft）
export function updateResource(data, versionId, resourceKey, updates) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!version || version.status !== 'draft') return data;

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? {
            ...v,
            resources: v.resources.map((r) =>
              r.key === resourceKey
                ? { ...r, ...updates, lastEdit: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-') }
                : r
            ),
          }
        : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

// 删除资料（仅 draft，删除文件夹时递归级联删除所有后代）
export function deleteResource(data, versionId, resourceKey) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!version || version.status !== 'draft') return data;

  // 递归收集要删除的 key
  const keysToDelete = new Set();
  function collectKeys(key) {
    keysToDelete.add(key);
    version.resources.forEach((r) => {
      if (r.parentKey === key) collectKeys(r.key);
    });
  }
  collectKeys(resourceKey);

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? { ...v, resources: v.resources.filter((r) => !keysToDelete.has(r.key)) }
        : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

// 切换当前版本
export function switchVersion(data, versionId) {
  const newData = { ...data, currentVersionId: versionId };
  saveToStorage(newData);
  return newData;
}

// 回退版本：将指定的已发布版本重新设为生效，当前生效的版本降为已发布
export function rollbackVersion(data, targetVersionId) {
  const targetVersion = data.versions.find((v) => v.id === targetVersionId);
  if (!targetVersion || targetVersion.status === 'draft') return data;

  const newData = {
    ...data,
    currentVersionId: targetVersionId,
    versions: data.versions.map((v) => {
      if (v.id === targetVersionId) {
        return { ...v, status: 'active' };
      }
      if (v.status === 'active') {
        return { ...v, status: 'published' };
      }
      return v;
    }),
  };
  saveToStorage(newData);
  return newData;
}
