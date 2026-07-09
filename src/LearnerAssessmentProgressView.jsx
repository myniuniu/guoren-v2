import { Empty, Progress, Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FlagOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { buildLearnerAssessmentProgress } from './assessmentProgress';
import './LearnerAssessmentProgressView.css';

const STATUS_TONE = {
  not_started: 'default',
  in_progress: 'processing',
  pending: 'warning',
  passed: 'success',
  failed: 'error',
};

function formatNumber(value, fallback = '0') {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(1);
}

function formatCondition(activity) {
  const condition = activity.passCondition || {};
  const metric = condition.metric || '完成率';
  const op = condition.op || '>=';
  const unit = activity.metricUnit || '';
  return `${metric} ${op.replace('>=', '≥').replace('<=', '≤')} ${formatNumber(condition.value)}${unit}`;
}

function formatActual(activity) {
  if (!activity.record || activity.statusKey === 'not_started') return '暂无记录';
  return `${formatNumber(activity.actualValue)}${activity.metricUnit}`;
}

function getEvidenceNames(activity, resourceMap) {
  const keys = activity.record?.evidenceResourceKeys || [];
  return keys
    .map((key) => resourceMap.get(key)?.name)
    .filter(Boolean)
    .slice(0, 2);
}

function LearnerAssessmentProgressView({ resources = [], assessment = {}, assessmentProgress = {} }) {
  const resourceMap = new Map(resources.map((resource) => [resource.key, resource]));
  const progress = buildLearnerAssessmentProgress({ resources, assessment, assessmentProgress });
  const { learner, stages, summary } = progress;

  if (!summary.totalActivities) {
    return (
      <div className="learner-progress-shell learner-progress-empty-shell">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="当前还没有可展示的考核活动"
        />
      </div>
    );
  }

  return (
    <div className="learner-progress-shell">
      <section className="learner-progress-hero">
        <div className="learner-progress-hero-main">
          <span className="learner-progress-eyebrow">我的考核进度</span>
          <h2>{learner?.name || '当前学员'}</h2>
          <div className="learner-progress-hero-meta">
            <Tag color={summary.passedOverall ? 'success' : 'processing'}>
              {summary.passedOverall ? '已达到结营要求' : '继续完成中'}
            </Tag>
            <span>及格线 {summary.passScore} 分</span>
            {summary.certificateEnabled ? <span>达标后可发放证书</span> : null}
          </div>
        </div>
        <div className="learner-progress-hero-score">
          <Progress type="circle" percent={summary.progressPercent} size={104} />
          <span>预计达标分 {summary.estimatedScore}</span>
        </div>
      </section>

      <section className="learner-progress-stat-grid">
        <div className="learner-progress-stat-card">
          <ClockCircleOutlined />
          <span>总进度</span>
          <strong>{summary.progressPercent}%</strong>
        </div>
        <div className="learner-progress-stat-card">
          <FlagOutlined />
          <span>预计达标分</span>
          <strong>{summary.estimatedScore}</strong>
        </div>
        <div className="learner-progress-stat-card">
          <CheckCircleOutlined />
          <span>必修完成</span>
          <strong>{summary.requiredPassed}/{summary.requiredTotal}</strong>
        </div>
        <div className="learner-progress-stat-card">
          <SafetyCertificateOutlined />
          <span>结营判断</span>
          <strong>{summary.passedOverall ? '已达标' : '未达标'}</strong>
        </div>
      </section>

      <div className="learner-progress-layout">
        <section className="learner-progress-stage-list">
          {stages.map((stage) => (
            <article key={stage.key} className="learner-progress-stage-card">
              <header className="learner-progress-stage-head">
                <div>
                  <h3>{stage.name}</h3>
                  <span>{stage.activities.length} 个活动 · 权重 {formatNumber(stage.totalWeight)}%</span>
                </div>
                <div className="learner-progress-stage-meter">
                  <strong>{stage.progressPercent}%</strong>
                  <Progress percent={stage.progressPercent} showInfo={false} size="small" />
                </div>
              </header>

              <div className="learner-progress-activity-list">
                {stage.activities.map((activity) => {
                  const evidenceNames = getEvidenceNames(activity, resourceMap);
                  return (
                    <div key={activity.key} className={`learner-progress-activity learner-progress-activity-${activity.statusKey}`}>
                      <div className="learner-progress-activity-main">
                        <div className="learner-progress-activity-title-row">
                          <strong>{activity.name}</strong>
                          <Tag color={STATUS_TONE[activity.statusKey]}>{activity.statusLabel}</Tag>
                        </div>
                        <div className="learner-progress-activity-meta">
                          <span>{activity.activityTypeLabel}</span>
                          <span>{activity.required ? '必修' : '选修'}</span>
                          <span>权重 {formatNumber(activity.weight)}%</span>
                          <span>{formatCondition(activity)}</span>
                        </div>
                        {activity.record?.note ? (
                          <div className="learner-progress-activity-note">{activity.record.note}</div>
                        ) : null}
                        {evidenceNames.length ? (
                          <div className="learner-progress-evidence">
                            <FileTextOutlined />
                            <span>{evidenceNames.join('、')}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="learner-progress-activity-value">
                        <span>实际</span>
                        <strong>{formatActual(activity)}</strong>
                        <em>{activity.record?.updatedAt || '未更新'}</em>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <aside className="learner-progress-next-panel">
          <div className="learner-progress-next-head">
            <ExclamationCircleOutlined />
            <strong>下一步</strong>
          </div>
          {summary.nextActions.length ? (
            <div className="learner-progress-next-list">
              {summary.nextActions.map((activity) => (
                <div key={activity.key} className="learner-progress-next-item">
                  <div>
                    <strong>{activity.name}</strong>
                    <span>{activity.required ? '必修活动' : '选修活动'} · {formatCondition(activity)}</span>
                  </div>
                  <RightOutlined />
                </div>
              ))}
            </div>
          ) : (
            <div className="learner-progress-next-done">
              <CheckCircleOutlined />
              <span>当前考核活动均已达标</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default LearnerAssessmentProgressView;
