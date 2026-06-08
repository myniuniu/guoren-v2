import { getActiveVersion, getCurrentVersion, loadFromStorage } from '../versionStore';

const DEFAULT_SCOPE_PREFIX = 'study-club-admin';
const SENIOR_CHANNEL_ID = 'senior-community';
const SENIOR_TOPIC_TITLE = '老年社区';

const OWNER_LABELS = {
  zhanghl: '林社工',
  lisi: '周宁',
  wangwu: '王医生',
};

const SECTION_KEYS = {
  discussions: 'discussions',
  groups: 'related-groups',
  workshop: 'ai-workshop',
  agent: 'ai-agent',
  inspire: 'ai-inspire',
  courses: 'courses',
  articles: 'articles',
  activities: 'activities',
};

const CHANNEL_TAG_CONFIG = {
  definitions: [
    { id: 'tag_channel_course', name: '课程', color: '#007AFF', quick: true },
    { id: 'tag_channel_article', name: '文章', color: '#34C759', quick: true },
    { id: 'tag_channel_level_1', name: '1级', color: '#FF9500', quick: true },
    { id: 'tag_channel_level_2', name: '2级', color: '#AF52DE' },
    { id: 'tag_channel_level_3', name: '3级', color: '#FF2D55' },
    { id: 'tag_channel_level_4', name: '4级', color: '#8E8E93' },
  ],
  groups: [
    {
      id: 'tag_group_channel_type',
      name: '内容类型',
      color: '#1677ff',
      tagIds: ['tag_channel_course', 'tag_channel_article'],
      exclusive: true,
    },
    {
      id: 'tag_group_channel_level',
      name: '内容级别',
      color: '#f97316',
      tagIds: ['tag_channel_level_1', 'tag_channel_level_2', 'tag_channel_level_3', 'tag_channel_level_4'],
      exclusive: true,
    },
  ],
  quickCombos: [
    { id: 'tag_combo_channel_course_1', name: '1级课程', tagIds: ['tag_channel_level_1', 'tag_channel_course'] },
    { id: 'tag_combo_channel_course_2', name: '2级课程', tagIds: ['tag_channel_level_2', 'tag_channel_course'] },
    { id: 'tag_combo_channel_course_3', name: '3级课程', tagIds: ['tag_channel_level_3', 'tag_channel_course'] },
    { id: 'tag_combo_channel_course_4', name: '4级课程', tagIds: ['tag_channel_level_4', 'tag_channel_course'] },
    { id: 'tag_combo_channel_article_1', name: '1级文章', tagIds: ['tag_channel_level_1', 'tag_channel_article'] },
    { id: 'tag_combo_channel_article_2', name: '2级文章', tagIds: ['tag_channel_level_2', 'tag_channel_article'] },
    { id: 'tag_combo_channel_article_3', name: '3级文章', tagIds: ['tag_channel_level_3', 'tag_channel_article'] },
    { id: 'tag_combo_channel_article_4', name: '4级文章', tagIds: ['tag_channel_level_4', 'tag_channel_article'] },
  ],
  legacyNameMap: {
    课程: 'tag_channel_course',
    文章: 'tag_channel_article',
    '1级': 'tag_channel_level_1',
    '2级': 'tag_channel_level_2',
    '3级': 'tag_channel_level_3',
    '4级': 'tag_channel_level_4',
  },
};

const WORKSHOP_COVERS = [
  'linear-gradient(135deg, #fff8e8 0%, #ffe8bd 100%)',
  'linear-gradient(135deg, #e9f8ef 0%, #cfeeda 100%)',
  'linear-gradient(135deg, #ebf3ff 0%, #d7e6ff 100%)',
];
const AGENT_THUMBS = [
  'linear-gradient(135deg, #fff5ea 0%, #ffd7bf 100%)',
  'linear-gradient(135deg, #eef4ff 0%, #dce7ff 100%)',
  'linear-gradient(135deg, #effaf5 0%, #d5f0df 100%)',
];
const INSPIRE_COVERS = [
  'linear-gradient(135deg, #fff6df 0%, #ffe3b0 100%)',
  'linear-gradient(135deg, #eef6ff 0%, #d8ebff 100%)',
  'linear-gradient(135deg, #f7f1ff 0%, #e3d8ff 100%)',
];
const COURSE_COVERS = [
  'linear-gradient(135deg, #fff5df 0%, #ffe0ae 100%)',
  'linear-gradient(135deg, #edf8ff 0%, #d4ebff 100%)',
  'linear-gradient(135deg, #eef5e8 0%, #dfeecf 100%)',
];
const ARTICLE_THUMBS = [
  {
    thumbType: 'doc',
    thumb1: 'linear-gradient(135deg, #fffaf0 0%, #ffefcf 100%)',
    thumb2: 'linear-gradient(135deg, #eef7ff 0%, #ddefff 100%)',
  },
  {
    thumbType: 'doc',
    thumb1: 'linear-gradient(135deg, #f6fbff 0%, #e5f1ff 100%)',
    thumb2: 'linear-gradient(135deg, #fff8ed 0%, #ffe8c2 100%)',
  },
  {
    thumbType: 'stamp',
    thumb1: 'linear-gradient(135deg, #f7f5f0 0%, #ebe5d8 100%)',
  },
];
const ACTIVITY_COVERS = [
  'linear-gradient(135deg, #fff6df 0%, #ffe4b5 100%)',
  'linear-gradient(135deg, #eef6ff 0%, #d8ebff 100%)',
  'linear-gradient(135deg, #f7efff 0%, #e0d4ff 100%)',
];
const AVATAR_COLORS = ['#ffb74d', '#66bb6a', '#42a5f5', '#7c4dff', '#ef5350'];

