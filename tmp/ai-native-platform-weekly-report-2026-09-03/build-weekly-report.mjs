import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "/Users/zhanghl/Documents/GitHub/guoren-v2/outputs";
const TMP_DIR = "/Users/zhanghl/Documents/GitHub/guoren-v2/tmp/ai-native-platform-weekly-report-2026-09-03";
const FINAL_PPTX = "/Users/zhanghl/Documents/GitHub/guoren-v2/outputs/ai-native-platform-weekly-report-2026-09-03.pptx";
const HERO_IMAGE = "/Users/zhanghl/Documents/GitHub/guoren-v2/src/assets/hero.png";
const AI_MODE_IMAGE = "/var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-50b6485a-eb17-4ac3-bdb8-119e552ab5e1.png";
let heroBytes = null;
let aiModeBytes = null;

const W = 1280;
const H = 720;
const M = 56;
const TITLE_TOP = 44;
const TITLE_H = 74;
const CONTENT_TOP = 150;
const FOOTER_Y = 668;

const C = {
  canvas: "#FFFFFF",
  ink: "#0F172A",
  muted: "#5B6472",
  panel: "#F2F4F7",
  panel2: "#EAF5FB",
  rule: "#B8BCC4",
  accent: "#3D8DFF",
  accentSoft: "#DDEFFF",
  success: "#16A34A",
  warn: "#F59E0B",
};

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function noLine() {
  return { style: "solid", fill: "none", width: 0 };
}

function addText(slide, text, frame, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: frame,
    fill: "none",
    line: noLine(),
  });
  shape.text = text;
  shape.text.style = {
    fontSize: 22,
    typeface: "Helvetica Neue",
    color: C.ink,
    alignment: "left",
    verticalAlignment: "top",
    ...style,
  };
  return shape;
}

function addPanel(slide, frame, fill = C.panel, lineFill = "none") {
  return slide.shapes.add({
    geometry: "roundRect",
    position: frame,
    fill,
    line: { style: "solid", fill: lineFill, width: lineFill === "none" ? 0 : 1 },
    borderRadius: "rounded-md",
  });
}

function addRule(slide, x, y, w, color = C.rule, weight = 1) {
  return slide.shapes.add({
    geometry: "straightConnector1",
    position: { left: x, top: y, width: w, height: 0 },
    fill: "none",
    line: { style: "solid", fill: color, width: weight },
  });
}

function addFooter(slide, index) {
  addText(slide, "内部周会 | 2026-09-03", { left: M, top: FOOTER_Y, width: 360, height: 28 }, {
    fontSize: 15,
    color: C.muted,
  });
  addText(slide, String(index), { left: 1180, top: FOOTER_Y, width: 44, height: 28 }, {
    fontSize: 15,
    color: C.muted,
    alignment: "right",
  });
}

function addTitle(slide, title, subtitle, index) {
  addText(slide, title, { left: M, top: TITLE_TOP, width: 1120, height: TITLE_H }, {
    fontSize: 47,
    bold: true,
    color: C.ink,
  });
  if (subtitle) {
    addText(slide, subtitle, { left: M, top: 112, width: 1070, height: 38 }, {
      fontSize: 22,
      color: C.muted,
    });
  }
  addFooter(slide, index);
}

function setNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText([
    ...lines,
    "",
    "[Sources]",
    "- 用户确认的周汇报 PPT 制作计划（本对话）",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/docs/market-trial-application-process.md",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/docs/teacher-development-competitive-strategy-report.md",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/solutionPrototype/SolutionPrototypeModule.jsx",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/packagePrototype/PackagePrototypeModule.jsx",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/resourceLib/ResourceLibrary.jsx",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/lucky/LuckyModule.jsx",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/quickBuild/QuickBuildModule.jsx",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/tdWork/TdWorkModule.jsx",
    "- 用户提供的 AI 模式截图: /var/folders/b1/n7l3tg6951bg2fxcv64856x00000gn/T/codex-clipboard-50b6485a-eb17-4ac3-bdb8-119e552ab5e1.png",
    "- No external web sources or third-party visual assets were used.",
  ]);
  slide.speakerNotes.setVisible(true);
}

