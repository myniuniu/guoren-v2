import { useEffect, useState } from 'react';
import { Avatar, Input, Select, Spin, Empty } from 'antd';
import {
  SendOutlined,
  DownOutlined,
  FireFilled,
  ForkOutlined,
  StarOutlined,
  MessageOutlined,
  EyeOutlined,
  LikeOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { studyClubApi } from './api';

const SUB_TABS = [
  { key: 'workshop', label: 'AI 工坊' },
  { key: 'agent', label: '智能体' },
  { key: 'inspire', label: '灵感市集' },
];

export default function PlaygroundTab() {
  const [activeSubKey, setActiveSubKey] = useState('workshop');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    setLoading(true);
    studyClubApi.getPlaygroundItems(activeSubKey).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [activeSubKey]);

  return (
    <div className="aipark">
      {/* 顶部 Banner - 公用 */}
      <div className="aipark-banner">
        <div className="aipark-banner-text">
          开始你的 <span className="aipark-banner-highlight">'AI游乐园'</span> 之旅
        </div>
        <div className="aipark-banner-mascot">🐲</div>
        <div className="aipark-banner-search">
          <Select defaultValue="aily" size="small" className="aipark-banner-select" suffixIcon={<DownOutlined />} variant="borderless">
            <Select.Option value="aily">aily</Select.Option>
          </Select>
          <Input
            placeholder="给我指派一个任务"
            variant="borderless"
            className="aipark-banner-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <button className={`aipark-banner-send${searchVal.trim() ? ' active' : ''}`}><SendOutlined /></button>
        </div>
      </div>

      {/* 子分类 Tabs */}
      <div className="aipark-content">
      <div className="aipark-subtabs">
        {SUB_TABS.map((c) => (
          <div
            key={c.key}
            className={`aipark-subtab ${activeSubKey === c.key ? 'aipark-subtab-active' : ''}`}
            onClick={() => setActiveSubKey(c.key)}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="aipark-filters">
          <div className="aipark-filters-left">
            <span className="aipark-filter-tag">角色 <DownOutlined /></span>
            <span className="aipark-filter-item">产品经理</span>
            <span className="aipark-filter-item">市场</span>
            <span className="aipark-filter-item">运营</span>
            <span className="aipark-filter-sep" />
            <span className="aipark-filter-tag">AI 应用类型 <DownOutlined /></span>
            <span className="aipark-filter-item">招生生成</span>
            <span className="aipark-filter-item">图片生成</span>
            <span className="aipark-filter-sep" />
            <span className="aipark-filter-tag">产品功能 <DownOutlined /></span>
            <span className="aipark-filter-item">妙搭</span>
            <span className="aipark-filter-item">飞书 aily</span>
            <span className="aipark-filter-sep" />
            <span className="aipark-filter-hot"><FireFilled style={{ color: '#ff4d4f' }} /> 热点 <DownOutlined /></span>
          </div>
          <div className="aipark-filters-right">
            <span className="aipark-filter-sort">计 最热 <DownOutlined /></span>
          </div>
        </div>

      {/* 内容区 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin /></div>
      ) : items.length === 0 ? (
        <Empty description="暂无作品" />
      ) : activeSubKey === 'inspire' ? (
        /* 灵感市集 - 列表布局 */
        <div className="aipark-inspire-list">
          {items.map((it) => (
            <div key={it.id} className="aipark-inspire-item">
              <div className="aipark-inspire-cover" style={{ background: it.coverGradient }}>
                <span className={`aipark-inspire-cover-text ${it.coverDark ? 'is-dark' : ''}`}>{it.coverTitle}</span>
              </div>
              <div className="aipark-inspire-body">
                <div className="aipark-inspire-title">{it.title}</div>
                <div className="aipark-inspire-meta">
                  <Avatar size={20} style={{ background: it.avatarColor || '#cfe2ff', fontSize: 12 }}>
                    {it.avatar || it.author.slice(0, 1)}
                  </Avatar>
                  <span className="aipark-inspire-author">{it.author}</span>
                  <span className="aipark-inspire-time">{it.time}</span>
                </div>
                <div className="aipark-inspire-summary">{it.summary}</div>
                <div className="aipark-inspire-stats">
                  {it.likes != null && <span><LikeOutlined /> {it.likes}</span>}
                  {it.stars != null && <span><StarOutlined /> {it.stars}</span>}
                  <span><ShareAltOutlined /> 分享</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeSubKey === 'agent' ? (
        /* 智能体卡片 - 3列横向布局 */
        <div className="aipark-agent-grid">
          {items.map((it) => (
            <div key={it.id} className="aipark-agent-card">
              <div className="aipark-agent-thumb" style={{ background: it.thumbBg }}>
                <Avatar size={56} style={{ background: it.avatarColor, fontSize: 20 }}>
                  {it.title.slice(0, 1)}
                </Avatar>
              </div>
              <div className="aipark-agent-body">
                <div className="aipark-agent-title">{it.title}</div>
                <div className="aipark-agent-desc">{it.desc}</div>
                <div className="aipark-agent-footer">
                  <div className="aipark-agent-author">
                    <Avatar size={18} style={{ background: it.avatarColor, fontSize: 10 }}>
                      {it.author.slice(0, 1)}
                    </Avatar>
                    <span>{it.author}</span>
                  </div>
                  <div className="aipark-agent-stats">
                    <span><StarOutlined /> {it.stars}</span>
                    <span><EyeOutlined /> {it.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* AI 工坊卡片 - 4列垂直布局 */
        <div className="aipark-grid">
          {items.map((it) => (
            <div key={it.id} className="aipark-card">
              <div className="aipark-card-header">
                <div className="aipark-card-author">
                  <span className="aipark-card-avatar-dot" style={{ background: it.avatarColor || '#4fc3f7' }} />
                  <span className="aipark-card-author-name">{it.author}</span>
                  <ForkOutlined className="aipark-card-fork" />
                </div>
                <div className="aipark-card-stats">
                  <span><StarOutlined /> {it.views}</span>
                  {it.comments > 0 && <span><MessageOutlined /> {it.comments}</span>}
                </div>
              </div>
              <div className="aipark-card-title">{it.title}</div>
              {it.desc ? (
                <div className="aipark-card-desc">{it.desc}</div>
              ) : (
                <div className="aipark-card-cover" style={{ background: it.cover }}>
                  <span className={`aipark-card-emoji ${it.dark ? 'is-dark' : ''}`}>{it.emoji}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
