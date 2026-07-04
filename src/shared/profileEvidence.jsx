import { useEffect, useState } from 'react';
import { Card, Drawer, Progress, Tabs, Tag } from 'antd';
import {
  AuditOutlined,
  BookOutlined,
  FolderOpenOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { findRecordAssociationRule, matchNamePattern } from './resourceRecordAssociations';

export const SOURCE_META = {
  teaching: {
    label: '教学数据',
    sourceType: '教学过程记录',
    color: '#1677ff',
    icon: <BookOutlined />,
    description: '课堂设计、课堂回看、作业反馈与学生表现数据。',
  },
  archive: {
    label: '档案数据',
    sourceType: '成长档案记录',
    color: '#7c3aed',
    icon: <FolderOpenOutlined />,
    description: '个人成长档案、荣誉证书、评价材料与阶段成果。',
  },
  study: {
    label: '培训研修数据',
    sourceType: '培训研修记录',
    color: '#0f766e',
    icon: <ReadOutlined />,
    description: '培训课程、线上研修、微证书和专项训练记录。',
  },
  research: {
    label: '教研数据',
    sourceType: '教研协同记录',
    color: '#ea580c',
    icon: <AuditOutlined />,
    description: '集体备课、主题教研、听评课与课题共创输出。',
  },
};

const SOURCE_KEYS = ['teaching', 'archive', 'study', 'research'];
const BUNDLE_VISIBLE_LIMIT = 5;
const LEVEL_RECORD_PATTERNS = [
  ['strong_match', 'basic_match', 'missing_record', 'missing_record', 'missing_record', 'missing_record'],
  ['strong_match', 'basic_match', 'low_match', 'missing_record', 'missing_record', 'missing_record'],
  ['basic_match', 'basic_match', 'low_match', 'missing_record', 'missing_record', 'missing_record'],
  ['strong_match', 'strong_match', 'basic_match', 'low_match', 'missing_record', 'missing_record'],
  ['basic_match', 'low_match', 'missing_record', 'missing_record', 'missing_record', 'missing_record'],
  ['strong_match', 'basic_match', 'basic_match', 'low_match', 'missing_record', 'missing_record'],
];

const MOCK_SOURCE_RECORDS = {
  teaching: [
    {
      id: 'teach-1',
      title: '《岳阳楼记》课堂设计稿',
      ownerName: '林知夏',
      date: '2026-06-11',
      tag: '教学设计',
      summary: '含目标-活动-评价一致性设计与分层问题链。',
      keyFindings: ['目标拆解已经能对齐学情分层。', '活动链设计较完整，但形成性评价节点仍偏少。'],
      evidenceExcerpt: '本课设置“文本细读-同伴讨论-观点表达-即时反馈”四段任务链，并在第二环节加入差异化问题卡。',
      attachments: [
        { name: '岳阳楼记-教学设计稿.docx', type: '教案', size: '268 KB' },
        { name: '学情诊断记录.xlsx', type: '数据表', size: '94 KB' },
      ],
      links: [
        { title: '课堂资源包预览', hint: '校本资源库 / 语文组 / 七年级下' },
      ],
      matchNote: '主要支撑“教学设计 > 目标与学情对齐”“教学设计 > 学习活动设计”两项能力。',
      nextAction: '下一轮备课时增加形成性评价量规，并在课堂中嵌入两次即时检测。',
    },
    {
      id: 'teach-2',
      title: '六月第三周课堂回看分析',
      ownerName: '林知夏',
      date: '2026-06-14',
      tag: '课堂回看',
      summary: '记录互动节奏、提问分布和即时反馈节点。',
      keyFindings: ['课堂前 15 分钟学生参与度高，但后段追问深度不足。', '板书与口头反馈能帮助学生快速回到目标。'],
      evidenceExcerpt: '课堂回看标记显示，开放性追问集中在第 11-18 分钟，后半段以教师讲解为主，学生二次表达机会偏少。',
      attachments: [
        { name: '第三周课堂回看标注.pdf', type: '课堂分析', size: '412 KB' },
        { name: '课堂互动时间轴.png', type: '截图', size: '186 KB' },
      ],
      links: [
        { title: '课堂录像片段', hint: '云课堂 / 语文公开课片段 03' },
      ],
      matchNote: '对应“课堂实施 > 互动引导”“课堂实施 > 课堂调控”，可直接作为课堂行为记录。',
      nextAction: '下次示范课增加二次追问和学生复述环节，压缩单向讲授时长。',
    },
    {
      id: 'teach-3',
      title: '单元作业诊断报表',
      ownerName: '林知夏',
      date: '2026-06-08',
      tag: '学习评价',
      summary: '聚合班级完成率、错误高频点与典型样例。',
      keyFindings: ['文言文翻译题失分高度集中。', '优秀样例可直接沉淀为讲评素材。'],
      evidenceExcerpt: '第 4 题平均得分率 56%，主要失分在关键词意象解释；A 班和 B 班完成率差异 14%。',
      attachments: [
        { name: '单元作业诊断报表.xlsx', type: '报表', size: '128 KB' },
      ],
      links: [
        { title: '题目讲评素材库', hint: '作业系统 / 语文 / 单元三 / 讲评素材' },
      ],
      matchNote: '主要支撑“学习评价 > 形成性反馈”“学习评价 > 评价数据应用”。',
      nextAction: '补充错因分类标签，并在下一次讲评中增加同伴互评任务。',
    },
  ],
  archive: [
    {
      id: 'archive-1',
      title: '2026 上半年教师成长档案',
      ownerName: '林知夏',
      date: '2026-06-16',
      tag: '成长档案',
      summary: '沉淀公开课、阶段反思、家校反馈与荣誉材料。',
      keyFindings: ['能够连续记录课堂改进行动。', '家校反馈与公开课材料已形成阶段闭环。'],
      evidenceExcerpt: '档案中包含 3 次公开课复盘、2 次家校沟通摘要、1 份阶段成长陈述和 4 项荣誉材料。',
      attachments: [
        { name: '2026上半年成长档案.pdf', type: '档案册', size: '1.8 MB' },
        { name: '阶段反思汇总.docx', type: '反思文档', size: '86 KB' },
      ],
      links: [
        { title: '成长档案在线查看', hint: '档案系统 / 我的档案 / 2026-H1' },
      ],
      matchNote: '可补强“专业发展 > 教学反思”“专业发展 > 教研协同”等长期成长能力项。',
      nextAction: '将反思条目与后续课堂调整结果做更明确的前后映射。',
    },
    {
      id: 'archive-2',
      title: '区级优质课评审材料',
      ownerName: '林知夏',
      date: '2026-05-28',
      tag: '成果材料',
      summary: '包含说课稿、课堂实录和专家评审意见。',
      keyFindings: ['说课逻辑完整，目标与活动一致性获得正向评价。', '专家建议进一步提升学生高阶表达任务设计。'],
      evidenceExcerpt: '评审意见指出：课堂结构清晰，文本细读设计有效，但辩证性追问仍有深化空间。',
      attachments: [
        { name: '优质课评审材料.zip', type: '材料包', size: '3.2 MB' },
        { name: '专家评审意见.pdf', type: '评审意见', size: '204 KB' },
      ],
      links: [
        { title: '区级优质课申报台账', hint: '教务平台 / 赛事申报 / 2026' },
      ],
      matchNote: '重点映射“教学设计”“课堂实施”，同时也可作为成果记录纳入成长档案。',
      nextAction: '基于专家意见补充高阶表达任务，并形成修订后的说课版本。',
    },
    {
      id: 'archive-3',
      title: '班主任育人案例归档',
      ownerName: '林知夏',
      date: '2026-05-19',
      tag: '案例归档',
      summary: '聚焦学生个别化支持和家校协同过程记录。',
      keyFindings: ['对学生个体差异识别较及时。', '家校沟通记录完整，可补充结果追踪数据。'],
      evidenceExcerpt: '案例记录了连续 3 周的支持过程，包括课堂观察、家长沟通纪要和阶段性行为反馈。',
      attachments: [
        { name: '育人案例归档.docx', type: '案例文档', size: '152 KB' },
      ],
      links: [
        { title: '家校沟通记录', hint: '班级管理 / 家校互通 / 个案 07' },
      ],
      matchNote: '与“课堂调控”“形成性反馈”存在辅助映射，也可作为教师综合育人能力记录。',
      nextAction: '补录学生阶段表现对比，形成更清晰的支持成效总结。',
    },
  ],
  study: [
    {
      id: 'study-1',
      title: '新课标学习评价专题研修',
      ownerName: '林知夏',
      date: '2026-06-10',
      tag: '专题学习',
      summary: '完成 12 学时课程与案例诊断作业。',
      keyFindings: ['对形成性评价工具的理解明显增强。', '已能独立完成评价量规初稿。'],
      evidenceExcerpt: '课程结业作业中提交了“单元任务评价量规”和“课堂观察表”两项工具，并通过讲师点评。',
      attachments: [
        { name: '专题研修结业证明.pdf', type: '学习证明', size: '92 KB' },
        { name: '评价量规作业.docx', type: '作业', size: '64 KB' },
      ],
      links: [
        { title: '课程学习记录', hint: '研修平台 / 新课标评价专题 / 已完成' },
      ],
      matchNote: '与“学习评价 > 形成性反馈”“学习评价 > 评价数据应用”直接关联。',
      nextAction: '把研修中形成的量规应用到当前单元教学，并回收一次使用反馈。',
    },
    {
      id: 'study-2',
      title: 'AI 赋能课堂互动训练营',
      ownerName: '林知夏',
      date: '2026-06-05',
      tag: '训练营',
      summary: '围绕提问设计、即时反馈与课堂节奏优化。',
      keyFindings: ['能使用 AI 辅助生成问题链。', '课堂节奏优化意识增强，但转化到实战仍需跟踪。'],
      evidenceExcerpt: '训练营中完成 3 轮课堂脚本演练，并针对学生沉默、偏题、时间超限等场景进行调控模拟。',
      attachments: [
        { name: '训练营演练记录.pdf', type: '训练记录', size: '233 KB' },
      ],
      links: [
        { title: '训练营任务面板', hint: '教师研修营 / AI课堂互动 / 第2期' },
      ],
      matchNote: '重点支撑“课堂实施 > 互动引导”“课堂实施 > 课堂调控”。',
      nextAction: '在下两次常态课中复用问题链设计模板，并记录学生回应质量变化。',
    },
    {
      id: 'study-3',
      title: '项目化学习教学设计微证书',
      ownerName: '林知夏',
      date: '2026-05-22',
      tag: '微证书',
      summary: '完成项目制任务设计与评价量规练习。',
      keyFindings: ['具备项目化任务拆解基础。', '任务成果评价标准还需要更细化。'],
      evidenceExcerpt: '微证书实践任务要求提交完整任务链、成果展示要求和评价规则，目前已完成项目草图及反馈修订。',
      attachments: [
        { name: '项目化学习微证书.png', type: '证书', size: '318 KB' },
        { name: '项目任务设计稿.docx', type: '设计稿', size: '102 KB' },
      ],
      links: [
        { title: '微证书项目说明', hint: '学习平台 / 微证书 / 项目化学习设计' },
      ],
      matchNote: '主要映射到“教学设计 > 学习活动设计”，同时辅助提升评价工具设计能力。',
      nextAction: '将项目化任务链与单元教学目标结合，设计一轮校内试点。',
    },
  ],
  research: [
    {
      id: 'research-1',
      title: '语文组单元整合备课纪要',
      ownerName: '林知夏',
      date: '2026-06-12',
      tag: '集体备课',
      summary: '围绕单元目标拆解、任务链设计与过程评价。',
      keyFindings: ['在集体备课中能主动输出目标拆解建议。', '对评价环节的设计建议开始被组内采纳。'],
      evidenceExcerpt: '纪要中记录林知夏提出“先目标后任务再评价”的整合路径，并承担课堂任务单优化工作。',
      attachments: [
        { name: '单元整合备课纪要.docx', type: '会议纪要', size: '76 KB' },
      ],
      links: [
        { title: '组内共备空间', hint: '教研平台 / 初中语文组 / 单元整合' },
      ],
      matchNote: '主要对应“专业发展 > 教研协同”“教学设计 > 目标与学情对齐”。',
      nextAction: '在下一轮集备中输出一版任务单模板，并收集团队使用反馈。',
    },
    {
      id: 'research-2',
      title: '青年教师听评课反馈单',
      ownerName: '林知夏',
      date: '2026-06-07',
      tag: '听评课',
      summary: '聚焦课堂调控、互动质量和板书结构。',
      keyFindings: ['课堂调控节奏较稳定。', '学生高质量表达的追问链仍可拉长。'],
      evidenceExcerpt: '反馈单指出，导入和文本细读阶段节奏把握较好，但讨论后的总结提炼仍偏教师主导。',
      attachments: [
        { name: '听评课反馈单.pdf', type: '反馈单', size: '144 KB' },
      ],
      links: [
        { title: '校内听评课台账', hint: '听评课系统 / 青年教师专项 / 06-07' },
      ],
      matchNote: '重点支撑“课堂实施 > 课堂调控”“课堂实施 > 互动引导”。',
      nextAction: '针对“讨论后提炼”这一环节做二次设计，并形成下一次试教改进点。',
    },
    {
      id: 'research-3',
      title: '主题教研“形成性评价工具包”共创稿',
      ownerName: '林知夏',
      date: '2026-05-30',
      tag: '教研共创',
      summary: '输出量规模板、观察表和复盘范式。',
      keyFindings: ['已能参与共创评价工具并贡献模板。', '对工具落地后的复盘机制思考较充分。'],
      evidenceExcerpt: '共创稿中包含 1 份课堂观察表、2 份形成性评价量规模板，以及一次使用后的复盘建议。',
      attachments: [
        { name: '形成性评价工具包共创稿.zip', type: '共创成果', size: '1.2 MB' },
      ],
      links: [
        { title: '教研共创过程看板', hint: '教研平台 / 主题共创 / 形成性评价工具包' },
      ],
      matchNote: '对应“学习评价”相关能力项，也能作为“专业发展 > 教研协同”的协作记录。',
      nextAction: '将共创工具包用于年级组试用，并形成一次使用反馈归档。',
    },
  ],
};

const MOCK_RECORD_CANDIDATES = Object.entries(MOCK_SOURCE_RECORDS).flatMap(([sourceKey, records]) => (
  records.map((record, recordIndex) => ({
    ...record,
    sourceKey,
    recordIndex,
  }))
));

function buildAiSuggestion(record, context = {}) {
  const relatedItemName = context.focusItemName || record.relatedItemNames?.[0] || record.tag || '当前能力项';
  return {
    draftType: 'SUGGEST_ONLY',
    generatedBy: '评价辅助智能体',
    confidence: context.confidence || 0.78,
    reviewStatus: 'PENDING_HUMAN',
    summary: `已基于当前证据为“${relatedItemName}”生成建议稿，仅供人工确认。`,
    suggestions: [
      `建议优先引用“${record.title}”中的关键片段，说明本次证据如何支撑 ${relatedItemName}。`,
      '如需进入正式评价，请补充评价主体意见和证据时间线，再提交人工复核。',
    ],
    references: [record.id],
    caution: 'AI 仅负责摘要、抽取和建议稿生成，不能直接形成最终评分或认定结论。',
  };
}

export function getSequenceForRole(role, sequences) {
  return sequences.find((item) => item.id === role?.sequenceId);
}

export function getRoleLevel(role, roleLevelId, sequences) {
  const sequence = getSequenceForRole(role, sequences);
  return sequence?.levels?.find((item) => item.id === roleLevelId) || null;
}

function buildStatusTag(score) {
  if (score >= 86) {
    return { label: '证据充分', color: 'success' };
  }
  if (score >= 72) {
    return { label: '证据初步具备', color: 'processing' };
  }
  return { label: '证据待补充', color: 'warning' };
}

function pushUnique(list, value) {
  if (value && !list.includes(value)) {
    list.push(value);
  }
}

function getCellEvidenceKey(itemId, levelKey) {
  return `${itemId}_${levelKey}`;
}

function createRelationBucket() {
  return {
    dimensions: [],
    items: [],
    levels: [],
    mappingRows: [],
    cellMappings: [],
  };
}

function clampScore(score, min, max) {
  return Math.max(min, Math.min(max, Math.round(score)));
}

function getLevelRecordScenario(dimensionIndex, itemIndex, levelIndex) {
  const pattern = LEVEL_RECORD_PATTERNS[(dimensionIndex * 3 + itemIndex) % LEVEL_RECORD_PATTERNS.length];
  const scenario = pattern[levelIndex] || 'missing_record';
  return levelIndex === 0 && scenario === 'missing_record' ? 'basic_match' : scenario;
}

function buildCellCoverage(dimensionIndex, itemIndex, levelIndex, scenario) {
  const offset = ((dimensionIndex * 5 + itemIndex * 3 + levelIndex * 2) % 7) - 3;
  if (scenario === 'strong_match') {
    return clampScore(90 + offset, 86, 96);
  }
  if (scenario === 'basic_match') {
    return clampScore(78 + offset, 72, 84);
  }
  if (scenario === 'low_match') {
    return clampScore(64 + offset, 58, 69);
  }
  return null;
}

function buildLevelMatchStatus(scenario) {
  switch (scenario) {
    case 'strong_match':
      return { key: scenario, label: '证据强支撑', shortLabel: '强支撑', color: 'success' };
    case 'basic_match':
      return { key: scenario, label: '证据初步具备', shortLabel: '初步具备', color: 'processing' };
    case 'low_match':
      return { key: scenario, label: '证据偏弱', shortLabel: '偏弱', color: 'warning' };
    default:
      return { key: 'missing_record', label: '证据缺失', shortLabel: '缺证', color: 'default' };
  }
}

function buildCellAssessmentScore(scenario, coverage) {
  if (scenario === 'missing_record') return 40;
  return coverage || 0;
}

function buildSuggestedRecordExamples(item, dimensionName) {
  if (Array.isArray(item?.evidenceExamples) && item.evidenceExamples.length) {
    return item.evidenceExamples.slice(0, 2);
  }
  if (matchNamePattern(dimensionName, '教学设计') || matchNamePattern(item?.name, '学习活动设计')) {
    return ['教学设计稿', '任务单或课件'];
  }
  if (matchNamePattern(dimensionName, '课堂实施')) {
    return ['课堂实录', '课堂回看分析'];
  }
  if (matchNamePattern(dimensionName, '学习评价')) {
    return ['作业诊断报表', '评价反馈记录'];
  }
  if (matchNamePattern(dimensionName, '专业发展')) {
    return ['教研纪要', '教学反思记录'];
  }
  return ['成长记录', '阶段成果材料'];
}

function buildLevelGrowthAdvice({ dimensionName, item, level, descriptorText, scenario, nextLevel }) {
  const targetText = descriptorText || item?.description || item?.name || dimensionName;
  const suggestedExamples = buildSuggestedRecordExamples(item, dimensionName);
  const exampleText = suggestedExamples.join('、');

  if (scenario === 'missing_record') {
    return {
      title: `${level.label} 仍缺少直接支撑记录`,
      summary: `当前 ${level.label} 还没有直接对应“${item.name}”的成长记录，建议优先补充能体现“${targetText}”的 ${exampleText}。`,
      actions: [
        `优先沉淀 1-2 条可直接支撑 ${level.label} 的过程性记录，如 ${exampleText}。`,
        '记录中要明确行为表现、结果反馈和改进动作，避免只有成果文件没有过程说明。',
      ],
    };
  }

  if (scenario === 'low_match') {
    return {
      title: `${level.label} 已有关联记录，但支撑偏弱`,
      summary: `当前已有资料与 ${level.label} 建立了关联，但对“${targetText}”的体现还不够完整，建议补强更直接的过程证据和结果反馈。`,
      actions: [
        `补充更能体现 ${level.label} 行为表现的 ${exampleText}，减少泛材料占比。`,
        '在记录中补上关键片段、数据变化或复盘结论，提高证据覆盖度和可信度。',
      ],
    };
  }

  if (scenario === 'basic_match') {
    return {
      title: `${level.label} 已形成初步支撑`,
      summary: `当前资料已能初步支撑 ${level.label}，下一步建议围绕“${targetText}”持续积累连续记录，形成更稳定的表现证据。`,
      actions: [
        `继续补充同类 ${exampleText}，至少形成连续两次以上的改进链路。`,
        '把本次记录中的做法与后续课堂或教研调整结果建立前后对照。',
      ],
    };
  }

  return {
    title: `${level.label} 已形成较强支撑`,
    summary: nextLevel?.label
      ? `当前资料已较好支撑 ${level.label}。下一步可对标 ${nextLevel.label}，继续沉淀更高阶的示范、带动或共创记录。`
      : `当前资料已较好支撑 ${level.label}，建议继续沉淀可复用案例和阶段成果，稳定优势表现。`,
    actions: nextLevel?.label
      ? [
        `尝试围绕 ${nextLevel.label} 的要求补充更高阶材料，如示范课、带教反馈或共创成果。`,
        '把当前做法固化成模板或案例，便于在后续教学与教研中复用。',
      ]
      : [
        `把当前与“${targetText}”相关的经验沉淀为案例包或方法清单。`,
        '继续保持同类型高质量记录，确保优势表现可持续复现。',
      ],
  };
}

function findPreferredSourceKeys(dimensionName, itemName, levelIndex) {
  const joinedText = `${dimensionName} ${itemName}`;
  if (matchNamePattern(joinedText, '课堂实施') || matchNamePattern(joinedText, '互动引导') || matchNamePattern(joinedText, '课堂调控')) {
    return ['teaching', 'study', 'research', 'archive'];
  }
  if (matchNamePattern(joinedText, '学习评价') || matchNamePattern(joinedText, '评价数据应用') || matchNamePattern(joinedText, '形成性反馈')) {
    return ['teaching', 'study', 'research', 'archive'];
  }
  if (matchNamePattern(joinedText, '专业发展') || matchNamePattern(joinedText, '教研协同') || matchNamePattern(joinedText, '教学反思')) {
    return ['research', 'archive', 'study', 'teaching'];
  }
  if (levelIndex >= 2) {
    return ['teaching', 'research', 'study', 'archive'];
  }
  return ['teaching', 'study', 'research', 'archive'];
}

function scoreMockRecordCandidate(record, dimensionName, itemName, preferredSourceKeys) {
  const associationRule = findRecordAssociationRule(record);
  let score = 0;

  if (associationRule?.itemNames?.some((name) => matchNamePattern(itemName, name))) {
    score += 7;
  }
  if (associationRule?.dimensionNames?.some((name) => matchNamePattern(dimensionName, name))) {
    score += 5;
  }
  if (matchNamePattern(record.tag, itemName) || matchNamePattern(record.title, itemName)) {
    score += 4;
  }
  if (matchNamePattern(record.tag, dimensionName) || matchNamePattern(record.title, dimensionName)) {
    score += 3;
  }
  const preferredIndex = preferredSourceKeys.indexOf(record.sourceKey);
  if (preferredIndex >= 0) {
    score += Math.max(0, 4 - preferredIndex);
  }
  return score;
}

function pickMockRecordForCell({ dimensionName, itemName, dimensionIndex, itemIndex, levelIndex }) {
  const preferredSourceKeys = findPreferredSourceKeys(dimensionName, itemName, levelIndex);
  const rankedCandidates = MOCK_RECORD_CANDIDATES
    .map((record) => ({
      ...record,
      matchScore: scoreMockRecordCandidate(record, dimensionName, itemName, preferredSourceKeys),
    }))
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }
      const leftSourceIndex = preferredSourceKeys.indexOf(left.sourceKey);
      const rightSourceIndex = preferredSourceKeys.indexOf(right.sourceKey);
      if (leftSourceIndex !== rightSourceIndex) {
        return (leftSourceIndex === -1 ? 99 : leftSourceIndex) - (rightSourceIndex === -1 ? 99 : rightSourceIndex);
      }
      return left.recordIndex - right.recordIndex;
    });

  const candidates = rankedCandidates.filter((item) => item.matchScore > 0);
  if (candidates.length) {
    return candidates[(dimensionIndex + itemIndex + levelIndex) % Math.min(candidates.length, 2)] || candidates[0];
  }

  return MOCK_RECORD_CANDIDATES[(dimensionIndex * 5 + itemIndex * 3 + levelIndex) % MOCK_RECORD_CANDIDATES.length];
}

