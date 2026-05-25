import { useMemo, useState } from 'react';
import { Modal, Tabs, Input, Empty, Tag, Tooltip, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { loadResourceLib } from './resourceLibStore';
import './ResourceLibPicker.css';

/**
 * 资料库图片选择器
 * @param {boolean} open
 * @param {function} onClose
 * @param {function} onSelect - (item) => void，item 包含 { key, name, url, fileType }
 * @param {string[]} accept   - 允许的 fileType，默认仅 ['image']
 * @param {string}   title    - 弹窗标题
 */
export default function ResourceLibPicker({
  open,
  onClose,
  onSelect,
  accept = ['image'],
  title = '从资料库选择',
}) {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('personal');
  const [keyword, setKeyword] = useState('');
  const [activeKey, setActiveKey] = useState(null);

  // 打开时刷新数据，避免取到旧 state
  const handleAfterOpenChange = (visible) => {
    if (visible) {
      setData(loadResourceLib());
      setActiveKey(null);
      setKeyword('');
    }
  };

  const list = data[scope] || [];

  // 过滤：只展示符合 accept 类型的资料 + 必须有 url（兼容旧 dataUrl）
  const items = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return list.filter((r) => {
      if (r.isFolder) return false;
      if (!accept.includes(r.fileType)) return false;
      const src = r.url || r.dataUrl;
      if (!src) return false; // 没有真实数据无法预览/使用
      if (kw && !r.name?.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [list, accept, keyword]);

  const selectedItem = useMemo(
    () => items.find((r) => r.key === activeKey),
    [items, activeKey],
  );

  const handleOk = () => {
    if (!selectedItem) return;
    onSelect?.(selectedItem);
    onClose?.();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确定使用"
      cancelText="取消"
      okButtonProps={{ disabled: !selectedItem }}
      width={780}
      destroyOnClose
      afterOpenChange={handleAfterOpenChange}
      className="rlp-modal"
    >
      <Tabs
        activeKey={scope}
        onChange={(k) => { setScope(k); setActiveKey(null); }}
        size="small"
        items={[
          { key: 'personal', label: '个人资料库' },
          { key: 'organization', label: '组织资料库' },
        ]}
      />
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="搜索图片名称"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      {items.length === 0 ? (
        <div className="rlp-empty">
          <Empty description={
            <div>
              <div>当前资料库暂无可用图片</div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                可前往「资料库」上传图片资料后再回来选择
              </div>
            </div>
          } />
        </div>
      ) : (
        <>
          <Alert
            type="info"
            showIcon
            message="点击图片卡片即可选中，再点击「确定使用」应用到当前位置"
            style={{ marginBottom: 12 }}
          />
          <div className="rlp-grid">
            {items.map((r) => (
              <Tooltip key={r.key} title={r.name}>
                <div
                  className={`rlp-card ${activeKey === r.key ? 'rlp-card-active' : ''}`}
                  onClick={() => setActiveKey(r.key)}
                  onDoubleClick={() => { setActiveKey(r.key); onSelect?.(r); onClose?.(); }}
                >
                  <div className="rlp-card-thumb">
                    <img src={r.url || r.dataUrl} alt={r.name} />
                  </div>
                  <div className="rlp-card-meta">
                    <div className="rlp-card-name">{r.name}</div>
                    <Tag color="blue" className="rlp-card-tag">{r.fileType}</Tag>
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
