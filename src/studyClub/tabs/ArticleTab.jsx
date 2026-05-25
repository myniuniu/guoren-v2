import { Avatar, Empty } from 'antd';
import { LikeOutlined, StarOutlined, ShareAltOutlined } from '@ant-design/icons';

export default function ArticleTab({ detail }) {
  const articles = detail.articles || [];
  if (articles.length === 0) {
    return <Empty description="暂无文章" />;
  }
  return (
    <div className="channel-detail-article-list">
      {articles.map((a) => (
        <div key={a.id} className="channel-detail-article-card" onClick={() => window.open(`#/article-detail/${a.id}`, '_blank')} style={{ cursor: 'pointer' }}>
          <div className={`channel-detail-article-thumb channel-detail-article-thumb-${a.thumbType}`}>
            {a.thumbType === 'doc' ? (
              <>
                <div className="channel-detail-article-thumb-doc" style={{ background: a.thumb1 }}>
                  <div className="channel-detail-article-thumb-doc-title">前言</div>
                  <div className="channel-detail-article-thumb-doc-lines">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} style={{ width: `${50 + ((i * 13) % 40)}%` }} />
                    ))}
                  </div>
                </div>
                <div className="channel-detail-article-thumb-doc" style={{ background: a.thumb2 }}>
                  <div className="channel-detail-article-thumb-doc-tag">（配图+源码）</div>
                  <div className="channel-detail-article-thumb-doc-subtitle">摘要</div>
                  <div className="channel-detail-article-thumb-doc-lines">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="channel-detail-article-thumb-stamp" style={{ background: a.thumb1 }}>
                <div className="channel-detail-article-stamp-box">
                  <span className="channel-detail-article-stamp-title">超级个体</span>
                  <span className="channel-detail-article-stamp-sub">一人创业公司(OPC)</span>
                </div>
              </div>
            )}
          </div>
          <div className="channel-detail-article-body">
            <div className="channel-detail-article-title">{a.title}</div>
            <div className="channel-detail-article-meta">
              <Avatar size={22}>{a.avatar}</Avatar>
              <span className="channel-detail-article-author">{a.author}</span>
              <span className="channel-detail-article-divider">|</span>
              <span className="channel-detail-article-time">{a.time}</span>
              {a.tags.map((t, i) => (
                <span key={i} className={`channel-detail-article-tag channel-detail-article-tag-${t.color}`}>
                  {t.text}
                </span>
              ))}
            </div>
            <div className="channel-detail-article-summary">{a.summary}</div>
            <div className="channel-detail-article-actions">
              <span><LikeOutlined /> {a.likes}</span>
              <span><StarOutlined /> {a.stars}</span>
              <span><ShareAltOutlined /> 分享</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
