import {
  buildSceneInitialVersionData,
  createTemplateDraft,
  duplicateSceneTemplate,
  getScene,
  getSceneStoreChangeEventName,
  getSceneTemplate,
  listSceneTemplates,
  listScenes,
  removeScene,
  removeSceneTemplate,
  saveScene,
  saveSceneTemplate,
  seedSceneData,
} from './store';

export const sceneApi = {
  seed: async () => seedSceneData(),
  listTemplates: async () => listSceneTemplates(),
  detailTemplate: async (id) => getSceneTemplate(id),
  saveTemplate: async (template) => saveSceneTemplate(template),
  removeTemplate: async (id) => removeSceneTemplate(id),
  duplicateTemplate: async (id) => duplicateSceneTemplate(id),
  listScenes: async () => listScenes(),
  detailScene: async (id) => getScene(id),
  saveScene: async (scene) => saveScene(scene),
  removeScene: async (id) => removeScene(id),
  createTemplateDraft,
  buildSceneInitialVersionData,
  getStoreEventName: getSceneStoreChangeEventName,
};

export * from './store';
