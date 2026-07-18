import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  AuditOutlined,
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  GiftOutlined,
  HistoryOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RiseOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import './PointsModule.css';
import {
  POINT_TASK_RULE_STORE_EVENT,
  formatConditions,
  getVisiblePointTaskRules,
  readPointTaskRules,
} from './pointsRuleStore';

const POINT_TYPE_OPTIONS = [
  { label: '全部类型', value: 'all' },
  { label: '学习', value: 'learning' },
  { label: '内测', value: 'beta' },
  { label: '反馈', value: 'feedback' },
  { label: 'UGC', value: 'ugc' },
  { label: '答疑', value: 'qa' },
  { label: '最佳实践', value: 'practice' },
];

const STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '已入账', value: 'credited' },
  { label: '待审核', value: 'pending' },
  { label: '已驳回', value: 'rejected' },
  { label: '人工调整', value: 'adjusted' },
];

const LEVELS = [
  {
    key: 'L1',
    name: 'L1 参与者',
    threshold: 30,
    tag: '基础贡献',
    benefits: ['获得果仁贡献者标识', '进入 UGC 专区展示', '可参与月度精选内容评选'],
  },
  {
    key: 'L2',
    name: 'L2 分享者',
    threshold: 100,
    tag: '稳定分享',
    benefits: ['自主分享优先排期', '新功能内测优先资格', '优秀内容 IM 推荐展示'],
  },
  {
    key: 'L3',
    name: 'L3 共创者',
    threshold: 200,
    tag: '产品共创',
    benefits: ['产品共创会邀请', '专项培训优先资格', '可申请空间结构诊断支持'],
  },
  {
    key: 'L4',
    name: 'L4 布道者',
    threshold: 400,
    tag: '标杆贡献',
    benefits: ['年度荣誉评选资格', '重点内容推荐展示', '优先参与功能访谈'],
  },
];

const INITIAL_DETAILS = [
  {
    id: 'd-001',
    time: '今天 10:32',
    action: '内测反馈被确认为有效建议',
    type: 'beta',
    source: '系统内测',
    points: 30,
    status: 'credited',
    reviewer: '运营负责人',
    result: '已入账',
  },
  {
    id: 'd-002',
    time: '昨天 18:20',
    action: '提交 UGC 自主分享主题',
    type: 'ugc',
    source: 'UGC 贡献专区',
    points: 40,
    status: 'pending',
    reviewer: '待审核',
    result: '排期确认中',
  },
  {
    id: 'd-003',
    time: '昨天 11:05',
    action: '完成果仁入门课程',
    type: 'learning',
    source: '研习社',
    points: 20,
    status: 'credited',
    reviewer: '系统模拟',
    result: '已入账',
  },
  {
    id: 'd-004',
    time: '07-15 16:48',
    action: '提交重复的问题反馈',
    type: 'feedback',
    source: '问题反馈区',
    points: 0,
    status: 'rejected',
    reviewer: '运营负责人',
    result: '与已有反馈重复',
  },
  {
    id: 'd-005',
    time: '07-14 09:12',
    action: '最佳实践案例被收录',
    type: 'practice',
    source: '资历库',
    points: 60,
    status: 'credited',
    reviewer: '运营负责人',
    result: '基础分 30 + 收录加分 30',
  },
  {
    id: 'd-006',
    time: '07-12 15:36',
    action: '月度积分校准',
    type: 'feedback',
    source: '积分管理',
    points: 5,
    status: 'adjusted',
    reviewer: '积分管理员',
    result: '人工补录',
  },
];