function enrichEvidenceRecord(record, sourceKey, relationMap = {}) {
  const relation = relationMap[record.id] || createRelationBucket();
  const coverageSource = relation.cellMappings.length ? relation.cellMappings : relation.mappingRows;
  const averageCoverage = coverageSource.length
    ? Math.round(coverageSource.reduce((sum, item) => sum + item.coverage, 0) / coverageSource.length)
    : 0;
  const status = buildStatusTag(averageCoverage || 68);
  const associationRule = findRecordAssociationRule(record);
  return {
    ...record,
    associationRuleId: associationRule?.id || null,
    bundleKey: associationRule?.bundleKey || null,
    sourceKey,
    sourceLabel: SOURCE_META[sourceKey].label,
    sourceType: SOURCE_META[sourceKey].sourceType,
    relatedDimensionNames: relation.dimensions,
    relatedItemNames: relation.items,
    relatedLevelLabels: relation.levels,
    mappingRows: relation.mappingRows,
    cellMappings: relation.cellMappings,
    linkedItemCount: relation.items.length,
    linkedLevelCount: relation.levels.length,
    coverage: averageCoverage,
    statusLabel: status.label,
    statusColor: status.color,
    aiSuggestion: record.aiSuggestion || buildAiSuggestion({
      ...record,
      relatedItemNames: relation.items,
    }),
  };
}

