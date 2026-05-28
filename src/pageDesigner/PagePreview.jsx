import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const AMIS_DESIGNER_URL =
  import.meta.env.VITE_AMIS_DESIGNER_URL || 'http://127.0.0.1:5177';
const CHANNEL = 'amis-designer';

/**
 * iframe 包装 amis-designer 子项目（preview 模式）
 */
export default function PagePreview({ schema, name, onBack }) {
  const iframeRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);

  const sendInit = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        channel: CHANNEL,
        type: 'init',
        payload: {
          schema: schema || { type: 'page', body: '空页面' },
          name: name || '页面预览',
          mode: 'preview',
        },
      },
      '*'
    );
  };

  useEffect(() => {
    function listener(e) {
      const data = e?.data;
      if (!data || data.channel !== CHANNEL) return;
      if (data.type === 'ready') {
        setIframeReady(true);
        sendInit();
      }
    }
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, name]);

  return (
    <div className="pd-preview-wrap">
      <div className="pd-preview-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回
          </Button>
          <span style={{ fontWeight: 600 }}>{name || '页面预览'}</span>
        </div>
      </div>
      <div className="pd-preview-body" style={{ padding: 0, position: 'relative' }}>
        <iframe
          ref={iframeRef}
          title="amis-preview"
          src={`${AMIS_DESIGNER_URL}/?mode=preview`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
        {!iframeReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#86909c',
            }}
          >
            正在加载预览...
          </div>
        )}
      </div>
    </div>
  );
}
