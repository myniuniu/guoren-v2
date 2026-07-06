import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import InspireDetailPage from './studyClub/InspireDetailPage.jsx'
import CourseDetailPage from './studyClub/CourseDetailPage.jsx'
import ArticleDetailPage from './studyClub/ArticleDetailPage.jsx'
import ProcessDesignerV2 from './processV2/ProcessDesignerV2.jsx'
import { registerPwa } from './registerPwa.js'

// 简单 hash 路由
const hash = window.location.hash || '';
const isInspireDetail = hash.startsWith('#/inspire-detail/');
const isCourseDetail = hash.startsWith('#/course-detail/');
const isArticleDetail = hash.startsWith('#/article-detail/');
const isProcessV2New = hash === '#/process-v2-new';

function RootPage() {
  if (isInspireDetail) return <InspireDetailPage />;
  if (isCourseDetail) return <CourseDetailPage />;
  if (isArticleDetail) return <ArticleDetailPage />;
  if (isProcessV2New) return <ProcessDesignerV2 record={{ name: '新建流程', key: 'new_process_' + Date.now() }} onClose={() => window.close()} />;
  return <App />;
}

// 说明：不使用 <StrictMode> 包裹。
// 项目集成了 amis-editor (mobx-state-tree)、bpmn-js、reactflow 等多个带内部实例生命周期的第三方设计器，
// StrictMode 在开发期会双重 mount/unmount，导致它们的内部状态树被销毁后仍被异步回调访问。
const container = document.getElementById('root');
createRoot(container).render(<RootPage />)
registerPwa()
