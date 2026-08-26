import {
  copySupervisionTemplate,
  deleteSupervisionTemplate,
  deleteSupervisionTemplateDimension,
  deleteSupervisionTemplateIndicator,
  getSupervisionTemplateStoreEventName,
  listSupervisionTemplates,
  saveSupervisionTemplate,
  saveSupervisionTemplateDimension,
  saveSupervisionTemplateIndicator,
  seedSupervisionTemplateData,
} from './store';

export const supervisionTemplateApi = {
  seed: async () => seedSupervisionTemplateData(),
  listTemplates: async () => listSupervisionTemplates(),
  saveTemplate: async (payload) => saveSupervisionTemplate(payload),
  copyTemplate: async (templateId) => copySupervisionTemplate(templateId),
  deleteTemplate: async (templateId) => deleteSupervisionTemplate(templateId),
  saveDimension: async (templateId, payload) => saveSupervisionTemplateDimension(templateId, payload),
  deleteDimension: async (templateId, dimensionId) => deleteSupervisionTemplateDimension(templateId, dimensionId),
  saveIndicator: async (templateId, payload) => saveSupervisionTemplateIndicator(templateId, payload),
  deleteIndicator: async (templateId, indicatorId) => deleteSupervisionTemplateIndicator(templateId, indicatorId),
  getStoreEventName: getSupervisionTemplateStoreEventName,
};
