import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { fileApi } from '../api/fileApi';
import { addItem, inferFileType } from './resourceLibStore';

const EDITABLE_PASTE_SELECTOR = [
  'input',
  'textarea',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '.ant-input',
  '.ant-input-affix-wrapper',
  '.ant-select-selector',
].join(', ');

function isEditablePasteTarget(target) {
  return target instanceof Element && Boolean(target.closest(EDITABLE_PASTE_SELECTOR));
}

function collectClipboardFiles(clipboardData) {
  if (!clipboardData) return [];

  const files = [];
  const seen = new Set();
  const pushFile = (file) => {
    if (!file || (typeof File !== 'undefined' && !(file instanceof File))) return;
    const signature = [file.name, file.size, file.type, file.lastModified].join('__');
    if (seen.has(signature)) return;
    seen.add(signature);
    files.push(file);
  };

  Array.from(clipboardData.files || []).forEach(pushFile);
  Array.from(clipboardData.items || []).forEach((item) => {
    if (item.kind !== 'file') return;
    const file = item.getAsFile?.();
    if (file) pushFile(file);
  });

  return files;
}

export default function useResourceLibraryFileImport({
  activeTagFilter,
  addDialogOpen,
  addOpen,
  addTagOpen,
  contextMenuItemKey,
  currentBlankAreaParentKey,
  hasActiveSearch,
  isRecentView,
  list,
  parseDrawerOpen,
  scope,
  selectedItemKeys,
  setBgMenuPos,
  setContextMenuItemKey,
  setData,
  setExpandedFolders,
  tagPickerTarget,
  viewMode,
}) {
  const resolvePasteTarget = useCallback(() => {
    const findFolder = (itemKey) => (
      itemKey
        ? list.find((item) => item.key === itemKey && item.isFolder) || null
        : null
    );

    const contextTarget = findFolder(contextMenuItemKey);
    if (contextTarget) {
      return { parentKey: contextTarget.key, label: contextTarget.name };
    }

    if (selectedItemKeys.length === 1) {
      const selectedFolder = findFolder(selectedItemKeys[0]);
      if (selectedFolder) {
        return { parentKey: selectedFolder.key, label: selectedFolder.name };
      }
    }

    const currentTarget = findFolder(currentBlankAreaParentKey);
    if (currentTarget) {
      return { parentKey: currentTarget.key, label: currentTarget.name };
    }

    return { parentKey: null, label: '根目录' };
  }, [contextMenuItemKey, currentBlankAreaParentKey, list, selectedItemKeys]);

  const uploadFilesToLibrary = useCallback(async (files, { parentKey = null } = {}) => {
    const normalizedFiles = Array.from(files || []).filter((file) => (
      file && (typeof File === 'undefined' || file instanceof File)
    ));
    if (normalizedFiles.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const hide = message.loading(`上传中 (${normalizedFiles.length})...`, 0);
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const file of normalizedFiles) {
        try {
          const inferred = inferFileType(file.name);
          const result = await fileApi.upload(file, 'resource-lib');
          setData((prevData) => addItem(prevData, scope, {
            name: file.name,
            isFolder: false,
            parentKey,
            fileType: inferred,
            url: result.url,
            size: result.size,
            mime: result.mime,
            parseStatus: 'parsing',
          }));
          successCount += 1;
        } catch {
          failureCount += 1;
          message.error(`「${file.name}」上传失败`);
        }
      }

      if (successCount > 0 && parentKey && viewMode === 'detail' && !hasActiveSearch && !isRecentView && !activeTagFilter) {
        setExpandedFolders((prev) => {
          if (prev.has(parentKey)) return prev;
          const next = new Set(prev);
          next.add(parentKey);
          return next;
        });
      }
    } finally {
      hide();
    }

    return { successCount, failureCount };
  }, [activeTagFilter, hasActiveSearch, isRecentView, scope, setData, setExpandedFolders, viewMode]);

  useEffect(() => {
    const handlePaste = (event) => {
      if (addOpen || addDialogOpen || addTagOpen || tagPickerTarget || parseDrawerOpen) return;
      if (isEditablePasteTarget(event.target)) return;

      const files = collectClipboardFiles(event.clipboardData);
      if (files.length === 0) return;

      const pasteTarget = resolvePasteTarget();
      event.preventDefault();
      setBgMenuPos(null);
      setContextMenuItemKey(null);

      void (async () => {
        const { successCount, failureCount } = await uploadFilesToLibrary(files, { parentKey: pasteTarget.parentKey });
        if (successCount > 0) {
          message.success(
            failureCount > 0
              ? `已粘贴 ${successCount} 个文件到「${pasteTarget.label}」，${failureCount} 个失败`
              : `已粘贴 ${successCount} 个文件到「${pasteTarget.label}」`,
          );
        }
      })();
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [
    addDialogOpen,
    addOpen,
    addTagOpen,
    parseDrawerOpen,
    resolvePasteTarget,
    setBgMenuPos,
    setContextMenuItemKey,
    tagPickerTarget,
    uploadFilesToLibrary,
  ]);

  return {
    uploadFilesToLibrary,
  };
}
