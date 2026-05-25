import { useState, useEffect } from 'react';
import { Avatar, Button, Spin } from 'antd';
import {
  LeftOutlined,
  MessageOutlined,
  StarOutlined,
  ShareAltOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { studyClubApi } from './api';
import './ArticleDetailPage.css';

export default function ArticleDetailPage() {
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.overflow = 'auto';
    }
    return () => {
      if (root) {
        root.style.height = '';
        root.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/^#\/article-detail\/(.+)$/);
    if (!match) return;
    const articleId = match[1];

    studyClubApi.getChannelDetail('super-individual').then((detail) => {
      const articles = detail?.articles || [];
      const found = articles.find((a) => a.id === articleId);
      if (found) setArticle(found);
    });
  }, []);

  if (!article) {
    return (
      <div className="article-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  const d = article.detail || {};
  const toc = d.toc || [];
  const body = d.body || [];
  const moreWorks = d.moreWorks || [];

  return (
    <div className="article-detail-page">
      {/* 顶部面包屑 */}
      <div className="article-detail-breadcrumb">
        <span>首页</span>
        <span className="article-detail-breadcrumb-sep">&gt;</span>
        <span>知识</span>
        <span className="article-detail-breadcrumb-sep">&gt;</span>
        <span className="article-detail-breadcrumb-current">{article.title}</span>
        <div className="article-detail-breadcrumb-actions">
          <span><MessageOutlined /> {d.comments || 0}</span>
          <span><StarOutlined /> {d.favorites || 0}</span>
          <span><ShareAltOutlined /> 分享</span>
        </div>
      </div>

      <div className="article-detail-content">
        {/* 左侧目录 */}
        <aside className="article-detail-sidebar">
          <div className="article-detail-sidebar-back" onClick={() => window.close()}>
            <LeftOutlined /><LeftOutlined style={{ marginLeft: -6 }} />
          </div>
          <div className="article-detail-sidebar-title">{article.title}</div>
          <nav className="article-detail-toc">
            {toc.map((t) => (
              <div
                key={t.id}
                className={`article-detail-toc-item ${t.level === 2 ? 'level-2' : ''}`}
              >
                {t.text}
              </div>
            ))}
          </nav>
        </aside>

        {/* 中间正文 */}
        <main className="article-detail-main">
          <h1 className="article-detail-main-title">{article.title}</h1>
          <div className="article-detail-main-body">
            {body.map((block, idx) => {
              if (block.type === 'blockquote') {
                return (
                  <blockquote key={idx} className="article-detail-blockquote">
                    {block.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </blockquote>
                );
              }
              if (block.type === 'heading') {
                return <h2 key={idx} className="article-detail-heading">{block.text}</h2>;
              }
              if (block.type === 'list') {
                return (
                  <ul key={idx} className="article-detail-list">
                    {block.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                );
              }
              if (block.type === 'link') {
                return (
                  <p key={idx} className="article-detail-link-block">
                    {block.text}<a href={`https://${block.url}`} target="_blank" rel="noreferrer">{block.url}</a>
                  </p>
                );
              }
              if (block.type === 'image') {
                return (
                  <div key={idx} className="article-detail-img" style={{ background: block.gradient }}>
                    <span className="article-detail-img-alt">{block.alt}</span>
                  </div>
                );
              }
              return <p key={idx} className="article-detail-paragraph">{block.text}</p>;
            })}
          </div>
        </main>

        {/* 右侧边栏 */}
        <aside className="article-detail-right">
          <div className="article-detail-right-card">
            <div className="article-detail-right-title">{article.title}</div>
            <div className="article-detail-right-meta">
              <Avatar size={24} style={{ background: '#e8f4ff' }}>{article.avatar}</Avatar>
              <span className="article-detail-right-author">{article.author}</span>
              <span className="article-detail-right-time">{article.time}</span>
            </div>
            <div className="article-detail-right-desc">{d.desc}</div>
            <Button type="primary" block className="article-detail-right-fav-btn">
              <StarOutlined /> 收藏
            </Button>
          </div>

          <div className="article-detail-right-more">
            <h3 className="article-detail-right-more-title">更多作品</h3>
            {moreWorks.map((w, i) => (
              <div key={i} className="article-detail-right-work">
                <div className="article-detail-right-work-title">{w.title}</div>
                <div className="article-detail-right-work-stats">
                  收藏：{w.favorites} &nbsp; 获赞：{w.likes}
                </div>
              </div>
            ))}
          </div>

          <div className="article-detail-right-expand">
            <FullscreenOutlined />
          </div>
        </aside>
      </div>
    </div>
  );
}
