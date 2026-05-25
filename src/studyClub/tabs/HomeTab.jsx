import { Avatar, Empty } from 'antd';
import {
  RightOutlined,
  EyeOutlined,
  MessageOutlined,
  ThunderboltFilled,
  PlayCircleOutlined,
} from '@ant-design/icons';

export default function HomeTab({ detail }) {
  return (
    <>
      {/* 正在热议 */}
      <div className="channel-detail-section">
        <div className="channel-detail-section-head">
          <div className="channel-detail-section-title">正在热议</div>
          <span className="channel-detail-section-more">
            <RightOutlined />
          </span>
        </div>
        {detail.hotDiscussions.length === 0 ? (
          <Empty description="暂无热议" />
        ) : (
          <div className="channel-detail-discuss-row">
            {detail.hotDiscussions.map((d) => (
              <div key={d.id} className="channel-detail-discuss-card">
                <div className="channel-detail-discuss-meta">
                  <Avatar size={20} style={{ background: '#cfe2ff' }}>
                    {d.author.slice(0, 1)}
                  </Avatar>
                  <strong>{d.author}</strong>
                  <span>{d.time}</span>
                  <span>在</span>
                  <span className="channel-detail-discuss-from">
                    <ThunderboltFilled style={{ marginRight: 2 }} />
                    {d.from}
                  </span>
                  <span>发布</span>
                </div>
                <div className="channel-detail-discuss-content">{d.content}</div>
                <div className="channel-detail-discuss-foot">
                  <span>
                    <MessageOutlined /> {d.comments}
                  </span>
                  <a>
                    查看详情 <RightOutlined />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI 工坊 */}
      <div className="channel-detail-section">
        <div className="channel-detail-section-head">
          <div className="channel-detail-section-title">AI 工坊</div>
          <span className="channel-detail-section-more">
            全部 <RightOutlined />
          </span>
        </div>
        {detail.aiWorkshop.length === 0 ? (
          <Empty description="暂无作品" />
        ) : (
          <div className="channel-detail-workshop-row">
            {detail.aiWorkshop.map((w) => (
              <div key={w.id} className="channel-detail-workshop-card">
                <div className="channel-detail-workshop-meta">
                  <Avatar size={20} style={{ background: '#ffd6a8' }}>
                    {w.author.slice(0, 1)}
                  </Avatar>
                  <strong>{w.author}</strong>
                  <ThunderboltFilled style={{ color: '#faad14', fontSize: 12 }} />
                  <div className="channel-detail-workshop-meta-stats">
                    <span><EyeOutlined /> {w.views}</span>
                    <span><MessageOutlined /> {w.comments}</span>
                  </div>
                </div>
                <div className="channel-detail-workshop-title">{w.title}</div>
                <div className="channel-detail-workshop-cover" style={{ background: w.cover }}>
                  {w.emoji}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 精选课程 */}
      <div className="channel-detail-section">
        <div className="channel-detail-section-head">
          <div className="channel-detail-section-title">精选课程</div>
          <span className="channel-detail-section-more">
            全部 <RightOutlined />
          </span>
        </div>
        {detail.courses.length === 0 ? (
          <Empty description="暂无课程" />
        ) : (
          <div className="channel-detail-courses-row">
            {detail.courses.map((c) => (
              <div key={c.id} className="channel-detail-course-card">
                <div className="channel-detail-course-cover" style={{ background: c.cover }}>
                  👨‍🏫
                  <div className="channel-detail-course-cover-tag">
                    {c.tag}
                    {c.liveTag ? <> · <PlayCircleOutlined /> {c.liveTag}</> : null}
                  </div>
                </div>
                <div className="channel-detail-course-body">
                  <div className="channel-detail-course-title">{c.title}</div>
                  <div className="channel-detail-course-meta">
                    <span>📚 {c.chapters} 节课</span>
                    <span>🏃 {c.learners} 里程</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
