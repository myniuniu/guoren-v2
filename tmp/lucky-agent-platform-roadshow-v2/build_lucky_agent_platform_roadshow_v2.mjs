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
  light: "#f1f1f1",
  mid: "#e7e7e7",
  line: "#c2c7d0",
  darkLine: "#666a72",
  white: "#ffffff",
};

const SOURCES = {
  userPlan: "用户提供的路演计划与补充要求（本对话）",
  aiNative: "/Users/zhanghl/Documents/GitHub/guoren-v2/docs/ai-native-driven-system-use-cases.md",
  compare: "/Users/zhanghl/Documents/GitHub/guoren-v2/docs/guoren-vs-learnbuddy-ai-native-platform.md",
  luckyModule: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/lucky/LuckyModule.jsx",
  quickBuild: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/quickBuild/QuickBuildModule.jsx",
  resourceLib: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/resourceLib/ResourceLibrary.jsx",
  resourceStore: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/resourceLib/resourceLibStore.js",
  solutionPrototype: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/solutionPrototype/SolutionPrototypeModule.jsx",
  topic: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/TopicDetail.jsx",
  showroom: "/Users/zhanghl/Documents/GitHub/guoren-v2/src/solutionShowroom/showroomData.js",
  teachingRef1: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-149b152b-a9f3-46b5-b650-9833bb59d8e3.png",
  teachingRef2: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-045c5a90-5e45-4103-a96e-d1c743c1afbd.png",
  teachingRef3: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-48052a4b-3632-4796-b381-46cc82e6faea.png",
  teachingRef4: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-607e9416-7674-4dba-91be-15d5a4c0b775.png",
  teachingRef5: "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-eb583dcd-848d-49ac-8dea-1edd799ac397.png",
};

const SOURCE_LABELS = {
  userPlan: "用户提供的路演计划与补充要求",
  aiNative: "AI 原生业务执行模式本地文档",
  compare: "AI 原生平台定位本地文档",
  luckyModule: "Lucky 模块源码",
  quickBuild: "智搭模块源码",
  resourceLib: "资料库模块源码",
  resourceStore: "资料库本地存储与目录映射源码",
  solutionPrototype: "解决方案原型模块源码",
  topic: "空间与教学场景源码",
  showroom: "解决方案样板间数据源码",
  teachingRef1: "用户提供人工智能教学平台参考图 1",
  teachingRef2: "用户提供人工智能教学平台参考图 2",
  teachingRef3: "用户提供人工智能教学平台参考图 3",
  teachingRef4: "用户提供人工智能教学平台参考图 4",
  teachingRef5: "用户提供人工智能教学平台参考图 5",
};

function pos(left, top, width, height) {
  return { left, top, width, height };
}

function shape(slide, geometry, p, opts = {}) {
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

function text(slide, value, p, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: pos(p.x, p.y, p.w, p.h),
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
    name: opts.name,
  });
  box.text = value;
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

