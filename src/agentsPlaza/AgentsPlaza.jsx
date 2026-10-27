import { useState } from 'react';
import { Input, Segmented, Tag } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  HomeOutlined,
  CloudOutlined,
  TeamOutlined,
  ApartmentOutlined,
  FolderOutlined,
  BarChartOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  EditOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  BookOutlined,
  DatabaseOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  CheckCircleFilled,
  LineChartOutlined,
  FileImageOutlined,
  CodeOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  ReadOutlined,
  TrophyOutlined,
  AuditOutlined,
  BulbOutlined,
  VideoCameraOutlined,
  GlobalOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './AgentsPlaza.css';

const CATEGORIES = [
  '全部',
  '组织培训',
  '教学备课',
  '教研培训',
  '学员管理',
  '资源内容',
  '测评评价',
  '办公提效',
  '数据分析',
  '学习教育',
  '家校沟通',
  '课题科研',
  '学校管理',
];

const AGENTS_DATA = [
  {
    id: 1,
    name: '教研员',
    description: '针对用户提出的组织培训需求，提供专业教研方案设计与指导',
    icon: <TeamOutlined />,
    color: 'blue',
    tags: ['项目策划', '培训方案'],
  },
  {
    id: 2,
    name: '教务',
    description: '根据教研员的策划内容，协助完成教务安排与培训组织',
    icon: <SolutionOutlined />,
    color: 'green',
    tags: ['项目配置', '培训组织'],
  },
  {
    id: 3,
    name: '学情数据分析师',
    description: '擅长分析学员成绩、出勤等学情数据，提供质量诊断报告',
    icon: <LineChartOutlined />,
    color: 'purple',
    tags: ['学情诊断', '质量分析'],
  },
  {
    id: 4,
    name: '课件制作专家',
    description: '帮你把培训方案、教案和教学内容转化为精美课件',
    icon: <FolderOutlined />,
    color: 'orange',
    tags: ['课件生成', '汇报美化'],
  },
  {
    id: 5,
    name: '课程活动设计师',
    description: '专注课堂活动、学习任务设计，提升学员参与度',
    icon: <BookOutlined />,
    color: 'mint',
    tags: ['活动设计', '任务单'],
  },
  {
    id: 6,
    name: 'AI配图师',
    description: '根据教学主题生成插图、封面设计，让课件更生动',
    icon: <FileImageOutlined />,
    color: 'amber',
    tags: ['文生图', '封面设计'],
  },
  {
    id: 7,
    name: '平台配置工程师',
    description: '帮你把培训流程、表单字段等平台功能配置到位',
    icon: <AppstoreOutlined />,
    color: 'cyan',
    tags: ['流程配置', '功能排查'],
  },
  {
    id: 8,
    name: '培训脚本编剧',
    description: '面向视频课程和直播培训，撰写专业脚本与台词',
    icon: <FileTextOutlined />,
    color: 'indigo',
    tags: ['脚本撰写', '培训表达'],
  },
  {
    id: 9,
    name: '授课分析师',
    description: '整理听评课记录与课堂观察，提供专业授课诊断',
    icon: <CheckCircleFilled />,
    color: 'rose',
    tags: ['听评课', '课堂观察'],
  },
  {
    id: 10,
    name: '培训项目助手',
    description: '为培训负责人整理报名、签到、证书发放等项目事务',
    icon: <IdcardOutlined />,
    color: 'emerald',
    tags: ['项目管理', '证书发放'],
  },
  {
    id: 11,
    name: '微课策划助手',
    description: '围绕知识点拆解短课主题，提供微课设计方案与脚本',
    icon: <BulbOutlined />,
    color: 'sand',
    tags: ['微课设计', '脚本提纲'],
  },
  {
    id: 12,
    name: '教学资源策展师',
    description: '筛选课例、论文和政策资讯，整理成主题资源包',
    icon: <DatabaseOutlined />,
    color: 'pink',
    tags: ['资源整理', '主题包'],
  },
  {
    id: 13,
    name: '研修报告顾问',
    description: '帮助教师梳理学习收获、研修总结，形成规范报告',
    icon: <ReadOutlined />,
    color: 'teal',
    tags: ['研修总结', '成长复盘'],
  },
  {
    id: 14,
    name: '教师面试陪练官',
    description: '模拟试讲、结构化问答和面试场景，提供专业反馈',
    icon: <AuditOutlined />,
    color: 'coral',
    tags: ['试讲训练', '面试评估'],
  },
  {
    id: 15,
    name: '课程视频剪辑师',
    description: '整理录课素材、口播文案，完成课程视频剪辑制作',
    icon: <VideoCameraOutlined />,
    color: 'lime',
    tags: ['录课剪辑', '素材整理'],
  },
  {
    id: 16,
    name: '教育趋势研究专家',
    description: '跟踪教育数字化、AI教学等前沿趋势，提供研究报告',
    icon: <GlobalOutlined />,
    color: 'mint-dark',
    tags: ['趋势研究', '案例分析'],
  },
  {
    id: 17,
    name: '班主任工作顾问',
    description: '提供班级管理、家校沟通、学生心理辅导等专业建议',
    icon: <UserOutlined />,
    color: 'sky',
    tags: ['班级管理', '家校沟通'],
  },
  {
    id: 18,
    name: '工作台搭建师',
    description: '根据工作需求搭建个性化工作台，配置常用功能模块',
    icon: <DesktopOutlined />,
    color: 'slate',
    tags: ['工作台', '个性化配置'],
  },
  {
    id: 19,
    name: '课程顾问教练',
    description: '为课程开发者提供教学设计指导与课程打磨建议',
    icon: <TrophyOutlined />,
    color: 'violet',
    tags: ['课程打磨', '教学设计'],
  },
  {
    id: 20,
    name: '培训项目运营官',
    description: '负责培训项目全流程运营，从招生到结班数据跟踪',
    icon: <ExperimentOutlined />,
    color: 'rust',
    tags: ['项目运营', '数据跟踪'],
  },
];

