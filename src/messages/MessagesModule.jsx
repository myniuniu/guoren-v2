import { useEffect, useRef, useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Empty, Input, Popover, Tooltip } from 'antd';
import {
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
  SendOutlined,
  ShareAltOutlined,
  SmileOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
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

const DEFAULT_SIDEBAR_WIDTH = 360;
const MIN_SIDEBAR_WIDTH = 248;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_THREAD_WIDTH = 420;
const SIDEBAR_KEYBOARD_STEP = 16;

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
    unread: 2,
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
    unread: 5,
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

function MessagesModule() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState('topic-genai');
  const [drafts, setDrafts] = useState({});
  const [expandedTopicPosts, setExpandedTopicPosts] = useState({});
  const [activeTopicThread, setActiveTopicThread] = useState(null);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [formatEnabled, setFormatEnabled] = useState(false);
  const [sendMode, setSendMode] = useState('normal');
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const moduleRef = useRef(null);
  const composerInputRef = useRef(null);
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

  const getClampedSidebarWidth = (nextWidth) => {
    return clampSidebarWidth(nextWidth, moduleRef.current?.clientWidth || 0);
  };

  const adjustSidebarWidth = (delta) => {
    setSidebarWidth((prev) => getClampedSidebarWidth(prev + delta));
  };

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

  const handleDraftChange = (value) => {
    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: value,
    }));
  };

  const focusComposer = () => {
    const nativeTextArea = composerInputRef.current?.resizableTextArea?.textArea;
    nativeTextArea?.focus();
  };

  const insertDraftText = (snippet) => {
    const nativeTextArea = composerInputRef.current?.resizableTextArea?.textArea;
    if (!nativeTextArea) {
      handleDraftChange(`${currentDraft}${snippet}`);
      return;
    }

    const start = nativeTextArea.selectionStart ?? currentDraft.length;
    const end = nativeTextArea.selectionEnd ?? currentDraft.length;
    const nextValue = `${currentDraft.slice(0, start)}${snippet}${currentDraft.slice(end)}`;
    handleDraftChange(nextValue);

    requestAnimationFrame(() => {
      const textArea = composerInputRef.current?.resizableTextArea?.textArea;
      if (!textArea) {
        return;
      }
      const nextCursor = start + snippet.length;
      textArea.focus();
      textArea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const normalizedOutgoingText = (text) => {
    const prefix = SEND_MODE_META[sendMode]?.prefix;
    return prefix ? `${prefix}${text}` : text;
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
    setSelectedId(conversationId);
    setActiveTopicThread(null);
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
    const text = currentDraft.trim();
    if (!selectedConversation || !text) {
      return;
    }

    const outgoingText = normalizedOutgoingText(text);
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
              contentSections: outgoingText.split(/\n{2,}/).filter(Boolean),
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
            },
          ],
        };

      return [updatedConversation, ...prev.filter((item) => item.id !== target.id)];
    });

    setDrafts((prev) => ({
      ...prev,
      [activeConversationId]: '',
    }));
    setSelectedId(selectedConversation.id);
  };

  const renderSidebarItem = (item) => {
    return (
      <button
        key={item.id}
        type="button"
        className={`messages-conversation-item ${activeConversationId === item.id ? 'is-active' : ''}`}
        onClick={() => handleConversationSelect(item.id)}
      >
        <div className="messages-conversation-avatar-wrap">
          <Avatar size={36} style={getAvatarStyle(item.avatarColor)}>
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
                {section}
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
                  <div className="messages-topic-detail-comment-text">{comment.text}</div>
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
            <div className="messages-chat-bubble">{message.content}</div>
          </div>
        </div>
      ))}
    </div>
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
            <Button type="primary" shape="circle" icon={<PlusOutlined />} className="messages-sidebar-plus-btn" />
          </div>
        </div>
        <div className="messages-conversation-list">
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
                        <Avatar size={38} style={getAvatarStyle(selectedConversation.avatarColor)}>
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
                      <Avatar size={38} style={getAvatarStyle(selectedConversation.avatarColor)}>
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
              <div className={`messages-composer-box ${composerExpanded ? 'is-expanded' : ''}`}>
                <Input.TextArea
                  ref={composerInputRef}
                  autoSize={composerExpanded ? { minRows: 4, maxRows: 8 } : { minRows: 1, maxRows: 4 }}
                  value={currentDraft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder={
                    formatEnabled
                      ? `${selectedMeta.placeholder} 支持表情、@提及和快捷模板`
                      : selectedMeta.placeholder
                  }
                  className="messages-composer-input"
                />
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
                  <Popover content={emojiPopoverContent} trigger="click" placement="topRight">
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
                  <Dropdown menu={{ items: quickInsertItems }} trigger={['click']} placement="topRight">
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
                        disabled={!currentDraft.trim()}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleSend}
                      >
                        <SendOutlined />
                      </button>
                    </Tooltip>
                    <Dropdown menu={{ items: sendModeItems }} trigger={['click']} placement="topRight">
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
    </div>
  );
}

export default MessagesModule;
