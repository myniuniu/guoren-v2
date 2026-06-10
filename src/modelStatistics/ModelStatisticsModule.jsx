import { useMemo, useState } from 'react';
import { Avatar, Button, Card, Progress, Segmented, Space, Table, Tabs, Tag, message } from 'antd';
import {
  ApartmentOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './ModelStatisticsModule.css';

const PERIOD_OPTIONS = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' },
];

const PERIOD_FACTORS = {
  '7d': 0.28,
  '30d': 1,
  '90d': 2.85,
};

const FAMILY_TAG_COLORS = {
  通用生成: 'blue',
  推理分析: 'purple',
  多模态: 'cyan',
  代码生成: 'geekblue',
  检索增强: 'green',
  快速响应: 'gold',
};

const SKILL_TAG_COLORS = {
  办公协同: 'blue',
  经营分析: 'purple',
  知识问答: 'cyan',
  流程审批: 'green',
  研发提效: 'geekblue',
  客服运营: 'gold',
};

const DIMENSION_META = {
  personal: { label: '个人维度', icon: <UserOutlined /> },
  tenant: { label: '租户维度', icon: <TeamOutlined /> },
  department: { label: '部门维度', icon: <ApartmentOutlined /> },
  skill: { label: '技能维度', icon: <ThunderboltOutlined /> },
};

