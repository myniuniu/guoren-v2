import { useEffect, useRef, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Switch, Tag, Tabs, message } from 'antd';
import { defaultRequirements, listSubmissions, loadSubmission, reviewSubmission, saveSubmission } from './store';
import { FileTextOutlined, CloudUploadOutlined, ThunderboltOutlined, CheckOutlined, SettingOutlined, SendOutlined, EyeOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './outcome.css';
const labels = { draft: '待提交', pending: '待评阅', returned: '需修改', passed: '已通过' };
function Material({ material, actions }) {
  const openRef = useRef(null);
  const downloadRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    if (!material.blob) return;
    const url = URL.createObjectURL(material.blob);
    if (openRef.current) openRef.current.href = url;
    if (downloadRef.current) downloadRef.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [material.blob]);
  const extension = material.blob ? material.name.split('.').at(-1).toUpperCase() : null;
  const size = material.blob?.size;
  const sizeLabel = size == null ? '' : size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
  return <div className="outcome-material outcome-file-row">
    <span className={`outcome-file-icon ${material.type === 'agent' ? 'is-agent' : ''}`}>{material.type === 'agent' ? <ThunderboltOutlined /> : <FileTextOutlined />}</span>
    <div className="outcome-file-copy"><strong title={material.name}>{material.name}</strong><small>{[extension || (material.type === 'agent' ? '智能体生成内容' : '在线文档'), sizeLabel, material.source && `来源：${material.source}`].filter(Boolean).join(' · ')}</small></div>
    <div className="outcome-file-actions">{material.blob ? <><a ref={openRef} target="_blank" rel="noreferrer"><EyeOutlined /> 打开</a><a ref={downloadRef} download={material.name}><DownloadOutlined /> 下载</a></> : <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>预览</Button>}{actions}</div>
    <Modal title={material.name} open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={720}><pre className="outcome-content-preview">{material.content || '暂无正文'}</pre>{material.source && <p>来源：{material.source}</p>}</Modal>
  </div>;
}
export default function OutcomePage({ item, scope, actor, resources, agentResults = [], onProgress, reviewer, canConfigure = false, onConfigure }) {
  const [activeTab, setActiveTab] = useState('configure');
  const [configuration, setConfiguration] = useState(() => ({ ...defaultRequirements, ...item.meta?.outcomeRequirements, name: item.name }));
  const [draft, setDraft] = useState({ title: '', description: '', materials: [] });
  const [record, setRecord] = useState(null); const [loaded, setLoaded] = useState(false); const [busy, setBusy] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [documentOpen, setDocumentOpen] = useState(false); const [document, setDocument] = useState({ name: '', content: '' });
  const [selection, setSelection] = useState(null); const [candidates, setCandidates] = useState([]); const [preview, setPreview] = useState(null);
  const [reviews, setReviews] = useState([]); const [feedback, setFeedback] = useState(''); const lock = useRef(false);
  const requirements = { ...defaultRequirements, ...item.meta?.outcomeRequirements };
  useEffect(() => {
    let alive = true;
    loadSubmission(scope, item.key, actor).then((value) => {
      if (!alive) return; setRecord(value); setDraft(value?.draft || { title: '', description: '', materials: [] }); setLoaded(true);
    }).catch(() => message.error('成果读取失败，请重新打开重试'));
    if (reviewer?.canReview) listSubmissions(scope, item.key).then((value) => { if (alive) setReviews(value); }).catch(() => message.error('评阅列表读取失败')); 
    return () => { alive = false; };
  }, [scope, item.key, actor, reviewer?.canReview]);
  const add = (material) => setDraft((value) => ({ ...value, materials: [...value.materials, { id: crypto.randomUUID(), ...material }] }));
  const persist = async (submit) => {
    if (lock.current || !loaded) return; lock.current = true; setBusy(true);
    try {
      const next = await saveSubmission({ scope, outcome: item.key, task: item.parentKey, actor, draft, submit, requirements });
      setRecord(next); if (submit) onProgress(next.status === 'passed' ? 100 : 0);
      message.success(submit ? '成果已提交' : '草稿已保存');
    } catch (error) { message.error(error.message || '保存失败，草稿仍保留在当前页面，请重试'); }
    finally { lock.current = false; setBusy(false); }
  };
  const choose = (kind) => {
    const list = kind === 'agent' ? agentResults.map((result) => ({ id: result.id, name: result.name || '智能体生成内容', content: result.text, source: result.source || 'AI伴学', type: 'agent' })) : resources.filter((resource) => !resource.isFolder && ['note', 'docx', 'document'].includes(resource.type === 'note' ? 'note' : resource.fileType)).map((resource) => ({ id: resource.key, name: resource.name, content: resource.meta?.content || resource.content || resource.meta?.summary || '', source: resource.name, type: 'document' }));
    setCandidates(list); setSelection(kind); setPreview(null);
  };
  return <section className="outcome-page">
    <div className="outcome-tab-status"><Tag className={`outcome-status is-${record?.status || 'draft'}`}>{labels[record?.status || 'draft']}</Tag></div>
    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[{ key: 'configure', label: <span><SettingOutlined /> 成果配置</span> }, { key: 'submit', label: <span><SendOutlined /> 成果提交</span> }]} />
    <section hidden={activeTab !== 'configure'} className="outcome-config-layout">
      <div className="outcome-form-card">
        <div className="outcome-card-heading"><h3>基本信息</h3><p>设置名称和要求，学员将在提交页看到这些内容。</p></div>
        <div className="outcome-field-row">
          <label><span>成果名称 <i>*</i></span><Input size="large" disabled={!canConfigure} value={configuration.name} onChange={(e) => setConfiguration({ ...configuration, name: e.target.value })} /></label>
          <label><span>提交截止时间</span><DatePicker size="large" showTime format="YYYY-MM-DD HH:mm" placeholder="不限时间" style={{ width: '100%' }} disabled={!canConfigure} value={configuration.deadline ? dayjs(configuration.deadline) : null} onChange={(value) => setConfiguration({ ...configuration, deadline: value ? value.format('YYYY-MM-DDTHH:mm') : '' })} /></label>
        </div>
        <label><span>成果要求</span><Input.TextArea disabled={!canConfigure} rows={5} placeholder="说明实践主题、成果内容及提交要求…" value={configuration.instructions} onChange={(e) => setConfiguration({ ...configuration, instructions: e.target.value })} /><small>建议写明实践过程、预期产出和需要记录的学习反思。</small></label>
        <div className="outcome-card-heading"><h3>提交方式</h3><p>可选择多种方式，学员能组合材料提交一份成果。</p></div>
        <div className="outcome-type-grid">{[
          { key: 'document', label: '在线文档', hint: '撰写总结或关联已有文档', icon: <FileTextOutlined /> },
          { key: 'file', label: '上传材料', hint: '上传文档、图片等实践材料', icon: <CloudUploadOutlined /> },
          { key: 'agent', label: '智能体内容', hint: '关联智能体生成的具体结果', icon: <ThunderboltOutlined /> },
        ].map((type) => {
          const checked = configuration.allowedTypes.includes(type.key);
          return <button key={type.key} type="button" disabled={!canConfigure} aria-pressed={checked} className={`outcome-type-card ${checked ? 'is-selected' : ''}`} onClick={() => setConfiguration({ ...configuration, allowedTypes: checked ? configuration.allowedTypes.filter((key) => key !== type.key) : [...configuration.allowedTypes, type.key] })}><span className="outcome-type-icon">{type.icon}</span><strong>{type.label}</strong><small>{type.hint}</small><span className="outcome-type-check">{checked && <CheckOutlined />}</span></button>;
        })}</div>
        <div className="outcome-review-setting"><div><strong>成果评阅</strong><p>开启后，由授权评阅人确认成果是否通过。</p></div><Switch disabled={!canConfigure} checked={configuration.reviewRequired} onChange={(reviewRequired) => setConfiguration({ ...configuration, reviewRequired })} /></div>
        <footer className="outcome-config-footer"><span>{canConfigure ? '保存后，提交页将使用新的成果要求。' : '当前配置为只读。'}</span>{canConfigure && <Button size="large" type="primary" onClick={() => {
          if (!configuration.name.trim() || !configuration.allowedTypes.length) return message.warning('请填写名称并选择至少一种材料类型');
          onConfigure?.(configuration); message.success('成果配置已保存');
        }}>保存配置</Button>}</footer>
      </div>
      <aside className="outcome-config-summary"><span className="outcome-summary-icon"><FileTextOutlined /></span><h3>提交规则</h3><p>学员填写标题，添加至少一项材料后，即可提交成果。</p><dl><div><dt>材料方式</dt><dd>{configuration.allowedTypes.length} 种</dd></div><div><dt>完成条件</dt><dd>{configuration.reviewRequired ? '评阅通过' : '正式提交'}</dd></div><div><dt>截止时间</dt><dd>{configuration.deadline ? dayjs(configuration.deadline).format('MM月DD日 HH:mm') : '不限时间'}</dd></div></dl><div className="outcome-summary-note">草稿不计入完成进度。提交后保留材料快照和历史版本，截止后可补交并标记逾期。</div></aside>
    </section>
    <section hidden={activeTab !== 'submit'} className="outcome-submission">
      <div className="outcome-submit-layout">
        <div className="outcome-submit-main">
          <div className="outcome-form-card">
            <div className="outcome-card-heading"><h3>成果信息</h3><p>为这次实践起一个名称，并简要说明你的收获。</p></div>
            <label><span>成果标题 <i>*</i></span><Input size="large" placeholder="例如：AI辅助教学设计实践与反思" value={draft.title} disabled={!loaded} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
            <label className="outcome-description-field"><span>成果说明</span><Input.TextArea rows={4} placeholder="描述实践目标、完成过程、主要成果和学习反思…" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><small>让评阅人更容易理解你的实践过程，可简要说明材料之间的关系。</small></label>
          </div>
          <div className="outcome-form-card">
            <div className="outcome-card-heading outcome-material-heading"><div><h3>成果材料 <i>*</i></h3><p>选择适合的方式，支持组合多份材料。</p></div><Tag>{draft.materials.length} 份材料</Tag></div>
            <div className="outcome-submit-sources">
              {requirements.allowedTypes.includes('document') && <div className="outcome-source-card is-document"><span className="outcome-source-icon"><FileTextOutlined /></span><strong>在线文档</strong><p>记录实践过程与学习反思</p><div><button type="button" onClick={() => { setEditingMaterialId(null); setDocument({ name: '', content: '' }); setDocumentOpen(true); }}>新建文档</button><span>·</span><button type="button" onClick={() => choose('document')}>选择已有</button></div></div>}
              {requirements.allowedTypes.includes('file') && <label className="outcome-source-card is-upload"><span className="outcome-source-icon"><CloudUploadOutlined /></span><strong>上传材料</strong><p>文档、图片及其他成果文件</p><span className="outcome-source-action">选择文件</span><input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.zip" onChange={(e) => { Array.from(e.target.files).forEach((file) => add({ type: 'file', name: file.name, blob: file })); e.target.value = ''; }} /></label>}
              {requirements.allowedTypes.includes('agent') && <button type="button" className="outcome-source-card is-agent" onClick={() => choose('agent')}><span className="outcome-source-icon"><ThunderboltOutlined /></span><strong>智能体内容</strong><p>关联生成结果，保留来源</p><span className="outcome-source-action">选择生成内容</span></button>}
            </div>
            {draft.materials.length ? <div className="outcome-attached-list">{draft.materials.map((material) => <Material key={material.id} material={material} actions={<>{material.type === 'document' && <Button size="small" type="text" onClick={() => { setEditingMaterialId(material.id); setDocument({ name: material.name, content: material.content }); setDocumentOpen(true); }}>编辑</Button>}<Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setDraft({ ...draft, materials: draft.materials.filter((value) => value.id !== material.id) })}>移除</Button></>} />)}</div> : <div className="outcome-material-empty"><FileTextOutlined /><strong>还没有添加成果材料</strong><span>通过上方任一种方式添加材料，至少添加一份即可提交。</span></div>}
          </div>
          <footer className="outcome-submit-footer"><div><strong>{record?.status === 'pending' ? '成果正在等待评阅' : '准备好后，提交你的研修成果'}</strong><span>{record?.status === 'pending' ? '可保存草稿；收到修改意见后再提交新版本。' : '提交后保留当前材料版本，后续修改可提交新版本。'}</span></div><div className="outcome-actions"><Button size="large" loading={busy} disabled={!loaded} onClick={() => persist(false)}>保存草稿</Button><Button size="large" type="primary" icon={<SendOutlined />} loading={busy} disabled={!loaded || !draft.title.trim() || !draft.materials.length || record?.status === 'pending'} onClick={() => persist(true)}>{record?.versions.length ? '提交新版本' : '提交成果'}</Button></div></footer>
        </div>
        <aside className="outcome-submit-sidebar">
          <div className="outcome-config-summary"><span className="outcome-summary-icon"><FileTextOutlined /></span><h3>本次成果要求</h3><p>{requirements.instructions || '请提交本任务的实践成果与学习反思。'}</p><dl><div><dt>截止时间</dt><dd>{requirements.deadline ? dayjs(requirements.deadline).format('MM月DD日 HH:mm') : '不限时间'}</dd></div><div><dt>完成条件</dt><dd>{requirements.reviewRequired ? '评阅通过' : '正式提交'}</dd></div></dl><div className="outcome-summary-note">{requirements.deadline ? '截止后仍可补交，系统会标记逾期。' : '可先保存草稿，整理好材料后再提交。'}</div></div>
          <div className="outcome-config-summary outcome-submit-checklist"><h3>提交前检查</h3><div className={draft.title.trim() ? 'is-done' : ''}><span>{draft.title.trim() ? <CheckOutlined /> : '1'}</span>填写成果标题</div><div className={draft.materials.length ? 'is-done' : ''}><span>{draft.materials.length ? <CheckOutlined /> : '2'}</span>添加成果材料</div><p>{record?.updatedAt ? `最近保存：${dayjs(record.updatedAt).format('MM-DD HH:mm')}` : '尚未保存草稿'}</p></div>
        </aside>
      </div>
      {record?.feedback && <div className="outcome-feedback"><strong>评阅意见</strong><p>{record.feedback}</p></div>}
      <div className="outcome-history-card"><div className="outcome-card-heading outcome-material-heading"><div><h3>提交历史</h3><p>每次正式提交均保留独立版本，方便查看与回溯。</p></div><Tag>{record?.versions.length || 0} 个版本</Tag></div>{!record?.versions.length && <div className="outcome-history-empty">暂无提交记录 · 保存草稿不会产生提交版本</div>}{record?.versions.slice().reverse().map((version) => <details key={version.number}><summary><span>第 {version.number} 版</span><time>{dayjs(version.submittedAt).format('YYYY-MM-DD HH:mm')}</time>{version.overdue && <Tag color="orange">逾期补交</Tag>}</summary><h4>{version.title}</h4><p>{version.description}</p>{version.materials.map((material) => <Material key={material.id} material={material} />)}</details>)}</div>
    {reviewer?.canReview && <section><h3>成果评阅</h3>{reviews.filter((value) => value.status === 'pending').map((value) => <article key={value.key}><strong>{value.actor.name} · {value.versions.at(-1).title}</strong>{value.versions.at(-1).materials.map((material) => <Material key={material.id} material={material} />)}<Input.TextArea placeholder="评阅意见（退回必填）" value={feedback} onChange={(e) => setFeedback(e.target.value)} /><div className="outcome-actions">{['passed', 'returned'].map((status) => <Button key={status} onClick={async () => { try { await reviewSubmission(value.key, reviewer, status, feedback); setReviews(await listSubmissions(scope, item.key)); if (value.actor.id === actor.id) { setRecord(await loadSubmission(scope, item.key, actor)); onProgress(status === 'passed' ? 100 : 0); } } catch (error) { message.error(error.message); } }}>{status === 'passed' ? '通过' : '退回修改'}</Button>)}</div></article>)}</section>}
    </section>
    <Modal title="撰写在线成果文档" open={documentOpen} onCancel={() => setDocumentOpen(false)} onOk={() => { if (!document.name.trim() || !document.content.trim()) return message.warning('请填写文档标题和正文'); if (editingMaterialId) setDraft({ ...draft, materials: draft.materials.map((material) => material.id === editingMaterialId ? { ...material, ...document } : material) }); else add({ ...document, type: 'document' }); setDocumentOpen(false); }}><Input placeholder="文档标题" value={document.name} onChange={(e) => setDocument({ ...document, name: e.target.value })} /><Input.TextArea rows={12} placeholder="在这里撰写实践过程、成果和反思" value={document.content} onChange={(e) => setDocument({ ...document, content: e.target.value })} /></Modal>
    <Modal title={selection === 'agent' ? '关联智能体生成内容' : '选择已有文档'} open={Boolean(selection)} onCancel={() => setSelection(null)} onOk={() => { if (!preview) return message.warning('请选择并预览材料'); add(preview); setSelection(null); }}><Select style={{ width: '100%' }} placeholder="选择材料" options={candidates.map((value) => ({ value: value.id, label: value.name }))} onChange={(id) => setPreview(candidates.find((value) => value.id === id))} /><pre>{preview?.content}</pre>{!candidates.length && <p>暂无可关联内容，请先创建文档或使用智能体生成内容。</p>}</Modal>
  </section>;
}
