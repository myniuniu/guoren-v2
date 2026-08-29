import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Empty, Form, Input, Modal, Radio, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  SaveOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import './SupervisionTaskModal.css';

const { TextArea } = Input;

const TASK_TEMPLATE_CATEGORY_OPTIONS = [
  { label: '综合督学', value: 'comprehensive' },
  { label: '专项督学', value: 'special' },
  { label: '应急督学', value: 'emergency' },
  { label: '其他', value: 'other' },
];

const TASK_MODE_OPTIONS = [
  {
    value: 'school',
    title: '学校级任务',
    description: '按学校展开督导，每所学校独立评估',
    icon: <BankOutlined />,
  },
  {
    value: 'data',
    title: '数据型任务',
    description: '直接录入数据，不关联学校',
    icon: <DatabaseOutlined />,
  },
];

const LEGACY_TASK_TEMPLATE_NAMES = new Set([
  '综合督学评估模板',
  '课堂教学专项督学模板',
  '应急督学检查模板',
  '其他督学任务模板',
]);

const SCHOOL_RECORDS = [
  { id: 'school_hz_xihu_voc', name: '杭州市西湖职业高级中学', province: '浙江省', city: '杭州市', district: '西湖区', nature: '中职学校' },
  { id: 'school_hz_xihu_digital', name: '杭州市电子信息职业学校', province: '浙江省', city: '杭州市', district: '西湖区', nature: '中职学校' },
  { id: 'school_hz_xihu_edu', name: '杭州西湖职业教育中心', province: '浙江省', city: '杭州市', district: '西湖区', nature: '中职学校' },
  { id: 'school_hz_yuhang_college', name: '杭州职业技术学院', province: '浙江省', city: '杭州市', district: '余杭区', nature: '高职院校' },
  { id: 'school_hz_yuhang_poly', name: '杭州未来科技城职业学院', province: '浙江省', city: '杭州市', district: '余杭区', nature: '高职院校' },
  { id: 'school_nb_jiangbei_voc', name: '宁波市江北职业技术学校', province: '浙江省', city: '宁波市', district: '江北区', nature: '中职学校' },
  { id: 'school_wh_optics_college', name: '武汉光谷职业学院', province: '湖北省', city: '武汉市', district: '洪山区', nature: '高职院校' },
  { id: 'school_wh_hongshan_voc', name: '武汉市洪山职业技术学校', province: '湖北省', city: '武汉市', district: '洪山区', nature: '中职学校' },
  { id: 'school_wh_hanyang_voc', name: '武汉市汉阳区职业教育中心', province: '湖北省', city: '武汉市', district: '汉阳区', nature: '中职学校' },
  { id: 'school_cd_jinniu_voc', name: '成都市金牛区职业技术学校', province: '四川省', city: '成都市', district: '金牛区', nature: '中职学校' },
  { id: 'school_cd_hightech_college', name: '成都高新职业学院', province: '四川省', city: '成都市', district: '高新区', nature: '高职院校' },
  { id: 'school_sz_nanshan_voc', name: '深圳市南山区职业技术学校', province: '广东省', city: '深圳市', district: '南山区', nature: '中职学校' },
  { id: 'school_sz_nanshan_digital', name: '深圳南山信息技术学校', province: '广东省', city: '深圳市', district: '南山区', nature: '中职学校' },
  { id: 'school_gz_tianhe_college', name: '广州天河职业学院', province: '广东省', city: '广州市', district: '天河区', nature: '高职院校' },
];

const SUPERVISION_TASK_ASSIGNMENT_PEOPLE = [
  { value: 'inspector_chen_lijun', label: '陈立军', role: '督导组长' },
  { value: 'inspector_zhao_yan', label: '赵妍', role: '课堂观察' },
  { value: 'inspector_wang_xiaomin', label: '王晓敏', role: '材料核验' },
  { value: 'inspector_li_ming', label: '李明', role: '数据复核' },
  { value: 'inspector_zhou_yuqing', label: '周雨晴', role: '整改跟进' },
  { value: 'inspector_sun_haoran', label: '孙浩然', role: '综合协调' },
];

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].map((value) => ({ label: value, value }));
}

function getTemplateCategory(template) {
  const text = `${template?.templateType || ''} ${template?.purpose || ''} ${template?.name || ''}`;
  if (/综合/.test(text)) return 'comprehensive';
  if (/应急/.test(text)) return 'emergency';
  if (/专项|巡课|听课/.test(text)) return 'special';
  return 'other';
}

function getCategoryLabel(value) {
  return TASK_TEMPLATE_CATEGORY_OPTIONS.find((item) => item.value === value)?.label || '其他';
}

function getTaskModeLabel(value) {
  return TASK_MODE_OPTIONS.find((item) => item.value === value)?.title || '学校级任务';
}

function getCategoryValueFromText(text = '') {
  if (/综合/.test(text)) return 'comprehensive';
  if (/应急/.test(text)) return 'emergency';
  if (/专项|巡课|听课/.test(text)) return 'special';
  return 'other';
}

function isLegacyTaskTemplateRef(id = '', name = '') {
  return String(id || '').startsWith('fallback_') || LEGACY_TASK_TEMPLATE_NAMES.has(String(name || ''));
}

function normalizeSupervisionTemplateOption(template = {}) {
  return {
    ...template,
    id: template.id || template.templateCode || template.name,
    dimensions: Array.isArray(template.dimensions) ? template.dimensions : [],
    indicators: Array.isArray(template.indicators) ? template.indicators : [],
  };
}

function formatDate(value) {
  if (!value) return '';
  if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
  return String(value);
}

