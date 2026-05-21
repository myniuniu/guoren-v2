import { useState, useRef, useEffect } from 'react';
import { Button, Input, Table, InputNumber, Switch, Tag, message } from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import './AssessmentConfig.css';

// 模拟AI根据用户输入和资料结构生成考核方案
function generateAIResponse(userMsg, resources, currentAssessment) {
  const stages = resources.filter((r) => r.isFolder && r.parentKey === null);
  const activities = resources.filter((r) => r.isFolder && r.parentKey !== null);

  // 解析关键词
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
      r.activityName.includes('视频') ? { ...r, weight: w } : r
    );
    replyText = `好的，已将所有视频课的考核权重调整为 ${w}%。请检查右侧方案，确认权重总和是否为100%。如需进一步调整其他活动权重，请继续告诉我。`;
  } else if (mentionsAdjust && mentionsExam && mentionsWeight) {
    const w = parseInt(mentionsWeight[1]);
    newAssessment.rules = newAssessment.rules.map((r) =>
      (r.activityName.includes('考试') || r.activityName.includes('考核')) ? { ...r, weight: w } : r
    );
    replyText = `好的，已将考试/考核类活动权重调整为 ${w}%。请确认右侧方案。`;
  } else {
    // 全量生成方案
    if (mentionsHours) {
      newAssessment.totalHours = parseInt(mentionsHours[1]);
    }
    if (mentionsScore) {
      newAssessment.passScore = parseInt(mentionsScore[1]);
    }
    if (mentionsCert) {
      newAssessment.certificate = true;
    }

    // 基于资料结构自动分配权重
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
      const otherWeight = otherCount > 0
        ? Math.floor((100 - videoWeight * videoActivities.length / Math.max(videoActivities.length, 1) - examWeight * examActivities.length / Math.max(examActivities.length, 1)) / Math.max(otherCount, 1))
        : 5;

      // 简单的权重分配
      let totalW = 0;
      const rules = activities.map((act, idx) => {
        const stage = stages.find((s) => s.key === act.parentKey);
        const isVideo = videoActivities.includes(act);
        const isExam = examActivities.includes(act);
        let w;
        if (isVideo) w = Math.round(videoWeight / Math.max(videoActivities.length, 1));
        else if (isExam) w = Math.round(examWeight / Math.max(examActivities.length, 1));
        else w = Math.max(otherWeight, 3);
        totalW += w;

        let condition = '完成率>=80%';
        if (isExam) condition = '分数>=60分';
        else if (act.name.includes('直播') || act.name.includes('集训')) condition = '出勤率>=90%';
        else if (act.name.includes('作业') || act.name.includes('研讨')) condition = '提交率100%';

        return {
          key: `ar_${idx}`,
          activityKey: act.key,
          activityName: act.name,
          stageName: stage?.name || '',
          weight: w,
          passCondition: condition,
          required: isVideo || isExam,
        };
      });

      // 修正权重使总和为100
      if (rules.length > 0) {
        const diff = 100 - totalW;
        rules[0].weight += diff;
      }
      newAssessment.rules = rules;
    }

    const stageNames = stages.map((s) => s.name).join('、');
    replyText = `根据您的培训目标，我已基于当前资料结构生成考核方案：\n\n` +
      `📋 培训阶段：${stageNames}\n` +
      `⏱ 总学时：${newAssessment.totalHours} 学时\n` +
      `✅ 及格分：${newAssessment.passScore} 分\n` +
      `🏆 考核通过${newAssessment.certificate ? '发放证书' : '不发证书'}\n` +
      `📊 共 ${newAssessment.rules.length} 项考核规则\n\n` +
      `方案已在右侧展示，您可以直接在表格中微调各项权重和通过条件，也可以继续和我对话调整。\n\n` +
      `例如："把视频课权重提高到50%"、"考试权重调整为25%"`;
  }

  return { reply: replyText, assessment: newAssessment };
}

