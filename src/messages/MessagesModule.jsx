import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Empty, Input, Modal, Popover, Radio, Tag, Tooltip, message } from 'antd';
import {
  ApartmentOutlined,
  CameraOutlined,
  CloseOutlined,
  DownOutlined,
  EllipsisOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LikeFilled,
  LikeOutlined,
  LinkOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  PushpinFilled,
  ScissorOutlined,
  SearchOutlined,
  SendOutlined,
  ShareAltOutlined,
  SmileOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  getLuckyPushStoreEventName,
  getLuckyConversationId,
  markLuckyConversationRead,
  readLuckyConversation,
} from './luckyPushStore';
import { getConversationsUnreadCount, INITIAL_MESSAGE_UNREAD_BY_CONVERSATION } from './messageUnread';
import { trackEvent, trackRecommendationEvent } from '../shared/analytics';
import './MessagesModule.css';

const TYPE_META = {
  topic: {
    placeholder: '补充一条话题动态...',
  },
  direct: {
    placeholder: '发送一条私聊消息...',
  },
  group: {
    placeholder: '向群里发送消息...',
  },
};

const QUICK_EMOJIS = ['😀', '👍', '🔥', '🎯', '👏', '✅', '🤝', '🚀'];

const SEND_MODE_META = {
  normal: {
    label: '普通发送',
    prefix: '',
  },
  urgent: {
    label: '加急发送',
    prefix: '【加急】',
  },
  silent: {
    label: '静默发送',
    prefix: '【静默】',
  },
};

const TEXT_FORMAT_TOOLS = [
  { key: 'bold', title: '加粗', label: 'B', command: 'bold', html: '<strong>加粗文字</strong>' },
  { key: 'strike', title: '删除线', label: 'S', command: 'strikeThrough', html: '<s>删除线文字</s>' },
  { key: 'italic', title: '斜体', label: 'I', command: 'italic', html: '<em>斜体文字</em>' },
  { key: 'underline', title: '下划线', label: 'U', command: 'underline', html: '<u>下划线文字</u>' },
  { key: 'ordered', title: '编号列表', label: '1.', command: 'insertOrderedList', html: '<ol><li>列表项</li></ol>' },
  { key: 'unordered', title: '项目列表', label: 'list', command: 'insertUnorderedList', html: '<ul><li>列表项</li></ul>' },
  { key: 'quote', title: '引用', label: '"', command: 'formatBlock', value: 'blockquote', html: '<blockquote>引用内容</blockquote>' },
  { key: 'link', title: '链接', label: 'link', command: 'createLink', value: 'https://', html: '<a href="https://">链接文字</a>' },
  { key: 'code', title: '代码', label: '{}', html: '<code>代码</code>' },
];

const ALLOWED_RICH_TEXT_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DIV',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'SPAN',
  'STRIKE',
  'STRONG',
  'U',
  'UL',
]);

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(value = '') {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function richHtmlToPlainText(html = '') {
  const source = String(html || '');
  if (!source) {
    return '';
  }

  if (typeof document === 'undefined') {
    return source
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|p|li|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  const container = document.createElement('div');
  container.innerHTML = source
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|blockquote)>/gi, '\n');
  return (container.textContent || '').replace(/\u00a0/g, ' ').trim();
}

function sanitizeRichHtml(html = '') {
  const source = String(html || '');
  if (!source) {
    return '';
  }

  if (typeof document === 'undefined') {
    return plainTextToHtml(source.replace(/<[^>]+>/g, ''));
  }

  const template = document.createElement('template');
  template.innerHTML = source;

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createTextNode('');
    }

    const tagName = node.tagName.toUpperCase();
    if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        fragment.appendChild(sanitizeNode(child));
      });
      return fragment;
    }

    const next = document.createElement(tagName.toLowerCase());
    if (tagName === 'A') {
      const href = node.getAttribute('href') || '';
      const safeHref = /^(https?:|mailto:)/i.test(href) ? href : '#';
      next.setAttribute('href', safeHref);
      next.setAttribute('target', '_blank');
      next.setAttribute('rel', 'noreferrer');
    }

    node.childNodes.forEach((child) => {
      next.appendChild(sanitizeNode(child));
    });
    return next;
  };

  const output = document.createElement('div');
  template.content.childNodes.forEach((child) => {
    output.appendChild(sanitizeNode(child));
  });
  return output.innerHTML;
}

const CREATE_CONVERSATION_META = {
  group: {
    title: '新群组',
    subtitle: '未命名群组 · 1 人',
    preview: '群组已创建，发一条消息开始协作。',
    description: '新的群组会话，可继续补充成员、群说明和公告。',
    avatarText: '群',
    avatarColor: 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)',
    seedMessage: '群组已创建，先发一条消息把大家拉进来吧。',
  },
  direct: {
    title: '新单聊',
    subtitle: '单聊',
    preview: '单聊已创建，先打个招呼吧。',
    description: '新的单聊会话，可直接开始沟通。',
    avatarText: '聊',
    avatarColor: 'linear-gradient(135deg, #7a7cff 0%, #5fc2ff 100%)',
    seedMessage: '单聊已创建，可以直接开始沟通。',
  },
};

const GROUP_CREATE_DEFAULT_FORM = {
  mode: 'friends',
  name: '',
  avatarText: '',
  avatarPresetId: 'group-blue',
  avatarImage: '',
  keyword: '',
  selectedMemberIds: [],
};

