import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Input, Select, Tooltip, Drawer, Progress, Empty, message, Space, Statistic, Card, Modal,
} from 'antd';
import {
  ReloadOutlined, EyeOutlined, SearchOutlined, FileTextOutlined, CheckCircleFilled,
  ClockCircleFilled, SyncOutlined, CloseCircleFilled, PauseCircleFilled, RobotOutlined,
  FileSearchOutlined, FilePdfOutlined, FileImageOutlined, PlayCircleOutlined,
  SoundOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined,
} from '@ant-design/icons';
import {
  loadResourceLib, getAllItemsAcrossLibraries, updateItemParseStatus, getOrganizations,
  getLibraryList,
} from './resourceLibStore';
import './ResourceParseStatus.css';

// 稳定 hash：根据 key 派生 mock 数值
const stableHash = (s, mod) => {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
};

// 文件类型颜色
const TYPE_COLOR = {
  pdf: 'red', pptx: 'orange', docx: 'blue', xlsx: 'green',
  image: 'purple', video: 'magenta', audio: 'cyan',
  whiteboard: 'geekblue', note: 'lime', test: 'gold', other: 'default',
};

// 解析状态元信息
const STATUS_META = {
  parsed:  { label: '已解析',  color: 'success',    icon: <CheckCircleFilled /> },
  parsing: { label: '解析中',  color: 'processing', icon: <SyncOutlined spin /> },
  pending: { label: '待解析',  color: 'default',    icon: <PauseCircleFilled /> },
  failed:  { label: '解析失败', color: 'error',     icon: <CloseCircleFilled /> },
};

// 派生 mock 解析详情
const buildParseInfo = (item) => {
  const status = item.parseStatus || 'pending';
  const seed = item.key || '';
  const chunkCount = status === 'pending' ? 0 : 20 + stableHash(seed, 280);
  const tokenCount = chunkCount * (160 + stableHash(seed + 'tk', 80));
  const vectorDim = stableHash(seed + 'd', 2) === 0 ? 1536 : 768;
  const sizeKB = (50 + stableHash(seed + 's', 20000));
  const progress = status === 'parsing' ? 30 + stableHash(seed + 'p', 60) : status === 'parsed' ? 100 : 0;
  const errorMsg = status === 'failed'
    ? ['文件格式不支持', '解析超时', 'Embedding 服务异常', '文件已损坏'][stableHash(seed + 'e', 4)]
    : null;
  // mock 开始时间：基于 lastEdit 偏移几分钟
  const parseStartedAt = status === 'pending' ? null : (item.lastEdit || '').replace(/(\d{2}):(\d{2})$/, (_, h, m) => {
    const mm = Math.max(0, parseInt(m) - 1 - stableHash(seed + 'st', 5));
    return `${h}:${String(mm).padStart(2, '0')}`;
  });
  return { chunkCount, tokenCount, vectorDim, sizeKB, progress, errorMsg, parseStartedAt };
};

