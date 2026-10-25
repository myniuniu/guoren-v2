import { message } from 'antd';
import {
  ArrowRightOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BookOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CommentOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LoginOutlined,
  ReadOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import heroImage from '../assets/hero.png';
import {
  GUOREN_INTERNAL_PORTAL_ENTRY,
  SOLUTION_SHOWROOM_ROOMS,
} from './showroomData';
import './SolutionShowroomPortal.css';

const SHOWROOM_ENTRIES = SOLUTION_SHOWROOM_ROOMS;

const NAV_LINKS = [
  { href: '#products', label: '产品' },
  { href: '#solutions', label: '解决方案' },
  { href: '#workspace', label: 'AI 原生' },
  { href: '#security', label: '安全服务' },
  { href: '#resources', label: '资源' },
];

const HERO_STATS = [
  { label: '核心产品底座', value: '1 套' },
  { label: '业务场景覆盖', value: '40+' },
  { label: '可组合模块', value: '30+' },
];

const HERO_WORKSPACE_ITEMS = [
  '资料库',
  '空间',
  '智能体',
  '任务',
  '研讨会',
  '画像看板',
];

const PRODUCT_ITEMS = [
  {
    title: '通答智能体平台',
    desc: '面向学校、区域和服务团队搭建专属智能体，连接知识库、技能和任务执行。',
    icon: <ThunderboltOutlined />,
    accent: '#2563eb',
    tags: ['智能体', '知识库', '技能编排'],
  },
  {
    title: 'AI 通识教学平台',
    desc: '覆盖课程空间、资源沉淀、AI 助教、作业任务、学习评价和证书归档。',
    icon: <ReadOutlined />,
    accent: '#0f766e',
    tags: ['课程空间', 'AI 助教', '学习评价'],
  },
  {
    title: '教师发展平台',
    desc: '以教师画像、能力模型、研修项目和成长档案支撑区域教师专业发展。',
    icon: <TeamOutlined />,
    accent: '#f97316',
    tags: ['教师画像', '研修项目', '成长档案'],
  },
  {
    title: '智慧继教平台',
    desc: '项目发布、报名学习、学时核验、问卷反馈和证书发放一体化闭环。',
    icon: <ClusterOutlined />,
    accent: '#0891b2',
    tags: ['继教项目', '学时管理', '证书'],
  },
  {
    title: '资料库与知识空间',
    desc: '沉淀课程、案例、制度和项目资料，让组织知识可以被检索、复用和持续进化。',
    icon: <DatabaseOutlined />,
    accent: '#4f46e5',
    tags: ['资源沉淀', '知识空间', '权限复用'],
  },
  {
    title: '实训实验室',
    desc: '连接 AI 实训任务、云端环境和过程记录，把学习过程落到真实操作。',
    icon: <ExperimentOutlined />,
    accent: '#dc2626',
    tags: ['AI 实训', '云端环境', '过程记录'],
  },
];

const WORKSPACE_STEPS = [
  {
    title: '沉淀资料',
    desc: '课程、文档、案例、制度进入统一资料库，按空间和角色复用。',
    icon: <BookOutlined />,
  },
  {
    title: '生成场景',
    desc: '通过模板快速创建课程、研修、教研、督导和服务空间。',
    icon: <AppstoreOutlined />,
  },
  {
    title: '智能体协作',
    desc: 'AI 助教、教研助手、项目顾问理解业务目标并推动任务执行。',
    icon: <RobotOutlined />,
  },
  {
    title: '数据反馈',
    desc: '把学习、任务、互动、评价和成果沉淀为画像与决策看板。',
    icon: <AuditOutlined />,
  },
];

const SOLUTION_ITEMS = [
  {
    title: '智慧教学',
    desc: 'AI 备课、课堂互动、作业反馈、学习评价和资源复用一体化。',
    metrics: ['课程建设', '课堂助学', '学习评价'],
    icon: <DesktopOutlined />,
  },
  {
    title: '教师培训研修',
    desc: '从项目报名、学习任务、过程陪伴到证书归档，形成研修闭环。',
    metrics: ['研修项目', '学时核验', '成长档案'],
    icon: <VideoCameraOutlined />,
  },
  {
    title: '区域教育治理',
    desc: '面向区域教研、督导、评价和资源统筹，建立可追踪的数据底座。',
    metrics: ['区域画像', '督导任务', '资源统筹'],
    icon: <BankOutlined />,
  },
];

const VALUE_ITEMS = [
  {
    title: '给教师',
    desc: '少找资料、少重复整理，把更多时间留给教学设计和学生反馈。',
    value: 'AI 助教 + 资源复用',
  },
  {
    title: '给学校',
    desc: '把课程、任务、活动、评价和档案纳入同一业务空间。',
    value: '协同空间 + 过程管理',
  },
  {
    title: '给区域',
    desc: '形成教师发展、培训研修、教研服务和治理决策的数据闭环。',
    value: '画像看板 + 决策支持',
  },
];

const SECURITY_ITEMS = [
  {
    title: '组织与权限',
    desc: '按区域、学校、部门和角色配置访问权限，支撑多租户管理。',
    icon: <TeamOutlined />,
  },
  {
    title: '数据安全',
    desc: '支持私有化部署、数据分级、操作留痕和关键流程审计。',
    icon: <SafetyCertificateOutlined />,
  },
  {
    title: '交付服务',
    desc: '从方案设计、部署配置、培训运营到复盘改进，全程陪伴落地。',
    icon: <CustomerServiceOutlined />,
  },
];

const RESOURCE_ITEMS = [
  {
    title: '方案白皮书',
    desc: '梳理 AI 原生教育平台的建设路径、能力地图和实施节奏。',
    icon: <FileTextOutlined />,
  },
  {
    title: '产品演示',
    desc: '通过示范空间体验课程、资料、智能体、任务和评价闭环。',
    icon: <DesktopOutlined />,
  },
  {
    title: '落地咨询',
    desc: '结合学校或区域现状，形成产品组合与项目推进建议。',
    icon: <CommentOutlined />,
  },
];

function getPortalIcon(entry) {
  const iconMap = {
    'tongda-ai-literacy-teaching': <ReadOutlined />,
    'tongda-agent-platform': <ThunderboltOutlined />,
    'k12-service-platform': <BankOutlined />,
    'teacher-development-platform': <TeamOutlined />,
    'smart-continuing-education': <ClusterOutlined />,
    'guoren-exchange': <CommentOutlined />,
  };
  return iconMap[entry.id] || <RocketOutlined />;
}

function handleClientDownload(item) {
  message.info(`请联系客户顾问获取${item.title}下载方式`);
}

function handleContact() {
  message.info('已记录演示预约意向，请联系客户顾问安排专属演示');
}

function SolutionShowroomPortal({ onOpenRoom }) {
  const featuredRoom = SHOWROOM_ENTRIES[0];
  const secondaryRooms = SHOWROOM_ENTRIES.slice(1, 4);

  const handleOpenRoom = (room) => {
    if (typeof onOpenRoom === 'function') {
      onOpenRoom(room);
      return;
    }
    message.info('请先登录后查看完整示范空间');
  };

  return (
    <main className="solution-homepage" style={{ '--solution-hero-image': `url(${heroImage})` }}>
      <nav className="solution-home-nav" aria-label="通答官网导航">
        <a className="solution-home-brand" href="#top" aria-label="通答官网首页">
          <span className="solution-home-brand-mark">通</span>
          <span>
            <strong>通答</strong>
            <small>AI 原生教育平台</small>
          </span>
        </a>
        <div className="solution-home-nav-links">
          {NAV_LINKS.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </div>
        <div className="solution-home-nav-actions">
          <button
            type="button"
            className="solution-home-download-action"
            aria-label="获取通答客户端下载方式"
            onClick={() => handleClientDownload({ title: '通答客户端' })}
          >
            <DownloadOutlined />
            下载
          </button>
          <a className="solution-home-login-action" href="#/login">
            <LoginOutlined />
            登录
          </a>
        </div>
      </nav>

      <section className="solution-home-hero" id="top">
        <div className="solution-home-hero-copy">
          <div className="solution-home-eyebrow">
            <span />
            通答 AI 原生教育业务平台
          </div>
          <h1>
            把教学、<wbr />培训、<wbr />教研和服务
            <span>组织成可进化的 <wbr />AI 工作平台</span>
          </h1>
          <p>
            通答以资料库、空间、智能体、任务和数据画像为统一底座，帮助学校与区域把复杂教育业务变成可体验、可复用、可运营的数字化场景。
          </p>
          <div className="solution-hero-points">
            <span>智能体驱动</span>
            <span>空间承载业务</span>
            <span>资源持续沉淀</span>
            <span>过程数据闭环</span>
          </div>
          <div className="solution-home-hero-actions">
            <a className="solution-home-primary" href="#solutions">
              查看解决方案
              <ArrowRightOutlined />
            </a>
            <button type="button" className="solution-home-secondary" onClick={handleContact}>
              预约演示
            </button>
          </div>
        </div>

        <div className="solution-hero-visual" aria-label="通答产品工作台示意">
          <div className="solution-hero-console">
            <div className="solution-hero-console-head">
              <span>Tongda AI Workspace</span>
              <i />
            </div>
            <div className="solution-hero-console-main">
              <div className="solution-hero-console-copy">
                <strong>本周教育服务中枢</strong>
                <span>AI 助教正在整理研修成果、推送课堂任务并更新教师画像。</span>
              </div>
              <img src={heroImage} alt="" />
            </div>
            <div className="solution-hero-console-grid">
              {HERO_WORKSPACE_ITEMS.map((moduleName) => (
                <span key={moduleName}>
                  <CheckCircleOutlined />
                  {moduleName}
                </span>
              ))}
            </div>
          </div>
          <div className="solution-hero-stats">
            {HERO_STATS.map((item) => (
              <span key={item.label}>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="solution-home-band" aria-label="通答平台关键词">
        <span>AI 原生底座</span>
        <span>教学空间</span>
        <span>教师发展</span>
        <span>智慧继教</span>
        <span>区域治理</span>
        <span>服务生态</span>
      </section>

      <section className="solution-home-section" id="products">
        <div className="solution-section-head">
          <div>
            <span>产品矩阵</span>
            <h2>从平台底座到场景应用，一套能力服务多类教育业务</h2>
          </div>
          <p>参考成熟协作平台官网的组织方式，通答官网不只展示单点功能，而是把核心产品、模块能力和业务场景放在同一个入口中说明清楚。</p>
        </div>
        <div className="solution-product-grid">
          {PRODUCT_ITEMS.map((item) => (
            <article key={item.title} className="solution-product-card" style={{ '--card-accent': item.accent }}>
              <span className="solution-product-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <span className="solution-product-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section solution-workspace-section" id="workspace">
        <div className="solution-workspace-copy">
          <span>AI 原生工作方式</span>
          <h2>不是给旧系统加一个问答框，而是让业务从资料、空间到任务都能被 AI 理解</h2>
          <p>
            第一版通答页面已经覆盖“教、学、训、评”和角色场景。新版官网框架把它收束成更清晰的工作流：资料沉淀、场景生成、智能体协作、数据反馈。
          </p>
        </div>
        <div className="solution-workspace-flow">
          {WORKSPACE_STEPS.map((item, index) => (
            <article key={item.title} className="solution-workspace-step">
              <span className="solution-workspace-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="solution-workspace-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section" id="solutions">
        <div className="solution-section-head">
          <div>
            <span>解决方案</span>
            <h2>围绕学校、教师和区域的核心场景组织官网入口</h2>
          </div>
          <p>延续第一版通答官网里的“智慧教学、教师培训研修、教育监管”主线，同时连接当前项目里的示范空间。</p>
        </div>
        <div className="solution-scenario-grid">
          {SOLUTION_ITEMS.map((item) => (
            <article key={item.title} className="solution-scenario-card">
              <span className="solution-scenario-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <span className="solution-scenario-tags">
                {item.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </span>
            </article>
          ))}
        </div>

        <div className="showroom-portal-layout" aria-label="示范空间入口">
          {featuredRoom ? (
            <button
              type="button"
              className="showroom-portal-featured"
              style={{ '--showroom-card-accent': featuredRoom.accent }}
              onClick={() => handleOpenRoom(featuredRoom)}
            >
              <span className="showroom-featured-main">
                <span className="showroom-card-icon">{getPortalIcon(featuredRoom)}</span>
                <span className="showroom-card-kind">首发示范空间</span>
                <span className="showroom-featured-title">{featuredRoom.solutionName}</span>
                <span className="showroom-featured-desc">{featuredRoom.description}</span>
                <span className="showroom-featured-tags">
                  <span>{featuredRoom.stage}</span>
                  <span>{featuredRoom.scenario}</span>
                  <span>{featuredRoom.industry}</span>
                </span>
              </span>
              <span className="showroom-featured-side">
                <span className="showroom-featured-metrics">
                  {(featuredRoom.metrics || []).map((metric) => (
                    <span key={metric.label}>
                      <strong>{metric.value}</strong>
                      <small>{metric.label}</small>
                    </span>
                  ))}
                </span>
                <span className="showroom-featured-modules">
                  {(featuredRoom.modules || []).slice(0, 6).map((moduleName) => (
                    <span key={moduleName}>{moduleName}</span>
                  ))}
                </span>
                <span className="showroom-featured-action">
                  查看示范空间
                  <ArrowRightOutlined />
                </span>
              </span>
            </button>
          ) : null}
          <div className="showroom-portal-grid">
            {secondaryRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className="showroom-portal-card"
                style={{ '--showroom-card-accent': room.accent }}
                onClick={() => handleOpenRoom(room)}
              >
                <span className="showroom-card-top">
                  <span className="showroom-card-icon">{getPortalIcon(room)}</span>
                  <span className="showroom-card-kind">{room.scenario}</span>
                </span>
                <span className="showroom-card-body">
                  <strong>{room.solutionName}</strong>
                  <small>{room.description}</small>
                </span>
                <span className="showroom-card-action">
                  进入体验
                  <ArrowRightOutlined />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="solution-home-section solution-value-section" id="customers">
        <div className="solution-section-head">
          <div>
            <span>客户价值</span>
            <h2>把不同角色关心的问题放到同一个叙事里</h2>
          </div>
          <p>官网需要让教师、学校和区域管理者快速判断“这和我有什么关系”，因此保留角色价值入口，而不是只堆功能清单。</p>
        </div>
        <div className="solution-value-grid">
          {VALUE_ITEMS.map((item) => (
            <article key={item.title} className="solution-value-card">
              <span>{item.value}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section solution-security-section" id="security">
        <div className="solution-section-head">
          <div>
            <span>安全与服务</span>
            <h2>教育业务官网必须把可信交付说清楚</h2>
          </div>
          <p>面向学校与区域客户，安全合规、组织权限和服务陪跑是产品价值的一部分，应当在官网主链路中前置呈现。</p>
        </div>
        <div className="solution-security-grid">
          {SECURITY_ITEMS.map((item) => (
            <article key={item.title} className="solution-security-card">
              <span className="solution-security-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section solution-resource-section" id="resources">
        <div className="solution-section-head">
          <div>
            <span>资源中心</span>
            <h2>用内容与演示把访问者带到下一步</h2>
          </div>
          <p>官网的最后一段承担转化作用：让客户获取资料、查看演示，或进入咨询。</p>
        </div>
        <div className="solution-resource-grid">
          {RESOURCE_ITEMS.map((item) => (
            <button key={item.title} type="button" className="solution-resource-card" onClick={handleContact}>
              <span>{item.icon}</span>
              <strong>{item.title}</strong>
              <small>{item.desc}</small>
              <i>
                获取
                <ArrowRightOutlined />
              </i>
            </button>
          ))}
        </div>
      </section>

      <section className="solution-home-cta">
        <div>
          <span>准备建设 AI 原生教育业务平台？</span>
          <h2>从一个示范空间开始，逐步沉淀学校与区域的 AI 能力。</h2>
        </div>
        <div className="solution-home-cta-actions">
          <button type="button" className="solution-home-primary is-blue" onClick={handleContact}>
            预约演示
            <ArrowRightOutlined />
          </button>
          <a className="solution-home-secondary is-light" href="#products">
            回看产品矩阵
          </a>
        </div>
      </section>

      <section className="solution-home-section" id="internal">
        <button
          type="button"
          className="guoren-internal-entry"
          style={{ '--showroom-card-accent': GUOREN_INTERNAL_PORTAL_ENTRY.accent }}
          onClick={() => handleOpenRoom(GUOREN_INTERNAL_PORTAL_ENTRY)}
        >
          <span className="guoren-internal-icon">{getPortalIcon(GUOREN_INTERNAL_PORTAL_ENTRY)}</span>
          <span className="guoren-internal-copy">
            <span>生态协同</span>
            <strong>{GUOREN_INTERNAL_PORTAL_ENTRY.solutionName}</strong>
            <small>{GUOREN_INTERNAL_PORTAL_ENTRY.description}</small>
          </span>
          <span className="guoren-internal-action">
            查看协同空间
            <ArrowRightOutlined />
          </span>
        </button>
      </section>

      <footer className="solution-home-footer">
        <span>国人通教育 · 通答 AI 原生教育平台</span>
        <span>产品 · 解决方案 · 服务支持 · 生态协同</span>
      </footer>
    </main>
  );
}

export default SolutionShowroomPortal;
