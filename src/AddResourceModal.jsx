import { Modal } from 'antd';
import {
  CloudOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  CheckSquareOutlined,
  SmileOutlined,
  EditOutlined,
  UserOutlined,
  RightOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import './AddResourceModal.css';

const resourceCategories = [
  {
    title: '从平台选择',
    items: [
      { key: 'cloud', icon: <CloudOutlined />, label: '云盘', type: 'file' },
      { key: 'resource-lib', icon: <DatabaseOutlined />, label: '资料库', type: 'file', moduleKey: 'RESOURCE_LIBRARY' },
    ],
  },
  {
    title: '活动',
    items: [
      { key: 'seminar', icon: <DesktopOutlined />, label: '研讨会', type: 'activity' },
    ],
  },
  {
    title: '工具',
    items: [],
  },
  {
    title: '知识体系',
    items: [
      { key: 'knowledge-graph', icon: <NodeIndexOutlined />, label: '知识图谱', type: 'knowledgeGraph' },
    ],
  },
];

const questionnaireItems = [
  { key: 'survey', icon: <CheckSquareOutlined />, label: '调查', type: 'survey' },
  { key: 'vote', icon: <SmileOutlined />, label: '投票', type: 'vote' },
  { key: 'exam', icon: <EditOutlined />, label: '考试', type: 'exam' },
  { key: 'register', icon: <UserOutlined />, label: '报名', type: 'register' },
];

function AddResourceModal({ open, onClose, onAdd, onPickLibrary, enabledEntries }) {
  const isEntryEnabled = (item) => {
    if (!Array.isArray(enabledEntries) || !item?.moduleKey) return true;
    return enabledEntries.includes(item.moduleKey);
  };

  const filteredCategories = resourceCategories
    .map((category) => ({
      ...category,
      items: category.items.filter(isEntryEnabled),
    }))
    .filter((category) => category.items.length > 0);

  const handleItemClick = (item) => {
    if (item.key === 'resource-lib') {
      onPickLibrary?.();
      onClose?.();
      return;
    }
    onAdd({
      name: `新建${item.label}资料`,
      type: item.type,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable={true}
      width={560}
      className="add-resource-modal"
      centered
    >
      <div className="modal-title">添加资料</div>
      <div className="modal-divider" />
      <div className="modal-content">
        {/* Left Column */}
        <div className="modal-column">
          {filteredCategories.map((category) => (
            <div key={category.title} className="category-group">
              <div className="category-title">{category.title}</div>
              {category.items.map((item) => (
                <div
                  key={item.key}
                  className="resource-item"
                  onClick={() => handleItemClick(item)}
                >
                  <span className="resource-item-icon">{item.icon}</span>
                  <span className="resource-item-label">{item.label}</span>
                  <RightOutlined className="resource-item-arrow" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="modal-column">
          <div className="category-group">
            <div className="category-title">问卷</div>
            {questionnaireItems.map((item) => (
              <div
                key={item.key}
                className="resource-item"
                onClick={() => handleItemClick(item)}
              >
                <span className="resource-item-icon">{item.icon}</span>
                <span className="resource-item-label">{item.label}</span>
                <RightOutlined className="resource-item-arrow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AddResourceModal;
