import { useEffect, useState } from 'react';
import { Avatar, Button, Spin, message } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { studyClubApi } from './api';
import HomeTab from './tabs/HomeTab';
import DiscussTab from './tabs/DiscussTab';
import AiSetTab from './tabs/AiSetTab';
import CourseTab from './tabs/CourseTab';
import ArticleTab from './tabs/ArticleTab';
import ActivityTab from './tabs/ActivityTab';
import './ChannelDetail.css';

export default function ChannelDetail({ channelId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const handleOpenInspire = (id) => {
    window.open(`#/inspire-detail/${id}`, '_blank');
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studyClubApi.getChannelDetail(channelId).then((d) => {
      if (cancelled) return;
      setDetail(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const handleToggleSub = async () => {
    if (!detail) return;
    try {
      const res = await studyClubApi.toggleSubscribe(detail.id);
      setDetail((d) => ({ ...d, subscribed: res.subscribed }));
      message.success(res.subscribed ? '已订阅' : '已取消订阅');
    } catch {
      message.error('操作失败，请重试');
    }
  };

  if (loading || !detail) {
    return (
      <div className="channel-detail">
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discuss':
        return <DiscussTab detail={detail} />;
      case 'ai-set':
        return <AiSetTab detail={detail} onInspireClick={handleOpenInspire} />;
      case 'course':
        return <CourseTab detail={detail} />;
      case 'article':
        return <ArticleTab detail={detail} />;
      case 'activity':
        return <ActivityTab detail={detail} />;
      default:
        return <HomeTab detail={detail} />;
    }
  };

  return (
    <div className="channel-detail">
      {/* 面包屑 */}
      <div className="channel-detail-breadcrumb">
        <span className="channel-detail-breadcrumb-link" onClick={onBack}>首页</span>
        <span className="channel-detail-breadcrumb-sep">/</span>
        <span className="channel-detail-breadcrumb-link" onClick={onBack}>频道</span>
        <span className="channel-detail-breadcrumb-sep">/</span>
        <span className="channel-detail-breadcrumb-current">{detail.title}{detail.titleSecond || ''}</span>
      </div>

      <div className="channel-detail-body">
        {/* Banner + 订阅卡 */}
        <div className="channel-detail-banner-row">
          <div className="channel-detail-banner">
            <div className="channel-detail-banner-text">
              <div className="channel-detail-banner-title">
                <em>{detail.title}</em>
                {detail.titleSecond ? (
                  <>
                    <br />
                    {detail.titleSecond}
                  </>
                ) : null}
              </div>
              <div className="channel-detail-banner-desc">{detail.description}</div>
            </div>
            <div className="channel-detail-banner-cover">
              {detail.coverEmoji}
              <div className="channel-detail-banner-avatars">
                <Avatar size={48} style={{ background: '#ffd6a8' }}>👩</Avatar>
                <Avatar size={48} style={{ background: '#d1c1ff' }}>🧒</Avatar>
                <Avatar size={48} style={{ background: '#bfe1ff' }}>👧</Avatar>
              </div>
            </div>
          </div>

          <div className="channel-detail-side-card">
            <div className="channel-detail-side-title">{detail.title}{detail.titleSecond || ''}</div>
            <div className="channel-detail-side-operator">
              <span>运营者：</span>
              <Avatar size={20} style={{ background: '#ffd6e6' }}>{detail.operator?.avatar}</Avatar>
              <strong style={{ color: '#1f1f1f' }}>{detail.operator?.name}</strong>
            </div>
            <div className="channel-detail-side-desc">{detail.description}</div>
            <Button
              type="primary"
              className={`channel-detail-side-sub-btn ${detail.subscribed ? 'channel-detail-side-sub-btn-done' : ''}`}
              icon={detail.subscribed ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleToggleSub}
            >
              {detail.subscribed
                ? `已订阅（${detail.subscribersText}人订阅）`
                : `订阅（${detail.subscribersText}人订阅）`}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="channel-detail-tabs">
          {detail.tabs.map((t) => (
            <div
              key={t.key}
              className={`channel-detail-tab ${activeTab === t.key ? 'channel-detail-tab-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {typeof t.count === 'number' ? (
                <span className="channel-detail-tab-count">({t.count})</span>
              ) : null}
            </div>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}
