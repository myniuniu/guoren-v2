import { useEffect, useState } from 'react';
import { Button, Input, Spin, message, Empty, Avatar } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
  RightOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { studyClubApi, STUDY_CLUB_TABS } from './api';
import ChannelDetail from './ChannelDetail';
import PlaygroundTab from './PlaygroundTab';
import './StudyClubModule.css';

function renderBannerVisual() {
  return (
    <div className="study-club-banner-cover">
      <div className="study-club-banner-panel">
        <div className="study-club-banner-panel-top" />
        <div className="study-club-banner-panel-card">
          <div className="study-club-banner-panel-avatar">👩</div>
          <div className="study-club-banner-panel-lines">
            <span />
            <span />
          </div>
        </div>
        <div className="study-club-banner-panel-actions">
          <span />
          <span />
          <span />
        </div>
        <div className="study-club-banner-panel-list">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="study-club-banner-wave" />
      <div className="study-club-banner-star">✦</div>
    </div>
  );
}

function renderChannelVisual(channel) {
  if (channel.id === 'senior-community') {
    return (
      <div className="study-club-card-visual study-club-card-visual-senior" aria-hidden="true">
        <span className="study-club-card-visual-orb study-club-card-visual-orb-lg" />
        <span className="study-club-card-visual-orb study-club-card-visual-orb-sm top" />
        <span className="study-club-card-visual-orb study-club-card-visual-orb-sm bottom" />
        <div className="study-club-card-visual-portrait">{channel.badge}</div>
        <div className="study-club-card-visual-mini-avatar a">🙂</div>
        <div className="study-club-card-visual-mini-avatar b">🧑</div>
        <div className="study-club-card-visual-mini-avatar c">👩</div>
      </div>
    );
  }

  return (
    <div className="study-club-card-visual study-club-card-visual-family" aria-hidden="true">
      <div className="study-club-card-visual-board" />
      <div className="study-club-card-visual-chip chip-a" />
      <div className="study-club-card-visual-chip chip-b" />
      <div className="study-club-card-visual-chip chip-c" />
      <div className="study-club-card-visual-book">{channel.badge}</div>
      <div className="study-club-card-visual-bubble">家校</div>
    </div>
  );
}

export default function StudyClubModule() {
  const [activeTab, setActiveTab] = useState('channel');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [b, list] = await Promise.all([
        studyClubApi.getBanner(),
        studyClubApi.listChannels(),
      ]);
      setBanner(b);
      setChannels(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleToggleSub = async (e, ch) => {
    e.stopPropagation();
    try {
      const res = await studyClubApi.toggleSubscribe(ch.id);
      setChannels((prev) =>
        prev.map((c) => (c.id === res.id ? { ...c, subscribed: res.subscribed } : c))
      );
      message.success(res.subscribed ? `已订阅「${ch.title}」` : `已取消订阅「${ch.title}」`);
    } catch {
      message.error('操作失败，请重试');
    }
  };

  const filteredChannels = channels.filter((c) =>
    !keyword.trim() ? true : c.title.toLowerCase().includes(keyword.trim().toLowerCase())
  );

  // 详情页路由
  if (activeChannelId) {
    return (
      <ChannelDetail
        channelId={activeChannelId}
        onBack={() => {
          setActiveChannelId(null);
          // 返回列表后重新拉取订阅态
          studyClubApi.listChannels().then(setChannels);
        }}
      />
    );
  }

  return (
    <div className="study-club">
      {/* 顶部导航 */}
      <div className="study-club-header">
        <div className="study-club-brand">
          <div className="study-club-brand-logo">飞</div>
          <div className="study-club-brand-text">
            <span className="study-club-brand-platform">飞书</span>
            <span className="study-club-brand-product">飞行社</span>
          </div>
        </div>
        <div className="study-club-tabs">
          {STUDY_CLUB_TABS.map((tab) => (
            <div
              key={tab.key}
              className={`study-club-tab ${activeTab === tab.key ? 'study-club-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.tag ? <span className="study-club-tab-pro">{tab.tag}</span> : null}
            </div>
          ))}
        </div>
        <div className="study-club-actions">
          <Input
            allowClear
            placeholder="请输入关键词"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            className="study-club-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className="study-club-qa-link" type="button">
            <QuestionCircleOutlined />
            问答
          </button>
          <Avatar size={28} icon={<UserOutlined />} className="study-club-avatar" />
          <Button type="primary" icon={<PlusOutlined />} className="study-club-publish-btn">投稿</Button>
        </div>
      </div>

      {/* 内容主体 */}
      {activeTab === 'playground' ? (
        <PlaygroundTab />
      ) : (
        <div className="study-club-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '120px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
            {/* Banner */}
            {banner ? (
              <div className="study-club-banner">
                <div className="study-club-banner-text">
                  <div className="study-club-banner-title">
                    {banner.title}
                  </div>
                  <div className="study-club-banner-subtitle">
                    {banner.subtitle}
                  </div>
                  <div className="study-club-banner-desc">{banner.desc}</div>
                  <Button
                    type="primary"
                    size="large"
                    className="study-club-banner-cta"
                    icon={<RightOutlined />}
                    iconPosition="end"
                  >
                    {banner.ctaText}
                  </Button>
                </div>
                {renderBannerVisual()}
              </div>
            ) : null}

            {/* 频道卡片网格 */}
            {filteredChannels.length === 0 ? (
              <Empty description="暂无匹配的频道" style={{ marginTop: 80 }} />
            ) : (
              <div className="study-club-grid">
                {filteredChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className={[
                      'study-club-card',
                      `study-club-card-${ch.accent || 'blue'}`,
                      ch.highlighted ? 'study-club-card-highlighted' : '',
                    ].join(' ')}
                    onClick={() => setActiveChannelId(ch.id)}
                  >
                    <div className="study-club-card-top">
                      <div className="study-club-card-title">{ch.title}</div>
                      <div className="study-club-card-meta">
                        <span>{ch.contentCount} 个内容</span>
                        <span className="study-club-card-meta-divider" />
                        <span>{ch.updatedDesc}</span>
                      </div>
                    </div>
                    {renderChannelVisual(ch)}
                    <div className="study-club-card-bottom">
                      <Button
                        size="small"
                        className={`study-club-sub-btn ${
                          ch.subscribed
                            ? 'study-club-sub-btn-done'
                            : 'study-club-sub-btn-active'
                        }`}
                        icon={ch.subscribed ? <HeartFilled /> : <HeartOutlined />}
                        onClick={(e) => handleToggleSub(e, ch)}
                      >
                        {ch.subscribed ? '已订阅' : '订阅'}
                      </Button>
                      <span className="study-club-card-subscribers">
                        {ch.subscribersText} 人订阅
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      )}
    </div>
  );
}
