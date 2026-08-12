import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const TMP_DIR = "/Users/zhanghl/Documents/GitHub/guoren-v2/.tmp/ai-native-business-deck";
const FINAL_PPTX = "/Users/zhanghl/Documents/GitHub/guoren-v2/outputs/ai-native-business-execution-mode.pptx";
const SOURCE_MD = "/Users/zhanghl/Documents/GitHub/guoren-v2/docs/ai-native-driven-system-use-cases.md";

const W = 1280;
const H = 720;
const FONT = "PingFang SC, Helvetica Neue, Arial, sans-serif";
const COLORS = {
  canvas: "#FFFFFF",
  ink: "#000000",
  muted: "#585858",
  faint: "#F2F2F2",
  panel: "#EDEDED",
  rule: "#B8BCC4",
  accent: "#6DCBF4",
  accentStrong: "#3D8DFF",
  paleBlue: "#EAF6FE",
};

function frame(left, top, width, height) {
  return { left, top, width, height };
}

function setNotes(slide, summary) {
  slide.speakerNotes.textFrame.setText(
    `${summary}\n\n[Sources]\n- Based on the local Markdown source: ${SOURCE_MD}\n- No external web sources or third-party visual assets were used.`
  );
  slide.speakerNotes.setVisible(true);
}

function addText(slide, name, text, position, style = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    fontSize: style.fontSize ?? 20,
    bold: style.bold ?? false,
    color: style.color ?? COLORS.ink,
    alignment: style.alignment ?? "left",
    verticalAlignment: style.verticalAlignment ?? "top",
    typeface: style.typeface ?? FONT,
    autoFit: style.autoFit ?? "shrinkText",
  };
  return box;
}

function addRect(slide, name, position, fill = COLORS.faint, line = "none") {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position,
    fill,
    line:
      line === "none"
        ? { style: "solid", fill: "none", width: 0 }
        : { style: "solid", fill: line, width: 1 },
  });
}

function addPanel(slide, name, position, fill = COLORS.faint) {
  return slide.shapes.add({
    geometry: "roundRect",
    name,
    position,
    fill,
    line: { style: "solid", fill: "#E0E0E0", width: 1 },
    borderRadius: "rounded-md",
  });
}

function addRule(slide, name, x, y, width, color = COLORS.rule) {
  addRect(slide, name, frame(x, y, width, 3), color);
}

function addPageNumber(slide, n) {
  addText(slide, `page-${n}`, String(n).padStart(2, "0"), frame(1182, 658, 56, 24), {
    fontSize: 13,
    color: COLORS.ink,
    alignment: "right",
    verticalAlignment: "bottom",
  });
}

function addSlideTitle(slide, title, n, subtitle = "") {
  addText(slide, `title-${n}`, title, frame(41, 36, 1030, 82), {
    fontSize: 38,
    bold: true,
    color: COLORS.ink,
    autoFit: "shrinkText",
  });
  if (subtitle) {
    addText(slide, `subtitle-${n}`, subtitle, frame(41, 115, 1060, 56), {
      fontSize: 21,
      color: COLORS.muted,
      autoFit: "shrinkText",
    });
  }
  addPageNumber(slide, n);
}

function addKeyValue(slide, name, index, title, body, x, y, width, height) {
  addPanel(slide, `${name}-panel-${index}`, frame(x, y, width, height), COLORS.faint);
  if (height < 170) {
    addText(slide, `${name}-idx-${index}`, String(index).padStart(2, "0"), frame(x + 24, y + 20, 48, 28), {
      fontSize: 20,
      bold: true,
      color: COLORS.accentStrong,
    });
    addText(slide, `${name}-title-${index}`, title, frame(x + 78, y + 18, width - 102, 32), {
      fontSize: 23,
      bold: true,
      color: COLORS.ink,
    });
    addText(slide, `${name}-body-${index}`, body, frame(x + 24, y + 58, width - 48, height - 74), {
      fontSize: 17,
      color: COLORS.muted,
    });
  } else {
    addText(slide, `${name}-idx-${index}`, String(index).padStart(2, "0"), frame(x + 26, y + 28, 56, 32), {
      fontSize: 22,
      bold: true,
      color: COLORS.accentStrong,
    });
    addText(slide, `${name}-title-${index}`, title, frame(x + 26, y + 78, width - 52, 44), {
      fontSize: 27,
      bold: true,
      color: COLORS.ink,
    });
    addText(slide, `${name}-body-${index}`, body, frame(x + 26, y + 132, width - 52, height - 160), {
      fontSize: 18,
      color: COLORS.muted,
    });
  }
}

