import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const TMP_DIR = process.env.TMP_DIR;
const FINAL_PPTX = process.env.FINAL_PPTX;

if (!TMP_DIR || !FINAL_PPTX) {
  throw new Error("TMP_DIR and FINAL_PPTX must be set.");
}

const W = 1280;
const H = 720;
const C = {
  black: "#050505",
  text: "#111111",
  muted: "#666666",
  light: "#f2f2f2",
  mid: "#e8e8e8",
  line: "#bfc4cc",
  darkLine: "#6c6f76",
  white: "#ffffff",
};

const SOURCES = {
  aiNative: "/Users/zhanghl/Documents/GitHub/guoren-v2/docs/ai-native-driven-system-use-cases.md",
  compare: "/Users/zhanghl/Documents/GitHub/guoren-v2/docs/guoren-vs-learnbuddy-ai-native-platform.md",
  showroom: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/solutionShowroom/SolutionShowroomPortal.jsx",
  topic: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/TopicDetail.jsx",
  luckyModule: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/lucky/LuckyModule.jsx",
  resourceLib: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/resourceLib/ResourceLibrary.jsx",
  knowledgeSpace: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/knowledgeSpace/KnowledgeSpaceModule.jsx",
  solutionPrototype: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/solutionPrototype/SolutionPrototypeModule.jsx",
  ref1: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-fe142be4-2baa-4fdb-8293-9f8e62f1a49d.png",
  ref2: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-e6a131c5-9be4-4c66-a04c-7f40c1f6776f.png",
  luckyRef: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-84e60447-97c7-4d3e-93d7-2321f91ae6a7.png",
  moduleRef: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-78400771-9e11-4cc4-8bff-d2626c6a3e16.png",
};

function pos(left, top, width, height) {
  return { left, top, width, height };
}

function addShape(slide, geometry, p, opts = {}) {
  const config = {
    geometry,
    position: pos(p.x, p.y, p.w, p.h),
    fill: opts.fill ?? "none",
    line: opts.line ?? { style: "solid", fill: "none", width: 0 },
    name: opts.name,
  };
  if (["rect", "textbox", "roundRect"].includes(geometry)) {
    config.borderRadius = opts.radius ?? 0;
  }
  return slide.shapes.add(config);
}

function addText(slide, text, p, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name: opts.name,
    position: pos(p.x, p.y, p.w, p.h),
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    fontSize: opts.size ?? 22,
    bold: opts.bold ?? false,
    color: opts.color ?? C.text,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    lineSpacing: opts.lineSpacing ?? 1.12,
    typeface: "PingFang SC",
    wrap: opts.wrap ?? "square",
    insets: opts.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return box;
}