function rule(slide, x, y, w, color = C.line, h = 2) {
  return shape(slide, "rect", { x, y, w, h }, {
    fill: color,
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function card(slide, p, opts = {}) {
  return shape(slide, "rect", p, {
    fill: opts.fill ?? C.light,
    line: opts.line ?? { style: "solid", fill: C.line, width: 1 },
    radius: opts.radius ?? 0,
  });
}

function header(slide, { kicker, title, subtitle, page, titleSize = 40 }) {
  slide.background.fill = C.white;
  if (kicker) {
    text(slide, kicker, { x: 52, y: 42, w: 420, h: 28 }, {
      size: 20,
      bold: true,
      color: C.muted,
    });
  }
  text(slide, title, { x: 52, y: 84, w: 1136, h: 62 }, {
    size: titleSize,
    bold: true,
    color: C.black,
    lineSpacing: 1.02,
  });
  if (subtitle) {
    text(slide, subtitle, { x: 52, y: 148, w: 1120, h: 42 }, {
      size: 20,
      color: C.muted,
      lineSpacing: 1.15,
    });
  }
  rule(slide, 52, subtitle ? 206 : 184, 1176, C.line, 2);
  if (page) {
    text(slide, String(page).padStart(2, "0"), { x: 1182, y: 660, w: 46, h: 24 }, {
      size: 16,
      color: "#8a8a8a",
      align: "right",
    });
  }
}

function setNotes(slide, lines, sourceKeys = []) {
  const sourceLines = sourceKeys.map((key) => {
    const label = SOURCE_LABELS[key] || key;
    const source = SOURCES[key] || "n/a";
    return `- ${label}: ${source}`;
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

function addFooterCallout(slide, value, y = 604, w = 920) {
  const x = (W - w) / 2;
  shape(slide, "rect", { x, y, w, h: 50 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, value, { x: x + 28, y: y + 14, w: w - 56, h: 24 }, {
    size: 21,
    bold: true,
    color: C.white,
    align: "center",
  });
}

function titleSlide(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  text(slide, "智能体建设平台路演", { x: 52, y: 56, w: 480, h: 32 }, {
    size: 22,
    bold: true,
    color: C.muted,
  });
  text(slide, "Lucky 智能体建设平台", { x: 52, y: 150, w: 900, h: 78 }, {
    size: 58,
    bold: true,
    color: C.black,
    lineSpacing: 1.02,
  });
  text(slide, "内部建设智能体，外部交付智能体；用资料库和智搭把 AI 能力变成可运行、可复用、可销售的业务应用。", { x: 54, y: 260, w: 920, h: 78 }, {
    size: 25,
    color: C.muted,
    lineSpacing: 1.18,
  });
  shape(slide, "rect", { x: 964, y: 52, w: 196, h: 520 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "AGENT\nBUILDING\nPLATFORM", { x: 990, y: 246, w: 144, h: 116 }, {
    size: 21,
    bold: true,
    color: C.white,
    align: "center",
    lineSpacing: 1.18,
  });
  const chips = ["内用", "外售", "智搭", "私有化"];
  chips.forEach((chip, i) => {
    const x = 54 + i * 126;
    card(slide, { x, y: 418, w: 104, h: 46 }, {
      fill: i === 0 ? C.black : C.light,
      line: { style: "solid", fill: i === 0 ? C.black : C.line, width: 1 },
    });
    text(slide, chip, { x: x + 12, y: 431, w: 80, h: 18 }, {
      size: 17,
      bold: true,
      color: i === 0 ? C.white : C.text,
      align: "center",
    });
  });
  text(slide, "Lucky + 资料库 + 空间 + 智搭", { x: 54, y: 650, w: 360, h: 24 }, {
    size: 16,
    color: C.muted,
  });
  setNotes(slide, [
    "Open with the platform positioning: Lucky supports internal agent construction and external commercialization.",
  ], ["userPlan"]);
}

function slideNeed(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "为什么现在",
    title: "公司需要掌握自己的智能体建设能力",
    subtitle: "采购一个聊天入口解决不了长期问题；真正的竞争力来自可沉淀、可复用、可交付的智能体资产。",
    page: 2,
  });
  const cards = [
    ["业务会持续变化", "培训、教研、教学、市场、客户成功等场景不断变化，需要快速生成新能力。"],
    ["知识必须可控", "资料、经验、流程和客户数据要沉淀在公司自己的知识体系和权限边界内。"],
    ["交付要能复制", "对外销售不能每次从零定制，需要把方案、技能和应用沉淀为模板。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 76 + i * 386;
    card(slide, { x, y: 268, w: 324, h: 222 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 312, w: 268, h: 36 }, {
      size: 28,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 32, y: 378, w: 260, h: 74 }, {
      size: 18,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addFooterCallout(slide, "智能体平台的价值，是让公司从“使用 AI”升级为“建设 AI 能力”。");
  setNotes(slide, [
    "Explain why platform ownership matters before introducing Lucky modules.",
  ], ["userPlan", "compare"]);
}

function slidePositioning(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "平台定位",
    title: "Lucky 是智能体建设、运营和交付平台",
    subtitle: "一个入口连接助理、智能体、技能、知识、空间和应用搭建，让 AI 能力进入业务执行。",
    page: 3,
  });
  const layers = [
    ["01", "Lucky 助理", "推理、检索资料库、操作平台功能"],
    ["02", "智能体建设", "通过对话创建角色、技能、知识和工具权限"],
    ["03", "知识底座", "资料库与本地目录成为可引用知识范围"],
    ["04", "智搭应用", "把场景、表单、流程和工具搭成可运行应用"],
  ];
  layers.forEach(([n, t, b], i) => {
    const x = 82 + i * 294;
    text(slide, n, { x, y: 248, w: 60, h: 44 }, {
      size: 34,
      bold: true,
      color: C.black,
      align: "center",
    });
    rule(slide, x + 76, 270, 168, i === 3 ? C.white : C.black, 3);
    text(slide, t, { x, y: 326, w: 220, h: 34 }, {
      size: 26,
      bold: true,
      align: "center",
    });
    text(slide, b, { x, y: 382, w: 220, h: 60 }, {
      size: 18,
      color: C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
  });
  shape(slide, "rect", { x: 202, y: 542, w: 876, h: 60 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "Lucky 解决“谁来理解和执行”，智搭解决“交付成什么可运行应用”。", { x: 246, y: 560, w: 788, h: 26 }, {
    size: 22,
    bold: true,
    color: C.white,
    align: "center",
  });
  setNotes(slide, [
    "Define the platform's four-layer capability model.",
  ], ["userPlan", "luckyModule", "quickBuild", "solutionPrototype"]);
}

function slideDualUse(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "双场景定位",
    title: "同一套平台，同时支撑内部使用和对外销售",
    subtitle: "内部先跑通智能体建设和运营机制，再沉淀为可复制、可私有化交付的外部方案。",
    page: 4,
  });
  const columns = [
    ["内部使用", "面向员工、部门和项目", ["提升效率", "沉淀知识", "复用技能", "推动任务"]],
    ["对外销售", "面向客户场景和行业方案", ["产品化交付", "方案复制", "私有化部署", "商业增长"]],
  ];
  columns.forEach(([title, lead, items], i) => {
    const x = i === 0 ? 104 : 682;
    const dark = i === 1;
    card(slide, { x, y: 246, w: 494, h: 328 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, title, { x: x + 46, y: 294, w: 402, h: 44 }, {
      size: 36,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    text(slide, lead, { x: x + 60, y: 356, w: 374, h: 30 }, {
      size: 22,
      bold: true,
      color: dark ? "#eeeeee" : C.text,
      align: "center",
    });
    items.forEach((item, j) => {
      const chipX = x + 62 + (j % 2) * 190;
      const chipY = 430 + Math.floor(j / 2) * 58;
      card(slide, { x: chipX, y: chipY, w: 162, h: 38 }, {
        fill: dark ? "#1c1c1c" : C.white,
        line: { style: "solid", fill: dark ? "#555555" : C.line, width: 1 },
      });
      text(slide, item, { x: chipX + 10, y: chipY + 10, w: 142, h: 16 }, {
        size: 16,
        bold: true,
        color: dark ? C.white : C.text,
        align: "center",
      });
    });
  });
  text(slide, "内部智能体沉淀方法，外部智能体沉淀收入；两者共用一套平台能力。", { x: 200, y: 626, w: 880, h: 28 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Introduce the internal/external split requested by the user and connect it to platform economics.",
  ], ["userPlan"]);
}

function slideAssistant(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "Lucky 助理",
    title: "个人助理是入口，推理和平台操作才是关键",
    subtitle: "Lucky 内置个人助理智能体，能理解目标、调用知识、拆解任务，并操作 AI 原生平台能力。",
    page: 5,
  });
  const items = [
    ["支持推理", "多轮澄清目标、对象、约束和成功标准。"],
    ["资料库为知识库", "把资料库和本地目录作为可检索、可引用的知识范围。"],
    ["操作平台功能", "创建空间、配置课程、生成任务、推动通知和服务清单。"],
  ];
  items.forEach(([t, b], i) => {
    const x = 92 + i * 374;
    card(slide, { x, y: 260, w: 310, h: 240 }, {
      fill: i === 2 ? C.black : C.light,
      line: { style: "solid", fill: i === 2 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 314, w: 254, h: 34 }, {
      size: 28,
      bold: true,
      color: i === 2 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 32, y: 386, w: 246, h: 58 }, {
      size: 18,
      color: i === 2 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addFooterCallout(slide, "这让 Lucky 从“回答问题”进入“理解目标并推动业务完成”。");
  setNotes(slide, [
    "Frame Lucky's assistant as the first user-facing entry, but focus on reasoning, knowledge access, and system operations.",
  ], ["userPlan", "luckyModule", "aiNative"]);
}

function slideTrainingExample(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "业务示例",
    title: "培训项目组织从人工协调，转向目标驱动交付",
    subtitle: "用户只表达培训目标，Lucky 负责梳理需求、生成方案、推荐资源，并在空间中推进执行。",
    page: 6,
  });
  const cols = [
    ["传统模式", "需求方提出需求\n教研设计培训计划\n教务创建项目和课程\n运营通知、签到、资料、作业和反馈"],
    ["AI 原生模式", "用户与 Lucky 多轮对话\nLucky 生成培训计划\n推荐课程、讲师和日程\n确认后创建空间、课程和服务清单"],
  ];
  cols.forEach(([t, b], i) => {
    const x = i === 0 ? 78 : 698;
    const dark = i === 1;
    card(slide, { x, y: 254, w: 500, h: 300 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 40, y: 296, w: 420, h: 38 }, {
      size: 32,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 76, y: 372, w: 348, h: 120 }, {
      size: 20,
      color: dark ? "#eeeeee" : C.text,
      align: "center",
      lineSpacing: 1.34,
    });
  });
  text(slide, "业务价值：减少跨部门反复沟通，让项目从“人工协调型流程”变成“目标驱动型交付”。", { x: 132, y: 620, w: 1016, h: 30 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Use the user-provided training project example and the local AI-native use-case document.",
  ], ["userPlan", "aiNative", "topic"]);
}

function slideAgentBuild(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "智能体构建",
    title: "通过对话创建智能体，并配置知识、技能和工具",
    subtitle: "平台把智能体创建从专业配置工作，变成可被部门和项目团队复用的建设流程。",
    page: 7,
  });
  const steps = [
    ["描述角色", "说明服务对象、任务边界和工作风格"],
    ["配置知识", "选择资料库、本地目录和空间资料范围"],
    ["绑定技能", "添加可调用技能、流程和工具权限"],
    ["上线运营", "跟踪效果、复盘问题、持续迭代"],
  ];
  steps.forEach(([t, b], i) => {
    const x = 76 + i * 292;
    text(slide, String(i + 1), { x: x + 70, y: 252, w: 76, h: 60 }, {
      size: 50,
      bold: true,
      color: C.black,
      align: "center",
    });
    rule(slide, x + 170, 282, 100, i === 3 ? C.white : C.black, 3);
    text(slide, t, { x, y: 352, w: 220, h: 32 }, {
      size: 25,
      bold: true,
      align: "center",
    });
    text(slide, b, { x, y: 410, w: 220, h: 54 }, {
      size: 18,
      color: C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addFooterCallout(slide, "平台让智能体从一次性配置，变成可建设、可运营、可复用的能力资产。");
  setNotes(slide, [
    "Explain conversational agent creation and operational configuration.",
  ], ["userPlan", "luckyModule", "solutionPrototype"]);
}

function slideSkillBuild(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "技能构建",
    title: "技能可以通过对话创建，也可以从外部优秀实践导入",
    subtitle: "技能沉淀的是可复用动作：提示词、工具调用、流程节点、任务模板和输出标准。",
    page: 8,
  });
  const cards = [
    ["对话创建", "用自然语言描述要完成的工作，生成可复用技能草稿。"],
    ["外部导入", "看到外部平台或技能市场中的优秀技能，可导入、改造、内化。"],
    ["持续沉淀", "把项目交付中验证过的动作，沉淀为部门和客户可复用能力。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 82 + i * 372;
    card(slide, { x, y: 264, w: 306, h: 236 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 318, w: 250, h: 34 }, {
      size: 28,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 34, y: 388, w: 238, h: 62 }, {
      size: 18,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
  });
  addFooterCallout(slide, "技能是智能体平台的“动作库”，决定智能体能做什么、怎么做、做到什么标准。");
  setNotes(slide, [
    "Position skills as reusable action assets rather than just prompt fragments.",
  ], ["userPlan", "luckyModule"]);
}

function slideMarkets(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "能力市场",
    title: "市场机制让专家、技能和最佳实践被复制",
    subtitle: "智能体市场、技能市场和最佳实践市场，是平台内部复用与外部交付复制的核心机制。",
    page: 9,
  });
  const columns = [
    ["智能体市场", "复用专家智能体、部门智能体和客户场景智能体。"],
    ["技能市场", "沉淀可调用动作，让智能体复用成熟任务能力。"],
    ["最佳实践市场", "把成功项目、行业方案和交付流程打包成模板。"],
  ];
  columns.forEach(([t, b], i) => {
    const x = 96 + i * 360;
    card(slide, { x, y: 260, w: 286, h: 248 }, {
      fill: i === 0 ? C.black : C.light,
      line: { style: "solid", fill: i === 0 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 324, w: 230, h: 34 }, {
      size: 28,
      bold: true,
      color: i === 0 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 34, y: 392, w: 218, h: 62 }, {
      size: 18,
      color: i === 0 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  text(slide, "市场不是展示入口，而是让能力从一个项目复制到更多项目的分发机制。", { x: 202, y: 620, w: 876, h: 28 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Use the user's corrected wording: best-practice market, not best-time market.",
  ], ["userPlan", "luckyModule"]);
}

function slideAgentGovernance(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "运营治理",
    title: "智能体要测得准、看得见、管得住",
    subtitle: "当智能体从内部试点走向规模使用和外售交付，平台需要同时管理效果、消耗和成本边界。",
    page: 10,
    titleSize: 38,
  });
  shape(slide, "rect", { x: 72, y: 252, w: 330, h: 302 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "从建设\n到运营", { x: 112, y: 330, w: 250, h: 88 }, {
    size: 38,
    bold: true,
    color: C.white,
    align: "center",
    lineSpacing: 1.1,
  });
  text(slide, "质量、流量和计费是智能体平台商业化交付的基础设施。", { x: 112, y: 452, w: 250, h: 52 }, {
    size: 18,
    color: "#eeeeee",
    align: "center",
    lineSpacing: 1.16,
  });
  const capabilities = [
    ["质量测评", "用标准测试集、场景样例和人工反馈评估回答准确性、任务完成率、稳定性和安全边界。"],
    ["Token 流量", "按智能体、技能、用户和项目统计模型调用、输入输出 Token、峰值趋势和异常消耗。"],
    ["计费管控", "按部门、客户和项目设置额度、预算、套餐、告警和结算口径，支撑私有化与外售。"],
  ];
  capabilities.forEach(([t, b], i) => {
    const y = 248 + i * 108;
    const dark = i === 1;
    card(slide, { x: 488, y, w: 700, h: 86 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: 526, y: y + 24, w: 156, h: 28 }, {
      size: 25,
      bold: true,
      color: dark ? C.white : C.black,
    });
    text(slide, b, { x: 716, y: y + 22, w: 420, h: 40 }, {
      size: 16,
      color: dark ? "#eeeeee" : C.muted,
      lineSpacing: 1.15,
    });
  });
  addFooterCallout(slide, "治理能力让智能体平台从“能用”，走向“可信、可控、可规模销售”。", 610, 960);
  setNotes(slide, [
    "Add the user's requested operation layer: agent quality evaluation, Token traffic visibility, and billing control.",
  ], ["userPlan", "luckyModule"]);
}

function slideResourceLibrary(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "知识底座",
    title: "资料库统一管理多类型资料，成为智能体知识底座",
    subtitle: "资料库的核心不是类型多，而是所有资料都能进入智能体可识别、可引用、可生成的知识范围。",
    page: 11,
    titleSize: 39,
  });
  shape(slide, "rect", { x: 70, y: 250, w: 400, h: 320 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "资料类型", { x: 106, y: 292, w: 328, h: 40 }, {
    size: 32,
    bold: true,
    color: C.white,
  });
  text(slide, "office、md、pdf、音视频、会议回放、在线文档、白板、问卷、投票、考试、报名、接龙、360评估、测评、实训任务、知识图谱、能力模型、虚拟课堂、html课件、案例仿真、AI课堂评价报告等。", { x: 108, y: 356, w: 324, h: 126 }, {
    size: 17,
    color: "#eeeeee",
    lineSpacing: 1.18,
  });
  const cards = [
    ["智能体识别资料", "所有资料进入知识范围后，可被问答、分析、推荐和生成调用。"],
    ["智能体生成资料", "通过智能体生成课件、报告、问卷、任务、评价材料和业务文档。"],
    ["资料参与业务", "资料不止存放，而是进入空间、项目、智能体和智搭应用。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 536 + (i % 2) * 318;
    const y = i === 2 ? 432 : 254;
    const w = i === 2 ? 636 : 280;
    card(slide, { x, y, w, h: i === 2 ? 106 : 134 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 22, y: y + 22, w: w - 44, h: 28 }, {
      size: 23,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 28, y: y + 62, w: w - 56, h: 44 }, {
      size: 16,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
  });
  text(slide, "资料库让公司资产从“文件”变成“智能体可调用的业务上下文”。", { x: 204, y: 622, w: 872, h: 28 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Summarize the user-provided resource types and emphasize AI-native recognizability and generation.",
  ], ["userPlan", "resourceLib", "resourceStore", "solutionPrototype"]);
}

function slideLocalMapping(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "知识库规划",
    title: "本地磁盘目录映射，让已有文件夹直接成为知识库来源",
    subtitle: "客户和内部部门不必先搬迁所有资料；本地目录可映射进知识范围，逐步识别、检索、引用和治理。",
    page: 12,
    titleSize: 38,
  });
  const flow = [
    ["本地文件夹", "已有项目资料、课件、案例、交付物"],
    ["目录映射", "建立路径、权限、同步和扫描规则"],
    ["知识库引用", "智能体检索、生成、分析和任务执行"],
  ];
  flow.forEach(([t, b], i) => {
    const x = 90 + i * 390;
    card(slide, { x, y: 280, w: 300, h: 190 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 326, w: 244, h: 32 }, {
      size: 27,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 36, y: 388, w: 228, h: 46 }, {
      size: 17,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
    if (i < 2) {
      shape(slide, "rightArrow", { x: x + 314, y: 354, w: 58, h: 32 }, {
        fill: C.black,
        line: { style: "solid", fill: "none", width: 0 },
      });
    }
  });
  addFooterCallout(slide, "价值：降低资料迁移成本，让已有知识更快进入智能体能力范围。");
  setNotes(slide, [
    "Add the planning item requested by the user: local disk directory mapping as a knowledge-base source.",
  ], ["userPlan", "resourceLib", "resourceStore"]);
}

function slideQuickBuild(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "智搭模块",
    title: "智搭把场景、知识库和工具流程快速搭成应用",
    subtitle: "当智能体能力需要被演示、交付和复制时，智搭把它落成轻量业务系统、AI 应用和团队工具。",
    page: 13,
  });
  shape(slide, "rect", { x: 72, y: 254, w: 344, h: 302 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "智搭", { x: 110, y: 314, w: 268, h: 52 }, {
    size: 44,
    bold: true,
    color: C.white,
    align: "center",
  });
  text(slide, "灵感落地生花，即刻智搭万物", { x: 112, y: 398, w: 264, h: 54 }, {
    size: 23,
    bold: true,
    color: C.white,
    align: "center",
    lineSpacing: 1.14,
  });
  text(slide, "面向智能体应用开发，把业务场景、知识库和工具流程快速搭成可运行应用。", { x: 112, y: 478, w: 264, h: 52 }, {
    size: 17,
    color: "#eeeeee",
    align: "center",
    lineSpacing: 1.15,
  });
  const items = [
    ["AI 应用", "面向客户或内部部门快速搭建可运行应用。"],
    ["轻型业务系统", "承载表单、看板、流程、任务和团队协作。"],
    ["应用模板", "沉淀做同款、部署和复用能力，降低交付成本。"],
  ];
  items.forEach(([t, b], i) => {
    const x = 488 + (i % 2) * 328;
    const y = i === 2 ? 430 : 258;
    const w = i === 2 ? 656 : 292;
    card(slide, { x, y, w, h: 118 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 24, y: y + 22, w: w - 48, h: 28 }, {
      size: 24,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 30, y: y + 64, w: w - 60, h: 34 }, {
      size: 16,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.14,
    });
  });
  text(slide, "智搭让智能体能力不只存在于对话里，而是变成客户能看见、能操作、能部署的应用。", { x: 150, y: 626, w: 980, h: 28 }, {
    size: 22,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Use the product copy from QuickBuild and Lucky code mode: fast application building for AI applications and lightweight systems.",
  ], ["userPlan", "quickBuild", "luckyModule"]);
}

function slideDeliveryForms(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "交付形态",
    title: "平台能力可以组合成四种递进式交付",
    subtitle: "从单个智能体，到知识服务，再到业务空间和智搭应用，交付深度逐级增加。",
    page: 14,
  });
  const cards = [
    ["智能体", "适合内部助理、专家智能体、业务问答和轻量任务。"],
    ["智能体 + 资料库", "适合组织知识助手、资料问答、内容生成和资料运营。"],
    ["智能体 + 资料库 + 空间", "适合培训、教研、教学、项目协作等业务场景。"],
    ["智搭应用", "把客户需求包装成可运行、可演示、可部署的 AI 应用。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 48 + i * 300;
    const dark = i === 3;
    card(slide, { x, y: 250, w: 268, h: 306 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 22, y: 294, w: 224, h: 60 }, {
      size: i === 0 ? 29 : 24,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
      lineSpacing: 1.08,
    });
    text(slide, b, { x: x + 28, y: 392, w: 212, h: 88 }, {
      size: 18,
      color: dark ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  text(slide, "交付越深入，客户沉淀的资料、流程、智能体和应用越多，平台粘性越强。", { x: 146, y: 622, w: 988, h: 30 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Update delivery forms to include QuickBuild applications as requested.",
  ], ["userPlan", "solutionPrototype", "quickBuild"]);
}

function slideInternalValue(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "内部价值",
    title: "内部使用的价值，是把组织经验变成可复用生产力",
    subtitle: "内部智能体不是只帮个人省时间，而是帮助部门沉淀知识、流程、技能和应用模板。",
    page: 15,
    titleSize: 39,
  });
  const values = [
    ["效率提升", "自然语言发起任务，减少找功能、填表单和反复沟通。"],
    ["知识复用", "资料库、本地目录、项目经验和专家方法都能被调用。"],
    ["流程沉淀", "把重复任务、服务清单和交付动作沉淀为技能和自动化。"],
    ["应用建设", "用智搭快速生成内部工具、看板、表单和轻量系统。"],
  ];
  values.forEach(([t, b], i) => {
    const x = 84 + i * 292;
    card(slide, { x, y: 262, w: 236, h: 242 }, {
      fill: i === 3 ? C.black : C.light,
      line: { style: "solid", fill: i === 3 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 22, y: 314, w: 192, h: 34 }, {
      size: 26,
      bold: true,
      color: i === 3 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 26, y: 386, w: 184, h: 66 }, {
      size: 17,
      color: i === 3 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.16,
    });
  });
  addFooterCallout(slide, "把经验从“个人会做”沉淀为“智能体会做、应用能跑、团队可复用”。");
  setNotes(slide, [
    "Strengthen the internal value slide per the user's request.",
  ], ["userPlan", "aiNative", "luckyModule", "quickBuild"]);
}

function slideExternalValue(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "外售价值",
    title: "对外销售的价值，是把 AI 能力产品化、方案化、私有化",
    subtitle: "客户买到的不是一个聊天窗口，而是能读取资料、执行任务、承载场景并生成应用的完整能力包。",
    page: 16,
    titleSize: 38,
  });
  const rows = [
    ["产品化交付", "智能体、资料库、空间和智搭应用可以按客户成熟度组合销售。"],
    ["方案复制", "专家经验、交付流程、最佳实践和应用模板可以跨客户复用。"],
    ["私有化部署", "满足客户对数据、权限、模型接入、本地资料和流程控制的要求。"],
    ["商业增长", "从项目定制走向平台订阅、场景方案、智能体资产和运营服务。"],
  ];
  card(slide, { x: 92, y: 248, w: 1096, h: 326 }, { fill: C.white });
  shape(slide, "rect", { x: 92, y: 248, w: 1096, h: 58 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  text(slide, "外售价值", { x: 128, y: 266, w: 180, h: 24 }, {
    size: 22,
    bold: true,
    color: C.white,
  });
  text(slide, "为什么客户愿意买", { x: 430, y: 266, w: 360, h: 24 }, {
    size: 22,
    bold: true,
    color: C.white,
  });
  rows.forEach(([t, b], i) => {
    const y = 330 + i * 56;
    if (i % 2 === 0) {
      shape(slide, "rect", { x: 92, y: y - 10, w: 1096, h: 52 }, {
        fill: C.light,
        line: { style: "solid", fill: "none", width: 0 },
      });
    }
    text(slide, t, { x: 128, y, w: 190, h: 24 }, { size: 21, bold: true });
    text(slide, b, { x: 430, y, w: 660, h: 24 }, { size: 19, color: C.text });
  });
  text(slide, "外售智能体的重点不是“能聊”，而是能嵌入客户业务并持续沉淀客户资产。", { x: 154, y: 624, w: 972, h: 28 }, {
    size: 23,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Strengthen external sales value and private deployment positioning.",
  ], ["userPlan", "compare", "solutionPrototype", "quickBuild"]);
}

function slideAITeachingCase(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "案例",
    title: "人工智能教学平台打造“教、学、练、评”一体化闭环",
    subtitle: "线上课堂、任务管理、课堂实训和学情分析共同构成可运营、可评价、可持续优化的教学场景。",
    page: 17,
    titleSize: 38,
  });
  const modules = [
    ["01 / 线上课堂", "集成高清直播、互动白板和 IM 工具，支持大规模在线教学与实时互动。"],
    ["02 / 任务管理", "教师一键发布理论学习、编程练习等任务，学生在线接收、完成和提交。"],
    ["03 / 课堂实训", "提供云电脑环境，支持复杂编程和模型训练，智能体辅助答疑与代码纠错。"],
    ["04 / 学情分析", "自动采集学习数据，生成多维学情报告，支持精准化和个性化教学。"],
  ];
  modules.forEach(([t, b], i) => {
    const x = 74 + (i % 2) * 590;
    const y = 250 + Math.floor(i / 2) * 160;
    const dark = i === 0;
    card(slide, { x, y, w: 520, h: 126 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: y + 26, w: 464, h: 28 }, {
      size: 25,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 48, y: y + 68, w: 424, h: 40 }, {
      size: 16,
      color: dark ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
  });
  addFooterCallout(slide, "案例价值：把 AI 教学从单点工具，升级为“教、学、练、评”一体化平台。");
  setNotes(slide, [
    "Rebuild the user's first teaching-platform reference as a native slide instead of pasting the image.",
  ], ["userPlan", "teachingRef1", "topic", "showroom", "solutionPrototype"]);
}

function slideTeachingLabWorkbench(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "案例 / 实训实验",
    title: "实训实验开发让教师从运维转向教学设计",
    subtitle: "基于 Lucky 和实验室能力，教师可以选择实验室、配置内容、发布任务，并持续监控与指导。",
    page: 18,
  });
  const steps = [
    ["01 选择/创建实验室", "从模板库选择，或按教学需求组合软件，自定义实训环境。"],
    ["02 配置实验内容", "设置目标、步骤、代码/文档/数据集，并配置评价标准。"],
    ["03 发布实训任务", "一键发布给班级或学生，学生无需复杂配置即可开始。"],
    ["04 监控与指导", "通过仪表盘查看进度和资源状态，在线答疑与代码评审。"],
  ];
  steps.forEach(([t, b], i) => {
    const x = 64 + (i % 2) * 318;
    const y = 258 + Math.floor(i / 2) * 154;
    card(slide, { x, y, w: 278, h: 120 }, { fill: C.light });
    text(slide, t, { x: x + 22, y: y + 18, w: 234, h: 32 }, {
      size: 22,
      bold: true,
      align: "center",
    });
    text(slide, b, { x: x + 26, y: y + 62, w: 226, h: 40 }, {
      size: 15,
      color: C.muted,
      align: "center",
      lineSpacing: 1.14,
    });
  });
  shape(slide, "rect", { x: 720, y: 258, w: 490, h: 274 }, {
    fill: C.black,
    line: { style: "solid", fill: "none", width: 0 },
  });
  const points = [
    ["全流程掌控", "从模板生成到任务分发与实时监管，覆盖核心教学动作。"],
    ["所见即所得", "代码和数据资源自动同步，降低环境差异与核对错误。"],
    ["多元化教学工具", "编程录制、线上授课、异步录制与实时互动按需组合。"],
  ];
  points.forEach(([t, b], i) => {
    const y = 294 + i * 76;
    text(slide, t, { x: 758, y, w: 420, h: 24 }, {
      size: 21,
      bold: true,
      color: C.white,
    });
    text(slide, b, { x: 758, y: y + 30, w: 398, h: 30 }, {
      size: 15,
      color: "#dedede",
      lineSpacing: 1.12,
    });
  });
  addFooterCallout(slide, "核心价值：释放教师生产力，专注教学设计与指导，实现高质量实训教学。", 604, 930);
  setNotes(slide, [
    "Rebuild the second teaching-platform reference as a native slide focused on lab development workflow and teacher value.",
  ], ["userPlan", "teachingRef2", "luckyModule", "topic"]);
}

function slideCoursewareCreationCenter(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "案例 / 课件创作",
    title: "课件创作中心用 AI 驱动智能教学内容生成",
    subtitle: "依托 Lucky，把教学目标和素材转化为结构化、可交互、可实训的教学内容。",
    page: 19,
  });
  const cards = [
    ["依托 Lucky 智能体平台", "通过自然语言理解与多模态生成，将教师目标和课程素材转化为结构化教学内容。"],
    ["多模态课件生成", "一句话或一段文字即可生成文本、图片、音视频、互动问答和在线代码等富媒体课件。"],
    ["实训课件生成", "围绕实践任务、操作步骤、过程考核和结果评价，生成完整实训课程。"],
  ];
  cards.forEach(([t, b], i) => {
    const x = 66 + i * 388;
    const dark = i === 1;
    card(slide, { x, y: 260, w: 324, h: 300 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 28, y: 326, w: 268, h: 38 }, {
      size: 24,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 32, y: 404, w: 260, h: 88 }, {
      size: 17,
      color: dark ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.17,
    });
  });
  text(slide, "这让课件生产从“手工编辑内容”，升级为“AI 理解目标、生成内容、支持互动和实训”。", { x: 148, y: 626, w: 984, h: 28 }, {
    size: 22,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Rebuild the third teaching-platform reference as a native slide about AI-driven courseware generation.",
  ], ["userPlan", "teachingRef3", "luckyModule"]);
}

function slideInteractiveCourseGeneration(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "案例 / 创作工作台",
    title: "创作工作台把互动课件进一步生成互动课堂",
    subtitle: "教师输入教学主题或大纲，AI 生成课件，教师预览编辑后可一键加入备课系统。",
    page: 20,
  });
  const steps = [
    ["01 输入目标", "教师输入教学主题或大纲，系统识别并解析备课需求。"],
    ["02 AI 生成", "生成包含文本、图片、互动问答和在线代码的互动课件。"],
    ["03 预览编辑", "教师在线预览课件，进行二次修改和个性化完善。"],
    ["04 一键备课", "编辑完成后，一键添加至平台备课系统，用于课堂教学。"],
  ];
  steps.forEach(([t, b], i) => {
    const x = 62 + (i % 2) * 308;
    const y = 260 + Math.floor(i / 2) * 154;
    card(slide, { x, y, w: 268, h: 120 }, {
      fill: i === 1 ? C.black : C.light,
      line: { style: "solid", fill: i === 1 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 20, y: y + 20, w: 228, h: 30 }, {
      size: 21,
      bold: true,
      color: i === 1 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 24, y: y + 64, w: 220, h: 40 }, {
      size: 15,
      color: i === 1 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.13,
    });
  });
  const notes = [
    ["智能生成多模态互动课件", "内置智能体自动生成图文、问答、代码演示和游戏化元素。"],
    ["生成多智能体互动课堂", "一键生成含师生助智能体的平台，支持模拟教学和小组讨论。"],
    ["一键添加至备课", "无缝集成备课系统，减少格式转换和重复录入。"],
  ];
  notes.forEach(([t, b], i) => {
    const y = 262 + i * 114;
    card(slide, { x: 716, y, w: 484, h: 86 }, {
      fill: i === 0 ? C.black : C.light,
      line: { style: "solid", fill: i === 0 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: 748, y: y + 18, w: 420, h: 22 }, {
      size: 20,
      bold: true,
      color: i === 0 ? C.white : C.black,
    });
    text(slide, b, { x: 748, y: y + 48, w: 410, h: 24 }, {
      size: 14,
      color: i === 0 ? "#eeeeee" : C.muted,
    });
  });
  addFooterCallout(slide, "互动课件不是静态内容，而是能进入课堂、连接智能体和教学活动的应用化资源。", 604, 1020);
  setNotes(slide, [
    "Rebuild the fourth teaching-platform reference as a native workflow slide.",
  ], ["userPlan", "teachingRef4", "luckyModule", "topic"]);
}

function slidePracticeCourseGeneration(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "案例 / 实训课程",
    title: "创作工作台让实训课程从目标输入到环境生成",
    subtitle: "教师输入课程目标后，AI 规划知识脉络、配置实训环境，并生成互动课件与评测脚本。",
    page: 21,
    titleSize: 39,
  });
  const steps = [
    ["01 输入教学目标", "明确课程目标、学生基础和预期能力。"],
    ["02 AI 分析与规划", "拆解目标，生成知识图谱、技能要求和实操任务。"],
    ["03 自动生成实训环境", "调用云端资源，生成操作系统、编程语言、数据库和软件预置。"],
    ["04 生成课件与评测", "生成图文讲解、代码演示、互动练习和自动评分脚本。"],
  ];
  steps.forEach(([t, b], i) => {
    const x = 64 + (i % 2) * 318;
    const y = 252 + Math.floor(i / 2) * 160;
    card(slide, { x, y, w: 278, h: 126 }, { fill: C.light });
    text(slide, t, { x: x + 20, y: y + 20, w: 238, h: 30 }, {
      size: 20,
      bold: true,
      align: "center",
    });
    text(slide, b, { x: x + 24, y: y + 66, w: 230, h: 40 }, {
      size: 15,
      color: C.muted,
      align: "center",
      lineSpacing: 1.14,
    });
  });
  const values = [
    ["智能分析与规划", "理解教学目标，自动拆解知识图谱、技能要求和实操任务。"],
    ["环境自动配置", "根据大纲匹配云端资源，一键完成实训环境底层部署。"],
    ["内容与价值双重飞跃", "将数天课程开发压缩为分钟级生成，并通过标准化流程保证专业性。"],
  ];
  values.forEach(([t, b], i) => {
    const y = 256 + i * 112;
    card(slide, { x: 708, y, w: 506, h: 84 }, {
      fill: i === 2 ? C.black : C.light,
      line: { style: "solid", fill: i === 2 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: 738, y: y + 16, w: 446, h: 22 }, {
      size: 20,
      bold: true,
      color: i === 2 ? C.white : C.black,
    });
    text(slide, b, { x: 738, y: y + 46, w: 430, h: 24 }, {
      size: 14,
      color: i === 2 ? "#eeeeee" : C.muted,
    });
  });
  addFooterCallout(slide, "实训课程生成把教师从环境部署细节中释放出来，回到教学目标和学习效果设计。", 604, 1000);
  setNotes(slide, [
    "Rebuild the fifth teaching-platform reference as a native slide about practical-course generation.",
  ], ["userPlan", "teachingRef5", "luckyModule", "topic"]);
}

function slideValueSummary(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "价值总结",
    title: "Lucky 的核心价值，是把智能体能力变成公司资产",
    subtitle: "快速搭建、能力复用、效果更智能、从对话到干活，是平台价值的四个落点。",
    page: 22,
  });
  const values = [
    ["快速搭建", "通过对话创建智能体、技能和应用。"],
    ["能力复用", "市场、模板、资料库和智搭应用持续沉淀。"],
    ["效果更智能", "支持推理、资料识别、知识引用和业务上下文。"],
    ["从对话到干活", "能调用平台功能，推动任务、空间和流程执行。"],
  ];
  values.forEach(([t, b], i) => {
    const x = 72 + i * 294;
    card(slide, { x, y: 264, w: 236, h: 250 }, {
      fill: i === 2 ? C.black : C.light,
      line: { style: "solid", fill: i === 2 ? C.black : C.line, width: 1 },
    });
    text(slide, t, { x: x + 24, y: 322, w: 188, h: 34 }, {
      size: 26,
      bold: true,
      color: i === 2 ? C.white : C.black,
      align: "center",
    });
    text(slide, b, { x: x + 28, y: 396, w: 180, h: 52 }, {
      size: 17,
      color: i === 2 ? "#eeeeee" : C.muted,
      align: "center",
      lineSpacing: 1.15,
    });
  });
  text(slide, "最终目标：公司既能自己建设智能体，也能把智能体能力打包卖出去。", { x: 194, y: 624, w: 892, h: 30 }, {
    size: 24,
    bold: true,
    align: "center",
  });
  setNotes(slide, [
    "Close the value argument before the planning slide.",
  ], ["userPlan", "aiNative", "compare"]);
}

function slideRoadmap(presentation) {
  const slide = presentation.slides.add();
  header(slide, {
    kicker: "规划",
    title: "下一阶段聚焦平台能力建设和运营治理",
    subtitle: "围绕公司智能体建设、多智能体协同、自动化、运营治理、本地知识库映射和智搭增强，形成持续演进路线。",
    page: 23,
    titleSize: 38,
  });
  const roadmap = [
    ["公司智能体建设", "先建内部部门智能体，再沉淀外售模板。"],
    ["多智能体协同", "支持任务分工、调度、汇总与复盘。"],
    ["自动化", "按时间、状态、事件和规则触发任务。"],
    ["运营治理", "质量测评、Token 统计、额度和计费管控。"],
    ["本地知识库映射", "本地文件夹接入知识库，支持检索引用。"],
    ["智搭增强", "自然语言创建应用，连接资料、智能体和流程。"],
  ];
  roadmap.forEach(([t, b], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 86 + col * 374;
    const y = 248 + row * 154;
    const dark = i === 3;
    card(slide, { x, y, w: 324, h: 116 }, {
      fill: dark ? C.black : C.light,
      line: { style: "solid", fill: dark ? C.black : C.line, width: 1 },
    });
    text(slide, String(i + 1).padStart(2, "0"), { x: x + 22, y: y + 24, w: 58, h: 34 }, {
      size: 26,
      bold: true,
      color: dark ? C.white : C.black,
      align: "center",
    });
    text(slide, t, { x: x + 96, y: y + 24, w: 198, h: 28 }, {
      size: 22,
      bold: true,
      color: dark ? C.white : C.black,
      align: "left",
      lineSpacing: 1.08,
    });
    text(slide, b, { x: x + 96, y: y + 62, w: 196, h: 42 }, {
      size: 15,
      color: dark ? "#eeeeee" : C.muted,
      align: "left",
      lineSpacing: 1.14,
    });
  });
  addFooterCallout(slide, "规划重点：让平台持续沉淀能力、复制方案、支撑交付。", 594, 870);
  setNotes(slide, [
    "Roadmap focuses on platform capability construction across agents, automation, operation governance, local knowledge mapping, and QuickBuild.",
  ], ["userPlan", "luckyModule", "quickBuild", "resourceLib"]);
}

function closeSlide(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = C.black;
  text(slide, "Lucky 智能体建设平台", { x: 52, y: 60, w: 520, h: 34 }, {
    size: 22,
    bold: true,
    color: "#d6d6d6",
  });
  text(slide, "让公司拥有自己的智能体资产和 AI 原生交付能力", { x: 52, y: 170, w: 940, h: 132 }, {
    size: 52,
    bold: true,
    color: C.white,
    lineSpacing: 1.05,
  });
  const chips = [
    ["内部建设", "效率与知识沉淀"],
    ["对外销售", "方案与商业增长"],
    ["智搭应用", "可运行可交付"],
  ];
  chips.forEach(([t, b], i) => {
    const x = 64 + i * 360;
    card(slide, { x, y: 424, w: 284, h: 106 }, {
      fill: "#171717",
      line: { style: "solid", fill: "#4d4d4d", width: 1 },
    });
    text(slide, t, { x: x + 28, y: 448, w: 228, h: 28 }, {
      size: 24,
      bold: true,
      color: C.white,
      align: "center",
    });
    text(slide, b, { x: x + 28, y: 488, w: 228, h: 22 }, {
      size: 17,
      color: "#bdbdbd",
      align: "center",
    });
  });
  text(slide, "下一步：选定内部试点智能体，沉淀首批技能和资料库，再包装外售案例。", { x: 52, y: 626, w: 960, h: 32 }, {
    size: 25,
    bold: true,
    color: C.white,
  });
  setNotes(slide, [
    "End by connecting internal pilots to external packaging.",
  ], ["userPlan"]);
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
  slideNeed(presentation);
  slidePositioning(presentation);
  slideDualUse(presentation);
  slideAssistant(presentation);
  slideTrainingExample(presentation);
  slideAgentBuild(presentation);
  slideSkillBuild(presentation);
  slideMarkets(presentation);
  slideAgentGovernance(presentation);
  slideResourceLibrary(presentation);
  slideLocalMapping(presentation);
  slideQuickBuild(presentation);
  slideDeliveryForms(presentation);
  slideInternalValue(presentation);
  slideExternalValue(presentation);
  slideAITeachingCase(presentation);
  slideTeachingLabWorkbench(presentation);
  slideCoursewareCreationCenter(presentation);
  slideInteractiveCourseGeneration(presentation);
  slidePracticeCourseGeneration(presentation);
  slideValueSummary(presentation);
  slideRoadmap(presentation);

  const sourceNotes = [
    "Lucky 智能体建设平台路演 v2 资料来源",
    "",
    ...Object.entries(SOURCES).map(([key, value]) => `- ${SOURCE_LABELS[key] || key}: ${value}`),
    "",
    "No external web sources or third-party visual assets were used.",
  ].join("\n");
  await fs.writeFile(path.join(TMP_DIR, "source-notes.txt"), sourceNotes);

  const previewDir = path.join(TMP_DIR, "artifact-preview");
  await fs.mkdir(previewDir, { recursive: true });
  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(previewDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(previewDir, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(path.join(TMP_DIR, "artifact-montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const snapshot = await presentation.inspect({
    kind: "slide,textbox,shape,notes",
    maxChars: 40000,
  });
  await fs.writeFile(path.join(TMP_DIR, "artifact-inspect.ndjson"), snapshot.ndjson);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
