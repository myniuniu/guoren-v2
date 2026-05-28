import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const off = onParentMessage((type, payload) => {
      if (type === 'init') {
        if (payload?.schema) setSchema(payload.schema);
        if (payload?.name) setName(payload.name);
      }
    });
    postToParent('ready');
    return off;
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <span style={styles.brand}>预览：{name}</span>
      </div>
      <div style={styles.body}>
        {schema ? amisRender(schema, {}, env) : <div style={styles.empty}>等待数据...</div>}
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
