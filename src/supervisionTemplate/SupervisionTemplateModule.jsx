import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ImportOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { supervisionTemplateApi } from './api';
import '../system/SystemModule.css';
import './SupervisionTemplateModule.css';

const { TextArea } = Input;

const STATUS_OPTIONS = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
];

const TEMPLATE_TYPE_OPTIONS = [
  { label: '听课督导', value: '听课督导' },
  { label: '巡课督导', value: '巡课督导' },
  { label: '专项检查', value: '专项检查' },
  { label: '综合督导', value: '综合督导' },
  { label: '应急督导', value: '应急督导' },
];

const EVALUATION_MODE_OPTIONS = [
  { label: '检查性', value: '检查性' },
  { label: '诊断性', value: '诊断性' },
  { label: '发展性', value: '发展性' },
  { label: '结果性', value: '结果性' },
];

const PURPOSE_OPTIONS = [
  { label: '日常督导', value: '日常督导' },
  { label: '专项检查', value: '专项检查' },
  { label: '质量诊断', value: '质量诊断' },
  { label: '评估验收', value: '评估验收' },
];

const PERMISSION_LEVEL_OPTIONS = [
  { label: '平台级', value: '平台级' },
  { label: '校级', value: '校级' },
  { label: '院系级', value: '院系级' },
  { label: '个人草稿', value: '个人草稿' },
];

const APPLICABLE_OBJECT_OPTIONS = [
  { label: '教师课堂教学', value: '教师课堂教学' },
  { label: '实训课堂', value: '实训课堂' },
  { label: '课程资源', value: '课程资源' },
  { label: '专业建设', value: '专业建设' },
];

const SCHOOL_TYPE_OPTIONS = [
  { label: '职业院校', value: '职业院校' },
  { label: '职业本科院校', value: '职业本科院校' },
  { label: '中高职院校', value: '中高职院校' },
  { label: '高等院校', value: '高等院校' },
  { label: '基础教育学校', value: '基础教育学校' },
];

const DIMENSION_LEVEL_OPTIONS = [
  { label: '一级维度', value: '一级维度' },
  { label: '二级维度', value: '二级维度' },
  { label: '三级维度', value: '三级维度' },
  { label: '四级维度', value: '四级维度' },
];

const INDICATOR_TYPE_OPTIONS = [
  { label: '观察项', value: '观察项' },
  { label: '检查项', value: '检查项' },
  { label: '定性', value: '定性' },
  { label: '定量', value: '定量' },
];

const SCORING_METHOD_OPTIONS = [
  { label: '人工评分', value: '人工评分' },
  { label: '结果选择', value: '结果选择' },
  { label: '分值评分', value: '分值评分' },
  { label: 'AI 辅助建议', value: 'AI 辅助建议' },
];

const DEFAULT_TEMPLATE_FORM = {
  name: '',
  templateType: '听课督导',
  description: '',
  evaluationMode: '检查性',
  purpose: '日常督导',
  permissionLevel: '校级',
  applicableObject: '教师课堂教学',
  schoolType: '职业院校',
  status: 'ACTIVE',
};

const MAX_DIMENSION_DEPTH = 4;
const DIMENSION_LEVEL_LABELS = ['一级维度', '二级维度', '三级维度', '四级维度'];

function getStatusTag(status) {
  return status === 'DISABLED'
    ? <Tag icon={<StopOutlined />} color="default">停用</Tag>
    : <Tag icon={<CheckCircleOutlined />} color="success">启用</Tag>;
}

function formatDateTime(value) {
  return value ? String(value).slice(0, 16) : '-';
}

function getTemplateOwnership(template) {
  return ['平台级', '校级'].includes(template?.permissionLevel) ? 'PUBLIC' : 'CUSTOM';
}

function getTemplateCategory(template) {
  const text = `${template?.templateType || ''} ${template?.purpose || ''}`;
  if (text.includes('综合')) return '综合督导';
  if (text.includes('专项')) return '专项督导';
  if (text.includes('应急')) return '应急督导';
  return '其他';
}

function isScoreBasedTemplate(template) {
  return (template?.indicators || []).some((indicator) => /评分|分值/.test(indicator.scoringMethod || ''));
}

function isCheckBasedTemplate(template) {
  const text = `${template?.templateType || ''} ${template?.purpose || ''} ${template?.evaluationMode || ''}`;
  return text.includes('检查') || (template?.indicators || []).some((indicator) => indicator.indicatorType === '检查项');
}

function createDimensionMap(template) {
  return new Map((template?.dimensions || []).map((item) => [item.id, item]));
}

function getDimensionLabel(template, dimensionId) {
  const dimensionMap = createDimensionMap(template);
  const dimension = dimensionMap.get(dimensionId);
  if (!dimension) return '未关联维度';
  return `${dimension.code} ${dimension.name}`;
}

function getDimensionDepth(template, dimensionId) {
  if (!template || !dimensionId) return 1;
  const dimensionMap = createDimensionMap(template);
  let depth = 1;
  let parentId = dimensionMap.get(dimensionId)?.parentId;
  const visitedIds = new Set([dimensionId]);
  while (parentId && dimensionMap.has(parentId) && !visitedIds.has(parentId)) {
    depth += 1;
    visitedIds.add(parentId);
    parentId = dimensionMap.get(parentId)?.parentId;
  }
  return Math.max(1, Math.min(MAX_DIMENSION_DEPTH, depth));
}

