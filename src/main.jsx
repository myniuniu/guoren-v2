import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import InspireDetailPage from './studyClub/InspireDetailPage.jsx'
import CourseDetailPage from './studyClub/CourseDetailPage.jsx'
import ArticleDetailPage from './studyClub/ArticleDetailPage.jsx'
import ProcessDesignerV2 from './processV2/ProcessDesignerV2.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootPage />
  </StrictMode>,
)
