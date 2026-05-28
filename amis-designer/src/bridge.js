// 与父窗口（主应用）的 postMessage 桥接
// 协议：
//   父 -> 子：
//     { type: 'init',  payload: { schema, name, pageId, mode } }
//   子 -> 父：
//     { type: 'ready' }
//     { type: 'save',     payload: { schema, name } }
//     { type: 'preview',  payload: { schema, name } }
//     { type: 'change',   payload: { schema } }   // 可选：实时同步
const CHANNEL = 'amis-designer';

export function postToParent(type, payload) {
  if (window.parent === window) return;
  window.parent.postMessage({ channel: CHANNEL, type, payload }, '*');
}

export function onParentMessage(handler) {
  function listener(e) {
    const data = e?.data;
    if (!data || data.channel !== CHANNEL) return;
    handler(data.type, data.payload);
  }
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
