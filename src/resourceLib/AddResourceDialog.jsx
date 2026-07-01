import { useRef, useState } from 'react';
import { Modal, message } from 'antd';
import {
  AppstoreOutlined,
  BorderOutlined,
  CheckSquareOutlined,
  DesktopOutlined,
  EditOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  InboxOutlined,
  NodeIndexOutlined,
  RightOutlined,
  SmileOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './AddResourceDialog.css';

const activityItems = [
  {
    key: 'activity',
    icon: <DesktopOutlined />,
    label: '研讨会',
    description: '创建互动研讨活动',
    iconColor: '#12b76a',
    iconBackground: '#e8fff3',
  },
  {
    key: 'survey',
    icon: <CheckSquareOutlined />,
    label: '调查',
    description: '发起信息收集',
    iconColor: '#1677ff',
    iconBackground: '#eaf3ff',
  },
  {
    key: 'vote',
    icon: <SmileOutlined />,
    label: '投票',
    description: '快速收集意见',
    iconColor: '#fa8c16',
    iconBackground: '#fff2e8',
  },
  {
    key: 'exam',
    icon: <EditOutlined />,
    label: '考试',
    description: '组织测验考核',
    iconColor: '#722ed1',
    iconBackground: '#f4ebff',
  },
  {
    key: 'register',
    icon: <UserOutlined />,
    label: '报名',
    description: '收集参与名单',
    iconColor: '#13c2c2',
    iconBackground: '#e6fffb',
  },
  {
    key: 'training',
    icon: <ExperimentOutlined />,
    label: '实训任务',
    description: '布置实操练习与过程产出',
    iconColor: '#34c759',
    iconBackground: '#ebfff1',
  },
];

const toolItems = [
  {
    key: 'note',
    icon: <FileTextOutlined />,
    label: '笔记',
    description: '记录纪要、摘要和补充说明',
    iconColor: '#1677ff',
    iconBackground: '#eaf3ff',
  },
  {
    key: 'whiteboard',
    icon: <BorderOutlined />,
    label: '白板',
    description: '用于脑暴共创、流程梳理和讨论',
    iconColor: '#7c3aed',
    iconBackground: '#f2ebff',
  },
];

const knowledgeItems = [
  {
    key: 'knowledge-graph',
    icon: <NodeIndexOutlined />,
    label: '新建知识图谱',
    description: '创建并沉淀结构化图谱资料',
    iconColor: '#1677ff',
    iconBackground: '#eef4ff',
  },
  {
    key: 'capability-model',
    icon: <AppstoreOutlined />,
    label: '新建能力模型',
    description: '创建一份新的能力模型资料',
    iconColor: '#0f766e',
    iconBackground: '#ecfeff',
  },
];

function AddResourceDialog({ open, onClose, onUpload, onPickEntry }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelectFile = () => fileInputRef.current?.click();
  const handleSelectFolder = () => folderInputRef.current?.click();

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    onUpload?.(files);
    event.target.value = '';
    onClose?.();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length === 0) return;
    onUpload?.(files);
    onClose?.();
  };

  const handleEntry = (item) => {
    if (onPickEntry) onPickEntry(item);
    else message.info(`「${item.label}」功能开发中`);
  };

  const renderCard = (item) => (
    <button key={item.key} type="button" className="ard-card-item" onClick={() => handleEntry(item)}>
      <span
        className="ard-card-icon"
        style={{ color: item.iconColor, background: item.iconBackground }}
      >
        {item.icon}
      </span>
      <span className="ard-card-copy">
        <strong>{item.label}</strong>
        <span>{item.description}</span>
      </span>
      <RightOutlined className="ard-item-arrow" />
    </button>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable
      width={1040}
      centered
      className="add-resource-dialog"
      destroyOnClose
    >
      <div className="ard-shell">
        <div className="ard-title">添加资料</div>

        <div
          className={`ard-dropzone ${dragOver ? 'ard-dropzone-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="ard-dropzone-title">拖拽文件到这里可快速上传</div>
          <div className="ard-dropzone-subtitle">支持上传任意类型文件，如文档、文件夹、图片和音视频、压缩包等</div>
          <div className="ard-dropzone-icon">
            <InboxOutlined />
          </div>
          <button type="button" className="ard-upload-btn" onClick={handleSelectFile}>
            <UploadOutlined style={{ marginRight: 6 }} />
            选择文件上传
          </button>
          <button type="button" className="ard-folder-link" onClick={handleSelectFolder}>选择文件夹</button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div className="ard-panels">
          <section className="ard-panel ard-panel-activity">
            <div className="ard-panel-title">活动</div>
            <div className="ard-panel-subtitle">研讨会与问卷互动内容</div>
            <div className="ard-card-grid ard-card-grid-activity">
              {activityItems.map(renderCard)}
            </div>
          </section>

          <section className="ard-panel ard-panel-tools">
            <div className="ard-panel-title">工具</div>
            <div className="ard-panel-subtitle">快速新建协作内容</div>
            <div className="ard-card-grid ard-card-grid-tools">
              {toolItems.map(renderCard)}
            </div>
          </section>

          <section className="ard-panel ard-panel-knowledge">
            <div className="ard-panel-title">知识体系</div>
            <div className="ard-panel-subtitle">搭建知识结构与关联视图</div>
            <div className="ard-card-grid ard-card-grid-knowledge">
              {knowledgeItems.map(renderCard)}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}

export default AddResourceDialog;