export default function ResourceParseStatus() {
  const [data, setData] = useState(loadResourceLib);
  const [keyword, setKeyword] = useState('');
  const [libFilter, setLibFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [drawerItem, setDrawerItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  // 计算资料在库中的路径
  const getItemPath = (item) => {
    if (!item) return '/';
    const scope = item.libraryScope === 'personal' ? 'personal' : 'organization';
    // 获取对应库的完整列表（含文件夹）
    let list;
    if (scope === 'personal') {
      list = data.personal || [];
    } else {
      list = (data.organizations || {})[item.libraryId] || [];
    }
    const parts = [];
    let parentKey = item.parentKey;
    let depth = 0;
    while (parentKey && depth < 20) {
      const parent = list.find((r) => r.key === parentKey);
      if (parent) {
        parts.unshift(parent.name);
        parentKey = parent.parentKey;
      } else break;
      depth++;
    }
    return '/' + (parts.length > 0 ? parts.join('/') + '/' : '');
  };

  const items = useMemo(() => getAllItemsAcrossLibraries(data), [data]);
  const orgs = useMemo(() => getOrganizations(data), [data]);

  // 全表带 mock 解析详情
  const enriched = useMemo(() => items.map((it) => ({ ...it, _parse: buildParseInfo(it) })), [items]);

  // 统计
  const stats = useMemo(() => {
    const s = { total: enriched.length, parsed: 0, parsing: 0, pending: 0, failed: 0 };
    enriched.forEach((it) => {
      const st = it.parseStatus || 'pending';
      if (s[st] !== undefined) s[st]++;
    });
    return s;
  }, [enriched]);

  // 过滤
  const filtered = useMemo(() => {
    return enriched.filter((it) => {
      if (libFilter !== 'all' && it.libraryId !== libFilter) return false;
      if (statusFilter !== 'all' && (it.parseStatus || 'pending') !== statusFilter) return false;
      if (typeFilter !== 'all' && it.fileType !== typeFilter) return false;
      if (keyword && !(it.name || '').toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [enriched, libFilter, statusFilter, typeFilter, keyword]);

  // 重试解析（mock）：先置 parsing，2-4s 后随机 80% 成功 / 20% 失败
  const handleRetry = (item) => {
    setData((d) => updateItemParseStatus(d, item.libraryId, item.key, { parseStatus: 'parsing' }));
    message.loading({ content: `开始重新解析「${item.name}」`, key: item.key, duration: 0 });
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setData((d) => updateItemParseStatus(d, item.libraryId, item.key, {
        parseStatus: success ? 'parsed' : 'failed',
      }));
      message.destroy(item.key);
      if (success) message.success(`「${item.name}」解析完成`);
      else message.error(`「${item.name}」解析失败，请稍后重试`);
    }, delay);
  };

  // 批量重试
  const handleBatchRetry = () => {
    const list = filtered.filter((it) => ['failed', 'pending'].includes(it.parseStatus || 'pending'));
    if (list.length === 0) {
      message.info('当前筛选范围内没有待解析或失败的资料');
      return;
    }
    message.success(`已加入解析队列：${list.length} 个`);
    list.forEach((it, idx) => setTimeout(() => handleRetry(it), idx * 200));
  };

  // 资料预览内容渲染
  const renderPreviewContent = (item) => {
    const type = item.fileType || 'other';
    if (type === 'image') {
      if (item.dataUrl) {
        return <img src={item.dataUrl} alt={item.name} style={{ width: '100%', borderRadius: 8 }} />;
      }
      return (
        <div className="rps-preview-placeholder">
          <FileImageOutlined style={{ fontSize: 64, color: '#af52de' }} />
          <p>图片预览（暂无数据源）</p>
        </div>
      );
    }
    if (type === 'pdf') {
      return (
        <div className="rps-preview-placeholder">
          <FilePdfOutlined style={{ fontSize: 64, color: '#ff3b30' }} />
          <p>{item.name}</p>
          <span className="rps-muted">大小：{item._parse.sizeKB} KB · 片段数：{item._parse.chunkCount}</span>
          <div className="rps-preview-mock-content">
            <div className="rps-preview-mock-line" style={{ width: '90%' }} />
            <div className="rps-preview-mock-line" style={{ width: '75%' }} />
            <div className="rps-preview-mock-line" style={{ width: '85%' }} />
            <div className="rps-preview-mock-line" style={{ width: '60%' }} />
            <div className="rps-preview-mock-line" style={{ width: '80%' }} />
          </div>
        </div>
      );
    }
    if (type === 'pptx') {
      return (
        <div className="rps-preview-placeholder">
          <FilePptOutlined style={{ fontSize: 64, color: '#ff9500' }} />
          <p>{item.name}</p>
          <span className="rps-muted">大小：{item._parse.sizeKB} KB · 片段数：{item._parse.chunkCount}</span>
          <div className="rps-preview-slides">
            {Array.from({ length: Math.min(4, Math.ceil(item._parse.chunkCount / 20)) }, (_, i) => (
              <div key={i} className="rps-preview-slide">
                <span className="rps-muted">幻灯片 {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'docx') {
      return (
        <div className="rps-preview-placeholder">
          <FileWordOutlined style={{ fontSize: 64, color: '#007aff' }} />
          <p>{item.name}</p>
          <span className="rps-muted">大小：{item._parse.sizeKB} KB · 片段数：{item._parse.chunkCount}</span>
          <div className="rps-preview-mock-content">
            <div className="rps-preview-mock-line" style={{ width: '95%' }} />
            <div className="rps-preview-mock-line" style={{ width: '80%' }} />
            <div className="rps-preview-mock-line" style={{ width: '88%' }} />
            <div className="rps-preview-mock-line" style={{ width: '70%' }} />
          </div>
        </div>
      );
    }
    if (type === 'xlsx') {
      return (
        <div className="rps-preview-placeholder">
          <FileExcelOutlined style={{ fontSize: 64, color: '#34c759' }} />
          <p>{item.name}</p>
          <span className="rps-muted">大小：{item._parse.sizeKB} KB</span>
        </div>
      );
    }
    if (type === 'video') {
      return (
        <div className="rps-preview-placeholder">
          <PlayCircleOutlined style={{ fontSize: 64, color: '#ff2d55' }} />
          <p>{item.name}</p>
          <span className="rps-muted">视频文件 · {item._parse.sizeKB} KB</span>
        </div>
      );
    }
    if (type === 'audio') {
      return (
        <div className="rps-preview-placeholder">
          <SoundOutlined style={{ fontSize: 64, color: '#5856d6' }} />
          <p>{item.name}</p>
          <span className="rps-muted">音频文件 · {item._parse.sizeKB} KB</span>
        </div>
      );
    }
    // whiteboard / note / test / other
    return (
      <div className="rps-preview-placeholder">
        <FileTextOutlined style={{ fontSize: 64, color: '#86868b' }} />
        <p>{item.name}</p>
        <span className="rps-muted">{type} · {item._parse.sizeKB} KB · 片段数：{item._parse.chunkCount}</span>
        <div className="rps-preview-mock-content">
          <div className="rps-preview-mock-line" style={{ width: '85%' }} />
          <div className="rps-preview-mock-line" style={{ width: '70%' }} />
          <div className="rps-preview-mock-line" style={{ width: '90%' }} />
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: '文件名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (text, r) => (
        <span className="rps-name-cell">
          <FileTextOutlined style={{ color: '#86868b' }} />
          <span className="rps-name-text" title={text}>{text}</span>
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 100,
      render: (t) => t ? <Tag color={TYPE_COLOR[t] || 'default'}>{t}</Tag> : '--',
    },
    {
      title: '位置',
      key: 'location',
      width: 200,
      render: (_, r) => {
        const path = getItemPath(r);
        return <span className="rps-muted" title={path}>{path}</span>;
      },
    },
    {
      title: '大小',
      key: 'size',
      width: 90,
      render: (_, r) => `${r._parse.sizeKB} KB`,
    },
    {
      title: '解析状态',
      dataIndex: 'parseStatus',
      key: 'parseStatus',
      width: 200,
      render: (s, r) => {
        const meta = STATUS_META[s || 'pending'];
        if ((s || 'pending') === 'parsing') {
          return (
            <div className="rps-status-progress">
              <Tag icon={meta.icon} color={meta.color}>{meta.label}</Tag>
              <Progress percent={r._parse.progress} size="small" style={{ width: 110 }} />
            </div>
          );
        }
        return (
          <Tooltip title={s === 'failed' ? r._parse.errorMsg : null}>
            <Tag icon={meta.icon} color={meta.color}>{meta.label}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '开始时间',
      key: 'parseStartedAt',
      width: 180,
      render: (_, r) => <span className="rps-muted">{r._parse.parseStartedAt || '--'}</span>,
    },
    {
      title: '结束时间',
      dataIndex: 'lastEdit',
      key: 'parseFinishedAt',
      width: 180,
      render: (t, r) => {
        const status = r.parseStatus || 'pending';
        if (status === 'pending' || status === 'parsing') return <span className="rps-muted">--</span>;
        return <span className="rps-muted">{t || '--'}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => {
        const status = r.parseStatus || 'pending';
        return (
          <Space size={4}>
            <Tooltip title="预览">
              <Button
                type="link"
                size="small"
                icon={<FileSearchOutlined />}
                onClick={() => setPreviewItem(r)}
              />
            </Tooltip>
            <Tooltip title="详情">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDrawerItem(r)}
              />
            </Tooltip>
            <Tooltip title={status === 'failed' ? '重试' : '重新解析'}>
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                disabled={status === 'parsing'}
                onClick={() => handleRetry(r)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // mock 文本片段预览
  const drawerChunks = useMemo(() => {
    if (!drawerItem) return [];
    const cnt = Math.min(8, drawerItem._parse.chunkCount);
    return Array.from({ length: cnt }, (_, i) => ({
      idx: i + 1,
      text: `${drawerItem.name} - 片段 ${i + 1}：本片段从原文件第 ${i * 3 + 1} 段抽取，包含若干语义关键句。向量已写入索引，可用于 RAG 召回。`,
      tokens: 120 + stableHash(drawerItem.key + i, 80),
    }));
  }, [drawerItem]);

  return (
    <div className="rps-container">
      <div className="rps-header">
        <div className="rps-title">
          <RobotOutlined style={{ color: '#1677ff' }} />
          <span>资料 AI 解析状态</span>
        </div>
        <div className="rps-header-actions">
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleBatchRetry}>
            批量重试当前列表
          </Button>
        </div>
      </div>

      {/* 统计卡片 - 点击筛选 */}
      <div className="rps-stats">
        <Card size="small" className={`rps-stat-card rps-stat-clickable ${statusFilter === 'all' ? 'rps-stat-active' : ''}`} onClick={() => setStatusFilter('all')}>
          <Statistic title="资料总数" value={stats.total} />
        </Card>
        <Card size="small" className={`rps-stat-card rps-stat-success rps-stat-clickable ${statusFilter === 'parsed' ? 'rps-stat-active' : ''}`} onClick={() => setStatusFilter('parsed')}>
          <Statistic title="已解析" value={stats.parsed} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleFilled />} />
        </Card>
        <Card size="small" className={`rps-stat-card rps-stat-processing rps-stat-clickable ${statusFilter === 'parsing' ? 'rps-stat-active' : ''}`} onClick={() => setStatusFilter('parsing')}>
          <Statistic title="解析中" value={stats.parsing} valueStyle={{ color: '#1677ff' }} prefix={<SyncOutlined spin={stats.parsing > 0} />} />
        </Card>
        <Card size="small" className={`rps-stat-card rps-stat-clickable ${statusFilter === 'pending' ? 'rps-stat-active' : ''}`} onClick={() => setStatusFilter('pending')}>
          <Statistic title="待解析" value={stats.pending} valueStyle={{ color: '#8c8c8c' }} prefix={<ClockCircleFilled />} />
        </Card>
        <Card size="small" className={`rps-stat-card rps-stat-error rps-stat-clickable ${statusFilter === 'failed' ? 'rps-stat-active' : ''}`} onClick={() => setStatusFilter('failed')}>
          <Statistic title="解析失败" value={stats.failed} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleFilled />} />
        </Card>
      </div>

      {/* 过滤栏 */}
      <div className="rps-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索文件名称"
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          value={libFilter}
          onChange={setLibFilter}
          style={{ width: 180 }}
          options={[
            { label: '全部库', value: 'all' },
            { label: '个人库', value: 'personal' },
            ...orgs.map((o) => ({ label: o.name, value: o.id })),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 140 }}
          options={[
            { label: '全部状态', value: 'all' },
            { label: '已解析', value: 'parsed' },
            { label: '解析中', value: 'parsing' },
            { label: '待解析', value: 'pending' },
            { label: '解析失败', value: 'failed' },
          ]}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 140 }}
          options={[
            { label: '全部类型', value: 'all' },
            { label: 'PDF', value: 'pdf' },
            { label: 'PPT', value: 'pptx' },
            { label: 'Word', value: 'docx' },
            { label: 'Excel', value: 'xlsx' },
            { label: '图片', value: 'image' },
            { label: '视频', value: 'video' },
            { label: '音频', value: 'audio' },
            { label: '白板', value: 'whiteboard' },
            { label: '笔记', value: 'note' },
            { label: '测试', value: 'test' },
            { label: '其他', value: 'other' },
          ]}
        />
        <span className="rps-filter-summary">共 {filtered.length} 项</span>
      </div>

      {/* 表格 */}
      <Table
        rowKey="key"
        columns={columns}
        dataSource={filtered}
        scroll={{ x: 1290 }}
        size="middle"
        tableLayout="fixed"
        pagination={{ pageSize: 15, showSizeChanger: true }}
        locale={{ emptyText: <Empty description="无匹配资料" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />

      {/* 解析详情抽屉 */}
      <Drawer
        title={drawerItem ? `解析详情：${drawerItem.name}` : '解析详情'}
        width={620}
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
      >
        {drawerItem && (
          <div className="rps-drawer">
            <div className="rps-drawer-meta">
              <div className="rps-path-row"><span className="rps-meta-label">位置</span><span className="rps-path-text">{drawerItem.libraryName}{getItemPath(drawerItem)}</span></div>
              <div><span className="rps-meta-label">文件类型</span><Tag color={TYPE_COLOR[drawerItem.fileType] || 'default'}>{drawerItem.fileType || '--'}</Tag></div>
              <div><span className="rps-meta-label">文件大小</span>{drawerItem._parse.sizeKB} KB</div>
              <div><span className="rps-meta-label">解析状态</span>
                <Tag icon={STATUS_META[drawerItem.parseStatus || 'pending'].icon} color={STATUS_META[drawerItem.parseStatus || 'pending'].color}>
                  {STATUS_META[drawerItem.parseStatus || 'pending'].label}
                </Tag>
              </div>
              <div><span className="rps-meta-label">文本片段数</span>{drawerItem._parse.chunkCount}</div>
              <div><span className="rps-meta-label">Token 总数</span>{drawerItem._parse.tokenCount.toLocaleString()}</div>
              <div><span className="rps-meta-label">向量维度</span>{drawerItem._parse.vectorDim}</div>
              <div><span className="rps-meta-label">最近更新</span>{drawerItem.lastEdit || '--'}</div>
              {drawerItem._parse.errorMsg && (
                <div className="rps-error-row">
                  <span className="rps-meta-label">错误信息</span>
                  <span className="rps-error-msg">{drawerItem._parse.errorMsg}</span>
                </div>
              )}
            </div>

            {(drawerItem.parseStatus === 'parsing') && (
              <div className="rps-drawer-progress">
                <div className="rps-meta-label">解析进度</div>
                <Progress percent={drawerItem._parse.progress} status="active" />
              </div>
            )}

            <div className="rps-drawer-section">
              <div className="rps-drawer-section-title">片段预览（前 8 条）</div>
              {drawerChunks.length === 0 ? (
                <Empty description="尚未生成片段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="rps-chunk-list">
                  {drawerChunks.map((c) => (
                    <div className="rps-chunk-item" key={c.idx}>
                      <div className="rps-chunk-head">
                        <Tag color="blue">#{c.idx}</Tag>
                        <span className="rps-muted">tokens: {c.tokens}</span>
                      </div>
                      <div className="rps-chunk-text">{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rps-drawer-actions">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                disabled={drawerItem.parseStatus === 'parsing'}
                onClick={() => { handleRetry(drawerItem); setDrawerItem(null); }}
              >
                重新解析
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 资料预览 Modal */}
      <Modal
        title={previewItem ? `预览：${previewItem.name}` : '预览'}
        open={!!previewItem}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {previewItem && (
          <div className="rps-preview-body">
            {renderPreviewContent(previewItem)}
          </div>
        )}
      </Modal>
    </div>
  );
}
