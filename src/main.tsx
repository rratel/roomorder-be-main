import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Tailwind CSS 등의 전역 스타일시트
import App from './App'; // 최상위 App 컴포넌트

// HTML의 id가 'root'인 div 요소에 React 앱을 렌더링합니다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