function createFolder(key, name, mappingKey, owner, lastEdit, extra = {}) {
  return {
    key,
    name,
    isFolder: true,
    parentKey: null,
    mappingKey,
    owner,
    lastEdit,
    ...extra,
  };
}

function createItem(key, name, type, parentKey, owner, lastEdit, meta = {}) {
  return {
    key,
    name,
    type,
    isFolder: false,
    parentKey,
    owner,
    lastEdit,
    meta,
  };
}

function displayOwner(owner) {
  return OWNER_LABELS[owner] || owner || '运营者';
}

function parseDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value.replace(/-/g, '/'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(value) {
  const parsed = parseDateTime(value);
  if (!parsed) return '刚刚';
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) return '今天';
  if (diffDays < 7) return `${diffDays}天前`;
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function formatUpdatedDesc(value) {
  const parsed = parseDateTime(value);
  if (!parsed) return '暂无更新';
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) return '今天更新';
  if (diffDays < 7) return `${diffDays}天前更新`;
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${month}月${day}日更新`;
}

function formatCompactNumber(value) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}w`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(value);
}

function getResourceEmoji(type) {
  switch (type) {
    case 'activity':
      return '🎪';
    case 'survey':
      return '📋';
    case 'vote':
      return '🗳️';
    case 'exam':
      return '📝';
    case 'register':
      return '🙋';
    default:
      return '📄';
  }
}

function splitTitle(text, width = 12) {
  if (!text) return '';
  if (text.length <= width) return text;
  const first = text.slice(0, width);
  const second = text.slice(width, width * 2);
  return second ? `${first}\n${second}` : first;
}

function buildParagraphs(title) {
  return [
    `围绕“${title}”这条内容，后台主题已同步维护到研习社老年社区频道。`,
    '当前页面展示的列表、统计和详情，都会跟随该主题发布的生效版本更新。',
    '如果需要继续完善内容，可以在后台主题里增删资料、调整名称，再通过版本发布同步到前台。',
  ];
}

function buildDiscussionPost(resource, index) {
  const meta = resource.meta || {};
  return {
    id: resource.key,
    author: meta.author || displayOwner(resource.owner),
    time: meta.time || formatRelativeTime(resource.lastEdit),
    from: meta.from || '老年社区运营后台',
    title: resource.name,
    paragraphs: meta.paragraphs || buildParagraphs(resource.name),
    replies: meta.replies || [],
    poster: meta.poster,
  };
}

function buildHotDiscussion(post, index) {
  return {
    id: `hot-${post.id}`,
    author: post.author,
    time: post.time,
    from: post.from,
    content: post.paragraphs?.[0] || post.title,
    comments: post.replies?.length ? post.replies.length : index + 2,
  };
}

function buildGroup(resource, index) {
  const meta = resource.meta || {};
  return {
    id: resource.key,
    name: resource.name,
    desc: meta.desc || `围绕“${resource.name}”形成的协作群组，可用于日常共创和案例交流。`,
    count: meta.count || formatCompactNumber(320 + index * 180),
    avatar: meta.avatar || '👥',
  };
}

function buildWorkshop(resource, index) {
  const meta = resource.meta || {};
  return {
    id: resource.key,
    author: meta.author || displayOwner(resource.owner),
    title: resource.name,
    views: meta.views || formatCompactNumber(1200 + index * 420),
    comments: meta.comments != null ? meta.comments : index + 2,
    cover: meta.cover || WORKSHOP_COVERS[index % WORKSHOP_COVERS.length],
    emoji: meta.emoji || getResourceEmoji(resource.type),
    avatarColor: meta.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
    desc: meta.desc,
    dark: meta.dark,
  };
}

function buildAgent(resource, index) {
  const meta = resource.meta || {};
  return {
    id: resource.key,
    author: meta.author || displayOwner(resource.owner),
    title: resource.name,
    desc:
      meta.desc ||
      `适用于老年社区运营场景的智能体配置，可辅助处理“${resource.name}”相关工作。`,
    stars: meta.stars != null ? meta.stars : 10 + index * 4,
    views: meta.views || formatCompactNumber(680 + index * 210),
    avatarColor: meta.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
    thumbBg: meta.thumbBg || AGENT_THUMBS[index % AGENT_THUMBS.length],
  };
}

