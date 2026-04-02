import React from 'react';
// 1. Context Provider들을 불러옵니다.
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { ModalProvider, useModalConfig } from './contexts/ModalContext';

// 2. 분리한 페이지와 공통 컴포넌트를 불러옵니다.
import { AuthView, AdminView, TabletView, SupervisorView } from './pages';
import { GlobalModal } from './components';

// 3. 실제 화면이 그려지는 내부 컴포넌트입니다.
const AppContent: React.FC = () => {
  // 인증 정보를 가져와서 어떤 화면을 보여줄지 결정합니다.
  const { session } = useAuth();
  
  // 현재 띄워야 할 글로벌 모달 설정값을 가져옵니다.
  const modalConfig = useModalConfig(); 

  return (
    <>
      {/* 조건부 렌더링: 로그인하지 않은 경우 AuthView를 표시 */}
      {!session ? (
        <AuthView />
      ) : (
        /* 로그인 권한(Role)에 따라 다른 페이지 컴포넌트를 표시 */
        <>
          {session.role === 'supervisor' && <SupervisorView />}
          {session.role === 'admin' && <AdminView />}
          {session.role === 'tablet' && <TabletView />}
        </>
      )}
      
      {/* 모달 설정(modalConfig)이 존재할 때만 GlobalModal을 화면 최상단에 렌더링 */}
      {modalConfig && <GlobalModal config={modalConfig} />}
    </>
  );
};

// 4. 최상위 컴포넌트 (모든 Provider를 순서대로 감싸줍니다)
export default function App() {
  return (
    // ModalProvider: 가장 바깥쪽에서 모달 상태를 제공합니다.
    <ModalProvider>
      {/* AuthProvider: 로그인/세션 정보를 제공합니다. */}
      <AuthProvider>
        {/* StoreProvider: Auth 정보에 기반하여 소켓(DB) 데이터를 가져와 제공합니다. */}
        <StoreProvider>
          {/* 실제 화면 라우팅 로직 */}
          <AppContent />
        </StoreProvider>
      </AuthProvider>
    </ModalProvider>
  );
}