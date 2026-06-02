import axios from 'axios';

const api = axios.create({ baseURL: '/api/integration' });

/* ========== 数据源管理 ========== */
export const dataSourceApi = {
  list: (params) => api.get('/datasource/list', { params }).then((r) => r.data),
  detail: (id) => api.get(`/datasource/${id}`).then((r) => r.data),
  create: (data) => api.post('/datasource', data).then((r) => r.data),
  update: (id, data) => api.put(`/datasource/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/datasource/${id}`).then((r) => r.data),
  testConnection: (id) => api.post(`/datasource/${id}/test`).then((r) => r.data),
};

/* ========== ETL 管道管理 ========== */
export const pipelineApi = {
  list: (params) => api.get('/pipeline/list', { params }).then((r) => r.data),
  detail: (id) => api.get(`/pipeline/${id}`).then((r) => r.data),
  create: (data) => api.post('/pipeline', data).then((r) => r.data),
  update: (id, data) => api.put(`/pipeline/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/pipeline/${id}`).then((r) => r.data),
  /** 运行单个管道（手动触发） */
  run: (id) => api.post(`/pipeline/${id}/run`).then((r) => r.data),
  /** 启用/禁用调度 */
  toggleSchedule: (id, enabled) => api.put(`/pipeline/${id}/schedule`, { enabled }).then((r) => r.data),
};

/* ========== 同步任务 ========== */
export const syncTaskApi = {
  page: (params) => api.get('/sync-task/page', { params }).then((r) => r.data),
  detail: (id) => api.get(`/sync-task/${id}`).then((r) => r.data),
  /** 获取任务日志 */
  logs: (id, params) => api.get(`/sync-task/${id}/logs`, { params }).then((r) => r.data),
  /** 重试失败任务 */
  retry: (id) => api.post(`/sync-task/${id}/retry`).then((r) => r.data),
  /** 取消运行中任务 */
  cancel: (id) => api.post(`/sync-task/${id}/cancel`).then((r) => r.data),
};

/* ========== 字段映射 ========== */
export const fieldMappingApi = {
  list: (pipelineId) => api.get('/field-mapping/list', { params: { pipelineId } }).then((r) => r.data),
  save: (pipelineId, mappings) => api.post('/field-mapping/save', { pipelineId, mappings }).then((r) => r.data),
  /** 自动推断映射 */
  autoMatch: (pipelineId) => api.post(`/field-mapping/auto-match`, { pipelineId }).then((r) => r.data),
  /** 获取源字段列表 */
  sourceFields: (dataSourceId) => api.get(`/field-mapping/source-fields`, { params: { dataSourceId } }).then((r) => r.data),
  /** 获取目标字段列表 */
  targetFields: (targetKey) => api.get(`/field-mapping/target-fields`, { params: { targetKey } }).then((r) => r.data),
};

/* ========== 数据源类型枚举 ========== */
export const SOURCE_TYPE_MAP = {
  database: { label: '数据库', color: 'blue' },
  api: { label: 'API接口', color: 'green' },
  event: { label: '事件驱动', color: 'orange' },
};

/* ========== 数据库类型枚举 ========== */
export const DB_TYPE_OPTIONS = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'dm', label: '达梦' },
  { value: 'kingbase', label: '人大金仓' },
];

/* ========== ETL 管道状态枚举 ========== */
export const PIPELINE_STATUS_MAP = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '已启用', color: 'success' },
  disabled: { label: '已禁用', color: 'warning' },
  error: { label: '异常', color: 'error' },
};

/* ========== 同步任务状态枚举 ========== */
export const SYNC_STATUS_MAP = {
  running: { label: '运行中', color: 'processing' },
  success: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
  pending: { label: '等待中', color: 'warning' },
};

/* ========== 同步策略枚举 ========== */
export const SYNC_STRATEGY_MAP = {
  full: { label: '全量同步', color: 'blue' },
  incremental: { label: '增量同步', color: 'green' },
  realtime: { label: '实时同步', color: 'orange' },
};

