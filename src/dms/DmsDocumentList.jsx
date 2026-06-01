import { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SwapOutlined,
  FolderOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  dmsApi,
  dmsCategoryApi,
  dmsTagApi,
  DMS_DOC_TYPES,
  DMS_DOC_TYPE_MAP,
  DMS_STATUS_MAP,
  formatFileSize,
} from './api';

const STATUS_OPTIONS = Object.entries(DMS_STATUS_MAP).map(([value, v]) => ({
  value,
  label: v.label,
}));

/**
 * 文档列表 + 搜索 + 分页 + 行操作 + 批量移动 + 标签筛选
 */
export default function DmsDocumentList({
  categoryId,
  tagName,
  onCreate,
  onView,
  onEdit,
  refreshFlag,
  onChanged,
}) {
  const [keyword, setKeyword] = useState('');
  const [docType, setDocType] = useState();
  const [status, setStatus] = useState();
  const [filterTag, setFilterTag] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const [tagOptions, setTagOptions] = useState([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargets, setMoveTargets] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [moveCategoryId, setMoveCategoryId] = useState('');

  // 加载标签下拉
  const loadTags = useCallback(async () => {
    try {
      const list = await dmsTagApi.list('usage');
      setTagOptions(
        (list || []).map((t) => ({
          value: t.name,
          label: t.usageCount ? `${t.name} (${t.usageCount})` : t.name,
        })),
      );
    } catch {
      // 静默
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags, refreshFlag]);

  // 同步外部 tagName -> filterTag
  useEffect(() => {
    setFilterTag(tagName || undefined);
  }, [tagName]);

  const loadList = useCallback(
    async (page = pagination.current, size = pagination.pageSize) => {
      setLoading(true);
      try {
        const res = await dmsApi.list({
          keyword: keyword || undefined,
          docType: docType || undefined,
          status: status || undefined,
          categoryId: categoryId || undefined,
          tagName: filterTag || tagName || undefined,
          page,
          size,
        });
        setRows(res.rows || []);
        setSelectedKeys([]);
        setPagination({
          current: res.page || page,
          pageSize: res.size || size,
          total: res.total || 0,
        });
      } catch (e) {
        message.error('加载列表失败：' + (e?.message || ''));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, docType, status, categoryId, filterTag, tagName, pagination.pageSize],
  );

  // 初始 + 外部刷新 / 分类 / 标签变化
  useEffect(() => {
    loadList(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, tagName, refreshFlag]);

  const handleSearch = () => {
    loadList(1, pagination.pageSize);
  };

  const handleReset = () => {
    setKeyword('');
    setDocType(undefined);
    setStatus(undefined);
    setFilterTag(undefined);
    setTimeout(() => loadList(1, pagination.pageSize), 0);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `删除后将进入软删除（不可在列表中可见）。确认删除文档「${record.title}」？`,
      okType: 'danger',
      onOk: async () => {
        try {
          await dmsApi.remove(record.id);
          message.success('已删除');
          loadList(pagination.current, pagination.pageSize);
          onChanged?.();
        } catch (e) {
          message.error('删除失败：' + (e?.message || ''));
        }
      },
    });
  };

  // ---------- 批量移动 ----------

  const openBulkMove = async (ids) => {
    setMoveTargets(ids);
    try {
      const tree = await dmsCategoryApi.tree();
      const flat = [{ id: '', name: '— 未分类（顶级）—', depth: 0 }];
      const dfs = (nodes, depth) => {
        (nodes || []).forEach((n) => {
          flat.push({ id: n.id, name: n.name, depth });
          dfs(n.children, depth + 1);
        });
      };
      dfs(tree || [], 1);
      setCategoryOptions(flat);
      setMoveCategoryId('');
      setMoveOpen(true);
    } catch {
      message.error('加载分类失败');
    }
  };

  const submitBulkMove = async () => {
    try {
      await dmsApi.bulkMove(moveTargets, moveCategoryId || '');
      message.success(`已移动 ${moveTargets.length} 个文档`);
      setMoveOpen(false);
      loadList(pagination.current, pagination.pageSize);
      onChanged?.();
    } catch (e) {
      message.error('移动失败：' + (e?.response?.data?.message || e?.message || ''));
    }
  };

  // ---------- 列定义 ----------

  const columns = [
    {
      title: '编号',
      dataIndex: 'docNo',
      key: 'docNo',
      width: 170,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => onView && onView(record)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'docType',
      key: 'docType',
      width: 100,
      render: (v) => (v ? <Tag color="blue">{DMS_DOC_TYPE_MAP[v] || v}</Tag> : '-'),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags) => {
        const arr = Array.isArray(tags) ? tags : (tags || '').split(',').filter(Boolean);
        if (!arr.length) return '-';
        return (
          <>
            {arr.slice(0, 3).map((t) => (
              <Tag
                key={t}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterTag(t);
                  setTimeout(() => loadList(1, pagination.pageSize), 0);
                }}
              >
                {t}
              </Tag>
            ))}
            {arr.length > 3 && (
              <Tooltip title={arr.slice(3).join(', ')}>
                <Tag>+{arr.length - 3}</Tag>
              </Tooltip>
            )}
          </>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => {
        const info = DMS_STATUS_MAP[v] || { label: v, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'latestVersion',
      key: 'latestVersion',
      width: 70,
      render: (v) => `v${v || 1}`,
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (v) => formatFileSize(v),
    },
    {
      title: '创建人',
      dataIndex: 'createBy',
      key: 'createBy',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 170,
    },
    {
      title: '操作',
      key: 'op',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="查看">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onView && onView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit && onEdit(record)} />
          </Tooltip>
          <Tooltip title="移动到分类">
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => openBulkMove([record.id])}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              disabled={!record.fileName}
              onClick={async () => {
                try {
                  const d = await dmsApi.detail(record.id);
                  if (d?.fileUrl) {
                    window.open(d.fileUrl, '_blank');
                  } else {
                    message.info('该文档暂无附件');
                  }
                } catch {
                  message.error('获取下载链接失败');
                }
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="dms-toolbar">
        <Input
          allowClear
          placeholder="搜索标题 / 编号 / 标签"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Select
          allowClear
          placeholder="文档类型"
          style={{ width: 130 }}
          value={docType}
          onChange={setDocType}
          options={DMS_DOC_TYPES}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 120 }}
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <Select
          allowClear
          showSearch
          placeholder="标签筛选"
          style={{ width: 160 }}
          value={filterTag}
          onChange={(v) => {
            setFilterTag(v);
            setTimeout(() => loadList(1, pagination.pageSize), 0);
          }}
          options={tagOptions}
          optionFilterProp="label"
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <div className="dms-toolbar-spacer" />
        {selectedKeys.length > 0 && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'move',
                  label: '批量移动到分类',
                  icon: <FolderOutlined />,
                  onClick: () => openBulkMove(selectedKeys),
                },
              ],
            }}
          >
            <Button>
              批量操作（{selectedKeys.length}） <DownOutlined />
            </Button>
          </Dropdown>
        )}
        <Button icon={<ReloadOutlined />} onClick={() => loadList(pagination.current, pagination.pageSize)}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新建文档
        </Button>
      </div>

      <div className="dms-table-wrap">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          size="middle"
          scroll={{ x: 1320 }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadList(page, pageSize),
          }}
        />
      </div>

      <Modal
        title={`移动到分类（共 ${moveTargets.length} 个文档）`}
        open={moveOpen}
        onCancel={() => setMoveOpen(false)}
        onOk={submitBulkMove}
        destroyOnHidden
        okText="移动"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8, color: '#8a8f99' }}>选择目标分类：</div>
        <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
          {categoryOptions.map((opt) => (
            <div
              key={opt.id || '__root__'}
              style={{
                padding: '6px 12px',
                paddingLeft: 12 + (opt.depth || 0) * 16,
                background: moveCategoryId === opt.id ? '#e6f4ff' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setMoveCategoryId(opt.id)}
            >
              <FolderOutlined style={{ marginRight: 6 }} />
              {opt.name}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
