import { message } from 'antd';
import {
  ArrowRightOutlined,
  AppstoreOutlined,
  BankOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CommentOutlined,
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

const HERO_STATS = [
  { label: 'AI 原生底座', value: '1 套' },
  { label: '首发方案', value: '1' },
  { label: '服务模块', value: '30+' },
];

const HERO_PLATFORM_MODULES = ['资料库', '空间', '智能体', '多场景业务一体化', '创作中心', '实训实验室'];

const ADVANTAGE_ITEMS = [
  {
    title: '技术优势',
    desc: '统一空间、资源、智能体、任务与门户能力，为不同教育场景提供稳定、安全、可扩展的技术支撑。',
    icon: <DesktopOutlined />,
  },
  {
    title: '服务运营优势',
    desc: '结合在线培训与项目服务经验，提供从项目启动、过程陪伴到数据复盘的完整运营支持。',
    icon: <TeamOutlined />,
  },
  {
    title: '资源优势',
    desc: '整合课程资源、知识库、案例数据和过程材料，让方案展示更贴近真实业务需求。',
    icon: <DatabaseOutlined />,
  },
  {
    title: '教学服务与人才优势',
    desc: '依托教研、教学服务和客户成功团队，保障平台能力能够持续转化为可感知的应用成效。',
    icon: <SafetyCertificateOutlined />,
  },
];

const FEATURE_ITEMS = [
  {
    title: 'AI 原生产品底座',
    desc: '将资料、空间、角色、流程和任务统一建模，让业务能力可以被 AI 理解、调用和持续组合。',
    icon: <ClusterOutlined />,
  },
  {
    title: '通答智能体平台',
    desc: '以智能体、技能和知识库为核心，支持咨询答疑、内容生成、方案设计和任务执行。',
    icon: <ThunderboltOutlined />,
  },
  {
    title: '人工智能通识教学平台',
    desc: '面向 AI 通识课程建设，覆盖线上课堂、任务管理、实践训练和学习评价。',
    icon: <ReadOutlined />,
  },
  {
    title: 'AI 驱动敏捷交付',
    desc: '基于标准能力与场景配置快速组合，支持教师培训、AI 实训、教研创新与智慧教学落地。',
    icon: <RocketOutlined />,
  },
];

const AI_NATIVE_ITEMS = [
  {
    title: '业务模块天然 AI 化',
    desc: '新建教学、教研、培训、干部工作坊等模块时，可直接调用知识、智能体、任务和协作能力。',
    icon: <ClusterOutlined />,
  },
  {
    title: '用户体验智能体+',
    desc: '教师、干部、教研员等角色不只是在使用系统，而是获得能理解场景、协助完成工作的智能助理。',
    icon: <RobotOutlined />,
  },
  {
    title: '场景持续复用扩展',
    desc: '资料库、空间、场景模板和过程数据可被不同业务反复使用，持续放大平台价值。',
    icon: <RocketOutlined />,
  },
];

const AI_NATIVE_CHANGE_ITEMS = [
  {
    title: '入口改变',
    before: '找菜单、填表单、推流程',
    after: '表达目标，智能体理解意图并组织路径',
  },
  {
    title: '流程改变',
    before: '流程靠人推动，系统被动记录',
    after: '智能体牵引执行、提醒、反馈和沉淀',
  },
  {
    title: '角色改变',
    before: '业务人员跨系统、跨部门协调信息',
    after: '人负责判断确认，智能体承担拆解和推进',
  },
  {
    title: '数据改变',
    before: '数据主要用于事后统计和报表',
    after: '实时支撑方案生成、过程预警和辅助决策',
  },
  {
    title: '经验改变',
    before: '经验散落在个人、文档和历史记录中',
    after: '沉淀为可复用、可进化的组织资产',
  },
];

const MODULE_ITEMS = [
  {
    title: '空间与场景',
    desc: '把场景、主题、实例化空间组织成业务承载层，让课程、项目、培训和服务都有清晰工作场。',
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
    title: '通答智能体',
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
    desc: '统一承接待办、项目推进、学习提醒和服务节奏，让协作过程可追踪、可复盘。',
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
  message.info(`请联系客户顾问获取${item.title}下载方式`);
}

function SolutionShowroomPortal({ onOpenRoom }) {
  const featuredRoom = SHOWROOM_ENTRIES[0];

  return (
    <main className="solution-homepage" style={{ '--solution-hero-image': `url(${heroImage})` }}>
      <nav className="solution-home-nav" aria-label="官网导航">
        <div className="solution-home-brand">
          <span className="solution-home-brand-mark">通</span>
          <span>国人通教育 · 通答</span>
        </div>
        <div className="solution-home-nav-links">
          <a href="#advantages">服务优势</a>
          <a href="#ai-native">AI 原生</a>
          <a href="#products">产品能力</a>
          <a href="#modules">核心模块</a>
          <a href="#showrooms">解决方案</a>
          <a href="#internal">通答交流</a>
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

      <section className="solution-home-hero">
        <div className="solution-home-hero-copy">
          <div className="solution-home-eyebrow">通答 AI 原生教育业务平台</div>
          <h1>
            让每个教育业务
            <span>从一开始就具备 AI 能力</span>
          </h1>
          <p>
            通答以资料库、空间、智能体和场景模板为统一底座，把教学、教研、培训、工作坊和区域服务等业务组织成可体验、可复用、可持续进化的 AI 原生场景。
          </p>
          <div className="solution-hero-points">
            <span>业务天然 AI 化</span>
            <span>智能体+体验</span>
            <span>场景持续复用</span>
          </div>
          <div className="solution-home-hero-actions">
            <a className="solution-home-primary" href="#showrooms">
              进入解决方案
              <ArrowRightOutlined />
            </a>
            <a className="solution-home-secondary" href="#ai-native">
              理解 AI 原生
            </a>
          </div>
        </div>

        <div className="solution-hero-visual" aria-label="通答 AI 原生平台产品视觉">
          <div className="solution-hero-console">
            <div className="solution-hero-console-head">
              <span>Tongda AI Native Platform</span>
              <i />
            </div>
            <div className="solution-hero-console-main">
              <div className="solution-hero-console-copy">
                <strong>通答 AI 原生平台</strong>
                <span>资料沉淀、空间承载、智能体驱动</span>
              </div>
              <img src={heroImage} alt="" />
            </div>
            <div className="solution-hero-console-grid">
              {HERO_PLATFORM_MODULES.map((moduleName) => (
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

      <section className="solution-advantage-band" id="advantages" aria-label="服务优势">
        {ADVANTAGE_ITEMS.map((item) => (
          <article key={item.title} className="solution-advantage-card">
            <span className="solution-advantage-icon">{item.icon}</span>
            <strong>{item.title}</strong>
            <p>{item.desc}</p>
          </article>
        ))}
      </section>

      <section className="solution-home-section solution-ai-native-section" id="ai-native">
        <div className="solution-ai-native-panel">
          <div className="solution-ai-native-copy">
            <span>AI 原生理念</span>
            <h2>AI 原生，不是把 AI 加到业务上，而是让业务从一开始就具备 AI 能力</h2>
            <p>
              通答把资料、空间、角色、流程、任务和智能体统一建模，让每个业务模块天然接入资料库、空间和智能体体系。无论是教学、教研、培训、干部工作坊，还是后续扩展的新业务，都可以在同一个底座上快速组合、持续进化。
            </p>
            <div className="solution-ai-native-tags">
              <span>资料库</span>
              <span>空间</span>
              <span>智能体</span>
              <span>场景模板</span>
              <span>业务数据</span>
            </div>
          </div>
          <div className="solution-ai-native-cards">
            {AI_NATIVE_ITEMS.map((item) => (
              <article key={item.title} className="solution-ai-native-card">
                <span className="solution-ai-native-icon">{item.icon}</span>
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="solution-ai-native-change">
            <div className="solution-ai-native-change-head">
              <span>带来的改变</span>
              <strong>从“人找系统”到“目标牵引，智能体执行”</strong>
            </div>
            <div className="solution-ai-native-change-grid">
              {AI_NATIVE_CHANGE_ITEMS.map((item) => (
                <article key={item.title} className="solution-ai-native-change-card">
                  <span className="solution-ai-native-change-title">{item.title}</span>
                  <span className="solution-ai-native-change-row">
                    <small>过去</small>
                    <strong>{item.before}</strong>
                  </span>
                  <span className="solution-ai-native-change-row is-now">
                    <small>现在</small>
                    <strong>{item.after}</strong>
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="solution-home-section" id="products">
        <div className="solution-section-head">
          <div>
            <span>产品与服务</span>
            <h2>从平台底座到场景应用的能力组合</h2>
          </div>
          <p>在统一 AI 原生底座上组合平台、资源、智能体和服务，让客户快速看见方案构成和应用价值。</p>
        </div>
        <div className="solution-feature-grid">
          {FEATURE_ITEMS.map((item) => (
            <article key={item.title} className="solution-feature-card">
              <span className="solution-feature-icon">{item.icon}</span>
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
            <h2>可组合、可体验、可落地的模块矩阵</h2>
          </div>
          <p>围绕空间、知识、智能体、协作和实训，将复杂教育业务拆解为清晰的产品模块。</p>
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

      <section className="solution-home-section" id="showrooms">
        <div className="solution-section-head">
          <div>
            <span>首发解决方案</span>
            <h2>通答 AI 通识教学平台</h2>
          </div>
          <p>以 AI 通识教学平台作为首发样板，完整呈现课程空间、资料沉淀、AI 助教、任务评价和成果归档的落地路径。</p>
        </div>
        <div className="showroom-portal-layout" aria-label="解决方案入口">
          {featuredRoom ? (
            <button
              type="button"
              className="showroom-portal-featured"
              style={{ '--showroom-card-accent': featuredRoom.accent }}
              onClick={() => onOpenRoom?.(featuredRoom)}
            >
              <span className="showroom-featured-main">
                <span className="showroom-card-icon">{getPortalIcon(featuredRoom)}</span>
                <span className="showroom-card-kind">首发上线</span>
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
                  查看解决方案
                  <ArrowRightOutlined />
                </span>
              </span>
            </button>
          ) : null}
          <div className="showroom-coming-soon">
            <span className="showroom-coming-soon-icon">
              <RocketOutlined />
            </span>
            <span className="showroom-coming-soon-copy">
              <strong>更多解决方案待上线</strong>
              <small>通答将围绕教学、教研、培训、组织服务和教师成长等场景持续沉淀解决方案，按业务成熟度逐步开放体验。</small>
            </span>
          </div>
        </div>
      </section>

      <section className="solution-home-section" id="internal">
        <div className="solution-section-head">
          <div>
            <span>生态协同</span>
            <h2>通答交流：服务协同与伙伴生态</h2>
          </div>
          <p>面向服务团队与合作伙伴的协同空间，承载内容发布、项目协作和服务复盘。</p>
        </div>
        <button
          type="button"
          className="guoren-internal-entry"
          style={{ '--showroom-card-accent': GUOREN_INTERNAL_PORTAL_ENTRY.accent }}
          onClick={() => onOpenRoom?.(GUOREN_INTERNAL_PORTAL_ENTRY)}
        >
          <span className="guoren-internal-icon">{getPortalIcon(GUOREN_INTERNAL_PORTAL_ENTRY)}</span>
          <span className="guoren-internal-copy">
            <span>服务协同空间</span>
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
        <span>国人通教育 · AI 原生解决方案</span>
        <span>以平台能力连接教学、培训、服务与协同场景</span>
      </footer>
    </main>
  );
}

export default SolutionShowroomPortal;
