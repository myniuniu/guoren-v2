import { Empty } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

export default function CourseTab({ detail }) {
  const courses = detail.courses || [];
  if (courses.length === 0) {
    return <Empty description="暂无课程" />;
  }
  return (
    <div className="channel-detail-courses-row">
      {courses.map((c) => (
        <div
          key={c.id}
          className="channel-detail-course-card"
          onClick={() => window.open(`#/course-detail/${c.id}`, '_blank')}
          style={{ cursor: 'pointer' }}
        >
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
  );
}