const INITIAL_REWARDS = [
  {
    id: 'reward-badge',
    title: '果仁贡献者电子证书发放权益',
    cost: 60,
    stock: 24,
    level: 'L1',
    type: '证书兑换',
    certificateLinked: true,
    desc: '兑换后由证书发放模块生成记录；证书不放入我的积分档案，仅本次兑换与积分产生关联。',
  },
  {
    id: 'reward-beta',
    title: '新功能内测优先资格',
    cost: 80,
    stock: 12,
    level: 'L2',
    type: '参与权益',
    desc: '后续重要功能内测时优先邀请，适合持续反馈用户。',
  },
  {
    id: 'reward-workshop',
    title: '果仁专题答疑席位',
    cost: 120,
    stock: 8,
    level: 'L2',
    type: '学习权益',
    desc: '可预约一次果仁系统专项答疑，聚焦空间、任务、问卷或资料沉淀。',
  },
  {
    id: 'reward-space',
    title: '空间结构诊断支持',
    cost: 180,
    stock: 5,
    level: 'L3',
    type: '支持权益',
    desc: '运营方协助梳理一个果仁空间的栏目、资料和任务结构。',
  },
  {
    id: 'reward-resource',
    title: '精选学习资源包',
    cost: 100,
    stock: 18,
    level: 'L1',
    type: '兑换奖励',
    desc: '包含果仁系统最佳实践、管理员手册和内测反馈模板。',
  },
  {
    id: 'reward-gift',
    title: '小额礼品兑换',
    cost: 220,
    stock: 6,
    level: 'L3',
    type: '兑换奖励',
    desc: '仅用于果仁系统运营激励，不与公司绩效或薪酬关联。',
  },
];

const LEADERBOARDS = {
  month: [
    { name: '张洪磊', team: '产品运营', level: 'L3 共创者', score: 245 },
    { name: '徐子安', team: '智能应用组', level: 'L2 分享者', score: 188 },
    { name: '杨金钰', team: '交付运营', level: 'L2 分享者', score: 166 },
    { name: '赵敏', team: '客户成功', level: 'L1 参与者', score: 124 },
    { name: '王子瑜', team: '产品研发', level: 'L1 参与者', score: 98 },
  ],
  ugc: [
    { name: '徐子安', team: '智能应用组', level: 'L2 分享者', score: 6 },
    { name: '张洪磊', team: '产品运营', level: 'L3 共创者', score: 5 },
    { name: '陈佳', team: '交付运营', level: 'L1 参与者', score: 3 },
    { name: '赵敏', team: '客户成功', level: 'L1 参与者', score: 2 },
  ],
  beta: [
    { name: '杨金钰', team: '交付运营', level: 'L2 分享者', score: 11 },
    { name: '王子瑜', team: '产品研发', level: 'L1 参与者', score: 9 },
    { name: '张洪磊', team: '产品运营', level: 'L3 共创者', score: 7 },
    { name: '赵敏', team: '客户成功', level: 'L1 参与者', score: 6 },
  ],
};

const STATUS_META = {
  credited: { label: '已入账', color: 'green', icon: <CheckCircleOutlined /> },
  pending: { label: '待审核', color: 'gold', icon: <ClockCircleOutlined /> },
  rejected: { label: '已驳回', color: 'red', icon: <CloseCircleOutlined /> },
  adjusted: { label: '人工调整', color: 'blue', icon: <AuditOutlined /> },
};

const TASK_STATUS_META = {
  available: { label: '可参与', color: 'blue' },
  pending: { label: '待审核', color: 'gold' },
  completed: { label: '已完成', color: 'green' },
};

const TYPE_LABEL_MAP = Object.fromEntries(POINT_TYPE_OPTIONS.map((item) => [item.value, item.label]));

function getTaskIcon(category) {
  const iconMap = {
    learning: <ReadOutlined />,
    beta: <ExperimentOutlined />,
    feedback: <QuestionCircleOutlined />,
    ugc: <BulbOutlined />,
    qa: <MessageOutlined />,
    practice: <FileTextOutlined />,
  };
  return iconMap[category] || <FileTextOutlined />;
}

function mapRuleToTask(rule, previousState = null) {
  return {
    id: `task-${rule.id}`,
    ruleId: rule.id,
    title: rule.taskTitle,
    category: rule.category,
    source: rule.sourceModule,
    points: rule.points,
    status: previousState?.status || 'available',
    progress: previousState?.progress ?? 0,
    desc: rule.taskDesc,
    icon: getTaskIcon(rule.category),
    eventName: rule.eventName,
    eventLabel: rule.eventLabel,
    conditionText: formatConditions(rule.conditionTree || rule.conditions),
    reviewMode: rule.reviewMode,
    limitMode: rule.limitMode,
    targetAudience: rule.targetAudience,
    validFrom: rule.validFrom,
    validTo: rule.validTo,
  };
}