/* ========== 转换规则类型 ========== */
export const TRANSFORM_TYPE_OPTIONS = [
  { value: 'direct', label: '直接映射' },
  { value: 'rename', label: '字段重命名' },
  { value: 'format', label: '格式转换' },
  { value: 'concat', label: '字段合并' },
  { value: 'split', label: '字段拆分' },
  { value: 'lookup', label: '字典映射' },
  { value: 'script', label: '自定义脚本' },
  { value: 'filter', label: '条件过滤' },
  { value: 'aggregate', label: '聚合计算' },
];

/* ========== 目标系统（教师档案袋关联系统） ========== */
export const TARGET_SYSTEM_OPTIONS = [
  { value: 'teacher_portfolio', label: '教师档案袋', icon: '🧑‍🏫' },
  { value: 'academic_affairs', label: '学院教务平台', icon: '📚' },
  { value: 'research', label: '科研系统', icon: '🔬' },
  { value: 'teacher_dev', label: '教发系统', icon: '🎓' },
];

/* ========== Mock 数据（前端开发用，后续对接后端替换） ========== */
const MOCK_DELAY = 400;

const mockDataSources = [
  { id: 'ds-1', name: '教务系统-MySQL', type: 'database', dbType: 'mysql', host: '192.168.1.10', port: 3306, database: 'academic_affairs', status: 'connected', createTime: '2025-12-01 10:00:00', description: '学院教务平台主库' },
  { id: 'ds-2', name: '科研系统-API', type: 'api', apiUrl: 'https://research.edu.cn/api/v1', method: 'GET', authType: 'bearer', status: 'connected', createTime: '2025-12-05 14:30:00', description: '科研系统RESTful接口' },
  { id: 'ds-3', name: '教发系统-事件', type: 'event', eventBus: 'Kafka', topic: 'teacher-dev-events', group: 'portfolio-consumer', status: 'connected', createTime: '2025-12-10 09:00:00', description: '教师发展系统事件总线' },
  { id: 'ds-4', name: '人事系统-PostgreSQL', type: 'database', dbType: 'postgresql', host: '192.168.1.20', port: 5432, database: 'hr_system', status: 'disconnected', createTime: '2025-12-12 16:00:00', description: '人事管理数据库' },
];

