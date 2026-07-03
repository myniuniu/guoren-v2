const EDIT_SESSION_STORAGE_KEY = 'gr.capability-model.edit-sessions.v1';
const PREVIEW_SESSION_STORAGE_KEY = 'gr.capability-model.preview-sessions.v1';

function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStorageMap(storage, storageKey) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn(`[capability-model-edit-session] failed to read ${storageKey}`, error);
    return {};
  }
}

function writeStorageMap(storage, storageKey, value) {
  if (!storage) return;
  storage.setItem(storageKey, JSON.stringify(value));
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function createCapabilityModelRequestId() {
  return createRequestId();
}

export function getCapabilityModelEditSessionStorageKey() {
  return EDIT_SESSION_STORAGE_KEY;
}

export function readCapabilityModelEditSession(requestId) {
  if (!requestId) return null;
  const storage = getLocalStorage();
  const sessions = readStorageMap(storage, EDIT_SESSION_STORAGE_KEY);
  const session = sessions[requestId];
  return session && typeof session === 'object' ? session : null;
}

export function writeCapabilityModelEditSession(payload = {}) {
  const requestId = String(payload.requestId || '').trim();
  if (!requestId) return null;

  const storage = getLocalStorage();
  const sessions = readStorageMap(storage, EDIT_SESSION_STORAGE_KEY);
  const current = sessions[requestId] && typeof sessions[requestId] === 'object'
    ? sessions[requestId]
    : {};
  const shouldBumpRevision = payload.bumpRevision === true;
  const nextRevision = payload.revision
    || (shouldBumpRevision ? createRequestId() : (current.revision || createRequestId()));
  const nextSession = {
    ...current,
    ...payload,
    requestId,
    revision: nextRevision,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
  delete nextSession.bumpRevision;
  sessions[requestId] = nextSession;
  writeStorageMap(storage, EDIT_SESSION_STORAGE_KEY, sessions);
  return nextSession;
}

export function readCapabilityModelPreviewSession(sourceKey) {
  if (!sourceKey) return null;
  const storage = getSessionStorage();
  const sessions = readStorageMap(storage, PREVIEW_SESSION_STORAGE_KEY);
  const session = sessions[sourceKey];
  return session && typeof session === 'object' ? session : null;
}

export function writeCapabilityModelPreviewSession(payload = {}) {
  const sourceKey = String(payload.sourceKey || '').trim();
  if (!sourceKey) return null;

  const storage = getSessionStorage();
  const sessions = readStorageMap(storage, PREVIEW_SESSION_STORAGE_KEY);
  const current = sessions[sourceKey] && typeof sessions[sourceKey] === 'object'
    ? sessions[sourceKey]
    : {};
  const nextSession = {
    ...current,
    ...payload,
    sourceKey,
  };
  sessions[sourceKey] = nextSession;
  writeStorageMap(storage, PREVIEW_SESSION_STORAGE_KEY, sessions);
  return nextSession;
}

export function removeCapabilityModelPreviewSession(sourceKey) {
  if (!sourceKey) return;
  const storage = getSessionStorage();
  const sessions = readStorageMap(storage, PREVIEW_SESSION_STORAGE_KEY);
  if (!Object.prototype.hasOwnProperty.call(sessions, sourceKey)) return;
  delete sessions[sourceKey];
  writeStorageMap(storage, PREVIEW_SESSION_STORAGE_KEY, sessions);
}