function buildItemCoverage(cellMappings) {
  return cellMappings.length
    ? Math.round(cellMappings.reduce((sum, item) => sum + (item.assessmentScore || 0), 0) / cellMappings.length)
    : 0;
}

function buildItemLevelSummaryFromCells(cellMappings = []) {
  const groups = {
    strongLevels: [],
    basicLevels: [],
    lowLevels: [],
    missingLevels: [],
  };

  cellMappings.forEach((cell) => {
    const entry = {
      levelKey: cell.levelKey,
      levelLabel: cell.levelLabel,
      statusKey: cell.statusKey,
      statusLabel: cell.statusLabel,
      shortLabel: cell.shortStatusLabel,
      statusColor: cell.statusColor,
    };

    if (cell.statusKey === 'strong_match') groups.strongLevels.push(entry);
    else if (cell.statusKey === 'basic_match') groups.basicLevels.push(entry);
    else if (cell.statusKey === 'low_match') groups.lowLevels.push(entry);
    else groups.missingLevels.push(entry);
  });

  const focusCell = cellMappings.find((cell) => cell.statusKey === 'missing_record')
    || cellMappings.find((cell) => cell.statusKey === 'low_match')
    || cellMappings.find((cell) => cell.statusKey === 'basic_match')
    || cellMappings[cellMappings.length - 1]
    || null;

  return {
    ...groups,
    levelBadges: cellMappings.map((cell) => ({
      levelKey: cell.levelKey,
      levelLabel: cell.levelLabel,
      statusKey: cell.statusKey,
      statusLabel: cell.statusLabel,
      shortLabel: cell.shortStatusLabel,
      statusColor: cell.statusColor,
    })),
    focusLevelKey: focusCell?.levelKey || null,
    focusLevelLabel: focusCell?.levelLabel || null,
    summary: focusCell?.growthAdvice?.summary || '当前等级证据较完整，可继续补充更高阶证据。',
    actions: focusCell?.growthAdvice?.actions || [],
  };
}

