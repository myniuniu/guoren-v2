import { useState } from 'react';
import { Button, Table, Tree } from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  EditOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  MessageOutlined,
  UserOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import './TopicDetail.css';

// 左侧项目树数据
const projectTreeData = [
  {
    key: 'folder-1',
    title: '积木编程XX',
    icon: <FolderOutlined style={{ color: '#4facfe' }} />,
    isFolder: true,
    children: [],
  },
];

// 左侧项目列表
const projectItems = [
  { key: 'item-1', icon: <FilePdfOutlined style={{ color: '#e74c3c' }} />, title: 'DeepAgent 技术汇报报告（对外分享_会议版）.pdf' },
  { key: 'item-2', icon: <EditOutlined style={{ color: '#f5a623' }} />, title: '未命名笔记' },
  { key: 'item-3', icon: <FileTextOutlined style={{ color: '#4facfe' }} />, title: '零基础纯软件积木编程入门实训课程：制作趣味动画小作...' },
  { key: 'item-4', icon: <FileTextOutlined style={{ color: '#4facfe' }} />, title: '数学_勾股定理互动课件.html' },
  { key: 'item-5', icon: <PlayCircleOutlined style={{ color: '#9b59b6' }} />, title: '人工智能通识讲解课堂' },
  { key: 'item-6', icon: <AppstoreOutlined style={{ color: '#8e8e8e' }} />, title: '未命名白板' },
];

// 右侧表格数据
const tableData = [
  {
    key: '1',
    name: '人工智能通识讲解课堂',
    icon: <FileTextOutlined style={{ color: '#4facfe' }} />,
    owner: 'zhanghl',
    lastEdit: '2026-05-07 16:24:23',
  },
  {
    key: '2',
    name: '积木编程_第一课.html',
    icon: <FileTextOutlined style={{ color: '#4facfe' }} />,
    owner: 'zhanghl',
    lastEdit: '2026-05-07 18:23:38',
  },
  {
    key: '3',
    name: '9分钟搞定！Claude Code 保姆级安装+原理+真实用法（国内直连）',
    icon: <PlayCircleOutlined style={{ color: '#9b59b6' }} />,
    owner: 'zhanghl',
    lastEdit: '2026-05-07 13:40:47',
  },
];

const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    render: (text, record) => (
      <div className="file-name-cell">
        <span className="file-icon">{record.icon}</span>
        <span className="file-name-text">{text}</span>
      </div>
    ),
  },
  {
    title: '所有者',
    dataIndex: 'owner',
    key: 'owner',
    width: 120,
  },
  {
    title: '最近编辑',
    dataIndex: 'lastEdit',
    key: 'lastEdit',
    width: 200,
  },
];

function TopicDetail({ topicTitle, onBack }) {
  const [selectedFolder, setSelectedFolder] = useState('folder-1');
  const [activeTab, setActiveTab] = useState('knowledge');

  const tabs = [
    { key: 'knowledge', label: '知识模式' },
    { key: 'ai', label: 'AI模式' },
    { key: 'practice', label: '实训模式' },
  ];

  return (
    <div className="topic-detail">
      {/* Top Header Bar */}
      <div className="detail-header">
        <div className="detail-header-left">
          <HomeOutlined className="detail-home-icon" onClick={onBack} />
          <span className="detail-title">{topicTitle}</span>
        </div>
        <div className="detail-header-center">
          <div className="detail-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`detail-tab ${activeTab === tab.key ? 'detail-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>
        <div className="detail-header-right">
          <FileTextOutlined className="header-icon" />
          <UserOutlined className="header-icon" />
          <CommentOutlined className="header-icon" />
        </div>
      </div>

      {/* Main Body */}
      <div className="detail-body">
        {/* Left Panel - 资料 */}
        <div className="detail-left-panel">
          <div className="panel-header">
            <span className="panel-title">资料</span>
            <MoreOutlined className="panel-more-icon" />
          </div>

          {/* AI 问答 */}
          <div className="ai-qa-box">
            <MessageOutlined style={{ color: '#999', fontSize: 14 }} />
            <span className="ai-qa-text">AI 问答</span>
          </div>

          {/* 操作按钮 */}
          <div className="panel-actions">
            <div className="panel-action-btn">
              <PlusOutlined style={{ fontSize: 12 }} />
              <span>添加资料</span>
            </div>
            <div className="panel-action-btn">
              <AppstoreOutlined style={{ fontSize: 12 }} />
              <span>应用</span>
            </div>
          </div>

          {/* 项目列表 */}
          <div className="project-section">
            <div className="project-header">
              <span className="project-title">项目</span>
              <MoreOutlined className="project-more-icon" />
            </div>
            <div className="project-list">
              {/* Folder item - selected */}
              <div className={`project-item project-item-folder ${selectedFolder === 'folder-1' ? 'project-item-selected' : ''}`}>
                <span className="project-item-arrow">▶</span>
                <FolderOutlined style={{ color: '#4facfe', fontSize: 14 }} />
                <span className="project-item-title">积木编程XX</span>
              </div>
              {/* Other items */}
              {projectItems.map((item) => (
                <div key={item.key} className="project-item">
                  <span className="project-item-icon">{item.icon}</span>
                  <span className="project-item-title">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - 文件表格 */}
        <div className="detail-right-panel">
          {/* Folder Info Header */}
          <div className="folder-info">
            <div className="folder-info-left">
              <div className="folder-big-icon">
                <FolderOutlined />
              </div>
              <div className="folder-meta">
                <div className="folder-name">积木编程XX</div>
                <div className="folder-desc">3 个文件 0 个文件夹</div>
              </div>
            </div>
            <Button className="add-resource-btn" icon={<PlusOutlined />}>
              添加资料
            </Button>
          </div>

          {/* File Table */}
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            className="file-table"
            size="middle"
          />
        </div>
      </div>
    </div>
  );
}

export default TopicDetail;
