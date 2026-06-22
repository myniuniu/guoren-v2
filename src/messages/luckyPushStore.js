import { sceneApi } from '../scene/api';
import { teacherEvaluationApi } from '../teacherEvaluation/api';
import { trackEvent } from '../shared/analytics';
import { buildTeacherCapabilityRecommendations } from '../shared/recommendationEngine';

const LUCKY_STORAGE_KEY = 'gr.messages.lucky.v1';
const LUCKY_CHANGE_EVENT = 'gr:messages-lucky-change';
const LUCKY_CONVERSATION_ID = 'direct-lucky';
const LUCKY_PUSH_INTERVAL_MS = 1000 * 60 * 8;

function nowIso() {
  return new Date().toISOString();
}

function nowTimeText() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredConversation() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LUCKY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[lucky-push] failed to read conversation', error);
    return null;
  }
}

function writeStoredConversation(conversation) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LUCKY_STORAGE_KEY, JSON.stringify(conversation));
}

function emitLuckyChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LUCKY_CHANGE_EVENT));
}

function parseMinimumEvidenceCount(text) {
  const matched = String(text || '').match(/至少\s*(\d+)/);
  return matched ? Number(matched[1]) : 1;
}

function isClosedStatus(status) {
  return ['APPROVED', 'REJECTED', 'APPEAL_RESOLVED'].includes(status);
}

function buildPortraitTag(summary) {
  if (summary.averageCoverage >= 86 && summary.approvedCount > 0) {
    return '证据扎实型';
  }
  if (summary.focusNames.some((item) => /企业|校企/.test(item))) {
    return '校企协同型';
  }
  if (summary.gapCount >= 2 || summary.lowCoverageCount >= 2) {
    return '补证强化型';
  }
  if (summary.inReviewCount > 0) {
    return '评审推进型';
  }
  return '成长蓄能型';
}

function buildTeacherPortraitSummary(teacher, records, schemes) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const itemMap = new Map();
  const sortedRecords = [...records].sort((left, right) => (
    String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || ''))
  ));

  sortedRecords.forEach((record) => {
    const scheme = schemeMap.get(record.schemeId);
    const rubricMap = new Map((scheme?.itemRubrics || []).map((item) => [item.itemName, item]));
    (record.evidenceItems || []).forEach((item) => {
      const itemName = item.relatedItemName || item.title || '待归类项';
      const current = itemMap.get(itemName) || {
        itemName,
        evidenceCount: 0,
        totalCoverage: 0,
        threshold: item.evidenceThreshold || rubricMap.get(itemName)?.evidenceThreshold || '',
      };
      current.evidenceCount += 1;
      current.totalCoverage += Number(item.coverage) || 0;
      current.threshold = current.threshold || item.evidenceThreshold || rubricMap.get(itemName)?.evidenceThreshold || '';
      itemMap.set(itemName, current);
    });
  });

  const evidenceRows = Array.from(itemMap.values()).map((item) => {
    const minimumCount = parseMinimumEvidenceCount(item.threshold);
    const averageCoverage = item.evidenceCount ? Math.round(item.totalCoverage / item.evidenceCount) : 0;
    return {
      ...item,
      averageCoverage,
      gapCount: Math.max(0, minimumCount - item.evidenceCount),
    };
  }).sort((left, right) => (
    right.averageCoverage - left.averageCoverage || right.evidenceCount - left.evidenceCount
  ));

  const allEvidence = sortedRecords.flatMap((record) => record.evidenceItems || []);
  const averageCoverage = allEvidence.length
    ? Math.round(allEvidence.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / allEvidence.length)
    : 0;
  const pendingAiDrafts = sortedRecords.reduce((sum, record) => (
    sum + (record.aiDrafts || []).filter((item) => item.reviewStatus === 'PENDING_HUMAN').length
  ), 0);
  const approvedCount = sortedRecords.filter((record) => record.status === 'APPROVED').length;
  const inReviewCount = sortedRecords.filter((record) => record.status === 'IN_REVIEW').length;
  const openCount = sortedRecords.filter((record) => !isClosedStatus(record.status)).length;
  const lowCoverageCount = evidenceRows.filter((item) => item.averageCoverage < 80).length;
  const gapCount = evidenceRows.reduce((sum, item) => sum + item.gapCount, 0);
  const focusNames = evidenceRows.slice(0, 3).map((item) => item.itemName);
  const riskLevel = gapCount >= 2 || averageCoverage < 75
    ? 'HIGH'
    : gapCount > 0 || pendingAiDrafts > 0 || averageCoverage < 85
      ? 'MEDIUM'
      : 'LOW';

  return {
    teacherId: teacher.teacherId,
    teacherName: teacher.name,
    targetLevel: teacher.targetLevel,
    portraitTag: buildPortraitTag({
      averageCoverage,
      approvedCount,
      focusNames,
      gapCount,
      lowCoverageCount,
      inReviewCount,
    }),
    averageCoverage,
    pendingAiDrafts,
    approvedCount,
    inReviewCount,
    openCount,
    gapCount,
    focusNames,
    riskLevel,
  };
}

