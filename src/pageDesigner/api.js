// pageDesigner 模块 API：当前为 localStorage 适配层，便于后续替换为后端接口
import { listPages, getPage, savePage, removePage, defaultSchema, seedDashboardPage } from './store';

export const pageApi = {
  list: async () => listPages(),
  get: async (id) => getPage(id),
  save: async (page) => savePage(page),
  remove: async (id) => removePage(id),
  defaultSchema,
  seedDashboardPage,
};
