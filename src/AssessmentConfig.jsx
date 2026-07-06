import { useState, useRef, useEffect } from 'react';
import { Button, Input, InputNumber, Switch, Tag, Select, Radio, DatePicker, Divider, Dropdown, message } from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  FolderOutlined,
  FolderFilled,
  FolderOpenFilled,
  CaretDownOutlined,
  CaretRightOutlined,
  PlusOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  EditOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import './AssessmentConfig.css';
import AssessmentFlowView, { evaluateResourceBindingAvailability } from './AssessmentFlowView';

const ASSESSMENT_DROPDOWN_OVERLAY_CLASS = 'finder-liquid-glass-menu';

// 根据类型获取图标
function getResourceIcon(type) {
  switch (type) {
    case 'video':
      return <PlayCircleOutlined style={{ color: '#7d8797' }} />;
    case 'activity':
      return <AppstoreOutlined style={{ color: '#f59e0b' }} />;
    case 'survey':
    case 'vote':
    case 'exam':
    case 'register':
      return <EditOutlined style={{ color: '#3b82f6' }} />;
    default:
      return <FileTextOutlined style={{ color: '#98a2b3' }} />;
  }
}

// 模拟AI根据用户输入和资料结构生成考核方案
function generateAIResponse(userMsg, resources, currentAssessment) {
  const stages = resources.filter((r) => r.isFolder && r.parentKey === null);
  const activities = resources.filter((r) => r.isFolder && r.parentKey !== null);
  const msg = userMsg.toLowerCase();
  const mentionsHours = msg.match(/(\d+)\s*[学课]时/);
  const mentionsScore = msg.match(/(\d+)\s*分/);
  const mentionsVideo = msg.includes('视频');
  const mentionsExam = msg.includes('考试') || msg.includes('考核');
  const mentionsCert = msg.includes('证书') || msg.includes('发证');
  const mentionsAdjust = msg.includes('调整') || msg.includes('修改') || msg.includes('改为') || msg.includes('提高') || msg.includes('降低');
  const mentionsWeight = msg.match(/权重.*?(\d+)/);

  let replyText = '';
  let newAssessment = JSON.parse(JSON.stringify(currentAssessment));

  if (mentionsAdjust && mentionsVideo && mentionsWeight) {
    const w = parseInt(mentionsWeight[1]);
    newAssessment.rules = newAssessment.rules.map((r) =>
      r.folderName?.includes('视频') ? { ...r, weight: w } : r
    );
    replyText = `好的，已将所有视频课的考核权重调整为 ${w}%。请检查中间的方案，确认权重总和是否为100%。`;
  } else if (mentionsAdjust && mentionsExam && mentionsWeight) {
    const w = parseInt(mentionsWeight[1]);
    newAssessment.rules = newAssessment.rules.map((r) =>
      (r.folderName?.includes('考试') || r.folderName?.includes('考核')) ? { ...r, weight: w } : r
    );
    replyText = `好的，已将考试/考核类活动权重调整为 ${w}%。请确认中间的方案。`;
  } else {
    if (mentionsHours) newAssessment.totalHours = parseInt(mentionsHours[1]);
    if (mentionsScore) newAssessment.passScore = parseInt(mentionsScore[1]);
    if (mentionsCert) newAssessment.certificate = true;

    if (activities.length > 0) {
      const videoActivities = activities.filter((a) => {
        const children = resources.filter((r) => r.parentKey === a.key && !r.isFolder);
        return children.some((c) => c.type === 'video') || a.name.includes('视频');
      });
      const examActivities = activities.filter((a) => {
        const children = resources.filter((r) => r.parentKey === a.key && !r.isFolder);
        return children.some((c) => c.type === 'exam') || a.name.includes('考试') || a.name.includes('考核');
      });
      const videoWeight = mentionsVideo ? 50 : 30;
      const examWeight = mentionsExam && !mentionsVideo ? 30 : 15;
      const otherCount = activities.length - videoActivities.length - examActivities.length;
      const otherWeight = otherCount > 0 ? Math.floor((100 - videoWeight - examWeight) / Math.max(otherCount, 1)) : 5;

      let totalW = 0;
      const rules = activities.map((act, idx) => {
        const stage = stages.find((s) => s.key === act.parentKey);
        const isVideo = videoActivities.includes(act);
        const isExam = examActivities.includes(act);
        let w = isVideo ? Math.round(videoWeight / Math.max(videoActivities.length, 1))
          : isExam ? Math.round(examWeight / Math.max(examActivities.length, 1))
          : Math.max(otherWeight, 3);
        totalW += w;
        let condition = { metric: '完成率', op: '>=', value: 80 };
        if (isExam) condition = { metric: '分数', op: '>=', value: 60 };
        else if (act.name.includes('直播') || act.name.includes('集训')) condition = { metric: '出勤率', op: '>=', value: 90 };
        else if (act.name.includes('作业') || act.name.includes('研讨')) condition = { metric: '提交率', op: '=', value: 100 };
        const folderPath = stage ? `${stage.name} / ${act.name}` : act.name;
        return { key: `ar_${idx}`, folderKey: act.key, folderName: folderPath, activityType: isVideo ? 'video' : isExam ? 'exam' : 'other', weight: w, passCondition: condition, required: isVideo || isExam };
      });
      if (rules.length > 0) { rules[0].weight += (100 - totalW); }
      newAssessment.rules = rules;
    }
    const stageNames = stages.map((s) => s.name).join('、');
    replyText = `根据您的培训目标，我已基于当前资料结构生成考核方案：\n\n📋 培训阶段：${stageNames}\n⏱ 总学时：${newAssessment.totalHours} 学时\n✅ 及格分：${newAssessment.passScore} 分\n🏆 考核通过${newAssessment.certificate ? '发放证书' : '不发证书'}\n📊 共 ${newAssessment.rules.length} 项考核规则\n\n方案已在中间区域展示，点击画布节点可查看详细配置。`;
  }
  return { reply: replyText, assessment: newAssessment };
}