function addRule(slide, x, y, w, color = C.line, h = 2) {
  return addShape(slide, "rect", { x, y, w, h }, {
    fill: color,
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function addCard(slide, p, opts = {}) {
  return addShape(slide, "rect", p, {
    fill: opts.fill ?? C.light,
    line: opts.line ?? { style: "solid", fill: C.line, width: 1 },
    radius: opts.radius ?? 0,
    name: opts.name,
  });
}

function addRightArrow(slide, x, y, w, h, label) {
  addShape(slide, "rightArrow", { x, y, w, h }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  if (label) {
    addText(slide, label, { x: x - 8, y: y + h + 18, w: w + 40, h: 30 }, {
      size: 18,
      color: C.muted,
      align: "center",
    });
  }
}

function addHeader(slide, { kicker, title, subtitle, page, titleSize = 42 }) {
  slide.background.fill = C.white;
  if (kicker) {
    addText(slide, kicker, { x: 52, y: 44, w: 420, h: 30 }, {
      size: 20,
      bold: true,
      color: C.muted,
    });
  }
  addText(slide, title, { x: 52, y: 86, w: 1120, h: 58 }, {
    size: titleSize,
    bold: true,
    color: C.black,
    lineSpacing: 1.02,
  });
  if (subtitle) {
    addText(slide, subtitle, { x: 52, y: 146, w: 1110, h: 42 }, {
      size: 20,
      color: C.muted,
      lineSpacing: 1.16,
    });
  }
  addRule(slide, 52, subtitle ? 204 : 184, 1176, C.line, 2);
  if (page) {
    addText(slide, String(page).padStart(2, "0"), { x: 1182, y: 660, w: 46, h: 24 }, {
      size: 16,
      color: "#8a8a8a",
      align: "right",
    });
  }
}

function setNotes(slide, lines, sourceKeys = []) {
  const sourceLines = sourceKeys.map((key) => {
    const label = {
      aiNative: "AI 原生业务执行模式本地文档",
      compare: "果仁与 LearnBuddy 对比分析本地文档",
      showroom: "果仁样板间产品页面源码",
      topic: "空间模式产品源码",
      luckyModule: "Lucky 模块源码",
      resourceLib: "资料库模块源码",
      knowledgeSpace: "知识空间模块源码",
      solutionPrototype: "解决方案原型模块源码",
      ref1: "用户提供参考图 1",
      ref2: "用户提供参考图 2",
      luckyRef: "用户提供 Lucky 核心功能截图",
      moduleRef: "用户提供模块补充截图",
    }[key];
    return `- ${label}: ${SOURCES[key]}`;
  });
  slide.speakerNotes.textFrame.setText([
    ...lines,
    "",
    "[Sources]",
    ...sourceLines,
    "- No external web sources or third-party visual assets were used.",
  ]);
  slide.speakerNotes.setVisible(true);
}

function titleSlide(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  addText(slide, "智能体建设平台路演", { x: 52, y: 58, w: 500, h: 34 }, {
    size: 22,
    bold: true,
    color: C.muted,
  });
  addText(slide, "Lucky 智能体建设平台", { x: 52, y: 150, w: 940, h: 82 }, {
    size: 60,
    bold: true,
    color: C.black,
    lineSpacing: 1.02,
  });
  addText(slide, "用资料库沉淀知识，用空间承载业务，让智能体从问答走向任务执行。", { x: 54, y: 256, w: 840, h: 72 }, {
    size: 26,
    color: C.muted,
  });
  addRule(slide, 54, 406, 360, C.black, 4);
  const tags = ["知识资产", "场景模板", "智能体运营"];
  tags.forEach((tag, i) => {
    addCard(slide, { x: 54 + i * 176, y: 452, w: 142, h: 54 }, {
      fill: i === 0 ? C.black : C.light,
      line: { style: "solid", fill: i === 0 ? C.black : C.line, width: 1 },
    });
    addText(slide, tag, { x: 54 + i * 176, y: 466, w: 142, h: 26 }, {
      size: 20,
      bold: true,
      color: i === 0 ? C.white : C.black,
      align: "center",
    });
  });
  addShape(slide, "rect", { x: 1010, y: 66, w: 174, h: 574 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "AGENT\nBUILD\nPLATFORM", { x: 1022, y: 214, w: 150, h: 176 }, {
    size: 26,
    bold: true,
    color: C.white,
    align: "center",
    lineSpacing: 1.02,
  });
  addText(slide, "Lucky + 资料库 + 空间", { x: 990, y: 652, w: 220, h: 26 }, {
    size: 18,
    color: C.muted,
    align: "center",
  });
  setNotes(slide, [
    "Open by positioning this as a platform for building and operating agents, not as a single chatbot product.",
  ], ["aiNative", "compare", "showroom"]);
}

function slideProblem(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "市场判断",
    title: "客户真正需要的是可建设的智能体体系",
    subtitle: "单点 AI 工具很容易演示，但很难持续交付、复用和治理。",
    page: 2,
  });
  const cards = [
    ["知识不可控", "资料分散在文件、群聊和个人经验里，智能体回答难追溯、难更新。"],
    ["场景不可复用", "每次项目都重新搭流程、导资料、配权限，交付能力很难规模化。"],
    ["智能体不可运营", "创建一个助手不难，难的是持续管理角色、技能、成本、效果和责任边界。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 72 + i * 392;
    addCard(slide, { x, y: 258, w: 330, h: 220 }, { fill: i === 1 ? C.black : C.light });
    addText(slide, t, { x: x + 26, y: 292, w: 270, h: 38 }, {
      size: 28,
      bold: true,
      color: i === 1 ? C.white : C.black,
    });
    addText(slide, b, { x: x + 26, y: 356, w: 270, h: 88 }, {
      size: 21,
      color: i === 1 ? "#eeeeee" : C.text,
      lineSpacing: 1.18,
    });
  });
  addText(slide, "平台的价值，是把一次性智能问答变成可治理、可复制、可进化的组织能力。", { x: 132, y: 570, w: 1016, h: 42 }, {
    size: 28,
    bold: true,
    color: C.black,
    align: "center",
  });
  setNotes(slide, [
    "Use this slide to create the need for a construction platform: knowledge, scenarios, and agent operations must be managed together.",
  ], ["aiNative", "compare"]);
}

function slideArchitecture(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "核心架构",
    title: "Lucky、资料库和空间构成平台的核心业务架构",
    page: 3,
  });
  const y = 300;
  const boxes = [
    ["资料库 / 知识库", "业务资料统一沉淀，形成可检索、可复用、可问答、可生成的知识资产。", "知识底座"],
    ["空间", "承载培训、教研、教学和项目协作，把成员、权限、流程、工具和成果组织起来。", "业务载体"],
    ["Lucky 智能体", "可独立使用，也可导入空间，为不同角色提供问答、生成、分析和任务辅助。", "智能引擎"],
  ];
  boxes.forEach(([t, b, f], i) => {
    const x = 72 + i * 448;
    addCard(slide, { x, y, w: 276, h: 292 }, { fill: C.light });
    addText(slide, t, { x: x + 32, y: y + 38, w: 212, h: 38 }, {
      size: 28,
      bold: true,
      align: "center",
    });
    addText(slide, b, { x: x + 34, y: y + 112, w: 208, h: 104 }, {
      size: 21,
      color: C.text,
      align: "center",
      lineSpacing: 1.18,
    });
    addText(slide, f, { x: x + 34, y: y + 244, w: 208, h: 32 }, {
      size: 22,
      bold: true,
      color: C.muted,
      align: "center",
    });
  });
  addRightArrow(slide, 378, 392, 118, 50, "资料进入业务");
  addRightArrow(slide, 826, 392, 118, 50, "AI 赋能角色");
  setNotes(slide, [
    "This diagram follows the user's reference image: knowledge enters the business space, then Lucky empowers roles and execution.",
  ], ["aiNative", "showroom", "ref1"]);
}

function slidePipeline(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "建设逻辑",
    title: "平台不是聊天入口，而是一套智能体建设流水线",
    subtitle: "每个智能体都需要知识来源、业务边界、权限规则和运营指标。",
    page: 4,
  });
  const steps = [
    ["01", "导入资料", "文档、案例、课程、流程和项目记录进入资料库"],
    ["02", "知识治理", "解析、标签、版本、来源和权限形成可用资产"],
    ["03", "创建空间", "把成员、目标、流程、工具和成果组织成场景"],
    ["04", "配置角色", "为教师、运营、项目经理等角色配置智能体"],
    ["05", "运行任务", "问答、生成、分析、提醒、转交和协作推进"],
    ["06", "评估优化", "看使用效果、命中率、成本、满意度和沉淀质量"],
  ];
  addRule(slide, 94, 360, 1092, C.black, 3);
  steps.forEach(([num, title, body], i) => {
    const x = 74 + i * 190;
    addText(slide, num, { x, y: 260, w: 72, h: 34 }, {
      size: 28,
      bold: true,
      color: C.black,
    });
    addShape(slide, "ellipse", { x: x + 4, y: 348, w: 18, h: 18 }, {
      fill: C.black,
      line: { style: "solid", fill: "none", width: 0 },
    });
    addText(slide, title, { x, y: 392, w: 142, h: 34 }, {
      size: 24,
      bold: true,
      color: C.black,
    });
    addText(slide, body, { x, y: 442, w: 152, h: 94 }, {
      size: 18,
      color: C.muted,
      lineSpacing: 1.18,
    });
  });
  addCard(slide, { x: 184, y: 586, w: 912, h: 50 }, {
    fill: C.black,
    line: { style: "solid", fill: C.black, width: 1 },
  });
  addText(slide, "从“创建一个机器人”升级为“建设一套可运营的智能体能力”。", { x: 210, y: 599, w: 860, h: 28 }, {
    size: 22,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "Frame the product as a repeatable construction pipeline that customers can start small and expand over time.",
  ], ["aiNative", "showroom"]);
}

