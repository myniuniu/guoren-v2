import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, message, Modal, Input, Form, Switch, Select, InputNumber, Tooltip } from 'antd';
import { ArrowLeftOutlined, CloudOutlined, CloudSyncOutlined } from '@ant-design/icons';
import FormDesignerV2 from './form/FormDesignerV2';
import FlowDesignerV2 from './flow/FlowDesignerV2';
import VersionHistoryPopover from './VersionHistoryPopover';
import { processConfigApi } from './api';
import { flowToBpmnXml } from './utils/flowToBpmn';
import { validateFlow, formatErrors, isValidProcessKey } from './utils/flowValidator';
import { createDefaultFlow } from './types';
import './ProcessDesignerV2.css';

const STEPS = [
  { key: 'basic', label: '基础信息' },
  { key: 'form', label: '表单设计' },
  { key: 'flow', label: '流程设计' },
  { key: 'settings', label: '更多设置' },
];

/* ─── 基础信息 Tab ─── */
function BasicInfoPanel({ record, basicInfo, setBasicInfo }) {
  const keyVal = (basicInfo.key || '').trim();
  const keyTouched = keyVal.length > 0;
  const keyValid = !keyTouched || isValidProcessKey(keyVal);
  const isExisting = !!(record?.processKey || record?.key);
  return (
    <div className="pdv2-basic-panel">
      <div className="pdv2-basic-card">
        <h3 className="pdv2-basic-card-title">流程基本信息</h3>

        {/* 流程标识未填写提示（仅新建流程且用户尚未填写 key 时） */}
        {!isExisting && !keyTouched && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 16,
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 6,
            color: '#ad6800',
            fontSize: 13,
            lineHeight: 1.7,
          }}>
            <b>💡 请填写流程标识</b>：填写合法标识后，系统将自动保存您的编辑内容；发布前也必须先填写流程标识。
            <div style={{ marginTop: 4, color: '#8c6e00' }}>
              示例：<code>leave_apply</code>、<code>purchase_v2</code>、<code>_my_flow</code>（必须以字母或下划线开头）
            </div>
          </div>
        )}

        {/* 流程标识不合法横幅提示 */}
        {keyTouched && !keyValid && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 16,
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 6,
            color: '#cf1322',
            fontSize: 13,
            lineHeight: 1.7,
          }}>
            <b>⚠ 流程标识“{keyVal}”不合法</b>，保存 / 发布将被拒绝，请按以下规则修改：
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              <li>必须以字母或下划线开头（不能以数字开头）</li>
              <li>只能包含字母、数字、下划线、连字符和点</li>
              <li>长度不超过 64 个字符</li>
            </ul>
            <div style={{ marginTop: 4, color: '#595959' }}>
              示例：<code>leave_apply</code>、<code>purchase_v2</code>、<code>_my_flow</code>
            </div>
          </div>
        )}
        <Form layout="vertical" className="pdv2-basic-form">
          <Form.Item label="流程名称">
            <Input
              value={basicInfo.name}
              onChange={(e) => setBasicInfo((p) => ({ ...p, name: e.target.value }))}
              placeholder="请输入流程名称"
            />
          </Form.Item>
          <Form.Item
            label="流程标识"
            validateStatus={keyValid ? '' : 'error'}
            help={
              isExisting
                ? '已有流程的标识不可修改'
                : keyValid
                  ? '必须以字母或下划线开头，只能包含字母、数字、下划线、连字符和点（例如 leave_apply）'
                  : `“${keyVal}”不合法：BPMN 要求以字母或下划线开头，不能以数字开头`
            }
          >
            <Input
              value={basicInfo.key}
              onChange={(e) => setBasicInfo((p) => ({ ...p, key: e.target.value }))}
              placeholder="英文标识，如 leave_apply"
              disabled={isExisting} // 已有流程不允许修改 key
            />
          </Form.Item>
          <Form.Item label="流程分组">
            <Select
              value={basicInfo.group}
              onChange={(v) => setBasicInfo((p) => ({ ...p, group: v }))}
              placeholder="请选择分组"
              options={[
                { value: 'oa', label: 'OA办公' },
                { value: 'hr', label: '人事管理' },
                { value: 'finance', label: '财务审批' },
                { value: 'other', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item label="流程说明">
            <Input.TextArea
              value={basicInfo.description}
              onChange={(e) => setBasicInfo((p) => ({ ...p, description: e.target.value }))}
              placeholder="简要描述该流程的用途"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="流程图标">
            <Input
              value={basicInfo.icon}
              onChange={(e) => setBasicInfo((p) => ({ ...p, icon: e.target.value }))}
              placeholder="图标名称或URL"
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

/* ─── 更多设置 Tab ─── */
function MoreSettingsPanel({ settings, setSettings }) {
  return (
    <div className="pdv2-settings-panel">
      <div className="pdv2-settings-card">
        <h3 className="pdv2-basic-card-title">高级设置</h3>
        <Form layout="vertical" className="pdv2-basic-form">
          <Form.Item label="允许撤回">
            <Switch
              checked={settings.allowRevoke}
              onChange={(v) => setSettings((p) => ({ ...p, allowRevoke: v }))}
            />
          </Form.Item>
          <Form.Item label="允许催办">
            <Switch
              checked={settings.allowUrge}
              onChange={(v) => setSettings((p) => ({ ...p, allowUrge: v }))}
            />
          </Form.Item>
          <Form.Item label="自动去重">
            <Switch
              checked={settings.autoDedup}
              onChange={(v) => setSettings((p) => ({ ...p, autoDedup: v }))}
            />
          </Form.Item>
          <Form.Item label="审批超时（小时）">
            <InputNumber
              min={0}
              value={settings.timeoutHours}
              onChange={(v) => setSettings((p) => ({ ...p, timeoutHours: v }))}
              placeholder="0 表示不限制"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="通知方式">
            <Select
              mode="multiple"
              value={settings.notifyChannels}
              onChange={(v) => setSettings((p) => ({ ...p, notifyChannels: v }))}
              placeholder="请选择通知方式"
              options={[
                { value: 'app', label: '站内消息' },
                { value: 'email', label: '邮件' },
                { value: 'sms', label: '短信' },
                { value: 'wechat', label: '企业微信' },
              ]}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default function ProcessDesignerV2({ record, onClose }) {
  const [tab, setTab] = useState('basic');
  const [schema, setSchema] = useState([]);
  const [flow, setFlow] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  // 历史版本列表（用于顶部“草稿 / 历史版本”下拉）
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  // 预览状态：previewVersion=null 表示正常编辑草稿；非空表示正在预览该版本（只读）
  const [previewVersion, setPreviewVersion] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null); // { version, publishTime, createBy }
  const isPreviewing = previewVersion !== null;
  // 进入预览前备份的草稿快照（退出预览时恢复）
  const draftBackupRef = useRef(null);
  const [basicInfo, setBasicInfo] = useState({
    name: record?.name || '',
    key: record?.processKey || record?.key || '',
    group: record?.processGroup || record?.group || '',
    description: record?.description || '',
    icon: record?.icon || '',
  });
  const [settings, setSettings] = useState({
    allowRevoke: true,
    allowUrge: true,
    autoDedup: false,
    timeoutHours: 0,
    notifyChannels: ['app'],
  });

  // 防止初始空值覆盖后端数据的标记
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  // 用 ref 持有最新数据，避免 useCallback 依赖频繁变化
  const dataRef = useRef({ schema: [], flow: null, basicInfo: {}, settings: {} });
  dataRef.current = { schema, flow, basicInfo, settings };

  // ── 统一的 processKey 计算 ──
  // 原则：
  // - 不合法就直接拒绝（避免多个草稿被改写成同一 key 导致 duplicate）
  // - 新建流程 + 用户未填 key：返回 null（不抢先入库，避免产生 processV2 幽灵草稿）
  // - 编辑已有流程：强制使用 record.processKey（前端已禁用输入）
  const computeSaveKey = useCallback(() => {
    // 编辑已有流程：始终使用记录中已确定的 processKey
    if (record?.processKey || record?.key) {
      return record.processKey || record.key;
    }
    // 新建流程：用户必须明确填写 key，否则不保存（返回 null，autoSave/flushSave 都会跳过）
    const userKey = (basicInfo.key || '').trim();
    if (!userKey) return null;
    if (!isValidProcessKey(userKey)) return null; // 调用方看到 null 应拦截
    return userKey;
  }, [record?.processKey, record?.key, basicInfo.key]);

  // ─── 从后端加载配置 ───
  useEffect(() => {
    // 兼容 processKey（新API）和 key（旧数据）两种字段名
    const key = record?.processKey || record?.key || basicInfo.key;
    if (!key) {
      // 新建流程，使用默认值
      setFlow(createDefaultFlow());
      setDataLoaded(true);
      return;
    }
    const pk = key.replace(/[^a-zA-Z0-9_]/g, '_');
    processConfigApi.getByKey(pk).then((data) => {
      if (data) {
        // 加载表单 schema
        if (data.formSchemaJson) {
          try {
            setSchema(JSON.parse(data.formSchemaJson));
          } catch { /* ignore */ }
        }
        // 加载流程 JSON
        if (data.flowJson) {
          try {
            setFlow(JSON.parse(data.flowJson));
          } catch { /* ignore */ }
        } else {
          setFlow(createDefaultFlow());
        }
        // 加载基础信息（兼容 processKey/key 两种来源）
        if (data.name) setBasicInfo((p) => ({ ...p, name: data.name, key: data.processKey || p.key }));
        if (data.processGroup) setBasicInfo((p) => ({ ...p, group: data.processGroup }));
        if (data.description) setBasicInfo((p) => ({ ...p, description: data.description }));
        if (data.icon) setBasicInfo((p) => ({ ...p, icon: data.icon }));
        // 加载高级设置
        if (data.settingsJson) {
          try {
            setSettings(JSON.parse(data.settingsJson));
          } catch { /* ignore */ }
        }
      } else {
        setFlow(createDefaultFlow());
      }
      setDataLoaded(true);
    }).catch((err) => {
      console.error('加载配置失败:', err);
      setFlow(createDefaultFlow());
      setDataLoaded(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 立即保存（flush）：用于离开前、发布前确保数据落数据库 ───
  // 返回 true=已保存；false=跳过（key 不合法 / 未加载 / 无变化）
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!dataLoaded) return false;
    if (isPreviewing) return false; // 预览模式不保存
    const pk = computeSaveKey();
    if (!pk) {
      // processKey 不合法，不发起请求，避免静默归一到同一 key 导致 duplicate
      setSaveStatus('error');
      return false;
    }
    const { schema: s, flow: f, basicInfo: bi, settings: st } = dataRef.current;
    const payload = {
      processKey: pk,
      name: bi.name || pk,
      processGroup: bi.group,
      description: bi.description,
      icon: bi.icon,
      formSchemaJson: JSON.stringify(s),
      flowJson: f ? JSON.stringify(f) : null,
      settingsJson: JSON.stringify(st),
    };
    const k = JSON.stringify(payload);
    if (k === lastSavedRef.current) return true; // 已保存，跳过
    lastSavedRef.current = k;
    setSaveStatus('saving');
    try {
      await processConfigApi.save(payload);
      setSaveStatus('saved');
      // 3 秒后恢复 idle
      setTimeout(() => setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 3000);
      return true;
    } catch (err) {
      console.error('保存失败:', err);
      setSaveStatus('error');
      // 将错误详情也打印出来，便于定位 duplicate / 网络等具体原因
      if (err?.message) {
        // eslint-disable-next-line no-console
        console.error('[saveDraft error]', err.message);
      }
      return false;
    }
  }, [computeSaveKey, dataLoaded]);

  // ─── 防抖自动保存 ───
  useEffect(() => {
    if (!dataLoaded) return;
    if (isPreviewing) return; // 预览模式下跳过 autoSave
    const pk = computeSaveKey();
    if (!pk) {
      // 非法 key：不发起请求，只把状态置为 error 提示用户
      setSaveStatus('error');
      return;
    }
    // key 合法时自动清除之前的错误提示（避免用户修改后仍然显示“保存失败”）
    setSaveStatus((prev) => (prev === 'error' ? 'idle' : prev));
    // 清除上一次 timer
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { schema: s, flow: f, basicInfo: bi, settings: st } = dataRef.current;
      const payload = {
        processKey: pk,
        name: bi.name || pk,
        processGroup: bi.group,
        description: bi.description,
        icon: bi.icon,
        formSchemaJson: JSON.stringify(s),
        flowJson: f ? JSON.stringify(f) : null,
        settingsJson: JSON.stringify(st),
      };
      const k = JSON.stringify(payload);
      if (k === lastSavedRef.current) return; // 与上次保存内容相同
      lastSavedRef.current = k;
      setSaveStatus('saving');
      processConfigApi.save(payload).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 3000);
      }).catch((err) => {
        console.error('自动保存失败:', err);
        if (err?.message) console.error('[autoSave error]', err.message);
        setSaveStatus('error');
      });
    }, 800); // 800ms 防抖
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [computeSaveKey, dataLoaded, schema, flow, basicInfo, settings, isPreviewing]);

  // ─── 发布前先刷存，再发布 ───
  const handlePublish = useCallback(async () => {
    if (!flow || (!flow.next && !flow.branches)) {
      message.warning('请先设计流程后再发布');
      return;
    }

    // ── 前端预校验：流程结构 + 节点配置 + processKey 合法性 ──
    const pkForPublish = computeSaveKey();
    if (!pkForPublish) {
      Modal.error({
        title: '流程标识不合法',
        zIndex: 1200,
        content: (
          <div style={{ lineHeight: 1.8 }}>
            流程标识 <b style={{ color: '#ff4d4f' }}>“{(basicInfo.key || '').trim()}”</b> 不符合 BPMN 规范：
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>必须以字母或下划线开头（不能以数字开头）</li>
              <li>只能包含字母、数字、下划线、连字符和点</li>
              <li>长度不超过 64 个字符</li>
            </ul>
            示例：<code>leave_apply</code>、<code>purchase_v2</code>、<code>_my_flow</code>
          </div>
        ),
        okText: '去修改',
        onOk: () => setTab('basic'),
      });
      return;
    }

    // 流程结构 / 节点配置校验（含 processKey）
    const { errors } = validateFlow(flow, schema, pkForPublish);
    const hardErrors = errors.filter((e) => e.severity === 'error');
    const warnings = errors.filter((e) => e.severity === 'warning');
    if (hardErrors.length > 0) {
      Modal.error({
        title: `流程校验未通过（共 ${hardErrors.length} 项错误）`,
        zIndex: 1200,
        width: 560,
        content: (
          <div style={{ maxHeight: 360, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {formatErrors(hardErrors)}
            {warnings.length > 0 && (
              <>
                {'\n\n'}
                <span style={{ color: '#faad14' }}>另有 {warnings.length} 项警告：</span>
                {'\n'}
                {formatErrors(warnings)}
              </>
            )}
          </div>
        ),
        okText: '我知道了',
      });
      return;
    }
    if (warnings.length > 0) {
      // 仅 warning，提示但允许发布
      message.warning(`存在 ${warnings.length} 项警告，建议检查：${warnings[0].message}`);
    }

    const processName = basicInfo.name || record?.name || '流程V2';

    // 弹窗让用户确认名称
    let deployName = processName;
    try {
      deployName = await new Promise((resolve, reject) => {
        let inputVal = processName;
        Modal.confirm({
          title: '发布流程',
          zIndex: 1200,
          content: (
            <div style={{ marginTop: 12 }}>
              <span>请输入流程名称：</span>
              <Input
                defaultValue={processName}
                style={{ marginTop: 8 }}
                onChange={(e) => { inputVal = e.target.value; }}
              />
            </div>
          ),
          okText: '发布',
          cancelText: '取消',
          onOk: () => resolve(inputVal),
          onCancel: () => reject('cancel'),
        });
      });
    } catch {
      return;
    }

    setPublishing(true);
    try {
      // 先刷存待保存的数据
      await flushSave();

      const bpmnXml = flowToBpmnXml(flow, pkForPublish, deployName);
      if (!bpmnXml) {
        message.error('流程设计数据异常，无法生成 BPMN，请检查流程是否完整');
        return;
      }

      // 调用后端发布 API（一次调用完成：快照 + 部署 BPMN + 更新版本号）
      const result = await processConfigApi.publish({
        processKey: pkForPublish,
        deployName,
        bpmnXml,
        name: basicInfo.name || processName,
        processGroup: basicInfo.group,
        description: basicInfo.description,
        icon: basicInfo.icon,
        formSchemaJson: JSON.stringify(schema),
        flowJson: JSON.stringify(flow),
        settingsJson: JSON.stringify(settings),
      });

      message.success(`发布成功！版本 v${result.latestVersion}`);
      // 刷新版本列表（设计器即将关闭，此处主要为逻辑完整）
      loadVersions();
      // 延迟一下让用户看到成功提示，然后关闭设计页面（父组件 ProcessManagement 的 onClose 会刷新列表）
      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (err) {
      if (err !== 'cancel') {
        message.error('发布失败: ' + (err.message || '未知错误'));
      }
    } finally {
      setPublishing(false);
    }
  }, [flow, schema, record, onClose, computeSaveKey, basicInfo, settings, flushSave]);

  // ─── 离开前保存（同步刷存） ───
  const handleBack = useCallback(async () => {
    // 先刷存待保存的数据
    await flushSave();
    onClose();
  }, [flushSave, onClose]);

  // ─── 页面卸载前保存（浏览器 beforeunload） ───
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isPreviewing) return; // 预览模式不保存快照
      const pk = computeSaveKey();
      if (dataLoaded && pk && lastSavedRef.current !== null) {
        const { schema: s, flow: f, basicInfo: bi, settings: st } = dataRef.current;
        const payload = {
          processKey: pk,
          name: bi.name || pk,
          processGroup: bi.group,
          description: bi.description,
          icon: bi.icon,
          formSchemaJson: JSON.stringify(s),
          flowJson: f ? JSON.stringify(f) : null,
          settingsJson: JSON.stringify(st),
        };
        const k = JSON.stringify(payload);
        if (k !== lastSavedRef.current) {
          navigator.sendBeacon?.(
            '/api/workflow/process-config/save',
            new Blob([JSON.stringify(payload)], { type: 'application/json' }),
          );
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dataLoaded, computeSaveKey, isPreviewing]);

  // ─── 加载版本历史（仅当已有 processKey 时） ───
  const loadVersions = useCallback(async () => {
    const pk = record?.processKey || record?.key;
    if (!pk) {
      setVersions([]);
      return;
    }
    setVersionsLoading(true);
    try {
      const list = await processConfigApi.listVersions(pk);
      setVersions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('加载版本列表失败:', err);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  }, [record?.processKey, record?.key, record]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // 回滚到指定版本：后端覆盖主表 → 前端重新加载草稿 → 刷新版本列表
  const handleRollback = useCallback(async (version) => {
    const pk = record?.processKey || record?.key;
    if (!pk) throw new Error('当前流程没有已保存的标识');
    const newDraft = await processConfigApi.rollback(pk, version);
    // 覆盖草稿状态
    if (newDraft.formSchemaJson) {
      try { setSchema(JSON.parse(newDraft.formSchemaJson)); } catch { /* ignore */ }
    } else {
      setSchema([]);
    }
    if (newDraft.flowJson) {
      try { setFlow(JSON.parse(newDraft.flowJson)); } catch { /* ignore */ }
    } else {
      setFlow(createDefaultFlow());
    }
    if (newDraft.settingsJson) {
      try { setSettings(JSON.parse(newDraft.settingsJson)); } catch { /* ignore */ }
    }
    // 清除“上次已保存”标记，让下一次自动保存正常触发
    lastSavedRef.current = null;
    // 刷新版本列表（latestVersion 可能不变，但 updateTime 已变）
    await loadVersions();
    setSaveStatus('idle');
  }, [record?.processKey, record?.key, loadVersions]);

  // 预览指定版本：备份当前草稿 → 加载版本快照 → 替换 state（进入只读浏览模式）
  const handlePreviewVersion = useCallback(async (version) => {
    const pk = record?.processKey || record?.key;
    if (!pk) {
      message.warning('当前流程没有已保存的标识，无法预览');
      return;
    }
    try {
      const vo = await processConfigApi.getVersion(pk, version);
      if (!vo) {
        message.error('未找到该版本快照');
        return;
      }
      // 首次进入预览：备份当前草稿（退出时恢复）
      if (!isPreviewing) {
        draftBackupRef.current = {
          schema: dataRef.current.schema,
          flow: dataRef.current.flow,
          basicInfo: dataRef.current.basicInfo,
          settings: dataRef.current.settings,
        };
      }
      // 取消待定保存任务，防止版本快照被当草稿入库
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      // 替换为该版本快照
      try { setSchema(vo.formSchemaJson ? JSON.parse(vo.formSchemaJson) : []); } catch { setSchema([]); }
      try { setFlow(vo.flowJson ? JSON.parse(vo.flowJson) : createDefaultFlow()); } catch { setFlow(createDefaultFlow()); }
      try { setSettings(vo.settingsJson ? JSON.parse(vo.settingsJson) : {}); } catch { /* ignore */ }
      if (vo.name) setBasicInfo((p) => ({ ...p, name: vo.name }));
      setPreviewVersion(version);
      setPreviewMeta({
        version,
        publishTime: vo.publishTime || vo.createTime,
        createBy: vo.createBy,
      });
      setSaveStatus('idle');
    } catch (err) {
      message.error('加载版本快照失败：' + (err?.message || '未知错误'));
    }
  }, [record?.processKey, record?.key, isPreviewing]);

  // 退出预览：恢复进入预览前的草稿快照
  const exitPreview = useCallback(() => {
    const bak = draftBackupRef.current;
    if (bak) {
      setSchema(bak.schema);
      setFlow(bak.flow);
      setBasicInfo(bak.basicInfo);
      setSettings(bak.settings);
    }
    draftBackupRef.current = null;
    setPreviewVersion(null);
    setPreviewMeta(null);
    // 退出后不会立刻触发 autoSave（数据与备份前一致、lastSavedRef 也未变）
  }, []);

  // 复制为草稿：将当前预览的版本覆盖到草稿（同 rollback）→ 退出预览 → 进入可编辑状态
  const handleCopyAsDraft = useCallback(async () => {
    if (!isPreviewing) return;
    const version = previewVersion;
    const pk = record?.processKey || record?.key;
    if (!pk) return;
    try {
      // 复用 rollback 接口：后端会把该版本复制到主表（状态 DRAFT）
      const newDraft = await processConfigApi.rollback(pk, version);
      // 不走 exitPreview（不恢复备份），直接用后端返回的新草稿覆盖并退出预览
      draftBackupRef.current = null;
      setPreviewVersion(null);
      setPreviewMeta(null);
      try { setSchema(newDraft.formSchemaJson ? JSON.parse(newDraft.formSchemaJson) : []); } catch { setSchema([]); }
      try { setFlow(newDraft.flowJson ? JSON.parse(newDraft.flowJson) : createDefaultFlow()); } catch { setFlow(createDefaultFlow()); }
      try { setSettings(newDraft.settingsJson ? JSON.parse(newDraft.settingsJson) : {}); } catch { /* ignore */ }
      lastSavedRef.current = null;
      await loadVersions();
      setSaveStatus('idle');
      message.success(`已以版本 v${version} 复制为新草稿，可继续编辑`);
    } catch (err) {
      message.error('复制失败：' + (err?.message || '未知错误'));
    }
  }, [isPreviewing, previewVersion, record?.processKey, record?.key, loadVersions]);

  const renderContent = () => {
    switch (tab) {
      case 'basic':
        return <BasicInfoPanel record={record} basicInfo={basicInfo} setBasicInfo={setBasicInfo} />;
      case 'form':
        return <FormDesignerV2 value={schema} onChange={setSchema} />;
      case 'flow':
        return flow ? <FlowDesignerV2 value={flow} onChange={setFlow} formSchema={schema} /> : null;
      case 'settings':
        return <MoreSettingsPanel settings={settings} setSettings={setSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="pdv2-container">
      <div className="pdv2-header">
        <div className="pdv2-header-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} className="pdv2-back-btn" />
          <div className="pdv2-header-info">
            <span className="pdv2-header-title">{basicInfo.name || record?.name || '未命名流程'}</span>
            <VersionHistoryPopover
              draft={{
                createBy: record?.createBy || basicInfo.key || '草稿',
                createTime: record?.createTime,
                updateTime: record?.updateTime,
              }}
              versions={versions}
              latestVersion={record?.latestVersion || 0}
              saveStatus={saveStatus}
              previewMeta={previewMeta}
              onRollback={handleRollback}
              onPreview={handlePreviewVersion}
              onExitPreview={exitPreview}
              loading={versionsLoading}
            />
          </div>
        </div>
        <div className="pdv2-header-center">
          {STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`pdv2-step${tab === step.key ? ' active' : ''}`}
              onClick={() => setTab(step.key)}
            >
              <span className="pdv2-step-num">{idx + 1}</span>
              <span className="pdv2-step-label">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="pdv2-header-right">
          <Button onClick={() => message.info('预览功能开发中')}>预览</Button>
          {!isPreviewing && (
            <Tooltip title={saveStatus === 'saving' ? '正在保存...' : saveStatus === 'error' ? '保存失败' : '所有改动已自动保存'}>
              <span style={{ marginRight: 8, fontSize: 12, color: saveStatus === 'error' ? '#ff4d4f' : '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {saveStatus === 'saving' ? <CloudSyncOutlined spin /> : <CloudOutlined />}
                {saveStatus === 'saving' ? '保存中' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败' : ''}
              </span>
            </Tooltip>
          )}
          <Button
            type="primary"
            loading={publishing}
            onClick={handlePublish}
            disabled={isPreviewing}
            title={isPreviewing ? '预览模式不可发布，请先复制为草稿' : ''}
          >
            发布
          </Button>
        </div>
      </div>
      {/* 预览模式只读横幅 */}
      {isPreviewing && (
        <div className="pdv2-preview-banner">
          该版本仅支持查看，点击
          <a className="pdv2-preview-link" onClick={handleCopyAsDraft}>&nbsp;复制为草稿&nbsp;</a>
          即可修改
        </div>
      )}
      <div className={`pdv2-body${isPreviewing ? ' pdv2-body--readonly' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
}
