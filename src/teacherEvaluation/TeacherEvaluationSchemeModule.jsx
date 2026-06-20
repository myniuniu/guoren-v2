import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd';
import {
  AuditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getTeacherEvaluationRoleLabel,
  TEACHER_EVALUATION_ROLE_OPTIONS,
  teacherEvaluationApi,
} from './api';
import { capabilityModelApi } from '../capabilityModel/api';
import '../system/SystemModule.css';
import './TeacherEvaluationModule.css';

const { TextArea } = Input;

const REVIEW_ROLE_LABEL_OPTIONS = TEACHER_EVALUATION_ROLE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.label,
}));

const SCHEME_TYPE_OPTIONS = [
  { label: '双师型认定', value: '双师型认定' },
  { label: '年度考核', value: '年度考核' },
  { label: '骨干/带头人遴选', value: '骨干/带头人遴选' },
  { label: '专业带头人评审', value: '专业带头人评审' },
  { label: '成长诊断', value: '成长诊断' },
];

const TARGET_ROLE_OPTIONS = [
  { label: '职教教师', value: '职教教师' },
  { label: '基础教育教师', value: '基础教育教师' },
  { label: '高校教师', value: '高校教师' },
];

const TARGET_LEVEL_OPTIONS = {
  职教教师: [
    { label: '初任讲师', value: '初任讲师' },
    { label: '双师型骨干讲师', value: '双师型骨干讲师' },
    { label: '专业带头人', value: '专业带头人' },
  ],
  基础教育教师: [
    { label: '新教师', value: '新教师' },
    { label: '青年教师', value: '青年教师' },
    { label: '骨干教师', value: '骨干教师' },
    { label: '学科带头人', value: '学科带头人' },
  ],
  高校教师: [
    { label: '青年教师', value: '青年教师' },
    { label: '骨干教师', value: '骨干教师' },
    { label: '学科负责人', value: '学科负责人' },
  ],
};

const AI_BOUNDARY_OPTIONS = [
  { label: '只做建议稿', value: '只做建议稿' },
  { label: '仅证据整理', value: '仅证据整理' },
  { label: '不启用 AI', value: '不启用 AI' },
];

const REVIEW_FLOW_NODE_OPTIONS = [
  { label: '教师提交证据', value: '教师提交证据', owner: 'TEACHER', output: '证据包与成长摘要' },
  { label: '组内初审', value: '组内初审', owner: 'GROUP_LEADER', output: '初审意见与补证要求' },
  { label: '专项评议', value: '专项评议', owner: 'ENTERPRISE_MENTOR', output: '专项评议意见' },
  { label: '校级复核', value: '校级复核', owner: 'SCHOOL_REVIEW', output: '认定结论' },
  { label: '结果确认 / 申诉', value: '结果确认 / 申诉', owner: 'TEACHER', output: '申诉或确认记录' },
];

const FLOW_OUTPUT_OPTIONS = REVIEW_FLOW_NODE_OPTIONS.map((item) => ({
  label: item.output,
  value: item.output,
}));

const AI_ASSISTANT_NAME_OPTIONS = [
  { label: '证据整理助手', value: '证据整理助手' },
  { label: '量规预填助手', value: '量规预填助手' },
  { label: '评审包助手', value: '评审包助手' },
  { label: '专业建设摘要助手', value: '专业建设摘要助手' },
];

const AI_ROLE_SCOPE_OPTIONS = [
  { label: '教师 / 教研组长', value: '教师 / 教研组长' },
  { label: '教研组长 / 企业导师', value: '教研组长 / 企业导师' },
  { label: '督导 / 教学管理者', value: '督导 / 教学管理者' },
  { label: '校级评审组', value: '校级评审组' },
];

const AI_RESPONSIBILITY_OPTIONS = [
  { label: '自动归档材料', value: '自动归档材料' },
  { label: '提取关键事实', value: '提取关键事实' },
  { label: '生成成长摘要', value: '生成成长摘要' },
  { label: '按量规预填建议项', value: '按量规预填建议项' },
  { label: '标注缺证与错配', value: '标注缺证与错配' },
  { label: '草拟初审意见', value: '草拟初审意见' },
  { label: '拼装评审包', value: '拼装评审包' },
  { label: '汇总争议点', value: '汇总争议点' },
  { label: '生成待确认项清单', value: '生成待确认项清单' },
  { label: '汇总建设成果', value: '汇总建设成果' },
  { label: '生成时间线', value: '生成时间线' },
];