function AssessmentConfig({ assessment, assessmentChat, resources, isDraft, onUpdateAssessment, onUpdateChat }) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(assessmentChat || []);
  const [typing, setTyping] = useState(false);
  const [localAssessment, setLocalAssessment] = useState(assessment || { totalHours: 0, passScore: 60, certificate: false, rules: [] });
  const messagesEndRef = useRef(null);

  // 同步外部变更
  useEffect(() => {
    setLocalAssessment(assessment || { totalHours: 0, passScore: 60, certificate: false, rules: [] });
  }, [assessment]);
  useEffect(() => {
    setMessages(assessmentChat || []);
  }, [assessmentChat]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // 首次进入的欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      const stages = resources.filter((r) => r.isFolder && r.parentKey === null);
      const activities = resources.filter((r) => r.isFolder && r.parentKey !== null);
      const welcome = `你好！我是 AI 考核助手。\n\n当前培训项目包含 ${stages.length} 个阶段、${activities.length} 个培训活动。我可以帮你快速生成考核方案。\n\n你只需要告诉我培训目标，例如：\n• "这次培训总学时15学时，重点是视频学习，考试是辅助，考核通过发放证书"\n• "设置考核规则，视频权重50%，考试30%，其余活动均分"\n\n请描述你的考核需求：`;
      const initialMsgs = [{ role: 'assistant', content: welcome }];
      setMessages(initialMsgs);
      onUpdateChat(initialMsgs);
    }
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    if (!isDraft) { message.warning('当前版本不可编辑，请切换到草稿版本'); return; }

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setTyping(true);

    // 模拟AI延迟
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

  // 右侧手动编辑
  const handleRuleChange = (key, field, value) => {
    if (!isDraft) return;
    const newRules = localAssessment.rules.map((r) =>
      r.key === key ? { ...r, [field]: value } : r
    );
    const newA = { ...localAssessment, rules: newRules };
    setLocalAssessment(newA);
    onUpdateAssessment(newA);
  };

  const handleSummaryChange = (field, value) => {
    if (!isDraft) return;
    const newA = { ...localAssessment, [field]: value };
    setLocalAssessment(newA);
    onUpdateAssessment(newA);
  };

  const totalWeight = localAssessment.rules.reduce((sum, r) => sum + (r.weight || 0), 0);
  const weightColor = totalWeight === 100 ? '#52c41a' : totalWeight > 100 ? '#ff4d4f' : '#faad14';

  const columns = [
    {
      title: '阶段', dataIndex: 'stageName', key: 'stageName', width: 160,
      render: (text) => <span style={{ color: '#666', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '活动', dataIndex: 'activityName', key: 'activityName', width: 120,
      render: (text) => <Tag style={{ fontSize: 12 }}>{text}</Tag>,
    },
    {
      title: '必修', dataIndex: 'required', key: 'required', width: 70, align: 'center',
      render: (val, record) => (
        <Switch size="small" checked={val} disabled={!isDraft}
          onChange={(v) => handleRuleChange(record.key, 'required', v)} />
      ),
    },
    {
      title: '权重 %', dataIndex: 'weight', key: 'weight', width: 90, align: 'center',
      render: (val, record) => isDraft ? (
        <InputNumber size="small" min={0} max={100} value={val} style={{ width: 60 }}
          onChange={(v) => handleRuleChange(record.key, 'weight', v || 0)} />
      ) : <span>{val}%</span>,
    },
    {
      title: '通过条件', dataIndex: 'passCondition', key: 'passCondition',
      render: (val, record) => isDraft ? (
        <Input size="small" value={val} style={{ width: '100%' }}
          onChange={(e) => handleRuleChange(record.key, 'passCondition', e.target.value)} />
      ) : <span>{val}</span>,
    },
  ];

  return (
    <div className="assessment-layout">
      {/* 左侧 - AI对话区 */}
      <div className="chat-panel">
        <div className="chat-header">
          <RobotOutlined className="chat-header-icon" />
          <span>AI 考核助手</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg chat-msg-${msg.role === 'assistant' ? 'ai' : 'user'}`}>
              <div className="chat-msg-avatar">
                {msg.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />}
              </div>
              <div className="chat-msg-bubble">{msg.content}</div>
            </div>
          ))}
          {typing && (
            <div className="chat-typing">
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isDraft ? '描述你的考核需求...' : '当前版本不可编辑'}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={!isDraft}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}
            disabled={!isDraft || !inputValue.trim()} className="chat-send-btn">
            发送
          </Button>
        </div>
      </div>

      {/* 右侧 - 考核方案面板 */}
      <div className="plan-panel">
        <div className="plan-title">
          考核方案
          {!isDraft && <Tag color="default" className="plan-readonly-tag">只读</Tag>}
        </div>

        {localAssessment.rules.length > 0 ? (
          <>
            {/* 汇总卡片 */}
            <div className="plan-summary">
              <div className="plan-summary-card">
                <div className="plan-summary-card-icon" style={{ background: '#e8f4ff', color: '#1677ff' }}>
                  <ClockCircleOutlined />
                </div>
                <div className="plan-summary-card-info">
                  <span className="plan-summary-card-label">总学时</span>
                  {isDraft ? (
                    <InputNumber size="small" min={1} max={999} value={localAssessment.totalHours}
                      onChange={(v) => handleSummaryChange('totalHours', v || 0)} style={{ width: 70 }} />
                  ) : (
                    <span className="plan-summary-card-value">{localAssessment.totalHours} 学时</span>
                  )}
                </div>
              </div>
              <div className="plan-summary-card">
                <div className="plan-summary-card-icon" style={{ background: '#f0f5ff', color: '#722ed1' }}>
                  <TrophyOutlined />
                </div>
                <div className="plan-summary-card-info">
                  <span className="plan-summary-card-label">及格分</span>
                  {isDraft ? (
                    <InputNumber size="small" min={0} max={100} value={localAssessment.passScore}
                      onChange={(v) => handleSummaryChange('passScore', v || 0)} style={{ width: 70 }} />
                  ) : (
                    <span className="plan-summary-card-value">{localAssessment.passScore} 分</span>
                  )}
                </div>
              </div>
              <div className="plan-summary-card">
                <div className="plan-summary-card-icon" style={{ background: '#f6ffed', color: '#52c41a' }}>
                  <SafetyCertificateOutlined />
                </div>
                <div className="plan-summary-card-info">
                  <span className="plan-summary-card-label">合格发证</span>
                  {isDraft ? (
                    <Switch size="small" checked={localAssessment.certificate}
                      onChange={(v) => handleSummaryChange('certificate', v)} />
                  ) : (
                    <span className="plan-summary-card-value">{localAssessment.certificate ? '是' : '否'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 权重进度条 */}
            <div className="weight-bar">
              <span className="weight-bar-label">权重合计</span>
              <div className="weight-bar-track">
                <div className="weight-bar-fill"
                  style={{ width: `${Math.min(totalWeight, 100)}%`, background: weightColor }} />
              </div>
              <span className="weight-bar-value" style={{ color: weightColor }}>{totalWeight}%</span>
            </div>

            {/* 考核规则表格 */}
            <Table columns={columns} dataSource={localAssessment.rules} pagination={false}
              className="plan-table" size="small" />
          </>
        ) : (
          <div className="plan-empty">
            <FileSearchOutlined className="plan-empty-icon" />
            <span className="plan-empty-text">暂未生成考核方案</span>
            <span className="plan-empty-hint">在左侧对话中描述你的培训目标，AI将自动生成考核方案</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssessmentConfig;
