const STORAGE_KEY = 'guoren_study_club_subscriptions';

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const STUDY_CLUB_TABS = [{key:`home`,label:`首页`},{key:`playground`,label:`AI游乐园`},{key:`course`,label:`课程`},{key:`knowledge`,label:`知识`},{key:`template`,label:`模板`},{key:`channel`,label:`频道`},{key:`vip`,label:`AI 会员`,tag:`Pro+`},{key:`activity`,label:`活动`}];

const MOCK_CHANNELS_DATA = [{id:`super-individual`,title:`超级个体空间站`,contentCount:32,updatedDesc:`3 天前更新`,subscribers:466,subscribersText:`466`,accent:`blue`,badge:`👨‍🚀`,highlighted:!0,tags:[`AI Builder`]},{id:`miaoda-ai`,title:`妙搭万物 AI 社区`,contentCount:76,updatedDesc:`3 天前更新`,subscribers:19e3,subscribersText:`1.9万`,accent:`cyan`,badge:`🧩`},{id:`feishu-classroom`,title:`飞书大讲堂`,contentCount:57,updatedDesc:`3 天前更新`,subscribers:196e3,subscribersText:`19.6万`,accent:`violet`,badge:`🎓`},{id:`waytoagi`,title:`WaytoAGI 共学社区`,contentCount:30,updatedDesc:`7 天前更新`,subscribers:16e3,subscribersText:`1.6万`,accent:`sky`,badge:`🤖`},{id:`pioneer`,title:`直击先进`,contentCount:181,updatedDesc:`7 天前更新`,subscribers:29e3,subscribersText:`2.9万`,accent:`amber`,badge:`▶️`},{id:`aily`,title:`飞书 aily 加油站`,contentCount:73,updatedDesc:`1 周前更新`,subscribers:2955,subscribersText:`2955`,accent:`rose`,badge:`💬`},{id:`feishu-new`,title:`上新了飞书`,contentCount:25,updatedDesc:`1 周前更新`,subscribers:7300,subscribersText:`7300`,accent:`pink`,badge:`✨`},{id:`mvp-table`,title:`多维表格 MVP 俱乐部`,contentCount:109,updatedDesc:`1 周前更新`,subscribers:41e3,subscribersText:`4.1万`,accent:`purple`,badge:`📊`},{id:`pm-community`,title:`飞书项目管理社区`,contentCount:38,updatedDesc:`2 周前更新`,subscribers:3e4,subscribersText:`3.0万`,accent:`mint`,badge:`🗂️`},{id:`openclaw`,title:`OpenClaw 养虾实验室`,contentCount:80,updatedDesc:`2 周前更新`,subscribers:57e3,subscribersText:`5.7万`,accent:`sea`,badge:`🦐`},{id:`doc-ai`,title:`飞书文档 AI 实验室`,contentCount:64,updatedDesc:`2 周前更新`,subscribers:12e3,subscribersText:`1.2万`,accent:`indigo`,badge:`📝`},{id:`design-club`,title:`飞书设计研习营`,contentCount:42,updatedDesc:`3 周前更新`,subscribers:8800,subscribersText:`8800`,accent:`teal`,badge:`🎨`}];

