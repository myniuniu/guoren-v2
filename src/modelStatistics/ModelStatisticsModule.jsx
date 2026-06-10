import { useMemo, useState } from 'react';
import { Alert, Avatar, Button, Card, Progress, Segmented, Space, Table, Tabs, Tag, message } from 'antd';
import {
  ArrowRightOutlined,
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DollarCircleOutlined,
  FireOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RobotOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
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
  tenant: { label: '当前租户', icon: <TeamOutlined /> },
  department: { label: '部门维度', icon: <ApartmentOutlined /> },
  agent: { label: '智能体维度', icon: <RobotOutlined /> },
  skill: { label: '技能维度', icon: <ThunderboltOutlined /> },
};

const VISIBLE_DIMENSION_KEYS = ['tenant', 'personal', 'department', 'agent', 'skill'];

const MANAGEMENT_VIEW_ITEMS = [
  { key: 'usage', label: '使用与活跃看板' },
  { key: 'billing', label: '账单与成本看板' },
  { key: 'governance', label: '治理与配额看板' },
];

const DIMENSION_GOALS = {
  tenant: '目标：判断当前租户整体健康度、活跃情况和账期压力，总盘子以当前租户汇总为准。',
  personal: '目标：识别高活跃、低活跃和异常消耗用户，支撑运营和限额治理。',
  department: '目标：评估组织采纳率与推广效果，定位高采纳和低采纳部门。',
  agent: '目标：区分明星、成长、沉默、低效智能体，决定继续运营还是治理。',
  skill: '目标：衡量技能复用价值和资产质量，识别高复用与高失败技能。',
};

const GOVERNANCE_ACTIONS = [
  {
    key: 'tenant',
    title: '调整当前租户配额',
    description: '处理 Token、技能调用和智能体席位的当前租户阈值压力。',
    tab: 'tenant',
    tone: 'warning',
  },
  {
    key: 'plans',
    title: '分层套餐模板',
    description: '为高活跃部门、普通成员和试用对象拆分不同套餐模板。',
    tab: 'plans',
    tone: 'processing',
  },
  {
    key: 'free',
    title: '收紧免费配额策略',
    description: '针对访客和注册用户收紧免费次数、免费 Token 和创建权限。',
    tab: 'free',
    tone: 'default',
  },
];

const CURRENT_TENANT_QUOTA = {
  skillUsageUsed: 16420,
  skillUsageLimit: 22000,
  tokenUsed: 8360000,
  tokenLimit: 12000000,
  agentCreated: 52,
  agentCreateLimit: 80,
  skillGenerated: 118,
  skillGenerateLimit: 160,
};

const BASE_SILENT_AGENTS = [
  { key: 'silent-1', name: '供应商准入助手', owner: '赵敏', scene: '流程审批', activeUsers: 11, linkedSkills: 4, lastActive: '4 天前', suggestion: '合并到审批协同智能体' },
  { key: 'silent-2', name: '活动海报智能体', owner: '徐佳倩', scene: '办公协同', activeUsers: 8, linkedSkills: 3, lastActive: '6 天前', suggestion: '降级为模板而非常驻智能体' },
  { key: 'silent-3', name: '知识清洗助手', owner: '王子瑜', scene: '知识问答', activeUsers: 13, linkedSkills: 5, lastActive: '5 天前', suggestion: '转到技能库单独复用' },
  { key: 'silent-4', name: '交付复盘助理', owner: '张洪磊', scene: '经营分析', activeUsers: 9, linkedSkills: 4, lastActive: '3 天前', suggestion: '先限流观察一周' },
];

function buildDepartmentUserActivity(departmentName, prefix, totalCallsList) {
  return totalCallsList.map((totalCalls, index) => {
    const modelRatio = [0.7, 0.6, 0.55][index % 3];
    const modelCalls = Math.max(0, Math.round(totalCalls * modelRatio));

    return {
      key: `${departmentName}-${index + 1}`,
      departmentName,
      userName: `${prefix}${index + 1}`,
      modelCalls,
      skillCalls: Math.max(0, totalCalls - modelCalls),
    };
  });
}

