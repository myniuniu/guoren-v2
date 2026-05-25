import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Layout, Button, Input, Upload, Modal, Form, InputNumber, Space, Tooltip,
  message, Switch, Dropdown, Slider, Tour,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, FontSizeOutlined, TagOutlined,
  PictureOutlined, FileImageOutlined, UnorderedListOutlined,
  UndoOutlined, RedoOutlined, EyeOutlined, EditOutlined,
  CalendarOutlined, NumberOutlined, QrcodeOutlined,
  AppstoreOutlined, BorderOutlined, ZoomInOutlined, ZoomOutOutlined,
  HistoryOutlined, ImportOutlined, ExportOutlined,
  CloudUploadOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import * as fabric from 'fabric';
import { templateApi, versionApi, toAbsoluteUrl, triggerDownload } from './api';
import { DEFAULT_FIELDS } from './fields';
import {
  createHistoryStack, attachAlignmentGuideline, attachGrid, attachZoomPan,
  setPreviewMode, insertQrCode, validateTemplate, loadFont,
} from './designerHelpers';
import PropertyPanel from './PropertyPanel';
import ResourceLibPicker from '../resourceLib/ResourceLibPicker';
import { fileApi } from '../api/fileApi';
import './CertificateDesigner.css';

const { Sider, Content, Header, Footer } = Layout;

const FIELD_PROPS = [
  'elementType', 'fieldKey', 'dynamicType', 'formatPattern',
  'qrSource', 'qrContent', 'errorCorrection', 'size',
  'seqRuleKey', 'locked',
  'prefix', 'suffix', 'textTransform', 'padZero', 'numberFormat',
];

