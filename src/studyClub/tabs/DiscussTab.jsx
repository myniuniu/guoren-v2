import { useState } from 'react';
import { Avatar, Button, Empty, message, Modal, Input } from 'antd';
import { MessageOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

export default function DiscussTab({ detail }) {
  const [expandedPosts, setExpandedPosts] = useState({});
  const [openPostId, setOpenPostId] = useState(null);

  const posts = detail.discussions || [];
  const groups = detail.relatedGroups || [];
  const togglePost = (id) =>
    setExpandedPosts((m) => ({ ...m, [id]: !m[id] }));

  return (
    <>
      <div className="channel-detail-discuss-layout">
        <div className="channel-detail-discuss-main">
          <div className="channel-detail-discuss-section-title">全部帖子 ({posts.length})</div>
          {posts.length === 0 ? (
            <Empty description="暂无帖子" />
          ) : (
            posts.map((p) => {
              const expanded = !!expandedPosts[p.id];
              const hasPoster = !!p.poster;
              return (
                <div
                  key={p.id}
                  className="channel-detail-post-card"
                  onClick={() => setOpenPostId(p.id)}
                >
                  <div className="channel-detail-post-head">
                    <Avatar size={28} style={{ background: '#cfe2ff' }}>
                      {p.author.slice(0, 1)}
                    </Avatar>
                    <strong>{p.author}</strong>
                    <span>{p.time}</span>
                    <span>· 在</span>
                    <span className="channel-detail-post-from">
                      <span className="channel-detail-post-from-icon">🌌</span>
                      {p.from}
                    </span>
                    <span>发布</span>
                  </div>
                  <div className="channel-detail-post-title">{p.title}</div>
                  <div
                    className={`channel-detail-post-body ${
                      hasPoster && !expanded ? 'collapsed' : ''
                    }`}
                  >
                    {p.paragraphs.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {hasPoster ? (
                      <div className="channel-detail-post-poster">
                        <div className="channel-detail-post-poster-head">
                          <div className="channel-detail-post-poster-head-left">
                            <span>🛫 研习社</span>
                            <span>· 飞书妙搭</span>
                          </div>
                          <span className="channel-detail-post-poster-head-tag">
                            {p.poster.tag}
                          </span>
                        </div>
                        <div className="channel-detail-post-poster-body">
                          <div className="channel-detail-post-poster-title">
                            {p.poster.titleLines.map((l, i) => (
                              <div key={i}>{l}</div>
                            ))}
                          </div>
                          <div className="channel-detail-post-poster-guest">
                            <Avatar size={48} style={{ background: '#1d3edb', color: '#fff' }}>
                              <UserOutlined />
                            </Avatar>
                            <div>
                              <div className="channel-detail-post-poster-guest-name">
                                ★ 特邀 AI 飞行家：{p.poster.guest}
                              </div>
                              <div className="channel-detail-post-poster-guest-desc">
                                {p.poster.guestDesc}
                              </div>
                            </div>
                          </div>
                          <div className="channel-detail-post-poster-metric">
                            <div>
                              <div className="channel-detail-post-poster-metric-value">
                                {p.poster.metric}
                              </div>
                              <div className="channel-detail-post-poster-metric-desc">
                                节省约
                              </div>
                            </div>
                            <div className="channel-detail-post-poster-metric-desc">
                              {p.poster.metricDesc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {hasPoster ? (
                    <div className="channel-detail-post-expand" onClick={(e) => e.stopPropagation()}>
                      <Button
                        className="channel-detail-post-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePost(p.id);
                        }}
                      >
                        {expanded ? '收起' : '展开'}
                      </Button>
                    </div>
                  ) : null}
                  {p.replies && p.replies.length > 0 ? (
                    <div className="channel-detail-post-replies">
                      <div className="channel-detail-post-replies-title">
                        更早 {p.replies.length} 条回复
                      </div>
                      {p.replies.map((r) => (
                        <div key={r.id} className="channel-detail-post-reply-item">
                          <strong>{r.author}：</strong>
                          {r.text}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="channel-detail-post-reply-bar">
                    <MessageOutlined /> 回复
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="channel-detail-discuss-side">
          <div className="channel-detail-discuss-section-title">关联群组 ({groups.length})</div>
          {groups.length === 0 ? (
            <Empty description="暂无关联群组" />
          ) : (
            groups.map((g) => (
              <div key={g.id} className="channel-detail-group-card">
                <div className="channel-detail-group-head">
                  <div className="channel-detail-group-avatar">{g.avatar}</div>
                  <div className="channel-detail-group-name">{g.name}</div>
                </div>
                <div className="channel-detail-group-desc">{g.desc}</div>
                <div className="channel-detail-group-foot">
                  <span>👥 {g.count}</span>
                  <button
                    className="channel-detail-group-goto"
                    onClick={() => message.info(`前往群组「${g.name}」`)}
                  >
                    前往
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PostDetailModal
        post={openPostId ? posts.find((p) => p.id === openPostId) : null}
        from={detail}
        onClose={() => setOpenPostId(null)}
      />
    </>
  );
}

// ====== 帖子详情弹窗 ======
function PostDetailModal({ post, from, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  useEffect(() => {
    if (post) {
      setExpanded(false);
      setReplyText('');
    }
  }, [post && post.id]);
  if (!post) return null;
  const hasPoster = !!post.poster;
  const replies = post.replies || [];

  return (
    <Modal
      open={!!post}
      onCancel={onClose}
      footer={null}
      width={760}
      title="帖子详情"
      className="channel-detail-post-modal"
      destroyOnClose
    >
      <div className="post-modal-author">
        <Avatar size={44} style={{ background: '#cfe2ff', flexShrink: 0 }}>
          {post.author.slice(0, 1)}
        </Avatar>
        <div className="post-modal-author-info">
          <div className="post-modal-author-name">{post.author}</div>
          <div className="post-modal-author-meta">
            <span>{post.time}</span>
            <span className="post-modal-author-divider">|</span>
            <span>在</span>
            <span className="post-modal-from">
              <span className="post-modal-from-icon">🌌</span>
              {post.from}
            </span>
            <span>发布</span>
          </div>
        </div>
      </div>

      {post.title ? <div className="post-modal-title">{post.title}</div> : null}
      <div className={`post-modal-body ${hasPoster && !expanded ? 'collapsed' : ''}`}>
        {(post.paragraphs || []).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {hasPoster ? (
          <div className="channel-detail-post-poster">
            <div className="channel-detail-post-poster-head">
              <div className="channel-detail-post-poster-head-left">
                <span>🛫 研习社</span>
                <span>· 飞书妙搭</span>
              </div>
              <span className="channel-detail-post-poster-head-tag">{post.poster.tag}</span>
            </div>
            <div className="channel-detail-post-poster-body">
              <div className="channel-detail-post-poster-title">
                {post.poster.titleLines.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
              <div className="channel-detail-post-poster-guest">
                <Avatar size={48} style={{ background: '#1d3edb', color: '#fff' }}>
                  <UserOutlined />
                </Avatar>
                <div>
                  <div className="channel-detail-post-poster-guest-name">
                    ★ 特邀 AI 飞行家：{post.poster.guest}
                  </div>
                  <div className="channel-detail-post-poster-guest-desc">
                    {post.poster.guestDesc}
                  </div>
                </div>
              </div>
              <div className="channel-detail-post-poster-metric">
                <div>
                  <div className="channel-detail-post-poster-metric-value">
                    {post.poster.metric}
                  </div>
                  <div className="channel-detail-post-poster-metric-desc">节省约</div>
                </div>
                <div className="channel-detail-post-poster-metric-desc">
                  {post.poster.metricDesc}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {hasPoster ? (
        <div className="post-modal-expand">
          <Button
            className="channel-detail-post-expand-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
        </div>
      ) : null}

      <div className="post-modal-divider" />

      <div className="post-modal-replies-title">全部回复 ({replies.length})</div>
      <div className="post-modal-replies">
        {replies.length === 0 ? (
          <div className="post-modal-reply-empty">暂无回复，成为首个发言的人吧</div>
        ) : (
          replies.map((r) => (
            <div key={r.id} className="post-modal-reply-item">
              <Avatar size={28} style={{ background: '#ffd6e7', color: '#c41d7f', flexShrink: 0 }}>
                {r.author.slice(0, 1)}
              </Avatar>
              <div className="post-modal-reply-content">
                <div className="post-modal-reply-author">{r.author}</div>
                <div className="post-modal-reply-text">{r.text}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="post-modal-input-bar">
        <Input
          placeholder="赞观点、互启发、共探讨..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onPressEnter={() => {
            if (!replyText.trim()) return;
            message.success('回复已发送');
            setReplyText('');
          }}
          bordered={false}
        />
        <button
          className="post-modal-input-send"
          onClick={() => {
            if (!replyText.trim()) return;
            message.success('回复已发送');
            setReplyText('');
          }}
        >
          <SendOutlined />
        </button>
      </div>
    </Modal>
  );
}
