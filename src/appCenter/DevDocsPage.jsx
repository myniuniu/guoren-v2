import { useState } from 'react';
import { Input, Button } from 'antd';
import {
  SearchOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  ApiOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import './DevDocsPage.css';

const topNav = [
  { key: 'cases', label: '客户案例' },
  { key: 'app-center', label: '应用中心' },
  { key: 'docs', label: '开发文档', active: true },
  { key: 'assistant', label: '智能助手' },
  { key: 'changelog', label: '更新日志' },
];

const subNav = [
  { key: 'home', label: '文档首页', active: true },
  { key: 'guide', label: '开发指南' },
  { key: 'tutorial', label: '开发教程' },
  { key: 'server-api', label: '服务端 API' },
  { key: 'client-api', label: '客户端 API' },
  { key: 'cli', label: 'CLI' },
  { key: 'openclaw', label: 'OpenClaw 官方插件' },
];

const aiQuestions = [
  { emoji: '📝', text: '出差审批通过之后，怎么改变头像的状态？' },
  { emoji: '💡', text: '如何从 0-1 搭建一个机器人？' },
  { emoji: '🎉', text: '机器人如何监测新人入群，并进行通知？' },
  { emoji: '🪪', text: '如何获取不同的用户 ID？' },
];

const errorSamples = ['202407211618216F3E9EB64DC7E1234', '99991672'];

const noviceSteps = [
  {
    step: 1,
    title: '了解基本流程',
    cards: [
      {
        name: '自建应用开发流程',
        tag: '介绍',
        tagColor: 'blue',
        desc: '企业自主开发或授权开发，量身打造专属应用，仅供企业内部使用。',
      },
      {
        name: '商店应用入驻流程',
        tag: '介绍',
        tagColor: 'blue',
        desc: '成为 ISV（独立软件服务商），以开放能力为基础，开发应用并上架至应用中心。',
      },
    ],
  },
  {
    step: 2,
    title: '体验开放能力',
    cards: [
      {
        name: '服务端 API',
        tag: '教程',
        tagColor: 'green',
        desc: '2,500+ 开放接口与事件，全面开放协作能力。',
      },
      {
        name: '机器人',
        tag: '教程',
        tagColor: 'green',
        desc: '基于会话与用户进行交互，支持自动化管理群组、响应用户消息。',
      },
      {
        name: '网页应用',
        tag: '教程',
        tagColor: 'green',
        desc: '使用 H5 开发应用，与客户端完美适配，打造无缝用户体验。',
      },
      {
        name: '消息卡片',
        tag: '教程',
        tagColor: 'green',
        desc: '将文本内容以卡片形式嵌入聊天消息等场景中，提升信息传递效率。',
      },
    ],
  },
  {
    step: 3,
    title: '挖掘特色能力',
    cards: [
      {
        name: '云文档小组件',
        tag: '指南',
        tagColor: 'blue',
        desc: '在云文档中嵌入自定义功能模块的小组件，扩展云文档能力。',
      },
      {
        name: '多维表格插件',
        tag: '指南',
        tagColor: 'blue',
        desc: '在多维表格中嵌入自定义功能模块的插件，扩展多维表格能力。',
      },
      {
        name: '网页组件',
        tag: '指南',
        tagColor: 'blue',
        desc: '在企业自有系统或已有网页中嵌入功能模块，如云文档、成员…',
      },
      {
        name: '定制客户端',
        tag: '指南',
        tagColor: 'blue',
        desc: '基于平台底座，通过品牌定制、SDK 集成等能力，提供企业定制化…',
      },
    ],
  },
  {
    step: 4,
    title: '需求如何实现？问问智能助手',
    cards: [
      {
        name: '开放平台智能助手',
        tag: '工具',
        tagColor: 'orange',
        desc: '结合企业业务需求，向开放平台智能助手提问，获取应用能力、操作步骤等问题的答案。',
      },
    ],
  },
];

function DevDocsPage() {
  const [keyword, setKeyword] = useState('');

  return (
    <div className="dd-page">
      {/* 顶部主导航 */}
      <div className="dd-topbar">
        <div className="dd-topbar-left">
          <div className="dd-logo">
            <div className="dd-logo-mark">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <defs>
                  <linearGradient id="dd-logo-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6a82ff" />
                    <stop offset="100%" stopColor="#3b5cff" />
                  </linearGradient>
                </defs>
                <path
                  d="M5 4h10a4 4 0 014 4v3a4 4 0 01-4 4H9l-4 3V4z"
                  fill="url(#dd-logo-grad)"
                />
              </svg>
            </div>
            <span className="dd-logo-text">开放平台</span>
          </div>
          <nav className="dd-topnav">
            {topNav.map((n) => (
              <span
                key={n.key}
                className={`dd-topnav-item ${n.active ? 'dd-topnav-item-active' : ''}`}
              >
                {n.label}
              </span>
            ))}
          </nav>
        </div>
        <div className="dd-topbar-right">
          <Input
            size="small"
            className="dd-topbar-search"
            placeholder="你可以输入文档关键词、开发问题、Log ID、错误码"
            prefix={<SearchOutlined />}
          />
          <Button
            type="primary"
            className="dd-portal-btn"
            onClick={() => window.open(`${window.location.origin}${window.location.pathname}#dev-backend`, '_blank')}
          >
            开发者后台
          </Button>
          <AppstoreOutlined className="dd-icon-btn" />
          <div className="dd-avatar" />
        </div>
      </div>

      {/* 二级导航 */}
      <div className="dd-subbar">
        <div className="dd-subnav">
          {subNav.map((n) => (
            <span
              key={n.key}
              className={`dd-subnav-item ${n.active ? 'dd-subnav-item-active' : ''}`}
            >
              {n.label}
            </span>
          ))}
        </div>
        <div className="dd-subbar-right">
          <span className="dd-subbar-action">
            <ApiOutlined /> API 调试台
          </span>
          <span className="dd-subbar-action">
            <AppstoreAddOutlined /> 卡片搭建工具
          </span>
        </div>
      </div>

      {/* 滚动区 */}
      <div className="dd-scroll">
        {/* Hero 区 */}
        <section className="dd-hero">
          <div className="dd-hero-bg" />
          <h1 className="dd-hero-title">开放文档</h1>
          <div className="dd-hero-search">
            <SearchOutlined className="dd-hero-search-icon" />
            <input
              className="dd-hero-search-input"
              placeholder="你可以输入文档关键词、开发问题、Log ID、错误码"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="primary" className="dd-hero-search-btn">
              <ArrowRightOutlined />
            </Button>
          </div>

          {/* 智能问答 */}
          <div className="dd-hero-card">
            <div className="dd-hero-tip">
              搜索 <a className="dd-tip-link">支持智能问答</a> 啦！你可以这样问我:
            </div>
            <div className="dd-tip-grid">
              {aiQuestions.map((q, i) => (
                <div key={i} className="dd-tip-item">
                  <span className="dd-tip-emoji">{q.emoji}</span>
                  <span className="dd-tip-text">{q.text}</span>
                </div>
              ))}
            </div>

            <div className="dd-hero-tip dd-hero-tip-sub">
              也可对服务端 API 进行错误诊断，你可以搜搜{' '}
              <a className="dd-tip-link">Log ID</a> 或错误码:
            </div>
            <div className="dd-tip-row">
              {errorSamples.map((e, i) => (
                <div key={i} className="dd-tip-error">
                  <SearchOutlined />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 新手入门 */}
        <section className="dd-novice">
          <h2 className="dd-novice-title">新手入门</h2>
          <div className="dd-steps">
            {noviceSteps.map((s, idx) => (
              <div className="dd-step" key={s.step}>
                <div className="dd-step-rail">
                  <div className="dd-step-num">{s.step}</div>
                  {idx < noviceSteps.length - 1 && <div className="dd-step-line" />}
                </div>
                <div className="dd-step-body">
                  <div className="dd-step-title">{s.title}</div>
                  <div
                    className={`dd-step-cards dd-step-cards-${Math.min(s.cards.length, 4)}`}
                  >
                    {s.cards.map((c, i) => (
                      <div key={i} className="dd-step-card">
                        <div className="dd-step-card-head">
                          <span className="dd-step-card-name">{c.name}</span>
                          <span className={`dd-step-card-tag dd-tag-${c.tagColor}`}>
                            {c.tag}
                          </span>
                        </div>
                        <div className="dd-step-card-desc">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="dd-bottom-space" />
        </section>
      </div>
    </div>
  );
}

export default DevDocsPage;
