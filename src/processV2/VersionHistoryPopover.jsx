import { useState, useEffect, useRef } from 'react';
import { Button, Tag, Modal, message } from 'antd';
import {
  HistoryOutlined,
  CheckOutlined,
  DownOutlined,
  UpOutlined,
  RollbackOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import './VersionHistoryPopover.css';

/**
 * 流程设计器顶部「草稿 / 历史版本」下拉面板
 * 不使用 antd Popover（Portal 兼容问题），改用自定义下拉
 */
function timeAgo(ts) {
  if (!ts) return '';
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return ts;
  const diff = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  const d = new Date(t);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${M}月${D}日 ${hh}:${mm}`;
}

function VersionHistoryPopover({
  draft,
  versions = [],
  latestVersion = 0,
  saveStatus = 'idle',
  previewMeta = null,
  onRollback,
  onPreview,
  onExitPreview,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(null);
  const wrapperRef = useRef(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleRollback = (version) => {
    Modal.confirm({
      title: `回滚到版本 v${version}`,
      icon: null,
      content: '当前草稿将被覆盖为该版本的内容。回滚后可继续编辑并重新发布，不会丢失已发布的版本。',
      okText: '确认回滚',
      okButtonProps: { danger: true },
      cancelText: '取消',
      zIndex: 1300,
      onOk: async () => {
        setRolling(version);
        try {
          await onRollback?.(version);
          message.success(`已回滚到 v${version}`);
          setOpen(false);
        } catch (err) {
          message.error('回滚失败：' + (err?.message || '未知错误'));
        } finally {
          setRolling(null);
        }
      },
    });
  };

  let subText = draft?.updateTime ? `保存于 ${timeAgo(draft.updateTime)}` : '未保存';
  if (saveStatus === 'saving') subText = '保存中...';
  else if (saveStatus === 'saved') subText = `已保存${draft?.updateTime ? ` · ${timeAgo(draft.updateTime)}` : ''}`;
  else if (saveStatus === 'error') subText = `保存失败${draft?.updateTime ? ` · ${timeAgo(draft.updateTime)}` : ''}`;

  // 预览模式下的状态文案
  const isPreviewing = !!previewMeta;
  const previewIsLatest = isPreviewing && previewMeta.version === latestVersion;
  const previewTagText = previewIsLatest ? '启用中' : '历史';
  const previewTagCls = previewIsLatest ? 'vh-trigger-tag enabled' : 'vh-trigger-tag history';

  return (
    <div className="vh-wrapper" ref={wrapperRef}>
      {/* 触发器：预览模式显示“5月27日 18:00 版本（启用中）”；否则显示“草稿 · vN” */}
      <div
        className={`vh-trigger${open ? ' open' : ''}${saveStatus === 'error' && !isPreviewing ? ' error' : ''}${isPreviewing ? ' previewing' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <HistoryOutlined style={{ marginRight: 4 }} />
        {isPreviewing ? (
          <>
            <span className="vh-trigger-label">{formatDate(previewMeta.publishTime)} 版本</span>
            <span className={previewTagCls}>{previewTagText}</span>
          </>
        ) : (
          <>
            <span className="vh-trigger-label">草稿</span>
            {latestVersion > 0 && (
              <span className="vh-trigger-count" title={`已有 ${latestVersion} 个已发布版本`}>
                · v{latestVersion}
              </span>
            )}
            <span className="vh-trigger-sub">（{subText}）</span>
          </>
        )}
        {open ? <UpOutlined className="vh-trigger-arrow" /> : <DownOutlined className="vh-trigger-arrow" />}
      </div>

      {/* 下拉面板（自定义，不走 antd Popover Portal） */}
      {open && (
        <div className="vh-dropdown">
          {/* 草稿项：预览模式下点击可切回草稿 */}
          <div
            className={`vh-item vh-item--draft${isPreviewing ? ' vh-item--clickable' : ''}`}
            onClick={() => {
              if (isPreviewing) {
                onExitPreview?.();
                setOpen(false);
              }
            }}
          >
            <div className="vh-item-main">
              <div className="vh-item-top">
                <span className="vh-item-title">草稿</span>
                <Tag className="vh-tag vh-tag--designing">设计中</Tag>
              </div>
              <div className="vh-item-bottom">
                <span className="vh-avatar" aria-hidden>
                  {(draft?.createBy || '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="vh-author">{draft?.createBy || '—'}</span>
                <span className="vh-time">
                  {saveStatus === 'saving' ? '保存中...' : draft?.updateTime ? `保存于 ${timeAgo(draft.updateTime)}` : '未保存'}
                </span>
              </div>
            </div>
            <div className="vh-item-action">
              {!isPreviewing && <CheckOutlined className="vh-check" />}
            </div>
          </div>

          {/* 已发布版本列表 */}
          {loading && <div className="vh-loading">加载中...</div>}
          {!loading && versions.length === 0 && (
            <div className="vh-empty-text">暂无已发布版本</div>
          )}
          {versions.map((v) => {
            const isLatest = v.version === latestVersion;
            const isCurrentPreview = isPreviewing && v.version === previewMeta.version;
            const tagCls = isLatest ? 'vh-tag--enabled' : 'vh-tag--history';
            const tagText = isLatest ? '启用中' : '历史';
            return (
              <div className={`vh-item${isCurrentPreview ? ' vh-item--active' : ''}`} key={v.version}>
                <div className="vh-item-main">
                  <div className="vh-item-top">
                    <span className="vh-item-date">{formatDate(v.publishTime || v.createTime)}</span>
                    <span className="vh-item-title">版本 v{v.version}</span>
                    <Tag className={`vh-tag ${tagCls}`}>{tagText}</Tag>
                  </div>
                  <div className="vh-item-bottom">
                    <span className="vh-avatar" aria-hidden>
                      {(v.createBy || '?').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="vh-author">{v.createBy || '—'}</span>
                    <span className="vh-time">发布</span>
                  </div>
                </div>
                <div className="vh-item-action">
                  {isCurrentPreview ? (
                    <CheckOutlined className="vh-check" />
                  ) : (
                    <>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => { onPreview?.(v.version); setOpen(false); }}
                        className="vh-action-btn"
                      >
                        查看
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<RollbackOutlined />}
                        loading={rolling === v.version}
                        onClick={() => handleRollback(v.version)}
                        className="vh-action-btn"
                      >
                        回滚
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VersionHistoryPopover;
