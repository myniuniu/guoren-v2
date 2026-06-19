import { useEffect, useState } from 'react';
import { Card, Drawer, Progress, Tabs, Tag } from 'antd';
import {
  AuditOutlined,
  BookOutlined,
  FolderOpenOutlined,
  ReadOutlined,
} from '@ant-design/icons';

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
    label: '学习数据',
    sourceType: '学习研修记录',
    color: '#0f766e',
    icon: <ReadOutlined />,
    description: '研修课程、线上学习、微证书和专项训练记录。',
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

export function getSequenceForRole(role, sequences) {
  return sequences.find((item) => item.id === role?.sequenceId);
}

export function getRoleLevel(role, roleLevelId, sequences) {
  const sequence = getSequenceForRole(role, sequences);
  return sequence?.levels?.find((item) => item.id === roleLevelId) || null;
}

function buildStatusTag(score) {
  if (score >= 86) {
    return { label: '已形成优势', color: 'success' };
  }
  if (score >= 72) {
    return { label: '基本匹配', color: 'processing' };
  }
  return { label: '待补强', color: 'warning' };
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

function enrichEvidenceRecord(record, sourceKey, relationMap = {}) {
  const relation = relationMap[record.id] || createRelationBucket();
  const coverageSource = relation.cellMappings.length ? relation.cellMappings : relation.mappingRows;
  const averageCoverage = coverageSource.length
    ? Math.round(coverageSource.reduce((sum, item) => sum + item.coverage, 0) / coverageSource.length)
    : 0;
  const status = buildStatusTag(averageCoverage || 68);
  return {
    ...record,
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
  };
}

function buildCellCoverage(dimensionIndex, itemIndex, levelIndex) {
  return Math.min(96, 62 + dimensionIndex * 6 + itemIndex * 5 + levelIndex * 4);
}

function buildItemCoverage(cellMappings) {
  return cellMappings.length
    ? Math.round(cellMappings.reduce((sum, item) => sum + item.coverage, 0) / cellMappings.length)
    : 0;
}

export function buildModelGrowthRecordSnapshot(model, industries, roles, sequences) {
  if (!model) return null;

  const role = roles.find((item) => item.id === model.roleId);
  const sequence = getSequenceForRole(role, sequences);
  const roleLevel = getRoleLevel(role, model.roleLevelId, sequences);
  const industry = industries.find((item) => item.id === model.industryId);
  const evidenceRelationMap = {};
  const cellEvidenceMap = {};
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
        const sourceKey = SOURCE_KEYS[(dimensionIndex + itemIndex + levelIndex) % SOURCE_KEYS.length];
        const sourceMeta = SOURCE_META[sourceKey];
        const recordPool = MOCK_SOURCE_RECORDS[sourceKey];
        const record = recordPool[(dimensionIndex * 3 + itemIndex + levelIndex) % recordPool.length];
        const coverage = buildCellCoverage(dimensionIndex, itemIndex, levelIndex);
        const status = buildStatusTag(coverage);
        const cellMapping = {
          key: `${dimension.id}_${item.id}_${level.key}`,
          cellKey: getCellEvidenceKey(item.id, level.key),
          dimensionId: dimension.id,
          dimensionName: dimension.name,
          itemId: item.id,
          itemName: item.name,
          levelKey: level.key,
          levelLabel: level.label,
          sourceKey,
          sourceLabel: sourceMeta.label,
          evidenceId: record.id,
          evidenceTitle: record.title,
          evidenceDate: record.date,
          evidenceTag: record.tag,
          coverage,
          statusLabel: status.label,
          statusColor: status.color,
          note: record.summary,
        };

        sourceCounter[sourceKey] += 1;
        cellEvidenceMap[cellMapping.cellKey] = cellMapping;
        sourceStats[sourceKey].scoreSum += coverage;
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

        return cellMapping;
      });

      const primarySourceKey = SOURCE_KEYS.reduce((bestKey, key) => (
        sourceCounter[key] > sourceCounter[bestKey] ? key : bestKey
      ), SOURCE_KEYS[0]);
      const latestRecord = MOCK_SOURCE_RECORDS[primarySourceKey][(dimensionIndex * 2 + itemIndex) % MOCK_SOURCE_RECORDS[primarySourceKey].length];
      const coverage = buildItemCoverage(cellMappings);
      const confidence = Math.min(95, coverage + 5);
      const status = buildStatusTag(coverage);
      const row = {
        key: `${dimension.id}_${item.id}`,
        dimensionName: dimension.name,
        itemName: item.name,
        sourceKey: primarySourceKey,
        sourceLabel: SOURCE_META[primarySourceKey].label,
        evidenceId: latestRecord.id,
        latestEvidenceTitle: latestRecord.title,
        latestEvidenceDate: latestRecord.date,
        evidenceTag: latestRecord.tag,
        coverage,
        confidence,
        evidenceCount: cellMappings.length,
        statusLabel: status.label,
        statusColor: status.color,
        note: latestRecord.summary,
      };

      if (!evidenceRelationMap[latestRecord.id]) {
        evidenceRelationMap[latestRecord.id] = createRelationBucket();
      }
      pushUnique(evidenceRelationMap[latestRecord.id].dimensions, dimension.name);
      pushUnique(evidenceRelationMap[latestRecord.id].items, item.name);
      evidenceRelationMap[latestRecord.id].mappingRows.push(row);
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
    },
    dimensions,
    mappingRows,
    evidenceById,
    recordsBySource,
    sourceStats: normalizedSourceStats,
    cellEvidenceMap,
  };
}