export function buildModelGrowthRecordSnapshot(model, industries, roles, sequences) {
  if (!model) return null;

  const role = roles.find((item) => item.id === model.roleId);
  const sequence = getSequenceForRole(role, sequences);
  const roleLevel = getRoleLevel(role, model.roleLevelId, sequences);
  const industry = industries.find((item) => item.id === model.industryId);
  const evidenceRelationMap = {};
  const cellEvidenceMap = {};
  const cellStatusMap = {};
  const mappingRows = [];
  const sourceStats = Object.fromEntries(
    SOURCE_KEYS.map((key) => [key, {
      key,
      scoreSum: 0,
      evidenceCount: 0,
      itemCount: 0,
      latestRecord: MOCK_SOURCE_RECORDS[key][0],
    }]),
  );

  const dimensions = (model.dimensions || []).map((dimension, dimensionIndex) => {
    const itemRows = (dimension.items || []).map((item, itemIndex) => {
      const sourceCounter = Object.fromEntries(SOURCE_KEYS.map((key) => [key, 0]));
      const cellMappings = (model.levelScheme?.levels || []).map((level, levelIndex) => {
        const descriptor = item.levelDescriptors?.find((entry) => entry.levelKey === level.key);
        const nextLevel = (model.levelScheme?.levels || [])[levelIndex + 1] || null;
        const scenario = getLevelRecordScenario(dimensionIndex, itemIndex, levelIndex);
        const coverage = buildCellCoverage(dimensionIndex, itemIndex, levelIndex, scenario);
        const assessmentScore = buildCellAssessmentScore(scenario, coverage);
        const status = buildLevelMatchStatus(scenario);
        const record = scenario === 'missing_record'
          ? null
          : pickMockRecordForCell({
            dimensionName: dimension.name,
            itemName: item.name,
            dimensionIndex,
            itemIndex,
            levelIndex,
          });
        const sourceKey = record?.sourceKey || null;
        const sourceMeta = sourceKey ? SOURCE_META[sourceKey] : null;
        const advice = buildLevelGrowthAdvice({
          dimensionName: dimension.name,
          item,
          level,
          descriptorText: descriptor?.text,
          scenario,
          nextLevel,
        });
        const cellMapping = {
          key: `${dimension.id}_${item.id}_${level.key}`,
          cellKey: getCellEvidenceKey(item.id, level.key),
          dimensionId: dimension.id,
          dimensionName: dimension.name,
          itemId: item.id,
          itemName: item.name,
          levelKey: level.key,
          levelLabel: level.label,
          descriptorText: descriptor?.text || '',
          sourceKey,
          sourceLabel: sourceMeta?.label || '',
          evidenceId: record?.id || null,
          evidenceTitle: record?.title || '',
          evidenceDate: record?.date || '',
          evidenceTag: record?.tag || '',
          coverage,
          assessmentScore,
          hasRecord: Boolean(record),
          statusKey: status.key,
          statusLabel: status.label,
          shortStatusLabel: status.shortLabel,
          statusColor: status.color,
          growthAdvice: advice,
          note: record?.summary || advice.summary,
        };

        cellStatusMap[cellMapping.cellKey] = cellMapping;

        if (record && sourceKey) {
          sourceCounter[sourceKey] += 1;
          cellEvidenceMap[cellMapping.cellKey] = cellMapping;
          sourceStats[sourceKey].scoreSum += coverage || 0;
          sourceStats[sourceKey].evidenceCount += 1;
          sourceStats[sourceKey].itemCount += 1;
          sourceStats[sourceKey].latestRecord = record;

          if (!evidenceRelationMap[record.id]) {
            evidenceRelationMap[record.id] = createRelationBucket();
          }
          pushUnique(evidenceRelationMap[record.id].dimensions, dimension.name);
          pushUnique(evidenceRelationMap[record.id].items, item.name);
          pushUnique(evidenceRelationMap[record.id].levels, level.label);
          evidenceRelationMap[record.id].cellMappings.push(cellMapping);
        }

        return cellMapping;
      });

      const supportedCells = cellMappings.filter((cell) => cell.hasRecord);
      const primarySourceKey = SOURCE_KEYS.reduce((bestKey, key) => (
        sourceCounter[key] > sourceCounter[bestKey] ? key : bestKey
      ), supportedCells[0]?.sourceKey || SOURCE_KEYS[0]);
      const latestCell = [...supportedCells].sort((left, right) => (
        String(right.evidenceDate || '').localeCompare(String(left.evidenceDate || ''))
          || (right.coverage || 0) - (left.coverage || 0)
      ))[0] || null;
      const latestRecord = latestCell
        ? MOCK_SOURCE_RECORDS[latestCell.sourceKey].find((record) => record.id === latestCell.evidenceId)
        : null;
      const coverage = buildItemCoverage(cellMappings);
      const confidence = supportedCells.length
        ? Math.min(95, coverage + 6)
        : Math.min(88, coverage + 12);
      const status = buildStatusTag(coverage);
      const levelSummary = buildItemLevelSummaryFromCells(cellMappings);
      const row = {
        key: `${dimension.id}_${item.id}`,
        dimensionId: dimension.id,
        itemId: item.id,
        dimensionName: dimension.name,
        itemName: item.name,
        sourceKey: primarySourceKey,
        sourceLabel: SOURCE_META[primarySourceKey].label,
        evidenceId: latestRecord?.id || null,
        latestEvidenceTitle: latestRecord?.title || '暂无直接成长记录',
        latestEvidenceDate: latestRecord?.date || '-',
        evidenceTag: latestRecord?.tag || '待补充',
        coverage,
        confidence,
        evidenceCount: supportedCells.length,
        levelStatusSummary: levelSummary.levelBadges,
        levelFocusLabel: levelSummary.focusLevelLabel,
        adviceSummary: levelSummary.summary,
        adviceActions: levelSummary.actions,
        statusLabel: status.label,
        statusColor: status.color,
        note: latestRecord?.summary || levelSummary.summary,
        evidenceTypes: item.evidenceTypes || [],
        requiredEvidenceCount: item.requiredEvidenceCount || 1,
        requiredReviewRoles: item.requiredReviewRoles || [],
        isGrowthOnly: Boolean(item.isGrowthOnly),
        aiAssistMode: item.aiAssistMode || 'SUGGEST_ONLY',
      };

      if (latestRecord) {
        if (!evidenceRelationMap[latestRecord.id]) {
          evidenceRelationMap[latestRecord.id] = createRelationBucket();
        }
        pushUnique(evidenceRelationMap[latestRecord.id].dimensions, dimension.name);
        pushUnique(evidenceRelationMap[latestRecord.id].items, item.name);
        evidenceRelationMap[latestRecord.id].mappingRows.push(row);
      }
      mappingRows.push(row);

      return {
        ...row,
        cellMappings,
      };
    });

    const averageScore = itemRows.length
      ? Math.round(itemRows.reduce((sum, item) => sum + item.coverage, 0) / itemRows.length)
      : 0;
    const strongestSourceKey = itemRows.reduce(
      (bestItem, item) => (item.coverage > (bestItem?.coverage ?? -1) ? item : bestItem),
      null,
    )?.sourceKey || 'teaching';

    return {
      key: dimension.id,
      name: dimension.name,
      description: dimension.description,
      averageScore,
      itemCount: itemRows.length,
      strongestSourceKey,
    };
  });

  const normalizedSourceStats = Object.values(sourceStats).map((item) => ({
    ...item,
    averageScore: item.itemCount ? Math.round(item.scoreSum / item.itemCount) : 0,
    label: SOURCE_META[item.key].label,
    color: SOURCE_META[item.key].color,
    description: SOURCE_META[item.key].description,
    icon: SOURCE_META[item.key].icon,
    recordCount: MOCK_SOURCE_RECORDS[item.key].length,
    latestRecord: enrichEvidenceRecord(item.latestRecord, item.key, evidenceRelationMap),
  }));

  const recordsBySource = Object.fromEntries(
    Object.entries(MOCK_SOURCE_RECORDS).map(([key, records]) => [
      key,
      records.map((record) => enrichEvidenceRecord(record, key, evidenceRelationMap)),
    ]),
  );

  const evidenceById = Object.fromEntries(
    Object.values(recordsBySource).flatMap((records) => records.map((record) => [record.id, record])),
  );

  const overallCoverage = mappingRows.length
    ? Math.round(mappingRows.reduce((sum, item) => sum + item.coverage, 0) / mappingRows.length)
    : 0;

  return {
    context: {
      industryName: industry?.name || '基础教育',
      roleName: role?.name || '基础教育教师',
      sequenceName: sequence?.name || '基础教育教师发展序列',
      roleLevelName: roleLevel?.name || '青年教师',
    },
    modelDefinition: model ? JSON.parse(JSON.stringify(model)) : null,
    currentModel: {
      id: model.id,
      name: model.name,
      code: model.modelCode,
      description: model.description,
      levelCount: model.levelScheme?.levels?.length || 0,
      dimensionCount: model.dimensions?.length || 0,
      itemCount: mappingRows.length,
    },
    summary: {
      overallCoverage,
      strongItemCount: mappingRows.filter((item) => item.coverage >= 86).length,
      focusItemCount: mappingRows.filter((item) => item.coverage < 72).length,
      totalEvidenceCount: Object.values(cellEvidenceMap).length,
      missingLevelCount: Object.values(cellStatusMap).filter((item) => item.statusKey === 'missing_record').length,
      lowMatchLevelCount: Object.values(cellStatusMap).filter((item) => item.statusKey === 'low_match').length,
      strongLevelCount: Object.values(cellStatusMap).filter((item) => item.statusKey === 'strong_match').length,
    },
    dimensions,
    mappingRows,
    evidenceById,
    recordsBySource,
    sourceStats: normalizedSourceStats,
    cellEvidenceMap,
    cellStatusMap,
  };
}

