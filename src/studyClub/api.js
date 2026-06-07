const STORAGE_KEY = 'guoren_study_club_subscriptions';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const STUDY_CLUB_TABS = [{key:`home`,label:`首页`},{key:`playground`,label:`AI游乐园`},{key:`course`,label:`课程`},{key:`knowledge`,label:`知识`},{key:`template`,label:`模板`},{key:`channel`,label:`频道`},{key:`vip`,label:`AI 会员`,tag:`Pro+`},{key:`activity`,label:`活动`}];

const MOCK_CHANNELS_DATA = [
  {
    id: 'senior-community',
    title: '老年社区',
    contentCount: 46,
    updatedDesc: '1 天前更新',
    subscribers: 12800,
    subscribersText: '1.3万',
    accent: 'mint',
    badge: '👵',
    highlighted: !0,
    tags: ['银龄友好'],
  },
  {
    id: 'family-education',
    title: '家庭教育社区',
    contentCount: 52,
    updatedDesc: '今天更新',
    subscribers: 18600,
    subscribersText: '1.9万',
    accent: 'violet',
    badge: '🏠',
    highlighted: !0,
    tags: ['家校共育'],
  },
];

const MOCK_PLAYGROUND_ITEMS = {
  workshop: [
    {
      id: 'play-workshop-1',
      author: '陈阿姨',
      title: '长者用药提醒台账',
      views: '2.1k',
      comments: 6,
      cover: 'linear-gradient(135deg, #fff8e8 0%, #ffe8bd 100%)',
      emoji: '💊',
      avatarColor: '#ffb74d',
    },
    {
      id: 'play-workshop-2',
      author: '周老师',
      title: '亲子阅读打卡助手',
      views: '3.6k',
      comments: 9,
      cover: 'linear-gradient(135deg, #eef4ff 0%, #dbe8ff 100%)',
      emoji: '📚',
      avatarColor: '#5c6bc0',
    },
    {
      id: 'play-workshop-3',
      author: '王医生',
      title: '探访服务排班看板',
      views: '980',
      comments: 2,
      cover: 'linear-gradient(135deg, #ebf3ff 0%, #d7e6ff 100%)',
      emoji: '🗓️',
      avatarColor: '#42a5f5',
    },
    {
      id: 'play-workshop-4',
      author: '李老师',
      title: '家校沟通周报生成器',
      views: '2.7k',
      comments: 5,
      cover: 'linear-gradient(135deg, #fff3e8 0%, #ffd9bf 100%)',
      emoji: '✉️',
      avatarColor: '#ff8a65',
    },
  ],
  agent: [
    {
      id: 'play-agent-1',
      author: '周老师',
      title: '家庭会议主持助手',
      desc: '帮助家长拆解沟通议题、生成家庭会议提纲，并给出适龄表达建议。',
      stars: 42,
      views: '2.9k',
      avatarColor: '#7c4dff',
      thumbBg: 'linear-gradient(135deg, #f2ebff 0%, #e4d6ff 100%)',
    },
    {
      id: 'play-agent-2',
      author: '王医生',
      title: '长者照护提醒官',
      desc: '针对吃药、复诊、探访和异常上报提供适老化提醒模板。',
      stars: 37,
      views: '2.2k',
      avatarColor: '#26a69a',
      thumbBg: 'linear-gradient(135deg, #e7faf3 0%, #cfeede 100%)',
    },
    {
      id: 'play-agent-3',
      author: '林社工',
      title: '社区活动协调员',
      desc: '为报名、签到、接送和志愿者排班生成可执行流程。',
      stars: 28,
      views: '1.5k',
      avatarColor: '#42a5f5',
      thumbBg: 'linear-gradient(135deg, #eaf4ff 0%, #d6e7ff 100%)',
    },
    {
      id: 'play-agent-4',
      author: '李老师',
      title: '作业陪伴教练',
      desc: '把家庭辅导拆解成鼓励、提问和复盘三步，减少亲子对抗。',
      stars: 56,
      views: '4.1k',
      avatarColor: '#ff7043',
      thumbBg: 'linear-gradient(135deg, #fff0e8 0%, #ffd8c8 100%)',
    },
  ],
  inspire: [
    {
      id: 'play-inspire-1',
      author: '周宁',
      avatar: '👩',
      avatarColor: '#ffd180',
      time: '2天前',
      title: '把社区活动室做成大字版数字前台后，我们少接了三分之二的电话',
      summary: '从字体、动线到代办入口，复盘一次真正被长者用起来的适老化改造。',
      likes: 12,
      stars: 38,
      coverGradient: 'linear-gradient(135deg, #fff6df 0%, #ffe3b0 100%)',
      coverTitle: '大字版数字前台\n如何真正被用起来',
      coverDark: !1,
    },
    {
      id: 'play-inspire-2',
      author: '周老师',
      avatar: '👩‍🏫',
      avatarColor: '#c5cae9',
      time: '1天前',
      title: '让家庭作业不再变成争吵：一次家校共育表单改造记录',
      summary: '把打卡、反馈和老师建议放进一个轻量闭环后，家长配合度和孩子完成率都明显提升。',
      likes: 18,
      stars: 45,
      coverGradient: 'linear-gradient(135deg, #eef2ff 0%, #dfe7ff 100%)',
      coverTitle: '家庭作业不再争吵\n家校表单改造记录',
      coverDark: !1,
    },
  ],
};

