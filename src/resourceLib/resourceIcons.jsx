import {
  FolderFilled,
  FilePdfFilled,
  FilePptFilled,
  FileWordFilled,
  FileExcelFilled,
  FileImageFilled,
  FileTextFilled,
  PlayCircleFilled,
  SoundFilled,
  ExperimentFilled,
  PicLeftOutlined,
  FileUnknownFilled,
  NodeIndexOutlined,
} from '@ant-design/icons';

// 文件类型 → 颜色 + 图标组件
// 颜色参考截图（PDF 红、PPT 橙、白板紫、笔记黄绿、视频蓝紫、文件夹蓝、test 绿/蓝）
const TYPE_META = {
  folder:     { color: '#4facfe', Icon: FolderFilled },
  pdf:        { color: '#ee4d4d', Icon: FilePdfFilled },
  pptx:       { color: '#f5a623', Icon: FilePptFilled },
  docx:       { color: '#2965f1', Icon: FileWordFilled },
  xlsx:       { color: '#23a566', Icon: FileExcelFilled },
  image:      { color: '#13c2c2', Icon: FileImageFilled },
  video:      { color: '#722ed1', Icon: PlayCircleFilled },
  audio:      { color: '#eb2f96', Icon: SoundFilled },
  whiteboard: { color: '#7c4dff', Icon: PicLeftOutlined },
  note:       { color: '#fadb14', Icon: FileTextFilled },
  test:       { color: '#52c41a', Icon: ExperimentFilled },
  knowledgeGraph: { color: '#1677ff', Icon: NodeIndexOutlined },
  other:      { color: '#8c8c8c', Icon: FileUnknownFilled },
};

const TYPE_LABEL_MAP = {
  folder: '文件夹',
  pdf: 'PDF',
  pptx: 'PPT',
  docx: 'Word',
  xlsx: 'Excel',
  image: '图片',
  video: '视频',
  audio: '音频',
  whiteboard: '白板',
  note: '笔记',
  test: '测试',
  knowledgeGraph: '知识图谱',
  other: '文件',
};

export function getFileTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.other;
}

export function getFileTypeLabel(type) {
  return TYPE_LABEL_MAP[type] || TYPE_LABEL_MAP.other;
}

// 渲染文件图标
export function renderFileIcon(type, style = {}) {
  const { color, Icon } = getFileTypeMeta(type);
  return <Icon style={{ color, fontSize: 16, ...style }} />;
}

// 解析状态映射
export const PARSE_STATUS_MAP = {
  parsed:  { color: 'success', label: '已解析' },
  parsing: { color: 'processing', label: '解析中' },
  failed:  { color: 'error', label: '解析失败' },
  pending: { color: 'default', label: '待解析' },
};