const AI_RESTRICTION_OPTIONS = [
  { label: '不得给出最终认定结论', value: '不得给出最终认定结论' },
  { label: '只能生成建议稿，必须人工确认', value: '只能生成建议稿，必须人工确认' },
  { label: '不得自动通过或淘汰教师', value: '不得自动通过或淘汰教师' },
  { label: '不得代替评审组形成最终结论', value: '不得代替评审组形成最终结论' },
];

const DEFAULT_SCHEME_FORM = {
  name: '',
  schemeType: '双师型认定',
  targetRole: '职教教师',
  targetLevel: '双师型骨干讲师',
  semester: '2026 秋季学期',
  summary: '',
  aiBoundary: '只做建议稿',
  capabilityModelId: undefined,
  dimensionWeights: [],
  itemRubrics: [],
  reviewFlow: [
    { name: '教师提交证据', owner: 'TEACHER', output: '证据包与成长摘要' },
    { name: '组内初审', owner: 'GROUP_LEADER', output: '初审意见与补证要求' },
    { name: '校级复核', owner: 'SCHOOL_REVIEW', output: '认定结论' },
  ],
  aiAssistants: [
    {
      name: '证据整理助手',
      roleScope: '教师 / 教研组长',
      responsibilities: ['自动归档材料', '生成成长摘要'],
      restrictions: ['不得给出最终认定结论'],
    },
  ],
};

function weightColor(weight) {
  if (weight >= 25) return 'red';
  if (weight >= 20) return 'gold';
  return 'blue';
}

function getNodeAllowedRoles(step) {
  if (!step) return [];
  if (step.owner === 'ENTERPRISE_MENTOR') {
    return ['ENTERPRISE_MENTOR', 'SUPERVISOR'];
  }
  return [step.owner];
}

function getCapabilityReviewRoleLabel(role) {
  if (role === 'SELF') return '本人';
  return getTeacherEvaluationRoleLabel(role);
}

function distributeWeights(count) {
  if (!count) return [];
  const base = Math.floor(100 / count);
  let remainder = 100 - (base * count);
  return Array.from({ length: count }, () => {
    const current = base + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return current;
  });
}

function buildSchemeDraftFromModel(model) {
  const weights = distributeWeights((model?.dimensions || []).length);
  return {
    capabilityModelId: model?.id,
    referencedDimensionKeys: (model?.dimensions || []).map((dimension) => dimension.id),
    referencedItemKeys: (model?.dimensions || []).flatMap((dimension) => (dimension.items || []).map((item) => item.id)),
    dimensionWeights: (model?.dimensions || []).map((dimension, index) => ({
      key: dimension.id,
      name: dimension.name,
      weight: weights[index] || 0,
    })),
    itemRubrics: (model?.dimensions || []).flatMap((dimension) => (
      (dimension.items || []).map((item) => ({
        key: item.id,
        itemName: item.name,
        evidenceThreshold: `至少 ${item.requiredEvidenceCount || 1} 条证据${item.requiredReviewRoles?.length ? `，评价主体：${item.requiredReviewRoles.map((role) => getCapabilityReviewRoleLabel(role)).join(' / ')}` : ''}`,
        evaluatorRoles: (item.requiredReviewRoles || []).map((role) => getCapabilityReviewRoleLabel(role)),
        aiAssistAllowed: item.aiAssistMode !== 'DISABLED',
      }))
    )),
  };
}

function buildRubricConfigFromModelItem(modelItem) {
  if (!modelItem) {
    return {
      evidenceThreshold: '',
      evaluatorRoles: [],
      aiAssistAllowed: true,
      evidenceThresholdOptions: [],
    };
  }
  const thresholdText = `至少 ${modelItem.requiredEvidenceCount || 1} 条证据${modelItem.requiredReviewRoles?.length ? `，评价主体：${modelItem.requiredReviewRoles.map((role) => getCapabilityReviewRoleLabel(role)).join(' / ')}` : ''}`;
  return {
    evidenceThreshold: thresholdText,
    evaluatorRoles: (modelItem.requiredReviewRoles || []).map((role) => getCapabilityReviewRoleLabel(role)),
    aiAssistAllowed: modelItem.aiAssistMode !== 'DISABLED',
    evidenceThresholdOptions: [{ label: thresholdText, value: thresholdText }],
  };
}

