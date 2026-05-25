import { useState, useEffect } from 'react';
import { Avatar, Button, Input, message, Spin } from 'antd';
import {
  LeftOutlined,
  ThunderboltFilled,
  LikeOutlined,
  StarOutlined,
  ShareAltOutlined,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { studyClubApi } from './api';
import './InspireDetailPage.css';

export default function InspireDetailPage() {
  const [item, setItem] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    // 从 hash 获取 id: #/inspire-detail/i1
    const hash = window.location.hash || '';
    const match = hash.match(/^#\/inspire-detail\/(.+)$/);
    if (!match) return;
    const itemId = match[1];

    // 加载频道详情获取 inspire 数据
    studyClubApi.getChannelDetail('super-individual').then((detail) => {
      const inspire = detail?.aiSet?.items?.inspire || [];
      const found = inspire.find((i) => i.id === itemId);
      if (found && found.detail) {
        setItem(found);
      }
    });
  }, []);

  if (!item) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const d = item.detail;
  const comments = d.comments || [];

  return (
    <div className="inspire-page">
      {/* 左侧目录 */}
      <aside className="inspire-page-sidebar">
        <div className="inspire-page-sidebar-back" onClick={() => window.close()}>
          <LeftOutlined /><LeftOutlined style={{ marginLeft: -6 }} />
        </div>
        <div className="inspire-page-sidebar-title">{item.title}</div>
        <nav className="inspire-page-toc">
          {d.toc.map((t) => (
            <div
              key={t.key}
              className={`inspire-page-toc-item ${t.level === 2 ? 'level-2' : ''}`}
            >
              {t.text}
            </div>
          ))}
        </nav>
      </aside>

      {/* 中间正文 */}
      <main className="inspire-page-main">
        <h1 className="inspire-page-main-title">{item.title}</h1>
        <div className="inspire-page-main-meta">
          <Avatar size={24} style={{ background: '#cfe2ff' }}>{item.avatar}</Avatar>
          <span className="inspire-page-main-author">{item.author}</span>
          <span className="inspire-page-main-time">{item.editTime || item.time}</span>
          <div className="inspire-page-main-ai-tag">
            <ThunderboltFilled style={{ color: '#1677ff' }} /> AI 速览
            <span className="inspire-page-main-ai-sep">|</span>
            试用
          </div>
        </div>

        {/* 摘要 */}
        <div className="inspire-page-abstract">{d.abstract}</div>

        {/* 文章信息 */}
        <div className="inspire-page-info">
          <div className="inspire-page-info-label">文章信息：</div>
          <div className="inspire-page-info-text">{d.info}</div>
          <div className="inspire-page-info-core">核心价值：{d.coreValue}</div>
        </div>

        {/* 正文 */}
        <div className="inspire-page-body">
          {d.body.map((block, idx) => {
            if (block.type === 'heading') {
              return <h2 key={idx} className="inspire-page-body-h2">{block.text}</h2>;
            }
            if (block.type === 'highlight') {
              return <p key={idx} className="inspire-page-body-highlight">{block.text}</p>;
            }
            if (block.type === 'image') {
              return (
                <div key={idx} className="inspire-page-body-img" style={{ background: block.gradient }}>
                  <span className="inspire-page-body-img-alt">{block.alt}</span>
                </div>
              );
            }
            return <p key={idx} className="inspire-page-body-p">{block.text}</p>;
          })}
        </div>

        {/* 底部操作栏 */}
        <div className="inspire-page-main-footer">
          <span className="inspire-page-main-footer-icon">📝</span>
          <span className="inspire-page-main-footer-icon">⚙️</span>
        </div>
      </main>

      {/* 右侧边栏 */}
      <aside className="inspire-page-right">
        <div className="inspire-page-right-actions">
          <span><LikeOutlined /> {item.likes}</span>
          <span><StarOutlined /> {item.stars}</span>
          <span><ShareAltOutlined /> 分享</span>
        </div>
        <h3 className="inspire-page-right-title">{item.title}</h3>
        <div className="inspire-page-right-meta">
          <Avatar size={20} style={{ background: '#cfe2ff' }}>{item.avatar}</Avatar>
          <span>{item.author}</span>
          <span className="inspire-page-right-time">{item.time}</span>
        </div>
        <div className="inspire-page-right-summary">{item.summary}</div>
        <Button type="primary" block className="inspire-page-right-fav-btn">
          <StarOutlined /> 收藏
        </Button>

        <div className="inspire-page-right-discuss-title">讨论区 ({comments.length})</div>
        <div className="inspire-page-right-discuss-list">
          {comments.map((c) => (
            <div key={c.id} className="inspire-page-right-comment">
              <Avatar size={24} style={{ background: c.avatarColor || '#cfe2ff', flexShrink: 0 }}>
                {c.avatar}
              </Avatar>
              <div className="inspire-page-right-comment-body">
                <div className="inspire-page-right-comment-author">
                  {c.author}
                  {c.isOp ? <span className="inspire-page-right-comment-op">作者</span> : null}
                </div>
                <div className="inspire-page-right-comment-text">{c.text}</div>
                <div className="inspire-page-right-comment-time">
                  {c.time} <MessageOutlined style={{ marginLeft: 8 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="inspire-page-right-input">
          <Input
            placeholder="想成果、提问题、夸作者…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onPressEnter={() => {
              if (!replyText.trim()) return;
              message.success('评论已发送');
              setReplyText('');
            }}
            bordered={false}
            suffix={
              <button
                className="inspire-page-right-input-send"
                onClick={() => {
                  if (!replyText.trim()) return;
                  message.success('评论已发送');
                  setReplyText('');
                }}
              >
                <SendOutlined />
              </button>
            }
          />
        </div>
      </aside>
    </div>
  );
}