function slideKnowledgeBase(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "能力一",
    title: "资料库把组织资产变成智能体可用的知识底座",
    page: 5,
  });
  addShape(slide, "rect", { x: 72, y: 248, w: 350, h: 334 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "资料库", { x: 106, y: 292, w: 282, h: 60 }, {
    size: 44,
    bold: true,
    color: C.white,
  });
  addText(slide, "不是文件仓库，而是可检索、可引用、可生成的知识资产层。", { x: 108, y: 382, w: 260, h: 104 }, {
    size: 23,
    color: "#eeeeee",
    lineSpacing: 1.16,
  });
  const items = [
    ["资料统一沉淀", "课程资料、制度流程、项目文档、案例模板进入统一资产池。"],
    ["解析与标签", "围绕主题、场景、角色和权限建立检索与生成上下文。"],
    ["来源可追溯", "回答、生成和分析都能回到资料来源，减少黑箱输出。"],
    ["模板案例复用", "把高频方案、交付经验和最佳实践变成可调用资产。"],
  ];
  items.forEach(([t, b], i) => {
    const x = 492 + (i % 2) * 352;
    const y = 250 + Math.floor(i / 2) * 174;
    addCard(slide, { x, y, w: 304, h: 130 }, { fill: C.light });
    addText(slide, t, { x: x + 22, y: y + 22, w: 256, h: 30 }, {
      size: 24,
      bold: true,
    });
    addText(slide, b, { x: x + 22, y: y + 66, w: 256, h: 48 }, {
      size: 19,
      color: C.muted,
      lineSpacing: 1.14,
    });
  });
  setNotes(slide, [
    "Explain that knowledge quality is the prerequisite for reliable agent construction.",
  ], ["compare", "showroom"]);
}

function slideSpace(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "能力二",
    title: "空间把业务场景变成智能体可执行的工作场",
    page: 6,
  });
  addCard(slide, { x: 116, y: 252, w: 1048, h: 324 }, { fill: C.light });
  addText(slide, "业务空间", { x: 516, y: 284, w: 248, h: 48 }, {
    size: 38,
    bold: true,
    align: "center",
  });
  const zones = [
    ["成员 / 角色", "老师、学员、运营、项目经理、专家和管理员"],
    ["流程 / 任务", "计划、待办、审批、提醒、复盘和异常转交"],
    ["工具 / 成果", "研讨会、问卷、资料、白板、作业和报告"],
    ["权限 / 数据", "资料范围、角色权限、过程记录和效果数据"],
  ];
  zones.forEach(([t, b], i) => {
    const x = i < 2 ? 160 : 790;
    const y = i % 2 === 0 ? 348 : 458;
    addCard(slide, { x, y, w: 330, h: 82 }, {
      fill: C.white,
      line: { style: "solid", fill: C.line, width: 1 },
    });
    addText(slide, t, { x: x + 22, y: y + 14, w: 284, h: 26 }, {
      size: 22,
      bold: true,
    });
    addText(slide, b, { x: x + 22, y: y + 46, w: 284, h: 24 }, {
      size: 16,
      color: C.muted,
    });
  });
  addText(slide, "空间让智能体不只知道“答案”，还知道“在哪个业务场景里、为哪个角色、按照什么规则做事”。", { x: 148, y: 612, w: 984, h: 36 }, {
    size: 24,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Space is the business container: it binds people, permissions, workflows, tools, and outputs into an executable context.",
  ], ["aiNative", "showroom"]);
}