const SIDEBAR_MENU = [
  { key: 'home', icon: <HomeOutlined />, label: '首页' },
  { key: 'space', icon: <CloudOutlined />, label: '空间' },
  { key: 'study', icon: <TeamOutlined />, label: '研习社', active: true },
  { key: 'agents', icon: <ApartmentOutlined />, label: '智能体·技能·连接器' },
  { key: 'library', icon: <FolderOutlined />, label: '资料库' },
  { key: 'ai-literacy', icon: <BarChartOutlined />, label: 'AI素养能力' },
];

const RECENT_ITEMS = [
  { icon: <ClockCircleOutlined />, label: '周三教研活动纪要' },
  { icon: <LineChartOutlined />, label: '教师培训经费测算表' },
  { icon: <AuditOutlined />, label: '课堂观察反馈整理' },
  { icon: <EditOutlined />, label: '研修课程文案润色' },
];

const TOP_NAV = [
  { key: 'agents', label: '智能体广场', active: true },
  { key: 'skills', label: '技能广场' },
  { key: 'courses', label: '课程' },
  { key: 'resources', label: '资源广场' },
  { key: 'apps', label: '应用广场' },
  { key: 'experts', label: '专家工作室' },
];

export default function AgentsPlaza() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('综合');
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredAgents = AGENTS_DATA.filter((agent) => {
    const matchCategory = activeCategory === '全部' || agent.tags.some((tag) =>
      CATEGORIES.indexOf(activeCategory) !== -1 && tag.includes(activeCategory)
    );
    const matchSearch = !searchKeyword.trim() ||
      agent.name.includes(searchKeyword.trim()) ||
      agent.description.includes(searchKeyword.trim());
    return matchCategory && matchSearch;
  });

  return (
    <div className="agents-plaza">
      {/* 左侧边栏 */}
      <aside className="agents-sidebar">
        <div className="agents-sidebar-logo">
          <span className="agents-logo-text">通答®</span>
          <span className="agents-logo-icon">
            <ApartmentOutlined />
          </span>
        </div>

        <button className="agents-new-task-btn" type="button">
          <PlusOutlined />
          新建任务
        </button>

        <nav className="agents-sidebar-menu">
          {SIDEBAR_MENU.map((item) => (
            <div
              key={item.key}
              className={`agents-menu-item ${item.active ? 'agents-menu-item-active' : ''}`}
            >
              <span className="agents-menu-icon">{item.icon}</span>
              <span className="agents-menu-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="agents-sidebar-section">
          <div className="agents-section-title">置顶</div>
          <div className="agents-menu-item">
            <span className="agents-menu-icon"><MessageOutlined /></span>
            <span className="agents-menu-label">主对话</span>
          </div>
        </div>

        <div className="agents-sidebar-section">
          <div className="agents-section-title">最近</div>
          {RECENT_ITEMS.map((item, idx) => (
            <div key={idx} className="agents-menu-item">
              <span className="agents-menu-icon">{item.icon}</span>
              <span className="agents-menu-label">{item.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* 右侧主区域 */}
      <div className="agents-main">
        {/* 顶部导航栏 */}
        <header className="agents-topnav">
          <div className="agents-topnav-left">
            <span className="agents-topnav-brand">
              <span className="agents-topnav-logo">通</span>
              <span className="agents-topnav-brand-text">
                <span>通答</span>
                <span className="agents-topnav-divider">|</span>
                <span>研习社</span>
              </span>
            </span>
            <nav className="agents-topnav-tabs">
              {TOP_NAV.map((item) => (
                <div
                  key={item.key}
                  className={`agents-topnav-tab ${item.active ? 'agents-topnav-tab-active' : ''}`}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div className="agents-topnav-right">
            <Input
              allowClear
              placeholder="请输入关键词"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              className="agents-search-input"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="agents-submit-btn" type="button">
              <PlusOutlined />
              提交作品
            </button>
            <button className="agents-contact-btn" type="button">
              联系我们
            </button>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="agents-content">
          {/* 排序切换 */}
          <div className="agents-sort-bar">
            <Segmented
              options={['综合', '最热', '最新']}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
            />
          </div>

          {/* 分类标签栏 */}
          <div className="agents-category-bar">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className={`agents-category-item ${activeCategory === cat ? 'agents-category-item-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>

          {/* 智能体卡片网格 */}
          <div className="agents-grid">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="agent-card">
                <div className="agent-card-header">
                  <div className={`agent-card-icon agent-card-icon-${agent.color}`}>
                    {agent.icon}
                  </div>
                  <div className="agent-card-info">
                    <div className="agent-card-name">{agent.name}</div>
                    <div className="agent-card-desc">{agent.description}</div>
                  </div>
                </div>
                <div className="agent-card-tags">
                  {agent.tags.map((tag, idx) => (
                    <Tag key={idx} className="agent-tag">{tag}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
