import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Tooltip,
  Badge,
  message,
  Typography,
  Descriptions,
  Spin,
  Empty,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PaperClipOutlined,
  PartitionOutlined,
  SettingOutlined,
  CloseOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import ArchiveFormModal from './ArchiveFormModal';
import { archiveApi, ARCHIVE_TYPE_MAP, ARCHIVE_STATUS_MAP } from './api';
import './ArchiveModule.css';

const PROCESS_API = '/api/workflow/process';
const DESIGNER_BASE = 'http://localhost:5176';
const ARCHIVE_PROCESS_KEY = 'archiveProcess';

const { Text } = Typography;

const DEMO_USERS = [
  { id: 'admin', name: '管理员', dept: '总公司', role: '管理员', group: '' },
  { id: 'wangzong', name: '王总', dept: '总公司', role: '部门经理', group: 'managers' },
  { id: 'zhaogong', name: '赵工', dept: '技术部', role: '部门经理', group: 'managers' },
  { id: 'zhangsan', name: '张三', dept: '前端组', role: '普通用户', group: '' },
  { id: 'liusi', name: '刘四', dept: '前端组', role: '普通用户', group: '' },
  { id: 'zhaoliu', name: '赵六', dept: '后端组', role: '管理员', group: '' },
  { id: 'huangqi', name: '黄七', dept: '后端组', role: '普通用户', group: '' },
  { id: 'fengce', name: '冯测', dept: '测试组', role: '普通用户', group: '' },
  { id: 'lisi', name: '李四', dept: '人事部', role: '部门经理', group: 'hr' },
  { id: 'chenhr', name: '陈HR', dept: '人事部', role: '普通用户', group: 'hr' },
  { id: 'wangwu', name: '王五', dept: '财务部', role: '普通用户', group: '' },
  { id: 'sunqi', name: '孙七', dept: '市场部', role: '普通用户', group: '' },
  { id: 'zhouba', name: '周八', dept: '产品部', role: '部门经理', group: 'managers' },
  { id: 'wujing', name: '吴静', dept: '产品部', role: '普通用户', group: '' },
];

