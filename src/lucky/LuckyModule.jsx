import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Select, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  ArrowUpOutlined,
  AudioOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  CodeOutlined,
  MessageOutlined,
  CloseOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileImageOutlined,
  FilePptOutlined,
  FolderOutlined,
  PlusOutlined,
  ProductOutlined,
  ProjectOutlined,
  RobotOutlined,
  SearchOutlined,
  ShopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import ResourceLibrarySaveModal from '../resourceLib/ResourceLibrarySaveModal.jsx';
import './LuckyModule.css';

const PAGE_SIZE = 14;
const LUCKY_SIDEBAR_WIDTH_STORAGE_KEY = 'gr.lucky.sidebar-width.v1';
const DEFAULT_LUCKY_SIDEBAR_WIDTH = 224;
const MIN_LUCKY_SIDEBAR_WIDTH = 188;
const MAX_LUCKY_SIDEBAR_WIDTH = 320;

function getBoundedLuckySidebarWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  return Math.max(MIN_LUCKY_SIDEBAR_WIDTH, Math.min(MAX_LUCKY_SIDEBAR_WIDTH, Math.round(width)));
}

function loadLuckySidebarWidth() {
  if (typeof window === 'undefined') return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  try {
    return getBoundedLuckySidebarWidth(window.localStorage.getItem(LUCKY_SIDEBAR_WIDTH_STORAGE_KEY));
  } catch {
    return DEFAULT_LUCKY_SIDEBAR_WIDTH;
  }
}

function persistLuckySidebarWidth(width) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LUCKY_SIDEBAR_WIDTH_STORAGE_KEY, String(getBoundedLuckySidebarWidth(width)));
  } catch {
    // ignore persistence failure
  }
}

const WORK_MODES = [
  { key: 'office', label: '办公', icon: <AppstoreOutlined /> },
  { key: 'code', label: '编程', icon: <CodeOutlined /> },
];

const NAV_ITEMS = [
  { key: 'new', label: '新任务', icon: <EditOutlined /> },
  { key: 'automation', label: '自动化', icon: <ThunderboltOutlined /> },
  { key: 'partners', label: '智能体', icon: <RobotOutlined /> },
  { key: 'projects', label: '项目', icon: <ProjectOutlined /> },
  { key: 'library', label: '资源库', icon: <DatabaseOutlined /> },
  { key: 'market', label: '市场', icon: <ShopOutlined />, meta: '专家 · 技能' },
];

const QUICK_ACTIONS = [
  { key: 'slides', label: '幻灯片', icon: <FilePptOutlined /> },
  { key: 'research', label: '深度研究', icon: <CloudServerOutlined /> },
  { key: 'chart', label: '数据可视化', icon: <BarChartOutlined /> },
  { key: 'prototype', label: '产品原型', icon: <ProductOutlined /> },
  { key: 'office', label: '日常办公', icon: <FolderOutlined /> },
  { key: 'image', label: '图像生成', icon: <FileImageOutlined /> },
];

const COMPOSER_CONTEXTS = [
  { key: 'agent', label: '张洪磊的智能伙伴', icon: <RobotOutlined /> },
  { key: 'project', label: '进入项目工作', icon: <FolderOutlined /> },
  { key: 'browser', label: '云端浏览器', icon: <CloudServerOutlined />, hasNotice: true },
];

const RECOMMENDATION_CARDS = [
  { key: 'ppt', label: '幻灯片', title: '做一份跨部门项目启动会 PPT', icon: <FilePptOutlined /> },
  { key: 'research', label: '深度研究', title: '研究 AI 会议助手领域的市场格局', icon: <CloudServerOutlined /> },
  { key: 'data', label: '数据可视化', title: '做一份国内旅游数据可视化分析', icon: <BarChartOutlined /> },
];

const AGENT_CARDS = [
  {
    key: 'personal',
    name: '张洪磊的智能伙伴',
    desc: '暂无描述',
    tag: '专属',
    tagTone: 'purple',
    avatar: 'personal',
  },
  {
    key: 'coach',
    name: '辅导员',
    desc: '负责团队协作场景下的疑问解答、问题梳理及规则提示辅助工作',
    tag: '团队',
    tagTone: 'muted',
    avatar: 'coach',
  },
];

const CREATE_AGENT_OPTIONS = [
  {
    key: 'team',
    title: '团队智能伙伴',
    desc: '团队专属智能伙伴，聚焦多人协作场景，高效沉淀团队知识，跨群共享上下文',
    action: '添加',
    image: 'team',
    primary: true,
  },
  {
    key: 'third-party',
    title: '第三方智能体',
    badge: '限时免费',
    desc: '将多来源智能体（如 OpenClaw、Hermes 等）无缝接入飞书，打破平台边界，实现多智能体协同工作',
    link: '查看帮助文档',
    action: '接入',
    image: 'third-party',
  },
  {
    key: 'market',
    title: '去专家市场逛逛',
    desc: '市场运营、文案编写、内容生成、人事行政、产品研发等等，各领域的专家等你招募',
    action: '浏览专家市场',
    image: 'market',
  },
];

const TEAM_AGENT_AVATARS = [
  { key: 'avatar-1', type: 'personal' },
  { key: 'avatar-2', type: 'coach' },
  { key: 'avatar-3', type: 'personal' },
  { key: 'avatar-4', type: 'coach' },
  { key: 'avatar-5', type: 'personal' },
  { key: 'avatar-6', type: 'coach' },
  { key: 'avatar-7', type: 'personal' },
  { key: 'avatar-8', type: 'personal' },
  { key: 'avatar-9', type: 'coach' },
];

const AGENT_EDITOR_TABS = ['档案', '技能', '知识', '模型', '管理'];
const AGENT_EDITOR_SKILLS = ['飞书卡片生成', '用户工作画像', '技能调试优化', 'AI生成技能'];
const DEFAULT_AGENT_INSTRUCTION_MARKDOWN = `## 角色定位

- 你是团队协作场景下的通用协作角色，可响应团队成员的各类常规咨询与协作需求，交付清晰明确的反馈结果。

## 工作职责

1. 需求响应：接收团队成员提出的合法合理问题与协作请求，快速给出明确回应。
2. 信息核实：对信息不明确的需求，第一时间向提出人确认补充信息，不随意臆断。
3. 结果反馈：完成需求处理后及时同步给相关人员，确保信息同步无遗漏。

## 行为约束

禁止编造未明确提供的信息、功能与权限，所有不确定的内容需先向用户确认，不做超出常规协作范围的承诺。`;

