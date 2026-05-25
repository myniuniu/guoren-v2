import { useState, useEffect } from 'react';
import { Button, Spin, Avatar } from 'antd';
import { ShareAltOutlined, HeartOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { studyClubApi } from './api';
import './CourseDetailPage.css';

export default function CourseDetailPage() {
  const [course, setCourse] = useState(null);

  useEffect(() => {
    // 解除 #root 的 overflow:hidden 限制
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
    const match = hash.match(/^#\/course-detail\/(.+)$/);
    if (!match) return;
    const courseId = match[1];

    studyClubApi.getChannelDetail('super-individual').then((detail) => {
      const courses = detail?.courses || [];
      const found = courses.find((c) => c.id === courseId);
      if (found) setCourse(found);
    });
  }, []);

  if (!course) {
    return (
      <div className="course-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  const d = course.detail || {};
  const toc = d.toc || [];
  const incentive = d.incentive || {};
  const channel = d.channel || {};
  const progress = d.progress || {};

  return (
    <div className="course-detail-page">
      {/* 顶部 Hero 区域 */}
      <div className="course-detail-hero">
        <div className="course-detail-hero-cover" style={{ background: course.cover }}>
          <div className="course-detail-hero-cover-avatar">👨‍🏫</div>
          <div className="course-detail-hero-cover-info">
            <div className="course-detail-hero-cover-speaker">{course.speaker}</div>
            <div className="course-detail-hero-cover-tags">
              {course.tag}
              {course.liveTag ? <> | <PlayCircleOutlined /> {course.liveTag}</> : null}
            </div>
          </div>
        </div>
        <div className="course-detail-hero-right">
          <h1 className="course-detail-hero-title">
            {course.title}
            <span className="course-detail-hero-share"><ShareAltOutlined /> 分享</span>
          </h1>
          <p className="course-detail-hero-desc">{d.description}</p>
          <div className="course-detail-hero-tags">
            {(d.tags || []).map((tag, i) => (
              <span key={i} className="course-detail-hero-tag">{tag}</span>
            ))}
          </div>
          <div className="course-detail-hero-actions">
            <Button type="primary" className="course-detail-hero-btn">继续学习</Button>
            <span className="course-detail-hero-progress">
              ○ {progress.status} {progress.current}/{progress.total}节
            </span>
          </div>
        </div>
      </div>

      {/* 下方内容区 */}
      <div className="course-detail-body">
        {/* 左侧课程目录 */}
        <div className="course-detail-main">
          <div className="course-detail-main-tabs">
            <span className="course-detail-main-tab active">课程目录</span>
          </div>
          <div className="course-detail-toc">
            {toc.map((item, idx) => (
              <div key={item.id} className="course-detail-toc-item">
                <span className="course-detail-toc-num">{idx + 1}</span>
                <div className="course-detail-toc-content">
                  <div className="course-detail-toc-title">
                    {item.title}
                    {item.tag && <span className="course-detail-toc-tag">{item.tag}</span>}
                  </div>
                  <div className="course-detail-toc-subtitle">
                    <span className="course-detail-toc-icon">{item.icon}</span>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="course-detail-sidebar">
          {/* 学习激励 */}
          <div className="course-detail-sidebar-card">
            <h3 className="course-detail-sidebar-title">学习激励</h3>
            <div className="course-detail-sidebar-incentive">
              <span className="course-detail-sidebar-incentive-icon">{incentive.icon}</span>
              <span className="course-detail-sidebar-incentive-name">{incentive.name}</span>
              <span className="course-detail-sidebar-incentive-points">+ {incentive.points}</span>
            </div>
          </div>

          {/* 所属频道 */}
          <div className="course-detail-sidebar-card">
            <h3 className="course-detail-sidebar-title">所属频道</h3>
            <div className="course-detail-sidebar-channel-cover" style={{ background: channel.cover }}>
              <div className="course-detail-sidebar-channel-overlay">
                <span className="course-detail-sidebar-channel-name-lg">{channel.name}</span>
                <span className="course-detail-sidebar-channel-desc-sm">{channel.desc}</span>
              </div>
              <div className="course-detail-sidebar-channel-avatars">
                <Avatar size={36} style={{ background: '#4fc3f7' }}>👦</Avatar>
                <Avatar size={28} style={{ background: '#e1bee7', marginLeft: -8 }}>🧑</Avatar>
                <Avatar size={28} style={{ background: '#fff9c4', marginLeft: -8 }}>👩</Avatar>
              </div>
            </div>
            <div className="course-detail-sidebar-channel-info">
              <div className="course-detail-sidebar-channel-name">{channel.name}</div>
              <div className="course-detail-sidebar-channel-meta">
                <span>{channel.subscribers}人订阅</span>
                <span className="course-detail-sidebar-channel-sub">
                  <HeartOutlined /> 已订阅
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