function addTwoColumnCompare(slide, name, leftTitle, rightTitle, rows, yStart = 198) {
  const leftX = 62;
  const rightX = 676;
  const colW = 542;
  addText(slide, `${name}-left-title`, leftTitle, frame(leftX, 154, colW, 36), {
    fontSize: 25,
    bold: true,
  });
  addText(slide, `${name}-right-title`, rightTitle, frame(rightX, 154, colW, 36), {
    fontSize: 25,
    bold: true,
    color: COLORS.accentStrong,
  });
  rows.forEach((row, i) => {
    const y = yStart + i * 88;
    addRect(slide, `${name}-row-rule-${i}`, frame(41, y + 72, 1197, 2), COLORS.rule);
    addText(slide, `${name}-left-${i}`, row[0], frame(leftX, y, colW, 64), {
      fontSize: 22,
      color: COLORS.muted,
    });
    addText(slide, `${name}-right-${i}`, row[1], frame(rightX, y, colW, 64), {
      fontSize: 22,
      color: COLORS.ink,
      bold: true,
    });
  });
}

function createDeck() {
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  const onlySlide = Number(process.env.ONLY_SLIDE || "0");
  let slideCursor = 0;
  function include() {
    slideCursor += 1;
    return onlySlide === 0 || onlySlide === slideCursor;
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addText(slide, "cover-kicker", "果仁业务系统 / AI 原生专题", frame(41, 42, 520, 42), {
      fontSize: 26,
      color: COLORS.muted,
    });
    addText(slide, "cover-title", "AI 原生业务执行模式", frame(41, 183, 930, 190), {
      fontSize: 64,
      bold: true,
      color: COLORS.ink,
      verticalAlignment: "bottom",
      autoFit: "shrinkText",
    });
    addText(slide, "cover-subtitle", "应用场景、组织影响与落地建议", frame(41, 498, 760, 60), {
      fontSize: 31,
      color: COLORS.ink,
    });
    addRule(slide, "cover-accent", 41, 620, 260, COLORS.accentStrong);
    addText(slide, "cover-note", "从功能系统到任务执行主导者", frame(41, 640, 520, 34), {
      fontSize: 20,
      color: COLORS.muted,
    });
    setNotes(slide, "Open by framing the deck as a shift in business execution, not a feature introduction.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "AI 原生首先是一种业务思维模式", 2, "它不只是技术、平台或聊天入口，而是重新思考业务目标如何被理解、拆解、执行和优化。");
    addRect(slide, "mindset-accent", frame(41, 202, 12, 292), COLORS.accentStrong);
    addText(slide, "mindset-quote", "公司不再只问：\n“系统应该有哪些功能？”\n\n而是进一步问：\n“业务目标如何被智能体执行？”", frame(76, 194, 610, 310), {
      fontSize: 35,
      bold: true,
      color: COLORS.ink,
      autoFit: "shrinkText",
    });
    const items = [
      ["流程设计", "围绕任务目标重组流程，不再围绕菜单拆分动作"],
      ["组织协作", "让智能体主动串联角色、数据、知识和系统能力"],
      ["人才培养", "员工转向表达目标、校准输出和判断业务风险"],
    ];
    items.forEach((item, i) => addKeyValue(slide, "mindset", i + 1, item[0], item[1], 734, 174 + i * 145, 456, 118));
    setNotes(slide, "Explain that AI-native is a management and operating model shift, not only a technology upgrade.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "核心变化是从功能操作走向目标执行", 3);
    addTwoColumnCompare(
      slide,
      "mode-shift",
      "传统系统模式",
      "AI 原生模式",
      [
        ["人找菜单、填表单、推流程", "人表达目标，智能体选择路径并推进任务"],
        ["系统主要负责记录和留痕", "系统具备理解、规划、执行和反馈能力"],
        ["业务依赖人工协调和经验判断", "lucky 负责拆解任务、调用能力和提醒异常"],
        ["数据更多用于事后报表", "数据实时参与方案生成、过程预警和经营分析"],
      ]
    );
    addText(slide, "mode-arrow", "→", frame(607, 346, 70, 56), {
      fontSize: 46,
      bold: true,
      color: COLORS.accentStrong,
      alignment: "center",
    });
    setNotes(slide, "This slide contrasts the old operating model and the target AI-native operating model.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "lucky 可以成为任务的执行主导者", 4, "人的角色更聚焦在目标确认、专业校准、关键判断和风险决策。");
    addRule(slide, "leader-line", 88, 353, 1110, COLORS.ink);
    const steps = [
      ["需求澄清", "理解业务意图"],
      ["任务拆解", "形成执行步骤"],
      ["系统调用", "配置项目与资源"],
      ["过程推进", "提醒、预警、转交"],
      ["结果沉淀", "生成报告与经验"],
    ];
    steps.forEach((step, i) => {
      const x = 88 + i * 270;
      slide.shapes.add({
        geometry: "ellipse",
        name: `leader-dot-${i}`,
        position: frame(x - 7, 346, 15, 15),
        fill: i === 2 ? COLORS.accentStrong : COLORS.ink,
        line: { style: "solid", fill: "none", width: 0 },
      });
      addText(slide, `leader-step-title-${i}`, step[0], frame(x - 12, 257, 176, 34), {
        fontSize: 25,
        bold: true,
        color: i === 2 ? COLORS.accentStrong : COLORS.ink,
      });
      addText(slide, `leader-step-body-${i}`, step[1], frame(x - 12, 402, 185, 56), {
        fontSize: 20,
        color: COLORS.muted,
      });
    });
    addPanel(slide, "leader-lucky-panel", frame(476, 496, 338, 74), COLORS.paleBlue);
    addText(slide, "leader-lucky", "lucky 不是旁路助手，而是面向任务执行的业务入口", frame(500, 512, 292, 46), {
      fontSize: 21,
      bold: true,
      alignment: "center",
      color: COLORS.accentStrong,
    });
    setNotes(slide, "Describe lucky as an agent that can lead execution while humans retain judgment and approval.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "培训项目是最典型的端到端场景", 5);
    addText(slide, "training-left-title", "传统模式", frame(64, 170, 360, 42), {
      fontSize: 27,
      bold: true,
    });
    addText(slide, "training-right-title", "AI 原生模式", frame(705, 170, 360, 42), {
      fontSize: 27,
      bold: true,
      color: COLORS.accentStrong,
    });
    addText(
      slide,
      "training-left",
      "用户提出培训需求\n教研部门设计培训计划\n教务部门创建项目、配置课程\n人工安排讲师、导入学员\n持续处理通知、签到、资料和反馈",
      frame(64, 235, 500, 286),
      { fontSize: 24, color: COLORS.muted }
    );
    addText(
      slide,
      "training-right",
      "用户与 lucky 多轮对话澄清需求\nlucky 自动生成培训计划\n确认后创建项目并配置课程\n自动生成服务清单和通知\n持续推动过程服务与评估复盘",
      frame(705, 235, 500, 286),
      { fontSize: 24, color: COLORS.ink, bold: true }
    );
    addText(slide, "training-arrow", "→", frame(594, 336, 72, 56), {
      fontSize: 46,
      bold: true,
      color: COLORS.accentStrong,
      alignment: "center",
    });
    addPanel(slide, "training-value-panel", frame(184, 574, 914, 58), COLORS.paleBlue);
    addText(slide, "training-value", "业务价值：减少跨部门反复沟通，让培训项目从人工协调型流程转向目标驱动型交付。", frame(210, 590, 862, 30), {
      fontSize: 20,
      bold: true,
      color: COLORS.accentStrong,
      alignment: "center",
    });
    setNotes(slide, "Use the training project example to make the execution model concrete.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "培训业务的智能体执行链路可以覆盖全流程", 6);
    const stages = [
      ["需求沟通", "多轮澄清对象、目标、时间与预算"],
      ["方案生成", "生成培训计划、课程组合与实施排期"],
      ["项目创建", "在空间中创建项目并配置基础信息"],
      ["课程配置", "匹配讲师、课程、资料与学习任务"],
      ["过程服务", "提醒、签到、作业、答疑和异常转交"],
      ["评估复盘", "汇总数据，生成报告并沉淀经验"],
    ];
    addRule(slide, "training-chain-line", 72, 310, 1136, COLORS.rule);
    stages.forEach((stage, i) => {
      const x = 72 + i * 190;
      addText(slide, `stage-num-${i}`, String(i + 1).padStart(2, "0"), frame(x, 230, 70, 34), {
        fontSize: 24,
        bold: true,
        color: COLORS.accentStrong,
      });
      slide.shapes.add({
        geometry: "ellipse",
        name: `stage-dot-${i}`,
        position: frame(x + 3, 302, 17, 17),
        fill: COLORS.accentStrong,
        line: { style: "solid", fill: "none", width: 0 },
      });
      addText(slide, `stage-title-${i}`, stage[0], frame(x, 340, 152, 40), {
        fontSize: 24,
        bold: true,
        color: COLORS.ink,
      });
      addText(slide, `stage-body-${i}`, stage[1], frame(x, 392, 152, 118), {
        fontSize: 17,
        color: COLORS.muted,
      });
    });
    setNotes(slide, "Show that the AI-native training scenario covers the complete lifecycle, not a single task.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "15 个案例可以归为四类业务任务", 7, "场景越高频、重复、跨部门、强规则、强数据依赖，越适合优先改造。");
    const groups = [
      ["培训交付", "培训项目组织\n课程资源建设\n排课与师资安排\n报名与分班\n过程服务\n效果评估\n证书与结业\n项目复盘"],
      ["客户增长", "客户需求转方案\n招生与营销活动\n客户成功与续约"],
      ["商业履约", "合同、报价与交付联动\n管理驾驶舱分析"],
      ["组织运营", "制度与流程助手\n内部协同任务推进"],
    ];
    groups.forEach((group, i) => {
      const x = 41 + i * 302;
      addPanel(slide, `case-group-${i}`, frame(x, 212, 272, 368), i === 0 ? COLORS.paleBlue : COLORS.faint);
      addText(slide, `case-group-title-${i}`, group[0], frame(x + 24, 242, 224, 40), {
        fontSize: 26,
        bold: true,
        color: i === 0 ? COLORS.accentStrong : COLORS.ink,
      });
      addText(slide, `case-group-body-${i}`, group[1], frame(x + 24, 306, 224, 236), {
        fontSize: i === 0 ? 18 : 20,
        color: COLORS.muted,
      });
    });
    setNotes(slide, "Group the 15 application cases into business task families for easier executive discussion.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "系统变化不是一个入口，而是五个层面的重构", 8);
    const rows = [
      ["入口", "用户找菜单和表单", "用户表达业务目标"],
      ["流程", "流程由人推动，系统被动记录", "流程由智能体牵引，系统主动执行"],
      ["角色", "业务人员跨系统、跨部门协调", "lucky 承担拆解、协调、推进和沉淀"],
      ["数据", "数据用于事后统计和报表展示", "数据实时参与方案、预警和决策建议"],
      ["经验", "经验散落在个人和文档中", "经验沉淀为可检索、可复用的组织资产"],
    ];
    addText(slide, "system-h1", "变化层面", frame(74, 166, 160, 34), { fontSize: 22, bold: true });
    addText(slide, "system-h2", "过去", frame(292, 166, 360, 34), { fontSize: 22, bold: true, color: COLORS.muted });
    addText(slide, "system-h3", "现在", frame(720, 166, 430, 34), { fontSize: 22, bold: true, color: COLORS.accentStrong });
    rows.forEach((row, i) => {
      const y = 218 + i * 78;
      if (i % 2 === 0) addRect(slide, `system-row-bg-${i}`, frame(41, y - 10, 1197, 64), COLORS.faint);
      addText(slide, `system-row-name-${i}`, row[0], frame(74, y, 140, 38), {
        fontSize: 23,
        bold: true,
        color: COLORS.ink,
      });
      addText(slide, `system-row-old-${i}`, row[1], frame(292, y, 360, 42), {
        fontSize: 20,
        color: COLORS.muted,
      });
      addText(slide, `system-row-new-${i}`, row[2], frame(720, y, 430, 42), {
        fontSize: 20,
        bold: true,
        color: COLORS.ink,
      });
    });
    setNotes(slide, "Summarize the five system-level changes described in the Markdown source.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "对公司的影响会体现在组织运行方式上", 9, "AI 原生会推动公司从控制流程，转向让系统围绕目标自动组织执行。");
    const impacts = [
      ["目标驱动", "管理重点从要求员工按流程操作，转向围绕业务目标自动组织执行。"],
      ["系统理解人", "员工不必先学习复杂菜单，通过自然语言即可进入业务流程。"],
      ["智能体主导执行", "减少人工催办和跨部门反复沟通，执行体系更稳定。"],
      ["能力在组织", "项目经验、客户经验和交付经验沉淀为组织级知识资产。"],
      ["过程洞察", "提前识别延期、满意度、资源冲突和履约风险。"],
    ];
    impacts.forEach((impact, i) => {
      const x = i < 3 ? 41 + i * 411 : 246 + (i - 3) * 411;
      const y = i < 3 ? 218 : 428;
      addPanel(slide, `impact-panel-${i}`, frame(x, y, 360, 150), i === 0 ? COLORS.paleBlue : COLORS.faint);
      addText(slide, `impact-title-${i}`, impact[0], frame(x + 25, y + 24, 302, 34), {
        fontSize: 25,
        bold: true,
        color: i === 0 ? COLORS.accentStrong : COLORS.ink,
      });
      addText(slide, `impact-body-${i}`, impact[1], frame(x + 25, y + 72, 302, 54), {
        fontSize: 17,
        color: COLORS.muted,
      });
    });
    setNotes(slide, "Translate the AI-native model into organizational impact and management implications.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "公司需要把建设重心从功能清单转向任务体系", 10);
    const actions = [
      ["重新梳理业务任务", "优先选择高频、重复、跨部门、强规则、强数据依赖的任务，例如创建培训项目、生成客户方案、完成排课。"],
      ["建立可调用的业务能力", "将创建项目、配置课程、查询讲师档期、生成证书、发送通知、发起审批等能力标准化封装。"],
      ["建设数据和知识底座", "治理客户、课程、讲师、项目、合同、反馈和制度流程数据，沉淀知识库、案例库、模板库和规则库。"],
    ];
    actions.forEach((action, i) => {
      addKeyValue(slide, "company-actions", i + 1, action[0], action[1], 41 + i * 411, 212, 374, 300);
    });
    addText(slide, "company-actions-bottom", "这是 lucky 从“回答问题”进一步走向“执行任务”的前提。", frame(166, 578, 948, 44), {
      fontSize: 25,
      bold: true,
      color: COLORS.accentStrong,
      alignment: "center",
    });
    setNotes(slide, "Identify the first three company changes required to make the agent executable, not merely conversational.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "落地 AI 原生，还要调整组织机制", 11);
    const mechanisms = [
      ["岗位能力", "培养员工清晰表达目标、校准 AI 输出、判断业务风险、优化任务模板和沉淀经验。"],
      ["责任边界", "明确哪些事项自动执行，哪些事项需要人工确认，哪些事项必须负责人审批。"],
      ["持续迭代", "建立反馈机制，持续优化提示词、任务模板、业务规则、知识库和系统接口。"],
    ];
    mechanisms.forEach((item, i) => {
      const x = 84 + i * 390;
      addRect(slide, `mechanism-topline-${i}`, frame(x, 210, 305, 4), i === 1 ? COLORS.accentStrong : COLORS.ink);
      addText(slide, `mechanism-title-${i}`, item[0], frame(x, 244, 310, 42), {
        fontSize: 30,
        bold: true,
        color: i === 1 ? COLORS.accentStrong : COLORS.ink,
      });
      addText(slide, `mechanism-body-${i}`, item[1], frame(x, 322, 310, 176), {
        fontSize: 21,
        color: COLORS.muted,
      });
    });
    addPanel(slide, "mechanism-bottom", frame(160, 576, 960, 58), COLORS.faint);
    addText(slide, "mechanism-bottom-text", "AI 原生不是一次性上线，而是在真实业务中持续训练、优化和进化。", frame(190, 592, 900, 30), {
      fontSize: 21,
      bold: true,
      alignment: "center",
    });
    setNotes(slide, "Explain the organizational mechanisms needed beyond platform construction.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addSlideTitle(slide, "建议采用分场景、分阶段的推进路径", 12);
    const phases = [
      ["选择高频场景", "从培训项目、排课、过程服务、评估报告等高频任务切入。"],
      ["打通系统能力", "让项目、课程、讲师、通知、审批、证书等能力可被 lucky 调用。"],
      ["沉淀知识规则", "建设课程库、案例库、制度库、交付模板和风险清单。"],
      ["建立协同闭环", "设置确认点、审批线、异常转交和持续反馈机制。"],
    ];
    phases.forEach((phase, i) => {
      const x = 60 + i * 300;
      addText(slide, `phase-num-${i}`, `0${i + 1}`, frame(x, 206, 92, 54), {
        fontSize: 38,
        bold: true,
        color: COLORS.accentStrong,
      });
      addRule(slide, `phase-rule-${i}`, x, 288, 232, i === 0 ? COLORS.accentStrong : COLORS.rule);
      addText(slide, `phase-title-${i}`, phase[0], frame(x, 322, 232, 40), {
        fontSize: 25,
        bold: true,
      });
      addText(slide, `phase-body-${i}`, phase[1], frame(x, 386, 232, 116), {
        fontSize: 18,
        color: COLORS.muted,
      });
      if (i < 3) {
        addText(slide, `phase-arrow-${i}`, "→", frame(x + 244, 318, 40, 36), {
          fontSize: 25,
          bold: true,
          color: COLORS.rule,
          alignment: "center",
        });
      }
    });
    addText(slide, "phase-bottom", "先把一个场景跑通，再把任务模板、系统能力和组织经验复制到更多场景。", frame(150, 588, 980, 40), {
      fontSize: 24,
      bold: true,
      color: COLORS.ink,
      alignment: "center",
    });
    setNotes(slide, "Offer a practical phased rollout path grounded in the Markdown recommendations.");
  }

  if (include()) {
    const slide = p.slides.add();
    slide.background.fill = COLORS.canvas;
    addText(slide, "close-kicker", "总结", frame(41, 42, 180, 42), {
      fontSize: 28,
      color: COLORS.muted,
    });
    addText(slide, "close-title", "让 lucky 成为组织面向任务执行的智能业务入口", frame(41, 170, 1010, 260), {
      fontSize: 55,
      bold: true,
      color: COLORS.ink,
      verticalAlignment: "bottom",
      autoFit: "shrinkText",
    });
    addText(
      slide,
      "close-outcomes",
      "业务执行更自动化\n组织经验更可复用\n管理决策更实时\n员工更聚焦判断、创造和服务质量",
      frame(41, 526, 600, 122),
      { fontSize: 25, color: COLORS.muted }
    );
    addRule(slide, "close-accent", 41, 492, 285, COLORS.accentStrong);
    setNotes(slide, "Close by reinforcing the intended end-state for the organization.");
  }

  return p;
}

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
  const renderDir = path.join(TMP_DIR, "rendered");
  await fs.rm(renderDir, { recursive: true, force: true });
  await fs.mkdir(renderDir, { recursive: true });

  const presentation = createDeck();
  const limitSlides = Number(process.env.LIMIT_SLIDES || "0");
  if (limitSlides > 0 && limitSlides < presentation.slides.items.length) {
    presentation.slides.items.splice(limitSlides);
  }

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await writeBlob(path.join(renderDir, `${stem}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(renderDir, `${stem}.layout.json`), await layout.text());
  }

  const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(TMP_DIR, "ai-native-business-execution-mode-montage.webp"), montage);

  const inspect = await presentation.inspect({
    kind: "slide,textbox,shape,table,chart,notes,layout",
    maxChars: 30000,
  });
  await fs.writeFile(path.join(TMP_DIR, "ai-native-business-execution-mode.inspect.ndjson"), inspect.ndjson);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