const mockPipelines = [
  {
    id: 'pl-1', name: '教务课程信息同步', sourceId: 'ds-1', sourceName: '教务系统-MySQL',
    targetType: 'teacher_portfolio', targetName: '教师档案袋',
    syncStrategy: 'incremental', status: 'active', cronExpression: '0 0 2 * * ?',
    lastSyncTime: '2026-05-31 02:00:00', lastSyncStatus: 'success',
    description: '从教务系统增量同步课程基础信息、教学材料等',
    extractConfig: { table: 'course_info', query: 'SELECT * FROM course_info WHERE update_time > ${lastSyncTime}' },
    transformConfig: { rules: [{ type: 'direct', source: 'course_name', target: 'courseName' }, { type: 'format', source: 'start_date', target: 'startDate', format: 'date' }] },
    loadConfig: { targetTable: 'portfolio_course', mode: 'upsert', keyField: 'course_id' },
  },
  {
    id: 'pl-2', name: '科研项目数据同步', sourceId: 'ds-2', sourceName: '科研系统-API',
    targetType: 'teacher_portfolio', targetName: '教师档案袋',
    syncStrategy: 'full', status: 'active', cronExpression: '0 0 3 * * ?',
    lastSyncTime: '2026-05-31 03:00:00', lastSyncStatus: 'success',
    description: '全量同步科研项目的纵向/横向项目、论文、知识产权等',
    extractConfig: { endpoint: '/projects', method: 'GET', pagination: 'cursor' },
    transformConfig: { rules: [{ type: 'direct', source: 'project_title', target: 'projectName' }, { type: 'lookup', source: 'project_type', target: 'projectType', dict: 'project_type_dict' }] },
    loadConfig: { targetTable: 'portfolio_research', mode: 'replace' },
  },
  {
    id: 'pl-3', name: '教师培训记录实时同步', sourceId: 'ds-3', sourceName: '教发系统-事件',
    targetType: 'teacher_portfolio', targetName: '教师档案袋',
    syncStrategy: 'realtime', status: 'active', cronExpression: null,
    lastSyncTime: '2026-05-31 15:30:00', lastSyncStatus: 'success',
    description: '实时监听教发系统事件，同步培训/研修完成情况、证书等',
    extractConfig: { eventType: 'training.completed', filter: "event.data.type IN ('training','certificate','degree')" },
    transformConfig: { rules: [{ type: 'direct', source: 'event.data.trainingId', target: 'trainingId' }, { type: 'rename', source: 'event.data.title', target: 'trainingName' }] },
    loadConfig: { targetTable: 'portfolio_training', mode: 'append' },
  },
  {
    id: 'pl-4', name: '人事职称数据同步', sourceId: 'ds-4', sourceName: '人事系统-PostgreSQL',
    targetType: 'teacher_portfolio', targetName: '教师档案袋',
    syncStrategy: 'incremental', status: 'error', cronExpression: '0 0 4 * * ?',
    lastSyncTime: '2026-05-30 04:00:00', lastSyncStatus: 'failed',
    description: '增量同步职称变更、学历学位提升等成长轨迹数据',
    extractConfig: { table: 'title_change_log', query: 'SELECT * FROM title_change_log WHERE create_time > ${lastSyncTime}' },
    transformConfig: { rules: [{ type: 'direct', source: 'teacher_id', target: 'teacherId' }, { type: 'format', source: 'change_date', target: 'changeDate', format: 'date' }] },
    loadConfig: { targetTable: 'portfolio_title', mode: 'upsert', keyField: 'change_id' },
  },
];

const mockSyncTasks = [
  { id: 'st-1', pipelineId: 'pl-1', pipelineName: '教务课程信息同步', status: 'success', records: 128, startTime: '2026-05-31 02:00:00', endTime: '2026-05-31 02:03:25', duration: '3分25秒', strategy: 'incremental' },
  { id: 'st-2', pipelineId: 'pl-2', pipelineName: '科研项目数据同步', status: 'success', records: 2560, startTime: '2026-05-31 03:00:00', endTime: '2026-05-31 03:12:40', duration: '12分40秒', strategy: 'full' },
  { id: 'st-3', pipelineId: 'pl-3', pipelineName: '教师培训记录实时同步', status: 'running', records: 5, startTime: '2026-05-31 15:30:00', endTime: null, duration: '进行中', strategy: 'realtime' },
  { id: 'st-4', pipelineId: 'pl-4', pipelineName: '人事职称数据同步', status: 'failed', records: 0, startTime: '2026-05-30 04:00:00', endTime: '2026-05-30 04:00:12', duration: '12秒', strategy: 'incremental', error: 'Connection refused: 192.168.1.20:5432' },
  { id: 'st-5', pipelineId: 'pl-1', pipelineName: '教务课程信息同步', status: 'success', records: 95, startTime: '2026-05-30 02:00:00', endTime: '2026-05-30 02:02:50', duration: '2分50秒', strategy: 'incremental' },
  { id: 'st-6', pipelineId: 'pl-2', pipelineName: '科研项目数据同步', status: 'success', records: 2560, startTime: '2026-05-30 03:00:00', endTime: '2026-05-30 03:11:55', duration: '11分55秒', strategy: 'full' },
];

