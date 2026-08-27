import { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Empty, Form, Input, InputNumber, Radio, Tag } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './SupervisionTaskModal.css';

const { TextArea } = Input;

const UNGROUPED_DIMENSION_ID = 'ungrouped_indicators';

const LEGACY_TASK_TEMPLATE_NAMES = new Set([
  '综合督学评估模板',
  '课堂教学专项督学模板',
  '应急督学检查模板',
  '其他督学任务模板',
]);

function getStatusColor(status) {
  if (status === '已完成') return 'success';
  if (status === '填写中') return 'processing';
  return 'warning';
}

function isLegacyTaskTemplateRef(id = '', name = '') {
  return String(id || '').startsWith('fallback_') || LEGACY_TASK_TEMPLATE_NAMES.has(String(name || ''));
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeResultOptions(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean);
  return normalizeText(value)
    .split(/[、,，/｜|]/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function isActiveRecord(record) {
  const status = normalizeText(record?.status);
  return !['DISABLED', '停用', '已停用'].includes(status);
}

function getDimensionIdentityValues(dimension) {
  return [
    dimension.id,
    dimension.key,
    dimension.dimensionId,
    dimension.code,
    dimension.dimensionCode,
    dimension.name,
    dimension.dimensionName,
  ].map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeTaskTemplate(template = {}) {
  const rawDimensions = Array.isArray(template.dimensions) ? template.dimensions : [];
  const dimensions = rawDimensions.map((dimension, index) => {
    const code = normalizeText(dimension.code || dimension.dimensionCode);
    const name = normalizeText(dimension.name || dimension.dimensionName || dimension.title);
    const id = normalizeText(dimension.id || dimension.key || dimension.dimensionId || code || name || `dimension_${index + 1}`);
    return {
      ...dimension,
      id,
      code,
      name,
      level: normalizeText(dimension.level) || `${index + 1}级维度`,
      parentId: normalizeText(dimension.parentId || dimension.parentKey || dimension.parentDimensionId || dimension.parentCode),
      sortOrder: Number(dimension.sortOrder ?? dimension.order ?? index + 1) || index + 1,
      status: normalizeText(dimension.status) || 'ACTIVE',
    };
  });

  const dimensionIdentityMap = new Map();
  dimensions.forEach((dimension) => {
    getDimensionIdentityValues(dimension).forEach((identity) => {
      if (!dimensionIdentityMap.has(identity)) dimensionIdentityMap.set(identity, dimension.id);
    });
  });

  const normalizedDimensions = dimensions.map((dimension) => ({
    ...dimension,
    parentId: dimension.parentId ? dimensionIdentityMap.get(dimension.parentId) || dimension.parentId : '',
  }));

  const rawIndicators = Array.isArray(template.indicators) ? template.indicators : [];
  const indicators = rawIndicators.map((indicator, index) => {
    const code = normalizeText(indicator.code || indicator.indicatorCode);
    const name = normalizeText(indicator.name || indicator.indicatorName || indicator.title);
    const dimensionRef = normalizeText(
      indicator.dimensionId
      || indicator.dimensionKey
      || indicator.dimensionCode
      || indicator.dimensionName
      || indicator.parentDimensionId
      || indicator.parentId,
    );
    return {
      ...indicator,
      id: normalizeText(indicator.id || indicator.key || indicator.indicatorId || code || name || `indicator_${index + 1}`),
      code,
      name,
      dimensionId: dimensionIdentityMap.get(dimensionRef) || dimensionRef,
      resultOptions: normalizeResultOptions(indicator.resultOptions || indicator.options),
      indicatorType: normalizeText(indicator.indicatorType || indicator.type) || '检查项',
      scoringMethod: normalizeText(indicator.scoringMethod || indicator.scoreMode) || '人工评分',
      required: Boolean(indicator.required),
      sortOrder: Number(indicator.sortOrder ?? indicator.order ?? index + 1) || index + 1,
      status: normalizeText(indicator.status) || 'ACTIVE',
    };
  });

  return {
    ...template,
    id: normalizeText(template.id || template.templateId || template.key || template.name),
    name: normalizeText(template.name || template.templateName) || '当前任务模板',
    dimensions: normalizedDimensions,
    indicators,
  };
}

function resolveSchoolMeta(item) {
  const task = item?.meta?.supervisionSchoolTask || {};
  const school = task.school || {};
  return {
    id: task.schoolId || school.id || item?.key || '',
    name: task.schoolName || school.name || item?.name || '被评估学校',
    province: school.province || '',
    city: school.city || '',
    district: school.district || '',
    nature: school.nature || '检查对象',
  };
}

function resolveTaskTemplate(parentTask, templates = [], schoolTask = null) {
  const task = parentTask?.meta?.supervisionTask || {};
  const schoolMeta = schoolTask?.meta?.supervisionSchoolTask || {};
  const templateId = task.templateId || schoolMeta.templateId || '';
  const templateName = task.templateName || schoolMeta.templateName || '';
  const availableTemplates = templates
    .map((template) => normalizeTaskTemplate(template))
    .filter((template) => template?.id && isActiveRecord(template) && !isLegacyTaskTemplateRef(template.id, template.name));
  const matchedTemplate = !isLegacyTaskTemplateRef(templateId, templateName)
    ? availableTemplates.find((template) => (
        (templateId && template.id === templateId)
        || (templateName && template.name === templateName)
      ))
    : null;
  const snapshot = task.templateSnapshot || schoolMeta.templateSnapshot;
  const usableSnapshot = snapshot && !isLegacyTaskTemplateRef(snapshot.id, snapshot.name)
    ? normalizeTaskTemplate(snapshot)
    : null;
  const template = matchedTemplate || usableSnapshot || {
    id: templateId || 'unknown_template',
    name: templateName || '当前任务模板',
    dimensions: [],
    indicators: [],
  };

  return normalizeTaskTemplate(template);
}

function getDimensionPath(dimension, dimensionMap) {
  if (!dimension) return '未分组指标';
  const names = [];
  let cursor = dimension;
  const visitedIds = new Set();
  while (cursor && !visitedIds.has(cursor.id)) {
    visitedIds.add(cursor.id);
    names.unshift([cursor.code, cursor.name || '未命名维度'].filter(Boolean).join(' '));
    cursor = cursor.parentId ? dimensionMap.get(cursor.parentId) : null;
  }
  return names.join(' / ');
}

function compareBySortAndCode(left, right) {
  const orderGap = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
  if (orderGap !== 0) return orderGap;
  return String(left.code || left.name || '').localeCompare(String(right.code || right.name || ''), 'zh-CN');
}

function buildDimensionFramework(template) {
  const activeDimensions = template.dimensions
    .filter(isActiveRecord)
    .sort(compareBySortAndCode);
  const dimensionMap = new Map(activeDimensions.map((dimension) => [dimension.id, dimension]));
  const activeIndicators = template.indicators
    .filter(isActiveRecord)
    .sort(compareBySortAndCode);
  const childrenByParentId = new Map();
  const indicatorsByDimensionId = new Map();
  const nodeMap = new Map();
  const flatNodes = [];

  activeDimensions.forEach((dimension) => {
    const parentId = dimension.parentId && dimensionMap.has(dimension.parentId) ? dimension.parentId : '';
    if (!childrenByParentId.has(parentId)) childrenByParentId.set(parentId, []);
    childrenByParentId.get(parentId).push(dimension);
  });

  childrenByParentId.forEach((children) => children.sort(compareBySortAndCode));
  activeIndicators.forEach((indicator) => {
    const dimensionId = dimensionMap.has(indicator.dimensionId) ? indicator.dimensionId : UNGROUPED_DIMENSION_ID;
    if (!indicatorsByDimensionId.has(dimensionId)) indicatorsByDimensionId.set(dimensionId, []);
    indicatorsByDimensionId.get(dimensionId).push(indicator);
  });

  const buildNode = (dimension, level = 1) => {
    const node = {
      key: dimension.id,
      dimension,
      level,
      childCount: 0,
      indicatorCount: (indicatorsByDimensionId.get(dimension.id) || []).length,
      totalIndicatorCount: 0,
      indicators: indicatorsByDimensionId.get(dimension.id) || [],
      allIndicators: [],
      children: [],
    };
    nodeMap.set(node.key, node);
    flatNodes.push(node);
    node.children = (childrenByParentId.get(dimension.id) || []).map((child) => buildNode(child, level + 1));
    node.childCount = node.children.length;
    node.allIndicators = [
      ...node.indicators,
      ...node.children.flatMap((child) => child.allIndicators),
    ];
    node.totalIndicatorCount = node.allIndicators.length;
    return node;
  };

  const roots = (childrenByParentId.get('') || []).map((dimension) => buildNode(dimension, 1));
  const ungroupedIndicators = indicatorsByDimensionId.get(UNGROUPED_DIMENSION_ID) || [];

  if (ungroupedIndicators.length) {
    const ungroupedNode = {
      key: UNGROUPED_DIMENSION_ID,
      dimension: {
        id: UNGROUPED_DIMENSION_ID,
        code: '',
        name: '未分组指标',
        level: '未分组',
        sortOrder: 99999,
      },
      level: 1,
      childCount: 0,
      indicatorCount: ungroupedIndicators.length,
      totalIndicatorCount: ungroupedIndicators.length,
      indicators: ungroupedIndicators,
      allIndicators: ungroupedIndicators,
      children: [],
    };
    roots.push(ungroupedNode);
    nodeMap.set(ungroupedNode.key, ungroupedNode);
    flatNodes.push(ungroupedNode);
  }

  return {
    dimensionMap,
    indicators: activeIndicators,
    roots,
    flatNodes,
    nodeMap,
  };
}

function getVisibleDimensionNodes(nodes, collapsedIds) {
  const result = [];
  const walk = (items) => {
    items.forEach((node) => {
      result.push(node);
      if (!collapsedIds.has(node.key)) {
        walk(node.children);
      }
    });
  };

  walk(nodes);
  return result;
}

function isAiIndicator(indicator) {
  return /AI|智能|自动/.test(indicator?.scoringMethod || '');
}

function isNumericIndicator(indicator) {
  return /定量|数值|数量|比例|率|面积|人数|分值|得分/.test(`${indicator?.indicatorType || ''} ${indicator?.name || ''}`);
}

function hasInspectionValue(record = {}) {
  const numericValue = record.value;
  return Boolean(
    String(record.result || '').trim()
    || (numericValue !== undefined && numericValue !== null && String(numericValue).trim())
    || String(record.remark || '').trim()
    || String(record.evidenceNote || '').trim(),
  );
}

function buildInitialValues(item, indicators) {
  const storedValues = item?.meta?.supervisionSchoolTask?.indicatorValues || {};
  return {
    entries: Object.fromEntries(indicators.map((indicator) => [
      indicator.id,
      {
        result: storedValues[indicator.id]?.result,
        value: storedValues[indicator.id]?.value,
        remark: storedValues[indicator.id]?.remark,
        evidenceNote: storedValues[indicator.id]?.evidenceNote,
      },
    ])),
  };
}

function buildSchoolTaskResource({
  item,
  parentTask,
  template,
  values,
  indicators,
  school,
}) {
  const nowText = new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-');
  const rawEntries = values?.entries || {};
  const indicatorValues = Object.fromEntries(indicators.map((indicator) => {
    const entry = rawEntries[indicator.id] || {};
    return [
      indicator.id,
      {
        indicatorId: indicator.id,
        indicatorCode: indicator.code,
        indicatorName: indicator.name,
        result: entry.result || '',
        value: entry.value ?? '',
        remark: entry.remark || '',
        evidenceNote: entry.evidenceNote || '',
        updatedAt: hasInspectionValue(entry) ? nowText : '',
      },
    ];
  }));
  const filledIndicatorCount = indicators.filter((indicator) => hasInspectionValue(indicatorValues[indicator.id])).length;
  const requiredIndicators = indicators.filter((indicator) => indicator.required);
  const requiredFilledCount = requiredIndicators.filter((indicator) => hasInspectionValue(indicatorValues[indicator.id])).length;
  const status = requiredIndicators.length > 0 && requiredFilledCount === requiredIndicators.length
    ? '已完成'
    : filledIndicatorCount > 0
      ? '填写中'
      : '待检查';
  const parentTaskMeta = parentTask?.meta?.supervisionTask || {};
  const regionText = [school.province, school.city, school.district].filter(Boolean).join(' / ') || '未设置区域';

  return {
    ...item,
    name: school.name,
    type: 'supervisionSchoolTask',
    fileType: 'supervisionSchoolTask',
    meta: {
      ...(item?.meta || {}),
      summary: `${school.name} · ${template.name} · ${filledIndicatorCount}/${indicators.length} 项已填写`,
      supervisionSchoolTask: {
        ...(item?.meta?.supervisionSchoolTask || {}),
        status,
        parentTaskKey: parentTask?.key || item?.parentKey || '',
        parentTaskName: parentTask?.name || item?.meta?.supervisionSchoolTask?.parentTaskName || '',
        schoolId: school.id,
        schoolName: school.name,
        school,
        templateId: template.id || parentTaskMeta.templateId || '',
        templateName: template.name || parentTaskMeta.templateName || '',
        templateSnapshot: {
          id: template.id || '',
          name: template.name || '',
          templateType: template.templateType || '',
          evaluationMode: template.evaluationMode || '',
          dimensions: template.dimensions,
          indicators: template.indicators,
        },
        indicatorValues,
        filledIndicatorCount,
        requiredIndicatorCount: requiredIndicators.length,
        requiredFilledCount,
        updatedAt: nowText,
      },
      paragraphs: [
        `所属任务：${parentTask?.name || '督导任务'}。`,
        `被评估学校：${school.name}。`,
        `学校区域：${regionText}。`,
        `评估模板：${template.name || '未选择模板'}。`,
        `填写进度：${filledIndicatorCount}/${indicators.length} 项指标。`,
        `执行状态：${status}。`,
      ],
    },
  };
}

export default function SupervisionSchoolTaskForm({
  item,
  parentTask,
  templates = [],
  canEdit = true,
  onSubmit,
}) {
  const [form] = Form.useForm();
  const [activeDimensionKey, setActiveDimensionKey] = useState('');
  const [collapsedDimensionIds, setCollapsedDimensionIds] = useState(() => new Set());
  const school = useMemo(() => resolveSchoolMeta(item), [item]);
  const template = useMemo(() => resolveTaskTemplate(parentTask, templates, item), [item, parentTask, templates]);
  const dimensionFramework = useMemo(() => buildDimensionFramework(template), [template]);
  const indicators = dimensionFramework.indicators;
  const visibleDimensionNodes = useMemo(
    () => getVisibleDimensionNodes(dimensionFramework.roots, collapsedDimensionIds),
    [collapsedDimensionIds, dimensionFramework.roots],
  );
  const defaultDimensionKey = dimensionFramework.flatNodes.find((node) => node.totalIndicatorCount)?.key
    || dimensionFramework.flatNodes[0]?.key
    || '';
  const selectedDimensionKey = dimensionFramework.nodeMap.has(activeDimensionKey)
    ? activeDimensionKey
    : defaultDimensionKey;
  const selectedNode = selectedDimensionKey ? dimensionFramework.nodeMap.get(selectedDimensionKey) : null;
  const selectedDimension = selectedNode?.dimension || null;
  const selectedIndicators = selectedNode?.allIndicators || [];
  const initialValues = useMemo(() => buildInitialValues(item, indicators), [indicators, item]);
  const watchedEntries = Form.useWatch('entries', form) || initialValues.entries || {};
  const filledIndicatorCount = indicators.filter((indicator) => hasInspectionValue(watchedEntries[indicator.id])).length;
  const aiIndicators = indicators.filter(isAiIndicator);
  const manualIndicators = indicators.filter((indicator) => !isAiIndicator(indicator));
  const aiFilledCount = aiIndicators.filter((indicator) => hasInspectionValue(watchedEntries[indicator.id])).length;
  const manualFilledCount = manualIndicators.filter((indicator) => hasInspectionValue(watchedEntries[indicator.id])).length;
  const currentStatus = item?.meta?.supervisionSchoolTask?.status || '待检查';
  const parentTaskMeta = parentTask?.meta?.supervisionTask || {};

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSave = () => {
    const values = form.getFieldsValue(true);
    onSubmit?.(buildSchoolTaskResource({
      item,
      parentTask,
      template,
      values,
      indicators,
      school,
    }));
  };

  const handleToggleDimensionCollapse = (dimensionId) => {
    setCollapsedDimensionIds((prevIds) => {
      const nextIds = new Set(prevIds);
      if (nextIds.has(dimensionId)) {
        nextIds.delete(dimensionId);
      } else {
        nextIds.add(dimensionId);
      }
      return nextIds;
    });
  };

  const renderDimensionNode = (node) => {
    const isCollapsed = collapsedDimensionIds.has(node.key);
    const isActive = selectedDimensionKey === node.key;
    const filledCount = node.allIndicators.filter((indicator) => hasInspectionValue(watchedEntries[indicator.id])).length;

    return (
      <div
        key={node.key}
        className={`supervision-school-dimension-node is-level-${Math.min(node.level, 4)}${isActive ? ' is-active' : ''}`}
        style={{ '--supervision-school-tree-level': node.level - 1 }}
      >
        <button
          type="button"
          className="supervision-school-dimension-row"
          onClick={() => setActiveDimensionKey(node.key)}
        >
          <span
            className={`supervision-school-dimension-toggle${node.childCount ? '' : ' is-empty'}`}
            onClick={(event) => {
              event.stopPropagation();
              if (node.childCount) handleToggleDimensionCollapse(node.key);
            }}
          >
            {node.childCount ? (isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />) : null}
          </span>
          <span className="supervision-school-dimension-icon">
            <AppstoreOutlined />
          </span>
          <span className="supervision-school-dimension-copy">
            <span className="supervision-school-dimension-title">
              {node.dimension.code ? `${node.dimension.code} ` : ''}{node.dimension.name}
            </span>
            <span className="supervision-school-dimension-meta">
              {node.dimension.level || `${node.level}级维度`} · {node.childCount} 个下级 · {filledCount}/{node.totalIndicatorCount} 项
            </span>
          </span>
        </button>
      </div>
    );
  };

  const renderIndicatorHeader = (indicator) => {
    const entry = watchedEntries[indicator.id] || {};
    const filled = hasInspectionValue(entry);

    return (
      <div className="supervision-school-indicator-collapse-head">
        <div>
          <div className="supervision-school-indicator-title">{indicator.name}</div>
          <div className="supervision-school-indicator-meta">
            <Tag color={isAiIndicator(indicator) ? 'blue' : undefined}>
              {isAiIndicator(indicator) ? 'AI' : '人工'}
            </Tag>
            <span>{indicator.code}</span>
            <span>{getDimensionPath(dimensionFramework.dimensionMap.get(indicator.dimensionId), dimensionFramework.dimensionMap)}</span>
            <span>{indicator.indicatorType || '检查项'}</span>
            <span>{indicator.scoringMethod || '人工评分'}</span>
            {indicator.required ? <Tag color="green">必填</Tag> : null}
          </div>
        </div>
        <Tag color={filled ? 'success' : 'default'}>{filled ? '已填写' : '未填写'}</Tag>
      </div>
    );
  };

  const renderIndicatorForm = (indicator) => {
    const resultOptions = Array.isArray(indicator.resultOptions) ? indicator.resultOptions : [];

    return (
      <div className="supervision-school-indicator-form">
        {resultOptions.length ? (
          <Form.Item label="检查结论" name={['entries', indicator.id, 'result']}>
            <Radio.Group className="supervision-school-result-options">
              {resultOptions.map((option) => (
                <Radio.Button key={option} value={option}>{option}</Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
        ) : null}

        <Form.Item
          label={isNumericIndicator(indicator) ? '录入数值' : '记录值'}
          name={['entries', indicator.id, 'value']}
        >
          {isNumericIndicator(indicator) ? (
            <InputNumber style={{ width: '100%' }} placeholder="请输入数值" />
          ) : (
            <Input placeholder="请输入检查记录" />
          )}
        </Form.Item>

        <Form.Item label="备注说明" name={['entries', indicator.id, 'remark']}>
          <TextArea rows={3} placeholder="填写数据来源、统计口径或现场说明" />
        </Form.Item>

        <div className="supervision-school-evidence-box">
          <UploadOutlined />
          <div>点击或拖拽文件上传</div>
          <span>支持 PDF、Word、Excel、图片，单次最多 10 个文件</span>
        </div>

        <Form.Item label="佐证材料说明" name={['entries', indicator.id, 'evidenceNote']}>
          <Input placeholder="可填写材料名称、链接或线下归档编号" />
        </Form.Item>

        <Button type="primary" block icon={<SaveOutlined />} onClick={handleSave} disabled={!canEdit}>
          保存录入值
        </Button>
      </div>
    );
  };

  if (!parentTask) {
    return (
      <div className="supervision-school-check-form">
        <Empty description="未找到上级督导任务，无法生成学校检查表单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={!canEdit}
      className="supervision-school-check-form"
    >
      <div className="supervision-school-check-head">
        <div className="supervision-school-check-title-block">
          <div className="supervision-school-check-title">{parentTask.name}</div>
          <div className="supervision-school-check-meta">
            <Tag color={getStatusColor(currentStatus)}>{currentStatus}</Tag>
            <span>截止：{parentTaskMeta.endDate || '--'}</span>
            <span>{template.name}</span>
          </div>
        </div>
        <Button icon={<DownloadOutlined />}>材料打包下载</Button>
      </div>

      <div className="supervision-school-check-schoolbar">
        <span className="supervision-school-check-school-icon"><BankOutlined /></span>
        <div>
          <div className="supervision-school-check-school-name">{school.name}</div>
          <div className="supervision-school-check-school-meta">
            {[school.province, school.city, school.district, school.nature].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="supervision-school-check-stats">
          <Tag>{indicators.length} 项指标</Tag>
          <Tag color={filledIndicatorCount === indicators.length && indicators.length ? 'success' : 'processing'}>
            {filledIndicatorCount}/{indicators.length} 已填写
          </Tag>
        </div>
      </div>

      <div className="supervision-school-check-switch">
        <button type="button" className="supervision-school-check-mode">
          <ClockCircleOutlined />
          AI评估 ({aiFilledCount}/{aiIndicators.length})
        </button>
        <button type="button" className="supervision-school-check-mode is-active">
          <CheckCircleOutlined />
          人工评估 ({manualFilledCount}/{manualIndicators.length})
        </button>
      </div>

      {indicators.length === 0 ? (
        <div className="supervision-school-check-empty">
          <Empty description="上级任务尚未关联有效督导模板，暂无可填写指标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <div className="supervision-school-framework">
          <aside className="supervision-school-framework-tree-panel">
            <div className="supervision-school-framework-tree-head">
              <div>
                <div className="supervision-school-framework-tree-title">维度结构</div>
                <div className="supervision-school-framework-tree-desc">
                  {dimensionFramework.flatNodes.length} 个维度 · {indicators.length} 项指标
                </div>
              </div>
            </div>
            <div className="supervision-school-framework-tree-list">
              {visibleDimensionNodes.map(renderDimensionNode)}
            </div>
          </aside>

          <section className="supervision-school-framework-main">
            <div className="supervision-school-framework-panel-head">
              <div>
                <div className="supervision-school-framework-panel-title">指标填写</div>
                <div className="supervision-school-framework-panel-desc">
                  当前维度：{selectedDimension
                    ? getDimensionPath(
                      selectedDimension.id === UNGROUPED_DIMENSION_ID ? null : selectedDimension,
                      dimensionFramework.dimensionMap,
                    )
                    : '未选择维度'}
                </div>
              </div>
              <Tag>{selectedIndicators.length} 项指标</Tag>
            </div>

            {selectedIndicators.length ? (
              <Collapse
                key={`${selectedDimensionKey}-${selectedIndicators.map((indicator) => indicator.id).join('_')}`}
                ghost
                defaultActiveKey={[]}
                className="supervision-school-indicator-collapse"
                items={selectedIndicators.map((indicator) => ({
                  key: indicator.id,
                  label: renderIndicatorHeader(indicator),
                  children: renderIndicatorForm(indicator),
                }))}
              />
            ) : (
              <div className="supervision-school-framework-empty">
                <Empty description="当前维度暂无指标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </section>
        </div>
      )}

      <div className="supervision-school-check-footer">
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!canEdit}>
          保存检查情况
        </Button>
      </div>
    </Form>
  );
}
