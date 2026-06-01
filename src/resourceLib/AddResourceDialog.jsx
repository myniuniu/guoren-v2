import { useRef, useState } from 'react';
import { Modal, Popover, message } from 'antd';
import {
  ExperimentOutlined,
  ScissorOutlined,
  CopyOutlined,
  PictureOutlined,
  EditOutlined,
  UploadOutlined,
  InboxOutlined,
  GiftOutlined,
  FormOutlined,
} from '@ant-design/icons';
import './AddResourceDialog.css';

// bilibili 官方图标（电视机轮廓 + 天线）
const BilibiliIcon = () => (
  <svg viewBox="0 0 1024 1024" width="14" height="14" fill="#fb7299">
    <path d="M306.005333 117.632L444.330667 256h135.296l138.368-138.368a42.666667 42.666667 0 0 1 60.373333 60.373333L700.330667 256H789.333333A106.666667 106.666667 0 0 1 896 362.666667v413.866666A106.666667 106.666667 0 0 1 789.333333 853.333333h-554.666666a106.666667 106.666667 0 0 1-106.666667-106.666666V362.666667A106.666667 106.666667 0 0 1 234.666667 256h88.96L245.632 177.92a42.666667 42.666667 0 0 1 60.373333-60.373333zM789.333333 341.333333h-554.666666a21.333333 21.333333 0 0 0-21.333334 21.333334v384a21.333333 21.333333 0 0 0 21.333334 21.333333h554.666666a21.333333 21.333333 0 0 0 21.333334-21.333333V362.666667a21.333333 21.333333 0 0 0-21.333334-21.333334zM352 469.333333a42.666667 42.666667 0 0 1 42.666667 42.666667v64a42.666667 42.666667 0 0 1-85.333334 0V512a42.666667 42.666667 0 0 1 42.666667-42.666667z m320 0a42.666667 42.666667 0 0 1 42.666667 42.666667v64a42.666667 42.666667 0 0 1-85.333334 0V512a42.666667 42.666667 0 0 1 42.666667-42.666667z" />
  </svg>
);

const thirdPartyItems = [
  { key: 'lucky', icon: <GiftOutlined style={{ color: '#faad14' }} />, label: 'Lucky' },
  { key: 'form', icon: <FormOutlined style={{ color: '#1677ff' }} />, label: '表单' },
  { key: 'bilibili', icon: <BilibiliIcon />, label: 'bilibili' },
];

const taskItems = [
  { key: 'training', icon: <ExperimentOutlined style={{ color: '#34c759' }} />, label: '实训任务' },
];

const otherItems = [
  { key: 'web-clip', icon: <ScissorOutlined style={{ color: '#5e5ce6' }} />, label: '网页剪存' },
  { key: 'paste-text', icon: <CopyOutlined style={{ color: '#5856d6' }} />, label: '粘贴文本' },
  { key: 'whiteboard', icon: <PictureOutlined style={{ color: '#af52de' }} />, label: '白板' },
  { key: 'note', icon: <EditOutlined style={{ color: '#1677ff' }} />, label: '笔记' },
];

// 表单清单（mock）
const formList = [
  { id: 'f1', name: '员工信息登记表', updatedAt: '2026-05-20' },
  { id: 'f2', name: '请假申请表', updatedAt: '2026-05-18' },
  { id: 'f3', name: '培训反馈问卷', updatedAt: '2026-05-15' },
  { id: 'f4', name: '入职干部面谈表', updatedAt: '2026-05-12' },
  { id: 'f5', name: '差旅报销单', updatedAt: '2026-05-08' },
  { id: 'f6', name: '月度工作总结模板', updatedAt: '2026-05-01' },
];

function AddResourceDialog({ open, onClose, onUpload, onPickEntry }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelectFile = () => fileInputRef.current?.click();
  const handleSelectFolder = () => folderInputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    onUpload?.(files);
    e.target.value = '';
    onClose?.();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    onUpload?.(files);
    onClose?.();
  };

  const handleEntry = (item) => {
    if (onPickEntry) onPickEntry(item);
    else message.info(`「${item.label}」功能开发中`);
  };

  // 表单清单选中后
  const handlePickForm = (form) => {
    if (onPickEntry) onPickEntry({ key: 'form', label: '表单', form });
    else message.success(`已选择表单：${form.name}`);
    onClose?.();
  };

  const formListContent = (
    <div className="ard-form-list">
      <div className="ard-form-list-title">选择表单</div>
      <div className="ard-form-list-body">
        {formList.map((f) => (
          <div key={f.id} className="ard-form-list-item" onClick={() => handlePickForm(f)}>
            <FormOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            <span className="ard-form-list-item-name">{f.name}</span>
            <span className="ard-form-list-item-date">{f.updatedAt}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEntry = (item) => {
    const btn = (
      <button key={item.key} className="ard-entry-btn" onClick={item.key === 'form' ? undefined : () => handleEntry(item)}>
        <span className="ard-entry-icon">{item.icon}</span>
        <span className="ard-entry-label">{item.label}</span>
      </button>
    );
    if (item.key === 'form') {
      return (
        <Popover
          key={item.key}
          content={formListContent}
          trigger="click"
          placement="rightTop"
          overlayClassName="ard-form-popover"
        >
          {btn}
        </Popover>
      );
    }
    return btn;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable
      width={760}
      centered
      className="add-resource-dialog"
      destroyOnClose
    >
      <div className="ard-title">添加资料</div>

      {/* 拖拽上传区 */}
      <div
        className={`ard-dropzone ${dragOver ? 'ard-dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="ard-dropzone-title">拖拽文件到这里可快速上传</div>
        <div className="ard-dropzone-subtitle">支持上传任意类型文件，如文档、文件夹、图片和音视频、压缩包等</div>
        <div className="ard-dropzone-icon">
          <InboxOutlined />
        </div>
        <button className="ard-upload-btn" onClick={handleSelectFile}>
          <UploadOutlined style={{ marginRight: 6 }} />
          选择文件上传
        </button>
        <button className="ard-folder-link" onClick={handleSelectFolder}>选择文件夹</button>
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

      {/* 三组入口卡片 */}
      <div className="ard-grid">
        <div className="ard-group">
          <div className="ard-group-title">从应用中选择</div>
          <div className="ard-group-body">
            {thirdPartyItems.map(renderEntry)}
          </div>
        </div>
        <div className="ard-group">
          <div className="ard-group-title">任务资源</div>
          <div className="ard-group-body">
            {taskItems.map(renderEntry)}
          </div>
        </div>
        <div className="ard-group">
          <div className="ard-group-title">其它方式</div>
          <div className="ard-group-body">
            {otherItems.map(renderEntry)}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AddResourceDialog;
