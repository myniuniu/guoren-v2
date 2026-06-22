const EVENT_STORAGE_KEY = 'gr.analytics.events.v1';
const SESSION_STORAGE_KEY = 'gr.analytics.session.v1';
const CONTEXT_STORAGE_KEY = 'gr.analytics.context.v1';
const STORE_CHANGE_EVENT = 'gr:analytics-store-change';
const MAX_EVENT_COUNT = 600;

export const IMPLEMENTED_ANALYTICS_EVENTS = [
  'page_view',
  'space_scene_open',
  'space_scene_create_success',
  'space_scene_update_success',
  'space_scene_delete_success',
  'space_template_create_success',
  'space_template_update_success',
  'space_template_delete_success',
  'teacher_portrait_view',
  'teacher_portrait_refresh',
  'teacher_growth_action_recommend',
  'recommend_expose',
  'recommend_click',
  'recommend_push_delivered',
  'message_lucky_open',
];

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson(storageKey, fallback) {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[analytics] failed to read ${storageKey}`, error);
    return fallback;
  }
}

function writeJson(storageKey, value) {
  if (!isBrowser()) return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function emitChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function getStoredContext() {
  return readJson(CONTEXT_STORAGE_KEY, {
    product: 'guoren-v2',
    platform: 'web',
  });
}

export function getAnalyticsStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export function getAnalyticsSessionId() {
  if (!isBrowser()) return 'session_server';
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = createId('session');
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function getAnalyticsContext() {
  return getStoredContext();
}

export function setAnalyticsContext(partialContext = {}) {
  if (!isBrowser()) return getStoredContext();
  const nextContext = {
    ...getStoredContext(),
    ...partialContext,
  };
  writeJson(CONTEXT_STORAGE_KEY, nextContext);
  return nextContext;
}

export function buildTraceId(prefix = 'trace') {
  return createId(prefix);
}

export function listAnalyticsEvents() {
  return readJson(EVENT_STORAGE_KEY, []);
}

export function clearAnalyticsEvents() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(EVENT_STORAGE_KEY);
  emitChange();
}

export function trackEvent(eventName, payload = {}) {
  if (!isBrowser()) return null;

  const context = getStoredContext();
  const event = {
    event_id: createId('evt'),
    event_name: eventName,
    event_time: nowIso(),
    session_id: getAnalyticsSessionId(),
    trace_id: payload.traceId || context.traceId || buildTraceId(),
    module: payload.module || context.module || 'app',
    page_id: payload.pageId || context.pageId || '',
    page_name: payload.pageName || context.pageName || '',
    actor_id: payload.actorId || context.actorId || '',
    actor_name: payload.actorName || context.actorName || '',
    actor_role: payload.actorRole || context.actorRole || '',
    dept: payload.dept || context.dept || '',
    object_type: payload.objectType || '',
    object_id: payload.objectId || '',
    result: payload.result || 'success',
    duration_ms: Number.isFinite(Number(payload.durationMs)) ? Number(payload.durationMs) : null,
    error_code: payload.errorCode || '',
    error_message: payload.errorMessage || '',
    recommend_scene: Boolean(payload.recommendScene),
    recommend_id: payload.recommendId || '',
    recommend_strategy: payload.recommendStrategy || '',
    recommend_reason_codes: Array.isArray(payload.recommendReasonCodes) ? payload.recommendReasonCodes : [],
    recommend_position: payload.recommendPosition || '',
    recommend_score: Number.isFinite(Number(payload.recommendScore)) ? Number(payload.recommendScore) : null,
    recommend_target_type: payload.recommendTargetType || '',
    recommend_target_id: payload.recommendTargetId || '',
    properties: payload.properties && typeof payload.properties === 'object' ? payload.properties : {},
  };

  const history = listAnalyticsEvents();
  history.push(event);
  writeJson(EVENT_STORAGE_KEY, history.slice(-MAX_EVENT_COUNT));
  emitChange();
  return event;
}

export function trackPageView(pageId, payload = {}) {
  return trackEvent('page_view', {
    ...payload,
    pageId,
    pageName: payload.pageName || pageId,
  });
}

export function trackRecommendationEvent(action, recommendation, payload = {}) {
  if (!recommendation) return null;

  return trackEvent(`recommend_${action}`, {
    ...payload,
    module: payload.module || 'recommendation',
    recommendScene: true,
    recommendId: recommendation.id,
    recommendStrategy: recommendation.strategy || 'teacher_capability_rule_v1',
    recommendReasonCodes: recommendation.reasonCodes || [],
    recommendPosition: payload.recommendPosition || recommendation.position || '',
    recommendScore: recommendation.score,
    recommendTargetType: recommendation.target?.type || '',
    recommendTargetId: recommendation.target?.sceneId
      || recommendation.target?.teacherId
      || recommendation.target?.recordId
      || recommendation.target?.resourceId
      || '',
    objectType: payload.objectType || recommendation.type || 'recommendation',
    objectId: payload.objectId || recommendation.id,
    properties: {
      title: recommendation.title,
      subtitle: recommendation.subtitle || '',
      reasonSummary: recommendation.reasonSummary || '',
      ...payload.properties,
    },
  });
}