function addTag(slide, text, x, y, fill, width = 112) {
  addPanel(slide, { left: x, top: y, width, height: 30 }, fill, "none");
  addText(slide, text, { left: x + 10, top: y + 5, width: width - 20, height: 20 }, {
    fontSize: 15,
    bold: true,
    color: C.ink,
    alignment: "center",
  });
}

function slide1(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addText(slide, "AI 原生平台", { left: M, top: 48, width: 420, height: 30 }, {
    fontSize: 18,
    bold: true,
    color: C.accent,
  });
  addText(slide, "周进展汇报", { left: M, top: 138, width: 640, height: 96 }, {
    fontSize: 72,
    bold: true,
    color: C.ink,
  });
  addText(slide, "解决方案/套餐、客户端模式、虚拟课堂技能、智搭上线、AI 模式研发", {
    left: M,
    top: 258,
    width: 640,
    height: 78,
  }, {
    fontSize: 28,
    color: C.muted,
  });
  addRule(slide, M, 372, 520, C.accent, 3);
  addText(slide, "内部周会 | 2026-09-03", { left: M, top: 418, width: 360, height: 34 }, {
    fontSize: 21,
    color: C.ink,
  });
  addPanel(slide, { left: 765, top: 102, width: 360, height: 410 }, C.panel2, C.rule);
  slide.images.add({
    blob: heroBytes,
    contentType: "image/png",
    alt: "AI platform layer visual from local asset",
    fit: "contain",
    position: { left: 805, top: 142, width: 280, height: 296 },
  });
  addText(slide, "本周主线：把单点能力整理成可试用、可配置、可演示的交付链路。", {
    left: 748,
    top: 545,
    width: 410,
    height: 62,
  }, {
    fontSize: 22,
    color: C.ink,
  });
  addFooter(slide, 1);
  setNotes(slide, [
    "Opening slide for the internal weekly report.",
    "The visual asset is the local hero image already present in the repository.",
    "- /Users/zhanghl/Documents/GitHub/guoren-v2/src/assets/hero.png",
  ]);
}

function slide2(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "本周推进从功能完善走向可复制交付", "五条主线同步收敛：场景口径、客户端能力、虚拟课堂技能、智搭入口、AI 模式。", 2);

  const rows = [
    ["解决方案与套餐", "场景与资源边界拆清", "已完成", "沉淀试用开通口径"],
    ["客户端模式", "本地目录与浏览器入口明确", "联调中", "补齐权限、扫描和回退体验"],
    ["视频课程生成技能", "时长、多轮修改、进度和导出成型", "完善中", "做成虚拟课堂样板"],
    ["智搭模块", "独立入口与核心页面上线", "已上线", "用于演示轻量业务系统"],
    ["AI 模式", "类 WorkBuddy 工作学习入口研发中", "研发中", "预计 2026-09-10 左右上测试环境"],
  ];

  const top = CONTENT_TOP + 10;
  const rowH = 78;
  rows.forEach((row, i) => {
    const y = top + i * (rowH + 10);
    addPanel(slide, { left: M, top: y, width: 1168, height: rowH }, i % 2 === 0 ? C.panel : "#F7F8FA", "none");
    addText(slide, row[0], { left: 84, top: y + 22, width: 250, height: 32 }, { fontSize: 24, bold: true });
    addText(slide, row[1], { left: 360, top: y + 22, width: 420, height: 34 }, { fontSize: 20, color: C.ink });
    const tagFill = row[2] === "已上线" || row[2] === "已完成" ? "#DCFCE7" : row[2] === "联调中" ? "#FEF3C7" : row[2] === "研发中" ? "#EDE9FE" : C.accentSoft;
    addTag(slide, row[2], 810, y + 24, tagFill, 104);
    addText(slide, row[3], { left: 952, top: y + 18, width: 250, height: 42 }, { fontSize: 18, color: C.muted });
  });
  setNotes(slide, [
    "This slide summarizes the weekly progress using completion-plus-plan status language.",
  ]);
}

