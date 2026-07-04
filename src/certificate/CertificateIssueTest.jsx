import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Steps, Select, Button, Form, Input, Space, message, Card, Table, Tabs,
  Empty, Tag, Tooltip, Upload, Radio, InputNumber,
} from 'antd';
import {
  DownloadOutlined, ReloadOutlined, FileTextOutlined, PictureOutlined,
  UploadOutlined, FileZipOutlined, ArrowLeftOutlined, FilePdfOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { templateApi, issueApi, triggerDownload } from './api';
import { archiveCertificateIssueBatchToPersonalLibrary } from '../resourceLib/resourceLibStore';
import './CertificateIssueTest.css';

/** 把后端返回的 Blob 转成可预览的 objectURL */
const blobToUrl = (blob) => URL.createObjectURL(blob);

/** 简易 CSV 解析（首行字段 key，逗号分隔） */
const parseCsv = (text) => {
  if (!text) return { headers: [], rows: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((s) => s.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((s) => s.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
  return { headers, rows };
};

const loadAllBatchRecords = async (batchId, totalHint = 0) => {
  if (!batchId) return [];

  const pageSize = 100;
  const records = [];
  let total = totalHint || Number.POSITIVE_INFINITY;

  for (let pageNo = 1; records.length < total; pageNo += 1) {
    const page = await issueApi.pageRecord({ batchId, pageNo, pageSize });
    const currentRecords = page?.records || [];
    if (currentRecords.length === 0) break;
    records.push(...currentRecords);
    total = page?.total || totalHint || records.length;
    if (currentRecords.length < pageSize) break;
  }

  return records;
};

const CertificateIssueTest = ({ template: presetTpl, onBack, onSubmitted, embedded = false }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(presetTpl?.id || null);
  const [template, setTemplate] = useState(null);
  const [mode, setMode] = useState('single'); // 'single' | 'batch'
  const [format, setFormat] = useState('png'); // png | jpg | pdf
  const [quality, setQuality] = useState(0.92);

  const [batchName, setBatchName] = useState('');
  const [batchRemark, setBatchRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [singleData, setSingleData] = useState({});
  const [csvText, setCsvText] = useState('');
  const [batchRows, setBatchRows] = useState([]);

  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMime, setPreviewMime] = useState('image/png');
  const [batchResults, setBatchResults] = useState([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [singleForm] = Form.useForm();
  const lastUrlRef = useRef('');

  /** 加载模版列表 */
  const loadTemplates = async () => {
    try {
      const list = await templateApi.list({});
      setTemplates(list || []);
    } catch (e) {
      console.error(e);
      message.error('加载模版列表失败');
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  /** 选模版 → 拉详情 */
  useEffect(() => {
    if (!selectedId) { setTemplate(null); return; }
    (async () => {
      try {
        const detail = await templateApi.detail(selectedId);
        setTemplate(detail);
        const init = {};
        (detail.fields || []).forEach((f) => { init[f.key] = f.sample ?? ''; });
        setSingleData(init);
        singleForm.setFieldsValue(init);
        if ((detail.fields || []).length > 0) {
          const headers = detail.fields.map((f) => f.key).join(',');
          const sampleRow = detail.fields.map((f) => f.sample ?? '').join(',');
          setCsvText(`${headers}\n${sampleRow}`);
        }
      } catch (e) {
        console.error(e);
        message.error('加载模版详情失败');
      }
    })();
  }, [selectedId, singleForm]);

  useEffect(() => {
    const { rows } = parseCsv(csvText);
    setBatchRows(rows);
  }, [csvText]);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      batchResults.forEach((b) => b.url && b.url.startsWith('blob:') && URL.revokeObjectURL(b.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fields = useMemo(() => template?.fields || [], [template]);

  const stepCurrent = useMemo(() => {
    if (!selectedId) return 0;
    if (mode === 'single') {
      const hasAny = fields.some((f) => (singleData[f.key] ?? '').toString().length > 0);
      if (!hasAny) return 1;
      return previewUrl ? 3 : 2;
    }
    if (batchRows.length === 0) return 1;
    return batchResults.length > 0 ? 3 : 2;
  }, [selectedId, mode, fields, singleData, previewUrl, batchRows, batchResults]);

  const fmtMime = (f) => f === 'pdf' ? 'application/pdf' : (f === 'jpg' ? 'image/jpeg' : 'image/png');
  const fmtExt = (f) => f === 'pdf' ? 'pdf' : (f === 'jpg' ? 'jpg' : 'png');

  /** 单张渲染 */
  const handleRenderSingle = async () => {
    try {
      const values = await singleForm.validateFields();
      setLoading(true);
      const blob = await templateApi.render({
        templateId: selectedId, data: values, format, quality,
      });
      const url = blobToUrl(blob);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewMime(fmtMime(format));
      message.success('渲染成功');
    } catch (e) {
      console.error(e);
      message.error('渲染失败');
    } finally {
      setLoading(false);
    }
  };

  /** 批量渲染 */
  const handleRenderBatch = async () => {
    if (batchRows.length === 0) { message.warning('CSV 中没有可用数据'); return; }
    try {
      setLoading(true);
      const list = await templateApi.renderBatch({
        templateId: selectedId, dataList: batchRows, format, quality,
      });
      batchResults.forEach((b) => b.url && b.url.startsWith('blob:') && URL.revokeObjectURL(b.url));
      const items = (list || []).map((it, idx) => ({
        name: it.name || `cert_${idx + 1}.${fmtExt(format)}`,
        mime: it.mime || fmtMime(format),
        base64: it.base64,
        url: it.base64,
      }));
      setBatchResults(items);
      setActiveBatchIndex(0);
      message.success(`批量渲染完成（${items.length} 张）`);
    } catch (e) {
      console.error(e);
      message.error('批量渲染失败');
    } finally {
      setLoading(false);
    }
  };

  /** 下载单张 */
  const handleDownloadSingle = () => {
    if (!previewUrl) return;
    triggerDownload(previewUrl, `certificate_${Date.now()}.${fmtExt(format)}`);
  };

  /** 下载批量某张 */
  const handleDownloadOne = (item) => triggerDownload(item.url, item.name);

  /** 全部下载（依次触发） */
  const handleDownloadAll = () => {
    if (batchResults.length === 0) return;
    batchResults.forEach((item, i) => {
      setTimeout(() => triggerDownload(item.url, item.name), i * 120);
    });
  };

  /** ZIP 打包下载 */
  const handleDownloadZip = async () => {
    if (batchRows.length === 0) { message.warning('请先准备数据'); return; }
    try {
      setLoading(true);
      const blob = await templateApi.renderZip({
        templateId: selectedId, dataList: batchRows, format, quality,
      });
      triggerDownload(blob, `certificates_${Date.now()}.zip`);
      message.success('ZIP 下载完成');
    } catch (e) {
      console.error(e);
      message.error('打包失败');
    } finally {
      setLoading(false);
    }
  };

  /** Excel 上传解析为 CSV 文本 */
  const handleExcelUpload = async (file) => {
    try {
      setLoading(true);
      const list = await templateApi.parseExcel(file);
      if (!list || list.length === 0) { message.warning('Excel 中无数据'); return false; }
      const headers = Object.keys(list[0]);
      const csv = [
        headers.join(','),
        ...list.map((row) => headers.map((h) => (row[h] ?? '')).join(',')),
      ].join('\n');
      setCsvText(csv);
      setMode('batch');
      message.success(`Excel 解析成功（${list.length} 条）`);
    } catch (e) {
      console.error(e);
      message.error('Excel 解析失败');
    } finally {
      setLoading(false);
    }
    return false;
  };

  /** 提交发放：调用后端创建批次并落库 */
  const handleSubmitIssue = async () => {
    if (!selectedId) { message.warning('请先选择模版'); return; }
    let dataList = [];
    if (mode === 'single') {
      try {
        const values = await singleForm.validateFields();
        dataList = [values];
      } catch (e) {
        if (e?.errorFields) return;
        message.error('表单校验失败');
        return;
      }
    } else {
      if (batchRows.length === 0) { message.warning('请先准备批量数据'); return; }
      dataList = batchRows;
    }
    setSubmitting(true);
    try {
      const batch = await issueApi.createBatch({
        templateId: selectedId,
        batchName: (batchName || '').trim() || undefined,
        remark: (batchRemark || '').trim() || undefined,
        format,
        quality: format === 'jpg' ? quality : undefined,
        dataList,
      });
      const success = batch?.successCount ?? 0;
      const total = batch?.totalCount ?? dataList.length;
      let archiveError = null;

      try {
        const records = await loadAllBatchRecords(batch?.id, total);
        archiveCertificateIssueBatchToPersonalLibrary(batch, records);
      } catch (error) {
        archiveError = error;
        console.error(error);
      }

      if (success === total) {
        message.success(
          archiveError
            ? `发放成功，共 ${total} 张证书已生成`
            : `发放成功，共 ${total} 张证书已归档到个人资料库 / 学时证明`
        );
      } else {
        message.warning(
          archiveError
            ? `发放完成：成功 ${success} / 总 ${total}`
            : `发放完成：成功 ${success} / 总 ${total}，成功证书已同步到个人资料库 / 学时证明`
        );
      }
      if (archiveError && success > 0) {
        message.warning('证书已生成，但同步到个人资料库 / 学时证明失败');
      }
      if (onSubmitted) {
        onSubmitted(batch);
      } else if (onBack) {
        onBack();
      }
    } catch (e) {
      console.error(e);
      message.error('发放失败，请确认后端是否启动');
    } finally {
      setSubmitting(false);
    }
  };

  const csvHeadersHint = fields.map((f) => f.key).join(',');
  const isPdf = format === 'pdf';

  return (
    <div className="cert-issue-test">
      <div className="issue-header">
        {embedded ? (
          <span />
        ) : (
          <Space>
            {onBack && <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>}
            <h2 style={{ margin: 0 }}>
              <PictureOutlined /> 证书发放{presetTpl ? `：${presetTpl.name}` : ''}
            </h2>
          </Space>
        )}
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadTemplates}>刷新模版</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSubmitIssue}
            disabled={!selectedId}
          >
            提交发放（保存为批次）
          </Button>
        </Space>
      </div>

      <Steps
        size="small"
        current={stepCurrent}
        items={[
          { title: '选择模版' }, { title: '录入数据' },
          { title: '试看渲染' }, { title: '提交发放' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div className="issue-body">
        <Card title="1. 选择模版" size="small" className="issue-card">
          <Space wrap>
            <Select
              placeholder="请选择证书模版"
              style={{ width: 360 }}
              value={selectedId}
              onChange={(v) => { setSelectedId(v); setPreviewUrl(''); setBatchResults([]); }}
              options={(templates || []).map((t) => ({
                label: `${t.name}（${t.tplKey}）`, value: t.id,
              }))}
              showSearch optionFilterProp="label"
            />
            <span style={{ marginLeft: 12 }}>导出格式：</span>
            <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
              <Radio.Button value="png"><PictureOutlined /> PNG</Radio.Button>
              <Radio.Button value="jpg"><PictureOutlined /> JPG</Radio.Button>
              <Radio.Button value="pdf"><FilePdfOutlined /> PDF</Radio.Button>
            </Radio.Group>
            {format === 'jpg' && (
              <Space>
                <span>质量：</span>
                <InputNumber min={0.1} max={1} step={0.05} value={quality}
                  onChange={(v) => setQuality(v ?? 0.92)} style={{ width: 80 }} />
              </Space>
            )}
          </Space>
          {template && (
            <div className="tpl-meta">
              <Tag color="blue">尺寸 {template.width} × {template.height}</Tag>
              <Tag color="geekblue">字段 {fields.length} 个</Tag>
              {fields.map((f) => (
                <Tooltip key={f.key} title={`示例：${f.sample || '（空）'}`}>
                  <Tag>{f.label}（{f.key}）</Tag>
                </Tooltip>
              ))}
            </div>
          )}
        </Card>

        {template && (
          <Card title="2. 批次信息" size="small" className="issue-card">
            <Space wrap style={{ width: '100%' }}>
              <span>批次名：</span>
              <Input
                placeholder={`默认：${template.name}-时间戳`}
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                style={{ width: 320 }}
                maxLength={128}
              />
              <span style={{ marginLeft: 12 }}>备注：</span>
              <Input
                placeholder="选填"
                value={batchRemark}
                onChange={(e) => setBatchRemark(e.target.value)}
                style={{ width: 360 }}
                maxLength={512}
              />
            </Space>
          </Card>
        )}

        {template && (
          <Card title="3. 录入数据" size="small" className="issue-card">
            <Tabs
              activeKey={mode}
              onChange={setMode}
              items={[
                {
                  key: 'single',
                  label: <span><FileTextOutlined /> 单条</span>,
                  children: (
                    <Form
                      form={singleForm} layout="vertical"
                      initialValues={singleData}
                      onValuesChange={(_, all) => setSingleData(all)}
                      className="single-form"
                    >
                      {fields.length === 0 && <Empty description="该模版未定义动态字段" />}
                      <div className="single-form-grid">
                        {fields.map((f) => (
                          <Form.Item key={f.key} label={`${f.label}（${f.key}）`} name={f.key}>
                            <Input placeholder={f.sample || `请输入 ${f.label}`} />
                          </Form.Item>
                        ))}
                      </div>
                      <Space>
                        <Button type="primary" loading={loading}
                          onClick={handleRenderSingle}
                          disabled={fields.length === 0}>
                          渲染单张（{format.toUpperCase()}）
                        </Button>
                      </Space>
                    </Form>
                  ),
                },
                {
                  key: 'batch',
                  label: <span><FileTextOutlined /> 批量（CSV / Excel）</span>,
                  children: (
                    <div className="batch-area">
                      <div className="csv-hint">
                        首行为字段 key，逗号分隔。示例 headers：<code>{csvHeadersHint}</code>
                      </div>
                      <Space style={{ marginBottom: 8 }}>
                        <Upload beforeUpload={handleExcelUpload} showUploadList={false}
                          accept=".xls,.xlsx">
                          <Button icon={<UploadOutlined />}>上传 Excel 解析</Button>
                        </Upload>
                      </Space>
                      <Input.TextArea
                        rows={6}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder={`${csvHeadersHint}\nXXX,XXX,XXX`}
                      />
                      <Table
                        size="small"
                        rowKey={(_, i) => i}
                        dataSource={batchRows}
                        columns={(fields.length > 0
                          ? fields.map((f) => ({ title: `${f.label}(${f.key})`, dataIndex: f.key, key: f.key }))
                          : Object.keys(batchRows[0] || {}).map((k) => ({ title: k, dataIndex: k, key: k }))
                        )}
                        pagination={{ pageSize: 5 }}
                        style={{ marginTop: 12 }}
                        locale={{ emptyText: '请输入 CSV 数据或上传 Excel' }}
                      />
                      <Space style={{ marginTop: 12 }} wrap>
                        <Button type="primary" loading={loading}
                          onClick={handleRenderBatch}
                          disabled={batchRows.length === 0}>
                          批量渲染（{batchRows.length} 条 / {format.toUpperCase()}）
                        </Button>
                        <Button icon={<FileZipOutlined />} loading={loading}
                          onClick={handleDownloadZip}
                          disabled={batchRows.length === 0}>
                          打包 ZIP 下载
                        </Button>
                      </Space>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )}

        {(previewUrl || batchResults.length > 0) && (
          <Card
            title="4. 渲染预览（试看，不落库）"
            size="small"
            className="issue-card"
            extra={
              mode === 'batch' && batchResults.length > 0 ? (
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={handleDownloadAll}>逐张下载</Button>
                  <Button icon={<FileZipOutlined />} onClick={handleDownloadZip}>打包 ZIP</Button>
                </Space>
              ) : null
            }
          >
            {mode === 'single' && previewUrl && (
              <div className="preview-single">
                {isPdf ? (
                  <iframe title="cert-pdf" src={previewUrl} className="preview-pdf" />
                ) : (
                  <img src={previewUrl} alt="证书预览" className="preview-img" />
                )}
                <Space style={{ marginTop: 12 }}>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadSingle}>
                    下载 {format.toUpperCase()}
                  </Button>
                </Space>
              </div>
            )}
            {mode === 'batch' && batchResults.length > 0 && (
              <div className="preview-batch">
                <div className="batch-list">
                  {batchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className={`batch-item ${activeBatchIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveBatchIndex(idx)}
                    >
                      {item.mime === 'application/pdf' ? (
                        <div className="batch-pdf-tile"><FilePdfOutlined /></div>
                      ) : (
                        <img src={item.url} alt={item.name} />
                      )}
                      <div className="batch-name" title={item.name}>{item.name}</div>
                      <Button size="small" icon={<DownloadOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleDownloadOne(item); }}>
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="batch-preview">
                  {batchResults[activeBatchIndex] ? (
                    batchResults[activeBatchIndex].mime === 'application/pdf' ? (
                      <iframe title="batch-pdf" src={batchResults[activeBatchIndex].url} className="preview-pdf" />
                    ) : (
                      <img
                        src={batchResults[activeBatchIndex].url}
                        alt={batchResults[activeBatchIndex].name}
                        className="preview-img"
                      />
                    )
                  ) : (<Empty />)}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default CertificateIssueTest;