function getDimensionLevelLabel(depth) {
  return DIMENSION_LEVEL_LABELS[Math.max(1, Math.min(MAX_DIMENSION_DEPTH, depth)) - 1] || '一级维度';
}

function getDescendantDimensionIds(template, dimensionId) {
  const descendants = new Set();
  const childrenByParentId = new Map();
  (template?.dimensions || []).forEach((dimension) => {
    const parentId = dimension.parentId || '';
    if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
    childrenByParentId.get(parentId).push(dimension);
  });

  const walk = (parentId) => {
    (childrenByParentId.get(parentId) || []).forEach((child) => {
      descendants.add(child.id);
      walk(child.id);
    });
  };
  walk(dimensionId);
  return descendants;
}

function buildDimensionTreeEntries(template) {
  const dimensions = template?.dimensions || [];
  const dimensionMap = createDimensionMap(template);
  const childrenByParentId = new Map();
  dimensions.forEach((dimension) => {
    const parentId = dimension.parentId && dimensionMap.has(dimension.parentId) ? dimension.parentId : '';
    if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
    childrenByParentId.get(parentId).push(dimension);
  });

  childrenByParentId.forEach((items) => {
    items.sort((left, right) => {
      const orderGap = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
      if (orderGap !== 0) return orderGap;
      return String(left.code || '').localeCompare(String(right.code || ''), 'zh-CN');
    });
  });

  const entries = [];
  const indicatorCountMap = new Map();
  (template?.indicators || []).forEach((indicator) => {
    indicatorCountMap.set(indicator.dimensionId, (indicatorCountMap.get(indicator.dimensionId) || 0) + 1);
  });

  const walk = (parentId, level, ancestorIds) => {
    (childrenByParentId.get(parentId) || []).forEach((dimension) => {
      const childCount = (childrenByParentId.get(dimension.id) || []).length;
      entries.push({
        key: dimension.id,
        dimension,
        level,
        ancestorIds,
        childCount,
        indicatorCount: indicatorCountMap.get(dimension.id) || 0,
      });
      walk(dimension.id, Math.min(MAX_DIMENSION_DEPTH, level + 1), [...ancestorIds, dimension.id]);
    });
  };

  walk('', 1, []);
  return entries;
}

function buildCopyCode(items, code) {
  const existingCodes = new Set((items || []).map((item) => item.code));
  const baseCode = `${code || 'COPY'}_COPY`;
  if (!existingCodes.has(baseCode)) return baseCode;
  let index = 2;
  while (existingCodes.has(`${baseCode}_${index}`)) {
    index += 1;
  }
  return `${baseCode}_${index}`;
}

function createTemplateFormValues(template) {
  if (!template) return DEFAULT_TEMPLATE_FORM;
  return {
    name: template.name,
    templateType: template.templateType,
    description: template.description,
    evaluationMode: template.evaluationMode,
    purpose: template.purpose,
    permissionLevel: template.permissionLevel,
    applicableObject: template.applicableObject,
    schoolType: template.schoolType,
    status: template.status,
  };
}

function createDimensionFormValues(template, dimension, parentDimensionId = '') {
  if (dimension) {
    return {
      code: dimension.code,
      name: dimension.name,
      level: dimension.level,
      parentId: dimension.parentId || undefined,
      sortOrder: dimension.sortOrder,
      status: dimension.status,
    };
  }
  const parentDepth = parentDimensionId ? getDimensionDepth(template, parentDimensionId) : 0;
  return {
    code: '',
    name: '',
    level: getDimensionLevelLabel(parentDepth + 1),
    parentId: parentDimensionId || undefined,
    sortOrder: ((template?.dimensions || []).length + 1) * 10,
    status: 'ACTIVE',
  };
}

function createIndicatorFormValues(template, indicator, dimensionId = '') {
  if (indicator) {
    return {
      code: indicator.code,
      name: indicator.name,
      dimensionId: indicator.dimensionId || undefined,
      resultOptions: indicator.resultOptions || [],
      indicatorType: indicator.indicatorType,
      scoringMethod: indicator.scoringMethod,
      required: indicator.required,
      sortOrder: indicator.sortOrder,
      status: indicator.status,
    };
  }
  return {
    code: '',
    name: '',
    dimensionId: dimensionId || template?.dimensions?.[0]?.id,
    resultOptions: ['优秀', '良好', '合格', '需改进'],
    indicatorType: '观察项',
    scoringMethod: '人工评分',
    required: true,
    sortOrder: ((template?.indicators || []).length + 1) * 10,
    status: 'ACTIVE',
  };
}

