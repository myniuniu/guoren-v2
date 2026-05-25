import { Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';

export default function ActivityTab({ detail }) {
  const activities = detail.activities || [];
  if (activities.length === 0) {
    return <Empty description="暂无活动" />;
  }
  return (
    <div className="channel-detail-activity-grid">
      {activities.map((a) => (
        <div key={a.id} className="channel-detail-activity-card">
          <div
            className={`channel-detail-activity-cover ${a.coverLight ? 'channel-detail-activity-cover-light' : ''}`}
            style={{ background: a.coverGradient }}
          >
            <div className="channel-detail-activity-badge">
              {a.badge}
              {a.liveTime ? <span className="channel-detail-activity-livetime">{a.liveTime}</span> : null}
            </div>
            <div className="channel-detail-activity-cover-inner">
              <div className="channel-detail-activity-cover-text">
                <div className="channel-detail-activity-cover-title">{a.coverTitle}</div>
                {a.coverTitle2 ? (
                  <div className="channel-detail-activity-cover-title2">
                    {a.coverTitle2.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                ) : null}
                <div className="channel-detail-activity-cover-desc">
                  {(a.coverDesc || '').split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                {a.ctaText ? (
                  <button className={`channel-detail-activity-cta channel-detail-activity-cta-${a.ctaStyle || 'pill-blue'}`}>
                    {a.ctaText} <RightOutlined />
                  </button>
                ) : null}
              </div>
              <div className="channel-detail-activity-cover-emoji">{a.coverEmoji}</div>
            </div>
          </div>
          <div className="channel-detail-activity-body">
            <div className="channel-detail-activity-title-row">
              <div className="channel-detail-activity-title">{a.title}</div>
              {a.hasRegister ? (
                <button className="channel-detail-activity-register">报名</button>
              ) : null}
            </div>
            <div className="channel-detail-activity-summary">{a.summary}</div>
            <div className="channel-detail-activity-foot">
              <span className={`channel-detail-activity-status channel-detail-activity-status-${a.status}`}>
                {a.statusText}
              </span>
              <span className="channel-detail-activity-date">{a.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
