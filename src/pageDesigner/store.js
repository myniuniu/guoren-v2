// 页面设计 Schema 持久化（localStorage 实现）
// 数据结构：{ id, name, updatedAt, schema }

const STORAGE_KEY = 'gr.pageDesigner.pages';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('[pageDesigner] readAll failed', e);
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[pageDesigner] writeAll failed', e);
  }
}

export function listPages() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getPage(id) {
  return readAll().find((p) => p.id === id) || null;
}

export function savePage(page) {
  const list = readAll();
  const now = Date.now();
  const id = page.id || `page_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const next = {
    id,
    name: page.name || '未命名页面',
    schema: page.schema || defaultSchema(),
    updatedAt: now,
    createdAt: page.createdAt || now,
  };
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  writeAll(list);
  return next;
}

export function removePage(id) {
  const list = readAll().filter((p) => p.id !== id);
  writeAll(list);
}

export function defaultSchema() {
  return {
    type: 'page',
    title: '新页面',
    body: [
      {
        type: 'tpl',
        tpl: '<h2>欢迎使用 amis 页面设计器</h2><p>从左侧拖入组件开始设计你的页面。</p>',
      },
    ],
  };
}