const MOCK_CHANNEL_DETAILS = {"super-individual":{id:`super-individual`,title:`超级个体`,titleSecond:`空间站`,description:`一人进化成一支队伍的数字补给舱`,operator:{name:`徐佳倩`,avatar:`👩`},coverEmoji:`👨‍🚀`,tabs:[{key:`home`,label:`首页`},{key:`discuss`,label:`讨论区`,count:3},{key:`ai-set`,label:`AI 合集`,count:21},{key:`course`,label:`课程`,count:2},{key:`article`,label:`文章`,count:2},{key:`activity`,label:`活动`,count:7}],hotDiscussions:[{id:`d1`,author:`王子瑜`,time:`5天前`,from:`AI Builder实践加速营`,content:`🍱「AI 开放麦」首期直播 来啦！98 年餐饮外贸人，花 2000 块用妙搭干了别人 3 万开发费的活。他的工具折腾路线：WPS → 飞书多维表格 → 妙搭最终用妙搭搭出一套完整外贸应用，再配合 AI 处理国际贸易文件 —— 技术描…`,comments:6},{id:`d2`,author:`王子瑜`,time:`3天前`,from:`AI Builder实践加速营`,content:`「AI 开放麦」第二期来啦！听说本期干货满满～直播主题：1 人 2 周从 0 搭建，用妙搭造出产品验货系统特邀嘉宾：陆炜烨（广东美西科技有限公司–产品企划）还在为验货流程混乱、人工判定出错、单据整理头大？他原本分…`,comments:2},{id:`d3`,author:`徐佳倩`,time:`3天前`,from:`AI Builder实践加速营`,content:`请收下这张飞书 AI Builder Demo Day 邀请函🎫  5/22 周五 11:00-12:00｜线上研讨会🎙 产品能力介绍：官方产品团队带来飞书 AI Builder 介绍，重点不是"功能罗列"，而是这些能力如何…`,comments:0}],discussions:[{id:`p1`,author:`王子瑜`,time:`5天前`,from:`AI Builder实践加速营`,title:`🍱「AI 开放麦」首期直播 来袭！`,paragraphs:[`98 年餐饮外贸人，花 2000 块用妙搭干了别人 3 万开发费的活。`,`他的工具折腾路线：WPS → 飞书多维表格 → 妙搭`,`最终用妙搭搭出一套完整外贸应用，再配合 AI 处理国际贸易文件 —— 技术描述、合同核对、原产地证，做完扔给 AI 检查，自己终审即可。`,`结果：开发成本和工作时间省了至少 70%。`,`他说："工具没有最好的，只有适不适合的。"`,`扫码预约直播，听一个真实用户怎么借助 Vibe Coding 把外贸全流程跑通 👇`],poster:{gradient:`linear-gradient(135deg, #e9efff 0%, #d3e1ff 100%)`,titleLines:[`从多维表格到应用开发，`,`用妙搭和 AI 重构餐饮外贸工作流`],tag:`AI 开放麦｜直播`,guest:`纪云鹏`,guestDesc:`河北风好餐饮管理有限公司 · 运营经理`,metric:`70%`,metricDesc:`开发成本 & 工作时间`},replies:[{id:`r1`,author:`徐佳倩`,text:`哇哦，大期待！`},{id:`r2`,author:`徐徐`,text:`听说已经在用妙搭接单了，太强了[赞]`},{id:`r3`,author:`王子瑜`,text:`@徐佳倩 活动还预留了互动时间！欢迎大家一起来交流自己的场景、痛点或疑问哦～`}]},{id:`p2`,author:`王子瑜`,time:`3天前`,from:`AI Builder实践加速营`,title:`「AI 开放麦」第二期来啦！听说本期干货满满～`,paragraphs:[`直播主题：1 人 2 周从 0 搭建，用妙搭造出产品验货系统`,`特邀嘉宾：陆炜烨（广东美西科技有限公司–产品企划）`,`还在为验货流程混乱、人工判定出错、单据整理头大？这期直播会带你看到一个产品人怎么用妙搭 × AI 在两周内从 0 到 1 打造出一套可落地的验货系统。`],replies:[]},{id:`p3`,author:`徐佳倩`,time:`3天前`,from:`AI Builder实践加速营`,title:`请收下这张飞书 AI Builder Demo Day 邀请函🎫`,paragraphs:[`5/22 周五 11:00-12:00｜线上研讨会🎙`,`产品能力介绍：官方产品团队带来飞书 AI Builder 介绍，重点不是"功能罗列"，而是这些能力如何在企业场景中落地。`],replies:[]}],relatedGroups:[{id:`g1`,name:`AI Builder实践加速营`,desc:`AI 时代，真正的价值属于实践者。本群专注分享 AI 赋能业务的最佳实…`,count:-1,avatar:`🌌`}],aiSet:{categories:[{key:`workshop`,label:`AI 工坊`},{key:`agent`,label:`智能体`},{key:`inspire`,label:`灵感市集`}],items:{workshop:[{id:`a1`,author:`赵生刚`,title:`多组织下的人力资源管理系统`,views:`396`,comments:1,cover:`linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)`,emoji:`📊`,avatarColor:`#4fc3f7`},{id:`a2`,author:`王子瑜`,title:`将图片转为"潦草"手绘风格`,views:`1.4k`,comments:0,cover:`linear-gradient(135deg, #fff8e6 0%, #fff0c2 100%)`,emoji:`🐱`,avatarColor:`#66bb6a`},{id:`a3`,author:`Leo`,title:`【技能】AI 短视频脚本生成器`,views:`5.7k`,comments:11,cover:`linear-gradient(135deg, #1a1f3a 0%, #3a2860 100%)`,emoji:`��`,dark:!0,avatarColor:`#ab47bc`},{id:`a4`,author:`华芮`,title:`【技能】— skill 永逸`,views:`5.8k`,comments:1,cover:`linear-gradient(135deg, #0d1124 0%, #1f2540 100%)`,emoji:`✨`,dark:!0,avatarColor:`#ef5350`},{id:`a5`,author:`影视飓风`,title:`【技能】项目导演日记`,views:`4.0k`,comments:0,cover:`linear-gradient(135deg, #f1f5ff 0%, #d6e0ff 100%)`,emoji:`🎬`,avatarColor:`#26a69a`,desc:`影视飓风同款项目管理工作流——说“记录一下”沉淀拍摄日志，说“复盘一下”自动生成阶段总结，让每一条现场笔记都不再丢失。`},{id:`a6`,author:`胡元奇`,title:`【技能】周报生成技能`,views:`3.4k`,comments:1,cover:`linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)`,emoji:`📝`,avatarColor:`#42a5f5`},{id:`a7`,author:`影视飓风`,title:`提词器【影视飓风同款】`,views:`7.2k`,comments:4,cover:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,emoji:`🎤`,dark:!0,avatarColor:`#26a69a`},{id:`a8`,author:`CHONG JIA...`,title:`维生素评估工具`,views:`219`,comments:0,cover:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`,emoji:`💊`,avatarColor:`#ff7043`},{id:`a9`,author:`宋利强`,title:`【技能】SKILL需求分析`,views:`2.3k`,comments:0,cover:`linear-gradient(135deg, #f1f5ff 0%, #dde6ff 100%)`,emoji:`📊`,avatarColor:`#5c6bc0`},{id:`a10`,author:`孔家锐`,title:`人员分布世界地图`,views:`193`,comments:0,cover:`linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`,emoji:`🌍`,avatarColor:`#66bb6a`},{id:`a11`,author:`陈刚`,title:`【技能】班味清零师`,views:`787`,comments:0,cover:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`,emoji:`😌`,avatarColor:`#ef5350`,desc:`专为被工作掏空、浑身班味的职场人打造的专属松弛陪伴搭子。用于帮用户快速剥离上班的紧绷状态，彻底消解职场负面情绪（疲惫、焦虑、内耗、烦躁、委屈、愤怒等），10...`},{id:`a12`,author:`蒋斌`,title:`【技能】Seedance2.0-Shot...`,views:`723`,comments:0,cover:`linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`,emoji:`🎮`,dark:!0,avatarColor:`#26c6da`},{id:`a13`,author:`王梦泽`,title:`【技能】风水大师：分析次日...`,views:`2.9k`,comments:0,cover:`linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)`,emoji:`🧭`,avatarColor:`#8d6e63`},{id:`a14`,author:`王子瑜`,title:`飓风同款 AI 生产力工具落地...`,views:`621`,comments:0,cover:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`,emoji:`🚀`,avatarColor:`#66bb6a`},{id:`a15`,author:`庄工`,title:`【技能】需求文档PRD编写技能`,views:`423`,comments:2,cover:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`,emoji:`📝`,avatarColor:`#78909c`},{id:`a16`,author:`华芮`,title:`【技能】赋能Token`,views:`755`,comments:0,cover:`linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%)`,emoji:`🔑`,avatarColor:`#ef5350`,desc:`专为被工作掏空、浑身班味的职场人打造的专属松弛陪伴搭子。用于帮用户快速剥离上班的紧绷状态，彻底消解职场负面情绪（疲惫、焦虑、内耗、烦躁、委屈、愤怒等），10...`}],agent:[{id:`b1`,author:`徐佳倩`,title:`创新产品设计专家`,desc:`你是一位产品创新设计师，擅长消费品概念开发和用户体验设计。请基于【...`,stars:17,views:`1155`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%)`},{id:`b2`,author:`王子瑜`,title:`vibe coding 必备的资深 UI 设计师`,desc:`角色设定 你是一位顶级的 Frontend Design Engineer (Vibe Coding 专家)...`,stars:13,views:`885`,avatarColor:`#ff7043`,thumbBg:`linear-gradient(135deg, #ffe8e0 0%, #ffd4c4 100%)`},{id:`b3`,author:`徐舒楠`,title:`《凡人修仙传》灵根测试`,desc:`###角色 你是《凡人修仙传》世界观中的灵根测试师，需根据用户提供的姓名、...`,stars:28,views:`6025`,avatarColor:`#42a5f5`,thumbBg:`linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)`},{id:`b4`,author:`徐佳倩`,title:`资深品牌战略专家`,desc:`你是一位资深品牌战略专家，精通品牌定位和营销传播。请为一个有【15年历...`,stars:17,views:`804`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)`},{id:`b5`,author:`武玥`,title:`自拍秒变【职场形象照】`,desc:`角色 (Persona) 你是一个名【AI形象管家】的智能代理，你的专长是为企业和...`,stars:36,views:`7611`,avatarColor:`#66bb6a`,thumbBg:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`},{id:`b6`,author:`徐佳倩`,title:`智能投资顾问`,desc:`1. 角色：你是一名专业的私人投资理财顾问。2. 目标：根据最新的国内外新闻...`,stars:15,views:`1220`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`},{id:`b7`,author:`何周航`,title:`AI 思维教练`,desc:`你是一个专注于辅助个人思考的AI思维教练。你的目标是帮助用户深化思考、理...`,stars:48,views:`1079`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)`},{id:`b8`,author:`王益新`,title:`提示词工程师`,desc:`角色：你是一个提示词工程师，负责根据给定的任务描述或现有提示，生成一个...`,stars:84,views:`2035`,avatarColor:`#26a69a`,thumbBg:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`},{id:`b9`,author:`杨泽仪`,title:`漫画带你学 AI`,desc:`# Role: AI 视觉化概念解构师 (AI Visual Explainer) ## 核心定位 你是一位擅长...`,stars:9,views:`575`,avatarColor:`#ffa726`,thumbBg:`linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)`},{id:`b10`,author:`王益新`,title:`艺术签名大师`,desc:`你是一位专业的艺术签名设计师，能够根据用户姓名生成多种风格的艺术签名图...`,stars:3,views:`546`,avatarColor:`#8d6e63`,thumbBg:`linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%)`},{id:`b11`,author:`武玥`,title:`AI 帮你"变废为宝"的智能修图助手`,desc:`##角色 你是一个专业的修图智能助手，能够根据用户需求对照片进行多种编辑...`,stars:12,views:`545`,avatarColor:`#66bb6a`,thumbBg:`linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)`},{id:`b12`,author:`徐佳倩`,title:`私人旅行顾问`,desc:`## 角色和目标 你是一位经验丰富的金牌旅游规划师，拥有广泛的全球旅游知识...`,stars:84,views:`4442`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`},{id:`b13`,author:`徐佳倩`,title:`你的公关专家：帮你快速应对公...`,desc:`##角色 你是一位顶级的商业战略顾问和公关危机处理专家，名叫"临危智囊"...`,stars:21,views:`1890`,avatarColor:`#7c4dff`,thumbBg:`linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%)`},{id:`b14`,author:`王益新`,title:`OKR 框架梳理助手`,desc:`你是专业的 OKR 梳理助手，能依据用户提供的工作描述、任务目标或项目计划，...`,stars:42,views:`3210`,avatarColor:`#26a69a`,thumbBg:`linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)`},{id:`b15`,author:`何周航`,title:`岗位胜任力分析专家`,desc:`你是一个专注于岗位胜任力分析与技能提升的智能体，根据用户提供的公司内部...`,stars:33,views:`2100`,avatarColor:`#ef5350`,thumbBg:`linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)`}],inspire:[{id:`i1`,author:`陶鑫`,avatarColor:`#e6d4a8`,time:`3天前`,title:`如何开发一个高质量 Skill：从官方案例到飞书 CLI 实践`,summary:`本文讨论了如何开发一个高质量 Skill，从定义、开发模式到具体案例和开发流程等方面进行了详细阐述`,likes:3,stars:16,coverGradient:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,coverTitle:`如何开发一个\n高质量 Skill`,coverDark:!0},{id:`i2`,author:`大象`,avatar:`🐘`,time:`3天前`,title:`10分钟搞定本地AI：Ollama 零成本接入你的OpenClaw`,summary:`核心价值：手把手教你在自己的电脑上跑一个真正可用的AI模型，断网也能用、数据不上云、反应飞快`,likes:1,stars:14,coverGradient:`linear-gradient(135deg, #1b2838 0%, #2a3f55 100%)`,coverTitle:`10分钟搞定本地AI：\nOllama 零成本接入你的OpenClaw`,coverDark:!0},{id:`i3`,author:`玄清`,avatarColor:`#ff5252`,time:`4天前`,title:`Anthropic 出了一份 AI 创业手册`,summary:`Anthropic 发布了一份面向 AI 原生创始人的完整行动手册，覆盖从创意验证到规模化的四个核心阶段。手册揭示了 AI 时代最反直觉的五个洞见：技术与非技术创始人的边界消失、创始人角色从执行者变为编排者、零摩擦构建是最大陷阱、领域上下文是新护城河、规模化的是…`,likes:6,stars:115,coverGradient:`linear-gradient(135deg, #e3f0ff 0%, #c4dcf5 100%)`,coverTitle:`AI 原生创业生命周期：2026 重启版`,coverDark:!1},{id:`i4`,author:`Oli芬`,avatarColor:`#ffb74d`,time:`3天前`,title:`探索Prompt的本质，带你解析AI时代的魔法咒语`,summary:`Prompt 不是"咒语"，而是你给大模型的任务说明、上下文材料和行为约束。它决定模型要做什么、基于什么信息做、用什么方式输出、哪些事情不能做。当我们使用AI的时候，Prompt 的价值不是会写几句神奇指令，而是能把任务背景、业务规则、边界和输出标准表达清楚…`,likes:1,stars:9,coverGradient:`linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)`,coverTitle:`探索Prompt的本质，\n带你解析AI时代的魔法咒语`,coverDark:!1},{id:`i5`,author:`玄清`,avatarColor:`#ff5252`,time:`4天前`,title:`Anthropic发布创业手册：AI时代，每个阶段的玩法都变了【去广告版】`,summary:`AI降低了创业门槛，但同时让最常见的失败陷阱变得更深。本文拆解创业四阶段的底层逻辑，帮助小白看懂AI时代真正的创业规则。`,likes:6,stars:32,coverGradient:`linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)`,coverTitle:`Anthropic刚发\n创业手册`,coverDark:!1}]}},aiWorkshop:[{id:`w1`,author:`肖遥`,title:`一人电商公司–商品管理系统`,views:`4.5k`,comments:9,cover:`linear-gradient(135deg, #fff5e6 0%, #ffe0c2 100%)`,emoji:`📦`},{id:`w2`,author:`肖遥`,title:`一人电商公司–竞品管理系统`,views:`853`,comments:0,cover:`linear-gradient(135deg, #efe6ff 0%, #d9c8ff 100%)`,emoji:`🏷️`},{id:`w3`,author:`纪金运`,title:`电商库存进出管理系统`,views:`9.9k`,comments:22,cover:`linear-gradient(135deg, #e6f0ff 0%, #c8d8ff 100%)`,emoji:`📊`},{id:`w4`,author:`绿育博`,title:`科技公司新品发布会报名页`,views:`1.6k`,comments:8,cover:`linear-gradient(135deg, #1a1f3a 0%, #3a2860 100%)`,emoji:`🚀`}],courses:[{id:`c1`,title:`一个餐饮外贸人的 AI 工具折腾史｜AI 开放麦 #EP01`,cover:`linear-gradient(135deg, #f0f4ff 0%, #e1ebff 100%)`,tag:`AI 开放麦`,liveTag:`直播`,chapters:2,learners:20,speaker:`一个餐饮外贸人的 AI 实战分享：商品采购与进销存管理`,detail:{description:`非技术背景的餐饮外贸从业者，独立用飞书妙搭搭建了完整的进销存系统，覆盖商品管理、采购、物流、报关、出入库全链路。`,tags:[`进阶级`,`飞书妙搭`,`飞书 aily`],progress:{current:0,total:2,status:`学习中`},toc:[{id:`ch1`,title:`分享妙记`,subtitle:`妙记`,icon:`📝`,required:!0},{id:`ch2`,title:`分享材料`,subtitle:`云文档`,icon:`📄`,required:!1,tag:`选修`}],incentive:{name:`飞行里程`,icon:`🚀`,points:20},channel:{name:`超级个体空间站`,desc:`一人进化成一支队伍的数字补给船`,subscribers:478,subscribed:!0,cover:`linear-gradient(135deg, #e3f0ff 0%, #c7d8ff 100%)`}}}],articles:[{id:`art1`,title:`保姆级教程：手把手教你 3 小时做出第一个微信小程序（配图+源码）`,author:`小机同学`,avatar:`🧑‍💻`,time:`3天前`,tags:[{text:`个人生活`,color:`orange`},{text:`通用场景`,color:`blue`}],summary:`手把手教你 3 小时做出第一个微信小程序`,likes:1,stars:24,thumbType:`doc`,thumb1:`linear-gradient(135deg, #fffaf0 0%, #fff3d6 100%)`,thumb2:`linear-gradient(135deg, #f4f7ff 0%, #e3ecff 100%)`,detail:{comments:3,favorites:43,desc:`手把手教你 3 小时做出第一个微信小程序`,toc:[{id:`t1`,text:`摘要`,level:1},{id:`t2`,text:`一、开局先拿“身份证”：注册账号 + 拿到那个关键AppID`,level:1},{id:`t2a`,text:`主体类型怎么选？`,level:2},{id:`t3`,text:`二、装上“作案工具”：微信开发者工具`,level:1},{id:`t4`,text:`三、新建项目（最关键的一步，盯紧了）`,level:1},{id:`t5`,text:`四、看懂小程序长啥样（四个文件就够了）`,level:1},{id:`t6`,text:`五、写第一个能点的页面（复制就行）`,level:1},{id:`t6a`,text:`第1步：改结构（index.wxml）`,level:2},{id:`t6b`,text:`第2步：改逻辑（index.js）`,level:2},{id:`t6c`,text:`第3步：改样式（index.wxss）`,level:2},{id:`t6d`,text:`保存后，立刻看左侧模拟器`,level:2},{id:`t7`,text:`六、用真机预览（在自己手机上打开）`,level:1},{id:`t8`,text:`七、发布上线（让别人也能搜到）`,level:1},{id:`t8a`,text:`第1步：上传代码`,level:2},{id:`t8b`,text:`第2步：去后台提交审核`,level:2}],body:[{type:`blockquote`,text:`你是不是也想过：“做个微信小程序，要不要学好几年前端？”
实话告诉你：不用。
今天这篇，就是连代码都不用自己从头脸的那种教程。
跟着教程走，3小时之内，你手机上能跑起来你的第一个小程序。`},{type:`heading`,text:`摘要`},{type:`paragraph`,text:`这篇教程从零开始，手把手教你：`},{type:`list`,items:[`注册小程序账号、拿到 AppID`,`安装微信开发者工具`,`新建项目、看懂文件结构`,`写第一个可点击的页面（3段代码搞定）`,`真机预览 + 发布上线`,`无代码备选方案`]},{type:`heading`,text:`一、开局先拿“身份证”：注册账号+拿到那个关键AppID`},{type:`paragraph`,text:`做小程序的第一步，不是写代码，而是去微信公众平台注册一个小程序账号。`},{type:`link`,text:`打开浏览器，访问：`,url:`mp.weixin.qq.com`},{type:`image`,gradient:`linear-gradient(135deg, #1a237e 0%, #283593 100%)`,alt:`微信公众平台注册页面`},{type:`paragraph`,text:`账号分类中选择“小程序”，按照提示填写信息即可完成注册。`}],moreWorks:[{title:`0代码基础文科小白5天上线原创海报...`,favorites:59,likes:9},{title:`0代码基础文科小白5天上线原创...`,favorites:13,likes:3}]}},{id:`art2`,title:`别被OPC一人公司神话骗了，90%的人都踩错了这4个致命坑~`,author:`子轩学长`,avatar:`👨‍🎓`,time:`11天前`,tags:[{text:`通用场景`,color:`blue`}],summary:`最近全网都在疯狂吹捧“OPC一人公司”，说什么“一个人干翻一个团队”、“AI让人人都能开公司”。我也亲眼看着身边90%跟风做一人公司的人，很多都失败了——他们要么累死累活赚不到钱，要么做了几个月就灰溜溜回去打工。 问题到底出在哪里？  答案其实早…`,likes:6,stars:39,thumbType:`stamp`,thumb1:`linear-gradient(135deg, #f7f5f0 0%, #ebe5d8 100%)`}],activities:[{id:`act1`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #0a1430 0%, #1a2456 60%, #4a3a7a 100%)`,coverTitle:`飞行社官方创作者`,coverTitle2:`入驻计划`,coverDesc:`寻找定义未来的 AI 创作者`,coverEmoji:`🖋️`,ctaText:`了解详情`,ctaStyle:`pill-blue`,title:`飞行社「官方创作者」入驻…`,summary:`在这里，你的知识不仅仅只是被阅读，而是被成千…`,status:`active`,statusText:`正在进行`,date:`5月10日–10月31日`,hasRegister:!0},{id:`act2`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #1a1230 0%, #3a2658 60%, #5a3878 100%)`,coverTitle:`AI 实战录 3.8 特辑`,coverTitle2:`她们用 AI 重写
规则的瞬间`,coverDesc:`AI 先锋们让想象力落地为生产力`,coverEmoji:`👩‍💻`,ctaText:`了解详情`,ctaStyle:`pill-violet`,title:`AI 实战录 3.8 特辑：见证她们工作进…`,summary:`一群 AI 先锋，正让想象力落地为生产力。本期聚…`,status:`ended`,statusText:`已结束`,date:`3月6日–3月13日`},{id:`act3`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #eef2ff 0%, #f5e8ff 50%, #ffe8f0 100%)`,coverTitle:`AI 实战录✧`,coverTitle2:`一起见证 100 个
工作进化瞬间`,coverDesc:`亲手改写企业的数字化命运`,coverEmoji:`👥`,ctaText:`了解详情`,ctaStyle:`pill-blue`,coverLight:!0,title:`AI 实战录：见证 100 个工作进化瞬间`,summary:`他们正在亲手改写企业的数字化命运，想象力正在…`,status:`ended`,statusText:`已结束`,date:`2月26日–4月30日`},{id:`act4`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #0d0d0d 0%, #2a1a08 60%, #6b3a0a 100%)`,coverTitle:`飞书 AI 效率先锋`,coverTitle2:`全国总决赛`,coverDesc:`直击 12 强决赛入围案例作品`,coverEmoji:`🏆`,ctaText:`查看详情`,ctaStyle:`pill-gold`,title:`2025 飞书 AI 效率先锋全国总决赛 12 …`,summary:`超 200 个全国顶尖、已真实落地的 AI 案例同台竞…`,status:`ended`,statusText:`已结束`,date:`12月3日 00:00–23:30`},{id:`act5`,badge:`直播`,liveTime:`2026年5月22日 11:00`,coverGradient:`linear-gradient(135deg, #eaf3ff 0%, #d6e6ff 100%)`,coverTitle:`飞书 AI Builder`,coverTitle2:`Demo Day`,coverDesc:`飞书 CLI x Agent，新的
上班方式正在发生`,coverEmoji:`🧩`,ctaText:`立即体验`,ctaStyle:`pill-blue-solid`,coverLight:!0,title:`Demo Day #1 飞书 CLI x Agent，新…`,summary:`本周五 (5/22) 11:00–12:00，我们会在飞书内做一…`,status:`ended`,statusText:`已结束`,date:`5月22日 11:00–12:00`},{id:`act6`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #1a1108 0%, #4a2f15 60%, #7a5028 100%)`,coverTitle:`NBTI`,coverTitle2:`职场“牛马”人格测试`,coverDesc:`30 道灵魂拷问，测出你的隐藏职场属性`,coverEmoji:`👼`,ctaText:``,title:`NBTI 职场“牛马”人格测试`,summary:`30 道灵魂拷问，测出你的隐藏职场属性`,status:`ended`,statusText:`已结束`,date:`4月17日–5月8日`},{id:`act7`,badge:`精选活动`,coverGradient:`linear-gradient(135deg, #08152e 0%, #0e2548 60%, #1a3a7a 100%)`,coverTitle:`飞书 CLI 创作者大赛`,coverTitle2:`用 Skill 改变世界`,coverDesc:`Mac Mini、安克 AI 录音豆、
京东卡等多种好礼等你来拿!`,coverEmoji:`💻`,ctaText:`立即参赛`,ctaStyle:`pill-blue-solid`,title:`飞书 CLI 创作者大赛：用 Skill 改变世界`,summary:`你是否已经用飞书 CLI 开发出了有趣的 Skill？你…`,status:`ended`,statusText:`已结束`,date:`4月1日–5月6日`}]}};

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

function getSubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = {
        'miaoda-ai': true,
        'feishu-classroom': true,
        'waytoagi': true,
        'pioneer': true,
        'aily': true,
        'feishu-new': true,
        'mvp-table': true,
        'pm-community': true,
        'openclaw': true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) || {};
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
      title: '研习社 AI Builder 正在火热招募中',
      subtitle: '加入「超级个体空间站」',
      desc: '成为超级个体，展示优秀实践，收获你的粉丝',
      ctaText: '申请入驻',
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
      ...(MOCK_CHANNEL_DETAILS[id] || buildDefaultDetail(ch)),
      contentCount: ch.contentCount,
      updatedDesc: ch.updatedDesc,
      subscribers: ch.subscribers,
      subscribersText: ch.subscribersText,
      subscribed: !!subs[id],
      accent: ch.accent,
    };
  },

  async getPlaygroundItems(subKey = 'workshop') {
    await delay(150);
    const detail = MOCK_CHANNEL_DETAILS['super-individual'];
    return detail && detail.aiSet.items[subKey] || [];
  },
};