const GROUP_AVATAR_PRESETS = [
  { id: 'group-blue', label: '协作群', color: 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)' },
  { id: 'course-sky', label: '课程', color: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)' },
  { id: 'research-green', label: '教研', color: 'linear-gradient(135deg, #34d399 0%, #0f766e 100%)' },
  { id: 'ai-violet', label: 'AI', color: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' },
  { id: 'project-orange', label: '项目', color: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' },
  { id: 'class-cyan', label: '班级', color: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)' },
  { id: 'topic-rose', label: '话题', color: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)' },
  { id: 'work-lime', label: '工作坊', color: 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)' },
  { id: 'team-indigo', label: '团队', color: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)' },
  { id: 'studio-pink', label: '工作室', color: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)' },
];

const GROUP_MODE_META = {
  friends: {
    label: '好友工作群',
    description: '适合日常沟通、项目协作和团队同步。',
  },
  topic: {
    label: '话题论坛',
    description: '适合围绕主题沉淀讨论、资料和观点。',
  },
};

const GROUP_CREATE_DEPARTMENTS = [
  { id: 'dept-guoren', short: '国', name: '国人通', count: 18 },
  { id: 'dept-admin', short: '行', name: '行政部门', count: 9 },
  { id: 'dept-class', short: '班', name: '班级', count: 36 },
  { id: 'dept-teaching', short: '教', name: '教师空间', count: 24 },
];

const GROUP_CREATE_MEMBERS = [
  { id: 'member-linqing', name: '林青', title: '产品经理', dept: '国人通', color: 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)' },
  { id: 'member-gaobo', name: '高博', title: '研发负责人', dept: '国人通', color: 'linear-gradient(135deg, #ffb347 0%, #ff7e5f 100%)' },
  { id: 'member-siyue', name: '司玥', title: '课程设计师', dept: '教师空间', color: 'linear-gradient(135deg, #7e89ff 0%, #8dc6ff 100%)' },
  { id: 'member-heiren', name: '黑仁', title: '体验设计', dept: '教师空间', color: 'linear-gradient(135deg, #b073ff 0%, #7d5fff 100%)' },
  { id: 'member-zhou', name: '周哥陪伴', title: '项目顾问', dept: '行政部门', color: 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)' },
  { id: 'member-difang', name: '地方九', title: '教研伙伴', dept: '班级', color: 'linear-gradient(135deg, #36b39f 0%, #73d5b7 100%)' },
];

const DEFAULT_SIDEBAR_WIDTH = 360;
const MIN_SIDEBAR_WIDTH = 248;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_THREAD_WIDTH = 420;
const SIDEBAR_KEYBOARD_STEP = 16;
const EMPTY_CONVERSATION_INDICATOR = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  opacity: 0,
};
const LUCKY_CONVERSATION_ID = getLuckyConversationId();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getMaxSidebarWidth(containerWidth) {
  if (!containerWidth) {
    return MAX_SIDEBAR_WIDTH;
  }
  return Math.min(
    MAX_SIDEBAR_WIDTH,
    Math.max(MIN_SIDEBAR_WIDTH, containerWidth - MIN_THREAD_WIDTH),
  );
}

function clampSidebarWidth(nextWidth, containerWidth) {
  return clamp(nextWidth, MIN_SIDEBAR_WIDTH, getMaxSidebarWidth(containerWidth));
}

function mergeLuckyConversation(list, luckyConversation) {
  const otherConversations = list.filter((item) => item.id !== luckyConversation.id);
  return [luckyConversation, ...otherConversations];
}

const INITIAL_CONVERSATIONS = [
  {
    id: 'topic-genai',
    type: 'topic',
    title: 'GenAI 听海轩',
    subtitle: '代码部 · 8 位参与者',
    preview: '地方九：听海轩，做了些 LangChain 和 Agent 工具链的整理，欢迎一起补充。',
    time: '09:28',
    unread: 0,
    pinned: true,
    avatarText: 'G',
    avatarColor: 'linear-gradient(135deg, #f59f5a 0%, #f27573 100%)',
    description: '围绕 GenAI 工具链、工程实践和案例拆解形成的协作话题。',
    posts: [
      {
        id: 'post-1',
        author: '沧海九票',
        authorRole: '话题发起人',
        time: '6月5日 09:40',
        avatarText: '沧',
        avatarColor: 'linear-gradient(135deg, #a77950 0%, #e7c39f 100%)',
        pinnedNotice: '沧海九票 Pin 了这个话题',
        title: '🦜 LangChain VIP 闭门会纪要 06.02（8 图见下方）',
        contentSections: [
          '作为 LangChain Ambassador 刚参加了 LangChain 六月社区会议，信息量炸裂💥 四大重磅功能一次看👇',
          '🤖 Managed Deep Agents\nCLI 一键部署，Agent 配置模型 + 工具 + Subagent\n自动创建 Context Hub，支持 MCP 服务器\n几秒钟从零到生产！',
          '🖥️ Code Interpreter\n基于 QuickJS 的轻量 JS 运行时，Figma 同款技术\n默认无网络无文件系统访问，安全隔离\nAgent 能写代码批量调用 50 个工具！',
          '🔒 Sandboxes\n隔离环境默认可控，脚本执行、抓取和文件处理可以拆到独立沙箱里跑。\n结合 Code Interpreter 后，Agent 的执行边界更清晰，也更适合团队协作。',
        ],
        collapsedSections: 3,
        replyPreview: {
          hiddenCount: 7,
          earlierItems: [
            { id: 'reply-early-1', author: 'Kevin', text: '我先整理一版中文文档结构，晚上丢出来。' },
          ],
          items: [
            { id: 'reply-1', author: 'wlet kevin（PM）', text: '老登们，我们一起做 langsmith 攻略' },
            { id: 'reply-2', author: '沧海九票', text: '@wlet kevin（PM） 官方是允许我们搭建中文文档站的，确实可以搞一个' },
          ],
        },
        threadDetail: {
          pageTitle: 'LangChain VIP 闭门会纪要 06.02（8 图见下方） 作为 LangChain Ambassador 刚参加了 LangChain 六月社区会议，信息量炸裂',
          sourceLabel: '来自：GenAI 听海轩',
          galleryItems: [
            {
              id: 'gallery-1',
              eyebrow: '开源爆发 & 流式传输',
              title: 'Agent 集成能力跃迁',
              bullets: ['Managed Deep Agents 一键部署', 'Subagent 组合能力抬升', 'Context Hub 自动创建'],
            },
            {
              id: 'gallery-2',
              eyebrow: '关键技术洞察',
              title: '六大核心趋势判断',
              bullets: ['Code Interpreter 隔离执行', 'MCP 服务编排成熟', '沙箱与权限边界更清晰'],
            },
          ],
          comments: [
            { id: 'thread-reply-1', author: '地方九', time: '6月5日 09:08', text: '不知道这次图片显示是不是不了指路图' },
            { id: 'thread-reply-2', author: '四五张', time: '6月5日 10:13', text: '海艺老师访谈的页面不见了' },
            { id: 'thread-reply-3', author: '沧海九票', time: '6月5日 10:23', text: '@周正贤 我那张图截图直接贴上来' },
            { id: 'thread-reply-4', author: '快谈co', time: '6月5日 10:40', text: '感觉这次会在圈内上了，开源的扩张我最关心 code interpreter' },
            { id: 'thread-reply-5', author: 'wlet kevin（PM）', time: '6月5日 15:18', text: '自动化评估 Agent 真的有了？' },
            { id: 'thread-reply-6', author: '沧海九票', time: '6月5日 17:33', text: '@wlet kevin（PM） LangSmith Engine 不单评估还会挂载 协议（甚至 pr）' },
            { id: 'thread-reply-7', author: 'wlet kevin（PM）', time: '6月6日 08:13', text: '老登们，我们一起做 langsmith 攻略' },
            { id: 'thread-reply-8', author: '沧海九票', time: '6月6日 09:17', text: '@wlet kevin（PM） 官方是允许我们搭建中文文档站的，确实可以搞一个', highlighted: true },
          ],
        },
        threadSubscribed: false,
        liked: false,
        starred: false,
      },
      {
        id: 'post-2',
        author: '司 玥',
        authorRole: '参与者',
        time: '6月8日 14:21',
        avatarText: '司',
        avatarColor: 'linear-gradient(135deg, #7e89ff 0%, #8dc6ff 100%)',
        title: '分享一篇视频 coding 访谈',
        contentSections: [
          '分享一篇文章，大家对视频 coding 下面这句提问印象很深：速度管理型的人际交流其实更像是信息编排。',
        ],
        linkCard: {
          domain: 'mp.weixin.qq.com',
          title: '乔布斯Boss聊“你在 Vibe Coding 时遇到卡住怎么办？”',
          desc: '从 Prompt、架构拆解到反馈闭环，适合拿来做团队内部共识讨论。',
        },
        replyPreview: {
          hiddenCount: 0,
          items: [
            { id: 'reply-3', author: '地方九', text: '这篇很适合拿来做团队内部讨论，我晚点整理要点。' },
          ],
        },
        threadDetail: {
          pageTitle: '分享一篇视频 coding 访谈 · 讨论详情',
          sourceLabel: '来自：GenAI 听海轩',
          comments: [
            { id: 'thread-reply-9', author: '地方九', time: '6月8日 14:35', text: '这篇很适合拿来做团队内部讨论，我晚点整理要点。' },
          ],
        },
        threadSubscribed: true,
        liked: true,
        starred: false,
      },
      {
        id: 'post-3',
        author: '地方九',
        authorRole: '参与者',
        time: '6月8日 09:40',
        avatarText: '地',
        avatarColor: 'linear-gradient(135deg, #36b39f 0%, #73d5b7 100%)',
        title: '关于 LangChain VIP 和代码部的补充',
        contentSections: [
          'Managed Deep Agents、Subagent CLI、MCP 服务编排和 Code Interpreter 都值得做一轮梳理。',
          '尤其是多 Agent 协同时，默认无损优先级、权限模型和上下文隔离，后续可以单独拉清单。',
        ],
        replyPreview: {
          hiddenCount: 2,
          earlierItems: [
            { id: 'reply-4', author: '和光', text: '我补一个安全边界说明，避免大家误解 Code Interpreter 的权限。' },
          ],
          items: [
            { id: 'reply-5', author: '黑仁', text: '这个话题后面可以拆成一页专题，信息量已经够了。' },
          ],
        },
        threadDetail: {
          pageTitle: '关于 LangChain VIP 和代码部的补充 · 讨论详情',
          sourceLabel: '来自：GenAI 听海轩',
          comments: [
            { id: 'thread-reply-10', author: '和光', time: '6月8日 09:48', text: '我补一个安全边界说明，避免大家误解 Code Interpreter 的权限。' },
            { id: 'thread-reply-11', author: '黑仁', time: '6月8日 10:05', text: '这个话题后面可以拆成一页专题，信息量已经够了。' },
          ],
        },
        threadSubscribed: false,
        liked: false,
        starred: true,
      },
    ],
  },
  {
    id: 'group-standup',
    type: 'group',
    title: '早会',
    subtitle: '产品研发群 · 12 人',
    preview: 'WK 08:45 - 09:00，今天先同步验收和联调阻塞项。',
    time: '10:50',
    unread: INITIAL_MESSAGE_UNREAD_BY_CONVERSATION['group-standup'],
    avatarText: '早',
    avatarColor: 'linear-gradient(135deg, #ffb347 0%, #ff7e5f 100%)',
    description: '日常工作群，聚焦排期、风险和今日任务同步。',
    messages: [
      {
        id: 'msg-g1',
        sender: '高博',
        time: '10:48',
        content: '今天首页版本要合并，资源库拖拽这块谁来最后验一下？',
      },
      {
        id: 'msg-g2',
        sender: '林青',
        time: '10:49',
        content: '我来，顺带把消息页这批样式也一起过一下。',
      },
      {
        id: 'msg-g3',
        sender: '你',
        self: true,
        time: '10:50',
        content: '我先把消息页的会话类型分层做出来，验证完再合并。',
      },
    ],
  },
  {
    id: 'direct-wenxin',
    type: 'direct',
    title: '周哥陪伴',
    subtitle: '单聊',
    preview: '再看一下那张参考图，重点是把“话题”和普通群聊区分开。',
    time: '10:09',
    unread: 0,
    avatarText: '周',
    avatarColor: 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)',
    description: '针对消息页体验的快速讨论。',
    messages: [
      {
        id: 'msg-d1',
        sender: '周哥',
        time: '10:06',
        content: '你先别只做一个列表，右侧详情也要能体现这是话题会话。',
      },
      {
        id: 'msg-d2',
        sender: '你',
        self: true,
        time: '10:08',
        content: '明白，我会把话题详情做成动态流，单聊和群聊仍然保留聊天样式。',
      },
    ],
  },
  {
    id: 'group-agentseek',
    type: 'group',
    title: 'AgentSeek 联调群',
    subtitle: '应用接入 · 18 人',
    preview: 'AgentSeek CLI 快速构建和运行模板应用，晚些把视频整理一下。',
    time: '09:04',
    unread: INITIAL_MESSAGE_UNREAD_BY_CONVERSATION['group-agentseek'],
    avatarText: 'AS',
    avatarColor: 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)',
    description: 'AgentSeek 相关的能力验证与工程联调群。',
    messages: [
      {
        id: 'msg-ag1',
        sender: '地方九',
        time: '09:04',
        content: '我把 AgentSeek CLI 的视频和工具链接都整理在群公告里了。',
      },
      {
        id: 'msg-ag2',
        sender: '和光',
        time: '09:05',
        content: '好的，晚点我补一个模板应用接入文档。',
      },
    ],
  },
  {
    id: 'direct-heiren',
    type: 'direct',
    title: '黑仁',
    subtitle: '单聊',
    preview: '主界面先把会话类型跑通，图标和细节我后面再补。',
    time: '10:02',
    unread: 0,
    avatarText: '黑',
    avatarColor: 'linear-gradient(135deg, #b073ff 0%, #7d5fff 100%)',
    description: '设计反馈和节奏确认。',
    messages: [
      {
        id: 'msg-h1',
        sender: '黑仁',
        time: '10:00',
        content: '列表里的类型标记别太重，重点放在详情区的结构差异。',
      },
      {
        id: 'msg-h2',
        sender: '你',
        self: true,
        time: '10:02',
        content: '收到，我用轻量标签，右侧按会话类型切换布局。',
      },
    ],
  },
];