function getBaseLuckyConversation() {
  return {
    id: LUCKY_CONVERSATION_ID,
    type: 'direct',
    title: 'Lucky',
    subtitle: '智能体推送',
    preview: '我会结合教师能力画像、空间活动与评审阶段，不定期推送成长建议。',
    time: nowTimeText(),
    unread: 0,
    pinned: true,
    avatarText: 'L',
    avatarColor: 'linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)',
    description: 'Lucky 会结合教师能力画像、推荐空间与评审阶段，不定期推送成长建议。',
    messages: [],
    lastPushAt: null,
    pushCursor: 0,
  };
}

function buildLuckyPushMessage(teacher, portraitSummary, recommendationBundle) {
  const recommendations = [
    ...(recommendationBundle.actionRecommendations || []),
    ...(recommendationBundle.sceneRecommendations || []).slice(0, 2),
  ].slice(0, 3);

  const focusLabel = portraitSummary.focusNames?.slice(0, 2).join('、') || '关键能力项';
  const riskLabel = portraitSummary.riskLevel === 'HIGH'
    ? '高关注'
    : portraitSummary.riskLevel === 'MEDIUM'
      ? '持续推进'
      : '画像稳定';

  return {
    id: createId('lucky_msg'),
    sender: 'Lucky',
    time: '刚刚',
    content: `我根据 ${teacher.name} 当前的能力画像整理了新的成长建议。当前阶段为“${portraitSummary.portraitTag}”，重点关注 ${focusLabel}。`,
    summary: `${teacher.departmentName} · ${teacher.targetLevel} · ${riskLabel}`,
    recommendations: recommendations.map((item) => ({
      ...item,
      actionLabel: item.actionLabel || (item.target?.type === 'scene' ? '进入空间' : '查看建议'),
    })),
    createdAt: nowIso(),
  };
}

function shouldCreatePush(conversation, forcePush = false) {
  if (forcePush) return true;
  if (!conversation.lastPushAt || !(conversation.messages || []).length) return true;
  const lastPushTime = new Date(conversation.lastPushAt).getTime();
  return Number.isFinite(lastPushTime) && (Date.now() - lastPushTime >= LUCKY_PUSH_INTERVAL_MS);
}

async function buildNextLuckyConversation(existingConversation, forcePush = false) {
  await Promise.all([
    teacherEvaluationApi.seed(),
    sceneApi.seed(),
  ]);

  const [teachers, records, schemes, scenes] = await Promise.all([
    teacherEvaluationApi.listTeachers(),
    teacherEvaluationApi.listRecords(),
    teacherEvaluationApi.listSchemes(),
    sceneApi.listScenes(),
  ]);

  const conversation = existingConversation || getBaseLuckyConversation();
  if (!teachers.length || !shouldCreatePush(conversation, forcePush)) {
    return conversation;
  }

  const teacherIndex = conversation.pushCursor % teachers.length;
  const teacher = teachers[teacherIndex];
  const teacherRecords = records.filter((item) => item.teacherId === teacher.teacherId);
  const portraitSummary = buildTeacherPortraitSummary(teacher, teacherRecords, schemes);
  const recommendationBundle = buildTeacherCapabilityRecommendations({
    teacher,
    portraitSummary,
    scenes,
  });

  const nextMessage = buildLuckyPushMessage(teacher, portraitSummary, recommendationBundle);
  const nextConversation = {
    ...conversation,
    preview: nextMessage.content,
    time: nowTimeText(),
    unread: (conversation.unread || 0) + 1,
    lastPushAt: nextMessage.createdAt,
    pushCursor: teacherIndex + 1,
    messages: [...(conversation.messages || []), nextMessage].slice(-12),
  };

  trackEvent('recommend_push_delivered', {
    module: 'messages',
    pageId: 'messages',
    pageName: '消息',
    objectType: 'conversation',
    objectId: nextConversation.id,
    actorId: teacher.teacherId,
    actorName: teacher.name,
    actorRole: teacher.roleName,
    dept: teacher.departmentName,
    properties: {
      portraitTag: portraitSummary.portraitTag,
      riskLevel: portraitSummary.riskLevel,
      recommendationCount: nextMessage.recommendations.length,
    },
  });

  return nextConversation;
}

export function getLuckyPushStoreEventName() {
  return LUCKY_CHANGE_EVENT;
}

export function getLuckyConversationId() {
  return LUCKY_CONVERSATION_ID;
}

export async function syncLuckyConversation(options = {}) {
  const existingConversation = readStoredConversation() || getBaseLuckyConversation();
  const nextConversation = await buildNextLuckyConversation(existingConversation, options.forcePush);
  writeStoredConversation(nextConversation);
  emitLuckyChange();
  return nextConversation;
}

export function readLuckyConversation() {
  return readStoredConversation() || getBaseLuckyConversation();
}

export function markLuckyConversationRead() {
  const conversation = readLuckyConversation();
  if (!conversation.unread) return conversation;
  const nextConversation = {
    ...conversation,
    unread: 0,
  };
  writeStoredConversation(nextConversation);
  emitLuckyChange();
  return nextConversation;
}
