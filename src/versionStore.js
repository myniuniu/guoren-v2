import { formatVersionName, normalizeVersioningConfig } from './scene/store';

const STORAGE_KEY = 'guoren_version_data';
const DATA_VERSION = 8; // 增加版本号，当默认数据结构变化时递增，自动重置本地存储
const STORE_CHANGE_EVENT = 'gr:version-store-change';

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function resolveStorageKey(scopeKey = 'default') {
  return scopeKey === 'default' ? STORAGE_KEY : `${STORAGE_KEY}:${scopeKey}`;
}

function emitChange(storageKey) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT, {
    detail: { storageKey },
  }));
}

function withRuntimeMeta(data, storageKey) {
  return {
    ...data,
    _dataVersion: DATA_VERSION,
    _storageKey: storageKey,
  };
}

function nowText() {
  return new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');
}

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
      assessment: {
        totalHours: 15,
        passScore: 60,
        certificate: true,
        rules: [
          { key: 'ar1', folderKey: 'm1a1', folderName: '第一阶段 · AI基础入门 / 精讲视频课', activityType: 'video', weight: 20, passCondition: { metric: '完成率', op: '>=', value: 80 }, required: true },
          { key: 'ar2', folderKey: 'm1a2', folderName: '第一阶段 · AI基础入门 / 直播课', activityType: 'live', weight: 10, passCondition: { metric: '出勤率', op: '>=', value: 90 }, required: true },
          { key: 'ar3', folderKey: 'm1a3', folderName: '第一阶段 · AI基础入门 / 课后作业', activityType: 'other', weight: 5, passCondition: { metric: '提交率', op: '=', value: 100 }, required: false },
          { key: 'ar4', folderKey: 'm2a1', folderName: '第二阶段 · 编程实践 / 精讲视频课', activityType: 'video', weight: 15, passCondition: { metric: '完成率', op: '>=', value: 80 }, required: true },
          { key: 'ar5', folderKey: 'm2a2', folderName: '第二阶段 · 编程实践 / 阶段考试', activityType: 'exam', weight: 15, passCondition: { metric: '分数', op: '>=', value: 60 }, required: true },
          { key: 'ar6', folderKey: 'm2a3', folderName: '第二阶段 · 编程实践 / 线下集训', activityType: 'offline', weight: 5, passCondition: { metric: '出勤率', op: '>=', value: 80 }, required: false },
          { key: 'ar7', folderKey: 'm3a1', folderName: '第三阶段 · 项目实战 / 直播课', activityType: 'live', weight: 5, passCondition: { metric: '出勤率', op: '>=', value: 90 }, required: true },
          { key: 'ar8', folderKey: 'm3a2', folderName: '第三阶段 · 项目实战 / 课题研讨', activityType: 'other', weight: 5, passCondition: { metric: '提交率', op: '=', value: 100 }, required: false },
          { key: 'ar9', folderKey: 'm3a3', folderName: '第三阶段 · 项目实战 / 结业考核', activityType: 'exam', weight: 20, passCondition: { metric: '分数', op: '>=', value: 60 }, required: true },
        ],
      },
      assessmentChat: [],
      knowledgeGraphRef: null,
    },
  ],
  currentVersionId: 'v1',
};

function normalizeKnowledgeGraphRef(ref) {
  if (!ref || typeof ref !== 'object') return null;
  if (!ref.knowledgeGraphId && !ref.resourceKey) return null;
  return {
    resourceKey: ref.resourceKey || '',
    knowledgeGraphId: ref.knowledgeGraphId || '',
    libraryId: ref.libraryId || '',
    name: ref.name || '',
  };
}

function normalizeVersionRecord(version = {}) {
  return {
    ...version,
    resources: Array.isArray(version.resources) ? version.resources : [],
    assessment: version.assessment || buildEmptyAssessment(),
    assessmentChat: Array.isArray(version.assessmentChat) ? version.assessmentChat : [],
    tagDefinitions: Array.isArray(version.tagDefinitions) ? version.tagDefinitions : [],
    tagGroups: Array.isArray(version.tagGroups) ? version.tagGroups : [],
    knowledgeGraphRef: normalizeKnowledgeGraphRef(version.knowledgeGraphRef),
  };
}

function normalizeVersionStoreData(data = {}) {
  return {
    ...data,
    versions: Array.isArray(data.versions) ? data.versions.map(normalizeVersionRecord) : [],
    currentVersionId: data.currentVersionId || data.versions?.[0]?.id || 'v1',
  };
}

