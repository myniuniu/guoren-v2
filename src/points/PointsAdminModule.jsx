import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  EditOutlined,
  FileProtectOutlined,
  GiftOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import './PointsModule.css';
import {
  CONDITION_OPERATOR_OPTIONS,
  LIMIT_MODE_OPTIONS,
  POINT_EVENT_CATALOG,
  REVIEW_MODE_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  cloneConditionTree,
  createConditionGroup,
  createConditionLeaf,
  createPointTaskRule,
  findPointEvent,
  formatConditions,
  normalizeConditionTree,
  readPointTaskRules,
  validateConditionTree,
  writePointTaskRules,
} from './pointsRuleStore';

const CATEGORY_OPTIONS = [
  { label: '全部场景', value: 'all' },
  { label: '学习', value: 'learning' },
  { label: '内测', value: 'beta' },
  { label: '反馈', value: 'feedback' },
  { label: 'UGC', value: 'ugc' },
  { label: '答疑', value: 'qa' },
  { label: '最佳实践', value: 'practice' },
];

const REVIEW_STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(CATEGORY_OPTIONS.map((item) => [item.value, item.label]));

const INITIAL_RULES = [
  {
    id: 'rule-learning',
    name: '完成果仁课程学习',
    category: 'learning',
    points: 20,
    reviewMode: '自动入账',
    enabled: true,
    limit: '每门课程计一次',
    desc: '完成研习社中的果仁系统课程，并提交课程反馈后计分。',
  },
  {
    id: 'rule-beta-feedback',
    name: '提交有效内测反馈',
    category: 'beta',
    points: 30,
    reviewMode: '运营审核',
    enabled: true,
    limit: '同一问题不重复计分',
    desc: '参与果仁新功能内测，提交可复现、可验证的反馈。',
  },
  {
    id: 'rule-defect',
    name: '确认有效缺陷或重要优化建议',
    category: 'feedback',
    points: 50,
    reviewMode: '产品确认',
    enabled: true,
    limit: '按问题价值追加',
    desc: '反馈被确认为有效缺陷或关键优化建议后追加积分。',
  },
  {
    id: 'rule-ugc-share',
    name: '发起 UGC 自主分享',
    category: 'ugc',
    points: 40,
    reviewMode: '运营审核',
    enabled: true,
    limit: '需完成分享并留存资料',
    desc: '自主发起果仁使用技巧、场景案例、内测体验或模板方法分享。',
  },
  {
    id: 'rule-template',
    name: '贡献可复用模板',
    category: 'ugc',
    points: 20,
    reviewMode: '运营审核',
    enabled: true,
    limit: '收录后计分',
    desc: '贡献空间结构、任务、问卷、反馈或复盘模板。',
  },
  {
    id: 'rule-faq',
    name: '补充 FAQ 或问题复盘',
    category: 'feedback',
    points: 15,
    reviewMode: '运营审核',
    enabled: true,
    limit: '重复问题不计分',
    desc: '将高频问题整理为可复用 FAQ 或问题复盘。',
  },
  {
    id: 'rule-practice',
    name: '最佳实践被收录',
    category: 'practice',
    points: 60,
    reviewMode: '运营审核',
    enabled: true,
    limit: '含基础分与收录加分',
    desc: '使用案例被收录到资历库、资料区或研习社课程。',
  },
  {
    id: 'rule-answer',
    name: '答疑贡献被采纳',
    category: 'qa',
    points: 10,
    reviewMode: '运营审核',
    enabled: false,
    limit: '需有采纳记录',
    desc: '在 IM、空间或研讨会中帮助其他员工解决果仁使用问题。',
  },
];

const INITIAL_REVIEWS = [
  {
    id: 'review-001',
    user: '徐子安',
    team: '智能应用组',
    action: 'UGC 自主分享：空间资料沉淀方法',
    category: 'ugc',
    points: 40,
    source: 'UGC 贡献专区',
    submittedAt: '今天 09:42',
    status: 'pending',
    evidence: '已提交分享大纲、演示视频和资料区链接。',
  },
  {
    id: 'review-002',
    user: '杨金钰',
    team: '交付运营',
    action: '内测反馈：问卷结果导出字段不清晰',
    category: 'beta',
    points: 30,
    source: '系统内测',
    submittedAt: '今天 11:10',
    status: 'pending',
    evidence: '包含复现路径、截图和期望字段说明。',
  },
  {
    id: 'review-003',
    user: '赵敏',
    team: '客户成功',
    action: 'FAQ 补充：如何找回空间资料',
    category: 'feedback',
    points: 15,
    source: '资历库',
    submittedAt: '昨天 16:28',
    status: 'pending',
    evidence: '已按 FAQ 模板补充步骤、适用范围和注意事项。',
  },
  {
    id: 'review-004',
    user: '张洪磊',
    team: '产品运营',
    action: '最佳实践案例：内测反馈闭环',
    category: 'practice',
    points: 60,
    source: '最佳实践库',
    submittedAt: '昨天 10:12',
    status: 'approved',
    evidence: '案例已收录并转为研习社短课。',
  },
  {
    id: 'review-005',
    user: '王子瑜',
    team: '产品研发',
    action: '重复提交：任务状态筛选问题',
    category: 'feedback',
    points: 0,
    source: '问题反馈区',
    submittedAt: '07-15 18:32',
    status: 'rejected',
    evidence: '与 review-002 反馈重复，已合并处理。',
  },
];