const BASE_DEPARTMENT_USER_ACTIVITY = [
  ...buildDepartmentUserActivity('客户成功部', '客成成员', [21, 18, 15, 13, 12, 11, 10, 9, 8, 7, 7, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]),
  ...buildDepartmentUserActivity('智能应用组', '智应成员', [24, 20, 18, 16, 15, 13, 12, 11, 10, 9, 9, 8, 7, 7, 6, 6, 5, 5, 4, 3, 2, 1]),
  ...buildDepartmentUserActivity('产品研发中心', '研发成员', [22, 18, 16, 14, 13, 12, 11, 10, 9, 8, 8, 7, 6, 6, 5, 4, 4, 3, 2, 1]),
  ...buildDepartmentUserActivity('交付运营部', '交付成员', [18, 15, 13, 12, 10, 9, 8, 7, 6, 6, 5, 5, 4, 3, 2, 2, 1]),
  ...buildDepartmentUserActivity('品牌市场部', '市场成员', [14, 11, 9, 8, 6, 5, 4, 3, 2, 1]),
];

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
    coverageLabel: '计费成员',
    tableTitle: '当前租户账单明细',
    skillPanelTitle: '当前租户高频技能',
    summary: {
      totalTokens: 10720000,
      promptTokens: 6482000,
      completionTokens: 3156000,
      cachedTokens: 1082000,
      modelCalls: 92480,
      skillCalls: 28160,
      coverageValue: 386,
      modelFamilyCount: 7,
      boundAgents: 143,
      estimatedCost: 17860,
      modelBillCost: 11820,
      skillBillCost: 5070,
      coverageHint: '租户：华东教育集团',
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
      { key: 't-b1', itemName: '基础模型调用', billingType: '按模型调用量', cycle: '2026-06', usageCount: 92480, tokenUsed: 6720000, unitPriceLabel: '¥0.98 / 千次', estimatedCost: 9063, remark: '包含通用生成、推理分析和快速响应模型' },
      { key: 't-b2', itemName: '多模态解析', billingType: '按多模态调用', cycle: '2026-06', usageCount: 16700, tokenUsed: 1930000, unitPriceLabel: '¥1.65 / 千次', estimatedCost: 2756, remark: '图片、票据、截图和表格解析能力' },
      { key: 't-b3', itemName: '技能运行', billingType: '按技能调用量', cycle: '2026-06', usageCount: 28160, tokenUsed: 0, unitPriceLabel: '¥0.18 / 次', estimatedCost: 5069, remark: '含知识问答、审批、客服和经营分析技能' },
      { key: 't-b4', itemName: '智能体席位', billingType: '按活跃智能体数', cycle: '2026-06', usageCount: 143, tokenUsed: 0, unitPriceLabel: '¥18 / 个', estimatedCost: 2574, remark: '当前账期活跃智能体实例' },
      { key: 't-b5', itemName: '免费额度抵扣', billingType: '优惠抵扣', cycle: '2026-06', usageCount: 1, tokenUsed: 1082000, unitPriceLabel: '-¥1,602', estimatedCost: -1602, remark: '缓存 Token 与新租户赠送额度抵扣' },
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
  agent: {
    coverageLabel: '活跃智能体',
    tableTitle: '智能体使用明细',
    skillPanelTitle: '智能体关联技能',
    summary: {
      totalTokens: 4685000,
      promptTokens: 2798000,
      completionTokens: 1316000,
      cachedTokens: 571000,
      modelCalls: 35280,
      skillCalls: 16840,
      coverageValue: 89,
      modelFamilyCount: 7,
      boundAgents: 89,
      skillCallsHint: '覆盖 214 个关联技能',
      successRate: 98.3,
      avgLatency: 2.5,
      p95Latency: 4.5,
      growth: 23.2,
      peakWindow: '10:00 - 11:30',
    },
    trend: [
      { label: 'P1', tokens: 536000, modelCalls: 3920, skillCalls: 1820 },
      { label: 'P2', tokens: 558000, modelCalls: 4080, skillCalls: 1940 },
      { label: 'P3', tokens: 586000, modelCalls: 4260, skillCalls: 2080 },
      { label: 'P4', tokens: 612000, modelCalls: 4410, skillCalls: 2240 },
      { label: 'P5', tokens: 648000, modelCalls: 4680, skillCalls: 2410 },
      { label: 'P6', tokens: 672000, modelCalls: 4910, skillCalls: 2560 },
      { label: 'P7', tokens: 713000, modelCalls: 5160, skillCalls: 2790 },
    ],
    modelStats: [
      { key: 'a-m1', name: 'DeepSeek-R1', family: '推理分析', calls: 9260, tokens: 1286000, share: 27, color: '#722ed1', desc: '智能体复杂推理、规划拆解和策略分析主力模型' },
      { key: 'a-m2', name: 'Doubao-Seed-1.6', family: '通用生成', calls: 8720, tokens: 1172000, share: 25, color: '#1677ff', desc: '智能体对话、总结生成和知识问答的默认模型' },
      { key: 'a-m3', name: 'Qwen2.5-VL', family: '多模态', calls: 6410, tokens: 886000, share: 19, color: '#13c2c2', desc: '截图理解、票据识别和图像解析类智能体能力' },
      { key: 'a-m4', name: 'GLM-4.5-Air', family: '快速响应', calls: 5830, tokens: 721000, share: 17, color: '#faad14', desc: '轻量级智能体和高频短对话的快速响应模型' },
      { key: 'a-m5', name: 'DeepSeek-Coder', family: '代码生成', calls: 5060, tokens: 620000, share: 12, color: '#2f54eb', desc: '研发助手、脚本巡检和页面修复类智能体能力' },
    ],
    skillStats: [
      { key: 'a-s1', name: '经营周报助手', category: '经营分析', calls: 3140, tokens: 682000, successRate: 98.8, agents: 24, color: '#722ed1', desc: '被经营分析类智能体高频调用，用于生成周报和异动结论' },
      { key: 'a-s2', name: '知识库问答', category: '知识问答', calls: 2860, tokens: 628000, successRate: 99.2, agents: 29, color: '#13c2c2', desc: '作为通用知识问答能力被多个助理型智能体复用' },
      { key: 'a-s3', name: '会议纪要助手', category: '办公协同', calls: 2410, tokens: 516000, successRate: 99.0, agents: 18, color: '#1677ff', desc: '会议陪练、总结和待办沉淀类智能体的核心技能' },
      { key: 'a-s4', name: '审批意见生成', category: '流程审批', calls: 2130, tokens: 448000, successRate: 97.6, agents: 15, color: '#52c41a', desc: '审批协同智能体用于草拟和补全节点意见' },
      { key: 'a-s5', name: '脚本修复器', category: '研发提效', calls: 1860, tokens: 396000, successRate: 96.4, agents: 12, color: '#2f54eb', desc: '研发与页面设计类智能体使用的代码修复技能' },
    ],
    ranking: [
      { key: 'a-r1', name: '经营周报智能体', scene: '经营分析', owner: '张洪磊', linkedSkills: 6, activeUsers: 132, tokens: 624000, modelCalls: 4380, skillCalls: 2140, topModel: 'DeepSeek-R1', topSkill: '经营周报助手', growth: 26.4 },
      { key: 'a-r2', name: '客服质检智能体', scene: '客服运营', owner: '徐佳倩', linkedSkills: 5, activeUsers: 118, tokens: 578000, modelCalls: 4020, skillCalls: 1980, topModel: 'Doubao-Seed-1.6', topSkill: '知识库问答', growth: 24.7 },
      { key: 'a-r3', name: '制度问答智能体', scene: '知识问答', owner: '王子瑜', linkedSkills: 4, activeUsers: 164, tokens: 542000, modelCalls: 3870, skillCalls: 1860, topModel: 'Qwen2.5-VL', topSkill: '知识库问答', growth: 22.3 },
      { key: 'a-r4', name: '审批协同智能体', scene: '流程审批', owner: '赵敏', linkedSkills: 5, activeUsers: 95, tokens: 489000, modelCalls: 3560, skillCalls: 1740, topModel: 'GLM-4.5-Air', topSkill: '审批意见生成', growth: 19.8 },
      { key: 'a-r5', name: '前端巡检智能体', scene: '研发提效', owner: '李昕', linkedSkills: 7, activeUsers: 82, tokens: 461000, modelCalls: 3310, skillCalls: 1660, topModel: 'DeepSeek-Coder', topSkill: '脚本修复器', growth: 18.1 },
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
      { key: 's-r1', name: '会议纪要助手', category: '办公协同', calls: 2860, tokens: 624000, boundAgents: 31, coverageDepartments: 12, successRate: 99.1, topModel: 'Doubao-Seed-1.6', growth: 22.6 },
      { key: 's-r2', name: '经营周报助手', category: '经营分析', calls: 2480, tokens: 586000, boundAgents: 24, coverageDepartments: 9, successRate: 98.4, topModel: 'DeepSeek-R1', growth: 20.1 },
      { key: 's-r3', name: '知识库问答', category: '知识问答', calls: 2210, tokens: 498000, boundAgents: 29, coverageDepartments: 11, successRate: 99.3, topModel: 'BGE-Reranker', growth: 18.9 },
      { key: 's-r4', name: '审批意见生成', category: '流程审批', calls: 1940, tokens: 436000, boundAgents: 18, coverageDepartments: 8, successRate: 97.9, topModel: 'GLM-4.5-Air', growth: 17.4 },
      { key: 's-r5', name: '客服质检助手', category: '客服运营', calls: 1830, tokens: 412000, boundAgents: 15, coverageDepartments: 6, successRate: 96.9, topModel: 'Qwen2.5-VL', growth: 16.3 },
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

function formatCurrency(value) {
  const num = Number(value || 0);
  return `${num < 0 ? '-' : ''}¥${Math.abs(num).toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(Math.abs(num)) ? 0 : 1,
    maximumFractionDigits: 1,
  })}`;
}

function formatGrowth(value) {
  return `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`;
}

function scaleNumber(value, factor) {
  return Math.max(1, Math.round(Number(value || 0) * factor));
}

function scaleActivityCount(value, factor) {
  return Math.max(0, Math.round(Number(value || 0) * factor));
}

function scaleOptional(value, factor) {
  return typeof value === 'number' ? scaleNumber(value, factor) : value;
}

function scaleCurrency(value, factor) {
  return Math.round(Number(value || 0) * factor);
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
      estimatedCost: typeof base.summary.estimatedCost === 'number' ? scaleCurrency(base.summary.estimatedCost, factor) : base.summary.estimatedCost,
      modelBillCost: typeof base.summary.modelBillCost === 'number' ? scaleCurrency(base.summary.modelBillCost, factor) : base.summary.modelBillCost,
      skillBillCost: typeof base.summary.skillBillCost === 'number' ? scaleCurrency(base.summary.skillBillCost, factor) : base.summary.skillBillCost,
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
      activeUsers: scaleOptional(item.activeUsers, factor),
      usageCount: scaleOptional(item.usageCount, factor),
      tokenUsed: scaleOptional(item.tokenUsed, factor),
      estimatedCost: typeof item.estimatedCost === 'number' ? scaleCurrency(item.estimatedCost, factor) : item.estimatedCost,
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
      hint: typeof summary.estimatedCost === 'number'
        ? `当前账期预估费用 ${formatCurrency(summary.estimatedCost)}`
        : summary.tokenHint || `输入 ${Math.round((summary.promptTokens / summary.totalTokens) * 100)}% / 输出 ${Math.round((summary.completionTokens / summary.totalTokens) * 100)}% / 缓存 ${Math.round((summary.cachedTokens / summary.totalTokens) * 100)}%`,
    },
    {
      key: 'modelCalls',
      label: '模型调用',
      value: formatCompact(summary.modelCalls),
      icon: <DatabaseOutlined />,
      hint: typeof summary.modelBillCost === 'number'
        ? `模型账单 ${formatCurrency(summary.modelBillCost)}`
        : summary.modelCallsHint || `覆盖 ${summary.modelFamilyCount} 类模型`,
    },
    {
      key: 'skillCalls',
      label: '技能调用',
      value: formatCompact(summary.skillCalls),
      icon: <BarChartOutlined />,
      hint: typeof summary.skillBillCost === 'number'
        ? `技能运行账单 ${formatCurrency(summary.skillBillCost)}`
        : summary.skillCallsHint || `绑定 ${summary.boundAgents} 个智能体`,
    },
    {
      key: 'coverage',
      label: summary.coverageLabel || BASE_DIMENSIONS[dimensionKey].coverageLabel,
      value: formatCompact(summary.coverageValue),
      icon: DIMENSION_META[dimensionKey].icon,
      hint: summary.coverageHint || `环比 ${formatGrowth(summary.growth)}`,
    },
    {
      key: 'success',
      label: '调用成功率',
      value: formatPercent(summary.successRate),
      icon: <TeamOutlined />,
      hint: summary.successHint || `峰值时段 ${summary.peakWindow}`,
    },
    {
      key: 'latency',
      label: '平均响应',
      value: `${summary.avgLatency.toFixed(1)}s`,
      icon: <ApartmentOutlined />,
      hint: summary.latencyHint || `P95 ${summary.p95Latency.toFixed(1)}s`,
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
  if (dimensionKey === 'tenant') {
    return [
      {
        title: '账单项',
        dataIndex: 'itemName',
        key: 'itemName',
        width: 220,
        fixed: 'left',
        render: (_, record) => (
          <div className="ms-entity-cell">
            <Avatar className="ms-entity-avatar" style={{ background: '#fa8c16' }}>
              {getAvatarText(record.itemName)}
            </Avatar>
            <div>
              <div className="ms-entity-name">{record.itemName}</div>
              <div className="ms-entity-subtitle">{record.billingType}</div>
            </div>
          </div>
        ),
      },
      { title: '账期', dataIndex: 'cycle', key: 'cycle', width: 120 },
      { title: '计费量', dataIndex: 'usageCount', key: 'usageCount', width: 120, render: (value) => formatNumber(value) },
      { title: 'Token', dataIndex: 'tokenUsed', key: 'tokenUsed', width: 120, render: (value) => (value ? formatCompact(value) : '-') },
      { title: '单价', dataIndex: 'unitPriceLabel', key: 'unitPriceLabel', width: 140 },
      {
        title: '预估金额',
        dataIndex: 'estimatedCost',
        key: 'estimatedCost',
        width: 140,
        render: (value) => <Tag color={value < 0 ? 'success' : 'processing'}>{formatCurrency(value)}</Tag>,
      },
      { title: '备注', dataIndex: 'remark', key: 'remark', width: 260 },
    ];
  }

  if (dimensionKey === 'agent') {
    return [
      {
        title: '智能体',
        dataIndex: 'name',
        key: 'name',
        width: 240,
        fixed: 'left',
        render: (_, record) => (
          <div className="ms-entity-cell">
            <Avatar className="ms-entity-avatar" style={{ background: '#722ed1' }}>
              {getAvatarText(record.name)}
            </Avatar>
            <div>
              <div className="ms-entity-name">{record.name}</div>
              <div className="ms-entity-subtitle">{record.scene} · 负责人：{record.owner}</div>
            </div>
          </div>
        ),
      },
      { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
      { title: '模型调用', dataIndex: 'modelCalls', key: 'modelCalls', width: 120, render: (value) => formatNumber(value) },
      { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
      { title: '关联技能', dataIndex: 'linkedSkills', key: 'linkedSkills', width: 120, render: (value) => `${formatNumber(value)} 个` },
      { title: '活跃用户', dataIndex: 'activeUsers', key: 'activeUsers', width: 120, render: (value) => `${formatNumber(value)} 人` },
      { title: '主力模型', dataIndex: 'topModel', key: 'topModel', width: 160, render: (value) => <Tag color="blue">{value}</Tag> },
      { title: '高频技能', dataIndex: 'topSkill', key: 'topSkill', width: 160, render: (value) => <Tag color="purple">{value}</Tag> },
      { title: '环比', dataIndex: 'growth', key: 'growth', width: 100, render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{formatGrowth(value)}</Tag> },
    ];
  }

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
      { title: '覆盖部门', dataIndex: 'coverageDepartments', key: 'coverageDepartments', width: 120, render: (value) => formatNumber(value) },
      { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 120, render: (value) => formatPercent(value) },
      { title: '主力模型', dataIndex: 'topModel', key: 'topModel', width: 160, render: (value) => <Tag color="blue">{value}</Tag> },
      { title: '环比', dataIndex: 'growth', key: 'growth', width: 100, render: (value) => <Tag color={value >= 0 ? 'success' : 'error'}>{formatGrowth(value)}</Tag> },
    ];
  }

  if (dimensionKey === 'department') {
    return [
      {
        title: '部门',
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
                {formatNumber(record.members)} 人 · 活跃 {formatNumber(record.activeUsers)} 人 / 深度 {formatNumber(record.deepUsers)} 人
              </div>
            </div>
          </div>
        ),
      },
      { title: '采纳率', dataIndex: 'adoptionRate', key: 'adoptionRate', width: 120, render: (value) => <Tag color="blue">{formatPercent(value)}</Tag> },
      { title: '深度使用率', dataIndex: 'deepUsageRate', key: 'deepUsageRate', width: 120, render: (value) => <Tag color="purple">{formatPercent(value)}</Tag> },
      { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
      { title: '模型调用', dataIndex: 'modelCalls', key: 'modelCalls', width: 120, render: (value) => formatNumber(value) },
      { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
      { title: '主力模型', dataIndex: 'topModel', key: 'topModel', width: 160, render: (value) => <Tag color="blue">{value}</Tag> },
      { title: '高频技能', dataIndex: 'topSkill', key: 'topSkill', width: 160, render: (value) => <Tag color="purple">{value}</Tag> },
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

function getAverage(records, getter) {
  if (!records?.length) return 0;
  return records.reduce((sum, item) => sum + Number(getter(item) || 0), 0) / records.length;
}

function getMaxMetricRecord(records, metricKey) {
  if (!records?.length) return null;
  return records.reduce((best, current) => (
    Number(current?.[metricKey] || 0) > Number(best?.[metricKey] || 0) ? current : best
  ), records[0]);
}

function getUsageRate(used, limit) {
  const safeLimit = Number(limit || 0);
  if (!safeLimit) return 0;
  return Math.min(100, (Number(used || 0) / safeLimit) * 100);
}

function scaleDepartmentUserActivity(records, factor) {
  return records.map((record) => ({
    ...record,
    modelCalls: scaleActivityCount(record.modelCalls, factor),
    skillCalls: scaleActivityCount(record.skillCalls, factor),
  }));
}

function buildDepartmentAdoptionMap(userActivity, departmentRanking) {
  const grouped = new Map();

  userActivity.forEach((record) => {
    const totalCalls = Number(record.modelCalls || 0) + Number(record.skillCalls || 0);
    if (totalCalls <= 0) {
      return;
    }

    const current = grouped.get(record.departmentName) || { activeUsers: 0, deepUsers: 0 };
    current.activeUsers += 1;
    if (totalCalls >= 5) {
      current.deepUsers += 1;
    }
    grouped.set(record.departmentName, current);
  });

  return new Map(
    departmentRanking.map((record) => {
      const members = Number(record.members || 0);
      const stats = grouped.get(record.name) || { activeUsers: 0, deepUsers: 0 };
      const activeUsers = Math.min(members, stats.activeUsers);
      const deepUsers = Math.min(activeUsers, stats.deepUsers);
      const adoptionRate = members ? (activeUsers / members) * 100 : 0;
      const deepUsageRate = members ? (deepUsers / members) * 100 : 0;

      return [record.name, { activeUsers, deepUsers, adoptionRate, deepUsageRate }];
    }),
  );
}

function renderSummaryGrid(items) {
  return (
    <div className="ms-summary-grid">
      {items.map((item) => (
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
  );
}

function buildUsageOverviewCards(dimensionData) {
  const tenantSummary = dimensionData.tenant.summary;
  return [
    {
      key: 'tenant-users',
      label: '活跃成员',
      value: formatCompact(tenantSummary.coverageValue),
      icon: <TeamOutlined />,
      hint: tenantSummary.coverageHint || '当前租户汇总口径',
    },
    {
      key: 'active-agents',
      label: '活跃智能体',
      value: formatCompact(dimensionData.agent.summary.coverageValue),
      icon: <RobotOutlined />,
      hint: `关联技能 ${formatCompact(dimensionData.skill.summary.coverageValue)} 个`,
    },
    {
      key: 'active-skills',
      label: '活跃技能',
      value: formatCompact(dimensionData.skill.summary.coverageValue),
      icon: <ThunderboltOutlined />,
      hint: `被 ${formatCompact(dimensionData.skill.summary.boundAgents)} 个智能体复用`,
    },
    {
      key: 'total-tokens',
      label: '总 Token',
      value: formatCompact(tenantSummary.totalTokens),
      icon: <BarChartOutlined />,
      hint: `总盘子以当前租户为准，环比 ${formatGrowth(tenantSummary.growth)}`,
    },
    {
      key: 'model-calls',
      label: '模型调用',
      value: formatCompact(tenantSummary.modelCalls),
      icon: <DatabaseOutlined />,
      hint: `覆盖 ${tenantSummary.modelFamilyCount} 类模型`,
    },
    {
      key: 'success-rate',
      label: '调用成功率',
      value: formatPercent(tenantSummary.successRate),
      icon: <AuditOutlined />,
      hint: `平均 ${tenantSummary.avgLatency.toFixed(1)}s / P95 ${tenantSummary.p95Latency.toFixed(1)}s`,
    },
  ];
}

function buildDimensionInsightCards(dimensionKey, data) {
  const avgTokens = data.summary.coverageValue ? Math.round(data.summary.totalTokens / data.summary.coverageValue) : 0;
  const avgModelCalls = data.summary.coverageValue ? Math.round(data.summary.modelCalls / data.summary.coverageValue) : 0;
  const topItem = data.ranking?.[0];

  if (dimensionKey === 'tenant') {
    return buildSummaryCards(
      {
        ...data.summary,
        coverageLabel: '活跃成员',
        coverageHint: data.summary.coverageHint,
      },
      dimensionKey,
    );
  }

  if (dimensionKey === 'personal') {
    return [
      { key: 'p-1', label: '活跃个人', value: formatCompact(data.summary.coverageValue), icon: <UserOutlined />, hint: '当前周期内发生有效调用的用户数' },
      { key: 'p-2', label: '人均 Token', value: formatCompact(avgTokens), icon: <ThunderboltOutlined />, hint: `高频技能 ${data.skillStats[0]?.name}` },
      { key: 'p-3', label: '人均模型调用', value: formatCompact(avgModelCalls), icon: <DatabaseOutlined />, hint: `峰值时段 ${data.summary.peakWindow}` },
      { key: 'p-4', label: '高活跃用户', value: topItem?.name || '-', icon: <FireOutlined />, hint: topItem ? `${topItem.team} · ${formatCompact(topItem.tokens)} token` : '暂无数据' },
      { key: 'p-5', label: '调用成功率', value: formatPercent(data.summary.successRate), icon: <AuditOutlined />, hint: `环比 ${formatGrowth(data.summary.growth)}` },
      { key: 'p-6', label: '平均响应', value: `${data.summary.avgLatency.toFixed(1)}s`, icon: <LineChartOutlined />, hint: `P95 ${data.summary.p95Latency.toFixed(1)}s` },
    ];
  }

  if (dimensionKey === 'department') {
    const topAdoptionDepartment = getMaxMetricRecord(data.ranking, 'adoptionRate');
    const topDeepUsageDepartment = getMaxMetricRecord(data.ranking, 'deepUsageRate');

    return [
      { key: 'd-1', label: '活跃部门', value: formatCompact(data.summary.coverageValue), icon: <ApartmentOutlined />, hint: '用于观察组织采纳和推广覆盖' },
      { key: 'd-2', label: '部门均 Token', value: formatCompact(avgTokens), icon: <ThunderboltOutlined />, hint: `主力部门 ${topItem?.name || '-'}` },
      {
        key: 'd-3',
        label: '高采纳率部门',
        value: formatPercent(topAdoptionDepartment?.adoptionRate || 0),
        icon: <LineChartOutlined />,
        hint: topAdoptionDepartment ? `${topAdoptionDepartment.name} · 活跃 ${formatNumber(topAdoptionDepartment.activeUsers)} / ${formatNumber(topAdoptionDepartment.members)} 人` : '暂无数据',
      },
      {
        key: 'd-4',
        label: '高深度使用部门',
        value: formatPercent(topDeepUsageDepartment?.deepUsageRate || 0),
        icon: <FireOutlined />,
        hint: topDeepUsageDepartment ? `${topDeepUsageDepartment.name} · 深度用户 ${formatNumber(topDeepUsageDepartment.deepUsers)} 人` : '暂无数据',
      },
      { key: 'd-5', label: '调用成功率', value: formatPercent(data.summary.successRate), icon: <AuditOutlined />, hint: `环比 ${formatGrowth(data.summary.growth)}` },
      { key: 'd-6', label: '平均响应', value: `${data.summary.avgLatency.toFixed(1)}s`, icon: <LineChartOutlined />, hint: `P95 ${data.summary.p95Latency.toFixed(1)}s` },
    ];
  }

  if (dimensionKey === 'agent') {
    return [
      { key: 'a-1', label: '活跃智能体', value: formatCompact(data.summary.coverageValue), icon: <RobotOutlined />, hint: '用于判断是否值得继续运营' },
      { key: 'a-2', label: '单体活跃用户', value: formatCompact(Math.round(getAverage(data.ranking, (item) => item.activeUsers))), icon: <TeamOutlined />, hint: '按头部智能体均值估算' },
      { key: 'a-3', label: '单体关联技能', value: formatCompact(Math.round(getAverage(data.ranking, (item) => item.linkedSkills))), icon: <ControlOutlined />, hint: data.summary.skillCallsHint || `绑定 ${data.summary.boundAgents} 个智能体` },
      { key: 'a-4', label: '主力模型', value: data.modelStats[0]?.name || '-', icon: <DatabaseOutlined />, hint: data.modelStats[0]?.desc || '暂无数据' },
      { key: 'a-5', label: '调用成功率', value: formatPercent(data.summary.successRate), icon: <AuditOutlined />, hint: `环比 ${formatGrowth(data.summary.growth)}` },
      { key: 'a-6', label: '平均响应', value: `${data.summary.avgLatency.toFixed(1)}s`, icon: <LineChartOutlined />, hint: `P95 ${data.summary.p95Latency.toFixed(1)}s` },
    ];
  }

  return [
    { key: 's-1', label: '活跃技能', value: formatCompact(data.summary.coverageValue), icon: <ThunderboltOutlined />, hint: '用于观察技能资产质量和复用价值' },
    { key: 's-2', label: '单技能平均调用', value: formatCompact(data.summary.coverageValue ? Math.round(data.summary.skillCalls / data.summary.coverageValue) : 0), icon: <BarChartOutlined />, hint: `高复用 ${data.ranking[0]?.name || '-'}` },
    { key: 's-3', label: '复用智能体', value: formatCompact(data.summary.boundAgents), icon: <RobotOutlined />, hint: `覆盖部门 ${formatCompact(data.ranking[0]?.coverageDepartments || 0)} 个` },
    { key: 's-4', label: '主力模型', value: data.modelStats[0]?.name || '-', icon: <DatabaseOutlined />, hint: data.modelStats[0]?.desc || '暂无数据' },
    { key: 's-5', label: '调用成功率', value: formatPercent(data.summary.successRate), icon: <AuditOutlined />, hint: `环比 ${formatGrowth(data.summary.growth)}` },
    { key: 's-6', label: '平均响应', value: `${data.summary.avgLatency.toFixed(1)}s`, icon: <LineChartOutlined />, hint: `P95 ${data.summary.p95Latency.toFixed(1)}s` },
  ];
}

function buildUsageLeaderboards(dimensionData) {
  return {
    personal: dimensionData.personal.ranking.slice(0, 4).map((item) => ({
      key: item.key,
      name: item.name,
      meta: item.team,
      primary: `${formatCompact(item.tokens)} token`,
      secondary: `${formatNumber(item.modelCalls)} 模型 / ${formatNumber(item.skillCalls)} 技能`,
      tagText: formatGrowth(item.growth),
      tagColor: item.growth >= 0 ? 'success' : 'error',
    })),
    department: dimensionData.department.ranking.slice(0, 4).map((item) => ({
      key: item.key,
      name: item.name,
      meta: `${formatNumber(item.members)} 人 · 采纳率 ${formatPercent(item.adoptionRate)} · 深度率 ${formatPercent(item.deepUsageRate)}`,
      primary: `${formatCompact(item.tokens)} token`,
      secondary: `活跃 ${formatNumber(item.activeUsers)} 人 / 深度 ${formatNumber(item.deepUsers)} 人`,
      tagText: formatGrowth(item.growth),
      tagColor: item.growth >= 0 ? 'success' : 'error',
    })),
    agent: dimensionData.agent.ranking.slice(0, 4).map((item) => ({
      key: item.key,
      name: item.name,
      meta: `${item.scene} · 负责人 ${item.owner}`,
      primary: `${formatNumber(item.activeUsers)} 人活跃`,
      secondary: `${formatCompact(item.tokens)} token / ${formatNumber(item.linkedSkills)} 个技能`,
      tagText: formatGrowth(item.growth),
      tagColor: item.growth >= 0 ? 'success' : 'error',
    })),
    skill: dimensionData.skill.ranking.slice(0, 4).map((item) => ({
      key: item.key,
      name: item.name,
      meta: `${item.category} · 复用 ${formatNumber(item.boundAgents)} 个智能体`,
      primary: `${formatNumber(item.calls)} 次调用`,
      secondary: `成功率 ${formatPercent(item.successRate)} / 覆盖 ${formatNumber(item.coverageDepartments)} 个部门`,
      tagText: formatGrowth(item.growth),
      tagColor: item.growth >= 0 ? 'success' : 'error',
    })),
  };
}

function buildCostTrendRows(tenantData) {
  const totalTokens = tenantData.summary.totalTokens || 1;
  return tenantData.trend.map((point) => ({
    key: point.label,
    label: point.label,
    amount: Math.max(1, Math.round((point.tokens / totalTokens) * tenantData.summary.estimatedCost)),
    modelCalls: point.modelCalls,
    skillCalls: point.skillCalls,
  }));
}

function buildBillingSummaryCards(dimensionData) {
  const tenant = dimensionData.tenant;
  const seatItem = tenant.ranking.find((item) => item.itemName === '智能体席位');
  const discountItem = tenant.ranking.find((item) => item.itemName === '免费额度抵扣');
  const costTrendRows = buildCostTrendRows(tenant);
  const peakPoint = costTrendRows.reduce((best, current) => (current.amount > best.amount ? current : best), costTrendRows[0]);
  const budget = Math.max(tenant.summary.estimatedCost + 3800, 1);

  return [
    {
      key: 'b-1',
      label: '本账期预估费用',
      value: formatCurrency(tenant.summary.estimatedCost),
      icon: <DollarCircleOutlined />,
      hint: `预算使用率 ${formatPercent((tenant.summary.estimatedCost / budget) * 100)}`,
    },
    {
      key: 'b-2',
      label: '模型费用',
      value: formatCurrency(tenant.summary.modelBillCost),
      icon: <DatabaseOutlined />,
      hint: `占总费用 ${formatPercent((tenant.summary.modelBillCost / tenant.summary.estimatedCost) * 100)}`,
    },
    {
      key: 'b-3',
      label: '技能运行费用',
      value: formatCurrency(tenant.summary.skillBillCost),
      icon: <ThunderboltOutlined />,
      hint: `占总费用 ${formatPercent((tenant.summary.skillBillCost / tenant.summary.estimatedCost) * 100)}`,
    },
    {
      key: 'b-4',
      label: '智能体席位',
      value: formatCurrency(seatItem?.estimatedCost || 0),
      icon: <RobotOutlined />,
      hint: `活跃智能体 ${formatCompact(dimensionData.agent.summary.coverageValue)} 个`,
    },
    {
      key: 'b-5',
      label: '优惠抵扣',
      value: formatCurrency(discountItem?.estimatedCost || 0),
      icon: <ArrowRightOutlined />,
      hint: '包含缓存 Token 与赠送额度抵扣',
    },
    {
      key: 'b-6',
      label: '成本峰值',
      value: peakPoint?.label || '-',
      icon: <LineChartOutlined />,
      hint: peakPoint ? `${formatCurrency(peakPoint.amount)} · ${tenant.summary.peakWindow}` : '暂无数据',
    },
  ];
}

function buildBillingAlertItems(dimensionData) {
  const tenant = dimensionData.tenant;
  const multimodal = tenant.modelStats.find((item) => item.family === '多模态');
  const topSkill = tenant.skillStats[0];
  const seatItem = tenant.ranking.find((item) => item.itemName === '智能体席位');

  return [
    {
      key: 'alert-1',
      title: `${multimodal?.name || '多模态模型'} 成本抬升`,
      description: `多模态调用占比 ${multimodal?.share || 0}% ，合同、截图与票据解析推动本账期多模态费用上行。`,
      impact: formatCurrency(Math.round((multimodal?.share || 0) * 0.01 * tenant.summary.modelBillCost * 0.52)),
      tone: 'warning',
    },
    {
      key: 'alert-2',
      title: `${topSkill?.name || '高频技能'} 成为技能主成本项`,
      description: '高复用技能在多个智能体中重复运行，建议优先检查提示词和检索链路是否存在冗余调用。',
      impact: formatCurrency(Math.round(tenant.summary.skillBillCost * 0.24)),
      tone: 'processing',
    },
    {
      key: 'alert-3',
      title: '智能体席位已进入运营敏感区',
      description: `当前租户有 ${formatCompact(dimensionData.agent.summary.coverageValue)} 个活跃智能体，需结合治理动作同步判断是否扩容或收缩。`,
      impact: formatCurrency(seatItem?.estimatedCost || 0),
      tone: 'default',
    },
  ];
}

function buildModelBillingRows(dimensionData) {
  const tenant = dimensionData.tenant;
  return tenant.modelStats.map((item) => ({
    key: item.key,
    name: item.name,
    tagLabel: item.family,
    tagColor: FAMILY_TAG_COLORS[item.family] || 'default',
    meta: item.desc,
    primary: `${formatNumber(item.calls)} 次调用`,
    secondary: `${formatCompact(item.tokens)} token`,
    share: item.share,
    cost: Math.round((item.share / 100) * tenant.summary.modelBillCost),
    color: item.color,
  }));
}

function buildDepartmentBillingRows(dimensionData) {
  const tenantCost = dimensionData.tenant.summary.estimatedCost;
  const totalDeptTokens = dimensionData.department.ranking.reduce((sum, item) => sum + Number(item.tokens || 0), 0) || 1;
  return dimensionData.department.ranking.map((item) => {
    const cost = Math.round((item.tokens / totalDeptTokens) * tenantCost * 0.72);
    const share = Math.max(1, Math.round((cost / tenantCost) * 100));
    return {
      key: item.key,
      name: item.name,
      tagLabel: `${formatNumber(item.members)} 人`,
      tagColor: 'blue',
      meta: `高频技能 ${item.topSkill}`,
      primary: `${formatCompact(item.tokens)} token`,
      secondary: `采纳率 ${formatPercent(item.adoptionRate)} / 深度率 ${formatPercent(item.deepUsageRate)}`,
      share,
      cost,
      color: '#1677ff',
      members: item.members,
      activeUsers: item.activeUsers,
      deepUsers: item.deepUsers,
      adoptionRate: item.adoptionRate,
      deepUsageRate: item.deepUsageRate,
      modelCalls: item.modelCalls,
      skillCalls: item.skillCalls,
    };
  });
}

function buildAgentBillingRows(dimensionData) {
  const tenant = dimensionData.tenant;
  const seatCost = tenant.ranking.find((item) => item.itemName === '智能体席位')?.estimatedCost || 0;
  const totalTokens = dimensionData.agent.ranking.reduce((sum, item) => sum + Number(item.tokens || 0), 0) || 1;
  const totalSkillCalls = dimensionData.agent.ranking.reduce((sum, item) => sum + Number(item.skillCalls || 0), 0) || 1;
  const totalActiveUsers = dimensionData.agent.ranking.reduce((sum, item) => sum + Number(item.activeUsers || 0), 0) || 1;

  return dimensionData.agent.ranking.map((item) => {
    const cost = Math.round(
      (item.tokens / totalTokens) * tenant.summary.modelBillCost * 0.58
      + (item.skillCalls / totalSkillCalls) * tenant.summary.skillBillCost * 0.72
      + (item.activeUsers / totalActiveUsers) * seatCost,
    );
    const share = Math.max(1, Math.round((cost / tenant.summary.estimatedCost) * 100));
    return {
      ...item,
      estimatedCost: cost,
      share,
      unitCost: item.activeUsers ? Math.round(cost / item.activeUsers) : cost,
    };
  });
}

function buildSkillBillingRows(dimensionData) {
  const tenant = dimensionData.tenant;
  const totalCalls = dimensionData.skill.ranking.reduce((sum, item) => sum + Number(item.calls || 0), 0) || 1;
  const totalTokens = dimensionData.skill.ranking.reduce((sum, item) => sum + Number(item.tokens || 0), 0) || 1;
  return dimensionData.skill.ranking.map((item) => {
    const cost = Math.round(
      (item.tokens / totalTokens) * tenant.summary.modelBillCost * 0.18
      + (item.calls / totalCalls) * tenant.summary.skillBillCost,
    );
    const share = Math.max(1, Math.round((cost / tenant.summary.estimatedCost) * 100));
    return {
      ...item,
      estimatedCost: cost,
      share,
      unitCost: item.calls ? Math.round(cost / item.calls) : cost,
    };
  });
}

function buildQuotaProgressRows() {
  return [
    {
      key: 'quota-skill',
      label: '技能使用次数',
      used: CURRENT_TENANT_QUOTA.skillUsageUsed,
      limit: CURRENT_TENANT_QUOTA.skillUsageLimit,
      hint: `剩余 ${formatNumber(CURRENT_TENANT_QUOTA.skillUsageLimit - CURRENT_TENANT_QUOTA.skillUsageUsed)} 次`,
      formatter: (value) => `${formatNumber(value)} 次`,
    },
    {
      key: 'quota-token',
      label: 'Token 使用',
      used: CURRENT_TENANT_QUOTA.tokenUsed,
      limit: CURRENT_TENANT_QUOTA.tokenLimit,
      hint: `剩余 ${formatCompact(CURRENT_TENANT_QUOTA.tokenLimit - CURRENT_TENANT_QUOTA.tokenUsed)}`,
      formatter: (value) => formatCompact(value),
    },
    {
      key: 'quota-agent',
      label: '智能体创建',
      used: CURRENT_TENANT_QUOTA.agentCreated,
      limit: CURRENT_TENANT_QUOTA.agentCreateLimit,
      hint: `剩余 ${formatNumber(CURRENT_TENANT_QUOTA.agentCreateLimit - CURRENT_TENANT_QUOTA.agentCreated)} 个`,
      formatter: (value) => `${formatNumber(value)} 个`,
    },
    {
      key: 'quota-generate',
      label: '技能生成',
      used: CURRENT_TENANT_QUOTA.skillGenerated,
      limit: CURRENT_TENANT_QUOTA.skillGenerateLimit,
      hint: `剩余 ${formatNumber(CURRENT_TENANT_QUOTA.skillGenerateLimit - CURRENT_TENANT_QUOTA.skillGenerated)} 次`,
      formatter: (value) => `${formatNumber(value)} 次`,
    },
  ];
}

function buildGovernanceData(dimensionData) {
  const quotaRows = buildQuotaProgressRows();
  const overQuotaUsers = dimensionData.personal.ranking.slice(0, 4).map((item) => ({
    ...item,
    usageRate: Math.min(98, Math.round(60 + Number(item.tokens || 0) / 7000)),
    suggestion: '收紧个人免费额度或纳入部门套餐',
  }));

  const lowAdoptionDepartments = [...dimensionData.department.ranking]
    .sort((a, b) => Number(a.adoptionRate || 0) - Number(b.adoptionRate || 0))
    .slice(0, 4)
    .map((item) => ({
      ...item,
      suggestion: '安排部门定向培训和场景推广',
    }));

  const silentAgents = BASE_SILENT_AGENTS.map((item, index) => ({
    ...item,
    activeUsers: item.activeUsers + index,
  }));

  const riskySkills = [...dimensionData.skill.skillStats]
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 4)
    .map((item) => ({
      ...item,
      failureRate: Number((100 - item.successRate).toFixed(1)),
      suggestion: '检查提示词、超时重试和知识库命中率',
    }));

  const maxQuotaRate = Math.max(...quotaRows.map((item) => getUsageRate(item.used, item.limit)));

  return {
    quotaRows,
    overQuotaUsers,
    lowAdoptionDepartments,
    silentAgents,
    riskySkills,
    summaryCards: [
      {
        key: 'g-1',
        label: '超阈值对象',
        value: formatCompact(overQuotaUsers.filter((item) => item.usageRate >= 85).length + riskySkills.length),
        icon: <WarningOutlined />,
        hint: '包含高消耗用户和高失败技能',
      },
      {
        key: 'g-2',
        label: '即将超额项',
        value: formatCompact(quotaRows.filter((item) => getUsageRate(item.used, item.limit) >= 70).length),
        icon: <ControlOutlined />,
        hint: '优先打开租户配额处理',
      },
      {
        key: 'g-3',
        label: '沉默智能体',
        value: formatCompact(silentAgents.length),
        icon: <RobotOutlined />,
        hint: '7 天内活跃用户偏低，建议限流或合并',
      },
      {
        key: 'g-4',
        label: '高失败技能',
        value: formatCompact(riskySkills.length),
        icon: <ThunderboltOutlined />,
        hint: `最低成功率 ${formatPercent(riskySkills[0]?.successRate || 0)}`,
      },
      {
        key: 'g-5',
        label: '治理动作',
        value: formatCompact(GOVERNANCE_ACTIONS.length),
        icon: <ArrowRightOutlined />,
        hint: '支持直达套餐、租户配额和免费策略',
      },
      {
        key: 'g-6',
        label: '当前配额压力',
        value: formatPercent(maxQuotaRate),
        icon: <LineChartOutlined />,
        hint: '按当前账期配额快照评估',
      },
    ],
    recommendations: [
      `先处理 ${overQuotaUsers[0]?.name || '高消耗用户'}，其个人使用率已达到 ${formatPercent(overQuotaUsers[0]?.usageRate || 0)}。`,
      `对 ${lowAdoptionDepartments[0]?.name || '低采纳部门'} 做场景推广，当前采纳率仅 ${formatPercent(lowAdoptionDepartments[0]?.adoptionRate || 0)}。`,
      `将 ${silentAgents[0]?.name || '沉默智能体'} 纳入下线观察名单，避免继续占用席位和技能成本。`,
    ],
  };
}

function renderLeaderboardCard(title, items, extra) {
  return (
    <Card className="ms-panel-card" title={title} extra={extra}>
      <div className="ms-leaderboard-list">
        {items.map((item, index) => (
          <div className="ms-leaderboard-row" key={item.key}>
            <div className="ms-leaderboard-rank">{index + 1}</div>
            <div className="ms-leaderboard-main">
              <div className="ms-leaderboard-top">
                <div>
                  <div className="ms-leaderboard-name">{item.name}</div>
                  <div className="ms-leaderboard-meta">{item.meta}</div>
                </div>
                {item.tagText ? <Tag color={item.tagColor}>{item.tagText}</Tag> : null}
              </div>
              <div className="ms-leaderboard-metrics">
                <span>{item.primary}</span>
                <span>{item.secondary}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function renderBillingBreakdownCard(title, rows, extra) {
  return (
    <Card className="ms-panel-card" title={title} extra={extra}>
      <div className="ms-billing-list">
        {rows.map((item) => (
          <div className="ms-billing-row" key={item.key}>
            <div className="ms-billing-top">
              <div className="ms-billing-main">
                <div className="ms-billing-name">{item.name}</div>
                <div className="ms-billing-meta">{item.meta}</div>
              </div>
              <div className="ms-billing-side">
                <div className="ms-billing-cost">{formatCurrency(item.cost)}</div>
                <Tag color={item.tagColor}>{item.tagLabel}</Tag>
              </div>
            </div>
            <Progress
              percent={Math.max(1, Math.round(item.share))}
              showInfo={false}
              strokeColor={item.color}
              trailColor="#eef2f7"
              size="small"
            />
            <div className="ms-billing-foot">
              <span>{item.primary}</span>
              <span>{item.secondary}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function renderQuotaProgressCard(rows, onNavigateToQuota) {
  return (
    <Card
      className="ms-panel-card"
      title="当前租户配额压力"
      extra={(
        <Button type="link" onClick={() => onNavigateToQuota('tenant')}>
          打开租户配额
        </Button>
      )}
    >
      <div className="ms-progress-list">
        {rows.map((item) => {
          const rate = getUsageRate(item.used, item.limit);
          const strokeColor = rate >= 90 ? '#ff4d4f' : rate >= 75 ? '#faad14' : '#52c41a';
          return (
            <div className="ms-progress-item" key={item.key}>
              <div className="ms-progress-head">
                <span>{item.label}</span>
                <span>{item.formatter(item.used)} / {item.formatter(item.limit)}</span>
              </div>
              <Progress percent={Math.round(rate)} showInfo={false} strokeColor={strokeColor} trailColor="#eef2f7" />
              <div className="ms-progress-caption">
                <span>{item.hint}</span>
                <span>{formatPercent(rate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function renderActionCard(onNavigateToQuota, onSwitchView) {
  return (
    <Card
      className="ms-panel-card"
      title="治理动作"
      extra={(
        <Button type="link" onClick={() => onSwitchView?.('governance')}>
          查看治理看板
        </Button>
      )}
    >
      <div className="ms-action-list">
        {GOVERNANCE_ACTIONS.map((item) => (
          <div className="ms-action-item" key={item.key}>
            <div className="ms-action-main">
              <div className="ms-action-title">{item.title}</div>
              <div className="ms-action-desc">{item.description}</div>
            </div>
            <Button type="primary" ghost onClick={() => onNavigateToQuota(item.tab)}>
              去处理
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function renderDimensionInsightPane(dimensionKey, data, options = {}) {
  const summaryCards = buildDimensionInsightCards(dimensionKey, data);
  const tokenRows = getTokenRows(data.summary);
  const trendMax = Math.max(...data.trend.map((item) => item.tokens), 1);
  const tableTitle = dimensionKey === 'tenant' ? '当前账期费用摘要' : data.tableTitle;

  return (
    <div className="ms-tab-pane">
      <Alert
        className="ms-dimension-alert"
        type={dimensionKey === 'tenant' ? 'info' : 'success'}
        showIcon
        message={DIMENSION_META[dimensionKey].label}
        description={DIMENSION_GOALS[dimensionKey]}
      />

      {renderSummaryGrid(summaryCards)}

      <div className="ms-panel-grid">
        <Card
          className="ms-panel-card"
          title={`${DIMENSION_META[dimensionKey].label} Token 构成`}
          extra={(
            <Space size={8}>
              {dimensionKey === 'tenant' && options.onSwitchView ? (
                <Button type="link" onClick={() => options.onSwitchView('billing')}>
                  查看完整账单
                </Button>
              ) : null}
              <Tag color="blue">最近 7 个采样点</Tag>
            </Space>
          )}
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

        <Card className="ms-panel-card" title={tableTitle}>
          <Table
            rowKey="key"
            size="small"
            pagination={false}
            columns={renderTableColumns(dimensionKey)}
            dataSource={data.ranking}
            scroll={{ x: dimensionKey === 'tenant' ? 1120 : dimensionKey === 'skill' ? 1180 : dimensionKey === 'agent' ? 1260 : dimensionKey === 'department' ? 1380 : 1000 }}
            className="ms-table"
          />
        </Card>
      </div>
    </div>
  );
}

function renderUsageDashboard(dimensionData, onNavigateToQuota, onSwitchView) {
  const leaderboards = buildUsageLeaderboards(dimensionData);
  const billingSummaryCards = buildBillingSummaryCards(dimensionData);

  return (
    <div className="ms-dashboard-pane">
      <Alert
        className="ms-dashboard-alert"
        type="info"
        showIcon
        message="管理目标：先看使用与活跃，再看成本摘要，最后进入治理动作"
        description="默认首页聚焦当前租户的活跃成员、活跃智能体、活跃技能和异常对象；账单作为次级模块独立成页，治理动作可直达智能体配额配置。"
      />

      {renderSummaryGrid(buildUsageOverviewCards(dimensionData))}

      <div className="ms-focus-grid">
        {renderLeaderboardCard('个人活跃排行', leaderboards.personal, <Tag color="blue">{formatCompact(dimensionData.personal.summary.coverageValue)} 人</Tag>)}
        {renderLeaderboardCard('部门采纳排行', leaderboards.department, <Tag color="purple">{formatCompact(dimensionData.department.summary.coverageValue)} 个部门</Tag>)}
        {renderLeaderboardCard('智能体活跃排行', leaderboards.agent, <Tag color="geekblue">{formatCompact(dimensionData.agent.summary.coverageValue)} 个智能体</Tag>)}
        {renderLeaderboardCard('技能复用排行', leaderboards.skill, <Tag color="green">{formatCompact(dimensionData.skill.summary.coverageValue)} 个技能</Tag>)}
      </div>

      <div className="ms-panel-grid ms-panel-grid-bottom">
        <Card
          className="ms-panel-card"
          title="账期费用摘要"
          extra={(
            <Button type="link" onClick={() => onSwitchView('billing')}>
              查看完整账单
            </Button>
          )}
        >
          <div className="ms-chip-list">
            {billingSummaryCards.slice(0, 4).map((item) => (
              <div className="ms-chip-item" key={item.key}>
                <div className="ms-chip-label">{item.label}</div>
                <div className="ms-chip-value">{item.value}</div>
                <div className="ms-chip-hint">{item.hint}</div>
              </div>
            ))}
          </div>
          <div className="ms-section-note">
            当前页只保留账单摘要和异常提醒，完整成本拆解已下沉到“账单与成本看板”。
          </div>
        </Card>

        {renderActionCard(onNavigateToQuota, onSwitchView)}
      </div>

      <Card
        className="ms-panel-card"
        title="维度洞察"
        extra={<Tag color="cyan">维度用于分析对象，不再并列代表同一个总盘子</Tag>}
      >
        <Tabs
          className="ms-dimension-tabs"
          items={VISIBLE_DIMENSION_KEYS.map((key) => ({
            key,
            label: DIMENSION_META[key].label,
            children: renderDimensionInsightPane(key, dimensionData[key], { onSwitchView }),
          }))}
        />
      </Card>
    </div>
  );
}

function renderBillingDashboard(dimensionData) {
  const tenant = dimensionData.tenant;
  const billingSummaryCards = buildBillingSummaryCards(dimensionData);
  const costTrendRows = buildCostTrendRows(tenant);
  const trendMax = Math.max(...costTrendRows.map((item) => item.amount), 1);
  const alertItems = buildBillingAlertItems(dimensionData);
  const modelRows = buildModelBillingRows(dimensionData);
  const departmentRows = buildDepartmentBillingRows(dimensionData);
  const agentRows = buildAgentBillingRows(dimensionData);
  const skillRows = buildSkillBillingRows(dimensionData);

  const agentBillingColumns = [
    {
      title: '智能体',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="ms-entity-cell">
          <Avatar className="ms-entity-avatar" style={{ background: '#722ed1' }}>
            {getAvatarText(record.name)}
          </Avatar>
          <div>
            <div className="ms-entity-name">{record.name}</div>
            <div className="ms-entity-subtitle">{record.scene} · 负责人：{record.owner}</div>
          </div>
        </div>
      ),
    },
    { title: '活跃用户', dataIndex: 'activeUsers', key: 'activeUsers', width: 120, render: (value) => `${formatNumber(value)} 人` },
    { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
    { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '费用占比', dataIndex: 'share', key: 'share', width: 120, render: (value) => <Tag color="blue">{formatPercent(value)}</Tag> },
    { title: '预估费用', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 130, render: (value) => <Tag color="processing">{formatCurrency(value)}</Tag> },
    { title: '人均费用', dataIndex: 'unitCost', key: 'unitCost', width: 130, render: (value) => formatCurrency(value) },
  ];

  const skillBillingColumns = [
    {
      title: '技能',
      dataIndex: 'name',
      key: 'name',
      width: 220,
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
    { title: '调用次数', dataIndex: 'calls', key: 'calls', width: 120, render: (value) => formatNumber(value) },
    { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 120, render: (value) => formatPercent(value) },
    { title: '费用占比', dataIndex: 'share', key: 'share', width: 120, render: (value) => <Tag color="blue">{formatPercent(value)}</Tag> },
    { title: '预估费用', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 130, render: (value) => <Tag color="processing">{formatCurrency(value)}</Tag> },
    { title: '单次费用', dataIndex: 'unitCost', key: 'unitCost', width: 130, render: (value) => formatCurrency(value) },
  ];

  const departmentBillingColumns = [
    {
      title: '部门',
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
            <div className="ms-entity-subtitle">{formatNumber(record.members)} 人 · 活跃 {formatNumber(record.activeUsers)} 人 / 深度 {formatNumber(record.deepUsers)} 人</div>
          </div>
        </div>
      ),
    },
    { title: '成员数', dataIndex: 'members', key: 'members', width: 120, render: (value) => formatNumber(value) },
    { title: '采纳率', dataIndex: 'adoptionRate', key: 'adoptionRate', width: 120, render: (value) => <Tag color="blue">{formatPercent(value)}</Tag> },
    { title: '深度率', dataIndex: 'deepUsageRate', key: 'deepUsageRate', width: 120, render: (value) => <Tag color="purple">{formatPercent(value)}</Tag> },
    { title: 'Token', dataIndex: 'primary', key: 'primary', width: 140 },
    { title: '模型调用', dataIndex: 'modelCalls', key: 'modelCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '费用占比', dataIndex: 'share', key: 'share', width: 120, render: (value) => <Tag color="blue">{formatPercent(value)}</Tag> },
    { title: '预估费用', dataIndex: 'cost', key: 'cost', width: 140, render: (value) => <Tag color="processing">{formatCurrency(value)}</Tag> },
  ];

  return (
    <div className="ms-dashboard-pane">
      <Alert
        className="ms-dashboard-alert"
        type="warning"
        showIcon
        message="账单与成本看板只统计当前租户，不做多租户排行"
        description="该页用于看账期费用、成本分布和异常峰值。当前租户的总费用、模型费用、技能费用和席位成本在这里独立分析，不与活跃看板混排。"
      />

      {renderSummaryGrid(billingSummaryCards)}

      <div className="ms-panel-grid">
        <Card className="ms-panel-card" title="账期费用走势" extra={<Tag color="orange">{tenant.summary.coverageHint}</Tag>}>
          <div className="ms-trend ms-trend-cost">
            {costTrendRows.map((item) => (
              <div className="ms-trend-col" key={item.key}>
                <div className="ms-trend-value ms-trend-value-cost">{formatCurrency(item.amount)}</div>
                <div className="ms-trend-bar-shell">
                  <div
                    className="ms-trend-bar ms-trend-bar-cost"
                    style={{ height: `${Math.max(18, Math.round((item.amount / trendMax) * 100))}%` }}
                  />
                </div>
                <div className="ms-trend-label">{item.label}</div>
                <div className="ms-trend-caption">{formatNumber(item.modelCalls)} 模型 / {formatNumber(item.skillCalls)} 技能</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="ms-panel-card" title="异常与关注项" extra={<Tag color="warning">成本异常</Tag>}>
          <div className="ms-alert-list">
            {alertItems.map((item) => (
              <div className="ms-alert-item" key={item.key}>
                <div>
                  <div className="ms-alert-title">{item.title}</div>
                  <div className="ms-alert-desc">{item.description}</div>
                </div>
                <div className="ms-alert-side">
                  <Tag color={item.tone}>{item.impact}</Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="ms-panel-grid ms-panel-grid-bottom">
        {renderBillingBreakdownCard('模型费用分布', modelRows, <Tag color="purple">{tenant.modelStats[0]?.name}</Tag>)}
        {renderBillingBreakdownCard('部门成本分摊', departmentRows, <Tag color="blue">{dimensionData.department.ranking[0]?.name}</Tag>)}
      </div>

      <Card className="ms-panel-card" title="费用明细" extra={<Tag color="geekblue">当前租户账期</Tag>}>
        <Tabs
          className="ms-detail-tabs"
          items={[
            {
              key: 'billing-item',
              label: '账单项',
              children: (
                <Table
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={renderTableColumns('tenant')}
                  dataSource={tenant.ranking}
                  scroll={{ x: 1120 }}
                  className="ms-table"
                />
              ),
            },
            {
              key: 'billing-agent',
              label: '按智能体计费',
              children: (
                <Table
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={agentBillingColumns}
                  dataSource={agentRows}
                  scroll={{ x: 1080 }}
                  className="ms-table"
                />
              ),
            },
            {
              key: 'billing-skill',
              label: '按技能计费',
              children: (
                <Table
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={skillBillingColumns}
                  dataSource={skillRows}
                  scroll={{ x: 980 }}
                  className="ms-table"
                />
              ),
            },
            {
              key: 'billing-department',
              label: '按部门分摊',
              children: (
                <Table
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={departmentBillingColumns}
                  dataSource={departmentRows}
                  scroll={{ x: 1180 }}
                  className="ms-table"
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

function renderGovernanceDashboard(dimensionData, onNavigateToQuota) {
  const governanceData = buildGovernanceData(dimensionData);

  const overQuotaColumns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div className="ms-entity-cell">
          <Avatar className="ms-entity-avatar" style={{ background: '#2f54eb' }}>
            {getAvatarText(record.name)}
          </Avatar>
          <div>
            <div className="ms-entity-name">{record.name}</div>
            <div className="ms-entity-subtitle">{record.team}</div>
          </div>
        </div>
      ),
    },
    { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
    { title: '技能调用', dataIndex: 'skillCalls', key: 'skillCalls', width: 120, render: (value) => formatNumber(value) },
    { title: '使用率', dataIndex: 'usageRate', key: 'usageRate', width: 120, render: (value) => <Tag color={value >= 90 ? 'error' : 'warning'}>{formatPercent(value)}</Tag> },
    { title: '高频技能', dataIndex: 'topSkill', key: 'topSkill', width: 160, render: (value) => <Tag color="purple">{value}</Tag> },
    { title: '建议动作', dataIndex: 'suggestion', key: 'suggestion', width: 240 },
  ];

  const lowAdoptionColumns = [
    {
      title: '部门',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div className="ms-entity-cell">
          <Avatar className="ms-entity-avatar" style={{ background: '#1677ff' }}>
            {getAvatarText(record.name)}
          </Avatar>
          <div>
            <div className="ms-entity-name">{record.name}</div>
            <div className="ms-entity-subtitle">{formatNumber(record.members)} 人</div>
          </div>
        </div>
      ),
    },
    { title: '活跃人数', dataIndex: 'activeUsers', key: 'activeUsers', width: 120, render: (value) => `${formatNumber(value)} 人` },
    { title: '采纳率', dataIndex: 'adoptionRate', key: 'adoptionRate', width: 120, render: (value) => <Tag color={value < 40 ? 'error' : 'warning'}>{formatPercent(value)}</Tag> },
    { title: '深度率', dataIndex: 'deepUsageRate', key: 'deepUsageRate', width: 120, render: (value) => <Tag color={value < 25 ? 'warning' : 'processing'}>{formatPercent(value)}</Tag> },
    { title: 'Token', dataIndex: 'tokens', key: 'tokens', width: 120, render: (value) => formatCompact(value) },
    { title: '高频技能', dataIndex: 'topSkill', key: 'topSkill', width: 160, render: (value) => <Tag color="purple">{value}</Tag> },
    { title: '建议动作', dataIndex: 'suggestion', key: 'suggestion', width: 240 },
  ];

  const silentAgentColumns = [
    {
      title: '智能体',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div className="ms-entity-cell">
          <Avatar className="ms-entity-avatar" style={{ background: '#722ed1' }}>
            {getAvatarText(record.name)}
          </Avatar>
          <div>
            <div className="ms-entity-name">{record.name}</div>
            <div className="ms-entity-subtitle">{record.scene} · 负责人：{record.owner}</div>
          </div>
        </div>
      ),
    },
    { title: '活跃用户', dataIndex: 'activeUsers', key: 'activeUsers', width: 120, render: (value) => `${formatNumber(value)} 人` },
    { title: '关联技能', dataIndex: 'linkedSkills', key: 'linkedSkills', width: 120, render: (value) => `${formatNumber(value)} 个` },
    { title: '最近活跃', dataIndex: 'lastActive', key: 'lastActive', width: 120 },
    { title: '建议动作', dataIndex: 'suggestion', key: 'suggestion', width: 240 },
  ];

  const riskySkillColumns = [
    {
      title: '技能',
      dataIndex: 'name',
      key: 'name',
      width: 220,
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
    { title: '调用次数', dataIndex: 'calls', key: 'calls', width: 120, render: (value) => formatNumber(value) },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 120, render: (value) => <Tag color={value < 97 ? 'error' : 'warning'}>{formatPercent(value)}</Tag> },
    { title: '失败率', dataIndex: 'failureRate', key: 'failureRate', width: 120, render: (value) => `${Number(value).toFixed(1)}%` },
    { title: '建议动作', dataIndex: 'suggestion', key: 'suggestion', width: 260 },
  ];

  return (
    <div className="ms-dashboard-pane">
      <Alert
        className="ms-dashboard-alert"
        type="warning"
        showIcon
        message="治理与配额看板聚焦异常对象和治理动作"
        description="这里不只是展示统计结果，而是把超额用户、低采纳部门、沉默智能体和高失败技能收敛成可执行的治理清单，并直接跳转到智能体配额配置。"
      />

      {renderSummaryGrid(governanceData.summaryCards)}

      <div className="ms-panel-grid">
        {renderQuotaProgressCard(governanceData.quotaRows, onNavigateToQuota)}

        <Card className="ms-panel-card" title="治理动作" extra={<Tag color="error">需处理</Tag>}>
          <div className="ms-action-list">
            {GOVERNANCE_ACTIONS.map((item) => (
              <div className="ms-action-item" key={item.key}>
                <div className="ms-action-main">
                  <div className="ms-action-title">{item.title}</div>
                  <div className="ms-action-desc">{item.description}</div>
                </div>
                <Button type="primary" ghost onClick={() => onNavigateToQuota(item.tab)}>
                  去处理
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="ms-panel-grid ms-panel-grid-bottom">
        <Card className="ms-panel-card" title="本周治理建议" extra={<Tag color="gold">按优先级排序</Tag>}>
          <div className="ms-advice-list">
            {governanceData.recommendations.map((item, index) => (
              <div className="ms-advice-item" key={index}>
                <div className="ms-advice-index">{index + 1}</div>
                <div className="ms-advice-text">{item}</div>
              </div>
            ))}
          </div>
          <div className="ms-section-note">
            统计页负责识别问题对象，真正的配额调整和策略配置放在“智能体配额”模块执行。
          </div>
        </Card>

        <Card className="ms-panel-card" title="治理清单" extra={<Tag color="blue">支持跳转配额模块</Tag>}>
          <Tabs
            className="ms-detail-tabs"
            items={[
              {
                key: 'gov-user',
                label: '超额用户',
                children: (
                  <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    columns={overQuotaColumns}
                    dataSource={governanceData.overQuotaUsers}
                    scroll={{ x: 980 }}
                    className="ms-table"
                  />
                ),
              },
              {
                key: 'gov-dept',
                label: '低采纳部门',
                children: (
                  <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    columns={lowAdoptionColumns}
                    dataSource={governanceData.lowAdoptionDepartments}
                    scroll={{ x: 1120 }}
                    className="ms-table"
                  />
                ),
              },
              {
                key: 'gov-agent',
                label: '沉默智能体',
                children: (
                  <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    columns={silentAgentColumns}
                    dataSource={governanceData.silentAgents}
                    scroll={{ x: 980 }}
                    className="ms-table"
                  />
                ),
              },
              {
                key: 'gov-skill',
                label: '高失败技能',
                children: (
                  <Table
                    rowKey="key"
                    size="small"
                    pagination={false}
                    columns={riskySkillColumns}
                    dataSource={governanceData.riskySkills}
                    scroll={{ x: 980 }}
                    className="ms-table"
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

export default function ModelStatisticsModule({ onNavigateToQuota = () => {} }) {
  const [period, setPeriod] = useState('30d');
  const [activeView, setActiveView] = useState('usage');

  const dimensionData = useMemo(() => {
    const factor = PERIOD_FACTORS[period] || 1;
    const scaledDimensions = Object.fromEntries(
      Object.entries(BASE_DIMENSIONS).map(([key, value]) => [key, scaleDimensionData(value, factor)]),
    );
    const scaledDepartmentActivity = scaleDepartmentUserActivity(BASE_DEPARTMENT_USER_ACTIVITY, factor);
    const departmentAdoptionMap = buildDepartmentAdoptionMap(
      scaledDepartmentActivity,
      scaledDimensions.department.ranking,
    );

    scaledDimensions.department = {
      ...scaledDimensions.department,
      ranking: scaledDimensions.department.ranking.map((item) => ({
        ...item,
        ...(departmentAdoptionMap.get(item.name) || {
          activeUsers: 0,
          deepUsers: 0,
          adoptionRate: 0,
          deepUsageRate: 0,
        }),
      })),
    };

    return scaledDimensions;
  }, [period]);

  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label || period;

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
            面向租户管理员，将模型统计重组为使用与活跃、账单与成本、治理与配额三个管理看板；当前时间范围：{periodLabel}。
          </div>
        </div>

        <Space size={12}>
          <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <Button icon={<ReloadOutlined />} onClick={() => message.success('模型统计数据已刷新')}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="ms-content">
        <Card className="ms-note-card" bordered={false}>
          <div className="ms-note-title">管理者视角</div>
          <div className="ms-note-text">
            当前模块基于单租户 mock 数据重构为管理看板。默认先看“使用与活跃”，总盘子只认当前租户；账单拆成独立成本页；异常对象收敛到治理页并可直接跳转到智能体配额配置。
          </div>
          <div className="ms-note-tags">
            <Tag color="blue">使用与活跃优先</Tag>
            <Tag color="purple">账单次级独立</Tag>
            <Tag color="green">治理动作直达配额</Tag>
            <Tag color="cyan">五个维度做分析</Tag>
            <Tag color="geekblue">当前租户总盘子</Tag>
          </div>
        </Card>

        <Tabs
          activeKey={activeView}
          onChange={setActiveView}
          className="ms-tabs ms-top-tabs"
          items={[
            {
              key: 'usage',
              label: MANAGEMENT_VIEW_ITEMS[0].label,
              children: renderUsageDashboard(dimensionData, onNavigateToQuota, setActiveView),
            },
            {
              key: 'billing',
              label: MANAGEMENT_VIEW_ITEMS[1].label,
              children: renderBillingDashboard(dimensionData),
            },
            {
              key: 'governance',
              label: MANAGEMENT_VIEW_ITEMS[2].label,
              children: renderGovernanceDashboard(dimensionData, onNavigateToQuota),
            },
          ]}
        />
      </div>
    </div>
  );
}