export function pickCurrentTeacherModel(models, roles, sequences, options = {}) {
  const teacherRole = (options.preferredRoleCode
    ? roles.find((item) => item.code === options.preferredRoleCode)
    : null)
    || (options.preferredRoleName
      ? roles.find((item) => item.name === options.preferredRoleName)
      : null)
    || roles.find((item) => item.name === '基础教育教师')
    || roles.find((item) => item.name?.includes('教师'))
    || roles.find((item) => item.code === 'BASIC_TEACHER' || item.code === 'TEACHER')
    || roles[0];
  if (!teacherRole) return null;
  const sequence = getSequenceForRole(teacherRole, sequences);
  const preferredLevel = (options.preferredRoleLevelId
    ? sequence?.levels?.find((item) => item.id === options.preferredRoleLevelId)
    : null)
    || (options.preferredLevelCode
      ? sequence?.levels?.find((item) => item.code === options.preferredLevelCode)
      : null)
    || (options.preferredLevelName
      ? sequence?.levels?.find((item) => item.name.includes(options.preferredLevelName))
      : null)
    || sequence?.levels?.find((item) => item.name.includes('青年'))
    || sequence?.levels?.[1]
    || sequence?.levels?.[0];
  return models.find((item) => item.status === 'PUBLISHED' && item.roleId === teacherRole.id && item.roleLevelId === preferredLevel?.id)
    || models.find((item) => item.status === 'PUBLISHED' && item.roleId === teacherRole.id)
    || models.find((item) => item.status === 'PUBLISHED')
    || null;
}