const SKILL_PACKS = [
  {
    key: 'investment',
    title: '投资分析技能包',
    desc: '适用于投资研究、二级市场跟踪和上市公司分析等场景，可查询 A 股、港股和美股行情。',
    tags: ['股票行情查询', '股票打板筛选', '金融新闻聚合'],
    count: '3,667',
  },
  {
    key: 'research',
    title: '行业研究技能包',
    desc: '行业研究、经营诊断、用户洞察和数据运营，可围绕市场与竞争格局开展调研。',
    tags: ['行业研究分析', '用户研究洞察', '趋势解读'],
    count: '7,011',
  },
  {
    key: 'content',
    title: '内容创作技能包',
    desc: '内容运营、品牌传播和社媒增长。可完成热点洞察、脚本生成与内容改写。',
    tags: ['爆款选题助手', '社媒爆文', '短视频开头'],
    count: '4,812',
  },
];

const SKILL_MARKET_CATEGORIES = ['官方精选', '内容创作', '通用工具', '营销运营', '产品研发', '数据分析', '组织管理', '金融法律'];

const SKILL_MARKET_ITEMS = [
  {
    key: 'feishu-card',
    title: '飞书卡片生成',
    desc: '根据用户的自然语言诉求生成有效的飞书 Lark 互动卡片 JSON，用户可实时生成创建设计卡片。',
    tags: ['工程研发', '编程'],
    count: '4,303,970',
    icon: <FilePptOutlined />,
  },
  {
    key: 'text-polish',
    title: '去除文本 AI 痕迹',
    desc: '识别和去除 AI 生成文本的痕迹，使文字听起来更自然、更有质感。',
    tags: ['去AI味', '自然改写', '内容创作'],
    count: '37,690',
    icon: <EditOutlined />,
  },
  {
    key: 'product-brainstorm',
    title: '产品需求共创',
    desc: '在实现任何需求之前，用于讨论、规划和设计方案，包括需求梳理、方案共创和风险识别。',
    tags: ['需求评审', '方案对比', '产品研发'],
    count: '23,448',
    icon: <ProductOutlined />,
  },
  {
    key: 'whiteboard',
    title: '飞书画板大师',
    desc: '使用 35 种精选配色风格生成美观、可编辑的飞书画板，适合视觉化表达。',
    tags: ['飞书画板', '图形生成', '产品研发'],
    count: '19,935',
    icon: <FileImageOutlined />,
  },
  {
    key: 'insight-collection',
    title: '用户洞察提炼',
    desc: '通过主题分析、亲和图分析法，帮助提炼用户反馈和调研信息。',
    tags: ['用户洞察', '访谈总结', '产品研发'],
    count: '16,228',
    icon: <SearchOutlined />,
  },
  {
    key: 'html-slides',
    title: '精美HTML幻灯片生成',
    desc: '从 32 款精美 HTML 模板中自动匹配风格，一键生成高颜值演示幻灯片。',
    tags: ['PPT生成', 'HTML幻灯片', '产品研发'],
    count: '15,774',
    icon: <FilePptOutlined />,
  },
  {
    key: 'marketing-copy',
    title: '营销文案撰写',
    desc: '用于分任务撰写品牌稿、改写软文化营销文案，包括首页、海报页和活动页。',
    tags: ['落地页文案', 'CTA转化', '营销运营'],
    count: '15,574',
    icon: <EditOutlined />,
  },
  {
    key: 'content-planning',
    title: '内容选题规划',
    desc: '用于规划内容策略，决定创作方向和选题主题，帮助提升内容传播。',
    tags: ['内容选题', '选题规划', '营销运营'],
    count: '12,907',
    icon: <FolderOutlined />,
  },
  {
    key: 'slide-ppt',
    title: '飞书幻灯片 PPT',
    desc: '将用户输入的材料文档、会议纪要、调研资料，方案草稿快速生成演示材料。',
    tags: ['文档转PPT', '模板生成幻灯片', '内容创作'],
    count: '10,876',
    icon: <FilePptOutlined />,
  },
];

const BUILTIN_SKILL_META = {
  飞书卡片生成: {
    desc: '根据用户的自然语言诉求生成有效的飞书/Lark 互动卡片 JSON，用户要求生成/创建/设计卡片时可直接使用。',
    source: '内置',
    icon: <FilePptOutlined />,
  },
  用户工作画像: {
    desc: '基于用户的多维度信息（飞书文档、会议记录、聊天记录及持久化记忆）分析个人特质、偏好和工作方式。',
    source: '内置',
    icon: <ProductOutlined />,
  },
  技能调试优化: {
    desc: '用于检查、测试或优化某个技能。包括验证技能描述是否能被正确触发、优化描述表达和补齐关键参数。',
    source: '内置',
    icon: <ThunderboltOutlined />,
  },
  AI生成技能: {
    desc: '帮助用户创建和更新技能，扩展 aily 工作助手的功能。',
    source: '内置',
    icon: <RobotOutlined />,
  },
};

function getAgentSkillMeta(skillName) {
  const builtIn = BUILTIN_SKILL_META[skillName];
  if (builtIn) {
    return {
      title: skillName,
      ...builtIn,
    };
  }

  const marketSkill = SKILL_MARKET_ITEMS.find((item) => item.title === skillName);
  if (marketSkill) {
    return {
      title: marketSkill.title,
      desc: marketSkill.desc,
      source: '开源',
      icon: marketSkill.icon,
    };
  }

  return {
    title: skillName,
    desc: '用于处理当前智能体的扩展任务，按需为团队协作提供额外能力支持。',
    source: '开源',
    icon: <ThunderboltOutlined />,
  };
}

const AGENT_MODEL_OPTIONS = [
  { key: 'auto', name: 'Auto', rate: '', tone: 'auto' },
  { key: 'doubao-seed', name: 'Doubao-Seed-2.1-turbo', rate: 'x0.38', tone: 'doubao' },
  { key: 'deepseek-v4', name: 'DeepSeek-V4-Pro', rate: 'x0.86', tone: 'deepseek' },
  { key: 'kimi-k3', name: 'Kimi-K3', rate: 'x1.35', tone: 'kimi', badge: '模型上新', badgeTone: 'green' },
  { key: 'kimi-k26', name: 'Kimi-K2.6', rate: 'x0.73', tone: 'kimi' },
  { key: 'glm-52', name: 'GLM-5.2', rate: 'x0.74', tone: 'glm', badge: '旗舰效果', badgeTone: 'purple' },
  { key: 'minimax-m3', name: 'MiniMax-M3', rate: 'x0.25', tone: 'minimax', badge: '高性价比', badgeTone: 'blue' },
  { key: 'qwen-38', name: 'Qwen-3.8-max', rate: 'x0.76', tone: 'qwen', badge: '模型上新', badgeTone: 'green' },
  { key: 'qwen-37', name: 'Qwen-3.7-max', rate: 'x0.68', tone: 'qwen' },
];

