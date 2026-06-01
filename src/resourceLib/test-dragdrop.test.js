// 测试资料库拖放功能
import { describe, it, expect, beforeEach } from 'vitest';
import { moveItem, loadResourceLib, saveResourceLib } from './resourceLibStore';

describe('Resource Library Drag & Drop', () => {
  let testData;

  beforeEach(() => {
    // 加载测试数据
    testData = loadResourceLib();
  });

  describe('moveItem', () => {
    it('应该能够将文件移动到目标文件夹', () => {
      // 获取第一个文件
      const firstFile = testData.personal.find(item => !item.isFolder);
      const firstFolder = testData.personal.find(item => item.isFolder);

      expect(firstFile).toBeDefined();
      expect(firstFolder).toBeDefined();

      const originalParentKey = firstFile.parentKey;

      // 移动文件到文件夹
      const result = moveItem(testData, 'personal', firstFile.key, firstFolder.key);

      // 验证文件的 parentKey 已更新
      const movedItem = result.personal.find(item => item.key === firstFile.key);
      expect(movedItem.parentKey).toBe(firstFolder.key);
      expect(movedItem.parentKey).not.toBe(originalParentKey);
    });

    it('应该能够将文件移回根目录（parentKey = null）', () => {
      const firstFile = testData.personal.find(item => !item.isFolder);
      const firstFolder = testData.personal.find(item => item.isFolder);

      // 先移动到文件夹
      let result = moveItem(testData, 'personal', firstFile.key, firstFolder.key);
      
      // 再移回根目录
      result = moveItem(result, 'personal', firstFile.key, null);

      const movedItem = result.personal.find(item => item.key === firstFile.key);
      expect(movedItem.parentKey).toBeNull();
    });

    it('不应该允许将文件夹移动到自身', () => {
      const firstFolder = testData.personal.find(item => item.isFolder);

      const result = moveItem(testData, 'personal', firstFolder.key, firstFolder.key);

      // 应该返回原始数据，不做任何更改
      const folder = result.personal.find(item => item.key === firstFolder.key);
      expect(folder.parentKey).toBe(firstFolder.parentKey);
    });

    it('不应该允许将文件夹移动到自己的子文件夹中', () => {
      const parentFolder = testData.personal.find(item => item.isFolder);
      
      // 创建一个子文件夹
      let result = testData;
      const childFolderKey = `test_child_${Date.now()}`;
      result = {
        ...result,
        personal: [
          ...result.personal,
          {
            key: childFolderKey,
            name: '子文件夹',
            isFolder: true,
            parentKey: parentFolder.key,
            fileType: 'folder',
            owner: 'test',
            parseStatus: 'parsed',
            lastEdit: new Date().toLocaleString('zh-CN', { hour12: false }),
            tags: [],
          }
        ]
      };

      // 尝试将父文件夹移动到子文件夹（应该失败）
      const finalResult = moveItem(result, 'personal', parentFolder.key, childFolderKey);

      // parentKey 不应该改变
      const parentFolderInResult = finalResult.personal.find(item => item.key === parentFolder.key);
      expect(parentFolderInResult.parentKey).toBe(parentFolder.parentKey);
    });

    it('应该更新移动项目的 lastEdit 时间', () => {
      const firstFile = testData.personal.find(item => !item.isFolder);
      const firstFolder = testData.personal.find(item => item.isFolder);

      const originalLastEdit = firstFile.lastEdit;

      const result = moveItem(testData, 'personal', firstFile.key, firstFolder.key);
      const movedItem = result.personal.find(item => item.key === firstFile.key);

      expect(movedItem.lastEdit).not.toBe(originalLastEdit);
    });
  });
});