function slideResourceLibrarySupplement(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "模块补充",
    title: "资料库统一管理多类型资料，并让资料天然可被智能体调用",
    subtitle: "资料库不只是上传文件，而是把业务资料、学习材料、过程产物和评价结果变成可识别、可生成、可复用的资产。",
    page: 7,
    titleSize: 38,
  });

  addShape(slide, "rect", { x: 64, y: 246, w: 424, h: 302 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "资料类型", { x: 98, y: 282, w: 356, h: 42 }, {
    size: 32,
    bold: true,
    color: C.white,
  });
  addText(slide, "覆盖 office、md、pdf、音视频、会议回放、在线文档、白板、问卷、投票、考试、报名、接龙、测评、实训任务、知识图谱、能力模型、虚拟课堂、html 课件、案例仿真和 AI 课堂评价报告等。", { x: 100, y: 340, w: 350, h: 130 }, {
    size: 18,
    color: "#eeeeee",
    lineSpacing: 1.18,
  });
  addRule(slide, 100, 492, 350, "#4a4a4a", 1);
  addText(slide, "通过【资料库】模块实现", { x: 100, y: 506, w: 350, h: 26 }, {
    size: 20,
    bold: true,
    color: C.white,
    align: "center",
  });

  const aiCards = [
    ["智能体识别所有资料", "资料进入统一资产层后，可以成为问答、分析、推荐和生成的上下文来源。"],
    ["智能体生成各类资料", "方案、课件、报告、问卷、任务和评价材料都可以由智能体辅助产出。"],
    ["资料沉淀到业务过程", "资料不再停留在文件夹里，可以被空间、项目和 Lucky 在真实任务中持续调用。"],
  ];
  aiCards.forEach(([title, body], i) => {
    const x = i === 2 ? 536 : 536 + i * 330;
    const y = i === 2 ? 432 : 250;
    const w = i === 2 ? 660 : 296;
    const h = i === 2 ? 116 : 138;
    addCard(slide, { x, y, w, h }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: x + 24, y: y + 24, w: w - 48, h: 30 }, {
      size: 24,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    addText(slide, body, { x: x + 30, y: y + 68, w: w - 60, h: h - 82 }, {
      size: 17,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });

  addShape(slide, "rect", { x: 166, y: 604, w: 948, h: 50 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "资料库让知识资产从“存起来”，变成“智能体能理解并直接参与业务”。", { x: 204, y: 618, w: 872, h: 24 }, {
    size: 22,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "Supplement the knowledge-base section with the user's module screenshot: resource library unifies many resource types and makes them AI-recognizable and AI-generatable.",
  ], ["moduleRef", "resourceLib", "solutionPrototype"]);
}

function slideSpaceSupplement(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "模块补充",
    title: "空间承载多场景业务，并把资料、成员、组件和智能体组织起来",
    subtitle: "组织培训、教研、教学等场景可以在空间中组合资料库、任务、日历、IM、权限和智能体能力。",
    page: 8,
    titleSize: 38,
  });

  const cards = [
    ["多场景支持", "覆盖组织培训、教研、教学等场景，支持后续自定义场景模式。"],
    ["引用资料库", "场景内可引用资料库内容，让教、学、研资料类型更丰富。"],
    ["灵活考核", "可面向不同资料设置考核规则，并逐步支持拖拽配置考核内容。"],
    ["引入智能体", "智能体感知场景数据和活动，形成助学、助管、助评、助教能力。"],
    ["协同组件", "内置任务、日历、IM，支持任务下发、日程查看和团队沟通。"],
    ["权限与模式", "支持人员导入、功能权限、数据权限，以及知识、AI、实训等模式。"],
  ];
  cards.forEach(([title, body], i) => {
    const x = 64 + (i % 3) * 390;
    const y = 248 + Math.floor(i / 3) * 154;
    const dark = i === 3;
    addCard(slide, { x, y, w: 340, h: 122 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: x + 24, y: y + 22, w: 292, h: 28 }, {
      size: 23,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    addText(slide, body, { x: x + 28, y: y + 62, w: 284, h: 42 }, {
      size: 15,
      color: dark ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.13,
    });
  });

  addShape(slide, "rect", { x: 116, y: 588, w: 1048, h: 70 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "AI 原生：场景可被智能体识别和创建，包括场景内组件。通过【空间】模块实现。", { x: 174, y: 610, w: 932, h: 28 }, {
    size: 22,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "Supplement the space section with the user's screenshot: space supports multi-scenario business, resource references, assessment rules, built-in collaboration components, permission control, and AI-native scene creation.",
  ], ["moduleRef", "topic", "solutionPrototype"]);
}

function slideKnowledgeSpaceSupplement(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "模块补充",
    title: "知识空间支持多组织知识体系，让不同部门拥有自己的知识边界",
    subtitle: "知识空间面向组织、部门和项目建立知识体系，并通过成员、角色、可见范围和图谱绑定保持治理边界。",
    page: 9,
    titleSize: 38,
  });

  addShape(slide, "rect", { x: 74, y: 250, w: 344, h: 318 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "知识空间", { x: 110, y: 296, w: 272, h: 48 }, {
    size: 36,
    bold: true,
    color: C.white,
    align: "center",
  });
  addText(slide, "把部门、项目和组织的知识体系分别建起来，既能沉淀团队经验，也能控制成员和访问边界。", { x: 114, y: 370, w: 264, h: 92 }, {
    size: 20,
    color: "#eeeeee",
    align: "center",
    lineSpacing: 1.18,
  });
  addText(slide, "通过【知识空间】模块实现", { x: 110, y: 504, w: 272, h: 28 }, {
    size: 20,
    bold: true,
    color: C.white,
    align: "center",
  });

  const columns = [
    ["多组织知识体系", "按组织、部门、项目建立独立知识体系，支持教学、教研、培训和项目知识空间。"],
    ["成员与权限", "为不同组织设置成员、角色、可见范围和访问权限，保留数据边界。"],
    ["图谱与资料绑定", "从资料库绑定知识图谱，把资料、知识点和学习/研究路径组织起来。"],
  ];
  columns.forEach(([title, body], i) => {
    const x = 470 + i * 244;
    addCard(slide, { x, y: 250, w: 220, h: 318 }, {
      fill: i === 1 ? C.light : C.white,
      line: { style: "solid", fill: C.line, width: 1 },
    });
    addText(slide, title, { x: x + 15, y: 298, w: 190, h: 52 }, {
      size: 22,
      bold: true,
      align: "center",
      lineSpacing: 1.08,
    });
    addText(slide, body, { x: x + 24, y: 382, w: 172, h: 104 }, {
      size: 17,
      color: C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
    addRule(slide, x + 56, 520, 108, C.black, 2);
    addText(slide, i === 0 ? "分组织沉淀" : i === 1 ? "按权限治理" : "连接知识图谱", { x: x + 20, y: 536, w: 180, h: 20 }, {
      size: 15,
      bold: true,
      color: C.text,
      align: "center",
    });
  });

  addText(slide, "知识空间让资料库中的资产变成有组织、有角色、有权限的知识体系。", { x: 174, y: 624, w: 932, h: 28 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Supplement the platform architecture with knowledge space: the user's screenshot emphasizes multi-organization knowledge systems, member setup, permissions, and department-owned knowledge systems.",
  ], ["moduleRef", "knowledgeSpace", "solutionPrototype"]);
}

function slideLucky(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "能力三",
    title: "Lucky 让智能体从回答问题走向完成任务",
    page: 10,
  });
  const steps = [
    ["理解目标", "多轮澄清需求、对象、约束和成功标准"],
    ["拆解计划", "生成任务步骤、责任角色和执行顺序"],
    ["调用工具", "检索资料、生成内容、配置空间和创建任务"],
    ["推进协作", "提醒、催办、异常识别和人工转交"],
    ["汇总沉淀", "形成报告、FAQ、案例和下一轮优化建议"],
  ];
  steps.forEach(([t, b], i) => {
    const x = 66 + i * 238;
    addCard(slide, { x, y: 296, w: 190, h: 162 }, { fill: i === 2 ? C.black : C.light });
    addText(slide, t, { x: x + 18, y: 326, w: 154, h: 30 }, {
      size: 24,
      bold: true,
      color: i === 2 ? C.white : C.black,
      align: "center",
    });
    addText(slide, b, { x: x + 20, y: 382, w: 150, h: 58 }, {
      size: 17,
      color: i === 2 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.14,
    });
    if (i < 4) {
      addRightArrow(slide, x + 196, 352, 54, 30, "");
    }
  });
  addCard(slide, { x: 272, y: 538, w: 736, h: 58 }, {
    fill: C.white,
    line: { style: "solid", fill: C.darkLine, width: 1 },
  });
  addText(slide, "人的角色回到目标确认、专业校准、关键判断和风险决策。", { x: 304, y: 553, w: 672, h: 30 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Make the human-agent responsibility boundary clear: Lucky executes and assists, humans confirm and judge key decisions.",
  ], ["aiNative"]);
}

function slideLuckyCoreOverview(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "Lucky 功能总览",
    title: "Lucky 的核心功能覆盖任务执行、智能体建设和能力生态",
    subtitle: "办公和编程是两种工作模式，六个入口连接任务、项目、资源和生态。",
    page: 11,
    titleSize: 38,
  });

  addCard(slide, { x: 60, y: 248, w: 286, h: 310 }, { fill: C.light });
  addText(slide, "工作模式", { x: 92, y: 278, w: 220, h: 32 }, {
    size: 26,
    bold: true,
    align: "center",
  });
  const modes = [
    ["办公", "面向资料处理、内容生成、任务协同和项目推进。", true],
    ["编程", "面向代码生成、脚本调试、技能创建和自动化开发。", false],
  ];
  modes.forEach(([title, desc, active], i) => {
    const y = 340 + i * 92;
    addCard(slide, { x: 88, y, w: 230, h: 66 }, {
      fill: active ? C.black : C.white,
      line: { style: "solid", fill: active ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: 108, y: y + 10, w: 70, h: 28 }, {
      size: 22,
      bold: true,
      color: active ? C.white : C.black,
    });
    addText(slide, desc, { x: 180, y: y + 12, w: 118, h: 38 }, {
      size: 14,
      color: active ? "#eeeeee" : C.muted,
      lineSpacing: 1.12,
    });
  });

  const navItems = [
    ["新任务", "发起目标"],
    ["自动化", "沉淀流程"],
    ["智能体", "配置角色"],
    ["项目", "组织上下文"],
    ["资源库", "复用资料"],
    ["市场", "专家 · 技能"],
  ];
  navItems.forEach(([title, desc], i) => {
    const x = 406 + (i % 3) * 250;
    const y = 250 + Math.floor(i / 3) * 122;
    addCard(slide, { x, y, w: 210, h: 88 }, {
      fill: i === 2 ? C.black : C.light,
      line: { style: "solid", fill: i === 2 ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: x + 22, y: y + 18, w: 166, h: 28 }, {
      size: 24,
      bold: true,
      color: i === 2 ? C.white : C.black,
      align: "center",
    });
    addText(slide, desc, { x: x + 22, y: y + 54, w: 166, h: 20 }, {
      size: 16,
      color: i === 2 ? "#d8d8d8" : C.muted,
      align: "center",
    });
  });

  addText(slide, "常用动作", { x: 406, y: 512, w: 160, h: 30 }, {
    size: 24,
    bold: true,
  });
  const actions = ["幻灯片", "深度研究", "数据可视化", "产品原型", "日常办公", "图像生成"];
  actions.forEach((action, i) => {
    const x = 566 + i * 104;
    addCard(slide, { x, y: 508, w: 96, h: 42 }, {
      fill: i % 2 === 0 ? C.white : C.light,
      line: { style: "solid", fill: C.line, width: 1 },
    });
    addText(slide, action, { x: x + 6, y: 520, w: 84, h: 18 }, {
      size: 13,
      bold: true,
      align: "center",
    });
  });

  addShape(slide, "rect", { x: 248, y: 600, w: 784, h: 52 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "Lucky 的入口不是功能清单，而是组织建设智能体能力的工作台。", { x: 284, y: 614, w: 712, h: 28 }, {
    size: 22,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "Introduce Lucky's actual workspace modes and navigation entries before going into grouped capability pages.",
  ], ["luckyModule", "solutionPrototype", "luckyRef"]);
}

function slideLuckyTaskExecution(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "任务执行层",
    title: "Lucky 把“提问”升级为任务推进",
    subtitle: "自然语言入口负责发起目标，自动化和项目能力负责把目标持续推进到结果。",
    page: 12,
  });

  const columns = [
    ["新任务", "从自然语言发起目标", "连接智能伙伴、项目上下文和云端工具，让用户不用先找菜单。", ["描述目标", "选择智能伙伴", "进入项目工作"]],
    ["自动化", "把重复任务沉淀成流程", "按时间、状态和负责人触发提醒、资料归档和进度同步。", ["消息提醒", "资料归档", "进度同步"]],
    ["项目", "围绕真实业务组织上下文", "集中管理任务、资料、成员、输出和阶段成果，保留复盘依据。", ["AI 培训项目", "市场研究项目", "产品原型项目"]],
  ];
  columns.forEach(([title, lead, body, chips], i) => {
    const x = 72 + i * 392;
    addCard(slide, { x, y: 258, w: 330, h: 298 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: x + 28, y: 294, w: 274, h: 38 }, {
      size: 30,
      bold: true,
      color: i === 1 ? C.white : C.black,
    });
    addText(slide, lead, { x: x + 28, y: 344, w: 274, h: 28 }, {
      size: 20,
      bold: true,
      color: i === 1 ? "#eeeeee" : C.text,
    });
    addText(slide, body, { x: x + 28, y: 392, w: 274, h: 62 }, {
      size: 19,
      color: i === 1 ? "#dddddd" : C.muted,
      lineSpacing: 1.15,
    });
    chips.forEach((chip, j) => {
      addCard(slide, { x: x + 28, y: 476 + j * 26, w: 150, h: 20 }, {
        fill: i === 1 ? "#1f1f1f" : C.white,
        line: { style: "solid", fill: i === 1 ? "#666666" : C.line, width: 1 },
      });
      addText(slide, chip, { x: x + 40, y: 479 + j * 26, w: 126, h: 14 }, {
        size: 12,
        color: i === 1 ? C.white : C.text,
        align: "center",
      });
    });
  });

  addCard(slide, { x: 210, y: 606, w: 860, h: 48 }, {
    fill: C.white,
    line: { style: "solid", fill: C.darkLine, width: 1 },
  });
  addText(slide, "任务执行层让 Lucky 从一次性生成，走向可跟进、可归档、可复盘的业务过程。", { x: 242, y: 620, w: 796, h: 24 }, {
    size: 21,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Use the actual Lucky module copy for automation and project semantics, then connect it to task execution.",
  ], ["luckyModule", "aiNative"]);
}

function slideLuckyAgentEcosystem(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "建设与生态层",
    title: "Lucky 不只是内置助手，而是可配置、可扩展、可运营的平台",
    subtitle: "智能体、资源库、市场和编程模式共同构成持续扩展的能力生态。",
    page: 13,
    titleSize: 39,
  });

  const cards = [
    ["智能体", "管理可协作的智能伙伴", "支持档案、技能、知识、模型、管理等配置，让不同角色进入同一任务体系。"],
    ["资源库", "沉淀资料和知识上下文", "沉淀资料、产物、模板和任务输出，作为智能体可检索和引用的资料范围。"],
    ["市场", "分发可复用能力", "提供专家、技能、最佳实践、企业智能体等能力，让组织按场景招募和复用。"],
  ];
  cards.forEach(([title, lead, body], i) => {
    const x = 68 + i * 386;
    addCard(slide, { x, y: 264, w: 320, h: 212 }, {
      fill: i === 0 ? C.black : C.light,
      line: { style: "solid", fill: i === 0 ? C.black : C.line, width: 1 },
    });
    addText(slide, title, { x: x + 28, y: 296, w: 264, h: 34 }, {
      size: 28,
      bold: true,
      color: i === 0 ? C.white : C.black,
      align: "center",
    });
    addText(slide, lead, { x: x + 28, y: 342, w: 264, h: 26 }, {
      size: 20,
      bold: true,
      color: i === 0 ? "#eeeeee" : C.text,
      align: "center",
    });
    addText(slide, body, { x: x + 30, y: 386, w: 260, h: 72 }, {
      size: 16,
      color: i === 0 ? "#dddddd" : C.muted,
      align: "center",
      lineSpacing: 1.14,
    });
  });

  addShape(slide, "rect", { x: 106, y: 512, w: 1068, h: 86 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "编程模式", { x: 148, y: 536, w: 150, h: 34 }, {
    size: 28,
    bold: true,
    color: C.white,
  });
  addText(slide, "作为技术任务入口，覆盖代码生成、脚本调试、技能创建和自动化开发辅助。", { x: 330, y: 538, w: 820, h: 30 }, {
    size: 22,
    bold: true,
    color: C.white,
  });
  addText(slide, "从内置智能体，到组织自建智能体，再到市场生态，Lucky 的能力可以被持续配置和运营。", { x: 172, y: 626, w: 936, h: 28 }, {
    size: 22,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Connect Lucky's agent editor tabs, library scopes, and market categories to the platform construction story.",
  ], ["luckyModule", "solutionPrototype", "luckyRef"]);
}

function slideDeliveryCombinations(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "组合交付",
    title: "平台能力可以按客户成熟度组合成多种交付形态",
    page: 14,
  });
  const cards = [
    ["Lucky", "独立智能体平台\n适合智能助理、账号订阅、模型能力调用等交付。", false],
    ["Lucky + 资料库", "形成私域知识服务\n适合知识库问答、智能资料库、机构知识助手。", false],
    ["Lucky + 资料库 + 空间", "形成 AI 原生业务平台\n承载培训、教研、教学和项目协作过程。", false],
    ["再叠加场景模板", "生成多种垂直方案\n面向工作室、工作坊、校本研修、区域教师发展等业务。", true],
  ];
  cards.forEach(([t, b, dark], i) => {
    const x = 48 + i * 300;
    addCard(slide, { x, y: 252, w: 270, h: 314 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : "none", width: 0 },
    });
    addText(slide, t, { x: x + 26, y: 286, w: 218, h: 42 }, {
      size: i === 0 ? 30 : 26,
      bold: true,
      color: dark ? C.white : C.black,
    });
    addText(slide, b, { x: x + 26, y: 350, w: 214, h: 130 }, {
      size: 20,
      color: dark ? C.white : C.text,
      lineSpacing: 1.18,
    });
  });
  addText(slide, "这些组合都可以支持相应的商业模式交付。", { x: 48, y: 636, w: 560, h: 34 }, {
    size: 26,
    bold: true,
  });
  addText(slide, "从工具平台到场景方案，交付深度逐级增加。", { x: 760, y: 640, w: 390, h: 28 }, {
    size: 18,
    color: C.muted,
  });
  setNotes(slide, [
    "This slide follows the user's second reference image and reframes combinations as maturity-based delivery packages.",
  ], ["ref2", "showroom", "compare"]);
}