const SECTION_COPY = {
  automation: {
    title: '自动化',
    description: '把重复任务沉淀成可执行流程，让 Lucky 帮你自动推进。',
    cards: [
      { title: '消息提醒', desc: '按时间、状态和负责人触发后续动作。', accent: 'blue' },
      { title: '资料归档', desc: '自动整理任务产物并保存到资源库。', accent: 'green' },
      { title: '进度同步', desc: '把项目节点同步到相关团队。', accent: 'gold' },
    ],
  },
  partners: {
    title: '智能体',
    description: '管理可协作的智能伙伴，按任务选择最合适的角色。',
    cards: [
      { title: '教案协作者', desc: '辅助梳理目标、活动和板书设计。', accent: 'blue' },
      { title: '资源整理员', desc: '负责筛选、命名与结构化归档资料。', accent: 'green' },
      { title: '课堂复盘官', desc: '基于记录自动生成课后复盘。', accent: 'gold' },
    ],
  },
  projects: {
    title: '项目',
    description: '围绕真实业务创建工作项目，集中管理任务、资料和输出。',
    cards: [
      { title: 'AI 培训项目', desc: '适合课程、通知、作业和评估一体推进。', accent: 'blue' },
      { title: '市场研究项目', desc: '汇总资料、调研问题和阶段性报告。', accent: 'green' },
      { title: '产品原型项目', desc: '沉淀需求、页面和演示材料。', accent: 'gold' },
    ],
  },
  market: {
    title: '市场',
    description: '浏览可复用的专家智能体与技能模板。',
    cards: [
      { title: '深度研究助手', desc: '快速生成调研框架、资料清单和分析报告。', accent: 'blue' },
      { title: '数据可视化技能', desc: '把表格数据转换成可读图表和结论。', accent: 'green' },
      { title: '会议材料生成', desc: '按会议目标自动组织议程和 PPT。', accent: 'gold' },
    ],
  },
};

const LIBRARY_ROW_TEMPLATES = [
  { title: 'AI评课·动物王国开大会', source: '通用智能体', scope: '全部来源', type: '其他' },
  { title: 'AI评课·动物王国开大会', source: '通用智能体', scope: '组织库', type: '其他' },
  { title: 'AI评课·动物王国开大会5M', source: '通用智能体', scope: '组织库', type: '其他' },
  { title: 'AI评课·小象危险尾巴', source: '通用智能体', scope: '个人库', type: '其他' },
  { title: 'AI评课·专题报告：从认知到实践：赋能中小学人工智...', source: '通用智能体', scope: '共享库', type: '其他' },
  { title: 'AI评课·小象危险尾巴', source: '学海导航者', scope: '个人库', type: '其他' },
  { title: '大学四年规划指南.md', source: '学海导航者', scope: '个人库', type: '文档' },
  { title: 'SKILL.md', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'course-ai-1hour.md', source: '通用智能体', scope: '个人库', type: '文档' },
  { title: 'course-ai.md', source: '通用智能体', scope: '个人库', type: '文档' },
  { title: 'course-ai-60min.md', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'course-ai.md', source: '通用智能体', scope: '共享库', type: '文档' },
  { title: 'AI评课·动物王国开大会', source: '小助手', scope: '全部来源', type: '其他' },
  { title: '模型训练指南.docx', source: '通用智能体', scope: '共享库', type: '文档' },
  { title: 'ai_education_courseware.html', source: '通用智能体', scope: '组织库', type: '文档' },
  { title: 'ai_education_courseware.html', source: '通用智能体', scope: '组织库', type: '文档' },
];

const SOURCE_OPTIONS = [
  { label: '全部来源', value: 'all' },
  { label: '通用智能体', value: '通用智能体' },
  { label: '学海导航者', value: '学海导航者' },
  { label: '小助手', value: '小助手' },
];

const SCOPE_OPTIONS = [
  { label: '全部来源', value: 'all' },
  { label: '个人库', value: '个人库' },
  { label: '组织库', value: '组织库' },
  { label: '共享库', value: '共享库' },
];

function buildLibraryRows() {
  return Array.from({ length: 42 }, (_, index) => {
    const template = LIBRARY_ROW_TEMPLATES[index % LIBRARY_ROW_TEMPLATES.length];
    const cycle = Math.floor(index / LIBRARY_ROW_TEMPLATES.length);
    const day = Math.max(1, 22 - cycle);
    const hour = String((18 - (index % 9) + 24) % 24).padStart(2, '0');
    const minute = String((5 + index * 7) % 60).padStart(2, '0');
    const second = String((12 + index * 13) % 60).padStart(2, '0');
    return {
      id: `lucky-library-${index + 1}`,
      ...template,
      time: `2026-06-${String(day).padStart(2, '0')} ${hour}:${minute}:${second}`,
    };
  });
}

const LIBRARY_ROWS = buildLibraryRows();

function StatCard({ title, value, hint }) {
  return (
    <div className="lucky-stat-card">
      <div className="lucky-stat-title">{title}</div>
      <div className="lucky-stat-value">{value}</div>
      <div className="lucky-stat-hint">{hint}</div>
    </div>
  );
}

