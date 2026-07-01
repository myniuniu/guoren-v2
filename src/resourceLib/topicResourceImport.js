import {
  getLibraryDescendantFiles,
  getLibraryItemsById,
  getLibraryItemPath,
  getLibraryNameById,
  getLibrarySubtreeItems,
} from './resourceLibStore';

function cloneValue(value) {
  if (value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function splitName(name = '') {
  const match = /^(.*?)(\.[^.]*)?$/.exec(name);
  return {
    base: match?.[1] || name,
    ext: match?.[2] || '',
  };
}

function createImportKey() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getUniqueName(name, parentKey, reservedNamesByParentKey) {
  const normalizedParentKey = parentKey ?? null;
  const reserved = reservedNamesByParentKey.get(normalizedParentKey) || new Set();
  if (!reservedNamesByParentKey.has(normalizedParentKey)) {
    reservedNamesByParentKey.set(normalizedParentKey, reserved);
  }
  if (!reserved.has(name)) {
    reserved.add(name);
    return name;
  }

  const { base, ext } = splitName(name);
  let index = 1;
  let candidate = `${base}（${index}）${ext}`;
  while (reserved.has(candidate)) {
    index += 1;
    candidate = `${base}（${index}）${ext}`;
  }
  reserved.add(candidate);
  return candidate;
}

function createSourceMeta(item, libraryData, libraryId, includeDirectories, importedAt) {
  return {
    origin: 'RESOURCE_LIBRARY',
    libraryId,
    libraryName: getLibraryNameById(libraryData, libraryId),
    libraryScope: libraryId === 'personal' ? 'personal' : 'organization',
    sourceItemKey: item.key,
    sourcePath: getLibraryItemPath(libraryData, libraryId, item),
    importedAt,
    preserveDirectory: includeDirectories,
  };
}

function createResourceCopy(source, overrides = {}) {
  const next = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    if (key === 'key' || key === 'parentKey' || key === 'lastOpenedAt') return;
    next[key] = cloneValue(value);
  });
  return {
    ...next,
    ...overrides,
  };
}

function normalizeSelectedRoots(selectedItems = [], itemMap) {
  const selectedMap = new Map((selectedItems || []).map((item) => [item.key, item]));
  return (selectedItems || []).filter((item) => {
    let cursor = item.parentKey ? itemMap.get(item.parentKey) : null;
    while (cursor) {
      if (selectedMap.has(cursor.key)) return false;
      cursor = cursor.parentKey ? itemMap.get(cursor.parentKey) : null;
    }
    return true;
  });
}

export function buildTopicResourcesFromLibrarySelection(selectedItems = [], options = {}) {
  const {
    targetParentKey = null,
    includeDirectories = true,
    libraryData,
    libraryId = 'personal',
    existingResources = [],
    excludedFileTypes = ['knowledgeGraph', 'capabilityModel'],
  } = options;

  const allItems = getLibraryItemsById(libraryData, libraryId);
  const itemMap = new Map(allItems.map((item) => [item.key, item]));
  const selectedRoots = normalizeSelectedRoots(selectedItems, itemMap);
  const excludedSet = new Set(excludedFileTypes);
  const importedAt = new Date().toLocaleString('zh-CN', { hour12: false });
  const reservedNamesByParentKey = new Map();
  const importedResources = [];

  existingResources.forEach((resource) => {
    const parentKey = resource.parentKey ?? null;
    if (!reservedNamesByParentKey.has(parentKey)) reservedNamesByParentKey.set(parentKey, new Set());
    reservedNamesByParentKey.get(parentKey).add(resource.name);
  });

  const directChildrenMap = new Map();
  allItems.forEach((item) => {
    const parentKey = item.parentKey ?? null;
    if (!directChildrenMap.has(parentKey)) directChildrenMap.set(parentKey, []);
    directChildrenMap.get(parentKey).push(item);
  });

  const isAllowedFile = (item) => item && !item.isFolder && !excludedSet.has(item.fileType);

  const appendFile = (item, parentKey) => {
    if (!isAllowedFile(item)) return null;
    const nextResource = createResourceCopy(item, {
      key: createImportKey(),
      name: getUniqueName(item.name, parentKey, reservedNamesByParentKey),
      parentKey,
      sourceMeta: createSourceMeta(item, libraryData, libraryId, includeDirectories, importedAt),
    });
    importedResources.push(nextResource);
    return nextResource;
  };

  const importFolderWithStructure = (folder, parentKey) => {
    const descendants = getLibrarySubtreeItems(libraryData, libraryId, folder.key, { includeRoot: false });
    if (!descendants.some(isAllowedFile)) return null;

    const importedFolder = createResourceCopy(folder, {
      key: createImportKey(),
      name: getUniqueName(folder.name, parentKey, reservedNamesByParentKey),
      parentKey,
      isFolder: true,
      fileType: 'folder',
      sourceMeta: createSourceMeta(folder, libraryData, libraryId, includeDirectories, importedAt),
    });
    importedResources.push(importedFolder);

    const directChildren = directChildrenMap.get(folder.key) || [];
    directChildren.forEach((child) => {
      if (child.isFolder) {
        importFolderWithStructure(child, importedFolder.key);
      } else {
        appendFile(child, importedFolder.key);
      }
    });

    return importedFolder;
  };

  selectedRoots.forEach((item) => {
    if (!itemMap.has(item.key)) return;
    if (item.isFolder) {
      if (includeDirectories) {
        importFolderWithStructure(item, targetParentKey);
      } else {
        getLibraryDescendantFiles(libraryData, libraryId, item.key).forEach((file) => {
          appendFile(file, targetParentKey);
        });
      }
      return;
    }
    appendFile(item, targetParentKey);
  });

  return importedResources;
}