function buildInspire(resource, index) {
  const meta = resource.meta || {};
  const detail = meta.detail || {};
  return {
    id: resource.key,
    author: meta.author || displayOwner(resource.owner),
    avatar: meta.avatar || '📝',
    avatarColor: meta.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
    time: meta.time || formatRelativeTime(resource.lastEdit),
    editTime: meta.editTime || `${formatRelativeTime(resource.lastEdit)}编辑`,
    title: resource.name,
    summary:
      meta.summary ||
      `来自老年社区后台的灵感内容，围绕“${resource.name}”沉淀了可直接复用的方法与经验。`,
    likes: meta.likes != null ? meta.likes : 6 + index * 2,
    stars: meta.stars != null ? meta.stars : 18 + index * 5,
    coverGradient: meta.coverGradient || INSPIRE_COVERS[index % INSPIRE_COVERS.length],
    coverTitle: meta.coverTitle || splitTitle(resource.name),
    coverDark: meta.coverDark || false,
    detail: {
      abstract:
        detail.abstract ||
        `这篇灵感内容来自“${resource.name}”的后台维护主题，用于沉淀可复用的适老化实践。`,
      info:
        detail.info ||
        '文章内容会随后台主题的生效版本同步，可用于复盘数字化服务方案与执行经验。',
      coreValue:
        detail.coreValue ||
        '把分散的社区经验沉淀成标准化内容，方便一线团队快速复用。',
      toc:
        detail.toc || [
          { key: `${resource.key}-toc-1`, text: '背景与问题', level: 1 },
          { key: `${resource.key}-toc-2`, text: '方案拆解', level: 1 },
          { key: `${resource.key}-toc-3`, text: '落地建议', level: 1 },
        ],
      body:
        detail.body || [
          { type: 'heading', text: '背景与问题' },
          {
            type: 'highlight',
            text: `“${resource.name}”对应的场景，通常同时涉及老人、家属和社区工作人员三类角色。`,
          },
          {
            type: 'paragraph',
            text: '后台维护时建议优先统一字段、动作和异常处理，让不同角色都能在同一条链路里完成事情。',
          },
          { type: 'heading', text: '落地建议' },
          {
            type: 'paragraph',
            text: '当主题内容发布为生效版本后，频道内的灵感内容会自动刷新，无需额外维护前台数据。',
          },
        ],
      comments:
        detail.comments || [
          {
            id: `${resource.key}-comment-1`,
            author: displayOwner(resource.owner),
            avatar: meta.avatar || '📝',
            avatarColor: meta.avatarColor || '#cfe2ff',
            text: '内容已同步到老年社区频道，可继续在后台主题里迭代。',
            time: formatRelativeTime(resource.lastEdit),
            isOp: true,
          },
        ],
    },
  };
}

function buildCourse(resource, index, channelInfo) {
  const meta = resource.meta || {};
  const detail = meta.detail || {};
  return {
    id: resource.key,
    title: resource.name,
    cover: meta.cover || COURSE_COVERS[index % COURSE_COVERS.length],
    tag: meta.tag || '银龄课堂',
    liveTag: meta.liveTag,
    chapters: meta.chapters != null ? meta.chapters : 2 + (index % 2),
    learners: meta.learners != null ? meta.learners : 18 + index * 7,
    speaker: meta.speaker || `${displayOwner(resource.owner)}实务分享`,
    detail: {
      description:
        detail.description ||
        `围绕“${resource.name}”整理的课程内容，可用于老年社区场景下的实操培训与复盘。`,
      tags: detail.tags || ['老年社区', '适老化实践', '内容维护'],
      progress: detail.progress || { current: 0, total: 2, status: '学习中' },
      toc:
        detail.toc || [
          { id: `${resource.key}-toc-1`, title: '背景导入', subtitle: '案例讲解', icon: '📝', required: true },
          { id: `${resource.key}-toc-2`, title: '操作步骤', subtitle: '实操演示', icon: '🎥', required: true },
        ],
      incentive: detail.incentive || { name: '服务积分', icon: '🏅', points: 12 + index * 3 },
      channel: {
        name: channelInfo.name,
        desc: channelInfo.desc,
        subscribers: channelInfo.subscribers,
        subscribed: true,
        cover: detail.channel?.cover || COURSE_COVERS[index % COURSE_COVERS.length],
        ...(detail.channel || {}),
      },
    },
  };
}