function getInitialConversations(initialConversationId) {
  const luckyConversation = readLuckyConversation();
  const conversations = mergeLuckyConversation(
    INITIAL_CONVERSATIONS,
    initialConversationId === LUCKY_CONVERSATION_ID
      ? { ...luckyConversation, unread: 0 }
      : luckyConversation,
  );

  if (!initialConversationId || initialConversationId === LUCKY_CONVERSATION_ID) {
    return conversations;
  }

  return conversations.map((conversation) => (
    conversation.id === initialConversationId && conversation.unread > 0
      ? { ...conversation, unread: 0 }
      : conversation
  ));
}

function getTimeLabel() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getAvatarStyle(background) {
  return {
    background,
    color: '#fff',
    border: 'none',
  };
}

function getGroupAvatarText(name) {
  const normalizedName = String(name || '').trim().replace(/\s+/g, '');
  return normalizedName ? normalizedName.slice(0, 2) : '';
}

function getGroupAvatarPreset(presetId) {
  return GROUP_AVATAR_PRESETS.find((preset) => preset.id === presetId) || GROUP_AVATAR_PRESETS[0];
}

function getGroupAvatarDisplay({ avatarText, avatarPresetId, avatarImage, name }) {
  const preset = getGroupAvatarPreset(avatarPresetId);
  return {
    text: getGroupAvatarText(avatarText),
    color: preset.color,
    image: avatarImage || '',
  };
}

function LuckyRecommendationCard({ recommendation, onAction }) {
  const resolvedActionLabel = recommendation.target?.type === 'scene' || recommendation.target?.type === 'space_catalog'
    ? '申请加入空间'
    : recommendation.target?.type === 'resource'
      ? '去资料库'
      : recommendation.actionLabel || '查看';

  return (
    <div className="messages-lucky-rec-card">
      <div className="messages-lucky-rec-main">
        <div className="messages-lucky-rec-title">{recommendation.title}</div>
        {recommendation.subtitle ? (
          <div className="messages-lucky-rec-subtitle">{recommendation.subtitle}</div>
        ) : null}
        <div className="messages-lucky-rec-desc">{recommendation.reasonSummary || recommendation.description}</div>
        <div className="messages-lucky-rec-tags">
          <Tag color="blue">{recommendation.score} 分</Tag>
          {(recommendation.reasonLabels || []).slice(0, 2).map((item) => (
            <Tag key={`${recommendation.id}_${item}`}>{item}</Tag>
          ))}
        </div>
      </div>
      <Button className="messages-lucky-rec-btn" type="primary" onClick={() => onAction?.(recommendation)}>
        {resolvedActionLabel}
      </Button>
    </div>
  );
}

