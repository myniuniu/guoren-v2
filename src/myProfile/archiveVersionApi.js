import {
  applyArchiveVersionMappingSuggestions,
  buildBlankArchiveVersionSnapshot,
  buildArchiveVersionEvidenceItems,
  createArchiveVersion,
  ensureArchiveVersionSeedData,
  generateArchiveVersionMappingSuggestions,
  getArchiveVersionStoreEventName,
  importArchiveVersionMaterials,
  linkArchiveVersionEvaluationRecord,
  listArchiveVersions,
  syncArchiveVersionDirectoryMaterials,
  updateArchiveVersion,
} from './archiveVersionStore';

export const archiveVersionApi = {
  seed: async (payload) => ensureArchiveVersionSeedData(payload),
  list: async (payload) => listArchiveVersions(payload),
  create: async (payload) => createArchiveVersion(payload),
  update: async (versionId, payload) => updateArchiveVersion(versionId, payload),
  importMaterials: async (versionId, items) => importArchiveVersionMaterials(versionId, items),
  syncDirectoryMaterials: async (versionId, items, payload) => syncArchiveVersionDirectoryMaterials(versionId, items, payload),
  generateMappingSuggestions: async (versionId) => generateArchiveVersionMappingSuggestions(versionId),
  applyMappingSuggestions: async (versionId, suggestionIds) => applyArchiveVersionMappingSuggestions(versionId, suggestionIds),
  linkEvaluationRecord: async (versionId, payload) => linkArchiveVersionEvaluationRecord(versionId, payload),
  buildEvidenceItems: buildArchiveVersionEvidenceItems,
  buildBlankSnapshot: buildBlankArchiveVersionSnapshot,
  getStoreEventName: getArchiveVersionStoreEventName,
};