export default function CertificateDesigner({ templateId, onBack }) {
  const canvasElRef = useRef(null);
  const stageRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef(null);
  const guideDisposeRef = useRef(null);
  const gridRef = useRef(null);
  const zoomPanRef = useRef(null);

  const [name, setName] = useState('未命名证书模版');
  const [width, setWidth] = useState(1123);
  const [height, setHeight] = useState(794);
  const [bgUrl, setBgUrl] = useState('');
  const [fields, setFields] = useState([...DEFAULT_FIELDS]);
  const [activeObj, setActiveObj] = useState(null);
  const [, forceUpdate] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [insertFieldKey, setInsertFieldKey] = useState(DEFAULT_FIELDS[0].key);

  const [previewMode, setPreview] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hist, setHist] = useState({ canUndo: false, canRedo: false });

  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const refresh = useCallback(() => forceUpdate((x) => x + 1), []);

  // 初始化 fabric 画布
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width, height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const sync = () => {
      setActiveObj(canvas.getActiveObject() || null);
      refresh();
    };
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    canvas.on('object:modified', sync);

    historyRef.current = createHistoryStack(canvas, {
      onChange: (s) => setHist({ canUndo: s.canUndo, canRedo: s.canRedo }),
    });
    historyRef.current.snapshot();

    guideDisposeRef.current = attachAlignmentGuideline(canvas, { threshold: 6 });
    gridRef.current = attachGrid(canvas, { size: 20, visible: true });
    zoomPanRef.current = attachZoomPan(canvas, {
      minZoom: 0.2, maxZoom: 4,
      onZoomChange: (z) => setZoom(z),
    });

    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const obj = canvas.getActiveObject();
        if (obj) {
          canvas.remove(obj);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          sync();
          e.preventDefault();
        }
      }
      // Ctrl/Cmd + Z / Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) historyRef.current?.redo();
        else historyRef.current?.undo();
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        historyRef.current?.redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);

    // 首次进入引导
    if (!localStorage.getItem('cert.tour.shown')) {
      setTimeout(() => setTourOpen(true), 400);
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      historyRef.current?.dispose();
      guideDisposeRef.current?.();
      gridRef.current?.dispose();
      zoomPanRef.current?.dispose();
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 加载已有模版
  useEffect(() => {
    if (!templateId || !fabricRef.current) return;
    let cancelled = false;
    templateApi.detail(templateId).then((d) => {
      if (cancelled || !d) return;
      setName(d.name || '未命名证书模版');
      setWidth(d.width || 1123);
      setHeight(d.height || 794);
      setBgUrl(d.bgUrl || '');
      if (Array.isArray(d.fields) && d.fields.length) setFields(d.fields);
      const canvas = fabricRef.current;
      canvas.setDimensions({ width: d.width || 1123, height: d.height || 794 });
      historyRef.current?.setSuspended(true);
      if (d.canvasJson) {
        canvas.loadFromJSON(d.canvasJson, () => {
          canvas.requestRenderAll();
          historyRef.current?.setSuspended(false);
          historyRef.current?.reset();
          historyRef.current?.snapshot();
        });
      } else {
        historyRef.current?.setSuspended(false);
      }
    }).catch((e) => {
      console.error(e);
      message.error('加载模版失败');
    });
    return () => { cancelled = true; };
  }, [templateId]);

  // 同步背景图
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!bgUrl) {
      canvas.backgroundImage = null;
      canvas.requestRenderAll();
      return;
    }
    fabric.FabricImage.fromURL(toAbsoluteUrl(bgUrl), { crossOrigin: 'anonymous' }).then((img) => {
      if (!img) return;
      img.set({
        scaleX: canvas.getWidth() / img.width,
        scaleY: canvas.getHeight() / img.height,
        originX: 'left', originY: 'top',
      });
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
    }).catch((e) => console.warn('设置背景图失败', e));
  }, [bgUrl, width, height]);

  // 同步画布尺寸
  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas) canvas.setDimensions({ width, height });
  }, [width, height]);

  /* ----------------- 工具栏动作 ----------------- */
  const insertText = () => {
    const t = new fabric.Textbox('双击编辑文本', {
      left: 100, top: 100, width: 320,
      fontSize: 32, fill: '#222222', fontFamily: 'Microsoft YaHei',
      editable: true,
    });
    t.elementType = 'text';
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.requestRenderAll();
  };

  const insertField = (key) => {
    const f = fields.find((x) => x.key === key);
    if (!f) { message.warning('请先选择字段'); return; }
    const t = new fabric.Textbox(`{{${f.label}}}`, {
      left: 120, top: 160, width: 360,
      fontSize: 36, fill: '#1677ff', fontFamily: 'Microsoft YaHei',
      fontWeight: 'bold',
    });
    t.elementType = 'field';
    t.fieldKey = f.key;
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.requestRenderAll();
  };

  const insertDateField = () => {
    const t = new fabric.Textbox('[日期:yyyy-MM-dd]', {
      left: 120, top: 220, width: 320,
      fontSize: 28, fill: '#10b981', fontFamily: 'Microsoft YaHei',
    });
    t.elementType = 'text';
    t.dynamicType = 'date';
    t.formatPattern = 'yyyy-MM-dd';
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.requestRenderAll();
  };

  const insertSeqField = () => {
    const t = new fabric.Textbox('[编号:default]', {
      left: 120, top: 260, width: 320,
      fontSize: 28, fill: '#a16207', fontFamily: 'Microsoft YaHei',
    });
    t.elementType = 'text';
    t.dynamicType = 'autoSeq';
    t.seqRuleKey = 'default';
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.requestRenderAll();
  };

  const insertQr = async () => {
    await insertQrCode(fabricRef.current, { content: 'https://example.com/cert/{{certNo}}' });
  };

  const handleUploadImage = async (file) => {
    try {
      const { url } = await templateApi.upload(file);
      const img = await fabric.FabricImage.fromURL(toAbsoluteUrl(url), { crossOrigin: 'anonymous' });
      img.set({ left: 200, top: 200, scaleX: 0.5, scaleY: 0.5 });
      img.elementType = 'image';
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.requestRenderAll();
      message.success('图片已插入');
    } catch (e) {
      console.error(e);
      message.error('图片上传失败');
    }
    return false;
  };

  const handleUploadBg = async (file) => {
    try {
      // 走后端代理上传至阿里云 OSS，返回 https url
      const r = await fileApi.upload(file, 'cert-bg');
      setBgUrl(r.url);
      message.success(`背景图已设置（${r.storage === 'oss' ? '已存 OSS' : '本地兑底'}）`);
    } catch (e) {
      console.error(e);
      message.error('上传背景图失败');
    }
    return false;
  };

  const removeActive = () => {
    const canvas = fabricRef.current;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setActiveObj(null);
  };

  const updateActive = (props) => {
    const canvas = fabricRef.current;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set(props);
    canvas.requestRenderAll();
    refresh();
  };

  /* ----------------- 预览/网格/缩放 ----------------- */
  const togglePreview = (v) => {
    setPreview(v);
    setPreviewMode(fabricRef.current, v);
    if (v) {
      stageRef.current?.classList.add('preview-mode');
    } else {
      stageRef.current?.classList.remove('preview-mode');
    }
  };

  const toggleGrid = (v) => {
    setShowGrid(v);
    gridRef.current?.setVisible(v);
  };

  /* ----------------- 保存 ----------------- */
  const buildPayload = () => {
    const canvas = fabricRef.current;
    const canvasJson = canvas.toJSON(FIELD_PROPS);
    delete canvasJson.backgroundImage;
    const thumbnail = canvas.toDataURL({ format: 'png', multiplier: 0.3 });
    return { name: name.trim(), bgUrl, width, height, fields, canvasJson, thumbnail };
  };

  const save = async () => {
    if (!fabricRef.current) return;
    const payload = buildPayload();
    const errors = validateTemplate(payload);
    if (errors.length) { message.warning(errors[0]); return; }
    setSaving(true);
    try {
      if (templateId) await templateApi.update(templateId, payload);
      else await templateApi.create(payload);
      message.success('保存成功');
      onBack && onBack(true);
    } catch (e) {
      console.error(e);
      message.error('保存失败：' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  /* ----------------- 版本管理 ----------------- */
  const saveSnapshot = async () => {
    if (!templateId) { message.warning('请先保存模版后再创建版本'); return; }
    const comment = window.prompt('请输入本次版本说明（可选）') || '';
    try {
      // 先把当前编辑保存到主表，确保快照一致
      await templateApi.update(templateId, buildPayload());
      await versionApi.snapshot(templateId, comment);
      message.success('版本已创建');
    } catch (e) {
      message.error('创建版本失败');
      console.error(e);
    }
  };

  const onRollback = async (versionNo) => {
    if (!templateId) return;
    try {
      await versionApi.rollback(templateId, versionNo);
      message.success(`已回滚到 v${versionNo}`);
      // 重新加载
      const d = await templateApi.detail(templateId);
      setName(d.name || '');
      setWidth(d.width || 1123);
      setHeight(d.height || 794);
      setBgUrl(d.bgUrl || '');
      if (Array.isArray(d.fields)) setFields(d.fields);
      const canvas = fabricRef.current;
      canvas.setDimensions({ width: d.width || 1123, height: d.height || 794 });
      historyRef.current?.setSuspended(true);
      canvas.loadFromJSON(d.canvasJson || { objects: [] }, () => {
        canvas.requestRenderAll();
        historyRef.current?.setSuspended(false);
        historyRef.current?.reset();
        historyRef.current?.snapshot();
      });
      setVersionDrawerOpen(false);
    } catch (e) {
      message.error('回滚失败');
      console.error(e);
    }
  };

  /* ----------------- 渲染 ----------------- */
  const insertMenuItems = [
    { key: 'text', icon: <FontSizeOutlined />, label: '文本', onClick: insertText },
    { key: 'field', icon: <TagOutlined />, label: '动态字段', onClick: () => insertField(insertFieldKey) },
    { key: 'date', icon: <CalendarOutlined />, label: '日期', onClick: insertDateField },
    { key: 'seq', icon: <NumberOutlined />, label: '自动编号', onClick: insertSeqField },
    { key: 'qr', icon: <QrcodeOutlined />, label: '二维码', onClick: insertQr },
  ];

  return (
    <Layout className="cert-designer">
      <Header className="cd-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => onBack && onBack(false)}>返回</Button>
          <FileImageOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="证书模版名称" style={{ width: 260 }} />
        </Space>
        <Space>
          <Tooltip title="撤销 (Ctrl+Z)"><Button icon={<UndoOutlined />} disabled={!hist.canUndo} onClick={() => historyRef.current?.undo()} /></Tooltip>
          <Tooltip title="重做 (Ctrl+Shift+Z)"><Button icon={<RedoOutlined />} disabled={!hist.canRedo} onClick={() => historyRef.current?.redo()} /></Tooltip>
          <Tooltip title={previewMode ? '退出预览 (元素不可选)' : '进入预览模式'}>
            <Button icon={previewMode ? <EditOutlined /> : <EyeOutlined />}
              type={previewMode ? 'primary' : 'default'}
              onClick={() => togglePreview(!previewMode)}>
              {previewMode ? '编辑' : '预览'}
            </Button>
          </Tooltip>
          <Tooltip title="网格"><Switch checked={showGrid} checkedChildren={<AppstoreOutlined />} unCheckedChildren={<BorderOutlined />} onChange={toggleGrid} /></Tooltip>
          <Tooltip title="版本管理">
            <Button icon={<HistoryOutlined />} onClick={() => setVersionDrawerOpen(true)} disabled={!templateId}>版本</Button>
          </Tooltip>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>保存</Button>
        </Space>
      </Header>

      <Layout className="cd-body">
        <Sider width={220} className="cd-left">
          <div className="cd-section-title">插入元素</div>
          <Dropdown menu={{ items: insertMenuItems }} placement="bottomLeft">
            <Button block>+ 添加元素</Button>
          </Dropdown>

          <div className="cd-section-title">基础元素</div>
          <Button block icon={<FontSizeOutlined />} onClick={insertText} style={{ marginBottom: 8 }}>插入文本</Button>
          <Upload beforeUpload={handleUploadImage} showUploadList={false} accept="image/*">
            <Button block icon={<PictureOutlined />} style={{ marginBottom: 8 }}>插入图片</Button>
          </Upload>
          <Button block icon={<QrcodeOutlined />} onClick={insertQr} style={{ marginBottom: 8 }}>插入二维码</Button>

          <div className="cd-section-title">动态字段</div>
          <select
            value={insertFieldKey}
            onChange={(e) => setInsertFieldKey(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 4 }}
          >
            {fields.map((f) => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
          </select>
          <Button block type="dashed" icon={<TagOutlined />} onClick={() => insertField(insertFieldKey)} style={{ marginBottom: 8 }}>
            插入字段
          </Button>
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <Button style={{ flex: 1 }} icon={<CalendarOutlined />} onClick={insertDateField}>日期</Button>
            <Button style={{ flex: 1 }} icon={<NumberOutlined />} onClick={insertSeqField}>编号</Button>
          </Space.Compact>
          <Button block icon={<UnorderedListOutlined />} onClick={() => setFieldDialogOpen(true)} style={{ marginBottom: 8 }}>
            管理字段
          </Button>

          <div className="cd-section-title">背景</div>
          <div style={{ paddingRight: 8, marginBottom: 8 }}>
            <Space.Compact block>
              <Upload beforeUpload={handleUploadBg} showUploadList={false} accept="image/*" style={{ flex: 1 }}>
                <Button icon={<CloudUploadOutlined />} style={{ width: '100%' }}>本地上传</Button>
              </Upload>
              <Tooltip title="从资料库选择图片作为背景">
                <Button icon={<DatabaseOutlined />} onClick={() => setBgPickerOpen(true)}>资料库</Button>
              </Tooltip>
            </Space.Compact>
          </div>
          {bgUrl && (
            <Button block danger onClick={() => setBgUrl('')} style={{ marginBottom: 8 }}>清除背景图</Button>
          )}

          <div className="cd-section-title">画布尺寸</div>
          <Form layout="vertical" size="small">
            <Form.Item label="宽 (px)">
              <InputNumber min={400} max={3000} value={width} onChange={(v) => setWidth(v || 1123)} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="高 (px)">
              <InputNumber min={300} max={3000} value={height} onChange={(v) => setHeight(v || 794)} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block size="small" onClick={() => { setWidth(1123); setHeight(794); }}>A4 横版</Button>
            <Button block size="small" onClick={() => { setWidth(794); setHeight(1123); }}>A4 竖版</Button>
            <Button block size="small" onClick={() => { setWidth(1280); setHeight(720); }}>16:9</Button>
          </Space>

          <div className="cd-section-title">导入 / 导出</div>
          <Upload
            beforeUpload={async (f) => {
              try {
                const t = await templateApi.importTpl(f);
                message.success('导入成功');
                onBack && onBack(true, t.id);
              } catch (e) { message.error('导入失败'); }
              return false;
            }}
            showUploadList={false}
            accept=".json"
          >
            <Button block icon={<ImportOutlined />} style={{ marginBottom: 8 }}>导入 JSON</Button>
          </Upload>
          <Button block icon={<ExportOutlined />} disabled={!templateId} onClick={async () => {
            try {
              const blob = await templateApi.exportTpl(templateId);
              triggerDownload(blob, `${name || 'cert-template'}.json`);
            } catch (e) { message.error('导出失败'); }
          }}>导出 JSON</Button>
        </Sider>

        <Content className="cd-canvas-wrap">
          <div ref={stageRef} className="cd-canvas-stage">
            <canvas ref={canvasElRef} />
          </div>
          <div className="cd-canvas-tip">
            提示：双击文本可编辑；Ctrl+滚轮缩放；按住空格拖动平移；Delete 删除；Ctrl+Z 撤销
          </div>
        </Content>

        <Sider width={300} className="cd-right">
          <PropertyPanel
            canvas={fabricRef.current}
            activeObj={activeObj}
            fields={fields}
            onUpdate={updateActive}
            onDelete={removeActive}
            onChangeFields={setFields}
            onActiveChanged={refresh}
          />
        </Sider>
      </Layout>

      <Footer className="cd-status-bar">
        <span>
          {activeObj ? `已选中：${activeObj.elementType || activeObj.type}` : `元素总数：${fabricRef.current?.getObjects().length || 0}`}
        </span>
        <div className="cd-zoom">
          <Button size="small" type="text" icon={<ZoomOutOutlined />}
            onClick={() => zoomPanRef.current?.setZoom((zoom || 1) - 0.1)} />
          <Slider style={{ width: 120 }} min={0.2} max={4} step={0.1}
            value={zoom} onChange={(v) => zoomPanRef.current?.setZoom(v)} />
          <Button size="small" type="text" icon={<ZoomInOutlined />}
            onClick={() => zoomPanRef.current?.setZoom((zoom || 1) + 0.1)} />
          <span>{Math.round((zoom || 1) * 100)}%</span>
          <Button size="small" type="link" onClick={() => zoomPanRef.current?.fit()}>1:1</Button>
        </div>
      </Footer>

      <FieldsManageModal
        open={fieldDialogOpen}
        fields={fields}
        onCancel={() => setFieldDialogOpen(false)}
        onOk={(list) => { setFields(list); setFieldDialogOpen(false); }}
      />

      <ResourceLibPicker
        open={bgPickerOpen}
        onClose={() => setBgPickerOpen(false)}
        onSelect={(item) => {
          const src = item?.url || item?.dataUrl;
          if (src) {
            setBgUrl(src);
            message.success(`已应用背景图：${item.name}`);
          }
        }}
        title="从资料库选择背景图"
        accept={['image']}
      />

      <VersionDrawer
        open={versionDrawerOpen}
        templateId={templateId}
        onClose={() => setVersionDrawerOpen(false)}
        onSnapshot={saveSnapshot}
        onRollback={onRollback}
      />

      <Tour
        open={tourOpen}
        onClose={() => { setTourOpen(false); localStorage.setItem('cert.tour.shown', '1'); }}
        steps={[
          { title: '插入元素', description: '左侧侧栏可插入文本、字段、日期、编号、二维码与图片' },
          { title: '属性面板', description: '右侧分组配置内容、样式、位置与层级，支持锁定' },
          { title: '撤销/重做', description: '使用 Ctrl+Z / Ctrl+Shift+Z 或顶部按钮' },
          { title: '预览模式', description: '点击「预览」按钮查看不可编辑的真实效果' },
          { title: '版本管理', description: '点击「版本」可保存快照与回滚历史版本' },
        ]}
      />
    </Layout>
  );
}

/* ============== 字段管理弹窗 ============== */
function FieldsManageModal({ open, fields, onCancel, onOk }) {
  const [list, setList] = useState([]);
  useEffect(() => { if (open) setList(fields.map((f) => ({ ...f }))); }, [open, fields]);
  const update = (i, k, v) => setList((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => setList((arr) => [...arr, { key: 'field' + (arr.length + 1), label: '新字段', sample: '' }]);
  const del = (i) => setList((arr) => arr.filter((_, idx) => idx !== i));
  return (
    <Modal open={open} onCancel={onCancel} onOk={() => onOk(list)} title="管理动态字段" width={640} okText="确认">
      <div style={{ marginBottom: 8 }}><Button size="small" onClick={add}>+ 新增字段</Button></div>
      <table className="cd-fields-table">
        <thead><tr><th>字段Key</th><th>显示标签</th><th>样例数据</th><th width={60}></th></tr></thead>
        <tbody>
          {list.map((f, i) => (
            <tr key={i}>
              <td><Input size="small" value={f.key} onChange={(e) => update(i, 'key', e.target.value)} /></td>
              <td><Input size="small" value={f.label} onChange={(e) => update(i, 'label', e.target.value)} /></td>
              <td><Input size="small" value={f.sample} onChange={(e) => update(i, 'sample', e.target.value)} /></td>
              <td><Button danger size="small" type="text" onClick={() => del(i)}>删除</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

/* ============== 版本管理抽屉 ============== */
function VersionDrawer({ open, templateId, onClose, onSnapshot, onRollback }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && templateId) {
      setLoading(true);
      versionApi.list(templateId).then(setList).finally(() => setLoading(false));
    }
  }, [open, templateId]);

  return (
    <Modal title="版本管理" open={open} onCancel={onClose} footer={null} width={560} destroyOnClose>
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={async () => {
          await onSnapshot();
          if (templateId) {
            const arr = await versionApi.list(templateId);
            setList(arr);
          }
        }}>+ 保存当前版本</Button>
      </div>
      {loading ? '加载中...' : (
        <table className="cd-fields-table">
          <thead><tr><th width={70}>版本</th><th>说明</th><th width={150}>时间</th><th width={80}>操作</th></tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>暂无版本</td></tr>
            ) : list.map((v) => (
              <tr key={v.id}>
                <td>v{v.versionNo}</td>
                <td>{v.comment || '-'}</td>
                <td>{v.createTime ? new Date(v.createTime).toLocaleString('zh-CN') : '-'}</td>
                <td><Button size="small" type="link" onClick={() => onRollback(v.versionNo)}>回滚</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