function getInitialRuleTasks() {
  return getVisiblePointTaskRules(readPointTaskRules()).map((rule) => mapRuleToTask(rule));
}

function renderStatusTag(status) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <Tag color={meta.color} icon={meta.icon}>
      {meta.label}
    </Tag>
  );
}

function getCurrentLevel(points) {
  return [...LEVELS].reverse().find((level) => points >= level.threshold) || LEVELS[0];
}

function getNextLevel(points) {
  return LEVELS.find((level) => points < level.threshold) || null;
}

function renderLeaderboard(items, suffix = '分') {
  return (
    <div className="points-leader-list">
      {items.map((item, index) => (
        <div className="points-leader-row" key={`${item.name}-${item.score}`}>
          <span className="points-leader-rank">{index + 1}</span>
          <div>
            <div className="points-leader-name">{item.name}</div>
            <div className="points-leader-meta">{item.team} · {item.level}</div>
          </div>
          <div className="points-leader-score">{item.score}{suffix}</div>
        </div>
      ))}
    </div>
  );
}

export default function PointsUserModule() {
  const [currentPoints, setCurrentPoints] = useState(245);
  const [tasks, setTasks] = useState(getInitialRuleTasks);
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [rewards, setRewards] = useState(INITIAL_REWARDS);
  const [taskFilter, setTaskFilter] = useState('all');
  const [detailType, setDetailType] = useState('all');
  const [detailStatus, setDetailStatus] = useState('all');
  const [selectedReward, setSelectedReward] = useState(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [redeemRecords, setRedeemRecords] = useState([
    { id: 'r-001', title: '果仁贡献者电子证书发放权益', cost: 60, time: '07-10 14:30', status: '已触发证书发放' },
    { id: 'r-002', title: '精选学习资源包', cost: 100, time: '07-02 09:20', status: '已发放' },
  ]);

  const currentLevel = useMemo(() => getCurrentLevel(currentPoints), [currentPoints]);
  const nextLevel = useMemo(() => getNextLevel(currentPoints), [currentPoints]);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round((currentPoints / nextLevel.threshold) * 100))
    : 100;

  const filteredTasks = useMemo(() => (
    tasks.filter((task) => taskFilter === 'all' || task.category === taskFilter)
  ), [taskFilter, tasks]);

  const filteredDetails = useMemo(() => (
    details.filter((item) => (
      (detailType === 'all' || item.type === detailType)
      && (detailStatus === 'all' || item.status === detailStatus)
    ))
  ), [detailStatus, detailType, details]);

  const monthGain = details
    .filter((item) => item.status === 'credited' || item.status === 'adjusted')
    .reduce((sum, item) => sum + item.points, 0);

  const availableRewardCount = rewards.filter((item) => item.stock > 0 && currentPoints >= item.cost).length;

  useEffect(() => {
    const reloadRuleTasks = () => {
      setTasks((prev) => {
        const previousStateMap = new Map(prev.map((task) => [task.ruleId, { status: task.status, progress: task.progress }]));
        return getVisiblePointTaskRules(readPointTaskRules()).map((rule) => mapRuleToTask(rule, previousStateMap.get(rule.id)));
      });
    };
    window.addEventListener(POINT_TASK_RULE_STORE_EVENT, reloadRuleTasks);
    window.addEventListener('storage', reloadRuleTasks);
    return () => {
      window.removeEventListener(POINT_TASK_RULE_STORE_EVENT, reloadRuleTasks);
      window.removeEventListener('storage', reloadRuleTasks);
    };
  }, []);

  const detailColumns = [
    {
      title: '行为',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#172033' }}>{text}</div>
          <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.source} · {record.time}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (value) => <Tag>{TYPE_LABEL_MAP[value] || value}</Tag>,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 96,
      render: (value) => <span className={value >= 0 ? 'points-gain' : 'points-cost'}>{value >= 0 ? `+${value}` : value}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: renderStatusTag,
    },
    {
      title: '审核结果',
      dataIndex: 'result',
      key: 'result',
      width: 190,
    },
  ];

  const redeemColumns = [
    { title: '权益', dataIndex: 'title', key: 'title' },
    { title: '消耗积分', dataIndex: 'cost', key: 'cost', width: 110 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 130 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (value) => <Tag color="green">{value}</Tag> },
  ];

  const handleTaskSubmit = (task) => {
    if (task.status !== 'available') return;
    const nextStatus = task.reviewMode === '自动入账' ? 'completed' : 'pending';
    setTasks((prev) => prev.map((item) => (
      item.id === task.id ? { ...item, status: nextStatus, progress: 100 } : item
    )));
    if (task.reviewMode === '自动入账') {
      setCurrentPoints((prev) => prev + task.points);
    }
    setDetails((prev) => [
      {
        id: `d-${Date.now()}`,
        time: '刚刚',
        action: `${task.title}（${task.eventLabel}）`,
        type: task.category,
        source: task.source,
        points: task.points,
        status: task.reviewMode === '自动入账' ? 'credited' : 'pending',
        reviewer: task.reviewMode === '自动入账' ? '系统埋点' : '待审核',
        result: task.reviewMode === '自动入账'
          ? `埋点 ${task.eventName} 命中，已自动入账`
          : `埋点 ${task.eventName} 命中，等待${task.reviewMode}`,
      },
      ...prev,
    ]);
    message.success(task.reviewMode === '自动入账' ? '已模拟埋点触发，积分自动入账' : '已模拟埋点触发，等待运营审核');
  };

  const handleRedeem = () => {
    if (!selectedReward) return;
    if (currentPoints < selectedReward.cost) {
      message.warning('当前积分不足，暂不能兑换该权益');
      return;
    }
    if (selectedReward.stock <= 0) {
      message.warning('该权益库存不足');
      return;
    }
    setCurrentPoints((prev) => prev - selectedReward.cost);
    setRewards((prev) => prev.map((item) => (
      item.id === selectedReward.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item
    )));
    setRedeemRecords((prev) => [
      {
        id: `r-${Date.now()}`,
        title: selectedReward.title,
        cost: selectedReward.cost,
        time: '刚刚',
        status: '处理中',
      },
      ...prev,
    ]);
    setSelectedReward(null);
    message.success(selectedReward.certificateLinked
      ? '兑换申请已提交，后续由证书发放模块处理'
      : '兑换申请已提交，运营方将在积分记录中跟进');
  };

  const tabItems = [
    {
      key: 'tasks',
      label: '积分任务',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <div className="points-toolbar">
              <Segmented
                value={taskFilter}
                onChange={setTaskFilter}
                options={POINT_TYPE_OPTIONS.slice(0, 7)}
              />
              <div className="points-toolbar-right">
                <Button icon={<QuestionCircleOutlined />} onClick={() => setAppealOpen(true)}>积分异议</Button>
              </div>
            </div>
            <div className="points-rule-user-note">
              积分任务由“积分管理”的事件型任务规则发布。用户完成系统内真实行为后，由已埋点事件触发积分计算；我的积分只聚合展示可参与任务。
            </div>
          </Card>
          <div className="points-task-grid">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="points-task-card">
                <div className="points-task-head">
                  <div>
                    <Space>
                      {task.icon}
                      <span className="points-task-title">{task.title}</span>
                    </Space>
                    <div className="points-task-desc">{task.desc}</div>
                  </div>
                  <Tag color={TASK_STATUS_META[task.status]?.color}>{TASK_STATUS_META[task.status]?.label}</Tag>
                </div>
                <div className="points-task-rule-meta">
                  <Tag>{task.source}</Tag>
                  <Tag color="blue">{task.eventName}</Tag>
                  <Tag color={task.reviewMode === '自动入账' ? 'green' : 'gold'}>{task.reviewMode}</Tag>
                </div>
                <div className="points-task-condition">触发条件：{task.conditionText}</div>
                <div style={{ marginTop: 14 }}>
                  <Progress percent={task.progress} size="small" />
                </div>
                <div className="points-task-foot">
                  <span className="points-gain">+{task.points} 分</span>
                  <Button
                    type={task.status === 'available' ? 'primary' : 'default'}
                    disabled={task.status !== 'available'}
                    onClick={() => handleTaskSubmit(task)}
                  >
                    {task.status === 'available' ? '模拟触发/提交证明' : TASK_STATUS_META[task.status]?.label}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      label: '积分明细',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <div className="points-toolbar">
              <Select value={detailType} onChange={setDetailType} options={POINT_TYPE_OPTIONS} style={{ width: 150 }} />
              <Select value={detailStatus} onChange={setDetailStatus} options={STATUS_OPTIONS} style={{ width: 140 }} />
              <div className="points-toolbar-right">
                <Button icon={<HistoryOutlined />} onClick={() => message.info('明细已按当前筛选模拟刷新')}>刷新明细</Button>
              </div>
            </div>
          </Card>
          <Card className="points-panel-card points-table-card">
            <Table
              rowKey="id"
              columns={detailColumns}
              dataSource={filteredDetails}
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'rewards',
      label: '兑换中心',
      children: (
        <div className="points-tab-pane">
          <div className="points-reward-grid">
            {rewards.map((reward) => (
              <Card key={reward.id} className="points-reward-card">
                <div className="points-reward-head">
                  <div>
                    <div className="points-reward-title">{reward.title}</div>
                    <div className="points-reward-desc">{reward.desc}</div>
                  </div>
                  <Tag color="blue">{reward.type}</Tag>
                </div>
                <div className="points-reward-foot">
                  <Space>
                    <span className="points-cost">{reward.cost} 分</span>
                    <Tag>{reward.level}</Tag>
                    <Tag color={reward.stock > 0 ? 'green' : 'red'}>库存 {reward.stock}</Tag>
                  </Space>
                  <Button
                    type="primary"
                    disabled={reward.stock <= 0}
                    onClick={() => setSelectedReward(reward)}
                  >
                    兑换
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Card title="兑换记录" className="points-panel-card points-table-card">
            <Table rowKey="id" columns={redeemColumns} dataSource={redeemRecords} pagination={false} />
          </Card>
        </div>
      ),
    },
    {
      key: 'levels',
      label: '等级权益',
      children: (
        <div className="points-tab-pane">
          <div className="points-level-grid">
            {LEVELS.map((level) => (
              <Card key={level.key} className={`points-level-card ${level.key === currentLevel.key ? 'is-current' : ''}`}>
                <div className="points-level-card-title">
                  <span>{level.name}</span>
                  <Tag color={level.key === currentLevel.key ? 'blue' : 'default'}>{level.tag}</Tag>
                </div>
                <div className="points-level-threshold">达到 {level.threshold} 分解锁</div>
                <ul className="points-benefit-list">
                  {level.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'leaderboard',
      label: '贡献榜',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <Tabs
              items={[
                { key: 'month', label: '本月贡献榜', children: renderLeaderboard(LEADERBOARDS.month) },
                { key: 'ugc', label: 'UGC 分享榜', children: renderLeaderboard(LEADERBOARDS.ugc, '次') },
                { key: 'beta', label: '内测反馈榜', children: renderLeaderboard(LEADERBOARDS.beta, '条') },
              ]}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="points-module">
      <div className="points-header">
        <div className="points-header-main">
          <div className="points-title">
            <TrophyOutlined className="points-title-icon" />
            我的积分
          </div>
          <div className="points-subtitle">果仁系统运营积分，仅用于果仁学习、内测、反馈、UGC 和权益兑换。</div>
        </div>
        <div className="points-header-actions">
          <Button icon={<GiftOutlined />} onClick={() => setSelectedReward(rewards[0])}>快速兑换</Button>
          <Button type="primary" icon={<StarOutlined />} onClick={() => message.success('已模拟报名 UGC 自主分享')}>发起分享</Button>
        </div>
      </div>

      <div className="points-content">
        <Card className="points-hero-card">
          <div className="points-hero">
            <div className="points-hero-main">
              <span className="points-hero-kicker">
                <RiseOutlined />
                当前等级 {currentLevel.name}
              </span>
              <div className="points-hero-value">
                <strong>{currentPoints}</strong>
                <span>可用积分</span>
              </div>
              <div className="points-hero-desc">
                积分来自果仁系统学习、内测反馈、UGC 分享、答疑和最佳实践沉淀。积分只服务果仁系统运营激励，不表达公司级绩效或薪酬含义。
              </div>
              <div className="points-hero-actions">
                <Tag color="green">本月新增 +{monthGain}</Tag>
                <Tag color="blue">可兑换权益 {availableRewardCount} 项</Tag>
                <Tag color="gold">待审核 {details.filter((item) => item.status === 'pending').length} 项</Tag>
              </div>
            </div>
            <div className="points-level-panel">
              <div className="points-level-head">
                <div>
                  <div className="points-level-name">{nextLevel ? `距 ${nextLevel.name}` : '已达最高等级'}</div>
                  <div className="points-level-meta">
                    {nextLevel ? `还差 ${Math.max(0, nextLevel.threshold - currentPoints)} 分可解锁下一等级权益` : '继续贡献可参与年度荣誉评选'}
                  </div>
                </div>
                <Tag color="blue">{currentLevel.key}</Tag>
              </div>
              <Progress percent={levelProgress} />
              <ul className="points-benefit-list">
                {currentLevel.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
            </div>
          </div>
        </Card>

        <div className="points-summary-grid">
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">本月新增</span>
              <span className="points-summary-icon"><RiseOutlined /></span>
            </div>
            <div className="points-summary-value">+{monthGain}</div>
            <div className="points-summary-hint">包含内测、学习、最佳实践和人工补录。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">待审核贡献</span>
              <span className="points-summary-icon"><ClockCircleOutlined /></span>
            </div>
            <div className="points-summary-value">{details.filter((item) => item.status === 'pending').length}</div>
            <div className="points-summary-hint">审核通过后积分会模拟入账。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">已兑换权益</span>
              <span className="points-summary-icon"><GiftOutlined /></span>
            </div>
            <div className="points-summary-value">{redeemRecords.length}</div>
            <div className="points-summary-hint">可在兑换记录中查看处理状态。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">UGC 收录</span>
              <span className="points-summary-icon"><BookOutlined /></span>
            </div>
            <div className="points-summary-value">5</div>
            <div className="points-summary-hint">精选内容已进入资料区、资历库或研习社。</div>
          </Card>
        </div>

        <Card className="points-panel-card">
          <Tabs className="points-tabs" items={tabItems} />
        </Card>
      </div>

      <Modal
        title="确认兑换权益"
        open={Boolean(selectedReward)}
        onOk={handleRedeem}
        onCancel={() => setSelectedReward(null)}
        okText="确认兑换"
        cancelText="取消"
      >
        {selectedReward ? (
          <div className="points-detail-block">
            <div className="points-detail-row">
              <span className="points-detail-label">权益名称</span>
              <span className="points-detail-value">{selectedReward.title}</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">所需积分</span>
              <span className="points-detail-value">{selectedReward.cost} 分</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">当前积分</span>
              <span className="points-detail-value">{currentPoints} 分</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">说明</span>
              <span className="points-detail-value">{selectedReward.desc}</span>
            </div>
            {selectedReward.certificateLinked ? (
              <div className="points-empty-note">
                证书与“我的积分”解耦：本页面只提交证书权益兑换结果，证书模板、发放批次和归档仍在证书模块中独立处理。
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Drawer
        title="积分异议反馈"
        open={appealOpen}
        onClose={() => setAppealOpen(false)}
        width={420}
        extra={<Button type="primary" onClick={() => { setAppealOpen(false); message.success('异议已提交，运营方会在积分台账中跟进'); }}>提交</Button>}
      >
        <div className="points-detail-block">
          <div className="points-empty-note">
            仅处理果仁系统积分相关异议，例如积分未入账、审核结果疑问、兑换记录异常等。
          </div>
          <Input placeholder="请选择或填写关联积分记录" />
          <Input.TextArea rows={6} placeholder="请说明异议原因、关联场景和期望处理结果" />
        </div>
      </Drawer>
    </div>
  );
}
