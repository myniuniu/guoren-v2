// 与父窗口（主应用）的 postMessage 桥接
// 支持两种模式：
//   1. iframe 嵌入：通过 window.parent 通信
//   2. 新标签页：通过 window.opener 通信
// 协议：
//   父 -> 子：
//     { type: 'init',       payload: { schema, name, pageId } }
//     { type: 'save-success' }
//   子 -> 父：
//     { type: 'request-init', payload: { pageId } }   // 新标签页模式：请求数据
//     { type: 'ready' }                                // iframe 模式：已准备好
//     { type: 'save',       payload: { schema, name, pageId } }
//     { type: 'preview',    payload: { schema, name, pageId } }
const CHANNEL = 'amis-designer';

/**
 * 向父窗口发送消息（自动选择 opener 或 parent）
 */
export function postToParent(type, payload) {
  const msg = { channel: CHANNEL, type, payload };
  // 新标签页模式：通过 window.opener
  if (window.opener && window.opener !== window) {
    window.opener.postMessage(msg, '*');
    return;
  }
  // iframe 嵌入模式：通过 window.parent
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, '*');
  }
}

/**
 * 监听来自父窗口的消息
 * @param {function} handler - (type, payload) => void
 */
export function onParentMessage(handler) {
  function listener(e) {
    const data = e?.data;
    if (!data || data.channel !== CHANNEL) return;
    handler(data.type, data.payload);
  }
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