function buildArticle(resource, index) {
  const meta = resource.meta || {};
  const detail = meta.detail || {};
  const thumb = ARTICLE_THUMBS[index % ARTICLE_THUMBS.length];
  return {
    id: resource.key,
    title: resource.name,
    author: meta.author || displayOwner(resource.owner),
    avatar: meta.avatar || '📝',
    time: meta.time || formatRelativeTime(resource.lastEdit),
    tags: meta.tags || [
      { text: '老年社区', color: 'orange' },
      { text: '内容维护', color: 'blue' },
    ],
    summary:
      meta.summary ||
      `围绕“${resource.name}”的文章内容已由后台主题托管，适合沉淀可复用的社区实践经验。`,
    likes: meta.likes != null ? meta.likes : 8 + index * 3,
    stars: meta.stars != null ? meta.stars : 20 + index * 6,
    thumbType: meta.thumbType || thumb.thumbType,
    thumb1: meta.thumb1 || thumb.thumb1,
    thumb2: meta.thumb2 || thumb.thumb2,
    detail: {
      comments: detail.comments != null ? detail.comments : index + 2,
      favorites: detail.favorites != null ? detail.favorites : 18 + index * 8,
      desc:
        detail.desc ||
        `后台主题中的“${resource.name}”已映射到老年社区文章板块，用于持续维护可传播内容。`,
      toc:
        detail.toc || [
          { id: `${resource.key}-toc-1`, text: '内容背景', level: 1 },
          { id: `${resource.key}-toc-2`, text: '方案拆解', level: 1 },
          { id: `${resource.key}-toc-3`, text: '落地建议', level: 1 },
        ],
      body:
        detail.body || [
          {
            type: 'blockquote',
            text: `“${resource.name}”这篇内容来自老年社区后台主题。\n当前前台看到的正文、目录和统计均以生效版本为准。`,
          },
          { type: 'heading', text: '内容背景' },
          {
            type: 'paragraph',
            text: '通过主题后台维护内容，可以把讨论、课程和活动沉淀成面向前台的标准文章。',
          },
          { type: 'heading', text: '落地建议' },
          {
            type: 'list',
            items: [
              '先在后台主题整理内容结构',
              '确认版本后再发布到前台频道',
              '通过统一命名维护文章与活动的一致性',
            ],
          },
        ],
      moreWorks: detail.moreWorks || [
        { title: `${resource.name} · 模板补充`, favorites: 12 + index * 4, likes: 4 + index * 2 },
        { title: `${resource.name} · 案例复盘`, favorites: 8 + index * 3, likes: 3 + index },
      ],
    },
  };
}

function buildActivity(resource, index) {
  const meta = resource.meta || {};
  return {
    id: resource.key,
    badge: meta.badge || (resource.type === 'register' ? '报名中' : '直播'),
    liveTime: meta.liveTime,
    coverGradient: meta.coverGradient || ACTIVITY_COVERS[index % ACTIVITY_COVERS.length],
    coverTitle: meta.coverTitle || splitTitle(resource.name, 8).split('\n')[0],
    coverTitle2: meta.coverTitle2 || splitTitle(resource.name, 8).split('\n')[1] || '',
    coverDesc:
      meta.coverDesc ||
      '由后台主题统一维护活动标题、摘要和状态\n发布后自动同步到老年社区频道',
    coverEmoji: meta.coverEmoji || (resource.type === 'activity' ? '🎉' : '📺'),
    ctaText: meta.ctaText || (resource.type === 'register' ? '立即报名' : '查看详情'),
    ctaStyle: meta.ctaStyle || 'pill-blue',
    coverLight: meta.coverLight !== false,
    title: resource.name,
    summary:
      meta.summary ||
      `“${resource.name}”已纳入老年社区活动板块，由后台主题负责统一维护。`,
    status: meta.status || 'active',
    statusText: meta.statusText || (resource.type === 'register' ? '正在报名' : '即将开始'),
    date: meta.date || '以后台维护时间为准',
    hasRegister: meta.hasRegister != null ? meta.hasRegister : resource.type === 'register',
  };
}

function getLatestResourceTime(resources) {
  return resources.reduce((latest, resource) => {
    if (!latest || resource.lastEdit > latest) return resource.lastEdit;
    return latest;
  }, '');
}

function getSectionChildren(resources, mappingKey) {
  const folder = resources.find(
    (resource) => resource.isFolder && resource.parentKey === null && resource.mappingKey === mappingKey
  );
  if (!folder) return [];
  return resources
    .filter((resource) => resource.parentKey === folder.key)
    .sort((a, b) => (a.lastEdit < b.lastEdit ? 1 : -1));
}

