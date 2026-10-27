import { Empty, Progress } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './SelfPacedLearningProgressView.css';

export const SELF_PACED_TASK_PROGRESS = [100, 66, 63, 43, 41, 18];
export const SELF_PACED_CONTENT_PROGRESS = [
  [100, 100, 100, 100],
  [73, 100, 0, 91],
  [86, 70, 63, 33],
  [58, 43, 25, 46],
  [100, 41, 0, 23],
  [72, 0, 0, 0],
];

export function resolveSelfPacedTaskProgress(task, index, resources = []) {
  const contents = resources.filter((item) => !item.isFolder && item.parentKey === task.key);
  if (contents.some((item) => item.type === 'RESULT_SUBMIT')) {
    const baseline = resolveSelfPacedTaskProgress(task, index);
    return Math.round(contents.reduce((sum, content, contentIndex) => sum + resolveSelfPacedContentProgress(content, index, contentIndex, baseline), 0) / contents.length);
  }
  const explicit = Number(task?.meta?.learningProgress);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
  return SELF_PACED_TASK_PROGRESS[index] ?? 0;
}

export function resolveSelfPacedContentProgress(content, taskIndex, contentIndex, taskProgress = 0) {
  if (content?.type === 'RESULT_SUBMIT') return Number(content.meta?.learningProgress) === 100 ? 100 : 0;
  const explicit = Number(content?.meta?.learningProgress);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
  const preset = SELF_PACED_CONTENT_PROGRESS[taskIndex]?.[contentIndex];
  if (Number.isFinite(preset)) return preset;
  return Math.max(0, Math.min(100, Math.round(taskProgress)));
}

export function buildSelfPacedResourceProgressMap(resources = []) {
  const tasks = resources
    .filter((item) => item?.isFolder && item.parentKey == null)
    .sort((a, b) => Number(a?.meta?.taskOrder || 0) - Number(b?.meta?.taskOrder || 0));

  return tasks.reduce((progressMap, task, index) => {
    const percent = Math.round(resolveSelfPacedTaskProgress(task, index, resources));
    progressMap.set(task.key, {
      percent,
      statusKey: percent >= 100 ? 'passed' : percent > 0 ? 'in_progress' : 'not_started',
      label: percent >= 100 ? '阶段达标' : percent > 0 ? '推进中' : '未开始',
      source: 'stage',
      tone: percent >= 100 ? 'passed' : percent > 0 ? 'active' : 'empty',
    });

    resources
      .filter((item) => !item?.isFolder && item.parentKey === task.key)
      .sort((a, b) => Number(a?.meta?.sortNo || 0) - Number(b?.meta?.sortNo || 0))
      .forEach((content, contentIndex) => {
        const contentPercent = Math.round(resolveSelfPacedContentProgress(
          content,
          index,
          contentIndex,
          percent,
        ));
        progressMap.set(content.key, {
          percent: contentPercent,
          statusKey: contentPercent >= 100 ? 'passed' : contentPercent > 0 ? 'in_progress' : 'not_started',
          label: contentPercent >= 100 ? '已完成' : contentPercent > 0 ? '学习中' : '未开始',
          source: 'resource',
          tone: contentPercent >= 100 ? 'passed' : contentPercent > 0 ? 'active' : 'empty',
        });
      });
    return progressMap;
  }, new Map());
}