function MessagesModule({
  initialConversationId = null,
  onNavigateToTeacherEvaluation,
  onNavigateToResource,
  onUnreadCountChange,
}) {
  const [conversations, setConversations] = useState(() => getInitialConversations(initialConversationId));
  const [selectedId, setSelectedId] = useState(initialConversationId || 'topic-genai');
  const [drafts, setDrafts] = useState({});
  const [expandedTopicPosts, setExpandedTopicPosts] = useState({});
  const [activeTopicThread, setActiveTopicThread] = useState(null);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [formatEnabled, setFormatEnabled] = useState(false);
  const [sendMode, setSendMode] = useState('normal');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
  const [isGroupAvatarModalOpen, setIsGroupAvatarModalOpen] = useState(false);
  const [groupAvatarDraft, setGroupAvatarDraft] = useState('');
  const [groupAvatarPresetDraft, setGroupAvatarPresetDraft] = useState(GROUP_CREATE_DEFAULT_FORM.avatarPresetId);
  const [groupAvatarImageDraft, setGroupAvatarImageDraft] = useState('');
  const [groupCreateForm, setGroupCreateForm] = useState(GROUP_CREATE_DEFAULT_FORM);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [conversationIndicatorStyle, setConversationIndicatorStyle] = useState(EMPTY_CONVERSATION_INDICATOR);
  const moduleRef = useRef(null);
  const conversationListRef = useRef(null);
  const conversationItemRefs = useRef(new Map());
  const composerEditorRef = useRef(null);
  const groupAvatarFileInputRef = useRef(null);
  const luckyExposeRegistryRef = useRef(new Set());
  const lastSyncedComposerConversationRef = useRef('');
  const createConversationCountRef = useRef({
    group: 0,
    direct: 0,
  });
  const resizeStateRef = useRef({
    startX: 0,
    startWidth: DEFAULT_SIDEBAR_WIDTH,
  });

  const selectedConversation =
    conversations.find((item) => item.id === selectedId) || conversations[0] || null;
  const selectedMeta = selectedConversation ? TYPE_META[selectedConversation.type] : null;
  const activeConversationId = selectedConversation?.id || '';
  const activeTopicThreadPost = selectedConversation?.type === 'topic'
    ? (selectedConversation.posts || []).find((post) => post.id === activeTopicThread) || null
    : null;
  const currentDraft = drafts[activeConversationId] || '';
  const currentDraftPlainText = richHtmlToPlainText(currentDraft);
  const selectedGroupCreateMembers = GROUP_CREATE_MEMBERS.filter((member) => (
    groupCreateForm.selectedMemberIds.includes(member.id)
  ));
  const filteredGroupCreateDepartments = GROUP_CREATE_DEPARTMENTS.filter((dept) => {
    const keyword = groupCreateForm.keyword.trim().toLowerCase();
    return !keyword || `${dept.name}${dept.short}`.toLowerCase().includes(keyword);
  });
  const filteredGroupCreateMembers = GROUP_CREATE_MEMBERS.filter((member) => {
    const keyword = groupCreateForm.keyword.trim().toLowerCase();
    return !keyword || `${member.name}${member.title}${member.dept}`.toLowerCase().includes(keyword);
  });
  const groupCreateAvatarDisplay = getGroupAvatarDisplay(groupCreateForm);
  const groupAvatarPreviewDisplay = getGroupAvatarDisplay({
    name: groupCreateForm.name,
    avatarText: groupAvatarDraft,
    avatarPresetId: groupAvatarPresetDraft,
    avatarImage: groupAvatarImageDraft,
  });

  useEffect(() => {
    onUnreadCountChange?.(getConversationsUnreadCount(conversations));
  }, [conversations, onUnreadCountChange]);

  useEffect(() => {
    if (selectedId !== LUCKY_CONVERSATION_ID) return;
    markLuckyConversationRead();
    trackEvent('message_lucky_open', {
      module: 'messages',
      pageId: 'messages',
      pageName: '消息',
      objectType: 'conversation',
      objectId: LUCKY_CONVERSATION_ID,
      properties: {
        source: initialConversationId === LUCKY_CONVERSATION_ID ? 'lucky_icon' : 'messages_list',
      },
    });
  }, [initialConversationId, selectedId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleLuckyChange = () => {
      const nextLuckyConversation = selectedId === LUCKY_CONVERSATION_ID
        ? markLuckyConversationRead()
        : readLuckyConversation();
      setConversations((prev) => mergeLuckyConversation(prev, nextLuckyConversation));
    };

    const eventName = getLuckyPushStoreEventName();
    window.addEventListener(eventName, handleLuckyChange);
    return () => {
      window.removeEventListener(eventName, handleLuckyChange);
    };
  }, [selectedId]);

  useEffect(() => {
    if (selectedConversation?.id !== LUCKY_CONVERSATION_ID) {
      return;
    }

    (selectedConversation.messages || []).forEach((message) => {
      (message.recommendations || []).forEach((recommendation) => {
        const exposeKey = `${message.id}_${recommendation.id}`;
        if (luckyExposeRegistryRef.current.has(exposeKey)) {
          return;
        }
        luckyExposeRegistryRef.current.add(exposeKey);
        trackRecommendationEvent('expose', recommendation, {
          module: 'messages',
          pageId: 'messages',
          pageName: '消息',
          recommendPosition: 'lucky_push',
          properties: {
            sourceConversationId: LUCKY_CONVERSATION_ID,
            luckyMessageId: message.id,
          },
        });
      });
    });
  }, [selectedConversation]);

  const getClampedSidebarWidth = (nextWidth) => {
    return clampSidebarWidth(nextWidth, moduleRef.current?.clientWidth || 0);
  };

  const adjustSidebarWidth = (delta) => {
    setSidebarWidth((prev) => getClampedSidebarWidth(prev + delta));
  };

  const setConversationItemRef = useCallback((conversationId, node) => {
    if (node) {
      conversationItemRefs.current.set(conversationId, node);
      return;
    }
    conversationItemRefs.current.delete(conversationId);
  }, []);

  const updateConversationIndicator = useCallback(() => {
    const container = conversationListRef.current;
    const target = conversationItemRefs.current.get(activeConversationId) || null;

    if (!container || !target) {
      setConversationIndicatorStyle((prev) => (
        prev.opacity === 0 ? prev : { ...prev, opacity: 0 }
      ));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextStyle = {
      x: targetRect.left - containerRect.left + container.scrollLeft,
      y: targetRect.top - containerRect.top + container.scrollTop,
      width: targetRect.width,
      height: targetRect.height,
      opacity: 1,
    };

    setConversationIndicatorStyle((prev) => {
      const unchanged = ['x', 'y', 'width', 'height', 'opacity']
        .every((key) => Math.abs((prev[key] || 0) - (nextStyle[key] || 0)) < 0.5);
      return unchanged ? prev : nextStyle;
    });
  }, [activeConversationId]);

  useEffect(() => {
    const handleWindowResize = () => {
      setSidebarWidth((prev) => clampSidebarWidth(prev, moduleRef.current?.clientWidth || 0));
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const { startX, startWidth } = resizeStateRef.current;
      const delta = event.clientX - startX;
      setSidebarWidth(clampSidebarWidth(startWidth + delta, moduleRef.current?.clientWidth || 0));
    };

    const stopResizing = () => {
      setIsResizingSidebar(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    window.addEventListener('pointercancel', stopResizing);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
      window.removeEventListener('pointercancel', stopResizing);
    };
  }, [isResizingSidebar]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateConversationIndicator();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeConversationId, conversations, sidebarWidth, updateConversationIndicator]);

  useLayoutEffect(() => {
    const editor = composerEditorRef.current;
    if (!editor) {
      return;
    }

    const nextHtml = currentDraft || '';
    const conversationChanged = lastSyncedComposerConversationRef.current !== activeConversationId;
    const shouldSync = conversationChanged || document.activeElement !== editor || nextHtml === '';
    if (shouldSync && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
    lastSyncedComposerConversationRef.current = activeConversationId;
  }, [activeConversationId, currentDraft]);

  useEffect(() => {
    const handleConversationListViewportChange = () => {
      updateConversationIndicator();
    };

    const list = conversationListRef.current;
    window.addEventListener('resize', handleConversationListViewportChange);
    list?.addEventListener('scroll', handleConversationListViewportChange, { passive: true });

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(handleConversationListViewportChange)
      : null;

    if (observer) {
      if (list) observer.observe(list);
      const activeItem = conversationItemRefs.current.get(activeConversationId);
      if (activeItem) observer.observe(activeItem);
    }

    return () => {
      window.removeEventListener('resize', handleConversationListViewportChange);
      list?.removeEventListener('scroll', handleConversationListViewportChange);
      observer?.disconnect();
    };
  }, [activeConversationId, updateConversationIndicator]);

  const handleDraftChange = (value) => {
    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: value,
    }));
  };

  const updateGroupCreateForm = (patch) => {
    setGroupCreateForm((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const openGroupCreateModal = () => {
    setIsCreateMenuOpen(false);
    setGroupCreateForm(GROUP_CREATE_DEFAULT_FORM);
    setGroupAvatarDraft('');
    setGroupAvatarPresetDraft(GROUP_CREATE_DEFAULT_FORM.avatarPresetId);
    setGroupAvatarImageDraft('');
    setIsGroupAvatarModalOpen(false);
    setIsGroupCreateModalOpen(true);
  };

  const closeGroupCreateModal = () => {
    setIsGroupCreateModalOpen(false);
    setIsGroupAvatarModalOpen(false);
  };

  const openGroupAvatarModal = () => {
    setGroupAvatarDraft(groupCreateForm.avatarText || groupCreateForm.name || '');
    setGroupAvatarPresetDraft(groupCreateForm.avatarPresetId || GROUP_CREATE_DEFAULT_FORM.avatarPresetId);
    setGroupAvatarImageDraft(groupCreateForm.avatarImage || '');
    setIsGroupAvatarModalOpen(true);
  };

  const closeGroupAvatarModal = () => {
    setIsGroupAvatarModalOpen(false);
  };

  const handleSubmitGroupAvatar = () => {
    updateGroupCreateForm({
      avatarText: groupAvatarDraft.trim().slice(0, 8),
      avatarPresetId: groupAvatarPresetDraft,
      avatarImage: groupAvatarImageDraft,
    });
    setIsGroupAvatarModalOpen(false);
  };

  const handleSelectLocalAvatar = () => {
    groupAvatarFileInputRef.current?.click();
  };

  const handleLocalAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setGroupAvatarImageDraft(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const toggleGroupCreateMember = (memberId) => {
    setGroupCreateForm((prev) => {
      const selectedSet = new Set(prev.selectedMemberIds);
      if (selectedSet.has(memberId)) {
        selectedSet.delete(memberId);
      } else {
        selectedSet.add(memberId);
      }
      return {
        ...prev,
        selectedMemberIds: Array.from(selectedSet),
      };
    });
  };

  const syncComposerDraft = () => {
    const editor = composerEditorRef.current;
    const nextHtml = editor?.innerHTML || '';
    handleDraftChange(nextHtml);
    return nextHtml;
  };

  const placeCaretAtComposerEnd = () => {
    const editor = composerEditorRef.current;
    if (!editor || typeof window === 'undefined') {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const ensureComposerSelection = () => {
    const editor = composerEditorRef.current;
    if (!editor || typeof window === 'undefined') {
      return false;
    }

    editor.focus();
    const selection = window.getSelection();
    const hasSelectionInEditor = Boolean(
      selection?.rangeCount
        && editor.contains(selection.anchorNode)
        && editor.contains(selection.focusNode),
    );

    if (!hasSelectionInEditor) {
      placeCaretAtComposerEnd();
    }
    return true;
  };

  const insertRichHtml = (html) => {
    if (!ensureComposerSelection()) {
      handleDraftChange(`${currentDraft}${html}`);
      return;
    }

    document.execCommand('insertHTML', false, html);
    syncComposerDraft();
  };

  const insertDraftText = (snippet) => {
    if (!ensureComposerSelection()) {
      handleDraftChange(`${currentDraft}${plainTextToHtml(snippet)}`);
      return;
    }

    document.execCommand('insertText', false, snippet);
    syncComposerDraft();
  };

  const handleComposerInput = () => {
    syncComposerDraft();
  };

  const handleComposerPaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    insertDraftText(text);
  };

  const focusComposer = () => {
    const editor = composerEditorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    if (!window.getSelection()?.rangeCount) {
      placeCaretAtComposerEnd();
    }
  };

  const applyTextFormat = (tool) => {
    if (!ensureComposerSelection()) {
      return;
    }

    const selection = window.getSelection();
    const hasSelectedText = Boolean(selection?.toString());

    if (!hasSelectedText) {
      insertRichHtml(tool.html);
      return;
    }

    if (tool.key === 'code') {
      const selectedText = selection.toString();
      insertRichHtml(`<code>${escapeHtml(selectedText)}</code>`);
      return;
    }

    document.execCommand(tool.command, false, tool.value || null);
    syncComposerDraft();
  };

  const renderTextFormatIcon = (tool) => {
    if (tool.key === 'link') {
      return <LinkOutlined />;
    }

    if (tool.key === 'unordered') {
      return (
        <span className="messages-format-list-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      );
    }

    return <span>{tool.label}</span>;
  };

  const normalizedOutgoingText = (text) => {
    const prefix = SEND_MODE_META[sendMode]?.prefix;
    return prefix ? `${prefix}${text}` : text;
  };

  const normalizedOutgoingHtml = (html, fallbackText) => {
    const safeHtml = sanitizeRichHtml(html) || plainTextToHtml(fallbackText);
    const prefix = SEND_MODE_META[sendMode]?.prefix;
    return prefix ? `${plainTextToHtml(prefix)}${safeHtml}` : safeHtml;
  };

  const emojiPopoverContent = (
    <div className="messages-emoji-panel">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="messages-emoji-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertDraftText(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  const quickInsertItems = [
    {
      key: 'file',
      label: '插入文件',
      onClick: () => insertDraftText('[文件] '),
    },
    {
      key: 'card',
      label: '插入名片',
      onClick: () => insertDraftText('[名片] '),
    },
    {
      key: 'todo',
      label: '插入待办',
      onClick: () => insertDraftText('[待办] '),
    },
  ];

  const sendModeItems = Object.entries(SEND_MODE_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    onClick: () => setSendMode(key),
  }));

  const buildDraftConversation = (type, options = {}) => {
    const meta = CREATE_CONVERSATION_META[type];
    if (!meta) {
      return null;
    }

    const nextCount = (createConversationCountRef.current[type] || 0) + 1;
    createConversationCountRef.current[type] = nextCount;
    const suffix = nextCount > 1 ? ` ${nextCount}` : '';
    const id = `${type}-draft-${Date.now()}-${nextCount}`;
    const memberCount = Number.isFinite(options.memberCount) ? options.memberCount : 1;
    const title = options.title || `${meta.title}${suffix}`;
    const groupModeLabel = options.mode ? GROUP_MODE_META[options.mode]?.label : '';

    return {
      id,
      type,
      title,
      subtitle: options.subtitle || (type === 'group' ? `${groupModeLabel || '群组'} · ${memberCount} 人` : meta.subtitle),
      preview: options.preview || meta.preview,
      time: getTimeLabel(),
      unread: 0,
      avatarText: options.avatarText || meta.avatarText,
      avatarColor: options.avatarColor || meta.avatarColor,
      avatarImage: options.avatarImage || '',
      description: options.description || meta.description,
      messages: [
        {
          id: `${id}-seed`,
          sender: '系统助手',
          time: '刚刚',
          content: options.seedMessage || meta.seedMessage,
        },
      ],
    };
  };

  const buildReplyPreviewFromComments = (comments) => {
    const normalized = comments.map((item) => ({
      id: item.id,
      author: item.author,
      text: item.text,
    }));
    return {
      hiddenCount: Math.max(0, normalized.length - 2),
      earlierItems: normalized.slice(0, -2),
      items: normalized.slice(-2),
    };
  };

  const buildTopicThreadDetail = (post) => post.threadDetail || {
    pageTitle: `${post.title || post.contentSections?.[0] || '话题详情'} · 讨论详情`,
    galleryItems: [],
    comments: [
      ...(post.replyPreview?.earlierItems || []),
      ...(post.replyPreview?.items || []),
    ].map((item, index) => ({
      ...item,
      time: item.time || `6月8日 0${index + 8}:00`,
    })),
  };

  const updateActiveTopicPost = (postId, updater) => {
    setConversations((prev) => prev.map((conversation) => {
      if (conversation.id !== activeConversationId || conversation.type !== 'topic') {
        return conversation;
      }
      return {
        ...conversation,
        posts: (conversation.posts || []).map((post) => (
          post.id === postId ? updater(post) : post
        )),
      };
    }));
  };

  const toggleTopicPostExpanded = (postId) => {
    setExpandedTopicPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleTopicLike = (postId) => {
    updateActiveTopicPost(postId, (post) => ({
      ...post,
      liked: !post.liked,
    }));
  };

  const handleTopicStar = (postId) => {
    updateActiveTopicPost(postId, (post) => ({
      ...post,
      starred: !post.starred,
    }));
  };

  const handleTopicThreadSubscribe = (postId) => {
    updateActiveTopicPost(postId, (post) => ({
      ...post,
      threadSubscribed: !post.threadSubscribed,
    }));
  };

  const updateActiveTopicThreadComment = (commentId, updater) => {
    if (!activeTopicThread) {
      return;
    }
    updateActiveTopicPost(activeTopicThread, (post) => {
      const threadDetail = buildTopicThreadDetail(post);
      return {
        ...post,
        threadDetail: {
          ...threadDetail,
          comments: (threadDetail.comments || []).map((comment) => (
            comment.id === commentId ? updater(comment) : comment
          )),
        },
      };
    });
  };

  const openTopicThread = (post, focusReply = false) => {
    setActiveTopicThread(post.id);
    if (focusReply) {
      requestAnimationFrame(() => {
        focusComposer();
      });
    }
  };

  const handleTopicReply = (post) => {
    setActiveTopicThread(post.id);
    requestAnimationFrame(() => {
      insertDraftText(`@${post.author} `);
      focusComposer();
    });
  };

  const handleTopicShare = (post) => {
    const sharedText = post.title || post.contentSections?.[0] || '分享这个话题';
    const nextSnippet = `[分享自 ${selectedConversation?.title}] ${sharedText}\n`;
    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: `${prev[activeConversationId] || ''}${nextSnippet}`,
    }));
  };

  const handleTopicThreadCommentLike = (commentId) => {
    updateActiveTopicThreadComment(commentId, (comment) => ({
      ...comment,
      liked: !comment.liked,
    }));
  };

  const handleTopicThreadCommentReply = (comment) => {
    insertDraftText(`@${comment.author} `);
    focusComposer();
  };

  const handleTopicThreadCommentQuote = (comment) => {
    const quotedText = `> ${comment.author}: ${comment.text}\n`;
    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: `${prev[activeConversationId] || ''}${quotedText}`,
    }));
  };

  const handleConversationSelect = (conversationId) => {
    setIsCreateMenuOpen(false);
    setSelectedId(conversationId);
    setActiveTopicThread(null);
    if (conversationId === LUCKY_CONVERSATION_ID) {
      const nextLuckyConversation = markLuckyConversationRead();
      setConversations((prev) => mergeLuckyConversation(prev, nextLuckyConversation));
      return;
    }

    setConversations((prev) => prev.map((conversation) => (
      conversation.id === conversationId && conversation.unread > 0
        ? { ...conversation, unread: 0 }
        : conversation
    )));
  };

  const handleCreateConversation = (type) => {
    const nextConversation = buildDraftConversation(type);
    if (!nextConversation) {
      return;
    }

    setIsCreateMenuOpen(false);
    setActiveTopicThread(null);
    setConversations((prev) => [nextConversation, ...prev]);
    setSelectedId(nextConversation.id);
    requestAnimationFrame(() => {
      focusComposer();
    });
  };

  const handleSubmitGroupCreate = () => {
    const groupName = groupCreateForm.name.trim();
    const selectedNames = selectedGroupCreateMembers.map((member) => member.name);
    const nextCount = Math.max(1, selectedGroupCreateMembers.length + 1);
    const title = groupName || (selectedNames.length
      ? `${selectedNames.slice(0, 2).join('、')}的群组`
      : '新群组');
    const modeMeta = GROUP_MODE_META[groupCreateForm.mode] || GROUP_MODE_META.friends;
    const nextConversation = buildDraftConversation('group', {
      title,
      memberCount: nextCount,
      mode: groupCreateForm.mode,
      avatarText: groupCreateAvatarDisplay.text,
      avatarColor: groupCreateAvatarDisplay.color,
      avatarImage: groupCreateAvatarDisplay.image,
      subtitle: `${modeMeta.label} · ${nextCount} 人`,
      preview: `群组已创建，${selectedNames.length ? `已邀请 ${selectedNames.join('、')}` : '可继续邀请成员'}。`,
      description: modeMeta.description,
      seedMessage: `群组创建成功。${selectedNames.length ? `已邀请 ${selectedNames.join('、')} 加入，` : ''}可以开始同步议题了。`,
    });

    setIsGroupCreateModalOpen(false);
    setActiveTopicThread(null);
    setConversations((prev) => [nextConversation, ...prev]);
    setSelectedId(nextConversation.id);
    requestAnimationFrame(() => {
      focusComposer();
    });
  };

  const handleLuckyRecommendationAction = (recommendation) => {
    trackRecommendationEvent('click', recommendation, {
      module: 'messages',
      pageId: 'messages',
      pageName: '消息',
      recommendPosition: 'lucky_push',
      properties: {
        sourceConversationId: LUCKY_CONVERSATION_ID,
      },
    });

    if (recommendation.target?.type === 'scene') {
      trackEvent('space_join_apply', {
        module: 'messages',
        pageId: 'messages',
        pageName: '消息',
        objectType: 'scene',
        objectId: recommendation.target.sceneId || '',
        recommendScene: true,
        recommendId: recommendation.id,
        recommendStrategy: recommendation.strategy,
        recommendReasonCodes: recommendation.reasonCodes,
        recommendScore: recommendation.score,
        recommendTargetType: recommendation.target?.type || recommendation.type,
        recommendTargetId: recommendation.target.sceneId || '',
        properties: {
          sourceConversationId: LUCKY_CONVERSATION_ID,
          sceneTitle: recommendation.title,
        },
      });
      message.success(`已提交加入“${recommendation.title}”的申请，等待空间管理员处理`);
      return;
    }

    if (recommendation.target?.type === 'space_catalog') {
      trackEvent('space_join_apply', {
        module: 'messages',
        pageId: 'messages',
        pageName: '消息',
        objectType: 'space_catalog',
        objectId: recommendation.target.menuKey || recommendation.id,
        recommendScene: true,
        recommendId: recommendation.id,
        recommendStrategy: recommendation.strategy,
        recommendReasonCodes: recommendation.reasonCodes,
        recommendScore: recommendation.score,
        recommendTargetType: recommendation.target?.type || recommendation.type,
        recommendTargetId: recommendation.target.menuKey || '',
        properties: {
          sourceConversationId: LUCKY_CONVERSATION_ID,
          sceneTitle: recommendation.title,
        },
      });
      message.success(`已提交加入“${recommendation.title}”的申请，等待空间管理员处理`);
      return;
    }

    if (recommendation.target?.type === 'resource') {
      onNavigateToResource?.({
        scope: recommendation.target.libraryScope,
        libraryId: recommendation.target.libraryId,
        resourceKey: recommendation.target.resourceKey,
        keyword: recommendation.target.keyword,
      });
      return;
    }

    onNavigateToTeacherEvaluation?.({
      teacherId: recommendation.target?.teacherId,
    });
  };

  const handleSidebarResizeStart = (event) => {
    if (window.matchMedia('(max-width: 960px)').matches) {
      return;
    }
    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
    setIsResizingSidebar(true);
  };

  const handleSidebarResizeKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      adjustSidebarWidth(-SIDEBAR_KEYBOARD_STEP);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      adjustSidebarWidth(SIDEBAR_KEYBOARD_STEP);
    }
  };

  const handleSend = () => {
    const draftHtml = composerEditorRef.current?.innerHTML || currentDraft;
    const text = richHtmlToPlainText(draftHtml);
    if (!selectedConversation || !text) {
      return;
    }

    const outgoingText = normalizedOutgoingText(text);
    const outgoingHtml = normalizedOutgoingHtml(draftHtml, text);
    const updatedTime = getTimeLabel();

    if (selectedConversation.type === 'topic' && activeTopicThread) {
      setConversations((prev) => prev.map((conversation) => {
        if (conversation.id !== selectedConversation.id) {
          return conversation;
        }
        return {
          ...conversation,
          preview: outgoingText,
          time: updatedTime,
          posts: (conversation.posts || []).map((post) => {
            if (post.id !== activeTopicThread) {
              return post;
            }
            const nextComments = [
              ...(buildTopicThreadDetail(post).comments || []),
              {
                id: `thread-reply-${Date.now()}`,
                author: '你',
                time: '刚刚',
                text: outgoingText,
                contentHtml: outgoingHtml,
                highlighted: true,
              },
            ];
            return {
              ...post,
              replyPreview: buildReplyPreviewFromComments(nextComments),
              threadDetail: {
                ...buildTopicThreadDetail(post),
                comments: nextComments,
              },
            };
          }),
        };
      }));

      setDrafts((prev) => ({
        ...prev,
        [activeConversationId]: '',
      }));
      if (composerEditorRef.current) {
        composerEditorRef.current.innerHTML = '';
      }
      return;
    }

    setConversations((prev) => {
      const target = prev.find((item) => item.id === selectedConversation.id);
      if (!target) {
        return prev;
      }

      const updatedConversation = target.type === 'topic'
        ? {
          ...target,
          preview: outgoingText,
          time: updatedTime,
          posts: [
            ...target.posts,
            {
              id: `post-${Date.now()}`,
              author: '你',
              authorRole: '参与者',
              avatarText: '你',
              avatarColor: 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)',
              time: '刚刚',
              contentSections: [outgoingText],
              contentSectionsHtml: [outgoingHtml],
              threadSubscribed: false,
              liked: false,
              starred: false,
              replyPreview: {
                hiddenCount: 0,
                items: [],
              },
            },
          ],
        }
        : {
          ...target,
          preview: outgoingText,
          time: updatedTime,
          messages: [
            ...(target.messages || []),
            {
              id: `msg-${Date.now()}`,
              sender: '你',
              self: true,
              time: '刚刚',
              content: outgoingText,
              contentHtml: outgoingHtml,
            },
          ],
        };

      return [updatedConversation, ...prev.filter((item) => item.id !== target.id)];
    });

    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: '',
    }));
    if (composerEditorRef.current) {
      composerEditorRef.current.innerHTML = '';
    }
    setSelectedId(selectedConversation.id);
  };

  const renderRichContent = (html, fallbackText = '', className = '') => {
    const safeHtml = html ? sanitizeRichHtml(html) : plainTextToHtml(fallbackText);
    return (
      <div
        className={`messages-rich-content ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  };

  const renderSidebarItem = (item) => {
    return (
      <button
        key={item.id}
        ref={(node) => setConversationItemRef(item.id, node)}
        type="button"
        className={`messages-conversation-item ${activeConversationId === item.id ? 'is-active' : ''}`}
        onClick={() => handleConversationSelect(item.id)}
      >
        <div className="messages-conversation-avatar-wrap">
          <Avatar size={36} src={item.avatarImage || undefined} style={getAvatarStyle(item.avatarColor)}>
            {item.avatarText}
          </Avatar>
          {item.unread > 0 ? (
            <Badge count={item.unread} size="small" className="messages-conversation-badge" />
          ) : null}
        </div>
        <div className="messages-conversation-body">
          <div className="messages-conversation-top">
            <div className="messages-conversation-title-wrap">
              <span className="messages-conversation-title">{item.title}</span>
              {item.pinned ? (
                <Tooltip title="置顶会话">
                  <PushpinFilled className="messages-conversation-pin" />
                </Tooltip>
              ) : null}
            </div>
            <span className="messages-conversation-time">{item.time}</span>
          </div>
          <div className="messages-conversation-bottom">
            <span className="messages-conversation-preview">{item.preview}</span>
          </div>
        </div>
      </button>
    );
  };

  const renderTopicStream = (conversation) => (
    <div className="messages-topic-stream">
      {conversation.posts.map((post) => (
        <article
          key={post.id}
          className={`messages-topic-card ${post.pinnedNotice ? 'is-featured' : ''}`}
        >
          {post.pinnedNotice ? (
            <div className="messages-topic-card-pinline">
              <PushpinFilled />
              <span>{post.pinnedNotice}</span>
            </div>
          ) : null}
          <div className="messages-topic-card-header">
            <div className="messages-topic-card-author">
              <Avatar size={30} style={getAvatarStyle(post.avatarColor || conversation.avatarColor)}>
                {(post.avatarText || post.author).slice(0, 1)}
              </Avatar>
              <div>
                <div className="messages-topic-card-author-row">
                  <span className="messages-topic-card-author-name">{post.author}</span>
                  <span className="messages-topic-card-time-inline">{post.time}</span>
                </div>
                {post.authorRole ? (
                  <div className="messages-topic-card-role-line">{post.authorRole}</div>
                ) : null}
              </div>
            </div>
            <Button type="text" shape="circle" icon={<MoreOutlined />} className="messages-icon-btn" />
          </div>
          {post.title ? <div className="messages-topic-card-title">{post.title}</div> : null}
          <div className="messages-topic-card-content">
            {(expandedTopicPosts[post.id]
              ? (post.contentSections || [])
              : (post.contentSections || []).slice(0, post.collapsedSections || post.contentSections?.length || 0)
            ).map((section, index) => (
              <div key={`${post.id}-section-${index}`} className="messages-topic-card-section">
                {renderRichContent(post.contentSectionsHtml?.[index], section)}
              </div>
            ))}
          </div>
          {(post.contentSections || []).length > (post.collapsedSections || post.contentSections?.length || 0) ? (
            <div className="messages-topic-card-expand-wrap">
              <button
                type="button"
                className="messages-topic-card-expand"
                onClick={() => toggleTopicPostExpanded(post.id)}
              >
                {expandedTopicPosts[post.id] ? '收起' : '展开'}
              </button>
            </div>
          ) : null}
          {post.linkCard ? (
            <div className="messages-link-card">
              <div className="messages-link-card-domain">{post.linkCard.domain}</div>
              <div className="messages-link-card-title">{post.linkCard.title}</div>
              <div className="messages-link-card-desc">{post.linkCard.desc}</div>
            </div>
          ) : null}
          {post.replyPreview ? (
            <div className="messages-topic-replies">
              {post.replyPreview.hiddenCount > 0 || (post.replyPreview.earlierItems || []).length > 0 ? (
                <button
                  type="button"
                  className="messages-topic-replies-more"
                  onClick={() => openTopicThread(post)}
                >
                  {`查看更早 ${post.replyPreview.hiddenCount || (post.replyPreview.earlierItems || []).length} 条回复`}
                </button>
              ) : null}
              {(post.replyPreview.items || []).length ? (
                <button
                  type="button"
                  className="messages-topic-replies-box messages-topic-replies-box-link"
                  onClick={() => openTopicThread(post)}
                >
                  {(post.replyPreview.items || []).map((reply) => (
                    <div key={reply.id} className="messages-topic-reply-item">
                      <span className="messages-topic-reply-author">{reply.author}：</span>
                      <span className="messages-topic-reply-text">{reply.text}</span>
                    </div>
                  ))}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="messages-topic-card-actions">
            <button
              type="button"
              className={`messages-topic-action-btn ${post.liked ? 'is-active' : ''}`}
              onClick={() => handleTopicLike(post.id)}
            >
              {post.liked ? <LikeFilled /> : <LikeOutlined />}
            </button>
            <button
              type="button"
              className={`messages-topic-action-btn ${activeTopicThread === post.id ? 'is-active' : ''}`}
              onClick={() => handleTopicReply(post)}
            >
              <MessageOutlined />
            </button>
            <button
              type="button"
              className="messages-topic-action-btn"
              onClick={() => handleTopicShare(post)}
            >
              <ShareAltOutlined />
            </button>
            <button
              type="button"
              className={`messages-topic-action-btn ${post.starred ? 'is-active' : ''}`}
              onClick={() => handleTopicStar(post.id)}
            >
              {post.starred ? <StarFilled /> : <StarOutlined />}
            </button>
          </div>
        </article>
      ))}
    </div>
  );

  const renderTopicThreadDetail = (post) => {
    const threadDetail = buildTopicThreadDetail(post);
    return (
      <>
        <header className="messages-topic-detail-header">
          <div className="messages-topic-detail-header-main">
            <div className="messages-topic-detail-title-group">
              <div className="messages-topic-detail-title">{threadDetail.pageTitle}</div>
              {threadDetail.sourceLabel ? (
                <div className="messages-topic-detail-source">{threadDetail.sourceLabel}</div>
              ) : null}
            </div>
          </div>
          <div className="messages-topic-detail-actions">
            <Tooltip title="转发话题">
              <button
                type="button"
                className="messages-topic-detail-action-btn"
                onClick={() => handleTopicShare(post)}
              >
                <ShareAltOutlined />
              </button>
            </Tooltip>
            <Tooltip title={post.threadSubscribed ? '取消订阅' : '订阅'}>
              <button
                type="button"
                className={`messages-topic-detail-action-btn ${post.threadSubscribed ? 'is-active' : ''}`}
                onClick={() => handleTopicThreadSubscribe(post.id)}
              >
                {post.threadSubscribed ? <StarFilled /> : <StarOutlined />}
              </button>
            </Tooltip>
            <Tooltip title="关闭">
              <button
                type="button"
                className="messages-topic-detail-action-btn"
                onClick={() => setActiveTopicThread(null)}
              >
                <CloseOutlined />
              </button>
            </Tooltip>
          </div>
        </header>
        <div className="messages-topic-detail-scroll">
          {post.pinnedNotice ? (
            <div className="messages-topic-card-pinline">
              <PushpinFilled />
              <span>{post.pinnedNotice}</span>
            </div>
          ) : null}
          {(threadDetail.galleryItems || []).length ? (
            <div className="messages-topic-detail-stage">
              <div className="messages-topic-detail-gallery">
                {(threadDetail.galleryItems || []).map((item, index) => (
                  <article key={item.id || index} className="messages-topic-detail-poster">
                    <div className="messages-topic-detail-poster-eyebrow">{item.eyebrow}</div>
                    <div className="messages-topic-detail-poster-title">{item.title}</div>
                    <div className="messages-topic-detail-poster-list">
                      {(item.bullets || []).map((bullet, bulletIndex) => (
                        <div key={`${item.id || index}-bullet-${bulletIndex}`} className="messages-topic-detail-poster-bullet">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="messages-topic-detail-canvas" />
            </div>
          ) : null}
          <div className="messages-topic-detail-comments">
            {(threadDetail.comments || []).map((comment) => (
              <div
                key={comment.id}
                className={`messages-topic-detail-comment ${comment.highlighted ? 'is-highlighted' : ''}`}
              >
                <div className="messages-topic-detail-comment-meta">
                  <span className="messages-topic-detail-comment-author">{comment.author}</span>
                  <span>{comment.time}</span>
                </div>
                <div className="messages-topic-detail-comment-body">
                  <div className="messages-topic-detail-comment-text">
                    {renderRichContent(comment.contentHtml, comment.text)}
                  </div>
                  <div className="messages-topic-detail-comment-actions">
                    <button
                      type="button"
                      className={`messages-topic-detail-comment-action ${comment.liked ? 'is-active' : ''}`}
                      onClick={() => handleTopicThreadCommentLike(comment.id)}
                    >
                      {comment.liked ? <LikeFilled /> : <LikeOutlined />}
                    </button>
                    <button
                      type="button"
                      className="messages-topic-detail-comment-action"
                      onClick={() => handleTopicThreadCommentReply(comment)}
                    >
                      <MessageOutlined />
                    </button>
                    <button
                      type="button"
                      className="messages-topic-detail-comment-action"
                      onClick={() => handleTopicThreadCommentQuote(comment)}
                    >
                      <MoreOutlined />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderChatStream = (conversation) => (
    <div className="messages-chat-stream">
      {(conversation.messages || []).map((message) => (
        <div
          key={message.id}
          className={`messages-chat-row ${message.self ? 'is-self' : ''}`}
        >
          <Avatar
            size={30}
            style={getAvatarStyle(
              message.self
                ? 'linear-gradient(135deg, #5f8cff 0%, #63c8ff 100%)'
                : conversation.avatarColor,
            )}
          >
            {(message.self ? '你' : message.sender).slice(0, 1)}
          </Avatar>
          <div className="messages-chat-bubble-wrap">
            <div className="messages-chat-meta">
              <span>{message.sender}</span>
              <span>{message.time}</span>
            </div>
            <div className={`messages-chat-bubble ${conversation.id === LUCKY_CONVERSATION_ID && !message.self ? 'is-lucky' : ''}`}>
              {message.summary ? (
                <div className="messages-lucky-summary">{message.summary}</div>
              ) : null}
              {renderRichContent(message.contentHtml, message.content)}
              {(message.recommendations || []).length ? (
                <div className="messages-lucky-rec-list">
                  {message.recommendations.map((recommendation) => (
                    <LuckyRecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onAction={handleLuckyRecommendationAction}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const createConversationMenu = (
    <div className="messages-create-menu" role="menu" aria-label="新建会话">
      <div className="messages-create-menu-panel">
        <button
          type="button"
          className="messages-create-menu-item"
          data-kind="group"
          onClick={openGroupCreateModal}
        >
          <span className="messages-create-menu-icon">
            <TeamOutlined />
          </span>
          <span className="messages-create-menu-label">创建群组</span>
        </button>
        <button
          type="button"
          className="messages-create-menu-item"
          data-kind="direct"
          onClick={() => handleCreateConversation('direct')}
        >
          <span className="messages-create-menu-icon">
            <PlusOutlined />
          </span>
          <span className="messages-create-menu-label">单聊</span>
        </button>
      </div>
    </div>
  );

  const groupCreateModal = (
    <Modal
      title="创建群组"
      open={isGroupCreateModalOpen}
      onCancel={closeGroupCreateModal}
      width={920}
      centered
      footer={null}
      destroyOnHidden
      className="messages-group-create-modal"
    >
      <div className="messages-group-create-form">
        <div className="messages-group-create-row">
          <div className="messages-group-create-label">群模式</div>
          <Radio.Group
            value={groupCreateForm.mode}
            onChange={(event) => updateGroupCreateForm({ mode: event.target.value })}
            className="messages-group-create-mode"
          >
            {Object.entries(GROUP_MODE_META).map(([key, meta]) => (
              <Radio key={key} value={key}>{meta.label}</Radio>
            ))}
          </Radio.Group>
        </div>

        <div className="messages-group-create-row">
          <div className="messages-group-create-label">群头像</div>
          <div className="messages-group-create-avatar-field">
            <button
              type="button"
              className={`messages-group-create-avatar ${groupCreateAvatarDisplay.image ? 'has-image' : ''}`}
              style={{ background: groupCreateAvatarDisplay.color }}
              onClick={openGroupAvatarModal}
              aria-label="修改群头像"
            >
              {groupCreateAvatarDisplay.image ? (
                <img src={groupCreateAvatarDisplay.image} alt="" />
              ) : (
                groupCreateAvatarDisplay.text
              )}
              <span className="messages-group-create-avatar-edit">编辑</span>
            </button>
          </div>
        </div>

        <div className="messages-group-create-row">
          <div className="messages-group-create-label">群名称</div>
          <Input
            value={groupCreateForm.name}
            onChange={(event) => updateGroupCreateForm({ name: event.target.value })}
            placeholder="输入群名称（选填）"
            maxLength={24}
            className="messages-group-create-name-input"
          />
        </div>

        <div className="messages-group-create-row messages-group-create-members-row">
          <div className="messages-group-create-label">群成员</div>
          <div className="messages-group-create-picker">
            <div className="messages-group-create-left">
              <Input
                value={groupCreateForm.keyword}
                onChange={(event) => updateGroupCreateForm({ keyword: event.target.value })}
                placeholder="搜索部门或成员"
                prefix={<SearchOutlined />}
                allowClear
                className="messages-group-create-search"
              />
              <div className="messages-group-create-section-title">联系人</div>
              <div className="messages-group-create-scroll">
                {filteredGroupCreateDepartments.length ? (
                  <>
                    <div className="messages-group-create-subtitle">部门</div>
                    {filteredGroupCreateDepartments.map((dept) => (
                      <div key={dept.id} className="messages-group-create-dept-row">
                        <div className="messages-group-create-dept-icon">
                          <ApartmentOutlined />
                        </div>
                        <div className="messages-group-create-dept-main">
                          <div className="messages-group-create-dept-name">{dept.name}</div>
                          <div className="messages-group-create-dept-count">{dept.count} 人</div>
                        </div>
                        <button type="button" className="messages-group-create-next-btn">
                          下级
                        </button>
                      </div>
                    ))}
                  </>
                ) : null}

                {filteredGroupCreateMembers.length ? (
                  <>
                    <div className="messages-group-create-subtitle">成员</div>
                    {filteredGroupCreateMembers.map((member) => {
                      const selected = groupCreateForm.selectedMemberIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={`messages-group-create-member-row ${selected ? 'is-selected' : ''}`}
                          onClick={() => toggleGroupCreateMember(member.id)}
                        >
                          <Avatar size={34} style={getAvatarStyle(member.color)}>
                            {member.name.slice(0, 1)}
                          </Avatar>
                          <span className="messages-group-create-member-main">
                            <span className="messages-group-create-member-name">{member.name}</span>
                            <span className="messages-group-create-member-meta">{member.dept} · {member.title}</span>
                          </span>
                          <span className="messages-group-create-check">
                            {selected ? '已选' : '选择'}
                          </span>
                        </button>
                      );
                    })}
                  </>
                ) : null}

                {!filteredGroupCreateDepartments.length && !filteredGroupCreateMembers.length ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的成员" />
                ) : null}
              </div>
            </div>

            <div className="messages-group-create-right">
              <div className="messages-group-create-selected-head">
                已选：{selectedGroupCreateMembers.length} 人
              </div>
              <div className="messages-group-create-selected-list">
                {selectedGroupCreateMembers.length ? (
                  selectedGroupCreateMembers.map((member) => (
                    <div key={member.id} className="messages-group-create-selected-item">
                      <Avatar size={30} style={getAvatarStyle(member.color)}>
                        {member.name.slice(0, 1)}
                      </Avatar>
                      <div className="messages-group-create-selected-main">
                        <div className="messages-group-create-selected-name">{member.name}</div>
                        <div className="messages-group-create-selected-meta">{member.title}</div>
                      </div>
                      <button
                        type="button"
                        className="messages-group-create-remove-btn"
                        onClick={() => toggleGroupCreateMember(member.id)}
                        aria-label={`移除${member.name}`}
                      >
                        <CloseOutlined />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="messages-group-create-empty-selected">
                    <UserOutlined />
                    <span>请从左侧选择群成员</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="messages-group-create-footer">
          <Button onClick={closeGroupCreateModal}>取消</Button>
          <Button type="primary" onClick={handleSubmitGroupCreate}>创建</Button>
        </div>
      </div>
    </Modal>
  );

  const groupAvatarModal = (
    <Modal
      title="修改头像"
      open={isGroupAvatarModalOpen}
      onCancel={closeGroupAvatarModal}
      width={640}
      centered
      destroyOnHidden
      className="messages-group-avatar-modal"
      footer={(
        <div className="messages-group-avatar-footer">
          <Button onClick={closeGroupAvatarModal}>取消</Button>
          <Button type="primary" onClick={handleSubmitGroupAvatar}>保存</Button>
        </div>
      )}
    >
      <div className="messages-group-avatar-editor">
        <div className="messages-group-avatar-preview-wrap">
          <button
            type="button"
            className={`messages-group-avatar-preview ${groupAvatarPreviewDisplay.image ? 'has-image' : ''}`}
            style={{ background: groupAvatarPreviewDisplay.color }}
            onClick={handleSelectLocalAvatar}
            aria-label="选择本地图标"
          >
            {groupAvatarPreviewDisplay.image ? (
              <img src={groupAvatarPreviewDisplay.image} alt="" />
            ) : (
              groupAvatarPreviewDisplay.text
            )}
          </button>
          <button
            type="button"
            className="messages-group-avatar-local-btn"
            onClick={handleSelectLocalAvatar}
            aria-label="选择本地图标"
          >
            <CameraOutlined />
          </button>
          <input
            ref={groupAvatarFileInputRef}
            type="file"
            accept="image/*"
            className="messages-group-avatar-file-input"
            onChange={handleLocalAvatarChange}
          />
        </div>
        <div className="messages-group-avatar-config">
          <div className="messages-group-avatar-label">自定义文字</div>
          <Input
            value={groupAvatarDraft}
            onChange={(event) => setGroupAvatarDraft(event.target.value)}
            onPressEnter={handleSubmitGroupAvatar}
            maxLength={8}
            placeholder="输入头像文字，最多展示前两个字"
            autoFocus
          />
          <div className="messages-group-avatar-note">头像文字仅取自这里，最多展示前两个字。</div>
          <div className="messages-group-avatar-label messages-group-avatar-preset-title">预设头像</div>
          <div className="messages-group-avatar-preset-grid">
            {GROUP_AVATAR_PRESETS.map((preset) => {
              const active = groupAvatarPresetDraft === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`messages-group-avatar-preset ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    setGroupAvatarPresetDraft(preset.id);
                    setGroupAvatarImageDraft('');
                  }}
                  aria-label={`选择${preset.label}头像`}
                  title={preset.label}
                >
                  <span
                    className="messages-group-avatar-preset-face"
                    style={{ background: preset.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <div
      ref={moduleRef}
      className={`messages-module ${isResizingSidebar ? 'is-resizing' : ''}`}
      style={{ '--messages-sidebar-width': `${sidebarWidth}px` }}
    >
      <aside className="messages-sidebar">
        <div className="messages-sidebar-header">
          <div className="messages-sidebar-title-row">
            <div className="messages-sidebar-title">消息</div>
            <Popover
              trigger="click"
              placement="bottomRight"
              arrow={false}
              open={isCreateMenuOpen}
              onOpenChange={setIsCreateMenuOpen}
              overlayClassName="messages-create-popover"
              content={createConversationMenu}
            >
              <Button
                aria-label="新建会话"
                icon={<PlusOutlined />}
                className={`messages-sidebar-plus-btn ${isCreateMenuOpen ? 'is-open' : ''}`}
              />
            </Popover>
          </div>
        </div>
        <div
          className={`messages-conversation-list ${conversationIndicatorStyle.opacity ? 'messages-conversation-list-has-single-selection' : ''}`}
          ref={conversationListRef}
        >
          <div
            className={`messages-conversation-liquid-indicator ${conversationIndicatorStyle.opacity ? 'is-visible' : ''}`}
            style={{
              width: `${conversationIndicatorStyle.width}px`,
              height: `${conversationIndicatorStyle.height}px`,
              transform: `translate3d(${conversationIndicatorStyle.x}px, ${conversationIndicatorStyle.y}px, 0)`,
              opacity: conversationIndicatorStyle.opacity,
            }}
          />
          {conversations.length ? (
            conversations.map(renderSidebarItem)
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有匹配的会话"
              className="messages-empty"
            />
          )}
        </div>
      </aside>

      <div
        role="separator"
        aria-label="调整会话列表宽度"
        aria-orientation="vertical"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        className="messages-sidebar-resizer"
        onPointerDown={handleSidebarResizeStart}
        onKeyDown={handleSidebarResizeKeyDown}
      />

      <section className="messages-content">
        {selectedConversation ? (
          <div className="messages-thread-panel">
            {selectedConversation.type === 'topic' ? (
              activeTopicThreadPost ? (
                renderTopicThreadDetail(activeTopicThreadPost)
              ) : (
                <>
                  <header className="messages-thread-header">
                    <div className="messages-thread-header-main">
                      <div className="messages-thread-title-row">
                        <Avatar
                          size={38}
                          src={selectedConversation.avatarImage || undefined}
                          style={getAvatarStyle(selectedConversation.avatarColor)}
                        >
                          {selectedConversation.avatarText}
                        </Avatar>
                        <div>
                          <div className="messages-thread-title-line">
                            <h2>{selectedConversation.title}</h2>
                          </div>
                          <div className="messages-thread-subtitle">{selectedConversation.description}</div>
                        </div>
                      </div>
                    </div>
                    <div className="messages-thread-actions">
                      <Button type="text" shape="circle" icon={<LinkOutlined />} className="messages-icon-btn" />
                      <Button type="text" shape="circle" icon={<EllipsisOutlined />} className="messages-icon-btn" />
                    </div>
                  </header>

                  {renderTopicStream(selectedConversation)}
                </>
              )
            ) : (
              <>
                <header className="messages-thread-header">
                  <div className="messages-thread-header-main">
                    <div className="messages-thread-title-row">
                      <Avatar
                        size={38}
                        src={selectedConversation.avatarImage || undefined}
                        style={getAvatarStyle(selectedConversation.avatarColor)}
                      >
                        {selectedConversation.avatarText}
                      </Avatar>
                      <div>
                        <div className="messages-thread-title-line">
                          <h2>{selectedConversation.title}</h2>
                        </div>
                        <div className="messages-thread-subtitle">{selectedConversation.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="messages-thread-actions">
                    <Button type="text" shape="circle" icon={<LinkOutlined />} className="messages-icon-btn" />
                    <Button type="text" shape="circle" icon={<EllipsisOutlined />} className="messages-icon-btn" />
                  </div>
                </header>

                {renderChatStream(selectedConversation)}
              </>
            )}

            <footer className="messages-composer">
              <div className={`messages-composer-box ${composerExpanded ? 'is-expanded' : ''} ${formatEnabled ? 'is-format-open' : ''}`}>
                <div className="messages-composer-input-wrap">
                  <div
                    ref={composerEditorRef}
                    className="messages-composer-editor"
                    contentEditable
                    role="textbox"
                    aria-multiline="true"
                    data-placeholder={
                      formatEnabled
                        ? `${selectedMeta.placeholder} 支持加粗、列表、引用和链接`
                        : selectedMeta.placeholder
                    }
                    suppressContentEditableWarning
                    onInput={handleComposerInput}
                    onPaste={handleComposerPaste}
                  />
                  {formatEnabled ? (
                    <div className="messages-format-toolbar" role="toolbar" aria-label="文本增强工具">
                      {TEXT_FORMAT_TOOLS.map((tool) => (
                        <Tooltip key={tool.key} title={tool.title}>
                          <button
                            type="button"
                            className={`messages-format-btn messages-format-btn-${tool.key}`}
                            aria-label={tool.title}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyTextFormat(tool)}
                          >
                            {renderTextFormatIcon(tool)}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="messages-composer-toolbar">
                  <Tooltip title={formatEnabled ? '关闭文本增强' : '文本增强'}>
                    <button
                      type="button"
                      className={`messages-toolbar-btn messages-toolbar-btn-aa ${formatEnabled ? 'is-active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFormatEnabled((prev) => !prev);
                        focusComposer();
                      }}
                    >
                      <span className="messages-toolbar-aa">Aa</span>
                    </button>
                  </Tooltip>
                  <Popover content={emojiPopoverContent} trigger="click" placement="topRight" overlayClassName="messages-liquid-popover">
                    <button
                      type="button"
                      className="messages-toolbar-btn"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <SmileOutlined />
                    </button>
                  </Popover>
                  <Tooltip title="提及成员">
                    <button
                      type="button"
                      className="messages-toolbar-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertDraftText('@')}
                    >
                      <span className="messages-toolbar-at">@</span>
                    </button>
                  </Tooltip>
                  <Tooltip title="插入剪贴内容">
                    <button
                      type="button"
                      className="messages-toolbar-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertDraftText('[剪贴内容] ')}
                    >
                      <ScissorOutlined />
                    </button>
                  </Tooltip>
                  <Dropdown menu={{ items: quickInsertItems }} trigger={['click']} placement="topRight" overlayClassName="messages-liquid-dropdown">
                    <button
                      type="button"
                      className="messages-toolbar-btn"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <PlusCircleOutlined />
                    </button>
                  </Dropdown>
                  <Tooltip title={composerExpanded ? '收起输入区' : '展开输入区'}>
                    <button
                      type="button"
                      className={`messages-toolbar-btn ${composerExpanded ? 'is-active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setComposerExpanded((prev) => !prev)}
                    >
                      {composerExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    </button>
                  </Tooltip>
                  <div className="messages-send-group">
                    <Tooltip title={SEND_MODE_META[sendMode].label}>
                      <button
                        type="button"
                        className="messages-toolbar-btn messages-toolbar-send"
                        disabled={!currentDraftPlainText.trim()}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSend}
                      >
                        <SendOutlined />
                      </button>
                    </Tooltip>
                    <Dropdown menu={{ items: sendModeItems }} trigger={['click']} placement="topRight" overlayClassName="messages-liquid-dropdown">
                      <button
                        type="button"
                        className="messages-toolbar-btn messages-toolbar-caret"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <DownOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        ) : (
          <div className="messages-thread-empty">
            <Empty description="请选择左侧会话" />
          </div>
        )}
      </section>
      {groupCreateModal}
      {groupAvatarModal}
    </div>
  );
}

export default MessagesModule;
