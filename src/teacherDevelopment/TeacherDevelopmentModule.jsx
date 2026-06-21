import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Progress,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  AuditOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  RiseOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  getTeacherEvaluationStatusLabel,
  teacherEvaluationApi,
} from '../teacherEvaluation/api';
import {
  capabilityModelApi,
  getCapabilityModelStoreEventName,
} from '../capabilityModel/api';
import '../system/SystemModule.css';
import './TeacherDevelopmentModule.css';

const { Search } = Input;

const MANAGER_ROLE_OPTIONS = [
  { label: '教研组长', value: 'GROUP_LEADER' },
  { label: '企业导师', value: 'ENTERPRISE_MENTOR' },
  { label: '督导/教学管理者', value: 'SUPERVISOR' },
  { label: '校级评审组', value: 'SCHOOL_REVIEW' },
];

const RISK_LEVEL_OPTIONS = [
  { label: '全部风险', value: 'ALL' },
  { label: '高关注', value: 'HIGH' },
  { label: '持续关注', value: 'MEDIUM' },
  { label: '稳定推进', value: 'LOW' },
];

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 16);
}

function parseMinimumEvidenceCount(text) {
  const matched = String(text || '').match(/至少\s*(\d+)/);
  return matched ? Number(matched[1]) : 1;
}

function getRecordSortValue(record) {
  return [
    record?.periodSortKey || '',
    record?.updatedAt || '',
    record?.createdAt || '',
    record?.id || '',
  ].join('_');
}

function sortRecords(records = []) {
  return [...records].sort((left, right) => String(getRecordSortValue(right)).localeCompare(String(getRecordSortValue(left))));
}

function getStatusColor(status) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'IN_REVIEW':
      return 'processing';
    case 'SUPPLEMENT_REQUIRED':
    case 'APPEAL_PENDING':
      return 'warning';
    case 'REJECTED':
      return 'error';
    case 'APPEAL_RESOLVED':
      return 'purple';
    default:
      return 'default';
  }
}

function getRiskColor(riskLevel) {
  if (riskLevel === 'HIGH') return 'error';
  if (riskLevel === 'MEDIUM') return 'warning';
  return 'success';
}

function getRiskLabel(riskLevel) {
  if (riskLevel === 'HIGH') return '高关注';
  if (riskLevel === 'MEDIUM') return '持续关注';
  return '稳定推进';
}

function getToneColor(tone) {
  if (tone === 'danger') return 'error';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'processing';
}

function deriveRecordInsights(record, scheme) {
  if (!record || !scheme) {
    return {
      readiness: 0,
      averageCoverage: 0,
      pendingAiDrafts: 0,
      thresholdRiskCount: 0,
      weakEvidenceCount: 0,
      thresholdRiskItems: [],
    };
  }

  const evidenceItems = Array.isArray(record.evidenceItems) ? record.evidenceItems : [];
  const aiDrafts = Array.isArray(record.aiDrafts) ? record.aiDrafts : [];
  const pendingAiDrafts = aiDrafts.filter((item) => item.reviewStatus === 'PENDING_HUMAN').length;
  const averageCoverage = evidenceItems.length
    ? Math.round(evidenceItems.reduce((sum, item) => sum + (Number(item.coverage) || 0), 0) / evidenceItems.length)
    : 0;
  const weakEvidenceCount = evidenceItems.filter((item) => Number(item.coverage) < 80).length;
  const thresholdRiskItems = (scheme.itemRubrics || []).filter((rubric) => {
    const evidenceCount = evidenceItems.filter((item) => item.relatedItemName === rubric.itemName).length;
    return evidenceCount < parseMinimumEvidenceCount(rubric.evidenceThreshold);
  });

  const readiness = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (averageCoverage * 0.55)
        + (((scheme.itemRubrics.length - thresholdRiskItems.length) / Math.max(scheme.itemRubrics.length, 1)) * 30)
        + ((((aiDrafts.length - pendingAiDrafts) || 0) / Math.max(aiDrafts.length, 1)) * 15),
      ),
    ),
  );

  return {
    readiness,
    averageCoverage,
    pendingAiDrafts,
    thresholdRiskCount: thresholdRiskItems.length,
    weakEvidenceCount,
    thresholdRiskItems,
  };
}

function groupRecordsByPeriod(records = [], schemes = []) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const grouped = records.reduce((accumulator, record) => {
    const periodLabel = record.periodLabel || '未标注周期';
    if (!accumulator[periodLabel]) {
      accumulator[periodLabel] = [];
    }
    accumulator[periodLabel].push({
      record,
      scheme: schemeMap.get(record.schemeId) || null,
    });
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([periodLabel, items]) => ({
      periodLabel,
      periodSortKey: items[0]?.record?.periodSortKey || '',
      items: sortRecords(items.map((item) => item.record)).map((record) => ({
        record,
        scheme: schemeMap.get(record.schemeId) || null,
      })),
    }))
    .sort((left, right) => String(right.periodSortKey).localeCompare(String(left.periodSortKey)));
}

function inferRoleCandidateScore(teacher, candidate) {
  const teacherRoleText = `${teacher.roleName || ''} ${teacher.schoolName || ''}`.toLowerCase();
  const roleName = String(candidate.role?.name || '').toLowerCase();
  let score = 0;

  if (!roleName) return score;
  if (teacherRoleText.includes(roleName) || roleName.includes(teacherRoleText)) {
    score += 60;
  }
  if (candidate.role?.name === '职教教师' && /(专业教师|讲师|双师|职业)/.test(teacherRoleText)) {
    score += 40;
  }
  if (candidate.role?.name === '高校教师' && /(高校|大学|学院)/.test(teacherRoleText)) {
    score += 40;
  }
  if (candidate.role?.name === '基础教育教师' && /(小学|初中|高中|基础教育)/.test(teacherRoleText)) {
    score += 40;
  }
  if (candidate.roleLevel?.name === teacher.targetLevel) {
    score += 20;
  }

  return score;
}

function resolveTeacherHierarchy(teacher, teacherRecords, schemeMap, modelMap, roleMap, sequenceMap) {
  const mappedFromRecords = sortRecords(teacherRecords)
    .map((record) => {
      const scheme = schemeMap.get(record.schemeId);
      const model = scheme?.capabilityModelId ? modelMap.get(scheme.capabilityModelId) : null;
      const role = model?.roleId ? roleMap.get(model.roleId) : null;
      const sequence = role?.sequenceId ? sequenceMap.get(role.sequenceId) : null;
      const roleLevel = sequence?.levels?.find((item) => item.id === model?.roleLevelId) || null;
      if (!scheme?.capabilityModelId || !model || !role || !sequence || !roleLevel) {
        return null;
      }
      return {
        source: 'MODEL',
        scheme,
        model,
        role,
        sequence,
        roleLevel,
      };
    })
    .filter(Boolean);

  if (mappedFromRecords.length) {
    const latest = mappedFromRecords[0];
    return {
      sequenceId: latest.sequence.id,
      sequenceName: latest.sequence.name,
      sequenceSortNo: latest.sequence.sortNo || 0,
      roleId: latest.role.id,
      roleName: latest.role.name,
      roleLevelId: latest.roleLevel.id,
      roleLevelName: latest.roleLevel.name,
      roleLevelSortNo: latest.roleLevel.sortNo || 0,
      mappingSource: 'MODEL',
      hasMappedModel: true,
    };
  }

  const fallbackCandidates = [];
  roleMap.forEach((role) => {
    const sequence = sequenceMap.get(role.sequenceId);
    const roleLevel = sequence?.levels?.find((item) => item.name === teacher.targetLevel);
    if (sequence && roleLevel) {
      fallbackCandidates.push({
        role,
        sequence,
        roleLevel,
      });
    }
  });

  if (!fallbackCandidates.length) {
    return {
      sequenceId: '',
      sequenceName: '',
      sequenceSortNo: 999,
      roleId: '',
      roleName: '',
      roleLevelId: '',
      roleLevelName: teacher.targetLevel || '',
      roleLevelSortNo: 999,
      mappingSource: teacherRecords.length ? 'UNMAPPED_RECORDS' : 'UNMAPPED_PROFILE',
      hasMappedModel: false,
    };
  }

  const bestCandidate = fallbackCandidates
    .map((candidate) => ({
      ...candidate,
      score: inferRoleCandidateScore(teacher, candidate),
    }))
    .sort((left, right) => right.score - left.score || (left.sequence.sortNo || 0) - (right.sequence.sortNo || 0))[0];

  return {
    sequenceId: bestCandidate.sequence.id,
    sequenceName: bestCandidate.sequence.name,
    sequenceSortNo: bestCandidate.sequence.sortNo || 0,
    roleId: bestCandidate.role.id,
    roleName: bestCandidate.role.name,
    roleLevelId: bestCandidate.roleLevel.id,
    roleLevelName: bestCandidate.roleLevel.name,
    roleLevelSortNo: bestCandidate.roleLevel.sortNo || 0,
    mappingSource: 'PROFILE',
    hasMappedModel: false,
  };
}