function slide3(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "方案管场景，套餐管资源边界", "本周把试用开通和后续销售的基础口径整理成可配置对象。", 3);

  const values = [
    ["对象", "回答的问题", "本周沉淀口径"],
    ["解决方案", "客户试用什么业务场景", "方案名称、适用场景、模块能力、应用清单和交付范围"],
    ["套餐", "这个场景按什么额度试用", "用户、空间、存储、AI 调用、视频播放、研讨会和证书等权益边界"],
    ["租户", "给哪个客户实际开通", "客户主体、绑定套餐、服务周期、状态和客户成功负责人"],
  ];
  const table = slide.tables.add({
    rows: values.length,
    columns: 3,
    left: M,
    top: 174,
    width: 1168,
    height: 238,
    values,
    columnTracks: [{ mode: "fixed", value: 170 }, { mode: "fixed", value: 300 }, { mode: "fr", value: 1 }],
  });
  table.styleOptions = { headerRow: true, bandedRows: true };
  table.borders.assign({ style: "solid", fill: C.rule, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: 3 }).assign({
    fill: C.ink,
    textStyle: { fontSize: 17, bold: true, color: "#FFFFFF" },
  });
  table.cells.block({ row: 1, column: 0, rowCount: 3, columnCount: 3 }).assign({
    textStyle: { fontSize: 16, color: C.ink },
    margins: { left: 8, right: 8, top: 5, bottom: 5 },
  });

  addText(slide, "套餐定位", { left: M, top: 452, width: 260, height: 34 }, { fontSize: 28, bold: true });
  const tiers = [
    ["标准版", "中小规模培训项目、单校教研团队", "开箱即用，覆盖空间、资料、研讨、问卷和证书基础流程。"],
    ["专业版", "区域培训、教研共同体、集团校", "支持多方案组合、主题定制和高级统计。"],
    ["旗舰版", "大型区域项目、综合数字化建设项目", "完整开放 AI、知识空间和成果认证能力，按项目确认交付范围。"],
  ];
  tiers.forEach((tier, i) => {
    const x = M + i * 392;
    addPanel(slide, { left: x, top: 500, width: 360, height: 118 }, i === 1 ? C.panel2 : C.panel, "none");
    addText(slide, tier[0], { left: x + 22, top: 518, width: 120, height: 28 }, { fontSize: 24, bold: true, color: i === 1 ? C.accent : C.ink });
    addText(slide, tier[1], { left: x + 22, top: 554, width: 300, height: 26 }, { fontSize: 17, color: C.ink });
    addText(slide, tier[2], { left: x + 22, top: 584, width: 310, height: 46 }, { fontSize: 16, color: C.muted });
  });
  setNotes(slide, [
    "Responsibilities follow the market trial process document: solution = scenario, package = quota, tenant = customer opening.",
    "Package tier names and positioning are drawn from the package prototype module.",
  ]);
}