function filterCapabilityModelsByTargetRole(models, targetRole) {
  if (!targetRole) return models;
  return models.filter((model) => {
    const tags = model.tags || [];
    const code = String(model.modelCode || '');
    if (targetRole === '职教教师') {
      return tags.includes('职业教育') || tags.includes('职教教师') || code.includes('VOCATIONAL');
    }
    if (targetRole === '高校教师') {
      return tags.includes('高等教育') || tags.includes('高校教师') || code.includes('HIGHER');
    }
    if (targetRole === '基础教育教师') {
      return tags.includes('基础教育') || tags.includes('教师') || code.includes('BASIC');
    }
    return true;
  });
}

function createSchemeFormValues(scheme) {
  if (!scheme) return DEFAULT_SCHEME_FORM;
  return {
    name: scheme.name,
    schemeType: scheme.schemeType,
    targetRole: scheme.targetRole,
    targetLevel: scheme.targetLevel,
    capabilityModelId: scheme.capabilityModelId,
    semester: scheme.semester,
    summary: scheme.summary,
    aiBoundary: scheme.aiBoundary || '只做建议稿',
    dimensionWeights: (scheme.dimensionWeights || []).map((item) => ({
      key: item.key,
      name: item.name,
      weight: item.weight,
    })),
    itemRubrics: (scheme.itemRubrics || []).map((item) => ({
      key: item.key,
      itemName: item.itemName,
      evidenceThreshold: item.evidenceThreshold,
      evaluatorRoles: item.evaluatorRoles || [],
      aiAssistAllowed: Boolean(item.aiAssistAllowed),
    })),
    reviewFlow: (scheme.reviewFlow || []).map((item) => ({
      name: item.name,
      owner: item.owner,
      output: item.output,
    })),
    aiAssistants: (scheme.aiAssistants || []).map((item) => ({
      name: item.name,
      roleScope: item.roleScope,
      responsibilities: item.responsibilities || [],
      restrictions: item.restrictions || [],
    })),
  };
}