function createRoleSuggestion(managerRole, summary) {
  if (managerRole === 'GROUP_LEADER') {
    if (summary.supplementRequiredCount) {
      return `优先安排组内补证辅导，补齐 ${summary.focusItems[0] || '关键评价项'} 的过程证据。`;
    }
    if (summary.riskLevel === 'LOW') {
      return '可将其纳入同伴互助或示范课带教对象，放大组内辐射效应。';
    }
    return '建议围绕近期评审节点组织一次针对性磨课或量规校准。';
  }
  if (managerRole === 'ENTERPRISE_MENTOR') {
    if (summary.totalRecords === 0) {
      return '优先补齐企业实践或项目转化记录，建立企业导师可复核的第一轮证据包。';
    }
    return `重点核验 ${summary.focusItems[0] || '企业项目融入'} 的岗位任务真实性，并补充企业反馈。`;
  }
  if (managerRole === 'SCHOOL_REVIEW') {
    if (summary.appealCount) {
      return '该教师存在申诉事项，建议先完成复核意见，再进入结果确认。';
    }
    if (summary.riskLevel === 'HIGH') {
      return '建议在校级评审前先完成缺证核验，避免直接进入结论认定。';
    }
    return '可作为本周期较稳定个体纳入校级认定或梯队观察名单。';
  }
  if (summary.totalRecords === 0) {
    return '先建立本周期基线评价，再根据证据覆盖决定后续培养动作。';
  }
  if (summary.supplementRequiredCount) {
    return '当前存在待补证实例，建议作为近期督办重点。';
  }
  if (summary.riskLevel === 'LOW') {
    return '建议纳入骨干成长池或承担示范任务，形成组织内示范输出。';
  }
  return '建议结合当前实例的低覆盖评价项安排专项改进和跟踪复盘。';
}

function buildTeacherSummaries(teachers, records, schemes, models, roles, sequences, managerRole) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const modelMap = new Map(models.map((item) => [item.id, item]));
  const roleMap = new Map(roles.map((item) => [item.id, item]));
  const sequenceMap = new Map(sequences.map((item) => [item.id, item]));

  return teachers.map((teacher) => {
    const teacherRecords = sortRecords(records.filter((item) => item.teacherId === teacher.teacherId));
    const recordInsights = teacherRecords.map((record) => ({
      record,
      scheme: schemeMap.get(record.schemeId) || null,
      insights: deriveRecordInsights(record, schemeMap.get(record.schemeId) || null),
    }));
    const hierarchy = resolveTeacherHierarchy(teacher, teacherRecords, schemeMap, modelMap, roleMap, sequenceMap);
    const latest = recordInsights[0] || null;
    const periodCount = new Set(teacherRecords.map((item) => item.periodLabel).filter(Boolean)).size;
    const totalRecords = teacherRecords.length;
    const approvedCount = teacherRecords.filter((item) => item.status === 'APPROVED').length;
    const inReviewCount = teacherRecords.filter((item) => item.status === 'IN_REVIEW').length;
    const supplementRequiredCount = teacherRecords.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length;
    const rejectedCount = teacherRecords.filter((item) => item.status === 'REJECTED').length;
    const appealCount = teacherRecords.filter((item) => ['APPEAL_PENDING', 'APPEAL_RESOLVED'].includes(item.status)).length;
    const pendingAiDrafts = recordInsights.reduce((sum, item) => sum + item.insights.pendingAiDrafts, 0);
    const averageCoverage = totalRecords
      ? Math.round(recordInsights.reduce((sum, item) => sum + item.insights.averageCoverage, 0) / totalRecords)
      : 0;
    const averageReadiness = totalRecords
      ? Math.round(recordInsights.reduce((sum, item) => sum + item.insights.readiness, 0) / totalRecords)
      : 0;
    const thresholdRiskCount = recordInsights.reduce((sum, item) => sum + item.insights.thresholdRiskCount, 0);
    const weakEvidenceCount = recordInsights.reduce((sum, item) => sum + item.insights.weakEvidenceCount, 0);
    const focusItems = Array.from(new Set(recordInsights.flatMap((item) => item.insights.thresholdRiskItems.map((riskItem) => riskItem.itemName)))).slice(0, 4);
    const riskReasons = [];

    if (!totalRecords) {
      riskReasons.push('尚未形成正式评价基线');
    }
    if (!hierarchy.sequenceId) {
      riskReasons.push('当前未映射到能力序列，暂不能进入序列梯队统计');
    }
    if (supplementRequiredCount) {
      riskReasons.push(`存在 ${supplementRequiredCount} 个待补证实例`);
    }
    if (rejectedCount) {
      riskReasons.push(`存在 ${rejectedCount} 个未通过实例`);
    }
    if (averageCoverage > 0 && averageCoverage < 75) {
      riskReasons.push(`平均证据覆盖仅 ${averageCoverage}%`);
    }
    if (pendingAiDrafts) {
      riskReasons.push(`仍有 ${pendingAiDrafts} 份 AI 建议稿待确认`);
    }
    if (thresholdRiskCount) {
      riskReasons.push(`仍有 ${thresholdRiskCount} 个评价项未达证据门槛`);
    }
    if (appealCount) {
      riskReasons.push(`存在 ${appealCount} 个申诉相关实例`);
    }

    let riskLevel = 'LOW';
    if (!totalRecords || !hierarchy.sequenceId || supplementRequiredCount || rejectedCount || (averageCoverage > 0 && averageCoverage < 75)) {
      riskLevel = 'HIGH';
    } else if (inReviewCount || pendingAiDrafts || thresholdRiskCount || weakEvidenceCount || appealCount) {
      riskLevel = 'MEDIUM';
    }

    const highlights = [];
    if (approvedCount >= 2 && averageCoverage >= 85) {
      highlights.push('跨周期表现稳定，可纳入骨干培养或带教序列');
    }
    if (latest?.record?.status === 'APPROVED' && latest.insights.readiness >= 85) {
      highlights.push('最近一轮评价完成度较高');
    }
    if (hierarchy.sequenceId && totalRecords) {
      highlights.push(`已进入 ${hierarchy.sequenceName} / ${hierarchy.roleLevelName} 梯队观察视图`);
    }
    if (!highlights.length && totalRecords) {
      highlights.push('已形成基本评价链路，可持续跟踪成长趋势');
    }

    const suggestions = [];
    if (!totalRecords) {
      suggestions.push('尽快发起本周期首轮评价实例，建立教师发展基线。');
    }
    if (!hierarchy.sequenceId) {
      suggestions.push('优先将方案与能力模型关联，明确教师所属序列和等级口径。');
    }
    if (supplementRequiredCount) {
      suggestions.push('优先处理待补证实例，先补齐关键门槛项再推进复核。');
    }
    if (averageCoverage > 0 && averageCoverage < 80) {
      suggestions.push('针对低覆盖评价项补充过程性证据，避免只保留结果性材料。');
    }
    if (pendingAiDrafts) {
      suggestions.push('安排人工确认 AI 建议稿，避免评审环节因待确认草稿滞留。');
    }
    if (approvedCount >= 2 && averageCoverage >= 85) {
      suggestions.push('可纳入示范教师、骨干培养或带教任务池。');
    }
    suggestions.push(createRoleSuggestion(managerRole, {
      totalRecords,
      supplementRequiredCount,
      riskLevel,
      focusItems,
      appealCount,
    }));

    return {
      ...teacher,
      records: teacherRecords,
      periodGroups: groupRecordsByPeriod(teacherRecords, schemes),
      totalRecords,
      periodCount,
      approvedCount,
      inReviewCount,
      supplementRequiredCount,
      rejectedCount,
      appealCount,
      pendingAiDrafts,
      averageCoverage,
      averageReadiness,
      thresholdRiskCount,
      weakEvidenceCount,
      latestRecord: latest?.record || null,
      latestScheme: latest?.scheme || null,
      latestStatus: latest?.record?.status || '',
      latestPeriodLabel: latest?.record?.periodLabel || '-',
      riskLevel,
      riskReasons: riskReasons.slice(0, 4),
      focusItems,
      highlights: highlights.slice(0, 3),
      suggestions: Array.from(new Set(suggestions.filter(Boolean))).slice(0, 4),
      ...hierarchy,
    };
  }).sort((left, right) => {
    if (left.riskLevel !== right.riskLevel) {
      return ['HIGH', 'MEDIUM', 'LOW'].indexOf(left.riskLevel) - ['HIGH', 'MEDIUM', 'LOW'].indexOf(right.riskLevel);
    }
    if (left.sequenceSortNo !== right.sequenceSortNo) {
      return left.sequenceSortNo - right.sequenceSortNo;
    }
    if (left.roleLevelSortNo !== right.roleLevelSortNo) {
      return left.roleLevelSortNo - right.roleLevelSortNo;
    }
    return String(right.latestPeriodLabel || '').localeCompare(String(left.latestPeriodLabel || ''));
  });
}

