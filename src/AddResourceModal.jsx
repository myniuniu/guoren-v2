import { Modal } from 'antd';
import {
  BorderOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  EditOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  RightOutlined,
  SmileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './AddResourceModal.css';

const libraryEntry = {
  key: 'resource-lib',
  icon: <DatabaseOutlined />,
  label: '资料库',
  type: 'file',
  moduleKey: 'RESOURCE_LIBRARY',
  title: '从资料库添加资料',
  actionLabel: '选择资料',
};

const toolEntries = [
  {
    key: 'note',
    icon: <FileTextOutlined />,
    label: '笔记',
    type: 'note',
    description: '记录纪要、摘要和补充说明',
    iconColor: '#1677ff',
    iconBackground: '#eaf3ff',
  },
  {
    key: 'whiteboard',
    icon: <BorderOutlined />,
    label: '白板',
    type: 'whiteboard',
    description: '用于脑暴共创、流程梳理和讨论',
    iconColor: '#7c3aed',
    iconBackground: '#f2ebff',
  },
];

const activityEntries = [
  {
    key: 'seminar',
    icon: <DesktopOutlined />,
    label: '研讨会',
    type: 'activity',
    description: '创建互动研讨活动',
    iconColor: '#12b76a',
    iconBackground: '#e8fff3',
  },
  {
    key: 'survey',
    icon: <CheckSquareOutlined />,
    label: '调查',
    type: 'survey',
    description: '发起信息收集',
    iconColor: '#1677ff',
    iconBackground: '#eaf3ff',
  },
  {
    key: 'vote',
    icon: <SmileOutlined />,
    label: '投票',
    type: 'vote',
    description: '快速收集意见',
    iconColor: '#fa8c16',
    iconBackground: '#fff2e8',
  },
  {
    key: 'exam',
    icon: <EditOutlined />,
    label: '考试',
    type: 'exam',
    description: '组织测验考核',
    iconColor: '#722ed1',
    iconBackground: '#f4ebff',
  },
  {
    key: 'register',
    icon: <UserOutlined />,
    label: '报名',
    type: 'register',
    description: '收集参与名单',
    iconColor: '#13c2c2',
    iconBackground: '#e6fffb',
  },
];

const knowledgeEntries = [
  {
    key: 'knowledge-graph',
    icon: <NodeIndexOutlined />,
    label: '知识图谱',
    type: 'knowledgeGraph',
    description: '梳理知识结构与关联',
    iconColor: '#1677ff',
    iconBackground: '#eef4ff',
  },
];

function ResourceLibraryIllustration() {
  return (
    <svg viewBox="0 0 232 164" className="add-resource-modal-hero-art" aria-hidden="true">
      <defs>
        <linearGradient id="libraryCardBg" x1="16" y1="18" x2="220" y2="154" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8fbff" />
          <stop offset="1" stopColor="#e7f0ff" />
        </linearGradient>
        <linearGradient id="libraryFolderFill" x1="76" y1="70" x2="172" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6aa8ff" />
          <stop offset="1" stopColor="#1677ff" />
        </linearGradient>
      </defs>
      <rect x="18" y="16" width="196" height="132" rx="26" fill="url(#libraryCardBg)" />
      <rect x="54" y="32" width="74" height="14" rx="7" fill="#dbe9ff" />
      <rect x="135" y="36" width="42" height="10" rx="5" fill="#c8dcff" />
      <path
        d="M74 72h34l12 14h46c10.493 0 19 8.507 19 19v21c0 10.493-8.507 19-19 19H74c-10.493 0-19-8.507-19-19V91c0-10.493 8.507-19 19-19z"
        fill="url(#libraryFolderFill)"
      />
      <path
        d="M74 72h34l12 14h46c10.493 0 19 8.507 19 19v5H55v-19c0-10.493 8.507-19 19-19z"
        fill="#9ac4ff"
        opacity="0.95"
      />
      <rect x="79" y="102" width="58" height="9" rx="4.5" fill="#ffffff" opacity="0.96" />
      <rect x="79" y="117" width="77" height="9" rx="4.5" fill="#dceaff" />
      <rect x="148" y="78" width="34" height="44" rx="10" fill="#ffffff" stroke="#c9ddff" strokeWidth="2" />
      <rect x="156" y="90" width="18" height="4" rx="2" fill="#7eaefc" />
      <rect x="156" y="99" width="12" height="4" rx="2" fill="#bfd6ff" />
      <path d="M44 104l10-6 4 14-16-4 2-4z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
      <path d="M47 90l4 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <path d="M193 70l8-8" stroke="#8ab6ff" strokeWidth="4" strokeLinecap="round" />
      <path d="M199 84h10" stroke="#8ab6ff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function AddResourceModal({
  open,
  onClose,
  onAdd,
  onPickLibrary,
  enabledEntries,
  hiddenTypes = [],
}) {
  const isEntryEnabled = (item) => {
    if (!Array.isArray(enabledEntries) || !item?.moduleKey) return true;
    return enabledEntries.includes(item.moduleKey);
  };
  const isTypeVisible = (item) => !hiddenTypes.includes(item?.type);

  const libraryEnabled = isEntryEnabled(libraryEntry);
  const visibleActivityEntries = activityEntries.filter(isEntryEnabled);
  const visibleToolEntries = toolEntries.filter(isEntryEnabled);
  const visibleKnowledgeEntries = knowledgeEntries.filter((item) => isEntryEnabled(item) && isTypeVisible(item));

  const handleItemClick = (item) => {
    if (item.key === 'resource-lib') {
      onPickLibrary?.();
      onClose?.();
      return;
    }

    onAdd?.({
      name: `新建${item.label}资料`,
      type: item.type,
    });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable
      width={760}
      className="add-resource-modal"
      centered
      destroyOnClose
    >
      <div className="add-resource-modal-shell">
        <div className="add-resource-modal-heading">
          <div className="add-resource-modal-title">添加资料</div>
          <div className="add-resource-modal-subtitle">从资料库选择已有内容，或新建协作资料。</div>
        </div>

        {libraryEnabled ? (
          <button
            type="button"
            className="add-resource-modal-hero"
            onClick={() => handleItemClick(libraryEntry)}
          >
            <div className="add-resource-modal-hero-copy">
              <div className="add-resource-modal-hero-title">{libraryEntry.title}</div>
              <span className="add-resource-modal-hero-action">
                <span>{libraryEntry.actionLabel}</span>
                <span className="add-resource-modal-hero-action-arrow">
                  <RightOutlined />
                </span>
              </span>
            </div>
            <div className="add-resource-modal-hero-figure">
              <ResourceLibraryIllustration />
            </div>
          </button>
        ) : null}

        <div className="add-resource-modal-grid">
          {visibleActivityEntries.length ? (
            <section className="add-resource-modal-panel add-resource-modal-panel-activity">
              <div className="add-resource-modal-panel-title">活动</div>
              <div className="add-resource-modal-panel-subtitle">研讨会与问卷互动内容</div>
              <div className="add-resource-modal-card-grid add-resource-modal-card-grid-activity">
                {visibleActivityEntries.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="add-resource-modal-card-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <span
                      className="add-resource-modal-card-icon"
                      style={{ color: item.iconColor, background: item.iconBackground }}
                    >
                      {item.icon}
                    </span>
                    <span className="add-resource-modal-card-copy">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                    <RightOutlined className="add-resource-modal-item-arrow" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {visibleToolEntries.length ? (
            <section className="add-resource-modal-panel add-resource-modal-panel-tools">
              <div className="add-resource-modal-panel-title">工具</div>
              <div className="add-resource-modal-panel-subtitle">快速新建协作内容</div>
              <div className="add-resource-modal-card-grid add-resource-modal-card-grid-tools">
                {visibleToolEntries.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="add-resource-modal-card-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <span
                      className="add-resource-modal-card-icon"
                      style={{ color: item.iconColor, background: item.iconBackground }}
                    >
                      {item.icon}
                    </span>
                    <span className="add-resource-modal-card-copy">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                    <RightOutlined className="add-resource-modal-item-arrow" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {visibleKnowledgeEntries.length ? (
            <section className="add-resource-modal-panel add-resource-modal-panel-knowledge">
              <div className="add-resource-modal-panel-title">知识体系</div>
              <div className="add-resource-modal-panel-subtitle">搭建知识结构与关联视图</div>
              <div className="add-resource-modal-card-grid add-resource-modal-card-grid-knowledge">
                {visibleKnowledgeEntries.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="add-resource-modal-card-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <span
                      className="add-resource-modal-card-icon"
                      style={{ color: item.iconColor, background: item.iconBackground }}
                    >
                      {item.icon}
                    </span>
                    <span className="add-resource-modal-card-copy">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                    <RightOutlined className="add-resource-modal-item-arrow" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default AddResourceModal;