const INITIAL_REWARDS = [
  { id: 'reward-badge', title: '果仁贡献者电子证书发放权益', type: '证书兑换', cost: 60, stock: 24, level: 'L1', status: 'enabled', linkMode: '仅兑换成功后触发证书发放模块' },
  { id: 'reward-beta', title: '新功能内测优先资格', type: '参与权益', cost: 80, stock: 12, level: 'L2', status: 'enabled' },
  { id: 'reward-workshop', title: '果仁专题答疑席位', type: '学习权益', cost: 120, stock: 8, level: 'L2', status: 'enabled' },
  { id: 'reward-space', title: '空间结构诊断支持', type: '支持权益', cost: 180, stock: 5, level: 'L3', status: 'enabled' },
  { id: 'reward-resource', title: '精选学习资源包', type: '兑换奖励', cost: 100, stock: 18, level: 'L1', status: 'enabled' },
  { id: 'reward-gift', title: '小额礼品兑换', type: '兑换奖励', cost: 220, stock: 6, level: 'L3', status: 'disabled' },
];

const INITIAL_LEDGER = [
  { id: 'ledger-001', user: '张洪磊', action: '最佳实践案例被收录', category: 'practice', points: 60, source: '资历库', operator: '运营负责人', status: '已入账', time: '昨天 10:25' },
  { id: 'ledger-002', user: '徐子安', action: '提交 UGC 分享主题', category: 'ugc', points: 40, source: 'UGC 贡献专区', operator: '待审核', status: '待审核', time: '今天 09:42' },
  { id: 'ledger-003', user: '杨金钰', action: '内测有效反馈', category: 'beta', points: 30, source: '系统内测', operator: '待审核', status: '待审核', time: '今天 11:10' },
  { id: 'ledger-004', user: '赵敏', action: 'FAQ 补充', category: 'feedback', points: 15, source: '资历库', operator: '待审核', status: '待审核', time: '昨天 16:28' },
  { id: 'ledger-005', user: '王子瑜', action: '重复问题反馈', category: 'feedback', points: 0, source: '问题反馈区', operator: '运营负责人', status: '已驳回', time: '07-15 18:32' },
  { id: 'ledger-006', user: '陈佳', action: '果仁课程学习完成', category: 'learning', points: 20, source: '研习社', operator: '系统模拟', status: '已入账', time: '07-14 09:10' },
  { id: 'ledger-007', user: '张洪磊', action: '月度积分校准', category: 'feedback', points: 5, source: '积分管理', operator: '积分管理员', status: '人工调整', time: '07-12 15:36' },
];

const LEADERS = [
  { name: '张洪磊', team: '产品运营', level: 'L3 共创者', points: 245, ugc: 5, beta: 7 },
  { name: '徐子安', team: '智能应用组', level: 'L2 分享者', points: 188, ugc: 6, beta: 4 },
  { name: '杨金钰', team: '交付运营', level: 'L2 分享者', points: 166, ugc: 2, beta: 11 },
  { name: '赵敏', team: '客户成功', level: 'L1 参与者', points: 124, ugc: 2, beta: 6 },
  { name: '王子瑜', team: '产品研发', level: 'L1 参与者', points: 98, ugc: 1, beta: 9 },
  { name: '陈佳', team: '交付运营', level: 'L1 参与者', points: 82, ugc: 3, beta: 2 },
];

const ANOMALIES = [
  { id: 'a-001', type: '重复提交', user: '王子瑜', detail: '同一任务状态筛选问题 24 小时内提交 3 次。', level: '中', time: '07-15 18:32', status: '已合并' },
  { id: 'a-002', type: '短时高频', user: '徐子安', detail: 'UGC 模板贡献 10 分钟内连续提交 5 条，需抽样复核。', level: '低', time: '今天 09:58', status: '待复核' },
  { id: 'a-003', type: '人工调整', user: '张洪磊', detail: '月度积分校准 +5 分，已记录调整原因。', level: '低', time: '07-12 15:36', status: '已记录' },
];

