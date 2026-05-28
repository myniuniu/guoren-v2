import { useEffect, useState } from 'react';
import { Editor } from 'amis-editor';
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import 'amis-editor-core/lib/style.css';
import { postToParent, onParentMessage } from './bridge';

const DEFAULT_SCHEMA = {
  type: 'page',
  title: '新页面',
  body: [
    { type: 'tpl', tpl: '<h2>欢迎使用 amis 页面设计器</h2><p>从左侧拖入组件开始设计你的页面。</p>' },
  ],
};

export default function EditorView() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [name, setName] = useState('未命名页面');
  const [ready, setReady] = useState(false);

  // 接收父应用 init
  useEffect(() => {
    const off = onParentMessage((type, payload) => {
      if (type === 'init') {
        if (payload?.schema) setSchema(payload.schema);
        if (payload?.name) setName(payload.name);
      }
    });
    // 通知父端：iframe 准备好了，可以下发 init
    postToParent('ready');
    setReady(true);
    return off;
  }, []);

  const handleSave = () => {
    postToParent('save', { schema, name });
  };

  const handlePreview = () => {
    postToParent('preview', { schema, name });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <div style={styles.left}>
          <span style={styles.brand}>amis 设计器</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="页面名称"
            maxLength={64}
            style={styles.input}
          />
        </div>
        <div style={styles.right}>
          <button style={styles.btn} onClick={handlePreview}>
            预览
          </button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
      <div style={styles.body}>
        {ready && (
          <Editor
            theme="cxd"
            preview={false}
            isMobile={false}
            value={schema}
            onChange={setSchema}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: '#fff',
    borderBottom: '1px solid #eef0f3',
    zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  right: { display: 'flex', gap: 8 },
  brand: { fontWeight: 600, color: '#1f2329' },
  input: {
    width: 240,
    padding: '6px 10px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    fontSize: 14,
  },
  btn: {
    padding: '6px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  btnPrimary: {
    background: '#1677ff',
    borderColor: '#1677ff',
    color: '#fff',
  },
  body: { flex: 1, overflow: 'hidden', position: 'relative' },
};