const activityTypeOptions = [
  { label: '请选择', value: '' },
  { label: '视频课', value: 'video' },
  { label: '直播课', value: 'live' },
  { label: '考试', value: 'exam' },
  { label: '线下集训', value: 'offline' },
  { label: '课后作业/其他', value: 'other' },
];
const activityTypeLabel = { video: '视频课', live: '直播课', exam: '考试', offline: '线下集训', other: '通用' };
const activityTypeColor = { video: 'blue', live: 'cyan', exam: 'red', offline: 'orange', other: 'default' };

function AssessmentConfig({ assessment, assessmentChat, resources, isDraft, onUpdateAssessment, onUpdateChat, onOpenAddModal, onCreateFolder }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(assessmentChat || []);
  const [typing, setTyping] = useState(false);
  const [localAssessment, setLocalAssessment] = useState(assessment || { totalHours: 0, passScore: 60, certificate: false, rules: [] });
  const [selectedFolderKey, setSelectedFolderKey] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const rootFolderKeys = resources.filter(r => r.isFolder && r.parentKey === null).map(r => r.key);
    return new Set(rootFolderKeys);
  });
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [rightWidth, setRightWidth] = useState(360);
  const [activeBindingTarget, setActiveBindingTarget] = useState(null);
  const messagesEndRef = useRef(null);

  const startResizeRight = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightWidth;
    const onMove = (ev) => {
      const delta = startX - ev.clientX;
      const next = Math.max(200, Math.min(600, startW + delta));
      setRightWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  useEffect(() => { setLocalAssessment(assessment || { totalHours: 0, passScore: 60, certificate: false, rules: [] }); }, [assessment]);
  useEffect(() => { setMessages(assessmentChat || []); }, [assessmentChat]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => {
    if (selectedFolderKey) {
      setActiveBindingTarget(null);
      setResourceDrawerOpen(false);
    }
  }, [selectedFolderKey]);

  useEffect(() => {
    if (messages.length === 0) {
      const stages = resources.filter((r) => r.isFolder && r.parentKey === null);
      const activities = resources.filter((r) => r.isFolder && r.parentKey !== null);
      const welcome = `你好！我是培训管理智能体。\n\n当前培训项目包含 ${stages.length} 个阶段、${activities.length} 个培训活动。\n\n你只需要描述培训目标，例如：\n• "总学时15学时，重点是视频学习，考核通过发放证书"\n• "视频权重50%，考试30%，其余均分"\n\n请描述你的考核需求：`;
      const initialMsgs = [{ role: 'assistant', content: welcome }];
      setMessages(initialMsgs);
      onUpdateChat(initialMsgs);
    }
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    if (!isDraft) { message.warning('当前版本不可编辑'); return; }
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setTyping(true);
    setTimeout(() => {
      const { reply, assessment: newAssessment } = generateAIResponse(text, resources, localAssessment);
      const aiMsg = { role: 'assistant', content: reply };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      setTyping(false);
      setLocalAssessment(newAssessment);
      onUpdateAssessment(newAssessment);
      onUpdateChat(finalMessages);
    }, 800 + Math.random() * 600);
  };

  // 活动类型推断
  const getActivityType = (folderKey) => {
    if (!folderKey) return 'other';
    const children = resources.filter((r) => r.parentKey === folderKey && !r.isFolder);
    const folder = resources.find((r) => r.key === folderKey);
    const name = folder?.name || '';
    if (children.some((c) => c.type === 'exam') || name.includes('考试') || name.includes('考核')) return 'exam';
    if (children.some((c) => c.type === 'video') || name.includes('视频') || name.includes('点播')) return 'video';
    if (name.includes('直播')) return 'live';
    if (name.includes('集训') || name.includes('线下')) return 'offline';
    return 'other';
  };

  // 规则编辑
  const handleRuleChange = (folderKey, field, value) => {
    if (!isDraft) return;
    const rules = [...localAssessment.rules];
    const idx = rules.findIndex((r) => r.folderKey === folderKey);
    if (idx >= 0) {
      rules[idx] = { ...rules[idx], [field]: value };
    } else {
      const folder = resources.find((r) => r.key === folderKey);
      const getFolderPath = (f) => {
        const parts = [f.name]; let c = f;
        while (c.parentKey) { const p = resources.find((r) => r.key === c.parentKey); if (p) { parts.unshift(p.name); c = p; } else break; }
        return parts.join(' / ');
      };
      rules.push({ key: `ar_${Date.now()}`, folderKey, folderName: folder ? getFolderPath(folder) : '', activityType: getActivityType(folderKey), weight: 10, passCondition: { metric: '完成率', op: '>=', value: 80 }, required: true, [field]: value });
    }
    const newA = { ...localAssessment, rules };
    setLocalAssessment(newA);
    onUpdateAssessment(newA);
  };

  // 资料树
  const rootItems = resources.filter((r) => r.parentKey === null);
  const getChildren = (key) => resources.filter((r) => r.parentKey === key);
  const toggleFolder = (key) => {
    const next = new Set(expandedFolders);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedFolders(next);
  };
  const handleSelectFolder = (folderKey) => {
    setSelectedFolderKey(folderKey);
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderKey);
      return next;
    });
  };
  const handleCreateFolder = () => {
    if (!isDraft) { message.warning('当前版本不可编辑'); return; }
    setResourceDrawerOpen(true);
    setCreatingFolder(true);
    setNewFolderName('');
  };
  const handleSaveNewFolder = () => {
    const name = newFolderName.trim();
    if (!name) { message.warning('文件夹名称不能为空'); return; }
    if (onCreateFolder) onCreateFolder(name);
    setCreatingFolder(false);
    message.success('文件夹创建成功');
  };

  const resourcePanelMenuItems = [
    {
      key: 'add-resource',
      icon: <PlusOutlined />,
      label: '添加资料',
      disabled: !isDraft,
      onClick: () => {
        if (isDraft && onOpenAddModal) onOpenAddModal();
      },
    },
    {
      key: 'new-folder',
      icon: <FolderOutlined />,
      label: '新建文件夹',
      disabled: !isDraft,
      onClick: handleCreateFolder,
    },
  ];

  const resolveDragAvailability = (item) => {
    if (!activeBindingTarget) {
      return { draggable: true, disabled: false, reason: '' };
    }
    if (!activeBindingTarget.isCustomActivity) {
      return { draggable: false, disabled: true, reason: '当前活动不支持拖入绑定资料' };
    }
    const availability = evaluateResourceBindingAvailability({
      resource: item,
      boundKeys: new Set(activeBindingTarget.boundKeys || []),
      activityType: activeBindingTarget.activityType ?? '',
      resources,
    });
    return {
      draggable: availability.selectable,
      disabled: !availability.selectable,
      reason: availability.reason || '',
    };
  };

  const renderTreeItem = (item) => {
    // 拖拽到画布：写入 dataTransfer
    const handleDragStart = (e) => {
      e.dataTransfer.setData('application/assessment-resource', JSON.stringify({
        key: item.key,
        name: item.name,
        isFolder: !!item.isFolder,
        parentKey: item.parentKey ?? null,
        type: item.type ?? null,
      }));
      e.dataTransfer.effectAllowed = 'move';
    };
    const dragAvailability = resolveDragAvailability(item);
    const canDrag = !selectedFolderKey && dragAvailability.draggable;
    const itemTitle = canDrag
      ? '可拖拽到右侧画布'
      : dragAvailability.reason || undefined;
    if (item.isFolder) {
      const isExpanded = expandedFolders.has(item.key);
      const isSelected = selectedFolderKey === item.key;
      const children = getChildren(item.key);
      return (
        <div key={item.key} className="tree-folder-group">
          <div
            className={`project-item project-item-folder ${isSelected ? 'project-item-selected' : ''} ${dragAvailability.disabled ? 'project-item-disabled' : ''}`}
            onClick={activeBindingTarget || dragAvailability.disabled ? undefined : () => handleSelectFolder(item.key)}
            draggable={canDrag}
            onDragStart={canDrag ? handleDragStart : undefined}
            title={itemTitle}
            aria-disabled={dragAvailability.disabled}
          >
            <span className="project-item-arrow" onClick={(e) => { e.stopPropagation(); toggleFolder(item.key); }}>
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
            <span className="project-item-icon">
              {isExpanded
                ? <FolderOpenFilled style={{ color: '#56a8f5' }} />
                : <FolderFilled style={{ color: '#56a8f5' }} />}
            </span>
            <span className="project-item-title">{item.name}</span>
          </div>
          {isExpanded && (
            <div className="tree-children">
              {children.map((child) => renderTreeItem(child))}
            </div>
          )}
        </div>
      );
    }
    // 普通文件
    return (
      <div
        key={item.key}
        className={`project-item project-item-child ${dragAvailability.disabled ? 'project-item-disabled' : ''}`}
        draggable={canDrag}
        onDragStart={canDrag ? handleDragStart : undefined}
        title={itemTitle}
        aria-disabled={dragAvailability.disabled}
      >
        <span className="project-item-icon">{getResourceIcon(item.type)}</span>
        <span className="project-item-title">{item.name}</span>
      </div>
    );
  };

  // 当前选中目录的规则
  const currentRule = selectedFolderKey ? localAssessment.rules.find((r) => r.folderKey === selectedFolderKey) : null;
  const actType = currentRule?.activityType !== undefined && currentRule?.activityType !== null
      ? currentRule.activityType
      : getActivityType(selectedFolderKey);

  // 中间区域：配置面板
  const renderConfigPanel = () => {
    if (!selectedFolderKey) {
      // 汇总视图：流程画布充满中间区域
      return (
        <div className="config-summary">
          <AssessmentFlowView
            resources={resources}
            assessment={localAssessment}
            isDraft={isDraft}
            onUpdateAssessment={(a) => { setLocalAssessment(a); onUpdateAssessment(a); }}
            onSelectFolder={(key) => setSelectedFolderKey(key)}
            onActivityBindingTargetChange={setActiveBindingTarget}
          />
          {renderFloatingResourcePanel()}
        </div>
      );
    }

    // 选中目录的详细配置
    const folder = resources.find((r) => r.key === selectedFolderKey && r.isFolder);
    if (!folder) return null;
    const rule = currentRule || { required: true, weight: 10, passCondition: { metric: '完成率', op: '>=', value: 80 } };

    return (
      <div className="config-detail">
        <div className="config-detail-header">
          <Button type="text" size="small" onClick={() => setSelectedFolderKey(null)}>← 返回总览</Button>
        </div>
        <div className="config-detail-title">
          <FolderOutlined style={{ color: '#4facfe', marginRight: 8 }} />
          {folder.name}
          <Tag color={activityTypeColor[actType]} style={{ marginLeft: 12 }}>{activityTypeLabel[actType]}</Tag>
        </div>
        <div className="config-detail-type">
          <span className="config-detail-label">活动类型：</span>
          <Select style={{ width: 150 }} value={actType} options={activityTypeOptions} disabled={!isDraft}
            onChange={(v) => handleRuleChange(selectedFolderKey, 'activityType', v)} />
        </div>
        <div className="config-detail-body">
          {actType === 'video' && renderVideoForm(rule)}
          {actType === 'exam' && renderExamForm(rule)}
          {actType !== 'video' && actType !== 'exam' && renderGenericForm(rule)}
        </div>
      </div>
    );
  };

  const renderFloatingResourcePanel = () => {
    if (!resourceDrawerOpen) {
      return (
        <button
          type="button"
          className="assessment-resource-drawer-toggle"
          onClick={() => setResourceDrawerOpen(true)}
          aria-label="展开资料"
          title="展开资料"
        >
          <MenuUnfoldOutlined />
        </button>
      );
    }

    return (
      <aside className="assessment-resource-drawer">
        <div className="assessment-resource-drawer-head">
          <span className="assessment-resource-drawer-title">资料</span>
          <div className="panel-header-actions">
            <Dropdown
              overlayClassName={ASSESSMENT_DROPDOWN_OVERLAY_CLASS}
              menu={{ items: resourcePanelMenuItems }}
              trigger={['click']}
            >
              <MoreOutlined className="panel-more-icon" />
            </Dropdown>
            <button
              type="button"
              className="assessment-resource-drawer-action"
              onClick={() => setResourceDrawerOpen(false)}
              aria-label="收起资料"
              title="收起资料"
            >
              <MenuFoldOutlined />
            </button>
          </div>
        </div>

        <div className="assessment-resource-drawer-body">
          {creatingFolder && (
            <div className="new-folder-form">
              <div className="new-folder-row">
                <FolderOutlined style={{ color: '#4facfe', fontSize: 14 }} />
                <Input
                  size="small"
                  placeholder="输入文件夹名称"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onPressEnter={handleSaveNewFolder}
                  autoFocus
                  style={{ flex: 1 }}
                />
              </div>
              <div className="new-folder-actions">
                <Button size="small" onClick={() => setCreatingFolder(false)}>取消</Button>
                <Button size="small" type="primary" onClick={handleSaveNewFolder}>创建</Button>
              </div>
            </div>
          )}

          <div className="project-list">
            {rootItems.length === 0 && !creatingFolder ? (
              <div className="project-empty">暂无资料</div>
            ) : (
              rootItems.map((item) => renderTreeItem(item))
            )}
          </div>
        </div>
      </aside>
    );
  };

  const renderVideoForm = (rule) => (
    <>
      <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>考核时间</Divider>
      <div className="cfg-form-item">
        <span className="cfg-form-label"><span style={{ color: 'red' }}>*</span> 考核时间：</span>
        <DatePicker.RangePicker disabled={!isDraft} value={rule.examTimeRange || null}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'examTimeRange', v)} placeholder={['开始时间', '结束时间']} />
      </div>
      <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>选课设置</Divider>
      <div className="cfg-form-item">
        <span className="cfg-form-label">是否必修：</span>
        <Radio.Group disabled={!isDraft} value={rule.required ? 'required' : 'optional'}
          onChange={(e) => handleRuleChange(selectedFolderKey, 'required', e.target.value === 'required')}>
          <Radio value="required">必修</Radio><Radio value="optional">选修</Radio>
        </Radio.Group>
      </div>
      <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>成绩设置</Divider>
      <div className="cfg-form-item">
        <Select style={{ width: 130 }} disabled={!isDraft} value={rule.scoreType || '固定成绩'}
          options={[{ label: '固定成绩', value: '固定成绩' }, { label: '按完成率', value: '按完成率' }, { label: '按考试分数', value: '按考试分数' }]}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'scoreType', v)} />
        <InputNumber style={{ width: 80, marginLeft: 8 }} disabled={!isDraft} min={0} max={100} value={rule.scoreValue ?? 100}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'scoreValue', v || 0)} />
        <span style={{ marginLeft: 6, color: '#666' }}>分</span>
      </div>
      <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>学时设置</Divider>
      <div className="cfg-form-item">
        <Select style={{ width: 130 }} disabled={!isDraft} value={rule.creditType || '累计学时'}
          options={[{ label: '累计学时', value: '累计学时' }, { label: '固定学时', value: '固定学时' }]}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'creditType', v)} />
        <InputNumber style={{ width: 80, marginLeft: 8 }} disabled={!isDraft} min={1} max={999} value={rule.creditMinutes ?? 60}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'creditMinutes', v || 60)} />
        <span style={{ marginLeft: 6, color: '#666' }}>分钟=1学时</span>
      </div>
    </>
  );

  const renderExamForm = (rule) => (
    <>
      <div className="cfg-section-title">考试配置</div>
      <div className="cfg-form-item">
        <span className="cfg-form-label"><span style={{ color: 'red' }}>*</span> 考试时间：</span>
        <DatePicker.RangePicker disabled={!isDraft} value={rule.examTimeRange || null}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'examTimeRange', v)} placeholder={['开始时间', '结束时间']} />
      </div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">及格分：</span>
        <Switch disabled={!isDraft} checked={rule.passScoreEnabled ?? true} onChange={(v) => handleRuleChange(selectedFolderKey, 'passScoreEnabled', v)} />
        <span style={{ marginLeft: 12 }}>达到</span>
        <InputNumber style={{ width: 80, marginLeft: 8 }} disabled={!isDraft} min={0} max={100} value={rule.passScoreValue ?? 60}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'passScoreValue', v || 0)} />
        <span style={{ marginLeft: 6, color: '#666' }}>分及格</span>
      </div>
      <div className="cfg-form-item">
        <span className="cfg-form-label"><span style={{ color: 'red' }}>*</span> 考试时长：</span>
        <span>达到</span>
        <InputNumber style={{ width: 80, marginLeft: 8 }} disabled={!isDraft} min={1} max={999} value={rule.examDuration ?? 90}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'examDuration', v || 90)} />
        <span style={{ marginLeft: 6, color: '#666' }}>分钟</span>
      </div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">重考设置：</span>
        <Switch disabled={!isDraft} checked={rule.allowRetake ?? false} onChange={(v) => handleRuleChange(selectedFolderKey, 'allowRetake', v)} />
        <span style={{ marginLeft: 8, color: '#666' }}>允许重考</span>
      </div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">重考成绩策略：</span>
        <span>取</span>
        <Select style={{ width: 110, marginLeft: 8 }} disabled={!isDraft} value={rule.retakeStrategy || '最高分'}
          options={[{ label: '最高分', value: '最高分' }, { label: '最后一次', value: '最后一次' }, { label: '平均分', value: '平均分' }]}
          onChange={(v) => handleRuleChange(selectedFolderKey, 'retakeStrategy', v)} />
        <span style={{ marginLeft: 6, color: '#666' }}>为最终成绩</span>
      </div>
      <Divider style={{ margin: '16px 0 12px' }} />
      <div className="cfg-section-dot" style={{ color: '#999' }}>考后设置</div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">考后查看试卷：</span>
        <div>
          <Switch disabled={!isDraft} checked={rule.showPaperAfter ?? false} onChange={(v) => handleRuleChange(selectedFolderKey, 'showPaperAfter', v)} />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>开启后，允许学员查看试卷内容及答案解析</div>
        </div>
      </div>
      <Divider style={{ margin: '16px 0 12px' }} />
      <div className="cfg-section-dot" style={{ color: '#faad14' }}>防舞弊设置</div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">考试页面防切换：</span>
        <Switch disabled={!isDraft} checked={rule.preventSwitch ?? false} onChange={(v) => handleRuleChange(selectedFolderKey, 'preventSwitch', v)} />
      </div>
      <div className="cfg-form-item">
        <span className="cfg-form-label">考前人脸识别：</span>
        <div>
          <Switch disabled={!isDraft} checked={rule.faceRecognition ?? false} onChange={(v) => handleRuleChange(selectedFolderKey, 'faceRecognition', v)} />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>开启后，考生需完成人脸识别才能进入考试</div>
        </div>
      </div>
    </>
  );

  const renderGenericForm = (rule) => {
    const cond = typeof rule.passCondition === 'object' ? rule.passCondition : { metric: '完成率', op: '>=', value: 80 };
    return (
      <>
        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>考核时间</Divider>
        <div className="cfg-form-item">
          <span className="cfg-form-label"><span style={{ color: 'red' }}>*</span> 考核时间：</span>
          <DatePicker.RangePicker disabled={!isDraft} value={rule.examTimeRange || null}
            onChange={(v) => handleRuleChange(selectedFolderKey, 'examTimeRange', v)} placeholder={['开始时间', '结束时间']} />
        </div>
        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>选课设置</Divider>
        <div className="cfg-form-item">
          <span className="cfg-form-label">是否必修：</span>
          <Radio.Group disabled={!isDraft} value={rule.required ? 'required' : 'optional'}
            onChange={(e) => handleRuleChange(selectedFolderKey, 'required', e.target.value === 'required')}>
            <Radio value="required">必修</Radio><Radio value="optional">选修</Radio>
          </Radio.Group>
        </div>
        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>通过条件</Divider>
        <div className="cfg-form-item">
          <Select style={{ width: 100 }} disabled={!isDraft} value={cond.metric}
            options={[{ label: '完成率', value: '完成率' }, { label: '出勤率', value: '出勤率' }, { label: '提交率', value: '提交率' }, { label: '分数', value: '分数' }, { label: '时长', value: '时长' }]}
            onChange={(v) => handleRuleChange(selectedFolderKey, 'passCondition', { ...cond, metric: v })} />
          <Select style={{ width: 70, marginLeft: 8 }} disabled={!isDraft} value={cond.op}
            options={[{ label: '>=', value: '>=' }, { label: '<=', value: '<=' }, { label: '=', value: '=' }]}
            onChange={(v) => handleRuleChange(selectedFolderKey, 'passCondition', { ...cond, op: v })} />
          <InputNumber style={{ width: 70, marginLeft: 8 }} disabled={!isDraft} min={0} max={100} value={cond.value}
            onChange={(v) => handleRuleChange(selectedFolderKey, 'passCondition', { ...cond, value: v || 0 })} />
          <span style={{ marginLeft: 6, color: '#666' }}>{cond.metric.includes('率') ? '%' : '分'}</span>
        </div>
      </>
    );
  };

  const layoutStyle = {
    gridTemplateColumns: `1fr 0px ${rightCollapsed ? 36 : rightWidth}px`,
  };

  return (
    <div className="assessment-layout" style={layoutStyle}>
      {/* 考核配置画布 */}
      <div className="config-panel">
        {renderConfigPanel()}
      </div>

      {/* 右侧拖拽手柄 */}
      <div
        className={`resize-handle ${rightCollapsed ? 'resize-handle-disabled' : ''}`}
        onMouseDown={rightCollapsed ? undefined : startResizeRight}
      />

      {/* 右栏 - AI对话 */}
      {rightCollapsed ? (
        <div className="collapsed-panel collapsed-right" onClick={() => setRightCollapsed(false)}>
          <MenuFoldOutlined className="collapsed-icon" />
          <span className="collapsed-label">智能体</span>
        </div>
      ) : (
        <div className="chat-panel">
          <div className="chat-header">
            <RobotOutlined className="chat-header-icon" />
            <span>培训管理智能体</span>
            <MenuUnfoldOutlined
              className="chat-collapse-icon"
              title="折叠智能体"
              onClick={() => setRightCollapsed(true)}
            />
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg chat-msg-${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                <div className="chat-msg-avatar">{msg.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />}</div>
                <div className="chat-msg-bubble">{msg.content}</div>
              </div>
            ))}
            {typing && (
              <div className="chat-typing">
                <div className="chat-typing-dot" /><div className="chat-typing-dot" /><div className="chat-typing-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <Input.TextArea value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isDraft ? '描述你的考核需求...' : '当前版本不可编辑'}
              autoSize={{ minRows: 1, maxRows: 4 }} disabled={!isDraft} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend}
              disabled={!isDraft || !inputValue.trim()} className="chat-send-btn">发送</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentConfig;
