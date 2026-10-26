import { useMemo, useState } from 'react';
import { Modal, Select, message } from 'antd';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  loadAiLiteracyReportCatalog,
  saveAiLiteracyReportToCatalog,
} from '../aiLiteracy/reportStore';
import './AiLiteracyCapabilityPage.css';

const REPORT_SOURCES = [
  { value: 'national-smart-edu', label: '国家智慧教育教师发展平台' },
  { value: 'aiteach', label: '腾讯教育 AI 素养平台' },
  { value: 'other', label: '其他测评平台' },
];

function formatFileSize(size = 0) {
  if (!size) return '大小未知';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function openReference(path) {
  window.open(`https://aiteach.qq.com${path}`, '_blank', 'noopener,noreferrer');
}

export default function AiLiteracyCapabilityPage({ onOpenReportSpace }) {
  const initialReports = useMemo(() => {
    const storedReports = loadAiLiteracyReportCatalog();
    if (storedReports.length) return storedReports;
    return saveAiLiteracyReportToCatalog({
      id: 'ai_literacy_report_initial',
      source: REPORT_SOURCES[0].value,
      sourceLabel: REPORT_SOURCES[0].label,
      fileName: '国家智慧教育教师发展平台_AI素养测评报告.pdf',
      fileSize: 1861222,
      fileSizeLabel: '1.8 MB',
      fileType: 'application/pdf',
      importedAt: '2026/10/25 09:30:00',
      overallScore: 73,
    });
  }, []);
  const [reports, setReports] = useState(initialReports);
  const [importOpen, setImportOpen] = useState(false);
  const [source, setSource] = useState(REPORT_SOURCES[0].value);
  const [file, setFile] = useState(null);
  const latestReport = reports[0] || null;

  const handleImport = () => {
    if (!file) {
      message.warning('请先选择测评报告文件');
      return;
    }
    const sourceOption = REPORT_SOURCES.find((item) => item.value === source) || REPORT_SOURCES[0];
    const report = {
      id: `ai_literacy_report_${Date.now()}`,
      source: sourceOption.value,
      sourceLabel: sourceOption.label,
      fileName: file.name,
      fileSize: file.size,
      fileSizeLabel: formatFileSize(file.size),
      fileType: file.type || 'application/octet-stream',
      importedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      overallScore: 73,
    };
    const next = saveAiLiteracyReportToCatalog(report);
    setReports(next);
    setImportOpen(false);
    setFile(null);
    message.success('AI 素养测评报告已导入，可在空间的知识分析中选择');
  };

  return (
    <main className="ai-literacy-capability-page" aria-label="AI素养能力">
      <section className="ai-literacy-capability-hero">
        <div className="ai-literacy-capability-hero-copy">
          <span className="ai-literacy-capability-kicker">AI 素养能力提升计划</span>
          <h1>发现能力优势，规划教师 AI 成长路径</h1>
          <p>通过在线测评、标准化考试或导入已有报告，形成能力诊断，并为知识分析与学习任务提供依据。</p>
          <div className="ai-literacy-capability-hero-actions">
            <button type="button" className="is-primary" onClick={() => openReference('/literacy/assessment')}>
              开始能力测评 <ArrowRightOutlined />
            </button>
            <button type="button" onClick={() => setImportOpen(true)}>
              <UploadOutlined /> 导入测评报告
            </button>
          </div>
        </div>
        <div className="ai-literacy-capability-hero-visual" aria-hidden="true">
          <div className="ai-literacy-capability-score-ring">
            <strong>{latestReport?.overallScore || 73}</strong>
            <span>综合能力</span>
          </div>
          <div className="ai-literacy-capability-hero-bars">
            <span style={{ '--bar': '82%' }} />
            <span style={{ '--bar': '74%' }} />
            <span style={{ '--bar': '64%' }} />
            <span style={{ '--bar': '86%' }} />
          </div>
        </div>
      </section>

      <section className="ai-literacy-capability-benefits" aria-label="能力服务特点">
        <article><BarChartOutlined /><div><strong>精准能力诊断</strong><p>从认知、应用、伦理与创新等维度定位能力现状。</p></div></article>
        <article><SafetyCertificateOutlined /><div><strong>权威测评体系</strong><p>支持测评、考试和外部报告，完整保留已有诊断能力。</p></div></article>
        <article><ThunderboltOutlined /><div><strong>个性化成长建议</strong><p>诊断结果可继续关联知识点，并生成针对性学习任务。</p></div></article>
      </section>

      <section className="ai-literacy-capability-section">
        <header>
          <div>
            <span>能力入口</span>
            <h2>选择适合你的诊断方式</h2>
          </div>
          <p>三个入口相互独立，结果统一沉淀为 AI 素养报告。</p>
        </header>
        <div className="ai-literacy-capability-entry-grid">
          <article className="is-assessment">
            <div className="ai-literacy-capability-entry-icon"><BarChartOutlined /></div>
            <div><em>轻量测评</em><h3>AI 素养测评</h3><p>通过情境量表快速了解人工智能认知、应用、伦理与创新能力。</p></div>
            <button type="button" onClick={() => openReference('/literacy/assessment')}>立即开始测评 <ArrowRightOutlined /></button>
          </article>
          <article className="is-exam">
            <div className="ai-literacy-capability-entry-icon"><BookOutlined /></div>
            <div><em>标准考试</em><h3>AI 素养能力考试</h3><p>完成标准化能力考试，检验知识理解与真实教学应用能力。</p></div>
            <button type="button" onClick={() => openReference('/literacy/exam')}>立即进入考试 <ArrowRightOutlined /></button>
          </article>
          <article className="is-report">
            <div className="ai-literacy-capability-entry-icon"><FileTextOutlined /></div>
            <div><em>报告导入</em><h3>AI 素养报告</h3><p>导入国家智慧教育教师发展平台等外部报告，延续已有测评成果。</p></div>
            <button type="button" onClick={() => setImportOpen(true)}><UploadOutlined /> {latestReport ? '重新导入报告' : '导入测评报告'}</button>
          </article>
        </div>
      </section>

      <section className="ai-literacy-capability-report-section">
        <header>
          <div><span>报告中心</span><h2>已导入的能力报告</h2></div>
          <button type="button" onClick={() => setImportOpen(true)}><UploadOutlined /> 导入新报告</button>
        </header>
        {reports.length ? (
          <div className="ai-literacy-capability-report-list">
            {reports.map((report, index) => (
              <article key={report.id}>
                <span className="ai-literacy-capability-report-icon"><FileTextOutlined /></span>
                <div>
                  <strong>{report.fileName}</strong>
                  <p>{report.sourceLabel} · {report.fileSizeLabel} · {report.importedAt}</p>
                </div>
                <div className="ai-literacy-capability-report-actions">
                  {index === 0 ? <span className="ai-literacy-capability-report-status"><CheckCircleFilled /> 最新报告</span> : null}
                  <button
                    type="button"
                    onClick={() => onOpenReportSpace?.(report)}
                  >
                    去空间完成提升计划 <ArrowRightOutlined />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="ai-literacy-capability-report-empty">
            <FileTextOutlined />
            <strong>还没有导入能力报告</strong>
            <p>导入后可在空间的“知识分析”中直接选择。</p>
            <button type="button" onClick={() => setImportOpen(true)}>立即导入</button>
          </div>
        )}
      </section>

      <Modal
        title="导入 AI 素养测评报告"
        open={importOpen}
        okText="确认导入"
        cancelText="取消"
        onOk={handleImport}
        onCancel={() => { setImportOpen(false); setFile(null); }}
        centered
        destroyOnHidden
      >
        <div className="ai-literacy-capability-import-form">
          <label>报告来源</label>
          <Select value={source} options={REPORT_SOURCES} onChange={setSource} />
          <label>报告文件</label>
          <label className="ai-literacy-capability-file-picker">
            <UploadOutlined />
            <span>{file?.name || '选择 PDF、Word 或图片报告'}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>
      </Modal>
    </main>
  );
}