export default function SupervisionTemplateModule() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(undefined);
  const [viewMode, setViewMode] = useState('list');
  const [activeDimensionId, setActiveDimensionId] = useState(undefined);
  const [collapsedDimensionIds, setCollapsedDimensionIds] = useState(() => new Set());
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(undefined);
  const [dimensionModalOpen, setDimensionModalOpen] = useState(false);
  const [editingDimensionId, setEditingDimensionId] = useState(undefined);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [editingIndicatorId, setEditingIndicatorId] = useState(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [templateKeyword, setTemplateKeyword] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState(undefined);
  const [templateStatusFilter, setTemplateStatusFilter] = useState(undefined);
  const [templateSchoolFilter, setTemplateSchoolFilter] = useState(undefined);
  const [indicatorKeyword, setIndicatorKeyword] = useState('');
  const [templateForm] = Form.useForm();
  const [dimensionForm] = Form.useForm();
  const [indicatorForm] = Form.useForm();

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await supervisionTemplateApi.seed();
      const nextTemplates = await supervisionTemplateApi.listTemplates();
      setTemplates(nextTemplates);
      setActiveTemplateId((current) => (
        nextTemplates.some((item) => item.id === current) ? current : nextTemplates[0]?.id
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshData]);

  useEffect(() => {
    const eventName = supervisionTemplateApi.getStoreEventName?.();
    if (!eventName || typeof window === 'undefined') return undefined;
    const handler = () => {
      refreshData();
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [refreshData]);

  const activeTemplate = useMemo(
    () => templates.find((item) => item.id === activeTemplateId) || templates[0] || null,
    [activeTemplateId, templates],
  );

  const dimensionTreeEntries = useMemo(
    () => buildDimensionTreeEntries(activeTemplate),
    [activeTemplate],
  );

  const visibleDimensionTreeEntries = useMemo(
    () => dimensionTreeEntries.filter((entry) => (
      entry.ancestorIds.every((dimensionId) => !collapsedDimensionIds.has(dimensionId))
    )),
    [collapsedDimensionIds, dimensionTreeEntries],
  );

  const selectedDimension = useMemo(() => {
    if (!activeTemplate?.dimensions?.length) return null;
    return activeTemplate.dimensions.find((dimension) => dimension.id === activeDimensionId)
      || activeTemplate.dimensions[0]
      || null;
  }, [activeDimensionId, activeTemplate]);

  const dimensionOptions = useMemo(
    () => (activeTemplate?.dimensions || []).map((dimension) => ({
      label: `${dimension.code} ${dimension.name}`,
      value: dimension.id,
    })),
    [activeTemplate],
  );

  const schoolFilterOptions = useMemo(
    () => Array.from(new Set(templates.map((template) => template.schoolType).filter(Boolean)))
      .map((schoolType) => ({ label: schoolType, value: schoolType })),
    [templates],
  );

  const parentDimensionOptions = useMemo(
    () => {
      const descendantIds = editingDimensionId ? getDescendantDimensionIds(activeTemplate, editingDimensionId) : new Set();
      return (activeTemplate?.dimensions || []).map((dimension) => ({
        label: `${dimension.code} ${dimension.name}`,
        value: dimension.id,
        disabled: dimension.id === editingDimensionId
          || descendantIds.has(dimension.id)
          || getDimensionDepth(activeTemplate, dimension.id) >= MAX_DIMENSION_DEPTH,
      }));
    },
    [activeTemplate, editingDimensionId],
  );

  const selectedDimensionIndicators = useMemo(() => {
    if (!activeTemplate || !selectedDimension) return [];
    const keyword = indicatorKeyword.trim().toLowerCase();
    return activeTemplate.indicators.filter((indicator) => {
      if (indicator.dimensionId !== selectedDimension.id) return false;
      if (!keyword) return true;
      const text = `${indicator.code} ${indicator.name} ${indicator.indicatorType} ${indicator.scoringMethod}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [activeTemplate, indicatorKeyword, selectedDimension]);

  const filteredTemplates = useMemo(() => {
    const keyword = templateKeyword.trim().toLowerCase();
    return templates.filter((template) => {
      if (templateTypeFilter && template.templateType !== templateTypeFilter) return false;
      if (templateStatusFilter && template.status !== templateStatusFilter) return false;
      if (templateSchoolFilter && template.schoolType !== templateSchoolFilter) return false;
      if (!keyword) return true;
      const text = [
        template.name,
        template.templateType,
        template.permissionLevel,
        template.schoolType,
        template.evaluationMode,
        template.purpose,
      ].join(' ').toLowerCase();
      return text.includes(keyword);
    });
  }, [templateKeyword, templateSchoolFilter, templateStatusFilter, templateTypeFilter, templates]);

  const templateOverviewStats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((item) => item.status === 'ACTIVE').length;
    const disabled = templates.filter((item) => item.status === 'DISABLED').length;
    return {
      total,
      active,
      disabled,
      activeRate: total ? `${Math.round((active / total) * 100)}%` : '0%',
      publicCount: templates.filter((item) => getTemplateOwnership(item) === 'PUBLIC').length,
      customCount: templates.filter((item) => getTemplateOwnership(item) === 'CUSTOM').length,
      scoreBased: templates.filter((item) => isScoreBasedTemplate(item)).length,
      checkBased: templates.filter((item) => isCheckBasedTemplate(item)).length,
      comprehensive: templates.filter((item) => getTemplateCategory(item) === '综合督导').length,
      special: templates.filter((item) => getTemplateCategory(item) === '专项督导').length,
      emergency: templates.filter((item) => getTemplateCategory(item) === '应急督导').length,
      other: templates.filter((item) => getTemplateCategory(item) === '其他').length,
    };
  }, [templates]);

  const overviewCards = [
    { key: 'total', label: '模板总数', value: templateOverviewStats.total, tone: 'blue', icon: <AppstoreOutlined /> },
    { key: 'active', label: '已启用', value: templateOverviewStats.active, tone: 'green', icon: <CheckCircleOutlined /> },
    { key: 'disabled', label: '已停用', value: templateOverviewStats.disabled, tone: 'gray', icon: <StopOutlined /> },
    { key: 'activeRate', label: '启用率', value: templateOverviewStats.activeRate, tone: 'blue', icon: <CheckCircleOutlined /> },
    { key: 'public', label: '公共模板', value: templateOverviewStats.publicCount, tone: 'blue', icon: <AppstoreOutlined /> },
    { key: 'custom', label: '自建模板', value: templateOverviewStats.customCount, tone: 'orange', icon: <AppstoreOutlined /> },
    { key: 'score', label: '评分制模板', value: templateOverviewStats.scoreBased, tone: 'blue', icon: <SafetyCertificateOutlined /> },
    { key: 'check', label: '检查制模板', value: templateOverviewStats.checkBased, tone: 'green', icon: <CheckCircleOutlined /> },
    { key: 'comprehensive', label: '综合督导', value: templateOverviewStats.comprehensive, tone: 'plain', icon: null },
    { key: 'special', label: '专项督导', value: templateOverviewStats.special, tone: 'plain', icon: null },
    { key: 'emergency', label: '应急督导', value: templateOverviewStats.emergency, tone: 'plain', icon: null },
    { key: 'other', label: '其他', value: templateOverviewStats.other, tone: 'plain', icon: null },
  ];

  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (value, record) => (
        <div className="supervision-template-name-cell">
          <strong>{value}</strong>
          <span>{record.description || '暂无模板描述'}</span>
        </div>
      ),
    },
    {
      title: '模板类型',
      dataIndex: 'templateType',
      key: 'templateType',
      width: 120,
      render: (value, record) => (
        <Space size={4} wrap>
          <Tag color="blue">{value}</Tag>
          <Tag>{getTemplateCategory(record)}</Tag>
        </Space>
      ),
    },
    {
      title: '模板范围',
      dataIndex: 'permissionLevel',
      key: 'permissionLevel',
      width: 120,
      render: (value, record) => (
        <Tag color={getTemplateOwnership(record) === 'PUBLIC' ? 'processing' : 'warning'}>
          {getTemplateOwnership(record) === 'PUBLIC' ? '公共模板' : '自建模板'}
          {' · '}
          {value}
        </Tag>
      ),
    },
    {
      title: '适用学校',
      dataIndex: 'schoolType',
      key: 'schoolType',
      width: 150,
      ellipsis: true,
    },
    {
      title: '维度/指标',
      key: 'counts',
      width: 120,
      render: (_, record) => `${record.dimensions.length} / ${record.indicators.length}`,
    },
    {
      title: '评价模式',
      dataIndex: 'evaluationMode',
      key: 'evaluationMode',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => getStatusTag(value),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (value) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2} className="supervision-template-table-actions">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openTemplateDetail(record)}>
            配置
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openTemplateDrawer('edit', record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyTemplate(record)}>
            复制
          </Button>
          <Button type="link" size="small" onClick={() => handleToggleTemplateStatus(record)}>
            {record.status === 'ACTIVE' ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTemplate(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const indicatorColumns = [
    {
      title: '指标编码',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
    },
    {
      title: '所属维度',
      dataIndex: 'dimensionId',
      key: 'dimensionId',
      width: 220,
      render: (value) => getDimensionLabel(activeTemplate, value),
    },
    {
      title: '结果选项',
      dataIndex: 'resultOptions',
      key: 'resultOptions',
      width: 220,
      render: (value) => (
        <Space size={4} wrap>
          {(value || []).map((item) => <Tag key={item}>{item}</Tag>)}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'indicatorType',
      key: 'indicatorType',
      width: 100,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '评分方式',
      dataIndex: 'scoringMethod',
      key: 'scoringMethod',
      width: 120,
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 90,
      render: (value) => <Tag color={value ? 'success' : 'default'}>{value ? '必填' : '选填'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => getStatusTag(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 168,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2} className="supervision-template-table-actions is-indicator-actions">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openIndicatorModal(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyIndicator(record)}>
            复制
          </Button>
          <Popconfirm
            title="删除指标"
            description="确认删除该指标吗？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteIndicator(record)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const frameworkIndicatorColumns = indicatorColumns.filter((column) => column.key !== 'dimensionId');

  function openTemplateDetail(template) {
    if (!template) return;
    setActiveTemplateId(template.id);
    setViewMode('detail');
    setIndicatorKeyword('');
    setActiveDimensionId(template.dimensions?.[0]?.id);
  }

  function handleBackToList() {
    setViewMode('list');
    setIndicatorKeyword('');
  }

  function handleResetTemplateFilters() {
    setTemplateKeyword('');
    setTemplateTypeFilter(undefined);
    setTemplateStatusFilter(undefined);
    setTemplateSchoolFilter(undefined);
  }

  function handleImportTemplate() {
    message.info('导入模板能力预留中，可后续接入文件解析或模板市场。');
  }

  function handleToggleDimensionCollapse(dimensionId) {
    setCollapsedDimensionIds((current) => {
      const next = new Set(current);
      if (next.has(dimensionId)) next.delete(dimensionId);
      else next.add(dimensionId);
      return next;
    });
  }

  function openTemplateDrawer(mode, targetTemplate = null) {
    const template = targetTemplate || activeTemplate;
    if (mode === 'edit' && template) {
      setEditingTemplateId(template.id);
      templateForm.setFieldsValue(createTemplateFormValues(template));
    } else {
      setEditingTemplateId(undefined);
      templateForm.setFieldsValue(DEFAULT_TEMPLATE_FORM);
    }
    setTemplateDrawerOpen(true);
  }

  async function handleSaveTemplate(values) {
    setSubmitting(true);
    try {
      const isCreating = !editingTemplateId;
      const saved = await supervisionTemplateApi.saveTemplate({
        id: editingTemplateId,
        ...values,
      });
      message.success(editingTemplateId ? '督导模板已更新' : '督导模板已创建');
      setTemplateDrawerOpen(false);
      setActiveTemplateId(saved.id);
      if (isCreating) {
        setViewMode('detail');
      }
      await refreshData();
    } catch (error) {
      message.error(error?.message || '保存督导模板失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyTemplate(targetTemplate = null) {
    const template = targetTemplate || activeTemplate;
    if (!template) return;
    setSubmitting(true);
    try {
      const copied = await supervisionTemplateApi.copyTemplate(template.id);
      message.success('督导模板副本已创建');
      setActiveTemplateId(copied.id);
      await refreshData();
    } catch (error) {
      message.error(error?.message || '复制督导模板失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleTemplateStatus(targetTemplate = null) {
    const template = targetTemplate || activeTemplate;
    if (!template) return;
    setSubmitting(true);
    try {
      const nextStatus = template.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await supervisionTemplateApi.saveTemplate({
        ...template,
        status: nextStatus,
      });
      message.success(nextStatus === 'ACTIVE' ? '督导模板已启用' : '督导模板已停用');
      await refreshData();
    } catch (error) {
      message.error(error?.message || '更新模板状态失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteTemplate(targetTemplate = null) {
    const template = targetTemplate || activeTemplate;
    if (!template) return;
    Modal.confirm({
      title: `删除模板「${template.name}」`,
      content: template.dimensions.length || template.indicators.length
        ? '当前模板已包含维度或指标，请先清理后再删除。'
        : '删除后无法恢复，确认删除该模板吗？',
      okText: template.dimensions.length || template.indicators.length ? '知道了' : '删除',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
        disabled: Boolean(template.dimensions.length || template.indicators.length),
      },
      onOk: async () => {
        if (template.dimensions.length || template.indicators.length) return;
        try {
          await supervisionTemplateApi.deleteTemplate(template.id);
          message.success('督导模板已删除');
          if (template.id === activeTemplate?.id) {
            setViewMode('list');
          }
          await refreshData();
        } catch (error) {
          message.error(error?.message || '删除督导模板失败');
        }
      },
    });
  }

  function confirmDeleteDimension(record) {
    if (!record) return;
    Modal.confirm({
      title: `删除维度「${record.name}」`,
      content: '确认删除该维度吗？如存在下级维度或关联指标，系统会阻止删除。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => handleDeleteDimension(record),
    });
  }

  function openDimensionModal(record = null, parentDimensionId = '') {
    if (!activeTemplate) return;
    setEditingDimensionId(record?.id);
    dimensionForm.setFieldsValue(createDimensionFormValues(activeTemplate, record, parentDimensionId));
    setDimensionModalOpen(true);
  }

  async function handleSaveDimension() {
    if (!activeTemplate) return;
    setSubmitting(true);
    try {
      const values = await dimensionForm.validateFields();
      const saved = await supervisionTemplateApi.saveDimension(activeTemplate.id, {
        id: editingDimensionId,
        ...values,
        parentId: values.parentId || '',
      });
      message.success(editingDimensionId ? '维度已更新' : '维度已新增');
      setActiveDimensionId(saved.id);
      setDimensionModalOpen(false);
      setEditingDimensionId(undefined);
      await refreshData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || '保存维度失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDimension(record) {
    if (!activeTemplate) return;
    try {
      await supervisionTemplateApi.deleteDimension(activeTemplate.id, record.id);
      message.success('维度已删除');
      await refreshData();
    } catch (error) {
      message.error(error?.message || '删除维度失败');
    }
  }

  function openIndicatorModal(record = null, dimensionId = '') {
    if (!activeTemplate) return;
    setEditingIndicatorId(record?.id);
    indicatorForm.setFieldsValue(createIndicatorFormValues(activeTemplate, record, dimensionId));
    setIndicatorModalOpen(true);
  }

  async function handleSaveIndicator() {
    if (!activeTemplate) return;
    setSubmitting(true);
    try {
      const values = await indicatorForm.validateFields();
      const saved = await supervisionTemplateApi.saveIndicator(activeTemplate.id, {
        id: editingIndicatorId,
        ...values,
      });
      message.success(editingIndicatorId ? '指标已更新' : '指标已新增');
      setActiveDimensionId(saved.dimensionId);
      setIndicatorModalOpen(false);
      setEditingIndicatorId(undefined);
      await refreshData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || '保存指标失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyIndicator(record) {
    if (!activeTemplate) return;
    setSubmitting(true);
    try {
      await supervisionTemplateApi.saveIndicator(activeTemplate.id, {
        ...record,
        id: undefined,
        code: buildCopyCode(activeTemplate.indicators, record.code),
        name: `${record.name} 副本`,
        sortOrder: Number(record.sortOrder || 0) + 1,
        status: 'DISABLED',
      });
      message.success('指标副本已创建');
      await refreshData();
    } catch (error) {
      message.error(error?.message || '复制指标失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteIndicator(record) {
    if (!activeTemplate) return;
    try {
      await supervisionTemplateApi.deleteIndicator(activeTemplate.id, record.id);
      message.success('指标已删除');
      await refreshData();
    } catch (error) {
      message.error(error?.message || '删除指标失败');
    }
  }

  function renderTemplateFormFields() {
    return (
      <>
        <div className="supervision-template-form-grid">
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：课堂教学督导评价模板" />
          </Form.Item>
          <Form.Item label="模板类型" name="templateType" rules={[{ required: true, message: '请选择模板类型' }]}>
            <Select options={TEMPLATE_TYPE_OPTIONS} placeholder="选择模板类型" />
          </Form.Item>
          <Form.Item label="评价模式" name="evaluationMode" rules={[{ required: true, message: '请选择评价模式' }]}>
            <Select options={EVALUATION_MODE_OPTIONS} placeholder="选择评价模式" />
          </Form.Item>
          <Form.Item label="模板用途" name="purpose" rules={[{ required: true, message: '请选择模板用途' }]}>
            <Select options={PURPOSE_OPTIONS} placeholder="选择模板用途" />
          </Form.Item>
          <Form.Item label="权限级别" name="permissionLevel" rules={[{ required: true, message: '请选择权限级别' }]}>
            <Select options={PERMISSION_LEVEL_OPTIONS} placeholder="选择权限级别" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={STATUS_OPTIONS} placeholder="选择状态" />
          </Form.Item>
          <Form.Item label="适用对象" name="applicableObject" rules={[{ required: true, message: '请选择适用对象' }]}>
            <Select options={APPLICABLE_OBJECT_OPTIONS} placeholder="选择适用对象" />
          </Form.Item>
          <Form.Item label="学校类型" name="schoolType" rules={[{ required: true, message: '请选择学校类型' }]}>
            <Select options={SCHOOL_TYPE_OPTIONS} placeholder="选择学校类型" />
          </Form.Item>
        </div>
        <Form.Item label="模板描述" name="description">
          <TextArea rows={4} placeholder="说明该督导模板的适用场景、关注重点和使用边界。" />
        </Form.Item>
      </>
    );
  }

  function renderTemplateList() {
    return (
      <>
        <div className="supervision-template-overview-grid">
          {overviewCards.map((card) => (
            <Card
              key={card.key}
              variant="borderless"
              className={`supervision-template-overview-card is-${card.tone}`}
            >
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              {card.icon ? <span className="supervision-template-overview-icon">{card.icon}</span> : null}
            </Card>
          ))}
        </div>

        <Card variant="borderless" className="supervision-template-card supervision-template-list-card">
          <div className="supervision-template-list-toolbar">
            <div className="supervision-template-list-filters">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索模板名称、类型、范围"
                value={templateKeyword}
                onChange={(event) => setTemplateKeyword(event.target.value)}
              />
              <Select
                allowClear
                placeholder="全部类型"
                value={templateTypeFilter}
                options={TEMPLATE_TYPE_OPTIONS}
                onChange={setTemplateTypeFilter}
              />
              <Select
                allowClear
                placeholder="全部状态"
                value={templateStatusFilter}
                options={STATUS_OPTIONS}
                onChange={setTemplateStatusFilter}
              />
              <Select
                allowClear
                placeholder="全部学校"
                value={templateSchoolFilter}
                options={schoolFilterOptions}
                onChange={setTemplateSchoolFilter}
              />
              <Tooltip title="重置筛选">
                <Button shape="circle" icon={<ReloadOutlined />} onClick={handleResetTemplateFilters} />
              </Tooltip>
            </div>
            <Space wrap>
              <Button icon={<ImportOutlined />} onClick={handleImportTemplate}>
                导入模板
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openTemplateDrawer('create')}>
                新增模板
              </Button>
            </Space>
          </div>

          <Table
            className="supervision-template-list-table"
            rowKey="id"
            columns={templateColumns}
            dataSource={filteredTemplates}
            size="middle"
            scroll={{ x: 1680 }}
            rowClassName={(record) => (record.id === activeTemplateId ? 'supervision-template-row-active' : '')}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个模板`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无匹配模板"
                />
              ),
            }}
          />
        </Card>
      </>
    );
  }

  function renderDimensionTreeNode(entry) {
    const { dimension, childCount, indicatorCount, level } = entry;
    const isCollapsed = collapsedDimensionIds.has(dimension.id);
    const isActive = selectedDimension?.id === dimension.id;
    const canAddChild = level < MAX_DIMENSION_DEPTH;
    const dimensionActionItems = [
      {
        key: 'add-child',
        label: '新增下级维度',
        icon: <PlusOutlined />,
        disabled: !canAddChild,
      },
      {
        key: 'edit',
        label: '编辑维度',
        icon: <EditOutlined />,
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: '删除维度',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ];

    const handleDimensionActionClick = ({ key, domEvent }) => {
      domEvent?.stopPropagation();
      setActiveDimensionId(dimension.id);
      if (key === 'add-child') {
        openDimensionModal(null, dimension.id);
        return;
      }
      if (key === 'edit') {
        openDimensionModal(dimension);
        return;
      }
      if (key === 'delete') {
        confirmDeleteDimension(dimension);
      }
    };

    return (
      <div
        key={dimension.id}
        className={`supervision-template-framework-tree-node is-level-${level}${isActive ? ' is-active' : ''}`}
        style={{ '--supervision-tree-level': level - 1 }}
      >
        <button
          type="button"
          className="supervision-template-framework-tree-row"
          onClick={() => setActiveDimensionId(dimension.id)}
        >
          <span
            className={`supervision-template-framework-tree-toggle${childCount ? '' : ' is-empty'}`}
            onClick={(event) => {
              event.stopPropagation();
              if (childCount) handleToggleDimensionCollapse(dimension.id);
            }}
          >
            {childCount ? (isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />) : null}
          </span>
          <span className="supervision-template-framework-tree-icon">
            <AppstoreOutlined />
          </span>
          <span className="supervision-template-framework-tree-copy">
            <span className="supervision-template-framework-tree-title">{dimension.code} {dimension.name}</span>
            <span className="supervision-template-framework-tree-meta">
              {dimension.level} · {childCount} 个下级 · {indicatorCount} 个指标
            </span>
          </span>
        </button>
        <span className="supervision-template-framework-tree-actions" onClick={(event) => event.stopPropagation()}>
          <Dropdown
            trigger={['click']}
            menu={{
              items: dimensionActionItems,
              onClick: handleDimensionActionClick,
            }}
          >
            <Tooltip title="更多操作">
              <Button
                size="small"
                shape="circle"
                icon={<MoreOutlined />}
                aria-label={`${dimension.name} 更多操作`}
              />
            </Tooltip>
          </Dropdown>
        </span>
      </div>
    );
  }

  function renderTemplateFrameworkSection() {
    if (!activeTemplate?.dimensions?.length) {
      return (
        <div className="supervision-template-editor-section supervision-template-framework-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无维度，请先新增" />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openDimensionModal()}>
            新增维度
          </Button>
        </div>
      );
    }

    return (
      <div className="supervision-template-framework-split">
        <aside className="supervision-template-framework-tree-panel">
          <div className="supervision-template-framework-tree-head">
            <div>
              <div className="supervision-template-dimension-title">维度结构</div>
              <div className="supervision-template-section-desc">
                {activeTemplate.dimensions.length} 个维度 · {activeTemplate.indicators.length} 个指标
              </div>
            </div>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => openDimensionModal()}>
              新增
            </Button>
          </div>
          <div className="supervision-template-framework-tree-list">
            {visibleDimensionTreeEntries.map((entry) => renderDimensionTreeNode(entry))}
          </div>
        </aside>

        <section className="supervision-template-framework-config-panel">
          {selectedDimension ? (
            <div className="supervision-template-framework-config-card">
              <div className="supervision-template-indicator-panel">
                <div className="supervision-template-subsection-head">
                  <div>
                    <div className="supervision-template-item-title">指标配置</div>
                    <div className="supervision-template-section-desc">
                      当前维度：{selectedDimension.code} {selectedDimension.name}
                    </div>
                  </div>
                  <Space wrap>
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="搜索当前维度指标"
                      value={indicatorKeyword}
                      onChange={(event) => setIndicatorKeyword(event.target.value)}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openIndicatorModal(null, selectedDimension.id)}
                    >
                      新增指标
                    </Button>
                  </Space>
                </div>
                <Table
                  rowKey="id"
                  columns={frameworkIndicatorColumns}
                  dataSource={selectedDimensionIndicators}
                  size="middle"
                  scroll={{ x: 1180 }}
                  pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
                  locale={{
                    emptyText: (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前维度暂无指标">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openIndicatorModal(null, selectedDimension.id)}>
                          新增指标
                        </Button>
                      </Empty>
                    ),
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="supervision-template-framework-empty">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个维度开始配置" />
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderTemplateDetail() {
    return (
      <div className="supervision-template-editor">
        {renderTemplateFrameworkSection()}
      </div>
    );
  }

  function renderTemplateDrawer() {
    return (
      <Drawer
        title={editingTemplateId ? '编辑督导模板' : '新增督导模板'}
        size="large"
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        destroyOnHidden
      >
        <Form layout="vertical" form={templateForm} onFinish={handleSaveTemplate}>
          {renderTemplateFormFields()}
          <div className="supervision-template-form-footer">
            <Button onClick={() => setTemplateDrawerOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>保存模板</Button>
          </div>
        </Form>
      </Drawer>
    );
  }

  function renderDimensionModal() {
    return (
      <Modal
        title={editingDimensionId ? '编辑维度' : '新增维度'}
        open={dimensionModalOpen}
        onCancel={() => setDimensionModalOpen(false)}
        onOk={handleSaveDimension}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form layout="vertical" form={dimensionForm}>
          <div className="supervision-template-form-grid supervision-template-form-grid-compact">
            <Form.Item label="维度编码" name="code" rules={[{ required: true, message: '请输入维度编码' }]}>
              <Input placeholder="例如：C-1" />
            </Form.Item>
            <Form.Item label="维度名称" name="name" rules={[{ required: true, message: '请输入维度名称' }]}>
              <Input placeholder="例如：教学过程组织" />
            </Form.Item>
            <Form.Item label="层级" name="level" rules={[{ required: true, message: '请选择层级' }]}>
              <Select options={DIMENSION_LEVEL_OPTIONS} />
            </Form.Item>
            <Form.Item label="父级维度" name="parentId">
              <Select
                allowClear
                options={parentDimensionOptions}
                placeholder="无父级维度"
                onChange={(value) => {
                  const nextDepth = value ? getDimensionDepth(activeTemplate, value) + 1 : 1;
                  dimensionForm.setFieldValue('level', getDimensionLevelLabel(nextDepth));
                }}
              />
            </Form.Item>
            <Form.Item label="排序" name="sortOrder">
              <InputNumber min={0} precision={0} className="supervision-template-full-width" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    );
  }

  function renderIndicatorModal() {
    return (
      <Modal
        title={editingIndicatorId ? '编辑指标' : '新增指标'}
        open={indicatorModalOpen}
        onCancel={() => setIndicatorModalOpen(false)}
        onOk={handleSaveIndicator}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        width={760}
        destroyOnHidden
      >
        <Form layout="vertical" form={indicatorForm}>
          <div className="supervision-template-form-grid">
            <Form.Item label="指标编码" name="code" rules={[{ required: true, message: '请输入指标编码' }]}>
              <Input placeholder="例如：C-4" />
            </Form.Item>
            <Form.Item label="指标名称" name="name" rules={[{ required: true, message: '请输入指标名称' }]}>
              <Input placeholder="例如：教学目标清晰具体" />
            </Form.Item>
            <Form.Item label="所属维度" name="dimensionId" rules={[{ required: true, message: '请选择所属维度' }]}>
              <Select options={dimensionOptions} placeholder="选择所属维度" />
            </Form.Item>
            <Form.Item label="类型" name="indicatorType" rules={[{ required: true, message: '请选择类型' }]}>
              <Select options={INDICATOR_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item label="评分方式" name="scoringMethod" rules={[{ required: true, message: '请选择评分方式' }]}>
              <Select options={SCORING_METHOD_OPTIONS} />
            </Form.Item>
            <Form.Item label="是否必填" name="required" rules={[{ required: true, message: '请选择是否必填' }]}>
              <Select options={[{ label: '必填', value: true }, { label: '选填', value: false }]} />
            </Form.Item>
            <Form.Item label="排序" name="sortOrder">
              <InputNumber min={0} precision={0} className="supervision-template-full-width" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>
          <Form.Item label="结果选项" name="resultOptions">
            <Select
              mode="tags"
              tokenSeparators={[',', '，', '、', '/']}
              placeholder="输入后回车，例如：优秀、良好、合格、需改进"
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  if (loading) {
    return (
      <div className="sys-module supervision-template-module">
        <Spin className="supervision-template-loading" />
      </div>
    );
  }

  return (
    <div className={`sys-module supervision-template-module${viewMode === 'detail' ? ' is-detail' : ''}`}>
      <div className="sys-module-header">
        <div className="supervision-template-header-copy">
          {viewMode === 'detail' && activeTemplate ? (
            <>
              <div className="supervision-template-header-title-row">
                <span className="sys-module-header-title">{activeTemplate.name || '未命名模板'}</span>
                {getStatusTag(activeTemplate.status)}
              </div>
              <span className="sys-module-header-subtitle supervision-template-header-subtitle">
                督导模板配置 · {activeTemplate.templateType || '-'} · {activeTemplate.schoolType || '-'} · 更新于 {formatDateTime(activeTemplate.updatedAt)}
              </span>
            </>
          ) : (
            <>
              <span className="sys-module-header-title">督导模板管理</span>
              <span className="sys-module-header-subtitle">管理和维护面向督导场景的评价模板体系</span>
            </>
          )}
        </div>
        <Space wrap className="supervision-template-header-actions">
          {viewMode === 'detail' ? (
            <>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
                返回列表
              </Button>
              {activeTemplate ? (
                <>
                  <Button onClick={() => handleToggleTemplateStatus()} loading={submitting}>
                    {activeTemplate.status === 'ACTIVE' ? '停用模板' : '启用模板'}
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="supervision-template-page">
          {viewMode === 'list' ? (
            renderTemplateList()
          ) : activeTemplate ? (
            renderTemplateDetail()
          ) : (
            <Card variant="borderless" className="supervision-template-card">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无督导模板">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openTemplateDrawer('create')}>
                  新增第一个模板
                </Button>
              </Empty>
            </Card>
          )}
        </div>
      </div>

      {renderTemplateDrawer()}
      {renderDimensionModal()}
      {renderIndicatorModal()}
    </div>
  );
}
