import { useMemo, useState } from 'react';
import {
  Button, Input, Table, Tag, Empty, Tabs, Tooltip, Dropdown,
  Modal, Form, Select, message, Popconfirm, Upload,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, MoreOutlined,
  CaretRightOutlined, CaretDownOutlined,
  EditOutlined, DeleteOutlined, FolderAddOutlined, FileAddOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  loadResourceLib, addItem, renameItem, deleteItem, setSelectedFolder, inferFileType,
} from './resourceLibStore';
import { renderFileIcon, PARSE_STATUS_MAP } from './resourceIcons.jsx';
import { fileApi } from '../api/fileApi';
import './ResourceLibrary.css';

const SCOPE_TABS = [
  { key: 'personal', label: '个人资料库' },
  { key: 'organization', label: '组织资料库' },
];

export default function ResourceLibrary() {
  const [data, setData] = useState(() => loadResourceLib());
  const [scope, setScope] = useState('personal'); // personal | organization
  const [keyword, setKeyword] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState('file'); // file | folder
  const [addForm] = Form.useForm();

  const list = data[scope] || [];
  const selectedFolderKey = data.selectedFolderKey?.[scope] ?? null;

  // 当前文件夹信息
  const currentFolder = useMemo(
    () => (selectedFolderKey ? list.find((r) => r.key === selectedFolderKey) : null),
    [list, selectedFolderKey],
  );

  // 当前文件夹下的子项（右侧表格）
  const currentChildren = useMemo(
    () => list.filter((r) => r.parentKey === selectedFolderKey),
    [list, selectedFolderKey],
  );

  // 树形左侧目录的根节点（按 keyword 过滤名称）
  const filteredList = useMemo(() => {
    if (!keyword.trim()) return list;
    const kw = keyword.trim().toLowerCase();
    return list.filter((r) => r.name?.toLowerCase().includes(kw));
  }, [list, keyword]);

  // ====== 操作 ======
  const reload = () => setData(loadResourceLib());

  const handleSelectFolder = (key) => {
    setData((d) => setSelectedFolder(d, scope, key));
  };

  const handleToggleExpand = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleDelete = (key) => {
    setData((d) => deleteItem(d, scope, key));
    if (selectedFolderKey === key) {
      setData((d) => setSelectedFolder(d, scope, null));
    }
    message.success('已删除');
  };

  const handleRename = (item) => {
    let newName = item.name;
    Modal.confirm({
      title: '重命名',
      icon: null,
      content: (
        <Input
          defaultValue={item.name}
          onChange={(e) => { newName = e.target.value; }}
          placeholder="请输入新名称"
        />
      ),
      onOk: () => {
        const trimmed = (newName || '').trim();
        if (!trimmed) { message.warning('名称不能为空'); return Promise.reject(); }
        setData((d) => renameItem(d, scope, item.key, trimmed));
        message.success('已重命名');
      },
    });
  };

  const handleAddSubmit = async () => {
    try {
      const v = await addForm.validateFields();
      const isFolder = addType === 'folder';
      const fileType = isFolder ? 'folder' : (v.fileType || inferFileType(v.name));
      setData((d) => addItem(d, scope, {
        name: v.name,
        isFolder,
        parentKey: selectedFolderKey,
        fileType,
        url: isFolder ? undefined : (v.url || undefined),
        size: isFolder ? undefined : (v.size || undefined),
        mime: isFolder ? undefined : (v.mime || undefined),
        parseStatus: isFolder ? 'parsed' : 'parsing',
      }));
      setAddOpen(false);
      addForm.resetFields();
      message.success(`${isFolder ? '文件夹' : '资料'}已创建`);
    } catch {/* 校验失败不处理 */}
  };

  const openAdd = (type) => {
    setAddType(type);
    addForm.resetFields();
    setAddOpen(true);
  };

  // ====== 树形渲染 ======
  const getChildren = (parentKey) => filteredList.filter((r) => r.parentKey === parentKey);
  const rootItems = filteredList.filter((r) => r.parentKey === null);

  const renderTreeNode = (item, depth = 0) => {
    const isFolder = item.isFolder;
    const isExpanded = expanded.has(item.key);
    const isSelected = isFolder && selectedFolderKey === item.key;
    const children = isFolder ? getChildren(item.key) : [];
    const hasChildren = children.length > 0;

    const itemMenu = {
      items: [
        { key: 'rename', icon: <EditOutlined />, label: '重命名' },
        { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
      ],
      onClick: ({ key, domEvent }) => {
        domEvent?.stopPropagation();
        if (key === 'rename') handleRename(item);
        if (key === 'delete') handleDelete(item.key);
      },
    };

    return (
      <div key={item.key} className="rl-tree-group">
        <div
          className={`rl-tree-node ${isSelected ? 'rl-tree-node-selected' : ''}`}
          style={{ paddingLeft: 8 + depth * 16 }}
          onClick={() => isFolder && handleSelectFolder(item.key)}
        >
          <span
            className="rl-tree-arrow"
            onClick={(e) => { e.stopPropagation(); if (isFolder && hasChildren) handleToggleExpand(item.key); }}
          >
            {isFolder && hasChildren
              ? (isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />)
              : null}
          </span>
          <span className="rl-tree-icon">{renderFileIcon(item.fileType)}</span>
          <span className="rl-tree-name" title={item.name}>{item.name}</span>
          <Dropdown menu={itemMenu} trigger={['click']}>
            <span
              className="rl-tree-more"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreOutlined />
            </span>
          </Dropdown>
        </div>
        {isFolder && isExpanded && hasChildren && (
          <div className="rl-tree-children">
            {children.map((c) => renderTreeNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ====== 右侧表格列 ======
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (text, record) => (
        <span
          className={`rl-name-cell ${record.isFolder ? 'rl-name-clickable' : ''}`}
          onClick={() => record.isFolder && handleSelectFolder(record.key)}
        >
          <span className="rl-name-icon">{renderFileIcon(record.fileType)}</span>
          <span className="rl-name-text">{text}</span>
        </span>
      ),
    },
    {
      title: '所有者',
      dataIndex: 'owner',
      width: 160,
      render: (v) => v || '-',
    },
    {
      title: '解析状态',
      dataIndex: 'parseStatus',
      width: 140,
      render: (v) => {
        const meta = PARSE_STATUS_MAP[v] || PARSE_STATUS_MAP.pending;
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '最近编辑',
      dataIndex: 'lastEdit',
      width: 200,
      render: (v) => v || '-',
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      render: (_, row) => (
        <span className="rl-table-ops">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleRename(row)}>重命名</Button>
          <Popconfirm title={`确认删除「${row.name}」？`} onConfirm={() => handleDelete(row.key)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  // ====== 添加资料菜单 ======
  const addMenu = {
    items: [
      { key: 'folder', icon: <FolderAddOutlined />, label: '新建文件夹' },
      { key: 'file', icon: <FileAddOutlined />, label: '新建资料' },
    ],
    onClick: ({ key }) => openAdd(key),
  };

  return (
    <div className="rl-layout">
      {/* ===== 左侧：Tab + 添加 + 空间目录树 ===== */}
      <div className="rl-sider">
        <div className="rl-sider-tabs">
          <Tabs
            activeKey={scope}
            onChange={(k) => { setScope(k); setKeyword(''); }}
            items={SCOPE_TABS}
            size="small"
            tabBarGutter={4}
          />
        </div>

        <div className="rl-sider-actions">
          <Dropdown menu={addMenu} trigger={['click']}>
            <Button block icon={<PlusOutlined />}>添加资料</Button>
          </Dropdown>
        </div>

        <div className="rl-sider-section-head">
          <span className="rl-sider-section-title">空间目录</span>
          <span className="rl-sider-section-tools">
            <Tooltip title="搜索">
              <SearchOutlined onClick={() => {
                const v = window.prompt('搜索资料名称', keyword) ?? keyword;
                setKeyword(v);
              }} />
            </Tooltip>
            <Tooltip title="刷新">
              <ReloadOutlined onClick={reload} />
            </Tooltip>
          </span>
        </div>

        {keyword && (
          <div className="rl-sider-keyword">
            <Tag closable onClose={() => setKeyword('')} color="blue">关键词：{keyword}</Tag>
          </div>
        )}

        <div className="rl-tree">
          {rootItems.length === 0
            ? <div className="rl-tree-empty">暂无资料</div>
            : rootItems.map((it) => renderTreeNode(it, 0))}
        </div>
      </div>

      {/* ===== 右侧：当前文件夹 + 文件表格 ===== */}
      <div className="rl-main">
        <div className="rl-main-head">
          <div className="rl-main-title">
            <span className="rl-main-title-icon">
              {renderFileIcon(currentFolder?.fileType || 'folder', { fontSize: 32 })}
            </span>
            <div className="rl-main-title-meta">
              <div className="rl-main-title-name">{currentFolder?.name || '全部资料'}</div>
              <div className="rl-main-title-sub">{currentChildren.length} 个文件</div>
            </div>
          </div>
          <div className="rl-main-actions">
            <Dropdown menu={addMenu} trigger={['click']}>
              <Button type="primary" icon={<PlusOutlined />}>添加资料</Button>
            </Dropdown>
          </div>
        </div>

        <div className="rl-main-body">
          <Table
            rowKey="key"
            size="middle"
            dataSource={currentChildren}
            columns={columns}
            pagination={currentChildren.length > 10 ? { pageSize: 10 } : false}
            locale={{ emptyText: <Empty description="暂无数据" /> }}
          />
        </div>
      </div>

      {/* ===== 添加资料 Modal ===== */}
      <Modal
        title={addType === 'folder' ? '新建文件夹' : '新建资料'}
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAddSubmit}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder={addType === 'folder' ? '请输入文件夹名称' : '请输入资料名称（含后缀名可自动识别类型）'} />
          </Form.Item>
          {addType === 'file' && (
            <>
              <Form.Item label="文件类型" name="fileType" tooltip="留空则按文件名后缀自动识别">
                <Select
                  allowClear
                  placeholder="自动识别"
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'pptx', label: 'PPT' },
                    { value: 'docx', label: 'Word' },
                    { value: 'xlsx', label: 'Excel' },
                    { value: 'image', label: '图片' },
                    { value: 'video', label: '视频' },
                    { value: 'audio', label: '音频' },
                    { value: 'whiteboard', label: '白板' },
                    { value: 'note', label: '笔记' },
                    { value: 'test', label: '测试/实训' },
                    { value: 'other', label: '其他' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="本地上传（可选）" tooltip="上传后由后端转发至阿里云 OSS，返回 https url 入库">
                <Upload
                  beforeUpload={async (file) => {
                    const inferred = inferFileType(file.name);
                    addForm.setFieldsValue({ name: file.name, fileType: inferred });
                    const hide = message.loading('上传中...', 0);
                    try {
                      const r = await fileApi.upload(file, 'resource-lib');
                      addForm.setFieldsValue({
                        url: r.url,
                        size: r.size,
                        mime: r.mime,
                      });
                      hide();
                      message.success(`上传成功（${r.storage === 'oss' ? '已存 OSS' : '本地兑底'}）`);
                    } catch (e) {
                      hide();
                      console.error(e);
                      message.error('上传失败，请确认后端是否启动');
                    }
                    return false;
                  }}
                  maxCount={1}
                >
                  <Button icon={<FileAddOutlined />}>选择文件</Button>
                </Upload>
              </Form.Item>
              <Form.Item name="url" hidden><Input /></Form.Item>
              <Form.Item name="size" hidden><Input /></Form.Item>
              <Form.Item name="mime" hidden><Input /></Form.Item>
            </>
          )}
          <div className="rl-add-tip">
            将创建到：<b>{currentFolder ? currentFolder.name : '根目录'}</b>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
