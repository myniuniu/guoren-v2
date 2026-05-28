import { useState, useMemo, useRef } from 'react';
import {
  Button,
  Radio,
  Checkbox,
  Select,
  Tooltip,
  Tag,
  Input,
  Modal,
  message,
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import MemberPickerModal from './MemberPickerModal';
import { validateNodeConfig } from '../utils/flowValidator';
import './ApprovalConfigPanel.css';

/** 审批人类型选项（共 12 种） */
const APPROVER_OPTIONS = [
  { value: 'leader', label: '上级' },
  { value: 'deptHead', label: '部门负责人', tip: '指审批人所属部门的负责人' },
  { value: 'role', label: '角色', tip: '指拥有指定角色的成员' },
  { value: 'userGroup', label: '用户组' },
  { value: 'specific', label: '指定成员' },
  { value: 'submitterPick', label: '提交人自选' },
  { value: 'submitterSelf', label: '提交人本人', tip: '由提交人自己审批' },
  { value: 'nodeApprover', label: '节点审批人', disabled: true, tip: '当前流程暂不可用' },
  { value: 'multiLeader', label: '连续多级上级' },
  { value: 'multiDeptHead', label: '连续多级部门负责人' },
  { value: 'formContact', label: '表单内联系人' },
  { value: 'formDept', label: '表单内部门', tip: '表单中选择的部门作为审批人' },
];

/** 上级层级选项 */
const LEADER_LEVELS = [
  '直属上级',
  '第二级上级',
  '第三级上级',
  '第四级上级',
  '第五级上级',
];

/** 部门负责人层级选项（两种模式） */
const DEPT_HEAD_LEVELS_UP = [
  '直属部门负责人',
  '直属部门负责人加 1 级部门',
  '直属部门负责人加 2 级部门',
  '直属部门负责人加 3 级部门',
  '直属部门负责人加 4 级部门',
  '直属部门负责人加 5 级部门',
  '直属部门负责人加 6 级部门',
  '直属部门负责人加 7 级部门',
];
const DEPT_HEAD_LEVELS_DOWN = [
  '最高部门负责人',
  '最高部门负责人减 1 级部门',
  '最高部门负责人减 2 级部门',
  '最高部门负责人减 3 级部门',
  '最高部门负责人减 4 级部门',
  '最高部门负责人减 5 级部门',
  '最高部门负责人减 6 级部门',
  '最高部门负责人减 7 级部门',
];

/** 连续多级上级层级选项（两种模式） */
const MULTI_LEADER_LEVELS_UP = [
  '直属上级',
  '直属上级加 1 级',
  '直属上级加 2 级',
  '直属上级加 3 级',
  '直属上级加 4 级',
  '直属上级加 5 级',
  '直属上级加 6 级',
  '直属上级加 7 级',
];
const MULTI_LEADER_LEVELS_DOWN = [
  '最高上级',
  '最高上级减 1 级',
  '最高上级减 2 级',
  '最高上级减 3 级',
  '最高上级减 4 级',
  '最高上级减 5 级',
  '最高上级减 6 级',
  '最高上级减 7 级',
];

/** 连续多级部门负责人层级选项（两种模式） */
const MULTI_DEPT_HEAD_LEVELS_UP = [
  '直属部门负责人',
  '直属部门负责人加 1 级部门',
  '直属部门负责人加 2 级部门',
  '直属部门负责人加 3 级部门',
  '直属部门负责人加 4 级部门',
  '直属部门负责人加 5 级部门',
  '直属部门负责人加 6 级部门',
  '直属部门负责人加 7 级部门',
];
const MULTI_DEPT_HEAD_LEVELS_DOWN = [
  '最高部门负责人',
  '最高部门负责人减 1 级部门',
  '最高部门负责人减 2 级部门',
  '最高部门负责人减 3 级部门',
  '最高部门负责人减 4 级部门',
  '最高部门负责人减 5 级部门',
  '最高部门负责人减 6 级部门',
  '最高部门负责人减 7 级部门',
];

/** 系统角色列表（mock，后续从后端 /api/system/roles 接口获取） */
const SYSTEM_ROLES = [
  { value: 'managers', label: 'managers（管理者）' },
  { value: 'hr', label: 'hr（人力资源）' },
  { value: 'finance', label: 'finance（财务）' },
  { value: 'admin', label: 'admin（管理员）' },
  { value: 'dev', label: 'dev（研发）' },
];

/** 系统用户组列表（mock，后续从后端 /api/system/groups 接口获取） */
const SYSTEM_USER_GROUPS = [
  { value: 'dev-team', label: 'dev-team（研发组）' },
  { value: 'pm-team', label: 'pm-team（产品组）' },
  { value: 'design-team', label: 'design-team（设计组）' },
  { value: 'ops-team', label: 'ops-team（运维组）' },
  { value: 'qa-team', label: 'qa-team（测试组）' },
];

/** 表单字段示例（后续可从表单设计器 schema 动态读取） */
const FORM_FIELD_OPTIONS = [
  { value: 'contact', label: '联系人字段' },
  { value: 'dept', label: '部门字段' },
];

/** 表单字段类型 → emoji 图标 */
const FIELD_TYPE_ICON = {
  input: '📝',
  textarea: '📄',
  alert: 'ℹ️',
  inputNumber: '🔢',
  radio: '🔘',
  checkbox: '☑️',
  datePicker: '📅',
  dateRange: '📆',
  tableForm: '📊',
  upload: '📎',
};

/** 生成审批人组 id */
function genApproverId() {
  return 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/** 默认审批人组 */
function defaultApprover() {
  return { id: genApproverId(), type: 'leader', level: '直属上级' };
}

export default function ApprovalConfigPanel({ node, onSave, onCancel, formSchema }) {
  // —— 本地草稿（点击"保存"才真正回写） ——
  const [name, setName] = useState(node.name || '审批');
  const [editingName, setEditingName] = useState(false);

  const cfg = node.config || {};
  const [approvalType, setApprovalType] = useState(cfg.approvalType || 'manual');
  const [excludeFromStats, setExcludeFromStats] = useState(!!cfg.excludeFromStats);
  const [activeTab, setActiveTab] = useState('approver');
  const [approvers, setApprovers] = useState(
    Array.isArray(cfg.approvers) && cfg.approvers.length > 0
      ? cfg.approvers
      : [defaultApprover()],
  );
  const [emptyPolicy, setEmptyPolicy] = useState(cfg.emptyPolicy || 'autoPass');
  const [sameAsSubmitter, setSameAsSubmitter] = useState(
    cfg.sameAsSubmitter || 'selfApprove',
  );
  const [ccUsers, setCcUsers] = useState(
    Array.isArray(cfg.ccUsers) ? cfg.ccUsers : [],
  );
  // —— 操作权限 ——
  const [allowTransfer, setAllowTransfer] = useState(cfg.allowTransfer !== false);
  const [allowAddSign, setAllowAddSign] = useState(cfg.allowAddSign !== false);
  const [allowReject, setAllowReject] = useState(cfg.allowReject !== false);
  const [rejectScope, setRejectScope] = useState(cfg.rejectScope || 'unlimited');
  const [requireSignature, setRequireSignature] = useState(!!cfg.requireSignature);
  const [requireComment, setRequireComment] = useState(!!cfg.requireComment);

  // —— 成员选择弹窗 ——
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const pickerForRef = useRef(null); // ref 持有最新值，避免 confirmMemberPicker 闭包过期
  const [pickerTick, setPickerTick] = useState(0); // 每次打开递增，用作 MemberPickerModal 的 key，强制重置状态

  // —— 指定成员列表（兼容旧字符串格式） ——
  const parseMembers = (a) => {
    if (Array.isArray(a?.members)) return a.members;
    if (typeof a?.members === 'string' && a.members) {
      return a.members.split(/[，,]/).map((n) => ({ id: n, name: n.trim(), dept: '' })).filter((m) => m.name);
    }
    return [];
  };
  const getMembersOf = (a) => parseMembers(a);

  // —— 表单权限 ——
  const [formPerms, setFormPerms] = useState(cfg.formPerms || {});

  // 根据 formSchema 生成字段列表（含权限合并）
  const formFields = useMemo(() => {
    const fields = Array.isArray(formSchema) ? formSchema : [];
    return fields.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label || f.type,
      // 优先读已保存的权限，否则默认 可读=true, 编辑=false
      readable: formPerms[f.id]?.readable !== false,
      editable: formPerms[f.id]?.editable === true,
    }));
  }, [formSchema, formPerms]);

  const toggleFormPerm = (fieldId, key) => {
    setFormPerms((prev) => {
      const cur = prev[fieldId];
      const readable = cur?.readable !== false;
      const editable = cur?.editable === true;
      const newVal = key === 'readable' ? !readable : !editable;
      // 取消可读时联动取消编辑
      if (key === 'readable' && !newVal) {
        return { ...prev, [fieldId]: { readable: false, editable: false } };
      }
      return { ...prev, [fieldId]: { readable, editable, [key]: newVal } };
    });
  };

  // 审批人组操作
  const updateApprover = (id, patch) => {
    setApprovers((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const addApprover = () => setApprovers((prev) => [...prev, defaultApprover()]);
  const removeApprover = (id) => {
    if (approvers.length <= 1) {
      message.info('至少保留一位审批人');
      return;
    }
    setApprovers((prev) => prev.filter((a) => a.id !== id));
  };

  const openMemberPicker = (approverId) => {
    pickerForRef.current = approverId;
    setPickerFor(approverId);
    setPickerTick((t) => t + 1);
    setPickerOpen(true);
  };

  const confirmMemberPicker = (picked) => {
    const targetId = pickerForRef.current; // 用 ref 读取，永不过期
    if (!targetId) return;
    updateApprover(targetId, { members: picked });
    pickerForRef.current = null;
    setPickerFor(null);
  };

  // —— 抄送人操作 ——
  const handleAddCc = () => {
    let val = '';
    Modal.confirm({
      title: '添加抄送人',
      icon: null,
      okText: '确定',
      cancelText: '取消',
      zIndex: 1300,
      content: (
        <Input
          placeholder="请输入抄送人名称（多个用逗号分隔）"
          onChange={(e) => {
            val = e.target.value;
          }}
          autoFocus
        />
      ),
      onOk: () => {
        const list = (val || '')
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (!list.length) return;
        setCcUsers((prev) => {
          const next = [...prev, ...list];
          if (next.length > 100) {
            message.warning('抄送人数最多支持100人');
            return next.slice(0, 100);
          }
          return next;
        });
      },
    });
  };
  const removeCc = (idx) => setCcUsers((prev) => prev.filter((_, i) => i !== idx));

  // —— 保存 ——
  const handleSave = () => {
    // 组装出即将保存的节点数据用于校验
    const draftNode = {
      ...node,
      name: name || '审批',
      config: {
        ...node.config,
        approvalType,
        excludeFromStats,
        approvers,
        emptyPolicy,
        sameAsSubmitter,
        ccUsers,
        formPerms,
        allowTransfer,
        allowAddSign,
        allowReject,
        rejectScope,
        requireSignature,
        requireComment,
      },
    };
    const { errors } = validateNodeConfig(draftNode);
    const hardErrors = errors.filter((e) => e.severity === 'error');
    const warnings = errors.filter((e) => e.severity === 'warning');
    if (hardErrors.length > 0) {
      // 拒绝保存，列出问题项
      message.error({
        content: (
          <div style={{ maxWidth: 380, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>节点配置不完整，请修复：</div>
            {hardErrors.map((e, i) => (
              <div key={i}>• {e.message}</div>
            ))}
          </div>
        ),
        duration: 4,
      });
      return;
    }
    if (warnings.length > 0) {
      // 仅提示，不拦截
      message.warning(warnings[0].message);
    }

    onSave({
      ...draftNode,
      config: {
        ...draftNode.config,
        // 兼容旧字段，保持 BPMN 转换不报错
        approverType: approvers[0]?.type === 'role' ? 'role' :
                      approvers[0]?.type === 'specific' ? 'user' :
                      approvers[0]?.type === 'leader' ? 'leader' : 'self',
      },
    });
  };

  return (
    <div className="approval-panel">
      {/* 顶部标题 */}
      <div className="approval-panel-header">
        {editingName ? (
          <Input
            defaultValue={name}
            autoFocus
            size="small"
            style={{ width: 220 }}
            onBlur={(e) => {
              setName(e.target.value || '审批');
              setEditingName(false);
            }}
            onPressEnter={(e) => {
              setName(e.target.value || '审批');
              setEditingName(false);
            }}
          />
        ) : (
          <>
            <span className="approval-panel-title">{name}</span>
            <EditOutlined
              className="approval-panel-title-edit"
              onClick={() => setEditingName(true)}
            />
          </>
        )}
      </div>

      {/* 主体 */}
      <div className="approval-panel-body">
        {/* 审批类型 */}
        <div className="approval-section">
          <div className="approval-section-row">
            <span className="approval-label">审批类型</span>
            <Checkbox
              checked={excludeFromStats}
              onChange={(e) => setExcludeFromStats(e.target.checked)}
            >
              不计入审批效率统计
            </Checkbox>
          </div>
          <Radio.Group
            className="approval-type-radio"
            value={approvalType}
            onChange={(e) => setApprovalType(e.target.value)}
          >
            <Radio value="manual">人工审批</Radio>
            <Radio value="autoApprove">自动通过</Radio>
            <Radio value="autoReject">自动拒绝</Radio>
          </Radio.Group>
        </div>

        {/* 仅人工审批显示后续配置 */}
        {approvalType === 'manual' && (
          <>
            {/* Tab 切换 */}
            <div className="approval-tabs">
              <div
                className={`approval-tab ${activeTab === 'approver' ? 'active' : ''}`}
                onClick={() => setActiveTab('approver')}
              >
                设置审批人
              </div>
              <div
                className={`approval-tab ${activeTab === 'formPerms' ? 'active' : ''}`}
                onClick={() => setActiveTab('formPerms')}
              >
                表单权限
              </div>
              <div
                className={`approval-tab ${activeTab === 'opPerms' ? 'active' : ''}`}
                onClick={() => setActiveTab('opPerms')}
              >
                操作权限
              </div>
            </div>

            {/* —— Tab1：设置审批人 —— */}
            {activeTab === 'approver' && (
              <>
                {approvers.map((a, idx) => (
                  <div className="approver-card" key={a.id}>
                    <div className="approver-card-header">
                      <span className="approver-card-title">
                        审批人{approvers.length > 1 ? ` ${idx + 1}` : ''}
                      </span>
                      {approvers.length > 1 && (
                        <CloseOutlined
                          className="approver-card-close"
                          onClick={() => removeApprover(a.id)}
                        />
                      )}
                    </div>
                    <div className="approver-type-grid">
                      <Radio.Group
                        value={a.type}
                        onChange={(e) => updateApprover(a.id, { type: e.target.value })}
                      >
                        {APPROVER_OPTIONS.map((opt) => (
                          <Radio
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                          >
                            {opt.label}
                            {opt.tip && (
                              <Tooltip title={opt.tip}>
                                <QuestionCircleOutlined className="approver-opt-tip" />
                              </Tooltip>
                            )}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </div>

                    {a.type === 'leader' && (
                      <>
                        <div className="approval-sub-label">
                          指定审批层级
                          <Tooltip title="选择从提交人开始向上的第几级上级">
                            <QuestionCircleOutlined className="approver-opt-tip" />
                          </Tooltip>
                        </div>
                        <div className="approver-leader-row">
                          <span className="approver-leader-prefix">提交人的</span>
                          <Select
                            value={a.level || '直属上级'}
                            onChange={(v) => updateApprover(a.id, { level: v })}
                            options={LEADER_LEVELS.map((v) => ({ value: v, label: v }))}
                            style={{ flex: 1 }}
                          />
                        </div>
                        <div className="approval-tip-inline">
                          为避免部分员工未设置上级导致流程错误，可前往{' '}
                          <a href="#feishu-admin" onClick={(e) => e.preventDefault()}>
                            飞书管理后台
                          </a>{' '}
                          检查
                        </div>
                      </>
                    )}

                    {a.type === 'role' && (
                      <div className="approver-role-block">
                        <div className="approval-sub-label">选择角色</div>
                        <Select
                          mode="multiple"
                          value={a.roles ? a.roles.split(',').filter(Boolean) : []}
                          onChange={(v) => updateApprover(a.id, { roles: v.join(',') })}
                          options={SYSTEM_ROLES}
                          placeholder="请选择角色"
                          style={{ width: '100%' }}
                          maxTagCount={3}
                        />
                        <div className="approver-role-hint">
                          拥有该角色的成员将成为此审批节点的审批人，可在系统"角色管理"中维护角色。
                        </div>
                      </div>
                    )}

                    {a.type === 'specific' && (
                      <div className="approver-specific-block">
                        {getMembersOf(a).length > 0 && (
                          <div className="approver-members-list">
                            {getMembersOf(a).map((m) => (
                              <Tag
                                key={m.id}
                                closable
                                onClose={(e) => {
                                  e.preventDefault();
                                  updateApprover(a.id, {
                                    members: getMembersOf(a).filter((x) => x.id !== m.id),
                                  });
                                }}
                                style={{ margin: '0 6px 6px 0' }}
                              >
                                <UserOutlined style={{ marginRight: 4 }} />
                                {m.name}
                                {m.dept && <span style={{ color: '#999', marginLeft: 4 }}>· {m.dept}</span>}
                              </Tag>
                            ))}
                          </div>
                        )}
                        <div className="approver-specific-title">
                          添加成员（不能超过 25 人）
                        </div>
                        <button
                          type="button"
                          className="approver-specific-add"
                          onClick={() => openMemberPicker(a.id)}
                        >
                          <PlusOutlined style={{ fontSize: 18, color: '#1677ff' }} />
                        </button>
                      </div>
                    )}

                    {/* —— 部门负责人 —— */}
                    {a.type === 'deptHead' && (
                      <div className="approver-depthead-block">
                        <div className="approval-sub-label">
                          指定审批层级
                          <Tooltip title="选择从提交人所在部门向上的第几级部门负责人">
                            <QuestionCircleOutlined className="approver-opt-tip" />
                          </Tooltip>
                        </div>
                        <div className="approver-leader-row">
                          <span className="approver-leader-prefix">提交人的</span>
                          <Select
                            value={a.deptLevel || '直属部门负责人'}
                            onChange={(v) => updateApprover(a.id, { deptLevel: v })}
                            dropdownRender={(menu) => (
                              <div>
                                <div className="approver-depthead-switch">
                                  <span className="approver-depthead-hint">
                                    {a.deptHeadMode === 'down' ? '从最高部门向下选择' : '从直属部门负责人向上选择'}
                                  </span>
                                  <a
                                    className="approver-depthead-link"
                                    onClick={() => {
                                      const newMode = a.deptHeadMode === 'down' ? 'up' : 'down';
                                      updateApprover(a.id, {
                                        deptHeadMode: newMode,
                                        deptLevel: newMode === 'down' ? '最高部门负责人' : '直属部门负责人',
                                      });
                                    }}
                                  >
                                    {a.deptHeadMode === 'down' ? '↑ 切为直属向上' : '↓ 切为最高部门向下'}
                                  </a>
                                </div>
                                {menu}
                              </div>
                            )}
                            options={(a.deptHeadMode === 'down' ? DEPT_HEAD_LEVELS_DOWN : DEPT_HEAD_LEVELS_UP).map((v) => ({ value: v, label: v }))}
                            style={{ flex: 1 }}
                          />
                        </div>
                        <div className="approval-tip-inline">
                          为避免部分员工未设置部门负责人导致流程错误，可前往{' '}
                          <a href="#feishu-admin" onClick={(e) => e.preventDefault()}>
                            飞书管理后台
                          </a>{' '}
                          检查
                        </div>
                      </div>
                    )}

                    {/* —— 用户组 —— */}
                    {a.type === 'userGroup' && (
                      <div className="approver-role-block">
                        <div className="approval-sub-label">选择用户组</div>
                        <Select
                          mode="multiple"
                          value={a.userGroups ? a.userGroups.split(',').filter(Boolean) : []}
                          onChange={(v) => updateApprover(a.id, { userGroups: v.join(',') })}
                          options={SYSTEM_USER_GROUPS}
                          placeholder="请选择用户组"
                          style={{ width: '100%' }}
                          maxTagCount={3}
                        />
                        <div className="approver-role-hint">
                          属于该用户组的成员将成为此审批节点的审批人。
                        </div>
                      </div>
                    )}

                    {/* —— 提交人自选 —— */}
                    {a.type === 'submitterPick' && (
                      <div className="approver-role-block">
                        <div className="approval-sub-label">选择范围</div>
                        <Radio.Group
                          value={a.pickScope || 'all'}
                          onChange={(e) => updateApprover(a.id, { pickScope: e.target.value })}
                        >
                          <Radio value="all">全员范围内选择</Radio>
                          <Radio value="role">指定角色范围内选择</Radio>
                        </Radio.Group>
                        {a.pickScope === 'role' && (
                          <Input
                            value={a.pickRoles || ''}
                            onChange={(e) => updateApprover(a.id, { pickRoles: e.target.value })}
                            placeholder="输入角色标识，多个用英文逗号分隔"
                            style={{ marginTop: 8 }}
                          />
                        )}
                        <div className="approver-role-hint">
                          流程发起时，提交人可从指定范围内自选一位或多位审批人。
                        </div>
                      </div>
                    )}

                    {/* —— 提交人本人 —— */}
                    {a.type === 'submitterSelf' && (
                      <div className="approver-role-block">
                        <div className="approval-tip-inline" style={{ marginTop: 0 }}>
                          审批人即为流程提交人自己，通常用于信息确认或知会场景。
                        </div>
                      </div>
                    )}

                    {/* —— 连续多级上级 —— */}
                    {a.type === 'multiLeader' && (
                      <div className="approver-depthead-block">
                        <div className="approval-sub-label">审批终点</div>
                        <Radio.Group
                          value={a.multiEndpointType || 'leader'}
                          onChange={(e) => updateApprover(a.id, { multiEndpointType: e.target.value })}
                          style={{ marginBottom: 12 }}
                        >
                          <Radio value="leader">上级</Radio>
                          <Radio value="deptHead">部门负责人</Radio>
                        </Radio.Group>
                        {(a.multiEndpointType || 'leader') === 'leader' ? (
                          <div className="approver-leader-row">
                            <span className="approver-leader-prefix">提交人的</span>
                            <Select
                              value={a.multiLevel || '直属上级'}
                              onChange={(v) => updateApprover(a.id, { multiLevel: v })}
                              dropdownRender={(menu) => (
                                <div>
                                  <div className="approver-depthead-switch">
                                    <span className="approver-depthead-hint">
                                      {a.multiMode === 'down' ? '从最高上级向下选择' : '从直属上级向上选择'}
                                    </span>
                                    <a
                                      className="approver-depthead-link"
                                      onClick={() => {
                                        const newMode = a.multiMode === 'down' ? 'up' : 'down';
                                        updateApprover(a.id, {
                                          multiMode: newMode,
                                          multiLevel: newMode === 'down' ? '最高上级' : '直属上级',
                                        });
                                      }}
                                    >
                                      {a.multiMode === 'down' ? '↑ 切为直属上级向上' : '↓ 切为最高上级向下'}
                                    </a>
                                  </div>
                                  {menu}
                                </div>
                              )}
                              options={(a.multiMode === 'down' ? MULTI_LEADER_LEVELS_DOWN : MULTI_LEADER_LEVELS_UP).map((v) => ({ value: v, label: v }))}
                              style={{ flex: 1 }}
                            />
                          </div>
                        ) : (
                          <div className="approver-leader-row">
                            <span className="approver-leader-prefix">提交人的</span>
                            <Select
                              value={a.multiDeptLevel || '直属部门负责人'}
                              onChange={(v) => updateApprover(a.id, { multiDeptLevel: v })}
                              dropdownRender={(menu) => (
                                <div>
                                  <div className="approver-depthead-switch">
                                    <span className="approver-depthead-hint">
                                      {a.multiDeptMode === 'down' ? '从最高部门向下选择' : '从直属部门负责人向上选择'}
                                    </span>
                                    <a
                                      className="approver-depthead-link"
                                      onClick={() => {
                                        const newMode = a.multiDeptMode === 'down' ? 'up' : 'down';
                                        updateApprover(a.id, {
                                          multiDeptMode: newMode,
                                          multiDeptLevel: newMode === 'down' ? '最高部门负责人' : '直属部门负责人',
                                        });
                                      }}
                                    >
                                      {a.multiDeptMode === 'down' ? '↑ 切为直属向上' : '↓ 切为最高部门向下'}
                                    </a>
                                  </div>
                                  {menu}
                                </div>
                              )}
                              options={(a.multiDeptMode === 'down' ? MULTI_DEPT_HEAD_LEVELS_DOWN : MULTI_DEPT_HEAD_LEVELS_UP).map((v) => ({ value: v, label: v }))}
                              style={{ flex: 1 }}
                            />
                          </div>
                        )}
                        <div className="approval-tip-inline">
                          从提交人的直属上级开始，逐级向上审批，直到满足终止条件为止。
                        </div>
                      </div>
                    )}

                    {/* —— 连续多级部门负责人 —— */}
                    {a.type === 'multiDeptHead' && (
                      <div className="approver-depthead-block">
                        <div className="approval-sub-label">审批终点</div>
                        <Radio.Group
                          value={a.multiEndpointType || 'deptHead'}
                          onChange={(e) => updateApprover(a.id, { multiEndpointType: e.target.value })}
                          style={{ marginBottom: 12 }}
                        >
                          <Radio value="leader">上级</Radio>
                          <Radio value="deptHead">部门负责人</Radio>
                        </Radio.Group>
                        {(a.multiEndpointType || 'deptHead') === 'deptHead' ? (
                          <div className="approver-leader-row">
                            <span className="approver-leader-prefix">提交人的</span>
                            <Select
                              value={a.multiDeptLevel || '直属部门负责人'}
                              onChange={(v) => updateApprover(a.id, { multiDeptLevel: v })}
                              dropdownRender={(menu) => (
                                <div>
                                  <div className="approver-depthead-switch">
                                    <span className="approver-depthead-hint">
                                      {a.multiDeptMode === 'down' ? '从最高部门向下选择' : '从直属部门负责人向上选择'}
                                    </span>
                                    <a
                                      className="approver-depthead-link"
                                      onClick={() => {
                                        const newMode = a.multiDeptMode === 'down' ? 'up' : 'down';
                                        updateApprover(a.id, {
                                          multiDeptMode: newMode,
                                          multiDeptLevel: newMode === 'down' ? '最高部门负责人' : '直属部门负责人',
                                        });
                                      }}
                                    >
                                      {a.multiDeptMode === 'down' ? '↑ 切为直属向上' : '↓ 切为最高部门向下'}
                                    </a>
                                  </div>
                                  {menu}
                                </div>
                              )}
                              options={(a.multiDeptMode === 'down' ? MULTI_DEPT_HEAD_LEVELS_DOWN : MULTI_DEPT_HEAD_LEVELS_UP).map((v) => ({ value: v, label: v }))}
                              style={{ flex: 1 }}
                            />
                          </div>
                        ) : (
                          <div className="approver-leader-row">
                            <span className="approver-leader-prefix">提交人的</span>
                            <Select
                              value={a.multiLevel || '直属上级'}
                              onChange={(v) => updateApprover(a.id, { multiLevel: v })}
                              dropdownRender={(menu) => (
                                <div>
                                  <div className="approver-depthead-switch">
                                    <span className="approver-depthead-hint">
                                      {a.multiMode === 'down' ? '从最高上级向下选择' : '从直属上级向上选择'}
                                    </span>
                                    <a
                                      className="approver-depthead-link"
                                      onClick={() => {
                                        const newMode = a.multiMode === 'down' ? 'up' : 'down';
                                        updateApprover(a.id, {
                                          multiMode: newMode,
                                          multiLevel: newMode === 'down' ? '最高上级' : '直属上级',
                                        });
                                      }}
                                    >
                                      {a.multiMode === 'down' ? '↑ 切为直属上级向上' : '↓ 切为最高上级向下'}
                                    </a>
                                  </div>
                                  {menu}
                                </div>
                              )}
                              options={(a.multiMode === 'down' ? MULTI_LEADER_LEVELS_DOWN : MULTI_LEADER_LEVELS_UP).map((v) => ({ value: v, label: v }))}
                              style={{ flex: 1 }}
                            />
                          </div>
                        )}
                        <div className="approval-tip-inline">
                          从提交人直属部门负责人开始，逐级向上审批，直到满足终止条件为止。
                        </div>
                      </div>
                    )}

                    {/* —— 表单内联系人 —— */}
                    {a.type === 'formContact' && (
                      <div className="approver-role-block">
                        <div className="approval-sub-label">选择表单字段</div>
                        <Select
                          value={a.formField || undefined}
                          onChange={(v) => updateApprover(a.id, { formField: v })}
                          options={FORM_FIELD_OPTIONS}
                          placeholder="请选择表单中的联系人字段"
                          style={{ width: '100%' }}
                        />
                        <div className="approver-role-hint">
                          审批人由表单中选择的联系人决定。需先在"表单设计"中添加联系人字段。
                        </div>
                      </div>
                    )}

                    {/* —— 表单内部门 —— */}
                    {a.type === 'formDept' && (
                      <div className="approver-role-block">
                        <div className="approval-sub-label">选择表单字段</div>
                        <Select
                          value={a.formDeptField || undefined}
                          onChange={(v) => updateApprover(a.id, { formDeptField: v })}
                          options={FORM_FIELD_OPTIONS.filter((f) => f.value === 'dept')}
                          placeholder="请选择表单中的部门字段"
                          style={{ width: '100%' }}
                        />
                        <div className="approval-sub-label" style={{ marginTop: 12 }}>部门负责人层级</div>
                        <Select
                          value={a.deptLevel || '直属部门负责人'}
                          onChange={(v) => updateApprover(a.id, { deptLevel: v })}
                          options={DEPT_HEAD_LEVELS_UP.map((v) => ({ value: v, label: v }))}
                          style={{ width: '100%' }}
                        />
                        <div className="approver-role-hint">
                          审批人为表单中所选部门的负责人。需先在"表单设计"中添加部门字段。
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  className="approval-add-btn"
                  onClick={addApprover}
                >
                  添加审批人
                </Button>

                {/* 审批人为空时 */}
                <div className="approval-section">
                  <div className="approval-label-line">
                    审批人为空时
                    <Tooltip title="审批人配置为空时的兜底处理策略">
                      <QuestionCircleOutlined className="approver-opt-tip" />
                    </Tooltip>
                  </div>
                  <Radio.Group
                    value={emptyPolicy}
                    onChange={(e) => setEmptyPolicy(e.target.value)}
                  >
                    <Radio value="autoPass">自动通过</Radio>
                    <Radio value="specificApprover">指定人员审批</Radio>
                    <Radio value="transferAdmin">
                      转交给审批管理员
                      <Tooltip title="由系统管理员代为处理">
                        <QuestionCircleOutlined className="approver-opt-tip" />
                      </Tooltip>
                    </Radio>
                  </Radio.Group>
                </div>

                {/* 审批人与提交人为同一人时 */}
                <div className="approval-section">
                  <div className="approval-label-line">审批人与提交人为同一人时</div>
                  <div className="approval-radio-2col">
                    <Radio.Group
                      value={sameAsSubmitter}
                      onChange={(e) => setSameAsSubmitter(e.target.value)}
                    >
                      <Radio value="selfApprove">由提交人对自己审批</Radio>
                      <Radio value="autoSkip">
                        自动跳过
                        <Tooltip title="跳过该审批节点">
                          <QuestionCircleOutlined className="approver-opt-tip" />
                        </Tooltip>
                      </Radio>
                      <Radio value="transferLeader">
                        转交给直属上级审批
                        <Tooltip title="由提交人的直属上级代为审批">
                          <QuestionCircleOutlined className="approver-opt-tip" />
                        </Tooltip>
                      </Radio>
                      <Radio value="transferDeptHead">
                        转交给部门负责人审批
                        <Tooltip title="由提交人所在部门的负责人代为审批">
                          <QuestionCircleOutlined className="approver-opt-tip" />
                        </Tooltip>
                      </Radio>
                    </Radio.Group>
                  </div>
                </div>

                {/* 提示块 */}
                <div className="approval-tip-block">
                  <div className="approval-tip-block-title">提示：</div>
                  <ul>
                    <li>若审批人离职，会自动转交给审批人的上级代为处理</li>
                    <li>
                      若同一审批人在流程中重复出现，默认只审批一次。可前往{' '}
                      <a href="#more" onClick={(e) => e.preventDefault()}>
                        更多设置
                      </a>{' '}
                      修改
                    </li>
                  </ul>
                </div>

                <div className="approval-divider" />

                {/* 抄送人设置 */}
                <div className="approval-section">
                  <div className="approval-label-line">抄送人设置</div>
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    className="approval-add-btn"
                    onClick={handleAddCc}
                  >
                    添加抄送人
                  </Button>
                  {ccUsers.length > 0 && (
                    <div className="approval-cc-list">
                      {ccUsers.map((u, i) => (
                        <Tag closable onClose={() => removeCc(i)} key={`${u}-${i}`}>
                          {u}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div className="approval-tip-block">
                    <div className="approval-tip-block-title">提示：</div>
                    <ul>
                      <li>抄送的人数最多支持100人以内</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* —— Tab2：表单权限 —— */}
            {activeTab === 'formPerms' && (
              <div className="form-perms-wrap">
                <div className="form-perms-table">
                  <div className="form-perms-header">
                    <span className="form-perms-col form-perms-col-field">表单字段</span>
                    <span className="form-perms-col form-perms-col-perm">可读</span>
                    <span className="form-perms-col form-perms-col-perm">编辑</span>
                  </div>
                  {formFields.length === 0 && (
                    <div className="form-perms-empty">
                      暂无表单字段，请先在「表单设计」中添加字段
                    </div>
                  )}
                  {formFields.map((f) => (
                    <div className="form-perms-row" key={f.id}>
                      <span className="form-perms-col form-perms-col-field">
                        <span className={`form-perms-field-icon form-perms-field-icon--${f.type}`}>
                          {FIELD_TYPE_ICON[f.type] || '📋'}
                        </span>
                        {f.label}
                      </span>
                      <span className="form-perms-col form-perms-col-perm">
                        <Checkbox
                          checked={f.readable}
                          onChange={() => toggleFormPerm(f.id, 'readable')}
                        />
                      </span>
                      <span className="form-perms-col form-perms-col-perm">
                        <Checkbox
                          checked={f.editable}
                          onChange={() => toggleFormPerm(f.id, 'editable')}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="approval-tip-block" style={{ marginTop: 16 }}>
                  <div className="approval-tip-block-title">提示：</div>
                  <ul>
                    <li>表单字段数据来源于「表单设计」，修改后自动同步</li>
                    <li>「可读」控制审批人能否看到该字段，「编辑」控制能否修改</li>
                    <li>取消「可读」将同时取消「编辑」权限</li>
                  </ul>
                </div>
              </div>
            )}

            {/* —— Tab3：操作权限 —— */}
            {activeTab === 'opPerms' && (
              <div className="op-perms-wrap">
                {/* 允许的操作 */}
                <div className="approval-section">
                  <div className="approval-label-line">审批操作权限</div>
                  <div className="op-perms-check-list">
                    <Checkbox
                      checked={allowTransfer}
                      onChange={(e) => setAllowTransfer(e.target.checked)}
                    >
                      允许转交
                      <Tooltip title="审批人可将任务转交给其他人处理">
                        <QuestionCircleOutlined className="approver-opt-tip" />
                      </Tooltip>
                    </Checkbox>
                    <Checkbox
                      checked={allowAddSign}
                      onChange={(e) => setAllowAddSign(e.target.checked)}
                    >
                      允许加/减签
                      <Tooltip title="审批人可在审批过程中增加或减少审批人">
                        <QuestionCircleOutlined className="approver-opt-tip" />
                      </Tooltip>
                    </Checkbox>
                    <Checkbox
                      checked={allowReject}
                      onChange={(e) => setAllowReject(e.target.checked)}
                    >
                      允许退回
                      <Tooltip title="审批人可将审批退回给上一步">
                        <QuestionCircleOutlined className="approver-opt-tip" />
                      </Tooltip>
                    </Checkbox>
                  </div>
                </div>

                {/* 退回范围 */}
                {allowReject && (
                  <div className="approval-section">
                    <div className="approval-label-line">退回范围</div>
                    <Radio.Group
                      value={rejectScope}
                      onChange={(e) => setRejectScope(e.target.value)}
                    >
                      <Radio value="unlimited">不限制范围</Radio>
                      <Radio value="specified">指定范围</Radio>
                    </Radio.Group>
                    {rejectScope === 'specified' && (
                      <div className="approval-tip-inline" style={{ marginTop: 8 }}>
                        指定范围退回：审批人只能退回到指定的上游节点
                      </div>
                    )}
                  </div>
                )}

                {/* 附加要求 */}
                <div className="approval-section">
                  <div className="approval-label-line">附加要求</div>
                  <div className="op-perms-check-list">
                    <Checkbox
                      checked={requireSignature}
                      onChange={(e) => setRequireSignature(e.target.checked)}
                    >
                      审批同意时需手写签名
                    </Checkbox>
                    <Checkbox
                      checked={requireComment}
                      onChange={(e) => setRequireComment(e.target.checked)}
                    >
                      提交审批需填写审批意见
                    </Checkbox>
                  </div>
                </div>

                <div className="approval-tip-block">
                  <div className="approval-tip-block-title">提示：</div>
                  <ul>
                    <li>操作权限仅对人工审批生效，自动通过/拒绝节点无需审批人操作</li>
                    <li>转交后原审批人不再需要审批</li>
                    <li>加签后新增的审批人审批完毕才会流转到下一步</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部 footer */}
      <div className="approval-panel-footer">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </div>

      {/* 成员选择弹窗 */}
      <MemberPickerModal
        key={pickerTick}
        open={pickerOpen}
        selected={
          pickerFor
            ? approvers.find((x) => x.id === pickerFor)
              ? parseMembers(approvers.find((x) => x.id === pickerFor))
              : []
            : []
        }
        onClose={() => {
          setPickerOpen(false);
          pickerForRef.current = null;
          setPickerFor(null);
        }}
        onConfirm={confirmMemberPicker}
        max={25}
      />
    </div>
  );
}
