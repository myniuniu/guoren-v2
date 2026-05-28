import { createRoot } from 'react-dom/client';
import EditorView from './Editor.jsx';
import PreviewView from './Preview.jsx';

// 通过 URL 参数选择模式：?mode=editor | preview
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'editor';

function Root() {
  if (mode === 'preview') return <PreviewView />;
  return <EditorView />;
}

createRoot(document.getElementById('root')).render(<Root />);