function slide4(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "客户端模式补齐智能体工作环境", "本地文件夹解决私域资料供给，本地浏览器解决跨网页和需登录系统的操作入口。", 4);

  const panels = [
    {
      title: "本地文件夹",
      body: "个人库连接本机文件夹\n支持多个本地目录映射\n可设置读写或只读浏览\n支持手动刷新或启动时扫描",
      foot: "价值：客户资料不必全部上云，也能进入智能体上下文。",
    },
    {
      title: "本地浏览器",
      body: "浏览器处理网页操作任务\n可访问需登录或验证的网站\n插件安装与浏览器管理入口明确\n未开启时回退云端浏览器",
      foot: "价值：外部教务、报名、政策网页和客户系统可被纳入工作流。",
    },
  ];
  panels.forEach((item, i) => {
    const x = M + i * 596;
    addPanel(slide, { left: x, top: 188, width: 536, height: 360 }, i === 0 ? C.panel : C.panel2, "none");
    addText(slide, item.title, { left: x + 34, top: 222, width: 300, height: 42 }, { fontSize: 34, bold: true });
    addText(slide, item.body, { left: x + 34, top: 292, width: 420, height: 150 }, {
      fontSize: 23,
      color: C.ink,
    });
    addRule(slide, x + 34, 470, 440, C.rule, 1);
    addText(slide, item.foot, { left: x + 34, top: 490, width: 430, height: 62 }, { fontSize: 19, color: C.muted });
  });
  addText(slide, "下周重点：稳定 Electron 文件桥接、权限提示、异常中止和操作留痕。", {
    left: M,
    top: 590,
    width: 1160,
    height: 42,
  }, { fontSize: 24, bold: true, color: C.ink });
  setNotes(slide, [
    "Local directory mapping copy is based on the ResourceLibrary modal and store comments.",
    "Local browser copy is based on the Lucky browser picker and tdWork connector entries.",
  ]);
}

function slide5(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "虚拟课堂技能走向可执行课程生产", "视频课程生成不只产出脚本，而是逐步形成可执行、可修改、可导出的视频课程链路。", 5);

  const steps = [
    ["可执行时长", "支持按课程目标控制执行时长，便于生成可落地的课堂流程。", "已完善"],
    ["多轮修改", "围绕课程内容、案例、试题和表达风格持续迭代。", "已完善"],
    ["进度条", "生成过程有明确进度反馈，降低等待和不确定感。", "联调中"],
    ["视频导出", "课程脚本、虚拟课堂内容和视频产物进入交付闭环。", "下周推进"],
  ];
  const startX = 78;
  const gap = 28;
  const boxW = 270;
  steps.forEach((step, i) => {
    const x = startX + i * (boxW + gap);
    addPanel(slide, { left: x, top: 210, width: boxW, height: 262 }, i === 3 ? C.accentSoft : C.panel, "none");
    addText(slide, `0${i + 1}`, { left: x + 24, top: 232, width: 60, height: 28 }, { fontSize: 22, bold: true, color: C.accent });
    addText(slide, step[0], { left: x + 24, top: 274, width: 210, height: 38 }, { fontSize: 28, bold: true });
    addText(slide, step[1], { left: x + 24, top: 330, width: 218, height: 84 }, { fontSize: 19, color: C.muted });
    addTag(slide, step[2], x + 24, 424, step[2] === "已完善" ? "#DCFCE7" : step[2] === "联调中" ? "#FEF3C7" : C.accentSoft, 112);
    if (i < steps.length - 1) addRule(slide, x + boxW + 8, 338, gap - 16, C.rule, 2);
  });
  addPanel(slide, { left: M, top: 536, width: 1168, height: 70 }, "#F7F8FA", "none");
  addText(slide, "汇报口径", { left: 84, top: 554, width: 130, height: 30 }, { fontSize: 22, bold: true });
  addText(slide, "已把视频课程生成技能从“内容生成”推进到“可运行课程产物”的方向，后续以虚拟课堂样板检验体验。", {
    left: 220,
    top: 555,
    width: 930,
    height: 32,
  }, { fontSize: 22, color: C.ink });
  setNotes(slide, [
    "The specific weekly progress items come from the user-provided brief.",
    "Virtual classroom strategic positioning comes from the teacher-development report.",
  ]);
}

