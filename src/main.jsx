import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginPage from './LoginPage.jsx'
import TenantSelectPage from './TenantSelectPage.jsx'
import InspireDetailPage from './studyClub/InspireDetailPage.jsx'
import CourseDetailPage from './studyClub/CourseDetailPage.jsx'
import ArticleDetailPage from './studyClub/ArticleDetailPage.jsx'
import ProcessDesignerV2 from './processV2/ProcessDesignerV2.jsx'
import { registerPwa } from './registerPwa.js'

const LOGIN_STORAGE_KEY = 'gr.login.prototype.authenticated';
const TENANT_STORAGE_KEY = 'gr.login.prototype.tenant';

function readLoginState() {
  try {
    return window.localStorage.getItem(LOGIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readSelectedTenant() {
  try {
    const stored = window.localStorage.getItem(TENANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function RootPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => readLoginState());
  const [selectedTenant, setSelectedTenant] = useState(() => readSelectedTenant());
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '');
  const isInspireDetail = currentHash.startsWith('#/inspire-detail/');
  const isCourseDetail = currentHash.startsWith('#/course-detail/');
  const isArticleDetail = currentHash.startsWith('#/article-detail/');
  const isProcessV2New = currentHash === '#/process-v2-new';
  const isLoginPage = currentHash === '#/login';

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLogin = () => {
    try {
      window.localStorage.setItem(LOGIN_STORAGE_KEY, 'true');
      window.localStorage.removeItem(TENANT_STORAGE_KEY);
    } catch {
      // ignore prototype persistence failure
    }
    setIsAuthenticated(true);
    setSelectedTenant(null);
    if (window.location.hash === '#/login') {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
      setCurrentHash('');
    }
  };

  const handleSelectTenant = (tenant) => {
    try {
      window.localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    } catch {
      // ignore prototype persistence failure
    }
    setSelectedTenant(tenant);
  };

  const handleBackToLogin = () => {
    try {
      window.localStorage.removeItem(LOGIN_STORAGE_KEY);
      window.localStorage.removeItem(TENANT_STORAGE_KEY);
    } catch {
      // ignore prototype persistence failure
    }
    setIsAuthenticated(false);
    setSelectedTenant(null);
    window.location.hash = '/login';
    setCurrentHash('#/login');
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LOGIN_STORAGE_KEY);
      window.localStorage.removeItem(TENANT_STORAGE_KEY);
    } catch {
      // ignore prototype persistence failure
    }
    setIsAuthenticated(false);
    setSelectedTenant(null);
    window.location.hash = '/login';
    setCurrentHash('#/login');
  };

  if (isLoginPage || !isAuthenticated) return <LoginPage onLogin={handleLogin} />;
  if (!selectedTenant) return <TenantSelectPage onBack={handleBackToLogin} onSelectTenant={handleSelectTenant} />;
  if (isInspireDetail) return <InspireDetailPage />;
  if (isCourseDetail) return <CourseDetailPage />;
  if (isArticleDetail) return <ArticleDetailPage />;
  if (isProcessV2New) return <ProcessDesignerV2 record={{ name: '新建流程', key: 'new_process_' + Date.now() }} onClose={() => window.close()} />;
  return <App onLogout={handleLogout} />;
}

// 说明：不使用 <StrictMode> 包裹。
// 项目集成了 amis-editor (mobx-state-tree)、bpmn-js、reactflow 等多个带内部实例生命周期的第三方设计器，
// StrictMode 在开发期会双重 mount/unmount，导致它们的内部状态树被销毁后仍被异步回调访问。
const container = document.getElementById('root');
createRoot(container).render(<RootPage />)
registerPwa()