function dedupeById(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
}

function getAllGrowthRecordBundleCandidates(snapshot) {
  const recordBuckets = Object.values(snapshot?.recordsBySource || {});
  return dedupeById(recordBuckets.flat());
}

function getBundleMatchRank(record, focusItemName, relatedItemNames, focusDimensionName, relatedDimensionNames) {
  if (!record) return 0;
  if (focusItemName && record.relatedItemNames?.includes(focusItemName)) {
    return 4;
  }
  if (relatedItemNames.length && record.relatedItemNames?.some((itemName) => relatedItemNames.includes(itemName))) {
    return 3;
  }
  if (focusDimensionName && record.relatedDimensionNames?.includes(focusDimensionName)) {
    return 2;
  }
  if (relatedDimensionNames.length && record.relatedDimensionNames?.some((dimensionName) => relatedDimensionNames.includes(dimensionName))) {
    return 1;
  }
  return 0;
}

function buildGrowthRecordBundle(snapshot, growthRecord) {
  if (!snapshot || !growthRecord) {
    return {
      bundleItems: [],
      bundleSummary: '当前成长记录包包含 0 条资料。',
      bundleSourceKeys: [],
      bundleSourceLabels: [],
    };
  }

  const bundleCandidates = getAllGrowthRecordBundleCandidates(snapshot);
  const currentRecord = bundleCandidates.find((record) => record.id === growthRecord.id) || null;
  const contextItemNames = Array.from(new Set([
    growthRecord.focusItemName,
    ...(growthRecord.relatedItemNames || []),
  ].filter(Boolean)));
  const contextDimensionNames = Array.from(new Set([
    growthRecord.focusDimensionName,
    ...(growthRecord.relatedDimensionNames || []),
  ].filter(Boolean)));
  const currentBundleKey = growthRecord.bundleKey || null;
  const semanticMatchedRecords = currentBundleKey
    ? bundleCandidates.filter((record) => (
      record.id === growthRecord.id
        || record.bundleKey === currentBundleKey
    ))
    : [];
  const matchedSourceRecords = bundleCandidates
    .map((record) => ({
      ...record,
      bundleMatchRank: record.id === growthRecord.id
        ? 6
        : currentBundleKey && record.bundleKey === currentBundleKey
          ? 5
          : getBundleMatchRank(
          record,
          growthRecord.focusItemName,
          contextItemNames,
          growthRecord.focusDimensionName,
          contextDimensionNames,
        ),
    }))
    .filter((record) => record.bundleMatchRank > 0);
  const preferredRecords = semanticMatchedRecords.length > 1
    ? semanticMatchedRecords.map((record) => ({
      ...record,
      bundleMatchRank: record.id === growthRecord.id ? 6 : 5,
    }))
    : matchedSourceRecords.length
      ? matchedSourceRecords
      : [currentRecord || growthRecord];
  const bundledRecords = dedupeById(preferredRecords).sort((left, right) => {
    if ((right.bundleMatchRank || 0) !== (left.bundleMatchRank || 0)) {
      return (right.bundleMatchRank || 0) - (left.bundleMatchRank || 0);
    }
    return String(right.date || '').localeCompare(String(left.date || ''));
  });

  const bundleItems = bundledRecords.map((record) => ({
    id: record.id,
    title: record.title,
    date: record.date,
    resourcePath: record.resourcePath || record.links?.[0]?.hint || '-',
    tag: record.tag,
    sourceKey: record.sourceKey,
    sourceLabel: record.sourceLabel,
    sourceType: record.sourceType || SOURCE_META[record.sourceKey]?.sourceType || '成长档案记录',
    coverage: record.coverage,
    statusLabel: record.statusLabel,
    statusColor: record.statusColor,
    summary: record.summary || '',
    evidenceExcerpt: record.evidenceExcerpt || '',
    nextAction: record.nextAction || '',
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    links: Array.isArray(record.links) ? record.links : [],
    ownerName: record.ownerName || '',
    sceneName: record.sceneName || '',
    activityLabel: record.activityLabel || '',
    isCurrent: record.id === growthRecord.id,
  }));
  const bundleSourceKeys = Array.from(new Set(bundleItems.map((item) => item.sourceKey).filter(Boolean)));
  const bundleSourceLabels = bundleSourceKeys.map((sourceKey) => SOURCE_META[sourceKey]?.label || sourceKey);
  const focusItemName = growthRecord.focusItemName || contextItemNames[0];
  const focusSemanticLabel = growthRecord.tag || growthRecord.activityLabel || null;
  let bundleSummary = `当前成长记录包包含 ${bundleItems.length} 条资料。`;

  if (bundleItems.length > 1 && semanticMatchedRecords.length > 1 && focusSemanticLabel) {
    bundleSummary = `由 ${bundleItems.length} 条同类成长记录组成，围绕“${focusSemanticLabel}”形成补充支撑。`;
  } else if (bundleItems.length > 1 && bundleSourceLabels.length > 1 && focusItemName) {
    bundleSummary = `由 ${bundleItems.length} 条跨来源资料组成，覆盖 ${bundleSourceLabels.join(' / ')}，围绕“${focusItemName}”提供支撑。`;
  } else if (bundleItems.length > 1 && bundleSourceLabels.length > 1) {
    bundleSummary = `由 ${bundleItems.length} 条跨来源资料组成，覆盖 ${bundleSourceLabels.join(' / ')}。`;
  } else if (bundleItems.length > 1 && focusItemName) {
    bundleSummary = `由 ${bundleItems.length} 条资料组成，围绕“${focusItemName}”提供支撑。`;
  } else if (bundleItems.length > 1) {
    bundleSummary = `由 ${bundleItems.length} 条资料组成，用于补充当前成长研判。`;
  }

  return {
    bundleItems,
    bundleSummary,
    bundleSourceKeys,
    bundleSourceLabels,
  };
}

