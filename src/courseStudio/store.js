const STORAGE_KEY = 'gr.course-studio.v1';
const STORE_CHANGE_EVENT = 'gr:course-studio-change';
const SEED_KEY = 'gr.course-studio-seeded.v1';

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowText() {
  return new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-');
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => trimText(item)).filter(Boolean)));
  }
  return [];
}

function emitChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
}

function readList() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[course-studio-store] failed to read storage', error);
    return [];
  }
}

function writeList(list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  emitChange();
}

export function getCourseStudioStoreEventName() {
  return STORE_CHANGE_EVENT;
}

export function createCourseStudioDraft(overrides = {}) {
  const now = nowText();
  return {
    id: overrides.id || createId('course_project'),
    name: trimText(overrides.name) || 'AI 通识课程设计',
    subject: trimText(overrides.subject) || '人工智能',
    stage: trimText(overrides.stage) || '小学',
    audience: trimText(overrides.audience) || '中小学教师',
    description: trimText(overrides.description) || '',
    lessonCount: Math.max(1, Number(overrides.lessonCount || 6)),
    durationMinutes: Math.max(20, Number(overrides.durationMinutes || 40)),
    capabilityModelId: overrides.capabilityModelId || '',
    knowledgeGraphId: overrides.knowledgeGraphId || '',
    dependencyIds: normalizeStringArray(overrides.dependencyIds),
    customDependencies: normalizeStringArray(overrides.customDependencies),
    structureTemplateKey: trimText(overrides.structureTemplateKey) || 'five-step',
    customStructureBlocks: normalizeStringArray(overrides.customStructureBlocks),
    generationRuns: Array.isArray(overrides.generationRuns) ? overrides.generationRuns : [],
    latestOutput: overrides.latestOutput || null,
    latestRunId: overrides.latestRunId || '',
    status: trimText(overrides.status) || 'draft',
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}

function normalizeProject(project) {
  const base = createCourseStudioDraft(project);
  return {
    ...base,
    name: trimText(base.name) || '未命名课程项目',
    subject: trimText(base.subject) || '人工智能',
    stage: trimText(base.stage) || '小学',
    audience: trimText(base.audience) || '中小学教师',
    description: trimText(base.description),
    dependencyIds: normalizeStringArray(base.dependencyIds),
    customDependencies: normalizeStringArray(base.customDependencies),
    customStructureBlocks: normalizeStringArray(base.customStructureBlocks),
    generationRuns: Array.isArray(project?.generationRuns) ? project.generationRuns : [],
  };
}

function commit(mutator) {
  const next = readList().map(normalizeProject);
  mutator(next);
  const normalized = next.map(normalizeProject)
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
  writeList(normalized);
  return clone(normalized);
}

export function loadCourseStudioStore() {
  return readList().map(normalizeProject)
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

export function listCourseStudioProjects() {
  return clone(loadCourseStudioStore());
}

export function getCourseStudioProject(projectId) {
  return clone(loadCourseStudioStore().find((item) => item.id === projectId) || null);
}

export function saveCourseStudioProject(project) {
  const normalized = normalizeProject({
    ...project,
    updatedAt: nowText(),
  });
  const next = commit((projects) => {
    const index = projects.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      projects[index] = {
        ...projects[index],
        ...normalized,
      };
      return;
    }
    projects.unshift(normalized);
  });
  return clone(next.find((item) => item.id === normalized.id) || normalized);
}

export function removeCourseStudioProject(projectId) {
  commit((projects) => {
    const index = projects.findIndex((item) => item.id === projectId);
    if (index >= 0) {
      projects.splice(index, 1);
    }
  });
}

export function duplicateCourseStudioProject(projectId) {
  const project = getCourseStudioProject(projectId);
  if (!project) {
    throw new Error('课程项目不存在');
  }
  return saveCourseStudioProject({
    ...project,
    id: createId('course_project'),
    name: `${project.name}（复制）`,
    generationRuns: [],
    latestOutput: null,
    latestRunId: '',
    status: 'draft',
    createdAt: nowText(),
    updatedAt: nowText(),
  });
}

export function saveCourseStudioRun(projectId, run) {
  const project = getCourseStudioProject(projectId);
  if (!project) {
    throw new Error('课程项目不存在');
  }

  return saveCourseStudioProject({
    ...project,
    generationRuns: [run, ...(project.generationRuns || [])].slice(0, 10),
    latestOutput: run.output,
    latestRunId: run.runId,
    status: 'generated',
  });
}

export function seedCourseStudioData(input = {}) {
  if (typeof window === 'undefined') return loadCourseStudioStore();
  const existing = loadCourseStudioStore();
  if (existing.length) return existing;
  if (window.localStorage.getItem(SEED_KEY) === '1') {
    return existing;
  }

  const capabilityModels = Array.isArray(input.capabilityModels) ? input.capabilityModels : [];
  const graphs = Array.isArray(input.graphs) ? input.graphs : [];
  const starter = createCourseStudioDraft({
    name: '中小学人工智能通识课程',
    stage: '小学',
    subject: '人工智能',
    audience: '中小学教师',
    description: '结合能力模型、知识图谱和地方课程纲要，生成一套可直接讨论的课程草案。',
    lessonCount: 6,
    durationMinutes: 40,
    capabilityModelId: capabilityModels[0]?.id || '',
    knowledgeGraphId: graphs[0]?.id || '',
    dependencyIds: ['dep_beijing_outline', 'dep_guangdong_outline'],
    structureTemplateKey: 'five-step',
  });
  writeList([starter]);
  window.localStorage.setItem(SEED_KEY, '1');
  return [starter];
}