export default function TeacherEvaluationSchemeModule() {
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [records, setRecords] = useState([]);
  const [capabilityModels, setCapabilityModels] = useState([]);
  const [activeSchemeId, setActiveSchemeId] = useState(undefined);
  const [editingSchemeId, setEditingSchemeId] = useState(undefined);
  const [schemeDrawerOpen, setSchemeDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schemeForm] = Form.useForm();
  const watchedSchemeTargetRole = Form.useWatch('targetRole', schemeForm);
  const watchedCapabilityModelId = Form.useWatch('capabilityModelId', schemeForm);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await teacherEvaluationApi.seed();
      await capabilityModelApi.seed();
      const [nextSchemes, nextRecords, nextCapabilityModels] = await Promise.all([
        teacherEvaluationApi.listSchemes(),
        teacherEvaluationApi.listRecords(),
        capabilityModelApi.listModels(),
      ]);
      setSchemes(nextSchemes);
      setRecords(nextRecords);
      setCapabilityModels(nextCapabilityModels);
      setActiveSchemeId((current) => (
        nextSchemes.some((item) => item.id === current) ? current : nextSchemes[0]?.id
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const eventName = teacherEvaluationApi.getStoreEventName?.();
    if (!eventName || typeof window === 'undefined') return undefined;
    const handler = () => {
      refreshData();
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [refreshData]);

  const activeScheme = useMemo(
    () => schemes.find((item) => item.id === activeSchemeId) || schemes[0] || null,
    [activeSchemeId, schemes],
  );

  const activeCapabilityModel = useMemo(
    () => capabilityModels.find((item) => item.id === activeScheme?.capabilityModelId) || null,
    [activeScheme?.capabilityModelId, capabilityModels],
  );

  const schemeModelOptions = useMemo(
    () => filterCapabilityModelsByTargetRole(capabilityModels, watchedSchemeTargetRole || activeScheme?.targetRole),
    [activeScheme?.targetRole, capabilityModels, watchedSchemeTargetRole],
  );

  const selectedSchemeFormModel = useMemo(
    () => capabilityModels.find((item) => item.id === watchedCapabilityModelId) || null,
    [capabilityModels, watchedCapabilityModelId],
  );

  const dimensionNameOptions = useMemo(
    () => (selectedSchemeFormModel?.dimensions || []).map((dimension) => ({
      label: dimension.name,
      value: dimension.name,
    })),
    [selectedSchemeFormModel],
  );

  const itemNameOptions = useMemo(
    () => (selectedSchemeFormModel?.dimensions || []).map((dimension) => ({
      label: dimension.name,
      options: (dimension.items || []).map((item) => ({
        label: item.name,
        value: item.name,
      })),
    })),
    [selectedSchemeFormModel],
  );

  const activeSchemeRecords = useMemo(
    () => records.filter((item) => item.schemeId === activeScheme?.id),
    [activeScheme?.id, records],
  );

  const schemeStats = useMemo(() => ({
    total: schemes.length,
    published: schemes.filter((item) => item.status === 'ACTIVE').length,
    records: activeSchemeRecords.length,
    inReview: activeSchemeRecords.filter((item) => item.status === 'IN_REVIEW').length,
  }), [activeSchemeRecords, schemes]);

  const rubricColumns = [
    {
      title: '评价项',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 220,
    },
    {
      title: '证据门槛',
      dataIndex: 'evidenceThreshold',
      key: 'evidenceThreshold',
    },
    {
      title: '评价主体',
      dataIndex: 'evaluatorRoles',
      key: 'evaluatorRoles',
      width: 220,
      render: (value) => (value || []).map((item) => <Tag key={item}>{item}</Tag>),
    },
    {
      title: 'AI 预填',
      dataIndex: 'aiAssistAllowed',
      key: 'aiAssistAllowed',
      width: 120,
      render: (value) => <Tag color={value ? 'processing' : 'default'}>{value ? '允许' : '不允许'}</Tag>,
    },
  ];

  function openSchemeDrawer(mode) {
    if (mode === 'edit' && activeScheme) {
      setEditingSchemeId(activeScheme.id);
      schemeForm.setFieldsValue(createSchemeFormValues(activeScheme));
    } else {
      setEditingSchemeId(undefined);
      schemeForm.setFieldsValue(createSchemeFormValues(activeScheme ? {
        ...activeScheme,
        id: undefined,
        name: '',
      } : null));
    }
    setSchemeDrawerOpen(true);
  }

  async function handleSaveScheme(values) {
    setSubmitting(true);
    try {
      const selectedModel = capabilityModels.find((item) => item.id === values.capabilityModelId) || null;
      const referencedDimensionKeys = selectedModel
        ? (values.dimensionWeights || [])
          .map((item) => selectedModel.dimensions?.find((dimension) => dimension.name === item.name)?.id)
          .filter(Boolean)
        : [];
      const referencedItemKeys = selectedModel
        ? (values.itemRubrics || [])
          .map((item) => selectedModel.dimensions?.flatMap((dimension) => dimension.items || [])
            .find((modelItem) => modelItem.name === item.itemName)?.id)
          .filter(Boolean)
        : [];
      const payload = {
        id: editingSchemeId,
        name: values.name,
        schemeType: values.schemeType,
        targetRole: values.targetRole,
        targetLevel: values.targetLevel,
        capabilityModelId: values.capabilityModelId,
        semester: values.semester,
        summary: values.summary,
        aiBoundary: values.aiBoundary,
        status: 'ACTIVE',
        referencedDimensionKeys,
        referencedItemKeys,
        dimensionWeights: (values.dimensionWeights || [])
          .filter((item) => item?.name)
          .map((item, index) => ({
            key: `dimension_${index + 1}`,
            name: item.name,
            weight: Number(item.weight) || 0,
          })),
        itemRubrics: (values.itemRubrics || [])
          .filter((item) => item?.itemName)
          .map((item, index) => ({
            key: `rubric_${index + 1}`,
            itemName: item.itemName,
            evidenceThreshold: item.evidenceThreshold,
            evaluatorRoles: item.evaluatorRoles || [],
            aiAssistAllowed: Boolean(item.aiAssistAllowed),
          })),
        reviewFlow: (values.reviewFlow || [])
          .filter((item) => item?.name && item?.owner)
          .map((item, index) => ({
            key: index === 0 ? 'submit' : index === (values.reviewFlow || []).length - 1 ? 'school_review' : `flow_${index + 1}`,
            name: item.name,
            owner: item.owner,
            output: item.output,
          })),
        aiAssistants: (values.aiAssistants || [])
          .filter((item) => item?.name)
          .map((item, index) => ({
            key: `assistant_${index + 1}`,
            name: item.name,
            roleScope: item.roleScope,
            responsibilities: item.responsibilities || [],
            restrictions: item.restrictions || [],
          })),
      };
      const saved = await teacherEvaluationApi.saveScheme(payload);
      message.success(editingSchemeId ? '评价方案已更新' : '评价方案已创建');
      setSchemeDrawerOpen(false);
      setActiveSchemeId(saved.id);
      await refreshData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteScheme() {
    if (!activeScheme) return;
    Modal.confirm({
      title: `删除方案「${activeScheme.name}」`,
      content: activeSchemeRecords.length
        ? `当前方案已关联 ${activeSchemeRecords.length} 个评价实例，不能直接删除。`
        : '删除后无法恢复。仅建议删除尚未被实例引用的测试方案。',
      okText: activeSchemeRecords.length ? '知道了' : '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true, disabled: activeSchemeRecords.length > 0 },
      onOk: async () => {
        if (activeSchemeRecords.length) return;
        try {
          await teacherEvaluationApi.deleteScheme(activeScheme.id, {
            operatorRole: 'SCHOOL_REVIEW',
            operatorName: '校级评审组',
          });
          message.success('评价方案已删除');
          await refreshData();
        } catch (error) {
          message.error(error?.message || '删除评价方案失败');
        }
      },
    });
  }

  function renderSchemeEditorDrawer() {
    return (
      <Drawer
        title={editingSchemeId ? '编辑评价方案' : '新建评价方案'}
        width={840}
        open={schemeDrawerOpen}
        onClose={() => setSchemeDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={schemeForm} onFinish={handleSaveScheme}>
          <div className="teacher-evaluation-form-grid">
            <Form.Item label="方案名称" name="name" rules={[{ required: true, message: '请输入方案名称' }]}>
              <Input placeholder="例如：双师型教师认定" />
            </Form.Item>
            <Form.Item label="评价类型" name="schemeType" rules={[{ required: true, message: '请选择评价类型' }]}>
              <Select options={SCHEME_TYPE_OPTIONS} placeholder="选择评价类型" />
            </Form.Item>
            <Form.Item label="目标角色" name="targetRole" rules={[{ required: true, message: '请选择目标角色' }]}>
              <Select
                options={TARGET_ROLE_OPTIONS}
                placeholder="选择目标角色"
                onChange={(value) => {
                  const targetLevelOptions = TARGET_LEVEL_OPTIONS[value] || [];
                  const currentTargetLevel = schemeForm.getFieldValue('targetLevel');
                  if (!targetLevelOptions.some((item) => item.value === currentTargetLevel)) {
                    schemeForm.setFieldValue('targetLevel', targetLevelOptions[0]?.value);
                  }
                  const currentModelId = schemeForm.getFieldValue('capabilityModelId');
                  if (currentModelId && !filterCapabilityModelsByTargetRole(capabilityModels, value).some((item) => item.id === currentModelId)) {
                    schemeForm.setFieldsValue({
                      capabilityModelId: undefined,
                      dimensionWeights: [],
                      itemRubrics: [],
                    });
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="目标层级" name="targetLevel" rules={[{ required: true, message: '请选择目标层级' }]}>
              <Select options={TARGET_LEVEL_OPTIONS[watchedSchemeTargetRole || '职教教师'] || []} placeholder="选择目标层级" />
            </Form.Item>
            <Form.Item label="关联能力模型" name="capabilityModelId" rules={[{ required: true, message: '请选择能力模型' }]}>
              <Select
                placeholder="选择能力模型"
                options={schemeModelOptions.map((model) => ({
                  label: `${model.name}${model.status !== 'PUBLISHED' ? `（${model.status === 'DRAFT' ? '草稿' : '停用'}）` : ''}`,
                  value: model.id,
                }))}
                onChange={(modelId) => {
                  const selectedModel = capabilityModels.find((item) => item.id === modelId);
                  if (!selectedModel) return;
                  const derived = buildSchemeDraftFromModel(selectedModel);
                  schemeForm.setFieldsValue({
                    dimensionWeights: derived.dimensionWeights,
                    itemRubrics: derived.itemRubrics,
                  });
                }}
              />
            </Form.Item>
            <Form.Item label="学期 / 周期" name="semester">
              <Input placeholder="例如：2026 秋季学期" />
            </Form.Item>
            <Form.Item label="AI 边界" name="aiBoundary">
              <Select options={AI_BOUNDARY_OPTIONS} placeholder="选择 AI 边界" />
            </Form.Item>
          </div>

          <Alert
            type="info"
            showIcon
            className="teacher-evaluation-inline-alert"
            message="选择能力模型后会同步默认维度权重和评价项"
            description="评价方案应基于能力模型派生。切换能力模型时，当前表单中的“维度权重”和“量规与证据门槛”会按所选模型重置为默认值。"
          />

          <Form.Item label="方案摘要" name="summary">
            <TextArea rows={3} placeholder="说明该方案服务于哪个场景、重点核验哪些能力。" />
          </Form.Item>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>维度权重（对应能力分类）</span>
              <Tag>{(schemeForm.getFieldValue('dimensionWeights') || []).length} 项</Tag>
            </div>
            <Form.List name="dimensionWeights">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-row">
                      <Form.Item {...field} name={[field.name, 'name']} label="维度名称" rules={[{ required: true, message: '请选择维度名称' }]}>
                        <Select options={dimensionNameOptions} placeholder={selectedSchemeFormModel ? '选择能力分类' : '请先关联能力模型'} disabled={!selectedSchemeFormModel} />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'weight']} label="权重">
                        <InputNumber min={0} max={100} precision={0} className="teacher-evaluation-full-width" />
                      </Form.Item>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ weight: 20 })} disabled={!selectedSchemeFormModel}>新增维度</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>量规与证据门槛（对应能力项目）</span>
            </div>
            <Form.List name="itemRubrics">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'itemName']} label="评价项" rules={[{ required: true, message: '请选择评价项' }]}>
                          <Select
                            options={itemNameOptions}
                            placeholder={selectedSchemeFormModel ? '选择能力项目' : '请先关联能力模型'}
                            disabled={!selectedSchemeFormModel}
                            onChange={(value) => {
                              const modelItem = selectedSchemeFormModel?.dimensions
                                ?.flatMap((dimension) => dimension.items || [])
                                .find((item) => item.name === value);
                              if (!modelItem) return;
                              const nextConfig = buildRubricConfigFromModelItem(modelItem);
                              schemeForm.setFields([
                                { name: ['itemRubrics', field.name, 'evidenceThreshold'], value: nextConfig.evidenceThreshold },
                                { name: ['itemRubrics', field.name, 'evaluatorRoles'], value: nextConfig.evaluatorRoles },
                                { name: ['itemRubrics', field.name, 'aiAssistAllowed'], value: nextConfig.aiAssistAllowed },
                              ]);
                            }}
                          />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'evaluatorRoles']} label="评价主体">
                          <Select mode="multiple" options={REVIEW_ROLE_LABEL_OPTIONS} placeholder="选择评价主体" />
                        </Form.Item>
                      </div>
                      <Form.Item noStyle shouldUpdate={(prev, current) => (
                        prev.itemRubrics?.[field.name]?.itemName !== current.itemRubrics?.[field.name]?.itemName
                      )}>
                        {() => {
                          const selectedItemName = schemeForm.getFieldValue(['itemRubrics', field.name, 'itemName']);
                          const modelItem = selectedSchemeFormModel?.dimensions
                            ?.flatMap((dimension) => dimension.items || [])
                            .find((item) => item.name === selectedItemName);
                          const thresholdOptions = buildRubricConfigFromModelItem(modelItem).evidenceThresholdOptions;
                          return (
                            <Form.Item {...field} name={[field.name, 'evidenceThreshold']} label="证据门槛">
                              <Select options={thresholdOptions} placeholder={modelItem ? '选择标准证据门槛' : '请先选择评价项'} disabled={!modelItem} />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                      <div className="teacher-evaluation-dynamic-grid teacher-evaluation-rubric-footer">
                        <Form.Item {...field} name={[field.name, 'aiAssistAllowed']} label="允许 AI 预填">
                          <Select options={[{ label: '允许', value: true }, { label: '不允许', value: false }]} />
                        </Form.Item>
                        <div className="teacher-evaluation-dynamic-actions">
                          <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除评价项</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ aiAssistAllowed: true })} disabled={!selectedSchemeFormModel}>新增评价项</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>评议流程</span>
            </div>
            <Form.List name="reviewFlow">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'name']} label="节点名称" rules={[{ required: true, message: '请选择节点名称' }]}>
                          <Select
                            options={REVIEW_FLOW_NODE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
                            placeholder="选择标准节点"
                            onChange={(value) => {
                              const node = REVIEW_FLOW_NODE_OPTIONS.find((item) => item.value === value);
                              if (!node) return;
                              schemeForm.setFields([
                                { name: ['reviewFlow', field.name, 'owner'], value: node.owner },
                                { name: ['reviewFlow', field.name, 'output'], value: node.output },
                              ]);
                            }}
                          />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'owner']} label="责任角色" rules={[{ required: true, message: '请选择责任角色' }]}>
                          <Select options={TEACHER_EVALUATION_ROLE_OPTIONS} />
                        </Form.Item>
                      </div>
                      <Form.Item {...field} name={[field.name, 'output']} label="节点输出">
                        <Select options={FLOW_OUTPUT_OPTIONS} placeholder="选择节点输出" />
                      </Form.Item>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除节点</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ owner: 'GROUP_LEADER' })}>新增流程节点</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-section">
            <div className="teacher-evaluation-form-section-head">
              <span>AI 辅助角色</span>
            </div>
            <Form.List name="aiAssistants">
              {(fields, { add, remove }) => (
                <div className="teacher-evaluation-dynamic-list">
                  {fields.map((field) => (
                    <div key={field.key} className="teacher-evaluation-dynamic-card">
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'name']} label="助手名称" rules={[{ required: true, message: '请选择助手名称' }]}>
                          <Select options={AI_ASSISTANT_NAME_OPTIONS} placeholder="选择 AI 助手" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'roleScope']} label="适用角色">
                          <Select options={AI_ROLE_SCOPE_OPTIONS} placeholder="选择适用角色" />
                        </Form.Item>
                      </div>
                      <div className="teacher-evaluation-dynamic-grid">
                        <Form.Item {...field} name={[field.name, 'responsibilities']} label="职责清单">
                          <Select mode="multiple" options={AI_RESPONSIBILITY_OPTIONS} placeholder="选择职责清单" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'restrictions']} label="限制边界">
                          <Select mode="multiple" options={AI_RESTRICTION_OPTIONS} placeholder="选择限制边界" />
                        </Form.Item>
                      </div>
                      <Button className="teacher-evaluation-inline-remove" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除助手</Button>
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ responsibilities: [], restrictions: [] })}>新增 AI 助手</Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="teacher-evaluation-form-footer">
            <Button onClick={() => setSchemeDrawerOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>保存方案</Button>
          </div>
        </Form>
      </Drawer>
    );
  }

  if (loading) {
    return <Spin className="teacher-evaluation-loading" />;
  }

  return (
    <div className="sys-module teacher-evaluation-module">
      <div className="sys-module-header">
        <div>
          <span className="sys-module-header-title">评价方案</span>
          <span className="sys-module-header-subtitle">教师评价方案的新增、查看、编辑和删除统一在此维护</span>
        </div>
        <Space wrap>
          <Button onClick={() => openSchemeDrawer('edit')} disabled={!activeScheme}>编辑方案</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteScheme} disabled={!activeScheme}>删除方案</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openSchemeDrawer('create')}>新建方案</Button>
        </Space>
      </div>

      <div className="sys-module-body">
        <div className="teacher-evaluation-page">
          <Alert
            showIcon
            type="info"
            className="teacher-evaluation-alert"
            message="评价方案与评审工作台已拆分"
            description="本模块专门维护评价方案配置；评审实例发起、证据审核、AI 建议稿确认和审计台账请在“教师评价”模块处理。"
          />

          <div className="teacher-evaluation-hero-grid">
            <Card bordered={false} className="teacher-evaluation-hero-card">
              <div className="teacher-evaluation-hero-kicker">方案库概览</div>
              <div className="teacher-evaluation-summary-grid">
                <div><strong>{schemeStats.total}</strong><span className="teacher-evaluation-muted">方案总数</span></div>
                <div><strong>{schemeStats.published}</strong><span className="teacher-evaluation-muted">启用中</span></div>
                <div><strong>{activeSchemeRecords.length}</strong><span className="teacher-evaluation-muted">当前方案实例</span></div>
                <div><strong>{schemeStats.inReview}</strong><span className="teacher-evaluation-muted">评审中实例</span></div>
              </div>
            </Card>
            <Card bordered={false} className="teacher-evaluation-hero-card">
              <div className="teacher-evaluation-hero-kicker">管理规则</div>
              <p>评价方案应绑定能力模型，维度和评价项从能力模型派生。已关联评价实例的方案禁止直接删除，避免破坏正式评价链路。</p>
              <div className="teacher-evaluation-meta-row">
                <Tag color="processing">方案层维护标准</Tag>
                <Tag color="warning">实例层处理评审</Tag>
              </div>
            </Card>
          </div>

          {schemes.length ? (
            <>
              <div className="teacher-evaluation-scheme-tabs">
                {schemes.map((scheme) => (
                  <button
                    key={scheme.id}
                    type="button"
                    className={`teacher-evaluation-scheme-chip ${scheme.id === activeScheme?.id ? 'is-active' : ''}`}
                    onClick={() => setActiveSchemeId(scheme.id)}
                  >
                    <strong>{scheme.name}</strong>
                    <span>{scheme.targetLevel} · {scheme.semester}</span>
                  </button>
                ))}
              </div>

              {activeScheme ? (
                <div className="teacher-evaluation-section-stack">
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>方案概览</span>
                      <Space>
                        <Tag color="blue">{activeScheme.schemeType}</Tag>
                        <Tag color="purple">{activeScheme.targetLevel}</Tag>
                        <Tag color="orange">{activeScheme.semester}</Tag>
                        {activeCapabilityModel ? <Tag color="cyan">{activeCapabilityModel.name}</Tag> : <Tag color="warning">未关联能力模型</Tag>}
                      </Space>
                    </div>
                    <p className="teacher-evaluation-body-copy">{activeScheme.summary}</p>
                    <div className="teacher-evaluation-meta-row">
                      <Tag>{activeSchemeRecords.length} 个评价实例</Tag>
                      <Tag>{activeSchemeRecords.filter((item) => item.status === 'IN_REVIEW').length} 个评审中</Tag>
                      {activeCapabilityModel ? (
                        <>
                          <Tag>{activeCapabilityModel.modelCode}</Tag>
                          <Tag>{activeCapabilityModel.dimensions.length} 个维度</Tag>
                          <Tag>{activeScheme.referencedItemKeys?.length || 0} 个引用能力项</Tag>
                        </>
                      ) : null}
                    </div>
                  </Card>
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>维度权重</span>
                      <Tag>{activeScheme.dimensionWeights.length} 个维度</Tag>
                    </div>
                    <div className="teacher-evaluation-weight-grid">
                      {activeScheme.dimensionWeights.map((item) => (
                        <div key={item.key} className="teacher-evaluation-weight-item">
                          <strong>{item.name}</strong>
                          <Tag color={weightColor(item.weight)}>{item.weight}%</Tag>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>量规与证据门槛</span>
                      <Tag><AuditOutlined /> AI 仅预填建议项</Tag>
                    </div>
                    <Table rowKey="key" columns={rubricColumns} dataSource={activeScheme.itemRubrics} pagination={false} scroll={{ x: 880 }} />
                  </Card>
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>评议流程</span>
                      <Tag>{activeScheme.reviewFlow.length} 个节点</Tag>
                    </div>
                    <div className="teacher-evaluation-flow-list">
                      {activeScheme.reviewFlow.map((step, index) => (
                        <div key={step.key} className="teacher-evaluation-flow-card">
                          <div className="teacher-evaluation-flow-index">{index + 1}</div>
                          <div className="teacher-evaluation-flow-body">
                            <strong>{step.name}</strong>
                            <span>责任角色：{getNodeAllowedRoles(step).map((item) => getTeacherEvaluationRoleLabel(item)).join(' / ')}</span>
                            <p>{step.output}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card bordered={false} className="teacher-evaluation-card">
                    <div className="teacher-evaluation-card-head">
                      <span>AI 辅助角色</span>
                      <Tag color="processing">只做建议稿</Tag>
                    </div>
                    <div className="teacher-evaluation-hero-grid">
                      {activeScheme.aiAssistants.map((assistant) => (
                        <div key={assistant.key} className="teacher-evaluation-ai-draft-card">
                          <div className="teacher-evaluation-ai-draft-head">
                            <strong>{assistant.name}</strong>
                            <Tag color="blue">{assistant.roleScope}</Tag>
                          </div>
                          <div className="teacher-evaluation-tag-row">
                            {assistant.responsibilities.map((item) => <Tag key={item} color="processing">{item}</Tag>)}
                          </div>
                          <div className="teacher-evaluation-tag-row">
                            {assistant.restrictions.map((item) => <Tag key={item} color="red">{item}</Tag>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : null}
            </>
          ) : (
            <Card bordered={false} className="teacher-evaluation-card">
              <Empty
                description="暂无评价方案"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openSchemeDrawer('create')}>
                  新建第一个评价方案
                </Button>
              </Empty>
            </Card>
          )}
        </div>
      </div>

      {renderSchemeEditorDrawer()}
    </div>
  );
}
