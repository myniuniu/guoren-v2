export const DEFAULT_LOGIN_CONFIG = {
  platformName: '通答人工智能教学平台',
  welcomeText: '欢迎来到',
  heroTitle: 'AI原生培训',
  heroSubtitle: 'AI技术驱动的培训，效果更好，体验更智能',
  template: 'ai-training',
  accentColor: '#7047f8',
  defaultMethod: 'phone',
  loginMethods: {
    account: true,
    phone: true,
  },
  captchaEnabled: true,
  agreementRequired: true,
  tenantSelectEnabled: true,
};

export const LOGIN_TEMPLATE_OPTIONS = [
  { value: 'ai-training', label: 'AI 原生培训插画版' },
  { value: 'clean-card', label: '精简卡片版' },
  { value: 'brand-focus', label: '品牌强调版' },
];

export const LOGIN_ACCENT_OPTIONS = [
  { value: '#7047f8', label: '通答紫' },
  { value: '#2563eb', label: '教育蓝' },
  { value: '#0f766e', label: '组织绿' },
  { value: '#f97316', label: '活力橙' },
];

export const LOGIN_METHOD_OPTIONS = [
  { value: 'phone', label: '手机号登录' },
  { value: 'account', label: '账号密码登录' },
];

export const SOLUTION_LOGIN_CONFIG_PRESETS = {
  教师数字素养提升培训方案: {
    platformName: '教师数字素养 AI 培训平台',
    heroTitle: 'AI实训',
    heroSubtitle: '动手实践，掌握 AI 技能，打造未来竞争力',
    template: 'ai-training',
    accentColor: '#7047f8',
    loginMethods: { account: true, phone: true },
    defaultMethod: 'phone',
    captchaEnabled: true,
    tenantSelectEnabled: true,
  },
  区域教研共创解决方案: {
    platformName: '区域教研共创平台',
    heroTitle: 'AI教研共创',
    heroSubtitle: '区域教研、资源共建与教师成长一体化',
    template: 'clean-card',
    accentColor: '#2563eb',
    loginMethods: { account: true, phone: true },
    defaultMethod: 'phone',
    captchaEnabled: true,
    tenantSelectEnabled: true,
  },
  'AI 课程创作中心方案': {
    platformName: 'AI 课程创作中心',
    heroTitle: 'AI课程创作',
    heroSubtitle: '从资源整理到课程生成的一站式创作体验',
    template: 'brand-focus',
    accentColor: '#f97316',
    loginMethods: { account: true, phone: false },
    defaultMethod: 'account',
    captchaEnabled: true,
    tenantSelectEnabled: false,
  },
};

const SOLUTION_LOGIN_CONFIG_STORAGE_KEY = 'gr.solution.login-config.overrides.v1';

function readSolutionLoginConfigOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(SOLUTION_LOGIN_CONFIG_STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveSolutionLoginConfig(solutionName, loginConfig) {
  if (typeof window === 'undefined' || !solutionName) return;
  try {
    const overrides = readSolutionLoginConfigOverrides();
    overrides[solutionName] = createLoginConfig(loginConfig);
    window.localStorage.setItem(SOLUTION_LOGIN_CONFIG_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore prototype persistence failure
  }
}

export function createLoginConfig(overrides = {}) {
  return {
    ...DEFAULT_LOGIN_CONFIG,
    ...overrides,
    loginMethods: {
      ...DEFAULT_LOGIN_CONFIG.loginMethods,
      ...(overrides.loginMethods || {}),
    },
  };
}

export function getSolutionLoginConfig(solutionName) {
  const overrides = readSolutionLoginConfigOverrides();
  return createLoginConfig({
    ...(SOLUTION_LOGIN_CONFIG_PRESETS[solutionName] || {
    platformName: solutionName ? `${solutionName}平台` : DEFAULT_LOGIN_CONFIG.platformName,
    }),
    ...(overrides[solutionName] || {}),
  });
}

export function getLoginConfigFromSolutionNames(solutionNames = []) {
  const [primarySolutionName] = solutionNames;
  return {
    sourceSolutionName: primarySolutionName || '',
    loginConfig: getSolutionLoginConfig(primarySolutionName),
  };
}
