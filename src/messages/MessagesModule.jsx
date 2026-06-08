import { useRef, useState } from 'react';
import { Avatar, Badge, Button, Dropdown, Empty, Input, Popover, Tooltip } from 'antd';
import {
  DownOutlined,
  EllipsisOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LinkOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  PushpinFilled,
  ScissorOutlined,
  SendOutlined,
  SmileOutlined,
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
        author: '代言君',
        authorRole: '话题发起人',
        time: '6月8日 09:28',
        title: '代码部·听海轩',
        content:
          '作为 LangChain Ambassador，听海轩分享了 LangChain 六大社区会议、信息量拆解和 AI 大模型趋势的一些观察，方便后续整理成专题卡。',
      },
      {
        id: 'post-2',
        author: '司 玥',
        authorRole: '参与者',
        time: '6月8日 14:21',
        content:
          '分享一篇文章，大家对视频 coding 下面这句提问印象很深：速度管理型的人际交流其实更像是信息编排。',
        linkCard: {
          domain: 'mp.weixin.qq.com',
          title: '乔布斯Boss聊“你在 Vibe Coding 时遇到卡住怎么办？”',
          desc: '从 Prompt、架构拆解到反馈闭环，适合拿来做团队内部共识讨论。',
        },
      },
      {
        id: 'post-3',
        author: '地方九',
        authorRole: '参与者',
        time: '6月8日 09:40',
        title: '关于 LangChain VIP 和代码部的补充',
        content:
          'Managed Deep Agents、Subagent CLI、MCP 服务编排和 Code Interpreter 都值得做一轮梳理。尤其是多 Agent 协同时，默认无损优先级、权限模型和上下文隔离，后续可以单独拉清单。',
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
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [formatEnabled, setFormatEnabled] = useState(false);
  const [sendMode, setSendMode] = useState('normal');
  const composerInputRef = useRef(null);

  const selectedConversation =
    conversations.find((item) => item.id === selectedId) || conversations[0] || null;
  const selectedMeta = selectedConversation ? TYPE_META[selectedConversation.type] : null;
  const activeConversationId = selectedConversation?.id || '';
  const currentDraft = drafts[activeConversationId] || '';

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

  const handleSend = () => {
    const text = currentDraft.trim();
    if (!selectedConversation || !text) {
      return;
    }

    const outgoingText = normalizedOutgoingText(text);
    const updatedTime = getTimeLabel();
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
              time: '刚刚',
              content: outgoingText,
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
        onClick={() => setSelectedId(item.id)}
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
        <article key={post.id} className="messages-topic-card">
          <div className="messages-topic-card-header">
            <div className="messages-topic-card-author">
              <Avatar size={30} style={getAvatarStyle(conversation.avatarColor)}>
                {post.author.slice(0, 1)}
              </Avatar>
              <div>
                <div className="messages-topic-card-author-row">
                  <span className="messages-topic-card-author-name">{post.author}</span>
                  {post.authorRole ? (
                    <span className="messages-topic-card-role">{post.authorRole}</span>
                  ) : null}
                </div>
                <div className="messages-topic-card-time">{post.time}</div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<EllipsisOutlined />} className="messages-icon-btn" />
          </div>
          {post.title ? <div className="messages-topic-card-title">{post.title}</div> : null}
          <div className="messages-topic-card-content">{post.content}</div>
          {post.linkCard ? (
            <div className="messages-link-card">
              <div className="messages-link-card-domain">{post.linkCard.domain}</div>
              <div className="messages-link-card-title">{post.linkCard.title}</div>
              <div className="messages-link-card-desc">{post.linkCard.desc}</div>
            </div>
          ) : null}
          <div className="messages-topic-card-actions">
            <span>评论</span>
            <span>转发</span>
            <span>收藏</span>
          </div>
        </article>
      ))}
    </div>
  );

  const renderChatStream = (conversation) => (
    <div className="messages-chat-stream">
      {(conversation.messages || []).map((message) => (
        <div
          key={message.id}
          className={`messages-chat-row ${message.self ? 'is-self' : ''}`}
        >
          {!message.self ? (
            <Avatar size={30} style={getAvatarStyle(conversation.avatarColor)}>
              {message.sender.slice(0, 1)}
            </Avatar>
          ) : null}
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
    <div className="messages-module">
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

      <section className="messages-content">
        {selectedConversation ? (
          <div className="messages-thread-panel">
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

            {selectedConversation.type === 'topic'
              ? renderTopicStream(selectedConversation)
              : renderChatStream(selectedConversation)}

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