function slideSpaceModes(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "运行模式",
    title: "空间支持多种运行模式，支撑不同类型智能体",
    subtitle: "客户不必一次性建设全部能力，可以从一个模式切入，再逐步扩展为完整空间。",
    page: 15,
  });
  const modes = [
    ["知识模式", "围绕资料、图谱和学习路径，让用户先看懂、找得到、可追溯。"],
    ["AI 模式", "让 Lucky 进入空间，结合角色、资料和任务提供问答、生成、分析。"],
    ["实训模式", "把学习任务连接到真实工具、实验环境和过程记录。"],
    ["考核配置模式", "按项目规则配置任务、评价、证书和结果沉淀。"],
  ];
  modes.forEach(([t, b], i) => {
    const x = 74 + i * 294;
    addCard(slide, { x, y: 278, w: 238, h: 220 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    addText(slide, t, { x: x + 24, y: 314, w: 190, h: 36 }, {
      size: 26,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    addText(slide, b, { x: x + 24, y: 382, w: 190, h: 82 }, {
      size: 18,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addCard(slide, { x: 198, y: 568, w: 884, h: 54 }, {
    fill: C.white,
    line: { style: "solid", fill: C.darkLine, width: 1 },
  });
  addText(slide, "不同模式可以组合成培训、教研、教学、项目交付和组织知识运营方案。", { x: 228, y: 583, w: 824, h: 28 }, {
    size: 22,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Use this slide to connect space modes to agent-building scenarios and staged customer adoption.",
  ], ["topic", "showroom"]);
}

function slideScenarios(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "场景模板",
    title: "智能体建设平台优先承载高频、跨部门、强规则场景",
    page: 16,
  });
  const groups = [
    ["培训交付智能体群", "需求澄清\n方案生成\n排课与师资\n过程服务\n评估复盘"],
    ["教研工作坊智能体群", "议题设计\n资料共创\n研讨纪要\n任务跟进\n成果沉淀"],
    ["资料运营智能体群", "资料解析\nFAQ 草稿\n标签治理\n图谱维护\n版本更新"],
    ["经营与客户成功智能体群", "客户需求转方案\n项目风险预警\n续约机会识别\n经营问答"],
  ];
  groups.forEach(([t, b], i) => {
    const x = 54 + i * 306;
    addCard(slide, { x, y: 248, w: 250, h: 330 }, { fill: i === 0 ? C.black : C.light });
    addText(slide, t, { x: x + 24, y: 286, w: 202, h: 60 }, {
      size: 24,
      bold: true,
      color: i === 0 ? C.white : C.black,
      align: "center",
      lineSpacing: 1.1,
    });
    addText(slide, b, { x: x + 48, y: 376, w: 154, h: 132 }, {
      size: 19,
      color: i === 0 ? "#eeeeee" : C.text,
      align: "center",
      lineSpacing: 1.32,
    });
  });
  addText(slide, "判断优先级：越高频、重复、跨部门、强规则、强数据依赖，越适合优先建设智能体。", { x: 116, y: 620, w: 1048, h: 32 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Group use cases into reusable scenario templates so the roadshow feels concrete without overloading the audience.",
  ], ["aiNative", "showroom"]);
}

function slideCommercial(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "商业模式",
    title: "商业化不是卖一个助手，而是交付可运营的智能体资产",
    page: 17,
  });
  const rows = [
    ["平台底座", "租户、账号、权限、模型调用、监控和基础运维。", "客户获得可长期运营的智能体平台。"],
    ["知识资产", "资料库、知识图谱、模板库、案例库和规则库。", "客户获得可持续复用的私域知识。"],
    ["空间模板", "培训、教研、教学、项目和区域运营等场景模板。", "客户获得可复制的业务工作场。"],
    ["智能体与技能", "角色智能体、技能编排、任务模板、人工确认节点。", "客户获得可执行的 AI 业务能力。"],
    ["运营服务", "上线辅导、资料治理、效果评估、持续优化和方案复制。", "客户获得持续变好的交付结果。"],
  ];
  addCard(slide, { x: 70, y: 238, w: 1140, h: 340 }, { fill: C.white });
  addShape(slide, "rect", { x: 70, y: 238, w: 1140, h: 54 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  ["交付层", "交付内容", "客户获得"].forEach((h, i) => {
    const x = [96, 300, 780][i];
    const w = [150, 390, 360][i];
    addText(slide, h, { x, y: 254, w, h: 26 }, {
      size: 20,
      bold: true,
      color: C.white,
    });
  });
  rows.forEach((row, i) => {
    const y = 304 + i * 52;
    if (i % 2 === 0) {
      addShape(slide, "rect", { x: 70, y: y - 8, w: 1140, h: 52 }, {
        fill: C.light,
        line: { style: "solid", fill: "none", width: 0 },
      });
    }
    addText(slide, row[0], { x: 96, y, w: 150, h: 24 }, { size: 19, bold: true });
    addText(slide, row[1], { x: 300, y, w: 390, h: 24 }, { size: 18, color: C.text });
    addText(slide, row[2], { x: 780, y, w: 360, h: 24 }, { size: 18, color: C.text });
  });
  addText(slide, "底层能力可订阅，场景模板可交付，知识与智能体资产可持续运营。", { x: 180, y: 620, w: 920, h: 32 }, {
    size: 24,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Keep this commercial slide pricing-free: it explains packaging logic rather than inventing price points.",
  ], ["compare", "showroom"]);
}

function slideRoadmap(presentation) {
  const slide = presentation.slides.add();
  addHeader(slide, {
    kicker: "落地路线",
    title: "从一个可闭环场景开始建设平台能力",
    page: 18,
  });
  const phases = [
    ["1", "场景试点", "选择高频业务，明确角色、资料、流程和成功标准。"],
    ["2", "资料治理", "整理首批知识资产，建立来源、标签、权限和版本规则。"],
    ["3", "智能体上线", "配置角色智能体、工具调用、人工确认和异常转交。"],
    ["4", "模板复制", "沉淀空间模板、任务模板、FAQ 和运营指标，复制到更多场景。"],
  ];
  phases.forEach(([n, t, b], i) => {
    const x = 84 + i * 296;
    addText(slide, n, { x, y: 258, w: 68, h: 70 }, {
      size: 56,
      bold: true,
      color: C.black,
      align: "center",
    });
    addRule(slide, x + 84, 292, 176, i === 3 ? C.white : C.black, 3);
    addText(slide, t, { x, y: 374, w: 222, h: 36 }, {
      size: 26,
      bold: true,
      align: "center",
    });
    addText(slide, b, { x, y: 430, w: 222, h: 84 }, {
      size: 19,
      color: C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addShape(slide, "rect", { x: 164, y: 586, w: 952, h: 56 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  addText(slide, "先跑通一个闭环，再复制到更多组织、项目和业务线。", { x: 208, y: 602, w: 864, h: 28 }, {
    size: 24,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "A roadshow should end the solution section with a pragmatic adoption path.",
  ], ["aiNative"]);
}

function slideClose(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = C.black;
  addText(slide, "智能体建设平台", { x: 52, y: 58, w: 520, h: 34 }, {
    size: 22,
    bold: true,
    color: "#cfcfcf",
  });
  addText(slide, "让每个组织都能建设自己的智能体体系", { x: 52, y: 172, w: 920, h: 144 }, {
    size: 54,
    bold: true,
    color: C.white,
    lineSpacing: 1.04,
  });
  const takes = [
    ["知识有底座", "资料库"],
    ["业务有空间", "空间"],
    ["智能体可运营", "Lucky"],
  ];
  takes.forEach(([a, b], i) => {
    const x = 60 + i * 350;
    addCard(slide, { x, y: 424, w: 280, h: 102 }, {
      fill: "#171717",
      line: { style: "solid", fill: "#4d4d4d", width: 1 },
    });
    addText(slide, a, { x: x + 28, y: 448, w: 224, h: 28 }, {
      size: 24,
      bold: true,
      color: C.white,
      align: "center",
    });
    addText(slide, b, { x: x + 28, y: 486, w: 224, h: 24 }, {
      size: 18,
      color: "#bdbdbd",
      align: "center",
    });
  });
  addText(slide, "下一步：选定试点场景，整理首批资料，配置首批角色智能体。", { x: 52, y: 624, w: 900, h: 34 }, {
    size: 26,
    bold: true,
    color: C.white,
  });
  setNotes(slide, [
    "Close by returning to the core triad and a concrete next step.",
  ], ["aiNative", "compare", "showroom"]);
}

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

  const presentation = Presentation.create({
    slideSize: { width: W, height: H },
  });

  titleSlide(presentation);
  slideProblem(presentation);
  slideArchitecture(presentation);
  slidePipeline(presentation);
  slideKnowledgeBase(presentation);
  slideSpace(presentation);
  slideResourceLibrarySupplement(presentation);
  slideSpaceSupplement(presentation);
  slideKnowledgeSpaceSupplement(presentation);
  slideLucky(presentation);
  slideLuckyCoreOverview(presentation);
  slideLuckyTaskExecution(presentation);
  slideLuckyAgentEcosystem(presentation);
  slideDeliveryCombinations(presentation);
  slideSpaceModes(presentation);
  slideScenarios(presentation);
  slideCommercial(presentation);
  slideRoadmap(presentation);
  slideClose(presentation);

  const sourceNotes = [
    "Lucky 智能体建设平台路演资料来源",
    "",
    `- ${SOURCES.aiNative}`,
    `- ${SOURCES.compare}`,
    `- ${SOURCES.showroom}`,
    `- ${SOURCES.topic}`,
    `- ${SOURCES.luckyModule}`,
    `- ${SOURCES.resourceLib}`,
    `- ${SOURCES.knowledgeSpace}`,
    `- ${SOURCES.solutionPrototype}`,
    `- ${SOURCES.ref1}`,
    `- ${SOURCES.ref2}`,
    `- ${SOURCES.luckyRef}`,
    `- ${SOURCES.moduleRef}`,
    "",
    "No external web sources or third-party visual assets were used.",
  ].join("\n");
  await fs.writeFile(path.join(TMP_DIR, "source-notes.txt"), sourceNotes);

  const renderDir = path.join(TMP_DIR, "artifact-preview");
  await fs.mkdir(renderDir, { recursive: true });
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(renderDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(renderDir, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(path.join(TMP_DIR, "artifact-montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const snapshot = await presentation.inspect({
    kind: "slide,textbox,shape,notes",
    maxChars: 30000,
  });
  await fs.writeFile(path.join(TMP_DIR, "artifact-inspect.ndjson"), snapshot.ndjson);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