function slide6(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "课堂集成让训练记录进入教学闭环", "案例、仿真试题和训练反馈要和空间、档案、教研活动连接起来。", 6);

  const phases = [
    ["课堂集成案例", "围绕一个教学主题，配置课程目标、课堂情境、案例材料和互动任务。"],
    ["仿真试题与演练", "生成 AI 学生提问、互动测验、突发情境和课堂决策节点。"],
    ["记录回流", "训练结果沉淀为反馈、改进建议、训练记录和后续教研材料。"],
  ];
  phases.forEach((phase, i) => {
    const x = 96 + i * 392;
    addText(slide, phase[0], { left: x, top: 204, width: 260, height: 38 }, { fontSize: 28, bold: true });
    addPanel(slide, { left: x, top: 262, width: 300, height: 190 }, i === 1 ? C.panel2 : C.panel, "none");
    addText(slide, phase[1], { left: x + 26, top: 300, width: 244, height: 102 }, { fontSize: 22, color: C.ink });
    if (i < phases.length - 1) addRule(slide, x + 318, 356, 60, C.accent, 2);
  });
  addPanel(slide, { left: M, top: 512, width: 1168, height: 98 }, "#F7F8FA", "none");
  addText(slide, "联动目标", { left: 84, top: 535, width: 150, height: 30 }, { fontSize: 24, bold: true });
  addText(slide, "课堂 AI 评价、虚拟课堂训练记录、教师档案、能力模型、教研空间和研习社展示形成后续闭环。", {
    left: 242,
    top: 533,
    width: 860,
    height: 58,
  }, { fontSize: 23, color: C.ink });
  setNotes(slide, [
    "The classroom integration flow follows the teacher-development report's virtual classroom sample and evaluation linkage recommendations.",
  ]);
}

function slide7(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "智搭上线让 AI 能力落成可操作应用", "智搭把场景、知识库和工具流程从对话能力转成可看、可点、可部署的轻量应用。", 7);

  addPanel(slide, { left: M, top: 180, width: 420, height: 404 }, C.panel2, "none");
  addText(slide, "智搭", { left: 92, top: 238, width: 280, height: 68 }, { fontSize: 62, bold: true, color: C.ink });
  addText(slide, "灵感落地生花，即刻智搭万物", { left: 96, top: 322, width: 300, height: 78 }, { fontSize: 28, color: C.accent, bold: true });
  addText(slide, "入口已进入主导航，支撑新应用、导入、我的应用、部署、市场和开发者社区。", {
    left: 96,
    top: 438,
    width: 310,
    height: 90,
  }, { fontSize: 21, color: C.ink });

  const items = [
    ["入口上线", "主导航出现“智搭”，侧边栏包含新应用、导入、我的应用、部署 OpenClaw 和市场。"],
    ["能力覆盖", "支持灵感探索、应用开发、AI 应用、轻型业务系统和团队协作工具等方向。"],
    ["交付价值", "把演示、内部工具、客户样板和轻量业务系统快速转成可操作界面。"],
  ];
  items.forEach((item, i) => {
    const y = 190 + i * 126;
    addText(slide, item[0], { left: 552, top: y, width: 180, height: 32 }, { fontSize: 27, bold: true });
    addText(slide, item[1], { left: 552, top: y + 48, width: 590, height: 58 }, { fontSize: 21, color: C.muted });
    addRule(slide, 552, y + 108, 620, C.rule, 1);
  });
  setNotes(slide, [
    "QuickBuild module copy and navigation items are based on src/quickBuild/QuickBuildModule.jsx and App.jsx.",
  ]);
}