function buildDepartmentSummaries(teacherSummaries) {
  const grouped = teacherSummaries.reduce((accumulator, summary) => {
    const key = summary.departmentName || '未分组';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(summary);
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([departmentName, items]) => {
    const teacherCount = items.length;
    const highRiskCount = items.filter((item) => item.riskLevel === 'HIGH').length;
    const noBaselineCount = items.filter((item) => !item.totalRecords).length;
    const averageCoverage = teacherCount
      ? Math.round(items.reduce((sum, item) => sum + item.averageCoverage, 0) / teacherCount)
      : 0;
    const approvedTeacherCount = items.filter((item) => item.approvedCount > 0).length;
    const focusItems = Array.from(new Set(items.flatMap((item) => item.focusItems))).slice(0, 4);
    const sequenceNames = Array.from(new Set(items.map((item) => item.sequenceName).filter(Boolean))).slice(0, 4);

    return {
      key: departmentName,
      departmentName,
      teacherCount,
      highRiskCount,
      noBaselineCount,
      averageCoverage,
      approvedTeacherCount,
      focusItems,
      sequenceNames,
      teacherNames: items.map((item) => item.name).slice(0, 5),
    };
  }).sort((left, right) => {
    if (left.highRiskCount !== right.highRiskCount) return right.highRiskCount - left.highRiskCount;
    return left.averageCoverage - right.averageCoverage;
  });
}

function buildPeriodSummaries(records, schemes) {
  const schemeMap = new Map(schemes.map((item) => [item.id, item]));
  const grouped = records.reduce((accumulator, record) => {
    const key = record.periodLabel || '未标注周期';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(record);
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([periodLabel, items]) => {
    const insights = items.map((record) => deriveRecordInsights(record, schemeMap.get(record.schemeId) || null));
    const averageCoverage = items.length
      ? Math.round(insights.reduce((sum, item) => sum + item.averageCoverage, 0) / items.length)
      : 0;

    return {
      key: periodLabel,
      periodLabel,
      periodSortKey: items[0]?.periodSortKey || '',
      recordCount: items.length,
      teacherCount: new Set(items.map((item) => item.teacherId)).size,
      schemeCount: new Set(items.map((item) => item.schemeId)).size,
      inReviewCount: items.filter((item) => item.status === 'IN_REVIEW').length,
      supplementCount: items.filter((item) => item.status === 'SUPPLEMENT_REQUIRED').length,
      approvedCount: items.filter((item) => item.status === 'APPROVED').length,
      rejectedCount: items.filter((item) => item.status === 'REJECTED').length,
      pendingAiDrafts: items.reduce((sum, item) => sum + (item.aiDrafts || []).filter((draft) => draft.reviewStatus === 'PENDING_HUMAN').length, 0),
      averageCoverage,
      schemeNames: Array.from(new Set(items.map((item) => item.schemeNameSnapshot || schemeMap.get(item.schemeId)?.name).filter(Boolean))).slice(0, 4),
    };
  }).sort((left, right) => String(right.periodSortKey).localeCompare(String(left.periodSortKey)));
}

function buildModelUsage(models, schemes, records, roles, sequences) {
  const roleMap = new Map(roles.map((item) => [item.id, item]));
  const sequenceMap = new Map(sequences.map((item) => [item.id, item]));

  return models.map((model) => {
    const relatedSchemes = schemes.filter((scheme) => scheme.capabilityModelId === model.id);
    const relatedSchemeIds = new Set(relatedSchemes.map((item) => item.id));
    const relatedRecords = records.filter((record) => relatedSchemeIds.has(record.schemeId));
    const role = roleMap.get(model.roleId);
    const sequence = role?.sequenceId ? sequenceMap.get(role.sequenceId) : null;
    const level = sequence?.levels?.find((item) => item.id === model.roleLevelId) || null;

    return {
      key: model.id,
      name: model.name,
      status: model.status,
      schemeCount: relatedSchemes.length,
      recordCount: relatedRecords.length,
      roleName: role?.name || '-',
      sequenceName: sequence?.name || '-',
      roleLevelName: level?.name || '-',
      dimensionCount: model.dimensions?.length || 0,
    };
  }).sort((left, right) => right.recordCount - left.recordCount);
}

function buildSequenceSummaries(teacherSummaries, sequences) {
  const grouped = teacherSummaries.reduce((accumulator, summary) => {
    if (!summary.sequenceId) {
      return accumulator;
    }
    if (!accumulator[summary.sequenceId]) {
      accumulator[summary.sequenceId] = [];
    }
    accumulator[summary.sequenceId].push(summary);
    return accumulator;
  }, {});

  return sequences
    .filter((sequence) => sequence.status === 'ACTIVE')
    .map((sequence) => {
      const items = grouped[sequence.id] || [];
      const teacherCount = items.length;
      const levelCount = new Set(items.map((item) => item.roleLevelId).filter(Boolean)).size;
      const highRiskCount = items.filter((item) => item.riskLevel === 'HIGH').length;
      const noBaselineCount = items.filter((item) => !item.totalRecords).length;
      const supplementCount = items.reduce((sum, item) => sum + item.supplementRequiredCount, 0);
      const approvedTeacherCount = items.filter((item) => item.approvedCount > 0).length;
      const averageCoverage = teacherCount
        ? Math.round(items.reduce((sum, item) => sum + item.averageCoverage, 0) / teacherCount)
        : 0;
      const baselineTeacherCount = items.filter((item) => item.totalRecords > 0).length;
      const mentorCandidateCount = items.filter((item) => item.riskLevel === 'LOW' && item.approvedCount > 0).length;
      const focusItems = Array.from(new Set(items.flatMap((item) => item.focusItems))).slice(0, 4);
      const levelSummaries = (sequence.levels || [])
        .map((level) => {
          const matchedTeachers = items.filter((item) => item.roleLevelId === level.id);
          const recordCount = matchedTeachers.reduce((sum, item) => sum + item.totalRecords, 0);
          const approvedCount = matchedTeachers.reduce((sum, item) => sum + item.approvedCount, 0);
          const supplementRequiredCount = matchedTeachers.reduce((sum, item) => sum + item.supplementRequiredCount, 0);
          const averageLevelCoverage = matchedTeachers.length
            ? Math.round(matchedTeachers.reduce((sum, item) => sum + item.averageCoverage, 0) / matchedTeachers.length)
            : 0;
          return {
            key: `${sequence.id}_${level.id}`,
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            roleLevelId: level.id,
            roleLevelName: level.name,
            roleLevelSortNo: level.sortNo || 0,
            teacherCount: matchedTeachers.length,
            recordCount,
            highRiskCount: matchedTeachers.filter((item) => item.riskLevel === 'HIGH').length,
            noBaselineCount: matchedTeachers.filter((item) => !item.totalRecords).length,
            supplementRequiredCount,
            approvedCount,
            averageCoverage: averageLevelCoverage,
            focusItems: Array.from(new Set(matchedTeachers.flatMap((item) => item.focusItems))).slice(0, 4),
            teacherSummaries: matchedTeachers,
          };
        })
        .filter((item) => item.teacherCount || items.length);

      const recommendations = [];
      if (noBaselineCount) {
        recommendations.push(`该序列仍有 ${noBaselineCount} 位教师未形成首轮评价基线，应优先补齐基础评价。`);
      }
      if (highRiskCount || supplementCount) {
        recommendations.push(`该序列当前有 ${highRiskCount} 位高关注教师、${supplementCount} 个待补证实例，建议优先做短板整改。`);
      }
      if (mentorCandidateCount) {
        recommendations.push(`已有 ${mentorCandidateCount} 位教师可纳入骨干培养、示范输出或带教任务池。`);
      }
      if (!recommendations.length) {
        recommendations.push('该序列整体推进平稳，可持续跟踪跨周期表现并优化梯队结构。');
      }

      return {
        key: sequence.id,
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        sequenceDescription: sequence.description,
        sequenceSortNo: sequence.sortNo || 0,
        teacherCount,
        levelCount,
        highRiskCount,
        noBaselineCount,
        supplementCount,
        approvedTeacherCount,
        averageCoverage,
        baselineTeacherCount,
        mentorCandidateCount,
        focusItems,
        teacherSummaries: items,
        levelSummaries,
        recommendations,
      };
    })
    .filter((item) => item.teacherCount || item.levelSummaries.length)
    .sort((left, right) => left.sequenceSortNo - right.sequenceSortNo);
}

function buildSequenceDistribution(departmentSummaries) {
  const grouped = departmentSummaries.reduce((accumulator, department) => {
    department.sequenceNames.forEach((sequenceName) => {
      if (!accumulator[sequenceName]) {
        accumulator[sequenceName] = {
          key: sequenceName,
          sequenceName,
          departmentCount: 0,
          teacherCount: 0,
          highRiskCount: 0,
          averageCoverageTotal: 0,
        };
      }
      accumulator[sequenceName].departmentCount += 1;
      accumulator[sequenceName].teacherCount += department.teacherCount;
      accumulator[sequenceName].highRiskCount += department.highRiskCount;
      accumulator[sequenceName].averageCoverageTotal += department.averageCoverage;
    });
    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      averageCoverage: item.departmentCount ? Math.round(item.averageCoverageTotal / item.departmentCount) : 0,
    }))
    .sort((left, right) => right.teacherCount - left.teacherCount);
}

function buildManagerSuggestions(managerRole, teacherSummaries, departmentSummaries, periodSummaries, sequenceSummaries) {
  const suggestions = [];
  const highRiskTeachers = teacherSummaries.filter((item) => item.riskLevel === 'HIGH');
  const mentorPool = teacherSummaries.filter((item) => item.riskLevel === 'LOW' && item.approvedCount >= 1).slice(0, 5);
  const weakestDepartments = departmentSummaries.filter((item) => item.highRiskCount > 0).slice(0, 3);
  const sequenceBottlenecks = sequenceSummaries.filter((item) => item.highRiskCount || item.noBaselineCount).slice(0, 3);
  const currentPeriod = periodSummaries[0] || null;
  const totalPendingAiDrafts = teacherSummaries.reduce((sum, item) => sum + item.pendingAiDrafts, 0);

  if (currentPeriod?.supplementCount) {
    suggestions.push({
      key: 'supplement',
      tone: 'warning',
      title: `优先清理 ${currentPeriod.periodLabel} 的待补证实例`,
      description: `当前周期仍有 ${currentPeriod.supplementCount} 个实例待补证，建议先围绕门槛项和低覆盖证据组织补充，再进入后续复核。`,
      tags: [currentPeriod.periodLabel, `${currentPeriod.supplementCount} 个待补证`],
    });
  }

  if (highRiskTeachers.length) {
    suggestions.push({
      key: 'teacher-focus',
      tone: 'danger',
      title: `对 ${highRiskTeachers.length} 位高关注教师建立跟踪清单`,
      description: `优先关注 ${highRiskTeachers.slice(0, 3).map((item) => item.name).join('、')} 等教师，按“缺证项-责任人-完成时间”推进闭环。`,
      tags: highRiskTeachers.slice(0, 3).map((item) => item.departmentName),
    });
  }

  if (weakestDepartments.length) {
    suggestions.push({
      key: 'department-focus',
      tone: 'default',
      title: `部门画像显示 ${weakestDepartments[0].departmentName} 等教研组压力较大`,
      description: `建议优先对 ${weakestDepartments.map((item) => item.departmentName).join('、')} 做周期推进复盘，明确是缺基线、缺补证还是评审积压。`,
      tags: weakestDepartments.map((item) => `${item.highRiskCount} 位高关注`),
    });
  }

  if (sequenceBottlenecks.length) {
    suggestions.push({
      key: 'sequence-focus',
      tone: 'warning',
      title: `序列观察显示 ${sequenceBottlenecks[0].sequenceName} 等梯队需重点治理`,
      description: `建议优先处理 ${sequenceBottlenecks.map((item) => item.sequenceName).join('、')} 的基线缺口与待补证问题，避免梯队断层。`,
      tags: sequenceBottlenecks.map((item) => `${item.highRiskCount} 位高关注`).slice(0, 3),
    });
  }

  if (mentorPool.length) {
    suggestions.push({
      key: 'mentor',
      tone: 'success',
      title: '组织内已有可承担示范或带教任务的教师梯队',
      description: `${mentorPool.map((item) => item.name).join('、')} 的跨周期表现较稳定，可用于示范课、同行带教或项目共创。`,
      tags: mentorPool.map((item) => item.sequenceName || item.latestPeriodLabel).slice(0, 3),
    });
  }

  if (totalPendingAiDrafts) {
    suggestions.push({
      key: 'ai-pending',
      tone: 'processing',
      title: `仍有 ${totalPendingAiDrafts} 份 AI 建议稿待人工确认`,
      description: '建议安排当前周期统一确认 AI 建议稿，避免因为建议稿待确认导致流程与证据包脱节。',
      tags: ['AI 辅助', '人工确认'],
    });
  }

  if (managerRole === 'GROUP_LEADER') {
    suggestions.push({
      key: 'group-leader',
      tone: 'processing',
      title: '教研组长应重点抓组内节奏和序列梯队连续性',
      description: '建议把管理重点放在组内初审前移、同伴互助和同序列不同等级教师的带教关系上。',
      tags: ['组内初审', '梯队带教'],
    });
  } else if (managerRole === 'ENTERPRISE_MENTOR') {
    suggestions.push({
      key: 'enterprise',
      tone: 'processing',
      title: '企业导师应优先补强企业项目与岗位任务证据',
      description: '建议围绕岗位任务转化、企业反馈和项目真实性补充意见，并观察双师型梯队的持续发展情况。',
      tags: ['企业实践', '岗位任务'],
    });
  } else if (managerRole === 'SCHOOL_REVIEW') {
    suggestions.push({
      key: 'school-review',
      tone: 'processing',
      title: '校级评审组应优先看门槛满足度和序列梯队结构',
      description: '建议在校级阶段同时核验门槛项、申诉链路和不同序列等级之间的梯队完整性，不直接以系统建议代替结论。',
      tags: ['复核', '梯队治理'],
    });
  } else {
    suggestions.push({
      key: 'supervisor',
      tone: 'processing',
      title: '教学管理者应同时看推进效率、成长质量与序列结构',
      description: '建议按周期看推进瓶颈，按教师看连续成长，按序列看梯队健康度，用同一套证据底座支撑督导、培养和认定。',
      tags: ['周期治理', '序列观察'],
    });
  }

  return suggestions.slice(0, 6);
}

function buildSequenceDrawerData(sequenceSummary, roleLevelId = '') {
  if (!sequenceSummary) return null;
  if (!roleLevelId) {
    return {
      scopeType: 'sequence',
      title: `${sequenceSummary.sequenceName} · 梯队详情`,
      description: sequenceSummary.sequenceDescription || '查看该序列下不同等级教师的整体结构、风险分布与梯队建议。',
      stats: [
        { label: '覆盖教师', value: sequenceSummary.teacherCount },
        { label: '已建基线', value: sequenceSummary.baselineTeacherCount },
        { label: '高关注教师', value: sequenceSummary.highRiskCount },
        { label: '平均覆盖', value: `${sequenceSummary.averageCoverage}%` },
      ],
      tags: sequenceSummary.focusItems,
      recommendations: sequenceSummary.recommendations,
      teachers: sequenceSummary.teacherSummaries,
    };
  }

  const levelSummary = sequenceSummary.levelSummaries.find((item) => item.roleLevelId === roleLevelId);
  if (!levelSummary) return null;
  const recommendations = [];
  if (levelSummary.noBaselineCount) {
    recommendations.push(`该等级仍有 ${levelSummary.noBaselineCount} 位教师未形成评价基线，应优先补齐首轮评价。`);
  }
  if (levelSummary.highRiskCount || levelSummary.supplementRequiredCount) {
    recommendations.push(`该等级当前有 ${levelSummary.highRiskCount} 位高关注教师，${levelSummary.supplementRequiredCount} 个待补证实例。`);
  }
  if (levelSummary.approvedCount && levelSummary.averageCoverage >= 85) {
    recommendations.push('该等级已有较稳定个体，可纳入带教或骨干培养对象。');
  }
  if (!recommendations.length) {
    recommendations.push('该等级当前推进平稳，建议持续跟踪跨周期变化。');
  }

  return {
    scopeType: 'level',
    title: `${sequenceSummary.sequenceName} / ${levelSummary.roleLevelName}`,
    description: '查看当前序列等级下教师分布、实例推进和重点教师名单。',
    stats: [
      { label: '教师数', value: levelSummary.teacherCount },
      { label: '实例数', value: levelSummary.recordCount },
      { label: '高关注', value: levelSummary.highRiskCount },
      { label: '平均覆盖', value: `${levelSummary.averageCoverage}%` },
    ],
    tags: levelSummary.focusItems,
    recommendations,
    teachers: levelSummary.teacherSummaries,
  };
}

export default function TeacherDevelopmentModule() {
  const [loading, setLoading] = useState(true);
  const [teacherProfiles, setTeacherProfiles] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [records, setRecords] = useState([]);
  const [models, setModels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [managerRole, setManagerRole] = useState('SUPERVISOR');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sequenceFilter, setSequenceFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  const [sequenceDrawerState, setSequenceDrawerState] = useState({ open: false, sequenceId: '', roleLevelId: '' });

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      await Promise.all([
        teacherEvaluationApi.seed(),
        capabilityModelApi.seed(),
      ]);
      const [nextTeachers, nextSchemes, nextRecords, nextModels, nextRoles, nextSequences] = await Promise.all([
        teacherEvaluationApi.listTeachers(),
        teacherEvaluationApi.listSchemes(),
        teacherEvaluationApi.listRecords(),
        capabilityModelApi.listModels(),
        capabilityModelApi.listRoles(),
        capabilityModelApi.listSequences(),
      ]);
      setTeacherProfiles(nextTeachers);
      setSchemes(nextSchemes);
      setRecords(nextRecords);
      setModels(nextModels);
      setRoles(nextRoles);
      setSequences(nextSequences);
    } catch (error) {
      message.error(error?.message || '加载教师发展数据失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    const teacherEventName = teacherEvaluationApi.getStoreEventName();
    const capabilityEventName = getCapabilityModelStoreEventName();
    const handleStoreChange = () => {
      loadData(false);
    };
    window.addEventListener(teacherEventName, handleStoreChange);
    window.addEventListener(capabilityEventName, handleStoreChange);
    return () => {
      window.removeEventListener(teacherEventName, handleStoreChange);
      window.removeEventListener(capabilityEventName, handleStoreChange);
    };
  }, [loadData]);

  const periodOptions = useMemo(() => {
    const optionMap = new Map();
    sortRecords(records).forEach((record) => {
      const key = record.periodLabel || '未标注周期';
      if (!optionMap.has(key)) {
        optionMap.set(key, { label: key, value: key });
      }
    });
    return [{ label: '全部周期', value: 'ALL' }, ...optionMap.values()];
  }, [records]);

  const departmentOptions = useMemo(() => {
    const values = Array.from(new Set(teacherProfiles.map((item) => item.departmentName).filter(Boolean)));
    return [{ label: '全部部门', value: 'ALL' }, ...values.map((item) => ({ label: item, value: item }))];
  }, [teacherProfiles]);

  const scopedRecords = useMemo(() => {
    if (periodFilter === 'ALL') return records;
    return records.filter((item) => item.periodLabel === periodFilter);
  }, [periodFilter, records]);

  const teacherSummaries = useMemo(
    () => buildTeacherSummaries(teacherProfiles, scopedRecords, schemes, models, roles, sequences, managerRole),
    [teacherProfiles, scopedRecords, schemes, models, roles, sequences, managerRole],
  );

  const roleOptions = useMemo(() => {
    const values = Array.from(new Set(teacherSummaries.map((item) => JSON.stringify({ value: item.roleId, label: item.roleName })).filter(Boolean)));
    return [
      { label: '全部岗位', value: 'ALL' },
      ...values.map((item) => JSON.parse(item)).filter((item) => item.value),
    ];
  }, [teacherSummaries]);

  const sequenceOptions = useMemo(() => {
    const activeIds = new Set(teacherSummaries.map((item) => item.sequenceId).filter(Boolean));
    return [
      { label: '全部序列', value: 'ALL' },
      ...sequences
        .filter((item) => item.status === 'ACTIVE' && activeIds.has(item.id))
        .sort((left, right) => (left.sortNo || 0) - (right.sortNo || 0))
        .map((item) => ({ label: item.name, value: item.id })),
    ];
  }, [sequences, teacherSummaries]);

  const levelOptions = useMemo(() => {
    if (sequenceFilter !== 'ALL') {
      const matchedSequence = sequences.find((item) => item.id === sequenceFilter);
      return [
        { label: '全部等级', value: 'ALL' },
        ...((matchedSequence?.levels || []).map((item) => ({ label: item.name, value: item.id }))),
      ];
    }

    const values = Array.from(new Set(teacherSummaries.map((item) => JSON.stringify({ value: item.roleLevelId, label: item.sequenceName ? `${item.sequenceName} / ${item.roleLevelName}` : item.roleLevelName })).filter(Boolean)));
    return [
      { label: '全部等级', value: 'ALL' },
      ...values.map((item) => JSON.parse(item)).filter((item) => item.value),
    ];
  }, [sequenceFilter, sequences, teacherSummaries]);

  const filteredTeacherSummaries = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return teacherSummaries.filter((item) => {
      if (departmentFilter !== 'ALL' && item.departmentName !== departmentFilter) return false;
      if (roleFilter !== 'ALL' && item.roleId !== roleFilter) return false;
      if (sequenceFilter !== 'ALL' && item.sequenceId !== sequenceFilter) return false;
      if (levelFilter !== 'ALL' && item.roleLevelId !== levelFilter) return false;
      if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) return false;
      if (!normalizedKeyword) return true;
      const haystack = `${item.name} ${item.departmentName} ${item.roleName} ${item.roleLevelName} ${item.sequenceName} ${item.targetLevel}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [departmentFilter, keyword, levelFilter, riskFilter, roleFilter, sequenceFilter, teacherSummaries]);

  const departmentSummaries = useMemo(() => buildDepartmentSummaries(filteredTeacherSummaries), [filteredTeacherSummaries]);
  const periodSummaries = useMemo(() => buildPeriodSummaries(scopedRecords, schemes), [scopedRecords, schemes]);
  const sequenceSummaries = useMemo(() => buildSequenceSummaries(filteredTeacherSummaries, sequences), [filteredTeacherSummaries, sequences]);
  const sequenceDistribution = useMemo(() => buildSequenceDistribution(departmentSummaries), [departmentSummaries]);
  const modelUsage = useMemo(() => buildModelUsage(models, schemes, records, roles, sequences), [models, schemes, records, roles, sequences]);
  const overallSuggestions = useMemo(
    () => buildManagerSuggestions(managerRole, filteredTeacherSummaries, departmentSummaries, periodSummaries, sequenceSummaries),
    [departmentSummaries, filteredTeacherSummaries, managerRole, periodSummaries, sequenceSummaries],
  );

  const selectedTeacherSummary = useMemo(
    () => filteredTeacherSummaries.find((item) => item.teacherId === selectedTeacherId) || filteredTeacherSummaries[0] || null,
    [filteredTeacherSummaries, selectedTeacherId],
  );

  const selectedSequenceSummary = useMemo(
    () => sequenceSummaries.find((item) => item.sequenceId === selectedSequenceId) || sequenceSummaries[0] || null,
    [selectedSequenceId, sequenceSummaries],
  );

  const sequenceDrawerData = useMemo(
    () => buildSequenceDrawerData(sequenceSummaries.find((item) => item.sequenceId === sequenceDrawerState.sequenceId) || null, sequenceDrawerState.roleLevelId),
    [sequenceDrawerState, sequenceSummaries],
  );

  const sequenceUnmappedTeacherCount = useMemo(
    () => filteredTeacherSummaries.filter((item) => !item.sequenceId).length,
    [filteredTeacherSummaries],
  );

  const schemeMap = useMemo(() => new Map(schemes.map((item) => [item.id, item])), [schemes]);
  const modelMap = useMemo(() => new Map(models.map((item) => [item.id, item])), [models]);

  const unmappedRecordCount = useMemo(() => scopedRecords.filter((record) => {
    const scheme = schemeMap.get(record.schemeId);
    return !scheme?.capabilityModelId || !modelMap.get(scheme.capabilityModelId);
  }).length, [modelMap, schemeMap, scopedRecords]);

  useEffect(() => {
    if (!filteredTeacherSummaries.length) {
      setSelectedTeacherId('');
      setDetailOpen(false);
      return;
    }
    if (!filteredTeacherSummaries.some((item) => item.teacherId === selectedTeacherId)) {
      setSelectedTeacherId(filteredTeacherSummaries[0].teacherId);
    }
  }, [filteredTeacherSummaries, selectedTeacherId]);

  useEffect(() => {
    if (!sequenceSummaries.length) {
      setSelectedSequenceId('');
      setSequenceDrawerState({ open: false, sequenceId: '', roleLevelId: '' });
      return;
    }
    if (!sequenceSummaries.some((item) => item.sequenceId === selectedSequenceId)) {
      setSelectedSequenceId(sequenceSummaries[0].sequenceId);
    }
  }, [selectedSequenceId, sequenceSummaries]);

  useEffect(() => {
    if (levelFilter !== 'ALL' && !levelOptions.some((item) => item.value === levelFilter)) {
      setLevelFilter('ALL');
    }
  }, [levelFilter, levelOptions]);

  const summaryMetrics = useMemo(() => {
    const teacherCount = filteredTeacherSummaries.length;
    const highRiskCount = filteredTeacherSummaries.filter((item) => item.riskLevel === 'HIGH').length;
    const averageCoverage = teacherCount
      ? Math.round(filteredTeacherSummaries.reduce((sum, item) => sum + item.averageCoverage, 0) / teacherCount)
      : 0;
    const inReviewCount = filteredTeacherSummaries.reduce((sum, item) => sum + item.inReviewCount, 0);
    const supplementCount = filteredTeacherSummaries.reduce((sum, item) => sum + item.supplementRequiredCount, 0);
    const pendingAiDrafts = filteredTeacherSummaries.reduce((sum, item) => sum + item.pendingAiDrafts, 0);
    const publishedModelCount = models.filter((item) => item.status === 'PUBLISHED').length;
    return {
      teacherCount,
      highRiskCount,
      averageCoverage,
      inReviewCount,
      supplementCount,
      pendingAiDrafts,
      publishedModelCount,
      sequenceCount: new Set(filteredTeacherSummaries.map((item) => item.sequenceId).filter(Boolean)).size,
    };
  }, [filteredTeacherSummaries, models]);

  const teacherColumns = useMemo(() => [
    {
      title: '教师',
      dataIndex: 'name',
      key: 'name',
      render: (_, item) => (
        <div className="teacher-development-teacher-cell">
          <strong>{item.name}</strong>
          <span>{item.departmentName}</span>
        </div>
      ),
    },
    {
      title: '岗位 / 序列等级',
      key: 'role',
      render: (_, item) => (
        <div className="teacher-development-teacher-cell">
          <span>{item.roleName || item.roleName === '' ? item.roleName : item.roleName}</span>
          <span>{item.sequenceName ? `${item.sequenceName} / ${item.roleLevelName}` : item.targetLevel}</span>
        </div>
      ),
    },
    {
      title: '周期进展',
      key: 'period',
      render: (_, item) => (
        <div className="teacher-development-teacher-cell">
          <span>{item.latestPeriodLabel}</span>
          <span>{item.periodCount} 个周期 / {item.totalRecords} 个实例</span>
        </div>
      ),
    },
    {
      title: '证据覆盖',
      key: 'coverage',
      render: (_, item) => (
        <div className="teacher-development-progress-cell">
          <Progress percent={item.averageCoverage} size="small" strokeColor={item.averageCoverage >= 85 ? '#52c41a' : item.averageCoverage >= 75 ? '#1677ff' : '#fa8c16'} />
          <span>{item.averageCoverage}% / 就绪 {item.averageReadiness}%</span>
        </div>
      ),
    },
    {
      title: '风险',
      key: 'risk',
      render: (_, item) => <Tag color={getRiskColor(item.riskLevel)}>{getRiskLabel(item.riskLevel)}</Tag>,
    },
    {
      title: '当前重点',
      key: 'focus',
      render: (_, item) => (
        <div className="teacher-development-tag-wrap">
          {(item.focusItems.length ? item.focusItems : ['暂无重点项']).map((focus) => (
            <Tag key={focus}>{focus}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '管理建议',
      key: 'suggestion',
      render: (_, item) => (
        <span className="teacher-development-table-copy">{item.suggestions[0] || '-'}</span>
      ),
    },
    {
      title: '查看',
      key: 'action',
      width: 88,
      render: (_, item) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedTeacherId(item.teacherId);
            setDetailOpen(true);
          }}
        >
          详情
        </Button>
      ),
    },
  ], []);

  const departmentColumns = useMemo(() => [
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName' },
    { title: '教师数', dataIndex: 'teacherCount', key: 'teacherCount' },
    { title: '高关注', dataIndex: 'highRiskCount', key: 'highRiskCount' },
    { title: '无基线', dataIndex: 'noBaselineCount', key: 'noBaselineCount' },
    { title: '平均覆盖', dataIndex: 'averageCoverage', key: 'averageCoverage', render: (value) => `${value}%` },
    {
      title: '涉及序列',
      key: 'sequenceNames',
      render: (_, item) => (
        <div className="teacher-development-tag-wrap">
          {(item.sequenceNames.length ? item.sequenceNames : ['未映射']).map((sequenceName) => (
            <Tag key={sequenceName}>{sequenceName}</Tag>
          ))}
        </div>
      ),
    },
  ], []);

  const periodColumns = useMemo(() => [
    { title: '周期', dataIndex: 'periodLabel', key: 'periodLabel' },
    { title: '教师数', dataIndex: 'teacherCount', key: 'teacherCount' },
    { title: '实例数', dataIndex: 'recordCount', key: 'recordCount' },
    { title: '评审中', dataIndex: 'inReviewCount', key: 'inReviewCount' },
    { title: '待补证', dataIndex: 'supplementCount', key: 'supplementCount' },
    { title: '已通过', dataIndex: 'approvedCount', key: 'approvedCount' },
    { title: '平均覆盖', dataIndex: 'averageCoverage', key: 'averageCoverage', render: (value) => `${value}%` },
    {
      title: '方案',
      key: 'schemeNames',
      render: (_, item) => (
        <div className="teacher-development-tag-wrap">
          {item.schemeNames.map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </div>
      ),
    },
  ], []);

  const modelColumns = useMemo(() => [
    { title: '能力模型', dataIndex: 'name', key: 'name' },
    { title: '序列 / 等级', key: 'level', render: (_, item) => `${item.sequenceName} / ${item.roleLevelName}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (value) => <Tag>{value}</Tag> },
    { title: '维度数', dataIndex: 'dimensionCount', key: 'dimensionCount' },
    { title: '关联方案', dataIndex: 'schemeCount', key: 'schemeCount' },
    { title: '关联实例', dataIndex: 'recordCount', key: 'recordCount' },
  ], []);

  const sequenceLevelColumns = useMemo(() => [
    { title: '序列等级', dataIndex: 'roleLevelName', key: 'roleLevelName' },
    { title: '教师数', dataIndex: 'teacherCount', key: 'teacherCount' },
    { title: '实例数', dataIndex: 'recordCount', key: 'recordCount' },
    { title: '高关注', dataIndex: 'highRiskCount', key: 'highRiskCount' },
    { title: '待补证', dataIndex: 'supplementRequiredCount', key: 'supplementRequiredCount' },
    { title: '已通过', dataIndex: 'approvedCount', key: 'approvedCount' },
    { title: '平均覆盖', dataIndex: 'averageCoverage', key: 'averageCoverage', render: (value) => `${value}%` },
    {
      title: '主要风险项',
      key: 'focusItems',
      render: (_, item) => (
        <div className="teacher-development-tag-wrap">
          {(item.focusItems.length ? item.focusItems : ['暂无']).map((focus) => (
            <Tag key={focus}>{focus}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '查看',
      key: 'action',
      width: 108,
      render: (_, item) => (
        <Button
          type="link"
          onClick={(event) => {
            event.stopPropagation();
            setSequenceDrawerState({
              open: true,
              sequenceId: item.sequenceId,
              roleLevelId: item.roleLevelId,
            });
          }}
        >
          教师名单
        </Button>
      ),
    },
  ], []);

  const sequenceDistributionColumns = useMemo(() => [
    { title: '序列', dataIndex: 'sequenceName', key: 'sequenceName' },
    { title: '覆盖部门', dataIndex: 'departmentCount', key: 'departmentCount' },
    { title: '教师数', dataIndex: 'teacherCount', key: 'teacherCount' },
    { title: '高关注', dataIndex: 'highRiskCount', key: 'highRiskCount' },
    { title: '平均覆盖', dataIndex: 'averageCoverage', key: 'averageCoverage', render: (value) => `${value}%` },
  ], []);

  return (
    <div className="sys-module teacher-development-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">教师发展洞察</span>
          <span className="sys-module-header-subtitle">面向教研组长、企业导师、教学管理者和校级评审组的全景管理工作台</span>
        </div>
        <Space>
          <Segmented
            options={MANAGER_ROLE_OPTIONS}
            value={managerRole}
            onChange={setManagerRole}
          />
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
            刷新数据
          </Button>
        </Space>
      </div>
      <div className="sys-module-body">
        <Alert
          type="info"
          showIcon
          className="teacher-development-alert"
          message="AI 生成内容仅用于管理辅助"
          description="本模块中的教师发展建议、组织画像、序列观察和重点关注项基于当前评价实例、能力模型与规则聚合生成，正式结论仍需由相应角色人工确认。"
        />

        {loading ? (
          <div className="teacher-development-loading">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="teacher-development-summary-grid">
              <Card className="teacher-development-summary-card">
                <Statistic title="纳入视野教师" value={summaryMetrics.teacherCount} prefix={<TeamOutlined />} />
              </Card>
              <Card className="teacher-development-summary-card">
                <Statistic title="高关注教师" value={summaryMetrics.highRiskCount} prefix={<WarningOutlined />} />
              </Card>
              <Card className="teacher-development-summary-card">
                <Statistic title="评审推进中" value={summaryMetrics.inReviewCount} prefix={<AuditOutlined />} />
              </Card>
              <Card className="teacher-development-summary-card">
                <Statistic title="待补证实例" value={summaryMetrics.supplementCount} prefix={<ApartmentOutlined />} />
              </Card>
              <Card className="teacher-development-summary-card">
                <Statistic title="平均证据覆盖" value={summaryMetrics.averageCoverage} suffix="%" prefix={<RiseOutlined />} />
              </Card>
              <Card className="teacher-development-summary-card">
                <Statistic title="覆盖序列数" value={summaryMetrics.sequenceCount} prefix={<BulbOutlined />} />
              </Card>
            </div>

            <Card className="teacher-development-filter-card">
              <div className="teacher-development-filter-grid">
                <Search
                  allowClear
                  className="teacher-development-filter-search"
                  placeholder="搜索教师、部门、岗位、序列或层级"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <Select options={departmentOptions} value={departmentFilter} onChange={setDepartmentFilter} />
                <Select options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
                <Select options={sequenceOptions} value={sequenceFilter} onChange={setSequenceFilter} />
                <Select options={levelOptions} value={levelFilter} onChange={setLevelFilter} />
                <Select options={periodOptions} value={periodFilter} onChange={setPeriodFilter} />
                <Select options={RISK_LEVEL_OPTIONS} value={riskFilter} onChange={setRiskFilter} />
              </div>
            </Card>

            <Tabs
              className="teacher-development-tabs"
              items={[
                {
                  key: 'panorama',
                  label: '教师全景',
                  children: filteredTeacherSummaries.length ? (
                    <Card className="teacher-development-panel-card">
                      <div className="teacher-development-panel-head">
                        <div>
                          <strong>教师发展全景</strong>
                          <span>聚合周期推进、证据覆盖、风险项、AI 待确认情况和序列归属，帮助管理者快速识别重点对象。</span>
                        </div>
                        <Tag color="blue">{summaryMetrics.publishedModelCount} 个已发布能力模型</Tag>
                      </div>
                      <Table
                        rowKey="teacherId"
                        columns={teacherColumns}
                        dataSource={filteredTeacherSummaries}
                        pagination={{ pageSize: 6, showSizeChanger: false }}
                        onRow={(record) => ({
                          onClick: () => {
                            setSelectedTeacherId(record.teacherId);
                            setDetailOpen(true);
                          },
                        })}
                        scroll={{ x: 1320 }}
                      />
                    </Card>
                  ) : (
                    <Card className="teacher-development-panel-card">
                      <Empty description="当前筛选条件下暂无教师发展数据" />
                    </Card>
                  ),
                },
                {
                  key: 'organization',
                  label: '组织画像',
                  children: (
                    <div className="teacher-development-section-stack">
                      <div className="teacher-development-organ-grid">
                        {departmentSummaries.slice(0, 4).map((item) => (
                          <Card key={item.departmentName} className="teacher-development-organ-card">
                            <div className="teacher-development-organ-head">
                              <strong>{item.departmentName}</strong>
                              <Tag color={item.highRiskCount ? 'error' : 'success'}>
                                {item.highRiskCount ? `${item.highRiskCount} 位高关注` : '整体稳定'}
                              </Tag>
                            </div>
                            <div className="teacher-development-organ-metrics">
                              <span>{item.teacherCount} 位教师</span>
                              <span>平均覆盖 {item.averageCoverage}%</span>
                              <span>{item.noBaselineCount} 位无基线</span>
                            </div>
                            <div className="teacher-development-tag-wrap">
                              {(item.sequenceNames.length ? item.sequenceNames : ['暂无序列']).map((focus) => (
                                <Tag key={focus}>{focus}</Tag>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                      <Card className="teacher-development-panel-card">
                        <div className="teacher-development-panel-head">
                          <div>
                            <strong>部门推进画像</strong>
                            <span>按部门观察教师发展基线、高关注比例和组织重点项。</span>
                          </div>
                        </div>
                        <Table rowKey="departmentName" columns={departmentColumns} dataSource={departmentSummaries} pagination={false} scroll={{ x: 980 }} />
                      </Card>
                      <Card className="teacher-development-panel-card">
                        <div className="teacher-development-panel-head">
                          <div>
                            <strong>周期推进画像</strong>
                            <span>从学期 / 周期批次角度看发起量、推进量和补证压力。</span>
                          </div>
                        </div>
                        <Table rowKey="periodLabel" columns={periodColumns} dataSource={periodSummaries} pagination={false} scroll={{ x: 980 }} />
                      </Card>
                      <Card className="teacher-development-panel-card">
                        <div className="teacher-development-panel-head">
                          <div>
                            <strong>序列分布画像</strong>
                            <span>从更高维度观察不同教师发展序列在部门中的覆盖、风险和整体质量。</span>
                          </div>
                        </div>
                        <Table rowKey="sequenceName" columns={sequenceDistributionColumns} dataSource={sequenceDistribution} pagination={false} scroll={{ x: 860 }} />
                      </Card>
                      <Card className="teacher-development-panel-card">
                        <div className="teacher-development-panel-head">
                          <div>
                            <strong>能力模型采用情况</strong>
                            <span>看哪些能力模型已经真正被方案和实例使用，避免标准层与评价层脱节。</span>
                          </div>
                        </div>
                        <Table rowKey="key" columns={modelColumns} dataSource={modelUsage} pagination={false} scroll={{ x: 980 }} />
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'sequence',
                  label: '序列观察',
                  children: (
                    <div className="teacher-development-section-stack">
                      {(sequenceUnmappedTeacherCount || unmappedRecordCount) ? (
                        <Alert
                          type="warning"
                          showIcon
                          className="teacher-development-inline-alert"
                          message="存在未进入序列观察的数据"
                          description={`当前筛选范围内有 ${sequenceUnmappedTeacherCount} 位教师未映射到能力序列，${unmappedRecordCount} 个实例未关联能力模型。它们不会进入序列梯队统计，建议优先补齐模型关联。`}
                        />
                      ) : null}

                      {sequenceSummaries.length ? (
                        <>
                          <div className="teacher-development-sequence-grid">
                            {sequenceSummaries.map((item) => (
                              <button
                                key={item.sequenceId}
                                type="button"
                                className={`teacher-development-sequence-card ${selectedSequenceSummary?.sequenceId === item.sequenceId ? 'is-active' : ''}`}
                                onClick={() => setSelectedSequenceId(item.sequenceId)}
                              >
                                <div className="teacher-development-sequence-head">
                                  <strong>{item.sequenceName}</strong>
                                  <Tag color={item.highRiskCount ? 'error' : 'success'}>
                                    {item.highRiskCount ? `${item.highRiskCount} 位高关注` : '结构稳定'}
                                  </Tag>
                                </div>
                                <p>{item.sequenceDescription || '查看该序列下不同等级教师的分布与发展状态。'}</p>
                                <div className="teacher-development-sequence-metrics">
                                  <span>{item.teacherCount} 位教师</span>
                                  <span>{item.levelCount} 个等级</span>
                                  <span>覆盖 {item.averageCoverage}%</span>
                                </div>
                              </button>
                            ))}
                          </div>

                          {selectedSequenceSummary ? (
                            <Card className="teacher-development-panel-card">
                              <div className="teacher-development-panel-head">
                                <div>
                                  <strong>{selectedSequenceSummary.sequenceName}</strong>
                                  <span>{selectedSequenceSummary.sequenceDescription || '查看该序列不同等级的教师分布、风险和发展梯队建议。'}</span>
                                </div>
                                <Space>
                                  <Tag>{selectedSequenceSummary.teacherCount} 位教师</Tag>
                                  <Button
                                    type="default"
                                    onClick={() => setSequenceDrawerState({
                                      open: true,
                                      sequenceId: selectedSequenceSummary.sequenceId,
                                      roleLevelId: '',
                                    })}
                                  >
                                    查看梯队详情
                                  </Button>
                                </Space>
                              </div>
                              <div className="teacher-development-summary-grid teacher-development-summary-grid-detail">
                                <Card className="teacher-development-summary-card"><Statistic title="覆盖教师" value={selectedSequenceSummary.teacherCount} /></Card>
                                <Card className="teacher-development-summary-card"><Statistic title="已建基线" value={selectedSequenceSummary.baselineTeacherCount} /></Card>
                                <Card className="teacher-development-summary-card"><Statistic title="高关注教师" value={selectedSequenceSummary.highRiskCount} /></Card>
                                <Card className="teacher-development-summary-card"><Statistic title="平均覆盖" value={selectedSequenceSummary.averageCoverage} suffix="%" /></Card>
                              </div>
                              <Table
                                rowKey="key"
                                columns={sequenceLevelColumns}
                                dataSource={selectedSequenceSummary.levelSummaries}
                                pagination={false}
                                scroll={{ x: 1120 }}
                                onRow={(record) => ({
                                  onClick: () => {
                                    setSequenceDrawerState({
                                      open: true,
                                      sequenceId: record.sequenceId,
                                      roleLevelId: record.roleLevelId,
                                    });
                                  },
                                })}
                              />
                            </Card>
                          ) : null}

                          {selectedSequenceSummary ? (
                            <div className="teacher-development-advice-grid">
                              {selectedSequenceSummary.recommendations.map((item, index) => (
                                <Card key={`${selectedSequenceSummary.sequenceId}_${index}`} className="teacher-development-advice-card is-processing">
                                  <div className="teacher-development-advice-head">
                                    <strong>{index === 0 ? '补基线建议' : index === 1 ? '补短板建议' : '梯队建设建议'}</strong>
                                    <Tag color="processing">序列建议</Tag>
                                  </div>
                                  <p>{item}</p>
                                  <div className="teacher-development-tag-wrap">
                                    {(selectedSequenceSummary.focusItems.length ? selectedSequenceSummary.focusItems : ['梯队管理']).slice(0, 3).map((tag) => (
                                      <Tag key={`${selectedSequenceSummary.sequenceId}_${tag}`}>{tag}</Tag>
                                    ))}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <Card className="teacher-development-panel-card">
                          <Empty description="当前筛选范围内暂无可观察的序列数据" />
                        </Card>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'suggestions',
                  label: '建议中心',
                  children: (
                    <div className="teacher-development-section-stack">
                      <div className="teacher-development-advice-grid">
                        {overallSuggestions.map((item) => (
                          <Card key={item.key} className={`teacher-development-advice-card is-${item.tone}`}>
                            <div className="teacher-development-advice-head">
                              <strong>{item.title}</strong>
                              <Tag color={getToneColor(item.tone)}>AI 综合建议</Tag>
                            </div>
                            <p>{item.description}</p>
                            <div className="teacher-development-tag-wrap">
                              {item.tags.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                      <Card className="teacher-development-panel-card">
                        <div className="teacher-development-panel-head">
                          <div>
                            <strong>重点关注教师清单</strong>
                            <span>便于管理者形成月度 / 学期跟踪名单和后续行动。</span>
                          </div>
                        </div>
                        <div className="teacher-development-watch-list">
                          {filteredTeacherSummaries.filter((item) => item.riskLevel !== 'LOW').slice(0, 8).map((item) => (
                            <button
                              key={item.teacherId}
                              type="button"
                              className="teacher-development-watch-item"
                              onClick={() => {
                                setSelectedTeacherId(item.teacherId);
                                setDetailOpen(true);
                              }}
                            >
                              <div>
                                <strong>{item.name}</strong>
                                <span>{item.departmentName} / {item.sequenceName ? `${item.sequenceName} / ${item.roleLevelName}` : item.targetLevel}</span>
                              </div>
                              <div className="teacher-development-watch-meta">
                                <Tag color={getRiskColor(item.riskLevel)}>{getRiskLabel(item.riskLevel)}</Tag>
                                <span>{item.suggestions[0]}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>

      <Drawer
        title={selectedTeacherSummary ? `${selectedTeacherSummary.name} · 教师发展详情` : '教师发展详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={900}
        className="teacher-development-drawer"
      >
        {selectedTeacherSummary ? (
          <div className="teacher-development-detail-body">
            <div className="teacher-development-detail-hero">
              <span className="teacher-development-detail-kicker">{selectedTeacherSummary.schoolName} · {selectedTeacherSummary.departmentName}</span>
              <h2>{selectedTeacherSummary.name} / {selectedTeacherSummary.roleName || selectedTeacherSummary.roleName}</h2>
              <p>
                {selectedTeacherSummary.sequenceName
                  ? `当前位于 ${selectedTeacherSummary.sequenceName} / ${selectedTeacherSummary.roleLevelName}，最近周期为 ${selectedTeacherSummary.latestPeriodLabel}，当前用于管理判断的风险级别为 ${getRiskLabel(selectedTeacherSummary.riskLevel)}。`
                  : `${selectedTeacherSummary.targetLevel}，最近周期为 ${selectedTeacherSummary.latestPeriodLabel}，当前尚未映射到能力序列。`}
              </p>
              <div className="teacher-development-tag-wrap">
                <Tag color={getRiskColor(selectedTeacherSummary.riskLevel)}>{getRiskLabel(selectedTeacherSummary.riskLevel)}</Tag>
                {selectedTeacherSummary.sequenceName ? <Tag>{selectedTeacherSummary.sequenceName}</Tag> : null}
                {selectedTeacherSummary.roleLevelName ? <Tag>{selectedTeacherSummary.roleLevelName}</Tag> : null}
                <Tag>{selectedTeacherSummary.periodCount} 个周期</Tag>
                <Tag>{selectedTeacherSummary.totalRecords} 个实例</Tag>
                <Tag>{selectedTeacherSummary.pendingAiDrafts} 份待确认 AI 草稿</Tag>
              </div>
            </div>

            <div className="teacher-development-summary-grid teacher-development-summary-grid-detail">
              <Card className="teacher-development-summary-card"><Statistic title="平均证据覆盖" value={selectedTeacherSummary.averageCoverage} suffix="%" /></Card>
              <Card className="teacher-development-summary-card"><Statistic title="平均就绪度" value={selectedTeacherSummary.averageReadiness} suffix="%" /></Card>
              <Card className="teacher-development-summary-card"><Statistic title="已通过实例" value={selectedTeacherSummary.approvedCount} prefix={<CheckCircleOutlined />} /></Card>
              <Card className="teacher-development-summary-card"><Statistic title="待补证实例" value={selectedTeacherSummary.supplementRequiredCount} prefix={<WarningOutlined />} /></Card>
            </div>

            <Card className="teacher-development-detail-card">
              <div className="teacher-development-panel-head">
                <div>
                  <strong>管理判断</strong>
                  <span>这里展示系统归纳出的风险原因、亮点和建议，供管理者快速判断。</span>
                </div>
              </div>
              <div className="teacher-development-detail-grid">
                <div className="teacher-development-detail-block">
                  <h4>风险原因</h4>
                  <ul>
                    {(selectedTeacherSummary.riskReasons.length ? selectedTeacherSummary.riskReasons : ['当前未识别到显著风险。']).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="teacher-development-detail-block">
                  <h4>成长亮点</h4>
                  <ul>
                    {selectedTeacherSummary.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="teacher-development-detail-block">
                  <h4>管理建议</h4>
                  <ul>
                    {selectedTeacherSummary.suggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="teacher-development-detail-card">
              <div className="teacher-development-panel-head">
                <div>
                  <strong>历次评价时间线</strong>
                  <span>按周期整理的评价实例，便于管理者观察连续成长和流程状态。</span>
                </div>
              </div>
              <div className="teacher-development-timeline">
                {selectedTeacherSummary.periodGroups.map((group) => (
                  <div key={group.periodLabel} className="teacher-development-period-group">
                    <div className="teacher-development-period-head">
                      <strong>{group.periodLabel}</strong>
                      <span>{group.items.length} 个实例</span>
                    </div>
                    <div className="teacher-development-record-list">
                      {group.items.map(({ record, scheme }) => (
                        <div key={record.id} className="teacher-development-record-card">
                          <div className="teacher-development-record-head">
                            <div>
                              <strong>{record.schemeNameSnapshot || scheme?.name || '评价方案'}</strong>
                              <span>{scheme?.reviewFlow?.find((step) => step.key === record.currentNode)?.name || record.currentNode}</span>
                            </div>
                            <Tag color={getStatusColor(record.status)}>{getTeacherEvaluationStatusLabel(record.status)}</Tag>
                          </div>
                          <div className="teacher-development-record-meta">
                            <span>{record.evidenceItems?.length || 0} 条证据</span>
                            <span>{record.aiDrafts?.length || 0} 份 AI 建议稿</span>
                            <span>提交于 {formatDateTime(record.submittedAt || record.createdAt)}</span>
                          </div>
                          <div className="teacher-development-tag-wrap">
                            {(record.finalDecision?.decisionLabel ? [record.finalDecision.decisionLabel] : []).concat(record.appeal?.status ? ['含申诉记录'] : []).map((tag) => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                            {(selectedTeacherSummary.focusItems.length ? selectedTeacherSummary.focusItems : []).slice(0, 3).map((tag) => (
                              <Tag key={`${record.id}_${tag}`}>{tag}</Tag>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Empty description="暂无教师详情" />
        )}
      </Drawer>

      <Drawer
        title={sequenceDrawerData?.title || '序列梯队详情'}
        open={sequenceDrawerState.open}
        onClose={() => setSequenceDrawerState({ open: false, sequenceId: '', roleLevelId: '' })}
        width={760}
        className="teacher-development-drawer"
      >
        {sequenceDrawerData ? (
          <div className="teacher-development-detail-body">
            <div className="teacher-development-sequence-hero">
              <h3>{sequenceDrawerData.title}</h3>
              <p>{sequenceDrawerData.description}</p>
              <div className="teacher-development-tag-wrap">
                {sequenceDrawerData.tags.length
                  ? sequenceDrawerData.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                  : <Tag>暂无重点项</Tag>}
              </div>
            </div>

            <div className="teacher-development-summary-grid teacher-development-summary-grid-detail">
              {sequenceDrawerData.stats.map((item) => (
                <Card key={item.label} className="teacher-development-summary-card">
                  <Statistic title={item.label} value={item.value} />
                </Card>
              ))}
            </div>

            <Card className="teacher-development-detail-card">
              <div className="teacher-development-panel-head">
                <div>
                  <strong>{sequenceDrawerData.scopeType === 'sequence' ? '梯队建议' : '等级建议'}</strong>
                  <span>根据当前梯队结构、风险分布和基线情况生成。</span>
                </div>
              </div>
              <div className="teacher-development-detail-block">
                <ul>
                  {sequenceDrawerData.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="teacher-development-detail-card">
              <div className="teacher-development-panel-head">
                <div>
                  <strong>教师名单</strong>
                  <span>点击任意教师可继续进入教师发展详情。</span>
                </div>
              </div>
              <div className="teacher-development-watch-list">
                {sequenceDrawerData.teachers.length ? sequenceDrawerData.teachers.map((item) => (
                  <button
                    key={item.teacherId}
                    type="button"
                    className="teacher-development-watch-item"
                    onClick={() => {
                      setSelectedTeacherId(item.teacherId);
                      setDetailOpen(true);
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.departmentName} / {item.sequenceName ? `${item.sequenceName} / ${item.roleLevelName}` : item.targetLevel}</span>
                    </div>
                    <div className="teacher-development-watch-meta">
                      <Tag color={getRiskColor(item.riskLevel)}>{getRiskLabel(item.riskLevel)}</Tag>
                      <span>{item.suggestions[0]}</span>
                    </div>
                  </button>
                )) : <Empty description="当前范围内暂无教师" />}
              </div>
            </Card>
          </div>
        ) : (
          <Empty description="暂无梯队详情" />
        )}
      </Drawer>
    </div>
  );
}