const mockFieldMappings = [
  { id: 'fm-1', pipelineId: 'pl-1', sourceField: 'course_name', sourceType: 'VARCHAR(200)', targetField: 'courseName', targetType: 'STRING', transformType: 'direct', transformRule: null },
  { id: 'fm-2', pipelineId: 'pl-1', sourceField: 'start_date', sourceType: 'DATE', targetField: 'startDate', targetType: 'STRING', transformType: 'format', transformRule: 'yyyy-MM-dd' },
  { id: 'fm-3', pipelineId: 'pl-1', sourceField: 'teacher_id', sourceType: 'BIGINT', targetField: 'teacherId', targetType: 'STRING', transformType: 'direct', transformRule: null },
  { id: 'fm-4', pipelineId: 'pl-1', sourceField: 'course_type', sourceType: 'INT', targetField: 'courseType', targetType: 'STRING', transformType: 'lookup', transformRule: 'course_type_dict' },
  { id: 'fm-5', pipelineId: 'pl-2', sourceField: 'project_title', sourceType: 'VARCHAR(500)', targetField: 'projectName', targetType: 'STRING', transformType: 'direct', transformRule: null },
  { id: 'fm-6', pipelineId: 'pl-2', sourceField: 'project_type', sourceType: 'INT', targetField: 'projectType', targetType: 'STRING', transformType: 'lookup', transformRule: 'project_type_dict' },
  { id: 'fm-7', pipelineId: 'pl-3', sourceField: 'event.data.trainingId', sourceType: 'STRING', targetField: 'trainingId', targetType: 'STRING', transformType: 'direct', transformRule: null },
  { id: 'fm-8', pipelineId: 'pl-3', sourceField: 'event.data.title', sourceType: 'STRING', targetField: 'trainingName', targetType: 'STRING', transformType: 'rename', transformRule: null },
];

/* ========== Mock API 实现 ========== */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let _dsList = [...mockDataSources];
let _plList = [...mockPipelines];
let _stList = [...mockSyncTasks];
let _fmList = [...mockFieldMappings];
let _idCounter = 100;

export const mockDataSourceApi = {
  list: async (params) => {
    await delay(MOCK_DELAY);
    let list = [..._dsList];
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.description?.toLowerCase().includes(kw));
    }
    if (params?.type) list = list.filter((d) => d.type === params.type);
    return list;
  },
  detail: async (id) => {
    await delay(MOCK_DELAY);
    return _dsList.find((d) => d.id === id) || null;
  },
  create: async (data) => {
    await delay(MOCK_DELAY);
    const item = { ...data, id: `ds-${++_idCounter}`, status: 'disconnected', createTime: new Date().toLocaleString('zh-CN') };
    _dsList.unshift(item);
    return item;
  },
  update: async (id, data) => {
    await delay(MOCK_DELAY);
    _dsList = _dsList.map((d) => (d.id === id ? { ...d, ...data } : d));
    return _dsList.find((d) => d.id === id);
  },
  remove: async (id) => {
    await delay(MOCK_DELAY);
    _dsList = _dsList.filter((d) => d.id !== id);
    return { success: true };
  },
  testConnection: async (id) => {
    await delay(1200);
    const ds = _dsList.find((d) => d.id === id);
    if (ds) {
      ds.status = Math.random() > 0.3 ? 'connected' : 'disconnected';
      return { success: ds.status === 'connected', message: ds.status === 'connected' ? '连接成功' : '连接失败：超时' };
    }
    return { success: false, message: '数据源不存在' };
  },
};