function ShowcaseSection({ title, description, cards }) {
  return (
    <div className="lucky-placeholder-view">
      <div className="lucky-placeholder-header">
        <div className="lucky-page-title">{title}</div>
        <div className="lucky-page-subtitle">{description}</div>
      </div>
      <div className="lucky-showcase-grid">
        {cards.map((card) => (
          <div key={card.title} className={`lucky-showcase-card lucky-showcase-card-${card.accent}`}>
            <div className="lucky-showcase-title">{card.title}</div>
            <div className="lucky-showcase-desc">{card.desc}</div>
            <button
              type="button"
              className="lucky-showcase-action"
              onClick={() => message.success(`已打开：${card.title}`)}
            >
              打开
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LuckyHome({ promptText, onPromptChange, onSend }) {
  return (
    <div className="lucky-home">
      <div className="lucky-home-avatar" aria-hidden="true">
        <span className="lucky-home-avatar-face">张</span>
      </div>
      <h1 className="lucky-home-title">让张洪磊的智能伙伴帮你做点什么？</h1>

      <section className="lucky-composer-shell" aria-label="创建新任务">
        <div className="lucky-composer-frame">
          <div className="lucky-composer-box">
            <textarea
              value={promptText}
              className="lucky-composer-input"
              placeholder="输入你的任务或目标"
              rows={2}
              onChange={(event) => onPromptChange(event.target.value)}
            />
            <div className="lucky-composer-actions">
              <button
                type="button"
                className="lucky-icon-button"
                title="添加附件"
                aria-label="添加附件"
                onClick={() => message.info('已打开附件入口')}
              >
                <PlusOutlined />
              </button>
              <div className="lucky-composer-action-right">
                <button
                  type="button"
                  className="lucky-auto-button"
                  title="自动选择能力"
                  onClick={() => message.info('已切换为 Auto 模式')}
                >
                  <ThunderboltOutlined />
                  <span>Auto</span>
                  <DownOutlined />
                </button>
                <button
                  type="button"
                  className="lucky-icon-button"
                  title="语音输入"
                  aria-label="语音输入"
                  onClick={() => message.info('已打开语音输入')}
                >
                  <AudioOutlined />
                </button>
                <button
                  type="button"
                  className="lucky-send-button"
                  title="发送"
                  aria-label="发送"
                  onClick={onSend}
                >
                  <ArrowUpOutlined />
                </button>
              </div>
            </div>
          </div>
          <div className="lucky-context-bar">
            {COMPOSER_CONTEXTS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="lucky-context-item"
                onClick={() => message.info(`已选择：${item.label}`)}
              >
                <span className="lucky-context-icon">{item.icon}</span>
                <span className="lucky-context-label">{item.label}</span>
                <DownOutlined className="lucky-context-arrow" />
                {item.hasNotice ? <span className="lucky-context-notice" /> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="lucky-quick-actions" aria-label="快捷能力">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            className="lucky-quick-chip"
            onClick={() => message.info(`已选择：${item.label}`)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <section className="lucky-recommend-section">
        <div className="lucky-recommend-title">为你推荐</div>
        <div className="lucky-recommend-grid">
          {RECOMMENDATION_CARDS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="lucky-recommend-card"
              onClick={() => message.success(`已选择推荐任务：${item.title}`)}
            >
              <span className="lucky-recommend-card-kicker">
                {item.icon}
                {item.label}
              </span>
              <span className="lucky-recommend-card-title">{item.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function AgentAvatar({ type }) {
  return (
    <span className={`lucky-agent-card-avatar lucky-agent-card-avatar-${type}`} aria-hidden="true">
      <span />
    </span>
  );
}

function CreateAgentIllustration({ type }) {
  return (
    <div className={`lucky-create-agent-visual lucky-create-agent-visual-${type}`} aria-hidden="true">
      <span className="lucky-create-agent-dot lucky-create-agent-dot-1" />
      <span className="lucky-create-agent-dot lucky-create-agent-dot-2" />
      <span className="lucky-create-agent-dot lucky-create-agent-dot-3" />
      <span className="lucky-create-agent-core" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-1" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-2" />
      <span className="lucky-create-agent-cardlet lucky-create-agent-cardlet-3" />
    </div>
  );
}

function CreateAgentModal({ open, onClose, onAddTeamAgent }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const handleOptionClick = (option) => {
    if (option.key === 'team') {
      onClose();
      onAddTeamAgent();
      return;
    }
    message.success(`已选择：${option.title}`);
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-create-agent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-create-agent-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-create-agent-head">
          <h2 id="lucky-create-agent-title">创建智能体</h2>
          <button
            type="button"
            className="lucky-create-agent-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-create-agent-options">
          {CREATE_AGENT_OPTIONS.map((option) => (
            <article key={option.key} className="lucky-create-agent-option">
              <CreateAgentIllustration type={option.image} />
              <div className="lucky-create-agent-copy">
                <div className="lucky-create-agent-option-title">
                  {option.title}
                  {option.badge ? <span>{option.badge}</span> : null}
                </div>
                <p>
                  {option.desc}
                  {option.link ? <button type="button">{option.link}</button> : null}
                </p>
              </div>
              <button
                type="button"
                className={`lucky-create-agent-action ${option.primary ? 'is-primary' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                {option.action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TeamAgentModal({ open, onClose, onCreate }) {
  const [selectedAvatar, setSelectedAvatar] = useState(TEAM_AGENT_AVATARS[7].key);
  const [agentName, setAgentName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedAvatarType = TEAM_AGENT_AVATARS.find((avatar) => avatar.key === selectedAvatar)?.type || 'personal';
  const canCreate = agentName.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      key: `created-agent-${Date.now()}`,
      name: agentName.trim(),
      desc: selectedGroup ? '已添加到群组，可协同处理团队任务' : '暂无描述',
      tag: selectedGroup ? '团队' : '专属',
      tagTone: selectedGroup ? 'muted' : 'purple',
      avatar: selectedAvatarType,
    });
    setAgentName('');
    setSelectedGroup('');
    onClose();
  };

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-team-agent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-team-agent-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-team-agent-head">
          <h2 id="lucky-team-agent-title">新建团队智能伙伴</h2>
          <button
            type="button"
            className="lucky-create-agent-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-team-agent-field">
          <label>头像</label>
          <div className="lucky-team-avatar-row">
            {TEAM_AGENT_AVATARS.map((avatar) => (
              <button
                key={avatar.key}
                type="button"
                className={`lucky-team-avatar-option ${selectedAvatar === avatar.key ? 'is-selected' : ''}`}
                onClick={() => setSelectedAvatar(avatar.key)}
              >
                <AgentAvatar type={avatar.type} />
                {avatar.key === TEAM_AGENT_AVATARS[0].key ? <span className="lucky-team-avatar-camera" /> : null}
              </button>
            ))}
            <button
              type="button"
              className="lucky-team-avatar-more"
              title="更多头像"
              aria-label="更多头像"
              onClick={() => message.info('已打开更多头像')}
            >
              <DownOutlined />
            </button>
          </div>
        </div>

        <div className="lucky-team-agent-field">
          <label htmlFor="lucky-team-agent-name">名称</label>
          <input
            id="lucky-team-agent-name"
            value={agentName}
            className="lucky-team-agent-input"
            placeholder="请输入智能体名称"
            onChange={(event) => setAgentName(event.target.value)}
          />
        </div>

        <div className="lucky-team-agent-field">
          <label htmlFor="lucky-team-agent-group">添加到群组</label>
          <div className="lucky-team-agent-helper">
            创建后，会将智能体添加到所选群组中，并默认共享所有群内的上下文，以提升协作效率
          </div>
          <div className="lucky-team-agent-select-wrap">
            <select
              id="lucky-team-agent-group"
              value={selectedGroup}
              className="lucky-team-agent-select"
              onChange={(event) => setSelectedGroup(event.target.value)}
            >
              <option value="">选择群组</option>
              <option value="project">项目协作群</option>
              <option value="teaching">教研共创群</option>
              <option value="training">培训运营群</option>
            </select>
            <DownOutlined />
          </div>
        </div>

        <div className="lucky-team-agent-footer">
          <button type="button" className="lucky-team-agent-cancel" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={`lucky-team-agent-submit ${canCreate ? 'is-ready' : ''}`}
            disabled={!canCreate}
            onClick={handleCreate}
          >
            创建
          </button>
        </div>
      </section>
    </div>
  );
}

function SkillMarketModal({ open, selectedSkills, onClose, onAddSkill }) {
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState(SKILL_MARKET_CATEGORIES[0]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const selectedSkillSet = new Set(selectedSkills);
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleSkills = SKILL_MARKET_ITEMS.filter((skill) => {
    if (!normalizedSearch) return true;
    return `${skill.title} ${skill.desc} ${skill.tags.join(' ')}`.toLowerCase().includes(normalizedSearch);
  });
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'enterprise', label: '企业专属' },
    { key: 'mine', label: '我的' },
  ];

  return (
    <div className="lucky-create-agent-overlay" role="presentation" onMouseDown={onClose} onClick={onClose}>
      <section
        className="lucky-skill-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-skill-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lucky-skill-modal-head">
          <div className="lucky-skill-modal-tabs" role="tablist" aria-label="技能来源">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="lucky-skill-search" htmlFor="lucky-skill-search-input">
            <SearchOutlined />
            <input
              id="lucky-skill-search-input"
              value={searchText}
              placeholder="搜索"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="lucky-skill-modal-close"
            title="关闭"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="lucky-skill-modal-body">
          <div className="lucky-skill-section-head">
            <h2 id="lucky-skill-modal-title">精选技能包</h2>
            <button type="button" onClick={() => message.info('已展开更多技能包')}>
              更多
              <DownOutlined />
            </button>
          </div>

          <div className="lucky-skill-pack-grid">
            {SKILL_PACKS.map((pack) => (
              <article key={pack.key} className="lucky-skill-pack-card">
                <div className="lucky-skill-pack-top">
                  <h3>{pack.title}</h3>
                  <button type="button" onClick={() => message.success(`已一键添加：${pack.title}`)}>
                    一键添加
                  </button>
                </div>
                <p>{pack.desc}</p>
                <div className="lucky-skill-pack-tags">
                  {pack.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="lucky-skill-count">{pack.count}</div>
              </article>
            ))}
          </div>

          <div className="lucky-skill-category-row">
            {SKILL_MARKET_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
            <button type="button" className="lucky-skill-filter" onClick={() => message.info('已打开筛选')}>
              <ControlOutlined />
              筛选
              <DownOutlined />
            </button>
          </div>

          <div className="lucky-skill-card-grid">
            {visibleSkills.map((skill) => {
              const isAdded = selectedSkillSet.has(skill.title);
              return (
                <article key={skill.key} className="lucky-skill-card">
                  <div className="lucky-skill-card-head">
                    <span className="lucky-skill-card-icon">{skill.icon}</span>
                    <h3>{skill.title}</h3>
                    <button
                      type="button"
                      className={isAdded ? 'is-added' : ''}
                      disabled={isAdded}
                      onClick={() => onAddSkill(skill.title)}
                    >
                      {isAdded ? '已添加' : '+ 添加'}
                    </button>
                  </div>
                  <p>{skill.desc}</p>
                  <div className="lucky-skill-card-tags">
                    {skill.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="lucky-skill-count">{skill.count}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function KnowledgeEmptyState({ compact = false }) {
  return (
    <div className={`lucky-agent-editor-knowledge-empty ${compact ? 'is-compact' : ''}`}>
      <div className="lucky-agent-editor-empty-icon" aria-hidden="true" />
      <p>添加企业知识，为智能体提供更丰富的上下文</p>
      <button type="button" onClick={() => message.info('已打开添加知识')}>+ 添加知识</button>
    </div>
  );
}

function AgentKnowledgeView() {
  return (
    <section className="lucky-agent-knowledge-view" aria-label="知识">
      <div className="lucky-agent-skill-list-toolbar">
        <span>知识</span>
        <div>
          <button type="button" aria-label="搜索知识" onClick={() => message.info('已打开知识搜索')}>
            <SearchOutlined />
          </button>
          <button type="button" aria-label="添加知识" onClick={() => message.info('已打开添加知识')}>
            <PlusOutlined />
          </button>
        </div>
      </div>
      <KnowledgeEmptyState />
    </section>
  );
}

function AgentModelView({ selectedModel, onSelectModel }) {
  return (
    <section className="lucky-agent-model-view" aria-label="模型">
      <div className="lucky-agent-model-head">
        <h3>选择模型</h3>
        <button type="button" aria-label="添加模型" onClick={() => message.info('已打开添加模型')}>
          <PlusOutlined />
        </button>
      </div>

      <div className="lucky-agent-model-list">
        {AGENT_MODEL_OPTIONS.map((model) => {
          const checked = selectedModel === model.key;
          return (
            <button
              key={model.key}
              type="button"
              className={`lucky-agent-model-row ${checked ? 'is-selected' : ''}`}
              onClick={() => onSelectModel(model.key)}
            >
              <span className="lucky-agent-model-radio" aria-hidden="true" />
              <span className={`lucky-agent-model-logo lucky-agent-model-logo-${model.tone}`} aria-hidden="true">
                {model.tone === 'auto' ? <ThunderboltOutlined /> : null}
              </span>
              <span className="lucky-agent-model-name">
                {model.name}
                {model.badge ? (
                  <span className={`lucky-agent-model-badge lucky-agent-model-badge-${model.badgeTone}`}>
                    {model.badge}
                  </span>
                ) : null}
              </span>
              <span className="lucky-agent-model-rate">{model.rate}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AgentEditorPage({
  agent,
  skills,
  instructionMarkdown,
  onInstructionChange,
  onOpenSkillMarket,
  onDeleteAgent,
  onBack,
}) {
  const [activeEditorTab, setActiveEditorTab] = useState('档案');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const statItems = [
    { label: '陪伴天数', value: 1 },
    { label: '对话数', value: 0 },
    { label: '任务数', value: 0 },
  ];
  const instructionEditorId = `lucky-agent-instruction-${agent.key}`;
  const skillListItems = skills.map((skill) => getAgentSkillMeta(skill));

  useEffect(() => {
    setActiveEditorTab('档案');
    setSelectedModel('auto');
    setMoreMenuOpen(false);
  }, [agent.key]);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (moreMenuRef.current?.contains(event.target)) return;
      setMoreMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreMenuOpen]);

  return (
    <section className="lucky-agent-editor" aria-label={`${agent.name} 编辑页`}>
      <div className="lucky-agent-editor-breadcrumb">
        <button type="button" onClick={onBack}>智能体</button>
        <span>/</span>
        <strong>{agent.name}</strong>
        <div className="lucky-agent-editor-more-wrap" ref={moreMenuRef}>
          <button
            type="button"
            className={`lucky-agent-editor-more ${moreMenuOpen ? 'is-active' : ''}`}
            title="更多"
            aria-label="更多"
            aria-haspopup="menu"
            aria-expanded={moreMenuOpen}
            onClick={() => setMoreMenuOpen((open) => !open)}
          >
            <EllipsisOutlined />
          </button>
          {moreMenuOpen ? (
            <div className="lucky-agent-more-menu" role="menu" aria-label="智能体更多操作">
              <button
                type="button"
                className="lucky-agent-more-row"
                role="menuitem"
                onClick={() => message.info('已打开所有者设置')}
              >
                <span>所有者</span>
                <strong>
                  <span className="lucky-agent-more-owner-avatar" aria-hidden="true">张</span>
                  张洪磊
                </strong>
              </button>
              <button
                type="button"
                className="lucky-agent-more-row"
                role="menuitem"
                onClick={() => message.info('已打开可用范围设置')}
              >
                <span>可用范围</span>
                <strong>指定成员</strong>
              </button>
              <button
                type="button"
                className="lucky-agent-more-row is-danger"
                role="menuitem"
                onClick={() => {
                  setMoreMenuOpen(false);
                  onDeleteAgent(agent);
                }}
              >
                删除
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lucky-agent-editor-layout">
        <aside className="lucky-agent-editor-profile">
          <div className={`lucky-agent-editor-avatar lucky-agent-editor-avatar-${agent.avatar}`} aria-hidden="true">
            <span />
          </div>
          <div className="lucky-agent-editor-name">{agent.name}</div>
          <div className="lucky-agent-editor-type">{agent.tag}</div>
          <p className="lucky-agent-editor-desc">
            通用协作角色，处理团队常规咨询需求，交付清晰反馈结果。
          </p>
          <button
            type="button"
            className="lucky-agent-editor-auto"
            onClick={() => message.info(`${agent.name} 已切换为 Auto`)}
          >
            <ThunderboltOutlined />
            Auto
          </button>

          <div className="lucky-agent-editor-stats">
            {statItems.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="lucky-agent-editor-add-group"
            onClick={() => message.info('已打开添加群组')}
          >
            <FolderOutlined />
            添加到群组
          </button>

          <div className="lucky-agent-editor-group-empty">
            <div className="lucky-agent-editor-group-title">已加入的飞书群组</div>
            <div className="lucky-agent-editor-group-hint">
              以下群组的上下文默认可被智能体跨群使用
            </div>
            <div className="lucky-agent-editor-empty-icon" aria-hidden="true" />
            <div className="lucky-agent-editor-empty-text">暂未加入飞书群组</div>
          </div>
        </aside>

        <section className="lucky-agent-editor-panel">
          <div className="lucky-agent-editor-tabs" role="tablist" aria-label="智能体编辑分区">
            {AGENT_EDITOR_TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeEditorTab === tab}
                className={activeEditorTab === tab ? 'is-active' : ''}
                onClick={() => {
                  if (tab === '档案' || tab === '技能' || tab === '知识' || tab === '模型') {
                    setActiveEditorTab(tab);
                    return;
                  }
                  message.info(`已切换到${tab}`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="lucky-agent-editor-scroll">
            {activeEditorTab === '技能' ? (
              <section className="lucky-agent-skill-list-view" aria-label="技能列表">
                <div className="lucky-agent-skill-list-toolbar">
                  <span>技能</span>
                  <div>
                    <button type="button" aria-label="搜索技能" onClick={() => message.info('已打开技能搜索')}>
                      <SearchOutlined />
                    </button>
                    <button type="button" aria-label="添加技能" onClick={onOpenSkillMarket}>
                      <PlusOutlined />
                    </button>
                  </div>
                </div>

                <div className="lucky-agent-skill-list">
                  {skillListItems.map((skill) => (
                    <article key={skill.title} className="lucky-agent-skill-row">
                      <span className="lucky-agent-skill-row-icon">{skill.icon}</span>
                      <div className="lucky-agent-skill-row-copy">
                        <div className="lucky-agent-skill-row-title">
                          <strong>{skill.title}</strong>
                          <span>{skill.source}</span>
                        </div>
                        <p>{skill.desc}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`${skill.title} 更多`}
                        onClick={() => message.info(`已打开：${skill.title}`)}
                      >
                        <EllipsisOutlined />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ) : activeEditorTab === '知识' ? (
              <AgentKnowledgeView />
            ) : activeEditorTab === '模型' ? (
              <AgentModelView selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            ) : (
              <>
                <section className="lucky-agent-editor-section">
                  <button type="button" className="lucky-agent-editor-section-title" aria-controls={instructionEditorId}>
                    <span>工作指令</span>
                    <DownOutlined />
                  </button>
                  <textarea
                    id={instructionEditorId}
                    className="lucky-agent-markdown-editor"
                    value={instructionMarkdown}
                    spellCheck={false}
                    onChange={(event) => onInstructionChange(event.target.value)}
                  />
                </section>

                <section className="lucky-agent-editor-section lucky-agent-editor-slim-section">
                  <div className="lucky-agent-editor-section-head">
                    <h3>技能</h3>
                    <div>
                      <button type="button" aria-label="添加技能" onClick={onOpenSkillMarket}><PlusOutlined /></button>
                      <button
                        type="button"
                        aria-label="技能列表"
                        onClick={() => setActiveEditorTab('技能')}
                      >
                        <ControlOutlined />
                      </button>
                      <button type="button" aria-label="展开技能"><DownOutlined /></button>
                    </div>
                  </div>
                  <div className="lucky-agent-editor-skills">
                    {skills.map((skill) => (
                      <button key={skill} type="button" onClick={() => message.info(`已打开：${skill}`)}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="lucky-agent-editor-section lucky-agent-editor-slim-section">
                  <div className="lucky-agent-editor-section-head">
                    <h3>知识</h3>
                    <div>
                      <button type="button" aria-label="添加知识"><PlusOutlined /></button>
                      <button
                        type="button"
                        aria-label="知识列表"
                        onClick={() => setActiveEditorTab('知识')}
                      >
                        <ControlOutlined />
                      </button>
                      <button type="button" aria-label="展开知识"><DownOutlined /></button>
                    </div>
                  </div>
                  <KnowledgeEmptyState compact />
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function AgentManagementPage({ activeTab, agents, teamAgents, onTabChange, onOpenCreate, onOpenAgent }) {
  const tabs = [
    { key: 'mine', label: '我的智能体', count: agents.length },
    { key: 'team', label: '智能体小队', count: teamAgents.length },
  ];
  const visibleCards = activeTab === 'mine' ? agents : teamAgents;

  const handleCardKeyDown = (event, agent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpenAgent(agent);
  };

  return (
    <section className="lucky-agent-page" aria-label="智能体">
      <div className="lucky-agent-page-title">智能体</div>
      <div className="lucky-agent-board">
        <div className="lucky-agent-topbar">
          <div className="lucky-agent-tabs" role="tablist" aria-label="智能体分类">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`lucky-agent-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
                <span>({tab.count})</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="lucky-agent-create-btn"
            onClick={onOpenCreate}
          >
            <PlusOutlined />
            创建智能体
          </button>
        </div>

        <div className="lucky-agent-card-grid">
          {visibleCards.map((agent) => (
            <article
              key={agent.key}
              className="lucky-agent-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenAgent(agent)}
              onKeyDown={(event) => handleCardKeyDown(event, agent)}
            >
              <div className="lucky-agent-card-head">
                <AgentAvatar type={agent.avatar} />
                <div className="lucky-agent-card-main">
                  <div className="lucky-agent-card-name">{agent.name}</div>
                  <div className="lucky-agent-card-desc">{agent.desc}</div>
                </div>
                <button
                  type="button"
                  className="lucky-agent-card-message"
                  title="打开对话"
                  aria-label={`打开${agent.name}对话`}
                  onClick={(event) => {
                    event.stopPropagation();
                    message.info(`已打开：${agent.name}`);
                  }}
                >
                  <MessageOutlined />
                </button>
              </div>
              <div className="lucky-agent-card-footer">
                <span className={`lucky-agent-badge lucky-agent-badge-${agent.tagTone}`}>
                  {agent.tag}
                </span>
                <button
                  type="button"
                  className="lucky-agent-auto"
                  onClick={(event) => {
                    event.stopPropagation();
                    message.info(`${agent.name} 已切换为 Auto`);
                  }}
                >
                  <ThunderboltOutlined />
                  <span>Auto</span>
                  <DownOutlined />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LuckyModule() {
  const [sidebarWidth, setSidebarWidth] = useState(() => loadLuckySidebarWidth());
  const [activeSection, setActiveSection] = useState('new');
  const [workMode, setWorkMode] = useState('office');
  const [agentTab, setAgentTab] = useState('mine');
  const [createdAgents, setCreatedAgents] = useState([]);
  const [deletedAgentKeys, setDeletedAgentKeys] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentInstructions, setAgentInstructions] = useState({});
  const [agentSkills, setAgentSkills] = useState({});
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [promptText, setPromptText] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [teamAgentOpen, setTeamAgentOpen] = useState(false);
  const [skillMarketOpen, setSkillMarketOpen] = useState(false);
  const sidebarWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const handleSidebarResizeStart = useCallback((event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setSidebarWidth(getBoundedLuckySidebarWidth(startWidth + deltaX));
    };

    const handlePointerUp = () => {
      persistLuckySidebarWidth(sidebarWidthRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [sidebarWidth]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return LIBRARY_ROWS.filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
      if (!normalizedKeyword) return true;
      return `${item.title} ${item.source} ${item.type}`.toLowerCase().includes(normalizedKeyword);
    });
  }, [keyword, scopeFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [activePage, filteredRows]);

  const stats = useMemo(() => {
    const documentCount = filteredRows.filter((item) => item.type === '文档').length;
    const skillCount = filteredRows.filter((item) => item.source === '学海导航者').length;
    return {
      total: filteredRows.length,
      documents: documentCount,
      skills: skillCount,
    };
  }, [filteredRows]);

  const sectionCopy = SECTION_COPY[activeSection];
  const showHome = activeSection === 'new';
  const showAgents = activeSection === 'partners';
  const showLibrary = activeSection === 'library';
  const mineAgents = useMemo(
    () => [...AGENT_CARDS, ...createdAgents].filter((agent) => !deletedAgentKeys.includes(agent.key)),
    [createdAgents, deletedAgentKeys],
  );
  const teamAgents = useMemo(
    () => AGENT_CARDS.filter((agent) => agent.tag === '团队' && !deletedAgentKeys.includes(agent.key)),
    [deletedAgentKeys],
  );
  const editingAgentSkills = editingAgent ? (agentSkills[editingAgent.key] ?? AGENT_EDITOR_SKILLS) : AGENT_EDITOR_SKILLS;

  const handleOpenSaveModal = (item) => {
    setSavingItem(item);
    setSaveModalOpen(true);
  };

  const handleSendPrompt = () => {
    if (!promptText.trim()) {
      message.info('请输入任务或目标');
      return;
    }
    message.success('已创建新任务');
    setPromptText('');
  };

  const handleCreateTeamAgent = (agent) => {
    setCreatedAgents((prev) => [...prev, agent]);
    setAgentTab('mine');
    message.success(`已创建：${agent.name}`);
  };

  const handleAgentInstructionChange = (agentKey, nextMarkdown) => {
    setAgentInstructions((prev) => ({
      ...prev,
      [agentKey]: nextMarkdown,
    }));
  };

  const handleAddAgentSkill = (skillName) => {
    if (!editingAgent) return;
    setAgentSkills((prev) => {
      const currentSkills = prev[editingAgent.key] ?? AGENT_EDITOR_SKILLS;
      if (currentSkills.includes(skillName)) return prev;
      return {
        ...prev,
        [editingAgent.key]: [...currentSkills, skillName],
      };
    });
    message.success(`已添加技能：${skillName}`);
  };

  const handleDeleteAgent = (agent) => {
    setDeletedAgentKeys((prev) => (prev.includes(agent.key) ? prev : [...prev, agent.key]));
    setCreatedAgents((prev) => prev.filter((item) => item.key !== agent.key));
    setAgentInstructions((prev) => {
      const next = { ...prev };
      delete next[agent.key];
      return next;
    });
    setAgentSkills((prev) => {
      const next = { ...prev };
      delete next[agent.key];
      return next;
    });
    setSkillMarketOpen(false);
    setEditingAgent(null);
    message.success(`已删除：${agent.name}`);
  };

  const handleSelectSection = (key) => {
    setActiveSection(key);
    setSkillMarketOpen(false);
    if (key === 'partners') {
      setEditingAgent(null);
      return;
    }
    setEditingAgent(null);
  };

  return (
    <div className="lucky-module">
      <aside
        className="lucky-sidebar"
        style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
      >
        <div className="lucky-sidebar-profile">
          <div className="lucky-sidebar-brand">
            <span className="lucky-brand-logo" aria-hidden="true" />
            <span className="lucky-sidebar-name">lucky</span>
          </div>
          <div className="lucky-sidebar-tools">
            <button type="button" className="lucky-sidebar-tool" title="搜索" aria-label="搜索">
              <SearchOutlined />
            </button>
            <button type="button" className="lucky-sidebar-tool" title="收起侧栏" aria-label="收起侧栏">
              <ControlOutlined />
            </button>
          </div>
        </div>

        <div className="lucky-work-mode-switch" aria-label="工作模式">
          {WORK_MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-mode-button ${workMode === item.key ? 'is-active' : ''}`}
              onClick={() => setWorkMode(item.key)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <nav className="lucky-sidebar-nav" aria-label="Lucky 导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`lucky-nav-item ${activeSection === item.key ? 'is-active' : ''}`}
              onClick={() => handleSelectSection(item.key)}
            >
              <span className="lucky-nav-icon">{item.icon}</span>
              <span className="lucky-nav-label">{item.label}</span>
              {item.meta ? <span className="lucky-nav-meta">{item.meta}</span> : null}
            </button>
          ))}
        </nav>

        <div className="lucky-task-section">
          <div className="lucky-task-head">
            <span>任务</span>
            <button type="button" className="lucky-sidebar-tool" title="任务设置" aria-label="任务设置">
              <ControlOutlined />
            </button>
          </div>
          <button
            type="button"
            className={`lucky-task-shortcut ${activeSection === 'new' ? 'is-active' : ''}`}
            onClick={() => handleSelectSection('new')}
          >
            <span className="lucky-task-text">介绍并引导上手使用</span>
            <span className="lucky-task-dot" aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div
        className="lucky-sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整侧栏宽度"
        onPointerDown={handleSidebarResizeStart}
      />

      <main className="lucky-main">
        <div className="lucky-main-inner">
          {showHome ? (
            <LuckyHome
              promptText={promptText}
              onPromptChange={setPromptText}
              onSend={handleSendPrompt}
            />
          ) : showAgents ? (
            editingAgent ? (
              <AgentEditorPage
                agent={editingAgent}
                skills={editingAgentSkills}
                instructionMarkdown={agentInstructions[editingAgent.key] ?? DEFAULT_AGENT_INSTRUCTION_MARKDOWN}
                onInstructionChange={(nextMarkdown) => handleAgentInstructionChange(editingAgent.key, nextMarkdown)}
                onOpenSkillMarket={() => setSkillMarketOpen(true)}
                onDeleteAgent={handleDeleteAgent}
                onBack={() => {
                  setSkillMarketOpen(false);
                  setEditingAgent(null);
                }}
              />
            ) : (
              <AgentManagementPage
                activeTab={agentTab}
                agents={mineAgents}
                teamAgents={teamAgents}
                onTabChange={setAgentTab}
                onOpenCreate={() => setCreateAgentOpen(true)}
                onOpenAgent={setEditingAgent}
              />
            )
          ) : showLibrary ? (
            <div className="lucky-workspace-card lucky-library-view">
              <div className="lucky-page-header">
                <div>
                  <div className="lucky-page-title">资源库</div>
                </div>
                <div className="lucky-toolbar">
                  <Select
                    value={sourceFilter}
                    options={SOURCE_OPTIONS}
                    className="lucky-select"
                    onChange={(value) => {
                      setSourceFilter(value);
                      setCurrentPage(1);
                    }}
                  />
                  <Select
                    value={scopeFilter}
                    options={SCOPE_OPTIONS}
                    className="lucky-select"
                    onChange={(value) => {
                      setScopeFilter(value);
                      setCurrentPage(1);
                    }}
                  />
                  <Input
                    allowClear
                    value={keyword}
                    className="lucky-search"
                    placeholder="搜索"
                    prefix={<SearchOutlined />}
                    onChange={(event) => {
                      setKeyword(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="lucky-stat-grid">
                <StatCard title="全部条目" value={stats.total} hint="当前筛选结果" />
                <StatCard title="文档" value={stats.documents} hint="可直接查看与复用" />
                <StatCard title="导航者资源" value={stats.skills} hint="来自学海导航者" />
              </div>

              <div className="lucky-library-table-scroll">
                <div className="lucky-library-table">
                  <div className="lucky-library-row lucky-library-row-header">
                    <div className="lucky-library-cell col-name">名称</div>
                    <div className="lucky-library-cell col-source">来源</div>
                    <div className="lucky-library-cell col-type">类型</div>
                    <div className="lucky-library-cell col-time">时间</div>
                    <div className="lucky-library-cell col-view">查看</div>
                    <div className="lucky-library-cell col-action">操作</div>
                  </div>

                  {pagedRows.map((item) => (
                    <div key={item.id} className="lucky-library-row">
                      <div className="lucky-library-cell col-name lucky-library-name" title={item.title}>
                        {item.title}
                      </div>
                      <div className="lucky-library-cell col-source">{item.source}</div>
                      <div className="lucky-library-cell col-type">
                        <Tag className={`lucky-type-tag ${item.type === '文档' ? 'is-document' : ''}`}>
                          {item.type}
                        </Tag>
                      </div>
                      <div className="lucky-library-cell col-time">{item.time}</div>
                      <div className="lucky-library-cell col-view">
                        <button
                          type="button"
                          className="lucky-link-button"
                          onClick={() => message.success(`已打开详情：${item.title}`)}
                        >
                          查看详情
                        </button>
                      </div>
                      <div className="lucky-library-cell col-action">
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            items: [
                              {
                                key: 'save-to-library',
                                label: '另存为资源库',
                              },
                            ],
                            onClick: ({ key }) => {
                              if (key === 'save-to-library') handleOpenSaveModal(item);
                            },
                          }}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            className="lucky-row-action"
                            icon={<EllipsisOutlined />}
                          />
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lucky-table-footer">
                <div className="lucky-table-meta">
                  第 {activePage} / {totalPages} 页，共 {filteredRows.length} 条
                </div>
                <div className="lucky-pagination">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        type="button"
                        className={`lucky-page-btn ${page === activePage ? 'is-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="lucky-page-btn lucky-page-next"
                    disabled={activePage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ShowcaseSection
              title={sectionCopy.title}
              description={sectionCopy.description}
              cards={sectionCopy.cards}
            />
          )}
        </div>
      </main>

      <ResourceLibrarySaveModal
        open={saveModalOpen}
        item={savingItem}
        onClose={() => {
          setSaveModalOpen(false);
          setSavingItem(null);
        }}
        onSaved={({ libraryName, name }) => {
          message.success(`已将「${name}」另存到${libraryName}`);
        }}
      />
      <CreateAgentModal
        open={createAgentOpen}
        onClose={() => setCreateAgentOpen(false)}
        onAddTeamAgent={() => setTeamAgentOpen(true)}
      />
      <TeamAgentModal
        open={teamAgentOpen}
        onClose={() => setTeamAgentOpen(false)}
        onCreate={handleCreateTeamAgent}
      />
      <SkillMarketModal
        open={skillMarketOpen && Boolean(editingAgent)}
        selectedSkills={editingAgentSkills}
        onClose={() => setSkillMarketOpen(false)}
        onAddSkill={handleAddAgentSkill}
      />
    </div>
  );
}

export default LuckyModule;