const BASE_DIMENSIONS = {
  personal: {
    coverageLabel: '活跃个人',
    tableTitle: '个人使用明细',
    skillPanelTitle: '个人高频技能',
    summary: {
      totalTokens: 1864200,
      promptTokens: 1098300,
      completionTokens: 578600,
      cachedTokens: 187300,
      modelCalls: 18440,
      skillCalls: 5210,
      coverageValue: 126,
      modelFamilyCount: 6,
      boundAgents: 61,
      successRate: 97.6,
      avgLatency: 2.6,
      p95Latency: 4.8,
      growth: 18.4,
      peakWindow: '10:00 - 12:00',
    },
    trend: [
      { label: 'P1', tokens: 232000, modelCalls: 2180, skillCalls: 610 },
      { label: 'P2', tokens: 248000, modelCalls: 2360, skillCalls: 680 },
      { label: 'P3', tokens: 261000, modelCalls: 2470, skillCalls: 710 },
      { label: 'P4', tokens: 255000, modelCalls: 2430, skillCalls: 690 },
      { label: 'P5', tokens: 278000, modelCalls: 2610, skillCalls: 750 },
      { label: 'P6', tokens: 289000, modelCalls: 2760, skillCalls: 790 },
      { label: 'P7', tokens: 301000, modelCalls: 2890, skillCalls: 840 },
    ],
    modelStats: [
      { key: 'p-m1', name: 'Doubao-Seed-1.6', family: '通用生成', calls: 6200, tokens: 558000, share: 30, color: '#1677ff', desc: '知识问答、写作润色与日常对话主力模型' },
      { key: 'p-m2', name: 'DeepSeek-R1', family: '推理分析', calls: 4180, tokens: 486000, share: 26, color: '#722ed1', desc: '复杂推理、方案拆解与策略评估' },
      { key: 'p-m3', name: 'GLM-4.5-Air', family: '快速响应', calls: 3260, tokens: 315000, share: 17, color: '#faad14', desc: '高频轻量问答与技能兜底' },
      { key: 'p-m4', name: 'Qwen2.5-VL', family: '多模态', calls: 2740, tokens: 279000, share: 15, color: '#13c2c2', desc: '图片识别、表格解析与截图理解' },
      { key: 'p-m5', name: 'DeepSeek-Coder', family: '代码生成', calls: 2060, tokens: 226200, share: 12, color: '#2f54eb', desc: '前端原型、脚本生成与代码修复' },
    ],
    skillStats: [
      { key: 'p-s1', name: '会议纪要助手', category: '办公协同', calls: 980, tokens: 164000, successRate: 99.2, agents: 16, color: '#1677ff', desc: '会后摘要、待办提炼与责任人归并' },
      { key: 'p-s2', name: '方案评审助手', category: '经营分析', calls: 820, tokens: 152000, successRate: 98.5, agents: 11, color: '#722ed1', desc: '帮助输出风险点、机会点和优先级建议' },
      { key: 'p-s3', name: '知识库问答', category: '知识问答', calls: 760, tokens: 138000, successRate: 97.9, agents: 14, color: '#13c2c2', desc: '基于企业文档进行 FAQ 与制度检索' },
      { key: 'p-s4', name: '审批流生成器', category: '流程审批', calls: 690, tokens: 119000, successRate: 96.8, agents: 9, color: '#52c41a', desc: '自动生成流程节点、条件和流转建议' },
      { key: 'p-s5', name: '脚本修复器', category: '研发提效', calls: 540, tokens: 98000, successRate: 95.4, agents: 8, color: '#2f54eb', desc: '定位前端脚本报错与兼容性问题' },
    ],
    ranking: [
      { key: 'p-r1', name: '张洪磊', team: '智能应用组', tokens: 188400, modelCalls: 1480, skillCalls: 420, topModel: 'DeepSeek-R1', topSkill: '方案评审助手', growth: 18.2 },
      { key: 'p-r2', name: '王子瑜', team: '客户成功部', tokens: 173600, modelCalls: 1360, skillCalls: 396, topModel: 'Doubao-Seed-1.6', topSkill: '会议纪要助手', growth: 15.6 },
      { key: 'p-r3', name: '徐佳倩', team: '运营增长组', tokens: 165900, modelCalls: 1290, skillCalls: 371, topModel: 'GLM-4.5-Air', topSkill: '知识库问答', growth: 13.4 },
      { key: 'p-r4', name: '赵敏', team: '交付中心', tokens: 152300, modelCalls: 1180, skillCalls: 344, topModel: 'Qwen2.5-VL', topSkill: '审批流生成器', growth: 12.9 },
      { key: 'p-r5', name: '李昕', team: '产品研发中心', tokens: 146200, modelCalls: 1105, skillCalls: 332, topModel: 'DeepSeek-Coder', topSkill: '脚本修复器', growth: 11.8 },
    ],
  },
  tenant: {
    coverageLabel: '活跃租户',
    tableTitle: '租户使用明细',
    skillPanelTitle: '租户高频技能',
    summary: {
      totalTokens: 10720000,
      promptTokens: 6482000,
      completionTokens: 3156000,
      cachedTokens: 1082000,
      modelCalls: 92480,
      skillCalls: 28160,
      coverageValue: 18,
      modelFamilyCount: 7,
      boundAgents: 143,
      successRate: 98.1,
      avgLatency: 2.9,
      p95Latency: 5.2,
      growth: 24.6,
      peakWindow: '09:30 - 11:30',
    },
    trend: [
      { label: 'P1', tokens: 1260000, modelCalls: 10020, skillCalls: 2860 },
      { label: 'P2', tokens: 1320000, modelCalls: 10480, skillCalls: 2940 },
      { label: 'P3', tokens: 1380000, modelCalls: 10860, skillCalls: 3070 },
      { label: 'P4', tokens: 1420000, modelCalls: 11120, skillCalls: 3180 },
      { label: 'P5', tokens: 1490000, modelCalls: 11780, skillCalls: 3410 },
      { label: 'P6', tokens: 1550000, modelCalls: 12140, skillCalls: 3560 },
      { label: 'P7', tokens: 1610000, modelCalls: 12680, skillCalls: 3720 },
    ],
    modelStats: [
      { key: 't-m1', name: 'Doubao-Seed-1.6', family: '通用生成', calls: 28400, tokens: 3430000, share: 32, color: '#1677ff', desc: '租户侧问答、内容生成与报表解读主力模型' },
      { key: 't-m2', name: 'DeepSeek-R1', family: '推理分析', calls: 22600, tokens: 2575000, share: 24, color: '#722ed1', desc: '复杂分析与多轮决策推理' },
      { key: 't-m3', name: 'Qwen2.5-VL', family: '多模态', calls: 16700, tokens: 1930000, share: 18, color: '#13c2c2', desc: '合同、截图、台账与图像类理解' },
      { key: 't-m4', name: 'GLM-4.5-Air', family: '快速响应', calls: 13900, tokens: 1610000, share: 15, color: '#faad14', desc: '高并发低延迟问答和技能兜底' },
      { key: 't-m5', name: 'BGE-Reranker', family: '检索增强', calls: 10880, tokens: 1175000, share: 11, color: '#52c41a', desc: 'RAG 召回重排与知识命中优化' },
    ],
    skillStats: [
      { key: 't-s1', name: '招投标问答', category: '知识问答', calls: 4360, tokens: 842000, successRate: 98.9, agents: 25, color: '#13c2c2', desc: '围绕投标制度、模板和案例快速问答' },
      { key: 't-s2', name: '经营周报助手', category: '经营分析', calls: 3980, tokens: 795000, successRate: 98.2, agents: 22, color: '#722ed1', desc: '从经营看板自动汇总周报与异动原因' },
      { key: 't-s3', name: '工单总结助手', category: '办公协同', calls: 3660, tokens: 688000, successRate: 99.1, agents: 28, color: '#1677ff', desc: '对话归档、工单总结和待办抽取' },
      { key: 't-s4', name: '审批意见生成', category: '流程审批', calls: 3210, tokens: 604000, successRate: 97.6, agents: 19, color: '#52c41a', desc: '为不同审批节点生成结构化意见建议' },
      { key: 't-s5', name: '客服质检助手', category: '客服运营', calls: 2840, tokens: 536000, successRate: 96.8, agents: 14, color: '#faad14', desc: '识别客服会话风险并输出质检结论' },
    ],
    ranking: [
      { key: 't-r1', name: '华东教育集团', owner: '张洪磊', tokens: 1638000, modelCalls: 13840, skillCalls: 4310, topModel: 'Doubao-Seed-1.6', topSkill: '经营周报助手', growth: 28.4 },
      { key: 't-r2', name: '银龄服务中心', owner: '徐佳倩', tokens: 1492000, modelCalls: 12680, skillCalls: 3920, topModel: 'Qwen2.5-VL', topSkill: '工单总结助手', growth: 24.2 },
      { key: 't-r3', name: '星海交付平台', owner: '赵敏', tokens: 1366000, modelCalls: 11860, skillCalls: 3640, topModel: 'DeepSeek-R1', topSkill: '审批意见生成', growth: 22.5 },
      { key: 't-r4', name: '智学课堂云', owner: '王子瑜', tokens: 1289000, modelCalls: 11020, skillCalls: 3380, topModel: 'GLM-4.5-Air', topSkill: '招投标问答', growth: 19.7 },
      { key: 't-r5', name: '果仁运营中台', owner: '李昕', tokens: 1178000, modelCalls: 10140, skillCalls: 3150, topModel: 'BGE-Reranker', topSkill: '客服质检助手', growth: 17.9 },
    ],
  },
  department: {
    coverageLabel: '活跃部门',
    tableTitle: '部门使用明细',
    skillPanelTitle: '部门高频技能',
    summary: {
      totalTokens: 5942000,
      promptTokens: 3614000,
      completionTokens: 1842000,
      cachedTokens: 486000,
      modelCalls: 48620,
      skillCalls: 14980,
      coverageValue: 34,
      modelFamilyCount: 6,
      boundAgents: 96,
      successRate: 97.9,
      avgLatency: 2.7,
      p95Latency: 4.9,
      growth: 20.1,
      peakWindow: '14:00 - 16:00',
    },
    trend: [
      { label: 'P1', tokens: 682000, modelCalls: 6120, skillCalls: 1830 },
      { label: 'P2', tokens: 701000, modelCalls: 6340, skillCalls: 1940 },
      { label: 'P3', tokens: 732000, modelCalls: 6580, skillCalls: 2070 },
      { label: 'P4', tokens: 748000, modelCalls: 6720, skillCalls: 2140 },
      { label: 'P5', tokens: 786000, modelCalls: 7010, skillCalls: 2280 },
      { label: 'P6', tokens: 824000, modelCalls: 7340, skillCalls: 2430 },
      { label: 'P7', tokens: 869000, modelCalls: 7620, skillCalls: 2560 },
    ],
    modelStats: [
      { key: 'd-m1', name: 'DeepSeek-R1', family: '推理分析', calls: 12280, tokens: 1664000, share: 28, color: '#722ed1', desc: '面向经营分析、投标方案和复盘类任务' },
      { key: 'd-m2', name: 'Doubao-Seed-1.6', family: '通用生成', calls: 11820, tokens: 1486000, share: 25, color: '#1677ff', desc: '知识问答、文案生成与部门日常协同' },
      { key: 'd-m3', name: 'Qwen2.5-VL', family: '多模态', calls: 9320, tokens: 1128000, share: 19, color: '#13c2c2', desc: '票据、截图和多模态内容理解' },
      { key: 'd-m4', name: 'GLM-4.5-Air', family: '快速响应', calls: 7680, tokens: 951000, share: 16, color: '#faad14', desc: '客服与运营场景下的快速响应' },
      { key: 'd-m5', name: 'DeepSeek-Coder', family: '代码生成', calls: 5420, tokens: 713000, share: 12, color: '#2f54eb', desc: '研发部门的代码生成与修复' },
    ],
    skillStats: [
      { key: 'd-s1', name: '经营驾驶舱解读', category: '经营分析', calls: 2140, tokens: 402000, successRate: 98.6, agents: 15, color: '#722ed1', desc: '自动解读经营指标、波动原因与行动建议' },
      { key: 'd-s2', name: '客户会话摘要', category: '客服运营', calls: 1980, tokens: 366000, successRate: 97.8, agents: 13, color: '#faad14', desc: '对客会话总结、风险标注与线索回收' },
      { key: 'd-s3', name: '制度问答助手', category: '知识问答', calls: 1860, tokens: 334000, successRate: 99.1, agents: 18, color: '#13c2c2', desc: '部门制度、操作说明和 FAQ 查询' },
      { key: 'd-s4', name: '审批意见草拟', category: '流程审批', calls: 1690, tokens: 308000, successRate: 97.2, agents: 11, color: '#52c41a', desc: '辅助部门负责人快速完成审批意见' },
      { key: 'd-s5', name: '脚本巡检助手', category: '研发提效', calls: 1350, tokens: 264000, successRate: 95.7, agents: 7, color: '#2f54eb', desc: '研发脚本巡检、修复建议和风险提示' },
    ],
    ranking: [
      { key: 'd-r1', name: '客户成功部', members: 38, tokens: 896000, modelCalls: 7420, skillCalls: 2240, topModel: 'Doubao-Seed-1.6', topSkill: '客户会话摘要', growth: 21.6 },
      { key: 'd-r2', name: '智能应用组', members: 26, tokens: 842000, modelCalls: 6960, skillCalls: 2100, topModel: 'DeepSeek-R1', topSkill: '经营驾驶舱解读', growth: 20.9 },
      { key: 'd-r3', name: '产品研发中心', members: 32, tokens: 778000, modelCalls: 6480, skillCalls: 1960, topModel: 'DeepSeek-Coder', topSkill: '脚本巡检助手', growth: 18.7 },
      { key: 'd-r4', name: '交付运营部', members: 29, tokens: 731000, modelCalls: 6120, skillCalls: 1840, topModel: 'Qwen2.5-VL', topSkill: '审批意见草拟', growth: 17.2 },
      { key: 'd-r5', name: '品牌市场部', members: 21, tokens: 685000, modelCalls: 5710, skillCalls: 1730, topModel: 'GLM-4.5-Air', topSkill: '制度问答助手', growth: 15.9 },
    ],
  },
  skill: {
    coverageLabel: '活跃技能',
    tableTitle: '技能调用明细',
    skillPanelTitle: '技能调用排行',
    summary: {
      totalTokens: 3729000,
      promptTokens: 2258000,
      completionTokens: 915000,
      cachedTokens: 556000,
      modelCalls: 23840,
      skillCalls: 11320,
      coverageValue: 73,
      modelFamilyCount: 7,
      boundAgents: 126,
      successRate: 98.8,
      avgLatency: 2.3,
      p95Latency: 4.1,
      growth: 21.7,
      peakWindow: '09:00 - 11:00',
    },
    trend: [
      { label: 'P1', tokens: 436000, modelCalls: 2740, skillCalls: 1220 },
      { label: 'P2', tokens: 452000, modelCalls: 2860, skillCalls: 1330 },
      { label: 'P3', tokens: 479000, modelCalls: 3010, skillCalls: 1470 },
      { label: 'P4', tokens: 498000, modelCalls: 3140, skillCalls: 1550 },
      { label: 'P5', tokens: 523000, modelCalls: 3280, skillCalls: 1660 },
      { label: 'P6', tokens: 544000, modelCalls: 3410, skillCalls: 1740 },
      { label: 'P7', tokens: 566000, modelCalls: 3520, skillCalls: 1850 },
    ],
    modelStats: [
      { key: 's-m1', name: 'Doubao-Seed-1.6', family: '通用生成', calls: 7480, tokens: 982000, share: 36, color: '#1677ff', desc: '支撑 28 个技能的主模型底座' },
      { key: 's-m2', name: 'DeepSeek-R1', family: '推理分析', calls: 4960, tokens: 713000, share: 23, color: '#722ed1', desc: '支撑分析型与推理型技能编排' },
      { key: 's-m3', name: 'Qwen2.5-VL', family: '多模态', calls: 3820, tokens: 582000, share: 18, color: '#13c2c2', desc: '支撑票据识别、截图理解与图像问答' },
      { key: 's-m4', name: 'GLM-4.5-Air', family: '快速响应', calls: 2910, tokens: 388000, share: 13, color: '#faad14', desc: '兜底对话和轻量技能快速返回' },
      { key: 's-m5', name: 'BGE-Reranker', family: '检索增强', calls: 2130, tokens: 264000, share: 10, color: '#52c41a', desc: 'RAG 命中优化与知识片段排序' },
    ],
    skillStats: [
      { key: 's-s1', name: '会议纪要助手', category: '办公协同', calls: 2860, tokens: 624000, successRate: 99.1, agents: 31, color: '#1677ff', desc: '复用率最高的通用办公技能' },
      { key: 's-s2', name: '经营周报助手', category: '经营分析', calls: 2480, tokens: 586000, successRate: 98.4, agents: 24, color: '#722ed1', desc: '适用于运营、交付和租户负责人周报' },
      { key: 's-s3', name: '知识库问答', category: '知识问答', calls: 2210, tokens: 498000, successRate: 99.3, agents: 29, color: '#13c2c2', desc: '面向制度、SOP 和产品文档查询' },
      { key: 's-s4', name: '审批意见生成', category: '流程审批', calls: 1940, tokens: 436000, successRate: 97.9, agents: 18, color: '#52c41a', desc: '审批节点意见推荐与结构化输出' },
      { key: 's-s5', name: '客服质检助手', category: '客服运营', calls: 1830, tokens: 412000, successRate: 96.9, agents: 15, color: '#faad14', desc: '会话风险识别与服务质量诊断' },
    ],
    ranking: [
      { key: 's-r1', name: '会议纪要助手', category: '办公协同', calls: 2860, tokens: 624000, boundAgents: 31, coverageTenants: 12, successRate: 99.1, topModel: 'Doubao-Seed-1.6', growth: 22.6 },
      { key: 's-r2', name: '经营周报助手', category: '经营分析', calls: 2480, tokens: 586000, boundAgents: 24, coverageTenants: 9, successRate: 98.4, topModel: 'DeepSeek-R1', growth: 20.1 },
      { key: 's-r3', name: '知识库问答', category: '知识问答', calls: 2210, tokens: 498000, boundAgents: 29, coverageTenants: 11, successRate: 99.3, topModel: 'BGE-Reranker', growth: 18.9 },
      { key: 's-r4', name: '审批意见生成', category: '流程审批', calls: 1940, tokens: 436000, boundAgents: 18, coverageTenants: 8, successRate: 97.9, topModel: 'GLM-4.5-Air', growth: 17.4 },
      { key: 's-r5', name: '客服质检助手', category: '客服运营', calls: 1830, tokens: 412000, boundAgents: 15, coverageTenants: 6, successRate: 96.9, topModel: 'Qwen2.5-VL', growth: 16.3 },
    ],
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatCompact(value) {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  if (abs >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (abs >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return formatNumber(num);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatGrowth(value) {
  return `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`;
}

function scaleNumber(value, factor) {
  return Math.max(1, Math.round(Number(value || 0) * factor));
}

function scaleOptional(value, factor) {
  return typeof value === 'number' ? scaleNumber(value, factor) : value;
}

function scaleDimensionData(base, factor) {
  return {
    ...base,
    summary: {
      ...base.summary,
      totalTokens: scaleNumber(base.summary.totalTokens, factor),
      promptTokens: scaleNumber(base.summary.promptTokens, factor),
      completionTokens: scaleNumber(base.summary.completionTokens, factor),
      cachedTokens: scaleNumber(base.summary.cachedTokens, factor),
      modelCalls: scaleNumber(base.summary.modelCalls, factor),
      skillCalls: scaleNumber(base.summary.skillCalls, factor),
    },
    trend: base.trend.map((item) => ({
      ...item,
      tokens: scaleNumber(item.tokens, factor),
      modelCalls: scaleNumber(item.modelCalls, factor),
      skillCalls: scaleNumber(item.skillCalls, factor),
    })),
    modelStats: base.modelStats.map((item) => ({
      ...item,
      calls: scaleNumber(item.calls, factor),
      tokens: scaleNumber(item.tokens, factor),
    })),
    skillStats: base.skillStats.map((item) => ({
      ...item,
      calls: scaleNumber(item.calls, factor),
      tokens: scaleNumber(item.tokens, factor),
    })),
    ranking: base.ranking.map((item) => ({
      ...item,
      calls: scaleOptional(item.calls, factor),
      tokens: scaleOptional(item.tokens, factor),
      modelCalls: scaleOptional(item.modelCalls, factor),
      skillCalls: scaleOptional(item.skillCalls, factor),
    })),
  };
}

function getAvatarText(label) {
  return String(label || '').trim().slice(0, 1) || '统';
}

function getTokenRows(summary) {
  const total = summary.totalTokens || 1;
  return [
    { label: '输入', value: summary.promptTokens, percent: Math.round((summary.promptTokens / total) * 100), color: '#1677ff' },
    { label: '输出', value: summary.completionTokens, percent: Math.round((summary.completionTokens / total) * 100), color: '#13c2c2' },
    { label: '缓存', value: summary.cachedTokens, percent: Math.round((summary.cachedTokens / total) * 100), color: '#52c41a' },
  ];
}

function buildSummaryCards(summary, dimensionKey) {
  return [
    {
      key: 'tokens',
      label: '总 Token',
      value: formatCompact(summary.totalTokens),
      icon: <ThunderboltOutlined />,
      hint: `输入 ${Math.round((summary.promptTokens / summary.totalTokens) * 100)}% / 输出 ${Math.round((summary.completionTokens / summary.totalTokens) * 100)}% / 缓存 ${Math.round((summary.cachedTokens / summary.totalTokens) * 100)}%`,
    },
    {
      key: 'modelCalls',
      label: '模型调用',
      value: formatCompact(summary.modelCalls),
      icon: <DatabaseOutlined />,
      hint: `覆盖 ${summary.modelFamilyCount} 类模型`,
    },
    {
      key: 'skillCalls',
      label: '技能调用',
      value: formatCompact(summary.skillCalls),
      icon: <BarChartOutlined />,
      hint: `绑定 ${summary.boundAgents} 个智能体`,
    },
    {
      key: 'coverage',
      label: summary.coverageLabel || BASE_DIMENSIONS[dimensionKey].coverageLabel,
      value: formatCompact(summary.coverageValue),
      icon: DIMENSION_META[dimensionKey].icon,
      hint: `环比 ${formatGrowth(summary.growth)}`,
    },
    {
      key: 'success',
      label: '调用成功率',
      value: formatPercent(summary.successRate),
      icon: <TeamOutlined />,
      hint: `峰值时段 ${summary.peakWindow}`,
    },
    {
      key: 'latency',
      label: '平均响应',
      value: `${summary.avgLatency.toFixed(1)}s`,
      icon: <ApartmentOutlined />,
      hint: `P95 ${summary.p95Latency.toFixed(1)}s`,
    },
  ];
}

function renderDistributionList(items, mode) {
  return (
    <div className="ms-dist-list">
      {items.map((item) => (
        <div className="ms-dist-item" key={item.key}>
          <div className="ms-dist-head">
            <div className="ms-dist-identity">
              <Avatar className="ms-dist-avatar" style={{ background: item.color }}>
                {getAvatarText(item.name)}
              </Avatar>
              <div className="ms-dist-text">
                <div className="ms-dist-name">{item.name}</div>
                <div className="ms-dist-desc">{item.desc}</div>
              </div>
            </div>
            <div className="ms-dist-share">{item.share ? `${item.share}%` : formatPercent(item.successRate)}</div>
          </div>
          <div className="ms-dist-tags">
            <Tag color={mode === 'model' ? FAMILY_TAG_COLORS[item.family] || 'default' : SKILL_TAG_COLORS[item.category] || 'default'}>
              {mode === 'model' ? item.family : item.category}
            </Tag>
          </div>
          <Progress
            percent={item.share || Math.round(item.successRate)}
            showInfo={false}
            strokeColor={item.color}
            trailColor="#eef2f7"
            size="small"
          />
          <div className="ms-dist-meta">
            <span>{formatNumber(item.calls)} 次调用</span>
            <span>{formatCompact(item.tokens)} token</span>
            {mode === 'model' ? null : <span>{item.agents} 个智能体</span>}
            {mode === 'model' ? null : <span>成功率 {formatPercent(item.successRate)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTableColumns(dimensionKey) {
  if (dimensionKey === 'skill') {
    return [
      {
        title: '技能',
        dataIndex: 'name',
        key: 'name',
        width: 240,
        fixed: 'left',
        render: (_, record) => (
          <div className="ms-entity-cell">
            <Avatar className="ms-entity-avatar" style={{ background: '#1677ff' }}>
              {getAvatarText(record.name)}
            </Avatar>
            <div>
              <div className="ms-entity-name">{record.name}</div>
              <div className="ms-entity-subtitle">{record.category}</div>
            </div>
          </div>
        ),
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: (value) => <Tag color={SKILL_TAG_COLORS[value] || 'default'}>{value}</Tag>,
      },
      { title: '调用次数', dataIndex: 'calls', key: 'calls', width: 120, render: (value) => formatNumber(value) },
      { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
      { title: '关联智能体', dataIndex: 'boundAgents', key: 'boundAgents', width: 120, render: (value) => formatNumber(value) },
      { title: '覆盖租户', dataIndex: 'coverageTenants', key: 'coverageTenants', width: 120, render: (value) => formatNumber(value) },
      { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 120, render: (value) => formatPercent(value) },
      { title: '主力模型', dataIndex: 'topModel', key: 'topModel', width: 160, render: (value) => <Tag color="blue">{value}</Tag> },
      { title: '环比', dataIndex: 'growth', key: 'growth', width: 100, render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{formatGrowth(value)}</Tag> },
    ];
  }

  return [
    {
      title: dimensionKey === 'personal' ? '个人' : dimensionKey === 'tenant' ? '租户' : '部门',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="ms-entity-cell">
          <Avatar className="ms-entity-avatar" style={{ background: '#2f54eb' }}>
            {getAvatarText(record.name)}
          </Avatar>
          <div>
            <div className="ms-entity-name">{record.name}</div>
            <div className="ms-entity-subtitle">
              {dimensionKey === 'personal' ? record.team : dimensionKey === 'tenant' ? `负责人：${record.owner}` : `${record.members} 人`}
            </div>
          </div>
        </div>
      ),
    },
    { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
    { title: '模型调用', dataIndex: 'modelCalls', key: 'modelCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '主力模型', dataIndex: 'topModel', key: 'topModel', width: 160, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: '高频技能', dataIndex: 'topSkill', key: 'topSkill', width: 160, render: (value) => <Tag color="purple">{value}</Tag> },
    { title: '环比', dataIndex: 'growth', key: 'growth', width: 100, render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{formatGrowth(value)}</Tag> },
  ];
}

function renderDimensionPane(dimensionKey, data) {
  const summaryCards = buildSummaryCards(
    { ...data.summary, coverageLabel: data.coverageLabel },
    dimensionKey,
  );
  const tokenRows = getTokenRows(data.summary);
  const trendMax = Math.max(...data.trend.map((item) => item.tokens), 1);

  return (
    <div className="ms-tab-pane">
      <div className="ms-summary-grid">
        {summaryCards.map((item) => (
          <Card key={item.key} className="ms-summary-card" bordered={false}>
            <div className="ms-summary-top">
              <div className="ms-summary-label">{item.label}</div>
              <div className="ms-summary-icon">{item.icon}</div>
            </div>
            <div className="ms-summary-value">{item.value}</div>
            <div className="ms-summary-hint">{item.hint}</div>
          </Card>
        ))}
      </div>

      <div className="ms-panel-grid">
        <Card
          className="ms-panel-card"
          title={`${DIMENSION_META[dimensionKey].label} Token 构成`}
          extra={<Tag color="blue">最近 7 个采样点</Tag>}
        >
          <div className="ms-token-list">
            {tokenRows.map((row) => (
              <div className="ms-token-row" key={row.label}>
                <div className="ms-token-label">{row.label}</div>
                <div className="ms-token-bar">
                  <div className="ms-token-fill" style={{ width: `${row.percent}%`, background: row.color }} />
                </div>
                <div className="ms-token-value">{formatCompact(row.value)} · {row.percent}%</div>
              </div>
            ))}
          </div>

          <div className="ms-trend">
            {data.trend.map((point) => (
              <div className="ms-trend-col" key={point.label}>
                <div className="ms-trend-value">{formatCompact(point.tokens)}</div>
                <div className="ms-trend-bar-shell">
                  <div
                    className="ms-trend-bar"
                    style={{ height: `${Math.max(16, Math.round((point.tokens / trendMax) * 100))}%` }}
                  />
                </div>
                <div className="ms-trend-label">{point.label}</div>
                <div className="ms-trend-caption">{formatCompact(point.skillCalls)} 技能</div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="ms-panel-card"
          title={dimensionKey === 'skill' ? '模型支撑情况' : '模型调用情况'}
          extra={<Tag color="purple">{data.modelStats[0]?.name}</Tag>}
        >
          {renderDistributionList(data.modelStats, 'model')}
        </Card>
      </div>

      <div className="ms-panel-grid ms-panel-grid-bottom">
        <Card
          className="ms-panel-card"
          title={data.skillPanelTitle}
          extra={<Tag color="green">{data.skillStats[0]?.name}</Tag>}
        >
          {renderDistributionList(data.skillStats, 'skill')}
        </Card>

        <Card className="ms-panel-card" title={data.tableTitle}>
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            columns={renderTableColumns(dimensionKey)}
            dataSource={data.ranking}
            scroll={{ x: dimensionKey === 'skill' ? 1180 : 1000 }}
            className="ms-table"
          />
        </Card>
      </div>
    </div>
  );
}

export default function ModelStatisticsModule() {
  const [period, setPeriod] = useState('30d');

  const dimensionData = useMemo(() => {
    const factor = PERIOD_FACTORS[period] || 1;
    return Object.fromEntries(
      Object.entries(BASE_DIMENSIONS).map(([key, value]) => [key, scaleDimensionData(value, factor)]),
    );
  }, [period]);

  return (
    <div className="model-stat-module">
      <div className="ms-header">
        <div className="ms-title-wrap">
          <div className="ms-title">
            <BarChartOutlined className="ms-title-icon" />
            <span>模型统计</span>
            <Tag color="gold">Mock 数据</Tag>
          </div>
          <div className="ms-subtitle">
            从个人、租户、部门、技能四个维度展示 Token 使用、模型调用和智能体技能调用情况。
          </div>
        </div>

        <Space size={12}>
          <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => message.success('模型统计数据已刷新')}
          >
            刷新
          </Button>
        </Space>
      </div>

      <div className="ms-content">
        <Card className="ms-note-card" bordered={false}>
          <div className="ms-note-title">统计口径</div>
          <div className="ms-note-text">
            当前模块先使用演示数据模拟聚合结果，页面结构已覆盖后续真实接口所需的核心视图：总览指标、Token 构成、模型分布、技能排行与维度明细表。
          </div>
          <div className="ms-note-tags">
            <Tag color="blue">Token 使用</Tag>
            <Tag color="purple">模型调用</Tag>
            <Tag color="green">技能调用</Tag>
            <Tag color="cyan">多维统计</Tag>
          </div>
        </Card>

        <Tabs
          className="ms-tabs"
          items={Object.keys(DIMENSION_META).map((key) => ({
            key,
            label: DIMENSION_META[key].label,
            children: renderDimensionPane(key, dimensionData[key]),
          }))}
        />
      </div>
    </div>
  );
}
