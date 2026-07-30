import { message } from 'antd';
import {
  ArrowRightOutlined,
  AppstoreOutlined,
  BankOutlined,
  BulbOutlined,
  CalendarOutlined,
  ClusterOutlined,
  CommentOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MobileOutlined,
  ReadOutlined,
  RobotOutlined,
  RocketOutlined,
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

const SHOWROOM_ENTRIES = SOLUTION_SHOWROOM_ROOMS.slice(0, 5);

const CLIENT_DOWNLOADS = [
  {
    key: 'desktop',
    title: '桌面客户端',
    desc: '承载空间、研讨会、实训实验室和协同创作，适合高频教学与运营工作。',
    icon: <DesktopOutlined />,
    action: '下载桌面版',
  },
  {
    key: 'mobile',
    title: '移动客户端',
    desc: '随时处理消息、任务、学习提醒和社群交流，让协作不断线。',
    icon: <MobileOutlined />,
    action: '获取移动版',
  },
  {
    key: 'web',
    title: 'Web 工作台',
    desc: '浏览器即开即用，快速进入样板间、智能体、资料库和教学空间。',
    icon: <GlobalOutlined />,
    action: '打开 Web 端',
  },
];

const FEATURE_ITEMS = [
  {
    title: 'AI 原生产品底座',
    desc: '把现实世界任务拆成 AI 可理解、可执行的语义积木，支撑空间、资料、日程、任务和协作工具统一运转。',
  },
  {
    title: 'Lucky 智能体平台',
    desc: '以智能体、技能、知识库为核心，让用户从“问答”走向“让 AI 动手干活”。',
  },
  {
    title: '人工智能通识教学平台',
    desc: '面向 AI 通识课程，打通线上课堂、任务管理、课堂实训和学情分析的教-学-练-评闭环。',
  },
  {
    title: 'AI 驱动敏捷交付',
    desc: '以稳态底座、配置层和 AI 定制开发协同，快速孵化教师培训、AI 实训、教研创新与智慧教学场景。',
  },
];

const MODULE_ITEMS = [
  {
    title: '空间与场景',
    desc: '把场景、主题、实例化空间组织成业务承载层，让课程、项目、培训和运营都有清晰工作场。',
    icon: <AppstoreOutlined />,
    tags: ['场景模板', '主题空间'],
    accent: '#2563eb',
  },
  {
    title: '资料库',
    desc: '沉淀课程资料、组织知识和项目文档，支持按空间复用、检索和持续更新。',
    icon: <DatabaseOutlined />,
    tags: ['知识沉淀', '资源复用'],
    accent: '#0f766e',
  },
  {
    title: 'Lucky 智能体',
    desc: '连接智能体、技能、知识库与任务执行入口，让 AI 从回答问题走向主动完成工作。',
    icon: <RobotOutlined />,
    tags: ['智能体', '技能编排'],
    accent: '#7c3aed',
  },
  {
    title: 'AI 研讨会',
    desc: '面向课堂、培训和教研的实时协作空间，承载讨论、共创、互动和过程记录。',
    icon: <VideoCameraOutlined />,
    tags: ['实时协作', '课堂互动'],
    accent: '#0891b2',
  },
  {
    title: '任务与日程',
    desc: '统一承接待办、项目推进、学习提醒和运营节奏，让协作过程可追踪、可复盘。',
    icon: <CalendarOutlined />,
    tags: ['任务流转', '学习提醒'],
    accent: '#ea580c',
  },
  {
    title: '在线文档与白板',
    desc: '支持多人共创、批注、方案沉淀和教研记录，把零散想法转成可复用成果。',
    icon: <FileTextOutlined />,
    tags: ['协同创作', '方案沉淀'],
    accent: '#4f46e5',
  },
  {
    title: '实训实验室',
    desc: '承载 AI 实训、云桌面、云浏览器和实验任务，让学习过程直接连接真实操作环境。',
    icon: <ExperimentOutlined />,
    tags: ['AI 实训', '云端环境'],
    accent: '#dc2626',
  },
  {
    title: '课件创作中心',
    desc: '面向 AI 通识课程生成互动课件、实训内容和教学插件，提升课程建设效率。',
    icon: <BulbOutlined />,
    tags: ['课件生成', '教学插件'],
    accent: '#ca8a04',
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
  message.info(`${item.title}安装包入口待接入`);
}

function SolutionShowroomPortal({ onOpenRoom }) {
  return (
    <main className="solution-homepage" style={{ '--solution-hero-image': `url(${heroImage})` }}>
      <nav className="solution-home-nav" aria-label="官网导航">
        <div className="solution-home-brand">
          <span className="solution-home-brand-mark">果</span>
          <span>AI 原生果仁</span>
        </div>
        <div className="solution-home-nav-links">
          <a href="#products">AI 原生能力</a>
          <a href="#modules">核心模块</a>
          <a href="#downloads">客户端下载</a>
          <a href="#showrooms">样板间</a>
          <a href="#internal">果仁交流</a>
        </div>
        <a className="solution-home-nav-action" href="#downloads">
          下载客户端
        </a>
      </nav>

      <section className="solution-home-hero">
        <div className="solution-home-hero-copy">
          <div className="solution-home-eyebrow">AI 原生果仁</div>
          <h1>开启人机协作新纪元</h1>
          <p>
            基于 AI 原生底座、Lucky 智能体平台和人工智能通识教学平台，构建从底层支撑到上层应用的完整闭环，让教师、学生、运营团队都能用自然语言驱动工作流。
          </p>
          <div className="solution-hero-points">
            <span>AI 原生底座</span>
            <span>Lucky 智能体</span>
            <span>通识教学平台</span>
          </div>
          <div className="solution-home-hero-actions">
            <a className="solution-home-primary" href="#showrooms">
              浏览样板间
              <ArrowRightOutlined />
            </a>
            <a className="solution-home-secondary" href="#downloads">
              下载客户端
            </a>
          </div>
        </div>
      </section>

      <section className="solution-home-section" id="products">
        <div className="solution-section-head">
          <div>
            <span>AI 原生能力</span>
            <h2>三位一体的平台能力</h2>
          </div>
          <p>从语义底座到智能体，再到教学场景落地，形成“理解-行动-反馈”的闭环。</p>
        </div>
        <div className="solution-feature-grid">
          {FEATURE_ITEMS.map((item) => (
            <article key={item.title} className="solution-feature-card">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section" id="modules">
        <div className="solution-section-head">
          <div>
            <span>核心模块</span>
            <h2>把 AI 原生能力落到每天都能使用的协作工具</h2>
          </div>
          <p>围绕空间、知识、智能体、协作和实训，把复杂业务拆成可组合的产品模块。</p>
        </div>
        <div className="solution-module-grid">
          {MODULE_ITEMS.map((item) => (
            <article
              key={item.title}
              className="solution-module-card"
              style={{ '--solution-module-accent': item.accent }}
            >
              <span className="solution-module-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <span className="solution-module-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section" id="downloads">
        <div className="solution-section-head">
          <div>
            <span>客户端下载</span>
            <h2>兼顾 GUI 习惯与 AI 对话式未来</h2>
          </div>
          <p>保留熟悉的图形化操作，也提供自然语言驱动的 AI 工作方式。</p>
        </div>
        <div className="solution-download-grid">
          {CLIENT_DOWNLOADS.map((item) => (
            <article key={item.key} className="solution-download-card">
              <span className="solution-download-icon">{item.icon}</span>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <button type="button" onClick={() => handleClientDownload(item)}>
                <DownloadOutlined />
                {item.action}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-home-section" id="showrooms">
        <div className="solution-section-head">
          <div>
            <span>样板间</span>
            <h2>从愿景进入具体业务场景</h2>
          </div>
          <p>样板间用于体验教师培训、AI 实训、教研创新、智慧教学等多元场景的租户形态。</p>
        </div>
        <div className="showroom-portal-grid" aria-label="样板间入口">
          {SHOWROOM_ENTRIES.map((room) => (
            <button
              key={room.id}
              type="button"
              className="showroom-portal-card is-showroom"
              style={{ '--showroom-card-accent': room.accent }}
              onClick={() => onOpenRoom?.(room)}
            >
              <span className="showroom-card-top">
                <span className="showroom-card-icon">{getPortalIcon(room)}</span>
                <span className="showroom-card-kind">样板间</span>
              </span>
              <span className="showroom-card-body">
                <span className="showroom-card-title">{room.solutionName}</span>
                <span className="showroom-card-desc">{room.description}</span>
              </span>
              <span className="showroom-card-action">
                进入样板
                <ArrowRightOutlined />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="solution-home-section" id="internal">
        <div className="solution-section-head">
          <div>
            <span>内部运营</span>
            <h2>果仁交流：公司内部运营场</h2>
          </div>
          <p>不同于对外样板间，用于公司内部内容发布、成员协作和运营复盘。</p>
        </div>
        <button
          type="button"
          className="guoren-internal-entry"
          style={{ '--showroom-card-accent': GUOREN_INTERNAL_PORTAL_ENTRY.accent }}
          onClick={() => onOpenRoom?.(GUOREN_INTERNAL_PORTAL_ENTRY)}
        >
          <span className="guoren-internal-icon">{getPortalIcon(GUOREN_INTERNAL_PORTAL_ENTRY)}</span>
          <span className="guoren-internal-copy">
            <span>内部运营租户</span>
            <strong>{GUOREN_INTERNAL_PORTAL_ENTRY.solutionName}</strong>
            <small>{GUOREN_INTERNAL_PORTAL_ENTRY.description}</small>
          </span>
          <span className="guoren-internal-action">
            进入内部平台
            <ArrowRightOutlined />
          </span>
        </button>
      </section>

      <footer className="solution-home-footer">
        <span>AI 原生果仁 · 人机协作新范式</span>
        <span>让每个人都能与 AI 高效协作，共创无限可能</span>
      </footer>
    </main>
  );
}

export default SolutionShowroomPortal;