export function resolveGrowthRecordFromSnapshot(snapshot, growthRecordId, focus = {}) {
  const growthRecord = snapshot?.evidenceById?.[growthRecordId];
  if (!growthRecord) return null;
  const focusLevelInsight = focus.focusItemId && focus.focusLevelKey
    ? resolveCellRecord(snapshot, focus.focusItemId, focus.focusLevelKey)
    : null;
  const focusItemLevelSummary = focus.focusItemId
    ? resolveItemLevelSummary(snapshot, focus.focusItemId)
    : null;
  const mergedGrowthRecord = {
    ...growthRecord,
    ...focus,
    focusLevelInsight,
    focusItemLevelSummary,
    aiSuggestion: growthRecord.aiSuggestion || buildAiSuggestion(growthRecord, focus),
  };
  return {
    ...mergedGrowthRecord,
    ...buildGrowthRecordBundle(snapshot, mergedGrowthRecord),
  };
}

export function resolveCellRecord(snapshot, itemId, levelKey) {
  return snapshot?.cellStatusMap?.[getCellEvidenceKey(itemId, levelKey)]
    || snapshot?.cellEvidenceMap?.[getCellEvidenceKey(itemId, levelKey)]
    || null;
}

export function resolveItemLevelSummary(snapshot, itemId) {
  if (!snapshot?.modelDefinition?.levelScheme?.levels?.length) return null;
  const cells = snapshot.modelDefinition.levelScheme.levels
    .map((level) => resolveCellRecord(snapshot, itemId, level.key))
    .filter(Boolean);
  return cells.length ? buildItemLevelSummaryFromCells(cells) : null;
}