const REVIEW_STATUS_META = {
  pending: { label: '待审核', color: 'gold' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
};

function renderReviewStatus(status) {
  const meta = REVIEW_STATUS_META[status] || REVIEW_STATUS_META.pending;
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function renderLeaderRows(metric = 'points') {
  const suffix = metric === 'points' ? '分' : '次';
  return (
    <div className="points-leader-list">
      {[...LEADERS]
        .sort((left, right) => right[metric] - left[metric])
        .map((item, index) => (
          <div className="points-leader-row" key={`${metric}-${item.name}`}>
            <span className="points-leader-rank">{index + 1}</span>
            <div>
              <div className="points-leader-name">{item.name}</div>
              <div className="points-leader-meta">{item.team} · {item.level}</div>
            </div>
            <div className="points-leader-score">{item[metric]}{suffix}</div>
          </div>
        ))}
    </div>
  );
}

const CONDITION_GROUP_LOGIC_OPTIONS = [
  { label: '满足全部 AND', value: 'AND' },
  { label: '满足任一 OR', value: 'OR' },
];

function getConditionFieldOptions(eventFields = [], currentField) {
  const fields = [...eventFields];
  if (currentField && !fields.includes(currentField)) fields.unshift(currentField);
  return fields.map((field) => ({ label: field, value: field }));
}

function updateConditionTreeNode(tree, path, updater) {
  if (!path.length) return updater(tree);
  const [targetIndex, ...restPath] = path;
  return {
    ...tree,
    children: (tree.children || []).map((child, index) => (
      index === targetIndex ? updateConditionTreeNode(child, restPath, updater) : child
    )),
  };
}

function removeConditionTreeNode(tree, path) {
  if (!path.length) return tree;
  const [targetIndex, ...restPath] = path;
  if (!restPath.length) {
    return {
      ...tree,
      children: (tree.children || []).filter((_, index) => index !== targetIndex),
    };
  }
  return {
    ...tree,
    children: (tree.children || []).map((child, index) => (
      index === targetIndex ? removeConditionTreeNode(child, restPath) : child
    )),
  };
}

function appendConditionTreeNode(tree, path, childNode) {
  return updateConditionTreeNode(tree, path, (node) => ({
    ...node,
    children: [...(node.children || []), childNode],
  }));
}

function ConditionTreeEditor({ tree, eventFields, onChange }) {
  const normalizedTree = normalizeConditionTree(tree);
  const defaultField = eventFields[0] || 'type';

  const updateNode = (path, updater) => {
    onChange(updateConditionTreeNode(normalizedTree, path, updater));
  };

  const removeNode = (path) => {
    onChange(removeConditionTreeNode(normalizedTree, path));
  };

  const appendNode = (path, node) => {
    onChange(appendConditionTreeNode(normalizedTree, path, node));
  };

  const renderCondition = (condition, path) => (
    <div className="points-condition-row" key={path.join('-')}>
      <Select
        value={condition.field}
        options={getConditionFieldOptions(eventFields, condition.field)}
        onChange={(value) => updateNode(path, (node) => ({ ...node, field: value }))}
      />
      <Select
        value={condition.operator}
        options={CONDITION_OPERATOR_OPTIONS}
        onChange={(value) => updateNode(path, (node) => ({
          ...node,
          operator: value,
          value: value === 'exists' ? '' : node.value || '有效',
        }))}
      />
      <Input
        value={condition.value}
        disabled={condition.operator === 'exists'}
        onChange={(event) => updateNode(path, (node) => ({ ...node, value: event.target.value }))}
        placeholder={condition.operator === 'exists' ? '无需填写条件值' : '条件值'}
      />
      <Button danger onClick={() => removeNode(path)}>删除</Button>
    </div>
  );

  const renderGroup = (group, path = []) => {
    const isRoot = path.length === 0;
    return (
      <div className={`points-condition-group ${isRoot ? 'is-root' : ''}`} key={isRoot ? 'root' : path.join('-')}>
        <div className="points-condition-group-head">
          <div className="points-condition-group-title">
            <Tag color={group.logic === 'AND' ? 'blue' : 'purple'}>{isRoot ? '根条件组' : '条件组'}</Tag>
            <Select
              value={group.logic}
              options={CONDITION_GROUP_LOGIC_OPTIONS}
              onChange={(value) => updateNode(path, (node) => ({ ...node, logic: value }))}
              style={{ width: 150 }}
            />
          </div>
          <Space wrap>
            <Button size="small" onClick={() => appendNode(path, createConditionLeaf(defaultField, 'eq', '有效'))}>添加条件</Button>
            <Button
              size="small"
              onClick={() => appendNode(path, createConditionGroup('AND', [createConditionLeaf(defaultField, 'eq', '有效')]))}
            >
              添加子条件组
            </Button>
            {!isRoot ? (
              <Button size="small" danger onClick={() => removeNode(path)}>删除组</Button>
            ) : null}
          </Space>
        </div>
        <div className="points-condition-children">
          {(group.children || []).length ? (
            group.children.map((child, index) => {
              const childPath = [...path, index];
              return child.type === 'group' ? renderGroup(child, childPath) : renderCondition(child, childPath);
            })
          ) : (
            <div className="points-condition-empty">当前条件组为空，保存前请添加条件或删除该组。</div>
          )}
        </div>
      </div>
    );
  };

  return <div className="points-condition-tree">{renderGroup(normalizedTree)}</div>;
}

export default function PointsAdminModule() {
  const [taskRules, setTaskRules] = useState(() => readPointTaskRules());
  const [rules, setRules] = useState(INITIAL_RULES);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [rewards, setRewards] = useState(INITIAL_REWARDS);
  const [ledger, setLedger] = useState(INITIAL_LEDGER);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [reviewCategory, setReviewCategory] = useState('all');
  const [ledgerKeyword, setLedgerKeyword] = useState('');
  const [ledgerCategory, setLedgerCategory] = useState('all');
  const [taskRuleCategory, setTaskRuleCategory] = useState('all');
  const [taskRuleKeyword, setTaskRuleKeyword] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [taskRuleDraft, setTaskRuleDraft] = useState(null);
  const [ruleDraft, setRuleDraft] = useState(null);
  const [rewardDraft, setRewardDraft] = useState(null);
  const [boardPeriod, setBoardPeriod] = useState('本月');
  const [boardMetric, setBoardMetric] = useState('points');
  const [boardPublic, setBoardPublic] = useState(true);

  const pendingCount = reviews.filter((item) => item.status === 'pending').length;
  const approvedCount = reviews.filter((item) => item.status === 'approved').length;
  const totalIssued = ledger
    .filter((item) => item.status === '已入账' || item.status === '人工调整')
    .reduce((sum, item) => sum + item.points, 0);

  const publishedTaskRuleCount = taskRules.filter((item) => item.enabled && item.taskDisplay).length;

  const filteredReviews = useMemo(() => (
    reviews.filter((item) => (
      (reviewStatus === 'all' || item.status === reviewStatus)
      && (reviewCategory === 'all' || item.category === reviewCategory)
    ))
  ), [reviewCategory, reviewStatus, reviews]);

  const filteredLedger = useMemo(() => {
    const keyword = ledgerKeyword.trim().toLowerCase();
    return ledger.filter((item) => (
      (ledgerCategory === 'all' || item.category === ledgerCategory)
      && (!keyword || `${item.user} ${item.action} ${item.source} ${item.operator}`.toLowerCase().includes(keyword))
    ));
  }, [ledger, ledgerCategory, ledgerKeyword]);

  const filteredTaskRules = useMemo(() => {
    const keyword = taskRuleKeyword.trim().toLowerCase();
    return taskRules.filter((item) => (
      (taskRuleCategory === 'all' || item.category === taskRuleCategory)
      && (!keyword || `${item.name} ${item.taskTitle} ${item.eventName} ${item.sourceModule}`.toLowerCase().includes(keyword))
    ));
  }, [taskRuleCategory, taskRuleKeyword, taskRules]);

  const persistTaskRules = (updater) => {
    setTaskRules((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writePointTaskRules(next);
      return next;
    });
  };

  const openNewTaskRule = () => {
    setTaskRuleDraft(createPointTaskRule());
  };

  const updateTaskRuleDraftEvent = (eventName) => {
    const event = findPointEvent(eventName);
    setTaskRuleDraft((prev) => ({
      ...prev,
      eventName: event.eventName,
      eventLabel: event.eventLabel,
      sourceModule: event.sourceModule,
      category: event.category,
      points: event.defaultPoints,
      taskTitle: event.defaultTaskTitle,
      taskDesc: event.defaultTaskDesc,
      conditionTree: createConditionGroup('AND', [
        createConditionLeaf(event.conditionFields[0] || 'type', 'eq', '有效'),
      ]),
    }));
  };

  const handleSaveTaskRule = () => {
    if (!taskRuleDraft?.name?.trim()) {
      message.warning('请填写任务规则名称');
      return;
    }
    if (!taskRuleDraft?.eventName) {
      message.warning('请选择系统埋点事件');
      return;
    }
    if (!taskRuleDraft?.taskTitle?.trim()) {
      message.warning('请填写用户侧任务标题');
      return;
    }
    const conditionValidation = validateConditionTree(taskRuleDraft.conditionTree);
    if (!conditionValidation.valid) {
      message.warning(conditionValidation.message);
      return;
    }
    const event = findPointEvent(taskRuleDraft.eventName);
    const normalized = {
      ...taskRuleDraft,
      eventLabel: event.eventLabel,
      sourceModule: taskRuleDraft.sourceModule || event.sourceModule,
      category: taskRuleDraft.category || event.category,
      points: Number(taskRuleDraft.points) || 0,
      conditionTree: conditionValidation.tree,
    };
    delete normalized.conditions;
    persistTaskRules((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      return exists
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...prev];
    });
    setTaskRuleDraft(null);
    message.success('任务规则已保存并同步到我的积分');
  };

  const handleCopyTaskRule = (rule) => {
    const copied = {
      ...rule,
      id: `ptr-${Date.now()}`,
      name: `${rule.name} 副本`,
      enabled: false,
      conditionTree: cloneConditionTree(rule.conditionTree || rule.conditions),
    };
    delete copied.conditions;
    persistTaskRules((prev) => [copied, ...prev]);
    message.success('已复制任务规则，可继续编辑后启用');
  };

  const handleSimulateTaskRule = (rule) => {
    if (rule.reviewMode === '自动入账') {
      setLedger((prev) => [
        {
          id: `ledger-${Date.now()}`,
          user: '模拟用户',
          action: rule.taskTitle,
          category: rule.category,
          points: rule.points,
          source: rule.sourceModule,
          operator: '系统埋点',
          status: '已入账',
          time: '刚刚',
        },
        ...prev,
      ]);
      message.success('已模拟埋点命中，积分自动入账');
      return;
    }
    setReviews((prev) => [
      {
        id: `review-${Date.now()}`,
        user: '模拟用户',
        team: rule.targetAudience,
        action: rule.taskTitle,
        category: rule.category,
        points: rule.points,
        source: rule.sourceModule,
        submittedAt: '刚刚',
        status: 'pending',
        evidence: `埋点事件 ${rule.eventName} 命中；条件：${formatConditions(rule.conditionTree || rule.conditions)}`,
      },
      ...prev,
    ]);
    message.success('已模拟埋点命中，进入积分审核');
  };

  const handleReview = (record, status) => {
    const nextStatusText = status === 'approved' ? '已入账' : '已驳回';
    setReviews((prev) => prev.map((item) => (
      item.id === record.id ? { ...item, status } : item
    )));
    setLedger((prev) => [
      {
        id: `ledger-${Date.now()}`,
        user: record.user,
        action: record.action,
        category: record.category,
        points: status === 'approved' ? record.points : 0,
        source: record.source,
        operator: '积分管理员',
        status: nextStatusText,
        time: '刚刚',
      },
      ...prev,
    ]);
    message.success(status === 'approved' ? '已通过审核并模拟入账' : '已驳回该积分申请');
  };

  const handleCopyRule = (rule) => {
    const copied = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} 副本`,
      enabled: false,
    };
    setRules((prev) => [copied, ...prev]);
    message.success('已复制积分规则，可继续编辑');
  };

  const handleSaveRule = () => {
    if (!ruleDraft?.name?.trim()) {
      message.warning('请填写规则名称');
      return;
    }
    setRules((prev) => prev.map((item) => (
      item.id === ruleDraft.id ? ruleDraft : item
    )));
    setRuleDraft(null);
    message.success('积分规则已保存');
  };

  const handleSaveReward = () => {
    if (!rewardDraft?.title?.trim()) {
      message.warning('请填写权益名称');
      return;
    }
    setRewards((prev) => prev.map((item) => (
      item.id === rewardDraft.id ? rewardDraft : item
    )));
    setRewardDraft(null);
    message.success('权益配置已保存');
  };

  const reviewColumns = [
    {
      title: '贡献内容',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => (
        <div>
          <div style={{ color: '#172033', fontWeight: 600 }}>{text}</div>
          <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.user} · {record.team} · {record.submittedAt}</div>
        </div>
      ),
    },
    {
      title: '场景',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (value) => <Tag>{CATEGORY_LABEL_MAP[value] || value}</Tag>,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 90,
      render: (value) => <span className="points-gain">+{value}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: renderReviewStatus,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setSelectedReview(record)}>详情</Button>
          <Button size="small" type="primary" disabled={record.status !== 'pending'} onClick={() => handleReview(record, 'approved')}>通过</Button>
          <Button size="small" danger disabled={record.status !== 'pending'} onClick={() => handleReview(record, 'rejected')}>驳回</Button>
        </Space>
      ),
    },
  ];

  const taskRuleColumns = [
    {
      title: '任务规则',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ color: '#172033', fontWeight: 600 }}>{text}</div>
          <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.taskTitle}</div>
          <div className="points-inline-note">{record.taskDesc}</div>
        </div>
      ),
    },
    {
      title: '绑定事件',
      dataIndex: 'eventName',
      key: 'eventName',
      width: 220,
      render: (value, record) => (
        <div>
          <Tag color="blue">{record.sourceModule}</Tag>
          <div className="points-event-code">{value}</div>
        </div>
      ),
    },
    {
      title: '触发条件',
      dataIndex: 'conditionTree',
      key: 'conditionTree',
      width: 300,
      render: (value, record) => <span className="points-rule-condition">{formatConditions(value || record.conditions)}</span>,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 80,
      render: (value) => <span className="points-gain">+{value}</span>,
    },
    {
      title: '审核/频次',
      key: 'review',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.reviewMode}</div>
          <div className="points-inline-note">{record.limitMode}</div>
        </div>
      ),
    },
    {
      title: '用户侧',
      dataIndex: 'taskDisplay',
      key: 'taskDisplay',
      width: 110,
      render: (value, record) => (
        <Switch
          checked={value}
          checkedChildren="展示"
          unCheckedChildren="隐藏"
          onChange={(checked) => {
            persistTaskRules((prev) => prev.map((item) => (item.id === record.id ? { ...item, taskDisplay: checked } : item)));
            message.success(checked ? '已在我的积分展示' : '已从我的积分隐藏');
          }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => {
            persistTaskRules((prev) => prev.map((item) => (item.id === record.id ? { ...item, enabled: checked } : item)));
            message.success(checked ? '任务规则已启用' : '任务规则已停用');
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 210,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleSimulateTaskRule(record)}>模拟触发</Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setTaskRuleDraft({
              ...record,
              conditionTree: cloneConditionTree(record.conditionTree || record.conditions),
            })}
          />
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyTaskRule(record)} />
        </Space>
      ),
    },
  ];

  const ruleColumns = [
    {
      title: '规则',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ color: '#172033', fontWeight: 600 }}>{text}</div>
          <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.desc}</div>
        </div>
      ),
    },
    { title: '场景', dataIndex: 'category', key: 'category', width: 110, render: (value) => <Tag>{CATEGORY_LABEL_MAP[value]}</Tag> },
    { title: '积分', dataIndex: 'points', key: 'points', width: 90, render: (value) => <span className="points-gain">+{value}</span> },
    { title: '审核', dataIndex: 'reviewMode', key: 'reviewMode', width: 120 },
    { title: '限制', dataIndex: 'limit', key: 'limit', width: 160 },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => {
            setRules((prev) => prev.map((item) => (item.id === record.id ? { ...item, enabled: checked } : item)));
            message.success(checked ? '规则已启用' : '规则已停用');
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setRuleDraft({ ...record })} />
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyRule(record)} />
        </Space>
      ),
    },
  ];

  const rewardColumns = [
    {
      title: '权益',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
          <div>
            <div style={{ color: '#172033', fontWeight: 600 }}>{text}</div>
            <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.type} · {record.level}</div>
            {record.linkMode ? (
              <div className="points-inline-note">关联方式：{record.linkMode}</div>
            ) : null}
          </div>
        ),
    },
    { title: '积分', dataIndex: 'cost', key: 'cost', width: 90, render: (value) => <span className="points-cost">{value}</span> },
    { title: '库存', dataIndex: 'stock', key: 'stock', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <Tag color={status === 'enabled' ? 'green' : 'default'}>{status === 'enabled' ? '上架' : '下架'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setRewardDraft({ ...record })}>编辑</Button>
          <Button
            size="small"
            onClick={() => {
              const nextStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
              setRewards((prev) => prev.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)));
              message.success(nextStatus === 'enabled' ? '权益已上架' : '权益已下架');
            }}
          >
            {record.status === 'enabled' ? '下架' : '上架'}
          </Button>
        </Space>
      ),
    },
  ];

  const ledgerColumns = [
    { title: '用户', dataIndex: 'user', key: 'user', width: 110 },
    {
      title: '行为',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => (
        <div>
          <div style={{ color: '#172033', fontWeight: 600 }}>{text}</div>
          <div style={{ marginTop: 4, color: '#7b8598', fontSize: 12 }}>{record.source} · {record.time}</div>
        </div>
      ),
    },
    { title: '场景', dataIndex: 'category', key: 'category', width: 110, render: (value) => <Tag>{CATEGORY_LABEL_MAP[value]}</Tag> },
    { title: '积分', dataIndex: 'points', key: 'points', width: 90, render: (value) => <span className={value >= 0 ? 'points-gain' : 'points-cost'}>{value >= 0 ? `+${value}` : value}</span> },
    { title: '处理人', dataIndex: 'operator', key: 'operator', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (value) => <Tag>{value}</Tag> },
  ];

  const anomalyColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', width: 120, render: (value) => <Tag color="orange">{value}</Tag> },
    { title: '用户', dataIndex: 'user', key: 'user', width: 110 },
    { title: '说明', dataIndex: 'detail', key: 'detail' },
    { title: '风险', dataIndex: 'level', key: 'level', width: 90, render: (value) => <Tag color={value === '中' ? 'gold' : 'blue'}>{value}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 130 },
  ];

  const tabItems = [
    {
      key: 'task-rules',
      label: '任务规则',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <div className="points-rule-intro">
              <div>
                <div className="points-rule-intro-title">基于系统埋点的积分任务规则</div>
                <div className="points-rule-intro-desc">
                  规则必须绑定系统已埋点事件。用户完成系统内真实行为后，由事件触发积分计算；我的积分只展示已启用且允许展示的任务。
                </div>
              </div>
              <Button type="primary" onClick={openNewTaskRule}>新建任务规则</Button>
            </div>
          </Card>
          <Card className="points-panel-card">
            <div className="points-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索规则、任务标题或埋点事件"
                value={taskRuleKeyword}
                onChange={(event) => setTaskRuleKeyword(event.target.value)}
                style={{ width: 300 }}
              />
              <Select value={taskRuleCategory} options={CATEGORY_OPTIONS} onChange={setTaskRuleCategory} style={{ width: 140 }} />
              <div className="points-toolbar-right">
                <Button icon={<ReloadOutlined />} onClick={() => message.info('已按当前条件模拟刷新任务规则')}>刷新</Button>
              </div>
            </div>
          </Card>
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={taskRuleColumns} dataSource={filteredTaskRules} pagination={{ pageSize: 6 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'review',
      label: '积分审核',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <div className="points-toolbar">
              <Select value={reviewStatus} options={REVIEW_STATUS_OPTIONS} onChange={setReviewStatus} style={{ width: 140 }} />
              <Select value={reviewCategory} options={CATEGORY_OPTIONS} onChange={setReviewCategory} style={{ width: 140 }} />
              <div className="points-toolbar-right">
                <Button icon={<ReloadOutlined />} onClick={() => message.info('已按当前条件模拟刷新审核列表')}>刷新</Button>
              </div>
            </div>
          </Card>
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={reviewColumns} dataSource={filteredReviews} pagination={{ pageSize: 6 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'rules',
      label: '规则配置',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={ruleColumns} dataSource={rules} pagination={{ pageSize: 8 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'rewards',
      label: '权益管理',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={rewardColumns} dataSource={rewards} pagination={false} />
          </Card>
        </div>
      ),
    },
    {
      key: 'ledger',
      label: '积分台账',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card">
            <div className="points-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索用户、行为、来源或处理人"
                value={ledgerKeyword}
                onChange={(event) => setLedgerKeyword(event.target.value)}
                style={{ width: 280 }}
              />
              <Select value={ledgerCategory} options={CATEGORY_OPTIONS} onChange={setLedgerCategory} style={{ width: 140 }} />
            </div>
          </Card>
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={ledgerColumns} dataSource={filteredLedger} pagination={{ pageSize: 7 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'leaderboard',
      label: '榜单管理',
      children: (
        <div className="points-tab-pane">
          <div className="points-admin-grid">
            <Card className="points-panel-card">
              <div className="points-toolbar" style={{ marginBottom: 16 }}>
                <Select value={boardPeriod} onChange={setBoardPeriod} options={['本周', '本月', '本季度'].map((value) => ({ label: value, value }))} style={{ width: 120 }} />
                <Select
                  value={boardMetric}
                  onChange={setBoardMetric}
                  options={[
                    { label: '积分贡献', value: 'points' },
                    { label: 'UGC 分享', value: 'ugc' },
                    { label: '内测反馈', value: 'beta' },
                  ]}
                  style={{ width: 140 }}
                />
                <Switch checked={boardPublic} onChange={setBoardPublic} checkedChildren="公示" unCheckedChildren="隐藏" />
              </div>
              {renderLeaderRows(boardMetric)}
            </Card>
            <Card className="points-panel-card" title="榜单发布设置">
              <div className="points-detail-block">
                <div className="points-detail-row">
                  <span className="points-detail-label">周期</span>
                  <span className="points-detail-value">{boardPeriod}</span>
                </div>
                <div className="points-detail-row">
                  <span className="points-detail-label">榜单类型</span>
                  <span className="points-detail-value">{boardMetric === 'points' ? '积分贡献' : boardMetric === 'ugc' ? 'UGC 分享' : '内测反馈'}</span>
                </div>
                <div className="points-detail-row">
                  <span className="points-detail-label">公示状态</span>
                  <span className="points-detail-value">{boardPublic ? '将在 UGC 贡献专区展示' : '仅运营方可见'}</span>
                </div>
                <Button type="primary" onClick={() => message.success('榜单设置已模拟保存')}>保存榜单设置</Button>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'anomaly',
      label: '异常记录',
      children: (
        <div className="points-tab-pane">
          <Card className="points-panel-card points-table-card">
            <Table rowKey="id" columns={anomalyColumns} dataSource={ANOMALIES} pagination={false} />
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
            <SettingOutlined className="points-title-icon" />
            积分管理
          </div>
          <div className="points-subtitle">面向果仁系统运营的积分规则、审核、权益兑换和台账管理原型。</div>
        </div>
        <div className="points-header-actions">
          <Button icon={<HistoryOutlined />} onClick={() => message.info('已模拟导出当前积分台账')}>导出台账</Button>
          <Button type="primary" icon={<FileProtectOutlined />} onClick={() => message.success('月度积分公示已模拟生成')}>生成公示</Button>
        </div>
      </div>

      <div className="points-content">
        <div className="points-summary-grid">
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">已发布任务规则</span>
              <span className="points-summary-icon"><FileProtectOutlined /></span>
            </div>
            <div className="points-summary-value">{publishedTaskRuleCount}</div>
            <div className="points-summary-hint">基于系统埋点事件，展示到我的积分的规则数量。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">累计发放积分</span>
              <span className="points-summary-icon"><TrophyOutlined /></span>
            </div>
            <div className="points-summary-value">{totalIssued}</div>
            <div className="points-summary-hint">仅统计果仁系统运营行为，不作为绩效或薪酬依据。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">活跃贡献者</span>
              <span className="points-summary-icon"><TeamOutlined /></span>
            </div>
            <div className="points-summary-value">{LEADERS.length}</div>
            <div className="points-summary-hint">包含学习、内测、UGC、答疑和最佳实践贡献者。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">待审核</span>
              <span className="points-summary-icon"><AuditOutlined /></span>
            </div>
            <div className="points-summary-value">{pendingCount}</div>
            <div className="points-summary-hint">待处理贡献会影响积分入账和榜单展示。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">兑换申请</span>
              <span className="points-summary-icon"><GiftOutlined /></span>
            </div>
            <div className="points-summary-value">7</div>
            <div className="points-summary-hint">含证书兑换、内测优先、专题答疑和学习资源；证书仅在兑换时关联。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">UGC 收录</span>
              <span className="points-summary-icon"><BarChartOutlined /></span>
            </div>
            <div className="points-summary-value">18</div>
            <div className="points-summary-hint">已沉淀到资料区、资历库或研习社课程。</div>
          </Card>
          <Card className="points-summary-card">
            <div className="points-summary-top">
              <span className="points-summary-label">内测有效反馈</span>
              <span className="points-summary-icon"><CheckCircleOutlined /></span>
            </div>
            <div className="points-summary-value">{approvedCount + 12}</div>
            <div className="points-summary-hint">用于正式发布前的验证和修复跟进。</div>
          </Card>
        </div>

        <Card className="points-panel-card">
          <Tabs className="points-tabs" items={tabItems} />
        </Card>
      </div>

      <Drawer
        title="积分申请详情"
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        width={460}
        extra={selectedReview?.status === 'pending' ? (
          <Space>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => { handleReview(selectedReview, 'rejected'); setSelectedReview(null); }}>驳回</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { handleReview(selectedReview, 'approved'); setSelectedReview(null); }}>通过</Button>
          </Space>
        ) : null}
      >
        {selectedReview ? (
          <div className="points-detail-block">
            <div className="points-detail-row">
              <span className="points-detail-label">提交人</span>
              <span className="points-detail-value">{selectedReview.user} · {selectedReview.team}</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">贡献内容</span>
              <span className="points-detail-value">{selectedReview.action}</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">积分场景</span>
              <span className="points-detail-value">{CATEGORY_LABEL_MAP[selectedReview.category]}</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">建议积分</span>
              <span className="points-detail-value">{selectedReview.points} 分</span>
            </div>
            <div className="points-detail-row">
              <span className="points-detail-label">证明材料</span>
              <span className="points-detail-value">{selectedReview.evidence}</span>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        title="编辑任务规则"
        open={Boolean(taskRuleDraft)}
        onOk={handleSaveTaskRule}
        onCancel={() => setTaskRuleDraft(null)}
        okText="保存规则"
        cancelText="取消"
        width={860}
      >
        {taskRuleDraft ? (
          <div className="points-detail-block">
            <div className="points-form-grid">
              <Input
                value={taskRuleDraft.name}
                onChange={(event) => setTaskRuleDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="规则名称，例如完成果仁课程学习计分"
              />
              <Select
                value={taskRuleDraft.eventName}
                options={POINT_EVENT_CATALOG.map((event) => ({
                  label: `${event.eventLabel}｜${event.eventName}`,
                  value: event.eventName,
                }))}
                onChange={updateTaskRuleDraftEvent}
                placeholder="选择系统埋点事件"
              />
              <Input value={taskRuleDraft.sourceModule} disabled addonBefore="来源模块" />
              <Select
                value={taskRuleDraft.category}
                options={CATEGORY_OPTIONS.filter((item) => item.value !== 'all')}
                onChange={(value) => setTaskRuleDraft((prev) => ({ ...prev, category: value }))}
              />
              <InputNumber
                min={0}
                value={taskRuleDraft.points}
                onChange={(value) => setTaskRuleDraft((prev) => ({ ...prev, points: Number(value) || 0 }))}
                style={{ width: '100%' }}
                addonAfter="积分"
              />
              <Select
                value={taskRuleDraft.reviewMode}
                options={REVIEW_MODE_OPTIONS}
                onChange={(value) => setTaskRuleDraft((prev) => ({ ...prev, reviewMode: value }))}
              />
              <Select
                value={taskRuleDraft.limitMode}
                options={LIMIT_MODE_OPTIONS}
                onChange={(value) => setTaskRuleDraft((prev) => ({ ...prev, limitMode: value }))}
              />
              <Select
                value={taskRuleDraft.targetAudience}
                options={TARGET_AUDIENCE_OPTIONS}
                onChange={(value) => setTaskRuleDraft((prev) => ({ ...prev, targetAudience: value }))}
              />
              <Input value={taskRuleDraft.validFrom} onChange={(event) => setTaskRuleDraft((prev) => ({ ...prev, validFrom: event.target.value }))} addonBefore="开始" />
              <Input value={taskRuleDraft.validTo} onChange={(event) => setTaskRuleDraft((prev) => ({ ...prev, validTo: event.target.value }))} addonBefore="结束" />
            </div>

            <div className="points-section-title">触发条件</div>
            <ConditionTreeEditor
              tree={taskRuleDraft.conditionTree || taskRuleDraft.conditions}
              eventFields={findPointEvent(taskRuleDraft.eventName).conditionFields}
              onChange={(conditionTree) => setTaskRuleDraft((prev) => ({ ...prev, conditionTree }))}
            />

            <div className="points-section-title">用户侧展示</div>
            <Input
              value={taskRuleDraft.taskTitle}
              onChange={(event) => setTaskRuleDraft((prev) => ({ ...prev, taskTitle: event.target.value }))}
              placeholder="我的积分中展示的任务标题"
            />
            <Input.TextArea
              rows={3}
              value={taskRuleDraft.taskDesc}
              onChange={(event) => setTaskRuleDraft((prev) => ({ ...prev, taskDesc: event.target.value }))}
              placeholder="任务说明"
            />
            <div className="points-status-line">
              <span>启用规则</span>
              <Switch checked={taskRuleDraft.enabled} onChange={(checked) => setTaskRuleDraft((prev) => ({ ...prev, enabled: checked }))} />
              <span>在我的积分展示</span>
              <Switch checked={taskRuleDraft.taskDisplay} onChange={(checked) => setTaskRuleDraft((prev) => ({ ...prev, taskDisplay: checked }))} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑积分规则"
        open={Boolean(ruleDraft)}
        onOk={handleSaveRule}
        onCancel={() => setRuleDraft(null)}
        okText="保存规则"
        cancelText="取消"
      >
        {ruleDraft ? (
          <div className="points-detail-block">
            <Input value={ruleDraft.name} onChange={(event) => setRuleDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="规则名称" />
            <Select value={ruleDraft.category} options={CATEGORY_OPTIONS.filter((item) => item.value !== 'all')} onChange={(value) => setRuleDraft((prev) => ({ ...prev, category: value }))} />
            <InputNumber min={0} value={ruleDraft.points} onChange={(value) => setRuleDraft((prev) => ({ ...prev, points: Number(value) || 0 }))} style={{ width: '100%' }} addonAfter="分" />
            <Input value={ruleDraft.reviewMode} onChange={(event) => setRuleDraft((prev) => ({ ...prev, reviewMode: event.target.value }))} placeholder="审核方式" />
            <Input value={ruleDraft.limit} onChange={(event) => setRuleDraft((prev) => ({ ...prev, limit: event.target.value }))} placeholder="计分限制" />
            <Input.TextArea rows={3} value={ruleDraft.desc} onChange={(event) => setRuleDraft((prev) => ({ ...prev, desc: event.target.value }))} placeholder="规则说明" />
            <div className="points-status-line">
              <span>启用状态</span>
              <Switch checked={ruleDraft.enabled} onChange={(checked) => setRuleDraft((prev) => ({ ...prev, enabled: checked }))} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑权益"
        open={Boolean(rewardDraft)}
        onOk={handleSaveReward}
        onCancel={() => setRewardDraft(null)}
        okText="保存权益"
        cancelText="取消"
      >
        {rewardDraft ? (
          <div className="points-detail-block">
            <Input value={rewardDraft.title} onChange={(event) => setRewardDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="权益名称" />
            <Input value={rewardDraft.type} onChange={(event) => setRewardDraft((prev) => ({ ...prev, type: event.target.value }))} placeholder="权益类型" />
            <InputNumber min={0} value={rewardDraft.cost} onChange={(value) => setRewardDraft((prev) => ({ ...prev, cost: Number(value) || 0 }))} style={{ width: '100%' }} addonAfter="积分" />
            <InputNumber min={0} value={rewardDraft.stock} onChange={(value) => setRewardDraft((prev) => ({ ...prev, stock: Number(value) || 0 }))} style={{ width: '100%' }} addonAfter="库存" />
            <Select value={rewardDraft.level} onChange={(value) => setRewardDraft((prev) => ({ ...prev, level: value }))} options={['L1', 'L2', 'L3', 'L4'].map((value) => ({ label: value, value }))} />
            <div className="points-status-line">
              <span>上架状态</span>
              <Switch checked={rewardDraft.status === 'enabled'} onChange={(checked) => setRewardDraft((prev) => ({ ...prev, status: checked ? 'enabled' : 'disabled' }))} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
