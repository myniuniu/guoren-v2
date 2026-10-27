const DB = 'guoren-learning-outcomes-v1';
export const defaultRequirements = { instructions: '结合本任务提交实践成果与学习反思。', allowedTypes: ['document', 'file', 'agent'], deadline: '', reviewRequired: false };
export function getLocalActor() {
  const key = 'gr:learning-outcome-actor';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return { id, name: '自主学习者' };
}
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('submissions', { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadSubmission(scope, outcome, actor) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('submissions', 'readonly');
    const request = tx.objectStore('submissions').get(`${scope}:${outcome}:${actor.id}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
export async function listSubmissions(scope, outcome) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('submissions', 'readonly');
    const request = tx.objectStore('submissions').getAll();
    request.onsuccess = () => resolve(request.result.filter((item) => item.scope === scope && item.outcome === outcome));
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
export async function saveSubmission({ scope, outcome, task, actor, draft, submit = false, requirements = defaultRequirements }) {
  if (!actor?.id) throw new Error('缺少提交身份');
  if (draft.materials.some((material) => material.type === 'file' && !/\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|txt|zip)$/i.test(material.name))) throw new Error('不支持该文件类型，请上传文档、图片或压缩包');
  if (draft.materials.some((material) => !requirements.allowedTypes.includes(material.type))) throw new Error('包含不允许提交的材料类型');
  if (submit && (!draft.title.trim() || !draft.materials.length)) throw new Error('请填写标题并添加至少一项成果材料');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('submissions', 'readwrite');
    const store = tx.objectStore('submissions');
    const key = `${scope}:${outcome}:${actor.id}`;
    let result;
    const request = store.get(key);
    request.onsuccess = () => {
      const current = request.result || { key, scope, outcome, task, actor, versions: [], status: 'draft' };
      if (submit && current.status === 'pending') { tx.abort(); return; }
      const fingerprint = JSON.stringify({ title: draft.title, description: draft.description, materials: draft.materials.map(({ blob, ...material }) => ({ ...material, size: blob?.size, modified: blob?.lastModified })) });
      const latest = current.versions.at(-1);
      const now = new Date().toISOString();
      const versions = [...current.versions];
      if (submit && latest?.fingerprint !== fingerprint) versions.push({ ...structuredClone(draft), number: versions.length + 1, submittedAt: now, overdue: Boolean(requirements.deadline && Date.now() > new Date(requirements.deadline).getTime()), fingerprint });
      result = { ...current, draft: structuredClone(draft), updatedAt: now, versions, status: submit && latest?.fingerprint !== fingerprint ? (requirements.reviewRequired ? 'pending' : 'passed') : current.status };
      store.put(result);
    };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('保存失败')); };
  });
}
export async function reviewSubmission(key, reviewer, status, feedback) {
  if (!reviewer?.canReview || !['passed', 'returned'].includes(status)) throw new Error('没有评阅权限');
  if (status === 'returned' && !feedback.trim()) throw new Error('退回时请填写修改意见');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('submissions', 'readwrite'); const store = tx.objectStore('submissions'); let result;
    const req = store.get(key);
    req.onsuccess = () => {
      if (!req.result || req.result.status !== 'pending') { tx.abort(); return; }
      result = { ...req.result, status, feedback, reviewedBy: reviewer.id, reviewedAt: new Date().toISOString() };
      store.put(result);
    };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('当前成果不可评阅')); };
  });
}