export function pickCurrentTeacherModel(models, roles, sequences) {
  const teacherRole = roles.find((item) => item.name === '基础教育教师')
    || roles.find((item) => item.name?.includes('教师'))
    || roles.find((item) => item.code === 'BASIC_TEACHER' || item.code === 'TEACHER')
    || roles[0];
  if (!teacherRole) return null;
  const sequence = getSequenceForRole(teacherRole, sequences);
  const preferredLevel = sequence?.levels?.find((item) => item.name.includes('青年')) || sequence?.levels?.[1] || sequence?.levels?.[0];
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
  const matchedSourceRecords = bundleCandidates
    .map((record) => ({
      ...record,
      bundleMatchRank: record.id === growthRecord.id
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
  const bundledRecords = dedupeById(
    matchedSourceRecords.length ? matchedSourceRecords : [currentRecord || growthRecord],
  ).sort((left, right) => {
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
    coverage: record.coverage,
    statusLabel: record.statusLabel,
    statusColor: record.statusColor,
    isCurrent: record.id === growthRecord.id,
  }));
  const bundleSourceKeys = Array.from(new Set(bundleItems.map((item) => item.sourceKey).filter(Boolean)));
  const bundleSourceLabels = bundleSourceKeys.map((sourceKey) => SOURCE_META[sourceKey]?.label || sourceKey);
  const focusItemName = growthRecord.focusItemName || contextItemNames[0];
  let bundleSummary = `当前成长记录包包含 ${bundleItems.length} 条资料。`;

  if (bundleItems.length > 1 && bundleSourceLabels.length > 1 && focusItemName) {
    bundleSummary = `由 ${bundleItems.length} 条跨来源资料组成，覆盖 ${bundleSourceLabels.join(' / ')}，围绕“${focusItemName}”提供支撑。`;
  } else if (bundleItems.length > 1 && bundleSourceLabels.length > 1) {
    bundleSummary = `由 ${bundleItems.length} 条跨来源资料组成，覆盖 ${bundleSourceLabels.join(' / ')}。`;
  } else if (bundleItems.length > 1 && focusItemName) {
    bundleSummary = `由 ${bundleItems.length} 条资料组成，围绕“${focusItemName}”提供支撑。`;
  } else if (bundleItems.length > 1) {
    bundleSummary = `由 ${bundleItems.length} 条资料组成，用于补充当前成长判断。`;
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
  const mergedGrowthRecord = {
    ...growthRecord,
    ...focus,
  };
  return {
    ...mergedGrowthRecord,
    ...buildGrowthRecordBundle(snapshot, mergedGrowthRecord),
  };
}

export function resolveCellRecord(snapshot, itemId, levelKey) {
  return snapshot?.cellEvidenceMap?.[getCellEvidenceKey(itemId, levelKey)] || null;
}

export function GrowthRecordDetailDrawer({ growthRecord, open, onClose }) {
  const [activeTab, setActiveTab] = useState('detail');
  const [bundleExpanded, setBundleExpanded] = useState(false);

  useEffect(() => {
    setActiveTab('detail');
    setBundleExpanded(false);
  }, [growthRecord?.id, open]);

  if (!growthRecord) {
    return null;
  }

  const currentLevelLabel = growthRecord.focusLevelLabel || growthRecord.relatedLevelLabels?.[0] || '-';
  const currentCoverage = growthRecord.focusCoverage || growthRecord.coverage;
  const bundleItems = growthRecord.bundleItems || [];
  const bundleSourceKeys = growthRecord.bundleSourceKeys || [];
  const hiddenBundleCount = Math.max(0, bundleItems.length - BUNDLE_VISIBLE_LIMIT);
  const visibleBundleItems = bundleExpanded ? bundleItems : bundleItems.slice(0, BUNDLE_VISIBLE_LIMIT);
  const detailContent = (
    <>
      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>基础信息</span>
        </div>
        <div className="shared-record-drawer-kv">
          <div><span>来源类型</span><strong>{growthRecord.sourceType}</strong></div>
          <div><span>数据来源</span><strong>{growthRecord.sourceLabel}</strong></div>
          <div><span>归属人</span><strong>{growthRecord.ownerName}</strong></div>
          <div><span>记录时间</span><strong>{growthRecord.date}</strong></div>
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
            <span>当前匹配度</span>
            <strong>{currentCoverage}%</strong>
          </div>
          <Progress percent={currentCoverage} size="small" strokeColor={SOURCE_META[growthRecord.sourceKey].color} />
        </div>
        <p className="shared-record-drawer-note">{growthRecord.matchNote}</p>
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
              {visibleBundleItems.map((item) => (
                <div
                  key={item.id}
                  className={`shared-record-drawer-bundle-item${item.isCurrent ? ' is-current' : ''}`}
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
                  </div>
                  <div className="shared-record-drawer-bundle-path">{item.resourcePath || '-'}</div>
                </div>
              ))}
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
        <div className="shared-record-drawer-excerpt">{growthRecord.evidenceExcerpt}</div>
        <div className="shared-record-drawer-section-head">
          <span>后续行动</span>
        </div>
        <p className="shared-record-drawer-note">{growthRecord.nextAction}</p>
      </Card>

      <Card bordered={false} className="shared-record-drawer-card">
        <div className="shared-record-drawer-section-head">
          <span>附件与链接</span>
        </div>
        <div className="shared-record-drawer-asset-block">
          <span className="shared-record-drawer-subtitle">附件</span>
          <div className="shared-record-drawer-asset-list">
            {growthRecord.attachments.map((item) => (
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
            {growthRecord.links.map((item) => (
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
        <span>历史记录与匹配趋势</span>
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
      title="摘要"
      className="shared-record-drawer"
    >
      <div className="shared-record-drawer-body">
        <div className="shared-record-drawer-hero">
          <div className="shared-record-drawer-kicker">摘要</div>
          <h3>主成长记录：{growthRecord.title}</h3>
          <div className="shared-record-drawer-meta">
            <Tag color={SOURCE_META[growthRecord.sourceKey].color}>{growthRecord.sourceLabel}</Tag>
            <Tag>{growthRecord.tag}</Tag>
            <Tag>{growthRecord.date}</Tag>
            <Tag color={growthRecord.statusColor}>{growthRecord.statusLabel}</Tag>
          </div>
          <p>{growthRecord.summary}</p>
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
