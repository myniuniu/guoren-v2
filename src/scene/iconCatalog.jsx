import {
  AppstoreOutlined,
  BorderOutlined,
  CheckSquareOutlined,
  CommentOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  EditOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FolderFilled,
  FolderOpenFilled,
  GlobalOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';

const SCENE_ICON_META_LIST = [
  {
    value: 'FOLDER',
    label: '文件夹',
    Icon: FolderFilled,
    OpenIcon: FolderOpenFilled,
    color: '#56a8f5',
    background: '#eaf4ff',
  },
  {
    value: 'HOME',
    label: '首页',
    Icon: HomeOutlined,
    color: '#2563eb',
    background: '#ebf3ff',
  },
  {
    value: 'DOCUMENT',
    label: '文档',
    Icon: FileTextOutlined,
    color: '#1677ff',
    background: '#eaf3ff',
  },
  {
    value: 'AI',
    label: 'AI',
    Icon: ThunderboltOutlined,
    color: '#7c3aed',
    background: '#f2ebff',
  },
  {
    value: 'WHITEBOARD',
    label: '白板',
    Icon: BorderOutlined,
    color: '#7c3aed',
    background: '#f2ebff',
  },
  {
    value: 'CHAT',
    label: '讨论',
    Icon: CommentOutlined,
    color: '#6366f1',
    background: '#eef2ff',
  },
  {
    value: 'LIVE',
    label: '直播',
    Icon: DesktopOutlined,
    color: '#12b76a',
    background: '#e8fff3',
  },
  {
    value: 'FORM',
    label: '表单',
    Icon: CheckSquareOutlined,
    color: '#0ea5e9',
    background: '#ecfeff',
  },
  {
    value: 'EXAM',
    label: '考核',
    Icon: EditOutlined,
    color: '#722ed1',
    background: '#f4ebff',
  },
  {
    value: 'USER',
    label: '成员',
    Icon: UserOutlined,
    color: '#13c2c2',
    background: '#e6fffb',
  },
  {
    value: 'LIBRARY',
    label: '资料库',
    Icon: DatabaseOutlined,
    color: '#2563eb',
    background: '#eaf2ff',
  },
  {
    value: 'GRAPH',
    label: '知识图谱',
    Icon: NodeIndexOutlined,
    color: '#1677ff',
    background: '#eef4ff',
  },
  {
    value: 'VIDEO',
    label: '视频',
    Icon: PlayCircleOutlined,
    color: '#0f766e',
    background: '#ecfeff',
  },
  {
    value: 'TASK',
    label: '任务',
    Icon: ExperimentOutlined,
    color: '#34c759',
    background: '#ebfff1',
  },
  {
    value: 'ROCKET',
    label: '发布',
    Icon: RocketOutlined,
    color: '#f97316',
    background: '#fff7ed',
  },
  {
    value: 'LINK',
    label: '链接',
    Icon: GlobalOutlined,
    color: '#0f766e',
    background: '#e6fffb',
  },
  {
    value: 'TAG',
    label: '标签',
    Icon: TagsOutlined,
    color: '#d97706',
    background: '#fffbeb',
  },
  {
    value: 'GRID',
    label: '应用',
    Icon: AppstoreOutlined,
    color: '#4f46e5',
    background: '#eef2ff',
  },
];

const SCENE_ICON_META_MAP = new Map(
  SCENE_ICON_META_LIST.map((item) => [item.value, item]),
);

export const SCENE_TOOL_ICON_OPTIONS = [
  'DOCUMENT',
  'WHITEBOARD',
  'CHAT',
  'LIVE',
  'FORM',
  'EXAM',
  'USER',
  'LIBRARY',
  'GRAPH',
  'VIDEO',
  'TASK',
  'ROCKET',
  'LINK',
  'GRID',
].map((value) => SCENE_ICON_META_MAP.get(value));

export const SCENE_FOLDER_ICON_OPTIONS = [
  'FOLDER',
  'DOCUMENT',
  'CHAT',
  'LIVE',
  'EXAM',
  'LIBRARY',
  'GRAPH',
  'VIDEO',
  'TASK',
  'ROCKET',
  'LINK',
  'TAG',
  'GRID',
].map((value) => SCENE_ICON_META_MAP.get(value));

export const SCENE_MODE_ICON_OPTIONS = [
  'HOME',
  'DOCUMENT',
  'GRAPH',
  'AI',
  'EXAM',
  'TASK',
  'CHAT',
  'LIVE',
  'USER',
  'LIBRARY',
  'VIDEO',
  'ROCKET',
  'LINK',
  'TAG',
  'GRID',
].map((value) => SCENE_ICON_META_MAP.get(value));

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function hasUploadedSceneIcon(config = {}) {
  const iconImage = String(config?.iconImage || '').trim();
  if (!iconImage) return false;
  const normalizedSource = normalizeText(config?.iconSource);
  if (!normalizedSource) return true;
  return normalizedSource === 'upload';
}

export function getSceneIconMeta(iconKey) {
  return SCENE_ICON_META_MAP.get(iconKey) || SCENE_ICON_META_MAP.get('DOCUMENT');
}

export function getSceneIconLabel(iconKey) {
  return getSceneIconMeta(iconKey)?.label || '图标';
}

export function inferSceneToolIconKey(tool = {}) {
  const text = `${tool?.key || ''} ${tool?.name || ''} ${tool?.description || ''}`.toLowerCase();
  if (/whiteboard|白板/.test(text)) return 'WHITEBOARD';
  if (/knowledge|graph|node|图谱|知识/.test(text)) return 'GRAPH';
  if (/capability|model|resource[_\s-]?library|library|database|资料库|能力模型/.test(text)) return 'LIBRARY';
  if (/live|meeting|直播|会议|授课/.test(text)) return 'LIVE';
  if (/video|录像|录播|视频/.test(text)) return 'VIDEO';
  if (/exam|assessment|quiz|test|考试|测评|题库|评阅/.test(text)) return 'EXAM';
  if (/survey|vote|register|sign|报名|调查|投票|表单/.test(text)) return 'FORM';
  if (/forum|chat|comment|talk|discussion|论坛|讨论|评审/.test(text)) return 'CHAT';
  if (/member|user|role|成员|学员/.test(text)) return 'USER';
  if (/link|url|publish|release|链接|发布/.test(text)) return 'LINK';
  if (/train|task|practice|project|competition|实训|任务|练习|成果|项目/.test(text)) return 'TASK';
  if (/app|grid|应用/.test(text)) return 'GRID';
  return 'DOCUMENT';
}

export function inferSceneFolderIconKey(folder = {}) {
  const text = `${folder?.key || ''} ${folder?.name || ''} ${folder?.description || ''}`.toLowerCase();
  const allowedTools = Array.isArray(folder?.allowedTools) ? folder.allowedTools : [];
  if (/knowledge|graph|图谱|知识/.test(text) || allowedTools.includes('KNOWLEDGE_GRAPH')) return 'GRAPH';
  if (/video|录播|点播|视频/.test(text) || allowedTools.includes('ONLINE_VIDEO')) return 'VIDEO';
  if (/live|meeting|直播|会议/.test(text) || allowedTools.includes('LIVE')) return 'LIVE';
  if (/exam|assessment|quiz|test|考试|测评|题库/.test(text) || allowedTools.includes('EXAM') || allowedTools.includes('ASSESSMENT')) return 'EXAM';
  if (/register|signup|报名|成员/.test(text) || allowedTools.includes('REGISTER')) return 'USER';
  if (/forum|topic|talk|discussion|论坛|议题|讨论/.test(text) || allowedTools.includes('FORUM')) return 'CHAT';
  if (/resource|library|archive|资料库|资源/.test(text) || allowedTools.includes('RESOURCE_LIBRARY')) return 'LIBRARY';
  if (/release|featured|精选|发布|链接/.test(text) || allowedTools.includes('URL')) return 'ROCKET';
  if (/practice|task|project|成果|任务|练习|作业|实训/.test(text)) return 'TASK';
  if (/document|courseware|note|minutes|blueprint|文档|课件|纪要|蓝图|资料/.test(text)
    || allowedTools.includes('ONLINE_DOC')
    || allowedTools.includes('OFFICE_UPLOAD')) return 'DOCUMENT';
  return 'FOLDER';
}

export function inferSceneModeTabIconKey(modeTab = {}) {
  const text = `${modeTab?.key || ''} ${modeTab?.label || ''} ${modeTab?.resourcePanelTitle || ''}`.toLowerCase();
  if (/home|首页/.test(text)) return 'HOME';
  if (/ai|智能|助教/.test(text)) return 'AI';
  if (/assessment|考核|评价|评阅/.test(text)) return 'EXAM';
  if (/practice|train|task|实训|任务|练习|实验|作业/.test(text)) return 'TASK';
  if (/knowledge|graph|resource|资料|课程|课件|知识|图谱|文档/.test(text)) {
    return /graph|图谱/.test(text) ? 'GRAPH' : 'DOCUMENT';
  }
  if (/app|应用/.test(text)) return 'GRID';
  if (/member|user|role|成员|学员/.test(text)) return 'USER';
  if (/live|meeting|直播|会议/.test(text)) return 'LIVE';
  return 'DOCUMENT';
}

export function resolveSceneToolIconKey(tool = {}) {
  const normalized = normalizeText(tool?.iconKey);
  if (normalized && SCENE_ICON_META_MAP.has(tool.iconKey)) {
    return tool.iconKey;
  }
  return inferSceneToolIconKey(tool);
}

export function resolveSceneFolderIconKey(folder = {}) {
  const normalized = normalizeText(folder?.iconKey);
  if (normalized && SCENE_ICON_META_MAP.has(folder.iconKey)) {
    return folder.iconKey;
  }
  return inferSceneFolderIconKey(folder);
}

export function resolveSceneModeTabIconKey(modeTab = {}) {
  const normalized = normalizeText(modeTab?.iconKey);
  if (normalized && SCENE_ICON_META_MAP.has(modeTab.iconKey)) {
    return modeTab.iconKey;
  }
  return inferSceneModeTabIconKey(modeTab);
}

export function renderSceneConfigIcon(iconKey, options = {}) {
  if (iconKey && typeof iconKey === 'object' && hasUploadedSceneIcon(iconKey)) {
    const size = options.size || 16;
    return (
      <img
        alt={options.alt || ''}
        className={options.className}
        src={iconKey.iconImage}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: options.radius ?? Math.max(4, Math.round(size * 0.28)),
          display: 'block',
        }}
      />
    );
  }
  const resolvedIconKey = typeof iconKey === 'string'
    ? iconKey
    : (iconKey?.iconKey || options.defaultIconKey);
  const meta = getSceneIconMeta(resolvedIconKey);
  const IconComponent = options.expanded && meta?.OpenIcon ? meta.OpenIcon : meta.Icon;
  const color = options.color === 'inherit'
    ? 'currentColor'
    : (options.color || meta.color);
  return (
    <IconComponent
      className={options.className}
      style={{
        fontSize: options.size || 16,
        color,
      }}
    />
  );
}