export default function SelfPacedLearningProgressView({ resources = [], onOpenResource }) {
  const tasks = resources
    .filter((item) => item?.isFolder && item.parentKey == null)
    .sort((a, b) => Number(a?.meta?.taskOrder || 0) - Number(b?.meta?.taskOrder || 0))
    .map((task, index) => {
      const contents = resources
        .filter((item) => !item?.isFolder && item.parentKey === task.key)
        .sort((a, b) => Number(a?.meta?.sortNo || 0) - Number(b?.meta?.sortNo || 0));
      const progress = resolveSelfPacedTaskProgress(task, index, resources);
      const contentProgress = contents.map((content, contentIndex) => (
        resolveSelfPacedContentProgress(content, index, contentIndex, progress)
      ));
      const completedCount = contentProgress.filter((value) => value >= 100).length;
      const currentContentIndex = contentProgress.findIndex((value) => value > 0 && value < 100);
      return { ...task, contents, contentProgress, progress, completedCount, currentContentIndex };
    });

  if (!tasks.length) {
    return (
      <div className="self-paced-progress-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前还没有学习任务" />
      </div>
    );
  }

  const totalContents = tasks.reduce((sum, task) => sum + task.contents.length, 0);
  const completedContents = tasks.reduce((sum, task) => sum + task.completedCount, 0);
  const completedTasks = tasks.filter((task) => task.progress >= 100).length;
  const overallProgress = totalContents ? Math.round((completedContents / totalContents) * 100) : 0;
  const currentTask = tasks.find((task) => task.progress < 100) || tasks[tasks.length - 1];
  const nextContent = currentTask.contents[currentTask.currentContentIndex]
    || currentTask.contents.find((content, index) => currentTask.contentProgress[index] < 100)
    || currentTask.contents[0]
    || currentTask;

  return (
    <div className="self-paced-progress-shell">
      <section className="self-paced-progress-hero">
        <div className="self-paced-progress-hero-copy">
          <span>自主学习进度</span>
          <h2>按任务持续推进 AI 素养学习</h2>
          <p>系统记录每项学习内容的完成情况，并为你定位下一步学习任务。</p>
          <button type="button" onClick={() => onOpenResource?.(nextContent.key)}>
            <PlayCircleOutlined />
            继续学习
            <RightOutlined />
          </button>
        </div>
        <div className="self-paced-progress-overall">
          <Progress type="circle" percent={overallProgress} size={116} strokeColor="#1f7a5b" />
          <span>{completedContents}/{totalContents} 项内容已完成</span>
        </div>
      </section>

      <section className="self-paced-progress-stats" aria-label="学习进度概览">
        <article><CheckCircleFilled /><span>已完成任务</span><strong>{completedTasks}/{tasks.length}</strong></article>
        <article><FileTextOutlined /><span>已学内容</span><strong>{completedContents}/{totalContents}</strong></article>
        <article><ClockCircleOutlined /><span>累计学习</span><strong>3.8 小时</strong></article>
        <article><PlayCircleOutlined /><span>当前任务</span><strong>{currentTask.name.replace(/^任务[^：:]*[：:]\s*/, '')}</strong></article>
      </section>

      <section className="self-paced-progress-task-section">
        <header>
          <div><span>学习路径</span><h3>任务完成情况</h3></div>
          <em>{overallProgress}%</em>
        </header>
        <div className="self-paced-progress-task-grid">
          {tasks.map((task, taskIndex) => (
            <article key={task.key} className={`self-paced-progress-task ${task.progress > 0 ? 'has-progress' : ''} ${task.progress >= 100 ? 'is-complete' : ''}`}>
              <div className="self-paced-progress-task-head">
                <span>{String(taskIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{task.name}</h4>
                  <p>{task.completedCount}/{task.contents.length} 项学习内容</p>
                </div>
                <strong>{task.progress}%</strong>
              </div>
              <Progress percent={task.progress} showInfo={false} strokeColor={task.progress >= 100 ? '#1f7a5b' : '#4b7bec'} />
              <div className="self-paced-progress-content-list">
                {task.contents.map((content, contentIndex) => {
                  const progress = task.contentProgress[contentIndex] || 0;
                  const completed = progress >= 100;
                  const current = task === currentTask && contentIndex === task.currentContentIndex;
                  return (
                    <button
                      key={content.key}
                      type="button"
                      className={`${completed ? 'is-complete' : ''} ${current ? 'is-current' : ''}`}
                      onClick={() => onOpenResource?.(content.key)}
                    >
                      {completed ? <CheckCircleFilled /> : <PlayCircleOutlined />}
                      <span>{content.name}</span>
                      {current ? <em>继续</em> : null}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
