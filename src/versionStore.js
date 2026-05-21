const STORAGE_KEY = 'guoren_version_data';

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
        { key: 'r1', name: '人工智能通识讲解课堂', type: 'file', owner: 'zhanghl', lastEdit: '2026-05-07 16:24:23' },
        { key: 'r2', name: '积木编程_第一课.html', type: 'file', owner: 'zhanghl', lastEdit: '2026-05-07 18:23:38' },
        { key: 'r3', name: '9分钟搞定！Claude Code 保姆级安装+原理+真实用法（国内直连）', type: 'video', owner: 'zhanghl', lastEdit: '2026-05-07 13:40:47' },
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
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load version data from localStorage:', e);
  }
  return { ...defaultData };
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

// 添加资料（仅 draft）
export function addResource(data, versionId, resource) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!version || version.status !== 'draft') return data;

  const newResource = {
    ...resource,
    key: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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

// 删除资料（仅 draft）
export function deleteResource(data, versionId, resourceKey) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!version || version.status !== 'draft') return data;

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? { ...v, resources: v.resources.filter((r) => r.key !== resourceKey) }
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