function parseDateValue(value) {
  if (!value) return null;
  if (typeof value === 'object' && typeof value.format === 'function') return value;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function formatCurrentDateTimeText() {
  return new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');
}

function getTaskDescription(resource) {
  const paragraphs = Array.isArray(resource?.meta?.paragraphs) ? resource.meta.paragraphs : [];
  const descriptionParagraph = paragraphs.find((paragraph) => String(paragraph || '').startsWith('任务描述：'));
  return descriptionParagraph ? descriptionParagraph.replace(/^任务描述：/, '') : '';
}

function getStoredTaskAssigneeIds(resource) {
  const task = resource?.meta?.supervisionTask || {};
  if (Array.isArray(task.assignedPersonIds)) return task.assignedPersonIds.filter(Boolean);
  if (Array.isArray(task.assignedPeople)) {
    return task.assignedPeople
      .map((person) => person?.id || person?.value || person?.name)
      .filter(Boolean);
  }
  return [];
}

function resolveTaskAssignedPeople(ids = [], storedPeople = []) {
  const peopleMap = new Map(SUPERVISION_TASK_ASSIGNMENT_PEOPLE.map((person) => [
    person.value,
    { id: person.value, name: person.label, role: person.role },
  ]));
  storedPeople.forEach((person) => {
    const id = person?.id || person?.value || person?.name;
    if (!id || peopleMap.has(id)) return;
    peopleMap.set(id, {
      id,
      name: person.name || person.label || id,
      role: person.role || '督导人员',
    });
  });
  return ids.map((id) => peopleMap.get(id)).filter(Boolean);
}

function getStoredTaskSchools(resource) {
  const task = resource?.meta?.supervisionTask || {};
  const storedSchools = Array.isArray(task.targetSchools) ? task.targetSchools : [];
  if (storedSchools.length) {
    return storedSchools
      .filter((school) => school?.name)
      .map((school, index) => ({
        id: school.id || `stored_school_${index + 1}`,
        name: school.name,
        province: school.province || task.schoolFilter?.province || '',
        city: school.city || task.schoolFilter?.city || '',
        district: school.district || task.schoolFilter?.district || '',
        nature: school.nature || task.schoolFilter?.nature || '检查对象',
      }));
  }
  if (task.target) {
    const matchedSchool = SCHOOL_RECORDS.find((school) => school.name === task.target);
    if (matchedSchool) return [matchedSchool];
    if (!/学校|学院|校区|职教|职业/.test(task.target)) return [];
    return [{
      id: 'stored_legacy_target',
      name: task.target,
      province: task.schoolFilter?.province || '',
      city: task.schoolFilter?.city || '',
      district: task.schoolFilter?.district || '',
      nature: task.schoolFilter?.nature || '检查对象',
    }];
  }
  return [];
}

function buildTemplateOptions(templates = [], resource = null) {
  const normalized = templates
    .filter(Boolean)
    .map((template) => normalizeSupervisionTemplateOption(template))
    .filter((template) => template.id && template.status !== 'DISABLED' && !isLegacyTaskTemplateRef(template.id, template.name));
  const task = resource?.meta?.supervisionTask || {};
  const currentTemplateId = task.templateId || '';
  const currentTemplateName = task.templateName || resource?.meta?.templateName || '';
  const hasCurrentTemplate = normalized.some((template) => (
    (currentTemplateId && template.id === currentTemplateId)
    || (currentTemplateName && template.name === currentTemplateName)
  ));
  if ((currentTemplateId || currentTemplateName) && !hasCurrentTemplate && task.templateSnapshot) {
    const snapshot = normalizeSupervisionTemplateOption(task.templateSnapshot);
    if (snapshot.id && !isLegacyTaskTemplateRef(snapshot.id, snapshot.name)) {
      normalized.unshift(snapshot);
    }
  }
  return normalized;
}

function buildSupervisionTaskFormValues({ resource = null, templates = [], initialName = '' } = {}) {
  const task = resource?.meta?.supervisionTask || {};
  const availableTemplates = buildTemplateOptions(templates, resource);
  const selectedTemplate = !isLegacyTaskTemplateRef(task.templateId, task.templateName)
    ? availableTemplates.find((template) => (
        (task.templateId && template.id === task.templateId)
        || (task.templateName && template.name === task.templateName)
      ))
    : null;
  const fallbackTemplate = selectedTemplate || availableTemplates[0] || null;
  const templateCategory = selectedTemplate
    ? getTemplateCategory(selectedTemplate)
    : fallbackTemplate
      ? getTemplateCategory(fallbackTemplate)
      : getCategoryValueFromText(task.templateCategoryLabel || task.templateName || '');
  const categoryTemplates = availableTemplates.filter((template) => getTemplateCategory(template) === templateCategory);
  const firstTemplate = selectedTemplate || categoryTemplates[0] || fallbackTemplate;
  const selectedSchools = getStoredTaskSchools(resource);
  const firstSchool = selectedSchools[0] || null;

  return {
    templateCategory,
    taskMode: task.taskMode || (task.taskModeLabel === '数据型任务' ? 'data' : 'school'),
    name: resource?.name || initialName || '',
    templateId: firstTemplate?.id,
    province: task.schoolFilter?.province || firstSchool?.province,
    city: task.schoolFilter?.city || firstSchool?.city,
    district: task.schoolFilter?.district || firstSchool?.district,
    schoolNature: task.schoolFilter?.nature || firstSchool?.nature,
    schoolKeyword: '',
    targetSchoolIds: selectedSchools.map((school) => school.id).filter(Boolean),
    assignedPersonIds: getStoredTaskAssigneeIds(resource),
    startDate: parseDateValue(task.startDate || resource?.lastEdit?.split(' ')[0]),
    endDate: parseDateValue(task.endDate || task.dueDate),
    description: getTaskDescription(resource),
  };
}

function buildSupervisionTaskResource(values, templates = [], resource = null) {
  const availableTemplates = buildTemplateOptions(templates, resource);
  const selectedTemplate = availableTemplates.find((template) => template.id === values.templateId) || null;
  const schoolSourceMap = new Map([
    ...SCHOOL_RECORDS.map((school) => [school.id, school]),
    ...getStoredTaskSchools(resource).map((school) => [school.id, school]),
  ]);
  const selectedSchools = (values.targetSchoolIds || []).map((schoolId) => schoolSourceMap.get(schoolId)).filter(Boolean);
  const startDate = formatDate(values.startDate);
  const endDate = formatDate(values.endDate);
  const taskModeLabel = getTaskModeLabel(values.taskMode);
  const taskTemplateCategoryLabel = getCategoryLabel(values.templateCategory);
  const schoolNames = selectedSchools.map((school) => school.name);
  const storedAssignedPeople = Array.isArray(resource?.meta?.supervisionTask?.assignedPeople)
    ? resource.meta.supervisionTask.assignedPeople
    : [];
  const assignedPersonIds = Array.isArray(values.assignedPersonIds)
    ? values.assignedPersonIds.filter(Boolean)
    : getStoredTaskAssigneeIds(resource);
  const assignedPeople = resolveTaskAssignedPeople(assignedPersonIds, storedAssignedPeople);
  const name = String(values.name || '').trim();
  const summary = values.taskMode === 'school'
    ? `${taskTemplateCategoryLabel} · ${selectedTemplate?.name || '未选择模板'} · ${schoolNames.length} 所学校 · ${startDate} 至 ${endDate}`
    : `${taskTemplateCategoryLabel} · ${selectedTemplate?.name || '未选择模板'} · 数据型任务 · ${startDate} 至 ${endDate}`;

  return {
    name,
    type: 'supervisionTask',
    fileType: 'supervisionTask',
    meta: {
      summary,
      supervisionTask: {
        status: resource?.meta?.supervisionTask?.status || '待发布',
        taskMode: values.taskMode,
        taskModeLabel,
        templateCategory: values.templateCategory,
        templateCategoryLabel: taskTemplateCategoryLabel,
        templateId: values.templateId,
        templateName: selectedTemplate?.name || '',
        templateType: selectedTemplate?.templateType || '',
        templateSnapshot: selectedTemplate ? {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          templateType: selectedTemplate.templateType || '',
          evaluationMode: selectedTemplate.evaluationMode || '',
          dimensions: selectedTemplate.dimensions || [],
          indicators: selectedTemplate.indicators || [],
        } : null,
        evaluationMode: 'HYBRID',
        evaluationModeLabel: 'AI + 人工',
        startDate,
        endDate,
        schoolFilter: {
          province: values.province || '',
          city: values.city || '',
          district: values.district || '',
          nature: values.schoolNature || '',
        },
        targetSchools: selectedSchools,
        schoolCount: selectedSchools.length,
        assignedPersonIds,
        assignedPeople,
        assignmentUpdatedAt: values.assignmentUpdatedAt
          || resource?.meta?.supervisionTask?.assignmentUpdatedAt
          || '',
      },
      paragraphs: [
        `任务模式：${taskModeLabel}。`,
        `评估模板：${selectedTemplate?.name || '未选择模板'}。`,
        values.taskMode === 'school'
          ? `被评估学校：${schoolNames.join('、') || '未选择学校'}。`
          : '该任务为数据型任务，不关联学校，可直接录入督导数据。',
        `任务周期：${startDate} 至 ${endDate}。`,
        values.description ? `任务描述：${values.description}` : '任务描述：待补充检查重点、执行安排和结果提交要求。',
      ],
    },
  };
}

export function SupervisionTaskInlineForm({
  item,
  templates = [],
  canEdit = true,
  onSubmit,
  onSubmitTask,
}) {
  const [form] = Form.useForm();
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState([]);

  const taskMode = Form.useWatch('taskMode', form) || 'school';
  const templateCategory = Form.useWatch('templateCategory', form) || 'special';
  const selectedProvince = Form.useWatch('province', form);
  const selectedCity = Form.useWatch('city', form);
  const selectedDistrict = Form.useWatch('district', form);
  const selectedNature = Form.useWatch('schoolNature', form);
  const schoolKeyword = Form.useWatch('schoolKeyword', form) || '';
  const watchedSchoolIds = Form.useWatch('targetSchoolIds', form);
  const selectedSchoolIds = useMemo(() => (
    Array.isArray(watchedSchoolIds) ? watchedSchoolIds : []
  ), [watchedSchoolIds]);

  const availableTemplates = useMemo(() => buildTemplateOptions(templates, item), [item, templates]);
  const initialValues = useMemo(() => (
    buildSupervisionTaskFormValues({ resource: item, templates })
  ), [item, templates]);
  const taskMeta = item?.meta?.supervisionTask || {};
  const assignedPeople = useMemo(() => (
    resolveTaskAssignedPeople(
      getStoredTaskAssigneeIds(item),
      Array.isArray(taskMeta.assignedPeople) ? taskMeta.assignedPeople : [],
    )
  ), [item, taskMeta.assignedPeople]);
  const assignmentOptions = useMemo(() => SUPERVISION_TASK_ASSIGNMENT_PEOPLE.map((person) => ({
    value: person.value,
    label: (
      <span className="supervision-assignment-option">
        <span>{person.label}</span>
        <span>{person.role}</span>
      </span>
    ),
    searchText: `${person.label}${person.role}`.toLowerCase(),
  })), []);
  const storedSchools = useMemo(() => getStoredTaskSchools(item), [item]);
  const templateCategoryCounts = useMemo(() => (
    new Map(TASK_TEMPLATE_CATEGORY_OPTIONS.map((option) => [
      option.value,
      availableTemplates.filter((template) => getTemplateCategory(template) === option.value).length,
    ]))
  ), [availableTemplates]);
  const categoryTemplates = useMemo(() => {
    const matched = availableTemplates.filter((template) => getTemplateCategory(template) === templateCategory);
    return matched.length ? matched : availableTemplates;
  }, [availableTemplates, templateCategory]);

  const provinceOptions = useMemo(() => uniqueOptions([
    ...SCHOOL_RECORDS.map((school) => school.province),
    ...storedSchools.map((school) => school.province),
  ]), [storedSchools]);
  const cityOptions = useMemo(() => (
    uniqueOptions([
      ...SCHOOL_RECORDS,
      ...storedSchools,
    ]
      .filter((school) => !selectedProvince || school.province === selectedProvince)
      .map((school) => school.city))
  ), [selectedProvince, storedSchools]);
  const districtOptions = useMemo(() => (
    uniqueOptions([
      ...SCHOOL_RECORDS,
      ...storedSchools,
    ]
      .filter((school) => (!selectedProvince || school.province === selectedProvince) && (!selectedCity || school.city === selectedCity))
      .map((school) => school.district))
  ), [selectedCity, selectedProvince, storedSchools]);
  const schoolNatureOptions = useMemo(() => uniqueOptions([
    ...SCHOOL_RECORDS.map((school) => school.nature),
    ...storedSchools.map((school) => school.nature),
  ]), [storedSchools]);

  const schoolListReady = Boolean(selectedProvince && selectedCity && selectedDistrict);
  const isSchoolTask = taskMode !== 'data';
  const visibleSchools = useMemo(() => {
    const keyword = schoolKeyword.trim().toLowerCase();
    const combinedSchools = [
      ...SCHOOL_RECORDS,
      ...storedSchools.filter((storedSchool) => !SCHOOL_RECORDS.some((school) => school.id === storedSchool.id)),
    ];
    const matchedSchools = schoolListReady
      ? combinedSchools.filter((school) => (
        (!selectedProvince || school.province === selectedProvince)
        && (!selectedCity || school.city === selectedCity)
        && (!selectedDistrict || school.district === selectedDistrict)
        && (!selectedNature || school.nature === selectedNature)
        && (!keyword || school.name.toLowerCase().includes(keyword))
      ))
      : [];
    const selectedStoredSchools = combinedSchools.filter((school) => selectedSchoolIds.includes(school.id));
    return [
      ...selectedStoredSchools,
      ...matchedSchools.filter((school) => !selectedSchoolIds.includes(school.id)),
    ];
  }, [
    schoolKeyword,
    schoolListReady,
    selectedCity,
    selectedDistrict,
    selectedNature,
    selectedProvince,
    selectedSchoolIds,
    storedSchools,
  ]);
  const schoolSelectOptions = useMemo(() => visibleSchools.map((school) => ({
    value: school.id,
    label: school.name,
    searchText: `${school.name}${school.province}${school.city}${school.district}${school.nature}`.toLowerCase(),
  })), [visibleSchools]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setAssignmentDraft(initialValues.assignedPersonIds || []);
  }, [form, initialValues]);

  const handleTemplateCategoryChange = (event) => {
    const nextCategory = event.target.value;
    const matchedTemplates = availableTemplates.filter((template) => getTemplateCategory(template) === nextCategory);
    const nextTemplate = matchedTemplates[0] || availableTemplates[0] || null;
    form.setFieldsValue({
      templateCategory: nextCategory,
      templateId: nextTemplate?.id,
    });
  };

  const handleTaskModeChange = (event) => {
    const nextMode = event.target.value;
    form.setFieldsValue({
      taskMode: nextMode,
      targetSchoolIds: nextMode === 'data' ? [] : form.getFieldValue('targetSchoolIds'),
    });
  };

  const handleSchoolFilterChange = (field, value) => {
    const resetValues = {
      [field]: value,
    };
    if (field === 'province') {
      resetValues.city = undefined;
      resetValues.district = undefined;
    }
    if (field === 'city') {
      resetValues.district = undefined;
    }
    form.setFieldsValue(resetValues);
  };

  const buildValuesWithAssignment = (values, nextAssignmentDraft = assignmentDraft, assignmentUpdatedAt = '') => ({
    ...values,
    assignedPersonIds: nextAssignmentDraft,
    assignmentUpdatedAt,
  });

  const handleOpenAssignment = () => {
    setAssignmentDraft(getStoredTaskAssigneeIds(item));
    setAssignmentOpen(true);
  };

  const handleCancelAssignment = () => {
    setAssignmentDraft(getStoredTaskAssigneeIds(item));
    setAssignmentOpen(false);
  };

  const handleSaveAssignment = () => {
    const values = {
      ...initialValues,
      ...form.getFieldsValue(true),
    };
    onSubmit?.(buildSupervisionTaskResource(
      buildValuesWithAssignment(values, assignmentDraft, formatCurrentDateTimeText()),
      availableTemplates,
      item,
    ));
    setAssignmentOpen(false);
  };

  const handleFinish = (values) => {
    onSubmit?.(buildSupervisionTaskResource(buildValuesWithAssignment(values), availableTemplates, item));
  };

  const handleSubmitTask = async () => {
    try {
      const values = await form.validateFields();
      onSubmitTask?.(buildSupervisionTaskResource(buildValuesWithAssignment(values), availableTemplates, item));
    } catch {
      // 表单项会显示具体校验提示。
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={!canEdit}
      onFinish={handleFinish}
      requiredMark={false}
      className="supervision-task-inline-form"
    >
	      <div className="supervision-task-inline-shell">
	        <div className="supervision-task-inline-head">
	          <div>
	            <div className="supervision-task-title">{item?.name || '督学任务表单'}</div>
	          </div>
	          <div className="supervision-task-inline-actions">
	            <Tag color={(item?.meta?.supervisionTask?.status || '待发布') === '待发布' ? 'blue' : 'success'}>
	              {item?.meta?.supervisionTask?.status || '待发布'}
	            </Tag>
	            <Button icon={<TeamOutlined />} onClick={handleOpenAssignment} disabled={!canEdit}>任务分配</Button>
	            <Button icon={<SaveOutlined />} htmlType="submit" disabled={!canEdit}>保存任务</Button>
	            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmitTask} disabled={!canEdit}>提交任务</Button>
	          </div>
	        </div>

        <section className="supervision-task-card supervision-task-inline-card">
          <div className="supervision-task-section-title">选择评估模板</div>
          <Form.Item name="templateCategory" className="supervision-task-inline-form-item">
            <Radio.Group onChange={handleTemplateCategoryChange}>
              {TASK_TEMPLATE_CATEGORY_OPTIONS.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  disabled={availableTemplates.length > 0 && !templateCategoryCounts.get(option.value)}
                >
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </section>

        <section className="supervision-task-card supervision-task-inline-card">
          <div className="supervision-task-section-head">
            <div className="supervision-task-section-title">任务基本信息</div>
          </div>

          <Form.Item
            label={<span className="supervision-task-required-label">任务模式</span>}
            name="taskMode"
            rules={[{ required: true, message: '请选择任务模式' }]}
          >
            <Radio.Group className="supervision-task-mode-grid" onChange={handleTaskModeChange}>
              {TASK_MODE_OPTIONS.map((option) => (
                <Radio.Button key={option.value} value={option.value} className="supervision-task-mode-card">
                  <span className="supervision-task-mode-icon">{option.icon}</span>
                  <span className="supervision-task-mode-copy">
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <div className="supervision-task-hybrid-card">
            <div>
              <div className="supervision-task-hybrid-title">混合评估模式</div>
              <div className="supervision-task-hybrid-desc">每个指标可独立设置 AI 评估或人工评估，在模板编辑时为各指标指定评估方式</div>
            </div>
            <div className="supervision-task-hybrid-badges">
              <Tag color="blue">AI</Tag>
              <span>+</span>
              <Tag>人工</Tag>
            </div>
          </div>

          <div className="supervision-task-form-grid">
            <Form.Item
              label={<span className="supervision-task-required-label">任务名称</span>}
              name="name"
              rules={[
                { required: true, message: '请输入任务名称' },
                {
                  validator: (_, value) => (
                    String(value || '').trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入任务名称'))
                  ),
                },
              ]}
            >
              <Input placeholder="请输入任务名称" />
            </Form.Item>

            <Form.Item
              label={<span className="supervision-task-required-label">任务模板</span>}
              name="templateId"
              rules={[{ required: true, message: '请选择任务模板' }]}
            >
              <Select
                placeholder="请选择任务模板"
                options={categoryTemplates.map((template) => ({
                  label: template.name,
                  value: template.id,
                }))}
                notFoundContent="暂无可用督导模板"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>

	          <div className={`supervision-task-school-section ${isSchoolTask ? '' : 'is-disabled'}`}>
	            <div className="supervision-task-school-head">
	              <span className="supervision-task-required-label">被评估学校</span>
	            </div>
	            <div className="supervision-task-school-toolbar">
              <Form.Item name="province" noStyle>
                <Select
                  allowClear
                  disabled={!isSchoolTask || !canEdit}
                  placeholder="全部省份"
                  options={provinceOptions}
                  onChange={(value) => handleSchoolFilterChange('province', value)}
                />
              </Form.Item>
              <Form.Item name="city" noStyle>
                <Select
                  allowClear
                  disabled={!isSchoolTask || !selectedProvince || !canEdit}
                  placeholder="全部地市"
                  options={cityOptions}
                  onChange={(value) => handleSchoolFilterChange('city', value)}
                />
              </Form.Item>
              <Form.Item name="district" noStyle>
                <Select
                  allowClear
                  disabled={!isSchoolTask || !selectedCity || !canEdit}
                  placeholder="全部区县"
                  options={districtOptions}
                  onChange={(value) => handleSchoolFilterChange('district', value)}
                />
              </Form.Item>
              <Form.Item name="schoolKeyword" noStyle>
                <Input
                  allowClear
                  disabled={!isSchoolTask || !canEdit}
                  prefix={<SearchOutlined />}
                  placeholder="全部学校"
                  onChange={(event) => {
                    form.setFieldsValue({
                      schoolKeyword: event.target.value,
                    });
                  }}
                />
              </Form.Item>
              <Form.Item name="schoolNature" noStyle>
                <Select
                  allowClear
                  disabled={!isSchoolTask || !canEdit}
                  placeholder="全部性质"
                  options={schoolNatureOptions}
                  onChange={(value) => handleSchoolFilterChange('schoolNature', value)}
                />
              </Form.Item>
            </div>
            <Form.Item
              name="targetSchoolIds"
              className="supervision-task-school-form-item"
              rules={[
                {
                  validator: (_, value) => {
                    if (form.getFieldValue('taskMode') === 'data') return Promise.resolve();
                    if (Array.isArray(value) && value.length > 0) return Promise.resolve();
                    return Promise.reject(new Error('请选择被评估学校'));
                  },
                },
              ]}
	            >
	              <Select
	                mode="multiple"
	                allowClear
	                showSearch
	                disabled={!isSchoolTask || !canEdit}
	                placeholder={isSchoolTask ? '请选择被评估学校（可多选）' : '数据型任务不关联学校'}
	                options={schoolSelectOptions}
	                optionFilterProp="searchText"
	                filterOption={(input, option) => (option?.searchText || '').includes(input.trim().toLowerCase())}
	                maxTagCount="responsive"
	                className="supervision-task-school-select"
	                notFoundContent={(
	                  <Empty
	                    image={Empty.PRESENTED_IMAGE_SIMPLE}
	                    description={isSchoolTask ? '请先选择省、市、区县以加载学校列表' : '数据型任务不关联学校'}
	                  />
	                )}
	              />
	            </Form.Item>
	          </div>

          <div className="supervision-task-form-grid">
            <Form.Item
              label={<span className="supervision-task-required-label">开始日期</span>}
              name="startDate"
              rules={[{ required: true, message: '请选择开始日期' }]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" suffixIcon={<CalendarOutlined />} />
            </Form.Item>
            <Form.Item
              label={<span className="supervision-task-required-label">结束日期</span>}
              name="endDate"
              dependencies={['startDate']}
              rules={[
                { required: true, message: '请选择结束日期' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('startDate');
                    if (!value || !startDate || !value.isBefore?.(startDate, 'day')) return Promise.resolve();
                    return Promise.reject(new Error('结束日期不能早于开始日期'));
                  },
                }),
              ]}
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" suffixIcon={<CalendarOutlined />} />
            </Form.Item>
          </div>

          <Form.Item label="任务描述" name="description">
            <TextArea rows={3} placeholder="请输入任务描述（可选）" />
          </Form.Item>
        </section>
      </div>
      <Modal
        title="任务分配"
        open={assignmentOpen}
        onCancel={handleCancelAssignment}
        onOk={handleSaveAssignment}
        okText="保存分配"
        cancelText="取消"
        destroyOnHidden
        okButtonProps={{ disabled: !canEdit }}
      >
        <div className="supervision-assignment-modal">
          <div className="supervision-assignment-context">
            <span>{item?.name || '督导任务'}</span>
            <span>
              {assignedPeople.length
                ? `当前执行人：${assignedPeople.map((person) => person.name).join('、')}`
                : '当前执行人：未分配'}
            </span>
          </div>
          <div className="supervision-assignment-label">选择督导人员</div>
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder="请选择一个或多个执行人"
            value={assignmentDraft}
            onChange={setAssignmentDraft}
            options={assignmentOptions}
            optionFilterProp="searchText"
            filterOption={(input, option) => (option?.searchText || '').includes(input.trim().toLowerCase())}
            className="supervision-assignment-select"
            maxTagCount="responsive"
          />
          <div className="supervision-assignment-hint">
            分配的是当前督导任务的执行人员，可选择多人协同完成学校检查、材料核验和整改跟进。
          </div>
        </div>
      </Modal>
    </Form>
  );
}

export default function SupervisionTaskModal({
  open,
  templates = [],
  initialName = '',
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const taskMode = Form.useWatch('taskMode', form) || 'school';
  const templateCategory = Form.useWatch('templateCategory', form) || 'special';
  const selectedProvince = Form.useWatch('province', form);
  const selectedCity = Form.useWatch('city', form);
  const selectedDistrict = Form.useWatch('district', form);
  const selectedNature = Form.useWatch('schoolNature', form);
  const schoolKeyword = Form.useWatch('schoolKeyword', form) || '';
  const watchedSchoolIds = Form.useWatch('targetSchoolIds', form);
  const selectedSchoolIds = useMemo(() => (
    Array.isArray(watchedSchoolIds) ? watchedSchoolIds : []
  ), [watchedSchoolIds]);

  const availableTemplates = useMemo(() => buildTemplateOptions(templates), [templates]);
  const templateCategoryCounts = useMemo(() => (
    new Map(TASK_TEMPLATE_CATEGORY_OPTIONS.map((option) => [
      option.value,
      availableTemplates.filter((template) => getTemplateCategory(template) === option.value).length,
    ]))
  ), [availableTemplates]);
  const categoryTemplates = useMemo(() => {
    const matched = availableTemplates.filter((template) => getTemplateCategory(template) === templateCategory);
    return matched.length ? matched : availableTemplates;
  }, [availableTemplates, templateCategory]);

  const provinceOptions = useMemo(() => uniqueOptions(SCHOOL_RECORDS.map((item) => item.province)), []);
  const cityOptions = useMemo(() => (
    uniqueOptions(SCHOOL_RECORDS
      .filter((item) => !selectedProvince || item.province === selectedProvince)
      .map((item) => item.city))
  ), [selectedProvince]);
  const districtOptions = useMemo(() => (
    uniqueOptions(SCHOOL_RECORDS
      .filter((item) => (!selectedProvince || item.province === selectedProvince) && (!selectedCity || item.city === selectedCity))
      .map((item) => item.district))
  ), [selectedCity, selectedProvince]);
  const schoolNatureOptions = useMemo(() => (
    uniqueOptions(SCHOOL_RECORDS.map((item) => item.nature))
  ), []);

  const schoolListReady = Boolean(selectedProvince && selectedCity && selectedDistrict);
  const isSchoolTask = taskMode !== 'data';
  const visibleSchools = useMemo(() => {
    const keyword = schoolKeyword.trim().toLowerCase();
    const matchedSchools = schoolListReady
      ? SCHOOL_RECORDS.filter((item) => (
        item.province === selectedProvince
        && item.city === selectedCity
        && item.district === selectedDistrict
        && (!selectedNature || item.nature === selectedNature)
        && (!keyword || item.name.toLowerCase().includes(keyword))
      ))
      : [];
    const selectedSchools = SCHOOL_RECORDS.filter((item) => selectedSchoolIds.includes(item.id));
    return [
      ...selectedSchools,
      ...matchedSchools.filter((item) => !selectedSchoolIds.includes(item.id)),
    ];
  }, [
    schoolKeyword,
    schoolListReady,
    selectedCity,
    selectedDistrict,
    selectedNature,
    selectedProvince,
      selectedSchoolIds,
    ]);
  const schoolSelectOptions = useMemo(() => visibleSchools.map((school) => ({
    value: school.id,
    label: school.name,
    searchText: `${school.name}${school.province}${school.city}${school.district}${school.nature}`.toLowerCase(),
  })), [visibleSchools]);

  useEffect(() => {
    if (!open) return;
    const defaultCategory = availableTemplates[0] ? getTemplateCategory(availableTemplates[0]) : 'special';
    const matchedTemplates = availableTemplates.filter((template) => getTemplateCategory(template) === defaultCategory);
    const firstTemplate = matchedTemplates[0] || availableTemplates[0] || null;
    form.setFieldsValue({
      templateCategory: defaultCategory,
      taskMode: 'school',
      name: initialName || '',
      templateId: firstTemplate?.id,
      province: undefined,
      city: undefined,
      district: undefined,
      schoolNature: undefined,
      schoolKeyword: '',
      targetSchoolIds: [],
      startDate: null,
      endDate: null,
      description: '',
    });
  }, [availableTemplates, form, initialName, open]);

  const handleTemplateCategoryChange = (event) => {
    const nextCategory = event.target.value;
    const matchedTemplates = availableTemplates.filter((template) => getTemplateCategory(template) === nextCategory);
    const nextTemplate = matchedTemplates[0] || availableTemplates[0] || null;
    form.setFieldsValue({
      templateCategory: nextCategory,
      templateId: nextTemplate?.id,
    });
  };

  const handleTaskModeChange = (event) => {
    const nextMode = event.target.value;
    form.setFieldsValue({
      taskMode: nextMode,
      targetSchoolIds: nextMode === 'data' ? [] : form.getFieldValue('targetSchoolIds'),
    });
  };

  const handleSchoolFilterChange = (field, value) => {
    const resetValues = {
      [field]: value,
    };
    if (field === 'province') {
      resetValues.city = undefined;
      resetValues.district = undefined;
    }
    if (field === 'city') {
      resetValues.district = undefined;
    }
    form.setFieldsValue(resetValues);
  };

  const handleFinish = (values) => {
    const selectedTemplate = availableTemplates.find((template) => template.id === values.templateId) || null;
    const selectedSchools = SCHOOL_RECORDS.filter((school) => (values.targetSchoolIds || []).includes(school.id));
    const startDate = formatDate(values.startDate);
    const endDate = formatDate(values.endDate);
    const taskModeLabel = getTaskModeLabel(values.taskMode);
    const taskTemplateCategoryLabel = getCategoryLabel(values.templateCategory);
    const schoolNames = selectedSchools.map((school) => school.name);
    const name = values.name.trim();
    const summary = values.taskMode === 'school'
      ? `${taskTemplateCategoryLabel} · ${selectedTemplate?.name || '未选择模板'} · ${schoolNames.length} 所学校 · ${startDate} 至 ${endDate}`
      : `${taskTemplateCategoryLabel} · ${selectedTemplate?.name || '未选择模板'} · 数据型任务 · ${startDate} 至 ${endDate}`;

    onSubmit?.({
      name,
      type: 'supervisionTask',
      fileType: 'supervisionTask',
      meta: {
        summary,
        supervisionTask: {
          status: '待发布',
          taskMode: values.taskMode,
          taskModeLabel,
          templateCategory: values.templateCategory,
          templateCategoryLabel: taskTemplateCategoryLabel,
          templateId: values.templateId,
          templateName: selectedTemplate?.name || '',
          templateType: selectedTemplate?.templateType || '',
          templateSnapshot: selectedTemplate ? {
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            templateType: selectedTemplate.templateType || '',
            evaluationMode: selectedTemplate.evaluationMode || '',
            dimensions: selectedTemplate.dimensions || [],
            indicators: selectedTemplate.indicators || [],
          } : null,
          evaluationMode: 'HYBRID',
          evaluationModeLabel: 'AI + 人工',
          startDate,
          endDate,
          schoolFilter: {
            province: values.province || '',
            city: values.city || '',
            district: values.district || '',
            nature: values.schoolNature || '',
          },
          targetSchools: selectedSchools,
          schoolCount: selectedSchools.length,
        },
        paragraphs: [
          `任务模式：${taskModeLabel}。`,
          `评估模板：${selectedTemplate?.name || '未选择模板'}。`,
          values.taskMode === 'school'
            ? `被评估学校：${schoolNames.join('、') || '未选择学校'}。`
            : '该任务为数据型任务，不关联学校，可直接录入督导数据。',
          `任务周期：${startDate} 至 ${endDate}。`,
          values.description ? `任务描述：${values.description}` : '任务描述：待补充检查重点、执行安排和结果提交要求。',
        ],
      },
    });
  };

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      closable={false}
      width={1180}
      centered
      destroyOnHidden
      className="supervision-task-modal"
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <div className="supervision-task-shell">
          <div className="supervision-task-header">
            <button type="button" className="supervision-task-back" onClick={onCancel} aria-label="返回">
              <ArrowLeftOutlined />
            </button>
            <div>
              <div className="supervision-task-title">新建督学任务</div>
              <div className="supervision-task-subtitle">创建新的督学评估任务并分配给执行人员</div>
            </div>
          </div>

          <section className="supervision-task-card">
            <div className="supervision-task-section-title">选择评估模板</div>
            <Form.Item name="templateCategory" className="supervision-task-inline-form-item">
            <Radio.Group onChange={handleTemplateCategoryChange}>
              {TASK_TEMPLATE_CATEGORY_OPTIONS.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  disabled={availableTemplates.length > 0 && !templateCategoryCounts.get(option.value)}
                >
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          </section>

          <section className="supervision-task-card">
            <div className="supervision-task-section-head">
              <div>
                <div className="supervision-task-section-title">任务基本信息</div>
              </div>
            </div>

            <Form.Item
              label={<span className="supervision-task-required-label">任务模式</span>}
              name="taskMode"
              rules={[{ required: true, message: '请选择任务模式' }]}
            >
              <Radio.Group className="supervision-task-mode-grid" onChange={handleTaskModeChange}>
                {TASK_MODE_OPTIONS.map((option) => (
                  <Radio.Button key={option.value} value={option.value} className="supervision-task-mode-card">
                    <span className="supervision-task-mode-icon">{option.icon}</span>
                    <span className="supervision-task-mode-copy">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </span>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            <div className="supervision-task-hybrid-card">
              <div>
                <div className="supervision-task-hybrid-title">混合评估模式</div>
                <div className="supervision-task-hybrid-desc">每个指标可独立设置 AI 评估或人工评估，在模板编辑时为各指标指定评估方式</div>
              </div>
              <div className="supervision-task-hybrid-badges">
                <Tag color="blue">AI</Tag>
                <span>+</span>
                <Tag>人工</Tag>
              </div>
            </div>

            <div className="supervision-task-form-grid">
              <Form.Item
                label={<span className="supervision-task-required-label">任务名称</span>}
                name="name"
                rules={[
                  { required: true, message: '请输入任务名称' },
                  {
                    validator: (_, value) => (
                      String(value || '').trim()
                        ? Promise.resolve()
                        : Promise.reject(new Error('请输入任务名称'))
                    ),
                  },
                ]}
              >
                <Input placeholder="请输入任务名称" />
              </Form.Item>

              <Form.Item
                label={<span className="supervision-task-required-label">任务模板</span>}
                name="templateId"
                rules={[{ required: true, message: '请选择任务模板' }]}
              >
                <Select
                  placeholder="请选择任务模板"
                  options={categoryTemplates.map((template) => ({
                    label: template.name,
                    value: template.id,
                  }))}
                  notFoundContent="暂无可用督导模板"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </div>

	            <div className={`supervision-task-school-section ${isSchoolTask ? '' : 'is-disabled'}`}>
	              <div className="supervision-task-school-head">
	                <span className="supervision-task-required-label">被评估学校</span>
	              </div>
              <div className="supervision-task-school-toolbar">
                <Form.Item name="province" noStyle>
                  <Select
                    allowClear
                    disabled={!isSchoolTask}
                    placeholder="全部省份"
                    options={provinceOptions}
                    onChange={(value) => handleSchoolFilterChange('province', value)}
                  />
                </Form.Item>
                <Form.Item name="city" noStyle>
                  <Select
                    allowClear
                    disabled={!isSchoolTask || !selectedProvince}
                    placeholder="全部地市"
                    options={cityOptions}
                    onChange={(value) => handleSchoolFilterChange('city', value)}
                  />
                </Form.Item>
                <Form.Item name="district" noStyle>
                  <Select
                    allowClear
                    disabled={!isSchoolTask || !selectedCity}
                    placeholder="全部区县"
                    options={districtOptions}
                    onChange={(value) => handleSchoolFilterChange('district', value)}
                  />
                </Form.Item>
                <Form.Item name="schoolKeyword" noStyle>
                  <Input
                    allowClear
                    disabled={!isSchoolTask}
                    prefix={<SearchOutlined />}
                    placeholder="全部学校"
                    onChange={(event) => {
                      form.setFieldsValue({
                        schoolKeyword: event.target.value,
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item name="schoolNature" noStyle>
                  <Select
                    allowClear
                    disabled={!isSchoolTask}
                    placeholder="全部性质"
                    options={schoolNatureOptions}
                    onChange={(value) => handleSchoolFilterChange('schoolNature', value)}
                  />
                </Form.Item>
              </div>
              <Form.Item
                name="targetSchoolIds"
                className="supervision-task-school-form-item"
                rules={[
                  {
                    validator: (_, value) => {
                      if (form.getFieldValue('taskMode') === 'data') return Promise.resolve();
                      if (Array.isArray(value) && value.length > 0) return Promise.resolve();
                      return Promise.reject(new Error('请选择被评估学校'));
                    },
                  },
                ]}
	              >
	                <Select
	                  mode="multiple"
	                  allowClear
	                  showSearch
	                  disabled={!isSchoolTask}
	                  placeholder={isSchoolTask ? '请选择被评估学校（可多选）' : '数据型任务不关联学校'}
	                  options={schoolSelectOptions}
	                  optionFilterProp="searchText"
	                  filterOption={(input, option) => (option?.searchText || '').includes(input.trim().toLowerCase())}
	                  maxTagCount="responsive"
	                  className="supervision-task-school-select"
	                  notFoundContent={(
	                    <Empty
	                      image={Empty.PRESENTED_IMAGE_SIMPLE}
	                      description={isSchoolTask ? '请先选择省、市、区县以加载学校列表' : '数据型任务不关联学校'}
	                    />
	                  )}
	                />
	              </Form.Item>
	            </div>

            <div className="supervision-task-form-grid">
              <Form.Item
                label={<span className="supervision-task-required-label">开始日期</span>}
                name="startDate"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" suffixIcon={<CalendarOutlined />} />
              </Form.Item>
              <Form.Item
                label={<span className="supervision-task-required-label">结束日期</span>}
                name="endDate"
                dependencies={['startDate']}
                rules={[
                  { required: true, message: '请选择结束日期' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate || !value.isBefore?.(startDate, 'day')) return Promise.resolve();
                      return Promise.reject(new Error('结束日期不能早于开始日期'));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" suffixIcon={<CalendarOutlined />} />
              </Form.Item>
            </div>

            <Form.Item label="任务描述" name="description">
              <TextArea rows={3} placeholder="请输入任务描述（可选）" />
            </Form.Item>
          </section>

          <div className="supervision-task-footer">
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">创建任务</Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
