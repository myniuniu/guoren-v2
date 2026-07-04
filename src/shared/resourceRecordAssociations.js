export const TEACHING_RESOURCE_TAG_IDS = new Set([
  'tag_p_courseware',
  'tag_p_teaching_plan',
  'tag_p_teaching_aid',
  'tag_p_activity',
  'tag_p_assignment',
]);

export const STUDY_RESOURCE_TAG_IDS = new Set([
  'tag_p_assessment',
  'tag_p_video',
  'tag_p_experiment',
]);

export const RESEARCH_RESOURCE_TAG_IDS = new Set([
  'tag_p_case',
]);

export const ARCHIVE_LIBRARY_IDS = new Set(['org_default']);

export const RESOURCE_ASSOCIATION_RULES = [
  {
    id: 'classroom_transcript',
    bundleKey: 'classroom_observation',
    sourceKey: 'teaching',
    keywords: ['课堂实录', '课堂回看', '课堂录像', '课堂录播', '教学实录', '课堂观察'],
    fileTypes: ['video', 'audio', 'note', 'pdf', 'docx'],
    recordTag: '课堂实录',
    dimensionNames: ['课堂实施', '专业发展'],
    itemNames: ['互动引导', '课堂调控', '教学反思'],
    matchNote: '该资料属于课堂实录或课堂观察材料，优先用于支撑课堂实施与课后反思判断。',
    nextAction: '建议继续补充课堂片段标注、互动节奏记录和复盘纪要，形成连续课堂观察链路。',
  },
  {
    id: 'ai_class_eval',
    bundleKey: 'ai_class_evaluation',
    sourceKey: 'teaching',
    keywords: ['ai课堂评价', '课堂评价报告', '课堂评价分析', '课堂诊断报告', '课堂观察报告', '智能课堂评价'],
    fileTypes: ['pdf', 'docx', 'xlsx', 'note'],
    recordTag: 'AI课堂评价报告',
    dimensionNames: ['学习评价', '课堂实施'],
    itemNames: ['形成性反馈', '评价数据应用', '互动引导', '课堂调控'],
    matchNote: '该资料属于 AI 课堂评价或课堂诊断报告，可直接支撑课堂反馈与评价数据应用判断。',
    nextAction: '建议把 AI 评价报告中的改进建议与后续课堂调整结果做前后对照，形成闭环记录。',
  },
  {
    id: 'study_hour_certificate',
    bundleKey: 'study_hour_certificate',
    sourceKey: 'study',
    keywords: ['学时证明', '培训学时', '培训证书', '结业证书', '继续教育证书'],
    fileTypes: ['pdf', 'image', 'docx', 'note'],
    recordTag: '学时证明',
    dimensionNames: ['专业发展'],
    itemNames: ['培训研修', '成果认证'],
    matchNote: '该资料属于培训学时证明或结业证书，优先作为培训研修来源材料进入个人档案。',
    nextAction: '建议继续补充培训通知、签到记录、学习任务与考核结果，形成完整的研修证据链。',
  },
];

export function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

export function matchNamePattern(left, right) {
  const normalizedLeft = normalizeKeyword(left);
  const normalizedRight = normalizeKeyword(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight
    || normalizedLeft.includes(normalizedRight)
    || normalizedRight.includes(normalizedLeft);
}

export function buildResourceSearchText(item) {
  return [
    item?.name,
    item?.contentText,
    item?.summary,
    item?.description,
    item?.comment,
    item?.transcript,
    item?.text,
    item?.libraryName,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function findResourceAssociationRule(item, options = {}) {
  const { ignoreFileType = false } = options;
  const searchText = buildResourceSearchText(item);
  return RESOURCE_ASSOCIATION_RULES.find((rule) => {
    if (!ignoreFileType && Array.isArray(rule.fileTypes) && rule.fileTypes.length > 0 && !rule.fileTypes.includes(item?.fileType)) {
      return false;
    }
    return (rule.keywords || []).some((keyword) => searchText.includes(normalizeKeyword(keyword)));
  }) || null;
}

export function findRecordAssociationRule(record) {
  if (!record) return null;
  const candidate = {
    fileType: record.fileType,
    name: record.title || record.name || '',
    contentText: [
      record.tag,
      record.summary,
      record.evidenceExcerpt,
      record.matchNote,
      record.nextAction,
    ].filter(Boolean).join(' '),
    libraryName: record.sourceLabel || '',
  };
  return findResourceAssociationRule(candidate, {
    ignoreFileType: !candidate.fileType,
  });
}

export function inferResourceSourceKey(item) {
  const associationRule = findResourceAssociationRule(item);
  if (associationRule?.sourceKey) {
    return associationRule.sourceKey;
  }
  if (item?.libraryScope === 'organization') {
    return ARCHIVE_LIBRARY_IDS.has(item.libraryId) ? 'archive' : 'research';
  }
  const tagSet = new Set(item?.tags || []);
  if ([...tagSet].some((tagId) => TEACHING_RESOURCE_TAG_IDS.has(tagId))) return 'teaching';
  if ([...tagSet].some((tagId) => STUDY_RESOURCE_TAG_IDS.has(tagId))) return 'study';
  if ([...tagSet].some((tagId) => RESEARCH_RESOURCE_TAG_IDS.has(tagId))) return 'research';
  return 'teaching';
}