function createSeniorCommunityAdminData() {
  const resources = [
    createFolder('senior-discussions', '讨论区帖子', SECTION_KEYS.discussions, '银龄服务组', '2026-06-06 10:30:00'),
    createFolder('senior-groups', '关联群组', SECTION_KEYS.groups, '银龄服务组', '2026-06-05 16:20:00'),
    createFolder('senior-workshop', 'AI工坊', SECTION_KEYS.workshop, '银龄服务组', '2026-06-06 15:10:00'),
    createFolder('senior-agent', 'AI合集-智能体', SECTION_KEYS.agent, '银龄服务组', '2026-06-01 10:00:00'),
    createFolder('senior-inspire', 'AI合集-灵感市集', SECTION_KEYS.inspire, '银龄服务组', '2026-06-05 18:10:00'),
    createFolder('senior-courses', '课程', SECTION_KEYS.courses, '银龄服务组', '2026-06-04 20:30:00', {
      tags: ['tag_channel_course'],
    }),
    createFolder('senior-articles', '文章', SECTION_KEYS.articles, '银龄服务组', '2026-06-04 14:30:00', {
      tags: ['tag_channel_article'],
    }),
    createFolder('senior-activities', '活动', SECTION_KEYS.activities, '银龄服务组', '2026-06-03 10:30:00'),

    createItem(
      'senior-post-1-admin',
      '想给社区长者做一个“吃药提醒 + 家属通知”小应用，大家有什么表单设计建议？',
      'file',
      'senior-discussions',
      '林社工',
      '2026-06-06 09:30:00',
      {
        author: '林社工',
        time: '1天前',
        from: '智慧助老共创群',
        paragraphs: [
          '我们现在还在用纸质登记，护理员每次回访都要再抄一次，容易漏项。',
          '准备改成飞书表单 + 自动提醒：长者确认是否已服药，异常时同步通知家属和网格员。',
          '目前最纠结的是字段要不要控制在 5 个以内，以及字号、按钮大小怎么做更友好。',
        ],
        replies: [
          { id: 'senior-reply-1', author: '周宁', text: '建议把“已服药/未服药”做成两个超大按钮，别让老人自己输入。' },
          { id: 'senior-reply-2', author: '王医生', text: '异常原因可以预设成 4 个选项，护理员补充备注即可。' },
        ],
      }
    ),
    createItem(
      'senior-post-2-admin',
      '给社区活动室做了大字版签到屏，叔叔阿姨第一次就会用了',
      'file',
      'senior-discussions',
      '周宁',
      '2026-06-05 15:10:00',
      {
        author: '周宁',
        time: '2天前',
        from: '银龄活动组织群',
        paragraphs: [
          '这次把签到页从 8 个字段减到 3 个：姓名、手机号后四位、是否需要接送。',
          '按钮高度统一到 56px，主按钮只保留“签到”和“找工作人员帮忙”两个动作。',
          '上线第一天，前台电话咨询量比上周少了三分之二。',
        ],
        replies: [
          { id: 'senior-reply-3', author: '林社工', text: '这个“找工作人员帮忙”按钮太关键了，很多老人需要心理兜底。' },
        ],
      }
    ),
    createItem(
      'senior-post-3-admin',
      '有没有适合老年大学的课程提醒模板？',
      'file',
      'senior-discussions',
      '王医生',
      '2026-06-04 18:20:00',
      {
        author: '王医生',
        time: '3天前',
        from: '社区健康随访组',
        paragraphs: [
          '我们想把慢病管理课和手机课做成固定提醒，每次上课前一天自动推送。',
          '希望家属也能收到同步提醒，避免老人忘记带药或者迟到。',
          '如果有现成模板，最好还能附带签到和课后反馈。',
        ],
      }
    ),

    createItem(
      'senior-group-1-admin',
      '智慧助老共创群',
      'file',
      'senior-groups',
      '银龄服务组',
      '2026-06-05 16:20:00',
      {
        desc: '社区工作者、养老机构运营者和数字化伙伴一起打磨银龄服务流程。',
        count: '1.2k',
        avatar: '🫶',
      }
    ),
    createItem(
      'senior-group-2-admin',
      '银龄活动组织群',
      'file',
      'senior-groups',
      '银龄服务组',
      '2026-06-04 13:20:00',
      {
        desc: '聚焦活动报名、签到、接送和志愿者排班等社区协作问题。',
        count: '860',
        avatar: '🎏',
      }
    ),

    createItem(
      'senior-workshop-1-admin',
      '长者用药提醒台账',
      'file',
      'senior-workshop',
      '陈阿姨',
      '2026-06-06 15:10:00',
      {
        author: '陈阿姨',
        views: '2.1k',
        comments: 6,
        cover: WORKSHOP_COVERS[0],
        emoji: '💊',
        avatarColor: '#ffb74d',
      }
    ),
    createItem(
      'senior-workshop-2-admin',
      '社区助餐报名表',
      'register',
      'senior-workshop',
      '周宁',
      '2026-06-05 14:40:00',
      {
        author: '周宁',
        views: '1.4k',
        comments: 3,
        cover: WORKSHOP_COVERS[1],
        emoji: '🍱',
        avatarColor: '#66bb6a',
      }
    ),
    createItem(
      'senior-workshop-3-admin',
      '探访服务排班看板',
      'activity',
      'senior-workshop',
      '王医生',
      '2026-06-04 16:30:00',
      {
        author: '王医生',
        views: '980',
        comments: 2,
        cover: WORKSHOP_COVERS[2],
        emoji: '🗓️',
        avatarColor: '#42a5f5',
      }
    ),

    createItem(
      'senior-inspire-1-admin',
      '把社区活动室做成“大字版数字前台”后，我们少接了三分之二的电话',
      'file',
      'senior-inspire',
      '周宁',
      '2026-06-05 18:10:00',
      {
        author: '周宁',
        avatar: '👩',
        avatarColor: '#ffd180',
        time: '2天前',
        editTime: '2天前编辑',
        summary: '从字体、动线到家属代办入口，复盘一次真正被长者用起来的适老化界面改造。',
        likes: 12,
        stars: 38,
        coverGradient: INSPIRE_COVERS[0],
        coverTitle: '大字版数字前台\n如何真正被用起来',
        detail: {
          abstract: '适老化不是把字放大就结束了，关键在于让长者、家属和工作人员都能在同一条服务链路里完成事情。',
          info: '本文复盘了一个街道活动室从纸质签到到大字版数字前台的改造过程。',
          coreValue: '减少现场解释和电话沟通，让长者第一次接触就能完成签到与求助。',
          toc: [
            { key: 'senior-inspire-1-s1', text: '为什么原来的流程没人愿意用', level: 1 },
            { key: 'senior-inspire-1-s2', text: '大字版设计不等于粗暴放大', level: 1 },
            { key: 'senior-inspire-1-s3', text: '上线后的变化', level: 1 },
          ],
          body: [
            { type: 'heading', text: '为什么原来的流程没人愿意用' },
            { type: 'highlight', text: '老人怕输错，家属怕流程太长，工作人员怕数据最后还要再抄一遍。' },
            { type: 'paragraph', text: '我们先把所有必须手填的内容删掉，只保留现场必须确认的三个信息，并把异常处理做成固定选项。' },
            { type: 'heading', text: '上线后的变化' },
            { type: 'paragraph', text: '活动前台电话咨询量下降了三分之二，志愿者培训时间也从半天缩短到 20 分钟。' },
          ],
          comments: [
            { id: 'senior-comment-1', author: '林社工', avatar: '👩', avatarColor: '#c5e1a5', text: '“找工作人员帮忙”这个兜底按钮非常实用，我们也准备加上。', time: '1天前', isOp: false },
            { id: 'senior-comment-2', author: '周宁', avatar: '👩', avatarColor: '#ffd180', text: '如果大家需要模版，我可以整理一版可直接复用的字段配置。', time: '1天前', isOp: true },
          ],
        },
      }
    ),

    createItem(
      'senior-course-1-admin',
      '零基础搭建长者活动报名与签到系统',
      'file',
      'senior-courses',
      '银龄服务组',
      '2026-06-04 20:30:00',
      {
        cover: COURSE_COVERS[0],
        tag: '银龄课堂',
        liveTag: '回放',
        chapters: 3,
        learners: 36,
        speaker: '街道数字化助老实务分享',
        detail: {
          description: '用大字版表单、家属代办入口和自动提醒，把社区活动报名从电话记录切到统一台账。',
          tags: ['入门级', '社区服务', '大字版设计'],
          progress: { current: 1, total: 3, status: '学习中' },
          toc: [
            { id: 'senior-course-1-1', title: '报名表单怎么减字段', subtitle: '直播回放', icon: '🎥', required: true },
            { id: 'senior-course-1-2', title: '签到与接送协同流程', subtitle: '案例拆解', icon: '🧩', required: true },
            { id: 'senior-course-1-3', title: '家属代办入口配置', subtitle: '操作指引', icon: '📄', required: false, tag: '选修' },
          ],
          incentive: { name: '服务积分', icon: '🏅', points: 18 },
        },
      }
    ),
    createItem(
      'senior-course-2-admin',
      '把社区健康巡访流程搬进表格：志愿者也能快速上手',
      'file',
      'senior-courses',
      '银龄服务组',
      '2026-06-03 17:10:00',
      {
        cover: COURSE_COVERS[1],
        tag: '实战课',
        chapters: 2,
        learners: 24,
        speaker: '社区医生 × 志愿者协同案例',
        detail: {
          description: '把血压记录、异常上报和回访提醒整合到一套轻量流程里，减少重复登记和漏项。',
          tags: ['健康服务', '流程协同', '飞书表格'],
          progress: { current: 0, total: 2, status: '学习中' },
          toc: [
            { id: 'senior-course-2-1', title: '巡访表怎么设计才不累人', subtitle: '案例讲解', icon: '📝', required: true },
            { id: 'senior-course-2-2', title: '异常提醒与家属通知', subtitle: '云文档', icon: '📄', required: true },
          ],
          incentive: { name: '飞行里程', icon: '🚀', points: 12 },
        },
      }
    ),

    createItem(
      'senior-article-1-admin',
      '老年社区数字化改造清单：从大字版到代办入口',
      'file',
      'senior-articles',
      '林社工',
      '2026-06-04 14:30:00',
      {
        author: '林社工',
        avatar: '👩',
        time: '2天前',
        tags: [
          { text: '银龄服务', color: 'orange' },
          { text: '社区运营', color: 'blue' },
        ],
        summary: '一套适合社区工作站落地的适老化清单，覆盖字体、流程、提醒和家属协同入口。',
        likes: 14,
        stars: 53,
        thumbType: 'doc',
        thumb1: ARTICLE_THUMBS[0].thumb1,
        thumb2: ARTICLE_THUMBS[0].thumb2,
        detail: {
          comments: 4,
          favorites: 53,
          desc: '把适老化从“视觉放大”扩展到“流程更少、代办更顺、通知更稳”的完整清单。',
          toc: [
            { id: 'senior-art-1-t1', text: '为什么很多适老化改造只停留在表面', level: 1 },
            { id: 'senior-art-1-t2', text: '字段和按钮怎么取舍', level: 1 },
            { id: 'senior-art-1-t3', text: '家属代办入口的设计原则', level: 1 },
          ],
          body: [
            { type: 'blockquote', text: '真正的适老化不是“看起来像为老人设计”。\n而是让老人第一次上手不害怕、遇到卡点有兜底、家属协同不需要重复解释。' },
            { type: 'heading', text: '字段和按钮怎么取舍' },
            { type: 'list', items: ['把必填字段压缩到 3-5 个', '主页面只保留 1-2 个动作按钮', '异常情况统一成固定选项'] },
            { type: 'heading', text: '家属代办入口的设计原则' },
            { type: 'paragraph', text: '家属入口不应藏在说明文字里，而要和主流程并列出现，告诉用户“自己不会也没关系”。' },
          ],
          moreWorks: [
            { title: '社区助餐报名页优化记录', favorites: 28, likes: 9 },
            { title: '适老化问卷模板 1.0', favorites: 17, likes: 6 },
          ],
        },
      }
    ),
    createItem(
      'senior-article-2-admin',
      '如何让志愿者 20 分钟内学会一套社区探访流程',
      'file',
      'senior-articles',
      '王医生',
      '2026-06-03 11:20:00',
      {
        author: '王医生',
        avatar: '🧑‍⚕️',
        time: '4天前',
        tags: [
          { text: '志愿服务', color: 'orange' },
          { text: '流程设计', color: 'blue' },
        ],
        summary: '把培训、巡访记录和异常反馈拆成三个动作后，新志愿者上手时间大幅缩短。',
        likes: 9,
        stars: 31,
        thumbType: 'doc',
        thumb1: ARTICLE_THUMBS[1].thumb1,
        thumb2: ARTICLE_THUMBS[1].thumb2,
        detail: {
          comments: 2,
          favorites: 31,
          desc: '把志愿者培训目标从“记住全部流程”改成“记住三个关键动作”，显著降低了协作门槛。',
          toc: [
            { id: 'senior-art-2-t1', text: '培训为什么总是越讲越复杂', level: 1 },
            { id: 'senior-art-2-t2', text: '三个关键动作拆解', level: 1 },
            { id: 'senior-art-2-t3', text: '异常上报的最小闭环', level: 1 },
          ],
          body: [
            { type: 'blockquote', text: '不是每个志愿者都要成为系统专家。\n他们只需要在现场知道下一步做什么、出了问题找谁。' },
            { type: 'heading', text: '三个关键动作拆解' },
            { type: 'list', items: ['到达后先确认状态', '异常只走一个上报入口', '结束后自动生成回访记录'] },
            { type: 'paragraph', text: '把培训材料也改成一页纸之后，志愿者更愿意在出发前快速复习，而不是翻一大段操作说明。' },
          ],
          moreWorks: [
            { title: '异常上报一页纸指南', favorites: 13, likes: 4 },
            { title: '社区巡访记录模板', favorites: 22, likes: 7 },
          ],
        },
      }
    ),

    createItem(
      'senior-activity-1-admin',
      '银龄服务共创营：3 周做出一个社区助老小工具',
      'register',
      'senior-activities',
      '银龄服务组',
      '2026-06-03 10:30:00',
      {
        badge: '报名中',
        coverGradient: ACTIVITY_COVERS[0],
        coverTitle: '银龄服务共创营',
        coverTitle2: '一起打磨\n适老化服务体验',
        coverDesc: '社区工作者、志愿者和产品伙伴\n共建智慧助老样板',
        coverEmoji: '🤝',
        ctaText: '立即报名',
        ctaStyle: 'pill-blue-solid',
        title: '银龄服务共创营：3 周做出一个社区助老小工具',
        summary: '围绕活动报名、上门探访、健康提醒等场景，产出可直接复用的轻量模板。',
        status: 'active',
        statusText: '正在报名',
        date: '6月12日–7月3日',
        hasRegister: true,
      }
    ),
    createItem(
      'senior-activity-2-admin',
      '适老化表单公开课：第一次点击就懂',
      'activity',
      'senior-activities',
      '银龄服务组',
      '2026-06-02 19:30:00',
      {
        badge: '直播',
        liveTime: '2026年6月18日 19:30',
        coverGradient: ACTIVITY_COVERS[1],
        coverTitle: '大字版设计公开课',
        coverTitle2: '让叔叔阿姨\n第一次就会用',
        coverDesc: '拆解按钮、文案、流程顺序\n和家属协同入口',
        coverEmoji: '📺',
        ctaText: '预约直播',
        ctaStyle: 'pill-blue',
        title: '适老化表单公开课：第一次点击就懂',
        summary: '用真实社区案例讲清楚什么是“看得见、点得着、记得住”的数字化服务。',
        status: 'active',
        statusText: '即将开始',
        date: '6月18日 19:30–20:30',
      }
    ),
  ];

  return {
    versions: [
      {
        id: 'v1',
        name: '版本 1',
        status: 'active',
        createdAt: '2026-06-01 09:00:00',
        publishedAt: '2026-06-01 09:00:00',
        resources,
        tagDefinitions: CHANNEL_TAG_CONFIG.definitions,
        tagGroups: CHANNEL_TAG_CONFIG.groups,
        assessment: { totalHours: 0, passScore: 60, certificate: false, rules: [] },
        assessmentChat: [],
      },
    ],
    currentVersionId: 'v1',
  };
}