const MOCK_CHANNEL_DETAILS = {"super-individual":{id:`super-individual`,title:`超级个体`,titleSecond:`空间站`,description:`一人进化成一支队伍的数字补给舱`,operator:{name:`徐佳倩`,avatar:`👩`},coverEmoji:`👨‍🚀`,tabs:[{key:`home`,label:`首页`},{key:`discuss`,label:`讨论区`,count:3},{key:`ai-set`,label:`AI 合集`,count:21},{key:`course`,label:`课程`,count:2},{key:`article`,label:`文章`,count:2},{key:`activity`,label:`活动`,count:7}],hotDiscussions:[{id:`d1`,author:`王子瑜`,time:`5天前`,from:`AI Builder实践加速营`,content:`🍱「AI 开放麦」首期直播 来啦！98 年餐饮外贸人，花 2000 块用妙搭干了别人 3 万开发费的活。他的工具折腾路线：WPS → 飞书多维表格 → 妙搭最终用妙搭搭出一套完整外贸应用，再配合 AI 处理国际贸易文件 —— 技术描…`,comments:6},{id:`d2`,author:`王子瑜`,time:`3天前`,from:`AI Builder实践加速营`,content:`「AI 开放麦」第二期来啦！听说本期干货满满～直播主题：1 人 2 周从 0 搭建，用妙搭造出产品验货系统特邀嘉宾：陆炜烨（广东美西科技有限公司–产品企划）还在为验货流程混乱、人工判定出错、单据整理头大？他原本分…`,comments:2},{id:`d3`,author:`徐佳倩`,time:`3天前`,from:`AI Builder实践加速营`,content:`请收下这张飞书 AI Builder Demo Day 邀请函🎫  5/22 周五 11:00-12:00｜线上研讨会🎙 产品能力介绍：官方产品团队带来飞书 AI Builder 介绍，重点不是"功能罗列"，而是这些能力如何…`,comments:0}],discussions:[{id:`p1`,author:`王子瑜`,time:`5天前`,from:`AI Builder实践加速营`,title:`🍱「AI 开放麦」首期直播 来袭！`,paragraphs:[`98 年餐饮外贸人，花 2000 块用妙搭干了别人 3 万开发费的活。`,`他的工具折腾路线：WPS → 飞书多维表格 → 妙搭`,`最终用妙搭搭出一套完整外贸应用，再配合 AI 处理国际贸易文件 —— 技术描述、合同核对、原产地证，做完扔给 AI 检查，自己终审即可。`,`结果：开发成本和工作时间省了至少 70%。`,`他说："工具没有最好的，只有适不适合的。"`,`扫码预约直播，听一个真实用户怎么借助 Vibe Coding 把外贸全流程跑通 👇`],poster:{gradient:`linear-gradient(135deg, #e9efff 0%, #d3e1ff 100%)`,titleLines:[`从多维表格到应用开发，`,`用妙搭和 AI 重构餐饮外贸工作流`],tag:`AI 开放麦｜直播`,guest:`纪云鹏`,guestDesc:`河北风好餐饮管理有限公司 · 运营经理`,metric:`70%`,metricDesc:`开发成本 & 工作时间`},replies:[{id:`r1`,author:`徐佳倩`,text:`哇哦，大期待！`},{id:`r2`,author:`徐徐`,text:`听说已经在用妙搭接单了，太强了[赞]`},{id:`r3`,author:`王子瑜`,text:`@徐佳倩 活动还预留了互动时间！欢迎大家一起来交流自己的场景、痛点或疑问哦～`}]},{id:`p2`,author:`王子瑜`,time:`3天前`,from:`AI Builder实践加速营`,title:`「AI 开放麦」第二期来啦！听说本期干货满满～`,paragraphs:[`直播主题：1 人 2 周从 0 搭建，用妙搭造出产品验货系统`,`特邀嘉宾：陆炜烨（广东美西科技有限公司–产品企划）`,`还在为验货流程混乱、人工判定出错、单据整理头大？这期直播会带你看到一个产品人怎么用妙搭 × AI 在两周内从 0 到 1 打造出一套可落地的验货系统。`],replies:[]},{id:`p3`,author:`徐佳倩`,time:`3天前`,from:`AI Builder实践加速营`,title:`请收下这张飞书 AI Builder Demo Day 邀请函🎫`,paragraphs:[`5/22 周五 11:00-12:00｜线上研讨会🎙`,`产品能力介绍：官方产品团队带来飞书 AI Builder 介绍，重点不是"功能罗列"，而是这些能力如何在企业场景中落地。`],replies:[]}],relatedGroups:[{id:`g1`,name:`AI Builder实践加速营`,desc:`AI 时代，真正的价值属于实践者。本群专注分享 AI 赋能业务的最佳实…`,count:-1,avatar:`🌌`}],aiSet:{categories:[{key:`workshop`,label:`AI 工坊`},{key:`agent`,label:`智能体`},{key:`inspire`,label:`灵感市集`}],items:{workshop:[{id:`a1`,author:`赵生刚`,title:`多组织下的人力资源管理系统`,views:`396`,comments:1,cover:`linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)`,emoji:`📊`,avatarColor:`#4fc3f7`},{id:`a2`,author:`王子瑜`,title:`将图片转为"潦草"手绘风格`,views:`1.4k`,comments:0,cover:`linear-gradient(135deg, #fff8e6 0%, #fff0c2 100%)`,emoji:`🐱`,avatarColor:`#66bb6a`},{id:`a3`,author:`Leo`,title:`【技能】AI 短视频脚本生成器`,views:`5.7k`,comments:11,cover:`linear-gradient(135deg, #1a1f3a 0%, #3a2860 100%)`,emoji:`��`,dark:!0,avatarColor:`#ab47bc`},{id:`a4`,author:`华芮`,title:`【技能】— skill 永逸`,views:`5.8k`,comments:1,cover:`linear-gradient(135deg, #0d1124 0%, #1f2540 100%)`,emoji:`✨`,dark:!0,avatarColor:`#ef5350`},{id:`a5`,author:`影视飓风`,title:`【技能】项目导演日记`,views:`4.0k`,comments:0,cover:`linear-gradient(135deg, #f1f5ff 0%, #d6e0ff 100%)`,emoji:`🎬`,avatarColor:`#26a69a`,desc:`影视飓风同款项目管理工作流——说“记录一下”沉淀拍摄日志，说“复盘一下”自动生成阶段总结，让每一条现场笔记都不再丢失。`},{id:`a6`,author:`胡元奇`,title:`【技能】周报生成技能`,views:`3.4k`,comments:1,cover:`linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)`,emoji:`📝`,avatarColor:`#42a5f5`},{id:`a7`,author:`影视飓风`,title:`提词器【影视飓风同款】`,views:`7.2k`,comments:4,cover:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,emoji:`🎤`,dark:!0,avatarColor:`#26a69a`},{id:`a8`,author:`CHONG JIA...`,title:`维生素评估工具`,views:`219`,comments:0,cover:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`,emoji:`💊`,avatarColor:`#ff7043`},{id:`a9`,author:`宋利强`,title:`【技能】SKILL需求分析`,views:`2.3k`,comments:0,cover:`linear-gradient(135deg, #f1f5ff 0%, #dde6ff 100%)`,emoji:`📊`,avatarColor:`#5c6bc0`},{id:`a10`,author:`孔家锐`,title:`人员分布世界地图`,views:`193`,comments:0,cover:`linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`,emoji:`🌍`,avatarColor:`#66bb6a`},{id:`a11`,author:`陈刚`,title:`【技能】班味清零师`,views:`787`,comments:0,cover:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`,emoji:`😌`,avatarColor:`#ef5350`,desc:`专为被工作掏空、浑身班味的职场人打造的专属松弛陪伴搭子。用于帮用户快速剥离上班的紧绷状态，彻底消解职场负面情绪（疲惫、焦虑、内耗、烦躁、委屈、愤怒等），10...`},{id:`a12`,author:`蒋斌`,title:`【技能】Seedance2.0-Shot...`,views:`723`,comments:0,cover:`linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`,emoji:`🎮`,dark:!0,avatarColor:`#26c6da`},{id:`a13`,author:`王梦泽`,title:`【技能】风水大师：分析次日...`,views:`2.9k`,comments:0,cover:`linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)`,emoji:`🧭`,avatarColor:`#8d6e63`},{id:`a14`,author:`王子瑜`,title:`飓风同款 AI 生产力工具落地...`,views:`621`,comments:0,cover:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`,emoji:`🚀`,avatarColor:`#66bb6a`},{id:`a15`,author:`庄工`,title:`【技能】需求文档PRD编写技能`,views:`423`,comments:2,cover:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`,emoji:`📝`,avatarColor:`#78909c`},{id:`a16`,author:`华芮`,title:`【技能】赋能Token`,views:`755`,comments:0,cover:`linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%)`,emoji:`🔑`,avatarColor:`#ef5350`,desc:`专为被工作掏空、浑身班味的职场人打造的专属松弛陪伴搭子。用于帮用户快速剥离上班的紧绷状态，彻底消解职场负面情绪（疲惫、焦虑、内耗、烦躁、委屈、愤怒等），10...`}],agent:[{id:`b1`,author:`徐佳倩`,title:`创新产品设计专家`,desc:`你是一位产品创新设计师，擅长消费品概念开发和用户体验设计。请基于【...`,stars:17,views:`1155`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%)`},{id:`b2`,author:`王子瑜`,title:`vibe coding 必备的资深 UI 设计师`,desc:`角色设定 你是一位顶级的 Frontend Design Engineer (Vibe Coding 专家)...`,stars:13,views:`885`,avatarColor:`#ff7043`,thumbBg:`linear-gradient(135deg, #ffe8e0 0%, #ffd4c4 100%)`},{id:`b3`,author:`徐舒楠`,title:`《凡人修仙传》灵根测试`,desc:`###角色 你是《凡人修仙传》世界观中的灵根测试师，需根据用户提供的姓名、...`,stars:28,views:`6025`,avatarColor:`#42a5f5`,thumbBg:`linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`},{id:`b4`,author:`徐佳倩`,title:`资深品牌战略专家`,desc:`你是一位资深品牌战略专家，精通品牌定位和营销传播。请为一个有【15年历...`,stars:17,views:`804`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)`},{id:`b5`,author:`武玥`,title:`自拍秒变【职场形象照】`,desc:`角色 (Persona) 你是一个名【AI形象管家】的智能代理，你的专长是为企业和...`,stars:36,views:`7611`,avatarColor:`#66bb6a`,thumbBg:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`},{id:`b6`,author:`徐佳倩`,title:`智能投资顾问`,desc:`1. 角色：你是一名专业的私人投资理财顾问。2. 目标：根据最新的国内外新闻...`,stars:15,views:`1220`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`},{id:`b7`,author:`何周航`,title:`AI 思维教练`,desc:`你是一个专注于辅助个人思考的AI思维教练。你的目标是帮助用户深化思考、理...`,stars:48,views:`1079`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)`},{id:`b8`,author:`王益新`,title:`提示词工程师`,desc:`角色：你是一个提示词工程师，负责根据给定的任务描述或现有提示，生成一个...`,stars:84,views:`2035`,avatarColor:`#26a69a`,thumbBg:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`},{id:`b9`,author:`杨泽仪`,title:`漫画带你学 AI`,desc:`# Role: AI 视觉化概念解构师 (AI Visual Explainer) ## 核心定位 你是一位擅长...`,stars:9,views:`575`,avatarColor:`#ffa726`,thumbBg:`linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)`},{id:`b10`,author:`王益新`,title:`艺术签名大师`,desc:`你是一位专业的艺术签名设计师，能够根据用户姓名生成多种风格的艺术签名图...`,stars:3,views:`546`,avatarColor:`#8d6e63`,thumbBg:`linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%)`},{id:`b11`,author:`武玥`,title:`AI 帮你"变废为宝"的智能修图助手`,desc:`##角色 你是一个专业的修图智能助手，能够根据用户需求对照片进行多种编辑...`,stars:12,views:`545`,avatarColor:`#66bb6a`,thumbBg:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`},{id:`b12`,author:`徐佳倩`,title:`私人旅行顾问`,desc:`## 角色和目标 你是一位经验丰富的金牌旅游规划师，拥有广泛的全球旅游知识...`,stars:84,views:`4442`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`},{id:`b13`,author:`徐佳倩`,title:`你的公关专家：帮你快速应对公...`,desc:`##角色 你是一位顶级的商业战略顾问和公关危机处理专家，名叫"临危智囊"...`,stars:21,views:`1890`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%)`},{id:`b14`,author:`王益新`,title:`OKR 框架梳理助手`,desc:`你是专业的 OKR 梳理助手，能依据用户提供的工作描述、任务目标或项目计划，...`,stars:42,views:`3210`,avatarColor:`#26a69a`,thumbBg:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`},{id:`b15`,author:`何周航`,title:`岗位胜任力分析专家`,desc:`你是一个专注于岗位胜任力分析与技能提升的智能体，根据用户提供的公司内部...`,stars:33,views:`2100`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`}],inspire:[{id:`i1`,author:`陶鑫`,avatarColor:`#e6d4a8`,time:`3天前`,title:`如何开发一个高质量 Skill：从官方案例到飞书 CLI 实践`,summary:`本文讨论了如何开发一个高质量 Skill，从定义、开发模式到具体案例和开发流程等方面进行了详细阐述`,likes:3,stars:16,coverGradient:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,coverTitle:`如何开发一个\n高质量 Skill`,coverDark:!0},{id:`i2`,author:`大象`,avatar:`🐘`,time:`3天前`,title:`10分钟搞定本地AI：Ollama 零成本接入你的OpenClaw`,summary:`核心价值：手把手教你在自己的电脑上跑一个真正可用的AI模型，断网也能用、数据不上云、反应飞快`,likes:1,stars:14,coverGradient:`linear-gradient(135deg, #1b2838 0%, #2a3f55 100%)`,coverTitle:`10分钟搞定本地AI：\nOllama 零成本接入你的OpenClaw`,coverDark:!0},{id:`i3`,author:`玄清`,avatarColor:`#ff5252`,time:`4天前`,title:`Anthropic 出了一份 AI 创业手册`,summary:`Anthropic 发布了一份面向 AI 原生创始人的完整行动手册，覆盖从创意验证到规模化的四个核心阶段。手册揭示了 AI 时代最反直觉的五个洞见：技术与非技术创始人的边界消失、创始人角色从执行者变为编排者、零摩擦构建是最大陷阱、领域上下文是新护城河、规模化的是…`,likes:6,stars:115,coverGradient:`linear-gradient(135deg, #e3f0ff 0%, #c4dcf5 100%)`,coverTitle:`AI 原生创业生命周期：2026 重启版`,coverDark:!1},{id:`i4`,author:`Oli芬`,avatarColor:`#ffb74d`,time:`3天前`,title:`探索Prompt的本质，带你解析AI时代的魔法咒语`,summary:`Prompt 不是"咒语"，而是你给大模型的任务说明、上下文材料和行为约束。它决定模型要做什么、基于什么信息做、用什么方式输出、哪些事情不能做。当我们使用AI的时候，Prompt 的价值不是会写几句神奇指令，而是能把任务背景、业务规则、边界和输出标准表达清楚…`,likes:1,stars:9,coverGradient:`linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)`,coverTitle:`探索Prompt的本质，\n带你解析AI时代的魔法咒语`,coverDark:!1},{id:`i5`,author:`玄清`,avatarColor:`#ff5252`,time:`4天前`,title:`Anthropic发布创业手册：AI时代，每个阶段的玩法都变了【去广告版】`,summary:`AI降低了创业门槛，但同时让最常见的失败陷阱变得更深。本文拆解创业四阶段的底层逻辑，帮助小白看懂AI时代真正的创业规则。`,likes:6,stars:32,coverGradient:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`,coverTitle:`Anthropic刚发\n创业手册`,coverDark:!1}]}},aiWorkshop:[{id:`w1`,author:`肖遥`,title:`一人电商公司–商品管理系统`,views:`4.5k`,comments:9,cover:`linear-gradient(135deg, #fff5e6 0%, #ffe0c2 100%)`,emoji:`📦`},{id:`w2`,author:`肖遥`,title:`一人电商公司–竞品管理系统`,views:`853`,comments:0,cover:`linear-gradient(135deg, #efe6ff 0%, #d9c8ff 100%)`,emoji:`🏷️`},{id:`w3`,author:`纪金运`,title:`电商库存进出管理系统`,views:`9.9k`,comments:22,cover:`linear-gradient(135deg, #e6f0ff 0%, #c8d8ff 100%)`,emoji:`📊`},{id:`w4`,author:`绿育博`,title:`科技公司新品发布会报名页`,views:`1.6k`,comments:8,cover:`linear-gradient(135deg, #1a1f3a 0%, #3a2860 100%)`,emoji:`🚀`}],courses:[{id:`c1`,title:`一个餐饮外贸人的 AI 工具折腾史｜AI 开放麦 #EP01`,cover:`linear-gradient(135deg, #f0f4ff 0%, #e1ebff 100%)`,tag:`AI 开放麦`,liveTag:`直播`,chapters:2,learners:20,speaker:`一个餐饮外贸人的 AI 实战分享：商品采购与进销存管理`,detail:{description:`非技术背景的餐饮外贸从业者，独立用飞书妙搭搭建了完整的进销存系统，覆盖商品管理、采购、物流、报关、出入库全链路。`,tags:[`进阶级`,`飞书妙搭`,`飞书 aily`],progress:{current:0,total:2,status:`学习中`},toc:[{id:`ch1`,title:`分享妙记`,subtitle:`妙记`,icon:`📝`,required:!0},{id:`ch2`,title:`分享材料`,subtitle:`云文档`,icon:`📄`,required:!1,tag:`选修`}],incentive:{name:`飞行里程`,icon:`🚀`,points:20},channel:{name:`超级个体空间站`,desc:`一人进化成一支队伍的数字补给船`,subscribers:478,subscribed:!0,cover:`linear-gradient(135deg, #e3f0ff 0%, #c7d8ff 100%)`}}}],articles:[{id:`art1`,title:`保姆级教程：手把手教你 3 小时做出第一个微信小程序（配图+源码）`,author:`小机同学`,avatar:`🧑‍💻`,time:`3天前`,tags:[{text:`个人生活`,color:`orange`},{text:`通用场景`,color:`blue`}],summary:`手把手教你 3 小时做出第一个微信小程序`,likes:1,stars:24,thumbType:`doc`,thumb1:`linear-gradient(135deg, #fffaf0 0%, #fff3d6 100%)`,thumb2:`linear-gradient(135deg, #f4f7ff 0%, #e3ecff 100%)`,detail:{comments:3,favorites:43,desc:`手把手教你 3 小时做出第一个微信小程序`,toc:[{id:`t1`,text:`摘要`,level:1},{id:`t2`,text:`一、开局先拿“身份证”：注册账号 + 拿到那个关键AppID`,level:1},{id:`t2a`,text:`主体类型怎么选？`,level:2},{id:`t3`,text:`二、装上“作案工具”：微信开发者工具`,level:1},{id:`t4`,text:`三、新建项目（最关键的一步，盯紧了）`,level:1},{id:`t5`,text:`四、看懂小程序长啥样（四个文件就够了）`,level:1},{id:`t6`,text:`五、写第一个能点的页面（复制就行）`,level:1},{id:`t6a`,text:`第1步：改结构（index.wxml）`,level:2},{id:`t6b`,text:`第2步：改逻辑（index.js）`,level:2},{id:`t6c`,text:`第3步：改样式（index.wxss）`,level:2},{id:`t6d`,text:`保存后，立刻看左侧模拟器`,level:2},{id:`t7`,text:`六、用真机预览（在自己手机上打开）`,level:1},{id:`t8`,text:`七、发布上线（让别人也能搜到）`,level:1},{id:`t8a`,text:`第1步：上传代码`,level:2},{id:`t8b`,text:`第2步：去后台提交审核`,level:2}],body:[{type:`blockquote`,text:`你是不是也想过：“做个微信小程序，要不要学好几年前端？”
实话告诉你：不用。
今天这篇，就是连代码都不用自己从头脸的那种教程。
跟着教程走，3小时之内，你手机上能跑起来你的第一个小程序。`},{type:`heading`,text:`摘要`},{type:`paragraph`,text:`这篇教程从零开始，手把手教你：`},{type:`list`,items:[`注册小程序账号、拿到 AppID`,`安装微信开发者工具`,`新建项目、看懂文件结构`,`写第一个可点击的页面（3段代码搞定）`,`真机预览 + 发布上线`,`无代码备选方案`]},{type:`heading`,text:`一、开局先拿“身份证”：注册账号+拿到那个关键AppID`},{type:`paragraph`,text:`做小程序的第一步，不是写代码，而是去微信公众平台注册一个小程序账号。`},{type:`link`,text:`打开浏览器，访问：`,url:`mp.weixin.qq.com`},{type:`image`,gradient:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,alt:`微信公众平台注册页面`},{type:`paragraph`,text:`账号分类中选择“小程序”，按照提示填写信息即可完成注册。`}],moreWorks:[{title:`0代码基础文科小白5天上线原创海报...`,favorites:59,likes:9},{title:`0代码基础文科小白5天上线原创...`,favorites:13,likes:3}]}},{id:`art2`,title:`别被OPC一人公司神话骗了，90%的人都踩错了这4个致命坑~`,author:`子轩学长`,avatar:`👨‍🎓`,time:`11天前`,tags:[{text:`通用场景`,color:`blue`}],summary:`最近全网都在疯狂吹捧“OPC一人公司”，说什么“一个人干翻一个团队”、“AI让人人都能开公司”。我也亲眼看着身边90%跟风做一人公司的人，很多都失败了——他们要么累死累活赚不到钱，要么做了几个月就灰溜溜回去打工。 问题到底出在哪里？  答案其实早…`,likes:6,stars:39,thumbType:`stamp`,thumb1:`linear-gradient(135deg, #f7f5f0 0%, #ebe5d8 100%)`}],activities:[{id:`act1`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #0a1430 0%, #1a2456 60%, #4a3a7a 100%)`,coverTitle:`飞行社官方创作者`,coverTitle2:`入驻计划`,coverDesc:`寻找定义未来的 AI 创作者`,coverEmoji:`🖋️`,ctaText:`了解详情`,ctaStyle:`pill-blue`,title:`飞行社「官方创作者」入驻…`,summary:`在这里，你的知识不仅仅只是被阅读，而是被成千…`,status:`active`,statusText:`正在进行`,date:`5月10日–10月31日`,hasRegister:!0},{id:`act2`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #1a1230 0%, #3a2658 60%, #5a3878 100%)`,coverTitle:`AI 实战录 3.8 特辑`,coverTitle2:`她们用 AI 重写
规则的瞬间`,coverDesc:`AI 先锋们让想象力落地为生产力`,coverEmoji:`👩‍💻`,ctaText:`了解详情`,ctaStyle:`pill-violet`,title:`AI 实战录 3.8 特辑：见证她们工作进…`,summary:`一群 AI 先锋，正让想象力落地为生产力。本期聚…`,status:`ended`,statusText:`已结束`,date:`3月6日–3月13日`},{id:`act3`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #eef2ff 0%, #f5e8ff 50%, #ffe8f0 100%)`,coverTitle:`AI 实战录✧`,coverTitle2:`一起见证 100 个
工作进化瞬间`,coverDesc:`亲手改写企业的数字化命运`,coverEmoji:`👥`,ctaText:`了解详情`,ctaStyle:`pill-blue`,coverLight:!0,title:`AI 实战录：见证 100 个工作进化瞬间`,summary:`他们正在亲手改写企业的数字化命运，想象力正在…`,status:`ended`,statusText:`已结束`,date:`2月26日–4月30日`},{id:`act4`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #0d0d0d 0%, #2a1a08 60%, #6b3a0a 100%)`,coverTitle:`飞书 AI 效率先锋`,coverTitle2:`全国总决赛`,coverDesc:`直击 12 强决赛入围案例作品`,coverEmoji:`🏆`,ctaText:`查看详情`,ctaStyle:`pill-gold`,title:`2025 飞书 AI 效率先锋全国总决赛 12 …`,summary:`超 200 个全国顶尖、已真实落地的 AI 案例同台竞…`,status:`ended`,statusText:`已结束`,date:`12月3日 00:00–23:30`},{id:`act5`,badge:`直播`,liveTime:`2026年5月22日 11:00`,coverGradient:`linear-gradient(135deg, #eaf3ff 0%, #d6e6ff 100%)`,coverTitle:`飞书 AI Builder`,coverTitle2:`Demo Day`,coverDesc:`飞书 CLI x Agent，新的
上班方式正在发生`,coverEmoji:`🧩`,ctaText:`立即体验`,ctaStyle:`pill-blue-solid`,coverLight:!0,title:`Demo Day #1 飞书 CLI x Agent，新…`,summary:`本周五 (5/22) 11:00–12:00，我们会在飞书内做一…`,status:`ended`,statusText:`已结束`,date:`5月22日 11:00–12:00`},{id:`act6`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #1a1108 0%, #4a2f15 60%, #7a5028 100%)`,coverTitle:`NBTI`,coverTitle2:`职场“牛马”人格测试`,coverDesc:`30 道灵魂拷问，测出你的隐藏职场属性`,coverEmoji:`👼`,ctaText:``,title:`NBTI 职场“牛马”人格测试`,summary:`30 道灵魂拷问，测出你的隐藏职场属性`,status:`ended`,statusText:`已结束`,date:`4月17日–5月8日`},{id:`act7`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #08152e 0%, #0e2548 60%, #1a3a7a 100%)`,coverTitle:`飞书 CLI 创作者大赛`,coverTitle2:`用 Skill 改变世界`,coverDesc:`Mac Mini、安克 AI 录音豆、
京东卡等多种好礼等你来拿!`,coverEmoji:`💻`,ctaText:`立即参赛`,ctaStyle:`pill-blue-solid`,title:`飞书 CLI 创作者大赛：用 Skill 改变世界`,summary:`你是否已经用飞书 CLI 开发出了有趣的 Skill？你…`,status:`ended`,statusText:`已结束`,date:`4月1日–5月6日`}]}};

MOCK_CHANNEL_DETAILS['senior-community'] = {
  id: 'senior-community',
  title: '老年社区',
  description: '围绕智慧助老、康养服务和社区陪伴的银龄共创空间',
  operator: { name: '银龄服务组', avatar: '👵' },
  coverEmoji: '👵',
  tabs: [
    { key: 'home', label: '首页' },
    { key: 'discuss', label: '讨论区', count: 3 },
    { key: 'ai-set', label: 'AI 合集', count: 4 },
    { key: 'course', label: '课程', count: 2 },
    { key: 'article', label: '文章', count: 2 },
    { key: 'activity', label: '活动', count: 2 },
  ],
  hotDiscussions: [
    {
      id: 'senior-hot-1',
      author: '林社工',
      time: '1天前',
      from: '智慧助老共创群',
      content:
        '把“吃药提醒 + 家属通知”做成了大字版表单后，80 岁的张阿姨第一次就能自己完成反馈，准备继续把异常提醒接到社区值班群。',
      comments: 8,
    },
    {
      id: 'senior-hot-2',
      author: '周宁',
      time: '2天前',
      from: '银龄活动组织群',
      content:
        '社区活动室换成大字版签到屏后，现场排队时间少了一半，家属代办入口也终于不再靠口头解释。',
      comments: 5,
    },
    {
      id: 'senior-hot-3',
      author: '王医生',
      time: '3天前',
      from: '社区健康随访组',
      content:
        '我们把血压随访改成“异常先上报、正常自动归档”的流程，志愿者只需要点三个按钮，老人和家属都更放心。',
      comments: 4,
    },
  ],
  discussions: [
    {
      id: 'senior-post-1',
      author: '林社工',
      time: '1天前',
      from: '智慧助老共创群',
      title: '想给社区长者做一个“吃药提醒 + 家属通知”小应用，大家有什么表单设计建议？',
      paragraphs: [
        '我们现在还在用纸质登记，护理员每次回访都要再抄一次，容易漏项。',
        '准备改成飞书表单 + 自动提醒：长者确认是否已服药，异常时同步通知家属和网格员。',
        '目前最纠结的是字段要不要控制在 5 个以内，以及字号、按钮大小怎么做更友好。',
        '如果大家做过适老化表单，欢迎直接贴模板或截图。',
      ],
      replies: [
        { id: 'senior-reply-1', author: '周宁', text: '建议把“已服药/未服药”做成两个超大按钮，别让老人自己输入。' },
        { id: 'senior-reply-2', author: '王医生', text: '异常原因可以预设成 4 个选项，护理员补充备注即可。' },
        { id: 'senior-reply-3', author: '陈阿姨', text: '家属通知最好加一个“已知晓”回执，不然社区还得电话追。' },
      ],
    },
    {
      id: 'senior-post-2',
      author: '周宁',
      time: '2天前',
      from: '银龄活动组织群',
      title: '给社区活动室做了大字版签到屏，叔叔阿姨第一次就会用了',
      paragraphs: [
        '这次把签到页从 8 个字段减到 3 个：姓名、手机号后四位、是否需要接送。',
        '按钮高度统一到 56px，主按钮只保留“签到”和“找工作人员帮忙”两个动作。',
        '上线第一天，前台电话咨询量比上周少了三分之二。',
      ],
      replies: [
        { id: 'senior-reply-4', author: '林社工', text: '这个“找工作人员帮忙”按钮太关键了，很多老人需要心理兜底。' },
      ],
    },
    {
      id: 'senior-post-3',
      author: '王医生',
      time: '3天前',
      from: '社区健康随访组',
      title: '有没有适合老年大学的课程提醒模板？',
      paragraphs: [
        '我们想把慢病管理课和手机课做成固定提醒，每次上课前一天自动推送。',
        '希望家属也能收到同步提醒，避免老人忘记带药或者迟到。',
        '如果有现成模板，最好还能附带签到和课后反馈。',
      ],
      replies: [],
    },
  ],
  relatedGroups: [
    {
      id: 'senior-group-1',
      name: '智慧助老共创群',
      desc: '社区工作者、养老机构运营者和数字化伙伴一起打磨银龄服务流程。',
      count: '1.2k',
      avatar: '🫶',
    },
    {
      id: 'senior-group-2',
      name: '银龄活动组织群',
      desc: '聚焦活动报名、签到、接送和志愿者排班等社区协作问题。',
      count: '860',
      avatar: '🎏',
    },
  ],
  aiSet: {
    categories: [
      { key: 'workshop', label: 'AI 工坊' },
      { key: 'inspire', label: '灵感市集' },
    ],
    items: {
      workshop: [
        {
          id: 'senior-ai-1',
          author: '陈阿姨',
          title: '长者用药提醒台账',
          views: '2.1k',
          comments: 6,
          cover: 'linear-gradient(135deg, #fff8e8 0%, #ffe8bd 100%)',
          emoji: '💊',
          avatarColor: '#ffb74d',
        },
        {
          id: 'senior-ai-2',
          author: '周宁',
          title: '社区助餐报名表',
          views: '1.4k',
          comments: 3,
          cover: 'linear-gradient(135deg, #e9f8ef 0%, #cfeeda 100%)',
          emoji: '🍱',
          avatarColor: '#66bb6a',
        },
        {
          id: 'senior-ai-3',
          author: '王医生',
          title: '探访服务排班看板',
          views: '980',
          comments: 2,
          cover: 'linear-gradient(135deg, #ebf3ff 0%, #d7e6ff 100%)',
          emoji: '🗓️',
          avatarColor: '#42a5f5',
        },
      ],
      inspire: [
        {
          id: 'senior-inspire-1',
          author: '周宁',
          avatar: '👩',
          avatarColor: '#ffd180',
          time: '2天前',
          editTime: '2天前编辑',
          title: '把社区活动室做成“大字版数字前台”后，我们少接了三分之二的电话',
          summary: '从字体、动线到家属代办入口，复盘一次真正被长者用起来的适老化界面改造。',
          likes: 12,
          stars: 38,
          coverGradient: 'linear-gradient(135deg, #fff6df 0%, #ffe3b0 100%)',
          coverTitle: '大字版数字前台\n如何真正被用起来',
          coverDark: !1,
          detail: {
            abstract:
              '适老化不是把字放大就结束了，关键在于让长者、家属和工作人员都能在同一条服务链路里完成事情。',
            info: '本文复盘了一个街道活动室从纸质签到到大字版数字前台的改造过程。',
            coreValue: '减少现场解释和电话沟通，让长者第一次接触就能完成签到与求助。',
            toc: [
              { key: 's1', text: '为什么原来的流程没人愿意用', level: 1 },
              { key: 's2', text: '大字版设计不等于粗暴放大', level: 1 },
              { key: 's3', text: '家属代办入口怎么设计', level: 1 },
              { key: 's4', text: '上线后的变化', level: 1 },
            ],
            body: [
              { type: 'heading', text: '为什么原来的流程没人愿意用' },
              {
                type: 'highlight',
                text: '老人怕输错，家属怕流程太长，工作人员怕数据最后还要再抄一遍。',
              },
              {
                type: 'paragraph',
                text: '我们先把所有必须手填的内容删掉，只保留现场必须确认的三个信息，并把异常处理做成固定选项。',
              },
              { type: 'heading', text: '大字版设计不等于粗暴放大' },
              {
                type: 'paragraph',
                text: '除了字体和按钮，最关键的是把页面上的动作压缩到两个，让用户不需要再做额外判断。',
              },
              {
                type: 'image',
                gradient: 'linear-gradient(135deg, #fffaf0 0%, #ffe8bd 100%)',
                alt: '大字版签到页面示意',
              },
              { type: 'heading', text: '上线后的变化' },
              {
                type: 'paragraph',
                text: '活动前台电话咨询量下降了三分之二，志愿者培训时间也从半天缩短到 20 分钟。',
              },
            ],
            comments: [
              {
                id: 'senior-comment-1',
                author: '林社工',
                avatar: '👩',
                avatarColor: '#c5e1a5',
                text: '“找工作人员帮忙”这个兜底按钮非常实用，我们也准备加上。',
                time: '1天前',
                isOp: !1,
              },
              {
                id: 'senior-comment-2',
                author: '周宁',
                avatar: '👩',
                avatarColor: '#ffd180',
                text: '如果大家需要模版，我可以整理一版可直接复用的字段配置。',
                time: '1天前',
                isOp: !0,
              },
            ],
          },
        },
      ],
    },
  },
  aiWorkshop: [
    {
      id: 'senior-workshop-1',
      author: '陈阿姨',
      title: '长者用药提醒台账',
      views: '2.1k',
      comments: 6,
      cover: 'linear-gradient(135deg, #fff8e8 0%, #ffe8bd 100%)',
      emoji: '💊',
    },
    {
      id: 'senior-workshop-2',
      author: '周宁',
      title: '社区助餐报名表',
      views: '1.4k',
      comments: 3,
      cover: 'linear-gradient(135deg, #e9f8ef 0%, #cfeeda 100%)',
      emoji: '🍱',
    },
    {
      id: 'senior-workshop-3',
      author: '王医生',
      title: '探访服务排班看板',
      views: '980',
      comments: 2,
      cover: 'linear-gradient(135deg, #ebf3ff 0%, #d7e6ff 100%)',
      emoji: '🗓️',
    },
  ],
  courses: [
    {
      id: 'senior-course-1',
      title: '零基础搭建长者活动报名与签到系统',
      cover: 'linear-gradient(135deg, #fff5df 0%, #ffe0ae 100%)',
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
          { id: 'senior-course-1-1', title: '报名表单怎么减字段', subtitle: '直播回放', icon: '🎥', required: !0 },
          { id: 'senior-course-1-2', title: '签到与接送协同流程', subtitle: '案例拆解', icon: '🧩', required: !0 },
          { id: 'senior-course-1-3', title: '家属代办入口配置', subtitle: '操作指引', icon: '📄', required: !1, tag: '选修' },
        ],
        incentive: { name: '服务积分', icon: '🏅', points: 18 },
        channel: {
          name: '老年社区',
          desc: '围绕智慧助老与社区陪伴的银龄共创空间',
          subscribers: 12800,
          subscribed: !0,
          cover: 'linear-gradient(135deg, #fff3dc 0%, #ffe0ae 100%)',
        },
      },
    },
    {
      id: 'senior-course-2',
      title: '把社区健康巡访流程搬进表格：志愿者也能快速上手',
      cover: 'linear-gradient(135deg, #edf8ff 0%, #d4ebff 100%)',
      tag: '实战课',
      chapters: 2,
      learners: 24,
      speaker: '社区医生 × 志愿者协同案例',
      detail: {
        description: '把血压记录、异常上报和回访提醒整合到一套轻量流程里，减少重复登记和漏项。',
        tags: ['健康服务', '流程协同', '飞书表格'],
        progress: { current: 0, total: 2, status: '学习中' },
        toc: [
          { id: 'senior-course-2-1', title: '巡访表怎么设计才不累人', subtitle: '案例讲解', icon: '📝', required: !0 },
          { id: 'senior-course-2-2', title: '异常提醒与家属通知', subtitle: '云文档', icon: '📄', required: !0 },
        ],
        incentive: { name: '飞行里程', icon: '🚀', points: 12 },
        channel: {
          name: '老年社区',
          desc: '围绕智慧助老与社区陪伴的银龄共创空间',
          subscribers: 12800,
          subscribed: !0,
          cover: 'linear-gradient(135deg, #edf8ff 0%, #d4ebff 100%)',
        },
      },
    },
  ],
  articles: [
    {
      id: 'senior-art-1',
      title: '老年社区数字化改造清单：从大字版到代办入口',
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
      thumb1: 'linear-gradient(135deg, #fffaf0 0%, #ffefcf 100%)',
      thumb2: 'linear-gradient(135deg, #eef7ff 0%, #ddefff 100%)',
      detail: {
        comments: 4,
        favorites: 53,
        desc: '把适老化从“视觉放大”扩展到“流程更少、代办更顺、通知更稳”的完整清单。',
        toc: [
          { id: 'senior-art-1-t1', text: '为什么很多适老化改造只停留在表面', level: 1 },
          { id: 'senior-art-1-t2', text: '字段和按钮怎么取舍', level: 1 },
          { id: 'senior-art-1-t3', text: '家属代办入口的设计原则', level: 1 },
          { id: 'senior-art-1-t4', text: '上线前的现场测试清单', level: 1 },
        ],
        body: [
          {
            type: 'blockquote',
            text:
              '真正的适老化不是“看起来像为老人设计”。\n而是让老人第一次上手不害怕、遇到卡点有兜底、家属协同不需要重复解释。',
          },
          { type: 'heading', text: '为什么很多适老化改造只停留在表面' },
          {
            type: 'paragraph',
            text: '因为只改字体和颜色，不改路径、字段和协作方式，最终工作人员还是要在线下补一次。',
          },
          { type: 'heading', text: '字段和按钮怎么取舍' },
          {
            type: 'list',
            items: [
              '把必填字段压缩到 3-5 个',
              '主页面只保留 1-2 个动作按钮',
              '异常情况统一成固定选项',
              '所有自由输入都尽量交给工作人员补录',
            ],
          },
          { type: 'heading', text: '家属代办入口的设计原则' },
          {
            type: 'paragraph',
            text: '家属入口不应藏在说明文字里，而要和主流程并列出现，告诉用户“自己不会也没关系”。',
          },
          {
            type: 'image',
            gradient: 'linear-gradient(135deg, #fffaf0 0%, #ffe5b6 100%)',
            alt: '老年社区数字化改造清单示意',
          },
        ],
        moreWorks: [
          { title: '社区助餐报名页优化记录', favorites: 28, likes: 9 },
          { title: '适老化问卷模板 1.0', favorites: 17, likes: 6 },
        ],
      },
    },
    {
      id: 'senior-art-2',
      title: '如何让志愿者 20 分钟内学会一套社区探访流程',
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
      thumb1: 'linear-gradient(135deg, #f6fbff 0%, #e5f1ff 100%)',
      thumb2: 'linear-gradient(135deg, #fff8ed 0%, #ffe8c2 100%)',
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
          {
            type: 'blockquote',
            text:
              '不是每个志愿者都要成为系统专家。\n他们只需要在现场知道下一步做什么、出了问题找谁。',
          },
          { type: 'heading', text: '三个关键动作拆解' },
          {
            type: 'list',
            items: ['到达后先确认状态', '异常只走一个上报入口', '结束后自动生成回访记录'],
          },
          {
            type: 'paragraph',
            text: '把培训材料也改成一页纸之后，志愿者更愿意在出发前快速复习，而不是翻一大段操作说明。',
          },
        ],
        moreWorks: [
          { title: '异常上报一页纸指南', favorites: 13, likes: 4 },
          { title: '社区巡访记录模板', favorites: 22, likes: 7 },
        ],
      },
    },
  ],
  activities: [
    {
      id: 'senior-act-1',
      badge: '报名中',
      coverGradient: 'linear-gradient(135deg, #fff6df 0%, #ffe4b5 100%)',
      coverTitle: '银龄服务共创营',
      coverTitle2: '一起打磨\n适老化服务体验',
      coverDesc: '社区工作者、志愿者和产品伙伴\n共建智慧助老样板',
      coverEmoji: '🤝',
      ctaText: '立即报名',
      ctaStyle: 'pill-blue-solid',
      coverLight: !0,
      title: '银龄服务共创营：3 周做出一个社区助老小工具',
      summary: '围绕活动报名、上门探访、健康提醒等场景，产出可直接复用的轻量模板。',
      status: 'active',
      statusText: '正在报名',
      date: '6月12日–7月3日',
      hasRegister: !0,
    },
    {
      id: 'senior-act-2',
      badge: '直播',
      liveTime: '2026年6月18日 19:30',
      coverGradient: 'linear-gradient(135deg, #eef6ff 0%, #d8ebff 100%)',
      coverTitle: '大字版设计公开课',
      coverTitle2: '让叔叔阿姨\n第一次就会用',
      coverDesc: '拆解按钮、文案、流程顺序\n和家属协同入口',
      coverEmoji: '📺',
      ctaText: '预约直播',
      ctaStyle: 'pill-blue',
      coverLight: !0,
      title: '适老化表单公开课：第一次点击就懂',
      summary: '用真实社区案例讲清楚什么是“看得见、点得着、记得住”的数字化服务。',
      status: 'active',
      statusText: '即将开始',
      date: '6月18日 19:30–20:30',
    },
  ],
};

MOCK_CHANNEL_DETAILS['family-education'] = {
  id: 'family-education',
  title: '家庭教育社区',
  description: '围绕家校共育、亲子沟通和学习习惯培养的实践交流社区',
  operator: { name: '家校共育组', avatar: '👩‍🏫' },
  coverEmoji: '🏠',
  tabs: [
    { key: 'home', label: '首页' },
    { key: 'discuss', label: '讨论区', count: 3 },
    { key: 'ai-set', label: 'AI 合集', count: 4 },
    { key: 'course', label: '课程', count: 2 },
    { key: 'article', label: '文章', count: 2 },
    { key: 'activity', label: '活动', count: 2 },
  ],
  hotDiscussions: [
    {
      id: 'family-hot-1',
      author: '周老师',
      time: '今天',
      from: '家校沟通实践群',
      content:
        '把家长会反馈改成“孩子状态 + 家长问题 + 老师建议”三段式表单后，老师不用再逐条翻聊天记录，家长回复率也明显提高。',
      comments: 11,
    },
    {
      id: 'family-hot-2',
      author: '李老师',
      time: '1天前',
      from: '亲子阅读共学群',
      content:
        '亲子阅读打卡加入“今天是谁先开口分享”这个问题后，很多家庭开始从催促打卡转向真正交流内容。',
      comments: 7,
    },
    {
      id: 'family-hot-3',
      author: '张妈妈',
      time: '2天前',
      from: '家庭会议共创群',
      content:
        '我们试了每周一次 15 分钟家庭会议模板，孩子第一次愿意自己提“这周最想被表扬的事”，效果比单独说教好很多。',
      comments: 6,
    },
  ],
  discussions: [
    {
      id: 'family-post-1',
      author: '周老师',
      time: '今天',
      from: '家校沟通实践群',
      title: '有没有适合班主任的家校反馈周报模板？最好能兼顾“成绩之外的变化”',
      paragraphs: [
        '我们现在的周报太像成绩单，家长一看到就紧张，孩子也会抗拒。',
        '想把它改成“本周亮点、需要协助的习惯、下周建议”三段式，让家长更容易配合。',
        '如果能再带一个家长回执入口就更好了，避免老师一个个追问。',
      ],
      replies: [
        { id: 'family-reply-1', author: '李老师', text: '建议每次只留一个“本周想重点协助的习惯”，家长执行成本会低很多。' },
        { id: 'family-reply-2', author: '张妈妈', text: '家长回执可以改成“已知晓/需要老师联系”，不要让家长写太多。' },
      ],
    },
    {
      id: 'family-post-2',
      author: '李老师',
      time: '1天前',
      from: '亲子阅读共学群',
      title: '亲子阅读打卡怎么做，才不会变成家长拍照交作业？',
      paragraphs: [
        '我们试着把阅读打卡从“上传照片”改成“孩子复述一句、家长回应一句”。',
        '孩子参与度提升了，但老师批改时间也变长了，想看看有没有更轻量的模板。',
        '如果大家做过自动汇总或者周复盘，也欢迎一起交流。',
      ],
      replies: [
        { id: 'family-reply-3', author: '周老师', text: '可以每周只抽一次详细反馈，其余时间只收关键词。' },
      ],
    },
    {
      id: 'family-post-3',
      author: '张妈妈',
      time: '2天前',
      from: '家庭会议共创群',
      title: '家庭会议到底是“讲道理”还是“听孩子说”？',
      paragraphs: [
        '我们以前开家庭会议基本是家长总结问题，孩子只负责点头。',
        '最近尝试先让孩子说“这周最开心/最不开心的一件事”，冲突明显少了。',
        '想知道大家有没有固定流程模板，能让家庭会议不跑偏。',
      ],
      replies: [],
    },
  ],
  relatedGroups: [
    {
      id: 'family-group-1',
      name: '家校沟通实践群',
      desc: '班主任、家长和教研伙伴一起打磨高频、低负担的家校协作方式。',
      count: '1.8k',
      avatar: '🏫',
    },
    {
      id: 'family-group-2',
      name: '家庭会议共创群',
      desc: '围绕亲子沟通、习惯养成和家庭规则协商沉淀可复用模板。',
      count: '950',
      avatar: '💬',
    },
  ],
  aiSet: {
    categories: [
      { key: 'workshop', label: 'AI 工坊' },
      { key: 'inspire', label: '灵感市集' },
    ],
    items: {
      workshop: [
        {
          id: 'family-ai-1',
          author: '周老师',
          title: '亲子阅读打卡助手',
          views: '3.6k',
          comments: 9,
          cover: 'linear-gradient(135deg, #eef4ff 0%, #dbe8ff 100%)',
          emoji: '📚',
          avatarColor: '#5c6bc0',
        },
        {
          id: 'family-ai-2',
          author: '李老师',
          title: '家校沟通周报生成器',
          views: '2.7k',
          comments: 5,
          cover: 'linear-gradient(135deg, #fff3e8 0%, #ffd9bf 100%)',
          emoji: '✉️',
          avatarColor: '#ff8a65',
        },
        {
          id: 'family-ai-3',
          author: '张妈妈',
          title: '家庭会议记录板',
          views: '1.9k',
          comments: 4,
          cover: 'linear-gradient(135deg, #f3edff 0%, #e2d7ff 100%)',
          emoji: '🧭',
          avatarColor: '#9575cd',
        },
      ],
      inspire: [
        {
          id: 'family-inspire-1',
          author: '周老师',
          avatar: '👩‍🏫',
          avatarColor: '#c5cae9',
          time: '1天前',
          editTime: '1天前编辑',
          title: '让家庭作业不再变成争吵：一次家校共育表单改造记录',
          summary: '把打卡、反馈和老师建议放进一个轻量闭环后，家长配合度和孩子完成率都明显提升。',
          likes: 18,
          stars: 45,
          coverGradient: 'linear-gradient(135deg, #eef2ff 0%, #dfe7ff 100%)',
          coverTitle: '家庭作业不再争吵\n家校表单改造记录',
          coverDark: !1,
          detail: {
            abstract:
              '家庭教育里最难的，往往不是内容本身，而是家长、孩子和老师在同一个流程里说不到一起去。',
            info: '本文复盘了一次班级作业反馈表从“催交工具”升级为“协作工具”的改造过程。',
            coreValue: '让老师少追问，让家长少焦虑，让孩子知道下一步怎么做。',
            toc: [
              { key: 'f1', text: '原来的作业反馈为什么总在放大冲突', level: 1 },
              { key: 'f2', text: '三段式反馈怎么设计', level: 1 },
              { key: 'f3', text: '家长回执怎样才不增加负担', level: 1 },
              { key: 'f4', text: '上线后的变化', level: 1 },
            ],
            body: [
              { type: 'heading', text: '原来的作业反馈为什么总在放大冲突' },
              {
                type: 'highlight',
                text: '当反馈表只记录“有没有完成”，家长和孩子就很容易把对话变成追责。',
              },
              {
                type: 'paragraph',
                text: '我们改成“今天最顺的一件事、最卡的一件事、老师下一步建议”三段式之后，反馈更聚焦，情绪摩擦也下降了。',
              },
              { type: 'heading', text: '三段式反馈怎么设计' },
              {
                type: 'paragraph',
                text: '每次只要求家长和孩子各写一句，老师只给一个可执行建议，避免信息量过大。',
              },
              {
                type: 'image',
                gradient: 'linear-gradient(135deg, #eef2ff 0%, #dbe6ff 100%)',
                alt: '家校共育表单示意',
              },
              { type: 'heading', text: '上线后的变化' },
              {
                type: 'paragraph',
                text: '一周后，按时回收率提升到 92%，老师单次整理反馈时间缩短了一半以上。',
              },
            ],
            comments: [
              {
                id: 'family-comment-1',
                author: '张妈妈',
                avatar: '👩',
                avatarColor: '#f8bbd0',
                text: '老师只给一个建议这点太关键了，家长更容易照着做。',
                time: '1天前',
                isOp: !1,
              },
              {
                id: 'family-comment-2',
                author: '周老师',
                avatar: '👩‍🏫',
                avatarColor: '#c5cae9',
                text: '如果需要模板，我可以把字段结构和回执逻辑整理出来。',
                time: '1天前',
                isOp: !0,
              },
            ],
          },
        },
      ],
    },
  },
  aiWorkshop: [
    {
      id: 'family-workshop-1',
      author: '周老师',
      title: '亲子阅读打卡助手',
      views: '3.6k',
      comments: 9,
      cover: 'linear-gradient(135deg, #eef4ff 0%, #dbe8ff 100%)',
      emoji: '📚',
    },
    {
      id: 'family-workshop-2',
      author: '李老师',
      title: '家校沟通周报生成器',
      views: '2.7k',
      comments: 5,
      cover: 'linear-gradient(135deg, #fff3e8 0%, #ffd9bf 100%)',
      emoji: '✉️',
    },
    {
      id: 'family-workshop-3',
      author: '张妈妈',
      title: '家庭会议记录板',
      views: '1.9k',
      comments: 4,
      cover: 'linear-gradient(135deg, #f3edff 0%, #e2d7ff 100%)',
      emoji: '🧭',
    },
  ],
  courses: [
    {
      id: 'family-course-1',
      title: '零基础搭建家校沟通周报',
      cover: 'linear-gradient(135deg, #eef2ff 0%, #dfe7ff 100%)',
      tag: '家校共育课',
      liveTag: '回放',
      chapters: 3,
      learners: 48,
      speaker: '班主任高频沟通流程实战',
      detail: {
        description: '把学生亮点、需要协助的习惯和下周建议放进一套轻量模板，降低老师和家长双方负担。',
        tags: ['入门级', '家校沟通', '表单设计'],
        progress: { current: 1, total: 3, status: '学习中' },
        toc: [
          { id: 'family-course-1-1', title: '周报结构怎么做减法', subtitle: '直播回放', icon: '🎥', required: !0 },
          { id: 'family-course-1-2', title: '家长回执设计', subtitle: '案例拆解', icon: '🧩', required: !0 },
          { id: 'family-course-1-3', title: '自动汇总与复盘', subtitle: '操作指引', icon: '📄', required: !1, tag: '选修' },
        ],
        incentive: { name: '共育积分', icon: '🌟', points: 16 },
        channel: {
          name: '家庭教育社区',
          desc: '围绕家校共育与亲子沟通的实践交流社区',
          subscribers: 18600,
          subscribed: !0,
          cover: 'linear-gradient(135deg, #eef2ff 0%, #dfe7ff 100%)',
        },
      },
    },
    {
      id: 'family-course-2',
      title: '家庭会议模板：15 分钟开出有效沟通',
      cover: 'linear-gradient(135deg, #fff5e9 0%, #ffe2c5 100%)',
      tag: '实战课',
      chapters: 2,
      learners: 31,
      speaker: '亲子沟通结构化实践',
      detail: {
        description: '围绕“先听孩子说、再定下周一件事”的节奏，搭建一个家庭可持续执行的沟通模板。',
        tags: ['亲子沟通', '习惯养成', '家庭会议'],
        progress: { current: 0, total: 2, status: '学习中' },
        toc: [
          { id: 'family-course-2-1', title: '家庭会议标准流程', subtitle: '案例讲解', icon: '📝', required: !0 },
          { id: 'family-course-2-2', title: '会后跟进表', subtitle: '云文档', icon: '📄', required: !0 },
        ],
        incentive: { name: '飞行里程', icon: '🚀', points: 12 },
        channel: {
          name: '家庭教育社区',
          desc: '围绕家校共育与亲子沟通的实践交流社区',
          subscribers: 18600,
          subscribed: !0,
          cover: 'linear-gradient(135deg, #fff5e9 0%, #ffe2c5 100%)',
        },
      },
    },
  ],
  articles: [
    {
      id: 'family-art-1',
      title: '家庭教育数字化清单：家长、孩子、老师如何共用一个反馈闭环',
      author: '周老师',
      avatar: '👩‍🏫',
      time: '1天前',
      tags: [
        { text: '家校共育', color: 'orange' },
        { text: '反馈设计', color: 'blue' },
      ],
      summary: '把家庭教育数字化从“多一个打卡工具”变成“少一点沟通摩擦”的设计清单。',
      likes: 21,
      stars: 62,
      thumbType: 'doc',
      thumb1: 'linear-gradient(135deg, #f3f6ff 0%, #e3ebff 100%)',
      thumb2: 'linear-gradient(135deg, #fff7ef 0%, #ffe6cf 100%)',
      detail: {
        comments: 5,
        favorites: 62,
        desc: '聚焦作业反馈、阅读打卡和家长回执三个高频场景，拆解可落地的闭环设计。',
        toc: [
          { id: 'family-art-1-t1', text: '为什么家庭教育工具越多，沟通反而越累', level: 1 },
          { id: 'family-art-1-t2', text: '反馈闭环的三段式结构', level: 1 },
          { id: 'family-art-1-t3', text: '家长回执应该最少到什么程度', level: 1 },
        ],
        body: [
          {
            type: 'blockquote',
            text:
              '真正有效的家庭教育数字化，不是让每个人填更多表，而是让每个人更清楚自己下一步要做什么。',
          },
          { type: 'heading', text: '反馈闭环的三段式结构' },
          {
            type: 'list',
            items: [
              '先记录本周一个亮点',
              '再聚焦一个最需要协助的问题',
              '最后给出一个下周可执行动作',
            ],
          },
          {
            type: 'paragraph',
            text: '当反馈只围绕一件重点展开时，家长更容易执行，孩子也更容易接收。',
          },
        ],
        moreWorks: [
          { title: '阅读打卡关键词模板', favorites: 33, likes: 10 },
          { title: '家长回执最简版设计', favorites: 25, likes: 8 },
        ],
      },
    },
    {
      id: 'family-art-2',
      title: '亲子阅读打卡，如何从“完成任务”变成“真正交流”',
      author: '李老师',
      avatar: '👩',
      time: '3天前',
      tags: [
        { text: '亲子阅读', color: 'orange' },
        { text: '家庭沟通', color: 'blue' },
      ],
      summary: '当阅读打卡从上传照片变成复述与回应，孩子会更愿意表达，家长也更容易参与。',
      likes: 13,
      stars: 39,
      thumbType: 'doc',
      thumb1: 'linear-gradient(135deg, #eef4ff 0%, #dde8ff 100%)',
      thumb2: 'linear-gradient(135deg, #fff4ea 0%, #ffe2ca 100%)',
      detail: {
        comments: 3,
        favorites: 39,
        desc: '拆解亲子阅读打卡的提问模板、记录频率和每周复盘方式。',
        toc: [
          { id: 'family-art-2-t1', text: '为什么拍照打卡最容易失真', level: 1 },
          { id: 'family-art-2-t2', text: '一句复述 + 一句回应的结构', level: 1 },
        ],
        body: [
          {
            type: 'blockquote',
            text:
              '阅读真正留下来的，不是那张照片，而是孩子说过的话和家长听进去的那一刻。',
          },
          { type: 'heading', text: '一句复述 + 一句回应的结构' },
          {
            type: 'paragraph',
            text: '先让孩子讲一句今天最记得的内容，再让家长回应一句自己的理解，足够轻量，也更容易形成习惯。',
          },
        ],
        moreWorks: [
          { title: '亲子阅读周复盘模板', favorites: 18, likes: 6 },
          { title: '家长陪伴提问卡片', favorites: 22, likes: 7 },
        ],
      },
    },
  ],
  activities: [
    {
      id: 'family-act-1',
      badge: '报名中',
      coverGradient: 'linear-gradient(135deg, #eef2ff 0%, #dfe7ff 100%)',
      coverTitle: '家校共育共创营',
      coverTitle2: '一起打磨\n低负担沟通模板',
      coverDesc: '老师、家长和教研伙伴\n共建可复用反馈闭环',
      coverEmoji: '🤝',
      ctaText: '立即报名',
      ctaStyle: 'pill-blue-solid',
      coverLight: !0,
      title: '家校共育共创营：两周做出一套班级反馈模板',
      summary: '围绕作业反馈、家长回执和习惯培养，沉淀可直接落地的家校协作模板。',
      status: 'active',
      statusText: '正在报名',
      date: '6月15日–6月28日',
      hasRegister: !0,
    },
    {
      id: 'family-act-2',
      badge: '直播',
      liveTime: '2026年6月20日 20:00',
      coverGradient: 'linear-gradient(135deg, #fff5ea 0%, #ffe3c8 100%)',
      coverTitle: '家庭会议公开课',
      coverTitle2: '让孩子愿意说\n家长听得进去',
      coverDesc: '拆解提问顺序、记录模板\n和会后跟进动作',
      coverEmoji: '🎙️',
      ctaText: '预约直播',
      ctaStyle: 'pill-blue',
      coverLight: !0,
      title: '家庭会议公开课：15 分钟沟通模板',
      summary: '用真实案例讲清楚如何让家庭会议从“训话场”变成“协商场”。',
      status: 'active',
      statusText: '即将开始',
      date: '6月20日 20:00–21:00',
    },
  ],
};

function buildDefaultDetail(ch) {
  return {
    id: ch.id,
    title: ch.title,
    description: `${ch.title} · 共 ${ch.contentCount} 条内容 · ${ch.updatedDesc}`,
    operator: { name: '官方运营', avatar: '🧑‍💼' },
    coverEmoji: ch.badge || '🚀',
    tabs: [
      { key: 'home', label: '首页' },
      { key: 'discuss', label: '讨论区', count: 0 },
      { key: 'ai-set', label: 'AI 合集', count: 0 },
      { key: 'course', label: '课程', count: 0 },
      { key: 'article', label: '文章', count: 0 },
      { key: 'activity', label: '活动', count: 0 },
    ],
    hotDiscussions: [],
    discussions: [],
    relatedGroups: [],
    aiWorkshop: [],
    courses: [],
    articles: [],
    activities: [],
    aiSet: { categories: [], items: {} },
  };
}

function getStaticChannelDetail(id) {
  const channel = MOCK_CHANNELS_DATA.find((item) => item.id === id);
  if (!channel) return null;
  return MOCK_CHANNEL_DETAILS[id] || buildDefaultDetail(channel);
}

function findChannelContent(getter) {
  for (const channel of MOCK_CHANNELS_DATA) {
    const detail = getStaticChannelDetail(channel.id);
    const item = getter(detail);
    if (item) {
      return item;
    }
  }
  return null;
}

function getSubscriptions() {
  try {
    const defaults = {
      'senior-community': true,
      'family-education': true,
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw) || {};
    const merged = { ...defaults, ...parsed };
    if (JSON.stringify(merged) !== JSON.stringify(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return {};
  }
}

function saveSubscriptions(subs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export const studyClubApi = {
  async listChannels() {
    await delay();
    const subs = getSubscriptions();
    return MOCK_CHANNELS_DATA.map((ch) => ({ ...ch, subscribed: !!subs[ch.id] }));
  },

  async getBanner() {
    await delay(80);
    return {
      title: '研习社新社区上线中',
      subtitle: '老年社区 · 家庭教育社区',
      desc: '聚焦银龄服务与家校共育，沉淀更贴近日常场景的可复用经验。',
      ctaText: '进入社区',
      coverEmoji: '🏡',
    };
  },

  async toggleSubscribe(id) {
    await delay(120);
    const subs = getSubscriptions();
    subs[id] = !subs[id];
    saveSubscriptions(subs);
    return { id, subscribed: !!subs[id] };
  },

  async getChannelDetail(id) {
    await delay(180);
    const subs = getSubscriptions();
    const ch = MOCK_CHANNELS_DATA.find((c) => c.id === id);
    if (!ch) return null;
    return {
      ...getStaticChannelDetail(id),
      contentCount: ch.contentCount,
      updatedDesc: ch.updatedDesc,
      subscribers: ch.subscribers,
      subscribersText: ch.subscribersText,
      subscribed: !!subs[id],
      accent: ch.accent,
    };
  },

  async getCourseDetail(courseId) {
    await delay(120);
    return findChannelContent((detail) =>
      (detail.courses || []).find((course) => course.id === courseId)
    );
  },

  async getArticleDetail(articleId) {
    await delay(120);
    return findChannelContent((detail) =>
      (detail.articles || []).find((article) => article.id === articleId)
    );
  },

  async getInspireDetail(itemId) {
    await delay(120);
    return findChannelContent((detail) =>
      ((detail.aiSet && detail.aiSet.items && detail.aiSet.items.inspire) || []).find(
        (item) => item.id === itemId
      )
    );
  },

  async getPlaygroundItems(subKey = 'workshop') {
    await delay(150);
    return MOCK_PLAYGROUND_ITEMS[subKey] || [];
  },
};
