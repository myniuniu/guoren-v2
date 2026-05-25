import { useState } from 'react';
import { Avatar, Button, Empty, message } from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  ThunderboltFilled,
  StarOutlined,
  LikeOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

export default function AiSetTab({ detail, onInspireClick }) {
  const [activeSubKey, setActiveSubKey] = useState('workshop');
  const aiSet = detail.aiSet || { categories: [], items: {} };
  const categories = aiSet.categories || [];
  const items = (aiSet.items && aiSet.items[activeSubKey]) || [];
  const dotColors = ['#ff5f57', '#febc2e', '#28c840'];

  return (
    <div>
      <div className="channel-detail-aiset-subtabs">
        {categories.map((c) => (
          <div
            key={c.key}
            className={`channel-detail-aiset-subtab ${
              activeSubKey === c.key ? 'channel-detail-aiset-subtab-active' : ''
            }`}
            onClick={() => setActiveSubKey(c.key)}
          >
            {c.label}
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty description="暂无作品" />
      ) : activeSubKey === 'inspire' ? (
        <div className="channel-detail-inspire-list">
          {items.map((it) => (
            <div key={it.id} className="channel-detail-inspire-card" onClick={() => onInspireClick && onInspireClick(it.id)}>
              <div className="channel-detail-inspire-thumb" style={{ background: it.coverGradient }}>
                {it.coverTitle ? (
                  <div className={`channel-detail-inspire-thumb-title ${it.coverDark ? 'is-dark' : ''}`}>
                    {it.coverTitle}
                  </div>
                ) : null}
                <div className="channel-detail-inspire-thumb-emoji">{it.coverEmoji}</div>
              </div>
              <div className="channel-detail-inspire-body">
                <div className="channel-detail-inspire-title">{it.title}</div>
                <div className="channel-detail-inspire-author">
                  <Avatar size={20} style={{ background: it.avatarColor || '#cfe2ff', fontSize: 12 }}>
                    {it.avatar || it.author.slice(0, 1)}
                  </Avatar>
                  <span>{it.author}</span>
                  <span className="channel-detail-inspire-divider">|</span>
                  <span className="channel-detail-inspire-time">{it.time}</span>
                </div>
                <div className="channel-detail-inspire-summary">{it.summary}</div>
                <div className="channel-detail-inspire-actions">
                  <span><LikeOutlined /> {it.likes != null ? it.likes : '点赞'}</span>
                  <span><StarOutlined /> {it.stars != null ? it.stars : '收藏'}</span>
                  <span><ShareAltOutlined /> 分享</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="channel-detail-aiset-grid">
          {items.map((it) => (
            <div key={it.id} className="channel-detail-aiset-card">
              <div className="channel-detail-aiset-meta">
                <div className="channel-detail-aiset-meta-author">
                  <Avatar size={22} style={{ background: it.avatarColor || '#cfe2ff' }}>
                    {it.author.slice(0, 1)}
                  </Avatar>
                  {it.author}
                  <ThunderboltFilled style={{ color: '#faad14', fontSize: 12 }} />
                </div>
                <div className="channel-detail-aiset-meta-stats">
                  <span><EyeOutlined /> {it.views}</span>
                  <span><MessageOutlined /> {it.comments}</span>
                </div>
              </div>
              <div className="channel-detail-aiset-title">{it.title}</div>
              <div className="channel-detail-aiset-cover-wrap" style={{ background: it.cover }}>
                <div className="channel-detail-aiset-cover-bar">
                  {dotColors.map((c) => (
                    <span
                      key={c}
                      className="channel-detail-aiset-cover-bar-dot"
                      style={{ background: c }}
                    />
                  ))}
                  <div className="channel-detail-aiset-cover-bar-url" />
                </div>
                <div
                  className={`channel-detail-aiset-cover ${
                    it.dark ? 'channel-detail-aiset-cover-dark' : ''
                  }`}
                >
                  {it.emoji}
                </div>
                <div className="channel-detail-aiset-hover-bar">
                  <Button
                    className="channel-detail-aiset-hover-btn"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      message.info(`预览应用「${it.title}」`);
                    }}
                  >
                    预览应用
                  </Button>
                  <div
                    className="channel-detail-aiset-hover-fav"
                    onClick={(e) => {
                      e.stopPropagation();
                      message.success('已收藏');
                    }}
                  >
                    <StarOutlined />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
