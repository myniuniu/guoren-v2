import { capabilityModelApi } from '../capabilityModel/api';
import {
  getCollections,
  getGraphById,
  getGraphLayout,
  getGraphsByCollection,
  getPointsByGraph,
  getRelationsByGraph,
  loadKnowledgeGraphStore,
} from '../knowledgeGraph/store';
import { appendLuckyConversationMessage } from '../messages/luckyPushStore';
import {
  buildCourseGenerationContext,
  buildLuckyCourseSummary,
  COURSE_DEPENDENCY_PRESETS,
  COURSE_STRUCTURE_TEMPLATES,
  runCourseStudioSkills,
} from './generation';
import {
  createCourseStudioDraft,
  duplicateCourseStudioProject,
  getCourseStudioProject,
  getCourseStudioStoreEventName,
  listCourseStudioProjects,
  removeCourseStudioProject,
  saveCourseStudioProject,
  saveCourseStudioRun,
  seedCourseStudioData,
} from './store';

function buildGraphSummaries() {
  const state = loadKnowledgeGraphStore();
  const collections = getCollections(state);
  return collections.flatMap((collection) => (
    getGraphsByCollection(state, collection.id).map((graph) => {
      const points = getPointsByGraph(state, graph.id);
      const layout = getGraphLayout(state, graph.id);
      const stageCount = layout?.structuredView?.stages?.length || 0;
      const bindingCount = points.reduce((sum, point) => sum + (point.resourceBindings?.length || 0), 0);
      return {
        ...graph,
        collectionId: collection.id,
        collectionName: collection.name,
        stageCount,
        pointCount: points.length,
        bindingCount,
      };
    })
  ));
}

async function ensureSeeded() {
  await capabilityModelApi.seed();
  const models = await capabilityModelApi.listModels();
  const graphs = buildGraphSummaries();
  seedCourseStudioData({
    capabilityModels: models,
    graphs,
  });
}

function buildGraphBundle(graphId) {
  const state = loadKnowledgeGraphStore();
  const graph = getGraphById(state, graphId);
  if (!graph) return null;
  return {
    graph,
    layout: getGraphLayout(state, graphId),
    points: getPointsByGraph(state, graphId),
    relations: getRelationsByGraph(state, graphId),
  };
}

export const courseStudioApi = {
  seed: async () => ensureSeeded(),
  listProjects: async () => {
    await ensureSeeded();
    return listCourseStudioProjects();
  },
  getProject: async (projectId) => {
    await ensureSeeded();
    return getCourseStudioProject(projectId);
  },
  saveProject: async (project) => {
    await ensureSeeded();
    return saveCourseStudioProject(project);
  },
  removeProject: async (projectId) => {
    await ensureSeeded();
    return removeCourseStudioProject(projectId);
  },
  duplicateProject: async (projectId) => {
    await ensureSeeded();
    return duplicateCourseStudioProject(projectId);
  },
  createDraft: (overrides = {}) => createCourseStudioDraft(overrides),
  listCapabilityModels: async () => {
    await ensureSeeded();
    return capabilityModelApi.listModels();
  },
  listKnowledgeGraphs: async () => {
    await ensureSeeded();
    return buildGraphSummaries();
  },
  runCourseGeneration: async (projectId) => {
    await ensureSeeded();
    const project = getCourseStudioProject(projectId);
    if (!project) {
      throw new Error('课程项目不存在');
    }

    const [capabilityModel, graphBundle] = await Promise.all([
      project.capabilityModelId ? capabilityModelApi.detailModel(project.capabilityModelId) : Promise.resolve(null),
      Promise.resolve(project.knowledgeGraphId ? buildGraphBundle(project.knowledgeGraphId) : null),
    ]);

    const context = buildCourseGenerationContext(project, capabilityModel, graphBundle);
    const run = runCourseStudioSkills(context);
    const luckySummary = buildLuckyCourseSummary(run.output);

    appendLuckyConversationMessage({
      messageType: 'course_studio_result',
      projectId,
      runId: run.runId,
      summary: luckySummary.summary,
      content: luckySummary.content,
      createdAt: run.createdAt,
      time: '刚刚',
    });

    const savedProject = saveCourseStudioRun(projectId, {
      ...run,
      luckySummary,
      luckySyncedAt: run.createdAt,
    });

    return {
      project: savedProject,
      run: savedProject.generationRuns?.[0] || run,
    };
  },
};

export {
  COURSE_DEPENDENCY_PRESETS,
  COURSE_STRUCTURE_TEMPLATES,
  getCourseStudioStoreEventName,
};