export const mockPipelineApi = {
  list: async (params) => {
    await delay(MOCK_DELAY);
    let list = [..._plList];
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(kw));
    }
    if (params?.status) list = list.filter((p) => p.status === params.status);
    return list;
  },
  detail: async (id) => {
    await delay(MOCK_DELAY);
    const p = _plList.find((p) => p.id === id);
    if (p) return { ...p, fieldMappings: _fmList.filter((f) => f.pipelineId === id) };
    return null;
  },
  create: async (data) => {
    await delay(MOCK_DELAY);
    const item = { ...data, id: `pl-${++_idCounter}`, status: 'draft', lastSyncTime: null, lastSyncStatus: null };
    _plList.unshift(item);
    return item;
  },
  update: async (id, data) => {
    await delay(MOCK_DELAY);
    _plList = _plList.map((p) => (p.id === id ? { ...p, ...data } : p));
    return _plList.find((p) => p.id === id);
  },
  remove: async (id) => {
    await delay(MOCK_DELAY);
    _plList = _plList.filter((p) => p.id !== id);
    _fmList = _fmList.filter((f) => f.pipelineId !== id);
    return { success: true };
  },
  run: async (id) => {
    await delay(MOCK_DELAY);
    const p = _plList.find((p) => p.id === id);
    if (p) {
      const task = {
        id: `st-${++_idCounter}`,
        pipelineId: id,
        pipelineName: p.name,
        status: 'running',
        records: 0,
        startTime: new Date().toLocaleString('zh-CN'),
        endTime: null,
        duration: '进行中',
        strategy: p.syncStrategy,
      };
      _stList.unshift(task);
      // 模拟 3 秒后完成
      setTimeout(() => {
        task.status = 'success';
        task.records = Math.floor(Math.random() * 500) + 10;
        task.endTime = new Date().toLocaleString('zh-CN');
        task.duration = `${Math.floor(Math.random() * 10) + 1}分${Math.floor(Math.random() * 59)}秒`;
        p.lastSyncTime = task.endTime;
        p.lastSyncStatus = 'success';
      }, 3000);
    }
    return { success: true };
  },
  toggleSchedule: async (id, enabled) => {
    await delay(MOCK_DELAY);
    _plList = _plList.map((p) => (p.id === id ? { ...p, status: enabled ? 'active' : 'disabled' } : p));
    return { success: true };
  },
};

export const mockSyncTaskApi = {
  page: async (params) => {
    await delay(MOCK_DELAY);
    let list = [..._stList];
    if (params?.status) list = list.filter((t) => t.status === params.status);
    if (params?.pipelineId) list = list.filter((t) => t.pipelineId === params.pipelineId);
    const page = params?.page || 1;
    const size = params?.pageSize || 10;
    return { list: list.slice((page - 1) * size, page * size), total: list.length };
  },
  retry: async (id) => {
    await delay(MOCK_DELAY);
    const t = _stList.find((t) => t.id === id);
    if (t) {
      t.status = 'running';
      t.startTime = new Date().toLocaleString('zh-CN');
      t.endTime = null;
      t.duration = '进行中';
      setTimeout(() => {
        t.status = 'success';
        t.records = Math.floor(Math.random() * 200) + 10;
        t.endTime = new Date().toLocaleString('zh-CN');
        t.duration = `${Math.floor(Math.random() * 5) + 1}分${Math.floor(Math.random() * 59)}秒`;
      }, 3000);
    }
    return { success: true };
  },
  cancel: async (id) => {
    await delay(MOCK_DELAY);
    const t = _stList.find((t) => t.id === id);
    if (t) {
      t.status = 'cancelled';
      t.endTime = new Date().toLocaleString('zh-CN');
      t.duration = '已取消';
    }
    return { success: true };
  },
};

export const mockFieldMappingApi = {
  list: async (pipelineId) => {
    await delay(MOCK_DELAY);
    return pipelineId ? _fmList.filter((f) => f.pipelineId === pipelineId) : _fmList;
  },
  save: async (pipelineId, mappings) => {
    await delay(MOCK_DELAY);
    _fmList = _fmList.filter((f) => f.pipelineId !== pipelineId);
    const newMappings = mappings.map((m, i) => ({ ...m, id: `fm-${++_idCounter}`, pipelineId }));
    _fmList.push(...newMappings);
    return newMappings;
  },
  autoMatch: async (pipelineId) => {
    await delay(800);
    return { matched: Math.floor(Math.random() * 5) + 3, unmatched: Math.floor(Math.random() * 3) + 1 };
  },
};
