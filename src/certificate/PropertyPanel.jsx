import { useEffect, useState } from 'react';
import {
  Collapse, Form, Input, InputNumber, Select, ColorPicker, Space, Button,
  Tooltip, Popconfirm, Switch, Divider, Typography, Tag, Alert,
} from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  VerticalAlignTopOutlined, VerticalAlignBottomOutlined,
  ArrowUpOutlined, ArrowDownOutlined, LockOutlined, UnlockOutlined,
  DeleteOutlined, SettingOutlined, EyeOutlined,
} from '@ant-design/icons';
import { fontApi, seqApi } from './api';
import {
  setObjectLocked, bringForward, sendBackward, bringToFront, sendToBack,
  loadFont, refreshQrCode,
} from './designerHelpers';
import SeqRuleManagerModal from './SeqRuleManagerModal.jsx';

const { Text } = Typography;

const COMMON_FONTS = [
  'Microsoft YaHei', 'PingFang SC', 'SimSun', 'SimHei', 'KaiTi',
  'STSong', 'STKaiti', 'Arial', 'Times New Roman', 'Helvetica', 'Georgia',
];

/**
 * 属性面板（B7）：Collapse 五段分组
 *  - 内容 / 排版 / 字段 / 位置尺寸 / 层级
 */
export default function PropertyPanel({
  canvas, activeObj, fields, onUpdate, onDelete, onChangeFields, onActiveChanged,
}) {
  const [fontOpts, setFontOpts] = useState(COMMON_FONTS.map((f) => ({ label: f, value: f })));
  const [missingFonts, setMissingFonts] = useState([]);
  const [seqRules, setSeqRules] = useState([]);
  const [seqMgrOpen, setSeqMgrOpen] = useState(false);
  const [seqPreview, setSeqPreview] = useState('');
  const [customDateMode, setCustomDateMode] = useState(false);

  const reloadSeqRules = () => seqApi.list().then(setSeqRules).catch(() => {});

  // 字体推荐 + 校验
  useEffect(() => {
    fontApi.recommend().then((list) => {
      const opts = list.map((it) => ({
        label: (
          <span style={{ fontFamily: it.name }}>
            {it.name}{!it.available && <Tag color="warning" style={{ marginLeft: 6 }}>缺失</Tag>}
          </span>
        ),
        value: it.name,
        available: it.available,
      }));
      setFontOpts(opts);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    reloadSeqRules();
  }, []);

  // 选中编号元素时预览下一个号
  useEffect(() => {
    if (!activeObj || activeObj.dynamicType !== 'autoSeq') { setSeqPreview(''); return; }
    const key = activeObj.seqRuleKey || 'default';
    seqApi.peek(key).then((r) => setSeqPreview(r?.value || '')).catch(() => setSeqPreview(''));
  }, [activeObj?.seqRuleKey, activeObj?.dynamicType, seqRules]);

  useEffect(() => {
    if (!canvas) return;
    const used = new Set();
    canvas.getObjects().forEach((o) => { if (o.fontFamily) used.add(o.fontFamily); });
    if (!used.size) return;
    fontApi.check([...used]).then((r) => setMissingFonts(r.missing || [])).catch(() => {});
  }, [canvas, activeObj]);

  const update = (props) => onUpdate && onUpdate(props);

  if (!activeObj) {
    return (
      <div className="cd-pp-empty">
        <Alert type="info" showIcon message="选中元素后可在此编辑属性" />
        {missingFonts.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message="字体在服务端缺失"
            description={`服务端缺少：${missingFonts.join('、')}，导出时会回退替代字体`}
          />
        )}
      </div>
    );
  }

  const isText = ['IText', 'i-text', 'Text', 'text', 'Textbox', 'textbox'].includes(activeObj.type);
  const isImage = ['Image', 'image'].includes(activeObj.type);
  const isField = activeObj.elementType === 'field';
  const isQr = activeObj.elementType === 'qrcode';
  const isDate = activeObj.dynamicType === 'date';
  const isSeq = activeObj.dynamicType === 'autoSeq';
  const locked = !!activeObj.locked;

  // ====== 内容 ======
  const contentItems = [];
  if (isText && !isField && !isDate && !isSeq) {
    contentItems.push({
      key: 'text',
      label: '文本内容',
      node: (
        <Input.TextArea
          value={activeObj.text || ''}
          onChange={(e) => update({ text: e.target.value })}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      ),
    });
  }
  if (isField) {
    contentItems.push({
      key: 'fieldKey',
      label: '绑定字段',
      node: (
        <Select
          value={activeObj.fieldKey}
          onChange={(v) => {
            const f = fields.find((x) => x.key === v);
            update({ fieldKey: v, text: f ? `{{${f.label}}}` : `{{${v}}}` });
          }}
          style={{ width: '100%' }}
          options={fields.map((f) => ({ label: `${f.label} (${f.key})`, value: f.key }))}
        />
      ),
    });
    contentItems.push({
      key: 'fieldDateFmt',
      label: <span>日期格式<Tooltip title="仅当字段值是日期/时间戳/ISO 时生效，例：yyyy-MM-dd。留空表示不转换。"><span style={{ marginLeft: 4, color: '#999' }}>ⓘ</span></Tooltip></span>,
      node: (
        <Input
          allowClear
          placeholder="留空 / yyyy-MM-dd / yyyy年MM月dd日"
          value={activeObj.formatPattern || ''}
          onChange={(e) => update({ formatPattern: e.target.value })}
        />
      ),
    });
  }
  if (isDate) {
    const presets = [
      'yyyy-MM-dd', 'yyyy年MM月dd日', 'yyyy/MM/dd',
      'yyyy-MM-dd HH:mm', 'MM-dd',
    ];
    const cur = activeObj.formatPattern || 'yyyy-MM-dd';
    const inPreset = presets.includes(cur);
    contentItems.push({
      key: 'dateFmt',
      label: '日期格式',
      node: (
        <Space.Compact style={{ width: '100%' }}>
          <Select
            value={(customDateMode || !inPreset) ? '__custom__' : cur}
            onChange={(v) => {
              if (v === '__custom__') { setCustomDateMode(true); return; }
              setCustomDateMode(false);
              update({ formatPattern: v, text: `[日期:${v}]` });
            }}
            style={{ width: '50%' }}
            options={[
              { value: 'yyyy-MM-dd', label: '2025-05-24' },
              { value: 'yyyy年MM月dd日', label: '2025年05月24日' },
              { value: 'yyyy/MM/dd', label: '2025/05/24' },
              { value: 'yyyy-MM-dd HH:mm', label: '2025-05-24 12:30' },
              { value: 'MM-dd', label: '05-24' },
              { value: '__custom__', label: '自定义…' },
            ]}
          />
          <Input
            placeholder="自定义格式，如 yyyy.MM.dd"
            value={cur}
            onChange={(e) => update({ formatPattern: e.target.value, text: `[日期:${e.target.value}]` })}
            style={{ width: '50%' }}
          />
        </Space.Compact>
      ),
    });
  }
  if (isSeq) {
    contentItems.push({
      key: 'seqRule',
      label: '编号规则',
      node: (
        <Space.Compact style={{ width: '100%' }}>
          <Select
            value={activeObj.seqRuleKey || 'default'}
            onChange={(v) => update({ seqRuleKey: v, text: `[编号:${v}]` })}
            style={{ flex: 1 }}
            options={seqRules.map((r) => ({
              label: <span><Tag color="blue">{r.ruleKey}</Tag><span style={{ color: '#999' }}>{r.rulePattern}</span></span>,
              value: r.ruleKey,
            }))}
            placeholder="选择编号规则"
            notFoundContent={<span style={{ color: '#999' }}>暂无规则，请点右侧齿轮管理</span>}
          />
          <Tooltip title="管理编号规则（增删改查）">
            <Button icon={<SettingOutlined />} onClick={() => setSeqMgrOpen(true)} />
          </Tooltip>
        </Space.Compact>
      ),
    });
    if (seqPreview) {
      contentItems.push({
        key: 'seqPreview',
        label: <span>下一个编号<Tooltip title="预览下一个生成的编号，不会落库"><span style={{ marginLeft: 4, color: '#999' }}>ⓘ</span></Tooltip></span>,
        node: (
          <Space>
            <Text code style={{ color: '#16a34a' }}>{seqPreview}</Text>
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => {
              const key = activeObj.seqRuleKey || 'default';
              seqApi.peek(key).then((r) => setSeqPreview(r?.value || '')).catch(() => {});
            }}>刷新</Button>
          </Space>
        ),
      });
    }
  }
  if (isQr) {
    contentItems.push(
      {
        key: 'qrSource',
        label: '二维码来源',
        node: (
          <Select
            value={activeObj.qrSource || 'static'}
            onChange={async (v) => {
              const obj = activeObj;
              obj.qrSource = v;
              await refreshQrCode(canvas, obj);
              onActiveChanged && onActiveChanged();
            }}
            style={{ width: '100%' }}
            options={[
              { label: '静态内容', value: 'static' },
              { label: '动态字段', value: 'field' },
            ]}
          />
        ),
      },
      activeObj.qrSource === 'field'
        ? {
          key: 'qrField',
          label: '字段',
          node: (
            <Select
              value={activeObj.fieldKey}
              onChange={async (v) => {
                const obj = activeObj;
                obj.fieldKey = v;
                obj.qrContent = `{{${v}}}`;
                await refreshQrCode(canvas, obj);
                onActiveChanged && onActiveChanged();
              }}
              style={{ width: '100%' }}
              options={fields.map((f) => ({ label: `${f.label} (${f.key})`, value: f.key }))}
            />
          ),
        }
        : {
          key: 'qrContent',
          label: '二维码内容',
          node: (
            <Input.TextArea
              value={activeObj.qrContent || ''}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onChange={(e) => { activeObj.qrContent = e.target.value; }}
              onBlur={async () => {
                await refreshQrCode(canvas, activeObj);
                onActiveChanged && onActiveChanged();
              }}
            />
          ),
        },
      {
        key: 'qrEc',
        label: '容错等级',
        node: (
          <Select
            value={activeObj.errorCorrection || 'M'}
            onChange={async (v) => {
              activeObj.errorCorrection = v;
              await refreshQrCode(canvas, activeObj);
              onActiveChanged && onActiveChanged();
            }}
            style={{ width: '100%' }}
            options={[
              { label: 'L (~7%)', value: 'L' }, { label: 'M (~15%)', value: 'M' },
              { label: 'Q (~25%)', value: 'Q' }, { label: 'H (~30%)', value: 'H' },
            ]}
          />
        ),
      },
      {
        key: 'qrSize',
        label: '尺寸 (px)',
        node: (
          <InputNumber
            min={40} max={800}
            value={activeObj.size || 160}
            onChange={async (v) => {
              activeObj.size = v || 160;
              await refreshQrCode(canvas, activeObj);
              onActiveChanged && onActiveChanged();
            }}
            style={{ width: '100%' }}
          />
        ),
      },
    );
  }

  // ====== 排版 ======
  const styleItems = [];
  if (isText) {
    styleItems.push(
      { key: 'fontSize', label: '字号 (px)', node: (
        <InputNumber min={8} max={200} value={activeObj.fontSize}
          onChange={(v) => update({ fontSize: v || 24 })} style={{ width: '100%' }} />
      )},
      { key: 'fontFamily', label: '字体', node: (
        <Select
          value={activeObj.fontFamily}
          onChange={async (v) => { await loadFont(v); update({ fontFamily: v }); }}
          style={{ width: '100%' }}
          showSearch
          options={fontOpts}
        />
      )},
      { key: 'fill', label: '颜色', node: (
        <ColorPicker showText value={activeObj.fill || '#000000'}
          onChange={(c) => update({ fill: c.toHexString() })} />
      )},
      { key: 'style', label: '样式', node: (
        <Space wrap>
          <Tooltip title="加粗"><Button size="small" type={activeObj.fontWeight === 'bold' ? 'primary' : 'default'}
            icon={<BoldOutlined />}
            onClick={() => update({ fontWeight: activeObj.fontWeight === 'bold' ? 'normal' : 'bold' })} /></Tooltip>
          <Tooltip title="斜体"><Button size="small" type={activeObj.fontStyle === 'italic' ? 'primary' : 'default'}
            icon={<ItalicOutlined />}
            onClick={() => update({ fontStyle: activeObj.fontStyle === 'italic' ? 'normal' : 'italic' })} /></Tooltip>
          <Tooltip title="下划线"><Button size="small" type={activeObj.underline ? 'primary' : 'default'}
            icon={<UnderlineOutlined />} onClick={() => update({ underline: !activeObj.underline })} /></Tooltip>
          <Tooltip title="删除线"><Button size="small" type={activeObj.linethrough ? 'primary' : 'default'}
            icon={<StrikethroughOutlined />} onClick={() => update({ linethrough: !activeObj.linethrough })} /></Tooltip>
        </Space>
      )},
      { key: 'align', label: '对齐', node: (
        <Space>
          <Tooltip title="左对齐"><Button size="small" icon={<AlignLeftOutlined />}
            type={activeObj.textAlign === 'left' ? 'primary' : 'default'}
            onClick={() => update({ textAlign: 'left' })} /></Tooltip>
          <Tooltip title="居中"><Button size="small" icon={<AlignCenterOutlined />}
            type={activeObj.textAlign === 'center' ? 'primary' : 'default'}
            onClick={() => update({ textAlign: 'center' })} /></Tooltip>
          <Tooltip title="右对齐"><Button size="small" icon={<AlignRightOutlined />}
            type={activeObj.textAlign === 'right' ? 'primary' : 'default'}
            onClick={() => update({ textAlign: 'right' })} /></Tooltip>
        </Space>
      )},
      { key: 'lineHeight', label: '行高', node: (
        <InputNumber step={0.1} min={0.8} max={3} value={activeObj.lineHeight ?? 1.16}
          onChange={(v) => update({ lineHeight: v ?? 1.16 })} style={{ width: '100%' }} />
      )},
      { key: 'charSpacing', label: '字间距', node: (
        <InputNumber step={10} min={-200} max={2000} value={activeObj.charSpacing ?? 0}
          onChange={(v) => update({ charSpacing: v ?? 0 })} style={{ width: '100%' }} />
      )},
    );
  }
  if (isImage) {
    styleItems.push(
      { key: 'opacity', label: '不透明度', node: (
        <InputNumber min={0} max={1} step={0.1} value={activeObj.opacity ?? 1}
          onChange={(v) => update({ opacity: v ?? 1 })} style={{ width: '100%' }} />
      )},
    );
  }

  // ====== 位置 / 尺寸 ======
  const w = Math.round((activeObj.width || 0) * (activeObj.scaleX || 1));
  const h = Math.round((activeObj.height || 0) * (activeObj.scaleY || 1));
  const sizeItems = [
    { key: 'x', label: 'X (px)', node: (
      <InputNumber value={Math.round(activeObj.left || 0)} onChange={(v) => update({ left: v ?? 0 })} style={{ width: '100%' }} />
    )},
    { key: 'y', label: 'Y (px)', node: (
      <InputNumber value={Math.round(activeObj.top || 0)} onChange={(v) => update({ top: v ?? 0 })} style={{ width: '100%' }} />
    )},
    { key: 'w', label: '宽 (px)', node: (
      <InputNumber min={1} value={w} onChange={(v) => {
        if (!activeObj.width) return;
        const r = (v || 1) / activeObj.width;
        update({ scaleX: r });
      }} style={{ width: '100%' }} />
    )},
    { key: 'h', label: '高 (px)', node: (
      <InputNumber min={1} value={h} onChange={(v) => {
        if (!activeObj.height) return;
        const r = (v || 1) / activeObj.height;
        update({ scaleY: r });
      }} style={{ width: '100%' }} />
    )},
    { key: 'rot', label: '旋转 (°)', node: (
      <InputNumber value={Math.round(activeObj.angle || 0)} onChange={(v) => update({ angle: v ?? 0 })} style={{ width: '100%' }} />
    )},
  ];

  // ====== 层级 ======
  const layerItems = [
    { key: 'layer', label: '层级', node: (
      <Space wrap>
        <Tooltip title="上移一层"><Button size="small" icon={<ArrowUpOutlined />}
          onClick={() => bringForward(canvas, activeObj)} /></Tooltip>
        <Tooltip title="下移一层"><Button size="small" icon={<ArrowDownOutlined />}
          onClick={() => sendBackward(canvas, activeObj)} /></Tooltip>
        <Tooltip title="置顶"><Button size="small" icon={<VerticalAlignTopOutlined />}
          onClick={() => bringToFront(canvas, activeObj)} /></Tooltip>
        <Tooltip title="置底"><Button size="small" icon={<VerticalAlignBottomOutlined />}
          onClick={() => sendToBack(canvas, activeObj)} /></Tooltip>
      </Space>
    )},
    { key: 'lock', label: '锁定', node: (
      <Switch checked={locked} checkedChildren={<LockOutlined />} unCheckedChildren={<UnlockOutlined />}
        onChange={(v) => { setObjectLocked(activeObj, v); canvas.requestRenderAll(); onActiveChanged && onActiveChanged(); }} />
    )},
  ];

  const renderForm = (items) => (
    <Form layout="vertical" size="small">
      {items.map((it) => (
        <Form.Item key={it.key} label={it.label}>{it.node}</Form.Item>
      ))}
    </Form>
  );

  const collapseItems = [];
  if (contentItems.length) collapseItems.push({ key: 'content', label: '内容', children: renderForm(contentItems) });

  // ====== 格式化（适用于静态文本 / 字段 / 日期 / 编号） ======
  const formatItems = [];
  const isFormattableText = isText && !isQr;
  if (isFormattableText) {
    formatItems.push({
      key: 'prefix',
      label: <span>前缀<Tooltip title="输出时拼接在文本前面，例如：证书编号 "><span style={{ marginLeft: 4, color: '#999' }}>ⓘ</span></Tooltip></span>,
      node: (
        <Input
          allowClear
          placeholder="例：编号："
          value={activeObj.prefix || ''}
          onChange={(e) => update({ prefix: e.target.value })}
        />
      ),
    });
    formatItems.push({
      key: 'suffix',
      label: '后缀',
      node: (
        <Input
          allowClear
          placeholder="例：等级 / 年度"
          value={activeObj.suffix || ''}
          onChange={(e) => update({ suffix: e.target.value })}
        />
      ),
    });
    // 大小写：对静态文本 / 字段生效（日期 / 编号不需要）
    if (!isDate && !isSeq) {
      formatItems.push({
        key: 'textTransform',
        label: '大小写变换',
        node: (
          <Select
            value={activeObj.textTransform || 'none'}
            onChange={(v) => update({ textTransform: v === 'none' ? '' : v })}
            style={{ width: '100%' }}
            options={[
              { value: 'none', label: '不变换' },
              { value: 'upper', label: '全大写 (ABC)' },
              { value: 'lower', label: '全小写 (abc)' },
              { value: 'capitalize', label: '首字母大写 (Abc)' },
            ]}
          />
        ),
      });
    }
    // 数值专用：仅对字段、静态文本开放（二者可能是数字）
    if ((isField || (!isDate && !isSeq && !isField))) {
      formatItems.push({
        key: 'padZero',
        label: <span>补零位数<Tooltip title="仅对纯整数生效，如 4 → 0001；填 0 不补零"><span style={{ marginLeft: 4, color: '#999' }}>ⓘ</span></Tooltip></span>,
        node: (
          <InputNumber
            min={0} max={20}
            value={activeObj.padZero || 0}
            onChange={(v) => update({ padZero: v || 0 })}
            style={{ width: '100%' }}
          />
        ),
      });
      formatItems.push({
        key: 'numberFormat',
        label: <span>数值格式<Tooltip title="DecimalFormat 模式，例：#,##0.00 → 1,234.50；0.00% → 95.00%。仅对纯数字生效。"><span style={{ marginLeft: 4, color: '#999' }}>ⓘ</span></Tooltip></span>,
        node: (
          <Select
            allowClear
            value={activeObj.numberFormat || undefined}
            onChange={(v) => update({ numberFormat: v || '' })}
            placeholder="选择或输入自定义"
            mode="tags"
            maxCount={1}
            style={{ width: '100%' }}
            options={[
              { value: '#,##0', label: '千分位整数 1,234' },
              { value: '#,##0.00', label: '千分位两位小数 1,234.50' },
              { value: '0.00%', label: '百分比 95.00%' },
              { value: '0.0', label: '一位小数 95.0' },
            ]}
          />
        ),
      });
    }
  }
  if (formatItems.length) collapseItems.push({ key: 'format', label: '格式化', children: renderForm(formatItems) });

  if (styleItems.length) collapseItems.push({ key: 'style', label: '样式', children: renderForm(styleItems) });
  collapseItems.push({ key: 'size', label: '位置 / 尺寸', children: renderForm(sizeItems) });
  collapseItems.push({ key: 'layer', label: '层级 / 锁定', children: renderForm(layerItems) });

  return (
    <div className="cd-property-panel">
      <div style={{ marginBottom: 8 }}>
        <Text strong>{labelOf(activeObj)}</Text>
      </div>
      <Collapse
        size="small"
        defaultActiveKey={['content', 'format', 'style', 'size']}
        items={collapseItems}
      />
      <div style={{ marginTop: 12 }}>
        <Popconfirm title="删除该元素？" onConfirm={onDelete}>
          <Button block danger icon={<DeleteOutlined />}>删除元素</Button>
        </Popconfirm>
      </div>
      <SeqRuleManagerModal
        open={seqMgrOpen}
        onClose={() => setSeqMgrOpen(false)}
        onChanged={reloadSeqRules}
      />
    </div>
  );
}

function labelOf(obj) {
  if (!obj) return '';
  if (obj.elementType === 'qrcode') return '二维码';
  if (obj.elementType === 'field') return `字段：${obj.fieldKey || '(未绑定)'}`;
  if (obj.dynamicType === 'date') return '日期';
  if (obj.dynamicType === 'autoSeq') return '自动编号';
  if (['Image', 'image'].includes(obj.type)) return '图片';
  return '文本';
}