const CHANNEL_ADMIN_CONFIGS = {
  [SENIOR_CHANNEL_ID]: {
    channelId: SENIOR_CHANNEL_ID,
    topicTitle: SENIOR_TOPIC_TITLE,
    storageScopeKey: `${DEFAULT_SCOPE_PREFIX}:${SENIOR_CHANNEL_ID}`,
    description: '围绕智慧助老、康养服务和社区陪伴的银龄共创空间',
    operator: { name: '银龄服务组', avatar: '👵' },
    coverEmoji: '👵',
    tagConfig: CHANNEL_TAG_CONFIG,
    initialDataFactory: createSeniorCommunityAdminData,
  },
};

function getChannelAdminConfig(channelId) {
  return CHANNEL_ADMIN_CONFIGS[channelId] || null;
}

function getChannelAdminVersion(channelId) {
  const config = getChannelAdminConfig(channelId);
  if (!config) return null;
  const data = loadFromStorage({
    scopeKey: config.storageScopeKey,
    initialData: config.initialDataFactory,
  });
  return {
    config,
    version: getActiveVersion(data) || getCurrentVersion(data),
  };
}

function buildMappedChannelPayload(channelId, fallbackChannel = {}, fallbackDetail = {}) {
  const resolved = getChannelAdminVersion(channelId);
  if (!resolved || !resolved.version) return null;

  const { config, version } = resolved;
  const resources = version.resources || [];
  const discussions = getSectionChildren(resources, SECTION_KEYS.discussions).map(buildDiscussionPost);
  const relatedGroups = getSectionChildren(resources, SECTION_KEYS.groups).map(buildGroup);
  const workshopItems = getSectionChildren(resources, SECTION_KEYS.workshop).map(buildWorkshop);
  const agentItems = getSectionChildren(resources, SECTION_KEYS.agent).map(buildAgent);
  const inspireItems = getSectionChildren(resources, SECTION_KEYS.inspire).map(buildInspire);
  const channelInfo = {
    name: fallbackDetail.title || config.topicTitle,
    desc: fallbackDetail.description || config.description,
    subscribers: fallbackChannel.subscribers || fallbackDetail.subscribers || 0,
  };
  const courses = getSectionChildren(resources, SECTION_KEYS.courses).map((resource, index) =>
    buildCourse(resource, index, channelInfo)
  );
  const articles = getSectionChildren(resources, SECTION_KEYS.articles).map(buildArticle);
  const activities = getSectionChildren(resources, SECTION_KEYS.activities).map(buildActivity);
  const mappedResources = [
    ...getSectionChildren(resources, SECTION_KEYS.discussions),
    ...getSectionChildren(resources, SECTION_KEYS.groups),
    ...getSectionChildren(resources, SECTION_KEYS.workshop),
    ...getSectionChildren(resources, SECTION_KEYS.agent),
    ...getSectionChildren(resources, SECTION_KEYS.inspire),
    ...getSectionChildren(resources, SECTION_KEYS.courses),
    ...getSectionChildren(resources, SECTION_KEYS.articles),
    ...getSectionChildren(resources, SECTION_KEYS.activities),
  ];
  const latestEdit = getLatestResourceTime(mappedResources);
  const hotDiscussions = discussions.slice(0, 3).map(buildHotDiscussion);
  const aiSetCount = workshopItems.length + agentItems.length + inspireItems.length;
  const aiSetCategories = [];
  if (workshopItems.length) aiSetCategories.push({ key: 'workshop', label: 'AI 工坊' });
  if (agentItems.length) aiSetCategories.push({ key: 'agent', label: '智能体' });
  if (inspireItems.length) aiSetCategories.push({ key: 'inspire', label: '灵感市集' });

  return {
    id: channelId,
    title: fallbackDetail.title || config.topicTitle,
    titleSecond: fallbackDetail.titleSecond,
    description: fallbackDetail.description || config.description,
    operator: fallbackDetail.operator || config.operator,
    coverEmoji: fallbackDetail.coverEmoji || config.coverEmoji,
    contentCount: mappedResources.length,
    updatedDesc: formatUpdatedDesc(latestEdit),
    tabs: [
      { key: 'home', label: '首页' },
      { key: 'discuss', label: '讨论区', count: discussions.length },
      { key: 'ai-set', label: 'AI 合集', count: aiSetCount },
      { key: 'course', label: '课程', count: courses.length },
      { key: 'article', label: '文章', count: articles.length },
      { key: 'activity', label: '活动', count: activities.length },
    ],
    hotDiscussions,
    discussions,
    relatedGroups,
    aiWorkshop: workshopItems,
    courses,
    articles,
    activities,
    aiSet: {
      categories: aiSetCategories,
      items: {
        workshop: workshopItems,
        agent: agentItems,
        inspire: inspireItems,
      },
    },
  };
}

export function getTopicAdminConfig(topicTitle) {
  const config = Object.values(CHANNEL_ADMIN_CONFIGS).find(
    (item) => item.topicTitle === topicTitle
  );
  if (!config) return null;
  return {
    storageScopeKey: config.storageScopeKey,
    initialDataFactory: config.initialDataFactory,
    channelId: config.channelId,
    topicTitle: config.topicTitle,
    tagConfig: config.tagConfig || null,
  };
}

export function getMappedChannelSummary(channelId, fallbackChannel = {}) {
  const mapped = buildMappedChannelPayload(channelId, fallbackChannel, {});
  if (!mapped) return null;
  return {
    contentCount: mapped.contentCount,
    updatedDesc: mapped.updatedDesc,
  };
}

export function getMappedChannelDetail(channelId, fallbackChannel = {}, fallbackDetail = {}) {
  const mapped = buildMappedChannelPayload(channelId, fallbackChannel, fallbackDetail);
  if (!mapped) return null;
  return {
    ...fallbackDetail,
    ...mapped,
  };
}