export default function ArchiveModule() {
  const [currentUser, setCurrentUser] = useState('zhangsan');
  const [activeTab, setActiveTab] = useState('myArchives');

  // 数据
  const [myList, setMyList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 搜索
  const [searchType, setSearchType] = useState();
  const [searchKeyword, setSearchKeyword] = useState('');

  // 弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formInitial, setFormInitial] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // 流程设计器
  const [designerSrc, setDesignerSrc] = useState('');
  const [designerTitle, setDesignerTitle] = useState('');
  const [processInfo, setProcessInfo] = useState(null);
  const [processLoading, setProcessLoading] = useState(false);

  const currentUserInfo = useMemo(
    () => DEMO_USERS.find((u) => u.id === currentUser),
    [currentUser]
  );

  // ====== 数据加载 ======
  const loadMyList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await archiveApi.getMyList(currentUser);
      setMyList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadPendingList = useCallback(async () => {
    try {
      const data = await archiveApi.getPendingList();
      setPendingList(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const reloadAll = useCallback(() => {
    loadMyList();
    loadPendingList();
  }, [loadMyList, loadPendingList]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // ====== 流程配置 ======
  const loadProcessInfo = useCallback(async () => {
    setProcessLoading(true);
    try {
      const res = await fetch(`${PROCESS_API}/key/${ARCHIVE_PROCESS_KEY}`);
      if (res.ok) {
        const data = await res.json();
        setProcessInfo(data);
      } else {
        setProcessInfo(null);
      }
    } catch {
      setProcessInfo(null);
    } finally {
      setProcessLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProcessInfo();
  }, [loadProcessInfo]);

  // 监听设计器 iframe 部署完成
  useEffect(() => {
    const handler = (event) => {
      const data = event.data || {};
      if (data.type === 'process-deployed') {
        loadProcessInfo();
        message.success('流程已部署成功');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [loadProcessInfo]);

  const openDesignerNew = () => {
    setDesignerTitle('设计档案审批流程');
    setDesignerSrc(`${DESIGNER_BASE}/designer?_t=${Date.now()}`);
  };

  const openDesignerEdit = () => {
    setDesignerTitle('修改档案审批流程');
    const params = new URLSearchParams();
    if (processInfo?.key) params.set('processKey', processInfo.key);
    else if (processInfo?.deploymentId) params.set('deploymentId', processInfo.deploymentId);
    setDesignerSrc(`${DESIGNER_BASE}/designer?${params.toString()}&_t=${Date.now()}`);
  };

  const closeDesigner = () => {
    setDesignerSrc('');
    setDesignerTitle('');
    loadProcessInfo();
  };

  // ====== 统计 ======
  const stats = useMemo(() => {
    const drafts = myList.filter((r) => r.status === 'draft').length;
    const pending = myList.filter((r) => r.status === 'pending').length;
    const approved = myList.filter((r) => r.status === 'approved').length;
    const rejected = myList.filter((r) => r.status === 'rejected').length;
    return { drafts, pending, approved, rejected, total: myList.length };
  }, [myList]);

  // ====== 过滤 ======
  const filteredMyList = useMemo(() => {
    let list = myList;
    if (searchType) {
      list = list.filter((r) => r.archiveType === searchType);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(kw) ||
          r.description?.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [myList, searchType, searchKeyword]);

  // ====== 操作 ======
  const openCreate = () => {
    setFormMode('create');
    setFormInitial(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setFormMode('edit');
    setFormInitial(record);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (formMode === 'edit' && formInitial?.id) {
        await archiveApi.update(formInitial.id, values);
        message.success('草稿已更新');
      } else {
        await archiveApi.create(values);
        message.success('草稿已保存');
      }
      setFormOpen(false);
      reloadAll();
    } catch (err) {
      message.error('保存失败：' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除该档案草稿吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await archiveApi.delete(record.id);
          message.success('已删除');
          reloadAll();
        } catch (err) {
          message.error('删除失败：' + err.message);
        }
      },
    });
  };

  const handleSubmit = (record) => {
    Modal.confirm({
      title: '提交审批',
      content: '提交后将进入主管审批流程，审批通过后档案将正式存入组织资料库。确定提交吗？',
      okText: '提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await archiveApi.submit(record.id);
          message.success('已提交，等待审批');
          reloadAll();
        } catch (err) {
          message.error('提交失败：' + err.message);
        }
      },
    });
  };

  const handleApprove = (record, approved) => {
    const title = approved ? '通过确认' : '驳回确认';
    const content = approved
      ? '审批通过后，档案附件将自动存入组织资料库的「员工档案」目录。确定通过吗？'
      : '确定驳回该档案提交申请吗？';
    let comment = '';
    Modal.confirm({
      title,
      content: (
        <div>
          <p>{content}</p>
          <Input.TextArea
            placeholder="审批意见（选填）"
            rows={2}
            onChange={(e) => { comment = e.target.value; }}
          />
        </div>
      ),
      okText: approved ? '通过' : '驳回',
      okButtonProps: approved ? {} : { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await archiveApi.approve(record.id, approved, comment);
          message.success(approved ? '已通过，档案已存入资料库' : '已驳回');
          reloadAll();
        } catch (err) {
          message.error('审批失败：' + err.message);
        }
      },
    });
  };

  // ====== 表格列 ======
  const myColumns = [
    {
      title: '档案名称',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '档案类型',
      dataIndex: 'archiveType',
      width: 110,
      render: (v) => {
        const meta = ARCHIVE_TYPE_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '附件',
      dataIndex: 'attachments',
      width: 80,
      align: 'center',
      render: (atts) => (
        <Badge count={atts?.length || 0} size="small" color="#1677ff">
          <PaperClipOutlined style={{ fontSize: 16 }} />
        </Badge>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const meta = ARCHIVE_STATUS_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 170,
      render: (v) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
    },
    {
      title: '操作',
      width: 200,
      align: 'center',
      render: (_, record) => {
        if (record.status === 'draft') {
          return (
            <Space size="small">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                编辑
              </Button>
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(record)}>
                提交
              </Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                删除
              </Button>
            </Space>
          );
        }
        if (record.status === 'approved' || record.status === 'rejected') {
          return (
            <Tooltip title={record.approveComment || '无审批意见'}>
              <Button type="link" size="small" icon={<FileTextOutlined />}>
                查看
              </Button>
            </Tooltip>
          );
        }
        return <Tag color="processing">审批中</Tag>;
      },
    },
  ];

  const pendingColumns = [
    {
      title: '档案名称',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '提交人',
      dataIndex: 'applicantName',
      width: 100,
      render: (v, r) => v || r.applicant,
    },
    {
      title: '档案类型',
      dataIndex: 'archiveType',
      width: 110,
      render: (v) => {
        const meta = ARCHIVE_TYPE_MAP[v];
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : v;
      },
    },
    {
      title: '附件',
      dataIndex: 'attachments',
      width: 200,
      render: (atts) =>
        atts?.length ? (
          <div className="archive-attachment-list">
            {atts.map((a, i) => (
              <span key={i} className="archive-attachment-item">
                <PaperClipOutlined />
                <a href={a.url} target="_blank" rel="noreferrer">{a.fileName || a.name}</a>
              </span>
            ))}
          </div>
        ) : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 170,
    },
    {
      title: '备注',
      dataIndex: 'description',
      ellipsis: true,
      width: 150,
      render: (v) => v || '-',
    },
    {
      title: '操作',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => handleApprove(record, true)}>
            通过
          </Button>
          <Button size="small" danger onClick={() => handleApprove(record, false)}>
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="archive-module">
      {/* 头部 */}
      <div className="archive-module-header">
        <div>
          <span className="archive-module-header-title">档案提交</span>
          <span className="archive-module-header-subtitle">
            提交个人档案信息，经审批后存入组织资料库
          </span>
        </div>
        <Space>
          <Text type="secondary">当前用户：</Text>
          <Select
            value={currentUser}
            onChange={setCurrentUser}
            style={{ width: 220 }}
            options={DEMO_USERS.map((u) => ({
              value: u.id,
              label: `${u.name}（${u.dept}·${u.role}）`,
            }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建档案
          </Button>
        </Space>
      </div>

      {/* 统计 */}
      <Row gutter={16} className="archive-stats-row">
        <Col span={5}>
          <Card size="small">
            <Statistic title="总提交" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="草稿" value={stats.drafts} prefix={<EditOutlined />} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="待审批" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="已通过" value={stats.approved} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已拒绝" value={stats.rejected} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'myArchives',
            label: (
              <span>
                <FileTextOutlined /> 我的档案
                {stats.drafts > 0 && <Badge count={stats.drafts} size="small" offset={[6, -2]} />}
              </span>
            ),
            children: (
              <>
                <div className="archive-toolbar">
                  <div className="archive-toolbar-left">
                    <Input
                      placeholder="搜索档案名称"
                      prefix={<SearchOutlined />}
                      allowClear
                      style={{ width: 200 }}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                    <Select
                      placeholder="档案类型"
                      allowClear
                      style={{ width: 130 }}
                      value={searchType}
                      onChange={setSearchType}
                      options={Object.entries(ARCHIVE_TYPE_MAP).map(([k, v]) => ({
                        value: k,
                        label: v.label,
                      }))}
                    />
                  </div>
                  <div className="archive-toolbar-right">
                    <Tooltip title="刷新">
                      <Button icon={<ReloadOutlined />} onClick={reloadAll} />
                    </Tooltip>
                  </div>
                </div>
                <Table
                  rowKey="id"
                  dataSource={filteredMyList}
                  columns={myColumns}
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                />
              </>
            ),
          },
          {
            key: 'pendingApproval',
            label: (
              <span>
                <AuditOutlined /> 待办审批
                {pendingList.length > 0 && (
                  <Badge count={pendingList.length} size="small" offset={[6, -2]} />
                )}
              </span>
            ),
            children: (
              <Table
                rowKey="id"
                dataSource={pendingList}
                columns={pendingColumns}
                size="middle"
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            ),
          },
          {
            key: 'processConfig',
            label: (
              <span>
                <PartitionOutlined /> 流程配置
              </span>
            ),
            children: (
              <div className="archive-process-config">
                <Alert
                  message="通过BPMN流程设计器自定义档案审批节点，支持多级审批、条件分支、会签等"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Card title="当前绑定流程" size="small" className="archive-process-card">
                  {processLoading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                      <Spin tip="加载流程信息..." />
                    </div>
                  ) : processInfo ? (
                    <>
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="流程名称">
                          <Text strong>{processInfo.name}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="流程标识">
                          <code>{processInfo.key}</code>
                        </Descriptions.Item>
                        <Descriptions.Item label="版本">
                          <Tag color="green">v{processInfo.version}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="状态">
                          {processInfo.suspensionState === 1 ? (
                            <Tag color="success">启用</Tag>
                          ) : (
                            <Tag color="default">挂起</Tag>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="资源文件" span={2}>
                          <Text type="secondary">{processInfo.resourceName}</Text>
                        </Descriptions.Item>
                      </Descriptions>
                      <div style={{ marginTop: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={openDesignerEdit}
                          >
                            修改审批流程
                          </Button>
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={loadProcessInfo}
                          >
                            刷新
                          </Button>
                        </Space>
                      </div>
                    </>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="尚未配置档案审批流程"
                    >
                      <Button
                        type="primary"
                        icon={<RocketOutlined />}
                        onClick={openDesignerNew}
                      >
                        创建审批流程
                      </Button>
                    </Empty>
                  )}
                </Card>

                <Card
                  title="设计说明"
                  size="small"
                  className="archive-process-card"
                  style={{ marginTop: 16 }}
                >
                  <div className="archive-process-tips">
                    <p><SettingOutlined /> 流程设计器使用提示：</p>
                    <ul>
                      <li>流程标识（Process ID）建议设为 <code>archiveProcess</code> 以便系统自动识别</li>
                      <li>可添加多个 <strong>UserTask</strong> 节点作为审批环节，支持配置审批人/候选组</li>
                      <li>支持使用排他网关（ExclusiveGateway）实现条件分支审批</li>
                      <li>结束事件 id 建议为 <code>endApproved</code>（通过）和 <code>endRejected</code>（拒绝）</li>
                      <li>保存并部署后即刻生效，新提交的档案将按最新流程执行</li>
                    </ul>
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* 流程说明 */}
      <Card size="small" className="archive-flow-card">
        <Text strong><FolderOpenOutlined /> 流程说明</Text>
        <div className="archive-flow-steps">
          <div className="archive-flow-step">
            <div className="archive-flow-step-num">1</div>
            <Text>员工提交档案</Text>
          </div>
          <span className="archive-flow-arrow">→</span>
          <div className="archive-flow-step">
            <div className="archive-flow-step-num">2</div>
            <Text>自定义审批节点</Text>
          </div>
          <span className="archive-flow-arrow">→</span>
          <div className="archive-flow-step">
            <div className="archive-flow-step-num step-success">3</div>
            <Text>存入组织资料库</Text>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Text type="secondary">
            审批通过后，附件将自动存入资料库→组织资料→员工档案目录。可在「流程配置」Tab中通过BPMN设计器自定义审批节点。
          </Text>
        </div>
      </Card>

      {/* 表单弹窗 */}
      <ArchiveFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        mode={formMode}
        initialData={formInitial}
        loading={formLoading}
        currentUser={currentUser}
        currentUserName={currentUserInfo?.name}
      />

      {/* 设计器全屏覆盖层 */}
      {designerSrc && (
        <div className="archive-designer-overlay">
          <div className="archive-designer-overlay-header">
            <span className="archive-designer-overlay-title">{designerTitle}</span>
            <Button icon={<CloseOutlined />} onClick={closeDesigner}>
              关闭
            </Button>
          </div>
          <iframe
            src={designerSrc}
            className="archive-designer-overlay-iframe"
            title="档案审批流程设计器"
          />
        </div>
      )}
    </div>
  );
}