// 从 localStorage 加载数据
export function loadFromStorage(options = {}) {
  const resolved =
    typeof options === 'string'
      ? { scopeKey: options }
      : options;
  const scopeKey = resolved.scopeKey || 'default';
  const storageKey = resolveStorageKey(scopeKey);
  const initialData = cloneData(
    typeof resolved.initialData === 'function'
      ? resolved.initialData()
      : resolved.initialData || defaultData
  );

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._dataVersion === DATA_VERSION) {
        return withRuntimeMeta(normalizeVersionStoreData(parsed), storageKey);
      }
    }
  } catch (e) {
    console.error('Failed to load version data from localStorage:', e);
  }

  const seeded = withRuntimeMeta(normalizeVersionStoreData(initialData), storageKey);
  saveToStorage(seeded);
  return seeded;
}

// 保存到 localStorage
export function saveToStorage(data) {
  try {
    const storageKey = data._storageKey || resolveStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(data));
    emitChange(storageKey);
  } catch (e) {
    console.error('Failed to save version data to localStorage:', e);
  }
}

export function getVersionStoreChangeEventName() {
  return STORE_CHANGE_EVENT;
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

export function isVersionEditable(version, versioningConfig) {
  if (!version) return false;
  const rules = normalizeVersioningConfig(versioningConfig);
  if (!rules.enabled) return true;
  return version.status === 'draft';
}

function buildEmptyAssessment() {
  return { totalHours: 0, passScore: 60, certificate: false, rules: [] };
}

function cloneResourcesWithNewKeys(resources = []) {
  const keyMap = new Map();
  resources.forEach((resource) => {
    keyMap.set(
      resource.key,
      `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    );
  });

  return resources.map((resource) => ({
    ...resource,
    key: keyMap.get(resource.key),
    parentKey: resource.parentKey ? keyMap.get(resource.parentKey) || resource.parentKey : null,
  }));
}

// 新建版本（继承当前生效版本的资料）
export function createNewVersion(data, versioningConfig) {
  const rules = normalizeVersioningConfig(versioningConfig);
  if (!rules.enabled) {
    return { ...data, error: '当前场景未开启版本管理' };
  }
  if (data.versions.length >= rules.maxVersions) {
    return { ...data, error: `最多支持 ${rules.maxVersions} 个版本，请删除旧版本后再创建` };
  }

  const activeVersion = data.versions.find((v) => v.status === 'active') || getCurrentVersion(data);
  const shouldCopyActive = rules.createMode === 'COPY_ACTIVE';
  const inheritedResources = shouldCopyActive && activeVersion
    ? cloneResourcesWithNewKeys(activeVersion.resources)
    : [];
  const inheritedAssessment = shouldCopyActive && activeVersion?.assessment
    ? cloneData(activeVersion.assessment)
    : buildEmptyAssessment();

  if (Array.isArray(inheritedAssessment.rules)) {
    const keyMap = new Map();
    if (shouldCopyActive && activeVersion) {
      activeVersion.resources.forEach((resource, index) => {
        const nextResource = inheritedResources[index];
        if (nextResource) keyMap.set(resource.key, nextResource.key);
      });
    }
    inheritedAssessment.rules = inheritedAssessment.rules.map((rule) => ({
      ...rule,
      folderKey: rule.folderKey ? keyMap.get(rule.folderKey) || rule.folderKey : rule.folderKey,
    }));
  }

  const newVersion = {
    id: `v${Date.now()}`,
    name: formatVersionName(rules.namePattern, data.versions.length + 1),
    status: 'draft',
    createdAt: nowText(),
    publishedAt: null,
    resources: inheritedResources,
    tagDefinitions: shouldCopyActive && activeVersion?.tagDefinitions ? cloneData(activeVersion.tagDefinitions) : [],
    tagGroups: shouldCopyActive && activeVersion?.tagGroups ? cloneData(activeVersion.tagGroups) : [],
    assessment: inheritedAssessment,
    assessmentChat: shouldCopyActive && activeVersion?.assessmentChat ? cloneData(activeVersion.assessmentChat) : [],
    knowledgeGraphRef: shouldCopyActive && activeVersion?.knowledgeGraphRef
      ? cloneData(activeVersion.knowledgeGraphRef)
      : null,
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
export function publishVersion(data, versionId, versioningConfig) {
  const rules = normalizeVersioningConfig(versioningConfig);
  if (!rules.enabled) {
    return { ...data, error: '当前场景未开启版本管理' };
  }
  const now = nowText();
  const newData = {
    ...data,
    versions: data.versions.map((v) => {
      if (v.id === versionId) {
        return { ...v, status: 'active', publishedAt: now };
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

// 添加资料（仅 draft，支持指定 parentKey）
export function addResource(data, versionId, resource, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const newResource = {
    ...resource,
    key: resource.key || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    isFolder: resource.isFolder || false,
    parentKey: resource.parentKey || null,
    owner: resource.owner || 'zhanghl',
    lastEdit: resource.lastEdit || nowText(),
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

export function addResources(data, versionId, resources, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;
  if (!Array.isArray(resources) || resources.length === 0) return data;

  const newResources = resources.map((resource) => ({
    ...resource,
    key: resource.key || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    isFolder: resource.isFolder || false,
    parentKey: resource.parentKey || null,
    owner: resource.owner || 'zhanghl',
    lastEdit: resource.lastEdit || nowText(),
  }));

  const newData = {
    ...data,
    versions: data.versions.map((v) => (
      v.id === versionId ? { ...v, resources: [...v.resources, ...newResources] } : v
    )),
  };
  saveToStorage(newData);
  return newData;
}

// 更新资料（仅 draft）
export function updateResource(data, versionId, resourceKey, updates, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? {
            ...v,
            resources: v.resources.map((resource) =>
              resource.key === resourceKey
                ? { ...resource, ...updates, lastEdit: nowText() }
                : resource
            ),
          }
        : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

export function updateResourceArchiveProfile(data, versionId, resourceKey, archiveProfile) {
  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? {
            ...v,
            resources: v.resources.map((resource) => (
              resource.key === resourceKey
                ? {
                    ...resource,
                    meta: {
                      ...(resource.meta || {}),
                      archiveProfile: {
                        ...(resource.meta?.archiveProfile || {}),
                        ...archiveProfile,
                      },
                    },
                    lastEdit: resource.lastEdit || nowText(),
                  }
                : resource
            )),
          }
        : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

function getResourceSubtreeKeySet(resources, rootKey) {
  const subtreeKeys = new Set();
  const visit = (key) => {
    subtreeKeys.add(key);
    resources.forEach((resource) => {
      if (resource.parentKey === key) visit(resource.key);
    });
  };
  visit(rootKey);
  return subtreeKeys;
}

function findResourceSubtreeEndIndex(resources, rootKey) {
  const subtreeKeys = getResourceSubtreeKeySet(resources, rootKey);
  let lastIndex = -1;
  resources.forEach((resource, index) => {
    if (subtreeKeys.has(resource.key)) {
      lastIndex = index;
    }
  });
  return lastIndex;
}

// 移动资料：支持拖拽到文件夹以及同级排序
export function moveResource(data, versionId, resourceKey, targetParentKey, targetIndex = null, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const resources = version.resources || [];
  const item = resources.find((resource) => resource.key === resourceKey);
  if (!item) return data;

  const normalizedTargetParentKey = targetParentKey ?? null;
  if (normalizedTargetParentKey) {
    const targetFolder = resources.find((resource) => resource.key === normalizedTargetParentKey);
    if (!targetFolder?.isFolder) return data;
  }

  if (item.isFolder && normalizedTargetParentKey) {
    let currentParentKey = normalizedTargetParentKey;
    while (currentParentKey) {
      if (currentParentKey === resourceKey) return data;
      const parent = resources.find((resource) => resource.key === currentParentKey);
      currentParentKey = parent?.parentKey ?? null;
    }
  }

  const movingSubtreeKeys = getResourceSubtreeKeySet(resources, resourceKey);
  const movingResources = resources.filter((resource) => movingSubtreeKeys.has(resource.key));
  const remainingResources = resources.filter((resource) => !movingSubtreeKeys.has(resource.key));
  const targetSiblings = remainingResources.filter(
    (resource) => (resource.parentKey ?? null) === normalizedTargetParentKey,
  );
  const normalizedTargetIndex = targetIndex == null
    ? targetSiblings.length
    : Math.max(0, Math.min(targetIndex, targetSiblings.length));

  if ((item.parentKey ?? null) === normalizedTargetParentKey) {
    const currentSiblingKeys = resources
      .filter((resource) => (resource.parentKey ?? null) === normalizedTargetParentKey)
      .map((resource) => resource.key);
    const nextSiblingKeys = [
      ...targetSiblings.slice(0, normalizedTargetIndex).map((resource) => resource.key),
      resourceKey,
      ...targetSiblings.slice(normalizedTargetIndex).map((resource) => resource.key),
    ];
    if (
      currentSiblingKeys.length === nextSiblingKeys.length
      && currentSiblingKeys.every((key, index) => key === nextSiblingKeys[index])
    ) {
      return data;
    }
  }

  let insertionIndex = remainingResources.length;
  if (targetSiblings.length > 0) {
    if (normalizedTargetIndex < targetSiblings.length) {
      insertionIndex = remainingResources.findIndex(
        (resource) => resource.key === targetSiblings[normalizedTargetIndex].key,
      );
      if (insertionIndex < 0) insertionIndex = remainingResources.length;
    } else {
      insertionIndex = findResourceSubtreeEndIndex(
        remainingResources,
        targetSiblings[targetSiblings.length - 1].key,
      ) + 1;
    }
  } else if (normalizedTargetParentKey) {
    const parentEndIndex = findResourceSubtreeEndIndex(remainingResources, normalizedTargetParentKey);
    if (parentEndIndex >= 0) {
      insertionIndex = parentEndIndex + 1;
    }
  }

  const movedResources = movingResources.map((resource, index) => (
    index === 0
      ? { ...resource, parentKey: normalizedTargetParentKey, lastEdit: nowText() }
      : resource
  ));

  const nextResources = [
    ...remainingResources.slice(0, insertionIndex),
    ...movedResources,
    ...remainingResources.slice(insertionIndex),
  ];

  const newData = {
    ...data,
    versions: data.versions.map((v) => (
      v.id === versionId ? { ...v, resources: nextResources } : v
    )),
  };
  saveToStorage(newData);
  return newData;
}

// 删除资料（仅 draft，删除文件夹时递归级联删除所有后代）
export function deleteResource(data, versionId, resourceKey, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const keysToDelete = new Set();
  function collectKeys(key) {
    keysToDelete.add(key);
    version.resources.forEach((resource) => {
      if (resource.parentKey === key) collectKeys(resource.key);
    });
  }
  collectKeys(resourceKey);

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId
        ? { ...v, resources: v.resources.filter((resource) => !keysToDelete.has(resource.key)) }
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

// 删除版本（仅允许删除草稿或已失效的版本）
export function deleteVersion(data, versionId, versioningConfig) {
  const rules = normalizeVersioningConfig(versioningConfig);
  if (!rules.enabled) {
    return { ...data, error: '当前场景未开启版本管理' };
  }
  const version = data.versions.find((v) => v.id === versionId);
  if (!version) return data;
  if (version.status === 'active') return { ...data, error: '不能删除当前生效版本' };
  if (version.status === 'published' && !rules.allowDeletePublished) {
    return { ...data, error: '当前模板不允许删除已失效版本' };
  }

  const newVersions = data.versions.filter((v) => v.id !== versionId);
  let newCurrentId = data.currentVersionId;
  if (newCurrentId === versionId) {
    const active = newVersions.find((v) => v.status === 'active');
    newCurrentId = active ? active.id : newVersions[0]?.id;
  }

  const newData = { ...data, versions: newVersions, currentVersionId: newCurrentId };
  saveToStorage(newData);
  return newData;
}

// 更新考核方案
export function updateAssessment(data, versionId, assessment) {
  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId ? { ...v, assessment } : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

// 更新考核对话记录
export function updateAssessmentChat(data, versionId, chat) {
  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId ? { ...v, assessmentChat: chat } : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

export function updateVersionTagLibrary(data, versionId, patch, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const newData = {
    ...data,
    versions: data.versions.map((v) =>
      v.id === versionId ? { ...v, ...patch } : v
    ),
  };
  saveToStorage(newData);
  return newData;
}

export function updateVersionKnowledgeGraphRef(data, versionId, knowledgeGraphRef, versioningConfig) {
  const version = data.versions.find((v) => v.id === versionId);
  if (!isVersionEditable(version, versioningConfig)) return data;

  const normalizedRef = normalizeKnowledgeGraphRef(knowledgeGraphRef);
  const newData = {
    ...data,
    versions: data.versions.map((v) => (
      v.id === versionId
        ? { ...v, knowledgeGraphRef: normalizedRef }
        : v
    )),
  };
  saveToStorage(newData);
  return newData;
}

// 回退版本：将指定的已发布版本重新设为生效，当前生效的版本降为已发布
export function rollbackVersion(data, targetVersionId, versioningConfig) {
  const rules = normalizeVersioningConfig(versioningConfig);
  if (!rules.enabled) {
    return { ...data, error: '当前场景未开启版本管理' };
  }
  if (!rules.allowRollback) {
    return { ...data, error: '当前模板未开启版本回退' };
  }
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
