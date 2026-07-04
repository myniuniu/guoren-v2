import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Drawer,
  Descriptions,
  Select,
  message,
  Popconfirm,
  Tooltip,
  Empty,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  RedoOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { issueApi, triggerDownload } from './api';
import { removeCertificateIssueRecordsFromPersonalLibrary } from '../resourceLib/resourceLibStore';

/**
 * 证书发放 - 批次详情（明细 CRUD）
 *
 * Props:
 *  - batch: 批次对象（必传）
 *  - onBack(): 返回列表
 */
const STATUS_META = {
  SUCCESS: { color: 'success', text: '成功' },
  FAILED: { color: 'error', text: '失败' },
};

const CertificateIssueBatchDetail = ({ batch, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState();

  const [previewing, setPreviewing] = useState(null); // record
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState('');
  const [recordDetail, setRecordDetail] = useState(null);
  const previewUrlRef = useRef('');

  const load = async (override = {}) => {
    if (!batch?.id) return;
    setLoading(true);
    try {
      const data = await issueApi.pageRecord({
        batchId: batch.id,
        pageNo: override.pageNo ?? pageNo,
        pageSize: override.pageSize ?? pageSize,
        keyword: override.keyword ?? keyword,
        status: override.status ?? status,
      });
      setList(data?.records || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
      message.error('加载明细失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ pageNo: 1 });
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.id]);

  const releasePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  };

  const handlePreview = async (row) => {
    if (row.status !== 'SUCCESS') {
      message.warning('该证书未成功生成，无法预览');
      return;
    }
    setPreviewing(row);
    try {
      const [blob, detail] = await Promise.all([
        issueApi.recordFile(row.id, 'inline'),
        issueApi.getRecord(row.id),
      ]);
      releasePreview();
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewMime(blob.type || row.mime || 'application/octet-stream');
      setRecordDetail(detail);
    } catch (e) {
      console.error(e);
      message.error('预览失败');
    }
  };

  const handleDownload = async (row) => {
    try {
      const blob = await issueApi.recordFile(row.id, 'attachment');
      triggerDownload(blob, row.fileName || `certificate_${row.id}`);
    } catch (e) {
      console.error(e);
      message.error('下载失败');
    }
  };

  const handleRerender = async (row) => {
    try {
      await issueApi.rerender(row.id);
      message.success('已重新渲染');
      load();
    } catch (e) {
      console.error(e);
      message.error('重新渲染失败');
    }
  };

  const handleDelete = async (row) => {
    try {
      await issueApi.removeRecord(row.id);
      removeCertificateIssueRecordsFromPersonalLibrary([row.id]);
      message.success('已删除');
      load();
    } catch (e) {
      console.error(e);
      message.error('删除失败');
    }
  };

  const closePreview = () => {
    setPreviewing(null);
    setRecordDetail(null);
    releasePreview();
    setPreviewUrl('');
    setPreviewMime('');
  };

  const columns = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      align: 'center',
      render: (_, __, i) => (pageNo - 1) * pageSize + i + 1,
    },
    {
      title: '持证人',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 120,
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#bbb' }}>-</span>,
    },
    {
      title: '证书编号',
      dataIndex: 'certNo',
      key: 'certNo',
      width: 180,
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#bbb' }}>-</span>,
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 78,
      align: 'center',
      render: (v) => <Tag style={{ marginInlineEnd: 0 }}>{(v || '').toUpperCase()}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      align: 'center',
      render: (v, row) => {
        const meta = STATUS_META[v] || { color: 'default', text: v || '-' };
        const tag = <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>{meta.text}</Tag>;
        return v === 'FAILED' && row.errorMsg ? (
          <Tooltip title={row.errorMsg}>{tag}</Tooltip>
        ) : (
          tag
        );
      },
    },
    {
      title: '生成时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (v) => (v ? String(v).replace('T', ' ').slice(0, 19) : '-'),
    },
    {
      title: '操作',
      key: 'op',
      width: 220,
      fixed: 'right',
      align: 'center',
      render: (_, row) => (
        <Space size={0} wrap={false}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(row)}
            disabled={row.status !== 'SUCCESS'}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(row)}
            disabled={row.status !== 'SUCCESS'}
          >
            下载
          </Button>
          <Button type="link" size="small" icon={<RedoOutlined />} onClick={() => handleRerender(row)}>
            重渲
          </Button>
          <Popconfirm title="确认删除该证书？" onConfirm={() => handleDelete(row)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{ margin: 16 }}
      title={
        <Space>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回
          </Button>
          <Typography.Text strong>{batch?.batchName || '批次详情'}</Typography.Text>
          <Tag>{batch?.templateName}</Tag>
          <Tag color="blue">{(batch?.format || '').toUpperCase()}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="按持证人 / 证书号 / 文件名搜索"
            prefix={<SearchOutlined />}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => load({ pageNo: 1 })}
            style={{ width: 260 }}
          />
          <Select
            placeholder="状态"
            allowClear
            value={status}
            onChange={(v) => {
              setStatus(v);
              load({ pageNo: 1, status: v });
            }}
            style={{ width: 120 }}
            options={[
              { label: '成功', value: 'SUCCESS' },
              { label: '失败', value: 'FAILED' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            刷新
          </Button>
        </Space>
      }
    >
      {batch?.remark && (
        <div style={{ marginBottom: 12, color: '#666' }}>备注：{batch.remark}</div>
      )}
      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1096 }}
        pagination={{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPageNo(p);
            setPageSize(ps);
            load({ pageNo: p, pageSize: ps });
          },
        }}
      />

      <Drawer
        open={!!previewing}
        onClose={closePreview}
        title={previewing?.fileName || '证书预览'}
        width={720}
        destroyOnClose
        extra={
          previewing &&
          previewing.status === 'SUCCESS' && (
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload(previewing)}>
              下载
            </Button>
          )
        }
      >
        {recordDetail && (
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="持证人">{recordDetail.recipient || '-'}</Descriptions.Item>
            <Descriptions.Item label="证书编号">{recordDetail.certNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="字段数据">
              <Typography.Paragraph
                copyable
                style={{ marginBottom: 0, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap' }}
              >
                {recordDetail.dataJson || '{}'}
              </Typography.Paragraph>
            </Descriptions.Item>
          </Descriptions>
        )}

        {previewUrl ? (
          previewMime.includes('pdf') ? (
            <iframe
              src={previewUrl}
              title="cert-pdf"
              style={{ width: '100%', height: '60vh', border: '1px solid #eee' }}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <img
                src={previewUrl}
                alt="证书预览"
                style={{ maxWidth: '100%', maxHeight: '60vh', border: '1px solid #eee' }}
              />
            </div>
          )
        ) : (
          <Empty />
        )}
      </Drawer>
    </Card>
  );
};

export default CertificateIssueBatchDetail;
