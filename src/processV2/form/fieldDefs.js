/**
 * 内置字段元数据定义
 * 参考 Vue 版 designerMenu 分组
 */

export const FIELD_GROUPS = [
  {
    name: 'text',
    title: '文本',
    fields: [
      { type: 'input', label: '单行文本', icon: '📝' },
      { type: 'textarea', label: '多行文本', icon: '📄' },
      { type: 'alert', label: '说明', icon: 'ℹ️' },
    ],
  },
  {
    name: 'number',
    title: '数值',
    fields: [
      { type: 'inputNumber', label: '数字', icon: '🔢' },
    ],
  },
  {
    name: 'options',
    title: '选项',
    fields: [
      { type: 'radio', label: '单选', icon: '🔘' },
      { type: 'checkbox', label: '多选', icon: '☑️' },
    ],
  },
  {
    name: 'date',
    title: '日期',
    fields: [
      { type: 'datePicker', label: '日期', icon: '📅' },
      { type: 'dateRange', label: '日期区间', icon: '📆' },
    ],
  },
  {
    name: 'other',
    title: '其他',
    fields: [
      { type: 'tableForm', label: '明细/表格', icon: '📊' },
      { type: 'upload', label: '图片/视频', icon: '📎' },
    ],
  },
];

/**
 * 创建字段默认 schema
 */
export function createFieldSchema(type) {
  const id = 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const base = { id, type, label: '', props: {} };

  switch (type) {
    case 'input':
      return { ...base, label: '单行文本', props: { placeholder: '请输入', required: false } };
    case 'textarea':
      return { ...base, label: '多行文本', props: { placeholder: '请输入', required: false } };
    case 'alert':
      return { ...base, label: '说明', props: { content: '说明文字' } };
    case 'inputNumber':
      return { ...base, label: '数字', props: { placeholder: '请输入', required: false, min: undefined, max: undefined } };
    case 'radio':
      return { ...base, label: '单选', props: { required: false, options: ['选项1', '选项2'] } };
    case 'checkbox':
      return { ...base, label: '多选', props: { required: false, options: ['选项1', '选项2'] } };
    case 'datePicker':
      return { ...base, label: '日期', props: { placeholder: '请选择日期', required: false } };
    case 'dateRange':
      return { ...base, label: '日期区间', props: { placeholder: '请选择日期区间', required: false } };
    case 'tableForm':
      return { ...base, label: '明细/表格', props: { columns: [] } };
    case 'upload':
      return { ...base, label: '图片/视频', props: { accept: 'image/*', maxCount: 5 } };
    default:
      return { ...base, label: type };
  }
}

/**
 * 获取字段可配置的属性定义
 */
export function getFieldProperties(type) {
  const common = [
    { key: 'label', label: '标题', inputType: 'text' },
  ];

  switch (type) {
    case 'input':
    case 'textarea':
    case 'inputNumber':
    case 'datePicker':
    case 'dateRange':
      return [
        ...common,
        { key: 'placeholder', label: '默认提示', inputType: 'text', path: 'props' },
        { key: 'required', label: '必填', inputType: 'switch', path: 'props' },
      ];
    case 'radio':
    case 'checkbox':
      return [
        ...common,
        { key: 'required', label: '必填', inputType: 'switch', path: 'props' },
        { key: 'options', label: '选项', inputType: 'options', path: 'props' },
      ];
    case 'alert':
      return [
        ...common,
        { key: 'content', label: '说明内容', inputType: 'textarea', path: 'props' },
      ];
    case 'upload':
      return [
        ...common,
        { key: 'accept', label: '文件类型', inputType: 'text', path: 'props' },
        { key: 'maxCount', label: '最大数量', inputType: 'number', path: 'props' },
      ];
    case 'tableForm':
      return [...common];
    default:
      return common;
  }
}