export function GrowthRecordDetailDrawer({ growthRecord, open, onClose }) {
  const [activeTab, setActiveTab] = useState('detail');
  const [bundleExpanded, setBundleExpanded] = useState(false);
  const [previewBundleItemId, setPreviewBundleItemId] = useState('');

  useEffect(() => {
    setActiveTab('detail');
    setBundleExpanded(false);
    setPreviewBundleItemId(growthRecord?.focusBundleItemId || growthRecord?.id || '');
  }, [growthRecord?.id, growthRecord?.focusBundleItemId, open]);

  if (!growthRecord) {
    return null;
  }

  const currentLevelLabel = growthRecord.focusLevelLabel || growthRecord.relatedLevelLabels?.[0] || '-';
  const focusLevelInsight = growthRecord.focusLevelInsight;
  const focusItemLevelSummary = growthRecord.focusItemLevelSummary;
  const bundleItems = growthRecord.bundleItems || [];
  const bundleSourceKeys = growthRecord.bundleSourceKeys || [];
  const currentBundleItem = bundleItems.find((item) => item.isCurrent) || bundleItems[0] || null;
  const previewBundleItem = bundleItems.find((item) => item.id === previewBundleItemId) || currentBundleItem;
  const previewRecord = previewBundleItem
    ? {
      sourceType: previewBundleItem.sourceType || growthRecord.sourceType,
      sourceLabel: previewBundleItem.sourceLabel || growthRecord.sourceLabel,
      sourceKey: previewBundleItem.sourceKey || growthRecord.sourceKey,
      title: previewBundleItem.title || growthRecord.title,
      tag: previewBundleItem.tag || growthRecord.tag,
      date: previewBundleItem.date || growthRecord.date,
      statusLabel: previewBundleItem.statusLabel || growthRecord.statusLabel,
      statusColor: previewBundleItem.statusColor || growthRecord.statusColor,
      coverage: typeof previewBundleItem.coverage === 'number' ? previewBundleItem.coverage : growthRecord.coverage,
      summary: previewBundleItem.summary || growthRecord.summary,
      evidenceExcerpt: previewBundleItem.evidenceExcerpt || growthRecord.evidenceExcerpt,
      nextAction: previewBundleItem.nextAction || growthRecord.nextAction,
      attachments: Array.isArray(previewBundleItem.attachments) ? previewBundleItem.attachments : growthRecord.attachments,
      links: Array.isArray(previewBundleItem.links) ? previewBundleItem.links : growthRecord.links,
      ownerName: previewBundleItem.ownerName || growthRecord.ownerName,
      sceneName: previewBundleItem.sceneName || growthRecord.sceneName,
      activityLabel: previewBundleItem.activityLabel || growthRecord.activityLabel,
      resourcePath: previewBundleItem.resourcePath || growthRecord.resourcePath || growthRecord.links?.[0]?.hint || '-',
    }
    : growthRecord;
  const isBundlePreview = Boolean(previewBundleItem && previewBundleItem.id !== growthRecord.id);
  const previewSummary = previewRecord.summary || previewRecord.evidenceExcerpt || growthRecord.summary || '当前材料暂无补充说明。';
  const currentCoverage = typeof previewBundleItem?.coverage === 'number'
    ? previewBundleItem.coverage
    : (growthRecord.focusCoverage ?? growthRecord.coverage);
  const previewAttachments = Array.isArray(previewRecord.attachments) ? previewRecord.attachments : [];
  const previewLinks = Array.isArray(previewRecord.links) ? previewRecord.links : [];
  const hiddenBundleCount = Math.max(0, bundleItems.length - BUNDLE_VISIBLE_LIMIT);
  const visibleBundleItems = bundleExpanded ? bundleItems : bundleItems.slice(0, BUNDLE_VISIBLE_LIMIT);
  const detailContent = (
    <>
      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>基础信息</span>
        </div>
        <div className="shared-record-drawer-kv">
          <div><span>来源类型</span><strong>{previewRecord.sourceType}</strong></div>
          <div><span>数据来源</span><strong>{previewRecord.sourceLabel}</strong></div>
          {previewRecord.sceneName ? <div><span>来源空间</span><strong>{previewRecord.sceneName}</strong></div> : null}
          {previewRecord.activityLabel ? <div><span>业务类型</span><strong>{previewRecord.activityLabel}</strong></div> : null}
          <div><span>归属人</span><strong>{previewRecord.ownerName}</strong></div>
          <div><span>记录时间</span><strong>{previewRecord.date}</strong></div>
          <div><span>当前关联能力项</span><strong>{growthRecord.focusItemName || growthRecord.relatedItemNames?.[0] || '-'}</strong></div>
          <div><span>当前关联等级</span><strong>{currentLevelLabel}</strong></div>
        </div>
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>能力映射</span>
          <Tag color="blue">{growthRecord.linkedItemCount} 个能力项</Tag>
        </div>
        <div className="shared-record-drawer-tags">
          {growthRecord.relatedDimensionNames.map((item) => (
            <Tag key={item} color="geekblue">{item}</Tag>
          ))}
        </div>
        <div className="shared-record-drawer-tags">
          {growthRecord.relatedItemNames.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
        <div className="shared-record-drawer-tags">
          {growthRecord.relatedLevelLabels.map((item) => (
            <Tag key={item} color={item === currentLevelLabel ? 'cyan' : 'default'}>{item}</Tag>
          ))}
        </div>
        <div className="shared-record-drawer-match">
          <div>
            <span>当前证据覆盖度</span>
            <strong>{currentCoverage}%</strong>
          </div>
          <Progress percent={currentCoverage} size="small" strokeColor={SOURCE_META[previewRecord.sourceKey]?.color} />
        </div>
        <p className="shared-record-drawer-note">{growthRecord.matchNote}</p>
        {focusLevelInsight || focusItemLevelSummary ? (
          <div className="shared-record-drawer-inline-section">
            <div className="shared-record-drawer-section-head">
              <span>等级成长建议</span>
              {focusLevelInsight ? <Tag color={focusLevelInsight.statusColor}>{focusLevelInsight.levelLabel} · {focusLevelInsight.statusLabel}</Tag> : null}
            </div>
            {focusItemLevelSummary?.levelBadges?.length ? (
              <div className="shared-record-drawer-tags">
                {focusItemLevelSummary.levelBadges.map((item) => (
                  <Tag key={item.levelKey} color={item.statusColor}>
                    {item.levelLabel} · {item.shortLabel}
                  </Tag>
                ))}
              </div>
            ) : null}
            <p className="shared-record-drawer-note">
              {focusLevelInsight?.growthAdvice?.summary || focusItemLevelSummary?.summary || '当前等级证据较完整，可继续补充更高阶证据。'}
            </p>
            {(focusLevelInsight?.growthAdvice?.actions || focusItemLevelSummary?.actions || []).length ? (
              <ul className="shared-record-drawer-list">
                {(focusLevelInsight?.growthAdvice?.actions || focusItemLevelSummary?.actions || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="shared-record-drawer-inline-section">
          <div className="shared-record-drawer-section-head">
            <span>成长记录包内容</span>
            <Tag>{bundleItems.length} 条资料</Tag>
          </div>
          <p className="shared-record-drawer-note">{growthRecord.bundleSummary || '当前成长记录包包含 0 条资料。'}</p>
          {bundleSourceKeys.length ? (
            <div className="shared-record-drawer-tags shared-record-drawer-bundle-sources">
              {bundleSourceKeys.map((sourceKey) => (
                <Tag key={sourceKey} color={SOURCE_META[sourceKey]?.color}>
                  {SOURCE_META[sourceKey]?.label || sourceKey}
                </Tag>
              ))}
            </div>
          ) : null}
          {bundleItems.length ? (
            <div className="shared-record-drawer-bundle-list">
              {visibleBundleItems.map((item) => {
                const isPreview = item.id === previewBundleItem?.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`shared-record-drawer-bundle-item${item.isCurrent ? ' is-current' : ''}${isPreview ? ' is-preview' : ''}`}
                    onClick={() => setPreviewBundleItemId(item.id)}
                  >
                  <div className="shared-record-drawer-bundle-top">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </div>
                  <div className="shared-record-drawer-bundle-meta">
                    <Tag color={SOURCE_META[item.sourceKey]?.color}>{item.sourceLabel}</Tag>
                    <Tag>{item.tag}</Tag>
                    <Tag color={item.statusColor}>{item.coverage}% · {item.statusLabel}</Tag>
                    {item.isCurrent ? <Tag color="blue">当前资料</Tag> : null}
                    {isPreview ? <Tag color="gold">正在预览</Tag> : null}
                  </div>
                  <div className="shared-record-drawer-bundle-path">{item.resourcePath || '-'}</div>
                  </button>
                );
              })}
              {hiddenBundleCount > 0 ? (
                <button
                  type="button"
                  className="shared-record-drawer-bundle-more"
                  onClick={() => setBundleExpanded((value) => !value)}
                >
                  {bundleExpanded ? '收起' : `更多（+${hiddenBundleCount}）`}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="shared-record-drawer-history-empty">暂无成长记录包资料</div>
          )}
        </div>
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>AI 建议稿</span>
          <Tag color="processing">AI生成 · 待人工确认</Tag>
        </div>
        <p className="shared-record-drawer-note">{growthRecord.aiSuggestion?.summary || '当前记录暂无 AI 建议稿。'}</p>
        {growthRecord.aiSuggestion?.suggestions?.length ? (
          <ul className="shared-record-drawer-list">
            {growthRecord.aiSuggestion.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {growthRecord.aiSuggestion?.caution ? (
          <p className="shared-record-drawer-note">{growthRecord.aiSuggestion.caution}</p>
        ) : null}
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>关键结论</span>
        </div>
        <ul className="shared-record-drawer-list">
          {growthRecord.keyFindings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>记录片段</span>
        </div>
        <div className="shared-record-drawer-excerpt">{previewRecord.evidenceExcerpt}</div>
        <div className="shared-record-drawer-section-head">
          <span>后续行动</span>
        </div>
        <p className="shared-record-drawer-note">{previewRecord.nextAction}</p>
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>附件与链接</span>
        </div>
        <div className="shared-record-drawer-asset-block">
          <span className="shared-record-drawer-subtitle">附件</span>
          <div className="shared-record-drawer-asset-list">
            {previewAttachments.map((item) => (
              <div key={item.name} className="shared-record-drawer-asset-item">
                <strong>{item.name}</strong>
                <span>{item.type} · {item.size}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="shared-record-drawer-asset-block">
          <span className="shared-record-drawer-subtitle">相关链接</span>
          <div className="shared-record-drawer-asset-list">
            {previewLinks.map((item) => (
              <div key={item.title} className="shared-record-drawer-asset-item">
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
  const historyContent = (
    <Card bordered={false} className="shared-record-drawer-card">
      <div className="shared-record-drawer-section-head">
        <span>历史记录与覆盖趋势</span>
        <Tag>{growthRecord.historyRecords?.length || 0} 条记录</Tag>
      </div>
      <p className="shared-record-drawer-note">{growthRecord.trendSummary || '暂无更多历史记录'}</p>
      {growthRecord.historyRecords?.length > 1 ? (
        <div className="shared-record-drawer-history-list">
          {growthRecord.historyRecords.map((item) => (
            <div
              key={item.id}
              className={`shared-record-drawer-history-item${item.isCurrent ? ' is-current' : ''}`}
            >
              <div className="shared-record-drawer-history-top">
                <strong>{item.title}</strong>
                <span>{item.date}</span>
              </div>
              <div className="shared-record-drawer-history-meta">
                <Tag>{item.tag}</Tag>
                <Tag color={item.statusColor}>{item.coverage}% · {item.statusLabel}</Tag>
                {item.isCurrent ? <Tag color="blue">当前记录</Tag> : null}
              </div>
              <div className="shared-record-drawer-history-path">{item.resourcePath || '-'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shared-record-drawer-history-empty">暂无更多历史记录</div>
      )}
    </Card>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      placement="right"
      title={isBundlePreview ? '证据预览' : '摘要'}
      className="shared-record-drawer"
    >
      <div className="shared-record-drawer-body">
        <div className="shared-record-drawer-hero">
          <div className="shared-record-drawer-kicker">{isBundlePreview ? '证据预览' : '摘要'}</div>
          <h3>{previewRecord.title}</h3>
          <div className="shared-record-drawer-meta">
            <Tag color={SOURCE_META[previewRecord.sourceKey]?.color}>{previewRecord.sourceLabel}</Tag>
            <Tag>{previewRecord.tag}</Tag>
            <Tag>{previewRecord.date}</Tag>
            <Tag color={previewRecord.statusColor}>{previewRecord.statusLabel}</Tag>
            {isBundlePreview ? <Tag color="gold">当前预览材料</Tag> : null}
          </div>
          <p>{previewSummary}</p>
          {previewRecord.resourcePath && previewRecord.resourcePath !== '-' ? (
            <div className="shared-record-drawer-preview-path">来源路径：{previewRecord.resourcePath}</div>
          ) : null}
          {isBundlePreview ? (
            <div className="shared-record-drawer-preview-hint">所属成长记录：{growthRecord.title}</div>
          ) : null}
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="shared-record-drawer-tabs"
          items={[
            { key: 'detail', label: '摘要', children: detailContent },
            { key: 'history', label: '历史记录', children: historyContent },
          ]}
        />
      </div>
    </Drawer>
  );
}