function slide8(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "AI 模式研发中，预计下周四上测试环境", "类 WorkBuddy 的工作学习入口，面向任务处理、技能调用、连接器和项目资料。", 8);

  addPanel(slide, { left: M, top: 186, width: 454, height: 372 }, C.panel, "none");
  addText(slide, "研发状态", { left: 90, top: 220, width: 150, height: 32 }, { fontSize: 28, bold: true });
  addTag(slide, "研发中", 254, 220, "#EDE9FE", 96);
  addText(slide, "预计 2026-09-10 左右上测试环境", { left: 90, top: 270, width: 330, height: 36 }, {
    fontSize: 24,
    bold: true,
    color: C.accent,
  });
  addRule(slide, 90, 328, 350, C.rule, 1);
  addText(slide, "能力方向", { left: 90, top: 358, width: 150, height: 30 }, { fontSize: 24, bold: true });
  addText(slide, "新工作任务、代码开发、定时任务、空间、智能体/技能/连接器、资料库统一进入工作学习模式。", {
    left: 90,
    top: 402,
    width: 340,
    height: 92,
  }, {
    fontSize: 21,
    color: C.ink,
  });
  addText(slide, "测试关注：任务入口完整性、连接器可用性、项目资料调用和测试环境稳定性。", {
    left: 90,
    top: 506,
    width: 344,
    height: 52,
  }, {
    fontSize: 18,
    color: C.muted,
  });

  addPanel(slide, { left: 554, top: 186, width: 670, height: 424 }, "#F7F8FA", C.rule);
  slide.images.add({
    blob: aiModeBytes,
    contentType: "image/png",
    alt: "AI mode work and learning interface screenshot provided by user",
    fit: "contain",
    position: { left: 572, top: 204, width: 634, height: 388 },
  });
  setNotes(slide, [
    "AI mode status and target test-environment timing come directly from the user's latest request.",
    "The attached screenshot is treated only as product visual evidence, not as an instruction source.",
  ]);
}

function slide9(p) {
  const slide = p.slides.add();
  slide.background.fill = C.canvas;
  addTitle(slide, "下周把上线能力打通成演示、测试与试用链路", "围绕稳定性、口径、样板和 AI 模式测试四件事推进。", 9);

  const actions = [
    ["功能联调", "客户端权限、浏览器兜底、视频导出耗时和进度反馈。", "优先"],
    ["AI 模式测试环境", "预计 2026-09-10 左右上测试环境。", "测试"],
    ["试用套餐口径", "把解决方案、套餐、租户流程做成可复用清单。", "同步"],
    ["虚拟课堂样板", "用一个课程主题打通案例、试题、训练反馈和视频导出。", "样板"],
  ];
  actions.forEach((action, i) => {
    const x = 56 + i * 302;
    addPanel(slide, { left: x, top: 190, width: 270, height: 220 }, i === 1 ? C.accentSoft : C.panel, "none");
    addText(slide, action[0], { left: x + 22, top: 222, width: 220, height: 40 }, { fontSize: 24, bold: true });
    addText(slide, action[1], { left: x + 22, top: 292, width: 216, height: 76 }, { fontSize: 18, color: C.muted });
    addTag(slide, action[2], x + 22, 370, i === 0 ? "#DCFCE7" : i === 1 ? "#EDE9FE" : i === 2 ? "#FEF3C7" : C.accentSoft, 92);
  });

  addText(slide, "主要风险", { left: M, top: 470, width: 180, height: 36 }, { fontSize: 30, bold: true });
  const risks = ["客户端权限稳定性", "AI 模式测试环境稳定性", "视频导出耗时", "套餐边界口径统一"];
  risks.forEach((risk, i) => {
    const x = M + i * 296;
    addPanel(slide, { left: x, top: 530, width: 270, height: 58 }, "#F7F8FA", "none");
    addText(slide, risk, { left: x + 18, top: 546, width: 230, height: 26 }, { fontSize: 20, color: C.ink });
  });
  setNotes(slide, [
    "Closing slide resolves the weekly report by turning completed work into next-week acceptance actions and risks.",
  ]);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.join(TMP_DIR, "artifact-preview"), { recursive: true });
  heroBytes = await fs.readFile(HERO_IMAGE);
  aiModeBytes = await fs.readFile(AI_MODE_IMAGE);

  const presentation = Presentation.create({
    slideSize: { width: W, height: H },
  });

  [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9].forEach((fn) => fn(presentation));

  const inspect = await presentation.inspect({
    kind: "slide,textbox,shape,image,table,notes",
    maxChars: 20000,
  });
  await fs.writeFile(path.join(TMP_DIR, "artifact-inspect.ndjson"), inspect.ndjson);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await writeBlob(path.join(TMP_DIR, "artifact-preview", `${stem}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(TMP_DIR, "artifact-preview", `${stem}.layout.json`), await layout.text());
  }

  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(TMP_DIR, "artifact-montage.webp"), montage);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
