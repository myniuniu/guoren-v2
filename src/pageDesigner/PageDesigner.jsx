import { useEffect, useRef, useState } from 'react';
import { Button, Input, Space, message, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  ExportOutlined,
} from '@ant-design/icons';

// 独立部署的 amis 设计器地址（开发期 vite，端口 5177）
const AMIS_DESIGNER_URL =
  import.meta.env.VITE_AMIS_DESIGNER_URL || 'http://127.0.0.1:5177';
const CHANNEL = 'amis-designer';

/**
 * iframe 包装 amis-designer 子项目（editor 模式）
 * @param {object}   props.page          当前页面 { id, name, schema }
 * @param {function} props.onSave        保存回调 (page) => Promise<page>
 * @param {function} props.onPreview     预览回调 (page) => void
 * @param {function} props.onBack        返回列表
 */
export default function PageDesigner({ page, onSave, onPreview, onBack }) {
  const iframeRef = useRef(null);
  const [name, setName] = useState(page?.name || '未命名页面');
  const [iframeReady, setIframeReady] = useState(false);

  // 向 iframe 下发初始数据
  const sendInit = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        channel: CHANNEL,
        type: 'init',
        payload: {
          schema: page?.schema || { type: 'page', body: '' },
          name: page?.name || '未命名页面',
          pageId: page?.id,
          mode: 'editor',
        },
      },
      '*'
    );
  };

  // 监听子项目消息
  useEffect(() => {
    function listener(e) {
      const data = e?.data;
      if (!data || data.channel !== CHANNEL) return;

      if (data.type === 'ready') {
        setIframeReady(true);
        sendInit();
      } else if (data.type === 'save') {
        const next = {
          ...(page || {}),
          name: data.payload?.name || name || '未命名页面',
          schema: data.payload?.schema,
        };
        onSave?.(next);
        message.success('已保存');
      } else if (data.type === 'preview') {
        const next = {
          ...(page || {}),
          name: data.payload?.name || name,
          schema: data.payload?.schema,
        };
        onPreview?.(next);
      }
    }
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 顶部本地名称改动 → 同步给 iframe（可选；当前以 iframe 内的为准，仅用于显示）
  useEffect(() => {
    setName(page?.name || '未命名页面');
  }, [page]);

  return (
    <div className="pd-designer-wrap">
      <div className="pd-designer-toolbar">
        <div className="pd-designer-toolbar-left">
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回
          </Button>
          <Input
            className="pd-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="页面名称"
            maxLength={64}
            disabled
          />
          <span style={{ color: '#86909c', fontSize: 12 }}>
            （在子设计器顶部修改名称并点击保存生效）
          </span>
        </div>
        <Space className="pd-designer-toolbar-right">
          <Tooltip title="在独立窗口打开设计器（避免 iframe 拖拽问题）">
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                window.open(`${AMIS_DESIGNER_URL}/?mode=editor`, '_blank', 'noopener');
              }}
            >
              新窗口打开
            </Button>
          </Tooltip>
          <Button
            icon={<SaveOutlined />}
            onClick={() => {
              message.info('请在设计器顶部点击「保存」按钮');
            }}
          >
            保存
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              message.info('请在设计器顶部点击「预览」按钮');
            }}
          >
            预览
          </Button>
        </Space>
      </div>
      <div className="pd-designer-body">
        <iframe
          ref={iframeRef}
          title="amis-designer"
          src={`${AMIS_DESIGNER_URL}/?mode=editor`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          // 允许 amis 内部弹窗、剪贴板等
          allow="clipboard-read; clipboard-write"
        />
        {!iframeReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#86909c',
              pointerEvents: 'none',
            }}
          >
            正在加载 amis 设计器...
          </div>
        )}
      </div>
    </div>
  );
}
