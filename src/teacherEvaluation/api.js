import {
  AI_DRAFT_STATUS_OPTIONS,
  TEACHER_EVALUATION_ROLE_OPTIONS,
  TEACHER_EVALUATION_STATUS_OPTIONS,
  createTeacherEvaluationRecord,
  getAiDraftStatusLabel,
  getTeacherEvaluationRecord,
  getTeacherEvaluationRoleLabel,
  getTeacherEvaluationStatusLabel,
  getTeacherEvaluationStoreEventName,
  listTeacherEvaluationAuditLogs,
  listTeacherEvaluationRecords,
  listTeacherEvaluationSchemes,
  reviewTeacherEvaluationRecord,
  saveTeacherEvaluationScheme,
  seedTeacherEvaluationData,
  submitTeacherEvaluationAppeal,
  submitTeacherEvaluationRecord,
  updateTeacherEvaluationAiDraft,
} from './store';

export {
  AI_DRAFT_STATUS_OPTIONS,
  TEACHER_EVALUATION_ROLE_OPTIONS,
  TEACHER_EVALUATION_STATUS_OPTIONS,
  getAiDraftStatusLabel,
  getTeacherEvaluationRoleLabel,
  getTeacherEvaluationStatusLabel,
};

export const teacherEvaluationApi = {
  seed: async () => seedTeacherEvaluationData(),
  listSchemes: async () => listTeacherEvaluationSchemes(),
  saveScheme: async (payload) => saveTeacherEvaluationScheme(payload),
  listRecords: async () => listTeacherEvaluationRecords(),
  detailRecord: async (id) => getTeacherEvaluationRecord(id),
  createRecord: async (schemeId, teacherProfile) => createTeacherEvaluationRecord(schemeId, teacherProfile),
  submitRecord: async (recordId, actor) => submitTeacherEvaluationRecord(recordId, actor),
  reviewRecord: async (recordId, payload) => reviewTeacherEvaluationRecord(recordId, payload),
  updateAiDraft: async (recordId, draftId, payload) => updateTeacherEvaluationAiDraft(recordId, draftId, payload),
  submitAppeal: async (recordId, payload) => submitTeacherEvaluationAppeal(recordId, payload),
  listAuditLogs: async (recordId) => listTeacherEvaluationAuditLogs(recordId),
  getStoreEventName: getTeacherEvaluationStoreEventName,
};
