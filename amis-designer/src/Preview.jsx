import { useEffect, useRef, useState } from 'react';
import { render as amisRender } from 'amis';
import axios from 'axios';
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import { postToParent, onParentMessage } from './bridge';

const fetcher = ({ url, method = 'get', data, config = {} }) => {
  const cfg = { url, method, ...config };
  if (method.toLowerCase() === 'get') cfg.params = data;
  else cfg.data = data;
  return axios(cfg).then((res) => ({ ok: true, status: 0, msg: 'ok', data: res.data }));
};

const env = {
  fetcher,
  isCancel: (v) => axios.isCancel(v),
  jumpTo: (to) => {
    if (!to) return;
    if (to.startsWith('http')) window.open(to, '_blank');
    else window.location.href = to;
  },
  notify: (type, msg) => console.log(`[amis ${type}]`, msg),
  alert: (msg) => window.alert(msg),
  confirm: (msg) => Promise.resolve(window.confirm(msg)),
};

export default function PreviewView() {
  const [schema, setSchema] = useState(null);
  const [name, setName] = useState('页面预览');
  const [noData, setNoData] = useState(false);

  // 从 URL 读取 pageId（新标签页模式）
  const pageId = new URLSearchParams(window.location.search).get('pageId');
  const initReceivedRef = useRef(false);

  useEffect(() => {
    const off = onParentMessage((type, payload) => {
      if (type === 'init') {
        initReceivedRef.current = true;
        if (payload?.schema) setSchema(payload.schema);
        if (payload?.name) setName(payload.name);
      }
    });

    if (pageId) {
      // 新标签页模式：向父窗口请求数据，带重试
      console.log('[preview] pageId=', pageId, 'opener=', window.opener ? 'yes' : 'null');
      let retries = 0;
      const maxRetries = 8;
      const sendRequest = () => {
        if (initReceivedRef.current || retries >= maxRetries) {
          clearInterval(retryTimer);
          if (!initReceivedRef.current) setNoData(true);
          return;
        }
        console.log('[preview] request-init retry', retries);
        postToParent('request-init', { pageId });
        retries++;
      };
      sendRequest();
      const retryTimer = setInterval(sendRequest, 400);
      return () => {
        off();
        clearInterval(retryTimer);
      };
    } else if (window.parent !== window) {
      // iframe 模式无 pageId：通知父端准备好
      postToParent('ready');
      return off;
    }

    // 独立模式（无 pageId 且无 parent）
    setNoData(true);
    return off;
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <span style={styles.brand}>预览：{name}</span>
      </div>
      <div style={styles.body}>
        {schema ? amisRender(schema, {}, env) : (
          <div style={styles.empty}>
            {noData ? '无法获取页面数据，请从主应用的页面列表中打开预览' : '等待数据...'}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fa' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: '#fff',
    borderBottom: '1px solid #eef0f3',
  },
  brand: { fontWeight: 600, color: '#1f2329' },
  body: { flex: 1, overflow: 'auto', padding: 16 },
  empty: { textAlign: 'center', color: '#86909c', padding: 48 },
};
